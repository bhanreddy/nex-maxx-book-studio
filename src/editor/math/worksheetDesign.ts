import type { MathConfigField, MathStyleVariant } from "./types";
import { MATH_TOKENS, WORKSHEET_PALETTES } from "./tokens";
import { wrapText } from "../educational/publicationScene";
export { WORKSHEET_PALETTES } from "./tokens";
export const worksheetString = (value: unknown) => String(value ?? "");
export const worksheetNumber = (value: unknown, fallback: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));

/** Use the shared glyph measurement so short words do not waste a full line. */
export function worksheetLines(value: unknown, width: number, size: number): string[] {
  return wrapText(worksheetString(value), Math.max(1, width), size, true, false, "Inter, sans-serif");
}

export function worksheetPalettePatch(id: string) {
  const palette = WORKSHEET_PALETTES.find(p => p.id === id) || WORKSHEET_PALETTES[0];
  return { paletteId: palette.id, accentColor: palette.main, answerColor: palette.main, inkColor: MATH_TOKENS.print.ink, tintColor: palette.tint, ruleColor: palette.border };
}
export function nextWorksheetPalette(current: unknown, random = Math.random) {
  const choices = WORKSHEET_PALETTES.filter(p => p.id !== current && p.id !== "mono");
  return worksheetPalettePatch(choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))].id);
}
const color = (value: unknown, fallback: string) => /^#[\da-f]{6}$/i.test(String(value)) ? String(value) : fallback;
export function worksheetColors(data: Record<string, unknown>, variant: MathStyleVariant = "color-coded") {
  const defaultId = data.presentation === "plain" ? "mono" : variant === "visual" ? "teal" : "indigo";
  const p = WORKSHEET_PALETTES.find(palette => palette.id === (variant === "clean" ? "mono" : data.paletteId || defaultId)) || WORKSHEET_PALETTES[0];
  const clean = variant === "clean";
  return { accent: clean ? p.main : color(data.accentColor, p.main), answer: clean ? p.main : color(data.answerColor, p.main), ink: clean ? MATH_TOKENS.print.ink : color(data.inkColor, MATH_TOKENS.print.ink), tint: clean ? p.tint : color(data.tintColor, p.tint), rule: clean ? MATH_TOKENS.print.line : color(data.ruleColor, MATH_TOKENS.print.line), border: p.border, paper: MATH_TOKENS.print.paper, muted: MATH_TOKENS.print.muted };
}
export const WORKSHEET_COMPACT_SPACING = { answerGap: 4, questionGap: 12, lineSpacing: 24 };
export const WORKSHEET_DESIGN_DEFAULTS = {
  ...WORKSHEET_COMPACT_SPACING,
  fontSize: 20, answerLines: 1, startNumber: 1, showExample: false,
  showNumbering: true, showAnswerLabel: true, answerLabel: "Answer", responseStyle: "ruled", showPanels: true,
  cornerRadius: 12, numberingStyle: "numbers", questionWeight: 600, matchingColumnGap: 52,
};
export const WORKSHEET_DESIGN_FIELDS: MathConfigField[] = [
  ...([['fontSize', 'Text size (pt)', 14, 28], ['answerGap', 'Question → answer gap (pt)', 0, 96], ['questionGap', 'Space between questions (pt)', 12, 96], ['lineSpacing', 'Writing line spacing (pt)', 20, 56], ['answerLines', 'Answer lines per question', 1, 8], ['startNumber', 'Start numbering at', 1, 999], ['cornerRadius', 'Panel corner radius (pt)', 0, 24], ['matchingColumnGap', 'Matching column gap (pt)', 24, 100]] as const).map(([key, label, min, max]): MathConfigField => ({ key, label, type: 'number', defaultValue: WORKSHEET_DESIGN_DEFAULTS[key], min, max })),
  { key: "numberingStyle", label: "Question numbering", type: "select", defaultValue: "numbers", options: [{ label: "1, 2, 3", value: "numbers" }, { label: "a, b, c", value: "letters" }, { label: "Q1, Q2, Q3", value: "q" }] },
  { key: "questionWeight", label: "Question weight", type: "select", defaultValue: 600, options: [{ label: "Regular", value: 400 }, { label: "Semibold", value: 600 }, { label: "Bold", value: 700 }] },
  { key: "responseStyle", label: "Writing space", type: "select", defaultValue: "ruled", options: [{ label: "Fine ruled lines", value: "ruled" }, { label: "Open blank space", value: "open" }] },
  ...([['showNumbering', 'Show question numbers'], ['showAnswerLabel', 'Show answer label'], ['showPanels', 'Show soft question panels'], ['showExample', 'Show first solved example to students']] as const).map(([key, label]): MathConfigField => ({ key, label, type: 'boolean', defaultValue: WORKSHEET_DESIGN_DEFAULTS[key] })),
  { key: "answerLabel", label: "Answer label", type: "text", defaultValue: "Answer" },
  { key: "paletteId", label: "Color palette", type: "select", defaultValue: "indigo", options: WORKSHEET_PALETTES.map(p => ({ label: p.name, value: p.id })) },
  ...([['accentColor', 'Headings & numbering', 'accent'], ['answerColor', 'Teacher answers', 'answer'], ['inkColor', 'Question text', 'ink'], ['tintColor', 'Panel tint', 'tint'], ['ruleColor', 'Writing lines', 'rule']] as const).map(([key, label, slot]): MathConfigField => ({ key, label, type: 'color', defaultValue: worksheetColors({})[slot] })),
];
export const WORKSHEET_DESIGN_KEYS = WORKSHEET_DESIGN_FIELDS.map(field => field.key);

/** Inline labels share the first answer baseline instead of consuming a blank row. */
export function worksheetResponseLayout(data: Record<string, unknown>, answer: unknown, width: number, size: number, lineSpacing: number, includeLabel = true) {
  const labelSize = size - 4, labelLeading = labelSize * 1.25;
  const rawLabel = includeLabel && data.showAnswerLabel !== false ? worksheetString(data.answerLabel).trim() : "";
  const label = rawLabel ? worksheetLines(rawLabel.endsWith(":") ? rawLabel : `${rawLabel}:`, width, labelSize) : [];
  const labelWidth = label.length === 1 ? [...label[0]].reduce((width, char) => width + (/[iljtI.,:!]/.test(char) ? .28 : /[mwMW]/.test(char) ? .82 : /[A-Z]/.test(char) ? .66 : .54), 0) * labelSize + 8 : 0;
  const inlineLabel = label.length === 1 && labelWidth <= width * .4;
  const indent = inlineLabel ? labelWidth : 0;
  const labelHeight = label.length && !inlineLabel ? label.length * labelLeading + 4 : 0;
  const lines = worksheetLines(answer, Math.max(32, width - indent), size);
  const count = Math.max(Math.round(worksheetNumber(data.answerLines, 2, 1, 8)), lines.length);
  const height = labelHeight + size + (count - 1) * lineSpacing + 4;
  return { label, labelSize, labelLeading, inlineLabel, indent, labelHeight, lines, count, height };
}
export function worksheetNumberLabel(index: number, data: Record<string, unknown>) {
  const n = index + Math.round(worksheetNumber(data.startNumber, 1, 1, 999));
  if (data.numberingStyle === "q") return `Q${n}`;
  if (data.numberingStyle === "letters") { let rest = n, label = ""; while (rest > 0) { rest--; label = String.fromCharCode(97 + rest % 26) + label; rest = Math.floor(rest / 26); } return label; }
  return String(n);
}
