"use client";
import React, { useEffect, useState } from "react";
import {
  Copy,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  ArrowRight,
  Plus,
  WandSparkles,
  Layers,
  ChevronDown,
  Palette,
  FileText,
  Sliders,
  Check,
  X,
} from "lucide-react";
import type { PageElement } from "../../domain/element/types";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { CURRICULUM_BLOCK_MAP, CURRICULUM_BLOCKS, LAYOUT_NAMES } from "../../editor/curriculum/catalog";
import {
  curriculumSource,
  editCurriculumBlock,
  switchCurriculumLayout,
  reshuffleCurriculumBlock,
  duplicateCurriculumBlock,
  convertBlock,
  removeFrameworkBlock,
  splitCurriculumBlock,
  unlockCurriculumLayers,
  editFramework,
  setFrameworkMode,
} from "../../editor/curriculum/actions";
import { PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { buildPublicationScene } from "../../editor/educational/publicationScene";
import { ImageControls } from "../educational/ImageControls";
import { ARTWORKS } from "../../editor/educational/publicationScene";
import { readPublicationImage } from "../../editor/educational/imageAssets";
import { CurriculumPreview } from "./CurriculumPreview";
import { CurriculumAiAssist } from "./CurriculumAiAssist";
import { BlockLayoutDialog } from "./BlockLayoutDialog";
import { BLOCK_STYLES } from "../../editor/curriculum/layoutSystem";
import type { CurriculumLayout } from "../../domain/educational/curriculum";
import { LessonSchemaTopicEditor } from "./LessonSchemaTopicEditor";
import { schemaTopics } from "../../editor/curriculum/lessonSchema";
import { StudySkillsTopicEditor } from "./StudySkillsTopicEditor";
import { studySkillTopics } from "../../editor/curriculum/studySkills";
import { LearningOutcomesTopicEditor } from "./LearningOutcomesTopicEditor";
import { learningOutcomeTopics } from "../../editor/curriculum/learningOutcomes";
import { SIGNATURE_SUBJECT_PRESETS } from "../../editor/curriculum/signatureElements";
import { applySignatureElementsToChapter } from "../../editor/curriculum/applySignatureElements";
import { ReferenceElementControls } from "./ReferenceElementControls";
import { stageName } from "../../editor/curriculum/frameworkPlan";

function ContentField({
  label,
  value = "",
  onSave,
  multiline = false,
  type = "text",
  placeholder = "",
  helper = "",
}: {
  label: string;
  value?: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  helper?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const save = () => {
    if (draft !== value) onSave(draft);
  };

  return (
    <label className="curriculum-field">
      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        {helper && <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{helper}</span>}
      </div>
      {multiline ? (
        <textarea
          rows={Math.min(6, Math.max(2, draft.split("\n").length))}
          value={draft}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          className="custom-scrollbar"
        />
      ) : (
        <input
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      )}
    </label>
  );
}

export function CurriculumBlockInspector({ element }: { element: PageElement }) {
  useEditorStore(s => s.books);
  const source = curriculumSource(element) || element.smartBlockData!;
  const def = CURRICULUM_BLOCK_MAP[source.curriculum!.type];
  const c = source.semanticContent;
  const isSchema = source.curriculum?.type === "lesson-schema";
  const isStudySkills = source.curriculum?.type === "study-skills";
  const isLearningOutcomes = source.curriculum?.type === "learning-outcomes";
  const isTopicBanner = source.curriculum?.type === "topic-banner";
  const isFactZone = source.curriculum?.type === "fact-zone";
  const isLifeConnect = source.curriculum?.type === "life-connect";
  const isSignature = isTopicBanner || isFactZone || isLifeConnect;
  const o = source.styleOverrides;
  const [tab, setTab] = useState<"content" | "layout" | "design">("content");
  const [previewLayout, setPreviewLayout] = useState<CurriculumLayout | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [convertSearch, setConvertSearch] = useState("");

  const book = useEditorStore(s => s.getActiveBook());
  const chapter = book?.chapters.find(ch => ch.id === source.curriculum?.chapterId || ch.id === book.pages.find(p => p.id === element.pageId)?.chapterId || ch.pageIds.includes(element.pageId));

  const edit = (description: string, fn: (block: SmartBlockInstance) => SmartBlockInstance) =>
    editCurriculumBlock(element, description, fn);
  const content = (patch: Partial<typeof c>) =>
    edit("Edit curriculum content", b => ({ ...b, semanticContent: { ...b.semanticContent, ...patch } }));
  const design = (patch: Partial<typeof o>) =>
    edit("Style curriculum block", b => ({ ...b, styleOverrides: { ...b.styleOverrides, ...patch } }));

  const photo = o.motifs?.find(m => m.role === "photo");
  const fullHeight = buildPublicationScene({ ...source, styleOverrides: { ...o, sceneSlice: undefined } }).height;
  const overloaded = book && fullHeight > book.dimensions.heightPt - book.margins.topPt - book.margins.bottomPt;
  const canEdit = !element.locked && !source.isLockedContent;
  const page = book?.pages.find(item => item.id === element.pageId);

  const stage = stageName(source.curriculum!.frameworkStage, source.curriculum!.type);

  return (
    <section className="curriculum-inspector" aria-label={`${def.name} inspector`}>
      {/* 1. Header Information */}
      <div className="curriculum-inspector-header">
        <div className="flex items-center justify-between gap-2">
          <span className="curriculum-stage-tag is-inspector">
            {stage.toUpperCase()} · CLASS {source.curriculum!.grade} · {source.curriculum!.subjectLabel}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            Pg {page?.displayNumber || "1"}
          </span>
        </div>
        <h2>{def.name}</h2>
        <p className="curriculum-inspector-lead">{def.purpose}</p>

        <div className="curriculum-location-banner" role="status">
          <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>On Page {page?.displayNumber || "1"}{chapter ? ` of “${chapter.title}”` : ""}</span>
          </div>
          <p className="text-[10.5px] text-amber-800/80 dark:text-amber-200/70 mt-0.5">
            {element.smartBlockData?.styleOverrides.contentLayout?.enabled ? "Fixed frame · drag text and images directly. Double-click text to edit." : source.isLockedDesign
              ? "Structured layout · text and questions flow safely across pages."
              : "Design mode · freely drag, resize and rotate on the page."}
          </p>
        </div>
      </div>

      {/* 2. Quick Command Grid */}
      <div className="curriculum-command-grid">
        <button disabled={!canEdit} onClick={() => setTab("layout")} title="Switch layout variations">
          <Layers size={13} className="text-indigo-400" />
          <span>Layout</span>
        </button>
        <button disabled={!canEdit} onClick={() => setTab("design")} title="Change color palette">
          <Palette size={13} className="text-amber-400" />
          <span>Colors</span>
        </button>
        <button disabled={!canEdit} onClick={() => reshuffleCurriculumBlock(element)} title="Try another editorial styling">
          <RefreshCw size={13} className="text-sky-400" />
          <span>Shuffle look</span>
        </button>
        <button onClick={() => duplicateCurriculumBlock(element)} title="Duplicate this block">
          <Copy size={13} className="text-slate-500 dark:text-slate-300" />
          <span>Duplicate</span>
        </button>
        <button disabled={!canEdit} onClick={() => setConvertOpen(!convertOpen)} aria-expanded={convertOpen} title="Change element type">
          <ArrowRight size={13} className="text-slate-500 dark:text-slate-300" />
          <span>Convert</span>
          <ChevronDown size={11} className="opacity-60 ml-auto" />
        </button>
        <button disabled={!canEdit} onClick={() => setAiOpen(true)} title="Draft with AI Assistant">
          <WandSparkles size={13} className="text-violet-400" />
          <span>✦ AI Draft</span>
        </button>
        <button onClick={() => useEditorStore.getState().toggleLockElement(element.id)} title={element.locked ? "Unlock element" : "Lock element"}>
          {element.locked ? <Unlock size={13} className="text-amber-500" /> : <Lock size={13} className="text-slate-500 dark:text-slate-400" />}
          <span>{element.locked ? "Unlock" : "Lock"}</span>
        </button>
        <button
          disabled={element.locked}
          className="is-delete"
          onClick={() =>
            source.curriculum?.chapterId
              ? removeFrameworkBlock(source.curriculum.chapterId, source.id)
              : useEditorStore.getState().deleteSelectedElements()
          }
          title="Delete element"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>

      {/* Convert Element Modal / Dropdown */}
      {convertOpen && (
        <div className="curriculum-convert animate-fadeIn">
          <div className="text-[11px] font-semibold text-slate-800 dark:text-white mb-1.5 flex justify-between items-center">
            <span>Change to another element</span>
            <button
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              onClick={() => setConvertOpen(false)}
              aria-label="Close convert options"
            >
              <X size={13} />
            </button>
          </div>
          <input
            aria-label="Search elements to convert to"
            placeholder="Search replacement (e.g. Solved Example, Question)..."
            value={convertSearch}
            onChange={e => setConvertSearch(e.target.value)}
          />
          <div className="custom-scrollbar">
            {CURRICULUM_BLOCKS.filter(b =>
              `${b.name} ${b.originalName || ""} ${b.tags.join(" ")}`.toLowerCase().includes(convertSearch.toLowerCase())
            )
              .slice(0, 36)
              .map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    convertBlock(element, b.id);
                    setConvertOpen(false);
                  }}
                >
                  <span className="font-medium text-slate-100">{b.name}</span>
                  <span className="text-[9px] text-amber-300/80">{stageName(b.stage)}</span>
                </button>
              ))}
          </div>
          <p>Questions, answers, illustrations and curriculum metadata are preserved.</p>
        </div>
      )}

      {/* Space Alert */}
      {overloaded && (
        <div className="curriculum-density-alert" role="alert">
          <strong>This element needs more space</strong>
          <p>{chapter ? "Content reflows automatically across extra pages." : "Move it to a page with more room."}</p>
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={() =>
                chapter ? editFramework(chapter.id, "Auto reflow chapter", f => f, source.id) : useEditorStore.getState().autoArrangeActivePage()
              }
            >
              Fix page flow
            </button>
            <button disabled={!chapter} onClick={() => splitCurriculumBlock(element)}>
              Split element
            </button>
          </div>
        </div>
      )}

      {/* 3. Inspector Tabs: Words vs Layout */}
      <div className="curriculum-inspector-tabs" role="tablist" aria-label="Element editing mode">
        <button
          role="tab"
          aria-selected={tab === "content"}
          onClick={() => setTab("content")}
          className={`flex items-center justify-center gap-1.5 ${tab === "content" ? "is-active" : ""}`}
        >
          <FileText size={13} />
          <span>Content</span>
        </button>
        <button role="tab" aria-selected={tab === "layout"} onClick={() => setTab("layout")} className={tab === "layout" ? "is-active" : ""}><Layers size={13}/><span>Layout</span></button>
        <button
          role="tab"
          aria-selected={tab === "design"}
          onClick={() => setTab("design")}
          className={`flex items-center justify-center gap-1.5 ${tab === "design" ? "is-active" : ""}`}
        >
          <Sliders size={13} />
          <span>Style</span>
        </button>
      </div>

      {/* TAB 1: Content & Words */}
      {tab === "content" ? (
        <fieldset disabled={!canEdit} className="space-y-3.5">
          <ContentField label="Title" value={c.title} onSave={title => content({ title })} />
          {isStudySkills ? (
            <>
              <ContentField
                label="Badge Title"
                value={c.badgeLabel || c.title || "STUDY SKILLS"}
                onSave={badgeLabel => content({ badgeLabel, title: badgeLabel })}
                placeholder="STUDY SKILLS"
              />
              <StudySkillsTopicEditor
                topics={studySkillTopics(source)}
                headerPrompt={c.calloutText || c.subtitle || "Face value of:"}
                subject={source.curriculum!.subjectLabel}
                onChangeHeader={header => content({ calloutText: header, subtitle: header })}
                onChangeTopics={studySkillTopics =>
                  content({
                    studySkillTopics,
                    items: studySkillTopics.map(t => t.text),
                  })
                }
              />
            </>
          ) : isLearningOutcomes ? (
            <>
              <ContentField
                label="Subtitle / Prompt"
                value={c.subtitle}
                multiline
                onSave={subtitle => content({ subtitle })}
                placeholder="After studying this chapter, the students will be able to:"
              />
              <LearningOutcomesTopicEditor
                topics={learningOutcomeTopics(source)}
                subject={source.curriculum!.subjectLabel}
                onChange={learningOutcomeTopics =>
                  content({
                    learningOutcomeTopics,
                    items: learningOutcomeTopics.map(t =>
                      t.isEmpty ? "" : `${t.verb ? `${t.verb} ` : ""}${t.text}`.trim()
                    ),
                  })
                }
              />
            </>
          ) : isTopicBanner ? (
            <div className="space-y-3">
              <ContentField label="Word 1 (Primary Topic)" value={c.title} onSave={title => content({ title })} placeholder="SUCCESSOR" />
              <ContentField label="Connector Badge" value={c.badgeLabel || "AND"} onSave={badgeLabel => content({ badgeLabel })} placeholder="AND" />
              <ContentField label="Word 2 (Secondary Topic)" value={c.subtitle} onSave={subtitle => content({ subtitle })} placeholder="PREDECESSOR" />
              <ContentField label="Concept Explanation / Bridge" value={c.introText} multiline onSave={introText => content({ introText })} placeholder="Explain the big concept..." />

              {/* Subject Presets */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Load Subject Preset</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.keys(SIGNATURE_SUBJECT_PRESETS).slice(0, 8).map(subKey => (
                    <button
                      key={subKey}
                      type="button"
                      onClick={() => {
                        const p = SIGNATURE_SUBJECT_PRESETS[subKey].topicBanner;
                        content({
                          title: p.word1,
                          badgeLabel: p.connector,
                          subtitle: p.word2,
                          introText: p.subtitle,
                        });
                      }}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-white/10 text-left font-medium truncate"
                    >
                      {subKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to Chapter Pages */}
              <button
                type="button"
                onClick={() => {
                  const targetChapterId = source.curriculum?.chapterId || chapter?.id;
                  if (targetChapterId) {
                    applySignatureElementsToChapter(targetChapterId, source.curriculum!.subjectLabel);
                  }
                }}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <span>⚡ Apply to Every Page of Chapter</span>
              </button>
            </div>
          ) : isFactZone ? (
            <div className="space-y-3">
              <ContentField label="Badge Title" value={c.badgeLabel || c.title || "FACT ZONE"} onSave={b => content({ badgeLabel: b, title: b })} placeholder="FACT ZONE" />
              <ContentField label="Fact Statement / Takeaway" value={c.calloutText || c.introText} multiline onSave={t => content({ calloutText: t, introText: t })} placeholder="Fact text..." />

              {/* Right Illustration Icon */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Right Badge Illustration</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "books", label: "3D Books" },
                    { id: "flask", label: "Flask" },
                    { id: "plant", label: "Plant" },
                    { id: "globe", label: "Globe" },
                    { id: "abacus", label: "Abacus" },
                    { id: "laptop", label: "Laptop" },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => content({ iconName: item.id })}
                      className={`px-2 py-1 text-[11px] rounded border font-medium ${
                        c.iconName === item.id
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-600 dark:text-cyan-300"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Presets */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Load Subject Preset</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.keys(SIGNATURE_SUBJECT_PRESETS).slice(0, 8).map(subKey => (
                    <button
                      key={subKey}
                      type="button"
                      onClick={() => {
                        const p = SIGNATURE_SUBJECT_PRESETS[subKey].factZone;
                        content({
                          badgeLabel: p.badgeTitle,
                          title: p.badgeTitle,
                          calloutText: p.factText,
                          introText: p.factText,
                          items: p.bullets,
                          iconName: p.rightIllustration,
                        });
                      }}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-white/10 text-left font-medium truncate"
                    >
                      {subKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to Chapter Pages */}
              <button
                type="button"
                onClick={() => {
                  const targetChapterId = source.curriculum?.chapterId || chapter?.id;
                  if (targetChapterId) {
                    applySignatureElementsToChapter(targetChapterId, source.curriculum!.subjectLabel);
                  }
                }}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <span>⚡ Apply to Every Page of Chapter</span>
              </button>
            </div>
          ) : isLifeConnect ? (
            <div className="space-y-3">
              <ContentField label="Word 1" value={c.badgeLabel || "LIFE"} onSave={b => content({ badgeLabel: b })} placeholder="LIFE" />
              <ContentField label="Word 2" value={c.title || "CONNECT"} onSave={t => content({ title: t })} placeholder="CONNECT" />
              <ContentField label="Subtitle" value={c.subtitle} onSave={s => content({ subtitle: s })} placeholder="Maths Around Us" />
              <ContentField label="Real-World Connection Prompt" value={c.calloutText || c.introText} multiline onSave={p => content({ calloutText: p, introText: p })} placeholder="Connection prompt..." />

              {/* Character Illustration */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Character Illustration</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "planting-boy", label: "Planting Boy" },
                    { id: "measuring-girl", label: "Reading Girl" },
                    { id: "market-shopping", label: "Market Shopping" },
                    { id: "nature-explorer", label: "Nature Explorer" },
                    { id: "digital-coder", label: "Digital Coder" },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => content({ iconName: item.id })}
                      className={`px-2 py-1 text-[11px] rounded border font-medium ${
                        c.iconName === item.id
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-600 dark:text-emerald-300"
                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Presets */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Load Subject Preset</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.keys(SIGNATURE_SUBJECT_PRESETS).slice(0, 8).map(subKey => (
                    <button
                      key={subKey}
                      type="button"
                      onClick={() => {
                        const p = SIGNATURE_SUBJECT_PRESETS[subKey].lifeConnect;
                        content({
                          badgeLabel: p.word1,
                          title: p.word2,
                          subtitle: p.subtitle,
                          calloutText: p.prompt,
                          introText: p.prompt,
                          iconName: p.illustration,
                        });
                      }}
                      className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-white/10 text-left font-medium truncate"
                    >
                      {subKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to Chapter Pages */}
              <button
                type="button"
                onClick={() => {
                  const targetChapterId = source.curriculum?.chapterId || chapter?.id;
                  if (targetChapterId) {
                    applySignatureElementsToChapter(targetChapterId, source.curriculum!.subjectLabel);
                  }
                }}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <span>⚡ Apply to Every Page of Chapter</span>
              </button>
            </div>
          ) : (
            <>
              {!isSchema && (
                <>
                  <ContentField label="Section badge" value={c.unitBadge} onSave={unitBadge => content({ unitBadge })} />
                  <ContentField
                    label="Subtitle / Prompt"
                    value={c.subtitle}
                    multiline
                    onSave={subtitle => content({ subtitle })}
                    placeholder="Add an encouraging subtitle or question..."
                  />
                  <ContentField
                    label="Concept / Teaching explanation"
                    value={c.introText}
                    multiline
                    onSave={introText => content({ introText })}
                    placeholder="Write the concept in simple, clear teaching language..."
                  />
                </>
              )}
              <ContentField
                label={isSchema ? "Central chapter name" : "Key takeaway / Remember"}
                value={c.calloutText}
                multiline
                onSave={calloutText => content({ calloutText })}
                placeholder="Highlight the key learning rule or takeaway..."
              />
              {!isSchema && c.chapterNumber !== undefined && (
                <ContentField label="Chapter number" value={c.chapterNumber} onSave={chapterNumber => content({ chapterNumber })} />
              )}

              {/* Dynamic Rows / Items */}
              {isSchema ? (
                <LessonSchemaTopicEditor
                  topics={schemaTopics(source)}
                  subject={source.curriculum!.subjectLabel}
                  onChange={lessonSchemaTopics => content({ lessonSchemaTopics })}
                />
              ) : (
                <ContentField
                  label={
                    o.layoutVariant === "comparison-table"
                      ? "Table rows (one per line, separate columns with |)"
                      : o.layoutVariant === "sorting-board"
                      ? "Items to sort (one per line)"
                      : "Learning points (one per line)"
                  }
                  value={(c.items || []).join("\n")}
                  multiline
                  onSave={v => content({ items: v.split("\n").filter(Boolean) })}
                />
              )}
            </>
          )}

          {(["comparison-table", "sorting-board", "compare-panels"] as string[]).includes(o.layoutVariant || "") && (
            <ContentField
              label="Column headings (separate with |)"
              value={Array.isArray(c.metadata?.columnHeadings) ? c.metadata.columnHeadings.join(" | ") : ""}
              onSave={v =>
                content({
                  metadata: {
                    ...c.metadata,
                    columnHeadings: v.split("|").map(s => s.trim()).slice(0, 2),
                  },
                })
              }
            />
          )}

          {(o.layoutVariant === "writing-sheet" || o.layoutVariant === "question-cards" || o.layoutVariant === "activity-board") && (
            <ContentField
              label="Writing lines per question"
              type="number"
              value={String(c.metadata?.answerLines || 3)}
              onSave={v =>
                content({
                  metadata: {
                    ...c.metadata,
                    answerLines: Math.max(1, Math.min(8, Number(v) || 3)),
                  },
                })
              }
            />
          )}

          {!isSchema && !isStudySkills && !isLearningOutcomes && !isSignature && (
            <ContentField
              label="Reading passage"
              value={c.passage}
              multiline
              onSave={passage => content({ passage })}
              placeholder="Add reading text with author's formatting..."
            />
          )}

          {c.materials && (
            <ContentField
              label="Required materials (one per line)"
              value={c.materials.join("\n")}
              multiline
              onSave={v => content({ materials: v.split("\n").filter(Boolean) })}
            />
          )}

          {!isSchema && !isStudySkills && !isLearningOutcomes && !isSignature && <>
          {/* Steps Array */}
          {(c.steps || []).map((step, i) => (
            <div key={i} className="curriculum-content-row">
              <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                <span>Step {step.stepNumber}</span>
                <button
                  type="button"
                  aria-label={`Remove step ${i + 1}`}
                  onClick={() =>
                    content({
                      steps: c.steps!.filter((_, j) => j !== i).map((s, j) => ({ ...s, stepNumber: j + 1 })),
                    })
                  }
                  className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <ContentField
                label="Step title"
                value={step.title}
                onSave={title => content({ steps: c.steps!.map((s, j) => (j === i ? { ...s, title } : s)) })}
              />
              <ContentField
                label="Instruction"
                value={step.body}
                multiline
                onSave={body => content({ steps: c.steps!.map((s, j) => (j === i ? { ...s, body } : s)) })}
              />
            </div>
          ))}

          <button
            type="button"
            className="curriculum-secondary w-full"
            onClick={() =>
              content({
                steps: [
                  ...(c.steps || []),
                  {
                    stepNumber: (c.steps?.length || 0) + 1,
                    title: "Next step",
                    body: "Add a clear instruction.",
                  },
                ],
              })
            }
          >
            <Plus size={13} />
            <span>Add Step</span>
          </button>

          {/* Questions Array */}
          {(c.questions || []).map((q, i) => (
            <div className="curriculum-content-row" key={i}>
              <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                <span>Question {i + 1}</span>
                <button
                  type="button"
                  aria-label={`Remove question ${i + 1}`}
                  onClick={() => content({ questions: c.questions!.filter((_, j) => j !== i) })}
                  className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <ContentField
                label="Prompt / Question"
                value={q.prompt}
                multiline
                onSave={prompt =>
                  content({ questions: c.questions!.map((s, j) => (j === i ? { ...s, prompt } : s)) })
                }
              />
              <ContentField
                label="Multiple Choice Options (optional, one per line)"
                value={(q.options || []).join("\n")}
                multiline
                onSave={v =>
                  content({
                    questions: c.questions!.map((s, j) =>
                      j === i ? { ...s, options: v.split("\n").filter(Boolean) } : s
                    ),
                  })
                }
              />
              <ContentField
                label="Teacher Answer / Marking Guidance"
                value={q.answer}
                multiline
                onSave={answer =>
                  content({ questions: c.questions!.map((s, j) => (j === i ? { ...s, answer } : s)) })
                }
                helper="Hidden on student prints"
              />
              <ContentField
                label="Marks"
                value={String(q.points || 0)}
                type="number"
                onSave={v =>
                  content({
                    questions: c.questions!.map((s, j) =>
                      j === i ? { ...s, points: Math.max(0, Number(v) || 0) } : s
                    ),
                  })
                }
              />
            </div>
          ))}

          <button
            type="button"
            className="curriculum-secondary w-full"
            onClick={() =>
              content({
                questions: [
                  ...(c.questions || []),
                  { prompt: "Add a question checking the key idea.", answer: "", points: 1 },
                ],
              })
            }
          >
            <Plus size={13} />
            <span>Add Question</span>
          </button>

          <ContentField
            label="Teacher footnote / Tip"
            value={c.footnote}
            multiline
            onSave={footnote => content({ footnote })}
          /></>}

          {source.curriculum!.digitalExtension && (
            <div className="curriculum-content-row">
              <strong className="text-xs text-white">Digital Resource Extension</strong>
              {(["url", "duration", "contentType", "cta", "icon"] as const).map(key => (
                <ContentField
                  key={key}
                  label={key === "url" ? "Verified resource URL" : key === "cta" ? "Call to action" : key}
                  value={source.curriculum!.digitalExtension![key]}
                  onSave={v =>
                    edit("Edit digital extension", b => ({
                      ...b,
                      curriculum: {
                        ...b.curriculum!,
                        digitalExtension: { ...b.curriculum!.digitalExtension!, [key]: v },
                      },
                    }))
                  }
                />
              ))}
              <label className="curriculum-secondary cursor-pointer">
                Upload resource QR code
                <input
                  type="file"
                  className="sr-only"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const image = await readPublicationImage(file);
                      edit("Add resource QR", b => ({
                        ...b,
                        curriculum: {
                          ...b.curriculum!,
                          digitalExtension: { ...b.curriculum!.digitalExtension!, qrImageSrc: image.src },
                        },
                      }));
                    } catch (err) {
                      useUiStore.getState().showToast({
                        type: "error",
                        title: "QR upload failed",
                        message: String(err),
                      });
                    }
                  }}
                />
              </label>
            </div>
          )}
        </fieldset>
      ) : tab === "layout" ? (
        <fieldset disabled={!canEdit} className="space-y-4">
          <p className="text-xs text-slate-400">Choose how this block is arranged. Preview with your own words before applying.</p>
          <div className="curriculum-layout-grid">
            {def.layouts.map(layout => <button key={layout} aria-label={"Preview " + LAYOUT_NAMES[layout]} aria-pressed={o.layoutVariant === layout} onClick={() => setPreviewLayout(layout)}>
              <CurriculumPreview type={def.id} layout={layout} block={source}/>
              <div className="curriculum-layout-label"><span>{LAYOUT_NAMES[layout]}</span>{o.layoutVariant === layout && <Check size={11}/>}</div>
            </button>)}
          </div>
        </fieldset>
      ) : (
        <fieldset disabled={!canEdit} className="space-y-4">
          <ReferenceElementControls block={source} onChange={design} chapterId={chapter?.id}/>
          <div><span className="curriculum-eyebrow">APPEARANCE</span><div className="block-style-options">
            {BLOCK_STYLES.map(style => <button key={style.id} title={style.description} aria-pressed={o.blockStyle === style.id} onClick={() => design({ blockStyle: style.id })}><span className={"block-style-swatch is-" + style.id}/>{style.name}</button>)}
          </div></div>
          <div>
            <span className="curriculum-eyebrow">COORDINATED COLOR PALETTES</span>
            <div className="curriculum-palette-grid">
              {Object.entries(PUBLICATION_PALETTES).map(([id, p]) => (
                <button
                  key={id}
                  aria-pressed={o.paletteId === id}
                  onClick={() => design({ paletteId: id, customPalette: undefined })}
                  className={`curriculum-palette-card ${o.paletteId === id ? "is-selected" : ""}`}
                >
                  <div className="flex gap-1 items-center">
                    <span style={{ background: p.primary }} />
                    <span style={{ background: p.secondary }} />
                    <span style={{ background: p.accent }} />
                  </div>
                  <small>{p.name}</small>
                </button>
              ))}
            </div>
          </div>

          <label className="curriculum-field">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Custom accent color</span>
            <input
              type="color"
              value={
                o.customPalette?.primary ||
                PUBLICATION_PALETTES[o.paletteId as keyof typeof PUBLICATION_PALETTES]?.primary ||
                "#4338ca"
              }
              onChange={e => design({ customPalette: { ...o.customPalette, primary: e.target.value } })}
            />
          </label>

          <label className="curriculum-field">
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <span>Reading type scale</span>
              <span className="text-amber-600 dark:text-amber-300 text-[10px] font-mono">
                {Math.round((o.fontSizeScale || 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={1.5}
              step={0.05}
              value={o.fontSizeScale || 1}
              onChange={e => design({ fontSizeScale: Number(e.target.value) })}
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Class base size is the guaranteed minimum for print legibility</span>
          </label>

          <label className="curriculum-field">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Heading typography</span>
            <select
              value={o.fontFamily || "subject"}
              onChange={e => design({ fontFamily: e.target.value === "subject" ? undefined : e.target.value })}
            >
              <option value="subject">Adapt to subject domain</option>
              <option value="Inter">Clean geometric sans (Inter)</option>
              <option value="Times New Roman">Editorial literary serif</option>
            </select>
          </label>

          <label className="curriculum-field">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Paper texture treatment</span>
            <select
              value={o.backgroundSpec?.type || "default"}
              onChange={e =>
                design({
                  backgroundSpec:
                    e.target.value === "default"
                      ? undefined
                      : { ...o.backgroundSpec, type: e.target.value as NonNullable<typeof o.backgroundSpec>["type"] },
                })
              }
            >
              <option value="default">Adapt to layout style</option>
              <option value="solid">Solid paper card</option>
              <option value="gradient">Soft atmospheric gradient</option>
              <option value="subtle-tint">Subtle domain tint</option>
              <option value="bordered">Crisp hairline border</option>
              <option value="none">Transparent canvas</option>
            </select>
          </label>

          <label className="curriculum-field">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Paper pattern overlay</span>
            <select
              value={o.backgroundSpec?.patternOverlay || "none"}
              onChange={e =>
                design({
                  backgroundSpec: {
                    ...o.backgroundSpec,
                    patternOverlay: e.target.value as NonNullable<typeof o.backgroundSpec>["patternOverlay"],
                  },
                })
              }
            >
              {["none", "dots", "grid", "isometric", "waves"].map(pattern => (
                <option key={pattern} value={pattern}>
                  {pattern}
                </option>
              ))}
            </select>
          </label>

          <label className="curriculum-field">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Print export mode</span>
            <select
              value={o.printMode || "colour"}
              onChange={e => design({ printMode: e.target.value as typeof o.printMode })}
            >
              <option value="colour">Full colour publication</option>
              <option value="reduced-ink">Reduced ink classroom copy</option>
              <option value="grayscale">High-contrast black & white</option>
            </select>
          </label>

          <label className="curriculum-field">
            <span>Subject illustration</span>
            <select value={o.illustration === "none" ? "none" : "auto"} onChange={e => design({ illustration: e.target.value === "none" ? "none" : undefined })}>
              <option value="auto">Show a subject illustration</option>
              <option value="none">Hide decorative illustration</option>
            </select>
          </label>
          {/* Photo Controls */}
          <label className="curriculum-secondary cursor-pointer w-full text-center">
            Upload custom illustration
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const asset = await readPublicationImage(file);
                  design({
                    motifs: [
                      ...(o.motifs || []).filter(m => m.role !== "photo"),
                      {
                        id: "curriculum-photo",
                        role: "photo",
                        kind: "photo",
                        x: 26,
                        y: 100,
                        w: 465,
                        h: 190,
                        rotation: 0,
                        locked: false,
                        opacity: 1,
                        ...asset,
                      },
                    ],
                  });
                } catch (err) {
                  useUiStore.getState().showToast({
                    type: "error",
                    title: "Image not added",
                    message: String(err),
                  });
                }
              }}
            />
          </label>

          {photo && (
            <details className="curriculum-image-details">
              <summary className="curriculum-eyebrow cursor-pointer py-1">IMAGE FRAME & CROP</summary>
              <ImageControls
                value={photo}
                onChange={patch =>
                  design({
                    motifs: o.motifs!.map(m => (m.id === photo.id ? { ...m, ...patch } : m)),
                  })
                }
              />
            </details>
          )}

          {/* Decorative Plates */}
          <label className="curriculum-field">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Add background motif</span>
            <select
              value=""
              onChange={e => {
                if (!e.target.value) return;
                design({
                  motifs: [
                    ...(o.motifs || []),
                    {
                      id: crypto.randomUUID(),
                      role: "plate",
                      kind: e.target.value,
                      x: Math.max(0, source.transform.width - 90),
                      y: 14,
                      w: 64,
                      h: 64,
                      rotation: 0,
                      locked: false,
                      opacity: 0.14,
                      behind: true,
                    },
                  ],
                });
              }}
            >
              <option value="">Select decorative artwork motif...</option>
              {ARTWORKS.map(art => (
                <option key={art.id} value={art.id}>
                  {art.name}
                </option>
              ))}
            </select>
          </label>

          {(o.motifs || [])
            .filter(m => m.role === "plate")
            .map(m => (
              <div className="curriculum-content-row" key={m.id}>
                <div className="flex justify-between items-center text-xs">
                  <span>{ARTWORKS.find(a => a.id === m.kind)?.name || m.kind}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${m.kind} decoration`}
                    onClick={() => design({ motifs: o.motifs!.filter(a => a.id !== m.id) })}
                    className="p-1 hover:text-rose-400 text-slate-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <label className="curriculum-field">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Opacity</span>
                    <span>{Math.round(m.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={m.opacity}
                    onChange={e =>
                      design({
                        motifs: o.motifs!.map(a => (a.id === m.id ? { ...a, opacity: Number(e.target.value) } : a)),
                      })
                    }
                  />
                </label>
              </div>
            ))}

          <button
            type="button"
            className="curriculum-secondary w-full"
            onClick={() => useEditorStore.getState().savePublicationPreset(c.title, element.id)}
          >
            <Copy size={13} />
            <span>Save as reusable template</span>
          </button>

          <button
            type="button"
            className="curriculum-secondary w-full"
            onClick={() => {
              if (chapter?.id && chapter.framework?.mode !== "design") {
                setFrameworkMode(chapter.id, "design");
              }
              unlockCurriculumLayers(element);
            }}
          >
            <Layers size={13} />
            <span>Unlock into independent layers (Free Edit)</span>
          </button>
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200 flex items-center justify-between gap-2 mt-1">
            <span>Mode: <strong>{chapter?.framework?.mode === "design" ? "🎨 Design Mode (Free Resize)" : "🔒 Easy Mode (Template Safe)"}</strong></span>
            {chapter && (
              <button
                type="button"
                onClick={() => setFrameworkMode(chapter.id, chapter.framework?.mode === "design" ? "easy" : "design")}
                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] transition-colors shrink-0"
              >
                {chapter.framework?.mode === "design" ? "Set to Easy" : "Enable Design"}
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Design mode enables free dragging and resizing. Unlocking separates the block into independent text, shape and image layers.
          </p>
        </fieldset>
      )}

      {previewLayout && <BlockLayoutDialog block={source} initialLayout={previewLayout} onClose={() => setPreviewLayout(null)} onApply={preview => edit("Change block layout and appearance", b => ({ ...b, styleOverrides: preview.styleOverrides }))}/>}
      {aiOpen && <CurriculumAiAssist element={element} onClose={() => setAiOpen(false)} />}
    </section>
  );
}
