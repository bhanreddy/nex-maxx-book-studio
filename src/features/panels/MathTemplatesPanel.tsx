// ============================================================================
// NEX MAXX BOOK STUDIO - MATH TEMPLATES ECOSYSTEM PANEL
// Dedicated "Templates → Maths" Library for Classes 1 to 5
// ============================================================================

import React, { useState, useMemo, useEffect } from "react";
import {
  MathTemplate,
  MathTopic,
  MathTemplateType,
  CustomMathTemplateEntry,
} from "../../editor/math/types";
import {
  getAllMathTemplates,
  searchMathTemplates,
  getFavoriteMathIds,
  toggleFavoriteMathId,
  getRecentMathIds,
  recordRecentMathId,
  getCustomMathTemplates,
  insertMathComponent,
} from "../../editor/math/mathRegistry";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import {
  Search,
  Star,
  Plus,
  Calculator,
} from "lucide-react";

export const MathTemplatesPanel: React.FC = () => {
  const { getActiveBook, getActivePage } = useEditorStore();
  const { showToast } = useUiStore();

  const [topTab, setTopTab] = useState<"nex-maxx" | "favorites" | "recent" | "custom">("nex-maxx");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | "all">("all");
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | "all">("all");
  const [selectedType, setSelectedType] = useState<MathTemplateType | "all">("all");

  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomMathTemplateEntry[]>([]);

  useEffect(() => {
    setFavorites(getFavoriteMathIds());
    setRecents(getRecentMathIds());
    setCustomTemplates(getCustomMathTemplates());
  }, []);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleFavoriteMathId(id);
    setFavorites(next);
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let list: MathTemplate[] = [];

    if (topTab === "favorites") {
      list = getAllMathTemplates().filter((t) => favorites.includes(t.id));
    } else if (topTab === "recent") {
      list = getAllMathTemplates().filter((t) => recents.includes(t.id));
    } else if (topTab === "custom") {
      // Return custom templates mapped to math template specs
      return [];
    } else {
      list = searchMathTemplates({
        query: searchQuery,
        topic: selectedTopic,
        grade: selectedGrade,
        type: selectedType,
      });
    }

    if (searchQuery.trim() && (topTab === "favorites" || topTab === "recent")) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        `${t.name} ${t.category} ${t.tags.join(" ")}`.toLowerCase().includes(q)
      );
    }

    return list;
  }, [topTab, searchQuery, selectedGrade, selectedTopic, selectedType, favorites, recents]);

  // Insert template onto canvas
  const handleInsert = (template: MathTemplate, customData?: Record<string, unknown>) => {
    insertMathComponent(template.id, undefined, undefined, customData);
    setRecents(getRecentMathIds());
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#0d121e] text-slate-800 dark:text-slate-200 select-none overflow-hidden">
      {/* 1. Top Section Headers: Favorites, Recent, NEX MAXX, My Templates */}
      <div className="shrink-0 px-3 pt-2 pb-1 border-b border-slate-200 dark:border-white/10 space-y-2 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 font-mono">
              Maths Studio
            </span>
          </div>
          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
            Classes 1–5
          </span>
        </div>

        {/* Top 4 Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-200/60 dark:bg-white/5 text-[10px]">
          {[
            { id: "nex-maxx", label: "◇ NEX MAXX", count: getAllMathTemplates().length },
            { id: "favorites", label: "★ Starred", count: favorites.length },
            { id: "recent", label: "◷ Recent", count: recents.length },
            { id: "custom", label: "▣ My Tpls", count: customTemplates.length },
          ].map((tab) => {
            const isActive = topTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTopTab(tab.id as "nex-maxx" | "favorites" | "recent" | "custom")}
                className={`py-1 rounded-md font-semibold transition-all text-center flex flex-col items-center justify-center leading-tight ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[8px] opacity-75 font-mono">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="shrink-0 p-2.5 space-y-2 border-b border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01]">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search Maths (e.g. abacus, fraction, carry, place value)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Class Filter (All | 1 | 2 | 3 | 4 | 5) */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">
            Class:
          </span>
          {(["all", 1, 2, 3, 4, 5] as const).map((g) => {
            const active = selectedGrade === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all text-center ${
                  active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-transparent"
                }`}
              >
                {g === "all" ? "All" : `${g}`}
              </button>
            );
          })}
        </div>

        {/* Topic Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px]">
          {[
            { id: "all", label: "All Topics" },
            { id: "numbers", label: "Numbers" },
            { id: "place-value", label: "Place Value" },
            { id: "addition", label: "Addition" },
            { id: "subtraction", label: "Subtraction" },
            { id: "multiplication", label: "Multiplication" },
            { id: "division", label: "Division" },
            { id: "fractions", label: "Fractions" },
            { id: "decimals", label: "Decimals" },
            { id: "geometry", label: "Geometry" },
            { id: "measurement", label: "Measurement" },
            { id: "time", label: "Time" },
            { id: "money", label: "Money" },
            { id: "patterns", label: "Patterns" },
            { id: "data", label: "Data Handling" },
            { id: "mental-maths", label: "Mental Maths" },
            { id: "word-problems", label: "Word Problems" },
            { id: "activities", label: "Activities" },
            { id: "assessment", label: "Assessment" },
          ].map((topic) => {
            const active = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id as MathTopic | "all")}
                className={`px-2 py-0.5 rounded-full flex-shrink-0 font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent"
                }`}
              >
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[8.5px]">
          {[
            { id: "all", label: "All Types" },
            { id: "visual-model", label: "Visual Model" },
            { id: "worked-example", label: "Worked Example" },
            { id: "practice", label: "Practice" },
            { id: "interactive", label: "Interactive" },
            { id: "diagram", label: "Diagram" },
            { id: "table", label: "Table" },
            { id: "challenge", label: "Challenge" },
            { id: "activity", label: "Activity" },
          ].map((t) => {
            const active = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id as MathTemplateType | "all")}
                className={`px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
                  active
                    ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Templates Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {topTab === "custom" && customTemplates.length > 0 ? (
          <div className="space-y-2">
            {customTemplates.map((cust) => {
              const base = getAllMathTemplates().find((t) => t.id === cust.baseTemplateId);
              return (
                <div
                  key={cust.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-nexmaxx-math-template", cust.baseTemplateId);
                    e.dataTransfer.setData("application/x-nexmaxx-math-data", JSON.stringify(cust.data));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => base && handleInsert(base, cust.data)}
                  className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-900 hover:border-indigo-500 cursor-grab active:cursor-grabbing shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                      {cust.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 font-mono">
                      Custom
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    Base: {base?.name || cust.baseTemplateId}
                  </div>
                </div>
              );
            })}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No maths templates match your active filters.
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isFav = favorites.includes(template.id);
            const Renderer = template.renderer;

            return (
              <article
                key={template.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-nexmaxx-math-template", template.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group relative rounded-xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/80 bg-white dark:bg-slate-900/80 hover:shadow-md transition-all overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
                onClick={() => handleInsert(template)}
              >
                {/* Miniature Live Preview Frame */}
                <div className="h-28 w-full bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 relative overflow-hidden flex items-center justify-center p-2">
                  <div
                    style={{
                      width: template.defaultWidth,
                      height: template.defaultHeight,
                      transform: `scale(${Math.min(
                        280 / template.defaultWidth,
                        96 / template.defaultHeight
                      )})`,
                      transformOrigin: "center center",
                    }}
                    className="pointer-events-none"
                  >
                    <Renderer
                      data={template.defaultData}
                      mode="teacher"
                      styleVariant="color-coded"
                      width={template.defaultWidth}
                      height={template.defaultHeight}
                    />
                  </div>

                  {/* Hover Insert Button Overlay */}
                  <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md flex items-center gap-1 active:scale-95 transition-transform">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insert on Page</span>
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(template.id, e)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-xs text-slate-400 hover:text-amber-500 transition-colors z-10"
                    title={isFav ? "Starred" : "Star template"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? "fill-amber-400 text-amber-500" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Template Info Card Body */}
                <div className="p-2.5 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {template.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                      <span className="capitalize font-medium text-indigo-500">
                        {template.category}
                      </span>
                      <span>•</span>
                      <span>Grades {template.grades.join(", ")}</span>
                    </div>
                  </div>

                  <span className="shrink-0 text-[8.5px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                    {template.type}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
