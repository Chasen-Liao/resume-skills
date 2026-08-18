# Research: Issue #4 外部事实支撑（npm/npx · 端口约定 · 越界资源 · Git Bash 后台 stdout）

> 面向 resume-skills（@chasen-liao/resume-skills v0.5.5）Issue #4 的三个附带问题。
> 本文件为父代理修复 Issue #4 时的外部事实底稿，结论可直接引用，但请先复核 §6 的命令。

## 0. 本会话检索能力声明（先读）

本 runtime **未提供 web_search / 网络抓取工具**（仅有 read/write/contact_supervisor），npm 官方文档在本机尝试路径全部 ENOENT：

- `C:\Program Files\nodejs\node_modules\npm\docs\content\commands\npm-exec.md` ❌
- `C:\Program Files\nodejs\node_modules\npm\package.json` ❌
- `C:\Users\Chasen\AppData\Roaming\npm\node_modules\npm\docs\...` ❌

因此证据分三级标注：

- **[本机已验证]** — 读到了本项目文件（有具体行号/路径）。
- **[记忆引用·未联网复核]** — 稳定官方 URL（来自训练知识），地址正确但本会话无法在线确认内容；引用前请执行 §6 复核命令。
- **[推断]** — 没有可靠来源可引，属假设，需父代理复现确认。

按任务要求："若检索不到可靠来源，明确说'未找到可靠来源'并给出你的推断假设" —— 第 4 题即为此类，未硬编 URL。

---

## 1. npm/npx 语义：为何裸 `npx <pkg>` 失败而 `npx -p <pkg> <bin>` 正常

### 结论

1. **`npx` 是 `npm exec` 的别名（npm v7.0 起重写）**，语法 `npm exec [-- <args>]` / `npx [-- <args>]`。[记忆引用·未联网复核] https://docs.npmjs.com/cli/v10/commands/npm-exec ；https://docs.npmjs.com/cli/v10/commands/npx
2. **单参数 `npx <pkg>` 时，第一个 token 被同时当"命令名"和"包 spec"解析**：先查 `$PATH`/本地 `node_modules/.bin` 有无同名命令，没有才当作包安装，然后执行包内"与命令名匹配"的 bin。[记忆引用·未联网复核] npm-exec 文档 Description/Examples 段；独立 npx 时代的 README：https://github.com/zkat/npx（"If the command is not found, it will be installed and executed"）。
3. **bin 名与包名不一致、或包有多个 bin 时，必须显式 `--package=<pkg>` 并写出 bin 名。** npm-exec 官方示例即此场景：`npm exec --yes --package=@npmcli/git which-git`（包名 `@npmcli/git`，bin 名 `which-git`）。[记忆引用·未联网复核] https://docs.npmjs.com/cli/v10/commands/npm-exec（Examples 段）
4. **本项目现场（[本机已验证] `D:\MyProjects\resume-skills\package.json`）**：`name: @chasen-liao/resume-skills`，`bin: { "resume-skills": "bin/resume-skills.mjs" }` —— 包名 basename = `resume-skills` = **唯一 bin 名**。按第 3 条文档逻辑，裸 `npx @chasen-liao/resume-skills`（无位置参数时）或 `npx @chasen-liao/resume-skills editor <html>`（带参数转发）**应当可以执行**，不能仅用"bin 与包名不一致"解释本次"无声失败"。

### 对"无声失败"的推断（[推断]，需复现确认）

按可能性排序：

1. **Git Bash shim 链**：Git Bash 下 `npx` 优先命中 POSIX sh 脚本（非 `npx.cmd`）；`editor <html>` 参数里的路径（`C:/...` 或 `/c/...` 混用、含空格）经 shim 传递后解析失败，且错误被 shell 吞掉 → 表现为"无声"。
2. **PATH 中先命中同名旧全局 bin**：若全局已有同名 `resume-skills` 命令，npx 会直接跑本地命令而不是包内 bin（第 2 条优先级规则）。
3. **npm 版本差异**：npm < 7 的旧 npx 与 npm ≥ 7 的 `npm exec` 参数解析不同；Node 24 自带 npm 11，但用户环境未必。
4. **Windows 下 npx cache 并发/权限错误被吞**（少见）。

### 对实现的意义

- README/`--help` 同时给两种等价用法，并**推荐显式形式**：`npx -p @chasen-liao/resume-skills resume-skills editor <html>`（无歧义、与 shell 无关）。
- bin 入口的 catch 分支（`bin/resume-skills.mjs` 末尾 `console.error` + `process.exitCode = 1`）已保证非零退出码；若 Issue 复现"无任何输出"，怀疑点在 shim 层而非本 CLI。

---

## 2. 本地开发服务器端口约定：固定 vs 随机，"端口文件"模式

### 结论

