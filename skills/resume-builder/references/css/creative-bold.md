# 创意个性 — Creative / Bold

对应 ui-ux-pro-max 风格：**Brutalism** + **Vibrant & Block-based** + **Bold Statement 字体**

**风格特质**: 大胆配色、不对称布局、几何分隔、视觉冲击力强、有个性的字体选择

---

## 配色 A: 黑白 + 粉

```css
:root {
  --color-primary: #18181B;
  --color-on-primary: #FFFFFF;
  --color-accent: #EC4899;
  --color-on-accent: #FFFFFF;
  --color-bg: #FAFAFA;
  --color-fg: #09090B;
  --color-card: #FFFFFF;
  --color-card-fg: #09090B;
  --color-muted: #E8ECF0;
  --color-muted-fg: #64748B;
  --color-border: #E4E4E7;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #EC4899;
}
```

## 配色 B: 黑白 + 紫

```css
:root {
  --color-primary: #18181B;
  --color-on-primary: #FFFFFF;
  --color-accent: #7C3AED;
  --color-on-accent: #FFFFFF;
  --color-bg: #FAFAFA;
  --color-fg: #09090B;
  --color-card: #FFFFFF;
  --color-card-fg: #09090B;
  --color-muted: #E8ECF0;
  --color-muted-fg: #64748B;
  --color-border: #E4E4E7;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #7C3AED;
}
```

## 配色 C: 深色 + 霓虹绿

```css
:root {
  --color-primary: #0F0F23;
  --color-on-primary: #FFFFFF;
  --color-accent: #00FF41;
  --color-on-accent: #0F172A;
  --color-bg: #000000;
  --color-fg: #E0E0E0;
  --color-card: #0C0C0D;
  --color-card-fg: #E0E0E0;
  --color-muted: #181818;
  --color-muted-fg: #94A3B8;
  --color-border: #1F1F1F;
  --color-destructive: #EF4444;
  --color-on-destructive: #FFFFFF;
  --color-ring: #00FF41;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Bold Statement | Bebas Neue (display) | Source Sans 3 (400) | `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');` |
| Tech Startup | Space Grotesk (500-700) | DM Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');` |
| Developer Mono | JetBrains Mono (500-700) | IBM Plex Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');` |

中文: `PingFang SC, Microsoft YaHei, sans-serif`

## 风格 CSS 要点

```css
.resume {
  border-radius: 0;           /* Brutalism: 零圆角 */
}
.section-title {
  font-family: 'Bebas Neue', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.06em;
  position: relative;
}
/* 色块分区标注 */
.section-title::before {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  background: var(--color-accent);
  margin-right: 6px;
}
```
