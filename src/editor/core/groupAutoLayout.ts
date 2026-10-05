import type { AdaptiveGroupConfig, PageElement } from "../../domain/element/types";
import { elementTree, isElementLocked, selectionRoot, transformGroupChildren } from "./elementGroups";
import { withBlockTransform } from "./blockResize";

export const defaultAutoLayout = (direction: "horizontal" | "vertical"): AdaptiveGroupConfig => ({
  direction, spacingPt: 12, padding: { top: 0, right: 0, bottom: 0, left: 0 },
  alignment: "start", distribution: "start", widthMode: "fit-content", heightMode: "fit-content",
});

export function hasGroupAutoLayout(element: PageElement): boolean {
  return element.type === "group" && element.layoutMode === "adaptive" &&
    (element.adaptiveGroup?.direction === "horizontal" || element.adaptiveGroup?.direction === "vertical");
}

/** Capture siblings and ancestors too: an inner resize can reflow the entire outer group. */
export function layoutAffectedTree(ids: string[], elements: Record<string, PageElement>): PageElement[] {
  return elementTree(ids.map(id => selectionRoot(id, elements)), elements);
}

/** Pure, opt-in layout. Absolute page coordinates remain the persisted source of truth. */
export function reflowGroupAutoLayout(elements: Record<string, PageElement>, changedIds: string[]): Record<string, PageElement> {
  const next = { ...elements }, visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id) || !next[id]) return;
    visited.add(id);
    next[id].childElementIds?.forEach(visit);
    const group = next[id];
    if (!hasGroupAutoLayout(group) || isElementLocked(id, next) || group.transform.rotation !== 0 ||
        elementTree(group.childElementIds || [], next).some(child => child.locked)) return;
    const children = (group.childElementIds || []).map(childId => next[childId]).filter(child => child && !child.hidden);
    if (!children.length) return;
    const config = group.adaptiveGroup!, horizontal = config.direction === "horizontal";
    const finite = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
    const padding = { top: finite(config.padding.top), right: finite(config.padding.right), bottom: finite(config.padding.bottom), left: finite(config.padding.left) };
    const gap = finite(config.spacingPt);
    const mainSize = children.reduce((sum, child) => sum + (horizontal ? child.transform.width : child.transform.height), 0);
    const crossSize = Math.max(...children.map(child => horizontal ? child.transform.height : child.transform.width));
    const width = config.widthMode === "fit-content" ? (horizontal ? mainSize + gap * (children.length - 1) : crossSize) + padding.left + padding.right : group.transform.width;
    const height = config.heightMode === "fit-content" ? (horizontal ? crossSize : mainSize + gap * (children.length - 1)) + padding.top + padding.bottom : group.transform.height;
    const innerMain = horizontal ? width - padding.left - padding.right : height - padding.top - padding.bottom;
    const innerCross = horizontal ? height - padding.top - padding.bottom : width - padding.left - padding.right;
    const remaining = Math.max(0, innerMain - mainSize - gap * (children.length - 1));
    const distributedGap = gap + (config.distribution === "space-between" && children.length > 1 ? remaining / (children.length - 1) : 0);
    let cursor = config.distribution === "center" ? remaining / 2 : config.distribution === "end" ? remaining : 0;
    for (const child of children) {
      const cross = horizontal ? child.transform.height : child.transform.width;
      const offset = config.alignment === "center" ? (innerCross - cross) / 2 : config.alignment === "end" ? innerCross - cross : 0;
      const transform = { ...child.transform,
        x: group.transform.x + padding.left + (horizontal ? cursor : offset),
        y: group.transform.y + padding.top + (horizontal ? offset : cursor),
        ...(config.alignment === "stretch" ? horizontal ? { height: Math.max(1, innerCross) } : { width: Math.max(1, innerCross) } : {}),
      };
      Object.assign(next, transformGroupChildren(child, transform, next, "auto"));
      next[child.id] = child.category === "text" ? { ...child, transform } : withBlockTransform(child, transform, "auto");
      cursor += (horizontal ? transform.width : transform.height) + distributedGap;
    }
    next[id] = { ...group, transform: { ...group.transform, width, height } };
  };
  changedIds.map(id => selectionRoot(id, next)).forEach(visit);
  return next;
}
