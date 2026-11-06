# -*- coding: utf-8 -*-
"""
Parser for iPAS 3D 列印積層製造工程師 (初級)
Produces:
  exam/3d_questions.json
  exam/3d_questions.js
"""

import os
import re
import json
import pypdf
import sys
from question_identity import enrich_questions
import explanations_3d

# Workspace directories
workspace_dir = os.path.dirname(os.path.abspath(__file__))
pdf_dir = os.path.join(workspace_dir, "3D 列印積層製造工程師")
output_dir = os.path.join(workspace_dir, "exam")
os.makedirs(output_dir, exist_ok=True)
output_json_path = os.path.join(output_dir, "3d_questions.json")
output_js_path = os.path.join(output_dir, "3d_questions.js")

CERT_ID = "3d"
SOURCE_VERSION = "official-through-115-05"

def to_half_width(char):
    mapping = {'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D'}
    return mapping.get(char.upper(), char.upper())

def clean_official_text(text):
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        l = line.strip()
        if "能力鑑定" in l or "第一科：" in l or "第二科：" in l or "考試日期" in l or "答案 題目" in l:
            continue
        if re.match(r'^\d+$', l): # page number
            continue
        cleaned.append(line)
    return "\n".join(cleaned)

def parse_exam_115_s1():
    filename = "115年第一次初級3D列印積層製造工程師_第一科_3D列印概論_20260615163054.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    reader = pypdf.PdfReader(pdf_path)
    full_text = "\n".join([clean_official_text(p.extract_text()) for p in reader.pages])

    pattern = re.compile(r'(?:^|\n)\s*([A-DＡ-Ｄ])\s+(\d+)\.\s*')
    matches = list(pattern.finditer(full_text))

    questions = []
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
            if 0 <= idx < 4:
                options[idx] = opt_text.replace('\n', ' ').strip()

        explanation = explanations_3d.EXAM_115_S1_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s1",
            "subject_name": "第一科：3D列印概論",
            "chapter": "115年第一次歷屆試題",
            "assessmentTopic": "歷屆",
            "assessmentContent": "歷屆",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })
    return questions

def parse_exam_115_s2():
    filename = "115年第一次初級3D列印積層製造工程師_第二科_3D製程與材料概論_20260615163153.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    reader = pypdf.PdfReader(pdf_path)
    full_text = "\n".join([clean_official_text(p.extract_text()) for p in reader.pages])

    pattern = re.compile(r'(?:^|\n)\s*([A-DＡ-Ｄ])\s+(\d+)\.\s*')
    matches = list(pattern.finditer(full_text))

    questions = []
    for i in range(len(matches)):
        match = matches[i]
        ans = to_half_width(match.group(1))
        num = int(match.group(2))

        start_idx = match.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(full_text)
        block = full_text[start_idx:end_idx].strip()

        # Fix Q26 anomaly in PDF
        if num == 26:
            block = block.replace('(A) 當線徑\n誤差過大時暫停列印', '').strip()
            block = block.replace('(A) 當線徑 誤差過大時暫停列印', '').strip()

        opt_pattern = re.compile(r'[\(（]([A-D])[\)）]\s*(.*?)\s*(?=[\(（][A-D][\)）]|$)', re.DOTALL)
        opts_found = opt_pattern.findall(block)

        stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-D][\)）])', block, re.DOTALL)
        stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()

        options = ["", "", "", ""]
        for opt_letter, opt_text in opts_found:
            idx = ord(opt_letter.upper()) - ord('A')
            if 0 <= idx < 4:
                options[idx] = opt_text.replace('\n', ' ').strip()

        # Link diagrams for 115 S2
        if num == 9:
            stem += "\n\n![切層順序](images/3d/exam2_q9_order.png)\n\n樣式 1: ![樣式1](images/3d/exam2_q9_sec1.png) 樣式 2: ![樣式2](images/3d/exam2_q9_sec2.png)\n樣式 3: ![樣式3](images/3d/exam2_q9_sec3.png) 樣式 4: ![樣式4](images/3d/exam2_q9_sec4.png)"
        elif num == 19:
            options[0] = "![選項A](images/3d/exam2_q19_a.png)"
            options[1] = "![選項B](images/3d/exam2_q19_b.png)"
            options[2] = "![選項C](images/3d/exam2_q19_c.png)"
            options[3] = "![選項D](images/3d/exam2_q19_d.png)"
        elif num == 22:
            stem += "\n\n![示意圖](images/3d/exam2_q22.png)"
        elif num == 24:
            options[0] = "![選項A](images/3d/exam2_q24_a.png)"
            options[1] = "![選項B](images/3d/exam2_q24_b.png)"
            options[2] = "![選項C](images/3d/exam2_q24_c.png)"
            options[3] = "![選項D](images/3d/exam2_q24_d.png)"
        elif num == 25:
            options[0] = "![選項A](images/3d/exam2_q25_a.png)"
            options[1] = "![選項B](images/3d/exam2_q25_b.png)"
            options[2] = "![選項C](images/3d/exam2_q25_c.png)"
            options[3] = "![選項D](images/3d/exam2_q25_d.png)"
        elif num == 27:
            stem += "\n\n![翹曲示意圖](images/3d/exam2_q27.png)"
        elif num == 31:
            stem += "\n\n![配合件模型示意圖](images/3d/exam2_q31_stem.png)"
            options[0] = "![選項A](images/3d/exam2_q31_a.png)"
            options[1] = "![選項B](images/3d/exam2_q31_b.png)"
            options[2] = "![選項C](images/3d/exam2_q31_c.png)"
            options[3] = "![選項D](images/3d/exam2_q31_d.png)"
        elif num == 32:
            stem += "\n\n![金字塔模型瑕疵示意圖](images/3d/exam2_q32.png)"
        elif num == 42:
            stem += "\n\n![矩形無蓋容器模型](images/3d/exam2_q42.png)"
        elif num == 43:
            options[0] = "![選項A](images/3d/exam2_q43_a.png)"
            options[1] = "![選項B](images/3d/exam2_q43_b.png)"
            options[2] = "![選項C](images/3d/exam2_q43_c.png)"
            options[3] = "![選項D](images/3d/exam2_q43_d.png)"
        elif num == 47:
            stem += "\n\n![牽絲測試模型示意圖](images/3d/exam2_q47.png)"

        explanation = explanations_3d.EXAM_115_S2_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s2",
            "subject_name": "第二科：3D製程與材料概論",
            "chapter": "115年第一次歷屆試題",
            "assessmentTopic": "歷屆",
            "assessmentContent": "歷屆",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })
    return questions

