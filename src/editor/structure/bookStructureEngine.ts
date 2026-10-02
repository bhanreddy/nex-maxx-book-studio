/**
 * NEX MAXX Book Studio - Automatic Book Structure Engine
 * 
 * Semantic Hierarchy:
 * Book → Unit → Chapter → Lesson → Section → Exercise → Question
 * 
 * Automatically manages:
 * - Dynamic page numbering (Roman numerals for front matter, Arabic for chapters)
 * - Chapter numbering (Chapter 1, Chapter 2...)
 * - Question numbering (1.1, 1.2, Q1, Q2)
 * - Figure numbering (Figure 1.1, Figure 1.2)
 * - Live Table of Contents (TOC) generation
 * - Internal references and cross-references synchronization
 */

import { Book, Chapter, Unit, PageDefinition } from "../../domain/book/types";
import { renumberBookPages } from "../core/pageNumbering";
import { PageElement } from "../../domain/element/types";

export interface StructureSection {
  id: string;
  title: string;
  level: number;
  pageId: string;
  pageNumber: string;
}

export interface StructureLesson {
  id: string;
  chapterId: string;
  number: number;
  title: string;
  startPageId: string;
  pageNumber: string;
  sections: StructureSection[];
}

export interface StructureQuestion {
  id: string;
  elementId: string;
  exerciseId?: string;
  chapterNumber: number;
  exerciseNumber: number;
  questionNumber: number;
  label: string; // e.g. "Q1.1" or "1.2"
  stemText: string;
  pageNumber: string;
}

export interface StructureFigure {
  id: string;
  elementId: string;
  chapterNumber: number;
  figureNumber: number;
  label: string; // e.g. "Figure 1.1"
  caption: string;
  pageNumber: string;
}

export interface TocEntry {
  id: string;
  type: "unit" | "chapter" | "lesson";
  number: number;
  title: string;
  pageNumber: string;
  pageIndex: number;
  children?: TocEntry[];
}

export interface StructureNode {
  id: string;
  kind: 'book' | 'unit' | 'chapter' | 'lesson' | 'section' | 'exercise' | 'question';
  title: string;
  pageNumber?: string;
  children: StructureNode[];
}
export interface BookStructureReport {
  hierarchy?: StructureNode;
  totalUnits: number;
  totalChapters: number;
  totalLessons: number;
  totalExercises: number;
  totalQuestions: number;
  totalFigures: number;
  toc: TocEntry[];
  questions: StructureQuestion[];
  figures: StructureFigure[];
}

/**
 * Convert number to Roman Numeral (for front-matter folios)
 */
