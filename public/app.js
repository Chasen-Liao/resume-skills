import { stripLegacyToolbar } from "/editor-toolbar.js";
import { appendOverrideRule, computedControlValues, configureSelectionTarget, createDraftController, restoreSelectedDefaults, rovingSelectionTargets, selectFromPointer, setRovingTabStop, setSelectionPressed, upsertRootToken } from "/editor-controls.js";
import { editorBlockChildTagNames, editorContainerClassNames, editorContainerTagNames } from "/editor-rules.js";

const frame = document.querySelector("#resume-frame");
const status = document.querySelector("#save-status");
const selectionName = document.querySelector("#selection-name");
const selectedTextEditor = document.querySelector("#selected-text-editor");
const selectedText = document.querySelector("#selected-text");
const controls = Object.fromEntries(["font-size", "font-weight", "font-color", "text-align", "line-height", "margin-bottom", "page-margin", "accent-color"].map((id) => [id, document.querySelector(`#${id}`)]));
let selected;
let documentId;
let sourceName;
let selectionTargets = [];

function draftKey(id = documentId) { return `resume-editor:draft:${id}`; }
function overrideStyle(doc) {
  let style = doc.querySelector("#resume-editor-overrides");
  if (!style) { style = doc.createElement("style"); style.id = "resume-editor-overrides"; doc.head.append(style); }
  return style;
}
function ensureRules(doc) {
  const style = overrideStyle(doc);
  if (!style.textContent.includes("/* resume-editor-overrides */")) style.textContent = "/* resume-editor-overrides */\n";
  return style;
}
function setRule(element, property, value, commit = false) {
  const doc = frame.contentDocument;
  const style = ensureRules(doc);
  style.textContent = appendOverrideRule(style.textContent, element.dataset.resumeEditorId, property, value);
  saveDraft(commit);
  updateOverflow();
}
function setRootToken(token, value, commit = false) {
  const doc = frame.contentDocument;
  const style = ensureRules(doc);
  style.textContent = upsertRootToken(style.textContent, token, value);
  saveDraft(commit);
  updateOverflow();
}
function serializedHtml() {
  return cleanForExport();
}
const drafts = createDraftController({
  getDocumentId: () => documentId,
  serialize: serializedHtml,
  persist: (id, html) => { localStorage.setItem(draftKey(id), html); status.textContent = "草稿已保存在此浏览器"; },
  remove: (id) => localStorage.removeItem(draftKey(id)),
});
function saveDraft(commit = false) { if (commit) drafts.commit(); else drafts.schedule(); }
function setControlValue(id, value) {
  if (value === "" || value === undefined || value === "normal") return;
  controls[id].value = value;
  const slider = document.querySelector(`.sync-slider[data-target="${id}"]`);
  if (slider) slider.value = value;
}
function syncControlsFromSelection(element) {
  const style = frame.contentWindow.getComputedStyle(element);
  const rootStyle = frame.contentWindow.getComputedStyle(frame.contentDocument.documentElement);
  Object.entries(computedControlValues(style, rootStyle)).forEach(([id, value]) => setControlValue(id, value));
}
function selectionLabel(element) {
  return element.textContent.trim().slice(0, 42) || "已选择空文本";
}
function select(element) {
  if (selected) {
    selected.removeAttribute("data-resume-editor-selected");
    setSelectionPressed(selected, false);
  }
  selected = element;
  selected.setAttribute("data-resume-editor-selected", "true");
  setSelectionPressed(selected, true);
  if (selectionTargets.includes(selected)) setRovingTabStop(selectionTargets, selected);
  selectionName.textContent = selectionLabel(selected);
  selectedText.value = selected.textContent;
  selectedTextEditor.hidden = false;
  // CSS spring feedback
  selectionName.classList.remove("animate-pop");
  void selectionName.offsetWidth;
  selectionName.classList.add("animate-pop");
  syncControlsFromSelection(selected);
}
function clearSelection() {
  if (!selected) return;
  selected.removeAttribute("data-resume-editor-selected");
  setSelectionPressed(selected, false);
  selected = undefined;
  selectionName.textContent = "请选择一段文字";
  selectedText.value = "";
  selectedTextEditor.hidden = true;
}
selectedText.addEventListener("input", () => {
  if (!selected) return;
  selected.textContent = selectedText.value;
  selectionName.textContent = selectionLabel(selected);
  status.textContent = "文字已修改；保存后请重新确认事实并验证 PDF。";
  saveDraft();
  updateOverflow();
});
function finishTextEdit(node, save = true) {
  const originalHtml = node.dataset.resumeEditorOriginalHtml;
  const changed = originalHtml !== undefined && node.innerHTML !== originalHtml;
  node.removeAttribute("contenteditable");
  delete node.dataset.resumeEditorOriginalHtml;
  if (save && changed) {
    status.textContent = "文字已修改；保存后请重新确认事实并验证 PDF。";
    saveDraft(true);
  }
}
function supportsPlaintextOnly() {
  // 测试钩子：浏览器回归测试用它强制走 contenteditable="true" 回退分支
  if (window.__RESUME_SKILLS_FORCE_PLAINTEXT_FALLBACK === true) return false;
  const probe = document.createElement("div");
  probe.setAttribute("contenteditable", "plaintext-only");
  return probe.isContentEditable === true;
}
const plaintextOnlySupported = supportsPlaintextOnly();
function beginTextEdit(node) {
  select(node);
  if (!node.isContentEditable) node.dataset.resumeEditorOriginalHtml = node.innerHTML;
  node.setAttribute("contenteditable", plaintextOnlySupported ? "plaintext-only" : "true");
  node.focus({ preventScroll: true });
  status.textContent = "正在编辑文字；仅允许纯文本，Ctrl/Cmd+Enter 完成。";
}
function moveFocus(nodes, current, direction) {
  const index = nodes.indexOf(current);
  const next = nodes[(index + direction + nodes.length) % nodes.length];
  setRovingTabStop(nodes, next);
  next.focus();
}
// 容器/块级/嵌套规则来自 /editor-rules.js（与 lib/editor-document.mjs 同一事实源）；
// 本文件只做大小写规范化与判定，不在此处另行定义黑名单。
const editorContainerTags = new Set(editorContainerTagNames);
const editorContainerClasses = new Set(editorContainerClassNames);
const editorBlockTags = new Set(editorBlockChildTagNames);
function containerFieldProblem(node) {
  const tag = node.tagName.toLowerCase();
  if (editorContainerTags.has(tag)) return `是容器 <${tag}>`;
  const classes = (node.className || "").split(/\s+/).filter(Boolean);
  const containerClass = classes.find((name) => editorContainerClasses.has(name));
  if (containerClass) return `是容器 .${containerClass}`;
  const children = [...node.children];
  const blockChild = children.find((child) => editorBlockTags.has(child.tagName.toLowerCase()));
  if (blockChild) return `内含块级子元素 <${blockChild.tagName.toLowerCase()}>`;
  if (children.length > 1) return `内含 ${children.length} 个子元素`;
  const nestedProblem = nestedInlineFieldProblem(node);
  if (nestedProblem) return nestedProblem;
  return null;
}
// 与 lib 的 nestedInlineFieldProblem 对齐：复合字段（父字段只有 1 个行内子节点）内的
// 行内叶子子字段（如联系方式行内带 ID 的 <a>）放行；块级嵌套/多子节点父字段拒绝。
function nestedInlineFieldProblem(node) {
  const ancestor = node.parentElement && node.parentElement.closest("[data-resume-editor-id]");
  if (!ancestor) return null;
  const tag = node.tagName.toLowerCase();
  if (editorBlockTags.has(tag)) return "是块级嵌套编辑字段（编辑字段不能嵌套在另一个编辑字段内部）";
  if (ancestor.children.length > 1) return `父字段包含 ${ancestor.children.length} 个子节点，不是单个复合字段`;
  return null;
}
function disableEditing(message) {
  clearSelection();
  status.textContent = message;
  status.classList.add("error");
  document.querySelector("#save-html").disabled = true;
  document.querySelector("#print-pdf").disabled = true;
  selectionName.textContent = "简历不可编辑（编辑协议校验失败）";
}
function enableEditing() {
  // 热重载从“坏文件”恢复为“好文件”时必须清除错误态并恢复按钮。
  status.classList.remove("error");
  document.querySelector("#save-html").disabled = false;
  document.querySelector("#print-pdf").disabled = false;
}
function bindImageErrorHints(doc) {
  // 跨目录/缺失资源在服务端被 403/404 拒绝后，浏览器对 <img> 触发 error 事件（捕获阶段）。
  // 本地 404 可能在 iframe load 事件之前完成，因此绑定时刻先扫描已失败图片，再挂后续监听。
  const markFailed = (target) => {
    if (!target || target.tagName !== "IMG" || target.hasAttribute("data-resume-editor-img-hint")) return;
    target.setAttribute("data-resume-editor-img-hint", "true");
    status.textContent = `图片加载失败：${target.getAttribute("src") || ""}。图片不在简历目录内或文件不存在（跨目录资源被安全边界拒绝）；请把图片放入简历同目录后刷新。`;
  };
  doc.querySelectorAll("img").forEach((image) => {
    if (image.complete && image.naturalWidth === 0) markFailed(image);
  });
  doc.addEventListener("error", (event) => markFailed(event.target), true);
}
function bindCanvas() {
  const doc = frame.contentDocument;
  doc.head.insertAdjacentHTML("beforeend", "<style id=\"resume-editor-chrome\">[data-resume-editor-id]{cursor:pointer}[data-resume-editor-id]:focus-visible{outline:2px solid #2563eb;outline-offset:2px}[data-resume-editor-selected]{outline:2px solid #2563eb;outline-offset:2px}</style>");
  bindImageErrorHints(doc);
  const allNodes = [...doc.querySelectorAll("[data-resume-editor-id]")];
  if (allNodes.length === 0) {
    disableEditing("未找到可编辑字段（正文缺少 data-resume-editor-id）。该 HTML 不符合编辑协议；请重新生成，或先运行 `resume-skills validate <file>` 检查。");
    return false;
  }
  const invalidFields = allNodes.map((node) => ({ node, problem: containerFieldProblem(node) })).filter((item) => item.problem);
  if (invalidFields.length) {
    const sample = invalidFields.slice(0, 3).map(({ node, problem }) => `<${node.tagName.toLowerCase()}${node.className ? ` class="${node.className}"` : ""}>${problem}`).join("；");
    disableEditing(`检测到 ${invalidFields.length} 个容器级/非叶子编辑 ID（${sample}）。直接编辑会破坏版面，已禁用编辑；请把 data-resume-editor-id 移到叶子文本字段。`);
    return false;
  }
  enableEditing();
  const nodes = selectionTargets = rovingSelectionTargets(allNodes);
  allNodes.forEach((node) => {
    const index = nodes.indexOf(node);
    if (index !== -1) configureSelectionTarget(node, index);
    node.addEventListener("click", (event) => {
      selectFromPointer(event, node, select);
      beginTextEdit(node);
    });
    node.addEventListener("dblclick", () => beginTextEdit(node));
    node.addEventListener("blur", () => { if (node.isContentEditable) finishTextEdit(node); });
    node.addEventListener("input", () => {
      if (selected !== node) return;
      selectedText.value = node.textContent;
      selectionName.textContent = selectionLabel(node);
      saveDraft();
    });
    if (!plaintextOnlySupported) {
      node.addEventListener("paste", (event) => {
        if (!node.isContentEditable) return;
        event.preventDefault();
        frame.contentDocument.execCommand("insertText", false, event.clipboardData?.getData("text/plain") ?? "");
      });
      node.addEventListener("drop", (event) => {
        if (!node.isContentEditable) return;
        event.preventDefault();
        frame.contentDocument.execCommand("insertText", false, event.dataTransfer?.getData("text/plain") ?? "");
      });
    }
    node.addEventListener("keydown", (event) => {
      if (node.isContentEditable) {
        if (event.key === "Escape") {
          event.preventDefault();
          node.innerHTML = node.dataset.resumeEditorOriginalHtml || node.innerHTML;
          finishTextEdit(node, false);
        } else if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          finishTextEdit(node);
        } else if (!plaintextOnlySupported && event.key === "Enter") {
          // 回退模式（contenteditable="true"）下 Enter 会插入 <br> 破坏结构校验；纯文本编辑不接受换行
          event.preventDefault();
        }
        return;
      }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); beginTextEdit(node); }
      if (event.key === "Escape") { event.preventDefault(); clearSelection(); }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); moveFocus(nodes, node, 1); }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); moveFocus(nodes, node, -1); }
    });
  });
  return true;
}
function updateOverflow() {
  const resume = frame.contentDocument?.querySelector(".resume");
  if (!resume) return;
  const overflow = resume.scrollHeight > resume.clientHeight + 1;
  document.querySelector("#overflow-status").textContent = overflow ? "注意：内容已超出一页 A4。HTML 仍可导出；打印 PDF 前请确认。" : "A4：当前未检测到垂直溢出。";
}
function cleanForExport() {
  const doc = frame.contentDocument.cloneNode(true);
  doc.querySelectorAll("[data-resume-editor-selected], #resume-editor-chrome").forEach((node) => {
    if (node.id === "resume-editor-chrome") node.remove(); else node.removeAttribute("data-resume-editor-selected");
  });
  doc.querySelectorAll("[data-resume-editor-id]").forEach((node) => {
    node.removeAttribute("contenteditable");
    node.removeAttribute("data-resume-editor-original-html");
    node.removeAttribute("data-resume-editor-original-text");
    node.removeAttribute("tabindex");
    node.removeAttribute("role");
    node.removeAttribute("aria-pressed");
  });
  doc.querySelectorAll("[data-resume-editor-img-hint]").forEach((node) => node.removeAttribute("data-resume-editor-img-hint"));
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
function bindControl(control, handler) {
  control.addEventListener("input", () => handler(false));
  control.addEventListener("change", () => handler(true));
  control.addEventListener("blur", () => handler(true));
}
Object.entries({ "font-size": (v, commit) => setRule(selected, "font-size", `${v}px`, commit), "font-weight": (v, commit) => v && setRule(selected, "font-weight", v, commit), "font-color": (v, commit) => setRule(selected, "color", v, commit), "text-align": (v, commit) => v && setRule(selected, "text-align", v, commit), "line-height": (v, commit) => setRule(selected, "line-height", v, commit), "margin-bottom": (v, commit) => setRule(selected, "margin-bottom", `${v}px`, commit) }).forEach(([id, action]) => bindControl(controls[id], (commit) => { if (selected) action(controls[id].value, commit); }));
bindControl(controls["page-margin"], (commit) => setRootToken("--page-margin", `${controls["page-margin"].value}mm`, commit));
bindControl(controls["accent-color"], (commit) => setRootToken("--color-accent", controls["accent-color"].value, commit));

// Sync ranges with number inputs
document.querySelectorAll(".sync-slider").forEach(slider => {
  const targetId = slider.dataset.target;
  const numInput = controls[targetId] || document.getElementById(targetId);
  if (numInput) {
    slider.addEventListener("input", (e) => {
      numInput.value = e.target.value;
      numInput.dispatchEvent(new Event("input"));
    });
    slider.addEventListener("change", () => numInput.dispatchEvent(new Event("change")));
    numInput.addEventListener("input", (e) => {
      slider.value = e.target.value;
    });
  }
});
document.querySelector("#save-html").addEventListener("click", async () => {
  const response = await fetch("/api/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId, html: cleanForExport() }) });
  const result = await response.json();
  if (response.ok) {
    drafts.clear();
    documentId = result.documentId;
    status.textContent = `已成功保存 ${result.outputName}`;
  } else {
    status.textContent = `保存失败：${result.error}`;
  }
});
document.querySelector("#reset-selected").addEventListener("click", () => {
  if (!selected) return;
  const style = frame.contentDocument.querySelector("#resume-editor-overrides");
  if (!style) return;
  style.textContent = restoreSelectedDefaults(style.textContent, selected.dataset.resumeEditorId);
  saveDraft(true);
  syncControlsFromSelection(selected);
});
document.querySelector("#print-pdf").addEventListener("click", () => frame.contentWindow.print());
window.addEventListener("beforeunload", (event) => { if (localStorage.getItem(draftKey())) { event.preventDefault(); event.returnValue = ""; } });
async function reloadDocument({ isHotReload = false } = {}) {
  const response = await fetch("/api/document");
  const { html, documentId: id, sourceName: name } = await response.json();
  const previousDocumentId = documentId;
  documentId = id;
  sourceName = name;
  document.querySelector("#source-name").textContent = sourceName;
  if (isHotReload) {
    drafts.clear(previousDocumentId);
  }
  frame.srcdoc = stripLegacyToolbar(localStorage.getItem(draftKey()) || html);
}

frame.addEventListener("load", () => {
  const editable = bindCanvas();
  if (editable) {
    // bindImageErrorHints 的预扫描可能在 load 回调前就报告了“图片加载失败”；
    // 只要画布内还有已标记失败的图，就保留该提示，不覆盖成“已加载”。
    if (!frame.contentDocument?.querySelector("img[data-resume-editor-img-hint]")) {
      status.textContent = "已加载";
    }
    updateOverflow();
  }
});
await reloadDocument();

function applyVersionInfo(info) {
  const chip = document.querySelector("#app-version");
  if (chip) chip.textContent = info.version || "unknown";
  const hint = document.querySelector("#app-version-hint");
  if (hint) {
    if (info.updateAvailable && info.latest) {
      hint.textContent = `发现新版本 ${info.latest}，请更新 CLI：npm install -g @chasen-liao/resume-skills@latest`;
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
  }
}
if (typeof EventSource !== "undefined") {
  const events = new EventSource("/api/events");
  events.onmessage = (event) => {
    if (event.data === "reload") {
      reloadDocument({ isHotReload: true });
    }
  };
  events.addEventListener("status", (event) => {
    const update = JSON.parse(event.data);
    status.textContent = update.message;
  });
  // 版本检查结算后服务端会广播，保证"有新版本"提示一定能出现
  events.addEventListener("version", (event) => {
    try {
      applyVersionInfo(JSON.parse(event.data));
    } catch {
      // 忽略损坏的版本事件
    }
  });
}
(async () => {
  try {
    const response = await fetch("/api/version");
    if (!response.ok) throw new Error(`version endpoint ${response.status}`);
    const info = await response.json();
    if (info && typeof info === "object") applyVersionInfo(info);
  } catch {
    // 版本信息不可用时保持默认占位，不打扰编辑
  }
})();
