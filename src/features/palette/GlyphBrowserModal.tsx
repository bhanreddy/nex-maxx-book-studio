"use client";

import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { X, Search, Check } from "lucide-react";

const GLYPH_CATEGORIES = [
  {
    name: "Math & Operators",
    glyphs: ["±", "×", "÷", "≈", "≠", "≤", "≥", "√", "∞", "∑", "∏", "∆", "∫", "∂", "∝", "≡", "∼", "≅"],
  },
  {
    name: "Greek Scientific",
    glyphs: ["α", "β", "γ", "δ", "ε", "θ", "λ", "μ", "π", "ρ", "σ", "φ", "ψ", "ω", "Ω", "Δ", "Σ", "Φ"],
  },
  {
    name: "Fractions & Exponents",
    glyphs: ["½", "⅓", "¼", "¾", "⅛", "⅜", "⅝", "⅞", "¹", "²", "³", "⁰", "⁴", "⁵", "₆", "₁", "₂", "₃"],
  },
  {
    name: "Arrows & Logic",
    glyphs: ["←", "→", "↑", "↓", "↔", "↕", "⇒", "⇐", "⇔", "∴", "∵", "∈", "∉", "⊂", "⊃", "∪", "∩", "∀"],
  },
  {
    name: "Units & Currency",
    glyphs: ["₹", "$", "€", "£", "¥", "°C", "°F", "Å", "µm", "nm", "mL", "cm²", "m³", "%", "‰", "K"],
  },
  {
    name: "Symbols & Bullets",
    glyphs: ["•", "–", "—", "“", "”", "‘", "’", "†", "‡", "§", "¶", "✓", "✗", "★", "☆", "○", "●", "▲"],
  },
];

export const GlyphBrowserModal: React.FC = () => {
  const { glyphBrowserOpen, setGlyphBrowserOpen, showToast } = useUiStore();
  const { selectedElementIds, elements, updateElementContent } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null);

  if (!glyphBrowserOpen) return null;

  const singleElement = selectedElementIds.length === 1 ? elements[selectedElementIds[0]] : null;

  const handleInsert = (glyph: string) => {
    setSelectedGlyph(glyph);

    if (singleElement && typeof singleElement.content.text === "string") {
      const updated = singleElement.content.text + " " + glyph;
      updateElementContent(singleElement.id, { text: updated });
      showToast({
        type: "success",
        title: `Inserted "${glyph}" into ${singleElement.displayName}`,
      });
    } else {
      navigator.clipboard.writeText(glyph);
      showToast({
        type: "info",
        title: `Copied "${glyph}" to Clipboard`,
      });
    }

    setTimeout(() => setSelectedGlyph(null), 1200);
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setGlyphBrowserOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl p-5 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="font-bold text-sm text-slate-100 block">Glyph & Symbol Browser</span>
            <span className="text-[11px] text-slate-400">
              Click any symbol to insert into active text frame or copy
            </span>
          </div>
          <button
            onClick={() => setGlyphBrowserOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative my-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search symbols, math operators, units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Categories Grid */}
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {GLYPH_CATEGORIES.map((cat) => {
            const filtered = cat.glyphs.filter((g) =>
              g.toLowerCase().includes(searchQuery.toLowerCase()) ||
              cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length === 0) return null;

            return (
              <div key={cat.name}>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  {cat.name}
                </span>
                <div className="grid grid-cols-9 gap-1.5">
                  {filtered.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => handleInsert(g)}
                      className={`h-9 rounded-lg border text-base font-serif flex items-center justify-center transition-all ${
                        selectedGlyph === g
                          ? "bg-emerald-600 text-white border-emerald-400 scale-105"
                          : "bg-white/5 border-white/5 hover:border-indigo-500/50 hover:bg-white/10 text-slate-200"
                      }`}
                      title={g}
                    >
                      {selectedGlyph === g ? <Check className="w-4 h-4" /> : g}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Target: {singleElement ? singleElement.displayName : "Clipboard"}</span>
          <button
            onClick={() => setGlyphBrowserOpen(false)}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
