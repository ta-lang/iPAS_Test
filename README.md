# 📚 IPAS 證照學習與模擬考系統工作區

本工作區整合了 **iPAS 營運智慧分析師**、**AI 應用規劃師 (初級)** 與 **AI 應用規劃師 (中級)** 證照考試的官方教材、自製精美考前衝刺學習筆記、自動化 PDF 題庫解析器、口語講稿與離線 MP3、背景雲端硬碟同步機制，以及一個現代化的模擬考試網頁系統。

---

## 📂 目錄結構與檔案說明

```text
c:\Drive224\Projects\iPAS 證照
├── AGENTS.md                       # Agent 工作規範與目前專案基線
├── .venv/                         # Python 本地虛擬環境
├── .temp/                         # 轉檔時使用的暫存資料夾
├── project-id.json                 # 跨 Agent 專案識別檔
├── sync.py                        # 雲端硬碟同步指令碼 (偵測新增/修改/刪除)
├── sync.log                       # 同步日誌檔 (記錄每次執行結果與異動)
├── create_task.ps1                # Windows 排程工作註冊指令碼 (每 30 分鐘背景執行)
├── convert_pdf.py                 # Markdown 轉 PDF 精美渲染轉檔工具
├── parse_questions.py             # 營運智慧分析師題庫解析器
├── parse_ai_questions.py          # AI 應用規劃師 (初級) 題庫解析器
├── parse_ai_mid_questions.py      # AI 應用規劃師 (中級) 題庫解析器
├── generate_lecture.py             # Markdown → 口語講稿 TXT / MP3
├── docs/                            # 系統改造、資料模型與階段計畫
├── tests/                           # Node 內建測試與三題庫 smoke test
├── Source/                         # 6 份講稿來源 Markdown（唯讀輸入）
├── out/                            # 6 份 TXT 與 6 份離線 MP3 輸出
├── work_log.md                    # 專案工作日誌 (記錄開發歷程與里程碑)
├── 提示詞.txt                      # 題庫生成與 AI 改寫提示詞紀錄
├── 營運智慧分析師/                 # 營運智慧分析師教材與衝刺講義 (單元A/B/C)
├── AI應用規劃師/                   # AI應用規劃師 (包含初級、中級) 官方教材與講義
└── exam/                          # 模擬考與自主學習網頁系統 (純前端 SPA)
    ├── index.html                 # 系統首頁 (含身分驗證登入與科目選擇)
    ├── core.js                    # 可獨立測試的評分、事件去重與計時核心
    ├── script.js                  # 模擬考系統主控邏輯與加權驗證演算法
    ├── style.css                  # 現代毛玻璃質感 (Glassmorphism) 與響應式樣式
    ├── questions.js/json          # 營運智慧分析師題庫 (163 題)
    ├── ai_questions.js/json       # AI應用規劃師 (初級) 題庫 (530 題)
    └── ai_mid_questions.js/json   # AI應用規劃師 (中級) 題庫 (298 題)
```

題庫數量以 `exam/*.json` 的實際內容為準；重新執行解析器後，應再次核對 JSON 題目數與前端顯示。

---

## 🎧 口語講稿與離線 MP3 (`Source/`、`out/`)

`Source/` 保存 6 份 iPAS 初級 AI 應用規劃師 Markdown 筆記，`generate_lecture.py` 將其轉換成老師講課風格的 TXT 講稿，並使用本機 Windows SAPI 產生 MP3 到 `out/`。目前輸出為 6 份 TXT 與 6 份 MP3。

### 產生全部講稿與 MP3

```powershell
.venv\Scripts\python generate_lecture.py --llm-engine codex --tts-engine sapi
```

### 常用選項

```powershell
# 只處理檔名含 Week1 的來源
.venv\Scripts\python generate_lecture.py --only Week1 --llm-engine codex --tts-engine sapi

# 只產生 TXT，不產生 MP3
.venv\Scripts\python generate_lecture.py --no-tts --llm-engine codex
```

`Source/*.md` 是唯一來源，`out/*.txt` 與 `out/*.mp3` 都是產物，不應手動修改。預設使用 Windows SAPI，不會將講稿送往外部語音服務；若改用 Edge TTS，必須先取得外部資料傳輸授權。

---

## 🛡️ 安全驗證登入機制

為了完美模擬真實 iPAS 線上鑑定考試的考場登入體驗，系統在首頁整合了**身分證字號驗證登入機制**：
1. **安全輸入遮罩**：使用 `<input type="password">` 隱藏輸入的身分證號碼，達到輸入時只顯示遮罩（`******`）的安全效果。
2. **台灣身分證驗證演算法**：系統內建身分證加權模數（Modulo 10）演算法，首碼英文會自動轉換為相應的地區數值，並對所有位數進行加權乘積相加，餘數必須符合國家身分證檢核碼標準方可登入。

---

## 🔄 雲端硬碟自動同步系統 (`sync.py`)

