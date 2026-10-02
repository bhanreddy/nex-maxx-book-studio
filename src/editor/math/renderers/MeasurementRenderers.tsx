// ============================================================================
// NEX MAXX BOOK STUDIO - MEASUREMENT TOOLKIT RENDERERS
// Realistic vector Ruler, Balance Scale, Capacity Beakers, and Unit Conversions
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";

/**
 * 14. Vector Ruler with Exact Millimeter / Centimeter Markings
 */
export const RulerRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const measuredCm = data.lengthCm ?? 6.4;
  const maxCm = data.maxCm || 10;
  const objectName = data.objectName || "Pencil";

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 mb-1">
        <span>Measure the {objectName}</span>
        <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
          {mode === "student" ? "_____ cm" : `${measuredCm} cm`}
        </span>
      </div>

      <div className="flex-1 w-full relative flex flex-col justify-center">
        {/* Object to measure above the ruler */}
        <div className="relative w-full h-5 mb-1 px-4">
          <div
            style={{ width: `${(measuredCm / maxCm) * 100}%` }}
            className="h-full rounded-r-md bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-600 shadow-xs flex items-center justify-end pr-1 text-[8px] text-white font-bold"
          >
            ✏️
          </div>
        </div>

        {/* Ruler Body */}
        <div className="w-full h-10 rounded bg-[#fef3c7] dark:bg-[#78350f]/60 border-2 border-amber-500 relative flex overflow-hidden shadow-xs">
          {Array.from({ length: maxCm * 10 + 1 }).map((_, mm) => {
            const isCm = mm % 10 === 0;
            const isHalfCm = mm % 5 === 0 && !isCm;
            const leftPercent = (mm / (maxCm * 10)) * 100;

            return (
              <div
                key={mm}
                style={{ left: `${leftPercent}%` }}
                className="absolute top-0 flex flex-col items-center pointer-events-none"
              >
                <div
                  className={`w-0.5 ${
                    isCm
                      ? "h-4 bg-amber-900 dark:bg-amber-100"
                      : isHalfCm
                      ? "h-2.5 bg-amber-800 dark:bg-amber-200"
                      : "h-1.5 bg-amber-700/60 dark:bg-amber-300/60"
                  }`}
                />
                {isCm && (
                  <span className="text-[7.5px] font-mono font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                    {mm / 10}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[8px] text-slate-500 font-mono text-center">
        cm & mm Calibration Scale
      </div>
    </div>
  );
};

/**
 * 14. Balance Scale (Pan Balance)
 */
export const BalanceScaleRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const leftWeight = data.leftWeight ?? "500 g";
  const rightWeight = data.rightWeight ?? "500 g";
  const state = data.state || "balanced"; // "balanced" | "left-heavy" | "right-heavy"

  const tiltAngle = state === "left-heavy" ? -10 : state === "right-heavy" ? 10 : 0;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 mb-0.5">
        <span>Balance Scale</span>
        <span className="text-[8px] font-mono text-slate-400 capitalize">{state}</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-1">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          {/* Base Stand */}
          <polygon points="44,75 56,75 52,40 48,40" fill="#78350f" />
          <rect x="35" y="75" width="30" height="5" rx="2" fill="#451a03" />

          {/* Pivot Fulcrum */}
          <circle cx="50" cy="40" r="4" fill="#d97706" stroke="#451a03" strokeWidth="1" />

          {/* Tilted Balance Beam */}
          <g transform={`rotate(${tiltAngle} 50 40)`}>
            <rect x="10" y="38" width="80" height="4" rx="2" fill="#d97706" />

            {/* Left Pan Strings & Pan */}
            <line x1="18" y1="42" x2="10" y2="60" stroke="#92400e" strokeWidth="1" />
            <line x1="18" y1="42" x2="26" y2="60" stroke="#92400e" strokeWidth="1" />
            <path d="M 6 60 Q 18 68 30 60 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <text x="18" y="56" textAnchor="middle" className="text-[6.5px] font-bold font-mono fill-white">
              {leftWeight}
            </text>

            {/* Right Pan Strings & Pan */}
            <line x1="82" y1="42" x2="74" y2="60" stroke="#92400e" strokeWidth="1" />
            <line x1="82" y1="42" x2="90" y2="60" stroke="#92400e" strokeWidth="1" />
            <path d="M 70 60 Q 82 68 94 60 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
            <text x="82" y="56" textAnchor="middle" className="text-[6.5px] font-bold font-mono fill-white">
              {mode === "student" ? "?" : rightWeight}
            </text>
          </g>
        </svg>
      </div>

      <div className="text-[8px] text-center text-slate-500 font-medium">
        Mass Comparison Model
      </div>
    </div>
  );
};

/**
 * 14. Graduated Beaker / Capacity Cylinder
 */
export const CapacityBeakerRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const currentMl = data.volumeMl ?? 350;
  const maxMl = data.maxMl || 500;
  const percentage = Math.min(100, (currentMl / maxMl) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 mb-0.5">
        <span>Capacity Cylinder</span>
        <span className="font-mono text-xs font-bold text-amber-700">
          {mode === "student" ? "___ ml" : `${currentMl} ml`}
        </span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-1">
        <div className="w-16 h-28 rounded-b-xl border-2 border-slate-400 bg-slate-50 dark:bg-slate-800 relative overflow-hidden shadow-xs flex flex-col justify-end">
          {/* Liquid fill */}
          <div
            style={{ height: `${percentage}%` }}
            className="w-full bg-gradient-to-t from-sky-500 to-sky-400/80 border-t-2 border-sky-600 transition-all duration-300"
          />
          {/* Graduation lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
            {[500, 400, 300, 200, 100].map((mark) => (
              <div key={mark} className="flex items-center justify-between px-1">
                <div className="w-2.5 h-0.5 bg-slate-500" />
                <span className="text-[6.5px] font-mono text-slate-500 font-bold">{mark}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[8px] text-center text-slate-500 font-mono">
        Millilitres (ml) & Litres (L)
      </div>
    </div>
  );
};
