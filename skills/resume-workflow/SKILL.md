---
name: resume-workflow
description: 编排从导入已有简历或采访开始，到母版、JD 定制、ATS 审计和版本记录的完整简历流程。当用户想创建、更新、投递或持续维护简历，但不想自己选择多个简历 Skill 时使用。只基于用户确认的事实，不自动提交、推送或覆盖版本历史。
---

# 简历工作流

将 `resume-builder`、JD 分析、经历改写、定制、ATS 审计、Canvas 微调和版本管理串成一个完整流程；用户只需确认事实、改写和版本操作。

## 技能协作总览与路由

| 阶段 | 责任 Skill | 输入 | 输出 / 交付 | 协作流转与路由条件 |
|---|---|---|---|---|
| 0. 私有事实库 | `resume-workflow` | 用户已有简历或经历描述 | `resume-facts.yaml` | 初始化唯一事实源，全程不将未确认事实写回 |
| 1. 母版生成 | `resume-builder` | 事实库 / 用户采访 | 母版 HTML/PDF | 经历模糊或职责化时触发经历打磨；排版前选模板 |
| 1.5 经历打磨 | `resume-bullet-writer` | 弱经历 / 弱项目 bullet | 有证据支持的改写建议 | 条件触发：改写须用户确认后写回事实库或母版 |
| 2. JD 分析 | `job-description-analyzer` | 目标 JD + 事实库 | 要求地图、真实缺口 | 分析后将结构化结果交接给 `jd-tailorer` |
| 3. 岗位定制 | `jd-tailorer` | 母版 + JD 分析报告 | 定制版 HTML/PDF | 定制版保存于 `tailored/` 目录，不覆盖母版 |
| 4. 质量审计 | `resume-ats-optimizer` | HTML / PDF 交付物 | ATS 风险与关键词报告 | 质量门禁；修复呈现问题须用户确认 |
| 5. 可视化微调 | `resume-canvas` | 已验证的视觉 HTML | 微调后 HTML + 重验 PDF | 仅视觉模式：排版微调、文字修正与重验闭环 |
| 6. 版本追踪 | `resume-version-manager` | 当前交付物 + 事实库 | 版本目录与 Git 提交 | 记录版本变更、父版本及关联 manifest |

## 先读

读取 `../resume-builder/references/resume-contract.md`、`../resume-builder/references/content-writing.md` 和 `../resume-builder/references/resume-facts.example.yaml`。按当前阶段再读取对应 skill 的 `SKILL.md`，不要用本文件替代其事实、排版或验证约束。

## 0. 建立私有工作目录

- 将用户简历保存在项目目录外的本地私有目录，例如 `<个人私有目录>/resume/`；不要使用源码仓库中的示例或模板目录保存真实个人数据。
- 在用户确认导入/采访结果后，按 `resume-facts.example.yaml` 创建 `resume-facts.yaml`。它是母版和定制版的唯一事实源；未确认字段只能保留在该文件的待确认记录或分析报告中。
- 用户明确同意后，才在这个私有目录初始化、提交或推送 Git。默认仅建议本地 Git，不默认创建远程仓库。

## 1. 建立或更新母版

- 用户提供已有简历时，先调用 `resume-builder` 的导入路径：提取内容、展示解析结果，并对模糊、冲突、可能过期或缺少证据的字段增量追问。
- 用户没有简历时，调用 `resume-builder` 的采访路径。
- 只有用户确认的 claim 才写入 `resume-facts.yaml` 并生成母版。若某条经历职责化、贡献不清或证据不足，可条件触发 `resume-bullet-writer`；候选改写仍须用户确认。
- 事实确认后让用户选择视觉或 ATS-safe 输出模式；视觉模式再从六个模板中选择。

## 2. 针对 JD 定制

- 先调用 `job-description-analyzer`，将 JD 要求与 `resume-facts.yaml` 中的已确认 claim 对照，输出匹配点、真实缺口和定制优先级。
- 再调用 `jd-tailorer`，先展示变更预览；只有用户确认前置、改写和保留的缺口后，才生成 `tailored/<公司名>-<岗位>/` 中的定制版。

