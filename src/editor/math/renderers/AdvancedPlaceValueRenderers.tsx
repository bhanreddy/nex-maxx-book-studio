// ============================================================================
// NEX MAXX BOOK STUDIO - ADVANCED NUMBER SENSE & PLACE VALUE RENDERERS
// Digit -> Place -> Value diagrams, Place Value Houses, Digit Cards, Ascending/Descending, Odd/Even
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { getIndianPlaceValueBreakdown, formatIndianNumber, parseMathNumber } from "../mathAlgorithms";
import { MATH_TOKENS } from "../tokens";

/**
 * 08. Digit -> Place -> Value Diagram
 * Clean branching diagram showing: Digit, its Place Name, and actual Face vs Place Value
 */
export const DigitPlaceValueDiagramRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
  styleVariant,
}) => {
  const num = data.number ?? 74523;
  const cols = getIndianPlaceValueBreakdown(num);
  const isColorCoded = styleVariant === "color-coded";

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Digit ➔ Place ➔ Value Diagram</span>
        <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatIndianNumber(num)}</span>
      </div>

      <div className="flex-1 flex flex-col justify-around py-1">
        {cols.map((col, idx) => {
          const placeConfig = MATH_TOKENS.placeColors[col.key] || { text: "#4338ca", bg: "#e0e7ff" };
          const isBlank = mode === "student" && idx === Math.floor(cols.length / 2);

          return (
            <div key={idx} className="flex items-center gap-2 text-xs font-mono">
              {/* Digit Box */}
              <div
                style={{ backgroundColor: isColorCoded ? placeConfig.bg : undefined }}
                className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-slate-900 dark:text-white"
              >
                {col.digit}
              </div>

              {/* Connecting Arrow */}
              <span className="text-slate-400 font-sans text-xs">➔</span>

              {/* Place Name Badge */}
              <span className="w-24 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                {col.label}
              </span>

              <span className="text-slate-400 font-sans text-xs">➔</span>

              {/* Actual Computed Value */}
              <div className="flex-1">
                {isBlank ? (
                  <span className="px-2 py-0.5 rounded border-2 border-dashed border-indigo-400 bg-indigo-50/50 text-indigo-500 text-[10px]">
                    _____
                  </span>
                ) : (
                  <span
                    style={{ color: isColorCoded ? placeConfig.text : undefined }}
                    className="font-bold text-xs"
                  >
                    {formatIndianNumber(col.placeValue)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 15. Place Value Houses (Period Mansions)
 * Houses with roofs for Lakhs Period, Thousands Period, Ones Period
 */
export const PlaceValueHousesRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const num = data.number ?? 543261;
  const cols = getIndianPlaceValueBreakdown(num);

  // Group into periods: Lakhs, Thousands, Ones
  const periods = [
    { name: "Lakhs House", key: "lakhs", color: "border-purple-500 bg-purple-50/40 text-purple-700", roof: "#9333ea", cols: cols.filter((c) => c.period === "Lakhs") },
    { name: "Thousands House", key: "thousands", color: "border-blue-500 bg-blue-50/40 text-blue-700", roof: "#2563eb", cols: cols.filter((c) => c.period === "Thousands") },
    { name: "Ones House", key: "ones", color: "border-emerald-500 bg-emerald-50/40 text-emerald-700", roof: "#059669", cols: cols.filter((c) => c.period === "Ones") },
  ].filter((p) => p.cols.length > 0);

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Place Value Houses</span>
        <span className="font-mono text-indigo-600 font-bold">{formatIndianNumber(num)}</span>
      </div>

      <div className="flex-1 flex gap-2 items-end justify-center py-1">
        {periods.map((p) => (
          <div key={p.key} className="flex-1 flex flex-col items-center">
            {/* Triangular Roof Graphic */}
            <div className="w-full h-6 relative flex items-center justify-center">
              <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                <polygon points="50,2 98,28 2,28" fill={p.roof} />
              </svg>
              <span className="absolute bottom-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                {p.name.split(" ")[0]}
              </span>
            </div>

            {/* House Body */}
            <div className={`w-full border-2 ${p.color} rounded-b-lg p-1.5 flex gap-1 justify-around`}>
              {p.cols.map((c, cIdx) => (
                <div key={cIdx} className="flex-1 flex flex-col items-center bg-white dark:bg-slate-800 rounded p-1 shadow-2xs border border-slate-200 dark:border-slate-700">
                  <span className="text-[8px] font-bold text-slate-400 font-mono">{c.key}</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {mode === "student" && cIdx === 0 ? "?" : c.digit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 17 & 18 & 19 & 20. Digit Cards & Largest/Smallest Number Formation
 */
export const DigitCardsRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const digits: number[] = data.digits || [7, 2, 9, 4, 0];
  const challengeType = data.challenge || "largest"; // "largest" | "smallest" | "rearrange"

  const sortedAsc = [...digits].sort((a, b) => a - b);
  const sortedDesc = [...digits].sort((a, b) => b - a);

  // If 0 is first in smallest, swap with next non-zero
  const smallestDigits = [...sortedAsc];
  if (smallestDigits[0] === 0 && smallestDigits.length > 1) {
    const firstNonZero = smallestDigits.findIndex((d) => d > 0);
    if (firstNonZero > 0) {
      smallestDigits[0] = smallestDigits[firstNonZero];
      smallestDigits[firstNonZero] = 0;
    }
  }

  const solution = challengeType === "largest" ? sortedDesc.join("") : smallestDigits.join("");

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 mb-1">
        <span>Digit Cards Challenge</span>
        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 capitalize">
          Make {challengeType} Number
        </span>
      </div>

      {/* Given Digit Cards */}
      <div className="flex items-center justify-center gap-2 py-1">
        {digits.map((d, idx) => (
          <div
            key={idx}
            className="w-9 h-11 rounded-lg border-2 border-indigo-400 bg-gradient-to-b from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-xs flex flex-col items-center justify-center font-mono font-bold text-lg text-indigo-900 dark:text-indigo-200"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Target Result Answer Box */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
        <span className="text-slate-500 font-medium capitalize text-[10px]">
          {challengeType} Number:
        </span>
        <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          {mode === "student" ? "_________" : formatIndianNumber(solution)}
        </div>
      </div>
    </div>
  );
};

/**
 * 24 & 25. Ascending / Descending Order Model
 */
export const AscendingDescendingRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const numbers: number[] = data.numbers || [4520, 1890, 7250, 3600];
  const order = data.order || "ascending"; // "ascending" | "descending"

  const sorted = [...numbers].sort((a, b) => (order === "ascending" ? a - b : b - a));

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span className="capitalize">{order} Order (Smallest to Largest)</span>
        <span className="text-[8px] font-mono text-indigo-500 uppercase">{order}</span>
      </div>

      {/* Train / Step Ladder Cards */}
      <div className="flex-1 flex items-center justify-around gap-1.5 py-1">
        {sorted.map((val, idx) => {
          const isBlank = mode === "student" && idx >= 2;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-400 font-bold">{order === "ascending" ? "<" : ">"}</span>}
              <div
                className={`flex-1 py-1.5 px-1 rounded-lg text-center font-mono font-bold text-xs border ${
                  isBlank
                    ? "border-2 border-dashed border-indigo-400 bg-indigo-50/50 text-indigo-500"
                    : "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                }`}
              >
                {isBlank ? "?" : formatIndianNumber(val)}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 28. Odd / Even Number Pairing Model
 * Visual representation with paired dots to show parity
 */
export const OddEvenModelRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const num = Math.min(24, Math.max(1, parseMathNumber(data.number ?? 11)));
  const isEven = num % 2 === 0;
  const pairsCount = Math.floor(num / 2);
  const hasRemainder = num % 2 !== 0;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Odd / Even Pairing Model</span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono text-white ${isEven ? "bg-emerald-600" : "bg-rose-500"}`}>
          {mode === "student" ? "Odd or Even?" : isEven ? "EVEN" : "ODD"}
        </span>
      </div>

      {/* 2-Row Pairing Grid */}
      <div className="flex-1 flex items-center justify-center gap-1.5 py-1">
        {Array.from({ length: pairsCount }).map((_, pIdx) => (
          <div key={pIdx} className="p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
          </div>
        ))}
        {hasRemainder && (
          <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 flex flex-col gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
            <div className="w-3.5 h-3.5 rounded-full border border-dashed border-rose-300" />
          </div>
        )}
      </div>

      <div className="text-[9px] text-center text-slate-500 font-mono">
        {num} = {pairsCount} pairs {hasRemainder ? "+ 1 leftover (Odd)" : "(All Paired - Even)"}
      </div>
    </div>
  );
};
