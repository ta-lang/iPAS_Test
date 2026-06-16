// IPAS Exam Web Application JS Logic

// Global Application State
let appData = {
    currentCert: '', // Configured dynamically
    questions: [], // Active questions database
    moduleQuestions: {}, // Maps module.id -> array of questions
    currentQuiz: [], // Questions in active session
    userAnswers: {}, // Map of { questionIndex: selectedOptionIndex } (0-3)
    flaggedQuestions: {}, // Map of { questionIndex: boolean }
    currentQuestionIdx: 0,
    quizMode: 'exam', // 'exam' or 'practice'
    timerInterval: null,
    timeRemaining: 4500, // 75 minutes by default (dynamic based on certification)
    timeSpent: 0,
    quizActive: false
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const welcomeScreen = document.getElementById('welcomeScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');

const totalQsCountText = document.getElementById('totalQsCount');
let selectSubject = document.getElementById('selectSubject');
const selectChapter = document.getElementById('selectChapter');
const practiceSetup = document.getElementById('practiceSetup');
const timerDisplay = document.getElementById('timerDisplay');
const timerText = document.getElementById('timerText');
const themeToggle = document.getElementById('themeToggle');

// Quiz View Elements
const lblSubject = document.getElementById('lblSubject');
const lblChapter = document.getElementById('lblChapter');
const lblIndex = document.getElementById('lblIndex');
const qText = document.getElementById('qText');
const optionsList = document.getElementById('optionsList');
const feedbackArea = document.getElementById('feedbackArea');
const feedbackIcon = document.getElementById('feedbackIcon');
const feedbackTitle = document.getElementById('feedbackTitle');
const lblExplanationText = document.getElementById('lblExplanationText');

// Quiz Control Buttons
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnFlag = document.getElementById('btnFlag');
const btnSubmit = document.getElementById('btnSubmit');
const btnExitQuiz = document.getElementById('btnExitQuiz');

// Navigation Panel
const navPanelTitle = document.getElementById('navPanelTitle');
const progressBar = document.getElementById('progressBar');
const lblProgressText = document.getElementById('lblProgressText');
const navGrid = document.getElementById('navGrid');

// Results Screen Elements
const lblScore = document.getElementById('lblScore');
const scoreCircleProgress = document.getElementById('scoreCircleProgress');
const lblResultTitle = document.getElementById('lblResultTitle');
const lblResultDesc = document.getElementById('lblResultDesc');
const lblTimeSpent = document.getElementById('lblTimeSpent');
const lblCorrectCount = document.getElementById('lblCorrectCount');
const lblAnswerRate = document.getElementById('lblAnswerRate');
const subjectBreakdownList = document.getElementById('subjectBreakdownList');
const reviewQuestionsList = document.getElementById('reviewQuestionsList');

// Exam Modal Elements
const examSubjectModal = document.getElementById('examSubjectModal');
const btnCancelExamModal = document.getElementById('btnCancelExamModal');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadQuestions();
    setupEventListeners();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// // Helper to dynamically load external JS scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.charset = 'utf-8';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script ${src}`));
        document.body.appendChild(script);
    });
}

