"use client";

import React, { useMemo, useRef, useState } from "react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import {
  getSignaturePreset,
  SIGNATURE_SUBJECT_PRESETS,
  applySignatureElementsToChapter,
} from "../curriculum/signatureElements";
import {
  Sparkles,
  BookOpen,
  Edit3,
  Check,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";

interface FactZoneRendererProps {
  block: SmartBlockInstance;
  selected?: boolean;
  locked?: boolean;
  elementId?: string;
}

export function FactZoneRenderer({
  block,
  selected = false,
  locked = false,
  elementId,
}: FactZoneRendererProps) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const activeBook = useEditorStore((s) => s.getActiveBook());
  const activePage = useEditorStore((s) => s.getActivePage());
  const showToast = useUiStore((s) => s.showToast);

  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  const def = useMemo(() => getSignaturePreset(subject), [subject]);

  const c = block.semanticContent;
  const badgeTitle = c.badgeLabel || c.title || def.factZone.badgeTitle || "FACT ZONE";
  const factText = c.calloutText || c.introText || def.factZone.factText;
  const bullets = c.items && c.items.length > 0 ? c.items : def.factZone.bullets;
  const rightIllustration = c.iconName || def.factZone.rightIllustration || "books";

  // Editing state
  const [isEditingBadge, setIsEditingBadge] = useState(false);
  const [badgeDraft, setBadgeDraft] = useState(badgeTitle);

  const [isEditingText, setIsEditingText] = useState(false);
  const [textDraft, setTextDraft] = useState(factText);

  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null);
  const [bulletDraft, setBulletDraft] = useState("");

  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showIconMenu, setShowIconMenu] = useState(false);

  const badgeInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const bulletInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<SmartBlockInstance["semanticContent"]>) => {
    if (locked || block.isLockedContent) return;
    useEditorStore.getState().updateSmartBlockContent(elementId || block.id, patch);
  };

  const handleSaveBadge = () => {
    setIsEditingBadge(false);
    const next = badgeDraft.trim() || "FACT ZONE";
    update({ badgeLabel: next, title: next });
  };

  const handleSaveText = () => {
    setIsEditingText(false);
    const next = textDraft.trim();
    if (next) {
      update({ calloutText: next, introText: next });
    }
  };

  const handleSaveBullet = (idx: number) => {
    setEditingBulletIndex(null);
    const updated = [...bullets];
    if (bulletDraft.trim()) {
      updated[idx] = bulletDraft.trim();
    } else {
      updated.splice(idx, 1);
    }
    update({ items: updated });
  };

  const handleAddBullet = () => {
    const updated = [...bullets, "Add an interesting fact or rule here..."];
    update({ items: updated });
  };

  const handleRemoveBullet = (idx: number) => {
    const updated = bullets.filter((_, i) => i !== idx);
    update({ items: updated });
  };

  const handleApplySubjectPreset = (subKey: string) => {
    setShowSubjectMenu(false);
    const preset = SIGNATURE_SUBJECT_PRESETS[subKey]?.factZone;
    if (preset) {
      update({
        badgeLabel: preset.badgeTitle,
        title: preset.badgeTitle,
        calloutText: preset.factText,
        introText: preset.factText,
        items: preset.bullets,
        iconName: preset.rightIllustration,
      });
      showToast({
        type: "success",
        title: `${subKey} Preset Applied`,
        message: `Fact Zone updated with authentic ${subKey} trivia.`,
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
        message: "Fact Zone, Topic Banners, and Life Connect added across all chapter pages.",
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
      style={{
        minHeight: "115px",
        paddingTop: "28px",
        paddingBottom: "8px",
        boxSizing: "border-box",
      }}
    >
      {/* QUICK FLOATING TOOLBAR (WHEN SELECTED OR HOVERED) */}
      <div className="absolute top-0 left-4 right-4 flex items-center justify-between pointer-events-auto z-40">
        <div className="flex items-center gap-1.5 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/10 text-xs">
          <span className="font-extrabold text-[10px] tracking-widest uppercase text-cyan-400 flex items-center gap-1">
            <Zap className="w-3 h-3" /> FACT ZONE
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
              <div className="absolute left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-slate-900 border border-white/15 rounded-xl shadow-2xl py-1 z-50 text-xs divide-y divide-white/10">
                {Object.keys(SIGNATURE_SUBJECT_PRESETS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplySubjectPreset(key)}
                    className="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 font-medium flex items-center justify-between"
                  >
                    <span>{key}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Load</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-3 w-px bg-white/20 mx-1" />

          {/* Icon Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIconMenu(!showIconMenu)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 hover:text-white px-2 py-0.5 rounded hover:bg-white/10"
              title="Change right badge illustration"
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span className="capitalize">{rightIllustration}</span>
            </button>

            {showIconMenu && (
              <div className="absolute left-0 mt-1 w-40 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-1 z-50 text-xs space-y-0.5">
                {[
                  { id: "books", label: "3D Books" },
                  { id: "flask", label: "Science Flask" },
                  { id: "plant", label: "Eco Plant" },
                  { id: "globe", label: "World Globe" },
                  { id: "abacus", label: "Math Abacus" },
                  { id: "laptop", label: "Tech Laptop" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      update({ iconName: item.id });
                      setShowIconMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1 rounded hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 font-medium flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    {rightIllustration === item.id && <Check className="w-3 h-3 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBullet}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded hover:bg-cyan-500/20"
            title="Add another fact point"
          >
            <Plus className="w-3 h-3" /> Fact
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

      {/* ================= MAIN CONTAINER BODY (MATCHES IMAGE 1) ================= */}
      <div className="relative w-full h-full pt-4 box-border">
        {/* Underneath Cyan / Teal Support Tab (Right bottom accent) */}
        <div
          className="absolute -bottom-1 right-8 w-28 h-5 bg-gradient-to-r from-[#00A896] to-[#00C4B4] rounded-br-[14px] rounded-bl-[10px] opacity-90 shadow-md"
          style={{ zIndex: 1 }}
        />

        {/* Outer Pill Container Frame with 3D Bevel and Depth */}
        <div
          className="relative w-full h-full rounded-full bg-[#FFFDF8] border-[3.5px] border-[#1E2C5B] shadow-[0_10px_24px_rgba(20,32,70,0.18)] pl-6 pr-20 py-3.5 flex items-center justify-between"
          style={{
            zIndex: 2,
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(180,190,215,0.35), 0 8px 20px -2px rgba(22,34,72,0.18)",
            minHeight: "72px",
          }}
        >
          {/* Inner lavender hairline stroke */}
          <div
            className="absolute inset-[2px] rounded-full border border-[#CBD5E1]/70 pointer-events-none"
            style={{ zIndex: 1 }}
          />

          {/* ================= LEFT TAB: "FACT ZONE" + LIGHTBULB MEDALLION ================= */}
          <div
            className="absolute -top-4 left-3 sm:left-5 flex items-center cursor-pointer group"
            style={{ zIndex: 10 }}
            onClick={() => {
              if (locked) return;
              setIsEditingBadge(true);
              setBadgeDraft(badgeTitle);
              setTimeout(() => badgeInputRef.current?.focus(), 50);
            }}
            title="Click to edit Fact Zone label"
          >
            {/* 1. Circular Medallion with Lightbulb */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full shadow-[0_4px_10px_rgba(18,34,70,0.35)] flex items-center justify-center">
              {/* Outer decorative multi-tone ring (Coral top arc, teal rim) */}
              <svg viewBox="0 0 54 54" className="w-full h-full drop-shadow-sm">
                {/* Dark border */}
                <circle cx="27" cy="27" r="26" fill="#16294A" />
                {/* Coral accent arc at top left */}
                <path
                  d="M10 20 A24 24 0 0 1 27 3"
                  fill="none"
                  stroke="#FF7556"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Teal rim */}
                <circle cx="27" cy="27" r="22" fill="#00A896" />
                {/* Cream interior */}
                <circle cx="27" cy="27" r="18" fill="#FFF9F2" />
                {/* Inner shadow */}
                <circle cx="27" cy="27" r="18" fill="none" stroke="#E2D9CC" strokeWidth="1.5" />
              </svg>

              {/* Vector 3D Lightbulb */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none">
                  {/* Glowing filament */}
                  <path
                    d="M9 18h6m-5 3h4m-5-8c-1.5-1.2-2.5-3-2.5-5 0-3.3 2.7-6 6-6s6 2.7 6 6c0 2-1 3.8-2.5 5-.7.6-1.5 1.5-1.5 3h-4c0-1.5-.8-2.4-1.5-3z"
                    stroke="#16294A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="#FFDE59"
                  />
                  {/* Light spark ticks */}
                  <line x1="12" y1="1" x2="12" y2="2.5" stroke="#16294A" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="4.5" y1="4.5" x2="5.5" y2="5.5" stroke="#16294A" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="19.5" y1="4.5" x2="18.5" y2="5.5" stroke="#16294A" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* 2. Navy Blue Banner Tab with Angled Cut */}
            <div className="relative -ml-2.5 flex items-center">
              <div
                className="relative bg-gradient-to-r from-[#142348] via-[#1B3264] to-[#16294A] text-white px-4 sm:px-5 py-1 sm:py-1.5 rounded-tl-[10px] rounded-br-[16px] border-t-2 border-b-2 border-r-2 border-[#2C467E] shadow-[0_4px_10px_rgba(20,35,74,0.3)] flex items-center gap-1.5"
                style={{
                  clipPath: "polygon(0 0, 90% 0, 100% 100%, 0 100%)",
                  paddingRight: "24px",
                }}
              >
                {/* Top cyan accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00E5D0] to-transparent" />
                {/* Bottom cyan accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00A896] to-transparent" />

                {isEditingBadge ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={badgeInputRef}
                      type="text"
                      value={badgeDraft}
                      onChange={(e) => setBadgeDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveBadge();
                        if (e.key === "Escape") setIsEditingBadge(false);
                      }}
                      className="rounded px-2 py-0.5 text-xs font-black bg-white text-slate-900 border border-cyan-400 outline-none w-28 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleSaveBadge}
                      className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                      title="Save badge"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 font-sans font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-sm select-none">
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {badgeTitle}
                    </span>
                    <Edit3 className="w-2.5 h-2.5 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                  </div>
                )}
              </div>

              {/* Purple Accent Chamfer Tab */}
              <div
                className="w-2.5 h-7 bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9] rounded-r-md -ml-1 shadow-sm"
                style={{ transform: "skewX(-15deg)" }}
              />
            </div>
          </div>

          {/* ================= CENTER: EDITABLE FACT CONTENT / BULLETS ================= */}
          <div className="flex-1 min-w-0 pr-16 sm:pr-24 pl-2 sm:pl-4 pt-4 sm:pt-2">
            {isEditingText ? (
              <div className="w-full flex items-start gap-2">
                <textarea
                  ref={textInputRef}
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-white border border-indigo-400 rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none leading-relaxed"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleSaveText}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                className="cursor-pointer group/text"
                onClick={() => {
                  if (locked) return;
                  setIsEditingText(true);
                  setTextDraft(factText);
                  setTimeout(() => textInputRef.current?.focus(), 50);
                }}
                title="Click to edit fact statement"
              >
                <p className="text-xs sm:text-sm font-medium text-[#1E293B] leading-relaxed tracking-wide select-none">
                  {factText}
                  <Edit3 className="inline-block w-3 h-3 text-slate-400 opacity-0 group-hover/text:opacity-100 transition-opacity ml-1.5" />
                </p>
              </div>
            )}

            {/* Bullets List (if present) */}
            {bullets && bullets.length > 0 && (
              <div className="mt-2 space-y-1">
                {bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2 group/bullet text-xs text-[#334155]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A896] shrink-0" />
                    {editingBulletIndex === idx ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          ref={bulletInputRef}
                          type="text"
                          value={bulletDraft}
                          onChange={(e) => setBulletDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveBullet(idx);
                            if (e.key === "Escape") setEditingBulletIndex(null);
                          }}
                          className="flex-1 rounded px-2 py-0.5 text-xs bg-white border border-indigo-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveBullet(idx)}
                          className="p-1 rounded bg-emerald-500 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-between">
                        <span
                          className="cursor-pointer hover:text-indigo-600 font-medium"
                          onClick={() => {
                            if (locked) return;
                            setEditingBulletIndex(idx);
                            setBulletDraft(bullet);
                            setTimeout(() => bulletInputRef.current?.focus(), 50);
                          }}
                        >
                          {bullet}
                        </span>
                        <div className="opacity-0 group-hover/bullet:opacity-100 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveBullet(idx)}
                            className="p-0.5 text-slate-400 hover:text-red-500 rounded"
                            title="Remove bullet"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= RIGHT MEDALLION: STACKED 3D BOOKS (MATCHES IMAGE 1) ================= */}
          <div
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-[0_8px_20px_rgba(20,35,74,0.35)] flex items-center justify-center cursor-pointer group"
            style={{ zIndex: 20 }}
            onClick={() => setShowIconMenu(!showIconMenu)}
            title="Click to change illustration"
          >
            {/* Multi-layered 3D circular frame */}
            <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-md">
              {/* Teal base outer ring */}
              <circle cx="40" cy="40" r="38" fill="#00B4A4" />
              {/* Navy bezel rim */}
              <circle cx="40" cy="40" r="35" fill="#1E2C5B" />
              {/* Purple accent ring */}
              <circle cx="40" cy="40" r="32" fill="#8B5CF6" />
              {/* Cream center disc */}
              <circle cx="40" cy="40" r="29" fill="#FFFDF8" />
              <circle cx="40" cy="40" r="29" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
            </svg>

            {/* ILLUSTRATION INSIDE MEDALLION */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {rightIllustration === "books" && (
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm">
                    {/* Teal radiating sparks at top right */}
                    <line x1="48" y1="12" x2="54" y2="8" stroke="#00B4A4" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="53" y1="18" x2="60" y2="16" stroke="#00B4A4" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="51" y1="24" x2="57" y2="25" stroke="#00B4A4" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Bottom Teal Book */}
                    <rect x="12" y="38" width="36" height="9" rx="3" fill="#00A896" />
                    <rect x="14" y="40" width="30" height="5" rx="1.5" fill="#E2F5F2" />
                    <rect x="12" y="38" width="6" height="9" rx="2" fill="#008072" />
                    <line x1="22" y1="42.5" x2="38" y2="42.5" stroke="#008072" strokeWidth="1.2" strokeLinecap="round" />

                    {/* Middle Coral/Pink Book */}
                    <rect x="12" y="28" width="36" height="9" rx="3" fill="#F87171" />
                    <rect x="14" y="30" width="30" height="5" rx="1.5" fill="#FEF2F2" />
                    <rect x="12" y="28" width="6" height="9" rx="2" fill="#DC2626" />
                    <line x1="22" y1="32.5" x2="38" y2="32.5" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" />

                    {/* Top Navy/Blue Book */}
                    <rect x="14" y="18" width="34" height="9" rx="3" fill="#1E3A8A" />
                    <rect x="16" y="20" width="28" height="5" rx="1.5" fill="#F0F4FF" />
                    <rect x="14" y="18" width="6" height="9" rx="2" fill="#172554" />
                    <line x1="24" y1="22.5" x2="38" y2="22.5" stroke="#172554" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {rightIllustration === "flask" && (
                <svg viewBox="0 0 36 36" className="w-8 h-8 text-emerald-600">
                  <path d="M14 6h8v4h-1.5l5.5 13a3 3 0 0 1-2.8 4H12.8a3 3 0 0 1-2.8-4l5.5-13H14V6z" fill="#D1FAE5" stroke="#059669" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M12 21h12l1.5 4a2 2 0 0 1-1.9 2.5H10.4a2 2 0 0 1-1.9-2.5l3.5-4z" fill="#10B981" />
                  <circle cx="16" cy="24" r="1.5" fill="#FFFFFF" />
                  <circle cx="21" cy="23" r="1" fill="#FFFFFF" />
                </svg>
              )}

              {rightIllustration === "plant" && (
                <svg viewBox="0 0 36 36" className="w-8 h-8">
                  <path d="M18 30V16" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M18 22c-6 0-9-5-9-9 4 0 9 3 9 9z" fill="#34D399" stroke="#059669" strokeWidth="1.5" />
                  <path d="M18 17c6 0 9-4 9-8-4 0-9 2-9 8z" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
                  <ellipse cx="18" cy="30" rx="8" ry="3" fill="#D97706" />
                </svg>
              )}

              {rightIllustration === "globe" && (
                <svg viewBox="0 0 36 36" className="w-8 h-8">
                  <circle cx="18" cy="18" r="12" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
                  <path d="M10 18a8 8 0 0 0 16 0M18 6a12 12 0 0 0 0 24M18 6a12 12 0 0 1 0 24" stroke="#0284C7" strokeWidth="1.5" />
                  <path d="M14 12c2 1 4 0 5 2s-1 4-3 4-2-4-2-6z" fill="#38BDF8" />
                </svg>
              )}

              {rightIllustration === "abacus" && (
                <svg viewBox="0 0 36 36" className="w-8 h-8 text-amber-600">
                  <rect x="8" y="8" width="20" height="20" rx="3" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                  <line x1="8" y1="14" x2="28" y2="14" stroke="#D97706" strokeWidth="1.5" />
                  <line x1="8" y1="22" x2="28" y2="22" stroke="#D97706" strokeWidth="1.5" />
                  <circle cx="13" cy="14" r="2.5" fill="#EF4444" />
                  <circle cx="19" cy="14" r="2.5" fill="#3B82F6" />
                  <circle cx="15" cy="22" r="2.5" fill="#10B981" />
                  <circle cx="23" cy="22" r="2.5" fill="#F59E0B" />
                </svg>
              )}

              {rightIllustration === "laptop" && (
                <svg viewBox="0 0 36 36" className="w-8 h-8 text-indigo-600">
                  <rect x="9" y="10" width="18" height="12" rx="2" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
                  <path d="M6 25h24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="#4F46E5" />
                  <polyline points="15 14 13 16 15 18" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
                  <polyline points="19 14 21 16 19 18" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
