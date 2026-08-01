#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { evaluateOverflowMeasurement } from "../../../lib/layout-validation.mjs";

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  await page.emulateMedia({ media: "print" });
  await page.goto(pathToFileURL(resolve(values.html)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  const measurement = await page.evaluate(() => {
    const resume = document.querySelector(".resume");
    if (!resume) throw new Error("找不到 .resume A4 容器");
    return {
      selector: ".resume",
      scrollHeight: resume.scrollHeight,
      clientHeight: resume.clientHeight,
      scrollWidth: resume.scrollWidth,
      clientWidth: resume.clientWidth,
    };
  });
  console.log(JSON.stringify(evaluateOverflowMeasurement(measurement)));
} catch (error) {
  console.log(JSON.stringify({
    status: "degraded",
    message: `Playwright 布局测量不可用：${error.message}。请安装 Playwright 与 Chromium 后重试。`,
  }));
  process.exitCode = 2;
} finally {
  await browser?.close();
}
