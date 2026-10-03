// ==========================================
// NEXMAXX BOOK STUDIO — PROFESSIONAL TYPOGRAPHY CATALOG & ENGINE DEFINITIONS
// ==========================================

import { ElementStyle } from "../../domain/element/types";
import { TextStyleDefinition } from "../../domain/book/types";

export type FontCategory =
  | "Serif"
  | "Sans Serif"
  | "Display"
  | "Handwriting"
  | "Monospace"
  | "Educational";

export interface FontDefinition {
  family: string;
  category: FontCategory;
  weights: number[];
  isBundled: boolean;
  sampleText?: string;
  isVariable?: boolean;
}

export const FONT_CATALOG: FontDefinition[] = [
  // --- Serif ---
  { family: "Noto Serif", category: "Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "Classic publishing elegance" },
  { family: "Merriweather", category: "Serif", weights: [300, 400, 700, 900], isBundled: true, sampleText: "Designed for editorial legibility" },
  { family: "EB Garamond", category: "Serif", weights: [400, 500, 600, 700, 800], isBundled: true, sampleText: "Humanist renaissance book type" },
  { family: "Libre Baskerville", category: "Serif", weights: [400, 700], isBundled: true, sampleText: "Traditional textbook serif" },
  { family: "Fraunces", category: "Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, isVariable: true, sampleText: "Warm contemporary display serif" },
  { family: "Georgia", category: "Serif", weights: [400, 700], isBundled: false, sampleText: "Clear on-screen & print serif" },
  { family: "Times New Roman", category: "Serif", weights: [400, 700], isBundled: false, sampleText: "Standard academic publication" },

  // --- Sans Serif ---
  { family: "Inter", category: "Sans Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, isVariable: true, sampleText: "Ultra-clean modern textbook" },
  { family: "Outfit", category: "Sans Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "Geometric premium book headers" },
  { family: "Noto Sans", category: "Sans Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "Global universal clarity" },
  { family: "Nunito", category: "Sans Serif", weights: [200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "Friendly rounded educational text" },
  { family: "Libre Franklin", category: "Sans Serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "Authoritative editorial sans" },
  { family: "Source Sans 3", category: "Sans Serif", weights: [200, 300, 400, 600, 700, 900], isBundled: true, sampleText: "Engineered for complex workbooks" },
  { family: "IBM Plex Sans", category: "Sans Serif", weights: [100, 200, 300, 400, 500, 600, 700], isBundled: true, sampleText: "Industrial precision & STEM text" },
  { family: "Arial", category: "Sans Serif", weights: [400, 700], isBundled: false, sampleText: "Standard clean sans" },
  { family: "Helvetica", category: "Sans Serif", weights: [300, 400, 700], isBundled: false, sampleText: "Neutral Swiss modernist layout" },
  { family: "Trebuchet MS", category: "Sans Serif", weights: [400, 700], isBundled: false, sampleText: "High x-height workbook sans" },

  // --- Display ---
  { family: "Montserrat", category: "Display", weights: [400, 600, 700, 800, 900], isBundled: false, sampleText: "Bold cover typography" },
  { family: "Oswald", category: "Display", weights: [400, 600, 700], isBundled: false, sampleText: "Condensed high-impact title" },
  { family: "Impact", category: "Display", weights: [400, 700, 900], isBundled: false, sampleText: "Heavy visual textbook title" },

  // --- Handwriting ---
  { family: "Caveat", category: "Handwriting", weights: [400, 600, 700], isBundled: false, sampleText: "Teacher notes & student callouts" },
  { family: "Kalam", category: "Handwriting", weights: [300, 400, 700], isBundled: false, sampleText: "Informal handwritten exercises" },
  { family: "Comic Sans MS", category: "Handwriting", weights: [400, 700], isBundled: false, sampleText: "Playful elementary activity" },

  // --- Monospace ---
  { family: "Courier New", category: "Monospace", weights: [400, 700], isBundled: false, sampleText: "Typewriter & computational code" },
  { family: "Menlo", category: "Monospace", weights: [400, 700], isBundled: false, sampleText: "Fixed-width STEM table data" },
  { family: "Consolas", category: "Monospace", weights: [400, 700], isBundled: false, sampleText: "Computer science textbook lines" },

  // --- Educational & Regional ---
  { family: "Noto Sans Telugu", category: "Educational", weights: [100, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "తెలుగు వర్ణమాల మరియు పాఠ్యాంశాలు" },
  { family: "Noto Sans Devanagari", category: "Educational", weights: [100, 300, 400, 500, 600, 700, 800, 900], isBundled: true, sampleText: "हिंदी पाठ्यपुस्तक एवं शिक्षण सामग्री" },
];

export const FONT_CATEGORIES: FontCategory[] = [
  "Sans Serif",
  "Serif",
  "Educational",
  "Display",
  "Handwriting",
  "Monospace",
];

export const FONT_WEIGHTS = [
  { value: 100, label: "100 — Thin" },
  { value: 200, label: "200 — Extra Light" },
  { value: 300, label: "300 — Light" },
  { value: 400, label: "400 — Regular" },
  { value: 500, label: "500 — Medium" },
  { value: 600, label: "600 — Semi Bold" },
  { value: 700, label: "700 — Bold" },
  { value: 800, label: "800 — Extra Bold" },
  { value: 900, label: "900 — Black" },
];

export const FONT_PRESET_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144, 200,
];

export const LINE_HEIGHT_PRESETS = [
  { label: "Tight (1.0)", value: 1.0 },
  { label: "Compact (1.15)", value: 1.15 },
  { label: "Heading (1.25)", value: 1.25 },
  { label: "Editorial (1.4)", value: 1.4 },
  { label: "Standard (1.5)", value: 1.5 },
  { label: "Relaxed (1.75)", value: 1.75 },
  { label: "Double (2.0)", value: 2.0 },
];

export const LETTER_SPACING_PRESETS = [
  { label: "-2pt", value: -2 },
  { label: "-1pt", value: -1 },
  { label: "0 (Normal)", value: 0 },
  { label: "+0.5pt", value: 0.5 },
  { label: "+1pt", value: 1 },
  { label: "+2pt", value: 2 },
  { label: "+4pt", value: 4 },
  { label: "+8pt", value: 8 },
];

// ==========================================
// TEXT SHADOW PRESETS
// ==========================================

export interface TextShadowPreset {
  id: string;
  name: string;
  x: number;
  y: number;
  blur: number;
  color: string;
}

export const TEXT_SHADOW_PRESETS: TextShadowPreset[] = [
  { id: "soft", name: "Soft", x: 0, y: 2, blur: 4, color: "rgba(0,0,0,0.22)" },
  { id: "elevated", name: "Elevated", x: 0, y: 4, blur: 8, color: "rgba(0,0,0,0.28)" },
  { id: "floating", name: "Floating", x: 0, y: 8, blur: 16, color: "rgba(0,0,0,0.32)" },
  { id: "deep", name: "Deep", x: 0, y: 12, blur: 24, color: "rgba(0,0,0,0.45)" },
  { id: "crisp", name: "Crisp", x: 2, y: 2, blur: 0, color: "rgba(0,0,0,0.4)" },
  { id: "editorial", name: "Editorial", x: 1, y: 1, blur: 2, color: "rgba(15,23,42,0.3)" },
  { id: "subtle", name: "Subtle", x: 0, y: 1, blur: 2, color: "rgba(0,0,0,0.15)" },
  { id: "long-shadow", name: "Long Shadow", x: 4, y: 4, blur: 0, color: "rgba(0,0,0,0.25)" },
];

// ==========================================
// REUSABLE TYPOGRAPHY PRESETS
// ==========================================

export interface TypographyPresetItem {
  id: string;
  name: string;
  category: "Book Typography" | "Educational Typography";
  style: Partial<ElementStyle>;
  description: string;
}

export const TYPOGRAPHY_PRESETS: TypographyPresetItem[] = [
  // --- Book Typography ---
  {
    id: "book-title",
    name: "Book Title",
    category: "Book Typography",
    description: "Hero cover & publication title",
    style: {
      fontFamily: "Outfit",
      fontSize: 38,
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: -0.5,
      color: "#0f172a",
      textAlign: "center",
      paragraphSpacing: 16,
    },
  },
  {
    id: "chapter-number",
    name: "Chapter Number",
    category: "Book Typography",
    description: "Label above chapter headline",
    style: {
      fontFamily: "Inter",
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 2.5,
      color: "#e11d48",
      textTransform: "uppercase",
      textAlign: "left",
      paragraphSpacing: 4,
    },
  },
  {
    id: "chapter-title",
    name: "Chapter Title",
    category: "Book Typography",
    description: "Main chapter opener header",
    style: {
      fontFamily: "Outfit",
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.18,
      letterSpacing: -0.2,
      color: "#0f172a",
      textAlign: "left",
      paragraphSpacing: 14,
    },
  },
  {
    id: "section-heading",
    name: "Section Heading",
    category: "Book Typography",
    description: "Major lesson subsection (H2)",
    style: {
      fontFamily: "Inter",
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0,
      color: "#1e293b",
      textAlign: "left",
      paragraphSpacing: 8,
    },
  },
  {
    id: "subheading",
    name: "Subheading",
    category: "Book Typography",
    description: "Topic and section lead (H3)",
    style: {
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 0,
      color: "#334155",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "body-standard",
    name: "Body Text",
    category: "Book Typography",
    description: "Standard readable textbook paragraph",
    style: {
      fontFamily: "Noto Sans",
      fontSize: 10.5,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
      color: "#334155",
      textAlign: "left",
      paragraphSpacing: 8,
    },
  },
  {
    id: "small-body",
    name: "Small Body",
    category: "Book Typography",
    description: "Condensed secondary prose",
    style: {
      fontFamily: "Noto Sans",
      fontSize: 9,
      fontWeight: 400,
      lineHeight: 1.45,
      letterSpacing: 0,
      color: "#475569",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "caption",
    name: "Caption",
    category: "Book Typography",
    description: "Image & diagram explanation",
    style: {
      fontFamily: "Inter",
      fontSize: 8,
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: 0.2,
      color: "#64748b",
      textAlign: "left",
      paragraphSpacing: 4,
    },
  },
  {
    id: "quote",
    name: "Quote / Pullout",
    category: "Book Typography",
    description: "Highlighted thought or excerpt",
    style: {
      fontFamily: "Merriweather",
      fontSize: 11.5,
      fontWeight: 400,
      fontStyle: "italic",
      lineHeight: 1.55,
      letterSpacing: 0,
      color: "#1e293b",
      textAlign: "left",
      paragraphSpacing: 10,
    },
  },
  {
    id: "footnote",
    name: "Footnote",
    category: "Book Typography",
    description: "Bottom reference annotation",
    style: {
      fontFamily: "Inter",
      fontSize: 7.5,
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: 0,
      color: "#94a3b8",
      textAlign: "left",
      paragraphSpacing: 3,
    },
  },

  // --- Educational Typography ---
  {
    id: "edu-learning-outcome",
    name: "Learning Outcome",
    category: "Educational Typography",
    description: "Objective statement with bullet",
    style: {
      fontFamily: "Inter",
      fontSize: 10.5,
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1e3a8a",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-definition",
    name: "Definition",
    category: "Educational Typography",
    description: "Formal academic glossary item",
    style: {
      fontFamily: "Noto Serif",
      fontSize: 10,
      fontWeight: 500,
      lineHeight: 1.5,
      color: "#0f172a",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-formula",
    name: "Formula",
    category: "Educational Typography",
    description: "Centered mathematical equation",
    style: {
      fontFamily: "EB Garamond",
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: 0.5,
      color: "#0f172a",
      textAlign: "center",
      paragraphSpacing: 8,
    },
  },
  {
    id: "edu-example",
    name: "Example",
    category: "Educational Typography",
    description: "Curriculum demonstration example",
    style: {
      fontFamily: "Inter",
      fontSize: 10.5,
      fontWeight: 600,
      lineHeight: 1.45,
      color: "#047857",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-solved-example",
    name: "Solved Example",
    category: "Educational Typography",
    description: "Step-by-step problem breakdown",
    style: {
      fontFamily: "Source Sans 3",
      fontSize: 10.5,
      fontWeight: 500,
      lineHeight: 1.45,
      color: "#0f172a",
      textAlign: "left",
      paragraphSpacing: 8,
    },
  },
  {
    id: "edu-important-note",
    name: "Important Note",
    category: "Educational Typography",
    description: "Attention-grabbing textbook box",
    style: {
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#b45309",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-fun-fact",
    name: "Fun Fact",
    category: "Educational Typography",
    description: "Curiosity trigger for young learners",
    style: {
      fontFamily: "Nunito",
      fontSize: 10.5,
      fontWeight: 700,
      lineHeight: 1.4,
      color: "#0d9488",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-did-you-know",
    name: "Did You Know",
    category: "Educational Typography",
    description: "Enrichment knowledge box",
    style: {
      fontFamily: "Outfit",
      fontSize: 10.5,
      fontWeight: 700,
      lineHeight: 1.4,
      color: "#4f46e5",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-activity",
    name: "Activity",
    category: "Educational Typography",
    description: "Hands-on project instruction",
    style: {
      fontFamily: "Nunito",
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.35,
      color: "#7c3aed",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-question",
    name: "Question",
    category: "Educational Typography",
    description: "Workbook exercise prompt",
    style: {
      fontFamily: "Inter",
      fontSize: 10.5,
      fontWeight: 600,
      lineHeight: 1.45,
      color: "#1e293b",
      textAlign: "left",
      paragraphSpacing: 8,
    },
  },
  {
    id: "edu-answer",
    name: "Answer",
    category: "Educational Typography",
    description: "Solution response field",
    style: {
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 400,
      lineHeight: 1.45,
      color: "#475569",
      textAlign: "left",
      paragraphSpacing: 6,
    },
  },
  {
    id: "edu-instruction",
    name: "Instruction",
    category: "Educational Typography",
    description: "Worksheet directive note",
    style: {
      fontFamily: "Inter",
      fontSize: 9.5,
      fontWeight: 500,
      fontStyle: "italic",
      lineHeight: 1.4,
      color: "#64748b",
      textAlign: "left",
      paragraphSpacing: 4,
    },
  },
  {
    id: "edu-vocabulary",
    name: "Vocabulary",
    category: "Educational Typography",
    description: "Keyword term & phonetic guide",
    style: {
      fontFamily: "Inter",
      fontSize: 10.5,
      fontWeight: 700,
      lineHeight: 1.4,
      color: "#0369a1",
      textAlign: "left",
      paragraphSpacing: 4,
    },
  },
  {
    id: "edu-worksheet-heading",
    name: "Worksheet Heading",
    category: "Educational Typography",
    description: "Practice sheet header",
    style: {
      fontFamily: "Outfit",
      fontSize: 16,
      fontWeight: 700,
      lineHeight: 1.25,
      color: "#1e293b",
      textAlign: "center",
      paragraphSpacing: 10,
    },
  },
];

// ==========================================
// MATHEMATICAL SYMBOLS CATALOG
// ==========================================

export interface MathSymbolGroup {
  name: string;
  symbols: Array<{ char: string; label: string }>;
}

export const MATH_SYMBOL_GROUPS: MathSymbolGroup[] = [
  {
    name: "Basic & Arithmetic",
    symbols: [
      { char: "+", label: "Plus" },
      { char: "−", label: "Minus" },
      { char: "×", label: "Multiplication" },
      { char: "÷", label: "Division" },
      { char: "=", label: "Equals" },
      { char: "≠", label: "Not Equal" },
      { char: "±", label: "Plus-Minus" },
      { char: "∓", label: "Minus-Plus" },
      { char: "<", label: "Less Than" },
      { char: ">", label: "Greater Than" },
      { char: "≤", label: "Less / Equal" },
      { char: "≥", label: "Greater / Equal" },
      { char: "≈", label: "Approximately" },
      { char: "%", label: "Percent" },
    ],
  },
  {
    name: "Superscripts / Powers",
    symbols: [
      { char: "²", label: "Squared" },
      { char: "³", label: "Cubed" },
      { char: "⁴", label: "Power 4" },
      { char: "ⁿ", label: "Power n" },
      { char: "⁰", label: "Power 0" },
      { char: "¹", label: "Power 1" },
      { char: "⁵", label: "Power 5" },
      { char: "⁶", label: "Power 6" },
      { char: "⁷", label: "Power 7" },
      { char: "⁸", label: "Power 8" },
      { char: "⁹", label: "Power 9" },
      { char: "⁺", label: "Super +" },
      { char: "⁻", label: "Super -" },
    ],
  },
  {
    name: "Subscripts",
    symbols: [
      { char: "₀", label: "Sub 0" },
      { char: "₁", label: "Sub 1" },
      { char: "₂", label: "Sub 2" },
      { char: "₃", label: "Sub 3" },
      { char: "₄", label: "Sub 4" },
      { char: "₅", label: "Sub 5" },
      { char: "₆", label: "Sub 6" },
      { char: "₇", label: "Sub 7" },
      { char: "₈", label: "Sub 8" },
      { char: "₉", label: "Sub 9" },
      { char: "₊", label: "Sub +" },
      { char: "₋", label: "Sub -" },
    ],
  },
  {
    name: "Fractions",
    symbols: [
      { char: "½", label: "One Half" },
      { char: "⅓", label: "One Third" },
      { char: "⅔", label: "Two Thirds" },
      { char: "¼", label: "One Quarter" },
      { char: "¾", label: "Three Quarters" },
      { char: "⅕", label: "One Fifth" },
      { char: "⅖", label: "Two Fifths" },
      { char: "⅗", label: "Three Fifths" },
      { char: "⅘", label: "Four Fifths" },
      { char: "⅙", label: "One Sixth" },
      { char: "⅚", label: "Five Sixths" },
      { char: "⅛", label: "One Eighth" },
      { char: "⅜", label: "Three Eighths" },
      { char: "⅝", label: "Five Eighths" },
      { char: "⅞", label: "Seven Eighths" },
    ],
  },
  {
    name: "Algebra & Calculus",
    symbols: [
      { char: "√", label: "Square Root" },
      { char: "∛", label: "Cube Root" },
      { char: "∑", label: "Summation" },
      { char: "∏", label: "Product" },
      { char: "∫", label: "Integral" },
      { char: "∂", label: "Partial" },
      { char: "∆", label: "Delta" },
      { char: "∇", label: "Nabla" },
      { char: "∞", label: "Infinity" },
      { char: "∝", label: "Proportional" },
    ],
  },
  {
    name: "Geometry",
    symbols: [
      { char: "°", label: "Degree" },
      { char: "∠", label: "Angle" },
      { char: "∡", label: "Measured Angle" },
      { char: "⟂", label: "Perpendicular" },
      { char: "∥", label: "Parallel" },
      { char: "≅", label: "Congruent" },
      { char: "∼", label: "Similar" },
      { char: "▱", label: "Parallelogram" },
      { char: "△", label: "Triangle" },
      { char: "◯", label: "Circle" },
      { char: "π", label: "Pi" },
    ],
  },
  {
    name: "Greek Letters",
    symbols: [
      { char: "α", label: "Alpha" },
      { char: "β", label: "Beta" },
      { char: "γ", label: "Gamma" },
      { char: "δ", label: "Delta" },
      { char: "ε", label: "Epsilon" },
      { char: "θ", label: "Theta" },
      { char: "λ", label: "Lambda" },
      { char: "μ", label: "Mu" },
      { char: "π", label: "Pi" },
      { char: "ρ", label: "Rho" },
      { char: "σ", label: "Sigma" },
      { char: "τ", label: "Tau" },
      { char: "φ", label: "Phi" },
      { char: "ω", label: "Omega" },
      { char: "Ω", label: "Capital Omega" },
      { char: "Δ", label: "Capital Delta" },
      { char: "Σ", label: "Capital Sigma" },
    ],
  },
];

// ==========================================
// LOCAL STORAGE PERSISTENCE HELPERS
// ==========================================

const FAVORITES_KEY = "nexmaxx_font_favorites";
const RECENTS_KEY = "nexmaxx_font_recents";

export function getFavoriteFonts(): string[] {
  if (typeof window === "undefined") return ["Inter", "Outfit", "Noto Serif"];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : ["Inter", "Outfit", "Noto Serif"];
  } catch {
    return ["Inter", "Outfit", "Noto Serif"];
  }
}

export function toggleFavoriteFont(font: string): string[] {
  const current = getFavoriteFonts();
  const next = current.includes(font)
    ? current.filter((f) => f !== font)
    : [...current, font];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function getRecentFonts(): string[] {
  if (typeof window === "undefined") return ["Inter", "Noto Sans", "Merriweather"];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : ["Inter", "Noto Sans", "Merriweather"];
  } catch {
    return ["Inter", "Noto Sans", "Merriweather"];
  }
}

export function addRecentFont(font: string): void {
  if (typeof window === "undefined" || !font) return;
  try {
    const current = getRecentFonts().filter((f) => f !== font);
    current.unshift(font);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(current.slice(0, 10)));
  } catch {}
}

// ==========================================
// SMART TYPOGRAPHY HELPERS
// ==========================================

/**
 * Recommends optimal line height based on font size (Optical Line Height)
 */
export function recommendLineHeight(fontSize: number): number {
  if (fontSize >= 40) return 1.05;
  if (fontSize >= 28) return 1.15;
  if (fontSize >= 20) return 1.25;
  if (fontSize >= 14) return 1.35;
  if (fontSize >= 10) return 1.45;
  return 1.5;
}

/**
 * Checks if font size is below 8pt print threshold
 */
export function checkPrintReadabilityWarning(fontSize: number): string | null {
  if (fontSize < 8) {
    return `${fontSize}pt is below the 8pt minimum print legibility standard.`;
  }
  return null;
}

// ==========================================
// CASE TRANSFORMATION HELPERS
// ==========================================

export function toSentenceCase(text: string): string {
  return text.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
}

export function toTitleCase(text: string): string {
  const minorWords = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "in", "of"]);
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && minorWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function toCapitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}
