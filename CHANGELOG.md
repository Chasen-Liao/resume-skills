# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.5.0] - 2026-08-01

### Added

- 为视觉 HTML/PDF 交付物生成包含 SHA-256、Playwright renderer 版本和验证结果的 manifest；可校验 manifest 是否仍对应当前文件。
- 增加真实浏览器溢出检查、六模板集成渲染测试、Python 测试依赖清单和 GitHub Actions 测试工作流。

### Changed

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
