import React from "react";
import { MATH_TOKENS } from "../../tokens";

export interface PictographItem {
  label: string;
  count: number;
}

export interface PictographProps {
  items: PictographItem[];
  keyUnit?: number;
  keyLabel?: string;
  icon?: "star" | "apple" | "circle" | "smile" | "book";
  title?: string;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free Pictograph primitive.
 * Tabular pictograph with custom SVG icon repeats, fractional symbol support,
 * and standard textbook legend key.
 */
export const Pictograph: React.FC<PictographProps> = ({
  items = [
    { label: "Monday", count: 10 },
    { label: "Tuesday", count: 15 },
    { label: "Wednesday", count: 5 },
    { label: "Thursday", count: 20 },
  ],
  keyUnit = 5,
  keyLabel,
  icon = "star",
  title,
  width = 340,
  className = "",
  style,
}) => {
  const safeUnit = Math.max(1, keyUnit);

  /** Render individual SVG icon */
  const renderIcon = (key: string, isHalf = false) => {
    const iconSize = 22;
    const clipId = `half-clip-${key}`;

    return (
      <svg
        key={key}
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        className="inline-block"
      >
        {isHalf && (
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
        )}
        <g clipPath={isHalf ? `url(#${clipId})` : undefined}>
          {icon === "star" && (
            <polygon
              points="12,2 15,8 22,9 17,14 18,21 12,17 6,21 7,14 2,9 9,8"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1.5"
            />
          )}
          {icon === "apple" && (
            <g>
              <circle cx="12" cy="14" r="8" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
              <path d="M 12 6 Q 14 3 17 4" fill="none" stroke="#15803d" strokeWidth="2" />
            </g>
          )}
          {icon === "smile" && (
            <g>
              <circle cx="12" cy="12" r="9" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
              <circle cx="9" cy="10" r="1.5" fill="#1e293b" />
              <circle cx="15" cy="10" r="1.5" fill="#1e293b" />
              <path d="M 8 14 Q 12 18 16 14" fill="none" stroke="#1e293b" strokeWidth="1.5" />
            </g>
          )}
          {icon === "book" && (
            <g>
              <rect x="4" y="5" width="16" height="14" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
              <line x1="12" y1="5" x2="12" y2="19" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}
          {icon === "circle" && (
            <circle cx="12" cy="12" r="8" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1.5" />
          )}
        </g>
      </svg>
    );
  };

  return (
    <div
      className={`inline-flex flex-col gap-2 select-none border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900 ${className}`}
      style={{ width: `${width}px`, ...style }}
    >
      {title && (
        <div className="text-center text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>{title}</span>
        </div>
      )}

      {/* Pictograph Table */}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="text-left font-bold py-1.5 px-2 text-slate-700 dark:text-slate-300 w-1/3">
              <span>Category</span>
            </th>
            <th className="text-left font-bold py-1.5 px-2 text-slate-700 dark:text-slate-300">
              <span>Pictograph</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, rowIdx) => {
            const wholeIcons = Math.floor(item.count / safeUnit);
            const remainder = item.count % safeUnit;
            const hasHalf = remainder >= safeUnit / 2;

            return (
              <tr
                key={`picto-row-${rowIdx}-${item.label}`}
                className="border-b border-slate-100 dark:border-slate-800/60"
              >
                <td className="py-2 px-2 font-medium text-slate-700 dark:text-slate-300">
                  <span>{item.label}</span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: wholeIcons }).map((_, i) =>
                      renderIcon(`icon-${rowIdx}-${i}`, false)
                    )}
                    {hasHalf && renderIcon(`icon-half-${rowIdx}`, true)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Key / Legend Banner */}
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <span>{keyLabel || `Key: Each`}</span>
        {renderIcon("legend-key-icon", false)}
        <span>= {safeUnit}</span>
      </div>
    </div>
  );
};
