import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { resolveSourceAsset } from "../lib/source-asset.mjs";

test("resolves a relative asset inside the resume directory", () => {
  assert.equal(
    resolveSourceAsset("D:/resumes/demo/resume.html", "/avatar.png"),
    join("D:/resumes/demo", "avatar.png"),
  );
});

test("rejects a path that escapes the resume directory", () => {
  assert.throws(
    () => resolveSourceAsset("D:/resumes/demo/resume.html", "/../secret.txt"),
    /outside/i,
  );
});
