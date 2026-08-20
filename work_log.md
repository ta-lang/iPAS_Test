# 📝 IPAS 證照考試準備專案——工作日誌 (Work Log)

本工作日誌記錄了 **IPAS 營運智慧分析師**、**AI應用規劃師** 及其他證照專案的學習講義製作、題庫自動化解析、雲端同步排程設定與雙證照模擬考試系統的開發歷程與里程碑。

### 📌 2026-08-20 —— 專案文件基線更新

* **【文件同步】**：更新 `AGENTS.md` 與 `README.md`，補齊 `Source/`、`out/`、`generate_lecture.py`、`project-id.json` 的用途與目前工作流程。
* **【題庫數量校正】**：依目前 JSON 實際內容修正文件數量：營運智慧分析師 163 題、AI 應用規劃師初級 530 題、AI 應用規劃師中級 298 題。
* **【Git 邊界校正】**：明確記錄根目錄為目前 Git 儲存庫，`exam/` 為靜態應用目錄而非獨立 Git repository；Git 提交與部署說明改為從根目錄執行。
* **【本機使用流程】**：補充以本機 HTTP server 開啟 `exam/` 的方式，避免課程 Markdown 與題庫的 `fetch()` 在 `file://` 下失敗。
* **【講稿流程文件化】**：記錄 6 份 `Source/*.md` 產生 6 份 TXT 與 6 份 Windows SAPI 離線 MP3 的指令與資料邊界。
* **【驗證】**：確認 `Source/` 有 6 份 Markdown，`out/` 有 6 份 TXT 與 6 份 MP3；逐一核對三份題庫 JSON 題數。
* **【管理中樞狀態】**：本次只更新來源專案文件；管理中樞同步另行處理，先前因 Gitea SSH 權限不足而未寫入管理中樞。
* **【系統問題盤點】**：確認評分流程宣告順序、練習模式重複持久化、重複題號作為資料鍵、帳戶資料未分區、Note 對應不完整及 Voice 尚未進入內容模型等問題。
* **【分階段改造計畫】**：新增 `docs/ipas_exam_modernization_plan.md`，將工作拆分為基線、核心穩定、題庫識別、帳戶同步、Note、Note.Voice、NotebookLM MCP、安全/PWA 與移轉上線九個階段（Phase 0–8）。
* **【帳戶資料方向】**：確立帳戶後端為標記、錯題、測驗歷史、SM-2、閱讀及播放進度的權威來源；IndexedDB 改為依帳戶分區的離線快取與同步佇列。
* **【NotebookLM 邊界】**：NotebookLM MCP 列為可替換的內容建置工具，正式網站不得依賴其在線可用性；實際登入、測試 notebook 與能力驗證留待取得授權後執行。

### 📌 2026-08-20 —— Phase 0–1 核心穩定化實作

* **【TDD 基線】**：新增 `exam/core.js` 與 `tests/`，使用 Node.js 內建 `node:test`，涵蓋評分、空題組、事件去重、牆鐘計時、app shell 載入順序及題庫資料契約。
* **【評分中斷修正】**：評分先由 `buildQuizResult()` 完整產生 `score`、正確數、答題率與科目統計，再進入單一持久化流程，排除先使用後宣告 `score` 的 TDZ 例外。
* **【重複流程清理】**：移除 `_origGradeQuiz`、`_origStartPractice`、`_origShowFeedback` 三組 wrapper，評分、練習啟動與回饋各保留一個正式入口。
* **【練習資料去重】**：畫面回饋改為純顯示；錯題、SM-2 與題目統計只由首次作答事件寫入，並以 `claimOnce()` 防止同一題重複提交。
* **【練習完成摘要】**：最後一題顯示「完成練習」，可進入共用結果頁查看分數、答題率、科目分析與完整覆盤。
* **【計時校正】**：考試計時改以開始時間與實際目前時間計算，瀏覽器背景分頁被節流後仍可校正剩餘時間。
* **【離線更新】**：Service Worker cache 升至 `ipas-exam-v2` 並納入 `core.js`，避免舊 app shell 漏載新核心。
* **【跨頁題庫修正】**：題庫 smoke test 發現 AI 初級官方樣題跨頁遺失選項；修改 `parse_ai_questions.py`，先依考科合併頁面再解析，重新產生 530 題並補回兩題的缺失選項。
* **【驗證結果】**：`node --test tests/*.test.js` 共 14/14 通過；`core.js`、`script.js`、`config.js`、`sw.js` 語法檢查通過；首頁、核心程式與三份題庫本機 HTTP 回應皆為 200。
* **【負面邊界補強】**：程式審查後新增異常作答索引與無效計時輸入測試，答題率不會超過 100%，計時輸入異常時不會產生 `NaN`。
* **【待人工驗收】**：瀏覽器控制技能因 Windows 沙箱無法存取使用者 AppData 而未能啟動，尚待在一般瀏覽器實際點擊完成三證照的考試與練習流程。

---

## 📅 專案時程與工作里程碑

### 📌 2026-07-20 —— 開工、Source/ 講稿 MP3 生成腳本建立、管理中樞初始化

#### 🕐 開工與 Source/ 盤點
* **【開工】**：首次開工，無可恢復的換手資訊。工作樹乾淨（main, e9e889d），僅未追蹤 `.agents/`、`Source/`。
* **【Source/ 盤點】**：Source/ 內含 6 份 iPAS 初級 AI 應用規劃師繁體中文 MD 筆記（衝刺學習計劃、總複習、Week1~4），各 100-200 行。

