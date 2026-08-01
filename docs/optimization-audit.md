# Resume Skills 与 Canvas CLI 优化审计

> 审计日期：2026-08-01
>
> 范围：7 个 Skills 的事实与交付流程、`resume-skills editor` CLI、Canvas 预览/编辑器、测试、发布包与 GitHub Pages 教程。
>
> 结论：产品的核心定位清晰，但应优先收紧本地编辑器的信任边界，并让“事实库 → HTML → PDF”成为可追溯、可验证的链路。

## 已验证的现状

- `npm test`：29/29 通过。
- `python -m unittest discover -s tests -p "test_*.py"`：16/16 通过。
- `python skills\resume-builder\tests\test_validate_resume.py`：13/14 通过；失败项依赖 `npx --no-install playwright`，当前包未声明/安装该依赖，干净环境无法执行 PDF 渲染包装器。
- 工作区在审计前后均无未提交改动。本次仅新增本文档。

## 优先级与实施顺序

| 阶段 | 目标 | 内容 | 完成门槛 |
| --- | --- | --- | --- |
| P0 | 建立安全与事实边界 | 禁止不受信 HTML 执行、禁止无保护网络暴露、将 Canvas 内容变更纳入事实链、阻断裁切交付 | 新增安全/事实/溢出回归测试全部通过 |
| P1 | 保证保存和交付可恢复、可验证 | 原子保存与冲突处理、PDF 重验、稳定模板 ID、渲染依赖与 CI、教程同步 | 干净环境 CI 可运行完整验证并产出 PDF 证据 |
| P2 | 提升可访问性、性能与使用体验 | 键盘编辑、控件回显/撤销、草稿状态、离线字体、窄屏布局 | 手工可用性验收与针对性测试通过 |

下面的建议遵循“最小可落地改动”：先消除明确风险，再扩展体验；不建议在此阶段把 Canvas 演变成通用富文本或自由排版工具。

## P0：应优先处理

### P0-1：不受信 HTML 可在本地编辑器上下文执行并改写源文件

**证据**：`lib/editor-document.mjs:13-28` 仅用正则检查协议属性；`public/app.js:139` 将输入直接放入 `iframe.srcdoc`；`public/editor.html:35` 的 iframe 未 sandbox；`bin/resume-skills.mjs:111-124` 提供同源、直接覆盖源文件的保存接口。

**风险**：攻击者只需伪造 `data-resume-editor-*` 属性，嵌入的脚本或事件属性即可读取父页面、调用保存接口，并将修改持久化到本地简历。

**最小改动**：

1. iframe 使用 `sandbox="allow-same-origin"`，不授予 `allow-scripts`、`allow-forms`。
2. 在服务端打开和保存前拒绝可执行/可嵌入内容：`script`、`on*` 事件属性、`base`、`iframe`、`object`、`embed` 等；协议属性须存在于实际 `<html>` 标签，而不是任意文本。
3. 新增恶意输入测试：脚本不执行、含禁用标签的文档无法打开/保存、正常内置模板仍能打开。

**验收**：所有支持模板可编辑；恶意模板无法调用 `/api/save`，且服务端拒绝保存。

### P0-2：`--host` 可将无鉴权读写服务暴露到局域网

**证据**：`bin/resume-skills.mjs:44,111-134,146` 接受任意 host，公开 `/api/document`、`/api/save` 和同目录资源读取；README 也说明了该参数。

**风险**：传入 `0.0.0.0` 或局域网地址后，同网设备可读取简历目录内的资源并覆盖目标 HTML。

**最小改动**：常规模式只接受 loopback 地址（`127.0.0.1`、`::1`）。若确有远程预览需求，再新增显式 `--unsafe-network`：生成高熵一次性 token，API/SSE 均校验 token、`Origin` 与 `Host`，并限制请求体大小。

**验收**：非 loopback host 在无危险开关时明确失败；危险模式中无 token 的读取、保存和 SSE 都返回 403。

### P0-3：Canvas 覆盖 HTML 绕过唯一事实源和 claim 确认门槛

