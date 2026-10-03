/**
 * NEX MAXX Book Studio - Comprehensive Preflight Quality Engine
 * 
 * Scans the complete book before export for:
 * 1. Text Overflow (overset text, bottom margin intrusion)
 * 2. Missing Fonts (unsupported glyphs, missing web fonts)
 * 3. Missing Assets (missing src, broken data URIs)
 * 4. Low Effective DPI (< 150 DPI warning, < 100 DPI critical error)
 * 5. Unsafe Margins (content placed too close to trim / gutter)
 * 6. Bleed Violations (backgrounds that don't reach full bleed)
 * 7. Broken References (invalid chapter/page cross-references)
 * 8. Invalid QR Placement (undersized QR, placed in spine gutter)
 * 9. Empty Frames (zero width/height, blank placeholders)
 * 10. Inconsistent Page Numbering (duplicate or skipped numbers)
 * 
 * Severity Levels: ERROR | WARNING | INFO
 */

import { Book, PageDefinition } from "../../domain/book/types";
import { PageElement } from "../../domain/element/types";
import { PreflightIssue, PreflightReport } from "../../domain/publishing/types";
import { calculateEffectiveDpi, PRINT_DPI_MINIMUM, PRINT_DPI_CRITICAL } from "../core/coordinates";
import { pageMarginsFor } from "../pageFrame/pageFrame";
import { smartQrPreflight } from "../media/smartQr";
import { compileBookStructure } from "../structure/bookStructureEngine";
import { printFont } from "./fontRegistry";
import { layoutTextFlow, textWrapObstacles } from "../layoutPartner/textWrapLayout";
import { estimateTextHeight } from "../core/layoutSolver";
import { renumberBookPages } from "../core/pageNumbering";
import { publicationPreflight } from "../educational/publicationPreflight";

export interface ComprehensivePreflightReport {
  timestamp: string;
  isValidForPrint: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: PreflightIssue[];
  metrics: {
    totalPages: number;
    totalElements: number;
    imageCount: number;
    lowDpiImageCount: number;
    textOverflowCount: number;
    emptyFrameCount: number;
    brokenRefCount: number;
  };
}

