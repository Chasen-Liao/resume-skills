import { stripLegacyToolbar } from "/editor-toolbar.js";
import { appendOverrideRule, computedControlValues, configureSelectionTarget, createDraftController, restoreSelectedDefaults, rovingSelectionTargets, selectFromPointer, setRovingTabStop, setSelectionPressed, upsertRootToken } from "/editor-controls.js";

const frame = document.querySelector("#resume-frame");
const status = document.querySelector("#save-status");
const selectionName = document.querySelector("#selection-name");
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
  const doc = frame.contentDocument;
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
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
function select(element) {
  if (selected) {
    selected.removeAttribute("data-resume-editor-selected");
    setSelectionPressed(selected, false);
  }
  selected = element;
  selected.setAttribute("data-resume-editor-selected", "true");
  setSelectionPressed(selected, true);
  if (selectionTargets.includes(selected)) setRovingTabStop(selectionTargets, selected);
  selectionName.textContent = selected.textContent.trim().slice(0, 42) || "已选择空文本";
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
}
function finishTextEdit(node, save = true) {
  node.removeAttribute("contenteditable");
  delete node.dataset.resumeEditorOriginalText;
  if (save) {
    status.textContent = "文字已修改；保存后请重新确认事实并验证 PDF。";
    saveDraft(true);
  }
}
function beginTextEdit(node) {
  select(node);
  node.dataset.resumeEditorOriginalText = node.textContent;
  node.setAttribute("contenteditable", "plaintext-only");
  node.focus();
  status.textContent = "正在编辑文字；仅允许纯文本，Ctrl/Cmd+Enter 完成。";
}
function moveFocus(nodes, current, direction) {
  const index = nodes.indexOf(current);
  const next = nodes[(index + direction + nodes.length) % nodes.length];
  setRovingTabStop(nodes, next);
  next.focus();
}
function bindCanvas() {
  const doc = frame.contentDocument;
  doc.head.insertAdjacentHTML("beforeend", "<style id=\"resume-editor-chrome\">[data-resume-editor-id]{cursor:pointer}[data-resume-editor-id]:focus-visible{outline:2px solid #2563eb;outline-offset:2px}[data-resume-editor-selected]{outline:2px solid #2563eb;outline-offset:2px}</style>");
  const allNodes = [...doc.querySelectorAll("[data-resume-editor-id]")];
  const nodes = selectionTargets = rovingSelectionTargets(allNodes);
  allNodes.forEach((node) => {
    const index = nodes.indexOf(node);
    if (index !== -1) configureSelectionTarget(node, index);
    node.addEventListener("click", (event) => selectFromPointer(event, node, select));
    node.addEventListener("dblclick", () => beginTextEdit(node));
    node.addEventListener("blur", () => { if (node.isContentEditable) finishTextEdit(node); });
    node.addEventListener("keydown", (event) => {
      if (node.isContentEditable) {
        if (event.key === "Escape") {
          event.preventDefault();
          node.textContent = node.dataset.resumeEditorOriginalText || node.textContent;
          finishTextEdit(node, false);
        } else if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          finishTextEdit(node);
        }
        return;
      }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(node); }
      if (event.key === "Escape") { event.preventDefault(); clearSelection(); }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); moveFocus(nodes, node, 1); }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); moveFocus(nodes, node, -1); }
    });
  });
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
    node.removeAttribute("tabindex");
    node.removeAttribute("role");
    node.removeAttribute("aria-pressed");
  });
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

frame.addEventListener("load", () => { bindCanvas(); status.textContent = "已加载"; updateOverflow(); });
await reloadDocument();

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
}
