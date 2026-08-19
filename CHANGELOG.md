# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.6.0] - 2026-08-19

### Added

- 编辑器画布新增 A4 自适应缩放：任意窗口宽度下整页简历完整可见，不再需要横向滚动；左右侧栏压缩（280/300 → 240/264）为画布让出空间。
- 编辑器交互反馈：保存按钮显示“保存中… / 已保存 / 保存失败”状态，顶部状态栏新增未保存修改（dirty）提示，成功/未保存/失败用红绿橙区分。
- 状态栏与次要文本颜色提升至 WCAG AA 对比度（保存成功 #047857、未保存 #b45309、失败 #b91c1c、次要文本 #4b5563）；inspector 标题旁装饰性 SVG 加 `aria-hidden`。
- 新增 `docs/canvas-editor-guide.md`：AI 生成 HTML 后，在本地 Web 预览端做小修小补（改文字/调排版）、保存到本地再导出 PDF 的分步操作指南；README 补充“AI 生成 → 预览端微调 → 保存到本地 → 导出 PDF”闭环说明并链接该指南（指南文档已加入 npm 发布白名单）。

### Changed

- `resume-ats-optimizer` 脚本说明补充：`validate_resume.py` 随 npm 包发布、在包目录需加 `node_modules/@chasen-liao/resume-skills/` 前缀；`npx skills add` 仅装 SKILL.md 的环境无这些脚本。
- `resume-workflow` 的编辑字段容器黑名单补 `<html>` / `<body>` / `<figure>`，与编辑器实际校验逻辑对齐。

## [0.5.6] - 2026-08-18

### Added

- 新增 `resume-skills validate <resume.html>` 子命令：不启动服务，直接校验编辑协议（模板/版本属性、至少 1 个 `data-resume-editor-id`、ID 唯一、仅叶子文本字段），退出码 0=通过 / 1=失败，失败时在 stderr 给出 `rg -n` 定位指引。
- `editor` 子命令启动前强制执行同一字段校验：0 字段或容器级/非叶子 ID 时直接报错退出、不启动服务，`--json` 模式下输出 `event: "error"` JSON 事件。
- CLI 默认端口改为固定 **8848**；被占用时自动顺延至 8853，仍不可用则回退随机端口。显式 `--port` 为严格模式（占用即报错）。
- 新增 `--write-port-file <path>`：服务启动后写入 `{url, port, pid, sourcePath}` 端口文件；协议/参数/端口监听失败时 `--json` 均输出 `event: "error"`。
- 新增 `lib/editor-rules.mjs` 作为叶子字段规则的单一事实源（Node 与 Canvas 共用），并加漂移回归测试。
- Canvas 前端对“0 字段/容器级 ID”明确报错并禁用保存/打印；`img` 加载失败时给出明确提示；热重载从坏文件恢复为好文件时自动解除禁用态。
- 生成侧门禁：`resume-builder` / `jd-tailorer` / `resume-workflow` 的 Canvas 字段验收改为先运行 `resume-skills validate`。
- README/`--help` 推荐显式 npx 调用形式 `npx -p @chasen-liao/resume-skills resume-skills ...`。
- 归档 Issue #4 侦察底稿到 `docs/issue-4-scout.md` 与 `docs/issue-4-research.md`（编辑协议设计决策与外部事实支撑）。

### Fixed

- 前端嵌套判定与 lib 校验器对齐：联系方式行内带 ID 的 `<a>` 可正常编辑（此前 4/6 内置模板会被整页禁用）。
- 修复 `bindCanvas` 缺少 `return true` 导致成功加载时状态永远停在“正在加载…”。
- 修复端口回退后 `server_started` 重复输出（listen 回调在重试时被调用两次）；改为挂 `listening` 事件。
- 端口占用等启动失败不再以退出码 0 挂起；关闭 watcher 并置 `process.exitCode = 1`。
- 热重载对 0 字段/容器级 ID 文件拒收并提示；保存时剥离 canvas 临时 `data-resume-editor-img-hint` 属性。
- 修复保存校验把浏览器运行时注入的属性误判为「修改 HTML 属性」：`cleanForExport` 剥离 Chromium 注入的 `spellcheck`；服务端属性比对改为差异化判定（`spellcheck` / `data-resume-editor-img-hint` 完全忽略、`style` 去空白按值比较且容忍单侧出现），属性真实不一致时报错指出具体元素与差异属性（增/删/改 + 两侧取值）。

## [0.5.5] - 2026-08-16

### Fixed

