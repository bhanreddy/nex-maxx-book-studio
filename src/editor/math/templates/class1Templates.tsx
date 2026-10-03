import React from "react";
import type { MathTemplate, MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import {
  TenFrame,
  NumberLine,
  BaseTenBlocks,
  Clock,
  CoinNote,
  TallyMarks,
  Pictograph,
} from "./_kit";

// ────────────────────────────────────────────────────────────────────────────
// CLASS 1 TEMPLATES (Ages 5–6 / Foundation Primary Maths)
// ────────────────────────────────────────────────────────────────────────────

// 1. Counting Objects Grid
export const CountingObjectsGridTemplate: MathTemplate = {
  id: "c1-counting-grid",
  name: "Counting Objects Grid",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 1: Numbers up to 10",
  category: "numbers",
  type: "visual-model",
  tags: ["counting", "objects", "quantities", "class 1"],
  defaultWidth: 250,
  defaultHeight: 145,
  defaultData: {
    count: 7,
    itemType: "apple", // "apple" | "star" | "smile"
    title: "Count the objects and write the number:",
  },
  propSchema: [
    { key: "count", label: "Number of Objects (1-20)", type: "number", defaultValue: 7, min: 1, max: 20 },
    { key: "itemType", label: "Object Type", type: "select", defaultValue: "apple", options: [
      { label: "Apples", value: "apple" },
      { label: "Stars", value: "star" },
      { label: "Smileys", value: "smile" },
    ]},
    { key: "title", label: "Instruction Text", type: "text", defaultValue: "Count the objects and write the number:" },
  ],
  configFields: [
    { key: "count", label: "Number of Objects", type: "number", defaultValue: 7 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Counting grid with visual items and an answer box",
  renderer: ({ data, mode, styleVariant, width, height }: MathRendererProps) => {
    const count = Math.max(1, Math.min(20, Number(data.count) || 7));
    const isTeacher = mode === "teacher";
    const itemType = data.itemType || "apple";

    const renderItem = (key: string) => (
      <svg key={key} width="32" height="32" viewBox="0 0 24 24" className="inline-block">
        {itemType === "apple" && (
          <g>
            <circle cx="12" cy="14" r="8" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
            <path d="M 12 6 Q 14 3 17 4" fill="none" stroke="#15803d" strokeWidth="2" />
          </g>
        )}
        {itemType === "star" && (
          <polygon
            points="12,2 15,8 22,9 17,14 18,21 12,17 6,21 7,14 2,9 9,8"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="1.5"
          />
        )}
        {itemType === "smile" && (
          <g>
            <circle cx="12" cy="12" r="9" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="1.5" fill="#1e293b" />
            <circle cx="15" cy="10" r="1.5" fill="#1e293b" />
            <path d="M 8 14 Q 12 18 16 14" fill="none" stroke="#1e293b" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    );

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>{data.title || "Count the objects and write the number:"}</span>
        </div>

        {/* Objects Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg min-h-20">
          {Array.from({ length: count }).map((_, i) => renderItem(`count-item-${i}`))}
        </div>

        {/* Answer Box */}
        <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
          <span>Total =</span>
          <div className="w-10 h-10 rounded-lg border-2 border-indigo-500 bg-indigo-50/50 flex items-center justify-center text-lg font-bold text-indigo-700">
            <span>{isTeacher ? count : "?"}</span>
          </div>
        </div>
      </div>
    );
  },
};

// 2. Ten Frame Template
export const TenFrameTemplate: MathTemplate = {
  id: "c1-ten-frame",
  name: "Ten Frame Model",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 1: Numbers up to 10",
  category: "numbers",
  type: "visual-model",
  tags: ["ten frame", "counters", "number sense", "class 1"],
  defaultWidth: 200,
  defaultHeight: 110,
  defaultData: {
    value: 7,
    label: "Show 7 on the Ten Frame",
  },
  propSchema: [
    { key: "value", label: "Number of Counters (0-10)", type: "number", defaultValue: 7, min: 0, max: 10 },
    { key: "label", label: "Prompt Label", type: "text", defaultValue: "Show 7 on the Ten Frame" },
  ],
  configFields: [
    { key: "value", label: "Counters", type: "number", defaultValue: 7 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Ten frame grid showing counters",
  renderer: ({ data, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <TenFrame
        value={Number(data.value) || 7}
        frames={1}
        label={data.label}
        frameWidth={Math.min(220, width - 30)}
        frameHeight={Math.min(90, height - 46)}
      />
    </div>
  ),
};

// 3. Number Bonds Template
export const NumberBondsTemplate: MathTemplate = {
  id: "c1-number-bonds",
  name: "Number Bonds Tree",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 2: Addition within 10",
  category: "addition",
  type: "visual-model",
  tags: ["number bonds", "part-part-whole", "addition", "class 1"],
  defaultWidth: 190,
  defaultHeight: 145,
  defaultData: {
    whole: 8,
    part1: 5,
    part2: 3,
    hide: "none", // "none" | "whole" | "part1" | "part2"
  },
  propSchema: [
    { key: "whole", label: "Whole Number", type: "number", defaultValue: 8 },
    { key: "part1", label: "Part 1", type: "number", defaultValue: 5 },
    { key: "part2", label: "Part 2", type: "number", defaultValue: 3 },
  ],
  configFields: [
    { key: "whole", label: "Whole", type: "number", defaultValue: 8 },
    { key: "part1", label: "Part 1", type: "number", defaultValue: 5 },
    { key: "part2", label: "Part 2", type: "number", defaultValue: 3 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Part-part-whole number bonds circle diagram",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const whole = Number(data.whole) || 8;
    const part1 = Number(data.part1) || 5;
    const part2 = Number(data.part2) || 3;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg viewBox="0 0 200 160" className="w-full h-full overflow-visible">
          {/* Connecting Branches */}
          <line x1="100" y1="45" x2="50" y2="120" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />
          <line x1="100" y1="45" x2="150" y2="120" stroke={MATH_TOKENS.print.ink} strokeWidth="2.5" />

          {/* Top Circle: Whole */}
          <circle cx="100" cy="45" r="28" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
          <text x="100" y="52" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1e40af">
            {whole}
          </text>

          {/* Left Circle: Part 1 */}
          <circle cx="50" cy="120" r="24" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="50" y="127" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#92400e">
            {part1}
          </text>

          {/* Right Circle: Part 2 */}
          <circle cx="150" cy="120" r="24" fill="#ecfdf5" stroke="#10b981" strokeWidth="2.5" />
          <text x="150" y="127" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#065f46">
            {isTeacher ? part2 : "?"}
          </text>
        </svg>
      </div>
    );
  },
};

// 4. Number Line 0–20 Template
export const NumberLine20Template: MathTemplate = {
  id: "c1-number-line-20",
  name: "Number Line (0 to 20)",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 3: Numbers 10 to 20",
  category: "numbers",
  type: "visual-model",
  tags: ["number line", "0 to 20", "order", "class 1"],
  defaultWidth: 280,
  defaultHeight: 90,
  defaultData: {
    start: 0,
    end: 20,
    step: 2,
    missingPoints: [10, 16],
  },
  propSchema: [
    { key: "start", label: "Start", type: "number", defaultValue: 0 },
    { key: "end", label: "End", type: "number", defaultValue: 20 },
    { key: "step", label: "Step", type: "number", defaultValue: 2 },
  ],
  configFields: [
    { key: "start", label: "Start", type: "number", defaultValue: 0 },
    { key: "end", label: "End", type: "number", defaultValue: 20 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Vector number line from 0 to 20 with missing points",
  renderer: ({ data, mode, width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <NumberLine
        start={Number(data.start) ?? 0}
        end={Number(data.end) ?? 20}
        step={Number(data.step) || 2}
        missingPoints={data.missingPoints || [10]}
        showAnswer={mode === "teacher"}
        width={width - 24}
        height={height - 20}
      />
    </div>
  ),
};

// 5. Tens & Ones Blocks Template
export const TensOnesBlocksTemplate: MathTemplate = {
  id: "c1-tens-ones-blocks",
  name: "Tens & Ones Blocks",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 4: Tens and Ones",
  category: "place-value",
  type: "visual-model",
  tags: ["base 10", "tens", "ones", "place value", "class 1"],
  defaultWidth: 200,
  defaultHeight: 130,
  defaultData: {
    tens: 2,
    ones: 5,
  },
  propSchema: [
    { key: "tens", label: "Tens Rods (0-9)", type: "number", defaultValue: 2, min: 0, max: 9 },
    { key: "ones", label: "Ones Cubes (0-9)", type: "number", defaultValue: 5, min: 0, max: 9 },
  ],
  configFields: [
    { key: "tens", label: "Tens", type: "number", defaultValue: 2 },
    { key: "ones", label: "Ones", type: "number", defaultValue: 5 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Tens rods and ones cubes Dienes representation",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const t = Number(data.tens) || 2;
    const o = Number(data.ones) || 5;
    const total = t * 10 + o;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <BaseTenBlocks tens={t} ones={o} showLabels={true} unitSize={7} />
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          <span>{t} Tens + {o} Ones =</span>
          <span className="text-blue-600 font-mono text-base">{isTeacher ? total : "____"}</span>
        </div>
      </div>
    );
  },
};

// 6. More / Less Comparison Template
export const MoreLessComparisonTemplate: MathTemplate = {
  id: "c1-more-less",
  name: "More / Less Comparison",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 5: Comparison of Numbers",
  category: "numbers",
  type: "practice",
  tags: ["comparison", "more", "less", "greater than", "class 1"],
  defaultWidth: 200,
  defaultHeight: 95,
  defaultData: {
    num1: 8,
    num2: 5,
  },
  propSchema: [
    { key: "num1", label: "First Number", type: "number", defaultValue: 8 },
    { key: "num2", label: "Second Number", type: "number", defaultValue: 5 },
  ],
  configFields: [
    { key: "num1", label: "Number 1", type: "number", defaultValue: 8 },
    { key: "num2", label: "Number 2", type: "number", defaultValue: 5 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Number comparison exercise with greater than or less than sign",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const n1 = Number(data.num1) || 8;
    const n2 = Number(data.num2) || 5;
    const sign = n1 > n2 ? ">" : n1 < n2 ? "<" : "=";
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs font-bold text-slate-500 mb-2">
          <span>Write &gt;, &lt; or = in the box:</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-800">
            <span>{n1}</span>
          </div>
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50/50 flex items-center justify-center text-2xl font-bold text-amber-600">
            <span>{isTeacher ? sign : "?"}</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-xl font-bold text-emerald-800">
            <span>{n2}</span>
          </div>
        </div>
      </div>
    );
  },
};

// 7. Shapes Gallery Template
export const ShapesGalleryTemplate: MathTemplate = {
  id: "c1-shapes-gallery",
  name: "2D Shapes Gallery",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 6: Shapes and Space",
  category: "geometry",
  type: "visual-model",
  tags: ["2d shapes", "circle", "square", "triangle", "rectangle", "class 1"],
  defaultWidth: 250,
  defaultHeight: 110,
  defaultData: {
    title: "Basic 2D Shapes",
  },
  propSchema: [
    { key: "title", label: "Title", type: "text", defaultValue: "Basic 2D Shapes" },
  ],
  configFields: [
    { key: "title", label: "Title", type: "text", defaultValue: "Basic 2D Shapes" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Gallery of circle, square, triangle, and rectangle",
  renderer: ({ width, height }: MathRendererProps) => (
    <div
      className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="grid grid-cols-4 gap-2 text-center">
        {/* Circle */}
        <div className="flex flex-col items-center gap-1">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
          </svg>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Circle</span>
        </div>
        {/* Square */}
        <div className="flex flex-col items-center gap-1">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <rect x="6" y="6" width="36" height="36" rx="2" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
          </svg>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Square</span>
        </div>
        {/* Triangle */}
        <div className="flex flex-col items-center gap-1">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <polygon points="24,4 44,42 4,42" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          </svg>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Triangle</span>
        </div>
        {/* Rectangle */}
        <div className="flex flex-col items-center gap-1">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <rect x="4" y="10" width="40" height="28" rx="2" fill="#fdf2f8" stroke="#ec4899" strokeWidth="2" />
          </svg>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Rectangle</span>
        </div>
      </div>
    </div>
  ),
};

// 8. Hour Clock Template
export const HourClockTemplate: MathTemplate = {
  id: "c1-hour-clock",
  name: "Hour Clock (O'Clock)",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 7: Time",
  category: "time",
  type: "visual-model",
  tags: ["clock", "hour", "o'clock", "analog time", "class 1"],
  defaultWidth: 180,
  defaultHeight: 145,
  defaultData: {
    hours: 4,
    minutes: 0,
  },
  propSchema: [
    { key: "hours", label: "Hour (1-12)", type: "number", defaultValue: 4, min: 1, max: 12 },
  ],
  configFields: [
    { key: "hours", label: "Hour", type: "number", defaultValue: 4 },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Analog clock showing exact hour o'clock",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const h = Number(data.hours) || 4;
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Clock hours={h} minutes={0} size={Math.min(120, width - 40)} showDigital={false} />
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Time: </span>
          <span className="text-indigo-600 font-mono text-sm">{isTeacher ? `${h} o'clock` : "____ o'clock"}</span>
        </div>
      </div>
    );
  },
};

// 9. Days / Months Strip Template
export const DaysMonthsStripTemplate: MathTemplate = {
  id: "c1-days-months",
  name: "Days of the Week Strip",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 7: Time & Calendar",
  category: "time",
  type: "visual-model",
  tags: ["days", "week", "calendar", "sequence", "class 1"],
  defaultWidth: 280,
  defaultHeight: 65,
  defaultData: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    highlightDay: "Sun",
  },
  propSchema: [
    { key: "highlightDay", label: "Highlighted Day", type: "text", defaultValue: "Sun" },
  ],
  configFields: [
    { key: "highlightDay", label: "Highlighted Day", type: "text", defaultValue: "Sun" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Ordered 7-day strip of the days of the week",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hi = data.highlightDay || "Sun";

    return (
      <div
        className="w-full h-full flex items-center justify-center p-2 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex items-center gap-1.5 w-full justify-between">
          {days.map((d, i) => {
            const isHi = d === hi;
            return (
              <div
                key={`day-strip-${d}-${i}`}
                className={`flex-1 py-2 rounded-lg text-center font-bold text-xs border ${
                  isHi
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{d}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};

// 10. ₹ Coins Template
export const RupeeCoinsTemplate: MathTemplate = {
  id: "c1-rupee-coins",
  name: "₹ Coins Counter",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 8: Money",
  category: "money",
  type: "visual-model",
  tags: ["money", "rupees", "coins", "currency", "class 1"],
  defaultWidth: 200,
  defaultHeight: 105,
  defaultData: {
    coins: [5, 2, 1], // e.g. ₹5, ₹2, ₹1
  },
  propSchema: [
    { key: "coins", label: "Coin List", type: "items", defaultValue: [5, 2, 1] },
  ],
  configFields: [
    { key: "coins", label: "Coins", type: "items", defaultValue: [5, 2, 1] },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Indian Rupee coins for counting and addition",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const coins: number[] = Array.isArray(data.coins) ? data.coins : [5, 2, 1];
    const total = coins.reduce((acc, c) => acc + (Number(c) || 0), 0);
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-between p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          {coins.map((c, i) => (
            <CoinNote key={`coin-item-${c}-${i}`} type="coin" denomination={c} size={42} />
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
          <span>Total =</span>
          <span className="text-emerald-600 font-mono text-base">
            {isTeacher ? `₹${total}` : "₹____"}
          </span>
        </div>
      </div>
    );
  },
};

// 11. Repeating Pattern Strip Template
export const RepeatingPatternTemplate: MathTemplate = {
  id: "c1-repeating-patterns",
  name: "Repeating Pattern Strip",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 9: Patterns",
  category: "patterns",
  type: "practice",
  tags: ["patterns", "repeating", "sequences", "class 1"],
  defaultWidth: 250,
  defaultHeight: 80,
  defaultData: {
    pattern: ["▲", "●", "▲", "●", "▲"],
    next: "●",
  },
  propSchema: [
    { key: "next", label: "Next Item Answer", type: "text", defaultValue: "●" },
  ],
  configFields: [
    { key: "next", label: "Next Item", type: "text", defaultValue: "●" },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Repeating geometric pattern strip with missing next item",
  renderer: ({ data, mode, width, height }: MathRendererProps) => {
    const seq = ["▲", "●", "▲", "●", "▲"];
    const nextItem = data.next || "●";
    const isTeacher = mode === "teacher";

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs font-semibold text-slate-500 mb-2">
          <span>What comes next in the pattern?</span>
        </div>
        <div className="flex items-center gap-2">
          {seq.map((sym, i) => (
            <div
              key={`pat-cell-${i}`}
              className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-lg text-indigo-700"
            >
              <span>{sym}</span>
            </div>
          ))}
          {/* Missing Box */}
          <div className="w-10 h-10 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 flex items-center justify-center text-lg font-bold text-amber-600">
            <span>{isTeacher ? nextItem : "?"}</span>
          </div>
        </div>
      </div>
    );
  },
};

// 12. Tally + Pictograph Template
export const TallyPictographTemplate: MathTemplate = {
  id: "c1-tally-pictograph",
  name: "Tally & Pictograph Chart",
  grade: 1,
  grades: [1],
  chapterTag: "Chapter 10: Data Handling",
  category: "data",
  type: "visual-model",
  tags: ["tally", "pictograph", "data handling", "class 1"],
  defaultWidth: 270,
  defaultHeight: 145,
  defaultData: {
    items: [
      { label: "Apples", count: 6 },
      { label: "Bananas", count: 4 },
      { label: "Oranges", count: 8 },
    ],
  },
  propSchema: [
    { key: "items", label: "Categories & Counts", type: "items", defaultValue: [
      { label: "Apples", count: 6 },
      { label: "Bananas", count: 4 },
      { label: "Oranges", count: 8 },
    ]},
  ],
  configFields: [
    { key: "items", label: "Data Items", type: "items", defaultValue: [] },
  ],
  styleVariants: ["clean", "color-coded"],
  a11yDescription: "Combined tally chart and pictograph",
  renderer: ({ data, width, height }: MathRendererProps) => {
    const items = data.items || [
      { label: "Apples", count: 6 },
      { label: "Bananas", count: 4 },
    ];

    return (
      <div
        className="w-full h-full flex flex-col justify-center p-3 select-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-1 text-slate-600"><span>Item</span></th>
              <th className="text-left py-1 text-slate-600"><span>Tally Marks</span></th>
              <th className="text-right py-1 text-slate-600"><span>Number</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: { label: string; count: number }, idx: number) => (
              <tr key={`tally-row-${idx}`} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span>{it.label}</span>
                </td>
                <td className="py-1.5">
                  <TallyMarks count={it.count} size={20} />
                </td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                  <span>{it.count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

export const CLASS_1_TEMPLATES: MathTemplate[] = [
  CountingObjectsGridTemplate,
  TenFrameTemplate,
  NumberBondsTemplate,
  NumberLine20Template,
  TensOnesBlocksTemplate,
  MoreLessComparisonTemplate,
  ShapesGalleryTemplate,
  HourClockTemplate,
  DaysMonthsStripTemplate,
  RupeeCoinsTemplate,
  RepeatingPatternTemplate,
  TallyPictographTemplate,
];
