#!/usr/bin/env python3
"""
將 Source/ 中的 Markdown 筆記轉換為口語化講稿，並透過 edge-tts 產生 MP3。
"""

import asyncio
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import tempfile
from pathlib import Path

SOURCE_DIR = Path("Source")
OUT_DIR = Path("out")
PARTS_DIR = OUT_DIR / ".parts"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# zh-TW 友善女聲
TTS_VOICE = "zh-TW-HsiaoChenNeural"
TTS_RATE = "+0%"
TTS_VOLUME = "+0%"

SYSTEM_PROMPT = """你是一位經驗豐富的 iPAS 證照輔考老師，擅長將枯燥的考試教材轉換為生動的口語講課內容。

請將以下教材內容改寫為「老師上課風格的講稿」。規則如下：

1. 全部使用繁體中文，口語化，像老師在課堂上對學生講話。
2. 去除所有表格、條列符號（-、*、數字列表），改成自然的解說敘述。
3. 每 3-5 句加入一次「朗讀節奏」指示，用【節奏指示】標記，例如：
   - 【稍作停頓】表示自然換氣
   - 【重點，加重語氣】表示強調關鍵概念
   - 【停頓三秒】表示給聽眾思考時間
   - 【放慢速度】表示重要或困難的概念
   - 【加快速度】表示輕鬆或過渡內容
4. 關鍵專有名詞出現時，重複一次並附上英文。例如：「弱人工智慧，也就是 ANI，ANI 就是 Artificial Narrow Intelligence 的縮寫。」
5. 適時加入考試提醒與記憶技巧，例如：「這個觀念考試很愛考，你可以這樣記：⋯⋯」
6. 每個章節長度控制在約 5-10 分鐘的講課量（約 800-1500 字中文）。
7. 如果內容有練習題，將練習題融入講解中作為教學案例，而非單純列出題目。
8. 使用「同學們」「各位同學」「我們來看看」「第一個重點是」「千萬要注意」等教學用語。

直接輸出講稿內容，不要有前言說明。"""


def parse_args():
    parser = argparse.ArgumentParser(
        description="將 Source/*.md 分段轉為口語講稿，並透過 edge-tts 產生 MP3。"
    )
    parser.add_argument("--model", default="qwen2.5:3b", help="Ollama 模型名稱")
    parser.add_argument("--only", help="只處理檔名包含此關鍵字的 Markdown")
    parser.add_argument("--no-tts", action="store_true", help="只產生講稿文字，不產生 MP3")
    parser.add_argument("--tts-engine", choices=("sapi", "edge"), default="sapi", help="TTS 引擎：sapi 為 Windows 本機離線語音，edge 為雲端 Edge TTS")
    parser.add_argument("--sapi-voice", default="Microsoft Hanhan Desktop", help="Windows SAPI 語音名稱")
    parser.add_argument("--edge-voice", default=TTS_VOICE, help="Edge TTS 語音名稱")
    parser.add_argument("--llm-engine", choices=("ollama", "codex"), default="ollama", help="講稿產生方式：ollama 呼叫本機模型，codex 使用本機 Markdown 轉講稿規則")
    parser.add_argument("--force-llm", action="store_true", help="忽略既有講稿與分段快取，重新呼叫 Ollama")
    parser.add_argument("--max-chars", type=int, default=2200, help="每段送入 Ollama 的最大字元數")
    parser.add_argument("--max-chunks", type=int, help="每個檔案最多處理幾段，方便小量測試")
    parser.add_argument("--timeout", type=int, default=240, help="單段 Ollama 呼叫逾時秒數")
    parser.add_argument("--pause", type=float, default=0.5, help="每段 Ollama 呼叫後暫停秒數")
    return parser.parse_args()


def output_stem(index: int, md_path: Path) -> str:
    """產生穩定、短一點的輸出檔名，避免沿用過長來源檔名。"""
    stem = md_path.stem
    stem = stem.replace("iPAS 初級 AI 應用規劃師-", "")
    return f"{index:02d}-{stem}"


