"use client";
import React, { useState } from "react";
import type { PageElement } from "../../domain/element/types";
import type { BlockMotif } from "../../domain/educational/blockSchema";
import { buildPublicationScene, type SceneMotifFrame } from "../../editor/educational/publicationScene";
import { useEditorStore } from "../../editor/stores/editorStore";

function liveMotifs(element: PageElement): BlockMotif[] {
  return element.smartBlockData?.styleOverrides.motifs || [];
}

export function MotifOverlay({ element, zoom }: { element: PageElement; zoom: number }) {
  const block = element.smartBlockData;
  const [active, setActive] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  if ((!block?.presetId.startsWith("atelier-") && !block?.curriculum) || block?.isLockedDesign) return null;
  const scene = buildPublicationScene({ ...block, transform: element.transform });
  const frames = scene.motifs || [];
  const apply = (id: string, frame: SceneMotifFrame, patch: Partial<BlockMotif>) => {
    const current = useEditorStore.getState().elements[element.id];
    const motifs = liveMotifs(current);
    const found = motifs.find(motif => motif.id === id);
    const next = found
      ? motifs.map(motif => motif.id === id ? { ...motif, ...patch } : motif)
      : [...motifs, { id, role: frame.role as BlockMotif["role"], kind: frame.kind, x: frame.x, y: frame.y, w: frame.w, h: frame.h, rotation: 0, locked: false, opacity: frame.role === "photo" ? 1 : .8, behind: true, originWidth: current.transform.width, ...patch }];
    useEditorStore.getState().setBlockMotifs(element.id, next);
  };
  const begin = (frame: SceneMotifFrame, event: React.PointerEvent, mode: "move" | "resize" | "crop") => {
    if (frame.locked && mode !== "crop") return;
    event.stopPropagation();
    event.preventDefault();
    const before = useEditorStore.getState().elements[element.id];
    const startX = event.clientX, startY = event.clientY;
    const origin = { ...frame };
    const motif = liveMotifs(before).find(item => item.id === frame.id);
    const focal = { x: motif?.focalX ?? .5, y: motif?.focalY ?? .5 };
    setActive(frame.id);
    const move = (e: PointerEvent) => {
      const dx = (e.clientX - startX) * .75 / zoom;
      const dy = (e.clientY - startY) * .75 / zoom;
      if (mode === "crop") apply(frame.id, frame, { focalX: Math.max(0, Math.min(1, focal.x - dx / Math.max(24, origin.w))), focalY: Math.max(0, Math.min(1, focal.y - dy / Math.max(24, origin.h))) });
      else if (mode === "resize") apply(frame.id, frame, { x: origin.x, y: origin.y, w: Math.max(28, origin.w + dx), h: Math.max(28, origin.h + dy), nudged: true, originWidth: before.transform.width });
      else apply(frame.id, frame, { x: origin.x + dx, y: origin.y + dy, w: origin.w, h: origin.h, nudged: true, originWidth: before.transform.width });
    };
    const up = () => {
      useEditorStore.getState().commitBlockMotifs(element.id, before);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return <>
    {frames.map(frame => <div key={frame.id} role="button" aria-label={`Drag ${frame.kind} plate`} tabIndex={0}
      onPointerDown={e => { setCropping(false); begin(frame, e, "move"); }}
      onDoubleClick={e => { if (frame.role === "photo") { e.stopPropagation(); setActive(frame.id); setCropping(true); } }}
      className={`absolute border border-dashed ${active === frame.id ? "border-amber-500 bg-amber-400/10" : "border-transparent hover:border-amber-400/70"}`}
      style={{ left: `${frame.x}pt`, top: `${frame.y}pt`, width: `${frame.w}pt`, height: `${frame.h}pt`, cursor: frame.locked ? "default" : cropping && active === frame.id ? "crosshair" : "move", pointerEvents: "auto", zIndex: 5 }}>
      {active === frame.id && !frame.locked && <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-white border border-amber-600 cursor-nwse-resize" onPointerDown={e => begin(frame, e, "resize")} />}
      {cropping && active === frame.id && <div className="absolute inset-0 cursor-crosshair" onPointerDown={e => begin(frame, e, "crop")} />}
    </div>)}
    {active && frames.find(frame => frame.id === active) && <div className="absolute z-10 flex gap-1" style={{ left: `${frames.find(frame => frame.id === active)!.x}pt`, top: `${frames.find(frame => frame.id === active)!.y - 16}pt` }} onPointerDown={e => e.stopPropagation()}>
      <button className="bg-slate-900 text-amber-100 text-[8px] px-1.5 py-0.5 rounded" onClick={() => { const frame = frames.find(item => item.id === active)!; const motif = liveMotifs(element).find(item => item.id === active); const before = useEditorStore.getState().elements[element.id]; apply(active, frame, { behind: motif?.behind === false }); useEditorStore.getState().commitBlockMotifs(element.id, before); }}>Behind text</button>
      <button className="bg-slate-900 text-amber-100 text-[8px] px-1.5 py-0.5 rounded" onClick={() => { const frame = frames.find(item => item.id === active)!; const before = useEditorStore.getState().elements[element.id]; apply(active, frame, { locked: !frame.locked }); useEditorStore.getState().commitBlockMotifs(element.id, before); }}>{frameLocked(element, active) ? "Unlock" : "Lock"}</button>
      <button className="bg-slate-900 text-rose-200 text-[8px] px-1.5 py-0.5 rounded" onClick={() => { const before = useEditorStore.getState().elements[element.id]; useEditorStore.getState().setBlockMotifs(element.id, liveMotifs(before).filter(motif => motif.id !== active)); useEditorStore.getState().commitBlockMotifs(element.id, before); setActive(null); }}>Remove</button>
    </div>}
  </>;
}
function frameLocked(element: PageElement, id: string) {
  return Boolean(liveMotifs(element).find(motif => motif.id === id)?.locked);
}
