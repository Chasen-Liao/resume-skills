import assert from "node:assert/strict";
import test from "node:test";
import { prepareEditorDocument, stripLegacyToolbar, validateEditorSave } from "../lib/editor-document.mjs";

const modernResume = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head><style>:root { --fs-body: 10px; }</style></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">张小明</h1></div></body></html>`;

test("prepares a supported modern resume without adding editing chrome", () => {
  const prepared = prepareEditorDocument(modernResume);

  assert.match(prepared, /data-resume-editor-template="modern-minimal"/);
  assert.match(prepared, /data-resume-editor-id="profile-name"/);
  assert.doesNotMatch(prepared, /resume-editor-app/);
});

test("removes the Canvas selection marker before serving or saving a resume", () => {
  const prepared = prepareEditorDocument(modernResume.replace('data-resume-editor-id="profile-name"', 'data-resume-editor-id="profile-name" data-editor-selected="true"'));

  assert.doesNotMatch(prepared, /data-editor-selected/);
});

test("accepts a supported template before the canvas assigns editable text ids", () => {
  const html = '<html data-resume-editor-template="classic-business" data-resume-editor-version="1"><body><h1>个人简历</h1></body></html>';

  assert.equal(prepareEditorDocument(html), html);
});

test("rejects HTML that does not opt into the editor protocol with detailed diagnostics", () => {
  assert.throws(
    () => prepareEditorDocument("<html><body><h1>普通网页</h1></body></html>"),
    /缺失 data-resume-editor-template 属性/,
  );

  assert.throws(
    () => prepareEditorDocument('<html data-resume-editor-template="unknown-template" data-resume-editor-version="1"><body></body></html>'),
    /不支持的模板类别 "unknown-template"/,
  );

  assert.throws(
    () => prepareEditorDocument('<html data-resume-editor-template="modern-minimal"><body></body></html>'),
    /缺失 data-resume-editor-version="1" 属性/,
  );
});

test("rejects executable and embedded markup before it reaches the canvas", () => {
  const unsafeDocuments = [
    modernResume.replace("</body>", "<script>alert(1)</script></body>"),
    modernResume.replace("<body>", '<body onload="alert(1)">'),
    modernResume.replace("</body>", '<iframe src="https://attacker.example"></iframe></body>'),
  ];

  for (const html of unsafeDocuments) {
    assert.throws(() => prepareEditorDocument(html), /不安全的 HTML/);
  }
});

test("requires editor protocol attributes on the html start tag", () => {
  const misplacedProtocol = '<html><body data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><h1>个人简历</h1></body></html>';

  assert.throws(
    () => prepareEditorDocument(misplacedProtocol),
    /<html> 开始标签.*data-resume-editor-template/,
  );
});

test("rejects dangerous markup hidden after malformed unquoted attributes", () => {
  const unsafeDocuments = [
    modernResume.replace("</body>", '<div x=\\"><script>alert(1)</script></div></body>'),
    modernResume.replace("</body>", '<div x=\\"><img src="avatar.png" onerror="alert(1)"></div></body>'),
  ];

  for (const html of unsafeDocuments) {
    assert.throws(() => prepareEditorDocument(html), /不安全的 HTML/);
  }
});

test("does not treat html-like text in a textarea as the editor protocol root", () => {
  const htmlLikeText = '<!doctype html><textarea><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"></textarea>';

  assert.throws(
    () => prepareEditorDocument(htmlLikeText),
    /<html> 开始标签.*data-resume-editor-template/,
  );
});

test("rejects JavaScript URLs encoded as HTML character references", () => {
  const encodedJavaScriptUrl = modernResume.replace("</body>", '<a href="java&#x73;cript:alert(1)">查看</a></body>');

  assert.throws(() => prepareEditorDocument(encodedJavaScriptUrl), /不安全的 HTML/);
});

test("rejects scripts inside template content", () => {
  const templateScript = modernResume.replace("</body>", "<template><script>alert(1)</script></template></body>");

  assert.throws(() => prepareEditorDocument(templateScript), /不安全的 HTML/);
});

test("rejects event attributes inside template content", () => {
  const templateEvent = modernResume.replace("</body>", '<template><img src="avatar.png" onerror="alert(1)"></template></body>');

  assert.throws(() => prepareEditorDocument(templateEvent), /不安全的 HTML/);
});

