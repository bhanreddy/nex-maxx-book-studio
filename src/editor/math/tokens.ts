// ============================================================================
// NEX MAXX BOOK STUDIO - MATHS THEME & DESIGN SYSTEM TOKENS
// Consistent, production-grade primary educational mathematics palette
// ============================================================================

export interface PlaceColorConfig {
  name: string;
  short: string;
  bg: string;
  border: string;
  text: string;
  bead: string;
  disc: string;
}

export const MATH_TOKENS: {
  primary: {
    indigo: string;
    indigoAccent: string;
    indigoLight: string;
    indigoBorder: string;
  };
  topics: Record<string, {
    main: string;
    accent: string;
    tint: string;
    border: string;
    badgeText: string;
  }>;
  placeColors: Record<string, PlaceColorConfig>;
  variants: Record<string, {
    border: string;
    bg: string;
    headerBg: string;
    accentBorder: string;
  }>;
} = {
  // Domain Theme Colors (Section 27)
  primary: {
    indigo: "#312e81",       // Maths Primary Deep Indigo
    indigoAccent: "#4338ca",
    indigoLight: "#e0e7ff",
    indigoBorder: "#c7d2fe",
  },
  topics: {
    numbers: {
      main: "#1d4ed8",
      accent: "#3b82f6",
      tint: "#eff6ff",
      border: "#bfdbfe",
      badgeText: "#1e40af",
    },
    placeValue: {
      main: "#4338ca",
      accent: "#6366f1",
      tint: "#eef2ff",
      border: "#c7d2fe",
      badgeText: "#3730a3",
    },
    operations: {
      main: "#be123c",
      accent: "#e11d48",
      tint: "#fff1f2",
      border: "#fecdd3",
      badgeText: "#9f1239",
    },
    fractions: {
      main: "#6d28d9",
      accent: "#8b5cf6",
      tint: "#f5f3ff",
      border: "#ddd6fe",
      badgeText: "#5b21b6",
    },
    decimals: {
      main: "#0284c7",
      accent: "#0ea5e9",
      tint: "#f0f9ff",
      border: "#bae6fd",
      badgeText: "#0369a1",
    },
    geometry: {
      main: "#0f766e",
      accent: "#14b8a6",
      tint: "#f0fdfa",
      border: "#99f6e4",
      badgeText: "#115e59",
    },
    measurement: {
      main: "#c2410c",
      accent: "#ea580c",
      tint: "#fff7ed",
      border: "#fed7aa",
      badgeText: "#9a3412",
    },
    time: {
      main: "#475569",
      accent: "#64748b",
      tint: "#f8fafc",
      border: "#cbd5e1",
      badgeText: "#334155",
    },
    money: {
      main: "#047857",
      accent: "#10b981",
      tint: "#ecfdf5",
      border: "#a7f3d0",
      badgeText: "#065f46",
    },
    patterns: {
      main: "#7c3aed",
      accent: "#a855f7",
      tint: "#faf5ff",
      border: "#e9d5ff",
      badgeText: "#6b21a8",
    },
    data: {
      main: "#0e7490",
      accent: "#06b6d4",
      tint: "#ecfeff",
      border: "#a5f3fc",
      badgeText: "#155e75",
    },
    activities: {
      main: "#b45309",
      accent: "#d97706",
      tint: "#fffbeb",
      border: "#fde68a",
      badgeText: "#92400e",
    },
    assessment: {
      main: "#334155",
      accent: "#475569",
      tint: "#f8fafc",
      border: "#cbd5e1",
      badgeText: "#1e293b",
    },
  },

  // Place Value Colors - Indian & International Hierarchy
  placeColors: {
    // Ones / Units
    O: {
      name: "Ones",
      short: "O",
      bg: "#ecfdf5",
      border: "#10b981",
      text: "#065f46",
      bead: "#10b981",
      disc: "#34d399",
    },
    // Tens
    T: {
      name: "Tens",
      short: "T",
      bg: "#eff6ff",
      border: "#3b82f6",
      text: "#1e40af",
      bead: "#3b82f6",
      disc: "#60a5fa",
    },
    // Hundreds
    H: {
      name: "Hundreds",
      short: "H",
      bg: "#fef3c7",
      border: "#f59e0b",
      text: "#92400e",
      bead: "#f59e0b",
      disc: "#fbbf24",
    },
    // Thousands
    Th: {
      name: "Thousands",
      short: "Th",
      bg: "#fce7f3",
      border: "#ec4899",
      text: "#9d174d",
      bead: "#ec4899",
      disc: "#f472b6",
    },
    // Ten Thousands
    TTh: {
      name: "Ten Thousands",
      short: "TTh",
      bg: "#ede9fe",
      border: "#8b5cf6",
      text: "#5b21b6",
      bead: "#8b5cf6",
      disc: "#a78bfa",
    },
    // Lakhs (Indian) / Hundred Thousands (Intl)
    L: {
      name: "Lakhs",
      short: "L",
      bg: "#ffedd5",
      border: "#f97316",
      text: "#9a3412",
      bead: "#f97316",
      disc: "#fb923c",
    },
    HTh: {
      name: "Hundred Thousands",
      short: "HTh",
      bg: "#ffedd5",
      border: "#f97316",
      text: "#9a3412",
      bead: "#f97316",
      disc: "#fb923c",
    },
    // Ten Lakhs (Indian) / Millions (Intl)
    TL: {
      name: "Ten Lakhs",
      short: "TL",
      bg: "#ccfbf1",
      border: "#14b8a6",
      text: "#115e59",
      bead: "#14b8a6",
      disc: "#2dd4bf",
    },
    M: {
      name: "Millions",
      short: "M",
      bg: "#ccfbf1",
      border: "#14b8a6",
      text: "#115e59",
      bead: "#14b8a6",
      disc: "#2dd4bf",
    },
    // Crores
    C: {
      name: "Crores",
      short: "C",
      bg: "#fee2e2",
      border: "#ef4444",
      text: "#991b1b",
      bead: "#ef4444",
      disc: "#f87171",
    },
    TC: {
      name: "Ten Crores",
      short: "TC",
      bg: "#f3e8ff",
      border: "#a855f7",
      text: "#6b21a8",
      bead: "#a855f7",
      disc: "#c084fc",
    },
  },

  // Style Variant Rules
  variants: {
    clean: {
      border: "border-slate-300 dark:border-slate-700",
      bg: "bg-white dark:bg-slate-900",
      headerBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
      accentBorder: "border-slate-400",
    },
    "color-coded": {
      border: "border-indigo-200 dark:border-indigo-900/60",
      bg: "bg-white dark:bg-[#0f172a]",
      headerBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200",
      accentBorder: "border-indigo-400",
    },
    visual: {
      border: "border-slate-200 dark:border-slate-800 shadow-sm",
      bg: "bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950",
      headerBg: "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent text-indigo-950 dark:text-indigo-200",
      accentBorder: "border-indigo-500",
    },
  },
};
