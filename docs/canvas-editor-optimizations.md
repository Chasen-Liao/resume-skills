# Canvas 编辑器优化备忘（2026-08-19，搁置）

> 日期：2026-08-19
>
> 背景：审查 Canvas 架构（`public/app.js` / `public/editor.html` / `public/app.css` / `lib/editor-controls.mjs`）后整理的优化候选。经用户确认，本次暂不实施：其中两项（Ctrl+S、放弃修改）已实现并通过测试后整体回退，其余三项留待以后。
>
> 关联决策：改动保持轻量化、UX 优先；本备忘不扩展 Canvas 的网络暴露面或编辑能力边界。

## 候选清单

### 1. Ctrl/Cmd+S 全局保存（已实现 → 已回退）

**现状**：编辑器没有接管 Ctrl+S。编辑时按下会触发浏览器默认「保存网页」对话框，而非保存 HTML，与编辑器「保存到本地 HTML」的心智冲突。

**恢复改动**（`public/app.js`，`saveButton` click handler 之后）：

```js
// 焦点可能在沙箱 iframe 内（编辑字段），keydown 需在捕获阶段才能截获
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveButton.click();
  }
}, true);
```

**配套测试**：`tests/editor-browser.test.mjs` 新增「Ctrl+S saves the current canvas edits to the source file」，走 `openEditableCanvas` → 编辑字段 → `page.keyboard.press("Control+s")` → 断言磁盘写入与 status。

### 2. 放弃修改按钮（已实现 → 已回退）

**现状**：`beforeunload` 拦截 + `reloadDocument` 总是优先恢复 localStorage 草稿（`public/app.js:368`），用户一旦改动就没有 UI 途径丢弃草稿回到磁盘版本；刷新试图「重来」会被拦且草稿照旧恢复。

**恢复改动**：

- `public/editor.html` 左侧 guide，「打印为 PDF」下方加：

  ```html
  <button id="discard-drafts" class="secondary" type="button">放弃修改</button>
  ```

- `public/app.js`：

  ```js
  document.querySelector("#discard-drafts").addEventListener("click", () => {
    if (!window.confirm("放弃所有未保存的修改，回到磁盘上的简历版本？")) return;
    clearSelection();
    drafts.clear();
    reloadDocument();
  });
  ```

**配套测试**：`tests/editor-browser.test.mjs` 新增「discard drafts reverts the canvas to the on-disk version」——编辑产生草稿 → 确认草稿存在 → dialog accept 后点按钮 → 断言 iframe 回到磁盘原文、localStorage 草稿清空、`#selection-name` 复位、磁盘未被污染。

### 3. 溢出检测优化

**现状**：`updateOverflow`（`public/app.js:278`）只在 iframe `load`、文字/排版改动时调用。两个小问题：

- **误报风险**：`load` 时立即检测，若简历用外部字体（@font-face / Google Fonts）且晚于 `load` 完成，`.resume` 布局未定型，可能误报「超出一页 A4」。
- **reflow 频率**：每次按键 / 每次排版控件 input 都同步读 `scrollHeight` 强制 iframe 内 reflow。

**建议**：

- `load` 后再等 `frame.contentDocument.fonts.ready` 补检一次。
- 用 `requestAnimationFrame` 合并多次调用（`input` 高频场景）。

### 4. `framePaddingX = 72` 硬编码

**现状**：`public/app.js:61` 的 `framePaddingX = 72` 与 `public/app.css:58` `.canvas { padding: 36px }` 耦合，CSS 一改就错位。

**建议**：从 `.canvas` 的 computed style 读取 `paddingLeft + paddingRight`，或加注释双向对齐。

### 5. 缩放百分比浮标（可选）

**现状**：小屏下 A4 被 `transform: scale()` 缩小但无任何反馈，用户不知道当前是真实大小还是缩小预览。

**建议**：`fitFrame` 算出的 `scale` 显示为「×%」小浮标，轻量且信息密度低。

## 回退记录

- 本次实现的两项（1、2）均在回退前通过完整测试：`editor-browser.test.mjs` 18 项全绿，含新增 2 项；`npm run test:node` 154 pass / 0 fail。
- 回退范围：`public/app.js`、`public/editor.html`、`tests/editor-browser.test.mjs` 三个文件 `git checkout` 到上一个提交，工作区已干净。
- 后续若启用：按上面的「恢复改动」+「配套测试」操作即可，改动点互不重叠、风险低。

## 关联

- 完整审计与实施记录（历史）：`docs/optimization-audit.md`
- 编辑器使用指南：`docs/canvas-editor-guide.md`
