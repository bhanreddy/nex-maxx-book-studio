"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useCloudChapterStore } from "../../editor/stores/cloudChapterStore";
import { useUiStore, StudioType } from "../../editor/stores/uiStore";
import { useHistoryStore } from "../../editor/stores/historyStore";
import { useLayoutPartnerStore } from "../../editor/layoutPartner/layoutPartnerStore";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import { commitDocumentChange } from "../../editor/core/documentTransaction";
import { repaginateFromPage } from "../../editor/core/paginationEngine";
import { PublisherLogo } from '../ui/PublisherLogo';
import {
  Undo2,
  Redo2,
  Box,
  FileSpreadsheet,
  FileUp,
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  ChevronDown,
  Sun,
  Moon,
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
  "min-h-9 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-left text-[13px] text-slate-700 dark:text-slate-200 transition-colors";

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
    themeMode,
    toggleThemeMode,
    isFullscreen,
    toggleFullscreen,
    setMasterPagesModalOpen,
    setDesignTokensModalOpen,
    setBookStructureModalOpen,
    setPreflightModalOpen,
    columnGrid,
    setColumnGrid,
    baselineGrid,
    setBaselineGrid,
    showToast,
  } = useUiStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);
  useEffect(() => { const update = () => setOnline(navigator.onLine); update(); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  useEffect(() => {
    setMounted(true);
  }, []);
  const partnerOpen = useLayoutPartnerStore((s) => s.partnerPanelOpen);
  const setPartnerOpen = useLayoutPartnerStore((s) => s.setPartnerPanelOpen);

  if (!book) return null;

  const moreStudioActive = moreStudios.some((st) => st.id === activeStudio);

  const closeMenu = () => setActiveMenu(null);

  const handleAutoPaginate = () => {
    const editor = useEditorStore.getState();
    const activeBook = editor.getActiveBook();
    if (!activeBook) return;
    const res = repaginateFromPage(activeBook, editor.elements, editor.activePageIndex);
    if (res.affectedPageIds.length) commitDocumentChange('Auto paginate', { ...activeBook, pages: res.updatedPages }, res.updatedElements);
    showToast({
      type: res.overflowResolved ? 'success' : 'warning',
      title: res.overflowResolved ? 'Pagination checked' : 'Layout needs attention',
      message: res.overflowResolved ? `${res.pagesCreated} continuation pages; ${res.elementsMovedCount} elements moved. Manual artwork preserved.` : `${res.unresolvedElementIds.length} blocks cannot fit safely. Resize them or use their chapter flow controls.`,
    });
  };

  return (
    <header className="h-[52px] w-full bg-white/95 dark:bg-[#080b11]/92 supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-[#080b11]/80 supports-[backdrop-filter]:backdrop-blur-xl border-b border-slate-200/90 dark:border-white/[0.08] px-3 flex items-center justify-between text-slate-700 dark:text-slate-200 z-30 select-none font-sans text-[13px] transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-2 min-h-9 pr-1 rounded-lg active:scale-[0.97] transition-transform"
          title="Back to Book Dashboard"
          aria-label="NEX MAXX — Back to Book Dashboard"
        >
          <PublisherLogo className="h-11 w-auto" />
        </button>

        <div className="hidden lg:flex items-center gap-0.5 text-slate-500 dark:text-slate-400 relative">
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
                activeMenu === "file" ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : ""
              }`}
            >
              File
            </button>
            {activeMenu === "file" && (
              <div
                className="absolute left-0 top-11 w-56 bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl p-1.5 z-50 flex flex-col"
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
                  <span>Import & Continue…</span>
                  <FileUp className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                </button>
                <button
                  onClick={() => {
                    setDataMergeModalOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} flex items-center justify-between`}
                >
                  <span>Data Merge...</span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </button>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setExportModalOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} font-medium text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20`}
                >
                  Export PDF...
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
                activeMenu === "edit" ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : ""
              }`}
            >
              Edit
            </button>
            {activeMenu === "edit" && (
              <div
                className="absolute left-0 top-11 w-56 bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl p-1.5 z-50 flex flex-col"
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
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">⌘Z</span>
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
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">⇧⌘Z</span>
                </button>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
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
                  className={`${menuItemClass} text-rose-500 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20`}
                >
                  Delete Page
                </button>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setCommandPaletteOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} flex justify-between`}
                >
                  <span>Command Palette...</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">⌘K</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
                activeMenu === "view" ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : ""
              }`}
            >
              View
            </button>
            {activeMenu === "view" && (
              <div
                className="absolute left-0 top-11 w-56 bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl p-1.5 z-50 flex flex-col"
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
                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                <button
                  onClick={() => {
                    setColumnGrid({ enabled: !columnGrid.enabled });
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  {columnGrid.enabled ? "Hide Column Grid" : "Show Column Grid (Guides)"}
                </button>
                <button
                  onClick={() => {
                    setBaselineGrid({ enabled: !baselineGrid.enabled });
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  {baselineGrid.enabled ? "Hide Baseline Grid" : "Show Baseline Grid (12pt)"}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "layout" ? null : "layout")}
              className={`min-h-9 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
                activeMenu === "layout" ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white" : ""
              }`}
            >
              Layout
            </button>
            {activeMenu === "layout" && (
              <div
                className="absolute left-0 top-11 w-64 bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl p-1.5 z-50 flex flex-col"
                onMouseLeave={closeMenu}
              >
                <button onClick={() => { useUiStore.getState().setPageBorderModalOpen(true); closeMenu(); }} className={menuItemClass}>Page borders...</button>
                <button
                  onClick={() => {
                    setMasterPagesModalOpen(true);
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Master Pages & Presets...
                </button>
                <button
                  onClick={() => {
                    setDesignTokensModalOpen(true);
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Global Styles & Design Tokens...
                </button>
                <button
                  onClick={() => {
                    setBookStructureModalOpen(true);
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  Book Structure & TOC...
                </button>
                <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                <button
                  onClick={() => {
                    handleAutoPaginate();
                    closeMenu();
                  }}
                  className={`${menuItemClass} text-indigo-600 dark:text-indigo-400 font-medium`}
                >
                  Run Smart Auto-Pagination
                </button>
                <button role="menuitemcheckbox" aria-checked={!!book.autoPagination} title="Flow growing reading text automatically. Artwork and semantic chapter layouts retain their own layout controls." onClick={() => { updateActiveBook({ autoPagination: !book.autoPagination }); closeMenu(); }} className={menuItemClass}>
                  {book.autoPagination ? '✓ Auto-flow edited text' : 'Enable auto-flow edited text'}
                </button>
                <button
                  onClick={() => {
                    setPreflightModalOpen(true);
                    closeMenu();
                  }}
                  className={`${menuItemClass} text-amber-600 dark:text-amber-400 font-medium`}
                >
                  Preflight Print Scan...
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={book.title}
            onChange={(e) => updateActiveBook({ title: e.target.value })}
            className="bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-black/40 px-2 min-h-9 rounded-lg text-[13px] font-semibold text-slate-800 dark:text-slate-100 outline-none transition-colors border border-transparent focus:border-indigo-500/50 max-w-[180px] truncate"
            title="Click to rename book"
          />
          <div className="hidden sm:flex items-center gap-1.5 px-2 min-h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span title="Books save on this device. Linked cloud changes retry when connectivity returns.">{!online ? `Offline · ${saveStatus}` : centralStatus ? `Local: ${saveStatus} · Sync: ${centralStatus}` : saveStatus || "Local backup only"}</span>
          </div>
        </div>
      </div>

      <nav
        aria-label="Workspace Modes"
        className="flex items-center bg-slate-100 dark:bg-[#10151f] rounded-xl p-0.5 border border-slate-200/90 dark:border-white/[0.08] gap-0.5"
      >
        {primaryModes.map((st) => {
          const isCurrent = activeStudio === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveStudio(st.id)}
              className={`min-h-8 px-3 rounded-lg text-[12.5px] font-medium transition-all active:scale-[0.97] ${
                isCurrent
                  ? "bg-white dark:bg-[#1c2433] text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-white/5"
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
            className={`min-h-8 px-2.5 rounded-lg text-[12.5px] font-medium inline-flex items-center gap-1 transition-all active:scale-[0.97] ${
              moreStudioActive || activeMenu === "more"
                ? "bg-white dark:bg-[#1c2433] text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-white/5"
            }`}
            aria-expanded={activeMenu === "more"}
            aria-haspopup="menu"
          >
            More
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {activeMenu === "more" && (
            <div className="absolute right-0 top-10 w-56 bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl dark:shadow-2xl p-1.5 z-50 flex flex-col">
              <button onClick={() => { setManuscriptImportOpen(true); closeMenu(); }} className={`${menuItemClass} flex items-center gap-2`}><FileUp size={16}/><span>Import & Continue…</span></button>
              <span className="px-3 pt-1.5 pb-1 text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Studios</span>
              {moreStudios.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStudio(st.id);
                    closeMenu();
                  }}
                  className={`${menuItemClass} ${
                    activeStudio === st.id ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-semibold" : ""
                  }`}
                >
                  {st.label}
                </button>
              ))}
              <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
              <button
                onClick={() => {
                  toggleFullscreen();
                  closeMenu();
                }}
                className={`${menuItemClass} flex items-center justify-between gap-2`}
              >
                <div className="flex items-center gap-2">
                  {isFullscreen ? <Minimize2 className="w-4 h-4 text-indigo-500" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                  <span>{isFullscreen ? "Exit Fullscreen" : "Full Screen Editing"}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">F11 / F</span>
              </button>
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
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                <span>{partnerOpen ? "Hide Layout Partner" : "Layout Partner"}</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-2">
        {/* Full Screen Editing Mode Toggle */}
        <button
          onClick={toggleFullscreen}
          className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all active:scale-[0.97] border shadow-xs ${
            isFullscreen
              ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25"
              : "bg-slate-100 dark:bg-[#10151f] border-slate-200/90 dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-300"
          }`}
          title={
            isFullscreen
              ? "Exit Fullscreen (Esc or F11)"
              : "Full Screen Editing (Covers browser tabs like YouTube • Shortcut: F or F11)"
          }
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-white" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleThemeMode}
          className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all active:scale-[0.97] bg-slate-100 dark:bg-[#10151f] border border-slate-200/90 dark:border-white/[0.08] hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-amber-300 shadow-xs"
          title={!mounted ? "Toggle theme mode" : themeMode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle theme mode"
          suppressHydrationWarning
        >
          {!mounted ? (
            <span className="w-4 h-4 inline-block" />
          ) : themeMode === "light" ? (
            <Moon className="w-4 h-4 text-slate-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-300" />
          )}
        </button>

        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#10151f] rounded-lg p-0.5 border border-slate-200/90 dark:border-white/[0.08]">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`w-7 h-7 rounded inline-flex items-center justify-center transition-colors active:scale-[0.97] ${
              canUndo ? "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 shadow-xs" : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
            title="Undo (Ctrl/Cmd + Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`w-7 h-7 rounded inline-flex items-center justify-center transition-colors active:scale-[0.97] ${
              canRedo ? "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 shadow-xs" : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
            title="Redo (Ctrl/Cmd + Shift + Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 min-h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-semibold border border-emerald-500 shadow-sm active:scale-[0.97] transition-all"
          title="Export Publication PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
