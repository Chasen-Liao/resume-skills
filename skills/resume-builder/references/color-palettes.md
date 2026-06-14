# 简历配色与风格参考手册

本文件提供风格-配色索引和字体速查。完整 CSS 变量、布局细节在 `references/css/` 中。

---

## 六大风格索引

| 风格 | CSS | HTML 示例 | 配色数 |
|------|-----|-----------|--------|
| 现代简约 | `css/modern-minimal.md` | `examples/modern-minimal.html` | 3 套 |
| 经典商务 | `css/classic-business.md` | `examples/classic-business.html` | 3 套 |
| 创意个性 | `css/creative-bold.md` | `examples/creative-bold.html` | 3 套 |
| 日式极简 | `css/japanese-minimal.md` | `examples/japanese-minimal.html` | 3 套 |
| 科技感 | `css/tech-dark.md` | `examples/tech-dark.html` | 3 套 |
| 简约蓝色商务 | `css/minimal-blue-business.md` | `examples/minimal-blue-business.html` | 3 套 |

使用方式：读 `css/README.md` → 读 `css/<style>.md` 取完整 CSS → 读 `css/common.md` 合并。

---

## 配色选择策略

每个风格含 A/B/C 三套配色，默认选 A。

| 配色 | 适用场景 |
|------|----------|
| A | 默认首选，最经典/通用 |
| B | 偏暖/偏绿/偏灰，适合不同行业 |
| C | 更柔和或更大胆，根据用户偏好 |

---

## 字体速查表

| # | 名称 | 标题字体 | 正文字体 | 适用场景 |
|---|------|----------|----------|----------|
| 1 | Classic Elegant | Playfair Display | Inter | 经典商务、高端 |
| 2 | Modern Professional | Poppins | Open Sans | 现代简约、通用 |
| 3 | Tech Startup | Space Grotesk | DM Sans | 科技感 |
| 4 | Minimal Swiss | Plus Jakarta Sans | Plus Jakarta Sans | 现代简约 |
| 5 | Bold Statement | Bebas Neue | Source Sans 3 | 创意个性 |
| 6 | Corporate Trust | Lexend | Source Sans 3 | 经典商务、蓝色商务 |
| 7 | Developer Mono | JetBrains Mono | IBM Plex Sans | 科技感 |
| 8 | Geometric Modern | Outfit | Work Sans | 现代简约、蓝色商务 |
| 9 | Soft Rounded | Varela Round | Nunito Sans | 创意个性 |
| 10 | Japanese Elegant | Noto Serif SC | Noto Sans SC | 日式极简 |
| 11 | Wellness Calm | Lora | Raleway | 日式极简 |
| 12 | Editorial Classic | Cormorant Garamond | Libre Baskerville | 经典商务 |

中文始终包含回退字体：`PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif`

> **注**：以各风格 `css/<style>.md` 中的推荐字体为准，本表仅供扩展选择参考。
