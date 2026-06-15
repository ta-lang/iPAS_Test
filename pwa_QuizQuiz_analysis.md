# pwa_QuizQuiz 分析紀錄

分析目標：https://benitorhuang-svg.github.io/pwa_QuizQuiz/
分析日期：2026-06-15

## 目前已確認

- 這是一個部署在 GitHub Pages 的 Vite 打包前端 SPA/PWA，根路徑為 `/pwa_QuizQuiz/`。
- 主題為「QuizQuiz — iPAS 智慧特訓」，定位是 iPAS 營運智慧分析師初級錯題特訓系統。
- 首頁 `index.html` 會把直接路徑導向 hash routing，例如 `/irt` 轉成 `/#/irt`，適合 GitHub Pages 靜態部署。
- 應用入口為 `/pwa_QuizQuiz/assets/index-1eu7rvYK.js`，樣式入口為 `/pwa_QuizQuiz/assets/index-B2CV92cq.css`。
- PWA 使用 `registerSW.js` 註冊 `/pwa_QuizQuiz/sw.js`，service worker 由 Workbox 產生。
- Service worker precache 了主頁、CSS/JS chunks、題庫 chunks、glossary chunks、favicon、share banner 與 manifest。
- PWA 另有 dynamic JSON 快取策略與 Google Fonts 快取策略。

## 路由與主要功能

- `/`：DashboardPage，顯示學習進度、單元完成率、PWA 安裝提示。
- `/topics`：單元列表。
- `/resources`：資源頁。
- `/quiz/:topicCode`：單元測驗，支援 `FULL_EXAM` 與 adaptive 模式導向。
- `/topic/:topicCode`：單元詳情。
- `/weakness`：弱點分析/錯題池。
- `/settings`：設定頁，包含 GAS 同步設定相關邏輯。
- `/viewer/:url`：資源檢視器。
- `/exams`：模擬考頁。
- `/irt`：教師審題/IRT 分析頁。
- `/review-console`：導向 `/irt`。
- `/quiz/adaptive`：導向 `/quiz/FULL_EXAM?difficulty=adaptive`。

## 資料與同步

- 本地資料庫名稱為 `QuizQuizDb`，object store 為 `keyvalue`。
- 學習統計 key 為 `quizquiz_stats`。
- 統計資料優先存在 IndexedDB，並備份到 localStorage。
- localStorage keys 包含：
  - `quizquiz_stats`
  - `quizquiz_gas_url`
  - `quizquiz_user_id`
  - `quizquiz_last_sync`
  - `quizquiz_sync_pending`
  - `quizquiz_theme`
  - `quizquiz_font_size`
- GAS 同步採 iframe/form POST 與 popup login fallback，並透過 `postMessage` 回傳 callback。
- 首頁也處理 `redirect_sync=true` callback，用於 GAS 授權完成後自我修復導回主頁。

## 題庫與學習邏輯

- 主題架構對應 iPAS 營運智慧分析師：
  - `L11`：營運智慧概論。
  - `L12`：經營管理數位化概論。
  - `L111`、`L112`、`L121`、`L122` 為主題群。
  - 單元包含 `L11101` 至 `L12203` 共 13 個單元。
  - 特殊測驗包含 `EXAM_L11`、`EXAM_L12`、`FULL_EXAM`、`WRONG_BOOK`。
- 模擬考設定：
  - `L11`：50 題、75 分鐘、70% 及格。
  - `L12`：50 題、75 分鐘、70% 及格。
- 錯題池使用類 SM-2 的間隔複習邏輯，包含 repetitions、interval、efactor、nextReviewDate。
- 統計追蹤 topic accuracy、tag accuracy、history、wrongPool，history 最多保留 50 筆。

## IRT / 審題功能

- `/irt` 頁面是高階教師審題或題項品質儀表板。
- 會嘗試呼叫 Google Apps Script `read_all_analysis` 取得全體作答分析資料。
- 計算項目包含：
  - Cronbach's alpha 信度。
  - P-Value 難度。
  - D-Index 鑑別度。
  - 選項誘答分布。
  - 題目上架/下架狀態。
- 介面提供「IRT 數據與儀表板」、「題項品質稽核與教學改善序列」、「自適應系統 V1.0 發布」等分頁。
- 發布說明宣稱導入 4PL/CAT adaptive testing，實際 adaptive 題目選取邏輯仍需進一步檢查 QuizPage chunk。

## 初步可借鏡重點

- GitHub Pages 靜態站可採 hash routing 加路徑自動轉 hash，降低 404 與直接連結問題。
- 題庫拆成 lazy chunks，能減少初始載入負擔；本專案目前把大型題庫 JS 直接掛在 `index.html`，可評估分包。
- IndexedDB + localStorage backup 比單純 localStorage 更穩，適合保存大量練習紀錄。
- 錯題池 + 間隔複習 + 弱點雷達，比單次模擬考更有長期學習價值。
- PWA precache 能讓題庫離線可用，和本專案的純前端 GitHub Pages 模式相容。

## 待續分析

- 檢查 `QuizPage` chunk：確認一般測驗、模擬考、adaptive/CAT 具體選題邏輯。
- 檢查題庫 chunk：確認題目欄位格式、IRT 欄位、tags 與 isActive 用法。
- 檢查 `SettingsPage`：確認 GAS URL 設定、同步流程與使用者體驗。
- 檢查 `WeaknessPage`：確認錯題池呈現與複習排程。
- 與本專案 `exam/` 逐項比較，整理可移植功能與風險。

