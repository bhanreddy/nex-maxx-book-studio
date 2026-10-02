import { PageElement, ElementTransform } from "../../domain/element/types";
import { PageDimensions, Margins, PageOverflowStatus } from "../../domain/book/types";

/**
 * Deterministic Layout Solver for NEX MAXX Book Studio.
 * High-performance, pure functional solver (< 2ms execution budget).
 */

export interface SolverResult {
  transforms: Record<string, Partial<ElementTransform>>;
  containerHeight?: number;
  containerWidth?: number;
  warnings?: string[];
  overflowPt?: number;
}

/**
 * Estimate text element height based on character length, font size, line height, and container width
 */
export function estimateTextHeight(
  text: string,
  fontSizePt: number = 10.5,
  lineHeightMultiplier: number = 1.5,
  containerWidthPt: number = 400
): number {
  if (!text || text.trim().length === 0) return Math.round(fontSizePt * lineHeightMultiplier);

  // Average character width for typical sans-serif / academic fonts is ~0.52 * fontSize
  const charWidthPt = fontSizePt * 0.52;
  const charsPerLine = Math.max(10, Math.floor(containerWidthPt / charWidthPt));
  const rawLines = text.split("\n");

  let totalLines = 0;
  for (const line of rawLines) {
    const wrapped = Math.max(1, Math.ceil(line.length / charsPerLine));
    totalLines += wrapped;
  }

  const singleLineHeightPt = fontSizePt * lineHeightMultiplier;
  return Math.max(24, Math.round(totalLines * singleLineHeightPt + 8));
}

/**
 * Get intrinsic element dimensions based on content and configuration
 */
export function getElementIntrinsicDimensions(
  element: PageElement,
  availableWidthPt: number
): { width: number; height: number } {
  const currentW = element.transform.width || 200;
  const currentH = element.transform.height || 60;
  const childConfig = element.adaptiveChild;

  let width = currentW;
  if (childConfig?.widthMode === "fill-parent") {
    width = availableWidthPt;
  } else if (childConfig?.widthMode === "fixed") {
    width = currentW;
  }

  // Constrain width
  if (childConfig?.minWidthPt) width = Math.max(width, childConfig.minWidthPt);
  if (childConfig?.maxWidthPt) width = Math.min(width, childConfig.maxWidthPt);

  let height = currentH;
  // Content-aware intrinsic height estimation
  if (
    ["heading", "subheading", "body", "caption", "quote"].includes(element.type) &&
    typeof element.content?.text === "string"
  ) {
    const fontSize = element.style?.fontSize || (element.type === "heading" ? 22 : 10.5);
    const lineHeight = element.style?.lineHeight || 1.5;
    const paddingY = (element.style?.padding?.top || 0) + (element.style?.padding?.bottom || 0);
    height = estimateTextHeight(element.content.text, fontSize, lineHeight, width) + paddingY;
  } else if (element.type === "learningObjectives") {
    const itemsCount = Array.isArray(element.content?.items) ? element.content.items.length : 3;
    height = Math.max(60, 36 + itemsCount * 18);
  } else if (element.type === "summary") {
    const itemsCount = Array.isArray(element.content?.items) ? element.content.items.length : 3;
    height = Math.max(60, 36 + itemsCount * 16);
  } else if (element.type === "mcq") {
    const optionsCount = Array.isArray(element.content?.options) ? element.content.options.length : 4;
    height = Math.max(70, 34 + Math.ceil(optionsCount / 2) * 26);
  } else if (element.type === "table") {
    const rowsCount = Array.isArray(element.content?.rows) ? element.content.rows.length : 3;
    height = 35 + rowsCount * 28;
  }

  if (childConfig?.heightMode === "fixed") {
    height = currentH;
  }

  // Constrain height
  if (childConfig?.minHeightPt) height = Math.max(height, childConfig.minHeightPt);
  if (childConfig?.maxHeightPt) height = Math.min(height, childConfig.maxHeightPt);

  return { width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10 };
}

/**
 * Solve Layout for an Adaptive Group Container
 */
