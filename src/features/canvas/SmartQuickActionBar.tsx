"use client";

import { SIGNATURE_LAYOUTS } from "../../editor/educational/atelier/skins/signature";
import { CURRICULUM_BLOCK_MAP, LAYOUT_NAMES } from "../../editor/curriculum/catalog";
import { switchCurriculumLayout, reshuffleCurriculumBlock } from "../../editor/curriculum/actions";
import type { CurriculumLayout } from "../../domain/educational/curriculum";
import React, { useState, useRef, useEffect } from "react";
import { PageElement } from "../../domain/element/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { beginBlockContentEditing } from "../../editor/educational/blockContentEditing";
import { useLayoutPartnerStore } from "../../editor/layoutPartner/layoutPartnerStore";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Copy,
  Layers,
  Sparkles,
  MoreHorizontal,
  Lock,
  Unlock,
  Trash2,
  Maximize2,
  Shuffle,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveUp,
  MoveDown,
  FolderPlus,
  FolderMinus,
  Check,
  LayoutGrid,
  Unlink2,
  LayoutTemplate,
} from "lucide-react";

interface SmartQuickActionBarProps {
  selectedElements: PageElement[];
  zoom: number;
}

export const SmartQuickActionBar: React.FC<SmartQuickActionBarProps> = ({
  selectedElements,
  zoom,
}) => {
  const {
    updateElementStyle,
    updateElementTransform,
    setElementLayoutMode,
    groupSelectedElements,
    groupAndLockSelectedElements,
    ungroupSelectedElements,
    deleteSelectedElements,
    duplicateSelectedElementsWithOffset,
    alignSelectedElements,
    distributeSelectedElements,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    shuffleEducationalBlockStyle,
    updateSmartBlockStyle,
  } = useEditorStore();

  const { quickActionBarVisible } = useUiStore();
  const [activeMenu, setActiveMenu] = useState<"align" | "layer" | "ai" | "more" | "smartLayout" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("mousedown", handleGlobalClick);
    return () => window.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  const editingTextElementId = useUiStore(s=>s.editingTextElementId);
  if (!quickActionBarVisible || selectedElements.length === 0 || selectedElements.some(el=>el.id===editingTextElementId)) return null;

  // Compute selection bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedElements.forEach((el) => {
    minX = Math.min(minX, el.transform.x);
    minY = Math.min(minY, el.transform.y);
    maxX = Math.max(maxX, el.transform.x + el.transform.width);
    maxY = Math.max(maxY, el.transform.y + el.transform.height);
  });

  const width = maxX - minX;
  const isMulti = selectedElements.length > 1;
  const single = selectedElements.length === 1 ? selectedElements[0] : null;
  if (single?.smartBlockData?.styleOverrides.contentLayout?.enabled) return null;

  // Flip position if near top of page (< 55pt) to avoid viewport clipping
  const isFlippedBelow = minY < 55 / zoom || Boolean(single?.smartBlockData);
  const barTopPt = isFlippedBelow ? maxY + 30 / zoom : minY - 44 / zoom;
  const barLeftPt = Math.max(20, minX + width / 2);

  const isTextElement = (el: PageElement | null): boolean => {
    if (!el) return false;
    return [
      "heading",
      "subheading",
      "body",
      "caption",
      "quote",
      "pageNumber",
      "learningObjectives",
      "didYouKnow",
      "keyConcept",
      "definition",
      "vocabulary",
      "workedExample",
      "activity",
      "question",
      "mcq",
    ].includes(el.type);
  };

  const isSmartBlock = single?.type === "smart-block";

  const handleAlign = (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    alignSelectedElements(alignment);
    setActiveMenu(null);
  };

  const handleDistribute = (dir: "horizontal" | "vertical") => {
    distributeSelectedElements(dir);
    setActiveMenu(null);
  };

  const handleTextStyleChange = (preset: "h1" | "h2" | "body") => {
    if (!single) return;
    if (preset === "h1") {
      updateElementStyle(single.id, { fontSize: 24, fontWeight: 700, lineHeight: 1.25 });
    } else if (preset === "h2") {
      updateElementStyle(single.id, { fontSize: 16, fontWeight: 600, lineHeight: 1.35 });
    } else if (preset === "body") {
      updateElementStyle(single.id, { fontSize: 11, fontWeight: 400, lineHeight: 1.5 });
    }
  };

  const handleFontSizeDelta = (delta: number) => {
    selectedElements.forEach((el) => {
      const current = el.style.fontSize || 12;
      const next = Math.max(6, Math.min(96, current + delta));
      updateElementStyle(el.id, { fontSize: next });
    });
  };

  const allLocked = selectedElements.every((el) => el.locked);

  return (
    <div
      ref={containerRef}
      data-canvas-controls
      data-canvas-zoom={zoom}
      className="absolute z-50 pointer-events-auto transform -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 bg-[#10141D]/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-white/10 text-[8.5pt] animate-float-in select-none"
      style={{
        transform: `translateX(-50%) scale(${1 / zoom})`,
        transformOrigin: "top center",
        top: `${barTopPt}pt`,
        left: `${barLeftPt}pt`,
      }}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. ALIGN DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === "align" ? null : "align")}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white transition-all ${
            activeMenu === "align" ? "bg-white/15 text-white" : "hover:bg-white/10"
          }`}
          title="Align & Distribute"
        >
          <AlignCenter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Align</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {activeMenu === "align" && (
          <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#10141D] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-float-in text-[8pt]">
            <div className="text-[7pt] uppercase tracking-wider text-slate-400 font-mono px-2 py-1">
              Alignment
            </div>
            <div className="grid grid-cols-3 gap-0.5 mb-1.5">
              <button
                onClick={() => handleAlign("left")}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleAlign("center")}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleAlign("right")}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-0.5 mb-1.5">
              <button
                onClick={() => handleAlign("top")}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Align Top"
              >
                <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleAlign("middle")}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Align Middle"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleAlign("bottom")}
                className="flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
              </button>
            </div>
            {isMulti && (
              <>
                <div className="h-[1px] bg-white/10 my-1" />
                <div className="text-[7pt] uppercase tracking-wider text-slate-400 font-mono px-2 py-1">
                  Distribute
                </div>
                <button
                  onClick={() => handleDistribute("horizontal")}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-between"
                >
                  <span>Horizontally</span>
                  <span className="text-[7pt] text-slate-500 font-mono">⇥ ⇤</span>
                </button>
                <button
                  onClick={() => handleDistribute("vertical")}
                  className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-between"
                >
                  <span>Vertically</span>
                  <span className="text-[7pt] text-slate-500 font-mono">↕</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. DUPLICATE BUTTON */}
      <button
        onClick={() => duplicateSelectedElementsWithOffset({ dx: 15, dy: 15 })}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
        title="Duplicate Selection (Cmd + D)"
      >
        <Copy className="w-3.5 h-3.5 text-slate-400" />
        <span>Duplicate</span>
      </button>

      {/* MULTI-SELECTION: GROUP & GROUP AND LOCK */}
      {isMulti && (
        <>
          <button
            onClick={() => groupSelectedElements()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all font-medium"
            title="Group Elements (⌘G)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Group</span>
          </button>
          <button
            onClick={() => groupAndLockSelectedElements()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all font-medium"
            title="Group and Lock Elements in one step (⌘⇧L)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Group & Lock</span>
          </button>
        </>
      )}

      {/* SINGLE GROUP SELECTION: UNGROUP */}
      {single && Boolean(single.childElementIds?.length) && (
        <button
          onClick={() => ungroupSelectedElements()}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          title="Ungroup Elements (⇧⌘G)"
        >
          <FolderMinus className="w-3.5 h-3.5 text-slate-400" />
          <span>Ungroup</span>
        </button>
      )}

      {/* QUICK LOCK / UNLOCK TOGGLE */}
      <button
        onClick={() => {
          selectedElements.forEach((el) => {
            useEditorStore.getState().updateElement(el.id, { locked: !allLocked });
          });
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
          allLocked
            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
            : "text-slate-300 hover:text-white hover:bg-white/10"
        }`}
        title={allLocked ? "Unlock Selection (⌘L)" : "Lock Selection (⌘L)"}
      >
        {allLocked ? (
          <>
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-300">Unlock</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Lock</span>
          </>
        )}
      </button>

      {/* WORKBOOK CONTENT SPACE CONTROLS FOR WRITING LINES & ANSWER AREAS */}
      {single && (single.type === "writingLines" || single.type === "answer-area") && (
        <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-0.5 text-[7.5pt]">
          <span className="text-slate-400">Lines:</span>
          <button
            onClick={() => {
              const current = (single.content.lineCount as number) || (single.type === "writingLines" ? 4 : 6);
              if (current > 1) {
                useEditorStore.getState().updateElementContent(single.id, { lineCount: current - 1 });
              }
            }}
            className="text-slate-300 hover:text-white font-mono px-1 hover:bg-white/10 rounded"
            title="Decrease lines"
          >
            -
          </button>
          <span className="font-mono text-[8pt] font-bold text-indigo-300 min-w-[14px] text-center">
            {(single.content.lineCount as number) || (single.type === "writingLines" ? 4 : 6)}
          </span>
          <button
            onClick={() => {
              const current = (single.content.lineCount as number) || (single.type === "writingLines" ? 4 : 6);
              if (current < 20) {
                useEditorStore.getState().updateElementContent(single.id, { lineCount: current + 1 });
              }
            }}
            className="text-slate-300 hover:text-white font-mono px-1 hover:bg-white/10 rounded"
            title="Add line / space for content"
          >
            +
          </button>
        </div>
      )}

      {/* 3. LAYER DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === "layer" ? null : "layer")}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-slate-300 hover:text-white transition-all ${
            activeMenu === "layer" ? "bg-white/15 text-white" : "hover:bg-white/10"
          }`}
          title="Layer Ordering"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Layer</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {activeMenu === "layer" && (
          <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#10141D] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-float-in text-[8pt]">
            <button
              onClick={() => {
                if (single) bringToFront(single.id);
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ArrowUpToLine className="w-3.5 h-3.5 text-slate-400" /> Bring to Front
              </span>
              <span className="text-[7pt] text-slate-500 font-mono">⌘]</span>
            </button>
            <button
              onClick={() => {
                if (single) bringForward(single.id);
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <MoveUp className="w-3.5 h-3.5 text-slate-400" /> Bring Forward
              </span>
              <span className="text-[7pt] text-slate-500 font-mono">]</span>
            </button>
            <button
              onClick={() => {
                if (single) sendBackward(single.id);
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <MoveDown className="w-3.5 h-3.5 text-slate-400" /> Send Backward
              </span>
              <span className="text-[7pt] text-slate-500 font-mono">[</span>
            </button>
            <button
              onClick={() => {
                if (single) sendToBack(single.id);
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ArrowDownToLine className="w-3.5 h-3.5 text-slate-400" /> Send to Back
              </span>
              <span className="text-[7pt] text-slate-500 font-mono">⌘[</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. CONTEXTUAL: TEXT CONTROLS */}
      {single && isTextElement(single) && (
        <>
          <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleTextStyleChange("h1")}
              className={`px-1.5 py-0.5 rounded text-[7.5pt] font-bold ${
                (single.style.fontSize || 0) >= 20
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-slate-300 hover:text-white"
              }`}
            >
              H1
            </button>
            <button
              onClick={() => handleTextStyleChange("h2")}
              className={`px-1.5 py-0.5 rounded text-[7.5pt] font-semibold ${
                (single.style.fontSize || 0) >= 14 && (single.style.fontSize || 0) < 20
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-slate-300 hover:text-white"
              }`}
            >
              H2
            </button>
            <button
              onClick={() => handleTextStyleChange("body")}
              className={`px-1.5 py-0.5 rounded text-[7.5pt] ${
                (single.style.fontSize || 0) < 14
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-slate-300 hover:text-white"
              }`}
            >
              P
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-white/10 rounded-lg px-1 py-0.5">
            <button
              onClick={() => handleFontSizeDelta(-1)}
              className="text-slate-300 hover:text-white font-mono px-1 hover:bg-white/10 rounded"
            >
              -
            </button>
            <span className="font-mono text-[7.5pt] min-w-[18px] text-center">
              {Math.round(single.style.fontSize || 12)}
            </span>
            <button
              onClick={() => handleFontSizeDelta(1)}
              className="text-slate-300 hover:text-white font-mono px-1 hover:bg-white/10 rounded"
            >
              +
            </button>
          </div>
        </>
      )}

      {/* 5. CONTEXTUAL: SMART EDUCATIONAL BLOCK CONTROLS */}
      {isSmartBlock && single && (
        <>
          <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

          {/* Fancy Layout Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "smartLayout" ? null : "smartLayout")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-slate-200 transition-all font-medium ${
                activeMenu === "smartLayout" ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/15"
              }`}
              title="Switch Block Layout Style"
            >
              <LayoutGrid className="w-3 h-3 text-indigo-400" />
              <span>Layout</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {activeMenu === "smartLayout" && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#10141D] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-float-in text-[8pt]">
                <div className="text-[7pt] uppercase tracking-wider text-slate-400 font-mono px-2 py-1">
                  Block Layouts
                </div>
                {(single.smartBlockData?.curriculum ? CURRICULUM_BLOCK_MAP[single.smartBlockData.curriculum.type].layouts.map(id=>({id,label:LAYOUT_NAMES[id]})) : single.smartBlockData?.presetId.startsWith("atelier-") ? SIGNATURE_LAYOUTS.map(layout=>({id:layout.id,label:layout.name})) : [
                  { id: "holographic-hud", label: "✦ Holographic HUD" },
                  { id: "neo-bento", label: "❖ Neo-Bento Cards" },
                  { id: "editorial-luxury", label: "✒️ Editorial Luxury" },
                  { id: "cyberpunk-terminal", label: "⚡ Cyberpunk Terminal" },
                  { id: "activity-studio", label: "🎯 Activity Studio" },
                  { id: "quantum-split", label: "◫ Quantum Split" },
                ]).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if(single.smartBlockData?.curriculum) switchCurriculumLayout(single,mode.id as CurriculumLayout); else updateSmartBlockStyle(single.id, { layoutVariant: mode.id });
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
                  >
                    <span>{mode.label}</span>
                    {single.smartBlockData?.styleOverrides?.layoutVariant === mode.id && (
                      <Check className="w-3 h-3 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Edit Words Inspector Shortcut */}
          <button
            onClick={() => {
              useUiStore.getState().setRightInspectorOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition-all font-medium"
            title="Open Inspector to edit text, questions and content"
          >
            <span>Edit Words</span>
          </button>

          {/* Shuffle Style */}
          <button
            onClick={() => single.smartBlockData?.curriculum ? reshuffleCurriculumBlock(single) : shuffleEducationalBlockStyle(single.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all font-medium"
            title="Shuffle visual design variant"
          >
            <Shuffle className="w-3 h-3 text-indigo-300" />
            <span>Shuffle</span>
          </button>

          {/* Detach Block into Individual Movable Elements */}
          <button
            onClick={() => beginBlockContentEditing(single.id)}
            disabled={single.smartBlockData?.styleOverrides.contentLayout?.enabled}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 hover:border-amber-400 transition-all font-medium cursor-pointer shadow-sm active:scale-95"
            title="Move and edit text and images inside the block"
          >
            <Unlink2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{single.smartBlockData?.styleOverrides.contentLayout?.enabled ? "Contents editable" : "Edit contents"}</span>
          </button>
        </>
      )}

      {/* 6. CONTEXTUAL: IMAGE CONTROLS */}
      {single && single.type === "image" && (
        <>
          <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
          <button
            onClick={() => {
              const url = window.prompt("Enter new Image URL:", single.content.imageUrl || "");
              if (url) {
                updateElementStyle(single.id, {});
                useEditorStore.getState().updateElementContent(single.id, { imageUrl: url });
              }
            }}
            className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[7.5pt] font-medium"
          >
            Replace
          </button>
          <button
            onClick={() => {
              const currentFit = single.style.objectFit || "cover";
              updateElementStyle(single.id, {
                objectFit: currentFit === "cover" ? "contain" : "cover",
              });
            }}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[7.5pt]"
          >
            {single.style.objectFit === "contain" ? "Fit" : "Cover"}
          </button>
        </>
      )}

      <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

      {/* 7. ✦ AI DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === "ai" ? null : "ai")}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
            activeMenu === "ai"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
              : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
          }`}
          title="✦ AI Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-300" />
          <span className="font-semibold text-[8pt]">✦ AI</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {activeMenu === "ai" && (
          <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#10141D] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-float-in text-[8pt]">
            <div className="text-[7pt] uppercase tracking-wider text-violet-400 font-mono px-2 py-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Intelligent Actions
            </div>
            <button
              onClick={() => {
                useLayoutPartnerStore.getState().setPartnerPanelOpen(true);
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
            >
              <span>✦ Layout Partner Analysis</span>
              <span className="text-[7pt] text-violet-400 font-mono">⌘P</span>
            </button>
            <button
              onClick={() => {
                useEditorStore.getState().autoArrangeActivePage("balanced");
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200"
            >
              ✦ Auto Arrange Page
            </button>
            {isTextElement(single) && (
              <>
                <div className="h-[1px] bg-white/10 my-1" />
                <button
                  onClick={() => {
                    if (single) {
                      useEditorStore.getState().updateElementContent(single.id, {
                        text: (single.content.text || "") + " (Rewritten for clear comprehension)",
                      });
                    }
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200"
                >
                  ✦ Rewrite for Grade 5
                </button>
                <button
                  onClick={() => {
                    if (single) {
                      useEditorStore.getState().updateElementContent(single.id, {
                        text: (single.content.text || "").replace(/\b\w{8,}\b/g, "simple"),
                      });
                    }
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200"
                >
                  ✦ Simplify Vocabulary
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

      {/* 8. MORE ACTIONS DROPDOWN (⋯) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === "more" ? null : "more")}
          className={`p-1 rounded-lg text-slate-300 hover:text-white transition-all ${
            activeMenu === "more" ? "bg-white/15 text-white" : "hover:bg-white/10"
          }`}
          title="More actions"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {activeMenu === "more" && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#10141D] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-float-in text-[8pt]">
            {isMulti && (
              <>
                <button
                  onClick={() => {
                    groupSelectedElements();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5 text-slate-400" /> Group
                  </span>
                  <span className="text-[7pt] text-slate-500 font-mono">⌘G</span>
                </button>
                <button
                  onClick={() => {
                    groupAndLockSelectedElements();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 flex items-center justify-between font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Group & Lock
                  </span>
                  <span className="text-[7pt] text-amber-500/80 font-mono">⌘⇧L</span>
                </button>
              </>
            )}

            {single && Boolean(single.childElementIds?.length) && (
              <button
                onClick={() => {
                  ungroupSelectedElements();
                  setActiveMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <FolderMinus className="w-3.5 h-3.5 text-slate-400" /> Ungroup
                </span>
                <span className="text-[7pt] text-slate-500 font-mono">⇧⌘G</span>
              </button>
            )}

            {(isMulti || (single && (single.type === "group" || Boolean(single.childElementIds?.length)))) && (
              <button
                onClick={() => {
                  useUiStore.getState().setCreateLayoutModalOpen(true);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 flex items-center justify-between font-medium"
              >
                <span className="flex items-center gap-2">
                  <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" /> Create Layout
                </span>
                <span className="text-[7pt] text-amber-500/80 font-mono">Preset</span>
              </button>
            )}

            <button
              onClick={() => {
                if (single) {
                  updateElementTransform(single.id, {
                    x: Math.round((595.28 - single.transform.width) / 2),
                    y: Math.round((841.89 - single.transform.height) / 2),
                  });
                }
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center gap-2"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> Center on Canvas
            </button>

            <button
              onClick={() => {
                selectedElements.forEach((el) => {
                  useEditorStore.getState().updateElement(el.id, { locked: !allLocked });
                });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {allLocked ? (
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                {allLocked ? "Unlock" : "Lock"}
              </span>
              <span className="text-[7pt] text-slate-500 font-mono">⌘L</span>
            </button>

            {single && (
              <button
                onClick={() => {
                  const nextMode = single.layoutMode === "adaptive" ? "freeform" : "adaptive";
                  setElementLayoutMode(single.id, nextMode);
                  setActiveMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 flex items-center justify-between"
              >
                <span>Layout Mode:</span>
                <span className="text-indigo-400 font-mono uppercase text-[7pt]">
                  {single.layoutMode === "adaptive" ? "Adaptive" : "Freeform"}
                </span>
              </button>
            )}

            <div className="h-[1px] bg-white/10 my-1" />

            <button
              onClick={() => {
                deleteSelectedElements();
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
              </span>
              <span className="text-[7pt] text-rose-400/70 font-mono">Del</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
