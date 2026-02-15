#!/usr/bin/env python3

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = Path(__file__).resolve().parent
CSV_PATH = OUTPUT_DIR / "header_nav_inventory.csv"
MD_PATH = OUTPUT_DIR / "header_nav_audit.md"


@dataclass
class Element:
	tag: str
	attrs: dict[str, str]
	text_chunks: list[str]
	line: int
	path: tuple[str, ...]
	path_hints: str

	def text(self) -> str:
		raw = " ".join(chunk.strip() for chunk in self.text_chunks if chunk.strip())
		normalized = re.sub(r"\s+", " ", raw).strip()
		return unescape(normalized)


class ControlParser(HTMLParser):
	def __init__(self) -> None:
		super().__init__(convert_charrefs=True)
		self.stack: list[tuple[str, dict[str, str]]] = []
		self.elements: list[Element] = []
		self.open_control_indices: list[int] = []

	def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
		attr_map = {key: (value or "") for key, value in attrs}
		self.stack.append((tag, attr_map))
		if tag in {"a", "button", "input", "select"}:
			path_hints = " ".join(
				f"{node_tag} {node_attrs.get('class', '')} {node_attrs.get('id', '')}" for node_tag, node_attrs in self.stack
			).lower()
			self.elements.append(
				Element(
					tag=tag,
					attrs=attr_map,
					text_chunks=[],
					line=self.getpos()[0],
					path=tuple(node_tag for node_tag, _ in self.stack),
					path_hints=path_hints,
				)
			)
			self.open_control_indices.append(len(self.elements) - 1)

	def handle_endtag(self, tag: str) -> None:
		while self.open_control_indices:
			current = self.elements[self.open_control_indices[-1]]
			if current.tag == tag:
				self.open_control_indices.pop()
				break
			if current.tag not in {node_tag for node_tag, _ in self.stack}:
				self.open_control_indices.pop()
				continue
			break

		if not self.stack:
			return
		for index in range(len(self.stack) - 1, -1, -1):
			if self.stack[index][0] == tag:
				del self.stack[index:]
				return

	def handle_data(self, data: str) -> None:
		if not data.strip() or not self.open_control_indices:
			return
		current = self.elements[self.open_control_indices[-1]]
		if current.tag in {"a", "button"}:
			current.text_chunks.append(data)


def find_html_files() -> list[Path]:
	files = sorted(ROOT.rglob("*.html"))
	return [path for path in files if "backups" not in path.parts and "docs/audits" not in path.parts]


def class_tokens(attrs: dict[str, str]) -> list[str]:
	classes = attrs.get("class", "")
	return sorted({token.strip() for token in classes.split() if token.strip()})


def detect_header_context(element: Element) -> bool:
	if any(tag in {"header", "nav"} for tag in element.path):
		return True

	header_hints = ("header", "topbar", "nav", "menu", "toolbar")
	attrs_blob = " ".join(element.attrs.values()).lower()
	return any(hint in attrs_blob for hint in header_hints) or any(
		hint in element.path_hints for hint in header_hints
	)


def infer_label(element: Element) -> str:
	if element.tag in {"a", "button"}:
		text = element.text()
		if text:
			return text
	if element.tag == "input":
		placeholder = element.attrs.get("placeholder", "").strip()
		if placeholder:
			return placeholder
		input_type = element.attrs.get("type", "text").strip() or "text"
		return f"input:{input_type}"
	if element.tag == "select":
		return element.attrs.get("id", "select") or "select"
	return element.tag


def infer_placement(path_tags: tuple[str, ...], attrs: dict[str, str]) -> str:
	class_blob = attrs.get("class", "").lower()
	if "menu-panel" in class_blob:
		return "header_menu_panel"
	if "menu-wrapper" in class_blob or "menu" in class_blob:
		return "header_menu"
	if "topbar" in class_blob:
		return "header_topbar"
	if "header-actions" in class_blob:
		return "header_actions"
	if "controls" in class_blob:
		return "header_controls"
	if "header" in " ".join(path_tags):
		return "header"
	return "other"


def parse_controls(file_path: Path) -> list[dict[str, str]]:
	parser = ControlParser()
	parser.feed(file_path.read_text(encoding="utf-8"))

	rows: list[dict[str, str]] = []
	for element in parser.elements:
		parent_hints = element.path_hints
		own_hints = " ".join(element.attrs.values()).lower()
		context_hints = f"{parent_hints} {own_hints} {' '.join(element.path).lower()}"
		in_header = detect_header_context(element)
		in_menu = "menu" in context_hints
		if not in_header and not in_menu:
			continue

		label = infer_label(element)
		row = {
			"file": file_path.relative_to(ROOT).as_posix(),
			"line": str(element.line),
			"control_type": element.tag,
			"label": label,
			"target": element.attrs.get("href", "") or element.attrs.get("id", ""),
			"id": element.attrs.get("id", ""),
			"classes": " ".join(class_tokens(element.attrs)),
			"is_menu_item": "yes" if in_menu else "no",
			"is_dropdown_trigger": "yes" if "trigger" in context_hints or "flyout" in context_hints else "no",
			"placement": infer_placement(element.path, element.attrs),
		}
		rows.append(row)
	return rows


