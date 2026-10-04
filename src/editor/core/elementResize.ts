import type { ElementTransform, PageElement } from "../../domain/element/types";
import { layoutTextFlow } from "../layoutPartner/textWrapLayout";
import { wrapText } from "../educational/publicationScene";
import type { BlockResizeMode } from "./blockResize";
import { anchorResizedHeight, fitLayoutScale } from "./resizeLayout";
import { transformScenePath } from "../educational/sceneGeometry";

export const NATIVE_TEXT_TYPES = new Set(["heading", "subheading", "body", "body-text", "caption", "quote", "chapter-title", "lesson-title", "header", "footer", "pageNumber", "page-number", "sidebar", "callout"]);
const GRAPHIC_TYPES = new Set(["group", "image", "picture-frame", "pictureFrame", "ai-image", "illustration", "diagram", "shape", "divider", "borderFrame", "vector-curve", "compound-shape", "ai-vector", "pixel-layer", "adjustment-layer", "live-filter", "qrCode", "smart-media-qr"]);
export function elementLayoutFrame(element: PageElement) {
  const scale = Math.max(.001, element.responsiveLayout?.scale || 1);
  return { width: element.transform.width / scale, height: element.transform.height / scale, scale };
}

/** All dimension inputs and pointer handles share this path, including legacy elements. */
export function withElementTransform(element: PageElement, requested: ElementTransform, mode: BlockResizeMode): PageElement {
  const old = element.transform, widthChanged = requested.width !== old.width, heightChanged = requested.height !== old.height;
  if (!widthChanged && !heightChanged) return { ...element, transform: requested };
  requested = { ...requested, width: Math.max(1, requested.width), height: Math.max(1, requested.height) };
  if (element.style.pathData) {
    const sx = requested.width / old.width, sy = requested.height / old.height;
    element = { ...element, style: { ...element.style, pathData: transformScenePath(element.style.pathData, sx, sy) },
      curveData: element.curveData ? { ...element.curveData, nodes: element.curveData.nodes.map(node => ({ ...node, x: node.x * sx, y: node.y * sy, handleIn: node.handleIn ? { x: node.handleIn.x * sx, y: node.handleIn.y * sy } : undefined, handleOut: node.handleOut ? { x: node.handleOut.x * sx, y: node.handleOut.y * sy } : undefined })) } : element.curveData };
  }
  if (element.style.shapeText?.text) {
    const shapeText = element.style.shapeText;
    const padding = shapeText.padding ?? 10;
    const width = Math.max(1, requested.width - padding * 2), height = Math.max(.1, requested.height - padding * 2);
    let low = .1, high = Math.max(low, (shapeText.fontSize || 11) * (heightChanged ? requested.height / old.height : 1));
    for (let i = 0; i < 22; i++) {
      const size = (low + high) / 2;
      if (wrapText(shapeText.text, width, size, Number(shapeText.fontWeight || 500) >= 600, false, shapeText.fontFamily).length * size * (shapeText.lineHeight || 1.25) <= height) low = size; else high = size;
    }
    element = { ...element, style: { ...element.style, shapeText: { ...shapeText, fontSize: low } } };
  }
  if (heightChanged && element.content.caption && ["image", "picture-frame", "pictureFrame", "ai-image"].includes(element.type)) element = { ...element, style: { ...element.style, fontSize: Math.max(.1, (element.style.fontSize || 7.5) * requested.height / old.height) } };
  if (GRAPHIC_TYPES.has(element.type) || element.content.artwork || (element.content.publicationPrimitive && element.type !== "body")) return { ...element, transform: requested };
  if (NATIVE_TEXT_TYPES.has(element.type) && !element.content.design?.composition && !element.content.publicationPrimitive && !element.content.subtitle && !element.content.number) {
    let style = element.style;
    if (heightChanged) {
      const oldSize = style.fontSize || 10.5;
      let low = .1, high = Math.max(low, oldSize * requested.height / Math.max(1, old.height));
      for (let i = 0; i < 22; i++) {
        const fontSize = (low + high) / 2;
        const lineHeight = style.lineHeight && style.lineHeight > 4 ? style.lineHeight * fontSize / oldSize : style.lineHeight;
        const candidate = { ...element, transform: requested, style: { ...style, fontSize, lineHeight } };
        const layout = layoutTextFlow(candidate, []);
        if (!layout.oversetChars && layout.lineHeight <= requested.height) low = fontSize; else high = fontSize;
      }
      style = { ...style, fontSize: low, lineHeight: style.lineHeight && style.lineHeight > 4 ? style.lineHeight * low / oldSize : style.lineHeight };
    } else if (mode === "scale") {
      style = { ...style, fontSize: (style.fontSize || 10.5) * requested.width / old.width };
    }
    const height = !heightChanged && mode !== "scale" ? nativeTextHeight({ ...element, style }, requested.width) : requested.height;
    return { ...element, style, transform: anchorResizedHeight(old, requested, height, mode === "reflow-bottom") };
  }
  const previous = elementLayoutFrame(element);
  if (mode === "scale") {
    return { ...element, transform: requested, responsiveLayout: { scale: previous.scale * Math.min(requested.width / old.width, requested.height / old.height) } };
  }
  const measure = createElementHeightMeasurer(element);
  try {
    const scale = heightChanged ? fitLayoutScale(requested.width, requested.height, measure.height, previous.scale, 24, measure.dom ? 12 : 22, previous.scale * requested.height / old.height) : previous.scale;
    const height = heightChanged ? requested.height : measure.height(requested.width / scale) * scale;
    return { ...element, responsiveLayout: { scale }, transform: anchorResizedHeight(old, requested, height, mode === "reflow-bottom") };
  } finally { measure.dispose(); }
}

