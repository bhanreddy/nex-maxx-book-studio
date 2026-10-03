import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface RulerMeasureItem {
  label?: string;
  startCm: number;
  endCm: number;
  color?: string;
  itemType?: "pencil" | "ribbon" | "bar" | "pin";
}

export interface RulerHighlight {
  cm: number;
  label?: string;
  color?: string;
}

export interface RulerProps {
  lengthCm?: number;
  startCm?: number;
  width?: number;
  height?: number;
  measureItem?: RulerMeasureItem;
  highlights?: RulerHighlight[];
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free Ruler primitive.
 * Realistic metric ruler (15cm or 30cm) with mm ticks, cm labels,
 * and measured object overlay (pencil, ribbon, bar).
 */
export const Ruler: React.FC<RulerProps> = ({
  lengthCm = 15,
  startCm = 0,
  width = 380,
  height = 90,
  measureItem,
  highlights = [],
  title,
  className = "",
  style,
}) => {
  const safeLength = Math.max(5, Math.min(30, lengthCm));
  const safeStart = Math.max(0, startCm);
  const endCm = safeStart + safeLength;

  const totalMm = safeLength * 10;
  const padX = 24;
  const rulerHeight = 44;
  const hasItem = Boolean(measureItem);
  const rulerY = hasItem ? height - rulerHeight - 8 : (height - rulerHeight) / 2;
  const usableWidth = width - padX * 2;
  const mmWidth = usableWidth / totalMm;

  const getX = (cm: number): number => {
    const fraction = (cm - safeStart) / safeLength;
    return padX + Math.min(1, Math.max(0, fraction)) * usableWidth;
  };

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
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={`Ruler measuring ${safeLength} cm`}
      >
        {/* Measured Item above ruler */}
        {measureItem && (() => {
          const x1 = getX(measureItem.startCm);
          const x2 = getX(measureItem.endCm);
          const itemW = Math.max(6, x2 - x1);
          const itemY = rulerY - 26;
          const col = measureItem.color || "#f59e0b";
          const measuredLength = Math.round((measureItem.endCm - measureItem.startCm) * 10) / 10;

          return (
            <g key="ruler-measured-item">
              {/* Pencil Shape or Ribbon Bar */}
              {measureItem.itemType === "pencil" ? (
                <g>
                  {/* Pencil lead */}
                  <polygon
                    points={`${x2},${itemY + 9} ${x2 - 12},${itemY + 3} ${x2 - 12},${itemY + 15}`}
                    fill="#334155"
                  />
                  <polygon
                    points={`${x2 - 4},${itemY + 9} ${x2},${itemY + 9} ${x2 - 4},${itemY + 7}`}
                    fill="#0f172a"
                  />
                  {/* Pencil Body */}
                  <rect
                    x={x1 + 10}
                    y={itemY + 3}
                    width={Math.max(4, itemW - 22)}
                    height="12"
                    fill={col}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  {/* Eraser */}
                  <rect
                    x={x1}
                    y={itemY + 3}
                    width="10"
                    height="12"
                    rx="2"
                    fill="#f472b6"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                </g>
              ) : (
                /* Colored Ribbon Bar */
                <rect
                  x={x1}
                  y={itemY + 4}
                  width={itemW}
                  height="12"
                  rx="3"
                  fill={col}
                  stroke={MATH_TOKENS.print.ink}
                  strokeWidth="1.5"
                />
              )}

              {/* Length indicator bracket / label */}
              <text
                x={(x1 + x2) / 2}
                y={itemY - 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill={MATH_TOKENS.print.ink}
              >
                {measureItem.label || `${measuredLength} cm`}
              </text>
              {/* Guideline drop lines to ruler */}
              <line
                x1={x1}
                y1={itemY}
                x2={x1}
                y2={rulerY}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={x2}
                y1={itemY}
                x2={x2}
                y2={rulerY}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          );
        })()}

        {/* Ruler Body */}
        <rect
          x={padX - 8}
          y={rulerY}
          width={usableWidth + 16}
          height={rulerHeight}
          rx="4"
          fill="#fef9c3" // Subtle wood/clear plastic yellow tint
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="2"
        />

        {/* Brand/cm Label */}
        <text
          x={padX + 8}
          y={rulerY + rulerHeight - 10}
          fontSize="9"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          fill="#854d0e"
        >
          cm / mm
        </text>

        {/* Millimeter & Centimeter Ticks */}
        {Array.from({ length: totalMm + 1 }).map((_, mm) => {
          const x = padX + mm * mmWidth;
          const isCm = mm % 10 === 0;
          const isHalfCm = mm % 5 === 0 && !isCm;

          const tickHeight = isCm ? 18 : isHalfCm ? 12 : 7;
          const cmNum = safeStart + mm / 10;

          return (
            <g key={`ruler-tick-${mm}`}>
              <line
                x1={x}
                y1={rulerY}
                x2={x}
                y2={rulerY + tickHeight}
                stroke={MATH_TOKENS.print.ink}
                strokeWidth={isCm ? "1.5" : "0.8"}
              />

              {/* Centimeter Number */}
              {isCm && (
                <text
                  x={x}
                  y={rulerY + tickHeight + 11}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  fill={MATH_TOKENS.print.ink}
                >
                  {cmNum}
                </text>
              )}
            </g>
          );
        })}

        {/* Highlights */}
        {highlights.map((hl, idx) => {
          const hx = getX(hl.cm);
          const col = hl.color || "#ef4444";
          return (
            <g key={`ruler-hl-${hl.cm}-${idx}`}>
              <circle cx={hx} cy={rulerY} r="4" fill={col} />
              {hl.label && (
                <text
                  x={hx}
                  y={rulerY + rulerHeight + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={col}
                >
                  {hl.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
