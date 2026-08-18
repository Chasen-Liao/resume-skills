# Issue #4 Scout Findings — Canvas 编辑协议（data-resume-editor-id）

侦察范围：bin/、lib/、public/、skills/resume-builder、skills/jd-tailorer、skills/resume-workflow、tests/、package.json、CHANGELOG.md。
工作树干净，HEAD = 84d1a90 "fix: enforce safe canvas field markers in resume skills"（仅 SKILL.md 文案 + catalog 断言，无代码实现）。

## 结论先行

1. **现状：没有任何代码注入 data-resume-editor-id，也没有任何程序化校验门禁。**
   6 个内置示例模板是手写带 ID 的（34–48 个/文件），LLM 生成流程只靠 SKILL.md 文字约束（jd-tailorer / resume-builder / resume-workflow 三段 SKILL.md + 一个 catalog 文本断言测试）。`prepareEditorDocument` 只校验 `<html>` 上的 template/version 两个属性，**明确接受 0 个 ID 的文档**，且有测试固定该行为（tests/editor-document.test.mjs:21）。
2. **Canvas 前端对"0 字段"和"容器级 ID"均静默**，与 issue 现象完全吻合：`bindCanvas` 对 `[data-resume-editor-id]` 空集无任何分支/提示；容器带 ID 时 `beginTextEdit` 把整个容器置 contenteditable、右侧 textarea 回写 `selected.textContent = value` 直接拍平子节点（grid/float 布局被毁）。
3. **保存侧校验也不拦截容器 ID**：`assertEditableDocument` 把 ID 容器整棵子树视为可编辑区，结构等值校验照常放行。
4. 生成后校验的现有候选锚点：`lib/editor-document.mjs` 的 `editorIds()`（已有唯一性检查，无数量/叶子性检查）+ Python `validate_resume.py`（纯 PDF/manifest 校验，0 处编辑协议检查）。CLI 目前只有 `editor` 子命令，无 `validate` 子命令。

## 关键事实（文件:行号）

### CLI（bin/resume-skills.mjs）
1. bin/resume-skills.mjs:34 — help 写明 `--port` 缺省 `0`（随机端口）；issue(e) 的"默认端口随机"源于此。
2. bin/resume-skills.mjs:298 — `portNumber = values.port ? parseInt(...) : 0`，无端口冲突回退、无端口区间校验。
3. bin/resume-skills.mjs:216-217 — GET 静态资源：先 `decodeURIComponent(pathname)` 再 `resolveSourceAsset`（解码、目录边界检查都在此），越界抛错。
4. bin/resume-skills.mjs:222-229 — 资源越界/失败统一 403 文案 "Asset is outside the resume directory"，浏览器里就是裂图、无前端提示（issue(d) 根）。
5. bin/resume-skills.mjs:232-253 — `server.listen` 回调内一次性输出 `server_started` JSON（`logFn`，非 JSON 模式失败路径走 stderr 纯文本 `Error: ...`）；后台 `npx ... &`/`spawn` 下 stdout 易丢且无重发/落盘（issue(e)）。
6. bin/resume-skills.mjs:47-62 — `atomicSave`：写临时文件→fsync→`.bak` 备份→rename 原子写回（AGENTS 约定已落地）。
7. bin/resume-skills.mjs:167-205 — `/api/save`：先比对 documentId（409 过期冲突）→ `validateEditorSave`（400 拒绝）→ `invalidateManifest` → 原子写回；失败 500 且不动原文件。
8. bin/resume-skills.mjs:21-45 / 316 — 唯一子命令 `editor`；全文件无 `validate`/`check`/`fix` 子命令（issue(b) 需要一个全新入口或挂到 editor 启动前）。
9. bin/resume-skills.mjs:312-316 — 顶层 catch 输出 `Error: <msg>` 到 stderr 并 `process.exitCode=1`；`--json` 模式下启动失败同样是纯文本，不是 JSON（issue(e)）。

### lib/ 协议与映射
10. lib/editor-document.mjs:6 — `supportedTemplatesList` 六模板硬编码（modern-minimal/classic-business/creative-bold/japanese-minimal/minimal-blue-business/tech-dark）。
11. lib/editor-document.mjs:30-52 — `prepareEditorDocument`：必须带 `data-resume-editor-template`（41-43）+ 版本 `1`（48-50），**不要求任何 data-resume-editor-id**，返回 stripLegacyToolbar 后文本。
12. lib/editor-document.mjs:55-70 — `validateEditorSave`：仅校验 ID **集合等值/重复**（`editorIds()` 50-70 行调用 + `:144-154` 去重抛 "重复 data-resume-editor-id"），无数量>0、无叶子性、无容器黑名单。
13. lib/editor-document.mjs:72-96 — `assertEditableDocument`：`editableText = id 属性存在` 后整棵子树可改；**容器级 ID 会在保存侧被当成合法编辑区放行**（"拍平"内容可保存）。
14. lib/source-asset.mjs:1-23 — `resolveSourceAsset`：相对简历目录解析 + realpath 双边界检查；`../../../证件照/…` 走不到简历目录 → 403。
15. lib/artifact-manifest.mjs:9-36 — `invalidateArtifactManifest`：缺失/未关联 manifest 抛错阻止保存；保存后 status→invalid + 追加 "manifest freshness" 失败检查。

