import React from "react";
import type { MathConfigField, MathRendererProps, MathTemplate, MathTopic } from "../types";
import { MATH_TOKENS } from "../tokens";
import { worksheetLines, worksheetColors, WORKSHEET_DESIGN_FIELDS, worksheetNumberLabel, WORKSHEET_COMPACT_SPACING, worksheetResponseLayout } from "../worksheetDesign";
import { PREMIUM_EXERCISE_TEMPLATES } from "./premiumExerciseTemplates";
export { worksheetLines } from "../worksheetDesign";

export interface WorksheetRow { prompt: string; answer: string; working?: string }
const { ink, muted, line, paper, wash } = MATH_TOKENS.print;
const bounded = (value: unknown, fallback: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
const string = (value: unknown) => String(value ?? "");

function worksheetLayout(data: Record<string, unknown>, width: number) {
  const plain = data.presentation === "plain";
  const size = bounded(data.fontSize, 20, 14, 28), leading = size * 1.45;
  const answerLeading = Math.max(leading, bounded(data.lineSpacing, WORKSHEET_COMPACT_SPACING.lineSpacing, 20, 56));
  const title = plain && !string(data.title).trim() ? [] : worksheetLines(data.title, width - 48, size + 4);
  const instructions = plain && !string(data.instructions).trim() ? [] : worksheetLines(data.instructions, width - 48, size - 3);
  let y = 30 + title.length * (size + 8) + instructions.length * leading + 18;
  const rows = Array.isArray(data.questions) ? data.questions as WorksheetRow[] : [];
  const laidOut = rows.map(row => {
    const prompt = worksheetLines(row.prompt, width - 84, size);
    const working = data.layout === "worked" && string(row.working).trim() ? worksheetLines(row.working, width - 84, size - 2) : [];
    const response = worksheetResponseLayout({ ...data, answerLines: data.answerLines ?? 1 }, row.answer, width - 100, size, answerLeading, plain);
    const top = y, promptEnd = top + (prompt.length - 1) * leading + size;
    const gap = bounded(data.answerGap, WORKSHEET_COMPACT_SPACING.answerGap, 0, 96);
    const workingTop = promptEnd + gap;
    const labelTop = working.length ? workingTop + size - 2 + (working.length - 1) * leading + gap : promptEnd + gap;
    const answerTop = labelTop + response.labelHeight;
    y = labelTop + response.height + bounded(data.questionGap, WORKSHEET_COMPACT_SPACING.questionGap, 12, 96);
    return { row, prompt, answer: response.lines, response, working, workingTop, count: response.count, top, labelTop, answerTop, bottom: y };
  });
  // A generous empty workspace remains after removing every question.
  return { size, leading, answerLeading, title, instructions, rows: laidOut, height: Math.max(160, y + 20) };
}

export const WorksheetRenderer: React.FC<MathRendererProps> = props => {
  const { data, mode, styleVariant, width, height } = props;
  if (data.presentation === "plain") return PlainWorksheetRenderer(props);
  const metrics = worksheetLayout(data, width);
  const colors = worksheetColors(data, styleVariant);
  const { accent, tint } = colors;
  const text = (value: string, x: number, y: number, size: number, fill = ink, bold: boolean | number = false, key = value) => <text key={key} x={x} y={y} fontSize={size} fill={fill} fontWeight={typeof bold === "number" ? bold : bold ? 700 : 400}>{value}</text>;
  const actualHeight = Math.max(height, metrics.height);
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${width} ${actualHeight}`} aria-label={string(data.title)} fontFamily="Inter, sans-serif">
    <rect x={.5} y={.5} width={width - 1} height={actualHeight - 1} rx={16} fill={paper} stroke={line} />
    <rect x={24} y={20} width={32} height={3} rx={1.5} fill={accent} />
    {metrics.title.map((value, i) => text(value, 24, 44 + i * (metrics.size + 8), metrics.size + 4, accent, true, `title-${i}`))}
    {metrics.instructions.map((value, i) => text(value, 24, 30 + metrics.title.length * (metrics.size + 8) + (i + .8) * metrics.leading, metrics.size - 3, muted, false, `instructions-${i}`))}
    {metrics.rows.map((r, index) => {
      const show = mode === "teacher" || (data.showExample === true && index === 0);
      return <g key={`question-${index}`}>
        <rect x={18} y={r.top - 10} width={width - 36} height={r.bottom - r.top - 8} rx={bounded(data.cornerRadius, 10, 0, 24)} fill={data.showPanels === false ? paper : index % 2 === 0 ? tint : paper} />
        <circle cx={38} cy={r.top + 9} r={13} fill={paper} stroke={line} />
        <text key="number" x={38} y={r.top + 14} textAnchor="middle" fontSize={14} fill={accent} fontWeight={700}>{data.showNumbering === false ? "" : worksheetNumberLabel(index, data)}</text>
        {r.prompt.map((value, i) => text(value, 62, r.top + metrics.size + i * metrics.leading, metrics.size, colors.ink, bounded(data.questionWeight, 600, 400, 700), `prompt-${i}`))}
        {r.working.map((value, i) => text(show ? value : "", 62, r.workingTop + metrics.size - 2 + i * metrics.leading, metrics.size - 2, muted, false, `working-${i}`))}
        {data.responseStyle !== "open" && Array.from({ length: r.count }, (_, i) => <line key={`rule-${i}`} x1={62} x2={width - 30} y1={r.answerTop + metrics.size + i * metrics.answerLeading + 4} y2={r.answerTop + metrics.size + i * metrics.answerLeading + 4} stroke={colors.rule} strokeWidth={.8} />)}
        {show && r.answer.map((value, i) => text(value, 62, r.answerTop + metrics.size + i * metrics.answerLeading, metrics.size, colors.answer, false, `answer-${i}`))}
      </g>;
    })}
  </svg>;
};

/** Monochrome editorial Q&A, using the same editable data and measured layout. */
export const PlainWorksheetRenderer: React.FC<MathRendererProps> = ({ data, mode, styleVariant, width, height }) => {
  const colors = worksheetColors(data, styleVariant);
  const metrics = worksheetLayout(data, width), actualHeight = Math.max(height, metrics.height);
  const text = (value: string, x: number, y: number, size: number, key: string, weight = 400, fill = colors.ink) => <text key={key} x={x} y={y} fontSize={size} fill={fill} fontWeight={weight}>{value}</text>;
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${width} ${actualHeight}`} aria-label={string(data.title) || "Plain questions and answers"} fontFamily="Inter, sans-serif">
    <rect key="paper" x={0} y={0} width={width} height={actualHeight} fill={paper} />
    {metrics.title.map((value, i) => text(value, 24, 44 + i * (metrics.size + 8), metrics.size + 4, `title-${i}`, 600, colors.accent))}
    {metrics.instructions.map((value, i) => text(value, 24, 30 + metrics.title.length * (metrics.size + 8) + (i + .8) * metrics.leading, metrics.size - 3, `instructions-${i}`, 400, muted))}
    {metrics.rows.map((r, index) => {
      const show = mode === "teacher" || (data.showExample === true && index === 0);
      return <g key={`question-${index}`}>
        <text key="number" x={50} y={r.top + metrics.size} textAnchor="end" fontSize={metrics.size} fill={colors.accent} fontWeight={600}>{data.showNumbering === false ? "" : `${worksheetNumberLabel(index, data)}.`}</text>
        {r.prompt.map((value, i) => text(value, 62, r.top + metrics.size + i * metrics.leading, metrics.size, `prompt-${i}`, bounded(data.questionWeight, 600, 400, 700)))}
        {r.working.map((value, i) => text(show ? value : "", 62, r.workingTop + metrics.size - 2 + i * metrics.leading, metrics.size - 2, `working-${i}`, 400, muted))}
        {r.response.label.map((value, i) => text(value, 62, r.labelTop + (r.response.inlineLabel ? metrics.size : r.response.labelSize) + i * r.response.labelLeading, metrics.size - 4, `answer-label-${i}`, 400, muted))}
        {data.responseStyle !== "open" && Array.from({ length: r.count }, (_, i) => <line key={`rule-${i}`} x1={62 + r.response.indent} x2={width - 30} y1={r.answerTop + metrics.size + i * metrics.answerLeading + 4} y2={r.answerTop + metrics.size + i * metrics.answerLeading + 4} stroke={colors.rule} strokeWidth={.8} />)}
        {show && r.answer.map((value, i) => text(value, 62 + r.response.indent, r.answerTop + metrics.size + i * metrics.answerLeading, metrics.size, `answer-${i}`, 400, colors.answer))}
      </g>;
    })}
  </svg>;
};

