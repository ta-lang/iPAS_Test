import os
import re
import json
import pypdf
from question_identity import enrich_questions

# Workspace directories
workspace_dir = os.path.dirname(os.path.abspath(__file__))
pdf_dir = os.path.join(workspace_dir, "營運智慧分析師", "官方教材及考試簡章")
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)
output_json_path = os.path.join(output_dir, "questions.json")
output_js_path = os.path.join(output_dir, "questions.js")
CERT_ID = "oi"
SOURCE_VERSION = "huazhu-1128-20251212"


# PDF file paths
pdf_files = {
    "subject1": {
        "name": "1128（華筑）考科1_營運智慧概論_20251212112207.pdf",
        "title": "考科一：營運智慧概論",
        "chapters": [
            {
                "id": "s1_c4",
                "name": "第四章 營運智慧基本知識",
                "q_pages": (20, 30), # 0-indexed (pages 21 to 30)
                "a_pages": (30, 33), # 0-indexed (pages 31 to 33)
            },
            {
                "id": "s1_c5",
                "name": "第五章 基礎資料分析",
                "q_pages": (44, 51), # 0-indexed (pages 45 to 51)
                "a_pages": (51, 53), # 0-indexed (pages 52 to 53)
            }
        ]
    },
    "subject2": {
        "name": "1128（華筑）考科2_經營管理數位化概論_20251212131032.pdf",
        "title": "考科二：經營管理數位化概論",
        "chapters": [
            {
                "id": "s2_c4",
                "name": "第四章 經營管理基本知識",
                "q_pages": (23, 33), # 0-indexed (pages 24 to 33)
                "a_pages": (33, 36), # 0-indexed (pages 34 to 36)
            },
            {
                "id": "s2_c5",
                "name": "第五章 數位化企業資訊工具基本知識",
                "q_pages": (53, 62), # 0-indexed (pages 54 to 62)
                "a_pages": (62, 64), # 0-indexed (pages 63 to 64)
            }
        ]
    }
}

def clean_text(text):
    lines = text.splitlines()
    cleaned_lines = []
    for line in lines:
        line_s = line.strip()
        # Remove headers, footers and page numbers
        if line_s.startswith('') or re.match(r'^\d+-\d+$', line_s) or line_s.startswith('Page') or not line_s:
            continue
        cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)

def parse_questions_text(text):
    # Split by question numbers
    blocks = re.split(r'\n\s*(?=\d+\.)', '\n' + text)
    questions = {}
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        
        # Try full-width brackets （A）...（B）...（C）...（D）
        match = re.match(r'^(\d+)\.\s*(.*?)\s*（A）\s*(.*?)\s*（B）\s*(.*?)\s*（C）\s*(.*?)\s*（D）\s*(.*)$', block, re.DOTALL)
        if match:
            q_num = int(match.group(1))
            stem = match.group(2).replace('\n', ' ').strip()
            opt_a = match.group(3).replace('\n', ' ').strip()
            opt_b = match.group(4).replace('\n', ' ').strip()
            opt_c = match.group(5).replace('\n', ' ').strip()
            opt_d = match.group(6).replace('\n', ' ').strip()
            questions[q_num] = {
                'num': q_num,
                'question': stem,
                'options': [opt_a, opt_b, opt_c, opt_d]
            }
            continue
            
        # Try half-width brackets (A)...(B)...(C)...(D)
        match2 = re.match(r'^(\d+)\.\s*(.*?)\s*\([Aa]\)\s*(.*?)\s*\([Bb]\)\s*(.*?)\s*\([Cc]\)\s*(.*?)\s*\([Dd]\)\s*(.*)$', block, re.DOTALL)
        if match2:
            q_num = int(match2.group(1))
            stem = match2.group(2).replace('\n', ' ').strip()
            opt_a = match2.group(3).replace('\n', ' ').strip()
            opt_b = match2.group(4).replace('\n', ' ').strip()
            opt_c = match2.group(5).replace('\n', ' ').strip()
            opt_d = match2.group(6).replace('\n', ' ').strip()
            questions[q_num] = {
                'num': q_num,
                'question': stem,
                'options': [opt_a, opt_b, opt_c, opt_d]
            }
            continue

        # Try alternative format (e.g. options split across lines without clean format, or full-width letters A. B. C. D.)
        match3 = re.match(r'^(\d+)\.\s*(.*?)\s*[（(]?A[）\.]\s*(.*?)\s*[（(]?B[）\.]\s*(.*?)\s*[（(]?C[）\.]\s*(.*?)\s*[（(]?D[）\.]\s*(.*)$', block, re.DOTALL)
        if match3:
            q_num = int(match3.group(1))
            stem = match3.group(2).replace('\n', ' ').strip()
            opt_a = match3.group(3).replace('\n', ' ').strip()
            opt_b = match3.group(4).replace('\n', ' ').strip()
            opt_c = match3.group(5).replace('\n', ' ').strip()
            opt_d = match3.group(6).replace('\n', ' ').strip()
            questions[q_num] = {
                'num': q_num,
                'question': stem,
                'options': [opt_a, opt_b, opt_c, opt_d]
            }
            
    return questions