**证据**：`skills/resume-builder/references/resume-contract.md:44-48,74-82` 规定 `resume-facts.yaml` 为唯一事实源与最终 claim 门槛；但 `skills/resume-builder/SKILL.md:64-65,95-107` 和 README 的 Canvas 说明允许任意文字修改后直接覆盖 HTML。

**风险**：用户可以在 Canvas 中插入未经确认的公司、指标或技能，之后 HTML/PDF 被当成最新交付物，事实库与版本记录却没有对应证据。

**最小改动**：将 Canvas 的文字改动标记为 `pending diff`，按 `data-resume-editor-id` 映射到 `claim_id`。保存后：

- 排版改动可直接保存；
- 文字改动须显示差异并要求确认后回写事实库，或至少标记为“未核验”，阻止其进入 PDF 交付与版本记录。

**验收**：任何文字变更都有可追踪的原文、新文和 claim 映射；未经确认的版本不能被标记为最终交付。

### P0-4：固定高度与 `overflow:hidden` 可能静默裁切一页简历

**证据**：六套视觉模板均有固定 A4 高度和 `overflow:hidden`（例如 `skills/resume-builder/references/examples/modern-minimal.html:68-74`）；`resume-builder/SKILL.md:82` 禁止用隐藏溢出来伪造单页；`validate_resume.py:347-349` 对 `--check-overflow` 仅告警。

**风险**：肉眼未及时发现时，HTML/PDF 可交付但最后几行内容已被裁切。

**最小改动**：打印布局不使用硬裁切；将 HTML 高度测量与渲染后截图/PDF 检查组成验证步骤。视觉版检测到溢出即失败，而不是 warn。

**验收**：六个模板均有“未溢出”和“故意溢出”回归 fixture；后者必须导致验证失败并给出可行动提示。

## P1：下一轮可靠性与交付闭环

### P1-1：保存需原子化，并处理外部更新冲突

**证据**：`bin/resume-skills.mjs:118` 使用 `writeFileSync` 直接覆盖；`public/app.js:123-139` 依赖 watcher 异步清草稿，热重载时会直接删除草稿。

**建议**：以同目录临时文件写入、`fsync`、原子替换完成保存，并保留一次可恢复备份；保存请求携带 `documentId` 做版本校验；外部变更时让用户选择重新加载或保留草稿另存。前端收到保存成功即清除草稿，而非等待 watcher。

**验收**：陈旧版本保存返回冲突；模拟写入失败不破坏原文件；外部编辑不会静默覆盖浏览器草稿。

### P1-2：修复 Windows 下文件监听的替换保存问题

**证据**：`bin/resume-skills.mjs:55-74` 只监听单一文件，吞掉读取错误且未处理 watcher `error`。Windows 编辑器常以“临时文件 → rename”保存，原 watcher 可能失效。

**建议**：监听父目录、按文件名过滤事件；收到 `rename` 后重新建立监听；将连续读取失败、删除和 watcher 错误作为状态事件通知 UI。增加 Windows 替换保存、文件锁定与删除恢复测试。

### P1-3：资源目录边界应按真实路径检查

**证据**：`lib/source-asset.mjs:3-10` 只比较 `resolve()` 得到的词法路径；`bin/resume-skills.mjs:130-134` 随后直接读取文件。

**建议**：对已存在资源和源目录使用 `realpath` 后比较，或拒绝 reparse point/symlink/junction；增加链接指向目录外的回归测试。此项与 P0-2 合并实施，以免网络模式放大泄露面。

### P1-4：内容编辑必须保持纯文本和模板结构

**证据**：`public/app.js:81,95-100` 使用通用 `contenteditable`，保存时仅移除编辑属性；富文本粘贴、Enter 等可插入标签和结构。

**建议**：使用 `contenteditable="plaintext-only"`，粘贴只保留 `text/plain`，限制/显式处理换行；保存前做结构白名单与模板完整性校验。它同时落实“Canvas 只做文字和排版微调”的产品边界。

### P1-5：六套模板都应声明稳定、语义化编辑 ID

**证据**：仅 `modern-minimal.html` 已有编辑 ID；其余五套依赖 `public/app.js:60-73` 的按 DOM 顺序 fallback ID。

