import assert from "node:assert/strict";
import test from "node:test";
import { computedControlValues, createDraftController, restoreSelectedDefaults } from "../lib/editor-controls.mjs";

test("draft controller throttles live input, commits on change or blur, and clears after save", async () => {
  const writes = [];
  const removals = [];
  let html = "first drag value";
  const drafts = createDraftController({
    delay: 20,
    getDocumentId: () => "document-1",
    serialize: () => html,
    persist: (documentId, value) => writes.push({ documentId, value }),
    remove: (documentId) => removals.push(documentId),
  });

  drafts.schedule();
  html = "second drag value";
  drafts.schedule();
  assert.deepEqual(writes, []);
  await delay(35);
  assert.deepEqual(writes, [{ documentId: "document-1", value: "second drag value" }]);

  html = "change value";
  drafts.schedule();
  drafts.commit();
  assert.deepEqual(writes.at(-1), { documentId: "document-1", value: "change value" });
  const writesAfterCommit = writes.length;
  await delay(35);
  assert.equal(writes.length, writesAfterCommit);

  drafts.clear();
  assert.deepEqual(removals, ["document-1"]);
});

test("selection controls reflect computed text and root styles, and reset only the selected item", () => {
  const values = computedControlValues(
    {
      fontSize: "12px",
      fontWeight: "600",
      color: "rgb(1, 2, 3)",
      textAlign: "center",
      lineHeight: "18px",
      marginBottom: "8px",
    },
    { getPropertyValue: (name) => ({ "--page-margin": "12mm", "--color-accent": "rgb(4, 5, 6)" })[name] },
  );

  assert.deepEqual(values, {
    "font-size": 12,
    "font-weight": "600",
    "font-color": "#010203",
    "text-align": "center",
    "line-height": 18,
    "margin-bottom": 8,
    "page-margin": 12,
    "accent-color": "#040506",
  });

  const stylesheet = [
    '[data-resume-editor-id="profile-name"] { font-size: 12px !important; }',
    '[data-resume-editor-id="profile-title"] { font-size: 11px !important; }',
  ].join("\n");
  const restored = restoreSelectedDefaults(stylesheet, "profile-name");
  assert.doesNotMatch(restored, /profile-name/);
  assert.match(restored, /profile-title/);
});

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
