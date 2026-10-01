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

test("creative template uses confirmed demo content without oversized whitespace", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.emulateMedia({ media: "print" });
    await page.goto(pathToFileURL("skills/resume-builder/references/examples/creative-bold.html").href);
    const result = await fitResumeLayout(page);
    assert.equal(result.status, "pass", result.message);
    const fields = await page.locator("[data-resume-editor-id]").count();
    assert.ok(fields > 30);
  } finally {
    await browser.close();
  }
});

test("layout rejects a sparse column and large gaps even when another block reaches the bottom", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.emulateMedia({ media: "print" });
    for (const mode of ["column", "gap", "bottom"]) {
      await page.setContent(`<html data-resume-layout="full-page"><style>
        * { box-sizing: border-box; margin: 0; }
        .resume { width: 794px; height: 1123px; padding: 38px 38px 55px; display: flex; flex-direction: column; }
        .layout-grid { display: grid; grid-template-columns: 1fr 1fr; flex: 1; }
        .left-col, .right-col { display: flex; flex-direction: column; justify-content: space-between; }
        p { height: 20px; }
      </style><div class="resume">${mode === "column"
        ? `<div class="layout-grid"><div class="left-col">${Array.from({length: 12}, () => '<p>Confirmed content</p>').join('')}</div><div class="right-col"><p>Short column</p></div></div>`
        : mode === "gap" ? '<p>Header</p><p>Bottom text</p>' : '<div><p>Header</p><p>Short content</p></div>'}
      </div></html>`);
      const result = await fitResumeLayout(page);
      assert.equal(result.status, "fail", mode);
      assert.match(result.message, /留白|空隙/, mode);
    }
  } finally {
    await browser.close();
  }
});

test("layout accepts evenly spaced content with safe margins", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<html data-resume-layout="full-page"><style>
      * { box-sizing: border-box; margin: 0; }
      .resume { width: 794px; height: 1123px; padding: 38px 38px 55px; display: flex; flex-direction: column; }
    </style><div class="resume">${Array.from({ length: 12 }, () => '<p>Confirmed content</p>').join('')}</div></html>`);
    assert.equal((await fitResumeLayout(page)).status, "pass");
  } finally {
    await browser.close();
  }
});
