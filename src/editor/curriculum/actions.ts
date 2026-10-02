import { withReferenceElements } from "./referenceElements";
import { renumberBookPages, renumberPages } from "../core/pageNumbering";
import { pageFrameFor, frameMargins, pageMarginsFor } from "../pageFrame/pageFrame";
import type { Chapter, Book, PageDefinition } from "../../domain/book/types";
import type { SmartBlockInstance, EducationalBlockCategory } from "../../domain/educational/blockSchema";
import type { PageElement } from "../../domain/element/types";
import type { ChapterBuilderConfig, ChapterFramework, CurriculumLayout, FrameworkStage, CurriculumGrade, UniversalLayoutPreset } from "../../domain/educational/curriculum";
import { useEditorStore } from "../stores/editorStore";
import { useHistoryStore } from "../stores/historyStore";
import { useUiStore } from "../stores/uiStore";
import { composeChapter, generateFramework, makeCurriculumBlock, changeBlockLayout, convertCurriculumBlock, DEFAULT_CHAPTER_CONFIG } from "./chapterEngine";
import { CURRICULUM_BLOCK_MAP } from "./catalog";
import { buildPublicationScene } from "../educational/publicationScene";
import { detachPublicationScene } from "../educational/detachScene";
import { simpleChapterPlan, simpleStage, stageName } from "./frameworkPlan";
import { generateUniversal5Pages, getSubjectFixture, normalizeUniversalType, UNIVERSAL_BLOCK_MAP } from "./universalBlocks";
import { createSchemaTopic } from "./lessonSchema";
import { sceneWindows } from "./pagination";
import { NEX_MAXX_BRAND, NEX_MAXX_PRESETS } from "../../domain/educational/designTokens";

