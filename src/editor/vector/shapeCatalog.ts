import { VectorShapeType } from "../../domain/element/types";
import { generateShapeSvgPath } from "./shapeGeometry";

export interface ShapeDefinition {
  id: VectorShapeType;
  name: string;
  category: ShapeCategoryId;
  keywords: string[];
  defaultWidth: number;
  defaultHeight: number;
  description?: string;
  isPopular?: boolean;
}

export type ShapeCategoryId =
  | "basic"
  | "lines"
  | "arrows"
  | "callouts"
  | "badges"
  | "organic"
  | "educational"
  | "flowchart"
  | "maths"
  | "decorative"
  | "my-shapes";

export interface ShapeCategoryMeta {
  id: ShapeCategoryId;
  name: string;
  iconName: string;
}

export const SHAPE_CATEGORIES: ShapeCategoryMeta[] = [
  { id: "basic", name: "Basic Shapes", iconName: "Square" },
  { id: "lines", name: "Lines & Connectors", iconName: "Minus" },
  { id: "arrows", name: "Arrows", iconName: "ArrowRight" },
  { id: "callouts", name: "Callouts & Bubbles", iconName: "MessageSquare" },
  { id: "badges", name: "Badges & Labels", iconName: "Award" },
  { id: "organic", name: "Organic & Waves", iconName: "Feather" },
  { id: "educational", name: "Educational Cards", iconName: "GraduationCap" },
  { id: "flowchart", name: "Flowchart", iconName: "GitCommit" },
  { id: "maths", name: "Mathematics", iconName: "Calculator" },
  { id: "my-shapes", name: "My Shapes", iconName: "Bookmark" },
];

