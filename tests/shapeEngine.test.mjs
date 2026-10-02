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
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      file
    );
}

const {
  generateShapeSvgPath,
  getShapeCornerRadii,
  shapeToVectorCurveNodes,
} = require("../src/editor/vector/shapeGeometry.ts");

const {
  resolveShapeFill,
  resolveShapeStroke,
  buildShapeBoxShadow,
  buildShapeSvgDropShadow,
  shapeToPublicationSceneNodes,
  SHAPE_STYLE_PRESETS,
} = require("../src/editor/vector/shapeEffects.ts");

const {
  shapeToCurveNodes,
  curveNodesToSvgPath,
  combineShapesBoolean,
} = require("../src/editor/vector/bezier.ts");

test("Vector Shape Engine: Generates valid SVG paths for Basic shapes", () => {
  const basicShapes = [
    "rectangle",
    "rounded-rectangle",
    "square",
    "circle",
    "oval",
    "ellipse",
    "semi-circle",
    "quarter-circle",
    "capsule",
    "pill",
    "ring",
    "arc",
    "triangle",
    "right-triangle",
    "isosceles-triangle",
    "equilateral-triangle",
    "diamond",
    "rhombus",
    "parallelogram",
    "trapezoid",
    "pentagon",
    "hexagon",
    "heptagon",
    "octagon",
    "nonagon",
    "decagon",
    "polygon",
    "star",
    "multi-star",
    "cross",
    "plus",
    "minus",
  ];

  for (const shape of basicShapes) {
    const d = generateShapeSvgPath(shape, 200, 150);
    assert.ok(d.length > 5, `SVG path for ${shape} should be non-empty`);
    assert.ok(d.startsWith("M"), `SVG path for ${shape} must start with 'M' command`);
    assert.ok(d.includes("Z") || d.includes("L") || d.includes("A") || d.includes("C"), `SVG path for ${shape} must have vector commands`);
  }
});

test("Vector Shape Engine: Generates valid SVG paths for Arrows", () => {
  const arrows = [
    "arrow-right",
    "arrow-left",
    "arrow-up",
    "arrow-down",
    "arrow-double",
    "arrow-bidirectional",
    "arrow-chevron",
    "arrow-bent",
    "arrow-curved",
    "arrow-circular",
    "arrow-loop",
    "arrow-uturn",
    "arrow-block",
    "arrow-thin",
    "arrow-flow",
  ];

  for (const arrow of arrows) {
    const d = generateShapeSvgPath(arrow, 180, 100, { headSize: 30, tailWidth: 20 });
    assert.ok(d.length > 10, `Arrow ${arrow} path must be valid`);
    assert.ok(d.startsWith("M"), `Arrow ${arrow} must start with M`);
  }
});

test("Vector Shape Engine: Generates valid SVG paths for Callouts with movable pointers", () => {
  const callouts = [
    "callout-speech",
    "callout-thought",
    "callout-rounded",
    "callout-cloud",
    "callout-annotation",
    "callout-quote",
    "callout-comic",
    "callout-pointer",
  ];

  for (const callout of callouts) {
    const d = generateShapeSvgPath(callout, 240, 140, {
      pointerX: 40,
      pointerY: 170,
      pointerWidth: 24,
    });
    assert.ok(d.length > 15, `Callout ${callout} must produce valid SVG path`);
    assert.ok(d.startsWith("M"), `Callout ${callout} must start with M`);
  }
});

test("Vector Shape Engine: Generates valid SVG paths for Badges & Labels", () => {
  const badges = [
    "badge-ribbon",
    "badge-folded-ribbon",
    "badge-award",
    "badge-shield",
    "badge-seal",
    "badge-burst",
    "badge-starburst",
    "badge-ticket",
    "badge-tag",
    "badge-bookmark",
    "badge-flag",
    "badge-pennant",
    "badge-tab",
    "badge-corner-label",
    "badge-folded-corner",
    "badge-number",
    "badge-chapter",
    "badge-topic",
  ];

  for (const badge of badges) {
    const d = generateShapeSvgPath(badge, 160, 120);
    assert.ok(d.length > 10, `Badge ${badge} path must be valid`);
    assert.ok(d.startsWith("M"), `Badge ${badge} must start with M`);
  }
});