**建议**：为所有内置模板补齐唯一、语义化的 `data-resume-editor-id`；测试每套模板的唯一性与关键字段覆盖。fallback 仅作为明确标记旧模板的迁移机制，避免临时 ID 被固化进源 HTML。

### P1-6：Canvas 保存后必须重新生成并验证 PDF

**证据**：`resume-builder/SKILL.md:74-107` 将 PDF 验证置于 Canvas 编辑之前；`validate_resume.py:343-356` 分别检查输入，未证明 PDF 由当前 HTML 生成。

**建议**：输出 `HTML hash + PDF hash + renderer/version + validation result` 的 manifest。Canvas 发生保存即使关联 PDF 失效，要求重新 render + validate 后才允许最终交付/版本记录。

### P1-7：使 PDF 验证在降级时可见、可阻断

**证据**：`validate_resume.py:231-238` 吞掉 `pypdf` 异常，`256-264` 在 `--check-layout` 缺少 reader 时仅告警；而 `resume-builder/SKILL.md:72-89` 将检查列为不可跳过。

**建议**：当用户请求或 CI 要求布局检查时，缺少可用的 PDF 解析/坐标能力应明确失败（或输出不可交付的 `degraded` 状态）；在 CI 固定 renderer 与 `pypdf` 版本。

### P1-8：声明渲染依赖，建立完整测试入口和 CI

**证据**：`package.json:23-25` 的 `test` 只运行 Node 测试；仅有 `.github/workflows/pages.yml`，没有测试 CI；`render_resume.ps1:19-21` 强制 `npx --no-install playwright`，但 `package.json` 没有依赖声明；当前全量 validator 测试实测因此失败。

**建议**：

1. 定义 `test:node`、`test:python`、`test:integration`，并让 `test` 汇总前两者；PR/main CI 至少运行前两者与 `npm pack --dry-run`。
2. 明确 Playwright 是开发/集成依赖（CI 安装浏览器），或将渲染包装为明确的可选能力并在缺失时输出安装命令；同步提供 Python 开发依赖文件（含 `pypdf`）。
3. CI 实渲染六个模板并检查页面数、可提取文本、截图/溢出结果。

### P1-9：统一事实 schema 与确认规则，并避免单 Skill 安装失效

**证据**：`resume-contract.md:7,46,53,77` 对“旧简历已解析内容”“用户确认”“medium evidence”存在可多解解释；示例 facts 未把 `claim_id`、来源位置、确认信息、locale 等设为必填，但匹配报告要求 claim ID。`jd-tailorer/SKILL.md:23-25` 又依赖 builder 的共享材料，单独安装会缺文件。

**建议**：定义 versioned JSON Schema 与 facts lint；将“来源材料解析结果”统一标为 pending，只有显式确认才转为 claim；要求 `claim_id`、`source_ref`、`confirmed_by/at`、语言/地区与隐私同意元数据。共享契约应提取为 `resume-foundation` skill 或随每个依赖 Skill 打包，并加入安装 smoke test。

### P1-10：重写 Pages 教程，防止主用户路径漂移

**证据**：`docs/tutorial.md:14-18` 仍称只有两个 skill，`:102` 使用旧的 `resume.html` 命名，`:138` 给出含 Markdown 链接的畸形 npx 命令；README `:86-96` 已列 7 个 skill，builder `SKILL.md:56` 规定 `_visual.html` / `_ats.html`。

**建议**：以 README/Skill 的当前流程为源，重写教程中的事实确认、视觉/ATS 分支、7 个 skill 和真实 CLI 命令；提取一份 Quickstart 源或用内容契约测试强制同步。文档站测试应验证关键命令、技能数、命名约定与 Canvas 保存语义，而不是只检查标题/token 存在。

## P2：体验与维护性

### P2-1：补齐键盘与辅助技术编辑路径

**证据**：`public/app.js:79-86` 仅支持 click/dblclick；文本节点不可 Tab 聚焦。

**建议**：为可编辑项实现 roving tabindex；Enter/Space 选择，F2/Enter 编辑，Esc 取消；同步 `aria-selected`、编辑状态与快捷键提示。

### P2-2：减少拖动控件导致的 CSS/草稿膨胀，并支持撤销覆盖

