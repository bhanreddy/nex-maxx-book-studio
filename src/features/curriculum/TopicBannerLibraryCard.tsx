"use client";

import React from "react";
import { Plus } from "lucide-react";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";

export function TopicBannerLibraryCard({ subject = "Maths" }: { subject?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-amber-400/25 bg-slate-50 dark:bg-white/[.03] p-3 space-y-2 hover:border-amber-400/50 transition-colors shadow-xs">
      {/* Mini Card Preview */}
      <div
        className="w-full h-20 rounded-2xl p-2 flex items-center justify-center relative shadow-md overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #111827 0%, #1E293B 100%)",
        }}
      >
        {/* Layered fluid wave background */}
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0 45 Q50 60 100 50 T200 40 L200 60 L0 60 Z" fill="#FED7AA" />
            <path d="M120 10 Q160 5 190 20 L200 50 L120 50 Z" fill="#DDD6FE" />
            <circle cx="15" cy="20" r="4" fill="#C084FC" />
            <circle cx="185" cy="25" r="3.5" fill="#FB7185" />
          </svg>
        </div>

        {/* Text Preview */}
        <div className="relative z-10 flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider select-none">
          <span className="text-white drop-shadow-sm">SUCCESSOR</span>
          <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[7.5px]">AND</span>
          <span className="text-[#FDBA74] drop-shadow-sm">PREDECESSOR</span>
        </div>
      </div>

      <strong className="block text-xs text-slate-800 dark:text-slate-200">Topic Banner (3D Ribbon)</strong>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        3D wavy organic ribbon banner with layered fluid waves and puffy typography.
      </p>

      <button
        type="button"
        onClick={() => insertCurriculumBlock("topic-banner", undefined, undefined, subject)}
        className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Topic Banner</span>
      </button>
    </div>
  );
}
