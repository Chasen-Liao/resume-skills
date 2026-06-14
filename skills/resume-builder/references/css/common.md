# 通用紧凑排版 CSS

与风格配色文件组合使用。选择一个配色方案后，将其 CSS 变量块插入到 `:root` 中即可。

> **注**：以下 class 命名为通用参考。各风格 HTML 示例（`examples/<style>.html`）中的实际 class 命名可能不同（如 `.layout-grid`、`.footer-layout` 等），生成时以 HTML 示例为准。

## 颜色变量清单（各风格 CSS 文件必须定义）

| 变量名 | 语义 | 示例值 |
|--------|------|--------|
| `--color-primary` | 主色/品牌色，用于标题、边框等核心元素 | `#0A2540` |
| `--color-on-primary` | 主色上的前景色（文字） | `#FFFFFF` |
| `--color-accent` | 点缀色/强调色，用于标签、装饰线等 | `#0066CC` |
| `--color-on-accent` | 点缀色上的前景色 | `#FFFFFF` |
| `--color-bg` | 页面背景色 | `#FFFFFF` |
| `--color-fg` | 页面前景色（正文文字） | `#1D2A3A` |
| `--color-card` | 卡片/高亮区域背景色 | `#F4F8FC` |
| `--color-card-fg` | 卡片前景色 | `#1D2A3A` |
| `--color-muted` | 柔和色，用于次要边框、分隔线 | `#E6F0FA` |
| `--color-muted-fg` | 柔和色前景色，用于辅助文字 | `#5A7184` |
| `--color-border` | 通用边框色 | `#D2E3F3` |
| `--color-ring` | 焦点环/选中态颜色 | `#0A2540` |

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
  --fs-body: 10.5px;            /* 9.5-11px，部分风格可微调 */
  --fs-meta: 9.5px;             /* 9-9.5px，辅助信息 */

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

/* === 技能标签 badge 排列 === */
.skill-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.skill-badge {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  white-space: nowrap;
}

/* === 教育背景单行显示 === */
.education-line {
  display: flex;
  gap: 1em;
  white-space: nowrap;
}

/* === 双栏布局（根据风格和内容量选择使用） === */
.layout-grid {
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