function commit(book: Book, elements: Record<string, PageElement>, description: string, focusId?: string) {
  book = renumberBookPages(book);
  const store = useEditorStore.getState();
  const before = { books: store.books, elements: store.elements, activePageIndex: store.activePageIndex, selectedElementIds: store.selectedElementIds };
  const focus = focusId ? elements[focusId] : undefined;
  const next = { books: store.books.map(b => b.id === book.id ? book : b), elements,
    activePageIndex: focus ? book.pages.findIndex(p => p.id === focus.pageId) : Math.min(store.activePageIndex, book.pages.length - 1),
    selectedElementIds: focus ? [focus.id] : store.selectedElementIds.filter(id => elements[id]) };
  const apply = (state: typeof before) => { useEditorStore.setState(state); useEditorStore.getState().saveToStorage(); };
  apply(next);
  useHistoryStore.getState().pushAction({ description, undo: () => apply(before), redo: () => apply(next) });
}
export function createFrameworkChapter(config: ChapterBuilderConfig): Chapter {
  const st = useEditorStore.getState(), book = st.getActiveBook();
  if (!book) throw new Error("Open a book first.");
  const unit = book.units.find(u => u.title.trim().toLowerCase() === config.unit.trim().toLowerCase()) || { id: crypto.randomUUID(), number: book.units.length + 1, title: config.unit.trim() || "Learning journey", chapterIds: [] };
  const id = crypto.randomUUID();
  const chapter: Chapter = { id, unitId: unit.id, number: book.chapters.length + 1, title: config.title.trim(), subtitle: config.theme,
    learningObjectives: [...config.learningOutcomes], pageIds: [], framework: generateFramework(config, id) };
  const nextBook = { ...book, units: [...book.units.filter(u => u.id !== unit.id), { ...unit, chapterIds: [...unit.chapterIds, id] }], chapters: [...book.chapters, chapter] };
  const result = composeChapter(nextBook, chapter, st.elements);
  commit(result.book, result.elements, `Build chapter · ${chapter.title}`, Object.keys(chapter.framework!.blocks)[0]);
  useUiStore.getState().setLeftPanelTab("structure");
  useUiStore.getState().showToast({ type: "success", title: `Chapter created · ${result.pages.length} designed pages`, message: result.pages.length > config.pageCount ? "Content needed extra pages. Reading type has been preserved." : "Edit content in Easy mode or unlock the layout in Design mode." });
  return result.chapter;
}
export function activeFrameworkChapter(): Chapter | undefined {
  const st = useEditorStore.getState(), book = st.getActiveBook(), page = st.getActivePage();
  return book?.chapters.find(c => c.framework && (c.id === page?.chapterId || c.pageIds.includes(page?.id || ""))) || book?.chapters.find(c => c.framework);
}
export function removeFrameworkChapter(chapterId: string) {
  const st = useEditorStore.getState(), book = st.getActiveBook(), chapter = book?.chapters.find(c => c.id === chapterId);
  if (!book || !chapter?.framework) return;
  const pageIds = new Set([...chapter.pageIds, ...book.pages.filter(p => p.chapterId === chapterId).map(p => p.id)]);
  const pages = book.pages.filter(p => !pageIds.has(p.id) && p.chapterId !== chapterId);
  if (!pages.length) { useUiStore.getState().showToast({ type: "info", title: "Keep at least one page in the book" }); return; }
  const elements = Object.fromEntries(Object.entries(st.elements).filter(([, el]) => !pageIds.has(el.pageId) && el.smartBlockData?.curriculum?.chapterId !== chapterId && el.content.curriculumChapterId !== chapterId));
  commit({ ...book, pages: pages.map((p, i) => ({ ...p, pageIndex: i })),
    chapters: book.chapters.filter(c => c.id !== chapterId),
    units: book.units.map(u => ({ ...u, chapterIds: u.chapterIds.filter(id => id !== chapterId) })) }, elements, `Remove chapter · ${chapter.title}`);
  useUiStore.getState().showToast({ type: "info", title: "Chapter removed", message: "Undo restores the chapter and every layer." });
}
export function editFramework(chapterId: string, description: string, edit: (framework: ChapterFramework) => ChapterFramework, focusId?: string, vary = false) {
  const st = useEditorStore.getState(), book = st.getActiveBook(), chapter = book?.chapters.find(c => c.id === chapterId);
  if (!book || !chapter?.framework) return;
  const framework = edit(structuredClone(simpleChapterPlan(chapter.framework)));
  const nextChapter = { ...chapter, framework, title: framework.config.title, learningObjectives: framework.config.learningOutcomes };
  const result = composeChapter(book, nextChapter, st.elements, vary);
  commit(result.book, result.elements, description, focusId);
}
export function curriculumSource(element: PageElement): SmartBlockInstance | undefined {
  const st = useEditorStore.getState(), meta = element.smartBlockData?.curriculum;
  if (!meta) return;
  const chapter = st.getActiveBook()?.chapters.find(c => c.id === meta.chapterId);
  const canonical = chapter?.framework?.blocks[meta.sourceBlockId || element.id];
  if (!canonical) return element.smartBlockData;
  return { ...canonical, isLockedDesign: element.smartBlockData!.isLockedDesign,
    ...(!element.smartBlockData!.styleOverrides.sceneSlice ? { transform: element.transform } : {}) };
}
export function insertCurriculumBlock(type: string, layout?: CurriculumLayout, grade?: CurriculumGrade, subject?: string, template?: SmartBlockInstance): void {
  const state = useEditorStore.getState(), activePage = state.getActivePage();
  const chapter = state.getActiveBook()?.chapters.find(c => c.framework && (c.id === activePage?.chapterId || c.pageIds.includes(activePage?.id || "")));
  if (chapter?.framework) {
    const block = makeCurriculumBlock(type, { ...chapter.framework.config, grade: grade || chapter.framework.config.grade, subject: subject || chapter.framework.config.subject }, chapter.id);
    if (template) { block.semanticContent = structuredClone(template.semanticContent); block.styleOverrides = { ...structuredClone(template.styleOverrides), sceneSlice: undefined }; }
    if (chapter.framework.config.referenceElements && !block.styleOverrides.referenceElement) block.styleOverrides = withReferenceElements(block).styleOverrides;
    if (type === "lesson-schema") block.semanticContent.calloutText = chapter.framework.config.title;
    if (layout) block.styleOverrides.layoutVariant = layout;
    editFramework(chapter.id, `Insert ${CURRICULUM_BLOCK_MAP[type].name}`, f => {
      f.blocks[block.id] = block;
      const section = f.sections.find(s => s.stage === block.curriculum!.frameworkStage);
      if (section) {
        const heroIndex = section.blockIds.findIndex(id => f.blocks[id]?.curriculum?.type === "chapter-hero");
        const schemaIndex = section.blockIds.findIndex(id => f.blocks[id]?.curriculum?.type === "lesson-schema");
        const studySkillsIndex = section.blockIds.findIndex(id => f.blocks[id]?.curriculum?.type === "study-skills");
        if (type === "lesson-schema" && heroIndex >= 0) section.blockIds.splice(heroIndex + 1, 0, block.id);
        else if (type === "study-skills" && schemaIndex >= 0) section.blockIds.splice(schemaIndex + 1, 0, block.id);
        else if (type === "study-skills" && heroIndex >= 0) section.blockIds.splice(heroIndex + 1, 0, block.id);
        else if (type === "learning-outcomes" && studySkillsIndex >= 0) section.blockIds.splice(studySkillsIndex + 1, 0, block.id);
        else if (type === "learning-outcomes" && schemaIndex >= 0) section.blockIds.splice(schemaIndex + 1, 0, block.id);
        else if (type === "learning-outcomes" && heroIndex >= 0) section.blockIds.splice(heroIndex + 1, 0, block.id);
        else section.blockIds.push(block.id);
      }
      else f.sections.push({ id: crypto.randomUUID(), title: stageName(block.curriculum!.frameworkStage), stage: block.curriculum!.frameworkStage, blockIds: [block.id] });
      return f;
    }, block.id);
    const placed = CURRICULUM_BLOCK_MAP[type];
    useUiStore.getState().showToast({ type: "success", title: `${placed.name} added`, message: `It is in the ${stageName(placed.stage)} section. Edit the words in the inspector.` });
  } else {
    const st = useEditorStore.getState(), book = st.getActiveBook();
    let page = st.getActivePage();
    if (!page || !book) return;
    const margins = frameMargins(book, pageFrameFor(book, page));
    const owningChapter = book.chapters.find(ch => ch.id === page!.chapterId || ch.pageIds.includes(page!.id));
    const header = page.elementIds.map(id => st.elements[id]).find(el => el?.smartBlockData?.curriculum?.type === "chapter-hero" || el?.type === "heading");
    const schemaConfig = type === "lesson-schema" ? { title: owningChapter?.title || header?.smartBlockData?.semanticContent.title || header?.content.text || "Chapter name", concepts: [] } : {};
    const block = makeCurriculumBlock(type, { ...DEFAULT_CHAPTER_CONFIG, ...schemaConfig, subject: subject || book.subject, grade: grade || (['NURSERY','LKG','UKG'].includes(book.grade.toUpperCase()) ? book.grade.toUpperCase() as CurriculumGrade : (parseInt(book.grade.slice(-1)) >= 1 && parseInt(book.grade.slice(-1)) <= 5 ? parseInt(book.grade.slice(-1)) as 1|2|3|4|5 : 3)) });
    if (template) { block.semanticContent = structuredClone(template.semanticContent); block.styleOverrides = { ...structuredClone(template.styleOverrides), sceneSlice: undefined }; }
    if (owningChapter?.referenceElements && !block.styleOverrides.referenceElement) block.styleOverrides = withReferenceElements(block).styleOverrides;
    if (type === "lesson-schema" && (owningChapter || header)) block.semanticContent.calloutText = schemaConfig.title;
    if (layout) block.styleOverrides.layoutVariant = layout;
    const occupied = page.elementIds.map(id => st.elements[id]).filter(el => el && !el.hidden && el.category !== "decorative");
    const nextY = Math.max(margins.topPt, ...occupied.map(el => el.transform.y + el.transform.height + 18));
    block.transform = { ...block.transform, x: margins.insidePt, y: nextY, width: book.dimensions.widthPt - margins.insidePt - margins.outsidePt, height: 0 };
    block.transform.height = buildPublicationScene(block).height;
    if (type === "lesson-schema" || block.styleOverrides.referenceElement) {
      block.pageId = page.id;
      reflowStandaloneLessonSchema(book, { id: block.id, pageId: page.id, type: "smart-block", category: "educational", version: 4, displayName: CURRICULUM_BLOCK_MAP[type].name, transform: block.transform, content: {}, style: {}, smartBlockData: block, presetId: block.presetId, locked: false, hidden: false }, block, "Insert lesson schema");
      useUiStore.getState().showToast({ type: "success", title: block.styleOverrides.referenceElement ? "Editable reference element added" : "Lesson Schema added", message: "Edit words in Content and appearance in Style. Long content continues safely onto new pages." });
      return;
    }
    if (nextY + block.transform.height > book.dimensions.heightPt - margins.bottomPt && occupied.length) {
      st.addPage(st.activePageIndex); page = useEditorStore.getState().getActivePage()!;
      block.transform.y = margins.topPt;
    }
    block.pageId = page.id;
    // Native insertion handles the page registration and undo. Long stand-alone blocks can be reflowed by building a chapter.
    st.insertPublicationElement({ id: block.id, pageId: page.id, type: "smart-block", category: "educational", version: 4, displayName: CURRICULUM_BLOCK_MAP[type].name, transform: block.transform, content: {}, style: {}, smartBlockData: block, presetId: block.presetId, locked: false, hidden: false });
    useUiStore.getState().showToast({ type: "success", title: `${CURRICULUM_BLOCK_MAP[type].name} added`, message: "It is on this page, under the last block. Edit the words in the inspector." });
  }
}
export function editCurriculumBlock(element: PageElement, description: string, edit: (block: SmartBlockInstance) => SmartBlockInstance) {
  if (element.locked || element.smartBlockData?.isLockedContent) return;
  const source = curriculumSource(element);
  if (!source || source.isDetached) return;
  const next = edit(structuredClone(source));
  if (next.curriculum) next.curriculum.frameworkStage = simpleStage(next.curriculum.frameworkStage, next.curriculum.type);
  const st = useEditorStore.getState(), book = st.getActiveBook(), chapter = book && source.curriculum?.chapterId ? book.chapters.find(c => c.id === source.curriculum!.chapterId) : undefined;
  if (book && source.curriculum?.chapterId && chapter?.framework) {
    // Free-design edits keep the author's pose. Structural edits and continuations still recompose.
    const sameStage = next.curriculum!.frameworkStage === source.curriculum.frameworkStage;
    const samePageRules = JSON.stringify(next.curriculum!.pageRules) === JSON.stringify(source.curriculum.pageRules);
    const projections = Object.values(st.elements).filter(el => el.smartBlockData?.curriculum?.sourceBlockId === source.id || el.id === source.id);
    next.styleOverrides.sceneSlice = undefined;
    const height = buildPublicationScene({ ...next, transform: { ...element.transform, height: 0 } }).height;
    if (chapter?.framework?.mode === "design" && sameStage && samePageRules && projections.length === 1 && element.transform.y + height <= book.dimensions.heightPt - frameMargins(book, pageFrameFor(book, book.pages.find(p => p.id === element.pageId)!)).bottomPt) {
      next.transform = { ...element.transform, height: Math.max(element.transform.height, height) };
      const framework = { ...chapter.framework, compositionRevision: chapter.framework.compositionRevision + 1, blocks: { ...chapter.framework.blocks, [source.id]: next } };
      const projection = { ...element, displayName: CURRICULUM_BLOCK_MAP[next.curriculum!.type].name, presetId: next.presetId, transform: next.transform,
        smartBlockData: { ...next, pageId: element.pageId, curriculum: { ...next.curriculum!, sourceBlockId: source.id } } };
      commit({ ...book, chapters: book.chapters.map(c => c.id === chapter.id ? { ...chapter, framework } : c) }, { ...st.elements, [element.id]: projection }, description, element.id);
      return;
    }
    editFramework(source.curriculum.chapterId, description, f => {
      f.blocks[source.id] = next;
      if (next.curriculum!.frameworkStage !== source.curriculum!.frameworkStage) {
        f.sections.forEach(s => { s.blockIds = s.blockIds.filter(id => id !== source.id); });
        const section = f.sections.find(s => s.stage === next.curriculum!.frameworkStage);
        if (section) section.blockIds.push(source.id);
        else f.sections.push({ id: crypto.randomUUID(), stage: next.curriculum!.frameworkStage, title: next.curriculum!.frameworkStage, blockIds: [source.id] });
      }
      return f;
    }, source.id);
  } else if (book && (next.curriculum?.type === "lesson-schema" || next.styleOverrides.referenceElement || source.styleOverrides.referenceElement)) {
    reflowStandaloneLessonSchema(book, element, next, description);
  } else {
    next.transform = { ...element.transform, height: 0 }; next.transform.height = buildPublicationScene(next).height;
    useEditorStore.getState().updateElement(element.id, { smartBlockData: next, transform: next.transform, presetId: next.presetId });
  }
}