#### 🕑 講稿 MP3 生成腳本開發
* **【edge-tts 安裝】**：安裝 `edge-tts` 套件（v7.2.8），確認 zh-TW-HsiaoChenNeural（女聲）為可用語音。
* **【generate_lecture.py 建立】**：撰寫批次轉換腳本，流程為：讀取 Source/*.md → 呼叫 Ollama qwen2.5:3b 轉口語講稿 → edge-tts 產 MP3 至 out/。
* **【Ollama 整合測試】**：小量內容測試成功（564 字元正常產出），但完整檔案因 Ollama 回應時間過長，首次執行 30 分鐘逾時未產出任何檔案。
* **【換機環境補強】**：因更換電腦，重新建立專案 `.venv`，並安裝 `edge-tts` v7.2.8 至新環境；同時確認目前新電腦尚未啟用 Ollama CLI 與 `127.0.0.1:11434` 本機服務。
* **【分段續跑優化】**：重構 `generate_lecture.py`，新增 `--only`、`--no-tts`、`--force-llm`、`--max-chars`、`--max-chunks`、`--timeout` 等參數，將 Markdown 依章節與段落切分後逐段送入 Ollama，並將分段結果快取至 `out/.parts/`，避免長檔案逾時後整份重跑。
* **【測試輸出保護】**：修正 `--max-chunks` 測試模式，改以 `.sample-Nchunks` 檔名輸出，避免小段測試覆蓋正式完整講稿。
* **【離線 TTS 備援】**：因 Edge TTS 需將講稿送往 Microsoft 雲端語音服務，外部資料傳輸未取得明確授權前改用本機 Windows SAPI 離線語音 `Microsoft Hanhan Desktop`，並透過本機 `ffmpeg` 將 WAV 轉為 MP3。
* **【首份 MP3 產出】**：使用既有 `out/01-衝刺學習計劃.txt` 講稿，成功產出本機離線語音 MP3：`out/01-衝刺學習計劃.mp3`。
* **【Codex 批次轉換完成】**：依使用者指示改由 Codex 本機規則完成轉換，不再等待 Ollama；將 6 份 `Source/*.md` 依課程順序轉為講稿文字與本機離線語音 MP3，輸出至 `out/01-衝刺學習計劃.*`、`out/02-Week1.*`、`out/03-Week2.*`、`out/04-Week3.*`、`out/05-Week4.*`、`out/06-總複習.*`。

#### 🕒 管理中樞初始化
* **【~/.project-continuity 建立】**：初始化本機專案連續性管理中樞，寫入 state.json、STATUS.md 及 handoff。

---

### 📌 2026-06-15 —— pwa_QuizQuiz 移植（IndexedDB + SM-2）、Git 整合與 Gitea 推送

#### 🕐 階段一：pwa_QuizQuiz 功能分析與移植計畫
* **【功能分析】**：完成 `pwa_QuizQuiz_analysis.md`，比較 pwa_QuizQuiz 與 exam/ 的架構差異，列出可移植功能與優先級。
* **【移植決策】**：確定以 IndexedDB 練習紀錄 + SM-2 間隔複習為第一優先，逐步移植。

#### 🕑 階段二：根專案 Git 初始化與遠端設定
* **【Git 初始化】**：在 `C:\Drive224\Projects\iPAS 證照` 根目錄初始化 git repo，新增 `.gitignore`（排除 `__pycache__/`、`.venv/`、`.temp/`、`sync.log`、`*.mp4`、`*.pptx`、`*.xlsx`、`*.docx`）。
* **【exam/ 歷史整合】**：將 `exam/` 原本獨立的 Git 儲存庫歷史整合進根 repo（保留 GitHub 遠端為 `github` secondary remote）。
* **【Gitea 推送】**：建立 Gitea remote `origin`（`ssh://git@www.talang.org:2222/Talang/ipas_exam.git`），完成 initial commit 並推送至 `main` 分支。
* **【GitHub 保留】**：`exam/` 保留 GitHub 為 `github` remote，可手動同步。

#### 🕒 階段三：IndexedDB + SM-2 間隔複習模組實作
* **【IndexedDB 封裝】**：在 `exam/script.js` 實作 `openDB()`、`getWrongPool()`、`addWrongQuestion()`、`loadStats()`、`saveStats()`，建立 `wrongPool`、`stats`、`quizHistory` 三個 store。
* **【SM-2 演算法】**：實作 `sm2Schedule()` 與 `createSM2Card()`，支援間隔遞增（1-6-N 天）、EF 因子調整、到期日期計算。
* **【gradeQuiz 擴充】**：wrap `gradeQuiz`，在評分後自動將錯題寫入 IndexedDB wrongPool、更新累積答題統計。
* **【練習模式即時持久化】**：wrap `showPracticeFeedback`，正確時更新 SM-2 排程，錯誤時加入錯題池；refresh UI 統計數字。
* **【錯題複習模式】**：wrap `startPracticeMode`，新增「錯題特訓」開關（`#chkWrongBook`），過濾到期待複習題目，支援科目/章節篩選，無題目時顯示提示。
* **【UI 整合】**：`exam/index.html` 新增 switch toggle 與統計欄位（`#wrongPoolCount`、`#totalAnsweredCount`、`#totalCorrectRate`）；`exam/style.css` 新增 switch-slider 樣式。
* **【修復】**：修正 compound key（`${certId}_${q.num}`）避免跨證照題號衝突；補齊 normal practice path 缺少的 UI 設定；修復 `showPracticeFeedback` 中未定義變數 `correctLetter`。

---

### 📌 2026-06-16 —— PWA / Service Worker、題庫 lazy chunk、弱點雷達、IRT 審題儀表板、課程學習閱讀模式、營運智慧分析師題庫更新

#### 🕐 階段一：PWA / Service Worker
* **【離線支援】**：建立 `exam/manifest.json`（standalone 顯示、主題色、SVG 圖示）、`exam/sw.js`（cache-first 快取策略）、`exam/icon-192.svg` / `icon-512.svg`。更新 `index.html` 加入 manifest link 與 theme-color meta。`script.js` 尾端註冊 Service Worker。

#### 🕑 階段二：題庫 lazy chunk
* **【按需載入】**：移除 `index.html` 三個靜態 `<script>` 標籤（`questions.js`、`ai_questions.js`、`ai_mid_questions.js`），利用原有 `loadQuestions()` 的動態載入邏輯，選證照時才下載對應題庫，減少初始載入。

#### 🕒 階段三：Chart.js 弱點雷達與趨勢圖
* **【雷達圖】**：在歡迎畫面新增摺疊式「弱點分析」面板，使用 Chart.js 繪製各科目錯題數分佈雷達圖。
* **【趨勢圖】**：實作 `saveQuizHistory` / `loadQuizHistory`，在 `gradeQuiz` 自動記錄每次測驗成績，繪製歷次成績趨勢折線圖（及格線以上綠點、以下紅點）。
* **【quizHistory 持久化】**：IndexedDB 新增 `quizHistory` store，記錄每次測驗的 certId、timestamp、正確數、總題數、分數、模式。

#### 🕓 階段四：IRT 審題儀表板
* **【questionStats 儲存】**：IndexedDB 新增 `questionStats` store（DB v3），在 `gradeQuiz` 與 practice 模式中逐題記錄答對/答錯次數。
* **【儀表板 UI】**：新增獨立 `#irtScreen` 區塊，包含統計總覽卡與題項分析表（題號、科目、章節、難度、答對/答錯、正確率、最近答錯）。
* **【難度分級】**：依正確率分四級（簡單≥80%、中等≥50%、困難≥20%、極難<20%），顏色標示。
* **【Cronbach α】**：基於題目變異數估算信度係數。
* **【排序切換】**：支援依難度、錯題次數、最近答錯三種排序。
* **【UI 調整】**：改為單列三層布局，按鈕移至統計區上方、全寬置中。

#### 🕔 階段五：課程學習（講義閱讀模式）
* **【config.js 擴充】**：各證照模組新增 `studyNotes` 陣列，對應到 `營運智慧分析師/` 與 `AI應用規劃師/` 目錄下的 `.md` 講義檔案路徑。
* **【閱讀器實作】**：新增 `#readerScreen` 全螢幕閱讀區，使用 `fetch()` 載入 `.md` 檔，marked 程式庫轉 HTML 渲染，支援標題/表格/程式碼區塊/引用等樣式。
* **【學習選單】**：主畫面第三張卡「📖 課程學習」點擊後彈出 modal 顯示該證照可用講義清單，點選即進入閱讀模式。
* **【CSS 樣式】**：新增 reader-content 完整樣式集（含深淺色模式）。

#### 🕕 階段六：營運智慧分析師題庫更新（依官方華筑教材重新解析）
* **【PDF 來源確認】**：三份指定 PDF 中，`115年度營運智慧分析師能力鑑定簡章(初級)` 為 22 頁考試簡章（無題目），實際題庫來源為 `1128（華筑）考科1_營運智慧概論`（55頁）與 `1128（華筑）考科2_經營管理數位化概論`（68頁）。
* **【解析路徑修正】**：`parse_questions.py` 的 `pdf_dir` 由不存在的預覽目錄修正為 `營運智慧分析師/官方教材及考試簡章`。
* **【去重邏輯加入】**：在 `parse_questions.py` 的 `main()` 中加入 `seen_questions` 集合與 `normalize()` 函式，依正規化後的題幹文字比對，自動跳過重複題目。
* **【重新產出】**：成功解析 **163 題**（考科一 76 題 + 考科二 87 題），無重複。寫入 `exam/questions.json` 與 `exam/questions.js`，覆蓋舊版非官方模擬題。

---

### 📌 2026-06-14 —— iPAS 模擬考系統登入體驗優化、版權宣告動態化與 GitHub 同步發佈

#### 👑 階段一：模擬考系統登入體驗與版權宣告優化 (Phase 1: Login UI & Copyright Notice Optimization)
*   **【頁尾版權動態化】**：優化 [index.html](file:///c:/Drive224/Projects/iPAS%20證照/exam/index.html) 與 [script.js](file:///c:/Drive224/Projects/iPAS%20證照/exam/script.js) 的頁尾結構，為頁尾版權宣告文字新增 ID 識別，並於 `selectCert()` 中實作動態更新，使頁尾版權文字會隨著目前選擇的證照（營運智慧分析師、AI應用規劃師初級/中級）即時切換，不再固定顯示單一證照名稱。
*   **【登入畫面標題統一】**：針對登入驗證畫面（未通過身分證驗證前），在 `selectCert()` 中加入狀態判斷，若尚未通過登入，則網頁標題、分頁標題及頁尾版權宣告皆統一預設顯示為「iPAS 模擬考系統」。待使用者驗證成功登入並進入主頁後，再行依選取證照載入專屬資訊，完美解決了未登入前畫面資訊不一致的邏輯瑕疵。

#### 🕙 階段二：exam 前端專案 Git 狀態檢查與遠端確認 (Phase 2: Repository Verification)
*   **【Git 狀態檢查】**：檢查 [exam/](file:///c:/Drive224/Projects/iPAS%20證照/exam/) 目錄之 Git working tree，確認目前分支為 `main`，並已追蹤遠端分支 `origin/main`。
*   **【遠端節點確認】**：確認 `origin` 遠端 repository 指向 `https://github.com/ta-lang/iPAS_Test.git`，可用於 GitHub Pages 前端 SPA 發佈。
*   **【變更範圍盤點】**：檢視本次待提交檔案，包含 `ai_mid_questions.js`、`ai_questions.js`、`config.js`、`index.html`、`questions.js` 與 `script.js`，主要涵蓋題庫資料、系統設定、登入/畫面邏輯與頁面結構更新。

#### 🕚 階段三：Git Commit 建立與 GitHub 推送 (Phase 3: Commit & Push)
*   **【版本提交】**：將本次前端系統修改加入 Git staging area，並依序建立優化與同步之 Commit 紀錄：
    *   `01052c1 優化頁尾版權宣告為動態切換證照名稱`
    *   `b2fef89 統一登入時畫面的名稱為 iPAS 模擬考系統`
    *   `4ee95a5 更新 iPAS 模擬考系統`
*   **【GitHub 上傳】**：將 `main` branch 推送至 GitHub 遠端 repository：`https://github.com/ta-lang/iPAS_Test.git`。
*   **【同步確認】**：推送完成後再次確認本機 `main` 與 `origin/main` 已同步，working tree 無未提交變更。

#### 🕛 階段四：工作紀錄更新 (Phase 4: Work Log Update)
*   **【工作日誌補登】**：更新 [work_log.md](file:///c:/Drive224/Projects/iPAS%20證照/work_log.md) 紀錄，將今日之系統功能優化、細部 Commit 歷程與 GitHub 同步狀態完整登錄，利於日後版本管理與專案追蹤。

---

### 📌 2026-06-13 (今日進度) —— AI應用規劃師講義轉檔、自動化題庫解析與雙證照模擬考系統整合

#### 🕢 階段一：AI應用規劃師備考講義編撰與轉檔 (Phase 1: AI Planner Notes & PDF)
*   **【講義教材編撰】**：針對 **IPAS AI應用規劃師 (初級)** 考試大綱，編撰兩份繁體中文 Markdown 衝刺學習筆記：
    1.  **[初級單元一_AI基礎理論與機器學習.md](file:///c:/Drive224/Projects/iPAS%20證照/AI應用規劃師/初級單元一_AI基礎理論與機器學習.md)**：涵蓋 AI 定義與演進、機器學習演算法（監督/非監督/強化學習/深度學習）、評估指標（準確度、混淆矩陣）與實務導入指引。
    2.  **[初級單元二_生成式AI與無程式碼應用.md](file:///c:/Drive224/Projects/iPAS%20證照/AI應用規劃師/初級單元二_生成式AI與無程式碼應用.md)**：涵蓋 Transformer 架構、大型語言模型 (LLM) 與擴散模型原理、提示工程 (Prompt Engineering) 技巧、No-code/Low-code 開發工具、負責任 AI (Responsible AI) 與資安風險。
*   **【PDF 高品質轉檔】**：擴充 [convert_pdf.py](file:///c:/Drive224/Projects/iPAS%20證照/convert_pdf.py) 轉檔指令碼，將新增的 Markdown 筆記渲染為 A4 排版的高解析度 PDF 檔案，輸出至 `AI應用規劃師/` 目錄中，並產生對應的 `.temp/` 暫存 HTML 檔案。

#### 🕙 階段二：官方題庫與模擬試題自動化解析 (Phase 2: Question Parser)
*   **【題庫解析器開發】**：開發 [parse_ai_questions.py](file:///c:/Drive224/Projects/iPAS%20證照/parse_ai_questions.py) 指令碼，透過 `pypdf` 及 Regex 正規表示式自動解析多種來源的 PDF 題目與答案：
    *   **歷屆試題**：114年第四梯次、115年第一次、115年第二次之「科目一：人工智慧基礎概論」與「科目二：生成式 AI 應用與規劃」共 6 份官方公佈試題。
    *   **考試樣題**：官方公佈之 114 年 9 月版能力鑑定考試樣題。
    *   **模擬練習題**：社群/教材之 PPT 模擬考題（包含詳細解析）。
*   **【結構化資料輸出】**：共計成功解析 **530 題** 選擇題，自動指派全域唯一 ID，並輸出為結構化 JSON `exam/ai_questions.json` 與 JavaScript 變數 `exam/ai_questions.js`，供前端系統動態載入。

#### 🕝 階段三：雙證照整合模擬考試網頁系統 (Phase 3: Dual-Cert Exam System Integration)
*   **【首頁證照選擇器 (Certification Selector)】**：修改 [exam/index.html](file:///c:/Drive224/Projects/iPAS%20證照/exam/index.html) 與 [exam/script.js](file:///c:/Drive224/Projects/iPAS%20證照/exam/script.js)，於主歡迎畫面新增證照切換區。使用者可自由點選切換：
    *   **營運智慧分析師** (163 題)
    *   **AI 應用規劃師 (初級)** (530 題)
*   **【動態 UI 與數據更新】**：切換證照時，系統會自動重新載入對應的題庫，動態刷新「總題庫數」、「涵蓋章節」統計指標。
*   **【考試科目模態框 (Modal) 升級】**：
    *   營運智慧分析師對應「考科一：營運智慧概論」及「考科二：經營管理數位化概論」。
    *   AI 應用規劃師對應「科目一：人工智慧基礎概論」及「科目二：生成式 AI 應用與規劃」。
    *   點選對應科目即可隨機抽取該科目 50 題，開始 80 分鐘全真模擬考試。
*   **【自主練習篩選器動態化】**：自主練習模式中的「選擇科目」與「選擇章節」下拉選單，能依據當前選定的證照動態生成科目名稱及所包含的章節選項，提升使用流暢度。

#### 🕔 階段四：雲端硬碟背景同步自動運作 (Phase 4: GDrive Sync Verification)
*   **【背景同步確認】**：經確認，在 2026-06-11 部署的 Windows 工作排程器與背景同步任務 `IPAS_GDrive_Sync` 運作正常。
*   **【自動教材更新】**：今日凌晨背景同步任務自動偵測並下載了雲端硬碟的新增教材：
    *   **資安工程師**：自動同步官方學習指引（第一科、第二科更版）及歷屆公告試題（I11、I12、I21、I22 規劃與防護實務）。
    *   **AI 應用規劃師**：自動同步初級與中級之官方教材、學習指引及勘誤表 PDF。

#### 👑 階段五：中級 AI 應用規劃師與營運智慧分析師模擬考試系統整合與擴充
*   **【營運智慧分析師題庫擴充】**：補足營運智慧分析師之題庫，新增 150 題情境模擬題（涵蓋 ECCD 流程、企業流程再造 BPR、專案管理甘特圖/PERT/要徑法 CPM、企業核心系統 ERP/CRM/SCM、基礎會計財務觀念等），使該科題庫總數達到 **313 題**。
*   **【中級題庫解析器修正與擴充】**：修正 `parse_ai_mid_questions.py` 解析器邏輯，引入「必須具備完整 4 個選項」的嚴格過濾規則，排除因課文段落以數字開頭而被誤判為題目的 bug，並成功解析三科目的官方學習指引課後習題，使中級題庫總數達到 **300 題**。
*   **【中級題目擴充決策（方案 B）】**：經與使用者討論，為確保題庫的真實度與權威性，中級 AI 應用規劃師採用**方案 B**（不透過 AI 生成模擬題，僅採用官方發布之 300 題真題）。

#### 🛠️ 階段六：系統除錯與體驗優化 (Phase 6: Debugging & Optimization)
*   **【iPAS 身分證驗證登入機制】**：
    *   **模擬考場登入體驗**：在主畫面載入前新增登入驗證畫面 `#loginScreen`。
    *   **安全輸入遮罩**：使用 `<input type="password">` 隱藏輸入的身分證號碼，達到輸入時只顯示遮罩（`******`）的安全效果。
    *   **台灣身分證驗證演算法**：在 [exam/script.js](file:///c:/Drive224/Projects/iPAS%20證照/exam/script.js) 中實作 `validateTaiwanID()`，驗證首碼英文字母對應地區數值、性別代碼（1 或 2）以及其餘 8 位數字加權模數（Modulo 10）之檢核碼驗證。例如輸入符合加權格式之有效身分證號碼即可成功通過驗證登入。
*   **【題目數自動更新機制】**：
    *   **HTML 結構調整**：修改 [exam/index.html](file:///c:/Drive224/Projects/iPAS%20證照/exam/index.html)，將主畫面證照卡片中寫死的題目數量以帶有 ID 的 span 標籤（`lblCountOI`、`lblCountAI`、`lblCountAIMid`）包裹。
    *   **動態數據寫入**：於 [exam/script.js](file:///c:/Drive224/Projects/iPAS%20證照/exam/script.js) 的 `loadQuestions()` 末尾動態取得這些元素，並直接寫入實際載入的題庫長度（如 `appData.oiQuestions.length` 等）。
    *   **歡迎描述範本化**：重構 `selectCert()` 中 `welcomeDesc.textContent` 的內容，使用樣報字串（Template Literals）自動填入對應題庫的實際數量，徹底解決題目數量不同步更新的問題。
*   **【標題與瀏覽器分頁標題動態切換】**：修復了首頁主標題與網頁分頁標題（`document.title`）在切換證照（營運智慧分析師、AI 應用規劃師初級/中級）時，未能完全同步動態配置的問題。現在首頁大標題與分頁標題皆會隨著所選證照即時切換。
*   **【題型完整化與無圖解析處理（圖轉文字）】**：
    *   **無圖題型轉文字**：針對 114年第二次中級考試之大數據處理分析（科目二）、機器學習技術（科目三）與官方樣題中共 18 題「只提附圖/上述結果而無圖片」的缺失問題，在 [parse_ai_mid_questions.py](file:///c:/Drive224/Projects/iPAS%20證照/parse_ai_mid_questions.py) 中直接將密度分配圖、虛擬碼、預估矩陣、VGG16 參數統計摘要表與 Titanic 預處理模型代碼轉譯為 Markdown 代碼區塊與文字表格，前置或替換寫入題幹，排除無圖難以答題的盲點。
    *   **Markdown 解析器與代碼樣式渲染**：在前端 [script.js](file:///c:/Drive224/Projects/iPAS%20證照/exam/script.js) 中開發了 `formatQuestionText()` 簡易 Markdown 轉換器，於答題及複盤介面以 innerHTML 形式動態編譯多行代碼區塊與單行標記。並在 [style.css](file:///c:/Drive224/Projects/iPAS%20證照/exam/style.css) 新增支援深淺色模式切換的高質感等寬字型代碼框樣式（`.code-block` 與 `.inline-code`），完美保留代碼縮排與結構。
*   **【自主練習科目與章節切換 Bug 修復】**：修復了「單元自主練習模式」在切換證照時，因 `selectSubject` 宣告為 `const` 被 cloning 取代 DOM 參考時，導致全域參考失效並在後續切換中拋出 `TypeError` 的問題。將 `selectSubject` 改為 `let` 並在 clone 替換後重新指定全域變數，確保各科自主練習篩選與章節列表動態刷新完全正常。
*   **【瀏覽器編碼安全聲明】**：為防止本地傳統繁體中文環境（預設為 CP950 語系）下，瀏覽器解析 JavaScript 外部檔案出現字元集解析錯誤導致中文字串匹配（如 `q.subject.includes()`）失效的狀況，於 [index.html](file:///c:/Drive224/Projects/iPAS%20證照/exam/index.html) 所有 script 標籤中顯式加上 `charset="utf-8"` 宣告，根除跨瀏覽器與 OS 編碼不一致問題。
*   **【中級題庫特定問題解析與去噪】**：
    *   **代碼題選項顯示修復**：針對 114年第二次中級考試第三科機器學習技術與應用第 45 題（VGG16 遷移學習程式碼題），解決了 PDF 程式碼層因轉檔與向量繪圖特性導致文字擷取失敗（原僅抓取到分號 `;`）的問題。利用 PyMuPDF 擷取渲染圖像覆盤原始題目，並將正確的 PyTorch 凍結與分類層程式碼以高品質的多行 String 字串寫入 `exam/ai_mid_questions.json` 及 `exam/ai_mid_questions.js`。
    *   **題庫解析去噪**：清理了題庫解析中夾雜的「《以下空白》」等 PDF 紙張底稿尾碼，並針對題組題（如第 46-47 手寫數字去噪、第 48-50 鐵達尼號多層感知機分類），將原本遺落在選項尾部的【背景說明】段落重新清洗整理，並自動前置（Prepend）到該題組各子題的題幹中，確保題意完整且易讀。
    *   **選項佈局樣式優化**：於 [style.css](file:///c:/Drive224/Projects/iPAS%20證照/exam/style.css) 新增 `.option-text` 專屬樣式，加入 `white-space: pre-wrap`，完美保留代碼型題目的多行分段與 4 空格縮排，確保代碼高保真閱讀體驗。
*   **【GitHub Pages 部署與線上版發佈】**：
    *   **建立獨立 Git 儲存庫**：在 `exam/` 前端 SPA 目錄中初始化獨立的 Git 專案。
    *   **HTTPS 憑證同步**：將遠端節點關聯至 `https://github.com/ta-lang/iPAS_Test.git` 並強制推播至 `main` 分支。
    *   **Pages 線上瀏覽**：整合線上瀏覽網址，使用者可透過 `https://ta-lang.github.io/iPAS_Test/` 直接載入全部題庫，無須在本地建置任何環境即可線上測驗。

---

### 📌 2026-06-11 —— 系統建置、講義生成、PDF 精美轉檔與排程自動化

#### 🕢 階段一：雲端硬碟同步系統建置 (Phase 1: Sync System)
*   **【虛擬環境設定】**：建立專案專屬 Python 虛擬環境 (`.venv`)，安裝 `gdown`、`requests`、`pypdf`、`beautifulsoup4` 與 `markdown` 等依賴套件。
*   **【同步腳本開發】**：撰寫 [sync.py](file:///c:/Drive224/Projects/iPAS%20證照/sync.py)，透過 Google Drive API 進行目錄檔案偵測。
    *   *技術細節*：利用 HTTP `HEAD` 請求獲取雲端檔案的 `Content-Length` 與 `Last-Modified`，實現增量同步，下載時保留原始修改時間。
    *   *清理機制*：實現本地鏡像清理機制，當雲端檔案被刪除或移位時，自動移除本地對應檔案，維持目錄一致性。
*   **【Windows 排程設定】**：撰寫 [create_task.ps1](file:///c:/Drive224/Projects/iPAS%20證照/create_task.ps1) 腳本。
    *   *技術細節*：在 Windows 工作排程器註冊 `IPAS_GDrive_Sync` 任務，設定每 30 分鐘執行一次。使用 `.venv\Scripts\pythonw.exe` 以背景靜態模式執行，完全不顯示命令列視窗，無感背景同步。並完成執行權限與測試，確認 `sync.log` 記錄運作正常。

#### 🕙 階段二：官方教材解析與精選衝刺講義編寫 (Phase 2: Note Generation)
*   **【教材文本解析】**：透過 Python 解析下載下來的官方 PDF 教材與衝刺懶人包，進行大綱架構與必考關鍵字提取。
*   **【衝刺筆記編撰】**：根據考科一（基礎資料分析、評估營運智慧）與考科二（經營管理基本知識、新興數位技術）的交叉重點，編撰了三份繁體中文 Markdown 精華衝刺筆記：
    1.  **[單元A_企業資訊系統與大腦.md](file:///c:/Drive224/Projects/iPAS%20證照/營運智慧分析師/單元A_企業資訊系統與大腦.md)**：ERP、SCM（推/拉式）、CRM（分析型核心為資料探勘）、PLM（核心為 BOM 與配方）、RPA，以及 BI vs OI（即時監控）之差異。
    2.  **[單元B_資料分析與機器學習.md](file:///c:/Drive224/Projects/iPAS%20證照/營運智慧分析師/單元B_資料分析與機器學習.md)**：結構化/半結構/非結構化資料特性、敘述統計、長條圖（類別）vs 直方圖（連續）、柴比雪夫定理（任何分配，$k=2$ 佔 75%）與經驗法則（常態分配 68%-95%-99.7%）、機器學習三大門派（監督/非監督/強化學習）。
    3.  **[單元C_經營管理與專案規劃.md](file:///c:/Drive224/Projects/iPAS%20證照/營運智慧分析師/單元C_經營管理與專案規劃.md)**：外部一般環境 (PEST) 與特定環境（波特五力）、BCG 矩陣（金牛/明星/問題/笨狗）、功能性管理流程（產、銷、人、發、財）、企業流程再造 (BPR)、專案管理工具（甘特圖無法呈現相依性，PERT 使用三種時間估算，CPM 決定要徑最短工期）以及專案三重限制與範圍蔓延。

#### 🕝 階段三：高質感 PDF 渲染轉檔系統開發 (Phase 3: PDF Conversion)
*   **【排版與視覺設計】**：編寫 CSS 排版系統，整合 Google Fonts 的 `Inter` 與 `Noto Sans TC` 字型，設定 A4 頁面邊距、斑馬紋表格與標題防斷頁樣式。
*   **【Mermaid 轉 CSS 流程圖】**：將單元 A 中的 Mermaid 文字關係圖，轉譯為純 HTML/CSS 寫法的流線型方塊圖（Flowchart Node & Arrow），保證列印成 PDF 時具備高動態漸層效果且不失真。
*   **【Alert Callout 智能解析】**：針對筆記中的重要指示標記（如 `> [!IMPORTANT]`、`> [!WARNING]` 等），使用 Python Stateful Parser 進行多行狀態解析，將其封裝為美觀的警告容器（如「💡 提示」、「📌 重要重點」、「⚠️ 出題盲點」與「⚡ 核心考點」）。
*   **【轉檔工具封裝】**：呼叫本地 Microsoft Edge 的 Headless Print-to-PDF 功能，實現快速、無損且支援中文字型之 PDF 輸出。產出了高品質的 `單元A_企業資訊系統與大腦.pdf`、`單元B_資料分析與機器學習.pdf` 與 `單元C_經營管理與專案規劃.pdf`。

#### 🕔 階段四：工作區整合與說明文件建立 (Phase 4: Consolidation)
*   **【腳本搬移與動態路徑化】**：將轉檔工具 [convert_pdf.py](file:///c:/Drive224/Projects/iPAS%20證照/convert_pdf.py) 由後台暫存資料夾移至專案目錄下，並將內部絕對路徑修改為基於 `__file__` 的相對路徑，新增 `.temp` 暫存 HTML 目錄，大幅提升專案的可移植性。
*   **【建立專案說明書】**：撰寫 [README.md](file:///c:/Drive224/Projects/iPAS%20證照/README.md)，清楚引導使用者如何進行同步、執行排程以及手動進行 Markdown 講義至 PDF 轉檔。
*   **【建立工作日誌】**：撰寫 [work_log.md](file:///c:/Drive224/Projects/iPAS%20證照/work_log.md)（即本檔案），完整記錄工作軌跡。

#### 👑 階段五：IPAS 全真網頁模擬考試與自主練習系統開發 (Phase 5: Web Exam System)
*   **【考題解析器開發】**：編寫 `parse_questions.py`。透過 `pypdf` 定位官方教材 PDF 中考科一與考科二的題目 and 答案章節，利用正規表示式 (Regex) 解析出題幹、選項、答案與解析文字，共計提取 163 題，並將其輸出為結構化的 JSON 題庫 `exam/questions.json`。
*   **【全真模擬考模式】**：實現 50 題隨機出題（考科一 25 題，考科二 25 題）與 80 分鐘考試倒數計時。具備防呆機制（提示未答題數）、標記待複習 (Flag) 功能，以及交卷後的成績圓環動畫、及格門檻判斷與錯題覆盤。
*   **【單元自主練習模式】**：提供科目與章節之動態篩選，答題後即時標示對錯，並以動畫滑順展示官方詳細解析與標準選項。
*   **【現代網頁視覺設計】**：基於 HTML5 + Vanilla CSS + JavaScript 打造純前端單頁面應用 (SPA)。整合 Outfit 字型與深/淺色模式，結合毛玻璃效果 (Glassmorphism)、微動畫與響應式排版 (RWD)，提供高質感、完全免伺服器與可離線使用的極致答題體驗。

---

## 📈 後續維護與學習建議

### 📌 2026-06-16 —— 全真模擬考按章節比例配題 + 課程學習依官方綱要整理

* **【按比例配題】**：`startExamSubjectMode` 改為先依 `q.chapter` 分組，按各章節題數佔比分配 50 題（largest remainder method），再 shuffle 混合排序。以考科一為例：第四章 29 題 + 第五章 21 題（原為純隨機抽 50 題）。
* **【參考來源】**：115 年度簡章「評鑑主題與評鑑內容」確認考科一含 L111（營運智慧基本知識）與 L112（基礎資料分析），考科二含 L121（經營管理基本知識）與 L122（新興數位資訊工具基本知識）。
* **【課程學習重整】**：創建 `exam/notes/` 目錄，按官方綱要建立 `oi/`（營運智慧分析師）、`ai/`（AI 初級）、`ai_mid/`（AI 中級）子目錄。oi 下依考科（s1/s2）→ 評鑑主題（L111/L112/L121/L122）→ 評鑑內容（L11101~L11204/L12101~L12203）階層組織。
* **【階層選單】**：`studyNotes` 格式支援 `subjectGroup`（考科標題）與 `topicGroup`（評鑑主題標題）特殊欄位，`showStudyNoteModal()` 依序渲染為階層標題與可點擊筆記按鈕。對應之 CSS 類別 `.note-group-header`、`.note-topic-header` 新增於 `style.css`。
* **【路徑修正】**：所有筆記檔案路徑從根目錄改為 `exam/notes/` 下（GitHub Pages 可存取），同時保留根目錄原始檔案供 PDF 轉換使用。
*   **【題庫標註 assessmentTopic】**：`questions.json`、`questions.js`、`parse_questions.py` 均新增 `assessmentTopic` 欄位，依 chapter 自動映射：第四章營運智慧基本知識→L111、第五章基礎資料分析→L112、第四章經營管理基本知識→L121、第五章數位化企業資訊工具基本知識→L122（共 163 題，44+32+47+40）。
*   **【系統驗證 assessmentTopic】**：`assessmentTopic` 已帶入前端三個顯示位置：(1) 作答畫面 `#lblTopic` badge 緊接在章節後方；(2) 檢討 accordion 的類別標示行（`${q.subject} > ${q.chapter} | ${q.assessmentTopic}`）；(3) IRT 分析表新增「主題」欄（L111~L122）。同時 `addWrongQuestion()` 存入 wrongPool 時一併保留 `assessmentTopic`，兩處 IRT row builder 均從 wrongPool/qIndex 取出該欄位，確保資料在 IndexedDB 生命週期中不遺失。
*   **【修復 Failed to fetch】**：`questions.js` 使用 `const ipasQuestions`，動態 `<script>` 載入時 `const` 不掛在 `window` 上，導致 `window[questionsVar]` 為 undefined，fallback `fetch(questions.json)` 在 `file://` 協議下失敗。已將 `const` → `var`，動態載入後即可透過 `window.ipasQuestions` 讀取。同時 `openReader()` 錯誤提示新增 `file://` 下需使用本機伺服器的建議。

### 📌 2026-06-16（續）—— AI 應用規劃師 assessmentTopic 標註 + studyNotes 階層化

* **【AI 初級 assessmentTopic】**：`ai_questions.json` / `.js` 及 `parse_ai_questions.py` 均新增 `assessmentTopic` 欄位。依 chapter 中的 L-code（L11101~L12303）自動提取前三碼（L111~L123），歷屆考題→「歷屆」，官方樣題→「範例」。共 530 題，含 L111×20、L112×30、L113×20、L114×20、L121×20、L122×20、L123×30、歷屆×300、範例×70。
* **【AI 中級 assessmentTopic】**：`ai_mid_questions.json` / `.js` 及 `parse_ai_mid_questions.py` 均從自訂 M-code 改為官方 L-code（L211~L213、L221~L224、L231~L234）。共 298 題（去重 2 題），含各主題×10、歷屆×150、範例×38。
* **【+ assessmentContent 三層架構】**：兩題庫均新增 `assessmentContent` 欄位（如 L11101、L21101），完成 科目(L11/L12)→評鑑主題(L111~L123)→評鑑內容(L11101~L12303) 三層結構。UI 三處顯示（題目 badge、檢討列、IRT 表）均同步加入評鑑內容欄位。
* **【科目名稱官方化】**：`subject` 欄位改用官方代碼：L11（人工智慧基礎概論）、L12（生成式AI應用與規劃）、L21（人工智慧技術應用與規劃）、L22（大數據處理分析與應用）、L23（機器學習技術與應用）。`config.js` subjects 與 studyNotes 同步更新。
* **【去重邏輯】**：`parse_ai_mid_questions.py` 新增 dedup，優先保留學習指引題目（有章節歸屬），移除官方樣題重複題。`restructure_ai_questions.py` 一次性腳本執行完畢後已移除。
* **【studyNotes 階層化（AI 中級）】**：`config.js` 改用官方 L21/L22/L23 科目代碼 + L211~L234 評鑑主題階層，現有筆記文件掛在 L224 下。
* **【IRT 表新增評鑑內容欄】**：`index.html` IRT 表頭新增「評鑑內容」th，`renderIrtTable()` 資料管線含 assessmentContent。

---

1.  **教材同步狀態監控**：背景排程已開啟，若雲端教材有新增，本地將於 30 分鐘內自動下載。您可以透過檢視 `sync.log` 檔案確認同步狀態。
2.  **講義更新與手動重新轉檔**：
    *   如果您在使用 Obsidian 或 VS Code 閱讀 `*.md` 筆記時做了手動修改或補充，只需在終端機執行：
        ```powershell
        .venv\Scripts\python convert_pdf.py
        ```
        系統便會自動將您的修改重新編譯成最新的 PDF 講義。
3.  **備考階段建議**：
    *   第一階段：搭配 PDF 講義與 `懶人包.pdf`，以「核心生活譬喻」快速建立 ERP/SCM/BI/統計分析/專案管理的架構概念。
    *   第二階段：熟記各單元末尾的「🔑 核心專有名詞英翻中對照表」以及 Alert Callouts 標記的「⚠️ 出題盲點」與「⚡ 核心考點」。
    *   第三階段：開始練習 `官方教材及考試簡章` 資料夾中的模擬試題與歷屆考題。


