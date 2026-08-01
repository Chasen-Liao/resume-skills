import assert from "node:assert/strict";
import { mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { startEditor } from "../bin/resume-skills.mjs";

const sourceHtml = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">安全内容</h1></div></body></html>';

test("save rejects an expired document version without changing the resume", async () => {
  await withEditor(async (sourcePath, url) => {
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: "expired-document", html: sourceHtml }),
    });

    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /版本.*过期|冲突/);
    assert.equal(await readFile(sourcePath, "utf8"), sourceHtml);
  });
});

test("save reports an atomic write failure while leaving the original resume recoverable", async () => {
  await withEditor(async (sourcePath, url) => {
    const document = await (await fetch(`${url}/api/document`)).json();
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: document.documentId, html: withFontSize(sourceHtml, "12") }),
    });

    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /保存失败/);
    assert.equal(await readFile(sourcePath, "utf8"), sourceHtml);
  }, { writeAtomically() { throw new Error("simulated disk failure"); } });
});

test("save atomically replaces the resume, keeps one backup, and returns a new document version", async () => {
  await withEditor(async (sourcePath, url) => {
    const before = await (await fetch(`${url}/api/document`)).json();
    const savedHtml = withFontSize(sourceHtml, "12");
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: before.documentId, html: savedHtml }),
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.notEqual(result.documentId, before.documentId);
    assert.match(await readFile(sourcePath, "utf8"), /font-size: 12px !important/);
    assert.equal(await readFile(`${sourcePath}.bak`, "utf8"), sourceHtml);
  });
});

test("directory watch keeps sending reloads after the resume is replaced by rename", async () => {
  await withEditor(async (sourcePath, url) => {
    const events = await fetch(`${url}/api/events`);
    const reader = events.body.getReader();
    const firstReplacement = sourceHtml.replace("安全内容", "第一次热更新");
    const secondReplacement = sourceHtml.replace("安全内容", "第二次热更新");

    try {
      await replaceFile(sourcePath, firstReplacement);
      assert.equal(await nextSseData(reader), "reload");
      await replaceFile(sourcePath, secondReplacement);
      assert.equal(await nextSseData(reader), "reload");
      const document = await (await fetch(`${url}/api/document`)).json();
      assert.match(document.html, /第二次热更新/);
    } finally {
      reader.cancel();
    }
  });
});

test("watch reports a readable status when the resume cannot be read", async () => {
  await withEditor(async (sourcePath, url) => {
    const events = await fetch(`${url}/api/events`);
    const reader = events.body.getReader();
    try {
      await rm(sourcePath);
      const message = await nextSseData(reader);
      assert.equal(message.event, "status");
      assert.equal(message.data.level, "error");
      assert.match(message.data.message, /无法读取/);
    } finally {
      reader.cancel();
    }
  });
});

function withFontSize(html, size) {
  return html.replace("</head>", `<style id="resume-editor-overrides">[data-resume-editor-id="profile-name"] { font-size: ${size}px !important; }</style></head>`);
}

async function withEditor(run, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-reliability-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, sourceHtml);
  const server = startEditor(sourcePath, { open: false, log: false, ...options });
  await once(server, "listening");
  const { port } = server.address();

  try {
    await run(sourcePath, `http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
}

async function replaceFile(sourcePath, contents) {
  const replacementPath = `${sourcePath}.replacement`;
  await writeFile(replacementPath, contents);
  await rename(replacementPath, sourcePath);
}

async function nextSseData(reader) {
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const result = await Promise.race([
      reader.read(),
      new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), Math.max(1, deadline - Date.now()))),
    ]);
    if (result.timeout) break;
    buffer += decoder.decode(result.value || new Uint8Array(), { stream: !result.done });
    const match = buffer.match(/(?:(event): ([^\n]+)\n)?data: ([^\n]+)\n\n/);
    if (match) return match[2] ? { event: match[2], data: JSON.parse(match[3]) } : match[3];
  }
  throw new Error("Timed out waiting for an SSE update");
}
