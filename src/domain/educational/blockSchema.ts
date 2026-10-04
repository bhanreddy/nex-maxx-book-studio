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
  | "data-interpretation" | "reading-response" | "place-value" | "abacus"
  | "chapter-hero" | "mission-banner" | "curiosity-spark" | "concept-discovery" | "infographic-feature"
  | "activity-card" | "smart-table" | "vocabulary-bank" | "fact-burst" | "concept-comparison"
  | "mastery-rubric" | "exam-trainer" | "reflection-connect" | "writing-prompt" | "speaking-corner"
  | "stem-challenge" | "case-study" | "grammar-guide" | "map-study" | "lab-report";

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

export type ReferenceElementKind = "exercise" | "mental" | "quick-check" | "activity" | "example" | "puzzle" | "hots" | "refresh" | "dive-in" | "example-arrow"
  | "premium-exercise" | "premium-mental" | "premium-check" | "premium-activity" | "premium-challenge" | "premium-investigate"
  | "premium-discuss" | "premium-recap" | "premium-project" | "premium-reading" | "premium-vocabulary" | "premium-world";
export type ReferenceIcon = "check" | "book" | "target" | "bulb" | "puzzle" | "leaf" | "flask" | "globe" | "computer" | "none";
export interface ReferenceElementStyle {
  kind: ReferenceElementKind;
  icon?: ReferenceIcon;
  skillLabel?: string;
  number?: string;
  hint?: string;
  answerLabel?: string;
  answerLines?: number;
  showBody?: boolean;
}

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
  /** Optional v4 publishing identity; older preset IDs remain valid. */
  educationalType?: string;
  lessonStage?: "start" | "discover" | "learn" | "think" | "practice" | "activity" | "review";
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

export interface LessonSchemaTopic {
  id: string;
  label: string;
  icon: "number" | "book" | "leaf" | "globe" | "flask" | "computer" | "shapes" | "music" | "star";
  color: string;
}

export interface LearningOutcomeTopic {
  id: string;
  verb: string;
  text: string;
  icon: string;
  color: string;
  isEmpty?: boolean;
}

export interface StudySkillTopic {
  id: string;
  text: string;
  isEmpty?: boolean;
  prefix?: string;
  note?: string;
}

export interface EducationalImage extends ImageTreatment {
  src?: string; alt?: string; caption?: string;
  focalX?: number; focalY?: number; scale?: number; opacity?: number; rotation?: number;
  rawWidthPx?: number; rawHeightPx?: number; originalSrc?: string; maskDataUrl?: string;
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
    /** Stable topic IDs retain empty boxes, colour and icon choices when reordered. */
    lessonSchemaTopics?: LessonSchemaTopic[];
    /** Stable learning outcome topics with action verb, description, custom icon and empty space support. */
    learningOutcomeTopics?: LearningOutcomeTopic[];
    /** Fully editable study skill rules/facts with custom empty spaces. */
    studySkillTopics?: StudySkillTopic[];
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
    badgeLabel?: string;
    illustrationUrl?: string;
    /** Photo kept so a chapter illustration can be restored after background removal. */
    illustrationOriginalUrl?: string;
    imageOffsetX?: number;
    imageOffsetY?: number;
    imageScale?: number;
    imageFlipX?: boolean;
    materials?: string[];
    numberValue?: number;
    numberSystem?: "indian" | "international";
    passage?: string;
    hint?: string;
    quote?: string;
    prediction?: string;
    reveal?: string;
    finalAnswer?: string;
    difficulty?: string;
    vocabulary?: Array<{ word: string; pronunciation?: string; meaning: string; example?: string }>;
    formula?: { expression: string; variables?: string[]; units?: string; diagram?: "rectangle" | "triangle" | "none" };
    images?: EducationalImage[];
    annotations?: Array<{ imageIndex: number; x: number; y: number; label: string }>;
    comparison?: { leftLabel: string; rightLabel: string; left: string[]; right: string[] };
    grid?: { rows: string[]; clues: string[]; solution?: string[] };
  };

  // Visual Overrides & Adaptive Sizing
  styleOverrides: {
    /** Saved colour treatment for an original reference-artwork banner. */
    referenceBannerColour?: string;
    referenceBannerVersion?: "original" | "editable" | "blank";
    /** Presentation-only continuation window. Canonical curriculum content stays complete. */
    sceneSlice?: { from: number; to: number };
    referenceElement?: ReferenceElementStyle;
    themeId?: string;
    paletteId?: string;
    printMode?: "colour" | "reduced-ink" | "grayscale";
    answerSpacePt?: number;
    illustration?: "number-city" | "botanical" | "geometry" | "none";
    decorationOpacity?: number;
    illustrationPreset?: string;
    backgroundImage?: { src: string; alt: string; focalX: number; focalY: number; opacity: number; scale: number; rawWidthPx?: number; rawHeightPx?: number };
    motifs?: BlockMotif[];
    /** Logical layout dimensions, scaled into the physical element frame. */
    resizeFrame?: { width: number; height: number };
    /** Width reflows content; height fits its reading size into the frame. */
    responsiveResize?: boolean;
    /** Compact insertion scale, baked into scene geometry before pagination/export. */
    compactScale?: number;
    /** Authored text/image positions stay inside the original block, without detaching it. */
    contentLayout?: {
      enabled: boolean;
      items: Record<string, { base: string; dx: number; dy: number; text?: string; src?: string }>;
    };
    layoutVariant?: string;
    /** Premium treatments preserve the authored layout beneath them. */
    premiumBaseLayout?: string;
    premiumBaseContentLayout?: boolean;
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
    paddingPt?: number;
    spacingPt?: number;
    borderWidthPt?: number;
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
