import { duplicateEducationalBlock } from '../educational/library/actions';
import { refreshPublishingLayout } from '../educational/library/refreshLayout';
import { cloneElementTree, elementTree, selectionRoot, isElementLocked, transformGroupChildren } from "../core/elementGroups";
import { withBlockTransform, type BlockResizeMode } from "../core/blockResize";
import { repaginateFromPage } from "../core/paginationEngine";
import { solveElementConstraint } from "../core/snapping";
import { synchronizeBookStructure } from "../structure/bookStructureEngine";
import { renumberBookPages, renumberPages } from "../core/pageNumbering";
import { frameMargins, pageFrameFor, pageMarginsFor } from "../pageFrame/pageFrame";
import {queueCentralBook} from './cloudBookStore';
import { composePage } from "../core/pageComposition";
import { schedulePersistence } from "../core/debouncedPersistence";
import { detachedSceneForElement } from "../educational/detachScene";
import { arrangeElements, type ArrangeMode } from "../core/arrangement";
import { buildPublicationScene, ArtworkKind } from "../educational/publicationScene";
import { makePublicationDemo, makePublicationPages } from "../educational/publicationPages";
import { create } from "zustand";
import { Book, PageDefinition, Chapter, Unit, TextStyleDefinition, BookComment } from "../../domain/book/types";
import { PageElement, ElementTransform, ElementStyle, ElementContent, DesignBorder, DesignColorTokens, DesignDecoration, DesignSpacing } from "../../domain/element/types";
import { CustomLayoutDefinition, CustomLayoutCategory, CustomLayoutPlaceholder } from "../../domain/layout/customLayoutTypes";
import {
  CurveNode,
  AdjustmentType,
  LiveFilterType,
  AIGenerationMetadata,
} from "../../domain/creative/types";
import { shapeToCurveNodes, curveNodesToSvgPath, applyCornerFillet, combineShapesBoolean } from "../vector/bezier";
import { traceImageToVector, ImageTraceOptions } from "../vector/imageTrace";
import { generateBackgroundRemovalMask } from "../pixel/selectionEngine";
import { EducationalAIProvider } from "../ai/aiProvider";
import { createDefaultDemoBook } from "../seed/demoBook";
import { integrateFirstPageLogo } from '../branding/bookBranding';
import { integrateBookPageBorder } from '../pageFrame/bookBorder';
import { ELEMENT_PRESETS, PAGE_PRESETS_MAP, COMPREHENSIVE_PRESET_LIBRARY, PagePresetDefinition } from "../registry/presets";
import { PageTemplate, PAGE_TEMPLATES } from "../registry/templates";
import {
  estimateTextHeight,
  solvePageReflow,
  adaptPageToDimensions,
  solveSmartStack,
  autoArrangePage,
  switchPageLayout,
  detectPageOverflow,
} from "../core/layoutSolver";
import { SUBJECT_THEMES } from "../../domain/theme/types";
import { STANDARD_PAGE_SIZES, PageSizePreset } from "../../domain/book/types";
import { applyDesignToElement, mergePresetContent, DesignApplyOptions } from "../design/applyDesign";
import { tokensFromTheme } from "../design/tokens";
import { useHistoryStore } from "./historyStore";
import { useUiStore, ShapeSubtype } from "./uiStore";
import {
  EDUCATIONAL_BLOCK_REGISTRY,
  createSmartBlockInstance,
  getPresetsByArchetype,
} from "../educational/blockRegistry";
import {
  reSkinBlockSubject,
  detachSmartBlockToElements,
} from "../educational/smartBlockSolver";
import { SubjectDomain, SmartBlockInstance, GradeBand } from "../../domain/educational/blockSchema";
import { recordEducationalPreset, resolveBookGrade, resolveBookSubject } from "../educational/library/preferences";
import { withSubjectExample } from "../educational/subjectExamples";
import { cloudChapterRepository, defaultChapterRepository, type ChapterRepository, type ChapterSaveTarget, type CloudChapterRepository } from "../persistence/chapterRepository";
import { getMathTemplate } from "../math/mathRegistry";
import {recoverActiveCentralBook,rememberCentralBook} from "../persistence/centralBookRecovery";
import {restoreChapter,type BookSnapshotDocument} from "../persistence/bookSnapshots";
import { restoreSemanticFramework, toSemanticDocument } from "../persistence/semanticDocument";
import { documentSignature } from "../persistence/cloudSaveController";
import { acceptCloudChapter, connectNewCloudChapter, getCloudChapterController, queueLinkedChapters } from "./cloudChapterStore";
import { composeChapter } from "../curriculum/chapterEngine";
import { editCurriculumBlock, editFramework, deleteCurriculumSelection, duplicateCurriculumSelection, reshuffleCurriculumBlock, unlockCurriculumLayers, curriculumSource, insertCurriculumBlock, convertBlock } from "../curriculum/actions";
import { localDb, type StorageProjectPayload } from "../persistence/indexedDbStorage";

const STORAGE_KEY = "nex_maxx_book_studio_data_v1";

interface EditorState {
  books: Book[];
  activeBookId: string;
  activePageIndex: number;
  elements: Record<string, PageElement>;
  selectedElementIds: string[];
  clipboardElements: PageElement[];

