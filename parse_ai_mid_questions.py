import os
import re
import json
import pypdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Workspace directories
workspace_dir = r"c:\Drive224\Projects\iPAS 證照"
pdf_dir = os.path.join(workspace_dir, "AI應用規劃師", "中級AI應用規劃師")
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)
output_json_path = os.path.join(output_dir, "ai_mid_questions.json")
output_js_path = os.path.join(output_dir, "ai_mid_questions.js")

def to_half_width(char):
    mapping = {'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D'}
    return mapping.get(char.upper(), char.upper())

def clean_official_text(text):
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        l = line.strip()
        if "能力鑑定" in l or "第一科：" in l or "第二科：" in l or "第三科：" in l or "考試日期" in l or "一、選擇題" in l or "答案 題目" in l:
            continue
        if re.match(r'^第\s*\d+\s*頁，共\s*\d+\s*頁$', l):
            continue
        cleaned.append(line)
    return "\n".join(cleaned)

def parse_official_exams():
    official_files = [
        ("114年第二次", "人工智慧技術應用與規劃", "114年第二梯次中級AI應用規劃師第一科人工智慧技術應用與規劃(當次試題公告114.11.20).pdf"),
        ("114年第二次", "大數據處理分析與應用", "114年第二梯次中級AI應用規劃師第二科大數據處理分析與應用(當次試題公告114.11.20).pdf"),
        ("114年第二次", "機器學習技術與應用", "114年第二梯次中級AI應用規劃師第三科機器學習技術與應用(當次試題公告114.11.20).pdf")
    ]
    
    parsed_questions = []
    
    for term, subject, filename in official_files:
        pdf_path = os.path.join(pdf_dir, filename)
        if not os.path.exists(pdf_path):
            # Try official exam folder
            pdf_path = os.path.join(pdf_dir, "官方教材及考試簡章", filename.replace(".11.20).pdf", "_20251226000616.pdf" if "第一科" in filename else ("_20251226000634.pdf" if "第二科" in filename else "_20251226000650.pdf")))
            if not os.path.exists(pdf_path):
                print(f"File not found: {filename}")
                continue
            
        print(f"Parsing official exam: {filename}")
        reader = pypdf.PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += clean_official_text(page.extract_text()) + "\n"
            
        # Split by question headers like: "B 1.  " or "A 41.  "
        pattern = re.compile(r'(?:^|\n)\s*([A-DＡ-Ｄ])\s+(\d+)\.\s*')
        matches = list(pattern.finditer(full_text))
        
        for i in range(len(matches)):
            match = matches[i]
            ans = to_half_width(match.group(1))
            num = int(match.group(2))
            
            start_idx = match.end()
            end_idx = matches[i+1].start() if i + 1 < len(matches) else len(full_text)
            block = full_text[start_idx:end_idx].strip()
            
            # Find options (A), (B), (C), (D) or (A) ...
            opt_pattern = re.compile(r'[\(（]([A-D])[\)）]\s*(.*?)\s*(?=[\(（][A-D][\)）]|$)', re.DOTALL)
            opts_found = opt_pattern.findall(block)
            
            stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-D][\)）])', block, re.DOTALL)
            stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()
            
            options = ["", "", "", ""]
            for opt_letter, opt_text in opts_found:
                idx = ord(opt_letter.upper()) - ord('A')
                options[idx] = opt_text.replace('\n', ' ').strip()
                
            parsed_questions.append({
                "subject": f"中級：{subject}",
                "chapter": f"{term}歷屆考題",
                "num": num,
                "question": stem,
                "options": options,
                "answer": ans,
                "ans_text": f"標準答案：({ans})",
                "explanation": "此題為 114 年第二次中級能力鑑定考試公告試題。"
            })
            
    return parsed_questions

