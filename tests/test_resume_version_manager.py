import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
SKILL = SKILLS / "resume-version-manager" / "SKILL.md"
README = ROOT / "README.md"
SKILL_CONTENTS = {
    name: (SKILLS / name / "SKILL.md").read_text(encoding="utf-8")
    for name in (
        "resume-builder",
        "job-description-analyzer",
        "resume-bullet-writer",
        "jd-tailorer",
        "resume-ats-optimizer",
        "resume-version-manager",
    )
}


class ResumeVersionManagerTests(unittest.TestCase):
    def test_documents_local_git_history_without_automatic_commits(self):
        content = SKILL.read_text(encoding="utf-8")

        self.assertIn("本地私有 Git 仓库", content)
        self.assertIn("母版变更", content)
        self.assertIn("定制版", content)
        self.assertIn("不自动执行 Git 初始化、提交、推送或覆盖", content)

    def test_readme_recommends_private_git_history_for_resume_versions(self):
        content = README.read_text(encoding="utf-8")

        self.assertIn("本地私有 Git 仓库", content)
        self.assertIn("不应推送到公开远程仓库", content)

    def test_readme_documents_the_orchestrated_resume_workflow(self):
        content = README.read_text(encoding="utf-8")

        self.assertIn("解析 → 确认 → 增量追问", content)
        self.assertIn("变更预览", content)
        self.assertIn("条件触发", content)
        self.assertIn("质量关卡", content)

    def test_skills_document_the_orchestrated_resume_workflow(self):
        self.assertIn("已有简历", SKILL_CONTENTS["resume-builder"])
        self.assertIn("增量追问", SKILL_CONTENTS["resume-builder"])
        self.assertIn("进入 `jd-tailorer`", SKILL_CONTENTS["job-description-analyzer"])
        self.assertIn("条件触发", SKILL_CONTENTS["resume-bullet-writer"])
        self.assertIn("变更预览", SKILL_CONTENTS["jd-tailorer"])
        self.assertIn("质量关卡", SKILL_CONTENTS["resume-ats-optimizer"])
        self.assertIn("主流程", SKILL_CONTENTS["resume-version-manager"])


if __name__ == "__main__":
    unittest.main()