export function solveAdaptiveGroup(
  container: PageElement,
  children: PageElement[],
  containerBounds?: { width: number; height: number }
): SolverResult {
  const groupConfig = container.adaptiveGroup || {
    direction: "vertical",
    spacingPt: 16,
    padding: { top: 12, right: 12, bottom: 12, left: 12 },
    alignment: "stretch",
    distribution: "start",
    widthMode: "fixed",
    heightMode: "fit-content",
  };

  const containerW = containerBounds?.width ?? container.transform.width;
  const containerH = containerBounds?.height ?? container.transform.height;
  const { top, right, bottom, left } = groupConfig.padding;
  const innerW = Math.max(10, containerW - left - right);
  const innerH = Math.max(10, containerH - top - bottom);

  const transforms: Record<string, Partial<ElementTransform>> = {};
  const { direction, spacingPt, alignment, distribution } = groupConfig;

  if (children.length === 0) {
    return {
      transforms: {},
      containerHeight: top + bottom + 30,
      containerWidth: containerW,
    };
  }

  // Calculate intrinsic dimensions for all children
  const childDimensions = children.map((c) => ({
    child: c,
    ...getElementIntrinsicDimensions(c, innerW),
  }));

  if (direction === "vertical") {
    // -------------------------------------------------------------
    // VERTICAL FLOW
    // -------------------------------------------------------------
    let currentY = container.transform.y + top;
    let totalContentH = 0;

    childDimensions.forEach((dim, idx) => {
      const { child, width: childW, height: childH } = dim;
      let finalW = childW;
      let finalX = container.transform.x + left;

      if (alignment === "stretch" || child.adaptiveChild?.widthMode === "fill-parent") {
        finalW = innerW;
      } else if (alignment === "center") {
        finalX = container.transform.x + left + (innerW - finalW) / 2;
      } else if (alignment === "end") {
        finalX = container.transform.x + left + (innerW - finalW);
      }

      transforms[child.id] = {
        x: Math.round(finalX * 10) / 10,
        y: Math.round(currentY * 10) / 10,
        width: Math.round(finalW * 10) / 10,
        height: Math.round(childH * 10) / 10,
      };

      currentY += childH;
      totalContentH += childH;
      if (idx < childDimensions.length - 1) {
        currentY += spacingPt;
        totalContentH += spacingPt;
      }
    });

    const calculatedContainerH = Math.round((totalContentH + top + bottom) * 10) / 10;
    const finalContainerH = groupConfig.heightMode === "fixed" ? containerH : calculatedContainerH;

    return {
      transforms,
      containerHeight: finalContainerH,
      containerWidth: containerW,
    };
  } else if (direction === "horizontal") {
    // -------------------------------------------------------------
    // HORIZONTAL FLOW
    // -------------------------------------------------------------
    const totalSpacing = Math.max(0, (children.length - 1) * spacingPt);
    let totalChildrenW = childDimensions.reduce((sum, d) => sum + d.width, 0);

    // If fill-parent children exist, distribute remaining width
    const fillChildren = childDimensions.filter((d) => d.child.adaptiveChild?.widthMode === "fill-parent");
    if (fillChildren.length > 0) {
      const fixedChildrenW = childDimensions
        .filter((d) => d.child.adaptiveChild?.widthMode !== "fill-parent")
        .reduce((sum, d) => sum + d.width, 0);
      const remainingW = Math.max(10 * fillChildren.length, innerW - fixedChildrenW - totalSpacing);
      const shareW = Math.floor(remainingW / fillChildren.length);
      fillChildren.forEach((d) => {
        d.width = shareW;
      });
      totalChildrenW = childDimensions.reduce((sum, d) => sum + d.width, 0);
    }

    let currentX = container.transform.x + left;
    let maxChildH = 0;

    // Distribution offset
    if (distribution === "center" && innerW > totalChildrenW + totalSpacing) {
      currentX += (innerW - (totalChildrenW + totalSpacing)) / 2;
    } else if (distribution === "end" && innerW > totalChildrenW + totalSpacing) {
      currentX += innerW - (totalChildrenW + totalSpacing);
    }

    childDimensions.forEach((dim, idx) => {
      const { child, width: childW, height: childH } = dim;
      maxChildH = Math.max(maxChildH, childH);
      let finalY = container.transform.y + top;

      if (alignment === "stretch") {
        // Stretch to fill container height if container height is fixed
        if (groupConfig.heightMode === "fixed") {
          dim.height = innerH;
        }
      } else if (alignment === "center") {
        finalY = container.transform.y + top + (innerH - childH) / 2;
      } else if (alignment === "end") {
        finalY = container.transform.y + top + (innerH - childH);
      }

      transforms[child.id] = {
        x: Math.round(currentX * 10) / 10,
        y: Math.round(finalY * 10) / 10,
        width: Math.round(childW * 10) / 10,
        height: Math.round(childH * 10) / 10,
      };

      currentX += childW;
      if (idx < childDimensions.length - 1) {
        currentX += spacingPt;
      }
    });

    const calculatedContainerH = Math.round((maxChildH + top + bottom) * 10) / 10;
    return {
      transforms,
      containerHeight: groupConfig.heightMode === "fixed" ? containerH : calculatedContainerH,
      containerWidth: containerW,
    };
  } else if (direction === "grid") {
    // -------------------------------------------------------------
    // GRID FLOW
    // -------------------------------------------------------------
    const cols = Math.max(1, groupConfig.columns || 2);
    const colSpacing = spacingPt;
    const rowSpacing = spacingPt;
    const colWidth = Math.max(20, (innerW - (cols - 1) * colSpacing) / cols);

    let rowY = container.transform.y + top;
    let currentRowMaxH = 0;
    let totalGridH = 0;

    for (let i = 0; i < children.length; i++) {
      const colIdx = i % cols;
      const isStartOfRow = colIdx === 0;

      if (isStartOfRow && i > 0) {
        rowY += currentRowMaxH + rowSpacing;
        totalGridH += currentRowMaxH + rowSpacing;
        currentRowMaxH = 0;
      }

      const dim = childDimensions[i];
      const childH = dim.height;
      currentRowMaxH = Math.max(currentRowMaxH, childH);

      const cellX = container.transform.x + left + colIdx * (colWidth + colSpacing);

      transforms[dim.child.id] = {
        x: Math.round(cellX * 10) / 10,
        y: Math.round(rowY * 10) / 10,
        width: Math.round(colWidth * 10) / 10,
        height: Math.round(childH * 10) / 10,
      };

      if (i === children.length - 1) {
        totalGridH += currentRowMaxH;
      }
    }

    return {
      transforms,
      containerHeight: Math.round((totalGridH + top + bottom) * 10) / 10,
      containerWidth: containerW,
    };
  }

  return { transforms };
}

