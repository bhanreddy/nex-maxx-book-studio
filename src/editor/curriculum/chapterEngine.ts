import {curriculumGradeRank,curriculumGradeLabel} from "../../domain/educational/curriculum";
import type { Book, Chapter, PageDefinition } from "../../domain/book/types";
import type { PageElement } from "../../domain/element/types";
import type { SmartBlockInstance, SubjectDomain } from "../../domain/educational/blockSchema";
import type { ChapterBuilderConfig, ChapterFramework, CurriculumLayout, ContentDensity } from "../../domain/educational/curriculum";
import { chapterPalette, PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { createSmartBlockInstance } from "../educational/blockRegistry";
import { buildPublicationScene } from "../educational/publicationScene";
import { CHAPTER_PRESETS, CURRICULUM_BLOCK_MAP, FRAMEWORK_STAGES } from "./catalog";
import { simpleChapterPlan, stageName } from "./frameworkPlan";
import { sceneWindows } from "./pagination";

export const DEFAULT_CHAPTER_CONFIG: ChapterBuilderConfig = {
  grade: 3, subject: "Science", title: "The world of plants", unit: "Living things", theme: "Notice. Explore. Grow.",
  pageCount: 12, learningOutcomes: ["Identify the main parts of a plant.", "Describe what plants need to grow.", "Observe and record changes in a growing plant."],
  concepts: ["Parts of a plant", "What plants need", "Plants around us"], personality: "illustrated", complexity: "premium", preset: "premium-nex",
};
export const CURRICULUM_SUBJECTS = ["Maths", "English", "EVS", "Science", "Social Studies", "History", "Geography", "Telugu", "Hindi", "Computer", "Art", "Music", "GK", "Custom"];
export const PERSONALITIES = ["Playful", "Bright Academic", "Modern Editorial", "Illustrated", "Minimal Premium", "Nature", "Science Explorer", "Mathematical", "Storybook", "Custom"] as const;
export function subjectDomain(subject: string): SubjectDomain {
  if (/math/i.test(subject)) return "mathematics";
  if (/science/i.test(subject)) return "science";
  if (/english|telugu|hindi/i.test(subject)) return "english";
  if (/evs|environment/i.test(subject)) return "environmental";
  if (/social|history|geography/i.test(subject)) return "social-studies";
  if (/computer/i.test(subject)) return "computer-science";
  return "general";
}
export function makeCurriculumBlock(type: string, config: ChapterBuilderConfig, chapterId?: string, concept?: string): SmartBlockInstance {
  const def = CURRICULUM_BLOCK_MAP[type];
  if (!def) throw new Error(`Unknown curriculum block: ${type}`);
  const block = createSmartBlockInstance(`curriculum-${type}`, "uncomposed")!;
  block.id = crypto.randomUUID();
  block.subject = subjectDomain(config.subject); block.gradeBand = curriculumGradeRank(config.grade) < 1 ? "early-years" : curriculumGradeRank(config.grade) < 3 ? "primary-lower" : "primary-upper";
  block.family = /editorial|premium|storybook/.test(config.personality) ? "nex-editorial" : /nature|science/.test(config.personality) ? "nex-discovery" : "nex-spectrum";
  block.curriculum = { ...block.curriculum!, grade: config.grade, subjectLabel: config.subject, chapterId,
    learningOutcomeIds: config.learningOutcomes.map((_, i) => `outcome-${i + 1}`), hierarchy: type === "chapter-hero" ? "primary" : "secondary",
    difficulty: def.originalStage === "think" ? "think" : def.stage === "master" ? "challenge" : "build",
    assessmentMetadata: def.archetype === "assessment-mastery" ? { competency: concept || config.title, formative: true } : undefined,
    digitalExtension: def.category === "digital" ? { url: "", contentType: type === "listen" ? "Audio" : "Interactive", duration: "2 minutes", cta: "Scan & explore", icon: "play" } : undefined,
    pageRules: { keepTogether: true, startOnNewPage: type === "chapter-hero" },
  };
  block.styleOverrides = { blockStyle: /minimal|editorial/.test(config.personality) || curriculumGradeRank(config.grade) >= 4 ? "calm" : config.personality === "storybook" ? "storybook" : "colourful", paletteId: chapterPalette(config.subject, config.personality), layoutVariant: def.layouts[0],
    customPalette: config.personality === "custom" && config.brandAccent ? { primary: config.brandAccent } : undefined };
  if (type === "hands-on" && /english|hindi|telugu/i.test(config.subject)) {
    block.styleOverrides.layoutVariant = def.layouts.find(layout => layout === "conversation" || layout === "guided-steps") || def.layouts[1] || def.layouts[0];
  }
  const c = block.semanticContent;
  c.unitBadge = `${stageName(def.stage).toUpperCase()} · ${curriculumGradeLabel(config.grade).toUpperCase()}`;
  if (type === "chapter-hero") {
    c.title = config.title; c.subtitle = config.theme || "A new idea. A new adventure.";
    c.introText = `Explore ${config.concepts[0] || config.title}. What do you already know?`;
  } else if (def.originalStage === "target" && def.archetype !== "vocabulary") {
    c.items = config.learningOutcomes.length ? [...config.learningOutcomes] : ["Add what learners will know.", "Add what learners will be able to do."];
  } else if (type === "concept-explorer" || type === "concept-introduction" || type === "visual-explanation") {
    c.title = concept || config.concepts[0] || config.title;
    c.introText = `Explain ${c.title.toLowerCase()} in one simple sentence. Add an example that a ${curriculumGradeLabel(config.grade)} learner can recognise.`;
    c.calloutText = "Write the key idea learners should remember.";
    c.items = curriculumGradeRank(config.grade) < 3 ? ["Show the idea with a picture, an object or an action."] : ["Add a clear example.", "Explain how the example connects to the key idea."];
  } else if (type === "chapter-snapshot") {
    c.calloutText = config.title;
    c.items = config.concepts.length ? config.concepts.map(s => `${s}: add one key takeaway.`) : ["Add the key idea.", "Add a useful example."];
    c.introText = "Connect the big ideas from this chapter.";
  } else if (def.originalStage === "reflect") {
    c.items = config.learningOutcomes.length ? config.learningOutcomes.map(s => `I can: ${s}`) : c.items;
  } else if (def.stage === "apply" && !def.isNew) {
    c.title = `${def.name} · ${concept || config.title}`;
    c.introText = `Objective: use ${concept || config.title.toLowerCase()} in a practical task.`;
    if (/math/i.test(config.subject)) { c.materials = ["Counters or small objects", "Paper and pencil"]; }
    else if (/english|hindi|telugu/i.test(config.subject)) { c.materials = ["A short text or picture prompt", "Paper and pencil"]; }
    else if (/science|evs/i.test(config.subject)) { c.materials = ["Add safe observation materials", "A recording sheet"]; }
  }
  if (curriculumGradeRank(config.grade) < 1) {
    const idea = concept || config.concepts[0] || config.title;
    const foundation = {title: type === "chapter-hero" ? config.title : `${def.name} · ${idea}`, unitBadge: c.unitBadge,
      introText: "Listen, look and try with your teacher.", items: ["Point to a picture or object.", "Say, gesture or show what you notice."]};
    block.semanticContent = foundation;
    if (type === "chapter-hero") block.semanticContent.subtitle = config.theme;
    if (def.stage === "learn") block.semanticContent.introText = `Look at ${idea.toLowerCase()} together. Name what you see.`;
    if (def.stage === "build" || def.stage === "apply") {
      block.semanticContent.materials = ["Large classroom objects or picture cards", "Teacher supervision"];
      block.semanticContent.steps = [{stepNumber: 1, title: "Watch", body: "Your teacher shows one example."}, {stepNumber: 2, title: "Try", body: "Point, match or sort with a partner."}];
    }
    if (def.stage === "master") {
      block.semanticContent.title = "Show what you can do";
      block.semanticContent.questions = [{prompt: `Point, name or show one example of ${idea.toLowerCase()}.`, options: [], answer: "Teacher observes independently / with support / not yet. Accept speech, gesture or demonstration.", points: 0}];
    }
    if (def.stage === "reflect") block.semanticContent.items = ["Show one thing you enjoyed.", "Try it again together."];
  }
  if (curriculumGradeRank(config.grade) < 3 && c.questions) c.questions = c.questions.slice(0, 1);
  return block;
}
export function generateFramework(raw: ChapterBuilderConfig, chapterId: string): ChapterFramework {
  const config = { ...raw, title: raw.title.trim(), pageCount: Math.max(1, Math.min(100, Math.round(raw.pageCount))),
    learningOutcomes: raw.learningOutcomes.filter(s => s.trim()), concepts: raw.concepts.filter(s => s.trim()) };
  if (!config.title) throw new Error("Enter a chapter name.");
  const preset = CHAPTER_PRESETS.find(p => p.id === config.preset) || CHAPTER_PRESETS[4];
  const foundation = curriculumGradeRank(config.grade) < 1;
  let types = foundation ? ["chapter-hero", "picture-prompt", "learning-mission", "concept-explorer", "try-with-me", "hands-on", "chapter-snapshot", "mastery-check", "my-learning"] : [...preset.blocks];
  if (config.complexity === "compact") types = types.filter((type, i) => !["recall-radar", "visual-explanation", "scan-learn", "quick-check"].includes(type) && (type !== "concept-explorer" || i === types.indexOf(type)));
  if (config.complexity === "rich" || config.complexity === "premium") {
    types.splice(types.indexOf("hands-on"), 0, "vocabulary");
  }
  const subject = config.subject.toLowerCase();
  const subjectElements = foundation ? ["picture-prompt", "hands-on", "try-with-me"] : /math/.test(subject) ? ["number-line", "place-value-table", "word-problem", "shape-sort", "fraction-practice", "measurement-table"]
    : /english|hindi|telugu|language/.test(subject) ? ["reading-passage", "reading-questions", "word-meanings", "sentence-builder", "story-planner", "word-review"]
    : /science|evs|environment/.test(subject) ? ["observation-sheet", "science-drawing", "experiment-plan", "experiment-results", "nature-diary", "safety-rules"]
    : /social|history|geography/.test(subject) ? ["map-activity", "compare-two-ideas", "fact-table", "survey-results", "discussion-questions", "presentation-plan"]
    : /computer|coding/.test(subject) ? ["step-chart", "research-task", "project-plan", "safety-rules", "presentation-plan", "skill-review"]
    : ["chapter-overview", "compare-two-ideas", "project-plan", "research-task", "fact-table", "review-checklist"];
  const extraCount = { compact: 2, standard: 3, rich: 5, premium: 6 }[config.complexity];
  const extras = [...subjectElements.slice(0, extraCount), "review-checklist", ...(foundation ? [] : ["exit-question"])];
  extras.forEach(type => { if (!types.includes(type)) types.push(type); });
  // All six sections are populated, including a distinct review before the test.
  const mandatory = ["chapter-hero", "concept-explorer", "try-with-me", "hands-on", "review-checklist", "mastery-check"];
  mandatory.forEach(type => { if (!types.some(t => CURRICULUM_BLOCK_MAP[t].stage === CURRICULUM_BLOCK_MAP[type].stage)) types.push(type); });
  const conceptCount = types.filter(t => t === "concept-explorer").length;
  if (config.concepts.length > conceptCount) types.splice(types.lastIndexOf("concept-explorer") + 1, 0, ...Array(config.concepts.length - conceptCount).fill("concept-explorer"));
  // Requested pages always have meaningful content, never empty filler pages.
  while (types.length < config.pageCount) types.splice(types.lastIndexOf("mastery-check"), 0, "mini-practice");
  const sections = FRAMEWORK_STAGES.map(stage => ({ id: crypto.randomUUID(), stage: stage.id, title: stage.name, blockIds: [] as string[] }));
  const blocks: Record<string, SmartBlockInstance> = {};
  let concept = 0;
  for (const type of types) {
    const block = makeCurriculumBlock(type, config, chapterId, type === "concept-explorer" ? config.concepts[concept++ % Math.max(1, config.concepts.length)] : undefined);
    blocks[block.id] = block;
    sections.find(s => s.stage === block.curriculum!.frameworkStage)!.blockIds.push(block.id);
  }
  return { version: 1, planVersion: 2, config, mode: "easy", sections, blocks, compositionRevision: 0 };
}
export function orderedBlocks(framework: ChapterFramework): SmartBlockInstance[] {
  return framework.sections.flatMap(s => s.blockIds.map(id => framework.blocks[id]).filter(Boolean));
}
export function changeBlockLayout(block: SmartBlockInstance, layout: CurriculumLayout): SmartBlockInstance {
  const def = CURRICULUM_BLOCK_MAP[block.curriculum!.type];
  if (!def.layouts.includes(layout)) throw new Error("This layout is not compatible with the selected block.");
  return { ...block, styleOverrides: { ...block.styleOverrides, sceneSlice: undefined, layoutVariant: layout }, transform: { ...block.transform, height: 0 } };
}
export function convertCurriculumBlock(block: SmartBlockInstance, type: string): SmartBlockInstance {
  const def = CURRICULUM_BLOCK_MAP[type];
  if (!def) throw new Error("Unknown block type.");
  return { ...block, presetId: `curriculum-${type}`, archetypeId: def.archetype,
    curriculum: { ...block.curriculum!, type, frameworkStage: def.stage },
    styleOverrides: { ...block.styleOverrides, layoutVariant: def.layouts[0], sceneSlice: undefined } };
}
export interface CompositionResult { book: Book; chapter: Chapter; elements: Record<string, PageElement>; pages: PageDefinition[]; minimumPages: number }
/** Recompose only this chapter; stable native IDs and unrelated book objects survive. */
export function composeChapter(book: Book, chapter: Chapter, allElements: Record<string, PageElement>, vary = false): CompositionResult {
  if (!chapter.framework) throw new Error("This chapter has no framework.");
  const plan = simpleChapterPlan(chapter.framework);
  const framework: ChapterFramework = { ...plan, blocks: { ...plan.blocks }, compositionRevision: plan.compositionRevision + 1 };
  const oldPages = book.pages.filter(p => p.chapterId === chapter.id || chapter.pageIds.includes(p.id));
  const isProjection = (el: PageElement | undefined) => el?.smartBlockData?.curriculum?.chapterId === chapter.id || el?.content.curriculumDecoration === chapter.id;
  const elements = { ...allElements };
  oldPages.forEach(p => p.elementIds.forEach(id => { if (isProjection(elements[id])) delete elements[id]; }));
  oldPages.forEach(p => p.elementIds.forEach(id => {
    const source = elements[id]?.content.curriculumBlockId;
    if (source && !framework.blocks[source]) delete elements[id];
  }));
  // Free artwork, detached primitives and designer-added objects keep their page and position.
  const retained = oldPages.map(p => ({ ...p, elementIds: p.elementIds.filter(id => elements[id]) })).filter(p => p.elementIds.length);
  const reusable = oldPages.filter(p => !retained.some(r => r.id === p.id));
  const width = book.dimensions.widthPt - book.margins.insidePt - book.margins.outsidePt;
  const available = book.dimensions.heightPt - book.margins.topPt - book.margins.bottomPt;
  if (width < 180) throw new Error("Page margins leave too little width for a curriculum block.");
  const sources = orderedBlocks(framework).filter(b => !b.isDetached);
  const pieces: { block: SmartBlockInstance; window: { from: number; to: number }; height: number; index: number }[] = [];
  const recent: string[] = [];
  sources.forEach((source, index) => {
    const def = CURRICULUM_BLOCK_MAP[source.curriculum!.type];
    let block: SmartBlockInstance = { ...source, transform: { ...source.transform, width, height: 0 }, styleOverrides: { ...source.styleOverrides, sceneSlice: undefined } };
    if (vary || (framework.compositionRevision === 1 && source.curriculum!.type !== "chapter-hero")) {
      const layouts = def.layouts.filter(l => l !== recent[recent.length - 1]);
      block = changeBlockLayout(block, layouts[index % layouts.length] || def.layouts[0]);
    }
    recent.push(block.styleOverrides.layoutVariant || def.layouts[0]);
    block.semanticContent = { ...block.semanticContent, ...(source.curriculum!.type === "chapter-hero" ? { chapterNumber: String(chapter.number).padStart(2, "0") } : {}) };
    const scene = buildPublicationScene(block);
    block.transform.height = scene.height;
    framework.blocks[block.id] = block;
    sceneWindows(scene, available).forEach((window, i) => pieces.push({ block, window, height: window.to - window.from, index: i }));
  });
  const pages: PageDefinition[] = [];
  let page: PageDefinition | undefined, y = book.margins.topPt;
  const newPage = () => {
    page = { ...reusable[pages.length], id: reusable[pages.length]?.id || crypto.randomUUID(), pageIndex: pages.length,
      displayNumber: String(pages.length + 1), chapterId: chapter.id, unitId: chapter.unitId, status: "Design", layoutMode: "adaptive", templateId: "curriculum-framework", elementIds: [] };
    pages.push(page); y = book.margins.topPt;
  };
  const target = Math.min(pieces.length, Math.max(1, framework.config.pageCount - retained.length));
  let remainingWeight = pieces.reduce((sum, p) => sum + p.height + 18, 0);
  pieces.forEach((piece, i) => {
    const remainingPages = Math.max(1, target - pages.length + 1);
    const ideal = remainingWeight / remainingPages;
    const filled = y - book.margins.topPt;
    if (!page || (page.elementIds.length && (y + piece.height > book.dimensions.heightPt - book.margins.bottomPt || piece.index > 0 ||
      piece.block.curriculum?.pageRules.startOnNewPage || (pieces[i - 1]?.block.curriculum?.type === "chapter-hero") ||
      pieces.length - i === target - pages.length || (filled >= ideal && pieces.length - i >= target - pages.length)))) newPage();
    const pageId = page!.id;
    if (!piece.index && piece.block.curriculum?.type === "chapter-hero") {
      const backgroundId = `${piece.block.id}::background`;
      elements[backgroundId] = { id: backgroundId, pageId, type: "shape", category: "decorative", version: 4, displayName: "Chapter hero · full-bleed paper", locked: true, hidden: false,
        transform: { x: 0, y: 0, width: book.dimensions.widthPt, height: book.dimensions.heightPt, rotation: 0, zIndex: 0 },
        style: { shapeType: "rectangle", backgroundColor: PUBLICATION_PALETTES[piece.block.styleOverrides.paletteId as keyof typeof PUBLICATION_PALETTES]?.surface || "#F5F3FF" }, content: { curriculumDecoration: chapter.id } };
      page!.elementIds.push(backgroundId);
    }
    const id = piece.index ? `${piece.block.id}::${piece.index}` : piece.block.id;
    const slice = piece.window.from > 0 || piece.window.to < piece.block.transform.height ? piece.window : undefined;
    const transform = { ...piece.block.transform, x: book.margins.insidePt, y, width, height: piece.height, zIndex: page!.elementIds.length + 1 };
    const block = { ...piece.block, pageId, transform, curriculum: { ...piece.block.curriculum!, sourceBlockId: piece.block.id },
      isLockedDesign: framework.mode === "easy", styleOverrides: { ...piece.block.styleOverrides, sceneSlice: slice } };
    elements[id] = { id, pageId, type: "smart-block", category: "educational", version: 4,
      displayName: `${piece.block.semanticContent.title}${piece.index ? " · continued" : ""}`, locked: Boolean(piece.block.curriculum?.locked), hidden: Boolean(piece.block.curriculum?.hidden), content: {}, style: {}, transform, smartBlockData: block, presetId: block.presetId };
    page!.elementIds.push(id); y += piece.height + 18; remainingWeight -= piece.height + 18;
    if (!piece.index) framework.blocks[piece.block.id] = { ...piece.block, pageId, transform: { ...transform, height: piece.block.transform.height } };
  });
  const retainedIds = new Set(retained.map(p => p.id)), composedIds = new Set(pages.map(p => p.id));
  const chapterPages = oldPages.flatMap(p => retainedIds.has(p.id) ? [retained.find(r => r.id === p.id)!] : composedIds.has(p.id) ? [pages.find(r => r.id === p.id)!] : []);
  chapterPages.push(...pages.filter(p => !oldPages.some(old => old.id === p.id)));
  const nextChapter = { ...chapter, pageIds: chapterPages.map(p => p.id), framework };
  const first = book.pages.findIndex(p => oldPages.some(old => old.id === p.id));
  const other = book.pages.filter(p => !oldPages.some(old => old.id === p.id));
  const insertion = first < 0 ? other.length : Math.min(first, other.length);
  other.splice(insertion, 0, ...chapterPages);
  const nextBook = { ...book, chapters: book.chapters.map(c => c.id === chapter.id ? nextChapter : c),
    pages: other.map((p, i) => p.pageIndex === i && p.displayNumber === String(i + 1) ? p : { ...p, pageIndex: i, displayNumber: String(i + 1) }), updatedAt: new Date().toISOString() };
  return { book: nextBook, chapter: nextChapter, elements, pages: chapterPages, minimumPages: chapterPages.length };
}
export function pageDensity(page: PageDefinition, elements: Record<string, PageElement>, book: Pick<Book, "dimensions" | "margins">): { label: ContentDensity; ratio: number; words: number } {
  const area = (book.dimensions.widthPt - book.margins.insidePt - book.margins.outsidePt) * (book.dimensions.heightPt - book.margins.topPt - book.margins.bottomPt);
  const content = page.elementIds.map(id => elements[id]).filter(el => el && !el.hidden && el.category !== "decorative");
  const ratio = content.reduce((sum, el) => sum + el.transform.width * el.transform.height, 0) / Math.max(1, area);
  const words = content.reduce((sum, el) => sum + (el.smartBlockData ? buildPublicationScene({ ...el.smartBlockData, transform: el.transform }).nodes.filter(n => n.kind === "text").map(n => n.kind === "text" ? n.text : "").join(" ") : el.content.text || "").split(/\s+/).filter(Boolean).length, 0);
  const overflow = content.some(el => el.transform.y + el.transform.height > book.dimensions.heightPt - book.margins.bottomPt + .5);
  const grade = content.find(el => el.smartBlockData?.curriculum)?.smartBlockData?.curriculum?.grade || 3;
  const denseWords = curriculumGradeRank(grade) < 1 ? 65 : curriculumGradeRank(grade) < 3 ? 130 : grade === 3 ? 240 : 330;
  return { label: overflow || ratio > 1.02 || words > denseWords * 1.4 ? "Overloaded" : ratio > .88 || words > denseWords ? "Dense" : ratio < .38 ? "Light" : "Balanced", ratio, words };
}
export function rhythmScore(pages: PageDefinition[], elements: Record<string, PageElement>): number {
  const layouts = pages.map(p => p.elementIds.map(id => elements[id]?.smartBlockData?.styleOverrides.layoutVariant).filter(Boolean).join("+"));
  if (layouts.length < 2) return 0;
  return layouts.slice(1).filter((layout, i) => layout && layout === layouts[i]).length / (layouts.length - 1);
}
