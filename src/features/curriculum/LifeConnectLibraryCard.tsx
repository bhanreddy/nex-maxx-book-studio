"use client";

import React from "react";
import { Plus } from "lucide-react";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";

export function LifeConnectLibraryCard({ subject = "Science" }: { subject?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-emerald-400/25 bg-slate-50 dark:bg-white/[.03] p-3 space-y-2 hover:border-emerald-400/50 transition-colors shadow-xs">
      {/* Mini Card Preview */}
      <div
        className="w-full h-20 rounded-xl p-2 flex items-center justify-between relative shadow-md overflow-visible"
        style={{
          background: "linear-gradient(90deg, #0B2545 0%, #13315C 100%)",
        }}
      >
        {/* Left folded corner accent */}
        <div
          className="absolute -left-1 top-2 bottom-2 w-3 bg-red-500 rounded-l shadow-sm"
          style={{ clipPath: "polygon(0 20%, 100% 0, 100% 100%, 0 80%)" }}
        />

        {/* Text Preview */}
        <div className="pl-3 z-10 flex items-center gap-1 font-black uppercase text-[11px] tracking-wider select-none">
          <span className="text-white drop-shadow-sm">LIFE</span>
          <span className="text-[#FF7556] drop-shadow-sm">CONNECT</span>
        </div>

        {/* Right Teardrop Pebble with Sapling */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0E4A56] border border-[#FF6B4A] flex items-center justify-center shadow-md">
          <div className="text-[12px]">🌱</div>
        </div>

        {/* Bottom cyan bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00A896]" />
      </div>

      <strong className="block text-xs text-slate-800 dark:text-slate-200">Life Connect (3D Ribbon)</strong>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        Folded 3D ribbon banner with teardrop planting boy medallion badge and real-world connection prompt.
      </p>

      <button
        type="button"
        onClick={() => insertCurriculumBlock("life-connect", undefined, undefined, subject)}
        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Life Connect</span>
      </button>
    </div>
  );
}
