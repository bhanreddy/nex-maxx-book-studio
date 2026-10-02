import type { ChapterBuilderConfig, ChapterFramework, CurriculumMetadata } from "../../domain/educational/curriculum";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { DEFAULT_CHAPTER_CONFIG, makeCurriculumBlock } from '../curriculum/chapterEngine';
import { CURRICULUM_BLOCK_MAP } from '../curriculum/catalog';

export interface SemanticBlock {
  id: string;
  archetypeId: SmartBlockInstance["archetypeId"];
  subject?: SmartBlockInstance["subject"];
  gradeBand?: SmartBlockInstance["gradeBand"];
  curriculum?: Pick<CurriculumMetadata, "type" | "frameworkStage" | "grade" | "subjectLabel" | "chapterId" | "sourceBlockId" | "learningOutcomeIds" | "difficulty" | "hierarchy"> & {
    assessmentMetadata?: { competency: string; formative: boolean; totalPoints?: number };
    digitalExtension?: Pick<NonNullable<CurriculumMetadata["digitalExtension"]>, "url" | "duration" | "contentType" | "cta" | "icon">;
  };
  semanticContent: SmartBlockInstance["semanticContent"];
}

export interface SemanticDocument {
  version: 1;
  schemaVersion?: 1 | 2;
  nativeContent?: Record<string, Record<string, unknown>>;
  assetReferences?: {assetId:string;revision:number;checksum:string}[];
  questionReferences?: {blockId:string;questionId:string;revision:number;checksum:string}[];
  planVersion?: 2;
  config: Pick<ChapterBuilderConfig, "grade" | "subject" | "title" | "unit" | "theme" | "learningOutcomes" | "concepts">;
  sections: ChapterFramework["sections"];
  blocks: Record<string, SemanticBlock>;
}

/** Store the extension in the existing metadata contract; old servers stay compatible. */
function encodeSemanticContent(content: SmartBlockInstance["semanticContent"]): SmartBlockInstance["semanticContent"] {
  const copy = structuredClone(content);
  if (copy.lessonSchemaTopics !== undefined) {
    copy.metadata = { ...copy.metadata, lessonSchema: { topics: copy.lessonSchemaTopics, hadMetadata: content.metadata !== undefined } };
    delete copy.lessonSchemaTopics;
  }
  if (copy.studySkillTopics !== undefined || copy.badgeLabel !== undefined) {
    copy.metadata = { ...copy.metadata, studySkills: { topics: copy.studySkillTopics, badgeLabel: copy.badgeLabel, hadMetadata: content.metadata !== undefined } };
    delete copy.studySkillTopics;
    delete copy.badgeLabel;
  }
  if (copy.learningOutcomeTopics !== undefined) {
    copy.metadata = { ...copy.metadata, learningOutcomes: { topics: copy.learningOutcomeTopics, hadMetadata: content.metadata !== undefined } };
    delete copy.learningOutcomeTopics;
  }
  return copy;
}
function decodeSemanticContent(content: SmartBlockInstance["semanticContent"]): SmartBlockInstance["semanticContent"] {
  const copy = structuredClone(content);
  const schema = copy.metadata?.lessonSchema as { topics?: unknown; hadMetadata?: boolean } | undefined;
  if (schema && Array.isArray(schema.topics)) {
    copy.lessonSchemaTopics = schema.topics as NonNullable<typeof copy.lessonSchemaTopics>;
    delete copy.metadata!.lessonSchema;
    if (!schema.hadMetadata && !Object.keys(copy.metadata!).length) delete copy.metadata;
  }
  const skills = copy.metadata?.studySkills as { topics?: unknown; badgeLabel?: string; hadMetadata?: boolean } | undefined;
  if (skills) {
    if (Array.isArray(skills.topics)) copy.studySkillTopics = skills.topics as NonNullable<typeof copy.studySkillTopics>;
    if (skills.badgeLabel) copy.badgeLabel = skills.badgeLabel;
    delete copy.metadata!.studySkills;
    if (!skills.hadMetadata && !Object.keys(copy.metadata!).length) delete copy.metadata;
  }
  const outcomes = copy.metadata?.learningOutcomes as { topics?: unknown; hadMetadata?: boolean } | undefined;
  if (outcomes && Array.isArray(outcomes.topics)) {
    copy.learningOutcomeTopics = outcomes.topics as NonNullable<typeof copy.learningOutcomeTopics>;
    delete copy.metadata!.learningOutcomes;
    if (!outcomes.hadMetadata && !Object.keys(copy.metadata!).length) delete copy.metadata;
  }
  return copy;
}

export function upgradeSemanticDocument(document: SemanticDocument): SemanticDocument {
  const version = document.schemaVersion ?? document.version;
  if (version !== 1 && version !== 2) throw new Error(`Unsupported chapter schema version ${version}. Update Book Studio before opening it.`);
  return { ...document, version: 1, schemaVersion: 2, nativeContent: document.nativeContent || {}, assetReferences: document.assetReferences || [], questionReferences: document.questionReferences || [] };
}

