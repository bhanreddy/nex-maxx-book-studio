"use client";

import React, { useEffect, useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { COMPREHENSIVE_PRESET_LIBRARY } from "../../editor/registry/presets";
import { PresetLibrary } from "./PresetLibrary";
import { DesignControls } from "./DesignControls";
import {
  FileText,
  LayoutGrid,
  Sparkles,
  BookOpen,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
  Search,
  Shapes,
} from "lucide-react";
import { EducationalBlocksPanel } from "../educational/EducationalBlocksPanel";
import { CurriculumBlocksPanel } from "../curriculum/CurriculumBlocksPanel";
import { ChapterStructurePanel } from "../curriculum/ChapterStructurePanel";

export const LeftSidebar: React.FC = () => {
  const {
    activePageIndex,
    setActivePageIndex,
    addPage,
    deletePage,
    duplicatePage,
    addElement,
    applyPagePreset,
    getActivePageElements,
    updateElementTransform,
    selectElement,
    selectedElementIds,
    addUnit,
  } = useEditorStore();

  const {
    leftPanelOpen,
    setLeftPanelOpen,
    leftPanelTab,
    setLeftPanelTab,
    presetCategoryFilter,
    setPresetCategoryFilter,
  } = useUiStore();
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [presetGradeFilter, setPresetGradeFilter] = useState("all");
  const [presetSubjectFilter, setPresetSubjectFilter] = useState("all");
  const [presetSearch, setPresetSearch] = useState("");
  const [panelWidth, setPanelWidth] = useState(360);
  useEffect(() => {
    const width = window.innerWidth;
    if (width < 860) setPanelWidth(Math.max(280, Math.min(320, Math.round(width * 0.42))));
    else if (width < 1180) setPanelWidth(340);
  }, []);
  const [moreOpen, setMoreOpen] = useState(false);

  const book = useEditorStore((s) => s.getActiveBook());
  const activeElements = getActivePageElements();

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setPanelWidth(Math.min(480, Math.max(280, startW + delta)));
    };

    const handleMouseUp = () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!leftPanelOpen) {
    return (
      <button
        onClick={() => setLeftPanelOpen(true)}
        className="absolute top-16 left-0 bg-white/95 dark:bg-[#111827]/90 text-slate-700 dark:text-slate-300 p-2 rounded-r-lg border-r border-t border-b border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 shadow-lg"
        title="Open Tool Library"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className="studio-sidebar relative h-full bg-white dark:bg-[#0d121e] border-r border-slate-200/90 dark:border-white/[0.08] flex flex-col text-slate-800 dark:text-slate-200 z-20 select-none flex-shrink-0 min-w-0"
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={handleStartResize}
        onDoubleClick={() => setPanelWidth(360)}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#d7c49c]/50 transition-colors z-30"
        title="Drag to resize panel (Double-click to reset)"
      />
      {/* Tab Navigation Strip */}
      <div className="studio-side-tabs">
        <div className="studio-side-tabs-scroll" role="tablist" aria-label="Sidebar">
          {(
            [
              { id: "curriculum", label: "Blocks", icon: Sparkles },
              { id: "elements", label: "Presets", icon: LayoutGrid },
              { id: "pages", label: "Pages", icon: FileText },

            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = leftPanelTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setMoreOpen(false);
                  setLeftPanelTab(tab.id);
                }}
                className={`studio-side-tab ${isActive ? "is-active" : ""}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
          {(() => {
            const moreTabs = [
              { id: "structure", label: "Chapter Plan", icon: BookOpen },
              { id: "blocks", label: "Educational Blocks", icon: Shapes },
              { id: "layers", label: "Layers", icon: Layers },
              { id: "templates", label: "Templates", icon: LayoutGrid },
              { id: "content", label: "Curriculum", icon: BookOpen },
              { id: "styles", label: "Styles", icon: Sparkles },
              { id: "comments", label: "Review", icon: Layers },
              { id: "assets", label: "Assets", icon: ImageIcon },
            ] as const;
            const activeMore = moreTabs.find((tab) => tab.id === leftPanelTab);
            return (
              <div className="studio-side-more">
                <button
                  onClick={() => setMoreOpen((open) => !open)}
                  className={`studio-side-tab ${activeMore || moreOpen ? "is-active" : ""}`}
                  aria-expanded={moreOpen}
                  title={activeMore ? activeMore.label : "More panels"}
                >
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {moreOpen && (
                  <div className="studio-side-menu" role="menu">
                    {moreTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          role="menuitem"
                          onClick={() => {
                            setLeftPanelTab(tab.id);
                            setMoreOpen(false);
                          }}
                          className={leftPanelTab === tab.id ? "is-active" : ""}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        <button
          onClick={() => setLeftPanelOpen(false)}
          className="studio-side-collapse"
          title="Collapse Panel"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 0: Educational Blocks System */}
      {leftPanelTab === "curriculum" && <CurriculumBlocksPanel />}
      {leftPanelTab === "structure" && <ChapterStructurePanel />}
      {leftPanelTab === "blocks" && (
        <EducationalBlocksPanel />
      )}

      {/* Tab 1: Elements Browser */}
      {leftPanelTab === "elements" && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <PresetLibrary />
        </div>
      )}

      {/* Tab 2: Pages Virtualized Navigator */}
      {leftPanelTab === "pages" && book && (
        <div className="flex-1 flex flex-col overflow-hidden p-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Pages
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-mono text-[9px] font-semibold border border-indigo-500/25">
                {book.pages.length}
              </span>
            </div>
            <button
              onClick={() => addPage(activePageIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-[0_0_12px_rgba(99,102,241,0.35)] active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {book.pages.map((p, idx) => {
              const isCurrent = idx === activePageIndex;

              // Color mapping for publication status
              const statusColor =
                p.status === "Approved"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : p.status === "Writing"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : p.status === "Content Review"
                  ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                  : "bg-purple-500/15 text-purple-300 border-purple-500/30";

              return (
                <div
                  key={p.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-transparent border-indigo-500/80 text-white shadow-[0_0_18px_rgba(99,102,241,0.2)] scale-[1.01]"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Miniature Page Skeleton Icon */}
                    <div
                      className={`w-7 h-9 rounded-sm border p-1 flex flex-col justify-between transition-colors ${
                        isCurrent
                          ? "bg-white text-slate-900 border-indigo-400 shadow-sm"
                          : "bg-slate-900/80 border-white/20 text-slate-400 group-hover:border-white/30"
                      }`}
                    >
                      <div
                        className={`w-full h-1 rounded-xs ${
                          isCurrent ? "bg-indigo-500" : "bg-slate-600"
                        }`}
                      />
                      <div
                        className={`w-3/4 h-0.5 rounded-xs ${
                          isCurrent ? "bg-slate-300" : "bg-slate-700"
                        }`}
                      />
                      <div
                        className={`w-full h-1.5 rounded-xs ${
                          isCurrent ? "bg-slate-200" : "bg-slate-700"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-white">
                          {p.displayNumber === "Cover" ? "Book Cover" : `Page ${p.displayNumber}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[8.5px] px-1.5 py-0.2 rounded-full border font-medium ${statusColor}`}
                        >
                          {p.status}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          • {p.elementIds.length} el
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicatePage(idx);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {book.pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(idx);
                        }}
                        className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: 160+ Massive Preset Ecosystem Browser (Directives 23-37) */}
      {leftPanelTab === "templates" && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 text-xs">
          {/* Header & Total Count */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5pt] font-semibold text-slate-200">
              Preset Library
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[7.5pt] border border-indigo-500/30">
              {COMPREHENSIVE_PRESET_LIBRARY.length} Presets
            </span>
          </div>

          {/* Search Box (Directive 29) */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search (e.g. science activity, mcq, hero)..."
              value={presetSearch}
              onChange={(e) => setPresetSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter Pills (Directive 24, 27) */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none mb-2 text-[7.5pt]">
            {[
              { id: "all", label: "All" },
              { id: "content", label: "Content" },
              { id: "activity", label: "Activities" },
              { id: "assessment", label: "Assessment" },
              { id: "chapter", label: "Chapter" },
              { id: "visual", label: "Visual" },
              { id: "science", label: "Science" },
              { id: "mathematics", label: "Math" },
              { id: "early-learning", label: "Early Learning" },
              { id: "language", label: "Language" },
              { id: "unit", label: "Unit" },
              { id: "book-structure", label: "Structure" },
            ].map((cat) => {
              const active = presetCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setPresetCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded-md flex-shrink-0 font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Grade & Subject Secondary Filters */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            <select
              value={presetGradeFilter}
              onChange={(e) => setPresetGradeFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded px-1.5 py-1 text-[7.5pt] text-slate-300 outline-none"
            >
              <option value="all">All Grades</option>
              <option value="nursery">Pre-K / Nursery</option>
              <option value="primary">Grades 1–5</option>
              <option value="middle">Grades 6–8</option>
              <option value="high">Grades 9–12</option>
            </select>
            <select
              value={presetSubjectFilter}
              onChange={(e) => setPresetSubjectFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded px-1.5 py-1 text-[7.5pt] text-slate-300 outline-none"
            >
              <option value="all">All Subjects</option>
              <option value="science">Science</option>
              <option value="mathematics">Mathematics</option>
              <option value="english">English / Language</option>
              <option value="social">Social Studies / EVS</option>
            </select>
          </div>

          {/* Presets Virtualized / Scrollable Cards Grid */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {COMPREHENSIVE_PRESET_LIBRARY.filter((p) => {
              // Category filter
              if (presetCategoryFilter !== "all" && p.category !== presetCategoryFilter) {
                return false;
              }
              // Grade filter
              if (presetGradeFilter === "nursery" && !p.tags.includes("nursery") && !p.tags.includes("early-learning")) {
                return false;
              }
              // Subject filter
              if (presetSubjectFilter !== "all" && !p.tags.includes(presetSubjectFilter) && p.category !== presetSubjectFilter) {
                return false;
              }
              // Search query
              if (presetSearch.trim()) {
                const q = presetSearch.toLowerCase();
                const matchName = p.name.toLowerCase().includes(q);
                const matchCat = p.category.toLowerCase().includes(q);
                const matchDesc = p.description.toLowerCase().includes(q);
                const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
                if (!matchName && !matchCat && !matchDesc && !matchTags) return false;
              }
              return true;
            }).map((preset) => (
              <div
                key={preset.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-nexmaxx-preset", preset.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/60 hover:bg-slate-900 transition-all flex items-start gap-3 cursor-grab active:cursor-grabbing group select-none"
              >
                {/* Fast Cached SVG Schematic Thumbnail (Directive 26) */}
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 60 84" className="w-12 h-16 rounded bg-slate-950 border border-white/10 shadow-xs">
                    <rect width="60" height="84" fill="#0f172a" rx="2" />
                    <rect x="6" y="6" width="36" height="4" rx="1" fill="#818cf8" />
                    {preset.category === "activities" && (
                      <>
                        <rect x="6" y="14" width="48" height="22" rx="2" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="0.5" />
                        <rect x="10" y="18" width="20" height="3" rx="0.5" fill="#34d399" />
                        <line x1="10" y1="24" x2="44" y2="24" stroke="#6ee7b7" strokeWidth="1" strokeDasharray="2,2" />
                        <rect x="6" y="40" width="48" height="36" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                      </>
                    )}
                    {preset.category === "assessment" && (
                      <>
                        <circle cx="10" cy="18" r="2.5" fill="#f59e0b" />
                        <rect x="16" y="16" width="36" height="3" rx="0.5" fill="#fbbf24" />
                        <circle cx="10" cy="34" r="2.5" fill="#f59e0b" />
                        <rect x="16" y="32" width="32" height="3" rx="0.5" fill="#fbbf24" />
                        <circle cx="10" cy="50" r="2.5" fill="#f59e0b" />
                        <rect x="16" y="48" width="38" height="3" rx="0.5" fill="#fbbf24" />
                      </>
                    )}
                    {preset.category === "visual" && (
                      <>
                        <rect x="6" y="14" width="48" height="38" rx="2" fill="#8b5cf6" fillOpacity="0.25" stroke="#a78bfa" strokeWidth="0.5" />
                        <polygon points="12,44 24,28 36,42 44,34 50,44" fill="#a78bfa" fillOpacity="0.6" />
                        <line x1="6" y1="58" x2="54" y2="58" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="6" y1="64" x2="44" y2="64" stroke="#64748b" strokeWidth="1" />
                      </>
                    )}
                    {preset.category !== "activities" && preset.category !== "assessment" && preset.category !== "visual" && (
                      <>
                        <line x1="6" y1="14" x2="54" y2="14" stroke="#94a3b8" strokeWidth="1.5" />
                        <rect x="6" y="20" width="22" height="26" rx="1" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="0.5" />
                        <line x1="32" y1="22" x2="54" y2="22" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="32" y1="28" x2="54" y2="28" stroke="#94a3b8" strokeWidth="1" />
                        <line x1="32" y1="34" x2="48" y2="34" stroke="#64748b" strokeWidth="1" />
                        <line x1="6" y1="52" x2="54" y2="52" stroke="#64748b" strokeWidth="1" />
                        <line x1="6" y1="58" x2="46" y2="58" stroke="#475569" strokeWidth="1" />
                      </>
                    )}
                    <circle cx="50" cy="78" r="2" fill="#64748b" />
                  </svg>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-slate-100 block truncate group-hover:text-indigo-300 text-[8.5pt]">
                      {preset.name}
                    </span>
                    <span className="text-[6.5pt] font-mono uppercase px-1.5 py-0.2 rounded bg-white/10 text-slate-400 flex-shrink-0">
                      ⚡ Adapt
                    </span>
                  </div>
                  <p className="text-[7.5pt] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {preset.description}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => applyPagePreset(preset.id)}
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded text-[7.5pt] font-medium transition-colors"
                      title="Apply preset to current page"
                    >
                      Apply
                    </button>
                    <span className="text-[7pt] text-slate-500 font-mono">
                      or drag to page
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Structured Curriculum Content Tree */}
      {leftPanelTab === "content" && book && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Curriculum Units & Chapters
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {book.units.map((unit) => (
              <div key={unit.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block">
                  Unit {unit.number}: {unit.title}
                </span>
                {unit.description && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{unit.description}</p>
                )}

                <div className="mt-2 space-y-1.5 pl-2 border-l border-white/10">
                  {book.chapters
                    .filter((c) => c.unitId === unit.id)
                    .map((ch) => (
                      <div key={ch.id} className="text-xs text-slate-300">
                        <span className="font-medium text-sky-400">
                          Ch {ch.number}: {ch.title}
                        </span>
                        <ul className="text-[10px] text-slate-400 mt-0.5 list-disc list-inside">
                          {ch.learningObjectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {/* Quick Add Unit / Chapter */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Add Unit to Curriculum
              </span>
              <input
                type="text"
                placeholder="Unit Title..."
                value={newUnitTitle}
                onChange={(e) => setNewUnitTitle(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-200 outline-none"
              />
              <button
                onClick={() => {
                  if (newUnitTitle.trim()) {
                    addUnit(newUnitTitle.trim());
                    setNewUnitTitle("");
                  }
                }}
                className="w-full py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium text-slate-200"
              >
                + Add Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Layers Tree */}
      {leftPanelTab === "layers" && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Page Layers ({activeElements.length})
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {activeElements.slice().reverse().map((el) => {
              const isSelected = selectedElementIds.includes(el.id);
              return (
                <div
                  key={el.id}
                  onClick={() => selectElement(el.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono text-slate-400">z{el.transform.zIndex}</span>
                    <span className="truncate">{el.displayName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateElementTransform(el.id, {}, true);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-40" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: Central Asset Library */}
      {leftPanelTab === "assets" && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Curriculum Media Library
          </span>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 pr-1">
            {[
              {
                title: "Plant Cells",
                src: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80",
              },
              {
                title: "Botanical Leaves",
                src: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
              },
              {
                title: "Science Lab",
                src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
              },
              {
                title: "Microscope Optics",
                src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80",
              },
            ].map((asset, i) => (
              <div
                key={i}
                onClick={() => addElement("preset-image-frame", 54, 180)}
                className="group relative rounded-lg overflow-hidden bg-black/40 border border-white/5 hover:border-indigo-500 cursor-pointer aspect-video"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.src} alt={asset.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5 opacity-90 group-hover:opacity-100">
                  <span className="text-[9px] font-medium text-white">{asset.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Typography Paragraph Styles */}
      {leftPanelTab === "styles" && book && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <DesignControls />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Paragraph Styles ({book.textStyles?.length || 0})
          </span>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {(book.textStyles || []).map((style) => (
              <div
                key={style.id}
                className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 flex items-center justify-between group"
              >
                <div>
                  <span className="font-semibold text-xs text-slate-200 block">{style.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {style.fontFamily.split(",")[0]} • {style.fontSize}pt • w{style.fontWeight}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (selectedElementIds.length > 0) {
                      selectedElementIds.forEach((id) =>
                        useEditorStore.getState().applyTextStyle(id, style.id)
                      );
                    } else {
                      useUiStore.getState().showToast({
                        type: "info",
                        title: "Select a text element first to apply style",
                      });
                    }
                  }}
                  className="px-2 py-1 rounded bg-white/10 group-hover:bg-indigo-600 text-[10px] text-slate-300 group-hover:text-white font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Review Comments Thread */}
      {leftPanelTab === "comments" && book && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Review Comments ({book.comments?.length || 0})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {(book.comments || []).map((comm) => (
              <div
                key={comm.id}
                className={`p-2.5 rounded-lg border text-xs transition-colors ${
                  comm.resolved
                    ? "bg-black/20 border-white/5 opacity-60"
                    : "bg-indigo-950/20 border-indigo-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[11px] text-indigo-300">
                    {comm.author} ({comm.role})
                  </span>
                  <button
                    onClick={() => useEditorStore.getState().resolveComment(comm.id)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      comm.resolved
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {comm.resolved ? "Resolved ✓" : "Mark Resolved"}
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{comm.text}</p>
                <span className="text-[9px] text-slate-500 mt-1 block">{comm.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Quick Comment Input */}
          <div className="pt-2 border-t border-white/10">
            <input
              type="text"
              placeholder="Leave an academic review comment..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 mb-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const activePage = useEditorStore.getState().getActivePage();
                  useEditorStore
                    .getState()
                    .addComment(
                      activePage?.id || "page-1",
                      selectedElementIds[0],
                      e.currentTarget.value.trim()
                    );
                  e.currentTarget.value = "";
                }
              }}
            />
            <span className="text-[9px] text-slate-500 block">
              Press Enter to submit comment to current page
            </span>
          </div>
        </div>
      )}
      {leftPanelTab !== "structure" && <ChapterStructurePanel compact />}
    </aside>
  );
};
