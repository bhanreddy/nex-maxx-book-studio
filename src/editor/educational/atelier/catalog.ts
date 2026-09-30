import type { BlockMotif, DesignFamily, EducationalBlockCategory, EducationalBlockDefinition } from "../../../domain/educational/blockSchema";
import type { SmartBlockInstance } from "../../../domain/educational/blockSchema";
import { PUBLICATION_CATALOG, PUBLICATION_SAMPLES } from "../publicationCatalog";
import type { SkinContext, UsedFields } from "./draw";
import { SIGNATURE_LAYOUTS, signatureLayout } from "./skins/signature";
import { panoramaGate, topicRibbon, unitMasthead } from "./skins/openers";
import { constellationMap, milestoneTrail } from "./skins/maps";
import { iCanCards, promiseBanner } from "./skins/outcomes";
import { beadTheatre, placeStack, speechExample } from "./skins/numbers";
import { lightningLane, makersBench, practicePath, pulseCheck, showWhatYouKnow, stepLadder, strategyPanel } from "./skins/practice";
import { lensSplit, orderLadder, readinessStrip, slipAndRepair, sparkPrompt, stationBoard, whoAmI, wonderWindow, wordTiles } from "./skins/play";
import { bigPicture, chromePanel, exitSlip, journalSkin, type Chrome } from "./skins/close";

export interface AtelierSkin {
  id: string;
  publicName: string;
  purpose: EducationalBlockCategory;
  blurb: string;
  defaultPaletteId: string;
  family: DesignFamily;
  tags: string[];
  compose: (ctx: SkinContext) => { height: number; used: UsedFields };
  content?: Partial<SmartBlockInstance["semanticContent"]>;
  defaultMotifs?: (width: number) => BlockMotif[];
}

const purposeTitle = Object.fromEntries(PUBLICATION_CATALOG.map(([id, title]) => [id, title])) as Record<string, string>;

function scenery(kind: string, width: number, y = 64): BlockMotif[] {
  return [{ id: "plate-scenery", role: "illustration", kind, x: Math.max(12, width - 128), y, w: 112, h: 68, rotation: 0, locked: false, opacity: .72, originWidth: width, behind: true }];
}
const panel = (chrome: Chrome) => (ctx: SkinContext) => chromePanel(ctx, chrome);