// Load Questions from JSON Database or JS variable
async function loadQuestions() {
    try {
        // Fetch active module flags from Google Sheets config if apiEndpoint is configured
        if (window.EXAM_CONFIG.apiEndpoint && window.EXAM_CONFIG.apiEndpoint !== "YOUR_DEPLOYED_WEB_APP_URL") {
            try {
                const response = await fetch(window.EXAM_CONFIG.apiEndpoint);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.config) {
                        window.EXAM_CONFIG.modules.forEach(mod => {
                            const flagKey = `${mod.id}_enabled`;
                            if (data.config[flagKey] !== undefined) {
                                mod.enabled = data.config[flagKey];
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch dynamic config from GDrive, using local config instead.", e);
            }
        }

        const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
        if (modules.length === 0) {
            throw new Error("No modules are enabled in config.js");
        }
        
        for (const mod of modules) {
            let questions = [];
            
            console.log(`Checking global variable for ${mod.id}: window[${mod.questionsVar}] =`, window[mod.questionsVar]);
            // 1. Try checking global variable (already loaded)
            if (window[mod.questionsVar] && Array.isArray(window[mod.questionsVar]) && window[mod.questionsVar].length > 0) {
                questions = window[mod.questionsVar];
                console.log(`Successfully loaded ${questions.length} questions from global variable for ${mod.id}`);
            } else {
                // 2. Try loading dynamic script (for local file:// protocol)
                try {
                    console.log(`Global variable not found, dynamically loading script ${mod.questionsFile}...`);
                    await loadScript(mod.questionsFile);
                    console.log(`After dynamic script load, window[${mod.questionsVar}] =`, window[mod.questionsVar]);
                    if (window[mod.questionsVar] && Array.isArray(window[mod.questionsVar]) && window[mod.questionsVar].length > 0) {
                        questions = window[mod.questionsVar];
                    }
                } catch (e) {
                    console.warn(`Dynamic script load failed for ${mod.questionsFile}, trying fetch...`, e);
                }
            }
            
            // 3. Fallback to fetch JSON (for http/https servers)
            if (questions.length === 0) {
                try {
                    const response = await fetch(mod.questionsJson);
                    if (response.ok) {
                        questions = await response.json();
                    }
                } catch (e) {
                    console.warn(`Failed to fetch ${mod.questionsJson}: ${e.message}`);
                }
            }
            
            appData.moduleQuestions[mod.id] = questions;
        }
        
        // Render certification selector cards dynamically
        renderCertSelector();
        
        // Set initial default cert type to the first enabled module
        const defaultCert = modules[0].id;
        selectCert(defaultCert);
    } catch (error) {
        console.error(error);
        qText.innerHTML = `<div style="color:#ef4444; font-weight:700;">讀取題庫錯誤：${error.message}<br>請確認是否已產生題庫檔案或 config.js 是否正確。</div>`;
    }
}

// Render certification selector cards dynamically on the welcome page
function renderCertSelector() {
    const certGrid = document.getElementById('certGrid');
    if (!certGrid) return;
    certGrid.innerHTML = '';
    
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    modules.forEach((mod, idx) => {
        const card = document.createElement('div');
        card.className = 'cert-card' + (idx === 0 ? ' active' : '');
        card.id = `btnSelect_${mod.id}`;
        card.dataset.cert = mod.id;
        
        const qCount = appData.moduleQuestions[mod.id] ? appData.moduleQuestions[mod.id].length : 0;
        
        card.innerHTML = `
            <span class="cert-icon">${mod.icon}</span>
            <div class="cert-info">
                <h4>${mod.name}</h4>
                <p>${mod.description} (<span id="lblCount_${mod.id}">${qCount}</span> 題)</p>
            </div>
        `;
        
        card.addEventListener('click', () => selectCert(mod.id));
        certGrid.appendChild(card);
    });
}

// Select certification and update UI
function selectCert(certType) {
    appData.currentCert = certType;
    
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === certType);
    if (!mod) return;
    
    // Update active card class
    modules.forEach(m => {
        const btn = document.getElementById(`btnSelect_${m.id}`);
        if (btn) {
            if (m.id === certType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeDesc = document.getElementById('welcomeDesc');
    const totalSubjectsCount = document.getElementById('totalSubjectsCount');
    const totalChaptersCount = document.getElementById('totalChaptersCount');
    const headerTitle = document.getElementById('headerTitle');
    const appFooterText = document.getElementById('appFooterText');
    
    const isLoginActive = loginScreen && loginScreen.classList.contains('active');
    
    if (isLoginActive) {
        if (headerTitle) headerTitle.textContent = "iPAS 模擬考系統";
        document.title = "iPAS 模擬考系統";
        if (appFooterText) appFooterText.textContent = "© 2026 iPAS 模擬考系統. All Rights Reserved.";
    }
    
    const qCount = appData.moduleQuestions[mod.id] ? appData.moduleQuestions[mod.id].length : 0;
    
    welcomeTitle.textContent = `歡迎使用 IPAS ${mod.name} 備考系統`;
    welcomeDesc.textContent = `本系統整合了官方 115 年最新簡章範圍與教材精選題庫，共計有 ${qCount} 題真實樣題。提供您雙重模式進行衝刺學習：`;
    
    if (!isLoginActive) {
        if (headerTitle) headerTitle.textContent = `IPAS ${mod.name}`;
        document.title = `IPAS ${mod.name} 模擬考試與自主學習系統`;
        if (appFooterText) appFooterText.textContent = `© 2026 IPAS ${mod.name} 備考工作區. All Rights Reserved. 講義內容轉譯自官方教材手冊。`;
    }

    // Update Mode description and Modal description text dynamically based on cert level
    const durationMinutes = (certType === 'ai_mid') ? 90 : 75;
    const examModeDesc = document.getElementById('examModeDesc');
    if (examModeDesc) {
        examModeDesc.innerHTML = `選擇單一考科進行 50 題全真模擬考試。限時 <strong>${durationMinutes}分鐘</strong>，過程中無即時答案與解析，結束後進行完整批改與各科診斷。`;
    }
    const examModalDesc = document.getElementById('examModalDesc');
    if (examModalDesc) {
        examModalDesc.innerHTML = `請選擇您要進行模擬測驗的科目。每科均為 <strong>50 題選擇題</strong>，限時 <strong>${durationMinutes} 分鐘</strong>：`;
    }
    
    appData.questions = appData.moduleQuestions[mod.id] || [];
    
    // Render subject buttons in the exam modal
    renderExamSubjectModalOptions(mod);
    
    if (totalSubjectsCount) {
        totalSubjectsCount.textContent = mod.subjects.length;
    }
    
    // Update stats widget
    if (totalQsCountText) {
        totalQsCountText.textContent = appData.questions.length;
    }
    
    // Calculate unique chapters count
    const uniqueChapters = new Set(appData.questions.map(q => q.chapter));
    if (totalChaptersCount) {
        totalChaptersCount.textContent = uniqueChapters.size;
    }
    
    // Populate chapter and subject filters dynamically
    populateFilters();

    // Refresh persistent stats and wrong pool count
    refreshWrongPoolCount();
    refreshAnsweredStats();
    renderWeaknessCharts();
}

// Render subject buttons in the exam modal dynamically based on active module
function renderExamSubjectModalOptions(mod) {
    const examSubjectOptions = document.getElementById('examSubjectOptions');
    if (!examSubjectOptions) return;
    examSubjectOptions.innerHTML = '';
    
    const durationMinutes = (mod.id === 'ai_mid') ? 90 : 75;
    const romanNumbers = ['❶', '❷', '❸', '❹', '❺'];
    mod.subjects.forEach((subj, idx) => {
        const btn = document.createElement('button');
        btn.className = 'exam-subject-btn card hover-scale';
        btn.id = `btnStartExam_${subj.id}`;
        btn.innerHTML = `
            <span class="subject-icon">${romanNumbers[idx] || (idx + 1)}</span>
            <div class="subject-details">
                <h4>${subj.name}</h4>
                <p>隨機抽取 50 題進行全真模擬考試 (限時 ${durationMinutes} 分鐘)</p>
            </div>
        `;
        
        btn.addEventListener('click', () => startExamSubjectMode(subj.id));
        examSubjectOptions.appendChild(btn);
    });
}

// Populate filters dynamically based on loaded questions
function populateFilters() {
    // Rebuild selectSubject options
    selectSubject.innerHTML = '';
    
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return;
    
    // Add default all option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'all';
    defaultOpt.textContent = '全部科目 (不限)';
    selectSubject.appendChild(defaultOpt);
    
    mod.subjects.forEach(subj => {
        const opt = document.createElement('option');
        opt.value = subj.id;
        opt.textContent = subj.name;
        selectSubject.appendChild(opt);
    });
    
    const chaptersBySubject = {
        'all': new Set()
    };
    mod.subjects.forEach(subj => {
        chaptersBySubject[subj.id] = new Set();
    });
    
    appData.questions.forEach(q => {
        // Find matching subject based on matchKeywords in config
        const matchedSubj = mod.subjects.find(subj => {
            return subj.matchKeywords.some(keyword => q.subject.includes(keyword));
        });
        
        const subjId = matchedSubj ? matchedSubj.id : mod.subjects[0].id;
        
        if (chaptersBySubject[subjId]) {
            chaptersBySubject[subjId].add(q.chapter);
        }
        chaptersBySubject['all'].add(q.chapter);
    });
    
    // Clear and clone to drop old event listeners
    const newSelectSubject = selectSubject.cloneNode(true);
    selectSubject.parentNode.replaceChild(newSelectSubject, selectSubject);
    selectSubject = newSelectSubject;
    
    newSelectSubject.addEventListener('change', () => {
        const selectedSubj = newSelectSubject.value;
        selectChapter.innerHTML = '<option value="all">全部章節 (不限)</option>';
        
        if (chaptersBySubject[selectedSubj]) {
            chaptersBySubject[selectedSubj].forEach(chap => {
                const opt = document.createElement('option');
                opt.value = chap;
                opt.textContent = chap;
                selectChapter.appendChild(opt);
            });
        }
    });
    
    // Trigger initial change
    newSelectSubject.dispatchEvent(new Event('change'));
}

// Setup Main Event Listeners
function setupEventListeners() {
    // Login Verification Event Listener
    const btnLogin = document.getElementById('btnLogin');
    const txtNationalID = document.getElementById('txtNationalID');
    if (btnLogin && txtNationalID) {
        btnLogin.addEventListener('click', handleLogin);
        txtNationalID.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    // Navigation setup
    document.getElementById('btnStartExam').addEventListener('click', showExamSubjectModal);
    document.getElementById('btnStartPractice').addEventListener('click', enterPracticeSetup);
    document.getElementById('btnStartStudy').addEventListener('click', showStudyNoteModal);
    document.getElementById('btnApplyPractice').addEventListener('click', startPracticeMode);
    
    // Exam Modal Action Bindings
    if (btnCancelExamModal) btnCancelExamModal.addEventListener('click', hideExamSubjectModal);
    if (btnCancelStudyModal) btnCancelStudyModal.addEventListener('click', () => studyNoteModal.classList.remove('active'));

    // Reader back button
    document.getElementById('btnBackFromReader')?.addEventListener('click', () => {
        const readerScreen = document.getElementById('readerScreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (readerScreen && welcomeScreen) transitionScreen(readerScreen, welcomeScreen);
    });
    
    btnPrev.addEventListener('click', prevQuestion);
    btnNext.addEventListener('click', nextQuestion);
    btnFlag.addEventListener('click', toggleFlag);
    btnSubmit.addEventListener('click', confirmSubmitExam);
    btnExitQuiz.addEventListener('click', exitQuizSession);
    
    document.getElementById('btnRestartQuiz').addEventListener('click', () => {
        transitionScreen(resultsScreen, welcomeScreen);
    });
    
    document.getElementById('btnBackToWelcome').addEventListener('click', () => {
        transitionScreen(resultsScreen, welcomeScreen);
    });

    // Weakness toggle
    const weaknessToggle = document.getElementById('weaknessToggle');
    const weaknessBody = document.getElementById('weaknessBody');
    if (weaknessToggle && weaknessBody) {
        weaknessToggle.addEventListener('click', () => {
            const isHidden = weaknessBody.style.display === 'none';
            weaknessBody.style.display = isHidden ? 'block' : 'none';
            weaknessToggle.textContent = isHidden ? '▲ 收合' : '▼ 展開';
            if (isHidden) renderWeaknessCharts();
        });
    }

    // IRT Dashboard navigation
    document.getElementById('btnShowIrt')?.addEventListener('click', showIrtDashboard);
    document.getElementById('btnBackFromIrt')?.addEventListener('click', () => {
        const irtScreen = document.getElementById('irtScreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (irtScreen && welcomeScreen) transitionScreen(irtScreen, welcomeScreen);
    });

    // IRT sort buttons
    document.querySelectorAll('.irt-sort').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.irt-sort').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const sort = e.currentTarget.getAttribute('data-sort');
            const wrongPool = await getWrongPool(appData.currentCert);
            const qStats = await loadQuestionStats(appData.currentCert);
            const qIndex = {};
            if (appData.questions) appData.questions.forEach(q => { qIndex[q.num] = q; });
            const qMap = {};
            for (const s of qStats) { qMap[s.num] = { correct: s.correct, wrong: s.wrong }; }
            for (const w of wrongPool) {
                if (!qMap[w.num]) qMap[w.num] = { correct: 0, wrong: 0 };
                qMap[w.num].lastWrong = w.lastWrongDate || '';
                qMap[w.num].wrong = Math.max(qMap[w.num].wrong, w.wrongCount || 1);
                qMap[w.num].subject = w.subject || (qIndex[w.num] && qIndex[w.num].subject) || '';
                qMap[w.num].chapter = w.chapter || (qIndex[w.num] && qIndex[w.num].chapter) || '';
                qMap[w.num].assessmentTopic = w.assessmentTopic || (qIndex[w.num] && qIndex[w.num].assessmentTopic) || '';
            }
            for (const num of Object.keys(qMap)) {
                if (!qMap[num].subject && qIndex[num]) {
                    qMap[num].subject = qIndex[num].subject || '';
                    qMap[num].chapter = qIndex[num].chapter || '';
                    qMap[num].assessmentTopic = qIndex[num].assessmentTopic || '';
                }
            }
            let rows = Object.entries(qMap).map(([num, d]) => {
                const total = d.correct + d.wrong;
                const rate = total > 0 ? Math.round((d.correct / total) * 100) : 0;
                const diffScore = total > 0 ? Math.round((1 - d.correct / total) * 100) : 0;
                return { num, correct: d.correct, wrong: d.wrong, total, rate, diffScore, lastWrong: d.lastWrong || '', subject: d.subject || '', chapter: d.chapter || '', assessmentTopic: d.assessmentTopic || '' };
            });
            switch (sort) {
                case 'difficulty': rows.sort((a, b) => b.diffScore - a.diffScore); break;
                case 'wrong': rows.sort((a, b) => b.wrong - a.wrong); break;
                case 'recent': rows.sort((a, b) => (b.lastWrong || '').localeCompare(a.lastWrong || '')); break;
            }
            renderIrtTable(rows);
        });
    });

    // Result Filter controls
    const filterButtons = document.querySelectorAll('.filter-controls button');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            filterReviewList(e.currentTarget.getAttribute('data-filter'));
        });
    });
}

// Transition helper
function transitionScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
    toScreen.scrollIntoView({ behavior: 'smooth' });
}

