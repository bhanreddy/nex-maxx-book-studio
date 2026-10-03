import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PageElement } from "../../domain/element/types";
import { getMathTemplate } from "./mathRegistry";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { buildEditableMathTree, mathRenderFrame, type MathPart, type MathPartOverride } from "./mathEditableTree";
import { updateMathTemplateData } from "./mathActions";

interface MathComponentRendererProps {
  element: PageElement;
  isSelected?: boolean;
  zoom?: number;
}

export const MathComponentRenderer: React.FC<MathComponentRendererProps> = ({ element, isSelected = false, zoom = 1 }) => {
  const updateContent = useEditorStore(s => s.updateElementContent);
  const target = useUiStore(s => s.mathEditingTarget);
  const [editing, setEditing] = useState<{ part: MathPart; left: number; top: number; width: number } | null>(null);
  const draft = useRef("");
  const cancelled = useRef(false);
  const template = getMathTemplate(element.content.mathTemplateId || element.presetId || "math-place-value-indian");
  const data = element.content.mathData || element.content;
  const overrides: Record<string, MathPartOverride> = element.content.mathOverrides || {};
  const appearance = element.content.mathAppearance || {};

  useEffect(() => {
    if (!isSelected || element.locked) {
      setEditing(null);
      if (useUiStore.getState().editingTextElementId === element.id) useUiStore.getState().setEditingTextElementId(null);
    }
  }, [isSelected, element.locked, element.id]);
  useEffect(() => () => {
    if (useUiStore.getState().editingTextElementId === element.id) useUiStore.getState().setEditingTextElementId(null);
  }, [element.id]);

  if (!template) return <div className="p-3 text-xs text-rose-700">Maths template unavailable: {element.content.mathTemplateId}</div>;
  const frame = mathRenderFrame(template, element.transform.width, element.transform.height, appearance, data);
  const selectPart = (part: MathPart) => {
    useUiStore.getState().setMathEditingTarget({ elementId: element.id, partId: part.id });
    useUiStore.getState().setRightInspectorOpen(true);
  };
  const finish = (save: boolean) => {
    if (!editing) return;
    if (save && !cancelled.current && draft.current !== editing.part.text) {
      const current = useEditorStore.getState().elements[element.id];
      const parts = current?.content.mathOverrides || {};
      updateContent(element.id, { mathOverrides: { ...parts, [editing.part.id]: {
        ...parts[editing.part.id], source: editing.part.source, text: draft.current,
      } } });
    }
    setEditing(null);
    if (useUiStore.getState().editingTextElementId === element.id) useUiStore.getState().setEditingTextElementId(null);
  };
  const { tree } = buildEditableMathTree(template, {
    data, mode: element.content.mathMode || "teacher", styleVariant: element.content.styleVariant || "color-coded",
    width: frame.renderWidth, height: frame.renderHeight, elementId: element.id, zoom,
    onUpdateData: element.locked ? undefined : patch => updateMathTemplateData(element.id, patch),
  }, {
    overrides, appearance, interactive: !element.locked && isSelected,
    selectedPartId: target?.elementId === element.id ? target.partId : undefined,
    onSelect: selectPart,
    onEdit: (part, node) => {
      selectPart(part); cancelled.current = false; draft.current = part.text || "";
      const rect = node.getBoundingClientRect();
      setEditing({ part, left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)), top: Math.max(8, Math.min(rect.top, window.innerHeight - 112)), width: Math.max(240, Math.min(rect.width + 24, 480)) });
      useUiStore.getState().setEditingTextElementId(element.id);
    },
  });

  return <div className="math-component-frame w-full h-full relative" data-math-component={element.id}>
    <div style={{ position: "absolute", left: `${frame.padding + frame.offsetX}pt`, top: `${frame.padding + frame.offsetY}pt`, width: `${frame.renderWidth}pt`, height: `${frame.renderHeight}pt`, transform: `scale(${frame.scaleX}, ${frame.scaleY})`, transformOrigin: "top left" }}>
      {tree}
    </div>
    {editing && typeof document !== "undefined" && createPortal(
      <div className="math-inline-editor" data-canvas-controls style={{ position: "fixed", left: editing.left, top: editing.top, width: editing.width, zIndex: 10000 }} onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <textarea autoFocus aria-label="Edit maths template text" defaultValue={editing.part.text || ""} onFocus={e => e.currentTarget.select()} onChange={e => { draft.current = e.target.value; }}
          onBlur={() => finish(true)} onKeyDown={e => {
            e.stopPropagation();
            if (e.key === "Escape") { e.preventDefault(); cancelled.current = true; finish(false); }
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); finish(true); }
          }} />
        <div>Enter to save · Shift+Enter for a new line · Esc to cancel</div>
      </div>, document.body
    )}
  </div>;
};
