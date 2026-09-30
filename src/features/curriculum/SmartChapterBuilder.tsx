"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X, BookOpen } from "lucide-react";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import { useEditorStore } from "../../editor/stores/editorStore";
import { DEFAULT_CHAPTER_CONFIG, CURRICULUM_SUBJECTS, PERSONALITIES, composeChapter, generateFramework } from "../../editor/curriculum/chapterEngine";
import { CHAPTER_PRESETS, FRAMEWORK_STAGES } from "../../editor/curriculum/catalog";
import { createFrameworkChapter } from "../../editor/curriculum/actions";
import {CURRICULUM_GRADES,curriculumGradeLabel,curriculumGradeRank} from "../../domain/educational/curriculum";
import type { ChapterBuilderConfig, CurriculumGrade, ChapterPersonality, ChapterComplexity, ChapterPreset } from "../../domain/educational/curriculum";
import { CurriculumPagePreview } from "./CurriculumPreview";

const STEPS = ["Class", "Subject", "Chapter details", "Page style", "Chapter type", "Review"];
export function SmartChapterBuilder() {
  const open = useCurriculumUi(s => s.builderOpen), close = useCurriculumUi(s => s.closeBuilder), preset = useCurriculumUi(s => s.preset);
  return open ? <Builder key={preset} preset={preset} onClose={close}/> : null;
}
function Builder({ preset, onClose }: { preset: ChapterPreset; onClose: () => void }) {
  const book = useEditorStore(s => s.getActiveBook())!;
  const [config, setConfig] = useState<ChapterBuilderConfig>({ ...DEFAULT_CHAPTER_CONFIG, preset });
  const [customSubject, setCustomSubject] = useState(false);
  const [step, setStep] = useState(0), [error, setError] = useState(""), [busy, setBusy] = useState(false), [previewIndex, setPreviewIndex] = useState(0);
  const patch = (update: Partial<ChapterBuilderConfig>) => { setConfig(c => ({ ...c, ...update })); setError(""); };
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key); const previous = document.activeElement as HTMLElement;
    document.getElementById("chapter-builder-heading")?.focus();
    return () => { window.removeEventListener("keydown", key); previous?.focus?.(); };
  }, [onClose]);
  const preview = useMemo(() => {
    try {
      const id = "framework-preview", framework = generateFramework({ ...config, title: config.title.trim() || "Your chapter title" }, id);
      const chapter = { id, unitId: "preview-unit", number: book.chapters.length + 1, title: config.title || "Your chapter", learningObjectives: config.learningOutcomes, pageIds: [], framework };
      return composeChapter({ ...book, pages: [], chapters: [chapter] }, chapter, {});
    } catch { return undefined; }
  }, [config, book]);
  const generate = () => {
    if (!config.title.trim()) { setStep(2); setError("Enter a chapter name before generating."); return; }
    if (!Number.isFinite(config.pageCount) || config.pageCount < 1 || config.pageCount > 100) { setStep(2); setError("Choose between 1 and 100 pages."); return; }
    setBusy(true);
    requestAnimationFrame(() => { try { createFrameworkChapter(config); onClose(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); setBusy(false); } });
  };
  const next = () => { if (step === 2 && (!config.title.trim() || config.pageCount < 1 || config.pageCount > 100)) { setError("Enter a chapter name and a page count from 1 to 100."); return; } setStep(s => Math.min(5, s + 1)); };
  const page = preview?.pages[Math.min(previewIndex, preview.pages.length - 1)];
  return <div className="curriculum-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="chapter-builder" role="dialog" aria-modal="true" aria-labelledby="chapter-builder-heading" onKeyDown={e => {
      if (e.key !== "Tab") return;
      const controls = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, [tabindex="0"]')];
      if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0]?.focus(); }
    }}>
      <header className="chapter-builder-header"><div><span className="curriculum-eyebrow">BUILD YOUR CHAPTER</span><h1 id="chapter-builder-heading" tabIndex={-1}>Chapter Builder</h1><p>Choose a class, subject and chapter type. Edit every page after you create it.</p></div><button className="curriculum-icon-button" onClick={onClose} aria-label="Close chapter builder"><X size={20}/></button></header>
      <nav className="chapter-builder-steps" aria-label="Chapter builder steps">{STEPS.map((name, i) => <button key={name} aria-label={`${i+1}. ${name}`} aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)}><span>{i < step ? <Check size={12}/> : String(i+1).padStart(2,"0")}</span><small>{name}</small></button>)}</nav>
      <div className="chapter-builder-body">
        <div className="chapter-builder-form">
          <span className="curriculum-eyebrow">STEP {step+1} OF 6</span><h2>{["Choose the class", "Choose the subject", "Tell us about this chapter", "Choose how the pages look", "Choose how much to include", "Review your chapter"][step]}</h2>
          {step === 0 && <><p>One framework adapts its reading size, visual weight and scaffolding to each class.</p><div className="chapter-class-options">{CURRICULUM_GRADES.map(g => <button key={g} aria-pressed={config.grade === g} onClick={() => patch({ grade: g as CurriculumGrade })}><span>LEVEL</span><strong>{curriculumGradeLabel(g)}</strong><small>{["See & try", "Explore with help", "Connect ideas", "Work independently", "Reason & extend"][curriculumGradeRank(g)-1] || "Listen, play & explore"}</small></button>)}</div></>}
          {step === 1 && <><p>Subject cues change the visual language: precise geometry, field notes or narrative typography.</p><div className="chapter-choice-grid">{CURRICULUM_SUBJECTS.map(subject => { const selected = subject === "Custom" ? customSubject : !customSubject && config.subject === subject; return <button key={subject} aria-pressed={selected} onClick={() => { setCustomSubject(subject === "Custom"); patch({ subject }); }}>{subject}<span>{selected ? <Check size={15}/> : <ArrowRight size={13}/>}</span></button>; })}</div>{customSubject && <label className="curriculum-field">Custom subject<input placeholder="e.g. Art & Design" value={config.subject === "Custom" ? "" : config.subject} onChange={e => patch({ subject: e.target.value || "Custom" })}/></label>}</>}
          {step === 2 && <div className="space-y-3"><label className="curriculum-field">Chapter name<input autoFocus value={config.title} onChange={e => patch({ title: e.target.value })} placeholder="e.g. The world of plants"/></label><div className="grid grid-cols-2 gap-3"><label className="curriculum-field">Unit<input value={config.unit} onChange={e => patch({ unit: e.target.value })}/></label><label className="curriculum-field">Minimum pages<input type="number" min={1} max={100} value={config.pageCount} onChange={e => patch({ pageCount: Number(e.target.value) })}/></label></div><label className="curriculum-field">Theme / opening line<input value={config.theme} onChange={e => patch({ theme: e.target.value })}/></label><label className="curriculum-field">Learning goals · one per line<textarea rows={3} value={config.learningOutcomes.join("\n")} onChange={e => patch({ learningOutcomes: e.target.value.split("\n") })}/></label><label className="curriculum-field">Topics · one per line<textarea rows={3} value={config.concepts.join("\n")} onChange={e => patch({ concepts: e.target.value.split("\n") })}/></label></div>}
          {step === 3 && <><p>Coordinated palettes and an intentional mix of compositions give the chapter a consistent voice.</p><div className="chapter-choice-grid">{PERSONALITIES.map(name => { const id = name.toLowerCase().replaceAll(" ", "-") as ChapterPersonality; return <button key={id} aria-pressed={config.personality === id} onClick={() => patch({ personality: id })}>{name === "Custom" ? "Custom Brand Theme" : name}<span>{config.personality === id ? <Check size={15}/> : <span className={`chapter-theme-dot theme-${id}`}/>}</span></button>; })}</div>{config.personality === "custom" && <label className="curriculum-field mt-3">Brand accent<input type="color" value={config.brandAccent || "#4338ca"} onChange={e => patch({ brandAccent: e.target.value })}/></label>}</>}
          {step === 4 && <><div className="chapter-depth-options">{(["compact", "standard", "rich", "premium"] as ChapterComplexity[]).map(depth => <button key={depth} aria-pressed={config.complexity === depth} onClick={() => patch({ complexity: depth })}>{{compact:"Short",standard:"Standard",rich:"More detail",premium:"Most detail"}[depth]}</button>)}</div><label className="curriculum-field mt-5">Chapter type<select value={config.preset} onChange={e => patch({ preset: e.target.value as ChapterPreset })}>{CHAPTER_PRESETS.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><p className="mt-3">{CHAPTER_PRESETS.find(p => p.id === config.preset)?.description}</p><div className="chapter-framework-strip">{FRAMEWORK_STAGES.map(s => <span key={s.id}>{s.name}</span>)}</div></>}
          {step === 5 && <><p>{curriculumGradeLabel(config.grade)} · {config.subject} · {CHAPTER_PRESETS.find(p => p.id === config.preset)?.name}</p><div className="chapter-review"><BookOpen size={24}/><strong>{config.title}</strong><span>{preview?.pages.length || 0} designed pages · {Object.keys(preview?.chapter.framework?.blocks || {}).length} learning elements</span></div><div className="chapter-framework-strip">{FRAMEWORK_STAGES.map(s => <span key={s.id}>{s.name}</span>)}</div><p>Includes editable teaching prompts, questions and answer spaces. Review and replace the instructional placeholders with your chapter content.</p>{preview && preview.pages.length > config.pageCount && <p className="curriculum-warning">The chapter uses {preview.pages.length} pages to keep the text easy to read. Your minimum was {config.pageCount}.</p>}</>}
          {error && <p role="alert" className="curriculum-error">{error}</p>}
        </div>
        <aside className="chapter-builder-preview"><div className="flex items-center justify-between"><span className="curriculum-eyebrow">LIVE CHAPTER PREVIEW</span><span className="text-[10px] text-slate-500">{curriculumGradeRank(config.grade) < 3 ? "Large type · visual cues" : "Editorial hierarchy"}</span></div>{page && preview ? <div className="chapter-preview-main"><CurriculumPagePreview page={page} elements={preview.elements} width={book.dimensions.widthPt} height={book.dimensions.heightPt}/></div> : <div className="curriculum-empty">Set your chapter brief to see a preview.</div>}<div className="chapter-preview-pages">{preview?.pages.map((p, i) => <button key={p.id} aria-label={`Preview chapter page ${i+1}`} aria-pressed={previewIndex === i} onClick={() => setPreviewIndex(i)}>{i+1}</button>)}</div><p>Real layouts, real reading sizes.<br/>Every block stays editable after generation.</p></aside>
      </div>
      <footer className="chapter-builder-footer"><button className="curriculum-secondary" onClick={() => step ? setStep(s => s-1) : onClose()}><ArrowLeft size={14}/>{step ? "Back" : "Cancel"}</button><span>Existing pages stay intact. Undo restores the chapter.</span>{step < 5 ? <button className="curriculum-primary" onClick={next}>Continue<ArrowRight size={15}/></button> : <button className="curriculum-primary" disabled={busy} onClick={generate}><Sparkles size={15}/>{busy ? "Composing chapter…" : "Generate chapter framework"}</button>}</footer>
    </div>
  </div>;
}