const commonFields = (data: Record<string, unknown>): MathConfigField[] => [
  { key: "title", label: "Exercise title", type: "text", defaultValue: data.title },
  { key: "instructions", label: "Instructions", type: "text", defaultValue: data.instructions },
  { key: "questions", label: "Questions & answers", type: "items", defaultValue: data.questions },
  { key: "answerLines", label: "Answer lines per question", type: "number", defaultValue: data.answerLines, min: 1, max: 8 },
  { key: "showExample", label: "Show first solved example to students", type: "boolean", defaultValue: data.showExample },
  { key: "startNumber", label: "Start numbering at", type: "number", defaultValue: 1, min: 1, max: 999 },
  { key: "fontSize", label: "Text size", type: "number", defaultValue: 20, min: 14, max: 28 },
  { key: "layout", label: "Answer layout", type: "select", defaultValue: data.layout, options: [{ label: "Short answer", value: "short" }, { label: "Long answer", value: "long" }, { label: "Worked solution", value: "worked" }] },
];

function worksheet(id: string, name: string, category: MathTopic, title: string, instructions: string, questions: WorksheetRow[], layout = "short", answerLines = 1, showExample = true): MathTemplate {
  const defaultData = { ...WORKSHEET_COMPACT_SPACING, title, instructions, questions, layout, answerLines, showExample, startNumber: 1, fontSize: 20 };
  return { id: `worksheet-${id}`, name, category, grades: [1, 2, 3, 4, 5], subcategory: "Ready-made Q&A", chapterTag: "Question & Answer Studio", type: "practice",
    tags: ["question and answer", "q&a", "worksheet", "ready made", "editable", name.toLowerCase()], defaultData, defaultWidth: 460,
    defaultHeight: worksheetLayout(defaultData, 460).height, measureHeight: (data, width) => worksheetLayout(data, width).height,
    styleVariants: ["clean", "color-coded", "visual"], renderer: WorksheetRenderer, configFields: [...commonFields(defaultData), ...WORKSHEET_DESIGN_FIELDS.filter(f => !commonFields(defaultData).some(existing => existing.key === f.key))],
    a11yDescription: `${name}. Editable questions, answer key and student writing space.` };
}

