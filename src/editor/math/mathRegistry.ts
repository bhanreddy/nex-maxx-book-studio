// ============================================================================
// NEX MAXX BOOK STUDIO - MATH TEMPLATE REGISTRY
// Centralized, scalable registry for all mathematics templates across Classes 1 to 5
// ============================================================================

import {
  MathTemplate,
  MathGrade,
  CustomMathTemplateEntry,
} from "./types";

// Import all dedicated renderers
import {
  PlaceValueTableRenderer,
  ExpandedFormRenderer,
  NumberNameRenderer,
  NumberDiscsRenderer,
  Base10BlocksRenderer,
  NumberComparisonRenderer,
  BeforeAfterRenderer,
  SkipCountingRenderer,
} from "./renderers/PlaceValueRenderers";

import { AbacusRenderer } from "./renderers/AbacusRenderer";
import { NumberLineRenderer } from "./renderers/NumberLineRenderer";
import {
  ColumnAdditionRenderer,
  ColumnSubtractionRenderer,
  MultiplicationArrayRenderer,
  FactFamilyRenderer,
  LongDivisionRenderer,
} from "./renderers/ArithmeticRenderers";

import {
  FractionCircleRenderer,
  FractionBarRenderer,
  FractionWallRenderer,
  EquivalentFractionsRenderer,
} from "./renderers/FractionRenderers";

import {
  Shape2DRenderer,
  Shape3DRenderer,
  SymmetryRenderer,
  AnglesRenderer,
} from "./renderers/GeometryRenderers";

import {
  RulerRenderer,
  BalanceScaleRenderer,
  CapacityBeakerRenderer,
} from "./renderers/MeasurementRenderers";

import { AnalogueClockRenderer } from "./renderers/TimeRenderers";
import {
  IndianCurrencyRenderer,
  ShoppingBillRenderer,
} from "./renderers/MoneyRenderers";

import {
  TallyChartRenderer,
  PictographRenderer,
  BarGraphRenderer,
} from "./renderers/DataRenderers";

import {
  PatternSequenceRenderer,
  FunctionMachineRenderer,
  MatchingExerciseRenderer,
} from "./renderers/PatternsAndMatchingRenderers";

import {
  NumberBondRenderer,
  BarModelRenderer,
  NumberPyramidRenderer,
  WorkedExampleRenderer,
  WordProblemRenderer,
  MathActivityCardRenderer,
} from "./renderers/ThinkingAndWorkedExampleRenderers";
import { WORD_PROBLEM_DEFAULTS, wordProblemLayout } from "./wordProblemLayout";

import {
  DecimalPlaceValueRenderer,
  DecimalGridRenderer,
  FractionDecimalConverterRenderer,
  DecimalComparisonRenderer,
  DecimalColumnArithmeticRenderer,
} from "./renderers/DecimalRenderers";

import {
  DigitPlaceValueDiagramRenderer,
  PlaceValueHousesRenderer,
  DigitCardsRenderer,
  AscendingDescendingRenderer,
  OddEvenModelRenderer,
} from "./renderers/AdvancedPlaceValueRenderers";

import {
  MultiplicationWheelRenderer,
  RepeatedAdditionMultiplicationRenderer,
  EqualSharingDivisionRenderer,
} from "./renderers/AdvancedOperationRenderers";

import {
  TapeDiagramRenderer,
  MagicSquareRenderer,
  BalanceEquationRenderer,
  FillInTheBlanksRenderer,
  ChooseCorrectAnswerRenderer,
} from "./renderers/AdvancedThinkingRenderers";

export { insertMathComponent, detachMathComponentToElements } from "./mathActions";

import { PRIMARY_MATH_TEMPLATES } from "./primaryMathTemplates";
import { CATALOGUE_TEMPLATES } from "./templates";
import { READY_MADE_MATH_TEMPLATES } from "./templates/worksheetTemplates";
import { REFERENCE_BLOCK_TEMPLATES } from "./templates/referenceBlocks";

// In-memory registry map
const REGISTRY: Record<string, MathTemplate> = {};

export function registerMathTemplate(template: MathTemplate) {
  if ((!template.propSchema || template.propSchema.length === 0) && template.configFields && template.configFields.length > 0) {
    template.propSchema = template.configFields;
  }
  if (!template.propSchema || template.propSchema.length === 0) {
    template.propSchema = Object.keys(template.defaultData || {}).map((k) => ({
      key: k,
      label: k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
      type: (typeof template.defaultData[k] === "number"
        ? "number"
        : typeof template.defaultData[k] === "boolean"
        ? "boolean"
        : "text") as "number" | "boolean" | "text",
      defaultValue: template.defaultData[k],
    }));
    if (template.propSchema.length === 0) {
      template.propSchema = [{ key: "showLabels", label: "Show Labels", type: "boolean", defaultValue: true }];
    }
  }
  if (!template.configFields || template.configFields.length === 0) {
    template.configFields = template.propSchema;
  }
  if (!template.a11yDescription) {
    template.a11yDescription = `${template.name} mathematical visual model for ${template.category}`;
  }
  REGISTRY[template.id] = template;
}

export function getMathTemplate(id: string): MathTemplate | undefined {
  return REGISTRY[id];
}

export function getAllMathTemplates(): MathTemplate[] {
  return Object.values(REGISTRY);
}

// ----------------------------------------------------------------------------
// Local Storage Persistence for Favourites, Recents, and Custom Templates
// ----------------------------------------------------------------------------
const FAV_KEY = "nexmaxx-math-favourites";
const RECENT_KEY = "nexmaxx-math-recent";
const CUSTOM_KEY = "nexmaxx-math-custom";

export function getFavoriteMathIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleFavoriteMathId(id: string): string[] {
  const current = getFavoriteMathIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function getRecentMathIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function recordRecentMathId(id: string): string[] {
  const current = getRecentMathIds().filter((x) => x !== id);
  const next = [id, ...current].slice(0, 15);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function getCustomMathTemplates(): CustomMathTemplateEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustomMathTemplate(entry: CustomMathTemplateEntry) {
  const current = getCustomMathTemplates();
  const next = [entry, ...current.filter((x) => x.id !== entry.id)];
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("nexmaxx-math-custom-changed"));
  } catch {}
}

// ----------------------------------------------------------------------------
// Built-in Registrations: Core Production Templates
// ----------------------------------------------------------------------------

// 1. Indian Place Value Table
registerMathTemplate({
  id: "math-place-value-indian",
  name: "Indian Place Value Table",
  category: "place-value",
  subcategory: "Tables & Charts",
  grades: [2, 3, 4, 5],
  type: "table",
  tags: ["place value", "indian system", "lakhs", "thousands", "digits", "numbers", "table"],
  defaultWidth: 320,
  defaultHeight: 95,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: PlaceValueTableRenderer,
  defaultData: {
    number: 872904,
    system: "indian",
    showPeriods: true,
    showValueRow: true,
    showPlaceNames: true,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 872904 },
    { key: "system", label: "System", type: "select", defaultValue: "indian", options: [{ label: "Indian (Lakhs)", value: "indian" }, { label: "International (Millions)", value: "international" }] },
    { key: "showPeriods", label: "Show Periods Row", type: "boolean", defaultValue: true },
    { key: "showValueRow", label: "Show Values Row", type: "boolean", defaultValue: true },
  ],
});

