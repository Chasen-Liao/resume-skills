import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
EXAMPLES = ROOT / "skills" / "resume-builder" / "references" / "examples"
RENDERER = ROOT / "skills" / "resume-builder" / "scripts" / "render_resume.ps1"


def render(html: Path, pdf: Path):
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    return subprocess.run(
        [
            "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(RENDERER),
            "-HTML", str(html), "-OutputPdf", str(pdf),
        ],
        cwd=ROOT,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=120,
    )


class RenderIntegrationTests(unittest.TestCase):
    def test_all_visual_templates_render_to_current_valid_manifests(self):
        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            for html in EXAMPLES.glob("*.html"):
                with self.subTest(template=html.name):
                    pdf = output_dir / f"delivery-{html.stem}.pdf"
                    result = render(html, pdf)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    manifest = output_dir / f"delivery-{html.stem}.resume-manifest.json"
                    record = json.loads(manifest.read_text(encoding="utf-8"))
                    self.assertEqual(record["status"], "valid")
                    self.assertTrue(record["validation"]["deliverable"])
                    self.assertEqual(Path(record["html"]["path"]), html.resolve())
                    self.assertEqual(Path(record["pdf"]["path"]), pdf.resolve())

    def test_deliberately_overflowing_visual_resume_is_not_deliverable(self):
        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            source = (EXAMPLES / "modern-minimal.html").read_text(encoding="utf-8")
            overflow_rows = "".join("<p>DEMO overflow row</p>" for _ in range(120))
            closing = source.rfind("</div>")
            html = output_dir / "overflow.html"
            html.write_text(source[:closing] + overflow_rows + source[closing:], encoding="utf-8")
            pdf = output_dir / "overflow.pdf"

            result = render(html, pdf)

            self.assertNotEqual(result.returncode, 0)
            record = json.loads((output_dir / "overflow.resume-manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(record["status"], "invalid")
            overflow = [item for item in record["validation"]["checks"] if item["name"] == "overflow measurement"]
            self.assertEqual(overflow[0]["status"], "fail")


if __name__ == "__main__":
    unittest.main()
