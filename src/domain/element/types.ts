import {
  BlendMode,
  VectorCurveData,
  CompoundShapeData,
  PixelLayerData,
  AdjustmentLayerData,
  LiveFilterData,
  AIGenerationMetadata,
  TextWrapConfig,
  TextWrapMode,
  CornerConfig,
} from "../creative/types";
import { SmartBlockInstance } from "../educational/blockSchema";

export type ElementCategory =
  | "text"
  | "educational"
  | "math"
  | "assessment"
  | "workbook"
  | "media"
  | "data"
  | "decorative";

export type ElementType =
  // Text & Structural
  | "heading"
  | "subheading"
  | "body"
  | "body-text"
  | "caption"
  | "quote"
  | "pageNumber"
  | "page-number"
  | "chapter-title"
  | "lesson-title"
  | "header"
  | "footer"
  | "sidebar"
  | "callout"

  // Educational
  | "smart-block"
  | "learningObjectives"
  | "learning-objective"
  | "didYouKnow"
  | "did-you-know"
  | "keyConcept"
  | "definition"
  | "vocabulary"
  | "workedExample"
  | "worked-example"
  | "example"
  | "activity"
  | "experiment"
  | "teacherNote"
  | "summary"
  | "warning"
  | "tip"
  | "note"
  | "fact"
  | "fun-fact"
  | "formula"
  | "math-component"

  // Assessment & Worksheets
  | "question"
  | "mcq"
  | "trueFalse"
  | "fillInBlank"
  | "matchFollowing"
  | "rubric"
  | "answerBox"
  | "answer-area"
  | "worksheet"
  | "exercise"
  | "revision"
  | "assessment"

  // Workbook & Practice
  | "writingLines"
  | "tracingLines"
  | "drawingBox"
  | "checkboxList"
  | "numberGrid"
  | "graphGrid"

  // Media & Pixel
  | "image"
  | "picture-frame"
  | "pictureFrame"
  | "qrCode"
  | "smart-media-qr"
  | "illustration"
  | "diagram"
  | "pixel-layer"
  | "adjustment-layer"
  | "live-filter"

  // Vector & Compounds
  | "vector-curve"
  | "compound-shape"

  // AI Creative Layers
  | "ai-image"
  | "ai-vector"

  // Data
  | "table"
  | "timeline"
  | "comparison"

  // Container
  | "group"

  // Decorative
  | "shape"
  | "divider"
  | "badge"
  | "borderFrame";

export interface ElementTransform {
  x: number;          // in points (pt)
  y: number;          // in points (pt)
  width: number;      // in points (pt)
  height: number;     // in points (pt)
  rotation: number;   // in degrees (0 - 360)
  zIndex: number;
}

export interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  role: "Author" | "Editor" | "Designer" | "Reviewer";
  text: string;
  timestamp: string;
  resolved: boolean;
}

