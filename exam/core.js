(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.ExamCore = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const ANSWER_PREFIXES = ['A', 'B', 'C', 'D'];

    function findSubjectId(question, subjects) {
        const subjectText = String(question.subject || '');
        const matched = subjects.find(subject =>
            (subject.matchKeywords || []).some(keyword => subjectText.includes(keyword)));
        return matched ? matched.id : (subjects[0] && subjects[0].id);
    }

    function buildQuizResult({ questions = [], userAnswers = {}, subjects = [] }) {
        const subjectStats = {};
        subjects.forEach(subject => {
            subjectStats[subject.id] = { name: subject.name, total: 0, correct: 0 };
        });

        let correctCount = 0;
        const gradedResults = [];
        const wrongQuestionIndexes = [];

        questions.forEach((question, index) => {
            const subjectId = findSubjectId(question, subjects);
            if (subjectId && subjectStats[subjectId]) {
                subjectStats[subjectId].total++;
            }

            const correctIndex = ANSWER_PREFIXES.indexOf(String(question.answer || '').toUpperCase());
            const isCorrect = correctIndex >= 0 && userAnswers[index] === correctIndex;
            gradedResults.push(isCorrect ? 'correct' : 'wrong');

            if (isCorrect) {
                correctCount++;
                if (subjectId && subjectStats[subjectId]) {
                    subjectStats[subjectId].correct++;
                }
            } else {
                wrongQuestionIndexes.push(index);
            }
        });

        const total = questions.length;
        const answeredIndexes = new Set(
            Object.keys(userAnswers)
                .filter(key => userAnswers[key] !== undefined)
                .map(key => Number(key))
                .filter(index => Number.isInteger(index) && index >= 0 && index < total)
        );
        const answeredCount = answeredIndexes.size;
        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        const answerRate = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

        return {
            total,
            correctCount,
            score,
            passed: total > 0 && score >= 70,
            answeredCount,
            answerRate,
            subjectStats,
            gradedResults,
            wrongQuestionIndexes
        };
    }

    function claimOnce(registry, key) {
        if (Object.prototype.hasOwnProperty.call(registry, key)) {
            return false;
        }
        registry[key] = true;
        return true;
    }

    function getQuestionStorageId(certId, question) {
        const questionUid = String(question && question.question_uid || '').trim();
        if (!questionUid) {
            throw new Error('question_uid is required for persistent question state');
        }
        return `${certId}_${questionUid}`;
    }

    function normalizeLegacyText(value) {
        return String(value || '')
            .normalize('NFKC')
            .replace(/\s+/gu, ' ')
            .trim()
            .toLowerCase();
    }

    function resolveLegacyQuestion(legacyEntry, questions) {
        const legacyNumber = Number(legacyEntry && (legacyEntry.display_num ?? legacyEntry.num));
        const candidates = (questions || []).filter(question =>
            Number(question.display_num ?? question.num) === legacyNumber);

        if (candidates.length === 0) {
            return { status: 'missing', candidate_uids: [] };
        }
        if (candidates.length === 1) {
            return { status: 'resolved', question_uid: candidates[0].question_uid };
        }

        const comparableFields = ['subject', 'chapter', 'question']
            .filter(field => normalizeLegacyText(legacyEntry && legacyEntry[field]));
        const exactMatches = candidates.filter(question =>
            comparableFields.every(field =>
                normalizeLegacyText(question[field]) === normalizeLegacyText(legacyEntry[field])));

        if (comparableFields.length > 0 && exactMatches.length === 1) {
            return { status: 'resolved', question_uid: exactMatches[0].question_uid };
        }

        return {
            status: 'ambiguous',
            candidate_uids: candidates.map(question => question.question_uid).sort()
        };
    }

    function getTimerSnapshot(startedAtMs, durationSeconds, nowMs = Date.now()) {
        const parsedDuration = Number(durationSeconds);
        const safeDuration = Number.isFinite(parsedDuration)
            ? Math.max(0, Math.floor(parsedDuration))
            : 0;
        const parsedStart = Number(startedAtMs);
        const parsedNow = Number(nowMs);
        const elapsed = Number.isFinite(parsedStart) && Number.isFinite(parsedNow)
            ? Math.max(0, Math.floor((parsedNow - parsedStart) / 1000))
            : 0;
        const timeSpent = Math.min(safeDuration, elapsed);
        const timeRemaining = Math.max(0, safeDuration - elapsed);
        return {
            timeSpent,
            timeRemaining,
            expired: timeRemaining === 0
        };
    }

    return {
        ANSWER_PREFIXES,
        buildQuizResult,
        claimOnce,
        getQuestionStorageId,
        getTimerSnapshot,
        resolveLegacyQuestion
    };
}));
