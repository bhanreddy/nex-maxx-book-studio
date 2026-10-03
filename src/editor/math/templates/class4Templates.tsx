import React from "react";
import type { MathTemplate, MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import {
  FractionBar,
  GridPaper,
  Protractor,
  Clock,
} from "./_kit";

// ────────────────────────────────────────────────────────────────────────────
// CLASS 4 TEMPLATES (Ages 8–9 / Primary Maths Class 4)
// ────────────────────────────────────────────────────────────────────────────

// 1. Indian Place Value to Lakhs
export const PlaceValueLakhsTemplate: MathTemplate = {
  id: "c4-place-value-lakhs",
  name: "Indian Place Value Chart (to Lakhs)",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 1: Large Numbers",
  category: "place-value",
  type: "table",
  tags: ["place value", "lakhs", "indian numbering", "class 4"],
  defaultWidth: 280,
  defaultHeight: 120,
  defaultData: {
    number: 345678,
  },
  propSchema: [
    { key: "number", label: "6-Digit Number", type: "number", defaultValue: 345678, min: 100000, max: 999999 },
  ],
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 345678 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Indian place value periods chart: Lakhs, Thousands, and Ones periods",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const num = Number(data.number) || 345678;
    const l = Math.floor(num / 100000) % 10;
    const tth = Math.floor(num / 10000) % 10;
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
              <th colSpan={1} className="py-1 border border-slate-300 bg-orange-100 text-orange-900"><span>Lakhs</span></th>
              <th colSpan={2} className="py-1 border border-slate-300 bg-purple-100 text-purple-900"><span>Thousands</span></th>
              <th colSpan={3} className="py-1 border border-slate-300 bg-blue-100 text-blue-900"><span>Ones Period</span></th>
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-800 text-[10px]">
              <th className="py-1 border border-slate-300"><span>L</span></th>
              <th className="py-1 border border-slate-300"><span>T-Th</span></th>
              <th className="py-1 border border-slate-300"><span>Th</span></th>
              <th className="py-1 border border-slate-300"><span>H</span></th>
              <th className="py-1 border border-slate-300"><span>T</span></th>
              <th className="py-1 border border-slate-300"><span>O</span></th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center text-lg font-bold">
              <td className="py-2 border border-slate-300"><span>{l}</span></td>
              <td className="py-2 border border-slate-300"><span>{tth}</span></td>
              <td className="py-2 border border-slate-300"><span>{th}</span></td>
              <td className="py-2 border border-slate-300"><span>{h}</span></td>
              <td className="py-2 border border-slate-300"><span>{t}</span></td>
              <td className="py-2 border border-slate-300"><span>{o}</span></td>
            </tr>
          </tbody>
        </table>
        <div className="text-center text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
          <span>Number in words: {l} Lakh, {tth}{th} Thousand, {h} Hundred and {t}{o}</span>
        </div>
      </div>
    );
  },
};

// 2. Long Division Layout
export const LongDivisionTemplate: MathTemplate = {
  id: "c4-long-division",
  name: "Long Division Bracket Layout",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 2: Division Steps",
  category: "division",
  type: "worked-example",
  tags: ["long division", "bracket", "quotient", "remainder", "class 4"],
  defaultWidth: 190,
  defaultHeight: 145,
  defaultData: {
    dividend: 75,
    divisor: 4,
  },
  propSchema: [
    { key: "dividend", label: "Dividend", type: "number", defaultValue: 75 },
    { key: "divisor", label: "Divisor", type: "number", defaultValue: 4 },
  ],
  configFields: [
    { key: "dividend", label: "Dividend", type: "number", defaultValue: 75 },
    { key: "divisor", label: "Divisor", type: "number", defaultValue: 4 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Step-by-step long division layout with quotient bar",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const dvd = Number(data.dividend) || 75;
    const dvs = Number(data.divisor) || 4;
    const q = Math.floor(dvd / dvs);
    const r = dvd % dvs;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="font-mono text-base">
          {/* Quotient row */}
          <div className="flex justify-end pr-2 text-indigo-600 font-bold">
            <span>{isTeacher ? q : "??"}</span>
          </div>
          {/* Bracket row */}
          <div className="flex items-center">
            <span className="font-bold mr-1">{dvs}</span>
            <div className="border-t-2 border-l-2 border-slate-800 dark:border-slate-200 pl-2 pr-3 py-0.5 rounded-tl font-bold text-lg">
              <span>{dvd}</span>
            </div>
          </div>
          {/* Remainder summary */}
          <div className="text-xs font-bold text-slate-500 mt-2">
            <span>Quotient = {isTeacher ? q : "____"}, Remainder = {isTeacher ? r : "____"}</span>
          </div>
        </div>
      </div>
    );
  },
};

