import React from "react";
import type { MathTemplate, MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import {
  NumberLine,
  Clock,
  FractionBar,
  FractionCircle,
  GridPaper,
  BarChart,
  ColumnArithmetic,
} from "./_kit";

// ────────────────────────────────────────────────────────────────────────────
// CLASS 3 TEMPLATES (Ages 7–8 / Primary Maths Class 3)
// ────────────────────────────────────────────────────────────────────────────

// 1. 4-Digit Place Value Chart
export const PlaceValue4DigitTemplate: MathTemplate = {
  id: "c3-place-value-4digit",
  name: "4-Digit Place Value Chart",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 1: Numbers up to 10,000",
  category: "place-value",
  type: "table",
  tags: ["place value", "4-digit", "thousands", "class 3"],
  defaultWidth: 250,
  defaultHeight: 120,
  defaultData: {
    number: 4528,
  },
  propSchema: [
    { key: "number", label: "4-Digit Number", type: "number", defaultValue: 4528, min: 1000, max: 9999 },
  ],
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 4528 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Place value chart with Thousands, Hundreds, Tens, and Ones columns",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const num = Number(data.number) || 4528;
    const th = Math.floor(num / 1000) % 10;
    const h = Math.floor(num / 100) % 10;
    const t = Math.floor(num / 10) % 10;
    const o = num % 10;

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <table className="w-full border-collapse text-xs font-mono">
          <thead>
            <tr>
              <th className="py-2 border border-slate-300 dark:border-slate-700 bg-pink-100 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300">
                <span>Th (1000)</span>
              </th>
              <th className="py-2 border border-slate-300 dark:border-slate-700 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                <span>H (100)</span>
              </th>
              <th className="py-2 border border-slate-300 dark:border-slate-700 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                <span>T (10)</span>
              </th>
              <th className="py-2 border border-slate-300 dark:border-slate-700 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                <span>O (1)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 text-center text-xl font-bold border border-slate-300 dark:border-slate-700">
                <span>{th}</span>
              </td>
              <td className="py-3 text-center text-xl font-bold border border-slate-300 dark:border-slate-700">
                <span>{h}</span>
              </td>
              <td className="py-3 text-center text-xl font-bold border border-slate-300 dark:border-slate-700">
                <span>{t}</span>
              </td>
              <td className="py-3 text-center text-xl font-bold border border-slate-300 dark:border-slate-700">
                <span>{o}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="text-center text-xs font-semibold text-slate-500 mt-2">
          <span>Standard Form: {num} = {th * 1000} + {h * 100} + {t * 10} + {o}</span>
        </div>
      </div>
    );
  },
};

// 2. Column Multiplication Template
export const ColumnMultiplicationTemplate: MathTemplate = {
  id: "c3-column-multiplication",
  name: "Column Multiplication",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 2: Multiplication",
  category: "multiplication",
  type: "practice",
  tags: ["column multiplication", "vertical math", "class 3"],
  defaultWidth: 180,
  defaultHeight: 145,
  defaultData: {
    op1: 46,
    op2: 3,
  },
  propSchema: [
    { key: "op1", label: "Multiplicand", type: "number", defaultValue: 46 },
    { key: "op2", label: "Multiplier (Single Digit)", type: "number", defaultValue: 3, min: 1, max: 9 },
  ],
  configFields: [
    { key: "op1", label: "Operand 1", type: "number", defaultValue: 46 },
    { key: "op2", label: "Operand 2", type: "number", defaultValue: 3 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Standard column multiplication layout with carry",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const op1 = Number(data.op1) || 46;
    const op2 = Number(data.op2) || 3;
    const res = op1 * op2;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <ColumnArithmetic
          operation="×"
          operands={[op1, op2]}
          result={res}
          carries={[1, null]}
          showResult={isTeacher}
          placeLabels={["H", "T", "O"]}
        />
      </div>
    );
  },
};

