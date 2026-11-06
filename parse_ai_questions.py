# -*- coding: utf-8 -*-
import os
import re
import json
import glob
import pypdf
from question_identity import enrich_questions
from ai_junior_115_3_explanations import JUNIOR_115_3_S1_EXPLANATIONS, JUNIOR_115_3_S2_EXPLANATIONS
from ai_junior_1029_mock_data import MOCK_1029_DATA

# Workspace directories
workspace_dir = r"c:\Drive224\Projects\iPAS 證照"
pdf_dir = os.path.join(workspace_dir, "AI應用規劃師", "初級AI應用規劃師", "官方教材及考試簡章")
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)
output_json_path = os.path.join(output_dir, "ai_questions.json")
output_js_path = os.path.join(output_dir, "ai_questions.js")
CERT_ID = "ai"
SOURCE_VERSION = "official-through-2026-10-29"

def to_half_width(char):
    mapping = {'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D'}
    return mapping.get(char, char)

SUBJECT_MAP_JUNIOR = {
    "人工智慧基礎概論": "L11 人工智慧基礎概論",
    "生成式AI應用與規劃": "L12 生成式AI應用與規劃",
}

def ai_assessment_topic(chapter):
    m = re.match(r'(L\d{3})', chapter)
    if m:
        return m.group(1)
    if "歷屆" in chapter:
        return "歷屆"
    if "官方樣題" in chapter:
        return "範例"
    return ""

def ai_assessment_content(chapter):
    m = re.match(r'(L\d{4,6})', chapter)
    if m:
        return m.group(1)[:6]
    return ""

def clean_official_text(text):
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        l = line.strip()
        if "能力鑑定" in l or "第一科：" in l or "第二科：" in l or "考試日期" in l or "一、選擇題" in l or "答案 題目" in l:
            continue
        if re.match(r'^第\s*\d+\s*頁，共\s*\d+\s*頁$', l):
            continue
        cleaned.append(line)
    return "\n".join(cleaned)

def parse_official_exams():
    official_files = [
        ("114年第四梯次", "人工智慧基礎概論", "114年第四梯次初級AI應用規劃師第一科人工智慧基礎概論(當次試題公告114_20251226000442.pdf"),
        ("114年第四梯次", "生成式AI應用與規劃", "114年第四梯次初級AI應用規劃師第二科生成式AI應用與規劃(當次試題公告114_20251226000507.pdf"),
        ("115年第一次", "人工智慧基礎概論", "115年第一次初級AI應用規劃師_第一科_人工智慧基礎概論_公告試題_20260410164304.pdf"),
        ("115年第一次", "生成式AI應用與規劃", "115年第一次初級AI應用規劃師_第二科_生成式AI應用與規劃_公告試題_20260410164328.pdf"),
        ("115年第二次", "人工智慧基礎概論", "115年第二次初級AI應用規劃師_第一科_人工智慧基礎概論_公告試題_20260604212644.pdf"),
        ("115年第二次", "生成式AI應用與規劃", "115年第二次初級AI應用規劃師_第二科_生成式AI應用與規劃_公告試題_20260604212719.pdf"),
        ("115年第三次", "人工智慧基礎概論", "115年第三次初級AI應用規劃師_第一科_人工智慧基礎概論_公告試題_20260906220418.pdf"),
        ("115年第三次", "生成式AI應用與規劃", "115年第三次初級AI應用規劃師_第二科_生成式AI應用與規劃_公告試題_20260906220452.pdf")
    ]
    
    parsed_questions = []
    
    for term, subject, filename in official_files:
        pdf_path = os.path.join(pdf_dir, filename)
        if not os.path.exists(pdf_path):
            print(f"File not found: {filename}")
            continue
            
        print(f"Parsing official exam: {filename}")
        reader = pypdf.PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += clean_official_text(page.extract_text()) + "\n"
            
        pattern = re.compile(r'(?:^|\n)\s*([A-DＡ-Ｄ])\s+(\d+)\.\s*')
        matches = list(pattern.finditer(full_text))
        
        for i in range(len(matches)):
            match = matches[i]
            ans = to_half_width(match.group(1))
            num = int(match.group(2))
            
            start_idx = match.end()
            end_idx = matches[i+1].start() if i + 1 < len(matches) else len(full_text)
            block = full_text[start_idx:end_idx].strip()
            
            opt_pattern = re.compile(r'[\(（]([A-D])[\)）]\s*(.*?)\s*(?=[\(（][A-D][\)）]|$)', re.DOTALL)
            opts_found = opt_pattern.findall(block)
            
            stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-D][\)）])', block, re.DOTALL)
            stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()
            
            options = ["", "", "", ""]
            for opt_letter, opt_text in opts_found:
                idx = ord(opt_letter.upper()) - ord('A')
                options[idx] = opt_text.replace('\n', ' ').strip()
                
            ch = f"{term}歷屆考題"
            explanation = ""
            if term == "115年第三次":
                if subject == "人工智慧基礎概論":
                    explanation = JUNIOR_115_3_S1_EXPLANATIONS.get(str(num), "")
                elif subject == "生成式AI應用與規劃":
                    explanation = JUNIOR_115_3_S2_EXPLANATIONS.get(str(num), "")

            parsed_questions.append({
                "subject": SUBJECT_MAP_JUNIOR.get(subject, f"初級：{subject}"),
                "chapter": ch,
                "assessmentTopic": ai_assessment_topic(ch),
                "assessmentContent": ai_assessment_content(ch),
                "num": num,
                "question": stem,
                "options": options,
                "answer": ans,
                "ans_text": f"標準答案：({ans})",
                "explanation": explanation
            })
            
    return parsed_questions

