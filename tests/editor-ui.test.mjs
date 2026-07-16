import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const css = readFileSync(`${root}/public/app.css`, "utf8");
const editorHtml = readFileSync(`${root}/public/editor.html`, "utf8");

test("editor header includes a compact accessible SVG brand mark", () => {
  assert.match(editorHtml, /<svg class="brand-mark"[^>]*aria-hidden="true"/);
  assert.match(editorHtml, /<span class="brand-name">ResumeSkills Canvas<\/span>/);
  assert.match(css, /\.brand-mark \{[^}]*width: 24px/);
});

test("editor guide credits the author and links to the project repository", () => {
  assert.match(editorHtml, /class="project-meta"/);
  assert.match(editorHtml, /https:\/\/github\.com\/Chasen-Liao/);
  assert.match(editorHtml, /https:\/\/github\.com\/Chasen-Liao\/resume-skills/);
  assert.match(editorHtml, /Chasen-Liao/);
});

test("editor UI provides reduced-motion safe button feedback", () => {
  assert.match(css, /button:hover[\s\S]*transform: translateY\(-1px\)/);
  assert.match(css, /button:active[\s\S]*transform: translateY\(0\) scale\(0\.98\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
