---
name: jd-tailorer
description: 根据职位描述(JD)定制简历的技能。当用户提到「JD」「职位描述」「岗位匹配」「针对...改简历」「投递」「求职」「招聘要求」「Job Description」或者提供具体职位链接/文本要求修改简历时使用。支持上传或粘贴 JD 文本，自动进行关键词匹配和内容优化，基于已有简历生成针对该岗位的定制版 HTML 和 PDF。
---

# JD 简历定制器 (JD Tailorer)

根据职位描述定制简历——关键词对齐 + 内容重排序 + 术语对齐。**不编造经历**。

## 前置条件

需已有基础简历和已确认事实。优先读取私有 `resume-facts.yaml`；若只有旧简历内容或 HTML，先通过 `resume-builder` 或 `resume-workflow` 提取、确认并建立事实文件，不能把未确认的解析内容直接用于定制。

## 协作入口

优先接收 `job-description-analyzer` 基于 `resume-facts.yaml` 生成的要求地图与匹配证据；若没有，先在本 skill 内完成同等分析。生成前必须向用户展示**变更预览**：哪些已确认经历会前置、哪些措辞会对齐 JD、哪些要求仍是缺口；用户确认后才生成定制版。

生成后可调用 `resume-ats-optimizer` 作为质量关卡，并将确认的版本交给 `resume-version-manager` 记录；两者都不得静默改写或覆盖定制版。

## 参考文件解析

- 所有相对路径都以本 `SKILL.md` 所在目录为基准，不以当前工作目录为基准。
- 开始 JD 分析、匹配或改写前，必须先读取并遵循 `../resume-builder/references/resume-contract.md` 和 `../resume-builder/references/content-writing.md`；两份共享参考文档优先于本入口中的示例、版式偏好和流程提示。
- 若 `resume-builder` 与本 skill 一起安装，再读取 `../resume-builder/references/design-guidelines.md` 和对应的 CSS 文件。
- 本 skill 必须与 `resume-builder` 一起安装；缺少共享参考文件时，要求用户安装完整 skill 集后再继续，不猜测契约规则，也不承诺 DOCX 生成。

## 工作流程

### 第一步：获取 JD

让用户粘贴 JD 文本或上传文件。

### 第二步：JD 分析

提取：核心技术要求、加分项、关键词（技术栈/行业术语/软技能）、岗位职责、公司文化暗示。简要呈现分析结果确认。

### 第三步：匹配分析

对比简历与 JD：
- 匹配点：已有的强相关经验/技能
- 缺失点：JD 要求但不具备的（如实告知，不编造）
- 弱化点：有关联度低的内容（保留但降优先级）

### 第四步：内容定制

遵循已先读取的事实契约和写作规范（`../resume-builder/references/resume-contract.md`、`../resume-builder/references/content-writing.md`）。每条改写前先核对 claim 的来源、证据、置信度和指标状态；待确认字段只写入采集/分析报告，不能进入最终简历成稿。

**改写检查清单（每次改写必须逐条核对）**：

- **清晰表达**：优先用清楚的行动、技术、结果或证据、背景/范围组织 bullet；没有数字时使用已确认的非数字证据，不补写指标。
- **关键词优化**：术语对齐 JD → 自然融入描述和技能标签；关键词用于排序与表达，不设覆盖率硬指标，不进行 keyword stuffing。
- **板块重排**：按 JD 相关性调整板块顺序；项目和校园经历是否前置由候选人阶段、证据强度和岗位相关性决定。
- **内容微调**：只重排、压缩和对齐已有 claim；自我评价从已验证事实归纳，不设固定字数或句数。
- **区分度说明**：定制完成后向用户说明改动点

### 第五步：生成定制文件

先让用户在视觉 HTML/PDF 与 ATS-safe HTML/PDF 中选择模式，再输出到 `tailored/<公司名>-<岗位>/`：
- 视觉模式：`resume-visual.html` 与 `resume-visual.pdf`，沿用基础简历 CSS 风格并进行视觉打印验证
- ATS-safe 模式：`resume-ats.html` 与 `resume-ats.pdf`，使用单栏和标准文本结构并进行 ATS-safe 解析验证
- `matching-analysis.md` — 匹配分析报告（模板见 `references/matching-analysis.md`）
- `matching-analysis.md` 可包含匹配缺口、关键词来源和待确认字段；待确认字段不得复制到上述最终 HTML/PDF。
- 仓库当前只生成 HTML 与浏览器打印 PDF，没有 DOCX 生成能力，不承诺 DOCX 产物。
- 若沿用任一内置视觉样式，保留或生成对应的 `data-resume-editor-template`、`data-resume-editor-version="1"` 和已有的稳定 `data-resume-editor-id` 文字标记；Canvas 也会为未标记的内置模板文字补齐可编辑标记，使用户可在不改变定制工作流的前提下做后续文字/排版微调。

### PDF 验证

视觉模式：导出 PDF → 用 `validate_resume.py --pdf <output.pdf>` 检查 PDF 页数和可提取文本，再在浏览器或渲染截图中人工检查是否单页、是否有可见裁切，以及字体和链接是否符合投递要求；当前脚本不能自动判定视觉裁切、字体嵌入或链接注释。ATS-safe 模式：检查 HTML 单栏、标准标题、正文阅读顺序和纯文本可解析性，并验证 PDF 文本提取结果；两种模式都不能通过删改事实来解决版面或解析问题。

## 硬约束

- 绝不编造经历，修改仅限于措辞和呈现方式
- 待确认字段只能出现在采集/分析报告，不能进入最终简历成稿
- 视觉模式沿用基础简历的 CSS 视觉风格；ATS-safe 模式优先遵循单栏、标准标题和可解析正文结构

## 参考文档

- `../resume-builder/references/resume-contract.md` — 事实契约（每次工作前先读取）
- `../resume-builder/references/content-writing.md` — 写作规范（每次工作前先读取）
- `../resume-builder/references/design-guidelines.md` — 设计美学指南（备用：用户无基础简历时参考）
- `../resume-builder/references/css/<style>.md` — 对应风格 CSS 变量与布局
- `references/matching-analysis.md` — 匹配分析报告模板
