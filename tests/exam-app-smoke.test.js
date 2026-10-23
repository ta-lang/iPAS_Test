const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const examDir = path.join(__dirname, '..', 'exam');
const script = fs.readFileSync(path.join(examDir, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(examDir, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(examDir, 'sw.js'), 'utf8');

function countMatches(text, expression) {
    return [...text.matchAll(expression)].length;
}

test('核心模組在主程式之前載入並納入離線 app shell', () => {
    assert.ok(index.indexOf('src="core.js"') < index.indexOf('src="script.js"'));
    assert.match(serviceWorker, /const CACHE = 'ipas-exam-v5'/);
    assert.match(serviceWorker, /'core\.js'/);
});

test('題庫按證照載入且持久化使用永久題目識別碼', () => {
    assert.match(script, /async function loadModuleQuestions/);
    assert.doesNotMatch(index, /src="(?:questions|ai_questions|ai_mid_questions)\.js"/);
    assert.match(script, /const DB_VERSION = 5/);
    assert.match(script, /migrationQuarantine/);
    assert.match(script, /getQuestionStorageId\(certId, q\)/);
    assert.match(script, /questions\.find\(item => item\.question_uid === resolution\.question_uid\)/);
    assert.doesNotMatch(script, /const question = resolution\.question/);
    assert.doesNotMatch(script, /id:\s*`\$\{certId\}_\$\{q\.num\}`/);
});

test('Phase 3 帳戶核心先於主程式載入並建立帳戶分區儲存', () => {
    assert.ok(index.indexOf('src="account-core.js"') < index.indexOf('src="script.js"'));
    assert.ok(index.indexOf('src="account-api.js"') < index.indexOf('src="script.js"'));
    assert.match(serviceWorker, /'account-core\.js'/);
    assert.match(serviceWorker, /'account-api\.js'/);
    assert.match(index, /id="syncStatus"/);
    assert.match(index, /id="btnLogout"/);
    assert.match(script, /const DB_VERSION = 5/);
    assert.match(script, /createObjectStore\('userQuestionState'/);
    assert.match(script, /createObjectStore\('syncOutbox'/);
    assert.match(script, /createObjectStore\('accountQuizAttempts'/);
    assert.match(script, /createObjectStore\('accountAttemptAnswers'/);
    assert.match(script, /createObjectStore\('courseProgress'/);
    assert.match(script, /parseLoginCapability\(data\)/);
    assert.match(script, /persistAccountQuestionEvent/);
});

test('評分、練習啟動與回饋各只有一個正式入口', () => {
    assert.equal(countMatches(script, /function gradeQuiz\s*\(/g), 1);
    assert.equal(countMatches(script, /function startPracticeMode\s*\(/g), 1);
    assert.equal(countMatches(script, /function showPracticeFeedback\s*\(/g), 1);
    assert.doesNotMatch(script, /_orig(?:GradeQuiz|StartPractice|ShowFeedback)/);
});

test('練習畫面重繪不會執行持久化', () => {
    const feedbackStart = script.indexOf('function showPracticeFeedback');
    const feedbackEnd = script.indexOf('// Star flagging toggle', feedbackStart);
    const feedbackBody = script.slice(feedbackStart, feedbackEnd);

    assert.doesNotMatch(feedbackBody, /updateQuestionStats|addWrongQuestion|updateWrongPoolAfterCorrect/);
    assert.equal(countMatches(script, /persistPracticeAnswer\(qIdx\);/g), 1);
});

test('評分先建立結果，再交由單一持久化流程處理', () => {
    const gradeStart = script.indexOf('function gradeQuiz');
    const gradeEnd = script.indexOf('async function persistQuizResult', gradeStart);
    const gradeBody = script.slice(gradeStart, gradeEnd);

    assert.ok(gradeBody.indexOf('buildQuizResult') < gradeBody.indexOf('persistQuizResult(result)'));
    assert.equal(countMatches(script, /saveQuizHistory\(/g), 2);
    assert.doesNotMatch(gradeBody, /\bconst score\b/);
});

test('Phase 1 P0 題幹、選項、解析渲染與講義錨點導覽具備完整接線', () => {
    const config = fs.readFileSync(path.join(examDir, 'config.js'), 'utf8');
    const style = fs.readFileSync(path.join(examDir, 'style.css'), 'utf8');

    // 1. KaTeX 與 Markdown 渲染
    assert.match(script, /function renderMathInContainer\(el\)/);
    assert.match(script, /lblExplanationText\.innerHTML = formatQuestionText\(explText\)/);
    assert.match(script, /renderMathInContainer\(feedbackArea\)/);
    assert.match(script, /renderMathInContainer\(reviewQuestionsList\)/);

    // 2. 選項前綴與標準答案標頭去重
    assert.match(script, /stripOptionPrefix\(opt, letter\)/);
    assert.match(script, /formatStandardAnswerHeader\(correctLetter, q\.ans_text\)/);
    assert.match(script, /formatStandardAnswerHeader\(q\.answer, q\.ans_text\)/);

    // 3. 中級講義 #L2xxxx 錨點與平滑捲動快取
    assert.match(config, /L211_AI相關技術應用\.md#L21101/);
    assert.match(config, /L234_機器學習治理\.md#L23402/);
    assert.match(script, /async function loadNoteFile\(filePath, title, activeBtn\)/);
    assert.match(script, /const \[basePath, anchorId\] = String\(filePath \|\| ''\)\.split\('#'\)/);
    assert.match(script, /appData\.currentNoteBasePath === basePath/);

    // 4. 靜態題數與課程學習卡片文案修正
    assert.match(config, /questionCount:\s*566/);
    assert.match(index, /依官方評鑑主題閱讀重點筆記、公式推導與常考陷阱/);

    // 5. 表格樣式
    assert.match(style, /\.question-text table/);
    assert.match(style, /\.explanation-text table/);
    assert.match(style, /\.review-item table/);
});

test('Phase 2 P1 模擬考配題、練習篩選、模擬考 SM-2 更新與多維度雷達圖具備完整接線', () => {
    // 1. 模擬考配題選項與 sampleExamQuestions 呼叫
    assert.match(index, /id="selExamSamplingStrategy"/);
    assert.match(index, /value="balanced_topic"/);
    assert.match(index, /value="proportional"/);
    assert.match(index, /id="chkExcludePastExams"/);
    assert.match(script, /window\.ExamCore\.sampleExamQuestions\(pool,\s*50/);

    // 2. 練習模式評鑑主題篩選、錯題子模式、未作答新題與即時題數更新
    assert.match(index, /id="selTopic"/);
    assert.match(index, /id="selWrongMode"/);
    assert.match(index, /id="chkUnansweredOnly"/);
    assert.match(index, /id="lblPoolCount"/);
    assert.match(script, /function populateTopicsAndChapters\s*\(/);
    assert.match(script, /function populateChapters\s*\(/);
    assert.match(script, /async function updatePoolCount\s*\(/);
    assert.match(script, /window\.ExamCore\.filterPracticeQuestions\(/);

    // 3. 模擬考模式答對時亦更新 SM-2 排程
    const persistStart = script.indexOf('async function persistQuizResult');
    const persistEnd = script.indexOf('// Subject breakdown GUI list rendering', persistStart);
    const persistBody = script.slice(persistStart, persistEnd);
    assert.match(persistBody, /updateWrongPoolAfterCorrect\(appData\.currentCert,\s*question\)/);

    // 4. 弱點分析雷達圖使用多維度主題/章節軸與完整 Tooltip
    const radarStart = script.indexOf('async function renderWeaknessCharts');
    const radarEnd = script.indexOf('// IRT 審題儀表板', radarStart);
    const radarBody = script.slice(radarStart, radarEnd);
    assert.match(radarBody, /window\.ExamCore\.buildRadarAxisStats\(/);
    assert.match(radarBody, /tooltip:\s*\{/);
    assert.match(radarBody, /已答\/總題數/);
});

test('Phase 3 P2 Service Worker 快取策略、重新整理進度保留與測驗鍵盤快捷鍵具備完整接線', () => {
    const style = fs.readFileSync(path.join(examDir, 'style.css'), 'utf8');

    // 1. Service Worker v5 Network-First + CDN Stale-While-Revalidate
    assert.match(serviceWorker, /const CACHE = 'ipas-exam-v5'/);
    assert.match(serviceWorker, /fetch\(e\.request\)[\s\S]*?\.catch\(\(\) => caches\.match\(e\.request\)\)/);
    assert.match(serviceWorker, /cdn\.jsdelivr\.net/);
    assert.match(serviceWorker, /fonts\.googleapis\.com/);
    assert.match(serviceWorker, /fonts\.gstatic\.com/);

    // 2. sessionStorage 登入工作階段與進行中測驗持久化
    assert.match(script, /ipas_active_session_v1/);
    assert.match(script, /ipas_active_quiz_v1/);
    assert.match(script, /function saveActiveSessionToStorage\(/);
    assert.match(script, /function saveActiveQuizToStorage\(/);
    assert.match(script, /async function restoreActiveQuizFromStorage\(/);
    assert.match(script, /function logoutUser\(/);
    assert.match(script, /function confirmQuitQuiz\(/);

    // 3. 測驗鍵盤快捷鍵與畫面底部提示列
    assert.match(script, /document\.addEventListener\('keydown',\s*handleQuizKeydown\)/);
    assert.match(script, /function handleQuizKeydown\(e\)/);
    assert.match(script, /ArrowLeft/);
    assert.match(script, /ArrowRight/);
    assert.match(index, /快捷鍵：1-4 \/ A-D 選答 ｜ ← → 切換題目 ｜ Enter 確認\/下一題 ｜ F 標記/);
    assert.match(style, /@media \(max-width:\s*768px\)[\s\S]*?\.quiz-shortcut-hint\s*\{\s*display:\s*none;/);
});