// Welcome to Practice Setup
function enterPracticeSetup() {
    practiceSetup.classList.remove('hidden');
    timerDisplay.classList.add('hidden');
    appData.quizMode = 'practice';
    
    // Trigger change event to populate chapters initially
    selectSubject.dispatchEvent(new Event('change'));
    
    // Show quiz screen but keep question area blank until "開始練習" is clicked
    transitionScreen(welcomeScreen, quizScreen);
    qText.innerHTML = '<div class="text-secondary" style="text-align:center; padding:40px;">請於上方設定練習範圍，然後點擊「開始練習」！</div>';
    optionsList.innerHTML = '';
    feedbackArea.classList.add('hidden');
    document.querySelector('.quiz-nav-panel').classList.add('hidden');
}

// Start Practice Mode Session
function startPracticeMode() {
    const subjVal = document.getElementById('selectSubject').value;
    const chapVal = selectChapter.value;
    const numLimit = document.getElementById('practiceNum').value;
    
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return;
    
    // Filter questions based on criteria
    let filtered = appData.questions.filter(q => {
        let isSubjMatch = false;
        if (subjVal === 'all') {
            isSubjMatch = true;
        } else {
            const targetSubj = mod.subjects.find(s => s.id === subjVal);
            if (targetSubj) {
                isSubjMatch = targetSubj.matchKeywords.some(keyword => q.subject.includes(keyword));
            }
        }
        
        const isChapMatch = chapVal === 'all' || q.chapter === chapVal;
        return isSubjMatch && isChapMatch;
    });
    
    if (filtered.length === 0) {
        alert('此範圍內無題目，請重新選擇！');
        return;
    }
    
    // Shuffle filtered questions
    filtered = shuffleArray(filtered);
    
    // Apply length limit
    if (numLimit !== 'all') {
        const limit = parseInt(numLimit);
        filtered = filtered.slice(0, Math.min(limit, filtered.length));
    }
    
    // Set current quiz
    appData.currentQuiz = filtered;
    initQuizSession('practice');
}

// Show/Hide Exam Subject Selection Modal
// ════════════════════════════════════════════════════════════════
// 課程學習模式 — 講義閱讀
// ════════════════════════════════════════════════════════════════

const studyNoteModal = document.getElementById('studyNoteModal');
const btnCancelStudyModal = document.getElementById('btnCancelStudyModal');

function showStudyNoteModal() {
    if (!appData.currentCert || !studyNoteModal) return;
    const container = document.getElementById('studyNoteOptions');
    if (!container) return;
    container.innerHTML = '';

    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod || !mod.studyNotes || mod.studyNotes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">此證照暫無講義資料</p>';
        return;
    }
    mod.studyNotes.forEach((note, idx) => {
        if (note.subjectGroup) {
            const header = document.createElement('div');
            header.className = 'note-group-header';
            header.textContent = note.subjectGroup;
            container.appendChild(header);
            return;
        }
        if (note.topicGroup) {
            const sub = document.createElement('div');
            sub.className = 'note-topic-header';
            sub.textContent = note.topicGroup;
            container.appendChild(sub);
            return;
        }
        if (!note.file) return;
        const btn = document.createElement('button');
        btn.className = 'exam-subject-btn card hover-scale note-item-btn';
        btn.innerHTML = `<strong>${note.title}</strong>`;
        btn.addEventListener('click', () => {
            studyNoteModal.classList.remove('active');
            openReader(note.title, note.file);
        });
        container.appendChild(btn);
    });
    studyNoteModal.classList.add('active');
}

async function openReader(title, filePath) {
    const readerScreen = document.getElementById('readerScreen');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const readerTitle = document.getElementById('readerTitle');
    const readerContent = document.getElementById('readerContent');
    if (!readerScreen || !readerContent || !readerTitle) return;

    readerTitle.textContent = title;
    readerContent.innerHTML = '載入中...';
    if (welcomeScreen) transitionScreen(welcomeScreen, readerScreen);

    try {
        const resp = await fetch(filePath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const md = await resp.text();
        if (typeof marked !== 'undefined') {
            readerContent.innerHTML = marked.parse(md);
        } else {
            readerContent.innerHTML = `<pre style="white-space:pre-wrap;">${md}</pre>`;
        }
        // Apply syntax highlight-friendly styles to code blocks
        readerContent.querySelectorAll('pre code').forEach(block => {
            block.classList.add('code-block');
        });
        if (typeof mermaid !== 'undefined') {
            mermaid.run({ nodes: readerContent.querySelectorAll('.language-mermaid') });
        }
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(readerContent, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }
    } catch (e) {
        const hint = (location.protocol === 'file:')
            ? '<br><small style="color:var(--text-secondary);">提示：在瀏覽器直接開啟 HTML 檔案時無法讀取筆記，請使用本機伺服器啟動：<br><code style="background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:4px;">npx serve exam</code> 或 <code style="background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:4px;">python -m http.server 8000 -d exam</code></small>'
            : '';
        readerContent.innerHTML = `<p style="color:var(--danger);">載入失敗：${e.message}${hint}</p>`;
    }
}

function showExamSubjectModal() {
    if (examSubjectModal) examSubjectModal.classList.add('active');
}

// Start Mock Exam for a specific subject (50 Questions / Dynamic Minutes)
function hideExamSubjectModal() {
    if (examSubjectModal) examSubjectModal.classList.remove('active');
}

function startExamSubjectMode(subjKey) {
    hideExamSubjectModal();
    
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return;
    
    const targetSubj = mod.subjects.find(s => s.id === subjKey);
    if (!targetSubj) return;
    
    // Filter questions belonging to this subject
    let pool = appData.questions.filter(q => {
        return targetSubj.matchKeywords.some(keyword => q.subject.includes(keyword));
    });
    
    if (pool.length < 50) {
        alert(`該考科題庫僅有 ${pool.length} 題，不足 50 題，無法生成全真模擬考！`);
        return;
    }
    
    // Group by chapter for proportional allocation
    const chapterGroups = {};
    pool.forEach(q => {
        const ch = q.chapter || '未分類';
        if (!chapterGroups[ch]) chapterGroups[ch] = [];
        chapterGroups[ch].push(q);
    });
    
    const chapters = Object.keys(chapterGroups);
    const TOTAL = 50;
    const allocation = {};
    let allocated = 0;
    chapters.forEach(ch => {
        const raw = (chapterGroups[ch].length / pool.length) * TOTAL;
        allocation[ch] = Math.floor(raw);
        allocated += allocation[ch];
    });
    // Distribute remainder by largest fractional part
    const remainders = chapters.map(ch => ({
        ch,
        rem: (chapterGroups[ch].length / pool.length) * TOTAL - allocation[ch]
    })).sort((a, b) => b.rem - a.rem);
    for (let i = 0; i < TOTAL - allocated; i++) {
        allocation[remainders[i].ch]++;
    }
    
    // Draw proportionally from each chapter, then shuffle for mixed order
    let selected = [];
    chapters.forEach(ch => {
        selected = selected.concat(shuffleArray(chapterGroups[ch]).slice(0, allocation[ch]));
    });
    appData.currentQuiz = shuffleArray(selected);
    appData.quizMode = 'exam';
    
    practiceSetup.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    
    initQuizSession('exam');
}



// Common initialization for a quiz session
function initQuizSession(mode) {
    appData.userAnswers = {};
    appData.flaggedQuestions = {};
    appData.currentQuestionIdx = 0;
    appData.quizActive = true;
    
    const durationMinutes = (appData.currentCert === 'ai_mid') ? 90 : 75;
    appData.timeRemaining = durationMinutes * 60;
    appData.timeSpent = 0;
    
    document.querySelector('.quiz-nav-panel').classList.remove('hidden');
    
    // Handle timer
    clearInterval(appData.timerInterval);
    if (mode === 'exam') {
        startTimer();
    } else {
        timerDisplay.classList.add('hidden');
    }
    
    // Update Layout Titles
    navPanelTitle.textContent = mode === 'exam' ? '全真考卷答題進度' : '練習題目清單';
    
    // Build navigation buttons grid
    buildNavGrid();
    
    // Show quiz screen
    if (welcomeScreen.classList.contains('active')) {
        transitionScreen(welcomeScreen, quizScreen);
    }
    
    // Load first question
    showQuestion(0);
}

// Shuffling array helper
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Timer management
function startTimer() {
    updateTimerText();
    appData.timerInterval = setInterval(() => {
        appData.timeRemaining--;
        appData.timeSpent++;
        updateTimerText();
        
        if (appData.timeRemaining <= 0) {
            clearInterval(appData.timerInterval);
            alert('考試時間截止！系統將自動為您繳卷。');
            gradeQuiz();
        }
    }, 1000);
}

function updateTimerText() {
    const mins = Math.floor(appData.timeRemaining / 60);
    const secs = appData.timeRemaining % 60;
    timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Alert color change under 5 minutes (300s)
    if (appData.timeRemaining <= 300) {
        timerDisplay.style.background = 'rgba(239, 68, 68, 0.35)';
        timerDisplay.style.borderColor = 'rgba(239, 68, 68, 0.7)';
    } else {
        timerDisplay.style.background = '';
        timerDisplay.style.borderColor = '';
    }
}

// Build Question Grid
function buildNavGrid() {
    navGrid.innerHTML = '';
    appData.currentQuiz.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.id = `navBtn_${idx}`;
        btn.textContent = idx + 1;
        btn.addEventListener('click', () => showQuestion(idx));
        navGrid.appendChild(btn);
    });
    updateProgress();
}

