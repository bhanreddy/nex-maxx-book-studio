"use client";
import React, { useEffect, useMemo, useState, memo } from "react";
import { withSubjectExample } from "../../editor/educational/subjectExamples";
import { readPublicationImage } from "./PublicationInspector";
import { useUiStore } from "../../editor/stores/uiStore";
import { Search, Star, Plus, BookOpen, ArrowUpRight, Shapes } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { EDUCATIONAL_BLOCK_REGISTRY, createSmartBlockInstance } from "../../editor/educational/blockRegistry";
import { PUBLICATION_CATALOG } from "../../editor/educational/publicationCatalog";
import { COLLECTIONS, PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { ARTWORKS, artworkNodes, buildPublicationScene } from "../../editor/educational/publicationScene";
import { PUBLICATION_PAGES } from "../../editor/educational/publicationPages";
import { PublicationSceneView } from "../../editor/renderer/PublicationSceneView";
import type { GradeBand, SubjectDomain } from "../../domain/educational/blockSchema";
import type { EducationalBlockDefinition } from "../../domain/educational/blockSchema";

const cachedFilters = {
  tab: "blocks" as "blocks" | "pages" | "artwork",
  search: "",
  category: "all",
  family: "all",
  subject: "all",
  grade: "all",
  legacy: false,
  signature: false,
};

const BlockPreview=memo(function BlockPreview({definition,subject}:{definition:EducationalBlockDefinition;subject:string}){
  const scene=useMemo(()=>{let block=createSmartBlockInstance(definition.id,"preview")!;if(subject!=="all"&&definition.supportedSubjects.includes("general"))block=withSubjectExample(block,subject as SubjectDomain);block.transform.height=0;return buildPublicationScene(block);},[definition,subject]);
  return <div className="publication-thumb" style={{aspectRatio:`${scene.width} / ${Math.min(scene.height,330)}`}}><PublicationSceneView scene={scene} label={`${definition.name} preview`}/></div>;
});
const selectClass="publication-select";
export const EducationalBlocksPanel:React.FC=()=>{
  const saved=useEditorStore(s=>s.publicationPresets),insertSaved=useEditorStore(s=>s.insertPublicationPreset);
  const addPages=useEditorStore(s=>s.addPublicationPages),demo=useEditorStore(s=>s.createPublicationDemo),addArt=useEditorStore(s=>s.addPublicationArtwork);
  const [tab,setTab]=useState<"blocks"|"pages"|"artwork">(cachedFilters.tab);
  const [search,setSearch]=useState(cachedFilters.search);
  const [category,setCategory]=useState(cachedFilters.category);
  const [family,setFamily]=useState(cachedFilters.family);
  const [subject,setSubject]=useState(cachedFilters.subject);
  const [grade,setGrade]=useState(cachedFilters.grade);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [limit,setLimit]=useState(12);
  const [legacy,setLegacy]=useState(cachedFilters.legacy);
  const [signature,setSignature]=useState(cachedFilters.signature);

  useEffect(()=>{cachedFilters.tab=tab;},[tab]);
  useEffect(()=>{cachedFilters.search=search;},[search]);
  useEffect(()=>{cachedFilters.category=category;},[category]);
  useEffect(()=>{cachedFilters.family=family;},[family]);
  useEffect(()=>{cachedFilters.subject=subject;},[subject]);
  useEffect(()=>{cachedFilters.grade=grade;},[grade]);
  useEffect(()=>{cachedFilters.legacy=legacy;},[legacy]);
  useEffect(()=>{cachedFilters.signature=signature;},[signature]);

  useEffect(()=>{try{const v=JSON.parse(localStorage.getItem("nex-publication-favourites")||"[]");if(Array.isArray(v))setFavorites(v.filter(x=>typeof x==="string"));}catch{}},[]);
  const filtered=useMemo(()=>Object.values(EDUCATIONAL_BLOCK_REGISTRY).filter(b=>
    (legacy || b.collectionVersion===3) && (!signature || b.tags.includes("signature")) && (category==="all"||category==="favorites"&&favorites.includes(b.id)||category===b.category) &&
    (family==="all"||b.family===family) && (subject==="all"||b.supportedSubjects.includes(subject as SubjectDomain)||b.supportedSubjects.includes("general")) &&
    (grade==="all"||b.supportedGrades.includes(grade as GradeBand)) && `${b.name} ${b.tags.join(" ")} ${b.category}`.toLowerCase().includes(search.toLowerCase())
  ),[search,category,family,subject,grade,legacy,favorites,signature]);

  const filteredSaved=useMemo(()=>Object.entries(saved).filter(([id,p])=>!search||`${p.name} ${p.block.presetId}`.toLowerCase().includes(search.toLowerCase())),[saved,search]);

  const toggle=(id:string)=>{setFavorites(old=>{const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];try{localStorage.setItem("nex-publication-favourites",JSON.stringify(next));}catch{}return next;});};
  const insert=(id:string)=>{
    useEditorStore.getState().addEducationalBlock(id,undefined,undefined,{subject,grade});
  };
  return <div className="publication-panel flex flex-1 flex-col min-h-0">
    <div className="px-4 pt-4 pb-3"><div className="flex items-center gap-2 text-amber-200 text-[10px] uppercase tracking-[.18em]"><span className="w-5 h-px bg-amber-200/60"/>THE SIGNATURE COLLECTION</div><h2 className="text-[23px] text-white font-semibold tracking-tight mt-1">Little minds. Big ideas.</h2><p className="text-xs text-slate-400 mt-1 leading-relaxed">Beautiful pages for every subject.<br/>Made to explore. Made to make your own.</p></div>
    <div className="flex px-3 gap-1 border-b border-white/10">{(["blocks","pages","artwork"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`flex-1 py-3 text-xs capitalize border-b-2 ${tab===t?"border-amber-200 text-amber-100":"border-transparent text-slate-400"}`}>{t}</button>)}</div>
    {tab==="blocks"&&<>
      <div className="p-3 space-y-2"><div className="studio-collection-toggle"><button aria-pressed={!signature} onClick={()=>{setSignature(false);setLimit(12);}}>All layouts</button><button aria-pressed={signature} onClick={()=>{setSignature(true);setLimit(12);}}>✦ Signature · new</button></div><label className="relative block"><Search size={14} className="absolute top-3 left-3 text-slate-400"/><input aria-label="Search educational templates" value={search} onChange={e=>{setSearch(e.target.value);setLimit(12);}} placeholder="Search masthead, lesson schema, warm-up…" className={`${selectClass} pl-9`}/></label>
        <div className="grid grid-cols-2 gap-2"><select aria-label="Teaching purpose" value={category} onChange={e=>{setCategory(e.target.value);setLimit(12);}} className={selectClass}><option value="all">All teaching purposes</option><option value="favorites">Favourites</option><option value="saved">My templates</option>{PUBLICATION_CATALOG.map(([id,title])=><option value={id} key={id}>{title}</option>)}</select><select aria-label="Design collection" value={family} onChange={e=>{setFamily(e.target.value);setLimit(12);}} className={selectClass}><option value="all">All collections</option>{Object.entries(COLLECTIONS).map(([id,c])=><option key={id} value={id}>{c.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2"><select aria-label="Subject" value={subject} onChange={e=>setSubject(e.target.value)} className={selectClass}><option value="all">Any subject</option>{["mathematics","science","english","social-studies","environmental","computer-science","early-learning","general"].map(v=><option key={v} value={v}>{v==="general"?"Art, music & any subject":v.replaceAll("-"," ")}</option>)}</select><select aria-label="Grade band" value={grade} onChange={e=>setGrade(e.target.value)} className={selectClass}><option value="all">Any grade</option><option value="early-years">Early years</option><option value="primary-lower">Grades 1–2</option><option value="primary-upper">Grades 3–5</option><option value="middle-school">Grades 6–8</option><option value="secondary-plus">Grades 9+</option></select></div>
        <div className="flex justify-between items-center text-[10px] text-slate-400"><span>{filtered.length} editable layouts</span><label className="flex items-center gap-1.5"><input type="checkbox" checked={legacy} onChange={e=>setLegacy(e.target.checked)}/>Include earlier layouts</label></div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 space-y-3">
        {category==="saved"&&!Object.keys(saved).length&&<p className="p-4 text-xs text-slate-400">Your reusable designs will appear here. Select any designed block on the canvas, then choose “Save as a reusable template” in the inspector.</p>}
        {category==="saved"&&Object.keys(saved).length>0&&!filteredSaved.length&&<p className="p-4 text-xs text-slate-400">No saved templates match your search.</p>}
        {category==="saved"&&filteredSaved.map(([id,p])=><button key={id} onClick={()=>insertSaved(id)} className="publication-library-card w-full text-left"><div className="publication-thumb" style={{height:160}}><PublicationSceneView scene={buildPublicationScene(p.block)} label={p.name}/></div><div className="p-3 text-xs text-white">{p.name} · Insert saved template</div></button>)}
        {category!=="saved"&&filtered.slice(0,limit).map(b=><article key={b.id} className="publication-library-card" draggable onDragStart={e=>{e.dataTransfer.setData("application/x-nexmaxx-block-id",b.id);e.dataTransfer.setData("application/x-nexmaxx-block-payload",JSON.stringify({id:b.id,subject,grade}));}}>
          <button className="block w-full text-left" onClick={()=>insert(b.id)} aria-label={`Insert ${b.name}`}><BlockPreview definition={b} subject={subject}/><div className="px-3 pt-2"><div className="text-[9px] uppercase tracking-[.12em] text-amber-200/80">{COLLECTIONS[b.family]?.name}{b.tags.includes("signature")?" · Signature":b.collectionVersion===3?" · Atelier":""}</div><div className="text-xs font-semibold text-slate-100 mt-1">{b.name}</div><div className="text-[11px] text-slate-400 mt-1">{PUBLICATION_CATALOG.find(([id])=>id===b.category)?.[1] || b.category}</div>{b.description&&<div className="text-[11px] text-slate-500 mt-1 leading-snug">{b.description}</div>}</div></button>
          <div className="flex justify-between px-3 pb-2 pt-1"><button onClick={()=>insert(b.id)} className="text-[11px] text-slate-300 flex items-center gap-1 min-h-9"><Plus size={12}/>Insert or drag onto page</button><button onClick={()=>toggle(b.id)} aria-label={`${favorites.includes(b.id)?"Unfavourite":"Favourite"} ${b.name}`} className={`p-2 ${favorites.includes(b.id)?"text-amber-200":"text-slate-500"}`}><Star size={14} fill={favorites.includes(b.id)?"currentColor":"none"}/></button></div>
        </article>)}
        {!filtered.length&&category!=="saved"&&<p className="text-sm text-slate-400 p-4">No matching layouts. Try another purpose or clear your filters.</p>}
        {category!=="saved"&&filtered.length>limit&&<button className="publication-button w-full" onClick={()=>setLimit(n=>n+12)}>Show 12 more layouts</button>}
      </div>
    </>}
    {tab==="pages"&&<div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3"><button onClick={demo} className="publication-demo w-full text-left"><BookOpen size={20}/><strong className="block text-sm mt-3">Explore the sample book</strong><span className="block text-xs mt-1 opacity-80">Large Numbers, plus science and reading examples. Creates a separate book.</span><span className="mt-4 flex gap-2 items-center text-xs">Create editable sample <ArrowUpRight size={14}/></span></button>{PUBLICATION_PAGES.map((p,i)=><button key={p.id} onClick={()=>addPages(p.id)} className="publication-library-card w-full p-3 text-left"><span className="text-amber-200 text-[10px] tracking-wider">{String(i+1).padStart(2,"0")} / PAGE COLLECTION</span><strong className="block text-sm mt-1 text-white">{p.name}</strong><span className="block text-xs text-slate-400 mt-1">{p.description}</span><span className="flex gap-1 mt-3 text-xs text-slate-300"><Plus size={12}/>Add new pages</span></button>)}<p className="text-[11px] text-slate-400">Pages append to your book. Long layouts continue on a new page; existing pages stay intact.</p></div>}
    {tab==="artwork"&&<div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3"><p className="text-xs text-slate-400 leading-relaxed">Original vector artwork. Drag it onto the page, then resize, recolour or set it as a locked background.</p><label className="publication-button block text-center cursor-pointer">Upload a background image<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const asset=await readPublicationImage(file);const st=useEditorStore.getState(),page=st.getActivePage();if(!page)return;st.insertPublicationElement({id:crypto.randomUUID(),pageId:page.id,type:"image",category:"media",version:2,displayName:file.name,locked:false,hidden:false,style:{objectFit:"cover"},transform:{x:42,y:36,width:240,height:180,rotation:0,zIndex:Math.max(0,...st.getActivePageElements().map(el=>el.transform.zIndex))+1},content:{...asset,alt:file.name,focalX:.5,focalY:.5,cropScale:1,scope:"free",provenance:"User supplied"}});}catch(err){useUiStore.getState().showToast({type:"error",title:"Image not added",message:String(err)});}e.target.value="";}}/></label>{ARTWORKS.map(a=><button key={a.id} draggable onDragStart={e=>e.dataTransfer.setData("application/x-nexmaxx-artwork",a.id)} onClick={()=>addArt(a.id)} className="publication-library-card w-full text-left"><div className="h-28 p-3 bg-[#f5f3ff]"><PublicationSceneView scene={{width:240,height:110,variant:a.id,warnings:[],nodes:artworkNodes(a.id,40,0,160,110,PUBLICATION_PALETTES.indigo)}} label={a.name}/></div><div className="p-3"><strong className="text-xs text-white flex items-center gap-2"><Shapes size={13}/>{a.name}</strong><p className="text-[11px] text-slate-400 mt-1">{a.description}</p></div></button>)}</div>}
  </div>;
};
