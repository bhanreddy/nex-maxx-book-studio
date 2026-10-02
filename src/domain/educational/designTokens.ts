import { SubjectDomain, GradeBand, DesignFamily } from "./blockSchema";
import type { ChapterPersonality, CurriculumGrade, FrameworkStage } from "./curriculum";

/** Illustrated publishing uses flat vector colour and measured editorial spacing. */
export const PUBLISHING_COMPOSITION_TOKENS = {
  paper: "#FFFFFF", ink: "#172B36", radius: 12, plateRadius: 20,
  stroke: .8, shadowOffset: 3, headingScale: 1.12, displayScale: 1.6,
  eyebrowPt: 10, tintStrength: .1, secondaryTintStrength: .08,
} as const;

/** Print-safe premium treatments share the existing publication token system. */
export const PREMIUM_BLOCK_TOKENS = {
  "premium-editorial": { paper: "#FFFCF5", card: "#F4EFE4", ink: "#242B34", muted: "#59616A", edge: "#D7CDB9", accent: "#946B2D", radius: 3, stroke: .7, shadow: "#E4DDD0" },
  "premium-clay": { paper: "#FAF8FF", card: "#EEE8FA", ink: "#282944", muted: "#596078", edge: "#D4CCE7", accent: "#655096", radius: 20, stroke: .8, shadow: "#DDD5EB" },
  "premium-studio": { paper: "#F7FAFC", card: "#EAF3F4", ink: "#172D39", muted: "#52636D", edge: "#CFDFE4", accent: "#116B70", radius: 8, stroke: .8, shadow: "#DFE9EE" },
} as const;

/** Lesson schema clay palette: dark ink, pastel capsules, and print-safe accents. */
export const LESSON_SCHEMA_TOKENS = {
  ink: "#13254F", paper: "#FAF8FC", white: "#FFFFFF", shadow: "#DAD4E3", muted: "#64748B",
  tones: [
    { name: "Lavender", accent: "#70549C", fill: "#E5DBF7" },
    { name: "Sky", accent: "#326B99", fill: "#D5EBF7" },
    { name: "Coral", accent: "#AD4E50", fill: "#F9D9DC" },
    { name: "Mint", accent: "#26756B", fill: "#D7EEE6" },
    { name: "Sand", accent: "#966B33", fill: "#F4E6D1" },
    { name: "Rose", accent: "#934564", fill: "#F4D8E5" },
    { name: "Periwinkle", accent: "#3F60A3", fill: "#DFE5FC" },
  ],
} as const;

/**
 * NEX MAXX Book Studio - Educational Design Tokens & Color Psychology
 * Formulated specifically for professional educational textbook publishing.
 */

export interface SubjectColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  surfaceSubtle: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export interface AgeTypographyScale {
  displayPt: number;
  sectionTitlePt: number;
  headingPt: number;
  bodyPt: number;
  captionPt: number;
  lineHeight: number;
  cornerRadiusPt: number;
  spacingScalePt: number;
  iconSizePt: number;
}

