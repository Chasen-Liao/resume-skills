import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = "docs/index.html";
const markdown = "docs/tutorial.md";
const styles = "docs/styles.css";
const script = "docs/app.js";

function readRequired(file) {
  assert.equal(existsSync(file), true, `missing ${file}`);
  return readFileSync(file, "utf8");
}

test("GitHub Pages tutorial ships as a Markdown-driven static site", () => {
  for (const file of [page, markdown, styles, script, "docs/.nojekyll", ".github/workflows/pages.yml"]) {
    assert.equal(existsSync(file), true, `missing ${file}`);
  }
});

test("GitHub Pages workflow publishes the docs directory", () => {
  const workflow = readRequired(".github/workflows/pages.yml");

  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path: docs/);
});

test("HTML is a reader shell and points to the Markdown source", () => {
  const html = readRequired(page);

  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label="文章目录"/);
  assert.match(html, /id="markdown-content"[^>]+data-content-source="tutorial\.md"/);
  assert.doesNotMatch(html, /<section[^>]+id="install"/);
});

test("Markdown source preserves front matter and article content", () => {
  const source = readRequired(markdown);

  assert.match(source, /^---\n/);
  assert.match(source, /^title:/m);
  assert.match(source, /^# 安装 resume-skills/m);
  assert.match(source, /```plaintext/);
  assert.match(source, /pbs\.twimg\.com\/media/);
});

test("reader renders Markdown, builds navigation, and remains accessible", () => {
  const js = readRequired(script);
  const css = readRequired(styles);

  assert.match(js, /fetch\(content\.dataset\.contentSource/);
  assert.match(js, /parseFrontMatter/);
  assert.match(js, /renderArticleHeader/);
  assert.match(js, /renderMarkdown/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /navigator\.clipboard/);
  assert.match(js, /sidebar\.inert\s*=\s*hidden/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media \(max-width:/);
});
