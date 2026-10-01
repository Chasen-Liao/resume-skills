import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { chromium } from "playwright";
import { startEditor } from "../bin/resume-skills.mjs";

test("real template save invalidates delivery and re-render verifies edited text and typography", {
  skip: process.platform !== "win32", timeout: 120000,
}, async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-delivery-"));
  const html = join(directory, "resume.html");
  const pdf = join(directory, "resume.pdf");
  const manifest = join(directory, "resume.resume-manifest.json");
  const render = () => {
    const result = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
      resolve("skills/resume-builder/scripts/render_resume.ps1"), "-HTML", html, "-OutputPdf", pdf], {
      encoding: "utf8", timeout: 60000, env: { ...process.env, PYTHONIOENCODING: "utf-8" }, windowsHide: true,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  };
  let server;
  let browser;
  try {
    await copyFile("skills/resume-builder/references/examples/modern-minimal.html", html);
    await copyFile("skills/resume-builder/references/examples/avatar.png", join(directory, "avatar.png"));
    render();
    assert.equal(JSON.parse(await readFile(manifest, "utf8")).status, "valid");
    server = startEditor(html, { open: false, log: false, manifestPath: manifest });
    await once(server, "listening");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
    await frame.locator('[data-resume-editor-id="profile-name"]').click();
    await page.locator("#selected-text").fill("DEMO 编辑后姓名");
    await page.locator("#font-size").fill("23.5");
    await page.locator("#font-size").dispatchEvent("change");
    await page.locator("#save-html").click();
    await page.waitForFunction(() => document.querySelector("#save-status")?.textContent.includes("已成功保存"));
    const saved = await readFile(html, "utf8");
    assert.match(saved, /DEMO 编辑后姓名/);
    assert.match(saved, /font-size:\s*23\.5px/);
    assert.notEqual(await readFile(`${html}.bak`, "utf8"), saved);
    assert.equal(JSON.parse(await readFile(manifest, "utf8")).validation.deliverable, false);
    await browser.close(); browser = null;
    await new Promise((resolve) => server.close(resolve)); server = null;
    render();
    const verified = JSON.parse(await readFile(manifest, "utf8"));
    assert.equal(verified.status, "valid");
    assert.equal(verified.validation.deliverable, true);
    const extracted = spawnSync("python", ["-X", "utf8", "skills/resume-builder/scripts/validate_resume.py",
      "--pdf", pdf, "--required-text", "DEMO 编辑后姓名"], { encoding: "utf8" });
    assert.equal(extracted.status, 0, extracted.stdout + extracted.stderr);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
