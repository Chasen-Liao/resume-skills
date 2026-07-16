---
name: resume-ats-optimizer
description: 审计简历的 ATS 可解析性、检查 JD 关键词覆盖和生成 ATS-safe 输出建议。当用户提到 ATS、机器筛选、关键词匹配、简历解析失败或投递平台格式时使用。提供可解释风险检查，不保证通过任何 ATS 或获得面试。
---

# ATS 简历审计器

将“更容易被解析”的建议与“保证通过筛选”明确区分，并保持候选人事实不变。

## 先读

读取 [简历事实契约](../resume-builder/references/resume-contract.md) 与 [写作规范中的 ATS 输出规则](../resume-builder/references/content-writing.md)。如果已有 HTML 或 PDF，优先运行：

```powershell
python skills/resume-builder/scripts/validate_resume.py --html <resume.html> --mode ats
python skills/resume-builder/scripts/validate_resume.py --pdf <resume.pdf>
```

## 工作流

1. 检查输入格式、是否存在可提取文本、标准章节标题和正文阅读顺序。
2. 对 HTML 检查图像承载文字、表格、复杂定位、页眉页脚、不可复制文本等风险；对 PDF 检查页数与文本提取。
3. 从 JD 分析中读取关键词，按“已确认候选人事实中的精确匹配 / 相关表达 / 缺失”报告覆盖情况。
4. 给出两类建议：呈现修复（可直接做）与事实缺口（只能追问或保留缺口）。
5. 需要导出时，以同一事实源生成单栏、标准标题、普通文本的 ATS-safe HTML/PDF；不为提高匹配率增加技能。

## 输出格式

```markdown
# ATS 审计报告
## 解析与格式
- 通过：…
- 风险：…
## 关键词覆盖
| 关键词 | JD 来源 | 简历证据 | 状态 |
## 建议
1. 可直接修复：…
2. 需要候选人确认：…
```

## 约束

- “ATS-safe”表示降低已知解析风险，不代表任何具体系统一定读取正确。
- 不使用图片、图表或视觉布局承载关键信息；不改变 claim 内容与证据状态。
- 不以关键词堆砌替代可读的自然表达。
