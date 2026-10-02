import type { PageElement } from "../../domain/element/types";
import { isElementLocked, selectionRoot } from "./elementGroups";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rot";

export interface TransformHandle {
  type: HandleType;
  x: number; // in element or screen space
  y: number;
  cursor: string;
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Rotate a point around an origin
 */
export function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angleDeg: number
): { x: number; y: number } {
  if (angleDeg === 0) return { x, y };
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

/**
 * Compute the combined bounding box of multiple rectangles
 */
export function getBoundingBox(rects: Rect[]): Rect {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Get the 8 resize handles + 1 rotation handle for a bounding box
 */
export function getTransformHandles(rect: Rect, rotation: number = 0): TransformHandle[] {
  const { x, y, width, height } = rect;
  const halfW = width / 2;
  const halfH = height / 2;
  const cx = x + halfW;
  const cy = y + halfH;

  const rawHandles: { type: HandleType; x: number; y: number; cursor: string }[] = [
    { type: "nw", x: x, y: y, cursor: "nwse-resize" },
    { type: "n", x: cx, y: y, cursor: "ns-resize" },
    { type: "ne", x: x + width, y: y, cursor: "nesw-resize" },
    { type: "e", x: x + width, y: cy, cursor: "ew-resize" },
    { type: "se", x: x + width, y: y + height, cursor: "nwse-resize" },
    { type: "s", x: cx, y: y + height, cursor: "ns-resize" },
    { type: "sw", x: x, y: y + height, cursor: "nesw-resize" },
    { type: "w", x: x, y: cy, cursor: "ew-resize" },
    // Rotation handle 24pt above top center
    { type: "rot", x: cx, y: y - 24, cursor: "grab" },
  ];

  if (rotation === 0) return rawHandles;

  return rawHandles.map((h) => {
    const rotated = rotatePoint(h.x, h.y, cx, cy, rotation);
    return {
      ...h,
      x: rotated.x,
      y: rotated.y,
    };
  });
}

/**
 * Calculate new rectangle on handle drag with optional aspect ratio lock
 */
export function calculateResize(
  initialRect: Rect,
  handle: HandleType,
  deltaX: number,
  deltaY: number,
  lockAspectRatio: boolean = false,
  minWidth: number = 20,
  minHeight: number = 20
): Rect {
  let { x, y, width, height } = initialRect;
  const initialAspect = initialRect.width / initialRect.height;

  if (lockAspectRatio && ["nw", "ne", "sw", "se"].includes(handle)) {
    const west = handle.includes("w"), north = handle.includes("n");
    const sx = 1 + (west ? -deltaX : deltaX) / width;
    const sy = 1 + (north ? -deltaY : deltaY) / height;
    const factor = Math.max(minWidth / width, minHeight / height, Math.abs(sx - 1) >= Math.abs(sy - 1) ? sx : sy);
    const nextWidth = width * factor, nextHeight = height * factor;
    return { x: west ? x + width - nextWidth : x, y: north ? y + height - nextHeight : y, width: nextWidth, height: nextHeight };
  }
  if (lockAspectRatio && ["e", "w", "n", "s"].includes(handle)) {
    const horizontal = handle === "e" || handle === "w";
    const change = horizontal ? (handle === "w" ? -deltaX : deltaX) / width : (handle === "n" ? -deltaY : deltaY) / height;
    const factor = Math.max(minWidth / width, minHeight / height, 1 + change);
    const nextWidth = width * factor, nextHeight = height * factor;
    return {
      x: horizontal ? (handle === "w" ? x + width - nextWidth : x) : x + (width - nextWidth) / 2,
      y: horizontal ? y + (height - nextHeight) / 2 : (handle === "n" ? y + height - nextHeight : y),
      width: nextWidth, height: nextHeight,
    };
  }

  switch (handle) {
    case "se":
      width = Math.max(minWidth, initialRect.width + deltaX);
      height = Math.max(minHeight, initialRect.height + deltaY);
      if (lockAspectRatio) {
        height = width / initialAspect;
      }
      break;
    case "e":
      width = Math.max(minWidth, initialRect.width + deltaX);
      break;
    case "s":
      height = Math.max(minHeight, initialRect.height + deltaY);
      break;
    case "sw":
      const newWidthSw = Math.max(minWidth, initialRect.width - deltaX);
      x = initialRect.x + (initialRect.width - newWidthSw);
      width = newWidthSw;
      height = Math.max(minHeight, initialRect.height + deltaY);
      if (lockAspectRatio) {
        height = width / initialAspect;
      }
      break;
    case "w":
      const newWidthW = Math.max(minWidth, initialRect.width - deltaX);
      x = initialRect.x + (initialRect.width - newWidthW);
      width = newWidthW;
      break;
    case "ne":
      width = Math.max(minWidth, initialRect.width + deltaX);
      const newHeightNe = Math.max(minHeight, initialRect.height - deltaY);
      y = initialRect.y + (initialRect.height - newHeightNe);
      height = newHeightNe;
      if (lockAspectRatio) {
        width = height * initialAspect;
      }
      break;
    case "n":
      const newHeightN = Math.max(minHeight, initialRect.height - deltaY);
      y = initialRect.y + (initialRect.height - newHeightN);
      height = newHeightN;
      break;
    case "nw":
      const newWidthNw = Math.max(minWidth, initialRect.width - deltaX);
      const newHeightNw = Math.max(minHeight, initialRect.height - deltaY);
      x = initialRect.x + (initialRect.width - newWidthNw);
      y = initialRect.y + (initialRect.height - newHeightNw);
      width = newWidthNw;
      height = newHeightNw;
      if (lockAspectRatio) {
        height = width / initialAspect;
      }
      break;
  }

  return { x, y, width, height };
}

/** Resize in the element's local axes, keeping the opposite handle fixed on the page. */
export function calculateRotatedResize(
  initial: Rect, rotation: number, handle: HandleType, dx: number, dy: number,
  lockAspect = false, minWidth = 20, minHeight = 20,
): Rect {
  const local = rotatePoint(dx, dy, 0, 0, -rotation);
  const next = calculateResize(initial, handle, local.x, local.y, lockAspect, minWidth, minHeight);
  const cx = initial.x + initial.width / 2, cy = initial.y + initial.height / 2;
  const center = rotatePoint(next.x + next.width / 2, next.y + next.height / 2, cx, cy, rotation);
  return { ...next, x: center.x - next.width / 2, y: center.y - next.height / 2 };
}

/** Map each member from the original selection bounds, never from the previous frame. */
export function resizeSelectionMember(rect: Rect, initial: Rect, next: Rect): Rect {
  const sx = next.width / initial.width, sy = next.height / initial.height;
  return { x: next.x + (rect.x - initial.x) * sx, y: next.y + (rect.y - initial.y) * sy,
    width: rect.width * sx, height: rect.height * sy };
}

/**
 * Check if two axis-aligned bounding boxes intersect or contain one another
 */
export function doesRectIntersectRect(r1: Rect, r2: Rect): boolean {
  return (
    r1.x <= r2.x + r2.width &&
    r1.x + r1.width >= r2.x &&
    r1.y <= r2.y + r2.height &&
    r1.y + r1.height >= r2.y
  );
}

/**
 * Get the 4 corners of a potentially rotated rectangle in document points
 */
export function getRotatedCorners(rect: Rect, rotationDeg: number = 0): { x: number; y: number }[] {
  if (!rotationDeg) {
    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ];
  }
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return [
    rotatePoint(rect.x, rect.y, cx, cy, rotationDeg),
    rotatePoint(rect.x + rect.width, rect.y, cx, cy, rotationDeg),
    rotatePoint(rect.x + rect.width, rect.y + rect.height, cx, cy, rotationDeg),
    rotatePoint(rect.x, rect.y + rect.height, cx, cy, rotationDeg),
  ];
}

/**
 * Separating Axis Theorem (SAT) intersection between a convex 4-point polygon and an axis-aligned box
 */
export function doesPolygonIntersectRect(polygon: { x: number; y: number }[], rect: Rect): boolean {
  const boxPoints = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  // Normals of box and polygon edges
  const axes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -(polygon[1].y - polygon[0].y), y: polygon[1].x - polygon[0].x },
    { x: -(polygon[2].y - polygon[1].y), y: polygon[2].x - polygon[1].x },
  ];

  for (const axis of axes) {
    let minB = Infinity;
    let maxB = -Infinity;
    for (const p of boxPoints) {
      const dot = p.x * axis.x + p.y * axis.y;
      if (dot < minB) minB = dot;
      if (dot > maxB) maxB = dot;
    }

    let minP = Infinity;
    let maxP = -Infinity;
    for (const p of polygon) {
      const dot = p.x * axis.x + p.y * axis.y;
      if (dot < minP) minP = dot;
      if (dot > maxP) maxP = dot;
    }

    if (maxB < minP || maxP < minB) {
      return false; // Separating axis exists
    }
  }

  return true;
}