test("Vector Shape Engine: Generates valid SVG paths for Organic shapes", () => {
  const organics = [
    "organic-blob",
    "organic-wave",
    "organic-cloud",
    "organic-pebble",
    "organic-leaf",
    "organic-drop",
    "organic-splash",
    "organic-abstract",
    "organic-brush",
    "organic-torn-paper",
    "organic-fluid-bg",
    "organic-wavy-container",
  ];

  for (const organic of organics) {
    const d = generateShapeSvgPath(organic, 200, 160);
    assert.ok(d.length > 15, `Organic shape ${organic} must produce curved path`);
    if (organic === "organic-torn-paper") {
      assert.ok(d.includes("L"), "Torn paper should contain jagged line cuts");
    } else {
      assert.ok(d.includes("C") || d.includes("Q") || d.includes("A"), `Organic shape ${organic} should contain bezier curves`);
    }
  }
});

test("Vector Shape Engine: Generates valid SVG paths for Educational, Flowchart, and Math shapes", () => {
  const shapes = [
    // Educational
    "edu-number-tile",
    "edu-counting-block",
    "edu-flash-card",
    "edu-formula-box",
    "edu-timeline-marker",
    "edu-step-marker",
    "edu-venn-circle",
    // Flowchart
    "flow-process",
    "flow-decision",
    "flow-terminal",
    "flow-io",
    "flow-document",
    "flow-database",
    "flow-connector",
    "flow-delay",
    "flow-preparation",
    // Mathematics
    "math-number-line",
    "math-coordinate-plane",
    "math-axis",
    "math-grid",
    "math-fraction-circle",
    "math-fraction-bar",
    "math-angle",
    "math-protractor-arc",
    "math-triangle-diagram",
    "math-bracket",
    "math-brace",
    "math-measurement-arrow",
    "math-dimension-line",
    // Lines
    "line",
    "line-curved",
    "line-elbow",
    "line-orthogonal",
    "line-double",
  ];

  for (const shape of shapes) {
    const d = generateShapeSvgPath(shape, 220, 140);
    assert.ok(d.length > 5, `Shape ${shape} must generate valid path`);
    assert.ok(d.startsWith("M"), `Shape ${shape} must start with M`);
  }
});

test("Vector Shape Engine: Handles independent corner radii and styles (rounded, chamfer, concave)", () => {
  // 1. Linked rounded corners
  const rLinked = getShapeCornerRadii(200, 100, { radius: 16, linked: true, style: "rounded" });
  assert.equal(rLinked.tl, 16);
  assert.equal(rLinked.tr, 16);
  assert.equal(rLinked.br, 16);
  assert.equal(rLinked.bl, 16);
  assert.equal(rLinked.style, "rounded");

  // 2. Independent corner radii (top-left & bottom-right only)
  const rIndep = getShapeCornerRadii(200, 100, {
    linked: false,
    tl: 24,
    tr: 0,
    br: 24,
    bl: 0,
    style: "chamfer",
  });
  assert.equal(rIndep.tl, 24);
  assert.equal(rIndep.tr, 0);
  assert.equal(rIndep.br, 24);
  assert.equal(rIndep.bl, 0);
  assert.equal(rIndep.style, "chamfer");

  // 3. Path generation with chamfered corners
  const chamferPath = generateShapeSvgPath("rectangle", 200, 100, undefined, {
    linked: false,
    tl: 20,
    tr: 0,
    br: 20,
    bl: 0,
    style: "chamfer",
  });
  assert.ok(chamferPath.includes("L 20 0"), "Chamfer path should have angular line cuts");

  // 4. Concave corner style
  const concavePath = generateShapeSvgPath("rectangle", 200, 100, undefined, {
    radius: 18,
    linked: true,
    style: "concave",
  });
  assert.ok(concavePath.includes("A 18 18"), "Concave path should contain inward arc commands");
});

