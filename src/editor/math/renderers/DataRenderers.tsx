// ============================================================================
// NEX MAXX BOOK STUDIO - DATA HANDLING RENDERERS
// Tally Charts, Pictographs, and Data-Driven Bar Graphs
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { getTallyMarks } from "../mathAlgorithms";

/**
 * 17. Tally Chart & Frequency Table
 */
export const TallyChartRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const items: Array<{ label: string; count: number }> = data.items || [
    { label: "Red", count: 8 },
    { label: "Blue", count: 12 },
    { label: "Green", count: 5 },
    { label: "Yellow", count: 7 },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none font-mono text-xs">
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200 dark:border-slate-700">
        <span className="font-bold text-[10px] text-cyan-600 dark:text-cyan-400">
          Tally Marks Chart
        </span>
        <span className="text-[8px] text-slate-400">DATA HANDLING</span>
      </div>

      <div className="flex-1 flex flex-col justify-around">
        <div className="flex justify-between font-bold text-[9px] text-slate-400 border-b border-slate-100 pb-0.5">
          <span className="w-20">Category</span>
          <span className="flex-1 text-center">Tally Marks</span>
          <span className="w-12 text-right">Frequency</span>
        </div>
        {items.map((it, idx) => {
          const { fullFives, remainder } = getTallyMarks(it.count);
          return (
            <div key={idx} className="flex items-center justify-between py-1 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
              <span className="w-20 font-bold text-slate-700 dark:text-slate-300 truncate">
                {it.label}
              </span>
              {/* Tally gates */}
              <div className="flex-1 flex items-center justify-center gap-1.5 text-indigo-600">
                {Array.from({ length: fullFives }).map((_, fIdx) => (
                  <span key={fIdx} className="tracking-tight text-xs font-serif font-extrabold select-none">
                    卌
                  </span>
                ))}
                {remainder > 0 && (
                  <span className="text-xs font-serif font-extrabold select-none">
                    {"|".repeat(remainder)}
                  </span>
                )}
              </div>
              <span className="w-12 text-right font-bold text-slate-900 dark:text-white">
                {mode === "student" ? "__" : it.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 17. Pictograph (Picture Graph)
 */
export const PictographRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const icon = data.icon || "⭐";
  const scale = data.scale || 2;
  const items: Array<{ label: string; count: number }> = data.items || [
    { label: "Class 1", count: 6 },
    { label: "Class 2", count: 8 },
    { label: "Class 3", count: 4 },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200 dark:border-slate-700">
        <span className="font-bold text-[10px] text-cyan-600">Pictograph</span>
        <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 text-[8px] font-bold border border-cyan-200">
          Key: Each {icon} = {scale} items
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-around py-1">
        {items.map((it, idx) => {
          const iconsCount = Math.floor(it.count / scale);
          return (
            <div key={idx} className="flex items-center justify-between py-1 border-b last:border-b-0 border-slate-100">
              <span className="w-16 font-semibold text-xs text-slate-700 dark:text-slate-300 truncate">
                {it.label}
              </span>
              <div className="flex-1 flex items-center gap-1 pl-2">
                {Array.from({ length: iconsCount }).map((_, i) => (
                  <span key={i} className="text-sm">
                    {icon}
                  </span>
                ))}
              </div>
              <span className="w-8 text-right font-mono font-bold text-xs text-slate-800">
                {mode === "student" ? "?" : it.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 17. Data-Driven Vertical Bar Graph
 */
export const BarGraphRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const items: Array<{ label: string; value: number }> = data.items || [
    { label: "Mon", value: 12 },
    { label: "Tue", value: 18 },
    { label: "Wed", value: 15 },
    { label: "Thu", value: 24 },
    { label: "Fri", value: 20 },
  ];

  const maxVal = Math.max(10, ...items.map((it) => it.value));
  const roundedMax = Math.ceil(maxVal / 5) * 5;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
        <span className="font-bold text-[10px] text-cyan-600">Bar Graph</span>
        <span className="text-[8px] font-mono text-slate-400">Scale: 0 to {roundedMax}</span>
      </div>

      <div className="flex-1 w-full flex items-end justify-around gap-2 pt-4 pb-2 border-b-2 border-slate-800 dark:border-slate-200">
        {items.map((it, idx) => {
          const heightPercent = (it.value / roundedMax) * 100;
          return (
            <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end">
              <span className="text-[8px] font-mono font-bold text-slate-500 mb-1">
                {mode === "student" ? "" : it.value}
              </span>
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[28px] rounded-t-sm bg-gradient-to-t from-cyan-600 to-cyan-400 border border-cyan-700 shadow-xs transition-all duration-300"
              />
              <span className="text-[8px] font-bold text-slate-600 mt-1 truncate max-w-full">
                {it.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