/** Standalone maps and reference elements retain full content on every continuation. */
function reflowStandaloneLessonSchema(book: Book, element: PageElement, next: SmartBlockInstance, description: string) {
  const st = useEditorStore.getState(), rootId = element.smartBlockData?.curriculum?.sourceBlockId || element.id;
  const primary = st.elements[rootId] || element;
  const anchor = book.pages.find(p => p.id === primary.pageId);
  if (!anchor) return;
  const margins = frameMargins(book, pageFrameFor(book, anchor));
  const projections = Object.values(st.elements).filter(el => el.id === rootId || (el.smartBlockData?.curriculum?.sourceBlockId === rootId));
  const oldIds = new Set(projections.map(el => el.id));
  const elements = { ...st.elements };
  oldIds.forEach(id => delete elements[id]);
  const pages = book.pages.map(p => ({ ...p, elementIds: p.elementIds.filter(id => !oldIds.has(id)) }));
  const available = book.dimensions.heightPt - margins.topPt - margins.bottomPt;
  const bottom = book.dimensions.heightPt - margins.bottomPt;
  let firstY = Math.max(margins.topPt, primary.transform.y);
  const nextObjectY = Math.min(bottom, ...anchor.elementIds.filter(id => !oldIds.has(id)).map(id => st.elements[id]).filter(el => el && el.category !== "decorative" && el.transform.y >= firstY).map(el => el.transform.y - 12));
  const firstCapacity = nextObjectY - firstY;
  const canonical = { ...next, id: rootId, transform: { ...primary.transform, x: margins.insidePt, width: book.dimensions.widthPt - margins.insidePt - margins.outsidePt, height: 0 }, styleOverrides: { ...next.styleOverrides, sceneSlice: undefined } };
  const scene = buildPublicationScene(canonical);
  const firstPanel = scene.motifs?.find(m => m.role === "schema-panel");
  const freshFirst = firstCapacity < 64 || Boolean(firstPanel && firstPanel.h <= available && firstCapacity < firstPanel.h);
  if (freshFirst) firstY = margins.topPt;
  const windows = sceneWindows(scene, available, freshFirst ? available : firstCapacity);
  const oldContinuationPages = new Set(projections.filter(el => el.pageId !== anchor.id).map(el => el.pageId));
  const reusable = pages.filter(p => oldContinuationPages.has(p.id) && !p.elementIds.length);
  let insertion = pages.findIndex(p => p.id === anchor.id) + 1;
  windows.forEach((window, i) => {
    let page = i === 0 && !freshFirst ? pages.find(p => p.id === anchor.id)! : reusable.shift();
    if (!page) {
      page = { ...anchor, id: crypto.randomUUID(), elementIds: [], pageIndex: insertion, displayNumber: "", status: "Design" };
      pages.splice(insertion++, 0, page);
    } else if (i > 0 || freshFirst) insertion = pages.indexOf(page) + 1;
    const id = i ? `${rootId}::schema-${i}` : rootId;
    const transform = { ...canonical.transform, y: i ? margins.topPt : firstY, height: window.to - window.from };
    const block = { ...canonical, pageId: page.id, transform, curriculum: { ...canonical.curriculum!, sourceBlockId: rootId }, styleOverrides: { ...canonical.styleOverrides, sceneSlice: windows.length > 1 ? window : undefined } };
    elements[id] = { ...primary, id, pageId: page.id, transform, smartBlockData: block };
    page.elementIds.push(id);
  });
  const unusedPages = new Set(reusable.map(p => p.id));
  const finalPages = renumberPages(pages.filter(p => !unusedPages.has(p.id)));
  const chapterId = next.curriculum?.chapterId || anchor.chapterId;
  const chapters = book.chapters.map(ch => ch.id === chapterId ? { ...ch, pageIds: finalPages.filter(p => p.chapterId === chapterId).map(p => p.id) } : ch);
  commit({ ...book, pages: finalPages, chapters }, elements, description, rootId);
}
export const switchCurriculumLayout = (el: PageElement, layout: CurriculumLayout) => editCurriculumBlock(el, "Change curriculum layout", b => changeBlockLayout(b, layout));
export function reshuffleCurriculumBlock(el: PageElement) {
  const block = curriculumSource(el); if (!block) return;
  const variants = CURRICULUM_BLOCK_MAP[block.curriculum!.type].layouts;
  const current = variants.indexOf(block.styleOverrides.layoutVariant as CurriculumLayout);
  switchCurriculumLayout(el, variants[(current + 1) % variants.length]);
}
export const convertBlock = (el: PageElement, type: string) => editCurriculumBlock(el, "Convert curriculum block", b => convertCurriculumBlock(b, type));
export function moveFrameworkBlock(chapterId: string, blockId: string, sectionId: string, beforeId?: string) {
  editFramework(chapterId, "Reorder chapter structure", f => {
    const target = f.sections.find(s => s.id === sectionId), block = f.blocks[blockId]; if (!target || !block) return f;
    f.sections.forEach(s => { s.blockIds = s.blockIds.filter(id => id !== blockId); });
    target.blockIds.splice(beforeId ? Math.max(0, target.blockIds.indexOf(beforeId)) : target.blockIds.length, 0, blockId);
    block.curriculum!.frameworkStage = target.stage;
    return f;
  }, blockId);
}
export function removeFrameworkBlock(chapterId: string, blockId: string) {
  editFramework(chapterId, "Remove learning block", f => {
    delete f.blocks[blockId]; f.sections.forEach(s => { s.blockIds = s.blockIds.filter(id => id !== blockId); }); return f;
  });
}
/** Mixed canvas selections must remove canonical records as well as native objects. */
export function deleteCurriculumSelection(ids: string[]) {
  const st = useEditorStore.getState(); let book = st.getActiveBook(); if (!book) return;
  let elements = { ...st.elements };
  const removals = new Map<string, Set<string>>();
  const native = new Set<string>();
  ids.forEach(id => {
    const el = elements[id]; if (!el || el.locked) return;
    const meta = el.smartBlockData?.curriculum;
    if (meta?.chapterId) {
      if (!removals.has(meta.chapterId)) removals.set(meta.chapterId, new Set());
      removals.get(meta.chapterId)!.add(meta.sourceBlockId || id);
    } else { native.add(id); delete elements[id]; }
  });
  book = { ...book, pages: book.pages.map(p => native.size && p.elementIds.some(id => native.has(id)) ? { ...p, elementIds: p.elementIds.filter(id => !native.has(id)) } : p) };
  for (const [chapterId, blockIds] of removals) {
    const chapter = book.chapters.find(c => c.id === chapterId); if (!chapter?.framework) continue;
    const framework = structuredClone(chapter.framework);
    blockIds.forEach(id => delete framework.blocks[id]);
    framework.sections.forEach(s => { s.blockIds = s.blockIds.filter(id => !blockIds.has(id)); });
    const result = composeChapter(book, { ...chapter, framework }, elements);
    book = result.book; elements = result.elements;
  }
  commit(book, elements, "Delete learning selection");
}
export function duplicateCurriculumBlock(el: PageElement) {
  const source = curriculumSource(el); if (!source) return;
  if (!source.curriculum?.chapterId) { useEditorStore.getState().duplicateSelectedElements(); return; }
  duplicateCurriculumSelection([el.id]);
}
export function duplicateCurriculumSelection(ids: string[], offset = { dx: 16, dy: 16 }) {
  const st = useEditorStore.getState(); let book = st.getActiveBook(); if (!book) return;
  let elements = { ...st.elements };
  const frameworks = new Map<string, ChapterFramework>(), originals = new Set<string>(), newIds: string[] = [];
  ids.forEach(id => {
    const el = st.elements[id]; if (!el) return;
    const meta = el.smartBlockData?.curriculum;
    if (meta?.chapterId) {
      const source = curriculumSource(el); if (!source || originals.has(source.id)) return;
      const chapter = book!.chapters.find(c => c.id === meta.chapterId); if (!chapter?.framework) return;
      originals.add(source.id);
      const framework = frameworks.get(chapter.id) || structuredClone(chapter.framework);
      const copy = structuredClone(source); copy.id = crypto.randomUUID();
      copy.curriculum = { ...copy.curriculum!, sourceBlockId: undefined, locked: false, hidden: false };
      copy.styleOverrides.sceneSlice = undefined; copy.isDetached = false;
      framework.blocks[copy.id] = copy;
      const section = framework.sections.find(s => s.blockIds.includes(source.id));
      section?.blockIds.splice(section.blockIds.indexOf(source.id) + 1, 0, copy.id);
      frameworks.set(chapter.id, framework); newIds.push(copy.id);
    } else {
      const copy = structuredClone(el); copy.id = crypto.randomUUID();
      copy.transform = { ...copy.transform, x: copy.transform.x + offset.dx, y: copy.transform.y + offset.dy, zIndex: copy.transform.zIndex + 1 };
      if (copy.smartBlockData) copy.smartBlockData = { ...copy.smartBlockData, id: copy.id, transform: copy.transform };
      elements[copy.id] = copy; newIds.push(copy.id);
      book = { ...book!, pages: book!.pages.map(p => p.id === copy.pageId ? { ...p, elementIds: [...p.elementIds, copy.id] } : p) };
    }
  });
  for (const [chapterId, framework] of frameworks) {
    const chapter = book.chapters.find(c => c.id === chapterId)!;
    const result = composeChapter(book, { ...chapter, framework }, elements);
    book = result.book; elements = result.elements;
  }
  commit(book, elements, "Duplicate learning selection", newIds[0]);
}
export function setFrameworkMode(chapterId: string, mode: "easy" | "design") {
  const st = useEditorStore.getState(), book = st.getActiveBook(); if (!book) return;
  const chapter = book.chapters.find(c => c.id === chapterId); if (!chapter?.framework) return;
  const elements = { ...st.elements };
  for (const [id, el] of Object.entries(elements)) if (el.smartBlockData?.curriculum?.chapterId === chapterId) elements[id] = { ...el, smartBlockData: { ...el.smartBlockData, isLockedDesign: mode === "easy" } };
  commit({ ...book, chapters: book.chapters.map(c => c.id === chapterId ? { ...c, framework: { ...c.framework!, mode } } : c) }, elements, `Switch to ${mode} mode`);
}
/** One undoable reflow updates canonical blocks and every continuation page. */
export function applyChapterReferenceElements(chapterId: string) {
  const st = useEditorStore.getState(), book = st.getActiveBook(), chapter = book?.chapters.find(ch=>ch.id===chapterId);
  if (!book || !chapter) return;
  if (chapter.framework) {
    editFramework(chapterId, "Apply reference elements to every chapter page", framework => {
      framework.config.referenceElements = true;
      for (const [id, block] of Object.entries(framework.blocks)) {
        const projections = Object.values(st.elements).filter(el=>el.id===id || el.smartBlockData?.curriculum?.sourceBlockId===id);
        if (!block.isLockedContent && !block.curriculum?.locked && !projections.some(el=>el.locked)) framework.blocks[id] = withReferenceElements(block);
      }
      return framework;
    });
  } else {
    const pageIds = new Set([...chapter.pageIds,...book.pages.filter(p=>p.chapterId===chapterId).map(p=>p.id)]);
    const elements = {...st.elements}, pages = book.pages.map(page=>({...page,elementIds:[...page.elementIds]}));
    const processedRoots = new Set<string>();
    for (const el of Object.values(st.elements)) {
      if (!pageIds.has(el.pageId) || !el.smartBlockData || el.locked || el.smartBlockData.isLockedContent) continue;
      const rootId = el.smartBlockData.curriculum?.sourceBlockId || el.smartBlockData.id;
      if (processedRoots.has(rootId)) continue;
      processedRoots.add(rootId);
      const projections = Object.values(st.elements).filter(item=>item.id===rootId || item.smartBlockData?.id===rootId || item.smartBlockData?.curriculum?.sourceBlockId===rootId);
      if (projections.some(item=>item.locked || item.smartBlockData?.isLockedContent)) continue;
      const block = withReferenceElements({...el.smartBlockData,transform:el.transform});
      if (!block.styleOverrides.referenceElement) continue;
      const projectionIds = new Set(projections.map(item=>item.id));
      for(const p of pages)p.elementIds=p.elementIds.filter(id=>id===el.id || !projectionIds.has(id));
      projections.filter(item=>item.id!==el.id).forEach(item=>delete elements[item.id]);
      const page = pages.find(p=>p.id===el.pageId)!;
      const margins = frameMargins(book,pageFrameFor(book,page));
      const available = book.dimensions.heightPt-margins.topPt-margins.bottomPt;
      const bottom = book.dimensions.heightPt-margins.bottomPt;
      const scene = buildPublicationScene({...block,styleOverrides:{...block.styleOverrides,sceneSlice:undefined}});
      const obstacles = page.elementIds.filter(id=>id!==el.id).map(id=>elements[id]).filter(item=>item && !item.hidden && item.category!=="decorative");
      const fits = el.transform.y>=margins.topPt && el.transform.y+scene.height<=bottom && !obstacles.some(item=>el.transform.x<item.transform.x+item.transform.width && el.transform.x+el.transform.width>item.transform.x && el.transform.y<item.transform.y+item.transform.height+12 && el.transform.y+scene.height+12>item.transform.y);
      if (fits) {
        elements[el.id] = {...el,smartBlockData:{...block,styleOverrides:{...block.styleOverrides,sceneSlice:undefined},transform:{...el.transform,height:scene.height}},transform:{...el.transform,height:scene.height}};
        continue;
      }
      page.elementIds=page.elementIds.filter(id=>id!==el.id);
      delete elements[el.id];
      let insertion = pages.findIndex(p=>p.id===page.id)+1;
      sceneWindows(scene,available).forEach((window,i)=>{
        const newPage = {...page,id:crypto.randomUUID(),chapterId,elementIds:[] as string[],pageIndex:insertion,displayNumber:""};
        pages.splice(insertion++,0,newPage);
        const id = i ? `${el.id}::reference-${i}` : el.id;
        const transform = {...el.transform,y:margins.topPt,height:window.to-window.from};
        const smartBlockData = {...block,id:el.id,pageId:newPage.id,transform,curriculum:block.curriculum?{...block.curriculum,sourceBlockId:el.id}:undefined,styleOverrides:{...block.styleOverrides,sceneSlice:scene.height>available?window:undefined}};
        elements[id]={...el,id,pageId:newPage.id,transform,smartBlockData};
        newPage.elementIds.push(id);
      });
    }
    commit({...book,pages,chapters:book.chapters.map(ch=>ch.id===chapterId?{...ch,referenceElements:true,pageIds:pages.filter(p=>p.chapterId===chapterId || pageIds.has(p.id)).map(p=>p.id)}:ch)},elements,"Apply reference elements to every chapter page",st.selectedElementIds[0]);
  }
  useUiStore.getState().showToast({type:"success",title:"Chapter elements updated",message:chapter.framework ? "All chapter pages reflowed. New elements inherit the style. Undo restores the previous chapter." : "Editable blocks updated across the chapter. Extra pages preserve writing space and existing objects. Undo restores the previous design."});
}