/**
 * Content Reflow Engine:
 * When an element's content changes height, adjust downstream elements and prevent overlap.
 */
export function solvePageReflow(
  modifiedElementId: string,
  newHeightPt: number,
  allPageElements: PageElement[],
  margins: Margins,
  pageDim: PageDimensions
): {
  updatedTransforms: Record<string, Partial<ElementTransform>>;
  overflowStatus: PageOverflowStatus;
} {
  const target = allPageElements.find((el) => el.id === modifiedElementId);
  if (!target) {
    return {
      updatedTransforms: {},
      overflowStatus: { hasOverflow: false },
    };
  }

  const deltaHeight = newHeightPt - target.transform.height;
  const updatedTransforms: Record<string, Partial<ElementTransform>> = {};

  // Update target element's height
  updatedTransforms[target.id] = {
    height: Math.round(newHeightPt * 10) / 10,
  };

  // If delta is negligible (< 1pt), return early
  if (Math.abs(deltaHeight) < 1) {
    return {
      updatedTransforms,
      overflowStatus: detectPageOverflow(allPageElements, margins, pageDim),
    };
  }

  const targetBottom = target.transform.y + target.transform.height;
  const targetLeft = target.transform.x;
  const targetRight = target.transform.x + target.transform.width;

  // Find downstream elements located below the target that share horizontal column/measure
  allPageElements.forEach((el) => {
    if (el.id === target.id || el.locked) return;

    const elTop = el.transform.y;
    const elLeft = el.transform.x;
    const elRight = el.transform.x + el.transform.width;

    // Check if element is positioned below target and overlaps in horizontal column range
    const isBelow = elTop >= targetBottom - 10;
    const overlapsHorizontally = Math.max(targetLeft, elLeft) < Math.min(targetRight, elRight);
    const hasRelationship = el.adaptiveChild?.relationship?.type === "below" &&
      el.adaptiveChild.relationship.targetElementId === target.id;

    if (hasRelationship || (isBelow && overlapsHorizontally)) {
      const newY = Math.round((el.transform.y + deltaHeight) * 10) / 10;
      updatedTransforms[el.id] = { y: newY };
    }
  });

  // Evaluate overflow state after reflow
  const simulatedElements = allPageElements.map((el) => {
    const update = updatedTransforms[el.id];
    if (!update) return el;
    return {
      ...el,
      transform: {
        ...el.transform,
        ...update,
      },
    };
  });

  const overflowStatus = detectPageOverflow(simulatedElements, margins, pageDim);

  return {
    updatedTransforms,
    overflowStatus,
  };
}

