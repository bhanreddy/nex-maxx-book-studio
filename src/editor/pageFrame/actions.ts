import { renumberBookPages } from "../core/pageNumbering";
import type { Book } from '../../domain/book/types';
import type { PageFrame } from './types';
import { useEditorStore } from '../stores/editorStore';
import { useHistoryStore } from '../stores/historyStore';
import { useUiStore } from '../stores/uiStore';
import { composeChapter } from '../curriculum/chapterEngine';
import { chapterFrame, frameMargins } from './pageFrame';

export type FrameScope = 'page' | 'chapter' | 'book';
export function applyPageFrame(frame: PageFrame | null, scope: FrameScope = 'book') {
  const st = useEditorStore.getState(), book = st.getActiveBook(), page = st.getActivePage();
  if (!book || !page) return;
  const chapter = book.chapters.find(c => c.id === page.chapterId || c.pageIds.includes(page.id));
  const before = { books: st.books, elements: st.elements, activePageIndex: st.activePageIndex, selectedElementIds: st.selectedElementIds };
  const targetIds = new Set(scope === 'book' ? book.pages.map(p => p.id) : scope === 'chapter' && chapter ? book.pages.filter(p => p.chapterId === chapter.id || chapter.pageIds.includes(p.id)).map(p => p.id) : [page.id]);
  let nextBook: Book = { ...book, premiumPageBorderVersion: 1, pageFramePolicy: scope === 'book' ? 'book' : 'custom', ...(scope === 'book' ? { pageFrame: frame } : {}),
    chapters: book.chapters.map(c => scope === 'book' || (scope === 'chapter' && c.id === chapter?.id) ? { ...c, pageFrame: scope === 'book' ? undefined : frame } : c),
    pages: book.pages.map(p => targetIds.has(p.id) ? { ...p, pageFrame: scope === 'page' || (scope === 'chapter' && !chapter) ? frame : undefined } : p), updatedAt: new Date().toISOString() };
  let elements = st.elements;
  // First application reserves reading space and recomposes framework content without shrinking type.
  if (scope !== 'page') for (const c of nextBook.chapters) {
    if (!c.framework || (scope !== 'book' && c.id !== chapter?.id)) continue;
    const oldChapter = book.chapters.find(old => old.id === c.id)!;
    if (JSON.stringify(frameMargins(book, chapterFrame(book, oldChapter))) === JSON.stringify(frameMargins(nextBook, chapterFrame(nextBook, c)))) continue;
    const result = composeChapter(nextBook, c, elements);
    nextBook = result.book; elements = result.elements;
  }
  nextBook = renumberBookPages(nextBook);
  const next = { books: st.books.map(b => b.id === book.id ? nextBook : b), elements,
    activePageIndex: Math.max(0, Math.min(nextBook.pages.length - 1, nextBook.pages.findIndex(p => p.id === page.id))), selectedElementIds: st.selectedElementIds.filter(id => elements[id]) };
  const apply = (state: typeof before) => { useEditorStore.setState(state); useEditorStore.getState().saveToStorage(); };
  apply(next);
  useHistoryStore.getState().pushAction({ description: frame ? 'Edit page border and background' : 'Remove page border and background', undo: () => apply(before), redo: () => apply(next) });
  useUiStore.getState().showToast({ type: 'success', title: frame ? 'Editable page frame applied' : 'Page frame removed', message: scope === 'chapter' && !chapter ? 'This page has no chapter; applied to this page.' : `Applied to ${scope === 'book' ? 'every page in the book, including future pages' : scope === 'chapter' ? 'every chapter page, including future pages' : 'this page'}.` });
}
