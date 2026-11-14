export const controlEventTypes = ["input", "change", "blur"];

export function importantDeclaration(property, value) {
  return `${property}: ${value} !important;`;
}

export function appendOverrideRule(stylesheet, editorId, property, value) {
  const safeId = String(editorId).replace(/["\\]/g, "\\$&");
  const selector = `[data-resume-editor-id="${safeId}"]`;
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedProperty = String(property).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingDeclaration = new RegExp(`(${escapedSelector}\\s*\\{\\s*${escapedProperty}\\s*:\\s*)[^;}]+(;\\s*\\})`);
  if (existingDeclaration.test(stylesheet)) {
    return stylesheet.replace(existingDeclaration, `$1${value} !important$2`);
  }
  return `${stylesheet}${selector} { ${importantDeclaration(property, value)} }\n`;
}

export function removeOverrideRules(stylesheet, editorId) {
  const safeId = String(editorId).replace(/["\\]/g, "\\$&");
  const selector = `[data-resume-editor-id="${safeId}"]`;
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stylesheet.replace(new RegExp(`${escapedSelector}\\s*\\{[^{}]*\\}\\s*`, "g"), "");
}

export function upsertRootToken(stylesheet, token, value) {
  const escapedToken = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rootRule = /:root\s*\{([^{}]*)\}/;
  if (!rootRule.test(stylesheet)) return `${stylesheet}:root { ${token}: ${value}; }\n`;
  return stylesheet.replace(rootRule, (match, body) => {
    const declaration = new RegExp(`(${escapedToken}\\s*:\\s*)[^;}]+;?`);
    if (declaration.test(body)) return `:root { ${body.replace(declaration, `$1${value};`)} }`;
    return `:root { ${body} ${token}: ${value}; }`;
  });
}

export function createDraftController({ delay = 300, getDocumentId, serialize, persist, remove }) {
  let timer;
  const write = () => {
    timer = undefined;
    persist(getDocumentId(), serialize());
  };
  return {
    schedule() {
      if (timer === undefined) timer = setTimeout(write, delay);
    },
    commit() {
      if (timer !== undefined) clearTimeout(timer);
      write();
    },
    clear(documentId = getDocumentId()) {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      remove(documentId);
    },
  };
}

export function computedControlValues(style, rootStyle) {
  return {
    "font-size": numericStyleValue(style.fontSize),
    "font-weight": style.fontWeight,
    "font-color": colorToHex(style.color),
    "text-align": style.textAlign,
    "line-height": numericStyleValue(style.lineHeight),
    "margin-bottom": numericStyleValue(style.marginBottom),
    "page-margin": numericStyleValue(rootStyle.getPropertyValue("--page-margin")),
    "accent-color": colorToHex(rootStyle.getPropertyValue("--color-accent").trim()),
  };
}

export function restoreSelectedDefaults(stylesheet, editorId) {
  return removeOverrideRules(stylesheet, editorId);
}

function numericStyleValue(value) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function colorToHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const values = color.match(/\d+/g)?.slice(0, 3).map(Number);
  return values?.length === 3 ? `#${values.map((value) => value.toString(16).padStart(2, "0")).join("")}` : undefined;
}

const interactiveSelector = "a[href], button, input, select, textarea, [contenteditable]";
const focusableDescendantSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

export function rovingSelectionTargets(nodes) {
  return nodes.filter((node) => !node.querySelector(focusableDescendantSelector));
}

export function setRovingTabStop(nodes, target) {
  nodes.forEach((node) => { node.tabIndex = node === target ? 0 : -1; });
}

export function configureSelectionTarget(node, index) {
  node.tabIndex = index === 0 ? 0 : -1;
  if (isInteractive(node) || node.querySelector(interactiveSelector)) return;
  node.setAttribute("role", "button");
  node.setAttribute("aria-pressed", "false");
}

export function setSelectionPressed(node, isPressed) {
  if (node.getAttribute("role") === "button") node.setAttribute("aria-pressed", String(isPressed));
}

export function selectFromPointer(event, node, select) {
  event.preventDefault();
  event.stopPropagation();
  select(node);
}

function isInteractive(node) {
  return node.matches ? node.matches(interactiveSelector) : node.tagName === "A" && node.hasAttribute("href");
}

/**
 * Run bounded font waiting and full-page density adaptation in a resume document.
 * Self-contained so Playwright can serialize it via page.evaluate and Canvas can call it directly.
 */
export async function fitResumeInBrowser(
  {
    layoutName = "full-page",
    minimumDensity = 0.84,
    maximumDensity = 1.2,
    maxIterations = 9,
    targetFillRatio = 0.98,
    fontTimeoutMs = 5000,
    useStyleElement = false,
    printStyleId = "resume-editor-print-layout",
  } = {},
  doc = typeof document !== "undefined" ? document : undefined,
  win = typeof window !== "undefined" ? window : undefined,
  hostWin = win,
) {
  if (!doc || !win) {
    return {
      status: "degraded",
      message: "缺少浏览器文档上下文，无法执行布局适配。",
    };
  }
  const timerWin = hostWin || win;
  if (useStyleElement) {
    doc.getElementById(printStyleId)?.remove();
  }
  const resume = doc.querySelector(".resume");
  if (!resume) {
    return {
      status: "degraded",
      message: "找不到 .resume A4 容器，无法执行视觉版布局验收。",
    };
  }

  const root = doc.documentElement;
  const getStyle = (element) => win.getComputedStyle(element);
  const isFullPage = root.dataset.resumeLayout === layoutName || resume.dataset.resumeLayout === layoutName;
  const safeFontTimeoutMs = Number.isFinite(Number(fontTimeoutMs)) && Number(fontTimeoutMs) >= 0
    ? Number(fontTimeoutMs)
    : 5000;

  const measure = () => {
    const resumeRect = resume.getBoundingClientRect();
    const resumeStyle = getStyle(resume);
    const paddingBottom = Number.parseFloat(resumeStyle.paddingBottom) || 0;
    const marginsMm = Object.fromEntries(["top", "right", "bottom", "left"].map((side) => [
      side,
      (Number.parseFloat(resumeStyle.getPropertyValue(`padding-${side}`)) || 0) * 25.4 / 96,
    ]));
    const boxes = [...resume.querySelectorAll("*")]
      .filter((element) => {
        const style = getStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && style.position !== "fixed" && style.position !== "absolute";
      })
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    const contentTop = boxes.length ? Math.min(...boxes.map((rect) => rect.top)) : resumeRect.top;
    const contentBottom = boxes.length ? Math.max(...boxes.map((rect) => rect.bottom)) : resumeRect.top;
    const safeBottom = resumeRect.bottom - paddingBottom;
    const safeTop = resumeRect.top + (Number.parseFloat(resumeStyle.paddingTop) || 0);
    const safeLeft = resumeRect.left + (Number.parseFloat(resumeStyle.paddingLeft) || 0);
    const safeRight = resumeRect.right - (Number.parseFloat(resumeStyle.paddingRight) || 0);

    const visible = (element) => {
      for (let current = element; current && current !== resume.parentElement; current = current.parentElement) {
        const style = getStyle(current);
        if (style.display === "none" || style.visibility !== "visible" || style.opacity === "0"
          || style.position === "fixed" || style.position === "absolute") return false;
      }
      return true;
    };

    const measureRegion = (element, selector, top, bottom) => {
      const rects = [];
      const textFilter = win.NodeFilter ? win.NodeFilter.SHOW_TEXT : 4;
      const walker = doc.createTreeWalker(element, textFilter);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim() || !visible(node.parentElement)
          || node.parentElement.closest("script, style")) continue;
        const range = doc.createRange();
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
      return {
        selector,
        safeTop: top,
        safeBottom: bottom,
        hasContent: rows.length > 0,
        contentTop: rows[0]?.top ?? top,
        contentBottom: lastBottom,
        maxGap,
        contentLeft: rows.length ? Math.min(...rows.map((rect) => rect.left)) : safeLeft,
        contentRight: rows.length ? Math.max(...rows.map((rect) => rect.right)) : safeRight,
      };
    };

    const regions = [measureRegion(resume, ".resume", safeTop, safeBottom)];
    for (const grid of resume.querySelectorAll(".layout-grid")) {
      const columns = [...grid.children].filter(visible);
      if (columns.length < 2 || getStyle(grid).display !== "grid") continue;
      const rect = grid.getBoundingClientRect();
      const atPageBottom = grid === resume.lastElementChild;
      columns.forEach((column, index) => regions.push(measureRegion(
        column,
        `.layout-grid 栏 ${index + 1}`,
        rect.top,
        atPageBottom ? safeBottom : rect.bottom,
      )));
    }
    return {
      selector: ".resume",
      marginsMm,
      scrollHeight: resume.scrollHeight,
      clientHeight: resume.clientHeight,
      scrollWidth: resume.scrollWidth,
      clientWidth: resume.clientWidth,
      contentTop,
      contentBottom,
      safeBottom,
      bottomOverflow: Math.max(0, contentBottom - safeBottom),
      horizontalOverflow: Math.max(0, safeLeft - regions[0].contentLeft, regions[0].contentRight - safeRight),
      regions,
    };
  };

  const hasOverflow = (measurement) => measurement.scrollHeight - measurement.clientHeight > 1
    || measurement.scrollWidth - measurement.clientWidth > 1
    || measurement.bottomOverflow > 1 || measurement.horizontalOverflow > 1;

  const waitForLayout = async () => {
    if (!win.__resumeFontsTimedOut && doc.fonts?.ready) {
      let timerId;
      try {
        await Promise.race([
          Promise.resolve(doc.fonts.ready).catch(() => {}),
          new Promise((resolve) => {
            timerId = timerWin.setTimeout(() => {
              win.__resumeFontsTimedOut = true;
              resolve();
            }, safeFontTimeoutMs);
          }),
        ]);
      } finally {
        if (timerId !== undefined) timerWin.clearTimeout(timerId);
      }
    }
    await new Promise((resolve) => {
      if (typeof timerWin.requestAnimationFrame === "function") {
        timerWin.requestAnimationFrame(() => resolve());
      } else {
        timerWin.setTimeout(resolve, 16);
      }
    });
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

  const applyLayoutState = (nextDensity = null) => {
    if (useStyleElement) {
      let styleEl = doc.getElementById(printStyleId);
      if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = printStyleId;
        (doc.head || root).appendChild(styleEl);
      }
      styleEl.textContent = nextDensity === null
        ? ".resume { justify-content: space-between; }"
        : `:root { --resume-density: ${nextDensity}; }\n.resume { justify-content: space-between; }`;
      return;
    }
    if (nextDensity === null) {
      resume.style.setProperty("justify-content", "space-between");
    } else {
      root.style.setProperty("--resume-density", nextDensity);
    }
  };

  applyLayoutState(null);
  await waitForLayout();
  let density = Number.parseFloat(getStyle(root).getPropertyValue("--resume-density")) || 1;
  const declaredMinimum = Number.parseFloat(getStyle(root).getPropertyValue("--resume-density-min"));
  const effectiveMinimum = Number.isFinite(declaredMinimum)
    ? Math.max(minimumDensity, Math.min(1, declaredMinimum))
    : minimumDensity;
  const declaredMaximum = Number.parseFloat(getStyle(root).getPropertyValue("--resume-density-max"));
  const effectiveMaximum = Number.isFinite(declaredMaximum)
    ? Math.max(1, Math.min(maximumDensity, declaredMaximum))
    : 1;

  const naturalFill = () => {
    const containers = [resume, ...resume.querySelectorAll(".layout-grid > *")];
    const previous = containers.map((element) => [
      element.hasAttribute("style"),
      element.style.getPropertyValue("justify-content"),
      element.style.getPropertyPriority("justify-content"),
    ]);
    containers.forEach((element) => element.style.setProperty("justify-content", "flex-start"));
    const region = measure().regions[0];
    containers.forEach((element, index) => {
      const [hadStyle, value, priority] = previous[index];
      if (value) element.style.setProperty("justify-content", value, priority);
      else element.style.removeProperty("justify-content");
      if (!hadStyle && element.getAttribute("style") === "") element.removeAttribute("style");
    });
    return (region.contentBottom - region.safeTop) / (region.safeBottom - region.safeTop);
  };

  const initialDensity = density;
  let measurement = measure();
  let iterations = 0;
  while (hasOverflow(measurement)
    && density > effectiveMinimum + 0.0001 && iterations < maxIterations) {
    iterations += 1;
    density = Math.max(effectiveMinimum, density - ((initialDensity - effectiveMinimum) / maxIterations));
    applyLayoutState(density.toFixed(3));
    await waitForLayout();
    measurement = measure();
  }

  if (iterations === 0 && !hasOverflow(measurement)) {
    while (density < effectiveMaximum - 0.0001 && naturalFill() < 0.9 && iterations < maxIterations) {
      const previousDensity = density;
      density = iterations + 1 === maxIterations
        ? effectiveMaximum
        : Number(Math.min(effectiveMaximum, density + ((effectiveMaximum - 1) / maxIterations)).toFixed(3));
      applyLayoutState(density.toFixed(3));
      await waitForLayout();
      iterations += 1;
      const candidate = measure();
      if (hasOverflow(candidate)) {
        density = previousDensity;
        applyLayoutState(density.toFixed(3));
        await waitForLayout();
        break;
      }
      measurement = candidate;
    }
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
    maximumDensity: effectiveMaximum,
  };
}
