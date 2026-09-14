#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { evaluateOverflowMeasurement } from "../../../lib/layout-validation.mjs";
import { fitResumeLayout } from "../../../lib/resume-layout.mjs";

const { values } = parseArgs({
  options: { html: { type: "string" } },
});

if (!values.html) {
  console.error("Usage: measure_resume_layout.mjs --html <resume.html>");
  process.exit(1);
}

let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.emulateMedia({ media: "print" });
  await page.goto(pathToFileURL(resolve(values.html)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  const layout = await fitResumeLayout(page);
  if (layout.status === "degraded") {
    console.log(JSON.stringify(layout));
  } else {
    const result = evaluateOverflowMeasurement(layout.measurement);
    console.log(JSON.stringify({
      ...result,
      status: layout.status === "fail" ? "fail" : result.status,
      message: layout.status === "fail" ? layout.message : result.message,
      layout,
    }));
  }
} catch (error) {
  console.log(JSON.stringify({
    status: "degraded",
    message: `Playwright 布局测量不可用：${error.message}。请安装 Playwright 与 Chromium 后重试。`,
  }));
  process.exitCode = 2;
} finally {
  await browser?.close();
}