// 1. Subject-Aware Color Psychology Palettes
export const SUBJECT_PALETTES: Record<SubjectDomain, SubjectColorPalette> = {
  mathematics: {
    primary: "#3730a3",      // Deep Indigo
    secondary: "#0284c7",    // Precision Sky
    accent: "#ea580c",       // Tangible Orange
    surface: "#f8fafc",      // Crisp Paper Slate
    surfaceSubtle: "#eef2ff",// Soft Indigo Tint
    textPrimary: "#1e1b4b",
    textSecondary: "#475569",
    border: "#c7d2fe",
    badgeBg: "#e0e7ff",
    badgeText: "#3730a3",
  },
  science: {
    primary: "#047857",      // Laboratory Emerald
    secondary: "#0284c7",    // Electric Cyan
    accent: "#0d9488",       // Turquoise Accent
    surface: "#f0fdf4",      // Bio Mist
    surfaceSubtle: "#dcfce7",// Fresh Mint
    textPrimary: "#064e3b",
    textSecondary: "#334155",
    border: "#a7f3d0",
    badgeBg: "#d1fae5",
    badgeText: "#065f46",
  },
  english: {
    primary: "#881337",      // Deep Burgundy
    secondary: "#e11d48",    // Radiant Rose
    accent: "#7c3aed",       // Narrative Lavender
    surface: "#fff1f2",      // Warm Cream Rose
    surfaceSubtle: "#ffe4e6",// Soft Blush
    textPrimary: "#4c0519",
    textSecondary: "#475569",
    border: "#fecdd3",
    badgeBg: "#ffe4e6",
    badgeText: "#9f1239",
  },
  "social-studies": {
    primary: "#9a3412",      // Terracotta Rust
    secondary: "#1e3a8a",    // Deep Navy
    accent: "#b45309",       // Antique Gold
    surface: "#fffbeb",      // Parchment Warmth
    surfaceSubtle: "#fef3c7",// Warm Sand
    textPrimary: "#451a03",
    textSecondary: "#475569",
    border: "#fed7aa",
    badgeBg: "#ffedd5",
    badgeText: "#9a3412",
  },
  environmental: {
    primary: "#15803d",      // Forest Canopy
    secondary: "#65a30d",    // Fresh Lime
    accent: "#0284c7",       // Clean Water Sky
    surface: "#f7fee7",      // Eco Light
    surfaceSubtle: "#ecfccb",// Sprout Tint
    textPrimary: "#14532d",
    textSecondary: "#3f3f46",
    border: "#bef264",
    badgeBg: "#d9f99d",
    badgeText: "#166534",
  },
  "early-learning": {
    primary: "#e11d48",      // Cheerful Coral Poppy
    secondary: "#0284c7",    // Bright Aqua
    accent: "#ca8a04",       // Sunshine Yellow
    surface: "#fff7ed",      // Radiant Sunlight
    surfaceSubtle: "#fef08a",// Warm Pastel Yellow
    textPrimary: "#18181b",
    textSecondary: "#52525b",
    border: "#fecdd3",
    badgeBg: "#fed7aa",
    badgeText: "#c2410c",
  },
  "computer-science": {
    primary: "#0f766e",      // Tech Teal
    secondary: "#4f46e5",    // Cyber Violet
    accent: "#0284c7",       // Data Blue
    surface: "#f0fdfa",      // Clean Terminal Tint
    surfaceSubtle: "#ccfbf1",
    textPrimary: "#134e4a",
    textSecondary: "#334155",
    border: "#99f6e4",
    badgeBg: "#ccfbf1",
    badgeText: "#115e59",
  },
  general: {
    primary: "#4338ca",      // NEX Royal Indigo
    secondary: "#0284c7",    // Electric Cyan
    accent: "#f59e0b",       // Warm Amber
    surface: "#ffffff",      // Pure White
    surfaceSubtle: "#f8fafc",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    border: "#e2e8f0",
    badgeBg: "#e0e7ff",
    badgeText: "#3730a3",
  },
};

// 2. Grade-Aware Typography & Geometry Scales
export const GRADE_SCALES: Record<GradeBand, AgeTypographyScale> = {
  "early-years": {
    displayPt: 28,
    sectionTitlePt: 18,
    headingPt: 14,
    bodyPt: 13,
    captionPt: 10,
    lineHeight: 1.6,
    cornerRadiusPt: 16,
    spacingScalePt: 20,
    iconSizePt: 24,
  },
  "primary-lower": {
    displayPt: 24,
    sectionTitlePt: 16,
    headingPt: 12.5,
    bodyPt: 13,
    captionPt: 9,
    lineHeight: 1.5,
    cornerRadiusPt: 12,
    spacingScalePt: 16,
    iconSizePt: 20,
  },
  "primary-upper": {
    displayPt: 21,
    sectionTitlePt: 14.5,
    headingPt: 11,
    bodyPt: 12,
    captionPt: 8.5,
    lineHeight: 1.45,
    cornerRadiusPt: 8,
    spacingScalePt: 14,
    iconSizePt: 18,
  },
  "middle-school": {
    displayPt: 18,
    sectionTitlePt: 13,
    headingPt: 10.5,
    bodyPt: 11.5,
    captionPt: 8,
    lineHeight: 1.4,
    cornerRadiusPt: 6,
    spacingScalePt: 12,
    iconSizePt: 16,
  },
  "secondary-plus": {
    displayPt: 16,
    sectionTitlePt: 12,
    headingPt: 10,
    bodyPt: 11,
    captionPt: 7.5,
    lineHeight: 1.35,
    cornerRadiusPt: 4,
    spacingScalePt: 10,
    iconSizePt: 14,
  },
};

