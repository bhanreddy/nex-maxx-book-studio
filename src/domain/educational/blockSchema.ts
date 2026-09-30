import type { ImageTreatment } from "../../editor/educational/imageTreatment";
import { ElementTransform } from "../element/types";

/**
 * NEX MAXX Book Studio - Educational Design Block Schema
 * Core architectural foundation for the Educational Block System.
 * Ensures strict separation: CONTENT (Semantic SSoT) != DESIGN (Visual Representation).
 */

export type EducationalBlockCategory =
  | "chapter-structure"
  | "learning-outcomes"
  | "warm-up"
  | "concept-map"
  | "study-skills"
  | "quick-check"
  | "activity-lab"
  | "mental-maths"
  | "exercises"
  | "worked-examples"
  | "puzzles-fun"
  | "facts-curiosity"
  | "real-world-connect"
  | "critical-thinking"
  | "collaboration"
  | "reflection"
  | "common-mistakes"
  | "revision-recap"
  | "assessment-mastery"
  | "projects"
  | "ai-explore"
  | "unit-opening" | "section-heading" | "prerequisites" | "essential-question"
  | "concept-explanation" | "vocabulary" | "guided-practice" | "partner-activity"
  | "investigation" | "visual-reasoning" | "extension" | "self-assessment"
  | "exit-ticket" | "cross-subject" | "home-learning" | "diagram-study"
  | "data-interpretation" | "reading-response" | "place-value" | "abacus";

export type DesignFamily =
  | "nex-future"      // Modern geometric, tech-oriented, clean grids (Math / Computing / Physics)
  | "nex-play"        // Friendly rounded forms, playful motifs (Nursery to Grade 3)
  | "nex-editorial"   // Premium typography, structured publishing grids (Grade 5+)
  | "nex-discovery" | "nex-spectrum" | "nex-studio";  // Organic curves, nature & scientific exploration (EVS / Bio / Geography)

export type SubjectDomain =
  | "mathematics"
  | "science"
  | "english"
  | "social-studies"
  | "environmental"
  | "early-learning"
  | "computer-science"
  | "general";

export type GradeBand =
  | "early-years"     // Nursery - UKG
  | "primary-lower"   // Grades 1 - 2
  | "primary-upper"   // Grades 3 - 5
  | "middle-school"   // Grades 6 - 8
  | "secondary-plus"; // Grades 9+

export interface BlockBackgroundSpec {
  type: "solid" | "gradient" | "mesh" | "card" | "bordered" | "subtle-tint" | "none";
  color?: string;
  gradient?: {
    from: string;
    to: string;
    directionDeg?: number;
  };
  borderColor?: string;
  borderWidthPt?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  cornerRadiusPt?: number;
  patternOverlay?: "dots" | "grid" | "isometric" | "waves" | "none";
  patternOpacity?: number; // 0.0 - 1.0
  hasContrastProtection?: boolean;
  veilOpacity?: number;
}

export type SlotContentType =
  | "text"
  | "rich-text"
  | "item-list"
  | "steps-list"
  | "icon"
  | "image"
  | "qr-code"
  | "badge"
  | "key-value";

export interface BlockSlotDefinition {
  slotId: string;
  label: string;
  type: SlotContentType;
  required: boolean;
  defaultContent: unknown;
  constraints?: {
    maxCharacters?: number;
    minItems?: number;
    maxItems?: number;
    allowedIcons?: string[];
  };
}

export interface EducationalBlockDefinition {
  id: string;                      // e.g. "outcomes-cards-v1"
  archetypeId: EducationalBlockCategory; // e.g. "learning-outcomes"
  version: number;
  name: string;                    // e.g. "Success Targets (Cards)"
  family: DesignFamily;
  category: EducationalBlockCategory;
  supportedSubjects: SubjectDomain[];
  supportedGrades: GradeBand[];
  tags: string[];
  thumbnailSvg?: string;
  description?: string;
  collectionVersion?: number;
  /** Atelier skin id. When set, the scene dispatcher uses that composition. */
  skinId?: string;
  minDimensions: { widthPt: number; heightPt: number };
  defaultDimensions: { widthPt: number; heightPt: number };
  