/**
 * Detect if any elements exceed the print-safe area / bottom page margin
 */
export function detectPageOverflow(
  elements: PageElement[],
  margins: Margins,
  pageDim: PageDimensions
): PageOverflowStatus {
  const safeBottom = pageDim.heightPt - margins.bottomPt;
  const safeRight = pageDim.widthPt - margins.outsidePt;

  let maxBottom = 0;
  let maxRight = 0;
  const overflowingIds: string[] = [];

  elements.forEach((el) => {
    if (el.hidden) return;
    // Skip full-bleed decorative backgrounds, paper shapes, and chapter frame decorations
    const isFullBleedBg =
      (el.category === "decorative" &&
        (el.transform.width >= pageDim.widthPt - 2 || el.transform.height >= pageDim.heightPt - 2)) ||
      Boolean(el.content?.curriculumDecoration) ||
      Boolean(el.metadata?.tags?.includes("bleed-bg"));
    if (isFullBleedBg) return;

    const bottom = el.transform.y + el.transform.height;
    const right = el.transform.x + el.transform.width;
    if (bottom > safeBottom + 4 || right > safeRight + 4) {
      overflowingIds.push(el.id);
      if (bottom > safeBottom + 4) maxBottom = Math.max(maxBottom, bottom);
      if (right > safeRight + 4) maxRight = Math.max(maxRight, right);
    }
  });

  if (overflowingIds.length === 0) {
    return { hasOverflow: false };
  }

  const verticalExceeded = maxBottom > safeBottom ? Math.round((maxBottom - safeBottom) * 10) / 10 : 0;
  const horizontalExceeded = maxRight > safeRight ? Math.round((maxRight - safeRight) * 10) / 10 : 0;
  const exceededByPt = Math.max(verticalExceeded, horizontalExceeded);

  return {
    hasOverflow: true,
    message:
      verticalExceeded > 0
        ? `Content exceeds page bottom margin by ${verticalExceeded} pt`
        : `Content exceeds page right margin by ${horizontalExceeded} pt`,
    exceededByPt,
    overflowAmountPt: exceededByPt,
    overflowingElementIds: overflowingIds,
    suggestedActions: [
      "Create Next Page & flow overflow",
      "Try More Compact Layout",
      "Reduce Body Spacing & Margins",
      "Resize Visual Image Elements",
    ],
  };
}

/**
 * Adapt Page Layout to New Dimensions (e.g. A4 -> A5, Portrait -> Landscape)
 */
