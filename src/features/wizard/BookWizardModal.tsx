"use client";

import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import {
  GradeLevel,
  Subject,
  BookType,
  PageSizePreset,
  STANDARD_PAGE_SIZES,
  DEFAULT_PRINT_MARGINS,
  DEFAULT_BLEED,
} from "../../domain/book/types";
import { SUBJECT_THEMES } from "../../domain/theme/types";
import { X, BookPlus, Sparkles, Check, ChevronRight, ChevronLeft } from "lucide-react";

export const BookWizardModal: React.FC = () => {
  const { wizardOpen, setWizardOpen, showToast } = useUiStore();
  const { createBook } = useEditorStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [grade, setGrade] = useState<GradeLevel>("Grade 5");
  const [subject, setSubject] = useState<Subject>("Science");
  const [type, setType] = useState<BookType>("Textbook");
  const [pageSize, setPageSize] = useState<PageSizePreset>("A4");
  const [bindingType, setBindingType] = useState<"Perfect Bound" | "Saddle Stitch" | "Hardcover" | "Spiral">("Perfect Bound");
  const [themeId, setThemeId] = useState("science-modern");

  if (!wizardOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) {
      showToast({ type: "warning", title: "Please enter a book title" });
      return;
    }

    const created = createBook({
      title: title.trim(),
      subtitle: subtitle.trim(),
      grade,
      subject,
      type,
      pageSize,
      dimensions: STANDARD_PAGE_SIZES[pageSize],
      margins: DEFAULT_PRINT_MARGINS,
      bleed: DEFAULT_BLEED,
      bindingType,
      themeId,
    });

    showToast({
      type: "success",
      title: "Book Project Created",
      message: `Initialized "${created.title}" ready for publishing.`,
    });

    setWizardOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setWizardOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Create New Book Project</h2>
              <p className="text-xs text-slate-400">Step {step} of 3: Curriculum & Print Specifications</p>
            </div>
          </div>
          <button
            onClick={() => setWizardOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Basic Curriculum Metadata */}
        {step === 1 && (
          <div className="p-6 space-y-4 text-xs text-slate-300">
            <div>
              <label className="font-semibold text-slate-200 block mb-1">Book Title *</label>
              <input
                type="text"
                placeholder="e.g. Discovery Science: Living Systems & Cells"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">Subtitle / Course Details</label>
              <input
                type="text"
                placeholder="e.g. A Complete Inquiry-Based Science Course"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Grade Level</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none"
                >
                  {(
                    [
                      "Nursery",
                      "LKG",
                      "UKG",
                      "Grade 1",
                      "Grade 2",
                      "Grade 3",
                      "Grade 4",
                      "Grade 5",
                      "Grade 6",
                      "Grade 7",
                      "Grade 8",
                      "Grade 9",
                      "Grade 10",
                    ] as const
                  ).map((g) => (
                    <option key={g} value={g} className="bg-slate-900">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => {
                    const sub = e.target.value as Subject;
                    setSubject(sub);
                    if (sub === "Science") setThemeId("science-modern");
                    else if (sub === "Mathematics") setThemeId("math-precision");
                    else if (sub === "English") setThemeId("english-creative");
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none"
                >
                  {(
                    [
                      "Science",
                      "Mathematics",
                      "English",
                      "Environmental Studies",
                      "Social Studies",
                      "Computer Science",
                      "General Knowledge",
                    ] as const
                  ).map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">Publication Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Textbook", "Workbook", "Activity Book", "Teacher Guide", "Assessment Book"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        type === t
                          ? "bg-indigo-600/20 border-indigo-500 text-white font-medium"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Page Geometry & Binding */}
        {step === 2 && (
          <div className="p-6 space-y-4 text-xs text-slate-300">
            <div>
              <label className="font-semibold text-slate-200 block mb-2">Page Size (Print Standard)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "A4", name: "A4 Standard", dim: "210 × 297 mm (595 × 842 pt)" },
                  { id: "A5", name: "A5 Digest", dim: "148 × 210 mm (420 × 595 pt)" },
                  { id: "Letter", name: "US Letter", dim: "8.5 × 11 in (612 × 792 pt)" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPageSize(s.id as PageSizePreset)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pageSize === s.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white font-medium"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="font-semibold block text-xs">{s.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">{s.dim}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-2">Book Binding Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Perfect Bound", name: "Perfect Bound (Paperback)", desc: "Glued spine for 60–300+ pages" },
                  { id: "Hardcover", name: "Hardcover (Case Bound)", desc: "Premium board with wrap cover" },
                  { id: "Saddle Stitch", name: "Saddle Stitch (Stapled)", desc: "Folded booklet for 16–48 pages" },
                  { id: "Spiral", name: "Spiral / Wire-O", desc: "Flat-opening workbook binding" },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBindingType(b.id as "Perfect Bound" | "Saddle Stitch" | "Hardcover" | "Spiral")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bindingType === b.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white font-medium"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="font-semibold block text-xs">{b.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">{b.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1 text-[11px] text-slate-400">
              <span className="font-medium text-slate-300 block">Print Defaults Configured:</span>
              <div>• Physical Bleed: 3.0mm (8.5 pt) all around</div>
              <div>• Inside Gutter Margin: 42 pt (~15mm) for binding clearance</div>
              <div>• Target Print Resolution: 300 DPI Vector PDF</div>
            </div>
          </div>
        )}

        {/* Step 3: Design Theme & Typography */}
        {step === 3 && (
          <div className="p-6 space-y-4 text-xs text-slate-300">
            <div>
              <label className="font-semibold text-slate-200 block mb-2">Curriculum Design Theme</label>
              <div className="space-y-2">
                {Object.values(SUBJECT_THEMES).map((thm) => (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => setThemeId(thm.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      themeId === thm.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: thm.colors.primary }}
                      />
                      <div>
                        <span className="font-semibold text-xs block">{thm.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {thm.subject} • Fonts: {thm.typography.headingFont.split(",")[0]} +{" "}
                          {thm.typography.bodyFont.split(",")[0]}
                        </span>
                      </div>
                    </div>
                    {themeId === thm.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Review */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-slate-300 space-y-1">
              <span className="font-semibold text-xs text-white block">Project Summary:</span>
              <div>Title: <span className="text-indigo-300">{title || "Untitled"}</span></div>
              <div>Course: {grade} • {subject} • {type}</div>
              <div>Format: {pageSize} ({bindingType})</div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  showToast({ type: "warning", title: "Please enter a book title" });
                  return;
                }
                setStep((s) => (s + 1) as 1 | 2 | 3);
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
