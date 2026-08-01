import { parse } from "parse5";
import { stripLegacyToolbar } from "./editor-toolbar.mjs";

export { stripLegacyToolbar } from "./editor-toolbar.mjs";

const supportedTemplatesList = ["modern-minimal", "classic-business", "creative-bold", "japanese-minimal", "minimal-blue-business", "tech-dark"];
const blockedElementNames = new Set(["applet", "embed", "fencedframe", "frame", "frameset", "iframe", "object", "portal", "script"]);
const urlAttributeNames = new Set(["action", "formaction", "href", "src", "xlink:href"]);

function isJavaScriptUrl(value) {
  return value.replace(/[\u0000-\u0020]/g, "").toLowerCase().startsWith("javascript:");
}

function validateSafeHtml(node) {
  if (blockedElementNames.has(node.tagName)) {
    throw new Error(`不安全的 HTML：不允许 <${node.tagName}> 标签。`);
  }
  for (const attribute of node.attrs || []) {
    if (/^on[a-z]/i.test(attribute.name)) {
      throw new Error(`不安全的 HTML：不允许事件属性 ${attribute.name}。`);
    }
    if (urlAttributeNames.has(attribute.name) && isJavaScriptUrl(attribute.value)) {
      throw new Error("不安全的 HTML：不允许 javascript: URL。");
    }
  }
  for (const child of node.childNodes || []) validateSafeHtml(child);
}

export function prepareEditorDocument(html) {
  if (typeof html !== "string" || !html.trim()) {
    throw new Error("HTML 内容为空或格式不正确。");
  }

  const document = parse(html);
  validateSafeHtml(document);
  const htmlTag = document.childNodes.find((node) => node.tagName === "html");
  const attributes = new Map(htmlTag?.attrs.map((attribute) => [attribute.name, attribute.value]));
  const templateName = attributes.get("data-resume-editor-template");
  if (!templateName) {
    throw new Error("该 HTML 的 <html> 开始标签缺失 data-resume-editor-template 属性，无法在 ResumeSkills 编辑器中打开。");
  }

  if (!supportedTemplatesList.includes(templateName)) {
    throw new Error(`不支持的模板类别 "${templateName}"，受支持的模板包括: ${supportedTemplatesList.join(", ")}。`);
  }

  if (attributes.get("data-resume-editor-version") !== "1") {
    throw new Error("该 HTML 的 <html> 开始标签缺失 data-resume-editor-version=\"1\" 属性，版本不兼容。");
  }

  return stripLegacyToolbar(html).replace(/\sdata-editor-selected(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "");
}