export function adaptPageToDimensions(
  elements: PageElement[],
  oldDim: PageDimensions,
  newDim: PageDimensions,
  margins: Margins,
  mode: "adapt" | "scale" | "keep" = "adapt"
): Record<string, Partial<ElementTransform>> {
  const result: Record<string, Partial<ElementTransform>> = {};

  if (mode === "keep") {
    // Keep exact original coordinates
    return result;
  }

  if (mode === "scale") {
    // Scale proportionally
    const scaleX = newDim.widthPt / oldDim.widthPt;
    const scaleY = newDim.heightPt / oldDim.heightPt;

    elements.forEach((el) => {
      result[el.id] = {
        x: Math.round(el.transform.x * scaleX * 10) / 10,
        y: Math.round(el.transform.y * scaleY * 10) / 10,
        width: Math.round(el.transform.width * scaleX * 10) / 10,
        height: Math.round(el.transform.height * scaleY * 10) / 10,
      };
    });
    return result;
  }

  // -------------------------------------------------------------
  // ADAPT MODE (Using Horizontal & Vertical Constraints)
  // -------------------------------------------------------------
  const deltaW = newDim.widthPt - oldDim.widthPt;
  const deltaH = newDim.heightPt - oldDim.heightPt;

  elements.forEach((el) => {
    const hConstraint = el.constraints?.horizontal || "left";
    const vConstraint = el.constraints?.vertical || "top";

    let newX = el.transform.x;
    let newY = el.transform.y;
    let newW = el.transform.width;
    let newH = el.transform.height;

    // Horizontal Constraint Resolution
    if (hConstraint === "left") {
      newX = el.transform.x;
    } else if (hConstraint === "right") {
      newX = el.transform.x + deltaW;
    } else if (hConstraint === "center") {
      const oldCenterFraction = (el.transform.x + el.transform.width / 2) / oldDim.widthPt;
      newX = oldCenterFraction * newDim.widthPt - el.transform.width / 2;
    } else if (hConstraint === "left-right") {
      // Pin to both left and right margins: element stretches!
      newW = Math.max(40, el.transform.width + deltaW);
    } else if (hConstraint === "scale") {
      newX = el.transform.x * (newDim.widthPt / oldDim.widthPt);
      newW = el.transform.width * (newDim.widthPt / oldDim.widthPt);
    }

    // Vertical Constraint Resolution
    if (vConstraint === "top") {
      newY = el.transform.y;
    } else if (vConstraint === "bottom") {
      newY = el.transform.y + deltaH;
    } else if (vConstraint === "center") {
      const oldCenterYFraction = (el.transform.y + el.transform.height / 2) / oldDim.heightPt;
      newY = oldCenterYFraction * newDim.heightPt - el.transform.height / 2;
    } else if (vConstraint === "top-bottom") {
      newH = Math.max(20, el.transform.height + deltaH);
    } else if (vConstraint === "scale") {
      newY = el.transform.y * (newDim.heightPt / oldDim.heightPt);
      newH = el.transform.height * (newDim.heightPt / oldDim.heightPt);
    }

    result[el.id] = {
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: Math.round(newW * 10) / 10,
      height: Math.round(newH * 10) / 10,
    };
  });

  return result;
}

/**
 * Smart Stack: Groups selected elements into an adaptive vertical or horizontal stack
 */
