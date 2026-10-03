/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - MATHS SMART TEMPLATE ENGINE
// Types and Schemas (Classes 1 to 5)
// ============================================================================

export type MathGrade = 1 | 2 | 3 | 4 | 5;

export type MathTopic =
  | "numbers"
  | "place-value"
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "operations"
  | "fractions"
  | "decimals"
  | "geometry"
  | "measurement"
  | "time"
  | "money"
  | "patterns"
  | "data"
  | "mental-maths"
  | "word-problems"
  | "activities"
  | "assessment";

export type MathTemplateType =
  | "visual-model"
  | "worked-example"
  | "practice"
  | "interactive"
  | "diagram"
  | "table"
  | "challenge"
  | "activity";

export type MathStyleVariant = "clean" | "color-coded" | "visual";

export type MathAnswerMode = "teacher" | "student";

export type NumberingSystem = "indian" | "international";

export interface MathConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "color" | "range" | "array-numbers" | "items";
  defaultValue: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface MathRendererProps {
  data: Record<string, any>;
  mode: MathAnswerMode;
  styleVariant: MathStyleVariant;
  width: number;
  height: number;
  elementId?: string;
  zoom?: number;
  onUpdateData?: (patch: Record<string, any>) => void;
}

export interface MathGeneratorRule {
  digitCount?: number;
  min?: number;
  max?: number;
  allowCarry?: boolean;
  allowBorrow?: boolean;
  difficulty?: "easy" | "medium" | "hard";
  operation?: "+" | "-" | "×" | "÷";
  questionsCount?: number;
  custom?: Record<string, any>;
}

export interface MathTemplate {
  id: string;
  name: string;
  category: MathTopic;
  subcategory?: string;
  grades: MathGrade[];
  grade?: MathGrade;
  chapterTag?: string;
  type: MathTemplateType;
  tags: string[];
  defaultData: Record<string, any>;
  defaultWidth: number;
  defaultHeight: number;
  /** Intrinsic height for editable content that grows as rows or text are added. */
  measureHeight?: (data: Record<string, any>, width: number) => number;
  styleVariants: MathStyleVariant[];
  renderer: React.FC<MathRendererProps>;
  configFields: MathConfigField[];
  propSchema?: MathConfigField[];
  a11yDescription?: string | ((data: Record<string, any>) => string);
  generator?: (rules: MathGeneratorRule) => Record<string, any>;
  previewSvgSnippet?: (data: Record<string, any>, variant: MathStyleVariant) => React.ReactNode;
}

export interface CustomMathTemplateEntry {
  id: string;
  name: string;
  baseTemplateId: string;
  category: MathTopic;
  grades: MathGrade[];
  data: Record<string, any>;
  styleVariant: MathStyleVariant;
  createdAt: string;
  appearance?: import("./mathEditableTree").MathAppearance;
  overrides?: Record<string, import("./mathEditableTree").MathPartOverride>;
  width?: number;
  height?: number;
  mode?: MathAnswerMode;
}
