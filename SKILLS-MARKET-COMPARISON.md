# Skills 市场同类产品深度对比报告

> **调研日期**：2026-06-14  
> **调研范围**：通过 [`skills.sh`](https://skills.sh/)（skills.sh leaderboard）官方 CLI `npx skills find` 命令搜索 `resume` 和 `job description` 两个关键词  
> **目的**：横向对比本仓库 `resume-skills` 与市场上同类简历/求职 Skill 的设计差异，提炼可借鉴的最佳实践  
> **报告立场**：纯调研性质，未安装任何外部 Skill，所有对比仅基于公开 SKILL.md / README

---

## 1. 调研对象清单

通过 `npx skills find resume` 和 `npx skills find "job description"` 检索，定位到 6 个与本仓库功能直接重叠的 Skill，按热度排序：

| 排名 | Skill 标识 | 来源仓库 | 安装量 | 形态 |
|---|---|---|---|---|
| 1 | `tailored-resume-generator` | `composiohq/awesome-claude-skills` | **6K** | 单文件 SKILL.md |
| 2 | `resume-tailor` | `claude-office-skills/skills` | 2.8K | SKILL.md + YAML 元数据头 + MCP 工具集成 |
| 3 | `resume` | `alirezarezvani/claude-skills` | 1.4K | 单文件 |
| 4 | `resume-ats-optimizer` | `paramchoudhary/resumeskills` | 1.4K | 模块化（独立 Skill） |
| 5 | `resume-bullet-writer` | `paramchoudhary/resumeskills` | 1.2K | 模块化（独立 Skill） |
| 6 | `resume-tailor` | `paramchoudhary/resumeskills` | 1.1K | 模块化（独立 Skill） |
| — | **`jd-tailorer` + `resume-builder`**（本仓库） | `Chasen-Liao/resume-skills` | 新发布 | **双 Skill 分层** |

> **说明**：`paramchoudhary/resumeskills`（⭐ 764 / Fork 80）实际包含 **20 个** Skill，覆盖简历优化、求职策略、面试谈判、垂直行业等全链路。表内仅列出与本仓库重叠的 3 个核心 Skill。

---

## 2. 架构形态对比

### 2.1 三种典型架构

```
┌────────────────────────────────────────────────────────────────────────┐
│ A. 单文件一体型（claude-office-skills / composiohq）                    │
│                                                                        │
│   resume-tailor.SKILL.md                                                │
│   ├─ 概述 + 输入约束                                                    │
│   ├─ ATS 优化通用规则                                                   │
│   ├─ 5 个行业的关键词清单                                                │
│   ├─ Power Verbs / 量化公式                                              │
│   ├─ 输出格式（含示例对话 ×2）                                            │
│   └─ Tips / FAQ / Limitations                                            │
│                                                                        │
│   优点：一体化，上下文完整                                               │
│   缺点：单文件长，触发后整段加载                                           │
├────────────────────────────────────────────────────────────────────────┤
│ B. 微服务多 Skill 型（paramchoudhary）                                  │
│                                                                        │
│   resume-ats-optimizer.SKILL.md                                          │
│   resume-bullet-writer.SKILL.md                                          │
│   resume-quantifier.SKILL.md                                             │
│   resume-formatter.SKILL.md                                              │
│   resume-tailor.SKILL.md                                                 │
│   resume-section-builder.SKILL.md                                        │
│   ...（共 20 个）                                                        │
│                                                                        │
│   优点：渐进式披露、按需加载、模块复用                                     │
│   缺点：Skill 间依赖关系需用户/Agent 自行串联                              │
├────────────────────────────────────────────────────────────────────────┤
│ C. 双 Skill 分层型（本仓库）                                              │
│                                                                        │
│   resume-builder.SKILL.md   ← 通用基础简历（对话式生成 HTML）             │
│   jd-tailorer.SKILL.md      ← 针对特定 JD 生成定制版                      │
│                                                                        │
│   优点：层次清晰（先生成 → 后定制），A4 PDF 强约束、视觉风格统一           │
│   缺点：覆盖面仅"简历生成 + JD 定制"两个环节，没有面试/谈判/求职信        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 架构差异矩阵

| 维度 | claude-office-skills (2.8K) | paramchoudhary (1.4K×3) | **本仓库** |
|---|---|---|---|
| **Skill 数量** | 1 个 | 20 个 | 2 个 |
| **覆盖链路** | 仅定制 | 全链路（ATS / bullets / 求职信 / 面试 / 谈判） | 仅生成 + 定制 |
| **输出物** | 对话文本 + Markdown 表格 | 对话文本 + Markdown 表格 | **HTML + 单页 A4 PDF（强制）** |
| **模板/视觉** | ❌ 无 | ❌ 无 | ✅ 6 套 CSS 风格 + 设计指南 |
| **跨 Skill 协作** | N/A | 隐式（Agent 自行编排） | **显式（第四步提到 jd-tailorer）** |
| **强制约束** | 弱（仅 Limitations） | 弱 | **强（单页 A4 + PDF 验证）** |

---

## 3. YAML Frontmatter 元数据对比

### 3.1 本仓库现状

**jd-tailorer/SKILL.md**：
```yaml
---
name: jd-tailorer
description: 根据职位描述(JD)定制简历的技能。当用户提到「JD」「职位描述」「岗位匹配」
「针对...改简历」「投递」「求职」「招聘要求」「Job Description」或者提供具体职位
链接/文本要求修改简历时使用。支持上传或粘贴 JD 文本，自动进行关键词匹配和内容优化，
基于已有简历生成针对该岗位的定制版 HTML 和 PDF。
---
```

**resume-builder/SKILL.md**：
```yaml
---
name: resume-builder
description: 通过对话式采访构建精美简历的技能。当用户提到「简历」「resume」「CV」
「求职」「找工作」「面试」「制作简历」「生成简历」或者想要创建一个展示个人经历和
技能的网页时使用。支持 HTML 简历生成、A4 纸打印布局、PDF 导出。...
---
```

**特点**：只有 `name` + `description` 两项。`description` 中列举了大量中文触发词，是好的实践。

### 3.2 行业最佳实践

**`claude-office-skills/resume-tailor`** 的增强版 frontmatter：

```yaml
# Basic Information
name: resume-tailor
description: ">"
version: "1.0.0"
author: claude-office-skills
license: MIT

# Categorization
category: hr
tags:
  - resume
  - cv
  - job-application
  - career
department: HR/Personal

# AI Model Compatibility
models:
  recommended: [claude-sonnet-4, claude-opus-4]
  compatible: [claude-3-5-sonnet, gpt-4, gpt-4o]

# MCP Tools Integration
mcp:
  server: office-mcp
  tools: [extract_text_from_pdf, extract_text_from_docx, create_docx]

# Skill Capabilities
capabilities: [resume_optimization, keyword_matching, content_tailoring]

# Language Support
languages: [en, zh]
```

### 3.3 对比结论

| 字段 | 本仓库 | 行业最佳 | 建议 |
|---|---|---|---|
| `name` | ✅ | ✅ | 保留 |
| `description` | ✅（中文触发词丰富） | ✅ | 保留 |
| `category` | ❌ | ✅ `hr` | **建议添加**（提升被分类路由的概率） |
| `tags` | ❌ | ✅ 数组 | **建议添加**（便于 `npx skills find` 检索） |
| `version` | ❌ | ✅ | 可选 |
| `capabilities` | ❌ | ✅ | 可选（增强自动触发） |
| `languages` | ❌ | ✅ | **建议添加**（明确支持 zh + en） |
| `mcp` | ❌ | ✅（声明依赖） | 暂不需要 |

---

## 4. 触发词与场景设计对比

### 4.1 description 中的触发词密度

| Skill | 中文触发词 | 英文触发词 | 场景覆盖 |
|---|---|---|---|
| **jd-tailorer（本仓库）** | JD、职位描述、岗位匹配、针对...改简历、投递、求职、招聘要求 | Job Description | 定制场景全覆盖 |
| **resume-builder（本仓库）** | 简历、求职、找工作、面试、制作简历、生成简历 | resume、CV | 生成场景全覆盖 |
| claude-office-skills/resume-tailor | 无（纯英文） | resume | 仅 1 个触发词 |
| paramchoudhary/resume-tailor | 无 | resume | 仅 1 个触发词 |

**结论**：本仓库在**触发词丰富度**上**显著优于**同类型 Skill，覆盖中英文常见说法，有助于 Agent 在自然对话中自动加载。

---

## 5. 工作流程深度对比

### 5.1 claude-office-skills/resume-tailor（2.8K）流程

```
Step 1: Share Materials (resume + JD + context)
Step 2: Analyze (key requirements, mapping, gaps)
Step 3: Get Tailored Resume (optimized version + diff + suggestions)
```

**辅助知识库**（内嵌在 SKILL.md）：
- ATS 优化 6 条 Do/Don't 对照表
- Power Verbs 分类清单（Leadership / Achievement / Technical / Communication）
- 量化公式：`[Power Verb] + [What] + [Quantified Result] + [How/Context]`
- 5 个行业（Tech / Business / Marketing / Healthcare / Finance）的 Must-Have Sections + Keywords
- 3 个示例对话（含 Career Change 重构示例）

### 5.2 paramchoudhary/resume-tailor（1.1K）流程

参考仓库 README 与 SKILL.md 风格推断：
```
Step 1: 输入 JD + 简历
Step 2: 关键词匹配 + 匹配度评分
Step 3: 给出调整建议（diff 列表）
```
**模块依赖**：常需要 `resume-ats-optimizer` 和 `resume-bullet-writer` 配合使用。

### 5.3 本仓库 jd-tailorer 流程

```
Step 1: 获取 JD（粘贴 / 上传 / 链接）
Step 2: JD 分析（核心要求 / 加分项 / 关键词 / 职责 / 公司文化）
Step 3: 简历匹配分析（匹配点 / 缺失点 / 弱化点）
Step 4: 内容定制（关键词优化 / 板块重排序 / 内容微调）
Step 5: 生成定制 HTML（沿用 resume-builder 风格）
Step 5.5: PDF 导出验证（强制单页 A4）
Step 6: 生成 matching-analysis.md 报告
```

### 5.4 流程对比矩阵

| 步骤 | claude-office | paramchoudhary | **本仓库** |
|---|---|---|---|
| JD 获取 | ❌（默认用户提供） | ❌（默认用户提供） | ✅ 支持粘贴/上传/链接三种方式 |
| JD 行业识别 | ✅ 内置 5 行业 | ❌ | ❌（可借鉴） |
| 公司文化推断 | ❌ | ❌ | ✅ |
| 关键词覆盖率阈值 | ❌ | ❌ | ✅ ≥70% |
| 板块重排序 | ✅（建议） | ✅（建议） | ✅（强制策略） |
| HTML 文件输出 | ❌ | ❌ | ✅（沿用模板风格） |
| 单页 A4 强制 | ❌ | ❌ | ✅ + PDF 验证 |
| 结构化匹配报告 | ✅（对话表格） | ✅（对话表格） | ✅ **matching-analysis.md 落盘** |
| 诚实约束（不编造） | ✅ Limitations 提及 | ❌ 无显式 | ✅ 强约束 + 缺失点如实标注 |

**亮点（本仓库独有）**：
1. **公司文化推断**：通过 JD 措辞推断"创新驱动 / 稳定可靠 / 快节奏"，调整自我评价语气。
2. **关键词覆盖率阈值**：≥70% 作为 ATS 验收硬指标。
3. **matching-analysis.md 落盘**：用户可在版本间追溯差异，而非只在对话中"看过即忘"。
4. **不编造约束**：缺失技能如实告知，而不是强行添加。

**短板（可借鉴）**：
1. **行业关键词清单**：claude-office 内置 5 行业，识别后可加载对应清单。
2. **Power Verbs / 量化公式**：应作为改写时的检查清单而非埋在 reference。
3. **示例对话**：本仓库示例偏简短，缺少 career-change / 应届生转正 等典型场景。

---

## 6. 知识库与参考文档对比

### 6.1 本仓库现有 references

```
resume-builder/references/
├── design-guidelines.md       设计美学指南
├── color-palettes.md          五大风格-配色索引
├── content-writing.md         内容写作规范（STAR / 量化 / ATS）
├── minimal-blue-business-reference.md  简约蓝色商务参考指南（已合并至 CSS 文件）
└── css/
    ├── README.md              CSS 子文件夹说明
    ├── common.md              通用紧凑排版 CSS（每次必用）
    ├── modern-minimal.md      现代简约（3 套配色）
    ├── classic-business.md    经典商务（3 套配色）
    ├── creative-bold.md       创意个性（3 套配色）
    ├── japanese-minimal.md    日式极简（3 套配色）
    └── tech-dark.md           科技感（3 套配色）
```

**优点**：分层结构清晰，CSS 与内容分离，按需加载。

### 6.2 对比

| Skill | 参考文档 | 风格设计 | 量化模板 |
|---|---|---|---|
| **本仓库** | ✅ 11 个 references（分层） | ✅ 6 套 CSS | ✅ 散落在 content-writing.md |
| claude-office | ❌ 单文件（行业/Power Verbs 嵌正文） | ❌ | ✅ 内嵌量化公式 |
| paramchoudhary | ❌ 单文件 | ❌ | ⚠️ 由 `resume-quantifier` Skill 单独处理 |

**结论**：本仓库的 references 体系**显著优于**同类。但**量化模板**应当**提升到 jd-tailorer 主流程**中显式引用。

---

## 7. 输出物形态对比

| Skill | 输出形态 | 文件落盘 | 可打印 | ATS 友好 |
|---|---|---|---|---|
| **本仓库** | **HTML + PDF（单页 A4 强制）** | ✅ 通用版 + tailored 子目录 | ✅ 内置 print | ✅ 语义化标签 + 关键词策略 |
| claude-office | Markdown 表格 + 文本 | ❌（仅对话） | ❌ | ✅ ATS 优化建议 |
| paramchoudhary | Markdown 表格 + 文本 | ❌（仅对话） | ❌ | ✅ `resume-formatter` 单独处理 |
| composiohq | 文本 | ❌ | ❌ | ⚠️ 弱 |

**本仓库核心差异化**：**唯一产出可打印 PDF 简历的 Agent Skill**。其他 Skill 全部停留在"对话文本"层面。

---

## 8. 设计哲学差异

### 8.1 claude-office-skills 的设计哲学
> "通用助手 + 通用规则"  
> 一个 Skill 服务所有行业 → 内置 5 行业清单 + ATS 通用规则 + Power Verbs。  
> **优点**：覆盖面广；**缺点**：每个行业的深度有限。

### 8.2 paramchoudhary 的设计哲学
> "微服务组合 + 全链路"  
> 20 个 Skill 各司其职 → Agent 按需加载 + 自由组合。  
> **优点**：渐进式披露最优；**缺点**：Skill 间依赖关系不显式，需要用户引导。

### 8.3 本仓库的设计哲学
> **"生成 → 定制"双层流水线 + 视觉一致性"**  
> 先通用基础简历（HTML 模板 + 6 套风格）→ 再针对 JD 生成定制版本（沿用模板）。  
> **优点**：视觉一致性 + 输出物可投递 + 强约束；**缺点**：覆盖面仅 2 个环节。

---

## 9. 可借鉴的最佳实践清单（按优先级）

### 🔴 高优先级（直接影响自动匹配率）

| # | 改造项 | 来源 | 预期收益 |
|---|---|---|---|
| 1 | 在两个 SKILL.md 的 frontmatter 添加 `category: hr` + `tags: [resume, cv, jd, ...]` + `languages: [zh, en]` | claude-office | 提升 `npx skills find resume` 检索命中率 |
| 2 | 在 jd-tailorer 第二步增加 **行业识别 + 加载对应行业关键词清单** | claude-office | 提升定制精度 |
| 3 | 把"项目描述改写"独立为 **bullet-writer.skill** 子技能 | paramchoudhary | 符合渐进式披露原则，可在 jd-tailorer 之外复用 |

### 🟡 中优先级（提升质量与可审查性）

| # | 改造项 | 来源 | 预期收益 |
|---|---|---|---|
| 4 | 把 **Power Verbs + 量化公式** 显式写入 jd-tailorer 主流程（而非埋在 reference） | claude-office | Agent 改写时直接套用 |
| 5 | `matching-analysis.md` 增加**结构化关键词矩阵**（关键词 / 出现位置 / 次数 / 覆盖状态） | claude-office | 用户审查更清晰 |
| 6 | 增加 2-3 个**典型场景示例对话**（career-change / 应届-转正-社招 / 跨行业转型） | claude-office | 提升 Agent 引导能力 |

### 🟢 低优先级（扩展覆盖面，暂不建议）

| # | 改造项 | 来源 | 预期收益 |
|---|---|---|---|
| 7 | 增加 `cover-letter.skill`（求职信生成） | paramchoudhary | 全链路覆盖，但偏离当前聚焦 |
| 8 | 增加 `interview-prep.skill`（STAR 故事） | paramchoudhary | 同上 |
| 9 | 增加 `salary-negotiation.skill`（薪资谈判） | paramchoudhary | 同上 |

> ⚠️ 7-9 项是 paramchoudhary 的覆盖面优势，但**与本仓库"双 Skill 分层 + 视觉一致性"的核心差异化定位冲突**。  
> 建议保持聚焦，**不要盲目扩展**到全链路。

---

## 10. 核心差异化总结

| 差异化点 | 本仓库 | claude-office | paramchoudhary |
|---|---|---|---|
| **唯一产出可打印 PDF 的 Agent Skill** | ✅ | ❌ | ❌ |
| **唯一强约束"单页 A4" + PDF 自动验证** | ✅ | ❌ | ❌ |
| **唯一提供 6 套视觉风格的 CSS 模板** | ✅ | ❌ | ❌ |
| **唯一显式"不编造经历"约束** | ✅ | ⚠️ 弱 | ❌ |
| **唯一落盘 matching-analysis.md（可追溯）** | ✅ | ❌ | ❌ |
| **触发词丰富度** | ✅（中英文多关键词） | ⚠️ 1 个 | ⚠️ 1 个 |
| **渐进式披露（多 Skill 微服务）** | ⚠️ 仅 2 个 | ❌ 1 个 | ✅ 20 个 |
| **全链路覆盖（求职信/面试/谈判）** | ❌ 仅 2 个 | ❌ | ✅ |

**结论**：本仓库在**"高质量、可投递、有视觉"维度**占据领先位置，但**在覆盖面和模块化粒度**上落后于 paramchoudhary。建议借鉴其元数据和 Power Verbs 写法，**保持核心差异化**，不盲目扩展到全链路。

---

## 11. 结论与下一步

### 11.1 调研结论
1. **市场已存在 6 个直接竞品**，但均停留在"对话文本"层面，无一产出可打印 PDF。
2. **本仓库的"双 Skill 分层 + 6 套 CSS + 单页 A4 强约束"是核心差异化**，值得保留并强化。
3. **元数据（category/tags/languages）和 Power Verbs/量化公式**是最容易借鉴、收益最大的两项改造。

### 11.2 推荐改造顺序
1. **第一轮**（1-2 小时）：补充 frontmatter 元数据（category/tags/languages）
2. **第二轮**（2-3 小时）：把 Power Verbs 分类 + 量化公式显式写入 jd-tailorer 主流程
3. **第三轮**（可选）：抽取 bullet-writer 子 Skill（如有精力）
4. **暂不做**：扩展到求职信/面试/谈判（与定位冲突）

### 11.3 长远建议
- 在 `skills.sh` 发布时，确保两个 Skill 的 description 互相引用（已完成："第四步提到 jd-tailorer"、"jd-tailorer 依赖 resume-builder"），强化被发现概率。
- 保持 SKILL.md 长度适中（建议 200-400 行），把细节下沉到 references，避免上下文过载。

---

## 附录：调研方法记录

```bash
# 1. 搜索 resume 相关 Skill
npx skills find resume

# 2. 搜索 job description 相关 Skill
npx skills find "job description"

# 3. 浏览 leaderboard
https://skills.sh/
```

**未安装任何外部 Skill**，所有对比基于公开 SKILL.md / README 抓取。
