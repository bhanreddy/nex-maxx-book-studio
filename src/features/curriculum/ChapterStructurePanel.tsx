"use client";
import {CentralResourcePanel} from './CentralResourcePanel';
import {CentralReviewPanel} from './CentralReviewPanel';
import React, { useEffect, useMemo, useState } from "react";
import { getCloudChapterController, useCloudChapterStore } from "../../editor/stores/cloudChapterStore";
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, RefreshCw } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import { FRAMEWORK_STAGES, CURRICULUM_BLOCK_MAP } from "../../editor/curriculum/catalog";
import { editFramework, moveFrameworkBlock, removeFrameworkBlock, addFrameworkSection, removeFrameworkChapter } from "../../editor/curriculum/actions";
import { rhythmScore } from "../../editor/curriculum/chapterEngine";
import type { FrameworkStage } from "../../domain/educational/curriculum";
import { simpleChapterPlan } from "../../editor/curriculum/frameworkPlan";
import { ChapterPresence } from './ChapterPresence';
import { CentralChapterPicker } from './CentralChapterPicker';
import { CentralBookPanel } from './CentralBookPanel';

export function ChapterStructurePanel({ compact = false }: { compact?: boolean }) {
  const book = useEditorStore(s => s.getActiveBook()), elements = useEditorStore(s => s.elements), index = useEditorStore(s => s.activePageIndex), selected = useEditorStore(s => s.selectedElementIds);
  const [chapterChoice, setChapterChoice] = useState(""), [collapsed, setCollapsed] = useState<string[]>([]), [open, setOpen] = useState(!compact), [add, setAdd] = useState(false);
  const [platformEmail, setPlatformEmail] = useState("");
  const [platformPassword, setPlatformPassword] = useState("");
  const [masterChapterId, setMasterChapterId] = useState("");
  const [curriculumVersionId, setCurriculumVersionId] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudError, setCloudError] = useState(false);
  const openBuilder = useCurriculumUi(s => s.openBuilder);
  const chapters = book?.chapters.filter(c => c.framework) || [];
  const selectedChapter = chapters.find(c => c.id === chapterChoice) || chapters.find(c => c.id === book?.pages[index]?.chapterId) || chapters[0];
  const chapter = useMemo(() => selectedChapter?.framework?.planVersion === 2
    ? selectedChapter
    : selectedChapter?.framework
      ? { ...selectedChapter, framework: simpleChapterPlan(selectedChapter.framework) }
      : selectedChapter, [selectedChapter]);
  const score = useMemo(() => chapter && book ? rhythmScore(book.pages.filter(p => chapter.pageIds.includes(p.id)), elements) : 0, [chapter, book, elements]);
  const centralStatus = useCloudChapterStore(s => chapter ? s.chapters[chapter.id] : undefined);
  const selectedChapterId = chapter?.id;
  useEffect(() => {
    const link = selectedChapterId ? getCloudChapterController(selectedChapterId)?.target : undefined;
    setMasterChapterId(link?.masterChapterId || '');
    setCurriculumVersionId(link?.curriculumVersionId || '');
  }, [selectedChapterId]);
  if (compact && !chapter) return null;
  const select = (id: string) => {
    const st = useEditorStore.getState();
    const el = elements[id] || Object.values(elements).find(e => e.content.curriculumBlockId === id);
    if (el) { const page = book!.pages.findIndex(p => p.id === el.pageId); if (page >= 0) st.setActivePageIndex(page); st.selectElement(el.id); }
  };
  const signInToPlatform = async () => {
    setCloudBusy(true);
    setCloudMessage("");
    setCloudError(false);
    try {
      const response = await fetch("/api/platform-auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: platformEmail, password: platformPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Platform sign in failed");
      setPlatformPassword("");
      setCloudMessage("Signed in. Cloud chapter operations now use your platform account.");
    } catch (error) {
      setCloudError(true);
      setCloudMessage(error instanceof Error ? error.message : "Platform sign in failed");
    } finally {
      setCloudBusy(false);
    }
  };
  const syncChapter = async (direction: "save" | "load") => {
    if (!chapter) return;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(masterChapterId) || !uuid.test(curriculumVersionId)) {
      setCloudError(true);
      setCloudMessage("Enter the canonical chapter and curriculum version UUIDs.");
      return;
    }
    setCloudBusy(true);
    setCloudMessage("");
    setCloudError(false);
    try {
      const target = { masterChapterId, curriculumVersionId };
      if (direction === "save") {
        const saved = await useEditorStore.getState().saveChapterToCloud(chapter.id, target);
        setCloudMessage(`Saved central draft revision ${saved.revision}. Local page layout remains on this device.`);
      } else {
        await useEditorStore.getState().loadChapterFromCloud(chapter.id, target);
        setCloudMessage("Loaded central chapter content into this local layout.");
      }
    } catch (error) {
      setCloudError(true);
      setCloudMessage(error instanceof Error ? error.message : "Cloud chapter operation failed");
    } finally {
      setCloudBusy(false);
    }
  };
  const dropped = (e: React.DragEvent, sectionId: string, beforeId?: string) => {
    e.preventDefault(); e.stopPropagation();
    const blockId = e.dataTransfer.getData("application/x-nex-curriculum-tree-block");
    const section = e.dataTransfer.getData("application/x-nex-curriculum-tree-section");
    if (blockId && blockId !== beforeId) moveFrameworkBlock(chapter!.id, blockId, sectionId, beforeId);
    else if (section && section !== sectionId) editFramework(chapter!.id, "Move chapter section", f => { const old = f.sections.find(s => s.id === section); if (!old) return f; f.sections = f.sections.filter(s => s.id !== section); f.sections.splice(f.sections.findIndex(s => s.id === sectionId), 0, old); return f; });
  };
  return <section className={`chapter-structure ${compact ? "is-compact" : ""}`}>
    <div className="chapter-structure-heading"><button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}<span>Chapter Plan</span><small>{chapter ? String(chapter.number).padStart(2,"0") : ""}</small></button><button onClick={() => openBuilder()} className="curriculum-icon-button" aria-label="New chapter"><Plus size={14}/></button></div>
    {open && <div className="chapter-structure-scroll">
      {!chapter ? <div className="curriculum-empty"><strong>Build your first chapter</strong><p>Start → Learn → Practice → Activities → Review → Test</p><button className="curriculum-primary" onClick={() => openBuilder()}><Sparkles size={14}/>Build a chapter</button></div> : <>
        <select aria-label="Chapter structure selection" value={chapter.id} onChange={e => setChapterChoice(e.target.value)}>{chapters.map(c => <option value={c.id} key={c.id}>Chapter {String(c.number).padStart(2,"0")} · {c.title}</option>)}</select>
        <div className="chapter-structure-meta">Class {chapter.framework!.config.grade} · {chapter.framework!.config.subject} · {chapter.pageIds.length} pages</div>
        {selectedChapter?.framework?.planVersion !== 2 && <button className="curriculum-secondary w-full mb-3" onClick={() => editFramework(chapter.id,"Use simple chapter plan",f=>f)}>Save the new chapter plan</button>}
        <div className="chapter-structure-tree">{chapter.framework!.sections.map((section, si) => {
          const isCollapsed = collapsed.includes(section.id);
          return <div key={section.id} className="chapter-tree-section" onDragOver={e => e.preventDefault()} onDrop={e => dropped(e, section.id)}>
            <div className="chapter-tree-stage" draggable onDragStart={e => e.dataTransfer.setData("application/x-nex-curriculum-tree-section", section.id)}>
              <GripVertical size={12} className="text-slate-600"/><button aria-expanded={!isCollapsed} onClick={() => setCollapsed(old => old.includes(section.id) ? old.filter(id => id !== section.id) : [...old, section.id])}>{isCollapsed ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}<span>{section.title}</span><small>{section.blockIds.length}</small></button>
              <button className="curriculum-icon-button" title="Move section up" disabled={!si} aria-label={`Move ${section.title} section up`} onClick={() => editFramework(chapter.id, "Move chapter section", f => { [f.sections[si-1], f.sections[si]] = [f.sections[si], f.sections[si-1]]; return f; })}><ArrowUp size={11}/></button>
              <button className="curriculum-icon-button" aria-label={`Remove ${section.title} section`} title="Remove section (undo available)" onClick={() => editFramework(chapter.id, "Remove chapter section", f => { section.blockIds.forEach(id => delete f.blocks[id]); f.sections = f.sections.filter(s => s.id !== section.id); return f; })}><Trash2 size={11}/></button>
            </div>
            {!isCollapsed && <div className="chapter-tree-blocks">{section.blockIds.map((id, bi) => {
              const block = chapter.framework!.blocks[id]; if (!block) return null;
              const page = book!.pages.find(p => p.elementIds.some(elId => elements[elId]?.smartBlockData?.curriculum?.sourceBlockId === id || elId === id || elements[elId]?.content.curriculumBlockId === id));
              return <div key={id} className={`chapter-tree-block ${selected.some(elId => elId === id || elements[elId]?.smartBlockData?.curriculum?.sourceBlockId === id) ? "is-selected" : ""}`} draggable onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData("application/x-nex-curriculum-tree-block", id); }} onDragOver={e => e.preventDefault()} onDrop={e => dropped(e, section.id, id)}>
                <GripVertical size={11}/><button onClick={() => select(id)}><strong>{CURRICULUM_BLOCK_MAP[block.curriculum!.type]?.name || block.semanticContent.title}</strong><span>{block.isDetached ? "Custom editable layers" : block.semanticContent.title !== CURRICULUM_BLOCK_MAP[block.curriculum!.type]?.name ? block.semanticContent.title : ""}</span></button><small>{page ? `p${page.displayNumber}` : ""}</small>
                <div className="chapter-tree-actions"><button disabled={!bi} aria-label={`Move ${block.semanticContent.title} up`} onClick={() => moveFrameworkBlock(chapter.id,id,section.id,section.blockIds[bi-1])}><ArrowUp size={10}/></button><button disabled={bi === section.blockIds.length-1} aria-label={`Move ${block.semanticContent.title} down`} onClick={() => moveFrameworkBlock(chapter.id,id,section.id,section.blockIds[bi+2])}><ArrowDown size={10}/></button><button aria-label={`Remove ${block.semanticContent.title}`} onClick={() => removeFrameworkBlock(chapter.id,id)}><Trash2 size={10}/></button></div>
              </div>;
            })}{!section.blockIds.length && <button className="chapter-tree-empty" onClick={() => useCurriculumUi.getState().setInsertOpen(true)}>+ Add an element</button>}</div>}
          </div>;
        })}</div>
        <div className="chapter-structure-controls"><button className="curriculum-secondary" onClick={() => setAdd(!add)}><Plus size={12}/>Add section</button><button className="curriculum-secondary" onClick={() => editFramework(chapter.id, "Vary chapter compositions", f => f, undefined, true)}><RefreshCw size={12}/>Create more variation</button></div>
        {add && <select autoFocus aria-label="New chapter section" defaultValue="" onChange={e => { addFrameworkSection(chapter.id,e.target.value as FrameworkStage); setAdd(false); }}><option value="" disabled>Choose a section…</option>{FRAMEWORK_STAGES.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select>}
        <label className="curriculum-field mt-3">Minimum pages<input type="number" min={1} max={100} defaultValue={chapter.framework!.config.pageCount} key={chapter.id + chapter.framework!.config.pageCount} onBlur={e => { const count = Number(e.target.value); if (Number.isFinite(count) && count >= 1 && count <= 100 && count !== chapter.framework!.config.pageCount) editFramework(chapter.id,"Change chapter page count",f => { f.config.pageCount = Math.round(count); return f; }); }}/></label>
        {score > .25 && <p className="curriculum-warning">These pages have similar compositions ({Math.round(score*100)}% repetition). Use “Create more variation”.</p>}
        <p className="chapter-structure-hint">Drag a section or element to reorder its pages. Every change can be undone.</p>
        {!compact && <div className="curriculum-cloud-link">
          <strong>Central curriculum</strong>
          <p className="chapter-structure-hint">Sign in, then browse central chapters to reload content or create a chapter in a draft release.</p>
          <label className="curriculum-field">Platform email<input type="email" autoComplete="username" value={platformEmail} onChange={e => setPlatformEmail(e.target.value)} /></label>
          <label className="curriculum-field">Password<input type="password" autoComplete="current-password" value={platformPassword} onChange={e => setPlatformPassword(e.target.value)} /></label>
          <button className="curriculum-secondary" disabled={cloudBusy || !platformEmail || !platformPassword} onClick={signInToPlatform}>Sign in</button>
          <CentralBookPanel versionId={curriculumVersionId} masterChapterId={masterChapterId} localChapterId={chapter.id} onTarget={target=>{setMasterChapterId(target.masterChapterId);setCurriculumVersionId(target.curriculumVersionId);}} />
          <CentralResourcePanel chapterId={chapter.id} />
          <CentralReviewPanel versionId={curriculumVersionId} chapterId={masterChapterId} localChapterId={chapter.id} />
          <CentralChapterPicker title={chapter.title} onPick={target=>{setMasterChapterId(target.masterChapterId);setCurriculumVersionId(target.curriculumVersionId);setCloudMessage('Central chapter selected. Reload existing content, or save to populate a newly created chapter.');setCloudError(false);}} />
          <details><summary>Advanced chapter link</summary>
            <label className="curriculum-field">Master chapter ID<input value={masterChapterId} onChange={e => setMasterChapterId(e.target.value.trim())} /></label>
            <label className="curriculum-field">Curriculum version ID<input value={curriculumVersionId} onChange={e => setCurriculumVersionId(e.target.value.trim())} /></label>
          </details>
          <div className="chapter-structure-controls">
            <button className="curriculum-secondary" disabled={cloudBusy || Boolean(getCloudChapterController(chapter.id)?.target.bookId)} onClick={() => syncChapter("save")}>{centralStatus?.state === 'Cloud save failed' || centralStatus?.state === 'Offline' ? 'Retry central save' : 'Save central draft'}</button>
            <button className="curriculum-secondary" disabled={cloudBusy || Boolean(getCloudChapterController(chapter.id)?.target.bookId)} onClick={() => syncChapter("load")}>Reload central content</button>
          </div>
          {centralStatus && <p className={`curriculum-cloud-status${centralStatus.error ? ' is-error' : ''}`} role="status">Central content: {centralStatus.state}{centralStatus.error ? ` · ${centralStatus.error}` : ''}</p>}
          <ChapterPresence masterChapterId={centralStatus && chapter ? getCloudChapterController(chapter.id)?.target.masterChapterId : undefined} />
          {centralStatus?.dirty && <>
            <p className="chapter-structure-hint">Reload keeps the displaced draft in local recovery. Download it before replacing conflicted work.</p>
            <button className="curriculum-secondary" onClick={() => {
              const document = getCloudChapterController(chapter.id)?.document;
              if (!document) return;
              const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], {type:'application/json'}));
              const link = window.document.createElement('a'); link.href = url; link.download = `chapter-${chapter.id}-recovery.json`; link.click(); URL.revokeObjectURL(url);
            }}>Download recovery JSON</button>
          </>}
          {cloudMessage && <p className={`curriculum-cloud-status${cloudError ? " is-error" : ""}`} role={cloudError ? "alert" : "status"}>{cloudMessage}</p>}
        </div>}
        <button className="curriculum-secondary" onClick={() => removeFrameworkChapter(chapter.id)} title="Remove this chapter and its pages; undo restores every layer"><Trash2 size={12}/>Remove chapter</button>
      </>}
    </div>}
    {compact && <button className="chapter-structure-expand" onClick={() => useUiStore.getState().setLeftPanelTab("structure")}>Open full structure<ChevronRight size={12}/></button>}
  </section>;
}
