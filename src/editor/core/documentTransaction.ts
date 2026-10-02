import type { Book } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';
import { synchronizeBookStructure } from '../structure/bookStructureEngine';
import { dirtyPageTracker } from '../performance/largeBookEngine';

/** Commit production operations through the existing store and undo stack. */
export function commitDocumentChange(description: string, book: Book, elements: Record<string, PageElement>, activePageIndex?: number) {
  const before = useEditorStore.getState();
  const previousPages = new Set(before.books.find(item => item.id === book.id)?.pages.map(page => page.id));
  const synchronized = synchronizeBookStructure({ ...book, chapters: book.chapters.map(chapter => ({ ...chapter, pageIds: [...chapter.pageIds, ...book.pages.filter(page => !previousPages.has(page.id) && page.chapterId === chapter.id).map(page => page.id)] })) }, elements);
  const afterBooks = before.books.map(item => item.id === book.id ? synchronized.updatedBook : item);
  const apply = (books: Book[], nextElements: Record<string, PageElement>, index: number) => {
    useEditorStore.setState({ books, elements: nextElements, activePageIndex: index, selectedElementIds: [] });
    book.pages.forEach(page => dirtyPageTracker.markDirty(page.id));
    useEditorStore.getState().saveToStorage();
  };
  const index = activePageIndex ?? before.activePageIndex;
  apply(afterBooks, synchronized.updatedElements, index);
  useHistoryStore.getState().pushAction({ description,
    undo: () => apply(before.books, before.elements, before.activePageIndex),
    redo: () => apply(afterBooks, synchronized.updatedElements, index),
  });
}
