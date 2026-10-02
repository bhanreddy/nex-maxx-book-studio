"use client";
import React, { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import type { LessonSchemaTopic } from "../../domain/educational/blockSchema";
import { LESSON_SCHEMA_TOKENS } from "../../domain/educational/designTokens";
import { createSchemaTopic, LESSON_SCHEMA_ICONS, moveSchemaTopic } from "../../editor/curriculum/lessonSchema";

function TopicText({ value, onSave, index }: { value: string; onSave: (value: string) => void; index: number }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <textarea aria-label={`Topic ${index + 1} text`} rows={2} value={draft} placeholder="Empty topic box" onChange={e => setDraft(e.target.value)} onBlur={() => { if (draft !== value) onSave(draft); }} />;
}
export function LessonSchemaTopicEditor({ topics, subject, onChange }: { topics: LessonSchemaTopic[]; subject: string; onChange: (topics: LessonSchemaTopic[]) => void }) {
  const [count, setCount] = useState(3);
  const patch = (id: string, update: Partial<LessonSchemaTopic>) => onChange(topics.map(t => t.id === id ? { ...t, ...update } : t));
  return <div className="space-y-3" aria-label="Lesson schema topics">
    <div className="text-xs font-semibold text-slate-200">Topics · {topics.length} boxes</div>
    <p className="text-[11px] text-slate-400">Any subject, any number of topics. Every seven boxes create another map. Empty boxes stay in the layout.</p>
    {!topics.length && <p className="curriculum-empty">No topics yet. Add a topic or empty boxes below.</p>}
    {topics.map((topic, index) => <div key={topic.id} className="rounded-xl border border-white/10 bg-white/[.03] p-3 space-y-2">
      <div className="flex items-center justify-between"><strong className="text-[11px] text-slate-300">TOPIC {index + 1}</strong><div className="flex">
        <button type="button" className="curriculum-icon-button" aria-label={`Move topic ${index + 1} up`} disabled={index === 0} onClick={() => onChange(moveSchemaTopic(topics, topic.id, -1))}><ArrowUp size={14}/></button>
        <button type="button" className="curriculum-icon-button" aria-label={`Move topic ${index + 1} down`} disabled={index === topics.length - 1} onClick={() => onChange(moveSchemaTopic(topics, topic.id, 1))}><ArrowDown size={14}/></button>
        <button type="button" className="curriculum-icon-button" aria-label={`Delete topic ${index + 1}`} onClick={() => onChange(topics.filter(t => t.id !== topic.id))}><Trash2 size={14}/></button>
      </div></div>
      <div className="curriculum-field"><TopicText value={topic.label} index={index} onSave={label => patch(topic.id, { label })}/></div>
      <div className="grid grid-cols-2 gap-2">
        <label className="curriculum-field">Icon<select aria-label={`Topic ${index + 1} icon`} value={topic.icon} onChange={e => patch(topic.id, { icon: e.target.value as LessonSchemaTopic["icon"] })}>{LESSON_SCHEMA_ICONS.map(icon => <option key={icon} value={icon}>{icon[0].toUpperCase() + icon.slice(1)}</option>)}</select></label>
        <label className="curriculum-field">Colour<input type="color" aria-label={`Topic ${index + 1} colour`} value={topic.color} onChange={e => patch(topic.id, { color: e.target.value })}/></label>
      </div>
      <div className="flex flex-wrap gap-2">{LESSON_SCHEMA_TOKENS.tones.map(tone => <button type="button" key={tone.name} aria-label={`Use ${tone.name.toLowerCase()} for topic ${index + 1}`} title={tone.name} className="h-11 w-11 rounded-full border-2 border-white/30 active:scale-95 transition-transform" style={{ background: tone.accent }} onClick={() => patch(topic.id, { color: tone.accent })}/>)}</div>
    </div>)}
    <button type="button" className="curriculum-primary w-full justify-center" onClick={() => onChange([...topics, createSchemaTopic("New topic", topics.length, subject)])}><Plus size={14}/>Add topic</button>
    <div className="flex gap-2 items-end">
      <label className="curriculum-field flex-1">Empty boxes<input aria-label="Number of empty topic boxes" type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))}/></label>
      <button type="button" className="curriculum-secondary" disabled={!Number.isInteger(count) || count < 1 || count > 100} onClick={() => onChange([...topics, ...Array.from({ length: count }, (_, i) => createSchemaTopic("", topics.length + i, subject))])}>Add boxes</button>
    </div>
  </div>;
}
