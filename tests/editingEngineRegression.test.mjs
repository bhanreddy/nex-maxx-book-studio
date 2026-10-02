import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    file
  );

const { useEditorStore } = require("../src/editor/stores/editorStore.ts");

const getStore = () => useEditorStore.getState();

// =========================================================================
// PHASE 13 MANDATORY REGRESSION TEST SUITE: EDITING ENGINE & DATA INTEGRITY
// =========================================================================

test("Regression Test 1: Middle text insertion preserves surrounding text and offsets", () => {
  const page = getStore().getActivePage();
  assert.ok(page, "Active page must exist");

  const initialText = "The universe contains wonderful numbers.";
  const elId = `test-text-${Date.now()}`;
  const element = {
    id: elId,
    pageId: page.id,
    type: "body",
    category: "text",
    version: 1,
    displayName: "Body Paragraph",
    locked: false,
    hidden: false,
    transform: { x: 54, y: 120, width: 400, height: 80, rotation: 0, zIndex: 1 },
    style: { fontSize: 11, color: "#000" },
    content: { text: initialText },
  };

  getStore().insertPublicationElement(element);
  assert.equal(getStore().elements[elId].content.text, initialText);

  // User places cursor before "wonderful" (index 22) and inserts "many "
  const cursorIndex = initialText.indexOf("wonderful");
  assert.equal(cursorIndex, 22);

  const inserted = "many ";
  const updatedText = initialText.slice(0, cursorIndex) + inserted + initialText.slice(cursorIndex);
  getStore().updateElementContent(elId, { text: updatedText });

  const current = getStore().elements[elId].content.text;
  assert.equal(current, "The universe contains many wonderful numbers.");
  // Next cursor position is at cursorIndex + inserted.length
  const newCaretPos = cursorIndex + inserted.length;
  assert.equal(newCaretPos, 27);
  assert.equal(current.slice(newCaretPos), "wonderful numbers.");
});

test("Regression Test 2: Typing multiple words with spacebar never resets or deletes text", () => {
  const page = getStore().getActivePage();
  const elId = `test-space-${Date.now()}`;

  const element = {
    id: elId,
    pageId: page.id,
    type: "heading",
    category: "text",
    version: 1,
    displayName: "Chapter Heading",
    locked: false,
    hidden: false,
    transform: { x: 54, y: 150, width: 450, height: 50, rotation: 0, zIndex: 2 },
    style: { fontSize: 18, fontWeight: 700 },
    content: { text: "" },
  };

  getStore().insertPublicationElement(element);

  // Simulating consecutive typing with spacebar: "Exploring " -> "Exploring the " -> "Exploring the Solar System"
  const tokens = ["Exploring", " ", "the", " ", "Solar", " ", "System"];
  let accumulated = "";

  for (const token of tokens) {
    accumulated += token;
    getStore().updateElementContent(elId, { text: accumulated });
    const inStore = getStore().elements[elId].content.text;
    assert.equal(inStore, accumulated, `Store text must match accumulated string after typing '${token}'`);
    assert.ok(inStore.length > 0, "Text must not disappear or collapse on space");
  }

  assert.equal(getStore().elements[elId].content.text, "Exploring the Solar System");
});

test("Regression Test 3: End text insertion maintains string integrity", () => {
  const page = getStore().getActivePage();
  const elId = `test-end-${Date.now()}`;

  const element = {
    id: elId,
    pageId: page.id,
    type: "body",
    category: "text",
    version: 1,
    displayName: "Paragraph",
    locked: false,
    hidden: false,
    transform: { x: 54, y: 200, width: 400, height: 60, rotation: 0, zIndex: 3 },
    style: { fontSize: 11 },
    content: { text: "Early humans observed the stars." },
  };

  getStore().insertPublicationElement(element);

  // Appending at end
  const appendText = " They used them to navigate oceans.";
  getStore().updateElementContent(elId, { text: element.content.text + appendText });

  assert.equal(
    getStore().elements[elId].content.text,
    "Early humans observed the stars. They used them to navigate oceans."
  );
});

