"use client";
import React,{useState} from 'react';
import {curriculumRequest} from '../../editor/persistence/bookRepository';
import {ChapterRepositoryError} from '../../editor/persistence/chapterRepository';
import {assetRenderUrl} from '../../editor/persistence/assetReferences';
import {editFramework} from '../../editor/curriculum/actions';
import {useEditorStore} from '../../editor/stores/editorStore';
interface Asset{id:string;title:string;revision:number;checksum:string;mime_type:string;size_bytes:number}
interface Catalog<T>{items:T[];next_offset:number|null}
interface Question{id:string;title:string;revision:number;checksum:string}
interface QuestionDocument{schemaVersion:1;title:string;type:string;prompt:string;options?:string[];answer:unknown;solution?:string;marks:number;language:string;learningOutcomeIds:string[];metadata:Record<string,unknown>}
export function CentralResourcePanel({chapterId}:{chapterId:string}){
  const [assets,setAssets]=useState<Catalog<Asset>>(),[questions,setQuestions]=useState<Catalog<Question>>(),[search,setSearch]=useState(''),[title,setTitle]=useState(''),[replacement,setReplacement]=useState(''),[file,setFile]=useState<File>(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [prompt,setPrompt]=useState(''),[answer,setAnswer]=useState('');
  async function run(action:()=>Promise<void>){setBusy(true);setMessage('');try{await action();}catch(error){setMessage(error instanceof Error?error.message:'Resource request failed');}finally{setBusy(false);}}
  async function browse(offset=0){const result=await curriculumRequest<Catalog<Asset>>(`assets?search=${encodeURIComponent(search)}&offset=${offset}`);setAssets(previous=>offset&&previous?{...result,items:[...previous.items,...result.items]}:result);}
  async function upload(){
    if(!file||!title.trim())throw new Error('Choose a file and enter its title');
    if(file.size>100*1024*1024||file.type!=='application/pdf'&&file.size>25*1024*1024)throw new Error('Image limit: 25 MB. PDF limit: 100 MB.');
    const checksum=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
    const recoveryKey=`nexmaxx:asset-upload:${replacement||'new'}:${checksum}`;
    const payload={title:title.trim(),filename:file.name,mime:file.type,size:file.size,checksum,...(replacement?{assetId:replacement}:{})};
    const raw=localStorage.getItem(recoveryKey);
    const request=raw?JSON.parse(raw) as {key:string;payload:typeof payload}:{key:crypto.randomUUID(),payload};
    if(request.payload.checksum!==checksum||request.payload.size!==file.size||request.payload.mime!==file.type)throw new Error('Upload recovery does not match this file');
    localStorage.setItem(recoveryKey,JSON.stringify(request));
    let session:{upload_id:string;upload_url?:string;mime:string;status?:string};
    try{session=await curriculumRequest('assets/uploads','POST',request.payload,request.key);}
    catch(error){if(error instanceof ChapterRepositoryError&&error.code==='UPLOAD_EXPIRED'){localStorage.removeItem(recoveryKey);throw new Error('Upload session expired. Click Upload and verify again to start a new session.');}throw error;}
    if(session.status!=='READY'){
      if(!session.upload_url)throw new Error('Storage did not return an upload URL');
      const response=await fetch(session.upload_url,{method:'PUT',headers:{'Content-Type':session.mime},body:file});if(!response.ok)throw new Error('Storage upload failed. Retry with the same file.');
    }
    await curriculumRequest(`assets/uploads/${session.upload_id}/confirm`,'POST',{});localStorage.removeItem(recoveryKey);await browse();setMessage('Immutable asset revision verified and saved.');
  }
  async function place(asset:Asset){
    if(!asset.revision||!asset.mime_type.startsWith('image/'))throw new Error('Only verified image revisions can be placed on a page');
    const store=useEditorStore.getState(),pin={assetId:asset.id,revision:asset.revision,checksum:asset.checksum};
    const element=store.addElement('preset-image-frame');if(!element)throw new Error('Open a page before placing this image');
    store.updateElement(element.id,{displayName:asset.title,content:{...element.content,assetRef:pin,src:assetRenderUrl(pin),alt:asset.title}});
    setMessage(`Placed revision ${asset.revision}. Replacing the library asset will preserve this page’s pin.`);
  }
  async function saveQuestion(){
    if(!prompt.trim()||!answer.trim())throw new Error('Enter a question and its answer');
    const book=useEditorStore.getState().getActiveBook();
    await curriculumRequest('questions','POST',{base:{revision:0,checksum:null},document:{schemaVersion:1,title:title||prompt.slice(0,120),type:'short_answer',prompt,answer,marks:1,language:book?.language||'en',learningOutcomeIds:[],metadata:{}}},crypto.randomUUID());
    setQuestions(await curriculumRequest<Catalog<Question>>('questions'));setMessage('Reusable question revision saved.');
  }
  async function insertQuestion(question:Question){
    const {document}=await curriculumRequest<{document:QuestionDocument}>(`questions/${question.id}/revisions/${question.revision}`),store=useEditorStore.getState(),book=store.getActiveBook(),chapter=book?.chapters.find(c=>c.id===chapterId);
    if(!chapter?.framework)throw new Error('Open a curriculum chapter first');
    const selected=store.selectedElementIds.map(id=>store.elements[id]).find(element=>element?.smartBlockData?.curriculum),blockId=selected?.smartBlockData?.curriculum?.sourceBlockId||selected?.smartBlockData?.id;
    if(!blockId||!chapter.framework.blocks[blockId])throw new Error('Select the curriculum question block that should use this revision');
    editFramework(chapterId,'Use reusable question revision',framework=>{
      framework.blocks[blockId].semanticContent.questions=[{prompt:document.prompt,...(document.options?{options:document.options}:{}),answer:typeof document.answer==='string'?document.answer:JSON.stringify(document.answer),points:document.marks}];
      framework.questionReferences=[...(framework.questionReferences||[]).filter(pin=>pin.blockId!==blockId),{blockId,questionId:question.id,revision:question.revision,checksum:question.checksum}];return framework;
    });setMessage(`Question revision ${question.revision} pinned to the selected block.`);
  }
  return <details className="curriculum-cloud-link"><summary>Central assets and reusable questions</summary>
    <label className="curriculum-field">Resource title<input value={title} onChange={e=>setTitle(e.target.value)} /></label>
    <input aria-label="Asset file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0])} />
    <label className="curriculum-field">Replace by new revision<select value={replacement} onChange={e=>setReplacement(e.target.value)}><option value="">Create a new asset</option>{assets?.items.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
    <button className="curriculum-secondary" disabled={busy||!file||!title.trim()} onClick={()=>void run(upload)}>Upload and verify</button>
    <label className="curriculum-field">Search assets<input value={search} onChange={e=>setSearch(e.target.value)} /></label>
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>browse())}>Search central assets</button>
    {assets?.items.map(asset=><article key={asset.id}><strong>{asset.title}</strong><p>Revision {asset.revision||'pending'} · {Math.round((asset.size_bytes||0)/1024)} KB · {asset.mime_type}</p><div className="curriculum-cloud-actions"><button disabled={busy||!asset.revision} onClick={()=>void run(()=>place(asset))}>Place image</button><button disabled={busy} onClick={()=>void run(async()=>{const usage=await curriculumRequest<unknown[]>(`assets/${asset.id}/usage`);setMessage(`${usage.length} published release references. Archived revisions remain available.`);})}>Show usage</button><button disabled={busy} onClick={()=>void run(async()=>{await curriculumRequest(`assets/${asset.id}/archive`,'POST',{});await browse();setMessage('Archived from the library. Existing revision pins remain intact.');})}>Archive</button></div></article>)}
    {assets?.next_offset!==null&&assets?.next_offset!==undefined&&<button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>browse(assets.next_offset!))}>Load more assets</button>}
    <label className="curriculum-field">Reusable question<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} /></label><label className="curriculum-field">Answer<input value={answer} onChange={e=>setAnswer(e.target.value)} /></label>
    <div className="curriculum-cloud-actions"><button disabled={busy} onClick={()=>void run(saveQuestion)}>Save question revision</button><button disabled={busy} onClick={()=>void run(async()=>setQuestions(await curriculumRequest<Catalog<Question>>('questions')))}>Browse questions</button></div>
    {questions?.items.map(question=><article key={question.id}><strong>{question.title}</strong><button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>insertQuestion(question))}>Use revision {question.revision} in selected block</button></article>)}
    {message&&<p role="status">{message}</p>}
  </details>;
}
