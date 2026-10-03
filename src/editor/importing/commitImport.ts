import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';
import { dirtyPageTracker } from '../performance/largeBookEngine';
import type { ImportPlan } from './composeManuscript';
import type { Book } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';

/** One atomic transaction, including activation, with a complete undo/redo pair. */
export function commitManuscriptImport(plan: ImportPlan, expectedBook?: Book) {
  const before = useEditorStore.getState();
  if (expectedBook && before.books.find(book => book.id === expectedBook.id) !== expectedBook) {
    throw new Error('The destination book changed during preview. Go back and preview again to include its latest changes.');
  }
  const books = before.books.some(book => book.id === plan.book.id)
    ? before.books.map(book => book.id === plan.book.id ? plan.book : book) : [plan.book, ...before.books];
  const elements = { ...before.elements, ...plan.elements };
  const apply = (nextBooks: Book[], nextElements: Record<string, PageElement>, activeBookId: string, activePageIndex: number) => {
    useEditorStore.setState({ books: nextBooks, elements: nextElements, activeBookId, activePageIndex, selectedElementIds: [] });
    plan.book.pages.forEach(page => dirtyPageTracker.markDirty(page.id));
    useEditorStore.getState().saveToStorage();
  };
  apply(books, elements, plan.book.id, plan.activePageIndex);
  useHistoryStore.getState().pushAction({ description: `Import ${plan.source}`,
    undo: () => apply(before.books, before.elements, before.activeBookId, before.activePageIndex),
    redo: () => apply(books, elements, plan.book.id, plan.activePageIndex),
  });
}
