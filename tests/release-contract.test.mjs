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

test("npm dry-run package contains delivery runtime and excludes heavy promotional images", () => {
  const output = execSync("npm pack --dry-run --json", { encoding: "utf8" });
  const report = JSON.parse(output);
  const pack = Array.isArray(report) ? report[0] : Object.values(report)[0];
  const files = pack.files.map(({ path }) => path);
  assert.equal(files.includes("image.png"), false);
  assert.equal(files.includes("builder.png"), false);
  assert.equal(files.some((path) => path.startsWith("assets/")), false);
  assert.ok(files.includes("requirements-test.txt"));
  assert.ok(files.includes("lib/artifact-manifest.mjs"));
  assert.ok(files.includes("lib/resume-layout.mjs"));
  assert.ok(files.includes("skills/resume-builder/scripts/measure_resume_layout.mjs"));
  assert.ok(files.includes("skills/resume-builder/scripts/render_resume.mjs"));
  assert.equal(files.some((path) => /(?:^|\/)__pycache__(?:\/|$)|\.pyc$/i.test(path)), false);
});

const BUILTIN_EXAMPLES = [
  "classic-business", "creative-bold", "japanese-minimal",
  "minimal-blue-business", "modern-minimal", "tech-dark",
];

test("built-in examples are visibly marked as fictional demos", () => {
  for (const name of BUILTIN_EXAMPLES) {
    const html = readFileSync(`skills/resume-builder/references/examples/${name}.html`, "utf8");
    const document = parse(html);
    const root = document.childNodes.find((node) => node.tagName === "html");
    assert.ok(root.attrs.some(({ name, value }) => name === "data-resume-demo" && value === "true"), name);
    assert.match(html, /DEMO[^<]*(?:虚构|示例)|(?:虚构|示例)[^<]*DEMO/i, name);
  }
});

test("built-in visual templates carry the full-page density contract", () => {
  for (const name of BUILTIN_EXAMPLES) {
    const html = readFileSync(`skills/resume-builder/references/examples/${name}.html`, "utf8");
    assert.match(html, /data-resume-layout="full-page"/, name);
    assert.match(html, /--resume-density-min:\s*0\.84/, name);
    assert.match(html, /--resume-fill-target:\s*0\.98/, name);
    assert.match(html, /data-resume-layout-contract="full-page"/, name);
    assert.match(html, /justify-content:\s*space-between/, name);
  }
});

test("the Canvas shell has no remote font dependency", () => {
  const css = readFileSync("public/app.css", "utf8");
  assert.doesNotMatch(css, /fonts\.googleapis\.com|@import\s+url\(https?:/i);
});
