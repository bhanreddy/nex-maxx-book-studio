/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - PLACE VALUE & NUMBER SENSE RENDERERS
// Production-quality vector components for Classes 1 to 5
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { MATH_TOKENS } from "../tokens";
import {
  formatIndianNumber,
  formatInternationalNumber,
  getIndianPlaceValueBreakdown,
  getInternationalPlaceValueBreakdown,
  getExpandedForm,
  numberToIndianWords,
  getBase10Blocks,
  parseMathNumber,
} from "../mathAlgorithms";

/**
 * 01 & 02 & 03. Place Value Table (Indian & International)
 */
export const PlaceValueTableRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
  styleVariant,
  width,
}) => {
  const num = data.number ?? 872904;
  const system = data.system ?? "indian";
  const showPeriods = data.showPeriods !== false;
  const showValueRow = data.showValueRow !== false;
  const showPlaceNames = data.showPlaceNames !== false;

  const columns = system === "indian"
    ? getIndianPlaceValueBreakdown(num)
    : getInternationalPlaceValueBreakdown(num);

  // Group columns by period
  const periods: Array<{ name: string; span: number }> = [];
  columns.forEach((col) => {
    const last = periods[periods.length - 1];
    if (last && last.name === col.period) {
      last.span += 1;
    } else {
      periods.push({ name: col.period, span: 1 });
    }
  });

  const isColorCoded = styleVariant === "color-coded";
  const isVisual = styleVariant === "visual";

  return (
    <div
      className={`w-full h-full flex flex-col justify-center select-none overflow-hidden rounded-xl border ${
        isColorCoded
          ? "border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm"
          : isVisual
          ? "border-slate-200 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-950 shadow-md"
          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
      }`}
      style={{ minHeight: 90 }}
    >
      <div className="w-full h-full flex flex-col">
        {/* Period Row */}
        {showPeriods && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/60 text-[9px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400">
            {periods.map((p, idx) => (
              <div
                key={idx}
                style={{ flex: p.span }}
                className="py-1 px-1.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-700"
              >
                {p.name}
              </div>
            ))}
          </div>
        )}

        {/* Place Names / Symbols Row */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
          {columns.map((col, idx) => {
            const placeConfig = MATH_TOKENS.placeColors[col.key] || {
              bg: "#f1f5f9",
              text: "#334155",
            };
            return (
              <div
                key={idx}
                className="flex-1 py-1 px-0.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center"
                style={{
                  backgroundColor: isColorCoded ? placeConfig.bg : undefined,
                  color: isColorCoded ? placeConfig.text : undefined,
                }}
              >
                <span className="font-bold text-[11px] font-mono">{col.key}</span>
                {showPlaceNames && width > 280 && (
                  <span className="text-[7.5px] opacity-80 leading-none truncate max-w-full">
                    {col.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Digits Row */}
        <div className="flex flex-1 items-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-center">
          {columns.map((col, idx) => {
            const isBlank = mode === "student" && (data.blankIndices?.includes(idx) ?? idx % 2 === 1);
            return (
              <div
                key={idx}
                className="flex-1 h-full flex items-center justify-center border-r last:border-r-0 border-slate-200 dark:border-slate-700 px-1 py-1"
              >
                {isBlank ? (
                  <div className="w-6 h-7 rounded border-2 border-dashed border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-center text-xs font-normal text-indigo-400">
                    ?
                  </div>
                ) : (
                  <span className="font-mono text-base md:text-lg">{col.digit}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Expanded Value Row (Optional) */}
        {showValueRow && (
          <div className="flex border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 text-[8.5px] font-mono text-slate-500 dark:text-slate-400">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="flex-1 py-1 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-700 overflow-hidden px-0.5 truncate"
              >
                {system === "indian"
                  ? formatIndianNumber(col.placeValue)
                  : formatInternationalNumber(col.placeValue)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 09. Expanded Form Builder
 * e.g. 54,326 = 50,000 + 4,000 + 300 + 20 + 6
 */
export const ExpandedFormRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
  styleVariant,
}) => {
  const num = data.number ?? 54326;
  const system = data.system ?? "indian";
  const items = getExpandedForm(num, system);
  const formattedStandard = system === "indian" ? formatIndianNumber(num) : formatInternationalNumber(num);

  return (
    <div className="w-full h-full flex flex-col justify-center p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/30 via-white to-purple-50/20 dark:from-slate-900 dark:to-slate-950 select-none">
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-mono font-bold text-sm shadow-sm">
          {formattedStandard}
        </div>
        <span className="font-bold text-slate-400 text-base">=</span>
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {items.map((it, idx) => {
            const isBlank = mode === "student" && idx === Math.floor(items.length / 2);
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="font-bold text-slate-400 text-sm">+</span>}
                {isBlank ? (
                  <span className="px-3 py-1 rounded-md border-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-500 font-mono text-xs">
                    ______
                  </span>
                ) : (
                  <span
                    className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold ${
                      styleVariant === "color-coded"
                        ? "bg-indigo-50 text-indigo-900 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200"
                        : "bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {it.valueFormatted}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 11. Number Name Builder
 */
export const NumberNameRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const num = data.number ?? 742510;
  const words = numberToIndianWords(num);
  const formatted = formatIndianNumber(num);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Standard Numeral
        </span>
        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          {formatted}
        </span>
      </div>
      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
          Number in Words:
        </span>
        {mode === "student" ? (
          <div className="h-6 border-b-2 border-dashed border-slate-300 dark:border-slate-600 flex items-end">
            <span className="text-[10px] text-slate-400 italic">Write the number name here...</span>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
            {words}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * 13. Number Discs Representation
 * Discs with values (10000, 1000, 100, 10, 1) grouped by place
 */
export const NumberDiscsRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const num = data.number ?? 3425;
  const columns = getIndianPlaceValueBreakdown(num).filter((c) => c.digit > 0);

  return (
    <div className="w-full h-full flex flex-col justify-around p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Number Discs Model
        </span>
        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
          {formatIndianNumber(num)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center items-center py-1">
        {columns.map((col, idx) => {
          const placeConfig = MATH_TOKENS.placeColors[col.key] || {
            disc: "#6366f1",
            text: "#ffffff",
          };
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
            >
              <span className="text-[9px] font-bold text-slate-500">{col.key}</span>
              <div className="flex flex-wrap gap-1 max-w-[80px] justify-center">
                {Array.from({ length: col.digit }).map((_, dIdx) => (
                  <div
                    key={dIdx}
                    style={{ backgroundColor: placeConfig.disc }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-mono font-bold shadow-xs border border-white/40"
                  >
                    {col.power >= 1000 ? `${col.power / 1000}k` : col.power}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 14. Base-10 Blocks Representation
 */
export const Base10BlocksRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const num = data.number ?? 2435;
  const { thousands, hundreds, tens, ones } = getBase10Blocks(num);

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Base-10 Blocks</span>
        <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatIndianNumber(num)}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center py-1 flex-1">
        {/* Thousands Cube */}
        <div className="p-1 rounded bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col items-center justify-between">
          <span className="text-[8px] font-bold text-rose-700 dark:text-rose-300">Thousands</span>
          <svg className="w-8 h-8" viewBox="0 0 32 32">
            <path d="M 16 2 L 30 8 L 16 14 L 2 8 Z" fill="#fda4af" stroke="#e11d48" strokeWidth="1" />
            <path d="M 2 8 L 16 14 L 16 30 L 2 24 Z" fill="#fb7185" stroke="#e11d48" strokeWidth="1" />
            <path d="M 16 14 L 30 8 L 30 24 L 16 30 Z" fill="#f43f5e" stroke="#e11d48" strokeWidth="1" />
          </svg>
          <span className="font-mono font-bold text-xs text-rose-800 dark:text-rose-200">×{thousands}</span>
        </div>
        {/* Hundreds Flat */}
        <div className="p-1 rounded bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col items-center justify-between">
          <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300">Hundreds</span>
          <svg className="w-8 h-8" viewBox="0 0 32 32">
            <rect x="4" y="4" width="24" height="24" rx="1" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
            <line x1="12" y1="4" x2="12" y2="28" stroke="#f59e0b" strokeWidth="0.5" />
            <line x1="20" y1="4" x2="20" y2="28" stroke="#f59e0b" strokeWidth="0.5" />
            <line x1="4" y1="12" x2="28" y2="12" stroke="#f59e0b" strokeWidth="0.5" />
            <line x1="4" y1="20" x2="28" y2="20" stroke="#f59e0b" strokeWidth="0.5" />
          </svg>
          <span className="font-mono font-bold text-xs text-amber-800 dark:text-amber-200">×{hundreds}</span>
        </div>
        {/* Tens Rod */}
        <div className="p-1 rounded bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 flex flex-col items-center justify-between">
          <span className="text-[8px] font-bold text-sky-700 dark:text-sky-300">Tens</span>
          <svg className="w-8 h-8" viewBox="0 0 32 32">
            <rect x="13" y="2" width="6" height="28" rx="1" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
          </svg>
          <span className="font-mono font-bold text-xs text-sky-800 dark:text-sky-200">×{tens}</span>
        </div>
        {/* Ones Unit */}
        <div className="p-1 rounded bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col items-center justify-between">
          <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-300">Ones</span>
          <svg className="w-8 h-8" viewBox="0 0 32 32">
            <rect x="12" y="12" width="8" height="8" rx="1" fill="#d1fae5" stroke="#059669" strokeWidth="1" />
          </svg>
          <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-200">×{ones}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 23. Number Comparison (<, >, =)
 */
export const NumberComparisonRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const left = parseMathNumber(data.num1 ?? 45620);
  const right = parseMathNumber(data.num2 ?? 45260);

  const symbol = left > right ? ">" : left < right ? "<" : "=";

  return (
    <div className="w-full h-full flex items-center justify-around p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 font-mono font-bold text-base text-indigo-900 dark:text-indigo-200 shadow-xs">
        {formatIndianNumber(left)}
      </div>
      <div className="w-10 h-10 rounded-full border-2 border-indigo-400 bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-300 shadow-sm">
        {mode === "student" ? "?" : symbol}
      </div>
      <div className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 font-mono font-bold text-base text-indigo-900 dark:text-indigo-200 shadow-xs">
        {formatIndianNumber(right)}
      </div>
    </div>
  );
};

/**
 * 26. Before / After / Between
 */
export const BeforeAfterRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const center = parseMathNumber(data.number ?? 8450);
  const before = center - 1;
  const after = center + 1;

  return (
    <div className="w-full h-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex-1 text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">BEFORE</span>
        <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
          {mode === "student" ? "____" : formatIndianNumber(before)}
        </span>
      </div>
      <div className="flex-1 text-center p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
        <span className="text-[8px] font-bold text-indigo-200 block mb-0.5">NUMBER</span>
        <span className="font-mono font-bold text-xs">{formatIndianNumber(center)}</span>
      </div>
      <div className="flex-1 text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">AFTER</span>
        <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
          {mode === "student" ? "____" : formatIndianNumber(after)}
        </span>
      </div>
    </div>
  );
};

/**
 * 30. Skip Counting
 */
export const SkipCountingRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const start = parseMathNumber(data.start ?? 20);
  const step = parseMathNumber(data.step ?? 5);
  const count = Math.min(8, Math.max(4, parseMathNumber(data.count ?? 5)));

  const numbers = Array.from({ length: count }, (_, i) => start + i * step);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
          Skip Counting by {step}
        </span>
        <span className="text-[8px] font-mono text-slate-400 font-bold">+{step} RULE</span>
      </div>
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
        {numbers.map((val, idx) => {
          const isBlank = mode === "student" && idx >= count - 2;
          return (
            <div
              key={idx}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center font-mono font-bold text-xs border ${
                isBlank
                  ? "border-2 border-dashed border-amber-400 bg-amber-50/50 text-amber-500"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              }`}
            >
              {isBlank ? "?" : formatIndianNumber(val)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
