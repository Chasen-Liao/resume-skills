import { parse } from "parse5";
import { stripLegacyToolbar } from "./editor-toolbar.mjs";
import { editorBlockChildTagNames, editorContainerClassNames, editorContainerTagNames, editorRuntimeInjectedAttributeNames } from "./editor-rules.mjs";

export { stripLegacyToolbar } from "./editor-toolbar.mjs";

const supportedTemplatesList = ["modern-minimal", "classic-business", "creative-bold", "japanese-minimal", "minimal-blue-business", "tech-dark"];
const blockedElementNames = new Set(["applet", "embed", "fencedframe", "frame", "frameset", "iframe", "object", "portal", "script"]);
const urlAttributeNames = new Set(["action", "formaction", "href", "src", "xlink:href"]);
// 规则集合来自 lib/editor-rules.mjs（与 public/app.js 共用同一事实源，禁止在此处另行定义）。
const editorContainerTagNameSet = new Set(editorContainerTagNames);
const editorContainerClassNameSet = new Set(editorContainerClassNames);
const blockChildTagNameSet = new Set(editorBlockChildTagNames);
const editorRuntimeInjectedAttributeNameSet = new Set(editorRuntimeInjectedAttributeNames);
const extensionInjectionMarkerPattern = /grammarly|immersive[-_ ]?translate|language[-_ ]?tool|deepl|quillbot|prowritingaid|microsoft[-_ ]?editor|extension|plugin|overlay|toolbar/i;

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

export function validateEditorFields(html) {
  if (typeof html !== "string" || !html.trim()) {
    throw new Error("HTML 内容为空或格式不正确。");
  }

  const document = parse(html);
  const marked = [];
  visit(document, (node) => {
    const id = attribute(node, "data-resume-editor-id");
    if (id) marked.push({ node, id });
  });

  const problems = [];
  if (marked.length === 0) {
    problems.push("未找到任何可编辑字段：正文没有任何 data-resume-editor-id（必须至少 1 个可独立编辑的文本字段；不要给容器加一个兜底 ID）");
  }

  const markedNodes = new Set(marked.map((item) => item.node));
  const seenIds = new Set();
  for (const { node, id } of marked) {
    if (seenIds.has(id)) {
      problems.push(`重复 data-resume-editor-id "${id}"`);
      continue;
    }
    seenIds.add(id);

    const structureProblem = editorFieldStructureProblem(node, markedNodes);
    if (structureProblem) problems.push(`${structureProblem}（字段：${describeField(node, id)}）`);
  }

  if (problems.length === 0) return;
  throw new Error(`简历可编辑字段校验失败（${problems.length} 个问题）：\n- ${problems.join("\n- ")}\n定位命令：rg -n \"data-resume-editor-id\" <resume.html>`);
}

// 返回第一个结构性问题；无问题返回 null。
function editorFieldStructureProblem(node, markedNodes) {
  const tag = node.tagName;
  if (editorContainerTagNameSet.has(tag)) {
    return `容器 <${tag}> 不应携带编辑 ID（容器级 ID 会把整块内容当作单个字段，编辑即破坏版面）`;
  }
  const classes = (attribute(node, "class") || "").split(/\s+/).filter(Boolean);
  const containerClass = classes.find((name) => editorContainerClassNameSet.has(name));
  if (containerClass) {
    return `容器 .${containerClass} 不应携带编辑 ID（容器级 ID 会把整块内容当作单个字段，编辑即破坏版面）`;
  }
  const nonTextChildren = (node.childNodes || []).filter((child) => child.nodeName !== "#text" && child.nodeName !== "#comment");
  const blockChild = nonTextChildren.find((child) => blockChildTagNameSet.has(child.tagName));
  if (blockChild) {
    return `元素 <${tag}> 含块级子元素 <${blockChild.tagName}>，不是叶子文本字段`;
  }
  if (nonTextChildren.length > 1) {
    return `元素 <${tag}> 含 ${nonTextChildren.length} 个子节点（最多允许文本加 1 个行内子节点，如单个 <a> 链接），不是叶子文本字段`;
  }
  const nestedProblem = nestedInlineFieldProblem(node, markedNodes);
  if (nestedProblem) return nestedProblem;
  return null;
}

