import assert from "node:assert/strict";
import test from "node:test";
import { compareVersions, fetchLatestVersion, formatUpdateNotice, isUpdateAvailable, resolveCliVersion } from "../lib/version-check.mjs";

test("compareVersions orders semantic versions numerically", () => {
  assert.equal(compareVersions("0.5.2", "0.5.2"), 0);
  assert.equal(compareVersions("0.5.3", "0.5.2"), 1);
  assert.equal(compareVersions("0.5.2", "0.5.3"), -1);
  assert.equal(compareVersions("1.0.0", "0.9.9"), 1);
  assert.equal(compareVersions("0.6.0", "0.5.99"), 1);
  assert.equal(compareVersions("0.5.10", "0.5.9"), 1);
});

test("compareVersions treats missing parts as zero", () => {
  assert.equal(compareVersions("0.5", "0.5.0"), 0);
  assert.equal(compareVersions("0.5", "0.5.1"), -1);
});

test("isUpdateAvailable only reports a strictly newer latest", () => {
  assert.equal(isUpdateAvailable("0.5.2", "0.5.3"), true);
  assert.equal(isUpdateAvailable("0.5.3", "0.5.2"), false);
  assert.equal(isUpdateAvailable("0.5.3", "0.5.3"), false);
  assert.equal(isUpdateAvailable("0.5.3", null), false);
});

test("fetchLatestVersion resolves the registry version on success", async () => {
  const result = await fetchLatestVersion({
    fetchImpl: async () => ({ ok: true, json: async () => ({ version: "9.9.9" }) }),
  });
  assert.deepEqual(result, { version: "9.9.9" });
});

test("fetchLatestVersion returns null on non-200 responses", async () => {
  const result = await fetchLatestVersion({
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({}) }),
  });
  assert.equal(result, null);
});

test("fetchLatestVersion returns null when the registry call throws", async () => {
  const result = await fetchLatestVersion({
    fetchImpl: async () => { throw new Error("network down"); },
  });
  assert.equal(result, null);
});

test("fetchLatestVersion returns null when the payload has no version", async () => {
  const result = await fetchLatestVersion({
    fetchImpl: async () => ({ ok: true, json: async () => ({ error: "not found" }) }),
  });
  assert.equal(result, null);
});

test("fetchLatestVersion aborts after the configured timeout", async () => {
  const start = Date.now();
  const result = await fetchLatestVersion({
    timeoutMs: 50,
    fetchImpl: async (_url, { signal }) => {
      await new Promise((resolve) => {
        signal.addEventListener("abort", resolve);
      });
      throw new Error("aborted");
    },
  });
  assert.equal(result, null);
  assert.ok(Date.now() - start < 2000, "timeout must abort quickly");
});

test("formatUpdateNotice names both the current and the latest version", () => {
  const notice = formatUpdateNotice({ current: "0.5.2", latest: "0.5.3" });
  assert.match(notice, /0.5.3/);
  assert.match(notice, /0.5.2/);
  assert.match(notice, /@chasen-liao\/resume-skills@latest/);
});

test("resolveCliVersion reads the version from package.json", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = await mkdtemp(join(tmpdir(), "vc-"));
  try {
    await writeFile(join(directory, "package.json"), JSON.stringify({ name: "x", version: "1.2.3" }));
    assert.equal(resolveCliVersion(directory), "1.2.3");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("resolveCliVersion returns null when package.json is missing or invalid", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const missing = await mkdtemp(join(tmpdir(), "vc-missing-"));
  const invalid = await mkdtemp(join(tmpdir(), "vc-invalid-"));
  try {
    await writeFile(join(invalid, "package.json"), "not json");
    assert.equal(resolveCliVersion(missing), null);
    assert.equal(resolveCliVersion(invalid), null);
  } finally {
    await rm(missing, { recursive: true, force: true });
    await rm(invalid, { recursive: true, force: true });
  }
});

test("fetchLatestVersion settles even when fetchImpl never resolves", async () => {
  const start = Date.now();
  const result = await fetchLatestVersion({
    timeoutMs: 50,
    fetchImpl: async () => new Promise(() => {}), // 完全不响应 signal 也不会 resolve
  });
  assert.equal(result, null);
  assert.ok(Date.now() - start < 2000, "must settle via the race guard");
});
