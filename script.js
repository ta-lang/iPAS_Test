// IPAS Exam Web Application JS Logic

// Global Application State
const ACTIVE_SESSION_STORAGE_KEY = 'ipas_active_session_v1';
const ACTIVE_QUIZ_STORAGE_KEY = 'ipas_active_quiz_v1';

let appData = {
    currentCert: '', // Configured dynamically
    questions: [], // Active questions database
    moduleQuestions: {}, // Maps module.id -> array of questions
    currentQuiz: [], // Questions in active session
    userAnswers: {}, // Map of { questionIndex: selectedOptionIndex } (0-3)
    checkedQuestions: new Set(), // Set of checked question indexes
    flaggedQuestions: {}, // Map of { questionIndex: boolean }
    currentQuestionIdx: 0,
    currentIndex: 0,
    currentExamSubject: null,
    quizMode: 'exam', // 'exam' or 'practice'
    timerInterval: null,
    timerStartedAt: null,
    examEndTime: null,
    timerDurationSeconds: 4500,
    timeRemaining: 4500, // 75 minutes by default (dynamic based on certification)
    timeSpent: 0,
    quizActive: false,
    committedEvents: Object.create(null),
    certSelectionToken: 0,
    accountSession: null,
    deviceId: '',
    syncInFlight: false,
    currentNoteBasePath: ''
};

const accountApi = /^https:\/\//i.test(window.EXAM_CONFIG.apiEndpoint || '')
    ? window.ExamAccountApi.createAccountApi({ endpoint: window.EXAM_CONFIG.apiEndpoint })
    : null;

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
const syncStatus = document.getElementById('syncStatus');
const syncStatusText = document.getElementById('syncStatusText');
const btnLogout = document.getElementById('btnLogout');

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
    appData.deviceId = getOrCreateDeviceId();
    initTheme();
    setupEventListeners();
    void initializeAppStartup();
});

async function initializeAppStartup() {
    const restoredSession = loadActiveSessionFromStorage();
    if (restoredSession && restoredSession.accountSession) {
        appData.accountSession = restoredSession.accountSession;
        if (restoredSession.currentCert) {
            appData.currentCert = restoredSession.currentCert;
        }
        if (btnLogout) btnLogout.classList.remove('hidden');
        transitionScreen(loginScreen, welcomeScreen);
        void renderSyncStatus().then(() => flushSyncOutbox());
        await loadQuestions(restoredSession.currentCert);
        await restoreActiveQuizFromStorage();
    } else {
        renderSyncStatus();
        await loadQuestions();
    }
}

function getQuestionKey(question) {
    if (window.ExamCore && typeof window.ExamCore.getQuestionKey === 'function') {
        return window.ExamCore.getQuestionKey(question);
    }
    return String(question?.question_uid || question?.display_num || question?.num || '');
}

function saveActiveSessionToStorage() {
    try {
        if (!appData.accountSession) return;
        const payload = window.ExamCore && typeof window.ExamCore.serializeActiveSession === 'function'
            ? window.ExamCore.serializeActiveSession(appData.accountSession, appData.currentCert)
            : {
                mode: appData.accountSession.mode || 'local-only',
                userId: appData.accountSession.userId || null,
                displayId: appData.accountSession.displayId || null,
                partitionKey: appData.accountSession.partitionKey || appData.accountSession.userId || 'local',
                migrationDone: Boolean(appData.accountSession.migrationDone),
                syncStatus: appData.accountSession.syncStatus || 'local-only',
                currentCert: appData.currentCert || ''
            };
        if (payload) {
            sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(payload));
        }
    } catch (e) {
        console.warn('無法儲存工作階段至 sessionStorage:', e);
    }
}

function loadActiveSessionFromStorage() {
    try {
        const raw = sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (window.ExamCore && typeof window.ExamCore.restoreActiveSession === 'function') {
            return window.ExamCore.restoreActiveSession(parsed);
        }
        return parsed;
    } catch (e) {
        console.warn('無法從 sessionStorage 還原工作階段:', e);
        return null;
    }
}

function clearActiveSessionStorage() {
    try {
        sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch (e) {
        console.warn('無法清除 sessionStorage 工作階段:', e);
    }
}

function saveActiveQuizToStorage() {
    try {
        if (!appData.quizActive || !Array.isArray(appData.currentQuiz) || appData.currentQuiz.length === 0) {
            return;
        }
        const payload = window.ExamCore && typeof window.ExamCore.serializeActiveQuiz === 'function'
            ? window.ExamCore.serializeActiveQuiz(appData)
            : {
                certKey: appData.currentCert,
                quizMode: appData.quizMode,
                currentExamSubject: appData.currentExamSubject,
                questionUids: appData.currentQuiz.map(q => getQuestionKey(q)),
                currentIndex: appData.currentIndex,
                userAnswers: appData.userAnswers,
                checkedQuestions: Array.from(appData.checkedQuestions),
                flaggedQuestions: Array.from(Object.keys(appData.flaggedQuestions).filter(k => appData.flaggedQuestions[k]).map(Number)),
                examEndTime: appData.examEndTime || null,
                savedAt: Date.now()
            };
        if (payload) {
            sessionStorage.setItem(ACTIVE_QUIZ_STORAGE_KEY, JSON.stringify(payload));
        }
    } catch (e) {
        console.warn('無法儲存測驗進度至 sessionStorage:', e);
    }
}

function clearActiveQuizStorage() {
    try {
        sessionStorage.removeItem(ACTIVE_QUIZ_STORAGE_KEY);
    } catch (e) {
        console.warn('無法清除 sessionStorage 測驗進度:', e);
    }
}

async function restoreActiveQuizFromStorage() {
    try {
        const raw = sessionStorage.getItem(ACTIVE_QUIZ_STORAGE_KEY);
        if (!raw) return false;
        const saved = JSON.parse(raw);
        if (!saved || !Array.isArray(saved.questionUids) || saved.questionUids.length === 0) {
            clearActiveQuizStorage();
            return false;
        }

        if (saved.certKey && saved.certKey !== appData.currentCert) {
            await selectCert(saved.certKey);
        } else if (!appData.questions || appData.questions.length === 0) {
            const targetCert = saved.certKey || appData.currentCert;
            if (targetCert) await selectCert(targetCert);
        }

        const restored = window.ExamCore && typeof window.ExamCore.restoreActiveQuiz === 'function'
            ? window.ExamCore.restoreActiveQuiz(saved, appData.questions, Date.now())
            : null;

        if (!restored || !restored.currentQuiz || restored.currentQuiz.length === 0) {
            clearActiveQuizStorage();
            return false;
        }

        appData.currentQuiz = restored.currentQuiz;
        appData.quizMode = restored.quizMode;
        appData.currentExamSubject = restored.currentExamSubject;
        appData.userAnswers = restored.userAnswers;
        appData.checkedQuestions = restored.checkedQuestions;
        appData.flaggedQuestions = restored.flaggedQuestions;
        appData.currentQuestionIdx = restored.currentIndex;
        appData.currentIndex = restored.currentIndex;
        appData.committedEvents = Object.create(null);
        appData.quizActive = true;

        // Mark already-checked practice questions in committedEvents so they aren't double-persisted
        if (appData.quizMode === 'practice') {
            Object.keys(appData.userAnswers).forEach(qIdx => {
                if (appData.userAnswers[qIdx] !== undefined) {
                    appData.committedEvents[`practice-answer:${qIdx}`] = true;
                }
            });
        }

        const durationMinutes = (appData.currentCert === 'ai_mid') ? 90 : 75;
        appData.timerDurationSeconds = restored.timerDurationSeconds || (durationMinutes * 60);

        practiceSetup.classList.add('hidden');
        document.querySelector('.quiz-nav-panel').classList.remove('hidden');
        navPanelTitle.textContent = appData.quizMode === 'exam' ? '全真考卷答題進度' : '練習題目清單';

        clearInterval(appData.timerInterval);
        if (appData.quizMode === 'exam') {
            timerDisplay.classList.remove('hidden');
            const remainingSecs = restored.examEndTime
                ? Math.max(1, Math.floor((restored.examEndTime - Date.now()) / 1000))
                : appData.timerDurationSeconds;
            appData.timeRemaining = remainingSecs;
            appData.examEndTime = Date.now() + remainingSecs * 1000;
            appData.timeSpent = Math.max(0, appData.timerDurationSeconds - remainingSecs);
            startTimer(remainingSecs);
        } else {
            timerDisplay.classList.add('hidden');
            appData.examEndTime = null;
        }

        buildNavGrid();
        // Restore nav button classes for answered and flagged questions
        Object.keys(appData.userAnswers).forEach(idx => {
            if (appData.userAnswers[idx] !== undefined) {
                const btn = document.getElementById(`navBtn_${idx}`);
                if (btn) btn.classList.add('answered');
            }
        });
        Object.keys(appData.flaggedQuestions).forEach(idx => {
            if (appData.flaggedQuestions[idx]) {
                const btn = document.getElementById(`navBtn_${idx}`);
                if (btn) btn.classList.add('flagged');
            }
        });
        updateProgress();

        if (loginScreen && loginScreen.classList.contains('active')) {
            transitionScreen(loginScreen, quizScreen);
        } else if (welcomeScreen && welcomeScreen.classList.contains('active')) {
            transitionScreen(welcomeScreen, quizScreen);
        } else {
            quizScreen.classList.add('active');
        }

        showQuestion(appData.currentQuestionIdx);
        return true;
    } catch (e) {
        console.warn('無法從 sessionStorage 還原測驗進度:', e);
        return false;
    }
}

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
async function loadQuestions(initialCertKey = '') {
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
        
        // Render certification selector cards dynamically
        renderCertSelector();
        
        const targetCert = initialCertKey && modules.some(m => m.id === initialCertKey)
            ? initialCertKey
            : modules[0].id;
        appData.currentCert = targetCert;

        const isLoginActive = loginScreen && loginScreen.classList.contains('active');
        if (!isLoginActive || initialCertKey) {
            await selectCert(targetCert);
        }
    } catch (error) {
        console.error(error);
        qText.innerHTML = `<div style="color:#ef4444; font-weight:700;">讀取題庫錯誤：${error.message}<br>請確認是否已產生題庫檔案或 config.js 是否正確。</div>`;
    }
}

