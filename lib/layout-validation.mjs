export function evaluateOverflowMeasurement(measurement) {
  const verticalOverflow = Math.max(0, measurement.scrollHeight - measurement.clientHeight);
  const horizontalOverflow = Math.max(0, measurement.scrollWidth - measurement.clientWidth);
  if (verticalOverflow > 1 || horizontalOverflow > 1) {
    const details = [
      verticalOverflow > 1 ? `垂直超出 ${verticalOverflow}px` : null,
      horizontalOverflow > 1 ? `水平超出 ${horizontalOverflow}px` : null,
    ].filter(Boolean).join("，");
    return {
      status: "fail",
      message: `${measurement.selector} ${details}；请精简低相关内容，或依次调整间距、行高和字号后重新渲染。`,
      measurement,
    };
  }
  return {
    status: "pass",
    message: `${measurement.selector} 未检测到 A4 容器溢出。`,
    measurement,
  };
}

export function evaluateWhitespaceMeasurement(measurement, targetFillRatio = 0.98) {
  const issues = [];
  for (const region of measurement.regions || []) {
    const height = region.safeBottom - region.safeTop;
    const topSpace = Math.max(0, region.contentTop - region.safeTop);
    const bottomSpace = Math.max(0, region.safeBottom - region.contentBottom);
    if (!region.hasContent || bottomSpace > height * (1 - targetFillRatio) + 1) {
      issues.push(`${region.selector} 底部留白 ${bottomSpace.toFixed(1)}px`);
    }
    if (Math.abs(topSpace - bottomSpace) > 75.6) {
      issues.push(`${region.selector} 上下留白差 ${Math.abs(topSpace - bottomSpace).toFixed(1)}px`);
    }
    if (region.maxGap > height * 0.25 + 1) {
      issues.push(`${region.selector} 内部空隙 ${region.maxGap.toFixed(1)}px（上限为有效高度的 25%）`);
    }
  }
  return {
    status: issues.length ? "fail" : "pass",
    message: issues.length
      ? `${issues.join("，")}；请调整字号、行高、间距或布局后重新渲染，并查看整页截图。`
      : "页面及各栏留白测量通过；仍须打开整页截图完成视觉复核。",
    measurement,
  };
}
