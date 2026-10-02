"use client";
import { PageFrameView } from "../../editor/renderer/PageFrameView";
import { PublisherFooterView } from "../../editor/renderer/PublisherFooterView";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import type { PageDefinition } from "../../domain/book/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { publicationSceneForElement } from "../../editor/educational/publicationPdf";
import { PublicationSceneView } from "../../editor/renderer/PublicationSceneView";

const ThumbnailLayer = memo(function ThumbnailLayer({ id, width, height }: { id: string; width: number; height: number }) {
  const element = useEditorStore(s => s.elements[id]);
  const scene = useMemo(() => element ? publicationSceneForElement(element) : null, [element]);
  if (!element || element.hidden) return null;
  const t = element.transform;
  return <div style={{ position: "absolute", left: `${t.x / width * 100}%`, top: `${t.y / height * 100}%`, width: `${t.width / width * 100}%`, height: `${t.height / height * 100}%`, transform: `rotate(${t.rotation}deg)`, opacity: element.style.opacity, overflow: "hidden", background: scene ? undefined : element.style.backgroundColor }}>
    {scene ? <PublicationSceneView scene={scene} label={element.displayName}/> : element.content.text ? <svg viewBox={`0 0 ${t.width} ${t.height}`} width="100%" height="100%"><text x="0" y={element.style.fontSize || 12} fontSize={element.style.fontSize || 12} fill={element.style.color || "#334155"}>{element.content.text}</text></svg> : null}
  </div>;
});

/** Off-screen pages mount no scenes; visible layers subscribe only to their own element. */
export const EditorPageThumbnail = memo(function EditorPageThumbnail({ page, width, height }: { page: PageDefinition; width: number; height: number }) {
  const book = useEditorStore(s => s.getActiveBook());
  const elements = useEditorStore(s => s.elements);
  const ref = useRef<HTMLDivElement>(null), [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { rootMargin: "80px" });
    observer.observe(ref.current); return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="w-full flex-1 bg-white relative overflow-hidden pointer-events-none" aria-hidden="true">
    {visible && book && <PageFrameView book={book} page={page}/>}
    {visible && page.elementIds.map(id => <ThumbnailLayer key={id} id={id} width={width} height={height}/>)}
    {visible && book && <PublisherFooterView book={book} page={page} elements={elements}/>}
  </div>;
});
