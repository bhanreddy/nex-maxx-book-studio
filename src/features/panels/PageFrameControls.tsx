'use client';
import { useMemo, useRef, useState } from 'react';
import { X, RotateCcw, Upload } from 'lucide-react';
import { useEditorStore } from '../../editor/stores/editorStore';
import { createPageFrame, editableFrameNodes, FRAME_PALETTES, buildPageFrameScene, pageFrameFor, pageFrameSvg } from '../../editor/pageFrame/pageFrame';
import { applyPageFrame, type FrameScope } from '../../editor/pageFrame/actions';
import type { PageFrame } from '../../editor/pageFrame/types';
import { PublicationSceneView } from '../../editor/renderer/PublicationSceneView';
import { importBorderTemplate } from '../../editor/pageFrame/borderTemplateImport';
import { isImportedPageFrame, borderPerimeterMask } from '../../editor/pageFrame/types';

const input = 'w-full min-h-11 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/30';
const button = 'min-h-11 rounded-lg border border-slate-200 dark:border-white/15 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 active:scale-[.98] transition-transform';

export function PageFrameControls({ onClose }: { onClose?: () => void }) {
  const book = useEditorStore(s => s.getActiveBook()), page = useEditorStore(s => s.getActivePage());
  const [scope, setScope] = useState<FrameScope>('book');
  const [draft, setDraft] = useState<PageFrame>(() => book && page ? structuredClone(pageFrameFor(book, page) || createPageFrame()) : createPageFrame());
  const [selected, setSelected] = useState('Top burgundy wave');
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const nodes = useMemo(() => editableFrameNodes({ ...draft, edits: {} }, page?.displayNumber || '1'), [draft, page?.displayNumber]);
  const preview = useMemo(() => buildPageFrameScene(draft, page?.displayNumber || '1', book?.dimensions.widthPt || 600, book?.dimensions.heightPt || 900), [draft, page?.displayNumber, book?.dimensions]);
  const importedDraft = isImportedPageFrame(draft);
  if (!book || !page) return null;
  const chapter = book.chapters.find(chapter => chapter.id === page.chapterId || chapter.pageIds.includes(page.id));
  const appliedCount = book.pages.filter(page => !!pageFrameFor(book, page)).length;
  const parts = nodes.filter(node => 'motifId' in node && node.motifId !== 'Paper' && node.kind !== 'text');
  const node = parts.find(node => 'motifId' in node && node.motifId === selected);
  const edit = (draft.edits[selected] || {}) as { hidden?: boolean; stroke?: string; strokeWidth?: number; fill?: string };
  const patch = (changes: Partial<typeof edit>) => setDraft(draft => ({ ...draft, edits: { ...draft.edits, [selected]: { ...draft.edits[selected], ...changes } } }));
  return <div className="space-y-5 text-slate-800 dark:text-slate-100" aria-label="Page border editor">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">Book design</p><h2 id="page-border-heading" className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Page borders</h2></div>
      {onClose && <button className={button} aria-label="Close page border editor" onClick={onClose}><X size={18}/></button>}
    </div>
    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">Choose the studio border or import your own single-page Word or PDF template. Apply once to every existing and future page.</p>
    <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-3" aria-label="Import page border template">
      <div><h3 className="text-sm font-semibold">Border from a Word document or PDF</h3><p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Single-page .docx or .pdf, up to 20 MB. Word line borders, full-page Word border images, and PDF border artwork are supported. The reading centre stays clear.</p></div>
      <input ref={fileInput} type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" tabIndex={-1} aria-label="Choose border template" disabled={importing} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        setImporting(true); setImportError('');
        try {
          const imported = await importBorderTemplate(file);
          setDraft(imported); setScope('book');
          const first = imported.additions.find(node => 'motifId' in node);
          setSelected(first && 'motifId' in first ? first.motifId || '' : '');
        } catch (error) { setImportError(error instanceof Error ? error.message : 'Could not read this template. Export a fresh .docx or .pdf copy and try again.'); }
        finally { setImporting(false); }
      }}/>
      <button className={`${button} w-full disabled:opacity-40`} disabled={importing} onClick={() => fileInput.current?.click()}><Upload size={14} className="inline mr-2"/>{importing ? 'Reading border template…' : 'Upload Word or PDF border'}</button>
      {importing && <p role="status" className="text-xs text-slate-600 dark:text-slate-400">Reading the template locally…</p>}
      {importError && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{importError}</p>}
      {importedDraft && <><p className="text-xs break-all text-slate-600 dark:text-slate-400">Ready: {draft.sourceName}. Check the preview, then apply below.</p><button className={`${button} w-full`} disabled={importing} onClick={() => { setDraft(createPageFrame()); setSelected('Top burgundy wave'); setImportError(''); }}>Use studio border</button></>}
    </section>
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-4 flex items-center gap-5">
      <div className="shrink-0 ring-1 ring-black/10 dark:ring-white/10" style={{ width: 140, aspectRatio: `${preview.width}/${preview.height}` }}><PublicationSceneView scene={preview} label="Live page border preview"/></div>
      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><p className="font-semibold text-slate-900 dark:text-white mb-2">{appliedCount} of {book.pages.length} pages have a border</p><p>Preview shows folio {page.displayNumber}.</p><p className="mt-2">{book.pageFramePolicy === 'book' ? 'New pages inherit the book border.' : 'Some pages may have their own settings.'}</p></div>
    </div>
    <label className="block text-xs font-semibold space-y-2"><span>Apply to</span><select aria-label="Page frame scope" className={input} value={scope} onChange={e => setScope(e.target.value as FrameScope)}><option value="book">Every page in this book</option><option value="chapter" disabled={!chapter}>Every page in this chapter</option><option value="page">Only this page</option></select></label>
    {draft.style === 'pdf-import' && <label className="block text-xs font-semibold space-y-2"><span>Border area (% from each edge)</span><input aria-label="PDF border area" className={input} type="number" min={4} max={25} step={1} value={Math.round((draft.safeInsets?.top || .1) * 100)} onChange={event => {
      if (!Number.isFinite(event.target.valueAsNumber)) return;
      const depth = Math.max(4, Math.min(25, event.target.valueAsNumber)) / 100;
      setDraft(current => ({ ...current, safeInsets: { top: depth, bottom: depth, left: depth, right: depth }, additions: current.additions.map(node => node.kind === 'image' ? { ...node, customMaskPath: borderPerimeterMask(depth) } : node) }));
    }}/><span className="block font-normal text-slate-600 dark:text-slate-400">Increase this if the border extends further into the page. Content inside the clear centre is excluded.</span></label>}
    {!importedDraft && <fieldset><legend className="text-xs font-semibold mb-2">Colour palette</legend><div className="flex flex-wrap gap-2">{Object.entries(FRAME_PALETTES).map(([name, colors]) => <button key={name} className={button} aria-pressed={draft.colors.primary === colors.primary} onClick={() => setDraft(draft => ({ ...draft, colors: { ...colors } }))}><span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: colors.primary }}/>{name}</button>)}</div></fieldset>}
    <div className="grid grid-cols-3 gap-3">{(importedDraft ? ['paper'] as const : ['primary', 'accent', 'paper'] as const).map(key => <label key={key} className="text-xs text-slate-600 dark:text-slate-400">{{ primary: 'Border ink', accent: 'Accent', paper: 'Paper' }[key]}<input className="mt-2 block w-full h-11 rounded-lg border border-slate-300 dark:border-white/15" aria-label={`Frame ${key} colour`} type="color" value={draft.colors[key]} onChange={e => setDraft(draft => ({ ...draft, colors: { ...draft.colors, [key]: e.target.value } }))}/></label>)}</div>
    <div className="grid grid-cols-2 gap-3">{(['showTopNumber', 'showBottomNumber'] as const).map((key, index) => <label key={key} className="flex gap-2 items-center min-h-11 text-xs"><input type="checkbox" checked={draft[key]} onChange={e => setDraft(draft => ({ ...draft, [key]: e.target.checked }))}/>{index ? 'Bottom page number' : 'Top page number'}</label>)}</div>
    <details className="rounded-xl border border-slate-200 dark:border-white/10 p-3"><summary className="text-xs font-semibold cursor-pointer min-h-11 flex items-center">Adjust border details</summary><div className="space-y-3 mt-2">
      <select aria-label="Select border detail" className={input} value={selected} onChange={e => setSelected(e.target.value)}>{parts.map(node => 'motifId' in node ? <option key={node.motifId} value={node.motifId}>{node.motifId}</option> : null)}</select>
      {node && 'stroke' in node && <><label className="block text-xs">Detail colour<input type="color" aria-label="Detail colour" className="block h-11 w-full mt-2" value={'fill' in node && node.fill !== 'none' ? edit.fill || node.fill : edit.stroke || node.stroke || draft.colors.primary} onChange={e => patch('fill' in node && node.fill !== 'none' ? { fill: e.target.value } : { stroke: e.target.value })}/></label><label className="block text-xs space-y-2"><span>Edge thickness (pt)</span><input aria-label="Edge thickness" className={input} type="number" min={.2} max={3} step={.1} value={edit.strokeWidth ?? node.strokeWidth ?? .65} onChange={e => { if (Number.isFinite(e.target.valueAsNumber)) patch({ strokeWidth: Math.max(.2, Math.min(3, e.target.valueAsNumber)) }); }}/></label><label className="flex items-center gap-2 min-h-11 text-xs"><input type="checkbox" checked={!edit.hidden} onChange={e => patch({ hidden: !e.target.checked })}/>Show this detail</label></>}
      <button className={`${button} w-full`} onClick={() => setDraft(draft => { const edits = { ...draft.edits }; delete edits[selected]; return { ...draft, edits }; })}><RotateCcw size={14} className="inline mr-2"/>Reset selected detail</button>
    </div></details>
    <button className={`${button} w-full`} onClick={() => {
      const url = URL.createObjectURL(new Blob([pageFrameSvg(draft, page.displayNumber, book.dimensions.widthPt, book.dimensions.heightPt)], { type: 'image/svg+xml' }));
      const link = document.createElement('a'); link.href = url; link.download = 'nex-maxx-wave-border.svg'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }}>Download editable border SVG</button>
    <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 py-4 space-y-2">
      <button disabled={importing} className="w-full min-h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 font-semibold text-sm text-white active:scale-[.98] transition-transform disabled:opacity-40" onClick={() => applyPageFrame(structuredClone(draft), scope)}>Apply to {scope === 'book' ? `all ${book.pages.length} pages` : scope === 'chapter' ? 'this chapter' : 'this page'}</button>
      <button className={`${button} w-full`} onClick={() => applyPageFrame(null, scope)}>Remove border from {scope === 'book' ? 'every page' : scope === 'chapter' ? 'this chapter' : 'this page'}</button>
    </div>
  </div>;
}
