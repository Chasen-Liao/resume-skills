# 简约蓝色商务 — Minimal Blue Business

对应 ui-ux-pro-max 风格：**Corporate Trust** + **Minimal Business 字体**

**风格特质**: 左侧装饰竖条、顶部三栏 Header、线性章节标题（左侧色块 + 右侧延展线）、块级项目卡片（左侧强调线 + 顶部分隔线）、轻量标签系统、自我评价高亮区（浅蓝背景 wash 与左侧强调线）。

**设计定位**：在 **稳重可信** 的商务调性与 **现代低噪** 的极简美学之间取得平衡。以深蓝色（Navy）为主基调，亮蓝色（Accent）点缀，大面积白底 + 小面积浅蓝 wash。使用精致克制的细边框和虚线，替代大面积粗重色块。

**Do's & Don'ts**:
- ✅ 主色点缀鲜明：深蓝配高亮冰蓝，形成明确对比
- ✅ 虚实结合：多项目间用 dashed 虚线，Header 底部用实线
- ✅ 中英文混排优雅：标题用 Lexend/Outfit，中文用系统默认无衬线
- ❌ 避免平铺大色块（深蓝色大面积背景）
- ❌ 避免实线过多（页面网格化、死板）
- ❌ 不要混合超过 2 组以上英文字体系列

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
| Modern Professional | Poppins (500-700) | Fira Sans (300-700) | `@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');` |
| Clean Corporate | Lato (700) | Lato (300-700) | `@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');` |

中文: `"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`（所有英文标题/正文字体声明均须附带完整中文回退栈）

## 风格 CSS 要点

```css
/* 简约边距微调以适应左侧竖带 */
.resume {
  position: relative;
  overflow: visible;
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

/* 顶部双栏 Header (信息两行 + 右侧照片，防止窄右栏跨栏串行) */
.resume-header {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 15px;
  row-gap: 4px;
  align-items: center;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 8px;
  margin-bottom: var(--gap-section);
}

.header-info {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header-info h1 {
  font-family: 'Poppins', "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-name);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 3px 0;
  line-height: var(--lh-heading);
}

.header-info .job-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
  letter-spacing: 0.5px;
}

.header-contacts {
  grid-column: 1;
  grid-row: 2;
  font-size: var(--fs-meta);
  color: var(--color-muted-fg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 14px;
}

.header-photo {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  width: 66px;
  height: 84px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 8px;
  color: var(--color-muted-fg);
  overflow: hidden;
  flex-shrink: 0;
}

.header-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 线性章节标题：左侧轻量横条 + 右侧延展线 */
.section-title {
  display: flex;
  align-items: center;
  font-family: 'Poppins', "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
  font-size: var(--fs-section-title);
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  margin-top: 0;
  margin-bottom: 5mm;
}

.section-title::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 2px;
  background-color: var(--color-accent);
  margin-right: 7px;
  border-radius: 1px;
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
  color: var(--color-accent);
  font-weight: 700;
}

/* 教育背景单行 */
.education-line {
  display: flex;
  justify-content: space-between;
  gap: 1em;
  font-weight: 600;
  color: var(--color-primary);
  padding-left: 4px;
}

/* 底部单栏垂直流信息区 */
.footer-layout {
  display: flex;
  flex-direction: column;
  gap: var(--gap-section);
  margin-top: var(--gap-item);
}

/* 轻量标签系统 */
.skill-tags-container {
  display: block;
  margin-top: 4px;
}

.skill-badge {
  display: inline-block;
  margin: 0 5px 5px 0;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-bottom: 2px solid var(--color-accent);
  padding: 1px 7px;
  font-size: var(--fs-meta);
  color: var(--color-fg);
  border-radius: 2px;
  white-space: nowrap;
}

/* 自我评价 summary：浅蓝背景与左边强调线 */
.summary-block {
  background-color: var(--color-card);
  border-left: 2.5px solid var(--color-primary);
  padding: 8px 10px;
  border-radius: 0 4px 4px 0;
  font-size: var(--fs-body);
  line-height: 1.4;
  text-align: left;
}

@media print {
  [data-resume-demo="true"] [role="note"],
  .no-print {
    display: none !important;
  }
}
```
