import type { MathConfigField, MathStyleVariant } from "./types";
import { MATH_TOKENS, WORKSHEET_PALETTES } from "./tokens";
export { WORKSHEET_PALETTES } from "./tokens";
export const worksheetString = (value: unknown) => String(value ?? "");
export const worksheetNumber = (value: unknown, fallback: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));

/** Conservative, portable wrapping for editable vector text. */
export function worksheetLines(value: unknown, width: number, size: number): string[] {
  const capacity = Math.max(1, Math.floor(width / (size * .62)));
  return worksheetString(value).split("\n").flatMap(paragraph => {
    const result: string[] = []; let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) for (const chunk of word.match(new RegExp(`.{1,${capacity}}`, "gu")) || []) {
      if (current && current.length + chunk.length + 1 > capacity) { result.push(current); current = ""; }
      current = current ? `${current} ${chunk}` : chunk;
    }
    result.push(current); return result;
  });
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
export const WORKSHEET_DESIGN_DEFAULTS = {
  fontSize: 20, answerGap: 16, questionGap: 26, lineSpacing: 32, answerLines: 2, startNumber: 1, showExample: false,
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
export function worksheetNumberLabel(index: number, data: Record<string, unknown>) {
  const n = index + Math.round(worksheetNumber(data.startNumber, 1, 1, 999));
  if (data.numberingStyle === "q") return `Q${n}`;
  if (data.numberingStyle === "letters") { let rest = n, label = ""; while (rest > 0) { rest--; label = String.fromCharCode(97 + rest % 26) + label; rest = Math.floor(rest / 26); } return label; }
  return String(n);
}
