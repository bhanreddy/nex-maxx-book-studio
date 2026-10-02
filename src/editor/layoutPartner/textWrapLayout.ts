import type { TextWrapConfig } from "../../domain/creative/types";
import type { ElementStyle, PageElement } from "../../domain/element/types";
import type { PublicationScene, SceneNode } from "../educational/publicationScene";
import { imageMaskPath } from "../educational/imageTreatment";

export const IMAGE_TYPES = new Set(["image", "picture-frame", "pictureFrame", "ai-image"]);
export const FLOW_FONT_FAMILY = 'Inter, -apple-system, system-ui, "Segoe UI", Roboto, sans-serif';
export function effectiveTextWrap(element: PageElement): TextWrapConfig | undefined {
  return element.textWrap ?? element.style.textWrap ??
    { mode: isFlowText(element) ||
            element.content?.publicationPrimitive ||
            element.category === "decorative" ||
            ["body", "body-text", "quote", "sidebar", "callout", "borderFrame", "adjustment-layer", "live-filter"].includes(element.type)
            ? "none" : "square", offsetPt: 8 };
}
export function wrapsText(element: PageElement): boolean {
  const wrap = effectiveTextWrap(element);
  return !!wrap && !["none", "through", "floating"].includes(wrap.mode);
}
export function isFlowText(element: PageElement): boolean {
  return ["body", "body-text", "quote", "sidebar", "callout"].includes(element.type) &&
    !element.content.design?.composition && !element.content.publicationPrimitive;
}

type Point = { x: number; y: number };
const imageContours = new Map<string, Promise<Point[] | null>>();
const readyContours = new Map<string, Point[] | null>();
const contourSourceIds = new Map<string, number>();
function contourKey(element: PageElement): string {
  const c = element.content;
  const src = c.src || c.imageUrl || c.url || "";
  if (!contourSourceIds.has(src)) contourSourceIds.set(src, contourSourceIds.size + 1);
  return JSON.stringify([contourSourceIds.get(src), Math.round(element.transform.width / element.transform.height * 1000) / 1000,
    element.style.objectFit, c.focalX, c.focalY, c.cropScale || c.scale, c.flipX, c.flipY]);
}
export function needsTextWrapContour(element: PageElement): boolean {
  const wrap = effectiveTextWrap(element), c = element.content;
  return !!wrap && ["tight", "contour"].includes(wrap.mode) && IMAGE_TYPES.has(element.type) &&
    (!c.mask || c.mask === "rectangle") && !c.caption && !wrap.customContourPoints?.length && !wrap.contourPath &&
    !!(c.src || c.imageUrl || c.url) && !readyContours.has(contourKey(element));
}

/** Sample transparency once per crop, outside pointer events; coordinates are normalized. */
export async function prepareTextWrapContours(elements: PageElement[]): Promise<void> {
  if (typeof document === "undefined") return;
  await Promise.all(elements.map(async element => {
    const wrap = effectiveTextWrap(element), c = element.content;
    if (!needsTextWrapContour(element) || !wrap) return;
    const src = c.src || c.imageUrl || c.url; if (!src) return;
    const key = contourKey(element);
    let task = imageContours.get(key);
    if (!task) {
      task = new Promise<Point[] | null>(resolve => {
        const image = new Image(); image.crossOrigin = "anonymous";
        image.onerror = () => resolve(null);
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas"), w = 160, h = Math.max(16, Math.min(320, Math.round(w * element.transform.height / element.transform.width)));
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true }); if (!ctx) { resolve(null); return; }
            const ratio = element.style.objectFit === "contain" ? Math.min(w / image.naturalWidth, h / image.naturalHeight) : Math.max(w / image.naturalWidth, h / image.naturalHeight);
            const iw = element.style.objectFit === "fill" ? w : image.naturalWidth * ratio, ih = element.style.objectFit === "fill" ? h : image.naturalHeight * ratio;
            const fx = c.focalX ?? .5, fy = c.focalY ?? .5, scale = c.cropScale || c.scale || 1;
            ctx.translate(w * fx, h * fy); ctx.scale(scale * (c.flipX ? -1 : 1), scale * (c.flipY ? -1 : 1));ctx.translate(-w * fx, -h * fy);
            ctx.drawImage(image, (w - iw) * fx, (h - ih) * fy, iw, ih);
            const data = ctx.getImageData(0, 0, w, h).data, left: Point[] = [], right: Point[] = [];
            for (let y = 0; y < h; y++) {
              let min = w, max = -1;
              for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 16) { min = Math.min(min, x); max = x; }
              if (max >= 0) { left.push({ x: min / w, y: y / h }, { x: min / w, y: (y + 1) / h });
                right.push({ x: (max + 1) / w, y: y / h }, { x: (max + 1) / w, y: (y + 1) / h }); }
            }
            resolve(left.length ? [...left, ...right.reverse()] : null);
          } catch { resolve(null); } // Cross-origin images retain a safe rectangular exclusion.
        };
        image.src = src;
      }).then(points => { readyContours.set(key, points); return points; });
      if (imageContours.size > 128) { imageContours.clear(); readyContours.clear(); }
      imageContours.set(key, task);
    }
    await task;
  }));
}

