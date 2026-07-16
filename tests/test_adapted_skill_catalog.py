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


if __name__ == "__main__":
    unittest.main()
