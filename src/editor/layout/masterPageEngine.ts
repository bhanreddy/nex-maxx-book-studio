/**
 * NEX MAXX Book Studio - Master Page & Layout Presets Engine
 * 
 * Reusable master layouts for:
 * 1. Chapter Opening
 * 2. Lesson
 * 3. Standard Content
 * 4. Activity
 * 5. Exercise
 * 6. Worksheet
 * 7. Assessment
 * 8. Revision
 * 
 * Propagates master changes to linked pages while preserving page-specific overrides.
 */

import { Book, PageDefinition, Margins, MasterPageDefinition } from "../../domain/book/types";
import { PageElement } from "../../domain/element/types";

export type MasterPresetKind =
  | "ChapterOpen"
  | "Lesson"
  | "StandardContent"
  | "Activity"
  | "Exercise"
  | "Worksheet"
  | "Assessment"
  | "Revision";

export interface MasterPresetSpec {
  id: string;
  name: string;
  kind: MasterPresetKind;
  description: string;
  headerText: string;
  footerText: string;
  showPageNumber: boolean;
  pageNumberPosition: "left" | "center" | "right" | "outside";
  backgroundPreset?: string;
  margins: Margins;
  themeAccent: string;
  badgeLabel?: string;
  gridColumns: number;
}

