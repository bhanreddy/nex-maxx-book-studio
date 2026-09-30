import type { ChapterFramework, FrameworkStage } from "../../domain/educational/curriculum";
import { SIMPLE_ELEMENT_NAMES } from "./elementNames";

export const SIMPLE_CHAPTER_STAGES: { id: FrameworkStage; name: string; purpose: string }[] = [
  { id: "discover", name: "Start", purpose: "Introduce the chapter, recall what pupils know, and set learning goals." },
  { id: "learn", name: "Learn", purpose: "Explain ideas with pictures, clear examples, and new words." },
  { id: "build", name: "Practice", purpose: "Try questions with help, then work independently and explain answers." },
  { id: "apply", name: "Activities", purpose: "Use the learning through practical tasks, discussion, and projects." },
  { id: "reflect", name: "Review", purpose: "Summarise the chapter, review mistakes, and plan more practice." },
  { id: "master", name: "Test", purpose: "Check understanding with questions and a clear marking guide." },
];
const reviewTypes = new Set(["revision", "concept-review", "3-minute-recall", "chapter-snapshot", "concept-map"]);
export function simpleStage(stage: FrameworkStage, type?: string): FrameworkStage {
  if (stage === "target") return "discover";
  if (stage === "think") return "build";
  if (stage === "master" && type && reviewTypes.has(type)) return "reflect";
  return stage;
}
export function stageName(stage: FrameworkStage, type?: string): string {
  return SIMPLE_CHAPTER_STAGES.find(s => s.id === simpleStage(stage, type))?.name || "Learn";
}
export function simpleChapterPlan(source: ChapterFramework): ChapterFramework {
  if (source.planVersion === 2) return source;
  const f = structuredClone(source);
  const sections = SIMPLE_CHAPTER_STAGES.map(s => ({ id: f.sections.find(old => simpleStage(old.stage) === s.id)?.id || `plan-${s.id}-${Object.keys(f.blocks)[0] || "empty"}`, stage: s.id, title: s.name, blockIds: [] as string[] }));
  const seen = new Set<string>();
  for (const old of f.sections) for (const id of old.blockIds) {
    const b = f.blocks[id]; if (!b || seen.has(id)) continue;
    seen.add(id); const stage = simpleStage(old.stage, b.curriculum?.type);
    sections.find(s => s.stage === stage)!.blockIds.push(id);
    if (b.curriculum) b.curriculum.frameworkStage = stage;
  }
  // Keep valid orphaned sources instead of dropping an author's content during migration.
  for (const b of Object.values(f.blocks)) if (!seen.has(b.id)) {
    const stage = simpleStage(b.curriculum?.frameworkStage || "learn", b.curriculum?.type);
    sections.find(s => s.stage === stage)!.blockIds.push(b.id);
    if (b.curriculum) b.curriculum.frameworkStage = stage;
  }
  // Rename only known template titles; custom author text is preserved byte-for-byte.
  for (const b of Object.values(f.blocks)) {
    const type = b.curriculum?.type, name = type && SIMPLE_ELEMENT_NAMES[type];
    if (name && type) {
      const legacy = type.replaceAll("-", " ").toLowerCase();
      if (b.semanticContent.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === legacy) b.semanticContent.title = name;
    }
    if (b.curriculum && /^[A-Z]+ · CLASS [1-5]$/.test(b.semanticContent.unitBadge || ""))
      b.semanticContent.unitBadge = `${stageName(b.curriculum.frameworkStage).toUpperCase()} · ${b.semanticContent.unitBadge!.split(" · ")[1]}`;
  }
  return { ...f, planVersion: 2, sections };
}
