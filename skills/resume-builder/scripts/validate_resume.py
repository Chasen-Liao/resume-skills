#!/usr/bin/env python3
"""Small, dependency-light HTML/PDF resume validator."""

from __future__ import annotations

import argparse
import hashlib
import html as html_lib
import json
import math
import re
import struct
import subprocess
import sys
import unicodedata
import zlib
from tempfile import NamedTemporaryFile
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


class Check:
    def __init__(self, name: str, status: str, message: str):
        self.name = name
        self.status = status
        self.message = message

    def as_dict(self) -> dict[str, str]:
        return {"name": self.name, "status": self.status, "message": self.message}


HTML_BLOCK_TAGS = {
    "address", "article", "aside", "blockquote", "br", "dd", "div", "dl", "dt",
    "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6",
    "header", "hgroup", "hr", "li", "main", "nav", "ol", "p", "pre", "section",
    "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
}


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

    def _append_block_separator(self) -> None:
        if self._ignored_depth or self._svg_depth:
            return
        if self.visible_parts and not self.visible_parts[-1].endswith(" "):
            self.visible_parts.append(" ")
        if self._h1_depth and self.h1_text and not self.h1_text[-1].endswith(" "):
            self.h1_text.append(" ")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "template"}:
            self._ignored_depth += 1
        if tag == "svg":
            self._svg_depth += 1
        if tag in HTML_BLOCK_TAGS:
            self._append_block_separator()
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
        if tag in HTML_BLOCK_TAGS:
            self._append_block_separator()
        if tag == "svg" and self._svg_depth:
            self._svg_depth -= 1
        if tag in {"script", "style", "template"} and self._ignored_depth:
            self._ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._ignored_depth or self._svg_depth:
            return
        collapsed = re.sub(r"\s+", " ", data)
        if collapsed:
            self.visible_parts.append(collapsed)
            if self._h1_depth:
                self.h1_text.append(collapsed)


def add(checks: list[Check], name: str, status: str, message: str) -> None:
    checks.append(Check(name, status, message))


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def preview_metadata(path: Path) -> dict[str, Any] | None:
    """Read PNG dimensions and verify chunk boundaries and CRCs without decoding pixels."""
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if data[:8] != bytes.fromhex("89504e470d0a1a0a"):
        return None
    offset = 8
    width = height = 0
    has_pixels = False
    while offset + 12 <= len(data):
        size = struct.unpack_from(">I", data, offset)[0]
        end = offset + 8 + size
        if end + 4 > len(data):
            return None
        kind = data[offset + 4:offset + 8]
        if zlib.crc32(memoryview(data)[offset + 4:end]) != struct.unpack_from(">I", data, end)[0]:
            return None
        if offset == 8:
            if kind != b"IHDR" or size != 13:
                return None
            width, height = struct.unpack_from(">II", data, offset + 8)
            if not (0 < width < 2**31 and 0 < height < 2**31):
                return None
        elif kind == b"IDAT" and size:
            has_pixels = True
        elif kind == b"IEND":
            if not has_pixels or size or end + 4 != len(data):
                return None
            return {"path": str(path.resolve()), "sha256": hashlib.sha256(data).hexdigest(),
                    "width": width, "height": height}
        offset = end + 4
    return None


def validate_preview(path: Path, checks: list[Check]) -> dict[str, Any] | None:
    metadata = preview_metadata(path)
    if metadata is None:
        add(checks, "preview", "fail", "预览不存在或 PNG 文件不完整")
    else:
        add(checks, "preview", "pass", f"整页预览 {metadata['width']}×{metadata['height']}px")
    return metadata


def parse_renderer(value: str) -> dict[str, str]:
    name, separator, version = value.rpartition("@")
    if not separator or not name or not version or "unknown" in (name, version):
        raise ValueError("renderer must use NAME@VERSION, for example playwright@1.62.1")
    return {"name": name, "version": version}


