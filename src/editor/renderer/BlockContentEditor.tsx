"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Pencil, RotateCcw, Move } from "lucide-react";
import type { PageElement } from "../../domain/element/types";
import type { SceneNode } from "../educational/publicationScene";
import { buildPublicationScene, textWidth } from "../educational/publicationScene";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { PublicationSceneView } from "./PublicationSceneView";

type ContentNode = Extract<SceneNode, { kind: "text" | "image" }>;

export function contentNodeBounds(node: ContentNode) {
  if (node.kind === "image") return { x: node.x, y: node.y, width: node.w, height: node.h };
  const width = Math.max(node.size, node.textLength ?? Math.max(...(node.lines || [node.text]).map(line => textWidth(line, node.size, node.bold, node.font === "serif", node.fontFamily, node.letterSpacing))));
  return { x: node.x - (node.align === "middle" ? width / 2 : node.align === "end" ? width : 0), y: node.y - node.size, width, height: node.size * 1.35 + Math.max(0, (node.lines?.length || 1) - 1) * (node.lineHeight || node.size * 1.4) };
}

/** Pointer coordinates use the SVG matrix, including page zoom and block rotation. */
export function BlockContentEditor({ element, selected = false, zoom = 1 }: { element: PageElement; selected?: boolean; zoom?: number }) {
  const block = element.smartBlockData!;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{
    id: string; pointerId: number; group: SVGGElement; inverse: DOMMatrix;
    start: DOMPoint; dx: number; dy: number; frame: number; moved: boolean;
  } | null>(null);
  const scene = useMemo(() => buildPublicationScene({ ...block, transform: element.transform }), [block, element.transform]);
  const baseScene = useMemo(() => buildPublicationScene({ ...block, transform: element.transform, styleOverrides: { ...block.styleOverrides, contentLayout: { enabled: true, items: {} } } }), [block, element.transform]);
  const baseNodes = new Map(baseScene.nodes.filter((node): node is ContentNode => node.kind === "text" || node.kind === "image").map(node => [node.contentId!, node]));
  const active = scene.nodes.find((node): node is ContentNode => (node.kind === "text" || node.kind === "image") && node.contentId === activeId);
  const canMove = selected && !element.locked && !block.isLockedDesign;
  const canEdit = canMove && !block.isLockedContent;
  useEffect(() => {
    if (!canMove) { cancelDrag(); setEditing(false); setActiveId(null); }
    return cancelDrag;
  }, [canMove]);

  function save(id: string, patch: { dx?: number; dy?: number; text?: string; src?: string }, relative = false) {
    const current = useEditorStore.getState().elements[element.id]?.smartBlockData;
    const baseNode = baseNodes.get(id);
    if (!current || !baseNode) return;
    const base = baseNode.kind === "text" ? baseNode.text : baseNode.src;
    const layout = current.styleOverrides.contentLayout || { enabled: true, items: {} };
    const stored = layout.items[id];
    const previous = stored?.base === base ? stored : { base, dx: 0, dy: 0 };
    const item = { ...previous, ...patch, ...(relative ? { dx: previous.dx + (patch.dx || 0), dy: previous.dy + (patch.dy || 0) } : {}) };
    useEditorStore.getState().updateBlockContentLayout(element.id, { ...layout, items: { ...layout.items, [id]: item } });
  }

  function cancelDrag() {
    const state = drag.current;
    if (!state) return;
    cancelAnimationFrame(state.frame);
    state.group.removeAttribute("transform");
    state.group.classList.remove("is-dragging");
    drag.current = null;
  }

  function start(event: React.PointerEvent<SVGGElement>, id: string) {
    if (!canMove || event.button !== 0 || editing) return;
    event.stopPropagation();
    event.preventDefault();
    const group = event.currentTarget;
    const matrix = group.ownerSVGElement?.getScreenCTM();
    if (!matrix) return;
    setActiveId(id);
    group.focus();
    group.setPointerCapture(event.pointerId);
    const inverse = matrix.inverse();
    drag.current = { id, pointerId: event.pointerId, group, inverse, start: new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse), dx: 0, dy: 0, frame: 0, moved: false };
  }

  function move(event: React.PointerEvent<SVGGElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(state.inverse);
    let dx = point.x - state.start.x, dy = point.y - state.start.y;
    if (event.shiftKey) { if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0; }
    state.dx = Math.round(dx * 10) / 10;
    state.dy = Math.round(dy * 10) / 10;
    state.moved ||= Math.hypot(state.dx, state.dy) > 1;
    if (!state.frame) state.frame = requestAnimationFrame(() => {
      state.group.setAttribute("transform", `translate(${state.dx} ${state.dy})`);
      state.group.classList.add("is-dragging");
      state.frame = 0;
    });
  }

  function finish(event: React.PointerEvent<SVGGElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    move(event);
    event.stopPropagation();
    const { id, dx, dy, moved } = state;
    cancelDrag();
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (moved) save(id, { dx, dy }, true);
  }

  function editText(node: ContentNode) {
    if (!canEdit || node.kind !== "text") return;
    setActiveId(node.contentId!);
    setDraft(node.text);
    setEditing(true);
  }

  function commitText() {
    if (!editing || !activeId) return;
    setEditing(false);
    if (active?.kind === "text" && draft !== active.text) save(activeId, { text: draft });
  }

  const artboard = typeof document !== "undefined" ? document.getElementById(`page-controls-${element.pageId}`) : null;
  const tools = canMove && active && <div data-canvas-controls className="block-content-tools pointer-events-auto" style={{ left: artboard ? `${element.transform.x + element.transform.width / 2}pt` : "50%", top: artboard ? `${element.transform.y + element.transform.height}pt` : undefined, bottom: artboard ? "auto" : 12 / zoom, transform: `${artboard ? "translate(-50%, -100%)" : "translateX(-50%)"} scale(${1 / zoom})`, transformOrigin: "bottom center", zIndex: 60 }} onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    <span><Move size={14}/>{active.kind === "text" ? "Text" : "Image"}</span>
    {canEdit && (active.kind === "text" ? <button type="button" onClick={() => editText(active)} title="Edit selected text"><Pencil size={14}/>Edit text</button> : <button type="button" onClick={() => fileRef.current?.click()} title="Replace selected image"><ImagePlus size={14}/>Replace image</button>)}
    <button type="button" onClick={() => save(activeId!, { dx: 0, dy: 0 })} title="Restore this item's original position"><RotateCcw size={14}/>Reset position</button>
    {zoom >= 0.65 && <small>↑↓←→ nudge · Shift ×10</small>}
  </div>;

  return <div className="block-content-editor" data-block-content-editor>
    <PublicationSceneView scene={scene} label={`${block.semanticContent.title} — editable contents`} viewBox={block.styleOverrides.resizeFrame ? `0 0 ${block.styleOverrides.resizeFrame.width} ${block.styleOverrides.resizeFrame.height}` : undefined} preserveAspectRatio={block.styleOverrides.resizeFrame ? "none" : "xMidYMid meet"} overflow="visible" wrapNode={canMove ? (painted, node) => {
      if (node.kind !== "text" && node.kind !== "image") return painted;
      const id = node.contentId!;
      const bounds = contentNodeBounds(node);
      const chosen = id === activeId;
      return <g className={`block-content-node ${chosen ? "is-active" : ""}`} tabIndex={0} role="button" aria-label={`Move ${node.kind === "text" ? node.text || "empty text" : node.alt || "image"}`} aria-pressed={chosen}
        onFocus={() => setActiveId(id)} onMouseDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
        onPointerDown={event => start(event, id)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
        onDoubleClick={event => { event.stopPropagation(); editText(node); }}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.key === "Escape") { event.preventDefault(); cancelDrag(); setActiveId(null); setEditing(false); }
          if (event.key === "Enter") { event.preventDefault(); editText(node); }
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
            event.preventDefault(); const step = event.shiftKey ? 10 : 1;
            save(id, { dx: event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0, dy: event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0 }, true);
          }
        }}>
        <title>Drag to move · Shift locks direction · Arrow keys nudge{node.kind === "text" ? " · Double-click to edit" : ""}</title>
        {painted}
        <rect {...{ x: bounds.x - 2, y: bounds.y - 2, width: bounds.width + 4, height: bounds.height + 4 }} className="block-content-hitbox" vectorEffect="non-scaling-stroke" />
        {chosen && editing && node.kind === "text" && <foreignObject x={bounds.x - 2} y={bounds.y - 3} width={Math.max(1, Math.min(node.wrapWidth ?? scene.width - bounds.x, Math.max(bounds.width + 12, 120)))} height={Math.max(bounds.height + 8, 32)}>
          <textarea autoFocus aria-label="Edit selected text" value={draft} className="block-content-text-input" style={{ fontSize: node.size, fontFamily: node.fontFamily, fontWeight: node.bold ? 700 : 400, resize: "none", overflowWrap: "anywhere" }}
            onChange={event => setDraft(event.target.value)} onBlur={commitText} onPointerDown={event => event.stopPropagation()}
            onKeyDown={event => { event.stopPropagation(); if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); commitText(); } if (event.key === "Escape") { event.preventDefault(); setEditing(false); } }} />
        </foreignObject>}
      </g>;
    } : undefined} />
    {artboard ? createPortal(tools, artboard) : tools}
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={event => {
      const file = event.target.files?.[0], id = activeId;
      event.target.value = "";
      if (!file || !id || !canEdit) return;
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === "string") save(id, { src: reader.result }); };
      reader.onerror = () => useUiStore.getState().showToast({ type: "error", title: "Image could not be read", message: "Choose another image and try again." });
      reader.readAsDataURL(file);
    }}/>
  </div>;
}
