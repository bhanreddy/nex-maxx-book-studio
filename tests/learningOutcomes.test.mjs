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

const engine = require('../src/editor/curriculum/chapterEngine.ts');
const { CURRICULUM_BLOCKS, CHAPTER_PRESETS } = require('../src/editor/curriculum/catalog.ts');
const {
  createLearningOutcomeTopic,
  learningOutcomeTopics,
  moveLearningOutcomeTopic,
  addEmptySpaces,
  SUBJECT_OUTCOME_DEFAULTS,
  getSubjectOutcomeDefault,
} = require('../src/editor/curriculum/learningOutcomes.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { renderLearningOutcomes } = require('../src/editor/curriculum/renderLearningOutcomes.ts');

test('study skills is 3rd and learning outcomes is 4th after chapter-hero (1st) and lesson-schema (2nd) across all presets', () => {
  assert.equal(CURRICULUM_BLOCKS[0].id, 'chapter-hero');
  assert.equal(CURRICULUM_BLOCKS[1].id, 'lesson-schema');
  assert.equal(CURRICULUM_BLOCKS[2].id, 'study-skills');
  assert.equal(CURRICULUM_BLOCKS[3].id, 'learning-outcomes');

  for (const preset of CHAPTER_PRESETS) {
    const f = engine.generateFramework(
      { ...engine.DEFAULT_CHAPTER_CONFIG, preset: preset.id },
      'chapter'
    );
    const ordered = engine.orderedBlocks(f);
    assert.equal(ordered[0].curriculum.type, 'chapter-hero', `${preset.id} 1st must be chapter-hero`);
    assert.equal(ordered[1].curriculum.type, 'lesson-schema', `${preset.id} 2nd must be lesson-schema`);
    assert.equal(ordered[2].curriculum.type, 'study-skills', `${preset.id} 3rd must be study-skills`);
    assert.equal(ordered[3].curriculum.type, 'learning-outcomes', `${preset.id} 4th must be learning-outcomes`);
  }
});

test('learning outcomes supports empty spaces and topic addition/deletion', () => {
  let topics = [
    createLearningOutcomeTopic('write', '5-digit and 6-digit numbers', 0, 'Maths'),
    createLearningOutcomeTopic('compare', 'numbers up to 9,99,999', 1, 'Maths'),
  ];
  assert.equal(topics.length, 2);
  assert.equal(topics[0].verb, 'write');
  assert.equal(topics[1].verb, 'compare');

  // Add 3 empty spaces
  topics = addEmptySpaces(topics, 3, 'Maths');
  assert.equal(topics.length, 5);
  assert.equal(topics[2].isEmpty, true);
  assert.equal(topics[3].isEmpty, true);
  assert.equal(topics[4].isEmpty, true);

  // Move topic
  const moved = moveLearningOutcomeTopic(topics, topics[0].id, 1);
  assert.equal(moved[0].verb, 'compare');
  assert.equal(moved[1].verb, 'write');

  // Delete topic
  const afterDelete = moved.filter(t => t.id !== moved[0].id);
  assert.equal(afterDelete.length, 4);
});

test('learning outcomes has rich tailored starters for every subject', () => {
  for (const subject of ['Maths', 'Science', 'English', 'Social Studies', 'Computer', 'Art', 'Music', 'GK', 'Telugu', 'Hindi']) {
    const def = getSubjectOutcomeDefault(subject);
    assert.ok(def, `Missing defaults for ${subject}`);
    assert.ok(def.intro.length > 5, `Intro too short for ${subject}`);
    assert.ok(def.outcomes.length >= 3, `Outcomes count too low for ${subject}`);
    for (const item of def.outcomes) {
      assert.ok(item.verb, `Missing verb in ${subject}`);
      assert.ok(item.text, `Missing text in ${subject}`);
      assert.ok(item.icon, `Missing icon in ${subject}`);
    }
  }
});

test('renderLearningOutcomes produces valid vector scene with finite geometry', () => {
  const block = engine.makeCurriculumBlock('learning-outcomes', engine.DEFAULT_CHAPTER_CONFIG);
  block.transform.width = 540;
  const scene = buildPublicationScene(block);
  assert.ok(scene.height > 150);
  assert.ok(scene.nodes.length > 10);
  assert.ok(scene.motifs.length >= 1);
  for (const n of scene.nodes) {
    for (const k of ['x', 'y', 'w', 'h', 'rx', 'ry', 'size']) {
      if (k in n) assert.ok(Number.isFinite(n[k]), `Non-finite coordinate: ${k}`);
    }
  }
});
