import React from "react";
import { MATH_TOKENS } from "../../tokens";

export type IndianCoinDenomination = 1 | 2 | 5 | 10 | 20;
export type IndianNoteDenomination = 10 | 20 | 50 | 100 | 200 | 500;

export interface CoinNoteProps {
  type: "coin" | "note";
  denomination: number;
  count?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const NOTE_PALETTES: Record<number, { bg: string; border: string; accent: string; text: string }> = {
  10: { bg: "#f5e6d3", border: "#8b5a2b", accent: "#d7b48c", text: "#5c3a21" }, // Chocolate Brown
  20: { bg: "#f7f9d0", border: "#827717", accent: "#cddc39", text: "#4c4809" }, // Greenish Yellow
  50: { bg: "#e0f7fa", border: "#00838f", accent: "#80deea", text: "#006064" }, // Fluorescent Blue
  100: { bg: "#ede7f6", border: "#5e35b1", accent: "#b39ddb", text: "#4527a0" }, // Lavender
  200: { bg: "#fff8e1", border: "#f57f17", accent: "#ffe082", text: "#bf360c" }, // Bright Orange-Yellow
  500: { bg: "#eceff1", border: "#455a64", accent: "#b0bec5", text: "#263238" }, // Stone Grey
};

/**
 * Shared synchronous, hook-free CoinNote primitive.
 * Realistic vector representations of Indian Rupee coins (₹1, ₹2, ₹5, ₹10, ₹20)
 * and banknotes (₹10, ₹20, ₹50, ₹100, ₹200, ₹500).
 */
export const CoinNote: React.FC<CoinNoteProps> = ({
  type,
  denomination,
  count = 1,
  size,
  className = "",
  style,
}) => {
  const safeCount = Math.max(1, Math.min(20, count));

  if (type === "coin") {
    const coinSize = size || (denomination === 1 ? 40 : denomination === 2 ? 44 : denomination === 5 ? 46 : 50);

    return (
      <div
        className={`inline-flex items-center gap-1 select-none ${className}`}
        style={style}
      >
        {Array.from({ length: safeCount }).map((_, idx) => {
          const isBiMetallic10 = denomination === 10;
          const isBiMetallic20 = denomination === 20;
          const isGold = denomination === 5;
          const isSilver = denomination === 1 || denomination === 2;

          const baseOuterFill = isBiMetallic10 || isBiMetallic20
            ? "#d4af37" // Brass outer ring
            : isGold
            ? "#eab308"
            : isSilver
            ? "#e2e8f0"
            : "#cbd5e1";

          const baseInnerFill = isBiMetallic10 || isBiMetallic20
            ? "#e2e8f0" // Silver inner core
            : baseOuterFill;

          return (
            <svg
              key={`coin-${denomination}-${idx}`}
              width={coinSize}
              height={coinSize}
              viewBox="0 0 60 60"
              className="overflow-visible"
              role="img"
              aria-label={`₹${denomination} coin`}
            >
              {/* Outer rim */}
              {isBiMetallic20 ? (
                // 12-sided dodecagon outer edge
                <polygon
                  points="30,2 44,6 54,16 58,30 54,44 44,54 30,58 16,54 6,44 2,30 6,16 16,6"
                  fill={baseOuterFill}
                  stroke={MATH_TOKENS.print.ink}
                  strokeWidth="2"
                />
              ) : (
                <circle
                  cx="30"
                  cy="30"
                  r="27"
                  fill={baseOuterFill}
                  stroke={MATH_TOKENS.print.ink}
                  strokeWidth="2.5"
                />
              )}

              {/* Inner ring for bimetallic ₹10/₹20 coins or decorative ridge */}
              {(isBiMetallic10 || isBiMetallic20) && (
                <circle
                  cx="30"
                  cy="30"
                  r="18"
                  fill={baseInnerFill}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
              )}

              {/* Decorative inner dotted border */}
              <circle
                cx="30"
                cy="30"
                r={isBiMetallic10 || isBiMetallic20 ? 15 : 23}
                fill="none"
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* Rupee Symbol ₹ and Denomination */}
              <text
                x="30"
                y="27"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
                fill={MATH_TOKENS.print.ink}
              >
                ₹
              </text>
              <text
                x="30"
                y="42"
                textAnchor="middle"
                fontSize={denomination >= 10 ? "15" : "17"}
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                fill={MATH_TOKENS.print.ink}
              >
                {denomination}
              </text>
            </svg>
          );
        })}
      </div>
    );
  }

  // Banknote renderer
  const noteWidth = size || 135;
  const noteHeight = noteWidth * 0.52;
  const palette = NOTE_PALETTES[denomination] || NOTE_PALETTES[100];

  return (
    <div
      className={`inline-flex flex-col items-center gap-1 select-none ${className}`}
      style={style}
    >
      {Array.from({ length: safeCount }).map((_, idx) => (
        <svg
          key={`note-${denomination}-${idx}`}
          width={noteWidth}
          height={noteHeight}
          viewBox="0 0 160 84"
          className="overflow-visible"
          role="img"
          aria-label={`₹${denomination} note`}
        >
          {/* Note Outer Border */}
          <rect
            x="2"
            y="2"
            width="156"
            height="80"
            rx="4"
            fill={palette.bg}
            stroke={palette.border}
            strokeWidth="2.5"
          />

          {/* Intricate Inner Border */}
          <rect
            x="6"
            y="6"
            width="148"
            height="72"
            rx="2"
            fill="none"
            stroke={palette.border}
            strokeWidth="1"
            strokeDasharray="4,2"
          />

          {/* Watermark Oval (Gandhi silhouette placeholder) */}
          <ellipse
            cx="32"
            cy="42"
            rx="18"
            ry="24"
            fill="#ffffff"
            stroke={palette.accent}
            strokeWidth="1.2"
          />
          <text
            x="32"
            y="46"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill={palette.accent}
          >
            ₹
          </text>

          {/* Security Thread */}
          <line
            x1="62"
            y1="6"
            x2="62"
            y2="78"
            stroke="#047857"
            strokeWidth="1.8"
            strokeDasharray="5,3"
          />

          {/* Central Reserve Bank of India Header */}
          <text
            x="102"
            y="18"
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            fill={palette.text}
          >
            RESERVE BANK OF INDIA
          </text>

          {/* Center Rupee Symbol & Denomination */}
          <text
            x="102"
            y="45"
            textAnchor="middle"
            fontSize="22"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            fill={palette.text}
          >
            ₹{denomination}
          </text>

          {/* Corner Denomination Numerals */}
          <text
            x="14"
            y="18"
            fontSize="9"
            fontWeight="bold"
            fill={palette.text}
          >
            {denomination}
          </text>
          <text
            x="138"
            y="72"
            fontSize="10"
            fontWeight="bold"
            fill={palette.text}
          >
            {denomination}
          </text>
        </svg>
      ))}
    </div>
  );
};
