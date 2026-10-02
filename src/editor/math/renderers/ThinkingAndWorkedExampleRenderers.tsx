// ============================================================================
// NEX MAXX BOOK STUDIO - THINKING DIAGRAMS, WORKED EXAMPLES, WORD PROBLEMS & ACTIVITIES
// Deep pedagogy models: Number Bonds, Bar Models, Step-by-Step Worked Examples, Activity Banners
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { parseMathNumber } from "../mathAlgorithms";

/**
 * 23. Number Bond Model (Whole -> Part + Part)
 */
export const NumberBondRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const whole = parseMathNumber(data.whole ?? 10);
  const part1 = parseMathNumber(data.part1 ?? 7);
  const part2 = whole - part1;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 mb-0.5">
        <span>Number Bond</span>
        <span className="font-mono text-[8px] text-slate-400">PART-WHOLE</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          {/* Connecting Branch Lines */}
          <line x1="50" y1="24" x2="25" y2="60" stroke="#6366f1" strokeWidth="2.5" />
          <line x1="50" y1="24" x2="75" y2="60" stroke="#6366f1" strokeWidth="2.5" />

          {/* Whole Circle (Top) */}
          <circle cx="50" cy="22" r="14" fill="#4338ca" stroke="#312e81" strokeWidth="1.5" />
          <text x="50" y="26" textAnchor="middle" fill="#ffffff" className="font-mono font-bold text-xs">
            {whole}
          </text>

          {/* Part 1 Circle (Bottom Left) */}
          <circle cx="25" cy="60" r="12" fill="#e0e7ff" stroke="#4338ca" strokeWidth="1.5" />
          <text x="25" y="64" textAnchor="middle" fill="#312e81" className="font-mono font-bold text-xs">
            {part1}
          </text>

          {/* Part 2 Circle (Bottom Right) */}
          <circle cx="75" cy="60" r="12" fill="#e0e7ff" stroke="#4338ca" strokeWidth="1.5" />
          <text x="75" y="64" textAnchor="middle" fill="#312e81" className="font-mono font-bold text-xs">
            {mode === "student" ? "?" : part2}
          </text>
        </svg>
      </div>

      <div className="text-[8px] text-center font-mono text-slate-500 font-semibold">
        {part1} + {mode === "student" ? "?" : part2} = {whole}
      </div>
    </div>
  );
};

/**
 * 23. Bar Model (Singapore Math Part-Part-Whole & Comparison)
 */
export const BarModelRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const partA = parseMathNumber(data.partA ?? 65);
  const partB = parseMathNumber(data.partB ?? 35);
  const total = partA + partB;
  const labelA = data.labelA || "Boys";
  const labelB = data.labelB || "Girls";

  const totalWidth = partA + partB;
  const widthAPct = (partA / totalWidth) * 100;
  const widthBPct = (partB / totalWidth) * 100;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 mb-1">
        <span>Bar Model (Part-Whole)</span>
        <span className="font-mono text-xs font-bold text-slate-800">Total: {mode === "student" ? "?" : total}</span>
      </div>

      {/* Segmented Bar */}
      <div className="w-full h-10 rounded-lg border-2 border-indigo-700 overflow-hidden flex shadow-xs my-2">
        <div
          style={{ width: `${widthAPct}%` }}
          className="h-full bg-indigo-600 text-white font-mono font-bold text-xs flex flex-col items-center justify-center border-r border-white/40"
        >
          <span>{partA}</span>
          <span className="text-[7.5px] opacity-80">{labelA}</span>
        </div>
        <div
          style={{ width: `${widthBPct}%` }}
          className="h-full bg-indigo-400 text-white font-mono font-bold text-xs flex flex-col items-center justify-center"
        >
          <span>{partB}</span>
          <span className="text-[7.5px] opacity-80">{labelB}</span>
        </div>
      </div>

      <div className="text-[8px] text-center font-mono text-slate-500">
        {labelA} ({partA}) + {labelB} ({partB}) = {mode === "student" ? "____" : total}
      </div>
    </div>
  );
};

/**
 * 23. Number Pyramid (Bricks Model)
 */