1. **社区惯例是"有默认固定端口 + 占用自动递增"，少数支持 `0` = 随机**：
   - Vite dev 默认 `5173`、`preview` 默认 `4173`；`server.port: 0` → 随机空闲端口并打印 `Local: http://localhost:<port>/`；`server.strictPort: true` → 占用时报错而非换端口。[记忆引用·未联网复核] https://vitejs.dev/config/server-options.html 、https://vitejs.dev/config/preview-options.html
   - esbuild `--serve` 默认 `8000`，`--serve=0` 随机。[记忆引用·未联网复核] https://esbuild.github.io/api/#serve
   - Python `http.server` 默认 `8000`。[记忆引用·未联网复核] https://docs.python.org/3/library/http.server.html
   - Jupyter Notebook 默认 `8888`。[记忆引用·未联网复核] https://jupyter-notebook.readthedocs.io/en/stable/public_server.html
2. **Node 官方语义：`server.listen(0)` 由 OS 分配临时端口**，天然不可能与既有 127.0.0.1 服务冲突 —— 这是"避免冲突"的最强形式。[记忆引用·未联网复核] https://nodejs.org/api/net.html（server.listen 段，端口 0 说明）
3. **"端口文件（port file）"真实使用案例**（写文件而非打印 stdout，供其他进程读取）：
   - Jupyter：在 runtime 目录写 `nbserver-<pid>.json` 连接文件（含端口、token），客户端据此连接。[记忆引用·未联网复核] https://jupyter-client.readthedocs.io/en/stable/kernels.html（connection file 段）
   - PostgreSQL：数据目录写 `postmaster.pid`，内含监听端口。[记忆引用·未联网复核] 概念见 PostgreSQL 文档 server 启动部分（URL 未复核，不作精确引用）
   - Chromium 远程调试：用户数据目录写 `DevToolsActivePort`。[推断]（模式知名但无稳定官方 URL 可引）
4. **固定端口防冲突最佳实践**：先试目标端口，`EADDRINUSE` 时"递增重试 / 报错（strictPort 语义）"；npm 包 `get-port` 实现"preferred port → 失败回退随机"。[记忆引用·未联网复核] https://www.npmjs.com/package/get-port

### 本项目现状（[本机已验证]）

- `D:\MyProjects\resume-skills\bin\resume-skills.mjs`：`--port` 默认 **0（随机）**，`server.listen(port, host)` 回调里从 `server.address().port` 取实际端口，`--json` 时输出 `{"event":"server_started","url","port",...}` —— **只写 stdout，不写文件**。

### 对实现的意义

当前"默认随机端口"已属最稳方案（零冲突）；若需支撑"后台启动后由其他进程/脚本读取 URL"，补一个 **`--write-port-file <path>`（jupyter 式端口文件）** 即可，不必改默认端口语义；若用户要求固定端口，建议 strictPort 式显式报错，不要静默换端口。

---

## 3. 本地 HTML 预览中跨目录静态资源（`../../../xxx/photo.jpg`）的处理模式

### 结论：三种真实存在的主流模式，本项目取第 1 种

1. **错误提示（404/403 + 明确文案）** —— 服务根目录固定，越界即报错：
   - VS Code Live Server 只服务打开的 workspace 文件夹，之外的相对路径 → 404。[记忆引用·未联网复核] https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer
   - Python `python -m http.server` 只服务 cwd，越界 404。[记忆引用·未联网复核] https://docs.python.org/3/library/http.server.html
2. **资源复制跟随（asset copy/adjacent）** —— 静态站点生成器把源目录静态文件复制进输出目录（site_dir），相对路径关系被复刻：mkdocs 将 `docs_dir` 中除 markdown 外的文件原样复制到 `site_dir`。[记忆引用·未联网复核] https://www.mkdocs.org/user-guide/configuration/ （docs_dir/site_dir 段）
3. **base 改写 / 内嵌** —— 生成"自包含 HTML"：pandoc `--embed-resources`/`--self-contained` 把图片等资源转为 data URI 内嵌进 HTML。[记忆引用·未联网复核] https://pandoc.org/MANUAL.html#option--embed-resources

### 本项目现状（[本机已验证]）

- `D:\MyProjects\resume-skills\lib\source-asset.mjs`：`resolveSourceAsset()` 先 `decodeURIComponent(pathname)`，再做**目录边界检查**（字符串前缀 + `realpathSync` 二次校验），越界 throw。
- `D:\MyProjects\resume-skills\bin\resume-skills.mjs`（GET 兜底分支）：越界 → `403 "Asset is outside the resume directory"`，不存在 → 404。**已实现"错误提示"模式且是防目录穿越的安全边界**（AGENTS.md 亦要求编码路径与边界检查）。

### 对实现的意义

建议维持"错误提示"为主，可选加 `--asset-root <dir>`（显式追加可访问的资产目录，如 `../assets`），**不建议采用"复制跟随"**——复制会与源 HTML 产生双份资源、违背项目"单一事实来源"边界；data URI 内嵌则会让保存回写体积失控。

---

## 4. Windows Git Bash + Node：后台 `&` 启动时 stdout 丢失

### 结论（诚实声明：**未找到本会话可复核的可靠来源**，以下为推断 + 公认缓解）

