---
name: jd-tailorer
description: 根据职位描述(JD)定制简历的技能。当用户提到「JD」「职位描述」「岗位匹配」「针对...改简历」「投递」「求职」「招聘要求」「Job Description」或者提供具体职位链接/文本要求修改简历时使用。支持上传或粘贴 JD 文本，自动进行关键词匹配和内容优化，基于已有简历生成针对该岗位的定制版 HTML 和 PDF。
category: hr
tags: [resume, jd, job-description, job-application, career, 简历, 求职, 投递, 岗位匹配]
languages: [zh, en]
---

# JD 简历定制器 (JD Tailorer)

根据职位描述定制简历——关键词对齐 + 内容重排序 + 术语对齐。**不编造经历**。

## 前置条件

需已有基础简历。若无，建议先用 resume-builder 创建。

## 工作流程

### 第一步：获取 JD

让用户粘贴 JD 文本或上传文件。

### 第二步：JD 分析

提取：核心技术要求、加分项、关键词（技术栈/行业术语/软技能）、岗位职责、公司文化暗示。简要呈现分析结果确认。

### 第三步：匹配分析

对比简历与 JD：
- 匹配点：已有的强相关经验/技能
- 缺失点：JD 要求但不具备的（如实告知，不编造）
- 弱化点：有关联度低的内容（保留但降优先级）

### 第四步：内容定制

遵循 resume-builder 写作规范（`../resume-builder/references/content-writing.md`）。

**改写检查清单（每次改写必须逐条核对）**：

- **强动词开头**：每条 bullet 以强动词起句。技术类优先用：设计、主导、实现、优化、重构、搭建、落地；管理与沟通类：带领、协调、推动、促成；成果类：提升、缩短、降低、消除、自动化
- **量化公式**：`[强动词] + [具体动作/技术] + [量化结果] + [方法/手段]`。示例："引入路由懒加载与 CDN 分流，将首屏渲染时间由 2.4s 缩短至 1.1s"
- **每条经历保证至少一个数字**：性能参数（ms/FPS）、业务指标（转化率/用户量）、效率提升（%）、规模（行/QPS/人数）

- **关键词优化**：术语对齐 JD → 自然融入描述 + 技能标签。目标覆盖率 ≥ 70%，禁止 keyword stuffing
- **板块重排**：JD 最关注的板块前置。应届生：项目经验始终在校经历之前
- **内容微调**：项目描述重新聚焦 JD 方向，自我评价对齐岗位三句话重写。每条经历保持至少一个量化数字
- **区分度说明**：定制完成后向用户说明改动点

### 第五步：生成定制文件

输出到 `tailored/<公司名>-<岗位>/`，含：
- `resume.html` — 沿用基础简历 CSS 风格，单页强约束，PDF 验证
- `matching-analysis.md` — 匹配分析报告（模板见 `references/matching-analysis.md`）

### PDF 验证

与 resume-builder 相同：导出 PDF → 检查页数（`python -c "from pypdf import PdfReader; print(len(PdfReader('<pdf>').pages))"`）→ 页数 > 1 必须压缩修复。

## 硬约束

- 绝不编造经历，修改仅限于措辞和呈现方式
- 定制版必须单页，不得溢出
- 沿用基础简历的 CSS 视觉风格

## 参考文档

- `../resume-builder/references/content-writing.md` — 写作规范
- `../resume-builder/references/design-guidelines.md` — 设计美学指南（备用：用户无基础简历时参考）
- `../resume-builder/references/css/<style>.md` — 对应风格 CSS 变量与布局
- `references/matching-analysis.md` — 匹配分析报告模板
