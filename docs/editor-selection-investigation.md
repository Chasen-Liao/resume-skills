# 调查记录：CLI 打开的 Canvas 编辑器“不能编辑选中的文字”

> 调查日期：2026-08-06 · 涉及版本：@chasen-liao/resume-skills 0.5.1 / 0.5.2（当前 main）
> 触发方式：`resume-skills editor <resume.html>`（本地 CLI，loopback HTTP 服务 + iframe srcdoc 注入简历）

## 结论（TL;DR）

**根因（两条）**：0.5.1 的“恢复文字编辑”修复（commit `1bd411d`）把进入编辑态的方式从 `contenteditable="true"` 改成了 `contenteditable="plaintext-only"`，以强制纯文本。但 **Firefox 不支持 `plaintext-only`**（Safari 16.4 之前也不支持），属性按规范被当作非法值处理，元素 `isContentEditable` 恒为 `false`——双击后字段**根本没有进入可编辑状态**，输入文字没有任何效果。服务端与保存校验链路均无问题。

**修复（两条）**：
1. 交互缺陷：单击选中即进入编辑态（`contenteditable` 原生编辑路径，对所有输入法/粘贴生效），键盘 Enter/Space 同样进入编辑；双击仍可编辑。
2. 兼容缺陷：进入编辑态前用探测元素做特性检测，支持 `plaintext-only` 时继续使用，不支持（Firefox < 136 / Safari < 16.4）时回退 `contenteditable="true"` 并在粘贴事件中拦截、只插入纯文本。
新增真实浏览器回归测试（`tests/editor-browser.test.mjs`，Chromium + Firefox，缺浏览器时跳过）。

## 复现记录（真实浏览器）

用 Playwright 1.62.1 对修复前代码逐一验证（Chromium 139 / Firefox 153 / WebKit 2311 已装）。

| 步骤 | Chromium（修复前） | Firefox（修复前） |
| --- | --- | --- |
| 双击带 `data-resume-editor-id` 字段 | `contenteditable="plaintext-only"`，`isContentEditable=true`，元素获得焦点 | `contenteditable="plaintext-only"`，**`isContentEditable=false`**，无法获得可编辑焦点 |
| 键入文字 | 文字替换选中内容，`textContent` 变化 | **`textContent` 不变（输入无效）** |
| Ctrl+Enter / Esc / blur 提交路径 | 正常退出编辑态并保存草稿 | 因 `isContentEditable=false`，编辑态分支（Escape/快捷键）全部不生效 |
| 页面 JS 报错 | 无 | 无（静默失败，最难排查） |

修复后同一测试：Chromium、Firefox 全部通过（双击 → 键入“李四” → Ctrl+Enter 提交 → `contenteditable` 移除、文字保留）。

## 代码定位

- `public/app.js` `beginTextEdit()`（0.5.2）：`node.setAttribute("contenteditable", "plaintext-only")` + `node.focus()`——本调查修复点。
- `public/app.js` `bindCanvas()`：`keydown` 处理器的编辑态分支用 `node.isContentEditable` 判断——在 Firefox 下为 `false`，还会落入“Enter/Space 被 preventDefault 并触发 select”的分支，进一步掩盖问题。
- 历史：`a8c76fc`（首个版本）用 `contenteditable="true"`，`b6fb6e2` / `95d4654`（0.5.0）改为“只保存排版覆盖”（整树 serialize 比对，文本修改被拒），`1bd411d`（0.5.1）恢复文本编辑但引入 `plaintext-only`。

## 排除项（已核查，非根因）

- **CLI 服务端**（`bin/resume-skills.mjs`）：`/api/document` 原样返回模板 HTML（保留 `data-resume-editor-id`）；保存校验（`lib/editor-document.mjs` `assertEditableDocument`）允许已有字段纯文本修改、拒绝结构/富文本/新增字段；版本 409 冲突、原子保存、manifest 失效逻辑正常。
- **已发布包**：npm `@latest` = 0.5.2，tarball 中 `public/app.js` 与仓库一致（含 `plaintext-only`，无回退）——用户拿到的是同样的坏实现。
- **iframe sandbox**：`sandbox="allow-same-origin"` 不影响 contenteditable；srcdoc 注入无干扰；`selectFromPointer` 的 click preventDefault 不阻断 dblclick。
- **CSS**：无 `user-select`/pointer-events 干扰；选中态 outline 不阻挡双击。

## 测试覆盖变化

- 新增 `tests/editor-browser.test.mjs`：真实浏览器双击编辑往返（Chromium + Firefox），浏览器二进制缺失时跳过（CI base job 不装浏览器，保持可运行）。
- 既有 `tests/editor-ui.test.mjs`、`tests/editor-boundaries.test.mjs` 的字符串断言仍通过。

## 遗留（与本次无关，未改动）

- `tests/tutorial-page.test.mjs` 在本机（Windows `core.autocrlf`）失败：`docs/tutorial.md` 以 LF 入库、检出为 CRLF，测试期望 `/^---\n/`。CI（Ubuntu）无此问题；属于独立的环境/测试健壮性问题。
- 编辑态下对含链接的混合内容字段（如 `profile-contact-primary` 含 `<a>`）做“全选替换”可能删除链接导致保存 400——属既有边界，未在本次范围内。