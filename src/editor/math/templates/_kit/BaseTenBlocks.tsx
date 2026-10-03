import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface BaseTenBlocksProps {
  thousands?: number;
  hundreds?: number;
  tens?: number;
  ones?: number;
  value?: number;
  showLabels?: boolean;
  colorScheme?: "place-value" | "monochrome" | "golden";
  unitSize?: number;
  layout?: "grouped" | "columns" | "compact";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free BaseTenBlocks primitive.
 * Visualizes numbers using Dienes apparatus (cubes, flats, rods, and units).
 */
export const BaseTenBlocks: React.FC<BaseTenBlocksProps> = ({
  thousands,
  hundreds,
  tens,
  ones,
  value,
  showLabels = true,
  colorScheme = "place-value",
  unitSize = 7,
  layout = "columns",
  className = "",
  style,
}) => {
  // If value is provided, decompose it
  let th = thousands ?? 0;
  let h = hundreds ?? 0;
  let t = tens ?? 0;
  let o = ones ?? 0;

  if (value !== undefined) {
    const v = Math.max(0, Math.floor(value));
    th = Math.floor(v / 1000);
    h = Math.floor((v % 1000) / 100);
    t = Math.floor((v % 100) / 10);
    o = v % 10;
  }

  // Cap to sensible textbook limits
  const safeTh = Math.min(6, Math.max(0, th));
  const safeH = Math.min(9, Math.max(0, h));
  const safeT = Math.min(9, Math.max(0, t));
  const safeO = Math.min(9, Math.max(0, o));

  const u = unitSize;

  // Colors
  const colors = {
    th: colorScheme === "place-value" ? MATH_TOKENS.placeColors.Th.disc : colorScheme === "golden" ? "#f59e0b" : "#64748b",
    h: colorScheme === "place-value" ? MATH_TOKENS.placeColors.H.disc : colorScheme === "golden" ? "#fbbf24" : "#64748b",
    t: colorScheme === "place-value" ? MATH_TOKENS.placeColors.T.disc : colorScheme === "golden" ? "#fcd34d" : "#64748b",
    o: colorScheme === "place-value" ? MATH_TOKENS.placeColors.O.disc : colorScheme === "golden" ? "#fef08a" : "#64748b",
    border: "#1e293b",
  };

  /** Render a single 1x1 Unit cube */
  const renderUnit = (key: string, x: number, y: number) => (
    <rect
      key={key}
      x={x}
      y={y}
      width={u}
      height={u}
      fill={colors.o}
      stroke={colors.border}
      strokeWidth="0.8"
    />
  );

  /** Render a 1x10 Rod */
  const renderRod = (key: string, x: number, y: number) => (
    <g key={key}>
      <rect
        x={x}
        y={y}
        width={u}
        height={u * 10}
        fill={colors.t}
        stroke={colors.border}
        strokeWidth="1"
      />
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`rod-seg-${key}-${i}`}
          x1={x}
          y1={y + (i + 1) * u}
          x2={x + u}
          y2={y + (i + 1) * u}
          stroke={colors.border}
          strokeWidth="0.5"
          opacity="0.8"
        />
      ))}
    </g>
  );

  /** Render a 10x10 Flat */
  const renderFlat = (key: string, x: number, y: number) => {
    const size = u * 10;
    return (
      <g key={key}>
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          fill={colors.h}
          stroke={colors.border}
          strokeWidth="1.2"
        />
        {Array.from({ length: 9 }).map((_, i) => {
          const pos = (i + 1) * u;
          return (
            <React.Fragment key={`flat-grid-${key}-${i}`}>
              <line
                x1={x + pos}
                y1={y}
                x2={x + pos}
                y2={y + size}
                stroke={colors.border}
                strokeWidth="0.5"
                opacity="0.6"
              />
              <line
                x1={x}
                y1={y + pos}
                x2={x + size}
                y2={y + pos}
                stroke={colors.border}
                strokeWidth="0.5"
                opacity="0.6"
              />
            </React.Fragment>
          );
        })}
      </g>
    );
  };

  /** Render a 1000-Block Isometric Cube */
  const renderThousandCube = (key: string, x: number, y: number) => {
    const size = u * 8;
    const depth = u * 3;
    return (
      <g key={key}>
        {/* Front Face */}
        <rect
          x={x}
          y={y + depth}
          width={size}
          height={size}
          fill={colors.th}
          stroke={colors.border}
          strokeWidth="1.2"
        />
        {/* Top Face */}
        <polygon
          points={`${x},${y + depth} ${x + depth},${y} ${x + size + depth},${y} ${x + size},${y + depth}`}
          fill="#f472b6"
          stroke={colors.border}
          strokeWidth="1.2"
        />
        {/* Right Side Face */}
        <polygon
          points={`${x + size},${y + depth} ${x + size + depth},${y} ${x + size + depth},${y + size} ${x + size},${y + size + depth}`}
          fill="#db2777"
          stroke={colors.border}
          strokeWidth="1.2"
        />
      </g>
    );
  };

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={style}
    >
      <div className={`flex items-start justify-center gap-4 ${layout === "columns" ? "divide-x divide-slate-200 dark:divide-slate-800" : ""}`}>
        {/* Thousands Column */}
        {safeTh > 0 && (
          <div className="flex flex-col items-center px-2">
            {showLabels && (
              <span className="text-[11px] font-bold text-pink-700 dark:text-pink-400 mb-1">
                Thousands ({safeTh})
              </span>
            )}
            <svg
              width={Math.max(60, safeTh * 20 + 70)}
              height={90}
              viewBox={`0 0 ${Math.max(60, safeTh * 20 + 70)} 90`}
            >
              {Array.from({ length: safeTh }).map((_, i) =>
                renderThousandCube(`th-cube-${i}`, 10 + i * 16, 10 + i * 4)
              )}
            </svg>
          </div>
        )}

        {/* Hundreds Column */}
        {(safeH > 0 || safeTh > 0) && (
          <div className="flex flex-col items-center px-2">
            {showLabels && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                Hundreds ({safeH})
              </span>
            )}
            <svg
              width={Math.max(60, safeH * 14 + 75)}
              height={90}
              viewBox={`0 0 ${Math.max(60, safeH * 14 + 75)} 90`}
            >
              {Array.from({ length: safeH }).map((_, i) =>
                renderFlat(`h-flat-${i}`, 6 + i * 12, 8 + i * 3)
              )}
            </svg>
          </div>
        )}

        {/* Tens Column */}
        {(safeT > 0 || safeH > 0 || safeTh > 0) && (
          <div className="flex flex-col items-center px-2">
            {showLabels && (
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1">
                Tens ({safeT})
              </span>
            )}
            <svg
              width={Math.max(40, safeT * (u + 4) + 16)}
              height={90}
              viewBox={`0 0 ${Math.max(40, safeT * (u + 4) + 16)} 90`}
            >
              {Array.from({ length: safeT }).map((_, i) =>
                renderRod(`t-rod-${i}`, 8 + i * (u + 4), 10)
              )}
            </svg>
          </div>
        )}

        {/* Ones Column */}
        <div className="flex flex-col items-center px-2">
          {showLabels && (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              Ones ({safeO})
            </span>
          )}
          <svg
            width={Math.max(36, Math.min(5, safeO) * (u + 4) + 14)}
            height={90}
            viewBox={`0 0 ${Math.max(36, Math.min(5, safeO) * (u + 4) + 14)} 90`}
          >
            {Array.from({ length: safeO }).map((_, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              return renderUnit(`o-unit-${i}`, 8 + col * (u + 4), 14 + row * (u + 4));
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