// 3. Division as Sharing / Grouping Template
export const DivisionSharingTemplate: MathTemplate = {
  id: "c3-division-sharing",
  name: "Division as Equal Sharing",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 3: Division",
  category: "division",
  type: "visual-model",
  tags: ["division", "sharing", "grouping", "class 3"],
  defaultWidth: 250,
  defaultHeight: 130,
  defaultData: {
    total: 12,
    groups: 3,
  },
  propSchema: [
    { key: "total", label: "Total Items", type: "number", defaultValue: 12 },
    { key: "groups", label: "Number of Groups (2-5)", type: "number", defaultValue: 3, min: 2, max: 5 },
  ],
  configFields: [
    { key: "total", label: "Total", type: "number", defaultValue: 12 },
    { key: "groups", label: "Groups", type: "number", defaultValue: 3 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Visual equal sharing model dividing items into groups",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const total = Number(data.total) || 12;
    const groups = Math.max(2, Math.min(5, Number(data.groups) || 3));
    const perGroup = Math.floor(total / groups);
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex items-center justify-around gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          {Array.from({ length: groups }).map((_, gIdx) => (
            <div
              key={`group-box-${gIdx}`}
              className="flex flex-col items-center p-2 rounded-lg border-2 border-dashed border-indigo-300 bg-white dark:bg-slate-900 min-w-16"
            >
              <span className="text-[10px] font-bold text-indigo-500 mb-1">Group {gIdx + 1}</span>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {Array.from({ length: perGroup }).map((_, dIdx) => (
                  <div key={`dot-${gIdx}-${dIdx}`} className="w-4 h-4 rounded-full bg-amber-400 border border-amber-600" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{total} shared equally among {groups} groups = </span>
          <span className="text-indigo-600 font-mono text-sm">{isTeacher ? `${perGroup} each` : "____ each"}</span>
        </div>
      </div>
    );
  },
};

// 4. Fraction Bar + Circle Combined
export const FractionBarCircleTemplate: MathTemplate = {
  id: "c3-fraction-bar-circle",
  name: "Fraction Bar & Circle Model",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 4: Fractions",
  category: "fractions",
  type: "visual-model",
  tags: ["fractions", "bar", "circle", "dual representation", "class 3"],
  defaultWidth: 250,
  defaultHeight: 120,
  defaultData: {
    numerator: 3,
    denominator: 8,
  },
  propSchema: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 3 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 8 },
  ],
  configFields: [
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 3 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 8 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Side-by-side fraction circle and fraction bar",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const num = Number(data.numerator) || 3;
    const den = Number(data.denominator) || 8;

    return (
      <div
        className="w-full h-full flex items-center justify-around p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <FractionCircle numerator={num} denominator={den} size={90} />
        <FractionBar numerator={num} denominator={den} width={140} height={36} />
      </div>
    );
  },
};

// 5. Fractions on Number Line Template
export const FractionsNumberLineTemplate: MathTemplate = {
  id: "c3-fractions-number-line",
  name: "Fractions on Number Line",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 4: Fractions on Number Line",
  category: "fractions",
  type: "visual-model",
  tags: ["fraction number line", "parts", "class 3"],
  defaultWidth: 280,
  defaultHeight: 90,
  defaultData: {
    denominator: 4,
  },
  propSchema: [
    { key: "denominator", label: "Denominator (2 to 8)", type: "number", defaultValue: 4, min: 2, max: 8 },
  ],
  configFields: [
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 4 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Number line from 0 to 1 with fraction tick markings",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const d = Number(data.denominator) || 4;

    return (
      <div
        className="w-full h-full flex items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <NumberLine
          start={0}
          end={d}
          step={1}
          fractions={true}
          fractionDenominator={d}
          width={width - 24}
          height={height - 20}
        />
      </div>
    );
  },
};

// 6. Digital & Analog Time (AM/PM) Template
export const DigitalAnalogTimeTemplate: MathTemplate = {
  id: "c3-digital-analog-time",
  name: "Digital & Analog Time (AM/PM)",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 5: Time",
  category: "time",
  type: "visual-model",
  tags: ["clock", "digital time", "analog", "am/pm", "class 3"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    hours: 8,
    minutes: 45,
    period: "AM",
  },
  propSchema: [
    { key: "hours", label: "Hour (1-12)", type: "number", defaultValue: 8 },
    { key: "minutes", label: "Minutes (0-59)", type: "number", defaultValue: 45 },
    { key: "period", label: "AM / PM", type: "select", defaultValue: "AM", options: [{ label: "AM", value: "AM" }, { label: "PM", value: "PM" }] },
  ],
  configFields: [
    { key: "hours", label: "Hour", type: "number", defaultValue: 8 },
    { key: "minutes", label: "Minutes", type: "number", defaultValue: 45 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Side-by-side analog clock face and digital 12-hour display with AM/PM",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const h = Number(data.hours) || 8;
    const m = Number(data.minutes) || 45;
    const p = data.period || "AM";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Clock hours={h} minutes={m} size={110} showDigital={false} />
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
          <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-100">
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
          </span>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
            {p}
          </span>
        </div>
      </div>
    );
  },
};

// 7. Calendar Month Grid Template
export const CalendarMonthTemplate: MathTemplate = {
  id: "c3-calendar-month",
  name: "Calendar Month Grid",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 5: Calendar",
  category: "time",
  type: "table",
  tags: ["calendar", "month", "days", "dates", "class 3"],
  defaultWidth: 230,
  defaultHeight: 160,
  defaultData: {
    month: "OCTOBER",
    year: 2026,
    daysInMonth: 31,
    startDay: 4, // 0 = Sun, 4 = Thu
  },
  propSchema: [
    { key: "month", label: "Month Name", type: "text", defaultValue: "OCTOBER" },
    { key: "year", label: "Year", type: "number", defaultValue: 2026 },
  ],
  configFields: [
    { key: "month", label: "Month", type: "text", defaultValue: "OCTOBER" },
    { key: "year", label: "Year", type: "number", defaultValue: 2026 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Monthly calendar page with 7-column day matrix",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const daysHeader = ["S", "M", "T", "W", "T", "F", "S"];
    const totalDays = Number(data.daysInMonth) || 31;
    const startDay = Number(data.startDay) || 4;

    const cells: Array<number | null> = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-center font-bold text-xs text-indigo-700 dark:text-indigo-400">
          <span>{data.month || "OCTOBER"} {data.year || 2026}</span>
        </div>
        <table className="w-full text-center text-[10px] border-collapse font-mono">
          <thead>
            <tr>
              {daysHeader.map((d, i) => (
                <th key={`cal-day-h-${i}`} className="py-1 font-bold text-slate-500">
                  <span>{d}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, rIdx) => (
              <tr key={`cal-row-${rIdx}`}>
                {Array.from({ length: 7 }).map((_, cIdx) => {
                  const val = cells[rIdx * 7 + cIdx];
                  return (
                    <td key={`cal-cell-${rIdx}-${cIdx}`} className="py-1 font-medium text-slate-700 dark:text-slate-300">
                      <span>{val ?? ""}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

// 8. Measurement Scale (Capacity Beaker) Template
export const MeasurementScaleTemplate: MathTemplate = {
  id: "c3-measurement-scale",
  name: "Capacity Measuring Beaker",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 6: Measurement (Capacity)",
  category: "measurement",
  type: "visual-model",
  tags: ["capacity", "volume", "beaker", "liters", "milliliters", "class 3"],
  defaultWidth: 180,
  defaultHeight: 145,
  defaultData: {
    volumeMl: 600,
    maxMl: 1000,
  },
  propSchema: [
    { key: "volumeMl", label: "Liquid Level (mL)", type: "number", defaultValue: 600, min: 0, max: 1000 },
  ],
  configFields: [
    { key: "volumeMl", label: "Liquid Volume (mL)", type: "number", defaultValue: 600 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Measuring beaker cylinder showing liquid volume in milliliters",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const vol = Number(data.volumeMl) || 600;
    const max = 1000;
    const frac = Math.min(1, Math.max(0, vol / max));
    const beakerH = 110;
    const beakerW = 60;
    const liquidH = beakerH * frac;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg width="100" height="130" viewBox="0 0 100 130">
          {/* Beaker Body */}
          <rect x="20" y="10" width={beakerW} height={beakerH} rx="4" fill="#f8fafc" stroke={MATH_TOKENS.print.ink} strokeWidth="2" />
          {/* Liquid Fill */}
          <rect x="22" y={10 + beakerH - liquidH} width={beakerW - 4} height={liquidH} fill="#0ea5e9" opacity="0.6" />
          {/* Beaker Lip */}
          <path d="M 16 10 L 20 10" stroke={MATH_TOKENS.print.ink} strokeWidth="2" />
          {/* Calibration Ticks */}
          {[200, 400, 600, 800, 1000].map((ml) => {
            const y = 10 + beakerH - (ml / max) * beakerH;
            return (
              <g key={`beaker-tick-${ml}`}>
                <line x1="60" y1={y} x2="80" y2={y} stroke={MATH_TOKENS.print.ink} strokeWidth="1.2" />
                <text x="84" y={y + 3} fontSize="7" fontWeight="bold" fill="#64748b">{ml}</text>
              </g>
            );
          })}
        </svg>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Volume: </span>
          <span className="text-sky-600 font-mono text-sm">{isTeacher ? `${vol} mL` : "____ mL"}</span>
        </div>
      </div>
    );
  },
};

// 9. Perimeter on Grid Template
export const PerimeterOnGridTemplate: MathTemplate = {
  id: "c3-perimeter-grid",
  name: "Perimeter on Grid",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 7: Geometry & Perimeter",
  category: "geometry",
  type: "practice",
  tags: ["perimeter", "grid", "boundary", "geometry", "class 3"],
  defaultWidth: 220,
  defaultHeight: 145,
  defaultData: {
    shapeWidth: 4,
    shapeHeight: 3,
  },
  propSchema: [
    { key: "shapeWidth", label: "Width (Grid Units)", type: "number", defaultValue: 4 },
    { key: "shapeHeight", label: "Height (Grid Units)", type: "number", defaultValue: 3 },
  ],
  configFields: [
    { key: "shapeWidth", label: "Width", type: "number", defaultValue: 4 },
    { key: "shapeHeight", label: "Height", type: "number", defaultValue: 3 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Rectangle drawn on grid paper with perimeter calculation",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const sw = Number(data.shapeWidth) || 4;
    const sh = Number(data.shapeHeight) || 3;
    const peri = 2 * (sw + sh);
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <GridPaper
          rows={6}
          cols={8}
          cellSize={18}
          shapes={[
            {
              type: "rect",
              rect: { col: 2, row: 1, width: sw, height: sh },
              color: "#3b82f6",
              fill: "rgba(59, 130, 246, 0.2)",
              label: `${sw} × ${sh}`,
            },
          ]}
        />
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Perimeter = </span>
          <span className="text-indigo-600 font-mono text-sm">{isTeacher ? `${peri} units` : "____ units"}</span>
        </div>
      </div>
    );
  },
};

// 10. Angles Intro Template
export const AnglesIntroTemplate: MathTemplate = {
  id: "c3-angles-intro",
  name: "Angles Introduction",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 8: Shapes & Angles",
  category: "geometry",
  type: "visual-model",
  tags: ["angles", "right angle", "acute", "obtuse", "class 3"],
  defaultWidth: 250,
  defaultHeight: 110,
  defaultData: {
    title: "Types of Angles",
  },
  propSchema: [
    { key: "title", label: "Title", type: "text", defaultValue: "Types of Angles" },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "Types of Angles" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Visual comparison of Acute, Right, and Obtuse angles",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex items-center justify-around p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Acute Angle */}
      <div className="flex flex-col items-center">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <line x1="10" y1="50" x2="50" y2="50" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <line x1="10" y1="50" x2="40" y2="15" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <path d="M 25 50 A 15 15 0 0 0 20 38" fill="none" stroke="#f59e0b" strokeWidth="2" />
        </svg>
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Acute (&lt;90°)</span>
      </div>

      {/* Right Angle */}
      <div className="flex flex-col items-center">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <line x1="10" y1="50" x2="50" y2="50" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <line x1="10" y1="50" x2="10" y2="10" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <rect x="10" y="38" width="12" height="12" fill="none" stroke="#ef4444" strokeWidth="2" />
        </svg>
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Right (90°)</span>
      </div>

      {/* Obtuse Angle */}
      <div className="flex flex-col items-center">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <line x1="30" y1="50" x2="55" y2="50" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <line x1="30" y1="50" x2="8" y2="20" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <path d="M 45 50 A 15 15 0 0 0 18 35" fill="none" stroke="#10b981" strokeWidth="2" />
        </svg>
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1">Obtuse (&gt;90°)</span>
      </div>
    </div>
  ),
};

// 11. Data Table & Bar Graph Combined
export const DataTableBarGraphTemplate: MathTemplate = {
  id: "c3-data-table-bar-graph",
  name: "Data Table & Bar Graph",
  grade: 3,
  grades: [3],
  chapterTag: "Chapter 9: Data Handling",
  category: "data",
  type: "visual-model",
  tags: ["table", "bar graph", "survey", "data", "class 3"],
  defaultWidth: 280,
  defaultHeight: 145,
  defaultData: {
    items: [
      { label: "Cricket", value: 12 },
      { label: "Football", value: 8 },
      { label: "Kho-Kho", value: 10 },
    ],
  },
  propSchema: [
    { key: "items", label: "Survey Items", type: "items", defaultValue: [
      { label: "Cricket", value: 12 },
      { label: "Football", value: 8 },
      { label: "Kho-Kho", value: 10 },
    ]},
  ],
  configFields: [
    { key: "items", label: "Data Items", type: "items", defaultValue: [] },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Integrated frequency data table and corresponding bar chart",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const items = data.items || [
      { label: "Cricket", value: 12 },
      { label: "Football", value: 8 },
      { label: "Kho-Kho", value: 10 },
    ];

    return (
      <div
        className="w-full h-full flex items-center justify-between p-2 gap-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="w-1/3">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-1"><span>Game</span></th>
                <th className="text-right py-1"><span>Students</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: { label: string; value: number }, i: number) => (
                <tr key={`row-data-${i}`} className="border-b border-slate-100">
                  <td className="py-1"><span>{it.label}</span></td>
                  <td className="py-1 text-right font-mono font-bold"><span>{it.value}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-2/3 h-full">
          <BarChart data={items} width={220} height={160} />
        </div>
      </div>
    );
  },
};

export const CLASS_3_TEMPLATES: MathTemplate[] = [
  PlaceValue4DigitTemplate,
  ColumnMultiplicationTemplate,
  DivisionSharingTemplate,
  FractionBarCircleTemplate,
  FractionsNumberLineTemplate,
  DigitalAnalogTimeTemplate,
  CalendarMonthTemplate,
  MeasurementScaleTemplate,
  PerimeterOnGridTemplate,
  AnglesIntroTemplate,
  DataTableBarGraphTemplate,
];
