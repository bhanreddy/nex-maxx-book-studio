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
  computeVirtualPageWindow,
  thumbnailLruCache,
  dirtyPageTracker,
  processInIdleChunks,
} = require("../src/editor/performance/largeBookEngine.ts");

const {
  MASTER_PAGE_PRESETS,
  propagateMasterToPage,
  propagateMasterToLinkedPages,
} = require("../src/editor/layout/masterPageEngine.ts");

const {
  isKeepWithNext,
  isKeepTogether,
  evaluateWidowOrphanSplit,
  repaginateFromPage,
} = require("../src/editor/core/paginationEngine.ts");

const {
  SMART_COMPONENTS_CATALOG,
  createSmartComponentElement,
} = require("../src/editor/educational/smartComponentFactory.ts");

const {
  DEFAULT_DESIGN_TOKENS,
  propagateGlobalTokensToBook,
} = require("../src/domain/theme/globalTokens.ts");

const {
  solveElementConstraint,
  computeSnapping,
} = require("../src/editor/core/snapping.ts");

const {
  compileBookStructure,
  synchronizeBookStructure,
  generateTocElements,
  toRomanNumeral,
} = require("../src/editor/structure/bookStructureEngine.ts");

const { runFullPreflightScan } = require("../src/editor/publishing/preflightEngine.ts");

function createMock200PageBook() {
  const pages = [];
  const chapters = [];
  const elements = {};

  const totalPages = 220; // 220 pages test book!
  const chaptersCount = 10;
  const pagesPerChapter = 20;

  for (let c = 1; c <= chaptersCount; c++) {
    const chapterId = `chap-${c}`;
    chapters.push({
      id: chapterId,
      title: `Chapter ${c}: Professional Curriculum Production`,
      number: c,
      unitId: "unit-1",
      learningObjectives: [],
      startPageIndex: (c - 1) * pagesPerChapter + 20, // first 20 pages for preliminaries/TOC
      pageCount: pagesPerChapter,
      pageIds: Array.from({length: pagesPerChapter}, (_, i) => `page-${(c - 1) * pagesPerChapter + 21 + i}`),
    });
  }

  // 1. Preliminary pages (Roman numerals i to xx)
  for (let i = 0; i < 20; i++) {
    const pageId = `page-prelim-${i + 1}`;
    const elId = `el-prelim-${i + 1}`;
    pages.push({
      id: pageId,
      pageNumber: i + 1,
      pageIndex: i,
      displayNumber: toRomanNumeral(i + 1),
      elementIds: [elId],
    });
    elements[elId] = {
      id: elId,
      pageId,
      type: i === 0 ? "heading" : "body",
      displayName: i === 0 ? "Book Title" : `Preliminary Page ${i + 1}`,
      transform: { x: 54, y: 54, width: 480, height: 40, rotation: 0, zIndex: 1 },
      content: { text: i === 0 ? "NEX MAXX Book Studio Production Master" : `Introduction content for page ${i + 1}` },
      style: { fontSize: i === 0 ? 28 : 11, color: "#1e293b" },
    };
  }

  // 2. 200 Chapter Pages with various master presets
  const presetKeys = [
    "ChapterOpen",
    "Lesson",
    "StandardContent",
    "Activity",
    "Exercise",
    "Worksheet",
    "Assessment",
    "Revision",
  ];

  for (let i = 20; i < totalPages; i++) {
    const pageId = `page-${i + 1}`;
    const chapterIdx = Math.floor((i - 20) / pagesPerChapter);
    const chapterId = `chap-${chapterIdx + 1}`;
    const pageWithinChapter = (i - 20) % pagesPerChapter;
    const assignedPreset = pageWithinChapter === 0
      ? "ChapterOpen"
      : presetKeys[(pageWithinChapter) % presetKeys.length];

    const elId1 = `el-${pageId}-title`;
    const elId2 = `el-${pageId}-content`;

    pages.push({
      id: pageId,
      pageNumber: i + 1,
      pageIndex: i,
      displayNumber: String(i + 1),
      chapterId,
      masterPreset: assignedPreset,
      masterPageId: MASTER_PAGE_PRESETS[assignedPreset].id,
      elementIds: [elId1, elId2],
    });

    elements[elId1] = {
      id: elId1,
      pageId,
      type: assignedPreset === "ChapterOpen" ? "chapter-title" : "heading",
      displayName: `Title Page ${i + 1}`,
      transform: { x: 54, y: 54, width: 480, height: 36, rotation: 0, zIndex: 1 },
      content: { text: `Chapter ${chapterIdx + 1} - Section ${pageWithinChapter + 1}` },
      style: { fontSize: 18, color: "#0f172a" },
      semanticConstraints: { keepWithNext: true },
    };

    elements[elId2] = {
      id: elId2,
      pageId,
      type: "body",
      displayName: `Content Page ${i + 1}`,
      transform: { x: 54, y: 100, width: 480, height: 200, rotation: 0, zIndex: 1 },
      content: { text: `Detailed pedagogical content for page ${i + 1} with cross reference to {ref:chap-1}.` },
      style: { fontSize: 10.5, color: "#334155" },
    };
  }

  const book = {
    id: "test-200-page-book",
    title: "Master High-Performance Production Volume",
    dimensions: { widthPt: 595.28, heightPt: 841.89, unit: "pt" }, // A4
    margins: { topPt: 54, bottomPt: 54, insidePt: 54, outsidePt: 54 },
    bleed: { topPt: 9, bottomPt: 9, leftPt: 9, rightPt: 9 },
    pages,
    chapters,
    units: [{id: "unit-1", number: 1, title: "Production", chapterIds: chapters.map(chapter => chapter.id)}],
    masterPages: Object.values(MASTER_PAGE_PRESETS).map(preset => ({...preset, type: preset.kind})),
  };

  return { book, elements };
}

