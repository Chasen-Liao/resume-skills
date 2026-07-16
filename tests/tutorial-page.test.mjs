import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = "docs/index.html";
const styles = "docs/styles.css";
const script = "docs/app.js";

function readRequired(file) {
  assert.equal(existsSync(file), true, `missing ${file}`);
  return readFileSync(file, "utf8");
}

test("GitHub Pages tutorial ships as a complete static site", () => {
  for (const file of [page, styles, script, "docs/.nojekyll", ".github/workflows/pages.yml"]) {
    assert.equal(existsSync(file), true, `missing ${file}`);
  }
});

test("GitHub Pages workflow publishes the docs directory", () => {
  const workflow = readRequired(".github/workflows/pages.yml");
  const readme = readRequired("README.md");

  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path: docs/);
  assert.match(readme, /Settings\s*→\s*Pages/);
  assert.match(readme, /GitHub Actions/);
});

test("tutorial covers the complete resume workflow with accessible navigation", () => {
  const html = readRequired(page);

  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<nav[^>]+aria-label="教程章节"/);
  assert.match(html, /data-copy-target=/);

  for (const id of [
    "overview",
    "install",
    "workspace",
    "first-run",
    "facts",
    "template",
    "canvas",
    "jd",
    "ats",
    "versions",
    "updates",
    "troubleshooting",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing chapter ${id}`);
  }
});

test("tutorial remains usable on mobile, by keyboard, and with reduced motion", () => {
  const css = readRequired(styles);
  const js = readRequired(script);

  assert.match(css, /@media \(max-width:/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(js, /navigator\.clipboard/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /menuToggle\?\.setAttribute\("aria-label", "打开教程目录"\)/);
  assert.match(js, /sidebar\.inert\s*=/);
  assert.match(js, /sidebar\.setAttribute\("aria-hidden"/);
});
