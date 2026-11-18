# 交付门禁与验证契约 (Delivery Gate)

本文档是简历视觉版与 ATS-safe 版交付验证、整页截图视觉复核、Canvas 路由与重验闭环以及 Git 提交建议的**唯一权威定义源**。所有涉及简历生成、定制和排版微调的技能均遵循本契约。

---

## 协议校验（编辑字段契约）

适用模式：视觉模式（6 套内置视觉模板）。ATS-safe 模式不适用此协议。

在渲染 PDF 或启动 Canvas 之前，必须先运行静态协议校验（失败即停止，严禁跳过）：

```bash
npx -p @chasen-liao/resume-skills@latest resume-skills validate "<生成的_visual.html路径>"
```

重复执行直到输出“校验通过”。

### 契约规则

1. **协议根标记**：
   `<html>` 根节点必须声明：
   - `data-resume-editor-template="<模板标识>"`（`modern-minimal`、`classic-business`、`creative-bold`、`japanese-minimal`、`minimal-blue-business` 或 `tech-dark`）
   - `data-resume-editor-version="1"`
   - `data-resume-layout="full-page"`
2. **字段独立性要求**：
   - 字段总数必须大于 0；
   - 必须使用唯一、小写、语义化的 `data-resume-editor-id`（例如 `profile-name`、`experience-1-title`、`experience-1-bullet-1`、`skill-1` 等）；
   - **可独立编辑原则**：`data-resume-editor-id` 只能标在具体的叶子文本元素上，每个节点对应一个独立字段；
3. **容器黑名单（禁止携带编辑 ID）**：
   - 禁止把编辑 ID 放在结构化标签：`<html>`、`<body>`、`<main>`、`<section>`、`<header>`、`<footer>`、`<ul>`、`<ol>`、`<figure>`；
   - 禁止把编辑 ID 放在页面容器类：`.page`、`.resume`；
   - 禁止包含多个板块、多个字段或块级子元素的复合容器携带 ID，严禁使用整页或整块兜底 ID；带链接的联系方式需将文本拆分为独立字段。
   - *注：容器黑名单与叶子性校验规则以 `validate` 命令以及 `lib/editor-rules.mjs` / `lib/editor-document.mjs` 实现为准。*

---

## 渲染与布局验证（视觉模式）