const row = (prompt: string, answer: string, working?: string): WorksheetRow => ({ prompt, answer, working: working ?? "" });

const plainBase = worksheet("plain-question-answer", "Question & Answer · Plain", "assessment", "Questions & Answers", "Read each question. Write your answer below.", [
  row("What is a noun?", "A noun names a person, place, animal or thing."),
  row("Why do plants need sunlight?", "Plants use sunlight to make their food."),
  row("What is evaporation?", "Evaporation is the change of a liquid into a gas."),
], "short", 2, false);
const plainData = { ...plainBase.defaultData, presentation: "plain", answerLabel: "Answer", showAnswerLabel: true, responseStyle: "ruled", lineSpacing: 28, questionGap: 20 };
export const PlainQuestionAnswerTemplate: MathTemplate = {
  ...plainBase, defaultData: plainData, defaultHeight: worksheetLayout(plainData, plainBase.defaultWidth).height,
  tags: [...plainBase.tags, "plain", "minimal", "simple", "any subject", "english", "science", "blank answer space"],
  configFields: [
    ...commonFields(plainData),
    { key: "presentation", label: "Presentation", type: "select", defaultValue: "plain", options: [{ label: "Plain editorial", value: "plain" }, { label: "Shaded question cards", value: "cards" }] },
    { key: "answerLabel", label: "Answer label", type: "text", defaultValue: "Answer" },
    { key: "showAnswerLabel", label: "Show answer label", type: "boolean", defaultValue: true },
    { key: "responseStyle", label: "Writing space", type: "select", defaultValue: "ruled", options: [{ label: "Fine ruled lines", value: "ruled" }, { label: "Open blank space", value: "open" }] },
    { key: "lineSpacing", label: "Writing line spacing (pt)", type: "number", defaultValue: 28, min: 20, max: 56 },
    { key: "questionGap", label: "Space between questions (pt)", type: "number", defaultValue: 20, min: 12, max: 80 },
  ],
};

