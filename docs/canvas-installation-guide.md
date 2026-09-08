# Canvas 可选安装问题记录与改进方案

> 记录日期：2026-09-08  
> 参与者：Daisy、Chasen  
> 目的：记录 Canvas 安装体验问题，并作为后续版本修改 Skills、README 和交付流程的依据。

## 一句话结论

**安装 Resume Skills 与安装/使用本地 Canvas 必须明确拆开。**

用户可以先只安装 Skills、试用采访和简历生成流程；只有需要对视觉版简历做文字或排版微调时，才按需运行或安装 npm 包。Canvas 不应成为使用 Skills 或生成 HTML/PDF 的强制前置条件。

## 讨论中确认的问题

1. 目前容易让用户误以为安装 Skills 就会同时安装 Canvas。
2. “不安装 Canvas”与“不能使用 Canvas”被混成了一个问题，实际上两者应当是用户可选择的使用路径。
3. 有些用户只是想先试用 Skill，不应该因为暂时没有 Canvas 环境而被阻塞。
4. 有些用户会把安装任务交给 Codex、Claude Code 等 Agent；Agent 需要能识别环境问题，并给出可执行的补配置步骤，而不是反复重试或声称安装成功。
5. 当前流程中存在“生成视觉版后必须启动 Canvas”的表述，这会把可选功能错误地变成强制步骤。
6. 不能承诺 Canvas 在“所有环境中一定安装成功”；应提供 Node、网络、权限、代理证书和 shell 等问题的诊断路径。

## 先澄清三个概念

| 概念 | 实际含义 | 是否必须 |
| --- | --- | --- |
| `npx skills add Chasen-Liao/resume-skills` | 安装 Agent Skills 文件 | 使用 Skills 的入口；不安装 npm Canvas 包 |
| `npx -p @chasen-liao/resume-skills@latest resume-skills editor ...` | 按需下载并运行 npm 包中的 CLI | 只有需要打开 Canvas 时才需要 |
| `npm install --global @chasen-liao/resume-skills` | 将 npm CLI 固定安装到全局 | 可选；不是 Skills 的前置条件 |

当前 npm 包的 CLI 要求 Node.js `>=20`，运行时依赖是 `parse5`，不依赖原生 `canvas` npm 模块。因此安装失败不能笼统描述为“Canvas 没装好”，应根据实际错误诊断。

## 应提供给用户的三条路径

### 路径 A：只安装 Skills，暂时不使用 Canvas

适合先试用工作流的用户：

```bash
npx skills add Chasen-Liao/resume-skills
```

这条路径可以使用采访、事实核验、JD 分析、简历生成和 ATS 检查。生成视觉 HTML/PDF 后，不启动 Canvas；如果当前环境具备浏览器渲染能力，仍可完成 PDF 验证。需要微调时再转到路径 B 或 C。

### 路径 B：需要时按需运行 Canvas（推荐）

先检查环境：

```bash
node --version   # 需要 v20 或更高
npm --version
npx --version
```

然后运行：

```bash
npx -p @chasen-liao/resume-skills@latest resume-skills editor "<resume_visual.html路径>"
```

`npx -p` 是按需获取并运行，不等同于全局安装。它不需要用户先执行 `npm install`，但首次运行仍需要网络访问 npm registry。

### 路径 C：固定安装 npm CLI

适合经常使用 Canvas 的用户：

```bash
npm install --global @chasen-liao/resume-skills
resume-skills editor "<resume_visual.html路径>"
```

全局安装遇到权限问题时，不应默认要求用户使用管理员权限；优先改用路径 B，或配置 npm 用户级安装目录。

## Agent 的正确交付流程

1. 先完成事实确认、HTML 生成和 PDF 验证。
2. 对视觉版询问用户是否需要打开 Canvas：
   - 用户选择“不需要”：交付 HTML/PDF，并说明之后可按需启用 Canvas。
   - 用户选择“需要”：再检查 Node/npm/npx，并执行路径 B；用户明确要求长期安装时才建议路径 C。