// 2. International Place Value Table
registerMathTemplate({
  id: "math-place-value-international",
  name: "International Place Value Table",
  category: "place-value",
  subcategory: "Tables & Charts",
  grades: [4, 5],
  type: "table",
  tags: ["place value", "international system", "millions", "thousands", "digits", "table"],
  defaultWidth: 320,
  defaultHeight: 95,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: PlaceValueTableRenderer,
  defaultData: {
    number: 5432619,
    system: "international",
    showPeriods: true,
    showValueRow: true,
    showPlaceNames: true,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 5432619 },
    { key: "system", label: "System", type: "select", defaultValue: "international", options: [{ label: "International", value: "international" }] },
    { key: "showPeriods", label: "Show Periods Row", type: "boolean", defaultValue: true },
  ],
});

// 3. Expanded Form Builder
registerMathTemplate({
  id: "math-expanded-form",
  name: "Expanded Form Builder",
  category: "place-value",
  subcategory: "Decomposition",
  grades: [2, 3, 4, 5],
  type: "visual-model",
  tags: ["expanded form", "place value", "addition", "decomposition", "standard form"],
  defaultWidth: 290,
  defaultHeight: 65,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: ExpandedFormRenderer,
  defaultData: {
    number: 54326,
    system: "indian",
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 54326 },
  ],
});

// 4. Number Name Builder
registerMathTemplate({
  id: "math-number-name",
  name: "Number in Words Builder",
  category: "numbers",
  subcategory: "Names",
  grades: [1, 2, 3, 4, 5],
  type: "visual-model",
  tags: ["number names", "words", "spelling", "numeral"],
  defaultWidth: 270,
  defaultHeight: 80,
  styleVariants: ["clean", "visual"],
  renderer: NumberNameRenderer,
  defaultData: {
    number: 742510,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 742510 },
  ],
});

// 5. Abacus Representation
registerMathTemplate({
  id: "math-abacus",
  name: "Mathematical Abacus (Configurable Rods)",
  category: "place-value",
  subcategory: "Visual Models",
  grades: [1, 2, 3, 4, 5],
  type: "interactive",
  tags: ["abacus", "beads", "rods", "counting", "place value", "visual"],
  defaultWidth: 380,
  defaultHeight: 160,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: AbacusRenderer,
  defaultData: {
    number: 98765,
    rods: ["TTh", "Th", "H", "T", "O"],
    showLabels: true,
    showValues: true,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 98765 },
    { key: "showLabels", label: "Show Rod Labels", type: "boolean", defaultValue: true },
    { key: "showValues", label: "Show Number Badge", type: "boolean", defaultValue: true },
  ],
});

// 6. Number Discs Representation
registerMathTemplate({
  id: "math-number-discs",
  name: "Number Discs Model",
  category: "place-value",
  subcategory: "Counters",
  grades: [2, 3, 4],
  type: "visual-model",
  tags: ["number discs", "tokens", "place value", "counters"],
  defaultWidth: 270,
  defaultHeight: 85,
  styleVariants: ["clean", "color-coded"],
  renderer: NumberDiscsRenderer,
  defaultData: {
    number: 3425,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 3425 },
  ],
});

// 7. Base-10 Blocks Model
registerMathTemplate({
  id: "math-base-10-blocks",
  name: "Base-10 Blocks (Th, H, T, O)",
  category: "place-value",
  subcategory: "Visual Models",
  grades: [1, 2, 3],
  type: "visual-model",
  tags: ["base 10", "blocks", "cubes", "flats", "rods", "units"],
  defaultWidth: 270,
  defaultHeight: 100,
  styleVariants: ["clean", "visual"],
  renderer: Base10BlocksRenderer,
  defaultData: {
    number: 2435,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 2435 },
  ],
});

// 8. Number Line Engine
registerMathTemplate({
  id: "math-number-line",
  name: "Vector Number Line Generator",
  category: "numbers",
  subcategory: "Lines & Scales",
  grades: [1, 2, 3, 4, 5],
  type: "diagram",
  tags: ["number line", "jumps", "skip counting", "integers", "scale"],
  defaultWidth: 320,
  defaultHeight: 80,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: NumberLineRenderer,
  defaultData: {
    title: "Basic Number Line",
    start: 0,
    end: 10,
    step: 1,
    subType: "basic",
    highlightedPoints: [3, 7],
    jumps: [
      { from: 0, to: 3, label: "+3" },
      { from: 3, to: 7, label: "+4" },
    ],
  },
  configFields: [
    { key: "start", label: "Start Value", type: "number", defaultValue: 0 },
    { key: "end", label: "End Value", type: "number", defaultValue: 10 },
    { key: "step", label: "Interval / Step", type: "number", defaultValue: 1 },
  ],
});

// 9. Number Comparison
registerMathTemplate({
  id: "math-number-comparison",
  name: "Number Comparison (<, >, =)",
  category: "numbers",
  subcategory: "Comparison",
  grades: [1, 2, 3, 4],
  type: "practice",
  tags: ["comparison", "greater than", "less than", "equal", "order"],
  defaultWidth: 260,
  defaultHeight: 70,
  styleVariants: ["clean", "color-coded"],
  renderer: NumberComparisonRenderer,
  defaultData: {
    num1: 45620,
    num2: 45260,
  },
  configFields: [
    { key: "num1", label: "Left Number", type: "number", defaultValue: 45620 },
    { key: "num2", label: "Right Number", type: "number", defaultValue: 45260 },
  ],
});

// 10. Before / After / Between
registerMathTemplate({
  id: "math-before-after",
  name: "Before / After / Between",
  category: "numbers",
  subcategory: "Sequences",
  grades: [1, 2, 3],
  type: "practice",
  tags: ["before after", "predecessor", "successor", "sequence"],
  defaultWidth: 240,
  defaultHeight: 65,
  styleVariants: ["clean", "visual"],
  renderer: BeforeAfterRenderer,
  defaultData: {
    number: 8450,
  },
  configFields: [
    { key: "number", label: "Central Number", type: "number", defaultValue: 8450 },
  ],
});

// 11. Skip Counting Model
registerMathTemplate({
  id: "math-skip-counting",
  name: "Skip Counting Sequence",
  category: "patterns",
  subcategory: "Sequences",
  grades: [1, 2, 3],
  type: "practice",
  tags: ["skip counting", "patterns", "multiples", "sequences"],
  defaultWidth: 270,
  defaultHeight: 70,
  styleVariants: ["clean", "visual"],
  renderer: SkipCountingRenderer,
  defaultData: {
    start: 20,
    step: 5,
    count: 5,
  },
  configFields: [
    { key: "start", label: "Start", type: "number", defaultValue: 20 },
    { key: "step", label: "Step Count", type: "number", defaultValue: 5 },
    { key: "count", label: "Items Count", type: "number", defaultValue: 5 },
  ],
});

