#!/usr/bin/env python3
"""Generate stanza-based JSON from the Kybalion HTML edition."""
from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path

HTML_PATH = Path(__file__).parent / "pg14209-images.html"
OUT_PATH = Path(__file__).parent / "data" / "kybalion.json"

CHAPTER_RE = re.compile(r"^chapter\s+([ivxlcdm]+|\d+)$", re.IGNORECASE)
INTRO_RE = re.compile(r"^introduction$", re.IGNORECASE)
START_RE = re.compile(r"\*\*\* START OF THE PROJECT GUTENBERG EBOOK", re.IGNORECASE)
END_RE = re.compile(r"\*\*\* END OF THE PROJECT GUTENBERG EBOOK", re.IGNORECASE)


def _clean_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


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


class _PGParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_body = False
        self.capture = False
        self.current_tag = None
        self.buffer: list[str] = []
        self.items: list[tuple[str, str]] = []
        self.in_content = False
        self.end_reached = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "body":
            self.in_body = True
        if not self.in_body or not self.in_content or self.end_reached:
            return
        if tag in {"h3", "h5", "p"}:
            self.current_tag = tag
            self.buffer = []
            self.capture = True
        if tag == "br" and self.capture:
            self.buffer.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag == "body":
            self.in_body = False
        if not self.in_body or not self.in_content or self.end_reached:
            return
        if tag == self.current_tag and self.capture:
            text = _clean_text("".join(self.buffer))
            if text:
                self.items.append((tag, text))
            self.current_tag = None
            self.capture = False

    def handle_data(self, data: str) -> None:
        if START_RE.search(data):
            self.in_content = True
        if END_RE.search(data):
            self.end_reached = True
            self.in_content = False
        if self.capture and self.in_content and not self.end_reached:
            self.buffer.append(data)


def _extract_body_items(html: str) -> list[tuple[str, str]]:
    parser = _PGParser()
    parser.feed(html)
    return parser.items


def _build_chapters(html: str) -> list[dict]:
    items = _extract_body_items(html)

    chapters: list[dict] = []
    current = None
    pending_title = False
    started = False

    for tag, text in items:
        upper = text.strip().upper()

        if tag == "h3" and INTRO_RE.match(text.strip().lower()):
            current = {"number": 0, "title": "Introduction", "raw": []}
            chapters.append(current)
            pending_title = False
            started = True
            continue

        if tag == "h3" and CHAPTER_RE.match(text.strip().lower()):
            started = True
            match = CHAPTER_RE.match(text.strip().lower())
            chapter_id = match.group(1)
            number = int(chapter_id) if chapter_id.isdigit() else None
            if number is None:
                roman_map = {
                    "i": 1,
                    "ii": 2,
                    "iii": 3,
                    "iv": 4,
                    "v": 5,
                    "vi": 6,
                    "vii": 7,
                    "viii": 8,
                    "ix": 9,
                    "x": 10,
                    "xi": 11,
                    "xii": 12,
                    "xiii": 13,
                    "xiv": 14,
                    "xv": 15,
                }
                number = roman_map.get(chapter_id.lower())

            current = {"number": number or 0, "title": f"Chapter {chapter_id.upper()}", "raw": []}
            chapters.append(current)
            pending_title = True
            continue

        if not started:
            continue

        if current is None:
            continue

        if pending_title and tag == "h5":
            current["title"] = f"{current['title']} — {text.title()}"
            pending_title = False
            continue

        if tag == "h5":
            current["raw"].append("<<BREAK>>")
            current["raw"].append(text)
            current["raw"].append("<<BREAK>>")
            continue

        if tag == "p":
            if _force_stanza_break(text):
                current["raw"].append("<<BREAK>>")
                current["raw"].append(text)
                current["raw"].append("<<BREAK>>")
            else:
                current["raw"].append(text)

    return chapters


def _chapter_to_stanzas(chapter: dict) -> list[dict]:
    raw = " ".join(chapter["raw"]).strip()
    raw = raw.replace("<<BREAK>>", "\n<<BREAK>>\n")
    has_pages = "<<PAGE:" in raw
    tokens = [t.strip() for t in raw.split("<<PAGE:") if t.strip()] if has_pages else [raw]

    stanzas: list[dict] = []
    stanza_index = 1

    for token in tokens:
        if has_pages and ">>" in token:
            label, rest = token.split(">>", 1)
            page_label = label.strip()
            chunk = rest.strip()
        else:
            page_label = None
            chunk = token.strip()
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
                        "page": page_label if page_label else None,
                        "text": stanza,
                    }
                )
                stanza_index += 1

    return stanzas


def generate() -> dict:
    html = HTML_PATH.read_text(encoding="utf-8", errors="ignore")
    chapters_raw = _build_chapters(html)

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
