const test = require('node:test');
const assert = require('node:assert/strict');

const {
    parseLoginCapability,
    isSessionExpired,
    getAccountQuestionStateId,
    applyQuestionStateEvent,
    buildSyncOperation
} = require('../exam/account-core.js');

test('正式帳戶工作階段只接受不透明 user_id 與短效 token', () => {
    const session = parseLoginCapability({
        success: true,
        user_id: 'usr_01JABCDEF1234567',
        session_token: 'session-token-value',
        session_expires_at: '2026-08-20T12:00:00.000Z',
        sync: { enabled: true, endpoint: 'https://example.test/sync' },
        national_id: 'A123456789'
    });

    assert.deepEqual(session, {
        mode: 'account',
        userId: 'usr_01JABCDEF1234567',
        sessionToken: 'session-token-value',
        expiresAt: '2026-08-20T12:00:00.000Z',
        syncEnabled: true,
        syncEndpoint: 'https://example.test/sync'
    });
    assert.equal('national_id' in session, false);
    assert.equal('nationalId' in session, false);
});

test('舊後端缺少帳戶契約時明確降級為本機模式', () => {
    assert.deepEqual(parseLoginCapability({ success: true, authorized_certs: '*' }), {
        mode: 'local-only',
        userId: null,
        sessionToken: null,
        expiresAt: null,
        syncEnabled: false,
        syncEndpoint: '',
        reason: 'backend-account-contract-missing'
    });
});

test('身分證格式不得被當成 user_id', () => {
    assert.equal(parseLoginCapability({
        success: true,
        user_id: 'A123456789',
        session_token: 'session-token-value'
    }).mode, 'local-only');
});

test('短效 session 到期後不得繼續同步', () => {
    const session = parseLoginCapability({
        success: true,
        user_id: 'usr_01JABCDEF1234567',
        session_token: 'session-token-value',
        session_expires_at: '2026-08-20T12:00:00.000Z',
        sync: { enabled: true, endpoint: 'https://example.test/sync' }
    });
    assert.equal(isSessionExpired(session, Date.parse('2026-08-20T11:59:59.000Z')), false);
    assert.equal(isSessionExpired(session, Date.parse('2026-08-20T12:00:00.000Z')), true);

    const noExpiry = parseLoginCapability({
        success: true,
        user_id: 'usr_01JABCDEF1234567',
        session_token: 'session-token-value',
        sync: { enabled: true, endpoint: 'https://example.test/sync' }
    });
    assert.equal(noExpiry.syncEnabled, false);
});

test('帳戶題目狀態鍵同時包含帳戶、證照與永久題號', () => {
    assert.equal(
        getAccountQuestionStateId('usr_01JABCDEF1234567', 'ai', 'ai-abc123'),
        'usr_01JABCDEF1234567|ai|ai-abc123'
    );
    assert.notEqual(
        getAccountQuestionStateId('usr_01JABCDEF1234567', 'ai', 'ai-abc123'),
        getAccountQuestionStateId('usr_01JOTHERUSER12345', 'ai', 'ai-abc123')
    );
    assert.throws(() => getAccountQuestionStateId('', 'ai', 'ai-abc123'), /userId/);
});

test('題目事件可更新答題計數與明確標記狀態', () => {
    const answered = applyQuestionStateEvent(null, {
        type: 'answer',
        isCorrect: false,
        occurredAt: '2026-08-20T10:00:00.000Z'
    });
    const flagged = applyQuestionStateEvent(answered, {
        type: 'flag',
        flagged: true,
        occurredAt: '2026-08-20T10:01:00.000Z'
    });

    assert.equal(flagged.correctCount, 0);
    assert.equal(flagged.wrongCount, 1);
    assert.equal(flagged.lastResult, 'wrong');
    assert.equal(flagged.flagged, true);
    assert.equal(flagged.revision, 2);
    assert.equal(flagged.updatedAt, '2026-08-20T10:01:00.000Z');
});

test('同步操作使用呼叫端 operation_id 去重且拒絕敏感資料', () => {
    const operation = buildSyncOperation({
        operationId: 'op_01JABCDEF1234567',
        userId: 'usr_01JABCDEF1234567',
        deviceId: 'dev_01JABCDEF1234567',
        type: 'question_state_changed',
        payload: { question_uid: 'ai-abc123', flagged: true },
        createdAt: '2026-08-20T10:01:00.000Z'
    });

    assert.equal(operation.id, 'op_01JABCDEF1234567');
    assert.equal(operation.status, 'pending');
    assert.equal(operation.attempts, 0);
    assert.throws(() => buildSyncOperation({
        operationId: 'op_01JABCDEF1234568',
        userId: 'usr_01JABCDEF1234567',
        deviceId: 'dev_01JABCDEF1234567',
        type: 'question_state_changed',
        payload: { profile: { national_id: 'A123456789' } },
        createdAt: '2026-08-20T10:01:00.000Z'
    }), /sensitive/i);
});