// 12. Vertical Column Addition with Carry Row
registerMathTemplate({
  id: "math-column-addition",
  name: "Column Addition with Carry Row",
  category: "addition",
  subcategory: "Algorithms",
  grades: [1, 2, 3, 4, 5],
  type: "visual-model",
  tags: ["addition", "column addition", "carry", "regrouping", "sum"],
  defaultWidth: 200,
  defaultHeight: 125,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: ColumnAdditionRenderer,
  defaultData: {
    num1: 3482,
    num2: 1759,
    showCarryRow: true,
    showPlaceHeaders: true,
  },
  configFields: [
    { key: "num1", label: "Top Number", type: "number", defaultValue: 3482 },
    { key: "num2", label: "Bottom Number", type: "number", defaultValue: 1759 },
    { key: "showCarryRow", label: "Show Carry Row", type: "boolean", defaultValue: true },
    { key: "showPlaceHeaders", label: "Show Place Headers", type: "boolean", defaultValue: true },
  ],
});

// 13. Vertical Column Subtraction with Borrow Row
registerMathTemplate({
  id: "math-column-subtraction",
  name: "Column Subtraction with Borrowing",
  category: "subtraction",
  subcategory: "Algorithms",
  grades: [1, 2, 3, 4, 5],
  type: "visual-model",
  tags: ["subtraction", "column subtraction", "borrowing", "regrouping", "difference"],
  defaultWidth: 200,
  defaultHeight: 125,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: ColumnSubtractionRenderer,
  defaultData: {
    num1: 5420,
    num2: 2785,
    showBorrowRow: true,
  },
  configFields: [
    { key: "num1", label: "Top Number (Minuend)", type: "number", defaultValue: 5420 },
    { key: "num2", label: "Bottom Number (Subtrahend)", type: "number", defaultValue: 2785 },
    { key: "showBorrowRow", label: "Show Borrow Row", type: "boolean", defaultValue: true },
  ],
});

// 14. Multiplication Array Model
registerMathTemplate({
  id: "math-multiplication-array",
  name: "Multiplication Array Model",
  category: "multiplication",
  subcategory: "Visual Models",
  grades: [2, 3, 4],
  type: "visual-model",
  tags: ["multiplication", "array", "rows", "columns", "repeated addition"],
  defaultWidth: 240,
  defaultHeight: 125,
  styleVariants: ["clean", "visual"],
  renderer: MultiplicationArrayRenderer,
  defaultData: {
    rows: 4,
    cols: 6,
  },
  configFields: [
    { key: "rows", label: "Rows", type: "number", defaultValue: 4, min: 1, max: 10 },
    { key: "cols", label: "Columns", type: "number", defaultValue: 6, min: 1, max: 12 },
  ],
});

// 15. Fact Family Triangle
registerMathTemplate({
  id: "math-fact-family",
  name: "Fact Family Triangle",
  category: "multiplication",
  subcategory: "Relationships",
  grades: [2, 3, 4],
  type: "diagram",
  tags: ["fact family", "multiplication", "division", "triangle"],
  defaultWidth: 260,
  defaultHeight: 110,
  styleVariants: ["clean", "color-coded"],
  renderer: FactFamilyRenderer,
  defaultData: {
    factor1: 4,
    factor2: 7,
  },
  configFields: [
    { key: "factor1", label: "Factor 1", type: "number", defaultValue: 4 },
    { key: "factor2", label: "Factor 2", type: "number", defaultValue: 7 },
  ],
});

// 16. Long Division Layout
registerMathTemplate({
  id: "math-long-division",
  name: "Long Division Step Layout",
  category: "division",
  subcategory: "Algorithms",
  grades: [3, 4, 5],
  type: "visual-model",
  tags: ["division", "long division", "quotient", "remainder", "divisor", "dividend"],
  defaultWidth: 230,
  defaultHeight: 140,
  styleVariants: ["clean", "visual"],
  renderer: LongDivisionRenderer,
  defaultData: {
    dividend: 384,
    divisor: 6,
  },
  configFields: [
    { key: "dividend", label: "Dividend", type: "number", defaultValue: 384 },
    { key: "divisor", label: "Divisor", type: "number", defaultValue: 6 },
  ],
});

// 17. Fraction Circle (Pie Model)
registerMathTemplate({
  id: "math-fraction-circle",
  name: "Fraction Circle (Pie Slices)",
  category: "fractions",
  subcategory: "Visual Models",
  grades: [2, 3, 4, 5],
  type: "visual-model",
  tags: ["fraction", "fraction circle", "pie", "parts", "numerator", "denominator"],
  defaultWidth: 300,
  defaultHeight: 150,
  styleVariants: ["clean", "color-coded", "visual"],
  renderer: FractionCircleRenderer,
  defaultData: {
    numerator: 3,
    denominator: 8,
    showFractionText: true,
  },
  configFields: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 3, min: 0 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 8, min: 1, max: 24 },
  ],
});

// 18. Fraction Bar (Strip Model)
registerMathTemplate({
  id: "math-fraction-bar",
  name: "Fraction Bar (Segmented Strip)",
  category: "fractions",
  subcategory: "Visual Models",
  grades: [2, 3, 4, 5],
  type: "visual-model",
  tags: ["fraction", "fraction bar", "strip", "length model"],
  defaultWidth: 260,
  defaultHeight: 95,
  styleVariants: ["clean", "color-coded"],
  renderer: FractionBarRenderer,
  defaultData: {
    numerator: 3,
    denominator: 5,
  },
  configFields: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 3 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 5 },
  ],
});

// 19. Fraction Wall (Equivalence)
registerMathTemplate({
  id: "math-fraction-wall",
  name: "Fraction Wall (Equivalence)",
  category: "fractions",
  subcategory: "Charts",
  grades: [3, 4, 5],
  type: "diagram",
  tags: ["fraction wall", "equivalent fractions", "comparison", "halves", "quarters"],
  defaultWidth: 290,
  defaultHeight: 125,
  styleVariants: ["clean", "visual"],
  renderer: FractionWallRenderer,
  defaultData: {},
  configFields: [],
});

// 20. Equivalent Fractions Visualizer
registerMathTemplate({
  id: "math-fraction-equivalent",
  name: "Equivalent Fractions Visualizer",
  category: "fractions",
  subcategory: "Equivalence",
  grades: [3, 4, 5],
  type: "visual-model",
  tags: ["equivalent fractions", "simplifying", "matching"],
  defaultWidth: 260,
  defaultHeight: 115,
  styleVariants: ["clean", "color-coded"],
  renderer: EquivalentFractionsRenderer,
  defaultData: {
    num: 1,
    denom: 2,
  },
  configFields: [
    { key: "num", label: "Base Numerator", type: "number", defaultValue: 1 },
    { key: "denom", label: "Base Denominator", type: "number", defaultValue: 2 },
  ],
});

