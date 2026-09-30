import test from "node:test";
import assert from "node:assert/strict";

// Coordinates logic verification
const PT_PER_INCH = 72;
const MM_PER_INCH = 25.4;
const PT_PER_MM = PT_PER_INCH / MM_PER_INCH;

function ptToMm(pt) {
  return pt / PT_PER_MM;
}

function calculateEffectiveDpi(pixelDimension, printDimensionPt) {
  if (printDimensionPt <= 0) return 0;
  const inches = printDimensionPt / PT_PER_INCH;
  return Math.round(pixelDimension / inches);
}

function getBoundingBox(rects) {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function computeSnap(movingX, targets, threshold = 5) {
  let closest = movingX;
  let minDiff = threshold;
  for (const t of targets) {
    const diff = Math.abs(movingX - t);
    if (diff < minDiff) {
      minDiff = diff;
      closest = t;
    }
  }
  return closest;
}

test("Coordinate Conversion: 72 points equal 1 inch", () => {
  assert.equal(PT_PER_INCH, 72);
  const mm = ptToMm(PT_PER_MM);
  assert.equal(Math.round(mm), 1);
});

test("DPI Calculation: 1200px at 4 inches (288pt) is 300 DPI", () => {
  const dpi = calculateEffectiveDpi(1200, 288);
  assert.equal(dpi, 300);
});

test("DPI Calculation: 600px at 4 inches (288pt) is 150 DPI (Low DPI Warning)", () => {
  const dpi = calculateEffectiveDpi(600, 288);
  assert.equal(dpi, 150);
  assert.ok(dpi < 180, "Should be flagged as below 180 DPI press threshold");
});

test("Geometry: Combined bounding box of two elements", () => {
  const box1 = { x: 50, y: 50, width: 100, height: 50 };
  const box2 = { x: 120, y: 80, width: 80, height: 60 };
  const union = getBoundingBox([box1, box2]);
  assert.equal(union.x, 50);
  assert.equal(union.y, 50);
  assert.equal(union.width, 150); // 50 to 200
  assert.equal(union.height, 90);  // 50 to 140
});

test("Snapping Engine: Snaps within 5pt threshold", () => {
  const targets = [0, 297.64, 595.28]; // Page edges and center
  const snapped = computeSnap(299, targets, 5);
  assert.equal(snapped, 297.64, "Should snap to page center");

  const noSnap = computeSnap(280, targets, 5);
  assert.equal(noSnap, 280, "Should not snap outside threshold");
});

// Data Merge Token Substitution Test
function replaceTokens(text, record) {
  let result = text;
  for (const [key, val] of Object.entries(record)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), val);
  }
  return result;
}

test("Data Merge: Replaces curriculum tokens safely", () => {
  const template = "Student: {{studentName}} | Grade: {{grade}} | Score: {{score}}%";
  const record = { studentName: "Aarav Sharma", grade: "Grade 5", score: "96" };
  const merged = replaceTokens(template, record);
  assert.equal(merged, "Student: Aarav Sharma | Grade: Grade 5 | Score: 96%");
});

// Manuscript Parser Test
function parseManuscriptOutline(markdown) {
  const lines = markdown.split("\n");
  let units = 0;
  let chapters = 0;
  let pages = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) units++;
    else if (trimmed.startsWith("## ")) chapters++;
    else if (trimmed.startsWith("### ")) pages++;
  }
  return { units, chapters, pages };
}

test("Manuscript Parsing: Identifies curriculum hierarchy", () => {
  const markdown = `
# Unit 1: Cellular Biology
## Chapter 1: Introduction to Cells
### Page 1: Cell Discovery
Text about Hooke
### Page 2: Organelles
Text about mitochondria
## Chapter 2: Plant vs Animal Cells
### Page 3: Comparison Matrix
`;
  const result = parseManuscriptOutline(markdown);
  assert.equal(result.units, 1);
  assert.equal(result.chapters, 2);
  assert.equal(result.pages, 3);
});

// Boolean Geometry Intersection Test
function getIntersection(r1, r2) {
  const x = Math.max(r1.x, r2.x);
  const y = Math.max(r1.y, r2.y);
  const right = Math.min(r1.x + r1.width, r2.x + r2.width);
  const bottom = Math.min(r1.y + r1.height, r2.y + r2.height);
  if (right > x && bottom > y) {
    return { x, y, width: right - x, height: bottom - y };
  }
  return null;
}

test("Boolean Vector: Computes accurate intersection rectangle", () => {
  const r1 = { x: 50, y: 50, width: 100, height: 100 };
  const r2 = { x: 100, y: 80, width: 100, height: 100 };
  const inter = getIntersection(r1, r2);
  assert.ok(inter !== null);
  assert.equal(inter.x, 100);
  assert.equal(inter.y, 80);
  assert.equal(inter.width, 50);
  assert.equal(inter.height, 70);
});

// Safe Arithmetic Expression Parser (Avoiding eval)
function safeEvaluateExpression(expr) {
  const cleaned = expr.replace(/\s+/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)$/);
  if (!match) {
    const single = Number(cleaned);
    return isNaN(single) ? null : single;
  }
  const [, a, op, b] = match;
  const numA = Number(a);
  const numB = Number(b);
  if (op === "+") return numA + numB;
  if (op === "-") return numA - numB;
  if (op === "*") return numA * numB;
  if (op === "/") return numB !== 0 ? numA / numB : null;
  return null;
}

test("Transform Input: Safely computes arithmetic expressions without eval()", () => {
  assert.equal(safeEvaluateExpression("100 + 20"), 120);
  assert.equal(safeEvaluateExpression("50 * 3"), 150);
  assert.equal(safeEvaluateExpression("841.89 / 2"), 420.945);
  assert.equal(safeEvaluateExpression("alert('hack')"), null);
});

