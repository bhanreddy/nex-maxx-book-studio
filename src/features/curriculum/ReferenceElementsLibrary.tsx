"use client";
import React, { useEffect, useMemo, useState } from "react";
import { REFERENCE_ELEMENTS, PREMIUM_REFERENCE_ELEMENTS } from "../../editor/curriculum/referenceElements";
import { makeReferenceLibraryBlock } from "../../editor/curriculum/libraryExamples";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";
import { buildPublicationScene } from "../../editor/educational/publicationScene";
import { PublicationSceneView } from "../../editor/renderer/PublicationSceneView";
import type { CurriculumGrade } from "../../domain/educational/curriculum";
import { REFERENCE_ARTWORKS } from '../../editor/educational/referenceBanners';
import { ReferenceBannerLibrary } from '../educational/ReferenceBannerLibrary';

export function ReferenceElementsLibrary({ grade, subject, onInsert, initialOpen = false, showToggle = true }: { grade: CurriculumGrade; subject: string; onInsert?: () => void; initialOpen?: boolean; showToggle?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [premium, setPremium] = useState(true);
  const [originals, setOriginals] = useState(true);
  const [mode, setMode] = useState<"banner" | "worksheet">(showToggle ? "worksheet" : "banner");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const blocks = useMemo(() => REFERENCE_ELEMENTS.filter(preset => Boolean(preset.premium) === premium).map(preset => {
    const block = makeReferenceLibraryBlock(preset.kind, grade, subject);
    const scene = buildPublicationScene({ ...block, transform: { ...block.transform, width: 517 }, styleOverrides: { ...block.styleOverrides, referenceElement: { ...block.styleOverrides.referenceElement!, showBody: false } } });
    return { preset, block, scene };
  }), [grade, subject, premium]);
  return <div className="curriculum-template-block reference-banner-library">
    {showToggle && <button type="button" className="curriculum-reference-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>Reference elements · {REFERENCE_ELEMENTS.length} editable designs {open ? "−" : "+"}</button>}
    {(open || !showToggle) && <>
      {!originals && <div className="reference-banner-intro">
        <span className="studio-eyebrow">NEX MAXX · THE BANNER COLLECTION</span>
        <h2>Banners with presence.</h2>
        <p>Original sculpted artwork and editable chapter markers.</p>
      </div>}
      <div className="reference-banner-options" role="group" aria-label="Banner collection">
        <button type="button" aria-pressed={originals} onClick={() => setOriginals(true)}>Images · {REFERENCE_ARTWORKS.length}</button>
        <button type="button" aria-pressed={!originals && premium} onClick={() => { setOriginals(false); setPremium(true); }}>Premium · {PREMIUM_REFERENCE_ELEMENTS.length}</button>
        <button type="button" aria-pressed={!originals && !premium} onClick={() => { setOriginals(false); setPremium(false); }}>Classic · {REFERENCE_ELEMENTS.length - PREMIUM_REFERENCE_ELEMENTS.length}</button>
      </div>
      {originals ? <ReferenceBannerLibrary onInsert={onInsert} /> : <>
      <label className="reference-banner-mode">Insert as<select aria-label="Banner insertion mode" value={mode} onChange={e => setMode(e.target.value as "banner" | "worksheet")}><option value="banner">Banner only</option><option value="worksheet">Banner + worksheet</option></select></label>
      <div className="curriculum-block-grid">
        {mounted ? blocks.map(({ preset, block, scene }) => <button type="button" key={preset.kind} className="curriculum-preset reference-banner-card" aria-label={`Add reference ${preset.name}`} onClick={() => {
          const inserted = { ...block, styleOverrides: { ...block.styleOverrides, referenceElement: { ...block.styleOverrides.referenceElement!, showBody: mode === "worksheet" } } };
          insertCurriculumBlock(preset.type, undefined, grade, subject, inserted); onInsert?.();
        }}>
          <div className="curriculum-preview-wrapper reference-banner-preview" style={{ aspectRatio: `${scene.width} / ${scene.height + 32}` }}><PublicationSceneView scene={scene} label={`${preset.name} editable vector preview`} /></div>
          <div className="curriculum-preset-caption"><span className="reference-banner-edition">{preset.premium ? "THE PREMIUM EDITION" : "THE CLASSIC COLLECTION"}</span><strong>{preset.name}</strong><small>{preset.premium?.description || "An editable ribbon for your chapter."}</small><span className="reference-banner-add">{mode === "banner" ? "Add banner" : "Add banner + worksheet"}<span aria-hidden="true">↗</span></span></div>
        </button>) : <div className="h-28 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />}
      </div>
      <p className="curriculum-reference-note">Edit the heading, icon, colours and number in the inspector. Free Edit unlocks the individual text and vector layers.</p>
      </>}
    </>}
  </div>;
}