// 21. 2D Geometry Shape with Labels
registerMathTemplate({
  id: "math-geometry-2d",
  name: "2D Geometric Shape & Dimensions",
  category: "geometry",
  subcategory: "2D Shapes",
  grades: [1, 2, 3, 4, 5],
  type: "diagram",
  tags: ["geometry", "triangle", "rectangle", "shape", "vertices", "sides", "angles"],
  defaultWidth: 240,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: Shape2DRenderer,
  defaultData: {
    shape: "triangle",
    widthLabel: "8 cm",
    heightLabel: "5 cm",
  },
  configFields: [
    { key: "shape", label: "Shape", type: "select", defaultValue: "triangle", options: [{ label: "Triangle", value: "triangle" }, { label: "Rectangle", value: "rectangle" }, { label: "Parallelogram", value: "parallelogram" }, { label: "Hexagon", value: "hexagon" }] },
    { key: "widthLabel", label: "Base/Width Label", type: "text", defaultValue: "8 cm" },
    { key: "heightLabel", label: "Height Label", type: "text", defaultValue: "5 cm" },
  ],
});

// 22. 3D Geometric Shape Isometric
registerMathTemplate({
  id: "math-geometry-3d",
  name: "3D Geometric Solid (Isometric)",
  category: "geometry",
  subcategory: "3D Shapes",
  grades: [2, 3, 4, 5],
  type: "diagram",
  tags: ["3d shape", "cube", "cylinder", "cone", "solid", "isometric"],
  defaultWidth: 230,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: Shape3DRenderer,
  defaultData: {
    shape: "cube",
  },
  configFields: [
    { key: "shape", label: "3D Solid", type: "select", defaultValue: "cube", options: [{ label: "Cube", value: "cube" }, { label: "Cylinder", value: "cylinder" }, { label: "Cone", value: "cone" }] },
  ],
});

// 23. Symmetry Line Model
registerMathTemplate({
  id: "math-symmetry",
  name: "Line of Symmetry & Mirror Reflection",
  category: "geometry",
  subcategory: "Symmetry",
  grades: [2, 3, 4, 5],
  type: "diagram",
  tags: ["symmetry", "line of symmetry", "mirror", "reflection"],
  defaultWidth: 230,
  defaultHeight: 100,
  styleVariants: ["clean", "visual"],
  renderer: SymmetryRenderer,
  defaultData: {},
  configFields: [],
});

// 24. Angles Diagram
registerMathTemplate({
  id: "math-angles",
  name: "Angle Diagram (Acute, Right, Obtuse)",
  category: "geometry",
  subcategory: "Angles",
  grades: [4, 5],
  type: "diagram",
  tags: ["angles", "degrees", "acute", "obtuse", "right angle", "vertex"],
  defaultWidth: 230,
  defaultHeight: 100,
  styleVariants: ["clean", "visual"],
  renderer: AnglesRenderer,
  defaultData: {
    degrees: 60,
    label: "Acute Angle",
  },
  configFields: [
    { key: "degrees", label: "Degrees", type: "number", defaultValue: 60 },
    { key: "label", label: "Label", type: "text", defaultValue: "Acute Angle" },
  ],
});

// 25. Vector Ruler Measurement
registerMathTemplate({
  id: "math-ruler",
  name: "Graduated Metric Ruler (cm & mm)",
  category: "measurement",
  subcategory: "Length",
  grades: [1, 2, 3, 4, 5],
  type: "interactive",
  tags: ["ruler", "measurement", "length", "centimeters", "millimeters", "scale"],
  defaultWidth: 320,
  defaultHeight: 85,
  styleVariants: ["clean", "visual"],
  renderer: RulerRenderer,
  defaultData: {
    lengthCm: 6.4,
    maxCm: 10,
    objectName: "Pencil",
  },
  configFields: [
    { key: "lengthCm", label: "Measured Length (cm)", type: "number", defaultValue: 6.4, step: 0.1 },
    { key: "objectName", label: "Object Name", type: "text", defaultValue: "Pencil" },
  ],
});

// 26. Balance Scale Model
registerMathTemplate({
  id: "math-balance-scale",
  name: "Pan Balance Scale (Mass Comparison)",
  category: "measurement",
  subcategory: "Weight",
  grades: [1, 2, 3, 4],
  type: "visual-model",
  tags: ["balance scale", "weight", "mass", "grams", "kilograms"],
  defaultWidth: 260,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: BalanceScaleRenderer,
  defaultData: {
    leftWeight: "500 g",
    rightWeight: "500 g",
    state: "balanced",
  },
  configFields: [
    { key: "leftWeight", label: "Left Pan Weight", type: "text", defaultValue: "500 g" },
    { key: "rightWeight", label: "Right Pan Weight", type: "text", defaultValue: "500 g" },
    { key: "state", label: "Balance State", type: "select", defaultValue: "balanced", options: [{ label: "Balanced", value: "balanced" }, { label: "Left Heavy", value: "left-heavy" }, { label: "Right Heavy", value: "right-heavy" }] },
  ],
});

// 27. Capacity Beaker / Cylinder
registerMathTemplate({
  id: "math-capacity-beaker",
  name: "Graduated Capacity Beaker (ml & L)",
  category: "measurement",
  subcategory: "Volume",
  grades: [2, 3, 4, 5],
  type: "visual-model",
  tags: ["capacity", "volume", "beaker", "millilitres", "litres"],
  defaultWidth: 200,
  defaultHeight: 125,
  styleVariants: ["clean", "visual"],
  renderer: CapacityBeakerRenderer,
  defaultData: {
    volumeMl: 350,
    maxMl: 500,
  },
  configFields: [
    { key: "volumeMl", label: "Volume (ml)", type: "number", defaultValue: 350, max: 500 },
  ],
});

// 28. Analogue Clock
registerMathTemplate({
  id: "math-clock",
  name: "Configurable Analogue Clock",
  category: "time",
  subcategory: "Clocks",
  grades: [1, 2, 3, 4],
  type: "interactive",
  tags: ["clock", "time", "analogue", "hours", "minutes", "watch"],
  defaultWidth: 210,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: AnalogueClockRenderer,
  defaultData: {
    hours: 3,
    minutes: 15,
    showHands: true,
  },
  configFields: [
    { key: "hours", label: "Hours (1-12)", type: "number", defaultValue: 3, min: 1, max: 12 },
    { key: "minutes", label: "Minutes (0-59)", type: "number", defaultValue: 15, min: 0, max: 59 },
  ],
});

// 29. Indian Currency Notes & Coins
registerMathTemplate({
  id: "math-money-currency",
  name: "Indian Currency Breakdown (₹)",
  category: "money",
  subcategory: "Denominations",
  grades: [1, 2, 3, 4, 5],
  type: "visual-model",
  tags: ["money", "currency", "rupees", "notes", "coins", "rbi"],
  defaultWidth: 270,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: IndianCurrencyRenderer,
  defaultData: {
    amount: 375,
  },
  configFields: [
    { key: "amount", label: "Amount (₹)", type: "number", defaultValue: 375 },
  ],
});

