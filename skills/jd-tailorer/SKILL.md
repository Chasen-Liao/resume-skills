---
name: jd-tailorer
description: 根据职位描述(JD)进行结构化分析、岗位匹配度诊断、ATS 可读性审计与定向简历定制的完整工作站。当用户提到「JD」「职位描述」「岗位匹配」「分析这个 JD」「我是否适合」「针对...改简历」「投递」「求职」「招聘要求」「Job Description」「ATS 筛选」或保存不同投递版本时使用。支持仅分析 JD 输出诊断报告，或一站式生成针对该岗位的定制版 HTML/PDF、匹配报告与版本记录。
---

# JD 简历定制器 (JD Tailorer)

一站式完成 JD 结构化分析、岗位匹配度评估、简历定向定制、ATS 质量门禁与投递版本归档。**不编造经历，以事实契约与已确认事实为唯一边界**。

## 前置条件

需已有基础简历和已确认事实。优先读取私有 `resume-facts.yaml`；若只有旧简历内容或 HTML，先通过 `resume-builder` 或 `resume-workflow` 提取、确认并建立事实文件，不能把未确认的解析内容直接用于定制。

## 核心职责与模式分支

本技能承接两类使用场景，无需跨技能跳转：
1. **仅分析诊断模式**：当用户仅提供 JD 并询问“我是否适合”、“帮我分析这个 JD”、“岗位匹配度”时，输出要求地图、匹配证据与缺口分析，不生成简历；
2. **完整定制模式**：在分析基础上向用户展示**变更预览**，用户确认后一站式生成定制 HTML/PDF、执行 ATS 质量审计、生成版本记录并提供 Canvas 微调。

**协作流转与出口**：
- **排版微调**：视觉定制版生成并完成 PDF 验证后，若用户需要交互式微调，**路由至 `resume-canvas`**；
- **微调重验**：Canvas 微调保存后，必须回到 Agent 工作流重新核验事实与渲染验证 PDF，并更新版本记录。

## 参考文件解析

- 所有相对路径都以本 `SKILL.md` 所在目录为基准，不以当前工作目录为基准。
- 开始工作前，必须先读取并遵循 `../resume-builder/references/resume-contract.md` 和 `../resume-builder/references/content-writing.md`；两份共享参考文档优先于本入口中的示例、版式偏好和流程提示。
- 若 `resume-builder` 与本 skill 一起安装，再读取 `../resume-builder/references/design-guidelines.md` 和对应的 CSS 文件。
- 本 skill 必须与 `resume-builder` 一起安装；缺少共享参考文件时，要求用户安装完整 skill 集后再继续，不猜测契约规则，也不承诺 DOCX 生成。

## 工作流程

### 第一步：获取与解构 JD

1. 让用户粘贴 JD 文本、上传文件或提供职位链接。
2. 结构化解构 JD 要求并分类：
   - `must_have`：硬性门槛（专业、年限、核心技术栈）；
   - `preferred`：加分项与优势项；
   - `responsibility`：核心岗位职责；
   - `context`：业务场景、团队文化或工作方式信号。
   每项尽量保留 JD 原文关键词或段落作为依据。

### 第二步：对照事实库进行匹配分析

将 JD 要求与用户已确认的 `resume-facts.yaml`（或母版事实）逐一比对：
- **直接匹配**：已有经历/技能中具备强相关证据；
- **相关证据**：有相似或可迁移经验，但术语未对齐或表达偏弱；
- **真实缺口**：JD 要求但候选人不具备（如实记录，绝不编造技能或虚构指标）；
- **待确认**：需要向候选人进一步核实的事项（不进入最终简历成稿）。

若用户仅需要投递可行性评估，此时直接交付包含《要求地图》与《匹配度建议》的诊断报告，结束流程。

### 第三步：变更预览与用户确认（门禁）

在生成定制简历前，**必须向用户展示变更预览并取得确认**：
1. **经历重排与前置**：说明哪些强相关项目或经历会前置；
2. **术语与表达对齐**：说明哪些措辞或技能标签会对齐 JD 术语；
3. **保留的缺口与弱化项**：明确说明哪些 JD 要求属于未匹配缺口（如实保留缺口，不硬加关键词）。
用户明确同意变更预览后，才进入定制成稿生成。

### 第四步：内容定制规范

遵循已先读取的事实契约和写作规范（`../resume-builder/references/resume-contract.md`、`../resume-builder/references/content-writing.md`）：
- **清晰表达**：优先使用 `强动词 + 具体动作/技术 + 结果或证据 + 背景/范围` 组织 bullet；没有数字时使用已确认的非数字证据，不强行编造指标；
- **关键词自然对齐**：将已确认事实中的技术表达对齐 JD 常用词，严禁 keyword stuffing；
- **板块与重点重排**：按 JD 相关性调整板块顺序；
- **区分度说明**：定制完成后向用户清晰说明相较于母版的改动点。

