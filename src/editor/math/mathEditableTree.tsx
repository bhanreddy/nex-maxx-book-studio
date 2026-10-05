import React from "react";
import type { MathRendererProps, MathTemplate } from "./types";
import { matchingOrder } from "./templates/premiumExerciseTemplates";
import { wordProblemData } from "./wordProblemLayout";

export interface MathPartOverride {
  text?: string;
  source?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  hidden?: boolean;
}

export interface MathAppearance {
  resizeMode?: "scale" | "stretch" | "reflow";
  /** An explicitly selected scaling mode, rather than an older insertion default. */
  resizeModeLocked?: boolean;
  /** Keep the reading size when an existing scaled block starts reflowing. */
  reflowScale?: number;
  scaleFrame?: { width: number; height: number };
  fontScale?: number;
  fontFamily?: string;
  padding?: number;
}

export interface MathPart {
  id: string;
  label: string;
  text?: string;
  source?: string;
  tag: string;
  svg: boolean;
  binding?: { path: (string | number)[]; source: string; start: number; end: number };
}

interface TreeOptions {
  overrides?: Record<string, MathPartOverride>;
  appearance?: MathAppearance;
  onEdit?: (part: MathPart, target: Element) => void;
  onSelect?: (part: MathPart) => void;
  selectedPartId?: string;
  interactive?: boolean;
}

const fontSizes: Record<string, number> = { "text-xs": 12, "text-sm": 14, "text-base": 16, "text-lg": 18, "text-xl": 20, "text-2xl": 24, "text-3xl": 30 };
const primitives = (value: React.ReactNode): boolean => Array.isArray(value)
  ? value.every(primitives) : value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
const textOf = (value: React.ReactNode): string => Array.isArray(value) ? value.map(textOf).join("")
  : typeof value === "string" || typeof value === "number" ? String(value) : "";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Unwrap React.memo and React.forwardRef wrappers to get the underlying function component.
 *  This allows buildEditableMathTree to traverse and make editable the internals of
 *  memo- or forwardRef-wrapped template renderers. */
function unwrapRenderer(renderer: unknown): unknown {
  let resolved = renderer;
  while (typeof resolved === "object" && resolved !== null) {
    const wrapper = resolved as Record<string, unknown>;
    if (wrapper.$$typeof === Symbol.for("react.memo") && (typeof wrapper.type === "function" || typeof wrapper.type === "object")) {
      resolved = wrapper.type;
    } else if (wrapper.$$typeof === Symbol.for("react.forward_ref") && typeof wrapper.render === "function") {
      resolved = wrapper.render;
    } else break;
  }
  return resolved;
}

/** Call a layout function and detect hook usage in development.
 *  When a template component uses React hooks, the call throws with a message
 *  mentioning "hook" or "dispatcher". We catch this and re-throw with a clear
 *  error message naming the offending template. */
function callLayout(layout: (props: Record<string, unknown>) => React.ReactNode, props: Record<string, unknown>, templateName: string): React.ReactNode {
  try {
    return layout(props);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      const name = (layout as any).displayName || layout.name || templateName;
      const msg = err instanceof Error ? err.message : String(err);
      if (/hook|dispatcher|useState|useEffect|useRef|useMemo|useCallback|useContext|useReducer/i.test(msg)) {
        throw new Error(`[MathTemplate] "${name}" uses React hooks. Math template renderers MUST be synchronous, hook-free, props-driven layout functions. Original error: ${msg}`);
      }
    }
    throw err;
  }
}

/** Templates are deliberately synchronous, hook-free layout functions. Keeping the
 * original host tree preserves every SVG, class, colour and layout rule during edits. */
