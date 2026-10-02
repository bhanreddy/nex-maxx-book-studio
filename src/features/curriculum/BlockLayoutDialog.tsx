"use client";
import {curriculumGradeRank} from "../../domain/educational/curriculum";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, ArrowRight, Layers } from "lucide-react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { BlockVisualStyle, CurriculumLayout } from "../../domain/educational/curriculum";
import { CURRICULUM_BLOCK_MAP, LAYOUT_NAMES } from "../../editor/curriculum/catalog";
import { BLOCK_STYLES, TEACHING_LAYOUTS, isTeachingLayout, layoutNote } from "../../editor/curriculum/layoutSystem";
import { PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { premiumLayoutOverrides, premiumShuffleOrder } from "../../editor/curriculum/premiumLayouts";
import { CurriculumPreview } from "./CurriculumPreview";

export function BlockLayoutDialog({ block, initialLayout, actionLabel = "Apply layout", onApply, onClose }: {
  block: SmartBlockInstance; initialLayout?: CurriculumLayout; actionLabel?: string;
  onApply: (block: SmartBlockInstance) => void; onClose: () => void;
}) {
  const def = CURRICULUM_BLOCK_MAP[block.curriculum!.type];
  const [layout, setLayout] = useState<CurriculumLayout>(initialLayout || block.styleOverrides.layoutVariant as CurriculumLayout || def.layouts[0]);
  const [style, setStyle] = useState<BlockVisualStyle>(block.styleOverrides.blockStyle || (curriculumGradeRank(block.curriculum!.grade) < 4 ? "colourful" : "calm"));
  const [print, setPrint] = useState<"colour" | "reduced-ink" | "grayscale">(block.styleOverrides.printMode || "colour");
  const [palette, setPalette] = useState(block.styleOverrides.paletteId || "classroom");
  const [more, setMore] = useState(false);
  const titleId = useId(), dialogRef = useRef<HTMLDivElement>(null);
  const preview = useMemo(() => ({ ...block, styleOverrides: { ...block.styleOverrides, sceneSlice: undefined, layoutVariant: layout, ...premiumLayoutOverrides(block.styleOverrides, layout), blockStyle: style, printMode: print, paletteId: palette, customPalette: palette === block.styleOverrides.paletteId ? block.styleOverrides.customPalette : undefined } }), [block, layout, style, print, palette]);
  const layouts = more ? def.layouts : [...new Set([...premiumShuffleOrder(def.layouts).slice(0, 5), layout])];
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const root = dialogRef.current; root?.focus();
    const onKey = (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key === "Tab" && root) {
        const items = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), select, [tabindex="0"]')];
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    // Capture Escape before editor shortcuts; never mutate the book while previewing.
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("keydown", onKey, true); before?.focus(); };
  }, []);
  return createPortal(
    <div className="block-layout-backdrop">
      <div ref={dialogRef} tabIndex={-1} className="block-layout-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header>
          <div><span className="curriculum-eyebrow">ONE BLOCK · MANY WAYS TO TEACH</span><h2 id={titleId}>{def.name}</h2><p>{block.curriculum!.subjectLabel} · Class {block.curriculum!.grade} · Every word stays editable</p></div>
          <button className="curriculum-icon-button" aria-label="Close layout preview" onClick={onClose}><X size={20}/></button>
        </header>
        <div className="block-layout-body">
          <aside className="custom-scrollbar">
            <div className="block-layout-section-title"><Layers size={15}/><strong>Choose a layout</strong><span>{def.layouts.length}</span></div>
            <div className="block-layout-options">
              {layouts.map(id => <button key={id} aria-pressed={id === layout} onClick={() => setLayout(id)} className={id === layout ? "is-selected" : ""}>
                <CurriculumPreview block={preview} type={def.id} layout={id}/>
                <span>{LAYOUT_NAMES[id]}{layout === id && <Check size={13}/>}</span>
              </button>)}
            </div>
            {def.layouts.length > 5 && <button className="block-layout-more" onClick={() => setMore(!more)}>{more ? "Show recommended layouts" : "Show all " + def.layouts.length + " layouts"}</button>}
            <div className="block-layout-section-title"><strong>Appearance</strong></div>
            <div className="block-style-options">
              {BLOCK_STYLES.map(item => <button key={item.id} aria-pressed={style === item.id} title={item.description} onClick={() => setStyle(item.id)}><span className={"block-style-swatch is-" + item.id}/>{item.name}{style === item.id && <Check size={12}/>}</button>)}
            </div>
            <label className="curriculum-field"><span>Colours</span><select aria-label="Preview colours" value={palette} onChange={e => setPalette(e.target.value)}>{Object.entries(PUBLICATION_PALETTES).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}</select></label>
            <label className="curriculum-field"><span>Print style</span><select aria-label="Preview print style" value={print} onChange={e => setPrint(e.target.value as typeof print)}><option value="colour">Full colour</option><option value="reduced-ink">Less ink</option><option value="grayscale">Grayscale</option></select></label>
          </aside>
          <main className="block-layout-stage custom-scrollbar">
            <div className="block-layout-preview-label"><strong>{LAYOUT_NAMES[layout]}</strong><span>LIVE BLOCK PREVIEW</span></div>
            <div className="block-layout-paper"><CurriculumPreview block={preview} type={def.id} framed={false}/></div>
            <p className="block-layout-description">{isTeachingLayout(layout) ? TEACHING_LAYOUTS[layout].description : "A structured layout for this teaching purpose."}</p>
            <p className="block-layout-note">{layoutNote(block, layout)}</p>
          </main>
        </div>
        <footer><span>Preview freely. Apply when it fits.</span><div><button className="curriculum-secondary" onClick={onClose}>Cancel</button><button className="curriculum-primary" onClick={() => { onApply(preview); onClose(); }}>{actionLabel}<ArrowRight size={16}/></button></div></footer>
      </div>
    </div>, document.body);
}
