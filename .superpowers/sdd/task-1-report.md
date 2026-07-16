# Task 1 验证报告

日期：2026-07-15

## 改动文件

- `D:\MyProjects\resume-skills\skills\resume-builder\references\resume-contract.md`
  - 新建 `resume-builder` 与 `jd-tailorer` 共用的简历事实契约。
  - 覆盖 `profile`、`education`、`experience`、`projects`、`skills`、`awards`、`summary`。
  - 定义每条 claim 的 `source`、`confidence`、`evidence`、`metric_status`，以及只基于已知事实改写的边界。
- `D:\MyProjects\resume-skills\skills\resume-builder\references\content-writing.md`
  - 改为证据优先写作：优先追问指标，无可信数字时使用已确认的规模/范围/时间/质量/角色/交付物证据。
  - 移除每条必须有数字、固定 STAR、自我评价固定字数和无来源市场统计等规则。
  - 补充 ATS 两种输出模式、关键词来源、中文/英文隐私字段与头像默认策略，以及投递前检查清单。

未修改 HTML 模板或其他仓库文件；未 commit、未 push。

## 验证命令与输出

### 两个 skill 的 quick_validate

命令（UTF-8 环境）：

```powershell
$env:PYTHONUTF8='1'
$validator='C:\Users\Chasen\.codex\skills\.system\skill-creator\scripts\quick_validate.py'
python $validator 'skills\resume-builder'
python $validator 'skills\jd-tailorer'
```

输出：

```text
---resume-builder---
Skill is valid!
exit=0
---jd-tailorer---
Skill is valid!
exit=0
```

最终复验在补充入口与契约检查清单后再次通过：两个 skill 均 `Skill is valid!`、`exit=0`；入口旧硬约束扫描无匹配，4 个目标文件路径均存在。

### 文档静态检查

检查了契约板块和元数据字段、中文/英文隐私策略、头像、关键词来源、ATS-safe 与输出模式；同时扫描已移除的统计和旧强制规则。

输出：

```text
contract chars=2450 missing= banned_matches=0
content-writing chars=3952 missing= banned_matches=0
static checks passed
```

并执行：

```powershell
git diff --check -- skills\resume-builder\references\content-writing.md
```

无 diff 格式错误。

## 未解决风险

- `skills\resume-builder\SKILL.md` 和 `skills\jd-tailorer\SKILL.md` 仍保留旧的“每条经历必须有数字”“自我评价固定 80 字”等主文件约束。本任务限定只能修改两份参考文档，因此未越界修改；后续集成任务需要统一主文件与共享契约的优先级。
- 仓库没有发现专用的项目级 `quick_validate`；本报告使用可用的通用 skill `quick_validate.py` 完成两个 skill 的 frontmatter 验证。

## Task 1 review-fix 验证追加

日期：2026-07-15

本轮已修复审查中的 Important/M-2 问题，并同步处理入口衔接：

- 两个入口删除/改写了每条经历必须有数字、固定自我评价字数/句数、固定技能数量和关键词覆盖率等机械硬约束。
- 两个入口明确在收集、JD 分析、匹配或改写前先读取并遵循 `resume-contract.md` 与 `content-writing.md`。
- 契约新增 `campus` section，补充校园经历允许字段、claim 枚举示例和投递前检查范围。
- 两个入口明确视觉 HTML/PDF 与 ATS-safe HTML/PDF 的模式选择、命名和分支验证路径；明确仓库当前不生成 DOCX。
- 待确认字段限定在采集记录/分析报告中，禁止进入最终 HTML/PDF 简历成稿。

### UTF-8 quick_validate

命令：

```powershell
$env:PYTHONUTF8='1'
$validator='C:\Users\Chasen\.codex\skills\.system\skill-creator\scripts\quick_validate.py'
python -X utf8 $validator 'skills\resume-builder'
python -X utf8 $validator 'skills\jd-tailorer'
```

输出：

```text
---resume-builder---
Skill is valid!
exit=0
---jd-tailorer---
Skill is valid!
exit=0
```
