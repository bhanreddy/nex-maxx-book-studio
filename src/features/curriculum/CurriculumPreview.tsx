"use client";
import React, { memo, useMemo, useEffect, useState } from "react";
import type { PageDefinition } from "../../domain/book/types";
import type { PageElement } from "../../domain/element/types";
import type { CurriculumLayout, CurriculumGrade } from "../../domain/educational/curriculum";
import { PublicationSceneView } from "../../editor/renderer/PublicationSceneView";
import { buildPublicationScene, type PublicationScene } from "../../editor/educational/publicationScene";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import { premiumLayoutOverrides } from "../../editor/curriculum/premiumLayouts";
import { makeLibraryBlock } from "../../editor/curriculum/libraryExamples";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";

/** Frame the real scene on the part that shows its layout, without drawing a substitute graphic. */
export function libraryFrame(scene: PublicationScene): string {
  const windowH = Math.min(scene.height, Math.max(150, Math.round(scene.width * 0.56)));
  if (scene.height <= windowH + 20) return `0 0 ${scene.width} ${scene.height}`;
  const marks: number[] = [];
  for (const n of scene.nodes) {
    if (n.kind === "line") marks.push(Math.min(n.y, n.y2), Math.max(n.y, n.y2));
    else if (n.kind === "ellipse") marks.push(n.y - n.ry, n.y + n.ry);
    else if (n.kind === "rect" && n.h < scene.height * 0.85 && n.w < scene.width * 0.98 && (n.stroke || n.fill === "none")) marks.push(n.y, n.y + n.h);
    else if (n.kind === "polygon") n.points.forEach(p => marks.push(p[1]));
  }
  if (!marks.length) return `0 0 ${scene.width} ${windowH}`;
  const title = scene.nodes.filter(n => n.kind === "text").sort((a, b) => b.size - a.size)[0];
  const minMark = Math.min(...marks);
  // Keep the heading in the thumbnail whenever it sits inside the first window, so a chapter title is not cropped away.
  if ((title && title.y < windowH) || minMark < windowH) {
    return `0 0 ${scene.width} ${windowH}`;
  }
  const focus = marks.reduce((sum, y) => sum + y, 0) / marks.length;
  const start = Math.max(0, Math.min(scene.height - windowH, focus - windowH * 0.4));
  return `0 ${Math.round(start)} ${scene.width} ${windowH}`;
}
export const CurriculumPreview = memo(function CurriculumPreview({ type, layout, grade = 3, subject = "Science", block, framed = true }: { type: string; layout?: CurriculumLayout; grade?: CurriculumGrade; subject?: string; block?: SmartBlockInstance; framed?: boolean }) {
  const preference = useCurriculumUi(state => state.layoutPreferences[type]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const scene = useMemo(() => {
    if (!mounted) return null;
    const source = block || makeLibraryBlock(type, grade, subject);
    return buildPublicationScene({ ...source, transform: { ...source.transform, width: block ? block.transform.width : 517, height: 0 }, styleOverrides: { ...source.styleOverrides, ...(!block ? preference : {}), sceneSlice: undefined, ...(layout ? { layoutVariant: layout, ...premiumLayoutOverrides(source.styleOverrides, layout) } : {}) } });
  }, [type, layout, grade, subject, block, mounted, preference]);
  if (!scene) return <div className="curriculum-block-preview skeleton-preview" aria-hidden="true"/>;
  const name = block?.semanticContent.title || type;
  return <div className="curriculum-block-preview"><PublicationSceneView scene={scene} viewBox={framed ? libraryFrame(scene) : undefined} label={`${name} layout preview`}/></div>;
});
export const CurriculumPagePreview = memo(function CurriculumPagePreview({ page, elements, width, height }: { page: PageDefinition; elements: Record<string, PageElement>; width: number; height: number }) {
  return <div className="curriculum-page-preview" style={{ aspectRatio: `${width}/${height}` }}>
    {page.elementIds.map(id => {
      const el = elements[id]; if (!el || el.hidden) return null;
      if (el.content.curriculumDecoration) return <div key={id} style={{ position: "absolute", inset: 0, background: el.style.backgroundColor }}/>;
      if (!el.smartBlockData) return null;
      return <div key={id} style={{ position: "absolute", left: `${el.transform.x / width * 100}%`, top: `${el.transform.y / height * 100}%`, width: `${el.transform.width / width * 100}%`, height: `${el.transform.height / height * 100}%`, transform: `rotate(${el.transform.rotation}deg)` }}>
        <PublicationSceneView scene={buildPublicationScene({ ...el.smartBlockData, transform: el.transform })} label={el.displayName}/>
      </div>;
    })}
    <span className="absolute bottom-2 right-3 text-[7px] text-slate-400">{page.displayNumber}</span>
  </div>;
});
