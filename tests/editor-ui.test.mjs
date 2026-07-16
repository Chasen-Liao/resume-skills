import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const css = readFileSync(`${root}/public/app.css`, "utf8");

test("editor UI provides reduced-motion safe button feedback", () => {
  assert.match(css, /button:hover[\s\S]*transform: translateY\(-1px\)/);
  assert.match(css, /button:active[\s\S]*transform: translateY\(0\) scale\(0\.98\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
