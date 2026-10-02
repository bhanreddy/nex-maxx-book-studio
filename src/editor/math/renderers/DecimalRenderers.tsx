// ============================================================================
// NEX MAXX BOOK STUDIO - DECIMAL TOOLKIT RENDERERS (CLASSES 4 & 5)
// Fully parametric vector decimal place value charts, 10x10 grids, converters & columns
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { parseMathNumber, formatIndianNumber } from "../mathAlgorithms";

/**
 * 12. Decimal Place Value Chart
 * Thousands | Hundreds | Tens | Ones | . | Tenths | Hundredths | Thousandths
 */
export const DecimalPlaceValueRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
  styleVariant,
  width,
}) => {
  const decimalStr = String(data.number ?? "34.75");
  const [wholePart = "0", fracPart = "0"] = decimalStr.split(".");
  const showFractionBadges = data.showFractionBadges !== false;

  const wholeDigits = wholePart.padStart(3, "0").slice(-3).split(""); // H, T, O
  const fracDigits = fracPart.padEnd(3, "0").slice(0, 3).split(""); // Tenths, Hundredths, Thousandths

  const columns = [
    { label: "Hundreds", symbol: "H", frac: "100", digit: wholeDigits[0], color: "#4f46e5" },
    { label: "Tens", symbol: "T", frac: "10", digit: wholeDigits[1], color: "#6366f1" },
    { label: "Ones", symbol: "O", frac: "1", digit: wholeDigits[2], color: "#818cf8" },
    { label: "Point", symbol: "•", frac: ".", digit: ".", isPoint: true, color: "#ef4444" },
    { label: "Tenths", symbol: "t", frac: "1/10", digit: fracDigits[0], color: "#06b6d4" },
    { label: "Hundredths", symbol: "h", frac: "1/100", digit: fracDigits[1], color: "#0891b2" },
    { label: "Thousandths", symbol: "th", frac: "1/1000", digit: fracDigits[2], color: "#0e7490" },
  ];

  const isColorCoded = styleVariant === "color-coded";

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1 px-1">
        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Decimal Place Value Chart</span>
        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
          {mode === "student" ? "____.___" : decimalStr}
        </span>
      </div>

      <div className="flex-1 w-full flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {/* Top Header Row (Symbols / Names) */}
        <div className="flex bg-slate-100 dark:bg-slate-800 text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
          {columns.map((col, idx) => (
            <div
              key={idx}
              className={`text-center py-1 border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${
                col.isPoint ? "w-6 bg-rose-50 dark:bg-rose-950/30 text-rose-600 font-extrabold" : "flex-1"
              }`}
              style={{ color: isColorCoded && !col.isPoint ? col.color : undefined }}
            >
              <div className="font-mono">{col.symbol}</div>
              {width > 320 && !col.isPoint && (
                <div className="text-[7px] font-sans font-medium text-slate-400 truncate px-0.5">
                  {col.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Fraction Value Row (e.g. 100, 10, 1, 1/10, 1/100) */}
        {showFractionBadges && (
          <div className="flex bg-slate-50 dark:bg-slate-800/50 text-[8px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-700">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className={`text-center py-0.5 border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${
                  col.isPoint ? "w-6 text-rose-500 font-bold" : "flex-1"
                }`}
              >
                {col.frac}
              </div>
            ))}
          </div>
        )}

        {/* Digit Values Row */}
        <div className="flex flex-1 items-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base md:text-lg">
          {columns.map((col, idx) => {
            const isBlank = mode === "student" && !col.isPoint && (idx === 4 || idx === 5);
            return (
              <div
                key={idx}
                className={`h-full flex items-center justify-center border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${
                  col.isPoint ? "w-6 text-rose-600 font-black text-xl bg-rose-50/50 dark:bg-rose-950/20" : "flex-1"
                }`}
              >
                {isBlank ? (
                  <span className="w-5 h-6 rounded border-2 border-dashed border-cyan-400 bg-cyan-50/40 text-cyan-500 text-xs font-normal flex items-center justify-center">
                    ?
                  </span>
                ) : (
                  col.digit
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 12. Decimal 10x10 Hundredths Grid
 * Visual representation of decimals as shaded cells out of 100
 */
export const DecimalGridRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const decimalVal = Math.min(1, Math.max(0, parseFloat(String(data.value ?? 0.35))));
  const shadedCount = Math.round(decimalVal * 100);

  return (
    <div className="w-full h-full flex items-center justify-around p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* 10x10 Grid */}
      <div className="w-28 h-28 border-2 border-cyan-600 rounded bg-slate-100 dark:bg-slate-800 grid grid-cols-10 grid-rows-10 gap-[0.5px] p-0.5 overflow-hidden shadow-xs">
        {Array.from({ length: 100 }).map((_, idx) => {
          const isShaded = idx < shadedCount;
          return (
            <div
              key={idx}
              className={`w-full h-full transition-colors ${
                isShaded ? "bg-cyan-600" : "bg-white dark:bg-slate-900"
              }`}
            />
          );
        })}
      </div>

      {/* Legend & Value */}
      <div className="flex flex-col items-center justify-center font-mono">
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">
          Decimal Value
        </span>
        <div className="px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 font-bold text-base shadow-xs">
          {mode === "student" ? "0.__" : decimalVal.toFixed(2)}
        </div>
        <span className="text-[9px] text-slate-500 mt-1 font-sans">
          {shadedCount} / 100 hundredths
        </span>
      </div>
    </div>
  );
};

/**
 * 12. Fraction <-> Decimal Equivalence Converter
 */
export const FractionDecimalConverterRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const numerator = parseMathNumber(data.numerator ?? 3);
  const denominator = parseMathNumber(data.denominator ?? 10);
  const decimal = (numerator / Math.max(1, denominator)).toFixed(denominator === 10 ? 1 : 2);

  return (
    <div className="w-full h-full flex items-center justify-around p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none font-mono">
      {/* Fraction Box */}
      <div className="flex flex-col items-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{numerator}</span>
        <div className="w-8 h-0.5 bg-indigo-400 my-0.5" />
        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{denominator}</span>
      </div>

      {/* Arrow with Operation */}
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-slate-400">⇄</span>
        <span className="text-[7.5px] text-slate-400 uppercase">EQUALS</span>
      </div>

      {/* Decimal Box */}
      <div className="px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 font-bold text-sm shadow-xs">
        {mode === "student" ? "0.__" : decimal}
      </div>
    </div>
  );
};

/**
 * 12. Decimal Comparison (<, >, =)
 */
export const DecimalComparisonRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const d1 = parseFloat(String(data.val1 ?? "0.45"));
  const d2 = parseFloat(String(data.val2 ?? "0.5"));
  const symbol = d1 > d2 ? ">" : d1 < d2 ? "<" : "=";

  return (
    <div className="w-full h-full flex items-center justify-around p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 font-mono font-bold text-base text-cyan-900 dark:text-cyan-200 shadow-xs">
        {d1}
      </div>
      <div className="w-10 h-10 rounded-full border-2 border-cyan-400 bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-cyan-600 dark:text-cyan-300 shadow-sm">
        {mode === "student" ? "?" : symbol}
      </div>
      <div className="px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 font-mono font-bold text-base text-cyan-900 dark:text-cyan-200 shadow-xs">
        {d2}
      </div>
    </div>
  );
};

/**
 * 12. Column Addition / Subtraction of Decimals
 */
export const DecimalColumnArithmeticRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const op = data.operation || "+"; // "+" | "-"
  const n1 = parseFloat(String(data.val1 ?? "24.65"));
  const n2 = parseFloat(String(data.val2 ?? "18.42"));
  const result = op === "+" ? (n1 + n2).toFixed(2) : (n1 - n2).toFixed(2);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none font-mono">
      <div className="inline-flex flex-col text-sm md:text-base">
        <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold py-0.5">
          <span className="w-6 mr-1" />
          <span className="w-24 text-right">{n1.toFixed(2)}</span>
        </div>
        <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold py-0.5">
          <span className="w-6 mr-1 text-center font-bold text-cyan-600">{op}</span>
          <span className="w-24 text-right">{n2.toFixed(2)}</span>
        </div>
        <div className="border-t-2 border-b-2 border-slate-800 dark:border-slate-300 my-1 py-1 flex items-center">
          <span className="w-6 mr-1" />
          <span className="w-24 text-right font-bold text-cyan-600 dark:text-cyan-400">
            {mode === "student" ? "____.__" : result}
          </span>
        </div>
      </div>
    </div>
  );
};
