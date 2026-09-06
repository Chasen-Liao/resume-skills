import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const css = readFileSync(`${root}/public/app.css`, "utf8");
const editorHtml = readFileSync(`${root}/public/editor.html`, "utf8");
const app = readFileSync(`${root}/public/app.js`, "utf8");
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

test("save export strips every editor-only attribute from the shared runtime list", () => {
  assert.match(app, /editorRuntimeInjectedAttributeNames\.map/);
  assert.match(app, /for \(const name of editorRuntimeInjectedAttrs\) node\.removeAttribute\(name\)/);
});

test("editor shows a version chip in the bottom-left project meta", () => {
  assert.match(editorHtml, /id="app-version"/);
  assert.match(editorHtml, /project-meta/);
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

test("preview iframe sandbox allows the print dialog the export button opens", () => {
  // window.print() 属于 modal API：沙箱缺少 allow-modals 时浏览器会静默忽略调用，
  // “打印为 PDF” 点击后只在控制台留下 Ignored call to 'print()'。
  const sandbox = editorHtml.match(/<iframe id="resume-frame"[^>]*sandbox="([^"]*)"/)?.[1];
  assert.ok(sandbox, "预览 iframe 必须显式声明 sandbox");

  const tokens = sandbox.split(/\s+/).filter(Boolean);
  assert.ok(tokens.includes("allow-same-origin"), "父页面需要同源访问 contentDocument 才能编辑画布");
  assert.ok(tokens.includes("allow-modals"), "缺少 allow-modals 时打印为 PDF 会被浏览器忽略");
  assert.ok(!tokens.includes("allow-scripts"), "预览内容不可执行脚本，避免 allow-modals 被滥用弹窗");
  assert.match(app, /#print-pdf"\)\.addEventListener\("click", \(\) => frame\.contentWindow\.print\(\)\)/);
});
