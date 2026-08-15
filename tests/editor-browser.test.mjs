import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { startEditor } from "../bin/resume-skills.mjs";

// Real-browser regression: double-click must enter plain-text editing of the selected field.
// Reproduces the report "CLI 打开的编辑器不能编辑选中的文字" — contenteditable="plaintext-only"
// is not supported in Firefox (and Safari < 16.4), where the field never becomes editable.
import { existsSync } from "node:fs";
let chromium;
let firefox;
let browserMissing = [];
try {
  ({ chromium, firefox } = await import("playwright"));
} catch {
  browserMissing = ["playwright package"];
}
if (chromium && !existsSync(chromium.executablePath())) browserMissing.push("chromium");
if (firefox && !existsSync(firefox.executablePath())) browserMissing.push("firefox");
if (browserMissing.length) {
  console.log("editor-browser.test.mjs: skipping real-browser tests (missing: " + browserMissing.join(", ") + "); run \"npx playwright install chromium firefox\" to enable.");
}

const root = fileURLToPath(new URL("..", import.meta.url));
const sampleHtml = `<!DOCTYPE html><html data-resume-editor-template="modern-minimal" data-resume-editor-version="1"><head><meta charset="UTF-8"><style>.resume{width:210mm;height:297mm}</style></head><body><div class="resume"><h1 data-resume-editor-id="profile-name">张小明</h1><p data-resume-editor-id="profile-summary">前端开发工程师。</p></div></body></html>`;


async function doubleClickEditRoundTrip(browserType, browserName) {
  let result;
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-browser-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, sampleHtml);
  const server = startEditor(sourcePath, { open: false, log: false });
  await once(server, "listening");
  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));
      await page.goto(url);
      const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
      assert.ok(frame, "resume iframe must be present");
      const field = frame.locator('[data-resume-editor-id="profile-name"]');
      await field.waitFor({ state: "visible" });
      await page.waitForFunction(() => /^\d+\.\d+\.\d+$/.test(document.querySelector("#app-version")?.textContent?.trim() ?? ""));
      await field.dblclick();
      await page.waitForTimeout(120);
      const during = await frame.evaluate(() => {
        const element = document.querySelector('[data-resume-editor-id="profile-name"]');
        return {
          isContentEditable: element.isContentEditable,
          attribute: element.getAttribute("contenteditable"),
          isFocused: document.activeElement === element,
        };
      });
      await page.keyboard.type("李四");
      await frame.waitForFunction(() => document.querySelector('[data-resume-editor-id="profile-name"]')?.textContent?.includes("李四") ?? false);
      const textAfterTyping = await field.textContent();
      await page.keyboard.press("Control+Enter");
      await frame.waitForFunction(() => !document.querySelector('[data-resume-editor-id="profile-name"]')?.hasAttribute("contenteditable"));
      const afterCommit = await frame.evaluate(() => {
        const element = document.querySelector('[data-resume-editor-id="profile-name"]');
        return { hasContenteditable: element.hasAttribute("contenteditable"), text: element.textContent };
      });
      // Full loop: save via the button, then verify the edit was written back to the source file
      await page.locator("#save-html").click();
      await page.waitForFunction(() => document.querySelector("#save-status")?.textContent.includes("已成功保存"));
      const onDisk = await readFile(sourcePath, "utf8");
      result = { browserName, during, textAfterTyping, afterCommit, onDisk, pageErrors };
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
  return result;
}

test("double-click editing works in Chromium", { skip: !chromium }, async () => {
  const r = await doubleClickEditRoundTrip(chromium, "chromium");
  assert.deepEqual(r.pageErrors, [], "no page errors in chromium");
  assert.equal(r.during.isContentEditable, true, "field must become contenteditable on double-click");
  assert.match(r.textAfterTyping, /李四/, "typing must change the selected field text");
  assert.equal(r.afterCommit.hasContenteditable, false, "Ctrl+Enter must leave edit mode");
  assert.match(r.afterCommit.text, /李四/, "committed text must persist");
});

test("double-click editing works in Firefox", { skip: !firefox }, async () => {
  const r = await doubleClickEditRoundTrip(firefox, "firefox");
  assert.deepEqual(r.pageErrors, [], "no page errors in firefox");
  assert.equal(r.during.isContentEditable, true, "field must become contenteditable on double-click (plaintext-only is unsupported; fix must fall back)");
  assert.match(r.textAfterTyping, /李四/, "typing must change the selected field text");
  assert.equal(r.afterCommit.hasContenteditable, false, "Ctrl+Enter must leave edit mode");
  assert.match(r.afterCommit.text, /李四/, "committed text must persist");
});

