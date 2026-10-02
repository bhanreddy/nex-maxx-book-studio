/**
 * NEX MAXX Book Studio - Smart Components Factory
 * 
 * First-class structured components for the 10 educational publishing essentials:
 * 1. Learning Outcomes
 * 2. Activity
 * 3. Quick Check
 * 4. Think (Critical Thinking)
 * 5. Vocabulary
 * 6. Fun Fact (Fact Zone)
 * 7. Worked Example
 * 8. Practice
 * 9. QR / Video Companion
 * 10. Assessment
 * 
 * Features automatic content-driven resizing and reusable visual variants.
 */

import { PageElement } from "../../domain/element/types";
import { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { EDUCATIONAL_BLOCK_REGISTRY, createSmartBlockInstance } from "./blockRegistry";
import { buildPublicationScene } from "./publicationScene";
import { smartQrPresets, type SmartQrData } from "../media/smartQr";

export type SmartComponentType =
  | "learning-outcomes"
  | "activity"
  | "quick-check"
  | "think"
  | "vocabulary"
  | "fun-fact"
  | "worked-example"
  | "practice"
  | "qr-video"
  | "assessment";

export type SmartComponentVariant =
  | "card"
  | "pill"
  | "3d-ribbon"
  | "bento"
  | "minimal-editorial";

export interface SmartComponentDescriptor {
  type: SmartComponentType;
  title: string;
  category: string;
  icon: string;
  description: string;
  variants: SmartComponentVariant[];
  defaultVariant: SmartComponentVariant;
  defaultHeight: number;
}

export const SMART_COMPONENTS_CATALOG: SmartComponentDescriptor[] = [
  {
    type: "learning-outcomes",
    title: "Learning Outcomes",
    category: "Structure & Targets",
    icon: "Target",
    description: "Clear success criteria chips with checkmarks and mastery targets.",
    variants: ["card", "pill", "3d-ribbon", "minimal-editorial"],
    defaultVariant: "card",
    defaultHeight: 110,
  },
  {
    type: "activity",
    title: "Hands-on Activity",
    category: "Experiential Lab",
    icon: "FlaskConical",
    description: "3-phase Plan • Do • Share lab activity with materials list and reflection.",
    variants: ["card", "bento", "minimal-editorial"],
    defaultVariant: "card",
    defaultHeight: 160,
  },
  {
    type: "quick-check",
    title: "Quick Check",
    category: "Diagnostic Practice",
    icon: "CheckCircle2",
    description: "Targeted question callout with student response line and question pill.",
    variants: ["pill", "card", "minimal-editorial"],
    defaultVariant: "pill",
    defaultHeight: 90,
  },
  {
    type: "think",
    title: "Think & Reflect",
    category: "Critical Thinking",
    icon: "Brain",
    description: "Deep enquiry prompt with glowing thought badge and ruled reflection space.",
    variants: ["card", "pill", "3d-ribbon"],
    defaultVariant: "card",
    defaultHeight: 110,
  },
  {
    type: "vocabulary",
    title: "Vocabulary Bank",
    category: "Language & Concepts",
    icon: "BookOpen",
    description: "Key terminology tags with pronunciation hints and concise definitions.",
    variants: ["bento", "pill", "card"],
    defaultVariant: "bento",
    defaultHeight: 120,
  },
  {
    type: "fun-fact",
    title: "Fun Fact / Curiosity",
    category: "Wonder & Facts",
    icon: "Sparkles",
    description: "Curiosity callout pill with 3D medallion and unforgettable concept trivia.",
    variants: ["3d-ribbon", "pill", "card"],
    defaultVariant: "3d-ribbon",
    defaultHeight: 95,
  },
  {
    type: "worked-example",
    title: "Worked Example",
    category: "Scaffolded Learning",
    icon: "FileSpreadsheet",
    description: "Scaffolded problem solving with Notice, Reason, and Conclude steps.",
    variants: ["card", "bento", "minimal-editorial"],
    defaultVariant: "card",
    defaultHeight: 170,
  },
  {
    type: "practice",
    title: "Practice Exercises",
    category: "Skill Drills",
    icon: "Pencil",
    description: "Graduated exercises with question numbering and structured answer lines.",
    variants: ["card", "minimal-editorial", "bento"],
    defaultVariant: "minimal-editorial",
    defaultHeight: 180,
  },
  {
    type: "qr-video",
    title: "QR / Video Companion",
    category: "Multimedia",
    icon: "QrCode",
    description: "Print-safe scannable QR companion linking to curriculum video or simulation.",
    variants: ["card", "pill", "bento"],
    defaultVariant: "card",
    defaultHeight: 105,
  },
  {
    type: "assessment",
    title: "Assessment & Rubric",
    category: "Evaluation",
    icon: "Award",
    description: "Multi-level mastery check with 3-tier rubric and student scoring dots.",
    variants: ["card", "bento", "minimal-editorial"],
    defaultVariant: "card",
    defaultHeight: 190,
  },
];

/**
 * Creates a fully configured PageElement for one of the 10 smart components
 */
export function createSmartComponentElement(
  type: SmartComponentType,
  pageId: string,
  options: {
    x?: number;
    y?: number;
    width?: number;
    variant?: SmartComponentVariant;
    subject?: string;
    grade?: string;
    customTitle?: string;
    customContent?: Partial<SmartBlockInstance["semanticContent"]>;
    smartMediaQr?: SmartQrData;
  } = {}
): PageElement {
  const descriptor = SMART_COMPONENTS_CATALOG.find((c) => c.type === type) || SMART_COMPONENTS_CATALOG[0];
  const width = options.width || 480;
  const x = options.x ?? 42;
  const y = options.y ?? 60;
  const variant = options.variant || descriptor.defaultVariant;

  const id = `smart-${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

  if (type === 'qr-video') {
    const preset = smartQrPresets['preset-smart-qr-compact-learning'];
    return { id, pageId, type: 'smart-media-qr', category: 'media', version: 1,
      displayName: descriptor.title, locked: false, hidden: false,
      transform: { x, y, width, height: 190, rotation: 0, zIndex: 10 },
      style: { ...preset.defaultStyle },
      content: { ...structuredClone(preset.defaultContent), ...(options.smartMediaQr ? { smartMediaQr: structuredClone(options.smartMediaQr) } : {}) },
      semanticConstraints: { keepTogether: true, safeMargin: true },
      metadata: { tags: ['smart-component', type] },
    };
  }

  // Archetype mapping to educational block system
  const archetypeMap: Record<SmartComponentType, string> = {
    "learning-outcomes": "learning-outcomes",
    activity: "activity-lab",
    "quick-check": "quick-check",
    think: "critical-thinking",
    vocabulary: "vocabulary",
    "fun-fact": "facts-curiosity",
    "worked-example": "worked-examples",
    practice: "exercises",
    "qr-video": "ai-explore",
    assessment: "assessment-mastery",
  };

  const archetype = archetypeMap[type];

  // Build semantic content based on component type
  let contentText = "";
  let items: string[] = [];

  switch (type) {
    case "learning-outcomes":
      contentText = options.customTitle || "By the end of this lesson, you will be able to:";
      items = [
        "Identify and analyze key patterns accurately",
        "Apply standard problem-solving strategies in context",
        "Explain mathematical reasoning clearly using visual models",
      ];
      break;

    case "activity":
      contentText = options.customTitle || "Investigate: Making Numbers Tangible";
      items = [
        "Plan: Gather measuring tools and record your initial predictions",
        "Do: Test three distinct objects and record the measurements",
        "Share: Compare your findings with a classmate and explain any differences",
      ];
      break;

    case "quick-check":
      contentText = options.customTitle || "Check your understanding: In the number 45,670, what is the place value of 5?";
      items = ["Write your answer: ____________________"];
      break;

    case "think":
      contentText = options.customTitle || "Think Deeply: Why does moving a digit one place to the left multiply its value by 10?";
      items = ["Record your thoughts and draw a sketch below:"];
      break;

    case "vocabulary":
      contentText = options.customTitle || "Keywords to Remember";
      items = [
        "Place Value — The value represented by a digit in a number based on its position",
        "Expanded Form — A way of writing a number to show the math value of each digit",
        "Estimate — To find a value close to the right answer using rounding",
      ];
      break;

    case "fun-fact":
      contentText = options.customTitle || "Did You Know?";
      items = [
        "The number zero (0) was invented in ancient India by mathematician Brahmagupta!",
        "A googol is the number 1 followed by 100 zeros.",
      ];
      break;

    case "worked-example":
      contentText = options.customTitle || "Worked Example: Step-by-Step";
      items = [
        "Step 01 • Notice: Look at the digits and identify their place positions.",
        "Step 02 • Reason: Expand 3,00,000 + 40,000 + 5,000 + 200 + 10 + 6.",
        "Step 03 • Conclude: The standard numeral is 3,45,216.",
      ];
      break;

    case "practice":
      contentText = options.customTitle || "Practice Problems";
      items = [
        "1. Write 8,92,450 in expanded notation.",
        "2. Compare 4,52,190 and 4,25,190 using > or <.",
        "3. Round 67,842 to the nearest thousand.",
      ];
      break;

    case "assessment":
      contentText = options.customTitle || "Show Your Mastery";
      items = [
        "Question 1 • Recall: Define place value in your own words. [2 Marks]",
        "Question 2 • Apply: Solve the real-world rounding scenario. [3 Marks]",
        "Question 3 • Explain: Justify why zero acts as a place-holder. [5 Marks]",
      ];
      break;
  }

  // Use registered presets and their canonical slots; never manufacture preset IDs.
  const definitions = Object.values(EDUCATIONAL_BLOCK_REGISTRY).filter(def => def.archetypeId === archetype);
  const definition = definitions.find(def => def.id.startsWith('publication-')) || definitions[0];
  if (!definition) throw new Error(`No registered preset for ${type}`);
  const smartBlockData = createSmartBlockInstance(definition.id, pageId, x, y)!;
  smartBlockData.transform.width = width;
  smartBlockData.semanticContent = { title: contentText, items };
  if (type === 'worked-example' || type === 'activity') {
    smartBlockData.semanticContent.steps = items.map((body, index) => ({ stepNumber: index + 1, title: `Step ${index + 1}`, body }));
    delete smartBlockData.semanticContent.items;
  }
  if (type === 'practice' || type === 'assessment' || type === 'quick-check') {
    smartBlockData.semanticContent.questions = items.map(prompt => ({ prompt }));
    delete smartBlockData.semanticContent.items;
  }
  if (options.customContent) smartBlockData.semanticContent = { ...smartBlockData.semanticContent, ...structuredClone(options.customContent) };
  const layoutVariants: Record<SmartComponentVariant, string> = { card: 'checklist', pill: 'spotlight', '3d-ribbon': 'ribbon', bento: 'tiles', 'minimal-editorial': 'sidebar' };
  smartBlockData.styleOverrides = { ...smartBlockData.styleOverrides, layoutVariant: layoutVariants[variant] };
  const scene = buildPublicationScene(smartBlockData);
  smartBlockData.transform.height = scene.height;

  return {
    id,
    pageId,
    type: "smart-block",
    category: "educational",
    version: 1,
    displayName: descriptor.title,
    transform: { ...smartBlockData.transform },
    style: {
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      borderRadius: variant === "pill" ? 16 : 8,
    },
    content: {
      title: contentText,
      items,
      variant,
      smartComponentType: type,
    },
    smartBlockData,
    locked: false,
    hidden: false,
    semanticConstraints: {
      keepTogether: true,
      minHeightPt: 60,
      safeMargin: true,
    },
    metadata: {
      tags: ["smart-component", type, variant],
    },
  };
}
