import type { Book, PageDefinition } from '../../domain/book/types';

/** Number the current page order without mutating objects held by undo history. */
export function renumberPages(pages: PageDefinition[]): PageDefinition[] {
  let number = 0, changed = false;
  const next = pages.map((page, pageIndex) => {
    const displayNumber = page.displayNumber === 'Cover' ? 'Cover' : String(++number);
    if (page.pageIndex === pageIndex && page.displayNumber === displayNumber) return page;
    changed = true;
    return { ...page, pageIndex, displayNumber };
  });
  return changed ? next : pages;
}
export function renumberBookPages(book: Book): Book {
  const pages = book.numbering === 'front-matter' ? renumberFrontMatter(book) : renumberPages(book.pages);
  return pages === book.pages ? book : { ...book, pages };
}

function roman(value: number): string {
  const symbols: [number, string][] = [[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']];
  let result = '';
  for (const [n, symbol] of symbols) while (value >= n) { result += symbol; value -= n; }
  return result;
}
function renumberFrontMatter(book: Book): PageDefinition[] {
  const chapterIds = new Set(book.chapters.flatMap(chapter => chapter.pageIds || []));
  const first = book.pages.findIndex(page => !!page.chapterId || chapterIds.has(page.id));
  let prelim = 0, changed = false;
  const pages = book.pages.map((page, pageIndex) => {
    const displayNumber = page.displayNumber === 'Cover' ? 'Cover' : first >= 0 && pageIndex < first ? roman(++prelim) : String(first >= 0 ? pageIndex - first + 1 : ++prelim);
    if (page.pageIndex === pageIndex && page.displayNumber === displayNumber) return page;
    changed = true; return { ...page, pageIndex, displayNumber };
  });
  return changed ? pages : book.pages;
}
