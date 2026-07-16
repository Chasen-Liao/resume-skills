import assert from "node:assert/strict";
import test from "node:test";
import { prepareEditorDocument, stripLegacyToolbar } from "../lib/editor-document.mjs";

const modernResume = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head><style>:root { --fs-body: 10px; }</style></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">张小明</h1></div></body></html>`;

test("prepares a supported modern resume without adding editing chrome", () => {
  const prepared = prepareEditorDocument(modernResume);

  assert.match(prepared, /data-resume-editor-template="modern-minimal"/);
  assert.match(prepared, /data-resume-editor-id="profile-name"/);
  assert.doesNotMatch(prepared, /resume-editor-app/);
});

test("accepts a supported template before the canvas assigns editable text ids", () => {
  const html = '<html data-resume-editor-template="classic-business" data-resume-editor-version="1"><body><h1>个人简历</h1></body></html>';

  assert.equal(prepareEditorDocument(html), html);
});

test("rejects HTML that does not opt into the editor protocol", () => {
  assert.throws(
    () => prepareEditorDocument("<html><body><h1>普通网页</h1></body></html>"),
    /编辑协议/,
  );
});

test("removes a legacy template export toolbar before opening the canvas", () => {
  const legacy = modernResume.replace(
    "<body>",
    '<body><div class="no-print-toolbar"><button class="btn-export">导出 PDF</button><div class="toolbar-tip">提示</div></div>',
  );

  const prepared = prepareEditorDocument(legacy);

  assert.doesNotMatch(prepared, /no-print-toolbar/);
  assert.doesNotMatch(prepared, /btn-export/);
  assert.match(prepared, /张小明/);
});

test("strips the legacy toolbar from a browser-restored draft", () => {
  const draft = '<div class="no-print-toolbar"><button>导出 PDF</button><div>提示</div></div><div class="resume">内容</div>';

  assert.equal(stripLegacyToolbar(draft), '<div class="resume">内容</div>');
});
