import type { Chapter, Book } from "../../domain/book/types";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { PageElement } from "../../domain/element/types";
import type { ChapterBuilderConfig, ChapterFramework, CurriculumLayout, FrameworkStage, CurriculumGrade } from "../../domain/educational/curriculum";
import { useEditorStore } from "../stores/editorStore";
import { useHistoryStore } from "../stores/historyStore";
import { useUiStore } from "../stores/uiStore";
import { composeChapter, generateFramework, makeCurriculumBlock, changeBlockLayout, convertCurriculumBlock, DEFAULT_CHAPTER_CONFIG } from "./chapterEngine";
import { CURRICULUM_BLOCK_MAP } from "./catalog";
import { buildPublicationScene } from "../educational/publicationScene";
import { detachPublicationScene } from "../educational/detachScene";
import { simpleChapterPlan, simpleStage, stageName } from "./frameworkPlan";

function commit(book: Book, elements: Record<string, PageElement>, description: string, focusId?: string) {
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
    if (layout) block.styleOverrides.layoutVariant = layout;
    editFramework(chapter.id, `Insert ${CURRICULUM_BLOCK_MAP[type].name}`, f => {
      f.blocks[block.id] = block;
      const section = f.sections.find(s => s.stage === block.curriculum!.frameworkStage);
      if (section) section.blockIds.push(block.id);
      else f.sections.push({ id: crypto.randomUUID(), title: stageName(block.curriculum!.frameworkStage), stage: block.curriculum!.frameworkStage, blockIds: [block.id] });
      return f;
    }, block.id);
    const placed = CURRICULUM_BLOCK_MAP[type];
    useUiStore.getState().showToast({ type: "success", title: `${placed.name} added`, message: `It is in the ${stageName(placed.stage)} section. Edit the words in the inspector.` });
  } else {
    const st = useEditorStore.getState(), book = st.getActiveBook();
    let page = st.getActivePage();
    if (!page || !book) return;
    const block = makeCurriculumBlock(type, { ...DEFAULT_CHAPTER_CONFIG, subject: subject || book.subject, grade: grade || (['NURSERY','LKG','UKG'].includes(book.grade.toUpperCase()) ? book.grade.toUpperCase() as CurriculumGrade : (parseInt(book.grade.slice(-1)) >= 1 && parseInt(book.grade.slice(-1)) <= 5 ? parseInt(book.grade.slice(-1)) as 1|2|3|4|5 : 3)) });
    if (template) { block.semanticContent = structuredClone(template.semanticContent); block.styleOverrides = { ...structuredClone(template.styleOverrides), sceneSlice: undefined }; }
    if (layout) block.styleOverrides.layoutVariant = layout;
    const occupied = page.elementIds.map(id => st.elements[id]).filter(el => el && !el.hidden && el.category !== "decorative");
    const nextY = Math.max(book.margins.topPt, ...occupied.map(el => el.transform.y + el.transform.height + 18));
    block.transform = { ...block.transform, x: book.margins.insidePt, y: nextY, width: book.dimensions.widthPt - book.margins.insidePt - book.margins.outsidePt, height: 0 };
    block.transform.height = buildPublicationScene(block).height;
    if (nextY + block.transform.height > book.dimensions.heightPt - book.margins.bottomPt && occupied.length) {
      st.addPage(st.activePageIndex); page = useEditorStore.getState().getActivePage()!;
      block.transform.y = book.margins.topPt;
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
  if (source.curriculum?.chapterId) {
    const st = useEditorStore.getState(), book = st.getActiveBook()!, chapter = book.chapters.find(c => c.id === source.curriculum!.chapterId);
    // Free-design edits keep the author's pose. Structural edits and continuations still recompose.
    const sameStage = next.curriculum!.frameworkStage === source.curriculum.frameworkStage;
    const samePageRules = JSON.stringify(next.curriculum!.pageRules) === JSON.stringify(source.curriculum.pageRules);
    const projections = Object.values(st.elements).filter(el => el.smartBlockData?.curriculum?.sourceBlockId === source.id || el.id === source.id);
    next.styleOverrides.sceneSlice = undefined;
    const height = buildPublicationScene({ ...next, transform: { ...element.transform, height: 0 } }).height;
    if (chapter?.framework?.mode === "design" && sameStage && samePageRules && projections.length === 1 && element.transform.y + height <= book.dimensions.heightPt - book.margins.bottomPt) {
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
  } else {
    next.transform = { ...element.transform, height: 0 }; next.transform.height = buildPublicationScene(next).height;
    useEditorStore.getState().updateElement(element.id, { smartBlockData: next, transform: next.transform, presetId: next.presetId });
  }
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
export function addFrameworkSection(chapterId: string, stage: FrameworkStage) {
  editFramework(chapterId, "Add framework section", f => { f.sections.push({ id: crypto.randomUUID(), stage, title: stageName(stage), blockIds: [] }); return f; });
}

export function unlockCurriculumLayers(el: PageElement) {
  const source = curriculumSource(el), st = useEditorStore.getState(), book = st.getActiveBook();
  if (!source || !book || el.locked) return;
  const chapter = book.chapters.find(c => c.id === source.curriculum?.chapterId);
  if (chapter?.framework?.mode !== "design") return;
  const elements = { ...st.elements }, replacements: Record<string, string[]> = {};
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