/** Flatten supported SVG masks into a conservative contour polygon. */
function maskContour(path: string): Point[] {
  const tokens = path.match(/[MLQCZmlqcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const points: Point[] = []; let i = 0, current = { x: 0, y: 0 };
  while (i < tokens.length) {
    const command = tokens[i++]; if (!/^[MLQCZ]$/i.test(command)) return [];
    const relative = command === command.toLowerCase(), tag = command.toUpperCase();
    if (tag === "Z") break;
    const count = tag === "C" ? 6 : tag === "Q" ? 4 : 2;
    const values = tokens.slice(i, i + count).map(Number); i += count;
    if (values.length !== count || values.some(value => !Number.isFinite(value))) return [];
    const coords = Array.from({ length: count / 2 }, (_, n) => ({ x: values[n * 2] + (relative ? current.x : 0), y: values[n * 2 + 1] + (relative ? current.y : 0) }));
    const start = current, end = coords.at(-1)!;
    if (tag === "C" || tag === "Q") for (let step = 1; step <= 24; step++) {
      const t = step / 24, u = 1 - t;
      points.push(tag === "C" ? { x: u ** 3 * start.x + 3 * u ** 2 * t * coords[0].x + 3 * u * t ** 2 * coords[1].x + t ** 3 * end.x,
        y: u ** 3 * start.y + 3 * u ** 2 * t * coords[0].y + 3 * u * t ** 2 * coords[1].y + t ** 3 * end.y }
        : { x: u ** 2 * start.x + 2 * u * t * coords[0].x + t ** 2 * end.x, y: u ** 2 * start.y + 2 * u * t * coords[0].y + t ** 2 * end.y });
    } else points.push(end);
    current = end;
  }
  return points;
}
export interface WrapObstacle {
  id: string;
  points: Point[];
  mode: TextWrapConfig["mode"];
  offsets: { top: number; right: number; bottom: number; left: number };
}
export interface LineSlot { x: number; width: number }

/** Transform any page object's geometry into the text frame's local coordinates (points). */
export function textWrapObstacles(frame: PageElement, elements: PageElement[]): WrapObstacle[] {
  const byId = new Map(elements.map(element => [element.id, element]));
  byId.set(frame.id, frame);
  const parentIds = new Map<string, string>();
  byId.forEach(parent => parent.childElementIds?.forEach(id => parentIds.set(id, parent.id)));
  const parents = (element: PageElement): PageElement[] => {
    const result: PageElement[] = [], visited = new Set([element.id]);
    let parentId = element.groupId || parentIds.get(element.id);
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = byId.get(parentId); if (!parent) break;
      result.push(parent); parentId = parent.groupId || parentIds.get(parent.id);
    }
    return result;
  };
  const frameParents = new Set(parents(frame).map(parent => parent.id));
  const f = frame.transform, fa = -(f.rotation || 0) * Math.PI / 180;
  const toFrame = (x: number, y: number): Point => {
    const dx = x - f.x - f.width / 2, dy = y - f.y - f.height / 2;
    return { x: dx * Math.cos(fa) - dy * Math.sin(fa) + f.width / 2,
      y: dx * Math.sin(fa) + dy * Math.cos(fa) + f.height / 2 };
  };
  return elements.flatMap(element => {
    const wrap = effectiveTextWrap(element);
    if (element.id === frame.id || element.pageId !== frame.pageId || element.hidden ||
      frameParents.has(element.id) || !wrap || !wrapsText(element)) return [];
    // A text box placed above artwork must remain readable on that artwork.
    // Only an explicitly chosen wrap can exclude text from a lower or equal layer,
    // and unconfigured decorative or primitive elements never exclude text frames.
    if (!element.textWrap && !element.style.textWrap) {
      if (element.transform.zIndex <= f.zIndex ||
          element.category === "decorative" ||
          element.content?.publicationPrimitive ||
          ["body", "body-text", "quote", "sidebar", "callout"].includes(element.type)) {
        return [];
      }
    }
    // A group is one obstacle for outside text. Inside it, siblings remain independent.
    // Hidden groups and explicit No wrap apply to their children as well.
    if (parents(element).some(parent => parent.hidden || (!frameParents.has(parent.id) &&
      (wrapsText(parent) || parent.textWrap || parent.style.textWrap)))) return [];
    // Explicitly wrapping text frames use stacking order, avoiding mutual text exclusions.
    if (["body", "body-text", "quote", "sidebar", "callout"].includes(element.type) && (element.transform.zIndex < f.zIndex ||
      (element.transform.zIndex === f.zIndex && element.id.localeCompare(frame.id) <= 0))) return [];
    const t = element.transform, a = (t.rotation || 0) * Math.PI / 180;
    const margin = Math.max(0, wrap.offsetPt ?? wrap.wrapMarginPt ?? 8);
    const offsets = { top: Math.max(0, wrap.topOffsetPt ?? margin), right: Math.max(0, wrap.rightOffsetPt ?? margin),
      bottom: Math.max(0, wrap.bottomOffsetPt ?? margin), left: Math.max(0, wrap.leftOffsetPt ?? margin) };
    let local: Point[] = [{ x: 0, y: 0 }, { x: t.width, y: 0 },
      { x: t.width, y: t.height }, { x: 0, y: t.height }];
    if (["tight", "contour"].includes(wrap.mode) && !element.content.caption) {
      // User contour points are local coordinates in points, like other editor geometry.
      if (wrap.customContourPoints && wrap.customContourPoints.length >= 3) local = wrap.customContourPoints;
      else if (wrap.contourPath || imageMaskPath(element.content, t.width, t.height)) {
        const contour = maskContour(wrap.contourPath || imageMaskPath(element.content, t.width, t.height)!);
        if (contour.length >= 3) local = contour;
      }
      else if (element.content.mask === "circle" || element.style.shapeType === "circle" || element.style.shapeType === "ellipse") {
        local = Array.from({ length: 64 }, (_, i) => ({ x: t.width / 2 * (1 + Math.cos(i * Math.PI / 32)),
          y: t.height / 2 * (1 + Math.sin(i * Math.PI / 32)) }));
      }
      else if (element.style.shapeType === "polygon" || element.style.shapeType === "star") {
        const coordinates = element.style.shapeType === "star"
          ? [[50, 2], [62, 38], [100, 38], [69, 60], [81, 96], [50, 74], [19, 96], [31, 60], [0, 38], [38, 38]]
          : [[50, 3], [95, 25], [95, 75], [50, 97], [5, 75], [5, 25]];
        local = coordinates.map(([x, y]) => ({ x: x * t.width / 100, y: y * t.height / 100 }));
      }
      else if (element.style.pathData) {
        const contour = maskContour(element.style.pathData);
        if (contour.length >= 3) local = contour;
      }
      else if (IMAGE_TYPES.has(element.type) && !element.content.caption) {
        const contour = readyContours.get(contourKey(element));
        if (contour) local = contour.map(p => ({ x: p.x * t.width, y: p.y * t.height }));
      }
    }
    const points = local.map(p => {
      const dx = p.x - t.width / 2, dy = p.y - t.height / 2;
      return toFrame(t.x + t.width / 2 + dx * Math.cos(a) - dy * Math.sin(a),
        t.y + t.height / 2 + dx * Math.sin(a) + dy * Math.cos(a));
    });
    if (Math.max(...points.map(p => p.x)) + offsets.right <= 0 ||
      Math.min(...points.map(p => p.x)) - offsets.left >= f.width ||
      Math.max(...points.map(p => p.y)) + offsets.bottom <= 0 ||
      Math.min(...points.map(p => p.y)) - offsets.top >= f.height) return [];
    return [{ id: element.id, points, offsets, mode: wrap.mode }];
  });
}

/** Conservative polygon projection across the WHOLE line band, never just its baseline. */
export function availableLineSlots(x: number, width: number, y: number, height: number, obstacles: WrapObstacle[]): LineSlot[] {
  let slots: LineSlot[] = [{ x, width }];
  let largestSide = false;
  for (const obstacle of obstacles) {
    const { points, offsets } = obstacle;
    const top = y - offsets.bottom, bottom = y + height + offsets.top;
    if (Math.max(...points.map(p => p.y)) <= top || Math.min(...points.map(p => p.y)) >= bottom) continue;
    const xs: number[] = [];
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length];
      if (p.y >= top && p.y <= bottom) xs.push(p.x);
      if (p.y !== q.y) for (const edge of [top, bottom]) {
        if (edge >= Math.min(p.y, q.y) && edge <= Math.max(p.y, q.y))
          xs.push(p.x + (q.x - p.x) * (edge - p.y) / (q.y - p.y));
      }
    });
    if (!xs.length) continue;
    const left = Math.min(...xs) - offsets.left, right = Math.max(...xs) + offsets.right;
    if (right <= x || left >= x + width) continue;
    if (obstacle.mode === "top-bottom" || obstacle.mode === "inline") return [];
    largestSide ||= obstacle.mode === "largest-side";
    slots = slots.flatMap(slot => {
      const end = slot.x + slot.width;
      if (right <= slot.x || left >= end) return [slot];
      const result: LineSlot[] = [];
      if (left > slot.x) result.push({ x: slot.x, width: left - slot.x });
      if (right < end) result.push({ x: right, width: end - right });
      return result;
    });
  }
  return largestSide && slots.length ? [slots.reduce((a, b) => a.width >= b.width ? a : b)] : slots;
}

