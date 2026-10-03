import type { PageElement } from "../../domain/element/types";
import { elementTree, isElementLocked, selectionRoot } from "../core/elementGroups";

export interface PasteSelectionOptions {
  pageId?: string;
  position?: { x: number; y: number };
}

export function clipboardRoots(ids: string[], elements: Record<string, PageElement>, pageId: string): string[] {
  return [...new Set(ids.filter(id => elements[id]?.pageId === pageId).map(id => selectionRoot(id, elements)))];
}

/** A cut is all-or-nothing: never silently leave protected children behind. */
export function cutSelectionIssue(roots: string[], elements: Record<string, PageElement>): string | undefined {
  const items = elementTree(roots, elements);
  if (items.some(el => isElementLocked(el.id, elements))) return "Unlock the group and all its children before cutting.";
  if (items.some(el => el.smartBlockData?.curriculum?.chapterId)) {
    return "Detach chapter blocks into independent layers before cutting. Copy is available without detaching.";
  }
}

/** Translate the entire tree together. Never resize or rearrange its children. */
export function clipboardOffset(items: PageElement[], dimensions: { widthPt: number; heightPt: number }, offset: number, position?: { x: number; y: number }) {
  const bounds = items.map(({ transform: t }) => {
    const angle = t.rotation * Math.PI / 180;
    const width = Math.abs(t.width * Math.cos(angle)) + Math.abs(t.height * Math.sin(angle));
    const height = Math.abs(t.width * Math.sin(angle)) + Math.abs(t.height * Math.cos(angle));
    return { x: t.x + (t.width - width) / 2, y: t.y + (t.height - height) / 2, width, height };
  });
  const x = Math.min(...bounds.map(t => t.x)), y = Math.min(...bounds.map(t => t.y));
  const width = Math.max(...bounds.map(t => t.x + t.width)) - x;
  const height = Math.max(...bounds.map(t => t.y + t.height)) - y;
  const targetX = position?.x ?? x + offset, targetY = position?.y ?? y + offset;
  return {
    dx: Math.max(0, Math.min(targetX, Math.max(0, dimensions.widthPt - width))) - x,
    dy: Math.max(0, Math.min(targetY, Math.max(0, dimensions.heightPt - height))) - y,
    oversized: width > dimensions.widthPt || height > dimensions.heightPt,
  };
}
