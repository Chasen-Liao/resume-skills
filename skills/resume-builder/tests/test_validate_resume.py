import json
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "skills" / "resume-builder" / "scripts" / "validate_resume.py"
FIXTURES = Path(__file__).parent / "fixtures"

VALIDATOR_SPEC = importlib.util.spec_from_file_location("validate_resume", SCRIPT)
VALIDATOR = importlib.util.module_from_spec(VALIDATOR_SPEC)
VALIDATOR_SPEC.loader.exec_module(VALIDATOR)


def run_validator(*args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *map(str, args)],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
    )


def write_mock_pdf(path: Path, text: str = "Chasen Zhang\nExperience\n", y: int = 720):
    stream = f"BT /F1 12 Tf 72 {y} Td ({text.replace(chr(10), ') Tj 0 -16 Td (')}) Tj ET"
    content = (
        "%PDF-1.4\n"
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595.92 842.88] "
        "/Contents 4 0 R >> endobj\n"
        f"4 0 obj << /Length {len(stream.encode('latin-1'))} >> stream\n{stream}\nendstream endobj\n"
        "trailer << /Root 1 0 R >>\n%%EOF\n"
    )
    path.write_bytes(content.encode("latin-1"))


def write_two_page_mock_pdf(path: Path):
    page_stream = "BT /F1 12 Tf 72 720 Td (Chasen Zhang) Tj ET"
    content_length = len(page_stream.encode("latin-1"))
    content = (
        "%PDF-1.4\n"
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        "2 0 obj << /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >> endobj\n"
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595.92 842.88] "
        "/Contents 4 0 R >> endobj\n"
        f"4 0 obj << /Length {content_length} >> stream\n{page_stream}\nendstream endobj\n"
        "5 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595.92 842.88] "
        "/Contents 6 0 R >> endobj\n"
        f"6 0 obj << /Length {content_length} >> stream\n{page_stream}\nendstream endobj\n"
        "trailer << /Root 1 0 R >>\n%%EOF\n"
    )
    path.write_bytes(content.encode("latin-1"))


def write_layout_pdf(path: Path, y: int | list[int]):
    from pypdf import PdfWriter
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

    writer = PdfWriter()
    page = writer.add_blank_page(width=595.92, height=842.88)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)})}
    )
    stream = DecodedStreamObject()
    positions = [y] if isinstance(y, int) else y
    commands = " ".join(f"BT /F1 12 Tf 72 {position} Td (Chasen Zhang) Tj ET" for position in positions)
    stream.set_data(commands.encode("latin-1"))
    page[NameObject("/Contents")] = writer._add_object(stream)
    with path.open("wb") as handle:
        writer.write(handle)


def write_unicode_pdf(
    path: Path,
    entries: list[tuple[float, float, str]],
    subtype: str = "/Type1",
    use_form_xobject: bool = False,
) -> None:
    from pypdf import PdfWriter
    from pypdf.generic import (
        ArrayObject,
        DecodedStreamObject,
        DictionaryObject,
        NameObject,
        NumberObject,
    )

    chars: dict[str, int] = {}
    for _, _, text in entries:
        for ch in text:
            if ch not in chars:
                chars[ch] = len(chars) + 1
                if chars[ch] > 255:
                    raise ValueError("write_unicode_pdf supports up to 255 unique characters")

    bfchar_lines = "\n".join(f"<{code:02X}> <{ord(ch):04X}>" for ch, code in chars.items())
    cmap_data = (
        "/CIDInit /ProcSet findresource begin\n"
        "12 dict begin\n"
        "begincmap\n"
        "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n"
        "/CMapName /Adobe-Identity-UCS def\n"
        "/CMapType 2 def\n"
        "1 begincodespacerange\n<01> <FF>\nendcodespacerange\n"
        f"{len(chars)} beginbfchar\n{bfchar_lines}\nendbfchar\n"
        "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n"
    ).encode("ascii")

    writer = PdfWriter()
    page = writer.add_blank_page(width=595.92, height=842.88)
    cmap_stream = DecodedStreamObject()
    cmap_stream.set_data(cmap_data)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject(subtype),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
            NameObject("/ToUnicode"): writer._add_object(cmap_stream),
        }
    )
    font_ref = writer._add_object(font)

    commands = []
    for x, y, text in entries:
        hex_codes = "".join(f"{chars[ch]:02X}" for ch in text)
        commands.append(f"BT /F1 11 Tf {x:.2f} {y:.2f} Td <{hex_codes}> Tj ET")
    stream_bytes = "\n".join(commands).encode("ascii")

    if use_form_xobject:
        form = DecodedStreamObject()
        form[NameObject("/Type")] = NameObject("/XObject")
        form[NameObject("/Subtype")] = NameObject("/Form")
        form[NameObject("/BBox")] = ArrayObject(
            [NumberObject(0), NumberObject(0), NumberObject(595), NumberObject(842)]
        )
        form[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})}
        )
        form.set_data(stream_bytes)
        form_ref = writer._add_object(form)
        page[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/XObject"): DictionaryObject({NameObject("/Fm1"): form_ref})}
        )
        outer = DecodedStreamObject()
        outer.set_data(b"/Fm1 Do")
        page[NameObject("/Contents")] = writer._add_object(outer)
    else:
        page[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})}
        )
        stream = DecodedStreamObject()
        stream.set_data(stream_bytes)
        page[NameObject("/Contents")] = writer._add_object(stream)

    with path.open("wb") as handle:
        writer.write(handle)


