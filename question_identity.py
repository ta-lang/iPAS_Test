"""Deterministic identity and content metadata for iPAS question banks."""

from __future__ import annotations

import hashlib
import re
import unicodedata
from typing import Any, Iterable


def normalize_text(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value or ""))
    return re.sub(r"\s+", " ", text).strip().lower()


def _digest(parts: Iterable[Any]) -> str:
    canonical = "\x1f".join(normalize_text(part) for part in parts)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def make_source_id(cert_id: str, question: dict[str, Any]) -> str:
    source_digest = _digest((cert_id, question.get("subject"), question.get("chapter")))
    return f"{cert_id}-{source_digest[:16]}"


def make_question_uid(cert_id: str, question: dict[str, Any]) -> str:
    display_num = question.get("display_num", question.get("num"))
    source_id = question.get("source_id") or make_source_id(cert_id, question)
    identity_digest = _digest((
        cert_id,
        source_id,
        question.get("subject"),
        question.get("chapter"),
        display_num,
    ))
    return f"{cert_id}-{identity_digest[:24]}"


def make_content_hash(question: dict[str, Any]) -> str:
    options = question.get("options") or []
    return _digest((
        question.get("question"),
        *options,
        question.get("answer"),
        question.get("ans_text"),
        question.get("explanation"),
    ))


def enrich_questions(
    cert_id: str,
    questions: Iterable[dict[str, Any]],
    *,
    source_version: str,
) -> list[dict[str, Any]]:
    enriched_questions: list[dict[str, Any]] = []
    seen_uids: set[str] = set()

    for original in questions:
        question = dict(original)
        question["display_num"] = question.get("display_num", question.get("num"))
        question["source_id"] = question.get("source_id") or make_source_id(cert_id, question)
        question["source_version"] = str(question.get("source_version") or source_version)
        question["question_uid"] = make_question_uid(cert_id, question)
        question["content_hash"] = make_content_hash(question)

        if question["question_uid"] in seen_uids:
            raise ValueError(f"duplicate question_uid: {question['question_uid']}")
        seen_uids.add(question["question_uid"])
        enriched_questions.append(question)

    return enriched_questions
