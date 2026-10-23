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

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function stripOptionPrefix(optText, letter) {
        if (optText === null || optText === undefined) return '';
        const raw = String(optText);
        if (letter && /^[A-Da-d]$/.test(String(letter).trim())) {
            const target = String(letter).trim().toUpperCase();
            const lower = target.toLowerCase();
            const specificParen = new RegExp(`^\\s*[\\(（][${target}${lower}][\\)）]\\s*`);
            if (specificParen.test(raw)) {
                return raw.replace(specificParen, '');
            }
            const specificPunct = new RegExp(`^\\s*[${target}${lower}](?:[\\.\\)]\\s*|\\s+|、(?![A-Za-z]))`);
            if (specificPunct.test(raw)) {
                return raw.replace(specificPunct, '');
            }
        }
        return raw
            .replace(/^\s*[\(（][A-Da-d][\)）]\s*/, '')
            .replace(/^\s*[A-Da-d](?:[\.\)]\s*|\、(?![A-Za-z])\s*)/, '');
    }

    function formatStandardAnswerHeader(correctLetter, ansText) {
        const letter = String(correctLetter || '').trim().toUpperCase();
        const rawAns = String(ansText ?? '').trim();
        if (!rawAns) {
            return `標準答案：(${letter})`;
        }
        // Strip leading duplicate "標準答案：(X)" or "標準答案: (X)" or "(X)"
        const stripped = rawAns
            .replace(/^標準答案\s*[：:]\s*(?:[\(（][A-Da-d][\)）]\s*)?/i, '')
            .replace(/^\s*[\(（][A-Da-d][\)）]\s*/, '')
            .trim();
        if (!stripped) {
            return `標準答案：(${letter})`;
        }
        return `標準答案：(${letter}) ${stripped}`;
    }

    function parseMarkdownTableBlock(tableLines) {
        const parseRow = (line) => {
            const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
            return trimmed.split('|').map(cell => cell.trim());
        };
        const headerCells = parseRow(tableLines[0]);
        const alignCells = parseRow(tableLines[1]);
        const alignments = alignCells.map(cell => {
            if (/^:-+:$/.test(cell)) return 'center';
            if (/^-+:$/.test(cell)) return 'right';
            return 'left';
        });
        const thead = '<thead><tr>' + headerCells.map((cell, i) => {
            const align = alignments[i] || 'left';
            return `<th style="text-align:${align}">${formatInlineMarkdown(cell)}</th>`;
        }).join('') + '</tr></thead>';

        const bodyRows = tableLines.slice(2).filter(line => line.trim() !== '');
        const tbody = '<tbody>' + bodyRows.map(line => {
            const cells = parseRow(line);
            return '<tr>' + headerCells.map((_, i) => {
                const align = alignments[i] || 'left';
                const cellText = cells[i] !== undefined ? cells[i] : '';
                return `<td style="text-align:${align}">${formatInlineMarkdown(cellText)}</td>`;
            }).join('') + '</tr>';
        }).join('') + '</tbody>';

        return `<div class="md-table-wrap"><table class="md-table">${thead}${tbody}</table></div>`;
    }

    function formatInlineMarkdown(escapedText) {
        return escapedText
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    }

    function formatQuestionText(raw) {
        if (!raw) return '';
        const text = String(raw);
        const placeholders = [];
        const addPlaceholder = (html) => {
            const token = `\u0000PH_${placeholders.length}_\u0000`;
            placeholders.push(html);
            return token;
        };

        // 1. Protect fenced code blocks ```lang\n...\n```
        let working = text.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (_, lang, code) => {
            const safeLang = escapeHtml(lang);
            const safeCode = escapeHtml(code.trim());
            return addPlaceholder(`<pre class="code-block ${safeLang ? 'lang-' + safeLang : ''}"><code>${safeCode}</code></pre>`);
        });

        // 2. Protect inline code `...`
        working = working.replace(/`([^`\n]+)`/g, (_, code) => {
            return addPlaceholder(`<code class="inline-code">${escapeHtml(code)}</code>`);
        });

        // 3. Protect display math $$...$$
        working = working.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
            return addPlaceholder(escapeHtml(match));
        });

        // 4. Protect inline math $...$ (avoid matching currency like $850 ... $1,020)
        working = working.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
            // If inner starts with a digit and contains currency/Chinese text separated by spaces, do not treat as LaTeX math
            if (/^\d[\d,.]*(\s|$)/.test(inner)) {
                return match;
            }
            return addPlaceholder(escapeHtml(match));
        });

        // 4.5. Protect Markdown images ![alt](src)
        working = working.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
            const safeAlt = escapeHtml(alt);
            const safeSrc = encodeURI(src.trim()).replace(/"/g, '&quot;');
            return addPlaceholder(`<img src="${safeSrc}" alt="${safeAlt}" class="question-diagram" loading="lazy" style="max-width:100%;height:auto;margin:8px 0;display:block;" />`);
        });

        // 5. Escape remaining HTML to prevent XSS
        working = escapeHtml(working);

        // 6. Parse Markdown tables (header | separator | rows)
        const lines = working.split(/\r?\n/);
        const outLines = [];
        let i = 0;
        const isTableRow = (line) => {
            const t = line.trim();
            return t.startsWith('|') && t.endsWith('|') && t.length > 2;
        };
        const isTableSeparator = (line) => {
            const t = line.trim();
            return /^\|[\s:|-]+\|$/.test(t) && t.includes('-');
        };

        while (i < lines.length) {
            if (i + 1 < lines.length && isTableRow(lines[i]) && isTableSeparator(lines[i + 1])) {
                const tableBlock = [lines[i], lines[i + 1]];
                i += 2;
                while (i < lines.length && isTableRow(lines[i])) {
                    tableBlock.push(lines[i]);
                    i++;
                }
                outLines.push(addPlaceholder(parseMarkdownTableBlock(tableBlock)));
            } else {
                outLines.push(formatInlineMarkdown(lines[i]));
                i++;
            }
        }

        working = outLines.join('\n');

        // 7. Restore placeholders
        working = working.replace(/\u0000PH_(\d+)_\u0000/g, (_, idx) => placeholders[Number(idx)]);
        return working;
    }

    const TOPIC_TITLES = {
        L111: '營運智慧／AI定義與治理',
        L112: '資料分析與處理',
        L113: '機器學習原理與模型',
        L114: '鑑別式與生成式AI',
        L121: '經營管理／No-Code與Low-Code',
        L122: '數位資訊工具／生成式AI工具',
        L123: '生成式AI導入與風險管理',
        L211: 'AI相關技術應用',
        L212: 'AI導入評估規劃',
        L213: 'AI技術應用與系統部署',
        L221: '機率與統計基礎',
        L222: '大數據處理技術',
        L223: '大數據分析方法與工具',
        L224: '大數據在人工智慧之應用',
        L231: '機器學習基礎數學',
        L232: '機器學習與深度學習',
        L233: '機器學習建模與參數調校',
        L234: '機器學習治理',
        '範例': '官方樣題範例',
        '歷屆': '歷屆公告試題'
    };

    const TOPIC_SHORT_LABELS = {
        L111: 'L111 基礎與治理',
        L112: 'L112 資料分析',
        L113: 'L113 機器學習',
        L114: 'L114 鑑別/生成AI',
        L121: 'L121 管理/NoCode',
        L122: 'L122 工具應用',
        L123: 'L123 導入與風險',
        L211: 'L211 AI技術',
        L212: 'L212 導入規劃',
        L213: 'L213 系統部署',
        L221: 'L221 機率統計',
        L222: 'L222 數據處理',
        L223: 'L223 數據分析',
        L224: 'L224 大數據AI',
        L231: 'L231 基礎數學',
        L232: 'L232 機器/深度學習',
        L233: 'L233 建模調校',
        L234: 'L234 機器學習治理',
        '範例': '範例 官方樣題',
        '歷屆': '歷屆 考古試題'
    };

    function formatTopicLabel(topicValue, questions = [], studyNotes = []) {
        const raw = String(topicValue || '').trim();
        if (!raw) return '';
        // If raw already contains code + title (e.g. "L211 AI相關技術應用"), return as-is
        if (/^L\d{3}\s+\S/.test(raw)) return raw;

        // Check studyNotes topicGroup for exact match (e.g. "L211 AI 相關技術應用")
        if (Array.isArray(studyNotes)) {
            for (const note of studyNotes) {
                const tg = String(note && note.topicGroup || '').trim();
                if (tg && (tg === raw || tg.startsWith(raw + ' '))) {
                    return tg;
                }
            }
        }

        // Derive from matching question chapters if possible
        if (Array.isArray(questions) && /^L\d{3}$/.test(raw)) {
            for (const q of questions) {
                if (String(q && q.assessmentTopic || '').trim() === raw) {
                    const ch = String(q.chapter || '').trim();
                    const cleaned = ch
                        .replace(/^第[一二三四五六七八九十]+章\s*/, '')
                        .replace(/^L\d{5}\s*/, '')
                        .replace(/\s*\(指引實戰精選\)\s*$/, '')
                        .trim();
                    if (cleaned && !cleaned.includes('歷屆') && cleaned !== raw) {
                        if (!/^L\d{3}0\d/.test(ch)) {
                            return `${raw} ${cleaned}`;
                        }
                    }
                }
            }
        }

        if (TOPIC_TITLES[raw]) {
            return /^L\d{3}$/.test(raw) ? `${raw} ${TOPIC_TITLES[raw]}` : `${raw} (${TOPIC_TITLES[raw]})`;
        }
        return raw;
    }

    function formatRadarShortLabel(rawKey, isTopic) {
        const key = String(rawKey || '').trim();
        if (!key) return '未分類';
        if (isTopic) {
            if (TOPIC_SHORT_LABELS[key]) return TOPIC_SHORT_LABELS[key];
            const match = key.match(/^(L\d{3})\s*(.+)$/);
            if (match) {
                const code = match[1];
                if (TOPIC_SHORT_LABELS[code]) return TOPIC_SHORT_LABELS[code];
                const title = match[2].trim();
                return `${code} ${title.length > 6 ? title.slice(0, 6) : title}`;
            }
        }
        // Shorten chapter label
        const cleaned = key
            .replace(/^第[一二三四五六七八九十]+章\s*/, '')
            .replace(/\s*\(指引實戰精選\)\s*$/, ' (精選)');
        return cleaned.length > 10 ? cleaned.slice(0, 10) + '…' : cleaned;
    }

    function isPastExamQuestion(question) {
        const ch = String(question && question.chapter || '');
        const topic = String(question && question.assessmentTopic || '');
        return ch.includes('歷屆') || topic === '歷屆';
    }

    function defaultShuffle(array, rng = Math.random) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function allocateFromBuckets(bucketMap, targetCount, strategy, shuffleFn) {
        const keys = Object.keys(bucketMap).filter(k => bucketMap[k] && bucketMap[k].length > 0);
        if (keys.length === 0 || targetCount <= 0) return [];

        const shuffledBuckets = {};
        let totalAvailable = 0;
        keys.forEach(k => {
            shuffledBuckets[k] = shuffleFn(bucketMap[k]);
            totalAvailable += shuffledBuckets[k].length;
        });

        if (totalAvailable <= targetCount) {
            let all = [];
            keys.forEach(k => {
                all = all.concat(shuffledBuckets[k]);
            });
            return shuffleFn(all);
        }

        const allocation = {};
        if (strategy === 'proportional') {
            let allocated = 0;
            keys.forEach(k => {
                const raw = (shuffledBuckets[k].length / totalAvailable) * targetCount;
                allocation[k] = Math.floor(raw);
                allocated += allocation[k];
            });
            const remainders = keys.map(k => ({
                k,
                rem: (shuffledBuckets[k].length / totalAvailable) * targetCount - allocation[k]
            })).sort((a, b) => b.rem - a.rem);
            for (let i = 0; i < targetCount - allocated; i++) {
                allocation[remainders[i % remainders.length].k]++;
            }
        } else {
            // balanced_topic: water-filling equal distribution with capacity cap
            keys.forEach(k => { allocation[k] = 0; });
            let remaining = targetCount;
            let activeKeys = [...keys];
            while (remaining > 0 && activeKeys.length > 0) {
                const base = Math.floor(remaining / activeKeys.length);
                if (base > 0) {
                    let progress = false;
                    for (const k of activeKeys) {
                        const cap = shuffledBuckets[k].length - allocation[k];
                        const add = Math.min(base, cap);
                        if (add > 0) {
                            allocation[k] += add;
                            remaining -= add;
                            progress = true;
                        }
                    }
                    activeKeys = activeKeys.filter(k => allocation[k] < shuffledBuckets[k].length);
                    if (!progress) break;
                } else {
                    const order = shuffleFn(activeKeys);
                    for (let i = 0; i < remaining && i < order.length; i++) {
                        allocation[order[i]]++;
                    }
                    remaining = 0;
                }
            }
        }

        let selected = [];
        keys.forEach(k => {
            const count = allocation[k] || 0;
            if (count > 0) {
                selected = selected.concat(shuffledBuckets[k].slice(0, count));
            }
        });
        return shuffleFn(selected);
    }

    function sampleExamQuestions(subjectPool = [], totalTarget = 50, options = {}) {
        const strategy = options.strategy === 'proportional' ? 'proportional' : 'balanced_topic';
        const excludePastExams = Boolean(options.excludePastExams);
        const rng = typeof options.rng === 'function' ? options.rng : Math.random;
        const shuffleFn = typeof options.shuffleFn === 'function'
            ? options.shuffleFn
            : (arr) => defaultShuffle(arr, rng);

        const pool = Array.isArray(subjectPool) ? subjectPool : [];
        const target = Math.max(0, Math.min(Number(totalTarget) || 50, pool.length));
        if (target === 0) return [];

        let activePool = pool;
        if (excludePastExams) {
            const nonPastPool = pool.filter(q => !isPastExamQuestion(q));
            if (nonPastPool.length > 0) {
                activePool = nonPastPool;
            }
        }

        const effectiveTarget = Math.min(target, activePool.length);

        const getBucketKey = (q) => {
            if (strategy === 'proportional') {
                return String(q && q.chapter || '').trim() || '未分類';
            }
            const topic = String(q && q.assessmentTopic || '').trim();
            if (topic) return topic;
            return String(q && q.chapter || '').trim() || '未分類';
        };

        const buckets = {};
        activePool.forEach(q => {
            const key = getBucketKey(q);
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(q);
        });

        return allocateFromBuckets(buckets, effectiveTarget, strategy, shuffleFn);
    }

    function filterPracticeQuestions({
        questions = [],
        wrongPool = [],
        questionStats = [],
        subjects = [],
        subjectId = 'all',
        topic = 'all',
        chapter = 'all',
        isWrongBook = false,
        wrongMode = 'due',
        unansweredOnly = false,
        today = new Date().toISOString().split('T')[0]
    } = {}) {
        const targetSubject = subjectId !== 'all'
            ? (subjects || []).find(s => s.id === subjectId)
            : null;

        const matchesSubject = (item) => {
            if (subjectId === 'all') return true;
            if (!targetSubject) return false;
            const subjText = String(item && item.subject || '');
            return (targetSubject.matchKeywords || []).some(kw => subjText.includes(kw));
        };

        const matchesTopic = (item) => {
            if (!topic || topic === 'all') return true;
            return String(item && item.assessmentTopic || '').trim() === topic;
        };

        const matchesChapter = (item) => {
            if (!chapter || chapter === 'all') return true;
            return String(item && item.chapter || '') === chapter;
        };

        const answeredUids = new Set();
        (questionStats || []).forEach(st => {
            const attempts = (Number(st && st.correct) || 0) + (Number(st && st.wrong) || 0);
            if (st && st.question_uid && attempts > 0) {
                answeredUids.add(st.question_uid);
            }
        });

        if (isWrongBook) {
            const questionByUid = new Map((questions || []).map(q => [q.question_uid, q]));
            return (wrongPool || []).filter(entry => {
                const enriched = {
                    ...(questionByUid.get(entry.question_uid) || {}),
                    ...entry
                };
                if (wrongMode !== 'all') {
                    const dueDate = String(enriched.nextReviewDate || today);
                    if (dueDate > today) return false;
                }
                if (!matchesSubject(enriched)) return false;
                if (!matchesTopic(enriched)) return false;
                if (!matchesChapter(enriched)) return false;
                if (unansweredOnly && answeredUids.has(enriched.question_uid)) return false;
                return true;
            });
        }

        return (questions || []).filter(q => {
            if (!matchesSubject(q)) return false;
            if (!matchesTopic(q)) return false;
            if (!matchesChapter(q)) return false;
            if (unansweredOnly && answeredUids.has(q.question_uid)) return false;
            return true;
        });
    }

    function buildRadarAxisStats(questions = [], wrongPool = [], questionStats = [], studyNotes = []) {
        const distinctTopics = new Set();
        (questions || []).forEach(q => {
            const t = String(q && q.assessmentTopic || '').trim();
            if (t) distinctTopics.add(t);
        });

        const useTopic = distinctTopics.size >= 3;
        const axisMap = new Map();

        const ensureBucket = (rawKey) => {
            const key = String(rawKey || '').trim() || '未分類';
            if (!axisMap.has(key)) {
                const fullName = useTopic
                    ? formatTopicLabel(key, questions, studyNotes)
                    : key;
                const shortLabel = formatRadarShortLabel(fullName, useTopic);
                axisMap.set(key, {
                    key,
                    shortLabel,
                    fullName,
                    totalQuestions: 0,
                    answeredQuestions: 0,
                    correctAttempts: 0,
                    wrongAttempts: 0,
                    wrongPoolCount: 0,
                    accuracy: 0
                });
            }
            return axisMap.get(key);
        };

        const questionKeyByUid = new Map();
        (questions || []).forEach(q => {
            const rawKey = useTopic
                ? (String(q && q.assessmentTopic || '').trim() || String(q && q.chapter || '').trim() || '未分類')
                : (String(q && q.chapter || '').trim() || '未分類');
            const bucket = ensureBucket(rawKey);
            bucket.totalQuestions++;
            if (q && q.question_uid) {
                questionKeyByUid.set(q.question_uid, bucket.key);
            }
        });

        (questionStats || []).forEach(st => {
            const correct = Number(st && st.correct) || 0;
            const wrong = Number(st && st.wrong) || 0;
            if (correct + wrong <= 0) return;
            const mappedKey = (st && st.question_uid && questionKeyByUid.get(st.question_uid))
                || (useTopic ? String(st && st.assessmentTopic || '').trim() : '')
                || String(st && st.chapter || '').trim()
                || '未分類';
            const bucket = ensureBucket(mappedKey);
            bucket.answeredQuestions++;
            bucket.correctAttempts += correct;
            bucket.wrongAttempts += wrong;
        });

        (wrongPool || []).forEach(w => {
            const mappedKey = (w && w.question_uid && questionKeyByUid.get(w.question_uid))
                || (useTopic ? String(w && w.assessmentTopic || '').trim() : '')
                || String(w && w.chapter || '').trim()
                || '未分類';
            const bucket = ensureBucket(mappedKey);
            bucket.wrongPoolCount++;
        });

        const axes = [...axisMap.values()].map(b => {
            const totalAttempts = b.correctAttempts + b.wrongAttempts;
            b.accuracy = totalAttempts > 0 ? Math.round((b.correctAttempts / totalAttempts) * 100) : 0;
            return b;
        });

        return {
            groupBy: useTopic ? 'assessmentTopic' : 'chapter',
            axes
        };
    }

    function getQuestionKey(question) {
        if (!question) return '';
        const uid = String(question.question_uid || '').trim();
        if (uid) return uid;
        const num = question.display_num ?? question.num ?? question.id ?? '';
        return String(num);
    }

    function serializeActiveSession(accountSession, currentCert = '') {
        if (!accountSession || typeof accountSession !== 'object') return null;
        return {
            mode: accountSession.mode === 'account' ? 'account' : 'local-only',
            userId: accountSession.userId || null,
            displayId: accountSession.displayId || null,
            partitionKey: accountSession.partitionKey || accountSession.userId || 'local',
            migrationDone: Boolean(accountSession.migrationDone),
            syncStatus: accountSession.syncStatus || (accountSession.syncEnabled ? 'account' : 'local-only'),
            expiresAt: accountSession.expiresAt || null,
            syncEnabled: Boolean(accountSession.syncEnabled),
            syncEndpoint: accountSession.syncEndpoint || '',
            reason: accountSession.reason || null,
            currentCert: String(currentCert || '').trim()
        };
    }

    function restoreActiveSession(saved) {
        if (!saved || typeof saved !== 'object' || !saved.mode) return null;
        return {
            accountSession: {
                mode: saved.mode === 'account' ? 'account' : 'local-only',
                userId: saved.userId || null,
                displayId: saved.displayId || null,
                partitionKey: saved.partitionKey || saved.userId || 'local',
                migrationDone: Boolean(saved.migrationDone),
                syncStatus: saved.syncStatus || 'local-only',
                sessionToken: null,
                expiresAt: saved.expiresAt || null,
                syncEnabled: Boolean(saved.syncEnabled),
                syncEndpoint: saved.syncEndpoint || '',
                reason: saved.reason || null
            },
            currentCert: String(saved.currentCert || '').trim()
        };
    }

    function serializeActiveQuiz(appData, nowMs = Date.now()) {
        if (!appData || !Array.isArray(appData.currentQuiz) || appData.currentQuiz.length === 0) {
            return null;
        }
        const currentIndex = Number.isInteger(appData.currentIndex)
            ? appData.currentIndex
            : (Number.isInteger(appData.currentQuestionIdx) ? appData.currentQuestionIdx : 0);

        let checkedList = [];
        if (appData.checkedQuestions instanceof Set || Array.isArray(appData.checkedQuestions)) {
            checkedList = Array.from(appData.checkedQuestions).map(Number).filter(Number.isInteger);
        } else if (appData.checkedQuestions && typeof appData.checkedQuestions === 'object') {
            checkedList = Object.keys(appData.checkedQuestions)
                .filter(k => appData.checkedQuestions[k])
                .map(Number)
                .filter(Number.isInteger);
        } else if (appData.quizMode === 'practice' && appData.userAnswers) {
            checkedList = Object.keys(appData.userAnswers)
                .filter(k => appData.userAnswers[k] !== undefined)
                .map(Number)
                .filter(Number.isInteger);
        }

        let flaggedList = [];
        if (appData.flaggedQuestions instanceof Set || Array.isArray(appData.flaggedQuestions)) {
            flaggedList = Array.from(appData.flaggedQuestions).map(Number).filter(Number.isInteger);
        } else if (appData.flaggedQuestions && typeof appData.flaggedQuestions === 'object') {
            flaggedList = Object.keys(appData.flaggedQuestions)
                .filter(k => appData.flaggedQuestions[k])
                .map(Number)
                .filter(Number.isInteger);
        }

        const userAnswers = {};
        if (appData.userAnswers && typeof appData.userAnswers === 'object') {
            Object.keys(appData.userAnswers).forEach(k => {
                if (appData.userAnswers[k] !== undefined) {
                    userAnswers[Number(k)] = Number(appData.userAnswers[k]);
                }
            });
        }

        return {
            certKey: String(appData.currentCert || '').trim(),
            quizMode: appData.quizMode === 'practice' ? 'practice' : 'exam',
            currentExamSubject: appData.currentExamSubject || null,
            questionUids: appData.currentQuiz.map(q => getQuestionKey(q)),
            currentIndex: Math.max(0, Math.min(currentIndex, appData.currentQuiz.length - 1)),
            userAnswers,
            checkedQuestions: checkedList,
            flaggedQuestions: flaggedList,
            examEndTime: appData.examEndTime || null,
            timerDurationSeconds: appData.timerDurationSeconds || null,
            savedAt: Number(nowMs) || Date.now()
        };
    }

    function restoreActiveQuiz(saved, questions = [], nowMs = Date.now()) {
        if (!saved || typeof saved !== 'object' || !Array.isArray(saved.questionUids) || saved.questionUids.length === 0) {
            return null;
        }
        const byKey = new Map();
        (questions || []).forEach(q => {
            const key = getQuestionKey(q);
            if (key) byKey.set(key, q);
        });

        const currentQuiz = [];
        const oldToNewIndex = new Map();
        saved.questionUids.forEach((uid, oldIdx) => {
            const matched = byKey.get(String(uid));
            if (matched) {
                oldToNewIndex.set(oldIdx, currentQuiz.length);
                currentQuiz.push(matched);
            }
        });

        if (currentQuiz.length === 0) {
            return null;
        }

        const userAnswers = {};
        if (saved.userAnswers && typeof saved.userAnswers === 'object') {
            Object.keys(saved.userAnswers).forEach(k => {
                const oldIdx = Number(k);
                const val = Number(saved.userAnswers[k]);
                if (oldToNewIndex.has(oldIdx) && Number.isInteger(val)) {
                    userAnswers[oldToNewIndex.get(oldIdx)] = val;
                }
            });
        }

        const checkedSet = new Set();
        if (Array.isArray(saved.checkedQuestions)) {
            saved.checkedQuestions.forEach(idx => {
                const oldIdx = Number(idx);
                if (oldToNewIndex.has(oldIdx)) {
                    checkedSet.add(oldToNewIndex.get(oldIdx));
                }
            });
        }

        const flaggedSet = new Set();
        const flaggedMap = {};
        if (Array.isArray(saved.flaggedQuestions)) {
            saved.flaggedQuestions.forEach(idx => {
                const oldIdx = Number(idx);
                if (oldToNewIndex.has(oldIdx)) {
                    const newIdx = oldToNewIndex.get(oldIdx);
                    flaggedSet.add(newIdx);
                    flaggedMap[newIdx] = true;
                }
            });
        }

        const rawIndex = Number(saved.currentIndex);
        const mappedIndex = oldToNewIndex.has(rawIndex)
            ? oldToNewIndex.get(rawIndex)
            : (Number.isInteger(rawIndex) ? Math.max(0, Math.min(rawIndex, currentQuiz.length - 1)) : 0);

        let timeRemaining = null;
        if (saved.examEndTime && Number.isFinite(Number(saved.examEndTime))) {
            timeRemaining = Math.max(1, Math.floor((Number(saved.examEndTime) - Number(nowMs)) / 1000));
        }

        return {
            certKey: String(saved.certKey || '').trim(),
            quizMode: saved.quizMode === 'practice' ? 'practice' : 'exam',
            currentExamSubject: saved.currentExamSubject || null,
            currentQuiz,
            currentIndex: mappedIndex,
            userAnswers,
            checkedQuestions: checkedSet,
            flaggedQuestions: flaggedMap,
            flaggedSet,
            examEndTime: saved.examEndTime || null,
            timerDurationSeconds: saved.timerDurationSeconds || null,
            timeRemaining
        };
    }

    return {
        ANSWER_PREFIXES,
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
        isPastExamQuestion,
        resolveLegacyQuestion,
        restoreActiveQuiz,
        restoreActiveSession,
        sampleExamQuestions,
        serializeActiveQuiz,
        serializeActiveSession,
        stripOptionPrefix
    };
}));
