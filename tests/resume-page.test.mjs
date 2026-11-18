import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import {
  RESUME_FONT_TIMEOUT_MS,
  RESUME_VIEWPORT,
  loadResumePage,
  openResumePage,
  waitForResumeFonts,
} from "../lib/resume-page.mjs";

const exampleResume = resolve("skills/resume-builder/references/examples/modern-minimal.html");
const measureScript = resolve("skills/resume-builder/scripts/measure_resume_layout.mjs");
const renderScript = resolve("skills/resume-builder/scripts/render_resume.mjs");

test("waitForResumeFonts resolves within timeout even if document.fonts.ready hangs", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: RESUME_VIEWPORT });
    await page.setContent("<html><body><p>Test</p></body></html>");
    // Mock hanging font promise
    await page.evaluate(() => {
      Object.defineProperty(document.fonts, "ready", {
        get: () => new Promise(() => {}),
        configurable: true,
      });
    });

    const start = Date.now();
    await waitForResumeFonts(page, 150);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 120 && elapsed < 2000, `Expected timeout around 150ms, took ${elapsed}ms`);
  } finally {
    await browser.close();
  }
});

test("openResumePage loads resume with print media emulation and default A4 viewport", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await openResumePage(browser, exampleResume);
    const viewport = page.viewportSize();
    assert.equal(viewport?.width, 794);
    assert.equal(viewport?.height, 1123);

    const isPrint = await page.evaluate(() => window.matchMedia("print").matches);
    assert.equal(isPrint, true, "Media should be emulated as print");

    const hasResume = await page.evaluate(() => Boolean(document.querySelector(".resume")));
    assert.equal(hasResume, true);
  } finally {
    await browser.close();
  }
});

test("render_resume.mjs and measure_resume_layout.mjs share the page loader without networkidle", () => {
  const measureSource = readFileSync(measureScript, "utf8");
  const renderSource = readFileSync(renderScript, "utf8");

  assert.doesNotMatch(measureSource, /waitUntil:\s*['"]networkidle['"]/, "measure_resume_layout must not wait for networkidle");
  assert.doesNotMatch(renderSource, /waitUntil:\s*['"]networkidle['"]/, "render_resume must not wait for networkidle");

  assert.match(measureSource, /resume-page\.mjs/, "measure_resume_layout must import shared page loader");
  assert.match(renderSource, /resume-page\.mjs/, "render_resume must import shared page loader");
});

test("measure_resume_layout CLI produces valid layout JSON and exit code 0 for valid resume", () => {
  const result = spawnSync(process.execPath, [measureScript, "--html", exampleResume, "--min-fill-ratio", "0.9"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, "pass");
  assert.ok(parsed.layout, "Output must contain layout object");
  assert.equal(parsed.layout.status, "pass");
  assert.equal(parsed.layout.targetFillRatio, 0.9);
});
