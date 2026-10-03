import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface ClockHighlightSector {
  startMinute: number;
  endMinute: number;
  color?: string;
}

export interface ClockProps {
  hours?: number;
  minutes?: number;
  seconds?: number;
  size?: number;
  showHands?: boolean;
  showMinuteTicks?: boolean;
  showNumbers?: boolean | "all" | "quarters" | "roman";
  showDigital?: boolean;
  highlightSector?: ClockHighlightSector;
  hourHandColor?: string;
  minuteHandColor?: string;
  dialColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free Clock primitive.
 * High-precision vector analogue clock with Roman/Arabic dial options,
 * minute marks, student practice mode (hands hidden), and elapsed time sector.
 */
export const Clock: React.FC<ClockProps> = ({
  hours = 10,
  minutes = 10,
  seconds,
  size = 120,
  showHands = true,
  showMinuteTicks = true,
  showNumbers = "all",
  showDigital = false,
  highlightSector,
  hourHandColor = MATH_TOKENS.print.ink,
  minuteHandColor = MATH_TOKENS.primary.indigoAccent,
  dialColor = "#ffffff",
  className = "",
  style,
}) => {
  const safeHours = Number.isFinite(hours) ? hours % 12 : 12;
  const safeMinutes = Number.isFinite(minutes) ? minutes % 60 : 0;
  const safeSeconds = seconds !== undefined && Number.isFinite(seconds) ? seconds % 60 : undefined;

  // Exact clock angles (degrees)
  // Hour hand moves 30 deg per hour + 0.5 deg per minute
  const hourAngle = (safeHours * 30 + safeMinutes * 0.5) % 360;
  // Minute hand moves 6 deg per minute
  const minuteAngle = (safeMinutes * 6) % 360;
  const secondAngle = safeSeconds !== undefined ? (safeSeconds * 6) % 360 : undefined;

  const romanNumerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

  // Digital time string
  const hh = String(safeHours === 0 ? 12 : safeHours).padStart(2, "0");
  const mm = String(safeMinutes).padStart(2, "0");
  const digitalString = `${hh}:${mm}`;

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
        aria-label={`Clock showing ${digitalString}`}
      >
        {/* Outer Dial Rim */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#f8fafc"
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="3"
        />
        {/* Inner Dial Face */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill={dialColor}
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Highlight Sector (for elapsed time lessons) */}
        {highlightSector && (() => {
          const sMin = highlightSector.startMinute % 60;
          const eMin = highlightSector.endMinute % 60;
          const startDeg = sMin * 6 - 90;
          const endDeg = eMin * 6 - 90;
          const sRad = (startDeg * Math.PI) / 180;
          const eRad = (endDeg * Math.PI) / 180;
          const x1 = 50 + 44 * Math.cos(sRad);
          const y1 = 50 + 44 * Math.sin(sRad);
          const x2 = 50 + 44 * Math.cos(eRad);
          const y2 = 50 + 44 * Math.sin(eRad);
          const diffMin = (eMin - sMin + 60) % 60;
          const largeArc = diffMin > 30 ? 1 : 0;
          const pathD = `M 50 50 L ${x1} ${y1} A 44 44 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <path
              d={pathD}
              fill={highlightSector.color || "rgba(99, 102, 241, 0.25)"}
              stroke="none"
            />
          );
        })()}

        {/* 60 Minute Ticks */}
        {showMinuteTicks &&
          Array.from({ length: 60 }).map((_, m) => {
            const isHourTick = m % 5 === 0;
            const deg = m * 6 - 90;
            const rad = (deg * Math.PI) / 180;
            const outerR = 44;
            const innerR = isHourTick ? 38 : 41;
            const x1 = 50 + innerR * Math.cos(rad);
            const y1 = 50 + innerR * Math.sin(rad);
            const x2 = 50 + outerR * Math.cos(rad);
            const y2 = 50 + outerR * Math.sin(rad);

            return (
              <line
                key={`tick-${m}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isHourTick ? MATH_TOKENS.print.ink : "#94a3b8"}
                strokeWidth={isHourTick ? "1.8" : "0.8"}
                strokeLinecap="round"
              />
            );
          })}

        {/* Hour Numerals 1 to 12 */}
        {showNumbers !== false &&
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
            if (showNumbers === "quarters" && num % 3 !== 0) return null;

            const deg = num * 30 - 90;
            const rad = (deg * Math.PI) / 180;
            const radius = 33;
            const x = 50 + radius * Math.cos(rad);
            const y = 50 + radius * Math.sin(rad) + 3;

            const displayLabel = showNumbers === "roman" ? romanNumerals[num % 12] : String(num);

            return (
              <text
                key={`clock-num-${num}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={showNumbers === "roman" ? "7" : "8.5"}
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                fill={MATH_TOKENS.print.ink}
              >
                {displayLabel}
              </text>
            );
          })}

        {/* Hands */}
        {showHands && (
          <g>
            {/* Hour Hand */}
            {(() => {
              const rad = ((hourAngle - 90) * Math.PI) / 180;
              const hLen = 24;
              const x2 = 50 + hLen * Math.cos(rad);
              const y2 = 50 + hLen * Math.sin(rad);
              return (
                <line
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke={hourHandColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Minute Hand */}
            {(() => {
              const rad = ((minuteAngle - 90) * Math.PI) / 180;
              const mLen = 35;
              const x2 = 50 + mLen * Math.cos(rad);
              const y2 = 50 + mLen * Math.sin(rad);
              return (
                <line
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke={minuteHandColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Optional Second Hand */}
            {secondAngle !== undefined && (() => {
              const rad = ((secondAngle - 90) * Math.PI) / 180;
              const sLen = 38;
              const x2 = 50 + sLen * Math.cos(rad);
              const y2 = 50 + sLen * Math.sin(rad);
              return (
                <line
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Center Pinion Cap */}
            <circle cx="50" cy="50" r="3.5" fill={MATH_TOKENS.print.ink} />
            <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
          </g>
        )}
      </svg>

      {/* Optional Digital Badge */}
      {showDigital && (
        <div className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
          <span>{digitalString}</span>
        </div>
      )}
    </div>
  );
};
