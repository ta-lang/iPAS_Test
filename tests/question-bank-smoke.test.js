const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const banks = [
    { file: 'questions.json', expectedCount: 163 },
    { file: 'ai_questions.json', expectedCount: 530 },
    { file: 'ai_mid_questions.json', expectedCount: 298 }
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
            assert.match(question.answer, /^[A-D]$/, `id ${question.id} 答案不在 A-D`);
        });
    });
}
