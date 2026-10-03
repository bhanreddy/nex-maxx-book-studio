"use client";

import React, { useState } from "react";
import { MATH_SYMBOL_GROUPS, MathSymbolGroup } from "../../editor/design/typographyCatalog";

interface MathSymbolsPopoverProps {
  onInsertSymbol: (symbol: string) => void;
  onClose?: () => void;
}

export const MathSymbolsPopover: React.FC<MathSymbolsPopoverProps> = ({
  onInsertSymbol,
  onClose,
}) => {
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const activeGroup = MATH_SYMBOL_GROUPS[activeGroupIndex];

  return (
    <div
      className="w-72 bg-[#10141d] border border-white/15 rounded-xl shadow-2xl p-2.5 text-slate-200 z-[110] animate-in fade-in zoom-in-95 duration-120 select-none font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase font-mono">
          Math & Scientific Notation
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-1"
        >
          ✕
        </button>
      </div>

      {/* Group Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none text-[9px]">
        {MATH_SYMBOL_GROUPS.map((grp, idx) => (
          <button
            key={grp.name}
            type="button"
            onClick={() => setActiveGroupIndex(idx)}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-all ${
              activeGroupIndex === idx
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {grp.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Current Group Symbols Grid */}
      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1 bg-black/30 rounded-lg border border-white/5">
        {activeGroup.symbols.map((item) => (
          <button
            key={`${item.char}-${item.label}`}
            type="button"
            onClick={() => onInsertSymbol(item.char)}
            className="w-8 h-8 rounded-md bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-200 text-base font-medium flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/5 hover:border-indigo-400 shadow-xs"
            title={`${item.label} (${item.char})`}
          >
            {item.char}
          </button>
        ))}
      </div>

      {/* Quick Insert Common Presets */}
      <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-[9px] text-slate-400 font-mono">Quick formulas:</span>
        <div className="flex items-center gap-1 text-[9px] font-mono">
          <button
            type="button"
            onClick={() => onInsertSymbol("H₂O")}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200"
          >
            H₂O
          </button>
          <button
            type="button"
            onClick={() => onInsertSymbol("x² + y² = r²")}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200"
          >
            x² + y²
          </button>
          <button
            type="button"
            onClick={() => onInsertSymbol("πr²")}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200"
          >
            πr²
          </button>
        </div>
      </div>
    </div>
  );
};
