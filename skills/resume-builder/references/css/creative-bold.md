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

## 组件级 CSS

```css
/* === 布局网格（Brutalism 风格推荐双栏） === */
.layout-grid {
  display: grid;
  grid-template-columns: 32% 1fr;
  gap: 6mm;
}

/* === 顶部 Header === */
.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid var(--color-border);
  padding-bottom: 8px;
  margin-bottom: var(--gap-section);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-info h1 {
  font-family: 'Bebas Neue', "PingFang SC", sans-serif;
  font-size: var(--fs-name);
  color: var(--color-primary);
  margin: 0;
  line-height: var(--lh-heading);
  letter-spacing: 1.5px;
}

.header-info .job-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 1px;
}

.header-contacts {
  font-size: var(--fs-meta);
  font-weight: 500;
  text-align: left;
  line-height: 1.35;
}

.header-contacts a {
  color: var(--color-fg);
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-decoration-thickness: 1.5px;
}

.header-right {
  flex-shrink: 0;
}

.photo-wrapper {
  width: 68px;
  height: 86px;
  border: 2px solid var(--color-border);
  background-color: var(--color-card);
  box-shadow: 2px 2px 0px var(--color-accent);
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* === 章节标题（粉色几何方块点缀） === */
.section-title {
  font-family: 'Bebas Neue', "PingFang SC", sans-serif;
  font-size: var(--fs-section-title);
  font-weight: 900;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 0;
  margin-bottom: 3mm;
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 2px;
}

.section-title::before {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  background: var(--color-accent);
  margin-right: 6px;
}

/* === 章节内容 === */
.section {
  break-inside: avoid;
  margin-bottom: var(--gap-section);
}

/* 经历与项目卡片：Brutalism 线框卡片 */
.item-block {
  border: 1.5px solid var(--color-border);
  padding: 6px 8px;
  background-color: var(--color-card);
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
}

.item-title {
  color: var(--color-primary);
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
  position: relative;
  padding-left: 10px;
  margin-bottom: 2px;
  text-align: justify;
  font-size: 9.5px;
}

ul.item-details li::before {
  content: "▪";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-size: 8px;
}

/* 教育背景（线框卡片） */
.education-block {
  border: 1.5px solid var(--color-border);
  padding: 6px 8px;
  margin-bottom: var(--gap-item);
}

.education-block div {
  font-weight: 700;
  color: var(--color-primary);
}

.education-meta {
  font-weight: normal !important;
  color: var(--color-muted-fg);
  font-size: var(--fs-meta);
  margin-top: 1px;
}

/* 技能标签（粗黑边框小卡片） */
.skill-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.skill-badge {
  background-color: var(--color-card);
  border: 1.5px solid var(--color-border);
  padding: 1px 6px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  white-space: nowrap;
  font-weight: 700;
}

/* 自我评价（右下倾斜阴影） */
.summary-block {
  background-color: var(--color-card);
  border: 1.5px solid var(--color-border);
  padding: 8px 10px;
  font-size: 9.5px;
  line-height: 1.4;
  text-align: justify;
  box-shadow: 3px 3px 0px var(--color-accent);
  margin-top: 4px;
  margin-right: 3px;
}

/* 导出按钮工具栏 */
.no-print-toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: white;
  padding: 12px;
  border-radius: 0;
  border: 2px solid var(--color-border);
  width: 180px;
}

.btn-export {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  letter-spacing: 1px;
}

.btn-export:hover {
  background-color: var(--color-accent);
}

.toolbar-tip {
  font-size: 9.5px;
  color: #64748B;
  line-height: 1.3;
}
```
