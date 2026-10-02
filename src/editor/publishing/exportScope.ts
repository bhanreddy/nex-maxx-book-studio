import type { Book, PageDefinition } from '../../domain/book/types';

/** Physical page positions, one-based; invalid input must never expand to the whole book. */
export function selectExportPages(book: Book, scope: 'all' | 'chapter' | 'selected', chapterId = '', range = ''): PageDefinition[] {
  if (scope === 'all') return book.pages;
  if (scope === 'chapter') {
    const chapter = book.chapters.find(chapter => chapter.id === chapterId);
    if (!chapter) throw new Error('Choose a chapter to export.');
    const pages = book.pages.filter(page => page.chapterId === chapter.id || chapter.pageIds.includes(page.id));
    if (!pages.length) throw new Error('This chapter has no locally loaded pages.');
    return pages;
  }
  const positions = new Set<number>();
  for (const part of range.split(',')) {
    const match = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(part);
    if (!match) throw new Error('Use page numbers such as 1-5, 8, 12-15.');
    const first = Number(match[1]), last = Number(match[2] || match[1]);
    if (first < 1 || last < first || last > book.pages.length) throw new Error(`Page range must be between 1 and ${book.pages.length}, in ascending order.`);
    for (let position = first; position <= last; position++) positions.add(position - 1);
  }
  return book.pages.filter((_, index) => positions.has(index));
}