async function loadModuleQuestions(mod) {
    if (appData.moduleQuestions[mod.id]) return appData.moduleQuestions[mod.id];

    let questions = [];
    if (window.location.protocol !== 'file:') {
        try {
            const response = await fetch(mod.questionsJson);
            if (response.ok) questions = await response.json();
        } catch (e) {
            console.warn(`Failed to fetch ${mod.questionsJson}: ${e.message}`);
        }
    }

    if (questions.length === 0) {
        if (!window[mod.questionsVar]) await loadScript(mod.questionsFile);
        questions = window[mod.questionsVar] || [];
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error(`${mod.name} 題庫是空的或格式錯誤`);
    }
    if (questions.some(question => !question.question_uid)) {
        throw new Error(`${mod.name} 題庫缺少永久題目識別碼，請重新產生題庫`);
    }

    appData.moduleQuestions[mod.id] = questions;
    const countLabel = document.getElementById(`lblCount_${mod.id}`);
    if (countLabel) countLabel.textContent = questions.length;
    return questions;
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
        
        const qCount = appData.moduleQuestions[mod.id]?.length || mod.questionCount || 0;
        
        card.innerHTML = `
            <span class="cert-icon">${mod.icon}</span>
            <div class="cert-info">
                <h4>${mod.name}</h4>
                <p>${mod.description} (<span id="lblCount_${mod.id}">${qCount}</span> 題)</p>
            </div>
        `;
        
        card.addEventListener('click', () => void selectCert(mod.id));
        certGrid.appendChild(card);
    });
}

// Select certification and update UI
async function selectCert(certType) {
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === certType);
    if (!mod) return;

    const selectionToken = ++appData.certSelectionToken;
    try {
        await loadModuleQuestions(mod);
    } catch (error) {
        console.error(error);
        alert(`讀取題庫失敗：${error.message}`);
        return;
    }
    if (selectionToken !== appData.certSelectionToken) return;
    appData.currentCert = certType;
    if (appData.accountSession) {
        saveActiveSessionToStorage();
    }
    
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
        if (headerTitle) headerTitle.textContent = "iPAS 備考系統";
        document.title = "iPAS 備考系統";
        if (appFooterText) appFooterText.textContent = "© 2026 iPAS 備考系統. All Rights Reserved.";
    }
    
    const qCount = appData.moduleQuestions[mod.id].length;
    
    welcomeTitle.textContent = `歡迎使用 IPAS ${mod.name} 備考系統`;
    welcomeDesc.textContent = `本系統整合了官方 115 年最新簡章範圍與教材精選題庫，共計有 ${qCount} 題真實樣題。提供您雙重模式進行衝刺學習：`;
    
    if (!isLoginActive) {
        if (headerTitle) headerTitle.textContent = `iPAS ${mod.name}`;
        document.title = `iPAS ${mod.name} 備考系統`;
        if (appFooterText) appFooterText.textContent = `© 2026 iPAS ${mod.name} 備考工作區. All Rights Reserved. 講義內容轉譯自官方教材手冊。`;
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

    const migration = await migrateLegacyQuestionState(certType, appData.questions);
    if (selectionToken !== appData.certSelectionToken) return;
    if (migration.quarantined > 0) {
        alert(`已保留 ${migration.quarantined} 筆無法唯一對應的舊版錯題／進度資料，未自動猜測題目。`);
    }

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
        
        btn.addEventListener('click', () => void startExamSubjectMode(subj.id));
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
    
    // Clear and clone selectSubject to drop old event listeners
    const newSelectSubject = selectSubject.cloneNode(true);
    selectSubject.parentNode.replaceChild(newSelectSubject, selectSubject);
    selectSubject = newSelectSubject;
    
    newSelectSubject.addEventListener('change', () => {
        populateTopicsAndChapters();
        void updatePoolCount();
    });
    
    // Trigger initial change
    newSelectSubject.dispatchEvent(new Event('change'));
}

function getQuestionsForSubject(subjVal) {
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return [];
    if (!subjVal || subjVal === 'all') return appData.questions;
    const targetSubj = mod.subjects.find(s => s.id === subjVal);
    if (!targetSubj) return [];
    return appData.questions.filter(q =>
        targetSubj.matchKeywords.some(keyword => q.subject.includes(keyword))
    );
}

function populateTopicsAndChapters() {
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    const subjVal = selectSubject ? selectSubject.value : 'all';
    const subjQuestions = getQuestionsForSubject(subjVal);

    const selTopic = document.getElementById('selTopic');
    const topicFilterGroup = document.getElementById('topicFilterGroup');

    const distinctTopics = [];
    const seenTopics = new Set();
    subjQuestions.forEach(q => {
        const t = String(q.assessmentTopic || '').trim();
        if (t && !seenTopics.has(t)) {
            seenTopics.add(t);
            distinctTopics.push(t);
        }
    });

    if (selTopic) {
        selTopic.innerHTML = '<option value="all">全部評鑑主題 (不限)</option>';
        distinctTopics.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = window.ExamCore && typeof window.ExamCore.formatTopicLabel === 'function'
                ? window.ExamCore.formatTopicLabel(t, subjQuestions, mod ? mod.studyNotes : [])
                : t;
            selTopic.appendChild(opt);
        });
    }

    if (topicFilterGroup) {
        topicFilterGroup.style.display = distinctTopics.length > 0 ? '' : 'none';
    }

    populateChapters();
}

function populateChapters() {
    if (!selectChapter) return;
    const subjVal = selectSubject ? selectSubject.value : 'all';
    const selTopic = document.getElementById('selTopic');
    const topicVal = selTopic ? selTopic.value : 'all';
    const subjQuestions = getQuestionsForSubject(subjVal);

    const chapters = new Set();
    subjQuestions.forEach(q => {
        if (topicVal !== 'all' && String(q.assessmentTopic || '').trim() !== topicVal) return;
        if (q.chapter) chapters.add(q.chapter);
    });

    selectChapter.innerHTML = '<option value="all">全部章節 (不限)</option>';
    chapters.forEach(chap => {
        const opt = document.createElement('option');
        opt.value = chap;
        opt.textContent = chap;
        selectChapter.appendChild(opt);
    });
}

async function getFilteredPracticePool() {
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return [];

    const subjVal = document.getElementById('selectSubject')?.value || 'all';
    const topicVal = document.getElementById('selTopic')?.value || 'all';
    const chapVal = selectChapter ? selectChapter.value : 'all';
    const isWrongBook = Boolean(document.getElementById('chkWrongBook')?.checked);
    const wrongMode = document.getElementById('selWrongMode')?.value || 'due';
    const unansweredOnly = Boolean(document.getElementById('chkUnansweredOnly')?.checked);

    const [wrongPool, questionStats] = await Promise.all([
        isWrongBook ? getWrongPool(appData.currentCert) : Promise.resolve([]),
        unansweredOnly ? loadQuestionStats(appData.currentCert) : Promise.resolve([])
    ]);

    return window.ExamCore.filterPracticeQuestions({
        questions: appData.questions,
        wrongPool,
        questionStats,
        subjects: mod.subjects,
        subjectId: subjVal,
        topic: topicVal,
        chapter: chapVal,
        isWrongBook,
        wrongMode,
        unansweredOnly,
        today: new Date().toISOString().split('T')[0]
    });
}

