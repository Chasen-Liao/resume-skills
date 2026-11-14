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

| 方案 | 标题 | 正文 / 等宽 | Google Fonts Import |
|------|------|------|---------------------|
| Tech Startup | Barlow (400-700) | Fira Sans / IBM Plex Mono (400-700) | `@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Fira+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');` |
| Developer Clean | Poppins (500-700) | Fira Sans / Space Mono (400-700) | `@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap');` |

中文: `"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`（所有英文与等宽字体声明均须附带该中文回退栈，防止中文落入 `NSimSun`）

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
  font-family: 'Barlow', "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--color-on-primary);
  margin: 0 0 2px 0;
  letter-spacing: 0.2px;
}

.header-info .job-title {
  font-family: 'IBM Plex Mono', Consolas, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-accent);
  letter-spacing: 0.5px;
}

.header-contacts {
  font-family: 'IBM Plex Mono', Consolas, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", monospace;
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

/* === 章节标题 === */
.section-title {
  font-family: 'Barlow', "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-section-title);
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  margin-top: 0;
  margin-bottom: 4mm;
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
  font-family: 'IBM Plex Mono', Consolas, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", monospace;
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  font-weight: normal;
}

ul.item-details {
  list-style-type: none;
  padding-left: 0;
}

ul.item-details li {
  padding-left: 16px;
  text-indent: -16px;
  margin-bottom: 2px;
  text-align: left;
}

ul.item-details li::before {
  content: ">\00a0\00a0";
  color: var(--color-accent);
  font-family: 'IBM Plex Mono', Consolas, "PingFang SC", "Microsoft YaHei", monospace;
  font-weight: 700;
}

/* 教育背景（代码风格卡片） */
.education-line {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  font-weight: 700;
  color: var(--color-on-primary);
  padding: 4px 8px;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
}

.education-meta {
  font-family: 'IBM Plex Mono', Consolas, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", monospace;
  font-weight: normal;
  color: var(--color-muted-fg);
  font-size: var(--fs-meta);
}

/* 技能标签（代码底色徽章） */
.skill-tags-container {
  display: block;
  margin-top: 2px;
}

.skill-badge {
  display: inline-block;
  margin: 0 5px 5px 0;
  font-family: 'IBM Plex Mono', Consolas, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", monospace;
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
  text-align: left;
}

/* === 打印浅色反转与阴影清除 === */
@media print {
  :root {
    --color-bg: #FFFFFF !important;
    --color-fg: #0F172A !important;
    --color-card: #FFFFFF !important;
    --color-card-fg: #0F172A !important;
    --color-muted: #F1F5F9 !important;
    --color-muted-fg: #475569 !important;
    --color-border: #E2E8F0 !important;
    --color-on-primary: #0F172A !important;
  }

  body {
    background-color: white;
    color: var(--color-fg);
  }

  .resume {
    box-shadow: none;
    border: none;
    color-scheme: light;
  }

  .header-info h1,
  .photo-wrapper {
    text-shadow: none !important;
    box-shadow: none !important;
  }

  [data-resume-demo="true"] [role="note"],
  .no-print {
    display: none !important;
  }
}

```
