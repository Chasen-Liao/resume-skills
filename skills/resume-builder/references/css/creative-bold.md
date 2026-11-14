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
| Bold Statement | Bebas Neue (400) | Fira Sans (300-700) | `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fira+Sans:wght@300;400;500;600;700&display=swap');` |
| Tech Startup | Barlow (500-700) | Fira Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');` |
| Developer Mono | IBM Plex Mono (500-700) | Fira Sans (400) | `@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');` |

中文: `"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`（`Bebas Neue` 仅存在 `400` 字重，严禁设置为 `700`/`900`）

## 组件级 CSS

```css
/* === 默认单栏：章节直接置于 .resume，由 common.md 的全页契约均匀分布 === */
/* 只有真实内容足够且两栏均通过留白检查时才使用双栏；不要设置固定网格高度。 */

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
  font-family: 'Bebas Neue', "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-name);
  font-weight: 400;
  color: var(--color-primary);
  margin: 0;
  line-height: var(--lh-heading);
  letter-spacing: 0.8px;
}

.header-info .job-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 1px;
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
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  text-decoration-skip-ink: auto;
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

/* === 章节标题（横向细条点缀，避免方块误识为 0） === */
.section-title {
  font-family: 'Bebas Neue', "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-section-title);
  font-weight: 400;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
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
  width: 14px;
  height: 3px;
  background: var(--color-accent);
  margin-right: 7px;
  border-radius: 1px;
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
  padding-left: 14px;
  text-indent: -11px;
  margin-bottom: 2px;
  text-align: left;
  font-size: 9.5px;
}

ul.item-details li::before {
  content: "•\00a0\00a0";
  color: var(--color-accent);
  font-size: 9px;
  font-weight: 700;
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

/* 技能标签（轻量边框卡片，避免重黑框影响 OCR） */
.skill-tags-container {
  display: block;
  margin-top: 2px;
}

.skill-badge {
  display: inline-block;
  margin: 0 5px 5px 0;
  background-color: var(--color-card);
  border: 1px solid #A1A1AA;
  padding: 2px 7px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  white-space: nowrap;
  font-weight: 600;
  border-radius: 2px;
}

/* 自我评价（右下倾斜阴影） */
.summary-block {
  background-color: var(--color-card);
  border: 1px solid #A1A1AA;
  border-left: 3px solid var(--color-accent);
  padding: 8px 10px;
  font-size: 9.5px;
  line-height: 1.4;
  text-align: left;
  box-shadow: 3px 3px 0px var(--color-accent);
  margin-top: 4px;
  margin-right: 3px;
}

/* === 打印清除阴影/外框；若使用配色 C 深色主题，须启用浅色反转 === */
@media print {
  /* 若选用配色 C (深色 + 霓虹绿)，取消下行注释实现打印浅色反转：
  :root {
    --color-bg: #FFFFFF !important;
    --color-fg: #09090B !important;
    --color-card: #FFFFFF !important;
    --color-card-fg: #09090B !important;
    --color-muted: #F4F4F5 !important;
    --color-muted-fg: #475569 !important;
    --color-border: #E4E4E7 !important;
    --color-primary: #18181B !important;
  }
  */
  .resume {
    border: none;
    box-shadow: none;
  }
  .photo-wrapper,
  .summary-block {
    box-shadow: none;
  }
  [data-resume-demo="true"] [role="note"],
  .no-print {
    display: none !important;
  }
}

```
