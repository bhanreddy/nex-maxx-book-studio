"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface PropertyScrubberProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  unit?: string;
  onChange: (value: number, isFinal: boolean) => void;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const PropertyScrubber: React.FC<PropertyScrubberProps> = ({
  label,
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  decimals = 0,
  unit = "",
  onChange,
  className = "",
  title,
  icon,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(String(value));
  const startXRef = useRef(0);
  const startValRef = useRef(value);
  const currentValRef = useRef(value);

  useEffect(() => {
    if (!isEditing && !isDragging) {
      setTextValue(String(Number(value.toFixed(decimals))));
      currentValRef.current = value;
    }
  }, [value, decimals, isEditing, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    startXRef.current = e.clientX;
    startValRef.current = value;
    currentValRef.current = value;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    const multiplier = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    const change = deltaX * step * 0.5 * multiplier;
    let next = startValRef.current + change;
    next = Math.max(min, Math.min(max, next));
    const factor = Math.pow(10, decimals);
    next = Math.round(next * factor) / factor;

    if (next !== currentValRef.current) {
      currentValRef.current = next;
      setTextValue(String(next));
      onChange(next, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    onChange(currentValRef.current, true);
  };

  const commitManualInput = () => {
    setIsEditing(false);
    let num = parseFloat(textValue);
    if (isNaN(num)) num = value;
    num = Math.max(min, Math.min(max, num));
    const factor = Math.pow(10, decimals);
    num = Math.round(num * factor) / factor;
    setTextValue(String(num));
    onChange(num, true);
  };

  return (
    <div
      className={`flex items-center justify-between text-xs py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 border border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20 transition-all ${
        isDragging ? "ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 cursor-ew-resize" : ""
      } ${className}`}
      title={title || `Drag horizontally to scrub ${label}, or click number to type`}
    >
      {/* Draggable Label / Scrubber Zone */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex items-center gap-1.5 cursor-ew-resize select-none text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex-1 overflow-hidden pr-1"
      >
        {icon && <span className="opacity-70 flex-shrink-0">{icon}</span>}
        <span className="font-mono text-[10px] uppercase tracking-wider truncate font-medium">
          {label}
        </span>
      </div>

      {/* Numeric Input / Display */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={commitManualInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitManualInput();
              if (e.key === "Escape") {
                setIsEditing(false);
                setTextValue(String(value));
              }
            }}
            className="w-12 bg-white dark:bg-black/60 border border-indigo-500 rounded px-1 py-0.5 text-right font-mono text-[11px] text-slate-900 dark:text-white outline-none shadow-xs"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="font-mono text-[11px] text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white cursor-text px-1 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors font-medium min-w-[28px] text-right"
          >
            {value}
            {unit && <span className="text-slate-500 dark:text-slate-400 ml-0.5 text-[9px]">{unit}</span>}
          </span>
        )}
      </div>
    </div>
  );
};
