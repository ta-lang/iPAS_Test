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
    assert.match(serviceWorker, /const CACHE = 'ipas-exam-v3'/);
    assert.match(serviceWorker, /'core\.js'/);
});

test('題庫按證照載入且持久化使用永久題目識別碼', () => {
    assert.match(script, /async function loadModuleQuestions/);
    assert.doesNotMatch(index, /src="(?:questions|ai_questions|ai_mid_questions)\.js"/);
    assert.match(script, /const DB_VERSION = 4/);
    assert.match(script, /migrationQuarantine/);
    assert.match(script, /getQuestionStorageId\(certId, q\)/);
    assert.match(script, /questions\.find\(item => item\.question_uid === resolution\.question_uid\)/);
    assert.doesNotMatch(script, /const question = resolution\.question/);
    assert.doesNotMatch(script, /id:\s*`\$\{certId\}_\$\{q\.num\}`/);
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
