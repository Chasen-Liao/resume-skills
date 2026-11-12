import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
CORE_WORKFLOW_SKILLS = ("resume-builder", "jd-tailorer", "resume-workflow")
ALL_CORE_SKILLS = ("resume-workflow", "resume-builder", "jd-tailorer", "resume-canvas")
DEPRECATED_SKILLS = (
    "job-description-analyzer",
    "resume-bullet-writer",
    "resume-ats-optimizer",
    "resume-version-manager",
)

ADAPTED_SKILLS = {
    "resume-workflow": "resume-builder/references/resume-contract.md",
    "resume-builder": "references/resume-contract.md",
    "jd-tailorer": "resume-builder/references/resume-contract.md",
}


class AdaptedSkillCatalogTests(unittest.TestCase):
    def test_adapted_skills_are_present_and_reference_fact_contract(self):
        for skill_name in ALL_CORE_SKILLS:
            skill_file = SKILLS / skill_name / "SKILL.md"
            self.assertTrue(skill_file.is_file(), f"missing {skill_file}")
            content = skill_file.read_text(encoding="utf-8")
            self.assertRegex(content, rf"^---\nname: {re.escape(skill_name)}\n", skill_file)
            self.assertIn("description:", content, skill_file)

        for deprecated in DEPRECATED_SKILLS:
            self.assertFalse((SKILLS / deprecated).exists(), f"deprecated skill should be removed: {deprecated}")

        for skill_name, contract_reference in ADAPTED_SKILLS.items():
            skill_file = SKILLS / skill_name / "SKILL.md"
            content = skill_file.read_text(encoding="utf-8")
            self.assertIn(contract_reference, content, skill_file)

    def test_resume_builder_documents_the_canvas_editor_protocol(self):
        content = (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("data-resume-editor-template", content)
        self.assertIn("data-resume-editor-id", content)

    def test_canvas_editor_ids_are_independent_text_targets(self):
        delivery_gate = (SKILLS / "resume-builder" / "references" / "delivery-gate.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("可独立编辑", delivery_gate)
        self.assertIn("禁止把", delivery_gate)
        self.assertIn("ID 放在", delivery_gate)
        self.assertIn("容器", delivery_gate)
        self.assertIn("字段总数", delivery_gate)
        self.assertIn("唯一", delivery_gate)

        builder_content = (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("data-resume-editor-id", builder_content)
        self.assertIn("容器", builder_content)

    def test_visual_resume_entrypoints_launch_the_canvas_editor(self):
        command_pattern = re.compile(
            r'npx -p @chasen-liao/resume-skills@latest resume-skills editor "<[^"\n]*visual\.html路径>"'
        )

        canvas_content = (SKILLS / "resume-canvas" / "SKILL.md").read_text(encoding="utf-8")
        command = command_pattern.search(canvas_content)
        self.assertIsNotNone(command, "resume-canvas")
        self.assertIn("明确报告未启动", canvas_content)
        self.assertRegex(canvas_content, r"ATS-safe 模式[^\n]*不(?:使用|启动) Canvas")

        gate_content = (SKILLS / "resume-builder" / "references" / "delivery-gate.md").read_text(
            encoding="utf-8"
        )
        self.assertLess(gate_content.index("渲染与布局验证"), gate_content.index("可选 Canvas 预览与路由"))
        self.assertIn("resume-canvas", gate_content)
        self.assertRegex(gate_content, r"ATS-safe 模式[\s\S]{0,200}?不(?:使用|启动) Canvas")

        for skill_name in CORE_WORKFLOW_SKILLS:
            content = (SKILLS / skill_name / "SKILL.md").read_text(encoding="utf-8")
            self.assertIn("resume-canvas", content, skill_name)
            self.assertRegex(content, r"ATS-safe 模式[\s\S]{0,200}?不(?:使用|启动) Canvas", skill_name)

    def test_matching_report_uses_traceable_requirement_states(self):
        content = (SKILLS / "jd-tailorer" / "references" / "matching-analysis.md").read_text(encoding="utf-8")
        self.assertIn("要求 ID", content)
        self.assertIn("JD 来源", content)
        self.assertIn("候选人证据", content)
        self.assertIn("直接匹配", content)
        self.assertNotIn("关键词覆盖率", content)
        self.assertNotIn("JD 高频要求", content)

    def test_skill_instructions_do_not_claim_unsupported_pdf_checks(self):
        for content in (
            (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8"),
            (SKILLS / "resume-builder" / "references" / "delivery-gate.md").read_text(encoding="utf-8"),
        ):
            self.assertNotIn("页数、裁切、复制文本、链接和字体", content)

        delivery_gate = (SKILLS / "resume-builder" / "references" / "delivery-gate.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("可提取文本", delivery_gate)

    def test_resume_builder_requires_portable_visual_resources(self):
        content = (SKILLS / "resume-builder" / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("data URL", content)
        self.assertIn("系统字体回退", content)

    def test_resume_canvas_documents_editor_protocol_and_lifecycle(self):
        canvas_file = SKILLS / "resume-canvas" / "SKILL.md"
        self.assertTrue(canvas_file.is_file(), f"missing {canvas_file}")
        content = canvas_file.read_text(encoding="utf-8")

        self.assertRegex(content, r"^---\nname: resume-canvas\n")
        self.assertIn("description:", content)
        self.assertIn("data-resume-editor-template", content)
        self.assertIn("data-resume-editor-version=\"1\"", content)
        self.assertIn("data-resume-editor-id", content)
        self.assertIn("可独立编辑", content)
        self.assertIn("禁止把", content)
        self.assertIn("容器", content)
        self.assertIn("resume-skills validate", content)
        self.assertIn("resume-skills editor", content)
        self.assertIn("--manifest", content)
        self.assertIn("--json", content)
        self.assertIn("--no-open", content)
        self.assertIn("--port", content)
        self.assertIn("Live Preview", content)
        self.assertIn("重新渲染", content)
        self.assertIn("render_resume.ps1", content)
        self.assertIn("明确报告未启动", content)
        self.assertRegex(content, r"ATS-safe 模式不(?:使用|启动) Canvas")

    def test_workflow_skills_route_to_resume_canvas(self):
        for skill_name in CORE_WORKFLOW_SKILLS:
            content = (SKILLS / skill_name / "SKILL.md").read_text(encoding="utf-8")
            self.assertIn("resume-canvas", content, f"{skill_name} should route to resume-canvas")


if __name__ == "__main__":
    unittest.main()