export const MASTER_PAGE_PRESETS: Record<MasterPresetKind, MasterPresetSpec> = {
  ChapterOpen: {
    id: "master-chapter-open",
    name: "Chapter Opening",
    kind: "ChapterOpen",
    description: "Display chapter opening layout with prominent title zone, chapter number watermark, and learning targets.",
    headerText: "",
    footerText: "",
    showPageNumber: false,
    pageNumberPosition: "outside",
    backgroundPreset: "hero-gradient",
    margins: { topPt: 28, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#4f46e5",
    badgeLabel: "CHAPTER OPEN",
    gridColumns: 1,
  },
  Lesson: {
    id: "master-lesson",
    name: "Lesson Presentation",
    kind: "Lesson",
    description: "Structured lesson layout with topic banner, concept explanation columns, and quick check prompt.",
    headerText: "LESSON • CORE CONCEPTS",
    footerText: "NEX MAXX LEARNING SERIES",
    showPageNumber: true,
    pageNumberPosition: "outside",
    margins: { topPt: 36, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#059669",
    badgeLabel: "LESSON",
    gridColumns: 2,
  },
  StandardContent: {
    id: "master-standard-content",
    name: "Standard Editorial Content",
    kind: "StandardContent",
    description: "Balanced editorial reading layout with running header, folio, and flexible body grid.",
    headerText: "", // Dynamically inherits book/chapter title
    footerText: "",
    showPageNumber: true,
    pageNumberPosition: "outside",
    margins: { topPt: 36, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#2563eb",
    gridColumns: 1,
  },
  Activity: {
    id: "master-activity",
    name: "Hands-on Activity Lab",
    kind: "Activity",
    description: "Experiential learning layout with 3-phase Plan-Do-Share framework, materials list, and safety tips.",
    headerText: "ACTIVITY LAB • EXPLORE & DISCOVER",
    footerText: "RECORD YOUR FINDINGS",
    showPageNumber: true,
    pageNumberPosition: "outside",
    backgroundPreset: "activity-tint",
    margins: { topPt: 36, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#d97706",
    badgeLabel: "HANDS-ON",
    gridColumns: 2,
  },
  Exercise: {
    id: "master-exercise",
    name: "Guided Exercise & Practice",
    kind: "Exercise",
    description: "Numbered drill layout with graduated difficulty, clear question numbering, and working space.",
    headerText: "PRACTICE EXERCISES",
    footerText: "",
    showPageNumber: true,
    pageNumberPosition: "outside",
    margins: { topPt: 36, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#7c3aed",
    badgeLabel: "EXERCISE",
    gridColumns: 2,
  },
  Worksheet: {
    id: "master-worksheet",
    name: "Printable Worksheet",
    kind: "Worksheet",
    description: "Worksheet layout with Student Name / Date / Score header lines, ruled answer spaces, and clear borders.",
    headerText: "Name: ____________________ Date: _________ Score: ___/___",
    footerText: "",
    showPageNumber: true,
    pageNumberPosition: "center",
    margins: { topPt: 40, bottomPt: 36, insidePt: 36, outsidePt: 36 },
    themeAccent: "#475569",
    badgeLabel: "WORKSHEET",
    gridColumns: 1,
  },
  Assessment: {
    id: "master-assessment",
    name: "Summative Assessment",
    kind: "Assessment",
    description: "Evaluation layout with rubric scoring matrix, time allocation, and structured sections.",
    headerText: "CHAPTER ASSESSMENT • MAX MARKS: 25 • TIME: 40 MIN",
    footerText: "CHECK YOUR ANSWERS BEFORE SUBMISSION",
    showPageNumber: true,
    pageNumberPosition: "outside",
    margins: { topPt: 36, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#dc2626",
    badgeLabel: "ASSESSMENT",
    gridColumns: 1,
  },
  Revision: {
    id: "master-revision",
    name: "Revision & Quick Recap",
    kind: "Revision",
    description: "High-retention review layout with concept bullet cards, visual summary boxes, and formula reminders.",
    headerText: "CHAPTER RECAP • KEY TAKEAWAYS",
    footerText: "",
    showPageNumber: true,
    pageNumberPosition: "outside",
    backgroundPreset: "revision-mesh",
    margins: { topPt: 36, bottomPt: 36, insidePt: 42, outsidePt: 36 },
    themeAccent: "#0891b2",
    badgeLabel: "REVISION",
    gridColumns: 2,
  },
};

/**
 * Propagate changes from a master page definition to a linked page
 * Preserves user-created elements and explicit page-level margin overrides.
 */
export function propagateMasterToPage(
  master: MasterPageDefinition,
  page: PageDefinition,
  elementsMap: Record<string, PageElement>,
  book: Book
): {
  page: PageDefinition;
  updatedElements: Record<string, PageElement>;
  createdElements: PageElement[];
} {
  const updatedElements: Record<string, PageElement> = { ...elementsMap };
  const createdElements: PageElement[] = [];

  // 1. Update margins if not explicitly overridden by user
  const effectiveMargins = page.overrideMargins || master.margins;
  const updatedPage: PageDefinition = {
    ...page,
    masterPageId: master.id,
    masterPreset: master.type,
    elementIds: [...page.elementIds],
  };

  const isLeftPage = page.pageIndex % 2 === 1;
  const pageDim = book.dimensions;
  const insidePt = isLeftPage ? effectiveMargins.outsidePt : effectiveMargins.insidePt;
  const outsidePt = isLeftPage ? effectiveMargins.insidePt : effectiveMargins.outsidePt;
  const contentWidth = pageDim.widthPt - insidePt - outsidePt;

  // 2. Manage Running Header Element
  const existingHeaderId = page.elementIds.find((id) => {
    const el = updatedElements[id];
    return el && el.type === "header" && (el.content?.isMasterHeader || el.metadata?.tags?.includes("master-header"));
  });

  const chapter = book.chapters.find((c) => c.id === page.chapterId);
  const effectiveHeader = master.headerText || (chapter ? `Chapter ${chapter.number}: ${chapter.title}` : book.title);

  if (master.type !== "ChapterOpen" && effectiveHeader) {
    if (existingHeaderId && updatedElements[existingHeaderId]) {
      // Update existing header without overriding user styling if edited
      const existing = updatedElements[existingHeaderId];
      if (!existing.metadata?.styleOverride) {
        updatedElements[existingHeaderId] = {
          ...existing,
          content: { ...existing.content, text: effectiveHeader },
          transform: {
            ...existing.transform,
            x: insidePt,
            y: Math.max(12, effectiveMargins.topPt - 22),
            width: contentWidth,
            height: 16,
          },
        };
      }
    } else {
      // Create new running header element
      const headerId = `master-hdr-${page.id}`;
      const headerEl: PageElement = {
        id: headerId,
        pageId: page.id,
        type: "header",
        category: "text",
        version: 1,
        displayName: "Running Header",
        transform: {
          x: insidePt,
          y: Math.max(12, effectiveMargins.topPt - 22),
          width: contentWidth,
          height: 16,
          rotation: 0,
          zIndex: 1,
        },
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: 8.5,
          fontWeight: 600,
          color: "#64748b",
          textAlign: isLeftPage ? "left" : "right",
          letterSpacing: 0.5,
        },
        content: { text: effectiveHeader, isMasterHeader: true },
        locked: true,
        hidden: false,
        metadata: { tags: ["master-header", "running-header"] },
      };
      createdElements.push(headerEl);
      updatedElements[headerId] = headerEl;
      if (!updatedPage.elementIds.includes(headerId)) {
        updatedPage.elementIds.unshift(headerId);
      }
    }
  }

  // 3. Manage Running Footer & Page Number
  const existingNumberId = page.elementIds.find((id) => {
    const el = updatedElements[id];
    return el && el.type === "pageNumber" && (el.content?.isMasterFooter || el.metadata?.tags?.includes("master-folio"));
  });

  if (master.showPageNumber && page.displayNumber !== "Cover") {
    const posX =
      master.pageNumberPosition === "center"
        ? insidePt + contentWidth / 2 - 25
        : master.pageNumberPosition === "outside"
        ? isLeftPage ? insidePt : insidePt + contentWidth - 50
        : master.pageNumberPosition === "right" ? insidePt + contentWidth - 50 : insidePt;

    const align =
      master.pageNumberPosition === "center"
        ? "center"
        : master.pageNumberPosition === "outside"
        ? isLeftPage ? "left" : "right"
        : master.pageNumberPosition === "right" ? "right" : "left";

    if (existingNumberId && updatedElements[existingNumberId]) {
      const existing = updatedElements[existingNumberId];
      if (!existing.metadata?.styleOverride) {
        updatedElements[existingNumberId] = {
          ...existing,
          transform: {
            ...existing.transform,
            x: posX,
            y: pageDim.heightPt - Math.max(14, effectiveMargins.bottomPt - 12),
            width: 50,
            height: 16,
          },
          content: { ...existing.content, text: page.displayNumber },
          style: { ...existing.style, textAlign: align },
        };
      }
    } else {
      const folioId = `master-folio-${page.id}`;
      const folioEl: PageElement = {
        id: folioId,
        pageId: page.id,
        type: "pageNumber",
        category: "text",
        version: 1,
        displayName: "Page Number",
        transform: {
          x: posX,
          y: pageDim.heightPt - Math.max(14, effectiveMargins.bottomPt - 12),
          width: 50,
          height: 16,
          rotation: 0,
          zIndex: 1,
        },
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: 9,
          fontWeight: 600,
          color: "#475569",
          textAlign: align,
        },
        content: { text: page.displayNumber, isMasterFooter: true },
        locked: true,
        hidden: false,
        metadata: { tags: ["master-folio"] },
      };
      createdElements.push(folioEl);
      updatedElements[folioId] = folioEl;
      if (!updatedPage.elementIds.includes(folioId)) {
        updatedPage.elementIds.push(folioId);
      }
    }
  }

  // Remove obsolete generated furniture, preserving explicit local overrides.
  for (const id of [...updatedPage.elementIds]) {
    const el = updatedElements[id];
    if (!el || el.metadata?.styleOverride) continue;
    const tags = el.metadata?.tags || [];
    if ((tags.includes("master-header") && master.type === "ChapterOpen") ||
        (tags.includes("master-folio") && (!master.showPageNumber || page.displayNumber === "Cover")) ||
        (tags.includes("master-footer") && !master.footerText)) {
      updatedPage.elementIds = updatedPage.elementIds.filter(item => item !== id);
      delete updatedElements[id];
    }
  }
  if (master.footerText) {
    const id = `master-footer-${page.id}`;
    const existing = updatedElements[id];
    if (!existing?.metadata?.styleOverride) {
      const footer: PageElement = {
        id, pageId: page.id, type: "footer", category: "text", version: 1, displayName: "Running Footer",
        transform: { x: insidePt + 54, y: pageDim.heightPt - Math.max(20, effectiveMargins.bottomPt - 12), width: Math.max(20, contentWidth - 108), height: 16, rotation: 0, zIndex: 1 },
        style: { fontFamily: "Inter, sans-serif", fontSize: 8, color: "#64748b", textAlign: "center" },
        content: { text: master.footerText }, locked: true, hidden: false, metadata: { tags: ["master-footer"] },
      };
      updatedElements[id] = footer;
      if (!existing) createdElements.push(footer);
      if (!updatedPage.elementIds.includes(id)) updatedPage.elementIds.push(id);
    }
  }

  return {
    page: updatedPage,
    updatedElements,
    createdElements,
  };
}

/**
 * Propagate a master page definition to ALL pages in the book that link to it
 */
export function propagateMasterToLinkedPages(
  master: MasterPageDefinition,
  book: Book,
  elementsMap: Record<string, PageElement>
): {
  book: Book;
  elements: Record<string, PageElement>;
  affectedPagesCount: number;
} {
  let updatedBook = { ...book };
  let updatedElements = { ...elementsMap };
  let count = 0;

  const linkedPages = updatedBook.pages.filter((p) => p.masterPageId === master.id);

  for (const page of linkedPages) {
    const result = propagateMasterToPage(master, page, updatedElements, updatedBook);
    updatedElements = result.updatedElements;
    updatedBook = {
      ...updatedBook,
      pages: updatedBook.pages.map((p) => (p.id === page.id ? result.page : p)),
    };
    count++;
  }

  return {
    book: updatedBook,
    elements: updatedElements,
    affectedPagesCount: count,
  };
}
