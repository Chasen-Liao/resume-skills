export const controlEventTypes = ["input", "change"];

export function importantDeclaration(property, value) {
  return `${property}: ${value} !important;`;
}

export function appendOverrideRule(stylesheet, editorId, property, value) {
  const safeId = String(editorId).replace(/["\\]/g, "\\$&");
  return `${stylesheet}[data-resume-editor-id="${safeId}"] { ${importantDeclaration(property, value)} }\n`;
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
