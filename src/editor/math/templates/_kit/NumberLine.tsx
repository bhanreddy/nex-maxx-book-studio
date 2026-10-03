import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface NumberLineJump {
  from: number;
  to: number;
  label?: string;
  color?: string;
  style?: "solid" | "dashed";
}

export interface NumberLineHighlight {
  value: number;
  label?: string;
  color?: string;
  shape?: "circle" | "arrow" | "star";
}

export interface NumberLineProps {
  start?: number;
  end?: number;
  step?: number;
  subdivisions?: number;
  width?: number;
  height?: number;
  jumps?: NumberLineJump[];
  highlightedPoints?: Array<number | NumberLineHighlight>;
  missingPoints?: number[];
  showAnswer?: boolean;
  fractions?: boolean;
  fractionDenominator?: number;
  color?: string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Shared synchronous, hook-free NumberLine primitive.
 * Renders parametric vector number lines with tick marks, labels, jump arcs,
 * fraction support, and missing point challenge boxes.
 */
export const NumberLine: React.FC<NumberLineProps> = ({
  start = 0,
  end = 10,
  step = 1,
  subdivisions = 0,
  width = 360,
  height = 90,
  jumps = [],
  highlightedPoints = [],
  missingPoints = [],
  showAnswer = true,
  fractions = false,
  fractionDenominator,
  color = MATH_TOKENS.print.ink,
  title,
  style,
  className = "",
}) => {
  const safeStart = Number.isFinite(start) ? start : 0;
  const safeEnd = Number.isFinite(end) && end > safeStart ? end : safeStart + 10;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const totalRange = safeEnd - safeStart;

  const svgWidth = Math.max(200, width);
  const svgHeight = Math.max(70, height);
  const paddingX = 32;
  const hasJumps = jumps.length > 0;
  const lineY = hasJumps ? svgHeight * 0.62 : svgHeight * 0.52;
  const usableWidth = svgWidth - paddingX * 2;

  const getX = (val: number): number => {
    const fraction = (val - safeStart) / totalRange;
    return paddingX + Math.min(1, Math.max(0, fraction)) * usableWidth;
  };

  // Generate major ticks
  const ticks: number[] = [];
  for (let v = safeStart; v <= safeEnd + 0.0001; v += safeStep) {
    ticks.push(Math.round(v * 1000) / 1000);
  }

  // Generate minor sub-ticks if requested
  const minorTicks: number[] = [];
  if (subdivisions > 0) {
    const minorStep = safeStep / (subdivisions + 1);
    for (let v = safeStart; v <= safeEnd; v += minorStep) {
      const rounded = Math.round(v * 1000) / 1000;
      if (!ticks.includes(rounded)) {
        minorTicks.push(rounded);
      }
    }
  }

  const missingSet = new Set(missingPoints.map((p) => Math.round(p * 1000) / 1000));

  return (
    <div
      className={`relative select-none flex flex-col justify-center ${className}`}
      style={{ width: `${svgWidth}px`, minHeight: `${svgHeight}px`, ...style }}
    >
      {title && (
        <div className="flex items-center justify-between text-xs font-semibold px-2 mb-1 text-slate-700 dark:text-slate-300">
          <span>{title}</span>
          <span className="font-mono text-[10px] text-slate-400">
            [{safeStart} ... {safeEnd}]
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label={title || `Number line from ${safeStart} to ${safeEnd}`}
      >
        <defs>
          <marker
            id="nl-arrow-left"
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 10 1 L 0 5 L 10 9 z" fill={color} />
          </marker>
          <marker
            id="nl-arrow-right"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={color} />
          </marker>
        </defs>

        {/* Base Axis Line */}
        <line
          x1={paddingX - 14}
          y1={lineY}
          x2={svgWidth - paddingX + 14}
          y2={lineY}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          markerStart="url(#nl-arrow-left)"
          markerEnd="url(#nl-arrow-right)"
        />

        {/* Minor Sub-ticks */}
        {minorTicks.map((val, idx) => {
          const x = getX(val);
          return (
            <line
              key={`minor-tick-${val}-${idx}`}
              x1={x}
              y1={lineY - 4}
              x2={x}
              y2={lineY + 4}
              stroke="#94a3b8"
              strokeWidth="1"
            />
          );
        })}

        {/* Jump Arcs */}
        {jumps.map((jump, idx) => {
          const x1 = getX(jump.from);
          const x2 = getX(jump.to);
          const midX = (x1 + x2) / 2;
          const arcHeight = Math.min(36, Math.max(18, Math.abs(x2 - x1) * 0.28));
          const arcTopY = lineY - arcHeight;
          const jumpColor = jump.color || MATH_TOKENS.primary.indigoAccent;
          const isDashed = jump.style === "dashed";

          return (
            <g key={`jump-${jump.from}-${jump.to}-${idx}`}>
              <path
                d={`M ${x1} ${lineY - 2} Q ${midX} ${lineY - arcHeight * 1.5} ${x2} ${lineY - 2}`}
                fill="none"
                stroke={jumpColor}
                strokeWidth="2"
                strokeDasharray={isDashed ? "4,3" : undefined}
              />
              {/* Arrowhead on jump destination */}
              <circle cx={x2} cy={lineY - 2} r="3" fill={jumpColor} />
              {jump.label && (
                <text
                  x={midX}
                  y={arcTopY - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={jumpColor}
                >
                  {jump.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Major Ticks and Value Labels */}
        {ticks.map((val) => {
          const x = getX(val);
          const isMissing = missingSet.has(val);

          let labelText = String(val);
          if (fractions) {
            const denom = fractionDenominator || safeEnd;
            labelText = `${val}/${denom}`;
          }

          return (
            <g key={`tick-group-${val}`}>
              {/* Tick Mark */}
              <line
                x1={x}
                y1={lineY - 8}
                x2={x}
                y2={lineY + 8}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Number Label or Missing Point Box */}
              {isMissing && !showAnswer ? (
                <g key={`missing-box-${val}`}>
                  <rect
                    x={x - 11}
                    y={lineY + 12}
                    width="22"
                    height="18"
                    rx="4"
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="3,2"
                  />
                  <text
                    x={x}
                    y={lineY + 25}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#d97706"
                  >
                    ?
                  </text>
                </g>
              ) : (
                <text
                  x={x}
                  y={lineY + 22}
                  textAnchor="middle"
                  fontSize={ticks.length > 15 ? "9" : "11"}
                  fontWeight="600"
                  fill={isMissing ? "#d97706" : MATH_TOKENS.print.ink}
                >
                  {labelText}
                </text>
              )}
            </g>
          );
        })}

        {/* Highlighted Points */}
        {highlightedPoints.map((pt, idx) => {
          const val = typeof pt === "number" ? pt : pt.value;
          const label = typeof pt === "object" ? pt.label : undefined;
          const ptColor = typeof pt === "object" && pt.color ? pt.color : "#ef4444";
          const shape = typeof pt === "object" && pt.shape ? pt.shape : "circle";
          const x = getX(val);

          return (
            <g key={`highlight-${val}-${idx}`}>
              {shape === "circle" && (
                <circle
                  cx={x}
                  cy={lineY}
                  r="5.5"
                  fill={ptColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              {shape === "arrow" && (
                <polygon
                  points={`${x},${lineY - 14} ${x - 5},${lineY - 22} ${x + 5},${lineY - 22}`}
                  fill={ptColor}
                />
              )}
              {shape === "star" && (
                <polygon
                  points={`${x},${lineY - 8} ${x + 2},${lineY - 2} ${x + 8},${lineY - 2} ${x + 3},${lineY + 2} ${x + 5},${lineY + 8} ${x},${lineY + 4} ${x - 5},${lineY + 8} ${x - 3},${lineY + 2} ${x - 8},${lineY - 2} ${x - 2},${lineY - 2}`}
                  fill={ptColor}
                />
              )}
              {label && (
                <text
                  x={x}
                  y={lineY - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={ptColor}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
