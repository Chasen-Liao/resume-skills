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

## 入口与协作

这是创建和更新母版的主入口。若用户提供**已有简历**，先提取为待确认 claim，展示已识别内容、模糊项和疑似过期项；用户确认后只做**增量追问**，优先询问最近变化、缺失证据和低置信度字段。不要将解析文本直接当作最终事实，也不要重新进行完整采访。

若用户没有已有简历，按下面的信息收集流程采访。将用户确认的 claim 保存到项目目录外的私有 `resume-facts.yaml`，其结构使用 `references/resume-facts.example.yaml`；它是后续母版和 JD 定制的事实源。事实确认完成后，才选择输出模式与六个视觉模板。发现某条经历职责化、缺少具体贡献或证据不足时，可建议用户调用 `resume-bullet-writer`；它不是生成母版的必经步骤。

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
- A4 尺寸、页边距、字号、间距、行高等排版参数参见 `css/common.md`（唯一定义源）
- CSS 变量统管颜色，系统字体栈（PingFang SC, Microsoft YaHei）
- 交付为单文件时，头像等本地图片使用 `data URL` 内嵌；若保留外部网页字体，必须同时提供系统字体回退，并在验证中说明离线渲染可能不同。
- 技能标签用 `<span class="skill-badge">` 排列，badge 样式由风格 CSS 定义（ATS 友好）
- 不在简历模板中嵌入导出按钮；PDF 由浏览器打印或本地 Canvas 的“打印为 PDF”操作导出，避免遮挡简历内容
- 使用任一内置风格时，生成的 `<html>` 必须包含对应的 `data-resume-editor-template`（`modern-minimal`、`classic-business`、`creative-bold`、`japanese-minimal`、`minimal-blue-business` 或 `tech-dark`）和 `data-resume-editor-version="1"`。可为真实文本提供稳定的 `data-resume-editor-id`；未标记的内置模板文字由本地 Canvas 在打开时补齐可编辑标记。
- 上述标记供 `npx @chasen-liao/resume-skills editor <resume.html>` 的本地 Canvas 微调器识别；它只允许用户修改已有文字和受限排版，不能替代事实契约或 JD 定制流程。不要将标记用于头像、布局容器、任意 HTML 或未经确认的字段。

ATS-safe 模式：
- 使用单栏、标准板块标题、普通可复制文本和稳定的正文阅读顺序；重要信息不依赖图片、文本框、复杂嵌套表格、页眉页脚或装饰字体。
- 技能以可复制文本列表表达；不因 ATS-safe 模式改变 claim 内容、证据状态或删除待确认标记之外的事实。
- 同样只生成 HTML 与浏览器打印 PDF；仓库当前没有 DOCX 生成能力，不承诺 DOCX 产物。

### 第四步：按模式验证（强制执行，不可跳过）

视觉 HTML/PDF：导出 PDF 后同时检查结构、PDF 页数和可提取文本、页面密度和可打印安全区：

```bash
python skills/resume-builder/scripts/validate_resume.py --html <resume-visual.html> --pdf <resume-visual.pdf> --mode visual --check-layout --min-fill-ratio 0.78 --json
```

`--check-layout` 的验收规则：

- `PDF page count` 必须是 `1 page`；超过 1 页直接失败，不能用裁切或隐藏溢出伪装成单页。
- `page fill` 以 PDF 可提取文本的纵向范围估算页面占用率，目标至少 `78%`；低于目标是警告，必须继续调整到接近一页，但不能为填白编造事实。
- `vertical balance` 检查可打印区域上下留白差；出现警告时优先均匀调整板块间距、条目间距和容器内边距，避免内容挤在顶部或底部。
- `bottom safety` 不得失败；内容越过可打印底部安全区时，必须回退间距或字号调整。

版面调整顺序：先使用已有且已确认的板块和内容；页面偏空时均匀增加板块/条目间距、行高或容器内边距，页面溢出时反向压缩；仍溢出再按“页边距不小于 8mm → 间距 → 行高不低于 1.25 → 正文不小于 9.5px → 精简低相关内容 → 在适合时切换双栏”的顺序处理。上下间距尽量相近，任何一次调整后都重新导出 PDF 并运行同一命令。不得新增未确认经历、指标、技能或占位文本，也不以难以阅读的小字号硬塞一页。

完成自动检查后，再人工检查截图中的可见裁切、字体回退、链接和打印背景；自动检查不能保证这些视觉细节。视觉模式以 A4 单页为目标，所有警告都要记录处理结果。

ATS-safe HTML/PDF：检查 DOM 是否单栏、标题和时间/组织/职位关系是否清晰、正文复制后顺序是否正确，以及 PDF 文本是否可提取；再检查无图片文字、复杂嵌套表格、关键页眉页脚信息和不可复制装饰字体。按目标平台要求检查 HTML/PDF 格式，不宣称 ATS 必然通过。

### 第五步：交付

视觉模式完成 A4/PDF 验证后，必须启动本地 Canvas 预览，让用户先看到成品，再按需做受限的文字和排版微调：

```bash
npx @chasen-liao/resume-skills editor "<生成的_visual.html路径>"
```

命令会在本机启动服务并打开浏览器。告知用户原始 HTML、PDF 和 Canvas 导出的固定覆盖文件 `<原文件名>-edited.html` 的位置；Canvas 只允许修改已有文字和受限排版，不能改写内容、做 JD 匹配或调整结构。如当前环境无法执行 `npx`，明确报告未启动，并提供带实际 HTML 路径的完整命令，不得声称已启动。

ATS-safe 模式不使用 Canvas（其单栏 HTML 不属于 Canvas 支持的视觉模板）；告知文件位置与浏览器打印 PDF 方法。两种模式都可在后续使用 `jd-tailorer` 针对 JD 定制。

## 参考文档索引

`references/` 目录下按需读取：
- `design-guidelines.md` — 设计美学、字体排版、单页参数细节
- `resume-contract.md` — 事实来源、证据、置信度、指标状态和输出门槛
- `resume-facts.example.yaml` — 私有 `resume-facts.yaml` 的最小结构
- `color-palettes.md` — 六大风格-配色索引
- `content-writing.md` — 证据优先写作、ATS 两种输出模式、自检清单
- `css/README.md` — CSS 使用方式与配色选择策略
- `css/common.md` — 通用紧凑排版 CSS（每次必用）
- `css/<style>.md` + `examples/<style>.html` — 每个风格一对参照文件
