import test from "node:test";
import assert from "node:assert/strict";

// ==========================================
// 1. ADAPTIVE LAYOUT SOLVER LOGIC (Directives 9-21, 106, 146)
// ==========================================

function estimateTextHeight(text, fontSizePt, widthPt, lineHeight = 1.35) {
  if (!text || widthPt <= 0) return fontSizePt * lineHeight;
  const avgCharWidthPt = fontSizePt * 0.52;
  const charsPerLine = Math.max(1, Math.floor(widthPt / avgCharWidthPt));
  const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.ceil(estimatedLines * fontSizePt * lineHeight);
}

function solveAdaptiveVerticalGroup(children, config, containerWidthPt) {
  const t0 = performance.now();
  const padding = config.padding || { top: 12, right: 12, bottom: 12, left: 12 };
  const spacing = config.spacingPt || 14;

  let currentY = padding.top;
  const innerWidth = containerWidthPt - (padding.left + padding.right);

  const resolvedChildren = [];

  for (const child of children) {
    let childHeight = child.height;

    // Content-aware reflow
    if (child.type === "text" && child.content) {
      childHeight = estimateTextHeight(child.content, child.fontSize || 12, innerWidth);
    }

    resolvedChildren.push({
      id: child.id,
      x: padding.left,
      y: currentY,
      width: innerWidth,
      height: childHeight,
    });

    currentY += childHeight + spacing;
  }

  const totalHeight = currentY - spacing + padding.bottom;
  const durationMs = performance.now() - t0;

  return {
    containerHeight: totalHeight,
    children: resolvedChildren,
    solverDurationMs: durationMs,
  };
}

// Directive 146 Acceptance Test:
test("Adaptive Acceptance Test: Text expansion shifts downstream elements without overlap (Directive 146)", () => {
  const heading = { id: "el-heading", type: "text", content: "Photosynthesis Overview", fontSize: 24, height: 32 };
  const paragraphShort = {
    id: "el-para",
    type: "text",
    content: "Plants convert light energy into chemical energy stored in glucose molecules for cellular activities.",
    fontSize: 12,
    height: 40,
  };
  const image = { id: "el-img", type: "image", width: 400, height: 180 };
  const caption = { id: "el-cap", type: "text", content: "Figure 1.2: Chloroplast light reactions.", fontSize: 10, height: 16 };

  const config = { spacingPt: 16, padding: { top: 12, right: 12, bottom: 12, left: 12 } };
  const containerWidth = 450;

  // Run 1: Short text
  const initial = solveAdaptiveVerticalGroup([heading, paragraphShort, image, caption], config, containerWidth);
  const initialParaHeight = initial.children[1].height;
  const initialImageY = initial.children[2].y;
  const initialCaptionY = initial.children[3].y;

  // Expand paragraph to ~150 words
  const longParagraphText = `Photosynthesis is a fundamental biological process utilized by green plants, algae, and certain cyanobacteria to transform radiant sunlight energy into vital chemical energy. During the light-dependent reactions occurring within the thylakoid membranes, chlorophyll pigments absorb photons, splitting water molecules into protons, electrons, and releasing molecular oxygen into the atmosphere. The subsequent Calvin cycle, operating in the stroma, fixes ambient carbon dioxide into high-energy carbohydrates. These synthesized sugars fuel metabolic respiration, sustain terrestrial food webs, and establish Earth's life-sustaining oxygen atmosphere. Without this continuous planetary energy conversion, complex animal and plant biology could not exist.`;

  const paragraphExpanded = { ...paragraphShort, content: longParagraphText };

  // Run 2: Expanded text
  const reflowed = solveAdaptiveVerticalGroup([heading, paragraphExpanded, image, caption], config, containerWidth);
  const reflowedParaHeight = reflowed.children[1].height;
  const reflowedImageY = reflowed.children[2].y;
  const reflowedCaptionY = reflowed.children[3].y;

  // Assertions:
  assert.ok(reflowedParaHeight > initialParaHeight, "Paragraph height must expand with longer content");
  assert.ok(reflowedImageY > initialImageY, "Image must shift downward when preceding text expands");
  assert.ok(reflowedCaptionY > initialCaptionY, "Caption must remain attached below the image");

  // Check no overlap between child 1 (paragraph) and child 2 (image)
  const paraBottom = reflowed.children[1].y + reflowed.children[1].height;
  assert.equal(reflowed.children[2].y - paraBottom, config.spacingPt, "Exact 16pt spacing must be preserved between elements");

  // Check solver performance budget (< 2ms)
  assert.ok(reflowed.solverDurationMs < 2.0, `Solver execution took ${reflowed.solverDurationMs}ms (target < 2ms)`);
});

// ==========================================
// 2. NON-DESTRUCTIVE PRESET SWITCHING (Directive 147)
// ==========================================

