"use client";
import React, { useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Columns3, Rows3, LayoutGrid } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import type { ArrangeMode } from "../../editor/core/arrangement";

export function ArrangeControls() {
  const [relative,setRelative]=useState<"selection"|"page">("selection"),[gap,setGap]=useState(18),[columns,setColumns]=useState(2);
  const arrange=useEditorStore(s=>s.arrangeSelection);
  const count=useEditorStore(s=>s.selectedElementIds.length);
  const action=(mode:ArrangeMode)=>arrange(mode,relative,gap,columns);
  return <section className="arrange-workbench space-y-3"><div className="flex justify-between items-center"><h3 className="text-xs font-semibold text-slate-800 dark:text-white">Position & spacing</h3><span className="studio-eyebrow">{count} selected</span></div>
    <label className="publication-field">Align to<select value={relative} onChange={e=>setRelative(e.target.value as typeof relative)}><option value="selection">Selection bounds</option><option value="page">Page margins</option></select></label>
    <div className="grid grid-cols-6 gap-1">{([["left",AlignLeft],["center",AlignCenter],["right",AlignRight],["top",AlignStartVertical],["middle",AlignCenterVertical],["bottom",AlignEndVertical]] as const).map(([mode,Icon])=><button className="studio-icon-button" key={mode} aria-label={`Align ${mode}`} title={`Align ${mode}`} onClick={()=>action(mode)}><Icon size={16}/></button>)}</div>
    <div className="grid grid-cols-2 gap-2"><button className="publication-button" disabled={count<3} onClick={()=>action("horizontal")}>Equal horizontal gaps</button><button className="publication-button" disabled={count<3} onClick={()=>action("vertical")}>Equal vertical gaps</button></div>
    <div className="grid grid-cols-2 gap-2"><label className="publication-field">Gap · pt<input type="number" min="0" max="144" value={gap} onChange={e=>setGap(Math.max(0,Math.min(144,Number(e.target.value))))}/></label><label className="publication-field">Grid columns<select value={columns} onChange={e=>setColumns(Number(e.target.value))}>{[2,3,4].map(n=><option key={n} value={n}>{n} columns</option>)}</select></label></div>
    <div className="grid grid-cols-3 gap-2">{([["stack","Stack",Rows3],["row","Row",Columns3],["grid","Grid",LayoutGrid]] as const).map(([mode,label,Icon])=><button key={mode} className="publication-button flex flex-col items-center gap-1" disabled={count<2} onClick={()=>action(mode)}><Icon size={16}/>{label}</button>)}</div>
    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">Exact spacing, original sizes. Locked objects stay in place. Undo the entire arrangement in one step.</p>
  </section>;
}
