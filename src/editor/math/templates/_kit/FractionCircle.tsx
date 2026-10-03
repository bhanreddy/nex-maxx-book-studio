import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface FractionCircleProps {
  numerator?: number;
  denominator?: number;
  size?: number;
  fillColor?: string;
  emptyColor?: string;
  showLabels?: boolean;
  strokeWidth?: number;
  startAngle?: number;
  showAnswer?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free FractionCircle primitive.
 * Vector pie model showing equal sectors of a circle for fractions.
 */
export const FractionCircle: React.FC<FractionCircleProps> = ({
  numerator = 3,
  denominator = 4,
  size = 110,
  fillColor = MATH_TOKENS.topics.fractions.main,
  emptyColor = "#ffffff",
  showLabels = true,
  strokeWidth = 2,
  startAngle = -90, // Start at 12 o'clock
  showAnswer = true,
  className = "",
  style,
}) => {
  const d = Math.max(1, Math.min(24, denominator));
  const n = showAnswer ? Math.max(0, Math.min(d, numerator)) : 0;

  const radius = 44;
  const cx = 50;
  const cy = 50;
  const sliceAngle = 360 / d;

  return (
    <div
      className={`inline-flex flex-col items-center gap-1.5 select-none ${className}`}
      style={style}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="overflow-visible"
        role="img"
        aria-label={`Fraction circle showing ${n} of ${d}`}
      >
        {/* If 1/1 (single whole circle) */}
        {d === 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill={n >= 1 ? fillColor : emptyColor}
            stroke={MATH_TOKENS.print.ink}
            strokeWidth={strokeWidth}
          />
        ) : (
          <>
            {/* Draw each sector path */}
            {Array.from({ length: d }).map((_, i) => {
              const a1 = startAngle + i * sliceAngle;
              const a2 = a1 + sliceAngle;

              const rad1 = (a1 * Math.PI) / 180;
              const rad2 = (a2 * Math.PI) / 180;

              const x1 = cx + radius * Math.cos(rad1);
              const y1 = cy + radius * Math.sin(rad1);
              const x2 = cx + radius * Math.cos(rad2);
              const y2 = cy + radius * Math.sin(rad2);

              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              const isFilled = i < n;

              return (
                <path
                  key={`sector-${d}-${i}`}
                  d={pathD}
                  fill={isFilled ? fillColor : emptyColor}
                  stroke={MATH_TOKENS.print.ink}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                />
              );
            })}
          </>
        )}

        {/* Center Pivot Point */}
        <circle cx={cx} cy={cy} r="2.5" fill={MATH_TOKENS.print.ink} />
      </svg>

      {/* Label Badge */}
      {showLabels && (
        <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
          <span>{numerator}/{d}</span>
        </div>
      )}
    </div>
  );
};
