import type {CloudChapterRepository,ChapterSnapshot,ChapterSaveTarget,ContentRevisionToken} from './chapterRepository';
import {ChapterRepositoryError} from './chapterRepository';
import {upgradeSemanticDocument} from './semanticDocument';
import type {BookDocument,BookSnapshotDocument,ChapterLayoutDocument} from './bookSnapshots';
export async function curriculumRequest<T>(path:string,method='GET',body?:unknown,key?:string):Promise<T>{
  const response=await fetch(`/api/curriculum/${path}`,{method,cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const json=await response.json().catch(()=>({}));if(!response.ok)throw new ChapterRepositoryError(json.error||'Central request failed',json.code||'CENTRAL_REQUEST_FAILED',response.status,json.current);
  if(!json.success||!json.data)throw new Error('Central request returned an invalid response');return json.data;
}
interface SnapshotResponse {content:ChapterSnapshot;layout:{id:string;revision:number;checksum:string;document:ChapterLayoutDocument;content_checksum:string}|null}
function assertToken(value:ContentRevisionToken){
  if(!Number.isSafeInteger(value?.revision)||value.revision<1||!Number.isSafeInteger(value.edit_version)||value.edit_version<1||typeof value.checksum!=='string'||!/^[a-f0-9]{64}$/.test(value.checksum))throw new Error('Central response returned invalid revision metadata');
  if(value.layout&&(!Number.isSafeInteger(value.layout.revision)||value.layout.revision<1||!value.layout.checksum||!/^[a-f0-9]{64}$/.test(value.layout.checksum)))throw new Error('Central response returned invalid layout metadata');
}
function token(value:ContentRevisionToken):ContentRevisionToken {return {revision:value.revision,edit_version:value.edit_version,checksum:value.checksum};}
export function cloudBookSnapshotRepository(bookId:string):CloudChapterRepository<BookSnapshotDocument>{
  const loadSnapshot=async(chapterId:string):Promise<ChapterSnapshot<BookSnapshotDocument>>=>{
    const result=await curriculumRequest<SnapshotResponse>(`books/${bookId}/chapters/${chapterId}/snapshot`);
    assertToken(result.content);
    if(!result.layout)throw new ChapterRepositoryError('No central layout exists. Save this book chapter first.','LAYOUT_NOT_FOUND',404);
    if(result.layout.content_checksum!==result.content.checksum)throw new ChapterRepositoryError('Central content changed outside this book snapshot. Compare changes before saving.','LAYOUT_CONTENT_STALE',409,result.content);
    return {...result.content,layout:{revision:result.layout.revision,checksum:result.layout.checksum},document:{...upgradeSemanticDocument(result.content.document),bookLayout:result.layout.document}};
  };
  return {kind:'cloud',loadSnapshot,load:async chapterId=>(await loadSnapshot(chapterId)).document,
    save:async(document,target,options={})=>{
      const {bookLayout,...semantic}=document;
      if(!bookLayout||bookLayout.bookId!==bookId||target.bookId!==bookId)throw new Error('A central book save requires its complete matching chapter layout');
      const response=await curriculumRequest<{content:ChapterSnapshot;layout:{revision:number;checksum:string}}>(`books/${bookId}/chapters/${target.masterChapterId}/snapshot`,'PUT',{
        document:semantic,layout:bookLayout,contentBase:options.base?token(options.base):undefined,layoutBase:options.base?.layout||{revision:0,checksum:null}},options.idempotencyKey);
      const saved={...response.content,layout:response.layout};assertToken(saved);return saved;
    }};
}
export interface CentralBook {id:string;curriculum_version_id:string;offering_id:string;revision:number;checksum:string;document:BookDocument}
export function cloudBookMetadataRepository():CloudChapterRepository<BookDocument>{
  const loadSnapshot=async(bookId:string):Promise<ChapterSnapshot<BookDocument>>=>{const book=await curriculumRequest<CentralBook>(`books/${bookId}`);const snapshot={...book,edit_version:book.revision};assertToken(snapshot);return snapshot;};
  return {kind:'cloud',loadSnapshot,load:async id=>(await loadSnapshot(id)).document,
    save:async(document,target:ChapterSaveTarget,options={})=>{
      const result=await curriculumRequest<CentralBook>(`books/${target.bookId}`,'PUT',{document,base:options.base?{revision:options.base.revision,checksum:options.base.checksum}:undefined},options.idempotencyKey);
      const saved={...result,edit_version:result.revision};assertToken(saved);return saved;
    }};
}