// 30. Shopping Bill / Cash Memo
registerMathTemplate({
  id: "math-shopping-bill",
  name: "Store Bill & Cash Memo",
  category: "money",
  subcategory: "Real World",
  grades: [3, 4, 5],
  type: "table",
  tags: ["shopping", "bill", "cash memo", "total", "money"],
  defaultWidth: 240,
  defaultHeight: 140,
  styleVariants: ["clean", "visual"],
  renderer: ShoppingBillRenderer,
  defaultData: {
    items: [
      { name: "Notebook", qty: 2, rate: 45 },
      { name: "Geometry Box", qty: 1, rate: 80 },
      { name: "Pencil Pack", qty: 3, rate: 20 },
    ],
  },
  configFields: [],
});

// 31. Tally Chart & Frequency
registerMathTemplate({
  id: "math-tally-chart",
  name: "Tally Chart & Frequency Table",
  category: "data",
  subcategory: "Tables",
  grades: [2, 3, 4, 5],
  type: "table",
  tags: ["tally marks", "frequency", "data", "survey", "table"],
  defaultWidth: 260,
  defaultHeight: 125,
  styleVariants: ["clean", "visual"],
  renderer: TallyChartRenderer,
  defaultData: {
    items: [
      { label: "Red", count: 8 },
      { label: "Blue", count: 12 },
      { label: "Green", count: 5 },
      { label: "Yellow", count: 7 },
    ],
  },
  configFields: [],
});

// 32. Pictograph
registerMathTemplate({
  id: "math-pictograph",
  name: "Pictograph (Key & Counters)",
  category: "data",
  subcategory: "Charts",
  grades: [2, 3, 4],
  type: "visual-model",
  tags: ["pictograph", "picture graph", "data", "key"],
  defaultWidth: 260,
  defaultHeight: 115,
  styleVariants: ["clean", "visual"],
  renderer: PictographRenderer,
  defaultData: {
    icon: "⭐",
    scale: 2,
    items: [
      { label: "Class 1", count: 6 },
      { label: "Class 2", count: 8 },
      { label: "Class 3", count: 4 },
    ],
  },
  configFields: [
    { key: "icon", label: "Symbol Icon", type: "text", defaultValue: "⭐" },
    { key: "scale", label: "Scale (Each symbol =)", type: "number", defaultValue: 2 },
  ],
});

// 33. Bar Graph
registerMathTemplate({
  id: "math-bar-graph",
  name: "Vertical Bar Graph",
  category: "data",
  subcategory: "Graphs",
  grades: [3, 4, 5],
  type: "diagram",
  tags: ["bar graph", "data handling", "chart", "axes"],
  defaultWidth: 270,
  defaultHeight: 135,
  styleVariants: ["clean", "visual"],
  renderer: BarGraphRenderer,
  defaultData: {
    items: [
      { label: "Mon", value: 12 },
      { label: "Tue", value: 18 },
      { label: "Wed", value: 15 },
      { label: "Thu", value: 24 },
      { label: "Fri", value: 20 },
    ],
  },
  configFields: [],
});

// 34. Pattern Sequence
registerMathTemplate({
  id: "math-pattern-sequence",
  name: "Pattern Sequence Machine",
  category: "patterns",
  subcategory: "Sequences",
  grades: [1, 2, 3],
  type: "practice",
  tags: ["patterns", "repeating", "growing", "sequence"],
  defaultWidth: 260,
  defaultHeight: 85,
  styleVariants: ["clean", "visual"],
  renderer: PatternSequenceRenderer,
  defaultData: {
    sequence: ["🔺", "🔷", "🔺", "🔷", "🔺", "?"],
    rule: "AB Pattern",
  },
  configFields: [],
});

// 35. Function Machine
registerMathTemplate({
  id: "math-function-machine",
  name: "Input-Output Function Machine",
  category: "patterns",
  subcategory: "Algebra & Rules",
  grades: [3, 4, 5],
  type: "interactive",
  tags: ["function machine", "input output", "rules", "algebra"],
  defaultWidth: 260,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: FunctionMachineRenderer,
  defaultData: {
    rule: "× 3 + 1",
    rows: [
      { in: 2, out: 7 },
      { in: 4, out: 13 },
      { in: 5, out: 16 },
      { in: 8, out: 25 },
    ],
  },
  configFields: [
    { key: "rule", label: "Rule Text", type: "text", defaultValue: "× 3 + 1" },
  ],
});

// 36. Two-Column Matching Engine
registerMathTemplate({
  id: "math-matching-exercise",
  name: "Two-Column Matching Engine",
  category: "assessment",
  subcategory: "Exercises",
  grades: [1, 2, 3, 4, 5],
  type: "practice",
  tags: ["match", "matching", "exercise", "assessment", "pairs"],
  defaultWidth: 270,
  defaultHeight: 140,
  styleVariants: ["clean", "color-coded"],
  renderer: MatchingExerciseRenderer,
  defaultData: {
    pairs: [
      { left: "5 × 4", right: "20", matchIndex: 0 },
      { left: "8 + 7", right: "15", matchIndex: 1 },
      { left: "36 ÷ 6", right: "6", matchIndex: 2 },
      { left: "100 - 45", right: "55", matchIndex: 3 },
    ],
  },
  configFields: [],
});

// 37. Number Bond
registerMathTemplate({
  id: "math-number-bond",
  name: "Number Bond (Part-Part-Whole)",
  category: "mental-maths",
  subcategory: "Thinking Diagrams",
  grades: [1, 2, 3],
  type: "diagram",
  tags: ["number bond", "part whole", "addition", "decomposition"],
  defaultWidth: 210,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: NumberBondRenderer,
  defaultData: {
    whole: 10,
    part1: 7,
  },
  configFields: [
    { key: "whole", label: "Whole Number", type: "number", defaultValue: 10 },
    { key: "part1", label: "Part 1", type: "number", defaultValue: 7 },
  ],
});

// 38. Bar Model (Part-Whole)
registerMathTemplate({
  id: "math-bar-model",
  name: "Bar Model (Singapore Math)",
  category: "word-problems",
  subcategory: "Models",
  grades: [2, 3, 4, 5],
  type: "diagram",
  tags: ["bar model", "singapore math", "part whole", "word problems"],
  defaultWidth: 260,
  defaultHeight: 100,
  styleVariants: ["clean", "visual"],
  renderer: BarModelRenderer,
  defaultData: {
    partA: 65,
    partB: 35,
    labelA: "Boys",
    labelB: "Girls",
  },
  configFields: [
    { key: "partA", label: "Part A Value", type: "number", defaultValue: 65 },
    { key: "partB", label: "Part B Value", type: "number", defaultValue: 35 },
    { key: "labelA", label: "Label A", type: "text", defaultValue: "Boys" },
    { key: "labelB", label: "Label B", type: "text", defaultValue: "Girls" },
  ],
});

