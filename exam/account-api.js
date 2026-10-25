(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ExamAccountApi = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function requireHttpsEndpoint(value, name) {
        const endpoint = String(value || '').trim();
        if (!/^https:\/\//i.test(endpoint)) throw new Error(`${name} must use HTTPS`);
        return endpoint;
    }

    function createAccountApi({ endpoint, fetchImpl = globalThis.fetch, timeoutMs = 10000 }) {
        const loginEndpoint = requireHttpsEndpoint(endpoint, 'endpoint');
        if (typeof fetchImpl !== 'function') throw new Error('fetchImpl is required');

        async function postJson(url, body) {
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
            try {
                const response = await fetchImpl(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(body),
                    ...(controller ? { signal: controller.signal } : {})
                });
                if (!response?.ok) throw new Error(`account API HTTP ${response?.status || 'error'}`);
                return await response.json();
            } finally {
                if (timeout) clearTimeout(timeout);
            }
        }

        async function login({ nationalId, userAgent }) {
            return postJson(loginEndpoint, {
                action: 'login',
                national_id: String(nationalId || '').trim().toUpperCase(),
                user_agent: String(userAgent || '')
            });
        }

        async function pushOperations(session, operations) {
            if (session?.mode !== 'account' || !session.syncEnabled || !session.syncEndpoint) {
                throw new Error('account sync is not enabled');
            }
            const syncEndpoint = requireHttpsEndpoint(session.syncEndpoint, 'syncEndpoint');
            const requestedIds = (operations || []).map(operation => operation.operationId);
            const outboundOperations = (operations || []).map(operation => ({
                operationId: operation.operationId,
                userId: operation.userId,
                deviceId: operation.deviceId,
                type: operation.type,
                payload: operation.payload,
                createdAt: operation.createdAt
            }));
            const response = await postJson(syncEndpoint, {
                action: 'sync',
                session_token: session.sessionToken,
                operations: outboundOperations
            });
            if (!response?.success || !Array.isArray(response.accepted_operation_ids)) {
                throw new Error('sync response did not explicitly acknowledge operations');
            }
            const acceptedSet = new Set(response.accepted_operation_ids);
            const rejectedSet = new Set(Array.isArray(response.rejected_operation_ids)
                ? response.rejected_operation_ids
                : []);
            return {
                acceptedIds: requestedIds.filter(id => acceptedSet.has(id)),
                rejectedIds: requestedIds.filter(id => !acceptedSet.has(id) && rejectedSet.has(id))
            };
        }

        return { login, pushOperations };
    }

    return { createAccountApi };
}));
