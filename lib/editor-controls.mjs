export const controlEventTypes = ["input", "change", "blur"];

export function importantDeclaration(property, value) {
  return `${property}: ${value} !important;`;
}

export function appendOverrideRule(stylesheet, editorId, property, value) {
  const safeId = String(editorId).replace(/["\\]/g, "\\$&");
  const selector = `[data-resume-editor-id="${safeId}"]`;
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedProperty = String(property).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingDeclaration = new RegExp(`(${escapedSelector}\\s*\\{\\s*${escapedProperty}\\s*:\\s*)[^;}]+(;\\s*\\})`);
  if (existingDeclaration.test(stylesheet)) {
    return stylesheet.replace(existingDeclaration, `$1${value} !important$2`);
  }
  return `${stylesheet}${selector} { ${importantDeclaration(property, value)} }\n`;
}

export function removeOverrideRules(stylesheet, editorId) {
  const safeId = String(editorId).replace(/["\\]/g, "\\$&");
  const selector = `[data-resume-editor-id="${safeId}"]`;
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stylesheet.replace(new RegExp(`${escapedSelector}\\s*\\{[^{}]*\\}\\s*`, "g"), "");
}

export function upsertRootToken(stylesheet, token, value) {
  const escapedToken = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rootRule = /:root\s*\{([^{}]*)\}/;
  if (!rootRule.test(stylesheet)) return `${stylesheet}:root { ${token}: ${value}; }\n`;
  return stylesheet.replace(rootRule, (match, body) => {
    const declaration = new RegExp(`(${escapedToken}\\s*:\\s*)[^;}]+;?`);
    if (declaration.test(body)) return `:root { ${body.replace(declaration, `$1${value};`)} }`;
    return `:root { ${body} ${token}: ${value}; }`;
  });
}

const interactiveSelector = "a[href], button, input, select, textarea, [contenteditable]";
const focusableDescendantSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

export function rovingSelectionTargets(nodes) {
  return nodes.filter((node) => !node.querySelector(focusableDescendantSelector));
}

export function setRovingTabStop(nodes, target) {
  nodes.forEach((node) => { node.tabIndex = node === target ? 0 : -1; });
}

export function configureSelectionTarget(node, index) {
  node.tabIndex = index === 0 ? 0 : -1;
  if (isInteractive(node) || node.querySelector(interactiveSelector)) return;
  node.setAttribute("role", "button");
  node.setAttribute("aria-pressed", "false");
}

export function setSelectionPressed(node, isPressed) {
  if (node.getAttribute("role") === "button") node.setAttribute("aria-pressed", String(isPressed));
}

export function selectFromPointer(event, node, select) {
  event.preventDefault();
  event.stopPropagation();
  select(node);
}

function isInteractive(node) {
  return node.matches ? node.matches(interactiveSelector) : node.tagName === "A" && node.hasAttribute("href");
}