  reflowRules: {
    maxItemsBeforeTwoColumns?: number;
    maxItemsBeforeScrollOrScale?: number;
    verticalGrowthStrategy: "expand-container" | "scale-typography" | "compact-rows";
    illustrationPosition?: "left" | "right" | "top" | "floating-corner" | "none";
    layoutVariant: string; // e.g. "cards", "orbit", "timeline", "checklist", "split"
  };

  defaultBackgroundStyle: BlockBackgroundSpec;
  slots: BlockSlotDefinition[];
}

/**
 * Concrete instance placed onto a textbook page.
 * Strictly separates the semantic curriculum content from visual styling.
 */
/** A plate, photograph, or content shape the author can drag inside a block. */
export interface BlockMotif extends ImageTreatment {
  id: string;
  role: "plate" | "photo" | "illustration" | "capsule" | "bubble";
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  locked: boolean;
  hidden?: boolean;
  opacity: number;
  /** Author moved this motif, so a resize no longer scales it from the original layout. */
  nudged?: boolean;
  originWidth?: number;
  /** Drawn before the reading text. */
  behind?: boolean;
  focalX?: number;
  focalY?: number;
  scale?: number;
  src?: string;
  alt?: string;
  rawWidthPx?: number;
  rawHeightPx?: number;
}

export interface SmartBlockInstance {
  id: string;                     // Unique instance UUID
  curriculum?: import("./curriculum").CurriculumMetadata;
  pageId: string;
  archetypeId: EducationalBlockCategory;
  presetId: string;               // Current visual template preset ID
  family: DesignFamily;
  subject: SubjectDomain;
  gradeBand: GradeBand;
  isDetached: boolean;            // If detached, behaves as standard ungrouped page elements
  isLockedContent: boolean;       // Curriculum lock: designers can edit styles but not text
  isLockedDesign: boolean;        // Content lock: editors can alter text without moving layout

  transform: ElementTransform;

  // Semantic Curriculum Content (Single Source of Truth)
  semanticContent: {
    unitBadge?: string;
    title: string;
    subtitle?: string;
    introText?: string;
    items?: string[];
    steps?: Array<{ stepNumber: number; title: string; body: string; tag?: string }>;
    questions?: Array<{ prompt: string; options?: string[]; answer?: string; points?: number }>;
    calloutText?: string;
    footnote?: string;
    iconName?: string;
    illustrationAssetId?: string;
    illustrationAssetRef?: {assetId:string;revision:number;checksum:string};
    qrUrl?: string;
    metadata?: Record<string, unknown>;
    chapterNumber?: string;
    materials?: string[];
    numberValue?: number;
    numberSystem?: "indian" | "international";
    passage?: string;
  };

  // Visual Overrides & Adaptive Sizing
  styleOverrides: {
    /** Presentation-only continuation window. Canonical curriculum content stays complete. */
    sceneSlice?: { from: number; to: number };
    themeId?: string;
    paletteId?: string;
    printMode?: "colour" | "reduced-ink" | "grayscale";
    answerSpacePt?: number;
    illustration?: "number-city" | "botanical" | "geometry" | "none";
    decorationOpacity?: number;
    backgroundImage?: { src: string; alt: string; focalX: number; focalY: number; opacity: number; scale: number; rawWidthPx?: number; rawHeightPx?: number };
    motifs?: BlockMotif[];
    layoutVariant?: string;
    /** Independent presentation treatment. Missing values preserve older books. */
    blockStyle?: import("./curriculum").BlockVisualStyle;
    customPalette?: {
      primary?: string;
      accent?: string;
      surface?: string;
      text?: string;
      border?: string;
    };
    cornerRadiusPt?: number;
    backgroundSpec?: Partial<BlockBackgroundSpec>;
    fontFamily?: string;
    fontSizeScale?: number; // multiplier, default 1.0
    hudStyle?: {
      chamfer?: "none" | "notch-8px" | "notch-14px" | "rounded-12px";
      showBrackets?: boolean;
      showTelemetry?: boolean;
      glowIntensity?: "subtle" | "vibrant" | "cyberpunk";
    };
  };
}
