import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file);
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { detachPublicationScene, detachedSceneForElement } = require('../src/editor/educational/detachScene.ts');
const { transformScenePath } = require('../src/editor/educational/sceneGeometry.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { createFrameworkChapter, setFrameworkMode, reshuffleCurriculumBlock } = require('../src/editor/curriculum/actions.ts');
const { DEFAULT_CHAPTER_CONFIG, makeCurriculumBlock, changeBlockLayout } = require('../src/editor/curriculum/chapterEngine.ts');
const { CURRICULUM_BLOCKS } = require('../src/editor/curriculum/catalog.ts');
const { PREMIUM_BLOCK_LAYOUTS, premiumShuffleOrder } = require('../src/editor/curriculum/premiumLayouts.ts');
const initial = structuredClone({ books: store.getState().books, elements: store.getState().elements, activeBookId: store.getState().activeBookId });
function reset() { store.setState({ ...structuredClone(initial), activePageIndex: 0, selectedElementIds: [] }); history.getState().clearHistory(); }
function shrink(el) {
  store.getState().updateElementTransform(el.id, { width: el.transform.width / 2, height: el.transform.height / 2 }, true, 'scale');
  return structuredClone(store.getState().elements[el.id]);
}

test('editing standalone schema, outcomes, and reference blocks retains the chosen dimensions and scale', () => {
  for (const type of ['lesson-schema', 'learning-outcomes', 'quick-check']) {
    reset();
    const block = makeCurriculumBlock(type, DEFAULT_CHAPTER_CONFIG);
    if (type === 'quick-check') block.styleOverrides.referenceElement = { kind: 'quick-check', showBody: true };
    block.pageId = store.getState().getActivePage().id;
    block.transform.height = buildPublicationScene(block).height;
    const element = { id: block.id, pageId: block.pageId, type: 'smart-block', category: 'educational', version: 4, transform: block.transform, style: {}, content: {}, smartBlockData: block };
    store.getState().insertPublicationElement(element);
    const before = shrink(element), pages = structuredClone(store.getState().getActiveBook().pages);
    store.getState().updateSmartBlockContent(element.id, { title: 'Edited after resizing' });
    store.getState().updateSmartBlockStyle(element.id, { customPalette: { primary: '#123456' } });
    const after = store.getState().elements[element.id];
    assert.deepEqual(after.transform, before.transform, type);
    assert.deepEqual(after.smartBlockData.styleOverrides.resizeFrame, before.smartBlockData.styleOverrides.resizeFrame, type);
    assert.deepEqual(store.getState().getActiveBook().pages, pages, type);
    assert.equal(after.smartBlockData.semanticContent.title, 'Edited after resizing');
    history.getState().undo(); assert.deepEqual(store.getState().elements[element.id].transform, before.transform);
    history.getState().redo(); assert.deepEqual(store.getState().elements[element.id], after);
  }
});

test('framework edits and shuffle preserve placed scale even when canonical content has never been resized', () => {
  reset(); const chapter = createFrameworkChapter({ ...DEFAULT_CHAPTER_CONFIG, pageCount: 3 });
  setFrameworkMode(chapter.id, 'design');
  const el = Object.values(store.getState().elements).find(el => el.smartBlockData?.curriculum?.chapterId === chapter.id && el.smartBlockData.curriculum.type === 'chapter-hero');
  const before = shrink(el), pages = structuredClone(store.getState().getActiveBook().pages);
  const sourceId = before.smartBlockData.curriculum.sourceBlockId;
  assert.equal(store.getState().getActiveBook().chapters.find(ch => ch.id === chapter.id).framework.blocks[sourceId].styleOverrides.resizeFrame, undefined);
  store.getState().updateSmartBlockContent(el.id, { title: 'A resized chapter title' });
  reshuffleCurriculumBlock(store.getState().elements[el.id]);
  const after = store.getState().elements[el.id];
  assert.deepEqual(after.transform, before.transform);
  assert.deepEqual(after.smartBlockData.styleOverrides.resizeFrame, before.smartBlockData.styleOverrides.resizeFrame);
  assert.equal(after.smartBlockData.styleOverrides.layoutVariant, 'premium-editorial');
  assert.deepEqual(store.getState().getActiveBook().pages, pages);
  const canonical = store.getState().getActiveBook().chapters.find(ch => ch.id === chapter.id).framework.blocks[sourceId];
  assert.deepEqual(canonical.styleOverrides.resizeFrame, before.smartBlockData.styleOverrides.resizeFrame);
  assert.equal(canonical.semanticContent.title, 'A resized chapter title');
  const ids = store.getState().detachEducationalBlock(el.id);
  assert.ok(ids.length > 0);
  const sourceText = buildPublicationScene(after.smartBlockData).nodes.find(n => n.kind === 'text');
  const text = Object.values(store.getState().elements).find(el => ids.includes(el.id) && el.content.text === sourceText.text);
  assert.ok(text);
  assert.equal(text.style.fontSize, sourceText.size / 2);
  history.getState().undo(); assert.deepEqual(store.getState().elements[el.id], after);
});

test('detach bakes the visible scale once into text, image dimensions, position and native text edits', () => {
  const block = makeCurriculumBlock('chapter-hero', DEFAULT_CHAPTER_CONFIG);
  block.transform.height = buildPublicationScene(block).height;
  const source = buildPublicationScene(block);
  block.styleOverrides.resizeFrame = { width: block.transform.width, height: block.transform.height };
  block.transform = { ...block.transform, x: 40, y: 60, width: block.transform.width / 2, height: block.transform.height / 2 };
  const children = detachPublicationScene(block, 1);
  const node = source.nodes.find(n => n.kind === 'text'), text = children.find(el => el.content.text === node.text);
  assert.equal(text.style.fontSize, node.size / 2);
  const primitive = text.content.publicationPrimitive.nodes.find(n => n.kind === 'text');
  assert.equal(text.transform.x + primitive.x, block.transform.x + node.x / 2);
  assert.equal(text.transform.y + primitive.y, block.transform.y + node.y / 2);
  const imageNode = source.nodes.find(n => n.kind === 'image'), image = children.find(el => el.type === 'image');
  assert.equal(image.transform.width, imageNode.w / 2); assert.equal(image.transform.height, imageNode.h / 2);
  assert.equal(image.transform.x, 40 + imageNode.x / 2); assert.equal(image.transform.y, 60 + imageNode.y / 2);
  text.content.text = 'Edited native text after detaching';
  const edited = detachedSceneForElement(text);
  assert.ok(edited.nodes.every(n => n.size === node.size / 2 && n.textLength === undefined));
  assert.equal(edited.nodes.map(n => n.text).join('').replaceAll(' ', ''), text.content.text.replaceAll(' ', ''));
});

test('SVG detach geometry scales arc radii and coordinates without changing angles, flags or relative offsets', () => {
  assert.equal(transformScenePath('M 100 80 A 30 20 45 0 1 160 120 l 10 -6 h 8 v 4 Z', .5, .5, -20, -10),
    'M 30 30 A 15 10 45 0 1 60 50 l 5 -3 h 4 v 2 Z');
  assert.equal(transformScenePath('m 1E2 80 10 20', .5, .5, -20, -10), 'm 30 30 5 10');
});

test('all original layouts stay in shuffle and each premium treatment retains edited content geometry', () => {
  for (const def of CURRICULUM_BLOCKS) {
    const order = premiumShuffleOrder(def.layouts);
    assert.equal(new Set(order).size, def.layouts.length);
    assert.deepEqual(new Set(order), new Set(def.layouts));
    assert.deepEqual(PREMIUM_BLOCK_LAYOUTS.filter(v => order.includes(v)), PREMIUM_BLOCK_LAYOUTS);
  }
  for (const type of ['chapter-hero', 'lesson-schema', 'study-skills', 'learning-outcomes', 'quick-check', 'concept-explorer']) {
    const block = makeCurriculumBlock(type, DEFAULT_CHAPTER_CONFIG);
    block.transform.height = 0;
    const original = buildPublicationScene(block);
    const first = original.nodes.find(n => n.kind === 'text');
    const appearances = [];
    for (const variant of PREMIUM_BLOCK_LAYOUTS) {
      const next = changeBlockLayout(block, variant);
      const scene = buildPublicationScene(next);
      const geometry = nodes => nodes.filter(n => n.kind === 'text' || n.kind === 'image').map(n => n.kind === 'text'
        ? [n.contentId, n.x, n.y, n.size, n.text, n.textLength] : [n.contentId, n.x, n.y, n.w, n.h, n.src]);
      assert.deepEqual(geometry(scene.nodes), geometry(original.nodes), `${type} ${variant}`);
      assert.equal(scene.height, original.height);
      next.styleOverrides.contentLayout = { enabled: true, items: { [first.contentId]: { base: first.text, dx: 12, dy: 6, text: 'MY CUSTOM TEXT' } } };
      const edited = buildPublicationScene(JSON.parse(JSON.stringify(next))).nodes.find(n => n.contentId === first.contentId);
      assert.equal(edited.text, 'MY CUSTOM TEXT'); assert.equal(edited.x, first.x + 12); assert.equal(edited.y, first.y + 6);
      appearances.push(JSON.stringify(scene.nodes));
    }
    assert.equal(new Set(appearances).size, 3);
  }
});