export function solveSmartStack(
  selectedElements: PageElement[],
  direction: "vertical" | "horizontal" | "grid" = "vertical",
  spacingPt: number = 14
): {
  groupBounds: { x: number; y: number; width: number; height: number };
  childrenTransforms: Record<string, Partial<ElementTransform>>;
} {
  if (selectedElements.length === 0) {
    return {
      groupBounds: { x: 54, y: 120, width: 480, height: 200 },
      childrenTransforms: {},
    };
  }

  // Sort by current geometric position
  const sorted = [...selectedElements].sort((a, b) =>
    direction === "horizontal"
      ? a.transform.x - b.transform.x
      : a.transform.y - b.transform.y
  );

  const minX = Math.min(...sorted.map((e) => e.transform.x));
  const minY = Math.min(...sorted.map((e) => e.transform.y));
  const maxW = Math.max(...sorted.map((e) => e.transform.width));

  const childrenTransforms: Record<string, Partial<ElementTransform>> = {};

  if (direction === "vertical") {
    let currentY = minY;
    sorted.forEach((el) => {
      childrenTransforms[el.id] = {
        x: minX,
        y: currentY,
        width: Math.max(el.transform.width, maxW),
      };
      currentY += el.transform.height + spacingPt;
    });

    const totalH = currentY - minY - spacingPt;
    return {
      groupBounds: { x: minX, y: minY, width: maxW, height: totalH },
      childrenTransforms,
    };
  } else {
    let currentX = minX;
    let maxH = 0;
    sorted.forEach((el) => {
      maxH = Math.max(maxH, el.transform.height);
      childrenTransforms[el.id] = {
        x: currentX,
        y: minY,
      };
      currentX += el.transform.width + spacingPt;
    });

    const totalW = currentX - minX - spacingPt;
    return {
      groupBounds: { x: minX, y: minY, width: totalW, height: maxH },
      childrenTransforms,
    };
  }
}

/**
 * One-Click Auto-Arrange Engine:
 * Generates balanced textbook layouts deterministically for 5 rhythm styles
 */
