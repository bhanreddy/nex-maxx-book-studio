export interface DesignFamily {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  defaultPalette: string;
  palettes: string[];
  decoration: "restrained" | "standard" | "expressive";
  tracking: number;
}

const SERIF = '"Libre Baskerville", Georgia, "Palatino Linotype", Palatino, serif';
const GARAMOND = '"EB Garamond", Garamond, "Palatino Linotype", Georgia, serif';
const FRAUNCES = 'Fraunces, Georgia, "Palatino Linotype", serif';
const SOURCE = '"Source Sans 3", "Segoe UI", sans-serif';
const FRANKLIN = '"Libre Franklin", "Helvetica Neue", Arial, sans-serif';
const PLEX = '"IBM Plex Sans", "Segoe UI", sans-serif';
const NUNITO = 'Nunito, "Trebuchet MS", "Segoe UI", sans-serif';

export const DESIGN_FAMILIES: Record<string, DesignFamily> = {
  "editorial-serif": {
    id: "editorial-serif",
    name: "Editorial Serif",
    description: "Refined serif headings, fine rules, and generous margins.",
    headingFont: SERIF,
    bodyFont: SOURCE,
    defaultPalette: "editorial-parchment",
    palettes: ["editorial-parchment", "literary-warm", "monochrome-print"],
    decoration: "standard",
    tracking: 0.12,
  },
  "contemporary-academic": {
    id: "contemporary-academic",
    name: "Contemporary Academic",
    description: "Precise hierarchy, restrained accents, and readable structure.",
    headingFont: SOURCE,
    bodyFont: SOURCE,
    defaultPalette: "academic-teal",
    palettes: ["academic-teal", "academic-print", "monochrome-print"],
    decoration: "restrained",
    tracking: 0.08,
  },
  "swiss-minimal": {
    id: "swiss-minimal",
    name: "Swiss Minimal",
    description: "Strong alignment, sans-serif type, and very little ornament.",
    headingFont: FRANKLIN,
    bodyFont: FRANKLIN,
    defaultPalette: "swiss-ink",
    palettes: ["swiss-ink", "monochrome-print", "academic-print"],
    decoration: "restrained",
    tracking: 0.14,
  },
  "literary-classic": {
    id: "literary-classic",
    name: "Literary Classic",
    description: "Elegant chapter openings, warm neutrals, and ornamental restraint.",
    headingFont: GARAMOND,
    bodyFont: GARAMOND,
    defaultPalette: "literary-warm",
    palettes: ["literary-warm", "literary-night", "classic-bronze", "monochrome-print"],
    decoration: "standard",
    tracking: 0.16,
  },
  "modern-science": {
    id: "modern-science",
    name: "Modern Science",
    description: "Structured numbering, crisp geometry, and informative accents.",
    headingFont: PLEX,
    bodyFont: PLEX,
    defaultPalette: "science-graphite",
    palettes: ["science-graphite", "academic-print", "monochrome-print"],
    decoration: "restrained",
    tracking: 0.06,
  },
  botanical: {
    id: "botanical",
    name: "Botanical",
    description: "Organic details, muted greens, and natural paper tones.",
    headingFont: FRAUNCES,
    bodyFont: SOURCE,
    defaultPalette: "botanical-sage",
    palettes: ["botanical-sage", "editorial-parchment", "monochrome-print"],
    decoration: "standard",
    tracking: 0.08,
  },
  "creative-workbook": {
    id: "creative-workbook",
    name: "Creative Workbook",
    description: "Clear activity labels and controlled colour for practice pages.",
    headingFont: NUNITO,
    bodyFont: SOURCE,
    defaultPalette: "workbook-coral",
    palettes: ["workbook-coral", "learner-sky", "monochrome-print"],
    decoration: "expressive",
    tracking: 0.04,
  },
  "executive-report": {
    id: "executive-report",
    name: "Executive Report",
    description: "Navy structure, balanced tables, and a short information hierarchy.",
    headingFont: FRANKLIN,
    bodyFont: SOURCE,
    defaultPalette: "executive-navy",
    palettes: ["executive-navy", "executive-ink", "monochrome-print"],
    decoration: "restrained",
    tracking: 0.1,
  },
  "monochrome-print": {
    id: "monochrome-print",
    name: "Monochrome Print",
    description: "Strong contrast and grayscale clarity with economical ink.",
    headingFont: SERIF,
    bodyFont: FRANKLIN,
    defaultPalette: "monochrome-print",
    palettes: ["monochrome-print", "swiss-ink"],
    decoration: "restrained",
    tracking: 0.08,
  },
  "young-learner": {
    id: "young-learner",
    name: "Young Learner",
    description: "Friendly type, plain instructions, and age-appropriate colour.",
    headingFont: NUNITO,
    bodyFont: NUNITO,
    defaultPalette: "learner-sky",
    palettes: ["learner-sky", "workbook-coral", "academic-print"],
    decoration: "standard",
    tracking: 0.02,
  },
};

export const FAMILY_LIST = Object.values(DESIGN_FAMILIES);