export function addFrameworkSection(chapterId: string, stage: FrameworkStage) {
  editFramework(chapterId, "Add framework section", f => { f.sections.push({ id: crypto.randomUUID(), stage, title: stageName(stage), blockIds: [] }); return f; });
}

export function unlockCurriculumLayers(el: PageElement) {
  const source = curriculumSource(el), st = useEditorStore.getState(), book = st.getActiveBook();
  if (!source || !book || el.locked) return;
  const chapter = book.chapters.find(c => c.id === source.curriculum?.chapterId);
  if (!chapter?.framework) {
    const rootId = source.curriculum?.sourceBlockId || source.id;
    const projections = Object.values(st.elements).filter(item => item.id === rootId || item.smartBlockData?.curriculum?.sourceBlockId === rootId);
    const elements = { ...st.elements }, replacements: Record<string,string[]> = {};
    for (const item of projections) {
      const children = detachPublicationScene({ ...item.smartBlockData!, pageId: item.pageId, transform: item.transform }, item.transform.zIndex);
      delete elements[item.id];
      children.forEach(child => { elements[child.id] = child; });
      replacements[item.id] = children.map(child=>child.id);
    }
    commit({ ...book, pages: book.pages.map(page => ({ ...page, elementIds: page.elementIds.flatMap(id => replacements[id] || [id]) })) }, elements, "Unlock element into editable vector layers", Object.values(replacements)[0]?.[0]);
    return;
  }
  if (chapter.framework?.mode !== "design") {
    setFrameworkMode(chapter.id, "design");
  }
  const elements = { ...useEditorStore.getState().elements }, replacements: Record<string, string[]> = {};
  const projections = Object.values(elements).filter(e => e.smartBlockData?.curriculum?.sourceBlockId === source.id || e.id === source.id);
  for (const projection of projections) {
    const children = detachPublicationScene({ ...projection.smartBlockData!, transform: projection.transform }, projection.transform.zIndex);
    children.forEach(child => { child.content = { ...child.content, curriculumBlockId: source.id, curriculumChapterId: chapter.id }; elements[child.id] = child; });
    replacements[projection.id] = children.map(c => c.id); delete elements[projection.id];
  }
  const next = { ...book, pages: book.pages.map(p => p.chapterId === chapter.id ? { ...p, elementIds: p.elementIds.flatMap(id => replacements[id] || [id]) } : p),
    chapters: book.chapters.map(c => c.id === chapter.id ? { ...c, framework: { ...c.framework!, blocks: { ...c.framework!.blocks, [source.id]: { ...source, isDetached: true } } } } : c) };
  commit(next, elements, "Unlock curriculum artwork into independent layers", Object.values(replacements)[0]?.[0]);
  useUiStore.getState().showToast({ type: "success", title: "Independent layers ready", message: "Each text line, image and shape is now editable. These custom layers keep their page during chapter reflow." });
}

