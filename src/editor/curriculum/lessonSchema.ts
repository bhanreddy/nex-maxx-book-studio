import type { LessonSchemaTopic, SmartBlockInstance } from "../../domain/educational/blockSchema";
import { LESSON_SCHEMA_TOKENS } from "../../domain/educational/designTokens";

export const LESSON_SCHEMA_ICONS: LessonSchemaTopic["icon"][] = ["number", "book", "leaf", "globe", "flask", "computer", "shapes", "music", "star"];
export function schemaSubjectIcon(subject: string): LessonSchemaTopic["icon"] {
  if (/math/i.test(subject)) return "number";
  if (/evs|environment|plant/i.test(subject)) return "leaf";
  if (/science/i.test(subject)) return "flask";
  if (/social|history|geography/i.test(subject)) return "globe";
  if (/computer|coding/i.test(subject)) return "computer";
  if (/art/i.test(subject)) return "shapes";
  if (/music/i.test(subject)) return "music";
  if (/english|language|telugu|hindi/i.test(subject)) return "book";
  return "star";
}
export function createSchemaTopic(label = "", index = 0, subject = "General"): LessonSchemaTopic {
  return { id: crypto.randomUUID(), label, icon: schemaSubjectIcon(subject), color: LESSON_SCHEMA_TOKENS.tones[index % LESSON_SCHEMA_TOKENS.tones.length].accent };
}
/** Read-only fallback for older/imported content. Explicit [] means no topics. */
export function schemaTopics(block: SmartBlockInstance): LessonSchemaTopic[] {
  return block.semanticContent.lessonSchemaTopics ?? (block.semanticContent.items || []).map((label, i) => ({
    id: `topic-${i}`, label, icon: schemaSubjectIcon(block.curriculum?.subjectLabel || block.subject),
    color: LESSON_SCHEMA_TOKENS.tones[i % LESSON_SCHEMA_TOKENS.tones.length].accent,
  }));
}
export function moveSchemaTopic(topics: LessonSchemaTopic[], id: string, direction: -1 | 1): LessonSchemaTopic[] {
  const from = topics.findIndex(topic => topic.id === id), to = from + direction;
  if (from < 0 || to < 0 || to >= topics.length) return topics;
  const result = [...topics];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}
