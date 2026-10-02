import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
const engine = require('../src/editor/curriculum/chapterEngine.ts');
const { CURRICULUM_BLOCKS, CHAPTER_PRESETS } = require('../src/editor/curriculum/catalog.ts');
const { createSchemaTopic, schemaTopics, moveSchemaTopic } = require('../src/editor/curriculum/lessonSchema.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { sceneWindows, sliceScene } = require('../src/editor/curriculum/pagination.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
const actions = require('../src/editor/curriculum/actions.ts');
const words = scene => scene.nodes.filter(n => n.kind === 'text').map(n => n.text).join(' ');
const starter = structuredClone(useEditorStore.getState().getActiveBook());
function reset() {
  const book = structuredClone(starter);
  book.pages = [{ id: 'schema-test-page', pageIndex: 0, displayNumber: '1', elementIds: [], status: 'Draft' }];
  book.chapters = []; book.units = [];
  useEditorStore.setState({ books: [book], activeBookId: book.id, elements: {}, activePageIndex: 0, selectedElementIds: [] });
  useHistoryStore.getState().clearHistory();
  return book;
}
test('schema is second after chapter title across every preset, grade and subject', () => {
  assert.deepEqual(CURRICULUM_BLOCKS.slice(0, 2).map(b => b.id), ['chapter-hero', 'lesson-schema']);
  for (const grade of ['NURSERY', 3, 12]) for (const subject of ['Maths', 'Science', 'English', 'Art', 'My custom subject']) for (const preset of CHAPTER_PRESETS) {
    const f = engine.generateFramework({ ...engine.DEFAULT_CHAPTER_CONFIG, grade, subject, preset: preset.id, schemaEmptyBoxes: 2 }, 'chapter');
    const [hero, schema] = engine.orderedBlocks(f);
    assert.equal(hero.curriculum.type, 'chapter-hero'); assert.equal(schema.curriculum.type, 'lesson-schema');
    assert.equal(schema.semanticContent.calloutText, f.config.title);
    assert.deepEqual(schemaTopics(schema).map(t => t.label), [...f.config.concepts, '', '']);
  }
});
test('empty boxes, custom icons/colours and stable topic IDs survive reordering and serialization', () => {
  const topics = [createSchemaTopic('Plant parts', 0, 'Science'), createSchemaTopic('', 1), createSchemaTopic('Growth', 2)];
  topics[0].icon = 'leaf'; topics[0].color = '#123456';
  const reordered = moveSchemaTopic(topics, topics[0].id, 1);
  assert.deepEqual(reordered.map(t => t.label), ['', 'Plant parts', 'Growth']);
  assert.deepEqual(reordered[1], topics[0]);
  assert.deepEqual(JSON.parse(JSON.stringify(reordered)), reordered);
  const block = engine.makeCurriculumBlock('lesson-schema', engine.DEFAULT_CHAPTER_CONFIG);
  block.semanticContent.lessonSchemaTopics = [];
  assert.deepEqual(schemaTopics(block), []);
});
test('both layouts preserve long Unicode labels and many topics through publication pagination', () => {
  for (const width of [180, 320, 517, 900]) for (const layout of ['lesson-schema', 'lesson-schema-stacked']) {
    const block = engine.makeCurriculumBlock('lesson-schema', { ...engine.DEFAULT_CHAPTER_CONFIG, title: 'సంఖ్యలు और शब्दों की दुनिया', concepts: [] });
    block.transform.width = width; block.styleOverrides.layoutVariant = layout;
    block.semanticContent.lessonSchemaTopics = Array.from({ length: 31 }, (_, i) => createSchemaTopic(i % 4 === 0 ? '' : `Topic ${i}: ${'Observe and explain a connection. '.repeat(4)}`, i));
    const scene = buildPublicationScene(block), windows = sceneWindows(scene, 640);
    assert.ok(windows.length > 1);
    const slices = windows.map(window => sliceScene(scene, window));
    const fullText = scene.nodes.filter(n => n.kind === 'text').map(n => n.text);
    assert.deepEqual(slices.flatMap(s => s.nodes.filter(n => n.kind === 'text').map(n => n.text)).sort(), fullText.sort());
    assert.equal(scene.motifs.filter(m => m.id.startsWith('topic:')).length, 31);
    for (const n of scene.nodes) for (const key of ['x', 'y', 'w', 'h', 'rx', 'ry', 'size']) if (key in n) assert.ok(Number.isFinite(n[key]), `${layout}/${width}/${key}`);
    for (const m of scene.motifs) assert.ok(m.x >= 0 && m.y >= 0 && m.x + m.w <= width + .01 && m.y + m.h <= scene.height + .01);
    assert.ok(words(scene).includes('Topic 30'));
  }
});
test('standalone schema growth paginates, continuation edits sync, and deletion supports undo/redo', () => {
  reset(); actions.insertCurriculumBlock('lesson-schema', undefined, 4, 'Music');
  const id = useEditorStore.getState().selectedElementIds[0];
  const topics = Array.from({ length: 40 }, (_, i) => createSchemaTopic(i % 3 ? `Music topic ${i}` : '', i, 'Music'));
  useEditorStore.getState().updateSmartBlockContent(id, { lessonSchemaTopics: topics });
  const state = useEditorStore.getState(), book = state.getActiveBook();
  assert.ok(book.pages.length > 1);
  const projections = Object.values(state.elements).filter(el => el.smartBlockData?.curriculum?.sourceBlockId === id);
  for (const el of projections) { assert.deepEqual(schemaTopics(el.smartBlockData), topics); assert.ok(el.transform.y + el.transform.height <= book.dimensions.heightPt - book.margins.bottomPt + .01); }
  const last = projections.at(-1);
  useEditorStore.getState().updateSmartBlockContent(last.id, { lessonSchemaTopics: [topics[1]] });
  assert.deepEqual(schemaTopics(useEditorStore.getState().elements[id].smartBlockData), [topics[1]]);
  assert.ok(useEditorStore.getState().getActiveBook().pages.length < book.pages.length);
  useHistoryStore.getState().undo();
  assert.deepEqual(schemaTopics(useEditorStore.getState().elements[id].smartBlockData), topics);
  useHistoryStore.getState().redo();
  assert.deepEqual(schemaTopics(useEditorStore.getState().elements[id].smartBlockData), [topics[1]]);
});
test('framework topic changes preserve empty slots, canonical content and undo', () => {
  reset(); const ch = actions.createFrameworkChapter({ ...engine.DEFAULT_CHAPTER_CONFIG, pageCount: 3 });
  const schema = Object.values(ch.framework.blocks).find(b => b.curriculum.type === 'lesson-schema');
  const topics = [...schemaTopics(schema), ...Array.from({ length: 22 }, (_, i) => createSchemaTopic('', i))];
  useEditorStore.getState().updateSmartBlockContent(schema.id, { lessonSchemaTopics: topics });
  assert.deepEqual(useEditorStore.getState().getActiveBook().chapters[0].framework.blocks[schema.id].semanticContent.lessonSchemaTopics, topics);
  useHistoryStore.getState().undo();
  assert.deepEqual(useEditorStore.getState().getActiveBook().chapters[0].framework.blocks[schema.id].semanticContent.lessonSchemaTopics, schemaTopics(schema));
});
test('library schema takes the chapter title and saves blank topics and custom styling', () => {
  reset(); const ch = actions.createFrameworkChapter({ ...engine.DEFAULT_CHAPTER_CONFIG, title: 'Fractions in everyday life', subject: 'Maths', pageCount: 3 });
  const template = engine.makeCurriculumBlock('lesson-schema', { ...engine.DEFAULT_CHAPTER_CONFIG, title: 'Unrelated sample' });
  template.semanticContent.lessonSchemaTopics = [createSchemaTopic('', 0), createSchemaTopic('Equivalent fractions', 1, 'Maths')];
  template.semanticContent.lessonSchemaTopics[1].color = '#123456';
  template.semanticContent.metadata = { authorNote: 'Keep this note' };
  actions.insertCurriculumBlock('lesson-schema', undefined, undefined, undefined, template);
  const framework = useEditorStore.getState().getActiveBook().chapters.find(c => c.id === ch.id).framework;
  const id = useEditorStore.getState().selectedElementIds[0];
  assert.equal(framework.blocks[id].semanticContent.calloutText, 'Fractions in everyday life');
  const { toSemanticDocument, applySemanticDocument } = require('../src/editor/persistence/semanticDocument.ts');
  const wire = toSemanticDocument(framework);
  assert.equal(wire.blocks[id].semanticContent.lessonSchemaTopics, undefined);
  const restored = applySemanticDocument(framework, JSON.parse(JSON.stringify(wire)));
  assert.deepEqual(restored.blocks[id].semanticContent, JSON.parse(JSON.stringify(framework.blocks[id].semanticContent)));
});
test('a map moves intact to the next page when remaining space is too short', () => {
  const book = reset();
  const occupied = { id: 'occupied', pageId: book.pages[0].id, type: 'text', category: 'body', content: { text: 'Existing content' }, style: {}, transform: { x: 40, y: 40, width: 200, height: book.dimensions.heightPt - book.margins.bottomPt - 160, rotation: 0 }, locked: false, hidden: false };
  book.pages[0].elementIds = [occupied.id];
  useEditorStore.setState({ books: [book], elements: { [occupied.id]: occupied } });
  actions.insertCurriculumBlock('lesson-schema', undefined, 4, 'Geography');
  const state = useEditorStore.getState(), schema = state.elements[state.selectedElementIds[0]];
  assert.equal(state.getActiveBook().pages.length, 2);
  assert.notEqual(schema.pageId, occupied.pageId);
  assert.equal(schema.smartBlockData.styleOverrides.sceneSlice, undefined);
  assert.deepEqual(state.elements.occupied, occupied);
});
