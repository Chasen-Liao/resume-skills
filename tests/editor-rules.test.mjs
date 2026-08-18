import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { editorBlockChildTagNames, editorContainerClassNames, editorContainerTagNames } from "../lib/editor-rules.mjs";

test("editor rule sets match the documented protocol contract", () => {
  // 容器黑名单 = SKILL.md 全集（落地为规则的唯一权威处）
  assert.deepEqual(editorContainerTagNames, ["html", "body", "main", "section", "header", "footer", "ul", "ol", "figure"]);
  assert.deepEqual(editorContainerClassNames, ["page", "resume"]);
  for (const tag of ["div", "p", "h1", "li", "img", "table", "section"]) {
    assert.ok(editorBlockChildTagNames.includes(tag), `block list must include <${tag}>`);
  }
  // 行内叶子子字段的放行前提：<a>/<span> 不得被当作块级子元素
  assert.ok(!editorBlockChildTagNames.includes("a"), "inline <a> must stay allowed inside a compound field");
  assert.ok(!editorBlockChildTagNames.includes("span"), "inline <span> must stay allowed inside a compound field");
  assert.equal(new Set(editorBlockChildTagNames).size, editorBlockChildTagNames.length, "block list must not contain duplicates");
});

test("lib and canvas consume the shared rules module instead of redefining it", () => {
  const lib = readFileSync(new URL("../lib/editor-document.mjs", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const bin = readFileSync(new URL("../bin/resume-skills.mjs", import.meta.url), "utf8");

  assert.match(lib, /from "\.\/editor-rules\.mjs"/, "lib must import the shared rules");
  assert.match(app, /from "\/editor-rules\.js"/, "canvas must import the served shared rules");
  assert.match(bin, /\/editor-rules\.js/, "CLI must serve the shared rules module to the browser");

  // tripwire：任何一侧重新内联整套黑名单时，以下检查失败并提示收敛回 editor-rules（否则“门禁通过/浏览器拒绝”式分叉会静默回归）。
  assert.doesNotMatch(app, /"ADDRESS"/, "app.js must not redefine a second copy of the block tag list");
  assert.doesNotMatch(app, /const editorContainerTagNames = new Set\(\[/, "app.js must not inline the container list");
  assert.doesNotMatch(lib, /const editorContainerTagNames = new Set/, "lib must not redefine the container list");
  assert.doesNotMatch(lib, /const blockChildTagNames = new Set/, "lib must not redefine the block list");
});