// Update progression metrics
function updateProgress() {
    const total = appData.currentQuiz.length;
    const answered = Object.keys(appData.userAnswers).length;
    const pct = total > 0 ? (answered / total) * 100 : 0;
    
    progressBar.style.width = `${pct}%`;
    lblProgressText.textContent = `已回答 ${answered} / ${total} 題 (${Math.round(pct)}%)`;
}

// Display specific question
function showQuestion(idx) {
    appData.currentQuestionIdx = idx;
    const q = appData.currentQuiz[idx];
    
    // Update headers
    lblSubject.textContent = q.subject;
    lblChapter.textContent = q.chapter;
    lblIndex.textContent = `第 ${idx + 1} / ${appData.currentQuiz.length} 題 (原始題號: ${q.num})`;
    const lblTopic = document.getElementById('lblTopic');
    const contentCode = q.assessmentContent || '';
    if (lblTopic) lblTopic.textContent = q.assessmentTopic ? (q.assessmentTopic + (contentCode ? ' > ' + contentCode : '')) : '';
    
    // Update active nav button state
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('current'));
    const activeNavBtn = document.getElementById(`navBtn_${idx}`);
    if (activeNavBtn) activeNavBtn.classList.add('current');
    
    // Render question text
    qText.innerHTML = formatQuestionText(q.question);
    
    // Render options
    optionsList.innerHTML = '';
    const prefixes = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, oIdx) => {
        const card = document.createElement('div');
        card.className = 'option-card card';
        if (appData.userAnswers[idx] === oIdx) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="option-prefix">${prefixes[oIdx]}</div>
            <div class="option-text">${opt}</div>
        `;
        
        // Handle option selection click
        card.addEventListener('click', () => selectOption(idx, oIdx));
        optionsList.appendChild(card);
    });
    
    // Toggle Prev/Next buttons
    btnPrev.disabled = idx === 0;
    
    if (idx === appData.currentQuiz.length - 1) {
        btnNext.classList.add('hidden');
        if (appData.quizMode === 'exam') {
            btnSubmit.classList.remove('hidden');
        }
    } else {
        btnNext.classList.remove('hidden');
        btnSubmit.classList.add('hidden');
    }
    
    // Toggle flagged style
    if (appData.flaggedQuestions[idx]) {
        btnFlag.classList.add('active');
        btnFlag.innerHTML = `
            <svg class="icon-star" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            已標記待複習
        `;
    } else {
        btnFlag.classList.remove('active');
        btnFlag.innerHTML = `
            <svg class="icon-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            標記待複習
        `;
    }
    
    // Handle Feedback display (Practice mode only)
    if (appData.quizMode === 'practice' && appData.userAnswers[idx] !== undefined) {
            showPracticeFeedback(idx);
    } else {
        feedbackArea.classList.add('hidden');
    }
}

// Option selection action
function selectOption(qIdx, oIdx) {
    const q = appData.currentQuiz[qIdx];
    
    // If practice mode and already answered, lock it
    if (appData.quizMode === 'practice' && appData.userAnswers[qIdx] !== undefined) {
        return;
    }
    
    appData.userAnswers[qIdx] = oIdx;
    
    // Update nav button class
    const btn = document.getElementById(`navBtn_${qIdx}`);
    if (btn) btn.classList.add('answered');
    
    // Redraw current question to apply selection styles
    showQuestion(qIdx);
    updateProgress();
    
    // If practice mode, render feedback immediately
    if (appData.quizMode === 'practice') {
        showPracticeFeedback(qIdx);
    }
}

// Immediate feedback for Practice Mode
function showPracticeFeedback(qIdx) {
    const q = appData.currentQuiz[qIdx];
    const userChoiceIdx = appData.userAnswers[qIdx];
    const correctLetter = q.answer;
    
    const prefixes = ['A', 'B', 'C', 'D'];
    const correctIdx = prefixes.indexOf(correctLetter);
    
    const isCorrect = userChoiceIdx === correctIdx;
    
    // Apply styling classes to the cards
    const cards = optionsList.querySelectorAll('.option-card');
    cards.forEach((card, idx) => {
        card.classList.remove('selected');
        if (idx === correctIdx) {
            card.classList.add('correct');
        } else if (idx === userChoiceIdx) {
            card.classList.add('wrong');
        }
    });
    
    // Populate feedback area
    feedbackArea.className = `feedback-box animate-fade-in ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackIcon.textContent = isCorrect ? '✅' : '❌';
    feedbackTitle.textContent = isCorrect ? '答對了！' : `答錯了！正確答案是 (${correctLetter})`;
    
    // Set explanation text
    let explText = `標準答案：(${correctLetter}) ${q.ans_text}\n\n`;
    if (q.explanation) {
        explText += `解析：\n${q.explanation}`;
    } else {
        explText += '無額外解析資訊。';
    }
    lblExplanationText.textContent = explText;
    feedbackArea.classList.remove('hidden');
}

// Star flagging toggle
function toggleFlag() {
    const idx = appData.currentQuestionIdx;
    appData.flaggedQuestions[idx] = !appData.flaggedQuestions[idx];
    
    const btn = document.getElementById(`navBtn_${idx}`);
    if (btn) {
        if (appData.flaggedQuestions[idx]) {
            btn.classList.add('flagged');
        } else {
            btn.classList.remove('flagged');
        }
    }
    
    showQuestion(idx);
}

// Previous/Next navigation functions
function prevQuestion() {
    if (appData.currentQuestionIdx > 0) {
        showQuestion(appData.currentQuestionIdx - 1);
    }
}

function nextQuestion() {
    if (appData.currentQuestionIdx < appData.currentQuiz.length - 1) {
        showQuestion(appData.currentQuestionIdx + 1);
    }
}

// Submit confirmations
function confirmSubmitExam() {
    const total = appData.currentQuiz.length;
    const answered = Object.keys(appData.userAnswers).length;
    const unanswered = total - answered;
    
    let confirmMsg = '您確定要交卷嗎？';
    if (unanswered > 0) {
        confirmMsg = `您還有 ${unanswered} 題尚未回答！確定要交卷嗎？`;
    }
    
    if (confirm(confirmMsg)) {
        gradeQuiz();
    }
}

function exitQuizSession() {
    if (confirm('您確定要退出本次測驗嗎？這會遺失當前的進度。')) {
        clearInterval(appData.timerInterval);
        appData.quizActive = false;
        transitionScreen(quizScreen, welcomeScreen);
    }
}

