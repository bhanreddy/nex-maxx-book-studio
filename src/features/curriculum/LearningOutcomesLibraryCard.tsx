"use client";

import React from "react";
import { Plus } from "lucide-react";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";

export function LearningOutcomesLibraryCard({ subject = "Maths" }: { subject?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-indigo-400/25 bg-slate-50 dark:bg-white/[.03] p-3 space-y-2 shadow-xs">
      <div
        className="w-full h-24 rounded-lg p-2.5 flex items-center justify-between border border-[#b8cae8]/50 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f5f8fe 0%, #ffffff 50%, #eff4fc 100%)",
        }}
      >
        <div className="space-y-1 max-w-[65%]">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#2f3b66] px-2 py-0.5 text-[8px] font-black text-white">
            <span>🎯 LEARNING</span>
            <span style={{ color: "#f2b5e2" }}>OUTCOMES</span>
          </div>
          <p className="text-[8px] font-bold text-[#182650] line-clamp-1">
            After studying this chapter, students will be able to:
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm rotate-45 bg-[#b93b58]" />
            <span className="text-[7.5px] font-bold text-[#b93b58]">write</span>
            <span className="text-[7.5px] text-[#2d395a] line-clamp-1">5-digit and 6-digit numbers</span>
          </div>
        </div>
        <div className="w-16 h-16 flex items-center justify-center shrink-0 opacity-90">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="20" y="60" width="55" height="10" rx="2" fill="#559976" />
            <rect x="23" y="48" width="52" height="10" rx="2" fill="#a35487" />
            <rect x="26" y="36" width="50" height="10" rx="2" fill="#5388c8" />
            <circle cx="50" cy="22" r="10" fill="#ffffff" stroke="#4076ba" strokeWidth="1.5" />
            <circle cx="50" cy="22" r="16" fill="#c3dcff" opacity="0.4" />
          </svg>
        </div>
      </div>

      <strong className="block text-xs text-slate-800 dark:text-slate-200">Learning Outcomes Card</strong>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        Rich targets card with diamond action badges, verbs, empty spaces and educational artwork. Positioned at 3rd place.
      </p>
      <button
        type="button"
        className="curriculum-primary w-full justify-center text-xs"
        onClick={() => insertCurriculumBlock("learning-outcomes", "learning-outcomes", undefined, subject)}
      >
        <Plus size={14} />
        Add learning outcomes
      </button>
    </div>
  );
}
