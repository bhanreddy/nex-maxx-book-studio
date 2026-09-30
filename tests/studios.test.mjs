import test from "node:test";
import assert from "node:assert/strict";

// ==========================================
// 1. VECTOR BÉZIER SERIALIZATION ENGINE TEST
// ==========================================
function curveNodesToSvgPath(nodes, closed = true) {
  if (nodes.length === 0) return "";
  if (nodes.length === 1) return `M ${nodes[0].x} ${nodes[0].y}`;

  let d = `M ${nodes[0].x} ${nodes[0].y}`;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    const cp1x = prev.handleOut ? prev.x + prev.handleOut.x : prev.x;
    const cp1y = prev.handleOut ? prev.y + prev.handleOut.y : prev.y;
    const cp2x = curr.handleIn ? curr.x + curr.handleIn.x : curr.x;
    const cp2y = curr.handleIn ? curr.y + curr.handleIn.y : curr.y;

    if (!prev.handleOut && !curr.handleIn) {
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
  }

  if (closed && nodes.length > 2) {
    const last = nodes[nodes.length - 1];
    const first = nodes[0];
    const cp1x = last.handleOut ? last.x + last.handleOut.x : last.x;
    const cp1y = last.handleOut ? last.y + last.handleOut.y : last.y;
    const cp2x = first.handleIn ? first.x + first.handleIn.x : first.x;
    const cp2y = first.handleIn ? first.y + first.handleIn.y : first.y;

    if (!last.handleOut && !first.handleIn) {
      d += " Z";
    } else {
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${first.x.toFixed(2)} ${first.y.toFixed(2)} Z`;
    }
  }

  return d;
}

test("Vector Studio: Serializes Bézier nodes to SVG path with cubic control points", () => {
  const nodes = [
    { id: "n0", x: 10, y: 10, type: "sharp", handleOut: { x: 5, y: -5 } },
    { id: "n1", x: 50, y: 20, type: "smooth", handleIn: { x: -8, y: 0 }, handleOut: { x: 8, y: 0 } },
    { id: "n2", x: 80, y: 60, type: "sharp" },
  ];

  const path = curveNodesToSvgPath(nodes, true);
  assert.ok(path.startsWith("M 10 10"));
  assert.ok(path.includes("C 15.00 5.00, 42.00 20.00, 50.00 20.00"));
  assert.ok(path.endsWith("Z"));
});

// ==========================================
// 2. SHAPE CONVERSION TO CURVE NODES
// ==========================================
function shapeToCurveNodes(shapeType, w, h) {
  if (shapeType === "rectangle") {
    return [
      { id: "n-0", x: 0, y: 0, type: "sharp" },
      { id: "n-1", x: w, y: 0, type: "sharp" },
      { id: "n-2", x: w, y: h, type: "sharp" },
      { id: "n-3", x: 0, y: h, type: "sharp" },
    ];
  }
  if (shapeType === "circle") {
    const rx = w / 2;
    const ry = h / 2;
    const kx = 0.5522847498 * rx;
    const ky = 0.5522847498 * ry;
    return [
      { id: "n-top", x: rx, y: 0, type: "smooth", handleIn: { x: -kx, y: 0 }, handleOut: { x: kx, y: 0 } },
      { id: "n-right", x: w, y: ry, type: "smooth", handleIn: { x: 0, y: -ky }, handleOut: { x: 0, y: ky } },
      { id: "n-bottom", x: rx, y: h, type: "smooth", handleIn: { x: kx, y: 0 }, handleOut: { x: -kx, y: 0 } },
      { id: "n-left", x: 0, y: ry, type: "smooth", handleIn: { x: 0, y: ky }, handleOut: { x: 0, y: -ky } },
    ];
  }
  return [];
}

test("Vector Studio: Converts parametric shapes into editable Bézier nodes", () => {
  const rectNodes = shapeToCurveNodes("rectangle", 200, 100);
  assert.equal(rectNodes.length, 4);
  assert.equal(rectNodes[0].type, "sharp");
  assert.equal(rectNodes[2].x, 200);
  assert.equal(rectNodes[2].y, 100);

  const circleNodes = shapeToCurveNodes("circle", 100, 100);
  assert.equal(circleNodes.length, 4);
  assert.equal(circleNodes[0].type, "smooth");
  assert.ok(circleNodes[0].handleIn && circleNodes[0].handleOut);
  assert.equal(circleNodes[0].y, 0);
  assert.equal(circleNodes[2].y, 100);
});

// ==========================================
// 3. CORNER FILLET GEOMETRY
// ==========================================
function applyCornerFillet(prev, corner, next, radiusPt, cornerType = "rounded") {
  if (radiusPt <= 0) return [corner];

  const v1x = prev.x - corner.x;
  const v1y = prev.y - corner.y;
  const v2x = next.x - corner.x;
  const v2y = next.y - corner.y;

  const d1 = Math.hypot(v1x, v1y);
  const d2 = Math.hypot(v2x, v2y);
  if (d1 === 0 || d2 === 0) return [corner];

  const actualR = Math.min(radiusPt, d1 / 2, d2 / 2);
  const p1x = corner.x + (v1x / d1) * actualR;
  const p1y = corner.y + (v1y / d1) * actualR;
  const p2x = corner.x + (v2x / d2) * actualR;
  const p2y = corner.y + (v2y / d2) * actualR;

  if (cornerType === "chamfer") {
    return [
      { id: `${corner.id}-c1`, x: p1x, y: p1y, type: "sharp" },
      { id: `${corner.id}-c2`, x: p2x, y: p2y, type: "sharp" },
    ];
  }

  const k = 0.5522847498;
  return [
    {
      id: `${corner.id}-c1`,
      x: p1x,
      y: p1y,
      type: "smooth",
      handleOut: { x: (corner.x - p1x) * k, y: (corner.y - p1y) * k },
    },
    {
      id: `${corner.id}-c2`,
      x: p2x,
      y: p2y,
      type: "smooth",
      handleIn: { x: (corner.x - p2x) * k, y: (corner.y - p2y) * k },
    },
  ];
}

test("Vector Studio: Applies Corner Fillet to sharp vertex (rounded & chamfer)", () => {
  const prev = { id: "p", x: 0, y: 100, type: "sharp" };
  const corner = { id: "c", x: 100, y: 100, type: "sharp" };
  const next = { id: "n", x: 100, y: 0, type: "sharp" };

  const chamferNodes = applyCornerFillet(prev, corner, next, 20, "chamfer");
  assert.equal(chamferNodes.length, 2);
  assert.equal(chamferNodes[0].x, 80);
  assert.equal(chamferNodes[0].y, 100);
  assert.equal(chamferNodes[1].x, 100);
  assert.equal(chamferNodes[1].y, 80);

  const roundedNodes = applyCornerFillet(prev, corner, next, 20, "rounded");
  assert.equal(roundedNodes.length, 2);
  assert.equal(roundedNodes[0].type, "smooth");
  assert.ok(roundedNodes[0].handleOut);
});

// ==========================================
// 4. PIXEL STUDIO ADJUSTMENT FILTER MATRICES
// ==========================================
function buildCssFilterString(adjustments, liveFilters) {
  const parts = [];
  if (adjustments) {
    if (adjustments.brightness !== undefined && adjustments.brightness !== 1) {
      parts.push(`brightness(${adjustments.brightness})`);
    }
    if (adjustments.contrast !== undefined && adjustments.contrast !== 1) {
      parts.push(`contrast(${adjustments.contrast})`);
    }
    if (adjustments.hueRotateDeg) {
      parts.push(`hue-rotate(${adjustments.hueRotateDeg}deg)`);
    }
    if (adjustments.invert) {
      parts.push("invert(1)");
    }
  }
  if (liveFilters) {
    if (liveFilters.blurRadiusPt) {
      parts.push(`blur(${liveFilters.blurRadiusPt}px)`);
    }
    if (liveFilters.sepia) {
      parts.push(`sepia(${liveFilters.sepia})`);
    }
  }
  return parts.length > 0 ? parts.join(" ") : "none";
}

test("Pixel Studio: Generates non-destructive CSS filter string for live adjustments", () => {
  const filterStr = buildCssFilterString(
    { brightness: 1.2, contrast: 1.1, hueRotateDeg: 45, invert: false },
    { blurRadiusPt: 2 }
  );
  assert.equal(filterStr, "brightness(1.2) contrast(1.1) hue-rotate(45deg) blur(2px)");
});

// ==========================================
// 5. AI STUDIO EDUCATIONAL PRESETS & PROMPTS
// ==========================================
function buildEducationalPrompt(rawPrompt, style, grade = 5) {
  const safeTokens = [
    `Grade ${grade} educational textbook illustration`,
    "high-resolution print publishing clarity",
    "clean vector contours",
    "safe educational presentation",
    "no watermarks",
    "no spelling mistakes",
  ];
  return `${rawPrompt}, ${style} style, ${safeTokens.join(", ")}`;
}

test("AI Studio: Generates curriculum-safe educational prompts with grade level", () => {
  const prompt = buildEducationalPrompt("Photosynthesis process in leaf", "Scientific Illustration", 5);
  assert.ok(prompt.includes("Photosynthesis process in leaf"));
  assert.ok(prompt.includes("Scientific Illustration"));
  assert.ok(prompt.includes("Grade 5 educational textbook illustration"));
  assert.ok(prompt.includes("high-resolution print publishing clarity"));
});

// ==========================================
// 6. AI SUPER RESOLUTION DPI CALCULATION
// ==========================================
function calculateSuperResolution(widthPx, heightPx, factor, printWidthPt, printHeightPt) {
  const newWidth = widthPx * factor;
  const newHeight = heightPx * factor;
  const inchesW = printWidthPt / 72;
  const estimatedDpi = Math.round(newWidth / inchesW);
  return { newWidth, newHeight, estimatedDpi };
}

test("AI Studio: 2x and 4x Super Resolution computes accurate print DPI", () => {
  // A 4-inch wide image (288pt) that was initially 600px (150 DPI)
  const res2x = calculateSuperResolution(600, 400, 2, 288, 192);
  assert.equal(res2x.newWidth, 1200);
  assert.equal(res2x.newHeight, 800);
  assert.equal(res2x.estimatedDpi, 300); // 300 DPI is commercial print ready!

  const res4x = calculateSuperResolution(600, 400, 4, 288, 192);
  assert.equal(res4x.newWidth, 2400);
  assert.equal(res4x.estimatedDpi, 600); // High-res art print
});

// ==========================================
// 7. SINGLE DOCUMENT CROSS-STUDIO COEXISTENCE
// ==========================================
test("Unified Architecture: Single PageElement document holds Layout, Vector, Pixel and AI layers", () => {
  const documentElements = {
    "el-text-frame": {
      id: "el-text-frame",
      type: "body",
      displayName: "Chapter Introduction",
      transform: { x: 54, y: 72, width: 486, height: 120, zIndex: 1 },
      content: { text: "Chapter 4: Cell Biology" },
    },
    "el-vector-annotation": {
      id: "el-vector-annotation",
      type: "vector-curve",
      displayName: "Mitosis Pointer Arrow",
      transform: { x: 120, y: 220, width: 80, height: 60, zIndex: 2 },
      curveData: {
        nodes: [
          { id: "v0", x: 0, y: 30, type: "sharp" },
          { id: "v1", x: 80, y: 30, type: "sharp" },
        ],
        closed: false,
      },
    },
    "el-pixel-retouch": {
      id: "el-pixel-retouch",
      type: "pixel-layer",
      displayName: "Retouched Microscope Slide",
      transform: { x: 220, y: 220, width: 240, height: 180, zIndex: 3 },
      pixelData: {
        dataUrl: "data:image/png;base64,mock",
        widthPx: 480,
        heightPx: 360,
        maskEnabled: true,
      },
    },
    "el-ai-illustration": {
      id: "el-ai-illustration",
      type: "ai-vector",
      displayName: "AI Plant Cell Diagram",
      transform: { x: 54, y: 420, width: 300, height: 200, zIndex: 4 },
      aiMetadata: {
        prompt: "Diagram of plant cell with nucleus and chloroplasts",
        model: "nex-maxx-vector-pro",
        style: "Scientific Illustration",
        generatedAt: "2026-09-28T12:00:00Z",
      },
    },
  };

  // Ensure all 4 layer types coexist in one unified dictionary without collision
  assert.equal(Object.keys(documentElements).length, 4);
  assert.equal(documentElements["el-text-frame"].type, "body");
  assert.equal(documentElements["el-vector-annotation"].type, "vector-curve");
  assert.equal(documentElements["el-pixel-retouch"].type, "pixel-layer");
  assert.equal(documentElements["el-ai-illustration"].type, "ai-vector");

  // Selection model: selection can select across any studio's layer
  const selection = ["el-vector-annotation", "el-pixel-retouch"];
  const selectedLayers = selection.map((id) => documentElements[id]);
  assert.equal(selectedLayers.length, 2);
  assert.equal(selectedLayers[0].displayName, "Mitosis Pointer Arrow");
  assert.equal(selectedLayers[1].displayName, "Retouched Microscope Slide");
});
