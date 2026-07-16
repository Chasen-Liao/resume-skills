# Resume Skills — 跨智能体简历技能

一套基于 HTML 的简历生成与 JD 匹配工具集，兼容 Claude Code、Codex 以及其他 Agent Skills 规范的智能体。

当前版本：**v0.4.0** · 包含 6 个简历工作流技能与本地 Canvas 编辑器。

“这一套skills是我在制作简历中和投递简历中总结出来的，先用 resume-builder 生成一份通用的简历母版，之后只需要发送对应的 JD.md 给Agent，Agent就可以针对JD来生成对应的简历”

> 帮你优化简历和针对JD来制作对应岗位的简历！
> 祝愿你能通过本skills来找到更好的工作！

支持的智能体：Claude Code、Codex，以及兼容 Agent Skills 标准的其他工具。

## 技能概览

![builder](builder.png)

## 生成效果展示

6 种设计风格预览（点击可查看大图）：

<table>
<tr>
  <td align="center"><b>现代简约</b></td>
  <td align="center"><b>经典商务</b></td>
  <td align="center"><b>创意个性</b></td>
</tr>
<tr>
  <td><img src="assets/modern-minimal.png" width="280" alt="现代简约"></td>
  <td><img src="assets/classic-business.png" width="280" alt="经典商务"></td>
  <td><img src="assets/creative-bold.png" width="280" alt="创意个性"></td>
</tr>
<tr>
  <td>大量留白 · 高对比 · 几何线条<br>无阴影 · 字体优雅克制</td>
  <td>深蓝主调 · 稳重专业 · 传统排版<br>衬线标题 + 无衬线正文</td>
  <td>大胆配色 · 不对称布局 · 几何分隔<br>视觉冲击力强 · Brutalism 风格</td>
</tr>
<tr>
  <td align="center"><b>日式极简</b></td>
  <td align="center"><b>科技感</b></td>
  <td align="center"><b>简约蓝色商务</b></td>
</tr>
<tr>
  <td><img src="assets/japanese-minimal.png" width="280" alt="日式极简"></td>
  <td><img src="assets/tech-dark.png" width="280" alt="科技感"></td>
  <td><img src="assets/minimal-blue-business.png" width="280" alt="简约蓝色商务"></td>
</tr>
<tr>
  <td>极简克制 · 柔和暖色 · 大面积留白<br>轻质字体 · 呼吸感强</td>
  <td>深色背景 · 高对比文字 · 霓虹点缀<br>科技感字体 · 终端/代码美学</td>
  <td>深蓝主调 · 左侧装饰竖条 · 虚实线结合<br>稳重与极简的平衡</td>
</tr>
</table>

### 1. resume-builder — 简历构建器

通过对话式采访，帮用户构建精美的 A4 HTML 简历。核心理念：**美观 + 单页 + ATS 兼容**。

| 功能 | 说明 |
|------|------|
| 对话式收集 | 逐步引导填写：个人信息、教育背景、实习/工作、项目、技能、校园经历、自我评价 |
| 6 种设计风格 | 现代简约、经典商务、创意个性、日式极简、科技感、简约蓝色商务风，每种含完整 HTML 参照样板 |
| 18 套配色方案 | 每个风格 3 套完整色板（Primary/Accent/Background/Foreground/Card/Muted/Border） |
| 13 组字体搭配 | 标题/正文配对，支持中英文混排 |
| A4 单页强约束 | 紧凑排版参数 + 双栏布局 + PDF 导出验证 |
| ATS 兼容 | 标准章节标题、inline 技能标签、纯文本可读性 |
| STAR 写作法则 | 每条经历强制量化数据，三句话自我评价 |
| 输出格式 | 独立 HTML 文件（inline CSS/JS），浏览器直接打印 PDF |

### 2. jd-tailorer — JD 简历定制器

根据具体职位描述，对已有简历进行关键词匹配和内容定制。核心理念：**关键词对齐 + 不编造经历**。

| 功能 | 说明 |
|------|------|
| JD 解析 | 自动提取核心技术、加分项、软技能关键词、公司文化暗示 |
| 匹配分析 | 对比简历与 JD，识别匹配点/缺失点/弱化点 |
| 关键词优化 | 术语对齐 + 自然融入 JD 关键词（目标覆盖率 ≥ 70%） |
| 板块重排序 | 按 JD 关注度重新排列板块优先级 |
| 定制版 vs 通用版对比 | 清楚说明改了哪些关键词、重排了哪些板块 |
| 输出结构 | `tailored/<公司名>-<岗位>/resume-visual.html` 或 `resume-ats.html` + `matching-analysis.md` |

