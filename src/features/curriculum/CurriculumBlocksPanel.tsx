"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Sparkles,
  RotateCcw,
  Compass,
  BookOpen,
  PenTool,
  FlaskConical,
  CheckCircle2,
  GraduationCap,
  GripVertical,
  SearchX,
  Grid,
  ChevronDown,
} from "lucide-react";
import { CURRICULUM_BLOCKS, CHAPTER_PRESETS, LAYOUT_NAMES } from "../../editor/curriculum/catalog";
import type { CurriculumBlockDefinition } from "../../domain/educational/curriculum";
import { CURRICULUM_SUBJECTS } from "../../editor/curriculum/chapterEngine";
import { useEditorStore } from "../../editor/stores/editorStore";
import { insertCurriculumBlock, activeFrameworkChapter, createUniversal5PageChapter } from "../../editor/curriculum/actions";
import { UNIVERSAL_CHAPTER_PRESETS } from "../../editor/curriculum/catalog";
import { useCurriculumUi } from "../../editor/curriculum/uiState";
import {CURRICULUM_GRADES,curriculumGradeLabel} from "../../domain/educational/curriculum";
import type { CurriculumGrade, CurriculumLayout } from "../../domain/educational/curriculum";
import { ReferenceElementsLibrary } from "./ReferenceElementsLibrary";
import { CurriculumPreview } from "./CurriculumPreview";
import { makeLibraryBlock } from "../../editor/curriculum/libraryExamples";
import { BlockLayoutDialog } from "./BlockLayoutDialog";
import { stageName } from "../../editor/curriculum/frameworkPlan";

/** Six core chapter sections with distinct editorial styling and icons */
const SECTIONS = [
  { id: "all", name: "All sections", icon: Grid, accent: "all" },
  { id: "discover", name: "Start", icon: Compass, accent: "start", hint: "Opener, prior knowledge & goals" },
  { id: "learn", name: "Learn", icon: BookOpen, accent: "learn", hint: "Explanations, visuals & key terms" },
  { id: "build", name: "Practice", icon: PenTool, accent: "practice", hint: "Guided problems & skill building" },
  { id: "apply", name: "Activities", icon: FlaskConical, accent: "activities", hint: "Hands-on labs & projects" },
  { id: "reflect", name: "Review", icon: CheckCircle2, accent: "review", hint: "Recap, self-check & reflections" },
  { id: "master", name: "Test", icon: GraduationCap, accent: "test", hint: "Assessments & mastery checks" },
] as const;

/** Subject collections with plain-language, teacher-friendly names */
const FAMILIES: { id: string; name: string; label: string; badge?: string }[] = [
  { id: "all", name: "All subjects", label: "All subject collections" },
  { id: "new", name: "✦ New elements", label: "72 newly introduced elements", badge: "72" },
  { id: "reading-writing", name: "Reading & Writing", label: "Reading passages, handwriting & phonics" },
  { id: "maths", name: "Maths", label: "Number lines, tables, equations & practice" },
  { id: "science", name: "Science", label: "Observation sheets, experiments & nature" },
  { id: "visuals", name: "Pictures & Tables", label: "Diagrams, sequence charts & comparisons" },
  { id: "projects", name: "Projects & Labs", label: "Group tasks, surveys & investigations" },
  { id: "enrichment", name: "Extra Learning", label: "Curious facts & cross-curricular links" },
  { id: "digital", name: "Online Resources", label: "Scan & learn, audio & interactive tools" },
  { id: "chapter-sets", name: "Chapter Templates", label: "Pre-composed chapter blueprints" },
];

function moveFocus(current: HTMLElement, key: string) {
  const row = current.parentElement;
  if (!row) return;
  const buttons = [...row.querySelectorAll<HTMLButtonElement>("button")];
  const index = buttons.indexOf(current as HTMLButtonElement);
  const next = buttons[index + (key === "ArrowRight" ? 1 : -1)];
  if (next) { next.focus(); }
}

