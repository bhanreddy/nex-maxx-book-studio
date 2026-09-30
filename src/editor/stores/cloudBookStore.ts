import {create} from 'zustand';
import type {Book} from '../../domain/book/types';
import type {PageElement} from '../../domain/element/types';
import {CloudSaveController,documentSignature,type CloudRecoveryRecord,type CloudSaveStatus} from '../persistence/cloudSaveController';
import {cloudBookMetadataRepository,type CentralBook} from '../persistence/bookRepository';
import {serializeBook,serializeChapter,type BookDocument} from '../persistence/bookSnapshots';
import {getCloudChapterController,registerPendingSource} from './cloudChapterStore';
const PREFIX='nexmaxx:book-metadata:',controllers=new Map<string,CloudSaveController<BookDocument>>();
const lastChapter=new Map<string,{framework:unknown;pages:unknown[];elements:unknown[]}>();
export const useCloudBookStore=create<{books:Record<string,CloudSaveStatus>}>(()=>({books:{}}));
function install(localId:string,record:CloudRecoveryRecord<BookDocument>){
  const controller=new CloudSaveController(record,cloudBookMetadataRepository(),{
    save:value=>localStorage.setItem(PREFIX+localId,JSON.stringify(value)),
    archive:document=>localStorage.setItem(PREFIX+localId+':previous',JSON.stringify({document,savedAt:new Date().toISOString()})),
  },status=>useCloudBookStore.setState(state=>({books:{...state.books,[localId]:status}})));
  controllers.set(localId,controller);return controller;
}
export function getCloudBookController(localId:string){
  if(controllers.has(localId))return controllers.get(localId);
  if(typeof localStorage==='undefined')return;
  const saved=localStorage.getItem(PREFIX+localId);if(saved)return install(localId,JSON.parse(saved));
}
export function connectCloudBook(localId:string,book:CentralBook){
  const existing=getCloudBookController(localId);
  if(existing){if(existing.target.bookId!==book.id)throw new Error('Open a separate book before linking another central book');return existing;}
  const record:CloudRecoveryRecord<BookDocument>={target:{bookId:book.id,masterChapterId:book.id,curriculumVersionId:book.curriculum_version_id},base:{revision:book.revision,edit_version:book.revision,checksum:book.checksum},document:book.document,acknowledged:documentSignature(book.document)};
  localStorage.setItem(PREFIX+localId,JSON.stringify(record));return install(localId,record);
}
export function queueCentralBook(book:Book,elements:Record<string,PageElement>){
  const metadata=getCloudBookController(book.id);if(!metadata)return false;
  const index=(metadata.document?.settings.chapterIndex||[]) as Array<{id:string;centralChapterId:string}>;
  const chapterIds=book.chapters.map(chapter=>getCloudChapterController(chapter.id)?.target.masterChapterId||index.find(c=>c.id===chapter.id||c.centralChapterId===chapter.id)?.centralChapterId);
  if(chapterIds.every((id):id is string=>Boolean(id)))metadata.update(serializeBook(book,chapterIds));
  for(const chapter of book.chapters){
    const controller=getCloudChapterController(chapter.id);if(!controller?.target.bookId||!chapter.framework)continue;
    const pages=book.pages.filter(page=>page.chapterId===chapter.id||chapter.pageIds.includes(page.id)),chapterElements=pages.flatMap(p=>p.elementIds.map(id=>elements[id]));
    const previous=lastChapter.get(chapter.id);
    if(previous?.framework===chapter.framework&&pages.length===previous.pages.length&&pages.every((p,i)=>p===previous.pages[i])&&chapterElements.length===previous.elements.length&&chapterElements.every((el,i)=>el===previous.elements[i]))continue;
    lastChapter.set(chapter.id,{framework:chapter.framework,pages,elements:chapterElements});
    controller.update(serializeChapter(book,chapter,elements,controller.target.bookId,controller.target.masterChapterId));
  }
  return true;
}
registerPendingSource({hasPending:()=>[...controllers.values()].some(c=>c.dirty),retry:()=>{for(const c of controllers.values())if(c.dirty)void c.flush().catch(()=>{});}});
