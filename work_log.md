# 📝 IPAS 證照考試準備專案——工作日誌 (Work Log)

本工作日誌記錄了 **IPAS 營運智慧分析師**、**AI應用規劃師** 及其他證照專案的學習講義製作、題庫自動化解析、雲端同步排程設定與雙證照模擬考試系統的開發歷程與里程碑。

### 📌 2026-10-25 —— AIoT 應用工程師 講義全方位升級符合 SOP（Mermaid + 向量 SVG + Python 實戰代碼專區 + 雙目錄同步）

* **【SOP 規範全方位整改落地】**：
  * **視覺化升級（Mermaid + 向量 SVG 卡片）**：
    * 徹底淘汰粗糙純文字與 ASCII 方塊，全面重構為標準 Mermaid 流程圖（深度學習架構演進、三層/五層物聯網架構、PdM 全管線流程、LPWAN 分支對比、Dual-Bank OTA 安全時序與 OEE 損失分解）。
    * 在 L113_感測器原理與應用.md 內嵌兩組高品質深色透明響應式向量 <svg> 幾何卡片：
      1. **Wheatstone Bridge 惠斯登電橋微應變量測電路圖**（對稱四臂菱形電路、差動節點 Node A/B、平衡條件與儀表放大器介面）。
      2. **ADC 取樣保持 (S/H) 與量化階梯 (Quantization) 原理圖**（類比連續波、取樣脈衝點、紫色階梯量化碼與 LSB 水平格線）。
  * **SOP 階段 3 實作程式語言專區（Python）**：
    * **L112_AIoT基礎與架構.md**：增設「🐍 Python paho-mqtt 物聯網通訊實戰代碼專區」，包含 QoS 0/1/2 差別、KeepAlive、LWT 遺囑訊息、TLS 憑證，以及 loop_start() vs loop_forever() 與 on_message 異步解耦避坑指南。
    * **L113_感測器原理與應用.md**：增設「🐍 Python pymodbus 工業通訊與感測資料前處理專區」，包含 Modbus-TCP / RTU 保持暫存器讀取、16-bit / 32-bit 浮點數解碼還原，以及 (1)$ 環形緩衝區「滑動平均濾波器（Moving Average Filter）」演算法。
    * **L111_AI基礎知識與應用.md**：增設「🐍 邊緣端 Edge AI 輕量推論實戰代碼專區」，示範 TFLite INT8 量化推論與 ONNX Runtime 跨平台單筆即時推論工作流。
  * **Worked Examples 數值計算示範補強**：
    * 於 L113 補強 12-bit SAR ADC 最小解析電壓（ pprox 0.806	ext{ mV}$）與壓力感測器物理量還原算例。
    * 於 L112 補強 2,000 台智慧電表節點之網路頻寬與每日歷史儲存容量（.37	ext{ GB/日}$）試算。
* **【雙目錄完全同步與全回歸測試】**：
  * 同步更新 
otes/aiot/ 與 xam/notes/aiot/ 雙目錄，確保 100% 同步一致。
  * 完整還原測試套件與 question_identity.py，執行 
