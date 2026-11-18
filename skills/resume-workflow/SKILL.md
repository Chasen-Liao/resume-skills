---
name: resume-workflow
description: 根据用户当前目标编排简历母版构建、JD 匹配、岗位定制或已有视觉简历的微调。适用于跨阶段任务和用户希望由 Agent 选择入口的场景。
---

# 简历工作流

先确定用户本次要得到什么，直接进入对应专业技能。多个目标按实际依赖执行；已有母版和事实库可以直接进入 JD 定制。

| 用户目标 | 入口与起点 | 本次结束条件 |
|---|---|---|
| 创建母版、从旧简历导入或更新经历 | [resume-builder](../resume-builder/SKILL.md) 导入或采访；已确认的内容复用，只追问变化与缺口 | 事实由用户确认，按要求交付母版或事实库 |
| 判断岗位是否适合 | [jd-tailorer](../jd-tailorer/SKILL.md) 对照 JD 和候选人可用证据 | 在对话说明匹配、缺口与待确认项，结束诊断 |
| 从母版生成投递版 | [jd-tailorer](../jd-tailorer/SKILL.md) 展示一次内容变更预览，确认后沿用母版版式 | 交付请求的文件，岗位记录指向实际产物 |
| 在编辑器内调整文字或排版 | [resume-canvas](../resume-canvas/SKILL.md) 打开指定视觉 HTML | 保存后重验当前版本。ATS-safe 模式不使用 Canvas |

## 贯穿各阶段的约定

- 将候选人事实和真实简历保存在项目目录外的私有工作区。事实来源、展示偏好与项目使用范围遵循[事实契约](../resume-builder/references/resume-contract.md)。
- 只加载本次入口需要的资料；仅做匹配可以在对话中完成。精简安装时可直接调用专业技能，专业技能使用同一套契约。
- PDF 交付与 Canvas 保存后的复核遵循[交付契约](../resume-builder/references/delivery-gate.md)。视觉版默认由 `render_resume.ps1` 导出并生成 manifest，ATS 成品校验同时传入源 HTML 和最终 PDF。
- 用户请求微调时才启动 Canvas。保护母版和已有岗位版本，Git 提交、推送及向招聘平台发送资料均需单独授权。
