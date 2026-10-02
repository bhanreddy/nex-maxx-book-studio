/**
 * NEX MAXX Book Studio - Professional Snapping & Constraint System
 *
 * Features:
 * - Magnetic alignment guides (page edges, margins, bleed, sibling objects)
 * - User guides snapping (horizontal & vertical)
 * - Column grid snapping & baseline grid snapping
 * - Equal-spacing detection (both vertical and horizontal)
 * - Parent & edge constraint solving
 */

import { Rect } from "./geometry";
import { Margins, Bleed, PageDimensions } from "../../domain/book/types";
import { ElementConstraints, ElementTransform } from "../../domain/element/types";

export interface SnapGuideLine {
  type: "vertical" | "horizontal";
  positionPt: number;
  startPt: number;
  endPt: number;
  label?: string;
  source: "page" | "margin" | "bleed" | "object" | "guide" | "column" | "baseline";
}

export interface SpacingIndicator {
  type: "horizontal" | "vertical";
  startPt: number;
  endPt: number;
  crossAxisPt: number;
  distancePt: number;
  label: string;
}

export interface UserGuideSpec {
  id: string;
  type: "horizontal" | "vertical";
  positionPt: number;
}

export interface ColumnGridConfig {
  columns: number;
  gutterPt: number;
}

export interface SnappingOptions {
  thresholdPt?: number;
  disabled?: boolean;
  userGuides?: UserGuideSpec[];
  columnGrid?: ColumnGridConfig;
  baselineGridPt?: number; // e.g. 12 pt
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuideLine[];
  spacingIndicators?: SpacingIndicator[];
}