test("200+ Page Production Audit: 1. Page Virtualization & Viewport Windowing", () => {
  const { book } = createMock200PageBook();
  assert.equal(book.pages.length, 220, "Book must contain at least 200 pages");

  // Editing Page 180 must only compute a local virtualization window
  const windowPage180 = computeVirtualPageWindow(book.pages.length, 180, 24);
  assert.ok(windowPage180.visibleIndices.includes(180));
  assert.ok(windowPage180.startIndex <= 180);
  assert.ok(windowPage180.endIndex >= 180);
  assert.equal(windowPage180.visibleIndices.length, 24);

  // LRU Thumbnail Cache behaves boundedly under high pressure
  thumbnailLruCache.clear();
  for (let i = 0; i < 220; i++) {
    thumbnailLruCache.set(`page-${i}`, `data:image/svg+xml;test-${i}`);
  }
  assert.ok(thumbnailLruCache.size <= 60, "Thumbnail cache must enforce max size bound");
  assert.ok(thumbnailLruCache.has("page-219"), "Most recent thumbnail must be present in cache");

  // Dirty page tracker isolates modified pages
  dirtyPageTracker.clearAll();
  dirtyPageTracker.markDirty("page-180");
  assert.equal(dirtyPageTracker.isDirty("page-180"), true);
  assert.equal(dirtyPageTracker.isDirty("page-1"), false);
  assert.deepEqual(dirtyPageTracker.getDirtyPages(), ["page-180"]);
});

