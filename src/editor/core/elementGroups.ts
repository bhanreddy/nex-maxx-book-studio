import type { PageElement, ElementTransform } from "../../domain/element/types";

/** Children keep absolute page coordinates, so grouping never changes their appearance. */
export function elementTree(ids: string[], elements: Record<string, PageElement>): PageElement[] {
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id) || !elements[id]) return;
    seen.add(id);
    elements[id].childElementIds?.forEach(visit);
  };
  ids.forEach(visit);
  return [...seen].map(id => elements[id]);
}

export function selectionRoot(id: string, elements: Record<string, PageElement>): string {
  const seen = new Set<string>();
  while (elements[id]?.groupId && !seen.has(id)) {
    seen.add(id);
    const parent = elements[id].groupId!;
    if (!elements[parent]) break;
    id = parent;
  }
  return id;
}

export function isElementLocked(id: string, elements: Record<string, PageElement>): boolean {
  const seen = new Set<string>();
  while (elements[id] && !seen.has(id)) {
    seen.add(id);
    if (elements[id].locked) return true;
    id = elements[id].groupId || "";
  }
  return false;
}

export function transformGroupChildren(group: PageElement, next: ElementTransform, elements: Record<string, PageElement>): Record<string, PageElement> {
  const old = group.transform;
  const sx = next.width / Math.max(1, old.width), sy = next.height / Math.max(1, old.height);
  const angle = (next.rotation - old.rotation) * Math.PI / 180;
  const cx = next.x + next.width / 2, cy = next.y + next.height / 2;
  return Object.fromEntries(elementTree(group.childElementIds || [], elements).map(child => {
    const t = child.transform;
    const dx = (t.x + t.width / 2 - old.x) * sx - next.width / 2;
    const dy = (t.y + t.height / 2 - old.y) * sy - next.height / 2;
    const transform = { ...t, x: cx + dx * Math.cos(angle) - dy * Math.sin(angle) - t.width * sx / 2,
      y: cy + dx * Math.sin(angle) + dy * Math.cos(angle) - t.height * sy / 2,
      width: t.width * sx, height: t.height * sy, rotation: t.rotation + next.rotation - old.rotation,
      zIndex: t.zIndex + next.zIndex - old.zIndex };
    return [child.id, { ...child, transform, smartBlockData: child.smartBlockData ? { ...child.smartBlockData, transform } : undefined }];
  }));
}

export function cloneElementTree(items: PageElement[], pageId: string, offset: { dx: number; dy: number }) {
  const ids = Object.fromEntries(items.map(el => [el.id, crypto.randomUUID()]));
  const elements = Object.fromEntries(items.map(source => {
    const el = structuredClone(source);
    el.id = ids[source.id]; el.pageId = pageId;
    el.groupId = source.groupId ? ids[source.groupId] : undefined;
    el.childElementIds = source.childElementIds?.map(id => ids[id]).filter(Boolean);
    el.transform = { ...el.transform, x: el.transform.x + offset.dx, y: el.transform.y + offset.dy, zIndex: el.transform.zIndex + 1 };
    if (el.smartBlockData) {
      el.smartBlockData = { ...el.smartBlockData, id: el.id, pageId, transform: el.transform,
        curriculum: el.smartBlockData.curriculum ? { ...el.smartBlockData.curriculum, chapterId: undefined, sourceBlockId: undefined } : undefined };
    }
    return [el.id, el];
  }));
  return { elements, roots: items.filter(el => !el.groupId || !ids[el.groupId]).map(el => ids[el.id]) };
}