### 3–6. 辅助技能

| Skill | 何时使用 | 输出 |
|------|----------|------|
| `resume-bullet-writer` | 优化项目/实习描述、STAR 或 X-Y-Z 改写、补强量化表达 | 改写候选、依据与待确认问题 |
| `job-description-analyzer` | 分析 JD、判断匹配度、识别真实缺口 | 要求地图、解释性匹配度与定制优先级 |
| `resume-ats-optimizer` | 检查 ATS 可读性、关键词覆盖和章节结构 | 问题清单与不虚构的优化建议 |
| `resume-version-manager` | 管理通用版、岗位定制版与投递版本 | 版本策略、命名与维护建议 |

## 推荐工作流

```
resume-builder → 生成通用版简历 → jd-tailorer → 针对不同 JD 生成定制版本
```

先建立一份内容扎实、排版美观的通版简历，再针对每个目标岗位做 JD 定制，比海投同一份简历的通过率高数倍。

## 各 Skill 怎么用

安装后，在 Codex、Claude Code 或其他兼容 Agent Skills 的智能体中直接用自然语言触发即可；也可以在支持显式调用的客户端输入 `$技能名`。

| Skill | 直接这样说 | 你需要提供 | 会得到什么 |
|------|------------|------------|------------|
| `resume-builder` | “帮我做一份前端实习简历” | 按智能体的问题逐步提供个人信息、教育、经历与技能 | 完整采访后选择风格，生成 A4 HTML 简历并验证打印布局 |
| `resume-bullet-writer` | “优化这三条项目描述，不要编数据” | 原 bullet、真实职责/成果；可附目标岗位 | 有依据的改写候选、问题诊断和待确认问题 |
| `job-description-analyzer` | “分析这个 JD，我匹配吗？” | JD 文本/链接内容，以及已有简历或事实 | 要求地图、真实匹配证据、缺口和定制优先级 |
| `jd-tailorer` | “针对这个 JD 改我的简历” | 基础简历 + JD 文本 | 定制 HTML、匹配分析和基于真实事实的关键词/排序调整 |
| `resume-ats-optimizer` | “检查这份简历的 ATS 问题” | 简历 HTML、文本或粘贴内容；可附 JD | ATS 风险、关键词覆盖、结构与可读性建议 |
| `resume-version-manager` | “帮我规划产品经理和运营岗位的简历版本” | 现有简历版本、目标岗位与投递记录（如有） | 版本命名、复用关系、维护与投递策略 |

### 推荐的实际对话顺序

```text
1. “帮我做一份简历”                    → resume-builder
2. “优化我的项目经历 bullet”              → resume-bullet-writer（按需）
3. “分析这个 JD，我匹配吗？”              → job-description-analyzer
4. “针对这个 JD 改我的简历”               → jd-tailorer
5. “检查这份定制简历的 ATS 问题”          → resume-ats-optimizer（按需）
6. “帮我管理这些投递版本”                  → resume-version-manager（按需）
7. npx @chasen-liao/resume-skills editor ...   → 仅做最终文字/排版微调
```

重要边界：前 6 个 Skill 负责事实收集、内容优化和岗位匹配；Canvas 不承担这些工作，只编辑已生成简历的文字与版式。

## 安装与配置

### 一键安装 Claude Code + Codex（推荐）

本仓库已经按 Agent Skills 通用规范组织。确保已安装 Node.js，然后从 GitHub 安装全部 6 个 skills：

```bash
npx skills add Chasen-Liao/resume-skills --skill '*' --agent claude-code --agent codex --yes
```

默认安装到当前项目，适合随项目提交并与团队共享。若希望全局安装到所有项目，使用：

```bash
npx skills add Chasen-Liao/resume-skills --skill '*' --agent claude-code --agent codex --global --yes
```

只安装一个 skill：

```bash
npx skills add Chasen-Liao/resume-skills --skill resume-builder --agent codex --yes
npx skills add Chasen-Liao/resume-skills --skill jd-tailorer --agent claude-code --yes
```

安装后重新打开或新建智能体会话即可触发：

- **测试 `resume-builder`**：输入「帮我做一份简历」
- **测试 `jd-tailorer`**：输入「帮我针对这个 JD 改一下简历」

