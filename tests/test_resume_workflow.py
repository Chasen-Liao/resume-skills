import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"


class ResumeWorkflowTests(unittest.TestCase):
    def test_workflow_skill_orchestrates_the_existing_resume_skills(self):
        skill_path = SKILLS / "resume-workflow" / "SKILL.md"
        self.assertTrue(skill_path.is_file())
        skill = skill_path.read_text(encoding="utf-8")

        self.assertIn("name: resume-workflow", skill)
        self.assertIn("resume-builder", skill)
        self.assertIn("job-description-analyzer", skill)
        self.assertIn("jd-tailorer", skill)
        self.assertIn("resume-ats-optimizer", skill)
        self.assertIn("resume-version-manager", skill)
        self.assertIn("用户确认", skill)

    def test_facts_template_preserves_claim_evidence_and_confirmation(self):
        facts_path = SKILLS / "resume-builder" / "references" / "resume-facts.example.yaml"
        self.assertTrue(facts_path.is_file())
        facts_template = facts_path.read_text(encoding="utf-8")

        self.assertIn("facts_version:", facts_template)
        self.assertIn("claims: []", facts_template)
        self.assertIn("claim_id:", facts_template)
        self.assertIn("source:", facts_template)
        self.assertIn("confidence:", facts_template)
        self.assertIn("evidence:", facts_template)
        self.assertIn("confirmed_at:", facts_template)
        self.assertNotRegex(facts_template, r"(?m)^\s+- claim_id:")

    def test_fact_contract_names_the_private_facts_file(self):
        contract = (SKILLS / "resume-builder" / "references" / "resume-contract.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("resume-facts.yaml", contract)
        self.assertIn("pending_claims", contract)

    def test_personal_resume_data_is_kept_out_of_the_source_repository(self):
        ignore_rules = (ROOT / ".gitignore").read_text(encoding="utf-8")
        readme = (ROOT / "README.md").read_text(encoding="utf-8")

        self.assertIn("resume/", ignore_rules)
        self.assertIn("项目目录外", readme)
        self.assertIn("resume-facts.yaml", readme)

    def test_readme_distinguishes_empty_workspace_and_jd_tailoring_entrypoints(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")

        self.assertIn("空的简历工作区", readme)
        self.assertIn("`resume-workflow`", readme)
        self.assertIn("已有母版", readme)
        self.assertIn("输入 JD", readme)

    def test_readme_requires_canvas_preview_for_visual_deliverables(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        tutorial = (ROOT / "docs" / "index.html").read_text(encoding="utf-8")

        self.assertIn("视觉母版或视觉定制版", readme)
        self.assertIn("npx @chasen-liao/resume-skills editor", readme)
        self.assertIn("视觉母版或视觉定制版", tutorial)


if __name__ == "__main__":
    unittest.main()
