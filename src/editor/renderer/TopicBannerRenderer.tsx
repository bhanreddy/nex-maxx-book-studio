"use client";

import React, { useMemo, useRef, useState } from "react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { getSignaturePreset, SIGNATURE_SUBJECT_PRESETS } from "../curriculum/signatureElements";
import { applySignatureElementsToChapter } from "../curriculum/applySignatureElements";
import {
  Sparkles,
  Edit3,
  Check,
  RefreshCw,
  Palette,
  Zap,
} from "lucide-react";

interface TopicBannerRendererProps {
  block: SmartBlockInstance;
  selected?: boolean;
  locked?: boolean;
  elementId?: string;
}

export function TopicBannerRenderer({
  block,
  selected = false,
  locked = false,
  elementId,
}: TopicBannerRendererProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const activePage = useEditorStore((s) => s.getActivePage());
  const showToast = useUiStore((s) => s.showToast);

  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  const def = useMemo(() => getSignaturePreset(subject), [subject]);

  const c = block.semanticContent;
  const word1 = c.title || def.topicBanner.word1 || "SUCCESSOR";
  const connector = c.badgeLabel || def.topicBanner.connector || "AND";
  const word2 = c.subtitle || def.topicBanner.word2 || "PREDECESSOR";
  const introDesc = c.introText || def.topicBanner.subtitle;

  // Inline editing state
  const [editingField, setEditingField] = useState<"word1" | "connector" | "word2" | "desc" | null>(null);
  const [draft, setDraft] = useState("");
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [paletteTheme, setPaletteTheme] = useState<"clay-sunset" | "clay-nature" | "clay-ocean" | "clay-berry">("clay-sunset");

  const inputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<SmartBlockInstance["semanticContent"]>) => {
    const targetId = elementId || block.id;
    updateElement(targetId, {
      smartBlockData: {
        ...block,
        semanticContent: {
          ...block.semanticContent,
          ...patch,
        },
      },
    });
  };

  const handleStartEdit = (field: "word1" | "connector" | "word2" | "desc", val: string) => {
    if (locked) return;
    setEditingField(field);
    setDraft(val);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveField = () => {
    if (!editingField) return;
    const trimmed = draft.trim();
    if (editingField === "word1") {
      update({ title: trimmed || "SUCCESSOR" });
    } else if (editingField === "connector") {
      update({ badgeLabel: trimmed || "AND" });
    } else if (editingField === "word2") {
      update({ subtitle: trimmed || "PREDECESSOR" });
    } else if (editingField === "desc") {
      update({ introText: trimmed });
    }
    setEditingField(null);
  };

  const handleApplySubjectPreset = (subKey: string) => {
    setShowSubjectMenu(false);
    const preset = SIGNATURE_SUBJECT_PRESETS[subKey]?.topicBanner;
    if (preset) {
      update({
        title: preset.word1,
        badgeLabel: preset.connector,
        subtitle: preset.word2,
        introText: preset.subtitle,
      });
      showToast({
        type: "success",
        title: `${subKey} Topic Applied`,
        message: `Topic Banner updated: ${preset.word1} ${preset.connector} ${preset.word2}`,
      });
    }
  };

  const handleApplyToAllPages = () => {
    const targetChapterId = block.curriculum?.chapterId || activePage?.chapterId;
    if (targetChapterId) {
      applySignatureElementsToChapter(targetChapterId, subject);
      showToast({
        type: "success",
        title: "Applied to Every Page of Chapter!",
        message: "Topic Banners, Fact Zones, and Life Connect styled across all chapter pages.",
      });
    } else {
      showToast({
        type: "info",
        title: "Chapter Required",
        message: "Associate this page with a chapter to stamp across all chapter pages.",
      });
    }
  };

  // Color tokens based on palette
  const colors = useMemo(() => {
    switch (paletteTheme) {
      case "clay-nature":
        return {
          ribbonBg: "#0F281E",
          coralWave: "#059669",
          purpleWave: "#34D399",
          peachWave: "#A7F3D0",
          pillBg: "#10B981",
          word2Color: "#D1FAE5",
        };
      case "clay-ocean":
        return {
          ribbonBg: "#0C2340",
          coralWave: "#0284C7",
          purpleWave: "#38BDF8",
          peachWave: "#BAE6FD",
          pillBg: "#0284C7",
          word2Color: "#E0F2FE",
        };
      case "clay-berry":
        return {
          ribbonBg: "#2A0E35",
          coralWave: "#D946EF",
          purpleWave: "#A855F7",
          peachWave: "#F5D0FE",
          pillBg: "#C026D3",
          word2Color: "#FAE8FF",
        };
      case "clay-sunset":
      default:
        return {
          ribbonBg: "#111827",
          coralWave: "#F97316",
          purpleWave: "#A78BFA",
          peachWave: "#FED7AA",
          pillBg: "#EF4444",
          word2Color: "#FDBA74",
        };
    }
  }, [paletteTheme]);

  return (
    <div
      className={`relative w-full select-none transition-all duration-150 ${
        selected ? "ring-2 ring-indigo-500/80 ring-offset-2 rounded-3xl" : ""
      }`}
      style={{ minHeight: "120px", paddingTop: "26px", paddingBottom: "6px", boxSizing: "border-box" }}
    >
      {/* QUICK FLOATING TOOLBAR */}
      <div className="absolute top-0 left-4 right-4 flex items-center justify-between pointer-events-auto z-40">
        <div className="flex items-center gap-1.5 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/10 text-xs">
          <span className="font-extrabold text-[10px] tracking-widest uppercase text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> TOPIC BANNER
          </span>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Subject Preset Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSubjectMenu(!showSubjectMenu)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{subject}</span>
            </button>

            {showSubjectMenu && (
              <div className="absolute left-0 mt-1 w-52 max-h-64 overflow-y-auto bg-slate-900 border border-white/15 rounded-xl shadow-2xl py-1 z-50 text-xs divide-y divide-white/10">
                {Object.keys(SIGNATURE_SUBJECT_PRESETS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplySubjectPreset(key)}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 font-medium flex items-center justify-between"
                  >
                    <span>{key}</span>
                    <span className="text-[9px] text-slate-400">
                      {SIGNATURE_SUBJECT_PRESETS[key].topicBanner.word1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Palette Switcher */}
          <button
            type="button"
            onClick={() => {
              const palettes: Array<"clay-sunset" | "clay-nature" | "clay-ocean" | "clay-berry"> = [
                "clay-sunset",
                "clay-nature",
                "clay-ocean",
                "clay-berry",
              ];
              const next = palettes[(palettes.indexOf(paletteTheme) + 1) % palettes.length];
              setPaletteTheme(next);
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white px-2 py-0.5 rounded hover:bg-white/10"
            title="Cycle 3D color palette"
          >
            <Palette className="w-3 h-3 text-pink-400" />
            <span className="capitalize">{paletteTheme.replace("clay-", "")}</span>
          </button>
        </div>

        {/* APPLY TO ALL CHAPTER PAGES BUTTON */}
        <button
          type="button"
          onClick={handleApplyToAllPages}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] px-3.5 py-1 rounded-full shadow-lg border border-emerald-400/40 cursor-pointer transition-transform hover:scale-105"
          title="Apply this versatile design system to every page of this chapter"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Apply to Every Page of Chapter</span>
        </button>
      </div>

      {/* ================= 3D WAVY ORGANIC RIBBON BANNER (MATCHES IMAGE 2) ================= */}
      <div className="relative w-full flex flex-col items-center justify-center pt-2">
        <div className="relative w-full max-w-[820px] mx-auto flex items-center justify-center">
          {/* SVG LAYERED ORGANIC CLAY WAVES & DROPLETS */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <svg
              viewBox="0 0 800 130"
              preserveAspectRatio="none"
              className="w-full h-full drop-shadow-[0_12px_24px_rgba(15,23,42,0.28)]"
            >
              <defs>
                {/* Ribbon body gradient */}
                <linearGradient id="ribbonDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="50%" stopColor="#0F172A" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>

                {/* Peach bottom wave gradient */}
                <linearGradient id="peachWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FED7AA" />
                  <stop offset="50%" stopColor="#FDBA74" />
                  <stop offset="100%" stopColor="#FB923C" />
                </linearGradient>

                {/* Lavender wave gradient */}
                <linearGradient id="lavenderWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#DDD6FE" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>

                {/* Coral curl gradient */}
                <linearGradient id="coralWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FB923C" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>

              {/* 1. Peach & Golden bottom wavy rim */}
              <path
                d="M 30 75 Q 160 120 400 110 T 770 70 Q 790 95 765 118 Q 400 135 30 115 Z"
                fill="url(#peachWaveGrad)"
                opacity="0.95"
              />

              {/* 2. Lavender / Purple accent curve behind right side */}
              <path
                d="M 520 25 Q 640 10 750 35 Q 780 75 730 110 Q 620 125 520 115 Z"
                fill="url(#lavenderWaveGrad)"
                opacity="0.9"
              />

              {/* 3. Magenta / Berry crest peeking top right */}
              <path
                d="M 580 18 Q 660 8 720 28 Q 650 38 580 18 Z"
                fill="#F43F5E"
                opacity="0.85"
              />

              {/* 4. Coral Organic Blob on the far left */}
              <path
                d="M 45 40 C 25 15, 60 5, 85 28 C 110 50, 95 85, 65 80 C 40 75, 20 60, 45 40 Z"
                fill="url(#coralWaveGrad)"
              />

              {/* 5. Smooth Floating 3D Clay Droplets / Pearls */}
              {/* Left purple droplet */}
              <circle cx="35" cy="42" r="7" fill="#C084FC" />
              <circle cx="33" cy="40" r="2" fill="#FFFFFF" opacity="0.8" />

              {/* Left small coral droplet */}
              <circle cx="68" cy="18" r="4.5" fill="#FB923C" />
              <circle cx="66.5" cy="16.5" r="1.5" fill="#FFFFFF" opacity="0.8" />

              {/* Right purple droplet */}
              <circle cx="765" cy="40" r="6" fill="#A855F7" />
              <circle cx="763" cy="38" r="1.8" fill="#FFFFFF" opacity="0.8" />

              {/* Right small coral pearl */}
              <circle cx="780" cy="80" r="5" fill="#FB7185" />
              <circle cx="778.5" cy="78.5" r="1.5" fill="#FFFFFF" opacity="0.8" />

              {/* 6. MAIN WAVY 3D RIBBON BODY */}
              <path
                d="M 35 68 C 120 18, 300 22, 420 50 C 540 78, 680 75, 765 48 C 775 62, 770 78, 755 88 C 680 115, 530 112, 410 88 C 290 62, 110 65, 42 92 C 30 85, 28 75, 35 68 Z"
                fill="url(#ribbonDarkGrad)"
                stroke="#334155"
                strokeWidth="2.5"
              />

              {/* Beveled highlight along the ribbon top ridge */}
              <path
                d="M 38 68 C 120 20, 300 24, 420 52 C 540 80, 680 77, 762 50"
                fill="none"
                stroke="#64748B"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* MAIN 3D DISPLAY TYPOGRAPHY + CONFETTI */}
          <div
            className="relative flex items-center justify-center flex-wrap gap-2 sm:gap-3.5 px-6 sm:px-12 py-6 sm:py-8 z-10"
            style={{ minHeight: "90px" }}
          >
            {/* Playful Confetti Sparks & Sprinkles on the Left */}
            <div className="absolute left-6 sm:left-12 top-4 pointer-events-none select-none">
              <svg viewBox="0 0 30 30" className="w-6 h-6">
                <line x1="6" y1="12" x2="2" y2="10" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="8" y1="20" x2="3" y2="24" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="14" y1="6" x2="16" y2="2" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* WORD 1 (e.g. "SUCCESSOR") in 3D Puffy Cream/White */}
            {editingField === "word1" ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveField();
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  className="rounded px-2 py-1 text-lg sm:text-xl font-black bg-white text-slate-900 border-2 border-amber-400 outline-none uppercase tracking-wide"
                />
                <button
                  type="button"
                  onClick={handleSaveField}
                  className="p-1.5 rounded-lg bg-emerald-500 text-white font-bold"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="cursor-pointer group/w1 relative transition-transform hover:scale-105"
                onClick={() => handleStartEdit("word1", word1)}
                title="Click to edit first word"
              >
                <h1
                  className="font-sans font-black tracking-wider uppercase text-2xl sm:text-3xl md:text-4xl text-[#FFFBF5]"
                  style={{
                    textShadow:
                      "0 1px 0 #CBD5E1, 0 2px 0 #94A3B8, 0 3px 0 #64748B, 0 4px 6px rgba(0,0,0,0.6)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {word1}
                </h1>
                <Edit3 className="absolute -top-2 -right-3 w-3 h-3 text-amber-300 opacity-0 group-hover/w1:opacity-100 transition-opacity" />
              </div>
            )}

            {/* CONNECTOR PILL BADGE (e.g. "AND") in 3D Coral/Red Pill */}
            {connector && (
              <>
                {editingField === "connector" ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveField();
                        if (e.key === "Escape") setEditingField(null);
                      }}
                      className="rounded px-2 py-0.5 text-xs font-black bg-white text-slate-900 border border-red-400 outline-none uppercase w-16"
                    />
                    <button
                      type="button"
                      onClick={handleSaveField}
                      className="p-1 rounded bg-emerald-500 text-white font-bold"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer group/conn relative transition-transform hover:scale-110"
                    onClick={() => handleStartEdit("connector", connector)}
                    title="Click to edit connector badge"
                  >
                    <div
                      className="px-3.5 py-1 rounded-full text-white font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_4px_10px_rgba(239,68,68,0.5)] border border-white/30"
                      style={{
                        backgroundColor: colors.pillBg,
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                      }}
                    >
                      {connector}
                    </div>
                    <Edit3 className="absolute -top-2 -right-2 w-2.5 h-2.5 text-white opacity-0 group-hover/conn:opacity-100 transition-opacity" />
                  </div>
                )}
              </>
            )}

            {/* WORD 2 (e.g. "PREDECESSOR") in 3D Peach/Apricot */}
            {word2 && (
              <>
                {editingField === "word2" ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveField();
                        if (e.key === "Escape") setEditingField(null);
                      }}
                      className="rounded px-2 py-1 text-lg sm:text-xl font-black bg-white text-slate-900 border-2 border-amber-400 outline-none uppercase tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={handleSaveField}
                      className="p-1.5 rounded-lg bg-emerald-500 text-white font-bold"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer group/w2 relative transition-transform hover:scale-105"
                    onClick={() => handleStartEdit("word2", word2)}
                    title="Click to edit second word"
                  >
                    <h2
                      className="font-sans font-black tracking-wider uppercase text-2xl sm:text-3xl md:text-4xl"
                      style={{
                        color: colors.word2Color,
                        textShadow:
                          "0 1px 0 #F97316, 0 2px 0 #EA580C, 0 3px 0 #C2410C, 0 4px 6px rgba(0,0,0,0.6)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {word2}
                    </h2>
                    <Edit3 className="absolute -top-2 -right-3 w-3 h-3 text-amber-300 opacity-0 group-hover/w2:opacity-100 transition-opacity" />
                  </div>
                )}
              </>
            )}

            {/* Playful Confetti Sparks on the Right */}
            <div className="absolute right-6 sm:right-12 top-4 pointer-events-none select-none">
              <svg viewBox="0 0 30 30" className="w-6 h-6">
                <line x1="16" y1="12" x2="24" y2="10" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="14" y1="20" x2="22" y2="24" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="10" y1="6" x2="12" y2="2" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Supporting Explanatory Subtitle / Concept Bridge */}
        {introDesc && (
          <div
            className="mt-1 text-center max-w-xl mx-auto px-4 cursor-pointer group/desc"
            onClick={() => handleStartEdit("desc", introDesc)}
            title="Click to edit topic description"
          >
            {editingField === "desc" ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveField();
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-indigo-400 rounded px-2 py-1 outline-none text-center"
                />
                <button
                  type="button"
                  onClick={handleSaveField}
                  className="px-2 py-1 rounded bg-emerald-500 text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-xs font-medium text-[#475569] tracking-wide select-none">
                {introDesc}
                <Edit3 className="inline-block w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/desc:opacity-100 transition-opacity ml-1" />
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
