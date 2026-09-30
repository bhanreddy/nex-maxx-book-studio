import type {SemanticDocument} from '../persistence/semanticDocument';
import { create } from 'zustand';
import { cloudChapterRepository, ChapterRepositoryError, type ChapterSaveTarget, type ChapterSnapshot } from '../persistence/chapterRepository';
import { CloudSaveController, emptyContentToken, type CloudRecoveryRecord, type CloudSaveStatus } from '../persistence/cloudSaveController';
import { cloudBookSnapshotRepository } from '../persistence/bookRepository';
import type { BookSnapshotDocument } from '../persistence/bookSnapshots';
import { toSemanticDocument } from '../persistence/semanticDocument';
import type { ChapterFramework } from '../../domain/educational/curriculum';

const PREFIX = 'nex_maxx_cloud_recovery_v1:';
const controllers = new Map<string, CloudSaveController>();
export const useCloudChapterStore = create<{ chapters: Record<string, CloudSaveStatus> }>(() => ({ chapters: {} }));

export function getCloudChapterController(chapterId: string): CloudSaveController | undefined {
  if (controllers.has(chapterId)) return controllers.get(chapterId);
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(PREFIX + chapterId);
    if (raw) return install(chapterId, JSON.parse(raw));
  } catch { throw new Error('The local chapter recovery record is unreadable. Download the local book and recovery record before reconnecting.'); }
}
function install(chapterId: string, record: CloudRecoveryRecord) {
  const bookRepository=record.target.bookId?cloudBookSnapshotRepository(record.target.bookId):undefined;
  const repository=bookRepository?{...bookRepository,save:(document:SemanticDocument,target:ChapterSaveTarget,options?:Parameters<typeof bookRepository.save>[2])=>bookRepository.save(document as BookSnapshotDocument,target,options)}:cloudChapterRepository();
  const controller = new CloudSaveController(record, repository, {
    save: value => localStorage.setItem(PREFIX + chapterId, JSON.stringify(value)),
    archive: document => localStorage.setItem(PREFIX + chapterId + ':previous', JSON.stringify({ document, savedAt: new Date().toISOString() })),
  }, status => useCloudChapterStore.setState(state => ({ chapters: { ...state.chapters, [chapterId]: status } })));
  controllers.set(chapterId, controller);
  return controller;
}
export async function connectNewCloudChapter(chapterId: string, target: ChapterSaveTarget) {
  const existing = getCloudChapterController(chapterId);
  if (existing) {
    if (existing.target.masterChapterId !== target.masterChapterId || existing.target.curriculumVersionId !== target.curriculumVersionId) {
      throw new Error('This local chapter is already linked to another central chapter. Open a separate chapter to change the link.');
    }
    return existing;
  }
  try {
    await cloudChapterRepository().loadSnapshot(target.masterChapterId);
    throw new Error('Central content already exists. Reload it before editing so this browser has a valid save token.');
  } catch (error) {
    if (!(error instanceof ChapterRepositoryError && error.status === 404)) throw error;
  }
  const controller = install(chapterId, { target, base: emptyContentToken(), acknowledged: '' });
  localStorage.setItem(PREFIX + chapterId, JSON.stringify({ target, base: emptyContentToken(), acknowledged: '' }));
  return controller;
}
export function acceptCloudChapter(chapterId: string, target: ChapterSaveTarget, snapshot: ChapterSnapshot) {
  const existing = getCloudChapterController(chapterId);
  if (existing && (existing.target.masterChapterId !== target.masterChapterId || existing.target.curriculumVersionId !== target.curriculumVersionId)) {
    throw new Error('This chapter is linked elsewhere. Open a separate local chapter.');
  }
  if(existing && existing.target.bookId!==target.bookId){
    if(existing.dirty)throw new Error('Resolve pending changes before changing this chapter’s central book');
    existing.dispose();controllers.delete(chapterId);
  }
  const controller = controllers.get(chapterId) || install(chapterId, { target, base: emptyContentToken(), acknowledged: '' });
  controller.acceptRemote(snapshot);
  return controller;
}
export async function connectCloudBookChapter(chapterId:string,target:ChapterSaveTarget,snapshot:ChapterSnapshot,document:BookSnapshotDocument){
  const existing=getCloudChapterController(chapterId);
  if(existing && existing.target.bookId===target.bookId){
    if(existing.target.masterChapterId!==target.masterChapterId||existing.target.curriculumVersionId!==target.curriculumVersionId)throw new Error('This chapter is already linked to a different central chapter or version');
    return existing;
  }
  if(existing?.dirty)await existing.flush();
  existing?.dispose();controllers.delete(chapterId);
  const record:CloudRecoveryRecord={target,base:{revision:snapshot.revision,edit_version:snapshot.edit_version,checksum:snapshot.checksum,layout:{revision:0,checksum:null}},acknowledged:''};
  localStorage.setItem(PREFIX+chapterId,JSON.stringify(record));const controller=install(chapterId,record);controller.update(document);return controller;
}
export function queueLinkedChapters(chapters: Array<{ id: string; framework?: ChapterFramework }>) {
  if (typeof localStorage === 'undefined') return;
  for (const chapter of chapters) {
    const controller = getCloudChapterController(chapter.id);
    if (controller && chapter.framework && !controller.target.bookId) controller.update(toSemanticDocument(chapter.framework,controller.target.masterChapterId));
  }
}
const pendingSources=new Set<{hasPending:()=>boolean;retry:()=>void}>();
export function registerPendingSource(source:{hasPending:()=>boolean;retry:()=>void}){pendingSources.add(source);}
export function hasPendingCloudChanges() { return [...controllers.values()].some(controller => controller.dirty)||[...pendingSources].some(source=>source.hasPending()); }
export function retryPendingCloudChanges() { for (const controller of controllers.values()) if (controller.dirty) void controller.flush().catch(() => {});for(const source of pendingSources)source.retry(); }