3. 用户未选择或当前环境不支持时，不自动反复安装、不声称已启动；报告实际状态并给出完整手动命令。
4. Canvas 保存文字或排版后，必须重新确认文字事实并重新渲染、验证 PDF；旧 manifest 失效后不能直接交付。
5. ATS-safe HTML 不使用 Canvas，直接按 ATS 流程检查和打印/渲染 PDF。

## 安装失败的处理顺序

不要让 Agent 无限重试，也不要把环境问题伪装成“安装成功”。

| 现象 | 先检查 | 给用户的下一步 |
| --- | --- | --- |
| `node`、`npm` 或 `npx` 不存在，或 Node 版本低于 20 | `node --version`、`npm --version` | 先安装/升级 Node.js 20+，重新打开终端，再执行 Canvas 命令 |
| `EACCES`、权限不足、无法写入全局目录 | 是否使用了全局安装 | 改用路径 B，或配置 npm 用户级 prefix；不要默认使用管理员权限 |
| `EAI_AGAIN`、超时、registry 无法访问 | `npm config get registry`、网络和代理 | 配置可访问 npm registry 的网络/代理后再重试；不要盲目循环重试 |
| `SELF_SIGNED_CERT`、证书链错误 | 企业代理和 CA 证书 | 配置企业 CA/代理证书；不要为了安装关闭 TLS 校验 |
| Git Bash 中无输出或命令被 shim 影响 | 当前 shell 和退出码 | 使用显式 `npx -p ... resume-skills ...` 形式，或改用 PowerShell/系统终端，并记录 stderr 与退出码 |
| `validate` 通过但 `editor` 无法启动 | 端口、loopback 地址、浏览器和 HTML 协议 | 先运行 `validate`；必要时使用 `--no-open`，再手动打开终端输出的本机 URL |
| HTML 不是受支持的视觉模板 | `data-resume-editor-template`、版本和字段 ID | 回到 Agent 生成受支持的视觉版，或直接用浏览器打开 HTML；不要强行让 Canvas 解析 ATS-safe/普通模板 |

如果用户暂时不需要 Canvas，直接回到路径 A；Canvas 失败不应阻塞 Skills 的其他功能。

## 需要同步修改的项目文件

1. `README.md`
   - 保留“安装 Skills”和“npm Canvas CLI”两个独立小节。
   - 把视觉版交付中的“必须启动 Canvas”改成“询问用户是否需要；选择需要时再启动”。
   - 明确列出路径 A、B、C，以及 Node.js `>=20` 前置条件。
2. `skills/resume-builder/SKILL.md`
   - 视觉版生成和 PDF 验证不依赖 Canvas。
   - 将 Canvas 改为用户选择后的可选预览步骤。
3. `skills/resume-workflow/SKILL.md` 与 `skills/jd-tailorer/SKILL.md`
   - 同步移除“必须启动 Canvas”的强制语义。
   - 保留 `validate`、保存后重新渲染和事实复核等安全门槛。
4. `docs/canvas-editor-guide.md` 与 `docs/tutorial.md`
   - 在命令前说明这是“需要 Canvas 时”的操作，而不是所有用户的必做步骤。
5. 增加回归检查：搜索上述文件时，不应再出现“视觉版完成后必须启动 Canvas”这类强制表述。

## 不建议的修改

- 不需要增加 `--with-canvas` / `--without-canvas` CLI 开关：`editor` 子命令本身就是用户主动选择 Canvas 的入口；增加开关会把“是否运行”与“是否安装”再次混在一起。
- 不要在 `npx skills add` 的安装脚本中自动安装 npm 包。
- 不要把 Node.js、网络代理或企业证书问题包装成项目“保证适配所有环境”。
- 不要为了兼容任意 HTML 而放宽编辑协议或绕过 `validate`。

## 完成标准

- 新用户只执行 `npx skills add ...` 时，可以正常使用 Skills，不会被 Canvas 阻塞。
- 需要 Canvas 的用户能看到按需运行和全局安装两种清晰方案。
- Node/npm/npx 缺失、版本过低、权限、网络和证书错误都有具体的手动处理建议。
- Agent 不会在未询问用户时自动启动 Canvas，也不会声称未成功的安装已经完成。
- Canvas 保存后的事实复核、PDF 重渲染、manifest 失效和重新验证规则保持不变。