/** Canonical curriculum payload. Page coordinates and style overrides stay in the editor. */
export function toSemanticDocument(framework: ChapterFramework, centralChapterId?: string): SemanticDocument {
  const blocks: Record<string, SemanticBlock> = {};
  for (const [id, block] of Object.entries(framework.blocks)) {
    blocks[id] = {
      id: block.id,
      archetypeId: block.archetypeId,
      subject: block.subject,
      gradeBand: block.gradeBand,
      curriculum: block.curriculum
        ? {
            type: block.curriculum.type,
            frameworkStage: block.curriculum.frameworkStage,
            grade: block.curriculum.grade,
            subjectLabel: block.curriculum.subjectLabel,
            chapterId: centralChapterId || block.curriculum.chapterId,
            sourceBlockId: block.curriculum.sourceBlockId,
            learningOutcomeIds: [...(block.curriculum.learningOutcomeIds || [])],
            difficulty: block.curriculum.difficulty,
            hierarchy: block.curriculum.hierarchy,
            assessmentMetadata: block.curriculum.assessmentMetadata
              ? {
                  competency: block.curriculum.assessmentMetadata.competency,
                  formative: block.curriculum.assessmentMetadata.formative,
                  totalPoints: block.curriculum.assessmentMetadata.totalPoints,
                }
              : undefined,
            digitalExtension: block.curriculum.digitalExtension?.url.trim()
              ? {
                  url: block.curriculum.digitalExtension.url,
                  duration: block.curriculum.digitalExtension.duration,
                  contentType: block.curriculum.digitalExtension.contentType,
                  cta: block.curriculum.digitalExtension.cta,
                  icon: block.curriculum.digitalExtension.icon,
                }
              : undefined,
          }
        : undefined,
      semanticContent: encodeSemanticContent({ ...block.semanticContent, items: block.semanticContent.items ? [...block.semanticContent.items] : undefined }),
    };
  }
  return {
    version: 1,
    schemaVersion: 2,
    nativeContent: {},
    assetReferences: framework.assetReferences || [],
    questionReferences: framework.questionReferences || [],
    planVersion: framework.planVersion,
    config: {
      grade: framework.config.grade,
      subject: framework.config.subject,
      title: framework.config.title,
      unit: framework.config.unit,
      theme: framework.config.theme,
      learningOutcomes: [...framework.config.learningOutcomes],
      concepts: [...framework.config.concepts],
    },
    sections: framework.sections.map((section) => ({ ...section, blockIds: [...section.blockIds] })),
    blocks,
  };
}

/** Copy semantic fields onto the local framework and leave layout untouched. */
export function applySemanticDocument(framework: ChapterFramework, document: SemanticDocument): ChapterFramework {
  document = upgradeSemanticDocument(document);
  const localIds = Object.keys(framework.blocks).sort();
  const centralIds = Object.keys(document.blocks).sort();
  if (localIds.length !== centralIds.length || localIds.some((id, index) => id !== centralIds[index])) {
    throw new Error("Central chapter block IDs differ from this local layout. Open the matching local chapter before reloading.");
  }
  const blocks = { ...framework.blocks };
  for (const [id, semantic] of Object.entries(document.blocks)) {
    const existing = blocks[id];
    if (!existing) throw new Error(`Missing local layout for block ${id}`);
    blocks[id] = {
      ...existing,
      id: semantic.id,
      archetypeId: semantic.archetypeId,
      semanticContent: decodeSemanticContent(semantic.semanticContent),
      curriculum: semantic.curriculum
        ? {
            ...(existing.curriculum as CurriculumMetadata),
            ...semantic.curriculum,
            assessmentMetadata: semantic.curriculum.assessmentMetadata,
            digitalExtension: semantic.curriculum.digitalExtension,
          }
        : existing.curriculum,
    };
  }
  return {
    ...framework,
    assetReferences: document.assetReferences || [],
    questionReferences: document.questionReferences || [],
    planVersion: document.planVersion ?? framework.planVersion,
    config: { ...framework.config, ...document.config },
    sections: document.sections.map((section) => ({ ...section, blockIds: [...section.blockIds] })),
    blocks,
  };
}

/** Rebuild presentation from canonical content on a new device or structural edit.
 * Existing blocks keep their local styles; new blocks receive a supported default.
 * Semantic IDs and text come exclusively from the central document.
 */
export function restoreSemanticFramework(document: SemanticDocument, chapterId: string, existing?: ChapterFramework): ChapterFramework {
  document = upgradeSemanticDocument(document);
  const config: ChapterBuilderConfig = { ...DEFAULT_CHAPTER_CONFIG, ...existing?.config, ...document.config };
  const blocks: Record<string, SmartBlockInstance> = {};
  for (const [id, semantic] of Object.entries(document.blocks)) {
    let block = existing?.blocks[id];
    if (!block) {
      const type = semantic.curriculum?.type;
      const supported = type && CURRICULUM_BLOCK_MAP[type]?.archetype === semantic.archetypeId
        ? type : Object.keys(CURRICULUM_BLOCK_MAP).find(key => CURRICULUM_BLOCK_MAP[key].archetype === semantic.archetypeId);
      if (!supported) throw new Error(`Block ${id} uses unsupported type ${semantic.archetypeId}. Update Book Studio; the central content remains intact.`);
      block = makeCurriculumBlock(supported, config, chapterId);
    }
    blocks[id] = { ...block, id: semantic.id, archetypeId: semantic.archetypeId,
      subject: semantic.subject ?? block.subject, gradeBand: semantic.gradeBand ?? block.gradeBand,
      semanticContent: decodeSemanticContent(semantic.semanticContent),
      curriculum: semantic.curriculum ? { ...block.curriculum!, ...semantic.curriculum,
        assessmentMetadata: semantic.curriculum.assessmentMetadata, digitalExtension: semantic.curriculum.digitalExtension } : undefined };
  }
  return { version: 1, assetReferences: document.assetReferences || [], questionReferences: document.questionReferences || [], planVersion: document.planVersion || 2, config, mode: existing?.mode || 'easy',
    sections: structuredClone(document.sections), blocks, compositionRevision: existing?.compositionRevision || 0 };
}
