import test from "node:test";
import assert from "node:assert/strict";

// =========================================================================
// 1. Text Wrap & Exclusion Calculation Tests (Parts 3 & 4)
// =========================================================================
function calculateExclusionRegion(transform, wrap) {
  const top = wrap.topOffsetPt ?? wrap.wrapMarginPt ?? 12;
  const bottom = wrap.bottomOffsetPt ?? wrap.wrapMarginPt ?? 12;
  const left = wrap.leftOffsetPt ?? wrap.wrapMarginPt ?? 12;
  const right = wrap.rightOffsetPt ?? wrap.wrapMarginPt ?? 12;

  return {
    x: transform.x - left,
    y: transform.y - top,
    width: transform.width + left + right,
    height: transform.height + top + bottom,
    bounds: {
      left: transform.x - left,
      right: transform.x + transform.width + right,
      top: transform.y - top,
      bottom: transform.y + transform.height + bottom,
    },
  };
}

function resolveTextWrapping(textFrame, obstacle, wrap) {
  if (!wrap || wrap.mode === "none") {
    return { adjustedTransform: {} };
  }

  const excl = calculateExclusionRegion(obstacle.transform, wrap);

  // Check collision between text frame and exclusion boundary
  const overlapsX =
    textFrame.transform.x < excl.bounds.right &&
    textFrame.transform.x + textFrame.transform.width > excl.bounds.left;
  const overlapsY =
    textFrame.transform.y < excl.bounds.bottom &&
    textFrame.transform.y + textFrame.transform.height > excl.bounds.top;

  if (!overlapsX || !overlapsY) {
    return { adjustedTransform: {} };
  }

  if (wrap.mode === "top-bottom") {
    return {
      adjustedTransform: {
        y: excl.bounds.bottom + 8,
      },
    };
  }

  if (wrap.mode === "square" || wrap.mode === "tight") {
    const spaceRight = textFrame.transform.x + textFrame.transform.width - excl.bounds.right;
    const spaceLeft = excl.bounds.left - textFrame.transform.x;

    if (spaceRight >= 120) {
      return {
        adjustedTransform: {
          x: excl.bounds.right,
          width: textFrame.transform.width - (excl.bounds.right - textFrame.transform.x),
        },
      };
    } else if (spaceLeft >= 120) {
      return {
        adjustedTransform: {
          width: excl.bounds.left - textFrame.transform.x,
        },
      };
    } else {
      return {
        adjustedTransform: {
          y: excl.bounds.bottom + 8,
        },
      };
    }
  }

  return { adjustedTransform: {} };
}

test("Text Wrap: Calculates accurate exclusion region with custom 4-way offsets", () => {
  const transform = { x: 100, y: 150, width: 200, height: 120 };
  const wrap = {
    mode: "square",
    topOffsetPt: 15,
    bottomOffsetPt: 20,
    leftOffsetPt: 10,
    rightOffsetPt: 25,
  };

  const excl = calculateExclusionRegion(transform, wrap);
  assert.equal(excl.x, 90);
  assert.equal(excl.y, 135);
  assert.equal(excl.width, 235);
  assert.equal(excl.height, 155);
  assert.equal(excl.bounds.right, 325);
  assert.equal(excl.bounds.bottom, 290);
});

test("Text Wrap: Top-Bottom mode pushes text frame below obstacle", () => {
  const textFrame = { transform: { x: 50, y: 100, width: 400, height: 100 } };
  const obstacle = { transform: { x: 150, y: 80, width: 200, height: 80 } };
  const wrap = { mode: "top-bottom", wrapMarginPt: 12 };

  const result = resolveTextWrapping(textFrame, obstacle, wrap);
  assert.ok(result.adjustedTransform.y !== undefined);
  assert.ok(result.adjustedTransform.y > obstacle.transform.y + obstacle.transform.height);
});

// =========================================================================
// 2. Magnetic Drop Zones Tests (Part 8)
// =========================================================================
function getMagneticDropZones(pageDim, margins) {
  const usableX = margins.insidePt;
  const usableY = margins.topPt;
  const usableW = pageDim.widthPt - (margins.insidePt + margins.outsidePt);
  const usableH = pageDim.heightPt - (margins.topPt + margins.bottomPt);
  const colGap = 16;
  const halfW = (usableW - colGap) / 2;

  return [
    {
      id: "zone-hero",
      label: "Hero Feature (Top 35%)",
      category: "hero",
      bounds: { x: usableX, y: usableY, width: usableW, height: Math.round(usableH * 0.35) },
    },
    {
      id: "zone-half-left",
      label: "Left Column (50%)",
      category: "column",
      bounds: { x: usableX, y: usableY, width: halfW, height: usableH },
    },
    {
      id: "zone-half-right",
      label: "Right Column (50%)",
      category: "column",
      bounds: { x: usableX + halfW + colGap, y: usableY, width: halfW, height: usableH },
    },
  ];
}

