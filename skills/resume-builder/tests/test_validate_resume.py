import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "skills" / "resume-builder" / "scripts" / "validate_resume.py"
FIXTURES = Path(__file__).parent / "fixtures"


def run_validator(*args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *map(str, args)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )


def write_mock_pdf(path: Path, text: str = "Chasen Zhang\nExperience\n"):
    stream = f"BT /F1 12 Tf 72 720 Td ({text.replace(chr(10), ') Tj 0 -16 Td (')}) Tj ET"
    content = (
        "%PDF-1.4\n"
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R >> endobj\n"
        f"4 0 obj << /Length {len(stream.encode('latin-1'))} >> stream\n{stream}\nendstream endobj\n"
        "trailer << /Root 1 0 R >>\n%%EOF\n"
    )
    path.write_bytes(content.encode("latin-1"))


class ValidateResumeTests(unittest.TestCase):
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

    def test_check_overflow_is_warn_when_layout_measurement_is_unavailable(self):
        result = run_validator(
            "--html", FIXTURES / "good_ats.html", "--check-overflow", "--json"
        )
        report = json.loads(result.stdout)
        overflow = [item for item in report["checks"] if item["name"] == "overflow measurement"]
        self.assertEqual(len(overflow), 1)
        self.assertEqual(overflow[0]["status"], "warn")
        self.assertIn("not available", overflow[0]["message"].lower())
        self.assertEqual(result.returncode, 0)

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

    def test_render_wrapper_accepts_absolute_output_path(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "resume.pdf"
            result = subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    str(ROOT / "skills" / "resume-builder" / "scripts" / "render_resume.ps1"),
                    "-HTML",
                    str(FIXTURES / "good_ats.html"),
                    "-OutputPdf",
                    str(output),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                timeout=90,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertTrue(output.is_file())


if __name__ == "__main__":
    unittest.main()
