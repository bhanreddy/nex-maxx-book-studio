import { DesignColorTokens } from "../../domain/element/types";
import { SUBJECT_THEMES } from "../../domain/theme/types";
import { BOOK_THEMES } from "../theme/bookThemes";
import { contrastRatio, toGrayHex } from "./contrast";
import { DESIGN_FAMILIES, DesignFamily } from "./families";
import { BOOK_PALETTES, BookPalette, CalloutTokens } from "./palettes";

export type CalloutKey = keyof BookPalette["callouts"];

function familyOf(familyId: string): DesignFamily {
  return DESIGN_FAMILIES[familyId] || DESIGN_FAMILIES["contemporary-academic"];
}

function paletteOf(paletteId: string): BookPalette {
  return BOOK_PALETTES[paletteId] || BOOK_PALETTES["academic-teal"];
}

export function tokensFromPalette(
  paletteId: string,
  familyId: string,
  callout: CalloutKey = "info"
): DesignColorTokens {
  const palette = paletteOf(paletteId);
  const family = familyOf(familyId);
  const chip: CalloutTokens = palette.callouts[callout] || palette.callouts.info;
  return {
    paper: palette.paper,
    surface: palette.surface,
    text: palette.text,
    textMuted: palette.textMuted,
    accent: palette.accent,
    accentTint: palette.accentTint,
    onAccent: palette.onAccent,
    border: palette.border,
    headingFont: family.headingFont,
    bodyFont: family.bodyFont,
    calloutSurface: chip.surface,
    calloutBorder: chip.border,
    calloutText: chip.text,
    calloutLabel: chip.label,
    mode: palette.mode,
  };
}

function readableMuted(muted: string, text: string, paper: string): string {
  return contrastRatio(muted, paper) >= 4.5 ? muted : text;
}

function onColor(accent: string, text: string): string {
  return contrastRatio("#F8FAFC", accent) >= 4.5 ? "#F8FAFC" : text;
}

export function tokensFromTheme(themeId: string, familyId: string): DesignColorTokens | null {
  const family = familyOf(familyId);
  const subject = SUBJECT_THEMES[themeId];
  if (subject) {
    const paper = subject.colors.background;
    const accent = subject.colors.primary;
    return {
      paper,
      surface: subject.colors.surface,
      text: subject.colors.text,
      textMuted: readableMuted(subject.colors.textMuted, subject.colors.text, paper),
      accent,
      accentTint: subject.colors.primaryLight,
      onAccent: onColor(accent, subject.colors.text),
      border: subject.colors.border,
      headingFont: family.headingFont,
      bodyFont: family.bodyFont,
      calloutSurface: subject.colors.primaryLight,
      calloutBorder: accent,
      calloutText: subject.colors.text,
      calloutLabel: accent,
      mode: "light",
    };
  }

  const book = BOOK_THEMES[themeId];
  if (!book) return null;
  const paper = book.tokens.surfaceColor;
  const accent = book.tokens.primaryColor;
  return {
    paper,
    surface: book.tokens.surfaceCard,
    text: book.tokens.textPrimary,
    textMuted: readableMuted(book.tokens.textSecondary, book.tokens.textPrimary, paper),
    accent,
    accentTint: book.tokens.surfaceCard,
    onAccent: onColor(accent, book.tokens.textPrimary),
    border: book.tokens.borderStrong,
    headingFont: family.headingFont,
    bodyFont: family.bodyFont,
    calloutSurface: book.tokens.surfaceCard,
    calloutBorder: book.tokens.borderStrong,
    calloutText: book.tokens.textPrimary,
    calloutLabel: accent,
    mode: "light",
  };
}

const COLOR_KEYS = [
  "paper",
  "surface",
  "text",
  "textMuted",
  "accent",
  "accentTint",
  "onAccent",
  "border",
  "calloutSurface",
  "calloutBorder",
  "calloutText",
  "calloutLabel",
] as const;

export function grayscaleTokens(tokens: DesignColorTokens): DesignColorTokens {
  const next: DesignColorTokens = { ...tokens, mode: "print" };
  for (const key of COLOR_KEYS) next[key] = toGrayHex(tokens[key]);
  if (contrastRatio(next.text, next.paper) < 4.5) {
    next.text = "#1A1A1A";
    next.textMuted = "#3F3F3F";
    next.paper = "#F4F4F2";
    next.surface = "#E6E6E4";
  }
  if (contrastRatio(next.onAccent, next.accent) < 4.5) {
    next.onAccent = "#F7F7F5";
    next.accent = "#2A2A2A";
  }
  if (contrastRatio(next.calloutText, next.calloutSurface) < 4.5) {
    next.calloutText = next.text;
    next.calloutLabel = next.text;
    next.calloutSurface = next.surface;
    next.calloutBorder = "#2A2A2A";
  }
  return next;
}
