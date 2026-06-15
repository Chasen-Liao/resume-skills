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

## 组件级 CSS

```css
/* === 顶部 Header === */
.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
  margin-bottom: var(--gap-section);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-info h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--color-on-primary);
  margin: 0 0 2px 0;
  letter-spacing: -0.5px;
  text-shadow: 0 0 1px rgba(255,255,255,0.3);
}

.header-info .job-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-accent);
  letter-spacing: 0.5px;
}

.header-contacts {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  text-align: left;
  line-height: 1.4;
}

.header-contacts a {
  color: var(--color-accent);
  text-decoration: none;
}

.header-right {
  flex-shrink: 0;
}

.photo-wrapper {
  width: 66px;
  height: 84px;
  border: 1px solid var(--color-accent);
  padding: 2px;
  background-color: var(--color-card);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* === 章节标题（霓虹色 + 终端后缀） === */
.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--fs-section-title);
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  margin-top: 0;
  margin-bottom: 4mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title::after {
  content: "</>";
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--color-border);
  font-weight: normal;
}

/* === 章节与内容排版 === */
.section {
  break-inside: avoid;
  margin-bottom: var(--gap-section);
}

.item-block {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  padding: 6px 10px;
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
  margin-bottom: 3px;
  color: var(--color-on-primary);
}

.item-title {
  font-size: 10.5px;
}

.item-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  font-weight: normal;
}

ul.item-details {
  list-style-type: none;
  padding-left: 0;
}

ul.item-details li {
  position: relative;
  padding-left: 14px;
  margin-bottom: 2px;
  text-align: justify;
}

ul.item-details li::before {
  content: ">";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
}

/* 教育背景（代码风格卡片） */
.education-line {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  color: var(--color-on-primary);
  padding: 4px 8px;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
}

.education-meta {
  font-family: 'JetBrains Mono', monospace;
  font-weight: normal;
  color: var(--color-muted-fg);
  font-size: var(--fs-meta);
}

/* 技能标签（代码底色徽章） */
.skill-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.skill-badge {
  font-family: 'JetBrains Mono', monospace;
  background-color: var(--color-muted);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  white-space: nowrap;
}

/* 自我评价（终端风格左边强调线） */
.summary-block {
  background-color: var(--color-card);
  border-left: 3px solid var(--color-accent);
  border-right: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 8px 10px;
  font-size: var(--fs-body);
  line-height: 1.45;
  text-align: justify;
}

/* 导出按钮工具栏（深色主题） */
.no-print-toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--color-card);
  padding: 12px;
  border: 1px solid var(--color-border);
  width: 180px;
}

.btn-export {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 8px 16px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}

.btn-export:hover {
  background-color: #2563EB;
}

.toolbar-tip {
  font-size: 9.5px;
  color: var(--color-muted-fg);
  line-height: 1.3;
}
```
