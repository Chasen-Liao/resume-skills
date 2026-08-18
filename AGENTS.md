# AGENTS.md

本文件面向参与 `resume-skills` 开发的智能体与开发者；面向最终用户的安装和使用方式见 [README.md](README.md)。

## 项目定位

`resume-skills` 是一组以事实为边界的简历工作流技能，以及一个用于已生成 HTML 简历的本地 Canvas 排版编辑器。

- 技能负责采访、事实核验、内容写作、JD 匹配、ATS 优化和版本管理。
- `resume-skills editor <resume.html>` 负责已生成简历的文字与排版微调，不生成新经历；保存文字修改后必须重新确认事实并验证 PDF。
- 简历以独立 HTML 为主输出，浏览器打印为 PDF；为确保工作流中具有单一的事实来源 (Source of Truth)，Canvas 编辑器保存时将直接覆盖并固化原始 HTML 文件。

## 关键边界

- 不编造候选人的经历、指标、技能、证书或 JD 匹配结果。
- `resume-builder` 必须先完成信息采访，再让用户选择视觉风格，最后生成简历。
- `jd-tailorer` 仅在已有简历事实和 JD 的基础上定制；JD 关键词不是候选人事实。
- Canvas 支持编辑已有字段的纯文本，以及字号、字重、颜色、对齐、行高、段后距、页边距、主题色等排版项；不支持插入 HTML、AI 改写、JD 匹配、结构重排、自由拖拽或图片编辑。
- 内置模板必须带 `data-resume-editor-template`、`data-resume-editor-version="1"` 和唯一稳定的 `data-resume-editor-id`；不再依赖运行时 fallback ID。

## 目录说明

```text
skills/                         Agent Skills：工作流与参考资料
  resume-builder/               对话式简历生成与 6 套模板
  jd-tailorer/                  JD 定制与匹配报告
  resume-bullet-writer/         经历 bullet 诊断与改写
  job-description-analyzer/     JD 结构化分析
  resume-ats-optimizer/         ATS 可读性与关键词诊断
  resume-version-manager/       简历版本策略与维护
  resume-workflow/              完整流程编排（默认入口）
bin/resume-skills.mjs           npx CLI 与本地 HTTP 服务
lib/                            HTML 协议、资源路径、控件规则
public/                         Canvas 前端（editor.html、app.js、app.css）
tests/                          Node 回归测试
skills/resume-builder/tests/    模板与简历输出验证测试
docs/                           GitHub Pages 教程；`docs/**` 推送到 main 后触发部署
```

## 开发约定

1. 改动技能工作流时，先读取对应 `SKILL.md` 和相关事实契约；保持中文、可执行、可追溯的说明。
2. 新增或修改内置模板时，保留 A4 打印布局，不能带模板自己的导出控件；为 `<html>` 添加编辑协议属性。
3. 修改编辑器行为时，先写能复现需求的 Node 测试，再改实现。资源请求从 URL 映射到文件路径时，先解码 pathname、再执行目录边界检查；覆盖中文等编码路径与编码穿越路径。不要用正则解析或重写整个 HTML 文档。
4. UI 以原生 HTML/CSS/JS 为准，无构建步骤；交互须有键盘焦点、清晰状态和 `prefers-reduced-motion` 兼容。
5. 不顺手重构无关文件；保留用户已有的未提交改动。

## 本地验证

```powershell
npm test
npm run test:integration
npm pack --dry-run --json
node bin\resume-skills.mjs editor skills\resume-builder\references\examples\modern-minimal.html --no-open
```

最后一条会启动本地编辑器。验证保存时确认：文字和排版会原子写回 HTML，并使关联 manifest 失效；正式交付前需重新确认事实并验证 PDF。

## 发布检查

1. 更新 `package.json` 版本、README 和 `CHANGELOG.md`。
2. 运行上述全部测试、`npm run test:integration`，并用 `npm pack --dry-run --json` 检查发布包包含 `requirements-test.txt` 且不包含 `__pycache__`/`.pyc`。
3. 发布 scoped npm 包时使用 `npm publish --access public`。
4. `npx skills add` 读取 GitHub 仓库中的 `skills/*/SKILL.md`；若技能本身有更新，需在确认干净的提交范围后再推送仓库。
