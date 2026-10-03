import React from "react";
import { MATH_TOKENS, PlaceColorConfig } from "../../tokens";

export type ArithmeticPlace = "C" | "TL" | "L" | "TTh" | "Th" | "H" | "T" | "O";

export interface ColumnArithmeticProps {
  operation?: "+" | "-" | "×" | "÷";
  operands?: Array<number | string>;
  result?: number | string;
  carries?: Array<number | string | null>;
  showCarries?: boolean;
  showResult?: boolean;
  placeLabels?: ArithmeticPlace[];
  colorCodePlaces?: boolean;
  showGrid?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared synchronous, hook-free ColumnArithmetic primitive.
 * Tabular, grid-aligned column operations (+, -, ×) with carries/borrows,
 * place value headers, and teacher/student answer toggle.
 */
export const ColumnArithmetic: React.FC<ColumnArithmeticProps> = ({
  operation = "+",
  operands = [348, 275],
  result = 623,
  carries = [1, 1, null],
  showCarries = true,
  showResult = true,
  placeLabels = ["H", "T", "O"],
  colorCodePlaces = true,
  showGrid = true,
  className = "",
  style,
}) => {
  const colCount = Math.max(
    placeLabels.length,
    ...operands.map((op) => String(op).length)
  );

  // Fill place labels if shorter than colCount
  const defaultPlaces: ArithmeticPlace[] = ["C", "TL", "L", "TTh", "Th", "H", "T", "O"];
  const resolvedPlaces: ArithmeticPlace[] =
    placeLabels.length >= colCount
      ? placeLabels
      : defaultPlaces.slice(defaultPlaces.length - colCount);

  // Helper to split a number into right-aligned digit characters
  const getDigits = (val: number | string): string[] => {
    const s = String(val);
    const chars = s.split("");
    const pad = colCount - chars.length;
    const res: string[] = [];
    for (let i = 0; i < pad; i++) res.push("");
    for (const c of chars) res.push(c);
    return res;
  };

  const operandRows = operands.map((op) => getDigits(op));
  const resultDigits = result !== undefined ? getDigits(result) : [];

  // Padded carries
  const paddedCarries: Array<string | null> = [];
  const carryPad = colCount - carries.length;
  for (let i = 0; i < carryPad; i++) paddedCarries.push(null);
  for (const c of carries) paddedCarries.push(c !== null && c !== undefined ? String(c) : null);

  return (
    <div
      className={`inline-block select-none ${className}`}
      style={style}
    >
      <table className="border-collapse font-mono text-base text-slate-900 dark:text-slate-100">
        {/* Place Value Header Row */}
        {resolvedPlaces.length > 0 && (
          <thead>
            <tr>
              <th className="w-8 text-center text-xs font-bold text-slate-400"></th>
              {resolvedPlaces.map((pl, idx) => {
                const conf: PlaceColorConfig | undefined = MATH_TOKENS.placeColors[pl];
                const headerStyle: React.CSSProperties = colorCodePlaces && conf
                  ? { backgroundColor: conf.bg, color: conf.text, borderColor: conf.border }
                  : {};

                return (
                  <th
                    key={`col-place-${pl}-${idx}`}
                    className="w-10 h-7 text-center text-xs font-bold border border-slate-300 dark:border-slate-700"
                    style={headerStyle}
                  >
                    <span>{pl}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}

        <tbody>
          {/* Optional Carry/Borrow Row */}
          {showCarries && (
            <tr className="h-7 text-xs">
              <td className="text-center font-bold text-slate-400"></td>
              {paddedCarries.map((c, idx) => (
                <td
                  key={`carry-cell-${idx}`}
                  className="text-center border-b border-slate-200 dark:border-slate-800"
                >
                  {c ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {c}
                    </span>
                  ) : null}
                </td>
              ))}
            </tr>
          )}

          {/* Operand Rows */}
          {operandRows.map((digits, rIdx) => {
            const isLastOperand = rIdx === operandRows.length - 1;

            return (
              <tr
                key={`op-row-${rIdx}`}
                className={isLastOperand ? "border-b-2 border-slate-800 dark:border-slate-200" : ""}
              >
                {/* Operation sign in last operand row */}
                <td className="w-8 text-center font-bold text-lg text-slate-600 dark:text-slate-300">
                  {isLastOperand && <span>{operation}</span>}
                </td>

                {/* Operand digits */}
                {digits.map((digit, cIdx) => (
                  <td
                    key={`op-digit-${rIdx}-${cIdx}`}
                    className={`w-10 h-9 text-center font-semibold text-lg ${showGrid ? "border border-slate-200 dark:border-slate-800" : ""}`}
                  >
                    <span>{digit}</span>
                  </td>
                ))}
              </tr>
            );
          })}

          {/* Result Row */}
          <tr className="h-10">
            <td className="text-center font-bold text-slate-400"></td>
            {resultDigits.map((digit, cIdx) => (
              <td
                key={`res-digit-${cIdx}`}
                className={`w-10 h-10 text-center font-bold text-xl ${showGrid ? "border border-slate-300 dark:border-slate-700" : ""}`}
              >
                {showResult ? (
                  <span>{digit}</span>
                ) : (
                  <div className="w-7 h-7 mx-auto rounded border-2 border-dashed border-amber-400 bg-amber-50/50 flex items-center justify-center">
                    <span className="text-amber-500 font-bold text-sm">?</span>
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
