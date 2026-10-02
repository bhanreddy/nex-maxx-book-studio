"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { PageElement } from "../../domain/element/types";
import { useEditorStore } from "../stores/editorStore";
import { clearTextMeasureCache, layoutTextFlow, needsTextWrapContour, prepareTextWrapContours, textWrapObstacles } from "../layoutPartner/textWrapLayout";

/** Derived layout only: moving artwork never rewrites or truncates the stored paragraph. */
export function FlowText({ element }: { element: PageElement }) {
  const blockers = useEditorStore(useShallow(state => Object.values(state.elements).filter(other =>
    other.pageId === element.pageId && other.id !== element.id)));
  const [fontRevision, setFontRevision] = useState(0);
  const [contourRevision, setContourRevision] = useState(0);
  useEffect(() => {
    if (!blockers.some(needsTextWrapContour)) return;
    let active = true;
    prepareTextWrapContours(blockers).then(() => { if (active) setContourRevision(value => value + 1); });
    return () => { active = false; };
  }, [blockers]);
  useEffect(() => {
    let active = true;
    const refresh = () => { clearTextMeasureCache(); if (active) setFontRevision(value => value + 1); };
    document.fonts.ready.then(refresh);
    document.fonts.addEventListener("loadingdone", refresh);
    return () => { active = false; document.fonts.removeEventListener("loadingdone", refresh); };
  }, []);
  const layout = useMemo(() => layoutTextFlow(element, textWrapObstacles(element, blockers)), [element, blockers, fontRevision, contourRevision]);
  const border = element.style.borderWidth || 0;
  return <div className="relative" style={{ left: `${-border}pt`, top: `${-border}pt`, width: `${element.transform.width}pt`, height: `${element.transform.height}pt` }} data-text-flow={element.id} data-overset-chars={layout.oversetChars}>
    <div className="absolute inset-0 overflow-hidden" aria-label={element.displayName}>
      {layout.fragments.map((fragment, index) => <div key={index} data-flow-line="true" style={{
        position: "absolute", left: `${fragment.x}pt`, top: `${fragment.y}pt`, width: `${fragment.width}pt`,
        height: `${layout.lineHeight}pt`, lineHeight: `${layout.lineHeight}pt`, whiteSpace: "pre",
        pointerEvents: element.locked ? "none" : "auto",
        textAlign: element.style.textAlign === "justify" && fragment.paragraphEnd ? "left" : element.style.textAlign,
        textAlignLast: element.style.textAlign === "justify" && !fragment.paragraphEnd ? "justify" : undefined,
      }}>{fragment.runs.map((run, i) => <span key={i} style={{
        fontWeight: run.style.bold ? 700 : undefined, fontStyle: run.style.italic ? "italic" : undefined,
        textDecoration: [run.style.underline ? "underline" : "", run.style.strike ? "line-through" : ""].filter(Boolean).join(" ") || undefined,
        color: run.style.color,
      }}>{run.text}</span>)}</div>)}
    </div>
    {layout.oversetChars > 0 && <span role="status" title={`${layout.oversetChars} characters need more space. Enlarge this text frame or move the overlapping object.`}
      className="absolute -bottom-2 -right-2 z-40 rounded bg-rose-600 text-white text-[8pt] px-1.5 py-0.5 font-bold cursor-help pointer-events-auto">+{layout.oversetChars}</span>}
  </div>;
}
