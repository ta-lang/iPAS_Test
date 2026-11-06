# -*- coding: utf-8 -*-
"""
Parser for iPAS AIoT 應用工程師 (初級)
Sources:
  - Subject 1: AIoT應用工程師(初級)-學習指引-科目1_AIoT基礎概論 (80 題官方精選評量試題)
  - Subject 2: 實務情境模擬試題 (60 題高擬真情境評量試題，依評鑑內容 L12101~L12203 各配 10 題)
Produces:
  - exam/aiot_questions.json
  - exam/aiot_questions.js (window.ipasAiotQuestions = [...])
"""

import os
import re
import sys
import json
from collections import Counter
from question_identity import enrich_questions
from questions_aiot import AIOT_S1_QUESTIONS, AIOT_S2_QUESTIONS

# Workspace directories
workspace_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)

output_json_path = os.path.join(output_dir, "aiot_questions.json")
output_js_path = os.path.join(output_dir, "aiot_questions.js")

CERT_ID = "aiot"
SOURCE_VERSION = "official-guide-2026"

def build_raw_questions() -> list[dict]:
    raw_questions: list[dict] = []

    # ----------------------------------------------------
    # Subject 1 (考科一：AIoT 基礎概論) - 80 questions (num 1~80)
    # ----------------------------------------------------
    s1_source = AIOT_S1_QUESTIONS
    if len(s1_source) != 80:
        raise ValueError(f"Expected 80 questions for Subject 1, got {len(s1_source)}")

    for i, q in enumerate(s1_source, start=1):
        ans = q["answer"].strip()
        item = {
            "id": i,
            "subject": "s1",
            "subject_name": "考科一：AIoT 基礎概論",
            "chapter": q["chapter"],
            "assessmentTopic": q["assessmentTopic"],
            "assessmentContent": q["assessmentContent"],
            "num": i,
            "display_num": i,
            "stem": q["stem"].strip(),
            "question": q["stem"].strip(),
            "options": [opt.strip() for opt in q["options"]],
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "is_multiple": False,
            "explanation": q["explanation"].strip(),
            "source": "official_guide",
        }
        raw_questions.append(item)

    # ----------------------------------------------------
    # Subject 2 (考科二：物聯網系統與應用) - 60 questions (num 1~60)
    # ----------------------------------------------------
    s2_source = AIOT_S2_QUESTIONS
    if len(s2_source) != 60:
        raise ValueError(f"Expected 60 questions for Subject 2, got {len(s2_source)}")

    for i, q in enumerate(s2_source, start=1):
        ans = q["answer"].strip()
        item = {
            "id": 80 + i,
            "subject": "s2",
            "subject_name": "考科二：物聯網系統與應用",
            "chapter": q["chapter"],
            "assessmentTopic": q["assessmentTopic"],
            "assessmentContent": q["assessmentContent"],
            "num": i,
            "display_num": i,
            "stem": q["stem"].strip(),
            "question": q["stem"].strip(),
            "options": [opt.strip() for opt in q["options"]],
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "is_multiple": False,
            "explanation": q["explanation"].strip(),
            "source": "practice_supplement",
        }
        raw_questions.append(item)

    return raw_questions

