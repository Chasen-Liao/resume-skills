const supportedTemplates = "modern-minimal|classic-business|creative-bold|japanese-minimal|minimal-blue-business|tech-dark";
const protocol = new RegExp(`<html\\b[^>]*data-resume-editor-template=["'](?:${supportedTemplates})["'][^>]*data-resume-editor-version=["']1["']`, "i");
const legacyToolbar = /\s*<div\s+class=["']no-print-toolbar["'][\s\S]*?<\/div>\s*<\/div>/i;

export function stripLegacyToolbar(html) {
  return html.replace(legacyToolbar, "");
}

export function prepareEditorDocument(html) {
  if (typeof html !== "string" || !protocol.test(html)) {
    throw new Error("该 HTML 不是带编辑协议的 ResumeSkills 简历模板。");
  }
  return stripLegacyToolbar(html);
}
