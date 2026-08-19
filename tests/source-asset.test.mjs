import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveSourceAsset } from "../lib/source-asset.mjs";

const sourcePath = join(tmpdir(), "resumes", "demo", "resume.html");
const sourceDirectory = join(tmpdir(), "resumes", "demo");

test("resolves a relative asset inside the resume directory", () => {
  assert.equal(
    resolveSourceAsset(sourcePath, "/avatar.png"),
    join(sourceDirectory, "avatar.png"),
  );
});

test("rejects a path that escapes the resume directory", () => {
  assert.throws(
    () => resolveSourceAsset(sourcePath, "/../secret.txt"),
    /outside/i,
  );
});
