import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface FractionBarComparison {
  numerator: number;
  denominator: number;
  label?: string;
  color?: string;
}

export interface FractionBarProps {
  numerator?: number;
  denominator?: number;
  whole?: number;
  width?: number;
  height?: number;
  showLabels?: boolean;
  fillColor?: string;
  emptyColor?: string;
  comparisonBars?: FractionBarComparison[];
  showAnswer?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free FractionBar primitive.
 * Segmented rectangular bar representing proper, improper, mixed, and equivalent fractions.
 */
export const FractionBar: React.FC<FractionBarProps> = ({
  numerator = 3,
  denominator = 4,
  whole = 0,
  width = 280,
  height = 44,
  showLabels = true,
  fillColor = MATH_TOKENS.topics.fractions.main,
  emptyColor = "#ffffff",
  comparisonBars = [],
  showAnswer = true,
  className = "",
  style,
}) => {
  const safeDenom = Math.max(1, Math.min(32, denominator));
  const safeNum = Math.max(0, numerator);
  const safeWhole = Math.max(0, whole);

  const barWidth = Math.max(160, width);
  const barHeight = Math.max(30, height);

  // If there are multiple comparison bars (fraction wall style)
  const allBars = comparisonBars.length > 0
    ? comparisonBars
    : [{ numerator: safeNum, denominator: safeDenom, label: undefined, color: fillColor }];

  return (
    <div
      className={`inline-flex flex-col gap-3 select-none ${className}`}
      style={style}
    >
      {allBars.map((bar, barIdx) => {
        const d = Math.max(1, bar.denominator);
        const n = showAnswer ? Math.max(0, bar.numerator) : 0;
        const col = bar.color || fillColor;
        const segmentWidth = barWidth / d;

        return (
          <div key={`frac-bar-${barIdx}`} className="flex flex-col items-center gap-1">
            {/* Optional Top Label */}
            {showLabels && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {bar.label ? (
                  <span>{bar.label}</span>
                ) : (
                  <span className="font-mono">
                    {safeWhole > 0 ? `${safeWhole} ` : ""}{bar.numerator}/{d}
                  </span>
                )}
              </div>
            )}

            {/* SVG Segmented Bar */}
            <svg
              width={barWidth}
              height={barHeight}
              viewBox={`0 0 ${barWidth} ${barHeight}`}
              className="overflow-visible"
              role="img"
              aria-label={`Fraction bar showing ${n} out of ${d}`}
            >
              {/* Outer Border */}
              <rect
                x="1"
                y="1"
                width={barWidth - 2}
                height={barHeight - 2}
                rx="5"
                fill={emptyColor}
                stroke={MATH_TOKENS.print.ink}
                strokeWidth="2"
              />

              {/* Segments */}
              {Array.from({ length: d }).map((_, segIdx) => {
                const segX = segIdx * segmentWidth;
                const isFilled = segIdx < n;

                return (
                  <g key={`bar-${barIdx}-seg-${segIdx}`}>
                    {/* Fill */}
                    {isFilled && (
                      <rect
                        x={segX}
                        y="1"
                        width={segmentWidth}
                        height={barHeight - 2}
                        fill={col}
                        stroke="none"
                      />
                    )}

                    {/* Divider line between segments */}
                    {segIdx > 0 && (
                      <line
                        x1={segX}
                        y1="1"
                        x2={segX}
                        y2={barHeight - 1}
                        stroke={MATH_TOKENS.print.ink}
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Slice Unit Label e.g. 1/d */}
                    {showLabels && segmentWidth >= 28 && (
                      <text
                        x={segX + segmentWidth / 2}
                        y={barHeight / 2 + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="system-ui, sans-serif"
                        fill={isFilled ? "#ffffff" : MATH_TOKENS.print.muted}
                      >
                        1/{d}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Outer stroke reinforcement */}
              <rect
                x="1"
                y="1"
                width={barWidth - 2}
                height={barHeight - 2}
                rx="5"
                fill="none"
                stroke={MATH_TOKENS.print.ink}
                strokeWidth="2"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};
