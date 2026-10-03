/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - MATH COMPONENT ACTIONS
// Insertion, Drag & Drop handling, and Detach to Vector Page Elements
// ============================================================================

import { useEditorStore } from "../stores/editorStore";
import { useHistoryStore } from "../stores/historyStore";
import type { CustomMathTemplateEntry } from "./types";
import { useUiStore } from "../stores/uiStore";
import { getMathTemplate, recordRecentMathId } from "./mathRegistry";
import { mathSceneForElement } from "./mathScene";
import { PageElement } from "../../domain/element/types";

/**
 * Insert a Math Template onto the active page at an optional (x, y) coordinate
 */
export function insertMathComponent(
  templateId: string,
  targetX?: number,
  targetY?: number,
  customData?: Record<string, any>,
  settings?: Partial<CustomMathTemplateEntry>
): string | null {
  const { getActiveBook, getActivePage, getActivePageElements } = useEditorStore.getState();
  const book = getActiveBook();
  const page = getActivePage();
  if (!book || !page) return null;

  const template = getMathTemplate(templateId);
  if (!template) {
    useUiStore.getState().showToast({
      type: "error",
      title: "Template Not Found",
      message: `Math template ${templateId} is not registered.`,
    });
    return null;
  }

  recordRecentMathId(template.id);

  const activeElements = getActivePageElements();
  const maxZ = activeElements.reduce((max, el) => Math.max(max, el.transform.zIndex), 0);
  const id = `el-math-${Math.random().toString(36).substring(2, 9)}`;

  const width = settings?.width || template.defaultWidth;
  const height = settings?.height || template.defaultHeight;
  const posX =
    targetX !== undefined
      ? Math.max(10, Math.min(book.dimensions.widthPt - width - 10, targetX))
      : Math.max(40, Math.round((book.dimensions.widthPt - width) / 2));

  const posY = targetY !== undefined ? Math.max(20, targetY) : 140;

  const dataPayload = { ...template.defaultData, ...customData };

  const newElement: PageElement = {
    id,
    pageId: page.id,
    type: "math-component" as const,
    category: "math" as const,
    version: 1,
    displayName: settings?.name || template.name,
    presetId: template.id,
    transform: {
      x: posX,
      y: posY,
      width,
      height,
      rotation: 0,
      zIndex: maxZ + 1,
    },
    style: {
      backgroundColor: "transparent",
    },
    content: {
      ...structuredClone(dataPayload),
      mathTemplateId: template.id,
      mathData: structuredClone(dataPayload),
      mathMode: settings?.mode || "teacher",
      styleVariant: settings?.styleVariant || (template.styleVariants.includes("color-coded") ? "color-coded" : template.styleVariants[0]),
      mathAppearance: structuredClone(settings?.appearance || { resizeMode: "scale" }),
      mathOverrides: structuredClone(settings?.overrides || {}),
    },
    locked: false,
    hidden: false,
  };

  const previousSelection = useEditorStore.getState().selectedElementIds;
  const apply = (forward: boolean) => {
    useEditorStore.setState(state => {
      const elements = { ...state.elements };
      if (forward) elements[id] = newElement; else delete elements[id];
      return { elements,
        books: state.books.map(b => b.id === book.id ? { ...b, pages: b.pages.map(p => p.id === page.id ? {
          ...p, elementIds: forward ? [...p.elementIds.filter(eid => eid !== id), id] : p.elementIds.filter(eid => eid !== id),
        } : p) } : b),
        selectedElementIds: forward ? [id] : previousSelection.filter(eid => Boolean(elements[eid])),
      };
    });
    useEditorStore.getState().saveToStorage();
  };
  apply(true);
  useHistoryStore.getState().pushAction({ description: `Insert ${template.name}`, undo: () => apply(false), redo: () => apply(true) });
  useUiStore.getState().setRightInspectorOpen(true);

  useUiStore.getState().showToast({
    type: "success",
    title: `Inserted ${template.name}`,
    message: "Double-click text to edit. Resize and style every part in the Inspector.",
  });

  return id;
}

/**
 * Detach a Math Component into native vector elements (rectangles, texts, lines) grouped together.
 * Allows authors to freely ungroup and edit individual items manually if desired.
 */
