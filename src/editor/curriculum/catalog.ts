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
  "topic-banner": "Topic Banner", "fact-zone": "Fact Zone", "life-connect": "Life Connect",
  ...Object.fromEntries(Object.entries(TEACHING_LAYOUTS).map(([id, layout]) => [id, layout.name])) as Record<import("../../domain/educational/curriculum").TeachingLayout, string>,
  "lesson-schema": "Connected Topic Map", "lesson-schema-stacked": "Topic Cards",
  "study-skills": "Study Skills Card",
  "learning-outcomes": "Learning Targets Banner",
  panorama: "Full-page picture", asymmetric: "Picture on the side", editorial: "Simple page", "visual-first": "Picture first",
  split: "Text and picture", journey: "Learning steps", constellation: "Ideas around a centre", steps: "Numbered steps",
  notebook: "Notebook", workmat: "Activity sheet", conversation: "Talk together", question: "Big question",
  progression: "Practice levels", snapshot: "Idea map", confidence: "Self-check", digital: "Scan and learn",
  "comparison-table": "Two-column table", timeline: "Timeline", "writing-sheet": "Writing lines", "reading-page": "Reading page",
  "experiment-sheet": "Experiment sheet", "sorting-board": "Sorting spaces",
  "universal-cover": "Signature Cover", "universal-concept": "Concept Explorer", "universal-practice": "Guided Practice",
  "universal-explore": "Discovery Spread", "universal-assessment": "Mastery Check",
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
const LESSON_SCHEMA: CurriculumBlockDefinition = {
  id: "lesson-schema", name: "Lesson Schema", category: "discover", stage: "discover", archetype: "concept-map",
  purpose: "Preview any chapter with an editable central idea and connected topic boxes. Add, remove, reorder, recolour or leave boxes empty.",
  layouts: ["lesson-schema", "lesson-schema-stacked"], tags: ["lesson", "schema", "topics", "chapter plan", "mind map", "visuals", "all subjects"],
  starterContent: { title: "LESSON SCHEMA", calloutText: "Your chapter name", items: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6", "Topic 7"] },
};
const LEARNING_OUTCOMES: CurriculumBlockDefinition = {
  id: "learning-outcomes", name: "Learning Outcomes", category: "discover", stage: "discover", originalStage: "target", archetype: "learning-outcomes",
  purpose: "Display clear, editable learning targets with action icons, verbs, empty spaces and educational illustration.",
  layouts: ["learning-outcomes", "editorial"], tags: ["learning outcomes", "objectives", "targets", "outcomes", "goals", "all subjects"],
  starterContent: {
    title: "LEARNING OUTCOMES",
    calloutText: "After studying this chapter, the students will be able to:",
    items: [
      "write 5-digit and 6-digit numbers",
      "determine the place value and the face value of digits in a number",
      "compare numbers up to 9,99,999",
      "form the largest and the smallest numbers using 5 or 6 digits",
      "estimate the rounded-off numbers to the nearest tens, hundreds and thousands",
      "define Roman numerals",
    ],
  },
};
const STUDY_SKILLS: CurriculumBlockDefinition = {
  id: "study-skills", name: "Study Skills", category: "discover", stage: "discover", originalStage: "learn", archetype: "study-skills",
  purpose: "Display essential study rules, facts, strategies and customizable empty writing spaces.",
  layouts: ["study-skills", "editorial"], tags: ["study skills", "strategy", "toolkit", "rules", "facts", "study", "skills", "all subjects"],
  starterContent: {
    title: "STUDY SKILLS",
    badgeLabel: "STUDY SKILLS",
    calloutText: "Face value of:",
    items: ["7 is 7.", "9 is 9.", "2 is 2.", "7 is 7."],
  },
};
const TOPIC_BANNER: CurriculumBlockDefinition = {
  id: "topic-banner", name: "Topic Banner", category: "learn", stage: "learn", archetype: "section-heading",
  purpose: "An editable topic heading with layered waves and raised lettering, adaptable to any subject.",
  layouts: ["topic-banner", "editorial"], tags: ["topic", "banner", "heading", "ribbon", "3d", "successor", "predecessor", "all subjects"],
  starterContent: {
    title: "SUCCESSOR",
    badgeLabel: "AND",
    subtitle: "PREDECESSOR",
    introText: "Every number has a neighbour before and a neighbour after.",
  },
};
const FACT_ZONE: CurriculumBlockDefinition = {
  id: "fact-zone", name: "Fact Zone", category: "discover", stage: "discover", originalStage: "think", archetype: "facts-curiosity",
  purpose: "3D pill container with glowing lightbulb tab, editable fact content, and 3D books medallion badge. Versatile for every subject.",
  layouts: ["fact-zone", "editorial"], tags: ["fact", "zone", "trivia", "did you know", "pro tip", "callout", "3d", "all subjects"],
  starterContent: {
    title: "FACT ZONE",
    badgeLabel: "FACT ZONE",
    calloutText: "0 is neither positive nor negative. It is the only number that cannot be represented in Roman numerals!",
    items: [
      "Every natural number has a successor (n + 1).",
      "The number 1 has no predecessor in the set of natural numbers.",
      "Zero added to any number does not change its value.",
    ],
  },
};
const LIFE_CONNECT: CurriculumBlockDefinition = {
  id: "life-connect", name: "Life Connect", category: "apply", stage: "apply", archetype: "real-world-connect",
  purpose: "A folded ribbon and editable medallion connecting a subject concept to a real-world application.",
  layouts: ["life-connect", "editorial"], tags: ["life connect", "real world", "application", "ribbon", "planting boy", "all subjects"],
  starterContent: {
    badgeLabel: "LIFE",
    title: "CONNECT",
    subtitle: "Maths Around Us",
    calloutText: "When you stand in a queue at the ticket counter, the person right ahead of you is your predecessor, and the person behind you is your successor!",
  },
};
export const CURRICULUM_BLOCKS: CurriculumBlockDefinition[] = [
  LEGACY_ELEMENTS[0], // chapter-hero (1st place)
  LESSON_SCHEMA,      // lesson-schema (2nd place)
  STUDY_SKILLS,       // study-skills (3rd place)
  LEARNING_OUTCOMES,  // learning-outcomes (4th place)
  TOPIC_BANNER,
  FACT_ZONE,
  LIFE_CONNECT,
  ...LEGACY_ELEMENTS.slice(1).filter(b => b.id !== "learning-outcomes" && b.id !== "study-skills" && b.id !== "topic-banner" && b.id !== "fact-zone" && b.id !== "life-connect"),
  ...ADDITIONAL_ELEMENTS
].map(def => ({ ...def, layouts: teachingLayouts(def) }));
export const CURRICULUM_BLOCK_MAP = Object.fromEntries(CURRICULUM_BLOCKS.map(b => [b.id, b]));
export const CHAPTER_PRESETS: { id: ChapterPreset; name: string; description: string; blocks: string[] }[] = [
  { id: "balanced", name: "Everyday chapter", description: "Clear explanations, practice, an activity, review and a test.", blocks: ["chapter-hero", "lesson-schema", "study-skills", "learning-outcomes", "recall-radar", "learning-mission", "concept-explorer", "quick-check", "concept-explorer", "guided-practice", "concept-explorer", "hands-on", "practice-path", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "activity-rich", name: "Hands-on chapter", description: "More observing, making, partner work and projects.", blocks: ["chapter-hero", "lesson-schema", "study-skills", "learning-outcomes", "chapter-spark", "recall-radar", "learning-mission", "concept-explorer", "hands-on", "concept-explorer", "life-link", "activity-zone", "think-about-it", "practice-path", "mini-project", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "concept-heavy", name: "Detailed chapter", description: "More explanations, solved examples and guided practice.", blocks: ["chapter-hero", "lesson-schema", "study-skills", "learning-outcomes", "learning-mission", "concept-explorer", "worked-example", "quick-check", "concept-explorer", "worked-example", "quick-check", "concept-explorer", "worked-example", "practice-path", "reason-it-out", "hands-on", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "story-led", name: "Story chapter", description: "Stories, conversations and questions throughout the chapter.", blocks: ["chapter-hero", "lesson-schema", "study-skills", "learning-outcomes", "story-hook", "scenario-starter", "learning-mission", "concept-explorer", "conversation-explanation", "try-with-me", "story-explanation", "life-link", "challenge-yourself", "chapter-snapshot", "mastery-check", "my-learning"] },
  { id: "premium-nex", name: "Premium chapter", description: "An illustrated opening, clear teaching pages, varied activities, review and test.", blocks: ["chapter-hero", "lesson-schema", "study-skills", "learning-outcomes", "curiosity-question", "recall-radar", "learning-mission", "concept-explorer", "visual-explanation", "try-with-me", "quick-check", "concept-explorer", "life-link", "hands-on", "think-deeper", "practice-path", "scan-learn", "chapter-snapshot", "mastery-check", "my-learning"] },
];

export const UNIVERSAL_CHAPTER_PRESETS = [
  {
    id: "universal-editorial" as const,
    name: "NEX MAXX Universal Editorial",
    description: "Publisher-grade chapter matching the 5-page universal layout reference.",
    blocks: [
      "chapter-hero", "lesson-schema", "study-skills", "learning-outcomes", "quick-check", "concept-explorer",
      "concept-explorer", "worked-example", "guided-practice", "try-with-me",
      "hands-on", "chapter-snapshot", "mastery-check", "my-learning"
    ],
  },
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