def source_sort_key(path: Path) -> tuple[int, str]:
    """讓輸出順序符合課程閱讀順序，而非單純 Unicode 排序。"""
    name = path.stem
    order = [
        ("衝刺學習計劃", 1),
        ("Week1", 2),
        ("Week2", 3),
        ("Week3", 4),
        ("Week4", 5),
        ("總複習", 6),
    ]
    for keyword, rank in order:
        if keyword in name:
            return rank, name
    return 99, name


def markdown_to_codex_lecture(content: str, title: str) -> str:
    """不依賴外部 LLM，將 Markdown 轉成適合本機 TTS 的老師口吻講稿。"""
    lines = content.splitlines()
    lecture: list[str] = [
        f"同學們，今天我們要一起複習的是：{title}。",
        "這份內容我會用考前衝刺的方式帶大家走過一次。請你一邊聽，一邊抓住關鍵名詞、比較型題目，以及考試常見的陷阱。",
        "【稍作停頓】",
    ]
    pending_items: list[str] = []

    def clean_text(text: str) -> str:
        text = re.sub(r"`([^`]+)`", r"\1", text)
        text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
        text = re.sub(r"\*([^*]+)\*", r"\1", text)
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
        text = text.replace("|", "，")
        text = re.sub(r"\s+", " ", text)
        return text.strip(" -\t")

    def flush_items():
        nonlocal pending_items
        if not pending_items:
            return
        if len(pending_items) == 1:
            lecture.append(f"這裡有一個重點：{pending_items[0]}。")
        else:
            lecture.append("這裡有幾個重點，我們依序看。")
            for item in pending_items:
                lecture.append(f"第一個觀念要記住：{item}。" if item == pending_items[0] else f"接著是：{item}。")
        lecture.append("【重點，加重語氣】")
        pending_items = []

    in_code = False
    table_buffer: list[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            flush_items()
            continue

        if line.startswith("```"):
            flush_items()
            in_code = not in_code
            lecture.append("接下來這段是程式或範例內容，我們抓它的用途與關鍵字即可。")
            continue
        if in_code:
            text = clean_text(line)
            if text:
                lecture.append(f"範例中出現：{text}。")
            continue

        if line.startswith("|"):
            text = clean_text(line)
            if text and not set(text.replace("，", "").replace("-", "").strip()) <= {" "}:
                table_buffer.append(text)
            continue
        if table_buffer:
            lecture.append("表格內容可以整理成這樣來記：")
            for item in table_buffer[:8]:
                lecture.append(f"{item}。")
            if len(table_buffer) > 8:
                lecture.append("其餘表格細節請回到講義對照，聽課時先掌握分類邏輯。")
            lecture.append("【稍作停頓】")
            table_buffer = []

        heading = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading:
            flush_items()
            heading_text = clean_text(heading.group(2))
            level = len(heading.group(1))
            if level <= 2:
                lecture.append(f"接下來進入一個大主題：{heading_text}。")
            else:
                lecture.append(f"這一小節的重點是：{heading_text}。")
            lecture.append("【稍作停頓】")
            continue

        item = re.match(r"^[-*+]\s+(.+)$", line) or re.match(r"^\d+[.)、]\s+(.+)$", line)
        if item:
            text = clean_text(item.group(1))
            if text:
                pending_items.append(text)
            continue

        quote = re.match(r"^>\s*(.+)$", line)
        if quote:
            flush_items()
            text = clean_text(quote.group(1))
            if text:
                lecture.append(f"這段提醒很重要：{text}。")
                lecture.append("【放慢速度】")
            continue

        text = clean_text(line)
        if text:
            flush_items()
            lecture.append(f"我們來看這句：{text}。")

    flush_items()
    if table_buffer:
        lecture.append("最後一個表格重點是：")
        for item in table_buffer[:8]:
            lecture.append(f"{item}。")

    lecture.extend(
        [
            "最後幫大家收斂一下。這一份講義最重要的不是逐字背誦，而是把關鍵名詞、使用情境、優缺點與風險管理連在一起。",
            "考試遇到題目時，先判斷它在問定義、流程、工具選型，還是風險控管。這樣作答會穩很多。",
            "【停頓三秒】",
            "這一回合複習到這裡，下一段我們再繼續。",
        ]
    )
    return "\n\n".join(lecture)


def split_markdown(content: str, max_chars: int) -> list[str]:
    """依標題與段落切分 Markdown，降低單次 LLM 呼叫的逾時風險。"""
    blocks = re.split(r"(?m)(?=^#{1,4}\s+)", content)
    chunks: list[str] = []
    current = ""

    def flush():
        nonlocal current
        text = current.strip()
        if text:
            chunks.append(text)
        current = ""

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        if len(block) > max_chars:
            flush()
            paragraphs = re.split(r"\n\s*\n", block)
            for paragraph in paragraphs:
                paragraph = paragraph.strip()
                if not paragraph:
                    continue
                if len(current) + len(paragraph) + 2 > max_chars:
                    flush()
                current = f"{current}\n\n{paragraph}".strip()
            continue

        if len(current) + len(block) + 2 > max_chars:
            flush()
        current = f"{current}\n\n{block}".strip()

    flush()
    return chunks


def call_ollama(content: str, model: str, timeout: int) -> str:
    """呼叫 Ollama API 將內容轉換為口語講稿。"""
    payload = {
        "model": model,
        "prompt": f"{SYSTEM_PROMPT}\n\n---\n\n{content}\n\n---\n\n請輸出上述教材的口語化講稿：",
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 4096},
    }
    import urllib.request

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("response", "").strip()
    except Exception as e:
        print(f"  [錯誤] Ollama 呼叫失敗: {e}")
        return ""


