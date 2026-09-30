import { Subject } from "../book/types";

export interface ColorTokens {
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  // Educational semantics
  objectiveColor: string;
  activityColor: string;
  definitionColor: string;
  experimentColor: string;
  warningColor: string;
  summaryColor: string;
}

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  accentFont: string;
  monoFont: string;
  baseSizePt: number;
  scaleRatio: number; // e.g. 1.25 (Major Third), 1.333 (Perfect Fourth)
  lineHeightBody: number;
  lineHeightHeading: number;
}

export interface SpacingTokens {
  xsPt: number; // 4
  smPt: number; // 8
  mdPt: number; // 16
  lgPt: number; // 24
  xlPt: number; // 32
}

export interface RadiusTokens {
  smPt: number;
  mdPt: number;
  lgPt: number;
  pillPt: number;
}

export interface BookTheme {
  id: string;
  name: string;
  subject: Subject;
  gradeTier: "Early" | "Primary" | "Middle";
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
}

export const SUBJECT_THEMES: Record<string, BookTheme> = {
  "science-modern": {
    id: "science-modern",
    name: "Modern Science & Discovery",
    subject: "Science",
    gradeTier: "Primary",
    colors: {
      primary: "#059669",        // Emerald 600
      primaryLight: "#ecfdf5",   // Emerald 50
      secondary: "#0284c7",      // Sky 600
      accent: "#d97706",         // Amber 600
      background: "#ffffff",
      surface: "#f8fafc",
      surfaceMuted: "#f1f5f9",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      objectiveColor: "#0284c7",
      activityColor: "#d97706",
      definitionColor: "#7c3aed",
      experimentColor: "#059669",
      warningColor: "#e11d48",
      summaryColor: "#0d9488",
    },
    typography: {
      headingFont: "Outfit, Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
      accentFont: "Outfit, sans-serif",
      monoFont: "monospace",
      baseSizePt: 10.5,
      scaleRatio: 1.25,
      lineHeightBody: 1.5,
      lineHeightHeading: 1.2,
    },
    spacing: { xsPt: 4, smPt: 8, mdPt: 16, lgPt: 24, xlPt: 32 },
    radius: { smPt: 4, mdPt: 8, lgPt: 14, pillPt: 999 },
  },
  "math-precision": {
    id: "math-precision",
    name: "Mathematical Foundations",
    subject: "Mathematics",
    gradeTier: "Primary",
    colors: {
      primary: "#2563eb",
      primaryLight: "#eff6ff",
      secondary: "#7c3aed",
      accent: "#ea580c",
      background: "#ffffff",
      surface: "#f8fafc",
      surfaceMuted: "#f1f5f9",
      border: "#cbd5e1",
      text: "#0f172a",
      textMuted: "#475569",
      objectiveColor: "#2563eb",
      activityColor: "#ea580c",
      definitionColor: "#4f46e5",
      experimentColor: "#0891b2",
      warningColor: "#dc2626",
      summaryColor: "#3b82f6",
    },
    typography: {
      headingFont: "Outfit, Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
      accentFont: "Outfit, sans-serif",
      monoFont: "Courier New, monospace",
      baseSizePt: 10.5,
      scaleRatio: 1.25,
      lineHeightBody: 1.45,
      lineHeightHeading: 1.2,
    },
    spacing: { xsPt: 4, smPt: 8, mdPt: 16, lgPt: 24, xlPt: 32 },
    radius: { smPt: 3, mdPt: 6, lgPt: 10, pillPt: 999 },
  },
  "english-creative": {
    id: "english-creative",
    name: "Literary & Language Arts",
    subject: "English",
    gradeTier: "Primary",
    colors: {
      primary: "#9333ea",
      primaryLight: "#faf5ff",
      secondary: "#db2777",
      accent: "#e11d48",
      background: "#ffffff",
      surface: "#fdf4ff",
      surfaceMuted: "#f5f3ff",
      border: "#e9d5ff",
      text: "#1e1b4b",
      textMuted: "#6b7280",
      objectiveColor: "#7c3aed",
      activityColor: "#db2777",
      definitionColor: "#4338ca",
      experimentColor: "#c026d3",
      warningColor: "#e11d48",
      summaryColor: "#9333ea",
    },
    typography: {
      headingFont: "Georgia, serif",
      bodyFont: "Georgia, serif",
      accentFont: "Outfit, sans-serif",
      monoFont: "monospace",
      baseSizePt: 11,
      scaleRatio: 1.25,
      lineHeightBody: 1.55,
      lineHeightHeading: 1.25,
    },
    spacing: { xsPt: 4, smPt: 8, mdPt: 16, lgPt: 24, xlPt: 32 },
    radius: { smPt: 4, mdPt: 8, lgPt: 12, pillPt: 999 },
  },
};
