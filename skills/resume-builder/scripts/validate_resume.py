#!/usr/bin/env python3
"""Small, dependency-light HTML/PDF resume validator."""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


class Check:
    def __init__(self, name: str, status: str, message: str):
        self.name = name
        self.status = status
        self.message = message

    def as_dict(self) -> dict[str, str]:
        return {"name": self.name, "status": self.status, "message": self.message}


class ResumeHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.h1_count = 0
        self.h1_text: list[str] = []
        self.sections: list[dict[str, Any]] = []
        self.visible_parts: list[str] = []
        self._ignored_depth = 0
        self._svg_depth = 0
        self._section_stack: list[dict[str, Any]] = []
        self._h1_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "template"}:
            self._ignored_depth += 1
        if tag == "svg":
            self._svg_depth += 1
        if tag == "h1":
            self.h1_count += 1
            self._h1_depth += 1
        if tag == "section":
            section = {"has_h2": False}
            self.sections.append(section)
            self._section_stack.append(section)
        if tag == "h2" and self._section_stack:
            self._section_stack[-1]["has_h2"] = True

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "section" and self._section_stack:
            self._section_stack.pop()
        if tag == "h1" and self._h1_depth:
            self._h1_depth -= 1
        if tag == "svg" and self._svg_depth:
            self._svg_depth -= 1
        if tag in {"script", "style", "template"} and self._ignored_depth:
            self._ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._ignored_depth or self._svg_depth:
            return
        if data.strip():
            self.visible_parts.append(data)
            if self._h1_depth:
                self.h1_text.append(data)


def add(checks: list[Check], name: str, status: str, message: str) -> None:
    checks.append(Check(name, status, message))


def read_html(path: Path, checks: list[Check]) -> str | None:
    try:
        data = path.read_bytes()
    except OSError as exc:
        add(checks, "HTML file", "fail", f"cannot read {path}: {exc}")
        return None
    try:
        html = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        add(checks, "UTF-8", "fail", f"HTML is not valid UTF-8: {exc}")
        return None
    add(checks, "UTF-8", "pass", "HTML decoded as UTF-8")
    return html


def validate_html(html: str, mode: str, required: list[str], checks: list[Check]) -> None:
    parser = ResumeHTMLParser()
    try:
        parser.feed(html)
        parser.close()
    except Exception as exc:  # HTMLParser is permissive, but malformed input must report clearly.
        add(checks, "HTML parsing", "fail", f"could not parse HTML: {exc}")
        return

    lang = re.search(r"<html\b[^>]*\blang\s*=\s*([\"'])(.*?)\1", html, re.I | re.S)
    if lang and lang.group(2).strip():
        add(checks, "HTML lang", "pass", f"lang={lang.group(2).strip()}")
    else:
        add(checks, "HTML lang", "fail", "<html> must have a non-empty lang attribute")

    if parser.h1_count == 1:
        add(checks, "exactly one h1", "pass", "found exactly one h1")
    else:
        add(checks, "exactly one h1", "fail", f"found {parser.h1_count} h1 elements")

    if parser.sections and all(section["has_h2"] for section in parser.sections):
        add(checks, "section headings", "pass", "every section has an h2")
    elif parser.sections:
        missing = sum(not section["has_h2"] for section in parser.sections)
        add(checks, "section headings", "fail", f"{missing} section(s) do not have an h2")
    else:
        add(checks, "section headings", "warn", "no section elements found")

    visible_text = " ".join(parser.visible_parts).strip()
    if visible_text and " ".join(parser.h1_text).strip():
        add(checks, "text content", "pass", "key content is present as HTML text, not only img/svg")
    else:
        add(checks, "text content", "fail", "key content must be extractable HTML text, not only img/svg")

    for text in required:
        if text in visible_text:
            add(checks, f"required text: {text}", "pass", "found in HTML text")
        else:
            add(checks, f"required text: {text}", "fail", "required text is missing from HTML text")

    if mode == "visual":
        if re.search(r"(?:fonts\.googleapis\.com|@import\s+url\s*\(\s*['\"]?https?://|@font-face[\s\S]{0,500}url\s*\(\s*https?://)", html, re.I):
            add(checks, "external fonts", "warn", "external font resources may make rendering non-reproducible")
        relative = re.findall(
            r"<(?:link|img|script)\b[^>]*(?:href|src)\s*=\s*['\"](?!https?://|data:|#|/)([^'\"]+)",
            html,
            re.I,
        )
        if relative:
            add(checks, "relative resources", "warn", "relative resources may depend on the working directory")
    else:
        ats_rules = [
            (r"<img\b", "img", "ATS mode rejects img elements"),
            (r"<svg\b", "svg", "ATS mode rejects svg elements"),
            (r"<table\b", "table", "ATS mode rejects table layout"),
            (r"overflow(?:-x|-y)?\s*:\s*hidden\b", "overflow hidden", "ATS mode rejects overflow hidden"),
        ]
        for pattern, name, message in ats_rules:
            if re.search(pattern, html, re.I):
                add(checks, name, "fail", message)
        multi_column = re.search(
            r"(?:grid-template-columns\s*:\s*(?:repeat\s*\(\s*[2-9]|[^;{}]*\S+\s+\S+)|column-count\s*:\s*[2-9]|columns\s*:\s*[2-9])",
            html,
            re.I,
        )
        if multi_column:
            add(checks, "multi-column CSS", "fail", "ATS mode rejects obvious multi-column CSS")
        toolbar_fixed = re.search(
            r"(?:toolbar[^{]{0,120}\{[^}]*position\s*:\s*fixed|position\s*:\s*fixed[^}]{0,120}toolbar)",
            html,
            re.I | re.S,
        )
        if toolbar_fixed:
            add(checks, "fixed toolbar", "fail", "ATS mode rejects position: fixed toolbar")