async function updatePoolCount() {
    const lblPoolCount = document.getElementById('lblPoolCount');
    if (!lblPoolCount || !appData.currentCert) return;
    const filtered = await getFilteredPracticePool();
    lblPoolCount.textContent = `符合條件：${filtered.length} 題`;
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
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
    window.addEventListener('online', () => void flushSyncOutbox());
    window.addEventListener('offline', () => void renderSyncStatus());

    // Navigation setup
    document.getElementById('btnStartExam').addEventListener('click', showExamSubjectModal);
    document.getElementById('btnStartPractice').addEventListener('click', enterPracticeSetup);
    document.getElementById('btnStartStudy').addEventListener('click', showStudyNoteModal);
    document.getElementById('btnApplyPractice').addEventListener('click', startPracticeMode);

    // Practice setup filter listeners
    const selTopicEl = document.getElementById('selTopic');
    if (selTopicEl) {
        selTopicEl.addEventListener('change', () => {
            populateChapters();
            void updatePoolCount();
        });
    }
    if (selectChapter) {
        selectChapter.addEventListener('change', () => void updatePoolCount());
    }
    const chkWrongBookEl = document.getElementById('chkWrongBook');
    const selWrongModeEl = document.getElementById('selWrongMode');
    if (chkWrongBookEl) {
        chkWrongBookEl.addEventListener('change', () => {
            if (selWrongModeEl) {
                selWrongModeEl.classList.toggle('hidden', !chkWrongBookEl.checked);
            }
            void updatePoolCount();
        });
    }
    if (selWrongModeEl) {
        selWrongModeEl.addEventListener('change', () => void updatePoolCount());
    }
    const chkUnansweredOnlyEl = document.getElementById('chkUnansweredOnly');
    if (chkUnansweredOnlyEl) {
        chkUnansweredOnlyEl.addEventListener('change', () => void updatePoolCount());
    }
    
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
            const rows = buildQuestionPerformanceRows(qStats, wrongPool, appData.questions);
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

    // Keyboard Shortcuts for Active Quiz
    document.addEventListener('keydown', handleQuizKeydown);
}

function handleQuizKeydown(e) {
    if (!quizScreen || quizScreen.classList.contains('hidden') || !quizScreen.classList.contains('active')) return;
    if (!appData.quizActive || !Array.isArray(appData.currentQuiz) || appData.currentQuiz.length === 0) return;

    const isStudyModalOpen = studyNoteModal && studyNoteModal.classList.contains('active');
    const isExamModalOpen = examSubjectModal && examSubjectModal.classList.contains('active');
    if (isStudyModalOpen || isExamModalOpen) return;

    const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key;
    const optionMap = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'a': 0, 'b': 1, 'c': 2, 'd': 3,
        'A': 0, 'B': 1, 'C': 2, 'D': 3
    };

    if (Object.prototype.hasOwnProperty.call(optionMap, key)) {
        const oIdx = optionMap[key];
        const qIdx = appData.currentQuestionIdx;
        if (appData.quizMode === 'practice' && appData.userAnswers[qIdx] !== undefined) {
            return;
        }
        e.preventDefault();
        selectOption(qIdx, oIdx);
        return;
    }

    if (key === 'Enter') {
        const qIdx = appData.currentQuestionIdx;
        const btnCheckAnswer = document.getElementById('btnCheckAnswer');
        if (appData.quizMode === 'practice' && appData.userAnswers[qIdx] !== undefined && !appData.checkedQuestions.has(qIdx) && (!btnCheckAnswer || !btnCheckAnswer.classList.contains('hidden'))) {
            e.preventDefault();
            checkAnswer();
        } else if (btnNext && !btnNext.classList.contains('hidden')) {
            e.preventDefault();
            nextQuestion();
        }
        return;
    }

    if (key === 'ArrowLeft') {
        if (appData.currentIndex > 0) {
            e.preventDefault();
            prevQuestion();
        }
        return;
    }

    if (key === 'ArrowRight') {
        if (appData.currentIndex < appData.currentQuiz.length - 1) {
            e.preventDefault();
            nextQuestion();
        }
        return;
    }

    if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFlag();
    }
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
    
    const chkWrongBookEl = document.getElementById('chkWrongBook');
    const selWrongModeEl = document.getElementById('selWrongMode');
    if (chkWrongBookEl && selWrongModeEl) {
        selWrongModeEl.classList.toggle('hidden', !chkWrongBookEl.checked);
    }

    // Trigger change event to populate topics, chapters, and pool count initially
    selectSubject.dispatchEvent(new Event('change'));
    
    // Show quiz screen but keep question area blank until "開始練習" is clicked
    transitionScreen(welcomeScreen, quizScreen);
    qText.innerHTML = '<div class="text-secondary" style="text-align:center; padding:40px;">請於上方設定練習範圍，然後點擊「開始練習」！</div>';
    optionsList.innerHTML = '';
    feedbackArea.classList.add('hidden');
    document.querySelector('.quiz-nav-panel').classList.add('hidden');
}

// Start Practice Mode Session
async function startPracticeMode() {
    const numLimit = document.getElementById('practiceNum').value;
    const isWrongBook = Boolean(document.getElementById('chkWrongBook')?.checked);

    if (isWrongBook) {
        const pool = await getWrongPool(appData.currentCert);
        if (pool.length === 0) {
            alert('錯題池為空，尚無需複習的題目！');
            return;
        }
    }

    let filtered = await getFilteredPracticePool();
    if (filtered.length === 0) {
        alert(isWrongBook ? '篩選範圍內無待複習錯題！' : '此範圍內無題目，請重新選擇！');
        return;
    }

    // Shuffle filtered questions
    filtered = shuffleArray(filtered);

    // Apply length limit
    if (numLimit !== 'all') {
        const limit = parseInt(numLimit, 10);
        filtered = filtered.slice(0, Math.min(limit, filtered.length));
    }

    // Set current quiz
    appData.currentQuiz = filtered;
    appData.quizMode = 'practice';
    appData.currentExamSubject = document.getElementById('selectSubject')?.value || 'all';
    practiceSetup.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    document.querySelector('.quiz-nav-panel').classList.remove('hidden');
    await initQuizSession('practice');
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
            loadNoteFile(note.file, note.title, btn);
        });
        container.appendChild(btn);
    });
    studyNoteModal.classList.add('active');
}