// 39. Number Pyramid
registerMathTemplate({
  id: "math-number-pyramid",
  name: "Number Pyramid (Bricks Model)",
  category: "mental-maths",
  subcategory: "Puzzles",
  grades: [1, 2, 3, 4],
  type: "challenge",
  tags: ["pyramid", "puzzle", "mental maths", "addition"],
  defaultWidth: 230,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: NumberPyramidRenderer,
  defaultData: {
    b1: 3,
    b2: 5,
    b3: 2,
  },
  configFields: [
    { key: "b1", label: "Bottom Left Brick", type: "number", defaultValue: 3 },
    { key: "b2", label: "Bottom Center Brick", type: "number", defaultValue: 5 },
    { key: "b3", label: "Bottom Right Brick", type: "number", defaultValue: 2 },
  ],
});

// 40. Worked Example System
registerMathTemplate({
  id: "math-worked-example",
  name: "Worked Example Pedagogical Block",
  category: "word-problems",
  subcategory: "Instructional",
  grades: [2, 3, 4, 5],
  type: "worked-example",
  tags: ["worked example", "problem solving", "pedagogy", "solution", "steps"],
  defaultWidth: 290,
  defaultHeight: 155,
  styleVariants: ["clean", "visual"],
  renderer: WorkedExampleRenderer,
  defaultData: {
    exampleNumber: 4,
    problem: "Find the sum of 38,426 and 17,893.",
    method: "Standard Column Algorithm",
    answer: "56,319",
    tip: "Remember to add the carried-over digit to the next column.",
  },
  configFields: [
    { key: "exampleNumber", label: "Example #", type: "number", defaultValue: 4 },
    { key: "problem", label: "Problem Text", type: "text", defaultValue: "Find the sum of 38,426 and 17,893." },
    { key: "answer", label: "Final Answer", type: "text", defaultValue: "56,319" },
    { key: "tip", label: "Pedagogical Tip", type: "text", defaultValue: "Remember to add the carried-over digit." },
  ],
});

// 41. Word Problem Layout
registerMathTemplate({
  id: "math-word-problem",
  name: "Structured Word Problem Area",
  category: "word-problems",
  subcategory: "Worksheets",
  grades: [1, 2, 3, 4, 5],
  type: "practice",
  tags: ["word problem", "story", "operation", "answer space"],
  defaultWidth: 270,
  defaultHeight: wordProblemLayout(WORD_PROBLEM_DEFAULTS, 270).height,
  measureHeight: (data, width) => wordProblemLayout(data, width).height,
  styleVariants: ["clean", "visual"],
  renderer: WordProblemRenderer,
  defaultData: { ...WORD_PROBLEM_DEFAULTS },
  configFields: [
    { key: "story", label: "Story Prompt", type: "text", defaultValue: "A fruit seller had 450 apples..." },
    { key: "operation", label: "Operation", type: "text", defaultValue: WORD_PROBLEM_DEFAULTS.operation },
    { key: "title", label: "Title", type: "text", defaultValue: WORD_PROBLEM_DEFAULTS.title },
    { key: "fontSize", label: "Text size (pt)", type: "number", defaultValue: WORD_PROBLEM_DEFAULTS.fontSize, min: 10, max: 20 },
    { key: "answer", label: "Answer", type: "text", defaultValue: "165 apples" },
  ],
});

// 42. Math Activity Card
registerMathTemplate({
  id: "math-activity-card",
  name: "Math Lab & Activity Card",
  category: "activities",
  subcategory: "Hands-on",
  grades: [1, 2, 3, 4, 5],
  type: "activity",
  tags: ["activity", "math lab", "think solve", "speed maths", "hands-on"],
  defaultWidth: 260,
  defaultHeight: 95,
  styleVariants: ["clean", "visual"],
  renderer: MathActivityCardRenderer,
  defaultData: {
    kind: "math-lab",
    title: "Paper Folding Activity",
    instructions: "Fold an A4 sheet into 4 equal strips to observe fourths and equivalence.",
  },
  configFields: [
    { key: "kind", label: "Activity Type", type: "select", defaultValue: "math-lab", options: [{ label: "Math Lab", value: "math-lab" }, { label: "Think & Solve", value: "think-solve" }, { label: "Speed Maths", value: "speed-maths" }, { label: "Puzzle Zone", value: "puzzle-zone" }] },
    { key: "title", label: "Title", type: "text", defaultValue: "Paper Folding Activity" },
    { key: "instructions", label: "Instructions", type: "text", defaultValue: "Fold an A4 sheet into 4 equal strips..." },
  ],
});

// 43. Decimal Place Value Chart
registerMathTemplate({
  id: "math-decimal-place-value",
  name: "Decimal Place Value Chart",
  category: "decimals",
  subcategory: "Charts & Tables",
  grades: [4, 5],
  type: "table",
  tags: ["decimal", "place value", "tenths", "hundredths", "thousandths", "point"],
  defaultWidth: 300,
  defaultHeight: 100,
  styleVariants: ["clean", "color-coded"],
  renderer: DecimalPlaceValueRenderer,
  defaultData: {
    number: "34.75",
    showFractionBadges: true,
  },
  configFields: [
    { key: "number", label: "Decimal Number", type: "text", defaultValue: "34.75" },
    { key: "showFractionBadges", label: "Show Fractional Badges", type: "boolean", defaultValue: true },
  ],
});

// 44. Decimal 10x10 Grid (Hundredths)
registerMathTemplate({
  id: "math-decimal-grid",
  name: "Decimal 10 × 10 Grid (Hundredths)",
  category: "decimals",
  subcategory: "Visual Models",
  grades: [4, 5],
  type: "visual-model",
  tags: ["decimal grid", "hundredths", "tenths", "visual model", "shading"],
  defaultWidth: 240,
  defaultHeight: 115,
  styleVariants: ["clean", "color-coded"],
  renderer: DecimalGridRenderer,
  defaultData: {
    value: 0.35,
  },
  configFields: [
    { key: "value", label: "Decimal Value (0 to 1)", type: "number", defaultValue: 0.35, min: 0, max: 1, step: 0.01 },
  ],
});

// 45. Fraction <-> Decimal Equivalence
registerMathTemplate({
  id: "math-fraction-decimal-converter",
  name: "Fraction ↔ Decimal Converter",
  category: "decimals",
  subcategory: "Equivalence",
  grades: [4, 5],
  type: "visual-model",
  tags: ["fraction to decimal", "equivalence", "tenths", "hundredths"],
  defaultWidth: 240,
  defaultHeight: 95,
  styleVariants: ["clean", "color-coded"],
  renderer: FractionDecimalConverterRenderer,
  defaultData: {
    numerator: 3,
    denominator: 10,
  },
  configFields: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 3 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 10 },
  ],
});

