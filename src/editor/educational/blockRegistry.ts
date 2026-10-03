import { EDUCATIONAL_LIBRARY_BLOCKS } from './library/catalog';
import { REFERENCE_BANNER_BLOCKS } from './referenceBanners';
import { PUBLICATION_BLOCKS } from "./publicationCatalog";
import { CURRICULUM_PRESETS, CURRICULUM_BLOCK_MAP } from "../curriculum/catalog";
import { ATELIER_BLOCKS, atelierSkinFor } from "./atelier/catalog";
import {
  EducationalBlockDefinition,
  EducationalBlockCategory,
  SmartBlockInstance,
} from "../../domain/educational/blockSchema";

/**
 * NEX MAXX Book Studio - Educational Block Registry
 * Catalog of 30 Flagship Educational Design Blocks spanning 4 distinct visual families
 * (NEX Future, NEX Play, NEX Editorial, NEX Discovery).
 */

const LEGACY_EDUCATIONAL_BLOCK_REGISTRY: Record<string, EducationalBlockDefinition> = {
  // ================= 1. CHAPTER STRUCTURE =================
  "chapter-launch-future": {
    id: "chapter-launch-future",
    archetypeId: "chapter-structure",
    version: 1,
    name: "Chapter Launch (NEX Future)",
    family: "nex-future",
    category: "chapter-structure",
    supportedSubjects: ["mathematics", "science", "computer-science", "general"],
    supportedGrades: ["middle-school", "secondary-plus", "primary-upper"],
    tags: ["chapter", "opener", "hero", "header", "unit"],
    minDimensions: { widthPt: 360, heightPt: 140 },
    defaultDimensions: { widthPt: 480, heightPt: 160 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      illustrationPosition: "right",
      layoutVariant: "split-hero",
    },
    defaultBackgroundStyle: {
      type: "gradient",
      gradient: { from: "#3730a3", to: "#1e1b4b", directionDeg: 135 },
      cornerRadiusPt: 12,
      patternOverlay: "isometric",
      patternOpacity: 0.15,
      borderWidthPt: 1,
      borderColor: "#6366f1",
    },
    slots: [
      { slotId: "unitBadge", label: "Unit Label", type: "badge", required: true, defaultContent: "UNIT 01: BIOMOLECULAR SYSTEMS" },
      { slotId: "title", label: "Chapter Title", type: "text", required: true, defaultContent: "Chapter 1: The Marvel of Living Cells" },
      { slotId: "subtitle", label: "Subtitle", type: "text", required: false, defaultContent: "Architecture, Organelles & Energy Synthesis" },
      { slotId: "footnote", label: "Learning Duration", type: "text", required: false, defaultContent: "⏱ Estimated 4 Hours • 6 Competencies" },
    ],
  },

  "unit-gateway-editorial": {
    id: "unit-gateway-editorial",
    archetypeId: "chapter-structure",
    version: 1,
    name: "Unit Gateway (NEX Editorial)",
    family: "nex-editorial",
    category: "chapter-structure",
    supportedSubjects: ["english", "social-studies", "general"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["editorial", "gateway", "quote", "literature"],
    minDimensions: { widthPt: 360, heightPt: 130 },
    defaultDimensions: { widthPt: 480, heightPt: 150 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "editorial-quote",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#fff1f2",
      borderWidthPt: 1.5,
      borderColor: "#fecdd3",
      cornerRadiusPt: 4,
    },
    slots: [
      { slotId: "unitBadge", label: "Unit Name", type: "badge", required: true, defaultContent: "LITERATURE & RHETORIC • UNIT II" },
      { slotId: "title", label: "Gateway Title", type: "text", required: true, defaultContent: "The Architecture of Persuasive Discourse" },
      { slotId: "calloutText", label: "Opening Epigraph", type: "rich-text", required: false, defaultContent: "“Words are our most inexhaustible source of magic, capable of both inflicting injury and remedying it.”" },
    ],
  },

  "learning-journey-discovery": {
    id: "learning-journey-discovery",
    archetypeId: "chapter-structure",
    version: 1,
    name: "Learning Journey Pathway (NEX Discovery)",
    family: "nex-discovery",
    category: "chapter-structure",
    supportedSubjects: ["science", "environmental", "social-studies"],
    supportedGrades: ["primary-upper", "middle-school"],
    tags: ["map", "pathway", "roadmap", "trail"],
    minDimensions: { widthPt: 380, heightPt: 85 },
    defaultDimensions: { widthPt: 480, heightPt: 95 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "stepping-pathway",
    },
    defaultBackgroundStyle: {
      type: "subtle-tint",
      color: "#f0fdf4",
      borderWidthPt: 1,
      borderColor: "#86efac",
      cornerRadiusPt: 10,
    },
    slots: [
      { slotId: "title", label: "Journey Title", type: "text", required: true, defaultContent: "Chapter Learning Trail" },
      { slotId: "items", label: "Path Milestones", type: "item-list", required: true, defaultContent: ["Cell Theory", "Organelles", "Chloroplasts", "Cell Division"] },
    ],
  },

  // ================= 2. LEARNING OUTCOMES =================
  "outcomes-cards-play": {
    id: "outcomes-cards-play",
    archetypeId: "learning-outcomes",
    version: 1,
    name: "Success Targets (Color Cards)",
    family: "nex-play",
    category: "learning-outcomes",
    supportedSubjects: ["mathematics", "science", "early-learning", "general"],
    supportedGrades: ["early-years", "primary-lower", "primary-upper"],
    tags: ["outcomes", "goals", "cards", "targets", "checklist"],
    minDimensions: { widthPt: 320, heightPt: 100 },
    defaultDimensions: { widthPt: 480, heightPt: 120 },
    reflowRules: {
      maxItemsBeforeTwoColumns: 4,
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "cards",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#ffffff",
      borderWidthPt: 1.5,
      borderColor: "#fda4af",
      cornerRadiusPt: 14,
    },
    slots: [
      { slotId: "title", label: "Header Title", type: "text", required: true, defaultContent: "SUCCESS TARGETS" },
      { slotId: "subtitle", label: "Intro Prompt", type: "text", required: false, defaultContent: "By the end of this mission, you will be able to:" },
      { slotId: "items", label: "Target List", type: "item-list", required: true, defaultContent: [
        "Identify the primary organelles of a typical plant cell.",
        "Contrast plant cell walls with animal cell membranes.",
        "Explain how chloroplasts capture radiant solar energy.",
        "Diagram the flow of energy during cellular photosynthesis."
      ]},
    ],
  },

  "outcomes-orbit-future": {
    id: "outcomes-orbit-future",
    archetypeId: "learning-outcomes",
    version: 1,
    name: "Learning Orbit (NEX Future)",
    family: "nex-future",
    category: "learning-outcomes",
    supportedSubjects: ["mathematics", "science", "computer-science"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["orbit", "radial", "competencies", "futuristic"],
    minDimensions: { widthPt: 340, heightPt: 110 },
    defaultDimensions: { widthPt: 480, heightPt: 130 },
    reflowRules: {
      maxItemsBeforeTwoColumns: 4,
      verticalGrowthStrategy: "compact-rows",
      layoutVariant: "orbit",
    },
    defaultBackgroundStyle: {
      type: "bordered",
      color: "#0f172a",
      borderColor: "#6366f1",
      borderWidthPt: 1.5,
      cornerRadiusPt: 10,
    },
    slots: [
      { slotId: "title", label: "Orbit Center Label", type: "text", required: true, defaultContent: "MISSION OBJECTIVES" },
      { slotId: "items", label: "Orbital Competencies", type: "item-list", required: true, defaultContent: [
        "Synthesize chemical equations for cellular respiration.",
        "Map ATP molecule transfer across mitochondrial membranes.",
        "Verify cellular respiration rates using respirometer data."
      ]},
    ],
  },

  "outcomes-roadmap-discovery": {
    id: "outcomes-roadmap-discovery",
    archetypeId: "learning-outcomes",
    version: 1,
    name: "Milestone Roadmap (NEX Discovery)",
    family: "nex-discovery",
    category: "learning-outcomes",
    supportedSubjects: ["environmental", "science", "social-studies"],
    supportedGrades: ["primary-upper", "middle-school"],
    tags: ["roadmap", "timeline", "milestones"],
    minDimensions: { widthPt: 340, heightPt: 115 },
    defaultDimensions: { widthPt: 480, heightPt: 135 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "timeline",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#f0fdf4",
      borderWidthPt: 1,
      borderColor: "#86efac",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "LEARNING MILESTONES" },
      { slotId: "items", label: "Milestones", type: "item-list", required: true, defaultContent: [
        "Milestone 1: Recognize water cycle stages in local ecosystems.",
        "Milestone 2: Measure precipitation levels with standard rain gauges.",
        "Milestone 3: Construct sustainable watershed preservation models."
      ]},
    ],
  },

  "outcomes-checklist-editorial": {
    id: "outcomes-checklist-editorial",
    archetypeId: "learning-outcomes",
    version: 1,
    name: "Curriculum Checklist (NEX Editorial)",
    family: "nex-editorial",
    category: "learning-outcomes",
    supportedSubjects: ["english", "social-studies", "general"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["checklist", "clean", "academic", "minimal"],
    minDimensions: { widthPt: 300, heightPt: 80 },
    defaultDimensions: { widthPt: 480, heightPt: 100 },
    reflowRules: {
      maxItemsBeforeTwoColumns: 4,
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "checklist",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#fafaf9",
      borderWidthPt: 1,
      borderColor: "#e7e5e4",
      cornerRadiusPt: 3,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "BY THE END OF THIS LESSON" },
      { slotId: "items", label: "Checklist", type: "item-list", required: true, defaultContent: [
        "Analyze historical accounts from multiple authorial viewpoints.",
        "Differentiate between primary and secondary historical evidence."
      ]},
    ],
  },

  // ================= 3. WARM-UP / BRAIN IGNITER =================
  "warmup-spark-play": {
    id: "warmup-spark-play",
    archetypeId: "warm-up",
    version: 1,
    name: "Spark Starter (NEX Play)",
    family: "nex-play",
    category: "warm-up",
    supportedSubjects: ["mathematics", "science", "early-learning"],
    supportedGrades: ["early-years", "primary-lower", "primary-upper"],
    tags: ["warmup", "starter", "spark", "puzzle", "quick"],
    minDimensions: { widthPt: 240, heightPt: 80 },
    defaultDimensions: { widthPt: 480, heightPt: 95 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "bubble-challenge",
    },
    defaultBackgroundStyle: {
      type: "gradient",
      gradient: { from: "#fff7ed", to: "#fef08a", directionDeg: 120 },
      borderWidthPt: 2,
      borderColor: "#f97316",
      cornerRadiusPt: 14,
    },
    slots: [
      { slotId: "title", label: "Card Header", type: "text", required: true, defaultContent: "⚡ SPARK STARTER" },
      { slotId: "calloutText", label: "Prompt Question", type: "text", required: true, defaultContent: "If a sunflower follows the sun across the sky every day, how does it know where to look before dawn?" },
      { slotId: "footnote", label: "Think Prompt", type: "text", required: false, defaultContent: "💡 Discuss with your partner before turning the page!" },
    ],
  },

  "warmup-igniter-future": {
    id: "warmup-igniter-future",
    archetypeId: "warm-up",
    version: 1,
    name: "Brain Igniter (NEX Future)",
    family: "nex-future",
    category: "warm-up",
    supportedSubjects: ["science", "mathematics", "computer-science"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["brain", "igniter", "challenge", "logic"],
    minDimensions: { widthPt: 240, heightPt: 85 },
    defaultDimensions: { widthPt: 480, heightPt: 100 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "compact-terminal",
    },
    defaultBackgroundStyle: {
      type: "bordered",
      color: "#030712",
      borderWidthPt: 1.5,
      borderColor: "#06b6d4",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "BRAIN IGNITER: VECTOR PARADOX" },
      { slotId: "calloutText", label: "Question", type: "text", required: true, defaultContent: "A boat motors due North at 12 knots across a river flowing East at 5 knots. What is the vessel's actual ground velocity?" },
    ],
  },

  "warmup-recall-editorial": {
    id: "warmup-recall-editorial",
    archetypeId: "warm-up",
    version: 1,
    name: "Recall & Connect (NEX Editorial)",
    family: "nex-editorial",
    category: "warm-up",
    supportedSubjects: ["english", "social-studies", "general"],
    supportedGrades: ["primary-upper", "middle-school"],
    tags: ["recall", "connect", "prerequisite"],
    minDimensions: { widthPt: 260, heightPt: 80 },
    defaultDimensions: { widthPt: 480, heightPt: 95 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "split-recap",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#f8fafc",
      borderWidthPt: 1,
      borderColor: "#cbd5e1",
      cornerRadiusPt: 4,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "RECALL & CONNECT" },
      { slotId: "calloutText", label: "Prerequisite Bridge", type: "text", required: true, defaultContent: "Remember how figurative language gave character to the forest in Chapter 2? Today we explore extended metaphors." },
    ],
  },

  // ================= 4. CONCEPT MAPS =================
  "concept-galaxy-future": {
    id: "concept-galaxy-future",
    archetypeId: "concept-map",
    version: 1,
    name: "Topic Network Galaxy (NEX Future)",
    family: "nex-future",
    category: "concept-map",
    supportedSubjects: ["mathematics", "science", "computer-science"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["concept-map", "galaxy", "network", "nodes", "schema"],
    minDimensions: { widthPt: 360, heightPt: 140 },
    defaultDimensions: { widthPt: 480, heightPt: 160 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "node-network",
    },
    defaultBackgroundStyle: {
      type: "bordered",
      color: "#0f172a",
      borderColor: "#38bdf8",
      borderWidthPt: 1.5,
      cornerRadiusPt: 12,
    },
    slots: [
      { slotId: "title", label: "Central Concept", type: "text", required: true, defaultContent: "CELLULAR ENERGY SYNTHESIS" },
      { slotId: "items", label: "Connected Nodes", type: "item-list", required: true, defaultContent: [
        "Light-Dependent Reactions",
        "Calvin-Benson Cycle",
        "ATP Synthase Coupling",
        "Glucose Phosphorylation"
      ]},
    ],
  },

  "concept-stones-discovery": {
    id: "concept-stones-discovery",
    archetypeId: "concept-map",
    version: 1,
    name: "Stepping Stones Process (NEX Discovery)",
    family: "nex-discovery",
    category: "concept-map",
    supportedSubjects: ["science", "environmental", "social-studies"],
    supportedGrades: ["primary-lower", "primary-upper", "middle-school"],
    tags: ["process", "flowchart", "steps", "timeline"],
    minDimensions: { widthPt: 360, heightPt: 100 },
    defaultDimensions: { widthPt: 480, heightPt: 115 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "horizontal-steps",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#f0fdf4",
      borderWidthPt: 1,
      borderColor: "#4ade80",
      cornerRadiusPt: 10,
    },
    slots: [
      { slotId: "title", label: "Process Title", type: "text", required: true, defaultContent: "THE SCIENTIFIC METHOD JOURNEY" },
      { slotId: "items", label: "Process Steps", type: "item-list", required: true, defaultContent: [
        "1. Observe & Question",
        "2. Formulate Hypothesis",
        "3. Controlled Experiment",
        "4. Draw Evidence Conclusions"
      ]},
    ],
  },

  // ================= 5. WORKED EXAMPLES =================
  "worked-example-steps-future": {
    id: "worked-example-steps-future",
    archetypeId: "worked-examples",
    version: 1,
    name: "Guided Example (4-Step Solution Path)",
    family: "nex-future",
    category: "worked-examples",
    supportedSubjects: ["mathematics", "science", "computer-science"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["example", "math", "solution", "steps", "worked"],
    minDimensions: { widthPt: 360, heightPt: 170 },
    defaultDimensions: { widthPt: 480, heightPt: 200 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "stepped-stages",
    },
    defaultBackgroundStyle: {
      type: "bordered",
      color: "#f8fafc",
      borderWidthPt: 1.5,
      borderColor: "#4338ca",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Example Header", type: "text", required: true, defaultContent: "WORKED EXAMPLE 1.4: QUADRATIC FACTORIZATION" },
      { slotId: "calloutText", label: "Problem Statement", type: "rich-text", required: true, defaultContent: "Solve for x in the equation: 2x² + 7x - 15 = 0" },
      { slotId: "steps", label: "Solution Stages", type: "steps-list", required: true, defaultContent: [
        { stepNumber: 1, title: "Understand", body: "Identify coefficients: a = 2, b = 7, c = -15. Target product a·c = -30." },
        { stepNumber: 2, title: "Decompose", body: "Find factors of -30 that sum to 7: 10 and -3. Rewrite: 2x² + 10x - 3x - 15 = 0." },
        { stepNumber: 3, title: "Factor Group", body: "Factor by grouping: 2x(x + 5) - 3(x + 5) = 0 ⟹ (2x - 3)(x + 5) = 0." },
        { stepNumber: 4, title: "Conclude & Verify", body: "Roots: x = 3/2 or x = -5. Substitute into original equation to confirm." }
      ]},
    ],
  },

  "worked-example-split-editorial": {
    id: "worked-example-split-editorial",
    archetypeId: "worked-examples",
    version: 1,
    name: "See It in Action (Split Method)",
    family: "nex-editorial",
    category: "worked-examples",
    supportedSubjects: ["mathematics", "science", "general"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["example", "split", "editorial", "methods"],
    minDimensions: { widthPt: 360, heightPt: 160 },
    defaultDimensions: { widthPt: 480, heightPt: 190 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "side-by-side",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#ffffff",
      borderWidthPt: 1,
      borderColor: "#cbd5e1",
      cornerRadiusPt: 4,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "SEE IT IN ACTION: RATIO ANALYSIS" },
      { slotId: "calloutText", label: "Problem", type: "text", required: true, defaultContent: "Compare 3:5 and 7:12. Which ratio represents the larger proportion?" },
      { slotId: "steps", label: "Comparative Methods", type: "steps-list", required: true, defaultContent: [
        { stepNumber: 1, title: "Method A (Decimals)", body: "3 ÷ 5 = 0.60; 7 ÷ 12 ≈ 0.583. Therefore 3:5 > 7:12." },
        { stepNumber: 2, title: "Method B (Common Denominator)", body: "3/5 = 36/60; 7/12 = 35/60. Since 36/60 > 35/60, 3:5 is greater." }
      ]},
    ],
  },

  // ================= 6. QUICK CHECKS =================
  "quick-check-pulse-future": {
    id: "quick-check-pulse-future",
    archetypeId: "quick-check",
    version: 1,
    name: "Knowledge Pulse (Rapid MCQ Grid)",
    family: "nex-future",
    category: "quick-check",
    supportedSubjects: ["mathematics", "science", "computer-science"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["quiz", "check", "mcq", "test"],
    minDimensions: { widthPt: 340, heightPt: 130 },
    defaultDimensions: { widthPt: 480, heightPt: 155 },
    reflowRules: {
      maxItemsBeforeTwoColumns: 2,
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "mcq-cards",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#f8fafc",
      borderWidthPt: 1.5,
      borderColor: "#38bdf8",
      cornerRadiusPt: 10,
    },
    slots: [
      { slotId: "title", label: "Quiz Title", type: "text", required: true, defaultContent: "⏱ KNOWLEDGE PULSE (3 MIN CHECK)" },
      { slotId: "questions", label: "Questions", type: "item-list", required: true, defaultContent: [
        { prompt: "Q1. What organelle produces the majority of cellular ATP?", options: ["Ribosome", "Mitochondria", "Golgi Body", "Vacuole"], answer: "B" },
        { prompt: "Q2. True or False: Animal cells possess a rigid cellulose cell wall.", options: ["True", "False"], answer: "B" }
      ]},
    ],
  },

  "quick-check-gotit-play": {
    id: "quick-check-gotit-play",
    archetypeId: "quick-check",
    version: 1,
    name: "Got It? Checkpoint (NEX Play)",
    family: "nex-play",
    category: "quick-check",
    supportedSubjects: ["mathematics", "science", "early-learning", "general"],
    supportedGrades: ["early-years", "primary-lower", "primary-upper"],
    tags: ["got-it", "checkpoint", "fun", "quick"],
    minDimensions: { widthPt: 280, heightPt: 90 },
    defaultDimensions: { widthPt: 480, heightPt: 110 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "comic-bubble",
    },
    defaultBackgroundStyle: {
      type: "gradient",
      gradient: { from: "#fef9c3", to: "#fef08a", directionDeg: 120 },
      borderWidthPt: 2,
      borderColor: "#eab308",
      cornerRadiusPt: 14,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "🌟 GOT IT? QUICK CHECK" },
      { slotId: "calloutText", label: "Question", type: "text", required: true, defaultContent: "Can you name two differences between a square and a rhombus in 10 seconds?" },
    ],
  },

  // ================= 7. ACTIVITIES =================
  "activity-lab-discovery": {
    id: "activity-lab-discovery",
    archetypeId: "activity-lab",
    version: 1,
    name: "Hands-On Lab Challenge (NEX Discovery)",
    family: "nex-discovery",
    category: "activity-lab",
    supportedSubjects: ["science", "environmental", "general"],
    supportedGrades: ["primary-upper", "middle-school"],
    tags: ["lab", "experiment", "activity", "hands-on"],
    minDimensions: { widthPt: 360, heightPt: 160 },
    defaultDimensions: { widthPt: 480, heightPt: 195 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "materials-and-procedure",
    },
    defaultBackgroundStyle: {
      type: "bordered",
      color: "#ffffff",
      borderWidthPt: 2,
      borderColor: "#059669",
      cornerRadiusPt: 12,
    },
    slots: [
      { slotId: "title", label: "Lab Title", type: "text", required: true, defaultContent: "🧪 DISCOVERY LAB: OSMOSIS IN POTATO CELLS" },
      { slotId: "items", label: "Materials Required", type: "item-list", required: true, defaultContent: [
        "2 Raw Potato Cylinders",
        "Distilled Water (100ml)",
        "Concentrated Salt Solution (100ml)",
        "Electronic Balance & Ruler"
      ]},
      { slotId: "calloutText", label: "Procedure Summary", type: "rich-text", required: true, defaultContent: "Submerge one potato cylinder in distilled water and the other in concentrated brine for 45 minutes. Record changes in mass and flexibility." },
    ],
  },

  "activity-inquiry-future": {
    id: "activity-inquiry-future",
    archetypeId: "activity-lab",
    version: 1,
    name: "Inquiry Investigation (NEX Future)",
    family: "nex-future",
    category: "activity-lab",
    supportedSubjects: ["science", "computer-science", "mathematics"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["inquiry", "investigation", "tech", "lab"],
    minDimensions: { widthPt: 340, heightPt: 130 },
    defaultDimensions: { widthPt: 480, heightPt: 155 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "inquiry-box",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#0f172a",
      borderWidthPt: 1.5,
      borderColor: "#818cf8",
      cornerRadiusPt: 10,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "ACTION ZONE: CODE SIMULATION LAB" },
      { slotId: "calloutText", label: "Challenge Prompt", type: "text", required: true, defaultContent: "Adjust the friction coefficient slider from 0.05 to 0.8. Observe the braking distance graph. At what threshold does skid occur?" },
    ],
  },

  // ================= 8. MENTAL MATHS =================
  "mental-maths-gym-future": {
    id: "mental-maths-gym-future",
    archetypeId: "mental-maths",
    version: 1,
    name: "Math Sprint (Number Gym)",
    family: "nex-future",
    category: "mental-maths",
    supportedSubjects: ["mathematics"],
    supportedGrades: ["primary-upper", "middle-school"],
    tags: ["mental", "math", "speed", "sprint", "reflex"],
    minDimensions: { widthPt: 360, heightPt: 110 },
    defaultDimensions: { widthPt: 480, heightPt: 135 },
    reflowRules: {
      maxItemsBeforeTwoColumns: 4,
      verticalGrowthStrategy: "compact-rows",
      layoutVariant: "grid-cards",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#f8fafc",
      borderWidthPt: 1.5,
      borderColor: "#4338ca",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Gym Title", type: "text", required: true, defaultContent: "⚡ NUMBER GYM: 60-SECOND SPRINT" },
      { slotId: "items", label: "Sprint Items", type: "item-list", required: true, defaultContent: [
        "a) 45 × 4 = ___",
        "b) 125 ÷ 5 = ___",
        "c) 15% of 200 = ___",
        "d) 8² - 14 = ___",
        "e) 0.75 + 1.4 = ___",
        "f) 1/3 of 90 = ___"
      ]},
    ],
  },

  "mental-maths-pattern-play": {
    id: "mental-maths-pattern-play",
    archetypeId: "mental-maths",
    version: 1,
    name: "Number Power (Pattern Reflex)",
    family: "nex-play",
    category: "mental-maths",
    supportedSubjects: ["mathematics", "early-learning"],
    supportedGrades: ["early-years", "primary-lower"],
    tags: ["number", "power", "pattern", "playful"],
    minDimensions: { widthPt: 300, heightPt: 90 },
    defaultDimensions: { widthPt: 480, heightPt: 110 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "number-bubbles",
    },
    defaultBackgroundStyle: {
      type: "gradient",
      gradient: { from: "#fce7f3", to: "#fbcfe8", directionDeg: 120 },
      borderWidthPt: 2,
      borderColor: "#db2777",
      cornerRadiusPt: 16,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "🎈 NUMBER POWER: SPOT THE NEXT!" },
      { slotId: "calloutText", label: "Pattern Sequence", type: "text", required: true, defaultContent: "4 ➔ 8 ➔ 16 ➔ 32 ➔ [ ___ ] ➔ [ ___ ]" },
    ],
  },

  // ================= 9. EXERCISES =================
  "exercises-mastery-future": {
    id: "exercises-mastery-future",
    archetypeId: "exercises",
    version: 1,
    name: "Practice Arena (4-Level Mastery Set)",
    family: "nex-future",
    category: "exercises",
    supportedSubjects: ["mathematics", "science", "computer-science"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["exercises", "practice", "mastery", "graded", "levels"],
    minDimensions: { widthPt: 360, heightPt: 180 },
    defaultDimensions: { widthPt: 480, heightPt: 220 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "tiered-levels",
    },
    defaultBackgroundStyle: {
      type: "bordered",
      color: "#ffffff",
      borderWidthPt: 1.5,
      borderColor: "#64748b",
      cornerRadiusPt: 6,
    },
    slots: [
      { slotId: "title", label: "Practice Title", type: "text", required: true, defaultContent: "PRACTICE ARENA: LESSON 3.2" },
      { slotId: "steps", label: "Graded Problem Sets", type: "steps-list", required: true, defaultContent: [
        { stepNumber: 1, title: "Level 1 (Foundation)", body: "1. State the formula for momentum.\n2. Convert 72 km/h into m/s." },
        { stepNumber: 2, title: "Level 2 (Apply)", body: "3. Calculate momentum for a 1200kg automobile traveling at 25 m/s." },
        { stepNumber: 3, title: "Level 3 (Challenge)", body: "4. A 0.05kg ball rebounds elastically off a wall at 30 m/s. Compute impulse." }
      ]},
    ],
  },

  "exercises-drill-editorial": {
    id: "exercises-drill-editorial",
    archetypeId: "exercises",
    version: 1,
    name: "Skill Drill (Two-Column Problem Set)",
    family: "nex-editorial",
    category: "exercises",
    supportedSubjects: ["mathematics", "english", "general"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["drill", "editorial", "twocolumn", "practice"],
    minDimensions: { widthPt: 340, heightPt: 160 },
    defaultDimensions: { widthPt: 480, heightPt: 190 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "two-column-text",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#fafaf9",
      borderWidthPt: 1,
      borderColor: "#e7e5e4",
      cornerRadiusPt: 2,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "EXERCISE SET A: SYNTAX & CLAUSE STRUCTURE" },
      { slotId: "items", label: "Questions", type: "item-list", required: true, defaultContent: [
        "1. Identify the subordinate conjunction in sentence (a).",
        "2. Parse the subject and predicate in sentence (b).",
        "3. Rewrite the passive clause into active present tense."
      ]},
    ],
  },

  // ================= 10. FACTS & CURIOSITY =================
  "facts-capsule-discovery": {
    id: "facts-capsule-discovery",
    archetypeId: "facts-curiosity",
    version: 1,
    name: "Wow Fact (Curiosity Capsule)",
    family: "nex-discovery",
    category: "facts-curiosity",
    supportedSubjects: ["science", "environmental", "social-studies"],
    supportedGrades: ["primary-lower", "primary-upper", "middle-school"],
    tags: ["fact", "wow", "didyouknow", "curiosity"],
    minDimensions: { widthPt: 260, heightPt: 75 },
    defaultDimensions: { widthPt: 480, heightPt: 90 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "capsule-spotlight",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#f0fdf4",
      borderWidthPt: 1.5,
      borderColor: "#10b981",
      cornerRadiusPt: 12,
    },
    slots: [
      { slotId: "title", label: "Fact Badge", type: "text", required: true, defaultContent: "✨ WOW FACT: NATURE'S SOLAR PANELS" },
      { slotId: "calloutText", label: "Fact Text", type: "text", required: true, defaultContent: "A single mature oak tree absorbs over 48 pounds of carbon dioxide per year while producing enough oxygen to support two human beings for a lifetime." },
    ],
  },

  "facts-science-future": {
    id: "facts-science-future",
    archetypeId: "facts-curiosity",
    version: 1,
    name: "Did You Know? (Science Insight)",
    family: "nex-future",
    category: "facts-curiosity",
    supportedSubjects: ["science", "mathematics", "computer-science"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["didyouknow", "science", "insight"],
    minDimensions: { widthPt: 260, heightPt: 80 },
    defaultDimensions: { widthPt: 480, heightPt: 95 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "terminal-card",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#0f172a",
      borderWidthPt: 1,
      borderColor: "#6366f1",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "🔬 DID YOU KNOW?" },
      { slotId: "calloutText", label: "Content", type: "text", required: true, defaultContent: "If all DNA strands inside a single human body were unraveled and connected end-to-end, the strand would stretch from Earth to Pluto and back twice." },
    ],
  },

  // ================= 11. REAL-WORLD APPLICATION =================
  "realworld-lifelink-discovery": {
    id: "realworld-lifelink-discovery",
    archetypeId: "real-world-connect",
    version: 1,
    name: "Real World Connect (Life Link)",
    family: "nex-discovery",
    category: "real-world-connect",
    supportedSubjects: ["science", "mathematics", "environmental"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["realworld", "lifelink", "application", "industry"],
    minDimensions: { widthPt: 320, heightPt: 95 },
    defaultDimensions: { widthPt: 480, heightPt: 115 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "split-card",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#fffbeb",
      borderWidthPt: 1.5,
      borderColor: "#f59e0b",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "🌍 REAL WORLD CONNECT: BIOMIMICRY IN AVIATION" },
      { slotId: "calloutText", label: "Case Story", type: "text", required: true, defaultContent: "Engineers redesigned the high-speed Shinkansen bullet train nose cone by imitating the aerodynamic beak of the kingfisher, eliminating loud tunnel sonic booms." },
    ],
  },

  // ================= 12. CRITICAL THINKING =================
  "critical-thinking-why-editorial": {
    id: "critical-thinking-why-editorial",
    archetypeId: "critical-thinking",
    version: 1,
    name: "Think Deeper (Ask Why?)",
    family: "nex-editorial",
    category: "critical-thinking",
    supportedSubjects: ["social-studies", "science", "english"],
    supportedGrades: ["middle-school", "secondary-plus"],
    tags: ["critical", "thinking", "why", "inquiry"],
    minDimensions: { widthPt: 300, heightPt: 90 },
    defaultDimensions: { widthPt: 480, heightPt: 110 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "question-card",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#fdf4ff",
      borderWidthPt: 1,
      borderColor: "#e879f9",
      cornerRadiusPt: 6,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "🧠 THINK DEEPER: QUESTION THE ASSUMPTIONS" },
      { slotId: "calloutText", label: "Challenge Question", type: "text", required: true, defaultContent: "If market demand increases, prices generally rise. Can you formulate two real-world economic scenarios where increased demand causes prices to drop?" },
    ],
  },

  // ================= 13. COMMON MISTAKES =================
  "common-mistakes-trap-future": {
    id: "common-mistakes-trap-future",
    archetypeId: "common-mistakes",
    version: 1,
    name: "Watch Out! (Common Trap Alert)",
    family: "nex-future",
    category: "common-mistakes",
    supportedSubjects: ["mathematics", "science", "computer-science"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["mistake", "trap", "warning", "watchout"],
    minDimensions: { widthPt: 320, heightPt: 95 },
    defaultDimensions: { widthPt: 480, heightPt: 115 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "comparison-box",
    },
    defaultBackgroundStyle: {
      type: "solid",
      color: "#fff1f2",
      borderWidthPt: 1.5,
      borderColor: "#f43f5e",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Alert Title", type: "text", required: true, defaultContent: "⚠️ WATCH OUT! THE ZERO EXPONENT TRAP" },
      { slotId: "calloutText", label: "Misconception vs Fact", type: "rich-text", required: true, defaultContent: "❌ Mistake: Thinking that 5⁰ = 0.\n✓ Truth: Any non-zero base raised to the power of 0 equals 1 (5⁰ = 1) because aⁿ / aⁿ = a⁰ = 1." },
    ],
  },

  // ================= 14. COLLABORATION =================
  "collaboration-teamquest-play": {
    id: "collaboration-teamquest-play",
    archetypeId: "collaboration",
    version: 1,
    name: "Team Quest (Think-Pair-Share)",
    family: "nex-play",
    category: "collaboration",
    supportedSubjects: ["english", "science", "social-studies", "general"],
    supportedGrades: ["primary-lower", "primary-upper", "middle-school"],
    tags: ["team", "pair", "share", "collaboration", "group"],
    minDimensions: { widthPt: 320, heightPt: 100 },
    defaultDimensions: { widthPt: 480, heightPt: 120 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "three-phase-card",
    },
    defaultBackgroundStyle: {
      type: "gradient",
      gradient: { from: "#ede9fe", to: "#fae8ff", directionDeg: 135 },
      borderWidthPt: 2,
      borderColor: "#8b5cf6",
      cornerRadiusPt: 12,
    },
    slots: [
      { slotId: "title", label: "Title", type: "text", required: true, defaultContent: "👥 TEAM QUEST: THINK-PAIR-SHARE" },
      { slotId: "steps", label: "Stages", type: "steps-list", required: true, defaultContent: [
        { stepNumber: 1, title: "Think (2 mins)", body: "Write your individual answer quietly." },
        { stepNumber: 2, title: "Pair (3 mins)", body: "Compare reasoning with your partner." },
        { stepNumber: 3, title: "Share (5 mins)", body: "Present your combined solution to the classroom." }
      ]},
    ],
  },

  // ================= 15. REVISION & RECAP =================
  "revision-recap-future": {
    id: "revision-recap-future",
    archetypeId: "revision-recap",
    version: 1,
    name: "Chapter in a Minute (Memory Map)",
    family: "nex-future",
    category: "revision-recap",
    supportedSubjects: ["mathematics", "science", "general"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["revision", "recap", "summary", "review"],
    minDimensions: { widthPt: 360, heightPt: 130 },
    defaultDimensions: { widthPt: 480, heightPt: 155 },
    reflowRules: {
      maxItemsBeforeTwoColumns: 4,
      verticalGrowthStrategy: "compact-rows",
      layoutVariant: "summary-grid",
    },
    defaultBackgroundStyle: {
      type: "card",
      color: "#f8fafc",
      borderWidthPt: 1.5,
      borderColor: "#4f46e5",
      cornerRadiusPt: 8,
    },
    slots: [
      { slotId: "title", label: "Header", type: "text", required: true, defaultContent: "🔄 CHAPTER IN A MINUTE: KEY TAKEAWAYS" },
      { slotId: "items", label: "Summary Points", type: "item-list", required: true, defaultContent: [
        "1. Cells are the fundamental structural and functional units of living things.",
        "2. Prokaryotes lack membrane-bound nuclei; eukaryotes contain compartmentalized organelles.",
        "3. Mitochondria synthesize ATP via oxidative phosphorylation.",
        "4. Chloroplasts harness solar photons to generate organic glucose molecules."
      ]},
    ],
  },

  // ================= 16. AI & DIGITAL EXTENSION (QR READY) =================
  "ai-explore-smart-future": {
    id: "ai-explore-smart-future",
    archetypeId: "ai-explore",
    version: 1,
    name: "Ask NEX (Smart Explorer & QR)",
    family: "nex-future",
    category: "ai-explore",
    supportedSubjects: ["science", "mathematics", "computer-science", "general"],
    supportedGrades: ["primary-upper", "middle-school", "secondary-plus"],
    tags: ["ai", "nex", "qr", "interactive", "digital", "simulation"],
    minDimensions: { widthPt: 340, heightPt: 95 },
    defaultDimensions: { widthPt: 480, heightPt: 115 },
    reflowRules: {
      verticalGrowthStrategy: "expand-container",
      layoutVariant: "qr-split",
    },
    defaultBackgroundStyle: {
      type: "gradient",
      gradient: { from: "#0f172a", to: "#1e1b4b", directionDeg: 120 },
      borderWidthPt: 1.5,
      borderColor: "#818cf8",
      cornerRadiusPt: 12,
    },
    slots: [
      { slotId: "title", label: "Card Title", type: "text", required: true, defaultContent: "🤖 ASK NEX: INTERACTIVE SIMULATION" },
      { slotId: "calloutText", label: "Prompt", type: "text", required: true, defaultContent: "Scan to explore 3D cellular organelle models and run live enzyme rate simulations on the NEX MAXX Student Companion." },
      { slotId: "qrUrl", label: "Target URL", type: "qr-code", required: true, defaultContent: "https://nexmaxx.edu/explore/cells-3d" },
    ],
  },
};

export const EDUCATIONAL_BLOCK_REGISTRY = { ...PUBLICATION_BLOCKS, ...ATELIER_BLOCKS, ...LEGACY_EDUCATIONAL_BLOCK_REGISTRY, ...CURRICULUM_PRESETS, ...EDUCATIONAL_LIBRARY_BLOCKS, ...REFERENCE_BANNER_BLOCKS };

/**
 * Helper to query available block presets by archetype
 */
export function getPresetsByArchetype(archetype: EducationalBlockCategory): EducationalBlockDefinition[] {
  return Object.values(EDUCATIONAL_BLOCK_REGISTRY).filter((p) => p.archetypeId === archetype);
}

/**
 * Instantiates a concrete SmartBlockInstance from a definition
 */
export function createSmartBlockInstance(
  definitionId: string,
  pageId: string,
  initialX: number = 54,
  initialY: number = 120
): SmartBlockInstance | null {
  const def = EDUCATIONAL_BLOCK_REGISTRY[definitionId];
  if (!def) return null;

  // Extract semantic content from definition default slots
  const semanticContent: SmartBlockInstance["semanticContent"] = {
    title: def.name,
  };

  def.slots.forEach((slot) => {
    // Deep clone nested questions/steps: an instance never owns registry objects.
    (semanticContent as unknown as Record<string, unknown>)[slot.slotId] = JSON.parse(JSON.stringify(slot.defaultContent));
  });

  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...(definitionId.startsWith("curriculum-") ? { curriculum: {
      type: definitionId.slice(11), frameworkStage: CURRICULUM_BLOCK_MAP[definitionId.slice(11)].stage,
      grade: 3 as const, subjectLabel: "Custom", learningOutcomeIds: [], difficulty: "build" as const,
      hierarchy: "primary" as const, pageRules: { keepTogether: true },
    } } : {}),
    pageId,
    archetypeId: def.archetypeId,
    presetId: def.id,
    family: def.family,
    subject: def.supportedSubjects[0] || "general",
    gradeBand: def.supportedGrades[0] || "primary-upper",
    isDetached: false,
    isLockedContent: false,
    isLockedDesign: false,
    transform: {
      x: initialX,
      y: initialY,
      width: def.defaultDimensions.widthPt,
      height: def.defaultDimensions.heightPt,
      rotation: 0,
      zIndex: 10,
    },
    semanticContent,
    styleOverrides: def.skinId ? {
      paletteId: atelierSkinFor(def.skinId)?.defaultPaletteId,
      motifs: JSON.parse(JSON.stringify(atelierSkinFor(def.skinId)?.defaultMotifs?.(def.defaultDimensions.widthPt) || [])),
    } : {},
  };
}