def verify_manifest_record(
    manifest: dict[str, Any], html_path: Path | None, pdf_path: Path | None, renderer_value: str | None,
    checks: list[Check],
) -> None:
    if manifest.get("schemaVersion") != 1:
        add(checks, "manifest schema", "fail", "schemaVersion must be 1")
    renderer = manifest.get("renderer")
    if not isinstance(renderer, dict) or not all(
        isinstance(renderer.get(key), str) and renderer[key] and renderer[key] != "unknown"
        for key in ("name", "version")
    ):
        add(checks, "manifest renderer", "fail", "renderer must contain non-empty name and version")
    elif renderer_value:
        try:
            expected_renderer = parse_renderer(renderer_value)
        except ValueError as exc:
            add(checks, "manifest renderer", "fail", str(exc))
        else:
            add(
                checks,
                "manifest renderer",
                "pass" if renderer == expected_renderer else "fail",
                "renderer matches" if renderer == expected_renderer else "renderer does not match",
            )

    validation = manifest.get("validation")
    stored_checks = validation.get("checks") if isinstance(validation, dict) else None
    validation_is_deliverable = False
    valid_statuses = {"pass", "warn", "fail", "degraded"}
    checks_are_valid = isinstance(stored_checks, list) and all(
        isinstance(item, dict) and isinstance(item.get("name"), str)
        and isinstance(item.get("status"), str) and item["status"] in valid_statuses for item in stored_checks
    )
    if not checks_are_valid:
        add(checks, "manifest validation", "fail", "validation.checks must be a list of checks with valid statuses")
    else:
        passed = {item.get("name") for item in stored_checks if item["status"] == "pass"}
        expected_deliverable = (
            {"UTF-8", "PDF text extraction", "PDF reading order"} <= passed
            and validation.get("scope", "html+pdf") == "html+pdf"
            and not any(item["status"] in {"fail", "degraded"} for item in stored_checks)
        )
        consistent = (
            isinstance(validation.get("ok"), bool)
            and isinstance(validation.get("deliverable"), bool)
            and validation["ok"] == validation["deliverable"] == expected_deliverable
        )
        validation_is_deliverable = consistent and expected_deliverable
        add(
            checks,
            "manifest validation",
            "pass" if consistent else "fail",
            "validation result matches recorded checks" if consistent else "validation.ok/deliverable contradict recorded checks",
        )

    if manifest.get("status") != "valid" or not validation_is_deliverable:
        add(checks, "manifest status", "fail", "manifest is not a valid deliverable")
    html_record = manifest.get("html") if isinstance(manifest.get("html"), dict) else {}
    html_matches = bool(
        html_path
        and isinstance(html_record.get("path"), str)
        and html_path.is_file()
        and Path(html_record["path"]).resolve() == html_path.resolve()
        and html_record.get("sha256") == file_hash(html_path)
    )
    add(
        checks, "manifest HTML hash", "pass" if html_matches else "fail",
        "HTML path and hash match the validated manifest" if html_matches else "HTML path or hash does not match the validated manifest",
    )
    pdf_record = manifest.get("pdf") if isinstance(manifest.get("pdf"), dict) else {}
    pdf_matches = bool(
        pdf_path
        and isinstance(pdf_record.get("path"), str)
        and pdf_path.is_file()
        and Path(pdf_record["path"]).resolve() == pdf_path.resolve()
        and pdf_record.get("sha256") == file_hash(pdf_path)
    )
    add(
        checks, "manifest PDF hash", "pass" if pdf_matches else "fail",
        "PDF path and hash match the validated manifest" if pdf_matches else "PDF path or hash does not match the validated manifest",
    )
    preview_record = manifest.get("preview")
    if preview_record is not None:
        preview_record = preview_record if isinstance(preview_record, dict) else {}
        stored_path = preview_record.get("path")
        metadata = preview_metadata(Path(stored_path)) if isinstance(stored_path, str) else None
        preview_matches = metadata is not None and all(
            metadata[key] == preview_record.get(key) for key in ("sha256", "width", "height")
        )
        add(
            checks, "manifest preview hash", "pass" if preview_matches else "fail",
            "preview path and hash match the validated manifest" if preview_matches else "preview path or hash does not match the validated manifest",
        )


def check_html_overflow(
    path: Path, layout_script: Path, checks: list[Check], min_fill_ratio: float = 0.98,
) -> dict[str, Any] | None:
    command = ["node", str(layout_script), "--html", str(path)]
    if min_fill_ratio != 0.98:
        command.extend(["--min-fill-ratio", str(min_fill_ratio)])
    try:
        result = subprocess.run(
            command,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=60,
        )
        measurement = json.loads(result.stdout)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as exc:
        add(checks, "overflow measurement", "degraded", f"Playwright layout measurement unavailable: {exc}")
        return
    status = measurement.get("status")
    if status not in {"pass", "fail", "degraded"}:
        status = "degraded"
    add(checks, "overflow measurement", status, measurement.get("message", "layout measurement returned no message"))
    return measurement.get("layout")


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

    visible_text = re.sub(r"\s+", " ", "".join(parser.visible_parts)).strip()
    h1_text = re.sub(r"\s+", " ", "".join(parser.h1_text)).strip()
    if visible_text and h1_text:
        add(checks, "text content", "pass", "key content is present as HTML text, not only img/svg")
    else:
        add(checks, "text content", "fail", "key content must be extractable HTML text, not only img/svg")

    for text in required:
        normalized_required = re.sub(r"\s+", " ", text).strip()
        if text in visible_text or (normalized_required and normalized_required in visible_text):
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


