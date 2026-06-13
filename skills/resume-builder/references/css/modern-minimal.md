# 现代简约 — Modern Minimal

对应 ui-ux-pro-max 风格：**Minimalism & Swiss Style** (1950s Swiss, Low complexity)

**风格特质**: 大量留白、高对比、几何线条、无装饰阴影、字体优雅克制

---

## 配色 A: 黑白 + 蓝

```css
:root {
  --color-primary: #18181B;
  --color-on-primary: #FFFFFF;
  --color-accent: #2563EB;
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
  --color-ring: #2563EB;
}
```

## 配色 B: 黑白 + 绿

```css
:root {
  --color-primary: #1C1917;
  --color-on-primary: #FFFFFF;
  --color-accent: #059669;
  --color-on-accent: #FFFFFF;
  --color-bg: #FAFAF9;
  --color-fg: #0C0A09;
  --color-card: #FFFFFF;
  --color-card-fg: #0C0A09;
  --color-muted: #E8ECF0;
  --color-muted-fg: #64748B;
  --color-border: #D6D3D1;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #059669;
}
```

## 配色 C: 暖灰 + 蓝

```css
:root {
  --color-primary: #475569;
  --color-on-primary: #FFFFFF;
  --color-accent: #2563EB;
  --color-on-accent: #FFFFFF;
  --color-bg: #F8FAFC;
  --color-fg: #1E293B;
  --color-card: #FFFFFF;
  --color-card-fg: #1E293B;
  --color-muted: #EAEFF3;
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
| Minimal Swiss | Inter (600-700) | Inter (400) | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');` |
| Geometric Modern | Outfit (500-700) | Work Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');` |

中文: `PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif`

## 风格 CSS 要点

```css
.resume {
  border-radius: 0;           /* 无圆角 */
  box-shadow: none;           /* 无阴影 */
  font-weight: 400-700;
}
.section-title {
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```
