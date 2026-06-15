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
| Modern Sans | Inter (600-700) | Inter (400) | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');` |
| Corporate Bold | Lexend (500-700) | Source Sans 3 (400) | `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');` |

中文优先使用系统默认无衬线字体：`PingFang SC, Microsoft YaHei, sans-serif`，以确保高清晰度和易读性。

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
  letter-spacing: 2px;
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

/* === 章节标题：带斜切角黑底白字标签 === */
.section-header {
  display: flex;
  align-items: flex-end;
  border-bottom: 2px solid var(--color-primary);
  margin-bottom: 3.5mm;
  padding-bottom: 0;
}
.section-title-tag {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  padding: 4px 22px 4px 10px;
  font-weight: bold;
  font-size: 13.5px;
  letter-spacing: 1px;
  clip-path: polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
  display: inline-block;
  line-height: 1.25;
}
.section-title-en {
  font-size: 11.5px;
  font-weight: bold;
  color: var(--color-primary);
  margin-left: 12px;
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
  width: 13px;
  height: 13px;
  margin-right: 6px;
  fill: var(--color-primary);
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
```

