"use client";

import { CURRICULUM_BLOCK_MAP, LAYOUT_NAMES } from "../../editor/curriculum/catalog";
import { curriculumSource, switchCurriculumLayout } from "../../editor/curriculum/actions";
import { CurriculumPreview } from "../curriculum/CurriculumPreview";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shuffle,
  Undo2,
  Sliders,
  X,
  FileText,
  Lightbulb,
} from "lucide-react";
import { useLayoutPartnerStore, LayoutPartnerTab } from "../../editor/layoutPartner/layoutPartnerStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useHistoryStore } from "../../editor/stores/historyStore";
import { TextWrapMode } from "../../domain/creative/types";
import { ElementPositionMode } from "../../domain/element/types";
import {
  generateLayoutVariations,
  LayoutVariation,
} from "../../editor/layoutPartner/partnerEngine";

export const LayoutPartnerPanel: React.FC = () => {
  const {
    partnerMode,
    partnerPanelOpen,
    activeTab,
    healthReport,
    setPartnerMode,
    setPartnerPanelOpen,
    setActiveTab,
    setPreviewTransforms,
    refreshHealthReport,
    autoFixHealthIssues,
    applyNaturalLayoutCommand,
    applyLayoutVariation,
    applyTextWrapToSelection,
  } = useLayoutPartnerStore();

  const {
    selectedElementIds,
    elements,
    getActiveBook,
    getActivePage,
    updateElement,
    addPage,
  } = useEditorStore();

  const { undo } = useHistoryStore();

  const [commandInput, setCommandInput] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  const book = getActiveBook();
  const activePage = getActivePage();
  const pageElements = activePage
    ? activePage.elementIds.map((id) => elements[id]).filter(Boolean)
    : [];
  const selectedElements = selectedElementIds.map((id) => elements[id]).filter(Boolean);
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const curriculum = singleElement?.smartBlockData?.curriculum ? curriculumSource(singleElement) : undefined;

  // Initial and reactive health report calculation
  useEffect(() => {
    refreshHealthReport();
  }, [activePage?.id, elements, refreshHealthReport]);

  if (!partnerPanelOpen) {
    return (
      <button
        onClick={() => setPartnerPanelOpen(true)}
        className="fixed top-16 right-4 z-40 bg-[#10141D]/90 hover:bg-[#151A24] text-white px-3 py-2 rounded-2xl border border-violet-500/30 hover:border-violet-400/60 backdrop-blur-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center gap-2 group transition-all cursor-pointer"
        title="Open NEX Layout Partner (Cmd + P)"
      >
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <Sparkles className="w-3.5 h-3.5 text-violet-400 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-semibold tracking-wide bg-gradient-to-r from-white via-slate-100 to-violet-200 bg-clip-text text-transparent">
          Layout Partner
        </span>
        {healthReport && (
          <span className="text-[7pt] font-mono px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {healthReport.score}%
          </span>
        )}
      </button>
    );
  }

  // Variations list for Layouts tab
  const variations: LayoutVariation[] =
    book && activePage
      ? generateLayoutVariations(pageElements, book.dimensions, book.margins)
      : [];

  const handleCommandSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim()) return;
    setIsProcessingCommand(true);
    setTimeout(() => {
      applyNaturalLayoutCommand(commandInput.trim());
      setIsProcessingCommand(false);
      setCommandInput("");
    }, 250);
  };

  const score = healthReport ? healthReport.score : 95;
  const scoreColor =
    score >= 90
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : score >= 75
      ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
      : "text-rose-400 border-rose-500/40 bg-rose-500/10";

  return (
    <aside className="fixed top-20 right-3 bottom-14 w-88 z-40 bg-[#10141D]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col text-slate-200 overflow-hidden select-none animate-in slide-in-from-right duration-200 font-sans">
      {/* Panel Liquid Glass Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0B0E14]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-wider text-white">
                NEX Layout Partner
              </span>
              <span className="text-[7pt] font-mono uppercase bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30">
                PRO
              </span>
            </div>
            <p className="text-[7.5pt] text-slate-400 leading-tight">
              Intelligent Publishing & Text Flow Engine
            </p>
          </div>
        </div>

        <button
          onClick={() => setPartnerPanelOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Close Layout Partner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher: Auto | Assisted | Manual (Part 2) */}
      <div className="p-3 bg-black/30 border-b border-white/5">
        <div className="text-[7.5pt] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Layout Engine Mode</span>
          <span className="text-indigo-400 font-bold capitalize">{partnerMode}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setPartnerMode("auto")}
            className={`py-1.5 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
              partnerMode === "auto"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-[8.5pt]">Auto</span>
            <span className="text-[6.5pt] opacity-75 font-normal">Autonomous</span>
          </button>
          <button
            onClick={() => setPartnerMode("assisted")}
            className={`py-1.5 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
              partnerMode === "assisted"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-[8.5pt]">Assisted</span>
            <span className="text-[6.5pt] opacity-75 font-normal">Smart Snaps</span>
          </button>
          <button
            onClick={() => setPartnerMode("manual")}
            className={`py-1.5 rounded-lg font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
              partnerMode === "manual"
                ? "bg-slate-700 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-[8.5pt]">Manual</span>
            <span className="text-[6.5pt] opacity-75 font-normal">Pro Exact</span>
          </button>
        </div>
      </div>

      {/* Layout Health Score Banner (Part 25) */}
      <div className="px-3 py-2.5 bg-slate-950/30 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center font-mono font-bold leading-none ${scoreColor}`}
          >
            <span className="text-xs">{score}</span>
            <span className="text-[5.5pt] opacity-80">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-100">Layout Health</span>
              <span className="text-[7pt] text-slate-400">
                {score >= 90 ? "Excellent" : score >= 75 ? "Good" : "Needs Review"}
              </span>
            </div>
            <div className="text-[7pt] text-slate-400">
              {healthReport?.issues.length ?? 0} issues detected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={refreshHealthReport}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Recalculate Health Score"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {healthReport && healthReport.issues.length > 0 && (
            <button
              onClick={autoFixHealthIssues}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[7.5pt] font-semibold transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
            >
              Fix Auto
            </button>
          )}
        </div>
      </div>

      {/* Natural Language Layout Command Bar (Part 11) */}
      <div className="p-3 bg-slate-950/20 border-b border-white/5">
        <form onSubmit={handleCommandSubmit} className="relative">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="e.g. Make this page more playful..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
          <button
            type="submit"
            disabled={isProcessingCommand || !commandInput.trim()}
            className="absolute right-1.5 top-1.5 p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all cursor-pointer"
            title="Apply Intent"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick intent chips */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none pb-0.5 text-[7pt]">
          {[
            "More Playful",
            "Academic Blue",
            "Hero Visual",
            "Reduce Empty Space",
            "Worksheet Mode",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCommandInput(prompt);
                applyNaturalLayoutCommand(prompt);
              }}
              className="whitespace-nowrap px-2 py-0.5 rounded-full bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-200 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
            >
              ✦ {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Navigation Tabs: Suggestions | Layouts | Rules | Flow (Part 9) */}
      <div className="flex items-center px-2 border-b border-white/10 bg-slate-950/40 text-xs">
        {(["suggestions", "layouts", "rules", "flow"] as LayoutPartnerTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center font-medium capitalize border-b-2 transition-all ${
              activeTab === tab
                ? "border-indigo-500 text-white font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Body Viewports */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        {/* TAB 1: SUGGESTIONS */}
        {activeTab === "suggestions" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[7.5pt] font-mono text-slate-400 uppercase tracking-wide">
              <span>Contextual Diagnostics</span>
              <span>{healthReport?.issues.length ?? 0} Recommendations</span>
            </div>

            {healthReport?.issues.map((issue) => (
              <div
                key={issue.id}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 hover:border-white/20 transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{issue.title}</span>
                  </div>
                  <span
                    className={`text-[6.5pt] font-mono uppercase px-1.5 py-0.5 rounded ${
                      issue.severity === "error"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>

                <p className="text-[7.5pt] text-slate-400 leading-snug">
                  {issue.description}
                </p>

                <div className="text-[7pt] text-indigo-300 bg-indigo-950/40 p-1.5 rounded border border-indigo-500/20">
                  <span className="font-semibold text-slate-300">Suggested Action: </span>
                  {issue.suggestedAction}
                </div>

                {issue.fixable && (
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => autoFixHealthIssues()}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[7pt] font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      Fix Automatically
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(!healthReport?.issues || healthReport.issues.length === 0) && (
              <div className="py-8 text-center text-slate-500 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                <p className="font-semibold text-slate-300 text-xs">Page Composition Optimal</p>
                <p className="text-[7.5pt]">
                  No high-priority spacing, orphan, or margin issues found.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INSTANT LAYOUT VARIATIONS (Part 10) */}
        {curriculum && singleElement && ["layouts","suggestions"].includes(activeTab) && <section className="space-y-3"><h3 className="curriculum-eyebrow">Recommended curriculum layouts</h3><p className="text-xs text-slate-400">Class {curriculum.curriculum!.grade} · {curriculum.curriculum!.subjectLabel}. Choose a composition while keeping your learning content.</p><div className="curriculum-layout-grid">{CURRICULUM_BLOCK_MAP[curriculum.curriculum!.type].layouts.map(layout=><button key={layout} aria-pressed={layout===curriculum.styleOverrides.layoutVariant} onClick={()=>switchCurriculumLayout(singleElement,layout)}><CurriculumPreview type={curriculum.curriculum!.type} layout={layout} block={curriculum}/><span>{LAYOUT_NAMES[layout]}</span></button>)}</div></section>}
        {activeTab === "layouts" && !curriculum && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[7.5pt] font-mono text-slate-400 uppercase tracking-wide">
              <span>Deterministic Variations</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => undo()}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
                  title="Undo Layout"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (variations.length > 0) {
                      const rand = variations[Math.floor(Math.random() * variations.length)];
                      applyLayoutVariation(rand.id);
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[7pt] flex items-center gap-1"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {variations.map((v) => (
                <div
                  key={v.id}
                  className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="font-semibold text-slate-200 text-xs group-hover:text-indigo-300 transition-colors">
                      {v.name}
                    </div>
                    <div className="text-[7pt] text-slate-400 leading-snug">
                      {v.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPreviewTransforms(v.elementTransforms, v.id)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[7pt] font-medium transition-colors"
                      title="Preview this layout variation"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => applyLayoutVariation(v.id)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[7pt] font-semibold transition-all shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RULES & TEXT WRAPPING (Part 4 & 7) */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            {singleElement ? (
              <>
                {/* Element Information */}
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 space-y-1">
                  <div className="text-[7pt] font-mono text-slate-400 uppercase">Selected Element</div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>{singleElement.displayName}</span>
                    <span className="text-[7pt] font-mono bg-white/10 text-slate-300 px-1 rounded">
                      {singleElement.type}
                    </span>
                  </div>
                </div>

                {/* Smart Text Wrapping Selector (Part 4) */}
                <div className="space-y-2">
                  <div className="text-[7.5pt] font-mono text-slate-400 uppercase tracking-wide">
                    Text Wrap Behavior
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[7.5pt]">
                    {[
                      { mode: "none", label: "No Wrap" },
                      { mode: "square", label: "Square" },
                      { mode: "tight", label: "Tight" },
                      { mode: "contour", label: "Contour" },
                      { mode: "top-bottom", label: "Top & Bot" },
                      { mode: "through", label: "Through" },
                    ].map(({ mode, label }) => {
                      const currentMode =
                        singleElement.textWrap?.mode || singleElement.style.textWrap?.mode || "none";
                      const isActive = currentMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => applyTextWrapToSelection(mode as TextWrapMode)}
                          className={`py-1.5 px-1 rounded-lg font-medium transition-all text-center border ${
                            isActive
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-xs"
                              : "bg-black/30 text-slate-400 border-white/5 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Wrap Offset Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[7.5pt]">
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400 block mb-1">Wrap Margin</span>
                      <input
                        type="number"
                        min="0"
                        max="72"
                        defaultValue={singleElement.textWrap?.wrapMarginPt || 12}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          applyTextWrapToSelection(
                            singleElement.textWrap?.mode || "square",
                            val
                          );
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400 block mb-1">Position Mode</span>
                      <select
                        value={singleElement.positionMode || "assisted"}
                        onChange={(e) => {
                          updateElement(singleElement.id, {
                            positionMode: e.target.value as ElementPositionMode,
                          });
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono text-xs"
                      >
                        <option value="auto">Auto</option>
                        <option value="assisted">Assisted</option>
                        <option value="manual">Manual</option>
                        <option value="pinned">Pinned</option>
                        <option value="floating">Floating</option>
                        <option value="locked">Locked</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Semantic Constraints Checklist (Part 7) */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[7.5pt] font-mono text-slate-400 uppercase tracking-wide">
                    Semantic Constraints
                  </div>
                  {[
                    { key: "keepTogether", label: "Keep Together (No Break Inside)" },
                    { key: "keepWithNext", label: "Keep With Next (Prevent Orphan)" },
                    { key: "avoidPageBreak", label: "Avoid Page Break" },
                  ].map(({ key, label }) => {
                    const isChecked = Boolean(
                      singleElement.semanticConstraints?.[
                        key as keyof typeof singleElement.semanticConstraints
                      ]
                    );
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 cursor-pointer text-[7.5pt] text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            updateElement(singleElement.id, {
                              semanticConstraints: {
                                ...singleElement.semanticConstraints,
                                [key]: e.target.checked,
                              },
                            });
                          }}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-slate-500 space-y-2">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-400 text-xs">
                  Select an Element
                </p>
                <p className="text-[7.5pt] max-w-[200px] mx-auto">
                  Click any heading, illustration, or text block to configure wrapping and layout rules.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LINKED TEXT FLOW (Part 5) */}
        {activeTab === "flow" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sequential Text Flow</span>
                </div>
                <span className="text-[7pt] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-[7.5pt] text-slate-400 leading-snug">
                Text automatically distributes across linked multi-column frames and sequential textbook pages.
              </p>
            </div>

            {/* Overset Detection Monitor */}
            {pageElements.some((e) => e.isOverset) ? (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Overset Text Detected</span>
                </div>
                <p className="text-[7.5pt] text-rose-200/90 leading-tight">
                  One or more text frames have content exceeding their boundary.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => addPage()}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[7pt] transition-all shadow-sm"
                  >
                    + Add Continuation Page
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[7.5pt]">
                  No overset text. All frame content comfortably fits within margins.
                </span>
              </div>
            )}

            {/* Multi-column frame controller */}
            {singleElement && (singleElement.type === "body" || singleElement.type === "body-text") && (
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-2 text-[7.5pt]">
                <span className="font-semibold text-slate-300 block">
                  Column Balancing
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => {
                        updateElement(singleElement.id, {
                          columnCount: cols,
                          style: { ...singleElement.style, columns: cols },
                        });
                      }}
                      className={`py-1 rounded font-mono font-bold ${
                        (singleElement.columnCount || singleElement.style?.columns || 1) === cols
                          ? "bg-indigo-600 text-white"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cols} Col
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-white/10 flex items-center justify-between text-[7pt] text-slate-500 font-mono">
        <span>NEX ENGINE 3.8</span>
        <span>60 FPS DETERMINISTIC</span>
      </div>
    </aside>
  );
};
