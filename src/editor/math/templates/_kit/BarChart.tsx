import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartItem[];
  orientation?: "vertical" | "horizontal";
  title?: string;
  xLabel?: string;
  yLabel?: string;
  maxValue?: number;
  step?: number;
  width?: number;
  height?: number;
  showValues?: boolean;
  gridLines?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_BAR_COLORS = [
  MATH_TOKENS.primary.indigoAccent,
  "#0ea5e9", // Sky
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
];

/**
 * Shared synchronous, hook-free BarChart primitive.
 * Clean, print-ready vertical or horizontal bar graph with axes, gridlines, and labels.
 */
export const BarChart: React.FC<BarChartProps> = ({
  data = [
    { label: "Apple", value: 8 },
    { label: "Banana", value: 12 },
    { label: "Orange", value: 6 },
    { label: "Mango", value: 15 },
  ],
  orientation = "vertical",
  title,
  xLabel,
  yLabel,
  maxValue,
  step,
  width = 300,
  height = 180,
  showValues = true,
  gridLines = true,
  className = "",
  style,
}) => {
  const maxVal = maxValue ?? Math.max(...data.map((d) => d.value), 10);
  const chartStep = step ?? (maxVal <= 10 ? 2 : maxVal <= 20 ? 5 : 10);
  const safeMax = Math.ceil(maxVal / chartStep) * chartStep;

  const padLeft = yLabel ? 42 : 32;
  const padBottom = xLabel ? 36 : 28;
  const padTop = title ? 28 : 16;
  const padRight = 16;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const barCount = Math.max(1, data.length);

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={style}
    >
      {title && (
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          <span>{title}</span>
        </div>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={title || "Bar chart"}
      >
        {orientation === "vertical" ? (
          <>
            {/* Gridlines and Y Ticks */}
            {Array.from({ length: Math.floor(safeMax / chartStep) + 1 }).map((_, i) => {
              const val = i * chartStep;
              const y = padTop + plotHeight - (val / safeMax) * plotHeight;

              return (
                <g key={`y-grid-${val}`}>
                  {gridLines && (
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotWidth}
                      y2={y}
                      stroke={MATH_TOKENS.print.line}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                  )}
                  {/* Y Axis Tick Number */}
                  <text
                    x={padLeft - 6}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="600"
                    fill={MATH_TOKENS.print.ink}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Axes Lines */}
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + plotHeight}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth="2"
            />
            <line
              x1={padLeft}
              y1={padTop + plotHeight}
              x2={padLeft + plotWidth}
              y2={padTop + plotHeight}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth="2"
            />

            {/* Bars */}
            {data.map((item, idx) => {
              const slotWidth = plotWidth / barCount;
              const barW = Math.max(12, Math.min(32, slotWidth * 0.65));
              const barH = (item.value / safeMax) * plotHeight;
              const x = padLeft + idx * slotWidth + (slotWidth - barW) / 2;
              const y = padTop + plotHeight - barH;
              const col = item.color || DEFAULT_BAR_COLORS[idx % DEFAULT_BAR_COLORS.length];

              return (
                <g key={`bar-${idx}-${item.label}`}>
                  {/* Bar rect */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="3"
                    fill={col}
                    stroke={MATH_TOKENS.print.ink}
                    strokeWidth="1.2"
                  />

                  {/* Value on top of bar */}
                  {showValues && (
                    <text
                      x={x + barW / 2}
                      y={y - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={MATH_TOKENS.print.ink}
                    >
                      {item.value}
                    </text>
                  )}

                  {/* Category label below bar */}
                  <text
                    x={x + barW / 2}
                    y={padTop + plotHeight + 14}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill={MATH_TOKENS.print.ink}
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          /* Horizontal Bar Chart */
          <>
            {/* Gridlines and X Ticks */}
            {Array.from({ length: Math.floor(safeMax / chartStep) + 1 }).map((_, i) => {
              const val = i * chartStep;
              const x = padLeft + (val / safeMax) * plotWidth;

              return (
                <g key={`x-grid-${val}`}>
                  {gridLines && (
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotHeight}
                      stroke={MATH_TOKENS.print.line}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                  )}
                  <text
                    x={x}
                    y={padTop + plotHeight + 12}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={MATH_TOKENS.print.ink}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Axes Lines */}
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + plotHeight}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth="2"
            />
            <line
              x1={padLeft}
              y1={padTop + plotHeight}
              x2={padLeft + plotWidth}
              y2={padTop + plotHeight}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth="2"
            />

            {/* Horizontal Bars */}
            {data.map((item, idx) => {
              const slotHeight = plotHeight / barCount;
              const barH = Math.max(10, Math.min(24, slotHeight * 0.65));
              const barW = (item.value / safeMax) * plotWidth;
              const y = padTop + idx * slotHeight + (slotHeight - barH) / 2;
              const col = item.color || DEFAULT_BAR_COLORS[idx % DEFAULT_BAR_COLORS.length];

              return (
                <g key={`h-bar-${idx}-${item.label}`}>
                  {/* Category label on the left */}
                  <text
                    x={padLeft - 6}
                    y={y + barH / 2 + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="600"
                    fill={MATH_TOKENS.print.ink}
                  >
                    {item.label}
                  </text>

                  {/* Bar rect */}
                  <rect
                    x={padLeft}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="3"
                    fill={col}
                    stroke={MATH_TOKENS.print.ink}
                    strokeWidth="1.2"
                  />

                  {/* Value at end of bar */}
                  {showValues && (
                    <text
                      x={padLeft + barW + 5}
                      y={y + barH / 2 + 3.5}
                      fontSize="9"
                      fontWeight="bold"
                      fill={MATH_TOKENS.print.ink}
                    >
                      {item.value}
                    </text>
                  )}
                </g>
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
};
