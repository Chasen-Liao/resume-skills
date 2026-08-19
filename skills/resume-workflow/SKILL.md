---
name: resume-workflow
description: 编排从导入已有简历或采访开始，到母版、JD 定制、ATS 审计和版本记录的完整简历流程。当用户想创建、更新、投递或持续维护简历，但不想自己选择多个简历 Skill 时使用。只基于用户确认的事实，不自动提交、推送或覆盖版本历史。
---

# 简历工作流

将 `resume-builder`、JD 分析、定制、ATS 审计和版本管理串成一个流程；用户只需确认事实、改写和版本操作。

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
- 母版或 JD 定制流程生成视觉 HTML 后，必须先完成 **PDF 验证**：用 `resume-builder` 的渲染脚本完成溢出、PDF 单页/页面密度验证并生成 hash manifest，再启动最终视觉文件的本地 Canvas 预览。Canvas 保存会让 manifest 失效，保存后必须重新渲染与验证：

  在 PDF 验证和 Canvas 启动前，先验收最终 HTML 的编辑字段协议：`data-resume-editor-template` 与 `data-resume-editor-version="1"` 必须位于 `<html>`；`data-resume-editor-id` 必须数量大于 0、唯一、语义化，并分别标在可独立编辑的文本元素上。禁止把编辑 ID 放在 `<html>`、`<body>`、`<main>`、`.page`、`.resume`、`header`、`footer`、`section`、`ul`、`ol`、`figure` 或包含多个板块/多个字段的容器上，也禁止用一个根容器 ID 代表整份简历。先运行可执行校验（失败即停止交付）：`npx -p @chasen-liao/resume-skills@latest resume-skills validate "<最终_visual.html路径>"`，重复直到输出“校验通过”。记录字段总数、重复 ID、容器误标 ID，以及个人信息 / 经历 bullet 字段检查结果；任何失败都必须停止交付并重新生成或拆分标记。

  ```bash
  powershell -NoProfile -ExecutionPolicy Bypass -File skills/resume-builder/scripts/render_resume.ps1 -HTML "<最终_visual.html路径>" -OutputPdf "<交付目录/自定义文件名.pdf>"
  python skills/resume-builder/scripts/validate_resume.py --html "<最终_visual.html路径>" --pdf "<交付目录/自定义文件名.pdf>" --mode visual --check-overflow --check-layout --min-fill-ratio 0.78 --manifest "<交付目录/自定义文件名.resume-manifest.json>" --renderer "playwright@1.62.1" --json
  ```

  `render_resume.ps1` 会完成真实 PDF 渲染并自动执行同等交付验证；第二条命令明确展示并可重复执行完整验证契约。manifest 以其中规范化的 `html.path` 绑定源 HTML，不要求 HTML、PDF 和 manifest 位于同一目录或使用相同 stem。

  PDF 页数必须为 1；页面偏空或上下留白不均的警告应在不改变事实的前提下通过均匀间距调整处理，底部安全区失败必须修复。

  ```bash
  npx -p @chasen-liao/resume-skills@latest resume-skills editor "<最终_visual.html路径>" --manifest "<交付目录/自定义文件名.resume-manifest.json>"
  ```

  Canvas 可保存已有编辑字段的纯文本和受限排版覆盖，并直接写回该 HTML；文字修改后必须回到 Agent 工作流重新确认事实并验证 PDF。高级选项：支持 `--json`（NDJSON 逐行输出 `server_started` / `error` / `update_available` / `validation_passed` 事件，脚本逐行 `JSON.parse`）、`--no-open`（无 GUI 环境）和 Live Preview 热刷新。命令应指向实际生成的母版或 `tailored/` 定制版。若当前环境无法执行 `npx`，明确报告未启动，并提供带实际 HTML 路径的完整命令；不得声称已打开 Web 预览。ATS-safe 模式不启动 Canvas。
- 调用 `resume-version-manager` 记录母版或定制版的父版本、事实文件、JD 和变更摘要。若用户明确要求 Git 提交，再记录提交 ID。

## 不要做

- 不把 PDF/DOCX/HTML 的解析文字直接当成用户确认的事实；扫描件或 OCR 不可靠时说明限制并请求可复制文本或用户确认。
- 不让 JD、模板或 ATS 建议新增候选人的技能、指标、职责或成果。
- 不自动初始化 Git、提交、推送、回滚或覆盖用户的文件。
