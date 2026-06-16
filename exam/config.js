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
                { id: "s1", name: "L11 人工智慧基礎概論", matchKeywords: ["L11", "科目一", "人工智慧基礎概論"] },
                { id: "s2", name: "L12 生成式AI應用與規劃", matchKeywords: ["L12", "科目二", "生成式AI應用與規劃"] }
            ],
            studyNotes: [
                { subjectGroup: "L11 人工智慧基礎概論" },
                { topicGroup: "L111 AI 定義、分類與治理" },
                { title: "L11101 AI 的定義與分類", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { title: "L11102 AI 治理概念", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { topicGroup: "L112 資料基本概念與處理" },
                { title: "L11201 資料基本概念與來源", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { title: "L11202 資料整理與分析流程", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { title: "L11203 資料隱私與安全", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { topicGroup: "L113 機器學習基本原理與模型" },
                { title: "L11301 機器學習基本原理", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { title: "L11302 常見的機器學習模型", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { topicGroup: "L114 鑑別式 AI 與生成式 AI" },
                { title: "L11401 鑑別式 AI 與生成式 AI 的基本原理", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { title: "L11402 鑑別式 AI 與生成式 AI 的整合應用", file: "notes/ai/s1_人工智慧基礎概論/初級單元一_AI基礎理論與機器學習.md" },
                { subjectGroup: "L12 生成式AI應用與規劃" },
                { topicGroup: "L121 No Code / Low Code" },
                { title: "L12101 No Code / Low Code 的基本概念", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" },
                { title: "L12102 No Code / Low Code 的優勢與限制", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" },
                { topicGroup: "L122 生成式 AI 工具與應用" },
                { title: "L12201 生成式 AI 應用領域與常見工具", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" },
                { title: "L12202 如何善用生成式 AI 工具", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" },
                { topicGroup: "L123 生成式 AI 導入與風險管理" },
                { title: "L12301 生成式 AI 導入評估", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" },
                { title: "L12302 生成式 AI 導入規劃", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" },
                { title: "L12303 生成式 AI 風險管理", file: "notes/ai/s2_生成式AI應用與規劃/初級單元二_生成式AI與無程式碼應用.md" }
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
                { id: "s1", name: "L21 人工智慧技術應用與規劃", matchKeywords: ["L21", "科目一", "人工智慧技術應用與規劃"] },
                { id: "s2", name: "L22 大數據處理分析與應用", matchKeywords: ["L22", "科目二", "大數據處理分析與應用"] },
                { id: "s3", name: "L23 機器學習技術與應用", matchKeywords: ["L23", "科目三", "機器學習技術與應用"] }
            ],
            studyNotes: [
                { subjectGroup: "L21 人工智慧技術應用與規劃" },
                { topicGroup: "L211 AI 相關技術應用" },
                { topicGroup: "L212 AI 導入評估規劃" },
                { topicGroup: "L213 AI 技術應用與系統部署" },
                { subjectGroup: "L22 大數據處理分析與應用" },
                { topicGroup: "L221 機率統計基礎" },
                { topicGroup: "L222 大數據處理技術" },
                { topicGroup: "L223 大數據分析方法與工具" },
                { topicGroup: "L224 大數據在人工智慧之應用" },
                { title: "L224 計算與程式解析", file: "notes/ai_mid/s1_人工智慧技術應用與規劃/114年第二梯次中級AI應用規劃師第二科計算與程式解析.md" },
                { subjectGroup: "L23 機器學習技術與應用" },
                { topicGroup: "L231 機器學習基礎數學" },
                { topicGroup: "L232 機器學習與深度學習" },
                { topicGroup: "L233 機器學習建模與參數調校" },
                { topicGroup: "L234 機器學習治理" }
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
