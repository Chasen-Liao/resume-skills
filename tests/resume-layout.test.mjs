import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright";
import { fitResumeLayout } from "../lib/resume-layout.mjs";

test("full-page layout automatically lowers density for long content", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.emulateMedia({ media: "print" });
    await page.goto(pathToFileURL("skills/resume-builder/references/examples/modern-minimal.html").href, {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(() => {
      document.querySelector(".resume").insertAdjacentHTML(
        "beforeend",
        Array.from({ length: 35 }, (_, index) => `<p>density fixture row ${index} with enough text to exercise the compact layout path.</p>`).join(""),
      );
    });

    const result = await fitResumeLayout(page);

    assert.equal(result.status, "pass");
    assert.ok(result.iterations > 0);
    assert.ok(result.density < result.initialDensity);
    assert.ok(result.density >= result.minimumDensity);
    assert.equal(result.measurement.scrollHeight, result.measurement.clientHeight);
    assert.ok(result.measurement.bottomOverflow <= 1);
  } finally {
    await browser.close();
  }
});

test("full-page fixture declares a safe density floor", () => {
  const html = readFileSync("skills/resume-builder/tests/fixtures/visual-long.html", "utf8");
  assert.match(html, /data-resume-layout="full-page"/);
  assert.match(html, /--resume-density-min:\s*0\.84/);
  assert.match(html, /--resume-fill-target:\s*0\.98/);
  assert.match(html, /--resume-bottom-safe:\s*4\.5mm/);
});
