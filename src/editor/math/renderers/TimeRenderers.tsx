// ============================================================================
// NEX MAXX BOOK STUDIO - TIME & ANALOGUE CLOCK RENDERERS
// Vector analogue clocks, hand rotations, elapsed time, and duration
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { getClockHandAngles, parseMathNumber } from "../mathAlgorithms";

export const AnalogueClockRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const hours = parseMathNumber(data.hours ?? 3);
  const minutes = parseMathNumber(data.minutes ?? 15);
  const showHands = data.showHands !== false && mode !== "student";
  const showMinuteTicks = data.showMinuteTicks !== false;

  const { hourAngle, minuteAngle } = getClockHandAngles(hours, minutes);

  const formattedTime = `${String(hours || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return (
    <div className="w-full h-full flex items-center justify-around p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* SVG Clock Face */}
      <div className="w-28 h-28 relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Outer dial */}
          <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="43" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

          {/* 12 Hour numbers */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
            const angleDeg = num * 30 - 90;
            const rad = (angleDeg * Math.PI) / 180;
            const x = 50 + 34 * Math.cos(rad);
            const y = 50 + 34 * Math.sin(rad) + 3;
            return (
              <text
                key={num}
                x={x}
                y={y}
                textAnchor="middle"
                className="text-[8px] font-bold font-mono fill-slate-800"
              >
                {num}
              </text>
            );
          })}

          {/* Minute ticks */}
          {showMinuteTicks &&
            Array.from({ length: 60 }).map((_, m) => {
              if (m % 5 === 0) return null;
              const angleDeg = m * 6 - 90;
              const rad = (angleDeg * Math.PI) / 180;
              const x1 = 50 + 40 * Math.cos(rad);
              const y1 = 50 + 40 * Math.sin(rad);
              const x2 = 50 + 42 * Math.cos(rad);
              const y2 = 50 + 42 * Math.sin(rad);
              return <line key={m} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="0.8" />;
            })}

          {/* Hands */}
          {showHands && (
            <>
              {/* Hour hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="28"
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 50 50)`}
              />
              {/* Minute hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="16"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} 50 50)`}
              />
            </>
          )}

          {/* Center Pivot Pin */}
          <circle cx="50" cy="50" r="3" fill="#0f172a" />
        </svg>
      </div>

      {/* Digital readout or student blank */}
      <div className="flex flex-col items-center justify-center font-mono">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
          {mode === "student" ? "Write the time:" : "Digital Time"}
        </span>
        {mode === "student" ? (
          <div className="px-3 py-1.5 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50/50 text-indigo-500 font-bold text-sm">
            __:__
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold text-sm shadow-xs">
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
};
