// Creative Studio Domain Types (Vector, Pixel, Layout, AI)

export type StudioId = "LAYOUT" | "VECTOR" | "PIXEL" | "AI" | "BOOK" | "REVIEW" | "PREFLIGHT" | "EXPORT";

export type BlendMode =
  | "normal"
  | "darken"
  | "multiply"
  | "color-burn"
  | "linear-burn"
  | "lighten"
  | "screen"
  | "color-dodge"
  | "overlay"
  | "soft-light"
  | "hard-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

// Bézier Node representation for vector curves
export type CurveNodeType = "sharp" | "smooth" | "smart";

export interface CurveNode {
  id: string;
  x: number; // in pt relative to element origin
  y: number; // in pt relative to element origin
  type: CurveNodeType;
  handleIn?: { x: number; y: number }; // vector handle in (pt relative to node)
  handleOut?: { x: number; y: number }; // vector handle out (pt relative to node)
}

export interface VectorCurveData {
  nodes: CurveNode[];
  closed: boolean;
  windingRule?: "nonzero" | "evenodd";
}

// Boolean & Compound shapes
export type BooleanOpType = "union" | "subtract" | "intersect" | "xor" | "divide";

export interface CompoundShapeData {
  operation: BooleanOpType;
  childrenIds: string[];
  isLive: boolean; // if true, live updates when children move
}

// Corner tool parameters
export type CornerType = "rounded" | "chamfer" | "concave" | "cut";
export interface CornerConfig {
  type: CornerType;
  radiusPt: number;
}

// Pixel Layer Data
export interface PixelLayerData {
  dataUrl: string; // Base64 PNG/WebP raster data
  widthPx: number;
  heightPx: number;
  maskDataUrl?: string; // Grayscale bitmap mask
  maskEnabled?: boolean;
}

// Retouch & Inpainting Patch
export interface InpaintingPatch {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceX: number;
  sourceY: number;
  featherPt: number;
  dataUrl: string;
}

// Adjustment Layer Types
export type AdjustmentType =
  | "brightness-contrast"
  | "levels"
  | "curves"
  | "exposure"
  | "hsl"
  | "black-white"
  | "recolor"
  | "invert"
  | "threshold"
  | "gradient-map";

export interface AdjustmentLayerData {
  adjustmentType: AdjustmentType;
  params: {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    exposure?: number; // -3 to 3
    hue?: number; // -180 to 180
    saturation?: number; // -100 to 100
    lightness?: number; // -100 to 100
    blackPoint?: number; // 0 to 255
    whitePoint?: number; // 0 to 255
    gamma?: number; // 0.1 to 5.0
    threshold?: number; // 0 to 255
    color?: string; // hex
  };
  maskDataUrl?: string;
  maskEnabled?: boolean;
}

// Live Filter Types
export type LiveFilterType =
  | "gaussian-blur"
  | "motion-blur"
  | "radial-blur"
  | "sharpen"
  | "unsharp-mask"
  | "high-pass"
  | "noise-reduction"
  | "vignette";

export interface LiveFilterData {
  filterType: LiveFilterType;
  radiusPt: number;
  amount: number;
  angleDeg?: number;
  maskDataUrl?: string;
  maskEnabled?: boolean;
}

// Text Wrap Configuration (Part 4 - Professional Text Wrapping)
export type TextWrapMode =
  | "none"
  | "box"
  | "square"
  | "tight"
  | "contour"
  | "through"
  | "top-bottom"
  | "largest-side"
  | "inline"
  | "floating";

export interface TextWrapConfig {
  mode: TextWrapMode;
  offsetPt: number; // default overall margin
  topOffsetPt?: number;
  bottomOffsetPt?: number;
  leftOffsetPt?: number;
  rightOffsetPt?: number;
  wrapMarginPt?: number;
  customContourPoints?: Array<{ x: number; y: number }>;
  contourPath?: string;
  invertWrap?: boolean;
}

// AI Engine Data & Metadata
export type AIAssetStyle =
  | "scientific-diagram"
  | "educational-illustration"
  | "cartoon-mascot"
  | "watercolor"
  | "flat-math"
  | "realistic-photo"
  | "historical-engraving"
  | "line-art-coloring";

export type AIAspectRatio = "1:1" | "4:3" | "16:9" | "3:4" | "9:16";

export interface AIGenerationMetadata {
  id: string;
  prompt: string;
  negativePrompt?: string;
  provider: string; // e.g. "nex-maxx-edu-ai", "stability", "local"
  model: string;
  style: AIAssetStyle;
  aspectRatio: AIAspectRatio;
  seed: number;
  timestamp: string;
  gradeLevel?: string;
  subject?: string;
  variations?: string[]; // Data URLs of alternative outputs
  selectedVariationIndex?: number;
  isExpanded?: boolean; // Generative expand outpainted result
  isFill?: boolean; // Generative fill inpainted result
  sourceImageId?: string; // Bound original image before edit
  vectorSvgContent?: string; // If true vector generation
  tokensUsed?: number;
  status: "idle" | "generating" | "ready" | "failed";
}

// Pixel Selection State
export interface PixelSelectionState {
  active: boolean;
  type: "marquee" | "ellipse" | "lasso" | "wand" | "subject";
  path?: { x: number; y: number }[];
  bounds?: { x: number; y: number; width: number; height: number };
  featherPt: number;
}