export function splitCurriculumBlock(el: PageElement) {
  const source = curriculumSource(el); if (!source?.curriculum?.chapterId) return;
  const first = structuredClone(source), second = structuredClone(source), c = first.semanticContent;
  second.id = crypto.randomUUID();
  second.semanticContent = { title: `${c.title} · continued`, unitBadge: c.unitBadge };
  const field = (["questions", "steps", "items"] as const).find(key => (c[key]?.length || 0) > 1);
  if (field) {
    const values = c[field]!, cut = Math.ceil(values.length / 2);
    Object.assign(first.semanticContent, { [field]: values.slice(0, cut) });
    Object.assign(second.semanticContent, { [field]: values.slice(cut) });
  } else {
    const textField = [...(["introText", "passage", "calloutText"] as const)].sort((a,b) => (c[b]?.length || 0) - (c[a]?.length || 0))[0];
    const text = c[textField] || "";
    if (text.length < 40) { useUiStore.getState().showToast({ type: "info", title: "This block is already compact", message: "Add more text or questions before splitting it." }); return; }
    let cut = text.indexOf(" ", Math.floor(text.length / 2)); if (cut < 0) cut = Math.floor(text.length / 2);
    first.semanticContent[textField] = text.slice(0, cut); second.semanticContent[textField] = text.slice(cut);
  }
  second.curriculum = { ...second.curriculum!, sourceBlockId: undefined, pageRules: { ...second.curriculum!.pageRules, continuationOf: source.id, startOnNewPage: true } };
  editFramework(source.curriculum.chapterId, "Split learning block", f => {
    f.blocks[first.id] = first; f.blocks[second.id] = second;
    const section = f.sections.find(s => s.blockIds.includes(source.id)); section?.blockIds.splice(section.blockIds.indexOf(source.id)+1,0,second.id); return f;
  }, first.id);
}

