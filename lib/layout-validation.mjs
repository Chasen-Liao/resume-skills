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
