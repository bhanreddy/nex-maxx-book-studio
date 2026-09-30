import type { BlockVisualStyle, CurriculumBlockDefinition, CurriculumLayout, TeachingLayout } from "../../domain/educational/curriculum";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";

export const TEACHING_LAYOUTS: Record<TeachingLayout, { name: string; description: string }> = {
  "picture-side": { name: "Picture Beside Text", description: "An illustration alongside the explanation, followed by learning points." },
  "picture-top": { name: "Picture Above Text", description: "A wide illustration introduces the idea before the explanation." },
  "big-idea": { name: "Big Idea", description: "A prominent explanation panel with supporting examples below." },
  "example-cards": { name: "Example Cards", description: "Numbered examples in balanced, colour-coordinated cards." },
  "guided-steps": { name: "Step by Step", description: "A connected sequence with room for each instruction." },
  "compare-panels": { name: "Compare Two Things", description: "Paired panels put related points beside each other." },
  "question-cards": { name: "Question Cards", description: "Individual question panels with choices or writing space." },
  "reading-focus": { name: "Read and Answer", description: "A spacious reading panel followed by comprehension questions." },
  "activity-board": { name: "Activity Instructions", description: "Materials, ordered instructions, and a place to respond." },
  "reminder-panel": { name: "Remember This", description: "A compact teaching note with a prominent takeaway." },
};
export const BLOCK_STYLES: { id: BlockVisualStyle; name: string; description: string }[] = [
  { id: "colourful", name: "Colourful", description: "Ribbon headings, soft colour panels, and friendly illustrations." },
  { id: "calm", name: "Calm", description: "Quiet headings, precise borders, and generous reading space." },
  { id: "storybook", name: "Storybook", description: "Bookish typography, rounded panels, and illustrated details." },
  { id: "classic", name: "Classic", description: "Simple headings and restrained lines." },
];
export const isTeachingLayout = (layout: string): layout is TeachingLayout => layout in TEACHING_LAYOUTS;

/** Compatibility is based on teaching purpose, never on the selected subject. */
export function teachingLayouts(def: CurriculumBlockDefinition): CurriculumLayout[] {
  const key = def.id + " " + def.archetype;
  let choices: TeachingLayout[];
  if (def.id === "chapter-hero") choices = ["picture-top", "picture-side", "big-idea"];
  else if (/reading|passage|story|poem/.test(key)) choices = ["reading-focus", "picture-side", "big-idea"];
  else if (/activity|project|lab|experiment|process|instruction/.test(key)) choices = ["activity-board", "guided-steps", "picture-side"];
  else if (/assessment|exercise|practice|question|check|test|reflection/.test(key)) choices = ["question-cards", "guided-steps", "big-idea"];
  else if (/compare|comparison|cause|difference|non-example/.test(key)) choices = ["compare-panels", "example-cards", "big-idea"];
  else if (/remember|fact|tip|note|recap|summary/.test(key)) choices = ["reminder-panel", "big-idea", "example-cards"];
  else if (/worked|step/.test(key)) choices = ["guided-steps", "example-cards", "picture-side"];
  else choices = ["picture-side", "big-idea", "example-cards", "picture-top"];
  const specialised = def.layouts.filter(l => ["timeline", "comparison-table", "sorting-board", "experiment-sheet", "writing-sheet", "digital", "confidence", "constellation"].includes(l));
  return [...new Set([...specialised.slice(0, 1), ...choices, ...def.layouts])];
}

/** Explain fallback rendering without suppressing or modifying any content. */
export function layoutNote(block: SmartBlockInstance, layout: CurriculumLayout): string {
  const c = block.semanticContent;
  if (layout === "compare-panels" && (c.items?.length || 0) % 2) return "The final unpaired point spans the full width. All other content follows below.";
  if (layout === "reading-focus" && !c.passage) return "Your explanation fills the reading panel. Add a passage in Content for longer reading.";
  if (layout === "example-cards" && !c.items?.length && !c.steps?.length) return "Your questions become cards. Add learning points or steps for examples.";
  if ((layout === "picture-side" || layout === "picture-top") && block.styleOverrides.illustration === "none") return "Illustrations are hidden in Style. Text uses the available space.";
  return "All words, questions, answers, and pictures are preserved. Extra content flows below the main layout.";
}