// 3. Factor Tree Decomposition
export const FactorTreeTemplate: MathTemplate = {
  id: "c4-factor-tree",
  name: "Factor Tree Decomposition",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 3: Factors & Multiples",
  category: "multiplication",
  type: "visual-model",
  tags: ["factors", "factor tree", "prime factors", "class 4"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    root: 24,
    branch1: 4,
    branch2: 6,
  },
  propSchema: [
    { key: "root", label: "Root Number", type: "number", defaultValue: 24 },
  ],
  configFields: [
    { key: "root", label: "Root Number", type: "number", defaultValue: 24 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Branching factor tree breaking down a composite number into factors",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const root = Number(data.root) || 24;

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg viewBox="0 0 200 160" className="w-full h-full overflow-visible">
          {/* Root branches */}
          <line x1="100" y1="30" x2="60" y2="80" stroke={MATH_TOKENS.print.ink} strokeWidth="2" />
          <line x1="100" y1="30" x2="140" y2="80" stroke={MATH_TOKENS.print.ink} strokeWidth="2" />
          {/* Sub branches */}
          <line x1="60" y1="80" x2="40" y2="135" stroke={MATH_TOKENS.print.ink} strokeWidth="1.5" />
          <line x1="60" y1="80" x2="80" y2="135" stroke={MATH_TOKENS.print.ink} strokeWidth="1.5" />
          <line x1="140" y1="80" x2="120" y2="135" stroke={MATH_TOKENS.print.ink} strokeWidth="1.5" />
          <line x1="140" y1="80" x2="160" y2="135" stroke={MATH_TOKENS.print.ink} strokeWidth="1.5" />

          {/* Root node */}
          <circle cx="100" cy="30" r="18" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
          <text x="100" y="35" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e40af">{root}</text>

          {/* Level 1 nodes */}
          <circle cx="60" cy="80" r="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          <text x="60" y="84" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">4</text>
          <circle cx="140" cy="80" r="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          <text x="140" y="84" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">6</text>

          {/* Level 2 prime leaves */}
          <circle cx="40" cy="135" r="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          <text x="40" y="139" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">2</text>
          <circle cx="80" cy="135" r="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          <text x="80" y="139" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">2</text>
          <circle cx="120" cy="135" r="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          <text x="120" y="139" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">2</text>
          <circle cx="160" cy="135" r="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          <text x="160" y="139" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">3</text>
        </svg>
      </div>
    );
  },
};

// 4. Factors and Multiples Table
export const FactorsMultiplesTableTemplate: MathTemplate = {
  id: "c4-factors-multiples-table",
  name: "Factors & Multiples Table",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 3: Factors & Multiples",
  category: "multiplication",
  type: "table",
  tags: ["factors", "multiples", "table", "class 4"],
  defaultWidth: 250,
  defaultHeight: 120,
  defaultData: {
    number: 18,
    factors: "1, 2, 3, 6, 9, 18",
    multiples: "18, 36, 54, 72, 90...",
  },
  propSchema: [
    { key: "number", label: "Number", type: "number", defaultValue: 18 },
  ],
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 18 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Summary table of factors and first five multiples of a number",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const num = Number(data.number) || 18;

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <td className="w-1/3 py-2 font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>Number</span>
              </td>
              <td className="py-2 pl-3 font-mono font-bold text-indigo-600">
                <span>{num}</span>
              </td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <td className="py-2 font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>Factors</span>
              </td>
              <td className="py-2 pl-3 text-slate-800 dark:text-slate-200">
                <span>{data.factors || "1, 2, 3, 6, 9, 18"}</span>
              </td>
            </tr>
            <tr>
              <td className="py-2 font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <span>First 5 Multiples</span>
              </td>
              <td className="py-2 pl-3 text-slate-800 dark:text-slate-200">
                <span>{data.multiples || "18, 36, 54, 72, 90..."}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
};

