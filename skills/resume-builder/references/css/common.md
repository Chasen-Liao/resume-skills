# 通用紧凑排版 CSS

与风格配色文件组合使用。选择一个配色方案后，将其 CSS 变量块插入到 `:root` 中即可。

```css
/* === 页面尺寸 === */
:root {
  --page-width: 210mm;
  --page-height: 297mm;
  --page-margin: 10mm;          /* ≤12mm */
  --content-width: 190mm;       /* 210 - 2*10 */

  /* 字号 */
  --fs-name: 24px;              /* 22-26px */
  --fs-section-title: 14px;     /* 13-15px */
  --fs-body: 10.5px;            /* 10-11px */
  --fs-meta: 9.5px;             /* 辅助信息最低 */

  /* 间距 */
  --gap-section: 8mm;           /* ≤10mm 板块间距 */
  --gap-item: 3mm;              /* ≤4mm 条目间距 */
  --gap-inline: 6mm;            /* 行内间距 */

  /* 行高 */
  --lh-heading: 1.2;
  --lh-body: 1.35;              /* 1.25-1.4 */
  --lh-meta: 1.3;

  /* === 颜色由风格文件提供 === */
}

/* === 打印设置 === */
@page {
  size: A4;
  margin: 0;
}

@media print {
  body {
    width: var(--page-width);
    min-height: var(--page-height);
    padding: var(--page-margin);
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .no-print { display: none !important; }
}

/* === 技能标签 inline 排列 (节省纵向空间) === */
ul.skill-tags {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  line-height: 1.4;
}
ul.skill-tags li {
  display: inline-block;
  white-space: nowrap;
}
ul.skill-tags li:not(:last-child)::after {
  content: "·";
  margin-left: 8px;
  color: var(--color-muted);
}

/* === 教育背景单行显示 === */
.education-line {
  display: flex;
  gap: 1em;
  white-space: nowrap;
}

/* === 双栏布局 === */
.resume-layout {
  display: grid;
  grid-template-columns: 32% 1fr;
  gap: 6mm;
}

/* === 防止内容断裂 === */
.section {
  break-inside: avoid;
  margin-bottom: var(--gap-section);
}
p, li {
  widows: 2;
  orphans: 2;
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
}
```
