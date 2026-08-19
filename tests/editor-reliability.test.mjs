import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { closeSync, copyFileSync, existsSync, fsyncSync, openSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { atomicSave, startEditor } from "../bin/resume-skills.mjs";

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

test("save detects a disk change before its watcher reloads and preserves the external content", async () => {
  await withEditor(async (sourcePath, url) => {
    const document = await (await fetch(`${url}/api/document`)).json();
    const externalHtml = sourceHtml.replace("安全内容", "外部写入内容");
    await writeFile(sourcePath, externalHtml);

    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: document.documentId, html: withFontSize(sourceHtml, "12") }),
    });

    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /版本.*过期|冲突/);
    assert.equal(await readFile(sourcePath, "utf8"), externalHtml);
  });
});

test("atomic save fsync failure keeps the source and cleans its same-directory temporary file", async () => {
  await withTemporaryFile(async (sourcePath) => {
    let temporaryPath;
    let fsyncCalled = false;
    const fileOps = realFileOps({
      open(path, flags) { temporaryPath = path; return openSync(path, flags); },
      fsync(descriptor) { fsyncCalled = true; fsyncSync(descriptor); throw new Error("fsync failed"); },
    });

    assert.throws(() => atomicSave(sourcePath, "new contents", { fileOps }), /fsync failed/);
    assert.equal(fsyncCalled, true);
    assert.equal(await readFile(sourcePath, "utf8"), "original contents");
    assert.equal(dirname(temporaryPath), dirname(sourcePath));
    assert.equal(existsSync(temporaryPath), false);
  });
});

test("atomic save rename failure keeps the source and cleans its temporary file", async () => {
  await withTemporaryFile(async (sourcePath) => {
    let temporaryPath;
    const fileOps = realFileOps({
      open(path, flags) { temporaryPath = path; return openSync(path, flags); },
      rename() { throw new Error("rename failed"); },
    });

    assert.throws(() => atomicSave(sourcePath, "new contents", { fileOps }), /rename failed/);
    assert.equal(await readFile(sourcePath, "utf8"), "original contents");
    assert.equal(dirname(temporaryPath), dirname(sourcePath));
    assert.equal(existsSync(temporaryPath), false);
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

test("save writes text edits after normalizing plugin markup in an editable field", async () => {
  await withEditor(async (sourcePath, url) => {
    const before = await (await fetch(`${url}/api/document`)).json();
    const submittedHtml = sourceHtml.replace(
      "安全内容",
      '<span data-plugin="suggestion">已编辑内容</span><span aria-hidden="true">隐藏建议</span>',
    );
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: before.documentId, html: submittedHtml }),
    });

    assert.equal(response.status, 200);
    const savedHtml = await readFile(sourcePath, "utf8");
    assert.match(savedHtml, /已编辑内容/);
    assert.doesNotMatch(savedHtml, /data-plugin|隐藏建议|aria-hidden|<span/);
  });
});

test("save writes text edits after removing an extension node outside the editable field", async () => {
  await withEditor(async (sourcePath, url) => {
    const before = await (await fetch(`${url}/api/document`)).json();
    const submittedHtml = sourceHtml
      .replace("安全内容", "已编辑内容")
      .replace("</body>", '<grammarly-extension data-grammarly-shadow-root="true" style="position:fixed;top:0;left:0"></grammarly-extension></body>');
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: before.documentId, html: submittedHtml }),
    });

    assert.equal(response.status, 200);
    const savedHtml = await readFile(sourcePath, "utf8");
    assert.match(savedHtml, /已编辑内容/);
    assert.doesNotMatch(savedHtml, /grammarly-extension|data-grammarly|position:fixed/);
  });
});

test("save invalidates an explicitly associated manifest in another directory with another stem", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-manifest-"));
  const sourcePath = join(directory, "input", "resume.html");
  const manifestPath = join(directory, "artifacts", "release-candidate.resume-manifest.json");
  await mkdir(dirname(sourcePath), { recursive: true });
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(sourcePath, sourceHtml);
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    status: "valid",
    html: { path: sourcePath, sha256: "old-html-hash" },
    pdf: { path: join(directory, "artifacts", "release-candidate.pdf"), sha256: "old-pdf-hash" },
    renderer: { name: "playwright", version: "1.62.1" },
    validation: { ok: true, deliverable: true, checks: [], summary: { pass: 1, warn: 0, fail: 0, degraded: 0 } },
  }));
  const server = startEditor(sourcePath, { open: false, log: false, manifestPath });
  await once(server, "listening");
  const { port } = server.address();

  try {
    const url = `http://127.0.0.1:${port}`;
    const before = await (await fetch(`${url}/api/document`)).json();

    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: before.documentId, html: withFontSize(sourceHtml, "12") }),
    });

    assert.equal(response.status, 200);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.status, "invalid");
    assert.equal(manifest.validation.ok, false);
    assert.match(manifest.invalidated.reason, /Canvas|HTML/i);
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