**证据**：`public/app.js:23-38` 每次输入均追加 CSS 规则，`40-48` 每次都序列化整份 HTML 写入 localStorage；控件固定初值，空值不删除现有覆盖。

**建议**：按“元素 ID + CSS 属性”覆盖单一声明；`input` 仅实时渲染，200–400ms debounce 写草稿，`change/blur` 立即写入；选中元素时回显 computed style，并提供“恢复该项/全部默认”。

### P2-3：修正草稿状态与关闭提示

**证据**：`public/app.js:132-139` 切换 `documentId` 后只清理新 key，旧草稿会残留；`:129` 只要发现草稿 key 就阻止关闭。

**建议**：重新加载前记录并清理旧 key，保存成功立即清草稿；以显式 dirty 状态替代“localStorage 中存在任意草稿”的判断。

### P2-4：提高离线预览和窄屏可用性

**证据**：`public/app.css:1` 与五个模板通过 Google Fonts 加载字体；`public/app.css:156-159` 在小于 1280px 时固定 inspector，但没有开关。

**建议**：编辑器 UI 改用系统字体栈；模板使用可再分发的本地字体或明确 fallback，并在字体加载失败时提示。窄屏将 inspector 改为可开关 drawer，画布随窗口缩放并保留焦点回归。

### P2-5：消除示例事实污染与包展示缺口

**证据**：示例模板（例如 `modern-minimal.html:325-384`）含具体公司、量化指标和技能，未标注 demo；README `:5` 使用 `image.png`，但 `package.json` 的发布白名单不含该文件，`npm pack --dry-run` 不会带上首图。

**建议**：示例改为明确的非事实占位符或增加 demo 标记，并测试生成结果没有遗留示例文本；将首图加入发布清单，或改用稳定的远程图片链接。

## 推荐的首个迭代切片

为避免一次性重写编辑器，建议按以下小切片提交，每个切片独立可测：

1. **安全封口**：iframe sandbox、服务端 HTML 拒绝策略、loopback-only host、请求体上限及 P0 回归测试。
2. **保存可靠性**：原子保存、版本冲突、立即清草稿、目录监听及 Windows 回归测试。
3. **交付完整性**：稳定编辑 ID、纯文本编辑、Canvas → PDF 失效/重新验证 manifest、溢出 fail。
4. **工程化**：渲染依赖契约、完整 `npm test`、PR CI、教程重写和内容契约测试。
5. **体验打磨**：键盘操作、可逆控件、离线字体、窄屏 drawer。

每个切片都应先添加对应失败测试再实现；尤其不要在 P0-1/P0-2 完成前扩大 Canvas 的编辑能力或远程预览能力。

## 0.5.0 实施计划

### 全局约束

- 保持原生 Node/HTML/CSS/JS 架构，不引入前端构建工具。
- 所有行为变更遵循 TDD：先新增一个会失败的行为测试、确认失败原因正确、再写最小实现。
- 不接受任意 HTML 作为可信编辑对象；默认只绑定 loopback 地址。
- Canvas 在本版本只保存排版改动，不直接保存文字内容；文字事实的修改必须回到 Skill 工作流确认后重新生成 HTML。
- 每项实现都需要 focused test、完整 Node/Python 测试与一次审查；发布前还需执行 `npm pack --dry-run`。

### Task 1：收紧 HTML 与网络服务边界

实现 P0-1、P0-2 与 P1-3 的最小安全闭环。

- 新增端到端 Node 测试，证明：含 `<script>`、事件属性或嵌入标签的 HTML 不能打开；协议属性不在真正 `<html>` 标签时不能打开；sandbox iframe 不允许脚本；非 loopback `--host` 被拒绝。
- 在 `prepareEditorDocument` 中实现可维护的 HTML 风险拒绝策略（不是只扩展现有正则），校验协议属性在 `<html>` 开始标签上；保存端复用相同校验。
- iframe 使用不带 `allow-scripts` 的 sandbox；CLI 默认并强制 loopback，移除可公开服务的常规路径。
- 限制 `/api/save` 请求体；资源读取以真实路径校验或拒绝 reparse point，不能经符号链接/junction 越出简历目录。
- 更新 CLI 帮助和 README 的 host 说明；不实现远程预览/token 功能。