export type VectorShapeType =
  // Basic Shapes
  | "rectangle"
  | "rounded-rectangle"
  | "square"
  | "circle"
  | "oval"
  | "ellipse"
  | "semi-circle"
  | "quarter-circle"
  | "triangle"
  | "right-triangle"
  | "isosceles-triangle"
  | "equilateral-triangle"
  | "diamond"
  | "rhombus"
  | "parallelogram"
  | "trapezoid"
  | "pentagon"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "nonagon"
  | "decagon"
  | "polygon"
  | "star"
  | "multi-star"
  | "cross"
  | "plus"
  | "minus"
  | "capsule"
  | "pill"
  | "ring"
  | "arc"
  // Arrows
  | "arrow"
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "arrow-double"
  | "arrow-bidirectional"
  | "arrow-chevron"
  | "arrow-bent"
  | "arrow-curved"
  | "arrow-circular"
  | "arrow-uturn"
  | "arrow-loop"
  | "arrow-block"
  | "arrow-thin"
  | "arrow-line"
  | "arrow-handdrawn"
  | "arrow-flow"
  // Callouts
  | "callout-speech"
  | "callout-thought"
  | "callout-rounded-speech"
  | "callout-rectangle"
  | "callout-cloud"
  | "callout-annotation"
  | "callout-pointer"
  | "callout-caption"
  | "callout-quote"
  | "callout-comic"
  | "callout-label"
  // Badges & Labels
  | "banner"
  | "badge-ribbon"
  | "badge-folded-ribbon"
  | "badge-award"
  | "badge-shield"
  | "badge-seal"
  | "badge-burst"
  | "badge-starburst"
  | "badge-ticket"
  | "badge-tag"
  | "badge-bookmark"
  | "badge-flag"
  | "badge-pennant"
  | "badge-tab"
  | "badge-corner"
  | "badge-folded-corner"
  | "badge-number"
  | "badge-chapter"
  | "badge-topic"
  // Organic Shapes
  | "organic-blob-1"
  | "organic-blob-2"
  | "organic-blob"
  | "organic-wave"
  | "organic-cloud"
  | "organic-pebble"
  | "organic-leaf"
  | "organic-drop"
  | "organic-splash"
  | "organic-abstract"
  | "organic-brush"
  | "organic-brush-stroke"
  | "organic-torn-paper"
  | "organic-curved-panel"
  | "organic-fluid-bg"
  | "organic-wavy-container"
  // Educational Shapes
  | "edu-number-tile"
  | "edu-fraction-tile"
  | "edu-counting-block"
  | "edu-flash-card"
  | "edu-formula-box"
  | "edu-definition-card"
  | "edu-question-card"
  | "edu-answer-card"
  | "edu-observation-card"
  | "edu-diagram-label"
  | "edu-timeline-marker"
  | "edu-process-node"
  | "edu-step-marker"
  | "edu-comparison-cell"
  | "edu-venn-circle"
  | "edu-sequence-box"
  | "edu-mind-map-node"
  // Flowchart Shapes
  | "flow-process"
  | "flow-decision"
  | "flow-start-end"
  | "flow-input-output"
  | "flow-document"
  | "flow-database"
  | "flow-connector"
  | "flow-manual-operation"
  | "flow-delay"
  | "flow-preparation"
  | "flow-stored-data"
  // Mathematics Shapes
  | "math-number-line"
  | "math-coordinate-plane"
  | "math-axis"
  | "math-grid"
  | "math-fraction-circle"
  | "math-fraction-bar"
  | "math-angle"
  | "math-protractor-arc"
  | "math-triangle-diagram"
  | "math-quadrilateral"
  | "math-polygon"
  | "math-geometry-node"
  | "math-measurement-arrow"
  | "math-dimension-line"
  | "math-bracket"
  | "math-brace"
  // Lines
  | "line"
  | "line-straight"
  | "line-dashed"
  | "line-dotted"
  | "line-double"
  | "line-curved"
  | "line-bezier"
  | "line-free-curve"
  | "line-connector"
  | "line-elbow"
  | "line-orthogonal"
  | "line-handdrawn"
  // Paths
  | "path";

// Unified Vector Shape Engine Types
export type ShapeCornerStyle = "rounded" | "chamfer" | "concave" | "cut" | "soft";

export interface ShapeCornersConfig {
  linked?: boolean;
  topLeft?: number;
  topRight?: number;
  bottomLeft?: number;
  bottomRight?: number;
  radius?: number;
  style?: ShapeCornerStyle;
}

export type GradientStop = {
  offset: number; // 0 to 1
  color: string;
  opacity?: number;
};

export interface ShapeFillConfig {
  type: "solid" | "linear-gradient" | "radial-gradient" | "pattern" | "image" | "none";
  color?: string;
  angle?: number; // 0 to 360
  stops?: GradientStop[];
  cx?: number; // 0 to 1
  cy?: number; // 0 to 1
  radius?: number; // 0 to 1
  pattern?: "dots" | "grid" | "lines" | "diagonal-lines" | "waves" | "geometry";
  patternScale?: number;
  patternColor?: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain";
  imageZoom?: number;
  imageCrop?: { x: number; y: number; width: number; height: number };
  imageFocalX?: number;
  imageFocalY?: number;
}

export interface ShapeStrokeConfig {
  color?: string;
  width?: number;
  opacity?: number;
  alignment?: "center" | "inside" | "outside";
  dasharray?: string;
  linecap?: "butt" | "round" | "square";
  linejoin?: "miter" | "round" | "bevel";
  gradient?: {
    stops: GradientStop[];
    angle?: number;
  };
}