### 第五步：生成定制文件与目录隔离

先让用户在视觉 HTML/PDF 与 ATS-safe HTML/PDF 中选择输出模式，统一输出到专用的岗位目录 `tailored/<公司名>-<岗位>/` 中，**绝对不覆盖母版**：
- 视觉模式：`resume_visual.html` 与 `resume_visual.pdf`，沿用基础简历 CSS 风格；
- ATS-safe 模式：`resume_ats.html` 与 `resume_ats.pdf`，采用单栏标准正文结构；
- `matching-analysis.md`：岗位匹配分析报告（模板见 `references/matching-analysis.md`）；
- `version-notes.md`：版本与投递记录（记录父版本、JD 来源与日期、变更摘要、关键词来源、保留缺口与验证结果）。

若沿用内置视觉样式，根节点声明 `data-resume-layout="full-page"`，保留 `data-resume-editor-template`、`data-resume-editor-version="1"` 和稳定、唯一、语义化的叶子级 `data-resume-editor-id`（禁止整页或板块容器加 ID）。

### 第六步：PDF 验证与质量审计

交付前必须执行质量审计与 PDF 验证：
1. **ATS 可解析性审计**：
   - 检查正文阅读顺序，确保无隐藏文字、无纯图片承载文字、无复杂分栏 CSS；
   - 若环境具备 Python 脚本，运行自动化门禁：
     ```bash
     python skills/resume-builder/scripts/validate_resume.py --html "<tailored目录中的html路径>" --mode ats
     ```
2. **Canvas 协议验收**（视觉模式）：
   ```bash
   npx -p @chasen-liao/resume-skills@latest resume-skills validate "<tailored目录中的resume_visual.html路径>"
   ```
   确保输出“校验通过”。每个需要编辑的文本节点必须是可独立编辑的叶子字段；禁止把编辑 ID 放在 `<html>`、`<body>`、`<main>`、`.page`、`.resume`、`header`、`footer`、`section`、`ul`、`ol`、`figure` 或包含多个字段的复合容器上。字段总数必须大于 0 且 ID 唯一。
3. **Playwright 渲染与单页验证**（视觉模式）：
   运行 `render_resume.ps1` 渲染真实 PDF 并生成 preview 与 manifest。PDF 必须恰好 1 页、页面有效占用率默认 $\ge 98\%$ 且保留底部安全距。

### 第七步：交付与 Canvas 预览

1. **Canvas 预览（可选）**：
   视觉模式完成 PDF 验证后，询问用户是否需要本地 Canvas 预览微调。用户需要时执行：
   ```bash
   npx -p @chasen-liao/resume-skills@latest resume-skills editor "<tailored目录中的resume_visual.html路径>"
   ```
   用户若需要排版微调，**路由至 `resume-canvas`**；Canvas 保存后 manifest 失效，必须回到工作流重验。若用户选择 Canvas 但当前环境无法执行 `npx`，明确报告未启动，并提供带实际 HTML 路径的完整命令，不得声称已预览。
   ATS-safe 模式不启动 Canvas，只交付文件位置和浏览器打印方法。
2. **版本追踪与 Git 提交建议**：
   建议用户将简历工作区置于本地私有 Git 仓库中管理。定制生成后，给出语义化提交建议，例如：
   ```bash
   git add resume-facts.yaml tailored/<公司名>-<岗位>/
   git commit -m "定制：<公司名> - <岗位>"
   ```
   **约束**：不自动执行 Git 初始化、提交、推送或覆盖，必须由用户确认或自行执行。

## 硬约束

- 绝不编造经历，修改仅限于措辞、重排和对齐真实证据；
- 待确认字段只能出现在分析报告，不能进入最终成稿；
- 定制版本独立存放于 `tailored/<公司名>-<岗位>/`，绝不静默覆盖母版；
- 视觉模式沿用基础简历 CSS 风格，ATS-safe 模式严格遵守单栏与纯文本可提取标准。

## 参考文档

- `../resume-builder/references/resume-contract.md` — 事实契约（每次工作前先读取）
- `../resume-builder/references/content-writing.md` — 写作规范（每次工作前先读取）
- `../resume-builder/references/design-guidelines.md` — 设计美学指南（备用：用户无基础简历时参考）
- `../resume-builder/references/css/<style>.md` — 对应风格 CSS 变量与布局
- `references/matching-analysis.md` — 匹配分析报告模板