先按私有工作区的命名约定确定最终 PDF 路径。内置视觉模板通过字段协议校验后，使用以下一体化命令。脚本与输入输出文件均可使用绝对路径。

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File skills/resume-builder/scripts/render_resume.ps1 -HTML "<生成的_visual.html路径>" -OutputPdf "<生成的_visual.pdf路径>"
```

> **注意**：`render_resume.ps1` 内部已自动调用 Playwright 渲染、计算 full-page 自动布局（短内容扩张/长内容压缩 `--resume-density`）、生成同名前缀的 `*.preview.png`，并自动调用 `validate_resume.py` 执行溢出与布局检查并生成 `*.resume-manifest.json`。**不要再单独调用 `validate_resume.py`**。

若工作区已指定导出工具，沿用该工具生成最终命名的 PDF，保存同一版本的整页 PNG，并使用实际导出器名称和版本执行以下成品检查。验证和版本记录均指向实际交付路径。对内置 full-page 版式保留布局检查；自定义版式使用已约定的版面要求，记录所用参数和未覆盖项。工作区明确约定占用率时，用 `--min-fill-ratio` 传入该值；内置满页模板默认使用 0.98。

```powershell
python skills/resume-builder/scripts/validate_resume.py --mode visual --html "<源 HTML>" --pdf "<最终 PDF>" --check-layout --preview "<整页 PNG>" --manifest "<岗位目录/最终名称.resume-manifest.json>" --renderer "<导出器>@<版本>" --json
```

内置渲染器默认生成 794 × 1123 px 的整页预览。下游可提供更高分辨率的整页 PNG；manifest 记录实际用于复核的文件及哈希。图片尺寸本身无法证明页面完整或文字清晰。

### 验收规则

以下阈值适用于内置 full-page 视觉模板。模板 CSS 参数见 [通用排版](css/common.md)。ATS 单栏只执行本契约中的 ATS 验收。

- **PDF page count**：必须恰好是 `1 page`；超过 1 页直接失败，严禁用 `overflow: hidden` 或裁切伪装成单页。
- **page fill**：以 PDF 可提取文本纵向范围估算的有效页面占用率，目标至少 `98%`；默认低于 98% 直接失败，严禁为填白编造事实。
- **vertical balance**：可打印区域上下留白差不得超过 20mm，避免内容挤在顶部或底部。
- **vertical gaps**：PDF 文本行之间的最大连续空隙不得超过有效高度的 25%，防止底部孤立文字掩盖正文偏空。
- **bottom safety**：底部安全区检查不得失败；默认总底部边距为 9mm（不再叠加额外安全区），校验使用 HTML 实测边距验证并报告实际底部距离。
- **manifest 状态**：包含 HTML/PDF/preview SHA-256、renderer 版本、边距与密度；清单状态须为 `valid`，任一检查失败、降级或哈希不一致均须重新核验。

---

## PDF 文字提取与 OCR 验证（两种模式）

- 优先导出包含可搜索、可复制文字的 PDF，保持选定版式；不要仅依赖图片承载姓名、联系方式或正文。
- `validate_resume.py` 已内置自动门禁：自动拦截 `Type3` 轮廓字体、康熙部首/部首补充（`U+2F00..U+2FDF`/`U+2E80..U+2EFF`）、`U+FFFD`/PUA 乱码、异常 `U+2212` 减号替换、`DEMO` 角标/`</>` 伪元素残留以及 PDF 内容流阅读顺序颠倒。
- 从最终交付 PDF 按默认顺序提取文字，对照页面和来源核验姓名、联系方式、日期、章节、经历正文及链接文字，检查缺字、乱码、重复、标题与正文分离和段落错序。只检查关键字是否存在或按坐标排序后的结果，不能证明默认提取顺序正确。
- 如文字层有问题，优先修复可编辑源文件并重新导出；仅有 PDF 时保留原件，修复或重建文字层，确保与页面一致。重新提取并对照文字、复核整页视觉效果后再交付。
- 文字提取与页面 OCR 是不同检查。用户要求 OCR 验证时，尽可能对最终 PDF 渲染页运行现有 OCR 工具，核对关键内容并报告实际结果；工具不可用时说明未验证，不擅自安装依赖。未测试目标招聘平台时明确说明，不能保证各平台均可正确解析。

---

## 版面调整顺序

当页面未达到单页、利用率不足 98% 或上下留白失衡时，按以下顺序调整：

1. 先充分使用已有且已确认的真实经历；
2. **短内容**：先在 `--resume-density-max`（默认 1.2）内由 full-page 机制放大变量控制的字号、行距和间距，再用 `space-between` 均匀分配剩余空间；
3. **长内容**：由渲染脚本在 `--resume-density-min` 之上自动压缩密度；
4. **仍溢出或失衡时的调整次序**：
   - 页边距微调（下限不小于 8mm）；
   - 条目间距与板块间距微调；
   - 行高微调（不低于 1.25）；
   - 正文字号微调（不小于 9.5px）；
   - 精简低相关度或次要描述；
   - 在适合时切换单栏或双栏布局。
5. 上下间距尽量相近；严禁新增未确认经历、指标或虚构占位文本，严禁用难以阅读的极小字号硬塞一页。调整后使用同一导出路径重新生成并校验实际 PDF。

---

## 整页截图视觉复核（视觉模式强制执行）

- AI 必须使用图像查看工具打开本次最终渲染生成的 `*.preview.png`，实际查看完整 A4 页面（包含顶部和底部）；若预览不完整或不清晰，补截同一最终 HTML 在打印样式下的完整 A4 页面，或将最终 PDF 页面渲染为图片后查看。不能只生成截图、检查图片文件存在，或只看局部截图就声称已完成复核。
- 重点检查正文结束到页面底部的留白是否过大、上下留白是否协调，以及板块之间是否存在突兀的大块空隙。双栏必须分别检查每一栏，不能因为另一栏或底部的一行文字触底就判定整页均匀。保留必要打印安全边距，允许留白，但应分布均匀，不能让正文集中在顶部而底部明显空缺。
- 即使 CI、`page fill`、溢出检查和 manifest 全部通过，只要截图中有明显底部空缺、单栏偏空或留白失衡，仍视为视觉验收未通过，不能直接交付。先在排版约束内调整字号、行高、条目/板块间距和页边距；双栏仍失衡时可在生成阶段调整布局或切换单栏，不得编造内容填白或用底部孤立文字伪装占用率。
- 每次修改后重新渲染 PDF、执行自动校验，并打开新截图复核，直到留白均匀且无溢出、裁切。交付时简述截图路径及底部留白、上下平衡、各栏分布的复核结论。若无法查看截图，明确标记视觉复核未完成，不得声称已通过视觉验收。

---

## 可选 Canvas 预览与路由

视觉模式完成上述检查后即可交付。用户提出本地微调时，再启动 Canvas。

- **可选工具定位**：Canvas 是视觉版的可选微调工具，不是 HTML 或 PDF 交付的前置门槛；用户不需要时直接交付已验证的产物。
- **技能路由**：用户提出使用 Canvas 或需要在编辑器中微调时，**路由至 `resume-canvas` 技能**。
- **职责划分**：由 `resume-canvas` 负责启动本地编辑器、CLI 参数说明（`--manifest` / `--json` / `--no-open` / `--port`）以及环境缺少 Node/npx 时的降级说明；其他技能不要自行启动编辑器或贴 editor 命令。
- **编辑边界**：Canvas 仅支持编辑已有字段纯文本与受限排版项，不支持插入 HTML、无中生有编造经历、JD 匹配或结构重排。

---

## Canvas 保存后重验闭环

当用户在 Canvas 中点击“保存修改”后：

1. **状态变化**：Canvas 会直接覆盖源 HTML，并将关联的 `*.resume-manifest.json` 自动置为 `status: invalid` 并记录失效原因，旧 PDF 不再匹配当前 HTML；
2. **重验闭环**：必须回到工作流执行重验：
   - **事实核验**：检查修改内容是否涉及关键经历、时间、职位、数据或技能，未确认的新事实必须向用户核实；
   - **重新渲染与验证**：沿用本次导出方式与最终文件名，重新生成 PDF、预览和 manifest；
   - **文字提取与 OCR 验证**：按 [PDF 文字提取与 OCR 验证](#pdf-文字提取与-ocr-验证两种模式)检查最终 PDF；
   - **重新整页截图复核**：AI 必须重新打开新生成的 `*.preview.png`，完整执行 [整页截图视觉复核（视觉模式强制执行）](#整页截图视觉复核视觉模式强制执行)；
   - 只有新 manifest 状态有效、PDF 文字提取与阅读顺序检查通过且视觉复核通过，才可正式交付。

---

## ATS-safe 模式验证

适用模式：ATS-safe HTML/PDF 输出。

1. **检查 HTML 草稿**。检查标题结构、单栏与正文文本。草稿通过时 `ok` 为真，`deliverable` 为假。
   ```bash
   python skills/resume-builder/scripts/validate_resume.py --mode ats --html "<源 HTML>" --json
   ```
2. **验收最终 PDF**。使用下游约定的导出方式或浏览器打印到最终文件名，传入同版 HTML 与实际 PDF。按需追加 `--required-text` 指定必须保留的文字。检查单栏、提取内容与默认阅读顺序。缺文件、缺少提取依赖或检查失败时，报告未通过的项目。
   ```bash
   python skills/resume-builder/scripts/validate_resume.py --mode ats --html "<源 HTML>" --pdf "<最终 PDF>" --json
   ```
3. **边界约束**：
   - ATS-safe 模式单栏纯文本结构未接入 Canvas 协议，**不启动 Canvas**；
   - 交付文件位置并说明通过浏览器打印导出 PDF；
   - 仓库当前不具备 DOCX 生成能力，**不承诺 DOCX 产物**，不向用户保证 ATS 系统必过。

---

## 本地 Git 提交建议

所有产物验证通过后，建议用户将简历工作区纳入本地私有 Git 仓库管理，并给出语义化提交建议：
- 母版简历：`git commit -m "创建母版简历"` 或 `git commit -m "更新母版经历"`
- 岗位定制：`git add resume-facts.yaml tailored/<公司名>-<岗位>/ && git commit -m "定制：<公司名> - <岗位>"`

**硬性约束**：严禁自动执行 Git 初始化、暂存、提交、推送、回滚或分支切换；仅向用户提供建议命令，必须由用户确认或自行执行。
