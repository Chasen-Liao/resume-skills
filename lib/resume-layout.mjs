import { fitResumeInBrowser } from "./editor-controls.mjs";
import { evaluateWhitespaceMeasurement } from "./layout-validation.mjs";
import { RESUME_FONT_TIMEOUT_MS } from "./resume-page.mjs";

export const FULL_PAGE_LAYOUT = "full-page";

export const DEFAULT_RESUME_LAYOUT = Object.freeze({
  targetFillRatio: 0.98,
  minimumDensity: 0.84,
  maximumDensity: 1.2,
  maxIterations: 9,
  fontTimeoutMs: RESUME_FONT_TIMEOUT_MS,
});

function numericOption(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

async function unreadablePrintImages(page) {
  return page.locator(".resume img").evaluateAll(async (elements) => {
    const images = elements.filter((img) => img.checkVisibility({ visibilityProperty: true, opacityProperty: true }));
    if (!images.length) return [];
    for (const img of images) img.loading = "eager";
    let timeout;
    try {
      await Promise.race([
        Promise.allSettled(images.map((img) => img.decode())),
        new Promise((resolve) => { timeout = setTimeout(resolve, 5000); }),
      ]);
    } finally {
      clearTimeout(timeout);
    }
    return images.filter((img) => !img.complete || !img.naturalWidth).map((img) => {
      const source = img.getAttribute("src") || "";
      return source.startsWith("data:") ? (img.alt || "内嵌图片") : (source || img.alt || "图片");
    });
  });
}

/**
 * Let a visual A4 document use its existing content to fill the page and
 * grow short content within readable limits, or compact overflowing content. The CSS contract is
 * intentionally opt-in so ATS documents and third-party HTML are untouched.
 */
export async function fitResumeLayout(page, options = {}) {
  const config = {
    ...DEFAULT_RESUME_LAYOUT,
    ...options,
    minimumDensity: Math.max(0.5, Math.min(1, numericOption(options.minimumDensity, DEFAULT_RESUME_LAYOUT.minimumDensity))),
    maximumDensity: Math.max(1, Math.min(1.2, numericOption(options.maximumDensity, DEFAULT_RESUME_LAYOUT.maximumDensity))),
    maxIterations: Math.max(1, Math.floor(numericOption(options.maxIterations, DEFAULT_RESUME_LAYOUT.maxIterations))),
    fontTimeoutMs: Math.max(0, numericOption(options.fontTimeoutMs, RESUME_FONT_TIMEOUT_MS)),
  };

  const missingImages = await unreadablePrintImages(page);
  const result = await page.evaluate(fitResumeInBrowser, {
    layoutName: FULL_PAGE_LAYOUT,
    minimumDensity: config.minimumDensity,
    maximumDensity: config.maximumDensity,
    maxIterations: config.maxIterations,
    targetFillRatio: config.targetFillRatio,
    fontTimeoutMs: config.fontTimeoutMs,
  });
  if (result.status === "pass") {
    const whitespace = evaluateWhitespaceMeasurement(result.measurement, config.targetFillRatio);
    result.whitespace = whitespace;
    if (whitespace.status === "fail") {
      result.status = "fail";
      result.message = whitespace.message;
    }
  }
  if (missingImages.length && result.measurement) {
    result.message = `打印版图片未加载：${missingImages.join("、")}。${result.status === "fail" ? result.message : ""}`;
    result.status = "fail";
  }
  return result;
}