def parse_sg_s1():
    filename = "3D列印概論(111年版)_20251223102010.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    reader = pypdf.PdfReader(pdf_path)

    # Answers map
    ch1_answers = {
        1: 'D', 2: 'D', 3: 'C', 4: 'C', 5: 'D', 6: 'D', 7: 'C', 8: 'C',
        9: 'C', 10: 'C', 11: 'A', 12: 'A', 13: 'C', 14: 'C'
    }
    ch2_answers = {
        1: 'D', 2: 'D', 3: 'A', 4: 'B', 5: 'D', 6: 'A', 7: 'D', 8: 'D',
        9: 'C', 10: 'A', 11: 'C', 12: 'D', 13: 'D', 14: 'A', 15: 'A',
        16: 'B', 17: 'C', 18: 'D', 19: 'A', 20: 'B'
    }

    questions = []

    # Parse Ch1: pages 21-23 (0-indexed: 20-22)
    ch1_text = "\n".join([reader.pages[i].extract_text() for i in range(20, 23)])
    pattern = re.compile(r'(?:^|\n)\s*(\d+)\.\s*')
    matches = list(pattern.finditer(ch1_text))
    # Filter 1..14
    ch1_matches = [m for m in matches if 1 <= int(m.group(1)) <= 14]

    for i in range(len(ch1_matches)):
        m = ch1_matches[i]
        num = int(m.group(1))
        start_idx = m.end()
        end_idx = ch1_matches[i+1].start() if i + 1 < len(ch1_matches) else len(ch1_text)
        block = ch1_text[start_idx:end_idx].strip()

        opt_pattern = re.compile(r'[\(（]([A-D])[\\)）]\s*(.*?)\s*(?=[\(（][A-D][\\)）]|;|$)', re.DOTALL)
        opts_found = opt_pattern.findall(block)

        stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-D][\\)）])', block, re.DOTALL)
        stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()

        options = ["", "", "", ""]
        for opt_letter, opt_text in opts_found:
            idx = ord(opt_letter.upper()) - ord('A')
            if 0 <= idx < 4:
                options[idx] = opt_text.replace('\n', ' ').strip().rstrip(';')

        # Link Ch1 diagrams
        if num == 5:
            stem += "\n\n![射出成型與積層製造製造成本比較圖](images/3d/sg_s1_c1_q5.png)"
        elif num == 10:
            stem += "\n\n![製程示意圖](images/3d/sg_s1_c1_q10.png)"

        ans = ch1_answers[num]
        explanation = explanations_3d.SG_S1_CH1_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s1",
            "subject_name": "第一科：3D列印概論",
            "chapter": "第一章 3D 列印技術與應用",
            "assessmentTopic": "S11",
            "assessmentContent": "S1101",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })

    # Parse Ch2: pages 51-53 (0-indexed: 50-53)
    ch2_text = "\n".join([reader.pages[i].extract_text() for i in range(50, 53)])
    matches = list(pattern.finditer(ch2_text))
    ch2_matches = [m for m in matches if 1 <= int(m.group(1)) <= 20]

    for i in range(len(ch2_matches)):
        m = ch2_matches[i]
        num = int(m.group(1))
        start_idx = m.end()
        end_idx = ch2_matches[i+1].start() if i + 1 < len(ch2_matches) else len(ch2_text)
        block = ch2_text[start_idx:end_idx].strip()

        opt_pattern = re.compile(r'[\(（]([A-D])[\\)）]\s*(.*?)\s*(?=[\(（][A-D][\\)）]|;|$)', re.DOTALL)
        opts_found = opt_pattern.findall(block)

        stem_match = re.search(r'^(.*?)\s*(?=[\(（][A-D][\\)）])', block, re.DOTALL)
        stem = stem_match.group(1).replace('\n', ' ').strip() if stem_match else block.replace('\n', ' ').strip()

        options = ["", "", "", ""]
        for opt_letter, opt_text in opts_found:
            idx = ord(opt_letter.upper()) - ord('A')
            if 0 <= idx < 4:
                options[idx] = opt_text.replace('\n', ' ').strip().rstrip(';')

        ans = ch2_answers[num]
        explanation = explanations_3d.SG_S1_CH2_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s1",
            "subject_name": "第一科：3D列印概論",
            "chapter": "第二章 3D 列印設備系統(ME 與VP 技術)",
            "assessmentTopic": "S12",
            "assessmentContent": "S1201",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })

    return questions

