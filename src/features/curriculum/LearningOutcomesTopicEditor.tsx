"use client";
import React, { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Sparkles, BookOpen, Layers } from "lucide-react";
import type { LearningOutcomeTopic } from "../../editor/curriculum/learningOutcomes";
import {
  LEARNING_OUTCOMES_ICONS,
  LEARNING_OUTCOMES_PALETTE,
  createLearningOutcomeTopic,
  moveLearningOutcomeTopic,
  addEmptySpaces,
  getSubjectOutcomeDefault,
  SUBJECT_OUTCOME_DEFAULTS,
} from "../../editor/curriculum/learningOutcomes";

function OutcomeTextInput({
  verb,
  text,
  isEmpty,
  onSave,
  index,
}: {
  verb: string;
  text: string;
  isEmpty?: boolean;
  onSave: (verb: string, text: string, isEmpty: boolean) => void;
  index: number;
}) {
  const [draftVerb, setDraftVerb] = useState(verb);
  const [draftText, setDraftText] = useState(text);
  const [draftEmpty, setDraftEmpty] = useState(Boolean(isEmpty));

  useEffect(() => {
    setDraftVerb(verb);
    setDraftText(text);
    setDraftEmpty(Boolean(isEmpty));
  }, [verb, text, isEmpty]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          aria-label={`Outcome ${index + 1} verb`}
          value={draftVerb}
          disabled={draftEmpty}
          placeholder="Action verb (e.g. write, identify)"
          className="w-1/3 px-2 py-1 text-xs font-semibold rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:border-indigo-400 disabled:opacity-40"
          onChange={(e) => setDraftVerb(e.target.value)}
          onBlur={() => {
            if (draftVerb !== verb) onSave(draftVerb, draftText, draftEmpty);
          }}
        />
        <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={draftEmpty}
            onChange={(e) => {
              const next = e.target.checked;
              setDraftEmpty(next);
              onSave(draftVerb, draftText, next);
            }}
            className="rounded border-white/30 text-indigo-500 focus:ring-0"
          />
          <span>Empty write-in line</span>
        </label>
      </div>
      {!draftEmpty ? (
        <textarea
          aria-label={`Outcome ${index + 1} description`}
          rows={2}
          value={draftText}
          placeholder="Outcome description / target skill..."
          className="w-full px-2 py-1.5 text-xs rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:border-indigo-400"
          onChange={(e) => setDraftText(e.target.value)}
          onBlur={() => {
            if (draftText !== text) onSave(draftVerb, draftText, draftEmpty);
          }}
        />
      ) : (
        <div className="text-[11px] text-amber-300/80 italic py-1 border-b border-dashed border-white/20">
          Empty student write-in space
        </div>
      )}
    </div>
  );
}

export function LearningOutcomesTopicEditor({
  topics,
  subject,
  onChange,
}: {
  topics: LearningOutcomeTopic[];
  subject: string;
  onChange: (topics: LearningOutcomeTopic[]) => void;
}) {
  const [emptyCount, setEmptyCount] = useState(2);
  const patch = (id: string, update: Partial<LearningOutcomeTopic>) =>
    onChange(topics.map((t) => (t.id === id ? { ...t, ...update } : t)));

  const handleApplySubjectPreset = (sub: string) => {
    const preset = getSubjectOutcomeDefault(sub);
    const newTopics = preset.outcomes.map((item, idx) =>
      createLearningOutcomeTopic(item.verb, item.text, idx, sub, false, item.icon)
    );
    onChange(newTopics);
  };

  return (
    <div className="space-y-3" aria-label="Learning outcomes topics">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-200">
            Learning Outcomes · {topics.length} outcomes
          </div>
          <p className="text-[11px] text-slate-400">
            Fully editable outcomes, action verbs, icons & write-in empty spaces.
          </p>
        </div>
      </div>

      {/* Quick Subject Loader */}
      <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-2 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
          <Sparkles size={12} />
          <span>Load subject starter:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.keys(SUBJECT_OUTCOME_DEFAULTS).map((sub) => (
            <button
              key={sub}
              type="button"
              className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors"
              onClick={() => handleApplySubjectPreset(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {!topics.length && (
        <p className="curriculum-empty">No outcomes yet. Add an outcome or empty write-in spaces below.</p>
      )}

      {topics.map((topic, index) => (
        <div
          key={topic.id}
          className="rounded-xl border border-white/10 bg-white/[.03] p-3 space-y-2 relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-sm rotate-45 inline-block border border-white/40 shadow-sm"
                style={{ backgroundColor: topic.color }}
              />
              <strong className="text-[11px] text-slate-300">
                OUTCOME {index + 1} {topic.isEmpty ? "(EMPTY SPACE)" : ""}
              </strong>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="curriculum-icon-button"
                aria-label={`Move outcome ${index + 1} up`}
                disabled={index === 0}
                onClick={() => onChange(moveLearningOutcomeTopic(topics, topic.id, -1))}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="curriculum-icon-button"
                aria-label={`Move outcome ${index + 1} down`}
                disabled={index === topics.length - 1}
                onClick={() => onChange(moveLearningOutcomeTopic(topics, topic.id, 1))}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="curriculum-icon-button text-red-400 hover:text-red-300"
                aria-label={`Delete outcome ${index + 1}`}
                onClick={() => onChange(topics.filter((t) => t.id !== topic.id))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <OutcomeTextInput
            verb={topic.verb}
            text={topic.text}
            isEmpty={topic.isEmpty}
            index={index}
            onSave={(verb, text, isEmpty) => patch(topic.id, { verb, text, isEmpty })}
          />

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
            <label className="curriculum-field">
              Icon
              <select
                aria-label={`Outcome ${index + 1} icon`}
                value={topic.icon}
                onChange={(e) => patch(topic.id, { icon: e.target.value })}
              >
                {LEARNING_OUTCOMES_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon.charAt(0).toUpperCase() + icon.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="curriculum-field">
              Badge Colour
              <input
                type="color"
                aria-label={`Outcome ${index + 1} colour`}
                value={topic.color}
                onChange={(e) => patch(topic.id, { color: e.target.value })}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {LEARNING_OUTCOMES_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select color ${c}`}
                className="w-5 h-5 rounded-full border border-white/30 transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
                onClick={() => patch(topic.id, { color: c })}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          className="curriculum-primary w-full justify-center text-xs"
          onClick={() =>
            onChange([
              ...topics,
              createLearningOutcomeTopic(
                "learn",
                "key conceptual skills and practice applications",
                topics.length,
                subject
              ),
            ])
          }
        >
          <Plus size={14} /> Add Outcome
        </button>

        <div className="flex gap-2 items-center">
          <label className="curriculum-field flex-1">
            <span className="text-[11px] text-slate-300">Add Empty Spaces</span>
            <input
              aria-label="Number of empty outcome lines"
              type="number"
              min={1}
              max={15}
              value={emptyCount}
              onChange={(e) => setEmptyCount(Math.max(1, Number(e.target.value)))}
            />
          </label>
          <button
            type="button"
            className="curriculum-secondary self-end text-xs whitespace-nowrap"
            onClick={() => onChange(addEmptySpaces(topics, emptyCount, subject))}
          >
            + Add {emptyCount} Empty Lines
          </button>
        </div>
      </div>
    </div>
  );
}
