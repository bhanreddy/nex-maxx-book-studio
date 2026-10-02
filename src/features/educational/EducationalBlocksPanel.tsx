"use client";
import React, { useEffect, useMemo, useState, memo } from "react";
import { withSubjectExample } from "../../editor/educational/subjectExamples";
import { readPublicationImage } from "./PublicationInspector";
import { useUiStore } from "../../editor/stores/uiStore";
import { Search, Star, Plus, BookOpen, ArrowUpRight, Shapes, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { EDUCATIONAL_BLOCK_REGISTRY, createSmartBlockInstance } from "../../editor/educational/blockRegistry";
import { PUBLICATION_CATALOG } from "../../editor/educational/publicationCatalog";
import { COLLECTIONS, PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { ARTWORKS, artworkNodes, buildPublicationScene } from "../../editor/educational/publicationScene";
import { PUBLICATION_PAGES } from "../../editor/educational/publicationPages";
import { PublicationSceneView } from "../../editor/renderer/PublicationSceneView";
import type { GradeBand, SubjectDomain } from "../../domain/educational/blockSchema";
import type { EducationalBlockDefinition } from "../../domain/educational/blockSchema";

const cachedFilters = {
  tab: "blocks" as "blocks" | "pages" | "artwork",
  search: "",
  category: "all",
  family: "all",
  subject: "all",
  grade: "all",
  legacy: false,
  signature: false,
};

const BlockPreview = memo(function BlockPreview({ definition, subject }: { definition: EducationalBlockDefinition; subject: string }) {
  const scene = useMemo(() => {
    let block = createSmartBlockInstance(definition.id, "preview")!;
    if (subject !== "all" && definition.supportedSubjects.includes("general")) {
      block = withSubjectExample(block, subject as SubjectDomain);
    }
    block.transform.height = 0;
    return buildPublicationScene(block);
  }, [definition, subject]);
  return (
    <div className="publication-thumb" style={{ aspectRatio: `${scene.width} / ${Math.min(scene.height, 330)}` }}>
      <PublicationSceneView scene={scene} label={`${definition.name} preview`} />
    </div>
  );
});

export const EducationalBlocksPanel: React.FC = () => {
  const saved = useEditorStore((s) => s.publicationPresets);
  const insertSaved = useEditorStore((s) => s.insertPublicationPreset);
  const addPages = useEditorStore((s) => s.addPublicationPages);
  const demo = useEditorStore((s) => s.createPublicationDemo);
  const addArt = useEditorStore((s) => s.addPublicationArtwork);

  const [tab, setTab] = useState<"blocks" | "pages" | "artwork">(cachedFilters.tab);
  const [search, setSearch] = useState(cachedFilters.search);
  const [category, setCategory] = useState(cachedFilters.category);
  const [family, setFamily] = useState(cachedFilters.family);
  const [subject, setSubject] = useState(cachedFilters.subject);
  const [grade, setGrade] = useState(cachedFilters.grade);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [limit, setLimit] = useState(12);
  const [legacy, setLegacy] = useState(cachedFilters.legacy);
  const [signature, setSignature] = useState(cachedFilters.signature);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { cachedFilters.tab = tab; }, [tab]);
  useEffect(() => { cachedFilters.search = search; }, [search]);
  useEffect(() => { cachedFilters.category = category; }, [category]);
  useEffect(() => { cachedFilters.family = family; }, [family]);
  useEffect(() => { cachedFilters.subject = subject; }, [subject]);
  useEffect(() => { cachedFilters.grade = grade; }, [grade]);
  useEffect(() => { cachedFilters.legacy = legacy; }, [legacy]);
  useEffect(() => { cachedFilters.signature = signature; }, [signature]);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("nex-publication-favourites") || "[]");
      if (Array.isArray(v)) setFavorites(v.filter((x) => typeof x === "string"));
    } catch {}
  }, []);

  const filtered = useMemo(
    () =>
      Object.values(EDUCATIONAL_BLOCK_REGISTRY).filter(
        (b) =>
          (legacy || b.collectionVersion === 3) &&
          (!signature || b.tags.includes("signature")) &&
          (category === "all" || (category === "favorites" && favorites.includes(b.id)) || category === b.category) &&
          (family === "all" || b.family === family) &&
          (subject === "all" || b.supportedSubjects.includes(subject as SubjectDomain) || b.supportedSubjects.includes("general")) &&
          (grade === "all" || b.supportedGrades.includes(grade as GradeBand)) &&
          `${b.name} ${b.tags.join(" ")} ${b.category}`.toLowerCase().includes(search.toLowerCase())
      ),
    [search, category, family, subject, grade, legacy, favorites, signature]
  );

  const filteredSaved = useMemo(
    () =>
      Object.entries(saved).filter(
        ([, p]) => !search || `${p.name} ${p.block.presetId}`.toLowerCase().includes(search.toLowerCase())
      ),
    [saved, search]
  );

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (family !== "all" ? 1 : 0) +
    (subject !== "all" ? 1 : 0) +
    (grade !== "all" ? 1 : 0) +
    (legacy ? 1 : 0);

  const resetFilters = () => {
    setCategory("all");
    setFamily("all");
    setSubject("all");
    setGrade("all");
    setLegacy(false);
    setSearch("");
  };

  const toggle = (id: string) => {
    setFavorites((old) => {
      const next = old.includes(id) ? old.filter((x) => x !== id) : [...old, id];
      try {
        localStorage.setItem("nex-publication-favourites", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const insert = (id: string) => {
    useEditorStore.getState().addEducationalBlock(id, undefined, undefined, { subject, grade });
  };

  return (
    <div className="publication-panel flex flex-1 flex-col min-h-0 overflow-hidden">
      {/* 1. Compact Sticky Top Tabs */}
      <div className="flex px-3 pt-2 gap-1 border-b border-slate-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#0d121e]">
        {(["blocks", "pages", "artwork"] as const).map((t) => {
          const isActive = tab === t;
          const count =
            t === "blocks" ? filtered.length : t === "pages" ? PUBLICATION_PAGES.length : ARTWORKS.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-2 text-xs capitalize border-b-2 font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                isActive
                  ? "border-amber-600 text-amber-800 dark:border-amber-400 dark:text-amber-200"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <span>{t}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Compact Search & Filter Controls (Sticky, low-profile) */}
      {tab === "blocks" && (
        <div className="shrink-0 p-2.5 space-y-2 border-b border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search size={13} className="absolute top-2 left-2.5 text-slate-400" />
              <input
                aria-label="Search educational templates"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(12);
                }}
                placeholder="Search templates, warm-up…"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1.5 right-1.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Drawer Toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`h-7 px-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                filtersOpen || activeFilterCount > 0
                  ? "bg-amber-100/80 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-200 font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
              title="Show filter dropdowns"
            >
              <SlidersHorizontal size={12} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Reset button when filters are active */}
            {(activeFilterCount > 0 || search || signature) && (
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setSignature(false);
                }}
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Quick Segmented Toggle (All vs Signature) */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex p-0.5 bg-slate-200/70 dark:bg-white/10 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                aria-pressed={!signature}
                onClick={() => {
                  setSignature(false);
                  setLimit(12);
                }}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  !signature
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All layouts
              </button>
              <button
                type="button"
                aria-pressed={signature}
                onClick={() => {
                  setSignature(true);
                  setLimit(12);
                }}
                className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  signature
                    ? "bg-amber-500 text-white shadow-xs font-semibold"
                    : "text-amber-700 dark:text-amber-400 hover:text-amber-800"
                }`}
              >
                <span>✦ Signature</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {filtered.length} layouts
            </span>
          </div>

          {/* Expandable Filter Tray */}
          {filtersOpen && (
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2 animate-fadeIn">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Purpose</label>
                  <select
                    aria-label="Teaching purpose"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setLimit(12);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="all">All purposes</option>
                    <option value="favorites">★ Favourites</option>
                    <option value="saved">My templates</option>
                    {PUBLICATION_CATALOG.map(([id, title]) => (
                      <option value={id} key={id}>{title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Collection</label>
                  <select
                    aria-label="Design collection"
                    value={family}
                    onChange={(e) => {
                      setFamily(e.target.value);
                      setLimit(12);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="all">All collections</option>
                    {Object.entries(COLLECTIONS).map(([id, c]) => (
                      <option key={id} value={id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Subject</label>
                  <select
                    aria-label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="all">Any subject</option>
                    {["mathematics", "science", "english", "social-studies", "environmental", "computer-science", "early-learning", "general"].map((v) => (
                      <option key={v} value={v}>
                        {v === "general" ? "Art, music & general" : v.replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Grade</label>
                  <select
                    aria-label="Grade band"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-md px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="all">Any grade</option>
                    <option value="early-years">Early years</option>
                    <option value="primary-lower">Grades 1–2</option>
                    <option value="primary-upper">Grades 3–5</option>
                    <option value="middle-school">Grades 6–8</option>
                    <option value="secondary-plus">Grades 9+</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[10px] text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={legacy}
                    onChange={(e) => setLegacy(e.target.checked)}
                    className="rounded border-slate-300 dark:border-white/20 text-amber-600"
                  />
                  <span>Include earlier layouts</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="text-amber-700 dark:text-amber-300 font-semibold hover:underline"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Main Scrollable Catalog Area */}
      {tab === "blocks" && (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
          {/* Hero Branding — inside scroll area so it scrolls away naturally when browsing! */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-[9px] uppercase tracking-[.18em] font-bold">
              <span className="w-3.5 h-px bg-amber-600/60 dark:bg-amber-300/60" />
              THE SIGNATURE COLLECTION
            </div>
            <h2 className="text-base text-slate-900 dark:text-white font-bold tracking-tight mt-0.5">
              Little minds. Big ideas.
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
              Beautiful pages for every subject. Made to explore. Made to make your own.
            </p>
          </div>

          {category === "saved" && !Object.keys(saved).length && (
            <p className="p-4 text-xs text-slate-600 dark:text-slate-400">
              Your reusable designs will appear here. Select any designed block on the canvas, then choose &ldquo;Save as a reusable template&rdquo; in the inspector.
            </p>
          )}

          {category === "saved" && Object.keys(saved).length > 0 && !filteredSaved.length && (
            <p className="p-4 text-xs text-slate-600 dark:text-slate-400">No saved templates match your search.</p>
          )}

          {category === "saved" &&
            filteredSaved.map(([id, p]) => (
              <button key={id} onClick={() => insertSaved(id)} className="publication-library-card w-full text-left">
                <div className="publication-thumb" style={{ height: 160 }}>
                  <PublicationSceneView scene={buildPublicationScene(p.block)} label={p.name} />
                </div>
                <div className="p-3 text-xs text-slate-900 dark:text-white">{p.name} · Insert saved template</div>
              </button>
            ))}

          {category !== "saved" &&
            filtered.slice(0, limit).map((b) => (
              <article
                key={b.id}
                className="publication-library-card"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-nexmaxx-block-id", b.id);
                  e.dataTransfer.setData(
                    "application/x-nexmaxx-block-payload",
                    JSON.stringify({ id: b.id, subject, grade })
                  );
                }}
              >
                <button className="block w-full text-left" onClick={() => insert(b.id)} aria-label={`Insert ${b.name}`}>
                  <BlockPreview definition={b} subject={subject} />
                  <div className="px-3 pt-2">
                    <div className="text-[9px] uppercase tracking-[.12em] text-amber-700 dark:text-amber-200/80 font-semibold">
                      {COLLECTIONS[b.family]?.name}
                      {b.tags.includes("signature") ? " · Signature" : b.collectionVersion === 3 ? " · Atelier" : ""}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">{b.name}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      {PUBLICATION_CATALOG.find(([id]) => id === b.category)?.[1] || b.category}
                    </div>
                    {b.description && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-500 mt-1 leading-snug">
                        {b.description}
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex justify-between items-center px-3 pb-2 pt-1">
                  <button
                    onClick={() => insert(b.id)}
                    className="text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white flex items-center gap-1 min-h-8 font-medium cursor-pointer"
                  >
                    <Plus size={12} />
                    Insert or drag onto page
                  </button>
                  <button
                    onClick={() => toggle(b.id)}
                    aria-label={`${favorites.includes(b.id) ? "Unfavourite" : "Favourite"} ${b.name}`}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 ${
                      favorites.includes(b.id)
                        ? "text-amber-500 dark:text-amber-300"
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Star size={14} fill={favorites.includes(b.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </article>
            ))}

          {!filtered.length && category !== "saved" && (
            <div className="text-center py-8 px-4 text-slate-500 dark:text-slate-400">
              <p className="text-xs font-medium">No matching layouts found.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 underline font-semibold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {category !== "saved" && filtered.length > limit && (
            <button className="publication-button w-full" onClick={() => setLimit((n) => n + 12)}>
              Show 12 more layouts
            </button>
          )}
        </div>
      )}

      {/* Pages Tab */}
      {tab === "pages" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <button onClick={demo} className="publication-demo w-full text-left">
            <BookOpen size={20} />
            <strong className="block text-sm mt-3">Explore the sample book</strong>
            <span className="block text-xs mt-1 opacity-80">
              Large Numbers, plus science and reading examples. Creates a separate book.
            </span>
            <span className="mt-4 flex gap-2 items-center text-xs font-semibold">
              Create editable sample <ArrowUpRight size={14} />
            </span>
          </button>
          {PUBLICATION_PAGES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => addPages(p.id)}
              className="publication-library-card w-full p-3 text-left"
            >
              <span className="text-amber-700 dark:text-amber-200 text-[10px] tracking-wider font-semibold">
                {String(i + 1).padStart(2, "0")} / PAGE COLLECTION
              </span>
              <strong className="block text-sm mt-1 text-slate-900 dark:text-white">{p.name}</strong>
              <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1">{p.description}</span>
              <span className="flex gap-1 mt-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <Plus size={12} />
                Add new pages
              </span>
            </button>
          ))}
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Pages append to your book. Long layouts continue on a new page; existing pages stay intact.
          </p>
        </div>
      )}

      {/* Artwork Tab */}
      {tab === "artwork" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Original vector artwork. Drag it onto the page, then resize, recolour or set it as a locked background.
          </p>
          <label className="publication-button block text-center cursor-pointer">
            Upload a background image
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const asset = await readPublicationImage(file);
                  const st = useEditorStore.getState(),
                    page = st.getActivePage();
                  if (!page) return;
                  st.insertPublicationElement({
                    id: crypto.randomUUID(),
                    pageId: page.id,
                    type: "image",
                    category: "media",
                    version: 2,
                    displayName: file.name,
                    locked: false,
                    hidden: false,
                    style: { objectFit: "cover" },
                    transform: {
                      x: 42,
                      y: 36,
                      width: 240,
                      height: 180,
                      rotation: 0,
                      zIndex: Math.max(0, ...st.getActivePageElements().map((el) => el.transform.zIndex)) + 1,
                    },
                    content: {
                      ...asset,
                      alt: file.name,
                      focalX: 0.5,
                      focalY: 0.5,
                      cropScale: 1,
                      scope: "free",
                      provenance: "User supplied",
                    },
                  });
                } catch (err) {
                  useUiStore.getState().showToast({
                    type: "error",
                    title: "Image not added",
                    message: String(err),
                  });
                }
                e.target.value = "";
              }}
            />
          </label>
          {ARTWORKS.map((a) => (
            <button
              key={a.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("application/x-nexmaxx-artwork", a.id)}
              onClick={() => addArt(a.id)}
              className="publication-library-card w-full text-left"
            >
              <div className="h-28 p-3 bg-[#f5f3ff]">
                <PublicationSceneView
                  scene={{
                    width: 240,
                    height: 110,
                    variant: a.id,
                    warnings: [],
                    nodes: artworkNodes(a.id, 40, 0, 160, 110, PUBLICATION_PALETTES.indigo),
                  }}
                  label={a.name}
                />
              </div>
              <div className="p-3">
                <strong className="text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <Shapes size={13} />
                  {a.name}
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{a.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
