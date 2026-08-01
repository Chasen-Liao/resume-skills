import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { parse } from "parse5";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

test("base tests and integration rendering are explicit, separate installable contracts", () => {
  assert.equal(packageJson.scripts.test, "npm run test:node && npm run test:python");
  assert.match(packageJson.scripts["test:node"], /node --test/);
  assert.match(packageJson.scripts["test:python"], /unittest/);
  assert.match(packageJson.scripts["test:integration"], /test_render_integration\.py/);
  assert.equal(packageJson.devDependencies.playwright, "1.62.1");

  const requirements = readFileSync("requirements-test.txt", "utf8");
  assert.match(requirements, /^pypdf==/m);
});

test("npm dry-run package contains the README hero and delivery runtime", () => {
  const output = execSync("npm pack --dry-run --json", { encoding: "utf8" });
  const report = JSON.parse(output);
  const pack = Array.isArray(report) ? report[0] : Object.values(report)[0];
  const files = pack.files.map(({ path }) => path);
  assert.ok(files.includes("image.png"));
  assert.ok(files.includes("requirements-test.txt"));
  assert.ok(files.includes("lib/artifact-manifest.mjs"));
  assert.ok(files.includes("skills/resume-builder/scripts/measure_resume_layout.mjs"));
  assert.equal(files.some((path) => /(?:^|\/)__pycache__(?:\/|$)|\.pyc$/i.test(path)), false);
});

test("built-in examples are visibly marked as fictional demos", () => {
  const examples = [
    "classic-business", "creative-bold", "japanese-minimal",
    "minimal-blue-business", "modern-minimal", "tech-dark",
  ];
  for (const name of examples) {
    const html = readFileSync(`skills/resume-builder/references/examples/${name}.html`, "utf8");
    const document = parse(html);
    const root = document.childNodes.find((node) => node.tagName === "html");
    assert.ok(root.attrs.some(({ name, value }) => name === "data-resume-demo" && value === "true"), name);
    assert.match(html, /DEMO[^<]*(?:虚构|示例)|(?:虚构|示例)[^<]*DEMO/i, name);
  }
});

test("the Canvas shell has no remote font dependency", () => {
  const css = readFileSync("public/app.css", "utf8");
  assert.doesNotMatch(css, /fonts\.googleapis\.com|@import\s+url\(https?:/i);
});
