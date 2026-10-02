// ============================================================================
// NEX MAXX BOOK STUDIO - NUMBER LINE ENGINE
// Fully vector-based parametric number lines with jump arcs, fractions, and missing points
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { parseMathNumber, formatIndianNumber } from "../mathAlgorithms";

export const NumberLineRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
  styleVariant,
  width,
  height,
}) => {
  const start = parseMathNumber(data.start ?? 0);
  const end = parseMathNumber(data.end ?? 10);
  const step = Math.max(1, parseMathNumber(data.step ?? 1));
  const subType = data.subType || "basic"; // "basic" | "jump" | "missing" | "fraction" | "decimal"
  const jumps: Array<{ from: number; to: number; label?: string }> = data.jumps || [];
  const highlightedPoints: number[] = data.highlightedPoints || [];
  const missingPoints: number[] = data.missingPoints || [];

  const totalRange = Math.max(1, end - start);
  const ticksCount = Math.floor(totalRange / step);

  // SVG coordinates
  const svgWidth = Math.max(220, width);
  const svgHeight = Math.max(90, height);

  const paddingX = 26;
  const lineY = jumps.length > 0 ? svgHeight * 0.65 : svgHeight * 0.52;
  const usableWidth = svgWidth - paddingX * 2;

  const getXForValue = (val: number) => {
    const fraction = (val - start) / totalRange;
    return paddingX + Math.min(1, Math.max(0, fraction)) * usableWidth;
  };

  const isColorCoded = styleVariant === "color-coded";

  return (
    <div className="w-full h-full flex flex-col justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      {data.title && (
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1 px-2">
          <span>{data.title}</span>
          <span className="font-mono text-[9px] text-indigo-500">{start} → {end}</span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible pointer-events-none"
      >
        <defs>
          <marker
            id="numline-arrow-left"
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 10 1 L 2 5 L 10 9 z" fill="#475569" />
          </marker>
          <marker
            id="numline-arrow-right"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569" />
          </marker>
        </defs>

        {/* Jump Arcs (if any, e.g. for Addition/Multiplication Jumps) */}
        {jumps.map((jump, jIdx) => {
          const x1 = getXForValue(jump.from);
          const x2 = getXForValue(jump.to);
          const midX = (x1 + x2) / 2;
          const arcHeight = Math.min(32, Math.abs(x2 - x1) * 0.4);
          const arcTopY = lineY - arcHeight;

          return (
            <g key={jIdx}>
              <path
                d={`M ${x1} ${lineY - 4} Q ${midX} ${arcTopY} ${x2} ${lineY - 4}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray={subType === "missing" ? "3,3" : undefined}
                markerEnd="url(#numline-arrow-right)"
              />
              {jump.label && (
                <text
                  x={midX}
                  y={arcTopY - 4}
                  textAnchor="middle"
                  className="text-[9px] font-bold font-mono fill-indigo-600 dark:fill-indigo-400"
                >
                  {jump.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Main Horizontal Number Line with Arrows */}
        <line
          x1={paddingX - 10}
          y1={lineY}
          x2={svgWidth - paddingX + 10}
          y2={lineY}
          stroke={isColorCoded ? "#4f46e5" : "#475569"}
          strokeWidth="2.5"
          strokeLinecap="round"
          markerStart="url(#numline-arrow-left)"
          markerEnd="url(#numline-arrow-right)"
        />

        {/* Tick Marks and Labels */}
        {Array.from({ length: ticksCount + 1 }).map((_, i) => {
          const val = start + i * step;
          const tickX = getXForValue(val);
          const isHighlighted = highlightedPoints.includes(val);
          const isMissing = mode === "student" && (missingPoints.includes(val) || (data.autoMissing && i % 3 === 1));

          return (
            <g key={i}>
              {/* Tick line */}
              <line
                x1={tickX}
                y1={lineY - 6}
                x2={tickX}
                y2={lineY + 6}
                stroke={isHighlighted ? "#4f46e5" : "#64748b"}
                strokeWidth={isHighlighted ? "2.5" : "1.8"}
              />

              {/* Point dot if highlighted */}
              {isHighlighted && (
                <circle cx={tickX} cy={lineY} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
              )}

              {/* Number Label */}
              {isMissing ? (
                <rect
                  x={tickX - 7}
                  y={lineY + 9}
                  width="14"
                  height="14"
                  rx="3"
                  fill="#f1f5f9"
                  stroke="#818cf8"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              ) : (
                <text
                  x={tickX}
                  y={lineY + 18}
                  textAnchor="middle"
                  className={`text-[9px] font-mono font-bold ${
                    isHighlighted
                      ? "fill-indigo-600 dark:fill-indigo-400 font-extrabold"
                      : "fill-slate-700 dark:fill-slate-300"
                  }`}
                >
                  {subType === "fraction" ? `${val}/${data.denominator || 4}` : formatIndianNumber(val)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
