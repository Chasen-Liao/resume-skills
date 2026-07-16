import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
ADAPTED_SKILLS = {
    "resume-bullet-writer": "resume-builder/references/resume-contract.md",
    "job-description-analyzer": "resume-builder/references/resume-contract.md",
    "resume-ats-optimizer": "resume-builder/references/resume-contract.md",
    "resume-version-manager": "resume-builder/references/resume-contract.md",
}


class AdaptedSkillCatalogTests(unittest.TestCase):
    def test_adapted_skills_are_present_and_reference_fact_contract(self):
        for skill_name, contract_reference in ADAPTED_SKILLS.items():
            skill_file = SKILLS / skill_name / "SKILL.md"
            self.assertTrue(skill_file.is_file(), f"missing {skill_file}")

            content = skill_file.read_text(encoding="utf-8")
            self.assertRegex(content, rf"^---\nname: {re.escape(skill_name)}\n", skill_file)
            self.assertIn("description:", content, skill_file)
            self.assertIn(contract_reference, content, skill_file)

    def test_resume_builder_documents_the_canvas_editor_protocol(self):
        content = (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("data-resume-editor-template", content)
        self.assertIn("data-resume-editor-id", content)

    def test_matching_report_uses_traceable_requirement_states(self):
        content = (SKILLS / "jd-tailorer" / "references" / "matching-analysis.md").read_text(encoding="utf-8")
        self.assertIn("要求 ID", content)
        self.assertIn("JD 来源", content)
        self.assertIn("候选人证据", content)
        self.assertIn("直接匹配", content)
        self.assertNotIn("关键词覆盖率", content)
        self.assertNotIn("JD 高频要求", content)

    def test_skill_instructions_do_not_claim_unsupported_pdf_checks(self):
        content = (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8")
        self.assertNotIn("页数、裁切、复制文本、链接和字体", content)
        self.assertIn("PDF 页数和可提取文本", content)

    def test_resume_builder_requires_portable_visual_resources(self):
        content = (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("data URL", content)
        self.assertIn("系统字体回退", content)


if __name__ == "__main__":
    unittest.main()
