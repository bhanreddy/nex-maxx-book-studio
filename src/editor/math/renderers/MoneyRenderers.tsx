// ============================================================================
// NEX MAXX BOOK STUDIO - INDIAN CURRENCY & MONEY TOOLKIT
// Original educational vector representations of Indian ₹ coins, notes, and bills
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";
import { getIndianCurrencyBreakdown, formatIndianNumber, parseMathNumber } from "../mathAlgorithms";

/**
 * Vector Coin Component
 */
export const VectorCoin: React.FC<{ value: number }> = ({ value }) => {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border-2 border-amber-600 shadow-xs flex items-center justify-center font-bold text-[10px] text-amber-950 font-mono select-none">
      ₹{value}
    </div>
  );
};

/**
 * Vector Banknote Component (RBI Characteristic Colors)
 */
export const VectorNote: React.FC<{ value: number }> = ({ value }) => {
  const noteColors: Record<number, { bg: string; border: string; text: string }> = {
    10: { bg: "bg-[#78350f] text-amber-100", border: "border-[#451a03]", text: "text-amber-200" }, // Chocolate brown
    20: { bg: "bg-[#ca8a04] text-yellow-100", border: "border-[#854d0e]", text: "text-yellow-200" }, // Greenish-yellow
    50: { bg: "bg-[#0284c7] text-sky-100", border: "border-[#0369a1]", text: "text-sky-200" }, // Fluorescent blue
    100: { bg: "bg-[#7c3aed] text-purple-100", border: "border-[#5b21b6]", text: "text-purple-200" }, // Lavender
    200: { bg: "bg-[#ea580c] text-orange-100", border: "border-[#c2410c]", text: "text-orange-200" }, // Bright orange
    500: { bg: "bg-[#475569] text-slate-100", border: "border-[#334155]", text: "text-slate-200" }, // Stone grey
  };

  const config = noteColors[value] || { bg: "bg-emerald-700 text-emerald-100", border: "border-emerald-900", text: "text-emerald-200" };

  return (
    <div
      className={`w-16 h-8 rounded ${config.bg} border ${config.border} shadow-xs px-1 py-0.5 flex flex-col justify-between font-mono select-none relative overflow-hidden`}
    >
      <div className="flex justify-between items-center text-[7px] font-bold">
        <span>₹{value}</span>
        <span className="text-[5.5px] opacity-75">RBI</span>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 opacity-30" />
      <div className="text-[6px] tracking-wider uppercase opacity-80">Rupees</div>
    </div>
  );
};

/**
 * 16. Indian Currency Breakdown & Total Amount
 */
export const IndianCurrencyRenderer: React.FC<MathRendererProps> = ({
  data,
  mode,
}) => {
  const amount = parseMathNumber(data.amount ?? 375);
  const breakdown = getIndianCurrencyBreakdown(amount);

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          Indian Currency Representation
        </span>
        <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          {mode === "student" ? "₹ ______" : `₹${formatIndianNumber(amount)}`}
        </span>
      </div>

      {/* Rendered Notes and Coins */}
      <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 overflow-y-auto">
        {breakdown.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700">
            {item.type === "note" ? <VectorNote value={item.denom} /> : <VectorCoin value={item.denom} />}
            <span className="text-[9px] font-mono font-bold text-slate-500">×{item.count}</span>
          </div>
        ))}
      </div>

      <div className="text-[8px] text-slate-500 font-medium text-center mt-1">
        ₹ Currency Denominations
      </div>
    </div>
  );
};

/**
 * 16. Shopping Bill / Cash Memo
 */
export const ShoppingBillRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const items: Array<{ name: string; qty: number; rate: number }> = data.items || [
    { name: "Notebook", qty: 2, rate: 45 },
    { name: "Geometry Box", qty: 1, rate: 80 },
    { name: "Pencil Pack", qty: 3, rate: 20 },
  ];

  const grandTotal = items.reduce((acc, curr) => acc + curr.qty * curr.rate, 0);

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none font-mono text-xs">
      <div className="text-center pb-1 border-b border-dashed border-slate-300 dark:border-slate-700">
        <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">KIDS BOOK MART</div>
        <div className="text-[7.5px] text-slate-400">Cash Memo / Bill Receipt</div>
      </div>

      <div className="flex-1 py-1 text-[9px]">
        <div className="flex justify-between font-bold text-slate-500 border-b border-slate-200 pb-0.5 mb-1">
          <span className="flex-1">Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-12 text-right">Rate</span>
          <span className="w-14 text-right">Amount</span>
        </div>
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between py-0.5 text-slate-700 dark:text-slate-300">
            <span className="flex-1 truncate">{it.name}</span>
            <span className="w-8 text-center">{it.qty}</span>
            <span className="w-12 text-right">₹{it.rate}</span>
            <span className="w-14 text-right font-bold">₹{it.qty * it.rate}</span>
          </div>
        ))}
      </div>

      <div className="pt-1 border-t-2 border-slate-800 dark:border-slate-200 flex justify-between font-bold text-xs">
        <span>TOTAL:</span>
        <span className="text-emerald-600 dark:text-emerald-400">
          {mode === "student" ? "₹ ______" : `₹${grandTotal}`}
        </span>
      </div>
    </div>
  );
};