def parse_sample_exam():
    filename = "iPAS+AI應用規劃師中級能力鑑定-考試樣題(114年9月版)+v2.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    if not os.path.exists(pdf_path):
        print(f"File not found: {filename}")
        return []
        
    print(f"Parsing sample exam: {filename}")
    reader = pypdf.PdfReader(pdf_path)
    parsed_questions = []
    
    # We will process page by page and detect which subject it is
    current_subject = "人工智慧技術應用與規劃"
    
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text()
        
        # Detect subject switch
        if "科目一" in text:
            current_subject = "人工智慧技術應用與規劃"
        elif "科目二" in text:
            current_subject = "大數據處理分析與應用"
        elif "科目三" in text:
            current_subject = "機器學習技術與應用"
            
        # Clean text
        lines = text.splitlines()
        cleaned = []
        for line in lines:
            l = line.strip()
            if "能力鑑定-考試樣題" in l or "非正式考題" in l or "114.09" in l or "◆ 科目" in l or "題號 答案 題目" in l:
                continue
            if l.isdigit() and len(l) < 3: # page numbers
                continue
            cleaned.append(line)
        cleaned_text = "\n".join(cleaned)
        
        # Parse questions on this page
        # Headers like: "1 A\n" or "6 Ｄ\n"
        pattern = re.compile(r'(?:^|\n)\s*(\d+)\s+([A-DＡ-Ｄ])\s*\n')
        matches = list(pattern.finditer(cleaned_text))
        
        for i in range(len(matches)):
            match = matches[i]
            num = int(match.group(1))
            ans = to_half_width(match.group(2))
            
            start_idx = match.end()
            end_idx = matches[i+1].start() if i + 1 < len(matches) else len(cleaned_text)
            block = cleaned_text[start_idx:end_idx].strip()
            
            opt_pattern = re.compile(r'[\(（]([A-D])[\)）]\s*(.*?)\s*(?=[\(（][A-D][\)）]|$)', re.DOTALL)
            opts_found = opt_pattern.findall(block)
            
            stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-D][\)）])', block, re.DOTALL)
            stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()
            
            options = ["", "", "", ""]
            for opt_letter, opt_text in opts_found:
                idx = ord(opt_letter.upper()) - ord('A')
                options[idx] = opt_text.replace('\n', ' ').strip()
                
            parsed_questions.append({
                "subject": f"中級：{current_subject}",
                "chapter": "官方樣題範例",
                "num": num,
                "question": stem,
                "options": options,
                "answer": ans,
                "ans_text": f"標準答案：({ans})",
                "explanation": "此題為官方公佈之中級能力鑑定考試樣題。"
            })
            
    return parsed_questions

