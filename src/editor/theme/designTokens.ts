import { ElementType } from "../../domain/element/types";

/**
 * NEX MAXX Book Studio - Educational Design Token Architecture (Part 13, 14, 23)
 * Controlled Educational Color Psychology & Grade-Aware System.
 */

export interface SemanticColorToken {
  primary: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
  meaning: string;
}

export const EDUCATIONAL_COLOR_SYSTEM: Record<string, SemanticColorToken> = {
  // Blue: Information, Learning, Concepts, Academic sections (Trust, Clarity, Focus)
  blue: {
    primary: "#2563eb",
    surface: "#eff6ff",
    surfaceSubtle: "#f8fafc",
    border: "#bfdbfe",
    borderStrong: "#3b82f6",
    text: "#1e3a8a",
    textMuted: "#3b82f6",
    badgeBg: "#dbeafe",
    badgeText: "#1d4ed8",
    accent: "#60a5fa",
    meaning: "Information, core concepts, lesson objectives, academic clarity",
  },

  // Purple: Creativity, Imagination, Premium sections, Discovery
  purple: {
    primary: "#7c3aed",
    surface: "#faf5ff",
    surfaceSubtle: "#fdf4ff",
    border: "#e9d5ff",
    borderStrong: "#8b5cf6",
    text: "#581c87",
    textMuted: "#7e22ce",
    badgeBg: "#f3e8ff",
    badgeText: "#6b21a8",
    accent: "#a855f7",
    meaning: "Creativity, imagination, discovery, AI tools, thinking challenges",
  },

  // Green: Activities, Success, Practice, STEM/Science, Environmental
  green: {
    primary: "#059669",
    surface: "#ecfdf5",
    surfaceSubtle: "#f0fdf4",
    border: "#a7f3d0",
    borderStrong: "#10b981",
    text: "#064e3b",
    textMuted: "#047857",
    badgeBg: "#d1fae5",
    badgeText: "#065f46",
    accent: "#34d399",
    meaning: "Hands-on activities, lab experiments, practice exercises, completion",
  },

  // Orange: Attention, Interaction, Exercises, Challenges, Prompts
  orange: {
    primary: "#ea580c",
    surface: "#fff7ed",
    surfaceSubtle: "#fffaf5",
    border: "#fed7aa",
    borderStrong: "#f97316",
    text: "#7c2d12",
    textMuted: "#c2410c",
    badgeBg: "#ffedd5",
    badgeText: "#9a3412",
    accent: "#fb923c",
    meaning: "Active engagement, questions, exercises, problem-solving, challenge tasks",
  },

  // Yellow: Curiosity, Tips, Fun Facts, Highlights (High contrast guaranteed)
  yellow: {
    primary: "#d97706",
    surface: "#fffbeb",
    surfaceSubtle: "#fefce8",
    border: "#fde68a",
    borderStrong: "#f59e0b",
    text: "#78350f", // Deep readable amber/brown, never low-contrast yellow text
    textMuted: "#92400e",
    badgeBg: "#fef3c7",
    badgeText: "#b45309",
    accent: "#fbbf24",
    meaning: "Did you know, curious facts, memory tips, reminders, teacher hints",
  },

  // Red: Warnings, Mistakes, Critical Notices (Restrained usage)
  red: {
    primary: "#dc2626",
    surface: "#fef2f2",
    surfaceSubtle: "#fff1f2",
    border: "#fecaca",
    borderStrong: "#ef4444",
    text: "#7f1d1d",
    textMuted: "#b91c1c",
    badgeBg: "#fee2e2",
    badgeText: "#991b1b",
    accent: "#f87171",
    meaning: "Safety warnings, common student mistakes, critical cautions, lab hazards",
  },

  // Cyan / Turquoise: Modern Technology, Exploration, Data, STEM
  cyan: {
    primary: "#0891b2",
    surface: "#ecfeff",
    surfaceSubtle: "#f0fdfa",
    border: "#a5f3fc",
    borderStrong: "#06b6d4",
    text: "#164e63",
    textMuted: "#0e7490",
    badgeBg: "#cffafe",
    badgeText: "#155e75",
    accent: "#22d3ee",
    meaning: "Digital science, computation, data charts, timelines, modern physics",
  },

  // Pink / Coral: Playful Early Learning, Creative Sections, Nursery-Grade 2
  pink: {
    primary: "#db2777",
    surface: "#fdf2f8",
    surfaceSubtle: "#fff1f5",
    border: "#fbcfe8",
    borderStrong: "#ec4899",
    text: "#831843",
    textMuted: "#be185d",
    badgeBg: "#fce7f3",
    badgeText: "#9d174d",
    accent: "#f472b6",
    meaning: "Early literacy, phonics, kindergarten activities, drawing prompts",
  },
};

/**
 * Grade-Aware Visual Profiles (Part 14)
 */
