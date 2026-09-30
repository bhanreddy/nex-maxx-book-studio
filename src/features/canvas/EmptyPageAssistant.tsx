"use client";

import React from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { PAGE_PRESETS_MAP } from "../../editor/registry/presets";

interface EmptyPageAssistantProps {
  pageId: string;
}

export const EmptyPageAssistant: React.FC<EmptyPageAssistantProps> = ({ pageId }) => {
  const { applyPagePreset, addTextFrame } = useEditorStore();
  const { setPresetCategoryFilter, setLeftPanelTab } = useUiStore();

  const starterCategories = [
    {
      id: "lesson",
      title: "Lesson Page",
      subtitle: "Editorial headline, body text, and hero diagram",
      icon: "📖",
      defaultPresetId: "content-editorial-split",
      categoryKey: "content",
      accent: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:border-blue-500/50",
    },
    {
      id: "activity",
      title: "Hands-on Activity",
      subtitle: "Step-by-step experiment, objectives & workspace",
      icon: "🧪",
      defaultPresetId: "activity-hands-on-lab",
      categoryKey: "activity",
      accent: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/50",
    },
    {
      id: "assessment",
      title: "Assessment & Quiz",
      subtitle: "MCQ cards, fill-in-blanks & short answer test",
      icon: "📝",
      defaultPresetId: "assessment-mcq-grid",
      categoryKey: "assessment",
      accent: "from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/50",
    },
    {
      id: "chapter",
      title: "Chapter Opener",
      subtitle: "Hero unit badge, overarching goals & intro",
      icon: "🌟",
      defaultPresetId: "chapter-opener-hero",
      categoryKey: "chapter",
      accent: "from-rose-500/10 to-pink-500/10 border-rose-500/20 hover:border-rose-500/50",
    },
    {
      id: "visual",
      title: "Visual Story / Infographic",
      subtitle: "Full-bleed illustration, process cycle & callout",
      icon: "🎨",
      defaultPresetId: "visual-timeline-process",
      categoryKey: "visual",
      accent: "from-purple-500/10 to-violet-500/10 border-purple-500/20 hover:border-purple-500/50",
    },
    {
      id: "blank",
      title: "Start from Scratch",
      subtitle: "Clean canvas with print margins ready for free design",
      icon: "✏️",
      defaultPresetId: null,
      categoryKey: "all",
      accent: "from-slate-500/10 to-slate-500/5 border-slate-500/20 hover:border-slate-500/50",
    },
  ];

  const handleSelectStarter = (starter: (typeof starterCategories)[0]) => {
    if (starter.defaultPresetId && PAGE_PRESETS_MAP[starter.defaultPresetId]) {
      applyPagePreset(starter.defaultPresetId, false);
    } else if (starter.id === "blank") {
      // Add a clean starting title placeholder frame
      addTextFrame(54, 80);
    }

    // Open preset tab in LeftSidebar filtered to this category so beginner can explore alternatives
    if (starter.categoryKey !== "all") {
      setPresetCategoryFilter(starter.categoryKey);
      setLeftPanelTab("templates");
    }
  };

  return (
    <div
      data-page-id={pageId}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-50/90 backdrop-blur-xs select-none pointer-events-auto z-10 animate-in fade-in duration-200"
    >
      <div className="max-w-xl w-full text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[8pt] font-semibold tracking-wide uppercase mb-3">
          <span>✨ New Blank Page</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
          What are you creating?
        </h2>
        <p className="text-slate-500 text-[10pt] max-w-md mx-auto">
          Choose a starter layout to begin instantly with educational typography, whitespace, and adaptive structure.
        </p>
      </div>

      {/* 6 Starter Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 max-w-xl w-full">
        {starterCategories.map((starter) => (
          <button
            key={starter.id}
            onClick={() => handleSelectStarter(starter)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border bg-gradient-to-br ${starter.accent} bg-white text-left transition-all duration-150 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] group`}
          >
            <div className="text-2xl p-2 rounded-lg bg-white/80 shadow-xs border border-black/5 group-hover:scale-110 transition-transform">
              {starter.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-[9.5pt] group-hover:text-indigo-600 transition-colors">
                {starter.title}
              </h3>
              <p className="text-[8pt] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                {starter.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center text-[8pt] text-slate-400">
        Tip: You can change layouts at any time without losing your text and images.
      </div>
    </div>
  );
};