def parse_sample_exam():
    filename = "iPAS+AI應用規劃師初級能力鑑定-考試樣題(114年9月版).pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    if not os.path.exists(pdf_path):
        print(f"File not found: {filename}")
        return []
        
    print(f"Parsing sample exam: {filename}")
    reader = pypdf.PdfReader(pdf_path)
    parsed_questions = []

    current_subject = "人工智慧基礎概論"
    subject_pages = {
        "人工智慧基礎概論": [],
        "生成式AI應用與規劃": [],
    }

    for page in reader.pages:
        text = page.extract_text()
        if "科目一" in text:
            current_subject = "人工智慧基礎概論"
        elif "科目二" in text:
            current_subject = "生成式AI應用與規劃"

        lines = text.splitlines()
        cleaned = []
        for line in lines:
            l = line.strip()
            if "能力鑑定-考試樣題" in l or "非正式考題" in l or "114.09" in l or "◆ 科目" in l or "題號 答案 題目" in l:
                continue
            if l.isdigit() and len(l) < 3:
                continue
            cleaned.append(line)
        subject_pages[current_subject].append("\n".join(cleaned))

    for subject, pages in subject_pages.items():
        cleaned_text = "\n".join(pages)
        pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s+([A-D])\s*\n')
        matches = list(pattern.finditer(cleaned_text))

        for i in range(len(matches)):
            match = matches[i]
            num = int(match.group(1))
            ans = match.group(2)

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

            ch = "官方樣題範例"
            parsed_questions.append({
                "subject": SUBJECT_MAP_JUNIOR.get(subject, f"初級：{subject}"),
                "chapter": ch,
                "assessmentTopic": ai_assessment_topic(ch),
                "assessmentContent": ai_assessment_content(ch),
                "num": num,
                "question": stem,
                "options": options,
                "answer": ans,
                "ans_text": f"標準答案：({ans})",
                "explanation": "此題為官方公佈之能力鑑定考試樣題。"
            })
            
    return parsed_questions

