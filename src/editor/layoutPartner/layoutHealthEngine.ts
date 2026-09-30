import { PageElement, ElementTransform } from "../../domain/element/types";
import { PageDimensions, Margins } from "../../domain/book/types";

/**
 * NEX MAXX Book Studio - Layout Health Engine (Parts 9 & 25)
 * Deterministic scoring system (0 - 100) evaluating spacing, alignment,
 * orphans, contrast, image resolution, and print compliance.
 */

export interface LayoutHealthIssue {
  id: string;
  type:
    | "spacing-inconsistency"
    | "orphan-heading"
    | "margin-overflow"
    | "low-resolution-image"
    | "text-overflow"
    | "typographic-hierarchy"
    | "excessive-empty-space";
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  elementId?: string;
  fixable: boolean;
  suggestedAction: string;
}

export interface LayoutHealthReport {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "Needs Attention";
  issues: LayoutHealthIssue[];
  autoFixableCount: number;
  metrics: {
    spacingConsistency: number; // 0 - 100
    marginSafety: number;       // 0 - 100
    typographicBalance: number; // 0 - 100
    printResolution: number;    // 0 - 100
    contentFitting: number;     // 0 - 100
  };
}

/**
 * Evaluate the layout health of a page
 */
export function evaluateLayoutHealth(
  elements: PageElement[],
  pageDim: PageDimensions,
  margins: Margins
): LayoutHealthReport {
  const issues: LayoutHealthIssue[] = [];
  const safeLeft = margins.insidePt;
  const safeRight = pageDim.widthPt - margins.outsidePt;
  const safeTop = margins.topPt;
  const safeBottom = pageDim.heightPt - margins.bottomPt;

  let deductions = 0;

  // 1. Check Safe Margins & Boundary Compliance (Deduct up to 25 pts)
  let marginViolations = 0;
  elements.forEach((el) => {
    if (el.hidden) return;
    const isFullBleed = el.type === "image" && el.transform.width >= pageDim.widthPt - 2;
    if (isFullBleed) return; // Full bleed intentional images exempt

    const left = el.transform.x;
    const right = el.transform.x + el.transform.width;
    const top = el.transform.y;
    const bottom = el.transform.y + el.transform.height;

    if (left < safeLeft - 4 || right > safeRight + 4 || top < safeTop - 4 || bottom > safeBottom + 4) {
      marginViolations++;
      issues.push({
        id: `issue-margin-${el.id}`,
        type: "margin-overflow",
        severity: "warning",
        title: "Element outside print margin",
        description: `"${el.displayName}" penetrates past the safe print boundary. Content may be trimmed during commercial binding.`,
        elementId: el.id,
        fixable: true,
        suggestedAction: "Snap within safe print margin",
      });
    }
  });
  deductions += Math.min(25, marginViolations * 8);

  // 2. Orphan Heading Check (Deduct 15 pts)
  // A heading within 60pt of safeBottom without subsequent body text on the page
  const sortedByY = [...elements]
    .filter((e) => !e.hidden)
    .sort((a, b) => a.transform.y - b.transform.y);

  sortedByY.forEach((el, idx) => {
    if (["heading", "chapter-title", "lesson-title"].includes(el.type)) {
      const headingBottom = el.transform.y + el.transform.height;
      if (headingBottom > safeBottom - 70) {
        // Look for subsequent body element
        const subsequent = sortedByY.slice(idx + 1).find((e) => e.transform.y >= headingBottom);
        if (!subsequent || subsequent.transform.y + subsequent.transform.height > safeBottom) {
          issues.push({
            id: `issue-orphan-${el.id}`,
            type: "orphan-heading",
            severity: "error",
            title: "Orphan Heading at page bottom",
            description: `Heading "${el.displayName}" sits at the very bottom of the page without accompanying text.`,
            elementId: el.id,
            fixable: true,
            suggestedAction: "Move heading to next section or shift layout upward",
          });
          deductions += 15;
        }
      }
    }
  });

  // 3. Image DPI & Print Resolution Check (Deduct up to 20 pts)
  let lowDpiCount = 0;
  elements.forEach((el) => {
    if (el.type === "image" && el.content?.rawWidthPx) {
      const effectiveDpi = Math.round(el.content.rawWidthPx / (el.transform.width / 72));
      if (effectiveDpi < 180) {
        lowDpiCount++;
        issues.push({
          id: `issue-dpi-${el.id}`,
          type: "low-resolution-image",
          severity: "error",
          title: "Low Print Resolution (< 180 DPI)",
          description: `Image is ${effectiveDpi} DPI. Professional textbook printing requires at least 300 DPI (minimum 180 DPI acceptable).`,
          elementId: el.id,
          fixable: false,
          suggestedAction: "Replace with higher resolution asset or reduce display size",
        });
      } else if (effectiveDpi < 300) {
        issues.push({
          id: `issue-dpi-warn-${el.id}`,
          type: "low-resolution-image",
          severity: "info",
          title: "Moderate Print DPI (180–299 DPI)",
          description: `Image is ${effectiveDpi} DPI. Acceptable for digital, but 300 DPI recommended for press.`,
          elementId: el.id,
          fixable: false,
          suggestedAction: "Use 300 DPI asset for archival commercial quality",
        });
      }
    }
  });
  deductions += Math.min(20, lowDpiCount * 10);

  // 4. Spacing Inconsistency Check (Deduct up to 15 pts)
  if (sortedByY.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < sortedByY.length - 1; i++) {
      const currentBottom = sortedByY[i].transform.y + sortedByY[i].transform.height;
      const nextTop = sortedByY[i + 1].transform.y;
      const gap = nextTop - currentBottom;
      if (gap > 2 && gap < 120) gaps.push(Math.round(gap));
    }

    if (gaps.length >= 2) {
      const uniqueGaps = Array.from(new Set(gaps));
      if (uniqueGaps.length > 3) {
        issues.push({
          id: "issue-spacing-inconsistent",
          type: "spacing-inconsistency",
          severity: "warning",
          title: "Irregular Vertical Spacing",
          description: `Vertical gaps between elements vary irregularly (${uniqueGaps.slice(0, 4).join("pt, ")}pt).`,
          fixable: true,
          suggestedAction: "Normalize rhythm to standard 16pt / 20pt spacing",
        });
        deductions += 10;
      }
    }
  }

  // 5. Overall Content Fitting & Overflow Check (Deduct up to 25 pts)
  let maxBottom = 0;
  elements.forEach((el) => {
    if (!el.hidden) maxBottom = Math.max(maxBottom, el.transform.y + el.transform.height);
  });

  if (maxBottom > safeBottom + 4) {
    const overflowPt = Math.round(maxBottom - safeBottom);
    issues.push({
      id: "issue-content-overflow",
      type: "text-overflow",
      severity: "error",
      title: "Content exceeds page capacity",
      description: `Page content exceeds safe bottom margin by ${overflowPt} pt.`,
      fixable: true,
      suggestedAction: "Create next linked page or balance into two columns",
    });
    deductions += 20;
  }

  // Calculate final score
  const score = Math.max(20, Math.min(100, Math.round(100 - deductions)));
  let grade: LayoutHealthReport["grade"] = "A+";
  if (score < 60) grade = "Needs Attention";
  else if (score < 75) grade = "C";
  else if (score < 88) grade = "B";
  else if (score < 95) grade = "A";

  const autoFixableCount = issues.filter((i) => i.fixable).length;

  return {
    score,
    grade,
    issues,
    autoFixableCount,
    metrics: {
      spacingConsistency: Math.max(20, 100 - (issues.filter((i) => i.type === "spacing-inconsistency").length * 30)),
      marginSafety: Math.max(20, 100 - (marginViolations * 25)),
      typographicBalance: Math.max(20, 100 - (issues.filter((i) => i.type === "orphan-heading").length * 40)),
      printResolution: Math.max(20, 100 - (lowDpiCount * 35)),
      contentFitting: maxBottom > safeBottom ? 40 : 100,
    },
  };
}