def measure_pdf_text_bounds(page: Any, spans: list[tuple[float, float]] | None = None) -> tuple[float, float] | None:
    """Return the top and bottom text bounds in PDF coordinates."""
    bounds: list[tuple[float, float]] = []

    def visit_text(
        text: str,
        cm: Any,
        tm: Any,
        _font_dict: Any,
        font_size: Any,
    ) -> None:
        if not text.strip():
            return
        try:
            y = (float(tm[4]) * float(cm[1])) + (float(tm[5]) * float(cm[3])) + float(cm[5])
            size = float(font_size or 10)
        except (TypeError, ValueError, IndexError):
            return
        bounds.append((y + size, y - (size * 0.25)))

    try:
        page.extract_text(visitor_text=visit_text)
    except Exception:
        return None
    if not bounds:
        return None
    if spans is not None:
        spans.extend(bounds)
    return max(item[0] for item in bounds), min(item[1] for item in bounds)


VOID_HTML_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
CORRUPTED_CHAR_RANGES = (
    (0x2F00, 0x2FDF, "Kangxi Radical (U+2F00..U+2FDF)"),
    (0x2E80, 0x2EFF, "CJK Radicals Supplement (U+2E80..U+2EFF)"),
    (0xE000, 0xF8FF, "Private Use Area (U+E000..U+F8FF)"),
)
DEMO_MARKER_RE = re.compile(r"DEMO\s*[·・.]\s*虚构示例内容")


class HTMLReadingOrderParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []
        self.landmarks: list[dict[str, Any]] = []
        self._open_tags: list[tuple[str, bool]] = []
        self._ignored_depth = 0
        self._landmark_stack: list[dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in VOID_HTML_TAGS:
            if tag == "br" and self._landmark_stack and self._ignored_depth == 0:
                self._landmark_stack[-1]["parts"].append(" ")
            return
        attr_map = {name.lower(): (value or "") for name, value in attrs}
        classes = set(attr_map.get("class", "").split())
        ignored_here = (
            tag in {"head", "script", "style", "template", "svg"}
            or "hidden" in attr_map
            or attr_map.get("aria-hidden", "").lower() == "true"
            or "no-print" in classes
            or attr_map.get("role", "").lower() == "note"
        )
        self._open_tags.append((tag, ignored_here))
        if ignored_here:
            self._ignored_depth += 1
            return
        if self._ignored_depth == 0 and (
            tag in {"h1", "h2", "li", "p"}
            or ("summary-text" in classes and not self._landmark_stack)
            or ("summary-block" in classes and not self._landmark_stack)
        ):
            entry: dict[str, Any] = {"tag": tag, "parts": []}
            self.landmarks.append(entry)
            self._landmark_stack.append(entry)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID_HTML_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in VOID_HTML_TAGS:
            return
        for idx in range(len(self._open_tags) - 1, -1, -1):
            if self._open_tags[idx][0] == tag:
                popped = self._open_tags[idx:]
                del self._open_tags[idx:]
                for popped_tag, ignored_here in reversed(popped):
                    if ignored_here and self._ignored_depth:
                        self._ignored_depth -= 1
                    elif self._landmark_stack and self._landmark_stack[-1]["tag"] == popped_tag:
                        self._landmark_stack.pop()
                break

    def handle_data(self, data: str) -> None:
        if self._ignored_depth:
            return
        self.text_parts.append(data)
        if self._landmark_stack and data:
            self._landmark_stack[-1]["parts"].append(data)


def _normalize_order_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value)
    cleaned = re.sub(r"[\s\u200b-\u200f\ufeff\xad]+", "", normalized)
    return re.sub(r"^[•·▪▫◦‣⁃–—\-\*\u2022]+", "", cleaned)


def extract_html_landmarks(html_text: str) -> list[tuple[str, str]]:
    parser = HTMLReadingOrderParser()
    parser.feed(html_text)
    parser.close()
    items: list[tuple[str, str]] = []
    for entry in parser.landmarks:
        text = "".join(entry["parts"]).strip()
        if _normalize_order_key(text):
            items.append((entry["tag"], text))
    return items


def _deref_pdf_obj(obj: Any) -> Any:
    return obj.get_object() if hasattr(obj, "get_object") else obj


