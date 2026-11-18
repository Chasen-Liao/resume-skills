---
name: jd-tailorer
description: 分析 JD 要求和候选人匹配度，或根据已确认事实从母版生成独立的岗位定制简历。用户问“我是否适合”时直接交付诊断；要求针对岗位改简历或生成投递 PDF 时走定制流程。
---

# JD 匹配与岗位定制

## 分析岗位

读取[事实契约](../resume-builder/references/resume-contract.md)和[匹配规则](references/matching-analysis.md)，取得 JD 原文与来源。共享参考路径相对于本技能目录。`jd-tailorer` 与 `resume-builder` 一起安装即可直接使用。

1. 从 JD 提取硬门槛、加分项、职责与工作场景，保留能定位要求的原文。
2. 用私有 `resume-facts.yaml` 中已确认且适用的证据逐项比对，区分直接匹配、相关证据、缺口与待确认。仅因材料未提及而无法判断的，列为待确认。只有旧简历时，可先用 builder 增量确认要用到的事实；只有 JD 时可解读岗位，给出判断个人匹配所缺的材料。
3. 用户只问适合度时，在对话给出判断、关键证据与缺口，在此结束。仅在用户要留档时将详细报告保存为 `matching-analysis.md`。

## 从母版定制

1. 读取[写作规范](../resume-builder/references/content-writing.md)。按事实库的展示偏好、排除项与项目范围筛选内容，把本次经历重排、措辞对齐及保留缺口合并成一份对话变更预览。用户确认后生成；同一批内容沿用此次确认，新增或变更事实另行核实。
2. 默认继承母版的输出模式与样式。用户要换风格时读取对应设计资料；要求 ATS-safe 时使用标准标题、单栏可复制正文。沿用视觉模板时保留稳定的编辑字段和打印布局。
3. 产物保存到 `tailored/<公司名>-<岗位>/`，绝对不覆盖母版。优先沿用用户已有命名与导出方式；没有约定时使用 `resume_visual` 或 `resume_ats` 作为 HTML/PDF 的文件名前缀。先确定实际交付路径，同岗位已有历史文件时使用其版本约定或另存新版本。
4. 根据本次交付物执行[交付契约](../resume-builder/references/delivery-gate.md)。只要 HTML 草稿时报告静态检查范围。ATS 成品检查必须对同次导出的实际文件运行：

   ```bash
   python skills/resume-builder/scripts/validate_resume.py --mode ats --html "<源 HTML>" --pdf "<最终 PDF>"
   ```

   首次用脚本时按[运行时说明](../resume-builder/references/runtime-setup.md)定位绝对路径。视觉 PDF 另需核对布局、manifest 与实际整页预览，重点看删减内容后的分栏和底部留白。ATS-safe 模式不使用 Canvas；视觉版仅在用户要微调时进入 `resume-canvas`。
5. 将版本与投递记录合并到岗位目录的 `version-notes.md`，写明母版、JD 来源和日期、变更摘要、关键词依据、保留缺口、实际文件和验证结果。用户需要单独的详细报告或变更预览文档时再生成。实际提交后才登记为已投递。

用户使用本地私有 Git 仓库时可采用提交说明 `定制：<公司名> - <岗位>`。不自动执行 Git 初始化、提交、推送或覆盖。
