import { worksheetLines, worksheetNumber, worksheetString } from "./worksheetDesign";
import { textWidth } from "../educational/publicationScene";

export const WORD_PROBLEM_DEFAULTS = {
  title: "Word Problem", fontSize: 10.5,
  story: "A fruit seller had 450 apples. He sold 285 apples during the day. How many apples are left with him?",
  operation: "Subtraction (450 - 285)", answer: "165 apples",
};

/** Preserve text edits from the former HTML card when it adopts the vector layout. */
export function wordProblemData(data: Record<string, unknown>, overrides: Record<string, { source?: string; text?: string }> = {}) {
  const next = { ...data };
  for (const [id, override] of Object.entries(overrides)) {
    if (id.includes("/k") || override.text === undefined || !override.source) continue;
    for (const field of ["title", "story", "operation", "answer"] as const) {
      if (override.source === (data[field] ?? WORD_PROBLEM_DEFAULTS[field])) { next[field] = override.text; break; }
    }
  }
  return next;
}

/** Story and solution fields occupy their measured lines, with no stretched gaps. */
export function wordProblemLayout(data: Record<string, unknown>, width: number) {
  const size = worksheetNumber(data.fontSize, WORD_PROBLEM_DEFAULTS.fontSize, 10, 20), leading = size * 1.4;
  const bodyWidth = Math.max(32, width - 24);
  const titleValue = worksheetString(data.title ?? WORD_PROBLEM_DEFAULTS.title);
  const title = titleValue.trim() ? worksheetLines(titleValue, bodyWidth, size + 1) : [];
  const story = worksheetLines(data.story ?? WORD_PROBLEM_DEFAULTS.story, bodyWidth, size);
  const storyTop = 12 + title.length * (size + 4) + (title.length ? 6 : 0);
  const solutionTop = storyTop + story.length * leading + 8;
  const columns = width >= 360 ? 2 : 1, cellWidth = (bodyWidth - 12 * (columns - 1)) / columns;
  const labelSize = Math.max(9, size * .8), labelWidth = textWidth("Operation:", labelSize, true, false, "Inter, sans-serif") + 8;
  const valueWidth = Math.max(32, cellWidth - labelWidth - 16);
  const fields = [
    { key: "operation", label: "Operation:", value: worksheetString(data.operation ?? WORD_PROBLEM_DEFAULTS.operation) },
    { key: "answer", label: "Answer:", value: worksheetString(data.answer ?? WORD_PROBLEM_DEFAULTS.answer) },
  ].map(field => ({ ...field, lines: worksheetLines(field.value, valueWidth, size) }));
  const rowHeights = Array.from({ length: Math.ceil(fields.length / columns) }, (_, row) => Math.max(...fields.slice(row * columns, (row + 1) * columns).map(field => field.lines.length)) * leading);
  const solutionHeight = rowHeights.reduce((sum, value) => sum + value, 0) + (rowHeights.length - 1) * 6 + 16;
  return { size, leading, title, story, storyTop, solutionTop, columns, cellWidth, labelSize, labelWidth, valueWidth, fields, rowHeights, solutionHeight, height: solutionTop + solutionHeight + 12 };
}
