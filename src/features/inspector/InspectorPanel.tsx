"use client";
import {SmartQrInspector} from "../media/SmartQrPanel";

import React, { useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  ChevronRight,
  Sliders,
  AlertCircle,
  Shapes,
  Type,
  Image as ImageIcon,
  Table as TableIcon,
  MessageSquare,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Combine,
  Scissors,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { calculateEffectiveDpi, PRINT_DPI_MINIMUM } from "../../editor/core/coordinates";
import {
  VectorShapeType,
  SizingMode,
  LayoutPriority,
  HorizontalConstraint,
  VerticalConstraint,
} from "../../domain/element/types";
import { ArrangeControls } from "../panels/ArrangeControls";
import { PublicationInspector, ArtworkInspector } from "../educational/PublicationInspector";
import { BlockTextInspector } from "../educational/BlockTextInspector";
import { CurriculumBlockInspector } from "../curriculum/CurriculumBlockInspector";
import { SmartScrubInput } from "../ui/SmartScrubInput";
import { MathTemplateInspector } from "../../editor/math/MathTemplateInspector";
import { ShapeInspector } from "./ShapeInspector";
import { TypographyInspector } from "./TypographyInspector";

export const InspectorPanel: React.FC = () => {
  const {
    selectedElementIds,
    elements,
    getActiveBook,
    getActivePage,
    updateElementTransform,
    updateElementStyle,
    updateElementContent,
    deleteSelectedElements,
    duplicateSelectedElements,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    alignSelectedElements,
    distributeSelectedElements,
    performBooleanOperation,
    applyTextStyle,
    createTextStyleFromElement,
    updateTableStructure,
    addComment,
    resolveComment,
    setElementLayoutMode,
    autoArrangeActivePage,
    shuffleCompatibleLayout,
    applyPagePreset,
    applyThemeToBook,
    applyFontPairingToBook,
    updateElement,
  } = useEditorStore();

  const {
    rightInspectorOpen,
    setRightInspectorOpen,
    showToast,
    complexityMode,
    setComplexityMode,
    setActiveLayoutGalleryOpen,
    setLeftPanelTab,
    setPresetCategoryFilter,
    activeThemeId,
    setActiveThemeId,
    activeFontPairing,
    setActiveFontPairing,
  } = useUiStore();

  // Local state for adding a new comment
  const [commentInput, setCommentInput] = useState("");
  const [panelWidth, setPanelWidth] = useState(320);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setPanelWidth(Math.min(460, Math.max(260, startW + delta)));
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

  if (!rightInspectorOpen) {
    return (
      <button
        onClick={() => setRightInspectorOpen(true)}
        className="absolute top-16 right-0 bg-[#111827]/90 text-slate-300 p-2 rounded-l-lg border-l border-t border-b border-white/10 hover:bg-slate-800 transition-colors z-20 shadow-lg"
        title="Open Inspector"
      >
        <Sliders className="w-4 h-4" />
      </button>
    );
  }

  const book = getActiveBook();
  const activePage = getActivePage();
  const selectedElements = selectedElementIds.map((id) => elements[id]).filter(Boolean);
  const textElements = selectedElements.filter(
    (el) =>
      ["heading", "subheading", "body", "caption", "quote"].includes(el.type) ||
      el.content?.text !== undefined
  );
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;

  // Attached comments
  const elementComments = singleElement && book?.comments
    ? book.comments.filter((c) => c.elementId === singleElement.id && !c.resolved)
    : [];

  const handleAddComment = () => {
    if (!commentInput.trim() || !singleElement || !activePage) return;
    addComment(activePage.id, singleElement.id, commentInput.trim(), "Senior Editor", "Editor");
    setCommentInput("");
    showToast({
      title: "Comment Added",
      message: `Attached review comment to ${singleElement.displayName}`,
      type: "success",
    });
  };

  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className="relative h-full bg-white dark:bg-[#0d121e] border-l border-slate-200/90 dark:border-white/[0.08] flex flex-col text-slate-800 dark:text-slate-200 z-20 overflow-y-auto select-none custom-scrollbar flex-shrink-0"
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={handleStartResize}
        onDoubleClick={() => setPanelWidth(320)}
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-30"
        title="Drag to resize inspector (Double-click to reset)"
      />
      {/* Panel Header with Inspector / Layout Partner Mode Switcher */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0c101b]">
        <div className="flex items-center gap-2 min-h-9 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
          <span>Inspector</span>
        </div>
        <button
          onClick={() => setRightInspectorOpen(false)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title="Collapse Inspector"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-2 bg-slate-100/70 dark:bg-[#090d16] border-b border-slate-200/90 dark:border-white/[0.06]">
        <div className="flex items-center gap-1 text-[13px]">
          {(
            [
              { id: "quick", label: "Quick", title: "Essential typography, colors, and layout" },
              { id: "advanced", label: "Advanced", title: "Transforms, constraints, auto-reflow, effects" },
              { id: "professional", label: "Pro", title: "Exact coordinates, baseline grid, print controls" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setComplexityMode(mode.id)}
              className={`flex-1 min-h-9 rounded-lg font-medium transition-colors ${
                complexityMode === mode.id
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title={mode.title}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. NO SELECTION: PAGE & DOCUMENT INSPECTOR (Directive 7) */}
      {selectedElements.length === 0 ? (
        <div className="p-4 space-y-4 text-[13px]">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-100 block text-base">
                Page {activePage?.displayNumber || "1"}
              </span>
              <span className="block text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activePage?.layoutMode === "adaptive" ? "Adaptive layout" : "Freeform layout"}
              </span>
            </div>
            {activePage?.overflowWarning?.hasOverflow ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-200 text-[13px] border border-amber-500/30 font-medium">
                Overflow
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[13px] border border-emerald-500/25 font-medium">
                Ready
              </span>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setActiveLayoutGalleryOpen(true)}
              className="w-full min-h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/10 font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              title="Preview this page in another layout"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              <span>Try layout</span>
            </button>
            <button
              onClick={() => autoArrangeActivePage("balanced")}
              className="w-full min-h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-medium active:scale-[0.98] transition-transform"
              title="Balance this page automatically"
            >
              Auto arrange
            </button>
            <button
              onClick={() => shuffleCompatibleLayout()}
              className="w-full min-h-11 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] active:scale-[0.98] transition-transform font-medium"
              title="Shuffle among compatible layouts"
            >
              Shuffle layout
            </button>
          </div>

          {complexityMode !== "quick" && (
          <>
          {/* Page Geometry & Print Margins */}
          {book && (
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">
                Page Dimensions & Margins
              </span>
              <div className="bg-slate-50 dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 text-[8.5pt]">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Size:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {Math.round(book.dimensions.widthPt)} × {Math.round(book.dimensions.heightPt)} pt
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Inside Margin:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{book.margins.insidePt} pt</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Outside Margin:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{book.margins.outsidePt} pt</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Top / Bottom:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {book.margins.topPt} / {book.margins.bottomPt} pt
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Bleed:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-300 font-semibold">{book.bleed.topPt} pt (3mm)</span>
                </div>
              </div>
            </div>
          )}

          {/* Starter Presets Browser Shortcut */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">
              Apply Preset
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPagePreset("content-editorial-split")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-left border border-slate-200 dark:border-white/[0.06] hover:border-indigo-500/40 group transition-all active:scale-95 shadow-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-300 block text-[8pt] group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                  📖 Editorial Split
                </span>
                <span className="text-[7pt] text-slate-500">Headline + Hero image</span>
              </button>
              <button
                onClick={() => applyPagePreset("activity-hands-on-lab")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-left border border-slate-200 dark:border-white/[0.06] hover:border-emerald-500/40 group transition-all active:scale-95 shadow-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-300 block text-[8pt] group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                  🧪 Hands-on Lab
                </span>
                <span className="text-[7pt] text-slate-500">Experiment steps</span>
              </button>
              <button
                onClick={() => applyPagePreset("assessment-mcq-grid")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-left border border-slate-200 dark:border-white/[0.06] hover:border-amber-500/40 group transition-all active:scale-95 shadow-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-300 block text-[8pt] group-hover:text-amber-600 dark:group-hover:text-amber-300">
                  📝 MCQ Quiz
                </span>
                <span className="text-[7pt] text-slate-500">Question cards</span>
              </button>
              <button
                onClick={() => applyPagePreset("chapter-opener-hero")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-left border border-slate-200 dark:border-white/[0.06] hover:border-rose-500/40 group transition-all active:scale-95 shadow-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-300 block text-[8pt] group-hover:text-rose-600 dark:group-hover:text-rose-300">
                  🌟 Chapter Opener
                </span>
                <span className="text-[7pt] text-slate-500">Unit badge + goals</span>
              </button>
            </div>

            <button
              onClick={() => {
                setPresetCategoryFilter("all");
                setLeftPanelTab("templates");
              }}
              className="w-full py-2.5 mt-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-center text-slate-700 dark:text-slate-200 font-semibold text-[8pt] border border-slate-200 dark:border-white/10 transition-all active:scale-95 shadow-xs"
            >
              Browse All 160+ Presets →
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
            <span className="text-[13px] font-medium text-slate-800 dark:text-slate-300 block">Theme and type</span>
            <label className="block text-slate-600 dark:text-slate-400 text-[13px]">
              Theme
              <select
                value={activeThemeId}
                onChange={(e) => {
                  setActiveThemeId(e.target.value);
                  applyThemeToBook(e.target.value);
                }}
                className="mt-1 w-full min-h-11 bg-white dark:bg-[#10151f] border border-slate-300 dark:border-white/10 rounded-xl px-3 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="nexmaxx-maroon">Maroon</option>
                <option value="science-green">Science Green</option>
                <option value="math-blue">Mathematics Blue</option>
                <option value="english-burgundy">English Burgundy</option>
                <option value="early-learning">Early Learning</option>
                <option value="soft-pastel">Soft Pastel</option>
                <option value="premium-neutral">Premium Neutral</option>
              </select>
            </label>
            <label className="block text-slate-600 dark:text-slate-400 text-[13px]">
              Type
              <select
                value={activeFontPairing}
                onChange={(e) => {
                  setActiveFontPairing(e.target.value);
                  applyFontPairingToBook(e.target.value);
                }}
                className="mt-1 w-full min-h-11 bg-white dark:bg-[#10151f] border border-slate-300 dark:border-white/10 rounded-xl px-3 text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="modern-academic">Modern Academic</option>
                <option value="friendly-learning">Friendly Learning</option>
                <option value="premium-editorial">Premium Editorial</option>
                <option value="early-learning">Early Learning</option>
                <option value="technical-science">Technical Science</option>
                <option value="classic-reader">Classic Reader</option>
              </select>
            </label>
          </div>
          </>
          )}
        </div>
      ) : (
        <div className="p-3.5 space-y-4 text-xs">
          {/* Selected Element Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">
                {singleElement ? singleElement.displayName : `${selectedElements.length} Objects Selected`}
              </span>
              {singleElement && (
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {singleElement.type.toUpperCase()} • {singleElement.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {singleElement && (
                <>
                  <button
                    onClick={() =>
                      updateElementStyle(singleElement.id, {
                        opacity: singleElement.style.opacity === 0 ? 1 : 0,
                      })
                    }
                    title={singleElement.style.opacity === 0 ? "Show Element" : "Hide Element"}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    {singleElement.style.opacity === 0 ? (
                      <EyeOff className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      useEditorStore.getState().toggleLockElement(singleElement.id)
                    }
                    title={singleElement.locked ? "Unlock" : "Lock"}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    {singleElement.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}
              <button
                onClick={duplicateSelectedElements}
                title="Duplicate (Cmd+D)"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteSelectedElements}
                title="Delete (Del)"
                className="p-1 rounded hover:bg-rose-500/20 text-rose-500 dark:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {singleElement?.smartBlockData && <BlockTextInspector element={singleElement} />}
          {singleElement?.type === "math-component" && <MathTemplateInspector element={singleElement} />}
          {singleElement?.type === "smart-media-qr" && <SmartQrInspector element={singleElement}/>}
          {singleElement?.smartBlockData && (singleElement.smartBlockData.curriculum ? <CurriculumBlockInspector key={singleElement.smartBlockData.curriculum.sourceBlockId || singleElement.id} element={singleElement} /> : <PublicationInspector element={singleElement} />)}
          {singleElement && (singleElement.content.artwork || singleElement.type === "image" || singleElement.type === "picture-frame" || singleElement.type === "pictureFrame" || singleElement.type === "ai-image" || Boolean(singleElement.content.src || singleElement.content.imageUrl)) && <ArtworkInspector element={singleElement} />}

          {/* Boolean Operations (If 2+ Elements Selected) */}
          {selectedElements.length >= 2 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 p-2.5 rounded-lg space-y-1.5">
              <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider block font-mono">
                Boolean Vector Operations
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => performBooleanOperation("union")}
                  className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/30 dark:hover:bg-rose-600/50 text-rose-800 dark:text-rose-200 rounded text-[10px] font-medium flex items-center justify-center gap-1 border border-rose-200 dark:border-transparent"
                  title="Combine shapes into a single union geometry"
                >
                  <Combine className="w-3 h-3" /> Union
                </button>
                <button
                  onClick={() => performBooleanOperation("subtract")}
                  className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/30 dark:hover:bg-rose-600/50 text-rose-800 dark:text-rose-200 rounded text-[10px] font-medium flex items-center justify-center gap-1 border border-rose-200 dark:border-transparent"
                  title="Subtract front shape from background shape"
                >
                  <Scissors className="w-3 h-3" /> Subtract
                </button>
                <button
                  onClick={() => performBooleanOperation("intersect")}
                  className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/30 dark:hover:bg-rose-600/50 text-rose-800 dark:text-rose-200 rounded text-[10px] font-medium flex items-center justify-center gap-1 border border-rose-200 dark:border-transparent"
                  title="Keep only intersecting overlap area"
                >
                  <Combine className="w-3 h-3" /> Intersect
                </button>
              </div>
            </div>
          )}

          <ArrangeControls />

          {/* Adaptive Layout Engine (Directives 9-14, 105) */}
          {singleElement && (
            <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-2.5 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block font-mono">
                  Layout Engine
                </span>
                <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-black/40 rounded border border-slate-300/80 dark:border-white/10 text-[7.5pt]">
                  <button
                    onClick={() => setElementLayoutMode(singleElement.id, "freeform")}
                    className={`px-2 py-0.5 rounded font-medium ${
                      singleElement.layoutMode !== "adaptive"
                        ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-semibold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    Freeform
                  </button>
                  <button
                    onClick={() => setElementLayoutMode(singleElement.id, "adaptive")}
                    className={`px-2 py-0.5 rounded font-medium ${
                      singleElement.layoutMode === "adaptive"
                        ? "bg-emerald-600 text-white font-semibold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    ⚡ Adaptive
                  </button>
                </div>
              </div>

              {singleElement.layoutMode === "adaptive" ? (
                <div className="space-y-2 text-[8pt]">
                  {/* Direction */}
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-0.5">Stack Direction</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["vertical", "horizontal", "grid"] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() =>
                            updateElement(singleElement.id, {
                              adaptiveGroup: {
                                ...(singleElement.adaptiveGroup || {
                                  direction: "vertical",
                                  spacingPt: 14,
                                  padding: { top: 0, right: 0, bottom: 0, left: 0 },
                                  alignment: "stretch",
                                  distribution: "start",
                                  widthMode: "fill-parent",
                                  heightMode: "fit-content",
                                  wrap: false,
                                }),
                                direction: dir,
                              },
                            })
                          }
                          className={`py-1 rounded text-center capitalize ${
                            singleElement.adaptiveGroup?.direction === dir
                              ? "bg-emerald-600/20 dark:bg-emerald-600/40 text-emerald-700 dark:text-emerald-200 border border-emerald-500/40 font-semibold"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent"
                          }`}
                        >
                          {dir === "vertical" ? "↕ Vert" : dir === "horizontal" ? "↔ Horiz" : "▦ Grid"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spacing & Padding */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-0.5">Spacing: {singleElement.adaptiveGroup?.spacingPt || 14}pt</label>
                      <input
                        type="range"
                        min="0"
                        max="48"
                        value={singleElement.adaptiveGroup?.spacingPt || 14}
                        onChange={(e) =>
                          updateElement(singleElement.id, {
                            adaptiveGroup: {
                              ...(singleElement.adaptiveGroup || {
                                direction: "vertical",
                                spacingPt: 14,
                                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                                alignment: "stretch",
                                distribution: "start",
                                widthMode: "fill-parent",
                                heightMode: "fit-content",
                                wrap: false,
                              }),
                              spacingPt: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-0.5">Padding: {singleElement.adaptiveGroup?.padding.top || 0}pt</label>
                      <input
                        type="range"
                        min="0"
                        max="36"
                        value={singleElement.adaptiveGroup?.padding.top || 0}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          updateElement(singleElement.id, {
                            adaptiveGroup: {
                              ...(singleElement.adaptiveGroup || {
                                direction: "vertical",
                                spacingPt: 14,
                                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                                alignment: "stretch",
                                distribution: "start",
                                widthMode: "fill-parent",
                                heightMode: "fit-content",
                                wrap: false,
                              }),
                              padding: { top: p, right: p, bottom: p, left: p },
                            },
                          });
                        }}
                        className="w-full accent-emerald-500 h-1"
                      />
                    </div>
                  </div>

                  {/* Sizing Modes */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-0.5">Width Sizing</label>
                      <select
                        value={singleElement.adaptiveChild?.widthMode || singleElement.adaptiveGroup?.widthMode || "fill-parent"}
                        onChange={(e) => {
                          const val = e.target.value as SizingMode;
                          updateElement(singleElement.id, {
                            adaptiveChild: {
                              ...(singleElement.adaptiveChild || { widthMode: "fill-parent", heightMode: "fit-content", priority: "flexible" }),
                              widthMode: val,
                            },
                          });
                        }}
                        className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="fill-parent">Fill Container</option>
                        <option value="fit-content">Fit Content</option>
                        <option value="fixed">Fixed Width</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-0.5">Height Sizing</label>
                      <select
                        value={singleElement.adaptiveChild?.heightMode || singleElement.adaptiveGroup?.heightMode || "fit-content"}
                        onChange={(e) => {
                          const val = e.target.value as SizingMode;
                          updateElement(singleElement.id, {
                            adaptiveChild: {
                              ...(singleElement.adaptiveChild || { widthMode: "fill-parent", heightMode: "fit-content", priority: "flexible" }),
                              heightMode: val,
                            },
                          });
                        }}
                        className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="fit-content">Fit Content</option>
                        <option value="fill-parent">Fill Container</option>
                        <option value="fixed">Fixed Height</option>
                      </select>
                    </div>
                  </div>

                  {/* Priority (Directive 105) */}
                  {complexityMode !== "quick" && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 dark:text-slate-400">Content Priority:</span>
                      <select
                        value={singleElement.adaptiveChild?.priority || "flexible"}
                        onChange={(e) => {
                          const p = e.target.value as LayoutPriority;
                          updateElement(singleElement.id, {
                            adaptiveChild: {
                              ...(singleElement.adaptiveChild || { widthMode: "fill-parent", heightMode: "fit-content", priority: "flexible" }),
                              priority: p,
                            },
                          });
                        }}
                        className="bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200 text-[7.5pt] outline-none"
                      >
                        <option value="critical">Critical (Never shrink)</option>
                        <option value="flexible">Flexible</option>
                        <option value="optional">Optional (Collapsible)</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                /* Freeform Constraints (Directive 14) */
                complexityMode !== "quick" && (
                  <div className="space-y-1.5 pt-1 text-[8pt]">
                    <span className="text-slate-600 dark:text-slate-400 block text-[7.5pt]">Responsive Page Constraints:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 block text-[7pt]">Horizontal</label>
                        <select
                          value={singleElement.constraints?.horizontal || "left"}
                          onChange={(e) =>
                            updateElement(singleElement.id, {
                              constraints: {
                                ...(singleElement.constraints || { horizontal: "left", vertical: "top" }),
                                horizontal: e.target.value as HorizontalConstraint,
                              },
                            })
                          }
                          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value="left">Pin Left</option>
                          <option value="center">Center</option>
                          <option value="right">Pin Right</option>
                          <option value="left-right">Left + Right (Stretch)</option>
                          <option value="scale">Scale Proportional</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 block text-[7pt]">Vertical</label>
                        <select
                          value={singleElement.constraints?.vertical || "top"}
                          onChange={(e) =>
                            updateElement(singleElement.id, {
                              constraints: {
                                ...(singleElement.constraints || { horizontal: "left", vertical: "top" }),
                                vertical: e.target.value as VerticalConstraint,
                              },
                            })
                          }
                          className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none"
                        >
                          <option value="top">Pin Top</option>
                          <option value="center">Center</option>
                          <option value="bottom">Pin Bottom</option>
                          <option value="top-bottom">Top + Bottom (Stretch)</option>
                          <option value="scale">Scale Proportional</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {singleElement && complexityMode !== 'quick' && !singleElement.smartBlockData?.curriculum && ['heading', 'subheading', 'body', 'body-text', 'question', 'smart-block', 'table'].includes(singleElement.type) && <details className="border-b border-slate-200 dark:border-white/10 pb-3"><summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">Page flow rules</summary><div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <label title="Move this block and the following block together when they cannot fit on the page." className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={singleElement.semanticConstraints?.keepWithNext ?? ['heading', 'subheading'].includes(singleElement.type)} onChange={event => updateElement(singleElement.id, { semanticConstraints: { ...singleElement.semanticConstraints, keepWithNext: event.target.checked } })}/>Keep with next</label>
            <label title="Keep this block unbroken. Oversized blocks require manual resizing." className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={singleElement.semanticConstraints?.keepTogether ?? !['body','body-text'].includes(singleElement.type)} onChange={event => updateElement(singleElement.id, { semanticConstraints: { ...singleElement.semanticConstraints, keepTogether: event.target.checked } })}/>Keep together</label>
            <label title="Start this reading block on a new page during auto-pagination." className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={!!singleElement.content.breakBefore} onChange={event => updateElementContent(singleElement.id, { breakBefore: event.target.checked })}/>Page break before</label>
          </div></details>}

          {/* Transform & Precise Geometry (Points) */}
          {singleElement && (
            <div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                {complexityMode === "quick" ? "Element Dimensions (pt)" : "Transform & Bounds (pt)"}
              </span>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {complexityMode !== "quick" && (
                  <>
                    <SmartScrubInput
                      label="X"
                      value={Math.round(singleElement.transform.x)}
                      onChange={(val) =>
                        updateElementTransform(singleElement.id, { x: val }, true)
                      }
                      unit="pt"
                    />
                    <SmartScrubInput
                      label="Y"
                      value={Math.round(singleElement.transform.y)}
                      onChange={(val) =>
                        updateElementTransform(singleElement.id, { y: val }, true)
                      }
                      unit="pt"
                    />
                  </>
                )}
                <SmartScrubInput
                  label="W"
                  value={Math.round(singleElement.transform.width)}
                  min={10}
                  onChange={(val) =>
                    updateElementTransform(singleElement.id, { width: val }, true)
                  }
                  unit="pt"
                />
                <SmartScrubInput
                  label="H"
                  value={Math.round(singleElement.transform.height)}
                  min={10}
                  onChange={(val) =>
                    updateElementTransform(singleElement.id, { height: val }, true)
                  }
                  unit="pt"
                />
                {complexityMode !== "quick" && (
                  <>
                    <SmartScrubInput
                      label="∠"
                      value={Math.round(singleElement.transform.rotation || 0)}
                      onChange={(val) =>
                        updateElementTransform(singleElement.id, { rotation: val }, true)
                      }
                      unit="°"
                    />
                    <SmartScrubInput
                      label="Z"
                      value={singleElement.transform.zIndex}
                      min={0}
                      onChange={(val) =>
                        updateElementTransform(singleElement.id, { zIndex: val }, true)
                      }
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Professional Typography & Text Engine Inspector */}
          {textElements.length > 0 && (
            <TypographyInspector selectedElements={textElements} />
          )}

          {/* Vector Shape Engine Inspector */}
          {selectedElements.some((el) => el.type === "shape" || el.style.shapeType) && (
            <ShapeInspector
              selectedElements={selectedElements.filter((el) => el.type === "shape" || el.style.shapeType)}
            />
          )}

          {/* Pixel Adjustments & DPI Inspector (For Images) */}
          {singleElement && singleElement.type === "image" && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Image Print DPI & Adjustments
              </span>

              {/* Effective DPI Calculation */}
              {singleElement.content.rawWidthPx && (
                (() => {
                  const effectiveDpi = calculateEffectiveDpi(
                    singleElement.content.rawWidthPx,
                    singleElement.transform.width
                  );
                  const isLowDpi = effectiveDpi < PRINT_DPI_MINIMUM;
                  return (
                    <div
                      className={`p-2 rounded border ${
                        isLowDpi
                          ? "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300"
                          : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span>Effective Print DPI:</span>
                        <span className="font-bold">{effectiveDpi} DPI</span>
                      </div>
                      {isLowDpi && (
                        <div className="flex items-start gap-1 mt-1 text-[9px]">
                          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span>DPI is below 180 standard. Asset may print pixelated.</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Non-destructive Pixel Filter Sliders */}
              <div className="space-y-2 bg-slate-50 dark:bg-black/25 p-2 rounded border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Non-Destructive Filters</span>
                  <button
                    onClick={() =>
                      updateElementStyle(singleElement.id, {
                        brightness: 0,
                        contrast: 0,
                        saturate: 0,
                        blur: 0,
                        grayscale: 0,
                        hueRotate: 0,
                      })
                    }
                    className="text-[9px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                    title="Reset all filters"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Reset
                  </button>
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span>Brightness</span>
                    <span className="font-mono">{singleElement.style.brightness || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={singleElement.style.brightness || 0}
                    onChange={(e) =>
                      updateElementStyle(singleElement.id, {
                        brightness: Number(e.target.value),
                      })
                    }
                    className="w-full accent-rose-500 h-1 bg-slate-200 dark:bg-white/10 rounded cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span>Contrast</span>
                    <span className="font-mono">{singleElement.style.contrast || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={singleElement.style.contrast || 0}
                    onChange={(e) =>
                      updateElementStyle(singleElement.id, {
                        contrast: Number(e.target.value),
                      })
                    }
                    className="w-full accent-rose-500 h-1 bg-slate-200 dark:bg-white/10 rounded cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span>Saturation</span>
                    <span className="font-mono">{singleElement.style.saturate || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={singleElement.style.saturate || 0}
                    onChange={(e) =>
                      updateElementStyle(singleElement.id, {
                        saturate: Number(e.target.value),
                      })
                    }
                    className="w-full accent-rose-500 h-1 bg-slate-200 dark:bg-white/10 rounded cursor-pointer"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                    <span>Blur (pt)</span>
                    <span className="font-mono">{singleElement.style.blur || 0} pt</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={singleElement.style.blur || 0}
                    onChange={(e) =>
                      updateElementStyle(singleElement.id, {
                        blur: Number(e.target.value),
                      })
                    }
                    className="w-full accent-rose-500 h-1 bg-slate-200 dark:bg-white/10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">Image Caption</label>
                <input
                  type="text"
                  value={singleElement.content.caption || ""}
                  onChange={(e) =>
                    updateElementContent(singleElement.id, { caption: e.target.value })
                  }
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  placeholder="e.g. Figure 4.1: Plant Cell Anatomy"
                />
              </div>
            </div>
          )}

          {/* Table Structure & Editing (For Tables) */}
          {singleElement && singleElement.type === "table" && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Table Structure
              </span>

              <div className="grid grid-cols-2 gap-2 text-center">
                <button
                  onClick={() => updateTableStructure(singleElement.id, "addRow")}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-[10px] font-medium border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200"
                >
                  + Add Row
                </button>
                <button
                  onClick={() => updateTableStructure(singleElement.id, "deleteRow")}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded text-[10px] font-medium border border-slate-200 dark:border-white/5"
                >
                  - Delete Row
                </button>
                <button
                  onClick={() => updateTableStructure(singleElement.id, "addCol")}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-[10px] font-medium border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200"
                >
                  + Add Column
                </button>
                <button
                  onClick={() => updateTableStructure(singleElement.id, "deleteCol")}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded text-[10px] font-medium border border-slate-200 dark:border-white/5"
                >
                  - Delete Column
                </button>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-black/30 rounded border border-slate-200 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400">
                <p>💡 Tip: Double-click any table cell on the page canvas to edit text directly.</p>
              </div>
            </div>
          )}

          {/* Review Studio & Comments on Selected Element */}
          {singleElement && (
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Editorial Comments (
                  {elementComments.length})
                </span>
              </div>

              {elementComments.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {elementComments.map((com) => (
                    <div
                      key={com.id}
                      className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded text-[10px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-800 dark:text-amber-300">{com.author}</span>
                        <button
                          onClick={() => resolveComment(com.id)}
                          className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-600/30 dark:hover:bg-amber-600/50 text-amber-800 dark:text-amber-200 rounded text-[9px] flex items-center gap-1"
                          title="Mark Resolved"
                        >
                          <Check className="w-2.5 h-2.5" /> Resolve
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-snug">{com.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">No unresolved comments on this element.</p>
              )}

              {/* Add Comment Input */}
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  placeholder="Attach review note..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="flex-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-slate-200 outline-none"
                />
                <button
                  onClick={handleAddComment}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded text-[10px]"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Layer Stacking Order */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/5">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
              Layer Stacking Order
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => singleElement && bringToFront(singleElement.id)}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-center text-[10px] font-medium border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200"
              >
                Bring to Front
              </button>
              <button
                onClick={() => singleElement && sendToBack(singleElement.id)}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-center text-[10px] font-medium border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200"
              >
                Send to Back
              </button>
              <button
                onClick={() => singleElement && bringForward(singleElement.id)}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-center text-[10px] font-medium border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200"
              >
                Bring Forward
              </button>
              <button
                onClick={() => singleElement && sendBackward(singleElement.id)}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-center text-[10px] font-medium border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200"
              >
                Send Backward
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