class ValidateResumeTests(unittest.TestCase):
    def test_pdf_text_bounds_compose_current_and_text_matrices(self):
        class TransformedPage:
            def extract_text(self, visitor_text):
                visitor_text(
                    "Transformed text",
                    [1, 0, 0, 1, 0, 100],
                    [1, 0, 0, 1, 0, 20],
                    None,
                    12,
                )

        self.assertEqual(VALIDATOR.measure_pdf_text_bounds(TransformedPage()), (132.0, 117.0))

    def test_valid_ats_html_passes(self):
        result = run_validator(
            "--html", FIXTURES / "good_ats.html", "--mode", "ats",
            "--required-text", "Chasen Zhang", "Experience", "--json",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertTrue(report["ok"])
        self.assertTrue(all(item["status"] == "pass" for item in report["checks"]))

    def test_ats_rejects_img_svg_table_and_layout_hazards(self):
        result = run_validator("--html", FIXTURES / "bad_ats.html", "--mode", "ats")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("img", result.stdout)
        self.assertIn("svg", result.stdout)
        self.assertIn("table", result.stdout)
        self.assertIn("overflow", result.stdout)
        self.assertIn("fixed", result.stdout)

    def test_visual_mode_warns_on_external_font_and_relative_resource(self):
        result = run_validator("--html", FIXTURES / "visual_warn.html", "--mode", "visual")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("WARN", result.stdout)
        self.assertIn("font", result.stdout.lower())
        self.assertIn("relative", result.stdout.lower())

    def test_all_builtin_visual_templates_pass_visual_validation(self):
        examples = ROOT / "skills" / "resume-builder" / "references" / "examples"
        for template in examples.glob("*.html"):
            with self.subTest(template=template.name):
                result = run_validator("--html", template, "--mode", "visual")
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_html_required_text_missing_fails(self):
        result = run_validator(
            "--html", FIXTURES / "good_ats.html", "--required-text", "Missing phrase"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("required", result.stdout.lower())

    def test_check_overflow_is_undeliverable_when_browser_measurement_is_unavailable(self):
        result = run_validator(
            "--html", FIXTURES / "good_ats.html", "--check-overflow",
            "--layout-script", FIXTURES / "missing-layout-script.mjs", "--json"
        )
        report = json.loads(result.stdout)
        overflow = [item for item in report["checks"] if item["name"] == "overflow measurement"]
        self.assertEqual(len(overflow), 1)
        self.assertEqual(overflow[0]["status"], "degraded")
        self.assertIn("playwright", overflow[0]["message"].lower())
        self.assertEqual(report["deliverable"], False)
        self.assertEqual(result.returncode, 2)

    def test_check_layout_is_undeliverable_without_pypdf(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "resume.pdf"
            write_mock_pdf(pdf)
            result = subprocess.run(
                [sys.executable, "-S", str(SCRIPT), "--pdf", str(pdf), "--check-layout", "--json"],
                cwd=ROOT,
                text=True,
                encoding="utf-8",
                errors="replace",
                capture_output=True,
            )

            self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
            report = json.loads(result.stdout)
            self.assertFalse(report["deliverable"])
            dependency = [item for item in report["checks"] if item["name"] == "PDF layout dependency"]
            self.assertEqual(dependency[0]["status"], "degraded")

    def test_manifest_binds_valid_pdf_to_current_html_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            html = Path(directory) / "resume.html"
            pdf = Path(directory) / "resume.pdf"
            manifest = Path(directory) / "resume.resume-manifest.json"
            html.write_text((FIXTURES / "good_ats.html").read_text(encoding="utf-8"), encoding="utf-8")
            write_mock_pdf(pdf)

            generated = run_validator(
                "--html", html, "--pdf", pdf, "--mode", "ats",
                "--manifest", manifest, "--renderer", "playwright@1.62.1", "--json",
            )
            self.assertEqual(generated.returncode, 0, generated.stdout + generated.stderr)
            record = json.loads(manifest.read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "valid")
            self.assertEqual(record["renderer"], {"name": "playwright", "version": "1.62.1"})
            self.assertEqual(len(record["html"]["sha256"]), 64)
            self.assertEqual(len(record["pdf"]["sha256"]), 64)
            self.assertTrue(record["validation"]["ok"])

            html.write_text(html.read_text(encoding="utf-8") + "\n<!-- changed -->", encoding="utf-8")
            verified = run_validator(
                "--html", html, "--pdf", pdf, "--verify-manifest", manifest, "--json"
            )
            self.assertNotEqual(verified.returncode, 0)
            self.assertIn("HTML hash", verified.stdout)

    def test_verify_manifest_rejects_missing_schema_and_renderer(self):
        with tempfile.TemporaryDirectory() as directory:
            html = Path(directory) / "resume.html"
            pdf = Path(directory) / "resume.pdf"
            manifest = Path(directory) / "resume.resume-manifest.json"
            html.write_text((FIXTURES / "good_ats.html").read_text(encoding="utf-8"), encoding="utf-8")
            write_mock_pdf(pdf)
            generated = run_validator(
                "--html", html, "--pdf", pdf, "--mode", "ats",
                "--manifest", manifest, "--renderer", "playwright@1.62.1", "--json",
            )
            self.assertEqual(generated.returncode, 0, generated.stdout + generated.stderr)
            record = json.loads(manifest.read_text(encoding="utf-8"))
            record.pop("schemaVersion")
            record.pop("renderer")
            manifest.write_text(json.dumps(record), encoding="utf-8")

            verified = run_validator(
                "--html", html, "--pdf", pdf, "--verify-manifest", manifest, "--json"
            )

            self.assertNotEqual(verified.returncode, 0, verified.stdout + verified.stderr)
            self.assertIn("schema", verified.stdout.lower())
            self.assertIn("renderer", verified.stdout.lower())

    def test_verify_manifest_rejects_contradictory_validation_result(self):
        with tempfile.TemporaryDirectory() as directory:
            html = Path(directory) / "resume.html"
            pdf = Path(directory) / "resume.pdf"
            manifest = Path(directory) / "resume.resume-manifest.json"
            html.write_text((FIXTURES / "good_ats.html").read_text(encoding="utf-8"), encoding="utf-8")
            write_mock_pdf(pdf)
            generated = run_validator(
                "--html", html, "--pdf", pdf, "--mode", "ats",
                "--manifest", manifest, "--renderer", "playwright@1.62.1", "--json",
            )
            self.assertEqual(generated.returncode, 0, generated.stdout + generated.stderr)
            record = json.loads(manifest.read_text(encoding="utf-8"))
            record["validation"]["deliverable"] = False
            record["validation"]["checks"].append(
                {"name": "simulated dependency", "status": "degraded", "message": "unavailable"}
            )
            manifest.write_text(json.dumps(record), encoding="utf-8")

            verified = run_validator(
                "--html", html, "--pdf", pdf, "--verify-manifest", manifest, "--json"
            )

            self.assertNotEqual(verified.returncode, 0, verified.stdout + verified.stderr)
            self.assertIn("validation", verified.stdout.lower())

    def test_verify_manifest_rejects_valid_status_for_undeliverable_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            html = Path(directory) / "resume.html"
            pdf = Path(directory) / "resume.pdf"
            manifest = Path(directory) / "resume.resume-manifest.json"
            html.write_text((FIXTURES / "good_ats.html").read_text(encoding="utf-8"), encoding="utf-8")
            write_mock_pdf(pdf)
            generated = run_validator(
                "--html", html, "--pdf", pdf, "--mode", "ats",
                "--manifest", manifest, "--renderer", "playwright@1.62.1", "--json",
            )
            self.assertEqual(generated.returncode, 0, generated.stdout + generated.stderr)
            record = json.loads(manifest.read_text(encoding="utf-8"))
            record["validation"]["ok"] = False
            record["validation"]["deliverable"] = False
            record["validation"]["checks"].append(
                {"name": "simulated failure", "status": "fail", "message": "failed"}
            )
            manifest.write_text(json.dumps(record), encoding="utf-8")

            verified = run_validator(
                "--html", html, "--pdf", pdf, "--verify-manifest", manifest, "--json"
            )

            self.assertNotEqual(verified.returncode, 0, verified.stdout + verified.stderr)
            self.assertIn("status", verified.stdout.lower())

    def test_pdf_requires_extractable_text_and_required_text(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "resume.pdf"
            write_mock_pdf(pdf)
            passed = run_validator("--pdf", pdf, "--required-text", "Chasen Zhang")
            self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)
            missing = run_validator("--pdf", pdf, "--required-text", "Missing phrase")
            self.assertNotEqual(missing.returncode, 0)
            self.assertIn("required", missing.stdout.lower())

    def test_pdf_page_count_alone_does_not_pass(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "empty.pdf"
            write_mock_pdf(pdf, "")
            result = run_validator("--pdf", pdf)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("text", result.stdout.lower())

    def test_pdf_layout_rejects_sparse_page_even_with_relaxed_fill_threshold(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "sparse.pdf"
            write_layout_pdf(pdf, y=500)
            result = run_validator(
                "--pdf", pdf, "--check-layout", "--min-fill-ratio", "0.78", "--json"
            )
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
            report = json.loads(result.stdout)
            layout = [item for item in report["checks"] if item["name"] == "page fill"]
            self.assertEqual(len(layout), 1)
            self.assertEqual(layout[0]["status"], "fail")
            self.assertIn("占用率", layout[0]["message"])

    def test_pdf_layout_default_98_percent_threshold_is_a_delivery_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "sparse-default.pdf"
            write_layout_pdf(pdf, y=500)
            result = run_validator("--pdf", pdf, "--check-layout", "--json")
            self.assertNotEqual(result.returncode, 0)
            report = json.loads(result.stdout)
            layout = [item for item in report["checks"] if item["name"] == "page fill"]
            self.assertEqual(layout[0]["status"], "fail")
            self.assertIn("布局密度", layout[0]["message"])

    def test_pdf_layout_passes_when_content_nearly_fills_one_page(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "full.pdf"
            write_layout_pdf(pdf, y=list(range(780, 59, -80)))
            result = run_validator("--pdf", pdf, "--check-layout", "--min-fill-ratio", "0.78")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("[PASS] page fill", result.stdout)

    def test_pdf_layout_rejects_more_than_one_page(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "overflow.pdf"
            write_two_page_mock_pdf(pdf)
            result = run_validator("--pdf", pdf, "--check-layout", "--min-fill-ratio", "0.78")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("PDF page count", result.stdout)

    def test_pdf_bottom_margin_is_nine_mm_total_not_an_added_safety_zone(self):
        with tempfile.TemporaryDirectory() as directory:
            for margin_mm, expected in ((9.1, "pass"), (8.9, "pass"), (8.0, "fail")):
                with self.subTest(margin_mm=margin_mm):
                    pdf = Path(directory) / "boundary.pdf"
                    write_layout_pdf(pdf, y=[margin_mm * 72 / 25.4 + 3])
                    checks = []
                    VALIDATOR.validate_pdf(pdf, [], checks, check_layout=True)
                    safety = next(check for check in checks if check.name == "bottom safety")
                    self.assertEqual(safety.status, expected, safety.message)
                    self.assertIn("mm", safety.message)

    def test_pdf_only_cli_reports_physical_bottom_distance_and_custom_margin(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "custom.pdf"
            write_layout_pdf(pdf, y=list(range(795, 40, -60)) + [11.1 * 72 / 25.4 + 3])
            result = run_validator("--pdf", pdf, "--check-layout", "--bottom-margin-mm", "11", "--json")
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertAlmostEqual(report["layout"]["actualBottomMm"], 11.1, places=2)
            self.assertAlmostEqual(report["layout"]["bottomMarginMm"], 11, places=2)
            stricter = run_validator("--pdf", pdf, "--check-layout", "--bottom-margin-mm", "12", "--json")
            self.assertNotEqual(stricter.returncode, 0)
            safety = next(check for check in json.loads(stricter.stdout)["checks"] if check["name"] == "bottom safety")
            self.assertEqual(safety["status"], "fail")
            for invalid in ("nan", "inf", "0", "-1"):
                rejected = run_validator("--pdf", pdf, "--bottom-margin-mm", invalid)
                self.assertNotEqual(rejected.returncode, 0)

    def test_pdf_layout_rejects_content_past_printable_bottom(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "clipped.pdf"
            write_layout_pdf(pdf, y=20)
            result = run_validator("--pdf", pdf, "--check-layout")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("bottom safety", result.stdout)

    def test_pdf_layout_rejects_unbalanced_whitespace(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "unbalanced.pdf"
            write_layout_pdf(pdf, y=[720, 300])
            result = run_validator("--pdf", pdf, "--check-layout", "--min-fill-ratio", "0.78")
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("[FAIL] vertical balance", result.stdout)

    def test_pdf_layout_rejects_large_gap_above_bottom_text(self):
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "bottom-text.pdf"
            write_layout_pdf(pdf, y=[780, 500, 45])
            result = run_validator("--pdf", pdf, "--check-layout", "--json")
            report = json.loads(result.stdout)
            self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertFalse(report["deliverable"])
            gaps = [item for item in report["checks"] if item["name"] == "vertical gaps"]
            self.assertEqual(gaps[0]["status"], "fail")

    def test_pdf_rejects_type3_fallback_font_direct_and_in_form_xobject(self):
        with tempfile.TemporaryDirectory() as directory:
            for use_form in (False, True):
                with self.subTest(use_form=use_form):
                    pdf = Path(directory) / f"type3-{use_form}.pdf"
                    write_unicode_pdf(
                        pdf,
                        [(72, 720, "Chasen Zhang")],
                        subtype="/Type3",
                        use_form_xobject=use_form,
                    )
                    result = run_validator("--pdf", pdf, "--json")
                    self.assertNotEqual(result.returncode, 0)
                    report = json.loads(result.stdout)
                    font_check = next(c for c in report["checks"] if c["name"] == "PDF fonts")
                    self.assertEqual(font_check["status"], "fail")
                    self.assertIn("Type3", font_check["message"])

    def test_pdf_rejects_corrupted_unicode_ranges(self):
        cases = (
            ("kangxi", "⼀级研发工程师"),
            ("cjk-supplement", "⺁补部首测试"),
            ("replacement", "异常\ufffd字符"),
            ("pua", "图标\ue001文本"),
        )
        with tempfile.TemporaryDirectory() as directory:
            for label, sample in cases:
                with self.subTest(label=label):
                    pdf = Path(directory) / f"{label}.pdf"
                    write_unicode_pdf(pdf, [(72, 720, sample)])
                    result = run_validator("--pdf", pdf, "--json")
                    self.assertNotEqual(result.returncode, 0, result.stdout)
                    report = json.loads(result.stdout)
                    quality = next(c for c in report["checks"] if c["name"] == "PDF text quality")
                    self.assertEqual(quality["status"], "fail", quality["message"])

    def test_pdf_rejects_unauthorized_minus_sign_and_template_markers(self):
        with tempfile.TemporaryDirectory() as directory:
            html_no_minus = Path(directory) / "no-minus.html"
            html_with_minus = Path(directory) / "with-minus.html"
            base_html = (
                "<!DOCTYPE html><html lang='zh-CN'><head><style>"
                "h2::before{content:'</>'}"
                "</style></head><body><main class='resume'>"
                "<h1>Chasen Zhang</h1><section><h2>%s</h2><p>Experience</p></section>"
                "</main></body></html>"
            )
            html_no_minus.write_text(base_html % "2024 - 2026", encoding="utf-8")
            html_with_minus.write_text(base_html % "2024 − 2026", encoding="utf-8")

            pdf_minus = Path(directory) / "minus.pdf"
            write_unicode_pdf(pdf_minus, [(72, 720, "Chasen Zhang"), (72, 700, "2024 − 2026")])
            # Unauthorized U+2212 fails both standalone and against HTML lacking U+2212
            self.assertNotEqual(run_validator("--pdf", pdf_minus).returncode, 0)
            against_no_minus = run_validator("--html", html_no_minus, "--pdf", pdf_minus, "--json")
            self.assertNotEqual(against_no_minus.returncode, 0)
            q1 = next(c for c in json.loads(against_no_minus.stdout)["checks"] if c["name"] == "PDF text quality")
            self.assertEqual(q1["status"], "fail")
            self.assertIn("U+2212", q1["message"])

            # Authorized U+2212 present in HTML passes
            against_with_minus = run_validator("--html", html_with_minus, "--pdf", pdf_minus, "--json")
            self.assertEqual(against_with_minus.returncode, 0, against_with_minus.stdout)

            # DEMO watermark and </> pseudo-element leakage fail
            for name, line in (("demo", "DEMO · 虚构示例内容"), ("pseudo", "</> 专业技能")):
                with self.subTest(marker=name):
                    pdf_bad = Path(directory) / f"{name}.pdf"
                    write_unicode_pdf(pdf_bad, [(72, 720, "Chasen Zhang"), (72, 700, line)])
                    bad = run_validator("--html", html_no_minus, "--pdf", pdf_bad, "--json")
                    self.assertNotEqual(bad.returncode, 0, bad.stdout)
                    quality = next(c for c in json.loads(bad.stdout)["checks"] if c["name"] == "PDF text quality")
                    self.assertEqual(quality["status"], "fail", quality["message"])

    def test_pdf_reading_order_rejects_deferred_items_after_self_evaluation(self):
        with tempfile.TemporaryDirectory() as directory:
            html_path = Path(directory) / "order.html"
            html_path.write_text(
                "<!DOCTYPE html><html lang='zh-CN'><head><title>Resume</title></head><body><main class='resume'>"
                "<h1>张小明</h1>"
                "<section><h2>实习经历</h2><ul><li>核心支付系统延迟降低百分之三十</li></ul></section>"
                "<section><h2>自我评价</h2><p>结果导向，工程严谨。</p></section>"
                "</main></body></html>",
                encoding="utf-8",
            )
            pdf_bad = Path(directory) / "deferred.pdf"
            write_unicode_pdf(
                pdf_bad,
                [
                    (72, 780, "张小明"),
                    (72, 120, "自我评价"),
                    (72, 100, "结果导向，工程严谨。"),
                    (72, 620, "实习经历"),
                    (84, 595, "核心支付系统延迟降低百分之三十"),
                ],
            )
            with_html = run_validator("--html", html_path, "--pdf", pdf_bad, "--json")
            self.assertNotEqual(with_html.returncode, 0)
            order1 = next(c for c in json.loads(with_html.stdout)["checks"] if c["name"] == "PDF reading order")
            self.assertEqual(order1["status"], "fail", order1["message"])

            pdf_only = run_validator("--pdf", pdf_bad, "--json")
            self.assertNotEqual(pdf_only.returncode, 0)
            order2 = next(c for c in json.loads(pdf_only.stdout)["checks"] if c["name"] == "PDF reading order")
            self.assertEqual(order2["status"], "fail", order2["message"])

            # Synthetic pypdf flush callback under cm[3] < 0 with identity tm must not false-fail
            class FlippedFlushPage:
                class MediaBox:
                    width = 595.0
                    height = 842.0

                mediabox = MediaBox()

                def extract_text(self, visitor_text):
                    visitor_text("Heading", [1, 0, 0, -1, 0, 842], [1, 0, 0, 1, 72, 100], None, 12)
                    visitor_text("Body line", [1, 0, 0, -1, 0, 842], [1, 0, 0, 1, 72, 140], None, 11)
                    visitor_text("flush", [1, 0, 0, -1, 0, 842], [1, 0, 0, 1, 0, 0], None, 11)

            spans = VALIDATOR.collect_pdf_stream_spans(FlippedFlushPage())
            self.assertEqual(len(spans), 2)

    def test_pdf_reading_order_allows_legitimate_two_column_layout(self):
        with tempfile.TemporaryDirectory() as directory:
            html_path = Path(directory) / "two-col.html"
            html_path.write_text(
                "<!DOCTYPE html><html lang='zh-CN'><head><title>Resume</title></head><body><main class='resume'>"
                "<h1>张小明</h1>"
                "<aside><h2>教育背景</h2><p>计算机科学学士</p></aside>"
                "<section><h2>实习经历</h2><ul><li>完成接口高可用改造与压测验收</li></ul></section>"
                "<section><h2>自我评价</h2><p>严谨求真。</p></section>"
                "</main></body></html>",
                encoding="utf-8",
            )
            pdf_ok = Path(directory) / "two-col.pdf"
            write_unicode_pdf(
                pdf_ok,
                [
                    (40, 780, "张小明"),
                    (40, 700, "教育背景"),
                    (40, 680, "计算机科学学士"),
                    (260, 700, "实习经历"),
                    (272, 680, "完成接口高可用改造与压测验收"),
                    (260, 200, "自我评价"),
                    (260, 180, "严谨求真。"),
                ],
            )
            result = run_validator("--html", html_path, "--pdf", pdf_ok, "--json")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            order = next(c for c in json.loads(result.stdout)["checks"] if c["name"] == "PDF reading order")
            self.assertEqual(order["status"], "pass")

    def test_required_text_tolerates_inline_html_and_pypdf_boundary_spacing_without_hiding_corrupt_spaces(self):
        with tempfile.TemporaryDirectory() as directory:
            html_path = Path(directory) / "mixed.html"
            html_path.write_text(
                "<!DOCTYPE html><html lang='zh-CN'><head><title>Resume</title></head><body><main class='resume'>"
                "<h1>松本 雅人 / Matsumoto Masato</h1>"
                "<section><h2>教育经历</h2>"
                "<div><span>出生年月：</span><span>2002年3月</span></div>"
                "<p><strong>GPA：</strong>3.6 (专业前10%)</p>"
                "<p>高级产品经理 / Senior Product Manager · 交互原型 (Figma) · 张小可 测试</p>"
                "<div><span>Python</span>\n  <span>SQL</span></div>"
                "</section></main></body></html>",
                encoding="utf-8",
            )
            pdf_ok = Path(directory) / "mixed.pdf"
            write_unicode_pdf(
                pdf_ok,
                [
                    (40, 760, "松本  雅人  / Matsumoto Masato"),
                    (40, 740, "2002 年 3 月"),
                    (40, 720, "GPA ：3.6 ( 专业前 10%)"),
                    (40, 700, "高级产品经理  / Senior Product Manager"),
                    (40, 680, "交互原型  (Figma)"),
                    (40, 660, "张小可  测试"),
                    (40, 640, "LINUX_FAN / 林向阳  测试"),
                    (40, 620, "Python SQL"),
                ],
            )
            passed = run_validator(
                "--html",
                html_path,
                "--pdf",
                pdf_ok,
                "--required-text",
                "松本 雅人 / Matsumoto Masato",
                "2002年3月",
                "GPA：3.6 (专业前10%)",
                "高级产品经理 / Senior Product Manager",
                "交互原型 (Figma)",
                "张小可 测试",
                "Python SQL",
                "--json",
            )
            self.assertEqual(passed.returncode, 0, passed.stdout + passed.stderr)

            # PDF-only check with LINUX_FAN double-space case
            pdf_only = run_validator(
                "--pdf",
                pdf_ok,
                "--required-text",
                "LINUX_FAN / 林向阳 测试",
                "--json",
            )
            self.assertEqual(pdf_only.returncode, 0, pdf_only.stdout + pdf_only.stderr)

            # Must still reject Type3 intra-CJK pseudo-space ("松 本") and glued ASCII tokens ("PythonSQL")
            pdf_bad = Path(directory) / "bad-spacing.pdf"
            write_unicode_pdf(
                pdf_bad,
                [
                    (40, 740, "松 本"),
                    (40, 720, "PythonSQL"),
                ],
            )
            bad_cjk = run_validator("--pdf", pdf_bad, "--required-text", "松本", "--json")
            self.assertNotEqual(bad_cjk.returncode, 0)
            bad_ascii = run_validator("--pdf", pdf_bad, "--required-text", "Python SQL", "--json")
            self.assertNotEqual(bad_ascii.returncode, 0)

if __name__ == "__main__":
    unittest.main()
