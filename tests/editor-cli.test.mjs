import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { nextExportPath } from "../bin/resume-skills.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = fileURLToPath(new URL("../bin/resume-skills.mjs", import.meta.url));

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
