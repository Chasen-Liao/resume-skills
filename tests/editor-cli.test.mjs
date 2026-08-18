import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { createConnection, createServer as createNetServer } from "node:net";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DEFAULT_PORT, startEditor } from "../bin/resume-skills.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = fileURLToPath(new URL("../bin/resume-skills.mjs", import.meta.url));
const exampleResume = fileURLToPath(new URL("../skills/resume-builder/references/examples/modern-minimal.html", import.meta.url));

// once(server,"listening") 会在端口回退的中间 EADDRINUSE 上直接 reject；回退场景必须忽略临时占用错误。
function waitForListening(server, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      server.off("listening", onListening);
      server.off("error", onError);
      reject(new Error("listen timeout"));
    }, timeoutMs);
    const onListening = () => {
      clearTimeout(timer);
      server.off("error", onError);
      resolve();
    };
    const onError = (error) => {
      if (error?.code === "EADDRINUSE") return;
      clearTimeout(timer);
      server.off("listening", onListening);
      reject(error);
    };
    server.once("listening", onListening);
    server.on("error", onError);
  });
}

test("editor help documents an HTML input path and options", () => {
  const output = execFileSync(process.execPath, [cli, "editor", "--help"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.match(output, /resume-skills editor <resume\.html>/);
  assert.match(output, /resume-skills validate <resume\.html>/);
  assert.match(output, /--json/);
  assert.match(output, /--port/);
  assert.match(output, /--write-port-file/);
});

test("editor CLI exposes a reachable server after JSON startup", async () => {
  const child = spawn(process.execPath, [cli, "editor", exampleResume, "--no-open", "--json"], { cwd: root, env: { ...process.env, RESUME_SKILLS_NO_UPDATE_CHECK: "1" } });
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

test("validate subcommand accepts a well-formed example resume", () => {
  const output = execFileSync(process.execPath, [cli, "validate", exampleResume], { cwd: root, encoding: "utf8" });

  assert.match(output, /通过/);
});

test("validate subcommand rejects a resume without editor fields and gives grep guidance", async () => {
  const { directory, sourcePath } = await makeTempHtml('<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume">没有编辑 ID</div></body></html>');
  try {
    assert.throws(
      () => execFileSync(process.execPath, [cli, "validate", sourcePath], { cwd: root, encoding: "utf8", stdio: "pipe" }),
      (error) => error.status === 1 && /可编辑字段/.test(error.stderr.toString()) && /rg -n/.test(error.stderr.toString()) && /data-resume-editor-id/.test(error.stderr.toString()),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("validate subcommand rejects a resume with a container-level id", async () => {
  const { directory, sourcePath } = await makeTempHtml('<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><main data-resume-editor-id="sanqi-ai-app-dev-20260818">整页内容</main></body></html>');
  try {
    assert.throws(
      () => execFileSync(process.execPath, [cli, "validate", sourcePath], { cwd: root, encoding: "utf8", stdio: "pipe" }),
      (error) => error.status === 1 && /容器 <main>/.test(error.stderr.toString()),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("editor CLI refuses to start a server for a resume without editable fields", async () => {
  const { directory, sourcePath } = await makeTempHtml('<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume">无法编辑</div></body></html>');
  try {
    assert.throws(
      () => execFileSync(process.execPath, [cli, "editor", sourcePath, "--no-open", "--port", "0"], { cwd: root, encoding: "utf8", stdio: "pipe" }),
      (error) => {
        assert.equal(error.status, 1);
        assert.match(error.stderr.toString(), /可编辑字段/);
        assert.doesNotMatch(error.stdout.toString(), /server_started|Resume editor is running/, "no server may start on gate failure");
        return true;
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("editor CLI emits a JSON error event instead of plain text when --json validation fails", async () => {
  const { directory, sourcePath } = await makeTempHtml('<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume">无法编辑</div></body></html>');
  try {
    assert.throws(
      () => execFileSync(process.execPath, [cli, "editor", sourcePath, "--json", "--no-open"], { cwd: root, encoding: "utf8", stdio: "pipe" }),
      (error) => {
        assert.equal(error.status, 1);
        const lines = error.stdout.toString().trim().split(/\r?\n/).map((line) => JSON.parse(line));
        assert.equal(lines.length, 1, "only the error event may be emitted");
        assert.equal(lines[0].event, "error");
        assert.match(lines[0].error, /data-resume-editor-id/);
        assert.match(lines[0].hint, /rg -n/);
        return true;
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("startEditor writes the port file when requested", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-portfile-"));
  const portFile = join(directory, "port.json");
  const logs = [];
  const server = startEditor(exampleResume, { open: false, port: 0, json: true, logFn: (message) => logs.push(message), writePortFile: portFile });
  await once(server, "listening");

  try {
    const written = JSON.parse(await readFile(portFile, "utf8"));
    const started = JSON.parse(logs[0]);
    assert.equal(written.port, started.port);
    assert.equal(written.url, started.url);
    assert.equal(typeof written.pid, "number");
    assert.match(written.sourcePath, /modern-minimal\.html$/);
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

test("editor CLI --write-port-file persists the ready port for background launches", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-cli-portfile-"));
  const portFile = join(directory, "port.json");
  const child = spawn(process.execPath, [cli, "editor", exampleResume, "--no-open", "--json", "--write-port-file", portFile], { cwd: root, env: { ...process.env, RESUME_SKILLS_NO_UPDATE_CHECK: "1" } });
  child.stdout.setEncoding("utf8");
  const [output] = await once(child.stdout, "data");

  try {
    const parsed = JSON.parse(output.trim());
    assert.equal(parsed.event, "server_started");
    await new Promise((resolve) => setTimeout(resolve, 50));
    const written = JSON.parse(await readFile(portFile, "utf8"));
    assert.equal(written.port, parsed.port);
    assert.equal(written.url, parsed.url);
    assert.equal(typeof written.pid, "number");
  } finally {
    child.kill();
    await once(child, "exit");
    await rm(directory, { recursive: true, force: true });
  }
});

test("editor CLI --json reports sync guard failures as JSON error events", () => {
  assert.throws(
    () => execFileSync(process.execPath, [cli, "editor", exampleResume, "--json", "--host", "0.0.0.0", "--no-open"], { cwd: root, encoding: "utf8", stdio: "pipe" }),
    (error) => {
      assert.equal(error.status, 1);
      const parsed = JSON.parse(error.stdout.toString().trim());
      assert.equal(parsed.event, "error");
      assert.match(parsed.error, /loopback/);
      return true;
    },
  );
});

test("editor CLI exits 1 with a JSON error event when the port is already taken", async () => {
  const blocker = createServer();
  await new Promise((resolve) => blocker.listen(0, "127.0.0.1", resolve));
  const takenPort = blocker.address().port;
  try {
    const child = spawn(process.execPath, [cli, "editor", exampleResume, "--no-open", "--json", "--port", String(takenPort)], { cwd: root, env: { ...process.env, RESUME_SKILLS_NO_UPDATE_CHECK: "1" } });
    child.stdout.setEncoding("utf8");
    const output = await Promise.race([
      once(child.stdout, "data").then(([chunk]) => chunk),
      new Promise((_, reject) => setTimeout(() => reject(new Error("editor did not emit an error event in time")), 5000)),
    ]);
    const exit = await Promise.race([
      once(child, "exit").then(([code]) => code),
      new Promise((_, reject) => setTimeout(() => reject(new Error("editor did not exit after listen failure")), 5000)),
    ]);
    const parsed = JSON.parse(output.trim());
    assert.equal(parsed.event, "error");
    assert.match(parsed.error, /启动失败/);
    assert.equal(exit, 1, "port conflict must exit non-zero instead of hanging");
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
});

test("editor CLI defaults to the fixed port 8848 when free", async (context) => {
  // 本机 8848 已被占用时跳过（并发 agent/外部服务），避免假失败。
  const probe = createServer();
  try {
    await new Promise((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(DEFAULT_PORT, "127.0.0.1", resolve);
    });
  } catch {
    context.skip(`default port ${DEFAULT_PORT} is already in use`);
    return;
  }
  await new Promise((resolve) => probe.close(resolve));

  const child = spawn(process.execPath, [cli, "editor", exampleResume, "--no-open", "--json"], { cwd: root, env: { ...process.env, RESUME_SKILLS_NO_UPDATE_CHECK: "1" } });
  child.stdout.setEncoding("utf8");
  const [output] = await once(child.stdout, "data");

  try {
    const parsed = JSON.parse(output.trim());
    assert.equal(parsed.event, "server_started");
    assert.equal(parsed.port, DEFAULT_PORT, "default port must be the fixed 8848");
    assert.match(parsed.url, new RegExp(`^http://127\\.0\\.0\\.1:${DEFAULT_PORT}$`));
  } finally {
    child.kill();
    await once(child, "exit");
  }
});

test("editor CLI falls back to the next free port when the default is taken, keeping JSON output clean", async () => {
  // 探针直接当 blocker 占用（listen(0)→close→再听在 Windows 上会竞态）。
  const blocker = createServer();
  await new Promise((resolve) => blocker.listen(0, "127.0.0.1", resolve));
  const basePort = blocker.address().port;
  const logs = [];
  const server = startEditor(exampleResume, { open: false, port: basePort, portFallback: true, json: true, logFn: (message) => logs.push(message) });
  await waitForListening(server);

  try {
    const started = logs.map((entry) => { try { return JSON.parse(entry); } catch { return null; } }).filter(Boolean).find((entry) => entry.event === "server_started");
    assert.ok(started, "must emit server_started after falling back");
    assert.equal(started.port, basePort + 1, "must walk to the next free port");
    assert.equal(logs.filter((entry) => entry.includes('"event":"server_started"')).length, 1, "JSON mode must not emit duplicate server_started lines");
  } finally {
    server.close();
    await once(server, "close");
    await new Promise((resolve) => blocker.close(resolve));
  }
});

test("startEditor falls back to a random free port after the scan window is exhausted", async () => {
  // 连续占用 base..base+5：第一口 listen(0) 当 base，后续端口递增占用（失败则整体重试）。
  const scanRange = 5;
  let basePort;
  let scanEnd;
  let blockers = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const first = createNetServer();
    try {
      await new Promise((resolve, reject) => {
        first.once("error", reject);
        first.listen(0, "127.0.0.1", resolve);
      });
    } catch {
      continue;
    }
    basePort = first.address().port;
    scanEnd = basePort + scanRange;
    blockers = [first];
    let ok = true;
    for (let port = basePort + 1; port <= scanEnd; port += 1) {
      const blocker = createNetServer();
      try {
        await new Promise((resolve, reject) => {
          blocker.once("error", reject);
          blocker.listen(port, "127.0.0.1", resolve);
        });
        blockers.push(blocker);
      } catch {
        ok = false;
        for (const item of blockers) await new Promise((resolve) => item.close(resolve));
        blockers = [];
        break;
      }
    }
    if (ok) break;
  }
  assert.ok(blockers.length === scanRange + 1, "must reserve a contiguous blocked port window");

  try {
    const server = startEditor(exampleResume, { open: false, log: false, port: basePort, portFallback: true });
    await waitForListening(server);
    try {
      const { port } = server.address();
      assert.ok(port > 0, "must still start on some port");
      assert.ok(port < basePort || port > scanEnd, `random port ${port} must not sit inside the blocked scan window ${basePort}-${scanEnd}`);
    } finally {
      server.close();
      await once(server, "close");
    }
  } finally {
    for (const blocker of blockers) await new Promise((resolve) => blocker.close(resolve));
  }
});

test("editor CLI rejects invalid --port values with a clear message", () => {
  for (const bad of ["abc", "99999"]) {
    assert.throws(
      () => execFileSync(process.execPath, [cli, "editor", exampleResume, "--json", "--no-open", "--port", bad], { cwd: root, encoding: "utf8", stdio: "pipe" }),
      (error) => {
        assert.equal(error.status, 1);
        const parsed = JSON.parse(error.stdout.toString().trim());
        assert.equal(parsed.event, "error");
        assert.match(parsed.error, /端口必须是/);
        return true;
      },
      `--port ${bad}`,
    );
  }
});

test("write-port-file failure is reported as a JSON event without stopping the server", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-portfile-fail-"));
  const portFile = join(directory, "no-such-dir", "port.json");
  const logs = [];
  const server = startEditor(exampleResume, { open: false, port: 0, json: true, logFn: (message) => logs.push(message), writePortFile: portFile });
  await once(server, "listening");

  try {
    const errorEvent = logs.find((entry) => entry.includes('"event":"error"'));
    assert.ok(errorEvent, "must emit a JSON error event for the port file write");
    assert.match(errorEvent, /无法写入端口文件/);
    const { port } = server.address();
    assert.equal((await fetch(`http://127.0.0.1:${port}/api/document`)).status, 200, "server must keep running");
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
});

test("validate subcommand rejects missing protocol attributes, empty files and missing files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-validate-fail-"));
  const cases = [
    { name: "missing-template.html", html: '<html data-resume-editor-version="1"><body><h1 data-resume-editor-id="profile-name">x</h1></body></html>', pattern: /template/ },
    { name: "missing-version.html", html: '<html data-resume-editor-template="modern-minimal"><body><h1 data-resume-editor-id="profile-name">x</h1></body></html>', pattern: /version/ },
    { name: "empty.html", html: "", pattern: /空|格式不正确/ },
    { name: "not-an-html.txt", html: '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><h1 data-resume-editor-id="profile-name">x</h1></body></html>', pattern: /只接受 \.html/ },
  ];
  try {
    for (const item of cases) {
      const sourcePath = join(directory, item.name);
      await writeFile(sourcePath, item.html);
      assert.throws(
        () => execFileSync(process.execPath, [cli, "validate", sourcePath], { cwd: root, encoding: "utf8", stdio: "pipe" }),
        (error) => error.status === 1 && item.pattern.test(error.stderr.toString()),
        item.name,
      );
    }
    assert.throws(
      () => execFileSync(process.execPath, [cli, "validate", join(directory, "missing.html")], { cwd: root, encoding: "utf8", stdio: "pipe" }),
      (error) => error.status === 1 && /无法读取/.test(error.stderr.toString()),
      "missing file",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("validate accepts all six built-in templates end to end", () => {
  const templateNames = ["modern-minimal", "classic-business", "creative-bold", "japanese-minimal", "minimal-blue-business", "tech-dark"];
  for (const name of templateNames) {
    const templatePath = join(root, "skills", "resume-builder", "references", "examples", `${name}.html`);
    const output = execFileSync(process.execPath, [cli, "validate", templatePath], { cwd: root, encoding: "utf8" });
    assert.match(output, /通过/, name);
  }
});

test("startEditor serves a zero-field document directly (the gate lives at the CLI entry)", async () => {
  await withEditorFixture(async (directory, sourcePath) => {
    const server = startEditor(sourcePath, { open: false, log: false });
    await once(server, "listening");
    try {
      const { port } = server.address();
      assert.equal((await fetch(`http://127.0.0.1:${port}/api/document`)).status, 200);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
async function makeTempHtml(html) {
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-cli-field-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, html);
  return { directory, sourcePath };
}

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
      const document = await (await fetch(`http://127.0.0.1:${port}/api/document`)).json();
      const response = await fetch(`http://127.0.0.1:${port}/api/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: document.documentId, html: sourceHtml.replace("</body>", "<script>alert(1)</script></body>") }),
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

const packageVersion = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version;

test("editor /api/version reports the local version and an injected latest", async () => {
  const logs = [];
  const logFn = (msg) => logs.push(msg);
  const server = startEditor(exampleResume, { open: false, log: false, json: true, logFn, checkLatest: async () => ({ version: "99.0.0" }) });
  await once(server, "listening");

  try {
    const { port } = server.address();
    let versionInfo;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      versionInfo = await (await fetch(`http://127.0.0.1:${port}/api/version`)).json();
      if (versionInfo.latest === "99.0.0") break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.match(versionInfo.name, /resume-skills/);
    assert.match(versionInfo.version, /^\d+\.\d+\.\d+$/);
    assert.equal(versionInfo.latest, "99.0.0");
    assert.equal(versionInfo.updateAvailable, true);

    // the async update notice must be emitted once the check settles
    for (let attempt = 0; attempt < 40 && !logs.some((entry) => entry.includes("update_available")); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const notice = logs.find((entry) => entry.includes("update_available"));
    assert.ok(notice, "JSON mode must log an update_available event");
    const parsed = JSON.parse(notice);
    assert.equal(parsed.event, "update_available");
    assert.equal(parsed.current, packageVersion);
    assert.equal(parsed.latest, "99.0.0");
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("editor /api/version reports no update when the check is skipped", async () => {
  const server = startEditor(exampleResume, { open: false, log: false });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const versionInfo = await (await fetch(`http://127.0.0.1:${port}/api/version`)).json();
    assert.equal(versionInfo.latest, null);
    assert.equal(versionInfo.updateAvailable, false);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("editor logs a plain-text update notice when a newer version exists", async () => {
  const logs = [];
  const logFn = (msg) => logs.push(msg);
  const server = startEditor(exampleResume, { open: false, log: true, logFn, checkLatest: async () => ({ version: "99.0.0" }) });
  await once(server, "listening");

  try {
    for (let attempt = 0; attempt < 40 && !logs.some((entry) => entry.includes("检测到新版本")); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const notice = logs.find((entry) => entry.includes("检测到新版本"));
    assert.ok(notice, "plain mode must print an update notice");
    assert.match(notice, /99.0.0/);
  } finally {
    server.close();
    await once(server, "close");
  }
});

async function readSseVersionEvent(reader, deadlineMs = 3000) {
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    const result = await Promise.race([
      reader.read(),
      new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), Math.max(1, deadline - Date.now()))),
    ]);
    if (result.timeout) break;
    buffer += decoder.decode(result.value || new Uint8Array(), { stream: !result.done });
    const match = buffer.match(/event: version\ndata: ([^\n]+)\n\n/);
    if (match) return JSON.parse(match[1]);
  }
  return null;
}

test("editor /api/version degrades when the latest check finds nothing, and broadcasts via SSE", async () => {
  const server = startEditor(exampleResume, { open: false, log: false, checkLatest: async () => null });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const versionInfo = await (await fetch(`http://127.0.0.1:${port}/api/version`)).json();
    assert.equal(versionInfo.latest, null);
    assert.equal(versionInfo.updateAvailable, false);
    assert.match(versionInfo.version, /^\d+\.\d+\.\d+$/);
    // SSE 连接建立时即收到当前版本状态（latest 为 null）
    const events = await fetch(`http://127.0.0.1:${port}/api/events`);
    const reader = events.body.getReader();
    const broadcast = await readSseVersionEvent(reader);
    assert.ok(broadcast, "SSE must deliver a version event on connect");
    assert.equal(broadcast.latest, null);
    assert.equal(broadcast.updateAvailable, false);
    reader.cancel();
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("editor SSE delivers the settled latest version to an already-open client", async () => {
  const server = startEditor(exampleResume, { open: false, log: false, checkLatest: async () => ({ version: "99.0.0" }) });
  await once(server, "listening");

  try {
    const { port } = server.address();
    const events = await fetch(`http://127.0.0.1:${port}/api/events`);
    const reader = events.body.getReader();
    let settled = null;
    for (let attempt = 0; attempt < 40 && !settled; attempt += 1) {
      const event = await readSseVersionEvent(reader, 200);
      if (event?.latest === "99.0.0") settled = event;
    }
    assert.ok(settled, "SSE must deliver a version event whose latest is the settled value");
    assert.equal(settled.updateAvailable, true);
    reader.cancel();
  } finally {
    server.close();
    await once(server, "close");
  }
});
