"use client";

import React, { useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { FAMILY_LIST } from "../../editor/design/families";
import { PALETTE_LIST } from "../../editor/design/palettes";
import { DesignBorder, DesignDecoration, DesignSpacing } from "../../domain/element/types";

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
    <div className={`${compact ? "shrink-0 border-t border-white/10 p-2" : "mb-3"} space-y-2`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Book design</div>
      <div className="grid grid-cols-2 gap-1.5">
        <select value={familyId} onChange={(event) => {
          const next = event.target.value;
          setFamilyId(next);
          const match = FAMILY_LIST.find((item) => item.id === next);
          if (match && !match.palettes.includes(paletteId)) setPaletteId(match.defaultPalette);
        }} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
          {FAMILY_LIST.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select value={paletteId} onChange={(event) => setPaletteId(event.target.value)} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
          {paletteChoices.map((palette) => (
            <option key={palette.id} value={palette.id} title={palette.intent}>{palette.name}</option>
          ))}
        </select>
      </div>
      {!compact && (
        <>
          <p className="text-[10px] text-slate-400 leading-snug">{family?.description}</p>
          <p className="text-[10px] text-slate-500 leading-snug">
            {PALETTE_LIST.find((palette) => palette.id === paletteId)?.intent}
          </p>
        </>
      )}
      <div className={compact ? "" : "grid grid-cols-2 gap-1.5"}>
        <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
          <option value="selection">Selection</option>
          <option value="page">This page</option>
          <option value="chapter">This chapter</option>
          <option value="book">Entire book</option>
        </select>
        {!compact && (
          <select value={decoration} onChange={(event) => setDecoration(event.target.value as DesignDecoration)} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
            <option value="restrained">Restrained decoration</option>
            <option value="standard">Standard decoration</option>
            <option value="expressive">Expressive decoration</option>
          </select>
        )}
      </div>
      {!compact && (
        <div className="grid grid-cols-2 gap-1.5">
          <select value={spacing} onChange={(event) => setSpacing(event.target.value as DesignSpacing)} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
            <option value="tight">Tight spacing</option>
            <option value="normal">Normal spacing</option>
            <option value="generous">Generous spacing</option>
          </select>
          <select value={border} onChange={(event) => setBorder(event.target.value as DesignBorder)} className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-200">
            <option value="none">No border</option>
            <option value="hairline">Hairline border</option>
            <option value="standard">Standard border</option>
          </select>
        </div>
      )}
      {!compact && (
        <>
          <label className="flex items-center gap-2 text-[10px] text-slate-300">
            <input type="checkbox" checked={showNumber} onChange={(event) => setShowNumber(event.target.checked)} />
            Show numbers
          </label>
          <label className="flex items-center gap-2 text-[10px] text-slate-300">
            <input type="checkbox" checked={replaceOverrides} onChange={(event) => setReplaceOverrides(event.target.checked)} />
            Replace local style edits
          </label>
        </>
      )}
      <button onClick={apply} className="w-full py-1.5 rounded-lg bg-indigo-500 text-white text-[11px] font-semibold active:scale-[0.99]">
        Apply family and palette
      </button>
    </div>
  );
};
