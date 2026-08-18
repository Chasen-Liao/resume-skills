import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateEditorFields } from "../lib/editor-document.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const leafResume = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head><style>:root { --fs-body: 10px; }</style></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">张小明</h1><p data-resume-editor-id="profile-summary">前端开发工程师，专注用户体验。</p><ul><li data-resume-editor-id="experience-1-bullet-1">优化首屏加载性能，LCP 从 4.2s 降至 1.8s。</li></ul></div></body></html>`;

test("accepts a resume whose every editable field is a leaf text element", () => {
  assert.doesNotThrow(() => validateEditorFields(leafResume));
});

test("rejects a resume without any editable fields and shows grep guidance", () => {
  const zeroField = leafResume.replace(/ data-resume-editor-id="[^"]+"/g, "");

  assert.throws(
    () => validateEditorFields(zeroField),
    (error) => /未找到任何可编辑字段/.test(error.message) && /data-resume-editor-id/.test(error.message) && /rg -n/.test(error.message),
  );
});

test("rejects data-resume-editor-id on structural containers", () => {
  const containerTags = ["html", "body", "main", "section", "header", "footer", "ul", "ol", "figure"];
  for (const tag of containerTags) {
    const [open, close] = tag === "html"
      ? ['<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1" data-resume-editor-id="profile-name">', "</html>"]
      : [`<${tag} data-resume-editor-id="profile-name">`, `</${tag}>`];
    const html = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body>${open}张小明${close}</body></html>`;
    assert.throws(() => validateEditorFields(html), new RegExp(`容器 <${tag}>`), `container <${tag}> must be rejected`);
  }
});

test("rejects data-resume-editor-id on .page and .resume containers", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="page resume" data-resume-editor-id="profile-name">张小明</div></body></html>';

  assert.throws(() => validateEditorFields(html), /容器 .page|容器 .resume/);
});

test("rejects duplicate data-resume-editor-id values", () => {
  const html = leafResume.replace(
    'data-resume-editor-id="profile-summary"',
    'data-resume-editor-id="profile-name"',
  );

  assert.throws(() => validateEditorFields(html), /重复 data-resume-editor-id "profile-name"/);
});

test("rejects an editable element that contains block-level children", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume"><div data-resume-editor-id="profile-name">张小明<p>一段描述</p></div></div></body></html>';

  assert.throws(() => validateEditorFields(html), /含块级子元素 <p>/);
});

test("rejects an editable element with more than one non-text child", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume"><div data-resume-editor-id="profile-name"><span>甲</span><span>乙</span></div></div></body></html>';

  assert.throws(() => validateEditorFields(html), /子节点/);
});

test("accepts a compound field combining text and a single inline link", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume"><div data-resume-editor-id="profile-contact">电话 138-0000-0000 | 邮箱：<a href="mailto:a@b.com">a@b.com</a></div></div></body></html>';

  assert.doesNotThrow(() => validateEditorFields(html));
});

test("rejects a block-level data-resume-editor-id nested inside another editable field", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume"><div data-resume-editor-id="profile-name">张小明<div data-resume-editor-id="profile-summary">摘要</div></div></div></body></html>';

  assert.throws(() => validateEditorFields(html), /嵌套/);
});

test("allows an inline selectable link nested in a compound contact row", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><div class="resume"><div data-resume-editor-id="profile-contact-phone-label">TEL: 135-9999-9999 | MAIL: <a href="mailto:x@y.com" data-resume-editor-id="profile-email">x@y.com</a></div></div></body></html>';

  assert.doesNotThrow(() => validateEditorFields(html));
});

test("includes the offending element context in the failure message", () => {
  const html = '<html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><body><main data-resume-editor-id="profile-name">张小明</main></body></html>';

  assert.throws(() => validateEditorFields(html), (error) => /<main>/.test(error.message) && /张小明/.test(error.message));
});

test("passes all six built-in example templates", () => {
  const examples = [
    "modern-minimal.html",
    "classic-business.html",
    "creative-bold.html",
    "japanese-minimal.html",
    "minimal-blue-business.html",
    "tech-dark.html",
  ];
  for (const name of examples) {
    const path = new URL(`../skills/resume-builder/references/examples/${name}`, import.meta.url);
    assert.doesNotThrow(() => validateEditorFields(readFileSync(path, "utf8")), name);
  }
});