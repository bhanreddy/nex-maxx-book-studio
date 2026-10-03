import React, { useMemo } from "react";
import type { PageElement } from "../../domain/element/types";
import type { MathTemplate } from "./types";
import { buildEditableMathTree, mathRenderFrame, type MathPartOverride } from "./mathEditableTree";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { MATH_GRADE_PALETTES } from "./tokens";

export function MathDesignControls({ element, template }: { element: PageElement; template: MathTemplate }) {
  const updateContent = useEditorStore(s => s.updateElementContent);
  const updateTransform = useEditorStore(s => s.updateElementTransform);
  const target = useUiStore(s => s.mathEditingTarget);
  const appearance = element.content.mathAppearance || {};
  const overrides: Record<string, MathPartOverride> = useMemo(() => element.content.mathOverrides || {}, [element.content.mathOverrides]);
  const frame = mathRenderFrame(template, element.transform.width, element.transform.height, appearance, element.content.mathData || element.content);
  const parts = useMemo(() => buildEditableMathTree(template, {
    data: element.content.mathData || element.content, mode: element.content.mathMode || "teacher",
    styleVariant: element.content.styleVariant || "color-coded", width: frame.renderWidth, height: frame.renderHeight,
  }, { overrides }).parts, [template, element.content, frame.renderWidth, frame.renderHeight, overrides]);
  const selected = target?.elementId === element.id ? parts.find(p => p.id === target.partId) : undefined;
  const selectedOverride = selected ? overrides[selected.id] || {} : {};
  const patchAppearance = (patch: Record<string, unknown>) => updateContent(element.id, { mathAppearance: { ...appearance, ...patch } });
  const patchPart = (patch: MathPartOverride) => {
    if (!selected) return;
    updateContent(element.id, { mathOverrides: { ...overrides, [selected.id]: { ...selectedOverride, ...patch } } });
  };
  const numberInput = (label: string, value: number | undefined, update: (n: number) => void, min = 0, max = 2000, step = 1) => (
    <label className="math-control" key={label}>
      <span>{label}</span>
      <input
        aria-label={label}
        type="number"
        value={value ?? ""}
        placeholder="Original"
        min={min}
        max={max}
        step={step}
        onChange={e => {
          if (e.target.value === "") return;
          const n = Number(e.target.value);
          if (Number.isFinite(n)) update(Math.max(min, Math.min(max, n)));
        }}
      />
    </label>
  );

  const gradeKey = ((template.grade || template.grades[0] || 1) as 1 | 2 | 3 | 4 | 5);
  const gradePalette = MATH_GRADE_PALETTES[gradeKey] || MATH_GRADE_PALETTES[1];

  return (
    <fieldset disabled={element.locked} className="math-design-controls space-y-3">
      <div className="math-edit-hint">
        Double-click any text to edit it. Double-click a shape to select its design controls. {template.measureHeight ? "Edit questions, answers and writing space in Mathematical Content." : "Change values in Mathematical Content to recalculate answers."}
      </div>
      <div className="math-control-grid">
        {numberInput("Template width (pt)", element.transform.width, width => updateTransform(element.id, { width }, true), 48, 2400)}
        {numberInput("Template height (pt)", element.transform.height, height => updateTransform(element.id, { height }, true), 32, 2400)}
        {numberInput("Template X (pt)", element.transform.x, x => updateTransform(element.id, { x }, true), -2400, 2400)}
        {numberInput("Template Y (pt)", element.transform.y, y => updateTransform(element.id, { y }, true), -2400, 2400)}
      </div>
      <label className="math-control">
        <span>Resize behaviour</span>
        <select
          aria-label="Maths resize behaviour"
          value={appearance.resizeMode || "scale"}
          onChange={e => patchAppearance({ resizeMode: e.target.value })}
        >
          <option value="scale">Uniform scale · preserve proportions</option>
          <option value="stretch">Stretch · fill entire box</option>
          <option value="reflow">Reflow contents · adapt layout</option>
        </select>
      </label>
      <div className="math-control-grid">
        {numberInput("Text scale (%)", Math.round((appearance.fontScale || 1) * 100), n => patchAppearance({ fontScale: n / 100 }), 50, 250)}
        {numberInput("Inner spacing (pt)", appearance.padding || 0, padding => patchAppearance({ padding }), 0, 100)}
      </div>
      <label className="math-control">
        <span>Template font</span>
        <select
          aria-label="Maths template font"
          value={appearance.fontFamily || ""}
          onChange={e => patchAppearance({ fontFamily: e.target.value })}
        >
          <option value="">Original typography</option>
          <option value="Fredoka, Outfit, system-ui, sans-serif">Fredoka (Rounded Primary)</option>
          <option value="Inter, system-ui, sans-serif">Inter (Standard Clean)</option>
          <option value="Outfit, sans-serif">Outfit</option>
          <option value="'Noto Sans Telugu', sans-serif">Noto Sans Telugu (Bilingual)</option>
          <option value="Noto Sans, sans-serif">Noto Sans</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Arial, sans-serif">Arial</option>
        </select>
      </label>
      <details open={Boolean(selected)} className="math-parts-controls">
        <summary>Edit individual text, shapes & panels</summary>
        <label className="math-control mt-2">
          <span>Select a part ({parts.length})</span>
          <select
            aria-label="Select maths template part"
            value={selected?.id || ""}
            onChange={e => useUiStore.getState().setMathEditingTarget(e.target.value ? { elementId: element.id, partId: e.target.value } : null)}
          >
            <option value="">Choose text, a shape or a panel…</option>
            {parts.map(p => (
              <option key={p.id} value={p.id}>
                {p.text !== undefined ? "Text" : p.svg ? "Shape" : "Panel"} · {p.label}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <div className="space-y-2 mt-2">
            {selected.text !== undefined && (
              <label className="math-control">
                <span>Selected text</span>
                <textarea
                  aria-label="Selected maths text"
                  value={selected.text}
                  onChange={e => patchPart({ text: e.target.value, source: selected.source })}
                  rows={3}
                />
              </label>
            )}
            <div className="math-control-grid">
              {numberInput("Part X offset (px)", selectedOverride.x || 0, x => patchPart({ x }), -1200, 1200)}
              {numberInput("Part Y offset (px)", selectedOverride.y || 0, y => patchPart({ y }), -1200, 1200)}
              {numberInput("Part scale (%)", Math.round((selectedOverride.scale ?? 1) * 100), n => patchPart({ scale: n / 100 }), 10, 400)}
              {numberInput("Part width scale (%)", Math.round((selectedOverride.scaleX ?? 1) * 100), n => patchPart({ scaleX: n / 100 }), 10, 400)}
              {numberInput("Part height scale (%)", Math.round((selectedOverride.scaleY ?? 1) * 100), n => patchPart({ scaleY: n / 100 }), 10, 400)}
              {selected.text !== undefined && numberInput("Part font size (px)", selectedOverride.fontSize, fontSize => patchPart({ fontSize }), 5, 120, 0.5)}
              {!selected.svg && numberInput("Part width (px)", selectedOverride.width, width => patchPart({ width }), 1, 2000)}
              {!selected.svg && numberInput("Part height (px)", selectedOverride.height, height => patchPart({ height }), 1, 2000)}
              {!selected.svg && numberInput("Part corner radius", selectedOverride.borderRadius, borderRadius => patchPart({ borderRadius }), 0, 100)}
              {numberInput("Part border thickness", selectedOverride.borderWidth, borderWidth => patchPart({ borderWidth }), 0, 12, 0.5)}
            </div>
            {selected.text !== undefined && (
              <label className="math-control">
                <span>Part font</span>
                <select
                  aria-label="Maths part font"
                  value={selectedOverride.fontFamily || ""}
                  onChange={e => patchPart({ fontFamily: e.target.value || undefined })}
                >
                  <option value="">Original font</option>
                  <option value="Fredoka, Outfit, system-ui, sans-serif">Fredoka (Rounded Primary)</option>
                  <option value="Inter, system-ui, sans-serif">Inter (Standard Clean)</option>
                  <option value="Outfit, sans-serif">Outfit</option>
                  <option value="'Noto Sans Telugu', sans-serif">Noto Sans Telugu (Bilingual)</option>
                  <option value="Noto Sans, sans-serif">Noto Sans</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Arial, sans-serif">Arial</option>
                </select>
              </label>
            )}
            {selected.text !== undefined && (
              <div className="math-control-grid">
                <label className="math-control">
                  <span>Text weight</span>
                  <select
                    aria-label="Maths part text weight"
                    value={selectedOverride.fontWeight || ""}
                    onChange={e => patchPart({ fontWeight: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Original weight</option>
                    <option value={400}>Regular</option>
                    <option value={500}>Medium</option>
                    <option value={600}>Semibold</option>
                    <option value={700}>Bold</option>
                  </select>
                </label>
                <label className="math-control">
                  <span>Text alignment</span>
                  <select
                    aria-label="Maths part text alignment"
                    value={selectedOverride.textAlign || ""}
                    onChange={e => patchPart({ textAlign: e.target.value ? e.target.value as "left" | "center" | "right" : undefined })}
                  >
                    <option value="">Original alignment</option>
                    <option value="left">Left</option>
                    <option value="center">Centre</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                {numberInput("Part letter spacing (px)", selectedOverride.letterSpacing, letterSpacing => patchPart({ letterSpacing }), -2, 12, 0.1)}
                {numberInput("Part line spacing", selectedOverride.lineHeight, lineHeight => patchPart({ lineHeight }), 0.8, 3, 0.1)}
                <label className="flex items-center gap-2 min-h-11">
                  <input
                    aria-label="Maths part italic text"
                    type="checkbox"
                    checked={selectedOverride.fontStyle === "italic"}
                    onChange={e => patchPart({ fontStyle: e.target.checked ? "italic" : "normal" })}
                  />
                  Italic text
                </label>
              </div>
            )}
            {/* Print-safe Grade Palette Quick Swatches */}
            <div className="space-y-1 pt-1">
              <span className="text-[9px] text-slate-500 font-semibold block uppercase tracking-wider">
                {gradePalette.name} (Print-Safe Swatches)
              </span>
              <div className="flex items-center gap-2">
                {gradePalette.colors.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    title={`${gradePalette.labels[i]}: ${c}`}
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/20 shadow-xs hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: c }}
                    onClick={() => patchPart(selected.text !== undefined ? { color: c } : { color: c, borderColor: c })}
                  />
                ))}
              </div>
            </div>
            <div className="math-control-grid">
              <label className="math-control">
                <span>{selected.text !== undefined ? "Text colour" : "Fill / stroke"}</span>
                <input
                  aria-label="Maths part colour"
                  type="color"
                  value={selectedOverride.color || "#4338ca"}
                  onChange={e => patchPart({ color: e.target.value })}
                />
              </label>
              {!selected.svg && (
                <label className="math-control">
                  <span>Part background</span>
                  <input
                    aria-label="Maths part background"
                    type="color"
                    value={selectedOverride.backgroundColor || "#ffffff"}
                    onChange={e => patchPart({ backgroundColor: e.target.value })}
                  />
                </label>
              )}
              <label className="math-control">
                <span>Border colour</span>
                <input
                  aria-label="Maths part border colour"
                  type="color"
                  value={selectedOverride.borderColor || "#c7d2fe"}
                  onChange={e => patchPart({ borderColor: e.target.value })}
                />
              </label>
            </div>
            <label className="flex items-center gap-2">
              <input
                aria-label="Hide maths part"
                type="checkbox"
                checked={Boolean(selectedOverride.hidden)}
                onChange={e => patchPart({ hidden: e.target.checked })}
              />
              Hide this part
            </label>
            <button
              className="math-quiet-button"
              type="button"
              onClick={() => {
                const next = { ...overrides };
                delete next[selected.id];
                updateContent(element.id, { mathOverrides: next });
              }}
            >
              Restore this part’s original design
            </button>
          </div>
        )}
      </details>
    </fieldset>
  );
}
