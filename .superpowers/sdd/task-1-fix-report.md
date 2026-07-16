# Task 1 review-fix 修复说明

日期：2026-07-15

## 修复范围

仅修改以下 4 个 skill 文档，并按要求写入验证报告：

- `skills/resume-builder/SKILL.md`
- `skills/jd-tailorer/SKILL.md`
- `skills/resume-builder/references/resume-contract.md`
- `skills/resume-builder/references/content-writing.md`

## 修复内容

1. 移除两个入口中与证据优先规则冲突的数字、固定字数/句数、固定技能数量和关键词覆盖率硬约束。
2. 将 `resume-contract.md` 与 `content-writing.md` 声明为两个入口在收集、分析、匹配和改写前必须读取并遵循的共享规则。
3. 在事实契约中新增 `campus` section，并补充校园经历的组织/活动、角色、时间、行动、交付物和结果字段；写作规则与检查清单同步覆盖 `campus`。
4. 为两个入口增加视觉 HTML/PDF 与 ATS-safe HTML/PDF 的模式选择、产物命名和对应验证路径。视觉模式检查打印布局；ATS-safe 模式检查单栏结构、标准标题、正文顺序和文本提取。
5. 明确当前仓库只生成 HTML 和浏览器打印 PDF，没有 DOCX 生成能力，不承诺 DOCX 产物。
6. 明确待确认字段只能出现在采集记录或分析报告，不能进入最终 HTML/PDF 简历成稿。

## 验证

UTF-8 quick_validate：

```text
resume-builder: Skill is valid! (exit=0)
jd-tailorer: Skill is valid! (exit=0)
```

未提交、未推送、未回滚其他修改；未实现脚本、模板或 README。
