import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parse } from "parse5";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { startEditor } from "../bin/resume-skills.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const app = await readFile(`${root}/public/app.js`, "utf8");
const editorHtml = await readFile(`${root}/public/editor.html`, "utf8");
const templateNames = [
  "classic-business",
  "creative-bold",
  "japanese-minimal",
  "minimal-blue-business",
  "modern-minimal",
  "tech-dark",
];

test("Canvas keeps resume text read-only and explains how to confirm fact changes", () => {
  assert.doesNotMatch(app, /contenteditable/i);
  assert.match(app, /事实内容只能通过 Agent 工作流确认后重新生成 HTML/);
  assert.match(editorHtml, /双击文字查看事实修改说明/);
});

test("Canvas text targets expose roving keyboard selection without editing", () => {
  assert.match(app, /node\.tabIndex = index === 0 \? 0 : -1/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(app, /event\.key === "Escape"/);
});

test("all built-in templates provide unique stable IDs for profile and experience text", async () => {
  for (const templateName of templateNames) {
    const html = await readFile(`${root}/skills/resume-builder/references/examples/${templateName}.html`, "utf8");
    const document = parse(html);
    const editorIds = [];
    visit(document, (node) => {
      const id = attribute(node, "data-resume-editor-id");
      if (id) editorIds.push(id);
    });

    assert.equal(editorIds.length > 0, true, `${templateName} has selectable text IDs`);
    assert.equal(new Set(editorIds).size, editorIds.length, `${templateName} IDs are unique`);
    assert.equal(editorIds.every((id) => /^[a-z][a-z0-9-]*$/.test(id)), true, `${templateName} IDs are stable semantic names`);
    assert.equal(editorIds.some((id) => id.startsWith("profile-")), true, `${templateName} labels profile text`);
    assert.equal(editorIds.some((id) => id.includes("bullet-")), true, `${templateName} labels experience detail text`);
  }
});

test("Canvas save rejects changed resume facts but accepts typography overrides", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-boundary-"));
  const sourcePath = join(directory, "resume.html");
  const sourceHtml = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">安全内容</h1></div></body></html>';
  await writeFile(sourcePath, sourceHtml);
  const server = startEditor(sourcePath, { open: false, log: false });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const endpoint = `http://127.0.0.1:${port}/api/save`;
    const changedFact = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html: sourceHtml.replace("安全内容", "未经确认的指标提升 80%") }),
    });

    assert.equal(changedFact.status, 400);
    assert.match((await changedFact.json()).error, /事实内容或简历结构/);
    assert.equal(await readFile(sourcePath, "utf8"), sourceHtml);

    const typographyOnly = sourceHtml.replace("</head>", '<style id="resume-editor-overrides">/* resume-editor-overrides */\n[data-resume-editor-id="profile-name"] { font-size: 12px !important; }\n</style></head>');
    const saved = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html: typographyOnly }),
    });

    assert.equal(saved.status, 200);
    assert.match(await readFile(sourcePath, "utf8"), /font-size: 12px !important/);

    const misplacedOverride = sourceHtml.replace("</body>", '<style id="resume-editor-overrides">[data-resume-editor-id="profile-name"] { font-size: 12px !important; }</style></body>');
    const misplaced = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ html: misplacedOverride }),
    });

    assert.equal(misplaced.status, 400);
    assert.match((await misplaced.json()).error, /排版覆盖格式/);
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

function visit(node, callback) {
  if (node.tagName) callback(node);
  for (const child of node.childNodes || []) visit(child, callback);
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}
