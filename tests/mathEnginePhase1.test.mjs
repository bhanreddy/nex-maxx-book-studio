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
const { getMathTemplate } = require("../src/editor/math/mathRegistry.ts");
const { buildEditableMathTree, mathRenderFrame } = require("../src/editor/math/mathEditableTree.tsx");

// ============================================================================
// PHASE 1 — ENGINE FIXES — UNIT TESTS
// Two test cases per fix as specified in the acceptance criteria
// ============================================================================

// ──────────────────────────────────────────────
// 1. UNIFORM SCALING
// ──────────────────────────────────────────────

test("uniform scaling: circle stays circular in a 2:1 box", () => {
  // Fraction circle: defaultWidth=300, defaultHeight=150
  const template = getMathTemplate("math-fraction-circle");
  // Place into a 600x150 box (wider box: 2:1 ratio vs template)
  const frame = mathRenderFrame(template, 600, 150);
  assert.equal(frame.scaleX, frame.scaleY, "scaleX must equal scaleY for uniform scaling");
  // min(600/300, 150/150) = min(2, 1) = 1
  assert.equal(frame.scaleX, 1);
  // Content centred horizontally: offsetX = (600 - 300*1) / 2 = 150
  assert.equal(frame.offsetX, 150);
  assert.equal(frame.offsetY, 0);
});

test("uniform scaling: content centred in a 1:2 box (tall)", () => {
  // Abacus: defaultWidth=380, defaultHeight=160
  const template = getMathTemplate("math-abacus");
  // Place into a 380x320 box (same width, double height)
  const frame = mathRenderFrame(template, 380, 320);
  // rawScaleX = 380/380 = 1, rawScaleY = 320/160 = 2
  // uniformScale = min(1, 2) = 1
  assert.equal(frame.scaleX, 1);
  assert.equal(frame.scaleY, 1);
  assert.equal(frame.offsetX, 0);
  assert.equal(frame.offsetY, 80); // (320 - 160*1) / 2 = 80
});

// ──────────────────────────────────────────────
// 2. STABLE OVERRIDE IDs
// ──────────────────────────────────────────────

test("override IDs are identical when toggling showAnswer (teacher ↔ student)", () => {
  // Use a template where teacher/student modes don't change the tree structure
  const template = getMathTemplate("math-fraction-circle");
  const baseProps = {
    data: template.defaultData,
    mode: "teacher",
    styleVariant: "color-coded",
    width: template.defaultWidth,
    height: template.defaultHeight,
  };
  const teacher = buildEditableMathTree(template, baseProps);
  const student = buildEditableMathTree(template, { ...baseProps, mode: "student" });

  // Part IDs must be identical between teacher and student mode
  assert.deepEqual(
    teacher.parts.map((p) => p.id),
    student.parts.map((p) => p.id),
    "Part IDs must survive mode toggle"
  );
  // And at least some text parts should exist
  assert.ok(teacher.parts.some((p) => p.text !== undefined), "Should have text parts");
  // Verify an override applied in teacher mode has its ID present in student mode
  const textPart = teacher.parts.find((p) => p.text !== undefined);
  assert.ok(student.parts.some((p) => p.id === textPart.id), "Override ID from teacher mode must exist in student mode");
});

test("key-based override IDs survive data changes for same-structure templates", () => {
  const template = getMathTemplate("math-place-value-indian");
  const makeProps = (number) => ({
    data: { ...template.defaultData, number },
    mode: "teacher",
    styleVariant: "color-coded",
    width: template.defaultWidth,
    height: template.defaultHeight,
  });
  // Both 6-digit numbers: structure is identical, only digit values change
  const tree1 = buildEditableMathTree(template, makeProps(123456));
  const tree2 = buildEditableMathTree(template, makeProps(654321));

  assert.deepEqual(
    tree1.parts.map((p) => p.id),
    tree2.parts.map((p) => p.id),
    "Part IDs must be identical for same-structure data"
  );
});

// ──────────────────────────────────────────────
// 3. DEV-ONLY HOOK DETECTION
// ──────────────────────────────────────────────

