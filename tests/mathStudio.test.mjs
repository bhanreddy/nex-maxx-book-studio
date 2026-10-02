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

// Test deterministic math algorithms
const {
  formatIndianNumber,
  formatInternationalNumber,
  parseMathNumber,
  getIndianPlaceValueBreakdown,
  getInternationalPlaceValueBreakdown,
  getExpandedForm,
  numberToIndianWords,
  getBase10Blocks,
  solveColumnAddition,
  solveColumnSubtraction,
  solveLongDivision,
  getPieSlicePath,
  getClockHandAngles,
  getTallyMarks,
  getIndianCurrencyBreakdown,
  generateSimilarQuestion,
} = require("../src/editor/math/mathAlgorithms.ts");

// Test registry
const {
  getAllMathTemplates,
  getMathTemplate,
  searchMathTemplates,
} = require("../src/editor/math/mathRegistry.ts");

const { mathSceneForElement } = require("../src/editor/math/mathScene.ts");

test("Maths Smart Engine - Indian Number Formatting", () => {
  assert.equal(formatIndianNumber(872904), "8,72,904");
  assert.equal(formatIndianNumber(23456), "23,456");
  assert.equal(formatIndianNumber(10000000), "1,00,00,000");
  assert.equal(formatIndianNumber(500), "500");
  assert.equal(formatIndianNumber("91,508"), "91,508");
});

test("Maths Smart Engine - International Number Formatting", () => {
  assert.equal(formatInternationalNumber(5432619), "5,432,619");
  assert.equal(formatInternationalNumber(872904), "872,904");
});

test("Maths Smart Engine - Indian Place Value Breakdown", () => {
  const breakdown = getIndianPlaceValueBreakdown(872904);
  assert.equal(breakdown.length, 6);
  assert.equal(breakdown[0].key, "L");
  assert.equal(breakdown[0].digit, 8);
  assert.equal(breakdown[0].placeValue, 800000);
  assert.equal(breakdown[0].period, "Lakhs");

  assert.equal(breakdown[1].key, "TTh");
  assert.equal(breakdown[1].digit, 7);
  assert.equal(breakdown[1].placeValue, 70000);

  assert.equal(breakdown[5].key, "O");
  assert.equal(breakdown[5].digit, 4);
  assert.equal(breakdown[5].placeValue, 4);
});

test("Maths Smart Engine - Expanded Form Decomposition", () => {
  const expanded = getExpandedForm(54326, "indian");
  assert.equal(expanded.length, 5);
  assert.equal(expanded[0].value, 50000);
  assert.equal(expanded[1].value, 4000);
  assert.equal(expanded[2].value, 300);
  assert.equal(expanded[3].value, 20);
  assert.equal(expanded[4].value, 6);
});

test("Maths Smart Engine - Number Names (Indian Words)", () => {
  assert.equal(numberToIndianWords(872904), "Eight Lakh Seventy Two Thousand Nine Hundred and Four");
  assert.equal(numberToIndianWords(54326), "Fifty Four Thousand Three Hundred and Twenty Six");
  assert.equal(numberToIndianWords(0), "Zero");
});

test("Maths Smart Engine - Base-10 Blocks Decomposition", () => {
  const blocks = getBase10Blocks(2435);
  assert.equal(blocks.thousands, 2);
  assert.equal(blocks.hundreds, 4);
  assert.equal(blocks.tens, 3);
  assert.equal(blocks.ones, 5);
});

test("Maths Smart Engine - Column Addition with Carry Row", () => {
  const solved = solveColumnAddition([3482, 1759]);
  assert.equal(solved.sum, 5241);
  assert.deepEqual(solved.sumDigits, [5, 2, 4, 1]);
  // 2+9=11 (carry 1), 8+5+1=14 (carry 1), 4+7+1=12 (carry 1), 3+1+1=5
  assert.equal(solved.carries[0], 1);
});

test("Maths Smart Engine - Column Subtraction with Borrowing", () => {
  const solved = solveColumnSubtraction(5420, 2785);
  assert.equal(solved.diff, 2635);
  assert.deepEqual(solved.diffDigits, ["2", "6", "3", "5"]);
  assert.equal(solved.borrowedFrom[2], true); // borrowed from tens to subtract ones
});

test("Maths Smart Engine - Long Division Steps", () => {
  const solved = solveLongDivision(384, 6);
  assert.equal(solved.quotient, 64);
  assert.equal(solved.remainder, 0);
  assert.ok(solved.steps.length > 0);
});

test("Maths Smart Engine - Fraction Pie Slice Geometry", () => {
  const path = getPieSlicePath(50, 50, 40, 0, 90);
  assert.ok(path.startsWith("M 50 50"));
  assert.ok(path.includes("A 40 40"));
  assert.ok(path.endsWith("Z"));
});

