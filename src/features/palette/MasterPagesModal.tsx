/**
 * NEX MAXX Book Studio - Master Pages & Layout Presets Studio
 * 
 * Reusable layout presets:
 * - Chapter Opening
 * - Lesson
 * - Standard Content
 * - Activity
 * - Exercise
 * - Worksheet
 * - Assessment
 * - Revision
 */

"use client";

import { commitDocumentChange } from "../../editor/core/documentTransaction";
import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import {
  MASTER_PAGE_PRESETS,
  MasterPresetKind,
  propagateMasterToLinkedPages,
  propagateMasterToPage,
} from "../../editor/layout/masterPageEngine";
import { MasterPageDefinition } from "../../domain/book/types";
import {
  X,
  LayoutTemplate,
  Layers,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  Sliders,
} from "lucide-react";

export const MasterPagesModal: React.FC = () => {
  const { masterPagesModalOpen, setMasterPagesModalOpen, showToast } = useUiStore();
  const { getActiveBook, getActivePage, elements, saveToStorage } = useEditorStore();

  const book = getActiveBook();
  const activePage = getActivePage();

  const [selectedKind, setSelectedKind] = useState<MasterPresetKind>("StandardContent");
  const [customHeader, setCustomHeader] = useState("");
  const [customFooter, setCustomFooter] = useState("");

  if (!masterPagesModalOpen || !book) return null;

  const currentPreset = MASTER_PAGE_PRESETS[selectedKind];
  const pageMaster = book.masterPages.find((m) => m.id === activePage?.masterPageId);

  const handleApplyToActivePage = () => {
    if (!activePage) return;

    const masterDef: MasterPageDefinition = {
      id: currentPreset.id,
      name: currentPreset.name,
      type: currentPreset.kind,
      headerText: customHeader,
      footerText: customFooter,
      showPageNumber: currentPreset.showPageNumber,
      pageNumberPosition: currentPreset.pageNumberPosition,
      backgroundPreset: currentPreset.backgroundPreset,
      margins: currentPreset.margins,
      themeAccent: currentPreset.themeAccent,
      badgeLabel: currentPreset.badgeLabel,
      gridColumns: currentPreset.gridColumns,
    };

    // Propagate to active page
    const result = propagateMasterToPage(masterDef, activePage, elements, book);

    // Save master definition to book if not exists
    const masterExists = book.masterPages.some((m) => m.id === masterDef.id);
    const updatedMasterPages = masterExists
      ? book.masterPages.map((m) => (m.id === masterDef.id ? masterDef : m))
      : [...book.masterPages, masterDef];

    const updatedPages = book.pages.map((p) => (p.id === activePage.id ? result.page : p));

    const linked = propagateMasterToLinkedPages(masterDef, { ...book, masterPages: updatedMasterPages, pages: updatedPages }, result.updatedElements);
    commitDocumentChange('Apply master page', linked.book, linked.elements);
    showToast({
      type: "success",
      title: "Master Page Applied",
      message: `Page ${activePage.displayNumber} is now linked to '${currentPreset.name}'.`,
    });
    setMasterPagesModalOpen(false);
  };

  const handleApplyToEntireChapter = () => {
    if (!activePage?.chapterId) {
      showToast({
        type: "warning",
        title: "No Chapter Assigned",
        message: "Current page is not part of a chapter.",
      });
      return;
    }

    const masterDef: MasterPageDefinition = {
      id: currentPreset.id,
      name: currentPreset.name,
      type: currentPreset.kind,
      headerText: customHeader,
      footerText: customFooter,
      showPageNumber: currentPreset.showPageNumber,
      pageNumberPosition: currentPreset.pageNumberPosition,
      backgroundPreset: currentPreset.backgroundPreset,
      margins: currentPreset.margins,
      themeAccent: currentPreset.themeAccent,
      badgeLabel: currentPreset.badgeLabel,
      gridColumns: currentPreset.gridColumns,
    };

    const chapterPages = book.pages.filter((p) => p.chapterId === activePage.chapterId);
    let updatedElementsMap = { ...elements };
    let updatedPages = [...book.pages];

    for (const p of chapterPages) {
      const res = propagateMasterToPage(masterDef, p, updatedElementsMap, book);
      updatedElementsMap = res.updatedElements;
      updatedPages = updatedPages.map((page) => (page.id === p.id ? res.page : page));
    }

    const masterExists = book.masterPages.some((m) => m.id === masterDef.id);
    const updatedMasterPages = masterExists
      ? book.masterPages.map((m) => (m.id === masterDef.id ? masterDef : m))
      : [...book.masterPages, masterDef];

    const linked = propagateMasterToLinkedPages(masterDef, { ...book, masterPages: updatedMasterPages, pages: updatedPages }, updatedElementsMap);
    commitDocumentChange('Apply chapter master', linked.book, linked.elements);
    showToast({
      type: "success",
      title: "Chapter Master Applied",
      message: `Applied '${currentPreset.name}' to ${chapterPages.length} pages in this chapter.`,
    });
    setMasterPagesModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={() => setMasterPagesModalOpen(false)}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Master Pages" className="w-full max-w-3xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Master Pages & Layout Presets
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                  8 PUBLISHING PRESETS
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Centralized master layouts with safe cascading propagation to linked pages
              </p>
            </div>
          </div>
          <button
            aria-label="Close master pages"
            onClick={() => setMasterPagesModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Split View */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Preset Selector Grid (Left) */}
          <div className="w-72 border-r border-white/10 p-3 space-y-2 overflow-y-auto bg-black/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-1">
              Select Preset
            </span>
            {(Object.keys(MASTER_PAGE_PRESETS) as MasterPresetKind[]).map((kind) => {
              const p = MASTER_PAGE_PRESETS[kind];
              const isSelected = selectedKind === kind;
              const isPageActive = pageMaster?.type === kind;

              return (
                <button
                  key={kind}
                  onClick={() => {
                    setSelectedKind(kind);
                    setCustomHeader(p.headerText);
                    setCustomFooter(p.footerText);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg"
                      : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.themeAccent }}
                      />
                      {p.name}
                    </span>
                    {isPageActive && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Details & Configuration (Right) */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#0e131d]">
            {/* Active Preset Banner */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{currentPreset.name}</span>
                  {currentPreset.badgeLabel && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase"
                      style={{
                        backgroundColor: `${currentPreset.themeAccent}33`,
                        color: currentPreset.themeAccent,
                      }}
                    >
                      {currentPreset.badgeLabel}
                    </span>
                  )}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentPreset.gridColumns} Column Grid
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentPreset.description}
              </p>
            </div>

            {/* Layout Geometry & Margins */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-white/10 bg-black/30 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Print Margins (pt)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 font-mono">
                  <div>Top: {currentPreset.margins.topPt} pt</div>
                  <div>Bottom: {currentPreset.margins.bottomPt} pt</div>
                  <div>Inside (Gutter): {currentPreset.margins.insidePt} pt</div>
                  <div>Outside: {currentPreset.margins.outsidePt} pt</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-black/30 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Folio & Page Number
                </span>
                <div className="text-xs text-slate-200 space-y-1">
                  <div>Display Number: {currentPreset.showPageNumber ? "Enabled" : "Disabled (Cover / Hero)"}</div>
                  <div>Position: {currentPreset.pageNumberPosition}</div>
                </div>
              </div>
            </div>

            {/* Editable Running Header / Footer Text */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Running Header Text (Optional Override)
                </label>
                <input
                  type="text"
                  placeholder={currentPreset.headerText || "Inherits Chapter / Book title dynamically"}
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Running Footer Text
                </label>
                <input
                  type="text"
                  placeholder={currentPreset.footerText || "Optional publisher note"}
                  value={customFooter}
                  onChange={(e) => setCustomFooter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Override Protection Notice */}
            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200/90 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Smart Override Protection:</strong> Content and custom elements placed on
                individual pages will never be overwritten. Only shared running headers, footers,
                and default page margins are safely synchronized.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Active: Page {activePage?.displayNumber ?? 1}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleApplyToEntireChapter}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
            >
              Apply to Chapter ({book.pages.filter((p) => p.chapterId === activePage?.chapterId).length} pages)
            </button>
            <button
              onClick={handleApplyToActivePage}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Apply to Current Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