def parse_ppt_mock():
    filename = "iPas AI應用規劃師初級模擬考題v7.0306115AI.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    if not os.path.exists(pdf_path):
        print(f"File not found: {filename}")
        return []
        
    print(f"Parsing PPT mock exam: {filename}")
    reader = pypdf.PdfReader(pdf_path)
    parsed_questions = []
    
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text()
        text = re.sub(r'燦哥小編團隊.*?\n', '', text)
        text = re.sub(r'\d{4}/\d{1,2}/\d{1,2}\s*\n', '', text)
        
        chapter_match = re.search(r'「(L\d+.*?)」練習解析答案題目編號', text)
        chapter_name = chapter_match.group(1) if chapter_match else "模擬練習題"
        
        if "L12" in chapter_name:
            subject = "生成式AI應用與規劃"
        else:
            subject = "人工智慧基礎概論"
            
        text = re.sub(r'「L\d+.*?」練習解析答案題目編號', '', text)
        
        pattern = re.compile(
            r'(.*?)\s*\(([A-D])\)\s*(.*?)\s*[\(（]A[\)）]\s*(.*?)\s*[\(（]B[\)）]\s*(.*?)\s*[\(（]C[\)）]\s*(.*?)\s*[\(（]D[\)）]\s*(.*?)\s*(\d+)',
            re.DOTALL
        )
        
        matches = list(pattern.finditer(text))
        for match in matches:
            explanation = match.group(1).replace('\n', ' ').strip()
            ans = match.group(2)
            stem = match.group(3).replace('\n', ' ').strip()
            opt_a = match.group(4).replace('\n', ' ').strip()
            opt_b = match.group(5).replace('\n', ' ').strip()
            opt_c = match.group(6).replace('\n', ' ').strip()
            opt_d = match.group(7).replace('\n', ' ').strip()
            num = int(match.group(8))
            
            explanation = re.sub(r'--- PAGE \d+ ---', '', explanation).strip()
            explanation = re.sub(r'^\d+\s+', '', explanation).strip()
            
            parsed_questions.append({
                "subject": SUBJECT_MAP_JUNIOR.get(subject, f"初級：{subject}"),
                "chapter": chapter_name,
                "assessmentTopic": ai_assessment_topic(chapter_name),
                "assessmentContent": ai_assessment_content(chapter_name),
                "num": num,
                "question": stem,
                "options": [opt_a, opt_b, opt_c, opt_d],
                "answer": ans,
                "ans_text": f"標準答案：({ans})",
                "explanation": explanation
            })
            
    return parsed_questions

def classify_assessment_content(q):
    text = (q["question"] + " " + " ".join(q["options"])).lower()
    ch = q.get("chapter", "")
    if ch.startswith("L1") and len(ch) >= 6:
        return ch[:6]
    is_s2 = "生成式" in q.get("subject", "")
    if is_s2:
        if any(w in text for w in ["no code", "no-code", "low code", "low-code", "無程式碼", "低程式碼", "公民開發"]):
            return "L12101" if any(w in text for w in ["何謂", "定義", "概念", "基礎"]) else "L12102"
        elif any(w in text for w in ["prompt", "提示", "temperature", "溫度", "top-p", "top-k", "few-shot", "zero-shot", "cot", "思維鏈", "token"]):
            return "L12202"
        elif any(w in text for w in ["chatgpt", "midjourney", "copilot", "dall-e", "sora", "claude", "工具", "應用領域"]):
            return "L12201"
        elif any(w in text for w in ["風險", "資安", "個資", "著作權", "侵權", "偏見", "幻覺", "安全性", "投毒", "注入", "jailbreak", "隱私"]):
            return "L12303"
        elif any(w in text for w in ["架構", "rag", "向量", "微調", "fine-tuning", "lora", "agent", "代理", "mcp", "記憶"]):
            return "L12302"
        else:
            return "L12301"
    else:
        if any(w in text for w in ["圖靈", "turing", "弱ai", "強ai", "agi", "asi", "達特茅斯", "符號", "聯結", "何謂ai"]):
            return "L11101"
        elif any(w in text for w in ["治理", "倫理", "法規", "手冊", "風險層級", "eu ai act", "人在迴圈", "hitl", "偏見", "公平"]):
            return "L11102"
        elif any(w in text for w in ["隱私", "去識別", "匿名", "假名", "差分隱私", "同態加密", "聯邦學習", "個資"]):
            return "L11203"
        elif any(w in text for w in ["資料清理", "前處理", "標準化", "正規化", "z-score", "min-max", "缺失值", "離群", "iqr", "編碼", "one-hot", "偏態", "etl"]):
            return "L11202"
        elif any(w in text for w in ["結構化", "半結構化", "非結構化", "5v", "資料來源"]):
            return "L11201"
        elif any(w in text for w in ["cnn", "rnn", "lstm", "transformer", "attention", "注意力", "gan", "vae", "擴散", "diffusion"]):
            return "L11401"
        elif any(w in text for w in ["遷移學習", "量化", "剪枝", "蒸餾", "xai", "可解釋", "shap", "lime", "mlops", "資料漂移", "概念漂移"]):
            return "L11402"
        elif any(w in text for w in ["決策樹", "隨機森林", "xgboost", "svm", "knn", "k-means", "分群", "pca", "降維", "迴歸", "邏輯迴歸"]):
            return "L11302"
        else:
            return "L11301"