test("rejects JavaScript URLs inside template content", () => {
  const templateUrl = modernResume.replace("</body>", '<template><a href="java&#x73;cript:alert(1)">查看</a></template></body>');

  assert.throws(() => prepareEditorDocument(templateUrl), /不安全的 HTML/);
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

const editableSaveSource = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head><style></style></head><body><div class="resume"><h1 data-resume-editor-id="profile-name" style="color: red">张小明</h1></div></body></html>`;
const editableSaveSourceNoStyle = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head><style></style></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">张小明</h1></div></body></html>`;

test("saves text edits while tolerating a Chromium-injected spellcheck attribute", () => {
  const submitted = editableSaveSource.replace(
    "<h1 data-resume-editor-id=\"profile-name\" style=\"color: red\">张小明</h1>",
    '<h1 data-resume-editor-id="profile-name" spellcheck="true" style="color: red">张小强</h1>',
  );

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /spellcheck/);
});

test("tolerates and removes browser-extension data attributes added to the html root", () => {
  const submitted = editableSaveSource
    .replace("<html ", '<html data-immersive-translate-page-theme="light" ')
    .replace("张小明", "张小强");

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /data-immersive-translate-page-theme/);
});

test("saves text edits when an extension adds a custom element outside the editable field", () => {
  const submitted = editableSaveSource
    .replace("张小明", "张小强")
    .replace("</body>", '<grammarly-extension data-grammarly-shadow-root="true" style="position:fixed;top:0;left:0"></grammarly-extension></body>');

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /grammarly-extension|data-grammarly|position:fixed/);
});

test("removes a hidden extension node outside the editable field", () => {
  const submitted = editableSaveSource
    .replace("张小明", "张小强")
    .replace("</body>", '<span aria-hidden="true" style="display:none">扩展辅助内容</span></body>');

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /扩展辅助内容|aria-hidden|display:none/);
});

test("removes translation attributes and font wrappers from a text edit", () => {
  const submitted = editableSaveSource
    .replace("<body>", '<body data-immersive-translate-page-theme="dark">')
    .replace(">张小明</h1>", '><font style="vertical-align: inherit;" translate="no">张小强</font></h1>');

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /data-immersive|vertical-align|translate=|<font/);
});

test("accepts style values that differ only in whitespace", () => {
  const submitted = editableSaveSource.replace('style="color: red"', 'style="color:red"');

  assert.equal(validateEditorSave(editableSaveSource, submitted), submitted);
});

test("accepts a style attribute added by the canvas that the source field lacked", () => {
  const submitted = editableSaveSourceNoStyle.replace(
    "<h1 data-resume-editor-id=\"profile-name\">张小明</h1>",
    '<h1 data-resume-editor-id="profile-name" style="color: red">张小明</h1>',
  );

  assert.equal(validateEditorSave(editableSaveSourceNoStyle, submitted), submitted);
});

test("accepts a submitted document that drops the source style attribute", () => {
  const submitted = editableSaveSource.replace(' style="color: red"', "");

  assert.equal(validateEditorSave(editableSaveSource, submitted), submitted);
});

test("rejects a real style change with the element and attribute named", () => {
  const submitted = editableSaveSource.replace('style="color: red"', 'style="color: blue"');

  assert.throws(
    () => validateEditorSave(editableSaveSource, submitted),
    /Canvas 只能编辑已有文字，不能修改 HTML 属性或结构.*元素 <h1>（文本"张小明"）.*属性 style 不一致/,
  );
});

test("cleans runtime and extension data attributes from an editable field", () => {
  const submitted = editableSaveSource.replace(
    'style="color: red">张小明',
    'style="color: red" contenteditable="true" data-typo="1">张小强',
  );

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /contenteditable|data-typo/);
});

test("unwraps a semantically neutral plugin span in an editable field", () => {
  const submitted = editableSaveSource.replace(
    ">张小明</h1>",
    '><span data-grammarly-shadow-root="true">张小强</span></h1>',
  );

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /<h1[^>]*>张小强<\/h1>/);
  assert.doesNotMatch(saved, /data-grammarly|<span/);
});

test("removes newly injected hidden text while preserving visible text", () => {
  const submitted = editableSaveSource.replace(
    ">张小明</h1>",
    '>张小强<span aria-hidden="true">插件建议</span></h1>',
  );

  const saved = validateEditorSave(editableSaveSource, submitted);

  assert.match(saved, /张小强/);
  assert.doesNotMatch(saved, /插件建议|aria-hidden/);
});

test("rejects a newly added semantic attribute with the element and attribute named", () => {
  const submitted = editableSaveSource.replace('style="color: red"', 'aria-label="姓名" style="color: red"');

  assert.throws(
    () => validateEditorSave(editableSaveSource, submitted),
    /Canvas 只能编辑已有文字，不能修改 HTML 属性或结构.*元素 <h1>.*属性 aria-label 新增/,
  );
});

test("rejects newly added or removed editor ids before cleanup", () => {
  const added = editableSaveSource.replace("</h1>", '<span data-resume-editor-id="extra">新增</span></h1>');
  const removed = editableSaveSource.replace(' data-resume-editor-id="profile-name"', "");

  assert.throws(() => validateEditorSave(editableSaveSource, added), /不能新增、删除或重复编辑字段/);
  assert.throws(() => validateEditorSave(editableSaveSource, removed), /不能新增、删除或重复编辑字段/);
});
