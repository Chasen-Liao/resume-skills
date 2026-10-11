import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { chromium } from "playwright";
import { fitResumeLayout } from "../lib/resume-layout.mjs";

test("all visual templates reserve nine mm total at the bottom and retain other margins", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    const directory = "skills/resume-builder/references/examples";
    for (const name of readdirSync(directory).filter((name) => name.endsWith(".html"))) {
      await page.goto(pathToFileURL(`${directory}/${name}`).href);
      for (const media of ["screen", "print"]) {
        await page.emulateMedia({ media });
        const margins = await page.locator(".resume").evaluate((resume) => {
          const style = getComputedStyle(resume);
          return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]
            .map((value) => Number.parseFloat(value) * 25.4 / 96);
        });
        assert.ok(Math.abs(margins[2] - 9) < 0.02, `${name} ${media}: ${margins}`);
        const expectedOther = name === "classic-business.html" ? 12 : 10;
        for (const index of [0, 1, 3]) {
          const expected = expectedOther + (name === "minimal-blue-business.html" && index === 3 ? 8 * 25.4 / 96 : 0);
          assert.ok(Math.abs(margins[index] - expected) < 0.02, `${name} ${media}: ${margins}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
});

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

test("short content grows typography and spacing before distributing spare space", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: "print" });
    await page.setContent(`<html data-resume-layout="full-page"><style>
      :root { --resume-density: 1; --resume-density-max: 1.2; }
      * { box-sizing: border-box; margin: 0; }
      .resume { width: 794px; height: 1123px; padding: 38px 38px 34px; display: flex; flex-direction: column; justify-content: space-between; }
      section { flex: 0 0 auto; margin-bottom: calc(18px * var(--resume-density)); }
      section:last-child { margin-bottom: 0; }
      h2 { font-size: calc(14px * var(--resume-density)); line-height: 1.4; }
      p { font-size: calc(12px * var(--resume-density)); line-height: calc(1 + .4 * var(--resume-density)); }
    </style><main class="resume">${Array.from({ length: 8 }, () => '<section><h2>Confirmed section</h2><p>Confirmed line one</p><p>Confirmed line two</p><p>Confirmed line three</p></section>').join('')}</main></html>`);
    const text = await page.locator(".resume").innerText();
    const baselineGap = (await fitResumeLayout(page, { maximumDensity: 1 })).measurement.regions[0].maxGap;
    const result = await fitResumeLayout(page);
    assert.equal(result.status, "pass", result.message);
    assert.ok(result.density > 1 && result.density <= 1.2);
    assert.ok(result.measurement.regions[0].maxGap < baselineGap);
    assert.ok(await page.locator("p").first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize) > 12));
    assert.equal(await page.locator(".resume").innerText(), text);
    assert.ok(result.measurement.bottomOverflow <= 1);
    const repeated = await fitResumeLayout(page);
    assert.equal(repeated.density, result.density, "rechecking must not cumulatively enlarge the layout");
  } finally {
    await browser.close();
  }
});

test("short content expansion rolls back when an unbreakable line would overflow", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<html data-resume-layout="full-page"><style>
      :root { --resume-density: 1; --resume-density-max: 1.2; }
      * { box-sizing: border-box; margin: 0; }
      .resume { height: 1123px; padding: 38px 38px 34px; display: flex; flex-direction: column; }
      p { font: calc(12px * var(--resume-density))/1.4 Arial; white-space: nowrap; }
    </style><main class="resume">${Array.from({ length: 12 }, () => '<p>Confirmed unbreakable content</p>').join('')}</main></html>`);
    await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector("p"));
      document.querySelector(".resume").style.width = `${range.getBoundingClientRect().width + 76}px`;
    });
    const result = await fitResumeLayout(page);
    assert.equal(result.status, "pass", result.message);
    assert.equal(result.density, 1);
    assert.ok(result.iterations > 0);
    assert.ok(result.measurement.scrollWidth - result.measurement.clientWidth <= 1);
  } finally {
    await browser.close();
  }
});

test("full-page fixture declares a safe density floor", () => {
  const html = readFileSync("skills/resume-builder/tests/fixtures/visual-long.html", "utf8");
  assert.match(html, /data-resume-layout="full-page"/);
  assert.match(html, /--resume-density-min:\s*0\.84/);
  assert.match(html, /--resume-fill-target:\s*0\.98/);
  assert.match(html, /--resume-bottom-margin:\s*9mm/);
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
