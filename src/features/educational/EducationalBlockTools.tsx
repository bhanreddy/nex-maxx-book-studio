'use client';
import React,{useRef,useState,useLayoutEffect} from 'react';
import { createPortal } from 'react-dom';
import type { PageElement } from '../../domain/element/types';
import type { SubjectDomain } from '../../domain/educational/blockSchema';
import { EDUCATIONAL_LIBRARY, LIBRARY_BY_TYPE } from '../../editor/educational/library/catalog';
import { EDUCATIONAL_BLOCK_REGISTRY } from '../../editor/educational/blockRegistry';
import { duplicateEducationalBlock } from '../../editor/educational/library/actions';
import { PUBLICATION_PALETTES } from '../../domain/educational/designTokens';
import { resolvePublicationPalette } from '../../editor/educational/publicationScene';
import { readPublicationImage } from '../../editor/educational/imageAssets';
import { useEditorStore } from '../../editor/stores/editorStore';
import { useUiStore } from '../../editor/stores/uiStore';
import { beginBlockContentEditing } from '../../editor/educational/blockContentEditing';
export function EducationalBlockTools({element,zoom}:{element:PageElement;zoom:number}){
 const b=element.smartBlockData!,entry=LIBRARY_BY_TYPE[EDUCATIONAL_BLOCK_REGISTRY[b.presetId].educationalType!];
 const [name,setName]=useState(b.semanticContent.title),[category,setCategory]=useState(entry.stage);
 const input=useRef<HTMLInputElement>(null),store=useEditorStore();
 const [position,setPosition]=useState<{left:number;top:number;width:number}|null>(null);
 useLayoutEffect(()=>{
  let frame=0;
  const place=()=>{const node=document.getElementById(`element-${element.id}`);if(!node)return;const bounds=node.getBoundingClientRect(),width=Math.min(540,window.innerWidth-24);setPosition({width,left:Math.max(12,Math.min(window.innerWidth-width-12,bounds.x+bounds.width/2-width/2)),top:Math.max(145,Math.min(window.innerHeight-190,bounds.bottom+12))});};
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};place();window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);};
 },[element.id,element.transform,zoom]);
 const designLocked=element.locked||b.isLockedDesign;
 const inspect=()=>useUiStore.getState().setRightInspectorOpen(true);
 if(!position)return null;
 return createPortal(<div data-menu-direction={position.top>window.innerHeight/2?"above":"below"} data-canvas-controls className="educational-quick-toolbar" style={{position:"fixed",left:position.left,top:position.top,width:position.width,transform:"none"}} onPointerDown={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
  <label>Variant<select aria-label="Block variant" disabled={designLocked} value={b.presetId} onChange={e=>store.setEducationalBlockPreset(element.id,e.target.value)}>{entry.variants.map(variant=><option key={variant} value={`edu-${entry.type}-${variant}`}>{variant.replaceAll('-',' ')}</option>)}</select></label>
  <details><summary>Theme</summary><div className="educational-tool-menu"><label>Subject<select aria-label="Block subject" disabled={designLocked} value={b.subject} onChange={e=>store.reSkinEducationalBlock(element.id,e.target.value as SubjectDomain)}>{['mathematics','science','english','environmental','social-studies','computer-science','early-learning','general'].map(subject=><option key={subject} value={subject}>{subject.replaceAll('-',' ')}</option>)}</select></label><label>Palette<select aria-label="Block palette" disabled={designLocked} value={b.styleOverrides.paletteId||''} onChange={e=>store.updateSmartBlockStyle(element.id,{paletteId:e.target.value||undefined,customPalette:undefined})}><option value="">Subject automatic</option>{Object.entries(PUBLICATION_PALETTES).map(([id,p])=><option key={id} value={id}>{p.name}</option>)}</select></label></div></details>
  <button type="button" disabled={element.locked||b.isLockedContent} onClick={()=>input.current?.click()}>Image</button>
  <button type="button" onClick={inspect}>Layout</button>
  <label>Accent<input aria-label="Block accent" type="color" disabled={designLocked} value={resolvePublicationPalette(b).primary} onChange={e=>store.updateSmartBlockStyle(element.id,{customPalette:{...b.styleOverrides.customPalette,primary:e.target.value}})}/></label>
  <button type="button" onClick={()=>duplicateEducationalBlock(element)}>Duplicate</button>
  <details><summary>Save Preset</summary><div className="educational-tool-menu"><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value as typeof category)}>{['start','discover','learn','think','practice','activity','review'].map(stage=><option key={stage}>{stage}</option>)}</select></label><button type="button" onClick={()=>store.savePublicationPreset(name,element.id,category)}>Save to My Blocks</button></div></details>
  <details><summary>More</summary><div className="educational-tool-menu"><label>Duplicate as<select aria-label="Duplicate as another educational block" value="" onChange={e=>{if(e.target.value)duplicateEducationalBlock(element,e.target.value);}}><option value="">Choose a compatible purpose</option>{EDUCATIONAL_LIBRARY.filter(item=>item.composition===entry.composition||(['discovery','burst','reference'].includes(item.composition)&&['discovery','burst','reference'].includes(entry.composition))).map(item=><option key={item.type} value={`edu-${item.type}-${item.variants[0]}`}>{item.title}</option>)}</select></label><button type="button" disabled={element.locked||b.isLockedContent} onClick={()=>beginBlockContentEditing(element.id)}>Advanced layer editing</button><button type="button" onClick={inspect}>All settings</button><button type="button" disabled={element.locked} onClick={()=>store.deleteSelectedElements()}>Delete block</button></div></details>
  <input hidden type="file" ref={input} accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const asset=await readPublicationImage(f),latest=useEditorStore.getState().elements[element.id]?.smartBlockData;if(latest){const images=[...(latest.semanticContent.images||[])];images[0]={...images[0],...asset,alt:f.name};store.updateSmartBlockContent(element.id,{images});}}catch(error){useUiStore.getState().showToast({type:'error',title:'Image not added',message:String(error)});}}}/>
 </div>,document.body);
}
