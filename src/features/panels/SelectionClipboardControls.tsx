"use client";

import React, { useState } from "react";
import { Copy, Scissors, Clipboard, X } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { clipboardRoots, cutSelectionIssue } from "../../editor/clipboard/elementClipboard";

export function SelectionClipboardControls() {
  const state = useEditorStore();
  const book = state.getActiveBook(), page = state.getActivePage();
  const [destination, setDestination] = useState<{ activePageId: string; pageId: string } | null>(null);
  if (!book || !page) return null;
  const roots = clipboardRoots(state.selectedElementIds, state.elements, page.id);
  const cutIssue = cutSelectionIssue(roots, state.elements);
  const ready = state.clipboardElements.length > 0;
  const moving = ready && state.clipboardMode === "cut";
  const destinationId = destination?.activePageId === page.id && book.pages.some(p => p.id === destination.pageId) ? destination.pageId : page.id;
  const buttonClass = "min-h-11 px-2 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500";

  return <div className="flex items-center gap-1.5 shrink-0 border-r border-slate-200 dark:border-white/10 pr-3" data-canvas-controls>
    {roots.length > 0 && <>
      <button type="button" className={buttonClass} title="Copy selection (⌘/Ctrl+C)" onClick={state.copySelection}><Copy size={15}/>Copy</button>
      <button type="button" className={buttonClass} disabled={Boolean(cutIssue)} title={cutIssue || "Cut selection — moves when pasted (⌘/Ctrl+X)"} onClick={state.cutSelection}><Scissors size={15}/>Cut</button>
    </>}
    {ready && <>
      {moving && <span role="status" className="text-xs text-amber-700 dark:text-amber-300">Ready to move</span>}
      <select aria-label="Paste destination page" value={destinationId} onChange={event => setDestination({ activePageId: page.id, pageId: event.target.value })}
        className="min-h-11 max-w-36 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
        {book.pages.map(p => <option key={p.id} value={p.id}>Page {p.displayNumber}{p.id === page.id ? " (current)" : ""}</option>)}
      </select>
      <button type="button" className={buttonClass} title="Paste selection on the chosen page (⌘/Ctrl+V)" onClick={() => state.pasteSelection({ pageId: destinationId })}><Clipboard size={15}/>{moving ? "Move here" : "Paste"}</button>
      {moving && <button type="button" className={buttonClass} aria-label="Cancel cut" title="Cancel cut — keep the original on its page" onClick={state.cancelCutSelection}><X size={15}/></button>}
    </>}
  </div>;
}