def pdf_literal_text(data: bytes) -> str:
    raw = data.decode("latin-1", errors="ignore")
    pieces: list[str] = []
    for match in re.finditer(r"\(((?:\\.|[^()\\])*)\)\s*T[Jj]", raw):
        value = match.group(1)
        value = re.sub(r"\\([\\()])", r"\1", value)
        value = value.replace(r"\n", "\n").replace(r"\r", "\r")
        pieces.append(value)
    return "\n".join(pieces)


def validate_pdf(path: Path, required: list[str], checks: list[Check]) -> None:
    try:
        data = path.read_bytes()
    except OSError as exc:
        add(checks, "PDF file", "fail", f"cannot read {path}: {exc}")
        return

    text = ""
    page_count: int | None = None
    try:
        from pypdf import PdfReader  # Optional dependency; fallback below remains stdlib-only.

        reader = PdfReader(str(path))
        page_count = len(reader.pages)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except (ImportError, Exception):
        page_count = len(re.findall(rb"/Type\s*/Page(?:\s|/|>)", data))
        text = pdf_literal_text(data)

    if page_count and page_count > 0:
        add(checks, "PDF page count", "pass", f"{page_count} page(s)")
    else:
        add(checks, "PDF page count", "fail", "no PDF pages detected")
    if text.strip():
        add(checks, "PDF text extraction", "pass", "text can be extracted")
    else:
        add(checks, "PDF text extraction", "fail", "no extractable text found")
    for value in required:
        if value in text:
            add(checks, f"required text: {value}", "pass", "found in PDF text")
        else:
            add(checks, f"required text: {value}", "fail", "required text is missing from PDF text")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate HTML/PDF resume output")
    parser.add_argument("--html", type=Path)
    parser.add_argument("--mode", choices=("visual", "ats"), default="visual")
    parser.add_argument("--pdf", type=Path)
    parser.add_argument("--required-text", nargs="+", default=[], metavar="TEXT")
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--check-overflow", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    checks: list[Check] = []
    if not args.html and not args.pdf:
        add(checks, "input", "fail", "provide --html and/or --pdf")
    if args.html:
        html = read_html(args.html, checks)
        if html is not None:
            validate_html(html, args.mode, args.required_text, checks)
            if args.check_overflow:
                add(checks, "overflow measurement", "warn", "browser layout measurement not available in this script")
    if args.pdf:
        validate_pdf(args.pdf, args.required_text, checks)

    ok = not any(check.status == "fail" for check in checks)
    report = {
        "ok": ok,
        "checks": [check.as_dict() for check in checks],
        "summary": {
            "pass": sum(check.status == "pass" for check in checks),
            "warn": sum(check.status == "warn" for check in checks),
            "fail": sum(check.status == "fail" for check in checks),
        },
    }
    if args.as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        for check in checks:
            print(f"[{check.status.upper()}] {check.name}: {check.message}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