export function runFullPreflightScan(
  book: Book,
  elementsMap: Record<string, PageElement>
): ComprehensivePreflightReport {
  const issues: PreflightIssue[] = [];

  // Include existing publication preflight issues
  try {
    const pubIssues = publicationPreflight(book, elementsMap);
    issues.push(...pubIssues);
  } catch (error) {
    issues.push({ id: 'publication-scan-failed', severity: 'error', category: 'structure', title: 'Publication scan failed', message: error instanceof Error ? error.message : 'A damaged block could not be measured.' });
  }

  let totalElements = 0;
  let imageCount = 0;
  let lowDpiImageCount = 0;
  let textOverflowCount = 0;
  let emptyFrameCount = 0;
  let brokenRefCount = 0;

  const safeBottom = book.dimensions.heightPt - book.margins.bottomPt;
  const safeRight = book.dimensions.widthPt - book.margins.outsidePt;
  const safeLeft = book.margins.insidePt;
  const safeTop = book.margins.topPt;

  // Track page numbers to detect duplicate / inconsistent folios
  const seenPageNumbers = new Map<string, number>();

  const structure = compileBookStructure(book, elementsMap);
  const targetIds = new Set([...structure.questions.map(question => question.id), ...book.chapters.flatMap(chapter => Object.keys(chapter.framework?.blocks || {})),...book.pages.map(page => page.id), ...book.chapters.map(chapter => chapter.id), ...book.pages.flatMap(page => page.elementIds)]);
  const expectedPages = renumberBookPages(book).pages;
  book.pages.forEach((page, pageIdx) => {
    const master = book.masterPages?.find(master => master.id === page.masterPageId);
    const margins = pageMarginsFor(book, page);
    const safeTop = margins.topPt, safeBottom = book.dimensions.heightPt - margins.bottomPt;
    const safeLeft = page.pageIndex % 2 === 1 ? margins.outsidePt : margins.insidePt;
    const safeRight = book.dimensions.widthPt - (page.pageIndex % 2 === 1 ? margins.insidePt : margins.outsidePt);
    if (page.pageIndex !== pageIdx || page.displayNumber !== expectedPages[pageIdx].displayNumber) {
      issues.push({ id: `num-sequence-${page.id}`, severity: 'warning', category: 'structure', title: 'Page numbering is out of sequence', message: `Physical page ${pageIdx + 1} should display ${expectedPages[pageIdx].displayNumber}. Run the book structure synchronizer.`, pageIndex: pageIdx, pageId: page.id });
    }
    // 10. Check Inconsistent Page Numbering
    if (page.displayNumber && page.displayNumber !== "Cover") {
      if (seenPageNumbers.has(page.displayNumber)) {
        issues.push({
          id: `num-dup-${page.id}`,
          severity: "warning",
          category: "structure",
          title: `Duplicate Page Number '${page.displayNumber}'`,
          message: `Page ${pageIdx + 1} shares folio '${page.displayNumber}' with Page ${(seenPageNumbers.get(page.displayNumber) || 0) + 1}.`,
          pageIndex: pageIdx,
          pageId: page.id,
          remediation: "Renumber pages or verify chapter numbering sequence.",
        });
      } else {
        seenPageNumbers.set(page.displayNumber, pageIdx);
      }
    }

    // Check empty page
    if (page.elementIds.length === 0) {
      issues.push({
        id: `empty-page-${page.id}`,
        severity: "info",
        category: "structure",
        title: `Empty Page ${page.displayNumber}`,
        message: "Page has no content or elements placed.",
        pageIndex: pageIdx,
        pageId: page.id,
        remediation: "Add content or delete blank page before sending to press.",
      });
    }

    page.elementIds.forEach((elId) => {
      const el = elementsMap[elId];
      if (!el) { issues.push({ id: `missing-element-${elId}`, severity: 'error', category: 'structure', title: 'Missing page element', message: `Page references missing element ${elId}. Restore a recovery copy.`, pageId: page.id, pageIndex: pageIdx }); return; }
      if (el.hidden) return;
      totalElements++;

      const furniture = (page.importSource?.mode === 'artwork' && el.style.isBackgroundElement) || ['header', 'footer', 'pageNumber', 'page-number', 'shape', 'divider', 'borderFrame'].includes(el.type) || el.metadata?.tags?.includes('bleed-bg');
      const issue = (id: string, category: PreflightIssue['category'], title: string, message: string, severity: PreflightIssue['severity'] = 'error') => issues.push({ id: `${id}-${el.id}`, severity, category, title, message, elementId: el.id, pageId: page.id, pageIndex: pageIdx });
      if (![el.transform.x, el.transform.y, el.transform.width, el.transform.height].every(Number.isFinite)) issue('invalid-geometry', 'geometry', 'Invalid geometry', 'Element coordinates must be finite.');
      if (typeof el.content.text === 'string' && !el.smartBlockData && !furniture) {
        if (!el.content.text.trim()) issue('blank-text', 'text', 'Empty text frame', 'Add text or remove the empty frame.', 'warning');
        if (el.isOverset || (el.oversetChars || 0) > 0 || (el.metadata?.tags?.includes('manuscript-import')
          ? layoutTextFlow(el, textWrapObstacles(el, page.elementIds.map(id => elementsMap[id]).filter(Boolean))).oversetChars > 0
          : estimateTextHeight(el.content.text, el.style.fontSize || 10.5, el.style.lineHeight || 1.45, el.transform.width) > el.transform.height + 4)) {
          textOverflowCount++; issue('overset', 'text', 'Text overflows its frame', 'Increase the frame height or flow the text to a continuation page.');
        }
        try { printFont(el.content.text, el.style.fontFamily); } catch (error) { issue('missing-font', 'font', 'Font unavailable for print', String(error)); }
      }
      if (!furniture && (el.transform.x < safeLeft - 4 || el.transform.x + el.transform.width > safeRight + 4 || el.transform.y < safeTop - 4)) issue('unsafe-content', 'geometry', 'Content crosses safe margins', 'Move reading content inside the page margins.', 'warning');
      if (el.transform.x < -book.bleed.leftPt || el.transform.y < -book.bleed.topPt || el.transform.x + el.transform.width > book.dimensions.widthPt + book.bleed.rightPt || el.transform.y + el.transform.height > book.dimensions.heightPt + book.bleed.bottomPt) issue('outside-bleed', 'geometry', 'Element exceeds bleed bounds', 'Crop artwork to the bleed bounds.', 'warning');
      if (el.metadata?.tags?.includes('bleed-bg') && (el.transform.x > -book.bleed.leftPt || el.transform.y > -book.bleed.topPt || el.transform.x + el.transform.width < book.dimensions.widthPt + book.bleed.rightPt || el.transform.y + el.transform.height < book.dimensions.heightPt + book.bleed.bottomPt)) issue('short-bleed', 'geometry', 'Background does not reach bleed', 'Extend the background through every bleed edge.', 'warning');
      const referenceText = el.metadata?.referenceTemplate || el.content.text || '';
      for (const reference of referenceText.matchAll(/\{ref:(?:(?:chapter|page|figure|question):)?([^}]+)\}/g)) {
        if (!targetIds.has(reference[1])) { brokenRefCount++; issue('broken-reference', 'structure', 'Broken reference', `Target ${reference[1]} no longer exists.`); }
      }

      // 9. Check Empty Frames
      if (el.transform.width < 5 || el.transform.height < 5) {
        emptyFrameCount++;
        issues.push({
          id: `empty-frame-${el.id}`,
          severity: "warning",
          category: "geometry",
          title: `Zero-Dimension Frame '${el.displayName}'`,
          message: `Element has width ${el.transform.width}pt and height ${el.transform.height}pt.`,
          pageIndex: pageIdx,
          pageId: page.id,
          elementId: el.id,
          elementName: el.displayName,
          remediation: "Resize or delete empty frame.",
        });
      }

      // 1. Check Text Overflow & Margin Exceedance
      const elBottom = el.transform.y + el.transform.height;
      if (!furniture && elBottom > safeBottom + 4) {
        textOverflowCount++;
        issues.push({
          id: `overflow-${el.id}`,
          severity: "error",
          category: "text",
          title: `Content Exceeds Bottom Margin`,
          message: `'${el.displayName}' extends ${Math.round(elBottom - safeBottom)} pt into the bottom print-safe margin.`,
          pageIndex: pageIdx,
          pageId: page.id,
          elementId: el.id,
          elementName: el.displayName,
          remediation: "Use Auto-Pagination to flow content onto the next page.",
        });
      }

      // 5. Unsafe Margin Intrusion (Gutter / Trim Edge)
      if (el.transform.x < 10 && !el.metadata?.tags?.includes("bleed-bg")) {
        issues.push({
          id: `unsafe-margin-${el.id}`,
          severity: "warning",
          category: "geometry",
          title: `Element Too Close to Page Trim`,
          message: `'${el.displayName}' is within 10 pt of the page trim line. Content may be cut off during binding.`,
          pageIndex: pageIdx,
          pageId: page.id,
          elementId: el.id,
          elementName: el.displayName,
          remediation: "Move inside print-safe margin.",
        });
      }

      // 4. Low Effective DPI for Images
      if (el.type === "image") {
        imageCount++;
        if (el.content?.rawWidthPx) {
          const dpi = Math.min(calculateEffectiveDpi(el.content.rawWidthPx, el.transform.width), el.content.rawHeightPx ? calculateEffectiveDpi(el.content.rawHeightPx, el.transform.height) : Infinity) / Math.max(1, el.content.cropScale || 1);
          if (dpi < PRINT_DPI_CRITICAL) {
            lowDpiImageCount++;
            issues.push({
              id: `dpi-critical-${el.id}`,
              severity: "error",
              category: "resolution",
              title: `Critical Image Pixelation (${dpi} DPI)`,
              message: `'${el.displayName}' is ${dpi} DPI, below the 120 DPI press minimum.`,
              pageIndex: pageIdx,
              pageId: page.id,
              elementId: el.id,
              elementName: el.displayName,
              remediation: "Replace with higher resolution image asset (300 DPI recommended).",
            });
          } else if (dpi < PRINT_DPI_MINIMUM) {
            lowDpiImageCount++;
            issues.push({
              id: `dpi-suboptimal-${el.id}`,
              severity: "warning",
              category: "resolution",
              title: `Suboptimal Print Resolution (${dpi} DPI)`,
              message: `'${el.displayName}' is ${dpi} DPI. Standard offset printing targets 300 DPI.`,
              pageIndex: pageIdx,
              pageId: page.id,
              elementId: el.id,
              elementName: el.displayName,
              remediation: "Scale image container smaller on page or provide 300 DPI version.",
            });
          }
        }
      }

      // 3. Missing Assets
      if (el.type === "image" && (!el.content?.src || el.content.src.length === 0)) {
        issues.push({
          id: `missing-asset-${el.id}`,
          severity: "error",
          category: "asset",
          title: `Missing Image Asset '${el.displayName}'`,
          message: "Image element has no image source attached.",
          pageIndex: pageIdx,
          pageId: page.id,
          elementId: el.id,
          elementName: el.displayName,
          remediation: "Upload an image or delete the frame.",
        });
      }

      if (el.type === 'smart-media-qr') for (const [index, message] of smartQrPreflight(el, book.dimensions.widthPt, book.dimensions.heightPt).entries()) issue(`smart-qr-${index}`, 'asset', 'Smart QR needs attention', message);

      // 8. Invalid QR Placement
      if (el.type === "qrCode" || el.type === "smart-media-qr" || el.content?.smartComponentType === "qr-video") {
        if (el.transform.width < 36 || el.transform.height < 36) {
          issues.push({
            id: `qr-size-${el.id}`,
            severity: "error",
            category: "geometry",
            title: `QR Code Too Small for Print Scan`,
            message: `QR code '${el.displayName}' is ${Math.round(el.transform.width)} pt. Minimum scannable size is 36 pt (~0.5 in).`,
            pageIndex: pageIdx,
            pageId: page.id,
            elementId: el.id,
            elementName: el.displayName,
            remediation: "Enlarge QR code container to at least 40 × 40 pt.",
          });
        }
        if (el.transform.x < safeLeft - 6) {
          issues.push({
            id: `qr-gutter-${el.id}`,
            severity: "warning",
            category: "geometry",
            title: `QR Code in Binding Gutter`,
            message: `QR code '${el.displayName}' is located inside the inner gutter margin, which may prevent smartphone camera scanning.`,
            pageIndex: pageIdx,
            pageId: page.id,
            elementId: el.id,
            elementName: el.displayName,
            remediation: "Move QR code towards outer margin.",
          });
        }
      }

      // 7. Broken Cross-References
      if (typeof el.content?.text === "string" && el.content.text.includes("{ref:page:?")) {
        brokenRefCount++;
        issues.push({
          id: `broken-ref-${el.id}`,
          severity: "warning",
          category: "structure",
          title: `Broken Cross-Reference in '${el.displayName}'`,
          message: "Text contains an unresolvable cross-reference placeholder.",
          pageIndex: pageIdx,
          pageId: page.id,
          elementId: el.id,
          elementName: el.displayName,
          remediation: "Update cross-reference target or run structure synchronizer.",
        });
      }
    });
  });

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => (i.severity as string) === "info").length;

  return {
    timestamp: new Date().toISOString(),
    isValidForPrint: errorCount === 0,
    errorCount,
    warningCount,
    infoCount,
    issues,
    metrics: {
      totalPages: book.pages.length,
      totalElements,
      imageCount,
      lowDpiImageCount,
      textOverflowCount,
      emptyFrameCount,
      brokenRefCount,
    },
  };
}
