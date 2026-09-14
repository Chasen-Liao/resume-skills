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

  /* === 视觉 A4 全页契约 === */
  --resume-layout: full-page;
  --resume-density: 1;
  --resume-density-min: 0.84;
  --resume-fill-target: 0.98;
  --resume-bottom-safe: 4.5mm;  /* 约 12.8pt，给打印留出底部安全余量 */

  /* 字号 */
  --fs-name: calc(24px * var(--resume-density));              /* 22-26px */
  --fs-section-title: calc(14px * var(--resume-density));     /* 13-15px */
  --fs-body: calc(10.5px * var(--resume-density));            /* 9.5-11px，部分风格可微调 */
  --fs-meta: calc(9.5px * var(--resume-density));             /* 9-9.5px，辅助信息 */

  /* 间距 */
  --gap-section: calc(8mm * var(--resume-density));           /* ≤10mm 板块间距 */
  --gap-item: calc(3mm * var(--resume-density));              /* ≤4mm 条目间距 */
  --gap-inline: calc(6mm * var(--resume-density));            /* 行内间距 */

  /* 行高 */
  --lh-heading: calc(1 + 0.2 * var(--resume-density));
  --lh-body: calc(1 + 0.35 * var(--resume-density));              /* 1.25-1.4 */
  --lh-meta: calc(1 + 0.3 * var(--resume-density));

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

/* === 全页自动分布与打印安全区 === */
html[data-resume-layout="full-page"] .resume {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: var(--page-height);
  padding-bottom: calc(var(--page-margin) + var(--resume-bottom-safe));
}

html[data-resume-layout="full-page"] .resume > .resume-header,
html[data-resume-layout="full-page"] .resume > .section,
html[data-resume-layout="full-page"] .resume > .layout-grid,
html[data-resume-layout="full-page"] .resume > .footer-layout {
  flex: 0 0 auto;
  min-height: 0;
}

html[data-resume-layout="full-page"] .resume > :last-child,
html[data-resume-layout="full-page"] .resume > .footer-layout > :last-child,
html[data-resume-layout="full-page"] .resume > .layout-grid > :last-child,
html[data-resume-layout="full-page"] .resume > .layout-grid > :last-child > :last-child,
html[data-resume-layout="full-page"] .resume > .layout-grid > .left-col > :last-child,
html[data-resume-layout="full-page"] .resume > .layout-grid > .right-col > :last-child {
  margin-bottom: 0;
}

html[data-resume-layout="full-page"] .resume > .layout-grid {
  align-content: stretch;
}

html[data-resume-layout="full-page"] .resume > .layout-grid > .left-col,
html[data-resume-layout="full-page"] .resume > .layout-grid > .right-col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 0;
}

@media print {
  html[data-resume-layout="full-page"] .resume {
    padding-bottom: calc(var(--page-margin) + var(--resume-bottom-safe));
  }
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

## 页面密度验证

生成后必须对实际导出的 PDF 运行：

```bash
python skills/resume-builder/scripts/validate_resume.py --html <resume.html> --pdf <resume.pdf> --check-layout --min-fill-ratio 0.98 --json
```

- 目标是 1 页、页面占用率至少 98%，并让顶部和底部留白接近；渲染脚本会在 `--resume-density-min` 之上自动压缩长内容，短内容由 `space-between` 均匀分布到有效区域。
- 页面偏空时，优先依靠全页契约的垂直分布；页面溢出时自动迭代 `--resume-density`，再使用已有内容均匀调整 `--gap-section`、`--gap-item`、行高或容器内边距。
- 自动调整达到密度下限仍无法满足 98% 或安全区要求时，校验会明确失败并提示用户；不得补写经历、指标、技能或重复文案。
- 页面溢出时，先缩小页边距（不低于 8mm），再压缩间距和行高（不低于 1.25），最后才考虑正文缩小（不低于 9.5px）或精简低相关内容。每次调整后重新导出和验证。
- `bottom safety` 失败或 PDF 页数大于 1 时，输出不可交付；必须修复后再进入 Canvas 预览或交付。
