# Agent Guide

## Project Context

This workspace collects iPAS certification study material, parsed question banks, generated notes, PDFs, lecture scripts/audio, and a browser-based mock exam app.

Primary working areas:

- `exam/`: Static mock exam app for GitHub Pages.
- `exam/index.html`: App shell and screens.
- `exam/script.js`: Exam flow, login checks, question loading, scoring, and UI behavior.
- `exam/style.css`: App styling.
- `exam/*questions.json`: Parsed question bank data.
- `exam/*questions.js`: Browser-loaded question bank wrappers.
- `Source/`: Read-only Markdown source notes for the lecture-script workflow.
- `out/`: Generated lecture TXT and offline MP3 files.
- `generate_lecture.py`: Converts `Source/*.md` into lecture scripts and audio.
- `parse_questions.py`: Parser for Operations Intelligence Analyst questions.
- `parse_ai_questions.py`: Parser for AI Application Planner junior questions.
- `parse_ai_mid_questions.py`: Parser for AI Application Planner intermediate questions.
- `convert_pdf.py`: Markdown-to-PDF conversion helper.
- `work_log.md`: Main handoff and work history.
- `README.md`: Project overview.
- `project-id.json`: Portable project identity marker for continuity tooling.

## Startup Checklist

1. Read `work_log.md` first to understand the latest handoff.
2. Read `README.md` for project structure and expected workflows.
3. Check whether the current folder or `exam/` is a git repository before using git commands. The current known state is that the root is the Git repository and `exam/` is not independent.
4. Inspect recently modified files before editing, especially `exam/index.html`, `exam/script.js`, and `exam/style.css`.
5. Preserve existing Chinese content and UTF-8 encoding.
6. When working on lecture audio, confirm the six `Source/*.md` inputs and the generated files under `out/` before regenerating.

## Editing Guidelines

- Keep changes scoped to the requested certificate, parser, or app behavior.
- Do not regenerate question bank files unless the parser or source material changed.
- When modifying `exam/`, verify that the static app still works by opening `exam/index.html`.
- Keep the app static and GitHub Pages friendly: no server-only dependencies.
- Avoid changing generated data manually when a parser should be the source of truth.
- Treat `Source/*.md` as the source of truth for lecture scripts; do not hand-edit generated `out/*.txt` or `out/*.mp3` files.
- Keep documentation counts and commands aligned with the files actually present in `exam/`, `Source/`, and `out/`.
- Update `work_log.md` when completing meaningful work.

## Common Commands

```powershell
# Regenerate question banks
python parse_questions.py
python parse_ai_questions.py
python parse_ai_mid_questions.py

# Convert Markdown notes to PDF
python convert_pdf.py

# Generate lecture scripts and offline MP3 files with local Codex rules + Windows SAPI
python generate_lecture.py --llm-engine codex --tts-engine sapi

# Generate one lecture by matching its source filename
python generate_lecture.py --only Week1 --llm-engine codex --tts-engine sapi

# Generate lecture TXT only, without audio
python generate_lecture.py --no-tts --llm-engine codex

# Serve the static app locally so fetch-based course notes work
python -m http.server 8000 --directory .
```

Use the project virtual environment if one is available.

## Current Notes

- The root is the active Git repository; `exam/` is a static application directory, not an independent repository.
- The current question-bank counts are 163 Operations Intelligence Analyst questions, 530 AI Application Planner junior questions, and 298 AI Application Planner intermediate questions. Confirm counts from the JSON files after parser changes.
- `Source/` currently contains six iPAS junior AI Application Planner Markdown notes. `out/` contains six generated TXT scripts and six offline MP3 files.
- The default lecture-audio path uses local Windows SAPI. Edge TTS sends lecture text to an external service and requires explicit authorization before use.
- Management continuity data belongs in the separate Project-Management hub; source-project documentation changes must not be mixed with management-hub Git operations.