def extract_core_topic(stem, correct_opt, subject):
    patterns = [
        ("EU AI Act|歐盟人工智慧法|風險分級", "歐盟《人工智慧法》（EU AI Act）風險分級與規範"),
        ("人在迴圈|HITL|Human-in-the-loop", "AI 決策流程中「人在迴圈（Human-in-the-loop）」治理機制"),
        ("圖靈測試|Turing Test", "圖靈測試（Turing Test）原理與評估局限"),
        ("弱人工智慧|Narrow AI|弱 AI", "弱人工智慧（Narrow AI）與通用人工智慧（AGI）之界定"),
        ("AGI|通用人工智慧", "通用人工智慧（AGI）之核心定義與發展狀態"),
        ("監督式學習|Supervised", "監督式學習（Supervised Learning）任務特性與適用情境"),
        ("非監督式學習|Unsupervised", "非監督式學習（Unsupervised Learning）之群集與結構發掘"),
        ("強化學習|Reinforcement", "強化學習（Reinforcement Learning）之獎勵回饋與探索機制"),
        ("自監督式學習|Self-supervised", "自監督式學習（Self-supervised Learning）之預訓練任務機制"),
        ("半監督式學習|Semi-supervised", "半監督式學習（Semi-supervised Learning）與偽標籤應用"),
        ("遷移學習|Transfer Learning", "遷移學習（Transfer Learning）之特徵復用與少量資料微調"),
        ("過擬合|Overfitting", "模型過擬合（Overfitting）成因與正則化/剪枝防範策略"),
        ("欠擬合|Underfitting", "模型欠擬合（Underfitting）成因與特徵複雜度提升策略"),
        ("混淆矩陣|Confusion Matrix|召回率|Recall|精確率|Precision|F1", "分類模型評估指標：精確率、召回率與 F1-score 權衡"),
        ("ROC|AUC", "ROC 曲線與 AUC（曲線下面積）在二元分類中的判讀"),
        ("Z-Score|標準化|Standardization", "Z-Score 特徵標準化原理與平均值/標準差縮放"),
        ("Min-Max|正規化|Normalization", "Min-Max 特徵正規化原理與 [0, 1] 數值映射"),
        ("IQR|四分位距|盒鬚圖|離群值", "四分位距（IQR）與盒鬚圖之離群值判別與處理"),
        ("缺失值|遺漏值|填補", "特徵缺失值填補策略（中位數、平均數、眾數與分組填補）"),
        ("資料洩漏|Data Leakage", "機器學習資料洩漏（Data Leakage）防範與切分原則"),
        ("k-匿名|k-Anonymity", "隱私保護技術：k-匿名化（k-Anonymity）準識別欄位約束"),
        ("差分隱私|Differential Privacy", "隱私保護技術：差分隱私（Differential Privacy）噪聲注入"),
        ("同態加密|Homomorphic Encryption", "隱私計算技術：同態加密（Homomorphic Encryption）密文運算"),
        ("安全多方運算|SMPC", "隱私保護技術：安全多方運算（SMPC）分散式協同計算"),
        ("聯邦學習|Federated Learning", "分散式隱私技術：聯邦學習（Federated Learning）參數聚合"),
        ("CNN|卷積神經網路", "卷積神經網路（CNN）局部特徵擷取與空間不變性"),
        ("RNN|循環神經網路|LSTM", "循環神經網路（RNN/LSTM）時序序列建模與記憶機制"),
        ("Transformer|自注意力|Self-Attention", "Transformer 架構與自注意力機制（Self-Attention）原理"),
        ("GAN|生成對抗網路", "生成對抗網路（GAN）生成器與鑑別器對抗訓練架構"),
        ("擴散模型|Diffusion Model", "擴散模型（Diffusion Model）加噪與逐步去噪生成機制"),
        ("Prompt Engineering|提示工程|Few-shot|Zero-shot|CoT", "生成式 AI 提示工程技術（Few-shot、CoT 思維鏈設計）"),
        ("Temperature|溫度參數|Top-p|Top-k", "生成式大型語言模型採樣超參數調控（Temperature 與 Top-p）"),
        ("RAG|檢索增強生成|向量資料庫", "檢索增強生成（RAG）架構與外部知識庫語意檢索整合"),
        ("LoRA|參數高效微調|PEFT", "大型語言模型參數高效微調（LoRA / PEFT）架構與優勢"),
        ("模型量化|Quantization|剪枝|蒸餾", "深度學習模型輕量化技術（量化、剪枝與知識蒸餾）"),
        ("AI Agent|AI代理|ReAct|MCP", "自主 AI Agent 代理人架構（ReAct 循環與工具調用協定）"),
        ("提示注入|Prompt Injection|越獄|Jailbreak", "大型語言模型資安威脅：提示注入與安全護欄（Guardrails）防護"),
        ("知識庫投毒|Data Poisoning", "生成式 AI 安全防護：知識庫投毒與文件來源稽核驗證"),
        ("No-Code|Low-Code|公民開發者", "No-Code / Low-Code 平台特性、適用範疇與企業治理原則"),
        ("MLOps|資料漂移|概念漂移|回滾", "MLOps 系統監控：資料漂移、概念漂移與版本回滾機制"),
    ]
    for pat, title in patterns:
        if re.search(pat, correct_opt, re.IGNORECASE) or re.search(pat, stem, re.IGNORECASE):
            return title
    clean_stem = re.sub(r'^[一二三四五六七八九十\d\.\s、()（）]+', '', stem)
    clean_stem = clean_stem.replace('下列關於', '').replace('下列何者', '').replace('有關', '').strip()
    return clean_stem[:24]

