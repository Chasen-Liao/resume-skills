# 简约蓝色商务 — Minimal Blue Business

对应 ui-ux-pro-max 风格：**Corporate Trust** + **Minimal Business 字体**

**风格特质**: 左侧装饰竖条、顶部三栏 Header、线性章节标题（左侧色块 + 右侧延展线）、块级项目卡片（左侧强调线 + 顶部分隔线）、轻量标签系统、自我评价高亮区（浅蓝背景 wash 与左侧强调线）。

---

## 配色 A: 深蓝 + 冰蓝 (Navy & Ice Wash)

```css
:root {
  --color-primary: #0A2540;
  --color-on-primary: #FFFFFF;
  --color-accent: #0066CC;
  --color-on-accent: #FFFFFF;
  --color-bg: #FFFFFF;
  --color-fg: #1D2A3A;
  --color-card: #F4F8FC;
  --color-card-fg: #1D2A3A;
  --color-muted: #E6F0FA;
  --color-muted-fg: #5A7184;
  --color-border: #D2E3F3;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #0A2540;
}
```

## 配色 B: 钴蓝 + 浅灰蓝 (Cobalt & Light Slate)

```css
:root {
  --color-primary: #1E3A8A;
  --color-on-primary: #FFFFFF;
  --color-accent: #0284C7;
  --color-on-accent: #FFFFFF;
  --color-bg: #F8FAFC;
  --color-fg: #0F172A;
  --color-card: #F0F6FC;
  --color-card-fg: #0F172A;
  --color-muted: #E2E8F0;
  --color-muted-fg: #64748B;
  --color-border: #CBD5E1;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #1E3A8A;
}
```

## 配色 C: 钢蓝 + 柔蓝 (Steel & Soft Blue)

```css
:root {
  --color-primary: #2B4C7E;
  --color-on-primary: #FFFFFF;
  --color-accent: #4A90E2;
  --color-on-accent: #FFFFFF;
  --color-bg: #FAFBFC;
  --color-fg: #2C3E50;
  --color-card: #F2F6FA;
  --color-card-fg: #2C3E50;
  --color-muted: #E5ECF4;
  --color-muted-fg: #7F8C8D;
  --color-border: #CFD9E5;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #2B4C7E;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Corporate Trust | Lexend (500-700) | Source Sans 3 (400) | `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');` |
| Geometric Modern | Outfit (500-700) | Work Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');` |
| Modern Professional | Poppins (500-700) | Open Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');` |

中文: `Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif`

## 风格 CSS 要点

```css
/* 简约边距微调以适应左侧竖带 */
.resume {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  padding-left: calc(var(--page-margin) + 8px) !important;
}

/* 左侧装饰竖条 */
.resume::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-accent) 100%);
}

/* 顶部三栏 Header */
.resume-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 15px;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 8px;
  margin-bottom: var(--gap-section);
}

.header-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header-info h1 {
  font-family: 'Lexend', 'Noto Sans SC', sans-serif;
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 4px 0;
  line-height: var(--lh-heading);
}

.header-info .job-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
}

.header-contacts {
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 3px;
}

.header-photo {
  width: 48px;
  height: 60px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 9px;
  color: var(--color-muted-fg);
  overflow: hidden;
}

.header-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 线性章节标题：左侧色块 + 右侧延展线 */
.section-title {
  display: flex;
  align-items: center;
  font-family: 'Lexend', 'Noto Sans SC', sans-serif;
  font-size: var(--fs-section-title);
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  margin-top: 0;
  margin-bottom: 6px;
}

.section-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 14px;
  background-color: var(--color-accent);
  margin-right: 8px;
  border-radius: 2px;
}

.section-title::after {
  content: "";
  flex-grow: 1;
  height: 1px;
  background-color: var(--color-border);
  margin-left: 10px;
}

/* 块级项目卡片：左边线 + 顶部分割线 */
.item-block {
  border-left: 2px solid var(--color-muted);
  padding-left: 10px;
  margin-left: 2px;
  margin-bottom: var(--gap-item);
  transition: border-color 0.2s;
}

.item-block:hover {
  border-left-color: var(--color-accent);
}

.item-block:not(:first-of-type) {
  border-top: 1px dashed var(--color-border);
  padding-top: var(--gap-item);
  margin-top: var(--gap-item);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 600;
  margin-bottom: 2px;
}

.item-title {
  color: var(--color-primary);
}

.item-meta {
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  font-weight: normal;
}

/* 轻量标签系统 */
.skill-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.skill-badge {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  padding: 1px 6px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  border-radius: 2px;
  white-space: nowrap;
}

/* 自我评价 summary：浅蓝背景与左边强调线 */
.summary-block {
  background-color: var(--color-card);
  border-left: 4px solid var(--color-primary);
  padding: 8px 12px;
  border-radius: 0 4px 4px 0;
  margin-top: var(--gap-item);
}
```