export function computeSnapping(
  movingRect: Rect,
  otherRects: Rect[],
  pageDim: PageDimensions,
  margins: Margins,
  bleed: Bleed,
  thresholdPtOrOptions: number | SnappingOptions = 5,
  legacyDisabled: boolean = false
): SnapResult {
  const options: SnappingOptions =
    typeof thresholdPtOrOptions === "object"
      ? thresholdPtOrOptions
      : { thresholdPt: thresholdPtOrOptions, disabled: legacyDisabled };

  const thresholdPt = options.thresholdPt ?? 5;
  if (options.disabled) {
    return { x: movingRect.x, y: movingRect.y, guides: [], spacingIndicators: [] };
  }

  let snappedX = movingRect.x;
  let snappedY = movingRect.y;
  const guides: SnapGuideLine[] = [];

  const movingLeft = movingRect.x;
  const movingRight = movingRect.x + movingRect.width;
  const movingCenterX = movingRect.x + movingRect.width / 2;

  const movingTop = movingRect.y;
  const movingBottom = movingRect.y + movingRect.height;
  const movingCenterY = movingRect.y + movingRect.height / 2;

  // 1. Vertical targets (X coordinates)
  interface VTarget {
    x: number;
    source: "page" | "margin" | "bleed" | "object" | "guide" | "column";
    label?: string;
  }

  const vTargets: VTarget[] = [
    // Page boundaries
    { x: 0, source: "page", label: "Page Edge" },
    { x: pageDim.widthPt / 2, source: "page", label: "Center" },
    { x: pageDim.widthPt, source: "page", label: "Page Edge" },
    // Margins
    { x: margins.insidePt, source: "margin", label: "Margin" },
    { x: pageDim.widthPt - margins.outsidePt, source: "margin", label: "Margin" },
    // Bleed
    { x: -bleed.leftPt, source: "bleed", label: "Bleed" },
    { x: pageDim.widthPt + bleed.rightPt, source: "bleed", label: "Bleed" },
  ];

  // User Guides (Vertical)
  if (options.userGuides) {
    for (const ug of options.userGuides) {
      if (ug.type === "vertical") {
        vTargets.push({ x: ug.positionPt, source: "guide", label: `Guide ${Math.round(ug.positionPt)} pt` });
      }
    }
  }

  // Column Grid snapping
  if (options.columnGrid && options.columnGrid.columns > 1) {
    const colCount = options.columnGrid.columns;
    const gutter = options.columnGrid.gutterPt;
    const contentW = pageDim.widthPt - margins.insidePt - margins.outsidePt;
    const colW = (contentW - (colCount - 1) * gutter) / colCount;

    for (let c = 0; c < colCount; c++) {
      const colLeft = margins.insidePt + c * (colW + gutter);
      const colRight = colLeft + colW;
      vTargets.push({ x: colLeft, source: "column", label: `Col ${c + 1}` });
      vTargets.push({ x: colRight, source: "column", label: `Col ${c + 1} End` });
    }
  }

  // Sibling objects
  for (const r of otherRects) {
    vTargets.push({ x: r.x, source: "object" });
    vTargets.push({ x: r.x + r.width / 2, source: "object" });
    vTargets.push({ x: r.x + r.width, source: "object" });
  }

  // Check closest snap on X
  let minDiffX = thresholdPt;
  let snapTargetX: VTarget | null = null;
  let snapOffsetTypeX: "left" | "center" | "right" = "left";

  for (const target of vTargets) {
    const diffLeft = Math.abs(movingLeft - target.x);
    if (diffLeft < minDiffX) {
      minDiffX = diffLeft;
      snapTargetX = target;
      snapOffsetTypeX = "left";
    }
    const diffCenter = Math.abs(movingCenterX - target.x);
    if (diffCenter < minDiffX) {
      minDiffX = diffCenter;
      snapTargetX = target;
      snapOffsetTypeX = "center";
    }
    const diffRight = Math.abs(movingRight - target.x);
    if (diffRight < minDiffX) {
      minDiffX = diffRight;
      snapTargetX = target;
      snapOffsetTypeX = "right";
    }
  }

  if (snapTargetX) {
    if (snapOffsetTypeX === "left") {
      snappedX = snapTargetX.x;
    } else if (snapOffsetTypeX === "center") {
      snappedX = snapTargetX.x - movingRect.width / 2;
    } else {
      snappedX = snapTargetX.x - movingRect.width;
    }

    guides.push({
      type: "vertical",
      positionPt: snapTargetX.x,
      startPt: -bleed.topPt,
      endPt: pageDim.heightPt + bleed.bottomPt,
      label: snapTargetX.label,
      source: snapTargetX.source,
    });
  }

  // 2. Horizontal targets (Y coordinates)
  interface HTarget {
    y: number;
    source: "page" | "margin" | "bleed" | "object" | "guide" | "baseline";
    label?: string;
  }

  const hTargets: HTarget[] = [
    // Page boundaries
    { y: 0, source: "page", label: "Page Edge" },
    { y: pageDim.heightPt / 2, source: "page", label: "Center" },
    { y: pageDim.heightPt, source: "page", label: "Page Edge" },
    // Margins
    { y: margins.topPt, source: "margin", label: "Margin" },
    { y: pageDim.heightPt - margins.bottomPt, source: "margin", label: "Margin" },
    // Bleed
    { y: -bleed.topPt, source: "bleed", label: "Bleed" },
    { y: pageDim.heightPt + bleed.bottomPt, source: "bleed", label: "Bleed" },
  ];

  // User Guides (Horizontal)
  if (options.userGuides) {
    for (const ug of options.userGuides) {
      if (ug.type === "horizontal") {
        hTargets.push({ y: ug.positionPt, source: "guide", label: `Guide ${Math.round(ug.positionPt)} pt` });
      }
    }
  }

  // Baseline Grid
  if (options.baselineGridPt && options.baselineGridPt > 0) {
    const baselineStep = options.baselineGridPt;
    const startY = margins.topPt;
    const endY = pageDim.heightPt - margins.bottomPt;
    for (let by = startY; by <= endY; by += baselineStep) {
      hTargets.push({ y: by, source: "baseline" });
    }
  }

  for (const r of otherRects) {
    hTargets.push({ y: r.y, source: "object" });
    hTargets.push({ y: r.y + r.height / 2, source: "object" });
    hTargets.push({ y: r.y + r.height, source: "object" });
  }

  let minDiffY = thresholdPt;
  let snapTargetY: HTarget | null = null;
  let snapOffsetTypeY: "top" | "center" | "bottom" = "top";

  for (const target of hTargets) {
    const diffTop = Math.abs(movingTop - target.y);
    if (diffTop < minDiffY) {
      minDiffY = diffTop;
      snapTargetY = target;
      snapOffsetTypeY = "top";
    }
    const diffCenter = Math.abs(movingCenterY - target.y);
    if (diffCenter < minDiffY) {
      minDiffY = diffCenter;
      snapTargetY = target;
      snapOffsetTypeY = "center";
    }
    const diffBottom = Math.abs(movingBottom - target.y);
    if (diffBottom < minDiffY) {
      minDiffY = diffBottom;
      snapTargetY = target;
      snapOffsetTypeY = "bottom";
    }
  }

  if (snapTargetY) {
    if (snapOffsetTypeY === "top") {
      snappedY = snapTargetY.y;
    } else if (snapOffsetTypeY === "center") {
      snappedY = snapTargetY.y - movingRect.height / 2;
    } else {
      snappedY = snapTargetY.y - movingRect.height;
    }

    guides.push({
      type: "horizontal",
      positionPt: snapTargetY.y,
      startPt: -bleed.leftPt,
      endPt: pageDim.widthPt + bleed.rightPt,
      label: snapTargetY.label,
      source: snapTargetY.source,
    });
  }

  // 3. Smart Spacing indicators & snapping (Equal spacing detection)
  const spacingIndicators: SpacingIndicator[] = [];

  // A. Vertical equal spacing
  if (otherRects.length >= 2) {
    const aboveSiblings = otherRects.filter((r) => r.y + r.height <= snappedY);
    const belowSiblings = otherRects.filter((r) => r.y >= snappedY + movingRect.height);

    for (const a of aboveSiblings) {
      for (const b of belowSiblings) {
        const overlapX =
          Math.min(a.x + a.width, movingRect.x + movingRect.width, b.x + b.width) -
          Math.max(a.x, movingRect.x, b.x);
        if (overlapX > -50) {
          const spaceAbove = snappedY - (a.y + a.height);
          const spaceBelow = b.y - (snappedY + movingRect.height);
          const totalGap = b.y - (a.y + a.height) - movingRect.height;
          if (totalGap > 0 && Math.abs(spaceAbove - spaceBelow) < thresholdPt * 2) {
            const idealSpacing = totalGap / 2;
            snappedY = Math.round(a.y + a.height + idealSpacing);
            const midX = movingRect.x + movingRect.width / 2;
            spacingIndicators.push({
              type: "vertical",
              startPt: a.y + a.height,
              endPt: snappedY,
              crossAxisPt: midX,
              distancePt: Math.round(idealSpacing),
              label: `${Math.round(idealSpacing)} pt`,
            });
            spacingIndicators.push({
              type: "vertical",
              startPt: snappedY + movingRect.height,
              endPt: b.y,
              crossAxisPt: midX,
              distancePt: Math.round(idealSpacing),
              label: `${Math.round(idealSpacing)} pt`,
            });
            break;
          }
        }
      }
      if (spacingIndicators.length > 0) break;
    }
  }

  // B. Horizontal equal spacing
  if (otherRects.length >= 2) {
    const leftSiblings = otherRects.filter((r) => r.x + r.width <= snappedX);
    const rightSiblings = otherRects.filter((r) => r.x >= snappedX + movingRect.width);

    for (const l of leftSiblings) {
      for (const r of rightSiblings) {
        const overlapY =
          Math.min(l.y + l.height, movingRect.y + movingRect.height, r.y + r.height) -
          Math.max(l.y, movingRect.y, r.y);
        if (overlapY > -50) {
          const spaceLeft = snappedX - (l.x + l.width);
          const spaceRight = r.x - (snappedX + movingRect.width);
          const totalGap = r.x - (l.x + l.width) - movingRect.width;
          if (totalGap > 0 && Math.abs(spaceLeft - spaceRight) < thresholdPt * 2) {
            const idealSpacing = totalGap / 2;
            snappedX = Math.round(l.x + l.width + idealSpacing);
            const midY = movingRect.y + movingRect.height / 2;
            spacingIndicators.push({
              type: "horizontal",
              startPt: l.x + l.width,
              endPt: snappedX,
              crossAxisPt: midY,
              distancePt: Math.round(idealSpacing),
              label: `${Math.round(idealSpacing)} pt`,
            });
            spacingIndicators.push({
              type: "horizontal",
              startPt: snappedX + movingRect.width,
              endPt: r.x,
              crossAxisPt: midY,
              distancePt: Math.round(idealSpacing),
              label: `${Math.round(idealSpacing)} pt`,
            });
            break;
          }
        }
      }
      if (spacingIndicators.some((s) => s.type === "horizontal")) break;
    }
  }

  return {
    x: Math.round(snappedX * 10) / 10,
    y: Math.round(snappedY * 10) / 10,
    guides,
    spacingIndicators,
  };
}

