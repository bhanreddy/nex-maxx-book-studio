"use client";

import React from "react";
import { EditorPageThumbnail } from "./EditorPageThumbnail";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { Plus, ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { StatusHealthIndicator } from "../ui/StatusHealthIndicator";

export const BottomPageStrip: React.FC = () => {
  const activePageIndex = useEditorStore(s => s.activePageIndex);
  const setActivePageIndex = useEditorStore(s => s.setActivePageIndex);
  const addPage = useEditorStore(s => s.addPage);
  const duplicatePage = useEditorStore(s => s.duplicatePage);
  const deletePage = useEditorStore(s => s.deletePage);
  const book = useEditorStore((s) => s.getActiveBook());
  const { bottomStripOpen, setBottomStripOpen } = useUiStore();

  if (!book) return null;

  if (!bottomStripOpen) {
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={() => setBottomStripOpen(true)}
          className="bg-[#0e1422] text-slate-200 min-h-9 px-3 rounded-full border border-white/10 hover:bg-[#12192b] shadow-xl text-[13px] flex items-center gap-1.5 active:scale-[0.97] transition-transform"
        >
          <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>Pages ({activePageIndex + 1} / {book.pages.length})</span>
        </button>
      </div>
    );
  }

  return (
    <footer className="h-20 w-full bg-[#080c14] border-t border-white/[0.08] px-4 flex items-center justify-between z-20 select-none font-sans">
      <div className="hidden sm:flex items-center pr-3 border-r border-white/10">
        <span className="text-[13px] text-slate-300 font-medium">
          Page {book.pages[activePageIndex]?.displayNumber ?? activePageIndex + 1} of {book.pages.length}
        </span>
      </div>

      {/* Pages Carousel with Inertial Horizontal Scroll */}
      <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none flex-1 px-3">
        {book.pages.map((p, idx) => {
          const isCurrent = idx === activePageIndex;

          return (
            <div
              key={p.id}
              onClick={() => setActivePageIndex(idx)}
              className={`group relative flex-shrink-0 w-14 h-16 rounded-lg cursor-pointer flex flex-col items-center justify-between p-1 ${
                isCurrent
                  ? "bg-white active-page-ring scale-[1.04] -translate-y-0.5"
                  : "bg-slate-200/90 hover:bg-white opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg border border-white/10"
              }`}
            >
              <EditorPageThumbnail page={p} width={book.dimensions.widthPt} height={book.dimensions.heightPt}/>

              {/* Page Number Label */}
              <div className="w-full flex items-center justify-center mt-0.5 text-[11px] font-medium text-slate-800">
                <span>{p.displayNumber}</span>
              </div>

              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-[#0e1320] px-1 py-0.5 rounded-lg shadow-xl border border-white/15 z-30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePage(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                  title="Duplicate Page"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {book.pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(idx);
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/20 transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Add Page Button */}
        <button
          onClick={() => addPage(activePageIndex)}
          className="flex-shrink-0 w-14 h-16 rounded-lg border border-dashed border-white/20 hover:border-indigo-400/80 bg-white/[0.02] hover:bg-indigo-500/10 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-300 active:scale-[0.97] transition-transform"
          title="Add page"
        >
          <Plus className="w-4 h-4 text-indigo-300" />
          <span className="text-[11px] font-medium mt-0.5">Add</span>
        </button>
      </div>

      {/* Right side: System Health & Hide Strip */}
      <div className="flex items-center gap-2 pl-3 border-l border-white/10">
        <StatusHealthIndicator />

        <button
          onClick={() => setBottomStripOpen(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Hide Strip"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
