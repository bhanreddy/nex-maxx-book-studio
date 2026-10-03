"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface SmartScrubInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  precision?: number;
  className?: string;
  title?: string;
}

export const SmartScrubInput: React.FC<SmartScrubInputProps> = ({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  precision = 0,
  className = "",
  title,
}) => {
  const [localStr, setLocalStr] = useState<string>(
    isNaN(value) ? "0" : value.toFixed(precision)
  );
  const [isFocused, setIsFocused] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const startXRef = useRef(0);
  const startValRef = useRef(0);

  // Sync external value when not actively typing
  useEffect(() => {
    if (!isFocused && !isScrubbing) {
      setLocalStr(isNaN(value) ? "0" : value.toFixed(precision));
    }
  }, [value, precision, isFocused, isScrubbing]);

  const clampAndRound = useCallback(
    (val: number) => {
      let result = val;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      return precision > 0
        ? parseFloat(result.toFixed(precision))
        : Math.round(result);
    },
    [min, max, precision]
  );

  // Mouse Drag Scrubbing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startValRef.current = isNaN(value) ? 0 : value;
    setIsScrubbing(true);

    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const multiplier = moveEvent.shiftKey ? 10 : moveEvent.altKey ? 0.1 : 1;
      const change = deltaX * step * multiplier;
      const nextVal = clampAndRound(startValRef.current + change);
      onChange(nextVal);
      setLocalStr(nextVal.toString());
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localStr);
    if (!isNaN(parsed)) {
      const clamped = clampAndRound(parsed);
      onChange(clamped);
      setLocalStr(clamped.toString());
    } else {
      setLocalStr(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const nextVal = clampAndRound(value + step * mult);
      onChange(nextVal);
      setLocalStr(nextVal.toString());
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const nextVal = clampAndRound(value - step * mult);
      onChange(nextVal);
      setLocalStr(nextVal.toString());
    } else if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={`group/scrub flex items-center bg-slate-100 hover:bg-slate-200/80 dark:bg-[#070b13]/80 dark:hover:bg-[#070b13] border border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/40 rounded-lg px-2 py-1 text-xs font-mono transition-all ${
        isScrubbing ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/50" : ""
      } ${className}`}
      title={title || `Drag ${label} horizontally to scrub value. Shift for 10x.`}
    >
      <span
        onMouseDown={handleMouseDown}
        className={`scrub-label text-[10px] font-bold tracking-wider select-none pr-1.5 transition-colors ${
          isScrubbing
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-600 dark:text-slate-400 group-hover/scrub:text-slate-900 dark:group-hover/scrub:text-slate-200"
        }`}
      >
        {label}
      </span>

      <input
        type="text"
        value={localStr}
        onChange={(e) => setLocalStr(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-[11px] font-mono outline-none text-right placeholder-slate-400 dark:placeholder-slate-600"
      />

      {unit && (
        <span className="text-[9px] text-slate-500 dark:text-slate-400 select-none pl-0.5">
          {unit}
        </span>
      )}
    </div>
  );
};
