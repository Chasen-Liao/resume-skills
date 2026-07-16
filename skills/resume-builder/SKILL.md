---
name: resume-builder
description: 通过对话式采访构建精美简历的技能。当用户提到「简历」「resume」「CV」「求职」「找工作」「面试」「制作简历」「生成简历」或者想要创建一个展示个人经历和技能的网页时使用。支持 HTML 简历生成、A4 纸打印布局、PDF 导出。能够引导用户逐步完善简历内容，从个人信息到项目经历全面覆盖。
---

# 简历构建器 (Resume Builder)

通过对话为用户创建**视觉精美、排版专业**的 HTML/PDF 简历，支持视觉 A4 单页和 ATS-safe 两种输出模式。

## 核心理念

- 输出：独立 HTML 文件，内嵌 CSS，A4 尺寸（210mm × 297mm），浏览器打印 PDF
- 设计：大胆有辨识度，拒绝通用 AI 审美（详见 `references/design-guidelines.md`）
- 生成前先选择输出模式：视觉 HTML/PDF 或 ATS-safe HTML/PDF；两种模式共享同一事实数据。

## 先决规则

开始收集、写作或生成前，必须先完整读取并遵循 `references/resume-contract.md` 和 `references/content-writing.md`。这两份共享参考文档优先于本入口中的示例、版式偏好和流程提示；证据不足时保留事实边界，不为填满版面或迎合格式补写内容。

## 工作流程

### 第一步：信息收集

逐个板块提问，不要一次抛出所有问题。按 `resume-contract.md` 建立每条 claim 的 `section`、`source`、`confidence`、`evidence`、`metric_status` 记录，再按 `content-writing.md` 写作。

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
- A4 尺寸、页边距、字号、间距、行高等排版参数参见 `css/common.md`（唯一定义源）
- CSS 变量统管颜色，系统字体栈（PingFang SC, Microsoft YaHei）
- 技能标签用 `<span class="skill-badge">` 排列，badge 样式由风格 CSS 定义（ATS 友好）
- 内含「导出 PDF」按钮
- 使用任一内置风格时，生成的 `<html>` 必须包含对应的 `data-resume-editor-template`（`modern-minimal`、`classic-business`、`creative-bold`、`japanese-minimal`、`minimal-blue-business` 或 `tech-dark`）和 `data-resume-editor-version="1"`。可为真实文本提供稳定的 `data-resume-editor-id`；未标记的内置模板文字由本地 Canvas 在打开时补齐可编辑标记。
- 上述标记供 `npx @chasen-liao/resume-skills editor <resume.html>` 的本地 Canvas 微调器识别；它只允许用户修改已有文字和受限排版，不能替代事实契约或 JD 定制流程。不要将标记用于头像、布局容器、任意 HTML 或未经确认的字段。

ATS-safe 模式：
- 使用单栏、标准板块标题、普通可复制文本和稳定的正文阅读顺序；重要信息不依赖图片、文本框、复杂嵌套表格、页眉页脚或装饰字体。
- 技能以可复制文本列表表达；不因 ATS-safe 模式改变 claim 内容、证据状态或删除待确认标记之外的事实。
- 同样只生成 HTML 与浏览器打印 PDF；仓库当前没有 DOCX 生成能力，不承诺 DOCX 产物。

### 第四步：按模式验证（强制执行，不可跳过）

视觉 HTML/PDF：导出 PDF：`npx playwright pdf <html> <output.pdf>`；用 `pypdf` 检查页数，并检查裁切、复制文本、链接和中文字体。视觉模式以 A4 单页为目标，溢出时只能在不损害事实和可读性的前提下调整排版。

ATS-safe HTML/PDF：检查 DOM 是否单栏、标题和时间/组织/职位关系是否清晰、正文复制后顺序是否正确，以及 PDF 文本是否可提取；再检查无图片文字、复杂嵌套表格、关键页眉页脚信息和不可复制装饰字体。按目标平台要求检查 HTML/PDF 格式，不宣称 ATS 必然通过。

### 第五步：交付

告知文件位置、打印 PDF 方法、可用 jd-tailorer 针对 JD 定制。

## 参考文档索引

`references/` 目录下按需读取：
- `design-guidelines.md` — 设计美学、字体排版、单页参数细节
- `resume-contract.md` — 事实来源、证据、置信度、指标状态和输出门槛
- `color-palettes.md` — 六大风格-配色索引
- `content-writing.md` — 证据优先写作、ATS 两种输出模式、自检清单
- `css/README.md` — CSS 使用方式与配色选择策略
- `css/common.md` — 通用紧凑排版 CSS（每次必用）
- `css/<style>.md` + `examples/<style>.html` — 每个风格一对参照文件