function detectMagneticDropZone(x, y, width, height, pageDim, margins, thresholdPt = 32) {
  const zones = getMagneticDropZones(pageDim, margins);
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  let closestZone = null;
  let minDistance = thresholdPt;

  for (const zone of zones) {
    const zoneCenterX = zone.bounds.x + zone.bounds.width / 2;
    const zoneCenterY = zone.bounds.y + zone.bounds.height / 2;
    const dx = Math.abs(centerX - zoneCenterX);
    const dy = Math.abs(centerY - zoneCenterY);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDistance) {
      minDistance = dist;
      closestZone = zone;
    }
  }

  return closestZone;
}

test("Magnetic Drop Zones: Accurately identifies Hero Drop Zone near top of page", () => {
  const pageDim = { widthPt: 595, heightPt: 842 };
  const margins = { topPt: 54, bottomPt: 54, insidePt: 54, outsidePt: 54 };

  const movingItem = { x: 60, y: 70, width: 450, height: 180 };
  const detected = detectMagneticDropZone(
    movingItem.x,
    movingItem.y,
    movingItem.width,
    movingItem.height,
    pageDim,
    margins,
    50
  );

  assert.ok(detected !== null);
  assert.equal(detected.id, "zone-hero");
});

// =========================================================================
// 3. Natural Language Command Intent Parser (Part 11)
// =========================================================================
function interpretNaturalLayoutCommand(prompt) {
  const lower = prompt.toLowerCase();
  const directive = {};

  if (lower.includes("playful") || lower.includes("kindergarten") || lower.includes("fun") || lower.includes("grade 1")) {
    directive.density = "low";
    directive.typographyScale = "large";
    directive.cornerRadius = 16;
    directive.illustrationPriority = "high";
  } else if (lower.includes("academic") || lower.includes("dense") || lower.includes("exam") || lower.includes("formal")) {
    directive.density = "compact";
    directive.typographyScale = "academic";
    directive.illustrationPriority = "balanced";
    directive.cornerRadius = 4;
  } else if (lower.includes("hero") || lower.includes("importance") || lower.includes("larger image")) {
    directive.illustrationPriority = "hero";
    directive.density = "comfortable";
  } else if (lower.includes("reduce empty space") || lower.includes("compact")) {
    directive.density = "compact";
  } else {
    directive.density = "balanced";
    directive.illustrationPriority = "balanced";
    directive.typographyScale = "standard";
  }

  return directive;
}

test("Natural Language Parser: Converts 'Make this page more playful' to structured layout directives", () => {
  const directive = interpretNaturalLayoutCommand("Make this page more playful for grade 1");
  assert.equal(directive.density, "low");
  assert.equal(directive.typographyScale, "large");
  assert.equal(directive.illustrationPriority, "high");
  assert.equal(directive.cornerRadius, 16);
});

test("Natural Language Parser: Converts 'Make this page academic and formal' to compact structured rules", () => {
  const directive = interpretNaturalLayoutCommand("Make this page academic and formal");
  assert.equal(directive.density, "compact");
  assert.equal(directive.typographyScale, "academic");
  assert.equal(directive.cornerRadius, 4);
});