function switchLayoutNonDestructive(elements, targetLayout) {
  // Elements map with slots
  const pageBounds = { width: 595.28, height: 841.89 };
  const margin = 36;
  const usableW = pageBounds.width - margin * 2;

  const contentMap = {
    title: elements.find((e) => e.slot === "title")?.content,
    body: elements.find((e) => e.slot === "body")?.content,
    images: elements.filter((e) => e.slot === "image" || e.type === "image"),
    activity: elements.find((e) => e.slot === "activity" || e.type === "activity")?.content,
  };

  // Re-layout without deleting any data
  const updatedElements = elements.map((el) => {
    if (targetLayout === "editorial") {
      if (el.slot === "title") return { ...el, x: margin, y: margin, width: usableW, height: 50 };
      if (el.slot === "body") return { ...el, x: margin, y: margin + 60, width: usableW / 2 - 10, height: 350 };
      if (el.type === "image") return { ...el, x: margin + usableW / 2 + 10, y: margin + 60, width: usableW / 2 - 10, height: 200 };
    } else if (targetLayout === "visual") {
      if (el.type === "image") return { ...el, x: margin, y: margin, width: usableW, height: 320 };
      if (el.slot === "title") return { ...el, x: margin, y: margin + 340, width: usableW, height: 40 };
      if (el.slot === "body") return { ...el, x: margin, y: margin + 390, width: usableW, height: 180 };
    }
    return { ...el };
  });

  return { updatedElements, contentMap };
}

test("Preset Acceptance Test: Non-destructive layout switching preserves all content (Directive 147)", () => {
  const originalPageElements = [
    { id: "e1", slot: "title", type: "text", content: "Newton's Laws of Motion" },
    { id: "e2", slot: "body", type: "text", content: "An object in motion remains in motion unless acted upon..." },
    { id: "e3", slot: "image", type: "image", src: "newton-apple.png" },
    { id: "e4", slot: "image", type: "image", src: "forces-vector.png" },
    { id: "e5", slot: "activity", type: "activity", content: "Investigate inertia using a coin and card." },
  ];

  // Switch Editorial -> Visual
  const result1 = switchLayoutNonDestructive(originalPageElements, "editorial");
  assert.equal(result1.updatedElements.length, 5, "No elements may be removed during switch");
  assert.equal(result1.contentMap.title, "Newton's Laws of Motion");
  assert.equal(result1.contentMap.images.length, 2);
  assert.ok(result1.contentMap.activity.includes("inertia"));

  // Switch Visual -> Editorial
  const result2 = switchLayoutNonDestructive(result1.updatedElements, "visual");
  assert.equal(result2.updatedElements.length, 5);
  assert.equal(result2.contentMap.title, "Newton's Laws of Motion");
  assert.equal(result2.contentMap.images.length, 2);
});

// ==========================================
// 3. 160+ PRESET BROWSER SEARCH (Directive 149)
// ==========================================

function createSearchIndex(presets) {
  return presets.map((p) => ({
    ...p,
    searchString: `${p.name} ${p.category} ${p.tags.join(" ")} ${p.description || ""}`.toLowerCase(),
  }));
}

function searchPresets(index, query) {
  const t0 = performance.now();
  const q = query.toLowerCase().trim();
  const matches = index.filter((p) => p.searchString.includes(q));
  const durationMs = performance.now() - t0;
  return { matches, durationMs };
}

test("Preset Browser Acceptance Test: Search 160+ presets instantly (Directive 149)", () => {
  // Generate a mock library of 160 realistic presets
  const categories = [
    "book-structure", "unit", "chapter", "content", "activities",
    "assessment", "visual", "early-learning", "language", "science", "mathematics"
  ];

  const presets = [];
  for (let i = 0; i < 160; i++) {
    const cat = categories[i % categories.length];
    presets.push({
      id: `preset-${i}`,
      name: i === 12 ? "Hands-On Science Experiment" : `Educational Template ${i}`,
      category: cat,
      tags: i === 12 ? ["science", "experiment", "lab", "stem"] : [cat, "balanced", "layout"],
      description: i === 12 ? "Step-by-step scientific investigation card" : "Clean textbook spread",
    });
  }

  const index = createSearchIndex(presets);
  assert.equal(index.length, 160, "Must have at least 160 presets indexed");

  // Search "science experiment"
  const { matches, durationMs } = searchPresets(index, "science experiment");
  assert.ok(matches.length >= 1, "Should find the matching experiment preset");
  assert.equal(matches[0].name, "Hands-On Science Experiment");
  assert.ok(durationMs < 1.0, `Search index lookup took ${durationMs}ms (target < 1ms)`);
});

// ==========================================
// 4. SMART EQUAL SPACING SNAPPING (Directive 43)
// ==========================================

function findEqualSpacing(elementA, elementB, candidateY) {
  const distAB = elementB.y - (elementA.y + elementA.height);
  const distBC = candidateY - (elementB.y + elementB.height);
  const diff = Math.abs(distAB - distBC);
  return {
    isEqual: diff <= 3, // 3pt threshold
    spacingPt: distAB,
    snapY: elementB.y + elementB.height + distAB,
  };
}

test("Smart Spacing: Detects equal distance between sequential layout elements (Directive 43)", () => {
  const elA = { y: 100, height: 50 }; // bottom = 150
  const elB = { y: 170, height: 40 }; // dist AB = 20pt. bottom = 210
  // If elC is placed near y = 230 (dist BC = 20pt)
  const result = findEqualSpacing(elA, elB, 229);
  assert.ok(result.isEqual, "Should detect equal spacing within threshold");
  assert.equal(result.spacingPt, 20);
  assert.equal(result.snapY, 230, "Should provide exact snap coordinate");
});
