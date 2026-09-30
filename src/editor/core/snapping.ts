import { Rect } from "./geometry";
import { Margins, Bleed, PageDimensions } from "../../domain/book/types";

export interface SnapGuideLine {
  type: "vertical" | "horizontal";
  positionPt: number;
  startPt: number;
  endPt: number;
  label?: string;
  source: "page" | "margin" | "bleed" | "object";
}

export interface SpacingIndicator {
  type: "horizontal" | "vertical";
  startPt: number;
  endPt: number;
  crossAxisPt: number;
  distancePt: number;
  label: string;
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
  thresholdPt: number = 5,
  disabled: boolean = false
): SnapResult {
  if (disabled) {
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
    source: "page" | "margin" | "bleed" | "object";
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
    // Check left
    const diffLeft = Math.abs(movingLeft - target.x);
    if (diffLeft < minDiffX) {
      minDiffX = diffLeft;
      snapTargetX = target;
      snapOffsetTypeX = "left";
    }
    // Check center
    const diffCenter = Math.abs(movingCenterX - target.x);
    if (diffCenter < minDiffX) {
      minDiffX = diffCenter;
      snapTargetX = target;
      snapOffsetTypeX = "center";
    }
    // Check right
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
    source: "page" | "margin" | "bleed" | "object";
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

  // 3. Smart Spacing indicators & snapping (Directive 43)
  const spacingIndicators: SpacingIndicator[] = [];

  // Vertical equal spacing
  if (otherRects.length >= 2) {
    const aboveSiblings = otherRects.filter((r) => r.y + r.height <= snappedY);
    const belowSiblings = otherRects.filter((r) => r.y >= snappedY + movingRect.height);

    for (const a of aboveSiblings) {
      for (const b of belowSiblings) {
        // Check if there is significant horizontal overlap
        const overlapX = Math.min(a.x + a.width, movingRect.x + movingRect.width, b.x + b.width) -
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

  return {
    x: Math.round(snappedX * 10) / 10,
    y: Math.round(snappedY * 10) / 10,
    guides,
    spacingIndicators,
  };
}