export function createUniversal5PageChapter(options: {
  subject?: string;
  grade?: CurriculumGrade;
  preset?: UniversalLayoutPreset;
  title?: string;
}): { chapter: Chapter; pages: PageDefinition[]; elements: PageElement[] } {
  const st = useEditorStore.getState(), book = st.getActiveBook();
  if (!book) throw new Error("Open a book first.");
  const subject = options.subject || book.subject || "Mathematics";
  const grade = options.grade || (['NURSERY','LKG','UKG'].includes(book.grade.toUpperCase()) ? book.grade.toUpperCase() as CurriculumGrade : 4);
  const presetKey: UniversalLayoutPreset = options.preset || "editorial";
  const f = getSubjectFixture(subject);
  const chapterTitle = options.title || f.chapter || "Number Universe";

  const chapterId = crypto.randomUUID();
  const unit = book.units[0] || { id: crypto.randomUUID(), number: 1, title: "Universal Curriculum", chapterIds: [] };

  const archetypePages = generateUniversal5Pages(subject);
  const createdPages: PageDefinition[] = [];
  const createdElements: Record<string, PageElement> = { ...st.elements };

  const dummyPage = { id: "temp", bookId: book.id, chapterId, pageIndex: book.pages.length, displayNumber: "1", elementIds: [], status: "Draft" } as PageDefinition;
  const margins = pageMarginsFor(book, dummyPage);
  const pageWidth = book.dimensions.widthPt;
  const contentWidth = Math.floor((pageWidth - margins.insidePt - margins.outsidePt) * 10) / 10;
  const safeBottom = Math.floor((book.dimensions.heightPt - margins.bottomPt) * 10) / 10;

  const domain = (
    /math/i.test(subject) ? "mathematics" :
    /science/i.test(subject) ? "science" :
    /english/i.test(subject) ? "english" :
    /social|history|geography/i.test(subject) ? "social-studies" :
    /evs|environment/i.test(subject) ? "environmental" :
    /computer|coding/i.test(subject) ? "computer-science" :
    /nursery|lkg|ukg/i.test(String(grade)) ? "early-learning" : "general"
  );

  archetypePages.forEach((ap, pIdx) => {
    let pageId = crypto.randomUUID();
    let pageElementIds: string[] = [];
    const finishPage = () => {
      if (!pageElementIds.length) return;
      const pageIndex = book.pages.length + createdPages.length;
      createdPages.push({ id: pageId, bookId: book.id, chapterId, pageIndex, displayNumber: String(pageIndex + 1), elementIds: pageElementIds, status: "Draft" } as PageDefinition);
    };
    let currentY = margins.topPt;

    ap.blocks.forEach((blk, bIdx) => {
      const elementId = crypto.randomUUID();
      const uType = normalizeUniversalType(blk.type);
      const meta = UNIVERSAL_BLOCK_MAP[uType] || UNIVERSAL_BLOCK_MAP["section-heading"];
      const blockHeight = uType === "chapter-hero" ? 220 : uType === "concept-comparison" || uType === "smart-table" || uType === "activity-lab" ? 170 : 120;

      const smartBlock: SmartBlockInstance = {
        id: elementId,
        pageId,
        presetId: `universal-${uType}`,
        archetypeId: (uType === "worked-example" ? "worked-examples" : uType) as EducationalBlockCategory,
        family: "nex-editorial",
        subject: domain,
        gradeBand: typeof grade === "number" && grade >= 9 ? "secondary-plus" : typeof grade === "number" && grade >= 6 ? "middle-school" : "primary-upper",
        isDetached: false,
        isLockedContent: false,
        isLockedDesign: false,
        transform: {
          x: margins.insidePt,
          y: currentY,
          width: contentWidth,
          height: blockHeight,
          rotation: 0,
          zIndex: bIdx + 1,
        },
        semanticContent: {
          title: uType === "chapter-hero" ? chapterTitle : blk.title || meta.defaultTitle,
          subtitle: blk.body || meta.defaultBody,
          unitBadge: `NEX MAXX · ${subject.toUpperCase()}`,
          chapterNumber: String(book.chapters.length + 1).padStart(2, "0"),
          items: uType !== "lesson-schema" && blk.body.includes("|") ? blk.body.split("|") : undefined,
          ...(uType === "lesson-schema" ? { subtitle: "", introText: "", calloutText: chapterTitle, lessonSchemaTopics: blk.body.split("|").map((label, i) => createSchemaTopic(label, i, subject)) } : {}),
          introText: uType === "lesson-schema" ? "" : blk.body,
        },
        styleOverrides: {
          blockStyle: uType === "lesson-schema" ? "colourful" : presetKey,
          layoutVariant: uType,
          customPalette: uType === "lesson-schema" ? undefined : {
            primary: NEX_MAXX_PRESETS[presetKey]?.accent || NEX_MAXX_BRAND.maroon,
            accent: NEX_MAXX_BRAND.maroonSecondary,
            surface: NEX_MAXX_PRESETS[presetKey]?.wash || NEX_MAXX_BRAND.washMaroon,
            text: NEX_MAXX_BRAND.ink,
            border: NEX_MAXX_BRAND.border,
          },
        },
        curriculum: {
          type: uType,
          frameworkStage: pIdx === 0 ? "discover" : pIdx === 1 ? "learn" : pIdx === 2 ? "build" : pIdx === 3 ? "apply" : "master",
          grade,
          subjectLabel: subject,
          chapterId,
          sourceBlockId: elementId,
          learningOutcomeIds: [],
          difficulty: "start",
          hierarchy: "primary",
          pageRules: { keepTogether: true },
        },
      };

      let calculatedHeight = blockHeight;
      try {
        const sceneH = Math.ceil(buildPublicationScene(smartBlock).height);
        if (Number.isFinite(sceneH) && sceneH > 0) calculatedHeight = Math.max(calculatedHeight, sceneH);
      } catch (_) {}
      if (uType === "chapter-hero") calculatedHeight = Math.max(calculatedHeight, 220);
      else if (uType === "learning-outcomes") calculatedHeight = Math.max(calculatedHeight, 270);
      else if (uType === "lesson-schema") calculatedHeight = Math.max(calculatedHeight, 280);

      // Single block cannot exceed safe height on an empty page
      calculatedHeight = Math.min(calculatedHeight, safeBottom - margins.topPt);
      smartBlock.transform.height = calculatedHeight;

      if (pageElementIds.length && currentY + smartBlock.transform.height > safeBottom) {
        finishPage(); pageId = crypto.randomUUID(); pageElementIds = []; currentY = margins.topPt;
      }
      smartBlock.pageId = pageId;
      smartBlock.transform.y = currentY;
      const element: PageElement = {
        id: elementId,
        pageId,
        type: "smart-block",
        category: "educational",
        version: 4,
        displayName: meta.name,
        transform: smartBlock.transform,
        content: {},
        style: {},
        smartBlockData: smartBlock,
        presetId: smartBlock.presetId,
        locked: false,
        hidden: false,
      };

      createdElements[elementId] = element;
      pageElementIds.push(elementId);
      currentY += smartBlock.transform.height + 14;
    });

    finishPage();
  });

  const newChapter: Chapter = {
    id: chapterId,
    unitId: unit.id,
    number: book.chapters.length + 1,
    title: chapterTitle,
    subtitle: f.subtitle,
    learningObjectives: [...f.objective],
    pageIds: createdPages.map(p => p.id),
  };

  const updatedBook: Book = {
    ...book,
    chapters: [...book.chapters, newChapter],
    pages: [...book.pages, ...createdPages],
  };

  commit(updatedBook, createdElements, `Insert Universal Chapter · ${chapterTitle}`, createdPages[0]?.elementIds[0]);
  useUiStore.getState().setLeftPanelTab("structure");
  useUiStore.getState().showToast({
    type: "success",
    title: `Universal Chapter Created · ${createdPages.length} Pages`,
    message: `Five chapter sections are ready and editable. Content uses ${createdPages.length} pages to keep every block inside the margins.`,
  });

  return {
    chapter: newChapter,
    pages: createdPages,
    elements: createdPages.flatMap(p => p.elementIds.map((id: string) => createdElements[id])),
  };
}