為了確保您的學習資料與雲端硬碟保持即時同步，我們設計了一套高效率的同步機制：
1. **精準更新**：透過 HTTP `HEAD` 請求快速取得雲端檔案的 `Content-Length` 與 `Last-Modified`，只下載有異動或新加入的檔案，並保留原始修改時間。
2. **真實鏡像**：當雲端檔案被刪除或移位時，同步系統會自動清除本地對應的舊檔案，以確保資料夾的乾淨整潔。

### ⚙️ 背景排程設定 (`create_task.ps1`)

工作區包含一個 PowerShell 註冊指令碼，可在 Windows 中註冊一個名為 `IPAS_GDrive_Sync` 的背景排程工作：
* **排程頻率**：預設每 30 分鐘自動執行一次同步。
* **背景靜態執行**：使用虛擬環境的 `.venv\Scripts\pythonw.exe` 執行，**完全不會彈出任何命令提示字元視窗**，在背景安靜且無感地守護您的資料。

---

## 📄 精美學習筆記轉檔系統 (`convert_pdf.py`)

本工作區提供了將 Markdown 筆記直接轉為 A4 規格 PDF 的渲染工具。轉檔系統具備以下特點：
1. **精美排版 CSS**：使用微軟正黑體、Inter 英文無襯線字型，搭配精心設計的斑馬紋表格與頁面邊距。
2. **考點 Alert Callouts 轉譯**：自動將 Markdown 原生的 `> [!IMPORTANT]` 等標籤，解析為符合現代網頁設計的精美提示框（包含主題代表色與小圖標）。
3. **架構圖實體化**：自動將 Markdown 中的 Mermaid 語法轉換為高質感的 CSS 流程圖，無需連接外部網路。
4. **轉譯工具執行**：
   ```powershell
   # 使用本地虛擬環境 Python 執行轉檔
   .venv\Scripts\python convert_pdf.py
   ```

---

## 📝 多科證照模擬考試系統 (`exam/`)

全真網頁模擬考試與自主練習系統已全面支援三種證照模式：
1. **營運智慧分析師 (163 題)**：依官方教材解析，涵蓋營運智慧概論與經營管理數位化概論。
2. **AI 應用規劃師 - 初級 (530 題)**：涵蓋 AI 基礎理論、生成式 AI、機器學習與無程式碼應用。
3. **AI 應用規劃師 - 中級 (298 題)**：涵蓋技術應用與規劃、大數據分析與機器學習三大專業學科。

### 🚀 啟用與使用考試系統

1. **生成或更新題庫數據**（如教材有更新時）：
   在工作區目錄下執行對應的解析指令碼：
   ```powershell
   .venv\Scripts\python parse_questions.py
   .venv\Scripts\python parse_ai_questions.py
   .venv\Scripts\python parse_ai_mid_questions.py
   ```

2. **本地開啟網頁考試**：
   由於課程學習與題庫載入使用 `fetch()`，建議從工作區根目錄啟動本機靜態伺服器：
   ```powershell
   .venv\Scripts\python -m http.server 8000 --directory .
   ```
   然後開啟 [http://localhost:8000/exam/](http://localhost:8000/exam/)。系統不需要後端 API；本機伺服器只用來提供靜態檔案與 Markdown 講義。

3. **線上瀏覽網頁考試 (GitHub Pages)**：
   本系統已部署至 GitHub Pages，您可直接點擊以下連結線上作答：
   👉 **[線上模擬考與自主學習系統](https://ta-lang.github.io/iPAS_Test/)**

4. **提交題庫或網頁更新**：
   根目錄是目前的 Git 儲存庫，`exam/` 不是獨立 Git repository。請在根目錄檢查並提交實際變更：
   ```powershell
   git status --short
   git add AGENTS.md README.md work_log.md exam/
   git commit -m "更新題庫與介面優化"
   ```
   推送前請確認目標遠端與分支；GitHub Pages 的部署分支／遠端依目前 repository 設定處理，不要在 `exam/` 目錄執行 `git push`。

### ✅ 自動化基線驗證

本專案使用 Node.js 內建測試執行器，不需要安裝 npm 套件：

```powershell
node --test tests/*.test.js
node --check exam/core.js
node --check exam/script.js
node --check exam/config.js
node --check exam/sw.js
```

測試涵蓋評分結果、重複事件防護、牆鐘計時、核心載入順序，以及三份題庫的題數、唯一 ID、四個非空選項與答案格式。

---

## 📐 系統設計與軟體規格書

有關本系統的詳細架構、系統方塊圖、資料流向、各畫面流程圖、檔案關聯圖以及 AI 提示詞的規劃與定義，請參閱：
* **[模擬考系統分階段改造工作計畫](docs/ipas_exam_modernization_plan.md)**：涵蓋帳戶資料、題庫、Note.Voice、NotebookLM MCP、離線同步、安全與測試。
* **[系統軟體規格書 (system_software_specification.md)](file:///C:/Users/talan/.gemini/antigravity-ide/brain/2c5b7cd6-e6ce-4ddf-b77d-04b1e4b997ad/system_software_specification.md)**
* **[專案工作日誌 (work_log.md)](file:///c:/Drive224/Projects/iPAS%20證照/work_log.md)**