def parse_answers_text(text):
    # Split by answers e.g. 1. Ans
    blocks = re.split(r'\n\s*(?=\d+\.\s*Ans)', '\n' + text)
    answers = {}
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        
        match = re.match(r'^(\d+)\.\s*Ans\s*[（(]([A-D])[）)]\s*(.*?)(?:\n(.*))?$', block, re.DOTALL)
        if match:
            a_num = int(match.group(1))
            ans_letter = match.group(2)
            ans_text = match.group(3).replace('\n', ' ').strip()
            explanation = match.group(4).replace('\n', ' ').strip() if match.group(4) else ''
            
            # Clean up trailing garbage (like page numbers or chapter names that slipped through)
            explanation = re.sub(r'.*', '', explanation).strip()
            
            answers[a_num] = {
                'num': a_num,
                'answer': ans_letter,
                'ans_text': ans_text,
                'explanation': explanation
            }
    return answers

def normalize(text):
    """Normalize text for duplicate comparison."""
    return re.sub(r'\s+', '', text).lower()

def main():
    all_questions = []
    question_id_counter = 1
    seen_questions = set()  # for dedup

    for subject_key, subject_info in pdf_files.items():
        pdf_name = subject_info["name"]
        pdf_path = os.path.join(pdf_dir, pdf_name)
        
        if not os.path.exists(pdf_path):
            print(f"Error: PDF file not found at {pdf_path}")
            continue
            
        print(f"Processing PDF: {pdf_name}")
        reader = pypdf.PdfReader(pdf_path)

        CHAPTER_TOPIC_MAP = {
            "第四章 營運智慧基本知識": "L111",
            "第五章 基礎資料分析": "L112",
            "第四章 經營管理基本知識": "L121",
            "第五章 數位化企業資訊工具基本知識": "L122",
        }

        for chapter in subject_info["chapters"]:
            print(f"  Parsing Chapter: {chapter['name']}")
            
            # Extract question text
            q_start, q_end = chapter["q_pages"]
            q_raw = ""
            for p in range(q_start, q_end):
                q_raw += reader.pages[p].extract_text() + "\n"
            q_clean = clean_text(q_raw)
            parsed_qs = parse_questions_text(q_clean)
            
            # Extract answer text
            a_start, a_end = chapter["a_pages"]
            a_raw = ""
            for p in range(a_start, a_end):
                a_raw += reader.pages[p].extract_text() + "\n"
            a_clean = clean_text(a_raw)
            parsed_as = parse_answers_text(a_clean)
            
            print(f"    Found {len(parsed_qs)} questions and {len(parsed_as)} answers in raw data")
            
            # Merge questions and answers
            merged_count = 0
            for num, q_data in parsed_qs.items():
                if num in parsed_as:
                    ans_data = parsed_as[num]
                    dedup_key = normalize(q_data["question"])
                    if dedup_key in seen_questions:
                        print(f"    Skipping duplicate Q{num}: {q_data['question'][:60]}")
                        continue
                    seen_questions.add(dedup_key)
                    all_questions.append({
                        "id": question_id_counter,
                        "subject": subject_info["title"],
                        "chapter": chapter["name"],
                        "assessmentTopic": CHAPTER_TOPIC_MAP.get(chapter["name"], ""),
                        "num": num,
                        "question": q_data["question"],
                        "options": q_data["options"],
                        "answer": ans_data["answer"],
                        "ans_text": ans_data["ans_text"],
                        "explanation": ans_data["explanation"]
                    })
                    question_id_counter += 1
                    merged_count += 1
                else:
                    print(f"    Warning: Question {num} has no matching answer")
            
            print(f"    Successfully merged {merged_count} questions for {chapter['name']}")

    all_questions = enrich_questions(
        CERT_ID,
        all_questions,
        source_version=SOURCE_VERSION,
    )

    # Write out the JSON database
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote {len(all_questions)} questions to {output_json_path}")

    # Write out the JS database (for offline local execution via file:// protocol)
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("window.ipasQuestions = " + json.dumps(all_questions, ensure_ascii=False, indent=2) + ";\n")
    print(f"Successfully wrote {len(all_questions)} questions to {output_js_path}")

if __name__ == "__main__":
    main()
