import type { ElementTransform, PageElement } from "../../domain/element/types";
import type { BlockResizeMode } from "../core/blockResize";
import { getMathTemplate } from "./mathRegistry";
import { buildEditableMathTree, defaultMathResizeMode, mathDataFieldPatch, mathRenderFrame, type MathAppearance, type MathPartOverride } from "./mathEditableTree";
import { measureMathDomHeight } from "./mathDomScene";

/** Shared by width inputs, pointer gestures, group transforms and document edits. */
export function withMathTransform(element: PageElement, requested: ElementTransform, mode: BlockResizeMode = "auto"): PageElement {
  const template = getMathTemplate(element.content.mathTemplateId || element.presetId || "");
  if (!template) return { ...element, transform: requested };
  const old = element.transform;
  const widthChanged = requested.width !== old.width;
  const heightChanged = requested.height !== old.height;
  if (!widthChanged && !heightChanged) return { ...element, transform: requested };
  let data = element.content.mathData || element.content;
  let appearance: MathAppearance = element.content.mathAppearance || {};
  const before = mathRenderFrame(template, old.width, old.height, appearance, data);
  const overrides: Record<string, MathPartOverride> = element.content.mathOverrides || {};
  if ((widthChanged || heightChanged) && template.measureHeight && Object.values(overrides).some(override => override.text !== undefined)) {
    element = migrateWrappedText(element, template, before.renderWidth, before.renderHeight);
    data = element.content.mathData || element.content;
  }
  const currentMode = appearance.resizeMode || defaultMathResizeMode(template);
  if (mode === "scale") {
    // Capture the current layout once. Group/Shift resizing must scale that
    // layout, rather than accidentally reverting to the template's old width.
    if (currentMode === "reflow") appearance = { ...appearance, resizeMode: "scale", scaleFrame: { width: before.renderWidth, height: before.renderHeight } };
    return { ...element, content: { ...element.content, mathAppearance: appearance }, transform: requested };
  }
  // A height-only edit is a vertical fit, including saved templates that were
  // explicitly set to uniform scaling. Keeping their fixed source width would
  // shrink the visible artwork sideways while the outer width stayed unchanged.
  // Explicit proportional gestures above still scale both dimensions together.
  const fitHeightOnly = heightChanged && !widthChanged && mode !== "trim-height";
  if ((fitHeightOnly && currentMode !== "reflow") || (currentMode === "scale" && !appearance.resizeModeLocked)) {
    appearance = { ...appearance, resizeMode: "reflow", resizeModeLocked: false, reflowScale: before.scaleX, scaleFrame: undefined };
  }
  if ((appearance.resizeMode || defaultMathResizeMode(template)) !== "reflow") return { ...element, transform: requested };
  const width = Math.max(template.measureHeight ? 240 : 48, requested.width);
  if (heightChanged && mode !== "trim-height") {
    const height = Math.max(32, requested.height);
    const padding = mathRenderFrame(template, width, height, appearance, data).padding;
    const reflowScale = fitReadingScale(template, { ...element.content, mathData: data }, width - 2 * padding, height - 2 * padding, appearance.reflowScale || 1);
    appearance = { ...appearance, reflowScale };
    return { ...element, content: { ...element.content, mathAppearance: appearance }, transform: fitMathHeight(old, { ...requested, width }, height, mode === "reflow-bottom") };
  }
  const frame = mathRenderFrame(template, width, requested.height, appearance, data);
  const naturalHeight = template.measureHeight?.(data, frame.renderWidth)
    ?? measureMathDomHeight(template, element.content, frame.renderWidth)
    ?? template.defaultHeight;
  const minimumHeight = naturalHeight * frame.scaleY + 2 * frame.padding;
  const height = widthChanged ? minimumHeight : Math.max(requested.height, minimumHeight);
  const transform = fitMathHeight(old, { ...requested, width }, height, mode === "reflow-bottom");
  return { ...element, content: { ...element.content, mathAppearance: appearance }, transform };
}

