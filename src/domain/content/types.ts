export type ContentType =
  | "heading"
  | "paragraph"
  | "objective"
  | "concept"
  | "activity"
  | "experiment"
  | "callout"
  | "definition"
  | "vocabulary"
  | "question"
  | "summary"
  | "table"
  | "image_prompt";

export interface ContentBlock {
  id: string;
  bookId: string;
  unitId?: string;
  chapterId?: string;
  type: ContentType;
  title?: string;
  body: string;
  items?: string[];
  attributes?: {
    marks?: number;
    difficulty?: "Easy" | "Medium" | "Challenging";
    answer?: string;
    explanation?: string;
    options?: string[];
    term?: string;
    pronunciation?: string;
    materialsRequired?: string[];
    steps?: string[];
  };
  tags?: string[];
  linkedElementIds: string[]; // Page elements rendering this content block
  createdAt: string;
  updatedAt: string;
}

export interface ContentOutlineNode {
  id: string;
  type: "unit" | "chapter" | "block";
  title: string;
  children?: ContentOutlineNode[];
  blockRef?: ContentBlock;
}
