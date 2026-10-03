import React from "react";
import { MATH_TOKENS } from "../../tokens";

export type CalloutVariant = "example" | "remember" | "try-it" | "note" | "definition" | "tip";

export interface CalloutBoxProps {
  variant?: CalloutVariant;
  title?: string;
  stepNumber?: number | string;
  icon?: string;
  children?: React.ReactNode;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_CONFIGS: Record<CalloutVariant, {
  border: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  defaultTitle: string;
  defaultIcon: string;
}> = {
  example: {
    border: "#3b82f6", // Blue
    bg: "#eff6ff",
    badgeBg: "#1d4ed8",
    badgeText: "#ffffff",
    defaultTitle: "EXAMPLE",
    defaultIcon: "📖",
  },
  remember: {
    border: "#f59e0b", // Amber
    bg: "#fffbeb",
    badgeBg: "#d97706",
    badgeText: "#ffffff",
    defaultTitle: "REMEMBER",
    defaultIcon: "💡",
  },
  "try-it": {
    border: "#10b981", // Emerald
    bg: "#ecfdf5",
    badgeBg: "#059669",
    badgeText: "#ffffff",
    defaultTitle: "TRY THIS",
    defaultIcon: "✏️",
  },
  note: {
    border: "#6366f1", // Indigo
    bg: "#eef2ff",
    badgeBg: "#4f46e5",
    badgeText: "#ffffff",
    defaultTitle: "NOTE",
    defaultIcon: "📌",
  },
  definition: {
    border: "#8b5cf6", // Purple
    bg: "#f5f3ff",
    badgeBg: "#7c3aed",
    badgeText: "#ffffff",
    defaultTitle: "DEFINITION",
    defaultIcon: "📐",
  },
  tip: {
    border: "#06b6d4", // Cyan
    bg: "#ecfeff",
    badgeBg: "#0891b2",
    badgeText: "#ffffff",
    defaultTitle: "QUICK TIP",
    defaultIcon: "⚡",
  },
};

/**
 * Shared synchronous, hook-free CalloutBox primitive.
 * Standard pedagogical textbook box (Example, Remember, Try-it, Note)
 * with colored left accent border and pill badge.
 */
export const CalloutBox: React.FC<CalloutBoxProps> = ({
  variant = "example",
  title,
  stepNumber,
  icon,
  children,
  width = "100%",
  className = "",
  style,
}) => {
  const conf = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.example;
  const displayTitle = title || (stepNumber ? `${conf.defaultTitle} ${stepNumber}` : conf.defaultTitle);
  const displayIcon = icon || conf.defaultIcon;

  return (
    <div
      className={`rounded-lg p-3 text-sm select-none border-l-4 ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        backgroundColor: conf.bg,
        borderLeftColor: conf.border,
        borderTop: `1px solid ${conf.border}40`,
        borderRight: `1px solid ${conf.border}40`,
        borderBottom: `1px solid ${conf.border}40`,
        ...style,
      }}
    >
      {/* Header Pill Badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-xs"
          style={{ backgroundColor: conf.badgeBg, color: conf.badgeText }}
        >
          <span>{displayIcon}</span>
          <span>{displayTitle}</span>
        </span>
      </div>

      {/* Body Content */}
      <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
        {children}
      </div>
    </div>
  );
};