def strip_rhythm_tags(text: str) -> str:
    """移除【節奏指示】標記，回傳純文字供 TTS。"""
    return re.sub(r"【[^】]*】", "", text).strip()


def tts_file_sapi(text: str, output_path: Path, voice: str):
    """使用 Windows SAPI 本機離線語音產生 WAV，再用 ffmpeg 轉 MP3。"""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("找不到 ffmpeg，無法將本機 TTS 的 WAV 轉為 MP3")

    cleaned = strip_rhythm_tags(text)
    if not cleaned:
        return

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        text_path = temp_path / "lecture.txt"
        wav_path = temp_path / "lecture.wav"
        ps1_path = temp_path / "sapi_tts.ps1"
        text_path.write_text(cleaned, encoding="utf-8")

        ps1_path.write_text(
            "\n".join(
                [
                    "param(",
                    "    [string]$TextPath,",
                    "    [string]$WavPath,",
                    "    [string]$VoiceName",
                    ")",
                    "$text = Get-Content -Raw -Encoding UTF8 -LiteralPath $TextPath",
                    "Add-Type -AssemblyName System.Speech",
                    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
                    "$s.SelectVoice($VoiceName)",
                    "$s.Rate = 0",
                    "$s.Volume = 100",
                    "$s.SetOutputToWaveFile($WavPath)",
                    "$s.Speak($text)",
                    "$s.Dispose()",
                ]
            ),
            encoding="utf-8",
        )
        subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ps1_path),
                str(text_path),
                str(wav_path),
                voice,
            ],
            check=True,
        )
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(wav_path),
                "-codec:a",
                "libmp3lame",
                "-q:a",
                "4",
                str(output_path),
            ],
            check=True,
        )
    print(f"  [OK] MP3 已儲存: {output_path.name}")


async def tts_file_edge(text: str, output_path: Path, voice: str):
    """使用 edge-tts 產生 MP3。"""
    import edge_tts

    cleaned = strip_rhythm_tags(text)
    if not cleaned:
        return
    communicate = edge_tts.Communicate(cleaned, voice, rate=TTS_RATE, volume=TTS_VOLUME)
    await communicate.save(str(output_path))
    print(f"  [OK] MP3 已儲存: {output_path.name}")