// Grading Algorithm
function gradeQuiz() {
    clearInterval(appData.timerInterval);
    appData.quizActive = false;
    
    const total = appData.currentQuiz.length;
    let correctCount = 0;
    
    // Subject stats structures built dynamically
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    
    let subjectStats = {};
    if (mod) {
        mod.subjects.forEach(subj => {
            subjectStats[subj.id] = { name: subj.name, total: 0, correct: 0 };
        });
    }
    
    const prefixes = ['A', 'B', 'C', 'D'];
    
    appData.currentQuiz.forEach((q, idx) => {
        let subjKey = null;
        if (mod) {
            const matchedSubj = mod.subjects.find(subj => {
                return subj.matchKeywords.some(keyword => q.subject.includes(keyword));
            });
            if (matchedSubj) {
                subjKey = matchedSubj.id;
            }
        }
        
        // Fallback to the first subject if no match found
        if (!subjKey && mod && mod.subjects.length > 0) {
            subjKey = mod.subjects[0].id;
        }
        
        if (subjKey && subjectStats[subjKey]) {
            subjectStats[subjKey].total++;
        }
        
        const userChoiceIdx = appData.userAnswers[idx];
        const correctIdx = prefixes.indexOf(q.answer);
        
        if (userChoiceIdx === correctIdx) {
            correctCount++;
            if (subjKey && subjectStats[subjKey]) {
                subjectStats[subjKey].correct++;
            }
            q.gradedResult = 'correct';
        } else {
            q.gradedResult = 'wrong';
        }
    });
    
    // Calculations
    const score = Math.round((correctCount / total) * 100);
    const passed = score >= 70;
    
    // Display dashboard scores
    lblScore.textContent = score;
    
    // Score Circle Animation
    const circumference = 283; // 2 * PI * r (45) = 282.7
    const offset = circumference - (score / 100) * circumference;
    scoreCircleProgress.style.strokeDashoffset = offset;
    scoreCircleProgress.style.stroke = passed ? 'var(--success)' : 'var(--danger)';
    
    // Feedback details text
    lblResultTitle.textContent = passed ? '🎉 及格！恭喜通過！' : '⚠️ 分數未及格，請繼續加油！';
    lblResultTitle.style.color = passed ? 'var(--success)' : 'var(--danger)';
    lblResultDesc.textContent = passed ? 
        '恭喜你達到 70 分及格門檻，你已經具備一定的專業水準！' : 
        '離 70 分及格門檻差了一點，建議檢驗下方錯題，並複習相關單元講義。';
        
    // Standard statistics labels
    const minsUsed = Math.floor(appData.timeSpent / 60);
    const secsUsed = appData.timeSpent % 60;
    lblTimeSpent.textContent = appData.quizMode === 'exam' ? 
        `${minsUsed} 分 ${secsUsed} 秒` : '無限制';
        
    lblCorrectCount.textContent = `${correctCount} / ${total} 題`;
    lblAnswerRate.textContent = `${Math.round((Object.keys(appData.userAnswers).length / total) * 100)}%`;
    
    // Build breakdown bars
    buildBreakdownHTML(subjectStats);
    
    // Render the final review accordion list
    renderReviewList();
    
    // Show Screen
    transitionScreen(quizScreen, resultsScreen);
}

// Subject breakdown GUI list rendering
function buildBreakdownHTML(stats) {
    subjectBreakdownList.innerHTML = '';
    
    for (const key in stats) {
        const data = stats[key];
        if (data.total === 0) continue; // Skip subjects with no questions in this test
        const pct = data.total > 0 ? (data.correct / data.total) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <div class="breakdown-info">
                <span class="breakdown-label">${data.name}</span>
                <span class="breakdown-val">${data.correct} / ${data.total} 答對 (${Math.round(pct)}%)</span>
            </div>
            <div class="breakdown-bar-container">
                <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
            </div>
        `;
        subjectBreakdownList.appendChild(item);
    }
}

// Render Review Accordion list
function renderReviewList() {
    reviewQuestionsList.innerHTML = '';
    const prefixes = ['A', 'B', 'C', 'D'];
    
    appData.currentQuiz.forEach((q, idx) => {
        const userChoiceIdx = appData.userAnswers[idx];
        const correctIdx = prefixes.indexOf(q.answer);
        
        const isCorrect = q.gradedResult === 'correct';
        const userChoiceLetter = userChoiceIdx !== undefined ? prefixes[userChoiceIdx] : '未答';
        
        const accordion = document.createElement('div');
        accordion.className = `accordion-item ${isCorrect ? 'correct-item' : 'wrong-item'}`;
        accordion.dataset.graded = q.gradedResult;
        accordion.dataset.flagged = appData.flaggedQuestions[idx] ? 'true' : 'false';
        
        let optionsHtml = '';
        q.options.forEach((opt, oIdx) => {
            let optClass = '';
            if (oIdx === correctIdx) {
                optClass = 'correct';
            } else if (oIdx === userChoiceIdx) {
                optClass = 'wrong';
            }
            optionsHtml += `
                <div class="option-card card ${optClass}" style="cursor: default; pointer-events: none;">
                    <div class="option-prefix">${prefixes[oIdx]}</div>
                    <div class="option-text">${opt}</div>
                </div>
            `;
        });
        
        accordion.innerHTML = `
            <div class="accordion-header">
                <span class="accordion-header-text">
                    <strong>第 ${idx + 1} 題：</strong>${formatQuestionText(q.question)}
                </span>
                <div class="accordion-badge-container">
                    <span class="badge ${isCorrect ? '' : 'badge-accent'}">${isCorrect ? '答對' : '答錯'}</span>
                    ${appData.flaggedQuestions[idx] ? '<span class="badge badge-accent">★ 待複習</span>' : ''}
                    <svg class="icon-arrow-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
            <div class="accordion-content">
                <div class="options-list" style="margin-bottom: 20px;">
                    ${optionsHtml}
                </div>
                <div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}" style="margin: 0;">
                    <div class="feedback-header">
                        <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
                        <span class="feedback-title">你的回答：${userChoiceLetter} | 標準答案：${q.answer}</span>
                    </div>
                    <div class="feedback-body">
                        <p><strong>標準選項：</strong>(${q.answer}) ${q.ans_text}</p>
                        ${q.explanation ? `<p style="margin-top:10px;"><strong>官方詳細解析：</strong><br>${q.explanation}</p>` : ''}
                        <p style="margin-top:10px; font-size:12px; color:var(--text-muted);">
                            類別：${q.subject} > ${q.chapter} | ${q.assessmentTopic || ''}${q.assessmentContent ? ' > ' + q.assessmentContent : ''} | 原始題號: ${q.num}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Toggle Accordion Click
        accordion.querySelector('.accordion-header').addEventListener('click', () => {
            accordion.classList.toggle('open');
        });
        
        reviewQuestionsList.appendChild(accordion);
    });
}

