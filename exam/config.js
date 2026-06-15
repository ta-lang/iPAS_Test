// IPAS Mock Exam System Configuration
window.EXAM_CONFIG = {
    // 部署後的 Google Apps Script Web App URL
    apiEndpoint: "https://script.google.com/macros/s/AKfycbzy120dNjp87TE49odkLAchskuv5ig0hf0-e9lOMyBm-2buBs7lpOcElq0dVgxjRjs1/exec",
    modules: [
        {
            id: "oi",
            name: "營運智慧分析師",
            icon: "📊",
            description: "核心決策大腦、ETL/資料倉儲、統計分析與專案管理",
            enabled: true,
            questionsFile: "questions.js",
            questionsJson: "questions.json",
            questionsVar: "ipasQuestions",
            subjects: [
                { id: "s1", name: "考科一：營運智慧概論", matchKeywords: ["考科一", "營運智慧概論"] },
                { id: "s2", name: "考科二：經營管理數位化概論", matchKeywords: ["考科二", "經營管理數位化概論"] }
            ],
            studyNotes: [
                { subjectGroup: "考科一：營運智慧概論" },
                { topicGroup: "L111 營運智慧基本知識" },
                { title: "L11101 營運智慧簡介（含企業智慧）", file: "notes/oi/s1/L111_營運智慧基本知識/單元A_企業資訊系統與大腦.md" },
                { title: "L11102 營運智慧與企業管理", file: "notes/oi/s1/L111_營運智慧基本知識/單元A_企業資訊系統與大腦.md" },
                { title: "L11103 營運智慧與資訊管理", file: "notes/oi/s1/L111_營運智慧基本知識/單元A_企業資訊系統與大腦.md" },
                { title: "L11104 評估營運智慧績效", file: "notes/oi/s1/L111_營運智慧基本知識/單元A_企業資訊系統與大腦.md" },
                { topicGroup: "L112 基礎資料分析" },
                { title: "L11201 資料來源、獲取與維護", file: "notes/oi/s1/L112_基礎資料分析/單元B_資料分析與機器學習.md" },
                { title: "L11202 資料品質（結構性／非結構性）", file: "notes/oi/s1/L112_基礎資料分析/單元B_資料分析與機器學習.md" },
                { title: "L11203 常用統計概念及其資料應用", file: "notes/oi/s1/L112_基礎資料分析/單元B_資料分析與機器學習.md" },
                { title: "L11204 機器學習概念與應用", file: "notes/oi/s1/L112_基礎資料分析/單元B_資料分析與機器學習.md" },
                { subjectGroup: "考科二：經營管理數位化概論" },
                { topicGroup: "L121 經營管理基本知識" },
                { title: "L12101 企業經營環境與管理", file: "notes/oi/s2/L121_經營管理基本知識/單元C_經營管理與專案規劃.md" },
                { title: "L12102 企業各核心功能與管理活動", file: "notes/oi/s2/L121_經營管理基本知識/單元C_經營管理與專案規劃.md" },
                { topicGroup: "L122 新興數位資訊工具基本知識" },
                { title: "L12201 新興智慧資訊技術", file: "notes/oi/s1/L112_基礎資料分析/單元B_資料分析與機器學習.md" },
                { title: "L12202 企業營運常見資訊系統", file: "notes/oi/s1/L111_營運智慧基本知識/單元A_企業資訊系統與大腦.md" },
                { title: "L12203 數位創新與價值創造", file: "notes/oi/s2/L121_經營管理基本知識/單元C_經營管理與專案規劃.md" }
            ]
        },
        {
            id: "ai",
            name: "AI 應用規劃師 (初級)",
            icon: "🤖",
            description: "人工智慧基礎、生成式 AI、No-code/Low-code 與風險管理",
            enabled: true,
            questionsFile: "ai_questions.js",
            questionsJson: "ai_questions.json",
            questionsVar: "ipasAiQuestions",
            subjects: [
                { id: "s1", name: "科目一：人工智慧基礎概論", matchKeywords: ["科目一", "人工智慧基礎概論"] },
                { id: "s2", name: "科目二：生成式 AI 應用與規劃", matchKeywords: ["科目二", "生成式 AI 應用與規劃", "生成式AI應用與規劃"] }
            ],
            studyNotes: [
                { subjectGroup: "科目一：人工智慧基礎概論" },
                { title: "初級單元一：AI 基礎理論與機器學習", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { subjectGroup: "科目二：生成式 AI 應用與規劃" },
                { title: "初級單元二：生成式 AI 與無程式碼應用", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" }
            ]
        },
        {
            id: "ai_mid",
            name: "AI 應用規劃師 (中級)",
            icon: "🧠",
            description: "技術應用與規劃、大數據處理分析、機器學習技術與應用",
            enabled: true,
            questionsFile: "ai_mid_questions.js",
            questionsJson: "ai_mid_questions.json",
            questionsVar: "ipasAiMidQuestions",
            subjects: [
                { id: "s1", name: "科目一：人工智慧技術應用與規劃", matchKeywords: ["科目一", "人工智慧技術應用與規劃", "技術應用與規劃"] },
                { id: "s2", name: "科目二：大數據處理分析與應用", matchKeywords: ["科目二", "大數據處理分析與應用", "大數據處理分析"] },
                { id: "s3", name: "科目三：機器學習技術與應用", matchKeywords: ["科目三", "機器學習技術與應用"] }
            ],
            studyNotes: [
                { subjectGroup: "中級 AI 應用規劃師" },
                { title: "中級：計算與程式解析", file: "notes/ai_mid/s1_人工智慧技術應用與規劃/114年第二梯次中級AI應用規劃師第二科計算與程式解析.md" }
            ]
        },
        {
            id: "security",
            name: "資安工程師",
            icon: "🛡️",
            description: "資訊安全管理概論、資訊安全技術概論、規劃與防護實務",
            enabled: false, // Turned off by default (backend toggle demonstration)
            questionsFile: "security_questions.js",
            questionsJson: "security_questions.json",
            questionsVar: "ipasSecurityQuestions",
            subjects: [
                { id: "s1", name: "科目一：資訊安全管理概論", matchKeywords: ["資訊安全管理概論"] },
                { id: "s2", name: "科目二：資訊安全技術概論", matchKeywords: ["資訊安全技術概論"] }
            ]
        }
    ]
};
