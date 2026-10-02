/**
 * NEX MAXX Universal Chapter Layout — Block Registry & Subject Fixtures
 * 
 * Defines the 24 universal semantic block categories, 5 page archetypes,
 * and multi-subject / grade-band curriculum fixtures from the NEX MAXX
 * Universal Chapter Layout Design System.
 */

import type { SmartBlockInstance, SubjectDomain, GradeBand } from "../../domain/educational/blockSchema";
import type { CurriculumGrade, UniversalBlockArchetype, UniversalLayoutPreset } from "../../domain/educational/curriculum";

export interface UniversalBlockMeta {
  type: UniversalBlockArchetype;
  name: string;
  symbol: string;
  category: "structure" | "outcomes" | "concepts" | "practice" | "activities" | "assessment";
  defaultTitle: string;
  defaultBody: string;
  description: string;
}

export const UNIVERSAL_BLOCK_CATALOG: UniversalBlockMeta[] = [
  { type: "chapter-hero", name: "Chapter Hero", symbol: "◈", category: "structure", defaultTitle: "Number Universe", defaultBody: "Explore numbers, uncover patterns and see how quantities shape our world.", description: "Full-bleed editorial chapter opener with display typography and watermark number." },
  { type: "lesson-schema", name: "Lesson Schema", symbol: "◎", category: "structure", defaultTitle: "LESSON SCHEMA", defaultBody: "Explore|Understand|Practise|Apply|Connect|Create|Review", description: "Editable central chapter circle with connected pastel topic capsules, icons and additional empty boxes." },
  { type: "study-skills", name: "Study Skills", symbol: "💡", category: "structure", defaultTitle: "STUDY SKILLS", defaultBody: "Face value of:|7 is 7.|9 is 9.|2 is 2.|7 is 7.", description: "Editable study skills card with glowing badge, topic heading, and customizable empty spaces." },
  { type: "mission-banner", name: "Mission Banner", symbol: "✦", category: "structure", defaultTitle: "YOUR CHAPTER MISSION", defaultBody: "Can you find the same number in three different representations?", description: "High-contrast driving question with glowing orb motif." },
  { type: "learning-journey", name: "Learning Journey", symbol: "▦", category: "structure", defaultTitle: "Your learning journey", defaultBody: "Explore|Understand|Practice|Create", description: "Four-step visual progression map with distinct color backgrounds." },
  { type: "learning-outcomes", name: "Learning Outcomes", symbol: "✓", category: "outcomes", defaultTitle: "By the end, you can…", defaultBody: "Read, represent and compare large numbers|Explain place value through visual models|Apply estimation in practical situations|Communicate mathematical reasoning", description: "Structured success criteria chips with checkmarks." },
  { type: "section-heading", name: "Section Heading", symbol: "¶", category: "structure", defaultTitle: "Making Sense of Big Numbers", defaultBody: "Numbers have structure. Visual models reveal why each position matters.", description: "Editorial section heading with eyebrow and supporting explanation." },
  { type: "topic-banner", name: "Topic Banner (3D Ribbon)", symbol: "∿", category: "structure", defaultTitle: "SUCCESSOR", defaultBody: "SUCCESSOR|AND|PREDECESSOR", description: "3D wavy organic ribbon banner with layered fluid waves and puffy typography." },
  { type: "fact-zone", name: "Fact Zone (3D Callout)", symbol: "⚡", category: "concepts", defaultTitle: "FACT ZONE", defaultBody: "0 is neither positive nor negative. It cannot be written in Roman numerals!|Every number has a successor.|Place value changes with seat.", description: "3D pill container with glowing lightbulb tab and 3D books medallion." },
  { type: "life-connect", name: "Life Connect (Real World)", symbol: "🌱", category: "activities", defaultTitle: "CONNECT", defaultBody: "LIFE|CONNECT|Planting trees cools our school and creates clean oxygen for everyone.", description: "Folded 3D ribbon banner with teardrop planting boy medallion badge." },
  { type: "concept-comparison", name: "Concept Comparison", symbol: "◫", category: "concepts", defaultTitle: "See the difference", defaultBody: "Place value|The position of a digit changes its value.|Face value|A digit keeps the same face value wherever it appears.", description: "Two-column comparison tiles with mini visual bar diagrams." },
  { type: "key-insight", name: "Key Insight", symbol: "◆", category: "concepts", defaultTitle: "THE BIG IDEA", defaultBody: "Big ideas begin with curious questions and a little number sense.", description: "Dark charcoal callout container with diamond spark icon." },
  { type: "smart-table", name: "Smart Data Table", symbol: "▤", category: "concepts", defaultTitle: "Compare & Connect", defaultBody: "Place value|Face value|Think deeply|Observe carefully|Describe clearly|Give an example", description: "Three-column data grid with contrast header caption." },
  { type: "quick-check", name: "Quick Check", symbol: "?", category: "practice", defaultTitle: "CHECK YOUR THINKING", defaultBody: "In 6,42,510, which digit represents forty thousand?", description: "Targeted question callout with answer line." },
  { type: "worked-example", name: "Worked Example", symbol: "∑", category: "practice", defaultTitle: "LET’S SOLVE ONE TOGETHER", defaultBody: "Example: Expand 4,05,216 into a sum of place values.", description: "Scaffolded example with Step 01 Notice and Step 02 Reason." },
  { type: "guided-exercises", name: "Guided Exercises", symbol: "☷", category: "practice", defaultTitle: "Guided practice", defaultBody: "Write 7,06,241 in expanded form.|Compare 8,46,129 and 8,64,219.|Round 48,765 to the nearest thousand.", description: "Numbered exercise items with response lines." },
  { type: "answer-workspace", name: "Answer Workspace", symbol: "▧", category: "practice", defaultTitle: "MY THINKING SPACE", defaultBody: "Show your method, sketch or working below.", description: "Dashed container with print-ready ruled workspace grid." },
  { type: "activity-lab", name: "Hands-on Activity", symbol: "⚗", category: "activities", defaultTitle: "Build a Number Museum", defaultBody: "Use local prices, distances and population data to create three real-world number exhibits.", description: "Warm sand panel with 3-phase Plan, Do, Share structure." },
  { type: "illustration-diagram", name: "Illustration / Diagram", symbol: "◇", category: "activities", defaultTitle: "SEE IT DIFFERENTLY", defaultBody: "A flexible visual / diagram layer with alt text and print-safe placement.", description: "Dual-column layout with accessible SVG diagram and editorial explanation." },
  { type: "real-world-case", name: "Real-World Case", symbol: "◉", category: "activities", defaultTitle: "Numbers Around Our Community", defaultBody: "Use real data from markets, schools or sports to compare, round and explain numbers.", description: "Aqua panel connecting curriculum to authentic community data." },
  { type: "vocabulary-bank", name: "Word Bank", symbol: "Aa", category: "outcomes", defaultTitle: "WORDS WORTH KEEPING", defaultBody: "Place value|Expanded form|Estimate|Compare", description: "Highlighted vocabulary pill tags with high-contrast borders." },
  { type: "reflection-connect", name: "Reflect & Connect", symbol: "↗", category: "assessment", defaultTitle: "PAUSE & REFLECT", defaultBody: "How does the position of zero change a number?", description: "Metacognitive reflection prompt with double ruled lines." },
  { type: "mastery-rubric", name: "Mastery Rubric", symbol: "◌", category: "assessment", defaultTitle: "SELF-CHECK", defaultBody: "I can represent a number visually.|I can explain each digit’s value.|I can use rounding in a real situation.", description: "Self-assessment rubric with 3-level rating dots." },
  { type: "chapter-summary", name: "Chapter Snapshot", symbol: "≡", category: "structure", defaultTitle: "CHAPTER IN A NUTSHELL", defaultBody: "Every digit has a position, and that position gives it power.", description: "Memorable synthesis banner summarizing chapter essence." },
  { type: "media-qr-companion", name: "Media / QR Prompt", symbol: "▣", category: "activities", defaultTitle: "WATCH • LISTEN • EXPLORE", defaultBody: "Attach an approved school or curriculum media resource.", description: "Print-safe multimedia placeholder with alt text requirements." },
  { type: "differentiated-paths", name: "Learning Paths", symbol: "⇄", category: "practice", defaultTitle: "Choose your pathway", defaultBody: "Start|Grow|Challenge", description: "Three-tier differentiated choice cards." },
  { type: "teacher-note", name: "Teacher Note", symbol: "☼", category: "assessment", defaultTitle: "FOR THE FACILITATOR", defaultBody: "Use the rubric and student responses to plan targeted feedback.", description: "Facilitator-only guidance bar; excluded from student print runs." },
  { type: "assessment-cards", name: "Assessment Cards", symbol: "☑", category: "assessment", defaultTitle: "THREE WAYS TO SHOW MASTERY", defaultBody: "Write 7,06,241 in expanded form.|Compare 8,46,129 and 8,64,219.|Round 48,765 to the nearest thousand.", description: "Tri-card summative check covering Remember, Apply, and Explain." },
  { type: "infographic-stats", name: "Infographic Stats", symbol: "▥", category: "structure", defaultTitle: "Three ways to explore", defaultBody: "10,00,000|1,000,000|XL", description: "3-column stat metrics with contrast values and labels." },
];

