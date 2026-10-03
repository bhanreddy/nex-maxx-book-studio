// ============================================================================
// PHASE 4 TEST SUITE: UI, TOKENS, GRADE PALETTES, AND TYPOGRAPHY STANDARDS
// ============================================================================

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

const {
  MATH_GRADE_PALETTES,
  MATH_GRADE_TYPOGRAPHY,
  CHROME_VS_PRINT_TOKENS,
} = require("../src/editor/math/tokens.ts");

const {
  getAllMathTemplates,
  searchMathTemplates,
} = require("../src/editor/math/mathRegistry.ts");

test("Phase 4: MATH_GRADE_PALETTES enforces maximum 5 print-safe colors per grade", () => {
  const grades = [1, 2, 3, 4, 5];
  for (const grade of grades) {
    const palette = MATH_GRADE_PALETTES[grade];
    assert.ok(palette, `Palette for grade ${grade} should exist`);
    assert.ok(palette.colors.length <= 5, `Grade ${grade} palette must have at most 5 colors, found ${palette.colors.length}`);
    assert.equal(palette.colors.length, 5, `Grade ${grade} palette specifies exactly 5 curated colors`);
    assert.equal(palette.labels.length, 5, `Grade ${grade} palette specifies 5 labels matching each color`);

    for (const hex of palette.colors) {
      assert.match(hex, /^#[0-9a-fA-F]{6}$/, `Color ${hex} in grade ${grade} must be a valid 6-char hex`);
    }
  }
});

test("Phase 4: MATH_GRADE_TYPOGRAPHY enforces strict minimum text sizes for primary education", () => {
  const minSizes = MATH_GRADE_TYPOGRAPHY.minTextSizes;
  assert.ok(minSizes[1] >= 20, `Class 1 minimum text size must be >= 20px (found ${minSizes[1]})`);
  assert.ok(minSizes[2] >= 16, `Class 2 minimum text size must be >= 16px (found ${minSizes[2]})`);
  assert.ok(minSizes[3] >= 16, `Class 3 minimum text size must be >= 16px (found ${minSizes[3]})`);
  assert.ok(minSizes[4] >= 14, `Class 4 minimum text size must be >= 14px (found ${minSizes[4]})`);
  assert.ok(minSizes[5] >= 14, `Class 5 minimum text size must be >= 14px (found ${minSizes[5]})`);

  const fonts = MATH_GRADE_TYPOGRAPHY.fonts;
  assert.ok(fonts.roundedSans.includes("Fredoka"), "roundedSans typography must include Fredoka");
  assert.ok(fonts.telugu.includes("Noto Sans Telugu"), "telugu typography must include Noto Sans Telugu");
});

test("Phase 4: CHROME_VS_PRINT_TOKENS separates editor dark chrome from paper-white print content", () => {
  assert.equal(CHROME_VS_PRINT_TOKENS.page.paper, "#ffffff", "Page paper must be pure white #ffffff");
  assert.equal(CHROME_VS_PRINT_TOKENS.page.ink, "#0f172a", "Page ink must be crisp high-contrast dark");
  assert.ok(CHROME_VS_PRINT_TOKENS.chrome.selection.includes("--editor-selection"), "Chrome selection must preserve --editor-selection CSS variable");
});

test("Phase 4: Chapter tags are populated and filterable across templates", () => {
  const all = getAllMathTemplates();
  const templatesWithChapter = all.filter(t => Boolean(t.chapterTag));
  assert.ok(templatesWithChapter.length >= 60, `At least 60 templates must have chapterTag specified (found ${templatesWithChapter.length})`);

  // Dynamically derive chapters per grade
  const grade1Chapters = new Set(all.filter(t => t.grades.includes(1) && t.chapterTag).map(t => t.chapterTag));
  assert.ok(grade1Chapters.size >= 4, `Grade 1 should have multiple distinct chapters (found ${grade1Chapters.size})`);

  // Search by chapter tag query
  const sampleChapter = Array.from(grade1Chapters)[0];
  const searchResults = searchMathTemplates({ query: sampleChapter });
  assert.ok(searchResults.length > 0, `Search by chapter '${sampleChapter}' must return results`);
  assert.ok(searchResults.some(t => t.chapterTag === sampleChapter), `Search results must contain templates with chapterTag '${sampleChapter}'`);
});

test("Phase 4: Every template has complete propSchema/configFields and a11yDescription", () => {
  const all = getAllMathTemplates();
  for (const t of all) {
    const fields = t.propSchema || t.configFields;
    assert.ok(Array.isArray(fields) && fields.length > 0, `Template ${t.id} must define propSchema or configFields`);
    assert.ok(t.a11yDescription, `Template ${t.id} must define a11yDescription for accessibility`);
  }
});
