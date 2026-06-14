# 简历配色与风格参考手册

本文件从 ui-ux-pro-max 设计工程数据库中提取，为 resume-builder 提供具体的配色方案和风格参数。

---

## 六大简历风格 → 配色映射

每个风格的完整 CSS（3 套配色变量 + 推荐字体 + 风格 CSS 要点）已拆分到 `references/css/` 子文件夹中，生成时按需取用：

| 风格 | CSS 文件 | 配色数 |
|------|----------|--------|
| 现代简约 | [`css/modern-minimal.md`](css/modern-minimal.md) | 3 套 |
| 经典商务 | [`css/classic-business.md`](css/classic-business.md) | 3 套 |
| 创意个性 | [`css/creative-bold.md`](css/creative-bold.md) | 3 套 |
| 日式极简 | [`css/japanese-minimal.md`](css/japanese-minimal.md) | 3 套 |
| 科技感 | [`css/tech-dark.md`](css/tech-dark.md) | 3 套 |
| 简约蓝色商务 | [`css/minimal-blue-business.md`](css/minimal-blue-business.md) | 3 套 |

另见 [`css/README.md`](css/README.md) 了解使用方式和配色选择策略。

通用排版 CSS 在 [`css/common.md`](css/common.md)，每次生成都需引用。

### 1. 现代简约 (Modern Minimal)

对应 ui-ux-pro-max 风格：**Minimalism & Swiss Style** + **Minimal Swiss 字体**

| Token | 配色 A (黑白+蓝) | 配色 B (黑白+绿) | 配色 C (暖灰+蓝) |
|-------|------------------|------------------|------------------|
| Primary | `#18181B` | `#1C1917` | `#475569` |
| Accent | `#2563EB` | `#059669` | `#2563EB` |
| Background | `#FAFAFA` | `#FAFAF9` | `#F8FAFC` |
| Foreground | `#09090B` | `#0C0A09` | `#1E293B` |
| Card | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| Muted | `#E8ECF0` | `#E8ECF0` | `#EAEFF3` |
| Border | `#E4E4E7` | `#D6D3D1` | `#E2E8F0` |
| Font H | Inter/Outfit (sans) | DM Sans (sans) | Lexend (sans) |
| Font B | Inter/Work Sans (sans) | Source Sans 3 (sans) | Source Sans 3 (sans) |
| CSS 关键词 | `gap: 1.2rem`, `border-radius: 0-2px`, `box-shadow: none`, `max-width: 190mm` | 同左 | 同左 |
| 排版密度 | 紧凑优先: line-height 1.3-1.4, 板块间距 ≤10mm | 同左 | 同左 |

### 2. 经典商务 (Classic Business)

对应 ui-ux-pro-max 风格：**Corporate Trust** + **Classic Elegant 字体**

| Token | 配色 A (深蓝+金) | 配色 B (灰蓝+蓝) | 配色 C (深灰+蓝) |
|-------|------------------|------------------|------------------|
| Primary | `#0F172A` | `#1E3A8A` | `#1E293B` |
| Accent | `#A16207` (gold) | `#0369A1` | `#2563EB` |
| Background | `#F8FAFC` | `#F8FAFC` | `#F8FAFC` |
| Foreground | `#020617` | `#0F172A` | `#0F172A` |
| Card | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| Muted | `#E8ECF1` | `#E9EEF5` | `#E9EDF1` |
| Border | `#E2E8F0` | `#CBD5E1` | `#E2E8F0` |
| Font H | Playfair Display (serif) | EB Garamond (serif) | Cormorant (serif) |
| Font B | Inter/Lato (sans) | Lato (sans) | Montserrat (sans) |
| CSS 关键词 | `font-weight: 600-700` 标题, `letter-spacing: 0.5px` | 同左 | 同左 |
| 排版密度 | line-height 1.4-1.5, 适当留白但不浪费 | 同左 | 同左 |

### 3. 创意个性 (Creative / Bold)

对应 ui-ux-pro-max 风格：**Brutalism** + **Vibrant & Block-based** + **Bold Statement 字体**

| Token | 配色 A (黑白+粉) | 配色 B (黑白+紫) | 配色 C (深色+霓虹) |
|-------|------------------|------------------|-------------------|
| Primary | `#18181B` | `#18181B` | `#0F0F23` |
| Accent | `#EC4899` (pink) | `#7C3AED` (purple) | `#00FF41` (matrix green) |
| Background | `#FAFAFA` | `#FAFAFA` | `#000000` |
| Foreground | `#09090B` | `#09090B` | `#E0E0E0` |
| Card | `#FFFFFF` | `#FFFFFF` | `#0C0C0D` |
| Muted | `#E8ECF0` | `#E8ECF0` | `#181818` |
| Border | `#E4E4E7` | `#E4E4E7` | `#1F1F1F` |
| Font H | Bebas Neue / Syne (display) | Space Grotesk (sans) | JetBrains Mono (mono) |
| Font B | Source Sans 3 (sans) | DM Sans (sans) | IBM Plex Sans (sans) |
| CSS 关键词 | 不对称布局, `gap: 1.5rem`, 几何分隔线, 色块标注 | 同左 | `border-radius: 0`, `transition: 0s`, 粗边框 |
| 排版密度 | 可用色块分区节省空间, line-height 1.35 | 同左 | 紧凑: line-height 1.25-1.35 |

### 4. 日式极简 (Japanese Minimal / Wabi-sabi)

对应 ui-ux-pro-max 风格：**Minimalism + warm neutral tones** + **Chinese/Japanese 字体**