// 允许的嵌套：复合字段（父元素自身只有 1 个行内子节点）内含行内叶子子字段；
// 块级嵌套、多子节点父字段内的嵌套一律拒绝。
// 注意：自身“含块级子元素/含多个子节点”已在 editorFieldStructureProblem 前置判定，
// 此处不再重复检查（保留死代码会造成两份文案误导）。
function nestedInlineFieldProblem(node, markedNodes) {
  let ancestor = null;
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (markedNodes.has(parent)) {
      ancestor = parent;
      break;
    }
  }
  if (!ancestor) return null;
  if (blockChildTagNameSet.has(node.tagName)) {
    return "编辑字段不能嵌套在另一个编辑字段内部（块级元素不能作为嵌套编辑字段）";
  }
  const ancestorNonText = (ancestor.childNodes || []).filter((child) => child.nodeName !== "#text" && child.nodeName !== "#comment");
  if (ancestorNonText.length > 1) {
    return "编辑字段不能嵌套在另一个编辑字段内部（父字段包含多个行内子节点，不是单个复合字段）";
  }
  return null;
}

function describeField(node, id) {
  return `${describeElement(node)} data-resume-editor-id="${id}"`;
}

// 元素标签 + class + 前 40 字文本片段，供校验/保存错误消息使用（describeField 复用本函数）。
function describeElement(node) {
  const tag = node.tagName;
  const classes = (attribute(node, "class") || "").split(/\s+/).filter(Boolean);
  const label = classes.length ? `<${tag} class="${classes.join(" ")}">` : `<${tag}>`;
  const snippet = textContent(node).trim();
  return snippet ? `${label}（文本"${snippet.slice(0, 40)}"）` : label;
}

export function validateEditorSave(sourceHtml, submittedHtml) {
  const sourcePrepared = prepareEditorDocument(sourceHtml);
  const submittedPrepared = prepareEditorDocument(submittedHtml);
  const sourceDocument = parse(sourcePrepared);
  const submittedDocument = parse(submittedPrepared, { sourceCodeLocationInfo: true });
  const sourceIds = editorIds(sourceHtml);
  const submittedIds = editorIds(submittedHtml);
  takeEditorOverrides(sourceDocument);
  const submittedOverrides = takeEditorOverrides(submittedDocument);

  if (sourceIds.size !== submittedIds.size || [...sourceIds].some((id) => !submittedIds.has(id))) {
    throw new Error("Canvas 不能新增、删除或重复编辑字段。");
  }

  const normalizedHtml = normalizeSubmittedHtml(sourceDocument, submittedDocument, submittedPrepared);
  const normalizedDocument = parse(normalizedHtml);
  takeEditorOverrides(normalizedDocument);
  assertEditableDocument(sourceDocument, normalizedDocument);

  validateEditorOverrides(submittedOverrides, sourceIds);
  return stripUnexpectedRootDataAttributes(sourcePrepared, normalizedHtml);
}