def _collect_fonts_from_resources(
    resources: Any,
    page_number: int,
    found: list[dict[str, Any]],
    visited_refs: set[tuple[int, int]],
) -> None:
    res = _deref_pdf_obj(resources)
    if not isinstance(res, dict):
        return
    fonts = _deref_pdf_obj(res.get("/Font"))
    if isinstance(fonts, dict):
        for alias, raw_font in fonts.items():
            font = _deref_pdf_obj(raw_font)
            if isinstance(font, dict):
                found.append(
                    {
                        "page": page_number,
                        "alias": str(alias),
                        "subtype": str(font.get("/Subtype", "")),
                        "base_font": str(font.get("/BaseFont", "")),
                    }
                )
    xobjects = _deref_pdf_obj(res.get("/XObject"))
    if isinstance(xobjects, dict):
        for raw_xobj in xobjects.values():
            if hasattr(raw_xobj, "idnum") and hasattr(raw_xobj, "generation"):
                ref_key = (raw_xobj.idnum, raw_xobj.generation)
            else:
                ref = getattr(raw_xobj, "indirect_reference", None)
                ref_key = (ref.idnum, ref.generation) if ref is not None else (id(raw_xobj), 0)
            if ref_key in visited_refs:
                continue
            visited_refs.add(ref_key)
            xobj = _deref_pdf_obj(raw_xobj)
            if not isinstance(xobj, dict):
                continue
            if str(xobj.get("/Subtype", "")) in {"/Form", "Form"} and "/Resources" in xobj:
                _collect_fonts_from_resources(xobj.get("/Resources"), page_number, found, visited_refs)


def collect_pdf_fonts(reader: Any) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    visited_refs: set[tuple[int, int]] = set()
    for page_number, page in enumerate(reader.pages, start=1):
        _collect_fonts_from_resources(page.get("/Resources"), page_number, found, visited_refs)
    return found


def _is_identity_matrix(matrix: Any) -> bool:
    try:
        values = [float(matrix[i]) for i in range(6)]
    except (TypeError, ValueError, IndexError):
        return False
    expected = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    return all(abs(values[i] - expected[i]) < 1e-4 for i in range(6))


def collect_pdf_stream_spans(page: Any) -> list[tuple[float, float, str]]:
    """Extract PDF text spans in content-stream emission order as (x, y, text)."""
    spans: list[tuple[float, float, str]] = []
    mediabox = getattr(page, "mediabox", None)
    page_width = float(mediabox.width) if mediabox is not None else None
    page_height = float(mediabox.height) if mediabox is not None else None

    def visit_text(
        text: str,
        cm: Any,
        tm: Any,
        _font_dict: Any,
        _font_size: Any,
    ) -> None:
        if not text.strip():
            return
        try:
            cm_vals = [float(cm[i]) for i in range(6)]
            tm_vals = [float(tm[i]) for i in range(6)]
        except (TypeError, ValueError, IndexError):
            return
        # pypdf fires synthetic flush callbacks with identity tm under flipped cm (cm[3] < 0).
        if cm_vals[3] < 0 and _is_identity_matrix(tm_vals):
            return
        x = (tm_vals[4] * cm_vals[0]) + (tm_vals[5] * cm_vals[2]) + cm_vals[4]
        y = (tm_vals[4] * cm_vals[1]) + (tm_vals[5] * cm_vals[3]) + cm_vals[5]
        if page_width is not None and (x < -2.0 or x > page_width + 2.0):
            return
        if page_height is not None and (y < -2.0 or y > page_height + 2.0):
            return
        spans.append((x, y, text.strip()))

    try:
        page.extract_text(visitor_text=visit_text)
    except Exception:
        return []
    return spans


def check_pdf_fonts(reader: Any, raw_data: bytes, checks: list[Check]) -> None:
    if reader is not None:
        fonts = collect_pdf_fonts(reader)
        type3 = [item for item in fonts if item["subtype"] in {"/Type3", "Type3"}]
        if type3:
            details = ", ".join(
                f"p{item['page']} {item['alias']} ({item['base_font'] or 'Type3'})"
                for item in type3[:4]
            )
            add(
                checks,
                "PDF fonts",
                "fail",
                f"detected Type3 fallback font(s): {details}; likely glyph/spacing corruption",
            )
        else:
            add(checks, "PDF fonts", "pass", f"checked {len(fonts)} font resource(s); no Type3 fallback fonts")
        return

    if re.search(rb"/Subtype\s*/Type3\b", raw_data):
        add(checks, "PDF fonts", "fail", "detected /Subtype /Type3 fallback font in PDF stream")
    else:
        add(checks, "PDF fonts", "pass", "no uncompressed Type3 fallback font markers detected")


def check_pdf_text_quality(text: str, source_html: str | None, checks: list[Check]) -> None:
    if not text.strip():
        return
    issues: list[str] = []

    if "\ufffd" in text:
        issues.append("replacement character U+FFFD")
    for low, high, label in CORRUPTED_CHAR_RANGES:
        hits = [ch for ch in text if low <= ord(ch) <= high]
        if hits:
            sample = "".join(dict.fromkeys(hits[:4]))
            codes = ", ".join(f"U+{ord(ch):04X}" for ch in dict.fromkeys(hits[:4]))
            issues.append(f"{label}: {sample!r} ({codes})")

    source_visible_text: str | None = None
    decoded_source: str | None = None
    if source_html is not None:
        parser = ResumeHTMLParser()
        parser.feed(source_html)
        parser.close()
        source_visible_text = "".join(parser.visible_parts)
        decoded_source = html_lib.unescape(source_html)

    if "\u2212" in text and (decoded_source is None or "\u2212" not in decoded_source):
        issues.append("unexpected U+2212 minus sign (−) substituted in PDF text")
    if DEMO_MARKER_RE.search(text):
        issues.append("template placeholder watermark 'DEMO · 虚构示例内容' leaked into PDF")
    if "</>" in text and (source_visible_text is None or "</>" not in source_visible_text):
        issues.append("template pseudo-element artifact '</>' leaked into PDF text")

    if issues:
        add(checks, "PDF text quality", "fail", "; ".join(issues))
    else:
        add(checks, "PDF text quality", "pass", "no corrupted glyphs, unauthorized U+2212, or template markers detected")