function scrollToNoteAnchor(container, anchorId) {
    if (!container || !anchorId) return;
    const targetNeedle = String(anchorId).trim().toLowerCase();
    if (!targetNeedle) return;

    const headings = container.querySelectorAll('h1, h2, h3, h4');
    for (const heading of headings) {
        const headingId = (heading.id || '').toLowerCase();
        const headingText = (heading.textContent || '').toLowerCase();
        if (headingId.includes(targetNeedle) || headingText.includes(targetNeedle)) {
            setTimeout(() => {
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
            return;
        }
    }
}

async function loadNoteFile(filePath, title, activeBtn) {
    const readerScreen = document.getElementById('readerScreen');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const readerTitle = document.getElementById('readerTitle');
    const noteContentBody = document.getElementById('readerContent') || document.getElementById('noteContentBody');
    if (!readerScreen || !noteContentBody || !readerTitle) return;

    if (activeBtn && activeBtn.parentElement) {
        activeBtn.parentElement.querySelectorAll('.note-item-btn').forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    const [basePath, anchorId] = String(filePath || '').split('#');
    readerTitle.textContent = title;
    document.querySelectorAll('.screen.active').forEach(s => {
        if (s !== readerScreen) s.classList.remove('active');
    });
    readerScreen.classList.add('active');
    readerScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // If basePath is already loaded in noteContentBody, skip network fetch and scroll directly
    if (basePath && appData.currentNoteBasePath === basePath && noteContentBody.innerHTML && noteContentBody.innerHTML !== '載入中...') {
        if (anchorId) {
            scrollToNoteAnchor(noteContentBody, anchorId);
        } else {
            readerScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        void persistAccountCourseProgress(title, filePath);
        return;
    }

    appData.currentNoteBasePath = '';
    noteContentBody.innerHTML = '載入中...';

    try {
        const resp = await fetch(basePath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const md = await resp.text();
        if (typeof marked !== 'undefined') {
            noteContentBody.innerHTML = marked.parse(md);
        } else {
            noteContentBody.innerHTML = `<pre style="white-space:pre-wrap;">${md}</pre>`;
        }
        appData.currentNoteBasePath = basePath;
        // Apply syntax highlight-friendly styles to code blocks
        noteContentBody.querySelectorAll('pre code').forEach(block => {
            block.classList.add('code-block');
        });
        if (typeof mermaid !== 'undefined') {
            mermaid.run({ nodes: noteContentBody.querySelectorAll('.language-mermaid') });
        }
        renderMathInContainer(noteContentBody);
        if (anchorId) {
            scrollToNoteAnchor(noteContentBody, anchorId);
        }
        void persistAccountCourseProgress(title, filePath);
    } catch (e) {
        const hint = (location.protocol === 'file:')
            ? '<br><small style="color:var(--text-secondary);">提示：在瀏覽器直接開啟 HTML 檔案時無法讀取筆記，請使用本機伺服器啟動：<br><code style="background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:4px;">npx serve exam</code> 或 <code style="background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:4px;">python -m http.server 8000 -d exam</code></small>'
            : '';
        noteContentBody.innerHTML = `<p style="color:var(--danger);">載入失敗：${e.message}${hint}</p>`;
    }
}

function openReader(title, filePath) {
    return loadNoteFile(filePath, title);
}

function showExamSubjectModal() {
    if (examSubjectModal) examSubjectModal.classList.add('active');
}

// Start Mock Exam for a specific subject (50 Questions / Dynamic Minutes)
function hideExamSubjectModal() {
    if (examSubjectModal) examSubjectModal.classList.remove('active');
}

async function startExamSubjectMode(subjKey) {
    hideExamSubjectModal();
    
    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    if (!mod) return;
    
    const targetSubj = mod.subjects.find(s => s.id === subjKey);
    if (!targetSubj) return;
    
    // Filter questions belonging to this subject
    const pool = appData.questions.filter(q => {
        return targetSubj.matchKeywords.some(keyword => q.subject.includes(keyword));
    });
    
    if (pool.length < 50) {
        alert(`該考科題庫僅有 ${pool.length} 題，不足 50 題，無法生成全真模擬考！`);
        return;
    }
    
    const strategy = document.getElementById('selExamSamplingStrategy')?.value || 'balanced_topic';
    const excludePastExams = Boolean(document.getElementById('chkExcludePastExams')?.checked);
    
    appData.currentQuiz = window.ExamCore.sampleExamQuestions(pool, 50, {
        strategy,
        excludePastExams,
        shuffleFn: shuffleArray
    });
    appData.quizMode = 'exam';
    appData.currentExamSubject = subjKey;
    
    practiceSetup.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    
    await initQuizSession('exam');
}



// Common initialization for a quiz session
async function initQuizSession(mode) {
    appData.userAnswers = {};
    appData.checkedQuestions = new Set();
    appData.flaggedQuestions = {};
    appData.committedEvents = Object.create(null);
    appData.currentQuestionIdx = 0;
    appData.currentIndex = 0;
    appData.quizActive = true;
    
    const durationMinutes = (appData.currentCert === 'ai_mid') ? 90 : 75;
    appData.timerDurationSeconds = durationMinutes * 60;
    appData.timeRemaining = appData.timerDurationSeconds;
    appData.timeSpent = 0;
    appData.timerStartedAt = null;
    appData.examEndTime = mode === 'exam' ? (Date.now() + appData.timeRemaining * 1000) : null;
    await restoreAccountFlagsForQuiz();
    
    document.querySelector('.quiz-nav-panel').classList.remove('hidden');
    
    // Handle timer
    clearInterval(appData.timerInterval);
    if (mode === 'exam') {
        startTimer(appData.timeRemaining);
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
    saveActiveQuizToStorage();
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
function startTimer(initialRemainingSeconds = appData.timerDurationSeconds) {
    const totalDuration = appData.timerDurationSeconds || initialRemainingSeconds;
    const alreadyElapsedMs = Math.max(0, (totalDuration - initialRemainingSeconds) * 1000);
    appData.timerStartedAt = Date.now() - alreadyElapsedMs;
    appData.examEndTime = Date.now() + initialRemainingSeconds * 1000;
    updateTimerText();
    appData.timerInterval = setInterval(() => {
        const snapshot = window.ExamCore.getTimerSnapshot(
            appData.timerStartedAt,
            appData.timerDurationSeconds
        );
        appData.timeRemaining = snapshot.timeRemaining;
        appData.timeSpent = snapshot.timeSpent;
        updateTimerText();

        if (snapshot.expired && appData.quizActive) {
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
        btn.addEventListener('click', () => jumpToQuestion(idx));
        navGrid.appendChild(btn);
    });
    updateProgress();
}

function jumpToQuestion(idx) {
    if (idx >= 0 && idx < appData.currentQuiz.length) {
        showQuestion(idx);
        saveActiveQuizToStorage();
    }
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
    appData.currentIndex = idx;
    const q = appData.currentQuiz[idx];
    
    // Update headers
    lblSubject.textContent = q.subject;
    lblChapter.textContent = q.chapter;
    lblIndex.textContent = `第 ${idx + 1} / ${appData.currentQuiz.length} 題 (原始題號: ${q.display_num ?? q.num})`;
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
        
        const letter = prefixes[oIdx];
        const cleanOpt = stripOptionPrefix(opt, letter);
        card.innerHTML = `
            <div class="option-prefix">${letter}</div>
            <div class="option-text">${formatQuestionText(cleanOpt)}</div>
        `;
        
        // Handle option selection click
        card.addEventListener('click', () => selectOption(idx, oIdx));
        optionsList.appendChild(card);
    });
    renderMathInContainer(qText);
    renderMathInContainer(optionsList);
    
    // Toggle Prev/Next buttons
    btnPrev.disabled = idx === 0;
    
    if (idx === appData.currentQuiz.length - 1) {
        btnNext.classList.add('hidden');
        btnSubmit.textContent = appData.quizMode === 'exam' ? '提交考卷' : '完成練習';
        btnSubmit.classList.remove('hidden');
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
    if (appData.quizMode === 'practice') {
        appData.checkedQuestions.add(qIdx);
    }
    
    // Update nav button class
    const btn = document.getElementById(`navBtn_${qIdx}`);
    if (btn) btn.classList.add('answered');
    
    // Redraw current question to apply selection styles
    showQuestion(qIdx);
    updateProgress();
    saveActiveQuizToStorage();

    // Practice persistence belongs to the answer event, never to screen rendering.
    if (appData.quizMode === 'practice') {
        persistPracticeAnswer(qIdx);
    }
}

function checkAnswer() {
    const idx = appData.currentQuestionIdx;
    if (appData.userAnswers[idx] === undefined) return;
    appData.checkedQuestions.add(idx);
    if (appData.quizMode === 'practice') {
        showPracticeFeedback(idx);
        persistPracticeAnswer(idx);
    }
    saveActiveQuizToStorage();
}

function persistPracticeAnswer(qIdx) {
    const eventKey = `practice-answer:${qIdx}`;
    if (!window.ExamCore.claimOnce(appData.committedEvents, eventKey)) return;

    const q = appData.currentQuiz[qIdx];
    const correctIdx = window.ExamCore.ANSWER_PREFIXES.indexOf(String(q.answer || '').toUpperCase());
    const isCorrect = appData.userAnswers[qIdx] === correctIdx;
    const operations = [persistAccountQuestionEvent(appData.currentCert, q, {
        type: 'answer',
        isCorrect,
        occurredAt: new Date().toISOString()
    })];

    if (!isAccountMode()) {
        operations.push(updateQuestionStats(appData.currentCert, q, isCorrect));
        if (isCorrect) {
            operations.push(updateWrongPoolAfterCorrect(appData.currentCert, q));
        } else {
            operations.push(addWrongQuestion(appData.currentCert, q));
        }
    }

    void Promise.allSettled(operations).then(() => refreshWrongPoolCount());
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
    let explText = `${formatStandardAnswerHeader(correctLetter, q.ans_text)}\n\n`;
    if (q.explanation) {
        explText += `解析：\n${q.explanation}`;
    } else {
        explText += '無額外解析資訊。';
    }
    lblExplanationText.innerHTML = formatQuestionText(explText);
    feedbackArea.classList.remove('hidden');
    renderMathInContainer(feedbackArea);
}

// Star flagging toggle
function toggleFlag() {
    const idx = appData.currentQuestionIdx;
    appData.flaggedQuestions[idx] = !appData.flaggedQuestions[idx];
    const question = appData.currentQuiz[idx];
    if (question) {
        void persistAccountQuestionEvent(appData.currentCert, question, {
            type: 'flag',
            flagged: appData.flaggedQuestions[idx],
            occurredAt: new Date().toISOString()
        });
    }
    
    const btn = document.getElementById(`navBtn_${idx}`);
    if (btn) {
        if (appData.flaggedQuestions[idx]) {
            btn.classList.add('flagged');
        } else {
            btn.classList.remove('flagged');
        }
    }
    
    showQuestion(idx);
    saveActiveQuizToStorage();
}

// Previous/Next navigation functions
function prevQuestion() {
    if (appData.currentQuestionIdx > 0) {
        showQuestion(appData.currentQuestionIdx - 1);
        saveActiveQuizToStorage();
    }
}

function nextQuestion() {
    if (appData.currentQuestionIdx < appData.currentQuiz.length - 1) {
        showQuestion(appData.currentQuestionIdx + 1);
        saveActiveQuizToStorage();
    }
}

// Submit confirmations
function confirmSubmitExam() {
    const total = appData.currentQuiz.length;
    const answered = Object.keys(appData.userAnswers).length;
    const unanswered = total - answered;

    let confirmMsg = appData.quizMode === 'exam'
        ? '您確定要交卷嗎？'
        : '要完成本次練習並查看結果嗎？';
    if (unanswered > 0) {
        confirmMsg = appData.quizMode === 'exam'
            ? `您還有 ${unanswered} 題尚未回答！確定要交卷嗎？`
            : `您還有 ${unanswered} 題尚未練習，仍要查看本次結果嗎？`;
    }
    
    if (confirm(confirmMsg)) {
        gradeQuiz();
    }
}

function confirmQuitQuiz() {
    clearInterval(appData.timerInterval);
    appData.quizActive = false;
    clearActiveQuizStorage();
    transitionScreen(quizScreen, welcomeScreen);
}

function exitQuizSession() {
    if (confirm('您確定要退出本次測驗嗎？這會遺失當前的進度。')) {
        confirmQuitQuiz();
    }
}

function finishQuiz() {
    return gradeQuiz();
}

// Grading Algorithm
function gradeQuiz() {
    if (!appData.currentQuiz.length) return;
    if (!window.ExamCore.claimOnce(appData.committedEvents, 'quiz-result')) return;

    if (appData.quizMode === 'exam' && appData.timerStartedAt !== null) {
        const snapshot = window.ExamCore.getTimerSnapshot(
            appData.timerStartedAt,
            appData.timerDurationSeconds
        );
        appData.timeRemaining = snapshot.timeRemaining;
        appData.timeSpent = snapshot.timeSpent;
    }
    clearInterval(appData.timerInterval);
    appData.quizActive = false;
    clearActiveQuizStorage();

    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    const result = window.ExamCore.buildQuizResult({
        questions: appData.currentQuiz,
        userAnswers: appData.userAnswers,
        subjects: mod ? mod.subjects : []
    });

    appData.currentQuiz.forEach((question, index) => {
        question.gradedResult = result.gradedResults[index];
    });
    persistQuizResult(result);

    // Display dashboard scores
    lblScore.textContent = result.score;

    // Score Circle Animation
    const circumference = 283; // 2 * PI * r (45) = 282.7
    const offset = circumference - (result.score / 100) * circumference;
    scoreCircleProgress.style.strokeDashoffset = offset;
    scoreCircleProgress.style.stroke = result.passed ? 'var(--success)' : 'var(--danger)';

    // Feedback details text
    if (appData.quizMode === 'practice') {
        lblResultTitle.textContent = `練習完成：${result.score} 分`;
        lblResultTitle.style.color = result.passed ? 'var(--success)' : 'var(--warning)';
        lblResultDesc.textContent = '本次練習已完成，可從下方覆盤答題結果與相關解析。';
    } else {
        lblResultTitle.textContent = result.passed ? '🎉 及格！恭喜通過！' : '⚠️ 分數未及格，請繼續加油！';
        lblResultTitle.style.color = result.passed ? 'var(--success)' : 'var(--danger)';
        lblResultDesc.textContent = result.passed
            ? '恭喜你達到 70 分及格門檻，你已經具備一定的專業水準！'
            : '離 70 分及格門檻差了一點，建議檢驗下方錯題，並複習相關單元講義。';
    }

    // Standard statistics labels
    const minsUsed = Math.floor(appData.timeSpent / 60);
    const secsUsed = appData.timeSpent % 60;
    lblTimeSpent.textContent = appData.quizMode === 'exam' ?
        `${minsUsed} 分 ${secsUsed} 秒` : '無限制';

    lblCorrectCount.textContent = `${result.correctCount} / ${result.total} 題`;
    lblAnswerRate.textContent = `${result.answerRate}%`;

    // Build breakdown bars
    buildBreakdownHTML(result.subjectStats);

    // Render the final review accordion list
    renderReviewList();

    // Show Screen
    transitionScreen(quizScreen, resultsScreen);
}

async function persistQuizResult(result) {
    if (!appData.currentCert) return;

    const operations = [];
    if (appData.quizMode === 'exam') {
        appData.currentQuiz.forEach((question, index) => {
            const isCorrect = result.gradedResults[index] === 'correct';
            operations.push(persistAccountQuestionEvent(appData.currentCert, question, {
                type: 'answer',
                isCorrect,
                occurredAt: new Date().toISOString()
            }));
            if (!isAccountMode()) {
                operations.push(updateQuestionStats(appData.currentCert, question, isCorrect));
                if (isCorrect) {
                    operations.push(updateWrongPoolAfterCorrect(appData.currentCert, question));
                } else {
                    operations.push(addWrongQuestion(appData.currentCert, question));
                }
            }
        });
    }
    if (!isAccountMode()) {
        operations.push(saveStats(appData.currentCert, result.correctCount, result.answeredCount));
        operations.push(saveQuizHistory(
            appData.currentCert,
            result.correctCount,
            result.total,
            result.score,
            appData.quizMode
        ));
    }
    operations.push(persistAccountQuizAttempt(result));

    await Promise.allSettled(operations);
    await Promise.all([refreshWrongPoolCount(), refreshAnsweredStats()]);
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
            const letter = prefixes[oIdx];
            const cleanOpt = stripOptionPrefix(opt, letter);
            optionsHtml += `
                <div class="option-card card ${optClass}" style="cursor: default; pointer-events: none;">
                    <div class="option-prefix">${letter}</div>
                    <div class="option-text">${formatQuestionText(cleanOpt)}</div>
                </div>
            `;
        });
        
        const standardHeader = formatStandardAnswerHeader(q.answer, q.ans_text);
        accordion.innerHTML = `
            <div class="accordion-header">
                <span class="accordion-header-text review-q-stem">
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
            <div class="accordion-content review-item">
                <div class="options-list" style="margin-bottom: 20px;">
                    ${optionsHtml}
                </div>
                <div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}" style="margin: 0;">
                    <div class="feedback-header">
                        <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
                        <span class="feedback-title">你的回答：${userChoiceLetter} | 標準答案：${q.answer}</span>
                    </div>
                    <div class="feedback-body">
                        <p class="review-ans-header"><strong>${formatQuestionText(standardHeader)}</strong></p>
                        ${q.explanation ? `<div class="review-explanation explanation-text" style="margin-top:10px;"><strong>官方詳細解析：</strong><br>${formatQuestionText(q.explanation)}</div>` : ''}
                        <p style="margin-top:10px; font-size:12px; color:var(--text-muted);">
                            類別：${q.subject} > ${q.chapter} | ${q.assessmentTopic || ''}${q.assessmentContent ? ' > ' + q.assessmentContent : ''} | 原始題號: ${q.display_num ?? q.num}
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
    renderMathInContainer(reviewQuestionsList);
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

// Markdown, table, and math formatter helpers
function formatQuestionText(raw) {
    if (window.ExamCore && typeof window.ExamCore.formatQuestionText === 'function') {
        return window.ExamCore.formatQuestionText(raw);
    }
    return String(raw || '');
}

function stripOptionPrefix(optText, letter) {
    if (window.ExamCore && typeof window.ExamCore.stripOptionPrefix === 'function') {
        return window.ExamCore.stripOptionPrefix(optText, letter);
    }
    return String(optText || '');
}

function formatStandardAnswerHeader(correctLetter, ansText) {
    if (window.ExamCore && typeof window.ExamCore.formatStandardAnswerHeader === 'function') {
        return window.ExamCore.formatStandardAnswerHeader(correctLetter, ansText);
    }
    return `標準答案：(${correctLetter}) ${ansText || ''}`.trim();
}

function renderMathInContainer(el) {
    if (!el || typeof renderMathInElement !== 'function') return;
    renderMathInElement(el, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false
    });
}

// Taiwan ID validation functions
function getOrCreateDeviceId() {
    const storageKey = 'ipas_device_id_v1';
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const deviceId = `dev_${randomPart}`;
    localStorage.setItem(storageKey, deviceId);
    return deviceId;
}

function createOperationId() {
    const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    return `op_${randomPart}`;
}

function setAccountSession(session) {
    appData.accountSession = session;
    saveActiveSessionToStorage();
    if (btnLogout) btnLogout.classList.remove('hidden');
    void renderSyncStatus().then(() => flushSyncOutbox());
}

async function renderSyncStatus() {
    if (!syncStatus || !syncStatusText) return;
    const session = appData.accountSession;
    if (!session) {
        syncStatus.dataset.mode = 'logged-out';
        syncStatusText.textContent = '未登入';
        syncStatus.title = '尚未建立工作階段';
        return;
    }
    if (session.mode !== 'account') {
        syncStatus.dataset.mode = 'local-only';
        syncStatusText.textContent = '本機模式';
        syncStatus.title = '目前後端只提供登入驗證，尚未提供帳戶同步契約';
        return;
    }
    if (window.ExamAccountCore.isSessionExpired(session)) {
        syncStatus.dataset.mode = 'error';
        syncStatusText.textContent = '登入已到期';
        syncStatus.title = '請登出後重新登入以更新帳戶工作階段';
        return;
    }

    const { pending, conflicts } = await getSyncOperationCounts(session.userId);
    if (conflicts > 0) {
        syncStatus.dataset.mode = 'error';
        syncStatusText.textContent = `同步衝突 ${conflicts}`;
        syncStatus.title = '伺服器拒絕部分操作，資料仍保留在本機等待處理';
        return;
    }
    if (pending > 0) {
        syncStatus.dataset.mode = 'pending';
        syncStatusText.textContent = `待同步 ${pending}`;
        syncStatus.title = session.syncEnabled ? '有離線操作等待同步' : '後端尚未啟用同步端點';
    } else {
        syncStatus.dataset.mode = 'account';
        syncStatusText.textContent = session.syncEnabled ? '同步可用' : '帳戶已驗證';
        syncStatus.title = session.syncEnabled ? '帳戶同步契約可用' : '帳戶快取已分區，但同步端點未啟用';
    }
}

function logoutUser() {
    appData.accountSession = null;
    clearActiveSessionStorage();
    clearActiveQuizStorage();
    const idInput = document.getElementById('txtNationalID');
    if (idInput) idInput.value = '';
    window.location.reload();
}

function handleLogout() {
    logoutUser();
}

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
    if (accountApi) {
        btnLogin.disabled = true;
        btnLogin.textContent = "驗證中...";
        loginError.style.display = 'none';
        
        try {
            const data = await accountApi.login({ nationalId: idVal, userAgent: navigator.userAgent });
            if (data.success) {
                    setAccountSession(window.ExamAccountCore.parseLoginCapability(data));
                    txtNationalID.value = '';
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
                    void selectCert(appData.currentCert);
            } else {
                loginError.textContent = `⚠️ 驗證失敗：${data.message || '查無此帳號！'}`;
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
        setAccountSession(window.ExamAccountCore.parseLoginCapability({ success: true }));
        txtNationalID.value = '';
        loginError.style.display = 'none';
        transitionScreen(loginScreen, welcomeScreen);
        void selectCert(appData.currentCert);
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
const DB_VERSION = 5;

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
            if (!db.objectStoreNames.contains('migrationQuarantine')) {
                const store = db.createObjectStore('migrationQuarantine', { keyPath: 'id' });
                store.createIndex('certId', 'certId', { unique: false });
            }
            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta', { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains('userQuestionState')) {
                const store = db.createObjectStore('userQuestionState', { keyPath: 'id' });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('userCert', ['userId', 'certId'], { unique: false });
            }
            if (!db.objectStoreNames.contains('syncOutbox')) {
                const store = db.createObjectStore('syncOutbox', { keyPath: 'id' });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('userStatus', ['userId', 'status'], { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
            if (!db.objectStoreNames.contains('accountQuizAttempts')) {
                const store = db.createObjectStore('accountQuizAttempts', { keyPath: 'id' });
                store.createIndex('userCert', ['userId', 'certId'], { unique: false });
            }
            if (!db.objectStoreNames.contains('accountAttemptAnswers')) {
                const store = db.createObjectStore('accountAttemptAnswers', { keyPath: 'id' });
                store.createIndex('attemptId', 'attemptId', { unique: false });
            }
            if (!db.objectStoreNames.contains('courseProgress')) {
                const store = db.createObjectStore('courseProgress', { keyPath: 'id' });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('userCert', ['userId', 'certId'], { unique: false });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function readIndexedDBRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function readStoreByCert(db, storeName, certId) {
    const tx = db.transaction(storeName, 'readonly');
    return readIndexedDBRequest(tx.objectStore(storeName).index('certId').getAll(certId));
}

function finishTransaction(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    });
}

function isAccountMode() {
    return appData.accountSession?.mode === 'account';
}

async function loadAccountQuestionStates(userId, certId) {
    if (!userId || !certId) return [];
    const db = await openDB();
    const tx = db.transaction('userQuestionState', 'readonly');
    const index = tx.objectStore('userQuestionState').index('userCert');
    return readIndexedDBRequest(index.getAll(IDBKeyRange.only([userId, certId])));
}

async function restoreAccountFlagsForQuiz() {
    if (!isAccountMode()) return;
    const states = await loadAccountQuestionStates(appData.accountSession.userId, appData.currentCert);
    const flaggedUids = new Set(states.filter(state => state.flagged).map(state => state.question_uid));
    appData.currentQuiz.forEach((question, index) => {
        if (flaggedUids.has(question.question_uid)) appData.flaggedQuestions[index] = true;
    });
}

async function getSyncOperationCounts(userId) {
    if (!userId) return { pending: 0, conflicts: 0 };
    try {
        const db = await openDB();
        const pendingTx = db.transaction('syncOutbox', 'readonly');
        const pendingIndex = pendingTx.objectStore('syncOutbox').index('userStatus');
        const pending = await readIndexedDBRequest(pendingIndex.count(IDBKeyRange.only([userId, 'pending'])));
        const conflictTx = db.transaction('syncOutbox', 'readonly');
        const conflictIndex = conflictTx.objectStore('syncOutbox').index('userStatus');
        const conflicts = await readIndexedDBRequest(conflictIndex.count(IDBKeyRange.only([userId, 'conflict'])));
        return { pending, conflicts };
    } catch (error) {
        console.warn('讀取待同步操作失敗:', error);
        return { pending: 0, conflicts: 0 };
    }
}

async function loadPendingSyncOperations(userId, limit = 50) {
    const db = await openDB();
    const tx = db.transaction('syncOutbox', 'readonly');
    const index = tx.objectStore('syncOutbox').index('userStatus');
    return readIndexedDBRequest(index.getAll(IDBKeyRange.only([userId, 'pending']), limit));
}

async function updateSyncOperationResults(operations, acceptedIds, rejectedIds, failureMessage = '') {
    if (operations.length === 0) return;
    const accepted = new Set(acceptedIds);
    const rejected = new Set(rejectedIds);
    const db = await openDB();
    const tx = db.transaction('syncOutbox', 'readwrite');
    const store = tx.objectStore('syncOutbox');
    for (const operation of operations) {
        if (accepted.has(operation.operationId)) {
            store.delete(operation.id);
        } else {
            operation.attempts = (operation.attempts || 0) + 1;
            operation.lastAttemptAt = new Date().toISOString();
            if (rejected.has(operation.operationId)) {
                operation.status = 'conflict';
                operation.lastError = 'server rejected operation';
            } else {
                operation.status = 'pending';
                operation.lastError = failureMessage || 'operation was not acknowledged';
            }
            store.put(operation);
        }
    }
    await finishTransaction(tx);
}

async function flushSyncOutbox() {
    const session = appData.accountSession;
    if (appData.syncInFlight || session?.mode !== 'account' ||
        window.ExamAccountCore.isSessionExpired(session) || !session.syncEnabled || !navigator.onLine) {
        await renderSyncStatus();
        return;
    }
    appData.syncInFlight = true;
    let operations = [];
    try {
        operations = await loadPendingSyncOperations(session.userId);
        if (operations.length === 0) return;
        if (syncStatus && syncStatusText) {
            syncStatus.dataset.mode = 'pending';
            syncStatusText.textContent = `同步中 ${operations.length}`;
        }
        const result = await accountApi.pushOperations(session, operations);
        await updateSyncOperationResults(operations, result.acceptedIds, result.rejectedIds);
    } catch (error) {
        console.warn('帳戶同步失敗，操作保留於本機:', error);
        await updateSyncOperationResults(operations, [], [], String(error.message || 'sync failed'));
    } finally {
        appData.syncInFlight = false;
        await renderSyncStatus();
    }
}

async function persistAccountQuestionEvent(certId, question, event) {
    const session = appData.accountSession;
    if (session?.mode !== 'account') return;

    const db = await openDB();
    const stateId = window.ExamAccountCore.getAccountQuestionStateId(
        session.userId,
        certId,
        question.question_uid
    );
    const tx = db.transaction(['userQuestionState', 'syncOutbox'], 'readwrite');
    const stateStore = tx.objectStore('userQuestionState');
    const outboxStore = tx.objectStore('syncOutbox');
    const request = stateStore.get(stateId);

    await new Promise((resolve, reject) => {
        let eventError = null;
        request.onsuccess = () => {
            try {
                const current = request.result || {
                    id: stateId,
                    userId: session.userId,
                    certId,
                    question_uid: question.question_uid,
                    display_num: question.display_num ?? question.num,
                    subject: question.subject,
                    chapter: question.chapter,
                    assessmentTopic: question.assessmentTopic || '',
                    assessmentContent: question.assessmentContent || '',
                    question: question.question,
                    options: question.options,
                    answer: question.answer,
                    ans_text: question.ans_text,
                    explanation: question.explanation || ''
                };
                const next = window.ExamAccountCore.applyQuestionStateEvent(current, event);
                if (event.type === 'answer' && !event.isCorrect) {
                    if (current.nextReviewDate) sm2Schedule(next, 1);
                    else Object.assign(next, createSM2Card());
                    next.lastWrongDate = event.occurredAt;
                } else if (event.type === 'answer' && event.isCorrect && next.wrongCount > 0) {
                    sm2Schedule(next, 4);
                }
                stateStore.put(next);
                const operation = window.ExamAccountCore.buildSyncOperation({
                    operationId: createOperationId(),
                    userId: session.userId,
                    deviceId: appData.deviceId,
                    type: 'question_state_changed',
                    payload: {
                        cert_id: certId,
                        question_uid: question.question_uid,
                        flagged: next.flagged,
                        correct_count: next.correctCount,
                        wrong_count: next.wrongCount,
                        last_result: next.lastResult,
                        revision: next.revision,
                        updated_at: next.updatedAt
                    },
                    createdAt: event.occurredAt
                });
                outboxStore.put(operation);
            } catch (error) {
                eventError = error;
                tx.abort();
            }
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(eventError || tx.error);
        tx.onabort = () => reject(eventError || tx.error || new Error('Account state transaction aborted'));
    });
    await renderSyncStatus();
    void flushSyncOutbox();
}

async function persistAccountQuizAttempt(result) {
    const session = appData.accountSession;
    if (session?.mode !== 'account') return;

    const createdAt = new Date().toISOString();
    const attemptId = createOperationId().replace(/^op_/, 'attempt_');
    const answers = appData.currentQuiz.map((question, index) => ({
        id: `${attemptId}|${question.question_uid}`,
        attemptId,
        userId: session.userId,
        question_uid: question.question_uid,
        selected_option: appData.userAnswers[index] ?? null,
        result: result.gradedResults[index],
        flagged: Boolean(appData.flaggedQuestions[index])
    }));
    const attempt = {
        id: attemptId,
        userId: session.userId,
        certId: appData.currentCert,
        mode: appData.quizMode,
        correct: result.correctCount,
        total: result.total,
        score: result.score,
        completedAt: createdAt,
        revision: 1
    };
    const operation = window.ExamAccountCore.buildSyncOperation({
        operationId: createOperationId(),
        userId: session.userId,
        deviceId: appData.deviceId,
        type: 'quiz_attempt_completed',
        payload: { attempt, answers },
        createdAt
    });

    const db = await openDB();
    const tx = db.transaction(['accountQuizAttempts', 'accountAttemptAnswers', 'syncOutbox'], 'readwrite');
    tx.objectStore('accountQuizAttempts').put(attempt);
    const answerStore = tx.objectStore('accountAttemptAnswers');
    answers.forEach(answer => answerStore.put(answer));
    tx.objectStore('syncOutbox').put(operation);
    await finishTransaction(tx);
    await renderSyncStatus();
    void flushSyncOutbox();
}

async function persistAccountCourseProgress(title, filePath) {
    const session = appData.accountSession;
    if (session?.mode !== 'account') return;
    const updatedAt = new Date().toISOString();
    const id = `${session.userId}|${appData.currentCert}|${filePath}`;
    const progress = {
        id,
        userId: session.userId,
        certId: appData.currentCert,
        assetPath: filePath,
        title,
        status: 'opened',
        progress: 0,
        updatedAt
    };
    const operation = window.ExamAccountCore.buildSyncOperation({
        operationId: createOperationId(),
        userId: session.userId,
        deviceId: appData.deviceId,
        type: 'course_progress_changed',
        payload: {
            cert_id: appData.currentCert,
            asset_path: filePath,
            status: progress.status,
            progress: progress.progress,
            updated_at: updatedAt
        },
        createdAt: updatedAt
    });
    const db = await openDB();
    const tx = db.transaction(['courseProgress', 'syncOutbox'], 'readwrite');
    tx.objectStore('courseProgress').put(progress);
    tx.objectStore('syncOutbox').put(operation);
    await finishTransaction(tx);
    await renderSyncStatus();
    void flushSyncOutbox();
}

function mergeMigratedEntry(storeName, current, legacy, question, certId) {
    const identity = {
        id: window.ExamCore.getQuestionStorageId(certId, question),
        certId,
        question_uid: question.question_uid,
        display_num: question.display_num ?? question.num,
        num: question.display_num ?? question.num,
        subject: question.subject,
        chapter: question.chapter
    };
    const merged = { ...legacy, ...current, ...identity };

    if (storeName === 'wrongPool') {
        merged.wrongCount = (current?.wrongCount || 0) + (legacy.wrongCount || 1);
        merged.lastWrongDate = [current?.lastWrongDate, legacy.lastWrongDate].filter(Boolean).sort().pop() || '';
        merged.assessmentTopic = question.assessmentTopic || legacy.assessmentTopic || '';
        merged.assessmentContent = question.assessmentContent || legacy.assessmentContent || '';
        merged.question = question.question;
        merged.options = question.options;
        merged.answer = question.answer;
        merged.ans_text = question.ans_text;
        merged.explanation = question.explanation || '';
    } else {
        merged.correct = (current?.correct || 0) + (legacy.correct || 0);
        merged.wrong = (current?.wrong || 0) + (legacy.wrong || 0);
        merged.lastSeen = [current?.lastSeen, legacy.lastSeen].filter(Boolean).sort().pop() || null;
    }
    return merged;
}

async function migrateLegacyStore(db, storeName, certId, questions) {
    const entries = await readStoreByCert(db, storeName, certId);
    const currentById = new Map(entries.filter(entry => entry.question_uid).map(entry => [entry.id, entry]));
    const puts = new Map();
    const deletes = [];
    const quarantine = [];
    let migrated = 0;

    for (const legacy of entries.filter(entry => !entry.question_uid)) {
        const resolution = window.ExamCore.resolveLegacyQuestion(legacy, questions);
        if (resolution.status === 'resolved') {
            const question = questions.find(item => item.question_uid === resolution.question_uid);
            if (!question) throw new Error(`Resolved question not found: ${resolution.question_uid}`);
            const newId = window.ExamCore.getQuestionStorageId(certId, question);
            const current = puts.get(newId) || currentById.get(newId);
            const merged = mergeMigratedEntry(storeName, current, legacy, question, certId);
            puts.set(newId, merged);
            currentById.set(newId, merged);
            deletes.push(legacy.id);
            migrated++;
        } else {
            quarantine.push({
                id: `${certId}:${storeName}:${legacy.id}`,
                certId,
                storeName,
                legacyId: legacy.id,
                reason: resolution.status,
                candidate_uids: resolution.candidate_uids || [],
                legacyEntry: legacy,
                quarantinedAt: new Date().toISOString()
            });
            deletes.push(legacy.id);
        }
    }

    if (puts.size > 0 || deletes.length > 0 || quarantine.length > 0) {
        const tx = db.transaction([storeName, 'migrationQuarantine'], 'readwrite');
        const store = tx.objectStore(storeName);
        const quarantineStore = tx.objectStore('migrationQuarantine');
        for (const entry of puts.values()) store.put(entry);
        for (const id of deletes) store.delete(id);
        for (const entry of quarantine) quarantineStore.put(entry);
        await finishTransaction(tx);
    }

    return { migrated, quarantined: quarantine.length };
}

async function migrateLegacyQuestionState(certId, questions) {
    const metaKey = `legacy-question-keys:${certId}:v4`;
    try {
        const db = await openDB();
        const existing = await readIndexedDBRequest(db.transaction('meta', 'readonly').objectStore('meta').get(metaKey));
        if (existing?.done) return { migrated: 0, quarantined: 0 };

        const wrongPool = await migrateLegacyStore(db, 'wrongPool', certId, questions);
        const questionStats = await migrateLegacyStore(db, 'questionStats', certId, questions);
        const result = {
            migrated: wrongPool.migrated + questionStats.migrated,
            quarantined: wrongPool.quarantined + questionStats.quarantined
        };
        const tx = db.transaction('meta', 'readwrite');
        tx.objectStore('meta').put({ key: metaKey, done: true, completedAt: new Date().toISOString(), ...result });
        await finishTransaction(tx);
        return result;
    } catch (error) {
        console.warn('舊版題目資料搬移失敗，將於下次重試:', error);
        return { migrated: 0, quarantined: 0 };
    }
}

async function getWrongPool(certId) {
    if (isAccountMode()) {
        try {
            const states = await loadAccountQuestionStates(appData.accountSession.userId, certId);
            const questionByUid = new Map(appData.questions.map(question => [question.question_uid, question]));
            return states
                .filter(state => (state.wrongCount || 0) > 0)
                .map(state => ({
                    ...(questionByUid.get(state.question_uid) || {}),
                    ...state,
                    wrongCount: state.wrongCount || 0,
                    nextReviewDate: state.nextReviewDate || new Date().toISOString().split('T')[0]
                }));
        } catch (error) {
            console.warn('讀取帳戶錯題池失敗:', error);
            return [];
        }
    }
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
        const entry = {
            id: window.ExamCore.getQuestionStorageId(certId, q),
            certId: certId,
            question_uid: q.question_uid,
            display_num: q.display_num ?? q.num,
            num: q.display_num ?? q.num,
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
                    existing.question_uid = q.question_uid;
                    existing.display_num = q.display_num ?? q.num;
                    existing.num = q.display_num ?? q.num;
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

async function updateWrongPoolAfterCorrect(certId, question) {
    try {
        const db = await openDB();
        const id = window.ExamCore.getQuestionStorageId(certId, question);
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
    if (isAccountMode()) {
        const states = await loadAccountQuestionStates(appData.accountSession.userId, certId);
        return states.reduce((summary, state) => {
            summary.totalAnswered += (state.correctCount || 0) + (state.wrongCount || 0);
            summary.totalCorrect += state.correctCount || 0;
            return summary;
        }, { certId, totalAnswered: 0, totalCorrect: 0, quizCount: 0 });
    }
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
    if (isAccountMode()) {
        try {
            const db = await openDB();
            const tx = db.transaction('accountQuizAttempts', 'readonly');
            const index = tx.objectStore('accountQuizAttempts').index('userCert');
            const attempts = await readIndexedDBRequest(index.getAll(IDBKeyRange.only([
                appData.accountSession.userId,
                certId
            ])));
            return attempts
                .sort((left, right) => (right.completedAt || '').localeCompare(left.completedAt || ''))
                .slice(0, limit)
                .map(attempt => ({ ...attempt, timestamp: attempt.completedAt }));
        } catch (error) {
            console.warn('讀取帳戶測驗歷史失敗:', error);
            return [];
        }
    }
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

async function updateQuestionStats(certId, question, isCorrect) {
    try {
        const db = await openDB();
        const id = window.ExamCore.getQuestionStorageId(certId, question);
        return new Promise((resolve, reject) => {
            const tx = db.transaction('questionStats', 'readwrite');
            const store = tx.objectStore('questionStats');
            const req = store.get(id);
            req.onsuccess = () => {
                const entry = req.result || {
                    id,
                    certId,
                    question_uid: question.question_uid,
                    display_num: question.display_num ?? question.num,
                    num: question.display_num ?? question.num,
                    subject: question.subject,
                    chapter: question.chapter,
                    correct: 0,
                    wrong: 0,
                    lastSeen: null
                };
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
    if (isAccountMode()) {
        const states = await loadAccountQuestionStates(appData.accountSession.userId, certId);
        return states.map(state => ({
            id: state.id,
            certId,
            question_uid: state.question_uid,
            display_num: state.display_num,
            num: state.display_num,
            subject: state.subject,
            chapter: state.chapter,
            correct: state.correctCount || 0,
            wrong: state.wrongCount || 0,
            lastSeen: state.updatedAt
        }));
    }
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

    const modules = window.EXAM_CONFIG.modules.filter(m => m.enabled);
    const mod = modules.find(m => m.id === appData.currentCert);
    const [wrongPool, questionStats] = await Promise.all([
        getWrongPool(appData.currentCert),
        loadQuestionStats(appData.currentCert)
    ]);

    const radarStats = window.ExamCore.buildRadarAxisStats(
        appData.questions,
        wrongPool,
        questionStats,
        mod ? mod.studyNotes : []
    );
    const axes = radarStats.axes;
    const axisLabels = axes.map(a => a.shortLabel);
    const axisWrongCounts = axes.map(a => a.wrongPoolCount);

    const maxWrong = Math.max(...axisWrongCounts, 1);
    const ctx1 = document.getElementById('radarChart');
    if (ctx1) {
        if (radarChartInstance) radarChartInstance.destroy();
        radarChartInstance = new Chart(ctx1, {
            type: 'radar',
            data: {
                labels: axisLabels,
                datasets: [{
                    label: '錯題數',
                    data: axisWrongCounts,
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const idx = items[0]?.dataIndex;
                                return (axes[idx] && axes[idx].fullName) || '';
                            },
                            label: (item) => {
                                const axis = axes[item.dataIndex];
                                if (!axis) return `錯題數: ${item.raw}`;
                                return [
                                    `錯題池：${axis.wrongPoolCount} 題`,
                                    `正確率：${axis.accuracy}%`,
                                    `已答/總題數：${axis.answeredQuestions} / ${axis.totalQuestions} 題`
                                ];
                            }
                        }
                    }
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

function buildQuestionPerformanceRows(qStats, wrongPool, questions) {
    const questionIndex = new Map((questions || []).map(question => [question.question_uid, question]));
    const performance = new Map();

    for (const stats of qStats) {
        if (!stats.question_uid) continue;
        performance.set(stats.question_uid, {
            correct: stats.correct || 0,
            wrong: stats.wrong || 0
        });
    }
    for (const wrong of wrongPool) {
        if (!wrong.question_uid) continue;
        const row = performance.get(wrong.question_uid) || { correct: 0, wrong: 0 };
        row.lastWrong = wrong.lastWrongDate || wrong.lastAnswerDate || '';
        row.wrong = Math.max(row.wrong, wrong.wrongCount || 1);
        row.subject = wrong.subject || '';
        row.chapter = wrong.chapter || '';
        row.assessmentTopic = wrong.assessmentTopic || '';
        row.assessmentContent = wrong.assessmentContent || '';
        row.display_num = wrong.display_num ?? wrong.num;
        performance.set(wrong.question_uid, row);
    }

    return [...performance.entries()].map(([questionUid, data]) => {
        const question = questionIndex.get(questionUid) || {};
        const total = data.correct + data.wrong;
        const rate = total > 0 ? Math.round((data.correct / total) * 100) : 0;
        let level;
        if (rate >= 80) level = '簡單';
        else if (rate >= 50) level = '中等';
        else if (rate >= 20) level = '困難';
        else level = '極難';
        return {
            questionUid,
            displayNum: question.display_num ?? data.display_num ?? data.num ?? '?',
            correct: data.correct,
            wrong: data.wrong,
            total,
            rate,
            level,
            diffScore: total > 0 ? Math.round((1 - data.correct / total) * 100) : 0,
            lastWrong: data.lastWrong || '',
            subject: data.subject || question.subject || '',
            chapter: data.chapter || question.chapter || '',
            assessmentTopic: data.assessmentTopic || question.assessmentTopic || '',
            assessmentContent: data.assessmentContent || question.assessmentContent || ''
        };
    });
}

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

    const rows = buildQuestionPerformanceRows(qStats, wrongPool, appData.questions);

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
            <td style="padding:6px 8px;">#${r.displayNum}</td>
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

