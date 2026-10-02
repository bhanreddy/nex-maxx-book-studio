"use client";

import React from "react";
import { DeletePageButton } from "./DeletePageButton";
import { EditorPageThumbnail } from "./EditorPageThumbnail";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { Plus, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { StatusHealthIndicator } from "../ui/StatusHealthIndicator";
import { computeVirtualPageWindow } from "../../editor/performance/largeBookEngine";

export const BottomPageStrip: React.FC = () => {
  const activePageIndex = useEditorStore(s => s.activePageIndex);
  const setActivePageIndex = useEditorStore(s => s.setActivePageIndex);
  const addPage = useEditorStore(s => s.addPage);
  const duplicatePage = useEditorStore(s => s.duplicatePage);
  const book = useEditorStore((s) => s.getActiveBook());
  const { bottomStripOpen, setBottomStripOpen } = useUiStore();

  const virtualWindow = computeVirtualPageWindow(book ? book.pages.length : 0, activePageIndex, 24);

  if (!book) return null;

  if (!bottomStripOpen) {
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={() => setBottomStripOpen(true)}
          className="bg-white/95 dark:bg-[#0e1422] text-slate-700 dark:text-slate-200 min-h-9 px-3 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#12192b] shadow-xl text-[13px] flex items-center gap-1.5 active:scale-[0.97] transition-transform"
        >
          <ChevronUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Pages ({activePageIndex + 1} / {book.pages.length})</span>
        </button>
      </div>
    );
  }

  return (
    <footer className="h-20 w-full bg-white dark:bg-[#080c14] border-t border-slate-200/90 dark:border-white/[0.08] px-4 flex items-center justify-between z-20 select-none font-sans">
      <div className="hidden sm:flex items-center pr-3 border-r border-slate-200 dark:border-white/10">
        <span className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">
          Page {book.pages[activePageIndex]?.displayNumber ?? activePageIndex + 1} of {book.pages.length}
        </span>
      </div>

      {/* Pages Carousel with Virtualization for 200–400+ page books */}
      <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none flex-1 px-3">
        {virtualWindow.startIndex > 0 && (
          <button
            type="button"
            onClick={() => setActivePageIndex(0)}
            className="flex-shrink-0 h-16 px-2.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center gap-0.5"
            title="Jump to first page"
          >
            <span className="font-mono text-[9px] text-indigo-500">« 1</span>
            <span>+{virtualWindow.startIndex}</span>
          </button>
        )}

        {virtualWindow.visibleIndices.map((idx) => {
          const p = book.pages[idx];
          if (!p) return null;
          const isCurrent = idx === activePageIndex;

          return (
            <button
              type="button"
              aria-label={`Go to page ${p.displayNumber}`}
              aria-current={isCurrent ? "page" : undefined}
              key={p.id}
              onClick={() => setActivePageIndex(idx)}
              className={`group relative flex-shrink-0 w-14 h-16 rounded-lg cursor-pointer flex flex-col items-center justify-between p-1 transition-all ${
                isCurrent
                  ? "bg-white active-page-ring scale-[1.04] -translate-y-0.5 shadow-md"
                  : "bg-slate-200/90 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg border border-white/10"
              }`}
            >
              <EditorPageThumbnail page={p} width={book.dimensions.widthPt} height={book.dimensions.heightPt}/>

              {/* Page Number Label */}
              <div className="w-full flex items-center justify-center mt-0.5 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                <span>{p.displayNumber}</span>
              </div>
            </button>
          );
        })}

        {virtualWindow.endIndex < book.pages.length - 1 && (
          <button
            type="button"
            onClick={() => setActivePageIndex(book.pages.length - 1)}
            className="flex-shrink-0 h-16 px-2.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center gap-0.5"
            title="Jump to last page"
          >
            <span className="font-mono text-[9px] text-indigo-500">{book.pages.length} »</span>
            <span>+{book.pages.length - 1 - virtualWindow.endIndex}</span>
          </button>
        )}

        {/* Quick Add Page Button */}
        <button
          onClick={() => addPage(activePageIndex)}
          className="flex-shrink-0 w-14 h-16 rounded-lg border border-dashed border-slate-300 dark:border-white/20 hover:border-indigo-500 bg-slate-50 dark:bg-white/[0.02] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 active:scale-[0.97] transition-transform"
          title="Add page"
        >
          <Plus className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
          <span className="text-[11px] font-medium mt-0.5">Add</span>
        </button>
      </div>

      {/* Right side: System Health & Hide Strip */}
      <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-white/10">
        <button type="button" onClick={() => duplicatePage(activePageIndex)} className="min-h-11 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300" aria-label="Duplicate current page" title="Duplicate current page"><Copy className="w-4 h-4" /></button>
        <DeletePageButton index={activePageIndex} showLabel className="min-h-11 px-3 flex items-center gap-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10" />
        <StatusHealthIndicator />

        <button
          onClick={() => setBottomStripOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title="Hide Strip"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
