import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const RESUME_VIEWPORT = Object.freeze({ width: 794, height: 1123 });
export const RESUME_FONT_TIMEOUT_MS = 5000;

/**
 * Wait for document fonts to be ready or time out to avoid blocking offline / slow font loads.
 */
export async function waitForResumeFonts(page, timeoutMs = RESUME_FONT_TIMEOUT_MS) {
  const safeTimeoutMs = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) >= 0
    ? Number(timeoutMs)
    : RESUME_FONT_TIMEOUT_MS;
  let timerId;
  let timedOut = false;
  try {
    await Promise.race([
      page.evaluate(() => document.fonts?.ready).catch(() => {}),
      new Promise((resolveTimeout) => {
        timerId = setTimeout(() => {
          timedOut = true;
          resolveTimeout();
        }, safeTimeoutMs);
      }),
    ]);
  } finally {
    if (timerId !== undefined) clearTimeout(timerId);
  }
  await page.evaluate((didTimeout) => {
    window.__resumeFontsTimedOut = didTimeout;
  }, timedOut).catch(() => {});
  return { timedOut };
}

/**
 * Navigate a page to the target resume HTML, emulating print media and waiting for DOMContentLoaded + fonts.
 */
export async function loadResumePage(page, htmlPath, options = {}) {
  const url = typeof htmlPath === "string" && !htmlPath.startsWith("file:") && !htmlPath.startsWith("http:") && !htmlPath.startsWith("https:")
    ? pathToFileURL(resolve(htmlPath)).href
    : htmlPath;
  const fontTimeoutMs = options.fontTimeoutMs ?? RESUME_FONT_TIMEOUT_MS;

  await page.emulateMedia({ media: "print" });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForResumeFonts(page, fontTimeoutMs);
  return page;
}

/**
 * Open a new page with standard A4 print viewport and load the target resume.
 */
export async function openResumePage(browser, htmlPath, options = {}) {
  const page = await browser.newPage({
    viewport: RESUME_VIEWPORT,
    deviceScaleFactor: 1,
    ...options.newPageOptions,
  });
  await loadResumePage(page, htmlPath, options);
  return page;
}
