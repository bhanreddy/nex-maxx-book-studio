"use client";

import React from "react";
import { Plus } from "lucide-react";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";

export function StudySkillsLibraryCard({ subject = "Maths" }: { subject?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-indigo-400/25 bg-slate-50 dark:bg-white/[.03] p-3 space-y-2 shadow-xs">
      {/* Mini Card Preview */}
      <div
        className="w-full h-24 rounded-lg p-2.5 flex items-center justify-between border border-[#E4D8CE] overflow-hidden relative shadow-sm"
        style={{
          background: "#FAF7F2",
        }}
      >
        {/* Peeking Peach Tab */}
        <div className="absolute top-1 left-20 w-8 h-5 bg-[#EE9580] rounded-t-md pointer-events-none" />

        {/* Tab Badge */}
        <div className="absolute top-1 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-br-lg rounded-tl-md bg-[#182756] border border-[#2F407A] text-white shadow-sm z-10">
          <span className="text-[7.5px] font-black text-white">💡 STUDY</span>
          <span className="text-[7.5px] font-black text-[#CCD3F8]">SKILLS</span>
        </div>

        {/* Top-Right Mini Book */}
        <div className="absolute top-1.5 right-2 w-7 h-6 opacity-80 pointer-events-none">
          <svg viewBox="0 0 50 40" fill="none" className="w-full h-full">
            <path d="M25 32 C18 28 8 27 3 20 L7 12 C13 18 19 20 25 22 Z" fill="#C2B5EC" />
            <path d="M25 32 C32 28 42 27 47 20 L43 12 C37 18 31 20 25 22 Z" fill="#B1A2E3" />
          </svg>
        </div>

        {/* Center Content Mini */}
        <div className="w-full pt-4 flex flex-col items-center justify-center text-center">
          <div className="text-[8.5px] font-extrabold text-[#0D2040]">
            Face value of:
          </div>
          <div className="text-[7.5px] font-bold text-[#0D2040] space-y-0.5 mt-0.5">
            <div>7 is 7.</div>
            <div>9 is 9.</div>
          </div>
        </div>

        {/* Bottom Foliage & Hills Mini */}
        <div className="absolute -bottom-1 -left-1 w-8 h-8 pointer-events-none opacity-80">
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M0 30 Q15 20 30 40 L0 40 Z" fill="#DDD8EB" />
            <circle cx="10" cy="30" r="3.5" fill="#E87164" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-7 pointer-events-none opacity-80">
          <svg viewBox="0 0 50 35" fill="none">
            <path d="M15 35 Q30 15 50 25 L50 35 Z" fill="#F4A390" />
          </svg>
        </div>
      </div>

      <strong className="block text-xs text-slate-800 dark:text-slate-200">Study Skills Card</strong>
      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        Glowing lightbulb badge, topic header, interactive items, and customizable write-in spaces for all subjects. Positioned at 3rd place.
      </p>
      <button
        type="button"
        className="curriculum-primary w-full justify-center text-xs"
        onClick={() => insertCurriculumBlock("study-skills", "study-skills", undefined, subject)}
      >
        <Plus size={14} />
        Add Study Skills
      </button>
    </div>
  );
}
