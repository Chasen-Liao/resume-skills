---
name: resume-builder
description: 通过对话式采访构建与更新母版简历的技能。当用户提到「母版简历」「基础简历」「创建简历」「制作简历」「生成简历」「更新简历」「resume」「CV」或者想要创建一个展示个人经历和技能的网页时使用。支持 HTML 简历生成、A4 纸打印布局、PDF 导出。能够引导用户逐步完善简历内容，从个人信息到项目经历全面覆盖。
---

# 简历构建器 (Resume Builder)

通过对话为用户创建**视觉精美、排版专业**的 HTML/PDF 简历，支持视觉 A4 单页和 ATS-safe 两种输出模式。

## 核心理念

- 输出：独立 HTML 文件，内嵌 CSS，A4 尺寸（210mm × 297mm），浏览器打印 PDF
- 设计：大胆有辨识度，拒绝通用 AI 审美（详见 `references/design-system.md`）
- 生成前先选择输出模式：视觉 HTML/PDF 或 ATS-safe HTML/PDF；两种模式共享同一事实数据。

## 先决规则

开始收集、写作或生成前，必须先完整读取并遵循 `references/resume-contract.md` 和 `references/content-writing.md`。这两份共享参考文档优先于本入口中的示例、版式偏好和流程提示；证据不足时保留事实边界，不为填满版面或迎合格式补写内容。

首次执行渲染或命令行校验前，读取 [渲染环境与命令路径](references/runtime-setup.md)，定位完整运行时并检查依赖。命令示例中的 `skills/...` 从实际运行时根目录解析，不能假设它位于用户当前的简历目录。

## 入口与协作

这是创建和更新母版的主入口。若用户提供**已有简历**，先提取为待确认 claim，展示已识别内容、模糊项和疑似过期项；用户确认后只做**增量追问**，优先询问最近变化、缺失证据和低置信度字段。不要将解析文本直接当作最终事实，也不要重新进行完整采访。

若用户没有已有简历，按下面的信息收集流程采访。将用户确认的 claim 保存到项目目录外的私有 `resume-facts.yaml`，其结构使用 `references/resume-facts.example.yaml`；它是后续母版和 JD 定制的事实源。事实确认完成后，才选择输出模式与六个视觉模板。

**技能协作流转**：
- **经历打磨**：采访中若发现某条经历职责化、缺少具体贡献或证据不足，直接依据 `references/content-writing.md` 就地引导用户提供行动与交付物证据，就地改写为强动词结构，不打断采访主流程；
- **排版微调**：视觉母版生成并完成交付门禁验证后，若用户需要交互式微调，**路由至 `resume-canvas`**；
- **岗位定制**：母版定稿后若需投递具体岗位，**路由至 `jd-tailorer`**（一站式完成 JD 结构化分析、匹配评估与定向定制）。

## 工作流程

### 第一步：信息收集

仅在从零采访或已有简历存在缺口时逐个板块提问，不要一次抛出所有问题。按 `resume-contract.md` 建立每条 claim 的 `section`、`source`、`confidence`、`evidence`、`metric_status` 记录，并在用户确认后更新私有 `resume-facts.yaml`，再按 `content-writing.md` 写作。

收集顺序：基础信息 → 教育背景 → 实习/工作经历 → 项目经验 → 技能 → 校园经历 → 自我评价

- 优先追问可核验的指标、范围、时间、质量、角色和交付物；没有可信数字时，使用已确认的非数字证据。
- 技能数量、自我评价长度/句数和经历结构服从事实、岗位相关性与版面，不设机械数量或字数门槛。
- 应届生可根据岗位相关性前置项目或校园经历，不把固定排序当成事实规则。
- 待确认字段只能保留在采集记录或分析报告中，不能进入最终简历 HTML/PDF。

### 第二步：风格确认

先让用户选择视觉 HTML/PDF 或 ATS-safe HTML/PDF 模式，再选择或描述视觉风格。视觉模式读取对应 CSS 和 HTML 参照文件；ATS-safe 模式使用单栏、标准标题和可复制文本结构：

