"use client";

import { publicationPreflight } from "../../editor/educational/publicationPreflight";
import { runFullPreflightScan, ComprehensivePreflightReport } from "../../editor/publishing/preflightEngine";
import { scanPreflightInBackground } from "../../editor/publishing/backgroundPreflight";
import React, { useState, useEffect } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { PreflightIssue, PreflightReport } from "../../domain/publishing/types";
import { calculateEffectiveDpi, PRINT_DPI_MINIMUM, PRINT_DPI_CRITICAL } from "../../editor/core/coordinates";
import {
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Printer,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export const PreflightModal: React.FC = () => {
  const { preflightModalOpen, setPreflightModalOpen } = useUiStore();
  const { books, activeBookId, elements, setActivePageIndex, selectElement } = useEditorStore();

  const book = books.find((b) => b.id === activeBookId);

  const [report, setReport] = useState<ComprehensivePreflightReport | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!preflightModalOpen || !book) return;
    const controller = new AbortController();
    setReport(null); setError('');
    scanPreflightInBackground(book, elements, controller.signal).then(setReport).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, [preflightModalOpen, book, elements]);
  if (preflightModalOpen && book && !report) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><div role="status" className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-200"><p>{error || `Checking ${book.pages.length} pages…`}</p><button className="mt-4 min-h-11 rounded-lg px-4 bg-white/10" onClick={() => setPreflightModalOpen(false)}>{error ? 'Close' : 'Cancel scan'}</button></div></div>;
  if (!preflightModalOpen || !book || !report) return null;

  const navigateToIssue = (issue: PreflightIssue) => {
    if (issue.pageIndex !== undefined) {
      setActivePageIndex(issue.pageIndex);
    }
    if (issue.elementId) {
      selectElement(issue.elementId);
    }
    setPreflightModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setPreflightModalOpen(false)}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Preflight" className="w-full max-w-2xl bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Print Preflight Inspector</h2>
              <p className="text-xs text-slate-400">
                Layout, resolution and educational content checks
              </p>
            </div>
          </div>
          <button
            aria-label="Close preflight"
            onClick={() => setPreflightModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Scorecard */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {report.isValidForPrint ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>LAYOUT CHECKS PASSED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>ACTION REQUIRED ({report.errorCount} Errors)</span>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Target: 300 PPI · RGB proof
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Pages</span>
              <span className="text-base font-bold text-slate-100">{report.metrics.totalPages}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Elements</span>
              <span className="text-base font-bold text-slate-100">{report.metrics.totalElements}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Images</span>
              <span className="text-base font-bold text-slate-100">{report.metrics.imageCount}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Warnings</span>
              <span className="text-base font-bold text-amber-400">{report.warningCount}</span>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {report.issues.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-slate-200 text-sm">All Preflight Checks Passed!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                No issues detected by these checks. Colour management, font embedding, paper and press suitability still require production proofing.
              </p>
            </div>
          ) : (
            report.issues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigateToIssue(issue)}
                className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                  issue.severity === "error"
                    ? "bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60"
                    : "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  {issue.severity === "error" ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-100">{issue.title}</span>
                      {issue.pageIndex !== undefined && (
                        <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-mono text-slate-300">
                          Page {issue.pageIndex + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{issue.message}</p>
                    {issue.remediation && (
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        Tip: {issue.remediation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-indigo-400 text-xs font-medium pl-3">
                  <span>Fix</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