def parse_guide_questions():
    guide_config = [
        {
            "file": "AI應用規劃師(中級)-學習指引-科目1人工智慧技術應用規劃.pdf",
            "subject": "中級：人工智慧技術應用與規劃",
            "chapters": [
                {"name": "第三章 AI 相關技術應用", "a_pages": [92, 93]},
                {"name": "第四章 AI 導入評估規劃", "a_pages": [139, 140]},
                {"name": "第五章 AI 技術應用與系統部署", "a_pages": [165, 166]}
            ]
        },
        {
            "file": "AI應用規劃師(中級)-學習指引-科目2大數據處理分析與應用.pdf",
            "subject": "中級：大數據處理分析與應用",
            "chapters": [
                {"name": "第三章 機率統計基礎", "a_pages": [54]},
                {"name": "第四章 大數據處理技術", "a_pages": [86, 87]},
                {"name": "第五章 大數據分析方法與工具", "a_pages": [136, 137]},
                {"name": "第六章 大數據在人工智慧之應用", "a_pages": [179, 180]}
            ]
        },
        {
            "file": "AI應用規劃師(中級)-學習指引-科目3機器學習技術與應用.pdf",
            "subject": "中級：機器學習技術與應用",
            "chapters": [
                {"name": "第三章 機器學習基礎數學", "a_pages": [36, 37]},
                {"name": "第四章 機器學習與深度學習", "a_pages": [132, 133]},
                {"name": "第五章 機器學習建模與參數調校", "a_pages": [189, 190]},
                {"name": "第六章 機器學習治理", "a_pages": [220, 221]}
            ]
        }
    ]
    
    parsed_qs = []
    
    for cfg in guide_config:
        filename = cfg["file"]
        path = os.path.join(pdf_dir, filename)
        if not os.path.exists(path):
            path = os.path.join(pdf_dir, "官方教材及考試簡章", filename.replace(".pdf", "_20251222101833.pdf" if "科目1" in filename else ("_20251222101850.pdf" if "科目2" in filename else "_20251222101907.pdf")))
            if not os.path.exists(path):
                print(f"File not found: {filename}")
                continue
                
        r = pypdf.PdfReader(path)
        
        for ch in cfg["chapters"]:
            ch_name = ch["name"]
            
            # Read all answers first
            a_text = ""
            for p in range(ch["a_pages"][0], ch["a_pages"][-1] + 1):
                a_text += r.pages[p].extract_text().replace('\u3000', ' ').replace('\xa0', ' ') + "\n"
                
            # Find answers
            answers = {}
            ans_pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s*Ans[\(（\s]*([A-D])[）\)\s]*(.*?)(?=\n\s*\d+\.\s*Ans|$)', re.DOTALL)
            ans_matches = ans_pattern.findall(a_text)
            for num_str, ans_letter, ans_detail in ans_matches:
                num = int(num_str)
                exp = ""
                if "解析" in ans_detail:
                    parts = ans_detail.split("解析", 1)
                    ans_text = parts[0].strip("：").strip()
                    exp = parts[1].strip("：").strip()
                else:
                    ans_text = ans_detail.strip()
                answers[num] = {
                    "answer": ans_letter.upper(),
                    "ans_text": ans_text,
                    "explanation": exp
                }
                
            # Read preceding pages for questions
            q_text = ""
            start_q_page = max(0, ch["a_pages"][0] - 3)
            end_q_page = ch["a_pages"][0] - 1
            for p in range(start_q_page, end_q_page + 1):
                q_text += r.pages[p].extract_text().replace('\u3000', ' ').replace('\xa0', ' ') + "\n"
                
            # Split questions
            q_blocks = re.split(r'\n\s*(?=\d+\.\s)', '\n' + q_text)
            for block in q_blocks:
                block = block.strip()
                if not block:
                    continue
                match = re.match(r'^(\d+)\.\s*(.*?)\s*(?=[\(（][A-D][\)）]|$)', block, re.DOTALL)
                if not match:
                    continue
                num = int(match.group(1))
                stem = match.group(2).replace('\n', ' ').strip()
                
                # Extract options
                opt_pattern = re.compile(r'[\(（]([A-D])[\)）]\s*(.*?)\s*(?=[\(（][A-D][\)）]|$)', re.DOTALL)
                opts_found = opt_pattern.findall(block)
                
                # Strict check: must have exactly 4 options to be a valid question
                if len(opts_found) < 4:
                    continue
                
                options = ["", "", "", ""]
                for opt_letter, opt_text in opts_found:
                    idx = ord(opt_letter.upper()) - ord('A')
                    options[idx] = opt_text.replace('\n', ' ').strip()
                    
                if num in answers:
                    parsed_qs.append({
                        "subject": cfg["subject"],
                        "chapter": ch_name,
                        "num": num,
                        "question": stem,
                        "options": options,
                        "answer": answers[num]["answer"],
                        "ans_text": f"標準答案：({answers[num]['answer']}) {answers[num]['ans_text']}",
                        "explanation": answers[num]["explanation"]
                    })
                    
    return parsed_qs