export function buildEditableMathTree(template: MathTemplate, props: MathRendererProps, options: TreeOptions = {}) {
  if (template.id === "math-word-problem") props = { ...props, data: wordProblemData(props.data, options.overrides) };
  const parts: MathPart[] = [];
  const bindingCursors = new Map<string, number>();
  const visit = (node: React.ReactNode, path: string, inSvg = false, inheritedSize = 12): React.ReactNode => {
    if (Array.isArray(node)) {
      // Dev-only warning when mapped/conditional siblings have no key — these
      // produce index-based IDs that shift when items are added or removed.
      if (process.env.NODE_ENV !== "production" && node.length > 1) {
        const elements = node.filter(React.isValidElement);
        if (elements.length > 1 && elements.some(child => child.key == null)) {
          console.warn(`[MathTemplate] Mapped/conditional siblings at "${path}" have children without keys. Add a unique key to every mapped/conditional sibling to keep override IDs stable.`);
        }
      }
      return node.map((child, i) => visit(child, `${path}/${React.isValidElement(child) && child.key != null ? `k${encodeURIComponent(String(child.key))}` : i}`, inSvg, inheritedSize));
    }
    if (!React.isValidElement<Record<string, unknown>>(node)) return node;
    // Unwrap React.memo / React.forwardRef so their internals are traversed and editable
    const resolvedType = unwrapRenderer(node.type);
    if (typeof resolvedType === "function") {
      const layout = resolvedType as (props: Record<string, unknown>) => React.ReactNode;
      return visit(callLayout(layout, node.props, template.name), `${path}/component`, inSvg, inheritedSize);
    }
    const tag = typeof node.type === "string" ? node.type : "fragment";
    const svg = inSvg || tag === "svg";
    const children = node.props.children as React.ReactNode;
    const className = String(node.props.className || "");
    const originalStyle = (node.props.style || {}) as React.CSSProperties;
    const fontClass = className.match(/(?:^|\s)text-\[([\d.]+)px\]/)?.[1];
    const size = Number(originalStyle.fontSize) || Number(node.props.fontSize) || (fontClass ? Number(fontClass) : Object.entries(fontSizes).find(([name]) => className.split(/\s+/).includes(name))?.[1]) || inheritedSize;
    const isText = primitives(children) && textOf(children).trim().length > 0 && tag !== "fragment";
    const isShape = svg && ["path", "rect", "circle", "ellipse", "line", "polygon", "polyline"].includes(tag);
    const isPanel = !svg && ["div", "td", "th"].includes(tag);
    const editable = isText || isShape || isPanel;
    const override = options.overrides?.[path] || {};
    const source = isText ? textOf(children) : undefined;
    let binding: MathPart["binding"];
    // Native reference blocks can bind an authored line to a nested data field.
    // Calculated digits deliberately have no binding and remain source-guarded.
    const explicitField = node.props["data-math-field"];
    if (isText && source && typeof explicitField === "string") {
      try {
        const fieldPath: unknown = JSON.parse(explicitField);
        if (Array.isArray(fieldPath) && fieldPath.every(key => typeof key === "string" || Number.isInteger(key))) {
          const authored = fieldPath.reduce<any>((value, key) => value?.[key], props.data);
          if (typeof authored === "string") {
            const id = JSON.stringify(fieldPath), start = authored.indexOf(source, bindingCursors.get(id) || 0);
            if (start >= 0) { binding = { path: fieldPath, source: authored, start, end: start + source.length }; bindingCursors.set(id, start + source.length); }
          }
        }
      } catch { /* An invalid optional binding leaves the presentation editable. */ }
    }
    // Bind wrapped exercise lines to the authored string, rather than treating
    // each line as a separate caption that disappears when wrapping changes.
    const keyText = String(node.key || "");
    const lineKey = template.measureHeight && isText ? keyText.match(/^(title|story|operation|instructions?|kicker|prompt|answer|working|explanation|left-text|right-text|left-title|right-title|choice-text|cell-text|head-text|reason-answer|correction-text)-(\d+)$/) : null;
    const inlineKey = template.measureHeight && isText && ["word", "blank-answer"].includes(keyText) && path.includes("/kinline-");
    if (lineKey || inlineKey) {
      const row = path.match(/\/kquestion-(\d+)(?:\/|$)/);
      const key = lineKey?.[1] || keyText;
      const field = key === "instruction" ? "instructions" : key === "kicker" ? "sectionLabel" : key === "left-text" ? "prompt" : key === "left-title" ? "leftHeading" : key === "right-title" ? "rightHeading" : key;
      let fieldPath: (string | number)[] = row && ["prompt", "answer", "working", "explanation"].includes(field) ? ["questions", Number(row[1]), field] : [field];
      if (row) {
        const index = Number(row[1]);
        if (key === "right-text") fieldPath = ["questions", matchingOrder(props.data)[index], "answer"];
        if (key === "choice-text") fieldPath = ["questions", index, "choices", Number(path.match(/\/kchoice-(\d+)\//)?.[1])];
        if (key === "cell-text") {
          const col = Number(path.match(/\/kcell-(\d+)\//)?.[1]);
          fieldPath = col === 0 ? ["questions", index, "prompt"] : ["questions", index, "cells", col - 1];
        }
        if (key === "reason-answer" || key === "correction-text") fieldPath = ["questions", index, props.data.exerciseKind === "sequence" ? "answer" : "explanation"];
        if (inlineKey) fieldPath = ["questions", index, key === "word" ? "prompt" : "answer"];
      }
      if (key === "head-text") fieldPath = ["columns", Number(path.match(/\/khead-(\d+)\//)?.[1])];
      const authored = fieldPath.reduce<any>((value, key) => value?.[key], props.data);
      if (typeof authored === "string" && source) {
        const id = JSON.stringify(fieldPath), start = authored.indexOf(source, bindingCursors.get(id) || 0);
        if (start >= 0) { binding = { path: fieldPath, source: authored, start, end: start + source.length }; bindingCursors.set(id, start + source.length); }
      }
    }
    // A calculated answer must refresh when its source changes. Literal captions
    // keep their edits through resizing, style changes and answer-mode switches.
    const text = override.text !== undefined && override.source === source ? override.text : source;
    const part: MathPart = { id: path, tag, svg, source, text, binding,
      label: isText ? (text || "Empty text").slice(0, 72) : `${isShape ? "Shape" : "Panel"} · ${tag} ${parts.length + 1}` };
    if (editable) parts.push(part);
    let nextChildren = isText ? text : (!Array.isArray(children) ? visit(children, `${path}/children`, svg, size) : undefined);
    // Text mixed with elements gets an inline span (tspan in SVG), without
    // flattening the surrounding layout or turning graphics into a bitmap.
    if (!isText && Array.isArray(children)) {
      nextChildren = children.map((child, i) => {
        if ((typeof child === "string" || typeof child === "number") && String(child).trim()) {
          return visit(React.createElement(svg ? "tspan" : "span", { key: `text-${i}` }, child), `${path}/text-${i}`, svg, size);
        }
        return visit(child, `${path}/children/${React.isValidElement(child) && child.key != null ? `k${encodeURIComponent(String(child.key))}` : i}`, svg, size);
      });
    }
    if (tag === "fragment") return React.cloneElement(node, { key: node.key ?? path }, nextChildren);
    const style: React.CSSProperties = { ...originalStyle };
    // The canvas and export use points. Catalogue HTML roots used pixels,
    // leaving a quarter of the selected width unused even in reflow mode.
    if (path === "root" && !svg) {
      style.width = "100%";
      if (originalStyle.height === `${props.height}px`) style.height = "100%";
      style.minWidth = 0;
      style.overflowWrap = "anywhere";
    }
    if (options.appearance?.fontScale && options.appearance.fontScale !== 1) style.fontSize = size * options.appearance.fontScale;
    if (isText && options.appearance?.fontFamily) style.fontFamily = options.appearance.fontFamily;
    for (const key of ["fontSize", "fontFamily", "fontWeight", "fontStyle", "textAlign", "lineHeight", "letterSpacing", "color", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "width", "height"] as const) {
      if (override[key] !== undefined) style[key] = override[key] as never;
    }
    if (override.x || override.y || override.scale !== undefined || override.scaleX !== undefined || override.scaleY !== undefined) {
      style.translate = `${override.x || 0}px ${override.y || 0}px`;
      style.scale = `${(override.scale ?? 1) * (override.scaleX ?? 1)} ${(override.scale ?? 1) * (override.scaleY ?? 1)}`;
      if (tag === "span") style.display = "inline-block";
      style.transformOrigin = "center";
      if (svg) { style.transformBox = "fill-box"; }
    }
    if (isText && override.text !== undefined && !svg) style.whiteSpace = "pre-wrap";
    if (isText && svg && text?.includes("\n")) nextChildren = text.split("\n").map((line, i) => <tspan key={i} x={Number(node.props.x || 0)} dy={i ? `${override.lineHeight ?? 1.2}em` : 0}>{line || " "}</tspan>);
    if (isText && !svg && override.textAlign && className.split(/\s+/).includes("flex")) style.justifyContent = override.textAlign === "center" ? "center" : override.textAlign === "right" ? "flex-end" : "flex-start";
    if (override.backgroundColor !== undefined) style.backgroundImage = "none";
    if (override.hidden) style.display = "none";
    if (options.selectedPartId === path && options.interactive) {
      style.outline = "1px solid var(--editor-selection)";
      style.outlineOffset = 2;
    }
    const extra: Record<string, unknown> = { style, key: node.key ?? path };
    if (editable) extra["data-math-part"] = path;
    if (svg) {
      if (isText && override.textAlign) extra.textAnchor = override.textAlign === "center" ? "middle" : override.textAlign === "right" ? "end" : "start";
      if (override.color) extra[isText || node.props.fill !== "none" && tag !== "line" ? "fill" : "stroke"] = override.color;
      if (override.borderColor) extra.stroke = override.borderColor;
      if (override.borderWidth !== undefined) extra.strokeWidth = override.borderWidth;
      if (override.width !== undefined) extra.width = override.width;
      if (override.height !== undefined) extra.height = override.height;
      if (override.color && isText) style.fill = override.color;
      if (override.color && isShape) style[extra.fill ? "fill" : "stroke"] = override.color;
      if (override.borderColor) style.stroke = override.borderColor;
    }
    if (editable && options.interactive) {
      style.pointerEvents = "auto";
      extra.onDoubleClick = (event: React.MouseEvent<Element>) => {
        event.preventDefault(); event.stopPropagation(); options.onSelect?.(part);
        if (isText) options.onEdit?.(part, event.currentTarget);
      };
      if (isText) {
        extra.tabIndex = 0;
        extra.role = "button";
        extra["aria-label"] = `Edit maths text: ${text || "empty"}`;
        extra.title = "Double-click to edit text; Enter when focused";
        extra.onKeyDown = (event: React.KeyboardEvent<Element>) => {
          if (event.target !== event.currentTarget || event.key !== "Enter") return;
          event.preventDefault(); event.stopPropagation(); options.onEdit?.(part, event.currentTarget);
        };
      }
    }
    return React.cloneElement(node, extra, nextChildren);
  };
  // Unwrap top-level renderer (handles memo/forwardRef on the template itself)
  const topRenderer = unwrapRenderer(template.renderer);
  if (typeof topRenderer !== "function") {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`[MathTemplate] "${template.id}" renderer is not a function after unwrapping memo/forwardRef. Got ${typeof topRenderer}.`);
    }
    return { tree: null as unknown as React.ReactNode, parts };
  }
  const rawTree = callLayout(topRenderer as (props: Record<string, unknown>) => React.ReactNode, props as unknown as Record<string, unknown>, template.name);
  const tree = visit(rawTree, "root");
  return { tree, parts };
}

export function mathRenderFrame(template: MathTemplate, width: number, height: number, appearance: MathAppearance = {}, data = template.defaultData) {
  const padding = Math.max(0, Math.min(appearance.padding || 0, Math.min(width, height) / 4));
  const mode = appearance.resizeMode || defaultMathResizeMode(template);
  const isReflow = mode === "reflow";
  const readingScale = Math.max(.001, appearance.reflowScale || 1);
  const renderWidth = isReflow ? Math.max(24, (width - padding * 2) / readingScale) : appearance.scaleFrame?.width || template.defaultWidth;
  const minimumHeight = (!isReflow ? appearance.scaleFrame?.height : undefined) ?? template.measureHeight?.(data, renderWidth) ?? template.defaultHeight;
  const renderHeight = isReflow ? Math.max(24, (height - padding * 2) / readingScale, template.measureHeight ? minimumHeight : 0) : minimumHeight;
  const rawScaleX = (width - padding * 2) / renderWidth;
  const rawScaleY = (height - padding * 2) / renderHeight;

  if (mode === "stretch") {
    // Stretch: independent axes — explicit opt-in for non-uniform scaling
    return { renderWidth, renderHeight, padding, scaleX: rawScaleX, scaleY: rawScaleY, offsetX: 0, offsetY: 0 };
  }
  if (isReflow) {
    // Resizing updates the reading scale; height fitting reflows the layout.
    return { renderWidth, renderHeight, padding, scaleX: readingScale, scaleY: readingScale, offsetX: 0, offsetY: 0 };
  }
  // Uniform scale (default): scale = min(scaleX, scaleY), content centred in the box
  const uniformScale = Math.min(rawScaleX, rawScaleY);
  const offsetX = (width - padding * 2 - renderWidth * uniformScale) / 2;
  const offsetY = (height - padding * 2 - renderHeight * uniformScale) / 2;
  return { renderWidth, renderHeight, padding, scaleX: uniformScale, scaleY: uniformScale, offsetX, offsetY };
}

export function defaultMathResizeMode(template: MathTemplate): "reflow" | "scale" {
  return template.measureHeight || template.id.startsWith("layout-") ? "reflow" : "scale";
}

/** Replace only the edited wrapped segment; keep the rest of the authored text. */
export function mathTextDataPatch(data: Record<string, any>, part: MathPart, text: string): Record<string, any> | null {
  const binding = part.binding;
  if (!binding) return null;
  const current = binding.path.reduce<any>((value, key) => value?.[key], data);
  if (current !== binding.source) return null;
  const value = current.slice(0, binding.start) + text + current.slice(binding.end);
  return mathDataFieldPatch(data, binding.path, value);
}

export function mathDataFieldPatch(data: Record<string, any>, path: (string | number)[], value: string): Record<string, any> {
  const replace = (node: any, index: number): any => {
    if (index === path.length) return value;
    const copy = Array.isArray(node) ? [...node] : { ...node };
    copy[path[index]] = replace(node?.[path[index]], index + 1);
    return copy;
  };
  return { [path[0]]: replace(data[path[0]], 1) };
}
