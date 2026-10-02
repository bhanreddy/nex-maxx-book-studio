/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - UNIVERSAL MATH COMPONENT RENDERER
// Dispatches to the registered Math Template renderer with responsive layout reflow
// ============================================================================

import React from "react";
import { PageElement } from "../../domain/element/types";
import { getMathTemplate } from "./mathRegistry";
import { useEditorStore } from "../stores/editorStore";
import { MathAnswerMode, MathStyleVariant } from "./types";

interface MathComponentRendererProps {
  element: PageElement;
  isSelected?: boolean;
  zoom?: number;
}

export const MathComponentRenderer: React.FC<MathComponentRendererProps> = ({
  element,
  zoom = 1,
}) => {
  const updateElementContent = useEditorStore((s) => s.updateElementContent);

  const mathTemplateId =
    element.content?.mathTemplateId || element.presetId || "math-place-value-indian";
  const template = getMathTemplate(mathTemplateId);

  const mathData = element.content?.mathData || element.content || {};
  const mode: MathAnswerMode = element.content?.mathMode || "teacher";
  const styleVariant: MathStyleVariant =
    (element.content?.styleVariant as MathStyleVariant) || "color-coded";

  const handleUpdateData = (patch: Record<string, unknown>) => {
    updateElementContent(element.id, {
      mathData: { ...mathData, ...patch },
      // also keep synced at root for ease of access
      ...patch,
    });
  };

  if (!template) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs text-center font-mono">
        <span>Math Template Not Found</span>
        <span className="text-[9px] opacity-75">{mathTemplateId}</span>
      </div>
    );
  }

  const Renderer = template.renderer;

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <Renderer
        data={mathData}
        mode={mode}
        styleVariant={styleVariant}
        width={element.transform.width}
        height={element.transform.height}
        elementId={element.id}
        zoom={zoom}
        onUpdateData={handleUpdateData}
      />
    </div>
  );
};
