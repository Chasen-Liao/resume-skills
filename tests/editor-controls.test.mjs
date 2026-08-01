import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as editorControls from "../lib/editor-controls.mjs";

const { appendOverrideRule, controlEventTypes, importantDeclaration } = editorControls;

test("editor controls react to both live input and committed changes", () => {
  assert.deepEqual(controlEventTypes, ["input", "change"]);
});

test("editor declarations override template-specific text rules", () => {
  assert.equal(importantDeclaration("text-align", "center"), "text-align: center !important;");
});

test("appends a safe attribute selector rule without parsing it as a regular expression", () => {
  const stylesheet = appendOverrideRule("/* overrides */\n", "project-1-bullet-2", "font-weight", "600");
  assert.match(stylesheet, /\[data-resume-editor-id="project-1-bullet-2"\] \{ font-weight: 600 !important; \}/);
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