// 46. Decimal Comparison (<, >, =)
registerMathTemplate({
  id: "math-decimal-comparison",
  name: "Decimal Comparison (<, >, =)",
  category: "decimals",
  subcategory: "Comparison",
  grades: [4, 5],
  type: "practice",
  tags: ["decimal comparison", "greater than", "less than", "order"],
  defaultWidth: 240,
  defaultHeight: 70,
  styleVariants: ["clean", "color-coded"],
  renderer: DecimalComparisonRenderer,
  defaultData: {
    val1: 0.45,
    val2: 0.5,
  },
  configFields: [
    { key: "val1", label: "Left Decimal", type: "number", defaultValue: 0.45, step: 0.01 },
    { key: "val2", label: "Right Decimal", type: "number", defaultValue: 0.5, step: 0.01 },
  ],
});

// 47. Decimal Column Arithmetic
registerMathTemplate({
  id: "math-decimal-column-arithmetic",
  name: "Decimal Column Arithmetic",
  category: "decimals",
  subcategory: "Algorithms",
  grades: [4, 5],
  type: "visual-model",
  tags: ["decimal addition", "decimal subtraction", "column method", "align points"],
  defaultWidth: 200,
  defaultHeight: 115,
  styleVariants: ["clean", "color-coded"],
  renderer: DecimalColumnArithmeticRenderer,
  defaultData: {
    val1: 24.65,
    val2: 18.42,
    operation: "+",
  },
  configFields: [
    { key: "val1", label: "Top Number", type: "number", defaultValue: 24.65, step: 0.01 },
    { key: "val2", label: "Bottom Number", type: "number", defaultValue: 18.42, step: 0.01 },
    { key: "operation", label: "Operation", type: "select", defaultValue: "+", options: [{ label: "Addition (+)", value: "+" }, { label: "Subtraction (-)", value: "-" }] },
  ],
});

// 48. Digit -> Place -> Value Diagram
registerMathTemplate({
  id: "math-digit-place-value-diagram",
  name: "Digit ➔ Place ➔ Value Diagram",
  category: "place-value",
  subcategory: "Diagrams",
  grades: [2, 3, 4, 5],
  type: "diagram",
  tags: ["digit", "place", "value", "place value diagram", "decomposition"],
  defaultWidth: 260,
  defaultHeight: 140,
  styleVariants: ["clean", "color-coded"],
  renderer: DigitPlaceValueDiagramRenderer,
  defaultData: {
    number: 74523,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 74523 },
  ],
});

// 49. Place Value Houses
registerMathTemplate({
  id: "math-place-value-houses",
  name: "Place Value Houses (Periods)",
  category: "place-value",
  subcategory: "Visual Models",
  grades: [2, 3, 4, 5],
  type: "visual-model",
  tags: ["place value houses", "periods", "lakhs", "thousands", "ones house"],
  defaultWidth: 290,
  defaultHeight: 125,
  styleVariants: ["clean", "color-coded"],
  renderer: PlaceValueHousesRenderer,
  defaultData: {
    number: 543261,
  },
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 543261 },
  ],
});

// 50. Digit Cards & Number Formation
registerMathTemplate({
  id: "math-digit-cards",
  name: "Digit Cards & Formation Challenge",
  category: "numbers",
  subcategory: "Challenges",
  grades: [1, 2, 3, 4, 5],
  type: "challenge",
  tags: ["digit cards", "largest number", "smallest number", "rearrange"],
  defaultWidth: 260,
  defaultHeight: 110,
  styleVariants: ["clean", "color-coded"],
  renderer: DigitCardsRenderer,
  defaultData: {
    digits: [7, 2, 9, 4, 0],
    challenge: "largest",
  },
  configFields: [
    { key: "challenge", label: "Target Challenge", type: "select", defaultValue: "largest", options: [{ label: "Make Largest Number", value: "largest" }, { label: "Make Smallest Number", value: "smallest" }] },
  ],
});

// 51. Ascending & Descending Sequence
registerMathTemplate({
  id: "math-ascending-descending",
  name: "Ascending / Descending Sequence",
  category: "numbers",
  subcategory: "Sequences",
  grades: [1, 2, 3, 4],
  type: "practice",
  tags: ["ascending order", "descending order", "ordering numbers", "sequence"],
  defaultWidth: 270,
  defaultHeight: 85,
  styleVariants: ["clean", "color-coded"],
  renderer: AscendingDescendingRenderer,
  defaultData: {
    numbers: [4520, 1890, 7250, 3600],
    order: "ascending",
  },
  configFields: [
    { key: "order", label: "Order Mode", type: "select", defaultValue: "ascending", options: [{ label: "Ascending (Smallest to Largest)", value: "ascending" }, { label: "Descending (Largest to Smallest)", value: "descending" }] },
  ],
});

// 52. Odd / Even Pairing Model
registerMathTemplate({
  id: "math-odd-even",
  name: "Odd / Even Pairing Model",
  category: "numbers",
  subcategory: "Visual Models",
  grades: [1, 2, 3],
  type: "visual-model",
  tags: ["odd even", "parity", "pairing", "number sense"],
  defaultWidth: 240,
  defaultHeight: 100,
  styleVariants: ["clean", "color-coded"],
  renderer: OddEvenModelRenderer,
  defaultData: {
    number: 11,
  },
  configFields: [
    { key: "number", label: "Number (1 to 24)", type: "number", defaultValue: 11, min: 1, max: 24 },
  ],
});

// 53. Multiplication Wheel
registerMathTemplate({
  id: "math-multiplication-wheel",
  name: "Multiplication Wheel (Tables)",
  category: "multiplication",
  subcategory: "Interactive Drills",
  grades: [2, 3, 4, 5],
  type: "interactive",
  tags: ["multiplication wheel", "times tables", "drill", "spokes"],
  defaultWidth: 240,
  defaultHeight: 135,
  styleVariants: ["clean", "color-coded"],
  renderer: MultiplicationWheelRenderer,
  defaultData: {
    factor: 7,
  },
  configFields: [
    { key: "factor", label: "Center Factor (Table)", type: "number", defaultValue: 7, min: 1, max: 20 },
  ],
});

// 54. Equal Groups (Repeated Addition)
registerMathTemplate({
  id: "math-repeated-addition",
  name: "Equal Groups (Repeated Addition)",
  category: "multiplication",
  subcategory: "Visual Models",
  grades: [1, 2, 3],
  type: "visual-model",
  tags: ["equal groups", "repeated addition", "multiplication model"],
  defaultWidth: 260,
  defaultHeight: 125,
  styleVariants: ["clean", "color-coded"],
  renderer: RepeatedAdditionMultiplicationRenderer,
  defaultData: {
    groups: 4,
    itemsPerGroup: 3,
    icon: "🍎",
  },
  configFields: [
    { key: "groups", label: "Number of Groups", type: "number", defaultValue: 4, min: 2, max: 6 },
    { key: "itemsPerGroup", label: "Items per Group", type: "number", defaultValue: 3, min: 1, max: 8 },
    { key: "icon", label: "Icon Symbol", type: "text", defaultValue: "🍎" },
  ],
});

