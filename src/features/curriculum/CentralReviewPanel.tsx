"use client";
import React,{useState} from 'react';
import {curriculumRequest,cloudBookSnapshotRepository} from '../../editor/persistence/bookRepository';
import {getCloudChapterController,acceptCloudChapter,hasPendingCloudChanges} from '../../editor/stores/cloudChapterStore';
import {useEditorStore} from '../../editor/stores/editorStore';
import {restoreChapter} from '../../editor/persistence/bookSnapshots';
interface ReviewState{status:string;assignment:{reviewer:string}|null;comments:{id:string;comment:string;severity:string;status:string;author:string;field_path?:string}[]}
interface History{items:{revision:number;author:string;created_at:string;page_count:number;element_count:number;content_changed:boolean}[];next_offset:number|null}
export function CentralReviewPanel({versionId,chapterId,localChapterId}:{versionId:string;chapterId:string;localChapterId:string}){
  const [review,setReview]=useState<ReviewState>(),[history,setHistory]=useState<History>(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [comment,setComment]=useState(''),[severity,setSeverity]=useState('REQUIRED_CHANGE'),[reviewerId,setReviewerId]=useState('');
  async function run(action:()=>Promise<unknown>){setBusy(true);setMessage('');try{await action();setReview(await curriculumRequest<ReviewState>(`versions/${versionId}/review-state`));}catch(error){setMessage(error instanceof Error?error.message:'Review request failed');}finally{setBusy(false);}}
  async function chapterDecision(decision:string){const controller=getCloudChapterController(localChapterId);if(!controller)throw new Error('Save this chapter centrally first');await controller.flush();return curriculumRequest(`chapters/${controller.target.masterChapterId}/revisions/${controller.status.base.revision}/${decision}`,'POST',{});}
  async function restore(revision:number){
    if(hasPendingCloudChanges())throw new Error('Save or download pending work before restoring history');
    const controller=getCloudChapterController(localChapterId),book=useEditorStore.getState().getActiveBook();
    if(!controller?.target.bookId||!book)throw new Error('Open a central book chapter first');
    const base=controller.status.base;
    await curriculumRequest(`books/${controller.target.bookId}/chapters/${controller.target.masterChapterId}/revisions/${revision}/restore`,'POST',{contentBase:{revision:base.revision,edit_version:base.edit_version,checksum:base.checksum},layoutBase:base.layout},crypto.randomUUID());
    const snapshot=await cloudBookSnapshotRepository(controller.target.bookId).loadSnapshot(controller.target.masterChapterId),chapter=book.chapters.find(c=>c.id===localChapterId)!;
    const restored=restoreChapter(snapshot.document,chapter),state=useEditorStore.getState(),elements={...state.elements};
    for(const page of book.pages.filter(p=>chapter.pageIds.includes(p.id)))for(const id of page.elementIds)delete elements[id];
    acceptCloudChapter(localChapterId,controller.target,snapshot);
    useEditorStore.setState({books:state.books.map(b=>b.id===book.id?{...b,chapters:b.chapters.map(c=>c.id===localChapterId?restored.chapter:c),pages:[...b.pages.filter(p=>!chapter.pageIds.includes(p.id)),...restored.pages]}:b),elements:{...elements,...restored.elements},selectedElementIds:[]});
    setMessage(`Revision ${revision} restored as a new draft revision.`);
  }
  if(!versionId||!chapterId)return null;
  return <details className="curriculum-cloud-link"><summary>Review and revision history</summary>
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(async()=>{})}>Refresh workflow</button>
    {review&&<p role="status">Release: {review.status}{review.assignment?` · Reviewer: ${review.assignment.reviewer}`:''}</p>}
    <div className="curriculum-cloud-actions"><button disabled={busy} onClick={()=>void run(()=>chapterDecision('submit'))}>Submit chapter</button><button disabled={busy} onClick={()=>void run(()=>chapterDecision('approve'))}>Approve chapter</button></div>
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>curriculumRequest(`versions/${versionId}/submit-review`,'POST',{}))}>Submit release for review</button>
    <label className="curriculum-field">Reviewer workforce ID<input value={reviewerId} onChange={e=>setReviewerId(e.target.value)} /></label>
    <button className="curriculum-secondary" disabled={busy||!reviewerId} onClick={()=>void run(()=>curriculumRequest(`versions/${versionId}/reviewer`,'POST',{reviewerId}))}>Assign reviewer</button>
    <label className="curriculum-field">Review comment<textarea value={comment} onChange={e=>setComment(e.target.value)} /></label>
    <select aria-label="Comment severity" value={severity} onChange={e=>setSeverity(e.target.value)}>{['INFO','SUGGESTION','REQUIRED_CHANGE','BLOCKER'].map(value=><option key={value}>{value}</option>)}</select>
    <div className="curriculum-cloud-actions"><button disabled={busy||!comment.trim()} onClick={()=>void run(async()=>{await curriculumRequest(`versions/${versionId}/comments`,'POST',{entity_type:'CHAPTER',entity_id:chapterId,severity,comment});setComment('');})}>Add comment</button><button disabled={busy||!comment.trim()} onClick={()=>void run(()=>curriculumRequest(`versions/${versionId}/request-changes`,'POST',{reason:comment}))}>Request changes</button></div>
    {review?.comments.map(item=><article key={item.id}><strong>{item.severity} · {item.status}</strong><p>{item.comment}</p><small>{item.author}{item.field_path?` · ${item.field_path}`:''}</small>{item.status==='OPEN'&&<button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>curriculumRequest(`comments/${item.id}/resolve`,'PATCH',{resolution_notes:'Resolved after review'}))}>Resolve</button>}</article>)}
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(async()=>{const result=await curriculumRequest<{chapter_count:number;asset_count:number}>(`versions/${versionId}/preflight`,'POST',{});setMessage(`Preflight validated ${result.chapter_count} chapters and ${result.asset_count} asset revisions. PDF font proof is a separate gate.`);})}>Run release preflight</button>
    <div className="curriculum-cloud-actions"><button disabled={busy} onClick={()=>void run(async()=>{await curriculumRequest(`versions/${versionId}/reviews`,'POST',{review_type:'ACADEMIC',status:'APPROVED',summary:comment||'Academic review completed'});await curriculumRequest(`versions/${versionId}/approve`,'POST',{});})}>Approve release</button><button disabled={busy} onClick={()=>void run(()=>curriculumRequest(`versions/${versionId}/publish`,'POST',{}))}>Publish release</button></div>
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(async()=>{const c=getCloudChapterController(localChapterId);if(!c?.target.bookId)throw new Error('Open a central book first');setHistory(await curriculumRequest<History>(`books/${c.target.bookId}/chapters/${c.target.masterChapterId}/history`));})}>Show saved revisions</button>
    {history?.items.map(item=><article key={item.revision}><strong>Revision {item.revision} · {item.author||'Workforce author'}</strong><p>{new Date(item.created_at).toLocaleString()} · {item.page_count} pages · {item.element_count} elements · {item.content_changed?'Content and design':'Design'}</p><button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>restore(item.revision))}>Restore as new draft</button></article>)}
    {message&&<p role="status">{message}</p>}
  </details>;
}