// 5. Equivalent Fractions Wall
export const EquivalentFractionsTemplate: MathTemplate = {
  id: "c4-equivalent-fractions",
  name: "Equivalent Fractions Wall",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 4: Fractions",
  category: "fractions",
  type: "visual-model",
  tags: ["equivalent fractions", "fraction wall", "class 4"],
  defaultWidth: 250,
  defaultHeight: 145,
  defaultData: {},
  propSchema: [],
  configFields: [],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Stacked fraction bars comparing 1/2, 2/4, and 4/8",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <FractionBar
        width={width - 40}
        comparisonBars={[
          { numerator: 1, denominator: 2, label: "1/2", color: "#3b82f6" },
          { numerator: 2, denominator: 4, label: "2/4", color: "#10b981" },
          { numerator: 4, denominator: 8, label: "4/8", color: "#8b5cf6" },
        ]}
      />
    </div>
  ),
};

// 6. Mixed Fractions Model
export const MixedFractionsTemplate: MathTemplate = {
  id: "c4-mixed-fractions",
  name: "Mixed Fractions Area Model",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 4: Mixed Fractions",
  category: "fractions",
  type: "visual-model",
  tags: ["mixed fractions", "improper", "wholes", "class 4"],
  defaultWidth: 250,
  defaultHeight: 105,
  defaultData: {
    whole: 2,
    numerator: 1,
    denominator: 3,
  },
  propSchema: [
    { key: "whole", label: "Whole Units", type: "number", defaultValue: 2 },
    { key: "numerator", label: "Fraction Numerator", type: "number", defaultValue: 1 },
    { key: "denominator", label: "Fraction Denominator", type: "number", defaultValue: 3 },
  ],
  configFields: [
    { key: "whole", label: "Whole", type: "number", defaultValue: 2 },
    { key: "numerator", label: "Numerator", type: "number", defaultValue: 1 },
    { key: "denominator", label: "Denominator", type: "number", defaultValue: 3 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Visual bars representing 2 whole units plus 1/3 fraction",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const w = Number(data.whole) || 2;
    const n = Number(data.numerator) || 1;
    const d = Number(data.denominator) || 3;

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex items-center justify-around gap-2">
          {Array.from({ length: w }).map((_, i) => (
            <FractionBar key={`whole-bar-${i}`} numerator={d} denominator={d} width={80} height={30} showLabels={false} />
          ))}
          <FractionBar numerator={n} denominator={d} width={80} height={30} showLabels={false} />
        </div>
        <div className="text-center text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{w} and {n}/{d} = </span>
          <span className="text-indigo-600 font-mono text-sm">{w} {n}/{d} = {w * d + n}/{d}</span>
        </div>
      </div>
    );
  },
};

