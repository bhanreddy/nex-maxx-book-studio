"use client";
import React,{useState} from 'react';
import {useEditorStore} from '../../editor/stores/editorStore';
import {getCloudChapterController,acceptCloudChapter,connectCloudBookChapter,hasPendingCloudChanges} from '../../editor/stores/cloudChapterStore';
import {connectCloudBook,getCloudBookController,useCloudBookStore,queueCentralBook} from '../../editor/stores/cloudBookStore';
import {cloudBookSnapshotRepository,cloudBookMetadataRepository,curriculumRequest,type CentralBook} from '../../editor/persistence/bookRepository';
import {cloudChapterRepository,ChapterRepositoryError,type ChapterSnapshot,type ChapterSaveTarget} from '../../editor/persistence/chapterRepository';
import {rememberCentralBook} from '../../editor/persistence/centralBookRecovery';
import {serializeBook,serializeChapter,restoreChapter,restoreBookMetadata} from '../../editor/persistence/bookSnapshots';
import {curriculumGradeCode} from "../../domain/educational/curriculum";
interface Props {versionId:string;masterChapterId:string;localChapterId:string;onTarget:(target:ChapterSaveTarget)=>void}
interface Tree {offerings:{id:string;units:{id:string;chapters:{id:string}[]}[]}[]}
interface BookList {items:{id:string;title:string;book_type:string}[];next_offset:number|null}
export function CentralBookPanel({versionId,masterChapterId,localChapterId,onTarget}:Props){
  const book=useEditorStore(s=>s.getActiveBook()),status=useCloudBookStore(s=>book?s.books[book.id]:undefined);
  const [items,setItems]=useState<BookList['items']>([]),[bookId,setBookId]=useState(''),[chapterId,setChapterId]=useState(''),[central,setCentral]=useState<CentralBook>(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  async function action(fn:()=>Promise<void>){setBusy(true);setMessage('');try{await fn();}catch(error){setMessage(error instanceof Error?error.message:'Central book request failed');}finally{setBusy(false);}}
  async function createCurriculum(){
    if(!book)throw new Error('Open a book first');const chapter=book.chapters.find(c=>c.id===localChapterId);if(!chapter?.framework)throw new Error('Create a curriculum chapter first');
    const product=await curriculumRequest<{id:string}>('products','POST',{code:`NEX-${crypto.randomUUID().slice(0,8).toUpperCase()}`,name:book.title,board_or_framework:'NEX MAXX'});
    const version=await curriculumRequest<{id:string}>(`products/${product.id}/versions`,'POST',{major:1,minor:0,patch:0});
    const offering=await curriculumRequest<{id:string}>(`versions/${version.id}/offerings`,'POST',{standard_grade_level:curriculumGradeCode(chapter.framework.config.grade),canonical_subject_code:book.subject.toUpperCase().replaceAll(' ','_'),canonical_subject_name:book.subject});
    const unit=await curriculumRequest<{id:string}>(`offerings/${offering.id}/units`,'POST',{code:'U1',title:chapter.framework.config.unit||'Unit 1'});
    const created=await curriculumRequest<{id:string}>(`units/${unit.id}/chapters`,'POST',{code:'C1',title:chapter.title});onTarget({masterChapterId:created.id,curriculumVersionId:version.id});setMessage('Curriculum draft created. Create the central book next.');
  }
  async function createBook(){
    if(!book||!versionId||!masterChapterId)throw new Error('Select a central chapter and version first');
    const ids=book.chapters.map(ch=>ch.id===localChapterId?masterChapterId:getCloudChapterController(ch.id)?.target.masterChapterId);
    if(ids.some(id=>!id))throw new Error('Link each chapter to the central curriculum before creating this book');
    const tree=await curriculumRequest<Tree>(`versions/${versionId}/tree`),offering=tree.offerings.find(o=>o.units.some(u=>u.chapters.some(c=>c.id===masterChapterId)));
    if(!offering)throw new Error('Selected chapter does not belong to this version');
    for(const [index,chapter] of book.chapters.entries()){
      const existing=getCloudChapterController(chapter.id);
      if(existing?.dirty)await existing.flush();
      try{
        const remote=await cloudChapterRepository().loadSnapshot(ids[index]!);
        if(!existing||existing.target.masterChapterId!==ids[index]||existing.status.base.checksum!==remote.checksum)
          throw new Error(`Reload central chapter ${chapter.number} before creating its book layout. Existing central content must have an acknowledged local base.`);
      }catch(error){if(!(error instanceof ChapterRepositoryError&&error.status===404))throw error;}
    }
    const created=await curriculumRequest<CentralBook>(`versions/${versionId}/books`,'POST',{offeringId:offering.id,document:serializeBook(book,ids as string[])},crypto.randomUUID());
    connectCloudBook(book.id,created);
    for(const [index,chapter] of book.chapters.entries()){
      const target={bookId:created.id,masterChapterId:ids[index]!,curriculumVersionId:versionId};let snapshot:ChapterSnapshot;
      try{snapshot=await cloudChapterRepository().loadSnapshot(target.masterChapterId);}catch(error){if(!(error instanceof ChapterRepositoryError&&error.status===404))throw error;snapshot={revision:0,edit_version:0,checksum:'',document:serializeChapter(book,chapter,useEditorStore.getState().elements,created.id,target.masterChapterId)};}
      const controller=await connectCloudBookChapter(chapter.id,target,{...snapshot,checksum:snapshot.checksum||null} as ChapterSnapshot,serializeChapter(book,chapter,useEditorStore.getState().elements,created.id,target.masterChapterId));await controller.flush();
    }
    rememberCentralBook(book.id,localChapterId);setCentral(created);setBookId(created.id);setChapterId(masterChapterId);setMessage('Book content and layouts are saved centrally.');
  }
  async function openChapter(selectedBookId:string,selectedChapterId?:string){
    if(hasPendingCloudChanges())throw new Error('Save or resolve pending central changes before switching chapters');
    const loaded=await curriculumRequest<CentralBook>(`books/${selectedBookId}`),id=selectedChapterId||loaded.document.chapterIds[0];
    const snapshot=await cloudBookSnapshotRepository(loaded.id).loadSnapshot(id);
    const shell=restoreBookMetadata(loaded.id,loaded.document),selected=shell.chapters.find(c=>c.id===id);
    if(!selected)throw new Error('Chapter is not in this central book');
    const restored=restoreChapter(snapshot.document,selected);
    const nextBook={...shell,chapters:shell.chapters.map(c=>c.id===id?restored.chapter:c),pages:restored.pages};
    acceptCloudChapter(id,{bookId:loaded.id,masterChapterId:id,curriculumVersionId:loaded.curriculum_version_id},snapshot);
    connectCloudBook(nextBook.id,loaded);
    const state=useEditorStore.getState(),elements={...state.elements};
    const previousBook=state.books.find(b=>b.id===nextBook.id);
    for(const page of previousBook?.pages||[])for(const elementId of page.elementIds)delete elements[elementId];
    useEditorStore.setState({books:[...state.books.filter(b=>b.id!==nextBook.id),nextBook],elements:{...elements,...restored.elements},activeBookId:nextBook.id,activePageIndex:0,selectedElementIds:[]});
    rememberCentralBook(nextBook.id,id);setCentral(loaded);setBookId(loaded.id);setChapterId(id);onTarget({bookId:loaded.id,masterChapterId:id,curriculumVersionId:loaded.curriculum_version_id});setMessage('Loaded central content and its exact saved layout.');
  }
  async function saveBook(){if(!book)throw new Error('Open a book first');if(!queueCentralBook(book,useEditorStore.getState().elements))throw new Error('Create or open a central book first');
    await getCloudBookController(book.id)?.flush();for(const chapter of book.chapters)await getCloudChapterController(chapter.id)?.flush();setMessage('Central metadata, content and layouts saved.');}
  async function reloadCurrent(){
    if(!book)throw new Error('Open a central book first');
    const metadata=getCloudBookController(book.id),controller=getCloudChapterController(localChapterId),chapter=book.chapters.find(c=>c.id===localChapterId);
    if(!metadata||!controller?.target.bookId||!chapter)throw new Error('Open a central book chapter first');
    const centralMetadata=await cloudBookMetadataRepository().loadSnapshot(controller.target.bookId);
    const snapshot=await cloudBookSnapshotRepository(controller.target.bookId).loadSnapshot(controller.target.masterChapterId);
    const restored=restoreChapter(snapshot.document,chapter),state=useEditorStore.getState();
    // Download a reviewable copy before accepting remote state. Storage archive
    // also must succeed; acceptRemote refuses to replace the draft if it fails.
    const exportData={savedAt:new Date().toISOString(),book,chapterRecovery:controller.document,metadataRecovery:metadata.document,elements:state.elements};
    const url=URL.createObjectURL(new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='nexmaxx-before-central-reload.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    const shell=restoreBookMetadata(controller.target.bookId,centralMetadata.document,book.id);
    if(!shell.chapters.some(c=>c.id===localChapterId))throw new Error('The central chapter was removed from this book; the downloaded copy preserves your local work');
    acceptCloudChapter(localChapterId,controller.target,snapshot);metadata.acceptRemote(centralMetadata);
    const elements={...state.elements};for(const page of book.pages.filter(p=>chapter.pageIds.includes(p.id)))for(const id of page.elementIds)delete elements[id];
    useEditorStore.setState({books:state.books.map(b=>b.id===book.id?{...shell,chapters:shell.chapters.map(c=>c.id===localChapterId?restored.chapter:(b.chapters.find(old=>old.id===c.id)||c)),pages:[...b.pages.filter(p=>!chapter.pageIds.includes(p.id)),...restored.pages]}:b),elements:{...elements,...restored.elements},selectedElementIds:[]});
    setMessage('Reloaded central metadata, content and layout. Your displaced local draft was downloaded and archived.');
  }
  return <section className="curriculum-cloud-link" aria-label="Central book library">
    <strong>Central book and layout</strong>
    <div className="curriculum-cloud-actions"><button className="curriculum-secondary" disabled={busy} onClick={()=>void action(createCurriculum)}>Create curriculum draft</button><button className="curriculum-secondary" disabled={busy||!versionId||!masterChapterId} onClick={()=>void action(createBook)}>Create central book</button></div>
    <button className="curriculum-secondary" disabled={busy||!versionId} onClick={()=>void action(async()=>{const list=await curriculumRequest<BookList>(`versions/${versionId}/books`);setItems(list.items);setMessage(list.next_offset?'Showing the first 50 books.':'Book library loaded.');})}>Browse central books</button>
    <select aria-label="Central book" value={bookId} onChange={event=>setBookId(event.target.value)}><option value="">Select a book</option>{items.map(item=><option key={item.id} value={item.id}>{item.title} · {item.book_type}</option>)}</select>
    <button className="curriculum-secondary" disabled={busy||!bookId} onClick={()=>void action(()=>openChapter(bookId))}>Open central book</button>
    {central&&<select aria-label="Central book chapter" value={chapterId} disabled={busy} onChange={event=>void action(()=>openChapter(central.id,event.target.value))}>{central.document.chapterIds.map((id,i)=><option key={id} value={id}>Chapter {i+1}</option>)}</select>}
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void action(saveBook)}>Save metadata, content and layout</button>
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void action(reloadCurrent)}>Download local draft and reload central chapter</button>
    {status&&<p role="status">Central book metadata: {status.state}{status.error?` · ${status.error}`:''}</p>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
