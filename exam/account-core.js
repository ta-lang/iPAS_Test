(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ExamAccountCore = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const SENSITIVE_KEYS = new Set([
        'nationalid',
        'national_id',
        'sessiontoken',
        'session_token',
        'authorization',
        'password'
    ]);

    function localOnlySession() {
        return {
            mode: 'local-only',
            userId: null,
            sessionToken: null,
            expiresAt: null,
            syncEnabled: false,
            syncEndpoint: '',
            reason: 'backend-account-contract-missing'
        };
    }

    function isOpaqueUserId(value) {
        const userId = String(value || '').trim();
        return /^[A-Za-z0-9_-]{8,128}$/.test(userId) && !/^[A-Z][12]\d{8}$/i.test(userId);
    }

    function parseLoginCapability(response) {
        const userId = String(response?.user_id || '').trim();
        const sessionToken = String(response?.session_token || '').trim();
        if (!response?.success || !isOpaqueUserId(userId) || sessionToken.length < 8) {
            return localOnlySession();
        }

        const expiresAt = response.session_expires_at || null;
        const syncEndpoint = String(response?.sync?.endpoint || '').trim();
        const syncEnabled = response?.sync?.enabled === true &&
            /^https:\/\//i.test(syncEndpoint) &&
            Number.isFinite(Date.parse(expiresAt));
        return {
            mode: 'account',
            userId,
            sessionToken,
            expiresAt,
            syncEnabled,
            syncEndpoint: syncEnabled ? syncEndpoint : ''
        };
    }

    function isSessionExpired(session, nowMs = Date.now()) {
        if (session?.mode !== 'account') return true;
        const expiresAtMs = Date.parse(session.expiresAt);
        return !Number.isFinite(expiresAtMs) || expiresAtMs <= Number(nowMs);
    }

    function requirePart(value, name) {
        const normalized = String(value || '').trim();
        if (!normalized) throw new Error(`${name} is required`);
        if (normalized.includes('|')) throw new Error(`${name} contains an invalid separator`);
        return normalized;
    }

    function getAccountQuestionStateId(userId, certId, questionUid) {
        return [
            requirePart(userId, 'userId'),
            requirePart(certId, 'certId'),
            requirePart(questionUid, 'questionUid')
        ].join('|');
    }

    function applyQuestionStateEvent(currentState, event) {
        const state = {
            flagged: false,
            correctCount: 0,
            wrongCount: 0,
            lastResult: null,
            revision: 0,
            updatedAt: null,
            ...(currentState || {})
        };
        const occurredAt = String(event?.occurredAt || '').trim();
        if (!occurredAt) throw new Error('occurredAt is required');

        if (event.type === 'answer') {
            if (typeof event.isCorrect !== 'boolean') throw new Error('isCorrect must be boolean');
            if (event.isCorrect) state.correctCount++;
            else state.wrongCount++;
            state.lastResult = event.isCorrect ? 'correct' : 'wrong';
        } else if (event.type === 'flag') {
            if (typeof event.flagged !== 'boolean') throw new Error('flagged must be boolean');
            state.flagged = event.flagged;
        } else {
            throw new Error(`unsupported question state event: ${event?.type || ''}`);
        }

        state.revision++;
        state.updatedAt = occurredAt;
        return state;
    }

    function assertNoSensitiveData(value, path = 'payload') {
        if (!value || typeof value !== 'object') return;
        for (const [key, nested] of Object.entries(value)) {
            const normalizedKey = key.replace(/[-\s]/g, '').toLowerCase();
            if (SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(normalizedKey)) {
                throw new Error(`sensitive field is not allowed in ${path}.${key}`);
            }
            assertNoSensitiveData(nested, `${path}.${key}`);
        }
    }

    function buildSyncOperation({ operationId, userId, deviceId, type, payload, createdAt }) {
        const id = requirePart(operationId, 'operationId');
        const owner = requirePart(userId, 'userId');
        const device = requirePart(deviceId, 'deviceId');
        const operationType = requirePart(type, 'type');
        const timestamp = String(createdAt || '').trim();
        if (!timestamp) throw new Error('createdAt is required');
        assertNoSensitiveData(payload);

        return {
            id,
            operationId: id,
            userId: owner,
            deviceId: device,
            type: operationType,
            payload: JSON.parse(JSON.stringify(payload || {})),
            createdAt: timestamp,
            status: 'pending',
            attempts: 0,
            lastError: null
        };
    }

    return {
        parseLoginCapability,
        isSessionExpired,
        getAccountQuestionStateId,
        applyQuestionStateEvent,
        buildSyncOperation
    };
}));
