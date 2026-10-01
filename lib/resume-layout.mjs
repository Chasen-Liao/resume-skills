import { evaluateWhitespaceMeasurement } from "./layout-validation.mjs";

export const FULL_PAGE_LAYOUT = "full-page";

export const DEFAULT_RESUME_LAYOUT = Object.freeze({
  targetFillRatio: 0.98,
  minimumDensity: 0.84,
  maxIterations: 9,
});

function numericOption(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

/**
 * Let a visual A4 document use its existing content to fill the page and
 * compact itself only when the content would overflow. The CSS contract is
 * intentionally opt-in so ATS documents and third-party HTML are untouched.
 */
export async function fitResumeLayout(page, options = {}) {
  const config = {
    ...DEFAULT_RESUME_LAYOUT,
    ...options,
    minimumDensity: Math.max(0.5, Math.min(1, numericOption(options.minimumDensity, DEFAULT_RESUME_LAYOUT.minimumDensity))),
    maxIterations: Math.max(1, Math.floor(numericOption(options.maxIterations, DEFAULT_RESUME_LAYOUT.maxIterations))),
  };

  const result = await page.evaluate(async ({ layoutName, minimumDensity, maxIterations, targetFillRatio }) => {
    const resume = document.querySelector(".resume");
    if (!resume) {
      return {
        status: "degraded",
        message: "找不到 .resume A4 容器，无法执行视觉版布局验收。",
      };
    }

    const root = document.documentElement;
    const isFullPage = root.dataset.resumeLayout === layoutName || resume.dataset.resumeLayout === layoutName;
    const measure = () => {
      const resumeRect = resume.getBoundingClientRect();
      const paddingBottom = Number.parseFloat(getComputedStyle(resume).paddingBottom) || 0;
      const boxes = [...resume.querySelectorAll("*")]
        .filter((element) => {
          const style = getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" && style.position !== "fixed" && style.position !== "absolute";
        })
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0);
      const contentTop = boxes.length ? Math.min(...boxes.map((rect) => rect.top)) : resumeRect.top;
      const contentBottom = boxes.length ? Math.max(...boxes.map((rect) => rect.bottom)) : resumeRect.top;
      const safeBottom = resumeRect.bottom - paddingBottom;
      const safeTop = resumeRect.top + (Number.parseFloat(getComputedStyle(resume).paddingTop) || 0);
      // Measure visible text/image bounds, not stretched layout containers.
      const visible = (element) => {
        for (let current = element; current && current !== resume.parentElement; current = current.parentElement) {
          const style = getComputedStyle(current);
          if (style.display === "none" || style.visibility !== "visible" || style.opacity === "0"
            || style.position === "fixed" || style.position === "absolute") return false;
        }
        return true;
      };
      const measureRegion = (element, selector, top, bottom) => {
        const rects = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim() || !visible(node.parentElement)
            || node.parentElement.closest("script, style")) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          rects.push(...range.getClientRects());
        }
        for (const image of element.querySelectorAll("img")) {
          if (visible(image)) rects.push(image.getBoundingClientRect());
        }
        const rows = rects.filter((rect) => rect.width > 0 && rect.height > 0)
          .sort((a, b) => a.top - b.top);
        let maxGap = 0;
        let lastBottom = rows[0]?.bottom ?? top;
        for (const row of rows.slice(1)) {
          maxGap = Math.max(maxGap, row.top - lastBottom);
          lastBottom = Math.max(lastBottom, row.bottom);
        }
        return { selector, safeTop: top, safeBottom: bottom, hasContent: rows.length > 0,
          contentTop: rows[0]?.top ?? top, contentBottom: lastBottom, maxGap };
      };
      const regions = [measureRegion(resume, ".resume", safeTop, safeBottom)];
      // Check each grid column independently: text in another column cannot fill it.
      for (const grid of resume.querySelectorAll(".layout-grid")) {
        const columns = [...grid.children].filter(visible);
        if (columns.length < 2 || getComputedStyle(grid).display !== "grid") continue;
        const rect = grid.getBoundingClientRect();
        const atPageBottom = grid === resume.lastElementChild;
        columns.forEach((column, index) => regions.push(measureRegion(column,
          `.layout-grid 栏 ${index + 1}`, rect.top, atPageBottom ? safeBottom : rect.bottom)));
      }
      return {
        selector: ".resume",
        scrollHeight: resume.scrollHeight,
        clientHeight: resume.clientHeight,
        scrollWidth: resume.scrollWidth,
        clientWidth: resume.clientWidth,
        contentTop,
        contentBottom,
        safeBottom,
        bottomOverflow: Math.max(0, contentBottom - safeBottom),
        regions,
      };
    };
    const hasOverflow = (measurement) => measurement.scrollHeight - measurement.clientHeight > 1
      || measurement.scrollWidth - measurement.clientWidth > 1
      || measurement.bottomOverflow > 1;
    const waitForLayout = async () => {
      await document.fonts?.ready;
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    };

    if (!isFullPage) {
      await waitForLayout();
      const measurement = measure();
      return {
        status: hasOverflow(measurement) ? "fail" : "pass",
        message: "HTML 未声明 full-page 布局契约，已跳过自动密度调整。",
        density: null,
        iterations: 0,
        measurement,
        targetFillRatio,
      };
    }

    // Keep the source HTML usable in a normal browser as well as in print.
    resume.style.setProperty("justify-content", "space-between");
    await waitForLayout();
    let density = Number.parseFloat(getComputedStyle(root).getPropertyValue("--resume-density")) || 1;
    const declaredMinimum = Number.parseFloat(getComputedStyle(root).getPropertyValue("--resume-density-min"));
    const effectiveMinimum = Number.isFinite(declaredMinimum)
      ? Math.max(minimumDensity, Math.min(1, declaredMinimum))
      : minimumDensity;
    const initialDensity = density;
    let measurement = measure();
    let iterations = 0;
    while (hasOverflow(measurement)
      && density > effectiveMinimum + 0.0001 && iterations < maxIterations) {
      iterations += 1;
      density = Math.max(effectiveMinimum, density - ((initialDensity - effectiveMinimum) / maxIterations));
      root.style.setProperty("--resume-density", density.toFixed(3));
      await waitForLayout();
      measurement = measure();
    }

    const overflow = hasOverflow(measurement);
    return {
      status: overflow ? "fail" : "pass",
      message: overflow
        ? `内容在密度 ${density.toFixed(3)} 下仍超出 A4 容器，请精简低相关内容或人工确认版式。`
        : `full-page 布局已应用，密度 ${density.toFixed(3)}，未检测到 A4 容器溢出。`,
      density,
      initialDensity,
      iterations,
      measurement,
      targetFillRatio,
      minimumDensity: effectiveMinimum,
    };
  }, {
    layoutName: FULL_PAGE_LAYOUT,
    minimumDensity: config.minimumDensity,
    maxIterations: config.maxIterations,
    targetFillRatio: config.targetFillRatio,
  });
  if (result.status === "pass") {
    const whitespace = evaluateWhitespaceMeasurement(result.measurement, config.targetFillRatio);
    result.whitespace = whitespace;
    if (whitespace.status === "fail") {
      result.status = "fail";
      result.message = whitespace.message;
    }
  }
  return result;
}
