"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  ChevronRight,
  Palette,
  Sparkles,
  Sliders,
  Paintbrush,
  Copy,
  ClipboardPaste,
  RotateCcw,
  Eraser,
  Layers,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCw,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Plus,
  Trash2,
  Highlighter,
  List,
  ListOrdered,
  Indent,
  Outdent,
} from "lucide-react";
import { PageElement, ElementStyle } from "../../domain/element/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { PropertyScrubber } from "../ui/PropertyScrubber";
import { ColorPickerPopover } from "../ui/ColorPickerPopover";
import { FontSelectorPopover } from "../ui/FontSelectorPopover";
import {
  FONT_WEIGHTS,
  FONT_PRESET_SIZES,
  LINE_HEIGHT_PRESETS,
  LETTER_SPACING_PRESETS,
  TEXT_SHADOW_PRESETS,
  TYPOGRAPHY_PRESETS,
  recommendLineHeight,
  checkPrintReadabilityWarning,
  toSentenceCase,
  toTitleCase,
  toCapitalizeWords,
} from "../../editor/design/typographyCatalog";

interface TypographyInspectorProps {
  selectedElements: PageElement[];
}

const STORAGE_KEY = "nexmaxx_typography_sections_state";

export const TypographyInspector: React.FC<TypographyInspectorProps> = ({
  selectedElements,
}) => {
  const {
    updateElementStyle,
    batchUpdateElementStyle,
    updateElementTransform,
    getActiveBook,
    applyTextStyle,
    createTextStyleFromElement,
    updateTextStyle,
    deleteTextStyle,
    detachTextStyle,
    resetTextStyleOverrides,
    copyTextStyle,
    pasteTextStyle,
    clearTextFormatting,
  } = useEditorStore();

  const {
    formatPainterStyle,
    isPersistentPainter,
    setFormatPainter,
    showToast,
  } = useUiStore();

  const book = getActiveBook();
  const isMulti = selectedElements.length > 1;
  const primaryEl = selectedElements[0];

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      typography: true,
      character: false,
      paragraph: true,
      appearance: true,
      effects: false,
      layout: false,
      styles: false,
    };
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Active popovers in inspector
  const [activePopover, setActivePopover] = useState<
    "font" | "color" | "strokeColor" | "shadowColor" | "highlightColor" | null
  >(null);

  // New Style Prompt State
  const [showNewStyleInput, setShowNewStyleInput] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");

  // Extract shared values or detect "Mixed"
  const getCommonValue = <K extends keyof ElementStyle>(
    key: K,
    defaultValue: ElementStyle[K]
  ): { value: ElementStyle[K]; isMixed: boolean } => {
    if (selectedElements.length === 0) return { value: defaultValue, isMixed: false };
    const firstVal = selectedElements[0].style[key];
    const isMixed = selectedElements.some((el) => el.style[key] !== firstVal);
    return {
      value: isMixed ? defaultValue : firstVal ?? defaultValue,
      isMixed,
    };
  };

  const fontFamily = getCommonValue("fontFamily", "Inter");
  const fontSize = getCommonValue("fontSize", 11);
  const fontWeight = getCommonValue("fontWeight", 400);
  const fontStyle = getCommonValue("fontStyle", "normal");
  const lineHeight = getCommonValue("lineHeight", 1.4);
  const letterSpacing = getCommonValue("letterSpacing", 0);
  const wordSpacing = getCommonValue("wordSpacing", 0);
  const textAlign = getCommonValue("textAlign", "left");
  const verticalAlign = getCommonValue("verticalAlign", "middle");
  const color = getCommonValue("color", "#0f172a");
  const opacity = getCommonValue("opacity", 1);
  const paragraphSpacing = getCommonValue("paragraphSpacing", 8);
  const paragraphSpacingBefore = getCommonValue("paragraphSpacingBefore", 0);

  // Apply updates to single or all selected elements
  const handleApplyStyle = (
    styleUpdates: Partial<ElementStyle>,
    recordHistory = true
  ) => {
    if (isMulti) {
      batchUpdateElementStyle(
        selectedElements.map((el) => el.id),
        styleUpdates
      );
    } else if (primaryEl) {
      updateElementStyle(primaryEl.id, styleUpdates, recordHistory);
    }
  };

  // Readability Warning
  const readabilityWarning = useMemo(() => {
    const size = fontSize.value as number;
    return checkPrintReadabilityWarning(size);
  }, [fontSize.value]);

  // Recommended Line Height
  const recommendedLH = useMemo(() => {
    const size = fontSize.value as number;
    return recommendLineHeight(size);
  }, [fontSize.value]);

  // Format Painter Toggle
  const handleToggleFormatPainter = (persistent: boolean = false) => {
    if (!primaryEl) return;
    if (formatPainterStyle) {
      setFormatPainter(null);
      showToast({ type: "info", title: "Format Painter deactivated" });
    } else {
      setFormatPainter(primaryEl.style, persistent);
      showToast({
        type: "success",
        title: persistent ? "Format Painter (Persistent)" : "Format Painter active",
        message: "Click any text element to paste typography styling.",
      });
    }
  };

  // Quick Font Size Delta with Shift Modifier
  const handleQuickSizeDelta = (delta: number, e: React.MouseEvent) => {
    const multiplier = e.shiftKey ? 4 : 1;
    const current = (fontSize.value as number) || 11;
    const next = Math.max(6, current + delta * multiplier);
    handleApplyStyle({ fontSize: next });
  };

  return (
    <div className="space-y-2 select-none text-slate-700 dark:text-slate-300 font-sans text-xs">
      {/* Header with Title & Quick Action Buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
          <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {isMulti ? `Typography (${selectedElements.length} Selected)` : "Typography Engine"}
          </span>
        </div>

        {/* Global Toolbar: Format Painter, Copy Style, Paste Style, Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleToggleFormatPainter(false)}
            onDoubleClick={() => handleToggleFormatPainter(true)}
            className={`p-1 rounded-md transition-colors ${
              formatPainterStyle
                ? "bg-indigo-600 text-white shadow-xs"
                : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Format Painter (Click once for single apply, double-click for persistent)"
          >
            <Paintbrush className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => copyTextStyle()}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Copy Text Style (Cmd+Opt+C)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => pasteTextStyle()}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Paste Text Style (Cmd+Opt+V)"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => clearTextFormatting()}
            className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            title="Clear All Custom Formatting"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Minimum Print Readability Warning (Requirement 39) */}
      {readabilityWarning && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[10px] animate-in fade-in">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="flex-1 font-medium">{readabilityWarning}</span>
          <button
            type="button"
            onClick={() => handleApplyStyle({ fontSize: 8.5 })}
            className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-[9px] flex-shrink-0 shadow-xs"
          >
            Fix to 8.5pt
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TYPOGRAPHY CORE */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("typography")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <Type className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Typography
          </span>
          {openSections.typography ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.typography && (
          <div className="p-3 space-y-3">
            {/* Font Family Selector */}
            <div>
              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                <span>Font Family</span>
                {fontFamily.isMixed && <span className="text-amber-600 dark:text-amber-400 italic">Mixed</span>}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActivePopover(activePopover === "font" ? null : "font")
                  }
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 hover:border-indigo-500 text-left text-xs transition-colors shadow-xs"
                >
                  <span
                    className="truncate font-medium text-slate-900 dark:text-white"
                    style={{ fontFamily: String(fontFamily.value) }}
                  >
                    {fontFamily.isMixed ? "Mixed Fonts" : String(fontFamily.value)}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0 ml-1 text-slate-600 dark:text-slate-400" />
                </button>

                {activePopover === "font" && (
                  <div className="absolute left-0 top-full mt-1 z-[110]">
                    <FontSelectorPopover
                      currentFont={String(fontFamily.value)}
                      onSelect={(font) => {
                        handleApplyStyle({ fontFamily: font });
                        setActivePopover(null);
                      }}
                      onPreview={(previewFont) => {
                        if (previewFont && primaryEl) {
                          handleApplyStyle({ fontFamily: previewFont }, false);
                        } else if (primaryEl) {
                          handleApplyStyle({ fontFamily: String(fontFamily.value) }, false);
                        }
                      }}
                      onClose={() => setActivePopover(null)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Font Weight & Style */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">
                  Font Weight
                </label>
                <select
                  value={fontWeight.isMixed ? "" : Number(fontWeight.value)}
                  onChange={(e) =>
                    handleApplyStyle({ fontWeight: Number(e.target.value) })
                  }
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-xs"
                >
                  {fontWeight.isMixed && <option value="">Mixed</option>}
                  {FONT_WEIGHTS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">
                  Font Style
                </label>
                <select
                  value={fontStyle.isMixed ? "" : String(fontStyle.value)}
                  onChange={(e) =>
                    handleApplyStyle({
                      fontStyle: e.target.value as "normal" | "italic" | "oblique",
                    })
                  }
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-xs"
                >
                  {fontStyle.isMixed && <option value="">Mixed</option>}
                  <option value="normal">Regular</option>
                  <option value="italic">Italic</option>
                  <option value="oblique">Oblique</option>
                </select>
              </div>
            </div>

            {/* Font Size with Horizontal Scrub & Preset Dropdown & Quick - A + */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                  Font Size (pt)
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => handleQuickSizeDelta(-1, e)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-mono text-[10px] font-bold transition-colors"
                    title="Quick Decrease (Shift for ±4pt)"
                  >
                    −
                  </button>
                  <span className="font-mono text-[9px] text-indigo-600 dark:text-indigo-400 font-bold px-0.5">
                    A
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleQuickSizeDelta(1, e)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-mono text-[10px] font-bold transition-colors"
                    title="Quick Increase (Shift for ±4pt)"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 items-center">
                <div className="col-span-2">
                  <PropertyScrubber
                    label="Size"
                    value={Number(fontSize.value) || 11}
                    min={4}
                    max={300}
                    step={0.5}
                    decimals={1}
                    unit="pt"
                    onChange={(val, isFinal) =>
                      handleApplyStyle({ fontSize: val }, isFinal)
                    }
                  />
                </div>
                <select
                  value={Number(fontSize.value) || 11}
                  onChange={(e) =>
                    handleApplyStyle({ fontSize: Number(e.target.value) })
                  }
                  className="bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-1.5 py-1 text-xs text-slate-900 dark:text-white outline-none font-mono shadow-xs"
                >
                  {FONT_PRESET_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} pt
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick B / I / U / S Toolbar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">Format</span>
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-black/40 p-0.5 rounded-lg border border-slate-300/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      fontWeight: Number(fontWeight.value) >= 600 ? 400 : 700,
                    })
                  }
                  className={`p-1.5 rounded transition-colors ${
                    Number(fontWeight.value) >= 600
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                  }`}
                  title="Bold (Cmd+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      fontStyle: fontStyle.value === "italic" ? "normal" : "italic",
                    })
                  }
                  className={`p-1.5 rounded transition-colors ${
                    fontStyle.value === "italic"
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                  }`}
                  title="Italic (Cmd+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      textDecoration:
                        primaryEl?.style.textDecoration === "underline"
                          ? "none"
                          : "underline",
                    })
                  }
                  className={`p-1.5 rounded transition-colors ${
                    primaryEl?.style.textDecoration === "underline"
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                  }`}
                  title="Underline (Cmd+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      textDecoration:
                        primaryEl?.style.textDecoration === "line-through"
                          ? "none"
                          : "line-through",
                    })
                  }
                  className={`p-1.5 rounded transition-colors ${
                    primaryEl?.style.textDecoration === "line-through"
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. CHARACTER SPACING & CASE */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("character")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <Sliders className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Character & Spacing
          </span>
          {openSections.character ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.character && (
          <div className="p-3 space-y-3">
            {/* Tracking (Letter Spacing) & Word Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <PropertyScrubber
                label="Tracking"
                value={Number(letterSpacing.value) || 0}
                min={-10}
                max={50}
                step={0.5}
                decimals={1}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle({ letterSpacing: val }, isFinal)
                }
              />
              <PropertyScrubber
                label="Word Space"
                value={Number(wordSpacing.value) || 0}
                min={-5}
                max={40}
                step={0.5}
                decimals={1}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle({ wordSpacing: val }, isFinal)
                }
              />
            </div>

            {/* Tracking Quick Presets */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">Tracking Presets</span>
              <div className="flex gap-1">
                {[-1, 0, 1, 2, 4].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleApplyStyle({ letterSpacing: v })}
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      letterSpacing.value === v
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "bg-slate-200/80 hover:bg-slate-300/80 dark:bg-black/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                    }`}
                  >
                    {v > 0 ? `+${v}` : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Case Transformation Buttons */}
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1">
                Text Case
              </span>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleApplyStyle({ textTransform: "uppercase" })}
                  className={`py-1 rounded transition-colors ${
                    primaryEl?.style.textTransform === "uppercase"
                      ? "border border-indigo-500 bg-white dark:bg-black/60 text-indigo-700 dark:text-white font-semibold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 dark:bg-black/40 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  UPPERCASE
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyStyle({ textTransform: "lowercase" })}
                  className={`py-1 rounded transition-colors ${
                    primaryEl?.style.textTransform === "lowercase"
                      ? "border border-indigo-500 bg-white dark:bg-black/60 text-indigo-700 dark:text-white font-semibold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 dark:bg-black/40 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  lowercase
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyStyle({ textTransform: "capitalize" })}
                  className={`py-1 rounded transition-colors ${
                    primaryEl?.style.textTransform === "capitalize"
                      ? "border border-indigo-500 bg-white dark:bg-black/60 text-indigo-700 dark:text-white font-semibold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 dark:bg-black/40 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Capitalize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. PARAGRAPH & ALIGNMENT */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("paragraph")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <AlignLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Paragraph & Alignment
          </span>
          {openSections.paragraph ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.paragraph && (
          <div className="p-3 space-y-3">
            {/* Horizontal Alignment */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">Horizontal</span>
              <div className="flex bg-slate-200/70 dark:bg-black/40 rounded-lg p-0.5 border border-slate-300/80 dark:border-white/10">
                {(["left", "center", "right", "justify"] as const).map((al) => (
                  <button
                    key={al}
                    type="button"
                    onClick={() => handleApplyStyle({ textAlign: al })}
                    className={`p-1.5 rounded transition-colors ${
                      textAlign.value === al
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                    }`}
                    title={`Align ${al}`}
                  >
                    {al === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                    {al === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                    {al === "right" && <AlignRight className="w-3.5 h-3.5" />}
                    {al === "justify" && <AlignJustify className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Alignment inside Box */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">Vertical</span>
              <div className="flex bg-slate-200/70 dark:bg-black/40 rounded-lg p-0.5 border border-slate-300/80 dark:border-white/10 text-[10px]">
                {(["top", "middle", "bottom"] as const).map((va) => (
                  <button
                    key={va}
                    type="button"
                    onClick={() => handleApplyStyle({ verticalAlign: va })}
                    className={`px-2 py-1 rounded transition-colors capitalize ${
                      verticalAlign.value === va
                        ? "bg-indigo-600 text-white font-medium shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10"
                    }`}
                  >
                    {va}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height Scrubber + Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">Line Height</span>
                {recommendedLH !== lineHeight.value && (
                  <button
                    type="button"
                    onClick={() => handleApplyStyle({ lineHeight: recommendedLH })}
                    className="text-[9px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-mono flex items-center gap-0.5 font-medium"
                    title={`Optimize line height for ${fontSize.value}pt typography`}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Auto ({recommendedLH})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 items-center">
                <div className="col-span-2">
                  <PropertyScrubber
                    label="Leading"
                    value={Number(lineHeight.value) || 1.4}
                    min={0.8}
                    max={4}
                    step={0.05}
                    decimals={2}
                    onChange={(val, isFinal) =>
                      handleApplyStyle({ lineHeight: val }, isFinal)
                    }
                  />
                </div>
                <select
                  value={Number(lineHeight.value) || 1.4}
                  onChange={(e) =>
                    handleApplyStyle({ lineHeight: Number(e.target.value) })
                  }
                  className="bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-1 py-1 text-xs text-slate-900 dark:text-white outline-none font-mono shadow-xs"
                >
                  {LINE_HEIGHT_PRESETS.map((lh) => (
                    <option key={lh.value} value={lh.value}>
                      {lh.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paragraph Spacing (Before and After) */}
            <div className="grid grid-cols-2 gap-2">
              <PropertyScrubber
                label="Space Before"
                value={Number(paragraphSpacingBefore.value) || 0}
                min={0}
                max={100}
                step={1}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle({ paragraphSpacingBefore: val }, isFinal)
                }
              />
              <PropertyScrubber
                label="Space After"
                value={Number(paragraphSpacing.value) || 8}
                min={0}
                max={100}
                step={1}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle({ paragraphSpacing: val }, isFinal)
                }
              />
            </div>

            {/* Indentation (First line, Left, Right) */}
            <div className="grid grid-cols-2 gap-2">
              <PropertyScrubber
                label="First Indent"
                value={primaryEl?.style.textIndent?.firstLine || 0}
                min={-50}
                max={100}
                step={2}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle(
                    {
                      textIndent: {
                        ...primaryEl?.style.textIndent,
                        firstLine: val,
                      },
                    },
                    isFinal
                  )
                }
              />
              <PropertyScrubber
                label="Left Margin"
                value={primaryEl?.style.textIndent?.left || 0}
                min={0}
                max={150}
                step={2}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle(
                    {
                      textIndent: {
                        ...primaryEl?.style.textIndent,
                        left: val,
                      },
                    },
                    isFinal
                  )
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. APPEARANCE & COLORS */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("appearance")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <Palette className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Color, Fill & Outline
          </span>
          {openSections.appearance ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.appearance && (
          <div className="p-3 space-y-3">
            {/* Solid Text Fill Color */}
            <div>
              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                <span>Text Fill</span>
                <span className="text-slate-800 dark:text-white font-mono">{String(color.value)}</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActivePopover(activePopover === "color" ? null : "color")
                  }
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 hover:border-indigo-500 text-left text-xs transition-colors shadow-xs"
                >
                  <div
                    className="w-5 h-5 rounded-md border border-slate-300 dark:border-white/30 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: String(color.value) }}
                  />
                  <span className="font-mono text-slate-800 dark:text-white flex-1">{String(color.value)}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 text-slate-600 dark:text-slate-400" />
                </button>

                {activePopover === "color" && (
                  <div className="absolute left-0 top-full mt-1 z-[110]">
                    <ColorPickerPopover
                      color={String(color.value)}
                      onChange={(c) => handleApplyStyle({ color: c })}
                      onClose={() => setActivePopover(null)}
                      label="Solid Fill Color"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Text Stroke / Outline */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                  Text Outline / Stroke
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      textStroke: primaryEl?.style.textStroke
                        ? undefined
                        : { color: "#1e293b", width: 1 },
                    })
                  }
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    primaryEl?.style.textStroke
                      ? "bg-rose-600 text-white font-medium shadow-xs"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {primaryEl?.style.textStroke ? "Enabled" : "+ Add Stroke"}
                </button>
              </div>

              {primaryEl?.style.textStroke && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePopover(
                          activePopover === "strokeColor" ? null : "strokeColor"
                        )
                      }
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 text-xs text-left shadow-xs"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-white/30"
                        style={{ backgroundColor: primaryEl.style.textStroke.color }}
                      />
                      <span className="font-mono text-[10px] truncate text-slate-800 dark:text-white">
                        {primaryEl.style.textStroke.color}
                      </span>
                    </button>

                    {activePopover === "strokeColor" && (
                      <div className="absolute left-0 top-full mt-1 z-[110]">
                        <ColorPickerPopover
                          color={primaryEl.style.textStroke.color}
                          onChange={(c) =>
                            handleApplyStyle({
                              textStroke: {
                                ...primaryEl.style.textStroke!,
                                color: c,
                              },
                            })
                          }
                          onClose={() => setActivePopover(null)}
                          label="Stroke Color"
                        />
                      </div>
                    )}
                  </div>

                  <PropertyScrubber
                    label="Width"
                    value={primaryEl.style.textStroke.width || 1}
                    min={0.25}
                    max={12}
                    step={0.25}
                    decimals={2}
                    unit="pt"
                    onChange={(val, isFinal) =>
                      handleApplyStyle(
                        {
                          textStroke: {
                            ...primaryEl.style.textStroke!,
                            width: val,
                          },
                        },
                        isFinal
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* Gradient Fill Toggle & Editor */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                  Text Gradient
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      textGradient: primaryEl?.style.textGradient?.enabled
                        ? undefined
                        : {
                            enabled: true,
                            type: "linear",
                            angle: 90,
                            stops: [
                              { offset: 0, color: "#4f46e5" },
                              { offset: 1, color: "#ec4899" },
                            ],
                          },
                    })
                  }
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    primaryEl?.style.textGradient?.enabled
                      ? "bg-indigo-600 text-white font-medium shadow-xs"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {primaryEl?.style.textGradient?.enabled ? "Active" : "+ Add Gradient"}
                </button>
              </div>

              {primaryEl?.style.textGradient?.enabled && (
                <div className="space-y-2 mt-2 bg-slate-100 dark:bg-black/30 p-2 rounded-lg border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">Angle</span>
                    <div className="w-24">
                      <PropertyScrubber
                        label="Deg"
                        value={primaryEl.style.textGradient.angle || 90}
                        min={0}
                        max={360}
                        step={15}
                        unit="°"
                        onChange={(val, isFinal) =>
                          handleApplyStyle(
                            {
                              textGradient: {
                                ...primaryEl.style.textGradient!,
                                angle: val,
                              },
                            },
                            isFinal
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Quick Gradient Presets */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { name: "Sunset", stops: [{ offset: 0, color: "#f97316" }, { offset: 1, color: "#db2777" }] },
                      { name: "Ocean", stops: [{ offset: 0, color: "#06b6d4" }, { offset: 1, color: "#3b82f6" }] },
                      { name: "Royal", stops: [{ offset: 0, color: "#8b5cf6" }, { offset: 1, color: "#ec4899" }] },
                      { name: "Emerald", stops: [{ offset: 0, color: "#10b981" }, { offset: 1, color: "#047857" }] },
                    ].map((gp) => (
                      <button
                        key={gp.name}
                        type="button"
                        onClick={() =>
                          handleApplyStyle({
                            textGradient: {
                              ...primaryEl.style.textGradient!,
                              stops: gp.stops,
                            },
                          })
                        }
                        className="h-5 rounded border border-slate-300 dark:border-white/20 transition-transform hover:scale-105 shadow-xs"
                        style={{
                          backgroundImage: `linear-gradient(90deg, ${gp.stops[0].color}, ${gp.stops[1].color})`,
                        }}
                        title={gp.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Opacity Slider */}
            <div>
              <PropertyScrubber
                label="Opacity"
                value={Math.round((Number(opacity.value) || 1) * 100)}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(val, isFinal) =>
                  handleApplyStyle({ opacity: val / 100 }, isFinal)
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. EFFECTS & SHADOWS */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("effects")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Effects & Shadows
          </span>
          {openSections.effects ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.effects && (
          <div className="p-3 space-y-3">
            {/* Shadow Presets */}
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1.5">
                Shadow Presets
              </span>
              <div className="grid grid-cols-4 gap-1 text-[9px]">
                {TEXT_SHADOW_PRESETS.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() =>
                      handleApplyStyle({
                        textShadows: [
                          {
                            id: sp.id,
                            x: sp.x,
                            y: sp.y,
                            blur: sp.blur,
                            color: sp.color,
                          },
                        ],
                      })
                    }
                    className="py-1 rounded bg-white hover:bg-slate-100 dark:bg-black/40 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors text-center font-medium border border-slate-200 dark:border-white/5 shadow-xs"
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Shadow Controls */}
            {primaryEl?.style.textShadows && primaryEl.style.textShadows.length > 0 && (
              <div className="space-y-2 bg-slate-100 dark:bg-black/30 p-2 rounded-lg border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                    Custom Shadow
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyStyle({ textShadows: undefined })}
                    className="text-[9px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-mono font-medium"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <PropertyScrubber
                    label="X"
                    value={primaryEl.style.textShadows[0].x || 0}
                    min={-50}
                    max={50}
                    step={1}
                    unit="pt"
                    onChange={(val, isFinal) =>
                      handleApplyStyle(
                        {
                          textShadows: [
                            {
                              ...primaryEl.style.textShadows![0],
                              x: val,
                            },
                          ],
                        },
                        isFinal
                      )
                    }
                  />
                  <PropertyScrubber
                    label="Y"
                    value={primaryEl.style.textShadows[0].y || 0}
                    min={-50}
                    max={50}
                    step={1}
                    unit="pt"
                    onChange={(val, isFinal) =>
                      handleApplyStyle(
                        {
                          textShadows: [
                            {
                              ...primaryEl.style.textShadows![0],
                              y: val,
                            },
                          ],
                        },
                        isFinal
                      )
                    }
                  />
                  <PropertyScrubber
                    label="Blur"
                    value={primaryEl.style.textShadows[0].blur || 0}
                    min={0}
                    max={60}
                    step={1}
                    unit="pt"
                    onChange={(val, isFinal) =>
                      handleApplyStyle(
                        {
                          textShadows: [
                            {
                              ...primaryEl.style.textShadows![0],
                              blur: val,
                            },
                          ],
                        },
                        isFinal
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Text Highlight / Background Box */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                  Text Highlight Box
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyStyle({
                      textHighlight: primaryEl?.style.textHighlight?.color
                        ? undefined
                        : { color: "#fef08a", borderRadius: 4, padding: 4 },
                    })
                  }
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    primaryEl?.style.textHighlight?.color
                      ? "bg-amber-600 text-white font-medium shadow-xs"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {primaryEl?.style.textHighlight?.color ? "Active" : "+ Highlight"}
                </button>
              </div>

              {primaryEl?.style.textHighlight?.color && (
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {[
                    "#fef08a",
                    "#fed7aa",
                    "#bbf7d0",
                    "#a5f3fc",
                    "#fbcfe8",
                    "#e9d5ff",
                  ].map((hl) => (
                    <button
                      key={hl}
                      type="button"
                      onClick={() =>
                        handleApplyStyle({
                          textHighlight: {
                            ...primaryEl.style.textHighlight!,
                            color: hl,
                          },
                        })
                      }
                      className="h-5 rounded border border-slate-300 dark:border-white/20 transition-transform hover:scale-115 shadow-xs"
                      style={{ backgroundColor: hl }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. LAYOUT & BOX APPEARANCE */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("layout")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <Maximize2 className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Layout & Auto-Fit
          </span>
          {openSections.layout ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.layout && primaryEl && (
          <div className="p-3 space-y-3">
            {/* Width & Height */}
            <div className="grid grid-cols-2 gap-2">
              <PropertyScrubber
                label="Width"
                value={Math.round(primaryEl.transform.width)}
                min={20}
                max={2000}
                step={5}
                unit="pt"
                onChange={(val, isFinal) =>
                  updateElementTransform(primaryEl.id, { width: val }, isFinal)
                }
              />
              <PropertyScrubber
                label="Height"
                value={Math.round(primaryEl.transform.height)}
                min={15}
                max={2000}
                step={5}
                unit="pt"
                onChange={(val, isFinal) =>
                  updateElementTransform(primaryEl.id, { height: val }, isFinal)
                }
              />
            </div>

            {/* Rotation Controls */}
            <div>
              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                <span>Rotation</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">{primaryEl.transform.rotation || 0}°</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-[9px] font-mono">
                {[0, 45, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() =>
                      updateElementTransform(primaryEl.id, { rotation: deg }, true)
                    }
                    className={`py-1 rounded transition-colors ${
                      (primaryEl.transform.rotation || 0) === deg
                        ? "bg-indigo-600 text-white font-bold shadow-xs"
                        : "bg-white hover:bg-slate-100 dark:bg-black/40 dark:hover:bg-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-transparent"
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Box Border & Radius */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <PropertyScrubber
                label="Border Width"
                value={primaryEl.style.borderWidth || 0}
                min={0}
                max={20}
                step={0.5}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle(
                    {
                      borderWidth: val,
                      borderColor: primaryEl.style.borderColor || "#cbd5e1",
                      borderStyle: val > 0 ? "solid" : "none",
                    },
                    isFinal
                  )
                }
              />
              <PropertyScrubber
                label="Corner Radius"
                value={primaryEl.style.borderRadius || 0}
                min={0}
                max={50}
                step={1}
                unit="pt"
                onChange={(val, isFinal) =>
                  handleApplyStyle({ borderRadius: val }, isFinal)
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. STYLES & PRESETS */}
      {/* ======================================================== */}
      <div className="bg-slate-50/70 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("styles")}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-left font-medium text-slate-800 dark:text-slate-200 text-[11px]"
        >
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Presets & Linked Styles
          </span>
          {openSections.styles ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {openSections.styles && (
          <div className="p-3 space-y-3">
            {/* Quick Presets Grid */}
            <div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium block mb-1.5">
                Publication Presets
              </span>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                {TYPOGRAPHY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyStyle(p.style)}
                    className="p-1.5 rounded-lg bg-white dark:bg-black/40 hover:bg-slate-100/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-indigo-400 transition-colors text-left shadow-xs"
                  >
                    <div className="font-semibold text-[10px] text-slate-900 dark:text-white truncate">
                      {p.name}
                    </div>
                    <div className="text-[8px] text-slate-500 dark:text-slate-400 truncate">
                      {p.style.fontFamily} {p.style.fontSize}pt
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Linked Document Styles */}
            {book?.textStyles && book.textStyles.length > 0 && primaryEl && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 font-medium">
                  <span>Linked Document Style</span>
                  {primaryEl.style.styleId && (
                    <button
                      type="button"
                      onClick={() => detachTextStyle(primaryEl.id)}
                      className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-medium"
                    >
                      Detach
                    </button>
                  )}
                </div>

                <select
                  value={primaryEl.style.styleId || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      applyTextStyle(primaryEl.id, e.target.value);
                    }
                  }}
                  className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none shadow-xs"
                >
                  <option value="">None (Custom Overrides)</option>
                  {book.textStyles.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.fontFamily} {st.fontSize}pt)
                    </option>
                  ))}
                </select>

                {primaryEl.style.styleId && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => resetTextStyleOverrides(primaryEl.id)}
                      className="flex-1 py-1 rounded bg-slate-200/80 hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/20 text-[9px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                    >
                      Reset Overrides
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (primaryEl.style.styleId) {
                          updateTextStyle(primaryEl.style.styleId, primaryEl.style);
                        }
                      }}
                      className="flex-1 py-1 rounded bg-indigo-50 dark:bg-indigo-600/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/50 border border-indigo-300 dark:border-indigo-500/40 text-[9px] text-indigo-700 dark:text-indigo-200 font-medium transition-colors"
                    >
                      Update Globally
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Save Current as New Document Style */}
            {primaryEl && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                {showNewStyleInput ? (
                  <div className="space-y-1.5 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="e.g. Science Chapter Heading"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white outline-none shadow-xs"
                      autoFocus
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (newStyleName.trim()) {
                            createTextStyleFromElement(primaryEl.id, newStyleName.trim());
                            setNewStyleName("");
                            setShowNewStyleInput(false);
                          }
                        }}
                        className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold shadow-xs"
                      >
                        Save Style
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewStyleInput(false)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-400 rounded text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewStyleInput(true)}
                    className="w-full py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Save Selection as Document Style
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
