"use client";
import React, { useEffect, useMemo, useState } from "react";
import { REFERENCE_ELEMENTS } from "../../editor/curriculum/referenceElements";
import { makeReferenceLibraryBlock } from "../../editor/curriculum/libraryExamples";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";
import { buildPublicationScene } from "../../editor/educational/publicationScene";
import { PublicationSceneView } from "../../editor/renderer/PublicationSceneView";
import type { CurriculumGrade } from "../../domain/educational/curriculum";

export function ReferenceElementsLibrary({ grade, subject, onInsert }: { grade: CurriculumGrade; subject: string; onInsert?: () => void }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const blocks = useMemo(() => REFERENCE_ELEMENTS.map(preset => ({preset, block:makeReferenceLibraryBlock(preset.kind,grade,subject)})),[grade,subject]);
  return <div className="curriculum-template-block">
    <button type="button" className="curriculum-reference-toggle" onClick={()=>setOpen(!open)} aria-expanded={open}>Reference elements · 10 editable designs {open ? "−" : "+"}</button>
    {open && <><p className="curriculum-reference-note">Ribbons and worksheet cards for {subject || "any subject"}. Edit words, icons, colours and writing space in the inspector. Apply the style to every chapter page from Style.</p>
      <div className="curriculum-block-grid">
        {mounted ? blocks.map(({preset,block})=><button type="button" key={preset.kind} className="curriculum-preset" aria-label={`Add reference ${preset.name}`} onClick={()=>{insertCurriculumBlock(preset.type,undefined,grade,subject,block);onInsert?.();}}>
          <div className="curriculum-preview-wrapper" style={{height:100}}><PublicationSceneView scene={buildPublicationScene({...block,transform:{...block.transform,width:517},styleOverrides:{...block.styleOverrides,referenceElement:{...block.styleOverrides.referenceElement!,showBody:false}}})} label={`${preset.name} editable vector preview`}/></div>
          <div className="curriculum-preset-caption"><strong>{preset.name}</strong><small>Add editable element</small></div>
        </button>) : (
          <div className="h-28 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
        )}
      </div></>}
  </div>;
}