export const UNIVERSAL_BLOCK_MAP = Object.fromEntries(
  UNIVERSAL_BLOCK_CATALOG.map(b => [b.type, b])
) as Record<UniversalBlockArchetype, UniversalBlockMeta>;

/** Helper mapping legacy and alias block types to UniversalBlockArchetype */
export function normalizeUniversalType(type: string): UniversalBlockArchetype {
  const map: Record<string, UniversalBlockArchetype> = {
    hero: "chapter-hero",
    "chapter-hero": "chapter-hero",
    schema: "lesson-schema",
    "lesson-schema": "lesson-schema",
    "study-skills": "study-skills",
    "strategy-panel": "study-skills",
    mission: "mission-banner",
    "mission-banner": "mission-banner",
    journey: "learning-journey",
    "learning-journey": "learning-journey",
    outcomes: "learning-outcomes",
    "learning-outcomes": "learning-outcomes",
    "learning-mission": "learning-outcomes",
    heading: "section-heading",
    "section-heading": "section-heading",
    "topic-banner": "topic-banner",
    banner: "topic-banner",
    "fact-zone": "fact-zone",
    facts: "fact-zone",
    "life-connect": "life-connect",
    connect: "life-connect",
    concept: "concept-comparison",
    "concept-comparison": "concept-comparison",
    callout: "key-insight",
    "key-insight": "key-insight",
    table: "smart-table",
    "smart-table": "smart-table",
    question: "quick-check",
    "quick-check": "quick-check",
    worked: "worked-example",
    "worked-example": "worked-example",
    exercises: "guided-exercises",
    "guided-exercises": "guided-exercises",
    workspace: "answer-workspace",
    "answer-workspace": "answer-workspace",
    activity: "activity-lab",
    "activity-lab": "activity-lab",
    illustration: "illustration-diagram",
    "illustration-diagram": "illustration-diagram",
    case: "real-world-case",
    "real-world-case": "real-world-case",
    vocabulary: "vocabulary-bank",
    "vocabulary-bank": "vocabulary-bank",
    reflection: "reflection-connect",
    "reflection-connect": "reflection-connect",
    rubric: "mastery-rubric",
    "mastery-rubric": "mastery-rubric",
    summary: "chapter-summary",
    "chapter-summary": "chapter-summary",
    media: "media-qr-companion",
    "media-qr-companion": "media-qr-companion",
    differentiated: "differentiated-paths",
    "differentiated-paths": "differentiated-paths",
    teacher: "teacher-note",
    "teacher-note": "teacher-note",
    assessment: "assessment-cards",
    "assessment-cards": "assessment-cards",
    visual: "infographic-stats",
    "infographic-stats": "infographic-stats",
  };
  return map[type] || "section-heading";
}

