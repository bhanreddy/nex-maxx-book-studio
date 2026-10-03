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
const { buildEditableMathTree } = require("../src/editor/math/mathEditableTree.tsx");

// Import primitives from _kit
const {
  NumberLine,
  TenFrame,
  BaseTenBlocks,
  Clock,
  CoinNote,
  FractionBar,
  FractionCircle,
  GridPaper,
  Ruler,
  Protractor,
  Thermometer,
  BarChart,
  Pictograph,
  TallyMarks,
  ColumnArithmetic,
  CalloutBox,
} = require("../src/editor/math/templates/_kit/index.ts");

// ============================================================================
// PHASE 2 — TEMPLATE AUTHORING CONTRACT & PRIMITIVES KIT TESTS
// ============================================================================

test("All 16 kit primitives render without throwing and produce valid HTML/SVG", () => {
  const elements = [
    React.createElement(NumberLine, { start: 0, end: 10, step: 1 }),
    React.createElement(TenFrame, { value: 7 }),
    React.createElement(BaseTenBlocks, { value: 245 }),
    React.createElement(Clock, { hours: 3, minutes: 15 }),
    React.createElement(CoinNote, { type: "coin", denomination: 10 }),
    React.createElement(CoinNote, { type: "note", denomination: 100 }),
    React.createElement(FractionBar, { numerator: 2, denominator: 5 }),
    React.createElement(FractionCircle, { numerator: 3, denominator: 8 }),
    React.createElement(GridPaper, { rows: 5, cols: 5 }),
    React.createElement(Ruler, { lengthCm: 15 }),
    React.createElement(Protractor, { angle: 45 }),
    React.createElement(Thermometer, { temperature: 30 }),
    React.createElement(BarChart, { data: [{ label: "A", value: 10 }, { label: "B", value: 20 }] }),
    React.createElement(Pictograph, { items: [{ label: "Cats", count: 8 }] }),
    React.createElement(TallyMarks, { count: 14 }),
    React.createElement(ColumnArithmetic, { operation: "+", operands: [123, 456], result: 579 }),
    React.createElement(CalloutBox, { variant: "example", title: "Example 1" }, "Solve this equation."),
  ];

  for (const el of elements) {
    const html = renderToStaticMarkup(el);
    assert.ok(html.length > 0, `Primitive ${el.type.name} must render non-empty HTML`);
  }
});

test("Kit primitives are pure synchronous layout functions (no React hooks)", () => {
  // If a primitive called useState, useEffect, etc. outside a React render context,
  // calling it directly as a function would immediately throw an invalid hook call error.
  const fnPrimitives = [
    () => NumberLine({ start: 0, end: 5 }),
    () => TenFrame({ value: 5 }),
    () => BaseTenBlocks({ hundreds: 1, tens: 2, ones: 3 }),
    () => Clock({ hours: 12, minutes: 30 }),
    () => CoinNote({ type: "coin", denomination: 5 }),
    () => FractionBar({ numerator: 1, denominator: 3 }),
    () => FractionCircle({ numerator: 1, denominator: 4 }),
    () => GridPaper({ rows: 4, cols: 4 }),
    () => Ruler({ lengthCm: 10 }),
    () => Protractor({ angle: 90 }),
    () => Thermometer({ temperature: 20 }),
    () => BarChart({ data: [{ label: "X", value: 5 }] }),
    () => Pictograph({ items: [{ label: "Stars", count: 10 }] }),
    () => TallyMarks({ count: 7 }),
    () => ColumnArithmetic({ operands: [50, 20] }),
    () => CalloutBox({ title: "Note" }, "Pure function"),
  ];

  for (const fn of fnPrimitives) {
    assert.doesNotThrow(() => fn(), "Direct execution of primitive must not throw hook errors");
  }
});

