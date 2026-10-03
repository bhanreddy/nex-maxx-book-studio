import React from "react";
import type { MathTemplate, MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import { CalloutBox } from "./_kit";

// ────────────────────────────────────────────────────────────────────────────
// LAYOUT BLOCKS (Universal Pedagogical Textbook Components — All Grades 1–5)
// ────────────────────────────────────────────────────────────────────────────

// 1. Example Box
export const ExampleBoxTemplate: MathTemplate = {
  id: "layout-example-box",
  name: "Worked Example Box",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Pedagogical Layout",
  category: "activities",
  type: "worked-example",
  tags: ["example", "worked example", "callout", "layout"],
  defaultWidth: 280,
  defaultHeight: 110,
  defaultData: {
    title: "EXAMPLE 1",
    question: "Find the sum of 345 and 278.",
    solution: "345 + 278 = 623. Add ones: 5+8=13 (carry 1). Add tens: 4+7+1=12. Add hundreds: 3+2+1=6.",
  },
  propSchema: [
    { key: "title", label: "Example Header", type: "text", defaultValue: "EXAMPLE 1" },
    { key: "question", label: "Problem Prompt", type: "text", defaultValue: "Find the sum of 345 and 278." },
    { key: "solution", label: "Step-by-Step Solution", type: "text", defaultValue: "345 + 278 = 623" },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "EXAMPLE 1" },
    { key: "question", label: "Question", type: "text", defaultValue: "Find the sum of 345 and 278." },
    { key: "solution", label: "Solution", type: "text", defaultValue: "345 + 278 = 623" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Standard worked example callout box",
  renderer: ({ data, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-center p-1 select-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <CalloutBox variant="example" title={data.title || "EXAMPLE 1"}>
        <div className="space-y-1.5 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            <span>{data.question || "Find the sum of 345 and 278."}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            <span>Solution: {data.solution || "345 + 278 = 623."}</span>
          </div>
        </div>
      </CalloutBox>
    </div>
  ),
};

// 2. Remember Box
export const RememberBoxTemplate: MathTemplate = {
  id: "layout-remember-box",
  name: "Remember / Concept Rule Box",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Pedagogical Layout",
  category: "activities",
  type: "visual-model",
  tags: ["remember", "rule", "key takeaway", "layout"],
  defaultWidth: 280,
  defaultHeight: 90,
  defaultData: {
    title: "REMEMBER",
    content: "Any number multiplied by 0 always gives 0 (e.g. 5 × 0 = 0). Multiplying by 1 leaves the number unchanged.",
  },
  propSchema: [
    { key: "title", label: "Header Title", type: "text", defaultValue: "REMEMBER" },
    { key: "content", label: "Key Rule / Concept", type: "text", defaultValue: "Any number multiplied by 0 gives 0." },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "REMEMBER" },
    { key: "content", label: "Content", type: "text", defaultValue: "Any number multiplied by 0 gives 0." },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Key mathematical rule callout box with lightbulb badge",
  renderer: ({ data, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-center p-1 select-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <CalloutBox variant="remember" title={data.title || "REMEMBER"}>
        <div className="text-xs font-medium text-amber-950 dark:text-amber-200">
          <span>{data.content || "Any number multiplied by 0 always gives 0."}</span>
        </div>
      </CalloutBox>
    </div>
  ),
};

// 3. Try-It Activity Box
export const TryItBoxTemplate: MathTemplate = {
  id: "layout-try-it-box",
  name: "Try-It Student Activity Box",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Pedagogical Layout",
  category: "activities",
  type: "activity",
  tags: ["try it", "practice", "activity", "layout"],
  defaultWidth: 280,
  defaultHeight: 95,
  defaultData: {
    title: "TRY THIS",
    instructions: "Measure 3 objects in your pencil box using your ruler. Record their lengths below in cm.",
  },
  propSchema: [
    { key: "title", label: "Header Title", type: "text", defaultValue: "TRY THIS" },
    { key: "instructions", label: "Activity Task", type: "text", defaultValue: "Measure 3 objects in your pencil box." },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "TRY THIS" },
    { key: "instructions", label: "Instructions", type: "text", defaultValue: "Measure 3 objects." },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Hands-on activity exercise box with pencil icon",
  renderer: ({ data, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-center p-1 select-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <CalloutBox variant="try-it" title={data.title || "TRY THIS"}>
        <div className="text-xs text-emerald-950 dark:text-emerald-200">
          <span>{data.instructions || "Measure 3 objects in your pencil box using your ruler."}</span>
        </div>
      </CalloutBox>
    </div>
  ),
};

// 4. Fill-In-The-Blanks Row
export const FillBlanksRowTemplate: MathTemplate = {
  id: "layout-fill-blanks-row",
  name: "Fill in the Blanks Row",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Exercises",
  category: "assessment",
  type: "practice",
  tags: ["fill in the blanks", "missing number", "equation", "layout"],
  defaultWidth: 280,
  defaultHeight: 70,
  defaultData: {
    prefix: "7 × ",
    blank: "8",
    suffix: " = 56",
  },
  propSchema: [
    { key: "prefix", label: "Prefix Text", type: "text", defaultValue: "7 × " },
    { key: "blank", label: "Answer inside Blank", type: "text", defaultValue: "8" },
    { key: "suffix", label: "Suffix Text", type: "text", defaultValue: " = 56" },
  ],
  configFields: [
    { key: "prefix", label: "Prefix", type: "text", defaultValue: "7 × " },
    { key: "blank", label: "Answer", type: "text", defaultValue: "8" },
    { key: "suffix", label: "Suffix", type: "text", defaultValue: " = 56" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Fill-in-the-blanks mathematical question row",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex items-center gap-2 font-mono text-base font-bold text-slate-800 dark:text-slate-200">
          <span>{data.prefix || "7 × "}</span>
          <div className="w-12 h-9 rounded border-2 border-indigo-400 bg-indigo-50/50 flex items-center justify-center text-indigo-700">
            <span>{isTeacher ? data.blank || "8" : ""}</span>
          </div>
          <span>{data.suffix || " = 56"}</span>
        </div>
      </div>
    );
  },
};

// 5. Match-The-Following Template
export const MatchFollowingTemplate: MathTemplate = {
  id: "layout-match-following",
  name: "Match the Following Columns",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Exercises",
  category: "assessment",
  type: "practice",
  tags: ["match", "pairs", "columns", "assessment", "layout"],
  defaultWidth: 280,
  defaultHeight: 145,
  defaultData: {
    pairs: [
      { colA: "5 + 5", colB: "10" },
      { colA: "3 × 4", colB: "12" },
      { colA: "20 ÷ 4", colB: "5" },
    ],
  },
  propSchema: [
    { key: "pairs", label: "Matching Pairs", type: "items", defaultValue: [
      { colA: "5 + 5", colB: "10" },
      { colA: "3 × 4", colB: "12" },
      { colA: "20 ÷ 4", colB: "5" },
    ]},
  ],
  configFields: [
    { key: "pairs", label: "Pairs", type: "items", defaultValue: [] },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Two matching columns with dotted line connectors",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const pairs = data.pairs || [
      { colA: "5 + 5", colB: "10" },
      { colA: "3 × 4", colB: "12" },
      { colA: "20 ÷ 4", colB: "5" },
    ];

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 px-2 border-b pb-1">
          <span>Column A</span>
          <span>Column B</span>
        </div>
        <div className="space-y-2">
          {pairs.map((p: { colA: string; colB: string }, i: number) => (
            <div key={`match-row-${i}`} className="flex items-center justify-between px-2">
              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-28 text-center">{p.colA}</span>
              <span className="text-slate-300 font-mono">············</span>
              <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-28 text-center">{p.colB}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// 6. True / False Block
export const TrueFalseTemplate: MathTemplate = {
  id: "layout-true-false",
  name: "True / False Questions Block",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Exercises",
  category: "assessment",
  type: "practice",
  tags: ["true false", "statements", "quiz", "layout"],
  defaultWidth: 280,
  defaultHeight: 130,
  defaultData: {
    statements: [
      { text: "A square has 4 equal sides.", answer: "True" },
      { text: "1 kilogram = 100 grams.", answer: "False" },
      { text: "Any number multiplied by 1 is the same number.", answer: "True" },
    ],
  },
  propSchema: [
    { key: "statements", label: "Questions & Answers", type: "items", defaultValue: [] },
  ],
  configFields: [
    { key: "statements", label: "Statements", type: "items", defaultValue: [] },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "List of mathematical statements with True/False checkboxes",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const stmts = data.statements || [
      { text: "A square has 4 equal sides.", answer: "True" },
      { text: "1 kilogram = 100 grams.", answer: "False" },
      { text: "Any number multiplied by 1 is the same number.", answer: "True" },
    ];
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="space-y-2 text-xs">
          {stmts.map((s: { text: string; answer: string }, i: number) => (
            <div key={`tf-stmt-${i}`} className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {i + 1}. {s.text}
              </span>
              <div className="flex items-center gap-1 font-bold">
                <span className={`px-2 py-0.5 rounded text-[10px] ${isTeacher && s.answer === "True" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}>[ T ]</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${isTeacher && s.answer === "False" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}>[ F ]</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// 7. Multiple Choice Question (MCQ) Block
export const McqBlockTemplate: MathTemplate = {
  id: "layout-mcq",
  name: "Multiple Choice Question (MCQ)",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Exercises",
  category: "assessment",
  type: "practice",
  tags: ["mcq", "multiple choice", "options", "quiz", "layout"],
  defaultWidth: 280,
  defaultHeight: 130,
  defaultData: {
    question: "What is the perimeter of a square with side 6 cm?",
    options: ["12 cm", "24 cm", "36 cm", "18 cm"],
    correctIndex: 1,
  },
  propSchema: [
    { key: "question", label: "Question Text", type: "text", defaultValue: "What is the perimeter of a square with side 6 cm?" },
    { key: "options", label: "4 Options", type: "items", defaultValue: ["12 cm", "24 cm", "36 cm", "18 cm"] },
    { key: "correctIndex", label: "Correct Option Index (0-3)", type: "number", defaultValue: 1 },
  ],
  configFields: [
    { key: "question", label: "Question", type: "text", defaultValue: "Question" },
    { key: "correctIndex", label: "Correct Index", type: "number", defaultValue: 1 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Multiple choice question with four choices A, B, C, D",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const q = data.question || "What is the perimeter of a square with side 6 cm?";
    const opts = Array.isArray(data.options) ? data.options : ["12 cm", "24 cm", "36 cm", "18 cm"];
    const letters = ["(A)", "(B)", "(C)", "(D)"];
    const isTeacher = mode === "teacher";
    const correctIdx = Number(data.correctIndex) || 1;

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
          <span>Q. {q}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {opts.map((opt: string, i: number) => {
            const isCorrect = isTeacher && i === correctIdx;
            return (
              <div
                key={`mcq-opt-${i}`}
                className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${
                  isCorrect
                    ? "bg-emerald-50 border-emerald-500 font-bold text-emerald-800"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="font-bold text-slate-500">{letters[i]}</span>
                <span>{opt}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};

// 8. Word Problem with Working Space
export const WordProblemTemplate: MathTemplate = {
  id: "layout-word-problem",
  name: "Word Problem with Working Box",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Exercises",
  category: "word-problems",
  type: "worked-example",
  tags: ["word problem", "story problem", "working space", "layout"],
  defaultWidth: 280,
  defaultHeight: 145,
  defaultData: {
    question: "Ravi bought 4 notebooks for ₹25 each. How much money did he spend in total?",
    solution: "Cost of 1 notebook = ₹25. Cost of 4 notebooks = 4 × ₹25 = ₹100.",
  },
  propSchema: [
    { key: "question", label: "Story Problem", type: "text", defaultValue: "Ravi bought 4 notebooks for ₹25 each." },
  ],
  configFields: [
    { key: "question", label: "Question", type: "text", defaultValue: "Ravi bought 4 notebooks for ₹25 each." },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Word problem prompt with dedicated calculation workspace",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          <span>{data.question || "Ravi bought 4 notebooks for ₹25 each."}</span>
        </div>
        {/* Working Space */}
        <div className="flex-1 my-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 flex flex-col justify-end">
          {isTeacher ? (
            <span className="font-mono text-xs text-indigo-600">{data.solution}</span>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Working space:</span>
          )}
        </div>
        <div className="text-right text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Answer: {isTeacher ? "₹100" : "__________"}</span>
        </div>
      </div>
    );
  },
};

// 9. Answer-Lines Block
export const AnswerLinesTemplate: MathTemplate = {
  id: "layout-answer-lines",
  name: "Ruled Answer Lines",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Pedagogical Layout",
  category: "activities",
  type: "activity",
  tags: ["answer lines", "notebook lines", "ruled lines", "layout"],
  defaultWidth: 270,
  defaultHeight: 95,
  defaultData: {
    title: "Answer:",
    lineCount: 4,
  },
  propSchema: [
    { key: "title", label: "Prompt Label", type: "text", defaultValue: "Answer:" },
    { key: "lineCount", label: "Number of Lines (2-8)", type: "number", defaultValue: 4, min: 2, max: 8 },
  ],
  configFields: [
    { key: "title", label: "Prompt Label", type: "text", defaultValue: "Answer:" },
    { key: "lineCount", label: "Line Count", type: "number", defaultValue: 4 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Notebook ruled answer lines for student handwriting",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const count = Math.max(2, Math.min(8, Number(data.lineCount) || 4));

    return (
      <div
        className="w-full h-full flex flex-col justify-around p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs font-bold text-slate-500 mb-1">
          <span>{data.title || "Answer:"}</span>
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={`ruled-line-${i}`} className="w-full border-b border-indigo-200 dark:border-indigo-900/60 h-5" />
        ))}
      </div>
    );
  },
};

// 10. Chapter Header Band
export const ChapterHeaderBandTemplate: MathTemplate = {
  id: "layout-chapter-header",
  name: "Chapter Header Title Band",
  grade: 1,
  grades: [1, 2, 3, 4, 5],
  chapterTag: "Pedagogical Layout",
  category: "activities",
  type: "visual-model",
  tags: ["chapter header", "title banner", "masthead", "layout"],
  defaultWidth: 330,
  defaultHeight: 60,
  defaultData: {
    chapterNumber: 3,
    chapterTitle: "Numbers and Operations",
    gradeLabel: "Class 3 Mathematics",
  },
  propSchema: [
    { key: "chapterNumber", label: "Chapter Number", type: "number", defaultValue: 3 },
    { key: "chapterTitle", label: "Chapter Title", type: "text", defaultValue: "Numbers and Operations" },
    { key: "gradeLabel", label: "Class Label", type: "text", defaultValue: "Class 3 Mathematics" },
  ],
  configFields: [
    { key: "chapterNumber", label: "Chapter Number", type: "number", defaultValue: 3 },
    { key: "chapterTitle", label: "Chapter Title", type: "text", defaultValue: "Numbers and Operations" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Primary textbook page chapter masthead band",
  renderer: ({ data, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex items-center justify-between px-4 py-2 select-none rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow-sm"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg font-mono">
          <span>{data.chapterNumber || 3}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-indigo-200 block">
            {data.gradeLabel || "Class 3 Mathematics"}
          </span>
          <span className="text-base font-bold tracking-tight">
            {data.chapterTitle || "Numbers and Operations"}
          </span>
        </div>
      </div>
      <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-indigo-100">
        <span>NEX MAXX</span>
      </div>
    </div>
  ),
};

export const LAYOUT_BLOCK_TEMPLATES: MathTemplate[] = [
  ExampleBoxTemplate,
  RememberBoxTemplate,
  TryItBoxTemplate,
  FillBlanksRowTemplate,
  MatchFollowingTemplate,
  TrueFalseTemplate,
  McqBlockTemplate,
  WordProblemTemplate,
  AnswerLinesTemplate,
  ChapterHeaderBandTemplate,
];
