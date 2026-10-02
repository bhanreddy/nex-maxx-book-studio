"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";

export function DeletePageButton({ index, className = "", showLabel = false }: { index: number; className?: string; showLabel?: boolean }) {
  const book = useEditorStore(s => s.getActiveBook());
  const page = book?.pages[index];
  const [pending, setPending] = useState<{ bookId: string; pageId: string; label: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (pending) dialog.current?.showModal(); }, [pending]);
  if (!page || !book) return null;
  return <>
    <button type="button" disabled={book.pages.length <= 1} aria-label={`Delete page ${page.displayNumber}`} title={book.pages.length <= 1 ? "Keep at least one page in the book" : `Delete page ${page.displayNumber}`} className={`${className} disabled:opacity-40 disabled:cursor-not-allowed`} onClick={e => {
      e.stopPropagation(); setPending({ bookId: book.id, pageId: page.id, label: page.displayNumber });
    }}><Trash2 className="w-3.5 h-3.5" />{showLabel && <span>Delete page</span>}</button>
    {pending && createPortal(<dialog ref={dialog} onCancel={() => setPending(null)} onClick={e => e.stopPropagation()} className="w-[min(420px,90vw)] rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl backdrop:bg-black/50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
      <h2 className="text-lg font-semibold">Delete page {pending.label}?</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This removes the page and all its elements. You can restore them with Undo.</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" autoFocus className="min-h-11 rounded-lg border border-slate-300 px-4 dark:border-white/20" onClick={() => setPending(null)}>Keep page</button>
        <button type="button" className="min-h-11 rounded-lg bg-rose-600 px-4 font-medium text-white hover:bg-rose-700" onClick={() => {
          const state = useEditorStore.getState(), current = state.getActiveBook();
          if (current?.id === pending.bookId) {
            const target = current.pages.findIndex(p => p.id === pending.pageId);
            if (target >= 0) state.deletePage(target);
          }
          setPending(null);
        }}>Delete page</button>
      </div>
    </dialog>, document.body)}
  </>;
}
