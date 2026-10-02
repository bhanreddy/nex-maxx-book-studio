// ============================================================================
// NEX MAXX BOOK STUDIO - ARITHMETIC ENGINES (ADDITION, SUBTRACTION, MULTIPLICATION, DIVISION)
// Production-quality vertical columns, arrays, fact families, and long division
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import {
  solveColumnAddition,
  solveColumnSubtraction,
  solveLongDivision,
  parseMathNumber,
} from "../mathAlgorithms";

/**
 * 07. Column Addition with Carry Row
 */
export const ColumnAdditionRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const numbers: number[] = data.numbers || [
    parseMathNumber(data.num1 ?? 3482),
    parseMathNumber(data.num2 ?? 1759),
  ];
  const showCarryRow = data.showCarryRow !== false;
  const showPlaceHeaders = data.showPlaceHeaders !== false;

  const solved = solveColumnAddition(numbers);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="inline-flex flex-col font-mono text-sm md:text-base">
        {/* Place Value Headers (Th H T O) */}
        {showPlaceHeaders && (
          <div className="flex border-b border-indigo-100 dark:border-indigo-900/40 pb-1 mb-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-center">
            <span className="w-5 mr-1" />
            {solved.headers.map((h, i) => (
              <span key={i} className="w-6 text-center">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Optional Carry Row */}
        {showCarryRow && (
          <div className="flex text-rose-500 font-bold text-xs mb-1">
            <span className="w-5 mr-1 text-[9px] text-slate-400">c:</span>
            {solved.carries.map((carry, i) => (
              <span key={i} className="w-6 text-center">
                {carry > 0 ? (
                  <span className="inline-block w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[9px] leading-4 border border-rose-300">
                    {carry}
                  </span>
                ) : (
                  ""
                )}
              </span>
            ))}
          </div>
        )}

        {/* Number Rows */}
        {solved.rows.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center text-slate-800 dark:text-slate-200 font-bold py-0.5">
            <span className="w-5 mr-1 text-center font-bold text-indigo-500">
              {rIdx === solved.rows.length - 1 ? "+" : ""}
            </span>
            {row.map((d, cIdx) => (
              <span key={cIdx} className="w-6 text-center">
                {d}
              </span>
            ))}
          </div>
        ))}

        {/* Bottom Sum Answer Line */}
        <div className="border-t-2 border-b-2 border-slate-800 dark:border-slate-300 my-1 py-1 flex items-center">
          <span className="w-5 mr-1" />
          {mode === "student" ? (
            <div className="flex">
              {solved.headers.map((_, i) => (
                <span
                  key={i}
                  className="w-6 h-6 border-b-2 border-dashed border-indigo-400 text-center text-indigo-400"
                >
                  _
                </span>
              ))}
            </div>
          ) : (
            solved.sumDigits.map((d, i) => (
              <span key={i} className="w-6 text-center font-bold text-indigo-600 dark:text-indigo-400">
                {d}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 08. Column Subtraction with Borrowing Row
 */
export const ColumnSubtractionRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const top = parseMathNumber(data.num1 ?? 5420);
  const bottom = parseMathNumber(data.num2 ?? 2785);
  const showBorrowRow = data.showBorrowRow !== false;

  const solved = solveColumnSubtraction(top, bottom);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="inline-flex flex-col font-mono text-sm md:text-base">
        {/* Place Value Headers */}
        <div className="flex border-b border-indigo-100 dark:border-indigo-900/40 pb-1 mb-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-center">
          <span className="w-5 mr-1" />
          {solved.headers.map((h, i) => (
            <span key={i} className="w-6 text-center">
              {h}
            </span>
          ))}
        </div>

        {/* Borrowing / Regrouping top row */}
        {showBorrowRow && (
          <div className="flex text-amber-600 font-bold text-[10px] mb-0.5">
            <span className="w-5 mr-1 text-[8px] text-slate-400">b:</span>
            {solved.modifiedTop.map((val, i) => (
              <span key={i} className="w-6 text-center">
                {solved.borrowedFrom[i] || val !== solved.topDigits[i] ? (
                  <span className="px-1 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300">
                    {val}
                  </span>
                ) : (
                  ""
                )}
              </span>
            ))}
          </div>
        )}

        {/* Top Row with slashes on borrowed digits */}
        <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold py-0.5">
          <span className="w-5 mr-1" />
          {solved.topDigits.map((d, i) => {
            const isSlashed = solved.borrowedFrom[i] || solved.modifiedTop[i] !== d;
            return (
              <span key={i} className={`w-6 text-center relative ${isSlashed ? "text-slate-400 line-through" : ""}`}>
                {d}
              </span>
            );
          })}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold py-0.5">
          <span className="w-5 mr-1 text-center font-bold text-rose-500">-</span>
          {solved.bottomDigits.map((d, i) => (
            <span key={i} className="w-6 text-center">
              {d}
            </span>
          ))}
        </div>

        {/* Difference Row */}
        <div className="border-t-2 border-b-2 border-slate-800 dark:border-slate-300 my-1 py-1 flex items-center">
          <span className="w-5 mr-1" />
          {mode === "student" ? (
            <div className="flex">
              {solved.headers.map((_, i) => (
                <span
                  key={i}
                  className="w-6 h-6 border-b-2 border-dashed border-rose-400 text-center text-rose-400"
                >
                  _
                </span>
              ))}
            </div>
          ) : (
            solved.diffDigits.map((d, i) => (
              <span key={i} className="w-6 text-center font-bold text-rose-600 dark:text-rose-400">
                {d}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 09. Multiplication Array & Fact Family
 */
export const MultiplicationArrayRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const rows = Math.min(10, Math.max(1, parseMathNumber(data.rows ?? 4)));
  const cols = Math.min(12, Math.max(1, parseMathNumber(data.cols ?? 6)));
  const shape = data.shape || "circle"; // "circle" | "star"

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span>Array Model ({rows} rows × {cols} columns)</span>
        <span className="font-mono text-indigo-600 dark:text-indigo-400">
          {mode === "student" ? `${rows} × ${cols} = ?` : `${rows} × ${cols} = ${rows * cols}`}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center py-2 overflow-auto">
        <div className="inline-grid gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60"
             style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: rows * cols }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 ${shape === "square" ? "rounded-xs" : "rounded-full"} bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-xs flex items-center justify-center text-white`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            </div>
          ))}
        </div>
      </div>

      <div className="text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
        Repeated Addition: {Array(rows).fill(cols).join(" + ")} = {rows * cols}
      </div>
    </div>
  );
};

/**
 * 09. Fact Family Triangle
 */
export const FactFamilyRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const a = parseMathNumber(data.factor1 ?? 4);
  const b = parseMathNumber(data.factor2 ?? 7);
  const product = a * b;

  return (
    <div className="w-full h-full flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* SVG Triangle */}
      <div className="w-32 h-32 relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,12 92,88 8,88"
            fill="#e0e7ff"
            stroke="#4338ca"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Apex Product */}
          <circle cx="50" cy="18" r="12" fill="#4338ca" />
          <text x="50" y="22" textAnchor="middle" fill="#ffffff" className="font-mono font-bold text-[10px]">
            {mode === "student" ? "?" : product}
          </text>

          {/* Left Base Factor */}
          <circle cx="16" cy="84" r="10" fill="#6366f1" />
          <text x="16" y="87" textAnchor="middle" fill="#ffffff" className="font-mono font-bold text-[10px]">
            {a}
          </text>

          {/* Right Base Factor */}
          <circle cx="84" cy="84" r="10" fill="#6366f1" />
          <text x="84" y="87" textAnchor="middle" fill="#ffffff" className="font-mono font-bold text-[10px]">
            {b}
          </text>

          <text x="50" y="58" textAnchor="middle" fill="#4338ca" className="font-bold text-xs">
            × / ÷
          </text>
        </svg>
      </div>

      {/* Related 4 Math Facts */}
      <div className="flex-1 flex flex-col justify-around gap-1 font-mono text-xs">
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {a} × {b} = {mode === "student" ? "___" : product}
        </div>
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {b} × {a} = {mode === "student" ? "___" : product}
        </div>
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {product} ÷ {a} = {mode === "student" ? "___" : b}
        </div>
        <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {product} ÷ {b} = {mode === "student" ? "___" : a}
        </div>
      </div>
    </div>
  );
};

/**
 * 10. Long Division Layout
 */
export const LongDivisionRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const dividend = parseMathNumber(data.dividend ?? 384);
  const divisor = Math.max(1, parseMathNumber(data.divisor ?? 6));

  const solved = solveLongDivision(dividend, divisor);

  return (
    <div className="w-full h-full flex flex-col justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none overflow-hidden font-mono text-xs md:text-sm">
      <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-slate-400">
        <span>LONG DIVISION: {dividend} ÷ {divisor}</span>
      </div>

      <div className="inline-block">
        {/* Quotient on top */}
        <div className="flex pl-12 text-indigo-600 dark:text-indigo-400 font-bold mb-0.5">
          <span>{mode === "student" ? "____" : solved.quotient}</span>
        </div>

        {/* Divisor and Dividend with standard bracket */}
        <div className="flex items-center">
          <span className="font-bold text-slate-700 dark:text-slate-300 pr-2">{divisor}</span>
          <div className="border-t-2 border-l-2 border-slate-800 dark:border-slate-300 rounded-tl-sm px-2 py-0.5 font-bold text-slate-900 dark:text-white">
            {dividend}
          </div>
        </div>

        {/* Step-by-step subtraction rows */}
        {mode !== "student" && (
          <div className="pl-12 flex flex-col text-slate-600 dark:text-slate-400 text-xs">
            {solved.steps.map((st, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-rose-500">- {st.multiplied}</span>
                <span className="border-t border-slate-400 text-slate-800 dark:text-slate-200 font-semibold">
                  {st.subResult}
                </span>
              </div>
            ))}
            <div className="text-[10px] font-bold text-indigo-600 mt-1">
              Remainder: {solved.remainder}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
