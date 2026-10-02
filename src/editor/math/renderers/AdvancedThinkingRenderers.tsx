// ============================================================================
// NEX MAXX BOOK STUDIO - ADVANCED THINKING DIAGRAMS & ASSESSMENT RENDERERS
// Tape Diagrams, Magic Squares, Balance Equations, Fill in the Blanks, Multiple Choice
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { parseMathNumber, formatIndianNumber } from "../mathAlgorithms";

/**
 * 23. Comparison Tape Diagram (Singapore Math)
 */
export const TapeDiagramRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const barA = parseMathNumber(data.valueA ?? 80);
  const barB = parseMathNumber(data.valueB ?? 50);
  const labelA = data.labelA || "Team Alpha";
  const labelB = data.labelB || "Team Beta";
  const diff = Math.abs(barA - barB);

  const maxVal = Math.max(barA, barB);
  const widthAPct = (barA / maxVal) * 80;
  const widthBPct = (barB / maxVal) * 80;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 mb-1">
        <span>Comparison Tape Diagram</span>
        <span className="text-[8px] font-mono text-slate-400">BAR MODEL</span>
      </div>

      <div className="flex-1 flex flex-col justify-around py-1 gap-2">
        {/* Bar A */}
        <div className="flex items-center gap-2">
          <span className="w-20 text-[9px] font-semibold text-slate-600 dark:text-slate-400 truncate">
            {labelA}
          </span>
          <div
            style={{ width: `${widthAPct}%` }}
            className="h-6 rounded bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-end pr-2 shadow-2xs"
          >
            {barA}
          </div>
        </div>

        {/* Bar B */}
        <div className="flex items-center gap-2">
          <span className="w-20 text-[9px] font-semibold text-slate-600 dark:text-slate-400 truncate">
            {labelB}
          </span>
          <div className="flex items-center" style={{ width: `${widthAPct}%` }}>
            <div
              style={{ width: `${(widthBPct / widthAPct) * 100}%` }}
              className="h-6 rounded bg-teal-500 text-white font-mono font-bold text-xs flex items-center justify-end pr-2 shadow-2xs"
            >
              {barB}
            </div>
            {/* Difference dashed section */}
            <div className="flex-1 h-6 border-2 border-dashed border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 rounded flex items-center justify-center font-mono text-[9px] font-bold text-rose-600 ml-1">
              {mode === "student" ? "?" : `+${diff}`}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[8px] text-center font-mono text-slate-500 font-semibold">
        Difference: {barA} - {barB} = {mode === "student" ? "____" : diff}
      </div>
    </div>
  );
};

/**
 * 23. 3x3 Magic Square Puzzle
 */
export const MagicSquareRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  // Standard Lo Shu magic square or custom
  const grid: number[][] = data.grid || [
    [8, 1, 6],
    [3, 5, 7],
    [4, 9, 2],
  ];
  const magicConstant = parseMathNumber(data.magicConstant ?? 15);

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 mb-1">
        <span>3 × 3 Magic Square</span>
        <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 font-mono text-[8px] font-bold">
          Magic Sum = {magicConstant}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center py-1">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border-2 border-amber-500 bg-amber-50/30">
          {grid.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const isBlank = mode === "student" && ((rIdx === 0 && cIdx === 1) || (rIdx === 2 && cIdx === 0));
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`w-9 h-9 rounded flex items-center justify-center font-mono font-bold text-sm border ${
                    isBlank
                      ? "border-2 border-dashed border-amber-400 bg-amber-50 text-amber-600"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs"
                  }`}
                >
                  {isBlank ? "?" : val}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-[7.5px] text-center text-slate-400 font-medium">
        All rows, columns, and diagonals sum to {magicConstant}
      </div>
    </div>
  );
};

/**
 * 23. Balance Equation Model
 * e.g. 15 + 8 = ? + 10
 */
export const BalanceEquationRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const leftA = parseMathNumber(data.leftA ?? 15);
  const leftB = parseMathNumber(data.leftB ?? 8);
  const rightKnown = parseMathNumber(data.rightKnown ?? 10);
  const sum = leftA + leftB;
  const missing = sum - rightKnown;

  return (
    <div className="w-full h-full flex items-center justify-around p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none font-mono">
      {/* Left Pan / Side */}
      <div className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold text-sm shadow-2xs">
        {leftA} + {leftB}
      </div>

      {/* Balanced Equal Sign */}
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-200">
        =
      </div>

      {/* Right Pan / Side with Blank */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold text-sm shadow-2xs">
        <span className="w-8 h-6 rounded border-2 border-dashed border-emerald-400 bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 text-xs">
          {mode === "student" ? "?" : missing}
        </span>
        <span>+</span>
        <span>{rightKnown}</span>
      </div>
    </div>
  );
};

/**
 * 24. Fill in the Blanks Assessment Card
 */
export const FillInTheBlanksRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const questionNumber = data.number || 1;
  const prompt = data.prompt || "The place value of 7 in 4,75,230 is";
  const answer = data.answer || "70,000";

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
        <span className="text-indigo-600 font-semibold">Fill in the Blanks • Q{questionNumber}</span>
        <span className="text-[8px] font-mono text-slate-400">ASSESSMENT</span>
      </div>

      <div className="flex-1 flex items-center gap-2 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium">
        <span>{prompt}</span>
        <span className="font-mono font-bold text-indigo-600 px-3 py-1 rounded border-b-2 border-dashed border-indigo-400 bg-indigo-50/50">
          {mode === "student" ? "_________" : formatIndianNumber(answer)}
        </span>
        <span>.</span>
      </div>
    </div>
  );
};

/**
 * 24. Choose Correct Answer (Multiple Choice Question)
 */
export const ChooseCorrectAnswerRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const question = data.question || "Which of the following is a prime number?";
  const options: string[] = data.options || ["12", "15", "17", "21"];
  const correctIdx: number = data.correctIndex ?? 2; // "17"

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 mb-1">
        <span>Choose the Correct Option</span>
        <span className="text-[8px] font-mono text-slate-400">MCQ</span>
      </div>

      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
        {question}
      </p>

      {/* 4 Choices A, B, C, D */}
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          const isCorrect = idx === correctIdx;
          const showHighlight = mode !== "student" && isCorrect;

          return (
            <div
              key={idx}
              className={`p-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono transition-colors ${
                showHighlight
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 font-bold"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                showHighlight ? "bg-emerald-600" : "bg-slate-400"
              }`}>
                {letter}
              </span>
              <span>{opt}</span>
              {showHighlight && <span className="ml-auto text-emerald-600 text-xs">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
