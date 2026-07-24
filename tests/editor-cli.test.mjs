import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { nextExportPath, startEditor } from "../bin/resume-skills.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = fileURLToPath(new URL("../bin/resume-skills.mjs", import.meta.url));
const exampleResume = fileURLToPath(new URL("../skills/resume-builder/references/examples/modern-minimal.html", import.meta.url));

test("editor help documents an HTML input path and options", () => {
  const output = execFileSync(process.execPath, [cli, "editor", "--help"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.match(output, /resume-skills editor <resume\.html>/);
  assert.match(output, /--json/);
  assert.match(output, /--port/);
});

test("editor cli outputs JSON status when --json flag is passed", () => {
  const output = execFileSync(process.execPath, [cli, "editor", exampleResume, "--no-open", "--json"], {
    cwd: root,
    encoding: "utf8",
  });

  const parsed = JSON.parse(output.trim());
  assert.equal(parsed.event, "server_started");
  assert.equal(typeof parsed.port, "number");
  assert.match(parsed.url, /^http:\/\/127\.0\.0\.1:\d+/);
  assert.match(parsed.sourcePath, /modern-minimal\.html$/);
  assert.match(parsed.exportPath, /modern-minimal-edited\.html$/);
});

test("startEditor options support port binding and json logging", async () => {
  const logs = [];
  const logFn = (msg) => logs.push(msg);
  const server = startEditor(exampleResume, { open: false, port: 0, json: true, logFn });
  await once(server, "listening");

  try {
    const { port } = server.address();
    assert.equal(logs.length, 1);
    const parsed = JSON.parse(logs[0]);
    assert.equal(parsed.event, "server_started");
    assert.equal(parsed.port, port);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("editor serves /api/events endpoint for live reload SSE", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");

    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/events`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /^text\/event-stream/);
      response.body.cancel();
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});

test("editor export always targets one replaceable edited file", () => {
  assert.equal(
    nextExportPath("C:/resumes/modern-minimal.html"),
    join("C:/resumes", "modern-minimal-edited.html"),
  );
});

test("editor server exposes the SVG favicon", async () => {
  const server = startEditor(exampleResume, { open: false, log: false });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/favicon.svg`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^image\/svg\+xml/);
    assert.match(body, /<svg[^>]+viewBox="0 0 32 32"/);
  } finally {
    server.close();
    await once(server, "close");
  }
});

async function withEditorFixture(run) {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-editor-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume"></div></body></html>');

  try {
    await run(directory, sourcePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("editor serves a percent-encoded asset path from a Chinese directory", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const assetDirectory = join(directory, "证件照");
    const asset = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    await mkdir(assetDirectory);
    await writeFile(join(assetDirectory, "证件照-new.png"), asset);

    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");
    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/${encodeURI("证件照/证件照-new.png")}`);

      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), asset);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});

test("editor rejects encoded directory traversal in asset paths", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    await writeFile(join(directory, "..%2Fsecret.txt"), "decoy");
    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");
    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/..%2Fsecret.txt`);

      assert.equal(response.status, 403);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