- 选中文字后，右侧排版面板现在会显示可编辑的“文字内容”区域，修改会同步到画布并可保存回 HTML。
- 修复复合字段（如联系方式行内含 `<a>` 链接）按 Escape 撤销时被拍平成纯文本、销毁链接结构的问题：撤销快照改为结构感知的 innerHTML，撤销后链接完整恢复且保存校验通过（真实浏览器回归测试覆盖）。
- 修复回退模式（Firefox < 136 / Safari < 16.4）下按 Enter 插入 `<br>` 导致保存被结构校验拒绝的问题：回退模式拦截 Enter；拖放富文本同样只落纯文本。
- 修复粘贴净化把文本插入父页面文档而非简历文档的问题（execCommand 作用于 iframe 文档）。
- 自保存的 reload 抑制从 500ms 时间窗改为内容比对：编辑器自己写出的内容不再触发 reload，外部文件修改（即使紧跟在保存之后）仍会热重载。
- 未输入任何内容的单击选中不再写入草稿；版本检查结果通过 SSE 在连接时立即下发、结算后再广播，浏览器端提示不再丢失；registry 检查增加 race 兜底，任何网络实现下都会按时结算。
- 版本号无法读取（如裁剪副本缺 package.json）时跳过更新检查并显示 unknown，不再误报"有新版本"。
- 浏览器回归测试的跳过逻辑改为按浏览器二进制是否存在判断（CI base job 安全跳过），回退分支在 Firefox 与 Chromium 双端验证。

## [0.5.4] - 2026-08-16

### Fixed

- 修复回退模式（Firefox < 136 / Safari < 16.4）下粘贴净化把文本插入父页面而不是简历文档的问题（execCommand 现在作用于 iframe 文档）。
- 保存后不再触发一次无意义的 reload：编辑器自己的原子写入会被 watcher 回显，此前每次保存都会重置画布选中态；现在自保存的写回会被抑制，外部文件修改仍会热重载。
- 为回退分支增加真实浏览器回归测试（强制走 contenteditable="true"，验证中文输入、富文本粘贴仅插入纯文本、保存写回）；CI 集成任务现在会真正执行全部浏览器回归测试。
- 浏览器回归测试补上数据竞争防护（用条件等待替代固定延时）。

## [0.5.3] - 2026-08-16

### Added

- CLI 启动后异步对比 npm registry 的 `@latest`：落后时终端提示更新命令；`--json` 模式输出 `update_available` 事件；`RESUME_SKILLS_NO_UPDATE_CHECK=1` 可关闭。
- 编辑器左下角显示版本号，有新版本时给出更新提示（`GET /api/version` + SSE 广播）。

### Fixed

- 修复"选中文字后无法编辑"：单击选中字段即进入编辑态（原生 contenteditable，对中文输入法/粘贴同样生效），键盘 Enter/Space 或双击同样进入编辑；输入后 Ctrl/Cmd+Enter 或点击别处完成，Esc 撤销。
- 修复双击编辑在 Firefox < 136（以及 Safari < 16.4）下完全失效的问题：contenteditable="plaintext-only" 在这些浏览器中不被支持，字段无法进入编辑态。现在编辑前会检测浏览器支持情况，不支持时回退为 contenteditable="true"，并拦截粘贴保证仍是纯文本。
- 保存导出前清理残留的 data-resume-editor-original-text 属性，避免触发保存校验拒绝。
- 新增真实浏览器回归测试（tests/editor-browser.test.mjs，Chromium + Firefox）：单击/双击进入编辑、键入中文、Ctrl+Enter 提交、保存写回源 HTML 全链路验证；缺少浏览器二进制时自动跳过。

## [0.5.2] - 2026-08-05

### Changed

- Skill 工作流中的 `resume-skills` CLI 调用统一使用 `@latest`，确保启动本地 Canvas 时获取最新 CLI 版本。

## [0.5.1] - 2026-08-01

### Fixed

- 恢复 Canvas 对已有字段的纯文本编辑：双击即可编辑，保存后直接写回本地 HTML。
- 保留结构白名单与安全 HTML 校验，富文本/新增字段/HTML 结构变更仍会被拒绝；保存后关联 PDF manifest 失效并需重新验证。

## [0.5.0] - 2026-08-01

### Added

- 为视觉 HTML/PDF 交付物生成包含 SHA-256、Playwright renderer 版本和验证结果的 manifest；可校验 manifest 是否仍对应当前文件。
- 增加真实浏览器溢出检查、六模板集成渲染测试、Python 测试依赖清单和 GitHub Actions 测试工作流。

### Changed

- Canvas 现在只保存受限排版覆盖；正文事实、结构和重复编辑 ID 会被拒绝，必须回到事实工作流修改。
- 编辑器默认仅监听 loopback，拒绝危险 HTML、超大/分块超限保存和目录外资源；保存采用版本校验、原子替换、备份和冲突保护。
- 请求浏览器/PDF 布局检查但缺少 Playwright、Chromium 或 `pypdf` 时，明确返回不可交付的 `degraded` 状态。
- Canvas 保存会使同名前缀 PDF manifest 失效，要求重新渲染与验证。
- 教程同步为当前 7-skill 流程、`*_visual.html` / `*_ats.html` 命名和真实 CLI 命令；内置模板明确标记为虚构 demo。
- 基础测试与集成渲染分离为 `test:node`、`test:python` 和 `test:integration`。

## [0.4.5] - 2026-07-24

### Fixed

- 修复 `resume-skills editor --json` 在输出启动信息后立即关闭服务的问题；JSON 地址现在可供 Agent 连接。
- 清理 Canvas 编辑选中态，避免其写入保存后的 HTML。

### Changed

- Canvas 的“保存修改”直接覆盖源 HTML，确保简历工作流只有一份最新文件。
- 同步 README、教程和相关技能文档中的保存与 `--json` 行为说明。