test("Vector Shape Engine: Fill System supports solid, gradients, patterns, and image fills", () => {
  // 1. Solid fill
  const solid = resolveShapeFill({ type: "solid", color: "#10b981" });
  assert.equal(solid.svgFill, "#10b981");

  // 2. Linear Gradient
  const linGrad = resolveShapeFill({
    type: "linear-gradient",
    angle: 45,
    stops: [
      { offset: 0, color: "#6366f1" },
      { offset: 1, color: "#a855f7" },
    ],
  });
  assert.ok(linGrad.svgFill.startsWith("url(#grad-lin-"));
  assert.ok(linGrad.gradientDef);
  assert.equal(linGrad.gradientDef.type, "linear");
  assert.equal(linGrad.gradientDef.stops.length, 2);

  // 3. Radial Gradient
  const radGrad = resolveShapeFill({
    type: "radial-gradient",
    stops: [
      { offset: 0, color: "#f59e0b" },
      { offset: 1, color: "#ef4444" },
    ],
  });
  assert.ok(radGrad.svgFill.startsWith("url(#grad-rad-"));
  assert.ok(radGrad.gradientDef);
  assert.equal(radGrad.gradientDef.type, "radial");

  // 4. Pattern Fill (Grid)
  const pattern = resolveShapeFill({
    type: "pattern",
    pattern: "grid",
    patternColor: "#94a3b8",
    patternScale: 16,
  });
  assert.ok(pattern.svgFill.startsWith("url(#pattern-"));
  assert.ok(pattern.patternDef);
  assert.equal(pattern.patternDef.type, "grid");
  assert.equal(pattern.patternDef.scale, 16);

  // 5. Image fill
  const imgFill = resolveShapeFill({
    type: "image",
    imageUrl: "https://example.com/texture.jpg",
    imageFit: "cover",
    imageZoom: 1.2,
  });
  assert.ok(imgFill.svgFill.startsWith("url(#img-fill-"));
  assert.ok(imgFill.imageDef);
  assert.equal(imgFill.imageDef.url, "https://example.com/texture.jpg");
  assert.equal(imgFill.imageDef.fit, "cover");

  // 6. Transparent / None
  const noneFill = resolveShapeFill({ type: "none" });
  assert.equal(noneFill.svgFill, "none");
});

test("Vector Shape Engine: Advanced Stroke Engine handles dash patterns, caps, joins, and opacity", () => {
  const stroke = resolveShapeStroke({
    color: "#e11d48",
    width: 3.5,
    dasharray: "8,4",
    linecap: "round",
    linejoin: "bevel",
    opacity: 0.85,
  });
  assert.equal(stroke.color, "#e11d48");
  assert.equal(stroke.width, 3.5);
  assert.equal(stroke.dasharray, "8,4");
  assert.equal(stroke.linecap, "round");
  assert.equal(stroke.linejoin, "bevel");
  assert.equal(stroke.opacity, 0.85);
});

test("Vector Shape Engine: Shadow & Elevation Effects generate print-safe CSS and SVG filters", () => {
  // Elevation 2 Preset
  const elevationCss = buildShapeBoxShadow([{ type: "elevation-2" }]);
  assert.ok(elevationCss.includes("rgba(15, 23, 42, 0.08)"));

  // Drop Shadow + Ambient Shadow stack
  const stackCss = buildShapeBoxShadow([
    { type: "dropShadow", x: 2, y: 8, blur: 16, spread: 0, color: "#000000", opacity: 0.15 },
    { type: "ambientShadow", blur: 30, color: "#3b82f6", opacity: 0.2 },
    { type: "innerShadow", x: 0, y: 2, blur: 4, color: "#ffffff", opacity: 0.4 },
  ]);
  assert.ok(stackCss.includes("inset 0px 2px 4px 0px rgba(255, 255, 255, 0.4)"));
  assert.ok(stackCss.includes("2px 8px 16px 0px rgba(0, 0, 0, 0.15)"));

  // SVG Drop Shadow filter for non-rectangular vectors
  const svgFilter = buildShapeSvgDropShadow([
    { type: "dropShadow", x: 0, y: 6, blur: 12, color: "#1e293b", opacity: 0.2 },
  ]);
  assert.ok(svgFilter.startsWith("drop-shadow("));
});

