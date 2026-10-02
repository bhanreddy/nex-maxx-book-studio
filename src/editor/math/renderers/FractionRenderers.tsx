// ============================================================================
// NEX MAXX BOOK STUDIO - FRACTION TOOLKIT RENDERERS
// Vector-accurate fraction circles, bars, walls, grids, and equivalent fraction models
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { getPieSlicePath, parseMathNumber } from "../mathAlgorithms";

/**
 * 11. Fraction Circle (Pie Model)
 * Exact N equal slices with K shaded
 */
export const FractionCircleRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const numerator = Math.max(0, parseMathNumber(data.numerator ?? 3));
  const denominator = Math.max(1, parseMathNumber(data.denominator ?? 8));
  const showFractionText = data.showFractionText !== false;

  const cx = 50;
  const cy = 50;
  const r = 40;

  const sliceAngle = 360 / denominator;
  const shadedCount = Math.min(numerator, denominator);

  return (
    <div className="w-full h-full flex items-center justify-around p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* SVG Pie Circle */}
      <div className="w-32 h-32 relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Base background circle */}
          <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Slices */}
          {Array.from({ length: denominator }).map((_, idx) => {
            const startAngle = idx * sliceAngle;
            const endAngle = (idx + 1) * sliceAngle;
            const isShaded = idx < shadedCount;

            const path = getPieSlicePath(cx, cy, r, startAngle, endAngle);
            return (
              <path
                key={idx}
                d={path}
                fill={isShaded ? "#8b5cf6" : "#f8fafc"}
                stroke="#6d28d9"
                strokeWidth="1.2"
                className="transition-colors"
              />
            );
          })}
        </svg>
      </div>

      {/* Fraction Symbol & Legend */}
      {showFractionText && (
        <div className="flex flex-col items-center justify-center font-mono">
          {mode === "student" ? (
            <div className="flex flex-col items-center">
              <span className="w-8 h-7 border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded flex items-center justify-center text-xs font-bold text-indigo-500">
                ?
              </span>
              <div className="w-10 h-0.5 bg-slate-800 dark:bg-slate-200 my-1" />
              <span className="w-8 h-7 border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded flex items-center justify-center text-xs font-bold text-indigo-500">
                ?
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-900 dark:text-white font-bold">
              <span className="text-xl leading-none text-purple-600 dark:text-purple-400">{numerator}</span>
              <div className="w-9 h-0.5 bg-slate-800 dark:bg-slate-200 my-1" />
              <span className="text-xl leading-none">{denominator}</span>
            </div>
          )}
          <span className="text-[9px] text-slate-500 mt-2 font-sans font-medium text-center">
            {numerator} of {denominator} parts
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * 11. Fraction Bar (Strip Model)
 */
export const FractionBarRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const numerator = Math.max(0, parseMathNumber(data.numerator ?? 3));
  const denominator = Math.max(1, parseMathNumber(data.denominator ?? 5));

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Fraction Bar Model</span>
        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
          {mode === "student" ? "? / ?" : `${numerator} / ${denominator}`}
        </span>
      </div>

      <div className="w-full h-12 rounded-lg border-2 border-purple-600 overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-sm my-1">
        {Array.from({ length: denominator }).map((_, idx) => {
          const isShaded = idx < numerator;
          return (
            <div
              key={idx}
              className={`flex-1 h-full border-r last:border-r-0 border-purple-400 flex items-center justify-center text-xs font-mono font-bold ${
                isShaded
                  ? "bg-purple-600 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-400"
              }`}
            >
              1/{denominator}
            </div>
          );
        })}
      </div>

      <div className="text-[9px] text-slate-500 font-medium text-center">
        Shaded: {numerator}/{denominator} • Unshaded: {Math.max(0, denominator - numerator)}/{denominator}
      </div>
    </div>
  );
};

/**
 * 11. Fraction Wall (Equivalence Strips)
 */
export const FractionWallRenderer: React.FC<MathRendererProps> = () => {
  const rows = [
    { denom: 1, label: "1 Whole", color: "bg-indigo-600 text-white" },
    { denom: 2, label: "1/2", color: "bg-blue-500 text-white" },
    { denom: 3, label: "1/3", color: "bg-teal-500 text-white" },
    { denom: 4, label: "1/4", color: "bg-emerald-500 text-white" },
    { denom: 6, label: "1/6", color: "bg-amber-500 text-white" },
    { denom: 8, label: "1/8", color: "bg-rose-500 text-white" },
    { denom: 12, label: "1/12", color: "bg-purple-500 text-white" },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Fraction Wall (Equivalent Strips)</span>
        <span className="text-[8px] font-mono text-indigo-500">1 to 1/12</span>
      </div>

      <div className="flex-1 flex flex-col gap-0.5 justify-around">
        {rows.map((r, rIdx) => (
          <div key={rIdx} className="w-full h-4 rounded-xs overflow-hidden flex border border-white/20">
            {Array.from({ length: r.denom }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={`flex-1 h-full flex items-center justify-center font-mono font-bold text-[7.5px] border-r last:border-r-0 border-white/30 ${r.color}`}
              >
                {r.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 11. Equivalent Fractions Model
 */
export const EquivalentFractionsRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const baseNum = parseMathNumber(data.num ?? 1);
  const baseDenom = parseMathNumber(data.denom ?? 2);

  const multiples = [1, 2, 4];

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="text-[10px] font-bold text-slate-500 mb-1">
        Equivalent Fractions Visualizer
      </div>
      <div className="flex-1 flex flex-col justify-around gap-1.5">
        {multiples.map((m, idx) => {
          const num = baseNum * m;
          const denom = baseDenom * m;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-10 font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                {num}/{denom}
              </span>
              <div className="flex-1 h-5 rounded border border-purple-500 overflow-hidden flex">
                {Array.from({ length: denom }).map((_, c) => (
                  <div
                    key={c}
                    className={`flex-1 h-full border-r last:border-r-0 border-purple-300 ${
                      c < num ? "bg-purple-600" : "bg-white dark:bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
