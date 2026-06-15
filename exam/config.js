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