  // Book Lifecycle
  getActiveBook: () => Book | undefined;
  getActivePage: () => PageDefinition | undefined;
  getActivePageElements: () => PageElement[];
  selectBook: (id: string) => void;
  createBook: (bookData: Partial<Book>) => Book;
  updateActiveBook: (updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;

  // Page Operations
  setActivePageIndex: (index: number) => void;
  addPage: (afterIndex?: number, templateId?: string) => void;
  duplicatePage: (index: number) => void;
  deletePage: (index: number) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  applyTemplateToActivePage: (template: PageTemplate) => void;
  updatePageStatus: (pageId: string, status: Book["status"]) => void;

  // Curriculum Organization
  addUnit: (title: string, description?: string) => void;
  addChapter: (unitId: string, title: string, learningObjectives?: string[]) => void;

  // Element Operations
  selectElement: (id: string, multiSelect?: boolean) => void;
  setSelectedElementIds: (ids: string[]) => void;
  clearSelection: () => void;
  selectAllOnActivePage: () => void;
  addElement: (presetId: string, initialX?: number, initialY?: number) => PageElement | null;
  addVectorShape: (
    shapeType: ShapeSubtype,
    initialX?: number,
    initialY?: number,
    initialWidth?: number,
    initialHeight?: number
  ) => PageElement | null;
  addTextFrame: (initialX?: number, initialY?: number, width?: number, height?: number) => PageElement | null;
  addTableElement: (rows?: number, cols?: number, initialX?: number, initialY?: number) => PageElement | null;
  updateTableCell: (elementId: string, rowIndex: number, colIndex: number, text: string) => void;
  updateTableStructure: (elementId: string, action: "addRow" | "deleteRow" | "addCol" | "deleteCol") => void;
  performBooleanOperation: (op: "union" | "subtract" | "intersect") => void;

  // Vector Studio Engine
  addVectorCurve: (nodes: CurveNode[], closed?: boolean, initialX?: number, initialY?: number) => PageElement | null;
  updateCurveNode: (elementId: string, nodeId: string, updates: Partial<CurveNode>) => void;
  convertToCurves: (elementId: string) => void;
  applyCornerFilletToNode: (elementId: string, nodeId: string, radiusPt: number, cornerType?: "rounded" | "chamfer" | "concave") => void;
  traceElementImage: (elementId: string, options?: ImageTraceOptions) => Promise<PageElement | null>;

  // Pixel Studio Engine
  addPixelLayer: (initialX?: number, initialY?: number, width?: number, height?: number) => PageElement | null;
  addAdjustmentLayer: (type: AdjustmentType, params?: Record<string, unknown>) => PageElement | null;
  addLiveFilter: (type: LiveFilterType, radiusPt?: number, amount?: number) => PageElement | null;
  removeImageBackground: (elementId: string) => Promise<void>;

  // AI Studio Creative Pipeline
  addAIGeneratedElement: (data: {
    imageUrl?: string;
    svgContent?: string;
    isVector: boolean;
    metadata: AIGenerationMetadata;
    targetFrameId?: string;
  }) => PageElement | null;
  expandImageToFrame: (elementId: string) => Promise<void>;
  upscaleImage: (elementId: string, factor: 2 | 4) => Promise<void>;

  updateElement: (id: string, updates: Partial<PageElement>) => void;
  updateElementTransform: (id: string, transform: Partial<ElementTransform>, recordHistory?: boolean, resizeMode?: BlockResizeMode) => void;
  updateElementStyle: (id: string, style: Partial<ElementStyle>) => void;
  updateElementContent: (id: string, content: ElementContent) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  toggleLockElement: (id: string) => void;

  // Typography Styles System
  applyTextStyle: (elementId: string, styleId: string) => void;
  createTextStyleFromElement: (elementId: string, name: string) => void;
  updateTextStyle: (styleId: string, updates: Partial<TextStyleDefinition>) => void;

  // Comments & Review System
  addComment: (
    pageId: string,
    elementId: string | undefined,
    text: string,
    author?: string,
    role?: "Author" | "Editor" | "Designer" | "Reviewer"
  ) => void;
  resolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;

  // Manuscript Import & Data Merge
  importManuscript: (markdownText: string) => { unitsAdded: number; chaptersAdded: number; pagesAdded: number };
  generateDataMergePages: (records: Record<string, string>[]) => number;

  // Ordering & Alignment
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  alignSelectedElements: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  arrangeSelection: (mode: ArrangeMode, relative: "selection" | "page", gap?: number, columns?: number) => void;
  distributeSelectedElements: (direction: "horizontal" | "vertical") => void;

  // Clipboard
  copySelection: () => void;
  pasteSelection: () => void;

  // Adaptive Layout Engine (Directives 9-21, 106, 146)
  createAdaptiveGroup: (
    elementIds: string[],
    direction?: "vertical" | "horizontal" | "grid",
    spacingPt?: number
  ) => PageElement | null;
  groupSelectedElements: (direction?: "vertical" | "horizontal" | "grid") => void;
  groupAndLockSelectedElements: () => void;
  ungroupSelectedElements: () => void;
  smartStack: (elementIds?: string[], direction?: "vertical" | "horizontal" | "grid") => void;
  setElementLayoutMode: (elementId: string, mode: "freeform" | "adaptive") => void;
  autoArrangeActivePage: (style?: "balanced" | "visual" | "reading" | "compact" | "playful") => void;
  tryAnotherLayout: (variantIndex?: number) => void;
  shuffleCompatibleLayout: () => void;
  applyPagePreset: (presetId: string, preserveContent?: boolean) => void;
  adaptPageSize: (newPageSize: PageSizePreset, adaptationMode?: "adapt" | "scale" | "keep") => void;
  applyThemeToBook: (themeId: string) => void;
  applyFontPairingToBook: (pairingId: string) => void;
  applyDesignSystem: (options: {
    scope: "selection" | "page" | "chapter" | "book";
    familyId?: string;
    paletteId?: string;
    tokens?: DesignColorTokens;
    decoration?: DesignDecoration;
    spacing?: DesignSpacing;
    border?: DesignBorder;
    showNumber?: boolean;
    grayscale?: boolean;
    replaceOverrides?: boolean;
  }) => void;
  replaceElementPreset: (elementId: string, presetId: string) => void;
  duplicateSelectedElementsWithOffset: (offset?: { dx: number; dy: number }) => void;
  savePageAsPreset: (name: string, category: string, tags?: string[]) => PagePresetDefinition | null;
  reflowActivePageElement: (elementId: string, newHeightPt: number) => void;
  evaluateActivePageOverflow: () => void;
  flowPageOverflowToNextPage: (targetPageId?: string) => void;

  publicationPresets: Record<string, { name: string; category?: string; block: SmartBlockInstance }>;
  savePublicationPreset: (name: string, elementId: string, category?: string) => void;
  insertPublicationPreset: (id: string) => void;
  insertPublicationElement: (element: PageElement) => void;
  insertElement: (element: PageElement) => void;

  // Custom Layouts (Phase 4)
  userCustomLayouts: Record<string, CustomLayoutDefinition>;
  createCustomLayoutFromSelection: (
    name: string,
    category?: CustomLayoutCategory,
    description?: string,
    placeholders?: CustomLayoutPlaceholder[]
  ) => CustomLayoutDefinition | null;
  insertCustomLayout: (layoutId: string, targetX?: number, targetY?: number) => string[];
  deleteCustomLayout: (layoutId: string) => void;

  commitTransformGesture: (before: PageElement[]) => void;
  fitRenderedBlockHeight: (id: string, height: number) => void;
  addPublicationPages: (templateId: string) => void;
  createPublicationDemo: () => void;
  addPublicationArtwork: (kind: ArtworkKind, x?: number, y?: number) => void;
  // Educational Smart Block System
  addMathElement: (templateId: string, initialX?: number, initialY?: number, customData?: Record<string, unknown>, styleVariant?: string) => PageElement | null;
  addEducationalBlock: (blockId: string, initialX?: number, initialY?: number, options?: { subject?: string; grade?: string }) => PageElement | null;
  shuffleEducationalBlockStyle: (elementId: string) => void;
  setEducationalBlockPreset: (elementId: string, presetId: string) => void;
  reSkinEducationalBlock: (elementId: string, subject: SubjectDomain) => void;
  updateSmartBlockContent: (elementId: string, partialContent: Partial<SmartBlockInstance["semanticContent"]>) => void;
  updateSmartBlockStyle: (elementId: string, partialStyle: Partial<SmartBlockInstance["styleOverrides"]>) => void;
  updateBlockContentLayout: (elementId: string, layout: NonNullable<SmartBlockInstance["styleOverrides"]["contentLayout"]>) => void;
  setBlockMotifs: (elementId: string, motifs: NonNullable<SmartBlockInstance["styleOverrides"]["motifs"]>) => void;
  commitBlockMotifs: (elementId: string, before: PageElement) => void;
  detachEducationalBlock: (elementId: string) => string[];

  // Persistence & Recovery
  saveToStorage: () => void;
  loadFromStorage: () => Promise<boolean>;
  saveChapterDocument: (chapterId: string, target: ChapterSaveTarget, repository?: ChapterRepository) => Promise<{ revision: number; checksum: string }>;
  loadChapterDocument: (chapterId: string, target: ChapterSaveTarget, repository?: ChapterRepository) => Promise<void>;
  saveChapterToCloud: (chapterId: string, target: ChapterSaveTarget) => Promise<{ revision: number; checksum: string }>;
  loadChapterFromCloud: (chapterId: string, target: ChapterSaveTarget) => Promise<void>;
  resetToDemo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const structureSignatures = new Map<string, string>();
  // Initialize with seeded demo book
  const demo = createDefaultDemoBook();

  return {
    books: [demo.book],
    activeBookId: demo.book.id,
    activePageIndex: 0, // Open the branded first page.
    elements: demo.elements,
    selectedElementIds: [],
    clipboardElements: [],
    publicationPresets: {},
    userCustomLayouts: {},

    getActiveBook: () => {
      const { books, activeBookId } = get();
      return books.find((b) => b.id === activeBookId) || books[0];
    },

    getActivePage: () => {
      const book = get().getActiveBook();
      if (!book) return undefined;
      return book.pages[get().activePageIndex] || book.pages[0];
    },

    getActivePageElements: () => {
      const page = get().getActivePage();
      if (!page) return [];
      const { elements } = get();
      return page.elementIds
        .map((id) => elements[id])
        .filter((el): el is PageElement => Boolean(el && !el.hidden))
        .sort((a, b) => a.transform.zIndex - b.transform.zIndex);
    },

    selectBook: (id) => {
      set({ activeBookId: id, activePageIndex: 0, selectedElementIds: [] });
      useUiStore.setState({ userGuides: get().getActiveBook()?.userGuides || [] });
    },

    createBook: (bookData) => {
      const newBookId = `book-${Math.random().toString(36).substring(2, 9)}`;
      const page1Id = `page-${Math.random().toString(36).substring(2, 9)}`;

      const newBook: Book = {
        id: newBookId,
        autoPagination: bookData.autoPagination ?? true,
        title: bookData.title || "Untitled Book",
        subtitle: bookData.subtitle || "",
        grade: bookData.grade || "Grade 5",
        subject: bookData.subject || "Science",
        language: bookData.language || "English",
        academicYear: bookData.academicYear || "2026–2027",
        type: bookData.type || "Textbook",
        orientation: bookData.orientation || "portrait",
        pageSize: bookData.pageSize || "A4",
        dimensions: bookData.dimensions || demo.book.dimensions,
        margins: bookData.margins || demo.book.margins,
        bleed: bookData.bleed || demo.book.bleed,
        bindingType: bookData.bindingType || "Perfect Bound",
        spineWidthPt: bookData.spineWidthPt || 16,
        themeId: bookData.themeId || "science-modern",
        units: [],
        chapters: [],
        pages: [
          {
            id: page1Id,
            pageIndex: 0,
            displayNumber: "1",
            elementIds: [],
            status: "Draft",
          },
        ],
        masterPages: demo.book.masterPages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        status: "Draft",
      };

      const branded = integrateFirstPageLogo(integrateBookPageBorder(newBook), get().elements);
      set((state) => ({
        books: [branded.book, ...state.books],
        elements: branded.elements,
        activeBookId: newBook.id,
        activePageIndex: 0,
        selectedElementIds: [],
      }));

      get().saveToStorage();
      return branded.book;
    },

    updateActiveBook: (updates) => {
      set((state) => ({
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? { ...b, ...updates, updatedAt: new Date().toISOString() }
            : b
        ),
      }));
      get().saveToStorage();
    },

    deleteBook: (id) => {
      set((state) => {
        const remaining = state.books.filter((b) => b.id !== id);
        const nextActive = remaining[0]?.id || "";
        return {
          books: remaining,
          activeBookId: nextActive,
          activePageIndex: 0,
          selectedElementIds: [],
        };
      });
      get().saveToStorage();
    },

    setActivePageIndex: (index) => {
      const book = get().getActiveBook();
      if (!book) return;
      const safeIndex = Math.max(0, Math.min(book.pages.length - 1, index));
      set({ activePageIndex: safeIndex, selectedElementIds: [] });
    },

    addPage: (afterIndex, templateId) => {
      const book = get().getActiveBook();
      if (!book) return;

      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : book.pages.length;
      const newPageId = `page-${Math.random().toString(36).substring(2, 9)}`;
      const precedingPage = book.pages[afterIndex ?? get().activePageIndex];
      const owningChapter = book.chapters.find(c => c.id === precedingPage?.chapterId || c.pageIds.includes(precedingPage?.id));
      const newPage: PageDefinition = {
        chapterId: owningChapter?.id,
        unitId: owningChapter?.unitId,
        id: newPageId,
        pageIndex: insertIndex,
        displayNumber: `${insertIndex + 1}`,
        templateId,
        elementIds: [],
        status: "Draft",
      };

      const updatedPages = book.pages.map(p => ({ ...p }));
      updatedPages.splice(insertIndex, 0, newPage);
      const numberedPages = renumberPages(updatedPages);

      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id ? { ...b, chapters: b.chapters.map(c => c.id === owningChapter?.id ? { ...c, pageIds: [...c.pageIds, newPageId] } : c), pages: numberedPages, updatedAt: new Date().toISOString() } : b
        ),
        activePageIndex: insertIndex,
        selectedElementIds: [],
      }));

      // If template was selected, apply it
      if (templateId) {
        const tmpl = PAGE_TEMPLATES.find((t) => t.id === templateId);
        if (tmpl) {
          get().applyTemplateToActivePage(tmpl);
        }
      }

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Page ${insertIndex + 1} Created`,
      });
    },

    duplicatePage: (index) => {
      const book = get().getActiveBook();
      if (!book || !book.pages[index]) return;

      const sourcePage = book.pages[index];
      const newPageId = `page-${Math.random().toString(36).substring(2, 9)}`;
      const { elements: newElements } = cloneElementTree(elementTree(sourcePage.elementIds, get().elements), newPageId, { dx: 0, dy: 0 });
      const newElementIds = Object.keys(newElements);

      const duplicatedPage: PageDefinition = {
        ...sourcePage,
        id: newPageId,
        pageIndex: index + 1,
        displayNumber: `${index + 2}`,
        elementIds: newElementIds,
      };

      const updatedPages = book.pages.map(p => ({ ...p }));
      updatedPages.splice(index + 1, 0, duplicatedPage);
      const numberedPages = renumberPages(updatedPages);

      set((state) => ({
        elements: { ...state.elements, ...newElements },
        books: state.books.map((b) =>
          b.id === book.id ? { ...b, pages: numberedPages, updatedAt: new Date().toISOString() } : b
        ),
        activePageIndex: index + 1,
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Page Duplicated",
      });
    },

    deletePage: (index) => {
      const book = get().getActiveBook(), page = book?.pages[index];
      if (!book || !page || book.pages.length <= 1) return;
      const previousIndex = get().activePageIndex;
      const removed = Object.fromEntries(Object.entries(get().elements).filter(([, el]) => el.pageId === page.id));
      const remaining = Object.fromEntries(Object.entries(get().elements).filter(([, el]) => el.pageId !== page.id));
      const pages = renumberPages(book.pages.filter(p => p.id !== page.id).map(p => ({ ...p })));
      const chapters = book.chapters.map(ch => {
        if (!ch.framework) return { ...ch, pageIds: ch.pageIds.filter(id => id !== page.id) };
        const blocks = { ...ch.framework.blocks };
        for (const el of Object.values(removed)) {
          const source = el.smartBlockData?.curriculum?.sourceBlockId || el.id;
          if (!Object.values(remaining).some(other => other.id === source || other.smartBlockData?.curriculum?.sourceBlockId === source)) delete blocks[source];
        }
        return { ...ch, pageIds: ch.pageIds.filter(id => id !== page.id), framework: { ...ch.framework, blocks,
          sections: ch.framework.sections.map(section => ({ ...section, blockIds: section.blockIds.filter(id => Boolean(blocks[id])) })) } };
      });
      const nextBook = { ...book, pages, chapters, updatedAt: new Date().toISOString() };
      const nextIndex = index < previousIndex ? previousIndex - 1 : Math.min(previousIndex, pages.length - 1);
      const apply = (forward: boolean) => {
        set(state => {
          const elements = { ...state.elements };
          for (const [id, el] of Object.entries(removed)) { if (forward) delete elements[id]; else elements[id] = el; }
          return { elements, books: state.books.map(b => b.id === book.id ? (forward ? nextBook : book) : b),
            activePageIndex: forward ? nextIndex : previousIndex, selectedElementIds: [] };
        });
        get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: `Delete page ${page.displayNumber}`, undo: () => apply(false), redo: () => apply(true) });
      useUiStore.getState().showToast({ type: "info", title: `Page ${page.displayNumber} deleted`, message: "Undo restores the page and its contents." });
    },

    reorderPages: (fromIndex, toIndex) => {
      const book = get().getActiveBook();
      if (!book) return;
      const updatedPages = book.pages.map(p => ({ ...p }));
      const [movedPage] = updatedPages.splice(fromIndex, 1);
      updatedPages.splice(toIndex, 0, movedPage);

      const numberedPages = renumberPages(updatedPages);

      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id ? { ...b, pages: numberedPages, updatedAt: new Date().toISOString() } : b
        ),
        activePageIndex: toIndex,
      }));
      get().saveToStorage();
    },

    applyTemplateToActivePage: (template) => {
      const page = get().getActivePage();
      if (!page) return;

      const newElements: Record<string, PageElement> = {};
      const newElementIds: string[] = [];

      template.elements.forEach((tmplEl) => {
        const id = `el-${Math.random().toString(36).substring(2, 9)}`;
        newElements[id] = {
          ...tmplEl,
          id,
          pageId: page.id,
        };
        newElementIds.push(id);
      });

      set((state) => ({
        elements: { ...state.elements, ...newElements },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id
                    ? { ...p, templateId: template.id, elementIds: [...p.elementIds, ...newElementIds] }
                    : p
                ),
              }
            : b
        ),
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Applied "${template.name}"`,
      });
    },

    updatePageStatus: (pageId, status) => {
      const book = get().getActiveBook();
      if (!book) return;
      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id
            ? {
                ...b,
                pages: b.pages.map((p) => (p.id === pageId ? { ...p, status } : p)),
              }
            : b
        ),
      }));
      get().saveToStorage();
    },

    addUnit: (title, description) => {
      const book = get().getActiveBook();
      if (!book) return;
      const newUnit: Unit = {
        id: `unit-${Math.random().toString(36).substring(2, 7)}`,
        number: book.units.length + 1,
        title,
        description,
        chapterIds: [],
      };
      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id ? { ...b, units: [...b.units, newUnit] } : b
        ),
      }));
      get().saveToStorage();
    },

    addChapter: (unitId, title, learningObjectives = []) => {
      const book = get().getActiveBook();
      if (!book) return;
      const newChapter: Chapter = {
        id: `ch-${Math.random().toString(36).substring(2, 7)}`,
        unitId,
        number: book.chapters.length + 1,
        title,
        learningObjectives,
        pageIds: [],
      };
      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id
            ? {
                ...b,
                chapters: [...b.chapters, newChapter],
                units: b.units.map((u) =>
                  u.id === unitId ? { ...u, chapterIds: [...u.chapterIds, newChapter.id] } : u
                ),
              }
            : b
        ),
      }));
      get().saveToStorage();
    },

    selectElement: (id, multiSelect = false) => {
      id = selectionRoot(id, get().elements);
      set((state) => {
        if (multiSelect) {
          const exists = state.selectedElementIds.includes(id);
          return {
            selectedElementIds: exists
              ? state.selectedElementIds.filter((elId) => elId !== id)
              : [...state.selectedElementIds, id],
          };
        }
        return { selectedElementIds: [id] };
      });
    },

    setSelectedElementIds: (ids) => {
      const roots = [...new Set(ids.map((id) => selectionRoot(id, get().elements)).filter(Boolean))];
      set({ selectedElementIds: roots });
    },

    clearSelection: () => {
      set({ selectedElementIds: [] });
    },

    selectAllOnActivePage: () => {
      const activeElements = get().getActivePageElements();
      set({ selectedElementIds: [...new Set(activeElements.map(el => selectionRoot(el.id, get().elements)))] });
    },

    addElement: (presetId, initialX = 54, initialY = 120) => {
      const page = get().getActivePage();
      const preset = ELEMENT_PRESETS[presetId];
      if (!page || !preset) return null;

      const id = `el-${Math.random().toString(36).substring(2, 9)}`;
      const activeElements = get().getActivePageElements();
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: preset.type,
        category: preset.category,
        version: 1,
        displayName: preset.name,
        transform: {
          x: initialX,
          y: initialY,
          width: preset.defaultTransform.width,
          height: preset.defaultTransform.height,
          rotation: 0,
          zIndex: maxZ + 1,
        },
        style: structuredClone(preset.defaultStyle),
        content: structuredClone(preset.defaultContent),
        presetId: preset.id,
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      // Record Undo action
      useHistoryStore.getState().pushAction({
        description: `Add ${preset.name}`,
        undo: () => {
          set((s) => {
            const next = { ...s.elements };
            delete next[id];
            return {
              elements: next,
              books: s.books.map((b) =>
                b.id === s.activeBookId
                  ? {
                      ...b,
                      pages: b.pages.map((p) =>
                        p.id === page.id
                          ? { ...p, elementIds: p.elementIds.filter((elId) => elId !== id) }
                          : p
                      ),
                    }
                  : b
              ),
              selectedElementIds: [],
            };
          });
        },
        redo: () => {
          set((s) => ({
            elements: { ...s.elements, [id]: newElement },
            books: s.books.map((b) =>
              b.id === s.activeBookId
                ? {
                    ...b,
                    pages: b.pages.map((p) =>
                      p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                    ),
                  }
                : b
            ),
            selectedElementIds: [id],
          }));
        },
      });

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Added ${preset.name}`,
      });

      return newElement;
    },

    addVectorShape: (shapeType, initialX = 100, initialY = 150, initialWidth = 140, initialHeight = 100) => {
      const page = get().getActivePage();
      if (!page) return null;

      const id = `el-${Math.random().toString(36).substring(2, 9)}`;
      const activeElements = get().getActivePageElements();
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

      const colorMap: Partial<Record<ShapeSubtype, { bg: string; border: string }>> = {
        rectangle: { bg: "#e0e7ff", border: "#4338ca" },
        circle: { bg: "#ecfdf5", border: "#059669" },
        ellipse: { bg: "#fef3c7", border: "#d97706" },
        star: { bg: "#fef3c7", border: "#d97706" },
        polygon: { bg: "#fce7f3", border: "#db2777" },
        line: { bg: "transparent", border: "#0f172a" },
        arrow: { bg: "transparent", border: "#059669" },
      };

      const colors = colorMap[shapeType] || { bg: "#e0e7ff", border: "#4338ca" };

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "shape",
        category: "decorative",
        version: 1,
        displayName: `Vector ${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`,
        transform: {
          x: initialX,
          y: initialY,
          width: initialWidth,
          height: initialHeight,
          rotation: 0,
          zIndex: maxZ + 1,
        },
        style: {
          shapeType,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 2,
          borderStyle: "solid",
          borderRadius: shapeType === "circle" ? 9999 : shapeType === "rectangle" ? 6 : 0,
          opacity: 1,
        },
        content: {},
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Created Vector ${shapeType}`,
      });

      return newElement;
    },

    addTextFrame: (initialX = 54, initialY = 120, width = 360, height = 90) => {
      const page = get().getActivePage();
      if (!page) return null;

      const id = `el-${Math.random().toString(36).substring(2, 9)}`;
      const activeElements = get().getActivePageElements();
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "body",
        category: "text",
        version: 1,
        displayName: "Academic Text Frame",
        transform: {
          x: initialX,
          y: initialY,
          width,
          height,
          rotation: 0,
          zIndex: maxZ + 1,
        },
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: 10.5,
          fontWeight: 400,
          lineHeight: 1.5,
          color: "#1e293b",
          textAlign: "left",
          backgroundColor: "transparent",
          padding: { top: 4, right: 4, bottom: 4, left: 4 },
        },
        content: {
          text: "Double-click to type formatted academic curriculum content. Text flows naturally within the bounding frame with full typographical kerning and leading controls.",
        },
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Added Text Frame",
      });

      return newElement;
    },

    addTableElement: (rows = 3, cols = 3, initialX = 54, initialY = 160) => {
      const page = get().getActivePage();
      if (!page) return null;

      const id = `el-${Math.random().toString(36).substring(2, 9)}`;
      const activeElements = get().getActivePageElements();
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

      const headers = Array.from({ length: cols }, (_, i) => `Header ${i + 1}`);
      const tableRows = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => `Item ${r + 1}.${c + 1}`)
      );

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "table",
        category: "data",
        version: 1,
        displayName: "Curriculum Data Table",
        transform: {
          x: initialX,
          y: initialY,
          width: 486,
          height: 35 + rows * 28,
          rotation: 0,
          zIndex: maxZ + 1,
        },
        style: {
          backgroundColor: "#ffffff",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          borderRadius: 6,
          fontSize: 9,
          color: "#1e293b",
        },
        content: {
          headers,
          rows: tableRows,
        },
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Added ${rows}×${cols} Data Table`,
      });

      return newElement;
    },

    updateTableCell: (elementId, rowIndex, colIndex, text) => {
      const el = get().elements[elementId];
      if (!el || !el.content.rows) return;

      const updatedRows = el.content.rows.map((r: string[], rIdx: number) => {
        if (rIdx !== rowIndex) return r;
        const newRow = [...r];
        newRow[colIndex] = text;
        return newRow;
      });

      get().updateElementContent(elementId, { rows: updatedRows });
    },

    updateTableStructure: (elementId, action) => {
      const el = get().elements[elementId];
      if (!el || !el.content.rows) return;

      const currentHeaders: string[] = el.content.headers || ["Col 1", "Col 2"];
      const currentRows: string[][] = el.content.rows || [];

      const newHeaders = [...currentHeaders];
      let newRows = currentRows.map((r) => [...r]);

      if (action === "addRow") {
        newRows.push(Array.from({ length: newHeaders.length }, (_, c) => `New ${newRows.length + 1}.${c + 1}`));
      } else if (action === "deleteRow" && newRows.length > 1) {
        newRows.pop();
      } else if (action === "addCol") {
        newHeaders.push(`Header ${newHeaders.length + 1}`);
        newRows = newRows.map((r, rIdx) => [...r, `Data ${rIdx + 1}.${newHeaders.length}`]);
      } else if (action === "deleteCol" && newHeaders.length > 1) {
        newHeaders.pop();
        newRows = newRows.map((r) => r.slice(0, -1));
      }

      get().updateElementContent(elementId, { headers: newHeaders, rows: newRows });
      get().updateElementTransform(elementId, { height: 35 + newRows.length * 28 }, true);
      useUiStore.getState().showToast({
        type: "info",
        title: `Table structure updated (${action})`,
      });
    },

    performBooleanOperation: (op) => {
      const { selectedElementIds, elements } = get();
      if (selectedElementIds.length < 2) {
        useUiStore.getState().showToast({
          type: "warning",
          title: "Boolean Operation Requires 2+ Shapes",
          message: "Select multiple vector shapes using Shift+Click",
        });
        return;
      }

      // Compute compound bounding box
      const selected = selectedElementIds.map((id) => elements[id]).filter(Boolean);
      if (selected.some(el => isElementLocked(el.id, elements) || el.childElementIds?.length)) return;
      const minX = Math.min(...selected.map((e) => e.transform.x));
      const minY = Math.min(...selected.map((e) => e.transform.y));
      const maxX = Math.max(...selected.map((e) => e.transform.x + e.transform.width));
      const maxY = Math.max(...selected.map((e) => e.transform.y + e.transform.height));

      // Keep primary element, update its geometry to compound
      const primary = selected[0];
      const otherElements = selected.slice(1);
      const otherIds = otherElements.map((e) => e.id);

      const booleanResult = combineShapesBoolean(
        {
          shapeType: (primary.style.shapeType as string) || "rectangle",
          width: primary.transform.width,
          height: primary.transform.height,
          x: primary.transform.x,
          y: primary.transform.y,
          style: primary.style,
          nodes: primary.curveData?.nodes,
        },
        otherElements.map((sec) => ({
          shapeType: (sec.style.shapeType as string) || "rectangle",
          width: sec.transform.width,
          height: sec.transform.height,
          x: sec.transform.x,
          y: sec.transform.y,
          style: sec.style,
          nodes: sec.curveData?.nodes,
        })),
        op
      );

      get().updateElementTransform(
        primary.id,
        {
          x: booleanResult.minX,
          y: booleanResult.minY,
          width: booleanResult.width,
          height: booleanResult.height,
        },
        true
      );

      const nextPrimary: PageElement = {
        ...primary,
        type: "shape" as const,
        curveData: {
          nodes: booleanResult.nodes,
          closed: true,
          windingRule: booleanResult.fillRule,
        },
        style: {
          ...primary.style,
          shapeType: "path" as const,
          pathData: booleanResult.pathData,
          fillRule: booleanResult.fillRule,
        },
      };

      // Remove secondary items
      const nextElements = { ...elements, [primary.id]: nextPrimary };
      otherIds.forEach((id) => delete nextElements[id]);

      const page = get().getActivePage();
      if (page) {
        set((s) => ({
          elements: nextElements,
          books: s.books.map((b) =>
            b.id === s.activeBookId
              ? {
                  ...b,
                  pages: b.pages.map((p) =>
                    p.id === page.id
                      ? { ...p, elementIds: p.elementIds.filter((id) => !otherIds.includes(id)) }
                      : p
                  ),
                }
              : b
          ),
          selectedElementIds: [primary.id],
        }));
      }

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Boolean ${op.toUpperCase()} Applied`,
        message: `Combined ${selected.length} shapes into a single vector element`,
      });
    },

    // ==========================================
    // VECTOR STUDIO ENGINE IMPLEMENTATIONS
    // ==========================================
    addVectorCurve: (nodes, closed = true, initialX = 120, initialY = 160) => {
      const page = get().getActivePage();
      if (!page) return null;

      const pathData = curveNodesToSvgPath(nodes, closed);
      const id = `el-curve-${Date.now()}`;

      // Calculate bounding box of nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      });
      const width = Math.max(40, maxX - minX);
      const height = Math.max(40, maxY - minY);

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "vector-curve",
        category: "decorative",
        version: 1,
        displayName: "Vector Curve",
        transform: {
          x: initialX,
          y: initialY,
          width,
          height,
          rotation: 0,
          zIndex: Object.keys(get().elements).length + 1,
        },
        style: {
          backgroundColor: "#800020",
          strokeColor: "#e11d48",
          strokeWidth: 2,
          opacity: 1,
          pathData,
        },
        curveData: {
          nodes,
          closed,
        },
        content: {},
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Vector Curve Created",
        message: `${nodes.length} Bézier nodes initialized`,
      });
      return newElement;
    },

    updateCurveNode: (elementId, nodeId, updates) => {
      const el = get().elements[elementId];
      if (!el || !el.curveData) return;

      const newNodes = el.curveData.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      );
      const newPathData = curveNodesToSvgPath(newNodes, el.curveData.closed);

      set((state) => ({
        elements: {
          ...state.elements,
          [elementId]: {
            ...state.elements[elementId],
            style: {
              ...state.elements[elementId].style,
              pathData: newPathData,
            },
            curveData: {
              ...state.elements[elementId].curveData!,
              nodes: newNodes,
            },
          },
        },
      }));
    },

    convertToCurves: (elementId) => {
      const el = get().elements[elementId];
      if (!el) return;

      const shapeType = el.style.shapeType || "rectangle";
      const { nodes, closed } = shapeToCurveNodes(shapeType, el.transform.width, el.transform.height, {
        borderRadius: el.style.borderRadius,
        starPoints: el.style.starPoints,
        polygonSides: el.style.polygonSides,
      });
      const pathData = curveNodesToSvgPath(nodes, closed);

      set((state) => ({
        elements: {
          ...state.elements,
          [elementId]: {
            ...state.elements[elementId],
            type: "vector-curve",
            displayName: `${el.displayName} (Curves)`,
            style: {
              ...state.elements[elementId].style,
              pathData,
            },
            curveData: {
              nodes,
              closed,
            },
          },
        },
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Converted to Curves",
        message: `Shape converted to ${nodes.length} editable Bézier nodes`,
      });
    },

    applyCornerFilletToNode: (elementId, nodeId, radiusPt, cornerType = "rounded") => {
      const el = get().elements[elementId];
      if (!el || !el.curveData) return;

      const nodes = el.curveData.nodes;
      const idx = nodes.findIndex((n) => n.id === nodeId);
      if (idx === -1) return;

      const prev = nodes[(idx - 1 + nodes.length) % nodes.length];
      const corner = nodes[idx];
      const next = nodes[(idx + 1) % nodes.length];

      const replacementNodes = applyCornerFillet(prev, corner, next, radiusPt, cornerType);
      const updatedNodes = [
        ...nodes.slice(0, idx),
        ...replacementNodes,
        ...nodes.slice(idx + 1),
      ];
      const pathData = curveNodesToSvgPath(updatedNodes, el.curveData.closed);

      set((state) => ({
        elements: {
          ...state.elements,
          [elementId]: {
            ...state.elements[elementId],
            style: { ...state.elements[elementId].style, pathData },
            curveData: { ...state.elements[elementId].curveData!, nodes: updatedNodes },
          },
        },
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Corner Fillet Applied (${cornerType})`,
        message: `Radius: ${radiusPt} pt`,
      });
    },

    traceElementImage: async (elementId, options) => {
      const el = get().elements[elementId];
      if (!el || el.type !== "image" || !el.content.src) {
        useUiStore.getState().showToast({
          type: "warning",
          title: "Select an Image Element to Trace",
        });
        return null;
      }

      useUiStore.getState().showToast({
        type: "info",
        title: "Tracing Raster Image...",
        message: "Extracting high-contrast vector paths",
      });

      try {
        const { pathData, nodes } = await traceImageToVector(el.content.src, options);
        const curveEl = get().addVectorCurve(
          nodes,
          true,
          el.transform.x + 15,
          el.transform.y + 15
        );
        if (curveEl) {
          get().updateElementStyle(curveEl.id, {
            backgroundColor: "#1e293b",
            strokeColor: "#38bdf8",
            strokeWidth: 1.5,
            pathData,
          });
          useUiStore.getState().showToast({
            type: "success",
            title: "Image Traced to Vector",
            message: `Generated ${nodes.length} curve nodes from raster`,
          });
        }
        return curveEl;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to trace image";
        useUiStore.getState().showToast({
          type: "error",
          title: "Image Tracing Error",
          message: errorMsg,
        });
        return null;
      }
    },

    // ==========================================
    // PIXEL STUDIO ENGINE IMPLEMENTATIONS
    // ==========================================
    addPixelLayer: (initialX = 80, initialY = 140, width = 360, height = 240) => {
      const page = get().getActivePage();
      if (!page) return null;

      const id = `el-px-${Date.now()}`;
      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "pixel-layer",
        category: "media",
        version: 1,
        displayName: "Pixel Layer",
        transform: {
          x: initialX,
          y: initialY,
          width,
          height,
          rotation: 0,
          zIndex: Object.keys(get().elements).length + 1,
        },
        style: {
          opacity: 1,
          blendMode: "normal",
        },
        pixelData: {
          dataUrl: "",
          widthPx: width * 2,
          heightPx: height * 2,
          maskEnabled: true,
        },
        content: {},
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Pixel Layer Created",
        message: "Ready for brush, inpainting, and raster editing",
      });
      return newElement;
    },

    addAdjustmentLayer: (type, params = {}) => {
      const page = get().getActivePage();
      if (!page) return null;

      const id = `el-adj-${Date.now()}`;
      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "adjustment-layer",
        category: "media",
        version: 1,
        displayName: `Adjustment (${type})`,
        transform: {
          x: 40,
          y: 60,
          width: 500,
          height: 350,
          rotation: 0,
          zIndex: Object.keys(get().elements).length + 1,
        },
        style: {
          opacity: 1,
          blendMode: "normal",
        },
        adjustmentData: {
          adjustmentType: type,
          params: { brightness: 10, contrast: 15, ...params },
          maskEnabled: true,
        },
        content: {},
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Adjustment Layer Added (${type})`,
      });
      return newElement;
    },

    addLiveFilter: (type, radiusPt = 6, amount = 100) => {
      const page = get().getActivePage();
      if (!page) return null;

      const id = `el-flt-${Date.now()}`;
      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "live-filter",
        category: "media",
        version: 1,
        displayName: `Live Filter (${type})`,
        transform: {
          x: 40,
          y: 60,
          width: 500,
          height: 350,
          rotation: 0,
          zIndex: Object.keys(get().elements).length + 1,
        },
        style: {
          opacity: 1,
          blur: radiusPt,
        },
        filterData: {
          filterType: type,
          radiusPt,
          amount,
          maskEnabled: true,
        },
        content: {},
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Live Filter Added (${type})`,
      });
      return newElement;
    },

    removeImageBackground: async (elementId) => {
      const el = get().elements[elementId];
      const picture = el && ["image", "picture-frame", "pictureFrame", "ai-image"].includes(el.type);
      const source = el?.content.originalSrc || el?.content.src || el?.content.imageUrl || el?.content.url;
      if (!el || !picture || !source) {
        useUiStore.getState().showToast({
          type: "warning",
          title: "Select a picture",
          message: "Choose an uploaded photo or a preset picture first.",
        });
        return;
      }
      if (isElementLocked(elementId, get().elements)) {
        useUiStore.getState().showToast({
          type: "warning",
          title: "Picture is locked",
          message: "Unlock it before removing the background.",
        });
        return;
      }

      useUiStore.getState().showToast({
        type: "info",
        title: "Removing background",
        message: "Tracing the subject edge.",
      });

      try {
        const { maskDataUrl, maskedPreviewUrl, changed } = await generateBackgroundRemovalMask(source);
        const current = get().elements[elementId];
        if (!current) return;
        if (!changed) {
          useUiStore.getState().showToast({
            type: "warning",
            title: "Background stayed in place",
            message: "The subject and backdrop could not be separated cleanly.",
          });
          return;
        }
        const originalSrc = current.content.originalSrc || current.content.src || current.content.imageUrl || current.content.url;
        get().updateElement(elementId, {
          content: {
            ...current.content,
            originalSrc,
            src: maskedPreviewUrl,
            ...(current.content.imageUrl ? { imageUrl: maskedPreviewUrl } : {}),
            ...(current.content.url && !current.content.src ? { url: maskedPreviewUrl } : {}),
            maskDataUrl,
          },
          style: { ...current.style, backgroundColor: "transparent" },
        });
        useUiStore.getState().showToast({
          type: "success",
          title: "Background removed",
          message: "The original picture is kept so this can be restored.",
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to remove background";
        useUiStore.getState().showToast({
          type: "error",
          title: "Background removal failed",
          message: errorMsg,
        });
      }
    },

    // ==========================================
    // AI STUDIO CREATIVE PIPELINE IMPLEMENTATIONS
    // ==========================================
    addAIGeneratedElement: (data) => {
      const page = get().getActivePage();
      if (!page) return null;

      // If user selected an empty picture frame, place image directly into it!
      if (data.targetFrameId && get().elements[data.targetFrameId]) {
        const target = get().elements[data.targetFrameId];
        get().updateElementContent(data.targetFrameId, {
          src: data.imageUrl || data.svgContent,
          caption: data.metadata.prompt,
        });
        set((state) => ({
          elements: {
            ...state.elements,
            [data.targetFrameId!]: {
              ...state.elements[data.targetFrameId!],
              aiMetadata: data.metadata,
            },
          },
        }));
        get().saveToStorage();
        useUiStore.getState().showToast({
          type: "success",
          title: "AI Generation Inserted Into Frame",
          message: `Frame: ${target.displayName}`,
        });
        return get().elements[data.targetFrameId];
      }

      const id = data.isVector ? `el-ai-vec-${Date.now()}` : `el-ai-img-${Date.now()}`;
      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: data.isVector ? "ai-vector" : "ai-image",
        category: "media",
        version: 1,
        displayName: data.isVector ? "AI Vector Diagram" : "AI Generated Artwork",
        transform: {
          x: 60,
          y: 120,
          width: 440,
          height: 310,
          rotation: 0,
          zIndex: Object.keys(get().elements).length + 1,
        },
        style: {
          opacity: 1,
          borderRadius: 8,
          strokeColor: "#475569",
          strokeWidth: 1,
        },
        aiMetadata: data.metadata,
        content: {
          src: data.imageUrl,
          svgContent: data.svgContent,
          caption: data.metadata.prompt,
        },
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: data.isVector ? "AI Vector Illustration Created" : "AI Image Generated",
        message: `Prompt: "${data.metadata.prompt.slice(0, 35)}..."`,
      });
      return newElement;
    },

    expandImageToFrame: async (elementId) => {
      const el = get().elements[elementId];
      if (!el || !el.content.src) return;

      useUiStore.getState().showToast({
        type: "info",
        title: "Generative Expand Running...",
        message: "Outpainting canvas to fit layout boundary",
      });

      const provider = new EducationalAIProvider();
      const res = await provider.generativeExpand({
        imageSrc: el.content.src,
        targetWidthPt: el.transform.width,
        targetHeightPt: el.transform.height,
        currentWidthPt: el.transform.width * 0.7,
        currentHeightPt: el.transform.height * 0.7,
        prompt: el.content.caption,
      });

      set((state) => ({
        elements: {
          ...state.elements,
          [elementId]: {
            ...state.elements[elementId],
            content: {
              ...state.elements[elementId].content,
              originalSrc: state.elements[elementId].content.src,
              src: res.resultImageUrl,
            },
            aiMetadata: res.metadata,
          },
        },
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Generative Expand Complete",
        message: "Image extended seamlessly to boundary",
      });
    },

    upscaleImage: async (elementId, factor) => {
      const el = get().elements[elementId];
      if (!el || !el.content.src) return;

      const provider = new EducationalAIProvider();
      const { upscaledUrl, newDpi } = await provider.upscale(el.content.src, factor);

      set((state) => ({
        elements: {
          ...state.elements,
          [elementId]: {
            ...state.elements[elementId],
            content: {
              ...state.elements[elementId].content,
              src: upscaledUrl,
              rawWidthPx: (el.content.rawWidthPx || 800) * factor,
            },
            metadata: {
              ...state.elements[elementId].metadata,
              effectiveDpi: newDpi,
            },
          },
        },
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Image Upscaled ${factor}×`,
        message: `New Effective Print DPI: ${newDpi} DPI`,
      });
    },

    applyTextStyle: (elementId, styleId) => {
      const book = get().getActiveBook();
      if (!book || !book.textStyles) return;
      const targetStyle = book.textStyles.find((ts) => ts.id === styleId);
      if (!targetStyle) return;

      get().updateElement(elementId, { metadata: { ...get().elements[elementId]?.metadata, styleOverride: false }, style: {
        ...get().elements[elementId]?.style,
        fontFamily: targetStyle.fontFamily,
        fontSize: targetStyle.fontSize,
        fontWeight: targetStyle.fontWeight,
        lineHeight: targetStyle.lineHeight,
        letterSpacing: targetStyle.letterSpacing,
        color: targetStyle.color,
        textTransform: targetStyle.textTransform,
        styleId: targetStyle.id,
      } });

      useUiStore.getState().showToast({
        type: "success",
        title: `Applied Style: ${targetStyle.name}`,
      });
    },

    createTextStyleFromElement: (elementId, name) => {
      const book = get().getActiveBook();
      const el = get().elements[elementId];
      if (!book || !el) return;

      const newStyleId = `ts-${Math.random().toString(36).substring(2, 7)}`;
      const newTextStyle: TextStyleDefinition = {
        id: newStyleId,
        name: name || "Custom Paragraph Style",
        category: "body",
        fontFamily: el.style.fontFamily || "Inter, sans-serif",
        fontSize: el.style.fontSize || 10.5,
        fontWeight: el.style.fontWeight || 400,
        lineHeight: el.style.lineHeight || 1.5,
        letterSpacing: el.style.letterSpacing || 0,
        color: el.style.color || "#0f172a",
        textTransform: el.style.textTransform,
      };

      const existingStyles = book.textStyles || [];
      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id ? { ...b, textStyles: [...existingStyles, newTextStyle] } : b
        ),
      }));

      // Bind the element to this style
      get().updateElementStyle(elementId, { styleId: newStyleId });
      get().saveToStorage();

      useUiStore.getState().showToast({
        type: "success",
        title: `Saved Style: ${newTextStyle.name}`,
      });
    },

    updateTextStyle: (styleId, updates) => {
      const book = get().getActiveBook();
      if (!book || !book.textStyles) return;

      const updatedStyles = book.textStyles.map((s) => (s.id === styleId ? { ...s, ...updates } : s));

      // Propagate to all elements using this styleId throughout the book!
      const updatedElements = { ...get().elements };
      new Set(book.pages.flatMap(page => page.elementIds)).forEach((elId) => {
        if (updatedElements[elId]?.style?.styleId === styleId && !updatedElements[elId].metadata?.styleOverride) {
          updatedElements[elId] = {
            ...updatedElements[elId],
            style: {
              ...updatedElements[elId].style,
              ...updates,
            },
          };
        }
      });

      set((state) => ({
        elements: updatedElements,
        books: state.books.map((b) => (b.id === book.id ? { ...b, textStyles: updatedStyles } : b)),
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Style Updated Globally",
      });
    },

    addComment: (pageId, elementId, text, author = "Editorial Reviewer", role = "Reviewer") => {
      const book = get().getActiveBook();
      if (!book) return;

      const newComment: BookComment = {
        id: `comm-${Math.random().toString(36).substring(2, 7)}`,
        pageId,
        elementId,
        author,
        role,
        text,
        timestamp: "Just now",
        resolved: false,
      };

      const currentComments = book.comments || [];
      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id ? { ...b, comments: [...currentComments, newComment] } : b
        ),
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Comment Added",
      });
    },

    resolveComment: (commentId) => {
      const book = get().getActiveBook();
      if (!book || !book.comments) return;

      const updated = book.comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c));
      set((state) => ({
        books: state.books.map((b) => (b.id === book.id ? { ...b, comments: updated } : b)),
      }));

      get().saveToStorage();
    },

    deleteComment: (commentId) => {
      const book = get().getActiveBook();
      if (!book || !book.comments) return;

      const updated = book.comments.filter((c) => c.id !== commentId);
      set((state) => ({
        books: state.books.map((b) => (b.id === book.id ? { ...b, comments: updated } : b)),
      }));

      get().saveToStorage();
    },

    importManuscript: (markdownText) => {
      const book = get().getActiveBook();
      if (!book) return { unitsAdded: 0, chaptersAdded: 0, pagesAdded: 0 };

      const lines = markdownText.split("\n");
      let unitsCount = 0;
      let chaptersCount = 0;
      let pagesCount = 0;

      let currentUnitId: string | undefined = book.units[0]?.id;
      let currentChapterId: string | undefined = book.chapters[0]?.id;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("# Unit")) {
          const title = line.replace(/^#\s*Unit\s*\d*:?\s*/i, "").trim() || "New Curriculum Unit";
          get().addUnit(title);
          unitsCount++;
          const updatedBook = get().getActiveBook();
          currentUnitId = updatedBook?.units[updatedBook.units.length - 1]?.id;
        } else if (line.startsWith("## Chapter") && currentUnitId) {
          const title = line.replace(/^##\s*Chapter\s*\d*:?\s*/i, "").trim() || "New Chapter";
          get().addChapter(currentUnitId, title);
          chaptersCount++;
          const updatedBook = get().getActiveBook();
          currentChapterId = updatedBook?.chapters[updatedBook.chapters.length - 1]?.id;
        } else if (line.startsWith("### Page") || (line.startsWith("### ") && !line.startsWith("### Page"))) {
          // Create a new textbook page
          get().addPage();
          pagesCount++;
          const updatedPage = get().getActivePage();
          if (updatedPage && currentChapterId) {
            get().addElement("preset-section-heading", 54, 54);
            const headingText = line.replace(/^###\s*/, "");
            const activeEls = get().getActivePageElements();
            const lastEl = activeEls[activeEls.length - 1];
            if (lastEl) {
              get().updateElementContent(lastEl.id, { text: headingText });
            }
          }
        }
      }

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Manuscript Imported",
        message: `Parsed: ${unitsCount} unit(s), ${chaptersCount} chapter(s), ${pagesCount} page(s)`,
      });

      return { unitsAdded: unitsCount, chaptersAdded: chaptersCount, pagesAdded: pagesCount };
    },

    generateDataMergePages: (records) => {
      const book = get().getActiveBook();
      const activePage = get().getActivePage();
      if (!book || !activePage || records.length === 0) return 0;

      const sourceElementIds = activePage.elementIds;
      const elementsMap = get().elements;
      let generatedCount = 0;

      records.forEach((record, recIdx) => {
        const newPageId = `page-merged-${Math.random().toString(36).substring(2, 8)}`;
        const newElementIds: string[] = [];
        const newElements: Record<string, PageElement> = {};

        sourceElementIds.forEach((elId) => {
          const srcEl = elementsMap[elId];
          if (!srcEl) return;

          const newElId = `el-m-${Math.random().toString(36).substring(2, 8)}`;
          // Substitute template variables
          const newContent = { ...srcEl.content };
          if (typeof newContent.text === "string") {
            let replacedText = newContent.text;
            Object.entries(record).forEach(([key, val]) => {
              replacedText = replacedText.replaceAll(`{{${key}}}`, val);
            });
            newContent.text = replacedText;
          }

          newElements[newElId] = {
            ...srcEl,
            id: newElId,
            pageId: newPageId,
            content: newContent,
          };
          newElementIds.push(newElId);
        });

        const newPage: PageDefinition = {
          id: newPageId,
          pageIndex: book.pages.length + recIdx,
          displayNumber: `${book.pages.length + recIdx + 1}`,
          elementIds: newElementIds,
          status: "Draft",
        };

        set((state) => ({
          elements: { ...state.elements, ...newElements },
          books: state.books.map((b) =>
            b.id === book.id ? { ...b, pages: [...b.pages, newPage] } : b
          ),
        }));
        generatedCount++;
      });

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Data Merge Complete`,
        message: `Generated ${generatedCount} customized pages`,
      });

      return generatedCount;
    },

    updateElement: (id, updates) => {
      const old = get().elements[id]; if (!old) return;
      if (isElementLocked(id, get().elements) && Object.keys(updates).some(key => key !== "locked" && key !== "hidden")) return;
      const chapter = old.smartBlockData?.curriculum?.chapterId ? get().getActiveBook()?.chapters.find(c => c.id === old.smartBlockData!.curriculum!.chapterId) : undefined;
      if (chapter?.framework && (updates.hidden !== undefined || updates.locked !== undefined)) {
        const meta = old.smartBlockData!.curriculum!;
        editFramework(meta.chapterId!, "Change block layer visibility / lock", framework => {
          const block = framework.blocks[meta.sourceBlockId || id];
          if (block) block.curriculum = { ...block.curriculum!, ...(updates.hidden !== undefined ? { hidden: updates.hidden } : {}), ...(updates.locked !== undefined ? { locked: updates.locked } : {}) };
          return framework;
        }, id);
        return;
      }
      if (old.smartBlockData && chapter?.framework && updates.smartBlockData &&
          (updates.smartBlockData.semanticContent !== old.smartBlockData.semanticContent || updates.smartBlockData.styleOverrides !== old.smartBlockData.styleOverrides)) {
        editCurriculumBlock(old, `Edit ${old.displayName}`, source => ({ ...source, ...updates.smartBlockData!, id: source.id,
          curriculum: { ...updates.smartBlockData!.curriculum!, sourceBlockId: undefined },
          styleOverrides: { ...updates.smartBlockData!.styleOverrides, sceneSlice: undefined } }));
        return;
      }
      if ((old.locked || old.smartBlockData?.isLockedDesign) && updates.transform) return;
      const next = { ...old, ...updates };
      if (next.smartBlockData && updates.transform && !updates.smartBlockData && !updates.content && !updates.style) {
        const resized = withBlockTransform({ ...next, transform: old.transform }, next.transform);
        next.transform = resized.transform; next.smartBlockData = resized.smartBlockData;
      }
      if (updates.content && old.metadata?.tags?.some(tag => ['master-header','master-footer','master-folio'].includes(tag))) next.metadata = { ...next.metadata, styleOverride: true };
      if (next.type === "body" && next.content.publicationPrimitive && (updates.content || updates.style || updates.transform)) {
        const height = detachedSceneForElement(next)?.height;
        if (height) next.transform = { ...next.transform, height };
      }
      if (next.smartBlockData) next.smartBlockData = { ...next.smartBlockData, transform: { ...next.transform } };
      const activeBook = get().getActiveBook();
      if (activeBook && (activeBook.autoPagination || next.smartBlockData?.presetId.startsWith("edu-")) && (updates.content || updates.smartBlockData || updates.style) &&
          !next.smartBlockData?.curriculum && !next.smartBlockData?.styleOverrides.contentLayout?.enabled && !next.smartBlockData?.styleOverrides.resizeFrame && !next.content.publicationPrimitive && ['body','body-text','smart-block'].includes(next.type)) {
        const previous = get();
        if (next.smartBlockData) {
          const height = buildPublicationScene({ ...next.smartBlockData, transform: { ...next.transform, height: 0 } }).height;
          next.transform = { ...next.transform, height: Math.max(next.transform.height, height) };
          next.smartBlockData = { ...next.smartBlockData, transform: next.transform };
        } else if (typeof next.content.text === 'string' && !next.content.html) {
          next.transform = { ...next.transform, height: Math.max(next.transform.height, estimateTextHeight(next.content.text, next.style.fontSize || 10.5, next.style.lineHeight || 1.45, next.transform.width)) };
        }
        const result = repaginateFromPage(activeBook, { ...previous.elements, [id]: next }, activeBook.pages.findIndex(page => page.id === next.pageId));
        const updatedBook = { ...activeBook, pages: result.updatedPages, chapters: activeBook.chapters.map(chapter => ({ ...chapter, pageIds: [...new Set([...chapter.pageIds, ...result.updatedPages.filter(page => page.chapterId === chapter.id).map(page => page.id)])] })) };
        const updatedBooks = previous.books.map(book => book.id === activeBook.id ? updatedBook : book);
        const applyDocument = (books: Book[], elements: Record<string, PageElement>) => { set({ books, elements }); get().saveToStorage(); };
        applyDocument(updatedBooks, result.updatedElements);
        useHistoryStore.getState().pushAction({ description: `Edit and flow ${old.displayName}`, undo: () => applyDocument(previous.books, previous.elements), redo: () => applyDocument(updatedBooks, result.updatedElements) });
        if (!result.overflowResolved) useUiStore.getState().showToast({ type: 'warning', title: 'Block needs layout review', message: 'This block cannot fit safely. Its content is preserved; resize it or use chapter composition.' });
        return;
      }
      const before = elementTree([id], get().elements);
      const after = [next, ...Object.values(transformGroupChildren(old, next.transform, get().elements))];
      const apply = (items: PageElement[]) => {
        set(state => ({ elements: { ...state.elements, ...Object.fromEntries(items.map(el => [el.id, el])) } }));
        get().saveToStorage();
      };
      apply(after);
      useHistoryStore.getState().pushAction({description: `Edit ${old.displayName}`, undo: () => apply(before), redo: () => apply(after)});
    },

    updateElementTransform: (id, newTransform, recordHistory = false, resizeMode = "auto") => {
      const current = get().elements[id];
      if (!current || isElementLocked(id, get().elements) || current.smartBlockData?.isLockedDesign || elementTree(current.childElementIds || [], get().elements).some(el => el.locked)) return;

      const beforeTree = elementTree([id], get().elements);
      const updatedTransform = { ...current.transform, ...newTransform };
      if(current.smartBlockData && (newTransform.width !== undefined || newTransform.height !== undefined)) {
        updatedTransform.width = Math.max(60, updatedTransform.width);
        if (newTransform.height !== undefined) {
          updatedTransform.height = Math.max(30, updatedTransform.height);
        } else {
          updatedTransform.width = Math.max(updatedTransform.width, 30 * current.transform.width / current.transform.height);
          updatedTransform.height = current.transform.height * updatedTransform.width / current.transform.width;
        }
      }

      const updated = withBlockTransform(current, updatedTransform, resizeMode);
      set((state) => ({
        elements: {
          ...state.elements,
          ...transformGroupChildren(current, updated.transform, state.elements),
          [id]: updated,
        },
      }));

      if (recordHistory) get().commitTransformGesture(beforeTree);

      if(recordHistory)get().saveToStorage();
    },

    updateElementStyle: (id, style) => {
      const el=get().elements[id]; if(!el || el.locked) return;
      get().updateElement(id, { style: {...el.style,...style}, metadata:{...el.metadata,styleOverride:true} });
    },
    updateElementContent: (id, content) => {
      const el=get().elements[id]; if(!el || el.locked) return;
      get().updateElement(id, { content: {...el.content,...content} });
    },

    deleteSelectedElements: () => {
      const { elements } = get();
      const selectedElementIds = elementTree(get().selectedElementIds.filter(id => !isElementLocked(id, elements)), elements).map(el => el.id);
      if (selectedElementIds.length === 0) return;
      const curriculum = selectedElementIds.map(id => elements[id]).filter(el => el?.smartBlockData?.curriculum?.chapterId);
      if (curriculum.length) {
        deleteCurriculumSelection(selectedElementIds);
        return;
      }

      const page = get().getActivePage();
      if (!page) return;

      const book = get().getActiveBook();
      if (!book) return;
      const roots = get().selectedElementIds;
      const removed = Object.fromEntries(selectedElementIds.map(id => [id, elements[id]]));
      const apply = (forward: boolean) => {
        set(state => {
          const next = { ...state.elements };
          if (forward) selectedElementIds.forEach(id => delete next[id]); else Object.assign(next, removed);
          return { elements: next, books: state.books.map(b => b.id === book.id ? { ...b, pages: b.pages.map(p => p.id === page.id ? { ...p, elementIds: forward ? page.elementIds.filter(id => !selectedElementIds.includes(id)) : page.elementIds } : p) } : b), selectedElementIds: forward ? roots.filter(id => !selectedElementIds.includes(id)) : roots };
        }); get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: `Delete ${roots.length} element(s)`, undo: () => apply(false), redo: () => apply(true) });
      useUiStore.getState().showToast({ type: "info", title: "Elements deleted", message: "Undo restores the selection." });
    },

    duplicateSelectedElements: () => get().duplicateSelectedElementsWithOffset({ dx: 16, dy: 16 }),

    toggleLockElement: (id) => {
      const current = get().elements[id];
      if (current) get().updateElement(id, { locked: !current.locked });
    },

    bringForward: (id) => {
      const page = get().getActivePage();
      if (!page) return;
      const el = get().elements[id];
      if (!el) return;
      get().updateElementTransform(id, { zIndex: el.transform.zIndex + 1 }, true);
    },

    sendBackward: (id) => {
      const page = get().getActivePage();
      if (!page) return;
      const el = get().elements[id];
      if (!el) return;
      get().updateElementTransform(id, { zIndex: Math.max(1, el.transform.zIndex - 1) }, true);
    },

    bringToFront: (id) => {
      const activeElements = get().getActivePageElements();
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);
      get().updateElementTransform(id, { zIndex: maxZ + 1 }, true);
    },

    sendToBack: (id) => {
      const activeElements = get().getActivePageElements();
      const minZ = activeElements.reduce((min, el) => Math.min(min, el.transform.zIndex), 1);
      get().updateElementTransform(id, { zIndex: Math.max(0, minZ - 1) }, true);
    },

    arrangeSelection: (mode, relative, gap=18, columns=2) => {
      const book=get().getActiveBook(),page=get().getActivePage();if(!book||!page)return;
      const before=get().selectedElementIds.map(id=>get().elements[id]).filter(el=>el && !isElementLocked(el.id, get().elements) && !el.hidden);
      const beforeTree=elementTree(before.map(el=>el.id),get().elements);
      if(!before.length)return;
      const margin=pageMarginsFor(book,page);
      const pageBounds={x:margin.insidePt,y:margin.topPt,width:book.dimensions.widthPt-margin.insidePt-margin.outsidePt,height:book.dimensions.heightPt-margin.topPt-margin.bottomPt};
      const x=Math.min(...before.map(el=>el.transform.x)),y=Math.min(...before.map(el=>el.transform.y));
      const bounds=relative==="page"?pageBounds:{x,y,width:Math.max(...before.map(el=>el.transform.x+el.transform.width))-x,height:Math.max(...before.map(el=>el.transform.y+el.transform.height))-y};
      try {
        const transforms=arrangeElements(before,bounds,mode,gap,columns);
        if(Object.values(transforms).some(t=>t.x<pageBounds.x-.1||t.y<pageBounds.y-.1||t.x+t.width>pageBounds.x+pageBounds.width+.1||t.y+t.height>pageBounds.y+pageBounds.height+.1))throw new Error("This arrangement does not fit inside the page margins. Reduce the gap, choose fewer columns, or move some objects to another page.");
        Object.entries(transforms).forEach(([id,t])=>get().updateElementTransform(id,t,false));
        get().commitTransformGesture(beforeTree);
        get().evaluateActivePageOverflow();
      } catch(error) { useUiStore.getState().showToast({type:"warning",title:"Arrangement not applied",message:String(error instanceof Error?error.message:error)}); }
    },
    alignSelectedElements: (alignment) => get().arrangeSelection(alignment,"selection"),
    distributeSelectedElements: (direction) => get().arrangeSelection(direction,"selection"),

    copySelection: () => {
      const { selectedElementIds, elements } = get();
      const copies = structuredClone(elementTree(selectedElementIds, elements));
      set({ clipboardElements: copies });
      useUiStore.getState().showToast({
        type: "info",
        title: `Copied ${copies.length} Element(s)`,
      });
    },

    pasteSelection: () => {
      const { clipboardElements } = get();
      const page = get().getActivePage();
      if (!page || clipboardElements.length === 0) return;

      const { elements: newElements, roots } = cloneElementTree(clipboardElements, page.id, { dx: 20, dy: 20 });
      const newIds = Object.keys(newElements);
      const apply = (forward: boolean) => {
        set(state => {
          const elements = { ...state.elements };
          if (forward) Object.assign(elements, newElements); else newIds.forEach(id => delete elements[id]);
          return { elements, books: state.books.map(book => ({ ...book, pages: book.pages.map(p => p.id === page.id ? { ...p, elementIds: forward ? [...p.elementIds, ...newIds] : p.elementIds.filter(id => !newIds.includes(id)) } : p) })), selectedElementIds: forward ? roots : [] };
        }); get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: "Paste elements", undo: () => apply(false), redo: () => apply(true) });

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Pasted ${newIds.length} Element(s)`,
      });
    },

    saveToStorage: () => {
      let elements = get().elements, structureChanged = false;
      const books = get().books.map(stored => {
        const book = renumberBookPages(stored);
        const signature = JSON.stringify([book.title, book.numbering, book.pages.map(page => [page.id, page.chapterId, page.displayNumber, page.elementIds]), book.chapters.map(chapter => [chapter.id, chapter.title, chapter.framework?.compositionRevision])]);
        if (structureSignatures.get(book.id) === signature) return book;
        structureSignatures.set(book.id, signature); structureChanged = true;
        const result = synchronizeBookStructure(book, elements); elements = result.updatedElements;
        return result.updatedBook;
      });
      if (structureChanged || books.some((book, i) => book !== get().books[i])) set({ books, elements });
      if (typeof window === "undefined") return;
      const activeBook=get().getActiveBook();
      // Cloud recovery/storage errors must never prevent the primary local save.
      try {
        if(activeBook && queueCentralBook(activeBook,get().elements)) {
          const page=activeBook.pages[get().activePageIndex],chapter=activeBook.chapters.find(c=>c.id===page?.chapterId||c.pageIds.includes(page?.id));
          if(chapter)rememberCentralBook(activeBook.id,chapter.id);
        }
        queueLinkedChapters(activeBook?.chapters || []);
      } catch (error) { console.warn('Cloud changes remain pending', error); }
      useUiStore.getState().setSaveStatus("Saving...");
      schedulePersistence(async () => {
      try {
        const payload = {
          books: get().books,
          activeBookId: get().activeBookId,
          activePageIndex: get().activePageIndex,
          elements: get().elements,
          publicationPresets: get().publicationPresets,
          userCustomLayouts: get().userCustomLayouts,
          savedAt: new Date().toISOString(),
        };

        // Report success only after an actual durable write.
        const indexedSaved = await localDb.saveWorkspace(payload);
        let fallbackSaved = false;

        // Secondary: localStorage snapshot
        try {
          if (!indexedSaved) { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); fallbackSaved = true; }
        } catch {}

        if (!indexedSaved && !fallbackSaved) throw new Error("Browser storage is full or unavailable");
        const now = new Date().toLocaleTimeString();
        useUiStore.getState().setSaveStatus("Local backup only");
        useUiStore.getState().setLastSavedAt(now);
        if (payload.books !== get().books || payload.elements !== get().elements) useUiStore.getState().setSaveStatus('Changes pending');
      } catch (err) {
        console.error("Autosave failed", err);
        useUiStore.getState().setSaveStatus("Changes pending");
        useUiStore.getState().showToast({ type: "error", title: "Local save failed", message: "Free browser storage and retry. Keep this tab open; changes are still in memory." });
      }
      });
    },

    loadFromStorage: async () => {
      if (typeof window === "undefined") return false;
      const initialBooks = get().books, initialElements = get().elements;
      try {
        let legacy: StorageProjectPayload | null = null;
        try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) legacy = JSON.parse(raw); } catch {}
        const indexed = await localDb.loadWorkspace() || (await localDb.getLatestRecoverySnapshot())?.payload;
        // Do not overwrite work performed while recovery was loading.
        if (get().books !== initialBooks || get().elements !== initialElements) return false;
        const data = indexed && (!legacy || Date.parse(indexed.savedAt) >= Date.parse(legacy.savedAt || '1970-01-01')) ? indexed : legacy;
        if (!data) {
          const central = recoverActiveCentralBook();
          if (!central) return false;
          const branded = integrateFirstPageLogo(integrateBookPageBorder(central.book), central.elements);
          const publishing=refreshPublishingLayout(branded.book,branded.elements);
          set({ books: [publishing.book], elements: publishing.elements, activeBookId: central.book.id, activePageIndex: 0, selectedElementIds: [] });
          if (branded.book !== central.book || publishing.changed) get().saveToStorage();
          return true;
        }
        if (data.books && data.elements) {
          let recoveredElements = data.elements;
          let publishingLayoutsChanged = false;
          const recoveredBooks = data.books.map((storedBook: Book) => {
            let recoveredBook = storedBook;
            for (const storedChapter of storedBook.chapters) {
              const recovery = getCloudChapterController(storedChapter.id)?.document;
              if(recovery && 'bookLayout' in recovery){
                const restored=restoreChapter(recovery as BookSnapshotDocument,storedChapter);
                recoveredBook={...recoveredBook,chapters:recoveredBook.chapters.map(c=>c.id===storedChapter.id?restored.chapter:c),pages:[...recoveredBook.pages.filter(p=>p.chapterId!==storedChapter.id),...restored.pages]};
                recoveredElements={...recoveredElements,...restored.elements};continue;
              }
              if (!recovery || !storedChapter.framework || documentSignature(toSemanticDocument(storedChapter.framework)) === documentSignature(recovery)) continue;
              try {
                const framework = restoreSemanticFramework(recovery, storedChapter.id, storedChapter.framework);
                const result = composeChapter(recoveredBook, { ...storedChapter, framework, title: framework.config.title }, recoveredElements);
                recoveredBook = result.book; recoveredElements = result.elements;
              } catch {
                useUiStore.getState().showToast({type:"warning",title:"Chapter recovery needs review",message:"The separate cloud recovery JSON remains on this device. Open the matching chapter before reloading."});
              }
            }
            const branded = integrateFirstPageLogo(integrateBookPageBorder(renumberBookPages(recoveredBook)), recoveredElements);
            const publishing=refreshPublishingLayout(branded.book,branded.elements);
            recoveredElements = publishing.elements;
            publishingLayoutsChanged ||= publishing.changed;
            return publishing.book;
          });
          set({
            books: recoveredBooks,
            activeBookId: data.activeBookId || data.books[0].id,
            activePageIndex: Math.max(0, recoveredBooks.find(book => book.id === data.activeBookId)?.pages.findIndex(page => page.id === data.books.find(book => book.id === data.activeBookId)?.pages[data.activePageIndex || 0]?.id) ?? 0),
            elements: recoveredElements,
            publicationPresets: data.publicationPresets || {},
            userCustomLayouts: data.userCustomLayouts || {},
            selectedElementIds: [],
          });
          useUiStore.setState({ userGuides: get().getActiveBook()?.userGuides || [] });
          useUiStore.getState().setSaveStatus("Recovered");
          if (publishingLayoutsChanged || recoveredBooks.some((book, index) => book.publisherBrandingVersion !== data.books[index].publisherBrandingVersion || book.premiumPageBorderVersion !== data.books[index].premiumPageBorderVersion)) get().saveToStorage();
          return true;
        }
      } catch (err) {
        console.error("Local recovery read error", err);
      }
      return false;
    },

    saveChapterDocument: async (chapterId, target, repository = defaultChapterRepository()) => {
      const chapter = get().getActiveBook()?.chapters.find((item) => item.id === chapterId);
      if (!chapter?.framework) throw new Error("Chapter has no framework");
      return repository.save(toSemanticDocument(chapter.framework,repository.kind==='cloud' ? target.masterChapterId : undefined), target);
    },

    loadChapterDocument: async (chapterId, target, repository = defaultChapterRepository()) => {
      const snapshot = repository.kind === 'cloud' ? await (repository as CloudChapterRepository).loadSnapshot(target.masterChapterId) : undefined;
      const document = snapshot?.document || await repository.load(target.masterChapterId);
      const before = get();
      const book = before.getActiveBook();
      const chapter = book?.chapters.find((item) => item.id === chapterId);
      if (!book || !chapter?.framework) throw new Error("Chapter has no framework");
      const framework = restoreSemanticFramework(document, chapterId, chapter.framework);
      const result = composeChapter(book, {
        ...chapter,
        title: framework.config.title,
        learningObjectives: [...framework.config.learningOutcomes],
        framework,
      }, before.elements);
      if (snapshot) acceptCloudChapter(chapterId, target, snapshot);
      const oldState = {
        books: before.books,
        elements: before.elements,
        activePageIndex: before.activePageIndex,
        selectedElementIds: before.selectedElementIds,
      };
      const nextState = {
        books: before.books.map((item) => item.id === book.id ? result.book : item),
        elements: result.elements,
        activePageIndex: Math.min(before.activePageIndex, result.book.pages.length - 1),
        selectedElementIds: before.selectedElementIds.filter((id) => result.elements[id]),
      };
      const apply = (state: typeof oldState) => {
        set(state);
        get().saveToStorage();
      };
      apply(nextState);
      useHistoryStore.getState().pushAction({
        description: `Reload central chapter · ${chapter.title}`,
        undo: () => apply(oldState),
        redo: () => apply(nextState),
      });
    },

    saveChapterToCloud: async (chapterId, target) => {
      const chapter = get().getActiveBook()?.chapters.find(item => item.id === chapterId);
      if (!chapter?.framework) throw new Error('Chapter has no framework');
      const controller = await connectNewCloudChapter(chapterId, target);
      controller.update(toSemanticDocument(chapter.framework,target.masterChapterId));
      const result = await controller.flush();
      const saved = result || controller.status.base;
      if (!saved.checksum) throw new Error('No central save has been acknowledged');
      return { revision: saved.revision, checksum: saved.checksum };
    },
    loadChapterFromCloud: (chapterId, target) => get().loadChapterDocument(chapterId, target, cloudChapterRepository()),

    // ==========================================
    // ADAPTIVE LAYOUT ENGINE IMPLEMENTATIONS (Directives 9-21, 106, 146)
    // ==========================================
    createAdaptiveGroup: (elementIds, direction = "vertical", spacingPt = 14) => {
      const page = get().getActivePage();
      if (!page || elementIds.length === 0) return null;

      const children = elementIds.map((id) => get().elements[id]).filter(Boolean);
      if (children.length === 0) return null;

      const { groupBounds, childrenTransforms } = solveSmartStack(children, direction, spacingPt);
      const groupId = `group-adapt-${Date.now()}`;

      const groupElement: PageElement = {
        id: groupId,
        pageId: page.id,
        type: "shape",
        category: "decorative",
        version: 1,
        displayName: `Adaptive ${direction.charAt(0).toUpperCase() + direction.slice(1)} Group`,
        layoutMode: "adaptive",
        adaptiveGroup: {
          direction,
          spacingPt,
          padding: { top: 12, right: 12, bottom: 12, left: 12 },
          alignment: "stretch",
          distribution: "start",
          widthMode: "fixed",
          heightMode: "fit-content",
        },
        childElementIds: elementIds,
        transform: {
          x: groupBounds.x,
          y: groupBounds.y,
          width: groupBounds.width,
          height: groupBounds.height,
          rotation: 0,
          zIndex: Math.max(...children.map((c) => c.transform.zIndex)) + 1,
        },
        style: {
          backgroundColor: "transparent",
          borderColor: "#3b82f6",
          borderWidth: 1,
          borderStyle: "dashed",
          borderRadius: 8,
        },
        content: {},
        locked: false,
        hidden: false,
      };

      const updatedElements = { ...get().elements, [groupId]: groupElement };
      Object.entries(childrenTransforms).forEach(([cId, t]) => {
        if (updatedElements[cId]) {
          updatedElements[cId] = {
            ...updatedElements[cId],
            groupId,
            transform: {
              ...updatedElements[cId].transform,
              ...t,
            },
            adaptiveChild: {
              priority: "flexible",
              widthMode: direction === "vertical" ? "fill-parent" : "fixed",
            },
          };
        }
      });

      set((state) => ({
        elements: updatedElements,
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, groupId] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [groupId],
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Adaptive ${direction} Group Created`,
        message: `${children.length} elements grouped with auto-reflow`,
      });

      return groupElement;
    },

    groupSelectedElements: () => {
      const page = get().getActivePage();
      const ids = [...new Set(get().selectedElementIds.map(id => selectionRoot(id, get().elements)))];
      const children = ids.map(id => get().elements[id]).filter(el => el?.pageId === page?.id);
      if (!page || children.length < 2) return;
      if (elementTree(ids, get().elements).some(el => el.locked)) {
        useUiStore.getState().showToast({ type: "warning", title: "Unlock elements before grouping", message: "For protected chapter blocks, enable Design mode first." });
        return;
      }
      const x = Math.min(...children.map(el => el.transform.x)), y = Math.min(...children.map(el => el.transform.y));
      const id = crypto.randomUUID();
      const group: PageElement = { id, pageId: page.id, type: "group", category: "decorative", version: 1,
        displayName: `Group (${children.length} elements)`, locked: false, hidden: false, content: {}, style: {}, layoutMode: "freeform",
        childElementIds: children.map(el => el.id), transform: { x, y, width: Math.max(...children.map(el => el.transform.x + el.transform.width)) - x,
          height: Math.max(...children.map(el => el.transform.y + el.transform.height)) - y, rotation: 0, zIndex: Math.max(...children.map(el => el.transform.zIndex)) + 1 } };
      const before = Object.fromEntries(children.map(el => [el.id, el]));
      const after = Object.fromEntries(children.map(el => [el.id, { ...el, groupId: id }]));
      const apply = (forward: boolean) => {
        set(state => {
          const elements = { ...state.elements, ...(forward ? after : before) };
          if (forward) elements[id] = group; else delete elements[id];
          return { elements, books: state.books.map(book => ({ ...book, pages: book.pages.map(p => p.id === page.id ? { ...p, elementIds: forward ? [...page.elementIds, id] : page.elementIds } : p) })), selectedElementIds: forward ? [id] : ids };
        }); get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: "Group elements", undo: () => apply(false), redo: () => apply(true) });
      useUiStore.getState().showToast({ type: "success", title: "Elements grouped", message: "Move, resize or lock them together. Ungroup restores individual editing." });
    },

    groupAndLockSelectedElements: () => {
      const page = get().getActivePage();
      const ids = [...new Set(get().selectedElementIds.map(id => selectionRoot(id, get().elements)))];
      const children = ids.map(id => get().elements[id]).filter(el => el?.pageId === page?.id);
      if (!page || children.length < 2) return;
      if (elementTree(ids, get().elements).some(el => el.locked)) {
        useUiStore.getState().showToast({ type: "warning", title: "Unlock elements before grouping", message: "For protected chapter blocks, enable Design mode first." });
        return;
      }
      const x = Math.min(...children.map(el => el.transform.x)), y = Math.min(...children.map(el => el.transform.y));
      const id = crypto.randomUUID();
      const group: PageElement = { id, pageId: page.id, type: "group", category: "decorative", version: 1,
        displayName: `Group (${children.length} elements)`, locked: true, hidden: false, content: {}, style: {}, layoutMode: "freeform",
        childElementIds: children.map(el => el.id), transform: { x, y, width: Math.max(...children.map(el => el.transform.x + el.transform.width)) - x,
          height: Math.max(...children.map(el => el.transform.y + el.transform.height)) - y, rotation: 0, zIndex: Math.max(...children.map(el => el.transform.zIndex)) + 1 } };
      const before = Object.fromEntries(children.map(el => [el.id, el]));
      const after = Object.fromEntries(children.map(el => [el.id, { ...el, groupId: id }]));
      const apply = (forward: boolean) => {
        set(state => {
          const elements = { ...state.elements, ...(forward ? after : before) };
          if (forward) elements[id] = group; else delete elements[id];
          return { elements, books: state.books.map(book => ({ ...book, pages: book.pages.map(p => p.id === page.id ? { ...p, elementIds: forward ? [...page.elementIds, id] : page.elementIds } : p) })), selectedElementIds: forward ? [id] : ids };
        }); get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: "Group and lock elements", undo: () => apply(false), redo: () => apply(true) });
      useUiStore.getState().showToast({ type: "success", title: "Elements grouped and locked", message: "Unified into a protected group. Click Unlock anytime to edit individual parts." });
    },

    ungroupSelectedElements: () => {
      const page = get().getActivePage();
      const groups = get().selectedElementIds.map(id => get().elements[id]).filter(el => el?.childElementIds?.length && !isElementLocked(el.id, get().elements));
      if (!page || !groups.length) return;
      const before = Object.fromEntries(elementTree(groups.map(el => el.id), get().elements).map(el => [el.id, el]));
      const children = groups.flatMap(group => group.childElementIds!).filter(id => Boolean(get().elements[id]));
      const apply = (forward: boolean) => {
        set(state => {
          const elements = { ...state.elements };
          if (forward) {
            groups.forEach(group => { delete elements[group.id]; group.childElementIds!.forEach(id => { if (elements[id]) elements[id] = { ...elements[id], groupId: group.groupId }; }); });
          } else Object.assign(elements, before);
          return { elements, books: state.books.map(book => ({ ...book, pages: book.pages.map(p => p.id === page.id ? { ...p, elementIds: forward ? page.elementIds.filter(id => !groups.some(g => g.id === id)) : page.elementIds } : p) })), selectedElementIds: forward ? children : groups.map(g => g.id) };
        }); get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: "Ungroup elements", undo: () => apply(false), redo: () => apply(true) });
    },

    smartStack: (elementIds, direction = "vertical") => {
      const page = get().getActivePage();
      if (!page) return;

      const targetIds = elementIds && elementIds.length > 0 ? elementIds : get().selectedElementIds;
      if (targetIds.length < 2) {
        useUiStore.getState().showToast({
          type: "warning",
          title: "Select 2+ Elements to Stack",
          message: "Shift-click multiple elements or drag to select",
        });
        return;
      }

      const roots = [...new Set(targetIds.map(id => selectionRoot(id, get().elements)))];
      const elementsList = roots.map(id => get().elements[id]).filter(Boolean);
      if (elementsList.length < 2) return;
      if (elementTree(roots, get().elements).some(el => isElementLocked(el.id, get().elements))) {
        useUiStore.getState().showToast({ type: "warning", title: "Unlock elements before stacking" });
        return;
      }
      const before = elementTree(roots, get().elements);
      const { childrenTransforms } = solveSmartStack(elementsList, direction, 16);
      Object.entries(childrenTransforms).forEach(([id, transform]) => get().updateElementTransform(id, transform));
      get().commitTransformGesture(before);
      get().evaluateActivePageOverflow();
      useUiStore.getState().showToast({
        type: "success",
        title: `Stacked ${direction === "vertical" ? "Vertically" : "Horizontally"}`,
      });
    },

    setElementLayoutMode: (elementId, mode) => {
      const el = get().elements[elementId];
      if (!el || isElementLocked(elementId, get().elements)) return;

      set((state) => ({
        elements: {
          ...state.elements,
          [elementId]: {
            ...state.elements[elementId],
            layoutMode: mode,
            adaptiveGroup:
              mode === "adaptive" && !state.elements[elementId].adaptiveGroup
                ? {
                    direction: "vertical",
                    spacingPt: 14,
                    padding: { top: 10, right: 10, bottom: 10, left: 10 },
                    alignment: "stretch",
                    distribution: "start",
                    widthMode: "fixed",
                    heightMode: "fit-content",
                  }
                : state.elements[elementId].adaptiveGroup,
          },
        },
      }));
      get().saveToStorage();
    },

    autoArrangeActivePage: (style = "balanced") => {
      const book=get().getActiveBook(),page=get().getActivePage();if(!book||!page)return;
      const compositionElements=get().getActivePageElements().filter(el=>!el.groupId).map(el=>el.childElementIds?.length ? {...el, locked:true, category:"media" as const} : el);
      const margins = pageMarginsFor(book, page);
      const result=composePage(compositionElements,book.dimensions,margins,style);
      if(!result.count)return;
      if(!result.fits){
        // Try compact layout first to keep content on current page
        const compactResult = composePage(compositionElements, book.dimensions, margins, "compact");
        if (compactResult.fits && compactResult.count) {
          const before=Object.keys(compactResult.transforms).map(id=>get().elements[id]);
          Object.entries(compactResult.transforms).forEach(([id,t])=>get().updateElementTransform(id,t,false));
          get().commitTransformGesture(before);
          get().evaluateActivePageOverflow();
          useUiStore.getState().showToast({type:"success",title:"Page composed (compact)",message:`${compactResult.count} objects arranged to fit print-safe margins.`});
          return;
        }
        // If content cannot fit safely on one page, flow the overflowing content to the next page!
        get().flowPageOverflowToNextPage(page.id);
        return;
      }
      const before=Object.keys(result.transforms).map(id=>get().elements[id]);
      Object.entries(result.transforms).forEach(([id,t])=>get().updateElementTransform(id,t,false));
      get().commitTransformGesture(before);get().evaluateActivePageOverflow();
      useUiStore.getState().showToast({type:"success",title:"Page composed",message:`${result.count} objects arranged. Undo restores the previous layout.`});
    },

    tryAnotherLayout: (variantIndex) => {
      const styles: ("balanced" | "visual" | "reading" | "compact" | "playful")[] = [
        "balanced",
        "visual",
        "reading",
        "compact",
        "playful",
      ];
      const idx = variantIndex !== undefined ? variantIndex % styles.length : Math.floor(Math.random() * styles.length);
      get().autoArrangeActivePage(styles[idx]);
    },

    shuffleCompatibleLayout: () => {
      const styles: ("balanced" | "visual" | "reading" | "compact" | "playful")[] = [
        "balanced",
        "visual",
        "reading",
        "compact",
        "playful",
      ];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      get().autoArrangeActivePage(randomStyle);
    },

    applyPagePreset: (presetId, preserveContent = true) => {
      const page = get().getActivePage();
      const preset = PAGE_PRESETS_MAP[presetId];
      if (!page || !preset) return;

      const currentElements = get().getActivePageElements();
      const prevElementIds = [...page.elementIds];
      const prevElements = { ...get().elements };

      let nextElements: Record<string, PageElement>;
      let newElementIds: string[];

      if (preserveContent && currentElements.length > 0) {
        const switched = switchPageLayout(currentElements, preset.elements);
        nextElements = { ...get().elements, ...switched.updatedElements };
        newElementIds = switched.newElementIds;
      } else {
        nextElements = { ...get().elements };
        newElementIds = [];
        preset.elements.forEach((tmpl, i) => {
          const id = `el-pr-${i}-${Date.now()}`;
          nextElements[id] = {
            ...tmpl,
            id,
            pageId: page.id,
          };
          newElementIds.push(id);
        });
      }

      set((state) => ({
        elements: nextElements,
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: newElementIds, presetId } : p
                ),
              }
            : b
        ),
        selectedElementIds: newElementIds.slice(0, 1),
      }));

      useHistoryStore.getState().pushAction({
        description: `Applied ${preset.name} Layout`,
        undo: () => {
          set((s) => ({
            elements: prevElements,
            books: s.books.map((b) =>
              b.id === s.activeBookId
                ? {
                    ...b,
                    pages: b.pages.map((p) =>
                      p.id === page.id ? { ...p, elementIds: prevElementIds } : p
                    ),
                  }
                : b
            ),
            selectedElementIds: prevElementIds.slice(0, 1),
          }));
        },
        redo: () => {
          get().applyPagePreset(presetId, preserveContent);
        },
      });

      get().evaluateActivePageOverflow();
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Applied "${preset.name}"`,
        message: `${newElementIds.length} elements arranged (Content Preserved)`,
      });
    },

    adaptPageSize: (newPageSize, adaptationMode = "adapt") => {
      const book = get().getActiveBook();
      if (!book) return;

      const oldDim = book.dimensions;
      const newDim = STANDARD_PAGE_SIZES[newPageSize] || oldDim;
      const ownedIds = new Set(book.pages.flatMap(page => page.elementIds));
      const allElements = Object.values(get().elements).filter(el => ownedIds.has(el.id));

      const adaptedTransforms = adaptPageToDimensions(
        allElements,
        oldDim,
        newDim,
        book.margins,
        adaptationMode
      );

      if (adaptationMode === 'adapt') for (const el of allElements) {
        if (el.constraints) adaptedTransforms[el.id] = solveElementConstraint(el.transform, el.constraints, oldDim, newDim, book.margins, book.margins);
      }
      const nextElements = { ...get().elements };
      Object.entries(adaptedTransforms).forEach(([id, t]) => {
        if (nextElements[id]) {
          nextElements[id] = {
            ...nextElements[id],
            transform: {
              ...nextElements[id].transform,
              ...t,
            },
          };
        }
      });

      set((state) => ({
        elements: nextElements,
        books: state.books.map((b) =>
          b.id === book.id
            ? {
                ...b,
                pageSize: newPageSize,
                dimensions: newDim,
                updatedAt: new Date().toISOString(),
              }
            : b
        ),
      }));

      get().evaluateActivePageOverflow();
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Page Size Adapted to ${newPageSize}`,
        message: `Mode: ${adaptationMode === "adapt" ? "Smart Constraints" : adaptationMode}`,
      });
    },

    applyThemeToBook: (themeId) => {
      const theme = SUBJECT_THEMES[themeId];
      if (!theme) return;

      const book = get().getActiveBook();
      if (!book) return;

      const beforeElements = structuredClone(get().elements);
      const beforeTheme = book.themeId;
      const nextElements = { ...get().elements };
      const ownedIds = new Set(book.pages.flatMap(page => page.elementIds));
      ownedIds.forEach((id) => {
        const el = nextElements[id];
        if (!el) return;
        const design = el.content?.design;
        if (design?.composition) {
          const tokens = tokensFromTheme(themeId, design.familyId);
          if (tokens) {
            nextElements[id] = applyDesignToElement(el, { tokens, replaceOverrides: false });
          }
          return;
        }
        if (el.metadata?.styleOverride) return;
        if (el.type === "heading" || el.type === "subheading") {
          nextElements[id] = {
            ...el,
            style: {
              ...el.style,
              color: el.type === "heading" ? theme.colors.text : theme.colors.primary,
              fontFamily: theme.typography.headingFont,
            },
          };
        } else if (el.type === "divider") {
          nextElements[id] = {
            ...el,
            style: {
              ...el.style,
              backgroundColor: theme.colors.primary,
            },
          };
        }
      });

      const afterElements = nextElements;
      set((state) => ({
        elements: afterElements,
        books: state.books.map((b) => (b.id === book.id ? { ...b, themeId } : b)),
      }));

      useHistoryStore.getState().pushAction({
        description: `Apply theme ${theme.name}`,
        undo: () => {
          set((state) => ({
            elements: beforeElements,
            books: state.books.map((b) => (b.id === book.id ? { ...b, themeId: beforeTheme } : b)),
          }));
        },
        redo: () => {
          set((state) => ({
            elements: afterElements,
            books: state.books.map((b) => (b.id === book.id ? { ...b, themeId } : b)),
          }));
        },
      });

      useUiStore.getState().setActiveThemeId(themeId);
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Theme Applied: ${theme.name}`,
      });
    },

    applyFontPairingToBook: (pairingId) => {
      const pairings: Record<string, { heading: string; body: string; label: string }> = {
        "modern-academic": { heading: "Outfit, Inter, sans-serif", body: "Inter, sans-serif", label: "Modern Academic" },
        "friendly-learning": { heading: "Quicksand, Outfit, sans-serif", body: "Inter, sans-serif", label: "Friendly Learning" },
        "premium-editorial": { heading: "Georgia, serif", body: "Georgia, serif", label: "Premium Editorial" },
        "early-learning": { heading: "Comfortaa, Outfit, sans-serif", body: "Inter, sans-serif", label: "Early Learning" },
        "technical-science": { heading: "Fira Code, Outfit, sans-serif", body: "Inter, sans-serif", label: "Technical Science" },
        "classic-reader": { heading: "Merriweather, Georgia, serif", body: "Georgia, serif", label: "Classic Reader" },
      };

      const selected = pairings[pairingId] || pairings["modern-academic"];
      const beforeElements = structuredClone(get().elements);
      const nextElements = { ...get().elements };
      Object.keys(nextElements).forEach((id) => {
        const el = nextElements[id];
        if (el.metadata?.styleOverride) return;
        const design = el.content?.design;
        if (design?.tokens) {
          const headingish = ["chapter", "heading", "running", "quote"].includes(design.role);
          nextElements[id] = {
            ...el,
            style: { ...el.style, fontFamily: headingish ? selected.heading : selected.body },
            content: {
              ...el.content,
              design: {
                ...design,
                tokens: { ...design.tokens, headingFont: selected.heading, bodyFont: selected.body },
              },
            },
          };
          return;
        }
        if (el.type === "heading" || el.type === "subheading") {
          nextElements[id] = {
            ...el,
            style: { ...el.style, fontFamily: selected.heading },
          };
        } else if (el.type === "body" || el.type === "quote") {
          nextElements[id] = {
            ...el,
            style: { ...el.style, fontFamily: selected.body },
          };
        }
      });

      set({ elements: nextElements });
      useHistoryStore.getState().pushAction({
        description: `Font pairing ${selected.label}`,
        undo: () => set({ elements: beforeElements }),
        redo: () => set({ elements: nextElements }),
      });
      useUiStore.getState().setActiveFontPairing(pairingId);
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Font Pairing Applied: ${selected.label}`,
      });
    },

    applyDesignSystem: (options) => {
      const book = get().getActiveBook();
      const page = get().getActivePage();
      if (!book || !page) return;

      let ids: string[] = [];
      let scopeNote = "";
      if (options.scope === "selection") {
        ids = get().selectedElementIds;
        if (ids.length === 0) {
          useUiStore.getState().showToast({ type: "info", title: "Select elements to restyle" });
          return;
        }
      } else if (options.scope === "page") {
        ids = page.elementIds;
      } else if (options.scope === "chapter") {
        if (page.chapterId) {
          ids = book.pages.filter((p) => p.chapterId === page.chapterId).flatMap((p) => p.elementIds);
        } else {
          ids = page.elementIds;
          scopeNote = "This page is not in a chapter, so only this page changed.";
        }
      } else {
        ids = book.pages.flatMap((p) => p.elementIds);
      }

      const applyOptions: DesignApplyOptions = options;
      const before: Record<string, PageElement> = {};
      const after: Record<string, PageElement> = {};
      ids.forEach((id) => {
        const current = get().elements[id];
        if (!current) return;
        before[id] = structuredClone(current);
        after[id] = applyDesignToElement(current, applyOptions);
      });

      const designSystem = {
        familyId: options.familyId || book.designSystem?.familyId || "contemporary-academic",
        paletteId: options.paletteId || book.designSystem?.paletteId || "academic-teal",
        decoration: options.decoration || book.designSystem?.decoration || "standard",
        spacing: options.spacing || book.designSystem?.spacing || "normal",
        border: options.border || book.designSystem?.border || "hairline",
        showNumber: options.showNumber ?? book.designSystem?.showNumber ?? true,
      };

      set((state) => ({
        elements: { ...state.elements, ...after },
        books: state.books.map((b) => (b.id === book.id ? { ...b, designSystem } : b)),
      }));

      useHistoryStore.getState().pushAction({
        description: "Apply design system",
        undo: () => {
          set((state) => ({
            elements: { ...state.elements, ...before },
            books: state.books.map((b) => (b.id === book.id ? { ...b, designSystem: book.designSystem } : b)),
          }));
        },
        redo: () => {
          set((state) => ({
            elements: { ...state.elements, ...after },
            books: state.books.map((b) => (b.id === book.id ? { ...b, designSystem } : b)),
          }));
        },
      });

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Design system applied",
        message: scopeNote || (options.replaceOverrides
          ? "Wording and data stayed. Local style overrides were replaced."
          : "Wording and data stayed. Local style overrides were kept."),
      });
    },

    replaceElementPreset: (elementId, presetId) => {
      const preset = ELEMENT_PRESETS[presetId];
      const current = get().elements[elementId];
      if (!preset || !current) return;

      const previousPreset = current.presetId ? ELEMENT_PRESETS[current.presetId] : undefined;
      const resized = previousPreset
        ? Math.abs(current.transform.width - previousPreset.defaultTransform.width) > 4 ||
          Math.abs(current.transform.height - previousPreset.defaultTransform.height) > 4
        : true;

      const next: PageElement = {
        ...current,
        type: preset.type,
        category: preset.category,
        displayName: preset.name,
        presetId: preset.id,
        style: structuredClone(preset.defaultStyle),
        content: mergePresetContent(current.content, structuredClone(preset.defaultContent)),
        transform: {
          ...current.transform,
          width: resized ? current.transform.width : preset.defaultTransform.width,
          height: resized ? current.transform.height : preset.defaultTransform.height,
        },
        metadata: { ...current.metadata, styleOverride: false },
      };

      const before = structuredClone(current);
      set((state) => ({
        elements: { ...state.elements, [elementId]: next },
      }));
      useHistoryStore.getState().pushAction({
        description: `Restyle as ${preset.name}`,
        undo: () => set((state) => ({ elements: { ...state.elements, [elementId]: before } })),
        redo: () => set((state) => ({ elements: { ...state.elements, [elementId]: next } })),
      });
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Restyled as ${preset.name}`,
        message: "The wording and data stayed in place.",
      });
    },

    duplicateSelectedElementsWithOffset: (customOffset) => {
      const { selectedElementIds, elements } = get();
      if (selectedElementIds.some(id => elements[id]?.smartBlockData?.curriculum?.chapterId)) {
        duplicateCurriculumSelection(selectedElementIds, customOffset); return;
      }
      const page = get().getActivePage();
      if (!page || selectedElementIds.length === 0) return;

      const offset = customOffset || useUiStore.getState().lastDuplicateOffset || { dx: 16, dy: 16 };
      const { elements: newElements, roots } = cloneElementTree(elementTree(selectedElementIds, elements), page.id, offset);
      const newIds = Object.keys(newElements);
      const apply = (forward: boolean) => {
        set(state => {
          const elements = { ...state.elements };
          if (forward) Object.assign(elements, newElements); else newIds.forEach(id => delete elements[id]);
          return { elements, books: state.books.map(book => ({ ...book, pages: book.pages.map(p => p.id === page.id ? { ...p, elementIds: forward ? [...p.elementIds, ...newIds] : p.elementIds.filter(id => !newIds.includes(id)) } : p) })), selectedElementIds: forward ? roots : selectedElementIds };
        }); get().saveToStorage();
      };
      apply(true);
      useHistoryStore.getState().pushAction({ description: "Duplicate elements", undo: () => apply(false), redo: () => apply(true) });
      useUiStore.getState().showToast({ type: "success", title: "Selection duplicated" });
    },

    savePageAsPreset: (name, category, tags = []) => {
      const page = get().getActivePage();
      if (!page) return null;

      const activeEls = get().getActivePageElements();
      if (activeEls.length === 0) return null;

      const id = `custom-preset-${Date.now()}`;
      const templateEls = activeEls.map((el) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, pageId: _pid, ...rest } = el;
        return rest;
      });

      const newPreset: PagePresetDefinition = {
        id,
        version: 1,
        category: (category as PagePresetDefinition["category"]) || "content",
        name: name || "Custom User Preset",
        description: `Saved by user with ${activeEls.length} elements`,
        tags: ["custom", ...tags],
        supportedGrades: ["All Grades"],
        supportedSubjects: ["All Subjects"],
        layoutMode: "adaptive",
        slots: [],
        elements: templateEls,
      };

      COMPREHENSIVE_PRESET_LIBRARY.unshift(newPreset);
      PAGE_PRESETS_MAP[id] = newPreset;

      useUiStore.getState().showToast({
        type: "success",
        title: `Preset Saved: "${newPreset.name}"`,
        message: "Available in Custom Presets tab",
      });

      return newPreset;
    },

    reflowActivePageElement: (elementId, newHeightPt) => {
      const book = get().getActiveBook();
      const page = get().getActivePage();
      if (!book || !page) return;

      const activeElements = get().getActivePageElements();
      const { updatedTransforms, overflowStatus } = solvePageReflow(
        elementId,
        newHeightPt,
        activeElements,
        pageMarginsFor(book,page),
        book.dimensions
      );

      const nextElements = { ...get().elements };
      Object.entries(updatedTransforms).forEach(([id, t]) => {
        if (nextElements[id]) {
          nextElements[id] = {
            ...nextElements[id],
            transform: {
              ...nextElements[id].transform,
              ...t,
            },
          };
        }
      });

      set((state) => ({
        elements: nextElements,
        books: state.books.map((b) =>
          b.id === book.id
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, overflowWarning: overflowStatus } : p
                ),
              }
            : b
        ),
      }));

      get().saveToStorage();
    },

    evaluateActivePageOverflow: () => {
      const book = get().getActiveBook();
      const page = get().getActivePage();
      if (!book || !page) return;

      const activeElements = get().getActivePageElements();
      const overflowStatus = detectPageOverflow(
        activeElements,
        pageMarginsFor(book,page),
        book.dimensions
      );

      set((state) => ({
        books: state.books.map((b) =>
          b.id === book.id
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, overflowWarning: overflowStatus } : p
                ),
              }
            : b
        ),
      }));
    },

    flowPageOverflowToNextPage: (targetPageId?: string) => {
      const book = get().getActiveBook();
      if (!book) return;
      const pageId = targetPageId || get().getActivePage()?.id;
      const pageIndex = book.pages.findIndex((p) => p.id === pageId);
      if (pageIndex < 0) return;
      const page = book.pages[pageIndex];
      const pageElements = page.elementIds.map((id) => get().elements[id]).filter(Boolean);
      const margins = pageMarginsFor(book, page);
      const safeBottom = book.dimensions.heightPt - margins.bottomPt;
      const safeRight = book.dimensions.widthPt - margins.outsidePt;

      // Find overflowing elements, excluding full-bleed background and decorative shapes
      const overflowingElements = pageElements.filter((el) => {
        if (el.hidden || el.locked) return false;
        const isBg =
          (el.category === "decorative" &&
            (el.transform.width >= book.dimensions.widthPt - 2 ||
              el.transform.height >= book.dimensions.heightPt - 2)) ||
          Boolean(el.content?.curriculumDecoration) ||
          Boolean(el.metadata?.tags?.includes("bleed-bg"));
        if (isBg) return false;
        return (
          el.transform.y + el.transform.height > safeBottom + 4 ||
          el.transform.x + el.transform.width > safeRight + 4
        );
      }).sort((a, b) => a.transform.y - b.transform.y);

      if (overflowingElements.length === 0) return;

      let pages = [...book.pages];
      let nextPage = pages[pageIndex + 1];
      const isSameChapter = nextPage && (nextPage.chapterId === page.chapterId || !page.chapterId);

      if (!nextPage || !isSameChapter) {
        const newPageId = crypto.randomUUID();
        nextPage = {
          ...page,
          id: newPageId,
          pageIndex: pageIndex + 1,
          displayNumber: String(pageIndex + 2),
          elementIds: [],
          status: "Draft",
          overflowWarning: undefined,
        };
        pages.splice(pageIndex + 1, 0, nextPage);
      }

      pages = renumberPages(pages);
      const nextTargetPage = pages.find((p) => p.id === nextPage.id)!;
      const nextMargins = pageMarginsFor(book, nextTargetPage);
      const nextContentWidth = Math.floor(
        (book.dimensions.widthPt - nextMargins.insidePt - nextMargins.outsidePt) * 10
      ) / 10;
      const nextSafeBottom = book.dimensions.heightPt - nextMargins.bottomPt;

      const existingNextElements = nextTargetPage.elementIds
        .map((id) => get().elements[id])
        .filter(Boolean);
      let nextY =
        existingNextElements.length > 0
          ? Math.max(
              nextMargins.topPt,
              ...existingNextElements.map((e) => e.transform.y + e.transform.height + 14)
            )
          : nextMargins.topPt;

      const overflowingIds = new Set(overflowingElements.map((e) => e.id));
      const updatedElements = { ...get().elements };

      overflowingElements.forEach((el) => {
        const width =
          el.smartBlockData || el.category === "educational"
            ? nextContentWidth
            : Math.min(el.transform.width, nextContentWidth);
        const updatedTransform = {
          ...el.transform,
          x: nextMargins.insidePt,
          y: nextY,
          width,
        };
        updatedElements[el.id] = {
          ...el,
          pageId: nextTargetPage.id,
          transform: updatedTransform,
          smartBlockData: el.smartBlockData
            ? {
                ...el.smartBlockData,
                pageId: nextTargetPage.id,
                transform: updatedTransform,
              }
            : undefined,
        };
        nextY += el.transform.height + 14;
      });

      const sourcePage = {
        ...page,
        elementIds: page.elementIds.filter((id) => !overflowingIds.has(id)),
        overflowWarning: { hasOverflow: false },
      };

      const destPage = {
        ...nextTargetPage,
        elementIds: [
          ...nextTargetPage.elementIds.filter((id) => !overflowingIds.has(id)),
          ...overflowingElements.map((e) => e.id),
        ],
      };

      pages = pages.map((p) =>
        p.id === sourcePage.id ? sourcePage : p.id === destPage.id ? destPage : p
      );

      const updatedBook = {
        ...book,
        pages,
        chapters: book.chapters.map((ch) =>
          ch.id === page.chapterId
            ? { ...ch, pageIds: pages.filter((p) => p.chapterId === ch.id).map((p) => p.id) }
            : ch
        ),
      };

      set((state) => ({
        books: state.books.map((b) => (b.id === book.id ? updatedBook : b)),
        elements: updatedElements,
      }));

      get().saveToStorage();
      get().evaluateActivePageOverflow();
      useUiStore.getState().showToast({
        type: "success",
        title: "Content flowed to next page",
        message: `${overflowingElements.length} element${overflowingElements.length > 1 ? "s" : ""} moved to page ${destPage.displayNumber || pageIndex + 2}. Page overflow resolved.`,
      });
    },

    savePublicationPreset: (name, elementId, category) => {
      const el=get().elements[elementId];if(!el?.smartBlockData)return;
      const id=crypto.randomUUID();
      set(state=>({publicationPresets:{...state.publicationPresets,[id]:{name:name.trim()||el.smartBlockData!.semanticContent.title,category,block:structuredClone(el.smartBlockData?.curriculum ? curriculumSource(el)! : {...el.smartBlockData!,transform:el.transform})}}}));get().saveToStorage();
      useUiStore.getState().showToast({type:"success",title:"Template saved",message:"Available in the library under My templates."});
    },
    insertPublicationPreset: (presetId) => {
      const saved = get().publicationPresets[presetId];
      if (!saved) return;
      if(saved.block.presetId.startsWith('edu-')){
        const destination=get().getActiveBook();if(!destination)return;
        const contextual={...structuredClone(saved.block),subject:resolveBookSubject(destination.subject),gradeBand:resolveBookGrade(destination.grade)};
        duplicateEducationalBlock({id:saved.block.id,pageId:saved.block.pageId,type:'smart-block',category:'educational',version:4,displayName:saved.name,presetId:saved.block.presetId,smartBlockData:contextual,transform:saved.block.transform,style:{},content:{},locked:false,hidden:false},saved.block.presetId,saved.name);
        return;
      }
      if (saved.block.curriculum) { insertCurriculumBlock(saved.block.curriculum.type, undefined, undefined, undefined, saved.block); return; }
      const book = get().getActiveBook();
      if (!book) return;
      let page = get().getActivePage();
      if (!page) return;
      const margins = pageMarginsFor(book,page);
      const activeElements = get().getActivePageElements();
      const bottom = activeElements.reduce(
        (y, el) => (el.category === "decorative" || el.hidden ? y : Math.max(y, el.transform.y + el.transform.height + 18)),
        margins.topPt
      );
      const block = structuredClone(saved.block);
      block.transform.width = Math.min(block.transform.width, book.dimensions.widthPt - margins.insidePt - margins.outsidePt);
      block.id = crypto.randomUUID();
      const height = buildPublicationScene(block).height;
      let y = bottom;
      if (bottom + height > book.dimensions.heightPt - margins.bottomPt && activeElements.length) {
        get().addPage();
        page = get().getActivePage()!;
        y = margins.topPt;
        useUiStore.getState().showToast({
          type: "info",
          title: "Continued on a new page",
          message: "The template needed more room. Your existing page is preserved.",
        });
      }
      block.pageId = page.id;
      block.transform = {
        ...block.transform,
        x: margins.insidePt,
        y,
        height,
        zIndex: Math.max(0, ...get().getActivePageElements().map((e) => e.transform.zIndex)) + 1,
      };
      get().insertPublicationElement({
        id: block.id,
        pageId: page.id,
        type: "smart-block",
        category: "educational",
        version: 3,
        displayName: saved.name,
        presetId: block.presetId,
        transform: block.transform,
        style: {},
        content: {},
        smartBlockData: block,
        locked: false,
        hidden: false,
      });
    },
    insertPublicationElement: (element) => {
      const page=get().getActivePage(),book=get().getActiveBook();if(!page||!book)return;
      const el={...element,pageId:page.id};
      const apply=(forward:boolean)=>{set(state=>{const elements={...state.elements};if(forward)elements[el.id]=el;else delete elements[el.id];return {elements,books:state.books.map(b=>b.id===book.id?{...b,pages:b.pages.map(p=>p.id===page.id?{...p,elementIds:forward?[...p.elementIds.filter(id=>id!==el.id),el.id]:p.elementIds.filter(id=>id!==el.id)}:p)}:b),selectedElementIds:forward?[el.id]:[]};});get().saveToStorage();};
      apply(true);useHistoryStore.getState().pushAction({description:`Insert ${el.displayName}`,undo:()=>apply(false),redo:()=>apply(true)});
    },
    insertElement: (element) => {
      get().insertPublicationElement(element);
    },

    createCustomLayoutFromSelection: (name, category = "general", description = "", placeholders) => {
      const selectedIds = get().selectedElementIds;
      if (selectedIds.length === 0) return null;
      const allElements = get().elements;
      const page = get().getActivePage();
      const book = get().getActiveBook();
      if (!page || !book) return null;

      const targetElements: PageElement[] = [];
      selectedIds.forEach((id) => {
        const el = allElements[id];
        if (!el) return;
        if (el.type === "group" && el.childElementIds?.length) {
          el.childElementIds.forEach((cId) => {
            if (allElements[cId]) targetElements.push(allElements[cId]);
          });
        } else {
          targetElements.push(el);
        }
      });

      if (targetElements.length === 0) return null;

      const minX = Math.min(...targetElements.map((el) => el.transform.x));
      const minY = Math.min(...targetElements.map((el) => el.transform.y));

      const autoPlaceholders: CustomLayoutPlaceholder[] = placeholders || [];
      if (!placeholders || placeholders.length === 0) {
        targetElements.forEach((el, idx) => {
          if (el.type === "heading" || el.type === "chapter-title") {
            autoPlaceholders.push({
              elementId: el.id,
              key: `heading_${idx}`,
              label: el.displayName || "Heading Text",
              type: "text",
              defaultValue: el.content.text || "",
            });
          } else if (el.type === "body" || el.type === "body-text" || el.type === "quote") {
            autoPlaceholders.push({
              elementId: el.id,
              key: `body_${idx}`,
              label: el.displayName || "Body Text",
              type: "text",
              defaultValue: el.content.text || "",
            });
          } else if (el.type === "image" || el.type === "illustration") {
            autoPlaceholders.push({
              elementId: el.id,
              key: `image_${idx}`,
              label: el.displayName || "Image",
              type: "image",
              defaultValue: el.content.url || el.content.src || "",
            });
          }
        });
      }

      const normalizedElements = targetElements.map((el) => ({
        ...structuredClone(el),
        transform: {
          ...el.transform,
          x: el.transform.x - minX,
          y: el.transform.y - minY,
        },
      }));

      const layoutId = `layout-custom-${Date.now()}`;
      const layoutDef: CustomLayoutDefinition = {
        id: layoutId,
        name: name.trim() || "Custom Layout",
        category,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pageDimensions: {
          widthPt: book.dimensions.widthPt,
          heightPt: book.dimensions.heightPt,
        },
        elements: normalizedElements,
        placeholders: autoPlaceholders,
        tags: [category, "custom"],
      };

      set((state) => ({
        userCustomLayouts: {
          ...state.userCustomLayouts,
          [layoutId]: layoutDef,
        },
      }));

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: "Layout Created",
        message: `Saved "${layoutDef.name}" to Layout Library with ${normalizedElements.length} elements`,
      });

      return layoutDef;
    },

    insertCustomLayout: (layoutId, targetX, targetY) => {
      const layout = get().userCustomLayouts[layoutId];
      if (!layout || layout.elements.length === 0) return [];
      const page = get().getActivePage();
      const book = get().getActiveBook();
      if (!page || !book) return [];

      const layoutWidth = Math.max(...layout.elements.map((el) => el.transform.x + el.transform.width));
      const layoutHeight = Math.max(...layout.elements.map((el) => el.transform.y + el.transform.height));

      const posX = targetX ?? Math.max(54, Math.round((book.dimensions.widthPt - layoutWidth) / 2));
      const posY = targetY ?? Math.max(100, Math.round((book.dimensions.heightPt - layoutHeight) / 2));

      const idMap: Record<string, string> = {};
      const newElements: Record<string, PageElement> = {};
      const newElementIds: string[] = [];
      const activeElements = get().getActivePageElements();
      const baseZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);

      layout.elements.forEach((sourceEl, idx) => {
        const newId = `el-${Math.random().toString(36).substring(2, 9)}`;
        idMap[sourceEl.id] = newId;
        newElementIds.push(newId);

        newElements[newId] = {
          ...structuredClone(sourceEl),
          id: newId,
          pageId: page.id,
          transform: {
            ...sourceEl.transform,
            x: posX + sourceEl.transform.x,
            y: posY + sourceEl.transform.y,
            zIndex: baseZ + 1 + idx,
          },
        };
      });

      newElementIds.forEach((id) => {
        const el = newElements[id];
        if (el.groupId && idMap[el.groupId]) {
          el.groupId = idMap[el.groupId];
        }
        if (el.childElementIds?.length) {
          el.childElementIds = el.childElementIds.map((cId) => idMap[cId] || cId);
        }
      });

      const apply = (forward: boolean) => {
        set((state) => {
          const els = { ...state.elements };
          if (forward) {
            Object.assign(els, newElements);
          } else {
            newElementIds.forEach((id) => delete els[id]);
          }
          return {
            elements: els,
            books: state.books.map((b) =>
              b.id === book.id
                ? {
                    ...b,
                    pages: b.pages.map((p) =>
                      p.id === page.id
                        ? {
                            ...p,
                            elementIds: forward
                              ? [...p.elementIds, ...newElementIds]
                              : p.elementIds.filter((id) => !newElementIds.includes(id)),
                          }
                        : p
                    ),
                  }
                : b
            ),
            selectedElementIds: forward ? newElementIds : [],
          };
        });
        get().saveToStorage();
      };

      apply(true);
      useHistoryStore.getState().pushAction({
        description: `Insert layout ${layout.name}`,
        undo: () => apply(false),
        redo: () => apply(true),
      });

      useUiStore.getState().showToast({
        type: "success",
        title: "Layout Inserted",
        message: `Placed "${layout.name}" (${newElementIds.length} elements)`,
      });

      return newElementIds;
    },

    deleteCustomLayout: (layoutId) => {
      set((state) => {
        const next = { ...state.userCustomLayouts };
        delete next[layoutId];
        return { userCustomLayouts: next };
      });
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "info",
        title: "Layout Removed",
      });
    },
    fitRenderedBlockHeight: (id, height) => {
      const el = get().elements[id];
      if (el?.smartBlockData?.styleOverrides.contentLayout?.enabled || el?.smartBlockData?.styleOverrides.resizeFrame) return;
      if (!el?.smartBlockData || el.groupId || isElementLocked(id, get().elements) || !Number.isFinite(height) || height <= el.transform.height + 1) return;
      
      const deltaHeight = height - el.transform.height;
      const transform = { ...el.transform, height };
      const book = get().getActiveBook();
      const page = book?.pages.find((p) => p.id === el.pageId);

      const nextElements: Record<string, PageElement> = {
        ...get().elements,
        [id]: { ...el, transform, smartBlockData: { ...el.smartBlockData!, transform } },
      };

      if (page) {
        const targetBottom = el.transform.y + el.transform.height;
        const pageElements = page.elementIds.map((eId) => nextElements[eId]).filter(Boolean);
        pageElements.forEach((other) => {
          if (other.id === id || other.locked || other.category === "decorative") return;
          if (other.transform.y >= targetBottom - 10) {
            const newY = Math.round((other.transform.y + deltaHeight) * 10) / 10;
            const updatedOtherTransform = { ...other.transform, y: newY };
            nextElements[other.id] = {
              ...other,
              transform: updatedOtherTransform,
              smartBlockData: other.smartBlockData
                ? { ...other.smartBlockData, transform: updatedOtherTransform }
                : undefined,
            };
          }
        });
      }

      set({ elements: nextElements });
      get().saveToStorage();
      get().evaluateActivePageOverflow();

      if (book && book.autoPagination !== false && page) {
        const margins = pageMarginsFor(book, page);
        const safeBottom = book.dimensions.heightPt - margins.bottomPt;
        const hasOverflow = page.elementIds.some((eId) => {
          const item = nextElements[eId];
          return (
            item &&
            !item.hidden &&
            !item.locked &&
            item.category !== "decorative" &&
            item.transform.y + item.transform.height > safeBottom + 4
          );
        });
        if (hasOverflow) {
          get().flowPageOverflowToNextPage(page.id);
        }
      }
    },

    commitTransformGesture: (before) => {
      const after=before.map(el=>get().elements[el.id]).filter(Boolean);
      if(!after.some((el,i)=>JSON.stringify(el.transform)!==JSON.stringify(before[i].transform)))return;
      const apply=(items:PageElement[])=>{set(state=>({elements:{...state.elements,...Object.fromEntries(items.map(el=>[el.id,el]))}}));get().saveToStorage();};
      useHistoryStore.getState().pushAction({description:"Move / resize artwork",undo:()=>apply(before),redo:()=>apply(after)});get().saveToStorage();
    },
    addPublicationPages: (templateId) => {
      const book=get().getActiveBook(); if(!book)return;
      const result=makePublicationPages(templateId,book,book.pages.length);
      const nextBook={...book,pages:[...book.pages,...result.pages]};
      const apply=(forward:boolean)=>{
        set(state=>{const next={...state.elements};for(const [id,el] of Object.entries(result.elements)) {if(forward)next[id]=el;else delete next[id];}
          return {elements:next,books:state.books.map(b=>b.id===book.id?(forward?nextBook:book):b),activePageIndex:forward?book.pages.length:Math.max(0,book.pages.length-1),selectedElementIds:[]};});get().saveToStorage();};
      apply(true);useHistoryStore.getState().pushAction({description:"Insert publication pages",undo:()=>apply(false),redo:()=>apply(true)});
    },
    createPublicationDemo: () => {
      const result=makePublicationDemo();
      set(state=>({books:[...state.books,result.book],elements:{...state.elements,...result.elements},activeBookId:result.book.id,activePageIndex:0,selectedElementIds:[]}));
      get().saveToStorage();
      useUiStore.getState().showToast({type:"success",title:"Sample book created",message:`${result.book.pages.length} editable pages. Existing books are preserved.`});
    },
    addPublicationArtwork: (kind, x=54, y=80) => {
      const page=get().getActivePage();if(!page)return;
      get().insertPublicationElement({id:crypto.randomUUID(),pageId:page.id,type:"illustration",category:"decorative",version:2,displayName:`Artwork · ${kind}`,locked:false,hidden:false,style:{opacity:1},transform:{x,y,width:200,height:170,rotation:0,zIndex:Math.max(0,...get().getActivePageElements().map(e=>e.transform.zIndex))+1},content:{artwork:{kind,paletteId:"indigo"},scope:"free",provenance:"Original NEX vector artwork"}});
    },

    // Math Smart Component Engine Actions
    addMathElement: (templateId, initialX, initialY, customData, styleVariant = "color-coded") => {
      const page = get().getActivePage();
      const book = get().getActiveBook();
      const template = getMathTemplate(templateId);
      if (!page || !book || !template) return null;

      const activeElements = get().getActivePageElements();
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);
      const id = `el-math-${Math.random().toString(36).substring(2, 9)}`;

      const targetX = initialX !== undefined ? initialX : Math.max(40, Math.round((book.dimensions.widthPt - template.defaultWidth) / 2));
      const targetY = initialY !== undefined ? initialY : 140;

      const dataPayload = customData || template.defaultData;

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "math-component",
        category: "math",
        version: 1,
        displayName: template.name,
        presetId: template.id,
        transform: {
          x: targetX,
          y: targetY,
          width: template.defaultWidth,
          height: template.defaultHeight,
          rotation: 0,
          zIndex: maxZ + 1,
        },
        style: {
          backgroundColor: "transparent",
        },
        content: {
          mathTemplateId: template.id,
          mathData: structuredClone(dataPayload),
          mathMode: "teacher",
          styleVariant,
          ...dataPayload,
        },
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      useHistoryStore.getState().pushAction({
        description: `Add ${template.name}`,
        undo: () => {
          set((s) => {
            const next = { ...s.elements };
            delete next[id];
            return {
              elements: next,
              books: s.books.map((b) =>
                b.id === s.activeBookId
                  ? {
                      ...b,
                      pages: b.pages.map((p) =>
                        p.id === page.id ? { ...p, elementIds: p.elementIds.filter((elId) => elId !== id) } : p
                      ),
                    }
                  : b
              ),
              selectedElementIds: [],
            };
          });
        },
        redo: () => {
          set((s) => ({
            elements: { ...s.elements, [id]: newElement },
            books: s.books.map((b) =>
              b.id === s.activeBookId
                ? {
                    ...b,
                    pages: b.pages.map((p) =>
                      p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                    ),
                  }
                : b
            ),
            selectedElementIds: [id],
          }));
        },
      });

      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "success",
        title: `Added ${template.name}`,
      });
      return newElement;
    },

    // Educational Smart Block Actions
    addEducationalBlock: (blockId, initialX, initialY, options) => {
      const book = get().getActiveBook();
      const page = get().getActivePage();
      const def = EDUCATIONAL_BLOCK_REGISTRY[blockId];
      if (!book || !page || !def) return null;

      let smartBlock = createSmartBlockInstance(blockId, page.id);
      if (!smartBlock) return null;

      if (blockId.startsWith("edu-")) { smartBlock.subject = resolveBookSubject(book.subject); smartBlock.gradeBand = resolveBookGrade(book.grade); }
      if (options?.subject && options.subject !== "all" && def.supportedSubjects.includes("general")) {
        smartBlock = withSubjectExample(smartBlock, options.subject as SubjectDomain);
      }
      if (options?.grade && options.grade !== "all") {
        smartBlock.gradeBand = options.grade as GradeBand;
      }

      const margins = pageMarginsFor(book,page);
      const fullWidth = book.dimensions.widthPt - margins.insidePt - margins.outsidePt;
      if (blockId.startsWith("edu-") && fullWidth < 180) {
        useUiStore.getState().showToast({type:"warning",title:"Page is too narrow",message:"Publishing blocks need at least 180 pt of usable page width. Increase the page width or reduce its margins before inserting."});
        return null;
      }
      smartBlock.transform.width = fullWidth;
      const height = buildPublicationScene({ ...smartBlock, transform: { ...smartBlock.transform, height: 0 } }).height;
      smartBlock.transform.height = height;

      const activeElements = get().getActivePageElements();
      const bottom = activeElements.reduce(
        (y, el) => (el.category === "decorative" || el.hidden ? y : Math.max(y, el.transform.y + el.transform.height + 18)),
        margins.topPt
      );

      if (height > book.dimensions.heightPt - margins.topPt - margins.bottomPt) {
        useUiStore.getState().showToast({type:"warning",title:"Block needs more room",message:"Choose a wider page or a compact variant before inserting. The reading type will not be reduced."});
        return null;
      }
      const targetX = initialX !== undefined ? Math.max(margins.insidePt, Math.min(initialX, book.dimensions.widthPt - margins.outsidePt - fullWidth)) : margins.insidePt;
      const requestedY = Math.max(margins.topPt, initialY ?? bottom);
      const collides = activeElements.some(el => el.category !== "decorative" && !el.hidden && targetX < el.transform.x + el.transform.width && targetX + fullWidth > el.transform.x && requestedY < el.transform.y + el.transform.height + 12 && requestedY + height + 12 > el.transform.y);
      const targetY = collides ? bottom : requestedY;

      const pageBottom = book.dimensions.heightPt - margins.bottomPt;
      const isOverflow = targetY + height > pageBottom;

      recordEducationalPreset(blockId);
      const id = smartBlock.id;
      const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);
      smartBlock.transform.zIndex = maxZ + 1;

      if (isOverflow) {
        // Atomic continuation page creation: page + element in a single history action
        const newPageId = `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newPage: PageDefinition = {
          id: newPageId,
          pageIndex: book.pages.length,
          displayNumber: `${book.pages.length + 1}`,
          elementIds: [id],
          status: "Draft",
        };
        smartBlock.pageId = newPageId;
        smartBlock.transform.x = margins.insidePt;
        smartBlock.transform.y = margins.topPt;

        const newElement: PageElement = {
          id,
          pageId: newPageId,
          type: "smart-block",
          category: "educational",
          version: def.version || 3,
          displayName: def.name,
          presetId: def.id,
          smartBlockData: smartBlock,
          transform: {
            x: margins.insidePt,
            y: margins.topPt,
            width: fullWidth,
            height,
            rotation: 0,
            zIndex: 1,
          },
          style: {
            backgroundColor: def.defaultBackgroundStyle.color || "#ffffff",
            borderRadius: def.defaultBackgroundStyle.cornerRadiusPt || 8,
          },
          content: {teacherOnly:def.educationalType==="teacher-note"},
          locked: false,
          hidden: false,
        };

        const previousBooks = get().books;
        const previousPageIndex = get().activePageIndex;
        const newPageIndex = book.pages.length;

        set((state) => ({
          elements: { ...state.elements, [id]: newElement },
          books: state.books.map((b) =>
            b.id === state.activeBookId
              ? { ...b, pages: [...b.pages, newPage] }
              : b
          ),
          activePageIndex: newPageIndex,
          selectedElementIds: [id],
        }));

        useHistoryStore.getState().pushAction({
          description: `Add ${def.name} on continuation page`,
          undo: () => {
            set((s) => {
              const next = { ...s.elements };
              delete next[id];
              return {
                elements: next,
                books: previousBooks,
                activePageIndex: previousPageIndex,
                selectedElementIds: [],
              };
            });
            get().saveToStorage();
          },
          redo: () => {
            set((s) => ({
              elements: { ...s.elements, [id]: newElement },
              books: s.books.map((b) =>
                b.id === s.activeBookId
                  ? { ...b, pages: [...b.pages, newPage] }
                  : b
              ),
              activePageIndex: newPageIndex,
              selectedElementIds: [id],
            }));
            get().saveToStorage();
          },
        });

        get().saveToStorage();
        useUiStore.getState().showToast({
          type: "info",
          title: "Continued on a new page",
          message: "The layout needed more room. Your existing page is preserved.",
        });

        return newElement;
      }

      // Fits on active page
      smartBlock.pageId = page.id;
      smartBlock.transform.x = targetX;
      smartBlock.transform.y = targetY;

      const newElement: PageElement = {
        id,
        pageId: page.id,
        type: "smart-block",
        category: "educational",
        version: def.version || 3,
        displayName: def.name,
        transform: {
          x: targetX,
          y: targetY,
          width: fullWidth,
          height,
          rotation: 0,
          zIndex: maxZ + 1,
        },
        style: {
          backgroundColor: def.defaultBackgroundStyle.color || "#ffffff",
          borderRadius: def.defaultBackgroundStyle.cornerRadiusPt || 8,
        },
        content: {teacherOnly:def.educationalType==="teacher-note"},
        presetId: def.id,
        smartBlockData: smartBlock,
        locked: false,
        hidden: false,
      };

      set((state) => ({
        elements: { ...state.elements, [id]: newElement },
        books: state.books.map((b) =>
          b.id === state.activeBookId
            ? {
                ...b,
                pages: b.pages.map((p) =>
                  p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                ),
              }
            : b
        ),
        selectedElementIds: [id],
      }));

      useHistoryStore.getState().pushAction({
        description: `Add ${def.name}`,
        undo: () => {
          set((s) => {
            const next = { ...s.elements };
            delete next[id];
            return {
              elements: next,
              books: s.books.map((b) =>
                b.id === s.activeBookId
                  ? {
                      ...b,
                      pages: b.pages.map((p) =>
                        p.id === page.id ? { ...p, elementIds: p.elementIds.filter((elId) => elId !== id) } : p
                      ),
                    }
                  : b
              ),
              selectedElementIds: [],
            };
          });
          get().saveToStorage();
        },
        redo: () => {
          set((s) => ({
            elements: { ...s.elements, [id]: newElement },
            books: s.books.map((b) =>
              b.id === s.activeBookId
                ? {
                    ...b,
                    pages: b.pages.map((p) =>
                      p.id === page.id ? { ...p, elementIds: [...p.elementIds, id] } : p
                    ),
                  }
                : b
            ),
            selectedElementIds: [id],
          }));
          get().saveToStorage();
        },
      });

      useUiStore.getState().showToast({
        type: "success",
        title: "Block Placed",
        message: `${def.name} added to page ${page.displayNumber}`,
      });

      get().saveToStorage();
      return newElement;
    },

    shuffleEducationalBlockStyle: (elementId) => {
      const el=get().elements[elementId]; if(!el?.smartBlockData || isElementLocked(elementId, get().elements) || el.smartBlockData.isLockedDesign)return;
      if (el.smartBlockData.curriculum) { reshuffleCurriculumBlock(el); return; }
      const type = EDUCATIONAL_BLOCK_REGISTRY[el.smartBlockData.presetId]?.educationalType;
      const presets=getPresetsByArchetype(el.smartBlockData.archetypeId).filter(def=>!type || def.educationalType===type);
      const index=presets.findIndex(p=>p.id===el.smartBlockData!.presetId);
      if(presets.length>1)get().setEducationalBlockPreset(elementId,presets[(index+1)%presets.length].id);
    },
    setEducationalBlockPreset: (elementId, presetId) => {
      const el=get().elements[elementId],def=EDUCATIONAL_BLOCK_REGISTRY[presetId];
      if(!el?.smartBlockData || !def || isElementLocked(elementId, get().elements) || el.smartBlockData.isLockedDesign || def.archetypeId!==el.smartBlockData.archetypeId || (EDUCATIONAL_BLOCK_REGISTRY[el.smartBlockData.presetId]?.educationalType && def.educationalType !== EDUCATIONAL_BLOCK_REGISTRY[el.smartBlockData.presetId]?.educationalType))return;
      if (el.smartBlockData.curriculum) { if (presetId.startsWith("curriculum-")) convertBlock(el,presetId.slice(11)); return; }
      const kept=(el.smartBlockData.styleOverrides.motifs||[]).filter(motif=>motif.role==="plate"||motif.role==="photo"||motif.role==="illustration");
      const block:SmartBlockInstance={...el.smartBlockData,presetId,family:def.family,transform:{...el.transform,height:0},styleOverrides:{...el.smartBlockData.styleOverrides,layoutVariant:undefined,motifs:kept}};
      const height=block.styleOverrides.resizeFrame?el.transform.height:buildPublicationScene(block).height;
      get().updateElement(elementId,{smartBlockData:block,presetId,displayName:def.name,transform:{...el.transform,height}});
    },
    reSkinEducationalBlock: (elementId, subject) => {
      const el=get().elements[elementId];if(!el?.smartBlockData || isElementLocked(elementId, get().elements) || el.smartBlockData.isLockedDesign)return;
      get().updateElement(elementId,{smartBlockData:el.smartBlockData.presetId.startsWith("edu-") ? {...el.smartBlockData,subject,styleOverrides:{...el.smartBlockData.styleOverrides,paletteId:undefined,customPalette:undefined}} : reSkinBlockSubject(el.smartBlockData,subject)});
    },
    updateBlockContentLayout: (elementId, layout) => {
      const state = get();
      const el = state.elements[elementId];
      const block = el?.smartBlockData;
      if (!block || isElementLocked(elementId, state.elements) || block.isLockedDesign) return;
      if (block.isLockedContent && Object.entries(layout.items).some(([id, item]) => item.text !== block.styleOverrides.contentLayout?.items[id]?.text || item.src !== block.styleOverrides.contentLayout?.items[id]?.src)) return;
      const meta = block.curriculum;
      const sourceId = meta?.sourceBlockId || block.id;
      const before = Object.values(state.elements).filter(item => item.id === elementId || (meta?.chapterId && item.smartBlockData?.curriculum?.chapterId === meta.chapterId && (item.smartBlockData.curriculum.sourceBlockId || item.smartBlockData.id) === sourceId));
      const after = before.map(item => ({ ...item, smartBlockData: { ...item.smartBlockData!, styleOverrides: { ...item.smartBlockData!.styleOverrides, contentLayout: layout } } }));
      const booksBefore = state.books;
      // Mirror authored layout into the curriculum source without recomposing or moving pages.
      const booksAfter = state.books.map(book => ({ ...book, chapters: book.chapters.map(chapter => {
        const source = chapter.id === meta?.chapterId ? chapter.framework?.blocks[sourceId] : undefined;
        if (!source || !chapter.framework) return chapter;
        return { ...chapter, framework: { ...chapter.framework, blocks: { ...chapter.framework.blocks, [sourceId]: { ...source, styleOverrides: { ...source.styleOverrides, contentLayout: layout } } } } };
      }) }));
      const apply = (items: PageElement[], books: Book[]) => {
        set(current => ({ books, elements: { ...current.elements, ...Object.fromEntries(items.map(item => [item.id, item])) } }));
        get().saveToStorage();
      };
      apply(after, booksAfter);
      useHistoryStore.getState().pushAction({ description: "Edit block contents", undo: () => apply(before, booksBefore), redo: () => apply(after, booksAfter) });
    },
    updateSmartBlockContent: (elementId, partialContent) => {
      const el=get().elements[elementId];if(!el?.smartBlockData || isElementLocked(elementId, get().elements) || el.smartBlockData.isLockedContent)return;
      const chapter = el.smartBlockData.curriculum?.chapterId ? get().getActiveBook()?.chapters.find(c => c.id === el.smartBlockData!.curriculum!.chapterId) : undefined;
      if (chapter?.framework || el.smartBlockData.styleOverrides.referenceElement || el.smartBlockData.curriculum?.type === "lesson-schema" || el.smartBlockData.curriculum?.type === "learning-outcomes") {
        editCurriculumBlock(el, "Edit curriculum content", b => ({ ...b, semanticContent: { ...b.semanticContent, ...partialContent } }));
        return;
      }
      const block={...el.smartBlockData,transform:{...el.transform,height:0},semanticContent:{...el.smartBlockData.semanticContent,...partialContent}};
      get().updateElement(elementId,{smartBlockData:block,transform:{...el.transform,height:block.styleOverrides.resizeFrame?el.transform.height:buildPublicationScene(block).height}});
    },
    updateSmartBlockStyle: (elementId, partialStyle) => {
      const el=get().elements[elementId];if(!el?.smartBlockData || isElementLocked(elementId, get().elements) || el.smartBlockData.isLockedDesign)return;
      const chapter = el.smartBlockData.curriculum?.chapterId ? get().getActiveBook()?.chapters.find(c => c.id === el.smartBlockData!.curriculum!.chapterId) : undefined;
      if (chapter?.framework || el.smartBlockData.styleOverrides.referenceElement || el.smartBlockData.curriculum?.type === "lesson-schema" || el.smartBlockData.curriculum?.type === "learning-outcomes") {
        editCurriculumBlock(el, "Edit curriculum style", b => ({ ...b, styleOverrides: { ...b.styleOverrides, ...partialStyle } }));
        return;
      }
      const block={...el.smartBlockData,transform:{...el.transform,height:0},styleOverrides:{...el.smartBlockData.styleOverrides,...partialStyle}};
      get().updateElement(elementId,{smartBlockData:block,transform:{...el.transform,height:block.styleOverrides.resizeFrame?el.transform.height:buildPublicationScene(block).height}});
    },
    setBlockMotifs: (elementId, motifs) => {
      const el=get().elements[elementId];if(!el?.smartBlockData || isElementLocked(elementId, get().elements) || el.smartBlockData.isLockedDesign)return;
      const block={...el.smartBlockData,transform:{...el.transform,height:0},styleOverrides:{...el.smartBlockData.styleOverrides,motifs}};
      const height=block.styleOverrides.resizeFrame?el.transform.height:buildPublicationScene(block).height;
      block.transform={...el.transform,height};
      set(state=>({elements:{...state.elements,[elementId]:{...el,transform:block.transform,smartBlockData:block}}}));
    },
    commitBlockMotifs: (elementId, before) => {
      const current=get().elements[elementId]; if(!current) return;
      if (current.smartBlockData?.curriculum?.chapterId) {
        set(state => ({ elements: { ...state.elements, [elementId]: before } }));
        editCurriculumBlock(before, "Move curriculum decoration", block => ({ ...block, styleOverrides: { ...block.styleOverrides, motifs: current.smartBlockData!.styleOverrides.motifs } }));
        return;
      }
      const apply=(value:PageElement)=>{set(state=>({elements:{...state.elements,[elementId]:value}})); get().saveToStorage();};
      useHistoryStore.getState().pushAction({description:"Move a plate",undo:()=>apply(before),redo:()=>apply(current)});
      get().saveToStorage();
    },

    detachEducationalBlock: (elementId: string) => {
      const page = get().getActivePage();
      const element = get().elements[elementId];
      if (!page || !element || !element.smartBlockData || isElementLocked(elementId, get().elements)) return [];
      if (element.smartBlockData.curriculum?.chapterId) {
        unlockCurriculumLayers(element);
        return Object.values(get().elements).filter(el => el.content.curriculumBlockId === (element.smartBlockData!.curriculum!.sourceBlockId || element.id)).map(el => el.id);
      }

      const detachedElements = detachSmartBlockToElements({...element.smartBlockData,transform:element.transform}, element.transform.zIndex);
      const detachedIds = detachedElements.map((e) => e.id);
      const detachedMap = Object.fromEntries(detachedElements.map((e) => [e.id, e]));

      const shiftCount = Math.max(0, detachedElements.length - 1);
      const originalZ = element.transform.zIndex;

      set((state) => {
        const nextElements = { ...state.elements, ...detachedMap };
        delete nextElements[elementId];
        // Shift any element that had higher zIndex than the block so it remains above the detached elements
        if (shiftCount > 0) {
          page.elementIds.forEach((id) => {
            if (id !== elementId && nextElements[id] && nextElements[id].transform.zIndex > originalZ) {
              nextElements[id] = {
                ...nextElements[id],
                transform: {
                  ...nextElements[id].transform,
                  zIndex: nextElements[id].transform.zIndex + shiftCount,
                },
              };
            }
          });
        }

        return {
          elements: nextElements,
          books: state.books.map((b) =>
            b.id === state.activeBookId
              ? {
                  ...b,
                  pages: b.pages.map((p) =>
                    p.id === page.id
                      ? {
                          ...p,
                          elementIds: p.elementIds.flatMap((id) => (id === elementId ? detachedIds : [id])),
                        }
                      : p
                  ),
                }
              : b
          ),
          selectedElementIds: detachedIds,
        };
      });

      useHistoryStore.getState().pushAction({
        description: `Detach ${element.displayName}`,
        undo: () => {
          set((s) => {
            const next = { ...s.elements, [elementId]: element };
            detachedIds.forEach((dId) => delete next[dId]);
            // Reverse the zIndex shift for higher elements
            if (shiftCount > 0) {
              page.elementIds.forEach((id) => {
                if (id !== elementId && next[id] && next[id].transform.zIndex > originalZ) {
                  next[id] = {
                    ...next[id],
                    transform: {
                      ...next[id].transform,
                      zIndex: Math.max(originalZ + 1, next[id].transform.zIndex - shiftCount),
                    },
                  };
                }
              });
            }

            return {
              elements: next,
              books: s.books.map((b) =>
                b.id === s.activeBookId
                  ? {
                      ...b,
                      pages: b.pages.map((p) => {
                        if (p.id !== page.id) return p;
                        const firstIdx = p.elementIds.findIndex((id) => detachedIds.includes(id));
                        const filtered = p.elementIds.filter((id) => !detachedIds.includes(id));
                        const restored = firstIdx >= 0
                          ? [...filtered.slice(0, firstIdx), elementId, ...filtered.slice(firstIdx)]
                          : [...filtered, elementId];
                        return { ...p, elementIds: restored };
                      }),
                    }
                  : b
              ),
              selectedElementIds: [elementId],
            };
          });
          get().saveToStorage();
        },
        redo: () => {
          set((state) => {
            const elements = { ...state.elements, ...detachedMap };
            delete elements[elementId];
            if (shiftCount > 0) {
              page.elementIds.forEach((id) => {
                if (id !== elementId && elements[id] && elements[id].transform.zIndex > originalZ) {
                  elements[id] = {
                    ...elements[id],
                    transform: {
                      ...elements[id].transform,
                      zIndex: elements[id].transform.zIndex + shiftCount,
                    },
                  };
                }
              });
            }
            return {
              elements,
              books: state.books.map((b) =>
                b.id === state.activeBookId
                  ? {
                      ...b,
                      pages: b.pages.map((p) =>
                        p.id === page.id
                          ? {
                              ...p,
                              elementIds: p.elementIds.flatMap((id) => (id === elementId ? detachedIds : [id])),
                            }
                          : p
                      ),
                    }
                  : b
              ),
              selectedElementIds: detachedIds,
            };
          });
          get().saveToStorage();
        },
      });

      useUiStore.getState().showToast({
        type: "success",
        title: "Block Detached",
        message: `Converted into ${detachedElements.length} editable primitives`,
      });

      return detachedIds;
    },

    resetToDemo: () => {
      const fresh = createDefaultDemoBook();
      set({
        books: [fresh.book],
        activeBookId: fresh.book.id,
        activePageIndex: 1,
        elements: fresh.elements,
        selectedElementIds: [],
      });
      get().saveToStorage();
      useUiStore.getState().showToast({
        type: "info",
        title: "Reset to Flagship Demo Book",
      });
    },
  };
});

if (typeof window !== "undefined") {
  useUiStore.subscribe((state, previous) => {
    if (state.userGuides === previous.userGuides) return;
    const editor = useEditorStore.getState(), book = editor.getActiveBook();
    if (!book || book.userGuides === state.userGuides) return;
    useEditorStore.setState({ books: editor.books.map(item => item.id === book.id ? { ...item, userGuides: state.userGuides } : item) });
    useEditorStore.getState().saveToStorage();
  });
  useHistoryStore.subscribe((state, previous) => {
    if(previous.isApplying && !state.isApplying) useEditorStore.getState().saveToStorage();
  });
}
