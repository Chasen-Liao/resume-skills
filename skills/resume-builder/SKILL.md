---
name: resume-builder
description: 通过对话式采访构建精美简历的技能。当用户提到「简历」「resume」「CV」「求职」「找工作」「面试」「制作简历」「生成简历」或者想要创建一个展示个人经历和技能的网页时使用。支持 HTML 简历生成、A4 纸打印布局、PDF 导出。能够引导用户逐步完善简历内容，从个人信息到项目经历全面覆盖。
---

# 简历构建器 (Resume Builder)

通过对话为用户创建**视觉精美、排版专业**的 A4 单页 HTML 简历。

## 核心理念

- 输出：独立 HTML 文件，内嵌 CSS，A4 尺寸（210mm × 297mm），浏览器打印 PDF
- 设计：大胆有辨识度，拒绝通用 AI 审美（详见 `references/design-guidelines.md`）
- **强约束：必须严格控制在 1 页 A4 以内。不可妥协。**（应届生绝对单页，资深岗位优先压缩到 1 页）

## 工作流程

### 第一步：信息收集

逐个板块提问，不要一次抛出所有问题。写作规范参照 `references/content-writing.md`。

收集顺序：基础信息 → 教育背景 → 实习/工作经历 → 项目经验 → 技能 → 校园经历 → 自我评价

硬约束：
- 每条经历至少含一个**量化数字**。用户说「参与」「负责」时主动追问具体成果和数据
- 自我评价 ≤ 50 字，三句话（专业定位 / 核心能力 / 职业目标），禁止空洞套话
- 技能 8-12 个核心项，分级标注（精通/熟练/了解）
- 应届生：项目经历前置到实习经历之前

### 第二步：风格确认

让用户选择或描述风格。读取对应 CSS 和 HTML 参照文件：

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

合并 `css/common.md` 排版 + 对应风格 CSS/布局 + 用户信息，生成独立 HTML。

核心约束：
- A4 尺寸、页边距、字号、间距、行高等排版参数参见 `css/common.md`（唯一定义源）
- CSS 变量统管颜色，系统字体栈（PingFang SC, Microsoft YaHei）
- 技能标签用语义化 `<ul>/<li>` + CSS inline，`·` 分隔（ATS 友好）
- 内含「导出 PDF」按钮

### 第三步半：PDF 验证（强制执行，不可跳过）

1. 导出 PDF：`npx playwright pdf <html> <output.pdf>`
2. 检查页数：`python -c "import PyPDF2; r = PyPDF2.PdfReader('<pdf>'); print(len(r.pages))"`
3. 页数 > 1 → 按优先级修复：缩小页边距(≥8mm) → 压缩间距 → 缩行高(≥1.25) → 减字号(正文≥9.5px) → 精简文字 → 切换双栏

### 第四步：交付

告知文件位置、打印 PDF 方法、可用 jd-tailorer 针对 JD 定制。

## 参考文档索引

`references/` 目录下按需读取：
- `design-guidelines.md` — 设计美学、字体排版、单页参数细节
- `color-palettes.md` — 六大风格-配色索引
- `content-writing.md` — STAR 法则、量化对照表、ATS 兼容、自检清单
- `css/README.md` — CSS 使用方式与配色选择策略
- `css/common.md` — 通用紧凑排版 CSS（每次必用）
- `css/<style>.md` + `examples/<style>.html` — 每个风格一对参照文件
- `minimal-blue-business-reference.md` — 简约蓝色商务风格的设计原理、模块拆解与 Do's & Don'ts
