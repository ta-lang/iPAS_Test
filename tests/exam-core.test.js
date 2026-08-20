const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildQuizResult,
    claimOnce,
    getTimerSnapshot
} = require('../exam/core.js');

const subjects = [
    { id: 's1', name: '科目一', matchKeywords: ['人工智慧'] },
    { id: 's2', name: '科目二', matchKeywords: ['生成式 AI'] }
];

const questions = [
    { num: 1, subject: '人工智慧基礎概論', answer: 'A' },
    { num: 2, subject: '生成式 AI 應用與規劃', answer: 'C' },
    { num: 3, subject: '人工智慧基礎概論', answer: 'B' }
];

test('buildQuizResult 在持久化前產生完整且一致的結果', () => {
    const result = buildQuizResult({
        questions,
        userAnswers: { 0: 0, 1: 1 },
        subjects
    });

    assert.equal(result.total, 3);
    assert.equal(result.correctCount, 1);
    assert.equal(result.score, 33);
    assert.equal(result.passed, false);
    assert.equal(result.answeredCount, 2);
    assert.equal(result.answerRate, 67);
    assert.deepEqual(result.gradedResults, ['correct', 'wrong', 'wrong']);
    assert.deepEqual(result.wrongQuestionIndexes, [1, 2]);
    assert.deepEqual(result.subjectStats, {
        s1: { name: '科目一', total: 2, correct: 1 },
        s2: { name: '科目二', total: 1, correct: 0 }
    });
});

test('buildQuizResult 可安全處理空題組', () => {
    const result = buildQuizResult({ questions: [], userAnswers: {}, subjects });

    assert.equal(result.total, 0);
    assert.equal(result.score, 0);
    assert.equal(result.answerRate, 0);
    assert.equal(result.passed, false);
});

test('buildQuizResult 忽略題組範圍外的異常作答索引', () => {
    const result = buildQuizResult({
        questions: [questions[0]],
        userAnswers: { 0: 0, 99: 0 },
        subjects
    });

    assert.equal(result.answeredCount, 1);
    assert.equal(result.answerRate, 100);
});

test('claimOnce 對同一作答事件只允許第一次持久化', () => {
    const committed = Object.create(null);

    assert.equal(claimOnce(committed, 'practice:0'), true);
    assert.equal(claimOnce(committed, 'practice:0'), false);
    assert.equal(claimOnce(committed, 'practice:1'), true);
});

test('getTimerSnapshot 依牆鐘時間補償背景分頁節流', () => {
    const startedAt = 1_000_000;
    const snapshot = getTimerSnapshot(startedAt, 75 * 60, startedAt + 61_400);

    assert.equal(snapshot.timeSpent, 61);
    assert.equal(snapshot.timeRemaining, 4439);
    assert.equal(snapshot.expired, false);
});

test('getTimerSnapshot 到期後將數值固定在有效範圍', () => {
    const snapshot = getTimerSnapshot(10_000, 10, 25_500);

    assert.equal(snapshot.timeSpent, 10);
    assert.equal(snapshot.timeRemaining, 0);
    assert.equal(snapshot.expired, true);
});

test('getTimerSnapshot 對無效時間輸入安全降級', () => {
    const snapshot = getTimerSnapshot('invalid', 60, 20_000);

    assert.equal(snapshot.timeSpent, 0);
    assert.equal(snapshot.timeRemaining, 60);
    assert.equal(snapshot.expired, false);
});