/**
 * Parent & Edge Constraints Engine
 * Applies responsive positioning when page dimensions or margins adjust.
 */
export function solveElementConstraint(
  transform: ElementTransform,
  constraints: ElementConstraints | undefined,
  oldPageDim: PageDimensions,
  newPageDim: PageDimensions,
  oldMargins: Margins,
  newMargins: Margins
): Partial<ElementTransform> {
  const c = constraints || { horizontal: "left", vertical: "top" };
  const deltaW = newPageDim.widthPt - oldPageDim.widthPt;
  const deltaH = newPageDim.heightPt - oldPageDim.heightPt;

  let newX = transform.x;
  let newW = transform.width;

  switch (c.horizontal) {
    case "left":
      // Keep distance to left margin
      const leftDist = transform.x - oldMargins.insidePt;
      newX = newMargins.insidePt + leftDist;
      break;

    case "right":
      // Keep distance to right margin
      const rightDist = oldPageDim.widthPt - oldMargins.outsidePt - (transform.x + transform.width);
      newX = newPageDim.widthPt - newMargins.outsidePt - rightDist - transform.width;
      break;

    case "center":
      // Stay centered relative to content area
      const oldContentW = oldPageDim.widthPt - oldMargins.insidePt - oldMargins.outsidePt;
      const newContentW = newPageDim.widthPt - newMargins.insidePt - newMargins.outsidePt;
      const ratioX = (transform.x + transform.width / 2 - oldMargins.insidePt) / (oldContentW || 1);
      newX = newMargins.insidePt + ratioX * newContentW - transform.width / 2;
      break;

    case "left-right":
      // Stretch with margins
      const distL = transform.x - oldMargins.insidePt;
      const distR = oldPageDim.widthPt - oldMargins.outsidePt - (transform.x + transform.width);
      newX = newMargins.insidePt + distL;
      newW = Math.max(20, newPageDim.widthPt - newMargins.outsidePt - distR - newX);
      break;

    case "scale":
      const scaleX = newPageDim.widthPt / (oldPageDim.widthPt || 1);
      newX = transform.x * scaleX;
      newW = transform.width * scaleX;
      break;
  }

  let newY = transform.y;
  let newH = transform.height;

  switch (c.vertical) {
    case "top":
      const topDist = transform.y - oldMargins.topPt;
      newY = newMargins.topPt + topDist;
      break;

    case "bottom":
      const bottomDist = oldPageDim.heightPt - oldMargins.bottomPt - (transform.y + transform.height);
      newY = newPageDim.heightPt - newMargins.bottomPt - bottomDist - transform.height;
      break;

    case "center":
      const oldContentH = oldPageDim.heightPt - oldMargins.topPt - oldMargins.bottomPt;
      const newContentH = newPageDim.heightPt - newMargins.topPt - newMargins.bottomPt;
      const ratioY = (transform.y + transform.height / 2 - oldMargins.topPt) / (oldContentH || 1);
      newY = newMargins.topPt + ratioY * newContentH - transform.height / 2;
      break;

    case "top-bottom":
      const distT = transform.y - oldMargins.topPt;
      const distB = oldPageDim.heightPt - oldMargins.bottomPt - (transform.y + transform.height);
      newY = newMargins.topPt + distT;
      newH = Math.max(20, newPageDim.heightPt - newMargins.bottomPt - distB - newY);
      break;

    case "scale":
      const scaleY = newPageDim.heightPt / (oldPageDim.heightPt || 1);
      newY = transform.y * scaleY;
      newH = transform.height * scaleY;
      break;
  }

  return {
    x: Math.round(newX * 10) / 10,
    y: Math.round(newY * 10) / 10,
    width: Math.round(newW * 10) / 10,
    height: Math.round(newH * 10) / 10,
  };
}