test("Maths Smart Engine - Analogue Clock Angles", () => {
  // At 3:00, minute hand is at 0 deg, hour hand is at 90 deg
  const angles300 = getClockHandAngles(3, 0);
  assert.equal(angles300.hourAngle, 90);
  assert.equal(angles300.minuteAngle, 0);

  // At 6:30, minute hand is at 180 deg, hour hand is at 195 deg
  const angles630 = getClockHandAngles(6, 30);
  assert.equal(angles630.minuteAngle, 180);
  assert.equal(angles630.hourAngle, 195);
});

test("Maths Smart Engine - Tally Marks", () => {
  const tally = getTallyMarks(14);
  assert.equal(tally.fullFives, 2);
  assert.equal(tally.remainder, 4);
});

test("Maths Smart Engine - Indian Currency Breakdown", () => {
  const breakdown = getIndianCurrencyBreakdown(375);
  // 375 = 200 (1) + 100 (1) + 50 (1) + 20 (1) + 5 (1 coin)
  const total = breakdown.reduce((sum, item) => sum + item.denom * item.count, 0);
  assert.equal(total, 375);
});

test("Maths Smart Engine - Local Deterministic Question Generator", () => {
  const genAddition = generateSimilarQuestion("addition", { digitCount: 3, allowCarry: true });
  assert.ok(genAddition.num1 >= 100);
  assert.ok(genAddition.num2 >= 100);

  const genFraction = generateSimilarQuestion("fractions", {});
  assert.ok(genFraction.numerator <= genFraction.denominator);
  assert.ok(genFraction.denominator >= 2);
});

test("Maths Smart Engine - Template Registry Completeness", () => {
  const allTemplates = getAllMathTemplates();
  assert.ok(allTemplates.length >= 60, `Expected at least 60 templates, found ${allTemplates.length}`);

  // Test core priorities
  const indianTable = getMathTemplate("math-place-value-indian");
  assert.ok(indianTable);
  assert.equal(indianTable.category, "place-value");

  const abacus = getMathTemplate("math-abacus");
  assert.ok(abacus);
  assert.equal(abacus.category, "place-value");

  const numberLine = getMathTemplate("math-number-line");
  assert.ok(numberLine);

  const decimalPlaceValue = getMathTemplate("math-decimal-place-value");
  assert.ok(decimalPlaceValue);
  assert.equal(decimalPlaceValue.category, "decimals");

  const fractionCircle = getMathTemplate("math-fraction-circle");
  assert.ok(fractionCircle);
  assert.equal(fractionCircle.category, "fractions");
});

test("Maths Smart Engine - Search & Filter Engine", () => {
  // Search query
  const abacusSearch = searchMathTemplates({ query: "abacus" });
  assert.ok(abacusSearch.length >= 1);
  assert.ok(abacusSearch.some((t) => t.id === "math-abacus"));

  // Topic filter
  const fractionList = searchMathTemplates({ topic: "fractions" });
  assert.ok(fractionList.length >= 4);
  assert.ok(fractionList.every((t) => t.category === "fractions"));

  const decimalList = searchMathTemplates({ topic: "decimals" });
  assert.ok(decimalList.length >= 5);
  assert.ok(decimalList.every((t) => t.category === "decimals"));

  // Grade filter
  const grade1List = searchMathTemplates({ grade: 1 });
  assert.ok(grade1List.length >= 10);
  assert.ok(grade1List.every((t) => t.grades.includes(1)));
});

test("Maths Smart Engine - Vector PublicationScene Generation for PDF/Print", () => {
  const dummyElement = {
    id: "el-test-math",
    pageId: "page-1",
    type: "math-component",
    category: "math",
    version: 1,
    displayName: "Indian Place Value Table",
    transform: { x: 50, y: 100, width: 420, height: 120, rotation: 0, zIndex: 1 },
    style: { backgroundColor: "transparent" },
    content: {
      mathTemplateId: "math-place-value-indian",
      number: 872904,
      mathData: { number: 872904 },
    },
    locked: false,
    hidden: false,
  };

  const scene = mathSceneForElement(dummyElement);
  assert.equal(scene.width, 420);
  assert.equal(scene.height, 120);
  assert.equal(scene.variant, "math-component");
  assert.ok(scene.nodes.length > 5);

  // Must have rect and text nodes
  const rects = scene.nodes.filter((n) => n.kind === "rect");
  const texts = scene.nodes.filter((n) => n.kind === "text");
  assert.ok(rects.length >= 1);
  assert.ok(texts.length >= 1);
});
