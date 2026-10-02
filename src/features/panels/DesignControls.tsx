"use client";

import { PageFrameControls } from "./PageFrameControls";
import React, { useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { FAMILY_LIST } from "../../editor/design/families";
import { PALETTE_LIST } from "../../editor/design/palettes";
import { DesignBorder, DesignDecoration, DesignSpacing } from "../../domain/element/types";
import { Palette, Sparkles, Sliders, ChevronDown } from "lucide-react";

export const DesignControls: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const book = useEditorStore((s) => s.getActiveBook());
  const applyDesignSystem = useEditorStore((s) => s.applyDesignSystem);
  const saved = book?.designSystem;

  const [familyId, setFamilyId] = useState(saved?.familyId || "contemporary-academic");
  const [paletteId, setPaletteId] = useState(saved?.paletteId || "academic-teal");
  const [scope, setScope] = useState<"selection" | "page" | "chapter" | "book">("page");
  const [decoration, setDecoration] = useState<DesignDecoration>(saved?.decoration || "standard");
  const [spacing, setSpacing] = useState<DesignSpacing>(saved?.spacing || "normal");
  const [border, setBorder] = useState<DesignBorder>(saved?.border || "hairline");
  const [showNumber, setShowNumber] = useState(saved?.showNumber ?? true);
  const [replaceOverrides, setReplaceOverrides] = useState(false);

  const family = FAMILY_LIST.find((item) => item.id === familyId);
  const paletteChoices = family
    ? PALETTE_LIST.filter((palette) => family.palettes.includes(palette.id))
    : PALETTE_LIST;
  const currentPalette = PALETTE_LIST.find((palette) => palette.id === paletteId);

  const apply = () => {
    applyDesignSystem({
      scope,
      familyId,
      paletteId,
      decoration,
      spacing,
      border,
      showNumber,
      replaceOverrides,
    });
  };

  return (
    <div className={`${compact ? "shrink-0 border-t border-slate-200 dark:border-white/10 p-2" : "mb-3"} space-y-2.5`}>
      {!compact && (
        <details className="rounded-xl border border-slate-200 dark:border-white/10 p-2.5 bg-slate-50/50 dark:bg-white/[0.02] group">
          <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <span>Chapter border & background</span>
            </span>
            <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="pt-2">
            <PageFrameControls />
          </div>
        </details>
      )}

      {/* Book Design Section Card */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 p-2.5 bg-slate-50/70 dark:bg-white/[0.03] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>Book Design System</span>
          </div>
          {currentPalette && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
              {currentPalette.name}
            </span>
          )}
        </div>

        {/* 1. Family & Palette Selector */}
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Family</label>
            <select
              value={familyId}
              onChange={(event) => {
                const next = event.target.value;
                setFamilyId(next);
                const match = FAMILY_LIST.find((item) => item.id === next);
                if (match && !match.palettes.includes(paletteId)) setPaletteId(match.defaultPalette);
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              {FAMILY_LIST.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Palette</label>
            <select
              value={paletteId}
              onChange={(event) => setPaletteId(event.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              {paletteChoices.map((palette) => (
                <option key={palette.id} value={palette.id} title={palette.intent}>{palette.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!compact && currentPalette?.intent && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug px-1 line-clamp-1" title={`${family?.description || ''} • ${currentPalette.intent}`}>
            {currentPalette.intent}
          </div>
        )}

        {/* 2. Target Scope & Apply Action */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="flex-1">
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as typeof scope)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="selection">Selected element</option>
              <option value="page">Current page</option>
              <option value="chapter">This chapter</option>
              <option value="book">Entire book</option>
            </select>
          </div>
          <button
            onClick={apply}
            className="flex-1 py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            <span>Apply System</span>
          </button>
        </div>

        {/* 3. Collapsible Fine-Tuning */}
        {!compact && (
          <details className="border-t border-slate-200/80 dark:border-white/10 pt-1.5 mt-1 group/details">
            <summary className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer flex items-center justify-between select-none py-1">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-slate-400" />
                <span>Layout & Typography Details</span>
              </span>
              <span className="text-[9px] text-slate-400 group-open/details:rotate-180 transition-transform">▼</span>
            </summary>

            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">Decoration</label>
                  <select
                    value={decoration}
                    onChange={(event) => setDecoration(event.target.value as DesignDecoration)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-1.5 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="restrained">Restrained</option>
                    <option value="standard">Standard</option>
                    <option value="expressive">Expressive</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">Spacing</label>
                  <select
                    value={spacing}
                    onChange={(event) => setSpacing(event.target.value as DesignSpacing)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-1.5 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="tight">Tight spacing</option>
                    <option value="normal">Normal spacing</option>
                    <option value="generous">Generous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">Border</label>
                  <select
                    value={border}
                    onChange={(event) => setBorder(event.target.value as DesignBorder)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-1.5 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="none">No border</option>
                    <option value="hairline">Hairline</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 cursor-pointer pb-1">
                    <input
                      type="checkbox"
                      checked={showNumber}
                      onChange={(event) => setShowNumber(event.target.checked)}
                      className="rounded border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Show numbers</span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={replaceOverrides}
                  onChange={(event) => setReplaceOverrides(event.target.checked)}
                  className="rounded border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Replace local style edits</span>
              </label>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};