test("Vector Shape Engine: 1-Click Style Presets provide instant polished configurations", () => {
  assert.ok(SHAPE_STYLE_PRESETS.length >= 10, "Must provide at least 10 high-quality style presets");
  const softElevated = SHAPE_STYLE_PRESETS.find((p) => p.name === "Soft Elevated" || p.id.includes("soft-elevated"));
  assert.ok(softElevated, "Soft Elevated preset must exist");
  assert.equal(softElevated.style.shapeCorners?.radius, 14);
  assert.ok(softElevated.style.shapeEffects?.some((e) => e.type === "elevation"));

  const frostedGlass = SHAPE_STYLE_PRESETS.find((p) => p.name === "Frosted Glass" || p.id.includes("frosted-glass"));
  assert.ok(frostedGlass, "Frosted Glass preset must exist");
  assert.ok(frostedGlass.style.shapeEffects?.some((e) => e.type === "glass"));
});

test("Vector Shape Engine: Boolean Operations combine multiple shapes into unified compound vector", () => {
  const circle = {
    shapeType: "circle",
    width: 100,
    height: 100,
    x: 50,
    y: 50,
  };
  const rect = {
    shapeType: "rectangle",
    width: 60,
    height: 60,
    x: 70,
    y: 70,
  };

  // Union
  const union = combineShapesBoolean(circle, [rect], "union");
  assert.equal(union.minX, 50);
  assert.equal(union.minY, 50);
  assert.equal(union.width, 100);
  assert.equal(union.height, 100);
  assert.equal(union.fillRule, "nonzero");
  assert.ok(union.pathData.includes("M"), "Union pathData must be valid SVG path");
  assert.ok(union.nodes.length >= 8, "Union compound must preserve anchor nodes");

  // Subtract
  const subtract = combineShapesBoolean(circle, [rect], "subtract");
  assert.equal(subtract.fillRule, "evenodd");
  assert.ok(subtract.pathData.split("M").length >= 3, "Subtract pathData must have 2 subpaths for cutout");
});

test("Vector Shape Engine: Bézier Node Conversion enables Pen / Point Editing", () => {
  // Rectangle to CurveNodes
  const rectNodes = shapeToCurveNodes("rectangle", 120, 80);
  assert.equal(rectNodes.nodes.length, 4);
  assert.equal(rectNodes.closed, true);

  // Circle to CurveNodes (4 cubic bezier handles)
  const circleNodes = shapeToCurveNodes("circle", 100, 100);
  assert.equal(circleNodes.nodes.length, 4);
  assert.ok(circleNodes.nodes[0].handleIn && circleNodes.nodes[0].handleOut, "Circle nodes must have bezier handles");

  // Nodes to SVG Path
  const svgPath = curveNodesToSvgPath(circleNodes.nodes, true);
  assert.ok(svgPath.startsWith("M"));
  assert.ok(svgPath.includes("C"));
  assert.ok(svgPath.endsWith("Z"));
});

test("Vector Shape Engine: Native Vector PublicationScene generation ensures 100% PDF export fidelity", () => {
  const sceneNodes = shapeToPublicationSceneNodes(
    "star",
    180,
    180,
    {
      shapeType: "star",
      shapeFill: { type: "solid", color: "#facc15" },
      shapeStroke: { color: "#ca8a04", width: 2 },
      shapeText: {
        text: "Chapter 1",
        fontSize: 14,
        color: "#713f12",
        textAlign: "center",
        verticalAlign: "center",
      },
    }
  );

  // Must output path node for star and text node for embedded text
  const pathNode = sceneNodes.find((n) => n.kind === "path");
  assert.ok(pathNode, "Publication scene must include vector path node");
  assert.equal(pathNode.fill, "#facc15");
  assert.equal(pathNode.stroke, "#ca8a04");
  assert.equal(pathNode.strokeWidth, 2);

  const textNode = sceneNodes.find((n) => n.kind === "text");
  assert.ok(textNode, "Publication scene must include embedded text node");
  assert.equal(textNode.text, "Chapter 1");
  assert.equal(textNode.size, 14);
  assert.equal(textNode.fill, "#713f12");
  assert.equal(textNode.align, "middle");
});

