# 科技感 — Tech / Dark Mode

对应 ui-ux-pro-max 风格：**Dark Mode (OLED)** + **Tech Startup / Developer Mono 字体**

**风格特质**: 深色背景、高对比文字、霓虹点缀色、科技感字体、终端/代码美学

---

## 配色 A: 深黑 + 蓝

```css
:root {
  --color-primary: #0F172A;
  --color-on-primary: #FFFFFF;
  --color-accent: #3B82F6;
  --color-on-accent: #FFFFFF;
  --color-bg: #020617;
  --color-fg: #F8FAFC;
  --color-card: #0E1223;
  --color-card-fg: #F8FAFC;
  --color-muted: #1A1E2F;
  --color-muted-fg: #94A3B8;
  --color-border: #334155;
  --color-destructive: #EF4444;
  --color-on-destructive: #FFFFFF;
  --color-ring: #3B82F6;
}
```

## 配色 B: 深蓝 + 绿

```css
:root {
  --color-primary: #020617;
  --color-on-primary: #FFFFFF;
  --color-accent: #22C55E;
  --color-on-accent: #0F172A;
  --color-bg: #0F172A;
  --color-fg: #F8FAFC;
  --color-card: #1B2336;
  --color-card-fg: #F8FAFC;
  --color-muted: #272F42;
  --color-muted-fg: #94A3B8;
  --color-border: #475569;
  --color-destructive: #EF4444;
  --color-on-destructive: #FFFFFF;
  --color-ring: #22C55E;
}
```

## 配色 C: 深灰 + 紫

```css
:root {
  --color-primary: #1E293B;
  --color-on-primary: #FFFFFF;
  --color-accent: #7C3AED;
  --color-on-accent: #FFFFFF;
  --color-bg: #0F172A;
  --color-fg: #F8FAFC;
  --color-card: #192134;
  --color-card-fg: #F8FAFC;
  --color-muted: #1F1E27;
  --color-muted-fg: #94A3B8;
  --color-border: rgba(255,255,255,0.08);
  --color-destructive: #EF4444;
  --color-on-destructive: #FFFFFF;
  --color-ring: #7C3AED;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Tech Startup | Space Grotesk (500-700) | DM Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');` |
| Developer Mono | JetBrains Mono (500-700) | IBM Plex Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');` |
| Fashion Forward | Syne (500-700) | Manrope (400) | `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700&display=swap');` |

中文: `PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif`

## 风格 CSS 要点

```css
.resume {
  color-scheme: dark;
}
/* OLED 优化: 深黑底色 */
body {
  background: var(--color-bg);
}
.section-title {
  color: var(--color-accent);   /* 霓虹色标题 */
  letter-spacing: 0.06em;
}
/* 微妙的发光点缀 (克制使用) */
.name {
  text-shadow: 0 0 1px rgba(255,255,255,0.3);
}
/* 深色背景下行高可适当松一些 */
p, li {
  line-height: 1.4;
}
```
