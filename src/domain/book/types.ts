import type { PageFrame } from "../../editor/pageFrame/types";

export type WorkflowState =
  | "Draft"
  | "Writing"
  | "Content Review"
  | "Design"
  | "Academic Review"
  | "Corrections"
  | "Approved"
  | "Print Ready"
  | "Published";

export type BookType =
  | "Textbook"
  | "Workbook"
  | "Activity Book"
  | "Teacher Guide"
  | "Practice Book"
  | "Assessment Book"
  | "Worksheet Collection"
  | "Story Book"
  | "Reference Book";

export type GradeLevel =
  | "Nursery"
  | "LKG"
  | "UKG"
  | "Grade 1"
  | "Grade 2"
  | "Grade 3"
  | "Grade 4"
  | "Grade 5"
  | "Grade 6"
  | "Grade 7"
  | "Grade 8"
  | "Grade 9"
  | "Grade 10"
  | "Grade 11"
  | "Grade 12";

export type Subject =
  | "Science"
  | "Mathematics"
  | "English"
  | "Environmental Studies"
  | "Social Studies"
  | "Computer Science"
  | "General Knowledge"
  | "Hindi"
  | "Telugu";

export type PageSizePreset = "A4" | "A5" | "Letter" | "Custom";

export interface PageDimensions {
  widthPt: number;   // 72 pt = 1 inch
  heightPt: number;  // 72 pt = 1 inch
  name: string;
}

export interface Margins {
  topPt: number;
  bottomPt: number;
  insidePt: number;   // Gutter / Spine
  outsidePt: number;  // Edge
}

export interface Bleed {
  topPt: number;
  bottomPt: number;
  leftPt: number;
  rightPt: number;
}

export interface MasterPageDefinition {
  id: string;
  name: string;
  type:
    | "Normal"
    | "ChapterOpen"
    | "UnitOpen"
    | "Lesson"
    | "StandardContent"
    | "Activity"
    | "Exercise"
    | "Worksheet"
    | "Assessment"
    | "Revision"
    | "Workbook"
    | string;
  headerText?: string;
  footerText?: string;
  showPageNumber: boolean;
  pageNumberPosition: "left" | "center" | "right" | "outside";
  backgroundPreset?: string;
  margins: Margins;
  themeAccent?: string;
  badgeLabel?: string;
  gridColumns?: number;
}

export interface PageOverflowStatus {
  hasOverflow: boolean;
  message?: string;
  exceededByPt?: number;
  overflowAmountPt?: number;
  overflowingElementIds?: string[];
  suggestedActions?: string[];
}

export interface PageDefinition {
  /** Shared editable page artwork; null explicitly disables inheritance. */
  pageFrame?: PageFrame | null;
  id: string;
  pageIndex: number;          // 0-indexed in physical book
  displayNumber: string;      // e.g. "1", "i", "Cover"
  chapterId?: string;
  unitId?: string;
  masterPageId?: string;
  masterPreset?: string;
  templateId?: string;
  presetId?: string;
  layoutMode?: "freeform" | "adaptive";
  elementIds: string[];
  status: WorkflowState;
  notes?: string;
  overrideMargins?: Margins;
  overflowWarning?: PageOverflowStatus;
}

export interface Chapter {
  /** Apply editable reference ribbons to subsequently inserted chapter elements. */
  referenceElements?: boolean;
  /** Shared editable page artwork; null explicitly disables inheritance. */
  pageFrame?: PageFrame | null;
  id: string;
  unitId: string;
  number: number;
  title: string;
  subtitle?: string;
  learningObjectives: string[];
  pageIds: string[];
  framework?: import("../educational/curriculum").ChapterFramework;
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  description?: string;
  chapterIds: string[];
}

export interface TextStyleDefinition {
  id: string;
  name: string;
  category: "heading" | "body" | "caption" | "educational" | "question";
  fontFamily: string;
  fontSize: number;
  fontWeight: 300 | 400 | 500 | 600 | 700 | 800 | 900;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  basedOn?: string;
}

export interface BookComment {
  id: string;
  pageId?: string;
  elementId?: string;
  author: string;
  role: "Author" | "Editor" | "Designer" | "Reviewer";
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface Book {
  /** One-time upgrade to a shared editorial border; later manual choices persist. */
  premiumPageBorderVersion?: 1;
  pageFramePolicy?: 'book' | 'custom';
  /** One-time publisher image integration; preserves subsequent user edits/removal. */
  publisherBrandingVersion?: 1;
  /** Shared editable page artwork; null explicitly disables inheritance. */
  pageFrame?: PageFrame | null;
  id: string;
  title: string;
  subtitle?: string;
  grade: GradeLevel;
  subject: Subject;
  language: string;
  academicYear: string;
  type: BookType;
  orientation: "portrait" | "landscape";
  pageSize: PageSizePreset;
  dimensions: PageDimensions;
  margins: Margins;
  bleed: Bleed;
  bindingType: "Saddle Stitch" | "Perfect Bound" | "Hardcover" | "Spiral";
  spineWidthPt: number;
  themeId: string;
  units: Unit[];
  chapters: Chapter[];
  pages: PageDefinition[];
  masterPages: MasterPageDefinition[];
  globalTokens?: import("../theme/globalTokens").GlobalDesignTokens;
  numbering?: "continuous" | "front-matter";
  autoPagination?: boolean;
  textStyles?: TextStyleDefinition[];
  comments?: BookComment[];
  userGuides?: { id: string; type: "horizontal" | "vertical"; positionPt: number }[];
  designSystem?: {
    familyId: string;
    paletteId: string;
    decoration: "restrained" | "standard" | "expressive";
    spacing: "tight" | "normal" | "generous";
    border: "none" | "hairline" | "standard";
    showNumber: boolean;
  };
  createdAt: string;
  updatedAt: string;
  version: number;
  status: WorkflowState;
  coverImage?: string;
}

export const STANDARD_PAGE_SIZES: Record<PageSizePreset, PageDimensions> = {
  A4: { widthPt: 595.28, heightPt: 841.89, name: "A4 (210 × 297 mm)" },
  A5: { widthPt: 419.53, heightPt: 595.28, name: "A5 (148 × 210 mm)" },
  Letter: { widthPt: 612.0, heightPt: 792.0, name: "US Letter (8.5 × 11 in)" },
  Custom: { widthPt: 595.28, heightPt: 841.89, name: "Custom" },
};

export const DEFAULT_PRINT_MARGINS: Margins = {
  topPt: 36,     // 0.5 in
  bottomPt: 36,  // 0.5 in
  insidePt: 42,  // 0.58 in (gutter)
  outsidePt: 36, // 0.5 in
};

export const DEFAULT_BLEED: Bleed = {
  topPt: 9,      // 3mm = 8.5pt (~9pt)
  bottomPt: 9,
  leftPt: 9,
  rightPt: 9,
};