/**
 * Automatically resolve fixable layout health issues
 */
export function autoFixLayoutHealthIssues(
  elements: PageElement[],
  pageDim: PageDimensions,
  margins: Margins
): {
  updatedTransforms: Record<string, Partial<ElementTransform>>;
  fixedCount: number;
} {
  const safeLeft = margins.insidePt;
  const safeRight = pageDim.widthPt - margins.outsidePt;
  const safeTop = margins.topPt;
  const safeBottom = pageDim.heightPt - margins.bottomPt;
  const usableWidth = safeRight - safeLeft;

  const updatedTransforms: Record<string, Partial<ElementTransform>> = {};
  let fixedCount = 0;

  // 1. Clamp margin overflow
  elements.forEach((el) => {
    if (el.hidden) return;
    const isFullBleed = el.type === "image" && el.transform.width >= pageDim.widthPt - 2;
    if (isFullBleed) return;

    let newX = el.transform.x;
    let newWidth = el.transform.width;
    let newY = el.transform.y;

    if (newX < safeLeft) {
      newX = safeLeft;
      fixedCount++;
    }
    if (newX + newWidth > safeRight) {
      newWidth = Math.min(newWidth, usableWidth);
      newX = Math.min(newX, safeRight - newWidth);
      fixedCount++;
    }
    if (newY < safeTop) {
      newY = safeTop;
      fixedCount++;
    }

    if (newX !== el.transform.x || newWidth !== el.transform.width || newY !== el.transform.y) {
      updatedTransforms[el.id] = { x: newX, y: newY, width: newWidth };
    }
  });

  // 2. Normalize vertical spacing rhythm
  const sorted = [...elements]
    .filter((e) => !e.hidden)
    .sort((a, b) => a.transform.y - b.transform.y);

  let currentY = safeTop;
  const standardGap = 16;

  sorted.forEach((el) => {
    const existing = updatedTransforms[el.id] || {};
    const effectiveH = el.transform.height;

    // Only align top-level sequential blocks
    if (el.transform.x <= safeLeft + 20) {
      if (Math.abs(el.transform.y - currentY) > 6 && currentY + effectiveH <= safeBottom) {
        updatedTransforms[el.id] = { ...existing, y: currentY };
        fixedCount++;
      }
      currentY += effectiveH + standardGap;
    }
  });

  return { updatedTransforms, fixedCount };
}