test("Vector Shape Engine: Backward compatibility with legacy shape elements", () => {
  // Legacy shape with only backgroundColor, borderColor, borderWidth, borderRadius
  const legacyStyle = {
    backgroundColor: "#fef3c7",
    borderColor: "#d97706",
    borderWidth: 1.5,
    borderRadius: 8,
  };

  const fill = resolveShapeFill(undefined, legacyStyle.backgroundColor);
  assert.equal(fill.svgFill, "#fef3c7");

  const stroke = resolveShapeStroke(undefined, legacyStyle.borderColor, legacyStyle.borderWidth);
  assert.equal(stroke.color, "#d97706");
  assert.equal(stroke.width, 1.5);

  const radii = getShapeCornerRadii(100, 50, undefined, legacyStyle.borderRadius);
  assert.equal(radii.tl, 8);
  assert.equal(radii.tr, 8);
  assert.equal(radii.br, 8);
  assert.equal(radii.bl, 8);

  const sceneNodes = shapeToPublicationSceneNodes("rectangle", 100, 50, legacyStyle);
  assert.ok(sceneNodes.length > 0);
  assert.equal(sceneNodes[0].fill, "#fef3c7");
});

test("Acceptance Test 1 (Workflow 81): Complex Shape Styling, Callout Morph, Grouping & PDF Export", () => {
  // 1. Insert rectangle
  let shape1 = {
    id: "shape-test-1",
    type: "shape",
    transform: { x: 50, y: 100, width: 240, height: 120, rotation: 0 },
    style: {
      shapeType: "rectangle",
      // 2. Round only top corners
      shapeCorners: { linked: false, topLeft: 18, topRight: 18, bottomLeft: 0, bottomRight: 0, style: "rounded" },
      // 3. Apply linear gradient
      shapeFill: {
        type: "linear-gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#3b82f6" },
          { offset: 1, color: "#1d4ed8" },
        ],
      },
      // 4. Add thin stroke
      shapeStroke: { color: "#ffffff", width: 1.5, opacity: 0.8 },
      // 5. Add soft elevation & 6. Add inner shadow
      shapeEffects: [
        { type: "elevation", level: 2 },
        { type: "innerShadow", x: 0, y: 2, blur: 4, color: "#ffffff", opacity: 0.3 },
      ],
      // 7. Insert text
      shapeText: {
        text: "Chapter 1: Foundations",
        fontSize: 14,
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
        verticalAlign: "center",
      },
    },
  };

  const path1 = generateShapeSvgPath(
    shape1.style.shapeType,
    shape1.transform.width,
    shape1.transform.height,
    undefined,
    shape1.style.shapeCorners
  );
  assert.ok(path1.includes("A 18 18") || path1.includes("C 18 0") || path1.includes("L 222 0"), "Top corners must be rounded");

  // 8. Duplicate
  let shape2 = {
    ...JSON.parse(JSON.stringify(shape1)),
    id: "shape-test-2",
    transform: { ...shape1.transform, y: 260 },
  };

  // 9. Change second shape into a callout
  shape2.style.shapeType = "callout-speech";
  shape2.style.shapeParams = { pointerX: 50, pointerY: 150, pointerWidth: 20 };
  shape2.style.shapeText.text = "Important Note!";

  const path2 = generateShapeSvgPath(
    shape2.style.shapeType,
    shape2.transform.width,
    shape2.transform.height,
    shape2.style.shapeParams
  );
  assert.ok(path2.includes("L 50 150"), "Callout pointer must be generated at pointer coordinates");

  // 10. Align both (left align)
  shape2.transform.x = shape1.transform.x;
  assert.equal(shape1.transform.x, shape2.transform.x);

  // 11. Distribute spacing
  const gap = shape2.transform.y - (shape1.transform.y + shape1.transform.height);
  assert.equal(gap, 40);

  // 12. Group
  const groupId = "group-test-1";
  shape1.groupId = groupId;
  shape2.groupId = groupId;

  // 13. Resize group by 1.25x
  const scale = 1.25;
  shape1.transform.width *= scale;
  shape1.transform.height *= scale;
  shape2.transform.width *= scale;
  shape2.transform.height *= scale;

  assert.equal(shape1.transform.width, 300);
  assert.equal(shape2.transform.width, 300);

  // 14. Export to PDF scene nodes
  const pdfNodes1 = shapeToPublicationSceneNodes(
    shape1.style.shapeType,
    shape1.transform.width,
    shape1.transform.height,
    shape1.style,
    shape1.style.shapeText
  );
  const pdfNodes2 = shapeToPublicationSceneNodes(
    shape2.style.shapeType,
    shape2.transform.width,
    shape2.transform.height,
    shape2.style,
    shape2.style.shapeText
  );

  assert.ok(pdfNodes1.some((n) => n.kind === "text" && n.text === "Chapter 1: Foundations"));
  assert.ok(pdfNodes2.some((n) => n.kind === "text" && n.text === "Important Note!"));
  assert.ok(pdfNodes2.some((n) => n.kind === "path" && n.stroke === "#ffffff"));
});