test("dev error surfaces a clear message naming the template when hooks are used", () => {
  // Create a fake component that simulates React's hook error
  const HookComponent = function BadTemplate() {
    throw new Error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component."
    );
  };
  HookComponent.displayName = "BadTemplate";

  const fakeTemplate = {
    id: "test-hook-detection",
    name: "Hook Test",
    category: "numbers",
    grades: [1],
    type: "visual-model",
    tags: [],
    defaultData: {},
    defaultWidth: 200,
    defaultHeight: 100,
    styleVariants: ["clean"],
    // The top-level renderer returns an element that contains the bad component
    renderer: () => React.createElement(HookComponent, {}),
    configFields: [],
  };

  assert.throws(
    () =>
      buildEditableMathTree(fakeTemplate, {
        data: {},
        mode: "teacher",
        styleVariant: "clean",
        width: 200,
        height: 100,
      }),
    (err) => {
      // Error message must name the template and mention hooks
      return (
        err.message.includes("BadTemplate") &&
        err.message.includes("hook")
      );
    },
    "Should throw with template name and hook-related error"
  );
});

test("non-hook errors pass through unchanged without wrapping", () => {
  const ErrorComponent = function BrokenTemplate() {
    throw new Error("Some regular rendering error");
  };

  const fakeTemplate = {
    id: "test-regular-error",
    name: "Error Test",
    category: "numbers",
    grades: [1],
    type: "visual-model",
    tags: [],
    defaultData: {},
    defaultWidth: 200,
    defaultHeight: 100,
    styleVariants: ["clean"],
    renderer: () => React.createElement(ErrorComponent, {}),
    configFields: [],
  };

  assert.throws(
    () =>
      buildEditableMathTree(fakeTemplate, {
        data: {},
        mode: "teacher",
        styleVariant: "clean",
        width: 200,
        height: 100,
      }),
    (err) => {
      return err.message === "Some regular rendering error";
    },
    "Non-hook errors should pass through unchanged"
  );
});

// ──────────────────────────────────────────────
// 4. MEMO / FORWARDREF UNWRAPPING
// ──────────────────────────────────────────────

test("React.memo wrapped renderer is unwrapped and produces editable text parts", () => {
  const Inner = function MemoRenderer({ data }) {
    return React.createElement(
      "div",
      null,
      React.createElement("span", null, data.label || "Hello")
    );
  };
  const MemoWrapped = React.memo(Inner);

  const fakeTemplate = {
    id: "test-memo-unwrap",
    name: "Memo Test",
    category: "numbers",
    grades: [1],
    type: "visual-model",
    tags: [],
    defaultData: { label: "Memo Content" },
    defaultWidth: 200,
    defaultHeight: 100,
    styleVariants: ["clean"],
    renderer: MemoWrapped,
    configFields: [],
  };

  const result = buildEditableMathTree(fakeTemplate, {
    data: { label: "Memo Content" },
    mode: "teacher",
    styleVariant: "clean",
    width: 200,
    height: 100,
  });

  assert.ok(
    result.parts.some((p) => p.text === "Memo Content"),
    "Should find editable text inside memo wrapper"
  );
  const markup = renderToStaticMarkup(result.tree);
  assert.ok(
    markup.includes("Memo Content"),
    "Rendered markup should contain content from memo-wrapped renderer"
  );
});

test("React.forwardRef wrapped renderer is unwrapped and traversed", () => {
  const ForwardRefRenderer = React.forwardRef(function RefRenderer(
    props,
    ref
  ) {
    return React.createElement(
      "div",
      { ref },
      React.createElement("span", null, props.data?.label || "Ref Content")
    );
  });

  const fakeTemplate = {
    id: "test-forwardref-unwrap",
    name: "ForwardRef Test",
    category: "numbers",
    grades: [1],
    type: "visual-model",
    tags: [],
    defaultData: { label: "Ref Content" },
    defaultWidth: 200,
    defaultHeight: 100,
    styleVariants: ["clean"],
    renderer: ForwardRefRenderer,
    configFields: [],
  };

  const result = buildEditableMathTree(fakeTemplate, {
    data: { label: "Ref Content" },
    mode: "teacher",
    styleVariant: "clean",
    width: 200,
    height: 100,
  });

  assert.ok(
    result.parts.some((p) => p.text === "Ref Content"),
    "Should find editable text inside forwardRef wrapper"
  );
  const markup = renderToStaticMarkup(result.tree);
  assert.ok(
    markup.includes("Ref Content"),
    "Rendered markup should contain content from forwardRef-wrapped renderer"
  );
});