export function detachMathComponentToElements(elementId: string): void {
  const store = useEditorStore.getState();
  const element = store.elements[elementId];
  if (!element || element.type !== "math-component") return;

  const page = store.books
    .flatMap((b) => b.pages)
    .find((p) => p.elementIds.includes(elementId));
  if (!page) return;

  // Generate vector scene nodes for the math component
  const scene = mathSceneForElement(element);
  const newElementIds: string[] = [];
  const newElementsMap: Record<string, PageElement> = {};
  const baseZ = element.transform.zIndex;

  let zCounter = 1;
  scene.nodes.forEach((node, idx) => {
    const childId = `el-detached-${Math.random().toString(36).substring(2, 8)}-${idx}`;

    if (node.kind === "text") {
      const textElem: PageElement = {
        id: childId,
        pageId: page.id,
        type: "body-text",
        category: "text",
        version: 1,
        displayName: node.text.slice(0, 15),
        transform: {
          x: element.transform.x + node.x,
          y: element.transform.y + Math.max(0, node.y - node.size),
          width: Math.max(20, node.text.length * node.size * 0.7),
          height: Math.max(16, node.size * 1.4),
          rotation: 0,
          zIndex: baseZ + zCounter++,
        },
        style: {
          fontSize: node.size,
          fontFamily: node.fontFamily || "Noto Sans",
          fontWeight: node.bold ? 700 : 400,
          color: node.fill || "#1E293B",
          textAlign: node.align === "middle" ? "center" : node.align === "end" ? "right" : "left",
        },
        content: {
          text: node.text,
        },
        locked: false,
        hidden: false,
      };
      newElementIds.push(childId);
      newElementsMap[childId] = textElem;
    } else if (node.kind === "rect") {
      const rectElem: PageElement = {
        id: childId,
        pageId: page.id,
        type: "shape",
        category: "decorative",
        version: 1,
        displayName: "Detached Shape",
        transform: {
          x: element.transform.x + node.x,
          y: element.transform.y + node.y,
          width: Math.max(4, node.w),
          height: Math.max(4, node.h),
          rotation: 0,
          zIndex: baseZ + zCounter++,
        },
        style: {
          backgroundColor: node.fill !== "none" ? node.fill : "transparent",
          borderColor: node.stroke,
          borderWidth: node.strokeWidth || 1,
          borderRadius: node.radius || 0,
        },
        content: {
          shape: "rectangle",
        },
        locked: false,
        hidden: false,
      };
      newElementIds.push(childId);
      newElementsMap[childId] = rectElem;
    } else if (node.kind === "line") {
      const lineElem: PageElement = {
        id: childId,
        pageId: page.id,
        type: "divider",
        category: "decorative",
        version: 1,
        displayName: "Detached Line",
        transform: {
          x: element.transform.x + Math.min(node.x, node.x2),
          y: element.transform.y + Math.min(node.y, node.y2),
          width: Math.max(2, Math.abs(node.x2 - node.x)),
          height: Math.max(2, Math.abs(node.y2 - node.y)),
          rotation: 0,
          zIndex: baseZ + zCounter++,
        },
        style: {
          borderColor: node.stroke || "#334155",
          borderWidth: node.strokeWidth || 1,
        },
        content: {},
        locked: false,
        hidden: false,
      };
      newElementIds.push(childId);
      newElementsMap[childId] = lineElem;
    }
  });

  if (newElementIds.length === 0) return;

  // Replace original element with detached elements on page
  useEditorStore.setState((state) => {
    const updatedElements = { ...state.elements, ...newElementsMap };
    delete updatedElements[elementId];

    return {
      elements: updatedElements,
      books: state.books.map((b) =>
        b.id === state.activeBookId
          ? {
              ...b,
              pages: b.pages.map((p) =>
                p.id === page.id
                  ? {
                      ...p,
                      elementIds: p.elementIds
                        .filter((id) => id !== elementId)
                        .concat(newElementIds),
                    }
                  : p
              ),
            }
          : b
      ),
      selectedElementIds: newElementIds,
    };
  });

  // Automatically group the detached elements so they remain cleanly cohesive
  useEditorStore.getState().groupSelectedElements();
  useEditorStore.getState().saveToStorage();

  useUiStore.getState().showToast({
    type: "success",
    title: "Converted to Vector Elements",
    message: "Math component detached into fully editable vector group.",
  });
}
