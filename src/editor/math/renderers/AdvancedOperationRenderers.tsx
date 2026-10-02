// ============================================================================
// NEX MAXX BOOK STUDIO - ADVANCED ARITHMETIC & OPERATION RENDERERS
// Multiplication Wheels, Lattice Multiplication, Repeated Addition Groups, Equal Sharing
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { parseMathNumber } from "../mathAlgorithms";

/**
 * 09. Multiplication Wheel
 * Center core factor, inner ring multipliers (1 to 12), outer ring products
 */
export const MultiplicationWheelRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const baseFactor = parseMathNumber(data.factor ?? 7);
  const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const angleStep = 360 / steps.length;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-coral-600 dark:text-coral-400 mb-0.5">
        <span className="text-rose-600 font-semibold">Multiplication Wheel (Table of {baseFactor})</span>
        <span className="text-[8px] font-mono text-slate-400">× WHEEL</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-1">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Outer circle */}
          <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          {/* Middle circle */}
          <circle cx="50" cy="50" r="30" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />

          {/* Spokes & Slices */}
          {steps.map((multiplier, idx) => {
            const angleDeg = idx * angleStep - 90;
            const rad = (angleDeg * Math.PI) / 180;
            const spokeX = 50 + 46 * Math.cos(rad);
            const spokeY = 50 + 46 * Math.sin(rad);

            // Text positions
            const midRad = ((angleDeg + angleStep / 2) * Math.PI) / 180;
            const inX = 50 + 22 * Math.cos(midRad);
            const inY = 50 + 22 * Math.sin(midRad) + 2.5;

            const outX = 50 + 38 * Math.cos(midRad);
            const outY = 50 + 38 * Math.sin(midRad) + 2.5;

            const product = baseFactor * multiplier;
            const isBlank = mode === "student" && multiplier % 3 === 0;

            return (
              <g key={multiplier}>
                <line x1="50" y1="50" x2={spokeX} y2={spokeY} stroke="#e2e8f0" strokeWidth="0.8" />
                {/* Multiplier in middle ring */}
                <text x={inX} y={inY} textAnchor="middle" className="text-[6.5px] font-bold font-mono fill-slate-700">
                  {multiplier}
                </text>
                {/* Product in outer ring */}
                <text
                  x={outX}
                  y={outY}
                  textAnchor="middle"
                  className={`text-[6.5px] font-bold font-mono ${
                    isBlank ? "fill-rose-500 font-extrabold" : "fill-indigo-600 dark:fill-indigo-400"
                  }`}
                >
                  {isBlank ? "?" : product}
                </text>
              </g>
            );
          })}

          {/* Center Hub */}
          <circle cx="50" cy="50" r="14" fill="#4f46e5" stroke="#3730a3" strokeWidth="1.5" />
          <text x="50" y="53" textAnchor="middle" fill="#ffffff" className="font-mono font-bold text-xs">
            {baseFactor}
          </text>
        </svg>
      </div>

      <div className="text-[8px] text-center text-slate-400 font-mono">
        Multiply center number by middle ring to fill outer ring
      </div>
    </div>
  );
};

/**
 * 09. Equal Groups (Repeated Addition)
 * Visual grouping of counters (e.g. 4 groups of 3 objects)
 */
export const RepeatedAdditionMultiplicationRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const groups = Math.min(6, Math.max(2, parseMathNumber(data.groups ?? 4)));
  const itemsPerGroup = Math.min(8, Math.max(1, parseMathNumber(data.itemsPerGroup ?? 3)));
  const icon = data.icon || "🍎";
  const total = groups * itemsPerGroup;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Equal Groups (Repeated Addition)</span>
        <span className="font-mono text-rose-600 font-bold">{groups} groups of {itemsPerGroup}</span>
      </div>

      {/* Visual Groups / Bowls */}
      <div className="flex-1 flex flex-wrap items-center justify-around gap-2 py-1">
        {Array.from({ length: groups }).map((_, gIdx) => (
          <div
            key={gIdx}
            className="p-1.5 rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-center gap-1 shadow-2xs"
          >
            {Array.from({ length: itemsPerGroup }).map((_, iIdx) => (
              <span key={iIdx} className="text-sm select-none">
                {icon}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Mathematical Sentences */}
      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-0.5 text-center font-mono text-xs">
        <div className="text-slate-600 dark:text-slate-400">
          {Array(groups).fill(itemsPerGroup).join(" + ")} = {total}
        </div>
        <div className="font-bold text-indigo-600 dark:text-indigo-400">
          {groups} × {itemsPerGroup} = {mode === "student" ? "____" : total}
        </div>
      </div>
    </div>
  );
};

/**
 * 10. Equal Sharing / Grouping Division Model
 */
export const EqualSharingDivisionRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const totalItems = Math.min(24, Math.max(4, parseMathNumber(data.totalItems ?? 12)));
  const groupsCount = Math.min(6, Math.max(2, parseMathNumber(data.groupsCount ?? 3)));
  const quotient = Math.floor(totalItems / groupsCount);
  const remainder = totalItems % groupsCount;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Equal Sharing (Division)</span>
        <span className="font-mono text-indigo-600 font-bold">{totalItems} ÷ {groupsCount}</span>
      </div>

      {/* Partitioned Groups */}
      <div className="flex-1 flex items-center justify-around gap-2 py-1">
        {Array.from({ length: groupsCount }).map((_, gIdx) => (
          <div
            key={gIdx}
            className="flex-1 h-14 rounded-xl border-2 border-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col items-center justify-around p-1 shadow-2xs"
          >
            <span className="text-[8px] font-bold text-indigo-600">Child {gIdx + 1}</span>
            <div className="flex flex-wrap gap-1 justify-center">
              {Array.from({ length: quotient }).map((_, cIdx) => (
                <div key={cIdx} className="w-3 h-3 rounded-full bg-indigo-600" />
              ))}
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {mode === "student" ? "?" : quotient}
            </span>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
        Each child gets {mode === "student" ? "__" : quotient} items {remainder > 0 ? `(${remainder} left over)` : ""}
      </div>
    </div>
  );
};
