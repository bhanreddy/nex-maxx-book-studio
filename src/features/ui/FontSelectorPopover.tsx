"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Star, Clock, FileText, Check, ChevronRight } from "lucide-react";
import {
  FONT_CATALOG,
  FONT_CATEGORIES,
  FontCategory,
  getFavoriteFonts,
  toggleFavoriteFont,
  getRecentFonts,
  addRecentFont,
} from "../../editor/design/typographyCatalog";
import { useEditorStore } from "../../editor/stores/editorStore";

interface FontSelectorPopoverProps {
  currentFont: string;
  onSelect: (font: string) => void;
  onPreview?: (font: string | null) => void;
  onClose?: () => void;
}

export const FontSelectorPopover: React.FC<FontSelectorPopoverProps> = ({
  currentFont,
  onSelect,
  onPreview,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteFonts());
  const [recents, setRecents] = useState<string[]>(() => getRecentFonts());
  const popoverRef = useRef<HTMLDivElement>(null);
  const elements = useEditorStore((s) => s.elements);

  // Collect document fonts
  const documentFonts = useMemo(() => {
    const set = new Set<string>();
    Object.values(elements).forEach((el) => {
      if (el.style.fontFamily) set.add(el.style.fontFamily);
    });
    return Array.from(set);
  }, [elements]);

  const handleToggleFavorite = (font: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavoriteFont(font);
    setFavorites(updated);
  };

  const handleSelect = (font: string) => {
    addRecentFont(font);
    setRecents(getRecentFonts());
    onPreview?.(null);
    onSelect(font);
    onClose?.();
  };

  const filteredFonts = useMemo(() => {
    let list = FONT_CATALOG;

    if (activeCategory === "Favorites") {
      list = list.filter((f) => favorites.includes(f.family));
    } else if (activeCategory === "Recent") {
      list = list.filter((f) => recents.includes(f.family));
    } else if (activeCategory === "Document") {
      list = list.filter((f) => documentFonts.includes(f.family));
    } else if (activeCategory !== "All") {
      list = list.filter((f) => f.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (f) =>
          f.family.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, searchTerm, favorites, recents, documentFonts]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onPreview?.(null);
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, onPreview]);

  return (
    <div
      ref={popoverRef}
      onMouseLeave={() => onPreview?.(null)}
      className="w-80 bg-[#10141d] border border-white/15 rounded-xl shadow-2xl p-2.5 text-slate-200 z-[100] animate-in fade-in zoom-in-95 duration-120 select-none font-sans flex flex-col max-h-[440px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Header */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search 30+ publishing fonts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 border-b border-white/10 scrollbar-none text-[10px]">
        {["All", "Favorites", "Recent", "Document", ...FONT_CATEGORIES].map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-indigo-600 text-white font-medium shadow-xs"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat === "Favorites" && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
              {cat === "Recent" && <Clock className="w-2.5 h-2.5" />}
              {cat === "Document" && <FileText className="w-2.5 h-2.5" />}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Font List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
        {filteredFonts.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No fonts found matching “{searchTerm}”
          </div>
        ) : (
          filteredFonts.map((font) => {
            const isSelected = currentFont.toLowerCase() === font.family.toLowerCase();
            const isFav = favorites.includes(font.family);

            return (
              <div
                key={font.family}
                onClick={() => handleSelect(font.family)}
                onMouseEnter={() => onPreview?.(font.family)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-white/10 text-slate-200"
                }`}
              >
                {/* Font Name with Real Typography Preview */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm truncate block"
                      style={{ fontFamily: font.family }}
                    >
                      {font.family}
                    </span>
                    {font.isBundled && (
                      <span className="text-[8px] bg-white/10 px-1 py-0.2 rounded font-mono opacity-60">
                        Print Ready
                      </span>
                    )}
                  </div>
                  {font.sampleText && (
                    <div
                      className={`text-[10px] truncate opacity-70 mt-0.5 ${
                        isSelected ? "text-indigo-100" : "text-slate-400"
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      {font.sampleText}
                    </div>
                  )}
                </div>

                {/* Actions: Favorite Star & Active Check */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(font.family, e)}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                  </button>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <span>{filteredFonts.length} typography styles</span>
        <span>Hover for live canvas preview</span>
      </div>
    </div>
  );
};