### Canvas 前端（public/）
16. public/app.js:133-136 — `bindCanvas`：`querySelectorAll("[data-resume-editor-id]")` 空集时静默（无提示、无禁用态），所有编辑绑定只在节点上；issue(c) "点击无反应"即此。
17. public/app.js:117-125 — `beginTextEdit`：对带 ID 的**任意**元素设 `contenteditable`；容器 ID 会把整份简历变成单个可编辑字段。
18. public/app.js:74-93 — 选中后 textarea 回写 `selected.textContent = selectedText.value`：容器级 ID 下直接拍平全部子节点（grid/float 结构被毁，CSS 布局无法恢复）。
19. public/app.js:263 — `frame load → bindCanvas(); status="已加载"`：没有任何"字段数=0"或"发现容器级 ID"的报错路径。
20. public/app.js:192-202 — `cleanForExport` 只清理 selected/contenteditable 等临时属性，不校验叶子性。
21. public/editor.html:37 — `iframe sandbox="allow-same-origin"`（无 allow-scripts/无资源穿透）；跨目录照片失败时仅显示裂图。
22. public/editor.html:23 — 引导文案只说"单击/双击直改纯文本"，无 0 字段或协议错误说明。

### 生成侧（skills/）
23. skills/resume-builder/SKILL.md:64-77 — 生成规则（散文）：必须带 template/version 属性；每个可编辑文本字段带稳定唯一 ID；黑名单明确排除 `<html>/<body>/<main>/.page/.resume/header/footer/section/ul/ol/figure` 及多字段容器。
24. skills/jd-tailorer/SKILL.md:63-72 — 定制流程同样要求保留/生成 ID + 禁止容器 ID；"Canvas 字段验收（字段总数/唯一/容器误标）"是 **SKILL.md 文字门禁**，无代码执行。
25. skills/resume-workflow/SKILL.md:35-44 — 工作流同样只有文字验收门禁（"记录字段总数…任何失败停止交付"），依赖 Agent 自觉执行。
26. skills/resume-builder/references/examples/*.html:2 — 6 个模板 `<html>` 均手写 `data-resume-editor-template/version` + `data-resume-demo="true"`；正文手写 ID 密度 34–48 个（classic-business 48 最多）。
27. skills/resume-builder/scripts/render_resume.ps1:1-62 + validate_resume.py:556 行 — 只做 PDF/溢出/layout/manifest 校验，**0 处 data-resume-editor-id 检查**（生成门禁可挂这里）。
28. skills/resume-builder/references/examples/*.html:306-358 — 头像用同目录 `avatar.png`（resolveSourceAsset 可正常服务）；跨目录 `../../../证件照/` 无任何生成侧复制/内嵌逻辑。

### 测试与约定
29. tests/editor-document.test.mjs:21-27 — 现有测试名即"accepts a supported template before the canvas assigns editable text ids"：**明确断言无 ID 文档可通过 prepareEditorDocument**；加 (b)(c) 门禁必须同步改此测试。
30. tests/editor-cli.test.mjs:139 — `withEditorFixture` 用 0 个 ID 的最小 HTML 作为 CLI 全部测试夹具；严查 ID 后大量 CLI 测试需换夹具。
31. tests/editor-boundaries.test.mjs:31-55 — 已覆盖"六模板 ID>0 + 唯一 + profile-*/bullet-* 存在"（生成侧目标测试最接近需求）。
32. tests/editor-browser.test.mjs:315 — 复合字段夹具：联系方式行含 `<a>` 且整体一个 ID 被当作**单个可编辑单位**（Esc 撤销时保留链接）；"叶子元素"判定需兼容此类"文本+链接"节点。
33. tests/editor-reliability.test.mjs:109-190 — 保存→manifest 失效/原子写回/冲突保护已有完整回归。
34. tests/test_adapted_skill_catalog.py:39-50 — 已断言 SKILL.md 含 "可独立编辑/禁止把/ID 放在/容器/字段总数/唯一"（文本层契约已固化）。
35. package.json:3,8-16 — `bin.resume-skills = bin/resume-skills.mjs`，version 0.5.5，type=module，单依赖 parse5；测试框架 `node:test` + `node:assert/strict`（node --test tests/*.test.mjs）。
36. AGENTS.md:16-21（项目）— 开发约定：模板必须带三件套属性且"不再依赖运行时 fallback ID"；保存需原子写回 + manifest 失效；不改用正则解析 HTML（lib 已用 parse5）；资源 URL→文件路径先 decode 再目录边界检查。
37. CHANGELOG.md:7-24 — 0.5.5（2026-08-16）：修复选中编辑/复合字段 Esc 撤销拍平/回退模式 Enter 破坏结构/自保存 reload 抑制/版本检查 SSE 落地；git HEAD 84d1a90 才把"安全字段标记"写进 SKILL.md——**Issue #4 是同一主题的代码化缺口**。

## 最可能的集成点

1. **`lib/editor-document.mjs`**（core）：
   - 在 `prepareEditorDocument` 后新增独立 `validateEditorFields(html)`（或扩展 `editorIds`）：数量>0、唯一、叶子文本元素白名单 + 容器黑名单（main/.page/.resume/section/header/footer/ul/ol/figure/多文本子节点启发式）。
   - `assertEditableDocument` 增加"ID 只在叶子元素"约束；`cleanForExport` 同理。
2. **`bin/resume-skills.mjs`**：
   - `editor` 启动前/`startEditor` 入口调用字段校验，失败则非零退出 + 打印 grep 定位指引（如 `rg -n "data-resume-editor-id" <file>` 与缺失字段上下文）；或新增 `resume-skills validate <html>` 子命令。
   - `--port` 缺省改固定端口 + 冲突自动回退；启动失败时 `--json` 也输出 JSON 错误事件；`server_started` 支持重发/落盘。
3. **`public/app.js`**：`bindCanvas` 加 0 字段/容器 ID 检测分支 → `#save-status` 明确报错并禁用编辑；iframe 内监听 `img` error 事件给出证件照提示。
4. **生成侧门禁**：
   - `skills/resume-builder/scripts/validate_resume.py` 增加 `--check-editor-fields`（HTMLParser 成本低）或在 `render_resume.ps1` 校验链前插入；
   - 新增注入脚本（Node/Python）按语义生成 `{section}-{n}-{slot}` 类 ID（供 (a) 的自动注入或手工修复）。
   - `skills/resume-builder/tests/test_validate_resume.py` / `tests/test_adapted_skill_catalog.py` 增加对应断言。
5. **测试改动面**：tests/editor-document.test.mjs:21-27、tests/editor-cli.test.mjs:139 夹具必须随门禁同步更新；新增"0 字段拒绝""容器 ID 拒绝""grep 指引输出"三组回归。

## 对实现信心重要、需问用户的澄清问题

1. (b) 校验门禁放哪几层：新增 CLI `validate` 子命令 / `editor` 启动前强制检查 / Python `validate_resume.py` 纳入渲染管线——是三层都做还是先做一层？
2. (a) 注入方式：要新增自动注入脚本（把无 ID 的生成 HTML 按结构补 `{section}-{n}` ID），还是只要求 LLM 按 SKILL.md 规则生产 + 校验兜底报错？"叶子文本元素"的判定规则（仅 1 个文本子节点 / 允许含 `<a>` 的复合字段，见 editor-browser.test.mjs:315）请给出取舍。
3. (c) 0 字段/容器 ID 时 Canvas 行为：服务端启动即拒绝（非零退出 + stderr 指引）还是允许打开但页面内 `#save-status` 报错并禁用保存/编辑按钮？两者影响 editor-cli 夹具与 editor-browser 测试策略。
4. git HEAD 84d1a90 已把容器黑名单写死在 SKILL.md（`main/.page/.resume/section/header/footer/ul/ol/figure`…）：代码层黑名单直接对齐该清单即可，还是需要独立启发式（如 元素含块级子元素/多个直接文本子节点即拒绝）？
5. (d) 证件照裂图：期望方案是 ①生成侧自动把外部图片复制到 resume 目录/转 data URL（SKILL.md 已有 data URL 偏好），还是 ②Canvas 检测 iframe 内 img 加载失败后明确提示？是否允许把 `../../../证件照/` 这类**外部目录**加入白名单（与现有 403 安全边界冲突，需确认放宽）？
6. (e) `--port`：固定默认端口候选值（如 3123）？端口被占时自动回退随机但必须在 JSON/文本里明确标注回退；`--json` 后台启动丢失是否接受"写日志文件"或"额外 `--wait-ready` 语义"作为解？
7. 校验失败时的 grep 指引输出格式：希望含缺失/容器的节点上下文（tag + class + 前 40 字符文本）还是只给 `rg -n` 命令与错误行号？