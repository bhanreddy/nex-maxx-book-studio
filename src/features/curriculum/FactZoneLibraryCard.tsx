"use client";

import React from "react";
import { Plus } from "lucide-react";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";

export function FactZoneLibraryCard({ subject = "Maths" }: { subject?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-cyan-400/25 bg-slate-50 dark:bg-white/[.03] p-3 space-y-2 hover:border-cyan-400/50 transition-colors shadow-xs">
      {/* Mini Card Preview */}
      <div
        className="w-full h-20 rounded-full px-3 py-2 flex items-center justify-between border-[3px] border-[#1E2C5B] bg-[#FFFDF8] relative shadow-md overflow-visible"
        style={{
          boxShadow: "0 6px 16px rgba(22,34,72,0.25)",
        }}
      >
        {/* Left Mini Lightbulb Tab */}
        <div className="absolute -top-3 left-2 flex items-center">
          <div className="w-6 h-6 rounded-full bg-[#16294A] border border-[#00A896] flex items-center justify-center text-[10px] shadow-sm">
            💡
          </div>
          <div className="bg-[#16294A] text-white text-[7.5px] font-black px-2 py-0.5 rounded-r-md -ml-1 border-t border-b border-r border-[#2C467E]">
            FACT ZONE
          </div>
        </div>

        {/* Center Text Preview */}
        <div className="flex-1 pr-6 pl-1 pt-2">
          <p className="text-[7.5px] font-medium text-slate-800 leading-tight truncate">
            0 is neither positive nor negative.
          </p>
        </div>

        {/* Right Stacked Books Medallion */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#00B4A4] border-2 border-[#1E2C5B] flex items-center justify-center shadow-md">
          <div className="text-[10px]">📚</div>
        </div>
      </div>

      <strong className="block text-xs text-slate-800 dark:text-slate-200">Fact Zone (3D Callout)</strong>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        3D pill container with glowing lightbulb tab, editable trivia facts, and 3D books medallion badge.
      </p>

      <button
        type="button"
        onClick={() => insertCurriculumBlock("fact-zone", undefined, undefined, subject)}
        className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Fact Zone</span>
      </button>
    </div>
  );
}
