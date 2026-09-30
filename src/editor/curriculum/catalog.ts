import type { CurriculumBlockDefinition, CurriculumCategory, CurriculumLayout, FrameworkStage, ChapterPreset } from "../../domain/educational/curriculum";
import type { EducationalBlockDefinition, SmartBlockInstance } from "../../domain/educational/blockSchema";
import { SIMPLE_CHAPTER_STAGES, simpleStage } from "./frameworkPlan";
import { ELEMENT_PURPOSES, SIMPLE_ELEMENT_NAMES } from "./elementNames";
import { ADDITIONAL_ELEMENTS } from "./additionalElements";

import { teachingLayouts, TEACHING_LAYOUTS } from "./layoutSystem";

export const FRAMEWORK_STAGES = SIMPLE_CHAPTER_STAGES;
export const CURRICULUM_CATEGORIES: { id: CurriculumCategory | "new"; name: string }[] = [
  { id: "new", name: "New elements" }, ...FRAMEWORK_STAGES.map(s => ({ id: s.id, name: s.name })),
  { id: "reading-writing", name: "Reading & Writing" }, { id: "maths", name: "Maths" }, { id: "science", name: "Science" },
  { id: "visuals", name: "Pictures & Tables" }, { id: "projects", name: "Projects" }, { id: "enrichment", name: "Extra Learning" },
  { id: "digital", name: "Online Resources" }, { id: "chapter-sets", name: "Chapter Templates" },
];
export const LAYOUT_NAMES: Record<CurriculumLayout, string> = {
  ...Object.fromEntries(Object.entries(TEACHING_LAYOUTS).map(([id, layout]) => [id, layout.name])) as Record<import("../../domain/educational/curriculum").TeachingLayout, string>,
  panorama: "Full-page picture", asymmetric: "Picture on the side", editorial: "Simple page", "visual-first": "Picture first",
  split: "Text and picture", journey: "Learning steps", constellation: "Ideas around a centre", steps: "Numbered steps",
  notebook: "Notebook", workmat: "Activity sheet", conversation: "Talk together", question: "Big question",
  progression: "Practice levels", snapshot: "Idea map", confidence: "Self-check", digital: "Scan and learn",
  "comparison-table": "Two-column table", timeline: "Timeline", "writing-sheet": "Writing lines", "reading-page": "Reading page",
  "experiment-sheet": "Experiment sheet", "sorting-board": "Sorting spaces",
};
const defaultLayouts: Record<FrameworkStage, CurriculumLayout[]> = {
  discover: ["asymmetric", "visual-first", "question", "editorial"],
  target: ["journey", "constellation", "steps", "editorial", "visual-first", "split"],
  learn: ["editorial", "visual-first", "split", "steps", "snapshot", "journey", "conversation", "asymmetric"],
  build: ["steps", "workmat", "journey", "notebook"], apply: ["notebook", "workmat", "conversation", "visual-first"],
  think: ["question", "constellation", "split", "editorial"], master: ["progression", "editorial", "snapshot", "notebook"],
  reflect: ["confidence", "notebook", "editorial"],
};
type FamilySpec = [CurriculumCategory, FrameworkStage, SmartBlockInstance["archetypeId"], string[]];
const families: FamilySpec[] = [
  ["discover", "discover", "warm-up", ["Chapter Hero", "Chapter Spark", "Curiosity Question", "Picture Prompt", "Story Hook", "Scenario Starter", "Observe & Tell", "What Do You Notice?", "Prediction Prompt", "Recall Radar", "Think-Pair-Share", "Mystery Starter", "Before We Begin"]],
  ["target", "target", "learning-outcomes", ["Learning Mission", "Learning Outcomes", "Success Criteria", "Chapter Roadmap", "Concept Journey", "Skill Targets", "Key Vocabulary", "Essential Question", "Big Question", "Goal Tracker"]],
  ["learn", "learn", "concept-explanation", ["Concept Introduction", "Concept Explorer", "Big Idea", "Explanation Block", "Key Definition", "Visual Explanation", "Worked Example", "See It", "Step-by-Step", "Diagram Explanation", "Process", "Timeline", "Comparison", "Cause & Effect", "Example / Non-example", "Formula", "Rule", "Remember", "Vocabulary", "Teacher Note", "Story Explanation", "Conversation Explanation"]],
  ["build", "build", "guided-practice", ["Try With Me", "Guided Practice", "Complete Together", "Let's Solve", "Let's Read", "Let's Observe", "Mini Practice", "Quick Check", "Checkpoint", "Match It", "Fill It", "Choose It", "Arrange It", "Label It", "Trace It", "Speak It", "Write It", "Draw It"]],
  ["apply", "apply", "activity-lab", ["Hands On", "Math Lab", "Science Lab", "Language Lab", "Activity Zone", "Life Link", "Real World Connection", "Mini Project", "Pair Activity", "Group Activity", "Home Activity", "Class Activity", "Observe Around You", "Survey", "Experiment", "Make & Create", "Skill Studio"]],
  ["think", "think", "critical-thinking", ["Think About It", "Think Deeper", "Why?", "Explain Your Thinking", "Reason It Out", "Spot the Error", "Spot the Glitch", "What If?", "Predict", "Compare", "Classify", "Analyse", "Infer", "Challenge Yourself", "Brain Booster", "Puzzle", "Mystery", "Logic Corner", "HOTS Challenge"]],
  ["master", "master", "exercises", ["Practice Path", "Power Practice", "Revision", "Chapter Exercise", "Concept Review", "Mixed Practice", "Assessment", "Mastery Check", "Test Yourself", "Challenge Test", "Competency Check", "Exam Practice", "3-Minute Recall", "Chapter Snapshot", "Concept Map"]],
  ["reflect", "reflect", "reflection", ["My Learning", "Self Check", "I Can Now", "Reflection", "Confidence Meter", "Learning Journal", "What I Loved", "What I Found Difficult", "Need More Practice", "My Achievement", "What's Next"]],
  ["enrichment", "learn", "facts-curiosity", ["Did You Know?", "Amazing Fact", "Fun Fact", "World Connection", "History Connection", "Science Connection", "Environment Connection", "Culture Connection", "India Connection", "Career Connection", "Values Connection", "Cross-Curricular Link"]],
  ["digital", "apply", "ai-explore", ["Scan & Learn", "Watch", "Listen", "Try Online", "Interactive Practice", "AI Practice", "Digital Challenge", "NEX MAXX AI", "Explore in App", "QR Activity"]],
];
export const blockSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const special: Record<string, { archetype?: SmartBlockInstance["archetypeId"]; layouts?: CurriculumLayout[] }> = {
  "chapter-hero": { archetype: "chapter-structure", layouts: ["panorama", "asymmetric", "visual-first"] },
  "worked-example": { archetype: "worked-examples", layouts: ["steps", "split", "editorial", "conversation"] },
  "quick-check": { archetype: "quick-check" }, "vocabulary": { archetype: "vocabulary" },
  "key-vocabulary": { archetype: "vocabulary" }, "chapter-snapshot": { archetype: "revision-recap", layouts: ["snapshot", "editorial", "constellation"] },
  "concept-map": { archetype: "concept-map", layouts: ["constellation", "journey", "snapshot"] },
  "assessment": { archetype: "assessment-mastery", layouts: ["editorial", "notebook", "steps"] },
  "mastery-check": { archetype: "assessment-mastery", layouts: ["editorial", "notebook", "steps"] },
  "practice-path": { layouts: ["progression", "journey", "steps"] }, "learning-mission": { layouts: defaultLayouts.target },
  "picture-prompt": { layouts: ["visual-first", "asymmetric", "conversation"] },
  "recall-radar": { layouts: ["constellation", "journey", "question"] },
  "conversation-explanation": { layouts: ["conversation", "editorial", "split"] },
};
const LEGACY_ELEMENTS: CurriculumBlockDefinition[] = families.flatMap(([category, stage, archetype, names]) => names.map((name, index) => {
  const id = blockSlug(name), override = special[id];
  const baseLayouts = defaultLayouts[stage], shift = index % baseLayouts.length;
  const simple = simpleStage(stage, id);
  return { id, name: SIMPLE_ELEMENT_NAMES[id] || name, originalName: name, originalStage: stage,
    category: (["target", "think", "master", "reflect", "discover", "learn", "build", "apply"] as CurriculumCategory[]).includes(category) ? simple as CurriculumCategory : category,
    stage: simple, archetype: override?.archetype || archetype,
    purpose: ELEMENT_PURPOSES[id] || FRAMEWORK_STAGES.find(s => s.id === simple)!.purpose,
    layouts: category === "digital" ? ["digital", "editorial", "visual-first"] : override?.layouts || [...baseLayouts.slice(shift), ...baseLayouts.slice(0, shift)],
    tags: [category, stage, simple, name.toLowerCase(), (SIMPLE_ELEMENT_NAMES[id] || name).toLowerCase(), archetype,
      ...(category === "apply" ? ["activities", "experiment", "project"] : []), ...(archetype === "assessment-mastery" ? ["assessment"] : []),
      ...(/visual|diagram|picture|map|timeline/i.test(name) ? ["visuals"] : [])],
  };
}));
export const CURRICULUM_BLOCKS: CurriculumBlockDefinition[] = [...LEGACY_ELEMENTS, ...ADDITIONAL_ELEMENTS].map(def => ({ ...def, layouts: teachingLayouts(def) }));
export const CURRICULUM_BLOCK_MAP = Object.fromEntries(CURRICULUM_BLOCKS.map(b => [b.id, b]));
export const CHAPTER_PRESETS: { id: ChapterPreset; name: string; description: string; blocks: string[] }[] = [
  { id: "balanced", name: "Everyday chapter", description: "Clear explanations, practice, an activity, review and a test.", blocks: ["chapter-hero", "recall-radar", "learning-mission", "concept-explorer", "quick-check", "concept-explorer", "guided-practice", "concept-explorer", "hands-on", "practice-path", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "activity-rich", name: "Hands-on chapter", description: "More observing, making, partner work and projects.", blocks: ["chapter-hero", "chapter-spark", "recall-radar", "learning-mission", "concept-explorer", "hands-on", "concept-explorer", "life-link", "activity-zone", "think-about-it", "practice-path", "mini-project", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "concept-heavy", name: "Detailed chapter", description: "More explanations, solved examples and guided practice.", blocks: ["chapter-hero", "learning-mission", "concept-explorer", "worked-example", "quick-check", "concept-explorer", "worked-example", "quick-check", "concept-explorer", "worked-example", "practice-path", "reason-it-out", "hands-on", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "story-led", name: "Story chapter", description: "Stories, conversations and questions throughout the chapter.", blocks: ["chapter-hero", "story-hook", "scenario-starter", "learning-mission", "concept-explorer", "conversation-explanation", "try-with-me", "story-explanation", "life-link", "challenge-yourself", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "premium-nex", name: "Premium chapter", description: "An illustrated opening, clear teaching pages, varied activities, review and test.", blocks: ["chapter-hero", "curiosity-question", "recall-radar", "learning-mission", "concept-explorer", "visual-explanation", "try-with-me", "quick-check", "concept-explorer", "life-link", "hands-on", "think-deeper", "practice-path", "scan-learn", "chapter-snapshot", "mastery-check", "my-learning"] },
];
export function placeholderContent(def: CurriculumBlockDefinition): SmartBlockInstance["semanticContent"] {
  const c: SmartBlockInstance["semanticContent"] = { title: def.name, unitBadge: def.stage.toUpperCase() };
  if (def.starterContent) return { ...c, ...structuredClone(def.starterContent) };
  const oldStage = def.originalStage || def.stage;
  if (def.id === "chapter-hero") return { ...c, chapterNumber: "01", title: "A world of discovery", subtitle: "Add your chapter theme and a learning teaser.", introText: "Add a question that activates prior knowledge." };
  if (def.category === "digital") return { ...c, subtitle: "Add a short digital activity that extends this concept.", introText: "Choose a resource, add its verified link, and tell learners what to look for." };
  if (oldStage === "target") return { ...c, introText: "These are the chapter goals.", items: ["Explain the key idea in your own words.", "Use the idea to solve a new problem.", "Show your understanding with an example."] };
  if (oldStage === "apply") return { ...c, introText: "Use the chapter idea through observation and making.", materials: ["Add the materials learners need."], steps: [{ stepNumber: 1, title: "What to do", body: "Describe a safe, practical activity." }, { stepNumber: 2, title: "Observe and record", body: "Add what learners should observe, draw or measure." }, { stepNumber: 3, title: "Think and share", body: "Ask learners to explain what they found." }] };
  if (oldStage === "reflect") return { ...c, items: ["I can explain the main idea.", "I can use it independently."], questions: [{ prompt: "What did you enjoy learning?" }, { prompt: "What will you practise next?" }] };
  if (oldStage === "build" || oldStage === "master") return { ...c, questions: [{ prompt: "Add a question to check the key concept.", answer: "Add the expected answer or marking guidance.", points: 1 }, { prompt: "Add a question that asks learners to apply the idea.", points: 2 }] };
  if (oldStage === "think" || oldStage === "discover") return { ...c, introText: "Add a question that invites learners to notice, predict or explain.", questions: [{ prompt: "What do you notice? Explain your thinking." }] };
  if (def.archetype === "worked-examples") return { ...c, steps: [{ stepNumber: 1, title: "Notice", body: "Introduce the example and identify what we know." }, { stepNumber: 2, title: "Reason", body: "Explain the solution one step at a time." }, { stepNumber: 3, title: "Check", body: "Show how to check the result." }] };
  return { ...c, introText: "Write the key concept here. Explain the idea in one simple sentence.", items: ["Add a clear example learners can recognise.", "Connect the idea to something learners already know."], calloutText: "Add the one idea learners should remember." };
}
/** Native registry entries keep insert/drag, PDF export and legacy smart-block tools working. */
export const CURRICULUM_PRESETS: Record<string, EducationalBlockDefinition> = Object.fromEntries(CURRICULUM_BLOCKS.map(def => [`curriculum-${def.id}`, {
  id: `curriculum-${def.id}`, archetypeId: def.archetype, category: def.archetype, name: def.name, version: 4, collectionVersion: 4,
  family: "nex-editorial", supportedSubjects: ["general"], supportedGrades: ["primary-lower", "primary-upper"], tags: def.tags,
  description: def.purpose, minDimensions: { widthPt: 180, heightPt: 60 }, defaultDimensions: { widthPt: 517, heightPt: 220 },
  reflowRules: { layoutVariant: def.layouts[0], verticalGrowthStrategy: "expand-container" }, defaultBackgroundStyle: { type: "none" },
  slots: Object.entries(placeholderContent(def)).filter(([, value]) => value !== undefined).map(([slotId, defaultContent]) => ({ slotId, label: slotId, type: "text", required: slotId === "title", defaultContent })),
} as EducationalBlockDefinition]));
