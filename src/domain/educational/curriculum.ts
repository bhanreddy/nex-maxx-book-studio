import type { SmartBlockInstance } from "./blockSchema";

export type FrameworkStage = "discover" | "target" | "learn" | "build" | "apply" | "think" | "master" | "reflect";
export type CurriculumCategory = FrameworkStage | "activities" | "assessment" | "visuals" | "enrichment" | "digital" | "chapter-sets" | "reading-writing" | "maths" | "science" | "projects";
export type CurriculumGrade = 'NURSERY' | 'LKG' | 'UKG' | 1 | 2 | 3 | 4 | 5;
export const CURRICULUM_GRADES:CurriculumGrade[]=['NURSERY','LKG','UKG',1,2,3,4,5];
export function curriculumGradeRank(grade:CurriculumGrade){return typeof grade==='number'?grade:grade==='NURSERY'?-2:grade==='LKG'?-1:0;}
export function curriculumGradeLabel(grade:CurriculumGrade){return typeof grade==='number'?`Grade ${grade}`:grade==='NURSERY'?'Nursery':grade;}
export function curriculumGradeCode(grade:CurriculumGrade){return typeof grade==='number'?`GRADE_${grade}`:grade;}
export type ChapterPersonality = "playful" | "bright-academic" | "modern-editorial" | "illustrated" | "minimal-premium" | "nature" | "science-explorer" | "mathematical" | "storybook" | "custom";
export type ChapterComplexity = "compact" | "standard" | "rich" | "premium";
export type ChapterPreset = "balanced" | "activity-rich" | "concept-heavy" | "story-led" | "premium-nex";
export type TeachingLayout = "picture-side" | "picture-top" | "big-idea" | "example-cards" | "guided-steps" | "compare-panels" | "question-cards" | "reading-focus" | "activity-board" | "reminder-panel";
export type BlockVisualStyle = "colourful" | "calm" | "storybook" | "classic";
export type CurriculumLayout = TeachingLayout | "panorama" | "asymmetric" | "editorial" | "visual-first" | "split" | "journey" | "constellation" | "steps" | "notebook" | "workmat" | "conversation" | "question" | "progression" | "snapshot" | "confidence" | "digital" | "comparison-table" | "timeline" | "writing-sheet" | "reading-page" | "experiment-sheet" | "sorting-board";

export interface ChapterBuilderConfig {
  grade: CurriculumGrade;
  subject: string;
  title: string;
  unit: string;
  theme: string;
  pageCount: number;
  learningOutcomes: string[];
  concepts: string[];
  personality: ChapterPersonality;
  complexity: ChapterComplexity;
  preset: ChapterPreset;
  brandAccent?: string;
}

export interface CurriculumMetadata {
  type: string;
  frameworkStage: FrameworkStage;
  grade: CurriculumGrade;
  subjectLabel: string;
  chapterId?: string;
  sourceBlockId?: string;
  locked?: boolean;
  hidden?: boolean;
  learningOutcomeIds: string[];
  difficulty: "start" | "build" | "use" | "think" | "challenge";
  hierarchy: "primary" | "secondary" | "supporting" | "decorative";
  assessmentMetadata?: { competency: string; formative: boolean; totalPoints?: number };
  digitalExtension?: { url: string; duration: string; contentType: string; cta: string; icon: string; qrImageSrc?: string };
  pageRules: { startOnNewPage?: boolean; keepTogether: boolean; continuationOf?: string };
}

/** Canonical content lives here. Page smart blocks are editable projections of these records. */
export interface ChapterFramework {
  assetReferences?: {assetId:string;revision:number;checksum:string}[];
  questionReferences?: {blockId:string;questionId:string;revision:number;checksum:string}[];
  version: 1;
  planVersion?: 2;
  config: ChapterBuilderConfig;
  mode: "easy" | "design";
  sections: { id: string; stage: FrameworkStage; title: string; blockIds: string[] }[];
  blocks: Record<string, SmartBlockInstance>;
  compositionRevision: number;
}

export interface CurriculumBlockDefinition {
  id: string;
  name: string;
  category: CurriculumCategory;
  stage: FrameworkStage;
  archetype: SmartBlockInstance["archetypeId"];
  purpose: string;
  layouts: CurriculumLayout[];
  tags: string[];
  originalStage?: FrameworkStage;
  originalName?: string;
  isNew?: boolean;
  starterContent?: Partial<SmartBlockInstance["semanticContent"]>;
}

export type ContentDensity = "Light" | "Balanced" | "Dense" | "Overloaded";
