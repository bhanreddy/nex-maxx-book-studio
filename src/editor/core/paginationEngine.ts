import type { PageElement } from '../../domain/element/types';
import type { Book, PageDefinition } from '../../domain/book/types';
import { renumberBookPages } from './pageNumbering';
import { pageMarginsFor } from '../pageFrame/pageFrame';
import { estimateTextHeight } from './layoutSolver';

export interface PaginationOptions {
  widowOrphanLines?: number;
  defaultSpacingPt?: number;
  autoCreatePages?: boolean;
  preserveManualOverrides?: boolean;
}
export interface RepaginationResult {
  updatedPages: PageDefinition[];
  updatedElements: Record<string, PageElement>;
  pagesCreated: number;
  elementsMovedCount: number;
  overflowResolved: boolean;
  unresolvedElementIds: string[];
  affectedPageIds: string[];
}
export function isKeepWithNext(el: PageElement): boolean {
  return el.semanticConstraints?.keepWithNext ?? ['heading', 'subheading', 'chapter-title', 'lesson-title'].includes(el.type);
}
export function isKeepTogether(el: PageElement): boolean {
  return el.semanticConstraints?.keepTogether ?? !['body', 'body-text'].includes(el.type);
}

/** Conservative word-boundary split using the same height estimator as layout. */
export function evaluateWidowOrphanSplit(text: string, available: number, font = 10.5, line = 1.45, width = 400, minLines = 2) {
  const noSplit = { canFitPartially: false, splitCharIndex: 0, firstPartText: '', secondPartText: text };
  const linePt = font * line;
  if (![available, font, line, width].every(Number.isFinite) || linePt <= 0 || width <= 0 || available < minLines * linePt) return noSplit;
  const boundaries = [...text.matchAll(/\s+/g)].map(match => match.index!);
  let low = 0, high = boundaries.length - 1, best = -1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (estimateTextHeight(text.slice(0, boundaries[mid]), font, line, width) <= available) { best = mid; low = mid + 1; }
    else high = mid - 1;
  }
  while (best >= 0) {
    const index = boundaries[best--];
    const first = text.slice(0, index), second = text.slice(index);
    if (estimateTextHeight(first, font, line, width) >= minLines * linePt && estimateTextHeight(second, font, line, width) >= minLines * linePt) {
      return { canFitPartially: true, splitCharIndex: index, firstPartText: first, secondPartText: second };
    }
  }
  return noSplit;
}

