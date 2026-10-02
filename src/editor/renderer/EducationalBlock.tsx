'use client';
import React,{memo,useMemo,useRef,useState,useEffect} from 'react';
import type { PageElement } from '../../domain/element/types';
import { buildPublicationScene, resolvePublicationPalette, type SceneNode } from '../educational/publicationScene';
import { PublicationSceneView } from './PublicationSceneView';
import { readEducationalField,editEducationalField } from '../educational/library/editing';
import { readPublicationImage } from '../educational/imageAssets';
import { useEditorStore } from '../stores/editorStore';
import { useUiStore } from '../stores/uiStore';
import { contentNodeBounds } from '../educational/sceneBounds';

/** Only the selected block mounts an input; inactive pages use the same memoized SVG. */
export const EducationalBlock=memo(function EducationalBlock({element,selected=false}:{element:PageElement;selected?:boolean}){
 const block=element.smartBlockData!,locked=element.locked||block.isLockedContent;
 const scene=useMemo(()=>buildPublicationScene({...block,transform:element.transform}),[block,element.transform]);
 const [active,setActive]=useState<string|null>(null),[draft,setDraft]=useState('');
 const imageIndex=useRef(0),file=useRef<HTMLInputElement>(null),accent=useRef<HTMLInputElement>(null);
 const editable=selected&&!locked;
 useEffect(()=>{if(!editable)setActive(null);},[editable]);
 useEffect(()=>{if(active)useUiStore.getState().setEditingTextElementId(element.id);return()=>{if(useUiStore.getState().editingTextElementId===element.id)useUiStore.getState().setEditingTextElementId(null);};},[active,element.id]);
 function commit(){if(active){const latest=useEditorStore.getState().elements[element.id]?.smartBlockData;if(latest&&readEducationalField(latest.semanticContent,active)!==draft)useEditorStore.getState().updateSmartBlockContent(element.id,editEducationalField(latest.semanticContent,active,draft));}setActive(null);}
 async function upload(uploaded:File,index=imageIndex.current){try{const asset=await readPublicationImage(uploaded),latest=useEditorStore.getState().elements[element.id]?.smartBlockData;if(!latest||latest.isLockedContent)return;const images=[...(latest.semanticContent.images||[])];images[index]={...images[index],...asset,alt:uploaded.name};useEditorStore.getState().updateSmartBlockContent(element.id,{images});}catch(error){useUiStore.getState().showToast({type:'error',title:'Image not added',message:String(error)});}}
 const wrap=(painted:React.ReactNode,node:SceneNode,index:number)=>{
  if(!selected)return painted;
  const field='fieldPath'in node?node.fieldPath:undefined,slot='imageSlot'in node?node.imageSlot:undefined;
  const appearance='appearanceTarget'in node?node.appearanceTarget:undefined;
  if(!field&&slot===undefined&&!appearance)return painted;
  if(appearance?(element.locked||block.isLockedDesign):!editable)return painted;
  const bounds=node.kind==='text'||node.kind==='image'?contentNodeBounds(node):node.kind==='rect'?{x:node.x,y:node.y,width:node.w,height:node.h}:node.kind==='polygon'?{x:Math.min(...node.points.map(point=>point[0])),y:Math.min(...node.points.map(point=>point[1])),width:Math.max(...node.points.map(point=>point[0]))-Math.min(...node.points.map(point=>point[0])),height:Math.max(...node.points.map(point=>point[1]))-Math.min(...node.points.map(point=>point[1]))}:null;
  if(!bounds)return painted;
  function edit(){if(appearance){accent.current?.click();}else if(slot!==undefined){imageIndex.current=slot;file.current?.click();}else if(field){setDraft(readEducationalField(block.semanticContent,field));setActive(field);}}
  const chosen=field===active;
  return <g key={index} onDragEnter={()=>{if(slot!==undefined)imageIndex.current=slot;}} onFocus={()=>{if(slot!==undefined)imageIndex.current=slot;}} role="button" tabIndex={0} aria-label={appearance?'Edit block accent':slot!==undefined?`Replace illustration ${slot+1}`:`Edit ${field}`} className="educational-editable-field" onPointerDown={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(!chosen)edit();}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();edit();}}}>
   {painted}<rect x={bounds.x-2} y={bounds.y-2} width={bounds.width+4} height={bounds.height+4} fill="transparent" className="educational-field-hitbox"/>
   {chosen&&field&&<foreignObject x={bounds.x} y={bounds.y} width={Math.max(80,node.kind==='text'?node.wrapWidth||bounds.width:bounds.width)} height={Math.max(70,bounds.height+30)}><textarea autoFocus aria-label={`Edit ${field}`} value={draft} className="educational-inline-input" style={{fontSize:node.kind==='text'?node.size:12}} onChange={e=>setDraft(e.target.value)} onBlur={commit} onClick={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();setActive(null);}if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();commit();}}}/></foreignObject>}
  </g>;
 };
 return <div className="w-full h-full" data-educational-block={block.presetId} onPaste={e=>{if(!editable||active)return;const pasted=Array.from(e.clipboardData.files).find(f=>f.type.startsWith('image/'));if(pasted){e.preventDefault();e.stopPropagation();void upload(pasted);}}} onDragOver={e=>{if(editable&&Array.from(e.dataTransfer.types).includes('Files')){e.preventDefault();e.stopPropagation();}}} onDrop={e=>{if(!editable)return;const dropped=Array.from(e.dataTransfer.files).find(f=>f.type.startsWith('image/'));if(dropped){e.preventDefault();e.stopPropagation();void upload(dropped);}}}>
  <PublicationSceneView scene={scene} label={block.semanticContent.title} overflow="visible" wrapNode={selected?wrap:undefined}/>
  {selected&&<input type="color" hidden ref={accent} value={resolvePublicationPalette(block).primary} onChange={e=>useEditorStore.getState().updateSmartBlockStyle(element.id,{customPalette:{...block.styleOverrides.customPalette,primary:e.target.value}})}/>}
  {selected&&<input type="file" hidden ref={file} accept="image/png,image/jpeg,image/webp" onChange={e=>{const uploaded=e.target.files?.[0];e.target.value='';if(uploaded)void upload(uploaded);}}/>}
 </div>;
});