PlainQuestionAnswerTemplate.configFields.push(...WORKSHEET_DESIGN_FIELDS.filter(field => !PlainQuestionAnswerTemplate.configFields.some(existing => existing.key === field.key)));

export const WORKSHEET_TEMPLATES: MathTemplate[] = [
  worksheet("short-answer", "Question & Answer · Short answers", "assessment", "Think. Solve. Answer.", "Read each question. Write your answer on the line.", [row("What is the place value of 5 in 8,750?", "5 tens = 50"), row("Write 54,012 in words.", "Fifty-four thousand twelve"), row("Find the sum of 345 and 278.", "623")], "short", 1, false),
  PlainQuestionAnswerTemplate,
  worksheet("long-answer", "Question & Answer · Explain your thinking", "word-problems", "Show your thinking", "Use the answer lines to explain each step.", [row("A library has 1,250 books. It receives 375 more. How many books are there now?", "1,250 + 375 = 1,625 books."), row("A school buys 8 boxes of pencils. Each box contains 24 pencils. How many pencils are bought?", "8 × 24 = 192 pencils.")], "long", 3, false),
  worksheet("worked-solution", "Question & Answer · Worked solutions", "assessment", "Learn by solving", "Study the example, then solve the next question.", [row("Find 345 + 278.", "623", "Ones: 5 + 8 = 13; carry 1.\nTens: 4 + 7 + 1 = 12; carry 1.\nHundreds: 3 + 2 + 1 = 6."), row("Find 426 + 157.", "583", "Ones: 6 + 7 = 13; carry 1.\nTens: 2 + 5 + 1 = 8.\nHundreds: 4 + 1 = 5.")], "worked", 1),
  worksheet("write-figures", "Write in figures · Answer lines", "numbers", "Write in figures", "One has been done for you.", [row("Twenty-one thousand five hundred sixty-two", "21,562"), row("Fifty-four thousand twelve", "54,012"), row("Seventy-three thousand seven hundred fifty-seven", "73,757"), row("Two lakh ninety-eight thousand", "2,98,000")]),
  worksheet("number-names", "Write number names · Answer lines", "numbers", "Write the number names", "One has been done for you.", [row("64,247", "Sixty-four thousand two hundred forty-seven"), row("98,082", "Ninety-eight thousand eighty-two"), row("4,44,344", "Four lakh forty-four thousand three hundred forty-four"), row("2,57,301", "Two lakh fifty-seven thousand three hundred one")]),
  worksheet("short-form", "Expanded to short form", "place-value", "Write in short form", "Combine the place values. One example is complete.", [row("2,00,000 + 30,000 + 500 + 6", "2,30,506"), row("50,000 + 5,000 + 300 + 90 + 2", "55,392"), row("7,00,000 + 4,000 + 40 + 1", "7,04,041"), row("70,000 + 6,000 + 500 + 8", "76,508")]),
  worksheet("expanded-form", "Write in expanded form", "place-value", "Break it into place values", "Write each number as the sum of its place values.", [row("45,206", "40,000 + 5,000 + 200 + 6"), row("3,07,041", "3,00,000 + 7,000 + 40 + 1"), row("82,590", "80,000 + 2,000 + 500 + 90")]),
  worksheet("digit-value", "Find a digit’s place value", "place-value", "What is the value of 5?", "Find the place value of 5. One example is complete.", [row("8,750", "5 tens = 50"), row("4,520", "5 hundreds = 500"), row("15,600", "5 thousands = 5,000"), row("5,00,090", "5 lakhs = 5,00,000")]),
  worksheet("build-number", "Build a number from place clues", "place-value", "Build the number", "Combine the clues and write the number.", [row("4 hundreds, 5 tens, 1 ten thousand, 4 ones and 8 thousands", "18,454"), row("1 lakh, 5 ten thousands, 6 ones, 2 hundreds and 3 thousands", "1,53,206"), row("7 lakhs, 3 ten thousands, 7 ones, 8 hundreds, 3 thousands and 4 tens", "7,33,847")], "short", 1, false),
  worksheet("commas-words", "Missing commas & number names", "numbers", "Commas make numbers clearer", "Add Indian-system commas, then write the number name.", [row("7895", "7,895 — Seven thousand eight hundred ninety-five"), row("34952", "34,952 — Thirty-four thousand nine hundred fifty-two"), row("148325", "1,48,325 — One lakh forty-eight thousand three hundred twenty-five")], "long", 2),
  worksheet("fraction-response", "Fractions · Question & answer", "fractions", "Fraction fluency", "Solve and explain using equal parts.", [row("What is 1/4 of 20?", "5", "20 ÷ 4 = 5"), row("Simplify 6/8.", "3/4", "Divide numerator and denominator by 2."), row("Find 2/5 + 1/5.", "3/5", "Add the numerators; keep the denominator.")], "worked", 1, false),
  worksheet("equation-steps", "Missing numbers · Equation steps", "operations", "Find the missing number", "Show the inverse operation you use.", [row("□ + 18 = 45", "27", "45 − 18 = 27"), row("7 × □ = 56", "8", "56 ÷ 7 = 8"), row("□ ÷ 6 = 9", "54", "9 × 6 = 54")], "worked", 2, false),
  worksheet("quick-check", "Quick check · Mixed maths worksheet", "assessment", "Quick check", "Complete the questions. Check your calculations.", [row("Round 3,475 to the nearest hundred.", "3,500"), row("Find the area of a rectangle: 8 cm × 5 cm.", "40 cm²"), row("Convert 3 km into metres.", "3,000 m"), row("A lesson starts at 09:15 and lasts 45 minutes. When does it finish?", "10:00")], "short", 1, false),
];