| Token | 配色 A (米白+深棕) | 配色 B (暖灰+绿) | 配色 C (白+靛蓝) |
|-------|--------------------|--------------------|--------------------|
| Primary | `#78716C` (warm stone) | `#1C1917` | `#4338CA` (indigo) |
| Accent | `#D97706` (amber) | `#15803D` (forest green) | `#7C3AED` (lavender) |
| Background | `#FFFBEB` (cream) | `#F5F5F0` (sage) | `#FAF5FF` |
| Foreground | `#0F172A` | `#0F172A` | `#1E1B4B` |
| Card | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| Muted | `#F6F6F6` | `#F6F6F7` | `#F7F3FD` |
| Border | `#EEEDED` | `#EDEEEF` | `#EFE7FC` |
| Font H | Noto Serif SC (serif) | Lora/Cormorant Garamond (serif) | Noto Serif SC (serif) |
| Font B | Noto Sans SC (sans) | Raleway (sans) | Noto Sans SC (sans) |
| CSS 关键词 | 大面积留白, `font-weight: 300-400`, `letter-spacing: 1px` | 同左 | 同左 |
| 排版密度 | ⚠️ 留白风格需注意: 用较小的字号(10px)和紧凑行高(1.3)来补偿留白 | 同左 | 同左 |

### 5. 科技感 (Tech / Dark Mode)

对应 ui-ux-pro-max 风格：**Dark Mode (OLED)** + **Tech Startup 字体**

| Token | 配色 A (深黑+蓝) | 配色 B (深蓝+绿) | 配色 C (深灰+紫) |
|-------|------------------|------------------|------------------|
| Primary | `#0F172A` | `#020617` | `#1E293B` |
| Accent | `#3B82F6` (blue) | `#22C55E` (green) | `#7C3AED` (purple) |
| Background | `#020617` | `#0F172A` | `#0F172A` |
| Foreground | `#F8FAFC` | `#F8FAFC` | `#F8FAFC` |
| Card | `#0E1223` | `#1B2336` | `#192134` |
| Muted | `#1A1E2F` | `#272F42` | `#1F1E27` |
| Border | `#334155` | `#475569` | `rgba(255,255,255,0.08)` |
| Font H | Space Grotesk (sans) | JetBrains Mono (mono) | Syne (sans) |
| Font B | DM Sans (sans) | IBM Plex Sans (sans) | Manrope (sans) |
| CSS 关键词 | `.dark` 主题, 高对比文字, 霓虹点缀色, `text-shadow: 0 0 10px` 克制使用 | 同左 | 同左 |
| 排版密度 | 深色背景可适当松一些(line-height 1.4), 但板块间距仍需 ≤10mm | 同左 | 同左 |

### 6. 简约蓝色商务 (Minimal Blue Business)

对应 ui-ux-pro-max 风格：**Corporate Trust** + **Minimal Business 字体**

| Token | 配色 A (深蓝+冰蓝) | 配色 B (钴蓝+浅灰蓝) | 配色 C (钢蓝+柔蓝) |
|-------|--------------------|--------------------|--------------------|
| Primary | `#0A2540` | `#1E3A8A` | `#2B4C7E` |
| Accent | `#0066CC` | `#0284C7` | `#4A90E2` |
| Background | `#FFFFFF` | `#F8FAFC` | `#FAFBFC` |
| Foreground | `#1D2A3A` | `#0F172A` | `#2C3E50` |
| Card | `#F4F8FC` | `#F0F6FC` | `#F2F6FA` |
| Muted | `#E6F0FA` | `#E2E8F0` | `#E5ECF4` |
| Border | `#D2E3F3` | `#CBD5E1` | `#CFD9E5` |
| Font H | Lexend (sans) | Outfit (sans) | Poppins (sans) |
| Font B | Source Sans 3 (sans) | Work Sans (sans) | Open Sans (sans) |
| CSS 关键词 | 左侧装饰竖条, 线性章节标题, 左边线卡片, 浅蓝 wash 总结区 | 同左 | 同左 |
| 排版密度 | 紧凑优先: line-height 1.35, 板块间距 ≤8mm | 同左 | 同左 |

---

## 字体速查表

生成简历 HTML 时，从以下组合中选择（中文优先 Noto Sans SC / PingFang SC）：

| # | 名称 | 标题字体 | 正文字体 | 风格 | 适用场景 |
|---|------|----------|----------|------|----------|
| 1 | Classic Elegant | Playfair Display | Inter | 优雅、奢华 | 经典商务、高端 |
| 2 | Modern Professional | Poppins | Open Sans | 现代、专业 | 现代简约、通用 |
| 3 | Tech Startup | Space Grotesk | DM Sans | 科技、创新 | 科技感 |
| 4 | Minimal Swiss | Inter | Inter | 极简、功能 | 现代简约 |
| 5 | Bold Statement | Bebas Neue | Source Sans 3 | 大胆、冲击 | 创意个性 |
| 6 | Corporate Trust | Lexend | Source Sans 3 | 可信、易读 | 经典商务 |
| 7 | Developer Mono | JetBrains Mono | IBM Plex Sans | 技术、精准 | 科技感 |
| 8 | Geometric Modern | Outfit | Work Sans | 几何、现代 | 现代简约 |
| 9 | Soft Rounded | Varela Round | Nunito Sans | 柔和、友好 | 创意个性 |
| 10 | Chinese Simplified | Noto Sans SC | Noto Sans SC | 简体中文 | 所有中文简历 |
| 11 | Chinese Traditional | Noto Serif TC | Noto Sans TC | 繁体中文 | 繁体中文简历 |
| 12 | Japanese Elegant | Noto Serif JP | Noto Sans JP | 日式 | 日式极简 |
| 13 | Editorial Classic | Cormorant Garamond | Libre Baskerville | 编辑、经典 | 经典商务 |

---

## 字体速查表

每个风格的推荐字体已移入 `css/` 子文件夹的对应文件。生成时从对应风格文件中取用。
