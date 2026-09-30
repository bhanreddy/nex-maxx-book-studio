import { contrastRatio } from "./contrast";

export type PaletteMode = "light" | "dark" | "print";

export interface CalloutTokens {
  surface: string;
  border: string;
  text: string;
  label: string;
}

export interface BookPalette {
  id: string;
  name: string;
  mode: PaletteMode;
  /** Contextual pairing note. Not a claim that the colour causes a learning outcome. */
  intent: string;
  paper: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  accentTint: string;
  onAccent: string;
  border: string;
  callouts: {
    info: CalloutTokens;
    definition: CalloutTokens;
    note: CalloutTokens;
    warning: CalloutTokens;
    activity: CalloutTokens;
    assessment: CalloutTokens;
    summary: CalloutTokens;
  };
}

function callout(surface: string, border: string, text: string, label: string): CalloutTokens {
  return { surface, border, text, label };
}

export const BOOK_PALETTES: Record<string, BookPalette> = {
  "academic-teal": {
    id: "academic-teal",
    name: "Academic Teal",
    mode: "light",
    intent: "Quiet teal on warm paper, a calm pairing often used for instructional books.",
    paper: "#F4F7F6",
    surface: "#E7F0EE",
    text: "#14221E",
    textMuted: "#3C4C48",
    accent: "#0F5C56",
    accentTint: "#D5E7E4",
    onAccent: "#F4FBF9",
    border: "#5E7370",
    callouts: {
      info: callout("#E5F1F3", "#0F4C5C", "#0F3A44", "#0F4C5C"),
      definition: callout("#E7EEF6", "#1E3A5F", "#1A2744", "#1E3A5F"),
      note: callout("#F3F0E6", "#6B5A3E", "#3F3A33", "#6B5A3E"),
      warning: callout("#F8EBE6", "#8C3A32", "#6B2D28", "#8C3A32"),
      activity: callout("#E5F2EA", "#1F4D3A", "#143528", "#1F4D3A"),
      assessment: callout("#F8EFE4", "#7A3E12", "#5C2E0C", "#7A3E12"),
      summary: callout("#E6F0EA", "#1B4332", "#143528", "#1B4332"),
    },
  },
  "academic-print": {
    id: "academic-print",
    name: "Academic Print",
    mode: "print",
    intent: "A lower-chroma teal kept dark enough for small text on uncoated paper.",
    paper: "#F7F6F3",
    surface: "#EEECE7",
    text: "#1A1F1E",
    textMuted: "#3E4644",
    accent: "#1F4D4A",
    accentTint: "#E2E8E6",
    onAccent: "#F7FBFA",
    border: "#5C6562",
    callouts: {
      info: callout("#E8EEEF", "#1F4D4A", "#163330", "#1F4D4A"),
      definition: callout("#E8E9EE", "#243044", "#1A2330", "#243044"),
      note: callout("#F3F1EA", "#5C5348", "#3F3A33", "#5C5348"),
      warning: callout("#F6EEEA", "#6B3A34", "#4A2824", "#6B3A34"),
      activity: callout("#E8EEE9", "#243C32", "#1A2C24", "#243C32"),
      assessment: callout("#F4EFE8", "#5C4030", "#3F2C20", "#5C4030"),
      summary: callout("#E8EEEA", "#1E3A30", "#152820", "#1E3A30"),
    },
  },
  "literary-warm": {
    id: "literary-warm",
    name: "Literary Warm",
    mode: "light",
    intent: "Warm paper, charcoal text, and a muted burgundy used as a literary accent.",
    paper: "#F7F3EC",
    surface: "#F1EADF",
    text: "#1C1917",
    textMuted: "#4A433C",
    accent: "#7A2E3A",
    accentTint: "#F0E2DC",
    onAccent: "#FBF6F4",
    border: "#7A7068",
    callouts: {
      info: callout("#E8EEF0", "#1B3A4B", "#142833", "#1B3A4B"),
      definition: callout("#F3E8E6", "#7A2E3A", "#4C1D24", "#7A2E3A"),
      note: callout("#F6F0E4", "#6B5428", "#3F3A33", "#6B5428"),
      warning: callout("#F8E8E4", "#8C3A32", "#5C241E", "#8C3A32"),
      activity: callout("#E8F0E8", "#245C45", "#163528", "#245C45"),
      assessment: callout("#F6EEE4", "#6B4423", "#4A2E16", "#6B4423"),
      summary: callout("#EEE8F0", "#4A3048", "#2E1E30", "#4A3048"),
    },
  },
  "literary-night": {
    id: "literary-night",
    name: "Literary Night",
    mode: "dark",
    intent: "A dark reading surface for digital chapters. Print interiors should use a light palette.",
    paper: "#161311",
    surface: "#241F1C",
    text: "#F4EFE6",
    textMuted: "#C8BBA8",
    accent: "#E7C7A1",
    accentTint: "#3A2E28",
    onAccent: "#1C1410",
    border: "#A89880",
    callouts: {
      info: callout("#1C2830", "#9BB0C4", "#E4EEF4", "#C5D5E4"),
      definition: callout("#2C2224", "#E0B4B0", "#F6E6E4", "#E8C8C4"),
      note: callout("#2A241C", "#D7C4A4", "#F6EFE4", "#E4D4BC"),
      warning: callout("#301C1A", "#E8B0A8", "#F8E8E4", "#F0C8C0"),
      activity: callout("#1A2820", "#A8C8B4", "#E6F4EC", "#C8E0D4"),
      assessment: callout("#2A2218", "#E0C4A4", "#F6EEE4", "#E8D4BC"),
      summary: callout("#241E28", "#D4C0D8", "#F4ECF6", "#E4D4E8"),
    },
  },
  "swiss-ink": {
    id: "swiss-ink",
    name: "Swiss Ink",
    mode: "light",
    intent: "Near-black type, a wide white field, and one crimson mark.",
    paper: "#F7F7F5",
    surface: "#EEEEEC",
    text: "#141414",
    textMuted: "#3A4250",
    accent: "#9F1239",
    accentTint: "#F3E4E8",
    onAccent: "#FFF7F8",
    border: "#5C6168",
    callouts: {
      info: callout("#E8EEF2", "#1E3A5F", "#1A2744", "#1E3A5F"),
      definition: callout("#F3E8EA", "#9F1239", "#6B1028", "#9F1239"),
      note: callout("#F4F1E8", "#5C5348", "#3A3834", "#5C5348"),
      warning: callout("#F8E8E6", "#9F1239", "#6B1028", "#9F1239"),
      activity: callout("#E8F0EA", "#1B4332", "#143528", "#1B4332"),
      assessment: callout("#F4EFE8", "#5C4030", "#3F2C20", "#5C4030"),
      summary: callout("#EEEEF2", "#243044", "#1A2330", "#243044"),
    },
  },
  "monochrome-print": {
    id: "monochrome-print",
    name: "Monochrome Print",
    mode: "print",
    intent: "Black, gray, and paper only, so meaning stays in labels, rules, and patterns.",
    paper: "#F4F4F2",
    surface: "#E6E6E4",
    text: "#1A1A1A",
    textMuted: "#3F3F3F",
    accent: "#2A2A2A",
    accentTint: "#DCDCDC",
    onAccent: "#F7F7F5",
    border: "#5A5A5A",
    callouts: {
      info: callout("#ECECEC", "#2A2A2A", "#1A1A1A", "#2A2A2A"),
      definition: callout("#E8E8E8", "#1A1A1A", "#1A1A1A", "#1A1A1A"),
      note: callout("#F0F0EE", "#3F3F3F", "#1A1A1A", "#3F3F3F"),
      warning: callout("#E4E4E4", "#1A1A1A", "#1A1A1A", "#1A1A1A"),
      activity: callout("#EAEAEA", "#2A2A2A", "#1A1A1A", "#2A2A2A"),
      assessment: callout("#F2F2F0", "#3F3F3F", "#1A1A1A", "#3F3F3F"),
      summary: callout("#E7E7E5", "#1A1A1A", "#1A1A1A", "#1A1A1A"),
    },
  },
  "botanical-sage": {
    id: "botanical-sage",
    name: "Botanical Sage",
    mode: "light",
    intent: "Muted greens and a natural paper tone for field guides and nature chapters.",
    paper: "#F3F6F2",
    surface: "#E5EEE6",
    text: "#14241C",
    textMuted: "#3D4F44",
    accent: "#1F4D3A",
    accentTint: "#D5E6D8",
    onAccent: "#F4FBF6",
    border: "#5E7364",
    callouts: {
      info: callout("#E5F0EA", "#1F4D3A", "#143528", "#1F4D3A"),
      definition: callout("#E8F0E4", "#245C45", "#163528", "#245C45"),
      note: callout("#F6F3E8", "#5C5340", "#3F3A33", "#5C5340"),
      warning: callout("#F8EBE4", "#8C3A32", "#5C2820", "#8C3A32"),
      activity: callout("#E3F0E4", "#1B4332", "#10281C", "#1B4332"),
      assessment: callout("#F4EFE4", "#6B4423", "#4A2E16", "#6B4423"),
      summary: callout("#E6F2EA", "#14532D", "#0F2E1C", "#14532D"),
    },
  },
  "science-graphite": {
    id: "science-graphite",
    name: "Science Graphite",
    mode: "light",
    intent: "Graphite type with a crisp blue-green accent for numbered science layouts.",
    paper: "#F4F6F7",
    surface: "#E7ECEE",
    text: "#141A1E",
    textMuted: "#3C4A52",
    accent: "#0F4C5C",
    accentTint: "#D5E6EA",
    onAccent: "#F4FBFC",
    border: "#5C6C74",
    callouts: {
      info: callout("#E4F0F3", "#0F4C5C", "#0C3038", "#0F4C5C"),
      definition: callout("#E7EEF4", "#1E3A5F", "#15283F", "#1E3A5F"),
      note: callout("#F4F1E6", "#5C5340", "#3A3830", "#5C5340"),
      warning: callout("#F8EBE6", "#8C3A32", "#5C241E", "#8C3A32"),
      activity: callout("#E5F2EA", "#1F4D3A", "#143528", "#1F4D3A"),
      assessment: callout("#F6EFE6", "#7A3E12", "#542C0C", "#7A3E12"),
      summary: callout("#E6F1EF", "#115E59", "#0C3330", "#115E59"),
    },
  },
  "executive-navy": {
    id: "executive-navy",
    name: "Executive Navy",
    mode: "light",
    intent: "Navy, cool paper, and a restrained gold-brown for report tables.",
    paper: "#F5F6F8",
    surface: "#E8ECF1",
    text: "#141A24",
    textMuted: "#3A4554",
    accent: "#16324F",
    accentTint: "#D9E2EC",
    onAccent: "#F5F8FB",
    border: "#5C6B7A",
    callouts: {
      info: callout("#E6EEF5", "#16324F", "#12263C", "#16324F"),
      definition: callout("#E8EEF4", "#1E3A5F", "#15283F", "#1E3A5F"),
      note: callout("#F6F3EA", "#5C5340", "#3A3428", "#5C5340"),
      warning: callout("#F8EBE6", "#7A2E3A", "#541E26", "#7A2E3A"),
      activity: callout("#E7F0EA", "#1F4D3A", "#143528", "#1F4D3A"),
      assessment: callout("#F4EFE6", "#6B4423", "#4A2E16", "#6B4423"),
      summary: callout("#E8EEF2", "#1E3A5F", "#15283F", "#1E3A5F"),
    },
  },
  "executive-ink": {
    id: "executive-ink",
    name: "Executive Ink",
    mode: "dark",
    intent: "A dark navy reading surface for digital reports. Not a print-interior palette.",
    paper: "#121820",
    surface: "#1C2632",
    text: "#E8EEF4",
    textMuted: "#B7C3D1",
    accent: "#D5E2F0",
    accentTint: "#243244",
    onAccent: "#121820",
    border: "#8FA0B4",
    callouts: {
      info: callout("#1A2836", "#B7C9DC", "#E8EEF4", "#D5E2F0"),
      definition: callout("#222838", "#C8D0E4", "#EEF1F8", "#D8E0F0"),
      note: callout("#2A261C", "#E0D0B0", "#F6F0E4", "#E8DCC4"),
      warning: callout("#301C22", "#F0C0C4", "#F8E8EA", "#F0D0D4"),
      activity: callout("#182820", "#B4D0C0", "#E8F4EC", "#D0E4D8"),
      assessment: callout("#2A241C", "#E4D0B4", "#F6F0E6", "#E8DCC8"),
      summary: callout("#1A2430", "#C4D2E4", "#E8EEF6", "#D4E0EE"),
    },
  },
  "workbook-coral": {
    id: "workbook-coral",
    name: "Workbook Coral",
    mode: "light",
    intent: "Warm paper and a controlled coral, kept for labels rather than long text.",
    paper: "#FBF7F4",
    surface: "#F6EDE6",
    text: "#1F1814",
    textMuted: "#4A3C36",
    accent: "#8C3A32",
    accentTint: "#F6E4DE",
    onAccent: "#FFF8F6",
    border: "#7A655C",
    callouts: {
      info: callout("#E7F1F3", "#0F4C5C", "#0C333C", "#0F4C5C"),
      definition: callout("#F6E8E4", "#8C3A32", "#5C241E", "#8C3A32"),
      note: callout("#F8F3E4", "#6B5428", "#3F3418", "#6B5428"),
      warning: callout("#F8E6E2", "#8C3A32", "#5C2018", "#8C3A32"),
      activity: callout("#E8F3EA", "#1F4D3A", "#143528", "#1F4D3A"),
      assessment: callout("#F8EFE4", "#7A3E12", "#542C0C", "#7A3E12"),
      summary: callout("#E8F0EA", "#1B4332", "#10281C", "#1B4332"),
    },
  },
  "learner-sky": {
    id: "learner-sky",
    name: "Learner Sky",
    mode: "light",
    intent: "Clear navy type and a friendly blue accent sized for younger readers.",
    paper: "#F5F8FB",
    surface: "#E7F0F6",
    text: "#162033",
    textMuted: "#3A4A5C",
    accent: "#1E3A8A",
    accentTint: "#D9E4F6",
    onAccent: "#F5F8FF",
    border: "#5C6E86",
    callouts: {
      info: callout("#E6EEF8", "#1E3A8A", "#172E5C", "#1E3A8A"),
      definition: callout("#E8F0E8", "#1B4332", "#10281C", "#1B4332"),
      note: callout("#F8F3E0", "#6B5428", "#3F3418", "#6B5428"),
      warning: callout("#F8E8E4", "#9F1239", "#6B1028", "#9F1239"),
      activity: callout("#E5F4EA", "#1F4D3A", "#143528", "#1F4D3A"),
      assessment: callout("#F8EFE4", "#7A3E12", "#542C0C", "#7A3E12"),
      summary: callout("#E7F2F4", "#0F4C5C", "#0C333C", "#0F4C5C"),
    },
  },
  "editorial-parchment": {
    id: "editorial-parchment",
    name: "Editorial Parchment",
    mode: "light",
    intent: "Parchment paper and ink black, with a short bronze rule as the only accent.",
    paper: "#F6F1E8",
    surface: "#EFE7DA",
    text: "#1A1612",
    textMuted: "#4A4038",
    accent: "#6B4423",
    accentTint: "#EFE2D2",
    onAccent: "#FBF7F2",
    border: "#7A6A58",
    callouts: {
      info: callout("#E8EEF0", "#1B3A4B", "#122833", "#1B3A4B"),
      definition: callout("#F3EADF", "#6B4423", "#3F2A14", "#6B4423"),
      note: callout("#F7F1E4", "#5C4A30", "#3A301C", "#5C4A30"),
      warning: callout("#F8E8E4", "#7A2E3A", "#4C1C24", "#7A2E3A"),
      activity: callout("#E8F0E8", "#245C45", "#143028", "#245C45"),
      assessment: callout("#F6EEE4", "#6B4423", "#3F2A14", "#6B4423"),
      summary: callout("#EEE8E0", "#3F3A33", "#241E18", "#3F3A33"),
    },
  },
  "classic-bronze": {
    id: "classic-bronze",
    name: "Classic Bronze",
    mode: "light",
    intent: "Warm neutrals and bronze rules for classic chapter openings.",
    paper: "#F8F4EE",
    surface: "#F1E9DE",
    text: "#1C1814",
    textMuted: "#4E453C",
    accent: "#6B3A2A",
    accentTint: "#F0E0D4",
    onAccent: "#FBF6F3",
    border: "#7A6858",
    callouts: {
      info: callout("#E7EEF1", "#1B3A4B", "#122833", "#1B3A4B"),
      definition: callout("#F4E8E0", "#6B3A2A", "#3F2218", "#6B3A2A"),
      note: callout("#F7F2E6", "#5C4A30", "#3A301C", "#5C4A30"),
      warning: callout("#F8E6E2", "#8C3A32", "#5C221C", "#8C3A32"),
      activity: callout("#E7F1E8", "#1F4D3A", "#143528", "#1F4D3A"),
      assessment: callout("#F6EEE6", "#6B4423", "#3F2A14", "#6B4423"),
      summary: callout("#EFE8DE", "#3F342C", "#261C16", "#3F342C"),
    },
  },
};

function assertPalette(palette: BookPalette): void {
  const pairs: Array<[string, string, string]> = [
    ["text on paper", palette.text, palette.paper],
    ["muted on paper", palette.textMuted, palette.paper],
    ["text on surface", palette.text, palette.surface],
    ["onAccent on accent", palette.onAccent, palette.accent],
    ["text on tint", palette.text, palette.accentTint],
  ];
  for (const entry of Object.values(palette.callouts)) {
    pairs.push(["callout text", entry.text, entry.surface]);
    pairs.push(["callout label", entry.label, entry.surface]);
  }
  for (const [label, fg, bg] of pairs) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      throw new Error(`${palette.id} ${label} contrast ${ratio.toFixed(2)} is below WCAG AA`);
    }
  }
}

Object.values(BOOK_PALETTES).forEach(assertPalette);

export const PALETTE_LIST = Object.values(BOOK_PALETTES);