function numberList(data: Record<string, unknown>): number[] {
  return (Array.isArray(data.numbers) ? data.numbers : []).map(value => Number(string(value).replace(/,/g, ""))).filter(Number.isFinite);
}
const format = (value: number, data: Record<string, unknown>) => new Intl.NumberFormat(data.system === "international" ? "en-US" : "en-IN", { maximumFractionDigits: 12 }).format(value);

export const NumberExerciseRenderer: React.FC<MathRendererProps> = ({ data, mode, styleVariant, width, height }) => {
  const numbers = numberList(data), descending = data.direction === "descending";
  const sorted = [...numbers].sort((a, b) => descending ? b - a : a - b);
  const colors = worksheetColors(data, styleVariant);
  const { accent, tint } = colors;
  const kind = string(data.kind), teacher = mode === "teacher", size = 16;
  const nodes: React.ReactNode[] = [];
  const text = (value: string, x: number, y: number, key: string, color = colors.ink, fontSize = size, anchor: "start" | "middle" = "start") => <text key={key} x={x} y={y} fill={color} fontSize={fontSize} textAnchor={anchor}>{value}</text>;
  const title = worksheetLines(data.title, width - 48, 22), instructions = worksheetLines(data.instructions, width - 48, 16);
  const top = 32 + title.length * 29 + instructions.length * 23;
  if (kind === "marked-line") {
    const start = Number(data.start) || 0, end = Math.max(start + 1, Number(data.end) || 400000);
    const intervals = Math.round(bounded(data.intervals, 30, 2, 50)), left = 46, right = width - 46, y = top + 116;
    nodes.push(<line key="axis" x1={left - 14} x2={right + 14} y1={y} y2={y} stroke={accent} strokeWidth={2} />);
    nodes.push(<path key="arrowheads" d={`M${left - 14},${y} l9,-5 v10 Z M${right + 14},${y} l-9,-5 v10 Z`} fill={accent} />);
    for (let i = 0; i <= intervals; i++) {
      const x = left + (right - left) * i / intervals, major = i === 0 || i === intervals || i % 10 === 0;
      nodes.push(<line key={`tick-${i}`} x1={x} x2={x} y1={y - (major ? 10 : 5)} y2={y + (major ? 10 : 5)} stroke={accent} />);
      if (major) nodes.push(text(format(start + (end - start) * i / intervals, data), x, y + 30, `tick-label-${i}`, muted, 13, "middle"));
    }
    const points = Array.isArray(data.points) ? data.points as { label: string; value: number }[] : [];
    points.forEach((point, i) => {
      if (!Number.isFinite(Number(point.value)) || point.value < start || point.value > end) return;
      const x = left + (right - left) * (point.value - start) / (end - start), labelY = top + 22 + i % 2 * 42;
      nodes.push(<line key={`pointer-${i}`} x1={x} x2={x} y1={labelY + 8} y2={y - 13} stroke={muted} />);
      nodes.push(text(string(point.label), x, labelY, `point-${i}`, accent, 16, "middle"));
      nodes.push(text(teacher ? format(Number(point.value), data) : "______", x, labelY - 19, `value-${i}`, ink, 13, "middle"));
    });
  } else if (kind === "digit-cards") {
    numbers.forEach((number, i) => {
      const digits = string(number).split(""), cw = Math.min(36, (width - 70) / Math.max(1, digits.length)), x = 28, y = top + i * 56;
      digits.forEach((digit, j) => {
        const color = styleVariant === "clean" ? { bg: wash, text: ink } : Object.values(MATH_TOKENS.placeColors)[(digits.length - j - 1) % 5];
        nodes.push(<rect key={`card-${i}-${j}`} x={x + j * cw} y={y} width={cw - 3} height={36} rx={5} fill={color.bg} stroke={colors.rule} />);
        nodes.push(text(digit, x + j * cw + (cw - 3) / 2, y + 24, `digit-${i}-${j}`, color.text, 20, "middle"));
      });
    });
    const answer = worksheetLines(teacher ? sorted.map(n => format(n, data)).join(descending ? " > " : " < ") : "Answer: __________________________________", width - 56, 16);
    answer.forEach((value, i) => nodes.push(text(value, 28, top + numbers.length * 56 + 18 + i * 23, `answer-${i}`, accent)));
  } else {
    const columns = Math.max(1, Math.min(5, numbers.length)), cw = (width - 56) / columns;
    const source = worksheetLines(`Numbers: ${numbers.map(n => format(n, data)).join("; ")}`, width - 56, 16);
    source.forEach((value, i) => nodes.push(text(value, 28, top + 15 + i * 23, `source-${i}`)));
    const base = top + source.length * 23 + 20;
    sorted.forEach((number, i) => {
      const column = i % columns, row = Math.floor(i / columns), x = 28 + column * cw;
      const y = base + row * 140 + (kind === "stairs" ? (descending ? column : columns - 1 - column) * 25 : 0);
      nodes.push(<rect key={`box-${i}`} x={x} y={y} width={cw - 22} height={42} rx={kind === "stairs" ? 4 : 8} fill={tint} stroke={accent} />);
      nodes.push(text(teacher ? format(number, data) : "", x + (cw - 22) / 2, y + 27, `ordered-${i}`, accent, 16, "middle"));
      if (column < columns - 1 && i < sorted.length - 1) nodes.push(text(descending ? ">" : "<", x + cw - 13, y + 27, `sign-${i}`, muted));
      if (kind === "stairs" && column < columns - 1 && i < sorted.length - 1) nodes.push(<line key={`step-${i}`} x1={x + cw - 22} y1={y + 21} x2={x + cw} y2={y + 21 + (descending ? 25 : -25)} stroke={accent} strokeWidth={2} />);
    });
  }
  return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fontFamily="Inter, sans-serif" aria-label={string(data.title)}>
    <rect x={.5} y={.5} width={width - 1} height={height - 1} rx={16} fill={paper} stroke={colors.rule} />
    {title.map((value, i) => text(value, 24, 34 + i * 29, `title-${i}`, accent, 22))}
    {instructions.map((value, i) => text(value, 24, 32 + title.length * 29 + i * 23, `instructions-${i}`, muted))}
    {nodes}
  </svg>;
};

