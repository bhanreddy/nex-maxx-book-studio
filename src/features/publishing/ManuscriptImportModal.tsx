"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText, FileUp, ShieldCheck, X } from 'lucide-react';
import { useUiStore } from '../../editor/stores/uiStore';
import { useEditorStore } from '../../editor/stores/editorStore';
import { readManuscript, readTextManuscript } from '../../editor/importing/readManuscript';
import { prepareManuscript, type ImportOptions, type ImportPlan } from '../../editor/importing/composeManuscript';
import { commitManuscriptImport } from '../../editor/importing/commitImport';
import { draftText, type ImportMode, type ImportProgress, type ManuscriptDraft } from '../../editor/importing/types';
import type { Book } from '../../domain/book/types';
import { textFlowScene } from '../../editor/layoutPartner/textWrapLayout';
import { PublicationSceneView } from '../../editor/renderer/PublicationSceneView';
import styles from './ManuscriptImportModal.module.css';

interface Props { onImported?: (bookId: string) => void; defaultDestination?: 'new' | 'append' }
export function ManuscriptImportModal(props: Props) {
  const open = useUiStore(state => state.manuscriptImportOpen);
  return open ? <ImportDialog {...props} /> : null;
}
function ImportDialog({ onImported, defaultDestination = 'new' }: Props) {
  const dialog = useRef<HTMLDialogElement>(null), input = useRef<HTMLInputElement>(null), controller = useRef<AbortController | null>(null);
  const [tab, setTab] = useState<'file' | 'paste'>('file'), [file, setFile] = useState<File | null>(null), [pasted, setPasted] = useState('');
  const [mode, setMode] = useState<ImportMode>('artwork'), [range, setRange] = useState('');
  const [options, setOptions] = useState<ImportOptions>({ destination: defaultDestination, title: '', continuation: true, continuationTitle: '' });
  const [draft, setDraft] = useState<ManuscriptDraft | null>(null), [plan, setPlan] = useState<ImportPlan | null>(null);
  const [expectedBook, setExpectedBook] = useState<Book | undefined>(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [progress, setProgress] = useState<ImportProgress>({ stage: 'Reading your manuscript', completed: 0, total: 1 });
  const [acknowledged, setAcknowledged] = useState(false), [previewIndex, setPreviewIndex] = useState(0), [dragging, setDragging] = useState(false);
  const activeBook = useEditorStore(state => state.getActiveBook());
  const close = () => { controller.current?.abort(); useUiStore.getState().setManuscriptImportOpen(false); };
  useEffect(() => { dialog.current?.showModal(); return () => { controller.current?.abort(); }; }, []);
  const sourceText = useMemo(() => draft ? draftText(draft) : '', [draft]);
  const warnings = draft?.warnings || [];
  const importedPages = plan?.book.pages.filter(page => page.importSource && plan.elements[page.elementIds[0]]) || [];
  const pick = (selected: File | undefined) => { if (!selected || busy) return; setFile(selected); setError(''); setRange(''); setOptions(value => ({ ...value, title: selected.name.replace(/\.[^.]+$/, '') })); };
  const inspect = async () => {
    if (busy) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError('');
    try {
      const base = useEditorStore.getState().getActiveBook();
      if (!base) throw new Error('Create or open a book before importing a manuscript.');
      const next = tab === 'paste' ? readTextManuscript(pasted) : file ? await readManuscript(file, { mode, range, signal: abort.signal, onProgress: setProgress }) : null;
      if (!next) throw new Error('Choose a document first.');
      setProgress({ stage: 'Building editable pages and checking layout', completed: 0, total: 1 });
      const prepared = await prepareManuscript(next, base, options, abort.signal);
      if (abort.signal.aborted) return;
      setDraft(next); setPlan(prepared); setExpectedBook(options.destination === 'append' ? base : undefined);
      setAcknowledged(false); setPreviewIndex(0);
    } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'The manuscript could not be imported.'); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  };
  const commit = () => {
    if (!plan || busy) return;
    setBusy(true);
    try {
      commitManuscriptImport(plan, expectedBook);
      useUiStore.getState().showToast({ type: 'success', title: 'Your manuscript is ready', message: `${plan.importedPages} imported pages${plan.continuationPageId ? ' and a continuation page' : ''}. Undo reverses the entire import.` });
      close(); onImported?.(plan.book.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Import failed.'); setBusy(false); }
  };
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="manuscript-title" onCancel={event => { event.preventDefault(); close(); }}
    onKeyDown={event => event.stopPropagation()} onClick={event => { if (event.target === event.currentTarget && !busy) close(); }}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.icon}><FileUp size={23} /></div>
        <div><span className={styles.eyebrow}>MANUSCRIPT WORKSPACE</span><h2 id="manuscript-title">Pick up where you left off.</h2><p>Bring your existing work into NEX MAXX and keep building.</p></div>
        <button type="button" aria-label="Close manuscript import" className={styles.close} onClick={close}><X size={20} /></button>
      </header>
      <div className={styles.steps} aria-label="Import steps"><span className={!plan ? styles.current : ''}>01 · Source & setup</span><ArrowRight size={14}/><span className={plan ? styles.current : ''}>02 · Review & continue</span></div>
      <div className={styles.body}>
        {error && <div className={styles.error} role="alert">{error}</div>}
        {busy ? <div className={styles.progress} role="status" aria-live="polite"><FileText size={36}/><h3>{progress.stage}</h3><progress max={progress.total} value={progress.completed || undefined}/><p>Your book changes only after you approve the preview.</p><button type="button" onClick={() => { controller.current?.abort(); setBusy(false); }}>Cancel processing</button></div> : !plan ? <div className={styles.columns}>
          <section className={styles.source}>
            <div className={styles.tabs}><button type="button" aria-pressed={tab === 'file'} onClick={() => setTab('file')}>Upload document</button><button type="button" aria-pressed={tab === 'paste'} onClick={() => setTab('paste')}>Paste text</button></div>
            {tab === 'file' ? <>
              <input ref={input} type="file" accept=".docx,.pdf,.txt,.md,.doc" className={styles.hiddenInput} aria-label="Choose manuscript file" onChange={event => { pick(event.target.files?.[0]); event.target.value = ''; }}/>
              <button type="button" className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`} onClick={() => input.current?.click()}
                onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={event => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length !== 1) setError('Choose one manuscript at a time.'); else pick(event.dataTransfer.files[0]); }}>
                <FileUp size={32}/><strong>{file ? file.name : 'Drop your unfinished manuscript here'}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Click to choose another file` : 'or click to browse your files'}</span><small>Word .docx · PDF · Markdown · Text · Up to 40 MB</small>
              </button>
              {file?.name.toLowerCase().endsWith('.pdf') && <fieldset className={styles.fieldset}><legend>How should your PDF come in?</legend>
                <label className={styles.choice}><input type="radio" name="pdf-mode" checked={mode === 'artwork'} onChange={() => setMode('artwork')}/><span><strong>Preserve PDF pages</strong><small>Keep page appearance as locked artwork. Add new writing after it. Works with scanned pages.</small></span></label>
                <label className={styles.choice}><input type="radio" name="pdf-mode" checked={mode === 'editable'} onChange={() => setMode('editable')}/><span><strong>Extract editable text</strong><small>Reflow text into studio frames. Original artwork and complex layouts are not retained.</small></span></label>
                <label className={styles.field}>Source pages<input value={range} onChange={event => setRange(event.target.value)} placeholder="All pages, or 1-8, 12, 15-20"/><small>Up to 150 source pages per import.</small></label>
              </fieldset>}
              <p className={styles.hint}>For Google Docs, download a Word (.docx) or PDF copy. For legacy .doc, save as .docx first.</p>
            </> : <label className={styles.field}>Manuscript text<textarea rows={13} value={pasted} onChange={event => setPasted(event.target.value)} placeholder={'# Chapter 1: Where we began\n\nPaste your existing paragraphs here…'}/><small>Paragraphs and # headings are retained. Text is never treated as executable HTML.</small></label>}
          </section>
          <section className={styles.setup}><h3><BookOpen size={18}/> Make room for what’s next</h3>
            <fieldset className={styles.fieldset}><legend>Destination</legend><label className={styles.choice}><input type="radio" name="destination" checked={options.destination === 'new'} onChange={() => setOptions({ ...options, destination: 'new' })}/><span><strong>Create a new book</strong><small>Start a separate manuscript in your library.</small></span></label>
              <label className={styles.choice}><input type="radio" name="destination" checked={options.destination === 'append'} onChange={() => setOptions({ ...options, destination: 'append' })}/><span><strong>Append to this book</strong><small>{activeBook?.title || 'No active book'} · existing pages stay in place.</small></span></label></fieldset>
            {options.destination === 'new' && <label className={styles.field}>Book title<input value={options.title} onChange={event => setOptions({ ...options, title: event.target.value })} placeholder="Use the source document name" maxLength={200}/></label>}
            <label className={styles.choice}><input type="checkbox" checked={options.continuation} onChange={event => setOptions({ ...options, continuation: event.target.checked })}/><span><strong>Add a continuation page</strong><small>Open the studio at a fresh page after your imported work.</small></span></label>
            {options.continuation && <label className={styles.field}>Next chapter title <span className={styles.optional}>(optional)</span><input value={options.continuationTitle} onChange={event => setOptions({ ...options, continuationTitle: event.target.value })} placeholder="e.g. Chapter 4: The living world" maxLength={200}/><small>Leave blank to continue the last imported chapter.</small></label>}
            <div className={styles.note}><ShieldCheck size={18}/><p>Files are processed in your browser and saved on this device. For central sync, link the imported chapters through Central Book. One undo reverses the import.</p></div>
          </section>
        </div> : <div className={styles.columns}>
          <section className={styles.source}>
            <div className={styles.previewHeader}><h3>Page preview</h3><select aria-label="Preview imported page" value={previewIndex} onChange={event => setPreviewIndex(Number(event.target.value))}>{importedPages.map((page, i) => <option key={page.id} value={i}>Page {i + 1}{page.importSource?.sourcePage ? ` · source ${page.importSource.sourcePage}` : ''}</option>)}</select></div>
            <PagePreview plan={plan} pageId={importedPages[previewIndex]?.id}/>
            <p className={styles.hint}>Content placement preview. Editable pages use the destination book’s page furniture in the editor.</p>
          </section>
          <section className={styles.setup}>
            <span className={styles.eyebrow}>READY TO CONTINUE</span><h3>{plan.book.title}</h3><p className={styles.hint}>{draft?.name}</p>
            <div className={styles.stats}><div><strong>{plan.importedPages}</strong><span>imported pages</span></div><div><strong>{sourceText.trim() ? sourceText.trim().split(/\s+/u).length.toLocaleString() : '—'}</strong><span>extracted words</span></div><div><strong>{plan.continuationPageId ? '+1' : '0'}</strong><span>continuation page</span></div></div>
            <p className={styles.hint}>{options.destination === 'new' ? 'A separate book will be created.' : `Pages will be appended after page ${expectedBook?.pages.length}.`} {plan.continuationPageId ? 'You’ll land on the continuation page.' : 'You’ll land on the first imported page.'}</p>
            {warnings.length > 0 && <div className={styles.warnings}><h4>Review before importing</h4><ul>{warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></div>}
            {sourceText && <details className={styles.extracted}><summary>Inspect extracted text</summary><pre>{sourceText.slice(0, 12000)}{sourceText.length > 12000 ? '\n[Preview limited to 12,000 characters; full content is in the import.]' : ''}</pre></details>}
            {warnings.length > 0 && <label className={styles.choice}><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/><span>I’ve reviewed the conversion notes and page preview.</span></label>}
          </section>
        </div>}
      </div>
      <footer className={styles.footer}><button type="button" onClick={() => { if (plan) { setPlan(null); setError(''); } else close(); }} disabled={busy}>{plan ? <><ArrowLeft size={16}/> Back to setup</> : 'Cancel'}</button><span className={styles.footerNote}>Your existing work stays recoverable.</span>
        <button type="button" className={styles.primary} disabled={busy || (plan ? warnings.length > 0 && !acknowledged : tab === 'file' ? !file : !pasted.trim())} onClick={plan ? commit : inspect}>{plan ? <><CheckCircle2 size={18}/> Import & continue</> : <>Preview import <ArrowRight size={18}/></>}</button></footer>
    </div>
  </dialog>;
}
function PagePreview({ plan, pageId }: { plan: ImportPlan; pageId?: string }) {
  const page = plan.book.pages.find(page => page.id === pageId);
  const els = page?.elementIds.map(id => plan.elements[id]).filter(Boolean) || [];
  const width = plan.book.dimensions.widthPt, height = plan.book.dimensions.heightPt;
  return <div className={styles.previewWell}><svg className={styles.paper} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Imported page layout preview">
    <rect width={width} height={height} fill="white"/>
    {els.map(el => el.type === 'image' ? <image key={el.id} href={el.content.src} x={el.transform.x} y={el.transform.y} width={el.transform.width} height={el.transform.height} preserveAspectRatio="xMidYMid meet"/> :
      <foreignObject key={el.id} x={el.transform.x} y={el.transform.y} width={el.transform.width} height={el.transform.height}>
        <PublicationSceneView scene={textFlowScene(el, els)!} label={el.displayName}/>
      </foreignObject>)}
  </svg></div>;
}