def check_pdf_reading_order(reader: Any, text: str, source_html: str | None, checks: list[Check],
                            *, ats: bool = False) -> None:
    if not text.strip():
        return

    if ats and source_html is not None:
        parser = HTMLReadingOrderParser()
        parser.feed(source_html)
        parser.close()
        norm_pdf = _normalize_order_key(text)
        cursor = 0
        for part in parser.text_parts:
            key = _normalize_order_key(part)
            if not key:
                continue
            pos = norm_pdf.find(key, cursor)
            if pos < 0:
                add(checks, "PDF reading order", "fail",
                    f"HTML text missing or out of order in extracted PDF: {part.strip()[:60]}")
                return
            cursor = pos + len(key)
    elif source_html is not None:
        norm_pdf = _normalize_order_key(text)
        landmarks = extract_html_landmarks(source_html)
        located: list[tuple[str, str, str, int, int]] = []
        for tag, raw_text in landmarks:
            key = _normalize_order_key(raw_text)
            if len(key) < (2 if tag in {"h1", "h2"} else 4):
                continue
            first_pos = norm_pdf.find(key)
            if first_pos == -1:
                continue
            located.append((tag, raw_text, key, first_pos, norm_pdf.rfind(key)))

        for i in range(len(located)):
            tag_a, raw_a, key_a, first_a, _ = located[i]
            if tag_a not in {"h1", "h2", "li"}:
                continue
            for j in range(i + 1, len(located)):
                tag_b, raw_b, key_b, _, last_b = located[j]
                if key_a in key_b or key_b in key_a:
                    continue
                if first_a > last_b:
                    add(
                        checks,
                        "PDF reading order",
                        "fail",
                        f"HTML <{tag_a}> '{raw_a[:24]}' appears after later <{tag_b}> '{raw_b[:24]}' in extracted PDF text",
                    )
                    return

    if reader is not None:
        for page_idx, page in enumerate(reader.pages, start=1):
            spans = collect_pdf_stream_spans(page)
            anchors: list[tuple[float, float, str]] = []
            for x, y, snippet in spans:
                if anchors and abs(y - anchors[-1][1]) <= 4.0 and x >= anchors[-1][0] - 2.0:
                    continue
                for prev_x, prev_y, prev_snippet in anchors:
                    if abs(x - prev_x) <= 45.0 and (y - prev_y) > 36.0:
                        add(
                            checks,
                            "PDF reading order",
                            "fail",
                            f"page {page_idx} PDF stream jumps upward to '{snippet[:24]}' (x={x:.1f}, y={y:.1f}) after lower '{prev_snippet[:24]}' (x={prev_x:.1f}, y={prev_y:.1f})",
                        )
                        return
                anchors.append((x, y, snippet))

    if source_html is not None:
        add(checks, "PDF reading order", "pass", "checked PDF stream order against source HTML")
    elif reader is not None:
        add(checks, "PDF stream order", "pass", "checked stream geometry; source HTML was not supplied")


CJK_OR_FULLWIDTH_CLASS = (
    r"\u3000-\u303f"
    r"\u3040-\u309f"
    r"\u30a0-\u30ff"
    r"\u3400-\u4dbf"
    r"\u4e00-\u9fff"
    r"\uf900-\ufaff"
    r"\uff00-\uffef"
)
_CJK_TO_NON_CJK_SPACE_RE = re.compile(
    rf"([{CJK_OR_FULLWIDTH_CLASS}])\s+([^\s{CJK_OR_FULLWIDTH_CLASS}])"
)
_NON_CJK_TO_CJK_SPACE_RE = re.compile(
    rf"([^\s{CJK_OR_FULLWIDTH_CLASS}])\s+([{CJK_OR_FULLWIDTH_CLASS}])"
)


def normalize_pdf_matching_text(value: str) -> str:
    """Collapse repeated whitespace and pypdf's CJK/non-CJK boundary spaces without erasing real intra-script spaces."""
    collapsed = re.sub(r"\s+", " ", value).strip()
    collapsed = _CJK_TO_NON_CJK_SPACE_RE.sub(r"\1\2", collapsed)
    return _NON_CJK_TO_CJK_SPACE_RE.sub(r"\1\2", collapsed)


