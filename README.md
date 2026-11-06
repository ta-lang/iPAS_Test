# 📚 iPAS 證照學習與全真模擬考系統工作區

本工作區整合了經濟部產業人才能力鑑定（iPAS）**六大熱門證照**的官方教材、依 SOP 規範編撰的模組化考前衝刺講義（支援 Mermaid 流程圖、深色自適應向量 SVG 圖卡、KaTeX 公式與 Python/PySpark 實戰代碼專區）、自動化題庫解析管線、口語講稿與離線 MP3、背景雲端硬碟同步機制，以及現代化的純前端 PWA 模擬考試系統。

---

## 🏆 已支援證照與題庫規模（共 6 張證照 / 1,841 題）

| 證照名稱 | 等級 | 題庫總數 | 考科組成與特色 | 重點講義模組 (`notes/` & `exam/notes/`) |
|---|---|---:|---|---|
| **營運智慧分析師** (`oi`) | 初級 | **163 題** | 營運智慧概論、經營管理數位化概論（100% 詳解） | 4 份 SOP 講義（13 個 `#L1xxxx` 錨點） |
| **AI 應用規劃師** (`ai`) | 初級 | **630 題** | 人工智慧基礎概論、生成式 AI 應用與規劃（含 115-1~115-3 歷屆） | 7 份 SOP 講義 + 6 份語音講稿/MP3 |
| **AI 應用規劃師** (`ai_mid`) | 中級 | **566 題** | AI 技術應用與規劃、大數據處理分析、機器學習技術與應用（含 Python/PySpark 實戰與補充題） | 11 份 SOP 講義（34 個 `#L2xxxx` 錨點 + 歷屆計算解析） |
| **3D 列印積層製造工程師** (`3d`) | 初級 | **207 題** | 3D 列印概論（84題）、3D 製程與材料概論（123題），內嵌 59 張工程示意圖 | 5 份 SOP 講義（14 個 `#L1xxxx` 錨點） |
| **電路板製程工程師** (`pcb`) | 中級 | **135 題** | 品管概論（45題）、軟板製程（45題）、硬板製程（45題），支援單選 105 題 + 複選 30 題 | 5 份 SOP 講義（14 個 `#L1xxxx`/`#L2xxxx` 錨點） |
| **AIoT 應用工程師** (`aiot`) | 初級 | **140 題** | AIoT 基礎概論（80題）、物聯網系統與應用（60題），100% 三段式深度解析 | 5 份 SOP 講義（含惠斯登電橋/ADC 向量 SVG 與 Python 實戰代碼） |

---

## 📂 目錄結構與檔案說明