验收：所有新增测试先红后绿；原有编辑器测试仍通过；恶意输入不会被服务或 iframe 执行。

### Task 2：使 Canvas 保存保持事实与结构边界

实现 P0-3、P1-4、P1-5 与 P2-1 的最小版本。

- 先写浏览器行为/静态契约测试：Canvas 不再将文本变为 `contenteditable`，双击文本显示明确的事实确认提示；排版控件仍可选择元素并保存；六套模板均有稳定且唯一的编辑 ID。
- 删除文本编辑、粘贴和键盘修改路径；保留文字选择与排版覆盖。更新 Canvas UI、README、相关 Skills，明确文本事实必须通过 Agent 工作流确认并重新生成 HTML。
- 为五套尚未标注的内置模板添加语义化、稳定且唯一的 `data-resume-editor-id`；删除或严格限制运行时 fallback，避免把临时 ID 写回文件。
- 让文本项具备 roving tabindex、Enter/Space 选择、Escape 清除选择以及恰当 ARIA 状态；不实现富文本、自由拖拽或内容改写。

验收：内容编辑无法持久化，排版保存仍正常；所有模板 ID 验证通过；键盘可选择文本并使用控件。

### Task 3：实现可恢复的保存、草稿和热更新

实现 P1-1、P1-2 与 P2-2/P2-3 的最小闭环。

- 先写服务级测试：带过期 `documentId` 的保存返回冲突；模拟写入失败时原文件保持不变；正常保存原子替换且返回新文档版本；保存成功立即清草稿。
- 保存请求必须携带 `documentId`；以同目录临时文件 + fsync + 原子替换写入，并保留单个 `.bak` 可恢复副本。
- 从单文件 watch 改为父目录监听并按文件名过滤；重命名替换后保持热更新；将读取/监听错误用 SSE 状态通知前端。
- 将 CSS override 按“元素 ID + 属性”覆盖而非追加；range 输入只实时渲染，草稿写入节流，`change/blur` 立即写入；选中项回显计算样式并可恢复单项默认。

验收：保存、冲突、错误恢复、重命名热更新和草稿状态均有回归测试；不会因一次拖动写入重复 CSS 规则。

### Task 4：建立渲染、验证、测试与文档的交付闭环

实现 P0-4、P1-6 至 P1-10、P2-4/P2-5 中不涉及重新设计的部分。

- 先写 validator 与测试脚本测试：视觉版溢出为失败；请求布局检查但缺依赖时为明确的不可交付状态；Canvas 保存让既有 PDF manifest 失效。
- 为 HTML/PDF 生成包含 hash、renderer、验证结果的 manifest；PDF 只在同一 HTML hash 下被视为有效。
- 将 Playwright 和 Python 测试依赖显式声明为开发/集成依赖；定义 `test:node`、`test:python`、`test:integration`，新增 GitHub Actions 测试工作流并检查 `npm pack --dry-run`。
- 将 GitHub Pages 教程更新为当前 7-skill 工作流、`*_visual.html`/`*_ats.html` 命名与真实 CLI 命令；修复 npm README 首图的发布清单或 URL。示例模板的虚构内容须明显标记为 demo。
- 更新版本、CHANGELOG 和 README；不在此任务添加本地字体包或重做窄屏抽屉（后续小版本处理）。

验收：干净 CI 环境可运行声明的基础测试，集成任务在依赖齐全环境可渲染并验证；教程关键路径有内容契约测试。

## 执行状态（2026-08-01）

- P0 与 P1 的安全、事实边界、保存可靠性、渲染验证、manifest、CI 和教程同步已落地并通过复审。
- P2 的键盘选择、草稿节流、样式回显/恢复和模板稳定 ID 已落地；本地字体与窄屏 drawer 暂列后续版本。
- 当前验证：`npm test`、`npm run test:integration`、Python validator 和 `npm pack --dry-run --json` 均通过；IPv6 回连测试在受限环境中显式跳过。
- 该文档是本次审计与实施记录，不是运行时合同；现役使用方式以 `README.md`、`AGENTS.md` 和各 Skill 的当前说明为准。
