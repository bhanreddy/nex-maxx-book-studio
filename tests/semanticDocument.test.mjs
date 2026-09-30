import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => {
  module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, file);
};

const { toSemanticDocument, applySemanticDocument, restoreSemanticFramework } = require('../src/editor/persistence/semanticDocument.ts');
const { defaultChapterRepository, cloudChapterRepository } = require('../src/editor/persistence/chapterRepository.ts');
const chapterEngine = require('../src/editor/curriculum/chapterEngine.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');

test('semantic mapper keeps content and drops coordinates', () => {
  const framework = {
    version: 1,
    planVersion: 2,
    compositionRevision: 3,
    config: { grade: 4, subject: 'Mathematics', title: 'Chapter 1', unit: 'Numbers', theme: 'Place value', pageCount: 8, learningOutcomes: ['Read numbers'], concepts: ['place value'], personality: 'mathematical', complexity: 'standard', preset: 'balanced' },
    mode: 'easy',
    sections: [{ id: 'start', stage: 'discover', title: 'Start', blockIds: ['b1'] }],
    blocks: {
      b1: {
        id: 'b1',
        archetypeId: 'explanation',
        presetId: 'plain',
        pageId: 'page-1',
        transform: { x: 10, y: 20, width: 100, height: 40, rotation: 0 },
        styleOverrides: { sceneSlice: { from: 0, to: 1 }, motifs: [{ id: 'm', x: 1, y: 2 }] },
        curriculum: { type: 'explanation', frameworkStage: 'learn', grade: 4, subjectLabel: 'Mathematics', learningOutcomeIds: ['lo-1'], difficulty: 'start', hierarchy: 'primary', pageRules: { keepTogether: true } },
        semanticContent: { title: 'Place value', items: ['Thousands'], questions: [{ prompt: 'What is 10?', options: ['10'], answer: '10' }] },
      },
    },
  };
  const document = toSemanticDocument(framework);
  assert.equal(document.blocks.b1.semanticContent.title, 'Place value');
  assert.deepEqual(document.blocks.b1.curriculum.learningOutcomeIds, ['lo-1']);
  assert.deepEqual(document.sections[0].blockIds, ['b1']);
  assert.equal(document.blocks.b1.transform, undefined);
  assert.equal(document.blocks.b1.styleOverrides, undefined);
  assert.equal(document.blocks.b1.pageId, undefined);
  assert.equal(document.blocks.b1.presetId, undefined);
  assert.equal(document.blocks.b1.family, undefined);
  assert.equal(document.compositionRevision, undefined);
  assert.equal(document.config.pageCount, undefined);
  assert.equal(document.config.personality, undefined);
  assert.equal(document.config.preset, undefined);
  const restored = applySemanticDocument(framework, {
    ...document,
    blocks: { b1: { ...document.blocks.b1, semanticContent: { title: 'Updated title' } } },
  });
  assert.equal(restored.blocks.b1.semanticContent.title, 'Updated title');
  assert.equal(restored.blocks.b1.semanticContent.questions, undefined);
  assert.equal(restored.blocks.b1.transform.x, 10);
  assert.equal(restored.blocks.b1.styleOverrides.motifs[0].id, 'm');
  assert.throws(() => applySemanticDocument(framework, { ...document, blocks: {} }), /block IDs differ/);
});

