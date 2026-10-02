"use client";

import { useBlockContentFit } from "./useBlockContentFit";
import React, { useMemo, useRef, useState } from "react";
import type { SmartBlockInstance, StudySkillTopic } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../stores/editorStore";
import {
  studySkillTopics,
  createStudySkillTopic,
  addEmptySpaces,
  moveStudySkillTopic,
  getSubjectStudySkillDefault,
  SUBJECT_STUDY_SKILL_DEFAULTS,
} from "../curriculum/studySkills";
import { Trash2, Plus, ArrowUp, ArrowDown, Sparkles, BookOpen, Layers, Edit3, Check, RefreshCw } from "lucide-react";

interface Props {
  block: SmartBlockInstance;
  selected?: boolean;
  locked?: boolean;
  elementId?: string;
}

export function StudySkillsRenderer({
  block,
  selected = false,
  locked = false,
  elementId,
}: Props) {
  const cardRef = useBlockContentFit(block, elementId || block.id, locked);
  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  const def = useMemo(() => getSubjectStudySkillDefault(subject), [subject]);

  const topics = useMemo(() => studySkillTopics(block), [block]);
  const c = block.semanticContent;
  const o = block.styleOverrides;

  const headerPrompt = c.calloutText || c.subtitle || def.header;
  const badgeTitle = c.badgeLabel || c.title || "STUDY SKILLS";

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"badge" | "header" | null>(null);
  const [draftText, setDraftText] = useState("");
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const update = (patch: Partial<SmartBlockInstance["semanticContent"]>) => {
    if (locked || block.isLockedContent) return;
    useEditorStore.getState().updateSmartBlockContent(elementId || block.id, patch);
  };

  const handleStartEditField = (field: "badge" | "header", currentVal: string) => {
    if (locked) return;
    setEditingField(field);
    setEditingId(null);
    setDraftText(currentVal);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveField = () => {
    if (editingField === "badge") {
      update({ badgeLabel: draftText.trim() || "STUDY SKILLS", title: draftText.trim() || "STUDY SKILLS" });
    } else if (editingField === "header") {
      update({ calloutText: draftText.trim(), subtitle: draftText.trim() });
    }
    setEditingField(null);
  };

  const handleStartEditTopic = (t: StudySkillTopic) => {
    if (locked) return;
    setEditingId(t.id);
    setEditingField(null);
    setDraftText(t.text);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 50);
  };

  const handleSaveTopic = () => {
    if (!editingId) return;
    const trimmed = draftText.trim();
    const updated = topics.map(t => {
      if (t.id === editingId) {
        return {
          ...t,
          text: trimmed,
          isEmpty: trimmed.length === 0,
        };
      }
      return t;
    });
    update({
      studySkillTopics: updated,
      items: updated.map(t => t.text),
    });
    setEditingId(null);
  };

  const handleAddTopic = () => {
    const newTopic = createStudySkillTopic("New Rule / Fact", false);
    const updated = [...topics, newTopic];
    update({
      studySkillTopics: updated,
      items: updated.map(t => t.text),
    });
    handleStartEditTopic(newTopic);
  };

  const handleAddEmpty = (count = 1) => {
    const updated = addEmptySpaces(topics, count);
    update({
      studySkillTopics: updated,
      items: updated.map(t => t.text),
    });
  };

  const handleDeleteTopic = (id: string) => {
    const updated = topics.filter(t => t.id !== id);
    update({
      studySkillTopics: updated,
      items: updated.map(t => t.text),
    });
    if (editingId === id) setEditingId(null);
  };

  const handleMoveTopic = (id: string, dir: -1 | 1) => {
    const updated = moveStudySkillTopic(topics, id, dir);
    update({
      studySkillTopics: updated,
      items: updated.map(t => t.text),
    });
  };

  const handleApplyPreset = (subjKey: string, presetIndex = 0) => {
    const target = SUBJECT_STUDY_SKILL_DEFAULTS[subjKey] || SUBJECT_STUDY_SKILL_DEFAULTS.Maths;
    const preset = target.presets[presetIndex] || target.presets[0];
    const newTopics = preset.topics.map(t => createStudySkillTopic(t, false));
    update({
      calloutText: preset.header,
      subtitle: preset.header,
      studySkillTopics: newTopics,
      items: newTopics.map(t => t.text),
    });
    setShowSubjectMenu(false);
  };

  // Badge text split
  const badgeParts = badgeTitle.split(" ");
  const firstWord = badgeParts[0] || "STUDY";
  const restWords = badgeParts.slice(1).join(" ") || "SKILLS";

  return (
    <div
      className={`relative w-full h-full select-none transition-all duration-200 ${
        selected ? "ring-2 ring-indigo-500/80 shadow-2xl" : ""
      }`}
      style={{
        minHeight: 280,
      }}
      ref={cardRef}
      data-study-skills="true"
    >
      {/* CARD CONTAINER MATCHING THE REFERENCE IMAGE */}
      <div
        className="relative w-full h-full rounded-[30px] border-[2.5px] border-[#E4D8CE] bg-[#FAF7F2] p-5 sm:p-7 md:p-9 flex flex-col justify-between overflow-hidden shadow-[0_16px_36px_-10px_rgba(45,30,70,0.12),0_4px_12px_rgba(0,0,0,0.03)]"
        style={{
          fontFamily: o.fontFamily || "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* --- DECORATIVE ACCENTS --- */}

        {/* 1. Top-Left 3 Vertical Pastel Dots */}
        <div className="absolute top-[82px] left-[26px] flex flex-col gap-2 pointer-events-none opacity-85 z-10">
          <span className="w-[7px] h-[7px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[7px] h-[7px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[7px] h-[7px] rounded-full bg-[#A2B0D5]" />
        </div>

        {/* 2. Mid-Right 6 Pastel Dots Grid (2x3) */}
        <div className="absolute top-[48%] -translate-y-1/2 right-[24px] grid grid-cols-2 gap-x-2 gap-y-2 pointer-events-none opacity-85 z-10">
          <span className="w-[6px] h-[6px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[6px] h-[6px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[6px] h-[6px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[6px] h-[6px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[6px] h-[6px] rounded-full bg-[#A2B0D5]" />
          <span className="w-[6px] h-[6px] rounded-full bg-[#A2B0D5]" />
        </div>

        {/* 3. Top-Right 3D Lilac Open Book Illustration with Sparkles */}
        <div className="absolute top-[22px] right-[30px] w-20 h-16 pointer-events-none z-10 drop-shadow-sm">
          <svg viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Sparkle rays */}
            <line x1="36" y1="12" x2="30" y2="4" stroke="#A89BD8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="50" y1="8" x2="50" y2="0" stroke="#A89BD8" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="64" y1="12" x2="70" y2="4" stroke="#A89BD8" strokeWidth="2.8" strokeLinecap="round" />

            {/* Left Page (Clay Lilac) */}
            <path
              d="M50 68 C36 60 16 58 6 42 L14 26 C26 38 38 42 50 46 Z"
              fill="#C2B5EC"
              stroke="#9D8FD3"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Left page thickness shadow */}
            <path d="M6 42 L6 47 C16 63 36 65 50 73 L50 68 C36 60 16 58 6 42 Z" fill="#9D8FD3" />

            {/* Right Page (Clay Soft Purple) */}
            <path
              d="M50 68 C64 60 84 58 94 42 L86 26 C74 38 62 42 50 46 Z"
              fill="#B1A2E3"
              stroke="#9D8FD3"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Right page thickness shadow */}
            <path d="M94 42 L94 47 C84 63 64 65 50 73 L50 68 C64 60 84 58 94 42 Z" fill="#8878C2" />

            {/* Book Spine Center Glow */}
            <ellipse cx="50" cy="46" rx="3.5" ry="1.5" fill="#FFFFFF" opacity="0.8" />
          </svg>
        </div>

        {/* 4. Bottom-Left Clay Foliage (Lilac hill, sage leaves, coral berry) */}
        <div className="absolute -bottom-2 -left-2 w-36 h-36 pointer-events-none z-10">
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Soft lilac background hill */}
            <path d="M0 120 Q55 70 120 160 L0 160 Z" fill="#DDD8EB" />
            <path d="M0 135 Q40 95 90 160 L0 160 Z" fill="#CECADF" opacity="0.6" />

            {/* Back sage leaf */}
            <path
              d="M32 155 C22 100 50 65 65 55 C78 78 72 120 48 155 Z"
              fill="#6B9277"
            />
            <path d="M42 145 C48 105 58 85 65 55" stroke="#87AC92" strokeWidth="1.5" strokeLinecap="round" />

            {/* Front bright sage leaf */}
            <path
              d="M50 155 C65 115 105 105 125 110 C108 132 85 148 62 155 Z"
              fill="#86AB93"
            />
            <path d="M60 152 C78 132 98 120 125 110" stroke="#A7CBB3" strokeWidth="1.5" strokeLinecap="round" />

            {/* Glossy Coral Berry / Sphere */}
            <circle cx="34" cy="132" r="11" fill="#E87164" />
            <circle cx="31" cy="129" r="3.5" fill="#FFFFFF" opacity="0.75" />
          </svg>
        </div>

        {/* 5. Bottom-Right Layered Pastel Hills */}
        <div className="absolute -bottom-2 -right-2 w-48 h-36 pointer-events-none z-10">
          <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Lilac mound behind */}
            <path d="M60 150 Q110 50 200 100 L200 150 Z" fill="#DDD8EB" />
            {/* Peach / coral mound in front */}
            <path d="M95 150 Q150 55 200 120 L200 150 Z" fill="#F4A390" />
            <path d="M125 150 Q165 80 200 135 L200 150 Z" fill="#E88C78" opacity="0.4" />
          </svg>
        </div>

        {/* --- TOP-LEFT TAB BADGE --- */}
        <div className="relative self-start -mt-5 -ml-5 sm:-mt-7 sm:-ml-7 md:-mt-9 md:-ml-9 z-20">
          {/* Peeking Peach/Terracotta Tab Behind Badge */}
          <div
            className="absolute top-0 left-[140px] sm:left-[170px] w-14 h-11 bg-[#EE9580] rounded-t-[18px] rounded-br-[6px] shadow-sm pointer-events-none"
            style={{ zIndex: 1 }}
          />

          {/* Foreground Indigo/Navy Badge */}
          <div
            className="relative flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 rounded-br-[24px] rounded-tl-[24px] bg-[#182756] border-b-2 border-r-2 border-[#2F407A] shadow-[0_6px_16px_rgba(24,39,86,0.35)] cursor-pointer group"
            style={{ zIndex: 2 }}
            onClick={() => handleStartEditField("badge", badgeTitle)}
            title="Click to edit Study Skills title"
          >
            {/* Glowing Lightbulb Vector Icon */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">
                {/* Glowing light rays */}
                <line x1="8" y1="12" x2="3" y2="9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="6" x2="18" y2="1" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="28" y1="12" x2="33" y2="9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="5" y1="21" x2="1" y2="21" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="31" y1="21" x2="35" y2="21" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

                {/* Lightbulb glass */}
                <circle cx="18" cy="19" r="8" fill="#FFFFFF" />
                {/* Bulb base */}
                <rect x="14" y="27" width="8" height="4" rx="2" fill="#CCD3F8" />
              </svg>
            </div>

            {/* Badge Title Text */}
            {editingField === "badge" ? (
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSaveField();
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  className="rounded px-2 py-0.5 text-sm font-black bg-white text-slate-900 border border-indigo-400 outline-none w-36"
                />
                <button
                  type="button"
                  onClick={handleSaveField}
                  className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                  title="Save badge title"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-lg sm:text-xl font-extrabold tracking-wide select-none">
                <span className="text-white drop-shadow-sm">{firstWord}</span>
                <span className="text-[#CCD3F8] drop-shadow-sm">{restWords}</span>
                <Edit3 className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </div>
            )}
          </div>
        </div>

        {/* --- QUICK ACTION BAR (Visible when selected or on hover) --- */}
        <div className="absolute top-3 right-4 flex items-center gap-1.5 z-30">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSubjectMenu(!showSubjectMenu)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-300 shadow-sm backdrop-blur transition-all"
              title="Switch subject preset"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{subject} Presets</span>
            </button>

            {showSubjectMenu && (
              <div className="absolute right-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs divide-y divide-slate-100">
                {Object.keys(SUBJECT_STUDY_SKILL_DEFAULTS).map(subKey => (
                  <div key={subKey} className="p-1.5">
                    <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-2 py-0.5">
                      {subKey}
                    </div>
                    {SUBJECT_STUDY_SKILL_DEFAULTS[subKey].presets.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(subKey, idx)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.topics.length} items</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddTopic}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            title="Add a new topic/rule"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Topic</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddEmpty(1)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-300 shadow-sm transition-all"
            title="Add empty space for write-in"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Empty Space</span>
          </button>
        </div>

        {/* --- MAIN CENTER CONTENT --- */}
        <div data-block-reading-content="true" className="relative flex-1 w-full py-4 sm:py-6 px-4 sm:px-10 flex flex-col items-center justify-center text-center z-20 min-h-0">
          {/* Header Prompt (e.g. "Face value of:") */}
          <div className="w-full max-w-xl mb-3 sm:mb-5 shrink-0">
            {editingField === "header" ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSaveField();
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  className="w-full max-w-md text-center text-2xl sm:text-3xl font-extrabold text-[#0D2040] bg-white/90 border-2 border-indigo-400 rounded-xl px-4 py-1.5 outline-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleSaveField}
                  className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => handleStartEditField("header", headerPrompt)}
                className="group inline-flex items-center justify-center gap-2 cursor-pointer px-4 py-1 rounded-xl hover:bg-black/[0.03] transition-colors"
                title="Click to edit prompt heading"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0D2040] tracking-tight">
                  {headerPrompt}
                </h2>
                <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          {/* Topics List (e.g. "7 is 7.", "9 is 9.", or write-in spaces) */}
          <div className="w-full max-w-xl flex-1 flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 min-h-0">
            {topics.length === 0 ? (
              <div className="py-6 text-center text-slate-400 italic">
                No topics added yet. Click &quot;+ Topic&quot; or &quot;+ Empty Space&quot; above.
              </div>
            ) : (
              topics.map((t, index) => {
                const isEditing = editingId === t.id;

                if (isEditing) {
                  return (
                    <div key={t.id} className="w-full max-w-xl flex-1 min-h-[48pt] flex items-center gap-2 my-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={draftText}
                        onChange={e => setDraftText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveTopic();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        placeholder="Type topic / rule / empty prompt..."
                        className="w-full text-center text-xl sm:text-2xl font-bold text-[#0D2040] bg-white border-2 border-indigo-400 rounded-xl px-4 py-1.5 outline-none shadow-md"
                      />
                      <button
                        type="button"
                        onClick={handleSaveTopic}
                        className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                if (t.isEmpty) {
                  // EMPTY SPACE ITEM: Fillable dotted write-in workbook space that expands to fill added height
                  return (
                    <div
                      key={t.id}
                      style={{ minHeight: "52pt" }}
                      className="group relative w-full max-w-xl flex-1 flex items-center justify-center px-6 py-3 rounded-2xl border-2 border-dashed border-[#B8C4DC] bg-white/80 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer shadow-2xs"
                      onClick={() => handleStartEditTopic(t)}
                      title="Click to write text into this empty space"
                    >
                      <span className="text-sm sm:text-base font-semibold text-slate-400 italic">
                        {t.text || "Write your rule / answer here..."}
                      </span>

                      {/* Row Action Controls on hover */}
                      <div
                        className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/95 rounded-lg px-1.5 py-1 border border-slate-200 shadow-sm transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveTopic(t.id, -1)}
                            className="p-1 text-slate-500 hover:text-slate-800"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {index < topics.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveTopic(t.id, 1)}
                            className="p-1 text-slate-500 hover:text-slate-800"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(t.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Delete empty space"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // REGULAR TOPIC ITEM
                return (
                  <div
                    key={t.id}
                    style={{ minHeight: "44pt" }}
                    className="group relative w-full max-w-xl shrink-0 flex items-center justify-center px-4 py-2 rounded-xl hover:bg-black/[0.03] transition-colors cursor-pointer"
                    onClick={() => handleStartEditTopic(t)}
                    title="Click to edit topic line"
                  >
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0D2040] tracking-tight">
                      {t.text}
                    </div>

                    {/* Row Action Controls on hover */}
                    <div
                      className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/95 rounded-lg px-1.5 py-1 border border-slate-200 shadow-md transition-opacity z-20"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleStartEditTopic(t)}
                        className="p-1 text-slate-600 hover:text-indigo-600"
                        title="Edit text"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTopic(t.id, -1)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {index < topics.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveTopic(t.id, 1)}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(t.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom subtle bar for adding topics / empty spaces easily */}
        <div className="relative pt-3 border-t border-[#E8DFD7] flex items-center justify-between text-xs text-slate-500 z-20 shrink-0">
          <span className="font-medium text-slate-400">
            {topics.length} items ({topics.filter(t => t.isEmpty).length} write-in spaces)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTopic}
              className="hover:text-indigo-600 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Topic
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => handleAddEmpty(2)}
              className="hover:text-emerald-600 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> +2 Empty Spaces
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
