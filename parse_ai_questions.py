import os
import re
import json
import glob
import pypdf
from question_identity import enrich_questions

# Workspace directories
workspace_dir = r"c:\Drive224\Projects\iPAS 證照"
pdf_dir = os.path.join(workspace_dir, "AI應用規劃師", "初級AI應用規劃師", "官方教材及考試簡章")
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)
output_json_path = os.path.join(output_dir, "ai_questions.json")
output_js_path = os.path.join(output_dir, "ai_questions.js")
CERT_ID = "ai"
SOURCE_VERSION = "official-through-2026-06-04"

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
        ("115年第二次", "生成式AI應用與規劃", "115年第二次初級AI應用規劃師_第二科_生成式AI應用與規劃_公告試題_20260604212719.pdf")
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
            
        # Split by question headers
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
                "explanation": ""
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

    # Merge cleaned pages by subject before parsing. Some questions continue
    # onto the next PDF page, so page-by-page parsing can drop trailing options.
    current_subject = "人工智慧基礎概論"
    subject_pages = {
        "人工智慧基礎概論": [],
        "生成式AI應用與規劃": [],
    }

    for page in reader.pages:
        text = page.extract_text()

        # Detect subject switch
        if "科目一" in text:
            current_subject = "人工智慧基礎概論"
        elif "科目二" in text:
            current_subject = "生成式AI應用與規劃"

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
        subject_pages[current_subject].append("\n".join(cleaned))

    for subject, pages in subject_pages.items():
        cleaned_text = "\n".join(pages)

        # Parse all questions in the subject after page continuations are joined.
        # Headers like: "1.  B\n" or "41.  A\n"
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
    
    # The PPT contains L11... (Subject 1) and L12... (Subject 2)
    # Each page represents a slide. Let's process page by page.
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text()
        
        # Clean slide headers/footers
        text = re.sub(r'燦哥小編團隊.*?\n', '', text)
        text = re.sub(r'\d{4}/\d{1,2}/\d{1,2}\s*\n', '', text)
        
        # Detect chapter
        chapter_match = re.search(r'「(L\d+.*?)」練習解析答案題目編號', text)
        chapter_name = chapter_match.group(1) if chapter_match else "模擬練習題"
        
        # Subject mapping based on L11 vs L12
        if "L12" in chapter_name:
            subject = "生成式AI應用與規劃"
        else:
            subject = "人工智慧基礎概論"
            
        # Strip the slide header
        text = re.sub(r'「L\d+.*?」練習解析答案題目編號', '', text)
        
        # Parse layout: [Explanation] ([Ans]) [Stem] (A) [OptA] (B) [OptB] (C) [OptC] (D) [OptD] [Num]
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
            
            # Clean up explanation of PPT slide leftovers
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
    
    # 3. Parse PPT mock
    ppt_qs = parse_ppt_mock()
    all_qs.extend(ppt_qs)
    print(f"Parsed {len(ppt_qs)} PPT mock questions.")
    
    # Assign global unique IDs
    for idx, q in enumerate(all_qs):
        q["id"] = idx + 1

    all_qs = enrich_questions(
        CERT_ID,
        all_qs,
        source_version=SOURCE_VERSION,
    )
        
    print(f"Total parsed questions: {len(all_qs)}")
    
    # Write to JSON
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(all_qs, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote database to {output_json_path}")
    
    # Write to JS
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("window.ipasAiQuestions = " + json.dumps(all_qs, ensure_ascii=False, indent=2) + ";\n")
    print(f"Successfully wrote database to {output_js_path}")

if __name__ == "__main__":
    main()