test("Regression Test 4: Selection replacement alters only targeted range", () => {
  const page = getStore().getActivePage();
  const elId = `test-replace-${Date.now()}`;

  const original = "Light travels extremely quickly in a vacuum.";
  const element = {
    id: elId,
    pageId: page.id,
    type: "body",
    category: "text",
    version: 1,
    displayName: "Science Note",
    locked: false,
    hidden: false,
    transform: { x: 54, y: 280, width: 400, height: 60, rotation: 0, zIndex: 4 },
    style: { fontSize: 11 },
    content: { text: original },
  };

  getStore().insertPublicationElement(element);

  // Select "extremely quickly" and replace with "at 300,000 km/s"
  const target = "extremely quickly";
  const startIdx = original.indexOf(target);
  const endIdx = startIdx + target.length;
  const replacement = "at 300,000 km/s";

  const replaced = original.slice(0, startIdx) + replacement + original.slice(endIdx);
  getStore().updateElementContent(elId, { text: replaced });

  assert.equal(getStore().elements[elId].content.text, "Light travels at 300,000 km/s in a vacuum.");
});

test("Regression Test 5: Universal Image Paste persists valid image element with geometry", () => {
  const page = getStore().getActivePage();

  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const imageElement = {
    id: `pasted-img-${Date.now()}`,
    pageId: page.id,
    type: "image",
    category: "media",
    version: 1,
    displayName: "Pasted Screenshot",
    locked: false,
    hidden: false,
    transform: { x: 100, y: 150, width: 320, height: 240, rotation: 0, zIndex: 10 },
    style: { borderRadius: 8, objectFit: "cover" },
    content: {
      src: dummyBase64,
      url: dummyBase64,
      caption: "Laboratory Apparatus",
      aspectRatio: 320 / 240,
    },
  };

  getStore().insertPublicationElement(imageElement);

  const inserted = getStore().elements[imageElement.id];
  assert.ok(inserted, "Pasted image element must be stored in elements map");
  assert.equal(inserted.type, "image");
  assert.equal(inserted.content.src, dummyBase64);
  assert.equal(inserted.transform.width, 320);
  assert.equal(inserted.transform.height, 240);
  assert.ok(getStore().getActivePage().elementIds.includes(imageElement.id), "Page elementIds must include the pasted image id");
});

test("Regression Test 6: Autosave cycle during active editing does not overwrite newer draft text", () => {
  const page = getStore().getActivePage();
  const elId = `test-autosave-${Date.now()}`;

  const element = {
    id: elId,
    pageId: page.id,
    type: "body",
    category: "text",
    version: 1,
    displayName: "Autosave Safe Block",
    locked: false,
    hidden: false,
    transform: { x: 54, y: 350, width: 400, height: 60, rotation: 0, zIndex: 5 },
    style: { fontSize: 11 },
    content: { text: "Draft version 1." },
  };

  getStore().insertPublicationElement(element);

  // 1. Initial save
  getStore().saveToStorage();

  // 2. User types draft 2
  getStore().updateElementContent(elId, { text: "Draft version 2: user continues typing uninterrupted." });

  // 3. Simulated autosave trigger
  getStore().saveToStorage();

  // 4. User types draft 3 immediately without waiting
  getStore().updateElementContent(elId, { text: "Draft version 3: latest keystrokes are preserved." });

  // The latest state in memory must have draft 3, never reverted to draft 1 or draft 2
  assert.equal(
    getStore().elements[elId].content.text,
    "Draft version 3: latest keystrokes are preserved."
  );
});

test("Regression Test 7: Multilingual Telugu and Hindi unicode text retains scripts and accents", () => {
  const page = getStore().getActivePage();
  const elId = `test-telugu-${Date.now()}`;

  // Telugu sentence: "సూర్యుడు తూర్పున ఉదయిస్తాడు మరియు పడమరన అస్తమిస్తాడు." (The sun rises in the east and sets in the west.)
  const teluguSentence = "సూర్యుడు తూర్పున ఉదయిస్తాడు మరియు పడమరన అస్తమిస్తాడు.";
  // Hindi sentence: "जल ही जीवन है और हमें इसका संरक्षण करना चाहिए।"
  const hindiSentence = "जल ही जीवन है और हमें इसका संरक्षण करना चाहिए।";

  const element = {
    id: elId,
    pageId: page.id,
    type: "body",
    category: "text",
    version: 1,
    displayName: "Multilingual Reading",
    locked: false,
    hidden: false,
    transform: { x: 54, y: 420, width: 450, height: 90, rotation: 0, zIndex: 6 },
    style: { fontSize: 13, fontFamily: "Noto Sans Telugu, Outfit, sans-serif" },
    content: { text: teluguSentence, subtitle: hindiSentence },
  };

  getStore().insertPublicationElement(element);

  const stored = getStore().elements[elId];
  assert.equal(stored.content.text, teluguSentence);
  assert.equal(stored.content.subtitle, hindiSentence);

  // Edit in the middle of Telugu string: insert "ప్రతిరోజూ " (every day) after "సూర్యుడు "
  const splitPoint = teluguSentence.indexOf("తూర్పున");
  const modifiedTelugu = teluguSentence.slice(0, splitPoint) + "ప్రతిరోజూ " + teluguSentence.slice(splitPoint);

  getStore().updateElementContent(elId, { text: modifiedTelugu });
  assert.ok(getStore().elements[elId].content.text.includes("ప్రతిరోజూ తూర్పున"));
});

