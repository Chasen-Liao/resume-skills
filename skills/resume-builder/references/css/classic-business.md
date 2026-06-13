# 经典商务 — Classic Business

对应 ui-ux-pro-max 风格：**Corporate Trust** + **Classic Elegant 字体**

**风格特质**: 深蓝/深灰主调、稳重专业、传统排版、衬线标题+无衬线正文

---

## 配色 A: 深蓝 + 金

```css
:root {
  --color-primary: #0F172A;
  --color-on-primary: #FFFFFF;
  --color-accent: #A16207;
  --color-on-accent: #FFFFFF;
  --color-bg: #F8FAFC;
  --color-fg: #020617;
  --color-card: #FFFFFF;
  --color-card-fg: #020617;
  --color-muted: #E8ECF1;
  --color-muted-fg: #64748B;
  --color-border: #E2E8F0;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #0F172A;
}
```

## 配色 B: 灰蓝 + 蓝

```css
:root {
  --color-primary: #1E3A8A;
  --color-on-primary: #FFFFFF;
  --color-accent: #0369A1;
  --color-on-accent: #FFFFFF;
  --color-bg: #F8FAFC;
  --color-fg: #0F172A;
  --color-card: #FFFFFF;
  --color-card-fg: #0F172A;
  --color-muted: #E9EEF5;
  --color-muted-fg: #64748B;
  --color-border: #CBD5E1;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #1E3A8A;
}
```

## 配色 C: 深灰 + 蓝

```css
:root {
  --color-primary: #1E293B;
  --color-on-primary: #FFFFFF;
  --color-accent: #2563EB;
  --color-on-accent: #FFFFFF;
  --color-bg: #F8FAFC;
  --color-fg: #0F172A;
  --color-card: #FFFFFF;
  --color-card-fg: #0F172A;
  --color-muted: #E9EDF1;
  --color-muted-fg: #64748B;
  --color-border: #E2E8F0;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #2563EB;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Classic Elegant | Playfair Display (600-700) | Inter / Lato (400) | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');` |
| Corporate Trust | Lexend (500-700) | Source Sans 3 (400) | `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');` |
| Editorial Classic | Cormorant Garamond (500-700) | Libre Baskerville (400) | `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap');` |

中文: `PingFang SC, Noto Serif SC, Microsoft YaHei, sans-serif`

## 风格 CSS 要点

```css
.resume {
  border-radius: 2px;
  font-weight: 400-700;
}
.section-title {
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--color-accent);
  padding-bottom: 2px;
}
.name {
  font-family: 'Playfair Display', 'Noto Serif SC', serif;
  font-weight: 700;
}
```