function numberExerciseHeight(data: Record<string, unknown>, width: number) {
  const top = 32 + worksheetLines(data.title, width - 48, 22).length * 29 + worksheetLines(data.instructions, width - 48, 16).length * 23;
  const numbers = numberList(data);
  if (data.kind === "marked-line") return top + 180;
  if (data.kind === "digit-cards") return top + numbers.length * 56 + worksheetLines(numbers.map(n => format(n, data)).join(" < "), width - 56, 16).length * 23 + 42;
  const sourceHeight = worksheetLines(`Numbers: ${numbers.map(n => format(n, data)).join("; ")}`, width - 56, 16).length * 23;
  return top + sourceHeight + Math.max(1, Math.ceil(numbers.length / 5)) * 140 + 24;
}
function numberExercise(id: string, name: string, kind: string, data: Record<string, unknown>): MathTemplate {
  const defaultData = { kind, title: name, instructions: "Arrange the numbers from smallest to largest.", numbers: [67200, 60250, 62380, 60830], direction: "ascending", system: "indian", ...data };
  return { id: `worksheet-${id}`, name, category: "numbers", grades: [3, 4, 5], chapterTag: "Number Sense Studio", type: "practice", tags: ["worksheet", "ordering", "comparison", "ascending", "descending", "number line", kind, name.toLowerCase()],
    defaultData, defaultWidth: 460, defaultHeight: numberExerciseHeight(defaultData, 460), measureHeight: numberExerciseHeight, renderer: NumberExerciseRenderer, styleVariants: ["clean", "color-coded", "visual"],
    configFields: [
      { key: "title", label: "Exercise title", type: "text", defaultValue: defaultData.title },
      { key: "instructions", label: "Instructions", type: "text", defaultValue: defaultData.instructions },
      { key: "numbers", label: "Numbers", type: "array-numbers", defaultValue: defaultData.numbers },
      { key: "direction", label: "Order", type: "select", defaultValue: defaultData.direction, options: [{ label: "Ascending", value: "ascending" }, { label: "Descending", value: "descending" }] },
      { key: "system", label: "Numbering system", type: "select", defaultValue: "indian", options: [{ label: "Indian", value: "indian" }, { label: "International", value: "international" }] },
    ] };
}
export const NUMBER_EXERCISE_TEMPLATES: MathTemplate[] = [
  numberExercise("ascending-boxes", "Ascending order · Answer boxes", "ordering", {}),
  numberExercise("descending-boxes", "Descending order · Answer boxes", "ordering", { direction: "descending", instructions: "Arrange the numbers from largest to smallest.", numbers: [46806, 30767, 55333, 92910] }),
  numberExercise("ascending-stairs", "Ascending order · Number staircase", "stairs", { numbers: [3980, 3896, 3698, 3869], instructions: "The numbers increase as you climb the staircase." }),
  numberExercise("descending-stairs", "Descending order · Number staircase", "stairs", { direction: "descending", numbers: [56390, 59370, 58700, 59730, 57800], instructions: "The numbers decrease as you move down the staircase." }),
  numberExercise("digit-card-comparison", "Compare & order · Digit cards", "digit-cards", { numbers: [72019, 72990, 72985], instructions: "Compare digits from the left, then write the increasing order." }),
  numberExercise("marked-number-line", "Read a number line · Labelled points", "marked-line", { instructions: "Read the scale and write the value at each labelled point.", start: 100000, end: 400000, intervals: 30, points: [{ label: "A", value: 150000 }, { label: "B", value: 230000 }, { label: "C", value: 290000 }, { label: "D", value: 380000 }] }),
];