def normalize_label(label: str) -> str:
	cleaned = re.sub(r"\s+", " ", label).strip().lower()
	cleaned = cleaned.replace("…", "...")
	return cleaned


def write_csv(rows: list[dict[str, str]]) -> None:
	fieldnames = [
		"file",
		"line",
		"control_type",
		"label",
		"target",
		"id",
		"classes",
		"is_menu_item",
		"is_dropdown_trigger",
		"placement",
	]
	with CSV_PATH.open("w", newline="", encoding="utf-8") as handle:
		writer = csv.DictWriter(handle, fieldnames=fieldnames)
		writer.writeheader()
		writer.writerows(rows)


def build_markdown(rows: list[dict[str, str]], html_files: list[Path]) -> str:
	page_to_rows: dict[str, list[dict[str, str]]] = defaultdict(list)
	for row in rows:
		page_to_rows[row["file"]].append(row)

	all_pages = [path.relative_to(ROOT).as_posix() for path in html_files]
	pages_without_controls = [page for page in all_pages if page not in page_to_rows]

	label_counter = Counter(normalize_label(row["label"]) for row in rows if row["label"].strip())
	placement_counter = Counter(row["placement"] for row in rows)
	class_counter = Counter(row["classes"] for row in rows if row["classes"])

	lines: list[str] = []
	lines.append("# Header Navigation Audit")
	lines.append("")
	lines.append(f"- Pages scanned: {len(all_pages)}")
	lines.append(f"- Header/menu controls found: {len(rows)}")
	lines.append(f"- Pages without header/menu controls: {len(pages_without_controls)}")
	lines.append("")

	lines.append("## Control Frequency")
	lines.append("")
	lines.append("| Control Label | Frequency |")
	lines.append("|---|---:|")
	for label, freq in label_counter.most_common(30):
		display = label if label else "(empty)"
		lines.append(f"| {display} | {freq} |")
	lines.append("")

	lines.append("## Placement Patterns")
	lines.append("")
	lines.append("| Placement | Count |")
	lines.append("|---|---:|")
	for placement, count in placement_counter.most_common():
		lines.append(f"| {placement} | {count} |")
	lines.append("")

	lines.append("## Style Token Patterns")
	lines.append("")
	lines.append("| Class Tokens | Count |")
	lines.append("|---|---:|")
	for classes, count in class_counter.most_common(20):
		lines.append(f"| {classes} | {count} |")
	lines.append("")

	lines.append("## Per-Page Header Controls")
	lines.append("")
	for page in all_pages:
		page_rows = page_to_rows.get(page, [])
		lines.append(f"### {page}")
		if not page_rows:
			lines.append("- No header/menu controls detected.")
			lines.append("")
			continue
		controls = sorted({row["label"] for row in page_rows if row["label"].strip()}, key=str.lower)
		lines.append(f"- Total controls: {len(page_rows)}")
		lines.append(f"- Unique labels: {len(controls)}")
		lines.append(f"- Controls: {', '.join(controls)}")
		lines.append("")

	lines.append("## Consistency Findings")
	lines.append("")
	lines.append("- Docs/reader pages follow the Main Menu panel pattern with `menu-link` controls.")
	lines.append("- The hub page uses direct topbar links instead of a menu panel.")
	lines.append("- Invite/quick pages currently omit header navigation controls.")
	lines.append("- Primary style classes vary between `button primary`, `button secondary`, and plain `nav-links a` patterns.")
	lines.append("")

	lines.append("## Cleanup Kickoff")
	lines.append("")
	lines.append("1. Define a single header contract for all Kybalion top-level pages (`home`, `reader`, `docs`, `auth`).")
	lines.append("2. Decide whether hub page should adopt the `Main Menu` pattern or docs/reader should expose direct links.")
	lines.append("3. Standardize button class tokens for global controls (`primary`, `secondary`, `menu-link`).")
	lines.append("4. Add explicit header controls to invite/quick pages or intentionally document their no-header design.")
	lines.append("")

	return "\n".join(lines)


def main() -> None:
	html_files = find_html_files()
	rows: list[dict[str, str]] = []
	for file_path in html_files:
		rows.extend(parse_controls(file_path))

	rows.sort(key=lambda row: (row["file"], int(row["line"]), row["label"].lower()))
	write_csv(rows)
	MD_PATH.write_text(build_markdown(rows, html_files), encoding="utf-8")

	print(f"Scanned {len(html_files)} HTML files")
	print(f"Found {len(rows)} header/menu controls")
	print(f"Wrote {CSV_PATH}")
	print(f"Wrote {MD_PATH}")


if __name__ == "__main__":
	main()