// 3. Design Family Characteristics
export const FAMILY_TRAITS: Record<
  DesignFamily,
  {
    fontHeading: string;
    fontBody: string;
    borderWidthPt: number;
    shadowStyle: string;
    decorationPattern: string;
  }
> = {
  "nex-spectrum": { fontHeading: "Arial, sans-serif", fontBody: "Arial, sans-serif", borderWidthPt: 0.7, shadowStyle: "none", decorationPattern: "geometric" },
  "nex-studio": { fontHeading: "Arial, sans-serif", fontBody: "Arial, sans-serif", borderWidthPt: 0.7, shadowStyle: "none", decorationPattern: "paper-cut" },
  "nex-future": {
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
    borderWidthPt: 1.5,
    shadowStyle: "0 4px 14px rgba(67, 56, 202, 0.08)",
    decorationPattern: "isometric-mesh",
  },
  "nex-play": {
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Outfit', sans-serif",
    borderWidthPt: 2.0,
    shadowStyle: "0 6px 16px rgba(225, 29, 72, 0.10)",
    decorationPattern: "floating-bubbles",
  },
  "nex-editorial": {
    fontHeading: "'Merriweather', Georgia, serif",
    fontBody: "'Inter', sans-serif",
    borderWidthPt: 1.0,
    shadowStyle: "0 2px 8px rgba(0, 0, 0, 0.04)",
    decorationPattern: "ruled-grid",
  },
  "nex-discovery": {
    fontHeading: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
    borderWidthPt: 1.5,
    shadowStyle: "0 4px 12px rgba(4, 120, 87, 0.08)",
    decorationPattern: "organic-curves",
  },
};

/**
 * Futuristic HUD Telemetry Configuration & Tactical Identifiers (NEX Future-OS 2040)
 */
export const ARCHETYPE_TELEMETRY_CODES: Record<string, string> = {
  "learning-outcomes": "SYS.OBJ // CORE-TARGET",
  "warm-up": "IGNITE // ARC-PLASMA",
  "worked-examples": "EXEC.PATH // PIPELINE",
  "common-mistakes": "ANOMALY // HAZARD-TRAP",
  "collaboration": "TEAM.SYNCH // SATELLITE",
  "ai-explore": "SIM.NEX // RETICLE-3D",
  "concept-map": "NEURAL.NET // ORBIT",
  "quick-check": "DIAGNOSTIC // PULSE",
  "activity-lab": "LAB.EXP // PROTOCOL",
  "mental-maths": "SPEED.CALC // ACCEL",
  "exercises": "PRACTICE // MASTERY",
  "facts-curiosity": "INTEL // CURIOSITY",
  "real-world-connect": "TELEMETRY // BRIDGE",
  "critical-thinking": "SYNAPSE // CRITICAL",
  "revision-recap": "MEM.STORE // RECAP",
};

/**
 * Helper to resolve complete design tokens for any smart block
 */
export function resolveBlockTokens(
  subject: SubjectDomain = "general",
  grade: GradeBand = "primary-upper",
  family: DesignFamily = "nex-future"
) {
  const palette = SUBJECT_PALETTES[subject] || SUBJECT_PALETTES.general;
  const scale = GRADE_SCALES[grade] || GRADE_SCALES["primary-upper"];
  const traits = FAMILY_TRAITS[family] || FAMILY_TRAITS["nex-future"];

  return {
    palette,
    scale,
    traits,
  };
}

