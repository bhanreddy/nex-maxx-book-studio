import type { SmartBlockInstance, ReferenceElementKind, ReferenceIcon } from "../../domain/educational/blockSchema";

export type PremiumBannerLayout = "folio" | "nocturne" | "checkpoint" | "studio" | "orbit" | "flag";
export interface ReferenceElementDefinition {
  kind: ReferenceElementKind; name: string; type: string; icon: ReferenceIcon; skill?: string;
  premium?: { layout: PremiumBannerLayout; title: string; eyebrow: string; description: string };
}
export const REFERENCE_ELEMENTS: ReferenceElementDefinition[] = [
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
  { kind: "premium-exercise", name: "Exercise · Folio", type: "chapter-exercise", icon: "none", skill: "Practise with purpose", premium: { layout: "folio", title: "EXERCISE", eyebrow: "THE PRACTICE COLLECTION", description: "A serif masthead, tailored corner folds and an editable exercise number." } },
  { kind: "premium-mental", name: "Mental Lab · Nocturne", type: "mini-practice", icon: "bulb", skill: "Reason · Solve · Explain", premium: { layout: "nocturne", title: "MENTAL LAB", eyebrow: "A LITTLE THINKING. A BIG IDEA.", description: "Deep ink, a luminous idea badge and a confident learning prompt." } },
  { kind: "premium-check", name: "Quick Check · Seal", type: "quick-check", icon: "check", skill: "Pause · Check · Progress", premium: { layout: "checkpoint", title: "QUICK CHECK", eyebrow: "YOUR LEARNING CHECKPOINT", description: "An embossed check seal and a precise double-frame border." } },
  { kind: "premium-activity", name: "Activity · Workshop", type: "hands-on", icon: "target", skill: "Make · Test · Discover", premium: { layout: "studio", title: "ACTIVITY", eyebrow: "THE DISCOVERY WORKSHOP", description: "A workshop badge, a colour rail and a quiet skill caption." } },
  { kind: "premium-challenge", name: "Challenge · Summit", type: "hots-challenge", icon: "target", skill: "Go beyond the obvious", premium: { layout: "flag", title: "THE CHALLENGE", eyebrow: "TAKE YOUR THINKING FURTHER", description: "A raised pennant with a target emblem and a strong editorial title." } },
  { kind: "premium-investigate", name: "Investigate · Fieldnotes", type: "hands-on", icon: "flask", skill: "Observe · Question · Test", premium: { layout: "orbit", title: "INVESTIGATE", eyebrow: "NOTES FROM THE SCIENCE LAB", description: "An instrument badge, fine guide marks and a fieldnotes margin." } },
  { kind: "premium-discuss", name: "Think & Discuss · Forum", type: "class-discussion", icon: "bulb", skill: "Listen · Connect · Respond", premium: { layout: "flag", title: "THINK & DISCUSS", eyebrow: "EVERY PERSPECTIVE MATTERS", description: "A conversation pennant with space for a thoughtful heading." } },
  { kind: "premium-recap", name: "Chapter Recap · Review", type: "revision", icon: "book", skill: "Remember what matters", premium: { layout: "checkpoint", title: "CHAPTER RECAP", eyebrow: "THE ESSENTIALS, TOGETHER", description: "An open-book seal and a clean frame for the chapter’s key ideas." } },
  { kind: "premium-project", name: "Project · Makers Studio", type: "mini-project", icon: "computer", skill: "Plan · Build · Present", premium: { layout: "studio", title: "PROJECT STUDIO", eyebrow: "TURN AN IDEA INTO SOMETHING REAL", description: "A maker’s plate with a structured rail and an editable skill caption." } },
  { kind: "premium-reading", name: "Reading Room · Midnight", type: "reading-passage", icon: "book", skill: "Read · Imagine · Reflect", premium: { layout: "nocturne", title: "THE READING ROOM", eyebrow: "A NEW PAGE. A NEW POSSIBILITY.", description: "A book medallion, deep colour and a serif reading-room title." } },
  { kind: "premium-vocabulary", name: "Word Lab · Index", type: "key-vocabulary", icon: "book", skill: "Words worth knowing", premium: { layout: "folio", title: "THE WORD LAB", eyebrow: "BUILD YOUR LANGUAGE TOOLKIT", description: "An editorial index tab and elegant type for new vocabulary." } },
  { kind: "premium-world", name: "Real World · Atlas", type: "life-link", icon: "globe", skill: "Connect learning to life", premium: { layout: "orbit", title: "THE REAL WORLD", eyebrow: "BEYOND THE CLASSROOM", description: "An atlas medallion and restrained orbit lines for everyday connections." } },
];
export const PREMIUM_REFERENCE_ELEMENTS = REFERENCE_ELEMENTS.filter(preset => preset.premium);

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