def text_contains_required(haystack: str, needle: str) -> bool:
    if needle in haystack:
        return True
    normalized_needle = normalize_pdf_matching_text(needle)
    if not normalized_needle:
        return False
    return normalized_needle in normalize_pdf_matching_text(haystack)


def validate_pdf(
    path: Path,
    required: list[str],
    checks: list[Check],
    check_layout: bool = False,
    min_fill_ratio: float = 0.98,
    page_margin_pt: float = 10 * 72 / 25.4,
    bottom_margin_pt: float = 9 * 72 / 25.4,
    source_html: str | None = None,
    ats: bool = False,
) -> dict[str, Any] | None:
    try:
        data = path.read_bytes()
    except OSError as exc:
        add(checks, "PDF file", "fail", f"cannot read {path}: {exc}")
        return

    text = ""
    page_count: int | None = None
    reader: Any = None
    dependency_error: str | None = None
    try:
        from pypdf import PdfReader  # Optional dependency; fallback below remains stdlib-only.

        reader = PdfReader(str(path))
        page_count = len(reader.pages)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        reader = None
        dependency_error = str(exc)
        add(checks, "PDF parser", "degraded" if isinstance(exc, ImportError) else "fail",
            f"pypdf extraction unavailable: {exc}; raw PDF scan is diagnostic only")
        page_count = len(re.findall(rb"/Type\s*/Page(?:\s|/|>)", data))
        text = pdf_literal_text(data)

    if page_count == 1:
        add(checks, "PDF page count", "pass", "1 page")
    elif page_count and page_count > 1:
        add(checks, "PDF page count", "fail", f"expected 1 page, found {page_count}")
    else:
        add(checks, "PDF page count", "fail", "no PDF pages detected")
    if text.strip():
        add(checks, "PDF text extraction", "pass", "text can be extracted")
    else:
        add(checks, "PDF text extraction", "fail", "no extractable text found")
    for value in required:
        if text_contains_required(text, value):
            add(checks, f"required text: {value}", "pass", "found in PDF text")
        else:
            add(checks, f"required text: {value}", "fail", "required text is missing from PDF text")
    check_pdf_fonts(reader, data, checks)
    check_pdf_text_quality(text, source_html, checks)
    if reader is not None:
        check_pdf_reading_order(reader, text, source_html, checks, ats=ats)

    if check_layout:
        if reader is None:
            add(
                checks,
                "PDF layout dependency",
                "degraded",
                f"pypdf layout parsing unavailable: {dependency_error or 'unknown error'}; install requirements-test.txt and retry",
            )
        if page_count != 1:
            add(checks, "page fill", "fail", "layout check requires exactly one readable PDF page")
        elif reader is None:
            add(checks, "page fill", "degraded", "无法从当前 PDF 解析页面占用率，不可作为已验证交付物")
        else:
            spans: list[tuple[float, float]] = []
            bounds = measure_pdf_text_bounds(reader.pages[0], spans)
            if bounds is None:
                add(checks, "page fill", "degraded", "无法从 PDF 文本测量页面占用率，不可作为已验证交付物")
            else:
                top_y, bottom_y = bounds
                page_height = float(reader.pages[0].mediabox.height)
                # Bottom margin is a total physical distance, not top margin + safety.
                effective_bottom = bottom_margin_pt
                printable_height = page_height - page_margin_pt - bottom_margin_pt
                unused_bottom = max(bottom_y - effective_bottom, 0)
                top_space = max((page_height - page_margin_pt) - top_y, 0)
                fill_ratio = max(0, 1 - ((top_space + unused_bottom) / printable_height)) if printable_height > 0 else 0
                bottom_space = unused_bottom
                imbalance = abs(top_space - bottom_space)
                # Merge text rows across the page to detect blank bands that a
                # bottom caption can otherwise conceal. HTML measures columns separately.
                max_gap = 0.0
                previous_top = None
                for span_top, span_bottom in sorted(spans, key=lambda span: span[1]):
                    if previous_top is not None:
                        max_gap = max(max_gap, span_bottom - previous_top)
                        previous_top = max(previous_top, span_top)
                    else:
                        previous_top = span_top
                add(checks, "vertical gaps", "fail" if max_gap > printable_height * 0.25 else "pass",
                    f"最大内部空隙 {max_gap:.1f}pt（上限为有效高度的 25%）；仍须查看整页截图")
                if imbalance > 56.7:
                    add(
                        checks,
                        "vertical balance",
                        "fail",
                        f"上下留白差 {imbalance:.1f}pt，建议让上下间距更接近",
                    )
                else:
                    add(
                        checks,
                        "vertical balance",
                        "pass",
                        f"上下留白差 {imbalance:.1f}pt",
                    )
                actual_bottom_mm = bottom_y * 25.4 / 72
                required_bottom_mm = bottom_margin_pt * 25.4 / 72
                # Text bounds are estimated; allow 0.25mm for font/print rounding.
                safety_status = "pass" if bottom_y + (0.25 * 72 / 25.4) >= bottom_margin_pt else "fail"
                add(checks, "bottom safety", safety_status,
                    f"实际底部距离 {actual_bottom_mm:.2f}mm；总底部边距要求 {required_bottom_mm:.2f}mm（容差 0.25mm）")
                fill_message = f"有效区域页面占用率 {fill_ratio:.1%}（目标 ≥ {min_fill_ratio:.0%}）；实际底部距离 {actual_bottom_mm:.2f}mm"
                if fill_ratio < min_fill_ratio:
                    fill_status = "fail"
                    add(checks, "page fill", fill_status, f"{fill_message}，页面偏空；请调整布局密度、间距或垂直分布")
                else:
                    add(checks, "page fill", "pass", fill_message)
                return {"topMarginMm": page_margin_pt * 25.4 / 72,
                        "bottomMarginMm": required_bottom_mm, "actualBottomMm": actual_bottom_mm,
                        "fillRatio": fill_ratio, "minFillRatio": min_fill_ratio,
                        "measurementToleranceMm": 0.25}