## 第二輪分析：測驗核心

- 題庫由 `organisms-BnxTuHNj.js` 透過 Vite glob lazy import 載入，原始資料路徑形如 `src/data/quiz-banks/L11101/11101_01.json`。
- 題庫打包後每個單元是一個 chunk，例如 `quiz-l11101-IiEwzaQV.js`。
- 題目物件基本欄位：
  - `id`
  - `subject`
  - `topicCode`
  - `difficulty`
  - `question`
  - `options`
  - `answer`
  - `explanation`
  - 進階題目可能另含 `tags`、`irt`、`isActive`、`reviewNotes`。
- 載題邏輯：
  - `EXAM_L11` 載入所有 L11 單元後取 L11 題目。
  - `EXAM_L12` 載入所有 L12 單元後取 L12 題目。
  - `FULL_EXAM` 載入全部 L11/L12 題目。
  - `WRONG_BOOK` 依 `wrongPool` 中的 quizId 回收錯題。
- 一般抽題會先依 difficulty 過濾，再隨機洗牌。
- 若題目在錯題池中，會被額外放入抽題候選池兩次，等於錯題權重提高為 3 倍。
- 選項會被隨機重排，並同步重算正確答案代號。

## 第二輪分析：模擬考配題

- `EXAM_L11` 題數固定 50 題，配比：
  - `L11101`：6 題
  - `L11102`：6 題
  - `L11103`：6 題
  - `L11104`：7 題
  - `L11201`：8 題
  - `L11202`：7 題
  - `L11203`：7 題
  - `L11204`：3 題
- `EXAM_L12` 題數固定 50 題，配比：
  - `L12101`：10 題
  - `L12102`：10 題
  - `L12201`：10 題
  - `L12202`：10 題
  - `L12203`：10 題
- 考科模擬考時間設定為 75 分鐘，及格門檻 70%。
- 模擬考介面使用 CBT 題號格，支援已答、未答、答對、答錯、旗標標記與交卷確認。

## 第二輪分析：Adaptive / CAT

- Adaptive 模式可由 `/quiz/FULL_EXAM?difficulty=adaptive` 進入。
- 宣傳文案稱為 4PL/CAT，但實作較像「IRT-inspired」選題：
  - 若題目有 `irt`，使用 `a`、`b`、`c`、`d` 參數。
  - 若沒有 `irt`，用 difficulty fallback：easy 的 b 約為 -1.5，hard 的 b 約為 1.5，medium 近似 0。
  - 使用 logistic information function 選擇在目前能力值附近資訊量最高的題目。
  - 選題時乘上 0.9 到 1.1 的隨機因子，避免完全固定。
- 能力估計在前端以答對 +0.5、答錯 -0.5 的簡化分數呈現，不是完整 MLE/EAP 估計。
- Adaptive 停止條件：
  - 達到目標題數上限。
  - 最少題數後若最近 4 題出現交錯型態，或最近 5 題全對/全錯，會提前停止。
  - 預設 adaptive 題數：`FULL_EXAM` 或 `EXAM_*` 約 30 題，一般單元約 15 題。

## 第二輪分析：設定與雲端同步

- 設定頁包含深色/淺色模式、字級大小、Google Apps Script 雲端備份、重設本機資料。
- 內建可複製的 GAS 腳本會自動建立 `QuizQuiz_Backup_Data` 試算表。
- GAS 工作表設計：
  - `Users`
  - `SessionHistory`
  - `WrongQuestions`
  - `TopicProgress`
- 實際同步主要讀寫 `Users` sheet 中的 `StatsJSON`。
- 匿名題項分析 `item_analysis` 可透過 GAS 代理寫到 GitHub Issue comments，需要 GAS script properties 內設定 `GITHUB_TOKEN`、`GITHUB_REPO`、`GITHUB_ISSUE_ID`。
- 設定 wizard 內有隱藏入口：在 GAS URL 欄輸入 `irt` 會顯示前往 IRT 控制台按鈕。

## 第二輪分析：弱點與視覺化

- 弱點頁由 `WeaknessPage` 組裝 `organisms` 中的統計元件。
- 統計面板包含：
  - 累計作答。
  - 總正確率。
  - 特訓次數。
  - 最近特訓紀錄。
  - 正確率趨勢圖。
  - 知識點雷達/長條圖。
  - tag 層級的細部弱點分析。
- 圖表使用 lazy-loaded Chart.js。

## 初步差異：與本專案 exam/

- 本專案 `exam/` 是單一靜態頁 + 大型題庫 JS；pwa_QuizQuiz 是 Vite SPA + lazy chunks。
- 本專案支援三張證照題庫；pwa_QuizQuiz 聚焦營運智慧分析師初級，但學習閉環更完整。
- 本專案有身分證登入模擬與三證照切換；pwa_QuizQuiz 有 PWA、IndexedDB、錯題間隔複習、GAS 多裝置同步與 IRT/審題儀表板。
- pwa_QuizQuiz 的一些高階文案（如 4PL/CAT）比實作更理想化，若移植需保守命名，避免過度宣稱。
