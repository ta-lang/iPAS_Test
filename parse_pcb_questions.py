# -*- coding: utf-8 -*-
"""
Parser for iPAS 電路板製程工程師 (中級)
Source: 115年第一次公告試題 (第一科、第二科、第三科)
Produces:
  - exam/pcb_questions.json
  - exam/pcb_questions.js (window.ipasPcbQuestions = [...])
"""

import os
import re
import json
import pypdf
import sys
from question_identity import enrich_questions
import explanations_pcb

sys.stdout.reconfigure(encoding='utf-8')

# Workspace directories
workspace_dir = os.path.dirname(os.path.abspath(__file__))
pdf_dir = os.path.join(workspace_dir, "電路板製程工程師")
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)

output_json_path = os.path.join(output_dir, "pcb_questions.json")
output_js_path = os.path.join(output_dir, "pcb_questions.js")

CERT_ID = "pcb"
SOURCE_VERSION = "official-115-01"

SUBJECT_CONFIGS = [
    {
        "id": "s1",
        "name": "第一科：電路板品管概論",
        "short_name": "電路板品管概論",
        "pdf": "115年第一次中級電路板製程工程師_第一科_電路板品管概論_公告試題_20260921123212.pdf",
    },
    {
        "id": "s2",
        "name": "第二科：軟性電路板製程概論",
        "short_name": "軟性電路板製程概論",
        "pdf": "115年第一次中級電路板製程工程師_第二科_軟性電路板製程概論_公告試題_20260921123250.pdf",
    },
    {
        "id": "s3",
        "name": "第三科：硬式電路板製程概論",
        "short_name": "硬式電路板製程概論",
        "pdf": "115年第一次中級電路板製程工程師_第三科_硬式電路板製程概論_公告試題_20260921123304.pdf",
    },
]

def clean_official_text(text: str) -> str:
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        l = line.strip()
        if "能力鑑定" in l or "第一科：" in l or "第二科：" in l or "第三科：" in l or "考試日期" in l or "答案 題目" in l:
            continue
        if re.match(r'^第\s*\d+\s*頁，共\s*\d+\s*頁$', l):
            continue
        cleaned.append(line)
    return "\n".join(cleaned)

def parse_section(sec_text: str, start_num: int, is_multi: bool, sub_id: str, sub_name: str) -> list[dict]:
    # Match pattern: answer at line start, followed by question number.
    # Note: answer can contain multiple full-width or half-width characters (e.g. B, Ｃ, AD, ACD, ABCD)
    pattern = re.compile(r'(?:^|\n)\s*([A-DＡ-Ｄ\s]+?)\s*(\d+)\.\s*')
    matches = list(pattern.finditer(sec_text))
    questions = []

    for i, m in enumerate(matches):
        raw_ans = m.group(1)
        # Normalize full-width letters and spaces, sort letters for consistency
        normalized_ans = raw_ans.translate(str.maketrans('ＡＢＣＤ', 'ABCD'))
        ans_chars = sorted(set(re.sub(r'\s+', '', normalized_ans).upper()))
        ans = ''.join(ans_chars)

        pdf_num = int(m.group(2))
        num = start_num + i

        start_idx = m.end()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(sec_text)
        block = sec_text[start_idx:end_idx].strip()

        # Extract options (A) ... (B) ... (C) ... (D) ...
        opt_pattern = re.compile(r'[\(（]([A-DＡ-Ｄ])[\)）]\s*(.*?)\s*(?=[\(（][A-DＡ-Ｄ][\)）]|$)', re.DOTALL)
        opts_found = opt_pattern.findall(block)

        # Extract question stem before first option
        stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-DＡ-Ｄ][\)）])', block, re.DOTALL)
        stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()
        # Clean extra spaces
        stem = re.sub(r'\s+', ' ', stem)

        options = ["", "", "", ""]
        for opt_letter, opt_text in opts_found:
            norm_letter = opt_letter.translate(str.maketrans('ＡＢＣＤ', 'ABCD')).upper()
            idx = ord(norm_letter) - ord('A')
            if 0 <= idx < 4:
                clean_opt = opt_text.replace('\n', ' ').strip()
                # Clean trailing semicolons/periods if any
                clean_opt = re.sub(r'[；;，,。.]+$', '', clean_opt).strip()
                options[idx] = clean_opt

        # Fetch detailed educational explanation
        exp_dict = explanations_pcb.PCB_EXPLANATIONS_BY_SUBJECT.get(sub_id, {})
        explanation = exp_dict.get(num, "")

        question_data = {
            "subject": sub_id,
            "subject_name": sub_name,
            "chapter": "115年第一次歷屆試題",
            "assessmentTopic": "歷屆",
            "assessmentContent": "歷屆",
            "num": num,
            "display_num": num,
            "pdf_num": pdf_num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "is_multiple": is_multi or (len(ans) > 1),
            "explanation": explanation
        }
        questions.append(question_data)

    return questions

