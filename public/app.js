import { stripLegacyToolbar } from "/editor-document.js";
import { appendOverrideRule, controlEventTypes } from "/editor-controls.js";

const frame = document.querySelector("#resume-frame");
const status = document.querySelector("#save-status");
const selectionName = document.querySelector("#selection-name");
const controls = Object.fromEntries(["font-size", "font-weight", "font-color", "text-align", "line-height", "margin-bottom", "page-margin", "accent-color"].map((id) => [id, document.querySelector(`#${id}`)]));
let selected;
let documentId;
let sourceName;

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
  doc.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}
function saveDraft() {
  localStorage.setItem(draftKey(), serializedHtml());
  status.textContent = "草稿已保存在此浏览器";
  updateOverflow();
}
function select(element) {
  if (selected) selected.removeAttribute("data-resume-editor-selected");
  selected = element;
  selected.setAttribute("data-resume-editor-selected", "true");
  selectionName.textContent = selected.textContent.trim().slice(0, 42) || "已选择空文本";
  // CSS spring feedback
  selectionName.classList.remove("animate-pop");
  void selectionName.offsetWidth;
  selectionName.classList.add("animate-pop");
}
function assignFallbackEditorIds(doc) {
  const selector = [
    "h1", "h2", "h3", "p", "li", ".job-title", ".header-contacts > div",
    ".education-line > div", ".item-title", ".item-meta", ".skill-badge",
    ".summary-block", ".info-value", ".experience-time", ".experience-org",
    ".experience-role", ".experience-sub-info",
  ].join(",");
  let index = 1;
  doc.querySelectorAll(selector).forEach((node) => {
    if (!node.dataset.resumeEditorId && node.textContent.trim()) {
      node.dataset.resumeEditorId = `template-text-${index}`;
      index += 1;
    }
  });
}
function bindCanvas() {
  const doc = frame.contentDocument;
  assignFallbackEditorIds(doc);
  doc.head.insertAdjacentHTML("beforeend", "<style id=\"resume-editor-chrome\">[data-resume-editor-id]{cursor:text}[data-resume-editor-selected]{outline:2px solid #2563eb;outline-offset:2px}</style>");
  doc.querySelectorAll("[data-resume-editor-id]").forEach((node) => {
    node.addEventListener("click", (event) => { event.stopPropagation(); select(node); });
    node.addEventListener("dblclick", () => { select(node); node.setAttribute("contenteditable", "true"); node.focus(); });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { node.blur(); node.removeAttribute("contenteditable"); }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { node.blur(); node.removeAttribute("contenteditable"); saveDraft(); }
    });
    node.addEventListener("blur", () => { node.removeAttribute("contenteditable"); saveDraft(); });
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
  doc.querySelectorAll("[contenteditable], [data-resume-editor-selected], #resume-editor-chrome").forEach((node) => {
    if (node.id === "resume-editor-chrome") node.remove(); else { node.removeAttribute("contenteditable"); node.removeAttribute("data-resume-editor-selected"); }
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
