#!/usr/bin/env node
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { fitResumeLayout } from "../../../lib/resume-layout.mjs";

const { values } = parseArgs({
  options: {
    html: { type: "string" },
    pdf: { type: "string" },
    preview: { type: "string" },
    json: { type: "boolean", default: false },
  },
});

if (!values.html || !values.pdf) {
  console.error("Usage: render_resume.mjs --html <resume.html> --pdf <resume.pdf> [--preview <preview.png>] [--json]");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { version: playwrightVersion } = require("playwright/package.json");
const htmlPath = resolve(values.html);
const pdfPath = resolve(values.pdf);
const previewPath = values.preview ? resolve(values.preview) : null;

function report(value) {
  if (values.json) console.log(JSON.stringify(value));
  else console.log(value.message || JSON.stringify(value));
}

let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ media: "print" });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "domcontentloaded" });
  await Promise.race([
    page.evaluate(() => document.fonts?.ready),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);

  const layout = await fitResumeLayout(page);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  if (previewPath) {
    await page.screenshot({
      path: previewPath,
      type: "png",
      clip: { x: 0, y: 0, width: 794, height: 1123 },
    });
  }

  report({
    status: layout.status,
    message: layout.message,
    layout,
    renderer: `playwright@${playwrightVersion}`,
    html: htmlPath,
    pdf: pdfPath,
    preview: previewPath,
  });
} catch (error) {
  report({ status: "degraded", message: `视觉版渲染不可用：${error.message}` });
  process.exitCode = 1;
} finally {
  await browser?.close();
}
