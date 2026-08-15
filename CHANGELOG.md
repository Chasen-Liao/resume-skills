# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.5.4] - 2026-08-06

### Fixed

- 修复回退模式（Firefox < 136 / Safari < 16.4）下粘贴净化把文本插入父页面而不是简历文档的问题（execCommand 现在作用于 iframe 文档）。
- 保存后不再触发一次无意义的 reload：编辑器自己的原子写入会被 watcher 回显，此前每次保存都会重置画布选中态；现在自保存的写回会被抑制，外部文件修改仍会热重载。
- 为回退分支增加真实浏览器回归测试（强制走 contenteditable="true"，验证中文输入、富文本粘贴仅插入纯文本、保存写回）；CI 集成任务现在会真正执行全部浏览器回归测试。
- 浏览器回归测试补上数据竞争防护（用条件等待替代固定延时）。

## [0.5.3] - 2026-08-06

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