ode --test tests/*.test.js **46/46 全數 PASS**；python -m unittest tests.test_question_identity **4/4 全數 PASS**。

### 📌 2026-10-25 —— 中級 AI 應用規劃師 科目二（大數據處理分析與應用）Python 考點實戰與高頻代碼精華強化

* **【盤點官方教材與歷屆真題 Python 分佈】**：
  * 全面檢視官方學習指引（182 頁）與歷屆公告試題（114年第二次、115年第一次、考猜）：
    * 確認科目二考題中確實包含約 10~15 題（佔比 20%~30%）直接涉及 Python、Pandas、Numpy、Scipy、Scikit-learn、Seaborn 與 Spark 分散式運算之情境代碼題。
    * 確認目前 xam/ai_mid_questions.json 題庫已完整收錄該考科全部 196 題（含 21 題 Python / 代碼與報表題組），試題無缺漏。
* **【強化大數據科目筆記（增補 Python 高頻實戰程式碼與常考陷阱）】**：
  * **L221_機率統計基礎.md**：增補 Pandas/Numpy 敘述統計運算（describe、IQR 四分位距與離群值過濾）以及 Scipy 統計分佈代碼（poisson.pmf / cdf、
orm.cdf 累積經驗區間計算）。
  * **L222_大數據處理技術.md**：增補 50GB 大型資料防止 OOM 的 chunksize 串流分批讀取、Pandas 缺失值 NaN 向上轉型 loat64 陷阱與 Int64 解決方案、Python 函式預設可變參數（	ags=[]）閉包共享錯誤陷阱、以及 PySpark 分散式 DataFrame.agg() vs 避免 collect() 造成 Driver OOM 的架構考點。
  * **L223_大數據分析方法與工具.md**：增補 Pandas 數據分組與排行高頻語法（groupby / sort_values / head(3)）、Scikit-learn 羅吉斯迴歸訓練與 classification_report（Precision/Recall/F1/Support/Macro/Weighted avg）報表結構判讀、Statsmodels OLS 多元線性迴歸摘要判讀（^2$、P-value 顯著性檢定）、以及 Seaborn（sns.barplot、sns.scatterplot、sns.heatmap 相關係數熱力圖）繪圖常考語法。
* **【全回歸測試驗證】**：
  * 執行 
ode --test tests/*.test.js 46/46 全數通過。
  * 執行 python -m unittest tests.test_question_identity 4/4 全數通過。

### 📌 2026-10-24 —— 模考結束審題儀表板直達導引與渲染保護修復

* **【測驗結果頁新增審題儀表板直達入口】**：
  * 在 `exam/index.html` 的結果頁動作區塊（`.results-actions`）新增 `[📊 審題儀表板]`（`#btnResultsShowIrt`）快捷按鈕，使考生考完 50 題全真模擬考或練習後，能立即點擊查看 IRT 題項分析、難度分佈與答題正確率。
* **【雙向平滑導覽與返回路徑記憶】**：
  * 於 `exam/script.js` 擴充 `showIrtDashboard(fromScreen)` 與 `irtReturnScreen` 狀態記憶，若由結果頁進入儀表板，點擊「← 返回」可順暢返回結果覆盤頁；若由主選單進入則返回主選單。
* **【交卷結算渲染防護（Try-Catch）】**：
  * 於 `gradeQuiz()` 補強各單元弱點與試卷覆盤之渲染容錯機制，確保各類非預期例外均不阻礙結果頁展示。
* **【自動化測試全數通過】**：
  * `node --test tests/*.test.js` 46/46 通過；`python -m unittest tests.test_question_identity` 4/4 通過。

### 📌 2026-10-24 —— 新增第六張證照「AIoT 應用工程師（初級）」—— 140 題精準題庫解析建置與 100% 三段式高規格詳解

* **【AIoT 應用工程師題庫解析管線建置 (`parse_aiot_questions.py`, `questions_aiot.py`)】**：
  * 整合官方學習指引試題與情境式評量試題，產出 `exam/aiot_questions.json` 與 `exam/aiot_questions.js`，共計 **140 題**（全單選題）：
    * **考科一：AIoT 基礎概論（80 題）**：完整解析官方學習指引（9 大章節評量題），涵蓋 L11101 AI基礎概念（5題）、L11102 AIoT應用案例（5題）、L11201 物聯網架構與功能（10題）、L11202 常見通訊協定與網路層技術（10題）、L11203 工業通訊標準與資訊模型（10題）、L11204 中介軟體與平台（10題）、L11205 資安與隱私基本概念（10題）、L11301 感測技術基礎（10題）、L11302 感測訊號與通訊基礎（10題）。
    * **考科二：物聯網系統與應用（60 題）**：高擬真情境實務試題，平均分佈於 6 大核心評鑑內容（各 10 題）：L12101 系統元件與架構、L12102 簡易系統故障問題判斷與排除、L12103 物聯網資訊安全、L12201 物聯網硬體設計基礎、L12202 雲端環境數據收集與平台設計、L12203 智慧製造流程優化與成本控制。
    * **平衡答案分佈**：科目二 60 題答案嚴格呈現四選項均勻平衡（A: 15, B: 15, C: 15, D: 15，各佔 25%）。
  * 140 題全部 100% 標註結構化教育詳解（含【核心考點】、【正確答案說明】、【選項辨析】三段式解析，逐選項剖析除錯）。
* **【確定性題目身分與快取合約驗證】**：
  * 採用 `question_identity.py` 自動生成確定性 `question_uid`（`aiot-<hash24>`）與 `content_hash`。
  * `exam/aiot_questions.js` 封裝符合標準前端合約 `window.ipasAiotQuestions = [...]`。
* **【自動化測試與煙霧測試全面通過】**：
  * 於 `tests/question-bank-smoke.test.js` 擴充 `aiot_questions.json` 驗證契約。
  * `node --test tests/*.test.js` **46/46 測試全數通過**；`python -m unittest discover tests` 4/4 通過。

### 📌 2026-10-23 —— 新增第五張證照「電路板製程工程師（中級）」—— 135 題真題題庫建置與 5 份 SOP 模組化重點講義

* **【電路板製程工程師題庫解析管線建置 (`parse_pcb_questions.py`)】**：
  * 解析 115 年第一次中級能力鑑定三大考科公告試題，產出 `exam/pcb_questions.json` 與 `exam/pcb_questions.js`，共計 **135 題**（單選 105 題 + 複選 30 題）：
    * 科目一：電路板品管概論（45 題，含 SPC、QC 7 大手法、IPC 國際規範）
    * 科目二：軟性電路板製程概論（45 題，含 2L-FCCL、壓延銅箔、Coverlay、補強板與鋼片）
    * 科目三：硬式電路板製程概論（45 題，含 高 Tg CCL、6H1L1R、DES、PTH、ENIG 與切片分析）
  * 135 題全部補齊【核心考點】、【正確答案說明】、【選項辨析】三段式高規格教育詳解（詳解覆蓋率 100%）。
* **【5 份 SOP 模組化重點講義 (`exam/notes/pcb/`)】**：
  * 依初級與中級官方學習指引（共 149 頁）大綱，建立 5 份高品質 Markdown 課程講義：
    * `s1_電路板品管概論/L211_統計製程管制SPC.md`（7 大管制圖對比、Western Electric 8 大失控判異、Ca/Cp/Cpk 公式與數值算例）
    * `s1_電路板品管概論/L212_QC七大手法與品質管理.md`（QC 7 大手法時機對比表、QC Story 8 大步驟、IPC-A-600 Class 1/2/3 允收標準）
    * `s2_軟硬板製造概論/L121_基材材料組成與趨勢.md`（CCL 銅箔/樹脂/玻纖布組成、電解銅 vs 壓延銅微觀結構、6H1L1R 高頻高速指標與傳輸損耗公式）
    * `s2_軟硬板製造概論/L122_PCB多層板核心製造製程.md`（內層減成法 DES、蝕刻因子 $EF$ 算例、黑化/棕化、通孔 PTH 與去膠渣、六大表面處理對比）
    * `s2_軟硬板製造概論/L221_軟板與軟硬結合板特論.md`（PI 基膜、2L-FCCL、Coverlay、補強板、軟硬結合板交界應力釋放、IPC-TM-650 切片分析 SOP）
  * 5 份筆記皆附 10 點「🎯 考前衝刺一句話考點」（共 50 點）。
* **【系統與導覽整合】**：
  * 於 `exam/config.js` 註冊啟用 `id: "pcb"` 模組，配置 135 題、3 大考科篩選與 14 個 `#L1xxxx` / `#L2xxxx` 錨點平滑捲動跳轉。
* **【測試與驗證】**：
  * `node --test tests/*.test.js` **45/45 測試全數通過**；`python -m unittest tests.test_question_identity` 4/4 通過。

### 📌 2026-10-23 —— 3D 列印積層製造工程師 (初級) 題庫解析建置 (207 題) 與雙科題庫全面上線

* **【3D 列印積層製造工程師 (初級) 題庫解析與建置】**：
  * 開發 parse_3d_questions.py 自動化剖析 4 份官方教材與歷屆試題 PDF：
    1. 115年第一次初級3D列印積層製造工程師_第一科_3D列印概論：50 題。
    2. 115年第一次初級3D列印積層製造工程師_第二科_3D製程與材料概論：50 題。
    3. 3D列印概論(111年版) (科目一學習指引)：第一章 14 題 + 第二章 20 題 = 34 題。
    4. 3D列印製程與材料概論(111年版) (科目二學習指引)：第一章 29 題 + 第二章 22 題 + 第三章 22 題 = 73 題。
  * 題庫總數精準達成 **207 題**（科目一：84 題；科目二：123 題）。
* **【圖示抽取與 Markdown 渲染保護】**：
  * 精準提取剪裁 59 張題幹與選項示意圖（含向量裁切之下照式光固化系統架構圖），存放於 xam/images/3d/。
  * 於 xam/core.js ormatQuestionText 新增 Markdown 圖片語法 ![alt](src) 佔位保護機制，防止 HTML 轉義破壞圖示標籤，確保題幹與選項圖示高相容渲染。
* **【異常修復與 100% 深度結構化詳解】**：
  * 完美修復 115 年第二科 Q26 官方排版異常（清除題幹殘留的 (A) 當線徑誤差過大時暫停列印）。
  * 207 道試題 100% 注入結構化 Markdown 解析（含【核心考點】、【正確答案說明】、【選項辨析】三段式分析）。
* **【架構整合與測試驗證】**：
  * 整合 question_identity.py 生成唯一確定性 question_uid 與 content_hash。
  * 於 xam/config.js 註冊啟用 3d 證照模組；於 	ests/question-bank-smoke.test.js 擴充 3d_questions.json 驗證。
  * 
ode --test tests/*.test.js 44/44 全數通過；python -m unittest tests.test_question_identity 4/4 全數通過。

### 📌 2026-10-23 —— 系統品牌標題微調為「iPAS 備考系統」與 GitHub Pages 同步

* **【品牌標題與頁籤調整】**：
  * 將首頁頂部 Navigation Header 標題統一規範為 **`iPAS 備考系統`**（登入前）與 **`iPAS [證照名稱]`**（登入後）。
  * 更新瀏覽器頁籤 Title 為 **`iPAS 備考系統`** / **`iPAS [證照名稱] 備考系統`**。
  * 更新 PWA `apple-mobile-web-app-title` 為 **`iPAS 備考系統`**。
* **【驗證與發布】**：
  * Node.js 43 測試全數通過（43/43 PASS）。
  * 來源儲存庫 Commit：`37efd4e`；GitHub Pages 部署 Commit：`c11c08f`（https://ta-lang.github.io/iPAS_Test/）。

### 📌 2026-10-23 —— 營運智慧分析師官方指引講義 SOP 重構升級（4 份主題講義 + 13 個錨點導覽 + 163 題題庫深度詳解 100% 覆蓋）

* **【營運智慧分析師（L11 / L12）官方學習指引講義 SOP 重構】**：
  * 依據《iPAS 證照備考與題庫／講義建置標準作業程序（SOP）》規範，將營運智慧分析師原有 3 份跨科混雜筆記徹底重構為 **4 份高品質評鑑主題 Markdown 筆記**：
    * `L111_營運智慧基本知識.md`（BI vs OI 8 維度對比表、CEP 複雜事件處理三層架構、決策支援四分析、DW vs Data Mart vs ODS、OLAP 五大操作、平衡計分卡 BSC 四構面）。
    * `L112_基礎資料分析.md`（結構化/半結構化/非結構化比較、偏態 Mean vs Median vs Mode 判別、IQR 盒鬚圖離群值算例、柴比雪夫定理 $k=2$ 算例、經驗法則 68-95-99.7 算例、購物籃關聯規則 Support / Confidence / Lift 1000 筆訂單實戰試算）。
    * `L121_經營管理基本知識.md`（PEST 分析、波特五力、SWOT 矩陣配對、BCG 四象限、錢德勒「結構跟隨策略」、產銷人發財職責、甘特圖 vs PERT/CPM、PERT 期望完工時間 $T_e = (O+4M+P)/6$ 與關鍵路徑算例）。
    * `L122_數位化企業資訊工具基本知識.md`（雲端 IaaS/PaaS/SaaS 責任矩陣圖、被動式/主動式 RFID、大數據 5V、企業常見六大系統 ERP/SCM/CRM/PLM/KM/RPA 對比表、BPR 四大關鍵詞、波特價值鏈主要 vs 支援活動）。
  * **【考前速讀清單】**：4 份筆記文末各附 10 點精鍊之「🎯 考前衝刺一句話考點」（合計 40 點）。
* **【`exam/config.js` 錨點全數串聯】**：
  * 將營運智慧分析師 `oi.studyNotes` 的 13 個評鑑小節分別映射至 4 份新筆記的 `#L1xxxx` 二級標題錨點，支援點選平滑捲動跳轉。
* **【題庫詳解 100% 注入與強化】**：
  * 針對 `exam/questions.json` 與 `exam/questions.js` 中的 163 道試題，將原本缺乏解析的 139 道試題全數注入【核心考點】、【正確答案說明】與【選項辨析】三段式結構化深度詳解，詳解覆蓋率達 **100%**（永久題號 `question_uid` 與答案鍵 100% 保持穩定一致）。
* **【驗證結果】**：
  * `node --test tests/*.test.js` **43/43 測試全數通過**；`python -m unittest tests.test_question_identity` **4/4 測試全數通過**；語法檢查零錯誤。

### 📌 2026-10-23 —— 初級 AI 應用規劃師官方學習指引講義 SOP 重構升級（7 份獨立講義 + 16 個錨點導覽 + 5 大官方勘誤融入）

* **【初級 AI 應用規劃師（L11 / L12）官方學習指引筆記 SOP 重構】**：
  * 依據《iPAS 證照備考與題庫／講義建置標準作業程序（SOP）》規範，將初級 AI 原有 2 份大檔案拆解並擴充為 **7 份高品質評鑑主題 Markdown 筆記**：
    * `L111_AI概念與治理.md`（EU AI Act 四大風險層級、公部門手冊七大原則、金融 AI 指引、倫理原則反例）。
    * `L112_資料處理與分析.md`（結構化/半結構化/非結構化比較、偏態 Mean vs Median vs Mode 判斷、IQR 與盒鬚圖邊界算例、時序線性插補、去識別化與 $k$-匿名性）。
    * `L113_機器學習基本原理與模型.md`（過擬合/欠擬合、時序資料洩漏防範、四大機器學習範式對比表、晶圓檢測混淆矩陣 Precision/Recall/F1 數值計算範例、CNN/LSTM/Batch Normalization/自編碼器）。
    * `L114_鑑別式AI與生成式AI原理與應用.md`（條件機率 vs 聯合機率、美食評論家 vs 主廚、GAN/VAE/Diffusion 對比、CLIP vs DINO、XAI 可解釋工具 Saliency/LIME/PDP、稀疏 MoE）。
    * `L121_NoCode_LowCode基本概念與限制.md`（公民開發者、No-Code vs Low-Code vs Pro-Code 三方對比、廠商鎖定、影子 IT、CoE、選型決策樹）。
    * `L122_生成式AI工具應用與提示工程.md`（Prompt CRFC 四要素、Zero/Few-shot/CoT、RAG 向量檢索架構、餘弦相似度向量試算、Temperature/Top-p/Top-k 超參數調校）。
    * `L123_生成式AI導入評估規劃與風險.md`（可行性 vs 價值導入矩陣、經濟部 AI 導入四階段、客服 AI 第一年 ROI 數值計算範例、四大風險與安全護欄）。
  * **【官方勘誤表全面融入】**：完整標註 5 處官方教材勘誤重點（平均差絕對差值平均、抽樣變異定義、型一錯誤 Type-I Error $\alpha$ 定義與 p 值意義、K-means 原理特性澄清、企業導入階段性策略標題）。
  * **【考前速讀清單】**：7 份筆記文末各附 10 點精鍊之「🎯 考前衝刺一句話考點」（合計 70 點）。
* **【`exam/config.js` 錨點全數串聯】**：
  * 將初級 `ai.studyNotes` 的 16 個評鑑小節分別映射至 7 份筆記的 `#L1xxxx` 二級標題錨點，支援點擊平滑捲動跳轉。
* **【驗證結果】**：
  * `node --test tests/*.test.js` **43/43 測試全數通過**；`python -m unittest tests.test_question_identity` **4/4 測試全數通過**；語法檢查零錯誤。

### 📌 2026-10-23 —— 中級 AI 應用規劃師官方學習指引全科講義、補充題庫擴充（566 題）與模擬測驗系統三階段全面升級

* **【中級 AI 應用規劃師（L21 / L22 / L23）官方學習指引全科重點講義】**：
  * 依據經濟部 iPAS 官方學習指引（科目1：人工智慧技術應用規劃、科目2：大數據處理分析與應用、科目3：機器學習技術與應用）、`1150410` 官方學習指引勘誤表（標註 `⚠ 勘誤`）與 `11506` 評鑑內容範圍參考，於 `exam/notes/ai_mid/` 建立完整的 11 份評鑑主題（`L211`～`L213`、`L221`～`L224`、`L231`～`L234`，涵蓋全部 34 個 `L2xxxx` 評鑑內容代碼）Markdown 課程筆記，並掛載至 `exam/config.js`。
* **【中級官方學習指引實戰補充題庫擴充（448 題 → 566 題）】**：
  * 新增 `AI應用規劃師/中級AI應用規劃師/ai_mid_guide_supplement_questions.json`（共 118 道貼合官方指引與勘誤表之單選實戰題，涵蓋 L21 30 題、L22 40 題、L23 48 題，含計算與情境題）並擴充 `parse_ai_mid_questions.py` 納入建置管線。
  * 重新建置 `exam/ai_mid_questions.json` 與 `exam/ai_mid_questions.js`，中級總題數由 448 題提升至 **566 題**（既有 448 題之 `question_uid` 100% 維持不變）。
* **【模擬測驗系統（`exam/`）Phase 1–3 診斷與全面改善】**：
  * **Phase 1（P0：關鍵顯示修復與課程筆記錨點導覽）**：
    * 於 `exam/core.js` 與 `exam/script.js` 升級 `formatQuestionText` 與 `renderMathInContainer`，完整支援題幹、選項與詳解中的 **Markdown 表格**（如混淆矩陣、交易紀錄表）與 **KaTeX 數學公式**（`$...$` 與 `$$...$$`），並通過全題庫 1,359 題驗證。
    * 新增 `stripOptionPrefix` 與 `formatStandardAnswerHeader`，消除選項重複前綴 `A (A)` 與詳解重複標準答案 `標準答案：(A) 標準答案：(A)`。
    * 為 `exam/config.js` 的 34 個中級課程筆記項目綁定 `#L2xxxx` 錨點，並升級 `loadNoteFile` 支援同一檔案內免重複請求平滑捲動至對應章節標題；修正 `ai_mid.questionCount` 為 `566` 及首頁「課程學習」卡片文案。
  * **Phase 2（P1：全真模考均勻配題、練習篩選強化與多維度弱點雷達圖）**：
    * 新增純函式 `sampleExamQuestions` 與模考配題設定列（`#examSamplingBar`），支援「**依官方評鑑主題均勻配題 (`balanced_topic`)**」與「**排除歷屆公告試題 (`#chkExcludePastExams`)**」，解決過往歷屆考題佔模考近 60% 的抽樣偏差。
    * 單元自主練習新增「**評鑑主題篩選 (`#selTopic`)**」、錯題特訓切換「**今日到期複習 (SM-2) vs 全部錯題 (考前總複習) (`#selWrongMode`)**」及「**僅測驗未作答過的新題 (`#chkUnansweredOnly`)**」。
    * 補齊模擬考模式（`exam`）交卷時答對錯題本題目的 SM-2 排程更新（`updateWrongPoolAfterCorrect`）。
    * 新增 `buildRadarAxisStats` 升級弱點分析雷達圖，改以「評鑑主題（`assessmentTopic`）或章節」為多維度軸線（營運智慧 4 軸、初級 AI 9 軸、中級 AI 13 軸），解決原本 2 科證照退化為單一直線的問題。
  * **Phase 3（P2：PWA 快取策略重構、測驗/登入狀態防丟失與鍵盤快捷鍵）**：
    * 升級 `exam/sw.js` 至 `ipas-exam-v5`：同源請求改採 **Network-First（網路優先、離線降級快取）** 確保題庫與筆記更新即時生效；信任的 CDN 資源（KaTeX、Marked、Mermaid、Chart.js、Google Fonts）採 **Stale-While-Revalidate** 支援離線渲染。
    * 新增 `serializeActiveSession` / `restoreActiveSession` 與 `serializeActiveQuiz` / `restoreActiveQuiz`，透過 `sessionStorage` 自動保存非機密登入狀態與進行中的 90 分鐘模考進度（含剩餘時間校正、已選答案、標記題目），頁面意外重整可無縫恢復，並嚴格確保身分證字號與 token 絕不寫入 storage。
    * 新增桌面版答題鍵盤快捷鍵（`1-4` / `A-D` 選答、`←` / `→` 切換題目、`Enter` 確認或下一題、`F` 標記題目）與底部提示列。
* **【驗證結果】**：
  * `node --test tests/*.test.js` **43/43 測試全數通過**；`python -m unittest tests.test_question_identity` **4/4 測試全數通過**。

### 📌 2026-09-07 —— 初級與中級 AI 應用規劃師最新試題更新與詳解資訊強化

* **【試題擴增】**：
  * **初級 AI 應用規劃師**：納入「115年第三次」第一科（人工智慧基礎概論）與第二科（生成式AI應用與規劃）官方公告試題各 50 題，題庫由 530 題提升至 **630 題**。
  * **中級 AI 應用規劃師**：納入「115年第一次」第一科（人工智慧技術應用與規劃）、第二科（大數據處理分析與應用）與第三科（機器學習技術與應用）官方公告試題各 50 題，題庫由 298 題提升至 **448 題**。
* **【圖表與程式碼精確轉錄】**：針對中級 115-1 考題中原為圖片的內容進行全面結構化轉錄：
  * 公式：吉尼不純度計算公式（$G = 1 - \sum p_i^2$）、Z 檢定統計量公式（$Z = \frac{\bar{x} - \mu_0}{\sigma / \sqrt{n}}$）。
  * 表格：Apriori 8 筆交易紀錄表、推薦系統導入前後成效指標對照表（AUC、CTR、訂單金額、推論延遲與成本）。
  * 圖形：ROC 曲線判定圖（真陽率 TPR vs 假陽率 FPR，標示四條候選線條特性與震盪曲線辨析）、CIFAR-10 CNN 訓練過程曲線圖（Train/Val Accuracy 於 Epoch 6 的過擬合表現）。
  * 程式碼：Python 預設參數可變物件陷阱、KNN 分類虛擬碼、司機每日營收描述性統計、Iris 羅吉斯迴歸（還原第 49 題原為圖片的 A/B/C/D 四個選項程式碼）、混淆矩陣與分類報告、CIFAR-10 深度卷積神經網路四區塊結構、ResNet50 遷移學習特徵萃取微調、Iris LDA 降維與資料洩漏（Data Leakage）、以及 PyTorch 梯度裁剪（`clip_grad_norm_`）插入位置。
* **【試題解析資訊強化】**：
  * 新增 `ai_junior_115_3_explanations.py` 與 `ai_mid_115_1_explanations.py`，為 250 道新增試題注入結構化解析（包含【核心考點】、【正確答案解析/說明】、【選項辨析/分析】及程式碼說明），大幅提升作答時對觀念與細節的理解。
* **【版本與契約同步】**：
  * 初級來源版本更新為 `official-through-2026-09-06`，中級更新為 `official-through-2026-06-15`。
  * `exam/config.js` 模組題數同步更新為 630 題與 448 題。
  * `tests/question-bank-smoke.test.js` 基線斷言同步更新。
* **【驗證與可重現建置】**：
  * `node --test tests/*.test.js` 32/32 測試通過；`python -m unittest tests.test_question_identity` 4/4 測試通過。
  * 題庫連續建置兩次，`exam/ai_questions.json` 與 `exam/ai_mid_questions.json` 之 SHA-256 完全吻合，確認建置結果 100% 確定且可重現。
* **【GitHub 與 GitHub Pages 發佈】**：
  * 本地完成 commit `382565d`（新增 19 個檔案，題庫與解析全數納入版本控制）。
  * 透過 subtree tree-commit 以快轉方式推送至 `github/main`（Commit: `08da4cc`），靜態測驗網站（https://ta-lang.github.io/iPAS_Test/）正式完成部署與線上發佈。

### 📌 2026-08-20 —— 未完成工作追蹤與交接邊界

* **【目前分支】**：Phase 3 修改位於 `codex/phase3-account-sync-foundation`，基準 commit 為 `bec593b`；目前工作樹仍有未提交變更，尚未推送 GitHub 或 GitHub Pages。
* **【後端同步未完成】**：現有 Google Apps Script 目前只能確認回傳證照啟用設定，尚未提供正式的 `user_id`、短效 session、同步 push/pull、session refresh/revoke、登出及帳戶刪除契約。
* **【前端驗收未完成】**：已完成 IndexedDB v5、帳戶分區、outbox、登入／同步狀態 UI 與 API adapter，但尚未在一般瀏覽器以實際帳戶驗證資料搬移、不同帳戶隔離、IndexedDB v5 與完整考試／練習流程。
* **【跨裝置驗收未完成】**：尚未建立同帳戶雙裝置、不同帳戶同瀏覽器、離線重送、明確拒絕、未回覆操作保留及 session 到期的整合測試環境。
* **【Note／Voice／NotebookLM 未完成】**：Note 內容模型、Voice 播放進度與 Note.Voice 整合，以及 NotebookLM MCP 的實際登入、測試 notebook、來源同步與能力驗證尚未開始；正式網站不得依賴 NotebookLM 在線可用性。
* **【目前驗證】**：JavaScript 32/32、Python 4/4 通過；程式語法、UTF-8、差異檢查及本機 HTTP 靜態資產檢查通過。瀏覽器實際點擊仍受 Windows 沙箱無法存取使用者 AppData 限制。
* **【下一步順序】**：先依 `docs/account_sync_api_contract.md` 補齊並部署後端；再以一般瀏覽器完成單帳戶／雙裝置及不同帳戶隔離驗收；確認通過後才 commit、推送來源 repo 與更新 GitHub Pages；最後進入 Note、Note.Voice 與 NotebookLM MCP 工作線。

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

### 📌 2026-08-20 —— Phase 2 題庫永久識別與安全搬移

* **【永久識別碼】**：新增 `question_identity.py`，三支解析器統一產生 `question_uid`、`display_num`、`source_id`、`source_version` 與 `content_hash`；題目文字或解析修訂只改變內容雜湊，不改變永久題號。
* **【題庫同源】**：重新產生 163／530／298 題 JSON 與 JS wrapper；JSON 為 GitHub Pages canonical 題庫，wrapper 由同次建置自動產生並逐題驗證完全一致。
* **【可重現建置】**：三支解析器連續執行兩次，六份輸出檔案的 SHA-256 均保持一致，並拒絕任何重複 `question_uid`。
* **【真正按需載入】**：首頁只顯示設定中的題數，使用者選擇證照後才載入該套題庫；HTTP 優先讀 JSON，`file://` 才使用 JS wrapper 備援，並加入快速切換的競態保護。
* **【IndexedDB v4】**：錯題、題目統計與 SM-2 改以 `question_uid` 建立鍵值。舊紀錄能唯一比對者自動合併搬移；無法消歧義者保存至 `migrationQuarantine` 後提示使用者，不做猜測式合併。
* **【統計碰撞修正】**：審題儀表板改以 `question_uid` 彙整，顯示題號只使用 `display_num`，避免不同章節同題號互相覆蓋。
* **【離線更新】**：Service Worker app shell 升至 `ipas-exam-v3`；題庫不預載，選用後才進入 runtime cache。
* **【驗證結果】**：JavaScript 19/19、Python 4/4 測試通過；`exam/script.js` 語法正常，首頁、App Shell 與三套 JSON/JS 題庫共 12 個本機 HTTP 資產均回應 200。
* **【待人工驗收】**：仍需在一般瀏覽器以既有 IndexedDB 資料驗證自動搬移、隔離提示、三證照切換，以及完整考試／練習操作。

### 📌 2026-08-20 —— Phase 3 帳戶分區與同步前端基礎

* **【後端能力盤點】**：只讀確認現有 Google Apps Script `GET` 僅回傳三證照啟用設定；專案內沒有 Apps Script 後端來源，尚無可驗證的 `user_id`、session、同步、登出或增量拉取契約。
* **【安全降級】**：登入回應缺少不透明 `user_id`／短效 token 時，UI 明確顯示「本機模式」，不把身分證當資料鍵、不建立帳戶 outbox，也不宣稱跨裝置同步成功。
* **【帳戶核心】**：新增 `exam/account-core.js`，涵蓋帳戶能力解析、身分證主鍵防護、帳戶／證照／永久題號複合鍵、題目事件狀態與敏感 payload 阻擋。
* **【API 邊界】**：新增 `exam/account-api.js`，集中登入與同步 POST、HTTPS、逾時及逐筆確認；只有 `accepted_operation_ids` 會移除，只有 `rejected_operation_ids` 會標記衝突，未回覆操作留在本機待重送。
* **【IndexedDB v5】**：新增 `userQuestionState`、`syncOutbox`、`accountQuizAttempts`、`accountAttemptAnswers` 與 `courseProgress`，正式帳戶模式依 `userId + certId` 分區。
* **【帳戶狀態】**：答題、錯題／SM-2、標記、測驗紀錄與 Note 開啟進度會以原子交易寫入帳戶快取與 outbox；同帳戶重新開題可恢復標記，不同帳戶鍵值完全分離。
* **【同步狀態 UI】**：頁首新增未登入、本機模式、帳戶已驗證、待同步、同步中、衝突與 session 到期狀態，以及登出入口；Service Worker 升至 `ipas-exam-v4`。
* **【契約文件】**：新增 `docs/account_sync_api_contract.md`，定義登入、短效 session、增量同步、冪等操作、逐筆確認、衝突及後端待辦。
* **【未完成邊界】**：尚未建立後端 pull／merge、session refresh/revoke 與雙裝置測試環境，因此 Phase 3 仍為進行中，不得宣稱跨裝置完成。

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

### 📌 2026-10-23 —— 中級 AI 應用規劃師完整考科上架：L21/L22/L23 官方學習指引考點筆記 (11份) + 實戰題庫擴充 (566 題)

* **【產出 11 份官方學習指引核心考點筆記】**：
  * 深度提煉官方學習指引（科目一、科目二、科目三）、勘誤表（1150410）、評鑑內容規範（11506 版）與歷屆公告試題。
  * 於 `exam/notes/ai_mid/` 下建立完整 11 個評鑑主題的精準考點講義：
    1. `L21_人工智慧技術應用與規劃/L211_AI相關技術應用.md`（NLP、CV 任務分級、GenAI、Multimodal、TF-IDF 勘誤算式、AOI 回饋）
    2. `L21_人工智慧技術應用與規劃/L212_AI導入評估規劃.md`（PoC/PoV、SMART、PDPA 事前告知 6 大要件勘誤、EU AI Act 四級風險、負責任 AI 六大原則）
    3. `L21_人工智慧技術應用與規劃/L213_AI技術應用與系統部署.md`（特徵工程、過擬合/欠擬合、Edge AI、Docker 容器化、MLOps CI/CD/CT、Data/Concept Drift）
    4. `L22_大數據處理分析與應用/L221_機率統計基礎.md`（偏度均值中位數大小關係、IQR 與箱形圖離群值、經驗法則 68-95-99.7、柴比雪夫、CLT、型 I/型 II 錯誤、p-value 決策、ANOVA 與卡方檢定選型、計算題全拆解）
    5. `L22_大數據處理分析與應用/L222_大數據處理技術.md`（大數據 5V、半結構化 JSON/XML、RDBMS vs NoSQL、HDFS 3 副本容錯、Kafka 分區高吞吐、Lakehouse、批次 vs 串流）
    6. `L22_大數據處理分析與應用/L223_大數據分析方法與工具.md`（PCA 最大化變異數、Min-Max/Z-Score、關聯規則 Support/Confidence/Lift 計算、SMOTE 線性插值、混淆矩陣 Accuracy/Precision/Recall 勘誤公式/F1/ROC-AUC）
    7. `L22_大數據處理分析與應用/L224_大數據在人工智慧之應用.md`（維度災難、資料平行 vs 模型平行、預測性維護、MinHash+LSH 去重、隱私增強 PETs：差分隱私/聯邦學習/同態加密/K-匿名性）
    8. `L23_機器學習技術與應用/L231_機器學習基礎數學.md`（條件機率與貝氏定理、MLE vs MAP、特徵向量幾何意義、SVD、`[⚠ 勘誤]` NMF 元素逐項非負 $X,W,H \ge 0$、Mini-batch SGD、Adam 優化器）
    9. `L23_機器學習技術與應用/L232_機器學習與深度學習.md`（四大學習範式、`[⚠ 勘誤]` 邏輯迴歸對數勝算線性關係 Linearity in Log-Odds、ID3/C4.5/CART、Bagging降方差 vs Boosting降偏差、SVM最大間距與支援向量、`[⚠ 勘誤]` 感知器加權求和 $Z = \sum w_i x_i + b$、ReLU與Leaky ReLU、LSTM三門一態）
    10. `L23_機器學習技術與應用/L233_機器學習建模與參數調校.md`（特徵選擇三大法Filter/Wrapper/Embedded、NFL沒有白吃午餐定理、模型參數 vs 超參數、Stratified K-fold分層交叉驗證、MAE vs RMSE、決定係數 $R^2$、偏差-方差權衡、網格/隨機/貝氏優化、Early Stopping）
    11. `L23_機器學習技術與應用/L234_機器學習治理.md`（五大模型安全威脅：資料投毒、對抗樣本與對抗訓練、模型反推、成員推論、模型竊取；偏見三大來源：歷史/表徵/測量；三大公平性指標：人口統計均等、機會均等、均等賠率；去偏見前中後三階段介入）
  * 每份筆記均包含具體定義、比較表格、計算拆解、`[⚠ 勘誤]`、`[🎯 常考]` 及文末「10 句精華考點速記」。
* **【串接 Web 課程筆記選單】**：
  * 更新 `exam/config.js`，將 11 份全新考點講義共 34 個評鑑內容節點（L21101~L23402）完整掛載至中級課程筆記選單，前端直接可調閱研讀。
* **【官方學習指引擴充題庫 118 題】**：
  * 針對 L211~L213 (30題)、L221~L224 (44題)、L231~L234 (44題) 設計共 118 道高鑑別度實戰精選單選題。
  * 題目來源儲存於 `AI應用規劃師/中級AI應用規劃師/ai_mid_guide_supplement_questions.json`。
  * 更新 `parse_ai_mid_questions.py` 自動載入擴充題來源，並重新編譯產生題庫。
  * 中級題庫總數由 **448 題擴充至 566 題**。
* **【題庫穩定性與測試驗證】**：
  * 原有 448 題之 `question_uid` 經嚴格比對 **100% 完全相同**，使用者歷史答題、錯題本與 IRT 分析無任何回歸或錯位。
  * 更新 `tests/question-bank-smoke.test.js`、`AGENTS.md` 與 `README.md` 中的中級題數為 566 題。
  * 通過全套測試：`node --test tests/*.test.js`（32 項全數 pass）、`python -m unittest tests.test_question_identity`（4 項全數 pass）。

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