export interface ShapeShadowEffect {
  type: "dropShadow" | "innerShadow" | "ambientShadow" | "ambient" | "contactShadow" | "longShadow";
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
  opacity: number;
  inset?: boolean;
}

export interface ShapeGlowEffect {
  type: "glow";
  color: string;
  blur: number;
  spread?: number;
  intensity: number;
  inner?: boolean;
}

export interface ShapeElevationEffect {
  type: "elevation" | "elevation-1" | "elevation-2" | "elevation-3" | "elevation-4" | "elevation-5";
  level?: 1 | 2 | 3 | 4 | 5;
}

export interface ShapeDepth3DEffect {
  type: "depth3d";
  mode: "extrude" | "bevel" | "raised-edge" | "pressed" | "soft-plastic" | "paper-lift";
  depth: number;
  lightAngle?: number;
  highlightColor?: string;
  shadowColor?: string;
}

export interface ShapeGlassEffect {
  type: "glass";
  variant: "glass" | "frosted" | "translucent" | "tinted";
  blur: number;
  tintColor?: string;
  borderBrightness?: number;
}

export interface ShapePaperEffect {
  type: "paper";
  variant: "soft" | "layered" | "cut" | "raised" | "folded";
  intensity?: number;
}

export type ShapeEffectItem =
  | ShapeShadowEffect
  | ShapeGlowEffect
  | ShapeElevationEffect
  | ShapeDepth3DEffect
  | ShapeGlassEffect
  | ShapePaperEffect;

export interface ShapeTextConfig {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  color?: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  padding?: number;
  lineHeight?: number;
  autoFit?: "grow-shape" | "shrink-text" | "fixed-size" | "auto-fit";
}

export interface ShapeParametricConfig {
  polygonSides?: number;
  starPoints?: number;
  innerRadiusRatio?: number;
  headSize?: number;
  tailWidth?: number;
  curveAmount?: number;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  pointerX?: number;
  pointerY?: number;
  pointerWidth?: number;
  value?: number;
  label?: string;
  divisions?: number;
  fillRatio?: number;
}

export interface ElementStyle {
  // Typography
  fontFamily?: string;
  fontSize?: number;        // in points (pt)
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | number;
  fontStyle?: "normal" | "italic" | "oblique";
  lineHeight?: number;      // multiplier or pt
  letterSpacing?: number;   // in pt
  wordSpacing?: number;     // in pt
  textAlign?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "center" | "bottom";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through" | string;
  textDecorationStyle?: "solid" | "double" | "dotted" | "dashed" | "wavy";
  textDecorationColor?: string;
  baselineShift?: number;   // in pt
  columns?: number;         // 1, 2, 3
  columnGap?: number;       // in pt
  paragraphSpacing?: number;// in pt (spacing after)
  paragraphSpacingBefore?: number; // in pt (spacing before)
  textIndent?: {
    left?: number;
    right?: number;
    firstLine?: number;
    hanging?: number;
  };
  listStyle?: {
    type: "bullet" | "number" | "none";
    bulletVariant?: "circle" | "square" | "dash" | "arrow" | "check" | "star";
    numberVariant?: "decimal" | "padded" | "upper-alpha" | "lower-alpha" | "upper-roman" | "lower-roman";
  };
  textStroke?: {
    color: string;
    width: number;
    opacity?: number;
  };
  textGradient?: {
    enabled: boolean;
    type?: "linear" | "radial";
    angle?: number;
    stops: Array<{ offset: number; color: string; opacity?: number }>;
  };
  textShadows?: Array<{
    id: string;
    x: number;
    y: number;
    blur: number;
    color: string;
    opacity?: number;
  }>;
  textHighlight?: {
    color: string;
    opacity?: number;
    borderRadius?: number;
    padding?: number;
  };
  overflowMode?: "visible" | "hidden" | "shrink-to-fit" | "auto-grow";
  spellCheck?: boolean;
  lang?: string;
  styleId?: string;         // assigned paragraph / character style id
  color?: string;

