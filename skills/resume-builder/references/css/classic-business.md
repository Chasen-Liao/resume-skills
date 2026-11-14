# 经典商务 — Classic Business

对应风格：**Corporate Hardline** + **Modern Sans-Serif 字体**

**风格特质**: 黑色或高对比深色主调、极粗横线分隔、左侧斜切黑底白字标签、两栏个人信息带头像。整体排版硬朗、干练、沉稳，极具商务气场。

---

## 配色 A: 经典黑白 (首选)

```css
:root {
  --color-primary: #000000;
  --color-on-primary: #FFFFFF;
  --color-accent: #000000;
  --color-on-accent: #FFFFFF;
  --color-bg: #FFFFFF;
  --color-fg: #000000;
  --color-card: #FFFFFF;
  --color-card-fg: #000000;
  --color-muted: #F3F4F6;
  --color-muted-fg: #4B5563;
  --color-border: #000000;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #000000;
}
```

## 配色 B: 商务深蓝

```css
:root {
  --color-primary: #0F172A;
  --color-on-primary: #FFFFFF;
  --color-accent: #0F172A;
  --color-on-accent: #FFFFFF;
  --color-bg: #FFFFFF;
  --color-fg: #0F172A;
  --color-card: #FFFFFF;
  --color-card-fg: #0F172A;
  --color-muted: #F1F5F9;
  --color-muted-fg: #475569;
  --color-border: #0F172A;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #0F172A;
}
```

## 配色 C: 沉稳深灰

```css
:root {
  --color-primary: #1E293B;
  --color-on-primary: #FFFFFF;
  --color-accent: #1E293B;
  --color-on-accent: #FFFFFF;
  --color-bg: #FFFFFF;
  --color-fg: #1E293B;
  --color-card: #FFFFFF;
  --color-card-fg: #1E293B;
  --color-muted: #F1F5F9;
  --color-muted-fg: #475569;
  --color-border: #1E293B;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-ring: #1E293B;
}
```

## 推荐字体

| 方案 | 标题 | 正文 | Google Fonts Import |
|------|------|------|---------------------|
| Modern Sans | Fira Sans (600-700) | Fira Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&display=swap');` |
| Corporate Clean | Lato (700) | Lato (400) | `@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');` |

中文优先使用系统默认安全无衬线字体栈：`"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`，以确保高清晰度、完整 `Type0` 嵌入与可读性。

## 风格 CSS 要点

```css
/* === 顶部大标题 === */
.resume-header {
  margin-bottom: var(--gap-section);
}
.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 6px;
}
.resume-title {
  font-size: 26px;
  font-weight: bold;
  color: var(--color-primary);
  letter-spacing: 0.8px;
}
.job-intent {
  font-size: 15px;
  font-weight: bold;
  color: var(--color-primary);
}
.header-line {
  height: 5px;
  background-color: var(--color-primary);
  width: 100%;
}

/* === 章节标题：黑底白字标签（禁用 clip-path 以防 PDF 乱序） === */
.section-header {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  border-bottom: 2px solid var(--color-primary);
  margin-bottom: 3.5mm;
  padding-bottom: 0;
}
.section-title-tag {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  padding: 4px 14px 4px 12px;
  font-weight: bold;
  font-size: 13.5px;
  letter-spacing: 0.5px;
  display: inline-block;
  line-height: 1.25;
}
.section-title-en {
  font-size: 11.5px;
  font-weight: bold;
  color: var(--color-primary);
  padding-bottom: 2px;
  text-transform: capitalize;
}

/* === 个人信息双栏排版与头像 === */
.personal-info-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.info-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  row-gap: 10px;
  column-gap: 20px;
  flex: 1;
}
.info-detail-item {
  display: flex;
  align-items: center;
  font-size: var(--fs-body);
}
.info-icon {
  width: 11px;
  height: 11px;
  margin-right: 10px;
  fill: none;
  stroke: var(--color-muted-fg);
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.75;
  flex-shrink: 0;
}
.info-label {
  font-weight: bold;
}
.photo-wrapper {
  width: 90px;
  height: 120px;
  border: 1px solid var(--color-border);
  padding: 3px;
  background-color: #ffffff;
  flex-shrink: 0;
}
.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* === 经历与列表（禁用 position: relative/absolute 以防 PDF 乱序） === */
.experience-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-weight: bold;
  margin-bottom: 4px;
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
  font-weight: 700;
  color: var(--color-primary);
}

@media print {
  [data-resume-demo="true"] [role="note"],
  .no-print {
    display: none !important;
  }
}
```