test('local repository is the default and cloud save is explicit', () => {
  assert.equal(defaultChapterRepository().kind, 'local');
  assert.equal(cloudChapterRepository().kind, 'cloud');
  const source = fs.readFileSync(new URL('../src/editor/stores/editorStore.ts', import.meta.url), 'utf8');
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(source, /saveChapterToCloud:/);
  assert.match(source, /repository\.save\(toSemanticDocument/);
  assert.match(source, /defaultChapterRepository\(\)/);
  assert.match(source, /connectNewCloudChapter/);
  assert.match(source, /saveToStorage: \(\) => \{/);
});

test('reloaded central text is visible in recomposed Book Studio page elements', () => {
  const book = structuredClone(useEditorStore.getState().getActiveBook());
  book.pages = [];
  const config = { ...chapterEngine.DEFAULT_CHAPTER_CONFIG, grade: 4, subject: 'Mathematics', title: 'Chapter 1' };
  const chapterId = crypto.randomUUID();
  const chapter = {
    id: chapterId, unitId: 'unit', number: 1, title: config.title,
    learningObjectives: config.learningOutcomes, pageIds: [],
    framework: chapterEngine.generateFramework(config, chapterId),
  };
  book.chapters = [chapter];
  const initial = chapterEngine.composeChapter(book, chapter, {});
  const central = toSemanticDocument(initial.chapter.framework);
  const blockId = initial.chapter.framework.sections.flatMap((section) => section.blockIds)[0];
  central.blocks[blockId].semanticContent.title = 'Central revision 2 text';
  const framework = applySemanticDocument(initial.chapter.framework, central);
  const reloaded = chapterEngine.composeChapter(initial.book, { ...initial.chapter, framework }, initial.elements);
  assert.equal(reloaded.chapter.framework.blocks[blockId].semanticContent.title, 'Central revision 2 text');
  assert.equal(reloaded.elements[blockId].smartBlockData.semanticContent.title, 'Central revision 2 text');
});

test('cloud repository reloads the current document without a cached response', async () => {
  let loadOptions;
  const repository = cloudChapterRepository(async (_url, options) => {
    loadOptions = options;
    return { ok: true, json: async () => ({ data: { document: { version: 1 }, revision: 2, edit_version: 3, checksum: 'a'.repeat(64) } }) };
  });
  assert.deepEqual(await repository.load('chapter-id'), { version: 1, schemaVersion: 2, nativeContent: {}, assetReferences: [], questionReferences: [] });
  assert.equal(loadOptions.cache, 'no-store');
});

test('a new device reconstructs content and stable IDs without the original local layout', () => {
  const source = chapterEngine.generateFramework({ ...chapterEngine.DEFAULT_CHAPTER_CONFIG, grade: 4, subject: 'Mathematics', title: 'Saved on another device' }, 'central-chapter');
  const central = toSemanticDocument(source);
  const linked=toSemanticDocument(source,'canonical-master-id');
  assert.equal(Object.values(linked.blocks)[0].curriculum.chapterId,'canonical-master-id');
  assert.equal(Object.values(source.blocks)[0].curriculum.chapterId,'central-chapter');
  const restored = restoreSemanticFramework(central, 'new-local-chapter');
  assert.deepEqual(toSemanticDocument(restored), central);
  const blockId = Object.keys(central.blocks)[0];
  const existing = structuredClone(source);
  existing.blocks[blockId].styleOverrides.paletteId = 'local-designer-palette';
  const added = chapterEngine.makeCurriculumBlock('concept-explorer', source.config, 'central-chapter');
  const addedDocument = toSemanticDocument({ ...source, blocks: { [added.id]: added }, sections: [] });
  central.blocks[added.id] = addedDocument.blocks[added.id];
  central.sections[0].blockIds.push(added.id);
  const updated = restoreSemanticFramework(central, 'new-local-chapter', existing);
  assert.equal(updated.blocks[blockId].styleOverrides.paletteId, 'local-designer-palette');
  assert.deepEqual(toSemanticDocument(updated), central);
});

test('Book Studio generated documents satisfy the backend source contract across grades and subjects', async () => {
  const { parseChapterFramework } = await import('../../SchoolIMS/SchoolIMS-Backend/services/curriculum/chapterFrameworkSchema.js');
  for (const [grade,subject] of [[1,'English'],[4,'Mathematics'],[5,'Science']]) {
    const framework=chapterEngine.generateFramework({ ...chapterEngine.DEFAULT_CHAPTER_CONFIG,grade,subject }, 'contract-chapter');
    const payload=JSON.parse(JSON.stringify(toSemanticDocument(framework)));
    try { assert.deepEqual(parseChapterFramework(payload),payload); }
    catch (error) { throw new Error(`${grade} ${subject}: ${JSON.stringify(error.details || error.message)}`); }
  }
});
