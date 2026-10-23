const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildQuizResult,
    buildRadarAxisStats,
    claimOnce,
    filterPracticeQuestions,
    formatQuestionText,
    formatStandardAnswerHeader,
    formatTopicLabel,
    getQuestionKey,
    getQuestionStorageId,
    getTimerSnapshot,
    resolveLegacyQuestion,
    restoreActiveQuiz,
    restoreActiveSession,
    sampleExamQuestions,
    serializeActiveQuiz,
    serializeActiveSession,
    stripOptionPrefix
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

test('getQuestionStorageId 只接受永久 question_uid', () => {
    assert.equal(
        getQuestionStorageId('ai', { question_uid: 'ai-abc123', num: 1 }),
        'ai_ai-abc123'
    );
    assert.throws(
        () => getQuestionStorageId('ai', { num: 1 }),
        /question_uid/
    );
});

test('resolveLegacyQuestion 在題號唯一時安全對應', () => {
    const result = resolveLegacyQuestion(
        { certId: 'ai', num: 8 },
        [{ question_uid: 'ai-one', display_num: 8, subject: '科目一', chapter: '章一', question: '題目' }]
    );

    assert.deepEqual(result, { status: 'resolved', question_uid: 'ai-one' });
});

test('resolveLegacyQuestion 用舊題目內容消歧義重複題號', () => {
    const result = resolveLegacyQuestion(
        { certId: 'ai', num: 1, subject: '科目二', chapter: '章二', question: '第二題' },
        [
            { question_uid: 'ai-first', display_num: 1, subject: '科目一', chapter: '章一', question: '第一題' },
            { question_uid: 'ai-second', display_num: 1, subject: '科目二', chapter: '章二', question: '第二題' }
        ]
    );

    assert.deepEqual(result, { status: 'resolved', question_uid: 'ai-second' });
});

test('resolveLegacyQuestion 不猜測無內容可消歧義的重複題號', () => {
    const result = resolveLegacyQuestion(
        { certId: 'ai', num: 1 },
        [
            { question_uid: 'ai-first', display_num: 1, subject: '科目一', chapter: '章一', question: '第一題' },
            { question_uid: 'ai-second', display_num: 1, subject: '科目二', chapter: '章二', question: '第二題' }
        ]
    );

    assert.deepEqual(result, {
        status: 'ambiguous',
        candidate_uids: ['ai-first', 'ai-second']
    });
});

test('stripOptionPrefix 移除重複選項前綴但保留複選代碼組合', () => {
    assert.equal(stripOptionPrefix('(A) 第一個選項', 'A'), '第一個選項');
    assert.equal(stripOptionPrefix(' (b) 第二個選項', 'B'), '第二個選項');
    assert.equal(stripOptionPrefix('C. 第三個選項', 'C'), '第三個選項');
    assert.equal(stripOptionPrefix('D、第四個選項', 'D'), '第四個選項');
    assert.equal(stripOptionPrefix('A) 括號前綴', 'A'), '括號前綴');
    // 保留題庫中「B、C、F」或「A、B、C、D；」這類複選組合答案
    assert.equal(stripOptionPrefix('B、C、F', 'A'), 'B、C、F');
    assert.equal(stripOptionPrefix('A、B、C、D；', 'B'), 'A、B、C、D；');
    assert.equal(stripOptionPrefix('無前綴文字', 'A'), '無前綴文字');
});

test('formatStandardAnswerHeader 去重標準答案標頭並處理空值', () => {
    assert.equal(formatStandardAnswerHeader('A', ''), '標準答案：(A)');
    assert.equal(formatStandardAnswerHeader('B', '標準答案：(B)'), '標準答案：(B)');
    assert.equal(formatStandardAnswerHeader('C', '標準答案: (C) 決策樹'), '標準答案：(C) 決策樹');
    assert.equal(formatStandardAnswerHeader('C', '標準答案：(C) 隨機森林'), '標準答案：(C) 隨機森林');
    assert.equal(formatStandardAnswerHeader('D', '(D) 支援向量機'), '標準答案：(D) 支援向量機');
    assert.equal(formatStandardAnswerHeader('A', '交叉驗證'), '標準答案：(A) 交叉驗證');
});

