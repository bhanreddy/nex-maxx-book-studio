// ============================================================================
// NEX MAXX BOOK STUDIO - PRIMARY MATHS COMPLETE TEMPLATE CATALOGUE
// Classes 1 to 5 + Pedagogical Layout Blocks (~69 templates)
// ============================================================================

import type { MathTemplate } from "../types";
import { CLASS_1_TEMPLATES } from "./class1Templates";
import { CLASS_2_TEMPLATES } from "./class2Templates";
import { CLASS_3_TEMPLATES } from "./class3Templates";
import { CLASS_4_TEMPLATES } from "./class4Templates";
import { CLASS_5_TEMPLATES } from "./class5Templates";
import { LAYOUT_BLOCK_TEMPLATES } from "./layoutBlocks";

export * from "./class1Templates";
export * from "./class2Templates";
export * from "./class3Templates";
export * from "./class4Templates";
export * from "./class5Templates";
export * from "./layoutBlocks";

export const CATALOGUE_TEMPLATES: MathTemplate[] = [
  ...CLASS_1_TEMPLATES,
  ...CLASS_2_TEMPLATES,
  ...CLASS_3_TEMPLATES,
  ...CLASS_4_TEMPLATES,
  ...CLASS_5_TEMPLATES,
  ...LAYOUT_BLOCK_TEMPLATES,
];