def parse_subject(config: dict) -> list[dict]:
    pdf_path = os.path.join(pdf_dir, config["pdf"])
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    reader = pypdf.PdfReader(pdf_path)
    full_text = "\n".join([clean_official_text(p.extract_text()) for p in reader.pages])

    # Split into Section 1 (單選題) and Section 2 (複選題)
    sec_parts = re.split(r'二、複選題', full_text)
    sec1_text = sec_parts[0]
    sec2_text = sec_parts[1] if len(sec_parts) > 1 else ""

    q_single = parse_section(sec1_text, start_num=1, is_multi=False, sub_id=config["id"], sub_name=config["name"])
    q_multi = parse_section(sec2_text, start_num=36, is_multi=True, sub_id=config["id"], sub_name=config["name"])

    if len(q_single) != 35:
        raise ValueError(f"{config['id']} single choice count is {len(q_single)}, expected 35")
    if len(q_multi) != 10:
        raise ValueError(f"{config['id']} multiple choice count is {len(q_multi)}, expected 10")

    return q_single + q_multi

def main():
    print("=== Starting parse_pcb_questions.py ===")
    all_raw_questions = []

    for cfg in SUBJECT_CONFIGS:
        print(f"Parsing {cfg['id']} ({cfg['name']})...")
        sub_questions = parse_subject(cfg)
        print(f"  -> Successfully parsed {len(sub_questions)} questions ({sum(1 for q in sub_questions if not q['is_multiple'])} single, {sum(1 for q in sub_questions if q['is_multiple'])} multi)")
        all_raw_questions.extend(sub_questions)

    total_count = len(all_raw_questions)
    print(f"Total raw questions parsed across 3 subjects: {total_count}")
    if total_count != 135:
        raise ValueError(f"Total question count is {total_count}, expected 135")

    # Enrich questions with deterministic UIDs and content hashes
    print("Enriching questions with question_identity...")
    enriched_questions = enrich_questions(
        CERT_ID,
        all_raw_questions,
        source_version=SOURCE_VERSION
    )

    # Validations
    print("Validating enriched question bank...")
    seen_uids = set()
    for q in enriched_questions:
        uid = q["question_uid"]
        if uid in seen_uids:
            raise ValueError(f"Duplicate UID: {uid}")
        seen_uids.add(uid)

        assert q["stem"], f"Empty stem in {uid}"
        assert len(q["options"]) == 4, f"Options count != 4 in {uid}"
        for i, opt in enumerate(q["options"]):
            assert opt, f"Option {i} empty in {uid} (Q{q['num']})"
        assert q["answer"], f"Empty answer in {uid}"
        assert q["explanation"], f"Empty explanation in {uid}"
        assert "【核心考點】" in q["explanation"], f"Missing 【核心考點】 in {uid}"
        assert "【正確答案說明】" in q["explanation"], f"Missing 【正確答案說明】 in {uid}"
        assert "【選項辨析】" in q["explanation"], f"Missing 【選項辨析】 in {uid}"

    # Write exam/pcb_questions.json
    print(f"Writing {output_json_path}...")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(enriched_questions, f, ensure_ascii=False, indent=2)

    # Write exam/pcb_questions.js
    print(f"Writing {output_js_path}...")
    js_content = f"// iPAS 電路板製程工程師 (中級) 題庫\nwindow.ipasPcbQuestions = {json.dumps(enriched_questions, ensure_ascii=False, indent=2)};\n"
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print("=== Successfully finished parsing PCB questions! ===")
    for cfg in SUBJECT_CONFIGS:
        sub_qs = [q for q in enriched_questions if q["subject"] == cfg["id"]]
        single_count = sum(1 for q in sub_qs if not q["is_multiple"])
        multi_count = sum(1 for q in sub_qs if q["is_multiple"])
        print(f"Subject {cfg['id']} ({cfg['short_name']}): {len(sub_qs)} questions ({single_count} single-choice + {multi_count} multiple-choice)")

if __name__ == "__main__":
    main()