```text
c:\Drive224\Projects\iPAS 證照
├── AGENTS.md                        # Agent 工作規範與目前專案基線
├── README.md                        # 專案總覽與操作手冊
├── work_log.md                      # 專案工作日誌 (記錄開發歷程與里程碑)
├── project-id.json                  # 跨 Agent 專案識別檔
├── question_identity.py             # 題庫永久識別碼 (question_uid)、來源代碼與內容雜湊共用模組
├── parse_questions.py               # 營運智慧分析師 (初級) 題庫解析器 -> 163 題
├── parse_ai_questions.py            # AI 應用規劃師 (初級) 題庫解析器 -> 630 題
├── parse_ai_mid_questions.py        # AI 應用規劃師 (中級) 題庫解析器 -> 566 題
├── parse_3d_questions.py            # 3D 列印積層製造工程師 (初級) 題庫解析器 -> 207 題
├── parse_pcb_questions.py           # 電路板製程工程師 (中級) 題庫解析器 -> 135 題
├── parse_aiot_questions.py          # AIoT 應用工程師 (初級) 題庫解析器 -> 140 題
├── questions_aiot.py                # AIoT 試題資料與三段式結構化解析定義
├── convert_pdf.py                   # Markdown 轉 A4 PDF 精美渲染轉檔工具
├── generate_lecture.py              # Markdown → 口語講稿 TXT / 離線 MP3 生成工具
├── sync.py / create_task.ps1        # 雲端硬碟同步指令碼與 Windows 排程設定
├── docs/                            # 系統規範與架構設計文件
│   ├── ipas_exam_preparation_sop.md # 證照備考與題庫／講義建置標準作業程序 (SOP)
│   ├── account_sync_api_contract.md # 帳戶與跨裝置同步 API 契約
│   └── ipas_exam_modernization_plan.md # 模擬考系統分階段改造工作計畫
├── notes/                           # 根目錄講義鏡像（供 GitHub Pages 根路徑存取，與 exam/notes/ 100% 同步）
├── tests/                           # Node 內建測試 (46 項) 與 Python 題庫識別測試 (4 項)
├── Source/                          # 6 份初級 AI 講稿來源 Markdown（唯讀輸入）
├── out/                             # 6 份 TXT 講稿與 6 份離線 MP3 輸出
├── 營運智慧分析師/                  # 官方教材、簡章與單元講義
├── AI應用規劃師/                    # 初級與中級官方學習指引、歷屆試題與補充題庫
├── 3D 列印積層製造工程師/           # 官方學習指引與歷屆試題 PDF
├── 電路板製程工程師/                # 初級與中級學習指引與公告試題 PDF
├── AIoT應用工程師/                  # 學習指引與能力鑑定簡章 PDF
└── exam/                            # 模擬考與自主學習網頁系統 (純前端 SPA / PWA)
    ├── index.html                   # 系統首頁 (含身分證驗證登入、證照切換、審題儀表板與課程學習)
    ├── config.js                    # 六大證照模組註冊、配題規則與講義錨點導覽設定
    ├── core.js                      # 可獨立測試的評分、事件去重、Markdown 保護與計時核心
    ├── account-core.js              # 不透明帳戶、分區鍵值、題目事件與同步操作核心
    ├── account-api.js               # 登入與同步網路邊界、逾時及逐筆確認檢查
    ├── script.js                    # 模擬考系統主控邏輯、IRT 審題儀表板與 UI 控制器
    ├── style.css                    # 現代毛玻璃質感 (Glassmorphism)、深淺色主題與高對比 Mermaid 樣式
    ├── sw.js                        # Service Worker 離線快取支援
    ├── notes/                       # 六大證照 SOP 模組化 Markdown 講義
    ├── images/3d/                   # 3D 列印題庫專屬裁切工程示意圖 (59 張)
    ├── questions.js/json            # 營運智慧分析師題庫 (163 題)
    ├── ai_questions.js/json         # AI 應用規劃師 (初級) 題庫 (630 題)
    ├── ai_mid_questions.js/json     # AI 應用規劃師 (中級) 題庫 (566 題)
    ├── 3d_questions.js/json         # 3D 列印積層製造工程師 (初級) 題庫 (207 題)
    ├── pcb_questions.js/json        # 電路板製程工程師 (中級) 題庫 (135 題)
    └── aiot_questions.js/json       # AIoT 應用工程師 (初級) 題庫 (140 題)
```

> **重要規範**：
> 1. 題庫數量以 `exam/*questions.json` 的實際內容為準；重新執行解析器後，應核對 JSON 題目數與前端顯示。
> 2. 編修任何課程講義時，必須確保 `notes/` 與 `exam/notes/` 雙目錄 100% 同步一致（詳見 [`docs/ipas_exam_preparation_sop.md`](docs/ipas_exam_preparation_sop.md)）。

---

## 🎧 口語講稿與離線 MP3 (`Source/`、`out/`)

`Source/` 保存 6 份 iPAS 初級 AI 應用規劃師 Markdown 筆記，`generate_lecture.py` 將其轉換成老師講課風格的 TXT 講稿，並使用本機 Windows SAPI 產生 MP3 到 `out/`。目前輸出為 6 份 TXT 與 6 份 MP3。

