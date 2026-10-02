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
const { createSmartBlockInstance } = require('../src/editor/educational/blockRegistry.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { createFrameworkChapter, setFrameworkMode } = require('../src/editor/curriculum/actions.ts');
const { DEFAULT_CHAPTER_CONFIG, makeCurriculumBlock } = require('../src/editor/curriculum/chapterEngine.ts');
const { renderPublicationPdf } = require('../src/editor/educational/publicationPdf.ts');
const { jsPDF } = require('jspdf');
const initial = structuredClone({ books: store.getState().books, elements: store.getState().elements, activeBookId: store.getState().activeBookId });
function reset() { store.setState({ ...structuredClone(initial), activePageIndex: 0, selectedElementIds: [] }); history.getState().clearHistory(); }
const layoutFor = node => ({ enabled: true, items: { [node.contentId]: { base: node.kind === 'text' ? node.text : node.src, dx: 26, dy: -9 } } });

test('authored text positions and edits survive serialization and reach selectable PDF text', async () => {
  const block = createSmartBlockInstance('studio-quick-check-1', 'page');
  const original = buildPublicationScene(block), node = original.nodes.find(n => n.kind === 'text');
  block.styleOverrides.contentLayout = layoutFor(node);
  block.styleOverrides.contentLayout.items[node.contentId].text = 'AUTHORED HEADING';
  const restored = JSON.parse(JSON.stringify(block)), scene = buildPublicationScene(restored);
  const edited = scene.nodes.find(n => n.contentId === node.contentId);
  assert.equal(edited.x, node.x + 26); assert.equal(edited.y, node.y - 9); assert.equal(edited.text, 'AUTHORED HEADING');
  assert.equal(scene.height, original.height); assert.equal(scene.width, original.width);
  assert.equal(block.semanticContent.title, restored.semanticContent.title);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  await renderPublicationPdf(pdf, scene, { transform: { ...block.transform, height: scene.height }, style: {} }, 0, 0);
  assert.match(pdf.output(), /AUTHORED HEADING/);
});

test('images move independently, retain their own mask, and accept replacements', () => {
  const block = makeCurriculumBlock('chapter-hero', DEFAULT_CHAPTER_CONFIG);
  block.styleOverrides.contentLayout = { enabled: true, items: {} };
  const original = buildPublicationScene(block), node = original.nodes.find(n => n.kind === 'image');
  assert.ok(node);
  block.styleOverrides.contentLayout = layoutFor(node);
  block.styleOverrides.contentLayout.items[node.contentId].src = '/assets/replaced.png';
  const moved = buildPublicationScene(block).nodes.find(n => n.contentId === node.contentId);
  assert.equal(moved.x, node.x + 26); assert.equal(moved.y, node.y - 9);
  assert.equal(moved.w, node.w); assert.equal(moved.h, node.h); assert.equal(moved.mask, node.mask);
  assert.equal(moved.src, '/assets/replaced.png'); assert.equal(moved.clipId, undefined);
  assert.deepEqual(buildPublicationScene(block).nodes.filter(n => n.kind === 'text'), original.nodes.filter(n => n.kind === 'text'));
});

test('new content never inherits stale text or nonfinite positions', () => {
  const block = createSmartBlockInstance('studio-quick-check-1', 'page');
  const node = buildPublicationScene(block).nodes.find(n => n.kind === 'text');
  block.styleOverrides.contentLayout = layoutFor(node);
  const item = block.styleOverrides.contentLayout.items[node.contentId];
  item.base = 'obsolete text'; item.text = 'must not overwrite curriculum';
  assert.deepEqual(buildPublicationScene(block).nodes.find(n => n.contentId === node.contentId), node);
  item.base = node.text; item.dx = Infinity; item.dy = NaN; delete item.text;
  assert.equal(buildPublicationScene(block).nodes.find(n => n.contentId === node.contentId).x, node.x);
  assert.equal(buildPublicationScene(block).nodes.find(n => n.contentId === node.contentId).y, node.y);
});

test('fixed block frames reject resizing but permit movement, with undo and redo', () => {
  reset();
  const element = store.getState().addEducationalBlock('studio-quick-check-1', 40, 40);
  const node = buildPublicationScene(element.smartBlockData).nodes.find(n => n.kind === 'text');
  store.getState().updateBlockContentLayout(element.id, layoutFor(node));
  const before = store.getState().elements[element.id].transform;
  store.getState().updateElementTransform(element.id, { x: before.x + 8, width: 999, height: 999 }, true);
  const after = store.getState().elements[element.id].transform;
  assert.equal(after.x, before.x + 8); assert.equal(after.width, before.width); assert.equal(after.height, before.height);
  history.getState().undo(); assert.deepEqual(store.getState().elements[element.id].transform, before);
  history.getState().redo(); assert.deepEqual(store.getState().elements[element.id].transform, after);
  store.getState().fitRenderedBlockHeight(element.id, 999);
  store.getState().updateElement(element.id, { transform: { ...after, width: 999, height: 999 } });
  assert.deepEqual(store.getState().elements[element.id].transform, after);
  history.getState().undo(); history.getState().undo(); history.getState().undo();
  assert.equal(store.getState().elements[element.id].smartBlockData.styleOverrides.contentLayout, undefined);
});

test('curriculum source and placed block share edits without recomposition or page movement', () => {
  reset();
  const chapter = createFrameworkChapter({ ...DEFAULT_CHAPTER_CONFIG, pageCount: 3 });
  setFrameworkMode(chapter.id, 'design');
  const state = store.getState(), element = Object.values(state.elements).find(el => el.smartBlockData?.curriculum?.chapterId === chapter.id);
  const sourceId = element.smartBlockData.curriculum.sourceBlockId || element.smartBlockData.id;
  const pages = structuredClone(state.getActiveBook().pages), transforms = Object.fromEntries(Object.values(state.elements).map(el => [el.id, el.transform]));
  const node = buildPublicationScene({ ...element.smartBlockData, transform: element.transform }).nodes.find(n => n.kind === 'text');
  const layout = layoutFor(node);
  store.getState().updateBlockContentLayout(element.id, layout);
  assert.deepEqual(store.getState().getActiveBook().chapters.find(ch => ch.id === chapter.id).framework.blocks[sourceId].styleOverrides.contentLayout, layout);
  assert.deepEqual(store.getState().getActiveBook().pages, pages);
  assert.deepEqual(Object.fromEntries(Object.values(store.getState().elements).map(el => [el.id, el.transform])), transforms);
  history.getState().undo(); assert.equal(store.getState().elements[element.id].smartBlockData.styleOverrides.contentLayout, undefined);
  history.getState().redo(); assert.deepEqual(store.getState().elements[element.id].smartBlockData.styleOverrides.contentLayout, layout);
});

test('content locks still allow repositioning and reject text edits', () => {
  reset(); const el = store.getState().addEducationalBlock('studio-quick-check-1', 40, 40);
  store.getState().updateElement(el.id, { smartBlockData: { ...el.smartBlockData, isLockedContent: true } });
  const node = buildPublicationScene(el.smartBlockData).nodes.find(n => n.kind === 'text'), layout = layoutFor(node);
  store.getState().updateBlockContentLayout(el.id, layout);
  assert.deepEqual(store.getState().elements[el.id].smartBlockData.styleOverrides.contentLayout, layout);
  const changed = structuredClone(layout); changed.items[node.contentId].text = 'blocked';
  store.getState().updateBlockContentLayout(el.id, changed);
  assert.deepEqual(store.getState().elements[el.id].smartBlockData.styleOverrides.contentLayout, layout);
});
