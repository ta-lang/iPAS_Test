# Agent Guide

## Project Context

This workspace collects iPAS certification study material, parsed question banks, generated notes, PDFs, and a browser-based mock exam app.

Primary working areas:

- `exam/`: Static mock exam app for GitHub Pages.
- `exam/index.html`: App shell and screens.
- `exam/script.js`: Exam flow, login checks, question loading, scoring, and UI behavior.
- `exam/style.css`: App styling.
- `exam/*questions.json`: Parsed question bank data.
- `exam/*questions.js`: Browser-loaded question bank wrappers.
- `parse_questions.py`: Parser for Operations Intelligence Analyst questions.
- `parse_ai_questions.py`: Parser for AI Application Planner junior questions.
- `parse_ai_mid_questions.py`: Parser for AI Application Planner intermediate questions.
- `convert_pdf.py`: Markdown-to-PDF conversion helper.
- `work_log.md`: Main handoff and work history.
- `README.md`: Project overview.

## Startup Checklist

1. Read `work_log.md` first to understand the latest handoff.
2. Read `README.md` for project structure and expected workflows.
3. Check whether the current folder or `exam/` is a git repository before using git commands.
4. Inspect recently modified files before editing, especially `exam/index.html`, `exam/script.js`, and `exam/style.css`.
5. Preserve existing Chinese content and UTF-8 encoding.

## Editing Guidelines

- Keep changes scoped to the requested certificate, parser, or app behavior.
- Do not regenerate question bank files unless the parser or source material changed.
- When modifying `exam/`, verify that the static app still works by opening `exam/index.html`.
- Keep the app static and GitHub Pages friendly: no server-only dependencies.
- Avoid changing generated data manually when a parser should be the source of truth.
- Update `work_log.md` when completing meaningful work.

## Common Commands

```powershell
# Regenerate question banks
python parse_questions.py
python parse_ai_questions.py
python parse_ai_mid_questions.py

# Convert Markdown notes to PDF
python convert_pdf.py
```

Use the project virtual environment if one is available.

## Current Notes

- Root may not be a git repository.
- `exam/` was previously documented as a GitHub Pages app, but verify `.git` exists before assuming deploy status.
- The mock exam currently includes Operations Intelligence Analyst, AI Application Planner junior, and AI Application Planner intermediate question sets.
