import { PageElement } from "../element/types";

export interface CustomLayoutPlaceholder {
  elementId: string;
  key: string; // e.g. "title", "subtitle", "body", "image", "question", "answer"
  label: string;
  type: "text" | "image" | "number" | "shape";
  defaultValue?: string;
}

export type CustomLayoutCategory =
  | "chapter"
  | "mathematics"
  | "science"
  | "interactive"
  | "worksheet"
  | "assessment"
  | "general";

export interface CustomLayoutDefinition {
  id: string;
  name: string;
  category: CustomLayoutCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
  pageDimensions: { widthPt: number; heightPt: number };
  elements: PageElement[]; // Snapshot of relative elements with normalized offsets
  placeholders: CustomLayoutPlaceholder[];
  tags: string[];
}
