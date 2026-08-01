import { stripLegacyToolbar } from "/editor-toolbar.js";
import { appendOverrideRule, configureSelectionTarget, controlEventTypes, rovingSelectionTargets, selectFromPointer, setRovingTabStop, setSelectionPressed } from "/editor-controls.js";

const frame = document.querySelector("#resume-frame");
const status = document.querySelector("#save-status");
const selectionName = document.querySelector("#selection-name");
const controls = Object.fromEntries(["font-size", "font-weight", "font-color", "text-align", "line-height", "margin-bottom", "page-margin", "accent-color"].map((id) => [id, document.querySelector(`#${id}`)]));
let selected;
let documentId;
let sourceName;
let selectionTargets = [];

function draftKey() { return `resume-editor:draft:${documentId}`; }
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
function setRule(element, property, value) {
  const doc = frame.contentDocument;
  const style = ensureRules(doc);
  style.textContent = appendOverrideRule(style.textContent, element.dataset.resumeEditorId, property, value);
  saveDraft();
}
function setRootToken(token, value) {
  const doc = frame.contentDocument;
  const style = ensureRules(doc);
  const rootRule = /:root\s*\{([^}]*)\}/s;
  if (rootRule.test(style.textContent)) {
    style.textContent = style.textContent.replace(rootRule, (match, body) => `:root { ${body} ${token}: ${value}; }`);
  } else {
    style.textContent += `:root { ${token}: ${value}; }\n`;
  }
  saveDraft();
}
function serializedHtml() {
  const doc = frame.contentDocument;
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
function saveDraft() {
  localStorage.setItem(draftKey(), serializedHtml());
  status.textContent = "草稿已保存在此浏览器";
  updateOverflow();
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
}
function clearSelection() {
  if (!selected) return;
  selected.removeAttribute("data-resume-editor-selected");
  setSelectionPressed(selected, false);
  selected = undefined;
  selectionName.textContent = "请选择一段文字";
}
function showFactConfirmation() {
  status.textContent = "事实内容只能通过 Agent 工作流确认后重新生成 HTML。";
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
    node.addEventListener("dblclick", () => { select(node); showFactConfirmation(); });
    node.addEventListener("keydown", (event) => {
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
    node.removeAttribute("tabindex");
    node.removeAttribute("role");
    node.removeAttribute("aria-pressed");
  });
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
function bindControl(control, handler) {
  controlEventTypes.forEach((eventType) => control.addEventListener(eventType, handler));
}
Object.entries({ "font-size": (v) => setRule(selected, "font-size", `${v}px`), "font-weight": (v) => v && setRule(selected, "font-weight", v), "font-color": (v) => setRule(selected, "color", v), "text-align": (v) => v && setRule(selected, "text-align", v), "line-height": (v) => setRule(selected, "line-height", v), "margin-bottom": (v) => setRule(selected, "margin-bottom", `${v}px`) }).forEach(([id, action]) => bindControl(controls[id], () => { if (selected) action(controls[id].value); }));
bindControl(controls["page-margin"], () => setRootToken("--page-margin", `${controls["page-margin"].value}mm`));
bindControl(controls["accent-color"], () => setRootToken("--color-accent", controls["accent-color"].value));

// Sync ranges with number inputs
document.querySelectorAll(".sync-slider").forEach(slider => {
  const targetId = slider.dataset.target;
  const numInput = controls[targetId] || document.getElementById(targetId);
  if (numInput) {
    slider.addEventListener("input", (e) => {
      numInput.value = e.target.value;
      numInput.dispatchEvent(new Event("input"));
    });
    numInput.addEventListener("input", (e) => {
      slider.value = e.target.value;
    });
  }
});
document.querySelector("#save-html").addEventListener("click", async () => {
  const response = await fetch("/api/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ html: cleanForExport() }) });
  const result = await response.json();
  status.textContent = response.ok ? `已成功保存 ${result.outputName}` : `保存失败：${result.error}`;
});
document.querySelector("#print-pdf").addEventListener("click", () => frame.contentWindow.print());
window.addEventListener("beforeunload", (event) => { if (localStorage.getItem(draftKey())) { event.preventDefault(); event.returnValue = ""; } });
async function reloadDocument({ isHotReload = false } = {}) {
  const response = await fetch("/api/document");
  const { html, documentId: id, sourceName: name } = await response.json();
  documentId = id;
  sourceName = name;
  document.querySelector("#source-name").textContent = sourceName;
  if (isHotReload) {
    localStorage.removeItem(draftKey());
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
}
