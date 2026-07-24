import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const css = readFileSync(`${root}/public/app.css`, "utf8");
const editorHtml = readFileSync(`${root}/public/editor.html`, "utf8");
const faviconPath = `${root}/public/favicon.svg`;

test("editor header includes a compact accessible SVG brand mark", () => {
  assert.match(editorHtml, /<svg class="brand-mark"[^>]*aria-hidden="true"/);
  assert.match(editorHtml, /<span class="brand-name">ResumeSkills Canvas<\/span>/);
  assert.match(css, /\.brand-mark \{[^}]*width: 24px/);
});

test("editor provides a simple SVG favicon for browser tabs", () => {
  assert.match(editorHtml, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
  assert.equal(existsSync(faviconPath), true);

  const favicon = readFileSync(faviconPath, "utf8");
  assert.match(favicon, /<svg[^>]+viewBox="0 0 32 32"/);
  assert.doesNotMatch(favicon, /<text\b/);
});

test("editor guide credits the author and links to the project repository", () => {
  assert.match(editorHtml, /class="project-meta"/);
  assert.match(editorHtml, /https:\/\/github\.com\/Chasen-Liao/);
  assert.match(editorHtml, /https:\/\/github\.com\/Chasen-Liao\/resume-skills/);
  assert.match(editorHtml, /Chasen-Liao/);
});

test("editor UI provides reduced-motion safe button feedback", () => {
  assert.match(css, /button:active[\s\S]*transform: scale\(0\.97\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("resume templates do not include deprecated export toolbars", () => {
  const templates = [
    "classic-business.html",
    "creative-bold.html",
    "japanese-minimal.html",
    "minimal-blue-business.html",
    "modern-minimal.html",
    "tech-dark.html",
  ];

  for (const template of templates) {
    const html = readFileSync(`${root}/skills/resume-builder/references/examples/${template}`, "utf8");
    assert.doesNotMatch(html, /no-print-toolbar|btn-export|toolbar-tip/);
  }
});