export interface FlowStyle { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color?: string }
export interface FlowRun { text: string; style: FlowStyle }
export interface FlowFragment { x: number; y: number; width: number; runs: FlowRun[]; paragraphEnd: boolean }
export interface TextFlowLayout { fragments: FlowFragment[]; oversetChars: number; lineHeight: number }

const decode = (text: string) => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity: string) => {
  if (entity[0] === "#") {
    const value = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "\ufffd";
  }
  return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" } as Record<string, string>)[entity.toLowerCase()];
});

/** Keep text + inline formatting; never write generated line breaks back to the document. */
export function parseFlowText(html: string): FlowRun[] {
  const result: FlowRun[] = [], stack: { tag: string; style: FlowStyle }[] = [];
  const push = (text: string) => { if (text) result.push({ text, style: { ...(stack.at(-1)?.style || {}) } }); };
  const newline = () => { if (result.length && !result.at(-1)!.text.endsWith("\n")) push("\n"); };
  for (const part of String(html).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").match(/<[^>]*>|[^<]+|</g) || []) {
    if (!part.startsWith("<") || part === "<") { push(decode(part)); continue; }
    const match = part.match(/^<\s*(\/?)\s*([\w-]+)/); if (!match) continue;
    const closing = !!match[1], tag = match[2].toLowerCase();
    if (tag === "br") { push("\n"); continue; }
    if (["p", "div", "li", "blockquote"].includes(tag)) newline();
    if (closing) {
      const index = stack.map(item => item.tag).lastIndexOf(tag);
      if (index >= 0) stack.splice(index);
      continue;
    }
    const style: FlowStyle = { ...(stack.at(-1)?.style || {}) };
    if (["b", "strong"].includes(tag)) style.bold = true;
    if (["i", "em"].includes(tag)) style.italic = true;
    if (tag === "u") style.underline = true;
    if (["s", "strike", "del"].includes(tag)) style.strike = true;
    const css = part.match(/style\s*=\s*["']([^"']*)["']/i)?.[1] || "";
    if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(css)) style.bold = true;
    if (/font-style\s*:\s*italic/i.test(css)) style.italic = true;
    if (/text-decoration[^:]*\s*:[^;]*underline/i.test(css)) style.underline = true;
    const color = css.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1].trim() || part.match(/\bcolor\s*=\s*["']([^"']*)["']/i)?.[1];
    if (color && /^(#[\da-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\))$/i.test(color)) style.color = color;
    if (tag === "li") push("• ");
    if (!["img", "hr", "input", "meta", "link"].includes(tag) && !part.endsWith("/>")) stack.push({ tag, style });
  }
  if (result.at(-1)?.text === "\n") result.pop();
  return result;
}