  // Box appearance
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;     // in pt
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  borderRadius?: number;    // in pt
  borderLeft?: string;
  opacity?: number;         // 0 - 1
  boxShadow?: string;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Vector Geometry & Strokes
  shapeType?: VectorShapeType;
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeLinecap?: "butt" | "round" | "square";
  arrowStart?: boolean;
  arrowEnd?: boolean;
  pathData?: string;
  fillRule?: "nonzero" | "evenodd";
  polygonSides?: number;
  starPoints?: number;
  innerRadiusRatio?: number;

  // Unified Shape Engine Subsystems
  shapeFill?: ShapeFillConfig;
  shapeStroke?: ShapeStrokeConfig;
  shapeCorners?: ShapeCornersConfig;
  shapeEffects?: ShapeEffectItem[];
  shapeParams?: ShapeParametricConfig;
  shapeText?: ShapeTextConfig;
  isBackgroundElement?: boolean;

  // Non-Destructive Pixel Adjustments
  brightness?: number;      // 0 - 200, default 100
  contrast?: number;        // 0 - 200, default 100
  saturate?: number;        // 0 - 200, default 100
  exposure?: number;        // -100 to +100, default 0
  blur?: number;            // 0 - 20 pt, default 0
  grayscale?: number;       // 0 - 100 %, default 0
  sepia?: number;           // 0 - 100 %, default 0
  hueRotate?: number;       // 0 - 360 deg, default 0
  invert?: number;          // 0 - 100 %, default 0

  // Decorative / Image
  objectFit?: "cover" | "contain" | "fill";

  // Creative Studio Features
  blendMode?: BlendMode;
  textWrap?: TextWrapConfig;
  cornerConfig?: CornerConfig;
}

// Dynamic content payload for flexible element presets
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ElementContent = Record<string, any>;

// ==========================================
// ADAPTIVE LAYOUT & CONSTRAINT SYSTEM
// ==========================================

export type HorizontalConstraint = "left" | "center" | "right" | "left-right" | "scale";
export type VerticalConstraint = "top" | "center" | "bottom" | "top-bottom" | "scale";

export interface ElementConstraints {
  horizontal: HorizontalConstraint;
  vertical: VerticalConstraint;
}

// Layout Partner Position Modes (Part 2)
export type ElementPositionMode = "auto" | "assisted" | "manual" | "pinned" | "floating" | "locked";

// Semantic Constraints Engine (Part 7)
export interface ElementSemanticConstraints {
  keepTogether?: boolean;
  keepWithNext?: boolean;
  avoidPageBreak?: boolean;
  minWidthPt?: number;
  maxWidthPt?: number;
  minHeightPt?: number;
  preferredWidthPt?: number;
  preferredHeightPt?: number;
  safeMargin?: boolean;
  baselineAlignment?: boolean;
  columnSpan?: number | "all";
  aspectRatioLock?: boolean;
  priority?: LayoutPriority;
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "baseline";
  flowDirection?: LayoutDirection;
  wrapMode?: TextWrapMode;
  minSpacingPt?: number;
  maxSpacingPt?: number;
}

export type LayoutDirection = "vertical" | "horizontal" | "grid" | "wrap";
export type LayoutAlignment = "start" | "center" | "end" | "stretch";
export type LayoutDistribution =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type SizingMode = "fixed" | "fit-content" | "fill-parent";
export type LayoutPriority = "critical" | "flexible" | "optional";

export type LayoutRelationshipType =
  | "below"
  | "above"
  | "beside"
  | "inside"
  | "pinned"
  | "centered"
  | "fill"
  | "fit"
  | "equal-width"
  | "equal-spacing"
  | "follow"
  | "anchor";

export interface LayoutRelationship {
  type: LayoutRelationshipType;
  targetElementId: string;
  offsetPt?: number;
}

export interface AdaptiveGroupConfig {
  direction: LayoutDirection;
  spacingPt: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  alignment: LayoutAlignment;
  distribution: LayoutDistribution;
  widthMode: SizingMode;
  heightMode: SizingMode;
  columns?: number;
  wrap?: boolean;
}

export interface AdaptiveChildConfig {
  widthMode?: SizingMode;
  heightMode?: SizingMode;
  minWidthPt?: number;
  maxWidthPt?: number;
  minHeightPt?: number;
  maxHeightPt?: number;
  priority?: LayoutPriority;
  slotId?: string;
  relationship?: LayoutRelationship;
}

