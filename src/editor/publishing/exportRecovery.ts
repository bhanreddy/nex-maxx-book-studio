import type { Book, PageDefinition } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { restoreChapter, type BookSnapshotDocument } from '../persistence/bookSnapshots';

/** Fill only absent records. Current text, transforms and page membership always win. */
export function recoverMissingPageElements(book: Book, elements: Record<string, PageElement>, snapshots: BookSnapshotDocument[] = [], pages: PageDefinition[] = book.pages) {
  const next = { ...elements };
  const restoredSnapshots = new Map<BookSnapshotDocument, Record<string, PageElement>>();
  for (const page of pages) {
    const chapter = book.chapters.find(ch => ch.id === page.chapterId || ch.pageIds.includes(page.id));
    for (const id of page.elementIds) {
      if (next[id]) continue;
      const snapshot = snapshots.find(doc => doc.bookLayout.pages.some(p => p.id === page.id && p.elementIds.includes(id)) && doc.bookLayout.elements[id]);
      if (snapshot && chapter) {
        if (!restoredSnapshots.has(snapshot)) restoredSnapshots.set(snapshot, restoreChapter(snapshot, chapter).elements);
        const saved = restoredSnapshots.get(snapshot)![id];
        if (saved?.pageId === page.id) { next[id] = saved; continue; }
      }
      // An unsliced canonical block is an exact recoverable source, not a placeholder.
      const block = chapter?.framework?.blocks[id];
      if (!block || block.isDetached || block.pageId !== page.id || block.styleOverrides.sceneSlice || Object.values(next).some(el => el.smartBlockData?.curriculum?.sourceBlockId === id)) continue;
      next[id] = { id, pageId: page.id, type: 'smart-block', category: 'educational', version: 4,
        displayName: block.semanticContent.title || 'Learning block', locked: Boolean(block.curriculum?.locked),
        hidden: Boolean(block.curriculum?.hidden), content: {}, style: {}, transform: { ...block.transform },
        smartBlockData: structuredClone(block), presetId: block.presetId };
    }
  }
  return next;
}
