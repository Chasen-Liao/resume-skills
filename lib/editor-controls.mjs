export const controlEventTypes = ["input", "change"];

export function importantDeclaration(property, value) {
  return `${property}: ${value} !important;`;
}

export function appendOverrideRule(stylesheet, editorId, property, value) {
  const safeId = String(editorId).replace(/["\\]/g, "\\$&");
  return `${stylesheet}[data-resume-editor-id="${safeId}"] { ${importantDeclaration(property, value)} }\n`;
}