```powershell
# 產生全部講稿與 MP3
.venv\Scripts\python generate_lecture.py --llm-engine codex --tts-engine sapi

# 只處理檔名含 Week1 的來源
.venv\Scripts\python generate_lecture.py --only Week1 --llm-engine codex --tts-engine sapi

# 只產生 TXT，不產生 MP3
.venv\Scripts\python generate_lecture.py --no-tts --llm-engine codex
```

`Source/*.md` 是唯一來源，`out/*.txt` 與 `out/*.mp3` 都是產物，不應手動修改。預設使用 Windows SAPI，不會將講稿送往外部語音服務；若改用 Edge TTS，必須先取得外部資料傳輸授權。

---

## 🛡️ 安全驗證登入機制

為了模擬真實 iPAS 線上鑑定考試的考場登入體驗，系統在首頁整合了**身分證字號驗證登入機制**：
1. **安全輸入遮罩**：使用 `<input type="password">` 隱藏輸入的身分證號碼，達到輸入時只顯示遮罩（`******`）的效果。
2. **台灣身分證驗證演算法**：系統內建身分證加權模數（Modulo 10）演算法，首碼英文會自動轉換為相應的地區數值，並對所有位數進行加權乘積相加，餘數必須符合國家身分證檢核碼標準方可登入。
3. **不透明帳戶儲存**：IndexedDB v5 帳戶儲存區以不透明 `user_id` 作為分區鍵值，絕不直接將身分證號作為資料庫主鍵。

---

## 🚀 啟用與使用考試系統

1. **生成或更新題庫數據**（如教材或解析器有更新時）：
   ```powershell
   python parse_questions.py
   python parse_ai_questions.py
   python parse_ai_mid_questions.py
   python parse_3d_questions.py
   python parse_pcb_questions.py
   python parse_aiot_questions.py
   ```

2. **本地開啟網頁考試**：
   由於課程學習與題庫載入使用 `fetch()`，建議從工作區根目錄啟動本機靜態伺服器：
   ```powershell
   python -m http.server 8000 --directory .
   ```
   然後開啟 [http://localhost:8000/exam/](http://localhost:8000/exam/)（或根目錄 [http://localhost:8000/](http://localhost:8000/)）。

3. **線上瀏覽網頁考試 (GitHub Pages)**：
   👉 **[iPAS 線上模擬考與自主學習系統](https://ta-lang.github.io/iPAS_Test/)**

---

## ✅ 自動化基線驗證

本專案使用 Node.js 與 Python 內建測試工具，不需要安裝額外測試套件：

```powershell
node --test tests/*.test.js
python -m unittest tests.test_question_identity
node --check exam/core.js
node --check exam/script.js
node --check exam/config.js
node --check exam/sw.js
```

測試涵蓋評分結果（含單選與複選題）、重複事件防護、牆鐘計時、永久 `question_uid`、舊資料消歧義、按證照載入、不透明帳戶、帳戶 A/B 分區、短效 session、同步逐筆確認，以及六大證照題庫契約與 JSON/JS wrapper 一致性。

---

## 📐 系統設計與標準作業程序 (SOP)

* **[iPAS 證照備考與題庫／講義建置 SOP](docs/ipas_exam_preparation_sop.md)**：規範講義雙目錄同步、Mermaid 禁用自訂色彩渲染、向量 `<svg>` 幾何繪圖、Python/SQL/PySpark 實戰代碼專區與三段式題庫詳解標準。
* **[帳戶與同步 API 契約](docs/account_sync_api_contract.md)**：定義後端同步契約與本機模式退避邊界。
* **[模擬考系統分階段改造工作計畫](docs/ipas_exam_modernization_plan.md)**：涵蓋帳戶資料、題庫、Note/Voice、離線同步、安全與測試。
* **[專案工作日誌 (work_log.md)](work_log.md)**：完整記錄各階段開發歷程與里程碑。
