---
name: resume-workflow
description: 编排从导入已有简历或采访开始，到母版制作、针对 JD 定制、质量审计与本地排版微调的完整简历流程。当用户想创建、更新、投递或持续维护简历，但不想自己选择多个简历 Skill 时使用。只基于用户确认的事实，不自动提交、推送或覆盖版本历史。
---

# 简历工作流 (Resume Workflow)

将 `resume-builder`（母版构建与事实确权）、`jd-tailorer`（JD分析与定向定制）、`resume-canvas`（本地可视化微调）串成一条连贯、无缝的主干工作流。

## 技能协作总览（双主阶段）

| 阶段 | 责任 Skill | 输入 | 输出 / 交付 | 协作流转与路由条件 |
|---|---|---|---|---|
| **0. 私有事实库** | `resume-workflow` | 用户已有简历或经历描述 | `resume-facts.yaml` | 初始化唯一事实源，全程不将未确认事实写回 |
| **阶段一：母版生命周期** | `resume-builder` | 事实库 / 真实经历采访 | 母版 HTML/PDF、有效 Manifest | 对话采访，就地打磨经历，选模板并完成 A4 单页验证；建议本地 Git 提交 |
| **阶段二：岗位定制生命周期** | `jd-tailorer` | 母版 + 目标 JD | 定制版 HTML/PDF、匹配报告与版本记录 | 一站式解构 JD、输出变更预览、双模生成、ATS 门禁与目录隔离；建议本地 Git 提交 |
| **可选：本地微调守卫** | `resume-canvas` | 已验证的视觉 HTML | 微调后 HTML + 重验 PDF | 仅视觉模式：母版或定制版定稿后的本地所见即所得排版微调与 Manifest 重验闭环 |

## 先读

读取 `../resume-builder/references/resume-contract.md`、`../resume-builder/references/content-writing.md`、`../resume-builder/references/resume-facts.example.yaml` 和 [交付门禁与验证契约](../resume-builder/references/delivery-gate.md)。按当前阶段再读取对应 skill 的 `SKILL.md`，不要用本文件替代其事实、排版或验证约束。

首次执行验证命令前，按 [渲染环境与命令路径](../resume-builder/references/runtime-setup.md) 定位完整运行时；所有脚本及私有产物使用实际绝对路径，不假设用户当前目录包含 `skills/` 或渲染依赖。

## 0. 建立私有工作目录

- 将用户简历保存在项目目录外的本地私有目录，例如 `<个人私有目录>/resume/`；不要使用源码仓库中的示例或模板目录保存真实个人数据。
- 在用户确认导入/采访结果后，按 `resume-facts.example.yaml` 创建 `resume-facts.yaml`。它是母版和定制版的唯一事实源；未确认字段只能保留在该文件的待确认记录或分析报告中。
- 建议将私有目录纳入**本地私有 Git 仓库**进行版本管理；不默认推送到远程公开仓库。用户明确同意后才执行提交建议，不自动执行 Git 初始化、提交、推送或覆盖。

## 阶段一：建立或维护简历母版 (`resume-builder`)

1. **触发 `resume-builder`**：
   - 用户提供已有简历时走导入路径，展示已识别内容并增量追问模糊项；无简历时走结构化采访路径；
   - 经历描述就地打磨，强动词结构，只有用户明确确认的事实写入私有 `resume-facts.yaml`。
2. **生成与交付验证**：
   - 确认事实后选择视觉模式或 ATS-safe 模式，生成母版简历；
   - 交付验证、渲染（`render_resume.ps1` 自动生成 preview.png 与 manifest）、整页截图视觉复核及本地 Git 提交建议，统一遵循 [交付门禁与验证契约](../resume-builder/references/delivery-gate.md)。
3. **阶段流转与转交条件**：
   - **转交条件**：母版 HTML/PDF 校验通过、单页与密度合规且整页截图视觉复核无误；
   - 验证通过后向用户询问是否需要本地排版微调；若需要，**路由至 `resume-canvas`**；
   - 母版定稿后，若用户需要针对具体公司或岗位投递，进入阶段二。

## 阶段二：针对岗位进行定向定制 (`jd-tailorer`)

已有母版和 `resume-facts.yaml` 后，用户输入目标公司和岗位 JD：
1. **触发 `jd-tailorer`**：
   - 解构 JD 要求，比对事实库标定匹配点与真实缺口；向用户展示变更预览并取得用户确认后才生成；
   - 产物统一输出到专用目录 `tailored/<公司名>-<岗位>/`，**绝对不覆盖母版**；同时输出 `matching-analysis.md` 与 `version-notes.md`。
2. **交付验证与质量门禁**：
   - 视觉版渲染与单页验证、ATS-safe 静态审计与文本提取验证、整页截图视觉复核及本地 Git 提交建议，统一遵循 [交付门禁与验证契约](../resume-builder/references/delivery-gate.md)。
3. **阶段流转与转交条件**：
   - **转交条件**：定制版通过交付门禁与视觉复核，完成目录隔离与版本记录；
   - 验证通过后按需提供排版微调；若需要，**路由至 `resume-canvas`**；微调保存后必须按门禁契约执行重验闭环。

## 交付验证与质量门禁

母版与定制版均强制遵循 [交付门禁与验证契约](../resume-builder/references/delivery-gate.md)，包含：
- **协议校验**：运行 `resume-skills validate` 必须输出“校验通过”；
- **渲染与布局验证**：使用 `render_resume.ps1` 一键渲染 PDF 并自动生成 preview.png 与 manifest，不要再单独调用 `validate_resume.py`；
- **整页截图视觉复核**：AI 必须实际查看完整整页截图确认留白均衡，不能仅凭自动检查通过就交付；
- **可选 Canvas 与路由**：交付前询问用户是否需要微调，需要时**路由至 `resume-canvas`**；ATS-safe 模式不启动 Canvas；
- **微调重验闭环**：Canvas 保存后 manifest 失效，必须重新核验事实并重新运行渲染与截图复核。

## 不要做

- 不把解析文本直接当成用户确认的事实；未经确认不进入最终成稿。
- 不让 JD 要求或建议新增候选人未具备的技能、指标或经历；不伪造经历。
- 不自动执行 Git 初始化、提交、推送、回滚或静默覆盖用户文件。
