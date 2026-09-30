"use client";
import React, { useEffect, useRef } from "react";
import { X, ArrowUpRight, LayoutTemplate } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { composePage, type PageCompositionStyle } from "../../editor/core/pageComposition";

const compositions:{id:PageCompositionStyle;title:string;description:string}[]=[
  {id:"balanced",title:"The considered page",description:"A clear opening, balanced image and text, then supporting ideas."},
  {id:"visual",title:"The visual story",description:"A generous image leads into two columns of supporting content."},
  {id:"reading",title:"The reading room",description:"A wide reading column with a narrow companion rail."},
  {id:"compact",title:"The learning grid",description:"Two ordered columns for practice, vocabulary, and short activities."},
  {id:"playful",title:"The discovery path",description:"Offset cards create a lively sequence with room to breathe."},
];
export const LayoutGalleryModal:React.FC=()=>{
  const open=useUiStore(s=>s.activeLayoutGalleryOpen),close=useUiStore(s=>s.setActiveLayoutGalleryOpen);
  const store=useEditorStore(),dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;dialog.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close(false);if(e.key==="Tab"){const items=dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener("keydown",key);return()=>{window.removeEventListener("keydown",key);previous?.focus();};},[open,close]);
  const book=store.getActiveBook(),page=store.getActivePage();if(!open||!book||!page)return null;
  const elements=store.getActivePageElements();
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70" onClick={()=>close(false)}><div role="dialog" aria-modal="true" aria-labelledby="composition-title" tabIndex={-1} ref={dialog} className="composition-dialog" onClick={e=>e.stopPropagation()}>
    <header className="flex items-start justify-between p-6 border-b border-white/10"><div><span className="studio-eyebrow flex items-center gap-2"><LayoutTemplate size={14}/> THE LAYOUT ATELIER</span><h2 id="composition-title" className="text-2xl font-semibold tracking-tight mt-2">Give your page a new perspective.</h2><p className="text-sm text-slate-400 mt-2">Live compositions of page {page.displayNumber}. Choose the rhythm that suits your lesson.</p></div><button className="studio-icon-button" aria-label="Close layout gallery" onClick={()=>close(false)}><X size={18}/></button></header>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto">{compositions.map(item=>{
      const result=composePage(elements,book.dimensions,page.overrideMargins||book.margins,item.id);
      return <button key={item.id} disabled={!result.fits||!result.count} className="composition-card text-left" onClick={()=>{store.autoArrangeActivePage(item.id);close(false);}}>
        <div className="composition-preview"><svg viewBox={`0 0 ${book.dimensions.widthPt} ${book.dimensions.heightPt}`} role="img" aria-label={`${item.title} page preview`}><rect width={book.dimensions.widthPt} height={book.dimensions.heightPt} fill="var(--studio-paper)" rx="8"/>{elements.filter(el=>!el.hidden).map(el=>{const t=result.transforms[el.id]||el.transform;return <g key={el.id}><rect x={t.x} y={t.y} width={t.width} height={t.height} rx="5" fill={el.category==="media"?"var(--studio-teal)":el.smartBlockData?"var(--studio-lilac)":el.category==="decorative"?"var(--studio-sand)":"var(--studio-ink)"} opacity={el.category==="text"?.35:.8}/>{el.category==="text"&&[.22,.4,.58].map(f=><rect key={f} x={t.x+8} y={t.y+t.height*f} width={Math.max(0,t.width-16)} height="2" fill="var(--studio-paper)"/>)}</g>;})}</svg></div>
        <div className="p-4"><div className="flex justify-between items-center"><strong className="text-sm">{item.title}</strong><ArrowUpRight size={15}/></div><p className="text-xs leading-relaxed text-slate-400 mt-2">{item.description}</p><span className="block studio-eyebrow mt-4">{!result.count?"Add content to begin":result.fits?"Apply composition":"Needs another page"}</span></div>
      </button>;
    })}</div><footer className="px-6 py-4 border-t border-white/10 text-xs text-slate-400">Text stays readable. Locked objects stay in place. Undo returns the entire page to its previous layout.</footer>
  </div></div>;
};