let measureContext: CanvasRenderingContext2D | null | undefined;
const widthCache = new Map<string, number>();
export function clearTextMeasureCache() { widthCache.clear(); }
export function measureFlowText(text: string, style: FlowStyle, base: ElementStyle): number {
  const size = base.fontSize || 10.5, weight = style.bold ? 700 : (base.fontWeight || 400);
  const italic = style.italic || base.fontStyle === "italic", family = base.fontFamily || FLOW_FONT_FAMILY;
  const font = `${italic ? "italic " : ""}${weight} ${size}px ${family}`;
  const key = `${font}/${base.letterSpacing || 0}/${text}`, cached = widthCache.get(key);
  if (cached !== undefined) return cached;
  if (measureContext === undefined && typeof document !== "undefined") measureContext = document.createElement("canvas").getContext("2d");
  let width: number;
  if (measureContext) { measureContext.font = font; width = measureContext.measureText(text).width; }
  else width = Array.from(text).reduce((sum, c) => sum + (" ilI.,:;!'".includes(c) ? .28 : "MW@%".includes(c) ? .86 : .56), 0) * size * (weight >= 600 ? 1.04 : 1);
  width += Math.max(0, Array.from(text).length - 1) * (base.letterSpacing || 0);
  if (widthCache.size > 12000) widthCache.clear();
  widthCache.set(key, width); return width;
}

