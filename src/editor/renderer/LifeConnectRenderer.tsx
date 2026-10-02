"use client";

import React, { useMemo, useRef, useState } from "react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { getSignaturePreset, SIGNATURE_SUBJECT_PRESETS, LifeConnectConfig } from "../curriculum/signatureElements";
import { applySignatureElementsToChapter } from "../curriculum/applySignatureElements";
import {
  Sparkles,
  Edit3,
  Check,
  Zap,
  Globe,
  Compass,
} from "lucide-react";

interface LifeConnectRendererProps {
  block: SmartBlockInstance;
  selected?: boolean;
  locked?: boolean;
  elementId?: string;
}

export function LifeConnectRenderer({
  block,
  selected = false,
  locked = false,
  elementId,
}: LifeConnectRendererProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const activePage = useEditorStore((s) => s.getActivePage());
  const showToast = useUiStore((s) => s.showToast);

  const subject = block.curriculum?.subjectLabel || block.subject || "Science";
  const def = useMemo(() => getSignaturePreset(subject), [subject]);

  const c = block.semanticContent;
  const word1 = c.badgeLabel || def.lifeConnect.word1 || "LIFE";
  const word2 = c.title || def.lifeConnect.word2 || "CONNECT";
  const subtitle = c.subtitle || def.lifeConnect.subtitle;
  const prompt = c.calloutText || c.introText || def.lifeConnect.prompt;
  const illustration = (c.iconName || def.lifeConnect.illustration || "planting-boy") as LifeConnectConfig["illustration"];

  // Inline editing state
  const [editingField, setEditingField] = useState<"word1" | "word2" | "prompt" | null>(null);
  const [draft, setDraft] = useState("");
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showIllustrationMenu, setShowIllustrationMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleStartEdit = (field: "word1" | "word2" | "prompt", val: string) => {
    if (locked) return;
    setEditingField(field);
    setDraft(val);
    setTimeout(() => {
      if (field === "prompt") textareaRef.current?.focus();
      else inputRef.current?.focus();
    }, 50);
  };

  const handleSaveField = () => {
    if (!editingField) return;
    const trimmed = draft.trim();
    if (editingField === "word1") {
      update({ badgeLabel: trimmed || "LIFE" });
    } else if (editingField === "word2") {
      update({ title: trimmed || "CONNECT" });
    } else if (editingField === "prompt") {
      update({ calloutText: trimmed, introText: trimmed });
    }
    setEditingField(null);
  };

  const handleApplySubjectPreset = (subKey: string) => {
    setShowSubjectMenu(false);
    const preset = SIGNATURE_SUBJECT_PRESETS[subKey]?.lifeConnect;
    if (preset) {
      update({
        badgeLabel: preset.word1,
        title: preset.word2,
        subtitle: preset.subtitle,
        calloutText: preset.prompt,
        introText: preset.prompt,
        iconName: preset.illustration,
      });
      showToast({
        type: "success",
        title: `${subKey} Life Connect Applied`,
        message: `Updated banner: ${preset.word1} ${preset.word2}`,
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
        message: "Life Connect, Topic Banners, and Fact Zones added across all chapter pages.",
      });
    } else {
      showToast({
        type: "info",
        title: "Chapter Required",
        message: "Associate this page with a chapter to stamp across all chapter pages.",
      });
    }
  };

  return (
    <div
      className={`relative w-full h-full select-none transition-all duration-150 ${
        selected ? "ring-2 ring-indigo-500/80 ring-offset-2 rounded-3xl" : ""
      }`}
      style={{ minHeight: "135px", paddingTop: "26px", paddingBottom: "8px", boxSizing: "border-box" }}
    >
      {/* QUICK FLOATING TOOLBAR */}
      <div className="absolute top-0 left-4 right-4 flex items-center justify-between pointer-events-auto z-40">
        <div className="flex items-center gap-1.5 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/10 text-xs">
          <span className="font-extrabold text-[10px] tracking-widest uppercase text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3" /> LIFE CONNECT
          </span>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Subject Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSubjectMenu(!showSubjectMenu)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{subject}</span>
            </button>

            {showSubjectMenu && (
              <div className="absolute left-0 mt-1 w-52 max-h-64 overflow-y-auto bg-slate-900 border border-white/15 rounded-xl shadow-2xl py-1 z-50 text-xs divide-y divide-white/10">
                {Object.keys(SIGNATURE_SUBJECT_PRESETS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplySubjectPreset(key)}
                    className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 font-medium flex items-center justify-between"
                  >
                    <span>{key}</span>
                    <span className="text-[9px] text-slate-400">
                      {SIGNATURE_SUBJECT_PRESETS[key].lifeConnect.word1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Illustration Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIllustrationMenu(!showIllustrationMenu)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white px-2 py-0.5 rounded hover:bg-white/10"
              title="Change illustration character"
            >
              <Compass className="w-3 h-3 text-cyan-400" />
              <span className="capitalize">{illustration.replace("-", " ")}</span>
            </button>

            {showIllustrationMenu && (
              <div className="absolute left-0 mt-1 w-44 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                {[
                  { id: "planting-boy", label: "Planting Boy" },
                  { id: "measuring-girl", label: "Reading Girl" },
                  { id: "market-shopping", label: "Market Shopping" },
                  { id: "nature-explorer", label: "Nature Explorer" },
                  { id: "digital-coder", label: "Digital Coder" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      update({ iconName: item.id });
                      setShowIllustrationMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1 rounded hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 font-medium flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    {illustration === item.id && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
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

      {/* ================= MAIN 3D FOLDED RIBBON BANNER (MATCHES IMAGE 3) ================= */}
      <div className="relative w-full max-w-[840px] mx-auto pt-2">
        <div className="relative flex items-center">
          {/* 1. Folded Ribbon Left Origami Wings */}
          <div className="relative shrink-0 flex items-center z-10">
            {/* Plum/Burgundy bottom tuck flap */}
            <div
              className="absolute -bottom-3 left-3 w-10 h-6 bg-[#581C87] rounded-bl-lg shadow-md"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 60%)",
                transform: "skewY(12deg)",
                zIndex: 1,
              }}
            />
            {/* Coral/Red folded ribbon corner */}
            <div
              className="relative w-9 sm:w-11 h-14 sm:h-16 bg-gradient-to-r from-[#EF4444] to-[#F97316] rounded-l-md shadow-md flex items-center justify-center"
              style={{
                clipPath: "polygon(0 20%, 100% 0, 100% 100%, 0 80%)",
                zIndex: 2,
              }}
            >
              <div className="w-full h-full bg-black/10" />
            </div>
          </div>

          {/* 2. Main Dark Navy Banner Bar */}
          <div
            className="relative flex-1 -ml-2 bg-gradient-to-r from-[#0B2545] via-[#13315C] to-[#0F294D] text-white py-3 sm:py-4 px-6 sm:px-10 rounded-r-2xl shadow-[0_10px_24px_rgba(11,37,69,0.35)] flex items-center justify-between border-t border-[#1E4B82]"
            style={{
              zIndex: 3,
              minHeight: "68px",
            }}
          >
            {/* Bright Cyan / Teal Bottom Accent Bevel */}
            <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#00A896] via-[#06B6D4] to-[#00A896] rounded-br-2xl" />

            {/* Display Dual-Tone Typography: "LIFE CONNECT" */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* WORD 1: "LIFE" in bright 3D white sans-serif */}
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
                    className="rounded px-2 py-0.5 text-xl font-black bg-white text-slate-900 border border-cyan-400 outline-none uppercase w-28"
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
                  className="cursor-pointer group/w1 relative transition-transform hover:scale-105"
                  onClick={() => handleStartEdit("word1", word1)}
                  title="Click to edit first word"
                >
                  <h2
                    className="font-sans font-black tracking-wider uppercase text-2xl sm:text-3xl md:text-4xl text-white select-none"
                    style={{
                      textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {word1}
                  </h2>
                  <Edit3 className="absolute -top-1.5 -right-3 w-3 h-3 text-cyan-300 opacity-0 group-hover/w1:opacity-100 transition-opacity" />
                </div>
              )}

              {/* WORD 2: "CONNECT" in coral / peach */}
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
                    className="rounded px-2 py-0.5 text-xl font-black bg-white text-slate-900 border border-orange-400 outline-none uppercase w-36"
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
                  className="cursor-pointer group/w2 relative transition-transform hover:scale-105"
                  onClick={() => handleStartEdit("word2", word2)}
                  title="Click to edit second word"
                >
                  <h2
                    className="font-sans font-black tracking-wider uppercase text-2xl sm:text-3xl md:text-4xl text-[#FF7556] select-none"
                    style={{
                      textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {word2}
                  </h2>
                  <Edit3 className="absolute -top-1.5 -right-3 w-3 h-3 text-amber-300 opacity-0 group-hover/w2:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>

          {/* 3. RIGHT TEARDROP / PEBBLE MEDALLION BADGE (MATCHES IMAGE 3) */}
          <div
            className="relative -ml-6 sm:-ml-8 shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center cursor-pointer group"
            style={{ zIndex: 10 }}
            onClick={() => setShowIllustrationMenu(!showIllustrationMenu)}
            title="Click to change illustration"
          >
            {/* SVG Layered Asymmetric Organic Pebble / Teardrop Badge */}
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_10px_20px_rgba(15,23,42,0.35)]">
              {/* Outer Dark Teal Pebble contour */}
              <path
                d="M 60 10 C 95 10, 115 35, 112 70 C 110 98, 80 115, 45 110 C 15 105, 5 80, 10 50 C 15 20, 35 10, 60 10 Z"
                fill="#0E4A56"
              />

              {/* Middle Plum / Purple Contour */}
              <path
                d="M 60 14 C 90 14, 108 38, 105 68 C 103 94, 76 109, 45 105 C 18 100, 9 78, 14 50 C 18 24, 38 14, 60 14 Z"
                fill="#7E22CE"
              />

              {/* Coral / Persimmon Inner Bezel Contour */}
              <path
                d="M 60 18 C 86 18, 102 40, 100 66 C 98 90, 72 104, 45 100 C 22 96, 14 76, 18 50 C 22 28, 40 18, 60 18 Z"
                fill="#FF6B4A"
              />

              {/* Circular Inner Window for Illustration */}
              <circle cx="60" cy="60" r="38" fill="#F0FDF4" />
              <circle cx="60" cy="60" r="38" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>

            {/* ILLUSTRATION INSIDE THE CIRCULAR WINDOW */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {illustration === "planting-boy" && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Sky & Clouds background */}
                    <circle cx="50" cy="50" r="37" fill="#E0F2FE" />
                    <circle cx="35" cy="35" r="10" fill="#FFFFFF" opacity="0.6" />
                    <circle cx="48" cy="32" r="8" fill="#FFFFFF" opacity="0.6" />

                    {/* Cozy building silhouettes in distance */}
                    <rect x="25" y="45" width="10" height="20" fill="#CBD5E1" opacity="0.5" />
                    <rect x="68" y="42" width="12" height="25" fill="#E2E8F0" opacity="0.5" />

                    {/* Radiating joy sparks above boy's head */}
                    <line x1="38" y1="20" x2="35" y2="15" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="48" y1="18" x2="48" y2="12" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="58" y1="20" x2="62" y2="15" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Boy Character: Hair */}
                    <path d="M 32 38 C 30 25, 45 20, 60 23 C 68 25, 72 32, 68 40 C 65 38, 55 35, 48 38 C 40 40, 35 40, 32 38 Z" fill="#1E293B" />

                    {/* Face */}
                    <circle cx="50" cy="42" r="14" fill="#FED7AA" />

                    {/* Round Glasses */}
                    <circle cx="44" cy="42" r="5" fill="none" stroke="#1E293B" strokeWidth="1.8" />
                    <circle cx="56" cy="42" r="5" fill="none" stroke="#1E293B" strokeWidth="1.8" />
                    <line x1="49" y1="42" x2="51" y2="42" stroke="#1E293B" strokeWidth="1.8" />

                    {/* Happy Eyes inside glasses */}
                    <circle cx="44" cy="42" r="1.5" fill="#1E293B" />
                    <circle cx="56" cy="42" r="1.5" fill="#1E293B" />

                    {/* Smile */}
                    <path d="M 47 48 Q 50 51 53 48" fill="none" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />

                    {/* White Shirt / Collar & Red Tie */}
                    <path d="M 40 56 L 60 56 L 56 68 L 44 68 Z" fill="#FFFFFF" />
                    <path d="M 47 56 L 50 62 L 53 56 Z" fill="#EF4444" />

                    {/* Blue Backpack Straps */}
                    <path d="M 38 56 Q 34 65 38 72" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 62 56 Q 66 65 62 72" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />

                    {/* Soil Mound */}
                    <ellipse cx="50" cy="80" rx="30" ry="10" fill="#78350F" />

                    {/* Plant Sapling held in hands */}
                    <path d="M 50 78 L 50 65" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 50 70 Q 42 66 45 60 Q 52 64 50 70 Z" fill="#22C55E" />
                    <path d="M 50 66 Q 58 62 55 56 Q 48 60 50 66 Z" fill="#16A34A" />

                    {/* Hands holding the soil/sapling */}
                    <ellipse cx="44" cy="74" rx="4" ry="3" fill="#FDBA74" />
                    <ellipse cx="56" cy="74" rx="4" ry="3" fill="#FDBA74" />
                  </svg>
                </div>
              )}

              {illustration === "measuring-girl" && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="37" fill="#FEF3C7" />
                    <circle cx="50" cy="40" r="14" fill="#FDE68A" />
                    <path d="M35 35 Q50 20 65 35 Q60 55 35 35" fill="#92400E" />
                    <circle cx="45" cy="40" r="1.5" fill="#1E293B" />
                    <circle cx="55" cy="40" r="1.5" fill="#1E293B" />
                    <path d="M47 45 Q50 48 53 45" stroke="#92400E" strokeWidth="1.5" fill="none" />
                    {/* Book / ruler */}
                    <rect x="36" y="55" width="28" height="18" rx="2" fill="#3B82F6" />
                    <rect x="40" y="58" width="20" height="12" fill="#FFFFFF" />
                  </svg>
                </div>
              )}

              {illustration === "market-shopping" && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="37" fill="#DCFCE7" />
                    <path d="M32 45 L68 45 L62 75 L38 75 Z" fill="#F59E0B" />
                    <path d="M42 45 Q50 30 58 45" fill="none" stroke="#B45309" strokeWidth="3" />
                    {/* Apples */}
                    <circle cx="45" cy="55" r="5" fill="#EF4444" />
                    <circle cx="55" cy="55" r="5" fill="#10B981" />
                    <circle cx="50" cy="62" r="5" fill="#F97316" />
                  </svg>
                </div>
              )}

              {illustration === "nature-explorer" && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="37" fill="#E0F2FE" />
                    <circle cx="50" cy="40" r="13" fill="#FED7AA" />
                    {/* Explorer hat */}
                    <ellipse cx="50" cy="32" rx="20" ry="6" fill="#D97706" />
                    <path d="M40 32 Q50 22 60 32 Z" fill="#B45309" />
                    {/* Compass */}
                    <circle cx="50" cy="65" r="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                    <polygon points="50,58 53,65 50,72 47,65" fill="#EF4444" />
                  </svg>
                </div>
              )}

              {illustration === "digital-coder" && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="37" fill="#EEF2FF" />
                    <circle cx="50" cy="38" r="13" fill="#FED7AA" />
                    {/* Headphones */}
                    <path d="M34 38 Q50 20 66 38" fill="none" stroke="#4F46E5" strokeWidth="3" />
                    <rect x="32" y="36" width="5" height="10" rx="2" fill="#4338CA" />
                    <rect x="63" y="36" width="5" height="10" rx="2" fill="#4338CA" />
                    {/* Laptop with code */}
                    <rect x="36" y="58" width="28" height="18" rx="2" fill="#1E293B" />
                    <polyline points="42,65 46,67 42,69" stroke="#10B981" strokeWidth="1.5" fill="none" />
                    <line x1="48" y1="67" x2="56" y2="67" stroke="#38BDF8" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-World Connection Prompt Card */}
        {prompt && (
          <div className="mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#00A896]/15 text-[#00A896] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                ✦
              </div>
              <div className="flex-1 min-w-0">
                {subtitle && (
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#00A896] mb-1">
                    {subtitle}
                  </h4>
                )}

                {editingField === "prompt" ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full text-xs font-medium text-slate-800 bg-white border border-indigo-400 rounded-lg p-2 outline-none"
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleSaveField}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p
                    className="text-xs font-medium text-[#334155] leading-relaxed cursor-pointer group/prompt select-none"
                    onClick={() => handleStartEdit("prompt", prompt)}
                    title="Click to edit real-world connection prompt"
                  >
                    {prompt}
                    <Edit3 className="inline-block w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/prompt:opacity-100 transition-opacity ml-1" />
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
