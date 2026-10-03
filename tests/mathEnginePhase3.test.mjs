import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
for (const ext of [".ts", ".tsx"]) {
  require.extensions[ext] = (module, file) =>
    module._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      file
    );
}

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { getAllMathTemplates, getMathTemplate } = require("../src/editor/math/mathRegistry.ts");
const { buildEditableMathTree, mathRenderFrame } = require("../src/editor/math/mathEditableTree.tsx");
const { CATALOGUE_TEMPLATES } = require("../src/editor/math/templates/index.ts");

// ============================================================================
// PHASE 3 — TEMPLATE CATALOGUE ACCEPTANCE TESTS
// ============================================================================

test("Phase 3 catalogue contains all required ~60+ templates (found 69)", () => {
  assert.ok(CATALOGUE_TEMPLATES.length >= 60, `Catalogue must have at least 60 templates, found ${CATALOGUE_TEMPLATES.length}`);
  const allTemplates = getAllMathTemplates();
  assert.ok(allTemplates.length >= 69, `All templates must be registered, found ${allTemplates.length}`);
});

test("Every template satisfies authoring contract (id, name, grade, chapterTag, renderer, dimensions)", () => {
  for (const tpl of CATALOGUE_TEMPLATES) {
    assert.ok(tpl.id, `Template must have an id`);
    assert.ok(tpl.name, `Template ${tpl.id} must have a name`);
    assert.ok(tpl.chapterTag, `Template ${tpl.id} must have a chapterTag`);
    assert.ok(tpl.category, `Template ${tpl.id} must have a category`);
    assert.ok(tpl.grades && tpl.grades.length > 0, `Template ${tpl.id} must specify grades`);
    assert.ok(tpl.defaultWidth > 0, `Template ${tpl.id} defaultWidth must be > 0`);
    assert.ok(tpl.defaultHeight > 0, `Template ${tpl.id} defaultHeight must be > 0`);
    assert.ok(typeof tpl.renderer === "function", `Template ${tpl.id} renderer must be a function`);
    assert.ok(tpl.defaultData, `Template ${tpl.id} must have defaultData`);
    assert.ok(tpl.a11yDescription, `Template ${tpl.id} must have an a11yDescription`);
  }
});

test("Every template renders at default size, at 2:1 and 1:2 boxes, with showAnswer on/off without layout break", () => {
  const allTemplates = getAllMathTemplates();

  for (const tpl of allTemplates) {
    const w = tpl.defaultWidth;
    const h = tpl.defaultHeight;

    // 1. Default size, teacher mode
    const frameDefault = mathRenderFrame(tpl, w, h);
    assert.ok(frameDefault.renderWidth > 0 && frameDefault.renderHeight > 0);
    const teacherElement = React.createElement(tpl.renderer, {
      data: tpl.defaultData,
      mode: "teacher",
      styleVariant: "clean",
      width: w,
      height: h,
    });
    const htmlTeacher = renderToStaticMarkup(teacherElement);
    assert.ok(htmlTeacher.length > 0, `Template ${tpl.id} must render static HTML in teacher mode`);

    // 2. Student mode (showAnswer off)
    const studentElement = React.createElement(tpl.renderer, {
      data: tpl.defaultData,
      mode: "student",
      styleVariant: "clean",
      width: w,
      height: h,
    });
    const htmlStudent = renderToStaticMarkup(studentElement);
    assert.ok(htmlStudent.length > 0, `Template ${tpl.id} must render static HTML in student mode`);

    // 3. 2:1 Box (wide box, scale must preserve aspect ratio without NaN)
    const frameWide = mathRenderFrame(tpl, w * 2, h);
    assert.equal(frameWide.scaleX, frameWide.scaleY, `Template ${tpl.id} must scale uniformly in 2:1 box`);
    assert.ok(Number.isFinite(frameWide.offsetX), `Template ${tpl.id} offsetX must be finite`);

    // 4. 1:2 Box (tall box, scale must preserve aspect ratio without NaN)
    const frameTall = mathRenderFrame(tpl, w, h * 2);
    assert.equal(frameTall.scaleX, frameTall.scaleY, `Template ${tpl.id} must scale uniformly in 1:2 box`);
    assert.ok(Number.isFinite(frameTall.offsetY), `Template ${tpl.id} offsetY must be finite`);
  }
});

test("Every template traverses through buildEditableMathTree with double-clickable editable text parts", () => {
  for (const tpl of CATALOGUE_TEMPLATES) {
    const treeResult = buildEditableMathTree(tpl, {
      data: tpl.defaultData,
      mode: "teacher",
      styleVariant: "clean",
      width: tpl.defaultWidth,
      height: tpl.defaultHeight,
    });

    assert.ok(treeResult.tree, `Template ${tpl.id} must generate an editable React tree`);
    assert.ok(Array.isArray(treeResult.parts), `Template ${tpl.id} must return parts array`);
    assert.ok(treeResult.parts.length > 0, `Template ${tpl.id} must have at least one editable part`);

    // Confirm that parts have unique IDs
    const partIds = new Set(treeResult.parts.map((p) => p.id));
    assert.equal(partIds.size, treeResult.parts.length, `Template ${tpl.id} part IDs must be strictly unique`);
  }
});

test("Classes 1 to 5 distribution covers all required pedagogical milestones", () => {
  const {
    CLASS_1_TEMPLATES,
    CLASS_2_TEMPLATES,
    CLASS_3_TEMPLATES,
    CLASS_4_TEMPLATES,
    CLASS_5_TEMPLATES,
    LAYOUT_BLOCK_TEMPLATES,
  } = require("../src/editor/math/templates/index.ts");

  assert.equal(CLASS_1_TEMPLATES.length, 12, "Class 1 must have 12 templates");
  assert.equal(CLASS_2_TEMPLATES.length, 11, "Class 2 must have 11 templates");
  assert.equal(CLASS_3_TEMPLATES.length, 11, "Class 3 must have 11 templates");
  assert.equal(CLASS_4_TEMPLATES.length, 12, "Class 4 must have 12 templates");
  assert.equal(CLASS_5_TEMPLATES.length, 13, "Class 5 must have 13 templates");
  assert.equal(LAYOUT_BLOCK_TEMPLATES.length, 10, "Layout blocks must have 10 templates");
});