如果技能没有自动触发，可以在支持显式 skill 调用的客户端中输入 `$resume-builder`、`$jd-tailorer` 或对应的辅助 skill 名称。

### 本地 Canvas 排版编辑器

Canvas 只用于技能生成后的 HTML 简历微调：可改文字、字号、字重、颜色、对齐、行高、段后距、页边距和主题色；不改写内容、不做 JD 匹配，也不允许自由拖拽或结构重排。

在简历 HTML 所在目录运行：

```bash
npx @chasen-liao/resume-skills editor resume.html
```

编辑器会在本机启动并打开浏览器。草稿仅保存在当前浏览器；点击“导出 HTML”会写入与原文件同目录的 `resume-edited.html`，后续导出会覆盖该文件，原始 HTML 始终不被覆盖。点击“打印为 PDF”后，在浏览器打印面板另存为 PDF。

### Claude Code 插件安装

Claude Code 用户仍可通过 `/plugin` 添加本仓库地址：

```
https://github.com/Chasen-Liao/resume-skills
```

仓库中的 `.claude-plugin/` 和 `skills/` 会作为插件清单与技能目录使用。也可以先克隆仓库，再在 Claude Code 中选择从本地目录安装。

### 发布到 skills.sh / npx skills

`npx skills` 不需要单独上传 npm 包。它从 GitHub 仓库读取标准的 `SKILL.md`，因此发布流程是：

1. 将本仓库公开发布到 GitHub。
2. 确认每个 skill 都位于 `skills/<skill-name>/SKILL.md`。
3. 发布前在本地检查：

   ```bash
   npx skills add . --list
   ```

4. 发布后，用户即可执行上面的安装命令；`skills.sh` 会根据安装数据收录仓库。

也可以直接指定 GitHub 地址进行安装：

```bash
npx skills add https://github.com/Chasen-Liao/resume-skills --skill '*' --agent claude-code --agent codex --yes
```

### 安装组合与依赖

- `resume-builder` 可单独使用，从零创建通用 HTML 简历。
- 其余 5 个 Skill 共享 `resume-builder` 的事实契约、写作规范或模板参考；请使用 `--skill '*'` 一起安装，避免在单独安装时缺少依赖参考文件。
- `jd-tailorer` 还依赖基础简历和 JD；建议先完成 `resume-builder`，再开始岗位定制。

## 使用示例

### 构建全新简历

```
用户: 帮我做一份简历
Agent: 好的，让我帮你构建一份精美的简历。首先，能告诉我你的姓名和求职意向吗？
用户: 张小明，前端开发工程师，Base 杭州，浙大计算机 2026 届
Agent: 明白了。接下来能告诉我你的教育背景吗？学校、专业、学历、时间...
用户: [逐一回答]
Agent: [展示 6 种设计风格供选择]
用户: 现代简约
Agent: [生成 resume.html，导出 PDF，验证单页] ✅ 已生成你的简历，保存在 ./resume/resume.html
```

### 针对 JD 定制简历

```
用户: 帮我针对阿里的 JD 改一下简历
Agent: 好的，请把阿里的 JD 内容粘贴给我
用户: [粘贴 JD 文本]
Agent:
  分析完这个 JD，核心要求：
  - React / TypeScript 前端框架
  - 组件库 / 设计系统经验
  - 性能优化 & 工程化能力

  你的「组件库项目」与这个岗位高度相关，我会把它前置。
  另外 JD 提到「工程化」，你的项目中可以强调 CI/CD 部分。

  [生成定制版 → PDF 验证单页 → 输出匹配分析报告]
  定制要点：
  - 新增关键词: 设计系统、CI/CD、Monorepo（从项目中提取）
  - 板块重排: 组件库项目 → 排到第一条
  - 自我评价重写: 对齐到「前端工程化」方向
```

## 技能体系结构

### resume-builder 的参考文档

技能在执行时会按需读取这些文档，不需要你手动查阅：

