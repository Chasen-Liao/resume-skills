const supportedTemplatesList = ["modern-minimal", "classic-business", "creative-bold", "japanese-minimal", "minimal-blue-business", "tech-dark"];
const legacyToolbar = /\s*<div\s+class=["']no-print-toolbar["'][\s\S]*?<\/div>\s*<\/div>/i;
const blockedElementNames = new Set(["applet", "embed", "fencedframe", "frame", "frameset", "iframe", "object", "portal", "script"]);
const urlAttributeNames = new Set(["action", "formaction", "href", "src", "xlink:href"]);

function readTagEnd(html, start) {
  let quote = null;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return -1;
}

function parseStartTag(tagSource) {
  const tagMatch = tagSource.match(/^<\s*([A-Za-z][\w:-]*)\b/);
  if (!tagMatch) return null;

  const attributes = new Map();
  let index = tagMatch[0].length;
  while (index < tagSource.length - 1) {
    while (/\s/.test(tagSource[index])) index += 1;
    if (tagSource[index] === "/" || tagSource[index] === ">") break;

    const nameStart = index;
    while (index < tagSource.length && !/[\s=/>]/.test(tagSource[index])) index += 1;
    const name = tagSource.slice(nameStart, index).toLowerCase();
    if (!name) break;

    while (/\s/.test(tagSource[index])) index += 1;
    let value = "";
    if (tagSource[index] === "=") {
      index += 1;
      while (/\s/.test(tagSource[index])) index += 1;
      const quote = tagSource[index];
      if (quote === '"' || quote === "'") {
        const valueStart = ++index;
        while (index < tagSource.length && tagSource[index] !== quote) index += 1;
        value = tagSource.slice(valueStart, index);
        if (tagSource[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (index < tagSource.length && !/[\s>]/.test(tagSource[index])) index += 1;
        value = tagSource.slice(valueStart, index);
      }
    }
    if (!attributes.has(name)) attributes.set(name, value);
  }
  return { name: tagMatch[1].toLowerCase(), attributes };
}

function scanStartTags(html) {
  const tags = [];
  let index = 0;
  while (index < html.length) {
    const start = html.indexOf("<", index);
    if (start < 0) break;
    if (html.startsWith("<!--", start)) {
      const commentEnd = html.indexOf("-->", start + 4);
      index = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }
    const end = readTagEnd(html, start + 1);
    if (end < 0) break;
    const tag = parseStartTag(html.slice(start, end + 1));
    if (tag) tags.push(tag);
    index = end + 1;
  }
  return tags;
}

function isJavaScriptUrl(value) {
  return value.replace(/[\u0000-\u0020]/g, "").toLowerCase().startsWith("javascript:");
}

function validateSafeHtml(html) {
  for (const tag of scanStartTags(html)) {
    if (blockedElementNames.has(tag.name)) {
      throw new Error(`不安全的 HTML：不允许 <${tag.name}> 标签。`);
    }
    for (const [name, value] of tag.attributes) {
      if (/^on[a-z]/i.test(name)) {
        throw new Error(`不安全的 HTML：不允许事件属性 ${name}。`);
      }
      if (urlAttributeNames.has(name) && isJavaScriptUrl(value)) {
        throw new Error("不安全的 HTML：不允许 javascript: URL。");
      }
    }
  }
}

function findHtmlStartTag(html) {
  return scanStartTags(html).find((tag) => tag.name === "html");
}

export function stripLegacyToolbar(html) {
  return html.replace(legacyToolbar, "");
}

export function prepareEditorDocument(html) {
  if (typeof html !== "string" || !html.trim()) {
    throw new Error("HTML 内容为空或格式不正确。");
  }

  validateSafeHtml(html);
  const htmlTag = findHtmlStartTag(html);
  const templateName = htmlTag?.attributes.get("data-resume-editor-template");
  if (!templateName) {
    throw new Error("该 HTML 的 <html> 开始标签缺失 data-resume-editor-template 属性，无法在 ResumeSkills 编辑器中打开。");
  }

  if (!supportedTemplatesList.includes(templateName)) {
    throw new Error(`不支持的模板类别 "${templateName}"，受支持的模板包括: ${supportedTemplatesList.join(", ")}。`);
  }

  if (htmlTag.attributes.get("data-resume-editor-version") !== "1") {
    throw new Error("该 HTML 的 <html> 开始标签缺失 data-resume-editor-version=\"1\" 属性，版本不兼容。");
  }

  return stripLegacyToolbar(html).replace(/\sdata-editor-selected(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "");
}
