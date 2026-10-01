# 渲染环境与命令路径

视觉版的 PDF、截图和布局校验依赖完整运行时；只安装技能说明不代表渲染环境已经就绪。第一次渲染前，先定位并检查运行时，后续复用，不要每次重新安装。

## 路径约定

- 文档中的 `references/...` 相对于当前 `SKILL.md`；其他技能通过 `../resume-builder/...` 读取共享资料。
- 命令中的 `skills/resume-builder/scripts/...` 是**完整仓库根目录**下的路径，不是用户私有简历目录下的路径。执行时从实际运行时根目录解析为绝对路径，HTML、PDF 和 manifest 也使用用户私有目录的绝对路径。
- 完整运行时需包含 `package.json`、`lib/resume-layout.mjs`、`requirements-test.txt` 和 `skills/resume-builder/scripts/`。如果技能安装目录没有这些文件，不能直接运行依赖 `../../../lib/` 的脚本；先复用已有完整检出，或将仓库克隆到单独的工具目录。真实简历始终留在工具仓库外。

## Windows 初始化

需要 Node.js ≥20、Python ≥3.10 和 PowerShell。以下命令在完整运行时根目录执行；使用固定依赖版本，保留初始化的错误信息：

```powershell
npm ci
python -m pip install -r requirements-test.txt
npx playwright install chromium
```

然后按实际路径运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<运行时根目录>/skills/resume-builder/scripts/render_resume.ps1" -HTML "<私有目录>/resume_visual.html" -OutputPdf "<私有目录>/resume_visual.pdf"
```

`npx ... resume-skills validate` 默认只验收编辑字段；需要额外检查排版时，在已初始化的运行时中执行 `node "<运行时根目录>/bin/resume-skills.mjs" validate "<私有目录>/resume_visual.html" --check-layout --json`。CI 的测量通过也不能替代 AI 实际打开整页截图。

## 不可验证时

缺少依赖、浏览器或可用的图像查看工具时，明确报告 PDF 渲染或视觉复核未完成，不生成“已验证”结论，不以旧 PDF、旧截图或旧 manifest 代替当前产物。可以继续保存事实和 HTML，待运行时可用后执行同一验证闭环。ATS-safe 的 HTML 静态审计使用 Python 验证脚本即可，不必为它启动 Canvas 或执行视觉密度检查。
