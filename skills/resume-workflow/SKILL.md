---
name: resume-workflow
description: 编排从导入已有简历或采访开始，到母版制作、针对 JD 定制、质量审计与本地排版微调的完整简历流程。当用户想创建、更新、投递或持续维护简历，但不想自己选择多个简历 Skill 时使用。只基于用户确认的事实，不自动提交、推送或覆盖版本历史。
---

# 简历工作流 (Resume Workflow)

将 `resume-builder`（母版构建与事实确权）、`jd-tailorer`（JD分析与定向定制）、`resume-canvas`（本地可视化微调）串成一条连贯、无缝的主干工作流。

## 技能协作总览（双主阶段）

| 阶段 | 责任 Skill | 输入 | 输出 / 交付 | 协作流转与路由条件 |
|---|---|---|---|---|
| **0. 私有事实库** | `resume-workflow` | 用户已有简历或经历描述 | `resume-facts.yaml` | 初始化唯一事实源，全程不将未确认事实写回 |
| **阶段一：母版生命周期** | `resume-builder` | 事实库 / 真实经历采访 | 母版 HTML/PDF、有效 Manifest | 对话采访，就地打磨经历，选模板并完成 A4 单页验证；建议本地 Git 提交 |
| **阶段二：岗位定制生命周期** | `jd-tailorer` | 母版 + 目标 JD | 定制版 HTML/PDF、匹配报告与版本记录 | 一站式解构 JD、输出变更预览、双模生成、ATS 门禁与目录隔离；建议本地 Git 提交 |
| **可选：本地微调守卫** | `resume-canvas` | 已验证的视觉 HTML | 微调后 HTML + 重验 PDF | 仅视觉模式：母版或定制版定稿后的本地所见即所得排版微调与 Manifest 重验闭环 |

## 先读

读取 `../resume-builder/references/resume-contract.md`、`../resume-builder/references/content-writing.md` 和 `../resume-builder/references/resume-facts.example.yaml`。按当前阶段再读取对应 skill 的 `SKILL.md`，不要用本文件替代其事实、排版或验证约束。

## 0. 建立私有工作目录

- 将用户简历保存在项目目录外的本地私有目录，例如 `<个人私有目录>/resume/`；不要使用源码仓库中的示例或模板目录保存真实个人数据。
- 在用户确认导入/采访结果后，按 `resume-facts.example.yaml` 创建 `resume-facts.yaml`。它是母版和定制版的唯一事实源；未确认字段只能保留在该文件的待确认记录或分析报告中。
- 建议将私有目录纳入**本地私有 Git 仓库**进行版本管理；不默认推送到远程公开仓库。用户明确同意后才执行提交建议，不自动执行 Git 初始化、提交、推送或覆盖。

## 阶段一：建立或维护简历母版 (`resume-builder`)

1. **导入或采访**：
   - 用户提供已有简历时，走导入路径：提取内容、展示已识别内容，并对模糊、冲突或缺少证据的字段**增量追问**；
   - 用户没有简历时，走结构化采访路径；
   - 经历描述若职责化或缺少具体贡献，依据 `content-writing.md` **原地就地打磨**，使用强动词结构，不打断主流程。
2. **事实确权**：
   - 只有用户明确确认的 claim 才写入 `resume-facts.yaml`。
3. **风格选择与生成**：
   - 确认事实后选择视觉模式（6 套模板）或 ATS-safe 单栏模式，生成母版 `resume.html`（或对应命名）。
4. **PDF 验证与可选 Canvas 微调**：
   - 视觉版必须先完成 Canvas 字段验收与 Playwright 单页/密度验证（见下方验证契约）；
   - 验证通过后询问是否需要本地 Canvas 预览微调；若需要，**路由至 `resume-canvas`**；
   - 微调保存后必须在 Agent 工作流中核验事实并重新跑渲染脚本，闭环验证。
5. **母版版本固化**：
   - 建议在本地 Git 提交：`git commit -m "创建母版简历"`。

## 阶段二：针对岗位进行定向定制 (`jd-tailorer`)

已有母版和 `resume-facts.yaml` 后，用户输入具体公司和岗位的 JD：
1. **一站式 JD 分析与变更预览**：
   - `jd-tailorer` 解构 JD 硬性条件、加分项与技术栈，对照事实库标定匹配点与真实缺口；
   - 向用户展示**变更预览**（前置哪些项目、对齐哪些措辞、保留哪些客观缺口）；
   - 用户仅需投递诊断时交付分析报告；用户确认定制时进入生成。
2. **双模式输出与目录隔离**：
   - 统一输出到专用的 `tailored/<公司名>-<岗位>/` 目录，**绝对不覆盖母版**；
   - 输出定制版 `resume_visual.html / .pdf`（或 ATS 版）、`matching-analysis.md` 和 `version-notes.md`。
3. **ATS 质量门禁与 PDF 验证**：
   - 运行 ATS 可解析性检查（无图片承载文字、无隐藏文字）及 `validate_resume.py` 验证；
   - 视觉版运行 `render_resume.ps1` 完成单页与 $\ge 98\%$ 利用率验证；
   - 验证通过后按需提供 Canvas 预览；微调保存后重新验证。
4. **版本归档与 Git 提交建议**：
   - 建议本地提交：`git commit -m "定制：<公司名> - <岗位>"`。

## 交付验证与 Canvas 契约（强制执行）

母版或 JD 定制流程生成视觉 HTML 后，必须先完成可执行校验与 **PDF 验证**：

1. **验收编辑字段协议**：
   `data-resume-editor-template` 与 `data-resume-editor-version="1"` 必须位于 `<html>`；`data-resume-editor-id` 必须大于 0、唯一、语义化，并分别标在可独立编辑的文本元素上。禁止把编辑 ID 放在 `<html>`、`<body>`、`<main>`、`.page`、`.resume`、`header`、`footer`、`section`、`ul`、`ol`、`figure` 或包含多个板块/多个字段的容器上。先检查字段总数与唯一性。
   ```bash
   npx -p @chasen-liao/resume-skills@latest resume-skills validate "<最终_visual.html路径>"
   ```
2. **渲染与布局验收**：
   ```bash
   powershell -NoProfile -ExecutionPolicy Bypass -File skills/resume-builder/scripts/render_resume.ps1 -HTML "<最终_visual.html路径>" -OutputPdf "<交付目录/自定义文件名.pdf>"
   python skills/resume-builder/scripts/validate_resume.py --html "<最终_visual.html路径>" --pdf "<交付目录/自定义文件名.pdf>" --mode visual --check-overflow --check-layout --min-fill-ratio 0.98 --preview "<交付目录/自定义文件名.preview.png>" --manifest "<交付目录/自定义文件名.resume-manifest.json>" --renderer "playwright@1.62.1" --json
   ```
   PDF 页数必须为 1，有效页面占用率至少 98%，底部安全区合规。

3. **按需启动 Canvas**：
   用户确认需要本地微调时，**路由至 `resume-canvas`**：
   ```bash
   npx -p @chasen-liao/resume-skills@latest resume-skills editor "<最终_visual.html路径>" --manifest "<交付目录/自定义文件名.resume-manifest.json>"
   ```
   若环境无法执行 `npx`，明确报告未启动并提供带实际路径的完整命令。ATS-safe 模式不启动 Canvas。用户不需要微调时直接交付产物。

## 不要做

- 不把解析文本直接当成用户确认的事实；未经确认不进入最终成稿。
- 不让 JD 要求或建议新增候选人未具备的技能、指标或经历；不伪造经历。
- 不自动执行 Git 初始化、提交、推送、回滚或静默覆盖用户文件。