// 55. Equal Sharing & Grouping (Division)
registerMathTemplate({
  id: "math-equal-sharing",
  name: "Equal Sharing & Grouping (Division)",
  category: "division",
  subcategory: "Visual Models",
  grades: [2, 3, 4],
  type: "visual-model",
  tags: ["equal sharing", "grouping", "division visual", "sharing objects"],
  defaultWidth: 260,
  defaultHeight: 115,
  styleVariants: ["clean", "color-coded"],
  renderer: EqualSharingDivisionRenderer,
  defaultData: {
    totalItems: 12,
    groupsCount: 3,
  },
  configFields: [
    { key: "totalItems", label: "Total Items", type: "number", defaultValue: 12, min: 4, max: 24 },
    { key: "groupsCount", label: "Number of Groups/Children", type: "number", defaultValue: 3, min: 2, max: 6 },
  ],
});

// 56. Comparison Tape Diagram
registerMathTemplate({
  id: "math-tape-diagram",
  name: "Comparison Tape Diagram (Singapore Math)",
  category: "word-problems",
  subcategory: "Models",
  grades: [2, 3, 4, 5],
  type: "diagram",
  tags: ["tape diagram", "bar model", "singapore math", "difference"],
  defaultWidth: 260,
  defaultHeight: 110,
  styleVariants: ["clean", "visual"],
  renderer: TapeDiagramRenderer,
  defaultData: {
    valueA: 80,
    valueB: 50,
    labelA: "Team Alpha",
    labelB: "Team Beta",
  },
  configFields: [
    { key: "valueA", label: "Value A", type: "number", defaultValue: 80 },
    { key: "valueB", label: "Value B", type: "number", defaultValue: 50 },
    { key: "labelA", label: "Label A", type: "text", defaultValue: "Team Alpha" },
    { key: "labelB", label: "Label B", type: "text", defaultValue: "Team Beta" },
  ],
});

// 57. 3x3 Magic Square Puzzle
registerMathTemplate({
  id: "math-magic-square",
  name: "3 × 3 Magic Square Puzzle",
  category: "mental-maths",
  subcategory: "Puzzles",
  grades: [3, 4, 5],
  type: "challenge",
  tags: ["magic square", "puzzle", "sum", "mental maths"],
  defaultWidth: 230,
  defaultHeight: 125,
  styleVariants: ["clean", "color-coded"],
  renderer: MagicSquareRenderer,
  defaultData: {
    magicConstant: 15,
  },
  configFields: [
    { key: "magicConstant", label: "Magic Sum Constant", type: "number", defaultValue: 15 },
  ],
});

// 58. Balance Equation Model
registerMathTemplate({
  id: "math-balance-equation",
  name: "Balance Equation Model",
  category: "mental-maths",
  subcategory: "Equations",
  grades: [2, 3, 4],
  type: "practice",
  tags: ["balance equation", "equality", "missing number", "algebra"],
  defaultWidth: 240,
  defaultHeight: 85,
  styleVariants: ["clean", "color-coded"],
  renderer: BalanceEquationRenderer,
  defaultData: {
    leftA: 15,
    leftB: 8,
    rightKnown: 10,
  },
  configFields: [
    { key: "leftA", label: "Left Addend 1", type: "number", defaultValue: 15 },
    { key: "leftB", label: "Left Addend 2", type: "number", defaultValue: 8 },
    { key: "rightKnown", label: "Right Known Addend", type: "number", defaultValue: 10 },
  ],
});

// 59. Fill in the Blanks Assessment Card
registerMathTemplate({
  id: "math-fill-in-the-blanks",
  name: "Fill in the Blanks Question Card",
  category: "assessment",
  subcategory: "Cards",
  grades: [1, 2, 3, 4, 5],
  type: "practice",
  tags: ["fill in the blanks", "assessment", "question card", "exercise"],
  defaultWidth: 270,
  defaultHeight: 85,
  styleVariants: ["clean", "visual"],
  renderer: FillInTheBlanksRenderer,
  defaultData: {
    number: 1,
    prompt: "The place value of 7 in 4,75,230 is",
    answer: "70,000",
  },
  configFields: [
    { key: "number", label: "Question #", type: "number", defaultValue: 1 },
    { key: "prompt", label: "Question Prompt", type: "text", defaultValue: "The place value of 7 in 4,75,230 is" },
    { key: "answer", label: "Answer (Teacher Key)", type: "text", defaultValue: "70,000" },
  ],
});

// 60. Multiple Choice Question (MCQ) Block
registerMathTemplate({
  id: "math-choose-correct-answer",
  name: "Multiple Choice Question (MCQ)",
  category: "assessment",
  subcategory: "MCQ",
  grades: [1, 2, 3, 4, 5],
  type: "practice",
  tags: ["mcq", "multiple choice", "choose correct", "quiz", "assessment"],
  defaultWidth: 270,
  defaultHeight: 115,
  styleVariants: ["clean", "color-coded"],
  renderer: ChooseCorrectAnswerRenderer,
  defaultData: {
    question: "Which of the following is a prime number?",
    options: ["12", "15", "17", "21"],
    correctIndex: 2,
  },
  configFields: [
    { key: "question", label: "Question", type: "text", defaultValue: "Which of the following is a prime number?" },
    { key: "correctIndex", label: "Correct Option Index (0-3)", type: "number", defaultValue: 2, min: 0, max: 3 },
  ],
});

PRIMARY_MATH_TEMPLATES.forEach(registerMathTemplate);
CATALOGUE_TEMPLATES.forEach(registerMathTemplate);
READY_MADE_MATH_TEMPLATES.forEach(registerMathTemplate);
REFERENCE_BLOCK_TEMPLATES.forEach(registerMathTemplate);

// ----------------------------------------------------------------------------
// Search & Filter Helper
// ----------------------------------------------------------------------------
export function searchMathTemplates(options: {
  query?: string;
  topic?: string;
  grade?: number | "all";
  type?: string;
  chapter?: string | "all";
}): MathTemplate[] {
  const all = getAllMathTemplates();
  const q = options.query?.trim().toLowerCase() || "";

  return all.filter((tpl) => {
    // Topic filter
    if (options.topic && options.topic !== "all" && tpl.category !== options.topic) {
      return false;
    }
    // Grade filter
    if (options.grade && options.grade !== "all") {
      if (!tpl.grades.includes(Number(options.grade) as MathGrade)) return false;
    }
    // Type filter
    if (options.type && options.type !== "all" && tpl.type !== options.type) {
      return false;
    }
    // Chapter filter
    if (options.chapter && options.chapter !== "all" && tpl.chapterTag !== options.chapter) {
      return false;
    }
    // Search query matching name, category, subcategory, chapterTag, tags
    if (q) {
      const haystack = `${tpl.name} ${tpl.category} ${tpl.subcategory || ""} ${tpl.chapterTag || ""} ${tpl.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
