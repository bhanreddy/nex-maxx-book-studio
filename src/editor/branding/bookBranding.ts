import type { Book } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { NEX_MAXX_LOGO } from '../../domain/brand';
import { renumberBookPages } from '../core/pageNumbering';
import { pageMarginsFor } from '../pageFrame/pageFrame';

/** One-time, non-destructive integration into the real document image model. */
export function integrateFirstPageLogo(book: Book, elements: Record<string, PageElement>) {
  if (!book.pages.length || book.publisherBrandingVersion === 1) return { book, elements };
  const first = book.pages[0];
  if (first.elementIds.some(id => elements[id]?.content.src === NEX_MAXX_LOGO.src)) {
    return { book: { ...book, publisherBrandingVersion: 1 as const }, elements };
  }
  const margins = pageMarginsFor(book, first);
  // 144 pt keeps the supplied 608 px screenshot above 300 effective DPI.
  const width = Math.min(144, book.dimensions.widthPt - margins.insidePt - margins.outsidePt);
  const height = width * NEX_MAXX_LOGO.height / NEX_MAXX_LOGO.width;
  const x = (book.dimensions.widthPt - width) / 2;
  const gap = 12, top = margins.topPt, bottom = book.dimensions.heightPt - margins.bottomPt;
  const occupied = first.elementIds.map(id => elements[id]).filter(el => el && !el.hidden &&
    !['shape', 'borderFrame', 'divider', 'group'].includes(el.type) &&
    el.transform.x < x + width + gap && el.transform.x + el.transform.width > x - gap);
  const candidates = [top, ...occupied.map(el => el.transform.y + el.transform.height + gap)].sort((a, b) => a - b);
  const y = candidates.find(y => y >= top && y + height <= bottom && occupied.every(el =>
    y + height + gap <= el.transform.y || y >= el.transform.y + el.transform.height + gap));
  const uniqueId = (base: string, exists: (id: string) => boolean) => {
    let id = base, suffix = 2;
    while (exists(id)) id = `${base}-${suffix++}`;
    return id;
  };
  const coverId = uniqueId(`${book.id}-brand-cover`, id => book.pages.some(page => page.id === id));
  const pageId = y === undefined ? coverId : first.id;
  const logoId = uniqueId(`${book.id}-publisher-logo`, id => !!elements[id]);
  const logo: PageElement = {
    id: logoId, pageId, type: 'image', category: 'media', version: 1,
    displayName: 'NEX MAXX publisher logo', locked: false, hidden: false,
    transform: { x, y: y ?? top, width, height, rotation: 0,
      zIndex: Math.max(0, ...first.elementIds.map(id => elements[id]?.transform.zIndex || 0)) + 1 },
    style: { objectFit: 'contain', opacity: 1 },
    content: { src: NEX_MAXX_LOGO.src, alt: NEX_MAXX_LOGO.alt,
      rawWidthPx: NEX_MAXX_LOGO.width, rawHeightPx: NEX_MAXX_LOGO.height },
    metadata: { tags: ['publisher-logo'] },
    semanticConstraints: { keepTogether: true },
  };
  const pages = y === undefined
    ? [{ id: coverId, pageIndex: 0, displayNumber: 'Cover', elementIds: [logoId], status: 'Draft' as const }, ...book.pages]
    : [{ ...first, elementIds: [...first.elementIds, logoId] }, ...book.pages.slice(1)];
  return { book: renumberBookPages({ ...book, publisherBrandingVersion: 1, pages }), elements: { ...elements, [logoId]: logo } };
}