/** Stable legacy IDs retain existing books; display names describe the new collections. */
export const COLLECTIONS: Record<DesignFamily, { name: string; description: string; paletteId: string }> = {
  "nex-play": { name: "NEX Wonder", description: "Friendly shapes · illustrated discovery", paletteId: "ocean" },
  "nex-spectrum": { name: "NEX Spectrum", description: "Colourful systems · visual mathematics", paletteId: "indigo" },
  "nex-discovery": { name: "NEX Discovery", description: "Field notes · organic illustration", paletteId: "forest" },
  "nex-editorial": { name: "NEX Editorial", description: "Confident type · considered whitespace", paletteId: "ink" },
  "nex-studio": { name: "NEX Studio", description: "Creative tasks · collaborative learning", paletteId: "plum" },
  "nex-future": { name: "NEX Horizon", description: "Precise diagrams · structured inquiry", paletteId: "cobalt" },
};
export const PUBLICATION_PALETTES = {
  classroom: { name: "Teal & Sunshine", primary: "#096D8C", secondary: "#287E65", accent: "#F4BA37", surface: "#F2FAFC", text: "#14365A", border: "#ADD6E3" },
  readers: { name: "Lilac & Sunshine", primary: "#6650A2", secondary: "#167F88", accent: "#F4BF47", surface: "#F9F6FF", text: "#243454", border: "#D4C6EE" },
  ocean: { name: "Ocean & Apricot", primary: "#155E75", secondary: "#2563EB", accent: "#F59E8B", surface: "#F0F9FF", text: "#142B3A", border: "#BEDDE5" },
  indigo: { name: "Indigo & Marigold", primary: "#4338CA", secondary: "#0F766E", accent: "#F4B942", surface: "#F5F3FF", text: "#20243A", border: "#D6D2EF" },
  forest: { name: "Forest & Coral", primary: "#166534", secondary: "#0F766E", accent: "#E88978", surface: "#F3F8F2", text: "#18332B", border: "#C7DECD" },
  plum: { name: "Plum & Peach", primary: "#7E2254", secondary: "#6D28D9", accent: "#F1AB86", surface: "#FFF4F1", text: "#382335", border: "#EACEDB" },
  cobalt: { name: "Cobalt & Citrus", primary: "#1D4ED8", secondary: "#0E7490", accent: "#E9BE32", surface: "#F4F8FF", text: "#182B49", border: "#CAD9ED" },
  ink: { name: "Ink & Terracotta", primary: "#25374A", secondary: "#A84432", accent: "#C89B52", surface: "#FBF7F0", text: "#242A31", border: "#DFD7C9" },
  marigold: { name: "Marigold & Ink", primary: "#92400E", secondary: "#1D4ED8", accent: "#E8B931", surface: "#FFF8E8", text: "#2A2116", border: "#E6D3A8" },
  apricot: { name: "Apricot & Plum", primary: "#9A3412", secondary: "#7E2254", accent: "#E8896A", surface: "#FFF4EE", text: "#2C1B16", border: "#F0D2C6" },
  maroon: { name: "NEX Signature Maroon", primary: "#6A1B3A", secondary: "#A93C68", accent: "#EDAF44", surface: "#FFFFFF", text: "#192032", border: "#E4E7EE" },
  teal: { name: "Discovery Teal", primary: "#137F83", secondary: "#188A89", accent: "#EDAF44", surface: "#FFFFFF", text: "#192032", border: "#D4EEED" },
  gold: { name: "Curiosity Gold", primary: "#B07C20", secondary: "#BD8429", accent: "#6A1B3A", surface: "#FFFFFF", text: "#192032", border: "#F3E4C2" },
} as const;

export const NEX_MAXX_BRAND = {
  ink: "#192032",
  maroon: "#6A1B3A",
  maroonSecondary: "#A93C68",
  teal: "#137F83",
  gold: "#EDAF44",
  paper: "#FFFFFF",
  muted: "#778093",
  border: "#E4E7EE",
  wash: "#F4F6FA",
  washMaroon: "#FFF0F5",
  washTeal: "#EAFAF9",
  washGold: "#FFF9EB",
  washIndigo: "#F1F2FF",
} as const;

export const NEX_MAXX_PRESETS = {
  editorial: {
    id: "editorial",
    name: "Signature Editorial",
    radiusPt: 10,
    cardRadiusPt: 12,
    fontHeading: "Georgia, 'Noto Serif Telugu', 'Noto Serif Devanagari', serif",
    fontBody: "Inter, 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif",
    accent: "#6A1B3A",
    wash: "#FFF0F5",
    missionGradient: "linear-gradient(110deg, #721c3f, #a43868 65%, #b75881)",
    shadow: "0 3px 11px rgba(19, 43, 56, 0.07)",
    showArtwork: true,
  },
  explorer: {
    id: "explorer",
    name: "Playful Explorer",
    radiusPt: 16,
    cardRadiusPt: 21,
    fontHeading: "Outfit, 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif",
    fontBody: "Inter, 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif",
    accent: "#137F83",
    wash: "#FFF6E9",
    missionGradient: "linear-gradient(106deg, #80274b, #cd8760)",
    shadow: "0 6px 18px rgba(32, 35, 48, 0.08)",
    showArtwork: true,
  },
  academy: {
    id: "academy",
    name: "Modern Academy",
    radiusPt: 6,
    cardRadiusPt: 8,
    fontHeading: "Georgia, 'Noto Serif Telugu', 'Noto Serif Devanagari', serif",
    fontBody: "Inter, 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif",
    accent: "#495DA7",
    wash: "#F5F7FF",
    missionGradient: "linear-gradient(110deg, #273246, #3b4861)",
    shadow: "0 1px 3px rgba(34, 51, 68, 0.08)",
    showArtwork: true,
  },
  workbook: {
    id: "workbook",
    name: "Practice Workbook",
    radiusPt: 6,
    cardRadiusPt: 8,
    fontHeading: "Inter, 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif",
    fontBody: "Inter, 'Noto Sans Telugu', 'Noto Sans Devanagari', sans-serif",
    accent: "#6B193B",
    wash: "#F4F6FA",
    missionGradient: "#6B193B",
    shadow: "none",
    showArtwork: false,
  },
} as const;