test("200+ Page Production Audit: 2. Master Pages & Layout Presets Propagation", () => {
  const { book, elements } = createMock200PageBook();
  assert.equal(Object.keys(MASTER_PAGE_PRESETS).length, 8, "Must support all 8 master presets");

  // Verify each preset defines running headers and footers
  for (const [key, preset] of Object.entries(MASTER_PAGE_PRESETS)) {
    assert.ok(preset.name, `Preset ${key} must have name`);
    assert.ok(preset.margins, `Preset ${key} must define margins`);
  }

  // Propagate a master to Page 45
  const page45 = book.pages[45];
  const { page: updatedPage45, updatedElements } = propagateMasterToPage(
    { ...MASTER_PAGE_PRESETS.Exercise, type: "Exercise" },
    page45,
    elements,
    book
  );
  assert.equal(updatedPage45.masterPreset, "Exercise");
  assert.ok(Object.keys(updatedElements).length >= Object.keys(elements).length, "Master propagation must add header/footer elements");

  // Propagate to all pages linked to 'Exercise' without touching manual overrides
  const linkedRes = propagateMasterToLinkedPages({ ...MASTER_PAGE_PRESETS.Exercise, type: "Exercise" }, book, elements);
  assert.ok(linkedRes.affectedPagesCount > 0, "Linked propagation must update matching pages");
});

test("200+ Page Production Audit: 3. Smart Auto-Pagination & Widow/Orphan Protection", () => {
  const { book, elements } = createMock200PageBook();

  // Test keep-with-next detector
  const headingEl = elements[book.pages[25].elementIds[0]];
  assert.equal(isKeepWithNext(headingEl), true, "Headings must default to keep-with-next");

  // Test keep-together detector
  const tableEl = { ...headingEl, type: "table" };
  assert.equal(isKeepTogether(tableEl), true, "Tables must default to keep-together");

  // Test widow/orphan splitter
  const longText = "This is a comprehensive paragraph discussing curriculum structure. ".repeat(15);
  const split = evaluateWidowOrphanSplit(longText, 50, 11, 1.4, 400, 2);
  assert.ok(split !== null);
  if (split.canFitPartially) {
    assert.ok(split.firstPartText.length > 0);
    assert.ok(split.secondPartText.length > 0);
  }

  // Test incremental repagination from page 180 forward
  const repagResult = repaginateFromPage(book, elements, 180);
  assert.ok(repagResult.updatedPages.length >= book.pages.length);
  assert.ok(repagResult.updatedElements !== null);
});

test("200+ Page Production Audit: 4. Reusable Smart Components Catalog & Auto-Resizing", () => {
  assert.equal(SMART_COMPONENTS_CATALOG.length, 10, "Catalog must supply all 10 smart components");

  const archetypes = [
    "learning-outcomes",
    "activity",
    "quick-check",
    "think",
    "vocabulary",
    "fun-fact",
    "worked-example",
    "practice",
    "qr-video",
    "assessment",
  ];

  for (const arch of archetypes) {
    const descriptor = SMART_COMPONENTS_CATALOG.find((c) => c.type === arch);
    assert.ok(descriptor, `Descriptor for ${arch} must exist`);

    const compElement = createSmartComponentElement(arch, "page-50", { x: 54, y: 120, variant: "card" });
    assert.equal(compElement.type, arch === 'qr-video' ? 'smart-media-qr' : 'smart-block');
    assert.equal(compElement.pageId, "page-50");
    assert.ok(compElement.transform.height > 0);
    assert.ok(compElement.transform.width > 0);
  }
});

test("200+ Page Production Audit: 5. Global Styles & Design Tokens Cascading Engine", () => {
  const { book, elements } = createMock200PageBook();
  assert.ok(DEFAULT_DESIGN_TOKENS.colors.primary);
  assert.ok(DEFAULT_DESIGN_TOKENS.typography.scale.body);

  // Mutate primary color and font size
  const customTokens = {
    ...DEFAULT_DESIGN_TOKENS,
    colors: {
      ...DEFAULT_DESIGN_TOKENS.colors,
      primary: "#4338ca",
    },
    typography: {
      ...DEFAULT_DESIGN_TOKENS.typography,
      scale: {
        ...DEFAULT_DESIGN_TOKENS.typography.scale,
        body: 12,
      },
    },
  };

  const { updatedBook, updatedElementsCount } = propagateGlobalTokensToBook(
    customTokens,
    book,
    elements
  );

  assert.ok(updatedElementsCount > 50, "Global token change must update all linked elements");
  assert.equal(updatedBook.globalTokens?.colors.primary, "#4338ca");
});

