import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface TenFrameProps {
  /** Total filled count, or array of [count1, count2] for two-color counters (e.g. [5, 3] = 8) */
  value: number | [number, number];
  /** Maximum number of 10-frames to render (1 = 10, 2 = 20, etc.). Defaults to 1 or 2 based on value */
  frames?: number;
  /** Primary counter color */
  counterColor?: string;
  /** Secondary counter color for two-color bonds */
  counterColor2?: string;
  /** Counter shape */
  shape?: "circle" | "star" | "square";
  /** Width per 10-frame in pt/px */
  frameWidth?: number;
  /** Height per 10-frame in pt/px */
  frameHeight?: number;
  /** Orientation of the 2x5 grid */
  orientation?: "horizontal" | "vertical";
  /** Optional title or math bond expression e.g. "5 + 3 = 8" */
  label?: string;
  /** Whether to show count badges below the frame */
  showCountBadge?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Shared synchronous, hook-free TenFrame primitive.
 * Standard 2x5 grid visualization for Class 1-2 number sense, addition, and number bonds.
 */
export const TenFrame: React.FC<TenFrameProps> = ({
  value,
  frames,
  counterColor = "#ef4444", // Crisp print red
  counterColor2 = "#3b82f6", // Crisp print blue
  shape = "circle",
  frameWidth = 180,
  frameHeight = 76,
  orientation = "horizontal",
  label,
  showCountBadge = false,
  style,
  className = "",
}) => {
  const isPair = Array.isArray(value);
  const count1 = Math.max(0, isPair ? Number(value[0]) || 0 : Number(value) || 0);
  const count2 = Math.max(0, isPair ? Number(value[1]) || 0 : 0);
  const totalCount = count1 + count2;

  // Compute number of 10-frames needed
  const frameCount = Math.max(1, frames || (totalCount > 10 ? Math.ceil(totalCount / 10) : 1));

  const cols = orientation === "horizontal" ? 5 : 2;
  const rows = orientation === "horizontal" ? 2 : 5;

  const cellWidth = frameWidth / cols;
  const cellHeight = frameHeight / rows;
  const radius = Math.min(cellWidth, cellHeight) * 0.36;

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 select-none ${className}`}
      style={style}
    >
      {label && (
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{label}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {Array.from({ length: frameCount }).map((_, fIdx) => {
          const frameStart = fIdx * 10;

          return (
            <div
              key={`tenframe-box-${fIdx}`}
              className="flex flex-col items-center gap-1"
            >
              <svg
                width={frameWidth}
                height={frameHeight}
                viewBox={`0 0 ${frameWidth} ${frameHeight}`}
                className="overflow-visible"
                role="img"
                aria-label={`Ten frame ${fIdx + 1} with ${Math.min(10, Math.max(0, totalCount - frameStart))} counters`}
              >
                {/* Frame border */}
                <rect
                  x="1"
                  y="1"
                  width={frameWidth - 2}
                  height={frameHeight - 2}
                  rx="6"
                  fill="#ffffff"
                  stroke={MATH_TOKENS.print.ink}
                  strokeWidth="2.5"
                />

                {/* Grid Divider Lines */}
                {Array.from({ length: cols - 1 }).map((_, c) => {
                  const x = (c + 1) * cellWidth;
                  return (
                    <line
                      key={`v-line-${fIdx}-${c}`}
                      x1={x}
                      y1="1"
                      x2={x}
                      y2={frameHeight - 1}
                      stroke={MATH_TOKENS.print.line}
                      strokeWidth="1.5"
                    />
                  );
                })}
                {Array.from({ length: rows - 1 }).map((_, r) => {
                  const y = (r + 1) * cellHeight;
                  return (
                    <line
                      key={`h-line-${fIdx}-${r}`}
                      x1="1"
                      y1={y}
                      x2={frameWidth - 1}
                      y2={y}
                      stroke={MATH_TOKENS.print.line}
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Counter Cells (top row left-to-right, then bottom row) */}
                {Array.from({ length: 10 }).map((_, cellIdx) => {
                  const globalIdx = frameStart + cellIdx;
                  let col: number;
                  let row: number;

                  if (orientation === "horizontal") {
                    col = cellIdx % 5;
                    row = Math.floor(cellIdx / 5);
                  } else {
                    row = Math.floor(cellIdx / 2);
                    col = cellIdx % 2;
                  }

                  const cx = col * cellWidth + cellWidth / 2;
                  const cy = row * cellHeight + cellHeight / 2;

                  const isFilled = globalIdx < totalCount;
                  const isFirstGroup = globalIdx < count1;
                  const fill = isFirstGroup ? counterColor : counterColor2;

                  if (!isFilled) {
                    // Empty cell placeholder marker
                    return (
                      <circle
                        key={`cell-empty-${fIdx}-${cellIdx}`}
                        cx={cx}
                        cy={cy}
                        r={radius * 0.4}
                        fill="#f1f5f9"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    );
                  }

                  if (shape === "square") {
                    const side = radius * 1.6;
                    return (
                      <rect
                        key={`counter-${fIdx}-${cellIdx}`}
                        x={cx - side / 2}
                        y={cy - side / 2}
                        width={side}
                        height={side}
                        rx="3"
                        fill={fill}
                        stroke="#0f172a"
                        strokeWidth="1.2"
                      />
                    );
                  }

                  if (shape === "star") {
                    return (
                      <polygon
                        key={`counter-${fIdx}-${cellIdx}`}
                        points={`${cx},${cy - radius} ${cx + radius * 0.3},${cy - radius * 0.3} ${cx + radius},${cy - radius * 0.3} ${cx + radius * 0.45},${cy + radius * 0.2} ${cx + radius * 0.7},${cy + radius} ${cx},${cy + radius * 0.5} ${cx - radius * 0.7},${cy + radius} ${cx - radius * 0.45},${cy + radius * 0.2} ${cx - radius},${cy - radius * 0.3} ${cx - radius * 0.3},${cy - radius * 0.3}`}
                        fill={fill}
                        stroke="#0f172a"
                        strokeWidth="1"
                      />
                    );
                  }

                  // Default smooth circular counter with highlight
                  return (
                    <g key={`counter-${fIdx}-${cellIdx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={fill}
                        stroke="#1e293b"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={cx - radius * 0.3}
                        cy={cy - radius * 0.3}
                        r={radius * 0.28}
                        fill="#ffffff"
                        opacity="0.45"
                      />
                    </g>
                  );
                })}
              </svg>

              {showCountBadge && (
                <span className="text-[10px] font-mono text-slate-500">
                  {Math.min(10, Math.max(0, totalCount - frameStart))} / 10
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
