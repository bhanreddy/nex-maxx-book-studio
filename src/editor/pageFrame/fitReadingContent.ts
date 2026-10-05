import type { Book, PageDefinition } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { buildPublicationScene } from '../educational/publicationScene';
import { sceneWindows } from '../curriculum/pagination';
import { renumberBookPages } from '../core/pageNumbering';
import { pageFrameFor, pageMarginsFor } from './pageFrame';

const readingTypes = new Set(['smart-block', 'heading', 'subheading', 'chapter-title', 'lesson-title', 'body', 'body-text', 'caption', 'quote', 'question', 'mcq', 'table', 'activity', 'exercise']);

/** Keep reading size and content intact when older pages acquire a decorative frame. */
export function fitReadingContentInsideFrame(book: Book, elements: Record<string, PageElement>, pageIds = new Set(book.pages.map(page => page.id))) {
  let next = elements;
  let pages = [...book.pages];
  const continuationPageIds = new Set<string>();
  let changed = false;
  const place = (el: PageElement, pageId: string, y: number, height: number) => {
    const transform = { ...el.transform, y, height };
    return { ...el, pageId, transform, ...(el.smartBlockData ? { smartBlockData: { ...el.smartBlockData, pageId, transform } } : {}) };
  };
  for (const original of book.pages) {
    if (!pageIds.has(original.id) || !pageFrameFor(book, original) || original.importSource?.mode === 'artwork') continue;
    const margins = pageMarginsFor(book, original), top = margins.topPt, bottom = book.dimensions.heightPt - margins.bottomPt;
    const available = bottom - top;
    const reading = original.elementIds.map(id => next[id]).filter((el): el is PageElement => !!el && !el.hidden && !el.content.teacherOnly && !el.groupId && readingTypes.has(el.type));
    let insertion = pages.findIndex(page => page.id === original.id) + 1;
    for (const el of reading) {
      if (el.responsiveLayout || el.linkedNextId || el.linkedPrevId) continue;
      const block = el.smartBlockData;
      const scene = block ? buildPublicationScene({ ...block, transform: el.transform }) : undefined;
      const height = Math.max(el.transform.height, scene && !block?.styleOverrides.resizeFrame ? scene.height : el.transform.height);
      if (![height, el.transform.y, available].every(Number.isFinite) || available < 64) continue;
      if (el.transform.y >= top && el.transform.y + height <= bottom + .1) continue;
      const obstacles = original.elementIds.map(id => next[id]).filter((other): other is PageElement => !!other && other.id !== el.id && other.pageId === original.id && !other.hidden && other.category !== 'decorative' && other.type !== 'footer' && other.type !== 'page-number' && other.type !== 'pageNumber' && other.transform.x < el.transform.x + el.transform.width && other.transform.x + other.transform.width > el.transform.x);
      const candidates = [Math.max(top, Math.min(el.transform.y, bottom - height)), top, ...obstacles.map(other => other.transform.y + other.transform.height + 12)];
      const y = candidates.find(y => y >= top && y + height <= bottom + .1 && obstacles.every(other => y + height + 12 <= other.transform.y || y >= other.transform.y + other.transform.height + 12));
      if (!changed) next = { ...elements };
      if (y !== undefined) {
        next[el.id] = place(el, original.id, y, height); changed = true; continue;
      }
      // Only verified scene slicing can split a smart block. Never invent or drop content.
      if (height > available && (!scene || !block || block.styleOverrides.resizeFrame || (!block.curriculum && !block.styleOverrides.referenceElement))) continue;
      const windows = height > available && scene ? sceneWindows(scene, available) : [{ from: 0, to: height }];
      const sourceSlice = block?.styleOverrides.sceneSlice;
      pages = pages.map(page => page.id === original.id ? { ...page, elementIds: page.elementIds.filter(id => id !== el.id) } : page);
      windows.forEach((window, index) => {
        const pageId = crypto.randomUUID();
        let id = index ? `${el.id}::frame-${index}` : el.id;
        while (index && next[id]) id += '-next';
        const page: PageDefinition = { ...original, id: pageId, pageIndex: insertion, displayNumber: '', elementIds: [id], status: 'Design' };
        pages.splice(insertion++, 0, page); continuationPageIds.add(pageId);
        const placed = place({ ...el, id }, pageId, top, window.to - window.from);
        if (placed.smartBlockData && windows.length > 1) placed.smartBlockData = { ...placed.smartBlockData,
          curriculum: placed.smartBlockData.curriculum ? { ...placed.smartBlockData.curriculum, sourceBlockId: block?.curriculum?.sourceBlockId || el.id } : undefined,
          styleOverrides: { ...placed.smartBlockData.styleOverrides, sceneSlice: { from: window.from + (sourceSlice?.from || 0), to: window.to + (sourceSlice?.from || 0) } } };
        next[id] = placed;
      });
      changed = true;
    }
  }
  if (!changed) return { book, elements, changed, continuationPageIds };
  const chapters = book.chapters.map(chapter => ({ ...chapter, pageIds: [...new Set([...chapter.pageIds, ...pages.filter(page => continuationPageIds.has(page.id) && page.chapterId === chapter.id).map(page => page.id)])] }));
  return { book: renumberBookPages({ ...book, pages, chapters }), elements: next, changed, continuationPageIds };
}
