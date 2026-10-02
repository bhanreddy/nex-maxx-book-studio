"use client";
import React from "react";
import { Plus } from "lucide-react";
import { CurriculumPreview } from "./CurriculumPreview";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";

export function LessonSchemaLibraryCard({ subject = "General" }: { subject?: string }) {
  return <div className="rounded-xl border border-slate-200 dark:border-indigo-400/25 bg-slate-50 dark:bg-white/[.03] p-3 space-y-2 shadow-xs">
    <CurriculumPreview type="lesson-schema" subject={subject} framed={false}/>
    <strong className="block text-xs text-slate-800 dark:text-slate-200">Lesson Schema</strong>
    <p className="text-[11px] text-slate-600 dark:text-slate-400">Connected topic boxes for any subject. Edit text, icons, colours and order; add empty boxes.</p>
    <button className="curriculum-primary w-full justify-center" onClick={() => insertCurriculumBlock("lesson-schema", "lesson-schema", undefined, subject)}><Plus size={14}/>Add lesson schema</button>
  </div>;
}
