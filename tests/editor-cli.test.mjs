import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { nextExportPath, startEditor } from "../bin/resume-skills.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = fileURLToPath(new URL("../bin/resume-skills.mjs", import.meta.url));
const exampleResume = fileURLToPath(new URL("../skills/resume-builder/references/examples/modern-minimal.html", import.meta.url));

test("editor help documents an HTML input path", () => {
  const output = execFileSync(process.execPath, [cli, "editor", "--help"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.match(output, /resume-skills editor <resume\.html>/);
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