/** Editorial intent, not a promise of psychological outcomes. Labels carry meaning too. */
export const PALETTE_INTENT: Record<keyof typeof PUBLICATION_PALETTES, string> = {
  classroom: "Clear navy text, teal headings and warm classroom highlights.",
  readers: "Soft lilac panels and warm highlights for illustrated learning.",
  ocean: "Calm reading surfaces with warm accents for questions and discoveries.",
  indigo: "A clear visual hierarchy for patterns, reasoning, and connected ideas.",
  forest: "Natural greens for observation, reflection, and outdoor discovery.",
  plum: "Expressive accents for stories, language, art, and imaginative work.",
  cobalt: "Crisp contrast for diagrams, instructions, and structured practice.",
  ink: "Warm paper and quiet ink for sustained reading and teacher resources.",
  marigold: "Warm highlights for checkpoints, curiosity, and key takeaways.",
  apricot: "Welcoming warm surfaces for playful prompts and early learning.",
  maroon: "NEX signature deep maroon identity with warm gold accents.",
  teal: "Discovery teal surfaces with energetic highlights.",
  gold: "Curiosity warm gold and amber for investigative and lab work.",
};

/** Curriculum tokens extend the publication system; studio chrome uses its existing CSS tokens. */
export const CURRICULUM_SCALES = {
  spacing: [4, 8, 12, 18, 26, 36, 48], corners: [0, 4, 10, 20, 999],
  shadows: ["none", "0 2px 8px rgba(15,23,42,.08)"], strokes: [.6, 1, 1.5, 2.5],
  icons: [12, 18, 24, 36], illustrations: [.24, .38, .6, 1],
} as const;
export const CLASS_TYPOGRAPHY: Record<CurriculumGrade, { body: number; heading: number; display: number; gap: number; illustration: number }> = {
  NURSERY:{body:22,heading:30,display:48,gap:28,illustration:.7},
  LKG:{body:20,heading:28,display:46,gap:26,illustration:.66},
  UKG:{body:18.5,heading:26,display:44,gap:24,illustration:.6},
  1: { body: 17, heading: 25, display: 43, gap: 22, illustration: .56 },
  2: { body: 15.5, heading: 23, display: 40, gap: 20, illustration: .5 },
  3: { body: 14, heading: 22, display: 38, gap: 18, illustration: .43 },
  4: { body: 13, heading: 21, display: 36, gap: 16, illustration: .38 },
  5: { body: 12, heading: 20, display: 34, gap: 14, illustration: .32 },
  6: { body: 11.5, heading: 19, display: 32, gap: 13, illustration: .3 },
  7: { body: 11, heading: 18.5, display: 30, gap: 12, illustration: .28 },
  8: { body: 10.5, heading: 18, display: 28, gap: 12, illustration: .26 },
  9: { body: 10, heading: 17.5, display: 26, gap: 11, illustration: .24 },
  10: { body: 10, heading: 17, display: 26, gap: 10, illustration: .22 },
  11: { body: 9.5, heading: 16.5, display: 24, gap: 10, illustration: .2 },
  12: { body: 9.5, heading: 16, display: 24, gap: 10, illustration: .2 },
};
export const CURRICULUM_TEXT_STYLES = {
  "Chapter Number": { scale: 2.8, weight: 800 }, "Chapter Title": { scale: 2.5, weight: 700 },
  "Section Title": { scale: 1.65, weight: 700 }, "Concept Heading": { scale: 1.5, weight: 700 },
  Subheading: { scale: 1.15, weight: 700 }, Body: { scale: 1, weight: 400 },
  Definition: { scale: 1.08, weight: 600 }, Example: { scale: 1, weight: 400 },
  Question: { scale: 1, weight: 600 }, Instruction: { scale: 1, weight: 400 },
  Caption: { scale: .8, weight: 400 }, Fact: { scale: 1.05, weight: 600 },
  Vocabulary: { scale: 1, weight: 600 }, "Answer Space": { scale: 1, weight: 400 }, "Teacher Note": { scale: .85, weight: 400 },
} as const;
export function curriculumTokens(palette: typeof PUBLICATION_PALETTES[keyof typeof PUBLICATION_PALETTES] | { primary: string; secondary: string; accent: string; surface: string; text: string; border: string }, stage: FrameworkStage) {
  return { chapterAccent: palette.primary, secondaryAccent: palette.secondary, surfaceSoft: palette.surface,
    surfaceStrong: stage === "think" ? palette.secondary : palette.primary, textPrimary: palette.text,
    textSecondary: palette.primary, borderSoft: palette.border, illustrationAccent: palette.accent,
    activityAccent: palette.secondary, thinkingAccent: palette.secondary, assessmentAccent: palette.primary };
}
export function chapterPalette(subject: string, personality: ChapterPersonality): keyof typeof PUBLICATION_PALETTES {
  if (personality === "illustrated" || personality === "playful") return /english|language|hindi|telugu|art|music/i.test(subject) ? "readers" : "classroom";
  if (personality === "nature") return "forest";
  if (personality === "minimal-premium" || personality === "modern-editorial") return "ink";
  if (personality === "storybook") return "plum";
  if (personality === "mathematical") return "indigo";
  if (personality === "science-explorer") return "ocean";
  if (/english|hindi|telugu/i.test(subject)) return "plum";
  if (/science|evs|environment/i.test(subject)) return "forest";
  if (/social|gk|general knowledge/i.test(subject)) return "ink";
  return "indigo";
}