/** Subject Presets & Fixtures from the Reference System */
export interface SubjectFixture {
  name: string;
  chapter: string;
  subtitle: string;
  intro: string;
  objective: string[];
  hero: string[];
  labels: string[];
  mission: string;
  section: string;
  sectionDesc: string;
  conceptA: string;
  conceptB: string;
  conceptTextA: string;
  conceptTextB: string;
  question: string;
  worked: string;
  exercise: string[];
  activity: string;
  activityDesc: string;
  vocab: string[];
  reflect: string;
  caseTitle: string;
  caseDesc: string;
  rubric: string[];
  recap: string;
}

export const UNIVERSAL_SUBJECT_FIXTURES: Record<string, SubjectFixture> = {
  mathematics: {
    name: "Mathematics",
    chapter: "Number Universe",
    subtitle: "Explore numbers, uncover patterns and see how quantities shape our world.",
    intro: "Big ideas begin with curious questions and a little number sense.",
    objective: [
      "Read, represent and compare large numbers",
      "Explain place value through visual models",
      "Apply estimation in practical situations",
      "Communicate mathematical reasoning",
    ],
    hero: ["10,00,000", "1,000,000", "XL"],
    labels: ["Indian notation", "International notation", "Roman numerals"],
    mission: "Can you find the same number in three different representations?",
    section: "Making Sense of Big Numbers",
    sectionDesc: "Numbers have structure. Visual models reveal why each position matters.",
    conceptA: "Place value",
    conceptB: "Face value",
    conceptTextA: "The position of a digit changes its value.",
    conceptTextB: "A digit keeps the same face value wherever it appears.",
    question: "In 6,42,510, which digit represents forty thousand?",
    worked: "Example: Expand 4,05,216 into a sum of place values.",
    exercise: [
      "Write 7,06,241 in expanded form.",
      "Compare 8,46,129 and 8,64,219.",
      "Round 48,765 to the nearest thousand.",
    ],
    activity: "Build a Number Museum",
    activityDesc: "Use local prices, distances and population data to create three real-world number exhibits.",
    vocab: ["Place value", "Expanded form", "Estimate", "Compare"],
    reflect: "How does the position of zero change a number?",
    caseTitle: "Numbers Around Our Community",
    caseDesc: "Use real data from markets, schools or sports to compare, round and explain numbers.",
    rubric: [
      "I can represent a number visually.",
      "I can explain each digit’s value.",
      "I can use rounding in a real situation.",
    ],
    recap: "Every digit has a position, and that position gives it power.",
  },
  science: {
    name: "Science",
    chapter: "The World of Plants",
    subtitle: "Observe structures, discover processes and learn how living things thrive.",
    intro: "Every leaf hides a scientific story waiting to be explored.",
    objective: [
      "Identify key plant structures",
      "Explain functions using clear diagrams",
      "Make observations and record evidence",
      "Ask questions and test predictions",
    ],
    hero: ["ROOT", "STEM", "LEAF"],
    labels: ["Absorb", "Support", "Make food"],
    mission: "How would a seedling change if it grew in darkness?",
    section: "Look Closely: Parts of a Plant",
    sectionDesc: "Scientific explanations begin with careful observation and evidence.",
    conceptA: "Roots",
    conceptB: "Leaves",
    conceptTextA: "Roots hold a plant and absorb water and minerals.",
    conceptTextB: "Leaves capture light and make food for the plant.",
    question: "Why are leaves usually green, and what do they do?",
    worked: "Observe one plant: label root, stem and leaf, then describe each function.",
    exercise: [
      "Draw a plant and label its main parts.",
      "Predict what happens without water.",
      "Describe a fair test using two seedlings.",
    ],
    activity: "Build a Mini Plant Lab",
    activityDesc: "Grow two seeds in different light conditions. Predict, observe and record.",
    vocab: ["Roots", "Stem", "Photosynthesis", "Observation"],
    reflect: "Which observation changed your original prediction?",
    caseTitle: "A Garden Investigation",
    caseDesc: "Observe a plant in the school garden and propose one question you can test.",
    rubric: [
      "I can label parts using evidence.",
      "I can explain a basic plant process.",
      "I can record observations clearly.",
    ],
    recap: "Science connects the questions we ask with evidence we can observe.",
  },
  english: {
    name: "English",
    chapter: "Stories that Spark",
    subtitle: "Read closely, discover strong characters and build your own confident voice.",
    intro: "One vivid sentence can open an entirely new world.",
    objective: [
      "Identify character, setting and plot",
      "Infer meaning from context clues",
      "Write with precise descriptive vocabulary",
      "Share ideas through reading and speaking",
    ],
    hero: ["READ", "THINK", "WRITE"],
    labels: ["Explore a text", "Find meaning", "Create a story"],
    mission: "What would you do if your favourite book started speaking?",
    section: "Inside a Great Story",
    sectionDesc: "Authors make deliberate choices about voice, setting and action.",
    conceptA: "Setting",
    conceptB: "Character",
    conceptTextA: "Where and when the story takes place.",
    conceptTextB: "Who acts, speaks and grows during the story.",
    question: "What clue tells you how a character is feeling?",
    worked: "Read: “Maya gripped the map as thunder rolled.” Identify one mood clue.",
    exercise: [
      "Underline two describing words in a short paragraph.",
      "Rewrite a sentence with stronger verbs.",
      "Predict what could happen next and explain why.",
    ],
    activity: "Create a Story Studio",
    activityDesc: "Work in pairs: collect three objects and turn them into a short story.",
    vocab: ["Character", "Setting", "Inference", "Descriptive verb"],
    reflect: "Which word choice made your writing more vivid?",
    caseTitle: "Our Neighbourhood Stories",
    caseDesc: "Interview a family member and turn a memory into a descriptive paragraph.",
    rubric: [
      "I can find evidence in a text.",
      "I can organize a clear paragraph.",
      "I can give respectful peer feedback.",
    ],
    recap: "Great readers notice details; great writers make every detail matter.",
  },
  social: {
    name: "Social Studies",
    chapter: "People, Places & Maps",
    subtitle: "Understand communities, explore geography and make informed connections.",
    intro: "Our places and stories are linked through time, maps and everyday choices.",
    objective: [
      "Read basic maps and geographic symbols",
      "Compare community roles and responsibilities",
      "Explain changes using sources",
      "Present evidence-based observations",
    ],
    hero: ["MAP", "TIME", "PLACE"],
    labels: ["Locate", "Investigate", "Connect"],
    mission: "What can a map tell us about life in our community?",
    section: "Reading the World Around Us",
    sectionDesc: "Maps and sources help us ask thoughtful questions about people and places.",
    conceptA: "Physical map",
    conceptB: "Political map",
    conceptTextA: "Shows natural features such as rivers and mountains.",
    conceptTextB: "Shows boundaries, cities and administrative areas.",
    question: "Which map would help you locate a mountain range?",
    worked: "Use a simple map key to identify three nearby landmarks.",
    exercise: [
      "Design a key with three local map symbols.",
      "Compare physical and political maps.",
      "Explain why maps use a scale.",
    ],
    activity: "Map Our Community",
    activityDesc: "Create a map of your school neighbourhood with a legend and safe landmarks.",
    vocab: ["Legend", "Scale", "Region", "Landmark"],
    reflect: "What did your map leave out, and why?",
    caseTitle: "A Community That Changed",
    caseDesc: "Compare an old and a current image of a public place and identify changes.",
    rubric: [
      "I can read a map key.",
      "I can support a claim with a source.",
      "I can compare two perspectives.",
    ],
    recap: "We understand places better when we combine maps, sources and questions.",
  },
  evs: {
    name: "Environmental Studies",
    chapter: "Our Living Neighbourhood",
    subtitle: "Discover nature nearby and develop the habits of a thoughtful observer.",
    intro: "A small walk can reveal a world of living connections.",
    objective: [
      "Identify living and non-living things",
      "Observe local environmental changes",
      "Suggest responsible daily habits",
      "Record findings with sketches and labels",
    ],
    hero: ["LOOK", "CARE", "GROW"],
    labels: ["Observe", "Understand", "Act"],
    mission: "What could we do today to make our school greener?",
    section: "Life Around Us",
    sectionDesc: "Observe closely and notice how living things share space.",
    conceptA: "Living things",
    conceptB: "Non-living things",
    conceptTextA: "Living things grow and need resources.",
    conceptTextB: "Non-living objects do not carry out life processes.",
    question: "Is a seed living or non-living? Explain your reasoning.",
    worked: "Observe your desk area: sort six items into two groups and explain.",
    exercise: [
      "List three things you noticed outdoors.",
      "Sketch one living thing and label it.",
      "Suggest one way to reduce water waste.",
    ],
    activity: "Go on a Nature Trail",
    activityDesc: "Observe five things outdoors; draw or photograph them, then discuss.",
    vocab: ["Habitat", "Growth", "Conserve", "Observe"],
    reflect: "What new living thing did you notice today?",
    caseTitle: "A Cleaner School",
    caseDesc: "Identify a waste problem in one school area and design a practical solution.",
    rubric: [
      "I notice details carefully.",
      "I record observations fairly.",
      "I suggest responsible actions.",
    ],
    recap: "Our environment becomes healthier when we observe, understand and act.",
  },
  computer: {
    name: "Computer Science",
    chapter: "Think Like a Programmer",
    subtitle: "Break big challenges into steps and create elegant logical solutions.",
    intro: "Computers follow instructions. Brilliant creators design those instructions.",
    objective: [
      "Describe an algorithm using ordered steps",
      "Recognize sequences and patterns",
      "Explain an error and debug it",
      "Design and evaluate a simple solution",
    ],
    hero: ["INPUT", "LOGIC", "OUTPUT"],
    labels: ["Observe", "Design", "Test"],
    mission: "Can you write instructions so precise that a robot makes no mistakes?",
    section: "From Problem to Program",
    sectionDesc: "Algorithms turn complicated tasks into clear and testable steps.",
    conceptA: "Sequence",
    conceptB: "Condition",
    conceptTextA: "Instructions are performed in a planned order.",
    conceptTextB: "A decision changes what happens next.",
    question: "What could happen if a program skips an important step?",
    worked: "Write an algorithm with five steps for borrowing a library book.",
    exercise: [
      "Put shuffled instructions into order.",
      "Write a simple IF / ELSE example.",
      "Find the missing step in a sequence.",
    ],
    activity: "Human Robot Challenge",
    activityDesc: "In teams, write precise directions for a partner to navigate a maze.",
    vocab: ["Algorithm", "Sequence", "Debug", "Condition"],
    reflect: "Which instruction was the hardest to make unambiguous?",
    caseTitle: "Designing a Smart Routine",
    caseDesc: "Model a familiar daily activity as a flowchart, then improve it.",
    rubric: [
      "I can describe ordered instructions.",
      "I can identify a logical error.",
      "I can test and refine a solution.",
    ],
    recap: "Strong programs begin with clear thinking, careful testing and improvement.",
  },
  telugu: {
    name: "Telugu",
    chapter: "అక్షరాల ప్రపంచం",
    subtitle: "Explore Telugu sounds, expressive words and confident communication.",
    intro: "Every new word helps us connect language with life.",
    objective: [
      "Recognise and read key Telugu forms",
      "Build meaningful everyday vocabulary",
      "Practice short sentences clearly",
      "Listen and respond with confidence",
    ],
    hero: ["అ", "ఆ", "ఇ"],
    labels: ["Listen", "Recognise", "Express"],
    mission: "Find three familiar Telugu words in your home or classroom.",
    section: "Let’s Learn Through Language",
    sectionDesc: "Combine visual clues, reading and simple speaking practice.",
    conceptA: "అక్షరం",
    conceptB: "పదం",
    conceptTextA: "Recognise a written symbol and practise its sound.",
    conceptTextB: "Combine sounds to build a word with meaning.",
    question: "Find and pronounce two familiar letters.",
    worked: "Choose one new word, read it aloud and use it in a sentence.",
    exercise: [
      "Match three letters with familiar words.",
      "Write two short everyday expressions.",
      "Read a simple sentence aloud.",
    ],
    activity: "My Telugu Word Wall",
    activityDesc: "Collect familiar words and add drawings, audio prompts and sentences.",
    vocab: ["అక్షరం", "పదం", "వాక్యం", "భావం"],
    reflect: "Which new expression will you use this week?",
    caseTitle: "Language Around Us",
    caseDesc: "Find useful Telugu signs and words in your local environment.",
    rubric: [
      "I recognise the target letters.",
      "I use vocabulary in context.",
      "I communicate with growing confidence.",
    ],
    recap: "Language grows through listening, practice and meaningful expression.",
  },
  hindi: {
    name: "Hindi",
    chapter: "शब्दों की दुनिया",
    subtitle: "Explore Hindi sounds, new words and thoughtful expression.",
    intro: "Language brings everyday experiences to life.",
    objective: [
      "Recognise familiar Hindi forms",
      "Understand and use new vocabulary",
      "Read and form short sentences",
      "Listen and respond confidently",
    ],
    hero: ["अ", "आ", "इ"],
    labels: ["Listen", "Read", "Speak"],
    mission: "Find three Hindi words that describe your everyday world.",
    section: "Learn Through Words",
    sectionDesc: "Combine sounds, meaning and expression with engaging practice.",
    conceptA: "अक्षर",
    conceptB: "शब्द",
    conceptTextA: "Recognise a written letter and its sound.",
    conceptTextB: "Connect letters to form a meaningful word.",
    question: "Choose two familiar words and use them in a sentence.",
    worked: "Read a short sentence, identify two words, then explain its meaning.",
    exercise: [
      "Match letters with pictures.",
      "Write two simple sentences.",
      "Read a sentence and answer one question.",
    ],
    activity: "Make a Word Garden",
    activityDesc: "Grow a class vocabulary garden with drawings and spoken examples.",
    vocab: ["अक्षर", "शब्द", "वाक्य", "अर्थ"],
    reflect: "Which word helped you explain something today?",
    caseTitle: "Words in Our Community",
    caseDesc: "Notice Hindi words on familiar signs and in conversations.",
    rubric: [
      "I read target letters.",
      "I understand familiar words.",
      "I share a short message clearly.",
    ],
    recap: "Learning a language means noticing, practising and expressing.",
  },
};

