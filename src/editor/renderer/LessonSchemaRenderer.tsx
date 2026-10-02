"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { buildPublicationScene } from "../educational/publicationScene";
import { schemaTopics, createSchemaTopic } from "../curriculum/lessonSchema";
import { useEditorStore } from "../stores/editorStore";
import { PublicationSceneView } from "./PublicationSceneView";

export function LessonSchemaRenderer({ block, selected = false, locked = false, elementId = block.id }: { block: SmartBlockInstance; selected?: boolean; locked?: boolean; elementId?: string }) {
  const scene = useMemo(() => buildPublicationScene(block), [block]);
  const [editing, setEditing] = useState<{ id: string; key: number; value: string } | null>(null);
  const draft = useRef("");
  const topics = schemaTopics(block), canEdit = !locked && !block.isLockedContent;
  const slice = block.styleOverrides.sceneSlice;
  const fullScene = useMemo(() => slice ? buildPublicationScene({ ...block, styleOverrides: { ...block.styleOverrides, sceneSlice: undefined } }) : scene, [block, scene, slice]);

  useEffect(() => {
    if (!locked && scene.height > block.transform.height + 1) {
      useEditorStore.getState().fitRenderedBlockHeight(elementId, Math.ceil(scene.height));
    }
  }, [scene.height, block.transform.height, elementId, locked]);

  const fit = Math.min(block.transform.width / scene.width, block.transform.height / scene.height);
  const fittedWidth = Math.min(100, scene.width * fit / block.transform.width * 100);
  const fittedHeight = Math.min(100, scene.height * fit / block.transform.height * 100);
  const update = (patch: Partial<SmartBlockInstance["semanticContent"]>) => useEditorStore.getState().updateSmartBlockContent(elementId, patch);
  const commit = () => {
    if (!editing) return;
    if (draft.current !== editing.value) {
      if (editing.id === "schema-title") update({ title: draft.current });
      else if (editing.id === "schema-centre") update({ calloutText: draft.current });
      else update({ lessonSchemaTopics: topics.map(t => `topic:${t.id}` === editing.id ? { ...t, label: draft.current } : t) });
    }
    setEditing(null);
  };
  return <div className="relative w-full h-full" data-lesson-schema="true">
    <div style={{ position: "absolute", left: `${(100 - fittedWidth) / 2}%`, top: `${(100 - fittedHeight) / 2}%`, width: `${fittedWidth}%`, height: `${fittedHeight}%` }}>
    <PublicationSceneView scene={scene} label={`${block.semanticContent.title}: ${block.semanticContent.calloutText || "chapter topic map"}`}/>
    {canEdit && fullScene.motifs?.filter(m => m.role === "schema-text" && (!slice || (m.y >= slice.from && m.y + m.h <= slice.to))).map((m, i) => {
      const value = m.id === "schema-title" ? block.semanticContent.title : m.id === "schema-centre" ? block.semanticContent.calloutText || "" : topics.find(t => `topic:${t.id}` === m.id)?.label || "";
      const style: React.CSSProperties = { position: "absolute", left: `${m.x / scene.width * 100}%`, top: `${(m.y - (slice?.from || 0)) / scene.height * 100}%`, width: `${m.w / scene.width * 100}%`, height: `${m.h / scene.height * 100}%` };
      return <React.Fragment key={`${m.id}-${i}`}>
        {editing?.id === m.id && editing.key === i ? <textarea autoFocus aria-label="Edit lesson schema text" defaultValue={value} onChange={e => { draft.current = e.target.value; }} onBlur={commit} onMouseDown={e => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); setEditing(null); } if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }} style={{ ...style, resize: "none", fontSize: "11pt", zIndex: 10 }} className="rounded-lg bg-white text-slate-900 outline outline-2 outline-indigo-500 p-1"/> : <button type="button" aria-label={`Edit ${m.id === "schema-title" ? "schema heading" : m.id === "schema-centre" ? "central chapter name" : value || "empty topic box"}`} title="Double-click to edit; Enter to edit when focused" style={style} className="bg-transparent rounded-lg hover:outline hover:outline-1 hover:outline-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500" onDoubleClick={e => { e.stopPropagation(); draft.current = value; setEditing({ id: m.id, key: i, value }); }} onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); draft.current = value; setEditing({ id: m.id, key: i, value }); } }}/>}
      </React.Fragment>;
    })}
    </div>
    {selected && canEdit && <div className="absolute bottom-1 right-2 flex gap-1 rounded-lg bg-slate-900 p-1 text-[10px] text-white" onMouseDown={e => e.stopPropagation()}>
      <button type="button" className="rounded px-2 py-1 hover:bg-white/10" onClick={() => update({ lessonSchemaTopics: [...topics, createSchemaTopic("New topic", topics.length, block.curriculum?.subjectLabel)] })}>+ Topic</button>
      <button type="button" className="rounded px-2 py-1 hover:bg-white/10" onClick={() => update({ lessonSchemaTopics: [...topics, ...Array.from({ length: 3 }, (_, i) => createSchemaTopic("", topics.length + i, block.curriculum?.subjectLabel))] })}>+ 3 empty boxes</button>
    </div>}
  </div>;
}
