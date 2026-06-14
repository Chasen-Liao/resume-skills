# 日式极简 — Japanese Minimal / Wabi-sabi

对应 ui-ux-pro-max 风格：**Minimalism + warm neutral tones** + **Japanese Elegant 字体**

**风格特质**: 极简克制、柔和暖色、大面积留白、轻质字体、呼吸感强

> ⚠️ 留白风格 + 单页约束 = 需要用较小的字号(10px)和紧凑行高(1.3)来补偿留白

---

## 配色 A: 米白 + 深棕

```css
:root {
  --color-primary: #57534E;
  --color-on-primary: #FFFFFF;
  --color-accent: #D97706;
  --color-on-accent: #FFFFFF;
  --color-bg: #FFFBEB;
  --color-fg: #0F172A;
  --color-card: #FFFFFF;
  --color-card-fg: #0F172A;
  --color-muted: #F6F6F6;
  --color-muted-fg: #64748B;
  --color-border: #EEEDED;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #78716C;
}
```

## 配色 B: 暖灰 + 绿

```css
:root {
  --color-primary: #1C1917;
  --color-on-primary: #FFFFFF;
  --color-accent: #15803D;
  --color-on-accent: #FFFFFF;
  --color-bg: #F5F5F0;
  --color-fg: #0F172A;
  --color-card: #FFFFFF;
  --color-card-fg: #0F172A;
  --color-muted: #F6F6F7;
  --color-muted-fg: #64748B;
  --color-border: #EDEEEF;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #15803D;
}
```

## 配色 C: 白 + 靛蓝

```css
:root {
  --color-primary: #4338CA;
  --color-on-primary: #FFFFFF;
  --color-accent: #7C3AED;
  --color-on-accent: #FFFFFF;
  --color-bg: #FAF5FF;
  --color-fg: #1E1B4B;
  --color-card: #FFFFFF;
  --color-card-fg: #1E1B4B;
  --color-muted: #F7F3FD;
  --color-muted-fg: #64748B;
  --color-border: #EFE7FC;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #7C3AED;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Japanese Elegant | Noto Serif JP / SC (400-700) | Noto Sans JP / SC (300-400) | `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap');` |
| Wellness Calm | Lora (400-700) | Raleway (300-400) | `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap');` |

中文: `Noto Serif SC, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif`

## 风格 CSS 要点

```css
.resume {
  border-radius: 0;
  box-shadow: none;
  font-weight: 300;
}
/* 解决打印时细体字难以辨认的问题 */
@media print {
  .resume, p, span, li, .section-title {
    font-weight: 400 !important;
  }
}
.section-title {
  font-weight: 300;
  letter-spacing: 0.08em;       /* 加宽字间距, 日式风格 */
  font-size: 13px;
}
.name {
  font-family: 'Noto Serif SC', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
}
.section {
  margin-bottom: 7mm;           /* 比通用值更紧凑 */
}
/* 分隔线用细线代替粗色块 */
.section-title::after {
  content: "";
  display: block;
  width: 24px;
  height: 1px;
  background: var(--color-primary);
  margin-top: 4px;
  opacity: 0.3;
}
```
