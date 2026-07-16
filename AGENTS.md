# AGENTS.md

本文件面向参与 `resume-skills` 开发的智能体与开发者；面向最终用户的安装和使用方式见 [README.md](README.md)。

## 项目定位

`resume-skills` 是一组以事实为边界的简历工作流技能，以及一个用于已生成 HTML 简历的本地 Canvas 排版编辑器。

- 技能负责采访、事实核验、内容写作、JD 匹配、ATS 优化和版本管理。
- `resume-skills editor <resume.html>` 只负责受限的文字与排版微调，不生成或改写简历内容。
- 简历以独立 HTML 为主输出，浏览器打印为 PDF；编辑器导出固定覆盖 `<原文件名>-edited.html`，绝不覆盖原文件。

## 关键边界

- 不编造候选人的经历、指标、技能、证书或 JD 匹配结果。
- `resume-builder` 必须先完成信息采访，再让用户选择视觉风格，最后生成简历。
- `jd-tailorer` 仅在已有简历事实和 JD 的基础上定制；JD 关键词不是候选人事实。
- Canvas 仅支持文字编辑与字号、字重、颜色、对齐、行高、段后距、页边距、主题色等排版项；不支持 AI 改写、JD 匹配、结构重排、自由拖拽或图片编辑。
- 内置模板必须带 `data-resume-editor-template` 和 `data-resume-editor-version="1"`。Canvas 为旧模板的可编辑文本补充 `data-resume-editor-id`。

## 目录说明

```text
skills/                         Agent Skills：工作流与参考资料
  resume-builder/               对话式简历生成与 6 套模板
  jd-tailorer/                  JD 定制与匹配报告
  resume-bullet-writer/         经历 bullet 诊断与改写
  job-description-analyzer/     JD 结构化分析
  resume-ats-optimizer/         ATS 可读性与关键词诊断
  resume-version-manager/       简历版本策略与维护
bin/resume-skills.mjs           npx CLI 与本地 HTTP 服务
lib/                            HTML 协议、资源路径、控件规则
public/                         Canvas 前端（editor.html、app.js、app.css）
tests/                          Node 回归测试
skills/resume-builder/tests/    模板与简历输出验证测试
```

## 开发约定

1. 改动技能工作流时，先读取对应 `SKILL.md` 和相关事实契约；保持中文、可执行、可追溯的说明。
2. 新增或修改内置模板时，保留 A4 打印布局，不能带模板自己的导出控件；为 `<html>` 添加编辑协议属性。
3. 修改编辑器行为时，先写能复现需求的 Node 测试，再改实现。不要用正则解析或重写整个 HTML 文档。
4. UI 以原生 HTML/CSS/JS 为准，无构建步骤；交互须有键盘焦点、清晰状态和 `prefers-reduced-motion` 兼容。
5. 不顺手重构无关文件；保留用户已有的未提交改动。

## 本地验证

```powershell
npm test
python -m unittest discover -s tests -p 'test_*.py'
python skills\resume-builder\tests\test_validate_resume.py
node bin\resume-skills.mjs editor skills\resume-builder\references\examples\modern-minimal.html
```

最后一条会启动本地编辑器。验证导出时确认：原 HTML 不变、导出文件固定为 `*-edited.html`、浏览器可打印为 PDF。

## 发布检查

1. 更新 `package.json` 版本与 README 的版本说明。
2. 运行上述全部测试，并用 `npm pack --dry-run` 检查发布包只包含 CLI、运行时、前端、技能文档与 README。
3. 发布 scoped npm 包时使用 `npm publish --access public`。
4. `npx skills add` 读取 GitHub 仓库中的 `skills/*/SKILL.md`；若技能本身有更新，需在确认干净的提交范围后再推送仓库。