def main():
    all_qs = []
    
    # 1. Parse official exams
    official_qs = parse_official_exams()
    all_qs.extend(official_qs)
    print(f"Parsed {len(official_qs)} official exam questions.")
    
    # 2. Parse sample exam
    sample_qs = parse_sample_exam()
    all_qs.extend(sample_qs)
    print(f"Parsed {len(sample_qs)} sample exam questions.")
    
    # 3. Parse learning guide questions
    guide_qs = parse_guide_questions()
    all_qs.extend(guide_qs)
    print(f"Parsed {len(guide_qs)} learning guide questions.")
    
    # Post-processing corrections
    for q in all_qs:
        # Clean up general trailing garbage in options
        for i in range(len(q["options"])):
            q["options"][i] = q["options"][i].replace("《以下空白》", "").strip()
            
        # Fix Question 45 (Subject 3, 114年第二次歷屆考題)
        if q["subject"] == "中級：機器學習技術與應用" and q["chapter"] == "114年第二次歷屆考題" and q["num"] == 45:
            q["options"] = [
                "import torch\nimport torchvision.models as models\n\nmodel = models.vgg16(pretrained=True)\nfor param in model.parameters():\n    param.requires_grad = False\nmodel.classifier[6] = torch.nn.Linear(4096, 10)",
                "import torch\nimport torchvision.models as models\n\nmodel = models.vgg16(pretrained=True)\nfor param in model.features.parameters():\n    param.requires_grad = False\nmodel.classifier[6] = torch.nn.Linear(4096, 10)",
                "import torch\nimport torchvision.models as models\n\nmodel = models.vgg16(pretrained=True)\nfor param in model.classifier.parameters():\n    param.requires_grad = False\nmodel.classifier[6] = torch.nn.Linear(4096, 10)",
                "import torch\nimport torchvision.models as models\n\nmodel = models.vgg16(pretrained=True)\nmodel.requires_grad = False\nmodel.classifier[6] = torch.nn.Linear(4096, 10)"
            ]
            
        # Fix Question 47 (Subject 3, 114年第二次歷屆考題) option D trailing Titanic text
        if q["subject"] == "中級：機器學習技術與應用" and q["chapter"] == "114年第二次歷屆考題" and q["num"] == 47:
            if "使用鐵達尼號" in q["options"][3]:
                q["options"][3] = q["options"][3].split("使用鐵達尼號")[0].strip()
                
        # Prepend context to group questions (Digits dataset)
        digits_context = (
            "【背景說明】在郵遞區號自動辨識的研究中，研究人員收集了一份手寫數字影像資料集，"
            "每一張影像為 8×8 的灰階圖片，共包含多個手寫數字樣本。這份資料集來自 UCI Machine Learning Repository，"
            "常被用於數字辨識與機器學習方法的教學與實驗。在過程中，研究人員發現資料中可能存在雜訊，"
            "例如筆跡模糊或影像中附加的干擾點，這會影響後續分類模型的效能。因此，他們希望透過資料降噪的方法，"
            "提升後續分類的準確度。同時，他們也想透過 KNN (K-Nearest Neighbors) 搭配交叉驗證來評估模型表現，"
            "確保模型在不同資料切割下都能有穩定的預測能力。\n\n"
        )
        if q["subject"] == "中級：機器學習技術與應用" and q["chapter"] == "114年第二次歷屆考題" and q["num"] in [46, 47]:
            if not q["question"].startswith("【背景說明】"):
                q["question"] = digits_context + q["question"]

        # Subject 2 (大數據處理分析與應用) Transcriptions:
        if q["subject"] == "中級：大數據處理分析與應用" and q["chapter"] == "114年第二次歷屆考題":
            if q["num"] == 3:
                q["question"] = "【背景說明：附圖為一個資料的分佈圖（密度分配圖）。該分佈具有以下特徵：分佈的峰值（Peak）約在 40 左右，分佈的尾部（Tail）向左延伸至 0 及 -20 左右，呈現顯著的左偏（向低值延伸）特徵。】\n\n" + q["question"]
            elif q["num"] == 40:
                q["question"] = (
                    "【背景說明：附圖虛擬碼（pseudocode）如下】\n"
                    "```\n"
                    "Input :\n"
                    "  - data_set : 包含 N 筆資料的資料集\n"
                    "  - model_training_function : 用來訓練模型的函式\n"
                    "  - model_evaluation_function : 用來評估模型的函式 (如計算誤差或準確率)\n"
                    "Output :\n"
                    "  - 平均評估指標 (如平均準確率或平均誤差)\n\n"
                    "Algorithm :\n"
                    "1. 初始化評估指標列表 metrics = []\n"
                    "2. 對 i = 1 到 N :\n"
                    "   a. 將第 i 筆資料作為測試集 test_data\n"
                    "   b. 將其餘 N-1 筆資料作為訓練集 train_data\n"
                    "   c. 使用 model_training_function 在 train_data 上訓練模型\n"
                    "   d. 使用訓練好的模型對 test_data 做預測，計算評估指標 metric_i\n"
                    "   e. 將 metric_i 加入 metrics\n"
                    "3. 計算 metrics 的平均值 mean_metric\n"
                    "4. 回傳 mean_metric\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 41:
                q["question"] = (
                    "【背景說明：附圖虛擬碼（pseudocode）如下】\n"
                    "```\n"
                    "Input :\n"
                    "  - data_points : N 筆資料，每筆資料有 D 個特徵\n"
                    "  - X : 要分成的群數\n"
                    "Output :\n"
                    "  - clusters : 每筆資料所屬的群編號\n"
                    "  - centroids : 每個群的中心點\n\n"
                    "Algorithm :\n"
                    "1. 隨機選擇 X 個資料點作為初始中心\n"
                    "2. 重複以下步驟直到收斂：\n"
                    "   a. 分群：\n"
                    "      對每個資料點，計算它到每個中心的距離\n"
                    "      將資料點指派給距離最近的中心\n"
                    "   b. 更新中心：\n"
                    "      對每個群：\n"
                    "         計算該群中所有資料點的平均值\n"
                    "         將群中心更新為這個平均值\n"
                    "3. 當群中心不再變動時，停止\n\n"
                    "回傳每筆資料的群編號 clusters，以及最後的群中心 centroids\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 42:
                q["question"] = (
                    "【背景說明：附圖程式碼如下】\n"
                    "```python\n"
                    "import numpy as np\n"
                    "from scipy.stats import poisson\n"
                    "lambda_poisson = 5\n"
                    "print(poisson.pmf(5, lambda_poisson))\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] in [43, 44, 45, 46, 47]:
                q["question"] = (
                    "【背景說明：一間遊戲市場研究公司正在分析全球電子遊戲銷售情況，並準備建立一份「熱銷遊戲銷售報告」。"
                    "分析師取得了一份名為 vgsales.csv 的資料集，內容包含了全球銷量超過 10 萬份的電子遊戲清單。資料集的欄位說明如下：\n"
                    "- Name：遊戲名稱\n"
                    "- Platform：遊戲平台（如 PS4、X360、Wii 等）\n"
                    "- Year：發售年份\n"
                    "- Genre：遊戲類型（如 Action、Sports、Role-Playing 等）\n"
                    "- Publisher：發行商名稱\n"
                    "- NA_Sales / EU_Sales / JP_Sales / Other_Sales：各地區銷售量（單位：百萬份）\n"
                    "- Global_Sales：全球總銷售量（單位：百萬份）\n\n"
                    "載入與預覽資料的 Python 程式碼如下：\n"
                    "```python\n"
                    "import pandas as pd\n"
                    "import matplotlib.pyplot as plt\n"
                    "import seaborn as sns\n\n"
                    "data = pd.read_csv(\"vgsales.csv\")\n"
                    "data.head()\n"
                    "```\n"
                    "】\n\n" + q["question"]
                )
            elif q["num"] == 48:
                q["question"] = (
                    "【背景說明：某廣告行銷數據集 df 預覽與敘述統計分析結果如下】\n"
                    "```python\n"
                    ">>> df.head()\n"
                    "   youtube  facebook  newspaper  sales\n"
                    "0   276.12     45.36      83.04  26.52\n"
                    "1    53.40       NaN      54.12  12.48\n"
                    "2    20.64     55.08      83.16  11.16\n"
                    "3   181.80     49.56      70.20  22.20\n"
                    "4   216.96     12.96      70.08  15.48\n\n"
                    ">>> df.describe()\n"
                    "          youtube    facebook   newspaper       sales\n"
                    "count  200.000000  199.000000  200.000000  200.000000\n"
                    "mean   176.451000   27.820101   36.664800   16.827000\n"
                    "std    103.025084   17.808410   26.134345    6.260948\n"
                    "min      0.840000    0.000000    0.360000    1.920000\n"
                    "25%     89.250000   11.940000   15.300000   12.450000\n"
                    "50%    179.700000   27.000000   30.900000   15.480000\n"
                    "75%    262.590000   43.680000   54.120000   20.880000\n"
                    "max    355.680000   59.520000  136.800000   32.400000\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 49:
                q["question"] = (
                    "【背景說明：計算各欄位遺漏值（df.isnull().sum() 或 df.isna().sum()）之輸出結果如下】\n"
                    "```\n"
                    "youtube      0\n"
                    "facebook     1\n"
                    "newspaper    0\n"
                    "sales        0\n"
                    "dtype: int64\n"
                    "```\n\n"
                    "參考上述執行結果，下列何者正確？"
                )
            elif q["num"] == 50:
                q["question"] = (
                    "【背景說明：執行迴歸模型訓練之程式碼與 OLS 輸出結果如下】\n"
                    "```python\n"
                    "from sklearn.linear_model import LinearRegression\n"
                    "import statsmodels.api as sm\n"
                    "X = df[['youtube', 'facebook', 'newspaper']]\n"
                    "y = df['sales']\n"
                    "reg =  [空格1]\n"
                    "print(reg.coef_)\n"
                    "X2 = sm.add_constant(X)\n"
                    "model_sm =  [空格2]\n"
                    "print(model_sm.summary())\n"
                    "```\n\n"
                    "```\n"
                    "OLS Regression Results\n"
                    "==============================================================================\n"
                    "Dep. Variable:                  sales   R-squared:                       0.898\n"
                    "Model:                            OLS   Adj. R-squared:                  0.896\n"
                    "Method:                 Least Squares   F-statistic:                     573.0\n"
                    "Date:                Sat, 20 Sep 2025   Prob (F-statistic):          1.03e-96\n"
                    "Time:                        19:37:30   Log-Likelihood:                -422.21\n"
                    "No. Observations:                 200   AIC:                             852.4\n"
                    "Df Residuals:                     196   BIC:                             865.6\n"
                    "Df Model:                           3\n"
                    "Covariance Type:             nonrobust\n"
                    "==============================================================================\n"
                    "                 coef    std err          t      P>|t|      [0.025      0.975]\n"
                    "------------------------------------------------------------------------------\n"
                    "const          3.5561      0.373      9.537      0.000       2.821       4.291\n"
                    "youtube        0.0455      0.001     32.702      0.000       0.043       0.048\n"
                    "facebook       0.1891      0.009     21.960      0.000       0.172       0.206\n"
                    "newspaper     -0.0006      0.006     -0.108      0.914      -0.012       0.011\n"
                    "==============================================================================\n"
                    "```\n\n"
                    "參考上述執行結果，下列何者正確？"
                )

        # Subject 3 (機器學習技術與應用) Transcriptions:
        if q["subject"] == "中級：機器學習技術與應用" and q["chapter"] == "114年第二次歷屆考題":
            if q["num"] == 38:
                q["question"] = (
                    "【背景說明：評估指標程式碼如下】\n"
                    "```python\n"
                    "def metric(y_true, y_pred):\n"
                    "    return sum((y_true - y_pred) ** 2) / len(y_true)\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 39:
                q["question"] = (
                    "【背景說明：正則化實作程式碼如下】\n"
                    "```python\n"
                    "def forward(x, p, training=True):\n"
                    "    if training:\n"
                    "        mask = np.random.binomial(1, p, size=x.shape)\n"
                    "        return x * mask / p\n"
                    "    else:\n"
                    "        return x\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 40:
                q["question"] = (
                    "【背景說明：NumPy 運算程式碼如下】\n"
                    "```python\n"
                    "import numpy as np\n\n"
                    "v1 = np.array([1, 2, 3])\n"
                    "v2 = np.array([4, 5, 6])\n"
                    "A = np.array([[1, 2], [3, 4]])\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 41:
                q["question"] = (
                    "【背景說明：Monte Carlo 模擬程式碼與事件定義如下】\n"
                    "```python\n"
                    "import numpy as np\n\n"
                    "np.random.seed(123)\n"
                    "n = 100000\n"
                    "dice_rolls = np.random.randint(1, 7, size=n)\n\n"
                    "A = (dice_rolls % 2 == 0)\n"
                    "B = (dice_rolls > 3)\n"
                    "A_and_B = A & B\n"
                    "```\n"
                    "- 事件 A：擲出偶數\n"
                    "- 事件 B：擲出大於 3\n\n" + q["question"]
                )
            elif q["num"] in [42, 43, 44]:
                q["question"] = (
                    "【背景說明：載入預訓練的 VGG16 模型並輸出其完整層級結構與參數統計摘要如下】\n"
                    "```python\n"
                    "from torchsummary import summary\n"
                    "from torchvision import models\n"
                    "model = models.vgg16(weights='IMAGENET1K_V1')\n"
                    "summary(model, (3, 150, 150))\n"
                    "```\n\n"
                    "輸出摘要表：\n"
                    "```\n"
                    "Layer (type)                 Output Shape              Param #\n"
                    "================================================================\n"
                    "Conv2d-1                     [-1, 64, 150, 150]        1,792\n"
                    "ReLU-2                       [-1, 64, 150, 150]        0\n"
                    "Conv2d-3                     [-1, 64, 150, 150]        36,928\n"
                    "ReLU-4                       [-1, 64, 150, 150]        0\n"
                    "MaxPool2d-5                  [-1, 64, 75, 75]          0\n"
                    "Conv2d-6                     [-1, 128, 75, 75]         73,856\n"
                    "ReLU-7                       [-1, 128, 75, 75]         0\n"
                    "Conv2d-8                     [-1, 128, 75, 75]         147,584\n"
                    "ReLU-9                       [-1, 128, 75, 75]         0\n"
                    "MaxPool2d-10                 [-1, 128, 37, 37]         0\n"
                    "Conv2d-11                    [-1, 256, 37, 37]         295,168\n"
                    "ReLU-12                      [-1, 256, 37, 37]         0\n"
                    "Conv2d-13                    [-1, 256, 37, 37]         590,080\n"
                    "ReLU-14                      [-1, 256, 37, 37]         0\n"
                    "Conv2d-15                    [-1, 256, 37, 37]         590,080\n"
                    "ReLU-16                      [-1, 256, 37, 37]         0\n"
                    "MaxPool2d-17                 [-1, 256, 18, 18]         0\n"
                    "Conv2d-18                    [-1, 512, 18, 18]         1,180,160\n"
                    "ReLU-19                      [-1, 512, 18, 18]         0\n"
                    "Conv2d-20                    [-1, 512, 18, 18]         2,359,808\n"
                    "ReLU-21                      [-1, 512, 18, 18]         0\n"
                    "Conv2d-22                    [-1, 512, 18, 18]         2,359,808\n"
                    "ReLU-23                      [-1, 512, 18, 18]         0\n"
                    "MaxPool2d-24                 [-1, 512, 9, 9]           0\n"
                    "Conv2d-25                    [-1, 512, 9, 9]           2,359,808\n"
                    "ReLU-26                      [-1, 512, 9, 9]           0\n"
                    "Conv2d-27                    [-1, 512, 9, 9]           2,359,808\n"
                    "ReLU-28                      [-1, 512, 9, 9]           0\n"
                    "Conv2d-29                    [-1, 512, 9, 9]           2,359,808\n"
                    "ReLU-30                      [-1, 512, 9, 9]           0\n"
                    "MaxPool2d-31                 [-1, 512, 4, 4]           0\n"
                    "AdaptiveAvgPool2d-32         [-1, 512, 7, 7]           0\n"
                    "Linear-33                    [-1, 4096]                102,764,544\n"
                    "ReLU-34                      [-1, 4096]                0\n"
                    "Dropout-35                   [-1, 4096]                0\n"
                    "Linear-36                    [-1, 4096]                16,781,312\n"
                    "ReLU-37                      [-1, 4096]                0\n"
                    "Dropout-38                   [-1, 4096]                0\n"
                    "Linear-39                    [-1, 1000]                4,097,000\n"
                    "================================================================\n"
                    "Total params: 138,357,544\n"
                    "Trainable params: 138,357,544\n"
                    "Non-trainable params: 0\n"
                    "----------------------------------------------------------------\n"
                    "Input size (MB): 0.26\n"
                    "```\n\n" + q["question"]
                )
            elif q["num"] == 48:
                q["question"] = (
                    "【背景說明：df_train 與 df_test 載入與預處理程式碼如下】\n"
                    "```python\n"
                    "# 載入鐵達尼號(Titanic)資料集\n"
                    "# dataset_train = df_train.values.astype('float32')\n"
                    "# dataset_test = df_test.values.astype('float32')\n"
                    "# X_train = dataset_train[:, 0:9], y_train = dataset_train[:, 9]\n"
                    "# X_test = dataset_test[:, 0:9], y_test = dataset_test[:, 9]\n\n"
                    "# 特徵處理程式碼：\n"
                    "X_train -= X_train.mean(axis=0)\n"
                    "X_train /= X_train.std(axis=0)\n"
                    "X_test -= X_test.mean(axis=0)\n"
                    "X_test /= X_test.std(axis=0)\n"
                    "```\n\n"
                    "參考上述程式碼，下列何者正確？"
                )
            elif q["num"] == 49:
                q["question"] = (
                    "【背景說明：Keras 多層感知機模型架構與編譯程式碼如下】\n"
                    "```python\n"
                    "model = Sequential()\n"
                    "model.add(Input(shape=(X_train.shape[1],)))\n"
                    "model.add(Dense(10, activation=\"relu\"))\n"
                    "model.add(Dense(10, activation=\"relu\"))\n"
                    "model.add(Dense(1, activation=\"sigmoid\"))\n"
                    "model.summary()\n"
                    "model.compile(loss=\"binary_crossentropy\", optimizer=\"adam\", metrics=[\"accuracy\"])\n"
                    "```\n\n"
                    "模型摘要輸出如下：\n"
                    "```\n"
                    "Model: \"sequential\"\n"
                    "_________________________________________________________________\n"
                    "Layer (type)                 Output Shape              Param #   \n"
                    "=================================================================\n"
                    "dense (Dense)                (None, 10)                [空格1]    \n"
                    "_________________________________________________________________\n"
                    "dense_1 (Dense)              (None, 10)                [空格2]    \n"
                    "_________________________________________________________________\n"
                    "dense_2 (Dense)              (None, 1)                 11        \n"
                    "=================================================================\n"
                    "```\n\n"
                    "參考上述執行結果，下列何者正確？"
                )
            elif q["num"] == 50:
                q["question"] = (
                    "【背景說明：模型擬合與繪製訓練曲線程式碼如下】\n"
                    "```python\n"
                    "history = model.fit(X_train, y_train, validation_split=0.2, epochs=100, batch_size=10)\n"
                    "loss, accuracy = model.evaluate(X_train, y_train, verbose=0)\n\n"
                    "import matplotlib.pyplot as plt\n"
                    "loss = history.history[\"loss\"]\n"
                    "epochs = range(1, len(loss)+1)\n"
                    "val_loss = history.history[\"val_loss\"]\n"
                    "plt.plot(epochs, loss, [空格1] , label=\"Training Loss\")\n"
                    "plt.plot(epochs, val_loss, [空格2] , label=\"Validation Loss\")\n"
                    "plt.title(\"Training and Validation Loss\")\n"
                    "plt.xlabel(\"Epochs\")\n"
                    "plt.ylabel(\"Loss\")\n"
                    "plt.legend()\n"
                    "plt.show()\n"
                    "```\n\n"
                    "參考上述執行結果，下列何者正確？"
                )

        # Subject 1 (人工智慧技術應用與規劃) Sample Exam Transcriptions:
        if q["subject"] == "中級：人工智慧技術應用與規劃" and q["chapter"] == "官方樣題範例" and q["num"] == 7:
            q["question"] = (
                "【背景說明：示意圖展示了電腦視覺辨識的四種核心技術示意圖：\n"
                "(a) 圖中只有一隻貓，並標記整體類別為「Cat」（圖像分類）\n"
                "(b) 圖中有一隻貓和一隻狗，且背景、貓與狗分別用不同色塊大面積著色，區分不同類別的語意像素（語義分割）\n"
                "(c) 圖中有一隻貓和一隻狗，並用兩個矩形邊界框（Bounding Box）分別框住並標記類別（物件偵測）\n"
                "(d) 圖中有多隻貓和多隻狗，不僅區分貓狗類別，更將每一隻獨立的動物個體用不同的色塊著色以區分個體（實例分割）】\n\n" + q["question"]
            )

    # Assign global unique IDs
    for idx, q in enumerate(all_qs):
        q["id"] = idx + 1
        
    print(f"Total parsed questions: {len(all_qs)}")
    
    # Write to JSON
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(all_qs, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote database to {output_json_path}")
    
    # Write to JS
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("const ipasAiMidQuestions = " + json.dumps(all_qs, ensure_ascii=False, indent=2) + ";\n")
    print(f"Successfully wrote database to {output_js_path}")

if __name__ == "__main__":
    main()
