/**
 * NEX MAXX Book Studio - Automatic Book Structure Studio
 * 
 * Semantic Hierarchy:
 * Book → Unit → Chapter → Lesson → Section → Exercise → Question
 * 
 * Provides:
 * - Live Table of Contents (TOC) viewer with real-time folios
 * - Automatic Roman / Arabic page numbering synchronization
 * - Question & figure numbering management
 * - Cross-reference synchronization
 * - One-click "Insert Table of Contents Page" into book
 */

"use client";

import React, { useMemo, useState } from "react";
import { commitDocumentChange } from "../../editor/core/documentTransaction";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import {
  compileBookStructure,
  synchronizeBookStructure,
  generateTocElements,
  BookStructureReport,
  StructureNode,
} from "../../editor/structure/bookStructureEngine";
import { PageDefinition } from "../../domain/book/types";
import {
  X,
  Network,
  ListTree,
  BookOpen,
  FileText,
  HelpCircle,
  Image,
  RefreshCw,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";

function SemanticTree({ node }: { node: StructureNode }) {
  return <details open={node.kind === 'book' || node.kind === 'unit'} className="ml-3 border-l border-white/10 pl-3 py-1"><summary className="cursor-pointer text-xs text-slate-200"><span className="mr-2 text-[10px] uppercase text-slate-500">{node.kind}</span>{node.title}{node.pageNumber && <span className="ml-2 text-slate-500">p. {node.pageNumber}</span>}</summary>{node.children.map(child => <SemanticTree key={child.id} node={child}/>)}</details>;
}

export const BookStructureModal: React.FC = () => {
  const { bookStructureModalOpen, setBookStructureModalOpen, showToast } = useUiStore();
  const { getActiveBook, elements, saveToStorage } = useEditorStore();

  const book = getActiveBook();
  const [activeTab, setActiveTab] = useState<"structure" | "toc" | "questions" | "figures">("structure");

  const report: BookStructureReport = useMemo(() => {
    if (!book || !bookStructureModalOpen) {
      return {
        totalUnits: 0,
        totalChapters: 0,
        totalLessons: 0,
        totalExercises: 0,
        totalQuestions: 0,
        totalFigures: 0,
        toc: [],
        questions: [],
        figures: [],
      };
    }
    return compileBookStructure(book, elements);
  }, [book, elements, bookStructureModalOpen]);

  if (!bookStructureModalOpen || !book) return null;

  const handleSynchronize = () => {
    const result = synchronizeBookStructure(book, elements);

    commitDocumentChange('Synchronize book structure', { ...result.updatedBook, numbering: 'front-matter' }, result.updatedElements);
    showToast({
      type: "success",
      title: "Structure Synchronized",
      message: `Updated page numbers, questions, figures, and ${result.referencesUpdatedCount} cross-references.`,
    });
  };

  const handleInsertTocPage = () => {
    const tocPageId = `page-toc-${Date.now().toString(36)}`;
    const tocElements = generateTocElements(report, tocPageId, book.dimensions.widthPt - 84, 50);

    const newPage: PageDefinition = {
      id: tocPageId,
      pageIndex: 1, // Place after cover
      displayNumber: "ii",
      elementIds: tocElements.map((el) => el.id),
      status: "Draft",
    };

    // Add elements
    const updatedElements = { ...elements };
    tocElements.forEach((el) => {
      updatedElements[el.id] = el;
    });

    // Insert page after cover
    const updatedPages = book.pages.map(page => ({ ...page }));
    updatedPages.splice(1, 0, newPage);

    // Renumber
    updatedPages.forEach((p, idx) => {
      p.pageIndex = idx;
    });

    commitDocumentChange('Insert table of contents', { ...book, pages: updatedPages, numbering: 'front-matter' }, updatedElements, 1);
    showToast({
      type: "success",
      title: "Table of Contents Created",
      message: "Inserted auto-generated Table of Contents page.",
    });
    setBookStructureModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={() => setBookStructureModalOpen(false)}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Book Structure" className="w-full max-w-3xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Automatic Book Structure Studio
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-teal-500/30">
                  SEMANTIC ENGINE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Book → Unit → Chapter → Lesson → Section → Exercise → Question
              </p>
            </div>
          </div>
          <button
            aria-label="Close book structure"
            onClick={() => setBookStructureModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-5 gap-2 px-6 py-3 border-b border-white/10 bg-black/20 text-center">
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <span className="text-[10px] text-slate-400 block">Units</span>
            <strong className="text-sm font-bold text-white">{report.totalUnits}</strong>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <span className="text-[10px] text-slate-400 block">Chapters</span>
            <strong className="text-sm font-bold text-indigo-400">{report.totalChapters}</strong>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <span className="text-[10px] text-slate-400 block">Lessons</span>
            <strong className="text-sm font-bold text-emerald-400">{report.totalLessons}</strong>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <span className="text-[10px] text-slate-400 block">Questions</span>
            <strong className="text-sm font-bold text-amber-400">{report.totalQuestions}</strong>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02]">
            <span className="text-[10px] text-slate-400 block">Figures</span>
            <strong className="text-sm font-bold text-cyan-400">{report.totalFigures}</strong>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex px-6 border-b border-white/10 bg-black/10 gap-2">
          {[
            { id: "structure", label: "Hierarchy Tree", icon: ListTree },
            { id: "toc", label: "Live Table of Contents", icon: BookOpen },
            { id: "questions", label: "Questions Registry", icon: HelpCircle },
            { id: "figures", label: "Figures & Illustrations", icon: Image },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                  isActive
                    ? "border-teal-500 text-teal-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0e131d]">
          {activeTab === "structure" && (
            <div className="space-y-3">
              {report.hierarchy && <SemanticTree node={report.hierarchy}/>}
              <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Book Title: {book.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Grade: {book.grade} • Subject: {book.subject} • Total Pages: {book.pages.length}
                  </span>
                </div>
              </div>

              {/* Chapters Tree */}
              <div className="space-y-2">
                {book.chapters.map((ch, idx) => {
                  const chPages = book.pages.filter(
                    (p) => p.chapterId === ch.id || ch.pageIds.includes(p.id)
                  );
                  return (
                    <div
                      key={ch.id}
                      className="p-3.5 rounded-xl border border-white/10 bg-black/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-400 font-mono text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          Chapter {ch.number || idx + 1}: {ch.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {chPages.length} Pages • Starts Page {chPages[0]?.displayNumber ?? 1}
                        </span>
                      </div>
                      {ch.subtitle && (
                        <p className="text-[11px] text-slate-400 pl-7">{ch.subtitle}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "toc" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 font-serif space-y-3 text-slate-200">
                <h3 className="text-center font-bold text-base tracking-wide border-b border-white/10 pb-2 text-white">
                  TABLE OF CONTENTS
                </h3>
                {report.toc.map((entry) => (
                  <div key={entry.id} className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs font-semibold">
                      <span>Chapter {entry.number}: {entry.title}</span>
                      <span className="font-mono text-[11px] text-slate-400">{entry.pageNumber}</span>
                    </div>
                    {entry.children && entry.children.map((lesson) => (
                      <div key={lesson.id} className="flex items-baseline justify-between text-[11px] text-slate-400 pl-4 font-sans">
                        <span>• {lesson.title}</span>
                        <span className="font-mono text-[10px]">{lesson.pageNumber}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <button
                onClick={handleInsertTocPage}
                className="w-full py-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Insert Formatted TOC Page Into Book
              </button>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Automatic Question Numbering ({report.questions.length})
              </span>
              {report.questions.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-lg border border-white/5 bg-black/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                      Q {q.label}
                    </span>
                    <span className="text-slate-200 line-clamp-1">{q.stemText}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Page {q.pageNumber}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "figures" && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Automatic Figure Numbering ({report.figures.length})
              </span>
              {report.figures.map((fig) => (
                <div
                  key={fig.id}
                  className="p-3 rounded-lg border border-white/5 bg-black/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                      {fig.label}
                    </span>
                    <span className="text-slate-200 line-clamp-1">{fig.caption}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Page {fig.pageNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Automatic Roman / Arabic numbering & cross-reference sync</span>
          </div>
          <button
            onClick={handleSynchronize}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/30 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Synchronize Structure & Numbers
          </button>
        </div>
      </div>
    </div>
  );
};
