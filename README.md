# 📚 IPAS 證照學習與模擬考系統工作區

本工作區整合了 **IPAS 營運智慧分析師**、**AI 應用規劃師 (初級)** 與 **AI 應用規劃師 (中級)** 證照考試的官方教材、自製精美考前衝刺學習筆記、自動化 PDF 題庫解析器、背景雲端硬碟同步機制，以及一個現代化的模擬考試網頁系統。

---

## 📂 目錄結構與檔案說明

```text
c:\Drive224\Projects\iPAS 證照
├── .venv/                         # Python 本地虛擬環境
├── .temp/                         # 轉檔時使用的暫存資料夾
├── sync.py                        # 雲端硬碟同步指令碼 (偵測新增/修改/刪除)
├── sync.log                       # 同步日誌檔 (記錄每次執行結果與異動)
├── create_task.ps1                # Windows 排程工作註冊指令碼 (每 30 分鐘背景執行)
├── convert_pdf.py                 # Markdown 轉 PDF 精美渲染轉檔工具
├── parse_questions.py             # 營運智慧分析師題庫解析器
├── parse_ai_questions.py          # AI 應用規劃師 (初級) 題庫解析器
├── parse_ai_mid_questions.py      # AI 應用規劃師 (中級) 題庫解析器
├── work_log.md                    # 專案工作日誌 (記錄開發歷程與里程碑)
├── 提示詞.txt                      # 題庫生成與 AI 改寫提示詞紀錄
├── 營運智慧分析師/                 # 營運智慧分析師教材與衝刺講義 (單元A/B/C)
├── AI應用規劃師/                   # AI應用規劃師 (包含初級、中級) 官方教材與講義
└── exam/                          # 模擬考與自主學習網頁系統 (純前端 SPA)
    ├── index.html                 # 系統首頁 (含身分驗證登入與科目選擇)
    ├── script.js                  # 模擬考系統主控邏輯與加權驗證演算法
    ├── style.css                  # 現代毛玻璃質感 (Glassmorphism) 與響應式樣式
    ├── questions.js/json          # 營運智慧分析師題庫 (313 題)
    ├── ai_questions.js/json       # AI應用規劃師 (初級) 題庫 (530 題)
    └── ai_mid_questions.js/json   # AI應用規劃師 (中級) 題庫 (300 題)
```

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
1. **營運智慧分析師 (313 題)**：包含原官方 163 題與 150 題情境模擬題（涵蓋 ECCD 流程、PERT/CPM、ERP/CRM/SCM 等）。
2. **AI 應用規劃師 - 初級 (530 題)**：涵蓋 AI 基礎理論、生成式 AI、機器學習與無程式碼應用。
3. **AI 應用規劃師 - 中級 (300 題)**：涵蓋技術應用與規劃、大數據分析與機器學習三大專業學科。

### 🚀 啟用與使用考試系統

1. **生成或更新題庫數據**（如教材有更新時）：
   在工作區目錄下執行對應的解析指令碼：
   ```powershell
   .venv\Scripts\python parse_questions.py
   .venv\Scripts\python parse_ai_questions.py
   .venv\Scripts\python parse_ai_mid_questions.py
   ```

2. **本地開啟網頁考試**：
   雙擊開啟 [index.html](file:///c:/Drive224/Projects/iPAS%20證照/exam/index.html) 即可在瀏覽器中進行身分證驗證登入並開始作答。
   *(本系統為純前端靜態 SPA，不需要網際網路或任何伺服器後台即可完美運作)*

3. **線上瀏覽網頁考試 (GitHub Pages)**：
   本系統已部署至 GitHub Pages，您可直接點擊以下連結線上作答：
   👉 **[線上模擬考與自主學習系統](https://ta-lang.github.io/iPAS_Test/)**

4. **推播題庫或網頁更新**：
   若後續有更新題庫（執行完 `parse_*.py`）或修改網頁介面，請執行以下命令將更新同步至線上版本：
   ```powershell
   cd exam
   git add .
   git commit -m "更新題庫與介面優化"
   git push origin main
   ```

---

## 📐 系統設計與軟體規格書

有關本系統的詳細架構、系統方塊圖、資料流向、各畫面流程圖、檔案關聯圖以及 AI 提示詞的規劃與定義，請參閱：
* **[系統軟體規格書 (system_software_specification.md)](file:///C:/Users/talan/.gemini/antigravity-ide/brain/2c5b7cd6-e6ce-4ddf-b77d-04b1e4b997ad/system_software_specification.md)**
* **[專案工作日誌 (work_log.md)](file:///c:/Drive224/Projects/iPAS%20證照/work_log.md)**
