"use client";

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
import { CurriculumBlockInspector } from "../curriculum/CurriculumBlockInspector";
import { SmartScrubInput } from "../ui/SmartScrubInput";

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
  const [newStyleName, setNewStyleName] = useState("");
  const [showStylePrompt, setShowStylePrompt] = useState(false);
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

  const handleSaveStyle = () => {
    if (!newStyleName.trim() || !singleElement) return;
    createTextStyleFromElement(singleElement.id, newStyleName.trim());
    setNewStyleName("");
    setShowStylePrompt(false);
  };

  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className="relative h-full bg-[#0d121e] border-l border-white/[0.08] flex flex-col text-slate-200 z-20 overflow-y-auto select-none custom-scrollbar flex-shrink-0"
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={handleStartResize}
        onDoubleClick={() => setPanelWidth(320)}
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-30"
        title="Drag to resize inspector (Double-click to reset)"
      />
      {/* Panel Header with Inspector / Layout Partner Mode Switcher */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#0c101b]">
        <div className="flex items-center gap-2 min-h-9 text-[13px] font-medium text-slate-100">
          <Sliders className="w-4 h-4 text-indigo-300" />
          <span>Inspector</span>
        </div>
        <button
          onClick={() => setRightInspectorOpen(false)}
          className="text-slate-400 hover:text-white w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          title="Collapse Inspector"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-2 bg-[#090d16] border-b border-white/[0.06]">
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
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-200"
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
              <span className="font-semibold text-slate-100 block text-base">
                Page {activePage?.displayNumber || "1"}
              </span>
              <span className="block text-[13px] text-slate-400 mt-0.5">
                {activePage?.layoutMode === "adaptive" ? "Adaptive layout" : "Freeform layout"}
              </span>
            </div>
            {activePage?.overflowWarning?.hasOverflow ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 text-[13px] border border-amber-500/30">
                Overflow
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[13px] border border-emerald-500/25">
                Ready
              </span>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setActiveLayoutGalleryOpen(true)}
              className="w-full min-h-11 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              title="Preview this page in another layout"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>Try layout</span>
            </button>
            <button
              onClick={() => autoArrangeActivePage("balanced")}
              className="w-full min-h-11 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-200 border border-white/10 font-medium active:scale-[0.98] transition-transform"
              title="Balance this page automatically"
            >
              Auto arrange
            </button>
            <button
              onClick={() => shuffleCompatibleLayout()}
              className="w-full min-h-11 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] active:scale-[0.98] transition-transform"
              title="Shuffle among compatible layouts"
            >
              Shuffle layout
            </button>
          </div>

          {complexityMode !== "quick" && (
          <>
          {/* Page Geometry & Print Margins */}
          {book && (
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Page Dimensions & Margins
              </span>
              <div className="bg-black/40 p-3 rounded-xl border border-white/[0.08] space-y-2 text-[8.5pt]">
                <div className="flex justify-between text-slate-400">
                  <span>Size:</span>
                  <span className="font-mono font-medium text-slate-200">
                    {Math.round(book.dimensions.widthPt)} × {Math.round(book.dimensions.heightPt)} pt
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Inside Margin:</span>
                  <span className="font-mono text-slate-200">{book.margins.insidePt} pt</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Outside Margin:</span>
                  <span className="font-mono text-slate-200">{book.margins.outsidePt} pt</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Top / Bottom:</span>
                  <span className="font-mono text-slate-200">
                    {book.margins.topPt} / {book.margins.bottomPt} pt
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bleed:</span>
                  <span className="font-mono text-rose-300 font-semibold">{book.bleed.topPt} pt (3mm)</span>
                </div>
              </div>
            </div>
          )}

          {/* Starter Presets Browser Shortcut */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Apply Preset
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPagePreset("content-editorial-split")}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-left border border-white/[0.06] hover:border-indigo-500/40 group transition-all active:scale-95"
              >
                <span className="font-semibold text-slate-300 block text-[8pt] group-hover:text-indigo-300">
                  📖 Editorial Split
                </span>
                <span className="text-[7pt] text-slate-500">Headline + Hero image</span>
              </button>
              <button
                onClick={() => applyPagePreset("activity-hands-on-lab")}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-left border border-white/[0.06] hover:border-emerald-500/40 group transition-all active:scale-95"
              >
                <span className="font-semibold text-slate-300 block text-[8pt] group-hover:text-emerald-300">
                  🧪 Hands-on Lab
                </span>
                <span className="text-[7pt] text-slate-500">Experiment steps</span>
              </button>
              <button
                onClick={() => applyPagePreset("assessment-mcq-grid")}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-left border border-white/[0.06] hover:border-amber-500/40 group transition-all active:scale-95"
              >
                <span className="font-semibold text-slate-300 block text-[8pt] group-hover:text-amber-300">
                  📝 MCQ Quiz
                </span>
                <span className="text-[7pt] text-slate-500">Question cards</span>
              </button>
              <button
                onClick={() => applyPagePreset("chapter-opener-hero")}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-left border border-white/[0.06] hover:border-rose-500/40 group transition-all active:scale-95"
              >
                <span className="font-semibold text-slate-300 block text-[8pt] group-hover:text-rose-300">
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
              className="w-full py-2.5 mt-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-center text-slate-200 font-semibold text-[8pt] border border-white/10 transition-all active:scale-95 shadow-xs"
            >
              Browse All 160+ Presets →
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <span className="text-[13px] font-medium text-slate-300 block">Theme and type</span>
            <label className="block text-slate-400 text-[13px]">
              Theme
              <select
                value={activeThemeId}
                onChange={(e) => {
                  setActiveThemeId(e.target.value);
                  applyThemeToBook(e.target.value);
                }}
                className="mt-1 w-full min-h-11 bg-[#10151f] border border-white/10 rounded-xl px-3 text-slate-100 outline-none"
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
            <label className="block text-slate-400 text-[13px]">
              Type
              <select
                value={activeFontPairing}
                onChange={(e) => {
                  setActiveFontPairing(e.target.value);
                  applyFontPairingToBook(e.target.value);
                }}
                className="mt-1 w-full min-h-11 bg-[#10151f] border border-white/10 rounded-xl px-3 text-slate-100 outline-none"
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
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <span className="font-semibold text-slate-200 block truncate max-w-[170px]">
                {singleElement ? singleElement.displayName : `${selectedElements.length} Objects Selected`}
              </span>
              {singleElement && (
                <span className="block text-[10px] text-slate-400 font-mono">
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
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    {singleElement.style.opacity === 0 ? (
                      <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      useEditorStore.getState().toggleLockElement(singleElement.id)
                    }
                    title={singleElement.locked ? "Unlock" : "Lock"}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    {singleElement.locked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}
              <button
                onClick={duplicateSelectedElements}
                title="Duplicate (Cmd+D)"
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteSelectedElements}
                title="Delete (Del)"
                className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {singleElement?.smartBlockData && (singleElement.smartBlockData.curriculum ? <CurriculumBlockInspector key={singleElement.smartBlockData.curriculum.sourceBlockId || singleElement.id} element={singleElement} /> : <PublicationInspector element={singleElement} />)}
          {singleElement && (singleElement.content.artwork || singleElement.type === "image" || singleElement.type === "picture-frame" || singleElement.type === "pictureFrame" || singleElement.type === "ai-image" || Boolean(singleElement.content.src || singleElement.content.imageUrl)) && <ArtworkInspector element={singleElement} />}

          {/* Boolean Operations (If 2+ Elements Selected) */}
          {selectedElements.length >= 2 && (
            <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-lg space-y-1.5">
              <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider block font-mono">
                Boolean Vector Operations
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => performBooleanOperation("union")}
                  className="px-2 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded text-[10px] font-medium flex items-center justify-center gap-1"
                  title="Combine shapes into a single union geometry"
                >
                  <Combine className="w-3 h-3" /> Union
                </button>
                <button
                  onClick={() => performBooleanOperation("subtract")}
                  className="px-2 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded text-[10px] font-medium flex items-center justify-center gap-1"
                  title="Subtract front shape from background shape"
                >
                  <Scissors className="w-3 h-3" /> Subtract
                </button>
                <button
                  onClick={() => performBooleanOperation("intersect")}
                  className="px-2 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded text-[10px] font-medium flex items-center justify-center gap-1"
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
            <div className="bg-black/30 border border-white/10 p-2.5 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                  Layout Engine
                </span>
                <div className="flex items-center p-0.5 bg-black/40 rounded border border-white/10 text-[7.5pt]">
                  <button
                    onClick={() => setElementLayoutMode(singleElement.id, "freeform")}
                    className={`px-2 py-0.5 rounded font-medium ${
                      singleElement.layoutMode !== "adaptive"
                        ? "bg-white/20 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Freeform
                  </button>
                  <button
                    onClick={() => setElementLayoutMode(singleElement.id, "adaptive")}
                    className={`px-2 py-0.5 rounded font-medium ${
                      singleElement.layoutMode === "adaptive"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
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
                    <label className="text-slate-400 block mb-0.5">Stack Direction</label>
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
                              ? "bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-semibold"
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
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
                      <label className="text-slate-400 block mb-0.5">Spacing: {singleElement.adaptiveGroup?.spacingPt || 14}pt</label>
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
                      <label className="text-slate-400 block mb-0.5">Padding: {singleElement.adaptiveGroup?.padding.top || 0}pt</label>
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
                      <label className="text-slate-400 block mb-0.5">Width Sizing</label>
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
                        className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-slate-200 outline-none"
                      >
                        <option value="fill-parent">Fill Container</option>
                        <option value="fit-content">Fit Content</option>
                        <option value="fixed">Fixed Width</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Height Sizing</label>
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
                        className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-slate-200 outline-none"
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
                      <span className="text-slate-400">Content Priority:</span>
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
                        className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-slate-200 text-[7.5pt] outline-none"
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
                    <span className="text-slate-400 block text-[7.5pt]">Responsive Page Constraints:</span>
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
                          className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-slate-200 outline-none"
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
                          className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-slate-200 outline-none"
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

          {/* Transform & Precise Geometry (Points) */}
          {singleElement && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
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

          {/* Typography Inspector (For Text & Content Elements) */}
          {singleElement &&
            ["heading", "subheading", "body", "caption", "quote"].includes(singleElement.type) && (
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-rose-400" /> Typography
                  </span>
                  <button
                    onClick={() => setShowStylePrompt(!showStylePrompt)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    + New Style
                  </button>
                </div>

                {/* Beginner Quick Typography Presets (Directive 51) */}
                <div className="grid grid-cols-4 gap-1 pb-1">
                  <button
                    onClick={() =>
                      updateElementStyle(singleElement.id, {
                        fontSize: 26,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        color: "#1e293b",
                      })
                    }
                    className="py-1 rounded bg-black/40 hover:bg-indigo-600/30 text-center font-bold text-[7.5pt] text-slate-200"
                  >
                    Title
                  </button>
                  <button
                    onClick={() =>
                      updateElementStyle(singleElement.id, {
                        fontSize: 18,
                        fontWeight: 600,
                        lineHeight: 1.35,
                        color: "#334155",
                      })
                    }
                    className="py-1 rounded bg-black/40 hover:bg-indigo-600/30 text-center font-semibold text-[7.5pt] text-slate-200"
                  >
                    Heading
                  </button>
                  <button
                    onClick={() =>
                      updateElementStyle(singleElement.id, {
                        fontSize: 10.5,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: "#475569",
                      })
                    }
                    className="py-1 rounded bg-black/40 hover:bg-indigo-600/30 text-center text-[7.5pt] text-slate-200"
                  >
                    Body
                  </button>
                  <button
                    onClick={() =>
                      updateElementStyle(singleElement.id, {
                        fontSize: 8.5,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        color: "#64748b",
                      })
                    }
                    className="py-1 rounded bg-black/40 hover:bg-indigo-600/30 text-center text-[7.5pt] text-slate-200"
                  >
                    Caption
                  </button>
                </div>

                {/* Save Style Inline Input */}
                {showStylePrompt && (
                  <div className="bg-black/40 p-2 rounded border border-rose-500/30 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Style Name (e.g. Chapter Subtitle)"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-200 outline-none"
                    />
                    <button
                      onClick={handleSaveStyle}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-medium"
                    >
                      Save
                    </button>
                  </div>
                )}

                {/* Paragraph Style Selector */}
                {book?.textStyles && book.textStyles.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">Paragraph Style</label>
                    <select
                      value={singleElement.style.styleId || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          applyTextStyle(singleElement.id, e.target.value);
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                    >
                      <option value="">Custom (No Assigned Style)</option>
                      {book.textStyles.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.fontSize}pt {st.fontWeight})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Font Family & Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Font Family</label>
                    <select
                      value={singleElement.style.fontFamily || "Inter"}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, { fontFamily: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-xs text-slate-200 outline-none"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Merriweather">Merriweather</option>
                      <option value="Crimson Pro">Crimson Pro</option>
                      <option value="Georgia">Georgia</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Font Size (pt)</label>
                    <input
                      type="number"
                      value={singleElement.style.fontSize || 11}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, {
                          fontSize: Math.max(6, Number(e.target.value)),
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                    />
                  </div>
                </div>

                {/* Weight & Color */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Font Weight</label>
                    <select
                      value={singleElement.style.fontWeight || 400}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, {
                          fontWeight: Number(e.target.value) as 400 | 600 | 700,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-xs text-slate-200 outline-none"
                    >
                      <option value={400}>Regular (400)</option>
                      <option value={600}>Semibold (600)</option>
                      <option value={700}>Bold (700)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Text Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={singleElement.style.color || "#0f172a"}
                        onChange={(e) =>
                          updateElementStyle(singleElement.id, { color: e.target.value })
                        }
                        className="w-7 h-6 bg-transparent rounded cursor-pointer border border-white/10"
                      />
                      <span className="text-[10px] font-mono text-slate-300">
                        {singleElement.style.color || "#0f172a"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alignment & Letter Spacing */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Align</span>
                  <div className="flex bg-black/30 rounded p-0.5 border border-white/10">
                    {(["left", "center", "right", "justify"] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateElementStyle(singleElement.id, { textAlign: align })}
                        className={`p-1 rounded ${
                          singleElement.style.textAlign === align
                            ? "bg-rose-700 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {align === "left" && <AlignLeft className="w-3 h-3" />}
                        {align === "center" && <AlignCenter className="w-3 h-3" />}
                        {align === "right" && <AlignRight className="w-3 h-3" />}
                        {align === "justify" && <AlignJustify className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-Column Layout */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Text Columns</label>
                    <select
                      value={singleElement.style.columns || 1}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, {
                          columns: Number(e.target.value),
                          columnGap: singleElement.style.columnGap || 14,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-xs text-slate-200 outline-none"
                    >
                      <option value={1}>1 Column (Standard)</option>
                      <option value={2}>2 Columns (Textbook)</option>
                      <option value={3}>3 Columns (Glossary)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Column Gap (pt)</label>
                    <input
                      type="number"
                      value={singleElement.style.columnGap || 14}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, { columnGap: Number(e.target.value) })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

          {/* Vector Shape Inspector */}
          {singleElement &&
            (singleElement.type === "shape" || singleElement.style.shapeType) && (
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5 text-rose-400" /> Vector Geometry & Stroke
                </span>

                {/* Shape Type Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Shape Type</label>
                  <select
                    value={singleElement.style.shapeType || "rectangle"}
                    onChange={(e) =>
                      updateElementStyle(singleElement.id, {
                        shapeType: e.target.value as VectorShapeType,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none capitalize"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="ellipse">Ellipse</option>
                    <option value="star">5-Point Star</option>
                    <option value="polygon">Hexagon Polygon</option>
                    <option value="line">Straight Line</option>
                    <option value="arrow">Vector Arrow</option>
                  </select>
                </div>

                {/* Fill & Stroke Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Fill Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={singleElement.style.backgroundColor || "#800020"}
                        onChange={(e) =>
                          updateElementStyle(singleElement.id, {
                            backgroundColor: e.target.value,
                          })
                        }
                        className="w-7 h-6 bg-transparent rounded cursor-pointer border border-white/10"
                      />
                      <span className="text-[10px] font-mono text-slate-300">
                        {singleElement.style.backgroundColor || "#800020"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Stroke Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={singleElement.style.strokeColor || "#ffffff"}
                        onChange={(e) =>
                          updateElementStyle(singleElement.id, {
                            strokeColor: e.target.value,
                          })
                        }
                        className="w-7 h-6 bg-transparent rounded cursor-pointer border border-white/10"
                      />
                      <span className="text-[10px] font-mono text-slate-300">
                        {singleElement.style.strokeColor || "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stroke Width & Corner Radius */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Stroke Width (pt)</label>
                    <input
                      type="number"
                      value={singleElement.style.strokeWidth || 0}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, {
                          strokeWidth: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Corner Radius (pt)</label>
                    <input
                      type="number"
                      value={singleElement.style.borderRadius || 0}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, {
                          borderRadius: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                    />
                  </div>
                </div>

                {/* Stroke Dash & Caps */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Stroke Dash</label>
                    <select
                      value={singleElement.style.strokeDasharray || "none"}
                      onChange={(e) =>
                        updateElementStyle(singleElement.id, {
                          strokeDasharray: e.target.value === "none" ? undefined : e.target.value,
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-xs text-slate-200 outline-none"
                    >
                      <option value="none">Solid Line</option>
                      <option value="4,4">Dashed (4,4)</option>
                      <option value="2,2">Dotted (2,2)</option>
                      <option value="8,4,2,4">Dash-Dot</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Arrow Caps</label>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="flex items-center gap-1 text-[10px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={singleElement.style.arrowEnd || false}
                          onChange={(e) =>
                            updateElementStyle(singleElement.id, {
                              arrowEnd: e.target.checked,
                            })
                          }
                          className="accent-rose-500 rounded"
                        />
                        Tip
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={singleElement.style.arrowStart || false}
                          onChange={(e) =>
                            updateElementStyle(singleElement.id, {
                              arrowStart: e.target.checked,
                            })
                          }
                          className="accent-rose-500 rounded"
                        />
                        Tail
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Pixel Adjustments & DPI Inspector (For Images) */}
          {singleElement && singleElement.type === "image" && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-400" /> Image Print DPI & Adjustments
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
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
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
              <div className="space-y-2 bg-black/25 p-2 rounded border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-300">Non-Destructive Filters</span>
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
                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1"
                    title="Reset all filters"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Reset
                  </button>
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
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
                    className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
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
                    className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
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
                    className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
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
                    className="w-full accent-rose-500 h-1 bg-white/10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Image Caption</label>
                <input
                  type="text"
                  value={singleElement.content.caption || ""}
                  onChange={(e) =>
                    updateElementContent(singleElement.id, { caption: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                  placeholder="e.g. Figure 4.1: Plant Cell Anatomy"
                />
              </div>
            </div>
          )}

          {/* Table Structure & Editing (For Tables) */}
          {singleElement && singleElement.type === "table" && (
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-rose-400" /> Table Structure
              </span>

              <div className="grid grid-cols-2 gap-2 text-center">
                <button
                  onClick={() => updateTableStructure(singleElement.id, "addRow")}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] font-medium border border-white/5"
                >
                  + Add Row
                </button>
                <button
                  onClick={() => updateTableStructure(singleElement.id, "deleteRow")}
                  className="px-2 py-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-medium border border-white/5"
                >
                  - Delete Row
                </button>
                <button
                  onClick={() => updateTableStructure(singleElement.id, "addCol")}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] font-medium border border-white/5"
                >
                  + Add Column
                </button>
                <button
                  onClick={() => updateTableStructure(singleElement.id, "deleteCol")}
                  className="px-2 py-1.5 bg-white/5 hover:bg-rose-500/20 text-rose-300 rounded text-[10px] font-medium border border-white/5"
                >
                  - Delete Column
                </button>
              </div>

              <div className="p-2 bg-black/30 rounded border border-white/5 text-[10px] text-slate-400">
                <p>💡 Tip: Double-click any table cell on the page canvas to edit text directly.</p>
              </div>
            </div>
          )}

          {/* Review Studio & Comments on Selected Element */}
          {singleElement && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Editorial Comments (
                  {elementComments.length})
                </span>
              </div>

              {elementComments.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {elementComments.map((com) => (
                    <div
                      key={com.id}
                      className="p-2 bg-amber-950/20 border border-amber-500/30 rounded text-[10px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-300">{com.author}</span>
                        <button
                          onClick={() => resolveComment(com.id)}
                          className="px-1.5 py-0.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded text-[9px] flex items-center gap-1"
                          title="Mark Resolved"
                        >
                          <Check className="w-2.5 h-2.5" /> Resolve
                        </button>
                      </div>
                      <p className="text-slate-300 leading-snug">{com.text}</p>
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
                  className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-200 outline-none"
                />
                <button
                  onClick={handleAddComment}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-900 font-semibold rounded text-[10px]"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Layer Stacking Order */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
              Layer Stacking Order
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => singleElement && bringToFront(singleElement.id)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-center text-[10px] font-medium border border-white/5"
              >
                Bring to Front
              </button>
              <button
                onClick={() => singleElement && sendToBack(singleElement.id)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-center text-[10px] font-medium border border-white/5"
              >
                Send to Back
              </button>
              <button
                onClick={() => singleElement && bringForward(singleElement.id)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-center text-[10px] font-medium border border-white/5"
              >
                Bring Forward
              </button>
              <button
                onClick={() => singleElement && sendBackward(singleElement.id)}
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-center text-[10px] font-medium border border-white/5"
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