```
skills/resume-builder/
├── SKILL.md                          # 技能主文件（精简工作流程、硬约束、参考文献索引）
├── agents/openai.yaml                # Codex 的显示名称与默认提示词
└── references/
    ├── design-guidelines.md          # 设计美学指南（字体/色彩/空间/动画原则）
    ├── color-palettes.md             # 六大风格-配色索引 + 字体速查
    ├── content-writing.md            # 内容写作规范（STAR 法则 / 量化 / ATS 兼容）
    ├── css/
    │   ├── README.md                 # CSS 子文件夹使用说明
    │   ├── common.md                 # 通用紧凑排版 CSS（每次生成必用）
    │   ├── modern-minimal.md         # 现代简约风格（3 套配色 + 字体 + 风格 CSS）
    │   ├── classic-business.md       # 经典商务风格（3 套配色 + 字体 + 风格 CSS）
    │   ├── creative-bold.md          # 创意个性风格（3 套配色 + 字体 + 风格 CSS）
    │   ├── japanese-minimal.md       # 日式极简风格（3 套配色 + 字体 + 风格 CSS）
    │   ├── tech-dark.md              # 科技感风格（3 套配色 + 字体 + 风格 CSS）
    │   └── minimal-blue-business.md  # 简约蓝色商务风格（3 套配色 + 字体 + 风格 CSS）
    └── examples/
        ├── modern-minimal.html       # 现代简约风格 HTML 完整参考样板
        ├── classic-business.html     # 经典商务风格 HTML 完整参考样板
        ├── creative-bold.html        # 创意个性风格 HTML 完整参考样板
        ├── japanese-minimal.html     # 日式极简风格 HTML 完整参考样板
        ├── tech-dark.html            # 科技感风格 HTML 完整参考样板
        └── minimal-blue-business.html # 简约蓝色商务风格 HTML 完整参考样板

skills/jd-tailorer/
├── SKILL.md                          # 技能主文件（工作流程、约束）
├── agents/openai.yaml                # Codex 的显示名称与默认提示词
└── references/
    └── matching-analysis.md          # 匹配分析报告模板
```

### 设计约束的执行链

```
用户选择风格
    ↓
读取 css/<style>.md  →  获取 3 套配色变量 + 推荐字体 + 风格 CSS 要点
    ↓
读取 css/common.md   →  获取通用排版（页面尺寸/技能标签/双栏布局/防断裂）
    ↓
合并写入 HTML <style>
    ↓
按 content-writing.md 规范填充内容（STAR + 量化 + ATS 兼容标题）
    ↓
导出 PDF → 检查页数 → 溢出则修复 → 循环
    ↓
交付
```

### jd-tailorer 的协作方式

jd-tailorer 依赖 resume-builder 的输出格式：

- **复用视觉样式**：从基础简历 HTML 中提取 CSS 变量和布局结构
- **遵循写作规范**：沿用 `content-writing.md` 的 STAR 法则和量化标准
- **独立输出**：生成到 `tailored/` 子文件夹，不覆盖原文件
- **PDF 验证**：与 resume-builder 相同的单页验证流程

## 生成文件示例

```
resume/
├── resume.html                       # 通用版简历
└── tailored/
    ├── alibaba-前端开发/
    │   ├── resume-visual.html        # 针对阿里的视觉定制版
    │   ├── resume-ats.html           # 针对阿里的 ATS-safe 定制版
    │   └── matching-analysis.md      # 匹配分析报告
    └── tencent-后端开发/
        ├── resume-visual.html
        └── matching-analysis.md
```

## 设计哲学：几个关键取舍

**美观 vs ATS 兼容**
HTML 简历的视觉效果与 ATS 的纯文本解析存在天然冲突（如双栏布局、色块标签）。
折中策略：HTML 提供美观的打印 PDF 版本，同时确保正文内容在语义上从上到下排列，
技能标签使用 badge 排列，章节标题用标准命名。投递传统 ATS 系统时建
议额外导出 .docx 版本。

**单页 vs 内容丰富**
应届生简历必须在 1 页内完成。宁可精简弱关联内容，也不要溢出到第 2 页。紧凑排版
参数（页边距 10mm、行高 1.35、正文字号 10.5px）是保证单页的基础。

**通用 vs 定制**
通用版简历用于海投和存档，定制版针对具体 JD 做关键词对齐和板块重排。同一份经历
在不同 JD 下用不同的措辞和排序是完全合理的——只要内容真实。

## 触发关键词

### resume-builder 触发词

「简历」「resume」「CV」「求职」「找工作」「面试」「制作简历」「生成简历」「构建简历」

### jd-tailorer 触发词

「JD」「职位描述」「岗位匹配」「针对...改简历」「投递」「求职」「招聘要求」「Job Description」「定制简历」

## License

MIT

## TODO-接下来的优化

- [ ] 继续优化各个风格的 HTML 骨架，确保每种风格都达到最佳视觉效果
