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
const { CURRICULUM_BLOCKS, CHAPTER_PRESETS, UNIVERSAL_CHAPTER_PRESETS } = require('../src/editor/curriculum/catalog.ts');
const {
  createStudySkillTopic,
  studySkillTopics,
  moveStudySkillTopic,
  addEmptySpaces,
  SUBJECT_STUDY_SKILL_DEFAULTS,
  getSubjectStudySkillDefault,
} = require('../src/editor/curriculum/studySkills.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { renderStudySkills } = require('../src/editor/curriculum/renderStudySkills.ts');

test('study skills is strictly 3rd after chapter-hero (1st) and lesson-schema (2nd) across all presets', () => {
  assert.equal(CURRICULUM_BLOCKS[0].id, 'chapter-hero', '1st block must be chapter-hero');
  assert.equal(CURRICULUM_BLOCKS[1].id, 'lesson-schema', '2nd block must be lesson-schema');
  assert.equal(CURRICULUM_BLOCKS[2].id, 'study-skills', '3rd block must be study-skills');
  assert.equal(CURRICULUM_BLOCKS[3].id, 'learning-outcomes', '4th block must be learning-outcomes');

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

  for (const uPreset of UNIVERSAL_CHAPTER_PRESETS) {
    assert.equal(uPreset.blocks[0], 'chapter-hero');
    assert.equal(uPreset.blocks[1], 'lesson-schema');
    assert.equal(uPreset.blocks[2], 'study-skills');
    assert.equal(uPreset.blocks[3], 'learning-outcomes');
  }
});

test('study skills default matches the reference image: "Face value of:" with 7 is 7, 9 is 9, 2 is 2, 7 is 7', () => {
  const maths = getSubjectStudySkillDefault('Maths');
  assert.equal(maths.header, 'Face value of:');
  assert.deepEqual(maths.topics, ['7 is 7.', '9 is 9.', '2 is 2.', '7 is 7.']);
});

test('study skills supports fully editable topics, reordering, and adding empty spaces', () => {
  let topics = [
    createStudySkillTopic('7 is 7.', false),
    createStudySkillTopic('9 is 9.', false),
    createStudySkillTopic('2 is 2.', false),
  ];
  assert.equal(topics.length, 3);
  assert.equal(topics[0].text, '7 is 7.');

  // Reorder
  topics = moveStudySkillTopic(topics, topics[0].id, 1);
  assert.equal(topics[0].text, '9 is 9.');
  assert.equal(topics[1].text, '7 is 7.');

  // Add 2 empty write-in spaces
  topics = addEmptySpaces(topics, 2);
  assert.equal(topics.length, 5);
  assert.equal(topics[3].isEmpty, true);
  assert.equal(topics[4].isEmpty, true);

  // Delete topic
  topics = topics.filter((_, idx) => idx !== 0);
  assert.equal(topics.length, 4);
});

test('study skills provides versatile presets for every subject including Telugu and Hindi', () => {
  const subjects = ['Maths', 'Science', 'English', 'Social Studies', 'History', 'Geography', 'EVS', 'Computer', 'General', 'Telugu', 'Hindi'];
  for (const sub of subjects) {
    const config = getSubjectStudySkillDefault(sub);
    assert.ok(config, `Must have preset config for ${sub}`);
    assert.ok(config.header.length > 0, `${sub} header must not be empty`);
    assert.ok(config.topics.length >= 3, `${sub} must have at least 3 topics`);
    assert.ok(config.presets.length >= 1, `${sub} must have presets`);
  }
});

test('renderStudySkills produces valid vector publication scene with finite geometry and all decorative motifs', () => {
  const block = engine.makeCurriculumBlock('study-skills', {
    ...engine.DEFAULT_CHAPTER_CONFIG,
    subject: 'Maths',
  });
  block.transform.width = 480;

  const scene = renderStudySkills(block, {
    wrapText: (val, w, size) => [val],
  });

  assert.ok(scene.width > 200, 'Width must be valid');
  assert.ok(scene.height > 200, 'Height must be valid');
  assert.ok(scene.nodes.length > 15, 'Scene must contain card layers and vector nodes');

  for (const n of scene.nodes) {
    for (const k of ['x', 'y', 'w', 'h', 'size', 'rx', 'ry']) {
      if (k in n) {
        assert.ok(Number.isFinite(n[k]), `Coordinate ${k} must be finite in node: ${JSON.stringify(n)}`);
      }
    }
  }

  const allText = scene.nodes.filter(n => n.kind === 'text').map(n => n.text).join(' ');
  assert.ok(allText.includes('STUDY'), 'Must include STUDY in badge');
  assert.ok(allText.includes('SKILLS'), 'Must include SKILLS in badge');
  assert.ok(allText.includes('Face value of:'), 'Must include header prompt');
  assert.ok(allText.includes('7 is 7.'), 'Must include topic text');
});
