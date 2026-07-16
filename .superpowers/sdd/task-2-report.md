# Task 2 实现报告

## 改动文件

- `skills/resume-builder/scripts/validate_resume.py`
- `skills/resume-builder/scripts/render_resume.ps1`
- `skills/resume-builder/tests/test_validate_resume.py`
- `skills/resume-builder/tests/fixtures/good_ats.html`
- `skills/resume-builder/tests/fixtures/bad_ats.html`
- `skills/resume-builder/tests/fixtures/visual_warn.html`

未修改 `SKILL.md`、README、references 或 HTML 示例。未提交、未推送。

## TDD 验证

RED：

```text
python -m unittest discover -s skills/resume-builder/tests -p 'test_*.py' -v
Ran 7 tests ...
FAILED (failures=6, errors=1)
```

失败原因是 `validate_resume.py` 尚不存在，测试没有被错误实现或既有代码意外满足。

GREEN：

```text
python -m unittest discover -s skills/resume-builder/tests -p 'test_*.py' -v
Ran 8 tests in 7.961s
OK
```

另外验证了：

```text
python -m py_compile skills/resume-builder/scripts/validate_resume.py
PY_COMPILE=0

PowerShell AST parse: PS_PARSE=0
```

## 使用示例

```powershell
python skills/resume-builder/scripts/validate_resume.py `
  --html .\resume.html --mode ats `
  --required-text "Chasen Zhang" "Experience" --json

python skills/resume-builder/scripts/validate_resume.py `
  --html .\resume.html --mode visual --check-overflow

.\skills\resume-builder\scripts\render_resume.ps1 `
  -HTML .\resume.html -OutputPdf .\out\resume.pdf

python skills/resume-builder/scripts/validate_resume.py `
  --pdf .\out\resume.pdf --required-text "Chasen Zhang" --json
```

验证器以 `fail` 退出码 1，以 `pass` 或仅有 `warn` 退出码 0；`--json` 输出 `ok`、逐项状态和统计摘要。

## 已知限制

- `pypdf` 是可选依赖；未安装时使用标准库对页对象和常见 PDF literal text 做有限回退解析。复杂压缩/编码 PDF 应安装 `pypdf` 后验证。
- `--check-overflow` 当前没有声明的浏览器布局测量依赖，因此明确输出 WARN，不把未测量结果当作通过。
- 本机 `npx --no-install playwright pdf --help` 仅提供 `--paper-format A4`，没有 `--print-background` 或 `--prefer-css-page-size`。PowerShell 封装显式使用 `--paper-format A4`，并对缺失的两个能力输出 WARN，而不传入当前 CLI 不支持的参数。