/** Get matching subject fixture or fallback to mathematics */
export function getSubjectFixture(subject: string): SubjectFixture {
  const key = subject.toLowerCase().replace(/[^a-z]/g, "");
  if (UNIVERSAL_SUBJECT_FIXTURES[key]) return UNIVERSAL_SUBJECT_FIXTURES[key];
  if (/math/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.mathematics;
  if (/science/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.science;
  if (/english/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.english;
  if (/social|history|geography/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.social;
  if (/evs|environment/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.evs;
  if (/computer|coding/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.computer;
  if (/telugu/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.telugu;
  if (/hindi/i.test(subject)) return UNIVERSAL_SUBJECT_FIXTURES.hindi;
  return UNIVERSAL_SUBJECT_FIXTURES.mathematics;
}

/** 5-Page Reference Archetype Generator */
export interface UniversalArchetypePage {
  id: string;
  type: "cover" | "concept" | "practice" | "explore" | "assessment";
  title: string;
  subtitle: string;
  icon: string;
  blocks: {
    type: UniversalBlockArchetype;
    title: string;
    body: string;
  }[];
}

export function generateUniversal5Pages(subject: string = "mathematics"): UniversalArchetypePage[] {
  const f = getSubjectFixture(subject);
  return [
    {
      id: "page_cover",
      type: "cover",
      title: "Chapter Cover",
      subtitle: "Signature Editorial",
      icon: "◈",
      blocks: [
        { type: "chapter-hero", title: f.chapter, body: f.subtitle },
        { type: "lesson-schema", title: "LESSON SCHEMA", body: [...new Set([f.conceptA, f.conceptB, ...f.vocab])].join("|") },
        { type: "learning-outcomes", title: "LEARNING OUTCOMES", body: f.objective.join("|") },
        { type: "infographic-stats", title: "Three ways to explore", body: f.hero.join("|") },
        { type: "mission-banner", title: "YOUR CHAPTER MISSION", body: f.mission },
      ],
    },
    {
      id: "page_concept",
      type: "concept",
      title: "Learn & Discover",
      subtitle: "Concept Builder",
      icon: "✦",
      blocks: [
        { type: "section-heading", title: f.section, body: f.sectionDesc },
        { type: "learning-outcomes", title: "By the end, you can…", body: f.objective.join("|") },
        { type: "concept-comparison", title: "See the difference", body: `${f.conceptA}|${f.conceptTextA}|${f.conceptB}|${f.conceptTextB}` },
        { type: "key-insight", title: "THE BIG IDEA", body: f.intro },
        { type: "smart-table", title: "Compare & Connect", body: `${f.conceptA}|${f.conceptB}|Think deeply|Observe carefully|Describe clearly|Give an example` },
        { type: "quick-check", title: "CHECK YOUR THINKING", body: f.question },
      ],
    },
    {
      id: "page_practice",
      type: "practice",
      title: "Guided Practice",
      subtitle: "Workbook Grid",
      icon: "✍",
      blocks: [
        { type: "section-heading", title: "Now, try it yourself", body: "Build fluency through worked examples and purposeful practice." },
        { type: "worked-example", title: "LET’S SOLVE ONE TOGETHER", body: f.worked },
        { type: "guided-exercises", title: "Guided practice", body: f.exercise.join("|") },
        { type: "differentiated-paths", title: "Choose your pathway", body: "Start|Grow|Challenge" },
        { type: "answer-workspace", title: "MY THINKING SPACE", body: "Show your method, sketch or working below." },
        { type: "reflection-connect", title: "PAUSE & REFLECT", body: f.reflect },
      ],
    },
    {
      id: "page_explore",
      type: "explore",
      title: "Explore & Apply",
      subtitle: "Discovery Spread",
      icon: "◎",
      blocks: [
        { type: "section-heading", title: "Discover it in real life", body: "Make an authentic connection through observation and hands-on discovery." },
        { type: "activity-lab", title: f.activity, body: f.activityDesc },
        { type: "illustration-diagram", title: "SEE IT DIFFERENTLY", body: "A flexible visual / diagram layer with alt text and print-safe placement." },
        { type: "real-world-case", title: f.caseTitle, body: f.caseDesc },
        { type: "media-qr-companion", title: "WATCH • LISTEN • EXPLORE", body: "Attach an approved school or curriculum media resource." },
        { type: "vocabulary-bank", title: "WORDS WORTH KEEPING", body: f.vocab.join("|") },
        { type: "reflection-connect", title: "MY DISCOVERY", body: f.reflect },
      ],
    },
    {
      id: "page_assessment",
      type: "assessment",
      title: "Mastery Check",
      subtitle: "Assessment Canvas",
      icon: "✓",
      blocks: [
        { type: "section-heading", title: "Show what you know", body: "A well-balanced check of understanding, application and reflection." },
        { type: "assessment-cards", title: "THREE WAYS TO SHOW MASTERY", body: f.exercise.join("|") },
        { type: "mastery-rubric", title: "SELF-CHECK", body: f.rubric.join("|") },
        { type: "chapter-summary", title: "CHAPTER IN A NUTSHELL", body: f.recap },
        { type: "teacher-note", title: "FOR THE FACILITATOR", body: "Use the rubric and student responses to plan targeted feedback." },
        { type: "answer-workspace", title: "MY EXIT TICKET", body: f.reflect },
      ],
    },
  ];
}
