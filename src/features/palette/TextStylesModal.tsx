"use client";

import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { TextStyleDefinition } from "../../domain/book/types";
import { X, Type, Check } from "lucide-react";

export const TextStylesModal: React.FC = () => {
  const { textStylesModalOpen, setTextStylesModalOpen, showToast } = useUiStore();
  const { getActiveBook, updateTextStyle, applyTextStyle, selectedElementIds } = useEditorStore();

  const book = getActiveBook();
  const [selectedStyleId, setSelectedStyleId] = useState<string>("ts-ch-title");

  if (!textStylesModalOpen || !book) return null;

  const styles = book.textStyles || [];
  const currentStyle = styles.find((s) => s.id === selectedStyleId) || styles[0];

  const handleUpdate = (updates: Partial<TextStyleDefinition>) => {
    if (!currentStyle) return;
    updateTextStyle(currentStyle.id, updates);
  };

  const handleApplyToSelection = () => {
    if (!currentStyle || selectedElementIds.length === 0) {
      showToast({
        type: "warning",
        title: "No Element Selected",
        message: "Select a text element on the canvas to apply this style.",
      });
      return;
    }
    selectedElementIds.forEach((id) => applyTextStyle(id, currentStyle.id));
    setTextStylesModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setTextStylesModalOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">
                Publishing Typography Styles Studio
              </span>
              <span className="text-[11px] text-slate-400">
                Book-wide paragraph and character style system with global cascade updates
              </span>
            </div>
          </div>
          <button
            onClick={() => setTextStylesModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Styles Split View */}
        <div className="flex gap-4 my-4 flex-1 overflow-hidden min-h-[320px]">
          {/* Left: Style list */}
          <div className="w-48 border-r border-white/10 pr-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Book Styles ({styles.length})
            </span>
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStyleId(s.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  s.id === selectedStyleId
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Right: Style Editor */}
          {currentStyle && (
            <div className="flex-1 space-y-3.5 overflow-y-auto pl-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Style Name
                </span>
                <input
                  type="text"
                  value={currentStyle.name}
                  onChange={(e) => handleUpdate({ name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Font Family & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Font Family
                  </span>
                  <select
                    value={currentStyle.fontFamily}
                    onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Outfit, sans-serif">Outfit (Display)</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Merriweather, serif">Merriweather (Serif)</option>
                    <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Weight
                  </span>
                  <select
                    value={currentStyle.fontWeight}
                    onChange={(e) =>
                      handleUpdate({
                        fontWeight: parseInt(e.target.value) as 400 | 500 | 600 | 700 | 800,
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                  </select>
                </div>
              </div>

              {/* Size, LineHeight, LetterSpacing */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Size (pt)
                  </span>
                  <input
                    type="number"
                    value={currentStyle.fontSize}
                    onChange={(e) => handleUpdate({ fontSize: parseFloat(e.target.value) || 10 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 text-center outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Leading
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={currentStyle.lineHeight}
                    onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) || 1.4 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 text-center outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Tracking
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={currentStyle.letterSpacing}
                    onChange={(e) => handleUpdate({ letterSpacing: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 text-center outline-none"
                  />
                </div>
              </div>

              {/* Color swatch */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Text Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentStyle.color}
                    onChange={(e) => handleUpdate({ color: e.target.value })}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-slate-300">{currentStyle.color}</span>
                </div>
              </div>

              {/* Live Preview Sample */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                  Typographical Sample:
                </span>
                <div
                  style={{
                    fontFamily: currentStyle.fontFamily,
                    fontSize: `${currentStyle.fontSize}pt`,
                    fontWeight: currentStyle.fontWeight,
                    lineHeight: currentStyle.lineHeight,
                    letterSpacing: `${currentStyle.letterSpacing}pt`,
                    color: currentStyle.color,
                  }}
                >
                  The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Updating a style propagates automatically across all matching pages
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTextStylesModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              Close
            </button>
            <button
              onClick={handleApplyToSelection}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