test("Regression Test 8: Group-to-Layout conversion creates reusable, isolated, editable instances", () => {
  const page = getStore().getActivePage();

  // Create 3 elements representing a Math Activity Section
  const titleEl = {
    id: `math-title-${Date.now()}`,
    pageId: page.id,
    type: "heading",
    category: "text",
    version: 1,
    displayName: "Activity Title",
    locked: false,
    hidden: false,
    transform: { x: 60, y: 100, width: 300, height: 40, rotation: 0, zIndex: 1 },
    style: { fontSize: 16, fontWeight: 700, color: "#1e3a8a" },
    content: { text: "Fun with Fractions" },
  };

  const bodyEl = {
    id: `math-body-${Date.now()}`,
    pageId: page.id,
    type: "body",
    category: "text",
    version: 1,
    displayName: "Activity Instructions",
    locked: false,
    hidden: false,
    transform: { x: 60, y: 150, width: 300, height: 50, rotation: 0, zIndex: 2 },
    style: { fontSize: 11 },
    content: { text: "Color the shapes to represent 1/2, 1/4, and 3/4." },
  };

  const questionEl = {
    id: `math-q1-${Date.now()}`,
    pageId: page.id,
    type: "question",
    category: "assessment",
    version: 1,
    displayName: "Question 1",
    locked: false,
    hidden: false,
    transform: { x: 60, y: 210, width: 300, height: 40, rotation: 0, zIndex: 3 },
    style: { fontSize: 11 },
    content: { question: "What fraction of the circle is shaded?" },
  };

  getStore().insertPublicationElement(titleEl);
  getStore().insertPublicationElement(bodyEl);
  getStore().insertPublicationElement(questionEl);

  // Select all three elements
  getStore().selectElement(titleEl.id);
  getStore().selectElement(bodyEl.id, true);
  getStore().selectElement(questionEl.id, true);

  // Convert to custom layout
  const layout = getStore().createCustomLayoutFromSelection(
    "Fraction Activity Card",
    "mathematics",
    "Fraction practice card with title, instructions, and question"
  );

  assert.ok(layout, "Layout must be created successfully");
  assert.equal(layout.name, "Fraction Activity Card");
  assert.equal(layout.category, "mathematics");
  assert.equal(layout.elements.length, 3);
  assert.ok(getStore().userCustomLayouts[layout.id], "Layout must be in userCustomLayouts dictionary");

  // Normalized coordinate check: minX and minY must be 0 for relative positioning
  const minX = Math.min(...layout.elements.map((e) => e.transform.x));
  const minY = Math.min(...layout.elements.map((e) => e.transform.y));
  assert.equal(minX, 0, "Layout elements must have relative X normalized to 0");
  assert.equal(minY, 0, "Layout elements must have relative Y normalized to 0");

  // Insert a new instance of the layout at coordinates (120, 300)
  const insertedIds = getStore().insertCustomLayout(layout.id, 120, 300);
  assert.equal(insertedIds.length, 3, "Must insert all 3 elements");

  // Verify elements are placed at expected absolute coordinates
  const newTitle = getStore().elements[insertedIds[0]];
  assert.ok(newTitle);
  assert.notEqual(newTitle.id, titleEl.id, "New instance must have independent ID");
  assert.equal(newTitle.transform.x, 120);
  assert.equal(newTitle.transform.y, 300);
  assert.equal(newTitle.content.text, "Fun with Fractions");

  // Modify instance 1, verify layout template and original elements are not mutated
  getStore().updateElementContent(newTitle.id, { text: "Fractions in Real Life" });
  assert.equal(getStore().elements[newTitle.id].content.text, "Fractions in Real Life");
  assert.equal(getStore().elements[titleEl.id].content.text, "Fun with Fractions");
  assert.equal(getStore().userCustomLayouts[layout.id].elements[0].content.text, "Fun with Fractions");
});