## 3. 审计与记录

- 调用 `resume-ats-optimizer` 作为生成后的质量关卡。报告可直接修复的呈现问题与不能伪造的事实缺口；修复前取得用户确认。
- 母版或 JD 定制流程生成视觉 HTML 后，必须先完成 **PDF 验证**：用 `resume-builder` 的渲染脚本完成溢出、PDF 单页/页面密度验证并生成 hash manifest。之后询问用户是否需要本地 Canvas 预览；Canvas 是可选微调步骤。Canvas 保存会让 manifest 失效，保存后必须重新渲染与验证：

  在 PDF 验证和 Canvas 启动前，先验收最终 HTML 的编辑字段协议：`data-resume-editor-template` 与 `data-resume-editor-version="1"` 必须位于 `<html>`；`data-resume-editor-id` 必须数量大于 0、唯一、语义化，并分别标在可独立编辑的文本元素上。禁止把编辑 ID 放在 `<html>`、`<body>`、`<main>`、`.page`、`.resume`、`header`、`footer`、`section`、`ul`、`ol`、`figure` 或包含多个板块/多个字段的容器上，也禁止用一个根容器 ID 代表整份简历。先运行可执行校验（失败即停止交付）：`npx -p @chasen-liao/resume-skills@latest resume-skills validate "<最终_visual.html路径>"`，重复直到输出“校验通过”。记录字段总数、重复 ID、容器误标 ID，以及个人信息 / 经历 bullet 字段检查结果；任何失败都必须停止交付并重新生成或拆分标记。

  ```bash
  powershell -NoProfile -ExecutionPolicy Bypass -File skills/resume-builder/scripts/render_resume.ps1 -HTML "<最终_visual.html路径>" -OutputPdf "<交付目录/自定义文件名.pdf>"
  python skills/resume-builder/scripts/validate_resume.py --html "<最终_visual.html路径>" --pdf "<交付目录/自定义文件名.pdf>" --mode visual --check-overflow --check-layout --min-fill-ratio 0.98 --preview "<交付目录/自定义文件名.preview.png>" --manifest "<交付目录/自定义文件名.resume-manifest.json>" --renderer "playwright@1.62.1" --json
  ```

  `render_resume.ps1` 会完成 full-page 自动布局、真实 PDF 渲染、低分辨率预览生成并自动执行同等交付验证；第二条命令明确展示并可重复执行完整验证契约。manifest 以其中规范化的 `html.path` 绑定源 HTML，并同时绑定 PDF 和 preview，不要求三者与 manifest 使用相同 stem。

  PDF 页数必须为 1，有效页面占用率至少 98%；页面偏空或上下留白不均应在不改变事实的前提下通过 full-page 垂直分布、密度和均匀间距处理，底部安全区失败必须修复。自动密度下限仍无法满足时要明确报告用户，不得静默交付大面积空白版本。

  若用户选择需要本地可视化微调，**路由至 `resume-canvas` 技能**执行协议检查、编辑器启动与保存重验闭环：

  ```bash
  npx -p @chasen-liao/resume-skills@latest resume-skills editor "<最终_visual.html路径>" --manifest "<交付目录/自定义文件名.resume-manifest.json>"
  ```

  若用户选择 Canvas 但当前环境无法执行 `npx`，明确报告未启动，并提供带实际 HTML 路径的完整命令；不得声称已打开 Web 预览。用户暂时不需要 Canvas 时直接交付已验证的视觉 HTML/PDF。ATS-safe 模式不启动 Canvas。详细的 Live Preview 热刷新、CLI 选项与编辑排障见 `resume-canvas`。
- 调用 `resume-version-manager` 记录母版或定制版的父版本、事实文件、JD 和变更摘要。若用户明确要求 Git 提交，再记录提交 ID。

## 不要做

- 不把 PDF/DOCX/HTML 的解析文字直接当成用户确认的事实；扫描件或 OCR 不可靠时说明限制并请求可复制文本或用户确认。
- 不让 JD、模板或 ATS 建议新增候选人的技能、指标、职责或成果。
- 不自动初始化 Git、提交、推送、回滚或覆盖用户的文件。
