// ============================================================================
// NEX MAXX BOOK STUDIO - PATTERNS & MATCHING TEMPLATE ENGINE
// Reusable two-column matcher with connecting lines, pattern sequences & function machines
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";

/**
 * 18. Repeating & Growing Pattern Sequence
 */
export const PatternSequenceRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const sequence: string[] = data.sequence || ["🔺", "🔷", "🔺", "🔷", "🔺", "?"];
  const rule = data.rule || "AB Pattern";

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-purple-600 mb-1">
        <span>Pattern Sequence ({rule})</span>
        <span className="text-[8px] font-mono text-slate-400">PATTERNS</span>
      </div>

      <div className="flex-1 flex items-center justify-around gap-1.5 py-1">
        {sequence.map((item, idx) => {
          const isQuestion = item === "?" || (mode === "student" && idx === sequence.length - 1);
          return (
            <div
              key={idx}
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-xs border ${
                isQuestion
                  ? "border-2 border-dashed border-purple-400 bg-purple-50/50 text-purple-500 font-mono text-sm"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              }`}
            >
              {isQuestion ? "?" : item}
            </div>
          );
        })}
      </div>

      <div className="text-[8px] text-center text-slate-400 font-medium">
        Identify the repeating unit and find the next element
      </div>
    </div>
  );
};

/**
 * 18. Function Machine (Input-Output Machine)
 */
export const FunctionMachineRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const rule = data.rule || "× 3 + 1";
  const rows: Array<{ in: number; out: number }> = data.rows || [
    { in: 2, out: 7 },
    { in: 4, out: 13 },
    { in: 5, out: 16 },
    { in: 8, out: 25 },
  ];

  return (
    <div className="w-full h-full flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* Machine Box Graphic */}
      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-2 flex flex-col items-center justify-between text-white shadow-sm border border-purple-400">
        <span className="text-[8px] uppercase tracking-wider font-bold opacity-80">MACHINE</span>
        <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-xs text-center">
          <span className="text-[7.5px] block opacity-90 font-mono">RULE</span>
          <span className="text-xs font-bold font-mono">{rule}</span>
        </div>
        <span className="text-[7.5px] opacity-75 font-mono">IN ➔ OUT</span>
      </div>

      {/* Input - Output Table */}
      <div className="flex-1 flex flex-col font-mono text-xs">
        <div className="flex justify-between font-bold text-[9px] text-purple-600 border-b border-purple-200 pb-0.5 mb-1">
          <span className="w-12 text-center">IN (x)</span>
          <span className="w-14 text-center">OUT (y)</span>
        </div>
        {rows.map((r, idx) => (
          <div key={idx} className="flex justify-between py-1 border-b last:border-b-0 border-slate-100 text-slate-800 dark:text-slate-200">
            <span className="w-12 text-center font-bold">{r.in}</span>
            <span className="w-14 text-center font-bold text-indigo-600 dark:text-indigo-400">
              {mode === "student" && idx >= rows.length - 2 ? "?" : r.out}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 19. Matching Template Engine (Two-Column Matcher)
 * Solved vs Student Exercise with connection lines
 */
export const MatchingExerciseRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const pairs: Array<{ left: string; right: string; matchIndex: number }> = data.pairs || [
    { left: "5 × 4", right: "20", matchIndex: 0 },
    { left: "8 + 7", right: "15", matchIndex: 1 },
    { left: "36 ÷ 6", right: "6", matchIndex: 2 },
    { left: "100 - 45", right: "55", matchIndex: 3 },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1 pb-1 border-b border-slate-200">
        <span>Match the Following</span>
        <span className="text-[8px] font-mono text-indigo-500">
          {mode === "student" ? "Student Exercise" : "Answer Key"}
        </span>
      </div>

      <div className="flex-1 w-full relative flex justify-between items-center py-2 px-1">
        {/* Left Column */}
        <div className="flex flex-col gap-2 z-10 w-28">
          {pairs.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-950 font-bold text-xs shadow-xs"
            >
              <span>{p.left}</span>
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white" />
            </div>
          ))}
        </div>

        {/* Connecting SVG Lines (Shown when not student exercise mode) */}
        {mode !== "student" && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {pairs.map((p, idx) => {
              const y1 = 28 + idx * 34;
              const y2 = 28 + p.matchIndex * 34;
              return (
                <line
                  key={idx}
                  x1="120"
                  y1={y1}
                  x2="175"
                  y2={y2}
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />
              );
            })}
          </svg>
        )}

        {/* Right Column */}
        <div className="flex flex-col gap-2 z-10 w-28">
          {pairs.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold text-xs shadow-xs"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" />
              <span>{p.right}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