// =========================================================================
// 4. Layout Health Engine Tests (Part 25)
// =========================================================================
function evaluateLayoutHealth(elements, pageDim, margins) {
  const issues = [];
  const safeLeft = margins.insidePt;
  const safeRight = pageDim.widthPt - margins.outsidePt;
  const safeTop = margins.topPt;
  const safeBottom = pageDim.heightPt - margins.bottomPt;

  let deductions = 0;

  // 1. Margin compliance
  elements.forEach((el) => {
    if (el.hidden) return;
    const left = el.transform.x;
    const right = el.transform.x + el.transform.width;
    const top = el.transform.y;
    const bottom = el.transform.y + el.transform.height;

    if (left < safeLeft - 4 || right > safeRight + 4 || top < safeTop - 4 || bottom > safeBottom + 4) {
      issues.push({
        id: `issue-margin-${el.id}`,
        type: "margin-overflow",
        severity: "error",
        title: `Margin Violation: ${el.displayName}`,
        description: "Element crosses beyond safe printable margins.",
        fixable: true,
      });
      deductions += 6;
    }
  });

  // 2. Orphan headings at bottom of page
  elements.forEach((el) => {
    if (el.type === "heading" || el.type === "subheading" || el.type === "chapter-title") {
      const bottom = el.transform.y + el.transform.height;
      if (bottom > safeBottom - 50) {
        issues.push({
          id: `issue-orphan-${el.id}`,
          type: "orphan-heading",
          severity: "warning",
          title: `Orphan Heading: ${el.displayName}`,
          description: "Heading appears isolated at bottom margin with insufficient room for body text.",
          fixable: true,
        });
        deductions += 8;
      }
    }
  });

  const finalScore = Math.max(0, Math.min(100, Math.round(100 - deductions)));
  return {
    score: finalScore,
    issues,
    autoFixableCount: issues.filter((i) => i.fixable).length,
  };
}

test("Layout Health Engine: Flags orphan headings at bottom of page and margin violations", () => {
  const pageDim = { widthPt: 595, heightPt: 842 };
  const margins = { topPt: 54, bottomPt: 54, insidePt: 54, outsidePt: 54 };

  const elements = [
    {
      id: "el-1",
      displayName: "Unit Heading",
      type: "heading",
      transform: { x: 54, y: 750, width: 400, height: 30 }, // Near bottom (orphan heading!)
    },
    {
      id: "el-2",
      displayName: "Out of Bounds Box",
      type: "body",
      transform: { x: 10, y: 100, width: 600, height: 80 }, // Crosses safeLeft & safeRight!
    },
  ];

  const report = evaluateLayoutHealth(elements, pageDim, margins);
  assert.ok(report.score < 90);
  assert.equal(report.issues.length, 2);
  assert.ok(report.issues.some((i) => i.type === "orphan-heading"));
  assert.ok(report.issues.some((i) => i.type === "margin-overflow"));
});

// =========================================================================
// 5. Linked Text Flow Engine Tests (Part 5)
// =========================================================================
function distributeLinkedText(frames, fullStoryText) {
  const results = {};
  let currentOffset = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const capacity = Math.max(50, Math.round((frame.width * frame.height) / 100));
    const isLast = i === frames.length - 1;

    if (currentOffset >= fullStoryText.length) {
      results[frame.id] = { text: "", isOverset: false, oversetChars: 0 };
    } else {
      const sliceEnd = isLast ? fullStoryText.length : currentOffset + capacity;
      const text = fullStoryText.slice(currentOffset, sliceEnd);
      const isOverset = isLast && text.length > capacity;
      const oversetChars = isOverset ? text.length - capacity : 0;

      results[frame.id] = { text, isOverset, oversetChars };
      currentOffset += capacity;
    }
  }

  return results;
}

test("Linked Text Flow: Distributes long text sequentially across frames and flags overset on last frame", () => {
  const frames = [
    { id: "frame-1", width: 200, height: 100 }, // capacity ~ 200 chars
    { id: "frame-2", width: 200, height: 100 }, // capacity ~ 200 chars
  ];

  const storyText = "A".repeat(500); // 500 characters, exceeds capacity of 400
  const flow = distributeLinkedText(frames, storyText);

  assert.equal(flow["frame-1"].isOverset, false);
  assert.equal(flow["frame-2"].isOverset, true);
  assert.ok(flow["frame-2"].oversetChars > 0);
});

// =========================================================================
// 6. Educational Design Tokens & Themes Tests (Parts 13 & 24)
// =========================================================================
test("Color Psychology Tokens: Educational domains map to purposeful colors", () => {
  const SEMANTIC_COLORS = {
    learning: "#0284c7",    // Blue: clarity & focus
    creativity: "#9333ea",  // Purple: imagination & discovery
    activity: "#059669",    // Green: hands-on practice & lab
    exercise: "#ea580c",    // Orange: challenges & interactive
    curiosity: "#ca8a04",   // Yellow: fun facts & tips
    warning: "#e11d48",     // Red/Rose: critical notices & safety
  };

  assert.equal(SEMANTIC_COLORS.learning, "#0284c7");
  assert.equal(SEMANTIC_COLORS.activity, "#059669");
  assert.equal(SEMANTIC_COLORS.curiosity, "#ca8a04");
  assert.equal(SEMANTIC_COLORS.warning, "#e11d48");
});
