import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
TAILORER_SKILL = SKILLS / "jd-tailorer" / "SKILL.md"
BUILDER_SKILL = SKILLS / "resume-builder" / "SKILL.md"
README = ROOT / "README.md"


class ResumeVersionManagerTests(unittest.TestCase):
    def test_tailorer_skill_documents_isolated_output_and_version_notes(self):
        content = TAILORER_SKILL.read_text(encoding="utf-8")

        self.assertIn("tailored/<公司名>-<岗位>/", content)
        self.assertIn("version-notes.md", content)
        self.assertIn("版本与投递记录", content)
        self.assertIn("变更摘要", content)
        self.assertIn("保留缺口", content)
        self.assertIn("绝对不覆盖母版", content)

    def test_tailorer_skill_documents_local_git_history_without_automatic_commits(self):
        content = TAILORER_SKILL.read_text(encoding="utf-8")

        self.assertIn("本地私有 Git 仓库", content)
        self.assertIn("定制：<公司名> - <岗位>", content)
        self.assertIn("不自动执行 Git 初始化、提交、推送或覆盖", content)

    def test_readme_recommends_private_git_history_for_resume_versions(self):
        content = README.read_text(encoding="utf-8")

        self.assertIn("本地私有 Git 仓库", content)
        self.assertIn("不应推送到公开远程仓库", content)


if __name__ == "__main__":
    unittest.main()
