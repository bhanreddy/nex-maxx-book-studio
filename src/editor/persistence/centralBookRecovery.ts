import {getCloudBookController} from '../stores/cloudBookStore';
import {getCloudChapterController} from '../stores/cloudChapterStore';
import {restoreBookMetadata,restoreChapter,type BookSnapshotDocument} from './bookSnapshots';
const POINTER='nexmaxx:active-central-book';
export function rememberCentralBook(localBookId:string,chapterId:string){
  localStorage.setItem(POINTER,JSON.stringify({localBookId,chapterId}));
}
/** Only the active chapter is reconstructed. Exact request receipts stay in recovery records. */
export function recoverActiveCentralBook(){
  const raw=localStorage.getItem(POINTER);if(!raw)return;
  const pointer=JSON.parse(raw) as {localBookId:string;chapterId:string};
  const metadata=getCloudBookController(pointer.localBookId),chapter=getCloudChapterController(pointer.chapterId);
  if(!metadata?.document||!chapter?.target.bookId||!chapter.document)return;
  const document=chapter.document as BookSnapshotDocument;
  if(!document.bookLayout||document.bookLayout.bookId!==chapter.target.bookId)throw new Error('Incomplete central layout recovery; the original recovery key is retained');
  const shell=restoreBookMetadata(chapter.target.bookId,metadata.document,pointer.localBookId);
  const entry=shell.chapters.find(c=>c.id===pointer.chapterId);
  if(!entry)throw new Error('Recovery chapter is missing from the book index');
  const restored=restoreChapter(document,entry);
  return {book:{...shell,chapters:shell.chapters.map(c=>c.id===entry.id?restored.chapter:c),pages:restored.pages},elements:restored.elements,
    pending:metadata.dirty||chapter.dirty};
}