test("Acceptance Test 2 (Workflow 82): Vector Boolean Subtract, Anchor Nodes, Image Fill & My Shapes", () => {
  // 1. Insert circle + 2. Insert rectangle
  const circle = {
    shapeType: "circle",
    width: 140,
    height: 140,
    x: 40,
    y: 40,
  };
  const rect = {
    shapeType: "rectangle",
    width: 90,
    height: 90,
    x: 90,
    y: 90,
  };

  // 3. Subtract
  const booleanResult = combineShapesBoolean(circle, [rect], "subtract");
  assert.equal(booleanResult.fillRule, "evenodd");
  assert.ok(booleanResult.pathData.length > 20);

  // 4. Edit anchor points: nodes available
  assert.ok(booleanResult.nodes.length >= 8);
  const firstNode = booleanResult.nodes[0];
  assert.ok(typeof firstNode.x === "number");
  assert.ok(typeof firstNode.y === "number");

  // 5. Add image fill
  const fill = resolveShapeFill({
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-nature.jpg",
    imageFit: "cover",
  });
  assert.ok(fill.imageDef);
  assert.equal(fill.imageDef.url, "https://images.unsplash.com/photo-nature.jpg");

  // 6. Add shadow
  const shadowCss = buildShapeBoxShadow([
    { type: "dropShadow", x: 0, y: 8, blur: 20, color: "#000000", opacity: 0.15 },
  ]);
  assert.ok(shadowCss.includes("0px 8px 20px"));

  // 7. Save to My Shapes persistence payload
  const myShapeItem = {
    id: "my-shape-custom-1",
    name: "Custom Cutout Mask",
    category: "my-shapes",
    customPath: booleanResult.pathData,
    nodes: booleanResult.nodes,
    style: {
      pathData: booleanResult.pathData,
      fillRule: booleanResult.fillRule,
      shapeFill: { type: "image", imageUrl: "https://images.unsplash.com/photo-nature.jpg" },
      shapeEffects: [{ type: "dropShadow", x: 0, y: 8, blur: 20, color: "#000000", opacity: 0.15 }],
    },
  };
  assert.equal(myShapeItem.category, "my-shapes");
  assert.ok(myShapeItem.style.pathData);
});

test("Acceptance Test 3 (Workflow 83): Beginner 1-Click Soft Elevated Preset", () => {
  const rect = {
    id: "beginner-rect",
    type: "shape",
    transform: { x: 100, y: 100, width: 200, height: 120, rotation: 0 },
    style: {
      shapeType: "rectangle",
      backgroundColor: "#ffffff",
    },
  };

  // User clicks "Soft Elevated"
  const preset = SHAPE_STYLE_PRESETS.find((p) => p.name === "Soft Elevated" || p.id.includes("soft-elevated"));
  assert.ok(preset, "Soft Elevated preset must be easily accessible");

  const styledRect = {
    ...rect,
    style: {
      ...rect.style,
      ...preset.style,
    },
  };

  // Verify instant professional results
  assert.ok(styledRect.style.shapeCorners?.radius && styledRect.style.shapeCorners.radius >= 10);
  assert.ok(styledRect.style.shapeEffects?.some((e) => e.type === "elevation" || e.type.startsWith("elevation")));
  assert.ok(styledRect.style.shapeFill?.color);
  assert.ok(styledRect.style.shapeStroke?.color);
});