function nativeTextHeight(element: PageElement, width: number): number {
  const layout = layoutTextFlow({ ...element, transform: { ...element.transform, width, height: 100000 } }, []);
  const bottom = element.style.padding?.bottom || 0;
  return Math.max(layout.lineHeight, ...layout.fragments.map(line => line.y + layout.lineHeight)) + bottom + (element.style.borderWidth || 0);
}

/** A single offscreen clone is reused throughout fitting; live content is untouched. */
function createElementHeightMeasurer(element: PageElement): { height: (width: number) => number; dispose: () => void; dom: boolean } {
  const live = typeof document !== "undefined" ? document.getElementById(`element-${element.id}`) : null;
  if (!live || !document.body) {
    const text = contentText(element.content);
    const size = element.style.fontSize || 11;
    return { dom: false, dispose() {}, height: width => text ? Math.max(size * 1.4, wrapText(text, Math.max(1, width - 24), size).length * size * 1.4 + 24) : element.transform.height / elementLayoutFrame(element).scale };
  }
  const host = live.cloneNode(true) as HTMLElement;
  host.removeAttribute("id"); host.setAttribute("aria-hidden", "true");
  host.style.cssText += ";position:fixed;left:-100000px;top:0;transform:none;height:auto;min-height:0;pointer-events:none;visibility:hidden;column-count:auto;";
  const content = host.querySelector<HTMLElement>("[data-element-layout]");
  if (content) { content.style.transform = "none"; content.style.width = "100%"; content.style.height = "auto"; }
  for (const node of host.querySelectorAll<HTMLElement>("*")) {
    node.removeAttribute("id");
    if (node.hasAttribute("data-canvas-controls")) { node.remove(); continue; }
    if (node.classList.contains("h-full")) { node.style.height = "auto"; node.style.minHeight = "0"; }
    if (node.classList.contains("justify-center") || node.classList.contains("justify-end")) node.style.justifyContent = "flex-start";
    node.style.transition = "none"; node.style.animation = "none";
  }
  document.body.appendChild(host);
  return { dom: true, dispose: () => host.remove(), height: width => {
    host.style.width = `${width}pt`;
    const bounds = host.getBoundingClientRect();
    let bottom = bounds.bottom;
    for (const node of host.querySelectorAll("*")) {
      if (getComputedStyle(node).display === "none") continue;
      const rect = node.getBoundingClientRect();
      if (rect.width && rect.height) bottom = Math.max(bottom, rect.bottom);
    }
    return Math.max(1, (bottom - bounds.top) * .75);
  } };
}

function contentText(value: unknown): string {
  if (typeof value === "string") return value.replace(/<[^>]*>/g, " ");
  if (Array.isArray(value)) return value.map(contentText).filter(Boolean).join("\n");
  if (value && typeof value === "object") return Object.entries(value).filter(([key]) => !/url|src|image|design|id|palette|color/i.test(key)).map(([, v]) => contentText(v)).filter(Boolean).join("\n");
  return "";
}
