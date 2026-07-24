const supportedTemplatesList = ["modern-minimal", "classic-business", "creative-bold", "japanese-minimal", "minimal-blue-business", "tech-dark"];
const legacyToolbar = /\s*<div\s+class=["']no-print-toolbar["'][\s\S]*?<\/div>\s*<\/div>/i;

export function stripLegacyToolbar(html) {
  return html.replace(legacyToolbar, "");
}

export function prepareEditorDocument(html) {
  if (typeof html !== "string" || !html.trim()) {
    throw new Error("HTML 内容为空或格式不正确。");
  }

  const templateMatch = html.match(/\bdata-resume-editor-template=["']([^"']+)["']/i);
  if (!templateMatch) {
    throw new Error("该 HTML 缺失 data-resume-editor-template 属性，无法在 ResumeSkills 编辑器中打开。");
  }

  const templateName = templateMatch[1];
  if (!supportedTemplatesList.includes(templateName)) {
    throw new Error(`不支持的模板类别 "${templateName}"，受支持的模板包括: ${supportedTemplatesList.join(", ")}。`);
  }

  const versionMatch = html.match(/\bdata-resume-editor-version=["']([^"']+)["']/i);
  if (!versionMatch || versionMatch[1] !== "1") {
    throw new Error("该 HTML 缺失 data-resume-editor-version=\"1\" 属性，版本不兼容。");
  }

  return stripLegacyToolbar(html);
}
