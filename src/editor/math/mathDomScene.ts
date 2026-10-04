import React from "react";
import type { PageElement } from "../../domain/element/types";
import type { PublicationScene, SceneNode } from "../educational/publicationScene";
import { transformScenePath } from "../educational/sceneGeometry";
import { buildEditableMathTree, mathRenderFrame } from "./mathEditableTree";
import type { MathTemplate } from "./types";
import { wordProblemData } from "./wordProblemLayout";

const SVG_NS = "http://www.w3.org/2000/svg";
const unitless = new Set(["opacity", "fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink", "order", "zIndex", "strokeWidth"]);
const svgNames: Record<string, string> = { className: "class", textAnchor: "text-anchor", fontFamily: "font-family", fontSize: "font-size", fontWeight: "font-weight", strokeWidth: "stroke-width", strokeLinecap: "stroke-linecap", strokeLinejoin: "stroke-linejoin", strokeDasharray: "stroke-dasharray", fillRule: "fill-rule", markerStart: "marker-start", markerEnd: "marker-end", stopColor: "stop-color", stopOpacity: "stop-opacity", gradientUnits: "gradientUnits" };

/** A detached DOM layout uses the same React host tree and CSS as the canvas,
 * including text/design overrides. It never changes the live page or stores. */
function appendTree(parent: Element, tree: React.ReactNode, svg = false): void {
  if (Array.isArray(tree)) { tree.forEach(child => appendTree(parent, child, svg)); return; }
  if (typeof tree === "string" || typeof tree === "number") { parent.appendChild(document.createTextNode(String(tree))); return; }
  if (!React.isValidElement<Record<string, unknown>>(tree)) return;
  if (typeof tree.type !== "string") { appendTree(parent, tree.props.children as React.ReactNode, svg); return; }
  const inSvg = svg || tree.type === "svg";
  const element = inSvg ? document.createElementNS(SVG_NS, tree.type) : document.createElement(tree.type);
  for (const [key, value] of Object.entries(tree.props)) {
    if (key === "children" || key === "ref" || key.startsWith("on") || value === undefined || value === null) continue;
    if (key === "style") {
      const style = (element as HTMLElement | SVGElement).style;
      for (const [name, v] of Object.entries(value as Record<string, unknown>)) if (v !== undefined && v !== null) {
        style.setProperty(name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`), typeof v === "number" && v !== 0 && !unitless.has(name) ? `${v}px` : String(v));
      }
    } else if (typeof value !== "function") {
      element.setAttribute(inSvg ? svgNames[key] || key : key === "className" ? "class" : key, String(value));
    }
  }
  appendTree(element, tree.props.children as React.ReactNode, inSvg);
  parent.appendChild(element);
}

function color(value: string): string {
  if (!value || value === "none" || value === "transparent" || /rgba\([^)]*,\s*0\s*\)/.test(value)) return "none";
  const rgb = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!rgb) return value.startsWith("#") ? value : "none";
  return `#${rgb.slice(1, 4).map(n => Number(n).toString(16).padStart(2, "0")).join("")}`;
}

/** Catalogue HTML uses browser line breaking. Measure the same tree and CSS
 * synchronously so its height belongs to the resize's single undo action. */
export function measureMathDomHeight(template: MathTemplate, content: PageElement["content"], width: number, intrinsic = false): number | null {
  if (typeof document === "undefined" || !document.body) return null;
  const { tree } = buildEditableMathTree(template, {
    data: content.mathData || content, mode: content.mathMode || "teacher", styleVariant: content.styleVariant || "color-coded",
    width, height: template.defaultHeight,
  }, { overrides: content.mathOverrides, appearance: content.mathAppearance });
  const host = document.createElement("div");
  host.className = "math-component-frame";
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}pt;height:${template.defaultHeight}pt;pointer-events:none;color-scheme:light;font-family:Inter,sans-serif;`;
  appendTree(host, tree);
  if (intrinsic) {
    host.style.height = "auto";
    const root = host.firstElementChild as HTMLElement | null;
    if (root && root.namespaceURI !== SVG_NS) {
      root.style.height = "auto";
      root.style.justifyContent = "flex-start";
      if (root.classList.contains("justify-between")) root.style.rowGap = "6px";
    }
  }
  document.body.appendChild(host);
  try {
    const top = host.getBoundingClientRect().top;
    let bottom = intrinsic ? host.getBoundingClientRect().bottom : top + template.defaultHeight / .75;
    for (const node of host.querySelectorAll("*")) {
      if (getComputedStyle(node).display === "none") continue;
      const rect = node.getBoundingClientRect();
      if (rect.width && rect.height) bottom = Math.max(bottom, rect.bottom);
    }
    return Math.ceil((bottom - top) * .75);
  } finally { host.remove(); }
}

export function mathDomScene(element: PageElement, template: MathTemplate): PublicationScene | null {
  if (typeof document === "undefined" || typeof document.createElementNS !== "function" || !document.body) return null;
  const { width, height } = element.transform;
  const authoredData = element.content.mathData || element.content;
  const data = template.id === "math-word-problem" ? wordProblemData(authoredData, element.content.mathOverrides) : authoredData;
  const frame = mathRenderFrame(template, width, height, element.content.mathAppearance, data);
  const { tree } = buildEditableMathTree(template, { data: element.content.mathData || element.content,
    mode: element.content.mathMode || "teacher", styleVariant: element.content.styleVariant || "color-coded",
    width: frame.renderWidth, height: frame.renderHeight,
  }, { overrides: element.content.mathOverrides, appearance: element.content.mathAppearance });
  const host = document.createElement("div");
  host.className = "math-component-frame";
  // Lay out offscreen at physical page size, independent of the canvas zoom.
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}pt;height:${height}pt;pointer-events:none;overflow:hidden;color-scheme:light;color:#0f172a;font-family:Inter,sans-serif;`;
  const body = document.createElement("div");
  body.style.cssText = `position:absolute;left:${frame.padding + frame.offsetX}pt;top:${frame.padding + frame.offsetY}pt;width:${frame.renderWidth}pt;height:${frame.renderHeight}pt;transform:scale(${frame.scaleX},${frame.scaleY});transform-origin:top left;`;
  appendTree(body, tree); host.appendChild(body); document.body.appendChild(host);
  return captureDomScene(host, body, width, height, frame.scaleY, "math-component");
}

/** Clone the current responsive HTML layout for vector export, independent of canvas zoom. */
const preparedElementScenes = new WeakMap<PageElement, PublicationScene>();
export function elementDomScene(element: PageElement, source?: HTMLElement): PublicationScene | null {
  if (!source && preparedElementScenes.has(element)) return preparedElementScenes.get(element)!;
  if (typeof document === "undefined" || !document.body) return null;
  const live = source || document.getElementById(`element-${element.id}`);
  if (!live) return null;
  const host = live.cloneNode(true) as HTMLElement;
  host.removeAttribute("id");
  host.style.cssText += `;position:fixed;left:-100000px;top:0;width:${element.transform.width}pt;height:${element.transform.height}pt;transform:none;opacity:1;pointer-events:none;`;
  for (const node of host.querySelectorAll("[id], [data-canvas-controls]")) {
    if (node.hasAttribute("data-canvas-controls")) node.remove(); else node.removeAttribute("id");
  }
  document.body.appendChild(host);
  return captureDomScene(host, host, element.transform.width, element.transform.height, element.responsiveLayout?.scale || 1, "responsive-element");
}

/** Render inactive pages offscreen too; export must not depend on which page is open. */
export async function prepareResponsiveElementScenes(elements: PageElement[]): Promise<void> {
  const responsive = elements.filter(element => element.responsiveLayout && !element.hidden);
  if (!responsive.length || typeof document === "undefined" || !document.body) return;
  const [{ createRoot }, { flushSync }, { ElementRenderer }] = await Promise.all([import("react-dom/client"), import("react-dom"), import("../renderer/ElementRenderer")]);
  for (const element of responsive) {
    const container = document.createElement("div");
    container.style.cssText = `position:fixed;left:-100000px;top:0;width:${element.transform.width}pt;height:${element.transform.height}pt;pointer-events:none;`;
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      flushSync(() => root.render(React.createElement(ElementRenderer, { element: { ...element, transform: { ...element.transform, x: 0, y: 0, rotation: 0 } } })));
      const rendered = container.firstElementChild as HTMLElement | null;
      if (rendered) {
        const scene = elementDomScene(element, rendered);
        if (scene) preparedElementScenes.set(element, scene);
      }
    } finally { flushSync(() => root.unmount()); container.remove(); }
  }
}

function captureDomScene(host: HTMLElement, body: HTMLElement, width: number, height: number, readingScale: number, variant: string): PublicationScene | null {
  try {
    const bounds = host.getBoundingClientRect(), ratio = width / bounds.width;
    if (!Number.isFinite(ratio) || ratio <= 0) return null;
    const nodes: SceneNode[] = [];
    const px = (x: number) => (x - bounds.left) * ratio, py = (y: number) => (y - bounds.top) * ratio;
    const walk = (el: Element, parentOpacity = 1, inheritedClip?: string) => {
      const css = getComputedStyle(el);
      if (css.display === "none" || css.visibility === "hidden") return;
      const opacity = parentOpacity * Number(css.opacity || 1);
      const rect = el.getBoundingClientRect();
      const isSvg = el.namespaceURI === SVG_NS, tag = el.tagName.toLowerCase();
      if (["defs", "marker", "lineargradient", "radialgradient", "clippath"].includes(tag)) return;
      let clipId = inheritedClip;
      if (!isSvg && el !== host && (css.overflow === "hidden" || css.overflow === "clip")) {
        clipId = `math-clip-${nodes.length}`;
        // Intersect parent clip so nested overflow never reveals clipped content.
        const parent = inheritedClip ? nodes.find(n => n.kind === "clip" && n.id === inheritedClip) : undefined;
        const x = Math.max(px(rect.left), parent?.kind === "clip" ? parent.x : 0), y = Math.max(py(rect.top), parent?.kind === "clip" ? parent.y : 0);
        const right = Math.min(px(rect.right), parent?.kind === "clip" ? parent.x + parent.w : width), bottom = Math.min(py(rect.bottom), parent?.kind === "clip" ? parent.y + parent.h : height);
        nodes.push({ kind: "clip", id: clipId, x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y), radius: parseFloat(css.borderRadius) * ratio || 0 });
      }
      const mark = { opacity, clipId };
      if (!isSvg) {
        if (tag === "img" && el instanceof HTMLImageElement && el.src && rect.width && rect.height) nodes.push({ kind: "image", x: px(rect.left), y: py(rect.top), w: rect.width * ratio, h: rect.height * ratio, src: el.src, alt: el.alt, focalX: .5, focalY: .5, scale: 1, fit: "contain", ...mark });
        const fill = color(css.backgroundColor);
        const gradient = css.backgroundImage.match(/(?:#[\da-f]{3,8}|rgba?\([^)]*\))/gi);
        let gradientId: string | undefined;
        if (gradient && gradient.length >= 2) {
          gradientId = `math-gradient-${nodes.length}`;
          nodes.push({ kind: "gradient", id: gradientId, x1: px(rect.left), y1: py(rect.top), x2: px(rect.right), y2: py(rect.bottom), from: color(gradient[0]), to: color(gradient[gradient.length - 1]) });
        }
        const scaleX = el instanceof HTMLElement && el.offsetWidth ? rect.width / el.offsetWidth : 1;
        if ((fill !== "none" || gradientId) && rect.width && rect.height) nodes.push({ kind: "rect", x: px(rect.left), y: py(rect.top), w: rect.width * ratio, h: rect.height * ratio, radius: (parseFloat(css.borderRadius) || 0) * ratio * scaleX, fill: fill === "none" ? "#ffffff" : fill, gradientId, ...mark });
        const sides = ["Top", "Right", "Bottom", "Left"] as const;
        const widths = sides.map(side => parseFloat(css[`border${side}Width`]) || 0);
        if (widths.some(n => n > 0)) {
          if (widths.every(n => n === widths[0]) && sides.every(side => css[`border${side}Style`] !== "none")) nodes.push({ kind: "rect", x: px(rect.left), y: py(rect.top), w: rect.width * ratio, h: rect.height * ratio, radius: (parseFloat(css.borderRadius) || 0) * ratio * scaleX, fill: "none", stroke: color(css.borderTopColor), strokeWidth: widths[0] * ratio * scaleX, ...mark });
          else sides.forEach((side, i) => { if (widths[i] > 0 && css[`border${side}Style`] !== "none") {
            const edges = [[rect.left, rect.top, rect.right, rect.top], [rect.right, rect.top, rect.right, rect.bottom], [rect.left, rect.bottom, rect.right, rect.bottom], [rect.left, rect.top, rect.left, rect.bottom]];
            const [x, y, x2, y2] = edges[i]; nodes.push({ kind: "line", x: px(x), y: py(y), x2: px(x2), y2: py(y2), stroke: color(css[`border${side}Color`]), strokeWidth: widths[i] * ratio * scaleX, ...mark });
          } });
        }
      } else if (["rect", "circle", "ellipse", "line", "polygon", "polyline", "path"].includes(tag)) {
        const geometry = el as SVGGeometryElement, matrix = geometry.getScreenCTM();
        if (matrix) {
          const point = (x: number, y: number): number[] => [px(matrix.a * x + matrix.c * y + matrix.e), py(matrix.b * x + matrix.d * y + matrix.f)];
          const attr = (name: string) => Number(el.getAttribute(name) || 0);
          const fill = color(css.fill), stroke = color(css.stroke), strokeWidth = (parseFloat(css.strokeWidth) || 0) * Math.hypot(matrix.a, matrix.b) * ratio;
          if (tag === "line") {
            const [x, y] = point(attr("x1"), attr("y1")), [x2, y2] = point(attr("x2"), attr("y2"));
            nodes.push({ kind: "line", x, y, x2, y2, stroke, strokeWidth, ...mark });
            // Native SVG markers are expanded into printable vector arrowheads.
            for (const end of ["start", "end"]) if (el.getAttribute(`marker-${end}`)) {
              const origin = end === "end" ? [x2, y2] : [x, y], angle = Math.atan2(y2 - y, x2 - x) + (end === "start" ? Math.PI : 0), length = Math.max(4, strokeWidth * 3), spread = length * .45;
              nodes.push({ kind: "polygon", points: [origin, [origin[0] - length * Math.cos(angle) + spread * Math.sin(angle), origin[1] - length * Math.sin(angle) - spread * Math.cos(angle)], [origin[0] - length * Math.cos(angle) - spread * Math.sin(angle), origin[1] - length * Math.sin(angle) + spread * Math.cos(angle)]], fill: stroke, ...mark });
            }
          } else if (tag === "path" && Math.abs(matrix.b) < .0001 && Math.abs(matrix.c) < .0001) {
            nodes.push({ kind: "path", d: transformScenePath(el.getAttribute("d") || "", matrix.a * ratio, matrix.d * ratio, px(matrix.e), py(matrix.f)), fill, stroke: stroke === "none" ? undefined : stroke, strokeWidth, ...mark });
          } else if (tag === "rect" && Math.abs(matrix.b) < .0001 && Math.abs(matrix.c) < .0001) {
            const [x, y] = point(attr("x"), attr("y"));
            nodes.push({ kind: "rect", x, y, w: attr("width") * matrix.a * ratio, h: attr("height") * matrix.d * ratio, radius: attr("rx") * matrix.a * ratio, fill, stroke: stroke === "none" ? undefined : stroke, strokeWidth, ...mark });
          } else if ((tag === "circle" || tag === "ellipse") && Math.abs(matrix.b) < .0001 && Math.abs(matrix.c) < .0001) {
            const [x, y] = point(attr("cx"), attr("cy"));
            nodes.push({ kind: "ellipse", x, y, rx: attr(tag === "circle" ? "r" : "rx") * Math.abs(matrix.a) * ratio, ry: attr(tag === "circle" ? "r" : "ry") * Math.abs(matrix.d) * ratio, fill, stroke: stroke === "none" ? undefined : stroke, strokeWidth, ...mark });
          } else if (typeof geometry.getTotalLength === "function") {
            const length = geometry.getTotalLength(), count = Math.max(4, Math.min(800, Math.ceil(length / 1.5)));
            const points = Array.from({ length: count + 1 }, (_, i) => { const p = geometry.getPointAtLength(length * i / count); return point(p.x, p.y); });
            if (fill !== "none") nodes.push({ kind: "polygon", points, fill, stroke: stroke === "none" ? undefined : stroke, strokeWidth, ...mark });
            else if (stroke !== "none") for (let i = 1; i < points.length; i++) nodes.push({ kind: "line", x: points[i - 1][0], y: points[i - 1][1], x2: points[i][0], y2: points[i][1], stroke, strokeWidth, ...mark });
          }
        }
      }
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) { walk(child as Element, opacity, clipId); continue; }
        if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim()) continue;
        const text = child.textContent;
        const range = document.createRange(); range.selectNodeContents(child);
        const rects = Array.from(range.getClientRects());
        if (!rects.length) continue;
        const matrix = isSvg ? (el as SVGGraphicsElement).getScreenCTM() : null;
        const elementScale = matrix ? Math.hypot(matrix.c, matrix.d) : el instanceof HTMLElement && el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : readingScale;
        const size = (parseFloat(css.fontSize) || 12) * ratio * elementScale;
        const fill = color(isSvg ? css.fill : css.color);
        const pushText = (value: string, r: DOMRect) => {
          const transformed = css.textTransform === "uppercase" ? value.toUpperCase() : css.textTransform === "lowercase" ? value.toLowerCase() : value;
          nodes.push({ kind: "text", text: transformed, x: px(r.left), y: py(r.top) + size * .84, size, fill,
            fontFamily: css.fontFamily.split(",")[0].replace(/["']/g, ""), bold: Number(css.fontWeight) >= 600,
            italic: css.fontStyle === "italic", textLength: r.width * ratio, ...mark });
        };
        if (rects.length === 1) pushText(text, rects[0]);
        else {
          let current = "", currentRect: DOMRect | null = null;
          for (let i = 0; i < text.length; i++) {
            range.setStart(child, i); range.setEnd(child, i + 1); const r = range.getBoundingClientRect();
            if (currentRect && Math.abs(currentRect.top - r.top) > 2) { pushText(current, currentRect); current = ""; currentRect = null; }
            current += text[i]; currentRect = currentRect ? new DOMRect(currentRect.left, currentRect.top, r.right - currentRect.left, Math.max(r.height, currentRect.height)) : r;
          }
          if (currentRect) pushText(current, currentRect);
        }
      }
    };
    walk(body);
    return { width, height, variant, warnings: [], nodes };
  } finally { host.remove(); }
}