type FlowToken = { runs: FlowRun[]; kind: "word" | "space" | "break" };
export function layoutTextFlow(frame: PageElement, obstacles: WrapObstacle[],
  measure: (text: string, style: FlowStyle) => number = (text, style) => measureFlowText(text, style, frame.style),
  source: FlowRun[] = parseFlowText(String(frame.content.text || ""))): TextFlowLayout {
  const tokens: FlowToken[] = [];
  for (const run of source) for (const text of run.text.match(/\n|[^\S\n\u00a0]+|[^\s]+(?:\u00a0[^\s]+)*/gu) || []) {
    const kind = text === "\n" ? "break" : /^[^\S\n]+$/.test(text) ? "space" : "word";
    // A bold span in the middle of a word is still a single word.
    if (kind !== "break" && tokens.at(-1)?.kind === kind) tokens.at(-1)!.runs.push({ text, style: run.style });
    else tokens.push({ kind, runs: [{ text: kind === "space" ? " " : text, style: run.style }] });
  }
  const size = frame.style.fontSize || 10.5, leading = frame.style.lineHeight || 1.5;
  const lineHeight = Math.max(size, leading > 4 ? leading : size * leading);
  const inset = frame.style.borderWidth || 0, padding = frame.style.padding || { top: 0, right: 0, bottom: 0, left: 0 };
  const pad = { top: padding.top + inset, right: padding.right + inset, bottom: padding.bottom + inset, left: padding.left + inset };
  const width = Math.max(0, frame.transform.width - pad.left - pad.right);
  const height = Math.max(0, frame.transform.height - pad.top - pad.bottom);
  const columns = Math.max(1, Math.min(8, Math.floor(frame.columnCount ?? frame.style.columns ?? 1)));
  const gap = frame.columnGapPt ?? frame.style.columnGap ?? 14, colWidth = Math.max(0, (width - (columns - 1) * gap) / columns);
  const fragments: FlowFragment[] = [];
  let index = 0;
  const tokenWidth = (token: FlowToken) => token.runs.reduce((sum, run) => sum + measure(run.text, run.style), 0);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (let col = 0; col < columns && index < tokens.length; col++) {
    let y = pad.top;
    while (y + lineHeight <= pad.top + height + .001 && index < tokens.length) {
      const slots = availableLineSlots(pad.left + col * (colWidth + gap), colWidth, y, lineHeight, obstacles);
      let brokeParagraph = false;
      for (const slot of slots) {
        if (slot.width < size || index >= tokens.length) continue;
        const runs: FlowRun[] = []; let used = 0;
        while (index < tokens.length) {
          const token = tokens[index];
          if (token.kind === "break") { index++; brokeParagraph = true; break; }
          if (token.kind === "space" && !runs.length) { index++; continue; }
          const tokenSize = tokenWidth(token);
          if (used + tokenSize <= slot.width + .001) { runs.push(...token.runs); used += tokenSize; index++; continue; }
          if (runs.length) break;
          // Prefer the other side of an image if the whole word fits there.
          if (slots.some(other => other.x > slot.x && other.width >= tokenSize)) break;
          // A narrow right strip must not split a word that fits on the left next row.
          if (slots.some(other => other.x < slot.x && other.width >= tokenSize)) break;
          const remainder: FlowRun[] = []; let full = false;
          for (const run of token.runs) {
            let fit = "", rest = "";
            for (const { segment } of segmenter.segment(run.text)) {
              if (!full && used + measure(fit + segment, run.style) <= slot.width + .001) fit += segment;
              else { full = true; rest += segment; }
            }
            if (fit) { runs.push({ text: fit, style: run.style }); used += measure(fit, run.style); }
            if (rest) remainder.push({ text: rest, style: run.style });
          }
          if (remainder.length) tokens[index] = { ...token, runs: remainder }; else index++;
          break;
        }
        // Don't justify trailing whitespace at the image boundary.
        while (runs.length && /^\s+$/.test(runs.at(-1)!.text)) runs.pop();
        if (runs.length) fragments.push({ x: slot.x, y, width: slot.width, runs,
          paragraphEnd: brokeParagraph || index === tokens.length || tokens[index]?.kind === "break" });
        if (brokeParagraph) break;
      }
      y += lineHeight + (brokeParagraph ? Math.max(0, frame.style.paragraphSpacing || 0) : 0);
    }
  }
  return { fragments, lineHeight, oversetChars: tokens.slice(index).reduce((sum, token) => sum + token.runs.reduce((n, run) => n + run.text.length, 0), 0) };
}

