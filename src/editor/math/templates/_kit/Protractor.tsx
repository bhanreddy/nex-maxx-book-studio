import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface ProtractorProps {
  size?: number;
  angle?: number;
  showAngleRay?: boolean;
  rayColor?: string;
  angleArcColor?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free Protractor primitive.
 * Realistic 180-degree semi-circular protractor with dual scale markings
 * and optional measurable angle ray overlay.
 */
export const Protractor: React.FC<ProtractorProps> = ({
  size = 220,
  angle = 60,
  showAngleRay = true,
  rayColor = "#dc2626",
  angleArcColor = "rgba(220, 38, 38, 0.2)",
  label,
  className = "",
  style,
}) => {
  const safeAngle = Math.max(0, Math.min(180, angle));

  const cx = 110;
  const cy = 110;
  const outerR = 96;
  const innerR = 72;
  const baselineY = cy;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={style}
    >
      <svg
        width={size}
        height={size * 0.65}
        viewBox="0 0 220 130"
        className="overflow-visible"
        role="img"
        aria-label={`Protractor showing ${safeAngle} degrees`}
      >
        {/* Transparent / tinted acrylic body */}
        <path
          d={`M ${cx - outerR} ${baselineY} A ${outerR} ${outerR} 0 0 1 ${cx + outerR} ${baselineY} Z`}
          fill="#f0f9ff"
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="2"
        />

        {/* Inner cutout arch */}
        <path
          d={`M ${cx - 38} ${baselineY} A 38 38 0 0 1 ${cx + 38} ${baselineY} Z`}
          fill="#ffffff"
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="1.2"
        />

        {/* Center Origin Crosshair */}
        <line
          x1={cx - 8}
          y1={baselineY}
          x2={cx + 8}
          y2={baselineY}
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="1.5"
        />
        <line
          x1={cx}
          y1={baselineY - 8}
          x2={cx}
          y2={baselineY + 4}
          stroke={MATH_TOKENS.print.ink}
          strokeWidth="1.5"
        />
        <circle cx={cx} cy={baselineY} r="2" fill={MATH_TOKENS.print.ink} />

        {/* Degree Ticks (Every degree from 0 to 180) */}
        {Array.from({ length: 181 }).map((_, deg) => {
          const is10 = deg % 10 === 0;
          const is5 = deg % 5 === 0 && !is10;

          // Radian angle (0 is right/east, 180 is left/west)
          const rad = ((180 - deg) * Math.PI) / 180;
          const tickLen = is10 ? 11 : is5 ? 7 : 4;

          const x1 = cx + outerR * Math.cos(rad);
          const y1 = cy - outerR * Math.sin(rad);
          const x2 = cx + (outerR - tickLen) * Math.cos(rad);
          const y2 = cy - (outerR - tickLen) * Math.sin(rad);

          return (
            <line
              key={`prot-tick-${deg}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={MATH_TOKENS.print.ink}
              strokeWidth={is10 ? "1.2" : "0.6"}
            />
          );
        })}

        {/* Degree Numbers every 10 degrees (Outer scale: 0 to 180, Inner scale: 180 to 0) */}
        {Array.from({ length: 19 }).map((_, idx) => {
          const deg = idx * 10;
          const rad = ((180 - deg) * Math.PI) / 180;

          // Outer Scale (0 at right to 180 at left)
          const outerTextR = outerR - 18;
          const ox = cx + outerTextR * Math.cos(rad);
          const oy = cy - outerTextR * Math.sin(rad) + 3;

          // Inner Scale (180 at right to 0 at left)
          const innerTextR = innerR - 10;
          const ix = cx + innerTextR * Math.cos(rad);
          const iy = cy - innerTextR * Math.sin(rad) + 3;

          return (
            <g key={`prot-num-${deg}`}>
              {/* Outer Number */}
              <text
                x={ox}
                y={oy}
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                fill={MATH_TOKENS.print.ink}
              >
                {deg}
              </text>
              {/* Inner Number */}
              <text
                x={ix}
                y={iy}
                textAnchor="middle"
                fontSize="5.5"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                fill="#475569"
              >
                {180 - deg}
              </text>
            </g>
          );
        })}

        {/* Angle Ray Overlay */}
        {showAngleRay && (() => {
          const rad = ((180 - safeAngle) * Math.PI) / 180;
          const rayLen = outerR + 10;
          const rayX = cx + rayLen * Math.cos(rad);
          const rayY = cy - rayLen * Math.sin(rad);

          // Arc for the angle
          const arcR = 30;
          const arcEndX = cx + arcR * Math.cos(rad);
          const arcEndY = cy - arcR * Math.sin(rad);
          const largeArc = safeAngle > 180 ? 1 : 0;
          const arcPath = `M ${cx + arcR} ${baselineY} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcEndX} ${arcEndY}`;

          return (
            <g key="angle-overlay">
              {/* Baseline ray to 0 degrees */}
              <line
                x1={cx}
                y1={baselineY}
                x2={cx + outerR + 10}
                y2={baselineY}
                stroke={rayColor}
                strokeWidth="2.5"
              />
              {/* Target angle ray */}
              <line
                x1={cx}
                y1={baselineY}
                x2={rayX}
                y2={rayY}
                stroke={rayColor}
                strokeWidth="2.5"
              />
              {/* Angle Sector Arc */}
              <path
                d={arcPath}
                fill={angleArcColor}
                stroke={rayColor}
                strokeWidth="1.5"
              />
              {/* Angle Readout */}
              <text
                x={cx + (arcR + 16) * Math.cos(rad / 2)}
                y={cy - (arcR + 16) * Math.sin(rad / 2) + 3}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={rayColor}
              >
                {label || `${safeAngle}°`}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};