test('formatQuestionText 轉譯 Markdown 表格、保護 LaTeX 公式並防止 XSS', () => {
    const tableAndMath = [
        '【背景說明】公式 $G = 1 - \\sum_{i=1}^k p_i^2$ 與區塊 $$Z = \\frac{X - \\mu}{\\sigma}$$',
        '| 指標 | 導入前 | 導入後 |',
        '| :--- | :---: | ---: |',
        '| AUC | 0.80 | **0.91** |',
        '<script>alert(1)</script>'
    ].join('\n');

    const html = formatQuestionText(tableAndMath);
    assert.match(html, /<table class="md-table">/);
    assert.match(html, /<th style="text-align:left">指標<\/th>/);
    assert.match(html, /<th style="text-align:center">導入前<\/th>/);
    assert.match(html, /<th style="text-align:right">導入後<\/th>/);
    assert.match(html, /<strong>0\.91<\/strong>/);
    // 確保 LaTeX 下標與星號未被當成斜體破壞
    assert.ok(html.includes('$G = 1 - \\sum_{i=1}^k p_i^2$'));
    assert.ok(html.includes('$$Z = \\frac{X - \\mu}{\\sigma}$$'));
    // 確保 HTML 注入已被跳脫
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('sampleExamQuestions 支援依評鑑主題均勻配題、排除歷屆試題與章節比例抽題', () => {
    const pool = [];
    // 100 題歷屆試題 (2 份各 50 題)
    for (let i = 1; i <= 50; i++) {
        pool.push({ question_uid: `past1-${i}`, chapter: '114年第二次歷屆考題', assessmentTopic: '歷屆' });
        pool.push({ question_uid: `past2-${i}`, chapter: '115年第一次歷屆考題', assessmentTopic: '歷屆' });
    }
    // 13 題範例與 L211, L212, L213 各 20 題 (共 73 題非歷屆)
    for (let i = 1; i <= 13; i++) {
        pool.push({ question_uid: `sample-${i}`, chapter: '官方樣題範例', assessmentTopic: '範例' });
    }
    for (const topic of ['L211', 'L212', 'L213']) {
        for (let i = 1; i <= 20; i++) {
            pool.push({ question_uid: `${topic}-${i}`, chapter: `章節_${topic}`, assessmentTopic: topic });
        }
    }

    const identityShuffle = (arr) => [...arr];

    // 1. 預設 balanced_topic：5 個主題桶 (歷屆, 範例, L211, L212, L213) 均勻分配 50 題 -> 每桶剛好 10 題
    const balanced = sampleExamQuestions(pool, 50, {
        strategy: 'balanced_topic',
        excludePastExams: false,
        shuffleFn: identityShuffle
    });
    assert.equal(balanced.length, 50);
    const countByTopic = {};
    balanced.forEach(q => {
        countByTopic[q.assessmentTopic] = (countByTopic[q.assessmentTopic] || 0) + 1;
    });
    assert.deepEqual(countByTopic, {
        '歷屆': 10,
        '範例': 10,
        L211: 10,
        L212: 10,
        L213: 10
    });

    // 2. 排除歷屆試題 + balanced_topic：從 73 題非歷屆 (範例 13, L211 20, L212 20, L213 20) 抽 50 題
    const noPast = sampleExamQuestions(pool, 50, {
        strategy: 'balanced_topic',
        excludePastExams: true,
        shuffleFn: identityShuffle
    });
    assert.equal(noPast.length, 50);
    assert.equal(noPast.some(q => q.chapter.includes('歷屆')), false);
    const noPastCounts = {};
    noPast.forEach(q => {
        noPastCounts[q.assessmentTopic] = (noPastCounts[q.assessmentTopic] || 0) + 1;
    });
    // 4 桶均分 50 題 -> 12~13 題
    assert.ok(noPastCounts['範例'] >= 12 && noPastCounts['範例'] <= 13);
    assert.ok(noPastCounts.L211 >= 12 && noPastCounts.L211 <= 13);
    assert.ok(noPastCounts.L212 >= 12 && noPastCounts.L212 <= 13);
    assert.ok(noPastCounts.L213 >= 12 && noPastCounts.L213 <= 13);

    // 3. 無 assessmentTopic 時自動退回以 chapter 均勻配題
    const noTopicPool = [
        ...Array.from({ length: 30 }, (_, i) => ({ question_uid: `c1-${i}`, chapter: '第一章' })),
        ...Array.from({ length: 10 }, (_, i) => ({ question_uid: `c2-${i}`, chapter: '第二章' }))
    ];
    const fallbackSample = sampleExamQuestions(noTopicPool, 20, {
        strategy: 'balanced_topic',
        shuffleFn: identityShuffle
    });
    assert.equal(fallbackSample.length, 20);
    assert.equal(fallbackSample.filter(q => q.chapter === '第一章').length, 10);
    assert.equal(fallbackSample.filter(q => q.chapter === '第二章').length, 10);
});

test('filterPracticeQuestions 支援評鑑主題、錯題到期/全部模式與未作答新題篩選', () => {
    const practicePool = [
        { question_uid: 'q1', subject: 'L21 人工智慧技術應用與規劃', assessmentTopic: 'L211', chapter: '第三章 AI 相關技術應用' },
        { question_uid: 'q2', subject: 'L21 人工智慧技術應用與規劃', assessmentTopic: 'L212', chapter: '第四章 AI 導入評估規劃' },
        { question_uid: 'q3', subject: 'L22 大數據處理分析與應用', assessmentTopic: 'L221', chapter: '第三章 機率統計基礎' }
    ];
    const modSubjects = [
        { id: 's1', name: 'L21', matchKeywords: ['L21'] },
        { id: 's2', name: 'L22', matchKeywords: ['L22'] }
    ];
    const wrongPool = [
        { question_uid: 'q1', subject: 'L21 人工智慧技術應用與規劃', assessmentTopic: 'L211', chapter: '第三章 AI 相關技術應用', nextReviewDate: '2026-10-20' },
        { question_uid: 'q2', subject: 'L21 人工智慧技術應用與規劃', assessmentTopic: 'L212', chapter: '第四章 AI 導入評估規劃', nextReviewDate: '2099-12-31' }
    ];
    const questionStats = [
        { question_uid: 'q1', correct: 0, wrong: 1 },
        { question_uid: 'q2', correct: 1, wrong: 1 }
    ];

    // 1. 依評鑑主題篩選
    const byTopic = filterPracticeQuestions({
        questions: practicePool,
        subjects: modSubjects,
        subjectId: 's1',
        topic: 'L212'
    });
    assert.deepEqual(byTopic.map(q => q.question_uid), ['q2']);

    // 2. 僅測驗未作答過的新題
    const unanswered = filterPracticeQuestions({
        questions: practicePool,
        questionStats,
        subjects: modSubjects,
        unansweredOnly: true
    });
    assert.deepEqual(unanswered.map(q => q.question_uid), ['q3']);

    // 3. 錯題特訓：due 模式 (只取 <= today) vs all 模式 (不限到期日)
    const dueWrong = filterPracticeQuestions({
        questions: practicePool,
        wrongPool,
        subjects: modSubjects,
        isWrongBook: true,
        wrongMode: 'due',
        today: '2026-10-23'
    });
    assert.deepEqual(dueWrong.map(q => q.question_uid), ['q1']);

    const allWrong = filterPracticeQuestions({
        questions: practicePool,
        wrongPool,
        subjects: modSubjects,
        isWrongBook: true,
        wrongMode: 'all',
        today: '2026-10-23'
    });
    assert.deepEqual(allWrong.map(q => q.question_uid), ['q1', 'q2']);
});

test('buildRadarAxisStats 自動選擇 >= 3 個維度軸並計算正確率與答題統計', () => {
    // 當 assessmentTopic >= 3 時以主題分組
    const midQuestions = [
        { question_uid: 'm1', assessmentTopic: 'L211', chapter: '第三章 AI 相關技術應用' },
        { question_uid: 'm2', assessmentTopic: 'L221', chapter: '第三章 機率統計基礎' },
        { question_uid: 'm3', assessmentTopic: 'L231', chapter: '第三章 機器學習基礎數學' }
    ];
    const midStats = buildRadarAxisStats(
        midQuestions,
        [{ question_uid: 'm1', assessmentTopic: 'L211' }],
        [
            { question_uid: 'm1', correct: 1, wrong: 1 },
            { question_uid: 'm2', correct: 2, wrong: 0 }
        ],
        [{ topicGroup: 'L211 AI 相關技術應用' }, { topicGroup: 'L221 機率統計基礎' }, { topicGroup: 'L231 機器學習基礎數學' }]
    );
    assert.equal(midStats.groupBy, 'assessmentTopic');
    assert.equal(midStats.axes.length, 3);
    assert.equal(midStats.axes[0].shortLabel, 'L211 AI技術');
    assert.equal(midStats.axes[0].fullName, 'L211 AI 相關技術應用');
    assert.equal(midStats.axes[0].accuracy, 50);
    assert.equal(midStats.axes[0].answeredQuestions, 1);
    assert.equal(midStats.axes[0].totalQuestions, 1);
    assert.equal(midStats.axes[0].wrongPoolCount, 1);

    // 當 assessmentTopic < 3 時自動退回以 chapter 分組避免退化成直線
    const fewTopicQuestions = [
        { question_uid: 'o1', assessmentTopic: 'L111', chapter: '第四章 營運智慧基本知識' },
        { question_uid: 'o2', assessmentTopic: 'L111', chapter: '第五章 基礎資料分析' },
        { question_uid: 'o3', assessmentTopic: 'L121', chapter: '第四章 經營管理基本知識' },
        { question_uid: 'o4', assessmentTopic: 'L121', chapter: '第五章 數位化企業資訊工具基本知識' }
    ];
    const fallbackStats = buildRadarAxisStats(fewTopicQuestions, [], []);
    assert.equal(fallbackStats.groupBy, 'chapter');
    assert.equal(fallbackStats.axes.length, 4);

    // formatTopicLabel 可轉譯主題代碼與標題
    assert.equal(
        formatTopicLabel('L221', midQuestions, [{ topicGroup: 'L221 機率統計基礎' }]),
        'L221 機率統計基礎'
    );
});

test('serializeActiveSession 與 restoreActiveSession 淨化敏感欄位並保留工作階段與證照狀態', () => {
    const rawSession = {
        mode: 'account',
        userId: 'usr_01JABCDEF1234567',
        displayId: 'A12****789',
        partitionKey: 'usr_01JABCDEF1234567',
        migrationDone: true,
        syncStatus: 'account',
        sessionToken: 'secret-token-should-not-persist',
        nationalId: 'A123456789',
        expiresAt: '2026-10-23T12:00:00.000Z',
        syncEnabled: true,
        syncEndpoint: 'https://example.test/sync'
    };

    const serialized = serializeActiveSession(rawSession, 'ai_mid');
    assert.equal(serialized.mode, 'account');
    assert.equal(serialized.userId, 'usr_01JABCDEF1234567');
    assert.equal(serialized.currentCert, 'ai_mid');
    assert.equal('sessionToken' in serialized, false);
    assert.equal('nationalId' in serialized, false);

    const restored = restoreActiveSession(serialized);
    assert.equal(restored.currentCert, 'ai_mid');
    assert.equal(restored.accountSession.mode, 'account');
    assert.equal(restored.accountSession.userId, 'usr_01JABCDEF1234567');
    assert.equal(restored.accountSession.sessionToken, null);
});

test('serializeActiveQuiz 與 restoreActiveQuiz 可序列化並從題庫還原進行中測驗與倒數計時', () => {
    const bank = [
        { question_uid: 'ai_mid-q1', display_num: 1, question: '第一題', options: ['A', 'B', 'C', 'D'], answer: 'A' },
        { question_uid: 'ai_mid-q2', display_num: 2, question: '第二題', options: ['A', 'B', 'C', 'D'], answer: 'B' },
        { question_uid: 'ai_mid-q3', display_num: 3, question: '第三題', options: ['A', 'B', 'C', 'D'], answer: 'C' }
    ];
    const nowMs = 1_700_000_000_000;
    const examEndTime = nowMs + 3600 * 1000; // 剩餘 3600 秒

    const state = {
        currentCert: 'ai_mid',
        quizMode: 'exam',
        currentExamSubject: 's2',
        currentQuiz: [bank[2], bank[0]],
        currentIndex: 1,
        userAnswers: { 0: 2 },
        checkedQuestions: new Set([0]),
        flaggedQuestions: { 1: true },
        examEndTime,
        timerDurationSeconds: 5400
    };

    const serialized = serializeActiveQuiz(state, nowMs);
    assert.equal(serialized.certKey, 'ai_mid');
    assert.equal(serialized.quizMode, 'exam');
    assert.equal(serialized.currentExamSubject, 's2');
    assert.deepEqual(serialized.questionUids, ['ai_mid-q3', 'ai_mid-q1']);
    assert.equal(serialized.currentIndex, 1);
    assert.deepEqual(serialized.userAnswers, { 0: 2 });
    assert.deepEqual(serialized.checkedQuestions, [0]);
    assert.deepEqual(serialized.flaggedQuestions, [1]);
    assert.equal(serialized.examEndTime, examEndTime);

    // 模擬重新整理經過 120 秒後還原
    const restored = restoreActiveQuiz(serialized, bank, nowMs + 120 * 1000);
    assert.equal(restored.certKey, 'ai_mid');
    assert.equal(restored.quizMode, 'exam');
    assert.equal(restored.currentExamSubject, 's2');
    assert.deepEqual(restored.currentQuiz.map(q => getQuestionKey(q)), ['ai_mid-q3', 'ai_mid-q1']);
    assert.equal(restored.currentIndex, 1);
    assert.deepEqual(restored.userAnswers, { 0: 2 });
    assert.equal(restored.checkedQuestions.has(0), true);
    assert.equal(restored.flaggedQuestions[1], true);
    assert.equal(restored.timeRemaining, 3480);
});



