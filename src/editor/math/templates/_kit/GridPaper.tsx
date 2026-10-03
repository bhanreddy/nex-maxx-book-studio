import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface GridPaperShape {
  type: "polygon" | "rect" | "line";
  points?: Array<[number, number]>; // [col, row]
  rect?: { col: number; row: number; width: number; height: number };
  color?: string;
  fill?: string;
  strokeWidth?: number;
  label?: string;
}

export interface GridPaperHighlightCell {
  col: number;
  row: number;
  color?: string;
  label?: string;
}

export interface GridPaperProps {
  type?: "square" | "dot" | "isometric" | "coordinate";
  rows?: number;
  cols?: number;
  cellSize?: number;
  gridColor?: string;
  axes?: boolean;
  shapes?: GridPaperShape[];
  highlightCells?: GridPaperHighlightCell[];
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free GridPaper primitive.
 * High-precision math workbook grid paper (square grid, dot array, isometric, or coordinate).
 */
export const GridPaper: React.FC<GridPaperProps> = ({
  type = "square",
  rows = 8,
  cols = 10,
  cellSize = 20,
  gridColor = "#cbd5e1",
  axes = false,
  shapes = [],
  highlightCells = [],
  title,
  className = "",
  style,
}) => {
  const safeRows = Math.max(2, Math.min(30, rows));
  const safeCols = Math.max(2, Math.min(30, cols));
  const cs = Math.max(12, Math.min(48, cellSize));

  const padLeft = axes ? 28 : 6;
  const padBottom = axes ? 24 : 6;
  const padRight = 6;
  const padTop = 6;

  const gridWidth = safeCols * cs;
  const gridHeight = safeRows * cs;
  const totalWidth = gridWidth + padLeft + padRight;
  const totalHeight = gridHeight + padTop + padBottom;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={style}
    >
      {title && (
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          <span>{title}</span>
        </div>
      )}

      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="overflow-visible"
        role="img"
        aria-label={title || `${type} grid paper ${safeCols}x${safeRows}`}
      >
        {/* Highlighted Cells (Area models) */}
        {highlightCells.map((hc, idx) => {
          const x = padLeft + hc.col * cs;
          const y = padTop + (safeRows - 1 - hc.row) * cs;
          return (
            <rect
              key={`cell-hi-${hc.col}-${hc.row}-${idx}`}
              x={x}
              y={y}
              width={cs}
              height={cs}
              fill={hc.color || "rgba(99, 102, 241, 0.25)"}
              stroke="none"
            />
          );
        })}

        {/* Square Grid Lines */}
        {type === "square" && (
          <g>
            {/* Vertical lines */}
            {Array.from({ length: safeCols + 1 }).map((_, c) => {
              const x = padLeft + c * cs;
              return (
                <line
                  key={`grid-v-${c}`}
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + gridHeight}
                  stroke={gridColor}
                  strokeWidth="1"
                />
              );
            })}
            {/* Horizontal lines */}
            {Array.from({ length: safeRows + 1 }).map((_, r) => {
              const y = padTop + r * cs;
              return (
                <line
                  key={`grid-h-${r}`}
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + gridWidth}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {/* Dot Grid */}
        {type === "dot" && (
          <g>
            {Array.from({ length: safeRows + 1 }).map((_, r) =>
              Array.from({ length: safeCols + 1 }).map((_, c) => {
                const x = padLeft + c * cs;
                const y = padTop + r * cs;
                return (
                  <circle
                    key={`dot-${c}-${r}`}
                    cx={x}
                    cy={y}
                    r="1.8"
                    fill={MATH_TOKENS.print.ink}
                  />
                );
              })
            )}
          </g>
        )}

        {/* Coordinate Grid Axes & Labels */}
        {axes && (
          <g>
            {/* Y Axis line */}
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + gridHeight}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth="2"
            />
            {/* X Axis line */}
            <line
              x1={padLeft}
              y1={padTop + gridHeight}
              x2={padLeft + gridWidth}
              y2={padTop + gridHeight}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth="2"
            />

            {/* X Axis tick numbers */}
            {Array.from({ length: safeCols + 1 }).map((_, c) => {
              const x = padLeft + c * cs;
              return (
                <text
                  key={`axis-x-${c}`}
                  x={x}
                  y={padTop + gridHeight + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={MATH_TOKENS.print.ink}
                >
                  {c}
                </text>
              );
            })}

            {/* Y Axis tick numbers */}
            {Array.from({ length: safeRows + 1 }).map((_, r) => {
              const y = padTop + (safeRows - r) * cs;
              return (
                <text
                  key={`axis-y-${r}`}
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight="bold"
                  fill={MATH_TOKENS.print.ink}
                >
                  {r}
                </text>
              );
            })}
          </g>
        )}

        {/* Drawn Shapes / Polygons */}
        {shapes.map((sh, idx) => {
          if (sh.type === "rect" && sh.rect) {
            const rx = padLeft + sh.rect.col * cs;
            const ry = padTop + (safeRows - sh.rect.row - sh.rect.height) * cs;
            const rw = sh.rect.width * cs;
            const rh = sh.rect.height * cs;
            return (
              <g key={`shape-rect-${idx}`}>
                <rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  fill={sh.fill || "rgba(59, 130, 246, 0.2)"}
                  stroke={sh.color || MATH_TOKENS.primary.indigoAccent}
                  strokeWidth={sh.strokeWidth || 2}
                />
                {sh.label && (
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={sh.color || MATH_TOKENS.primary.indigoAccent}
                  >
                    {sh.label}
                  </text>
                )}
              </g>
            );
          }

          if (sh.type === "polygon" && sh.points && sh.points.length > 0) {
            const svgPoints = sh.points
              .map(([col, row]) => `${padLeft + col * cs},${padTop + (safeRows - row) * cs}`)
              .join(" ");

            return (
              <polygon
                key={`shape-poly-${idx}`}
                points={svgPoints}
                fill={sh.fill || "rgba(16, 185, 129, 0.2)"}
                stroke={sh.color || "#059669"}
                strokeWidth={sh.strokeWidth || 2}
              />
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};
