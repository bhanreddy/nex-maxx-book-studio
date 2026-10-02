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

const { CURRICULUM_BLOCKS, CURRICULUM_BLOCK_MAP } = require('../src/editor/curriculum/catalog.ts');
const {
  SIGNATURE_SUBJECT_PRESETS,
  getSignaturePreset,
} = require('../src/editor/curriculum/signatureElements.ts');
const {
  makeSignatureBlock,
  applySignatureElementsToChapter,
} = require('../src/editor/curriculum/applySignatureElements.ts');
const { renderUniversalBlockScene } = require('../src/editor/curriculum/renderUniversalScene.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');

test('signature elements: fact-zone, topic-banner, and life-connect exist in curriculum catalog', () => {
  assert.ok(CURRICULUM_BLOCK_MAP['fact-zone'], 'fact-zone must exist in CURRICULUM_BLOCK_MAP');
  assert.ok(CURRICULUM_BLOCK_MAP['topic-banner'], 'topic-banner must exist in CURRICULUM_BLOCK_MAP');
  assert.ok(CURRICULUM_BLOCK_MAP['life-connect'], 'life-connect must exist in CURRICULUM_BLOCK_MAP');

  const factZone = CURRICULUM_BLOCK_MAP['fact-zone'];
  assert.equal(factZone.name, 'Fact Zone');
  assert.ok(factZone.tags.includes('all subjects'));

  const topicBanner = CURRICULUM_BLOCK_MAP['topic-banner'];
  assert.equal(topicBanner.name, 'Topic Banner');
  assert.ok(topicBanner.tags.includes('all subjects'));

  const lifeConnect = CURRICULUM_BLOCK_MAP['life-connect'];
  assert.equal(lifeConnect.name, 'Life Connect');
  assert.ok(lifeConnect.tags.includes('all subjects'));
});

test('signature elements: versatile presets for every subject including regional languages', () => {
  const subjects = [
    'Maths',
    'Mathematics',
    'Science',
    'Environmental Studies',
    'Social Studies',
    'History',
    'Geography',
    'English',
    'Computer Science',
    'General Knowledge',
    'Telugu',
    'Hindi',
  ];

  for (const sub of subjects) {
    const preset = getSignaturePreset(sub);
    assert.ok(preset, `Preset must exist for ${sub}`);

    // Fact Zone check
    assert.ok(preset.factZone.badgeTitle, `Fact zone badge title must exist for ${sub}`);
    assert.ok(preset.factZone.factText, `Fact zone fact text must exist for ${sub}`);
    assert.ok(Array.isArray(preset.factZone.bullets) && preset.factZone.bullets.length > 0, `Fact zone bullets must exist for ${sub}`);
    assert.ok(preset.factZone.rightIllustration, `Fact zone illustration must exist for ${sub}`);

    // Topic Banner check
    assert.ok(preset.topicBanner.word1, `Topic banner word1 must exist for ${sub}`);
    assert.ok(preset.topicBanner.connector, `Topic banner connector must exist for ${sub}`);
    assert.ok(preset.topicBanner.word2, `Topic banner word2 must exist for ${sub}`);

    // Life Connect check
    assert.ok(preset.lifeConnect.word1, `Life connect word1 must exist for ${sub}`);
    assert.ok(preset.lifeConnect.word2, `Life connect word2 must exist for ${sub}`);
    assert.ok(preset.lifeConnect.prompt, `Life connect prompt must exist for ${sub}`);
    assert.ok(preset.lifeConnect.illustration, `Life connect illustration must exist for ${sub}`);
  }
});

test('signature elements: makeSignatureBlock produces fully editable smart blocks', () => {
  // Fact Zone block
  const factBlock = makeSignatureBlock('fact-zone', 'Maths');
  assert.equal(factBlock.curriculum.type, 'fact-zone');
  assert.equal(factBlock.semanticContent.badgeLabel, 'FACT ZONE');
  assert.ok(factBlock.semanticContent.calloutText.includes('0 is neither positive nor negative'));
  assert.equal(factBlock.semanticContent.iconName, 'books');

  // Topic Banner block
  const topicBlock = makeSignatureBlock('topic-banner', 'Maths');
  assert.equal(topicBlock.curriculum.type, 'topic-banner');
  assert.equal(topicBlock.semanticContent.title, 'SUCCESSOR');
  assert.equal(topicBlock.semanticContent.badgeLabel, 'AND');
  assert.equal(topicBlock.semanticContent.subtitle, 'PREDECESSOR');

  // Life Connect block
  const lifeBlock = makeSignatureBlock('life-connect', 'Science');
  assert.equal(lifeBlock.curriculum.type, 'life-connect');
  assert.equal(lifeBlock.semanticContent.badgeLabel, 'LIFE');
  assert.equal(lifeBlock.semanticContent.title, 'CONNECT');
  assert.equal(lifeBlock.semanticContent.iconName, 'planting-boy');
});

test('signature elements: vector publication scene renders valid finite geometry', () => {
  const factBlock = makeSignatureBlock('fact-zone', 'Maths');
  const factScene = renderUniversalBlockScene(factBlock);
  assert.ok(factScene.nodes.length > 0, 'Fact zone must render vector nodes');
  assert.ok(factScene.height > 0 && Number.isFinite(factScene.height), 'Fact zone height must be finite');

  const topicBlock = makeSignatureBlock('topic-banner', 'Maths');
  const topicScene = renderUniversalBlockScene(topicBlock);
  assert.ok(topicScene.nodes.length > 0, 'Topic banner must render vector nodes');
  assert.ok(topicScene.height > 0 && Number.isFinite(topicScene.height), 'Topic banner height must be finite');

  const lifeBlock = makeSignatureBlock('life-connect', 'Science');
  const lifeScene = renderUniversalBlockScene(lifeBlock);
  assert.ok(lifeScene.nodes.length > 0, 'Life connect must render vector nodes');
  assert.ok(lifeScene.height > 0 && Number.isFinite(lifeScene.height), 'Life connect height must be finite');
});

test('signature elements: applySignatureElementsToChapter applies elements across every page', () => {
  const store = useEditorStore.getState();
  const book = store.getActiveBook();
  assert.ok(book, 'Active book must exist');

  const chapter = book.chapters[0];
  assert.ok(chapter, 'Chapter 0 must exist in active book');

  // Apply to chapter
  applySignatureElementsToChapter(chapter.id, 'Maths');

  const updatedBook = useEditorStore.getState().getActiveBook();
  const chapterPages = updatedBook.pages.filter(p => chapter.pageIds.includes(p.id) || p.chapterId === chapter.id);

  assert.ok(chapterPages.length > 0, 'Chapter must have pages');

  // Verify that every page has elements
  for (const page of chapterPages) {
    assert.ok(page.elementIds.length > 0, `Page ${page.id} must have elements`);
    const elements = page.elementIds.map(id => useEditorStore.getState().elements[id]).filter(Boolean);
    const hasSignature = elements.some(el =>
      ['fact-zone', 'topic-banner', 'life-connect'].includes(el?.smartBlockData?.curriculum?.type)
    );
    assert.ok(hasSignature, `Page ${page.displayNumber} must have at least one signature element`);
  }
});