export const SHAPE_CATALOG: ShapeDefinition[] = [
  // 1. BASIC
  { id: "rectangle", name: "Rectangle", category: "basic", keywords: ["box", "rect", "container", "square"], defaultWidth: 160, defaultHeight: 100, isPopular: true },
  { id: "rounded-rectangle", name: "Rounded Rectangle", category: "basic", keywords: ["card", "pill", "smooth", "panel"], defaultWidth: 160, defaultHeight: 100, isPopular: true },
  { id: "square", name: "Square", category: "basic", keywords: ["box", "tile", "equal"], defaultWidth: 110, defaultHeight: 110 },
  { id: "circle", name: "Circle", category: "basic", keywords: ["round", "oval", "disk", "dot"], defaultWidth: 110, defaultHeight: 110, isPopular: true },
  { id: "ellipse", name: "Ellipse", category: "basic", keywords: ["oval", "egg", "orbit"], defaultWidth: 150, defaultHeight: 90 },
  { id: "semi-circle", name: "Semi-Circle", category: "basic", keywords: ["half", "dome", "arch"], defaultWidth: 120, defaultHeight: 60 },
  { id: "quarter-circle", name: "Quarter Circle", category: "basic", keywords: ["corner", "pie", "wedge"], defaultWidth: 80, defaultHeight: 80 },
  { id: "triangle", name: "Triangle", category: "basic", keywords: ["delta", "pyramid", "roof"], defaultWidth: 120, defaultHeight: 100, isPopular: true },
  { id: "right-triangle", name: "Right Triangle", category: "basic", keywords: ["90 degree", "geometry", "slope"], defaultWidth: 120, defaultHeight: 100 },
  { id: "diamond", name: "Diamond", category: "basic", keywords: ["rhombus", "gem", "kite"], defaultWidth: 110, defaultHeight: 110, isPopular: true },
  { id: "parallelogram", name: "Parallelogram", category: "basic", keywords: ["skew", "slant", "tilt"], defaultWidth: 150, defaultHeight: 90 },
  { id: "trapezoid", name: "Trapezoid", category: "basic", keywords: ["bucket", "keystone", "pedestal"], defaultWidth: 150, defaultHeight: 90 },
  { id: "pentagon", name: "Pentagon", category: "basic", keywords: ["5 sided", "polygon"], defaultWidth: 110, defaultHeight: 110 },
  { id: "hexagon", name: "Hexagon", category: "basic", keywords: ["6 sided", "honeycomb", "nut"], defaultWidth: 120, defaultHeight: 110, isPopular: true },
  { id: "octagon", name: "Octagon", category: "basic", keywords: ["8 sided", "stop", "sign"], defaultWidth: 110, defaultHeight: 110 },
  { id: "star", name: "5-Point Star", category: "basic", keywords: ["rating", "favorite", "award", "sparkle"], defaultWidth: 110, defaultHeight: 110, isPopular: true },
  { id: "multi-star", name: "8-Point Star", category: "basic", keywords: ["burst", "sun", "spark"], defaultWidth: 110, defaultHeight: 110 },
  { id: "cross", name: "Cross", category: "basic", keywords: ["medical", "plus", "intersect"], defaultWidth: 100, defaultHeight: 100 },
  { id: "plus", name: "Plus", category: "basic", keywords: ["add", "sum", "positive"], defaultWidth: 90, defaultHeight: 90 },
  { id: "minus", name: "Minus", category: "basic", keywords: ["subtract", "dash", "negative"], defaultWidth: 100, defaultHeight: 30 },
  { id: "capsule", name: "Capsule", category: "basic", keywords: ["pill", "stadium", "tag"], defaultWidth: 150, defaultHeight: 60, isPopular: true },
  { id: "ring", name: "Ring", category: "basic", keywords: ["donut", "annulus", "loop", "circle"], defaultWidth: 110, defaultHeight: 110 },

  // 2. ARROWS
  { id: "arrow-right", name: "Right Arrow", category: "arrows", keywords: ["next", "forward", "direction", "pointer"], defaultWidth: 140, defaultHeight: 60, isPopular: true },
  { id: "arrow-left", name: "Left Arrow", category: "arrows", keywords: ["back", "previous", "return"], defaultWidth: 140, defaultHeight: 60 },
  { id: "arrow-up", name: "Up Arrow", category: "arrows", keywords: ["top", "increase", "north"], defaultWidth: 60, defaultHeight: 140 },
  { id: "arrow-down", name: "Down Arrow", category: "arrows", keywords: ["bottom", "decrease", "south"], defaultWidth: 60, defaultHeight: 140 },
  { id: "arrow-double", name: "Double Arrow", category: "arrows", keywords: ["both", "bidirectional", "switch"], defaultWidth: 150, defaultHeight: 60 },
  { id: "arrow-chevron", name: "Chevron Arrow", category: "arrows", keywords: ["ribbon", "strip", "process"], defaultWidth: 130, defaultHeight: 60 },
  { id: "arrow-bent", name: "Bent Arrow", category: "arrows", keywords: ["elbow", "turn", "corner"], defaultWidth: 110, defaultHeight: 110 },
  { id: "arrow-curved", name: "Curved Arrow", category: "arrows", keywords: ["arc", "swoop", "swing"], defaultWidth: 130, defaultHeight: 90 },
  { id: "arrow-circular", name: "Circular Arrow", category: "arrows", keywords: ["cycle", "loop", "reload", "refresh"], defaultWidth: 110, defaultHeight: 110, isPopular: true },
  { id: "arrow-uturn", name: "U-Turn Arrow", category: "arrows", keywords: ["return", "loopback", "reverse"], defaultWidth: 100, defaultHeight: 110 },
  { id: "arrow-block", name: "Block Arrow", category: "arrows", keywords: ["thick", "chunky", "bullet"], defaultWidth: 140, defaultHeight: 70 },
  { id: "arrow-flow", name: "Flow Arrow", category: "arrows", keywords: ["process", "pipeline", "step"], defaultWidth: 160, defaultHeight: 50 },

  // 3. CALLOUTS
  { id: "callout-speech", name: "Speech Bubble", category: "callouts", keywords: ["speech", "bubble", "dialogue", "talk", "chat", "message"], defaultWidth: 160, defaultHeight: 110, isPopular: true },
  { id: "callout-thought", name: "Thought Bubble", category: "callouts", keywords: ["think", "cloud", "dream", "idea"], defaultWidth: 160, defaultHeight: 120, isPopular: true },
  { id: "callout-rounded-speech", name: "Rounded Bubble", category: "callouts", keywords: ["smooth", "comic", "dialogue"], defaultWidth: 160, defaultHeight: 110 },
  { id: "callout-rectangle", name: "Rect Callout", category: "callouts", keywords: ["box", "pointer", "notice"], defaultWidth: 160, defaultHeight: 100 },
  { id: "callout-cloud", name: "Cloud Bubble", category: "callouts", keywords: ["scallop", "dream", "steam"], defaultWidth: 160, defaultHeight: 120 },
  { id: "callout-quote", name: "Quote Bubble", category: "callouts", keywords: ["citation", "speech", "saying"], defaultWidth: 160, defaultHeight: 110 },
  { id: "callout-comic", name: "Comic Bubble", category: "callouts", keywords: ["action", "shout", "hero"], defaultWidth: 160, defaultHeight: 110 },
  { id: "callout-annotation", name: "Annotation Label", category: "callouts", keywords: ["marker", "tip", "pointer"], defaultWidth: 140, defaultHeight: 80 },

  // 4. BADGES & LABELS
  { id: "badge-ribbon", name: "Ribbon Banner", category: "badges", keywords: ["title", "header", "ribbon", "banner", "award"], defaultWidth: 180, defaultHeight: 60, isPopular: true },
  { id: "badge-shield", name: "Shield", category: "badges", keywords: ["security", "crest", "coat of arms", "defense"], defaultWidth: 110, defaultHeight: 130, isPopular: true },
  { id: "badge-award", name: "Award Medal", category: "badges", keywords: ["trophy", "medal", "ribbon", "first", "winner"], defaultWidth: 100, defaultHeight: 140 },
  { id: "badge-seal", name: "Official Seal", category: "badges", keywords: ["stamp", "verified", "burst", "guarantee"], defaultWidth: 110, defaultHeight: 110 },
  { id: "badge-starburst", name: "Starburst", category: "badges", keywords: ["sale", "new", "special", "pop", "blast"], defaultWidth: 110, defaultHeight: 110, isPopular: true },
  { id: "badge-ticket", name: "Ticket Stub", category: "badges", keywords: ["coupon", "voucher", "pass", "entry"], defaultWidth: 160, defaultHeight: 90 },
  { id: "badge-tag", name: "Price Tag", category: "badges", keywords: ["label", "hangtag", "sale", "note"], defaultWidth: 150, defaultHeight: 80 },
  { id: "badge-bookmark", name: "Bookmark Ribbon", category: "badges", keywords: ["marker", "reader", "pennant"], defaultWidth: 80, defaultHeight: 140 },
  { id: "badge-folded-corner", name: "Folded Corner Note", category: "badges", keywords: ["page curl", "sticky", "post-it", "memo"], defaultWidth: 140, defaultHeight: 120 },

  // 5. ORGANIC
  { id: "organic-blob-1", name: "Smooth Blob", category: "organic", keywords: ["liquid", "organic", "amoeba", "soft", "curve"], defaultWidth: 160, defaultHeight: 140, isPopular: true },
  { id: "organic-blob-2", name: "Fluid Splash", category: "organic", keywords: ["asymmetric", "modern", "dynamic"], defaultWidth: 160, defaultHeight: 140 },
  { id: "organic-wave", name: "Wave Container", category: "organic", keywords: ["curved", "fluid", "bottom banner", "horizon"], defaultWidth: 200, defaultHeight: 90, isPopular: true },
  { id: "organic-pebble", name: "Pebble Stone", category: "organic", keywords: ["rock", "smooth", "nature", "zen"], defaultWidth: 150, defaultHeight: 110 },
  { id: "organic-leaf", name: "Botanical Leaf", category: "organic", keywords: ["plant", "nature", "eco", "green", "bio"], defaultWidth: 100, defaultHeight: 140 },
  { id: "organic-drop", name: "Water Drop", category: "organic", keywords: ["tear", "rain", "liquid", "dew"], defaultWidth: 100, defaultHeight: 130 },
  { id: "organic-cloud", name: "Soft Cloud", category: "organic", keywords: ["weather", "sky", "dream", "puff"], defaultWidth: 160, defaultHeight: 100 },
  { id: "organic-torn-paper", name: "Torn Paper Edge", category: "organic", keywords: ["notebook", "rip", "scrap", "journal"], defaultWidth: 180, defaultHeight: 90 },
  { id: "organic-curved-panel", name: "Curved Header", category: "organic", keywords: ["arch", "dome", "chapter banner"], defaultWidth: 200, defaultHeight: 90 },

  // 6. EDUCATIONAL
  { id: "edu-number-tile", name: "Number Tile", category: "educational", keywords: ["math", "digit", "counter", "block"], defaultWidth: 80, defaultHeight: 80, isPopular: true },
  { id: "edu-flash-card", name: "Flash Card", category: "educational", keywords: ["study", "card", "quiz", "definition"], defaultWidth: 170, defaultHeight: 110, isPopular: true },
  { id: "edu-formula-box", name: "Formula Box", category: "educational", keywords: ["equation", "math", "science", "rule"], defaultWidth: 180, defaultHeight: 80 },
  { id: "edu-counting-block", name: "Counting Cube", category: "educational", keywords: ["3D cube", "isometric", "units", "base 10"], defaultWidth: 100, defaultHeight: 100 },
  { id: "edu-step-marker", name: "Step Marker", category: "educational", keywords: ["timeline", "milestone", "process", "phase"], defaultWidth: 150, defaultHeight: 50 },
  { id: "edu-venn-circle", name: "Venn Set Circle", category: "educational", keywords: ["venn diagram", "logic", "overlap", "set"], defaultWidth: 140, defaultHeight: 140 },
  { id: "edu-timeline-marker", name: "Timeline Flag", category: "educational", keywords: ["history", "chronology", "event"], defaultWidth: 140, defaultHeight: 60 },

  // 7. FLOWCHART
  { id: "flow-process", name: "Process", category: "flowchart", keywords: ["step", "action", "task", "box"], defaultWidth: 160, defaultHeight: 80, isPopular: true },
  { id: "flow-decision", name: "Decision (Diamond)", category: "flowchart", keywords: ["branch", "if then", "condition", "question"], defaultWidth: 130, defaultHeight: 90, isPopular: true },
  { id: "flow-start-end", name: "Start / End (Terminator)", category: "flowchart", keywords: ["terminal", "begin", "stop", "capsule"], defaultWidth: 150, defaultHeight: 70 },
  { id: "flow-input-output", name: "Input / Output", category: "flowchart", keywords: ["io", "data", "read", "write", "parallelogram"], defaultWidth: 160, defaultHeight: 80 },
  { id: "flow-document", name: "Document", category: "flowchart", keywords: ["report", "page", "file", "print"], defaultWidth: 150, defaultHeight: 90 },
  { id: "flow-database", name: "Database (Cylinder)", category: "flowchart", keywords: ["storage", "disk", "sql", "server"], defaultWidth: 120, defaultHeight: 110 },
  { id: "flow-connector", name: "Connector Node", category: "flowchart", keywords: ["node", "circle", "junction"], defaultWidth: 60, defaultHeight: 60 },
  { id: "flow-manual-operation", name: "Manual Operation", category: "flowchart", keywords: ["human", "input", "hands"], defaultWidth: 150, defaultHeight: 80 },
  { id: "flow-preparation", name: "Preparation (Hexagon)", category: "flowchart", keywords: ["initialize", "setup"], defaultWidth: 160, defaultHeight: 80 },

  // 8. MATHEMATICS
  { id: "math-number-line", name: "Number Line", category: "maths", keywords: ["axis", "ticks", "fractions", "integers", "ruler"], defaultWidth: 220, defaultHeight: 40, isPopular: true },
  { id: "math-coordinate-plane", name: "Coordinate Axes", category: "maths", keywords: ["cartesian", "x y", "grid", "quadrant"], defaultWidth: 140, defaultHeight: 140, isPopular: true },
  { id: "math-fraction-circle", name: "Fraction Pie", category: "maths", keywords: ["sector", "pie chart", "parts", "ratio"], defaultWidth: 120, defaultHeight: 120 },
  { id: "math-fraction-bar", name: "Fraction Bar", category: "maths", keywords: ["strip", "unit bar", "bar model"], defaultWidth: 180, defaultHeight: 45 },
  { id: "math-angle", name: "Angle Marker", category: "maths", keywords: ["degrees", "arc", "acute", "obtuse", "protractor"], defaultWidth: 110, defaultHeight: 110 },
  { id: "math-dimension-line", name: "Dimension Line", category: "maths", keywords: ["measurement", "length", "distance", "caliper"], defaultWidth: 160, defaultHeight: 30 },
  { id: "math-bracket", name: "Square Bracket", category: "maths", keywords: ["matrix", "array", "interval"], defaultWidth: 30, defaultHeight: 120 },
  { id: "math-brace", name: "Curly Brace", category: "maths", keywords: ["grouping", "set notation", "bracket"], defaultWidth: 35, defaultHeight: 120 },

  // 9. LINES
  { id: "line", name: "Straight Line", category: "lines", keywords: ["rule", "divider", "separator"], defaultWidth: 160, defaultHeight: 20, isPopular: true },
  { id: "line-dashed", name: "Dashed Line", category: "lines", keywords: ["cut", "perforated", "dashed"], defaultWidth: 160, defaultHeight: 20 },
  { id: "line-dotted", name: "Dotted Line", category: "lines", keywords: ["dots", "leader", "fill in"], defaultWidth: 160, defaultHeight: 20 },
  { id: "line-curved", name: "Curved Arc Line", category: "lines", keywords: ["swoop", "arc", "bend"], defaultWidth: 160, defaultHeight: 60 },
  { id: "line-elbow", name: "Elbow Connector", category: "lines", keywords: ["orthogonal", "right angle", "branch"], defaultWidth: 120, defaultHeight: 90 },
];

/**
 * Searches the catalog with fuzzy keywords and aliases
 */
export function searchShapeCatalog(query: string, categoryFilter?: ShapeCategoryId): ShapeDefinition[] {
  const q = query.trim().toLowerCase();

  return SHAPE_CATALOG.filter((item) => {
    if (categoryFilter && categoryFilter !== "my-shapes" && item.category !== categoryFilter) {
      return false;
    }
    if (!q) return true;

    if (item.name.toLowerCase().includes(q)) return true;
    if (item.id.toLowerCase().includes(q)) return true;
    if (item.keywords.some((k) => k.toLowerCase().includes(q))) return true;

    return false;
  });
}

/**
 * Generates thumbnail SVG path for any catalog item
 */
export function getShapeThumbnailPath(id: VectorShapeType, size: number = 36): string {
  return generateShapeSvgPath(id, size, size);
}