def parse_sg_s2():
    filename = "3D列印製程與材料概論(111年版)_20251223102116.pdf"
    pdf_path = os.path.join(pdf_dir, filename)
    reader = pypdf.PdfReader(pdf_path)

    questions = []

    # --- Chapter 1: 29 questions ---
    ch1_answers = {
        1: 'D', 2: 'D', 3: 'A', 4: 'C', 5: 'B', 6: 'A', 7: 'C', 8: 'A', 9: 'D',
        10: 'A', 11: 'D', 12: 'A', 13: 'A', 14: 'C', 15: 'B', 16: 'B', 17: 'A',
        18: 'D', 19: 'D', 20: 'B', 21: 'A', 22: 'B', 23: 'C', 24: 'D', 25: 'D',
        26: 'C', 27: 'A', 28: 'B', 29: 'A'
    }

    # Helper function to extract sequential blocks
    def extract_numbered_blocks(text, expected_count):
        pat = re.compile(r'(?:^|\n)\s*(\d+)\.\s*')
        matches = list(pat.finditer(text))
        res = []
        for i, m in enumerate(matches):
            val = int(m.group(1))
            if i > 0 and val != res[-1][0] + 1:
                break
            s_idx = m.end()
            e_idx = matches[i+1].start() if i + 1 < len(matches) else len(text)
            block = text[s_idx:e_idx].strip()
            opt_pat = re.compile(r'[\(（]([A-D])[\\)）]\s*(.*?)\s*(?=[\(（][A-D][\\)）]|;|$)', re.DOTALL)
            opts = [o[1].replace('\n', ' ').strip().rstrip(';') for o in opt_pat.findall(block)]
            stem_m = re.search(r'^(.*?)\s*(?=[\(（][A-D][\\)）])', block, re.DOTALL)
            stem = stem_m.group(1).replace('\n', ' ').strip() if stem_m else block.replace('\n', ' ').strip()
            res.append((val, stem, opts))
            if len(res) == expected_count:
                break
        return res

    # Ch1.1 (P9)
    p9 = reader.pages[8].extract_text()
    s_idx = p9.find('以下何者為正確 3D 列印模型與列印的描述？')
    b_p9 = p9[s_idx:]
    opt_pat = re.compile(r'[\(（]([A-D])[\\)）]\s*(.*?)\s*(?=[\(（][A-D][\\)）]|;|$)', re.DOTALL)
    opts_p9 = [o[1].replace('\n', ' ').strip().rstrip(';') for o in opt_pat.findall(b_p9)]
    stem_p9 = b_p9[:b_p9.find('(A)')].strip()
    raw_ch1 = [(1, stem_p9, opts_p9)]

    # Ch1.2 (P18)
    p18 = reader.pages[17].extract_text()
    p18_clean = p18[:p18.find('Ans (')] if 'Ans (' in p18 else p18
    raw_ch1.extend(extract_numbered_blocks(p18_clean, 6))

    # Ch1.3 (P38)
    p38 = reader.pages[37].extract_text()
    p38_clean = p38[:p38.find('Ans (')] if 'Ans (' in p38 else p38
    raw_ch1.extend(extract_numbered_blocks(p38_clean, 6))

    # Ch1 Review (P43-46)
    p43_46 = "\n".join([reader.pages[p].extract_text() for p in range(42, 46)])
    raw_ch1.extend(extract_numbered_blocks(p43_46, 16))

    for idx, (orig_num, stem, opts) in enumerate(raw_ch1):
        num = idx + 1
        options = ["", "", "", ""]
        for o_idx in range(min(4, len(opts))):
            options[o_idx] = opts[o_idx]

        # Link diagrams for Ch1
        if num == 14: # Rabbit CAD
            stem += "\n\n![CAD 繪製兔子模型](images/3d/sg_s2_c1_3_q1_stem.png)"
            options[0] = "![選項A](images/3d/sg_s2_c1_3_q1_a.png)"
            options[1] = "![選項B](images/3d/sg_s2_c1_3_q1_b.png)"
            options[2] = "![選項C](images/3d/sg_s2_c1_3_q1_c.png)"
            options[3] = "![選項D](images/3d/sg_s2_c1_3_q1_d.png)"
        elif num == 16: # Adaptive slicing
            stem += "\n\n![切層方式示意圖](images/3d/sg_s2_c1_3_q3.png)"
            options = ["固定厚切層", "適應性切層", "局部切層", "跳耀式切層"]
        elif num == 18: # Staircase
            stem += "\n\n![階梯效應示意圖](images/3d/sg_s2_c1_3_q5.png)"
        elif num == 19: # Hook
            stem += "\n\n![掛勾列印方式示意圖](images/3d/sg_s2_c1_3_q6_a.png)"
            options[0] = "![選項A](images/3d/sg_s2_c1_3_q6_a.png)"
            options[1] = "![選項B](images/3d/sg_s2_c1_3_q6_b.png)"
            options[2] = "![選項C](images/3d/sg_s2_c1_3_q6_c.png)"
            options[3] = "![選項D](images/3d/sg_s2_c1_3_q6_d.png)"
        elif num == 26: # Wedge
            stem += "\n\n![楔型模型](images/3d/sg_s2_c1_3_q13.png)"
        elif num == 27: # Support mandatory
            stem += "\n\n![倒勾特徵模型](images/3d/sg_s2_c1_3_q14_a.png)"
            options[0] = "![選項A](images/3d/sg_s2_c1_3_q14_a.png)"
            options[1] = "![選項B](images/3d/sg_s2_c1_3_q14_b.png)"
            options[2] = "![選項C](images/3d/sg_s2_c1_3_q14_c.png)"
            options[3] = "![選項D](images/3d/sg_s2_c1_3_q14_d.png)"
        elif num == 28: # Max area
            options[0] = "![選項A](images/3d/sg_s2_c1_3_q15_a.png)"
            options[1] = "![選項B](images/3d/sg_s2_c1_3_q15_b.png)"
            options[2] = "![選項C](images/3d/sg_s2_c1_3_q15_c.png)"
            options[3] = "![選項D](images/3d/sg_s2_c1_3_q15_d.png)"

        ans = ch1_answers[num]
        explanation = explanations_3d.SG_S2_CH1_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s2",
            "subject_name": "第二科：3D製程與材料概論",
            "chapter": "第一章 3D 建模(ME 及VP 技術)",
            "assessmentTopic": "S21",
            "assessmentContent": "S2101",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })

    # --- Chapter 2: 22 questions ---
    ch2_answers = {
        1: 'C', 2: 'A', 3: 'C', 4: 'D', 5: 'D', 6: 'D', 7: 'C', 8: 'D', 9: 'D',
        10: 'D', 11: 'D', 12: 'C', 13: 'D', 14: 'B', 15: 'A', 16: 'A', 17: 'B',
        18: 'A', 19: 'B', 20: 'D', 21: 'A', 22: 'D'
    }

    p55 = reader.pages[54].extract_text()
    p63 = reader.pages[62].extract_text()
    p71_72 = reader.pages[70].extract_text() + "\n" + reader.pages[71].extract_text()

    raw_ch2 = []
    raw_ch2.extend(extract_numbered_blocks(p55[:p55.find('Ans (')] if 'Ans (' in p55 else p55, 6))
    raw_ch2.extend(extract_numbered_blocks(p63[:p63.find('Ans (')] if 'Ans (' in p63 else p63, 4))
    raw_ch2.extend(extract_numbered_blocks(p71_72[:p71_72.find('Ans (')] if 'Ans (' in p71_72 else p71_72, 12))

    for idx, (orig_num, stem, opts) in enumerate(raw_ch2):
        num = idx + 1
        options = ["", "", "", ""]
        for o_idx in range(min(4, len(opts))):
            options[o_idx] = opts[o_idx]

        # Link Ch2 diagrams
        if num == 17: # Raft options
            options[0] = "![選項A](images/3d/sg_s2_c2_3_q7_a.png)"
            options[1] = "![選項B](images/3d/sg_s2_c2_3_q7_b.png)"
            options[2] = "![選項C](images/3d/sg_s2_c2_3_q7_c.png)"
            options[3] = "![選項D](images/3d/sg_s2_c2_3_q7_d.png)"

        ans = ch2_answers[num]
        explanation = explanations_3d.SG_S2_CH2_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s2",
            "subject_name": "第二科：3D製程與材料概論",
            "chapter": "第二章 3D 列印製程參數(ME 及VP 技術)",
            "assessmentTopic": "S22",
            "assessmentContent": "S2201",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })

    # --- Chapter 3: 22 questions ---
    ch3_answers = {
        1: 'D', 2: 'B', 3: 'D', 4: 'D', 5: 'B', 6: 'C', 7: 'A', 8: 'A', 9: 'B',
        10: 'A', 11: 'C', 12: 'D', 13: 'C', 14: 'B', 15: 'C', 16: 'D', 17: 'B',
        18: 'A', 19: 'C', 20: 'C', 21: 'C', 22: 'B'
    }

    p92 = reader.pages[91].extract_text()
    p97_98 = reader.pages[96].extract_text() + "\n" + reader.pages[97].extract_text()

    raw_ch3 = []
    raw_ch3.extend(extract_numbered_blocks(p92[:p92.find('Ans (')] if 'Ans (' in p92 else p92, 6))
    raw_ch3.extend(extract_numbered_blocks(p97_98[:p97_98.find('Ans (')] if 'Ans (' in p97_98 else p97_98, 16))

    for idx, (orig_num, stem, opts) in enumerate(raw_ch3):
        num = idx + 1
        options = ["", "", "", ""]
        for o_idx in range(min(4, len(opts))):
            options[o_idx] = opts[o_idx]

        ans = ch3_answers[num]
        explanation = explanations_3d.SG_S2_CH3_EXPLANATIONS.get(num, "")

        questions.append({
            "subject": "s2",
            "subject_name": "第二科：3D製程與材料概論",
            "chapter": "第三章 3D 列印材料概論(ME 及VP 技術)",
            "assessmentTopic": "S23",
            "assessmentContent": "S2301",
            "num": num,
            "stem": stem,
            "question": stem,
            "options": options,
            "answer": ans,
            "ans_text": f"標準答案：({ans})",
            "explanation": explanation
        })

    return questions