// 浏览器扩展和 contenteditable fallback 可能在已有编辑字段中插入属性、透明 span
// 或隐藏辅助文字。只清理可以确定为运行时噪声的变化；可见语义节点仍交给严格比较拦截。
function normalizeSubmittedHtml(sourceDocument, submittedDocument, submittedHtml) {
  const sourceAttributeCounts = normalizableAttributeCounts(sourceDocument);
  const sourceHiddenNodes = hiddenNodeCounts(sourceDocument);
  const sourceHasTransparentSpan = hasTransparentSpan(sourceDocument);
  const actions = [];

  walkForSaveNormalization(submittedDocument, (node, editableText) => {
    if (!node.tagName) return;
    const location = node.sourceCodeLocation;
    if (!location) return;
    const inEditableField = editableText || Boolean(attribute(node, "data-resume-editor-id"));

    if (isExtensionInjectedNode(node) && !inEditableField) {
      if (location.endOffset != null) actions.push({ start: location.startOffset, end: location.endOffset, priority: 4 });
      return;
    }

    if (inEditableField && node.tagName === "br") {
      if (location.endOffset != null) actions.push({ start: location.startOffset, end: location.endOffset, replacement: "\n", priority: 3 });
      return;
    }

    if (isDeterministicallyHidden(node)) {
      const key = hiddenNodeKey(node);
      const remaining = sourceHiddenNodes.get(key) || 0;
      if (remaining > 0) {
        sourceHiddenNodes.set(key, remaining - 1);
      } else if (location.endOffset != null) {
        actions.push({ start: location.startOffset, end: location.endOffset, priority: 3 });
        return;
      }
    }

    const transparent = inEditableField && isNonSemanticWrapper(node) && !sourceHasTransparentSpan;
    if (transparent && location.startTag && location.endTag) {
      actions.push({ start: location.startTag.startOffset, end: location.startTag.endOffset, priority: 2 });
      actions.push({ start: location.endTag.startOffset, end: location.endTag.endOffset, priority: 2 });
    }

    for (const attr of node.attrs || []) {
      if (!shouldNormalizeAttribute(attr.name, node, inEditableField, sourceAttributeCounts)) continue;
      const attrLocation = location.startTag?.attrs?.[attr.name];
      if (!attrLocation) continue;
      let start = attrLocation.startOffset;
      while (start > location.startTag.startOffset && /\s/.test(submittedHtml[start - 1])) start -= 1;
      actions.push({ start, end: attrLocation.endOffset, priority: 1 });
    }
  });

  return applySourceRanges(submittedHtml, actions);
}

function walkForSaveNormalization(node, callback, editableText = false) {
  if (node.tagName) {
    callback(node, editableText);
    editableText = editableText || Boolean(attribute(node, "data-resume-editor-id"));
  }
  for (const child of node.childNodes || []) walkForSaveNormalization(child, callback, editableText);
  if (node.content) walkForSaveNormalization(node.content, callback, editableText);
}

function shouldNormalizeAttribute(name, node, inEditableField, sourceAttributeCounts) {
  if (editorRuntimeInjectedAttributeNameSet.has(name)) return true;
  if (name === "data-resume-editor-id") return false;
  if (node.tagName === "html" && (name === "data-resume-editor-template" || name === "data-resume-editor-version")) return false;
  if (!isLikelyExtensionAttribute(name) || (name === "style" && inEditableField)) return false;
  const key = `${name}\\u0000${attribute(node, name)}`;
  const remaining = sourceAttributeCounts.get(key) || 0;
  if (remaining > 0) {
    sourceAttributeCounts.set(key, remaining - 1);
    return false;
  }
  return true;
}

function isLikelyExtensionAttribute(name) {
  return name.startsWith("data-") || name.startsWith("aria-") || ["class", "dir", "id", "lang", "style", "title"].includes(name);
}

function isExtensionInjectedNode(node) {
  if (["html", "head", "body"].includes(node.tagName) || attribute(node, "data-resume-editor-id")) return false;
  const marker = [node.tagName, ...(node.attrs || []).flatMap(({ name, value }) => [name, value])].join(" ");
  return extensionInjectionMarkerPattern.test(marker);
}

function isNonSemanticWrapper(node) {
  if (!["span", "font"].includes(node.tagName) || attribute(node, "data-resume-editor-id")) return false;
  const attributes = node.attrs || [];
  if (extensionInjectionMarkerPattern.test(attributes.flatMap(({ name, value }) => [name, value]).join(" "))) return true;
  if (node.tagName === "font") return /^\s*vertical-align\s*:\s*inherit\s*;?\s*$/i.test(attribute(node, "style") || "");
  return attributes.every(({ name }) => editorRuntimeInjectedAttributeNameSet.has(name) || name.startsWith("data-"));
}