export function autoArrangePage(
  elements: PageElement[],
  pageDim: PageDimensions,
  margins: Margins,
  style: "balanced" | "visual" | "reading" | "compact" | "playful" = "balanced"
): Record<string, Partial<ElementTransform>> {
  const result: Record<string, Partial<ElementTransform>> = {};
  if (elements.length === 0) return result;

  const contentW = pageDim.widthPt - margins.insidePt - margins.outsidePt;
  const startX = margins.insidePt;
  const startY = margins.topPt + 10;
  const safeBottom = pageDim.heightPt - margins.bottomPt;

  // Categorize elements
  const headings = elements.filter((e) => ["heading", "subheading"].includes(e.type));
  const bodyTexts = elements.filter((e) => ["body", "quote", "caption"].includes(e.type));
  const images = elements.filter((e) => ["image", "pictureFrame", "ai-image", "illustration"].includes(e.type));
  const activities = elements.filter((e) =>
    ["learningObjectives", "activity", "experiment", "didYouKnow", "keyConcept", "summary"].includes(e.type)
  );
  const assessments = elements.filter((e) =>
    ["question", "mcq", "trueFalse", "fillInBlank", "matchFollowing"].includes(e.type)
  );
  const tables = elements.filter((e) => e.type === "table");
  const others = elements.filter(
    (e) => ![...headings, ...bodyTexts, ...images, ...activities, ...assessments, ...tables].includes(e)
  );

  let curY = startY;

  // 1. Position Headings across full width
  headings.forEach((h) => {
    result[h.id] = {
      x: startX,
      y: curY,
      width: contentW,
      height: h.transform.height || (h.type === "heading" ? 44 : 28),
    };
    curY += (result[h.id].height || 44) + 14;
  });

  if (style === "visual" && images.length > 0) {
    // -------------------------------------------------------------
    // VISUAL STYLE: Large Hero Image + Surrounding Editorial
    // -------------------------------------------------------------
    const heroImage = images[0];
    const heroH = Math.min(280, (safeBottom - curY) * 0.48);
    result[heroImage.id] = {
      x: startX,
      y: curY,
      width: contentW,
      height: heroH,
    };
    curY += heroH + 16;

    // Remaining body, activities & assessments in 2 columns
    const secondaryEls = [...bodyTexts, ...activities, ...assessments, ...images.slice(1), ...tables, ...others];
    const colW = (contentW - 16) / 2;
    let col1Y = curY;
    let col2Y = curY;

    secondaryEls.forEach((el, idx) => {
      const useCol1 = idx % 2 === 0;
      const x = useCol1 ? startX : startX + colW + 16;
      const y = useCol1 ? col1Y : col2Y;
      const h = el.transform.height || 80;

      result[el.id] = { x, y, width: colW, height: h };
      if (useCol1) col1Y += h + 14;
      else col2Y += h + 14;
    });
  } else if (style === "reading") {
    // -------------------------------------------------------------
    // READING STYLE: 2-Column Editorial Flow with Callout Side Margin
    // -------------------------------------------------------------
    const mainColW = contentW * 0.65;
    const sideColW = contentW * 0.35 - 14;
    const sideX = startX + mainColW + 14;

    let mainY = curY;
    let sideY = curY;

    bodyTexts.forEach((b) => {
      const h = b.transform.height || 90;
      result[b.id] = { x: startX, y: mainY, width: mainColW, height: h };
      mainY += h + 14;
    });

    [...images, ...activities, ...assessments, ...tables].forEach((el) => {
      const h = el.transform.height || 100;
      result[el.id] = { x: sideX, y: sideY, width: sideColW, height: h };
      sideY += h + 14;
    });

    others.forEach((el) => {
      result[el.id] = { x: startX, y: mainY, width: mainColW, height: el.transform.height || 50 };
      mainY += (el.transform.height || 50) + 14;
    });
  } else if (style === "compact") {
    // -------------------------------------------------------------
    // COMPACT STYLE: 3-column / High Density
    // -------------------------------------------------------------
    const colW = (contentW - 20) / 2;
    const allRemaining = [...images, ...bodyTexts, ...activities, ...assessments, ...tables, ...others];
    let leftY = curY;
    let rightY = curY;

    allRemaining.forEach((el, idx) => {
      const isLeft = idx % 2 === 0;
      const x = isLeft ? startX : startX + colW + 16;
      const y = isLeft ? leftY : rightY;
      const h = el.transform.height || 75;

      result[el.id] = { x, y, width: colW, height: h };
      if (isLeft) leftY += h + 10;
      else rightY += h + 10;
    });
  } else if (style === "playful") {
    // -------------------------------------------------------------
    // PLAYFUL STYLE: Staggered Activity Cards & Dynamic Layout
    // -------------------------------------------------------------
    const allRemaining = [...activities, ...images, ...bodyTexts, ...assessments, ...tables, ...others];
    allRemaining.forEach((el, idx) => {
      const isAlt = idx % 2 === 1;
      const width = isAlt ? contentW * 0.92 : contentW;
      const x = isAlt ? startX + contentW * 0.08 : startX;
      const h = el.transform.height || 85;

      result[el.id] = { x, y: curY, width, height: h };
      curY += h + 16;
    });
  } else {
    // -------------------------------------------------------------
    // BALANCED STYLE (Default Flagship Textbook Layout)
    // -------------------------------------------------------------
    // 1. Objectives / Summary Callout at top if present
    const topCallouts = activities.filter((a) => a.type === "learningObjectives");
    topCallouts.forEach((c) => {
      result[c.id] = { x: startX, y: curY, width: contentW, height: c.transform.height || 80 };
      curY += (c.transform.height || 80) + 14;
    });

    // 2. Main content split: Image + Body Text
    if (images.length > 0 && bodyTexts.length > 0) {
      const img = images[0];
      const body = bodyTexts[0];
      const splitW = (contentW - 16) / 2;
      const rowH = Math.max(160, img.transform.height || 180);

      result[img.id] = { x: startX, y: curY, width: splitW, height: rowH };
      result[body.id] = { x: startX + splitW + 16, y: curY, width: splitW, height: rowH };
      curY += rowH + 16;
    }

    // 3. Remaining elements stacked cleanly
    const rest = [
      ...images.slice(bodyTexts.length > 0 ? 1 : 0),
      ...bodyTexts.slice(images.length > 0 ? 1 : 0),
      ...activities.filter((a) => a.type !== "learningObjectives"),
      ...assessments,
      ...tables,
      ...others,
    ];

    rest.forEach((el) => {
      const h = el.transform.height || 75;
      result[el.id] = { x: startX, y: curY, width: contentW, height: h };
      curY += h + 14;
    });
  }

  return result;
}

/**
 * Non-Destructive Layout Switching:
 * Maps existing content seamlessly into target preset slots without losing text, images, or activities.
 */