async def process_file(index: int, md_path: Path, args):
    """處理單一檔案：讀取 → LLM 轉講稿 → edge-tts 產 MP3。"""
    print(f"\n{'='*60}")
    print(f"處理: {md_path.name}")
    print(f"{'='*60}")

    content = md_path.read_text(encoding="utf-8")
    stem = output_stem(index, md_path)
    output_name = stem
    if args.max_chunks:
        output_name = f"{stem}.sample-{args.max_chunks}chunks"
    out_txt = OUT_DIR / f"{output_name}.txt"
    out_mp3 = OUT_DIR / f"{output_name}.mp3"

    print(f"  原始長度: {len(content)} 字元")

    if out_txt.exists() and not args.force_llm:
        lecture = out_txt.read_text(encoding="utf-8")
        print(f"  [續跑] 使用既有講稿: {out_txt.name}")
    elif args.llm_engine == "codex":
        print("  使用 Codex 本機 Markdown 轉講稿規則...")
        lecture = markdown_to_codex_lecture(content, md_path.stem)
        out_txt.write_text(lecture, encoding="utf-8")
        print(f"  [OK] 講稿已儲存: {out_txt.name}")
    else:
        chunks = split_markdown(content, args.max_chars)
        if args.max_chunks:
            chunks = chunks[: args.max_chunks]
            print(f"  [測試] 限制處理前 {len(chunks)} 段")
        print(f"  已切分為 {len(chunks)} 段，每段約 {args.max_chars} 字元以內")

        part_dir = PARTS_DIR / output_name
        part_dir.mkdir(parents=True, exist_ok=True)
        lectures = []

        for chunk_index, chunk in enumerate(chunks, start=1):
            part_path = part_dir / f"{chunk_index:02d}.txt"
            if part_path.exists() and not args.force_llm:
                part_text = part_path.read_text(encoding="utf-8").strip()
                print(f"  [續跑] 第 {chunk_index}/{len(chunks)} 段已存在")
            else:
                print(f"  呼叫 Ollama 轉換第 {chunk_index}/{len(chunks)} 段...")
                part_text = call_ollama(chunk, args.model, args.timeout)
                if not part_text:
                    print(f"  [中止] 第 {chunk_index} 段 Ollama 回傳空內容")
                    break
                part_path.write_text(part_text, encoding="utf-8")
                time.sleep(args.pause)
            lectures.append(part_text)

        lecture = "\n\n".join(text for text in lectures if text).strip()
        if not lecture:
            print("  [略過] 沒有可用講稿內容")
            return

        out_txt.write_text(lecture, encoding="utf-8")
        print(f"  [OK] 講稿已儲存: {out_txt.name}")

    print(f"  講稿長度: {len(lecture)} 字元")

    if args.no_tts:
        print("  [略過] --no-tts 已啟用，不產生 MP3")
        return

    if args.tts_engine == "edge":
        print(f"  產生 MP3 中 (Edge TTS 語音: {args.edge_voice})...")
        await tts_file_edge(lecture, out_mp3, args.edge_voice)
    else:
        print(f"  產生 MP3 中 (本機 SAPI 語音: {args.sapi_voice})...")
        tts_file_sapi(lecture, out_mp3, args.sapi_voice)


async def main():
    args = parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PARTS_DIR.mkdir(parents=True, exist_ok=True)

    md_files = sorted(SOURCE_DIR.glob("*.md"), key=source_sort_key)
    if args.only:
        md_files = [path for path in md_files if args.only in path.name]
    if not md_files:
        print(f"錯誤: {SOURCE_DIR} 中沒有 .md 檔案")
        sys.exit(1)

    print(f"找到 {len(md_files)} 個 .md 檔案")
    for f in md_files:
        print(f"  - {f.name}")

    for index, md_file in enumerate(md_files, start=1):
        await process_file(index, md_file, args)

    print(f"\n{'='*60}")
    print(f"全部完成！輸出檔案在 {OUT_DIR}/ 目錄中")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
