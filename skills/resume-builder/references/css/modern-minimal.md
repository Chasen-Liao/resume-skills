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
| Minimal Swiss | Plus Jakarta Sans (600-700) | Plus Jakarta Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');` |
| Geometric Modern | Outfit (500-700) | Work Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');` |

中文: `PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif`

## 组件级 CSS

```css
/* === 顶部 Header === */
.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 8px;
  margin-bottom: var(--gap-section);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-info h1 {
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 2px 0;
  line-height: var(--lh-heading);
  letter-spacing: -0.5px;
}

.header-info .job-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-contacts {
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  text-align: left;
  line-height: var(--lh-meta);
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
  border: 1px solid var(--color-border);
  padding: 2px;
  background-color: #ffffff;
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* === 章节标题 === */
.section-title {
  font-size: var(--fs-section-title);
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 3px;
  margin-top: 0;
  margin-bottom: 3.5mm;
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
}

.item-title {
  color: var(--color-primary);
  font-size: 10.5px;
}

.item-meta {
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  font-weight: normal;
}

/* 描述列表 */
ul.item-details {
  list-style-type: none;
  padding-left: 0;
}

ul.item-details li {
  position: relative;
  padding-left: 10px;
  margin-bottom: 2px;
  text-align: justify;
}

ul.item-details li::before {
  content: "—";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: bold;
}

/* 教育背景单行 */
.education-line {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  color: var(--color-primary);
}

.education-meta {
  font-weight: normal;
  color: var(--color-muted-fg);
  font-size: var(--fs-meta);
}

/* 技能标签排列 */
.skill-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.skill-badge {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  padding: 2px 7px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  white-space: nowrap;
  font-weight: 500;
}

/* 自我评价 */
.summary-block {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  padding: 6px 10px;
  font-size: var(--fs-body);
  line-height: 1.4;
  text-align: justify;
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
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 180px;
}

.btn-export {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
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