export interface PresetSlotDefinition {
  id: string;
  name: string;
  allowedTypes: ElementType[];
  required: boolean;
  order: number;
  description?: string;
}

export interface PageElement {
  /** Uniform reading size; inner layout reflows at physical width / scale. */
  responsiveLayout?: { scale: number };
  id: string;
  pageId: string;
  type: ElementType;
  category: ElementCategory;
  version: number;
  displayName: string;
  transform: ElementTransform;
  style: ElementStyle;
  presetId?: string;
  contentBlockId?: string; // Decoupled reference to structured content
  content: ElementContent; // Render payload (e.g. text content, items, options)
  locked: boolean;
  hidden: boolean;
  groupId?: string;
  comments?: CommentItem[];

  // Adaptive Layout & Constraints
  layoutMode?: "freeform" | "adaptive";
  positionMode?: ElementPositionMode;
  constraints?: ElementConstraints;
  semanticConstraints?: ElementSemanticConstraints;
  adaptiveGroup?: AdaptiveGroupConfig;
  adaptiveChild?: AdaptiveChildConfig;
  childElementIds?: string[];
  slotId?: string;
  isPlaceholder?: boolean;
  placeholderText?: string;

  // Text Wrapping (Part 4)
  textWrap?: TextWrapConfig;

  // Linked Text Flow (Part 5)
  linkedNextId?: string;
  linkedPrevId?: string;
  flowStoryId?: string;
  isOverset?: boolean;
  oversetChars?: number;
  columnCount?: number;
  columnGapPt?: number;
  smartBlockData?: SmartBlockInstance;

  // Dedicated Creative Layer Data (Non-destructive)
  curveData?: VectorCurveData;
  compoundData?: CompoundShapeData;
  pixelData?: PixelLayerData;
  adjustmentData?: AdjustmentLayerData;
  filterData?: LiveFilterData;
  aiMetadata?: AIGenerationMetadata;

  metadata?: {
    tags?: string[];
    gradeSuitability?: string[];
    dpiWarning?: boolean;
    effectiveDpi?: number;
    overflowWarning?: boolean;
    /** Set when the user edits appearance directly, so palette changes can leave it alone. */
    styleOverride?: boolean;
    referenceTemplate?: string;
    referenceRenderedText?: string;
    figureCaptionSource?: string;
    tocTargetId?: string;
    tokenStyleId?: string;
  };
}

export type DesignRole =
  | "chapter"
  | "heading"
  | "running"
  | "body"
  | "quote"
  | "learning"
  | "practice"
  | "table"
  | "figure"
  | "furniture";

export type DesignDecoration = "restrained" | "standard" | "expressive";
export type DesignSpacing = "tight" | "normal" | "generous";
export type DesignBorder = "none" | "hairline" | "standard";

/** Semantic colours shared by presets, thumbnails, and theme application. */
export interface DesignColorTokens {
  paper: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  accentTint: string;
  onAccent: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  calloutSurface: string;
  calloutBorder: string;
  calloutText: string;
  calloutLabel: string;
  mode: "light" | "dark" | "print";
}

/** Runtime binding stored on element content so render and export share one definition. */
export interface DesignBinding {
  composition: string;
  familyId: string;
  paletteId: string;
  role: DesignRole;
  calloutKey?: string;
  tokens: DesignColorTokens;
  showNumber: boolean;
  decoration: DesignDecoration;
  spacing: DesignSpacing;
  border: DesignBorder;
  editableFields: string[];
}

export interface ElementPreset {
  id: string;
  type: ElementType;
  name: string;
  category: ElementCategory;
  variant: string;
  description: string;
  defaultTransform: Omit<ElementTransform, "x" | "y" | "zIndex">;
  defaultStyle: ElementStyle;
  defaultContent: ElementContent;
  icon: string;
  gradeSuitability?: string[];
  subjectSuitability?: string[];
  layoutMode?: "freeform" | "adaptive";
  slots?: PresetSlotDefinition[];
  design?: {
    familyId: string;
    paletteId: string;
    role: DesignRole;
    use: string;
    tags: string[];
    structure: string;
    editableFields: string[];
  };
}