export const ATELIER_SKIN_LIST: AtelierSkin[] = [
  ...SIGNATURE_LAYOUTS.map((layout, index): AtelierSkin => ({
    id: `atelier-${layout.id}`, publicName: layout.name, purpose: (["investigation", "reading-response", "learning-outcomes", "worked-examples", "essential-question", "concept-explanation", "revision-recap", "activity-lab"] as const)[index],
    blurb: layout.description, defaultPaletteId: ["forest", "plum", "ocean", "cobalt", "apricot", "ink", "marigold", "forest"][index],
    family: (["nex-discovery", "nex-studio", "nex-spectrum", "nex-future", "nex-play", "nex-editorial", "nex-play", "nex-discovery"] as const)[index],
    tags: ["signature", "all subjects", "language", "art", "history", "geography", "science", layout.id],
    compose: ctx => signatureLayout(ctx, layout.id),
    content: {
      title: ["Small wonders, big discoveries", "Every story opens a door", "Today, I can…", "One step at a time", "What if we looked closer?", "Ideas worth exploring", "A passport to discovery", "Make. Test. Imagine."][index],
      unitBadge: "EXPLORE • CONNECT • CREATE", subtitle: "A little curiosity can lead to a great idea.",
      items: ["Notice: look closely and describe what you find.", "Connect: link a new idea to something you already know.", "Create: show your understanding in your own way.", "Reflect: what changed in your thinking?"],
      footnote: "Your turn · Write, draw, discuss, or demonstrate your discovery.",
    },
  })),
  { id: "atelier-unit-masthead", publicName: "Unit Masthead", purpose: "chapter-structure", blurb: "Circled numeral, unit chip, and a display title.", defaultPaletteId: "indigo", family: "nex-spectrum", tags: ["chapter", "header", "unit", "opener"], compose: unitMasthead, defaultMotifs: w => scenery("waves", w, 36) },
  { id: "atelier-panorama-gate", publicName: "Panorama Gate", purpose: "unit-opening", blurb: "A colour landscape with the title on a paper card.", defaultPaletteId: "ocean", family: "nex-discovery", tags: ["unit", "opening", "panorama"], compose: panoramaGate, defaultMotifs: w => scenery("waves", w, 150) },
  { id: "atelier-topic-ribbon", publicName: "Topic Ribbon", purpose: "section-heading", blurb: "A thick ribbon with a contrasting section chip.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["heading", "section", "ribbon"], compose: topicRibbon },
  { id: "atelier-constellation-map", publicName: "Constellation Map", purpose: "concept-map", blurb: "A lesson schema: coloured capsules around a hub.", defaultPaletteId: "indigo", family: "nex-spectrum", tags: ["lesson schema", "mind map", "concept map"], compose: constellationMap, defaultMotifs: w => scenery("geometry", w, 28) },
  { id: "atelier-milestone-trail", publicName: "Milestone Trail", purpose: "concept-map", blurb: "Numbered stepping stones for a narrow column.", defaultPaletteId: "forest", family: "nex-discovery", tags: ["lesson schema", "pathway", "trail"], compose: milestoneTrail },
  { id: "atelier-promise-banner", publicName: "Promise Banner", purpose: "learning-outcomes", blurb: "A full-width outcomes band with diamond rows.", defaultPaletteId: "forest", family: "nex-discovery", tags: ["learning outcomes", "objectives", "i can"], compose: promiseBanner },
  { id: "atelier-i-can-cards", publicName: "I Can Cards", purpose: "learning-outcomes", blurb: "Separate cards with a verb chip on each target.", defaultPaletteId: "forest", family: "nex-play", tags: ["learning outcomes", "targets", "cards"], compose: iCanCards },
  { id: "atelier-place-stack", publicName: "Place Stack", purpose: "warm-up", blurb: "Stacked place plates, digit tiles, and leader callouts.", defaultPaletteId: "apricot", family: "nex-play", tags: ["warm-up", "warmup", "place value"], compose: placeStack, defaultMotifs: w => scenery("number-city", w, 48) },
  { id: "atelier-spark-prompt", publicName: "Spark Prompt", purpose: "warm-up", blurb: "Recall and predict, then the starter questions.", defaultPaletteId: "apricot", family: "nex-play", tags: ["warm-up", "warmup", "starter"], compose: sparkPrompt },
  { id: "atelier-readiness-strip", publicName: "Readiness Strip", purpose: "prerequisites", blurb: "A short before-we-begin band.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["prerequisites", "recall"], compose: readinessStrip },
  { id: "atelier-question-spotlight", publicName: "Question Spotlight", purpose: "essential-question", blurb: "One big question held in a coloured window.", defaultPaletteId: "plum", family: "nex-studio", tags: ["essential question", "big question"], compose: panel("window") },
  { id: "atelier-lens-split", publicName: "Lens Split", purpose: "concept-explanation", blurb: "Place value and face value on two named plates.", defaultPaletteId: "ocean", family: "nex-spectrum", tags: ["concept", "explain", "place value", "face value"], compose: lensSplit },
  { id: "atelier-word-tiles", publicName: "Word Tiles", purpose: "vocabulary", blurb: "Term, meaning, and a colour rail for each word.", defaultPaletteId: "plum", family: "nex-studio", tags: ["vocabulary", "word"], compose: wordTiles },
  { id: "atelier-strategy-panel", publicName: "Strategy Panel", purpose: "study-skills", blurb: "A study-skills tab and numbered steps on ruled paper.", defaultPaletteId: "marigold", family: "nex-editorial", tags: ["study skills", "strategy", "toolkit"], compose: strategyPanel, defaultMotifs: w => scenery("dot-grid", w, 36) },
  { id: "atelier-speech-example", publicName: "Speech Example", purpose: "worked-examples", blurb: "A worked number with draggable speech bubbles.", defaultPaletteId: "cobalt", family: "nex-spectrum", tags: ["example", "worked example", "speech"], compose: speechExample, defaultMotifs: w => scenery("number-city", w, 40) },
  { id: "atelier-step-ladder", publicName: "Step Ladder", purpose: "worked-examples", blurb: "Numbered rungs, with the check rung in green.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["worked example", "steps"], compose: stepLadder },
  { id: "atelier-guided-ladder", publicName: "Guided Ladder", purpose: "guided-practice", blurb: "The same rung structure for fading support.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["guided practice", "scaffold"], compose: stepLadder },
  { id: "atelier-pulse-check", publicName: "Pulse Check", purpose: "quick-check", blurb: "Numbered question cards and a confidence line.", defaultPaletteId: "marigold", family: "nex-studio", tags: ["quick check", "checkpoint"], compose: pulseCheck },
  { id: "atelier-lightning-lane", publicName: "Lightning Lane", purpose: "mental-maths", blurb: "Compact tiles with room for a shortcut.", defaultPaletteId: "plum", family: "nex-play", tags: ["mental maths", "mental math", "fluency"], compose: lightningLane },
  { id: "atelier-makers-bench", publicName: "Maker's Bench", purpose: "activity-lab", blurb: "A materials tray, method cards, and a reflection.", defaultPaletteId: "forest", family: "nex-discovery", tags: ["activity", "lab", "experiment"], compose: makersBench, defaultMotifs: w => scenery("botanical", w, 48) },
  { id: "atelier-station-board", publicName: "Station Board", purpose: "collaboration", blurb: "Connected plates for a team task.", defaultPaletteId: "plum", family: "nex-studio", tags: ["collaboration", "team"], compose: stationBoard },
  { id: "atelier-partner-board", publicName: "Partner Board", purpose: "partner-activity", blurb: "Think, pair, and share as three linked plates.", defaultPaletteId: "ocean", family: "nex-studio", tags: ["partner", "think pair share"], compose: stationBoard },
  { id: "atelier-field-notes", publicName: "Field Notes", purpose: "investigation", blurb: "A notebook page for predict, test, and explain.", defaultPaletteId: "forest", family: "nex-discovery", tags: ["investigation", "inquiry"], compose: journalSkin },
  { id: "atelier-order-ladder", publicName: "Order Ladder", purpose: "visual-reasoning", blurb: "Same and different columns, then ascending order.", defaultPaletteId: "indigo", family: "nex-spectrum", tags: ["compare", "order", "ascending"], compose: orderLadder },
  { id: "atelier-slip-repair", publicName: "Slip and Repair", purpose: "common-mistakes", blurb: "The slip in terracotta, the repair in green.", defaultPaletteId: "ink", family: "nex-editorial", tags: ["mistakes", "misconception"], compose: slipAndRepair },
  { id: "atelier-claim-board", publicName: "Claim Board", purpose: "critical-thinking", blurb: "A stamp header for claim, evidence, and reason.", defaultPaletteId: "ink", family: "nex-editorial", tags: ["critical thinking", "reasoning"], compose: panel("stamp") },
  { id: "atelier-bridge-card", publicName: "Bridge Card", purpose: "real-world-connect", blurb: "A ribbon for a situation beyond the page.", defaultPaletteId: "ocean", family: "nex-discovery", tags: ["real world", "application"], compose: panel("ribbon") },
  { id: "atelier-wonder-window", publicName: "Wonder Window", purpose: "facts-curiosity", blurb: "A side window for one fact and one question.", defaultPaletteId: "plum", family: "nex-play", tags: ["curiosity", "fact", "wonder"], compose: wonderWindow },
  { id: "atelier-who-am-i", publicName: "Who Am I", purpose: "puzzles-fun", blurb: "Clue capsules and an answer plate.", defaultPaletteId: "plum", family: "nex-play", tags: ["puzzle", "game", "who am i"], compose: whoAmI },
  { id: "atelier-stretch-card", publicName: "Stretch Card", purpose: "extension", blurb: "An open challenge on a quiet stamp card.", defaultPaletteId: "marigold", family: "nex-future", tags: ["extension", "challenge"], compose: panel("stamp") },
  { id: "atelier-practice-path", publicName: "Practice Path", purpose: "exercises", blurb: "Build, apply, and explain, then the questions.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["exercise", "practice"], compose: practicePath },
  { id: "atelier-show-what-you-know", publicName: "Show What You Know", purpose: "assessment-mastery", blurb: "Questions with a mark chip and writing lines.", defaultPaletteId: "cobalt", family: "nex-editorial", tags: ["assessment", "mastery", "test"], compose: showWhatYouKnow },
  { id: "atelier-progress-journal", publicName: "Progress Journal", purpose: "self-assessment", blurb: "A notebook for skill, evidence, and next step.", defaultPaletteId: "ink", family: "nex-editorial", tags: ["self assessment", "progress"], compose: journalSkin },
  { id: "atelier-journal", publicName: "Reflection Journal", purpose: "reflection", blurb: "Warm paper, a kicker, and writing rules.", defaultPaletteId: "ink", family: "nex-editorial", tags: ["reflection", "journal"], compose: journalSkin },
  { id: "atelier-exit-slip", publicName: "Exit Slip", purpose: "exit-ticket", blurb: "One solve line and one wonder line.", defaultPaletteId: "marigold", family: "nex-studio", tags: ["exit ticket", "before you go"], compose: exitSlip },
  { id: "atelier-big-picture", publicName: "Big Picture", purpose: "revision-recap", blurb: "Four recap tiles around the chapter idea.", defaultPaletteId: "indigo", family: "nex-spectrum", tags: ["revision", "recap", "summary"], compose: bigPicture },
  { id: "atelier-project-brief", publicName: "Project Brief", purpose: "projects", blurb: "A ribbon brief for collect, represent, and present.", defaultPaletteId: "forest", family: "nex-discovery", tags: ["project"], compose: panel("ribbon") },
  { id: "atelier-connected-learning", publicName: "Connected Learning", purpose: "cross-subject", blurb: "Two subjects on one bridge card.", defaultPaletteId: "ocean", family: "nex-discovery", tags: ["cross subject", "integration"], compose: panel("ribbon") },
  { id: "atelier-home-journal", publicName: "Home Journal", purpose: "home-learning", blurb: "A take-home notebook page.", defaultPaletteId: "ink", family: "nex-editorial", tags: ["home", "family"], compose: journalSkin },
  { id: "atelier-diagram-prompt", publicName: "Diagram Prompt", purpose: "diagram-study", blurb: "A window for observe, label, and explain.", defaultPaletteId: "ocean", family: "nex-future", tags: ["diagram", "label"], compose: panel("window") },
  { id: "atelier-evidence-cards", publicName: "Evidence Cards", purpose: "data-interpretation", blurb: "Data kept on a stamp card before the questions.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["data", "evidence"], compose: panel("stamp") },
  { id: "atelier-reading-journal", publicName: "Reading Journal", purpose: "reading-response", blurb: "A notebook for the passage and the response.", defaultPaletteId: "ink", family: "nex-editorial", tags: ["reading", "response"], compose: journalSkin },
  { id: "atelier-explore-panel", publicName: "Explore Panel", purpose: "ai-explore", blurb: "A side window for a verified next step.", defaultPaletteId: "cobalt", family: "nex-future", tags: ["explore", "resource"], compose: panel("window") },
  { id: "atelier-place-chart", publicName: "Place Chart", purpose: "place-value", blurb: "The place stack for a single number.", defaultPaletteId: "ocean", family: "nex-spectrum", tags: ["place value", "chart", "expanded"], compose: placeStack, defaultMotifs: w => scenery("number-city", w, 52) },
  { id: "atelier-bead-theatre", publicName: "Bead Theatre", purpose: "abacus", blurb: "Coloured rods and beads driven by the number.", defaultPaletteId: "ocean", family: "nex-discovery", tags: ["abacus", "beads", "build a number"], compose: beadTheatre, defaultMotifs: w => scenery("geometry", w, 210) },
];

const overrides: Record<string, Partial<SmartBlockInstance["semanticContent"]>> = {
  "atelier-place-stack": {
    numberValue: 7927,
    items: [
      "7 is in the ones place. It has a place value of 7.",
      "2 is in the tens place. It has a place value of 20.",
      "9 is in the hundreds place. It has a place value of 900.",
      "7 is in the thousands place. It has a place value of 7,000.",
    ],
  },
  "atelier-speech-example": {
    numberValue: 21496,
    items: ["The digit 4 stands for 400.", "The digit 2 is in the ten thousands place."],
  },
};

function defineBlock(skin: AtelierSkin): EducationalBlockDefinition {
  const sample = PUBLICATION_SAMPLES[skin.purpose] || {};
  const content: SmartBlockInstance["semanticContent"] = {
    title: purposeTitle[skin.purpose] || skin.publicName,
    ...(skin.content || sample),
    ...overrides[skin.id],
  };
  return {
    id: skin.id,
    archetypeId: skin.purpose,
    category: skin.purpose,
    name: skin.publicName,
    description: skin.blurb,
    family: skin.family,
    version: 3,
    collectionVersion: 3,
    skinId: skin.id,
    supportedSubjects: ["atelier-place-stack","atelier-lens-split","atelier-speech-example","atelier-order-ladder"].includes(skin.id) || skin.purpose === "place-value" || skin.purpose === "abacus" || skin.purpose === "mental-maths" ? ["mathematics"] : ["general"],
    supportedGrades: ["primary-upper", "primary-lower", "middle-school", "secondary-plus", "early-years"],
    tags: [skin.publicName, skin.purpose, purposeTitle[skin.purpose] || "", ...skin.tags],
    minDimensions: { widthPt: 180, heightPt: 60 },
    defaultDimensions: { widthPt: 480, heightPt: skin.purpose === "chapter-structure" || skin.purpose === "abacus" ? 220 : 190 },
    reflowRules: { layoutVariant: skin.id, verticalGrowthStrategy: "expand-container" },
    defaultBackgroundStyle: { type: "subtle-tint", color: "#ffffff", cornerRadiusPt: 12 },
    slots: Object.entries(content).filter(([, value]) => value !== undefined).map(([slotId, defaultContent]) => ({
      slotId,
      label: slotId,
      type: slotId === "items" || slotId === "materials" ? "item-list" as const : slotId === "steps" ? "steps-list" as const : "text" as const,
      required: slotId === "title",
      defaultContent,
    })),
  };
}

export const ATELIER_SKINS: Record<string, AtelierSkin> = Object.fromEntries(ATELIER_SKIN_LIST.map(skin => [skin.id, skin]));
export const ATELIER_BLOCKS: Record<string, EducationalBlockDefinition> = Object.fromEntries(ATELIER_SKIN_LIST.map(skin => [skin.id, defineBlock(skin)]));
export function atelierSkinFor(id: string): AtelierSkin | undefined {
  return ATELIER_SKINS[id];
}
