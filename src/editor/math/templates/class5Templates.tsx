import React from "react";
import type { MathTemplate, MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import {
  FractionBar,
  FractionCircle,
  GridPaper,
} from "./_kit";

// ────────────────────────────────────────────────────────────────────────────
// CLASS 5 TEMPLATES (Ages 9–10 / Primary Maths Class 5)
// ────────────────────────────────────────────────────────────────────────────

// 1. Place Value to Crores (Indian + International)
export const PlaceValueCroresTemplate: MathTemplate = {
  id: "c5-place-value-crores",
  name: "Place Value to Crores (Indian & International)",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 1: Large Numbers",
  category: "place-value",
  type: "table",
  tags: ["crores", "millions", "indian vs international", "class 5"],
  defaultWidth: 280,
  defaultHeight: 145,
  defaultData: {
    number: 25410983,
  },
  propSchema: [
    { key: "number", label: "8-Digit Number", type: "number", defaultValue: 25410983 },
  ],
  configFields: [
    { key: "number", label: "Number", type: "number", defaultValue: 25410983 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Comparison table of Indian system (Crores/Lakhs) and International system (Millions)",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const num = Number(data.number) || 25410983;

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <table className="w-full border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300">
              <th className="py-1 text-left px-2 font-bold"><span>System</span></th>
              <th className="py-1 text-left px-2 font-bold"><span>Formatted Number</span></th>
              <th className="py-1 text-left px-2 font-bold"><span>Periods</span></th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 px-2 font-bold text-orange-700"><span>Indian</span></td>
              <td className="py-2 px-2 font-bold text-base text-slate-800 dark:text-slate-200">
                <span>2,54,10,983</span>
              </td>
              <td className="py-2 px-2 text-[10px] text-slate-500">
                <span>2 Cr, 54 L, 10 Th, 983</span>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-2 font-bold text-purple-700"><span>International</span></td>
              <td className="py-2 px-2 font-bold text-base text-slate-800 dark:text-slate-200">
                <span>25,410,983</span>
              </td>
              <td className="py-2 px-2 text-[10px] text-slate-500">
                <span>25 M, 410 Th, 983</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
};

// 2. BODMAS Steps Box
export const BodmasStepsTemplate: MathTemplate = {
  id: "c5-bodmas-steps",
  name: "BODMAS Order of Operations",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 2: Operations on Numbers",
  category: "operations",
  type: "worked-example",
  tags: ["bodmas", "order of operations", "brackets", "class 5"],
  defaultWidth: 250,
  defaultHeight: 145,
  defaultData: {
    expression: "12 + (8 × 2) − 6",
  },
  propSchema: [
    { key: "expression", label: "Math Expression", type: "text", defaultValue: "12 + (8 × 2) − 6" },
  ],
  configFields: [
    { key: "expression", label: "Expression", type: "text", defaultValue: "12 + (8 × 2) − 6" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Step-by-step simplification applying BODMAS rules",
  renderer: ({ data, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="font-mono text-xs space-y-1.5">
        <div className="font-bold text-indigo-700 text-sm">
          <span>Problem: {data.expression || "12 + (8 × 2) − 6"}</span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          <span>Step 1 (Brackets): = 12 + 16 − 6</span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          <span>Step 2 (Addition): = 28 − 6</span>
        </div>
        <div className="font-bold text-emerald-600 text-sm">
          <span>Step 3 (Subtraction): = 22</span>
        </div>
      </div>
    </div>
  ),
};

// 3. Fraction Add/Subtract Area Model
export const FractionOperationsAreaTemplate: MathTemplate = {
  id: "c5-fraction-operations-area",
  name: "Fraction Operations Area Model",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 3: Fraction Operations",
  category: "fractions",
  type: "visual-model",
  tags: ["fraction addition", "area model", "common denominator", "class 5"],
  defaultWidth: 270,
  defaultHeight: 130,
  defaultData: {
    f1: "1/4",
    f2: "2/4",
    res: "3/4",
  },
  propSchema: [
    { key: "f1", label: "Fraction 1", type: "text", defaultValue: "1/4" },
    { key: "f2", label: "Fraction 2", type: "text", defaultValue: "2/4" },
  ],
  configFields: [
    { key: "f1", label: "Fraction 1", type: "text", defaultValue: "1/4" },
    { key: "f2", label: "Fraction 2", type: "text", defaultValue: "2/4" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Area model demonstrating addition of fractions with common denominators",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="flex items-center justify-around">
        <FractionBar numerator={1} denominator={4} width={80} height={30} fillColor="#3b82f6" />
        <span className="text-xl font-bold text-slate-500">+</span>
        <FractionBar numerator={2} denominator={4} width={80} height={30} fillColor="#10b981" />
        <span className="text-xl font-bold text-slate-500">=</span>
        <FractionBar numerator={3} denominator={4} width={80} height={30} fillColor="#8b5cf6" />
      </div>
      <div className="text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
        <span>1/4 + 2/4 = (1 + 2)/4 = 3/4</span>
      </div>
    </div>
  ),
};

// 4. Decimal Operations Column Layout
export const DecimalOperationsColumnTemplate: MathTemplate = {
  id: "c5-decimal-operations-column",
  name: "Decimal Operations Column Layout",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 4: Decimals",
  category: "decimals",
  type: "practice",
  tags: ["decimal addition", "decimal points", "vertical decimals", "class 5"],
  defaultWidth: 180,
  defaultHeight: 145,
  defaultData: {
    op1: "24.65",
    op2: "18.42",
    result: "43.07",
  },
  propSchema: [
    { key: "op1", label: "Operand 1", type: "text", defaultValue: "24.65" },
    { key: "op2", label: "Operand 2", type: "text", defaultValue: "18.42" },
  ],
  configFields: [
    { key: "op1", label: "Operand 1", type: "text", defaultValue: "24.65" },
    { key: "op2", label: "Operand 2", type: "text", defaultValue: "18.42" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Vertical decimal addition aligning the decimal points",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="font-mono text-lg font-bold text-right w-36">
          <div className="text-slate-800 dark:text-slate-200"><span>{data.op1 || "24.65"}</span></div>
          <div className="text-slate-800 dark:text-slate-200 border-b-2 border-slate-800 dark:border-slate-200 pb-1">
            <span>+ {data.op2 || "18.42"}</span>
          </div>
          <div className="text-indigo-600 pt-1">
            <span>{isTeacher ? data.result || "43.07" : "??.??"}</span>
          </div>
        </div>
      </div>
    );
  },
};

// 5. Percentage 10x10 Grid
export const PercentageGridTemplate: MathTemplate = {
  id: "c5-percentage-grid",
  name: "Percentage 10×10 Grid",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 5: Percentages",
  category: "fractions",
  type: "visual-model",
  tags: ["percentages", "10x10 grid", "percent", "class 5"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    percent: 65,
  },
  propSchema: [
    { key: "percent", label: "Percentage (0-100%)", type: "number", defaultValue: 65, min: 0, max: 100 },
  ],
  configFields: [
    { key: "percent", label: "Percent", type: "number", defaultValue: 65 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "10x10 percentage grid representing parts per hundred",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const p = Math.max(0, Math.min(100, Number(data.percent) || 65));

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg width="110" height="110" viewBox="0 0 100 100" className="border border-slate-400">
          {Array.from({ length: 100 }).map((_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const isShaded = i < p;
            return (
              <rect
                key={`pct-cell-${i}`}
                x={col * 10}
                y={row * 10}
                width="10"
                height="10"
                fill={isShaded ? "#8b5cf6" : "#ffffff"}
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{p} out of 100 = </span>
          <span className="text-purple-600 font-mono text-sm">{p}% = {p / 100}</span>
        </div>
      </div>
    );
  },
};

// 6. Ratio Bars Template
export const RatioBarsTemplate: MathTemplate = {
  id: "c5-ratio-bars",
  name: "Ratio Comparison Bars",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 6: Ratio & Proportion",
  category: "numbers",
  type: "visual-model",
  tags: ["ratio", "proportion", "comparison", "class 5"],
  defaultWidth: 250,
  defaultHeight: 110,
  defaultData: {
    label1: "Boys",
    val1: 3,
    label2: "Girls",
    val2: 2,
  },
  propSchema: [
    { key: "val1", label: "Ratio 1", type: "number", defaultValue: 3 },
    { key: "val2", label: "Ratio 2", type: "number", defaultValue: 2 },
  ],
  configFields: [
    { key: "val1", label: "Ratio 1", type: "number", defaultValue: 3 },
    { key: "val2", label: "Ratio 2", type: "number", defaultValue: 2 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Visual segmented bars showing ratio comparison",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const v1 = Number(data.val1) || 3;
    const v2 = Number(data.val2) || 2;

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-12 text-xs font-bold">{data.label1 || "Boys"}:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: v1 }).map((_, i) => (
                <div key={`r1-${i}`} className="w-8 h-6 bg-blue-500 rounded border border-blue-700" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-xs font-bold">{data.label2 || "Girls"}:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: v2 }).map((_, i) => (
                <div key={`r2-${i}`} className="w-8 h-6 bg-pink-500 rounded border border-pink-700" />
              ))}
            </div>
          </div>
        </div>
        <div className="text-center font-bold text-xs text-slate-700 dark:text-slate-300">
          <span>Ratio = </span>
          <span className="text-indigo-600 font-mono text-sm">{v1} : {v2}</span>
        </div>
      </div>
    );
  },
};

// 7. Average / Mean Calculation Table
export const AverageMeanTableTemplate: MathTemplate = {
  id: "c5-average-mean-table",
  name: "Average (Mean) Calculation Table",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 7: Average",
  category: "data",
  type: "table",
  tags: ["average", "mean", "sum", "data", "class 5"],
  defaultWidth: 250,
  defaultHeight: 130,
  defaultData: {
    values: [15, 20, 25, 30, 10],
  },
  propSchema: [
    { key: "values", label: "Data Values", type: "items", defaultValue: [15, 20, 25, 30, 10] },
  ],
  configFields: [
    { key: "values", label: "Values", type: "items", defaultValue: [15, 20, 25, 30, 10] },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Calculation of average from a set of data items",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const vals: number[] = Array.isArray(data.values) ? data.values : [15, 20, 25, 30, 10];
    const sum = vals.reduce((a, b) => a + Number(b), 0);
    const avg = Math.round((sum / vals.length) * 10) / 10;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs font-mono space-y-1.5">
          <div className="font-bold text-slate-700 dark:text-slate-300">
            <span>Data: {vals.join(", ")}</span>
          </div>
          <div><span>Sum = {vals.join(" + ")} = {sum}</span></div>
          <div><span>Number of items = {vals.length}</span></div>
          <div className="font-bold text-sm text-indigo-600">
            <span>Average = Sum ÷ Count = {isTeacher ? `${sum} ÷ ${vals.length} = ${avg}` : "____"}</span>
          </div>
        </div>
      </div>
    );
  },
};

// 8. Cube & Cuboid Volume 3D Model
export const CubeVolumeTemplate: MathTemplate = {
  id: "c5-cube-volume",
  name: "Cuboid Volume 3D Model",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 8: Volume",
  category: "measurement",
  type: "visual-model",
  tags: ["volume", "cube", "cuboid", "length width height", "class 5"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    l: 5,
    w: 3,
    h: 4,
  },
  propSchema: [
    { key: "l", label: "Length (cm)", type: "number", defaultValue: 5 },
    { key: "w", label: "Width (cm)", type: "number", defaultValue: 3 },
    { key: "h", label: "Height (cm)", type: "number", defaultValue: 4 },
  ],
  configFields: [
    { key: "l", label: "Length", type: "number", defaultValue: 5 },
    { key: "w", label: "Width", type: "number", defaultValue: 3 },
    { key: "h", label: "Height", type: "number", defaultValue: 4 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Isometric 3D box model showing length, width, and height dimensions",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const l = Number(data.l) || 5;
    const w = Number(data.w) || 3;
    const h = Number(data.h) || 4;
    const vol = l * w * h;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg width="140" height="110" viewBox="0 0 140 110">
          {/* Front Face */}
          <rect x="20" y="40" width="70" height="50" fill="#93c5fd" stroke="#1e293b" strokeWidth="1.5" />
          {/* Top Face */}
          <polygon points="20,40 50,15 120,15 90,40" fill="#bfdbfe" stroke="#1e293b" strokeWidth="1.5" />
          {/* Right Face */}
          <polygon points="90,40 120,15 120,65 90,90" fill="#60a5fa" stroke="#1e293b" strokeWidth="1.5" />

          {/* Dimension labels */}
          <text x="55" y="102" textAnchor="middle" fontSize="9" fontWeight="bold">l = {l} cm</text>
          <text x="110" y="85" textAnchor="middle" fontSize="9" fontWeight="bold">w = {w} cm</text>
          <text x="10" y="68" textAnchor="middle" fontSize="9" fontWeight="bold">h = {h} cm</text>
        </svg>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Volume = l × w × h = </span>
          <span className="text-blue-600 font-mono">{isTeacher ? `${vol} cm³` : "____ cm³"}</span>
        </div>
      </div>
    );
  },
};

// 9. Triangle & Parallelogram Area
export const TriangleParallelogramAreaTemplate: MathTemplate = {
  id: "c5-triangle-parallelogram-area",
  name: "Triangle Area (1/2 × b × h)",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 9: Area Formulas",
  category: "geometry",
  type: "visual-model",
  tags: ["triangle area", "height", "base", "formula", "class 5"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    base: 8,
    height: 5,
  },
  propSchema: [
    { key: "base", label: "Base (cm)", type: "number", defaultValue: 8 },
    { key: "height", label: "Height (cm)", type: "number", defaultValue: 5 },
  ],
  configFields: [
    { key: "base", label: "Base", type: "number", defaultValue: 8 },
    { key: "height", label: "Height", type: "number", defaultValue: 5 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Triangle with perpendicular height altitude and base",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const b = Number(data.base) || 8;
    const h = Number(data.height) || 5;
    const area = 0.5 * b * h;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg width="150" height="110" viewBox="0 0 150 110">
          {/* Triangle */}
          <polygon points="20,90 130,90 60,20" fill="rgba(16, 185, 129, 0.2)" stroke="#059669" strokeWidth="2" />
          {/* Perpendicular Height dashed altitude */}
          <line x1="60" y1="20" x2="60" y2="90" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
          <rect x="60" y="80" width="8" height="10" fill="none" stroke="#ef4444" strokeWidth="1" />

          <text x="75" y="104" textAnchor="middle" fontSize="9" fontWeight="bold">Base = {b} cm</text>
          <text x="72" y="55" fontSize="9" fontWeight="bold" fill="#dc2626">h = {h} cm</text>
        </svg>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Area = 1/2 × b × h = </span>
          <span className="text-emerald-600 font-mono">{isTeacher ? `${area} cm²` : "____ cm²"}</span>
        </div>
      </div>
    );
  },
};

// 10. Circle Parts Diagram
export const CirclePartsTemplate: MathTemplate = {
  id: "c5-circle-parts",
  name: "Parts of a Circle",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 10: Circles",
  category: "geometry",
  type: "visual-model",
  tags: ["circle", "radius", "diameter", "chord", "center", "class 5"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {},
  propSchema: [],
  configFields: [],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Diagram showing Center, Radius, Diameter, and Chord of a circle",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg width="150" height="130" viewBox="0 0 150 130">
        <circle cx="75" cy="65" r="50" fill="#f8fafc" stroke={MATH_TOKENS.print.ink} strokeWidth="2" />
        <circle cx="75" cy="65" r="3" fill="#ef4444" />
        <text x="75" y="60" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ef4444">Center (O)</text>

        {/* Diameter */}
        <line x1="25" y1="65" x2="125" y2="65" stroke="#2563eb" strokeWidth="2" />
        <text x="100" y="60" fontSize="8" fontWeight="bold" fill="#2563eb">Radius (r)</text>

        {/* Chord */}
        <line x1="45" y1="28" x2="115" y2="35" stroke="#059669" strokeWidth="1.5" strokeDasharray="3,2" />
        <text x="80" y="25" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#059669">Chord</text>
      </svg>
      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Diameter (d) = 2 × Radius (r)</span>
    </div>
  ),
};

// 11. Coordinate Grid Template
export const CoordinateGridTemplate: MathTemplate = {
  id: "c5-coordinate-grid",
  name: "Coordinate Grid (Quadrant I)",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 11: Coordinates",
  category: "geometry",
  type: "visual-model",
  tags: ["coordinate grid", "x y axes", "ordered pairs", "class 5"],
  defaultWidth: 220,
  defaultHeight: 145,
  defaultData: {
    points: [
      { x: 2, y: 3, label: "A (2,3)" },
      { x: 5, y: 4, label: "B (5,4)" },
    ],
  },
  propSchema: [],
  configFields: [],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Quadrant I coordinate plane with plotted points",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <GridPaper
        type="coordinate"
        rows={6}
        cols={7}
        cellSize={18}
        axes={true}
      />
    </div>
  ),
};

// 12. Pie Chart Template
export const PieChartTemplate: MathTemplate = {
  id: "c5-pie-chart",
  name: "Primary Pie Chart",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 12: Data Handling",
  category: "data",
  type: "visual-model",
  tags: ["pie chart", "circle graph", "percentages", "class 5"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    numerator: 3,
    denominator: 8,
  },
  propSchema: [],
  configFields: [],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Pie chart circle graph showing fractional proportions",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <FractionCircle numerator={3} denominator={8} size={110} fillColor="#6366f1" />
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Shaded: 3/8 (37.5%)</span>
    </div>
  ),
};

// 13. LCM / HCF Ladder Method
export const LcmHcfLadderTemplate: MathTemplate = {
  id: "c5-lcm-hcf-ladder",
  name: "LCM / HCF Ladder Method",
  grade: 5,
  grades: [5],
  chapterTag: "Chapter 13: LCM & HCF",
  category: "multiplication",
  type: "worked-example",
  tags: ["lcm", "hcf", "ladder method", "prime division", "class 5"],
  defaultWidth: 200,
  defaultHeight: 145,
  defaultData: {
    num1: 12,
    num2: 18,
  },
  propSchema: [
    { key: "num1", label: "Number 1", type: "number", defaultValue: 12 },
    { key: "num2", label: "Number 2", type: "number", defaultValue: 18 },
  ],
  configFields: [
    { key: "num1", label: "Number 1", type: "number", defaultValue: 12 },
    { key: "num2", label: "Number 2", type: "number", defaultValue: 18 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Division ladder steps finding HCF and LCM of two numbers",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="font-mono text-sm">
          {/* Row 1 */}
          <div className="flex items-center">
            <span className="w-6 text-center font-bold text-red-600">2</span>
            <div className="border-b-2 border-l-2 border-slate-800 px-3 py-1 font-bold">12, 18</div>
          </div>
          {/* Row 2 */}
          <div className="flex items-center">
            <span className="w-6 text-center font-bold text-red-600">3</span>
            <div className="border-b-2 border-l-2 border-slate-800 px-3 py-1 font-bold">6, 9</div>
          </div>
          {/* Bottom Row */}
          <div className="flex items-center">
            <span className="w-6"></span>
            <div className="px-3 py-1 font-bold">2, 3</div>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">
          <span>HCF = {isTeacher ? "2 × 3 = 6" : "____"} | LCM = {isTeacher ? "2 × 3 × 2 × 3 = 36" : "____"}</span>
        </div>
      </div>
    );
  },
};

export const CLASS_5_TEMPLATES: MathTemplate[] = [
  PlaceValueCroresTemplate,
  BodmasStepsTemplate,
  FractionOperationsAreaTemplate,
  DecimalOperationsColumnTemplate,
  PercentageGridTemplate,
  RatioBarsTemplate,
  AverageMeanTableTemplate,
  CubeVolumeTemplate,
  TriangleParallelogramAreaTemplate,
  CirclePartsTemplate,
  CoordinateGridTemplate,
  PieChartTemplate,
  LcmHcfLadderTemplate,
];
