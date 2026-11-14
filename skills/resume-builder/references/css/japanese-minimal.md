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
  --color-muted: #F5F4F0;
  --color-muted-fg: #475569;
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
  --color-muted-fg: #475569;
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
  --color-muted-fg: #475569;
  --color-border: #EFE7FC;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #7C3AED;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Japanese Calm | Spectral (500-700) | Fira Sans (300-700) | `@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&family=Spectral:wght@400;500;600;700&display=swap');` |
| Editorial Serif | PT Serif (400/700) | Lato (300-700) | `@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=PT+Serif:wght@400;700&display=swap');` |

中文: `"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`（避免优先回退至 `Noto Serif SC` 导致康熙部首乱码与 Type3 伪空格；不要在 `@media print` 强制覆盖 `font-weight: 400 !important`）

## 组件级 CSS

```css
/* === 顶部 Header === */
.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid rgba(87, 83, 78, 0.2);
  padding-bottom: 8px;
  margin-bottom: var(--gap-section);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-info h1 {
  font-family: 'Spectral', Georgia, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", serif;
  font-size: var(--fs-name);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 3px 0;
  letter-spacing: 0.02em;
}

.header-info .job-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-accent);
  letter-spacing: 0.8px;
}

.header-contacts {
  font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  text-align: left;
  line-height: 1.4;
}

.header-contacts a {
  color: var(--color-muted-fg);
  text-decoration: none;
}

.header-right {
  flex-shrink: 0;
  margin-bottom: 2px;
}

.photo-wrapper {
  width: 66px;
  height: 84px;
  border: 1px solid rgba(87, 83, 78, 0.2);
  padding: 3px;
  background-color: #ffffff;
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(10%);
}

/* === 章节标题 === */
.section-title {
  font-family: 'Spectral', Georgia, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", serif;
  font-size: var(--fs-section-title);
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 0;
  margin-bottom: 4mm;
}

.section-title::after {
  content: "";
  display: block;
  width: 24px;
  height: 1px;
  background: var(--color-primary);
  margin-top: 4px;
  opacity: 0.3;
}

/* === 章节与内容排版 === */
.section {
  break-inside: avoid;
  margin-bottom: var(--gap-section);
}

.item-block {
  margin-bottom: var(--gap-item);
}

.item-block:not(:first-of-type) {
  margin-top: var(--gap-item);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 700;
  margin-bottom: 2px;
  color: var(--color-primary);
}

.item-title {
  font-size: 10px;
}

.item-meta {
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  font-weight: normal;
}

ul.item-details {
  list-style-type: none;
  padding-left: 0;
}

ul.item-details li {
  padding-left: 14px;
  text-indent: -11px;
  margin-bottom: 2px;
  text-align: left;
}

ul.item-details li::before {
  content: "•\00a0\00a0";
  color: var(--color-accent);
  font-weight: 700;
}

/* 教育背景单行 */
.education-line {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  font-weight: 700;
  color: var(--color-primary);
}

.education-meta {
  font-weight: normal;
  color: var(--color-muted-fg);
  font-size: var(--fs-meta);
}

/* 技能标签（极简灰色轻量标签） */
.skill-tags-container {
  display: block;
  margin-top: 2px;
}

.skill-badge {
  display: inline-block;
  margin: 0 5px 5px 0;
  background-color: var(--color-muted);
  border: 1px solid rgba(87, 83, 78, 0.15);
  padding: 1px 6px;
  font-size: var(--fs-meta);
  color: var(--color-primary);
  white-space: nowrap;
}

/* 自我评价（左侧强调线） */
.summary-block {
  background-color: transparent;
  border-left: 1.5px solid var(--color-accent);
  padding: 4px 8px;
  font-size: var(--fs-body);
  line-height: 1.4;
  text-align: left;
}

@media print {
  .profile-photo {
    filter: none;
  }
  [data-resume-demo="true"] [role="note"],
  .no-print {
    display: none !important;
  }
}

```
