import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface ThermometerProps {
  temperature?: number;
  min?: number;
  max?: number;
  unit?: string;
  width?: number;
  height?: number;
  liquidColor?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free Thermometer primitive.
 * High-precision vector laboratory thermometer with glass stem, bulb,
 * degree scale, and mercury column.
 */
export const Thermometer: React.FC<ThermometerProps> = ({
  temperature = 28,
  min = 0,
  max = 50,
  unit = "°C",
  width = 80,
  height = 200,
  liquidColor = "#ef4444",
  label,
  className = "",
  style,
}) => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 50;
  const safeTemp = Math.max(safeMin, Math.min(safeMax, temperature));
  const range = safeMax - safeMin;

  const stemX = 30;
  const stemWidth = 14;
  const topY = 24;
  const bottomY = height - 44;
  const bulbY = height - 26;
  const bulbRadius = 16;
  const usableStemHeight = bottomY - topY;

  // Fraction of temperature
  const tempFrac = (safeTemp - safeMin) / range;
  const liquidLevelY = bottomY - tempFrac * usableStemHeight;

  // Generate tick marks (major every 10, minor every 2)
  const ticks: Array<{ val: number; y: number; isMajor: boolean }> = [];
  const step = range <= 60 ? 2 : 5;
  for (let v = safeMin; v <= safeMax; v += step) {
    const f = (v - safeMin) / range;
    const y = bottomY - f * usableStemHeight;
    ticks.push({ val: v, y, isMajor: v % 10 === 0 });
  }

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={style}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={`Thermometer reading ${safeTemp}${unit}`}
      >
        {/* Scale Unit Label */}
        <text
          x={stemX + stemWidth / 2}
          y={topY - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill={MATH_TOKENS.print.ink}
        >
          {unit}
        </text>

        {/* Outer Glass Stem */}
        <rect
          x={stemX}
          y={topY}
          width={stemWidth}
          height={bottomY - topY + 4}
          rx={stemWidth / 2}
          fill="#f1f5f9"
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="2"
        />

        {/* Glass Bulb Reservoir */}
        <circle
          cx={stemX + stemWidth / 2}
          cy={bulbY}
          r={bulbRadius}
          fill={liquidColor}
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="2"
        />

        {/* Liquid Mercury Column in stem */}
        <rect
          x={stemX + 3}
          y={liquidLevelY}
          width={stemWidth - 6}
          height={bottomY - liquidLevelY + 4}
          rx="2"
          fill={liquidColor}
          stroke="none"
        />

        {/* Bulb Highlight Specular */}
        <circle
          cx={stemX + stemWidth / 2 - 5}
          cy={bulbY - 5}
          r="4"
          fill="#ffffff"
          opacity="0.5"
        />

        {/* Degree Ticks & Numbers */}
        {ticks.map((t) => {
          const tickX1 = stemX + stemWidth;
          const tickX2 = tickX1 + (t.isMajor ? 8 : 4);

          return (
            <g key={`therm-tick-${t.val}`}>
              <line
                x1={tickX1}
                y1={t.y}
                x2={tickX2}
                y2={t.y}
                stroke={MATH_TOKENS.print.ink}
                strokeWidth={t.isMajor ? "1.5" : "0.8"}
              />

              {t.isMajor && (
                <text
                  x={tickX2 + 4}
                  y={t.y + 3.5}
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  fill={MATH_TOKENS.print.ink}
                >
                  {t.val}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Temperature readout badge */}
      <div className="mt-1 text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
        <span>{label || `${safeTemp}${unit}`}</span>
      </div>
    </div>
  );
};
