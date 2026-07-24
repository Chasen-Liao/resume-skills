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

视觉模式：导出 PDF 后运行 `python skills/resume-builder/scripts/validate_resume.py --html <resume-visual.html> --pdf <resume-visual.pdf> --mode visual --check-layout --min-fill-ratio 0.78 --json`。PDF 必须恰好 1 页；`page fill` 低于 78% 或 `vertical balance` 有警告时，优先均匀调整已确认内容的板块间距、条目间距、行高和容器内边距；`bottom safety` 失败或页数大于 1 时必须回退排版。任何警告都要重新导出并复验，不能编造内容或用不可读字号填充。然后在浏览器或渲染截图中人工检查可见裁切、字体回退和链接；ATS-safe 模式仍检查 HTML 单栏、标准标题、正文阅读顺序和纯文本可解析性，并验证 PDF 文本提取结果。

### 交付与 Canvas 预览

视觉模式完成 PDF 验证和必要修正后，必须启动定制版的本地 Canvas 预览：

```bash
npx @chasen-liao/resume-skills editor "<tailored目录中的resume-visual.html路径>"
```

高级 CLI 参数说明（适用于 Agent 自动化或无 GUI 容器环境）：
- `--json`：以 JSON 格式输出一次服务启动信息（如 URL、端口和源 HTML 路径）；服务会继续运行，供 Agent 连接该地址。
- `--no-open`：禁用自动打开系统浏览器（适合控制台或集成环境）。
- `--port <number>`：指定监听端口。
- **Live Preview**：编辑器建立连接后支持 SSE 热刷新。当 Agent 重新写入或修改该 HTML 时，页面将自动重载展示最新效果。

命令会启动本地服务并尝试打开浏览器。告知用户定制版 HTML/PDF 与匹配报告的位置；Canvas 保存时会直接覆盖定制版 HTML，使其成为最新版本。若当前环境无法执行 `npx`，明确报告未启动，并提供带实际 HTML 路径的完整命令，不得声称已预览。ATS-safe 模式不启动 Canvas，只交付文件位置和浏览器打印方法。

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
