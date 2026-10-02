"use client";

import React, { useState } from "react";
import {
  Shapes,
  Sparkles,
  Layers,
  Palette,
  Sliders,
  Type,
  Maximize2,
  Lock,
  Unlock,
  Copy,
  ClipboardCheck,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Plus,
  Trash2,
  Bookmark,
  Combine,
  Scissors,
  Eye,
} from "lucide-react";
import { ElementStyle, PageElement, ShapeCornerStyle, ShapeCornersConfig, ShapeFillConfig, ShapeStrokeConfig, ShapeTextConfig, VectorShapeType } from "../../domain/element/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import {
  SHAPE_STYLE_PRESETS,
  ShapePresetStyle,
} from "../../editor/vector/shapeEffects";
import { SHAPE_CATALOG } from "../../editor/vector/shapeCatalog";

interface ShapeInspectorProps {
  selectedElements: PageElement[];
}

export const ShapeInspector: React.FC<ShapeInspectorProps> = ({ selectedElements }) => {
  const {
    updateElementStyle,
    updateElementTransform,
    convertToCurves,
    performBooleanOperation,
    saveToStorage,
  } = useEditorStore();
  const { showToast, setActiveTool } = useUiStore();

  const isMulti = selectedElements.length > 1;
  const singleElement = selectedElements[0];

  const style = singleElement?.style || {};
  const transform = singleElement?.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0, zIndex: 1 };

  // Local state for active section collapses
  const [activeTab, setActiveTab] = useState<"style" | "fill" | "stroke" | "corners" | "effects" | "text" | "transform">("style");
  const [copiedStyle, setCopiedStyle] = useState<Partial<ElementStyle> | null>(null);

  if (selectedElements.length === 0) return null;

  // 1-Click Style preset application
  const applyPreset = (preset: ShapePresetStyle) => {
    selectedElements.forEach((el) => {
      updateElementStyle(el.id, preset.style);
    });
    showToast({
      type: "success",
      title: `Applied ${preset.name}`,
    });
  };

  // Copy / Paste style
  const handleCopyStyle = () => {
    if (!singleElement) return;
    const styleToCopy = {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      borderStyle: style.borderStyle,
      borderRadius: style.borderRadius,
      shapeFill: style.shapeFill,
      shapeStroke: style.shapeStroke,
      shapeCorners: style.shapeCorners,
      shapeEffects: style.shapeEffects,
      shapeText: style.shapeText,
      opacity: style.opacity,
    };
    setCopiedStyle(styleToCopy);
    showToast({
      type: "info",
      title: "Shape Style Copied",
      message: "Select another shape and click Paste Style.",
    });
  };

  const handlePasteStyle = () => {
    if (!copiedStyle) return;
    selectedElements.forEach((el) => {
      updateElementStyle(el.id, copiedStyle);
    });
    showToast({
      type: "success",
      title: "Style Pasted",
    });
  };

  // Convert to Curves for node point editing
  const handleEditPoints = () => {
    if (!singleElement) return;
    convertToCurves(singleElement.id);
    setActiveTool("node");
    showToast({
      type: "info",
      title: "Switched to Node Tool",
      message: "Drag anchor points and handles to edit shape curves.",
    });
  };

  // Save to My Shapes
  const handleSaveToMyShapes = () => {
    if (!singleElement) return;
    const name = prompt("Name your custom shape preset:", singleElement.displayName || "My Shape");
    if (!name) return;

    try {
      const existing = JSON.parse(localStorage.getItem("nex_maxx_my_shapes") || "[]");
      const newItem = {
        id: `custom-shape-${Date.now()}`,
        name,
        shapeType: style.shapeType || "rectangle",
        style: { ...singleElement.style },
        createdAt: Date.now(),
      };
      localStorage.setItem("nex_maxx_my_shapes", JSON.stringify([newItem, ...existing]));
      showToast({
        type: "success",
        title: "Saved to My Shapes",
        message: `Saved "${name}" for future reuse.`,
      });
    } catch {}
  };

  // Current Fill setup
  const currentFill = style.shapeFill || {
    type: "solid",
    color: style.backgroundColor || "#e0e7ff",
  };

  const updateFill = (patch: Partial<ShapeFillConfig>) => {
    selectedElements.forEach((el) => {
      const nextFill = { ...(el.style.shapeFill || { type: "solid", color: el.style.backgroundColor || "#e0e7ff" }), ...patch };
      updateElementStyle(el.id, {
        shapeFill: nextFill,
        backgroundColor: nextFill.type === "solid" ? nextFill.color : undefined,
      });
    });
  };

  // Current Stroke setup
  const currentStroke = style.shapeStroke || {
    color: style.borderColor || "#4338ca",
    width: style.borderWidth ?? 1.5,
  };

  const updateStroke = (patch: Partial<ShapeStrokeConfig>) => {
    selectedElements.forEach((el) => {
      const nextStroke = { ...(el.style.shapeStroke || { color: el.style.borderColor || "#4338ca", width: el.style.borderWidth ?? 1.5 }), ...patch };
      updateElementStyle(el.id, {
        shapeStroke: nextStroke,
        borderColor: nextStroke.color,
        borderWidth: nextStroke.width,
        borderStyle: nextStroke.dasharray ? "dashed" : "solid",
      });
    });
  };

  // Current Corners setup
  const currentCorners = style.shapeCorners || {
    linked: true,
    radius: style.borderRadius ?? 8,
    style: "rounded" as ShapeCornerStyle,
  };

  const updateCorners = (patch: Partial<ShapeCornersConfig>) => {
    selectedElements.forEach((el) => {
      const nextCorners = { ...(el.style.shapeCorners || { linked: true, radius: el.style.borderRadius ?? 8, style: "rounded" }), ...patch };
      updateElementStyle(el.id, {
        shapeCorners: nextCorners,
        borderRadius: nextCorners.linked ? nextCorners.radius : (nextCorners.topLeft ?? 0),
      });
    });
  };

  // Current Effects setup
  const currentEffects = style.shapeEffects || [];

  const setElevationLevel = (level: 1 | 2 | 3 | 4 | 5 | 0) => {
    selectedElements.forEach((el) => {
      if (level === 0) {
        updateElementStyle(el.id, { shapeEffects: [] });
      } else {
        updateElementStyle(el.id, {
          shapeEffects: [{ type: "elevation", level }],
        });
      }
    });
  };

  return (
    <div className="space-y-3 p-3 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100">
      {/* Title & Quick Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <Shapes className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">
            {isMulti ? `Vector Shapes (${selectedElements.length})` : "Shape Engine"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyStyle}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
            title="Copy Shape Style"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copiedStyle && (
            <button
              onClick={handlePasteStyle}
              className="p-1 rounded text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              title="Paste Copied Style"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 pb-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: "style", label: "Presets" },
          { id: "fill", label: "Fill" },
          { id: "stroke", label: "Stroke" },
          { id: "corners", label: "Corners" },
          { id: "effects", label: "Effects" },
          { id: "text", label: "Text" },
          { id: "transform", label: "Layout" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRESETS & SHAPE SELECTOR */}
      {activeTab === "style" && (
        <div className="space-y-3">
          {/* Shape Type Selector (if single) */}
          {!isMulti && (
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Shape Type
              </label>
              <select
                value={style.shapeType || "rectangle"}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, {
                    shapeType: e.target.value as VectorShapeType,
                  })
                }
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                {SHAPE_CATALOG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1-Click Style Presets */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Professional 1-Click Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SHAPE_STYLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400 text-left transition-all flex flex-col justify-between"
                >
                  <div
                    className="w-full h-5 rounded border mb-1"
                    style={{
                      backgroundColor: p.style.backgroundColor || "#ffffff",
                      borderColor: p.style.borderColor || "#cbd5e1",
                      borderWidth: p.style.borderWidth || 1,
                      borderRadius: p.style.borderRadius || 4,
                    }}
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Edit Points / Convert to Curves */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-col gap-1.5">
            <button
              onClick={handleEditPoints}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Edit Vector Points (Pen Mode)</span>
            </button>
            <button
              onClick={handleSaveToMyShapes}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save to My Shapes</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: FILL SYSTEM */}
      {activeTab === "fill" && (
        <div className="space-y-3">
          {/* Fill Type Selector */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 dark:bg-white/5 rounded-lg text-center">
            {[
              { id: "solid", label: "Solid" },
              { id: "linear-gradient", label: "Linear" },
              { id: "pattern", label: "Pattern" },
              { id: "none", label: "None" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => updateFill({ type: f.id as ShapeFillConfig["type"] })}
                className={`py-1 text-[10px] font-semibold rounded ${
                  currentFill.type === f.id
                    ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Solid Fill */}
          {currentFill.type === "solid" && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentFill.color?.startsWith("#") ? currentFill.color : "#4f46e5"}
                  onChange={(e) => updateFill({ color: e.target.value })}
                  className="w-9 h-8 rounded border border-slate-200 dark:border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={currentFill.color || "#4f46e5"}
                  onChange={(e) => updateFill({ color: e.target.value })}
                  className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Linear Gradient Fill */}
          {currentFill.type === "linear-gradient" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <span>Gradient Angle</span>
                  <span className="font-mono">{currentFill.angle ?? 90}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={currentFill.angle ?? 90}
                  onChange={(e) => updateFill({ angle: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Start Color</span>
                  <input
                    type="color"
                    value={currentFill.stops?.[0]?.color || "#818cf8"}
                    onChange={(e) => {
                      const stops = [...(currentFill.stops || [{ offset: 0, color: "#818cf8" }, { offset: 1, color: "#4f46e5" }])];
                      stops[0] = { ...stops[0], color: e.target.value };
                      updateFill({ stops });
                    }}
                    className="w-full h-8 rounded border border-slate-200 dark:border-white/10 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">End Color</span>
                  <input
                    type="color"
                    value={currentFill.stops?.[1]?.color || "#4f46e5"}
                    onChange={(e) => {
                      const stops = [...(currentFill.stops || [{ offset: 0, color: "#818cf8" }, { offset: 1, color: "#4f46e5" }])];
                      stops[1] = { ...stops[1], color: e.target.value };
                      updateFill({ stops });
                    }}
                    className="w-full h-8 rounded border border-slate-200 dark:border-white/10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pattern Fill */}
          {currentFill.type === "pattern" && (
            <div className="space-y-2.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Pattern Motif
              </label>
              <select
                value={currentFill.pattern || "dots"}
                onChange={(e) => updateFill({ pattern: e.target.value as ShapeFillConfig["pattern"] })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="dots">Fine Dots</option>
                <option value="grid">Graph Grid</option>
                <option value="lines">Horizontal Lines</option>
                <option value="diagonal-lines">Diagonal Hatching</option>
                <option value="waves">Subtle Waves</option>
              </select>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Scale</span>
                  <span className="font-mono">{currentFill.patternScale ?? 12}px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="32"
                  value={currentFill.patternScale ?? 12}
                  onChange={(e) => updateFill({ patternScale: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STROKE ENGINE */}
      {activeTab === "stroke" && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Stroke Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentStroke.color?.startsWith("#") ? currentStroke.color : "#4338ca"}
                onChange={(e) => updateStroke({ color: e.target.value })}
                className="w-9 h-8 rounded border border-slate-200 dark:border-white/20 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={currentStroke.color || "#4338ca"}
                onChange={(e) => updateStroke({ color: e.target.value })}
                className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Stroke Width</span>
              <span className="font-mono">{currentStroke.width ?? 1.5} pt</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={currentStroke.width ?? 1.5}
              onChange={(e) => updateStroke({ width: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Dash Pattern
              </label>
              <select
                value={currentStroke.dasharray || "none"}
                onChange={(e) =>
                  updateStroke({
                    dasharray: e.target.value === "none" ? undefined : e.target.value,
                  })
                }
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="none">Solid</option>
                <option value="6,4">Dashed</option>
                <option value="2,2">Dotted</option>
                <option value="8,4,2,4">Dash-Dot</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Line Cap
              </label>
              <select
                value={currentStroke.linecap || "round"}
                onChange={(e) => updateStroke({ linecap: e.target.value as ShapeStrokeConfig["linecap"] })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="round">Round</option>
                <option value="butt">Butt</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CORNERS CONTROLS */}
      {activeTab === "corners" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Corner Radius
            </span>
            <button
              onClick={() => updateCorners({ linked: !currentCorners.linked })}
              className={`p-1 rounded text-xs flex items-center gap-1 ${
                currentCorners.linked ? "text-indigo-600 font-semibold" : "text-slate-400"
              }`}
              title="Toggle All Corners Linked"
            >
              {currentCorners.linked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span className="text-[10px]">{currentCorners.linked ? "Linked" : "Independent"}</span>
            </button>
          </div>

          {currentCorners.linked ? (
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>All Corners Radius</span>
                <span className="font-mono">{currentCorners.radius ?? 8} pt</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={currentCorners.radius ?? 8}
                onChange={(e) => updateCorners({ radius: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Top-Left</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={currentCorners.topLeft ?? currentCorners.radius ?? 8}
                  onChange={(e) => updateCorners({ topLeft: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Top-Right</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={currentCorners.topRight ?? currentCorners.radius ?? 8}
                  onChange={(e) => updateCorners({ topRight: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Bottom-Left</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={currentCorners.bottomLeft ?? currentCorners.radius ?? 8}
                  onChange={(e) => updateCorners({ bottomLeft: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Bottom-Right</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={currentCorners.bottomRight ?? currentCorners.radius ?? 8}
                  onChange={(e) => updateCorners({ bottomRight: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-right font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Corner Cut Style
            </label>
            <select
              value={currentCorners.style || "rounded"}
              onChange={(e) => updateCorners({ style: e.target.value as ShapeCornerStyle })}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
            >
              <option value="rounded">Rounded (Smooth)</option>
              <option value="chamfer">Chamfered / Cut (45° Angle)</option>
              <option value="concave">Concave (Inward Scoop)</option>
              <option value="soft">Soft Corner</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 5: EFFECTS & SHADOWS */}
      {activeTab === "effects" && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Soft Elevation Presets
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { level: 0, label: "None" },
                { level: 1, label: "Elev 1" },
                { level: 2, label: "Elev 2" },
                { level: 3, label: "Elev 3" },
                { level: 4, label: "Elev 4" },
                { level: 5, label: "Elev 5" },
              ].map((el) => (
                <button
                  key={el.level}
                  onClick={() => setElevationLevel(el.level as 0 | 1 | 2 | 3 | 4 | 5)}
                  className="p-1.5 rounded border border-slate-200 dark:border-white/10 text-[11px] font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-center"
                >
                  {el.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Stackable Depth Effects
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  updateElementStyle(singleElement.id, {
                    shapeEffects: [{ type: "paper", variant: "soft", intensity: 1 }],
                  })
                }
                className="flex-1 py-1 rounded border border-slate-200 dark:border-white/10 text-[11px] hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Paper Lift
              </button>
              <button
                onClick={() =>
                  updateElementStyle(singleElement.id, {
                    shapeEffects: [{ type: "glass", variant: "frosted", blur: 12 }],
                  })
                }
                className="flex-1 py-1 rounded border border-slate-200 dark:border-white/10 text-[11px] hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Frosted Glass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TEXT INSIDE SHAPE */}
      {activeTab === "text" && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Embedded Shape Text
            </label>
            <textarea
              rows={2}
              value={style.shapeText?.text || ""}
              onChange={(e) =>
                updateElementStyle(singleElement.id, {
                  shapeText: { ...(style.shapeText || { fontSize: 11 }), text: e.target.value },
                })
              }
              placeholder="Type label or text inside this shape..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Font Size (pt)</span>
              <input
                type="number"
                min="6"
                max="48"
                value={style.shapeText?.fontSize || 11}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, {
                    shapeText: { ...(style.shapeText || { text: "" }), fontSize: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Text Color</span>
              <input
                type="color"
                value={style.shapeText?.color || "#0f172a"}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, {
                    shapeText: { ...(style.shapeText || { text: "" }), color: e.target.value },
                  })
                }
                className="w-full h-8 rounded border border-slate-200 dark:border-white/10 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">H-Align</span>
              <select
                value={style.shapeText?.textAlign || "center"}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, {
                    shapeText: { ...(style.shapeText || { text: "" }), textAlign: e.target.value as ShapeTextConfig["textAlign"] },
                  })
                }
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">V-Align</span>
              <select
                value={style.shapeText?.verticalAlign || "middle"}
                onChange={(e) =>
                  updateElementStyle(singleElement.id, {
                    shapeText: { ...(style.shapeText || { text: "" }), verticalAlign: e.target.value as ShapeTextConfig["verticalAlign"] },
                  })
                }
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
              >
                <option value="middle">Middle</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: LAYOUT & PRECISION */}
      {activeTab === "transform" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Width</span>
              <input
                type="number"
                value={Math.round(transform.width)}
                onChange={(e) => updateElementTransform(singleElement.id, { width: Math.max(10, Number(e.target.value)) })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-right"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Height</span>
              <input
                type="number"
                value={Math.round(transform.height)}
                onChange={(e) => updateElementTransform(singleElement.id, { height: Math.max(10, Number(e.target.value)) })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-right"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">X Pos</span>
              <input
                type="number"
                value={Math.round(transform.x)}
                onChange={(e) => updateElementTransform(singleElement.id, { x: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-right"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Y Pos</span>
              <input
                type="number"
                value={Math.round(transform.y)}
                onChange={(e) => updateElementTransform(singleElement.id, { y: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-right"
              />
            </div>
          </div>

          {/* Boolean Operations (When 2+ shapes selected) */}
          {isMulti && (
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Boolean Shape Combine
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => performBooleanOperation("union")}
                  className="p-1.5 rounded border border-slate-200 dark:border-white/10 text-[10px] font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-center"
                >
                  Union
                </button>
                <button
                  onClick={() => performBooleanOperation("subtract")}
                  className="p-1.5 rounded border border-slate-200 dark:border-white/10 text-[10px] font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-center"
                >
                  Subtract
                </button>
                <button
                  onClick={() => performBooleanOperation("intersect")}
                  className="p-1.5 rounded border border-slate-200 dark:border-white/10 text-[10px] font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-center"
                >
                  Intersect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
