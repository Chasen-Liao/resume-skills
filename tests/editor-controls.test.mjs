import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { appendOverrideRule, controlEventTypes, importantDeclaration } from "../lib/editor-controls.mjs";

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