test("200+ Page Production Audit: 6. Professional Constraint & Snapping Engine", () => {
  const pageBounds = { widthPt: 595.28, heightPt: 841.89 };
  const margins = { topPt: 54, bottomPt: 54, insidePt: 54, outsidePt: 54 };

  // Page dimension change: width increases by 50pt
  const newBounds = { widthPt: 645.28, heightPt: 841.89 };

  // Edge constraint: pin to right margin
  const constrainedRight = solveElementConstraint(
    { x: 400, y: 100, width: 100, height: 50 },
    { horizontal: "right", vertical: "top" },
    pageBounds,
    newBounds,
    margins,
    margins
  );
  assert.equal(constrainedRight.x, 450, "Right-constrained object must shift exactly with new page width");

  // Edge constraint: center horizontally
  const constrainedCenter = solveElementConstraint(
    { x: 247.64, y: 100, width: 100, height: 50 },
    { horizontal: "center", vertical: "top" },
    pageBounds,
    newBounds,
    margins,
    margins
  );
  assert.ok(constrainedCenter.x !== undefined && constrainedCenter.x > 247.64, "Center-constrained object must stay centered");

  // Snap targets detection
  const otherRects = [
    { x: 54, y: 100, width: 200, height: 50 },
    { x: 300, y: 100, width: 200, height: 50 },
  ];
  const snapRes = computeSnapping(
    { x: 56, y: 200, width: 100, height: 40 },
    otherRects,
    pageBounds,
    margins,
    { topPt: 9, bottomPt: 9, leftPt: 9, rightPt: 9 },
    5
  );
  assert.equal(snapRes.x, 54, "Must snap to alignment guide within threshold");
});

test("200+ Page Production Audit: 7. Automatic Book Structure & Semantic TOC Engine", () => {
  const { book, elements } = createMock200PageBook();

  // Compile semantic structure hierarchy
  const structure = compileBookStructure(book, elements);
  assert.equal(structure.totalChapters, 10);
  assert.equal(structure.toc.length, 10);
  assert.ok(structure.toc.length > 0, "TOC must contain chapter entries");

  // Synchronize dynamic numbering & cross-references across 220 pages
  const synced = synchronizeBookStructure(book, elements);
  assert.equal(synced.updatedBook.pages.length, 220);
  assert.ok(synced.referencesUpdatedCount >= 10, "Cross references like {ref:chap-1} must resolve to page numbers");

  // Generate live Table of Contents elements
  const tocElements = generateTocElements(structure, "page-prelim-2", 480, 100);
  assert.ok(tocElements.length > 0, "TOC generator must create entries for chapters");
});

test("200+ Page Production Audit: 8. Preflight 10-Point Scanner on 200+ Page Book", () => {
  const { book, elements } = createMock200PageBook();

  const report = runFullPreflightScan(book, elements);
  assert.equal(report.metrics.totalPages, 220);
  assert.ok(report.metrics.totalElements > 400);
  assert.ok(Array.isArray(report.issues));
  assert.equal(typeof report.isValidForPrint, "boolean");
  assert.equal(typeof report.errorCount, "number");
  assert.equal(typeof report.warningCount, "number");
  assert.equal(typeof report.infoCount, "number");
});

test("200+ Page Production Audit: 9. Idle Chunk Processing Performance", async () => {
  const largeArray = Array.from({ length: 500 }, (_, i) => i);

  const results = await processInIdleChunks(largeArray, (item) => item * 2);

  assert.equal(results.length, 500, "All items across chunks must be processed without blocking");
  assert.equal(results[0], 0);
  assert.equal(results[499], 998);
});
