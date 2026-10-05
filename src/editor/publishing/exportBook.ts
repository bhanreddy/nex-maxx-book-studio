import type { Book } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { restoreChapter, type BookSnapshotDocument } from '../persistence/bookSnapshots';
import { cloudBookSnapshotRepository } from '../persistence/bookRepository';
import { getCloudBookController } from '../stores/cloudBookStore';
import { getCloudChapterController } from '../stores/cloudChapterStore';
import { recoverMissingPageElements } from './exportRecovery';

/** Complete a linked book from saved local chapter receipts first; fetch only uncached chapters. */
export async function prepareCompleteExportBook(book: Book, elements: Record<string, PageElement>, requestedPageIds?: Set<string>) {
  let printable = book;
  let printElements = recoverMissingPageElements(book, elements);
  for (const chapter of book.chapters) {
    const pages = printable.pages.filter(page => page.chapterId === chapter.id || chapter.pageIds.includes(page.id));
    const requested = requestedPageIds ? pages.filter(page => requestedPageIds.has(page.id)) : pages;
    if (requestedPageIds && !requested.length) continue;
    if (pages.length && requested.every(page => page.elementIds.every(id => printElements[id]))) continue;
    const saved = getCloudChapterController(chapter.id)?.document;
    let snapshot = saved && 'bookLayout' in saved ? saved as BookSnapshotDocument : undefined;
    if (!snapshot) {
      const central = getCloudBookController(book.id);
      if (!central?.target.bookId || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
        if (pages.length) continue; // Preflight reports the exact unrecoverable page and record.
        throw new Error(`Chapter “${chapter.title}” is not cached locally. Open it online once before exporting the complete book offline.`);
      }
      const index = central.document?.settings.chapterIndex as Array<{ id: string; centralChapterId: string }> | undefined;
      const remoteId = index?.find(entry => entry.id === chapter.id || entry.centralChapterId === chapter.id)?.centralChapterId || chapter.id;
      const loaded = await cloudBookSnapshotRepository(central.target.bookId).loadSnapshot(remoteId);
      snapshot = loaded.document;
    }
    if (pages.length) {
      printElements = recoverMissingPageElements(printable, printElements, [snapshot], requested);
    } else {
      const restored = restoreChapter(snapshot, chapter);
      printable = { ...printable, chapters: printable.chapters.map(item => item.id === chapter.id ? restored.chapter : item), pages: [...printable.pages, ...restored.pages] };
      Object.assign(printElements, restored.elements);
    }
  }
  // Snapshots retain their physical page indices; preserve those rather than chapter fetch order.
  printable = { ...printable, pages: [...printable.pages].sort((a,b) => a.pageIndex - b.pageIndex) };
  return { book: printable, elements: printElements };
}
