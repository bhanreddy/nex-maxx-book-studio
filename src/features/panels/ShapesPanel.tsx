"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Star,
  Clock,
  Square,
  Sparkles,
  Trash2,
  Plus,
  Bookmark,
  Check,
  Shapes,
} from "lucide-react";
import {
  SHAPE_CATALOG,
  SHAPE_CATEGORIES,
  ShapeCategoryId,
  ShapeDefinition,
  searchShapeCatalog,
} from "../../editor/vector/shapeCatalog";
import { generateShapeSvgPath } from "../../editor/vector/shapeGeometry";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { SHAPE_STYLE_PRESETS, ShapePresetStyle } from "../../editor/vector/shapeEffects";
import { ElementStyle, VectorShapeType } from "../../domain/element/types";

interface CustomSavedShape {
  id: string;
  name: string;
  shapeType: VectorShapeType;
  style: ElementStyle;
  createdAt: number;
}

export const ShapesPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategoryId | "all">("all");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["rectangle", "circle", "star", "callout-speech", "arrow-right"];
    try {
      const saved = localStorage.getItem("nex_maxx_shape_favorites");
      return saved ? JSON.parse(saved) : ["rectangle", "circle", "star", "callout-speech", "arrow-right"];
    } catch {
      return ["rectangle", "circle", "star", "callout-speech", "arrow-right"];
    }
  });

  const [recentShapes, setRecentShapes] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["rectangle", "circle", "arrow-right"];
    try {
      const saved = localStorage.getItem("nex_maxx_recent_shapes");
      return saved ? JSON.parse(saved) : ["rectangle", "circle", "arrow-right"];
    } catch {
      return ["rectangle", "circle", "arrow-right"];
    }
  });

  const [myShapes, setMyShapes] = useState<CustomSavedShape[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("nex_maxx_my_shapes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { addVectorShape, updateElementStyle, selectedElementIds, elements } = useEditorStore();
  const { showToast } = useUiStore();

  const toggleFavorite = (shapeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(shapeId) ? prev.filter((id) => id !== shapeId) : [...prev, shapeId];
      try {
        localStorage.setItem("nex_maxx_shape_favorites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleInsertShape = (
    shapeType: VectorShapeType,
    defaultW: number = 140,
    defaultH: number = 100,
    presetStyle?: Partial<ElementStyle>
  ) => {
    // Record recent
    setRecentShapes((prev) => {
      const next = [shapeType, ...prev.filter((id) => id !== shapeType)].slice(0, 10);
      try {
        localStorage.setItem("nex_maxx_recent_shapes", JSON.stringify(next));
      } catch {}
      return next;
    });

    const newEl = addVectorShape(shapeType, 120, 160, defaultW, defaultH);
    if (newEl && presetStyle) {
      updateElementStyle(newEl.id, presetStyle);
    }
  };

  const filteredShapes = useMemo(() => {
    if (selectedCategory === "my-shapes") return [];
    const baseList = selectedCategory === "all"
      ? SHAPE_CATALOG
      : SHAPE_CATALOG.filter((s) => s.category === selectedCategory);

    if (!searchQuery.trim()) return baseList;

    return searchShapeCatalog(
      searchQuery,
      selectedCategory === "all" ? undefined : selectedCategory
    );
  }, [searchQuery, selectedCategory]);

  const favoriteShapesList = useMemo(() => {
    return SHAPE_CATALOG.filter((s) => favorites.includes(s.id));
  }, [favorites]);

  const recentShapesList = useMemo(() => {
    return recentShapes
      .map((id) => SHAPE_CATALOG.find((s) => s.id === id))
      .filter((s): s is ShapeDefinition => Boolean(s));
  }, [recentShapes]);

  // Check if a single shape is selected to allow saving a preset.
  const singleSelected = selectedElementIds.length === 1 ? elements[selectedElementIds[0]] : null;
  const canSaveSelectedAsShape = singleSelected && (singleSelected.type === "shape" || singleSelected.style.shapeType);

  const handleSaveToMyShapes = () => {
    if (!singleSelected) return;
    const name = prompt("Name your custom shape:", singleSelected.displayName || "Custom Shape");
    if (!name) return;

    const newCustom: CustomSavedShape = {
      id: `custom-shape-${Date.now()}`,
      name,
      shapeType: singleSelected.style.shapeType || "rectangle",
      style: { ...singleSelected.style },
      createdAt: Date.now(),
    };

    const next = [newCustom, ...myShapes];
    setMyShapes(next);
    try {
      localStorage.setItem("nex_maxx_my_shapes", JSON.stringify(next));
    } catch {}

    showToast({
      type: "success",
      title: "Saved to My Shapes",
      message: `"${name}" can now be reused anytime.`,
    });
  };

  const handleDeleteCustomShape = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = myShapes.filter((s) => s.id !== id);
    setMyShapes(next);
    try {
      localStorage.setItem("nex_maxx_my_shapes", JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#090d16] text-slate-800 dark:text-slate-100">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-200 dark:border-white/10 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shapes className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight">Vector Shapes Engine</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {SHAPE_CATALOG.length} shapes
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search arrows, bubbles, math, badges..."
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Strip */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            All
          </button>
          {SHAPE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shapes Content Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Save selected button */}
        {canSaveSelectedAsShape && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">
                Selected Shape Ready
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400">
                Save geometry and styles to My Shapes
              </div>
            </div>
            <button
              onClick={handleSaveToMyShapes}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-500 shadow-sm active:scale-95 transition-all"
            >
              + Save
            </button>
          </div>
        )}

        {/* 1-Click Style Presets Row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              1-Click Style Presets
            </span>
            <span className="text-[10px] text-indigo-500">Auto-applies</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {SHAPE_STYLE_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleInsertShape("rounded-rectangle", 160, 100, preset.style)}
                className="group p-2 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all text-left flex flex-col justify-between"
              >
                <div
                  className="w-full h-7 rounded border mb-1.5 transition-transform group-hover:scale-[1.02]"
                  style={{
                    backgroundColor: preset.style.backgroundColor || "#ffffff",
                    borderColor: preset.style.borderColor || "#cbd5e1",
                    borderWidth: preset.style.borderWidth || 1,
                    borderRadius: preset.style.borderRadius || 6,
                    boxShadow: preset.category === "premium" ? "0 4px 6px -1px rgba(0,0,0,0.1)" : undefined,
                  }}
                />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recents & Favorites Quick Section (When no active search and category is All) */}
        {!searchQuery && selectedCategory === "all" && (
          <>
            {recentShapesList.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-2">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Recently Used</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {recentShapesList.map((shape) => (
                    <ShapeGridItem
                      key={shape.id}
                      shape={shape}
                      isFavorite={favorites.includes(shape.id)}
                      onInsert={() => handleInsertShape(shape.id, shape.defaultWidth, shape.defaultHeight)}
                      onToggleFavorite={(e) => toggleFavorite(shape.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {favoriteShapesList.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-2">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Favorites</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {favoriteShapesList.map((shape) => (
                    <ShapeGridItem
                      key={shape.id}
                      shape={shape}
                      isFavorite={true}
                      onInsert={() => handleInsertShape(shape.id, shape.defaultWidth, shape.defaultHeight)}
                      onToggleFavorite={(e) => toggleFavorite(shape.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* My Custom Shapes Tab View */}
        {selectedCategory === "my-shapes" ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                My Saved Shapes
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{myShapes.length} saved</span>
            </div>
            {myShapes.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">
                <Bookmark className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">No custom shapes yet</div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Customize any shape on the canvas and click &ldquo;Save to My Shapes&rdquo; to reuse it.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {myShapes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleInsertShape(item.shapeType, 140, 100, item.style)}
                    className="group relative p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-400/50 transition-all cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div className="w-full h-14 flex items-center justify-center mb-1.5">
                      <svg className="w-12 h-12 overflow-visible" viewBox="0 0 36 36">
                        <path
                          d={generateShapeSvgPath(item.shapeType, 36, 36)}
                          fill={item.style?.backgroundColor || "#e0e7ff"}
                          stroke={item.style?.borderColor || "#4338ca"}
                          strokeWidth={item.style?.borderWidth ? Math.min(2, item.style.borderWidth) : 1.5}
                        />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {item.name}
                      </span>
                      <button
                        onClick={(e) => handleDeleteCustomShape(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                        title="Delete shape"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Main Filtered Shapes Grid */
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                {selectedCategory === "all" ? "All Shapes Library" : SHAPE_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredShapes.length} items
              </span>
            </div>

            {filteredShapes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                <Search className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <div className="text-xs font-medium text-slate-500">No shapes found for &ldquo;{searchQuery}&rdquo;</div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filteredShapes.map((shape) => (
                  <ShapeGridItem
                    key={shape.id}
                    shape={shape}
                    isFavorite={favorites.includes(shape.id)}
                    onInsert={() => handleInsertShape(shape.id, shape.defaultWidth, shape.defaultHeight)}
                    onToggleFavorite={(e) => toggleFavorite(shape.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ShapeGridItemProps {
  shape: ShapeDefinition;
  isFavorite: boolean;
  onInsert: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const ShapeGridItem: React.FC<ShapeGridItemProps> = ({
  shape,
  isFavorite,
  onInsert,
  onToggleFavorite,
}) => {
  const pathD = useMemo(() => {
    return generateShapeSvgPath(shape.id, 32, 32);
  }, [shape.id]);

  const handleDragStart = (e: React.DragEvent) => {
    const payload = JSON.stringify({
      type: "shape",
      shapeType: shape.id,
      width: shape.defaultWidth,
      height: shape.defaultHeight,
    });
    e.dataTransfer.setData("application/x-nexmaxx-shape", payload);
    e.dataTransfer.setData("application/json", payload);
  };

  return (
    <button
      onClick={onInsert}
      draggable
      onDragStart={handleDragStart}
      title={`${shape.name} (Click to insert or drag to canvas)`}
      className="group relative flex flex-col items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md active:scale-95 transition-all text-center"
    >
      {/* Favorite Star */}
      <span
        onClick={onToggleFavorite}
        className={`absolute top-1 right-1 p-0.5 rounded transition-opacity ${
          isFavorite
            ? "opacity-100 text-amber-500"
            : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500"
        }`}
      >
        <Star className={`w-2.5 h-2.5 ${isFavorite ? "fill-amber-500" : ""}`} />
      </span>

      {/* SVG Icon Thumbnail */}
      <div className="w-8 h-8 flex items-center justify-center my-1 pointer-events-none">
        <svg
          viewBox="0 0 32 32"
          className="w-7 h-7 overflow-visible transition-transform group-hover:scale-110"
        >
          <path
            d={pathD}
            fill="#e0e7ff"
            stroke="#4338ca"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Shape Name */}
      <span className="text-[9.5px] font-medium text-slate-600 dark:text-slate-300 w-full truncate pointer-events-none leading-none pt-1">
        {shape.name}
      </span>
    </button>
  );
};