function LibraryPreview({ type, layout, grade, subject, eager = false }: { type: string; layout?: CurriculumLayout; grade: CurriculumGrade; subject: string; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(eager);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { root: node.closest(".curriculum-library-scroll"), rootMargin: "350px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [type, layout, grade, subject]);

  return (
    <div ref={ref} className="curriculum-preview-slot" aria-busy={!ready}>
      {ready ? (
        <CurriculumPreview type={type} layout={layout} grade={grade} subject={subject} />
      ) : (
        <div className="curriculum-block-preview skeleton-preview" aria-hidden="true" />
      )}
    </div>
  );
}

const ElementCard = memo(function ElementCard({
  block,
  layout,
  grade,
  subject,
  destination,
  eager = false,
  onInsert,
  onKeyDown,
  onLayouts,
}: {
  block: CurriculumBlockDefinition;
  layout?: CurriculumLayout;
  grade: CurriculumGrade;
  subject: string;
  destination: string;
  eager?: boolean;
  onInsert: (id: string) => void;
  onLayouts: (id: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const stage = stageName(block.stage);
  return (
    <article className="curriculum-element-with-layouts">
    <button
      type="button"
      className="curriculum-preset"
      data-element-card=""
      aria-label={`Add ${block.name}. ${block.purpose} ${destination}`}
      onClick={() => onInsert(block.id)}
      onKeyDown={onKeyDown}
      draggable
      onDragStart={event =>
        event.dataTransfer.setData(
          "application/x-nexmaxx-curriculum",
          JSON.stringify({ type: block.id, layout: layout || "", grade, subject })
        )
      }
    >
      <div className="curriculum-preview-wrapper">
        <LibraryPreview type={block.id} layout={layout} grade={grade} subject={subject} eager={eager} />
        <div className="curriculum-card-badge-row">
          <span className={`curriculum-stage-tag is-${block.stage}`}>{stage}</span>
          {block.isNew && <span className="curriculum-new-pill">✦ New</span>}
        </div>
      </div>
      <div className="curriculum-preset-caption">
        <strong>{block.name}</strong>
        <small title={block.purpose}>{block.purpose}</small>
        <div className="curriculum-card-footer">
          <span className="curriculum-card-add-btn">
            <Plus size={13} aria-hidden="true" />
            Add to {stage}
          </span>
          <span className="curriculum-card-drag-hint" title="Drag onto canvas">
            <GripVertical size={13} aria-hidden="true" />
          </span>
        </div>
      </div>
    </button>
    <button className="curriculum-card-layouts" onClick={() => onLayouts(block.id)} aria-label={"Choose layout for " + block.name}><span>Choose a layout</span><span>{block.layouts.length} looks ↗</span></button>
    </article>
  );
});

export function CurriculumBlocksPanel({ floating = false }: { floating?: boolean }) {
  const templates = useEditorStore(s => s.publicationPresets);
  const bookId = useEditorStore(s => s.activeBookId);
  const pageIndex = useEditorStore(s => s.activePageIndex);
  const layoutPreferences = useCurriculumUi(state => state.layoutPreferences);
  const [layoutType, setLayoutType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [family, setFamily] = useState("all");
  const [layout, setLayout] = useState("");
  const [grade, setGrade] = useState<CurriculumGrade>(3);
  const [subject, setSubject] = useState("Science");
  const layoutSource = useMemo(() => {
    if (!layoutType) return null;
    const source = makeLibraryBlock(layoutType, grade, subject);
    return { ...source, styleOverrides: { ...source.styleOverrides, ...layoutPreferences[layoutType] } };
  }, [layoutType, grade, subject, layoutPreferences]);
  const [purpose, setPurpose] = useState("all");
  const [complexity, setComplexity] = useState("all");
  const [filters, setFilters] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const openBuilder = useCurriculumUi(s => s.openBuilder);
  const close = useCurriculumUi(s => s.setInsertOpen);
  const chapter = useMemo(() => {
    void bookId;
    void pageIndex;
    return activeFrameworkChapter();
  }, [bookId, pageIndex]);

  // Section element counts
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CURRICULUM_BLOCKS.length };
    for (const b of CURRICULUM_BLOCKS) {
      counts[b.stage] = (counts[b.stage] || 0) + 1;
    }
    return counts;
  }, []);

  // Family element counts
  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: CURRICULUM_BLOCKS.length,
      new: CURRICULUM_BLOCKS.filter(b => b.isNew).length,
    };
    for (const f of FAMILIES) {
      if (f.id !== "all" && f.id !== "new" && f.id !== "chapter-sets") {
        counts[f.id] = CURRICULUM_BLOCKS.filter(b => b.category === f.id || b.tags.includes(f.id)).length;
      }
    }
    return counts;
  }, []);

  const filtered = useMemo(
    () =>
      CURRICULUM_BLOCKS.filter(
        block =>
          (section === "all" || block.stage === section || block.category === section) &&
          (family === "all" ||
            family === "chapter-sets" ||
            (family === "new" ? block.isNew : block.category === family || block.tags.includes(family))) &&
          (!layout || block.layouts.includes(layout as CurriculumLayout)) &&
          (purpose === "all" || block.archetype === purpose) &&
          (complexity === "all" ||
            (complexity === "compact"
              ? block.layouts.includes("editorial")
              : block.layouts.some(item =>
                  ["visual-first", "journey", "workmat", "constellation"].includes(item)
                ))) &&
          `${block.name} ${block.originalName || ""} ${block.tags.join(" ")} ${block.purpose}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [search, section, family, layout, purpose, complexity]
  );

  const destination = chapter
    ? `Joins the matching section of “${chapter.title}”.`
    : "Appears on the active page, placed after the last block.";

  const insert = (type: string) => {
    const source = makeLibraryBlock(type, grade, subject);
    source.styleOverrides = { ...source.styleOverrides, ...layoutPreferences[type] };
    insertCurriculumBlock(type, layout ? (layout as CurriculumLayout) : undefined, grade, subject, source);
    if (floating) close(false);
  };

  const clear = () => {
    setSearch("");
    setSection("all");
    setFamily("all");
    setLayout("");
    setPurpose("all");
    setComplexity("all");
  };

  const onCardKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !gridRef.current) return;
    const cards = [...gridRef.current.querySelectorAll<HTMLButtonElement>("[data-element-card]")];
    const index = cards.indexOf(event.currentTarget);
    const columns = getComputedStyle(gridRef.current).gridTemplateColumns.split(" ").filter(Boolean).length || 1;

    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = index + 1;
    else if (event.key === "ArrowLeft") nextIndex = index - 1;
    else if (event.key === "ArrowDown") nextIndex = index + columns;
    else if (event.key === "ArrowUp") nextIndex = index - columns;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = cards.length - 1;

    const next = cards[nextIndex];
    if (next) {
      event.preventDefault();
      next.focus();
    }
  };

  const hasActiveFilters = search || section !== "all" || family !== "all" || layout || purpose !== "all" || complexity !== "all";

  return (
    <section className={`curriculum-library ${floating ? "is-floating" : ""}`} aria-label="Blocks and elements library">
      {/* 1. Compact Header Row */}
      <div className="curriculum-compact-header">
        <div className="curriculum-compact-heading">
          <h2>Blocks & Elements</h2>
          <span className="curriculum-compact-count">
            {filtered.length} of {CURRICULUM_BLOCKS.length}
          </span>
        </div>
        {floating ? (
          <button className="curriculum-icon-button" onClick={() => close(false)} aria-label="Close block library">
            <X size={16} />
          </button>
        ) : (
          <button
            className="curriculum-compact-build"
            onClick={() => { openBuilder(); close(false); }}
            title="Open full chapter architect"
          >
            <Sparkles size={13} aria-hidden="true" />
            Build
          </button>
        )}
      </div>

      {/* 2. Discovery filters — two short rows so the block list stays in view */}
      <div className="curriculum-compact-filters">
        <label className="curriculum-search">
          <Search size={13} aria-hidden="true" className="text-slate-400 flex-shrink-0" />
          <input
            ref={searchInputRef}
            aria-label="Search learning elements"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search elements…"
          />
          {search && (
            <button
              type="button"
              className="curriculum-search-clear"
              onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
              aria-label="Clear search query"
            >
              <X size={12} />
            </button>
          )}
        </label>

        <div className="curriculum-browse-row">
          <div
            className="curriculum-mini-sections"
            role="radiogroup"
            aria-label="Chapter sections"
            onWheel={event => {
              if (event.deltaY) {
                event.currentTarget.scrollLeft += event.deltaY;
              }
            }}
            onKeyDown={event => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(event.target as HTMLElement, event.key);
              }
            }}
          >
            {SECTIONS.map(s => {
              const isSelected = section === s.id;
              const count = sectionCounts[s.id] ?? 0;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  key={s.id}
                  onClick={e => {
                    setSection(s.id);
                    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                  }}
                  title={"hint" in s ? s.hint : "All 6 chapter sections"}
                  className={`curriculum-mini-pill ${isSelected ? "is-active" : ""}`}
                >
                  <s.icon size={10} aria-hidden="true" />
                  <span>{s.id === "all" ? "All" : s.name}</span>
                  <span className="curriculum-mini-count">{count}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`curriculum-context-chip ${contextOpen ? "is-open" : ""}`}
            onClick={() => setContextOpen(open => !open)}
            aria-expanded={contextOpen}
            aria-label={`Class and subject, ${curriculumGradeLabel(grade)}, ${subject}. Show class and subject`}
            title="Class and subject used when you add a block"
          >
            <span>{curriculumGradeLabel(grade)} · {subject}</span>
            <ChevronDown size={11} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`curriculum-more-toggle relative ${filters ? "is-open" : ""}`}
            onClick={() => setFilters(open => !open)}
            aria-expanded={filters}
            aria-label="Show more filters"
            title="Subject collections, layout and density filters"
          >
            <SlidersHorizontal size={12} />
            {(family !== "all" || layout !== "" || purpose !== "all" || complexity !== "all") && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="curriculum-clear-all"
              onClick={clear}
              aria-label="Reset all filters"
              title="Clear all active filters"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>

        {contextOpen && (
          <div className="curriculum-inline-context">
            <select
              aria-label="Class"
              value={grade}
              onChange={event => setGrade((/^(NURSERY|LKG|UKG)$/.test(event.target.value)?event.target.value:Number(event.target.value)) as CurriculumGrade)}
              className="curriculum-inline-select"
            >
              {CURRICULUM_GRADES.map(item => (
                <option key={item} value={item}>{curriculumGradeLabel(item)}</option>
              ))}
            </select>
            <select
              aria-label="Subject"
              value={subject}
              onChange={event => setSubject(event.target.value)}
              className="curriculum-inline-select"
            >
              {CURRICULUM_SUBJECTS.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        )}

        {/* Expandable extra filters */}
        {filters && (
          <div className="curriculum-expanded-filters animate-fadeIn">
            {/* Subject/Collection family chips — horizontal scroll strip */}
            <div
              className="curriculum-mini-families"
              role="toolbar"
              aria-label="Subject collections"
              onWheel={event => {
                if (event.deltaY) {
                  event.currentTarget.scrollLeft += event.deltaY;
                }
              }}
              onKeyDown={event => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveFocus(event.target as HTMLElement, event.key);
                }
              }}
            >
              {FAMILIES.map(item => {
                const count = familyCounts[item.id];
                const isSelected = family === item.id;
                const isNew = item.id === "new";
                return (
                  <button
                    type="button"
                    className={`curriculum-family-chip ${isNew ? "is-new-chip" : ""} ${isSelected ? "is-selected" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={item.label}
                    key={item.id}
                    onClick={e => {
                      setFamily(item.id);
                      e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                    }}
                  >
                    <span>{item.name}</span>
                    {item.badge ? (
                      <span className="curriculum-new-count">{item.badge}</span>
                    ) : count !== undefined && item.id !== "all" ? (
                      <span className="curriculum-mini-count">{count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Layout, density, archetype selects */}
            <div className="curriculum-extra-filters">
              <label>
                Layout
                <select aria-label="Layout filter" value={layout} onChange={event => setLayout(event.target.value)}>
                  <option value="">All styles</option>
                  {Object.entries(LAYOUT_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                Density
                <select aria-label="Density filter" value={complexity} onChange={event => setComplexity(event.target.value)}>
                  <option value="all">Any</option>
                  <option value="compact">Compact</option>
                  <option value="rich">Visual</option>
                </select>
              </label>
              <label>
                Purpose
                <select aria-label="Purpose filter" value={purpose} onChange={event => setPurpose(event.target.value)}>
                  <option value="all">All</option>
                  {[...new Set(CURRICULUM_BLOCKS.map(block => block.archetype))].map(item => (
                    <option key={item} value={item}>{item.replaceAll("-", " ")}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. Catalog Scroll Area */}
      <div className="curriculum-library-scroll custom-scrollbar">
        {family === "chapter-sets" ? (
          <div className="curriculum-set-list" role="list">
            <div className="p-3 mb-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/40 dark:from-amber-950/40 dark:to-slate-900 shadow-sm dark:shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  ✦ Flagship Reference
                </span>
                <span className="text-[9px] font-mono bg-amber-200/70 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-semibold">
                  5 Pages · All Editable
                </span>
              </div>
              <strong className="text-slate-900 dark:text-white text-sm block mb-1">NEX MAXX Universal 5-Page Chapter</strong>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-snug">
                Complete publication-grade chapter matching the Universal Layout Reference: Cover, Concept Discovery, Guided Practice, Hands-on Explore, and Mastery Check.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["editorial", "explorer", "academy", "workbook"] as const).map(presetKey => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => {
                      createUniversal5PageChapter({ subject, grade, preset: presetKey });
                      if (floating) close(false);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-400/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between capitalize transition-all"
                  >
                    <span>{presetKey}</span>
                    <Sparkles size={12} />
                  </button>
                ))}
              </div>
            </div>

            {CHAPTER_PRESETS.map((preset, index) => (
              <button
                className="curriculum-set"
                role="listitem"
                onClick={() => {
                  openBuilder(preset.id);
                  close(false);
                }}
                key={preset.id}
              >
                <span className="curriculum-eyebrow">
                  {String(index + 1).padStart(2, "0")} · {preset.id === "premium-nex" ? "Flagship" : "Chapter Blueprint"}
                </span>
                <strong>{preset.name}</strong>
                <div className="curriculum-set-previews">
                  {preset.blocks.slice(0, 3).map((type, item) => (
                    <CurriculumPreview key={`${type}-${item}`} type={type} grade={grade} subject={subject} />
                  ))}
                </div>
                <p>{preset.description}</p>
                <span className="curriculum-set-action">
                  Build this chapter <ArrowUpRight size={13} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Reusable Saved Templates */}
            {family === "all" &&
              section === "all" &&
              Object.entries(templates).some(
                ([, template]) => template.block.curriculum && template.name.toLowerCase().includes(search.toLowerCase())
              ) && (
                <div className="curriculum-template-block">
                  <span className="curriculum-eyebrow">Saved chapter templates</span>
                  <div className="curriculum-block-grid">
                    {Object.entries(templates)
                      .filter(
                        ([, template]) =>
                          template.block.curriculum && template.name.toLowerCase().includes(search.toLowerCase())
                      )
                      .map(([id, template]) => (
                        <button
                          className="curriculum-preset"
                          key={id}
                          aria-label={`Insert saved template ${template.name}`}
                          onClick={() => {
                            useEditorStore.getState().insertPublicationPreset(id);
                            if (floating) close(false);
                          }}
                        >
                          <div className="curriculum-preview-wrapper">
                            <CurriculumPreview type={template.block.curriculum!.type} block={template.block} />
                            <div className="curriculum-card-badge-row">
                              <span className="curriculum-stage-tag is-saved">Saved Template</span>
                            </div>
                          </div>
                          <div className="curriculum-preset-caption">
                            <strong>{template.name}</strong>
                            <small>Insert an editable copy of your custom template.</small>
                            <div className="curriculum-card-footer">
                              <span className="curriculum-card-add-btn">
                                <Plus size={13} aria-hidden="true" />
                                Add template
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {!search && family === "all" && section === "all" && <ReferenceElementsLibrary grade={grade} subject={subject} onInsert={() => { if (floating) close(false); }}/> }

            {/* 219 Element Cards Grid */}
            <div className="curriculum-block-grid" ref={gridRef} role="list" aria-label="Learning elements">
              {filtered.map((block, index) => (
                <ElementCard
                  key={block.id}
                  block={block}
                  layout={layout ? (layout as CurriculumLayout) : undefined}
                  grade={grade}
                  subject={subject}
                  destination={destination}
                  eager={index < 6}
                  onInsert={insert}
                  onLayouts={setLayoutType}
                  onKeyDown={onCardKey}
                />
              ))}
            </div>

            {/* Empty Search / Filter State */}
            {!filtered.length && (
              <div className="curriculum-empty" role="status">
                <div className="curriculum-empty-icon">
                  <SearchX size={32} className="text-amber-300/80" />
                </div>
                <strong>No matching elements found</strong>
                <p>
                  No learning elements match &ldquo;{search || family || section}&rdquo;. Try &ldquo;number
                  line&rdquo;, &ldquo;observation&rdquo;, or &ldquo;question&rdquo;.
                </p>
                <button type="button" className="curriculum-secondary curriculum-empty-btn" onClick={clear}>
                  <RotateCcw size={13} />
                  <span>Reset all filters ({CURRICULUM_BLOCKS.length} elements)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {layoutSource && <BlockLayoutDialog block={layoutSource} actionLabel="Add this block" onClose={() => setLayoutType(null)} onApply={preview => {
        useCurriculumUi.getState().rememberLayout(preview.curriculum!.type, preview.styleOverrides);
        insertCurriculumBlock(preview.curriculum!.type, preview.styleOverrides.layoutVariant as CurriculumLayout, grade, subject, preview);
        if (floating) close(false);
      }}/>}
    </section>
  );
}
