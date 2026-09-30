"use client";

import React, { useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useCloudChapterStore } from "../../editor/stores/cloudChapterStore";
import { useUiStore, StudioType } from "../../editor/stores/uiStore";
import { useHistoryStore } from "../../editor/stores/historyStore";
import { useLayoutPartnerStore } from "../../editor/layoutPartner/layoutPartnerStore";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import {
  Undo2,
  Redo2,
  Box,
  BookOpen,
  FileSpreadsheet,
  FileUp,
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  ChevronDown,
} from "lucide-react";

interface TopHeaderProps {
  onOpenDashboard?: () => void;
}

const primaryModes: { id: StudioType; label: string }[] = [
  { id: "LAYOUT", label: "Design" },
  { id: "CONTENT", label: "Write" },
  { id: "REVIEW", label: "Check" },
];

const moreStudios: { id: StudioType; label: string }[] = [
  { id: "VECTOR", label: "Vector" },
  { id: "PIXEL", label: "Pixel" },
  { id: "AI", label: "AI" },
  { id: "BOOK", label: "Book" },
  { id: "PREFLIGHT", label: "Preflight" },
];

const menuItemClass =
  "min-h-9 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-[13px] text-slate-200";

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenDashboard }) => {
  const { updateActiveBook, addPage, duplicatePage, deletePage, activePageIndex } = useEditorStore();
  const book = useEditorStore((s) => s.getActiveBook());
  const activeChapterId = book?.pages[activePageIndex]?.chapterId;
  const centralStatus = useCloudChapterStore(s => activeChapterId ? s.chapters[activeChapterId]?.state : undefined);
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const {
    activeStudio,
    setActiveStudio,
    focusMode,
    setDistractionFree,
    toggleBleed,
    toggleSnap,
    toggleRulers,
    toggleGrid,
    setCommandPaletteOpen,
    setExportModalOpen,
    setBook3dPreviewOpen,
    setManuscriptImportOpen,
    setDataMergeModalOpen,
    saveStatus,
  } = useUiStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const partnerOpen = useLayoutPartnerStore((s) => s.partnerPanelOpen);
  const setPartnerOpen = useLayoutPartnerStore((s) => s.setPartnerPanelOpen);

  if (!book) return null;

  const moreStudioActive = moreStudios.some((st) => st.id === activeStudio);

  const closeMenu = () => setActiveMenu(null);

  return (
    <header className="h-[52px] w-full bg-[#080b11]/92 supports-[backdrop-filter]:bg-[#080b11]/80 supports-[backdrop-filter]:backdrop-blur-xl border-b border-white/[0.08] px-3 flex items-center justify-between text-slate-200 z-30 select-none font-sans text-[13px]">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-2 min-h-9 pr-1 rounded-lg active:scale-[0.97] transition-transform"
          title="Back to Book Dashboard"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_16px_rgba(79,70,229,0.28)]">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-slate-100 hidden sm:inline">
            NEX<span className="text-indigo-300">MAXX</span>
          </span>
        </button>

        <div className="hidden lg:flex items-center gap-0.5 text-slate-400 relative">
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-white/5 hover:text-slate-100 transition-colors ${
                activeMenu === "file" ? "bg-white/10 text-white" : ""
              }`}
            >
              File
            </button>
            {activeMenu === "file" && (
              <div
                className="absolute left-0 top-11 w-56 bg-[#0f1422] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col"
                onMouseLeave={closeMenu}
              >
                <button
                  onClick={() => {
                    addPage();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  New Page
                </button>
                <button onClick={() => { useCurriculumUi.getState().openBuilder(); closeMenu(); }} className={menuItemClass}>New Chapter</button>
                <button
                  onClick={() => {
                    setManuscriptImportOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} flex items-center justify-between`}
                >
                  <span>Import Manuscript...</span>
                  <FileUp className="w-4 h-4 text-indigo-300" />
                </button>
                <button
                  onClick={() => {
                    setDataMergeModalOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} flex items-center justify-between`}
                >
                  <span>Data Merge...</span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setExportModalOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} font-medium text-emerald-300 hover:bg-emerald-500/20`}
                >
                  Export PDF...
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-white/5 hover:text-slate-100 transition-colors ${
                activeMenu === "edit" ? "bg-white/10 text-white" : ""
              }`}
            >
              Edit
            </button>
            {activeMenu === "edit" && (
              <div
                className="absolute left-0 top-11 w-56 bg-[#0f1422] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col"
                onMouseLeave={closeMenu}
              >
                <button
                  onClick={() => {
                    undo();
                    closeMenu();
                  }}
                  disabled={!canUndo}
                  className={`${menuItemClass} flex justify-between disabled:opacity-40`}
                >
                  <span>Undo</span>
                  <span className="text-slate-500 font-mono text-xs">⌘Z</span>
                </button>
                <button
                  onClick={() => {
                    redo();
                    closeMenu();
                  }}
                  disabled={!canRedo}
                  className={`${menuItemClass} flex justify-between disabled:opacity-40`}
                >
                  <span>Redo</span>
                  <span className="text-slate-500 font-mono text-xs">⇧⌘Z</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    duplicatePage(activePageIndex);
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Duplicate Page
                </button>
                <button
                  onClick={() => {
                    deletePage(activePageIndex);
                    closeMenu();
                  }}
                  className={`${menuItemClass} text-rose-300 hover:bg-rose-500/20`}
                >
                  Delete Page
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setCommandPaletteOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} flex justify-between`}
                >
                  <span>Command Palette...</span>
                  <span className="text-slate-500 font-mono text-xs">⌘K</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-white/5 hover:text-slate-100 transition-colors ${
                activeMenu === "view" ? "bg-white/10 text-white" : ""
              }`}
            >
              View
            </button>
            {activeMenu === "view" && (
              <div
                className="absolute left-0 top-11 w-56 bg-[#0f1422] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col"
                onMouseLeave={closeMenu}
              >
                <button
                  onClick={() => {
                    toggleRulers();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Toggle Rulers
                </button>
                <button
                  onClick={() => {
                    toggleGrid();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Toggle Grid
                </button>
                <button
                  onClick={() => {
                    toggleBleed();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Toggle 3mm Bleed Box
                </button>
                <button
                  onClick={() => {
                    toggleSnap();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Toggle Snapping
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={book.title}
            onChange={(e) => updateActiveBook({ title: e.target.value })}
            className="bg-transparent hover:bg-white/5 focus:bg-black/40 px-2 min-h-9 rounded-lg text-[13px] font-semibold text-slate-100 outline-none transition-colors border border-transparent focus:border-indigo-500/50 max-w-[180px] truncate"
            title="Click to rename book"
          />
          <div className="hidden sm:flex items-center gap-1.5 px-2 min-h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{centralStatus ? `Content: ${centralStatus}` : saveStatus || "Local backup only"}</span>
          </div>
        </div>
      </div>

      <nav
        aria-label="Workspace Modes"
        className="flex items-center bg-[#10151f] rounded-xl p-1 border border-white/[0.08] gap-0.5"
      >
        {primaryModes.map((st) => {
          const isCurrent = activeStudio === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveStudio(st.id)}
              className={`min-h-9 px-3 rounded-lg text-[13px] font-medium transition-colors active:scale-[0.97] ${
                isCurrent
                  ? "bg-[#1c2433] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
            >
              {st.label}
            </button>
          );
        })}
        <div
          className="relative"
          onMouseLeave={() => {
            if (activeMenu === "more") closeMenu();
          }}
        >
          <button
            onClick={() => setActiveMenu(activeMenu === "more" ? null : "more")}
            className={`min-h-9 px-2.5 rounded-lg text-[13px] font-medium inline-flex items-center gap-1 transition-colors active:scale-[0.97] ${
              moreStudioActive || activeMenu === "more"
                ? "bg-[#1c2433] text-white"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
            }`}
            aria-expanded={activeMenu === "more"}
            aria-haspopup="menu"
          >
            More
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {activeMenu === "more" && (
            <div className="absolute right-0 top-11 w-56 bg-[#0f1422] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col">
              <span className="px-3 pt-1.5 pb-1 text-xs text-slate-500">Studios</span>
              {moreStudios.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStudio(st.id);
                    closeMenu();
                  }}
                  className={`${menuItemClass} ${
                    activeStudio === st.id ? "bg-white/10 text-white" : ""
                  }`}
                >
                  {st.label}
                </button>
              ))}
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => {
                  setDistractionFree(!focusMode);
                  closeMenu();
                }}
                className={`${menuItemClass} flex items-center gap-2`}
              >
                {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                <span>{focusMode ? "Exit Focus" : "Focus canvas"}</span>
              </button>
              <button
                onClick={() => {
                  setBook3dPreviewOpen(true);
                  closeMenu();
                }}
                className={`${menuItemClass} flex items-center gap-2`}
              >
                <Box className="w-4 h-4 text-slate-400" />
                <span>3D preview</span>
              </button>
              <button
                onClick={() => {
                  setPartnerOpen(!partnerOpen);
                  closeMenu();
                }}
                className={`${menuItemClass} flex items-center gap-2`}
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>{partnerOpen ? "Hide Layout Partner" : "Layout Partner"}</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center bg-[#10151f] rounded-xl p-0.5 border border-white/[0.08]">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`w-9 h-9 rounded-lg inline-flex items-center justify-center transition-colors active:scale-[0.97] ${
              canUndo ? "text-slate-200 hover:text-white hover:bg-white/10" : "text-slate-600 cursor-not-allowed"
            }`}
            title="Undo (Ctrl/Cmd + Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`w-9 h-9 rounded-lg inline-flex items-center justify-center transition-colors active:scale-[0.97] ${
              canRedo ? "text-slate-200 hover:text-white hover:bg-white/10" : "text-slate-600 cursor-not-allowed"
            }`}
            title="Redo (Ctrl/Cmd + Shift + Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 min-h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold border border-emerald-300/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_16px_rgba(6,78,59,0.35)] active:scale-[0.97] transition-transform"
          title="Export Publication PDF"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
