import type { SmartBlockInstance, ReferenceElementKind, ReferenceIcon } from "../../domain/educational/blockSchema";

export const REFERENCE_ELEMENTS: { kind: ReferenceElementKind; name: string; type: string; icon: ReferenceIcon; skill?: string }[] = [
  { kind: "exercise", name: "Exercise", type: "chapter-exercise", icon: "none" },
  { kind: "mental", name: "Mental practice", type: "mini-practice", icon: "bulb", skill: "Problem Solving" },
  { kind: "quick-check", name: "Quick Check", type: "quick-check", icon: "check" },
  { kind: "activity", name: "Activity", type: "hands-on", icon: "target", skill: "Experiential Learning" },
  { kind: "example", name: "Example · capsule", type: "worked-example", icon: "book" },
  { kind: "puzzle", name: "Games & Puzzles", type: "puzzle", icon: "puzzle", skill: "Critical Thinking" },
  { kind: "hots", name: "HOTS", type: "hots-challenge", icon: "bulb", skill: "Flexibility and Adaptability" },
  { kind: "refresh", name: "Time to Refresh", type: "revision", icon: "book" },
  { kind: "dive-in", name: "Let’s Dive In!", type: "chapter-spark", icon: "globe" },
  { kind: "example-arrow", name: "Example · arrow", type: "worked-example", icon: "leaf" },
];

/** Presentation changes never rewrite subject content, questions, answers or source IDs. */
export function referenceKindFor(block: SmartBlockInstance): ReferenceElementKind | undefined {
  const type = block.curriculum?.type || block.archetypeId;
  if (["lesson-schema", "study-skills", "learning-outcomes", "learning-mission"].includes(type)) return;
  if (type === "mini-practice") return "mental";
  if (type === "revision") return "refresh";
  if (type === "hands-on") return "activity";
  if (type === "chapter-spark") return "dive-in";
  if (/example|try-with-me|solve/.test(type)) return "example";
  if (/puzzle|mystery|logic/.test(type)) return "puzzle";
  if (/hots|think|reason|challenge|why|infer|analyse/.test(type)) return "hots";
  if (/quick-check|checkpoint/.test(type)) return "quick-check";
  if (/exercise|practice|assessment|test|mastery|fill|choose|match/.test(type)) return "exercise";
  if (block.curriculum?.frameworkStage === "apply") return "activity";
  if (block.curriculum?.frameworkStage === "reflect") return "refresh";
  if (block.curriculum?.frameworkStage === "discover") return "dive-in";
  return "example-arrow";
}

export function withReferenceElements(block: SmartBlockInstance): SmartBlockInstance {
  const kind = block.styleOverrides.referenceElement?.kind || referenceKindFor(block);
  if (!kind || block.isDetached) return block;
  const preset = REFERENCE_ELEMENTS.find(item => item.kind === kind)!;
  return { ...block, styleOverrides: { ...block.styleOverrides, sceneSlice: undefined,
    referenceElement: { ...block.styleOverrides.referenceElement, kind, icon: block.styleOverrides.referenceElement?.icon || preset.icon, showBody: true } } };
}
