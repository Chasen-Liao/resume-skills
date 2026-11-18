---
name: resume-builder
description: 从旧简历导入或通过采访创建、更新简历母版与私有事实库，按已确认事实生成视觉 A4 或 ATS-safe 简历。适用于制作基础简历、更新经历、打磨简历条目和选择母版风格。
---

# 母版简历构建

## 1. 确认候选人事实

先读[事实契约](references/resume-contract.md)。有私有事实库时复用已确认记录，优先追问本次变化；只有旧简历时提取候选陈述，展示模糊、缺失与疑似过期项，做增量确认。从零创建时按个人信息、教育、实习、项目、技能及其他相关经历分批采访。

追问实际角色、行动、交付物与证据。可核实的数字能补充结果；缺数字时保留能验证的定性描述。写作时读取[内容写作规范](references/content-writing.md)。按[示例结构](references/resume-facts.example.yaml)在项目目录外维护私有 `resume-facts.yaml`，分开保存已确认和待确认记录，并保留展示限制。用户只要求更新事实库时，此步完成即可交付。

## 2. 确定模式与版式

事实确认后再选视觉 A4 或 ATS-safe。更新母版时沿用已有选择；首次生成或用户想换风格时再选择。ATS-safe 使用单栏、标准板块标题、普通可复制文本和稳定的正文顺序。沿用视觉母版时保留已有样式；新建或更换视觉模板时读取[设计系统](references/design-system.md)、[通用排版](references/css/common.md)和所选模板的一组参照。

| 风格 | CSS 与 HTML 参照 |
|---|---|
| 现代简约 | [CSS](references/css/modern-minimal.md) · [示例](references/examples/modern-minimal.html) |
| 经典商务 | [CSS](references/css/classic-business.md) · [示例](references/examples/classic-business.html) |
| 创意个性 | [CSS](references/css/creative-bold.md) · [示例](references/examples/creative-bold.html) |
| 日式极简 | [CSS](references/css/japanese-minimal.md) · [示例](references/examples/japanese-minimal.html) |
| 科技感 | [CSS](references/css/tech-dark.md) · [示例](references/examples/tech-dark.html) |
| 简约蓝色商务 | [CSS](references/css/minimal-blue-business.md) · [示例](references/examples/minimal-blue-business.html) |

## 3. 生成用户需要的文件

从允许在当前场景展示的事实生成独立 HTML，内嵌 CSS。遵循用户已有命名；无约定时采用 `<姓名>_<岗位>_visual.html` 或 `<姓名>_<岗位>_ats.html`。PDF 直接导出到最终交付路径。

- 内置视觉模板保留 `data-resume-layout="full-page"`、`data-resume-editor-template` 和 `data-resume-editor-version="1"`，按通用排版保留可伸缩密度参数。为每个独立文本字段提供稳定且唯一的 `data-resume-editor-id`。禁止把 ID 放在页面或板块容器上。模板内不嵌入导出按钮。
- 只在用户同意展示时使用头像。需独立单文件时将图片作为 data URL 内嵌；保留相对路径时交付对应资源。网页字体需提供系统字体回退。
- ATS-safe 使用纯文本联系方式、正文、技能列表与标准标题，事实范围与视觉版一致。

## 4. 验证与交付

首次执行命令时读取[运行时说明](references/runtime-setup.md)。按[交付契约](references/delivery-gate.md)区分 HTML 草稿与最终 PDF。视觉成品需通过编辑协议、布局及 PDF 检查，实际打开整页预览后交付。ATS 成品用同一版本的实际路径执行：

```bash
python skills/resume-builder/scripts/validate_resume.py --mode ats --html "<源 HTML>" --pdf "<最终 PDF>"
```

报告实际交付路径与检查范围。ATS-safe 模式不使用 Canvas。用户要求微调视觉 HTML 时进入 `resume-canvas`；要求评估或定制具体岗位时进入 `jd-tailorer`。