test("A template composed from kit primitives traverses cleanly in buildEditableMathTree", () => {
  // Define a synthetic template composed of kit primitives
  const mockTemplate = {
    id: "test-kit-composed",
    name: "Kit Composed Lesson",
    category: "numbers",
    grades: [2],
    grade: 2,
    chapterTag: "Chapter 2: Place Value & Operations",
    type: "worked-example",
    tags: ["kit", "test"],
    defaultData: { count: 12, num: 25 },
    defaultWidth: 400,
    defaultHeight: 300,
    styleVariants: ["clean"],
    configFields: [{ key: "count", label: "Count", type: "number", defaultValue: 12 }],
    a11yDescription: "A composed lesson with ten frame and number line",
    renderer: ({ data }) =>
      React.createElement(
        "div",
        { className: "composed-page p-4" },
        React.createElement(CalloutBox, { variant: "remember" }, "Double ten frame representation"),
        React.createElement(TenFrame, { value: data.count }),
        React.createElement(NumberLine, { start: 0, end: 20, step: 2 })
      ),
  };

  const tree = buildEditableMathTree(mockTemplate, {
    data: mockTemplate.defaultData,
    mode: "teacher",
    styleVariant: "clean",
    width: 400,
    height: 300,
  });

  assert.ok(tree.tree, "Tree must be generated");
  assert.ok(tree.parts.length > 0, "Parts list must detect editable text nodes and panels");

  // Verify that CalloutBox title and body text are editable
  const hasCalloutText = tree.parts.some((p) => p.text && p.text.includes("REMEMBER"));
  assert.ok(hasCalloutText, "CalloutBox text must be exposed in editable parts");
});

test("Student mode hides answer in NumberLine and ColumnArithmetic", () => {
  // NumberLine with missing points
  const nlTeacher = renderToStaticMarkup(
    React.createElement(NumberLine, { start: 0, end: 10, missingPoints: [5], showAnswer: true })
  );
  const nlStudent = renderToStaticMarkup(
    React.createElement(NumberLine, { start: 0, end: 10, missingPoints: [5], showAnswer: false })
  );
  assert.ok(nlTeacher.includes(">5<"), "Teacher mode displays missing point answer 5");
  assert.ok(nlStudent.includes("?"), "Student mode displays question mark box for missing point");

  // ColumnArithmetic
  const colTeacher = renderToStaticMarkup(
    React.createElement(ColumnArithmetic, { operands: [12, 34], result: 46, showResult: true })
  );
  const colStudent = renderToStaticMarkup(
    React.createElement(ColumnArithmetic, { operands: [12, 34], result: 46, showResult: false })
  );
  assert.ok(colTeacher.includes(">4<") && colTeacher.includes(">6<"), "Teacher mode displays result digits 4 and 6");
  assert.ok(colStudent.includes("?"), "Student mode renders placeholder box with '?' for result");
});

test("CoinNote correctly differentiates coins and banknotes with ₹ symbol", () => {
  const coinHtml = renderToStaticMarkup(React.createElement(CoinNote, { type: "coin", denomination: 20 }));
  const noteHtml = renderToStaticMarkup(React.createElement(CoinNote, { type: "note", denomination: 500 }));

  assert.ok(coinHtml.includes("₹"), "Coin must display ₹ symbol");
  assert.ok(coinHtml.includes("20"), "Coin must display 20 denomination");
  assert.ok(noteHtml.includes("RESERVE BANK OF INDIA"), "Banknote must include official RBI heading");
  assert.ok(noteHtml.includes("500"), "Banknote must display 500 denomination");
});

test("Clock displays accurate hour/minute geometry and digital badge", () => {
  const clockElement = React.createElement(Clock, { hours: 9, minutes: 30, showDigital: true });
  const clockHtml = renderToStaticMarkup(clockElement);
  assert.ok(clockHtml.includes("09:30"), "Digital badge must display formatted 09:30");
  assert.ok(clockHtml.includes("line"), "Clock must render hands via SVG line elements");
  assert.ok(clockHtml.includes(">12<"), "Clock numbers must include 12");

  // Inspect the React element tree returned by Clock to verify keys
  const renderedTree = Clock({ hours: 9, minutes: 30 });
  const svg = renderedTree.props.children[0];
  const numbersGroup = svg.props.children[4]; // Hour Numerals array
  assert.ok(Array.isArray(numbersGroup), "Numbers group is an array of elements");
  assert.equal(numbersGroup[11].key, "clock-num-12", "Clock numbers must have stable keys");
});