def main():
    print("Starting parse_3d_questions.py...")
    all_questions = []

    exam_s1 = parse_exam_115_s1()
    print(f"Parsed 115 S1: {len(exam_s1)} questions")
    all_questions.extend(exam_s1)

    exam_s2 = parse_exam_115_s2()
    print(f"Parsed 115 S2: {len(exam_s2)} questions")
    all_questions.extend(exam_s2)

    sg_s1 = parse_sg_s1()
    print(f"Parsed SG S1: {len(sg_s1)} questions")
    all_questions.extend(sg_s1)

    sg_s2 = parse_sg_s2()
    print(f"Parsed SG S2: {len(sg_s2)} questions")
    all_questions.extend(sg_s2)

    print(f"Total raw questions: {len(all_questions)}")

    # Sequential global id
    for i, q in enumerate(all_questions):
        q["id"] = i + 1

    # Enrich questions
    enriched = enrich_questions(
        CERT_ID,
        all_questions,
        source_version=SOURCE_VERSION,
    )
    print(f"Enriched questions: {len(enriched)}")

    # Output JSON
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    print(f"Successfully wrote {len(enriched)} questions to {output_json_path}")

    # Output JS
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("window.ipas3dQuestions = " + json.dumps(enriched, ensure_ascii=False, indent=2) + ";\n")
    print(f"Successfully wrote {len(enriched)} questions to {output_js_path}")

if __name__ == "__main__":
    main()
