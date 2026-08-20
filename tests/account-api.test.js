const test = require('node:test');
const assert = require('node:assert/strict');

const { createAccountApi } = require('../exam/account-api.js');

test('登入 adapter 只在登入請求傳送身分證並回傳 JSON', async () => {
    let captured;
    const api = createAccountApi({
        endpoint: 'https://example.test/account',
        fetchImpl: async (url, options) => {
            captured = { url, options };
            return { ok: true, json: async () => ({ success: true, authorized_certs: '*' }) };
        }
    });

    const response = await api.login({ nationalId: 'A123456789', userAgent: 'test-agent' });
    const body = JSON.parse(captured.options.body);
    assert.equal(captured.url, 'https://example.test/account');
    assert.equal(body.action, 'login');
    assert.equal(body.national_id, 'A123456789');
    assert.equal(body.user_agent, 'test-agent');
    assert.equal(response.success, true);
});

test('同步 adapter 只接受後端明確確認的 operation_id，未回覆者維持待同步', async () => {
    let capturedBody;
    const api = createAccountApi({
        endpoint: 'https://example.test/account',
        fetchImpl: async (_url, options) => {
            capturedBody = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({ success: true, accepted_operation_ids: ['op_accepted'] })
            };
        }
    });
    const session = {
        mode: 'account',
        sessionToken: 'session-token-value',
        syncEnabled: true,
        syncEndpoint: 'https://example.test/sync'
    };

    const result = await api.pushOperations(session, [
        {
            id: 'local-row-id',
            operationId: 'op_accepted',
            userId: 'usr_01JABCDEF1234567',
            deviceId: 'dev_01JABCDEF1234567',
            type: 'question_state_changed',
            payload: { question_uid: 'ai-abc123' },
            createdAt: '2026-08-20T10:00:00.000Z',
            status: 'pending',
            attempts: 3,
            lastError: 'local only'
        },
        { operationId: 'op_pending' }
    ]);
    assert.deepEqual(result, { acceptedIds: ['op_accepted'], rejectedIds: [] });
    assert.deepEqual(capturedBody.operations[0], {
        operationId: 'op_accepted',
        userId: 'usr_01JABCDEF1234567',
        deviceId: 'dev_01JABCDEF1234567',
        type: 'question_state_changed',
        payload: { question_uid: 'ai-abc123' },
        createdAt: '2026-08-20T10:00:00.000Z'
    });
});

test('只有後端明確列出的 operation_id 才標記為衝突', async () => {
    const api = createAccountApi({
        endpoint: 'https://example.test/account',
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({
                success: true,
                accepted_operation_ids: [],
                rejected_operation_ids: ['op_rejected']
            })
        })
    });
    const result = await api.pushOperations({
        mode: 'account',
        sessionToken: 'session-token-value',
        syncEnabled: true,
        syncEndpoint: 'https://example.test/sync'
    }, [
        { operationId: 'op_rejected' },
        { operationId: 'op_pending' }
    ]);

    assert.deepEqual(result, { acceptedIds: [], rejectedIds: ['op_rejected'] });
});

test('未啟用同步契約時不會發出網路請求', async () => {
    let called = false;
    const api = createAccountApi({
        endpoint: 'https://example.test/account',
        fetchImpl: async () => { called = true; }
    });

    await assert.rejects(() => api.pushOperations({ mode: 'local-only' }, []), /not enabled/);
    assert.equal(called, false);
});

test('後端未逐筆確認時操作必須留在 outbox', async () => {
    const api = createAccountApi({
        endpoint: 'https://example.test/account',
        fetchImpl: async () => ({ ok: true, json: async () => ({ success: true }) })
    });
    await assert.rejects(() => api.pushOperations({
        mode: 'account',
        sessionToken: 'session-token-value',
        syncEnabled: true,
        syncEndpoint: 'https://example.test/sync'
    }, [{ operationId: 'op_pending' }]), /explicitly acknowledge/);
});
