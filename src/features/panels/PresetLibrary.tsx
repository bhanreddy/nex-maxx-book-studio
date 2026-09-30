"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ELEMENT_PRESETS } from "../../editor/registry/presets";
import { LayoutView } from "../../editor/design/LayoutView";
import { frameFromLayout } from "../../editor/design/layoutParse";
import { FAMILY_LIST } from "../../editor/design/families";
import { PALETTE_LIST } from "../../editor/design/palettes";
import { grayscaleTokens, tokensFromTheme } from "../../editor/design/tokens";
import { DesignColorTokens, DesignRole, ElementPreset } from "../../domain/element/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { Search, Star } from "lucide-react";

const ROLES: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "chapter", label: "Chapters" },
  { id: "heading", label: "Headings" },
  { id: "running", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "quote", label: "Quotes" },
  { id: "learning", label: "Learning" },
  { id: "practice", label: "Practice" },
  { id: "table", label: "Tables" },
  { id: "figure", label: "Figures" },
  { id: "furniture", label: "Furniture" },
  { id: "classic", label: "Classic" },
];

const ROW_HEIGHT = 132;
const FAV_KEY = "nexmaxx-preset-favourites";
const RECENT_KEY = "nexmaxx-preset-recent";

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export const PresetLibrary: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const replaceElementPreset = useEditorStore((s) => s.replaceElementPreset);
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const book = useEditorStore((s) => s.getActiveBook());

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [familyId, setFamilyId] = useState("all");
  const [paletteId, setPaletteId] = useState("all");
  const [source, setSource] = useState<"theme" | "original">("theme");
  const [grayscale, setGrayscale] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(480);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavourites(readList(FAV_KEY));
    setRecent(readList(RECENT_KEY));
  }, []);

  const presets = useMemo(() => Object.values(ELEMENT_PRESETS), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presets.filter((preset) => {
      const designRole = preset.design?.role;
      if (role === "classic" && designRole) return false;
      if (role !== "all" && role !== "classic" && designRole !== role) return false;
      if (familyId !== "all" && preset.design?.familyId !== familyId) return false;
      if (paletteId !== "all" && preset.design?.paletteId !== paletteId) return false;
      if (favouritesOnly && !favourites.includes(preset.id)) return false;
      if (recentOnly && !recent.includes(preset.id)) return false;
      if (!q) return true;
      const haystack = [
        preset.name,
        preset.description,
        preset.category,
        preset.variant,
        preset.design?.use,
        preset.design?.familyId,
        preset.design?.paletteId,
        ...(preset.design?.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => Number(Boolean(b.design)) - Number(Boolean(a.design)));
  }, [presets, query, role, familyId, paletteId, favouritesOnly, favourites, recentOnly, recent]);

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2);
  const end = Math.min(filtered.length, Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + 3);
  const visible = filtered.slice(start, end);

  const remember = (id: string) => {
    const next = [id, ...recent.filter((item) => item !== id)].slice(0, 12);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const insertPreset = (preset: ElementPreset) => {
    const created = addElement(preset.id, 54, 120);
    remember(preset.id);
    setPreviewId(preset.id);
    if (!created || !preset.design) return;
    const baked = preset.defaultContent?.design?.tokens as DesignColorTokens | undefined;
    const themed = source === "theme" && book ? tokensFromTheme(book.themeId, preset.design.familyId) : null;
    const base = themed || baked;
    if (!base || (source === "original" && !grayscale)) return;
    useEditorStore.getState().applyDesignSystem({
      scope: "selection",
      familyId: preset.design.familyId,
      tokens: grayscale ? grayscaleTokens(base) : base,
      replaceOverrides: true,
    });
  };

  const toggleFavourite = (id: string) => {
    const next = favourites.includes(id) ? favourites.filter((item) => item !== id) : [...favourites, id];
    setFavourites(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  const preview = previewId ? ELEMENT_PRESETS[previewId] : undefined;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2 space-y-2 border-b border-white/10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, use, family, palette"
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {ROLES.map((item) => (
            <button
              key={item.id}
              onClick={() => setRole(item.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                role === item.id ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <select value={familyId} onChange={(event) => setFamilyId(event.target.value)} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
            <option value="all">All families</option>
            {FAMILY_LIST.map((family) => (
              <option key={family.id} value={family.id}>{family.name}</option>
            ))}
          </select>
          <select value={paletteId} onChange={(event) => setPaletteId(event.target.value)} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
            <option value="all">All palettes</option>
            {PALETTE_LIST.map((palette) => (
              <option key={palette.id} value={palette.id} title={palette.intent}>{palette.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterToggle active={source === "theme"} onClick={() => setSource(source === "theme" ? "original" : "theme")} label={source === "theme" ? "Book theme" : "Original palette"} />
          <FilterToggle active={grayscale} onClick={() => setGrayscale((value) => !value)} label="Grayscale proof" />
          <FilterToggle active={favouritesOnly} onClick={() => setFavouritesOnly((value) => !value)} label="Favourites" />
          <FilterToggle active={recentOnly} onClick={() => setRecentOnly((value) => !value)} label="Recent" />
        </div>
        <div className="text-[10px] text-slate-400">{filtered.length} presets</div>
      </div>

      {preview?.design && (
        <div className="px-3 py-2 border-b border-white/10">
          <PresetThumbnail preset={preview} source={source} grayscale={grayscale} themeId={book?.themeId} tall />
          <div className="mt-1 text-[11px] text-slate-200 font-semibold">{preview.name}</div>
          <div className="text-[10px] text-slate-400 leading-snug">{preview.description}</div>
        </div>
      )}

      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop);
          setViewHeight(event.currentTarget.clientHeight);
        }}
      >
        <div style={{ height: filtered.length * ROW_HEIGHT, position: "relative" }}>
          {visible.map((preset, index) => {
            const actual = start + index;
            return (
              <div key={preset.id} style={{ position: "absolute", top: actual * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT - 8 }}>
                <article className="h-full rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden flex flex-col">
                  <button onClick={() => insertPreset(preset)} className="text-left flex-1 min-h-0 active:scale-[0.99] transition-transform">
                    <PresetThumbnail preset={preset} source={source} grayscale={grayscale} themeId={book?.themeId} />
                    <div className="px-2 py-1">
                      <div className="text-[11px] font-semibold text-slate-100 truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{preset.description}</div>
                    </div>
                  </button>
                  <div className="px-2 pb-1 flex items-center justify-between gap-1">
                    <span className="text-[9px] uppercase tracking-wide text-slate-500 truncate">
                      {preset.design?.use || preset.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <button onClick={() => setPreviewId(preset.id)} className="text-[9px] text-slate-300 px-1" title="Larger preview">
                        View
                      </button>
                      {selectedElementIds.length > 0 && (
                        <button
                          onClick={() => {
                            selectedElementIds.forEach((id) => replaceElementPreset(id, preset.id));
                            remember(preset.id);
                          }}
                          className="text-[9px] text-indigo-200 px-1"
                          title="Keep the text and data, change the design"
                        >
                          Restyle
                        </button>
                      )}
                      <button onClick={() => toggleFavourite(preset.id)} title="Favourite" className="p-0.5">
                        <Star className={`w-3 h-3 ${favourites.includes(preset.id) ? "fill-amber-300 text-amber-300" : "text-slate-500"}`} />
                      </button>
                    </span>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-xs text-slate-400 py-6 text-center">No presets match this search.</div>
        )}
      </div>
    </div>
  );
};

function FilterToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md text-[10px] font-medium ${active ? "bg-white/15 text-white" : "bg-white/5 text-slate-400"}`}
    >
      {label}
    </button>
  );
}

function resolveTokens(preset: ElementPreset, source: "theme" | "original", grayscale: boolean, themeId?: string): DesignColorTokens | null {
  const design = preset.design;
  const baked = preset.defaultContent?.design?.tokens as DesignColorTokens | undefined;
  if (!design || !baked) return null;
  let tokens = baked;
  if (source === "theme" && themeId) {
    tokens = tokensFromTheme(themeId, design.familyId) || baked;
  }
  return grayscale ? grayscaleTokens(tokens) : tokens;
}

const PresetThumbnail: React.FC<{
  preset: ElementPreset;
  source: "theme" | "original";
  grayscale: boolean;
  themeId?: string;
  tall?: boolean;
}> = ({ preset, source, grayscale, themeId, tall }) => {
  const tokens = resolveTokens(preset, source, grayscale, themeId);
  const frameHeight = tall ? 150 : 68;
  if (!tokens || !preset.design) {
    const text = String(preset.defaultContent?.text || preset.defaultContent?.title || preset.name);
    return (
      <div className="h-[68px] overflow-hidden px-2 py-1.5" style={{ background: preset.defaultStyle.backgroundColor || "#f8fafc", color: preset.defaultStyle.color || "#0f172a" }}>
        <div className="text-[10px] font-semibold leading-tight line-clamp-3">{text}</div>
      </div>
    );
  }
  const width = preset.defaultTransform.width;
  const height = preset.defaultTransform.height;
  const scale = Math.min(248 / width, frameHeight / height);
  const frame = frameFromLayout(preset.design.structure, tokens, preset.design.role as DesignRole, "hairline");
  const ground = frame.background === "transparent" ? tokens.paper : frame.background;
  return (
    <div style={{ height: frameHeight, overflow: "hidden", background: ground, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <LayoutView
          dsl={preset.design.structure}
          tokens={tokens}
          content={preset.defaultContent}
          width={width}
          role={preset.design.role}
          showNumber
          decoration="standard"
          spacing={preset.design.role === "chapter" ? "generous" : "normal"}
          border="hairline"
        />
      </div>
    </div>
  );
};
