/**
 * NEX MAXX Book Studio - Global Styles & Design Tokens Studio
 * 
 * Centralized design tokens management:
 * - Typography (scale, fonts, line-heights)
 * - Colours & Palettes
 * - Spacing, Radius, Borders, Shadows
 * - Paragraph & Heading Styles
 * - Subject Themes
 * 
 * Changes propagate book-wide to all linked elements safely.
 */

"use client";

import { commitDocumentChange } from "../../editor/core/documentTransaction";
import React, { useState, useEffect } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import {
  DEFAULT_DESIGN_TOKENS,
  GlobalDesignTokens,
  propagateGlobalTokensToBook,
} from "../../domain/theme/globalTokens";
import {
  X,
  Palette,
  Type,
  Maximize2,
  Box,
  Check,
  Sparkles,
  Layers,
} from "lucide-react";

export const DesignTokensModal: React.FC = () => {
  const { designTokensModalOpen, setDesignTokensModalOpen, showToast } = useUiStore();
  const { getActiveBook, elements } = useEditorStore();

  const book = getActiveBook();

  const [activeTab, setActiveTab] = useState<"typography" | "colors" | "geometry" | "themes">("typography");
  const [tokens, setTokens] = useState<GlobalDesignTokens>(DEFAULT_DESIGN_TOKENS);

  useEffect(() => { if (designTokensModalOpen) setTokens(structuredClone(book?.globalTokens || DEFAULT_DESIGN_TOKENS)); }, [designTokensModalOpen, book?.id]);

  if (!designTokensModalOpen || !book) return null;

  const handleApplyGlobally = () => {
    const result = propagateGlobalTokensToBook(tokens, book, elements);

    commitDocumentChange('Apply global design tokens', result.updatedBook, result.updatedElements);
    showToast({
      type: "success",
      title: "Global Tokens Applied",
      message: `Updated ${result.updatedElementsCount} linked elements across the entire book.`,
    });
    setDesignTokensModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      onClick={() => setDesignTokensModalOpen(false)}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Design Tokens" className="w-full max-w-3xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Global Styles & Design Tokens Studio
                <span className="text-[10px] bg-violet-500/20 text-violet-300 font-mono px-2 py-0.5 rounded-full border border-violet-500/30">
                  SYSTEM TOKENS
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Centralized typography, colors, spacing, radius, and subject themes with global cascade
              </p>
            </div>
          </div>
          <button
            aria-label="Close design tokens"
            onClick={() => setDesignTokensModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 border-b border-white/10 bg-black/20 gap-2">
          {[
            { id: "typography", label: "Typography & Scale", icon: Type },
            { id: "colors", label: "Colors & Palettes", icon: Palette },
            { id: "geometry", label: "Spacing & Geometry", icon: Box },
            { id: "themes", label: "Subject Themes", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#0e131d]">
          {activeTab === "typography" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Display & Heading Font
                  </label>
                  <select
                    value={tokens.typography.headingFont}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        typography: { ...tokens.typography, headingFont: e.target.value },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="Outfit, sans-serif">Outfit (Modern Display)</option>
                    <option value="Inter, sans-serif">Inter (Clean Neutral)</option>
                    <option value="Georgia, serif">Georgia (Classic Editorial)</option>
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Body & Reading Font
                  </label>
                  <select
                    value={tokens.typography.bodyFont}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        typography: { ...tokens.typography, bodyFont: e.target.value },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none"
                  >
                    <option value="Inter, sans-serif">Inter (Optimized for Reading)</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="system-ui, sans-serif">System UI</option>
                  </select>
                </div>
              </div>

              {/* Type Scale Preview & Editor */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Harmonic Type Scale (pt)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Chapter H1</label>
                    <input
                      type="number"
                      value={tokens.typography.scale.h1}
                      onChange={(e) =>
                        setTokens({
                          ...tokens,
                          typography: {
                            ...tokens.typography,
                            scale: { ...tokens.typography.scale, h1: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Section H2</label>
                    <input
                      type="number"
                      value={tokens.typography.scale.h2}
                      onChange={(e) =>
                        setTokens({
                          ...tokens,
                          typography: {
                            ...tokens.typography,
                            scale: { ...tokens.typography.scale, h2: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Body Text</label>
                    <input
                      type="number"
                      step="0.5"
                      value={tokens.typography.scale.body}
                      onChange={(e) =>
                        setTokens({
                          ...tokens,
                          typography: {
                            ...tokens.typography,
                            scale: { ...tokens.typography.scale, body: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "colors" && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Primary Brand & Educational Palette
              </span>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Primary Accent", key: "primary", val: tokens.colors.primary },
                  { label: "Secondary Tint", key: "secondary", val: tokens.colors.secondary },
                  { label: "Attention Accent", key: "accent", val: tokens.colors.accent },
                  { label: "Surface Background", key: "surface", val: tokens.colors.surface },
                  { label: "Body Text Color", key: "text", val: tokens.colors.text },
                  { label: "Border Color", key: "border", val: tokens.colors.border },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/30">
                    <span className="text-xs text-slate-200">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{item.val}</span>
                      <input
                        type="color"
                        value={item.val}
                        onChange={(e) =>
                          setTokens({
                            ...tokens,
                            colors: { ...tokens.colors, [item.key]: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "geometry" && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Spacing, Corners, Borders & Shadows
              </span>
              <div className="grid grid-cols-2 gap-4">
                <label className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2 text-xs text-slate-200">
                  <span className="block font-semibold">Smart component inset (pt)</span>
                  <input aria-label="Smart component inset" type="number" min="4" max="48" value={tokens.spacing.md}
                    onChange={event => setTokens({ ...tokens, spacing: { ...tokens.spacing, md: Math.max(4, Math.min(48, Number(event.target.value))) } })}
                    className="w-full rounded border border-white/10 bg-slate-800 p-2" />
                </label>
                <label className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2 text-xs text-slate-200">
                  <span className="block font-semibold">Smart component column gap (pt)</span>
                  <input aria-label="Smart component column gap" type="number" min="0" max="36" value={tokens.spacing.sm}
                    onChange={event => setTokens({ ...tokens, spacing: { ...tokens.spacing, sm: Math.max(0, Math.min(36, Number(event.target.value))) } })}
                    className="w-full rounded border border-white/10 bg-slate-800 p-2" />
                </label>
                <label className="col-span-2 p-4 rounded-xl border border-white/10 bg-black/30 space-y-2 text-xs text-slate-200">
                  <span className="block font-semibold">Linked card shadow</span>
                  <select aria-label="Linked card shadow" value={tokens.shadows.subtle}
                    onChange={event => setTokens({ ...tokens, shadows: { ...tokens.shadows, subtle: event.target.value } })}
                    className="w-full rounded border border-white/10 bg-slate-800 p-2">
                    {[...new Set(['none', DEFAULT_DESIGN_TOKENS.shadows.subtle, DEFAULT_DESIGN_TOKENS.shadows.elevated, DEFAULT_DESIGN_TOKENS.shadows.floating, tokens.shadows.subtle])].map((shadow, index) => <option key={shadow} value={shadow}>{['Flat', 'Subtle', 'Elevated', 'Floating'][index] || 'Custom'}</option>)}
                  </select>
                  <span className="block text-slate-400">Editor decoration. Print proofs retain vector fills and borders.</span>
                </label>
                <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2">
                  <span className="text-xs font-semibold text-slate-200 block">Card Corner Radius (pt)</span>
                  <div className="flex gap-2">
                    {[0, 4, 8, 12, 16].map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          setTokens({
                            ...tokens,
                            radius: { ...tokens.radius, md: r },
                          })
                        }
                        className={`flex-1 py-1.5 rounded text-xs font-mono border transition-all ${
                          tokens.radius.md === r
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {r}pt
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-2">
                  <span className="text-xs font-semibold text-slate-200 block">Standard Border Width</span>
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2].map((bw) => (
                      <button
                        key={bw}
                        onClick={() =>
                          setTokens({
                            ...tokens,
                            borders: { ...tokens.borders, standardPt: bw },
                          })
                        }
                        className={`flex-1 py-1.5 rounded text-xs font-mono border transition-all ${
                          tokens.borders.standardPt === bw
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {bw}pt
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "themes" && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Choose Subject Theme
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "math", name: "Mathematics", desc: "Navy & Emerald precision grids", color: "#4f46e5" },
                  { id: "science", name: "Science & Biology", desc: "Cyan & Botanical Green curiosity", color: "#0891b2" },
                  { id: "english", name: "English & Literature", desc: "Warm Editorial Burgundy & Ochre", color: "#800020" },
                  { id: "social", name: "Social Studies & History", desc: "Terracotta & Earth tones", color: "#b45309" },
                  { id: "computing", name: "Computer Science", desc: "Violet & Terminal Cyberpunk", color: "#7c3aed" },
                  { id: "early", name: "Early Learning", desc: "Playful Pastel & Vibrant shapes", color: "#ea580c" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setTokens({ ...tokens, subjectThemeId: st.id, name: `${st.name} publishing theme`, colors: { ...tokens.colors, primary: st.color, secondary: st.color, focusRing: st.color } })}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      tokens.subjectThemeId === st.id
                        ? "bg-violet-600/20 border-violet-500 text-white shadow-lg"
                        : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <div>
                      <strong className="block text-xs font-semibold text-slate-100">{st.name}</strong>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">{st.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Updates all linked headings, text, cards, and colors book-wide</span>
          </div>
          <button
            onClick={handleApplyGlobally}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            Apply Tokens Globally
          </button>
        </div>
      </div>
    </div>
  );
};
