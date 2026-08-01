import { parse, serialize } from "parse5";
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
  if (node.content) validateSafeHtml(node.content);
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

export function validateEditorSave(sourceHtml, submittedHtml) {
  const sourceDocument = parse(prepareEditorDocument(sourceHtml));
  const submittedDocument = parse(prepareEditorDocument(submittedHtml));
  takeEditorOverrides(sourceDocument);
  const submittedOverrides = takeEditorOverrides(submittedDocument);

  if (serialize(sourceDocument) !== serialize(submittedDocument)) {
    throw new Error("Canvas 只能保存排版覆盖，不能修改事实内容或简历结构。请通过 Agent 工作流确认后重新生成 HTML。");
  }

  validateEditorOverrides(submittedOverrides, editorIds(sourceHtml));
  return prepareEditorDocument(submittedHtml);
}

function takeEditorOverrides(document) {
  const styles = [];
  visit(document, (node, parent) => {
    if (node.tagName === "style" && attribute(node, "id") === "resume-editor-overrides") {
      if (parent?.tagName !== "head") throw new Error("Canvas 排版覆盖格式不正确。");
      styles.push({ node, parent, css: textContent(node) });
    }
  });
  if (styles.length > 1) throw new Error("Canvas 排版覆盖格式不正确。");
  for (const { node, parent } of styles) parent.childNodes.splice(parent.childNodes.indexOf(node), 1);
  return styles[0]?.css || "";
}

function validateEditorOverrides(css, ids) {
  const content = css.replace(/\/\*\s*resume-editor-overrides\s*\*\//g, "").trim();
  if (!content) return;
  const rules = [...content.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  if (!rules.length || rules.map((match) => match[0]).join("").replace(/\s+/g, "") !== content.replace(/\s+/g, "")) {
    throw new Error("Canvas 排版覆盖格式不正确。");
  }
  for (const [, rawSelector, rawDeclarations] of rules) {
    const selector = rawSelector.trim();
    const declarations = rawDeclarations.split(";").map((item) => item.trim()).filter(Boolean);
    if (selector === ":root") {
      if (!declarations.length || !declarations.every((item) => /^(--page-margin:\s*\d+(?:\.\d+)?mm|--color-accent:\s*#[0-9a-f]{6})$/i.test(item))) throw new Error("Canvas 排版覆盖格式不正确。");
      continue;
    }
    const id = selector.match(/^\[data-resume-editor-id="([a-z0-9-]+)"\]$/)?.[1];
    if (!id || !ids.has(id) || declarations.length !== 1 || !validTextDeclaration(declarations[0])) {
      throw new Error("Canvas 排版覆盖格式不正确。");
    }
  }
}

function validTextDeclaration(declaration) {
  return [
    /^font-size:\s*\d+(?:\.\d+)?px\s*!important$/,
    /^font-weight:\s*(?:400|500|600|700)\s*!important$/,
    /^color:\s*#[0-9a-f]{6}\s*!important$/i,
    /^text-align:\s*(?:left|center|right)\s*!important$/,
    /^line-height:\s*\d+(?:\.\d+)?\s*!important$/,
    /^margin-bottom:\s*\d+(?:\.\d+)?px\s*!important$/,
  ].some((pattern) => pattern.test(declaration));
}

function editorIds(html) {
  const ids = new Set();
  visit(parse(html), (node) => {
    const id = attribute(node, "data-resume-editor-id");
    if (id) ids.add(id);
  });
  return ids;
}

function visit(node, callback, parent = undefined) {
  if (node.tagName) callback(node, parent);
  for (const child of node.childNodes || []) visit(child, callback, node);
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function textContent(node) {
  return (node.childNodes || []).filter((child) => child.nodeName === "#text").map((child) => child.value).join("");
}