**机制（[推断]）**：Git Bash 的终端（mintty）没有 Windows 控制台句柄；`node server.js &` 启动的后台进程其 stdout/stderr 接到父 shell 的管道，当交互 shell 退出或作业控制回收时管道读端关闭 → Node 写入触发 `EPIPE`/被丢弃，进程"活着但没有输出"；SSH 非交互场景还会叠加 SIGHUP 杀进程。该现象在 Git for Windows / msys2 runtime 的 issue 区多次出现（本会话无网络工具，无法给出具体 issue URL，**未找到可靠来源**）。Node 侧相关文档：stdout 为管道被关闭时报 `EPIPE`。[记忆引用·未联网复核] https://nodejs.org/api/process.html （退出/事件、stdout 段）

**常用规避（建议写入本项目文档/脚本）**：

1. 重定向：`node bin/resume-skills.mjs editor x.html > server.log 2>&1 &` —— 最稳，日志可回溯。
2. `nohup`/`setsid` 解绑会话；Windows 原生可 `cmd //c start /b ...`。
3. **写文件代替 stdout**：项目已有 `--json`（[本机已验证] `bin/resume-skills.mjs` 的 `--json` 输出路径在 stdout），把它扩展为"同时写端口文件"即可让宿主脚本轮询就绪（jupyter `nbserver-*.json` 同款模式，见第 2 题）。

**对实现的意义**：把 `server_started` 的 `port/url` 落盘（`--write-port-file`），是"Git Bash 后台启动拿不到 URL"的系统性解法，与第 2 题结论合并成同一个实现点。

---

## 5. 仍不确定、建议问用户（澄清候选）

1. 复现环境：裸 `npx @chasen-liao/resume-skills editor ...` 失败时，用的是 **Git Bash / cmd / PowerShell**？`npm -v` 多少？失败时**有无任何 stderr、退出码是多少**（用 `; echo $?` 或 `echo %errorlevel%` 验证）？—— 决定第 1 题假设的取舍。
2. 端口语义偏好：保持"默认随机端口 0"（零冲突）即可，还是希望"默认固定端口（如 5173）+ strictPort 报错"或"固定尝试 + EADDRINUSE 自动换"？
3. 是否需要 `--write-port-file <path>`（jupyter 式端口文件）？若是，路径/格式偏好（如 `.resume-skills/port.json`）？
4. 越界资源（`../../../` 指向简历目录外）：接受当前 403 + 语义化错误文案，还是要支持 `--asset-root` 额外目录？（不建议复制跟随/内嵌，理由见第 3 题）
5. 启动时的版本检查（`fetchLatestVersion`，[本机已验证] 在 `bin/resume-skills.mjs` 的 listen 回调中执行）在离线/CI 环境是否可接受？要不要把 `--no-update-check`（现有 env `RESUME_SKILLS_NO_UPDATE_CHECK`）暴露为正式 flag？
6. Git Bash 工作流中用户期望的启动形态：手动前台（看 URL）为主，还是"后台 + 端口文件 + 脚本轮询"为主？

## 6. 复核命令清单（父代理引用本文件前执行）

```powershell
# npm 官方文档（Windows 下 npm 自带 docs：先找 npm 安装根）
npm root -g
node -p "require.resolve('npm/package.json')"   # 定位 npm 包；docs 在 <npmRoot>/docs/content/commands/npm-exec.md 与 npm-npx.md
curl.exe -L https://docs.npmjs.com/cli/v10/commands/npm-exec | Select-String -Pattern "which-git","package="
curl.exe -L https://vitejs.dev/config/server-options.html | Select-String -Pattern "5173","strictPort","port"
curl.exe -L https://esbuild.github.io/api/#serve | Select-String -Pattern "8000"
curl.exe -L https://pandoc.org/MANUAL.html | Select-String -Pattern "embed-resources"
# 复现第 1 题（在项目内）
npx @chasen-liao/resume-skills editor skills\resume-builder\references\examples\modern-minimal.html --no-open ; echo "exit=$?"
npx -p @chasen-liao/resume-skills resume-skills editor skills\resume-builder\references\examples\modern-minimal.html --no-open ; echo "exit=$?"
node --version; npm --version
# 验证 listen(0) 随机端口语义
node -e "require('node:http').createServer().listen(0,'127.0.0.1',()=>{console.log(require('node:http').createServer ? 'ok '+require('node:net').createServer ? '' : '' : '');}).close()"
```

---

## 附：本文件使用的项目内事实（[本机已验证]，带文件路径）

| 事实 | 位置 |
| --- | --- |
| 包名 `@chasen-liao/resume-skills`，bin 名 `resume-skills`（唯一，与包名 basename 一致） | `D:\MyProjects\resume-skills\package.json` |
| `--port` 默认 0（随机）；`--json`/`--no-open`/`--host` 仅 loopback | `D:\MyProjects\resume-skills\bin\resume-skills.mjs`（printHelp、startEditor 的 `server.listen(port, host)` 回调） |
| 越界资源 → 403 "Asset is outside the resume directory"；编码路径先 `decodeURIComponent` | 同上（GET 兜底分支） |
| 目录边界双校验（前缀 + realpath） | `D:\MyProjects\resume-skills\lib\source-asset.mjs` |
| 启动时版本检查联网调用 | `bin/resume-skills.mjs`（listen 回调内 `checkLatest()`） |