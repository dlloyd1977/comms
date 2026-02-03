#!/usr/bin/env python3
"""Generate stanza-based JSON from the Kybalion PDF."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterable

from PyPDF2 import PdfReader

PDF_PATH = Path(__file__).parent / "the_kybalion_ebook.pdf"
OUT_PATH = Path(__file__).parent / "data" / "kybalion.json"

ROMAN_RE = re.compile(r"^[ivxlcdm]+", re.IGNORECASE)
CHAPTER_RE = re.compile(r"^chapter\s+([ivxlcdm]+|\d+)\.?$", re.IGNORECASE)
INTRO_RE = re.compile(r"^introduction\.?$", re.IGNORECASE)
DOT_LEADER_RE = re.compile(r"\.{3,}|…")

KNOWN_HEADERS = {
    "the kybalion",
    "the hermetic philosophy",
    "the seven hermetic principles",
    "mental transmutation",
    "the all",
    "the mental universe",
    "the divine paradox",
    "the all in all",
    "the planes of correspondence",
    "vibration",
    "polarity",
    "rhythm",
    "causation",
    "gender",
    "mental gender",
    "hermetic axioms",
}


def _strip_running_header(line: str) -> str:
    cleaned = line.strip()
    if not cleaned:
        return cleaned

    normalized = re.sub(r"[“”\"'’]", "", cleaned).lower().strip()
    for header in KNOWN_HEADERS:
        if normalized.startswith(header):
            pattern = re.compile(rf"^{re.escape(header)}\s*\d*", re.IGNORECASE)
            stripped = pattern.sub("", cleaned).strip()
            return stripped if stripped else ""

    return cleaned


def _clean_line(line: str) -> str:
    line = line.replace("\u00a0", " ")
    line = " ".join(line.strip().split())
    line = _strip_running_header(line)
    return " ".join(line.strip().split())


def _pull_page_label(lines: list[str]) -> str | None:
    if not lines:
        return None
    first = lines[0]
    if first.lower() == "the kybalion":
        lines.pop(0)
        if not lines:
            return None
        first = lines[0]

    stripped = first.lstrip()
    if not stripped:
        return None

    match = re.match(r"^([ivxlcdm]{2,})(?=[A-Za-z])", stripped, re.IGNORECASE)
    if not match:
        match = re.match(r"^([IVXLCDM])(?=[A-Z])", stripped)
    if not match:
        match = re.match(r"^(\d+)(?=[A-Za-z])", stripped)
    if not match:
        match = re.match(r"^([ivxlcdm]+)$", stripped, re.IGNORECASE)
    if not match:
        match = re.match(r"^(\d+)$", stripped)

    if not match:
        return None

    label = match.group(1)
    remainder = stripped[len(label):].lstrip()
    if remainder:
        lines[0] = remainder
    else:
        lines.pop(0)
    return label


def _pull_inline_page_label(lines: list[str]) -> str | None:
    if not lines:
        return None

    for idx in range(min(2, len(lines))):
        candidate = lines[idx].lstrip()
        match = re.match(r"^([ivxlcdm]{2,})(?=[A-Za-z])", candidate, re.IGNORECASE)
        if not match:
            match = re.match(r"^(\d+)(?=[A-Za-z])", candidate)
        if not match:
            continue

        label = match.group(1)
        remainder = candidate[len(label):].lstrip()
        lines[idx] = remainder
        return label

    return None


def _is_heading_line(line: str) -> bool:
    return bool(CHAPTER_RE.match(line) or INTRO_RE.match(line))


def _is_toc_line(line: str) -> bool:
    return bool(DOT_LEADER_RE.search(line))


def _is_short_quote(line: str) -> bool:
    if len(line) > 150:
        return False
    return line.startswith("\"") or line.startswith("“")


def _force_stanza_break(line: str) -> bool:
    return bool(
        re.match(r"^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\.\s+", line)
        or _is_short_quote(line)
    )


def _normalize_text(text: str) -> str:
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _split_into_stanzas(text: str) -> list[str]:
    if not text:
        return []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    stanzas: list[str] = []
    current: list[str] = []
    current_len = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if current and (current_len + len(sentence) > 520 or len(current) >= 3):
            stanzas.append(" ".join(current).strip())
            current = []
            current_len = 0
        current.append(sentence)
        current_len += len(sentence)

    if current:
        stanzas.append(" ".join(current).strip())

    return [s for s in stanzas if s]


def _iter_pages(reader: PdfReader) -> Iterable[dict]:
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        cleaned_lines = []
        for raw in text.splitlines():
            cleaned = _clean_line(raw)
            if cleaned:
                cleaned_lines.append(cleaned)
        label = _pull_page_label(cleaned_lines)
        inline_label = _pull_inline_page_label(cleaned_lines)
        if not label and inline_label:
            label = inline_label
        yield {"index": index, "label": label, "lines": cleaned_lines}


def _build_chapters(reader: PdfReader) -> list[dict]:
    pages = list(_iter_pages(reader))
    all_lines: list[tuple[str, str]] = []
    for page in pages:
        page_label = page["label"] or str(page["index"])
        for line in page["lines"]:
            all_lines.append((page_label, line))

    start_index = 0
    for idx, (_, line) in enumerate(all_lines):
        clean = line.strip().strip(".")
        if INTRO_RE.match(clean):
            start_index = idx
            break

    chapters: list[dict] = []
    current = None
    pending_title = None
    started = False

    last_page_label = None

    for page_label, line in all_lines[start_index:]:
        if _is_toc_line(line):
            continue

        clean = line.strip().strip(".")

        if not started and INTRO_RE.match(clean):
            started = True
            current = {
                "number": 0,
                "title": "Introduction",
                "raw": [f"<<PAGE:{page_label}>>"],
            }
            chapters.append(current)
            pending_title = None
            last_page_label = page_label
            continue

        if CHAPTER_RE.match(clean):
            started = True
            match = CHAPTER_RE.match(clean)
            chapter_id = match.group(1)
            number = int(chapter_id) if chapter_id.isdigit() else None
            if number is None:
                roman_map = {
                    "I": 1,
                    "II": 2,
                    "III": 3,
                    "IV": 4,
                    "V": 5,
                    "VI": 6,
                    "VII": 7,
                    "VIII": 8,
                    "IX": 9,
                    "X": 10,
                    "XI": 11,
                    "XII": 12,
                    "XIII": 13,
                    "XIV": 14,
                    "XV": 15,
                }
                number = roman_map.get(chapter_id.upper())

            current = {
                "number": number or 0,
                "title": f"Chapter {chapter_id}",
                "raw": [f"<<PAGE:{page_label}>>"],
            }
            chapters.append(current)
            pending_title = True
            last_page_label = page_label
            continue

        if not started:
            continue

        if current is None:
            continue

        if page_label != last_page_label:
            current["raw"].append(f"<<PAGE:{page_label}>>")
            last_page_label = page_label

        if pending_title:
            pending_title = None
            current["title"] = f"{current['title']} — {line.strip()}"
            continue

        if line and current["raw"] and not current["raw"][-1].startswith("<<PAGE:"):
            current["raw"].append(" ")

        if _force_stanza_break(line):
            current["raw"].append("<<BREAK>>")
            current["raw"].append(line)
            current["raw"].append("<<BREAK>>")
        else:
            current["raw"].append(line)

    return chapters


def _chapter_to_stanzas(chapter: dict) -> list[dict]:
    raw = " ".join(chapter["raw"]).strip()
    raw = raw.replace("<<BREAK>>", "\n<<BREAK>>\n")
    tokens = [t.strip() for t in raw.split("<<PAGE:") if t.strip()]

    stanzas: list[dict] = []
    stanza_index = 1

    for token in tokens:
        if ">>" not in token:
            continue
        label, rest = token.split(">>", 1)
        page_label = label.strip()
        chunk = rest.strip()
        if not chunk:
            continue

        parts = [p.strip() for p in chunk.split("<<BREAK>>") if p.strip()]
        for part in parts:
            normalized = _normalize_text(part)
            if not normalized:
                continue
            for stanza in _split_into_stanzas(normalized):
                stanzas.append(
                    {
                        "ref": f"{chapter['number']}:{stanza_index}",
                        "page": page_label,
                        "text": stanza,
                    }
                )
                stanza_index += 1

    return stanzas


def generate() -> dict:
    reader = PdfReader(str(PDF_PATH))
    chapters_raw = _build_chapters(reader)

    chapters = []
    for chapter in chapters_raw:
        stanzas = _chapter_to_stanzas(chapter)
        chapters.append(
            {
                "number": chapter["number"],
                "title": chapter["title"],
                "stanzas": stanzas,
            }
        )

    return {
        "title": "The Kybalion — Annotated Facilitator Edition",
        "chapters": chapters,
    }


def main() -> None:
    data = generate()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    total_stanzas = sum(len(ch["stanzas"]) for ch in data["chapters"])
    print(f"Chapters: {len(data['chapters'])}")
    print(f"Total stanzas: {total_stanzas}")
    print(f"Output: {OUT_PATH}")


if __name__ == "__main__":
    main()