// Review filters logic
function filterReviewList(filterType) {
    const items = reviewQuestionsList.querySelectorAll('.accordion-item');
    items.forEach(item => {
        const graded = item.dataset.graded;
        const flagged = item.dataset.flagged === 'true';
        
        if (filterType === 'all') {
            item.classList.remove('hidden');
        } else if (filterType === 'wrong' && graded === 'wrong') {
            item.classList.remove('hidden');
        } else if (filterType === 'correct' && graded === 'correct') {
            item.classList.remove('hidden');
        } else if (filterType === 'flagged' && flagged) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// Markdown and code block formatter helper
function formatQuestionText(text) {
    if (!text) return '';
    
    // Escape HTML to prevent XSS
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
        
    // Convert ```code``` blocks
    escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre class="code-block ${lang ? 'lang-' + lang : ''}"><code>${code.trim()}</code></pre>`;
    });
    
    // Convert `inline code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    return escaped;
}

// Taiwan ID validation functions
async function handleLogin() {
    const txtNationalID = document.getElementById('txtNationalID');
    const loginError = document.getElementById('loginError');
    const idVal = txtNationalID.value.trim().toUpperCase();
    const btnLogin = document.getElementById('btnLogin');
    
    if (!validateTaiwanID(idVal)) {
        loginError.textContent = "⚠️ 身分證格式不正確，請重新輸入！";
        loginError.style.display = 'block';
        return;
    }
    
    // Check if cloud validation is enabled
    if (window.EXAM_CONFIG.apiEndpoint && window.EXAM_CONFIG.apiEndpoint !== "YOUR_DEPLOYED_WEB_APP_URL") {
        btnLogin.disabled = true;
        btnLogin.textContent = "驗證中...";
        loginError.style.display = 'none';
        
        try {
            const response = await fetch(window.EXAM_CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8' // Use text/plain to prevent CORS preflight OPTIONS request
                },
                body: JSON.stringify({
                    national_id: idVal,
                    user_agent: navigator.userAgent
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loginError.style.display = 'none';
                    
                    // Filter certificate modules based on user authorization
                    const authCerts = data.authorized_certs || "";
                    if (authCerts !== "*") {
                        const allowedList = authCerts.split(',').map(s => s.trim());
                        window.EXAM_CONFIG.modules.forEach(mod => {
                            if (!allowedList.includes(mod.id)) {
                                mod.enabled = false;
                            }
                        });
                    }
                    
                    // Re-render certificate grids after filtering
                    renderCertSelector();
                    
                    // Auto select the first authorized certificate
                    const activeModules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
                    if (activeModules.length > 0) {
                        appData.currentCert = activeModules[0].id;
                    }
                    
                    transitionScreen(loginScreen, welcomeScreen);
                    selectCert(appData.currentCert);
                } else {
                    loginError.textContent = `⚠️ 驗證失敗：${data.message || '查無此帳號！'}`;
                    loginError.style.display = 'block';
                }
            } else {
                loginError.textContent = "⚠️ 伺服器連線失敗，請稍後再試！";
                loginError.style.display = 'block';
            }
        } catch (e) {
            console.error("Cloud validation error:", e);
            loginError.textContent = "⚠️ 雲端資料庫連線出錯，請確認網路或 API URL 設定！";
            loginError.style.display = 'block';
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = "驗證並登入系統";
        }
    } else {
        // Fallback to offline mode
        loginError.style.display = 'none';
        transitionScreen(loginScreen, welcomeScreen);
        selectCert(appData.currentCert);
    }
}

function validateTaiwanID(id) {
    if (!id || id.length !== 10) return false;
    id = id.toUpperCase();
    const regex = /^[A-Z][12]\d{8}$/;
    if (!regex.test(id)) return false;
    
    const letterMap = {
        'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
        'I': 34, 'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22, 'O': 35, 'P': 23,
        'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
        'Y': 31, 'Z': 33
    };
    
    const letterNum = letterMap[id[0]];
    const n1 = Math.floor(letterNum / 10);
    const n2 = letterNum % 10;
    
    let sum = n1 * 1 + n2 * 9;
    for (let i = 1; i <= 8; i++) {
        sum += parseInt(id[i]) * (9 - i);
    }
    sum += parseInt(id[9]) * 1;
    
    return sum % 10 === 0;
}

// ════════════════════════════════════════════════════════════════
// IndexedDB 持久化儲存 + SM-2 間隔複習模組
// ════════════════════════════════════════════════════════════════

const DB_NAME = 'iPAS_Exam_DB';
const DB_VERSION = 3;

function createSM2Card() {
    return { repetitions: 0, interval: 0, efactor: 2.5, nextReviewDate: new Date().toISOString().split('T')[0] };
}

function sm2Schedule(card, quality) {
    if (quality >= 3) {
        if (card.repetitions === 0) card.interval = 1;
        else if (card.repetitions === 1) card.interval = 6;
        else card.interval = Math.round(card.interval * card.efactor);
        card.repetitions++;
    } else {
        card.repetitions = 0;
        card.interval = 1;
    }
    card.efactor = Math.max(1.3, card.efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + card.interval);
    card.nextReviewDate = nextDate.toISOString().split('T')[0];
    return card;
}

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('wrongPool')) {
                const store = db.createObjectStore('wrongPool', { keyPath: 'id' });
                store.createIndex('certId', 'certId', { unique: false });
                store.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
            }
            if (!db.objectStoreNames.contains('stats')) {
                db.createObjectStore('stats', { keyPath: 'certId' });
            }
            if (!db.objectStoreNames.contains('quizHistory')) {
                const store = db.createObjectStore('quizHistory', { keyPath: 'sessionId', autoIncrement: true });
                store.createIndex('certId', 'certId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!db.objectStoreNames.contains('questionStats')) {
                const store = db.createObjectStore('questionStats', { keyPath: 'id' });
                store.createIndex('certId', 'certId', { unique: false });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function getWrongPool(certId) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('wrongPool', 'readonly');
            const index = tx.objectStore('wrongPool').index('certId');
            const req = index.getAll(certId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 讀取錯題池失敗:', e);
        return [];
    }
}

async function addWrongQuestion(certId, q) {
    try {
        const db = await openDB();
        const prefixes = ['A', 'B', 'C', 'D'];
        const correctIdx = prefixes.indexOf(q.answer);
        const entry = {
            id: `${certId}_${q.num}`,
            certId: certId,
            num: q.num,
            subject: q.subject,
            chapter: q.chapter,
            assessmentTopic: q.assessmentTopic || '',
            assessmentContent: q.assessmentContent || '',
            question: q.question,
            options: q.options,
            answer: q.answer,
            ans_text: q.ans_text,
            explanation: q.explanation || '',
            lastWrongDate: new Date().toISOString(),
            wrongCount: 1,
            ...createSM2Card()
        };
        return new Promise((resolve, reject) => {
            const tx = db.transaction('wrongPool', 'readwrite');
            const store = tx.objectStore('wrongPool');
            const getReq = store.get(entry.id);
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (existing) {
                    existing.wrongCount = (existing.wrongCount || 0) + 1;
                    existing.lastWrongDate = new Date().toISOString();
                    existing.subject = q.subject;
                    existing.chapter = q.chapter;
                    existing.assessmentTopic = q.assessmentTopic || '';
                    existing.assessmentContent = q.assessmentContent || '';
                    existing.question = q.question;
                    existing.options = q.options;
                    existing.answer = q.answer;
                    existing.ans_text = q.ans_text;
                    existing.explanation = q.explanation || '';
                    store.put(existing);
                } else {
                    store.put(entry);
                }
                resolve();
            };
            getReq.onerror = () => reject(getReq.error);
        });
    } catch (e) {
        console.warn('IndexedDB 寫入錯題失敗:', e);
    }
}

async function updateWrongPoolAfterCorrect(certId, quizId) {
    try {
        const db = await openDB();
        const id = `${certId}_${quizId}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('wrongPool', 'readwrite');
            const store = tx.objectStore('wrongPool');
            const req = store.get(id);
            req.onsuccess = () => {
                const entry = req.result;
                if (entry) {
                    const updated = sm2Schedule(entry, 4);
                    store.put(updated);
                }
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 更新錯題排程失敗:', e);
    }
}

async function loadStats(certId) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('stats', 'readonly');
            const req = tx.objectStore('stats').get(certId);
            req.onsuccess = () => {
                if (req.result) resolve(req.result);
                else resolve({ certId, totalAnswered: 0, totalCorrect: 0, quizCount: 0 });
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 讀取統計失敗:', e);
        return { certId, totalAnswered: 0, totalCorrect: 0, quizCount: 0 };
    }
}

async function saveStats(certId, deltaCorrect, deltaTotal) {
    try {
        const stats = await loadStats(certId);
        stats.totalAnswered += deltaTotal;
        stats.totalCorrect += deltaCorrect;
        stats.quizCount = (stats.quizCount || 0) + 1;
        stats.lastQuizDate = new Date().toISOString();
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('stats', 'readwrite');
            const req = tx.objectStore('stats').put(stats);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 儲存統計失敗:', e);
    }
}

async function refreshWrongPoolCount() {
    if (!appData.currentCert) return;
    const pool = await getWrongPool(appData.currentCert);
    const el = document.getElementById('wrongPoolCount');
    if (el) {
        const dueCount = pool.filter(e => e.nextReviewDate <= new Date().toISOString().split('T')[0]).length;
        el.textContent = pool.length;
        el.title = `待複習：${dueCount} 題`;
        if (dueCount > 0) el.style.color = 'var(--warning)';
        else el.style.color = '';
    }
}

async function refreshAnsweredStats() {
    if (!appData.currentCert) return;
    const stats = await loadStats(appData.currentCert);
    const answeredEl = document.getElementById('totalAnsweredCount');
    const rateEl = document.getElementById('totalCorrectRate');
    if (answeredEl) answeredEl.textContent = stats.totalAnswered;
    if (rateEl) {
        rateEl.textContent = stats.totalAnswered > 0
            ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) + '%'
            : '-';
    }
}

async function saveQuizHistory(certId, correctCount, total, score, mode) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('quizHistory', 'readwrite');
            const req = tx.objectStore('quizHistory').put({
                certId,
                timestamp: new Date().toISOString(),
                correct: correctCount,
                total,
                score,
                mode
            });
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 儲存測驗歷史失敗:', e);
    }
}

async function loadQuizHistory(certId, limit = 20) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('quizHistory', 'readonly');
            const index = tx.objectStore('quizHistory').index('certId');
            const req = index.openCursor(null, 'prev');
            const results = [];
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor && results.length < limit) {
                    if (cursor.value.certId === certId) results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 讀取測驗歷史失敗:', e);
        return [];
    }
}

async function updateQuestionStats(certId, qNum, isCorrect) {
    try {
        const db = await openDB();
        const id = `${certId}_${qNum}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('questionStats', 'readwrite');
            const store = tx.objectStore('questionStats');
            const req = store.get(id);
            req.onsuccess = () => {
                const entry = req.result || { id, certId, num: qNum, correct: 0, wrong: 0, lastSeen: null };
                if (isCorrect) entry.correct++;
                else entry.wrong++;
                entry.lastSeen = new Date().toISOString();
                store.put(entry);
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 更新題目統計失敗:', e);
    }
}

async function loadQuestionStats(certId) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('questionStats', 'readonly');
            const index = tx.objectStore('questionStats').index('certId');
            const req = index.getAll(certId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('IndexedDB 讀取題目統計失敗:', e);
        return [];
    }
}

// Wrap existing gradeQuiz to persist wrong answers and stats
const _origGradeQuiz = gradeQuiz;
gradeQuiz = function () {
    clearInterval(appData.timerInterval);
    appData.quizActive = false;

    const total = appData.currentQuiz.length;
    let correctCount = 0;
    const wrongQuestions = [];

    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);

    let subjectStats = {};
    if (mod) {
        mod.subjects.forEach(subj => {
            subjectStats[subj.id] = { name: subj.name, total: 0, correct: 0 };
        });
    }

    const prefixes = ['A', 'B', 'C', 'D'];

    appData.currentQuiz.forEach((q, idx) => {
        let subjKey = null;
        if (mod) {
            const matchedSubj = mod.subjects.find(subj =>
                subj.matchKeywords.some(keyword => q.subject.includes(keyword)));
            if (matchedSubj) subjKey = matchedSubj.id;
        }
        if (!subjKey && mod && mod.subjects.length > 0) subjKey = mod.subjects[0].id;
        if (subjKey && subjectStats[subjKey]) subjectStats[subjKey].total++;

        const userChoiceIdx = appData.userAnswers[idx];
        const correctIdx = prefixes.indexOf(q.answer);

        const isCorrect = userChoiceIdx === correctIdx;
        if (isCorrect) {
            correctCount++;
            if (subjKey && subjectStats[subjKey]) subjectStats[subjKey].correct++;
            q.gradedResult = 'correct';
        } else {
            q.gradedResult = 'wrong';
            wrongQuestions.push(q);
        }
        if (appData.currentCert) {
            updateQuestionStats(appData.currentCert, q.num, isCorrect);
        }
    });

    // Persist wrong questions and stats
    if (appData.currentCert && wrongQuestions.length > 0) {
        wrongQuestions.forEach(q => addWrongQuestion(appData.currentCert, q));
    }
    if (appData.currentCert) {
        saveStats(appData.currentCert, correctCount, total);
        saveQuizHistory(appData.currentCert, correctCount, total, score, appData.quizMode);
        refreshWrongPoolCount();
        refreshAnsweredStats();
    }

    const score = Math.round((correctCount / total) * 100);
    const passed = score >= 70;

    lblScore.textContent = score;
    const circumference = 283;
    const offset = circumference - (score / 100) * circumference;
    scoreCircleProgress.style.strokeDashoffset = offset;
    scoreCircleProgress.style.stroke = passed ? 'var(--success)' : 'var(--danger)';

    lblResultTitle.textContent = passed ? '🎉 及格！恭喜通過！' : '⚠️ 分數未及格，請繼續加油！';
    lblResultTitle.style.color = passed ? 'var(--success)' : 'var(--danger)';
    lblResultDesc.textContent = passed
        ? '恭喜你達到 70 分及格門檻，你已經具備一定的專業水準！'
        : '離 70 分及格門檻差了一點，建議檢驗下方錯題，並複習相關單元講義。';

    const minsUsed = Math.floor(appData.timeSpent / 60);
    const secsUsed = appData.timeSpent % 60;
    lblTimeSpent.textContent = appData.quizMode === 'exam'
        ? `${minsUsed} 分 ${secsUsed} 秒` : '無限制';
    lblCorrectCount.textContent = `${correctCount} / ${total} 題`;
    lblAnswerRate.textContent = `${Math.round((Object.keys(appData.userAnswers).length / total) * 100)}%`;

    buildBreakdownHTML(subjectStats);
    renderReviewList();
    transitionScreen(quizScreen, resultsScreen);
};

// Wrap startPracticeMode to support wrong book mode
const _origStartPractice = startPracticeMode;
startPracticeMode = async function () {
    const subjVal = document.getElementById('selectSubject').value;
    const chapVal = selectChapter.value;
    const numLimit = document.getElementById('practiceNum').value;
    const isWrongBook = document.getElementById('chkWrongBook').checked;

    if (isWrongBook) {
        const pool = await getWrongPool(appData.currentCert);
        if (pool.length === 0) {
            alert('錯題池為空，尚無需複習的題目！');
            return;
        }
        let filtered = pool.filter(e => e.nextReviewDate <= new Date().toISOString().split('T')[0]);
        if (subjVal !== 'all') {
            const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
            const mod = modules.find(m => m.id === appData.currentCert);
            if (mod) {
                const targetSubj = mod.subjects.find(s => s.id === subjVal);
                if (targetSubj) {
                    filtered = filtered.filter(e => targetSubj.matchKeywords.some(k => e.subject.includes(k)));
                }
            }
        }
        if (chapVal !== 'all') {
            filtered = filtered.filter(e => e.chapter === chapVal);
        }
        if (filtered.length === 0) {
            alert('篩選範圍內無待複習錯題！');
            return;
        }
        appData.currentQuiz = shuffleArray(filtered).slice(0, numLimit === 'all' ? filtered.length : parseInt(numLimit));
        appData.quizMode = 'practice';
        practiceSetup.classList.add('hidden');
        timerDisplay.classList.add('hidden');
        document.querySelector('.quiz-nav-panel').classList.remove('hidden');
        initQuizSession('practice');
        return;
    }

    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return;

    let filtered = appData.questions.filter(q => {
        let isSubjMatch = false;
        if (subjVal === 'all') isSubjMatch = true;
        else {
            const targetSubj = mod.subjects.find(s => s.id === subjVal);
            if (targetSubj) isSubjMatch = targetSubj.matchKeywords.some(keyword => q.subject.includes(keyword));
        }
        const isChapMatch = chapVal === 'all' || q.chapter === chapVal;
        return isSubjMatch && isChapMatch;
    });

    if (filtered.length === 0) {
        alert('此範圍內無題目，請重新選擇！');
        return;
    }

    filtered = shuffleArray(filtered);
    if (numLimit !== 'all') {
        const limit = parseInt(numLimit);
        filtered = filtered.slice(0, Math.min(limit, filtered.length));
    }

    appData.currentQuiz = filtered;
    appData.quizMode = 'practice';
    practiceSetup.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    document.querySelector('.quiz-nav-panel').classList.remove('hidden');
    initQuizSession('practice');
};

// Override showPracticeFeedback to update wrong pool when answered correctly
const _origShowFeedback = showPracticeFeedback;
showPracticeFeedback = function (qIdx) {
    const q = appData.currentQuiz[qIdx];
    const userChoiceIdx = appData.userAnswers[qIdx];
    const prefixes = ['A', 'B', 'C', 'D'];
    const correctIdx = prefixes.indexOf(q.answer);

    const isCorrect = userChoiceIdx === correctIdx;

    const cards = optionsList.querySelectorAll('.option-card');
    cards.forEach((card, idx) => {
        card.classList.remove('selected');
        if (idx === correctIdx) card.classList.add('correct');
        else if (idx === userChoiceIdx) card.classList.add('wrong');
    });

    feedbackArea.className = `feedback-box animate-fade-in ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackIcon.textContent = isCorrect ? '✅' : '❌';
    feedbackTitle.textContent = isCorrect ? '答對了！' : `答錯了！正確答案是 (${q.answer})`;

    let explText = `標準答案：(${q.answer}) ${q.ans_text}\n\n`;
    if (q.explanation) explText += `解析：\n${q.explanation}`;
    else explText += '無額外解析資訊。';
    lblExplanationText.textContent = explText;
    feedbackArea.classList.remove('hidden');

    // Persist: add to wrong pool if wrong, update SM-2 if correct
    if (appData.currentCert) {
        updateQuestionStats(appData.currentCert, q.num, isCorrect);
        if (!isCorrect) {
            addWrongQuestion(appData.currentCert, q);
        } else {
            updateWrongPoolAfterCorrect(appData.currentCert, q.num);
        }
        refreshWrongPoolCount();
        refreshAnsweredStats();
    }
};

// ════════════════════════════════════════════════════════════════
// 弱點分析 — 雷達圖 + 趨勢圖
// ════════════════════════════════════════════════════════════════

let radarChartInstance = null;
let trendChartInstance = null;

async function renderWeaknessCharts() {
    if (!appData.currentCert || typeof Chart === 'undefined') return;

    const history = await loadQuizHistory(appData.currentCert, 20);
    const section = document.getElementById('weaknessSection');
    if (!section) return;

    // Only show section if there's at least one quiz history record
    if (history.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = '';

    const subjectLabels = [];
    const subjectWrongCount = [];

    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (mod) {
        const wrongPool = await getWrongPool(appData.currentCert);
        for (const subj of mod.subjects) {
            const related = wrongPool.filter(e =>
                subj.matchKeywords.some(k => e.subject.includes(k)));
            subjectLabels.push(subj.name);
            subjectWrongCount.push(related.length);
        }
    }

    const maxWrong = Math.max(...subjectWrongCount, 1);
    const ctx1 = document.getElementById('radarChart');
    if (ctx1) {
        if (radarChartInstance) radarChartInstance.destroy();
        radarChartInstance = new Chart(ctx1, {
            type: 'radar',
            data: {
                labels: subjectLabels,
                datasets: [{
                    label: '錯題數',
                    data: subjectWrongCount,
                    backgroundColor: 'rgba(248, 81, 73, 0.15)',
                    borderColor: '#f85149',
                    pointBackgroundColor: '#f85149',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        min: 0, max: maxWrong,
                        ticks: { stepSize: Math.max(1, Math.ceil(maxWrong / 5)), color: '#8b949e' },
                        grid: { color: 'rgba(139, 148, 158, 0.3)' },
                        angleLines: { color: 'rgba(139, 148, 158, 0.3)' },
                        pointLabels: { color: '#c9d1d9', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    const ctx2 = document.getElementById('trendChart');
    if (ctx2 && history.length > 0) {
        if (trendChartInstance) trendChartInstance.destroy();
        const labels = history.map((h, i) => `#${i + 1}`);
        const scores = history.map(h => h.score);
        trendChartInstance = new Chart(ctx2, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '成績',
                    data: scores,
                    borderColor: '#58a6ff',
                    backgroundColor: 'rgba(88, 166, 255, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: scores.map(s => s >= 70 ? '#3fb950' : '#f85149'),
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { min: 0, max: 100, ticks: { color: '#8b949e' }, grid: { color: 'rgba(139,148,158,0.2)' } },
                    x: { ticks: { color: '#8b949e' }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ════════════════════════════════════════════════════════════════
// IRT 審題儀表板
// ════════════════════════════════════════════════════════════════

function showIrtDashboard() {
    const irtScreen = document.getElementById('irtScreen');
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (irtScreen && welcomeScreen) transitionScreen(welcomeScreen, irtScreen);
    renderIrtDashboard();
}

async function renderIrtDashboard() {
    if (!appData.currentCert) return;
    const wrongPool = await getWrongPool(appData.currentCert);
    const qStats = await loadQuestionStats(appData.currentCert);
    const stats = await loadStats(appData.currentCert);
    const history = await loadQuizHistory(appData.currentCert, 50);

    const overallRate = stats.totalAnswered > 0
        ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

    // Build question map with subject/chapter from wrong pool or original questions
    const qMap = {};
    const qIndex = {};
    if (appData.questions) {
        appData.questions.forEach(q => { qIndex[q.num] = q; });
    }
    for (const s of qStats) {
        const key = s.num;
        qMap[key] = { correct: s.correct, wrong: s.wrong };
    }
    for (const w of wrongPool) {
        if (!qMap[w.num]) qMap[w.num] = { correct: 0, wrong: 0 };
        qMap[w.num].lastWrong = w.lastWrongDate || w.lastAnswerDate || '';
        qMap[w.num].wrong = Math.max(qMap[w.num].wrong, w.wrongCount || 1);
        qMap[w.num].subject = w.subject || (qIndex[w.num] && qIndex[w.num].subject) || '';
        qMap[w.num].chapter = w.chapter || (qIndex[w.num] && qIndex[w.num].chapter) || '';
        qMap[w.num].assessmentTopic = w.assessmentTopic || (qIndex[w.num] && qIndex[w.num].assessmentTopic) || '';
        qMap[w.num].assessmentContent = w.assessmentContent || (qIndex[w.num] && qIndex[w.num].assessmentContent) || '';
    }
    // Fill missing subject/chapter from original questions
    for (const num of Object.keys(qMap)) {
        if (!qMap[num].subject && qIndex[num]) {
            qMap[num].subject = qIndex[num].subject || '';
            qMap[num].chapter = qIndex[num].chapter || '';
            qMap[num].assessmentTopic = qIndex[num].assessmentTopic || '';
            qMap[num].assessmentContent = qIndex[num].assessmentContent || '';
        }
    }

    const rows = Object.entries(qMap).map(([num, d]) => {
        const total = d.correct + d.wrong;
        const rate = total > 0 ? Math.round((d.correct / total) * 100) : 0;
        let level;
        if (rate >= 80) level = '簡單';
        else if (rate >= 50) level = '中等';
        else if (rate >= 20) level = '困難';
        else level = '極難';
        const diffScore = total > 0 ? Math.round((1 - d.correct / total) * 100) : 0;
        return {
            num, correct: d.correct, wrong: d.wrong, total, rate, level, diffScore,
            lastWrong: d.lastWrong || '',
            subject: d.subject || '',
            chapter: d.chapter || '',
            assessmentTopic: d.assessmentTopic || '',
            assessmentContent: d.assessmentContent || ''
        };
    });

    rows.sort((a, b) => b.diffScore - a.diffScore);
    renderIrtTable(rows);
    renderIrtStats(stats, history, rows, overallRate);
}

function renderIrtTable(rows) {
    const tbody = document.getElementById('irtTbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(r => {
        const levelColors = { '簡單': 'var(--success)', '中等': 'var(--warning)', '困難': '#f85149', '極難': '#da3633' };
        const color = levelColors[r.level] || 'var(--text-secondary)';
        const lastWrong = r.lastWrong ? new Date(r.lastWrong).toLocaleDateString() : '-';
        const shortSubj = r.subject.length > 14 ? r.subject.slice(0, 14) + '…' : r.subject;
        const shortChap = r.chapter.length > 14 ? r.chapter.slice(0, 14) + '…' : r.chapter;
        return `<tr style="border-bottom:1px solid var(--border);">
            <td style="padding:6px 8px;">#${r.num}</td>
            <td style="padding:6px 8px;font-size:12px;" title="${r.subject}">${shortSubj}</td>
            <td style="padding:6px 8px;font-size:12px;" title="${r.chapter}">${shortChap}</td>
            <td style="padding:6px 8px;font-size:12px;color:var(--accent);">${r.assessmentTopic || '-'}</td>
            <td style="padding:6px 8px;font-size:12px;color:var(--accent);">${r.assessmentContent || '-'}</td>
            <td style="padding:6px 8px;"><span style="color:${color};font-weight:600;">${r.level}</span></td>
            <td style="padding:6px 8px;text-align:center;white-space:nowrap;">
                <span style="color:var(--success);">${r.correct}</span>/<span style="color:#f85149;">${r.wrong}</span>
            </td>
            <td style="padding:6px 8px;text-align:center;">${r.rate}%</td>
            <td style="padding:6px 8px;font-size:12px;color:var(--text-secondary);">${lastWrong}</td>
        </tr>`;
    }).join('');
}

function renderIrtStats(stats, history, rows, overallRate) {
    const panel = document.getElementById('irtStatsPanel');
    const summary = document.getElementById('irtSummary');
    if (!panel) return;
    const quizCount = history.length;
    const totalQ = rows.length;
    const hardCount = rows.filter(r => r.level === '困難' || r.level === '極難').length;

    if (summary) {
        summary.textContent = `共 ${totalQ} 題納入分析 | ${quizCount} 次測驗 | 整體正確率 ${overallRate}%`;
    }

    // Cronbach's alpha approximation: based on item variance
    let alpha = '-';
    if (rows.length > 1) {
        const rates = rows.map(r => r.rate / 100);
        const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
        const varSum = rates.reduce((a, r) => a + (r - mean) ** 2, 0);
        const itemVar = varSum / rates.length;
        const totalVar = overallRate / 100 * (1 - overallRate / 100);
        if (totalVar > 0) {
            const k = rates.length;
            const rawAlpha = (k / (k - 1)) * (1 - (itemVar * k) / (totalVar * k));
            alpha = Math.max(0, Math.min(1, rawAlpha)).toFixed(3);
        }
    }

    const cards = [
        { label: '累積答題', value: stats.totalAnswered || 0 },
        { label: '正確率', value: `${overallRate}%` },
        { label: '測驗次數', value: quizCount },
        { label: '困難題數', value: hardCount, color: '#f85149' },
        { label: 'Cronbach α', value: alpha },
    ];

    panel.innerHTML = cards.map(c => `
        <div class="detail-card" style="min-width:120px;flex:1;">
            <span class="detail-label">${c.label}</span>
            <span class="detail-val" style="${c.color ? `color:${c.color};` : ''}">${c.value}</span>
        </div>
    `).join('');
}

// ════════════════════════════════════════════════════════════════
// PWA — 註冊 Service Worker
// ════════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW 註冊失敗:', e));
    });
}

