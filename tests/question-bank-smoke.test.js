const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const banks = [
    { file: 'questions.json', wrapper: 'questions.js', variable: 'ipasQuestions', expectedCount: 163 },
    { file: 'ai_questions.json', wrapper: 'ai_questions.js', variable: 'ipasAiQuestions', expectedCount: 630 },
    { file: 'ai_mid_questions.json', wrapper: 'ai_mid_questions.js', variable: 'ipasAiMidQuestions', expectedCount: 566 },
    { file: '3d_questions.json', wrapper: '3d_questions.js', variable: 'ipas3dQuestions', expectedCount: 207 },
    { file: 'pcb_questions.json', wrapper: 'pcb_questions.js', variable: 'ipasPcbQuestions', expectedCount: 135 },
    { file: 'aiot_questions.json', wrapper: 'aiot_questions.js', variable: 'ipasAiotQuestions', expectedCount: 140 }
];

for (const bank of banks) {
    test(`${bank.file} 通過題庫基線檢查`, () => {
        const filePath = path.join(__dirname, '..', 'exam', bank.file);
        const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        assert.equal(Array.isArray(questions), true);
        assert.equal(questions.length, bank.expectedCount);

        const ids = new Set();
        questions.forEach((question, index) => {
            assert.notEqual(question.id, undefined, `第 ${index + 1} 筆缺少 id`);
            assert.equal(ids.has(question.id), false, `id ${question.id} 重複`);
            ids.add(question.id);

            assert.equal(typeof question.question, 'string', `id ${question.id} 題幹格式錯誤`);
            assert.notEqual(question.question.trim(), '', `id ${question.id} 題幹為空`);
            assert.equal(Array.isArray(question.options), true, `id ${question.id} 選項不是陣列`);
            assert.equal(question.options.length, 4, `id ${question.id} 選項數不是 4`);
            question.options.forEach((option, optionIndex) => {
                assert.equal(typeof option, 'string', `id ${question.id} 選項 ${optionIndex + 1} 格式錯誤`);
                assert.notEqual(option.trim(), '', `id ${question.id} 選項 ${optionIndex + 1} 為空`);
            });
            assert.match(question.answer, /^[A-D]+$/, `id ${question.id} 答案不在 A-D`);
            assert.match(question.question_uid, /^(oi|ai|ai_mid|3d|pcb|aiot)-[a-f0-9]{24}$/, `id ${question.id} question_uid 格式錯誤`);
            assert.equal(question.display_num, question.num, `id ${question.id} display_num 與 num 不一致`);
            assert.match(question.source_id, /^(oi|ai|ai_mid|3d|pcb|aiot)-[a-f0-9]{16}$/, `id ${question.id} source_id 格式錯誤`);
            assert.equal(typeof question.source_version, 'string', `id ${question.id} 缺少 source_version`);
            assert.match(question.content_hash, /^[a-f0-9]{64}$/, `id ${question.id} content_hash 格式錯誤`);
        });

        assert.equal(new Set(questions.map(question => question.question_uid)).size, questions.length);

        const wrapperPath = path.join(__dirname, '..', 'exam', bank.wrapper);
        const wrapperSource = fs.readFileSync(wrapperPath, 'utf8').trim();
        const prefix = `window.${bank.variable} = `;
        assert.equal(wrapperSource.startsWith(prefix), true, `${bank.wrapper} wrapper 格式錯誤`);
        const wrappedQuestions = JSON.parse(wrapperSource.slice(prefix.length).replace(/;$/, ''));
        assert.deepEqual(wrappedQuestions, questions, `${bank.wrapper} 與 ${bank.file} 內容不一致`);
    });
}