test("save preserves the HTML when its associated manifest cannot be invalidated", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-manifest-failure-"));
  const sourcePath = join(directory, "resume.html");
  const manifestPath = join(directory, "delivery.resume-manifest.json");
  await writeFile(sourcePath, sourceHtml);
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    status: "valid",
    html: { path: sourcePath, sha256: "old-html-hash" },
    pdf: { path: join(directory, "delivery.pdf"), sha256: "old-pdf-hash" },
    renderer: { name: "playwright", version: "1.62.1" },
    validation: { ok: true, deliverable: true, checks: [] },
  }));
  const server = startEditor(sourcePath, {
    open: false,
    log: false,
    manifestPath,
    invalidateManifest() { throw new Error("manifest write failed"); },
  });
  await once(server, "listening");
  const { port } = server.address();

  try {
    const url = `http://127.0.0.1:${port}`;
    const before = await (await fetch(`${url}/api/document`)).json();
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: before.documentId, html: withFontSize(sourceHtml, "12") }),
    });

    assert.equal(response.status, 500);
    assert.equal(await readFile(sourcePath, "utf8"), sourceHtml);
    assert.equal(JSON.parse(await readFile(manifestPath, "utf8")).status, "valid");
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

test("save auto-invalidates a same-prefix manifest without an explicit --manifest flag", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-manifest-auto-"));
  const sourcePath = join(directory, "resume.html");
  const manifestPath = join(directory, "resume.resume-manifest.json");
  await writeFile(sourcePath, sourceHtml);
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    status: "valid",
    html: { path: sourcePath, sha256: "old-html-hash" },
    pdf: { path: join(directory, "resume.pdf"), sha256: "old-pdf-hash" },
    renderer: { name: "playwright", version: "1.62.1" },
    validation: { ok: true, deliverable: true, checks: [], summary: { pass: 1, warn: 0, fail: 0, degraded: 0 } },
  }));
  const server = startEditor(sourcePath, { open: false, log: false });
  await once(server, "listening");
  const { port } = server.address();

  try {
    const url = `http://127.0.0.1:${port}`;
    const before = await (await fetch(`${url}/api/document`)).json();
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: before.documentId, html: withFontSize(sourceHtml, "12") }),
    });

    assert.equal(response.status, 200);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.status, "invalid");
    assert.equal(manifest.validation.ok, false);
    assert.match(manifest.invalidated.reason, /Canvas|HTML/i);
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

test("save succeeds when no manifest is present anywhere", async () => {
  await withEditor(async (sourcePath, url) => {
    const document = await (await fetch(`${url}/api/document`)).json();
    const response = await fetch(`${url}/api/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: document.documentId, html: withFontSize(sourceHtml, "12") }),
    });

    assert.equal(response.status, 200);
    assert.match(await readFile(sourcePath, "utf8"), /font-size: 12px !important/);
  });
});

test("directory watch keeps sending reloads after the resume is replaced by rename", async () => {
  await withEditor(async (sourcePath, url) => {
    const events = await fetch(`${url}/api/events`);
    const reader = events.body.getReader();
    const firstReplacement = sourceHtml.replace("安全内容", "第一次热更新");
    const secondReplacement = sourceHtml.replace("安全内容", "第二次热更新");

    try {
      await nextSseData(reader); // 连接的初始 version 事件
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


test("self-save does not echo a reload to SSE clients", async () => {
  await withEditor(async (sourcePath, url) => {
    const events = await fetch(`${url}/api/events`);
    const reader = events.body.getReader();
    try {
      await nextSseData(reader); // 连接的初始 version 事件
      const document = await (await fetch(`${url}/api/document`)).json();
      const response = await fetch(`${url}/api/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: document.documentId, html: sourceHtml }),
      });
      assert.equal(response.status, 200);

      const race = await Promise.race([
        nextSseData(reader).then((data) => ({ data }), (error) => ({ error: String(error) })),
        new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 800)),
      ]);
      assert.deepEqual(race, { timeout: true }, "a save from the editor itself must not reset the canvas via reload");
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
      await nextSseData(reader); // 连接的初始 version 事件
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

async function withTemporaryFile(run) {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-atomic-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, "original contents");
  try {
    await run(sourcePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function realFileOps(overrides) {
  return {
    open: openSync,
    write: writeFileSync,
    fsync: fsyncSync,
    close: closeSync,
    copy: copyFileSync,
    rename: renameSync,
    exists: existsSync,
    unlink: unlinkSync,
    ...overrides,
  };
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