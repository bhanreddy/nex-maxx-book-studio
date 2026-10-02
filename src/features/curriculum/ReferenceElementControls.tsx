"use client";
import React from "react";
import type { SmartBlockInstance, ReferenceIcon } from "../../domain/educational/blockSchema";
import { REFERENCE_ELEMENTS } from "../../editor/curriculum/referenceElements";
import { REFERENCE_ELEMENT_TOKENS as T } from "../../domain/educational/designTokens";
import { applyChapterReferenceElements } from "../../editor/curriculum/actions";

export function ReferenceElementControls({block,onChange,chapterId}: {block:SmartBlockInstance;onChange:(patch:Partial<SmartBlockInstance["styleOverrides"]>)=>void;chapterId?:string}) {
  const o=block.styleOverrides, r=o.referenceElement;
  const change=(patch:Partial<NonNullable<typeof r>>)=>{if(r)onChange({referenceElement:{...r,...patch}});};
  const field=(label:string,key:"skillLabel"|"number"|"hint"|"answerLabel")=><label className="curriculum-field"><span>{label}</span><input key={`${block.id}-${key}-${r?.[key]}`} defaultValue={r?.[key] || ""} onBlur={e=>{if(e.target.value!==r?.[key])change({[key]:e.target.value});}}/></label>;
  return <div className="space-y-3">
    <span className="curriculum-eyebrow">REFERENCE RIBBONS & WORKSHEETS</span>
    <label className="curriculum-field"><span>Element design</span><select value={r?.kind || ""} onChange={e=>{const preset=REFERENCE_ELEMENTS.find(p=>p.kind===e.target.value);onChange({referenceElement:preset?{...r,kind:preset.kind,icon:r?.icon || preset.icon,showBody:r?.showBody ?? true}:undefined});}}>
      <option value="">Original design</option>{REFERENCE_ELEMENTS.map(p=><option key={p.kind} value={p.kind}>{p.name}</option>)}
    </select></label>
    {r && <>
      <label className="curriculum-field"><span>Editable vector icon</span><select value={r.icon || "book"} onChange={e=>change({icon:e.target.value as ReferenceIcon})}>{["check","book","target","bulb","puzzle","leaf","flask","globe","computer","none"].map(icon=><option key={icon} value={icon}>{icon}</option>)}</select></label>
      {r.kind==="exercise" && field("Exercise number (e.g. 1.1 or 2.3)","number")}
      {field("Skill badge (leave blank to hide)","skillLabel")}
      {field("Hint (leave blank to hide)","hint")}
      {field("Answer label (leave blank to hide)","answerLabel")}
      <label className="curriculum-field"><span>Writing lines per question</span><input type="number" min={0} max={12} value={r.answerLines ?? 1} onChange={e=>change({answerLines:Math.max(0,Math.min(12,Number(e.target.value)||0))})}/></label>
      <label className="curriculum-field"><span>Writing line spacing (pt)</span><input type="number" min={18} max={100} value={o.answerSpacePt ?? 26} onChange={e=>onChange({answerSpacePt:Math.max(18,Math.min(100,Number(e.target.value)||26))})}/></label>
      <label className="flex gap-2 items-center text-xs text-slate-300 min-h-11"><input type="checkbox" checked={r.showBody!==false} onChange={e=>change({showBody:e.target.checked})}/>Show editable content beneath banner</label>
      <div className="grid grid-cols-2 gap-3">{([
        ["primary","Ribbon",T.navy],["accent","Accent",T.coral],["surface","Paper",T.paper],["text","Text",T.ink],["border","Border / secondary",T.plum],
      ] as const).map(([key,label,color])=><label className="curriculum-field" key={key}><span>{label}</span><input type="color" value={o.customPalette?.[key] || color} onChange={e=>onChange({customPalette:{...o.customPalette,[key]:e.target.value}})}/></label>)}</div>
      <p className="text-xs text-slate-400">Edit the heading, questions and steps in Content. Use Free Edit to move, resize or recolour every individual vector and text layer.</p>
    </>}
    {chapterId && <button type="button" className="curriculum-primary w-full min-h-11" onClick={()=>applyChapterReferenceElements(chapterId)}>Apply reference style to every chapter page</button>}
    {chapterId && <p className="text-xs text-slate-400">Preserves your subject content. Connected maps, study skills and learning targets keep their specialised editable layouts. New chapter elements inherit this style.</p>}
  </div>;
}