export function toRomanNumeral(num: number): string {
  if (num <= 0) return "";
  const lookup: Record<string, number> = {
    m: 1000,
    cm: 900,
    d: 500,
    cd: 400,
    c: 100,
    xc: 90,
    l: 50,
    xl: 40,
    x: 10,
    ix: 9,
    v: 5,
    iv: 4,
    i: 1,
  };
  let roman = "";
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

/**
 * Compile complete hierarchical semantic structure from book and elements
 */
export function compileBookStructure(
  book: Book,
  elementsMap: Record<string, PageElement>
): BookStructureReport {
  const toc: TocEntry[] = [];
  const questions: StructureQuestion[] = [];
  const figures: StructureFigure[] = [];

  let totalLessons = 0;
  let totalExercises = 0;

  // Track numbering counters
  let chapterIndex = 0;
  const hierarchy: StructureNode = { id: book.id, kind: 'book', title: book.title, children: (book.units || []).map(unit => ({ id: unit.id, kind: 'unit', title: unit.title, children: [] })) };

  for (const chapter of book.chapters) {
    chapterIndex++;
    const chapterPages = book.pages.filter(
      (p) => p.chapterId === chapter.id || (Array.isArray(chapter.pageIds) && chapter.pageIds.includes(p.id))
    );
    const startPage = chapterPages[0];
    const chapterPageNum = startPage?.displayNumber || String(chapterIndex);

    let figureCounterInChapter = 0;
    let exerciseCounterInChapter = 0;
    let questionCounter = 0;

    const chapterLessons: TocEntry[] = [];
    const chapterNode: StructureNode = { id: chapter.id, kind: 'chapter', title: chapter.title, pageNumber: chapterPageNum, children: [] };
    const unitNode = hierarchy.children.find(node => node.id === chapter.unitId);
    (unitNode?.children || hierarchy.children).push(chapterNode);
    let lessonNode: StructureNode = { id: `${chapter.id}:lesson`, kind: 'lesson', title: chapter.title, pageNumber: chapterPageNum, children: [] };
    chapterNode.children.push(lessonNode);
    const seenSources = new Set<string>();
    const sectionByBlock = new Map<string, string>();
    for (const section of chapter.framework?.sections || []) {
      const sectionNode: StructureNode = { id: section.id, kind: 'section', title: section.title, children: [] };
      lessonNode.children.push(sectionNode);
      section.blockIds.forEach(id => sectionByBlock.set(id, section.id));
    }
    let sectionNode: StructureNode | undefined;
    let exerciseNode: StructureNode | undefined;

    // Scan pages within this chapter
    for (const page of chapterPages) {
      const pageElements = (page.elementIds || [])
        .map((id) => elementsMap[id])
        .filter((el): el is PageElement => Boolean(el) && !el.hidden);

      // Sort elements top-to-bottom for natural reading order
      pageElements.sort((a, b) => a.transform.y - b.transform.y);

      for (const el of pageElements) {
        const sourceId = el.smartBlockData?.curriculum?.sourceBlockId || el.id;
        if (seenSources.has(sourceId)) continue;
        seenSources.add(sourceId);
        const archetype = el.smartBlockData?.archetypeId;
        const semantic = el.smartBlockData?.semanticContent;
        const blockSection = sectionByBlock.get(sourceId);
        if (blockSection) sectionNode = lessonNode.children.find(node => node.id === blockSection);

        // Detect Lesson titles
        if (el.type === "lesson-title" || (el.type === "subheading" && el.displayName?.toLowerCase().includes("lesson"))) {
          totalLessons++;
          const lessonTitle = el.content?.text || el.displayName;
          if (!chapterLessons.length && lessonNode.children.length === 0) chapterNode.children = [];
          lessonNode = { id: el.id, kind: 'lesson', title: lessonTitle, pageNumber: page.displayNumber, children: [] };
          chapterNode.children.push(lessonNode); sectionNode = undefined; exerciseNode = undefined;
          chapterLessons.push({
            id: el.id,
            type: "lesson",
            number: chapterLessons.length + 1,
            title: lessonTitle,
            pageNumber: page.displayNumber || String(page.pageIndex + 1),
            pageIndex: page.pageIndex ?? 0,
          });
        }

        if ((el.type === 'subheading' && !el.displayName?.toLowerCase().includes('lesson')) || archetype === 'section-heading') {
          sectionNode = { id: sourceId, kind: 'section', title: semantic?.title || el.content.text || el.displayName, pageNumber: page.displayNumber, children: [] };
          lessonNode.children.push(sectionNode); exerciseNode = undefined;
        }

        // Detect Exercises
        if (el.type === "exercise" || el.content?.smartComponentType === "practice" || el.category === "workbook" || archetype === "exercises" || archetype === "guided-practice" || archetype === "assessment-mastery") {
          totalExercises++;
          exerciseCounterInChapter++;
          exerciseNode = { id: sourceId, kind: 'exercise', title: semantic?.title || el.displayName, pageNumber: page.displayNumber, children: [] };
          (sectionNode || lessonNode).children.push(exerciseNode);
        }

        const stems = semantic?.questions?.map(question => question.prompt) ||
          (['question','mcq'].includes(el.type) || ['quick-check','practice','assessment'].includes(el.content.smartComponentType) ? [el.content.title || el.content.text || el.displayName] : []);
        stems.forEach((stem, questionIndex) => {
          const number = ++questionCounter, label = `${chapterIndex}.${number}`;
          const id = semantic?.questions ? `${sourceId}:question:${questionIndex + 1}` : `sq-${sourceId}`;
          questions.push({ id, elementId: el.id, exerciseId: exerciseNode?.id, chapterNumber: chapterIndex, exerciseNumber: Math.max(1,exerciseCounterInChapter), questionNumber: number, label, stemText: stem, pageNumber: page.displayNumber });
          (exerciseNode || sectionNode || lessonNode).children.push({ id, kind: 'question', title: `${label}. ${stem}`, pageNumber: page.displayNumber, children: [] });
        });

        // Detect Figures & Illustrations
        if (el.type === "image" || el.type === "diagram" || el.type === "illustration") {
          figureCounterInChapter++;
          const figLabel = `Figure ${chapterIndex}.${figureCounterInChapter}`;
          const caption = el.content?.alt || el.content?.caption || el.displayName;

          figures.push({
            id: `sf-${el.id}`,
            elementId: el.id,
            chapterNumber: chapterIndex,
            figureNumber: figureCounterInChapter,
            label: figLabel,
            caption,
            pageNumber: page.displayNumber,
          });
        }
      }
    }

    toc.push({
      id: chapter.id,
      type: "chapter",
      number: chapterIndex,
      title: chapter.title,
      pageNumber: chapterPageNum,
      pageIndex: startPage ? startPage.pageIndex : 0,
      children: chapterLessons,
    });
  }

  return {
    hierarchy,
    totalUnits: book.units?.length || 0,
    totalChapters: book.chapters.length,
    totalLessons,
    totalExercises,
    totalQuestions: questions.length,
    totalFigures: figures.length,
    toc,
    questions,
    figures,
  };
}

/**
 * Synchronize all structural labels, numbering, and cross references across the book
 */
export function synchronizeBookStructure(
  book: Book,
  elementsMap: Record<string, PageElement>
): {
  updatedBook: Book;
  updatedElements: Record<string, PageElement>;
  report: BookStructureReport;
  referencesUpdatedCount: number;
} {
  const updatedElements: Record<string, PageElement> = { ...elementsMap };
  let referencesUpdatedCount = 0;

  const numbered = renumberBookPages(book);
  const updatedPages = numbered.pages;
  const updatedBook: Book = {
    ...numbered,
    chapters: book.chapters.map((chapter, index) => ({ ...chapter, number: index + 1, pageIds: (chapter.pageIds || []).filter(id => updatedPages.some(page => page.id === id)) })),
  };

  // 2. Compile structure report with new page numbers
  const report = compileBookStructure(updatedBook, updatedElements);

  // 3. Build fast lookup maps for cross-references
  const pageLookupByChapterId: Record<string, string> = {};
  report.toc.forEach((c) => {
    pageLookupByChapterId[c.id] = c.pageNumber;
  });

  const figureLookupByElementId: Record<string, StructureFigure> = {};
  report.figures.forEach((f) => {
    figureLookupByElementId[f.elementId] = f;
  });

  const questionLookupByElementId: Record<string, StructureQuestion> = {};
  report.questions.forEach((q) => {
    questionLookupByElementId[q.elementId] = q;
  });

  // Preserve source templates so repeated edits/reordering keep references live.
  const owned = new Set(updatedPages.flatMap(page => page.elementIds));
  const targets = new Map<string, string>();
  updatedPages.forEach(page => targets.set(page.id, page.displayNumber));
  report.toc.forEach(chapter => { targets.set(chapter.id, chapter.pageNumber); chapter.children?.forEach(lesson => targets.set(lesson.id, lesson.pageNumber)); });
  report.figures.forEach(figure => targets.set(figure.elementId, figure.label));
  report.questions.forEach(question => { targets.set(question.id, question.label); targets.set(question.elementId, question.label); });
  for (const id of owned) {
    const el = updatedElements[id];
    if (!el) continue;
    let content = el.content; const metadata = { ...el.metadata };
    const figure = figureLookupByElementId[id], question = questionLookupByElementId[id];
    if (figure && !el.locked && typeof content.caption === 'string') {
      const source = metadata.figureCaptionSource || content.caption.replace(/^Figure \d+\.\d+:\s*/, '');
      metadata.figureCaptionSource = source;
      content = { ...content, caption: `${figure.label}: ${source}`, figureNumber: figure.label };
    }
    if (question && !el.locked && !el.smartBlockData) content = { ...content, questionNumber: question.label };
    if (typeof content.text === 'string') {
      // A direct user text edit replaces the previous template deliberately.
      const template = metadata.referenceRenderedText === content.text && metadata.referenceTemplate ? metadata.referenceTemplate : content.text;
      if (/\{ref:/.test(template)) {
        const text = template.replace(/\{ref:(?:(chapter|page|figure|question):)?([^}]+)\}/g, (match, kind, target) => {
          const value = targets.get(target);
          if (!value) return match; // Preflight must still see unresolved references.
          if (kind === 'chapter') return `Chapter ${report.toc.find(c => c.id === target)?.number || '?'} (Page ${value})`;
          if (kind === 'figure' || kind === 'question') return value;
          return `Page ${value}`;
        });
        metadata.referenceTemplate = template; metadata.referenceRenderedText = text;
        if (text !== content.text) referencesUpdatedCount++;
        content = { ...content, text };
      } else { delete metadata.referenceTemplate; delete metadata.referenceRenderedText; }
    }
    if (metadata.tocTargetId) {
      const entry = report.toc.flatMap(chapter => [chapter, ...(chapter.children || [])]).find(entry => entry.id === metadata.tocTargetId);
      if (entry) content = { ...content, text: `${entry.type === 'chapter' ? `Chapter ${entry.number}: ` : '• '}${entry.title} ${'.'.repeat(20)} ${entry.pageNumber}` };
    }
    if (el.metadata?.tags?.includes('master-folio')) content = { ...content, text: updatedPages.find(page => page.id === el.pageId)?.displayNumber || content.text };
    if (JSON.stringify(content) !== JSON.stringify(el.content) || JSON.stringify(metadata) !== JSON.stringify(el.metadata || {})) updatedElements[id] = { ...el, content, metadata };
  }

  return {
    updatedBook,
    updatedElements,
    report,
    referencesUpdatedCount,
  };
}

/**
 * Generate Table of Contents (TOC) page elements
 */
export function generateTocElements(
  report: BookStructureReport,
  pageId: string,
  widthPt: number = 480,
  topPt: number = 50
): PageElement[] {
  const elements: PageElement[] = [];

  // TOC Title
  const titleId = `toc-title-${pageId}`;
  elements.push({
    id: titleId,
    pageId,
    type: "heading",
    category: "text",
    version: 1,
    displayName: "TOC Title",
    transform: { x: 42, y: topPt, width: widthPt, height: 36, rotation: 0, zIndex: 1 },
    style: {
      fontFamily: "Outfit, sans-serif",
      fontSize: 24,
      fontWeight: 800,
      color: "#0f172a",
      letterSpacing: -0.5,
    },
    content: { text: "Table of Contents" },
    locked: false,
    hidden: false,
  });

  let currentY = topPt + 50;

  // Render each chapter entry
  report.toc.forEach((entry, idx) => {
    const entryId = `toc-entry-${pageId}-${idx}`;
    const entryText = `Chapter ${entry.number}: ${entry.title}`;
    const pageNumText = entry.pageNumber;

    elements.push({
      id: entryId,
      pageId,
      type: "body",
      category: "text",
      version: 1,
      displayName: `TOC - Chapter ${entry.number}`,
      metadata: { tocTargetId: entry.id },
      transform: { x: 42, y: currentY, width: widthPt, height: 24, rotation: 0, zIndex: 1 },
      style: {
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: "#1e293b",
      },
      content: {
        text: `${entryText} ${".".repeat(40)} ${pageNumText}`,
      },
      locked: false,
      hidden: false,
    });

    currentY += 28;

    // Render lessons underneath if any
    if (entry.children && entry.children.length > 0) {
      entry.children.forEach((lesson, lIdx) => {
        const lessonId = `toc-lesson-${pageId}-${idx}-${lIdx}`;
        elements.push({
          id: lessonId,
          pageId,
          type: "body",
          category: "text",
          version: 1,
          displayName: `TOC - Lesson ${lesson.number}`,
          metadata: { tocTargetId: lesson.id },
          transform: { x: 62, y: currentY, width: widthPt - 20, height: 18, rotation: 0, zIndex: 1 },
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: 9.5,
            fontWeight: 400,
            color: "#64748b",
          },
          content: {
            text: `• ${lesson.title} ${".".repeat(35)} ${lesson.pageNumber}`,
          },
          locked: false,
          hidden: false,
        });
        currentY += 22;
      });
    }

    currentY += 6;
  });

  return elements;
}
