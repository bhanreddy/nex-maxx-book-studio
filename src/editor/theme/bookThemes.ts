/**
 * NEX MAXX Book Studio - Theme Engine (Part 24)
 * 10 Curated Textbook Themes preserving content & page geometry.
 */

export interface BookThemeDefinition {
  id: string;
  name: string;
  category: "flagship" | "stem" | "humanities" | "early" | "editorial";
  description: string;
  tokens: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    surfaceColor: string;
    surfaceCard: string;
    textPrimary: string;
    textSecondary: string;
    borderColor: string;
    borderStrong: string;
    fontHeading: string;
    fontBody: string;
  };
}

export const BOOK_THEMES: Record<string, BookThemeDefinition> = {
  "nex-future": {
    id: "nex-future",
    name: "NEX Future",
    category: "flagship",
    description: "Flagship NEX MAXX publishing identity with deep maroon, obsidian, and warm gold accents",
    tokens: {
      primaryColor: "#881337", // Deep Rose / Maroon
      secondaryColor: "#e11d48",
      accentColor: "#f59e0b",
      surfaceColor: "#ffffff",
      surfaceCard: "#fff1f2",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      borderColor: "#fecdd3",
      borderStrong: "#be123c",
      fontHeading: "Outfit, Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "academic-blue": {
    id: "academic-blue",
    name: "Academic Blue",
    category: "editorial",
    description: "Classic scholarly publishing standard with Oxford royal navy and crisp slate typography",
    tokens: {
      primaryColor: "#1e3a8a",
      secondaryColor: "#3b82f6",
      accentColor: "#0284c7",
      surfaceColor: "#ffffff",
      surfaceCard: "#eff6ff",
      textPrimary: "#0f172a",
      textSecondary: "#334155",
      borderColor: "#bfdbfe",
      borderStrong: "#1d4ed8",
      fontHeading: "Merriweather, Georgia, serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "cosmic-learning": {
    id: "cosmic-learning",
    name: "Cosmic Learning",
    category: "stem",
    description: "Deep galactic indigo, starlight violet, and discovery amber for space & inquiry learning",
    tokens: {
      primaryColor: "#4c1d95",
      secondaryColor: "#7c3aed",
      accentColor: "#f59e0b",
      surfaceColor: "#ffffff",
      surfaceCard: "#faf5ff",
      textPrimary: "#1e1b4b",
      textSecondary: "#4c1d95",
      borderColor: "#e9d5ff",
      borderStrong: "#6d28d9",
      fontHeading: "Outfit, Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "playful-primary": {
    id: "playful-primary",
    name: "Playful Primary",
    category: "early",
    description: "Joyful high-saturation coral, sky blue, and mint green optimized for Nursery to Grade 2",
    tokens: {
      primaryColor: "#e11d48",
      secondaryColor: "#0284c7",
      accentColor: "#10b981",
      surfaceColor: "#ffffff",
      surfaceCard: "#fff1f2",
      textPrimary: "#1e293b",
      textSecondary: "#475569",
      borderColor: "#fecdd3",
      borderStrong: "#f43f5e",
      fontHeading: "Outfit, sans-serif",
      fontBody: "Outfit, sans-serif",
    },
  },

  "modern-science": {
    id: "modern-science",
    name: "Modern Science",
    category: "stem",
    description: "Crisp emerald teal, bio-green, and laboratory graphite for biology, physics & chemistry",
    tokens: {
      primaryColor: "#065f46",
      secondaryColor: "#059669",
      accentColor: "#0ea5e9",
      surfaceColor: "#ffffff",
      surfaceCard: "#ecfdf5",
      textPrimary: "#022c22",
      textSecondary: "#065f46",
      borderColor: "#a7f3d0",
      borderStrong: "#059669",
      fontHeading: "Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "nature-explorer": {
    id: "nature-explorer",
    name: "Nature Explorer",
    category: "stem",
    description: "Warm forest sage, earthy terracotta, and sand gold for geography, geology & environmental studies",
    tokens: {
      primaryColor: "#365314",
      secondaryColor: "#65a30d",
      accentColor: "#d97706",
      surfaceColor: "#ffffff",
      surfaceCard: "#f7fee7",
      textPrimary: "#14532d",
      textSecondary: "#365314",
      borderColor: "#d9f99d",
      borderStrong: "#4d7c0f",
      fontHeading: "Merriweather, serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "creative-language": {
    id: "creative-language",
    name: "Creative Language",
    category: "humanities",
    description: "Rich literature burgundy, warm parchment tone, and antique bronze for language and storytelling",
    tokens: {
      primaryColor: "#701a75",
      secondaryColor: "#a21caf",
      accentColor: "#d97706",
      surfaceColor: "#ffffff",
      surfaceCard: "#fdf4ff",
      textPrimary: "#4a044e",
      textSecondary: "#701a75",
      borderColor: "#f5d0fe",
      borderStrong: "#86198f",
      fontHeading: "Merriweather, Georgia, serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "mathematics-pro": {
    id: "mathematics-pro",
    name: "Mathematics Pro",
    category: "stem",
    description: "Royal cobalt, algorithmic cyan, and geometric slate for proofs, equations, and graphs",
    tokens: {
      primaryColor: "#1d4ed8",
      secondaryColor: "#0284c7",
      accentColor: "#f59e0b",
      surfaceColor: "#ffffff",
      surfaceCard: "#eff6ff",
      textPrimary: "#0f172a",
      textSecondary: "#1e3a8a",
      borderColor: "#bae6fd",
      borderStrong: "#2563eb",
      fontHeading: "Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "minimal-editorial": {
    id: "minimal-editorial",
    name: "Minimal Editorial",
    category: "editorial",
    description: "Swiss publishing aesthetic with maximum white space, neutral black, and single crimson accent",
    tokens: {
      primaryColor: "#0f172a",
      secondaryColor: "#334155",
      accentColor: "#e11d48",
      surfaceColor: "#ffffff",
      surfaceCard: "#f8fafc",
      textPrimary: "#020617",
      textSecondary: "#475569",
      borderColor: "#e2e8f0",
      borderStrong: "#0f172a",
      fontHeading: "Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
  },

  "premium-dark-accent": {
    id: "premium-dark-accent",
    name: "Premium Dark Accent",
    category: "flagship",
    description: "Luxury textbook edition with charcoal headers, platinum cards, and subtle rose-gold trim",
    tokens: {
      primaryColor: "#18181b",
      secondaryColor: "#27272a",
      accentColor: "#fb7185",
      surfaceColor: "#ffffff",
      surfaceCard: "#fafafa",
      textPrimary: "#09090b",
      textSecondary: "#52525b",
      borderColor: "#e4e4e7",
      borderStrong: "#27272a",
      fontHeading: "Outfit, Inter, sans-serif",
      fontBody: "Inter, sans-serif",
    },
  },
};
