import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface TallyMarksProps {
  count: number;
  strokeWidth?: number;
  color?: string;
  size?: number; // bundle height
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free TallyMarks primitive.
 * Renders authentic five-bar tally clusters (4 vertical lines + 1 diagonal slash)
 * and remainder strokes.
 */
export const TallyMarks: React.FC<TallyMarksProps> = ({
  count = 13,
  strokeWidth = 2,
  color = MATH_TOKENS.print.ink,
  size = 28,
  className = "",
  style,
}) => {
  const safeCount = Math.max(0, Math.floor(count));
  const bundles = Math.floor(safeCount / 5);
  const remainder = safeCount % 5;

  const bundleWidth = size * 0.9;
  const strokeSpacing = bundleWidth / 4;

  /** Single 5-mark bundle SVG */
  const renderBundle = (key: string) => (
    <svg
      key={key}
      width={bundleWidth}
      height={size}
      viewBox={`0 0 ${bundleWidth} ${size}`}
      className="inline-block overflow-visible"
    >
      {/* 4 Vertical strokes */}
      {[0, 1, 2, 3].map((i) => {
        const x = 3 + i * strokeSpacing;
        return (
          <line
            key={`bundle-stroke-${i}`}
            x1={x}
            y1={2}
            x2={x}
            y2={size - 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
      {/* 1 Diagonal slash across all 4 */}
      <line
        x1={1}
        y1={size - 4}
        x2={bundleWidth - 1}
        y2={4}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );

  /** Remainder strokes SVG */
  const renderRemainder = (key: string, num: number) => (
    <svg
      key={key}
      width={num * strokeSpacing + 8}
      height={size}
      viewBox={`0 0 ${num * strokeSpacing + 8} ${size}`}
      className="inline-block overflow-visible"
    >
      {Array.from({ length: num }).map((_, i) => {
        const x = 3 + i * strokeSpacing;
        return (
          <line
            key={`rem-stroke-${i}`}
            x1={x}
            y1={2}
            x2={x}
            y2={size - 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      style={style}
    >
      {Array.from({ length: bundles }).map((_, bIdx) =>
        renderBundle(`tally-bundle-${bIdx}`)
      )}
      {remainder > 0 && renderRemainder("tally-remainder", remainder)}
      {safeCount === 0 && (
        <span className="text-xs text-slate-400 font-mono">0</span>
      )}
    </div>
  );
};
