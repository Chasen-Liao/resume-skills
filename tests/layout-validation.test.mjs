import assert from "node:assert/strict";
import test from "node:test";
import { evaluateOverflowMeasurement } from "../lib/layout-validation.mjs";

test("visual resume overflow is a delivery failure with actionable measurements", () => {
  const result = evaluateOverflowMeasurement({
    selector: ".resume",
    scrollHeight: 1180,
    clientHeight: 1123,
    scrollWidth: 794,
    clientWidth: 794,
  });

  assert.equal(result.status, "fail");
  assert.match(result.message, /57px/);
  assert.match(result.message, /精简|间距|字号/);
});

test("visual resume within its A4 container passes overflow validation", () => {
  const result = evaluateOverflowMeasurement({
    selector: ".resume",
    scrollHeight: 1123,
    clientHeight: 1123,
    scrollWidth: 794,
    clientWidth: 794,
  });

  assert.equal(result.status, "pass");
});
