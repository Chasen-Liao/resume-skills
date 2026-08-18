---
title: "resume-skills 0.5：从事实确认到可验证交付的完整教程"
source: "https://x.com/chasen_liao/status/2077689805752942619"
author:
  - "[[@chasen_liao]]"
published: 2026-07-16
updated: 2026-08-01
description: "使用 7 个 resume-skills 建立事实库、生成视觉版与 ATS-safe 版、按 JD 定制，并用 manifest 验证最终 HTML/PDF。"
tags:
  - "resume"
  - "agent-skills"
---

![resume-skills 教程封面](https://pbs.twimg.com/media/HNVvvnea4AAGgOj?format=jpg&name=large)

# 安装 resume-skills

`resume-skills` 是一套以候选人已确认事实为边界的简历工作流。它不会把 JD、模板示例或 Agent 的推断当成你的经历，也不会承诺通过 ATS 或获得面试。

## 安装全部 7 个 Skill

在准备存放私有简历资料的工作区中运行：

```plaintext
npx skills add Chasen-Liao/resume-skills --skill '*' --agent codex --yes
```

如果使用其他 Agent，可去掉 `--agent codex --yes`，在交互界面选择目标 Agent 和安装范围。建议把包含个人信息的简历工作区放在本项目目录外，并使用本地私有 Git 历史；不要推送到公开仓库。

当前工作流包含 7 个 Skill：

1. `resume-workflow`：判断从零创建、导入旧简历还是针对 JD 定制，并编排后续步骤。
2. `resume-builder`：采访或解析已有简历，确认事实后生成母版。
3. `job-description-analyzer`：拆解 JD 的硬性要求、加分项和关键词来源。
4. `resume-bullet-writer`：在证据不足或表达职责化时，提出可确认的 bullet 改写。
5. `jd-tailorer`：只基于已确认事实重排和对齐 JD，不制造缺失经验。
6. `resume-ats-optimizer`：检查结构、文本提取和关键词呈现风险。
7. `resume-version-manager`：记录母版、定制版、验证结果与版本关系。

# 从事实开始，而不是从模板开始

## 1. 选择入口

- 空工作区：调用 `resume-workflow`，让 Agent 逐步采访。
- 已有 PDF/HTML 简历：交给 `resume-builder` 解析；解析结果先进入待确认清单，不能直接进入成稿。
- 已有母版和 `resume-facts.yaml`：提供 JD，进入 `job-description-analyzer` 与 `jd-tailorer`。

可直接这样提问：

```text
使用 resume-workflow 帮我建立一份实习简历。先解析我提供的旧简历，
把识别结果和不确定项列出来让我确认，不要补写数字、技能或成果。
```

## 2. 建立唯一事实源

用户逐条确认后，Agent 在私有工作区创建 `resume-facts.yaml`。只有 `claims` 中已确认、有来源和证据的内容可以进入最终简历；旧简历解析结果、改写建议和待核实指标留在 `pending_claims`。

JD 关键词只是岗位要求，不是候选人事实。若缺少某项要求，应在匹配报告中标为真实缺口。

## 3. 选择输出分支

视觉版与 ATS-safe 版共享同一份事实，但呈现方式不同：

- 视觉版：`<姓名>_<岗位>_visual.html` 与同名前缀 PDF，适合 A4 单页视觉交付。
- ATS-safe 版：`<姓名>_<岗位>_ats.html` 与同名前缀 PDF，使用单栏、标准标题和可复制文本。

也就是统一使用 `*_visual.html` / `*_visual.pdf` 和 `*_ats.html` / `*_ats.pdf` 命名，不再使用含糊的 `resume.html`。

# 渲染、验证与 Canvas

## 4. 渲染视觉 PDF

仓库开发环境安装依赖后，可使用渲染脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File skills/resume-builder/scripts/render_resume.ps1 -HTML "<生成的_visual.html路径>" -OutputPdf "<生成的_visual.pdf路径>"
```

脚本用固定的 Playwright 生成 A4 PDF，并运行 HTML 溢出、PDF 页数、可提取文本和版面检查。成功时会在旁边写出 `*.resume-manifest.json`，记录 HTML/PDF SHA-256、renderer 版本和验证结果。缺少 Playwright、Chromium 或 `pypdf` 时状态为不可交付，不能把人工目测当作自动验证通过。

## 5. 打开本地 Canvas

视觉版通过首轮渲染验证后，运行真实 CLI 命令：

```plaintext
npx @chasen-liao/resume-skills@latest editor "<生成的_visual.html路径>"
```

Canvas 支持编辑已有字段的纯文本和受限排版，不允许新增字段、插入 HTML、改 DOM 结构或做 JD 匹配。文字修改后仍需回到 Agent 工作流确认事实并重新验证 PDF。

Canvas 保存会覆盖当前 HTML，并让关联的 PDF manifest 立即失效；因此保存后必须重新运行渲染脚本，直到新 manifest 的 HTML hash、PDF hash 和验证结果全部有效，才能交付或记录版本。

ATS-safe 版不使用 Canvas，直接在生成后检查单栏阅读顺序、复制文本和 PDF 文本提取。

## 6. 处理溢出

视觉版检测到 A4 容器溢出会直接失败。按以下顺序修复并重新渲染：

1. 精简低相关、重复且已确认的内容；
2. 调整板块间距和条目间距；
3. 调整行高，但正文不要低于可读下限；
4. 最后才小幅调整字号或布局。

不要使用 `overflow: hidden` 裁掉内容，也不要为填满页面编造经历或指标。

# 针对 JD 生成定制版

先让 `job-description-analyzer` 输出要求地图，再由 `jd-tailorer` 展示变更预览：哪些已确认经历会前置、哪些措辞会对齐 JD、哪些要求仍是缺口。用户确认后再生成岗位目录中的视觉版和按需的 ATS-safe 版。

```text
使用 jd-tailorer 根据下面的 JD 定制我的简历。先展示变更预览和事实来源，
不要把 JD 关键词写成我的技能；确认后生成 *_visual.html 和 *_ats.html，
再调用 resume-ats-optimizer 做质量关卡。
```

最终由 `resume-version-manager` 记录母版来源、JD 来源、变更摘要、未匹配要求和当前有效 manifest。HTML/PDF 是事实库生成的交付物，不替代 `resume-facts.yaml`。

# 投递前检查清单

- 联系方式、时间、数字、链接均来自已确认事实；
- 视觉 PDF 恰好一页，HTML 无溢出，文字可复制；
- ATS-safe 版保持单栏、标准标题和稳定阅读顺序；
- 当前 `*.resume-manifest.json` 为 valid，且 hash 对应当前 HTML/PDF；
- Canvas 保存后已经重新渲染与验证；
- 私人简历仓库没有推送到公开远程。

更多边界、模板与 CLI 说明见 [项目 README](https://github.com/Chasen-Liao/resume-skills)。