/**
 * Test whether a page element intersects or is inside a marquee rectangle in page coordinates
 */
export function elementIntersectsMarquee(element: PageElement, marqueeRect: Rect): boolean {
  const width = element.smartBlockData?.styleOverrides?.resizeFrame?.width ?? element.transform.width;
  const height = element.smartBlockData?.styleOverrides?.resizeFrame?.height ?? element.transform.height;
  const elRect: Rect = {
    x: element.transform.x,
    y: element.transform.y,
    width,
    height,
  };

  const rotation = element.transform.rotation || 0;
  if (rotation === 0) {
    return doesRectIntersectRect(elRect, marqueeRect);
  }

  const corners = getRotatedCorners(elRect, rotation);
  // Quick AABB rejection
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }
  const aabb: Rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  if (!doesRectIntersectRect(aabb, marqueeRect)) {
    return false;
  }

  return doesPolygonIntersectRect(corners, marqueeRect);
}

/**
 * Find all selection root element IDs intersecting the marquee box on the given page
 */
export function findElementsIntersectingMarquee(
  elements: Record<string, PageElement>,
  activePageId: string,
  marqueeRectPt: Rect,
): string[] {
  const hitRoots = new Set<string>();

  for (const id in elements) {
    const el = elements[id];
    if (!el || el.pageId !== activePageId || el.hidden || el.locked) continue;
    if (isElementLocked(el.id, elements)) continue;
    if ((el.type as string) === "page-frame") continue;

    if (elementIntersectsMarquee(el, marqueeRectPt)) {
      const rootId = selectionRoot(el.id, elements);
      if (elements[rootId] && !elements[rootId].hidden && !elements[rootId].locked && !isElementLocked(rootId, elements)) {
        hitRoots.add(rootId);
      }
    }
  }

  return Array.from(hitRoots);
}

