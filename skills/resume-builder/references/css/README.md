# CSS 配色子文件夹使用说明

`references/css/` 文件索引：

| 文件 | 用途 | 何时 |
|------|------|------|
| `common.md` | 通用排版 CSS（页面尺寸/打印/技能标签/双栏/防断裂） | 每次必用 |
| `modern-minimal.md` | 3 套配色 + 字体 + 风格 CSS | 现代简约 |
| `classic-business.md` | 3 套配色 + 字体 + 风格 CSS | 经典商务 |
| `creative-bold.md` | 3 套配色 + 字体 + 风格 CSS | 创意个性 |
| `japanese-minimal.md` | 3 套配色 + 字体 + 风格 CSS | 日式极简 |
| `tech-dark.md` | 3 套配色 + 字体 + 风格 CSS | 科技感 |
| `minimal-blue-business.md` | 3 套配色 + 字体 + 风格 CSS | 简约蓝色商务 |

> 简约蓝色商务风格的设计原理、模块拆解与 Do's & Don'ts 参见 `../minimal-blue-business-reference.md`。

## 生成流程

1. 读 `common.md` — 通用排版 CSS 写入 `<style>`
2. 读对应风格文件 — CSS 变量块插入 `:root`，字体 import + 风格 CSS 写入
3. 配色未指定时默认选 A

## 字体

- 优先系统字体栈：`PingFang SC, Microsoft YaHei, sans-serif`
- 追求设计感时用风格文件中的 Google Fonts Import
- 中文简历始终包含中文回退字体