async function typeAfterClickRoundTrip(browserType, browserName) {
  let result;
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-browser-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, sampleHtml);
  const server = startEditor(sourcePath, { open: false, log: false });
  await once(server, "listening");
  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));
      await page.goto(url);
      const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
      assert.ok(frame, "resume iframe must be present");
      const field = frame.locator('[data-resume-editor-id="profile-summary"]');
      await field.waitFor({ state: "visible" });
      await field.click();
      const selected = await frame.evaluate(() => document.querySelector('[data-resume-editor-id="profile-summary"]').hasAttribute("data-resume-editor-selected"));
      // Type directly after a single click: must enter edit mode and change the text
      await page.keyboard.type("高级前端工程师");
      await frame.waitForFunction(() => document.querySelector('[data-resume-editor-id="profile-summary"]')?.textContent?.includes("高级前端工程师") ?? false);
      const textAfterTyping = await field.textContent();
      await page.keyboard.press("Control+Enter");
      await frame.waitForFunction(() => !document.querySelector('[data-resume-editor-id="profile-summary"]')?.hasAttribute("contenteditable"));
      await page.locator("#save-html").click();
      await page.waitForFunction(() => document.querySelector("#save-status")?.textContent.includes("已成功保存"));
      const onDisk = await readFile(sourcePath, "utf8");
      result = { browserName, selected, textAfterTyping, onDisk, pageErrors };
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
  return result;
}

test("single-click selection followed by typing edits the field in Chromium", { skip: !chromium }, async () => {
  const r = await typeAfterClickRoundTrip(chromium, "chromium");
  assert.deepEqual(r.pageErrors, [], "no page errors in chromium");
  assert.equal(r.selected, true, "single click must select the field");
  assert.match(r.textAfterTyping, /高级前端工程师/, "typing right after selection must edit the selected text");
  assert.match(r.onDisk, /高级前端工程师/, "saved file must contain the typed text");
});

test("single-click selection followed by typing edits the field in Firefox", { skip: !firefox }, async () => {
  const r = await typeAfterClickRoundTrip(firefox, "firefox");
  assert.deepEqual(r.pageErrors, [], "no page errors in firefox");
  assert.equal(r.selected, true, "single click must select the field");
  assert.match(r.textAfterTyping, /高级前端工程师/, "typing right after selection must edit the selected text");
  assert.match(r.onDisk, /高级前端工程师/, "saved file must contain the typed text");
});
async function fallbackEditRoundTrip(browserType) {
  let result;
  const directory = await mkdtemp(join(tmpdir(), "resume-skills-browser-"));
  const sourcePath = join(directory, "resume.html");
  await writeFile(sourcePath, sampleHtml);
  const server = startEditor(sourcePath, { open: false, log: false });
  await once(server, "listening");
  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage();
      // 强制走 contenteditable="true" 回退分支（Firefox < 136 / Safari < 16.4 的真实形态）
      await page.addInitScript(() => { window.__RESUME_SKILLS_FORCE_PLAINTEXT_FALLBACK = true; });
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));
      await page.goto(url);
      const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
      assert.ok(frame, "resume iframe must be present");
      const field = frame.locator('[data-resume-editor-id="profile-name"]');
      await field.waitFor({ state: "visible" });
      await field.click();
      const editState = await frame.evaluate(() => {
        const element = document.querySelector('[data-resume-editor-id="profile-name"]');
        return { attribute: element.getAttribute("contenteditable"), isContentEditable: element.isContentEditable };
      });
      await page.keyboard.type("李四");
      await frame.waitForFunction(() => document.querySelector('[data-resume-editor-id="profile-name"]')?.textContent?.includes("李四") ?? false);
      // 回退模式下粘贴富文本必须只插入纯文本
      await frame.evaluate(() => {
        const element = document.querySelector('[data-resume-editor-id="profile-name"]');
        const data = new DataTransfer();
        data.setData("text/html", "<b>粗体内容</b>");
        data.setData("text/plain", "纯文本粘贴");
        element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
      });
      await frame.waitForFunction(() => document.querySelector('[data-resume-editor-id="profile-name"]')?.textContent?.includes("纯文本粘贴") ?? false);
      const afterPaste = await frame.evaluate(() => {
        const element = document.querySelector('[data-resume-editor-id="profile-name"]');
        return { text: element.textContent, hasBold: Boolean(element.querySelector("b")) };
      });
      await page.keyboard.press("Control+Enter");
      await frame.waitForFunction(() => !document.querySelector('[data-resume-editor-id="profile-name"]')?.hasAttribute("contenteditable"));
      await page.locator("#save-html").click();
      await page.waitForFunction(() => document.querySelector("#save-status")?.textContent.includes("已成功保存"));
      const onDisk = await readFile(sourcePath, "utf8");
      result = { editState, afterPaste, onDisk, pageErrors };
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
  return result;
}

test("plaintext-only fallback still edits and pastes plain text in Chromium", { skip: !chromium }, async () => {
  const r = await fallbackEditRoundTrip(chromium);
  assert.deepEqual(r.pageErrors, [], "no page errors in fallback mode");
  assert.equal(r.editState.attribute, "true", "fallback must use contenteditable=true");
  assert.equal(r.editState.isContentEditable, true, "field must be editable in fallback mode");
  assert.equal(r.afterPaste.hasBold, false, "rich text paste must not create elements");
  assert.match(r.afterPaste.text, /纯文本粘贴/, "paste must insert the plain text");
  assert.match(r.onDisk, /李四/, "typed text must persist to the saved file");
  assert.match(r.onDisk, /纯文本粘贴/, "pasted plain text must persist to the saved file");
});
