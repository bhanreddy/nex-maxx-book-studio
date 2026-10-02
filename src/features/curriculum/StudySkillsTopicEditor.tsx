"use client";

import React from "react";
import type { StudySkillTopic } from "../../domain/educational/blockSchema";
import {
  createStudySkillTopic,
  addEmptySpaces,
  moveStudySkillTopic,
  SUBJECT_STUDY_SKILL_DEFAULTS,
} from "../../editor/curriculum/studySkills";
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, BookOpen, Layers } from "lucide-react";

interface Props {
  topics: StudySkillTopic[];
  headerPrompt: string;
  subject?: string;
  onChangeTopics: (topics: StudySkillTopic[]) => void;
  onChangeHeader: (header: string) => void;
}

export function StudySkillsTopicEditor({
  topics,
  headerPrompt,
  subject = "Maths",
  onChangeTopics,
  onChangeHeader,
}: Props) {
  const handlePatch = (id: string, patch: Partial<StudySkillTopic>) => {
    onChangeTopics(topics.map(t => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleAdd = () => {
    onChangeTopics([...topics, createStudySkillTopic("New Rule / Fact", false)]);
  };

  const handleAddEmpty = (count = 1) => {
    onChangeTopics(addEmptySpaces(topics, count));
  };

  const handleDelete = (id: string) => {
    onChangeTopics(topics.filter(t => t.id !== id));
  };

  const handleMove = (id: string, dir: -1 | 1) => {
    onChangeTopics(moveStudySkillTopic(topics, id, dir));
  };

  const handleApplyPreset = (subjKey: string, presetIndex = 0) => {
    const target = SUBJECT_STUDY_SKILL_DEFAULTS[subjKey] || SUBJECT_STUDY_SKILL_DEFAULTS.Maths;
    const preset = target.presets[presetIndex] || target.presets[0];
    onChangeHeader(preset.header);
    onChangeTopics(preset.topics.map(t => createStudySkillTopic(t, false)));
  };

  return (
    <div className="space-y-3.5 border-t border-slate-200 pt-3">
      {/* Subject Quick Presets */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
          <span>Subject Quick Presets</span>
          <span className="text-[10px] text-indigo-600 font-normal">Click to apply</span>
        </label>
        <div className="flex flex-wrap gap-1">
          {["Maths", "Science", "English", "Social Studies", "EVS", "General", "Telugu", "Hindi"].map(sub => (
            <button
              key={sub}
              type="button"
              onClick={() => handleApplyPreset(sub)}
              className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                subject.toLowerCase().includes(sub.toLowerCase())
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Header Prompt */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Topic / Prompt Header
        </label>
        <input
          type="text"
          value={headerPrompt}
          onChange={e => onChangeHeader(e.target.value)}
          placeholder="e.g. Face value of:"
          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded border border-slate-300 focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Topics list */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Study Rules &amp; Spaces ({topics.length})
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleAdd}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Topic
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => handleAddEmpty(1)}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Space
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {topics.map((t, idx) => (
            <div
              key={t.id}
              className={`flex items-center gap-1.5 p-1.5 rounded border transition-colors ${
                t.isEmpty
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
                {idx + 1}
              </span>

              <input
                type="text"
                value={t.text}
                onChange={e =>
                  handlePatch(t.id, {
                    text: e.target.value,
                    isEmpty: e.target.value.trim().length === 0,
                  })
                }
                placeholder={t.isEmpty ? "(Empty write-in space)" : "e.g. 7 is 7."}
                className="flex-1 text-xs px-2 py-1 rounded border border-slate-200 focus:border-indigo-400 outline-none font-medium"
              />

              <button
                type="button"
                onClick={() => handlePatch(t.id, { isEmpty: !t.isEmpty })}
                className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${
                  t.isEmpty
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
                title="Toggle between regular rule and empty write-in space"
              >
                {t.isEmpty ? "Space" : "Rule"}
              </button>

              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => handleMove(t.id, -1)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
              )}

              {idx < topics.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleMove(t.id, 1)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="p-1 text-red-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fast actions */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => handleAddEmpty(3)}
          className="flex-1 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
        >
          + 3 Empty Spaces
        </button>
        <button
          type="button"
          onClick={() => {
            const def = SUBJECT_STUDY_SKILL_DEFAULTS[subject] || SUBJECT_STUDY_SKILL_DEFAULTS.Maths;
            onChangeHeader(def.header);
            onChangeTopics(def.topics.map(t => createStudySkillTopic(t, false)));
          }}
          className="py-1.5 px-3 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
          title="Reset to default topics"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