export function switchPageLayout(
  existingElements: PageElement[],
  targetPresetTemplateElements: Omit<PageElement, "id" | "pageId">[]
): {
  updatedElements: Record<string, PageElement>;
  newElementIds: string[];
} {
  const updatedElements: Record<string, PageElement> = {};
  const newElementIds: string[] = [];

  // Categorize source elements
  const sourceTexts = existingElements.filter((e) => ["heading", "subheading", "body", "quote", "caption"].includes(e.type));
  const sourceImages = existingElements.filter((e) => ["image", "pictureFrame", "ai-image"].includes(e.type));
  const sourceActivities = existingElements.filter((e) =>
    ["learningObjectives", "activity", "experiment", "didYouKnow", "keyConcept", "summary"].includes(e.type)
  );
  const sourceAssessments = existingElements.filter((e) =>
    ["question", "mcq", "trueFalse", "fillInBlank", "matchFollowing"].includes(e.type)
  );
  const sourceTables = existingElements.filter((e) => e.type === "table");

  let textIdx = 0;
  let imageIdx = 0;
  let activityIdx = 0;
  let assessmentIdx = 0;
  let tableIdx = 0;

  // Map into target template frames
  targetPresetTemplateElements.forEach((targetTmpl, idx) => {
    const id = `el-switched-${idx}-${Date.now()}`;
    let mappedContent = { ...targetTmpl.content };

    // Seamlessly transfer matching existing user content!
    if (["heading", "subheading", "body", "quote", "caption"].includes(targetTmpl.type)) {
      if (textIdx < sourceTexts.length) {
        mappedContent = { ...sourceTexts[textIdx].content };
        textIdx++;
      }
    } else if (["image", "pictureFrame", "ai-image"].includes(targetTmpl.type)) {
      if (imageIdx < sourceImages.length) {
        mappedContent = { ...sourceImages[imageIdx].content };
        imageIdx++;
      }
    } else if (["learningObjectives", "activity", "experiment", "didYouKnow", "keyConcept", "summary"].includes(targetTmpl.type)) {
      if (activityIdx < sourceActivities.length) {
        mappedContent = { ...sourceActivities[activityIdx].content };
        activityIdx++;
      }
    } else if (["question", "mcq", "trueFalse", "fillInBlank", "matchFollowing"].includes(targetTmpl.type)) {
      if (assessmentIdx < sourceAssessments.length) {
        mappedContent = { ...sourceAssessments[assessmentIdx].content };
        assessmentIdx++;
      }
    } else if (targetTmpl.type === "table") {
      if (tableIdx < sourceTables.length) {
        mappedContent = { ...sourceTables[tableIdx].content };
        tableIdx++;
      }
    }

    const newEl: PageElement = {
      ...targetTmpl,
      id,
      pageId: existingElements[0]?.pageId || "page-1",
      content: mappedContent,
      locked: false,
      hidden: false,
    };

    updatedElements[id] = newEl;
    newElementIds.push(id);
  });

  // Preserve any remaining user elements below to guarantee zero data loss!
  const unmapped = [
    ...sourceTexts.slice(textIdx),
    ...sourceImages.slice(imageIdx),
    ...sourceActivities.slice(activityIdx),
    ...sourceAssessments.slice(assessmentIdx),
    ...sourceTables.slice(tableIdx),
  ];

  if (unmapped.length > 0) {
    let maxY = 0;
    Object.values(updatedElements).forEach((el) => {
      maxY = Math.max(maxY, el.transform.y + el.transform.height);
    });

    unmapped.forEach((extraEl) => {
      const extraId = `el-preserved-${extraEl.id}-${Date.now()}`;
      updatedElements[extraId] = {
        ...extraEl,
        id: extraId,
        transform: {
          ...extraEl.transform,
          y: maxY + 16,
        },
      };
      newElementIds.push(extraId);
      maxY += extraEl.transform.height + 16;
    });
  }

  return {
    updatedElements,
    newElementIds,
  };
}
