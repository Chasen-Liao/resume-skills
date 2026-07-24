# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.4.5] - 2026-07-24

### Fixed

- 修复 `resume-skills editor --json` 在输出启动信息后立即关闭服务的问题；JSON 地址现在可供 Agent 连接。
- 清理 Canvas 编辑选中态，避免其写入保存后的 HTML。

### Changed

- Canvas 的“保存修改”直接覆盖源 HTML，确保简历工作流只有一份最新文件。
- 同步 README、教程和相关技能文档中的保存与 `--json` 行为说明。