// 7. Tenths and Hundredths Decimal 10x10 Grid
export const DecimalGridTemplate: MathTemplate = {
  id: "c4-decimal-grid",
  name: "Decimal 10×10 Grid (Hundredths)",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 5: Decimals",
  category: "decimals",
  type: "visual-model",
  tags: ["decimals", "hundredths", "10x10 grid", "class 4"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    shaded: 45, // 0.45
  },
  propSchema: [
    { key: "shaded", label: "Shaded Hundredths (0-100)", type: "number", defaultValue: 45, min: 0, max: 100 },
  ],
  configFields: [
    { key: "shaded", label: "Shaded", type: "number", defaultValue: 45 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "10x10 square grid with shaded hundredths cells",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const sh = Math.max(0, Math.min(100, Number(data.shaded) || 45));

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" className="border border-slate-400">
          {Array.from({ length: 100 }).map((_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const isShaded = i < sh;
            return (
              <rect
                key={`dec-cell-${i}`}
                x={col * 10}
                y={row * 10}
                width="10"
                height="10"
                fill={isShaded ? "#3b82f6" : "#ffffff"}
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{sh}/100 = </span>
          <span className="text-blue-600 font-mono text-sm">{(sh / 100).toFixed(2)}</span>
        </div>
      </div>
    );
  },
};

// 8. Area and Perimeter on Grid
export const AreaPerimeterGridTemplate: MathTemplate = {
  id: "c4-area-perimeter-grid",
  name: "Area & Perimeter on Grid",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 6: Area & Perimeter",
  category: "geometry",
  type: "practice",
  tags: ["area", "perimeter", "grid", "class 4"],
  defaultWidth: 250,
  defaultHeight: 145,
  defaultData: {
    widthUnits: 5,
    heightUnits: 3,
  },
  propSchema: [
    { key: "widthUnits", label: "Width (units)", type: "number", defaultValue: 5 },
    { key: "heightUnits", label: "Height (units)", type: "number", defaultValue: 3 },
  ],
  configFields: [
    { key: "widthUnits", label: "Width", type: "number", defaultValue: 5 },
    { key: "heightUnits", label: "Height", type: "number", defaultValue: 3 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Grid showing rectangle with area and perimeter calculations",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const w = Number(data.widthUnits) || 5;
    const h = Number(data.heightUnits) || 3;
    const area = w * h;
    const peri = 2 * (w + h);
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <GridPaper
          rows={6}
          cols={9}
          cellSize={18}
          shapes={[
            {
              type: "rect",
              rect: { col: 2, row: 1, width: w, height: h },
              color: "#059669",
              fill: "rgba(16, 185, 129, 0.2)",
              label: `${w} × ${h}`,
            },
          ]}
        />
        <div className="flex items-center justify-around w-full text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Area = <span className="text-emerald-600 font-mono">{isTeacher ? `${area} sq units` : "____"}</span></span>
          <span>Perimeter = <span className="text-indigo-600 font-mono">{isTeacher ? `${peri} units` : "____"}</span></span>
        </div>
      </div>
    );
  },
};

// 9. Protractor Angle Measuring Template
export const ProtractorMeasuringTemplate: MathTemplate = {
  id: "c4-protractor-measuring",
  name: "Protractor Angle Measuring",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 7: Angles & Measurement",
  category: "measurement",
  type: "practice",
  tags: ["protractor", "angle", "degrees", "geometry", "class 4"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    angle: 65,
  },
  propSchema: [
    { key: "angle", label: "Angle Degrees (0-180)", type: "number", defaultValue: 65, min: 0, max: 180 },
  ],
  configFields: [
    { key: "angle", label: "Angle", type: "number", defaultValue: 65 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Semi-circular protractor measuring an angle",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const a = Number(data.angle) || 65;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Protractor size={Math.min(220, width - 20)} angle={a} label={isTeacher ? `${a}°` : "?°"} />
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Measured Angle = </span>
          <span className="text-red-600 font-mono text-sm">{isTeacher ? `${a}°` : "____°"}</span>
        </div>
      </div>
    );
  },
};

// 10. Line Graph Template
export const LineGraphTemplate: MathTemplate = {
  id: "c4-line-graph",
  name: "Primary Line Graph",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 8: Data Handling",
  category: "data",
  type: "visual-model",
  tags: ["line graph", "trend", "data handling", "class 4"],
  defaultWidth: 250,
  defaultHeight: 145,
  defaultData: {
    title: "Daily Temperatures (°C)",
    points: [22, 25, 24, 28, 30],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  propSchema: [
    { key: "title", label: "Graph Title", type: "text", defaultValue: "Daily Temperatures (°C)" },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "Daily Temperatures (°C)" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Continuous line graph showing trend across days",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const pts = data.points || [22, 25, 24, 28, 30];
    const lbls = data.labels || ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const maxVal = 35;
    const minVal = 15;

    const padL = 32;
    const padB = 28;
    const padT = 24;
    const plotW = width - padL - 20;
    const plotH = height - padT - padB;

    const coords = pts.map((val: number, i: number) => {
      const x = padL + (i / (pts.length - 1)) * plotW;
      const y = padT + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
      return { x, y, val };
    });

    const pathD = coords.map((c: { x: number; y: number }, i: number) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{data.title}</span>
        <svg width={width - 16} height={height - 36} viewBox={`0 0 ${width - 16} ${height - 36}`}>
          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={MATH_TOKENS.print.ink} strokeWidth="1.5" />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke={MATH_TOKENS.print.ink} strokeWidth="1.5" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />

          {/* Points */}
          {coords.map((c: { x: number; y: number; val: number }, idx: number) => (
            <g key={`pt-${idx}`}>
              <circle cx={c.x} cy={c.y} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
              <text x={c.x} y={c.y - 6} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e40af">{c.val}°</text>
              <text x={c.x} y={padT + plotH + 12} textAnchor="middle" fontSize="8" fill="#64748b">{lbls[idx]}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  },
};

// 11. 24-Hour Clock Conversion Template
export const Clock24HrTemplate: MathTemplate = {
  id: "c4-24hr-clock",
  name: "24-Hour Clock Time Converter",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 9: Time (24-Hour)",
  category: "time",
  type: "visual-model",
  tags: ["24-hour clock", "railway time", "time conversion", "class 4"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    hours12: 3,
    minutes: 40,
    isPM: true,
  },
  propSchema: [
    { key: "hours12", label: "Hour (1-12)", type: "number", defaultValue: 3 },
    { key: "minutes", label: "Minutes", type: "number", defaultValue: 40 },
    { key: "isPM", label: "Is PM?", type: "boolean", defaultValue: true },
  ],
  configFields: [
    { key: "hours12", label: "Hour", type: "number", defaultValue: 3 },
    { key: "minutes", label: "Minutes", type: "number", defaultValue: 40 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Comparison of 12-hour AM/PM time and 24-hour railway time",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const h12 = Number(data.hours12) || 3;
    const m = Number(data.minutes) || 40;
    const isPM = data.isPM !== false;
    const h24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);

    const time12Str = `${h12}:${String(m).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
    const time24Str = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")} Hours`;

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Clock hours={h12} minutes={m} size={105} showDigital={false} />
        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <span className="text-slate-700 dark:text-slate-300">{time12Str}</span>
          <span className="text-indigo-500 font-sans">↔</span>
          <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">{time24Str}</span>
        </div>
      </div>
    );
  },
};

// 12. Unit Conversion Table
export const UnitConversionTableTemplate: MathTemplate = {
  id: "c4-unit-conversion-table",
  name: "Unit Conversion Table",
  grade: 4,
  grades: [4],
  chapterTag: "Chapter 10: Measurement",
  category: "measurement",
  type: "table",
  tags: ["unit conversion", "km to m", "kg to g", "l to ml", "class 4"],
  defaultWidth: 250,
  defaultHeight: 130,
  defaultData: {},
  propSchema: [],
  configFields: [],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Standard metric unit conversion reference table",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <table className="w-full border-collapse text-xs font-mono">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
            <th className="py-1 text-left px-2 font-bold"><span>Metric Measure</span></th>
            <th className="py-1 text-right px-2 font-bold"><span>Equivalent</span></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-1.5 px-2"><span>1 kilometer (km)</span></td>
            <td className="py-1.5 px-2 text-right font-bold text-indigo-600"><span>1,000 meters (m)</span></td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-1.5 px-2"><span>1 meter (m)</span></td>
            <td className="py-1.5 px-2 text-right font-bold text-indigo-600"><span>100 centimeters (cm)</span></td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="py-1.5 px-2"><span>1 kilogram (kg)</span></td>
            <td className="py-1.5 px-2 text-right font-bold text-emerald-600"><span>1,000 grams (g)</span></td>
          </tr>
          <tr>
            <td className="py-1.5 px-2"><span>1 liter (L)</span></td>
            <td className="py-1.5 px-2 text-right font-bold text-blue-600"><span>1,000 milliliters (mL)</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

export const CLASS_4_TEMPLATES: MathTemplate[] = [
  PlaceValueLakhsTemplate,
  LongDivisionTemplate,
  FactorTreeTemplate,
  FactorsMultiplesTableTemplate,
  EquivalentFractionsTemplate,
  MixedFractionsTemplate,
  DecimalGridTemplate,
  AreaPerimeterGridTemplate,
  ProtractorMeasuringTemplate,
  LineGraphTemplate,
  Clock24HrTemplate,
  UnitConversionTableTemplate,
];
