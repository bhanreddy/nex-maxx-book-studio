"use client";
import React, { useMemo, useState } from "react";
import { Plus, Sparkles, RefreshCw, WandSparkles, ListTree } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import { pageDensity } from "../../editor/curriculum/chapterEngine";
import { setFrameworkMode, editFramework } from "../../editor/curriculum/actions";
import { CurriculumBlocksPanel } from "./CurriculumBlocksPanel";
import { CurriculumAiAssist } from "./CurriculumAiAssist";
export function CurriculumWorkspaceBar() {
  const book=useEditorStore(s=>s.getActiveBook()),index=useEditorStore(s=>s.activePageIndex),elements=useEditorStore(s=>s.elements);
  const openBuilder=useCurriculumUi(s=>s.openBuilder),setInsert=useCurriculumUi(s=>s.setInsertOpen);
  const [ai,setAi]=useState(false);
  const page=book?.pages[index],chapter=book?.chapters.find(c=>c.framework&&(c.id===page?.chapterId||c.pageIds.includes(page?.id||"")));
  const density=useMemo(()=>book&&page?pageDensity(page,elements,book):undefined,[book,page,elements]);
  return <div className="curriculum-workspace-bar">
    <button onClick={()=>openBuilder()} className="curriculum-bar-create"><Sparkles size={14}/>New Chapter<span>Choose class, subject and style</span></button>
    <button onClick={()=>setInsert(true)}><Plus size={14}/>Add element</button>
    {chapter&&<><span className="curriculum-bar-divider"/><button onClick={()=>useUiStore.getState().setLeftPanelTab("structure")} className="curriculum-bar-chapter"><ListTree size={14}/><span>{String(chapter.number).padStart(2,"0")} · {chapter.title}</span></button><div className="curriculum-mode-switch">{(["easy","design"] as const).map(mode=><button key={mode} aria-pressed={chapter.framework!.mode===mode} onClick={()=>setFrameworkMode(chapter.id,mode)}>{mode === "easy" ? "Easy mode" : "Design mode"}</button>)}</div><button onClick={()=>editFramework(chapter.id,"Auto reflow chapter",f=>f)} title="Arrange pages around the current content"><RefreshCw size={13}/>Fix page flow</button><button onClick={()=>setAi(true)}><WandSparkles size={13}/>Draft text</button></>}
    <div className="curriculum-density" title={`${density?.words||0} words · ${Math.round((density?.ratio||0)*100)}% content footprint`}><span className={`density-dot density-${density?.label.toLowerCase()}`}/>{density?.label||"Light"}</div>
    {ai&&chapter&&<CurriculumAiAssist chapter={chapter} onClose={()=>setAi(false)}/>}
  </div>;
}
export function CurriculumInsertOverlay() {
  const open=useCurriculumUi(s=>s.insertOpen),setOpen=useCurriculumUi(s=>s.setInsertOpen);
  React.useEffect(()=>{if(!open)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[open,setOpen]);
  return open?<div className="curriculum-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}><div className="curriculum-insert-dialog" role="dialog" aria-modal="true" aria-label="Insert curriculum block"><CurriculumBlocksPanel floating/></div></div>:null;
}
