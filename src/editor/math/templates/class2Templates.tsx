import React from "react";
import type { MathTemplate, MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import {
  BaseTenBlocks,
  NumberLine,
  ColumnArithmetic,
  Clock,
  CoinNote,
  Ruler,
  FractionBar,
  FractionCircle,
  GridPaper,
  BarChart,
} from "./_kit";

// ────────────────────────────────────────────────────────────────────────────
// CLASS 2 TEMPLATES (Ages 6–7 / Primary Maths Class 2)
// ────────────────────────────────────────────────────────────────────────────

// 1. 3-Digit Place Value (H/T/O + blocks)
export const PlaceValue3DigitTemplate: MathTemplate = {
  id: "c2-place-value-3digit",
  name: "3-Digit Place Value (H/T/O)",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 1: Numbers up to 1000",
  category: "place-value",
  type: "visual-model",
  tags: ["place value", "3-digit", "hundreds", "tens", "ones", "class 2"],
  defaultWidth: 320,
  defaultHeight: 180,
  defaultData: {
    hundreds: 3,
    tens: 4,
    ones: 6,
  },
  propSchema: [
    { key: "hundreds", label: "Hundreds", type: "number", defaultValue: 3, min: 0, max: 9 },
    { key: "tens", label: "Tens", type: "number", defaultValue: 4, min: 0, max: 9 },
    { key: "ones", label: "Ones", type: "number", defaultValue: 6, min: 0, max: 9 },
  ],
  configFields: [
    { key: "hundreds", label: "Hundreds", type: "number", defaultValue: 3 },
    { key: "tens", label: "Tens", type: "number", defaultValue: 4 },
    { key: "ones", label: "Ones", type: "number", defaultValue: 6 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "3-digit place value decomposition with Base-10 flats, rods, and units",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const h = Number(data.hundreds) || 3;
    const t = Number(data.tens) || 4;
    const o = Number(data.ones) || 6;
    const total = h * 100 + t * 10 + o;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <BaseTenBlocks hundreds={h} tens={t} ones={o} showLabels={true} unitSize={6} />
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{h}00 + {t}0 + {o} =</span>
          <span className="text-indigo-600 font-mono text-sm">{isTeacher ? total : "____"}</span>
        </div>
      </div>
    );
  },
};

// 2. Skip-Counting Number Line
export const SkipCountingLineTemplate: MathTemplate = {
  id: "c2-skip-counting-line",
  name: "Skip Counting Number Line",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 2: Skip Counting",
  category: "numbers",
  type: "visual-model",
  tags: ["skip counting", "jumps", "patterns", "class 2"],
  defaultWidth: 360,
  defaultHeight: 120,
  defaultData: {
    start: 0,
    end: 20,
    step: 5,
    jumpSize: 5,
  },
  propSchema: [
    { key: "start", label: "Start", type: "number", defaultValue: 0 },
    { key: "end", label: "End", type: "number", defaultValue: 20 },
    { key: "jumpSize", label: "Skip Step Size", type: "number", defaultValue: 5 },
  ],
  configFields: [
    { key: "start", label: "Start", type: "number", defaultValue: 0 },
    { key: "end", label: "End", type: "number", defaultValue: 20 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Skip counting number line with arc jumps",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const s = Number(data.start) || 0;
    const e = Number(data.end) || 20;
    const js = Number(data.jumpSize) || 5;

    const jumps = [];
    for (let cur = s; cur + js <= e; cur += js) {
      jumps.push({ from: cur, to: cur + js, label: `+${js}` });
    }

    return (
      <div
        className="w-full h-full flex items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <NumberLine
          start={s}
          end={e}
          step={js}
          jumps={jumps}
          width={width - 24}
          height={height - 20}
        />
      </div>
    );
  },
};

// 3. Column Add/Subtract with Carry/Borrow
export const ColumnAddSubtractTemplate: MathTemplate = {
  id: "c2-column-add-sub",
  name: "Column Addition with Carry",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 3: Addition & Subtraction",
  category: "addition",
  type: "practice",
  tags: ["column addition", "carry", "vertical math", "class 2"],
  defaultWidth: 200,
  defaultHeight: 180,
  defaultData: {
    operation: "+",
    op1: 247,
    op2: 138,
    result: 385,
    carries: [null, 1, null],
  },
  propSchema: [
    { key: "op1", label: "Operand 1", type: "number", defaultValue: 247 },
    { key: "op2", label: "Operand 2", type: "number", defaultValue: 138 },
  ],
  configFields: [
    { key: "op1", label: "Operand 1", type: "number", defaultValue: 247 },
    { key: "op2", label: "Operand 2", type: "number", defaultValue: 138 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Vertical 3-digit column addition with carry row",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const op1 = Number(data.op1) || 247;
    const op2 = Number(data.op2) || 138;
    const res = op1 + op2;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <ColumnArithmetic
          operation="+"
          operands={[op1, op2]}
          result={res}
          carries={[null, 1, null]}
          showResult={isTeacher}
          placeLabels={["H", "T", "O"]}
        />
      </div>
    );
  },
};

// 4. Repeated Addition Arrays
export const RepeatedAdditionArraysTemplate: MathTemplate = {
  id: "c2-repeated-addition-arrays",
  name: "Repeated Addition Array",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 4: Introduction to Multiplication",
  category: "multiplication",
  type: "visual-model",
  tags: ["array", "repeated addition", "rows", "columns", "class 2"],
  defaultWidth: 280,
  defaultHeight: 170,
  defaultData: {
    rows: 3,
    cols: 5,
  },
  propSchema: [
    { key: "rows", label: "Number of Rows", type: "number", defaultValue: 3, min: 1, max: 6 },
    { key: "cols", label: "Items per Row", type: "number", defaultValue: 5, min: 1, max: 8 },
  ],
  configFields: [
    { key: "rows", label: "Rows", type: "number", defaultValue: 3 },
    { key: "cols", label: "Columns", type: "number", defaultValue: 5 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Rectangular array of counters demonstrating repeated addition",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const r = Math.max(1, Math.min(6, Number(data.rows) || 3));
    const c = Math.max(1, Math.min(8, Number(data.cols) || 5));
    const total = r * c;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          {Array.from({ length: r }).map((_, rIdx) => (
            <div key={`array-row-${rIdx}`} className="flex items-center gap-2">
              {Array.from({ length: c }).map((_, cIdx) => (
                <div
                  key={`dot-${rIdx}-${cIdx}`}
                  className="w-6 h-6 rounded-full bg-indigo-500 border border-indigo-700 flex items-center justify-center"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{r} rows of {c} = {isTeacher ? `${r} × ${c} = ${total}` : `${r} × ${c} = ____`}</span>
        </div>
      </div>
    );
  },
};

// 5. Times-Table Grid
export const TimesTableGridTemplate: MathTemplate = {
  id: "c2-times-table-grid",
  name: "Times-Table Grid (1 to 5)",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 4: Multiplication Tables",
  category: "multiplication",
  type: "table",
  tags: ["times table", "multiplication grid", "matrix", "class 2"],
  defaultWidth: 260,
  defaultHeight: 200,
  defaultData: {
    maxNum: 5,
  },
  propSchema: [
    { key: "maxNum", label: "Max Number (3-10)", type: "number", defaultValue: 5, min: 3, max: 10 },
  ],
  configFields: [
    { key: "maxNum", label: "Max Number", type: "number", defaultValue: 5 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Multiplication grid showing products from 1 to 5",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const n = Math.max(3, Math.min(10, Number(data.maxNum) || 5));
    const range = Array.from({ length: n }, (_, i) => i + 1);

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-8 h-7 text-center font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-600">
                <span>×</span>
              </th>
              {range.map((c) => (
                <th
                  key={`th-col-${c}`}
                  className="w-8 h-7 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <span>{c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {range.map((r) => (
              <tr key={`tr-row-${r}`}>
                <th className="w-8 h-7 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <span>{r}</span>
                </th>
                {range.map((c) => (
                  <td
                    key={`td-cell-${r}-${c}`}
                    className="w-8 h-7 text-center font-mono border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    <span>{r * c}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

// 6. Half & Quarter Clock
export const HalfQuarterClockTemplate: MathTemplate = {
  id: "c2-half-quarter-clock",
  name: "Half & Quarter Past Clock",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 5: Time",
  category: "time",
  type: "visual-model",
  tags: ["clock", "half past", "quarter past", "time", "class 2"],
  defaultWidth: 220,
  defaultHeight: 180,
  defaultData: {
    hours: 3,
    minutes: 30, // 3:30 = half past 3
  },
  propSchema: [
    { key: "hours", label: "Hour", type: "number", defaultValue: 3 },
    { key: "minutes", label: "Minutes (0, 15, 30, 45)", type: "number", defaultValue: 30 },
  ],
  configFields: [
    { key: "hours", label: "Hour", type: "number", defaultValue: 3 },
    { key: "minutes", label: "Minutes", type: "number", defaultValue: 30 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Analog clock showing half-past and quarter hours",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const h = Number(data.hours) || 3;
    const m = Number(data.minutes) || 30;
    const isTeacher = mode === "teacher";
    const labelText = m === 30 ? `Half past ${h}` : m === 15 ? `Quarter past ${h}` : m === 45 ? `Quarter to ${h + 1}` : `${h}:${String(m).padStart(2, "0")}`;

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Clock hours={h} minutes={m} size={Math.min(120, width - 40)} showDigital={true} />
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{isTeacher ? labelText : "Time: ____________"}</span>
        </div>
      </div>
    );
  },
};

// 7. ₹ Notes & Change
export const NotesAndChangeTemplate: MathTemplate = {
  id: "c2-notes-and-change",
  name: "₹ Notes & Change",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 6: Money",
  category: "money",
  type: "visual-model",
  tags: ["notes", "change", "rupees", "currency", "class 2"],
  defaultWidth: 320,
  defaultHeight: 160,
  defaultData: {
    note: 50,
    itemCost: 35,
  },
  propSchema: [
    { key: "note", label: "Note Paid (₹)", type: "number", defaultValue: 50 },
    { key: "itemCost", label: "Item Cost (₹)", type: "number", defaultValue: 35 },
  ],
  configFields: [
    { key: "note", label: "Note Paid", type: "number", defaultValue: 50 },
    { key: "itemCost", label: "Cost", type: "number", defaultValue: 35 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Shopping scenario with bank notes and calculation of change returned",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const note = Number(data.note) || 50;
    const cost = Number(data.itemCost) || 35;
    const change = note - cost;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex items-center justify-around gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 mb-1">Paid:</span>
            <CoinNote type="note" denomination={note} size={110} />
          </div>
          <div className="text-xl font-bold text-slate-400">−</div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 mb-1">Item Cost:</span>
            <span className="text-base font-bold text-red-600 font-mono">₹{cost}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Change Returned =</span>
          <span className="text-emerald-600 font-mono text-sm">{isTeacher ? `₹${change}` : "₹____"}</span>
        </div>
      </div>
    );
  },
};

// 8. Centimeter Ruler Measuring Template
export const CmRulerTemplate: MathTemplate = {
  id: "c2-cm-ruler",
  name: "Centimeter Ruler Measuring",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 7: Measurement of Length",
  category: "measurement",
  type: "visual-model",
  tags: ["ruler", "centimeters", "measurement", "pencil", "class 2"],
  defaultWidth: 360,
  defaultHeight: 120,
  defaultData: {
    startCm: 2,
    endCm: 9,
  },
  propSchema: [
    { key: "startCm", label: "Pencil Start (cm)", type: "number", defaultValue: 2 },
    { key: "endCm", label: "Pencil End (cm)", type: "number", defaultValue: 9 },
  ],
  configFields: [
    { key: "startCm", label: "Start cm", type: "number", defaultValue: 2 },
    { key: "endCm", label: "End cm", type: "number", defaultValue: 9 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Pencil aligned against a metric cm ruler",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const s = Number(data.startCm) ?? 2;
    const e = Number(data.endCm) ?? 9;
    const length = e - s;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Ruler
          lengthCm={12}
          measureItem={{
            startCm: s,
            endCm: e,
            itemType: "pencil",
            label: isTeacher ? `${length} cm` : "? cm",
          }}
          width={width - 20}
          height={height - 24}
        />
      </div>
    );
  },
};

// 9. Fraction Halves & Quarters Template
export const FractionHalvesQuartersTemplate: MathTemplate = {
  id: "c2-fraction-halves-quarters",
  name: "Fraction Halves & Quarters",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 8: Halves and Quarters",
  category: "fractions",
  type: "visual-model",
  tags: ["fractions", "half", "quarter", "1/2", "1/4", "class 2"],
  defaultWidth: 280,
  defaultHeight: 140,
  defaultData: {
    numerator: 1,
    denominator: 4,
  },
  propSchema: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 1 },
    { key: "denominator", label: "Denominator (2 or 4)", type: "number", defaultValue: 4 },
  ],
  configFields: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 1 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 4 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Visual fraction model displaying halves or quarters",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const num = Number(data.numerator) || 1;
    const den = Number(data.denominator) || 4;

    return (
      <div
        className="w-full h-full flex items-center justify-around p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <FractionCircle numerator={num} denominator={den} size={90} />
        <FractionBar numerator={num} denominator={den} width={130} height={36} />
      </div>
    );
  },
};

// 10. Symmetry on Grid Template
export const SymmetryGridTemplate: MathTemplate = {
  id: "c2-symmetry-grid",
  name: "Symmetry on Grid",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 9: Shapes and Patterns",
  category: "geometry",
  type: "activity",
  tags: ["symmetry", "mirror line", "grid", "reflection", "class 2"],
  defaultWidth: 280,
  defaultHeight: 180,
  defaultData: {
    cols: 8,
    rows: 6,
  },
  propSchema: [
    { key: "cols", label: "Columns", type: "number", defaultValue: 8 },
    { key: "rows", label: "Rows", type: "number", defaultValue: 6 },
  ],
  configFields: [
    { key: "cols", label: "Columns", type: "number", defaultValue: 8 },
    { key: "rows", label: "Rows", type: "number", defaultValue: 6 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Workbook grid with a dashed mirror line of symmetry",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="relative">
        <GridPaper rows={6} cols={8} cellSize={18} />
        {/* Mirror Line across middle */}
        <div
          className="absolute top-0 bottom-0 left-1/2 w-0.5 border-r-2 border-dashed border-red-500 pointer-events-none"
          title="Line of symmetry"
        />
      </div>
      <span className="text-[10px] font-bold text-red-500 mt-1">Dashed line = Mirror line of symmetry</span>
    </div>
  ),
};

// 11. Bar Graph Template
export const BarGraphTemplate: MathTemplate = {
  id: "c2-bar-graph",
  name: "Primary Bar Graph",
  grade: 2,
  grades: [2],
  chapterTag: "Chapter 10: Data Handling",
  category: "data",
  type: "visual-model",
  tags: ["bar graph", "chart", "data handling", "class 2"],
  defaultWidth: 320,
  defaultHeight: 180,
  defaultData: {
    data: [
      { label: "Red", value: 5 },
      { label: "Blue", value: 8 },
      { label: "Green", value: 3 },
      { label: "Yellow", value: 6 },
    ],
    title: "Favourite Colours",
  },
  propSchema: [
    { key: "title", label: "Graph Title", type: "text", defaultValue: "Favourite Colours" },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "Favourite Colours" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Bar graph showing categorical survey data",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const items = data.data || [
      { label: "Red", value: 5 },
      { label: "Blue", value: 8 },
      { label: "Green", value: 3 },
      { label: "Yellow", value: 6 },
    ];

    return (
      <div
        className="w-full h-full flex items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <BarChart
          data={items}
          title={data.title}
          width={width - 20}
          height={height - 20}
        />
      </div>
    );
  },
};

export const CLASS_2_TEMPLATES: MathTemplate[] = [
  PlaceValue3DigitTemplate,
  SkipCountingLineTemplate,
  ColumnAddSubtractTemplate,
  RepeatedAdditionArraysTemplate,
  TimesTableGridTemplate,
  HalfQuarterClockTemplate,
  NotesAndChangeTemplate,
  CmRulerTemplate,
  FractionHalvesQuartersTemplate,
  SymmetryGridTemplate,
  BarGraphTemplate,
];
