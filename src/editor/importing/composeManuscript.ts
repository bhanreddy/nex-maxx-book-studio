import { lineSourceEnds, sliceRuns, trimFrameRuns } from './sliceRuns';
import { CURRICULUM_GRADES } from '../../domain/educational/curriculum';
import { makeCurriculumBlock } from '../curriculum/chapterEngine';
import { SIMPLE_CHAPTER_STAGES } from '../curriculum/frameworkPlan';
import type { Book, Chapter, PageDefinition } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { pageMarginsFor } from '../pageFrame/pageFrame';
import { layoutTextFlow, type FlowRun } from '../layoutPartner/textWrapLayout';
import { checkCancelled, IMPORT_LIMITS, runsHtml, type ManuscriptDraft } from './types';

export interface ImportOptions { destination: 'new' | 'append'; title: string; continuation: boolean; continuationTitle: string }
export interface ImportPlan { book: Book; elements: Record<string, PageElement>; activePageIndex: number; importedPages: number; continuationPageId?: string; source: string }
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

/** Prepare a complete isolated document. No store mutation occurs until the user accepts its preview. */
function* compose(draft: ManuscriptDraft, base: Book, options: ImportOptions): Generator<void, ImportPlan> {
  const now = new Date().toISOString(), isNew = options.destination === 'new';
  const book: Book = isNew ? { ...base, id: id('book'), title: options.title.trim() || draft.name.replace(/\.[^.]+$/, ''), subtitle: '',
    units: [], chapters: [], pages: [], comments: [], userGuides: [], coverImage: undefined,
    masterPages: [], pageFrame: null, pageFramePolicy: 'custom', status: 'Writing', version: 1, createdAt: now, updatedAt: now } :
    { ...base, pages: [...base.pages], units: base.units.map(unit => ({ ...unit, chapterIds: [...unit.chapterIds] })),
      chapters: base.chapters.map(chapter => ({ ...chapter, pageIds: [...chapter.pageIds] })), updatedAt: now, version: base.version + 1 };
  const initialPages = book.pages.length, elements: Record<string, PageElement> = {};
  let chapter: Chapter | undefined, page: PageDefinition | undefined, y = 0, sourcePage: number | undefined;
  const unit = { id: id('unit'), number: book.units.length + 1, title: draft.name.replace(/\.[^.]+$/, ''), chapterIds: [] as string[] };
  book.units.push(unit);
  const newChapter = (title: string) => {
    const chapterId = id('chapter');
    const grade = CURRICULUM_GRADES.find(value => String(value) === (book.grade.match(/\d+/)?.[0] || book.grade.toUpperCase())) || 3;
    chapter = { id: chapterId, unitId: unit.id, title, number: book.chapters.length + 1, pageIds: [], learningObjectives: [],
      framework: { version: 1, planVersion: 2, mode: 'design', compositionRevision: 0, blocks: {},
        sections: SIMPLE_CHAPTER_STAGES.map(stage => ({ id: `${chapterId}-${stage.id}`, stage: stage.id, title: stage.name, blockIds: [] })),
        config: { grade, subject: book.subject, title, unit: unit.title, theme: '', pageCount: 1, learningOutcomes: [], concepts: [],
          personality: 'modern-editorial', complexity: 'standard', preset: 'balanced' } } };

    // Central snapshots require one semantic block. This detached chapter heading records real
    // structure only; native imported content remains canonical and is never regenerated.
    const heading = makeCurriculumBlock('chapter-hero', chapter.framework!.config, chapter.id);
    heading.semanticContent = { title }; heading.isDetached = true;
    chapter.framework!.blocks[heading.id] = heading;
    chapter.framework!.sections.find(section => section.stage === 'discover')!.blockIds.push(heading.id);
    book.chapters.push(chapter); unit.chapterIds.push(chapter.id); page = undefined;
  };
  const newPage = (artwork = false) => {
    if (book.pages.length - initialPages >= IMPORT_LIMITS.outputPages) throw new Error(`This import exceeds ${IMPORT_LIMITS.outputPages} studio pages. Import a smaller section.`);
    if (!chapter) newChapter(unit.title);
    page = { id: id('page'), pageIndex: book.pages.length, displayNumber: String(book.pages.length + 1), chapterId: chapter!.id, unitId: unit.id,
      elementIds: [], status: 'Writing', layoutMode: 'freeform', ...(artwork ? { pageFrame: null } : {}),
      importSource: { fileName: draft.name, format: draft.format, sourcePage, mode: draft.mode },
      notes: `Imported from ${draft.name}${sourcePage ? `, page ${sourcePage}` : ''}.` };
    book.pages.push(page); chapter!.pageIds.push(page.id); y = pageMarginsFor(book, page).topPt;
    return page;
  };
  const geometry = () => {
    if (!page) newPage();
    const margins = pageMarginsFor(book, page!);
    return { x: page!.pageIndex % 2 ? margins.outsidePt : margins.insidePt,
      width: book.dimensions.widthPt - margins.insidePt - margins.outsidePt,
      top: margins.topPt, bottom: book.dimensions.heightPt - margins.bottomPt };
  };
  const element = (name: string, x: number, top: number, width: number, height: number): PageElement => ({
    id: id('element'), pageId: page!.id, type: 'body', category: 'text', version: 1, displayName: name,
    transform: { x, y: top, width, height, rotation: 0, zIndex: page!.elementIds.length + 1 },
    style: { fontFamily: 'Inter', fontSize: 11, lineHeight: 1.5, color: '#1e293b', verticalAlign: 'top', paragraphSpacing: 0 },
    content: {}, locked: false, hidden: false, textWrap: { mode: 'none', offsetPt: 0 }, metadata: { tags: ['manuscript-import'] },
  });
  const add = (el: PageElement) => { elements[el.id] = el; page!.elementIds.push(el.id); };
  const measure = (runs: FlowRun[], width: number, size = 11) => {
    const probe = element('Measure', 0, 0, width, 30_000_000); probe.style.fontSize = size;
    const result = layoutTextFlow(probe, [], undefined, runs);
    if (result.oversetChars) throw new Error('Some text cannot fit inside this page size. Choose a larger page size before importing.');
    return result;
  };
  const text = (runs: FlowRun[], heading?: number) => {
    let g = geometry();
    const size = heading ? Math.max(13, 23 - heading * 2) : 11;
    const formatted = heading ? runs.map(run => ({ ...run, style: { ...run.style, bold: true } })) : runs;
    const measured = measure(formatted, g.width, size), lines = measured.fragments;
    const ends = lineSourceEnds(formatted, lines);
    let start = 0;
    while (start < lines.length) {
      g = geometry();
      if (g.width < 72 || g.bottom - g.top < size * 4) throw new Error('The target page has too little usable space. Increase its dimensions or reduce the margins.');
      let capacity = Math.floor((g.bottom - y - 2) / measured.lineHeight);
      if (capacity < 2 || (heading && capacity < lines.length + 2)) { newPage(); g = geometry(); capacity = Math.floor((g.bottom - y - 2) / measured.lineHeight); }
      let count = Math.min(capacity, lines.length - start);
      if (count < 1) throw new Error('Text could not fit on the target page.');
      const segmentAt = (count: number) => trimFrameRuns(sliceRuns(formatted, start ? ends[start - 1] : 0, ends[start + count - 1]));
      const segmentHeight = (runs: FlowRun[]) => {
        const flow = measure(runs, g.width, size);
        return (flow.fragments.at(-1)?.y || 0) + flow.lineHeight + 2;
      };
      let segment = segmentAt(count), height = segmentHeight(segment);
      if (height > g.bottom - y) {
        let low = 1, high = count, fit = 0;
        while (low <= high) {
          const candidate = (low + high) >>> 1;
          if (segmentHeight(segmentAt(candidate)) <= g.bottom - y) { fit = candidate; low = candidate + 1; }
          else high = candidate - 1;
        }
        if (!fit) {
          if (y > g.top) { newPage(); continue; }
          throw new Error('A paragraph contains more blank-line spacing than one page can hold. Remove excessive empty lines and retry.');
        }
        count = fit; segment = segmentAt(count); height = segmentHeight(segment);
      }
      const end = start + count;
      const el = element(heading ? `Imported heading: ${runs.map(r => r.text).join('').slice(0, 70)}` : 'Imported paragraph', g.x, y, g.width, height);
      el.style.fontSize = size; el.content = { text: runsHtml(segment), html: true };
      if (heading) { el.style.fontWeight = 700; el.metadata!.tags!.push(`heading-${heading}`); }
      add(el); y += el.transform.height + (heading ? 12 : 9); start = end;
      if (start < lines.length) newPage();
    }
  };
  for (const block of draft.blocks) {
    if (block.sourcePage !== undefined) sourcePage = block.sourcePage;
    if (block.kind === 'page-break') { page = undefined; yield; continue; }
    if (block.kind === 'text') {
      const title = block.runs.map(run => run.text).join('');
      if ((block.heading === 1 || (block.heading && /^chapter\s+/i.test(title))) && (!chapter || page?.elementIds.length || chapter.pageIds.length)) newChapter(title.replace(/^chapter\s*\d*\s*[:.—-]?\s*/i, '') || title);
      text(block.runs, block.heading);
    } else if (block.kind === 'image') {
      if (draft.mode === 'artwork') {
        newPage(true);
        const scale = Math.min(book.dimensions.widthPt / block.width, book.dimensions.heightPt / block.height);
        const w = block.width * scale, h = block.height * scale;
        const el = element(block.alt, (book.dimensions.widthPt - w) / 2, (book.dimensions.heightPt - h) / 2, w, h);
        el.type = 'image'; el.category = 'media'; el.locked = true; el.style = { objectFit: 'contain', isBackgroundElement: true };
        el.content = { src: block.src, alt: block.alt }; add(el); page = undefined;
      } else {
        let g = geometry();
        const scale = Math.min(g.width / block.width, (g.bottom - g.top) / block.height, 1);
        const w = block.width * scale, h = block.height * scale;
        if (y + h > g.bottom) { newPage(); g = geometry(); }
        const el = element(block.alt, g.x + (g.width - w) / 2, y, w, h);
        el.type = 'image'; el.category = 'media'; el.style = { objectFit: 'contain' }; el.content = { src: block.src, alt: block.alt }; add(el); y += h + 12;
      }
    } else if (block.kind === 'table') {
      const columns = Math.max(1, ...block.rows.map(row => row.length));
      if (columns > 12) throw new Error('A table has more than 12 columns. Use a landscape document or PDF artwork to preserve it.');
      for (const [rowIndex, row] of block.rows.entries()) {
        let g = geometry(); const cellWidth = g.width / columns;
        const cells = Array.from({ length: columns }, (_, column) => measure(row[column] || [], cellWidth - 14));
        const ends = cells.map((cell, column) => lineSourceEnds(row[column] || [], cell.fragments));
        let offset = 0; const maxLines = Math.max(1, ...cells.map(cell => cell.fragments.length));
        while (offset < maxLines) {
          g = geometry(); let capacity = Math.floor((g.bottom - y - 14) / 16.5);
          if (capacity < 2) { newPage(); g = geometry(); capacity = Math.floor((g.bottom - y - 14) / 16.5); }
          if (capacity < 1) throw new Error('This table cannot fit in the target page margins.');
          let count = Math.min(capacity, maxLines - offset);
          const cellRuns = (column: number, count: number) => trimFrameRuns(sliceRuns(row[column] || [], offset ? ends[column][Math.min(offset - 1, ends[column].length - 1)] || 0 : 0,
            ends[column][Math.min(offset + count - 1, ends[column].length - 1)] || 0));
          const rowHeight = (count: number) => Math.max(...cells.map((_, column) => {
            const flow = measure(cellRuns(column, count), cellWidth - 14);
            return (flow.fragments.at(-1)?.y || 0) + flow.lineHeight + 14;
          }));
          let height = rowHeight(count);
          while (height > g.bottom - y && count > 1) height = rowHeight(--count);
          if (height > g.bottom - y) {
            if (y > g.top) { newPage(); continue; }
            throw new Error('A table cell contains excessive blank-line spacing. Simplify that cell or import PDF artwork.');
          }
          for (const column of cells.keys()) {
            const runs = cellRuns(column, count);
            const el = element(`Table row ${rowIndex + 1}, column ${column + 1}`, g.x + column * cellWidth, y, cellWidth, height);
            el.style = { ...el.style, padding: { top: 6, right: 6, bottom: 6, left: 6 }, borderWidth: .5, borderColor: '#cbd5e1', backgroundColor: rowIndex % 2 ? '#f8fafc' : '#ffffff' };
            el.content = { text: runsHtml(runs), html: true }; el.metadata!.tags!.push('imported-table-cell'); add(el);
          }
          offset += count; y += height; if (offset < maxLines) newPage();
        }
      }
      y += 12;
    }
    yield;
  }
  const importedPages = book.pages.length - initialPages;
  if (!importedPages) throw new Error('No importable content was found.');
  let continuationPageId: string | undefined;
  if (options.continuation) {
    sourcePage = undefined;
    if (options.continuationTitle.trim()) newChapter(options.continuationTitle.trim());
    const continuation = newPage(); delete continuation.importSource; continuation.templateId = 'chapter-empty-space';
    continuation.notes = `Continue the manuscript imported from ${draft.name}.`; continuationPageId = continuation.id;
    if (options.continuationTitle.trim()) text([{ text: options.continuationTitle.trim(), style: {} }], 1);
  }
  for (const importedChapter of book.chapters.filter(chapter => chapter.unitId === unit.id)) {
    if (importedChapter.framework) importedChapter.framework.config.pageCount = importedChapter.pageIds.length;
  }
  return { book, elements, importedPages, continuationPageId,
    activePageIndex: options.continuation ? book.pages.length - 1 : initialPages, source: draft.name };
}
export function composeManuscript(draft: ManuscriptDraft, base: Book, options: ImportOptions): ImportPlan {
  const iterator = compose(draft, base, options);
  let result = iterator.next(); while (!result.done) result = iterator.next(); return result.value;
}
export async function prepareManuscript(draft: ManuscriptDraft, base: Book, options: ImportOptions, signal?: AbortSignal): Promise<ImportPlan> {
  if (typeof document !== 'undefined') { await document.fonts.load('11pt Inter'); await document.fonts.load('bold 21pt Inter'); }
  const iterator = compose(draft, base, options);
  let result = iterator.next(), steps = 0;
  while (!result.done) { checkCancelled(signal); if (++steps % 16 === 0) await new Promise(resolve => setTimeout(resolve, 0)); result = iterator.next(); }
  checkCancelled(signal); return result.value;
}