export interface GradeVisualProfile {
  name: string;
  ageBracket: string;
  typography: {
    h1SizePt: number;
    h2SizePt: number;
    bodySizePt: number;
    captionSizePt: number;
    lineHeight: number;
    letterSpacingPt: number;
    fontFamily: string;
  };
  geometry: {
    cardRadiusPt: number;
    badgeRadiusPt: number;
    borderWidthPt: number;
    spacingScalePt: number;
    paddingScalePt: number;
  };
  colorProfile: {
    preferredPrimaryColor: string;
    saturationWeight: number; // 0.8 to 1.2
    contrastLevel: "high" | "standard" | "soft";
  };
}

export const GRADE_VISUAL_PROFILES: Record<string, GradeVisualProfile> = {
  primary: {
    name: "Early Learning (Nursery – Grade 2)",
    ageBracket: "Ages 3–7",
    typography: {
      h1SizePt: 28,
      h2SizePt: 22,
      bodySizePt: 13,
      captionSizePt: 10,
      lineHeight: 1.6,
      letterSpacingPt: 0.2,
      fontFamily: "Outfit, Inter, sans-serif",
    },
    geometry: {
      cardRadiusPt: 14,
      badgeRadiusPt: 999,
      borderWidthPt: 1.5,
      spacingScalePt: 18,
      paddingScalePt: 16,
    },
    colorProfile: {
      preferredPrimaryColor: "pink",
      saturationWeight: 1.15,
      contrastLevel: "soft",
    },
  },

  intermediate: {
    name: "Middle Learning (Grades 3 – 5)",
    ageBracket: "Ages 8–11",
    typography: {
      h1SizePt: 24,
      h2SizePt: 18,
      bodySizePt: 11,
      captionSizePt: 9,
      lineHeight: 1.45,
      letterSpacingPt: 0,
      fontFamily: "Inter, sans-serif",
    },
    geometry: {
      cardRadiusPt: 8,
      badgeRadiusPt: 6,
      borderWidthPt: 1,
      spacingScalePt: 14,
      paddingScalePt: 12,
    },
    colorProfile: {
      preferredPrimaryColor: "blue",
      saturationWeight: 1.0,
      contrastLevel: "standard",
    },
  },

  secondary: {
    name: "Secondary & High (Grades 6 – 10)",
    ageBracket: "Ages 12–16",
    typography: {
      h1SizePt: 22,
      h2SizePt: 16,
      bodySizePt: 10,
      captionSizePt: 8,
      lineHeight: 1.4,
      letterSpacingPt: -0.1,
      fontFamily: "Merriweather, Inter, serif",
    },
    geometry: {
      cardRadiusPt: 4,
      badgeRadiusPt: 3,
      borderWidthPt: 0.75,
      spacingScalePt: 12,
      paddingScalePt: 10,
    },
    colorProfile: {
      preferredPrimaryColor: "blue",
      saturationWeight: 0.85,
      contrastLevel: "high",
    },
  },
};

/**
 * Map semantic element type to its educational color token
 */
export function getSemanticColorForType(type: ElementType): SemanticColorToken {
  switch (type) {
    case "activity":
    case "experiment":
      return EDUCATIONAL_COLOR_SYSTEM.green;

    case "question":
    case "mcq":
    case "trueFalse":
    case "fillInBlank":
    case "matchFollowing":
    case "exercise":
    case "worksheet":
    case "answerBox":
    case "answer-area":
      return EDUCATIONAL_COLOR_SYSTEM.orange;

    case "didYouKnow":
    case "did-you-know":
    case "fact":
    case "fun-fact":
    case "tip":
      return EDUCATIONAL_COLOR_SYSTEM.yellow;

    case "warning":
      return EDUCATIONAL_COLOR_SYSTEM.red;

    case "learningObjectives":
    case "learning-objective":
    case "summary":
    case "keyConcept":
    case "definition":
    case "vocabulary":
    case "chapter-title":
    case "lesson-title":
    case "heading":
      return EDUCATIONAL_COLOR_SYSTEM.blue;

    case "workedExample":
    case "worked-example":
    case "example":
    case "formula":
    case "diagram":
    case "timeline":
    case "comparison":
      return EDUCATIONAL_COLOR_SYSTEM.cyan;

    case "writingLines":
    case "tracingLines":
    case "drawingBox":
      return EDUCATIONAL_COLOR_SYSTEM.pink;

    default:
      return EDUCATIONAL_COLOR_SYSTEM.blue;
  }
}

/**
 * Resolve grade level to grade profile
 */
export function resolveGradeProfile(grade: string): GradeVisualProfile {
  const g = (grade || "").toLowerCase();
  if (g.includes("nursery") || g.includes("lkg") || g.includes("ukg") || g.includes("grade 1") || g.includes("grade 2")) {
    return GRADE_VISUAL_PROFILES.primary;
  }
  if (g.includes("grade 3") || g.includes("grade 4") || g.includes("grade 5")) {
    return GRADE_VISUAL_PROFILES.intermediate;
  }
  return GRADE_VISUAL_PROFILES.secondary;
}
