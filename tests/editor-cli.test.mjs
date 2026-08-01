import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { startEditor } from "../bin/resume-skills.mjs";

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

test("editor CLI exposes a reachable server after JSON startup", async () => {
  const child = spawn(process.execPath, [cli, "editor", exampleResume, "--no-open", "--json"], { cwd: root });
  child.stdout.setEncoding("utf8");
  const [output] = await once(child.stdout, "data");
  const parsed = JSON.parse(output.trim());

  try {
    assert.equal(parsed.event, "server_started");
    assert.equal(typeof parsed.port, "number");
    assert.match(parsed.url, /^http:\/\/127\.0\.0\.1:\d+/);
    assert.match(parsed.sourcePath, /modern-minimal\.html$/);
    assert.equal(parsed.exportPath, parsed.sourcePath);
    assert.equal((await fetch(`${parsed.url}/api/document`)).status, 200);
  } finally {
    child.kill();
    await once(child, "exit");
  }
});

test("startEditor keeps the JSON-reported server available", async () => {
  const logs = [];
  const logFn = (msg) => logs.push(msg);
  const server = startEditor(exampleResume, { open: false, port: 0, json: true, logFn });
  await once(server, "listening");

  try {
    assert.equal(logs.length, 1);
    const parsed = JSON.parse(logs[0]);
    assert.equal(parsed.event, "server_started");
    assert.equal(typeof parsed.port, "number");
    const response = await fetch(`${parsed.url}/api/document`);
    assert.equal(response.status, 200);
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

test("editor server exposes a browser-safe toolbar helper module", async () => {
  const server = startEditor(exampleResume, { open: false, log: false });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/editor-toolbar.js`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/javascript/);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("editor server delivers the resume in a sandbox that cannot run scripts", async () => {
  const server = startEditor(exampleResume, { open: false, log: false });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const page = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    const resumeFrame = page.match(/<iframe\b[^>]*\bid=["']resume-frame["'][^>]*>/i)?.[0] || "";

    assert.match(resumeFrame, /\bsandbox(?:\s*=\s*["'][^"']*["'])?/i);
    assert.doesNotMatch(resumeFrame, /\ballow-scripts\b/i);
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

test("editor refuses unsafe HTML before starting a server", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const unsafeDocuments = [
      '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><script>alert(1)</script></body></html>',
      '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body onload="alert(1)"></body></html>',
      '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><iframe src="https://attacker.example"></iframe></body></html>',
      '<html><body data-resume-editor-template="modern-minimal" data-resume-editor-version="1"></body></html>',
    ];

    for (const html of unsafeDocuments) {
      await writeFile(sourcePath, html);
      let server;
      let thrown;
      try {
        server = startEditor(sourcePath, { open: false, log: false });
      } catch (error) {
        thrown = error;
      }
      if (server) {
        await once(server, "listening");
        server.close();
        await once(server, "close");
      }
      assert.match(thrown?.message || "", /不安全的 HTML|<html> 开始标签/);
    }
  });
});

test("editor refuses unsafe saves and preserves the source resume", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const sourceHtml = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume">安全内容</div></body></html>';
    await writeFile(sourcePath, sourceHtml);
    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");

    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ html: sourceHtml.replace("</body>", "<script>alert(1)</script></body>") }),
      });

      assert.equal(response.status, 400);
      assert.match((await response.json()).error, /不安全的 HTML/);
      assert.equal(await (await import("node:fs/promises")).readFile(sourcePath, "utf8"), sourceHtml);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});

test("editor rejects non-loopback hosts", async () => {
  let server;
  let thrown;
  try {
    server = startEditor(exampleResume, { open: false, log: false, host: "0.0.0.0" });
  } catch (error) {
    thrown = error;
  }

  if (server) {
    await once(server, "listening");
    server.close();
    await once(server, "close");
  }

  assert.match(thrown?.message || "", /loopback/i);
});

test("editor limits the size of save requests", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");

    try {
      const { port } = server.address();
      const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume">' + "x".repeat(2 * 1024 * 1024) + "</div></body></html>";
      const response = await fetch(`http://127.0.0.1:${port}/api/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ html }),
      });

      assert.equal(response.status, 413);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});

test("editor immediately rejects an oversized chunked save before the client ends it", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");

    try {
      const { port } = server.address();
      const socket = createConnection({ host: "127.0.0.1", port });
      await once(socket, "connect");
      const response = new Promise((resolve) => socket.once("data", (chunk) => resolve(chunk.toString("utf8"))));
      const timeout = new Promise((resolve) => setTimeout(() => resolve(""), 500));
      const chunk = "x".repeat(1024 * 1024 + 1);

      socket.write("POST /api/save HTTP/1.1\r\nHost: 127.0.0.1\r\nTransfer-Encoding: chunked\r\nContent-Type: application/json\r\n\r\n");
      socket.write(`${chunk.length.toString(16)}\r\n${chunk}\r\n`);

      let responseText;
      try {
        responseText = await Promise.race([response, timeout]);
      } finally {
        socket.destroy();
      }
      assert.match(responseText, /^HTTP\/1\.1 413 /);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});

test("editor CLI exits with an error for a non-loopback host", () => {
  assert.throws(
    () => execFileSync(process.execPath, [cli, "editor", exampleResume, "--host", "0.0.0.0", "--no-open"], { cwd: root, encoding: "utf8", stdio: "pipe" }),
    (error) => error.status === 1 && /loopback/i.test(error.stderr.toString()),
  );
});

test("editor reports a bracketed reachable URL when IPv6 loopback is available", async (context) => {
  const logs = [];
  const server = startEditor(exampleResume, { open: false, port: 0, host: "::1", json: true, logFn: (message) => logs.push(message) });
  try {
    const listening = once(server, "listening");
    const failed = once(server, "error").then(([error]) => { throw error; });
    await Promise.race([listening, failed]);
  } catch (error) {
    if (["EADDRNOTAVAIL", "EAFNOSUPPORT"].includes(error.code)) {
      context.skip(`IPv6 loopback is unavailable: ${error.code}`);
      return;
    }
    throw error;
  }

  try {
    const { url } = JSON.parse(logs[0]);
    assert.match(url, /^http:\/\/\[::1\]:\d+$/);
    try {
      assert.equal((await fetch(`${url}/api/document`)).status, 200);
    } catch (error) {
      if (["EACCES", "EADDRNOTAVAIL", "EAFNOSUPPORT"].includes(error.cause?.code)) {
        context.skip(`IPv6 loopback requests are unavailable: ${error.cause.code}`);
        return;
      }
      throw error;
    }
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("editor does not serve assets through a junction outside the resume directory", async () => {
  const externalDirectory = await mkdtemp(join(tmpdir(), "resume-skills-external-"));
  await writeFile(join(externalDirectory, "secret.png"), "private");

  try {
    await withEditorFixture(async (directory, sourcePath) => {
      await symlink(externalDirectory, join(directory, "images"), process.platform === "win32" ? "junction" : "dir");
      const server = startEditor(sourcePath, { open: false, log: false });
      await once(server, "listening");

      try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}/images/secret.png`);
        assert.equal(response.status, 403);
      } finally {
        server.close();
        await once(server, "close");
      }
    });
  } finally {
    await rm(externalDirectory, { recursive: true, force: true });
  }
});