/** Print-safe teaching surfaces; extend publication palettes rather than maintaining a second palette. */
export function teachingTokens(p: { primary: string; secondary: string; accent: string; surface: string; text: string; border: string }, style: import("./curriculum").BlockVisualStyle, reducedInk = false) {
  const mix = (colour: string, amount: number) => {
    const raw = colour.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(raw)) return "#F5F7FA";
    return "#" + [0, 2, 4].map(i => Math.round(parseInt(raw.slice(i, i + 2), 16) * amount + 255 * (1 - amount)).toString(16).padStart(2, "0")).join("");
  };
  return {
    ink: p.text, accent: p.primary, secondary: p.secondary, white: "#FFFFFF",
    soft: reducedInk ? "#FFFFFF" : mix(p.primary, .07),
    fills: reducedInk ? ["#FFFFFF", "#FFFFFF", "#FFFFFF"] : [mix(p.primary, .12), mix(p.secondary, .12), mix(p.accent, .19)],
    edges: [mix(p.primary, .45), mix(p.secondary, .45), mix(p.accent, .65)],
    colours: [p.primary, p.secondary, p.primary],
    radius: style === "classic" ? 2 : style === "calm" ? 8 : 20,
    gap: 16, inset: 18, stroke: style === "calm" || reducedInk ? 1 : 1.6,
    display: style === "storybook" ? "serif" as const : "sans" as const,
  };
}

/** Editorial media extension; QR ink/white are fixed for decoder-tested contrast. */
export const MEDIA_QR_TOKENS = {paper:'#FAF8F5',white:'#FFFFFF',ink:'#29262B',muted:'#69636B',accent:'#651F34',border:'#E4DDE0'} as const;

/** Editable ribbon/worksheet collection inspired by the chapter element references. */
export const REFERENCE_ELEMENT_TOKENS = {
  navy: "#102653", plum: "#85234F", coral: "#EF806E", teal: "#367F8B",
  lilac: "#B69BCB", paper: "#FFF9F0", aqua: "#EAF8F8", white: "#FFFFFF",
  ink: "#14244E", shadow: "#DAD3DD", rule: "#AAA8AD",
  radius: 18, padding: 22, gap: 12,
} as const;
