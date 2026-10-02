/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - MATHEMATICAL ABACUS ENGINE
// Production-quality vector abacus supporting configurable rods and interactive bead counts
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import { getAbacusRods, formatIndianNumber } from "../mathAlgorithms";

export const AbacusRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
  styleVariant,
  width,
  height,
  onUpdateData,
}) => {
  const num = data.number ?? 98765;
  const rodKeys: string[] = data.rods || ["TTh", "Th", "H", "T", "O"];
  const showLabels = data.showLabels !== false;
  const showValues = data.showValues !== false;

  const rods = getAbacusRods(num, rodKeys);
  const totalRods = rods.length;

  const isColorCoded = styleVariant === "color-coded";

  // SVG dimensions
  const svgWidth = Math.max(200, width);
  const svgHeight = Math.max(120, height - 35);

  const framePaddingX = 24;
  const framePaddingTop = 16;
  const framePaddingBottom = 28;
  const usableWidth = svgWidth - framePaddingX * 2;
  const rodSpacing = usableWidth / Math.max(1, totalRods);

  const beadHeight = 9;
  const beadWidth = Math.min(22, rodSpacing * 0.75);

  const handleBeadClick = (rodKey: string, newCount: number) => {
    if (!onUpdateData) return;
    // Recalculate number based on updated bead on rod
    const keyMap: Record<string, number> = {
      O: 1,
      T: 10,
      H: 100,
      Th: 1000,
      TTh: 10000,
      L: 100000,
      TL: 1000000,
      C: 10000000,
    };
    const currentRods = getAbacusRods(num, rodKeys);
    let newTotal = 0;
    currentRods.forEach((r) => {
      const p = keyMap[r.key] || 1;
      const cnt = r.key === rodKey ? newCount : r.beadCount;
      newTotal += cnt * p;
    });
    onUpdateData({ number: newTotal });
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      {/* Top Header info */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
          Abacus Model
        </span>
        {showValues && mode !== "student" && (
          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
            {formatIndianNumber(num)}
          </span>
        )}
      </div>

      {/* SVG Canvas for Abacus */}
      <div className="flex-1 w-full relative flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible pointer-events-auto"
        >
          <defs>
            <linearGradient id="abacus-frame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="bead-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Abacus Top Beam */}
          <rect
            x={framePaddingX - 10}
            y={framePaddingTop - 6}
            width={usableWidth + 20}
            height={8}
            rx={3}
            fill="url(#abacus-frame-grad)"
          />

          {/* Abacus Base Beam */}
          <rect
            x={framePaddingX - 12}
            y={svgHeight - framePaddingBottom + 2}
            width={usableWidth + 24}
            height={10}
            rx={4}
            fill="url(#abacus-frame-grad)"
          />

          {/* Rods and Beads */}
          {rods.map((rod, idx) => {
            const rodX = framePaddingX + idx * rodSpacing + rodSpacing / 2;
            const rodTopY = framePaddingTop;
            const rodBottomY = svgHeight - framePaddingBottom;

            const placeConfig = MATH_TOKENS.placeColors[rod.key] || {
              bead: "#4338ca",
              disc: "#6366f1",
              text: "#312e81",
            };
            const beadColor = isColorCoded ? placeConfig.bead : "#4338ca";

            const beadCount = mode === "student" && data.studentEmptyRods ? 0 : rod.beadCount;

            return (
              <g key={rod.key} className="cursor-pointer">
                {/* Vertical Metal Wire Rod */}
                <line
                  x1={rodX}
                  y1={rodTopY}
                  x2={rodX}
                  y2={rodBottomY}
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Beads stacked from bottom up */}
                {Array.from({ length: beadCount }).map((_, bIdx) => {
                  const beadY = rodBottomY - (bIdx + 1) * (beadHeight + 1.5);
                  return (
                    <g
                      key={bIdx}
                      onClick={() => handleBeadClick(rod.key, bIdx + 1)}
                    >
                      <title>{`Rod ${rod.key}: Bead ${bIdx + 1}`}</title>
                      <rect
                        x={rodX - beadWidth / 2}
                        y={beadY}
                        width={beadWidth}
                        height={beadHeight}
                        rx={beadHeight / 2}
                        fill={beadColor}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                        filter="url(#bead-shadow)"
                      />
                      {/* Highlight reflection */}
                      <ellipse
                        cx={rodX - beadWidth / 4}
                        cy={beadY + 2.5}
                        rx={beadWidth / 4}
                        ry={1.5}
                        fill="#ffffff"
                        opacity="0.45"
                      />
                    </g>
                  );
                })}

                {/* Place Label (O, T, H, Th, etc.) */}
                {showLabels && (
                  <text
                    x={rodX}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className="text-[9.5px] font-bold font-mono fill-slate-700 dark:fill-slate-300"
                  >
                    {rod.key}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Student answer boxes row if in student question mode */}
      {mode === "student" && (
        <div className="flex items-center justify-around pt-1 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[9px] font-semibold text-slate-500">Value:</span>
          <div className="flex gap-1">
            {rods.map((r, i) => (
              <div
                key={i}
                className="w-5 h-6 rounded border border-dashed border-indigo-400 bg-indigo-50/40 flex items-center justify-center font-mono text-[9px] text-slate-400"
              >
                _
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
