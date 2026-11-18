---
name: resume-canvas
description: 打开已有视觉 HTML 简历的本地 Canvas 编辑器，调整已有文字、字号、间距和页边距，或排查编辑字段协议。保存后核对修改并重新验证实际交付 PDF。
---

# Canvas 本地微调

用户明确要编辑或预览已有视觉 HTML 时进入。Canvas 编辑已有文本和排版，结构重排交给母版或定制技能。ATS-safe 模式不使用 Canvas。

## 打开指定文件

1. 视觉简历需符合[编辑字段协议](../resume-builder/references/delivery-gate.md#协议校验编辑字段契约)。内置模板包含 `data-resume-editor-template`、`data-resume-editor-version="1"` 和可独立编辑的叶子字段 `data-resume-editor-id`。禁止把字段 ID 放在容器上。对实际文件执行：

   ```bash
   npx -p @chasen-liao/resume-skills@latest resume-skills validate "<最终_visual.html路径>"
   ```

2. 校验通过后启动。已交付文件使用实际关联的 manifest，尤其是 PDF 与 HTML 使用不同文件名前缀时；没有交付记录的 HTML 草稿省略该参数。

   ```bash
   npx -p @chasen-liao/resume-skills@latest resume-skills editor "<最终_visual.html路径>" --manifest "<实际交付记录路径>"
   ```

   `--json` 输出 NDJSON 事件，`server_started` 提供实际地址。`--no-open` 仅启动服务；`--port` 指定端口时占用即报错。环境缺少 Node.js ≥20 或无法执行 CLI 时，明确报告未启动，并给出替换为本地绝对路径和实际 manifest 的命令。

## 编辑与保存

点击或双击已有字段即可编辑纯文本；也可用 Tab 进入画布，方向键选中字段，Enter 进入编辑，Ctrl/Cmd+Enter 完成，Esc 撤销本次文字修改。右侧调整字段样式和页边距。左侧显示排版状态。Live Preview 可响应源文件的外部修改。

点击“保存修改”会原子写回源 HTML，并使关联 manifest 失效（`status: invalid`，失效原因在 `invalidated` 中）。先将修改与私有事实库对照，新增或变更事实要由用户确认并同步相应记录；仅改样式时直接重验。随后按[Canvas 保存后重验闭环](../resume-builder/references/delivery-gate.md#canvas-保存后重验闭环)重新渲染并验证当前文件。使用原来的交付路径和导出方式；内置视觉导出使用 `render_resume.ps1`。检查实际 PDF 和新的整页预览后再更新该版本记录。

母版继续作为后续岗位版本的来源；岗位定制文件仅对应当前岗位。
