import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "parse5";
import test from "node:test";
import * as editorControls from "../lib/editor-controls.mjs";

const { appendOverrideRule, controlEventTypes, importantDeclaration, removeOverrideRules, upsertRootToken } = editorControls;

test("editor controls react to live input and committed changes or blur", () => {
  assert.deepEqual(controlEventTypes, ["input", "change", "blur"]);
});

test("editor declarations override template-specific text rules", () => {
  assert.equal(importantDeclaration("text-align", "center"), "text-align: center !important;");
});

test("appends a safe attribute selector rule without parsing it as a regular expression", () => {
  const stylesheet = appendOverrideRule("/* overrides */\n", "project-1-bullet-2", "font-weight", "600");
  assert.match(stylesheet, /\[data-resume-editor-id="project-1-bullet-2"\] \{ font-weight: 600 !important; \}/);
});

test("replaces a selected element property instead of accumulating CSS during a drag", () => {
  let stylesheet = "/* overrides */\n";
  stylesheet = appendOverrideRule(stylesheet, "project-1-bullet-2", "font-size", "11px");
  stylesheet = appendOverrideRule(stylesheet, "project-1-bullet-2", "font-size", "12px");

  const declarations = [...stylesheet.matchAll(/\[data-resume-editor-id="project-1-bullet-2"\]\s*\{\s*font-size:\s*([^;]+);\s*\}/g)];
  assert.equal(declarations.length, 1);
  assert.equal(declarations[0][1], "12px !important");
});

test("restores one selected text item to its template defaults without affecting another item", () => {
  const stylesheet = [
    '/* overrides */',
    '[data-resume-editor-id="profile-name"] { font-size: 12px !important; }',
    '[data-resume-editor-id="profile-title"] { font-size: 11px !important; }',
  ].join("\n");

  const restored = removeOverrideRules(stylesheet, "profile-name");

  assert.doesNotMatch(restored, /profile-name/);
  assert.match(restored, /profile-title/);
});

test("replaces a root token while dragging a document-level control", () => {
  let stylesheet = "/* overrides */\n";
  stylesheet = upsertRootToken(stylesheet, "--page-margin", "10mm");
  stylesheet = upsertRootToken(stylesheet, "--page-margin", "12mm");

  const declarations = [...stylesheet.matchAll(/--page-margin:\s*([^;]+);/g)];
  assert.equal(declarations.length, 1);
  assert.equal(declarations[0][1], "12mm");
});

test("font size is a numeric input with browser stepper controls", () => {
  const editorHtml = readFileSync(new URL("../public/editor.html", import.meta.url), "utf8");
  assert.match(editorHtml, /id="font-size" type="number"/);
  assert.doesNotMatch(editorHtml, /id="font-size" type="range"/);
});

test("roving selection leaves exactly one text target in the tab order", () => {
  assert.equal(typeof editorControls.setRovingTabStop, "function");
  const nodes = [new SelectionTarget("DIV"), new SelectionTarget("DIV"), new SelectionTarget("DIV")];

  editorControls.setRovingTabStop(nodes, nodes[2]);

  assert.deepEqual(nodes.map((node) => node.tabIndex), [-1, -1, 0]);
  editorControls.setRovingTabStop(nodes, nodes[1]);
  assert.deepEqual(nodes.map((node) => node.tabIndex), [-1, 0, -1]);
});

test("selection targets preserve links and avoid nested button semantics", () => {
  assert.equal(typeof editorControls.configureSelectionTarget, "function");
  const link = new SelectionTarget("A", { href: "/portfolio" });
  const contact = new SelectionTarget("DIV", {}, [link]);
  const plainText = new SelectionTarget("P");

  editorControls.configureSelectionTarget(link, 0);
  editorControls.configureSelectionTarget(contact, 1);
  editorControls.configureSelectionTarget(plainText, 2);

  assert.equal(link.getAttribute("role"), null);
  assert.equal(link.getAttribute("aria-pressed"), null);
  assert.equal(contact.getAttribute("role"), null);
  assert.equal(plainText.getAttribute("role"), "button");
  assert.equal(plainText.getAttribute("aria-pressed"), "false");

  assert.equal(typeof editorControls.setSelectionPressed, "function");
  editorControls.setSelectionPressed(link, true);
  editorControls.setSelectionPressed(plainText, true);
  assert.equal(link.getAttribute("aria-pressed"), null);
  assert.equal(plainText.getAttribute("aria-pressed"), "true");
});

test("pointer selection prevents link navigation while selecting the link", () => {
  assert.equal(typeof editorControls.selectFromPointer, "function");
  const link = new SelectionTarget("A", { href: "/portfolio" });
  const event = new PointerEventStub();
  let selected;

  editorControls.selectFromPointer(event, link, (node) => { selected = node; });

  assert.equal(selected, link);
  assert.equal(event.defaultPrevented, true);
  assert.equal(event.propagationStopped, true);
});

test("creative contact containers with a selectable link do not become an extra roving tab stop", () => {
  const creativeDocument = parse(readFileSync(new URL("../skills/resume-builder/references/examples/creative-bold.html", import.meta.url), "utf8"));
  const contact = findByEditorId(creativeDocument, "profile-contact-phone-label");
  const link = findByEditorId(creativeDocument, "profile-email");
  assert.ok(contact);
  assert.ok(link);
  assert.equal(hasDescendant(contact, link), true);

  const contactTarget = new SelectionTarget("DIV", {}, [new SelectionTarget("A", { href: "/portfolio" })]);
  const linkTarget = contactTarget.children[0];
  assert.equal(typeof editorControls.rovingSelectionTargets, "function");

  const targets = editorControls.rovingSelectionTargets([contactTarget, linkTarget]);
  editorControls.configureSelectionTarget(targets[0], 0);

  assert.deepEqual(targets, [linkTarget]);
  assert.equal(contactTarget.tabIndex, -1);
  assert.equal(linkTarget.tabIndex, 0);
});

class SelectionTarget {
  constructor(tagName, attributes = {}, children = []) {
    this.tagName = tagName;
    this.attributes = new Map(Object.entries(attributes));
    this.children = children;
    this.tabIndex = -1;
  }

  getAttribute(name) { return this.attributes.get(name) || null; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  querySelector() { return this.children.find((child) => child.isInteractive()) || null; }
  isInteractive() { return this.tagName === "A" && this.hasAttribute("href"); }
}

class PointerEventStub {
  defaultPrevented = false;
  propagationStopped = false;

  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this.propagationStopped = true; }
}

function findByEditorId(node, id) {
  if (node.attrs?.some((attribute) => attribute.name === "data-resume-editor-id" && attribute.value === id)) return node;
  for (const child of node.childNodes || []) {
    const found = findByEditorId(child, id);
    if (found) return found;
  }
}

function hasDescendant(node, descendant) {
  for (const child of node.childNodes || []) {
    if (child === descendant || hasDescendant(child, descendant)) return true;
  }
  return false;
}