/** Flow only editable reading layers. Artwork, masters and semantic chapter fragments retain their positions. */
export function repaginateFromPage(book: Book, elements: Record<string, PageElement>, start = 0, options: PaginationOptions = {}): RepaginationResult {
  const pages = [...book.pages], nextElements = { ...elements };
  const unresolved = new Set<string>(), affected = new Set<string>();
  let pagesCreated = 0, elementsMovedCount = 0;
  const spacing = Math.max(0, options.defaultSpacingPt ?? 14);
  const eligible = (el: PageElement) => !el.hidden && !el.locked && !el.groupId && !el.smartBlockData?.curriculum &&
    ['heading', 'subheading', 'chapter-title', 'lesson-title', 'body', 'body-text', 'question', 'mcq', 'table', 'activity', 'exercise', 'smart-block'].includes(el.type) &&
    !(options.preserveManualOverrides !== false && el.metadata?.styleOverride);
  const mutablePage = (index: number) => {
    if (!affected.has(pages[index].id)) { pages[index] = { ...pages[index], elementIds: [...pages[index].elementIds] }; affected.add(pages[index].id); }
    return pages[index];
  };
  const uniqueId = (base: string, exists: (id: string) => boolean) => {
    let id = base, n = 2;
    while (exists(id)) id = `${base}-${n++}`;
    return id;
  };
  const initialStart = Math.max(0, Math.trunc(start));
  for (let index = initialStart; index < pages.length; index++) {
    const page = pages[index], master = book.masterPages?.find(m => m.id === page.masterPageId);
    const margins = pageMarginsFor(book, page);
    const top = margins.topPt, bottom = book.dimensions.heightPt - margins.bottomPt;
    const flow = page.elementIds.map(id => nextElements[id]).filter((el): el is PageElement => !!el && eligible(el)).sort((a,b) => a.transform.y - b.transform.y);
    let overflow = -1;
    for (let i = 0; i < flow.length; i++) {
      const el = flow[i];
      if (el.transform.y + el.transform.height > bottom || (el.content.breakBefore && i > 0)) { overflow = i; break; }
    }
    if (overflow < 0) break; // stable boundary: no downstream recalculation
    while (overflow > 0 && isKeepWithNext(flow[overflow - 1])) overflow--;
    let moving = flow.slice(overflow);
    const first = moving[0];
    // An indivisible block cannot fit even on an empty page. Report it once; never allocate endlessly.
    if (moving.some(el => isKeepTogether(el) && el.transform.height > bottom - top) ||
      (isKeepWithNext(first) && moving[1] && first.transform.height + spacing + moving[1].transform.height > bottom - top)) {
      moving.forEach(el => unresolved.add(el.id)); break;
    }
    let nextPage = pages[index + 1];
    // Protect manually designed downstream pages and chapter boundaries: insert a continuation page.
    const canUseNext = nextPage && nextPage.chapterId === page.chapterId && nextPage.elementIds.every(id => !nextElements[id] || eligible(nextElements[id]));
    if (!canUseNext) {
      if (options.autoCreatePages === false) { moving.forEach(el => unresolved.add(el.id)); break; }
      const id = uniqueId(`flow-page-${page.id}`, id => pages.some(p => p.id === id));
      nextPage = { ...page, id, elementIds: [], pageIndex: index + 1, displayNumber: '', status: 'Draft', overflowWarning: undefined };
      pages.splice(index + 1, 0, nextPage); pagesCreated++;
    }
    const dest = mutablePage(index + 1), source = mutablePage(index);
    // Plain text only: rich text and linked frames require their existing specialized flow engine.
    if (!isKeepTogether(first) && !first.content.html && !first.metadata?.referenceTemplate && !first.content.text?.includes('{ref:') && !first.linkedNextId && !first.linkedPrevId && typeof first.content.text === 'string') {
      const split = evaluateWidowOrphanSplit(first.content.text, bottom - first.transform.y, first.style.fontSize || 10.5, first.style.lineHeight || 1.45, first.transform.width, options.widowOrphanLines ?? 2);
      if (split.canFitPartially) {
        const id = uniqueId(`flow-${first.id}`, id => !!nextElements[id]);
        const continuation = { ...first, id, displayName: `${first.displayName} (continued)`, content: { ...first.content, text: split.secondPartText }, transform: { ...first.transform, height: estimateTextHeight(split.secondPartText, first.style.fontSize || 10.5, first.style.lineHeight || 1.45, first.transform.width) } };
        nextElements[first.id] = { ...first, content: { ...first.content, text: split.firstPartText }, transform: { ...first.transform, height: estimateTextHeight(split.firstPartText, first.style.fontSize || 10.5, first.style.lineHeight || 1.45, first.transform.width) } };
        moving = [continuation, ...moving.slice(1)];
      } else if (first.transform.height > bottom - top) { unresolved.add(first.id); break; }
    }
    const movingIds = new Set(moving.map(el => el.id));
    source.elementIds = source.elementIds.filter(id => !movingIds.has(id));
    const downstream = dest.elementIds.map(id => nextElements[id]).filter((el): el is PageElement => !!el);
    let y = top;
    for (const el of [...moving, ...downstream]) {
      nextElements[el.id] = { ...el, pageId: dest.id, transform: { ...el.transform, y } };
      y += el.transform.height + spacing;
    }
    dest.elementIds = [...moving.map(el => el.id), ...dest.elementIds.filter(id => !movingIds.has(id))];
    elementsMovedCount += moving.length;
  }
  return { updatedPages: renumberBookPages({ ...book, pages }).pages, updatedElements: nextElements, pagesCreated, elementsMovedCount, overflowResolved: unresolved.size === 0, unresolvedElementIds: [...unresolved], affectedPageIds: [...affected] };
}
