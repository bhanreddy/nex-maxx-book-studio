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
  | "rectangle"
  | "circle"
  | "ellipse"
  | "pill"
  | "star"
  | "polygon"
  | "line"
  | "arrow"
  | "path"
  | "banner";

export interface ElementStyle {
  // Typography
  fontFamily?: string;
  fontSize?: number;        // in points (pt)
  fontWeight?: 300 | 400 | 500 | 600 | 700 | 800 | 900;
  fontStyle?: "normal" | "italic";
  lineHeight?: number;      // multiplier or pt
  letterSpacing?: number;   // in pt
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";
  baselineShift?: number;   // in pt
  columns?: number;         // 1, 2, 3
  columnGap?: number;       // in pt
  paragraphSpacing?: number;// in pt
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
  polygonSides?: number;
  starPoints?: number;
  innerRadiusRatio?: number;

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