def validate_questions(questions: list[dict]):
    if len(questions) != 140:
        raise ValueError(f"Expected exactly 140 questions, got {len(questions)}")

    seen_ids = set()
    seen_uids = set()

    for q in questions:
        # ID uniqueness
        qid = q["id"]
        if qid in seen_ids:
            raise ValueError(f"Duplicate id: {qid}")
        seen_ids.add(qid)

        # UID uniqueness
        uid = q["question_uid"]
        if uid in seen_uids:
            raise ValueError(f"Duplicate question_uid: {uid}")
        seen_uids.add(uid)

        # UID & Source ID pattern check
        if not re.match(r"^aiot-[a-f0-9]{24}$", uid):
            raise ValueError(f"Malformed question_uid: {uid}")
        if not re.match(r"^aiot-[a-f0-9]{16}$", q["source_id"]):
            raise ValueError(f"Malformed source_id: {q['source_id']}")
        if not re.match(r"^[a-f0-9]{64}$", q["content_hash"]):
            raise ValueError(f"Malformed content_hash: {q['content_hash']}")

        # Display num check
        if q["display_num"] != q["num"]:
            raise ValueError(f"display_num ({q['display_num']}) != num ({q['num']}) in {uid}")

        # Stem & Question check
        stem = q["stem"].strip()
        if not stem:
            raise ValueError(f"Empty stem in {uid}")
        if q["question"].strip() != stem:
            raise ValueError(f"Stem and question mismatch in {uid}")

        # Options check
        options = q["options"]
        if not isinstance(options, list) or len(options) != 4:
            raise ValueError(f"Options must be list of 4 in {uid}, got {options}")
        for i, opt in enumerate(options):
            if not isinstance(opt, str) or not opt.strip():
                raise ValueError(f"Option {i} empty or non-string in {uid}")

        # Answer check
        ans = q["answer"]
        if ans not in ("A", "B", "C", "D"):
            raise ValueError(f"Answer '{ans}' invalid in {uid}")

        # 3-section structured explanation check
        exp = q["explanation"]
        if not exp or not exp.strip():
            raise ValueError(f"Empty explanation in {uid}")
        if "【核心考點】" not in exp:
            raise ValueError(f"Missing 【核心考點】 in {uid}")
        if "【正確答案說明】" not in exp:
            raise ValueError(f"Missing 【正確答案說明】 in {uid}")
        if "【選項辨析】" not in exp:
            raise ValueError(f"Missing 【選項辨析】 in {uid}")

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("=== Starting parse_aiot_questions.py ===")

    # 1. Build raw questions
    print("Building raw questions...")
    raw_questions = build_raw_questions()
    print(f"Total raw questions collected: {len(raw_questions)}")

    # 2. Enrich with deterministic identity
    print("Enriching questions with question_identity...")
    enriched_questions = enrich_questions(
        CERT_ID,
        raw_questions,
        source_version=SOURCE_VERSION
    )

    # 3. Validate
    print("Validating enriched question bank...")
    validate_questions(enriched_questions)
    print("All validation assertions passed successfully!")

    # 4. Save JSON
    print(f"Writing {output_json_path}...")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(enriched_questions, f, ensure_ascii=False, indent=2)

    # 5. Save JS
    print(f"Writing {output_js_path}...")
    js_content = f"window.ipasAiotQuestions = {json.dumps(enriched_questions, ensure_ascii=False, indent=2)};\n"
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    # 6. Report summary statistics
    s1_qs = [q for q in enriched_questions if q["subject"] == "s1"]
    s2_qs = [q for q in enriched_questions if q["subject"] == "s2"]

    print("\n" + "="*50)
    print("AIoT Question Bank Generation Summary:")
    print("="*50)
    print(f"Total questions: {len(enriched_questions)}")
    print(f"- Subject 1 (考科一：AIoT 基礎概論): {len(s1_qs)} questions (Q1~Q80)")
    s1_topics = Counter(q["assessmentContent"] for q in s1_qs)
    for topic, count in sorted(s1_topics.items()):
        print(f"    * {topic}: {count} questions")
    s1_ans = Counter(q["answer"] for q in s1_qs)
    print(f"    Answer distribution: {dict(sorted(s1_ans.items()))}")

    print(f"- Subject 2 (考科二：物聯網系統與應用): {len(s2_qs)} questions (Q1~Q60)")
    s2_topics = Counter(q["assessmentContent"] for q in s2_qs)
    for topic, count in sorted(s2_topics.items()):
        print(f"    * {topic}: {count} questions")
    s2_ans = Counter(q["answer"] for q in s2_qs)
    print(f"    Answer distribution: {dict(sorted(s2_ans.items()))}")

    print("="*50)
    print("Successfully generated aiot_questions.json and aiot_questions.js!\n")

if __name__ == "__main__":
    main()
