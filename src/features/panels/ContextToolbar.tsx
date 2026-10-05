"use client";
import { referenceBannerFor } from '../../editor/educational/referenceBanners';

import React from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Lock,
  Unlock,
  Ruler,
  Combine,
  Square,
  Circle,
  Star,
  Minus,
  ArrowRight,
  Plus,
  Trash2,
  LayoutTemplate,
  Group,
  Ungroup,
} from "lucide-react";
import { setFrameworkMode } from "../../editor/curriculum/actions";
import { effectiveTextWrap } from "../../editor/layoutPartner/textWrapLayout";
import type { TextWrapMode } from "../../domain/creative/types";
import { beginBlockContentEditing } from "../../editor/educational/blockContentEditing";
import { GroupAutoLayoutControls } from "./GroupAutoLayoutControls";
import { isElementLocked } from "../../editor/core/elementGroups";
import { SelectionClipboardControls } from "./SelectionClipboardControls";

export const ContextToolbar: React.FC = () => {
  const {
    selectedElementIds,
    elements,
    updateElementTransform,
    updateElementStyle,
    updateTableStructure,
    performBooleanOperation,
    applyTextStyle,
    getActiveBook,
    smartStack,
    clipboardElements,
  } = useEditorStore();

  const {
    activeStudio,
    activeTool,
    activeShapeType,
    setActiveShapeType,
    activeMeasure,
    setGlyphBrowserOpen,
    editingTextElementId,
    setEditingTextElementId,
  } = useUiStore();

  const book = getActiveBook();
  const selectedElements = selectedElementIds.map((id) => elements[id]).filter(Boolean);
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;

  const currentStyle = singleElement?.style || {};
  const currentTransform = singleElement?.transform;

  return (
    <div className="h-12 shrink-0 w-full bg-white dark:bg-[#0e131f] border-b border-slate-200/90 dark:border-white/[0.08] px-3.5 flex items-center text-[13px] text-slate-700 dark:text-slate-300 z-20 select-none overflow-x-auto scrollbar-none font-sans">
      {selectedElements.length === 0 && clipboardElements.length === 0 && <span className="text-slate-500 dark:text-slate-400 text-xs">Select an object to edit its appearance. Double-click text to write. Shift-click to select multiple elements.</span>}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {(selectedElements.length > 0 || clipboardElements.length > 0) && <SelectionClipboardControls/>}
        {selectedElements.length > 0 && <div className="flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-3">
          {selectedElements.length > 1 && <button type="button" disabled={selectedElements.some(el => el.locked)} className="min-h-9 px-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40" title="Group without changing positions (⌘/Ctrl+G)" onClick={() => useEditorStore.getState().groupSelectedElements()}><Group size={15}/>Group</button>}
          {selectedElements.length > 1 && <button type="button" disabled={selectedElements.some(el => el.locked)} className="min-h-9 px-2 rounded-lg flex items-center gap-1.5 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-40 font-medium" title="Group and lock elements in one step (⌘/Ctrl+Shift+L)" onClick={() => useEditorStore.getState().groupAndLockSelectedElements()}><Lock size={15}/>Group & Lock</button>}
          {singleElement?.childElementIds?.length && <button type="button" disabled={singleElement.locked} className="min-h-9 px-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40" title="Ungroup (⌘/Ctrl+Shift+G)" onClick={() => useEditorStore.getState().ungroupSelectedElements()}><Ungroup size={15}/>Ungroup</button>}
          <button type="button" className="min-h-9 px-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10" title="Lock or unlock selection (⌘/Ctrl+L)" onClick={() => { const locked = selectedElements.every(el => el.locked); selectedElements.forEach(el => useEditorStore.getState().updateElement(el.id, { locked: !locked })); }}>
            {selectedElements.every(el => el.locked) ? <Unlock size={15}/> : <Lock size={15}/>}{selectedElements.every(el => el.locked) ? "Unlock" : "Lock"}
          </button>
        </div>}

        {singleElement?.type === "group" && <GroupAutoLayoutControls group={singleElement} />}
        {singleElement && ["heading", "subheading", "body", "body-text", "caption", "quote", "chapter-title", "lesson-title", "header", "footer", "pageNumber", "page-number", "sidebar", "callout"].includes(singleElement.type) &&
          <button type="button" className="publication-button min-h-9" disabled={isElementLocked(singleElement.id, elements)}
            onClick={() => setEditingTextElementId(singleElement.id)} title="Edit selected words inside this text box">Edit text</button>}

        {/* 0A. MULTIPLE ELEMENTS: SMART STACK & CREATE LAYOUT */}
        {selectedElements.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => smartStack(undefined, "vertical")}
              className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-lg text-[10.5px] font-medium flex items-center gap-1.5 shadow-[0_0_14px_rgba(99,102,241,0.35)] transition-all active:scale-95"
              title="Convert selected items into an auto-adjusting vertical stack"
            >
              <span>↕ Stack Vertically</span>
            </button>
            <button
              onClick={() => smartStack(undefined, "horizontal")}
              className="px-3 py-1 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 rounded-lg text-[10.5px] font-medium flex items-center gap-1.5 transition-all active:scale-95"
              title="Convert selected items into an auto-adjusting horizontal stack"
            >
              <span>↔ Stack Horizontally</span>
            </button>
            <button
              onClick={() => useUiStore.getState().setCreateLayoutModalOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 shadow-[0_0_14px_rgba(245,158,11,0.35)] transition-all active:scale-95"
              title="Save selection as a reusable custom layout in the Layout Library"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Create Layout from Selection</span>
            </button>
          </div>
        )}

        {/* 0B. SINGLE GROUP: CREATE LAYOUT FROM GROUP */}
        {singleElement && (singleElement.type === "group" || Boolean(singleElement.childElementIds?.length)) && (
          <button
            onClick={() => useUiStore.getState().setCreateLayoutModalOpen(true)}
            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 shadow-[0_0_14px_rgba(245,158,11,0.35)] transition-all active:scale-95"
            title="Convert this group into a reusable custom layout in the Layout Library"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Create Layout from Group</span>
          </button>
        )}

        {/* 1. SELECTION / TRANSFORM CONTROLS (When an element is selected) */}
        {singleElement && currentTransform && (
          <div className="flex items-center gap-2">
            {/* Position X & Y */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-slate-500">X:</span>
              <input
                type="number"
                value={Math.round(currentTransform.x)}
                aria-label="Element X (pt)"
                onChange={(e) => {
                  if (singleElement.smartBlockData?.curriculum?.chapterId && singleElement.smartBlockData.isLockedDesign) {
                    setFrameworkMode(singleElement.smartBlockData.curriculum.chapterId, "design");
                  }
                  updateElementTransform(singleElement.id, { x: parseFloat(e.target.value) || 0 }, true);
                }}
                className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500 ml-1">Y:</span>
              <input
                type="number"
                value={Math.round(currentTransform.y)}
                aria-label="Element Y (pt)"
                onChange={(e) => {
                  if (singleElement.smartBlockData?.curriculum?.chapterId && singleElement.smartBlockData.isLockedDesign) {
                    setFrameworkMode(singleElement.smartBlockData.curriculum.chapterId, "design");
                  }
                  updateElementTransform(singleElement.id, { y: parseFloat(e.target.value) || 0 }, true);
                }}
                className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none focus:border-indigo-500"
              />
            </div>

            {/* Width & Height */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-slate-500">W:</span>
              <input
                type="number"
                value={Math.round(currentTransform.width)}
                title="Block width"
                onChange={(e) => {
                  if (singleElement.smartBlockData?.curriculum?.chapterId && singleElement.smartBlockData.isLockedDesign) {
                    setFrameworkMode(singleElement.smartBlockData.curriculum.chapterId, "design");
                  }
                  updateElementTransform(
                    singleElement.id,
                    { width: Math.max(10, parseFloat(e.target.value) || 10) },
                    true
                  );
                }}
                className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500 ml-1">H:</span>
              <input
                type="number"
                value={Math.round(currentTransform.height)}
                title="Block height — fit text and inner content while keeping width fixed"
                onChange={(e) => {
                  if (singleElement.smartBlockData?.curriculum?.chapterId && singleElement.smartBlockData.isLockedDesign) {
                    setFrameworkMode(singleElement.smartBlockData.curriculum.chapterId, "design");
                  }
                  updateElementTransform(
                    singleElement.id,
                    { height: Math.max(10, parseFloat(e.target.value) || 10) },
                    true
                  );
                }}
                className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none focus:border-indigo-500"
              />
            </div>

            {/* Rotation */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-slate-500">∠:</span>
              <input
                type="number"
                value={Math.round(currentTransform.rotation || 0)}
                onChange={(e) => {
                  if (singleElement.smartBlockData?.curriculum?.chapterId && singleElement.smartBlockData.isLockedDesign) {
                    setFrameworkMode(singleElement.smartBlockData.curriculum.chapterId, "design");
                  }
                  updateElementTransform(
                    singleElement.id,
                    { rotation: parseFloat(e.target.value) || 0 },
                    true
                  );
                }}
                className="w-10 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-slate-200 text-[10px] outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500">°</span>
            </div>

            {/* Lock / Unlock */}
            <button
              onClick={() =>
                useEditorStore.getState().toggleLockElement(singleElement.id)
              }
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              title={singleElement.locked ? "Unlock Element" : "Lock Element"}
            >
              {singleElement.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* MULTI-SELECTION BOOLEAN OPERATIONS */}
        {selectedElements.length >= 2 && selectedElements.every(el => el.type === "shape" || el.type === "vector-curve") && (
          <div className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded">
            <span className="text-[10px] text-indigo-300 font-medium">
              {selectedElements.length} Shapes Selected
            </span>
            <div className="h-3 w-px bg-indigo-500/30 mx-1" />
            <button
              onClick={() => performBooleanOperation("union")}
              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium flex items-center gap-1 shadow-sm"
              title="Union Shapes (Compound Path)"
            >
              <Combine className="w-3 h-3" />
              <span>Union</span>
            </button>
            <button
              onClick={() => performBooleanOperation("subtract")}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-medium"
              title="Subtract Shapes"
            >
              Subtract
            </button>
            <button
              onClick={() => performBooleanOperation("intersect")}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-medium"
              title="Intersect Shapes"
            >
              Intersect
            </button>
          </div>
        )}

        {/* 2. TYPOGRAPHY CONTROLS (When a text element is selected or FrameText tool active) */}
        {!editingTextElementId && (activeTool === "frameText" ||
          (singleElement &&
            ["heading", "subheading", "body", "caption", "quote"].includes(singleElement.type))) && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            {/* Paragraph Style Selector */}
            {book?.textStyles && (
              <select
                value={currentStyle.styleId || ""}
                onChange={(e) => {
                  if (singleElement && e.target.value) {
                    applyTextStyle(singleElement.id, e.target.value);
                  }
                }}
                className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[11px] text-slate-200 outline-none hover:border-white/20 focus:border-indigo-500 max-w-[130px] truncate"
              >
                <option value="">Styles...</option>
                {book.textStyles.map((ts) => (
                  <option key={ts.id} value={ts.id}>
                    {ts.name}
                  </option>
                ))}
              </select>
            )}

            {/* Font Family */}
            <select
              value={currentStyle.fontFamily || "Inter, sans-serif"}
              onChange={(e) => {
                if (singleElement) updateElementStyle(singleElement.id, { fontFamily: e.target.value });
              }}
              className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[11px] text-slate-200 outline-none hover:border-white/20 focus:border-indigo-500 max-w-[110px] truncate"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Outfit, sans-serif">Outfit (Display)</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Merriweather, serif">Merriweather (Serif)</option>
              <option value="JetBrains Mono, monospace">JetBrains Mono</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={currentStyle.fontSize || 10.5}
                onChange={(e) => {
                  if (singleElement)
                    updateElementStyle(singleElement.id, { fontSize: parseFloat(e.target.value) || 10 });
                }}
                className="w-11 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-slate-200 text-center outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500">pt</span>
            </div>

            {/* Font Weight */}
            <select
              value={currentStyle.fontWeight || 400}
              onChange={(e) => {
                if (singleElement)
                  updateElementStyle(singleElement.id, {
                    fontWeight: parseInt(e.target.value) as 400 | 500 | 600 | 700 | 800,
                  });
              }}
              className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-slate-200 outline-none"
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">ExtraBold</option>
            </select>

            {/* Alignment Buttons */}
            <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10">
              <button
                onClick={() => singleElement && updateElementStyle(singleElement.id, { textAlign: "left" })}
                className={`p-1 rounded ${
                  currentStyle.textAlign === "left" || !currentStyle.textAlign
                    ? "bg-white/20 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => singleElement && updateElementStyle(singleElement.id, { textAlign: "center" })}
                className={`p-1 rounded ${
                  currentStyle.textAlign === "center" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                onClick={() => singleElement && updateElementStyle(singleElement.id, { textAlign: "right" })}
                className={`p-1 rounded ${
                  currentStyle.textAlign === "right" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => singleElement && updateElementStyle(singleElement.id, { textAlign: "justify" })}
                className={`p-1 rounded ${
                  currentStyle.textAlign === "justify" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Justify Text"
              >
                <AlignJustify className="w-3 h-3" />
              </button>
            </div>

            {/* Multi-Column Stepper */}
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Cols:</span>
              <select
                value={currentStyle.columns || 1}
                onChange={(e) => {
                  if (singleElement)
                    updateElementStyle(singleElement.id, {
                      columns: parseInt(e.target.value),
                      columnGap: 14,
                    });
                }}
                className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-slate-200 outline-none"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            {/* Glyph Browser Trigger */}
            <button
              onClick={() => setGlyphBrowserOpen(true)}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 font-mono text-[11px]"
              title="Open Glyph & Scientific Symbol Browser"
            >
              Ω Glyphs
            </button>
          </div>
        )}

        {/* 3. VECTOR SHAPES CONTROLS */}
        {(activeTool === "shape" ||
          (singleElement && singleElement.type === "shape")) && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            {/* Shape Subtype Selector */}
            <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10">
              {(
                [
                  { id: "rectangle", icon: Square },
                  { id: "circle", icon: Circle },
                  { id: "star", icon: Star },
                  { id: "line", icon: Minus },
                  { id: "arrow", icon: ArrowRight },
                ] as const
              ).map((sh) => {
                const Icon = sh.icon;
                const isCur =
                  (singleElement?.style?.shapeType || activeShapeType) === sh.id;
                return (
                  <button
                    key={sh.id}
                    onClick={() => {
                      setActiveShapeType(sh.id);
                      if (singleElement) {
                        updateElementStyle(singleElement.id, {
                          shapeType: sh.id,
                          borderRadius: sh.id === "circle" ? 9999 : sh.id === "rectangle" ? 6 : 0,
                        });
                      }
                    }}
                    className={`p-1 rounded transition-colors ${
                      isCur ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                    title={sh.id}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {/* Fill Color Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Fill:</span>
              <input
                type="color"
                value={currentStyle.backgroundColor?.startsWith("#") ? currentStyle.backgroundColor : "#e0e7ff"}
                onChange={(e) => {
                  if (singleElement) updateElementStyle(singleElement.id, { backgroundColor: e.target.value });
                }}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                title="Fill Color"
              />
            </div>

            {/* Stroke Color & Width */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Stroke:</span>
              <input
                type="color"
                value={currentStyle.borderColor?.startsWith("#") ? currentStyle.borderColor : "#4338ca"}
                onChange={(e) => {
                  if (singleElement) updateElementStyle(singleElement.id, { borderColor: e.target.value });
                }}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                title="Stroke Color"
              />
              <input
                type="number"
                min="0"
                max="24"
                value={currentStyle.borderWidth || 2}
                onChange={(e) => {
                  if (singleElement)
                    updateElementStyle(singleElement.id, { borderWidth: parseFloat(e.target.value) || 0 });
                }}
                className="w-10 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] text-slate-200 text-center outline-none"
                title="Stroke Width (pt)"
              />
            </div>
          </div>
        )}

        {/* 4. TABLE CONTROLS */}
        {(activeTool === "table" || (singleElement && singleElement.type === "table")) && singleElement && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <span className="text-[10px] text-slate-400 font-medium">Table Tools:</span>
            <button
              onClick={() => updateTableStructure(singleElement.id, "addRow")}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>Row</span>
            </button>
            <button
              onClick={() => updateTableStructure(singleElement.id, "deleteRow")}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-rose-300 text-[10px]"
              title="Delete Last Row"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateTableStructure(singleElement.id, "addCol")}
              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>Col</span>
            </button>
            <button
              onClick={() => updateTableStructure(singleElement.id, "deleteCol")}
              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-rose-300 text-[10px]"
              title="Delete Last Column"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 4B. SMART EDUCATIONAL BLOCK CONTROLS */}
        {singleElement && singleElement.type === "smart-block" && singleElement.smartBlockData && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10 text-xs">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
              {singleElement.smartBlockData.archetypeId}
            </span>

            <select
              value={singleElement.smartBlockData.subject}
              hidden={Boolean(referenceBannerFor(singleElement.smartBlockData.presetId))}
              onChange={(e) =>
                useEditorStore.getState().reSkinEducationalBlock(singleElement.id, e.target.value as NonNullable<typeof singleElement.smartBlockData>["subject"])
              }
              className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[11px] text-slate-200 outline-none cursor-pointer"
            >
              <option value="mathematics">Math (Indigo)</option>
              <option value="science">Science (Emerald)</option>
              <option value="english">English (Burgundy)</option>
              <option value="social-studies">Social (Amber)</option>
              <option value="environmental">EVS (Green)</option>
              <option value="early-learning">Early Learning</option>
              <option value="computer-science">CS (Cyan)</option>
              <option value="general">General</option>
            </select>

            <button
              onClick={() => useEditorStore.getState().shuffleEducationalBlockStyle(singleElement.id)}
              disabled={singleElement.locked || singleElement.smartBlockData.isLockedDesign}
              className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title={referenceBannerFor(singleElement.smartBlockData.presetId) ? 'Shuffle banner colours' : 'Shuffle visual variant while preserving 100% of curriculum content'}
            >
              <span>{referenceBannerFor(singleElement.smartBlockData.presetId) ? 'Shuffle colours' : '🔀 Shuffle Style'}</span>
            </button>

            <button
              disabled={singleElement.locked || singleElement.smartBlockData?.styleOverrides.contentLayout?.enabled}
              onClick={() => beginBlockContentEditing(singleElement.id)}
              className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10.5px] font-medium transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Move and edit text and images inside the block"
            >
              {singleElement.smartBlockData?.styleOverrides.contentLayout?.enabled ? "Contents editable" : "Edit block contents"}
            </button>
          </div>
        )}

        {/* 5. MEASUREMENT LIVE READOUT */}
        {activeTool === "measure" && (
          <div className="flex items-center gap-3 pl-1 border-l border-white/10 font-mono text-[11px] text-amber-300">
            <div className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              <span>
                Distance: {activeMeasure ? `${activeMeasure.distancePt} pt (${activeMeasure.distanceMm} mm)` : "Click & drag on page to measure"}
              </span>
            </div>
            {activeMeasure && (
              <>
                <span>∠ {activeMeasure.angleDeg}°</span>
                <span>ΔX: {activeMeasure.dxPt} pt</span>
                <span>ΔY: {activeMeasure.dyPt} pt</span>
              </>
            )}
          </div>
        )}

        {singleElement && (() => {
          const wrap = effectiveTextWrap(singleElement)!;
          return <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10 text-[11px]">
            <label className="flex items-center gap-1.5">Text wrap
              <select aria-label="Object text wrap" disabled={singleElement.locked} value={wrap.mode}
                onChange={e => useEditorStore.getState().updateElement(singleElement.id, { textWrap: { ...wrap, mode: e.target.value as TextWrapMode } })}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded px-1.5 py-1">
                <option value="square">Both sides</option><option value="tight">Tight</option><option value="contour">Contour</option>
                <option value="largest-side">Largest side</option><option value="top-bottom">Above & below</option><option value="none">No wrap</option>
                {["box", "through", "inline", "floating"].includes(wrap.mode) && <option value={wrap.mode}>{wrap.mode}</option>}
              </select>
            </label>
            <label className="flex items-center gap-1">Gap
              <input aria-label="Object wrap gap in points" type="number" min={0} max={72} step={1} disabled={singleElement.locked}
                value={wrap.offsetPt ?? wrap.wrapMarginPt ?? 8} onChange={e => {
                  const value = Number(e.target.value); if (!Number.isFinite(value)) return;
                  const gap = Math.max(0, Math.min(72, value));
                  useEditorStore.getState().updateElement(singleElement.id, { textWrap: { ...wrap, offsetPt: gap,
                    topOffsetPt: gap, rightOffsetPt: gap, bottomOffsetPt: gap, leftOffsetPt: gap } });
                }} className="w-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded px-1 py-1" />pt
            </label>
          </div>;
        })()}

        {/* 6. PIXEL / IMAGE ADJUSTMENTS */}
        {singleElement && singleElement.type === "image" && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10 text-[11px]">
            <span className="text-[10px] text-slate-400">Filters:</span>
            {/* Brightness */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Bri:</span>
              <input
                type="range"
                min="50"
                max="150"
                value={currentStyle.brightness ?? 100}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, { brightness: parseInt(e.target.value) })
                }
                className="w-14 accent-rose-500"
              />
            </div>
            {/* Contrast */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Con:</span>
              <input
                type="range"
                min="50"
                max="150"
                value={currentStyle.contrast ?? 100}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, { contrast: parseInt(e.target.value) })
                }
                className="w-14 accent-rose-500"
              />
            </div>
            <button
              type="button"
              onClick={() => useEditorStore.getState().removeImageBackground(singleElement.id)}
              className="px-2 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-100 border border-rose-500/40 rounded text-[10px] font-medium"
            >
              Remove background
            </button>
            {singleElement.content.rawWidthPx && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                {Math.round(singleElement.content.rawWidthPx / (singleElement.transform.width / 72))} DPI
              </span>
            )}
          </div>
        )}

        {/* 7. VECTOR STUDIO SPECIALIZED BAR */}
        {activeStudio === "VECTOR" && singleElement && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10 text-[11px]">
            {singleElement.type === "shape" && (
              <button
                onClick={() => useEditorStore.getState().convertToCurves(singleElement.id)}
                className="px-2 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded text-[10px] font-medium"
              >
                Convert to Curves
              </button>
            )}
            {singleElement.type === "image" && (
              <button
                onClick={() => useEditorStore.getState().traceElementImage(singleElement.id)}
                className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded text-[10px] font-medium"
              >
                Trace Vector Paths
              </button>
            )}
          </div>
        )}

        {/* 8. PIXEL STUDIO SPECIALIZED BAR */}
        {activeStudio === "PIXEL" && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10 text-[11px]">
            <span className="text-[10px] text-slate-400 font-mono">Brush:</span>
            <input
              type="range"
              min="2"
              max="100"
              value={useUiStore.getState().brushSettings.size}
              onChange={(e) =>
                useUiStore.getState().setBrushSettings({ size: Number(e.target.value) })
              }
              className="w-14 accent-rose-500"
              title="Brush Size"
            />
            <span className="text-[10px] font-mono text-slate-300">
              {useUiStore.getState().brushSettings.size}px
            </span>

            {singleElement && singleElement.type === "image" && (
              <button
                onClick={() => useEditorStore.getState().removeImageBackground(singleElement.id)}
                className="px-2 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded text-[10px] font-medium"
              >
                Remove BG Mask
              </button>
            )}
          </div>
        )}

        {/* 9. AI STUDIO SPECIALIZED BAR */}
        {activeStudio === "AI" && (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10 text-[11px]">
            <button
              onClick={() => {
                useUiStore.getState().setAiActiveTab("generate");
                useUiStore.getState().setAiModalOpen(true);
              }}
              className="px-2.5 py-0.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold rounded text-[10px] shadow"
            >
              ✨ Generate AI Artwork...
            </button>
            <button
              onClick={() => {
                useUiStore.getState().setAiActiveTab("vector");
                useUiStore.getState().setAiModalOpen(true);
              }}
              className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded text-[10px]"
            >
              Generate Vector SVG
            </button>
            {singleElement && singleElement.type === "image" && (
              <button
                onClick={() => useEditorStore.getState().expandImageToFrame(singleElement.id)}
                className="px-2 py-0.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded text-[10px]"
              >
                Generative Expand
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