function isDeterministicallyHidden(node) {
  if (attribute(node, "hidden") !== undefined) return true;
  if ((attribute(node, "aria-hidden") || "").toLowerCase() === "true") return true;
  const style = attribute(node, "style") || "";
  return /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse))(?:\s*!important)?\s*(?:;|$)/i.test(style);
}

function normalizableAttributeCounts(document) {
  const counts = new Map();
  visit(document, (node) => {
    for (const { name, value } of node.attrs || []) {
      if (!isLikelyExtensionAttribute(name)) continue;
      const key = `${name}\\u0000${value}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  });
  return counts;
}

function hiddenNodeCounts(document) {
  const counts = new Map();
  walkForSaveNormalization(document, (node) => {
    if (!isDeterministicallyHidden(node)) return;
    const key = hiddenNodeKey(node);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function hiddenNodeKey(node) {
  return `${node.tagName}\\u0000${fullTextContent(node)}`;
}

function hasTransparentSpan(document) {
  let found = false;
  walkForSaveNormalization(document, (node, editableText) => {
    if (editableText && isNonSemanticWrapper(node)) found = true;
  });
  return found;
}

function fullTextContent(node) {
  let result = "";
  for (const child of node.childNodes || []) {
    if (child.nodeName === "#text") result += child.value;
    else result += fullTextContent(child);
  }
  return result;
}

function applySourceRanges(html, ranges) {
  const selected = [];
  for (const range of [...ranges].sort((left, right) => right.priority - left.priority || left.start - right.start)) {
    if (selected.some((item) => range.start < item.end && item.start < range.end)) continue;
    selected.push(range);
  }
  return selected
    .sort((left, right) => right.start - left.start)
    .reduce((result, { start, end, replacement = "" }) => `${result.slice(0, start)}${replacement}${result.slice(end)}`, html);
}

function assertEditableDocument(sourceNode, submittedNode, editableText = false) {
  if (sourceNode.nodeName !== submittedNode.nodeName) {
    throw new Error("Canvas 只能编辑已有文字，不能修改简历结构。");
  }
  if (sourceNode.nodeName === "#text" || sourceNode.nodeName === "#comment") {
    if (!editableText && sourceNode.value !== submittedNode.value) {
      throw new Error("Canvas 只能编辑已有文字，不能修改未标记内容。");
    }
    return;
  }
  if (sourceNode.tagName) {
    const difference = firstAttributeDifference(sourceNode, submittedNode);
    if (difference) {
      const { name, kind, values } = difference;
      const shown = kind === "新增" ? `提交="${values.submitted}"` : kind === "缺失" ? `源文件="${values.source}"` : `源文件="${values.source}" 提交="${values.submitted}"`;
      throw new Error(`Canvas 只能编辑已有文字，不能修改 HTML 属性或结构：元素 ${describeElement(sourceNode)}，属性 ${name} ${kind}（${shown}）。`);
    }
  }
  const nextEditableText = editableText || Boolean(attribute(sourceNode, "data-resume-editor-id"));
  const sourceChildren = sourceNode.childNodes || [];
  const submittedChildren = submittedNode.childNodes || [];
  if (sourceChildren.length !== submittedChildren.length) {
    throw new Error("Canvas 只能编辑已有文字，不能修改简历结构。");
  }
  sourceChildren.forEach((child, index) => assertEditableDocument(child, submittedChildren[index], nextEditableText));
}

// 返回归一化后第一个真实属性差异（或 null）。运行时属性和确定的扩展噪声已在归一化阶段移除；
// html 根上的新增 data-* 仍视为浏览器扩展噪声，保存返回值时会从原始字符串中局部移除。
// style 仅在一侧出现时忽略（容忍运行时注入，源模板应合法携带内联 style），两侧都有则去全部
// 空白后比较；其余属性任何新增/缺失/变更都是真实差异。
function firstAttributeDifference(sourceNode, submittedNode) {
  const sourceAttrs = attrsToMap(sourceNode);
  const submittedAttrs = attrsToMap(submittedNode);
  const names = new Set([...sourceAttrs.keys(), ...submittedAttrs.keys()]);
  for (const name of names) {
    if (editorRuntimeInjectedAttributeNameSet.has(name)) continue;
    if (sourceNode.tagName === "html" && name.startsWith("data-") && !sourceAttrs.has(name)) continue;
    if (name === "style") {
      if (sourceAttrs.has(name) && submittedAttrs.has(name)) {
        const sourceValue = sourceAttrs.get(name);
        const submittedValue = submittedAttrs.get(name);
        if (sourceValue.replace(/\s+/g, "") !== submittedValue.replace(/\s+/g, "")) {
          return { name, kind: "不一致", values: { source: sourceValue, submitted: submittedValue } };
        }
      }
      continue;
    }
    if (!sourceAttrs.has(name)) return { name, kind: "新增", values: { source: "", submitted: submittedAttrs.get(name) } };
    if (!submittedAttrs.has(name)) return { name, kind: "缺失", values: { source: sourceAttrs.get(name), submitted: "" } };
    const sourceValue = sourceAttrs.get(name);
    const submittedValue = submittedAttrs.get(name);
    if (sourceValue !== submittedValue) return { name, kind: "不一致", values: { source: sourceValue, submitted: submittedValue } };
  }
  return null;
}

function takeEditorOverrides(document) {
  const styles = [];
  visit(document, (node, parent) => {
    if (node.tagName === "style" && attribute(node, "id") === "resume-editor-overrides") {
      if (parent?.tagName !== "head") throw new Error("Canvas 排版覆盖格式不正确。");
      if (node.attrs.length !== 1) throw new Error("Canvas 排版覆盖格式不正确。");
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
    if (!id) return;
    if (ids.has(id)) throw new Error(`Canvas 排版覆盖格式不正确：重复 data-resume-editor-id "${id}"。`);
    ids.add(id);
  });
  return ids;
}

function visit(node, callback, parent = undefined) {
  if (node.tagName) callback(node, parent);
  for (const child of node.childNodes || []) visit(child, callback, node);
  if (node.content) visit(node.content, callback, node);
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function attrsToMap(node) {
  return new Map((node.attrs || []).map(({ name, value }) => [name, value]));
}

// 内容脚本常把翻译/阅读辅助状态写成 html 根上的 data-* 属性。不要把这类
// 非编辑内容写回简历；用 parse5 的源码位置做局部删除，避免重新序列化整个 HTML。
function stripUnexpectedRootDataAttributes(sourceHtml, submittedHtml) {
  const sourceRoot = findHtmlRoot(parse(sourceHtml));
  const submittedDocument = parse(submittedHtml, { sourceCodeLocationInfo: true });
  const submittedRoot = findHtmlRoot(submittedDocument);
  if (!sourceRoot || !submittedRoot?.sourceCodeLocation?.startTag?.attrs) return submittedHtml;

  const sourceAttributeNames = new Set((sourceRoot.attrs || []).map(({ name }) => name));
  const ranges = (submittedRoot.attrs || [])
    .filter(({ name }) => name.startsWith("data-") && !sourceAttributeNames.has(name))
    .map(({ name }) => submittedRoot.sourceCodeLocation.startTag.attrs[name])
    .filter(Boolean)
    .map(({ startOffset, endOffset }) => {
      let start = startOffset;
      while (start > submittedRoot.sourceCodeLocation.startTag.startOffset && /\s/.test(submittedHtml[start - 1])) start -= 1;
      return { start, end: endOffset };
    })
    .sort((left, right) => right.start - left.start);

  let clean = submittedHtml;
  for (const { start, end } of ranges) clean = `${clean.slice(0, start)}${clean.slice(end)}`;
  return clean;
}

function findHtmlRoot(document) {
  return document.childNodes?.find((node) => node.tagName === "html");
}

function textContent(node) {
  return (node.childNodes || []).filter((child) => child.nodeName === "#text").map((child) => child.value).join("");
}