/** Shared positions for canvas, PDF and browser print. */
export function textFlowScene(frame: PageElement, elements: PageElement[]): PublicationScene | null {
  if (!isFlowText(frame)) return null;
  const layout = layoutTextFlow(frame, textWrapObstacles(frame, elements)), size = frame.style.fontSize || 10.5;
  const nodes: SceneNode[] = [];
  const { backgroundColor, borderColor, borderWidth, borderRadius } = frame.style;
  if (backgroundColor && backgroundColor !== "transparent") nodes.push({ kind: "rect", x: 0, y: 0,
    w: frame.transform.width, h: frame.transform.height, fill: backgroundColor, radius: borderRadius });
  if (borderColor && borderWidth) {
    const b = borderWidth / 2, w = frame.transform.width - b, h = frame.transform.height - b;
    for (const [x, y, x2, y2] of [[b, b, w, b], [w, b, w, h], [w, h, b, h], [b, h, b, b]])
      nodes.push({ kind: "line", x, y, x2, y2, stroke: borderColor, strokeWidth: borderWidth });
  }
  for (const fragment of layout.fragments) {
    const textWidth = fragment.runs.reduce((sum, run) => sum + measureFlowText(run.text, run.style, frame.style), 0);
    let x = fragment.x + (frame.style.textAlign === "right" ? fragment.width - textWidth : frame.style.textAlign === "center" ? (fragment.width - textWidth) / 2 : 0);
    const spaces = fragment.runs.reduce((sum, run) => sum + (run.text.match(/ /g)?.length || 0), 0);
    const extraSpace = frame.style.textAlign === "justify" && !fragment.paragraphEnd && spaces ? Math.max(0, fragment.width - textWidth) / spaces : 0;
    for (const run of fragment.runs) for (const text of extraSpace ? run.text.split(/( )/) : [run.text]) {
      if (!text) continue;
      nodes.push({ kind: "text", x, y: fragment.y + (layout.lineHeight - size) / 2 + size * .8,
        text, size, fill: run.style.color || frame.style.color || "#0f172a", fontFamily: frame.style.fontFamily || FLOW_FONT_FAMILY,
        bold: run.style.bold || (frame.style.fontWeight || 400) >= 600,
        italic: run.style.italic || frame.style.fontStyle === "italic", underline: run.style.underline,
        strike: run.style.strike, letterSpacing: frame.style.letterSpacing, textLength: measureFlowText(text, run.style, frame.style) });
      x += measureFlowText(text, run.style, frame.style) + (text === " " ? extraSpace : 0);
    }
  }
  return { width: frame.transform.width, height: frame.transform.height, nodes, variant: "flow-text",
    warnings: layout.oversetChars ? [`${layout.oversetChars} characters need more space in “${frame.displayName}”.`] : [] };
}