function gridLayout(data: Record<string, unknown>, width: number) {
  const columns = Math.round(bounded(data.columns, 12, 2, 20)), rows = Math.round(bounded(data.rows, 8, 2, 30));
  const cell = Math.min(bounded(data.cellSize, 28, 18, 40), (width - 48) / columns);
  const title = worksheetLines(data.title, width - 48, 22), instructions = worksheetLines(data.instructions, width - 48, 16);
  const instructionY = 34 + title.length * 28;
  const y = instructionY + instructions.length * 22 + 20;
  return { columns, rows, cell, title, instructions, instructionY, y, height: y + rows * cell + 24 };
}
const gridData = { title: "Calculation workspace", instructions: "Align each digit with its place value. Show your working.", columns: 12, rows: 8, cellSize: 28 };
export const CalculationGridTemplate: MathTemplate = {
  id: "worksheet-calculation-grid", name: "Calculation workspace · Square grid", category: "operations", grades: [1, 2, 3, 4, 5], chapterTag: "Question & Answer Studio", type: "activity", tags: ["working", "squared paper", "calculation grid", "carry", "borrow", "worksheet"], defaultData: gridData, defaultWidth: 460, defaultHeight: gridLayout(gridData, 460).height,
  styleVariants: ["clean", "color-coded", "visual"], configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: gridData.title }, { key: "instructions", label: "Instructions", type: "text", defaultValue: gridData.instructions },
    { key: "columns", label: "Grid columns", type: "number", defaultValue: 12, min: 2, max: 20 }, { key: "rows", label: "Grid rows", type: "number", defaultValue: 8, min: 2, max: 30 }, { key: "cellSize", label: "Cell size", type: "number", defaultValue: 28, min: 18, max: 40 },
  ],
  measureHeight: (data, width) => gridLayout(data, width).height,
  renderer: ({ data, width, height, styleVariant }) => {
    const { columns, rows, cell, title, instructions, instructionY, y } = gridLayout(data, width);
    const colors = worksheetColors(data, styleVariant);
    const x = (width - columns * cell) / 2;
    return <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fontFamily="Inter, sans-serif" aria-label={string(data.title)}>
      <rect x={.5} y={.5} width={width - 1} height={height - 1} rx={16} fill={paper} stroke={colors.rule} />
      {title.map((value, i) => <text key={`title-${i}`} x={24} y={34 + i * 28} fontSize={22} fill={colors.accent}>{value}</text>)}
      {instructions.map((value, i) => <text key={`instruction-${i}`} x={24} y={instructionY + i * 22} fontSize={16} fill={muted}>{value}</text>)}
      {Array.from({ length: columns + 1 }, (_, i) => <line key={`column-${i}`} x1={x + i * cell} x2={x + i * cell} y1={y} y2={y + rows * cell} stroke={colors.rule} />)}
      {Array.from({ length: rows + 1 }, (_, i) => <line key={`row-${i}`} x1={x} x2={x + columns * cell} y1={y + i * cell} y2={y + i * cell} stroke={colors.rule} />)}
    </svg>;
  },
};

export const READY_MADE_MATH_TEMPLATES = [...PREMIUM_EXERCISE_TEMPLATES, ...WORKSHEET_TEMPLATES, ...NUMBER_EXERCISE_TEMPLATES, CalculationGridTemplate];