export const NumberPyramidRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const b1 = parseMathNumber(data.b1 ?? 3);
  const b2 = parseMathNumber(data.b2 ?? 5);
  const b3 = parseMathNumber(data.b3 ?? 2);

  const m1 = b1 + b2;
  const m2 = b2 + b3;
  const top = m1 + m2;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="text-[10px] font-bold text-amber-600 mb-1 text-center">
        Number Pyramid (Add adjacent bricks)
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1 font-mono text-xs font-bold">
        {/* Top Brick */}
        <div className="w-14 h-7 rounded border-2 border-amber-600 bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs">
          {mode === "student" ? "?" : top}
        </div>
        {/* Middle 2 Bricks */}
        <div className="flex gap-1">
          <div className="w-14 h-7 rounded border-2 border-amber-500 bg-amber-50 text-amber-800 flex items-center justify-center">
            {m1}
          </div>
          <div className="w-14 h-7 rounded border-2 border-amber-500 bg-amber-50 text-amber-800 flex items-center justify-center">
            {mode === "student" ? "?" : m2}
          </div>
        </div>
        {/* Bottom 3 Bricks */}
        <div className="flex gap-1">
          <div className="w-14 h-7 rounded border border-slate-300 bg-slate-100 text-slate-800 flex items-center justify-center">
            {b1}
          </div>
          <div className="w-14 h-7 rounded border border-slate-300 bg-slate-100 text-slate-800 flex items-center justify-center">
            {b2}
          </div>
          <div className="w-14 h-7 rounded border border-slate-300 bg-slate-100 text-slate-800 flex items-center justify-center">
            {b3}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 21. Worked Example System
 * Step-by-step Problem -> Understand -> Method -> Working -> Answer -> Tip
 */
export const WorkedExampleRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const exampleNumber = data.exampleNumber || 4;
  const problem = data.problem || "Find the sum of 38,426 and 17,893.";
  const method = data.method || "Standard Column Algorithm";
  const answer = data.answer || "56,319";
  const tip = data.tip || "Remember to add the carried-over digit to the next column.";

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-slate-900 dark:to-slate-950 select-none shadow-sm">
      {/* Example Banner */}
      <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100 dark:border-indigo-900/60 mb-2">
        <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] tracking-wide uppercase">
          Worked Example {exampleNumber}
        </span>
        <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">
          Method: {method}
        </span>
      </div>

      {/* Problem Statement */}
      <div className="mb-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
          {problem}
        </p>
      </div>

      {/* Step-by-Step Working Area */}
      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-2 flex items-center justify-between">
        <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
          <div className="text-[9px] text-slate-400 font-bold mb-0.5">WORKING:</div>
          <div>  38,426</div>
          <div>+ 17,893</div>
          <div className="border-t border-slate-400 font-bold text-indigo-600 dark:text-indigo-400">= {answer}</div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">ANSWER:</span>
          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300">
            {answer}
          </span>
        </div>
      </div>

      {/* Pedagogical Math Tip */}
      {tip && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-900 dark:text-amber-200 text-[9px]">
          <span>💡</span>
          <span className="font-semibold">{tip}</span>
        </div>
      )}
    </div>
  );
};

/**
 * 22. Word Problem Builder
 */
export const WordProblemRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const story = data.story || "A fruit seller had 450 apples. He sold 285 apples during the day. How many apples are left with him?";
  const operation = data.operation || "Subtraction (450 - 285)";
  const answer = data.answer || "165 apples";

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-amber-600">
        <span>📖</span>
        <span>Word Problem</span>
      </div>

      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed mb-2 font-medium">
        {story}
      </p>

      {/* Solution breakdown box */}
      <div className="grid grid-cols-2 gap-2 text-[9px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200">
        <div>
          <span className="text-slate-400 block font-bold">Operation:</span>
          <span className="font-mono font-bold text-slate-700">{operation}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-bold">Final Answer:</span>
          <span className="font-mono font-bold text-indigo-600">
            {mode === "student" ? "________" : answer}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 20. Distinct Math Activity Templates (Math Lab, Think & Solve, Speed Maths)
 */
export const MathActivityCardRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const activityKind = data.kind || "math-lab"; // "math-lab" | "think-solve" | "speed-maths" | "puzzle-zone"
  const title = data.title || "Math Lab Activity";
  const instructions = data.instructions || "Use paper cut-outs of circles to discover fraction equivalence.";

  const configMap: Record<string, { badge: string; color: string; icon: string }> = {
    "math-lab": { badge: "MATH LAB", color: "from-amber-500 to-orange-500", icon: "🔬" },
    "think-solve": { badge: "THINK & SOLVE", color: "from-indigo-500 to-purple-500", icon: "🧠" },
    "speed-maths": { badge: "SPEED MATHS", color: "from-rose-500 to-pink-500", icon: "⚡" },
    "puzzle-zone": { badge: "PUZZLE ZONE", color: "from-teal-500 to-emerald-500", icon: "🧩" },
  };

  const current = configMap[activityKind] || configMap["math-lab"];

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none shadow-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`px-2 py-0.5 rounded text-white font-bold text-[9px] uppercase tracking-wider bg-gradient-to-r ${current.color}`}>
          {current.icon} {current.badge}
        </div>
        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
          {title}
        </span>
      </div>

      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 text-[10px] text-slate-700 dark:text-slate-300 leading-normal flex-1 flex items-center">
        {instructions}
      </div>
    </div>
  );
};