| 风格 | CSS | HTML 参照 |
|------|-----|----------|
| 现代简约 | `css/modern-minimal.md` | `examples/modern-minimal.html` |
| 经典商务 | `css/classic-business.md` | `examples/classic-business.html` |
| 创意个性 | `css/creative-bold.md` | `examples/creative-bold.html` |
| 日式极简 | `css/japanese-minimal.md` | `examples/japanese-minimal.html` |
| 科技感 | `css/tech-dark.md` | `examples/tech-dark.html` |
| 简约蓝色商务 | `css/minimal-blue-business.md` | `examples/minimal-blue-business.html` |

CSS 文件包含 3 套配色变量 + 推荐字体 + 风格 CSS。`css/common.md` 为通用排版（每次必用）。

### 第三步：生成 HTML

根据第二步选定的模式合并 `css/common.md` 排版 + 对应风格 CSS/布局 + 已通过契约门槛的用户信息，生成独立 HTML。视觉模式使用 `<姓名>_<岗位>_visual.html`；ATS-safe 模式使用 `<姓名>_<岗位>_ats.html`，对应 PDF 使用相同前缀和 `.pdf` 扩展名。

视觉模式：
- A4 尺寸、页边距、字号、间距、行高等排版参数参见 `css/common.md`（唯一定义源）；根 `<html>` 必须声明 `data-resume-layout="full-page"`，并保留 `--resume-density`、`--resume-density-min`、`--resume-density-max: 1.2`、`--resume-fill-target: 0.98` 和 `--resume-bottom-margin: 9mm` 变量。底部为 9mm 总边距，不再叠加额外安全区；上/左右边距保持模板原值。
- 页面主体必须按 `css/common.md` 的 full-page 契约使用可伸展的 flex/grid 布局：内容不足时先在密度上限内放大字号、行距和条目/板块间距，再用 `space-between` 分配剩余空间，内容过多时由渲染脚本在安全密度下限之上自动压缩；不得用虚构内容填白或用 `overflow: hidden` 静默裁切。
- CSS 变量统管颜色，系统字体栈（PingFang SC, Microsoft YaHei）
- 交付为单文件时，头像等本地图片使用 `data URL` 内嵌；若保留外部网页字体，必须同时提供系统字体回退，并在验证中说明离线渲染可能不同。
- 技能标签用 `<span class="skill-badge">` 排列，badge 样式由风格 CSS 定义（ATS 友好）
- 不在简历模板中嵌入导出按钮；PDF 由浏览器打印或本地 Canvas 的“打印为 PDF”操作导出，避免遮挡简历内容
- 使用任一内置风格时，生成的 `<html>` 必须包含对应的 `data-resume-editor-template`（`modern-minimal`、`classic-business`、`creative-bold`、`japanese-minimal`、`minimal-blue-business` 或 `tech-dark`）和 `data-resume-editor-version="1"`。每个需要 Canvas 微调的真实文本必须有稳定、唯一、语义化的 `data-resume-editor-id`；字段总数必须大于 0，不要依赖运行时补齐。
- `data-resume-editor-id` 只能标在一个具体的文本字段上，例如姓名、职位、日期、板块标题、单条 bullet 或单个技能标签；遵循可独立编辑原则，不要为了“通过协议检查”给整页或整块内容加一个兜底 ID。
- **禁止把编辑 ID 放在** `<html>`、`<body>`、`<main>`、`.page`、`.resume`、`header`、`footer`、`section`、`ul`、`ol`、`figure` 或包含多个板块/多个字段的容器上。带链接的联系方式应把可编辑文本拆成独立字段，不能把整行联系方式作为一个可编辑容器。
- 上述标记供本地 Canvas 微调器识别；Canvas 可编辑已有字段的纯文本并保存受限排版覆盖，不允许插入 HTML 或新增字段。文字事实变更后必须重新确认事实并验证 PDF；不要将标记用于头像、布局容器、任意 HTML 或未经确认的字段。详细协议规则参见 [交付门禁与验证契约](references/delivery-gate.md#协议校验编辑字段契约)。

ATS-safe 模式：
- 使用单栏、标准板块标题、普通可复制文本和稳定的正文阅读顺序；重要信息不依赖图片、文本框、复杂嵌套表格、页眉页脚或装饰字体。
- 技能以可复制文本列表表达；不因 ATS-safe 模式改变 claim 内容、证据状态或删除待确认标记之外的事实。
- 同样只生成 HTML 与浏览器打印 PDF；仓库当前没有 DOCX 生成能力，不承诺 DOCX 产物。

### 第四步：按模式验证（强制执行，不可跳过）

生成最终 HTML 后，必须严格执行交付门禁验证，指标要求与调整细节参见 [交付门禁与验证契约](references/delivery-gate.md)。

- **视觉 HTML/PDF**：
  1. **协议校验**：运行 `npx -p @chasen-liao/resume-skills@latest resume-skills validate "<生成的_visual.html路径>"`，确保输出“校验通过”（详见 [协议校验](references/delivery-gate.md#协议校验编辑字段契约)；validate 命令已自动校验唯一性与容器黑名单，无需手工统计）；
  2. **渲染与布局验证**：运行 `powershell -NoProfile -ExecutionPolicy Bypass -File skills/resume-builder/scripts/render_resume.ps1 -HTML "<生成的_visual.html路径>" -OutputPdf "<生成的_visual.pdf路径>"`，脚本自动完成渲染、布局计算、生成 preview 与 manifest，并检验单页、有效占用率 $\ge 98\%$、上下留白差 $\le 20\text{mm}$、最大连续空隙 $\le 25\%$ 及底部 9mm 安全区（详见 [渲染与布局验证](references/delivery-gate.md#渲染与布局验证视觉模式)；若需版面调整，严格按 [版面调整顺序](references/delivery-gate.md#版面调整顺序) 处理）；
  3. **整页截图复核**：AI 必须打开生成的 `*.preview.png`，严格按 [整页截图视觉复核（视觉模式强制执行）](references/delivery-gate.md#整页截图视觉复核视觉模式强制执行) 检查底部留白、上下平衡与双栏分布，失衡时必须调整并重新验证。
- **ATS-safe HTML/PDF**：
  - 运行 `python skills/resume-builder/scripts/validate_resume.py --html "<生成的_ats.html路径>" --mode ats`，核验单栏结构、标准标题、正文复制顺序以及 PDF 文本可提取性（详见 [ATS-safe 模式验证](references/delivery-gate.md#ats-safe-模式验证)）。

### 第五步：交付

- **视觉模式**：
  - 完成 A4 单页验证与视觉复核后，交付已验证的 HTML 与 PDF 产物；
  - 询问用户是否需要打开本地 Canvas 预览。Canvas 是可选微调工具，用户不需要时直接交付；
  - 用户确认需要预览微调、排版深入调整或高级 CLI 自动化时，**路由至 `resume-canvas` 技能**（由 `resume-canvas` 负责启动本地编辑器及环境降级处理）；
  - Canvas 保存后必须按 [Canvas 保存后重验闭环](references/delivery-gate.md#canvas-保存后重验闭环) 执行事实核验、重新渲染与截图复核。
- **ATS-safe 模式**：
  - 不使用 Canvas；告知文件位置与浏览器打印导出 PDF 方法，不承诺 DOCX。
- **后续流转**：
  - 建议用户在本地私有 Git 仓库提交初始母版（详见 [本地 Git 提交建议](references/delivery-gate.md#本地-git-提交建议)）；
  - 母版定稿后若需针对具体岗位定向定制，**路由至 `jd-tailorer`**。

## 参考文档索引

`references/` 目录下按需读取：
- `delivery-gate.md` — 交付门禁与验证契约、整页截图视觉复核、Canvas 闭环与 Git 建议
- `design-system.md` — 设计系统、美学要点、字体排版、配色策略与六大风格索引
- `resume-contract.md` — 事实来源、证据、置信度、指标状态和输出门槛
- `resume-facts.example.yaml` — 私有 `resume-facts.yaml` 的最小结构
- `content-writing.md` — 证据优先写作、ATS 两种输出模式、自检清单
- `css/common.md` — 通用紧凑排版 CSS（每次必用）
- `css/<style>.md` + `examples/<style>.html` — 每个风格一对参照文件