def build_distractor_analysis(opt_text, stem_text, correct_text):
    t = opt_text.strip()
    if not t:
        return "選項不正確。"
    
    if "非監督" in t:
        return "非監督式學習是在無標籤資料下發掘群集或資料內在結構，無法直接針對已知標籤進行分類或預測。"
    if "監督" in t and ("未標註" in stem_text or "分群" in stem_text or "降維" in stem_text):
        return "監督式學習需要預先標註之正確標籤資料，若無標籤或需探索未分群資料時並不適用。"
    if "強化學習" in t:
        return "強化學習依賴代理人與動態環境互動之獎懲訊號試錯學習，不適用於一般靜態資料之分類或迴歸任務。"
    if "半監督" in t:
        return "半監督式學習結合少量標註資料與大量未標註資料，非本題所述之標準情境。"
    if "過擬合" in t or "Overfitting" in t:
        return "過擬合指模型過度記憶訓練集雜訊導致泛化能力降低，非本題現象之成因或主要解答。"
    if "欠擬合" in t or "Underfitting" in t:
        return "欠擬合指模型複雜度不足、未能捕捉特徵規律，與本題描述之特徵或問題不符。"
    if "調高溫度" in t or "調高 Temperature" in t or "提高溫度" in t:
        return "調高溫度參數會提高文字採樣隨機性與發散度，加劇幻覺與格式不穩定風險，與本題精確或穩定需求相反。"
    if "調低溫度" in t or "降低溫度" in t:
        return "調低溫度僅降低採樣隨機性，無法彌補模型缺乏領域外部知識或結構邏輯之根本限制。"
    if "CNN" in t or "卷積" in t:
        return "卷積神經網路專精於具空間網格特徵之影像資料，非處理時序依賴或非網格結構之最佳選項。"
    if "RNN" in t or "LSTM" in t:
        return "循環神經網路專門處理時序序列資料，在非時間相依或大尺度空間視覺任務上並不合適。"
    if "GAN" in t or "生成對抗" in t:
        return "生成對抗網絡由生成器與鑑別器對抗生成模擬樣本，並非此任務所需之判別或分析模型。"
    if "隨機森林" in t:
        return "隨機森林為基於 Bagging 之集成決策樹，在此架構或特定線性可解釋情境下非最佳匹配選項。"
    if "支援向量機" in t or "SVM" in t:
        return "支援向量機主要尋求最大邊界超平面，對海量巨量資料或非平滑複雜特徵之訓練開銷較大。"
    if "K-means" in t:
        return "K-means 為基於球狀距離之非監督分群演算法，無法直接用於指導監督式標籤預測。"
    if "不可接受風險" in t:
        return "不可接受風險專指社會信用評分、潛意識認知操縱等全面禁止之嚴格情境，本題應用不屬此類。"
    if "高風險" in t:
        return "高風險系統涵蓋關鍵基礎設施、招募甄選及醫療診斷等敏感領域，本題應用不屬於此列。"
    if "有限風險" in t:
        return "有限風險需遵循透明度揭露義務（如聊天機器人與 Deepfake 標籤），與本題規範層級不同。"
    if "最小風險" in t:
        return "最小風險涵蓋電玩 AI、垃圾信過濾等無合規負擔應用，與本題法規要求之風險層級不符。"
    if "Pro-Code" in t:
        return "傳統 Pro-Code 開發週期長、需要專業工程團隊維運，無法滿足敏捷交付與低門檻要求。"
    if "No-Code" in t and "高度客製" in stem_text:
        return "No-Code 平台封裝度高，難以直接插入自訂複雜演算法或支援高度客製化底層架構。"
    if "刪除" in t:
        return "直接刪除可能遺漏關鍵樣本資訊，並非最穩健之工程處理原則。"
    if "增加" in t and "層數" in t:
        return "盲目增加層數會大幅增加模型複雜度，加劇過擬合風險並消耗運算資源。"
    
    return "非最適做法，與本題情境之核心定義或實務最佳規範不符。"

