import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, file) =>
    module._compile(
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      file
    );
}

const {
  UNIVERSAL_BLOCK_CATALOG,
  UNIVERSAL_BLOCK_MAP,
  normalizeUniversalType,
  getSubjectFixture,
  generateUniversal5Pages,
  UNIVERSAL_SUBJECT_FIXTURES,
} = require('../src/editor/curriculum/universalBlocks.ts');

const { renderUniversalBlockScene } = require('../src/editor/curriculum/renderUniversalScene.ts');
const { createUniversal5PageChapter } = require('../src/editor/curriculum/actions.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { CURRICULUM_GRADES } = require('../src/domain/educational/curriculum.ts');
const { CLASS_TYPOGRAPHY, NEX_MAXX_BRAND, NEX_MAXX_PRESETS } = require('../src/domain/educational/designTokens.ts');
const { CURRICULUM_BLOCKS } = require('../src/editor/curriculum/catalog.ts');

test('Universal Layout: archetypes include lesson schema and study skills alongside the existing blocks', () => {
  // Existing IDs remain stable; lesson schema and study skills are first-class blocks.
  assert.equal(CURRICULUM_BLOCKS.length, 224);

  // Universal blocks catalog contains 29 distinct archetypes.
  assert.equal(UNIVERSAL_BLOCK_CATALOG.length, 29);
  assert.equal(Object.keys(UNIVERSAL_BLOCK_MAP).length, 29);

  // Test normalization of aliases and archetype names
  assert.equal(normalizeUniversalType('hero'), 'chapter-hero');
  assert.equal(normalizeUniversalType('schema'), 'lesson-schema');
  assert.equal(normalizeUniversalType('study-skills'), 'study-skills');
  assert.equal(normalizeUniversalType('mission'), 'mission-banner');
  assert.equal(normalizeUniversalType('outcomes'), 'learning-outcomes');
  assert.equal(normalizeUniversalType('table'), 'smart-table');
  assert.equal(normalizeUniversalType('worked'), 'worked-example');
  assert.equal(normalizeUniversalType('rubric'), 'mastery-rubric');
  assert.equal(normalizeUniversalType('vocabulary'), 'vocabulary-bank');
});

test('Universal Layout: multi-subject fixtures including Telugu and Hindi scripts', () => {
  const subjects = ['mathematics', 'science', 'english', 'social', 'evs', 'computer', 'telugu', 'hindi'];
  for (const s of subjects) {
    const f = getSubjectFixture(s);
    assert.ok(f.name, `Missing name for ${s}`);
    assert.ok(f.chapter, `Missing chapter title for ${s}`);
    assert.ok(f.mission, `Missing mission for ${s}`);
    assert.ok(f.objective.length >= 3, `Need at least 3 objectives for ${s}`);
    assert.ok(f.hero.length >= 3, `Need 3 hero elements for ${s}`);
    assert.ok(f.vocab.length >= 3, `Need vocabulary for ${s}`);
  }

  // Verify Telugu Unicode characters
  const telugu = getSubjectFixture('telugu');
  assert.ok(/[\u0c00-\u0c7f]/.test(telugu.chapter), 'Telugu chapter title must contain Telugu Unicode');
  assert.deepEqual(telugu.hero, ['అ', 'ఆ', 'ఇ']);

  // Verify Hindi Unicode characters
  const hindi = getSubjectFixture('hindi');
  assert.ok(/[\u0900-\u097f]/.test(hindi.chapter), 'Hindi chapter title must contain Devanagari Unicode');
  assert.deepEqual(hindi.hero, ['अ', 'आ', 'इ']);
});

test('Universal Layout: 5-page reference archetype generator creates full structure', () => {
  const pages = generateUniversal5Pages('mathematics');
  assert.equal(pages.length, 5);

  const [cover, concept, practice, explore, assessment] = pages;
  assert.equal(cover.type, 'cover');
  assert.equal(concept.type, 'concept');
  assert.equal(practice.type, 'practice');
  assert.equal(explore.type, 'explore');
  assert.equal(assessment.type, 'assessment');

  // Verify block counts per page
  assert.equal(cover.blocks.length, 5);
  assert.equal(concept.blocks.length, 6);
  assert.equal(practice.blocks.length, 6);
  assert.equal(explore.blocks.length, 7);
  assert.equal(assessment.blocks.length, 6);

  // Verify all block types are recognized
  for (const page of pages) {
    for (const b of page.blocks) {
      assert.ok(UNIVERSAL_BLOCK_MAP[b.type], `Unrecognized block type ${b.type}`);
    }
  }
});

test('Universal Layout: deterministic publication scenes render finite geometry for all 25 blocks', () => {
  for (const meta of UNIVERSAL_BLOCK_CATALOG) {
    const dummyInstance = {
      id: `test-${meta.type}`,
      pageId: 'p1',
      presetId: `universal-${meta.type}`,
      archetypeId: meta.type,
      family: 'nex-editorial',
      subject: 'mathematics',
      gradeBand: 'primary-upper',
      isDetached: false,
      isLockedContent: false,
      isLockedDesign: false,
      transform: { x: 42, y: 36, width: 517, height: 180, rotation: 0, zIndex: 1 },
      curriculum: {
        type: meta.type,
        grade: 4,
        subjectLabel: 'mathematics',
        chapterId: 'test',
        sourceBlockId: `test-${meta.type}`,
        learningOutcomeIds: [],
        difficulty: 'start',
        hierarchy: 'primary',
        pageRules: { keepTogether: true },
      },
      semanticContent: {
        title: meta.defaultTitle,
        subtitle: meta.defaultBody,
        introText: meta.defaultBody,
        items: meta.defaultBody.includes('|') ? meta.defaultBody.split('|') : ['Item 1', 'Item 2'],
      },
      styleOverrides: {
        blockStyle: 'editorial',
      },
    };

    const scene = renderUniversalBlockScene(dummyInstance);
    assert.ok(scene.width > 0, `${meta.type} width`);
    assert.ok(scene.height > 50, `${meta.type} height`);
    assert.ok(scene.nodes.length > 0, `${meta.type} has nodes`);

    // Verify all nodes have finite coordinates
    for (const n of scene.nodes) {
      for (const k of ['x', 'y', 'w', 'h', 'size']) {
        if (k in n) {
          assert.ok(Number.isFinite(n[k]), `${meta.type} node ${n.kind}.${k} is finite`);
        }
      }
    }
  }
});

test('Universal Layout: Grade level support extends from Nursery through Grade 12', () => {
  const expectedGrades = ['NURSERY', 'LKG', 'UKG', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const g of expectedGrades) {
    assert.ok(CURRICULUM_GRADES.includes(g), `Missing grade ${g}`);
    assert.ok(CLASS_TYPOGRAPHY[g], `Missing typography for grade ${g}`);
    assert.ok(CLASS_TYPOGRAPHY[g].body > 0, `Invalid body size for grade ${g}`);
    assert.ok(CLASS_TYPOGRAPHY[g].heading > 0, `Invalid heading size for grade ${g}`);
  }

  // Early years must have larger body type than secondary
  assert.ok(CLASS_TYPOGRAPHY.NURSERY.body > CLASS_TYPOGRAPHY[4].body);
  assert.ok(CLASS_TYPOGRAPHY[4].body > CLASS_TYPOGRAPHY[12].body);
});

test('Universal Layout: createUniversal5PageChapter composes 5 editable pages into book', () => {
  const store = useEditorStore.getState();
  const book = store.getActiveBook();
  assert.ok(book, 'Active book must exist');

  const initialChapterCount = book.chapters.length;
  const initialPageCount = book.pages.length;

  const result = createUniversal5PageChapter({
    subject: 'Science',
    grade: 7,
    preset: 'explorer',
    title: 'Cellular Frontiers',
  });

  assert.ok(result.chapter, 'Chapter returned');
  assert.equal(result.chapter.title, 'Cellular Frontiers');
  assert.ok(result.pages.length >= 5);
  assert.ok(result.elements.length >= 20, 'Should create at least 20 smart block elements');

  // Verify book state updated in store
  const updatedBook = useEditorStore.getState().getActiveBook();
  assert.equal(updatedBook.chapters.length, initialChapterCount + 1);
  assert.equal(updatedBook.pages.length, initialPageCount + result.pages.length);

  // Verify elements are fully editable via updateSmartBlockContent
  const firstBlock = result.elements[0];
  assert.ok(firstBlock.smartBlockData, 'Element must have smartBlockData');
  
  useEditorStore.getState().updateSmartBlockContent(firstBlock.id, {
    title: 'Updated Chapter Title Test',
  });

  const updatedFirst = useEditorStore.getState().elements[firstBlock.id];
  assert.equal(updatedFirst.smartBlockData.semanticContent.title, 'Updated Chapter Title Test');
});