def margin_mm(value: str) -> float:
    number = float(value)
    if not math.isfinite(number) or not 8 <= number <= 20:
        raise argparse.ArgumentTypeError("margin must be finite and between 8 and 20 mm")
    return number


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate HTML/PDF resume output")
    parser.add_argument("--html", type=Path)
    parser.add_argument("--mode", choices=("visual", "ats"), help="defaults to the stored manifest mode, otherwise visual")
    parser.add_argument("--pdf", type=Path)
    parser.add_argument("--required-text", nargs="+", default=[], metavar="TEXT")
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--check-overflow", action="store_true")
    parser.add_argument(
        "--layout-script",
        type=Path,
        default=Path(__file__).with_name("measure_resume_layout.mjs"),
        help=argparse.SUPPRESS,
    )
    parser.add_argument(
        "--check-layout",
        action="store_true",
        help="check PDF fill, balance and blank bands; with --html also check browser overflow and column whitespace",
    )
    parser.add_argument(
        "--min-fill-ratio",
        type=float,
        default=0.98,
        help="fail visual delivery when measurable PDF text occupies less than this ratio (default: 0.98)",
    )
    parser.add_argument("--page-margin-mm", type=margin_mm, help="PDF top margin; otherwise use measured HTML or 10 mm")
    parser.add_argument("--bottom-margin-mm", type=margin_mm, help="total PDF bottom margin; otherwise use measured HTML or 9 mm (no added safety zone)")
    parser.add_argument("--preview", type=Path, help="full-page PNG preview produced alongside the PDF")
    parser.add_argument("--manifest", type=Path, help="write an HTML/PDF delivery manifest")
    parser.add_argument("--verify-manifest", type=Path, help="verify hashes in an existing delivery manifest")
    parser.add_argument("--renderer", help="renderer identity in NAME@VERSION form")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    checks: list[Check] = []
    html: str | None = None
    html_layout = None
    pdf_layout = None
    manifest = None
    if args.verify_manifest:
        try:
            manifest = json.loads(args.verify_manifest.read_text(encoding="utf-8"))
            if not isinstance(manifest, dict):
                raise ValueError("manifest root must be an object")
            verify_manifest_record(manifest, args.html, args.pdf, args.renderer, checks)
        except (OSError, ValueError) as exc:
            manifest = None
            add(checks, "manifest", "fail", f"cannot verify manifest: {exc}")
    stored_validation = manifest.get("validation") if manifest else None
    stored_mode = stored_validation.get("mode") if isinstance(stored_validation, dict) else None
    if stored_mode is not None and (stored_mode not in ("ats", "visual") or
                                    args.mode and stored_mode != args.mode):
        add(checks, "manifest mode", "fail", "validation mode differs from requested mode or is invalid")
    # Version 1 records before mode was stored can be rechecked explicitly as ATS.
    mode = args.mode or (stored_mode if stored_mode in ("visual", "ats") else "visual")
    if not math.isfinite(args.min_fill_ratio) or not 0 < args.min_fill_ratio <= 1:
        add(checks, "layout configuration", "fail", "min-fill-ratio must be finite and in (0, 1]")
    if not args.html and not args.pdf:
        add(checks, "input", "fail", "provide --html and/or --pdf")
    if args.html:
        html = read_html(args.html, checks)
        if html is not None:
            validate_html(html, mode, args.required_text, checks)
            if args.check_overflow or args.check_layout:
                html_layout = check_html_overflow(args.html, args.layout_script, checks, args.min_fill_ratio)
    margins = (html_layout or {}).get("measurement", {}).get("marginsMm", {})
    top_margin_mm = margins.get("top", 10)
    bottom_margin_mm = margins.get("bottom", 9)
    for value, measured, label in ((args.page_margin_mm, top_margin_mm, "top"),
                                   (args.bottom_margin_mm, bottom_margin_mm, "bottom")):
        if value is not None and margins and abs(value - measured) > 0.25:
            add(checks, "layout configuration", "fail", f"{label} margin override disagrees with measured HTML; update CSS and re-render first")
    if args.page_margin_mm is not None:
        top_margin_mm = args.page_margin_mm
    if args.bottom_margin_mm is not None:
        bottom_margin_mm = args.bottom_margin_mm
    if args.pdf:
        pdf_layout = validate_pdf(
            args.pdf,
            args.required_text,
            checks,
            check_layout=args.check_layout,
            min_fill_ratio=args.min_fill_ratio,
            page_margin_pt=top_margin_mm * 72 / 25.4,
            bottom_margin_pt=bottom_margin_mm * 72 / 25.4,
            source_html=html,
            ats=mode == "ats",
        )
    preview = validate_preview(args.preview, checks) if args.preview else None

    scope = "+".join(name for name in ("html", "pdf") if getattr(args, name)) or "none"
    layout_record = {**(pdf_layout or {}), "marginsMm": margins,
                     "density": (html_layout or {}).get("density")}
    if args.manifest:
        if scope != "html+pdf":
            add(checks, "manifest inputs", "fail", "manifest generation requires both --html and --pdf")
        try:
            renderer = parse_renderer(args.renderer or "")
        except ValueError as exc:
            renderer = {"name": "unknown", "version": "unknown"}
            add(checks, "manifest renderer", "degraded", str(exc))
        records = {}
        for key in ("html", "pdf"):
            path = getattr(args, key)
            records[key] = None
            if path and path.is_file():
                try:
                    records[key] = {"path": str(path.resolve()), "sha256": file_hash(path)}
                except OSError as exc:
                    add(checks, "manifest inputs", "fail", str(exc))

    layout_verified = pdf_layout is not None and html_layout is not None and preview is not None
    if isinstance(stored_validation, dict) and not args.manifest:
        stored_checks = stored_validation.get("checks")
        if isinstance(stored_checks, list):
            passed = {item["name"] for item in stored_checks if isinstance(item, dict)
                      and isinstance(item.get("name"), str) and item.get("status") == "pass"}
            layout_verified |= bool(manifest.get("preview")) and {
                "overflow measurement", "page fill", "preview"
            } <= passed
    delivery_checks_complete = scope == "html+pdf" and (mode == "ats" or layout_verified)
    if args.manifest and scope == "html+pdf" and mode == "visual" and not layout_verified:
        add(checks, "manifest layout", "fail", "visual delivery requires measured layout and a full-page preview")

    def build_report():
        counts = {status: sum(c.status == status for c in checks)
                  for status in ("pass", "warn", "fail", "degraded")}
        ok = not (counts["fail"] or counts["degraded"])
        return {"scope": scope, "mode": mode, "ok": ok, "deliverable": ok and delivery_checks_complete,
                "layout": layout_record, "checks": [c.as_dict() for c in checks], "summary": counts}

    report = build_report()
    if args.manifest:
        record = {
            "schemaVersion": 1,
            "status": "valid" if report["deliverable"] else "invalid",
            **records,
            "preview": preview,
            "renderer": renderer,
            "layout": layout_record,
            "validation": report,
        }
        temp_path = None
        try:
            if any(path and path.resolve() == args.manifest.resolve()
                   for path in (args.html, args.pdf, args.preview, args.verify_manifest)):
                raise ValueError("manifest output must differ from input files")
            args.manifest.parent.mkdir(parents=True, exist_ok=True)
            with NamedTemporaryFile("w", encoding="utf-8", dir=args.manifest.parent, delete=False) as handle:
                temp_path = Path(handle.name)
                json.dump(record, handle, ensure_ascii=False, indent=2)
                handle.write("\n")
            temp_path.replace(args.manifest)
        except (OSError, ValueError) as exc:
            add(checks, "manifest output", "fail", str(exc))
            report = build_report()
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)
    if args.as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        scope_labels = {"html": "HTML only; PDF not checked", "pdf": "PDF only; source HTML not checked",
                        "html+pdf": "HTML and PDF", "none": "no input"}
        print(f"[SCOPE] {scope_labels[scope]}")
        if scope == "html+pdf" and mode == "visual" and not layout_verified:
            print("[SCOPE] visual delivery layout or full-page preview not verified")
        for check in checks:
            print(f"[{check.status.upper()}] {check.name}: {check.message}")
    if any(check.status == "fail" for check in checks):
        return 1
    if any(check.status == "degraded" for check in checks):
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