def generate_3part_explanation(q, existing_exp=""):
    num = q.get("num", 0)
    ans = q.get("answer", "")
    stem = q.get("question", "")
    opts = q.get("options", ["", "", "", ""])
    idx = ord(ans) - ord('A') if ans in ['A', 'B', 'C', 'D'] else -1
    correct_text = opts[idx] if 0 <= idx < len(opts) else ""
    subject = q.get("subject", "")
    
    topic_title = extract_core_topic(stem, correct_text, subject)
    exp = f"【核心考點】{topic_title}\n"
    exp += f"【正確答案說明】({ans})「{correct_text}」為正解。"
    
    if existing_exp and len(existing_exp.strip()) > 10 and "此題為" not in existing_exp:
        clean_exist = existing_exp.strip()
        clean_exist = re.sub(r'^標準答案[：:]\s*\([A-D]\)\s*', '', clean_exist)
        exp += f" {clean_exist}"
    else:
        if "監督" in correct_text or "監督" in stem:
            exp += " 監督式學習是在已知特徵與對應標籤（Label）的情況下訓練模型，以建立輸入至輸出之預測映射關係。"
        elif "非監督" in correct_text or "分群" in correct_text:
            exp += " 非監督式學習處理未具標籤之資料集，藉由距離或分佈相似度探索資料之群聚結構與隱含規律。"
        elif "強化學習" in correct_text or "強化學習" in stem:
            exp += " 強化學習透過代理人與環境反覆互動，依據獎勵回饋最大化累積報酬，以學得最佳決策策略。"
        elif "Prompt" in correct_text or "提示" in correct_text:
            exp += " 提示工程透過明確的角色指派、任務背景、格式約束與範例引導，有效規範大型語言模型之輸出精準度。"
        elif "RAG" in correct_text or "檢索增強" in correct_text:
            exp += " 檢索增強生成（RAG）透過向量資料庫即時檢索外部權威知識片段，充實 Prompt 上下文，從根本抑制模型幻覺。"
        elif "EU AI Act" in stem or "風險" in correct_text:
            exp += " 依據歐盟《人工智慧法》，AI 系統依風險高低分為不可接受風險、高風險、有限風險與最小風險，各具相應之合規與透明度義務。"
        elif "Z-Score" in stem or "Z-Score" in correct_text:
            exp += " Z-Score 標準化公式為 $Z = (X - \\mu) / \\sigma$，將資料轉換為平均數為 0、標準差為 1 之標準分佈，衡量數值相對離散程度。"
        elif "Min-Max" in stem or "Min-Max" in correct_text:
            exp += " Min-Max 正規化公式為 $X' = (X - X_{min}) / (X_{max} - X_{min})$，將連續數值線性縮放至 [0, 1] 區間。"
        elif "CNN" in correct_text or "卷積" in correct_text:
            exp += " 卷積神經網路藉由局部感受野與權重共享特性，能極高效率擷取影像網格之空間幾何紋理特徵。"
        elif "Transformer" in correct_text or "自注意力" in correct_text:
            exp += " Transformer 架構採用自注意力機制計算序列中各 Token 間之全局關聯權重，並支援全平行化高效計算。"
        elif "No-Code" in correct_text or "Low-Code" in correct_text:
            exp += " No-Code / Low-Code 平台以視覺化模組拖拉降低開發技術門檻，加速概念驗證（PoC）與敏捷流程自動化。"
        else:
            exp += f" 針對題幹情境需求，該選項精準契合核心技術規範與業務情境最佳實務。"
            
    exp += "\n【選項辨析】"
    for opt_idx, opt_char in enumerate(['A', 'B', 'C', 'D']):
        if opt_idx >= len(opts):
            continue
        opt_str = opts[opt_idx]
        if opt_char == ans:
            exp += f"\n- ({opt_char}) 正確：{opt_str} 符合題意標準規範與定義。"
        else:
            reason = build_distractor_analysis(opt_str, stem, correct_text)
            exp += f"\n- ({opt_char}) 錯誤：{opt_str}，{reason}"
            
    return exp