/** Find a uniform reading size that fits the requested height after wrapping.
 * Scaling both axes keeps letters and artwork in proportion; the layout still
 * uses the complete physical width. Wrapping makes a simple height ratio wrong. */
function fitReadingScale(template: NonNullable<ReturnType<typeof getMathTemplate>>, content: PageElement["content"], width: number, height: number, previousScale: number): number {
  const data = content.mathData || content;
  const measure = (scale: number) => {
    const renderWidth = Math.max(24, width / scale);
    return (template.measureHeight?.(data, renderWidth) ?? measureMathDomHeight(template, content, renderWidth) ?? template.defaultHeight) * scale;
  };
  let low = .001, high = Math.max(low, width / (template.measureHeight ? 240 : 48));
  // Start near the previous reading size, so HTML layouts need fewer DOM reads.
  const estimate = Math.min(high, Math.max(low, previousScale * height / Math.max(1, measure(previousScale))));
  const estimatedHeight = measure(estimate);
  if (Math.abs(estimatedHeight - height) < .0001 && estimatedHeight <= height) return estimate;
  if (estimatedHeight <= height) low = estimate; else high = estimate;
  for (let i = 0; i < (template.measureHeight ? 22 : 10); i++) {
    const mid = (low + high) / 2;
    if (measure(mid) <= height) low = mid; else high = mid;
  }
  return low;
}

/** Bring old per-line text edits into the authored data before lines rearrange. */
function migrateWrappedText(element: PageElement, template: NonNullable<ReturnType<typeof getMathTemplate>>, width: number, height: number): PageElement {
  const data = element.content.mathData || element.content;
  const overrides = { ...element.content.mathOverrides };
  const { parts } = buildEditableMathTree(template, { data, mode: element.content.mathMode || "teacher", styleVariant: element.content.styleVariant || "color-coded", width, height });
  const edits = new Map<string, { path: (string | number)[]; source: string; segments: { start: number; end: number; text: string }[] }>();
  for (const part of parts) {
    const override = overrides[part.id], binding = part.binding;
    if (!binding || override?.text === undefined || override.source !== part.source) continue;
    const key = JSON.stringify(binding.path), edit = edits.get(key) || { path: binding.path, source: binding.source, segments: [] };
    edit.segments.push({ start: binding.start, end: binding.end, text: override.text }); edits.set(key, edit);
    const design = { ...override }; delete design.text; delete design.source;
    overrides[part.id] = design;
  }
  if (!edits.size) return element;
  const nextData = { ...data };
  for (const { path, source, segments } of edits.values()) {
    let value = source;
    for (const edit of segments.sort((a, b) => b.start - a.start)) value = value.slice(0, edit.start) + edit.text + value.slice(edit.end);
    Object.assign(nextData, mathDataFieldPatch(nextData, path, value));
  }
  return { ...element, content: { ...element.content, ...nextData, mathData: nextData, mathOverrides: overrides } };
}

/** Keep the opposite edge fixed when reflow changes a rotated frame's height. */
function fitMathHeight(old: ElementTransform, requested: ElementTransform, height: number, anchorBottom: boolean): ElementTransform {
  if (!anchorBottom && requested.x === old.x && requested.y === old.y) return { ...requested, height };
  const angle = old.rotation * Math.PI / 180;
  const dx = requested.x + requested.width / 2 - old.x - old.width / 2;
  const dy = requested.y + requested.height / 2 - old.y - old.height / 2;
  const localY = -Math.sin(angle) * dx + Math.cos(angle) * dy;
  const fromTop = anchorBottom || localY * (requested.height - old.height) < 0;
  const extra = height - requested.height;
  const shift = (fromTop ? -1 : 1) * extra / 2;
  return { ...requested, height, x: requested.x - Math.sin(angle) * shift, y: requested.y + Math.cos(angle) * shift - extra / 2 };
}
