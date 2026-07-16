# Task 1 独立 Luna 审查

审查对象：

- `.superpowers/sdd/task-1-report.md`
- `skills/resume-builder/references/resume-contract.md`
- `skills/resume-builder/references/content-writing.md`
- 为验证实际衔接而对照检查：`skills/resume-builder/SKILL.md`、`skills/jd-tailorer/SKILL.md`

## 结论

- **SPEC: FAIL**
- **QUALITY: FAIL**

两份参考文档本身已覆盖事实边界、`source`、`confidence`、`evidence`、`metric_status` 和 anti-fabrication，也已移除目标文档中的数字硬约束、固定 STAR/80 字规则及无来源市场统计；ATS-safe 与视觉模式的概念区分基本清楚。  
但这些规则没有与现有 skill 入口建立有效的优先级或执行衔接，导致实际工作流仍会触发旧约束；此外，校园经历未纳入契约枚举/检查范围，ATS-safe 也只有文字规范而没有现有生成路径。因此不能判定 Task 1 已完整、可落地地满足规格。

## Critical findings

None.

## Important findings

### I-1：现有入口仍直接强制已要求移除的规则

位置：

- `skills/resume-builder/SKILL.md:24-27`
- `skills/jd-tailorer/SKILL.md:41-49`

两个入口仍分别要求：每条经历必须有数字、自我评价不超过 80 字且三句话、技能 8-12 项，以及 JD 关键词覆盖率 ≥70%。`jd-tailorer` 还重复要求每条经历至少一个数字。它们虽然读取 `content-writing.md`，却没有声明共享参考文档优先，也没有删除/改写这些冲突条款。报告已识别该风险，但因此当前工作流不能实际遵循“数字不是硬门槛、STAR 非固定格式、summary 不设固定字数”的新规则。

### I-2：ATS-safe 模式未接入现有生成工作流，且格式承诺超出现有能力

`content-writing.md:69-82` 清楚区分了视觉 HTML/PDF 与 ATS-safe 模式，但：

- `resume-builder/SKILL.md` 只有视觉 HTML/PDF 的生成流程，没有模式选择、ATS-safe 模板或 ATS-safe 验证分支；
- `jd-tailorer/SKILL.md` 只沿用基础简历 CSS，并固定输出 `resume.html`/PDF，没有 ATS-safe 输出路径；
- `content-writing.md:80` 将 HTML、PDF、DOCX 都列为可按平台选择的格式，但仓库现有工作流没有 DOCX 生成能力。

所以模式定义在文档层面清楚，实际产物层面尚未区分或可执行。

### I-3：契约遗漏现有工作流中的“校园经历”板块

`resume-builder/SKILL.md:22` 的信息收集流程包含“校园经历”，但 `resume-contract.md:31` 的 `section` 枚举和 `content-writing.md:116` 的逐 claim 检查清单只覆盖 `profile`、`education`、`experience`、`projects`、`skills`、`awards`、`summary`。校园经历因此没有明确的事实字段、元数据和最终输出门槛；如果把校园经历归入 `experience`，文档也没有说明这一映射，容易造成执行不一致。

### I-4：关键元数据的“契约性”表述偏弱，缺少工作流落点

`resume-contract.md:14-39` 使用“至少可以包含”“建议内部以如下记录保存或检查”的表述。虽然 `resume-contract.md:59-67` 和 `content-writing.md:114-120` 给出了输出门槛，但没有规定 resume-builder/jd-tailorer 必须以何种中间结构保存每条 claim，也没有要求匹配分析或生成前检查读取并拒绝不合格 claim。对共享事实契约而言，这更像指导原则而不是可执行接口，容易被旧的 prose 规则绕过。

## Minor findings

### M-1：报告中的模式描述有措辞歧义

`task-1-report.md:14` 写成“补充 ATS 两种输出模式”，容易理解为“ATS 内部有两种模式”。准确表述应是“补充视觉 HTML/PDF 与 ATS-safe 两种输出模式”，与参考文档标题保持一致。

### M-2：待确认链接与最终输出门槛的边界未写清

`content-writing.md:49` 允许链接“明确标记待确认”，但 `resume-contract.md:67` 要求不满足门槛的内容进入待确认清单而不是进入最终输出。应明确“待确认”只允许出现在采集/草稿/待确认清单中，不能出现在最终简历成稿中。

### M-3：ATS-safe 的“特殊符号”等措辞不够可操作

`content-writing.md:78` 的“特殊符号”范围未定义，可能误伤正常项目符号、连字符或技术名称。建议后续以可复制性、文本顺序和目标解析器验证为准，并给出允许/禁止示例。

## 已确认的通过项

- 事实契约明确禁止从 JD、市场文章和模板示例推导候选人事实，并限制实体、数字、因果和能力等级的新增。
- 四个核心元数据字段均有字段定义和示例；`metric_status` 区分 `verified`、`estimated`、`unverified`、`not_applicable`，并限制未验证指标进入成稿。
- `content-writing.md` 已把 STAR 改为可选分析框架，取消每条经历必须有数字、固定 80 字/三句和固定技能数量的参考文档规则。
- 目标文档中未发现原先的无来源市场统计；`content-writing.md` 到 `resume-contract.md` 的相对链接存在且可解析。
- 视觉模式与 ATS-safe 模式共享事实数据但不得改变 claim 内容或证据状态，方向正确。