def parse_1029_mock_questions():
    mock_questions = []
    raw_qs = MOCK_1029_DATA["raw_questions"]
    s1_exp = MOCK_1029_DATA["s1_explanations"]
    s2_exp = MOCK_1029_DATA["s2_explanations"]
    
    # Subject 1 (97 qs)
    for q in raw_qs["s1"]:
        num_str = str(q["num"])
        exp_meta = s1_exp[num_str]
        item = {
            "subject": "L11 人工智慧基礎概論",
            "chapter": "115年10月模擬考題",
            "assessmentTopic": exp_meta["assessmentTopic"],
            "assessmentContent": exp_meta["assessmentContent"],
            "num": q["num"],
            "display_num": q["num"],
            "question": q["question"],
            "options": q["options"],
            "answer": q["answer"],
            "ans_text": f"標準答案：({q['answer']})",
            "explanation": exp_meta["explanation"]
        }
        mock_questions.append(item)
        
    # Subject 2 (88 qs)
    for q in raw_qs["s2"]:
        num_str = str(q["num"])
        exp_meta = s2_exp[num_str]
        item = {
            "subject": "L12 生成式AI應用與規劃",
            "chapter": "115年10月模擬考題",
            "assessmentTopic": exp_meta["assessmentTopic"],
            "assessmentContent": exp_meta["assessmentContent"],
            "num": q["num"],
            "display_num": q["num"],
            "question": q["question"],
            "options": q["options"],
            "answer": q["answer"],
            "ans_text": f"標準答案：({q['answer']})",
            "explanation": exp_meta["explanation"]
        }
        mock_questions.append(item)
        
    return mock_questions

def main():
    all_qs = []
    
    # 1. Parse official exams (114-4, 115-1, 115-2, 115-3)
    official_qs = parse_official_exams()
    all_qs.extend(official_qs)
    print(f"Parsed {len(official_qs)} official exam questions.")
    
    # 2. Parse sample exam
    sample_qs = parse_sample_exam()
    all_qs.extend(sample_qs)
    print(f"Parsed {len(sample_qs)} sample exam questions.")
    
    # 3. Parse PPT mock
    ppt_qs = parse_ppt_mock()
    all_qs.extend(ppt_qs)
    print(f"Parsed {len(ppt_qs)} PPT mock questions.")
    
    # Verify we have the 630 base questions
    print(f"Base questions before 1029 mock: {len(all_qs)}")
    
    # Enrich explanations and assessmentContent for base 630 questions
    updated_base = []
    for q in all_qs:
        item = dict(q)
        cur_exp = item.get("explanation", "")
        if "【核心考點】" in cur_exp and "【選項辨析】" in cur_exp:
            pass
        else:
            item["explanation"] = generate_3part_explanation(item, existing_exp=cur_exp)
            
        if not item.get("assessmentContent"):
            item["assessmentContent"] = classify_assessment_content(item)
            
        updated_base.append(item)
        
    # 4. Parse 1029 mock (185 questions)
    mock_1029 = parse_1029_mock_questions()
    print(f"Parsed {len(mock_1029)} 1029 mock questions.")
    
    # 5. Combine all questions
    final_all = updated_base + mock_1029
    print(f"Total combined questions: {len(final_all)}")
    
    # Assign sequential global ID
    for idx, q in enumerate(final_all):
        q["id"] = idx + 1
        q["display_num"] = q.get("display_num", q.get("num"))
        
    enriched = enrich_questions(
        CERT_ID,
        final_all,
        source_version=SOURCE_VERSION,
    )
    print(f"Enriched total questions: {len(enriched)}")
    
    # Write to JSON
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote database to {output_json_path}")
    
    # Write to JS
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("window.ipasAiQuestions = " + json.dumps(enriched, ensure_ascii=False, indent=2) + ";\n")
    print(f"Successfully wrote database to {output_js_path}")

if __name__ == "__main__":
    main()
