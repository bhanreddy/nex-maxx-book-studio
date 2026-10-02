import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { collectPrintPages } = require('../src/editor/publishing/publicationPrint.ts');
const { makeCurriculumBlock, DEFAULT_CHAPTER_CONFIG } = require('../src/editor/curriculum/chapterEngine.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { addEmptySpaces } = require('../src/editor/curriculum/studySkills.ts');
const initial = structuredClone({ books: store.getState().books, elements: store.getState().elements, activeBookId: store.getState().activeBookId, activePageIndex: 0 });
function setup() {
  store.setState({ ...structuredClone(initial), selectedElementIds: [] });
  const state = store.getState(), book = state.getActiveBook(), page = book.pages[0];
  const element = (id, x, y) => ({ id, pageId: page.id, type: 'shape', category: 'decorative', version: 1, displayName: id,
    transform: { x, y, width: 60, height: 40, rotation: 0, zIndex: 3 }, style: { backgroundColor: '#abcdef' }, content: {}, locked: false, hidden: false });
  store.setState({ elements: { a: element('a', 50, 80), b: element('b', 180, 160) }, books: [ { ...book, pageFrame: null, pageFramePolicy: 'custom', pages: book.pages.map((p, i) => ({ ...p, elementIds: i === 0 ? ['a', 'b'] : [] })) } ] });
  history.getState().clearHistory();
  return store.getState();
}
function group() { setup(); store.setState({ selectedElementIds: ['a','b'] }); store.getState().groupSelectedElements(); return store.getState().selectedElementIds[0]; }

test('grouping keeps geometry and appearance, selects the parent, and undoes/redoes', () => {
  setup(); const before = structuredClone(store.getState().elements);
  store.setState({ selectedElementIds: ['a','b'] }); store.getState().groupSelectedElements();
  const id = store.getState().selectedElementIds[0];
  assert.equal(store.getState().elements[id].type, 'group');
  for (const key of ['a','b']) { assert.deepEqual(store.getState().elements[key].transform, before[key].transform); assert.deepEqual(store.getState().elements[key].style, before[key].style); }
  store.getState().selectElement('a'); assert.deepEqual(store.getState().selectedElementIds, [id]);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
  history.getState().redo(); assert.equal(store.getState().elements.a.groupId, id);
});

test('moving, resizing and rotating a group affects descendants with one undo entry', () => {
  const id = group(); const before = structuredClone(store.getState().elements);
  store.getState().updateElementTransform(id, { x: 70, y: 100, width: 380, height: 240 }, true);
  assert.equal(store.getState().elements.a.transform.x, 70);
  assert.equal(store.getState().elements.a.transform.width, 120);
  assert.equal(store.getState().elements.b.transform.x, 330);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
  history.getState().redo(); assert.equal(store.getState().elements.a.transform.width, 120);
  store.getState().updateElementTransform(id, { rotation: 90 }, true);
  assert.equal(store.getState().elements.a.transform.rotation, 90);
});

test('locking a group blocks descendant edits, movement, deletion and ungrouping; unlock and undo work', () => {
  const id = group(); store.getState().toggleLockElement(id);
  const before = structuredClone(store.getState().elements);
  store.getState().updateElement('a', { content: { text: 'blocked' } });
  store.getState().updateElementTransform('a', { x: 200 }, true);
  store.getState().updateElementTransform(id, { x: 300 }, true);
  store.getState().deleteSelectedElements(); store.getState().ungroupSelectedElements();
  assert.deepEqual(store.getState().elements, before);
  store.getState().toggleLockElement(id); store.getState().ungroupSelectedElements();
  assert.equal(store.getState().elements[id], undefined); assert.equal(store.getState().elements.a.groupId, undefined);
  history.getState().undo(); assert.equal(store.getState().elements.a.groupId, id);
});

test('duplicate, clipboard paste, page duplicate and group deletion never alias original children', () => {
  const id = group(); store.getState().duplicateSelectedElements();
  const copy = store.getState().elements[store.getState().selectedElementIds[0]];
  assert.notEqual(copy.id, id); assert.equal(copy.childElementIds.length, 2);
  assert.ok(copy.childElementIds.every(child => store.getState().elements[child].groupId === copy.id && !['a','b'].includes(child)));
  store.getState().copySelection(); store.getState().pasteSelection();
  const pasted = store.getState().elements[store.getState().selectedElementIds[0]];
  assert.ok(pasted.childElementIds.every(child => !copy.childElementIds.includes(child)));
  store.getState().duplicatePage(0);
  const page = store.getState().getActivePage();
  for (const el of page.elementIds.map(id => store.getState().elements[id])) if (el.childElementIds?.length) assert.ok(el.childElementIds.every(child => page.elementIds.includes(child)));
  store.getState().setActivePageIndex(0); store.getState().selectElement(id); store.getState().deleteSelectedElements();
  assert.equal(store.getState().elements.a, undefined); assert.equal(store.getState().elements[id], undefined);
  history.getState().undo(); assert.equal(store.getState().elements.a.groupId, id);
  store.getState().clearSelection(); history.getState().redo(); assert.equal(store.getState().elements.a, undefined);
});

test('nested grouping moves leaves once and ungrouping preserves the nested group', () => {
  const inner = group(), state = store.getState(), page = state.getActivePage();
  const c = { ...state.elements.a, id: 'c', groupId: undefined, transform: { ...state.elements.a.transform, x: 350 } };
  state.insertPublicationElement(c); store.setState({ selectedElementIds: [inner,'c'] }); state.groupSelectedElements();
  const outer = store.getState().selectedElementIds[0], t = store.getState().elements[outer].transform;
  store.getState().updateElementTransform(outer, { x: t.x + 10 }, true);
  assert.equal(store.getState().elements.a.transform.x, 60);
  store.getState().ungroupSelectedElements(); assert.equal(store.getState().elements[inner].groupId, undefined);
  assert.equal(store.getState().elements.a.groupId, inner);
});

test('deleting a page cleans elements and chapter membership, preserves active page, and restores all data on undo', () => {
  setup(); const state = store.getState(), before = structuredClone(state.getActiveBook()), page = before.pages[0];
  store.setState({ books: [{ ...before, chapters: before.chapters.map(ch => ({ ...ch, pageIds: [...ch.pageIds, page.id] })) }] });
  const book = structuredClone(store.getState().getActiveBook());
  store.getState().setActivePageIndex(2); const activeId = store.getState().getActivePage().id;
  store.getState().deletePage(0);
  assert.equal(store.getState().getActivePage().id, activeId);
  assert.equal(store.getState().elements.a, undefined);
  assert.ok(store.getState().getActiveBook().chapters.every(ch => !ch.pageIds.includes(page.id)));
  history.getState().undo(); assert.deepEqual(store.getState().getActiveBook(), book); assert.ok(store.getState().elements.a);
  history.getState().redo(); assert.equal(store.getState().elements.a, undefined);
  const count = store.getState().getActiveBook().pages.length;
  store.getState().deletePage(-1); store.getState().deletePage(9999);
  assert.equal(store.getState().getActiveBook().pages.length, count);
});

test('the last page cannot be deleted, and grouping leaves exported child artwork intact', () => {
  const id = group(); const state = store.getState(), book = state.getActiveBook();
  const single = { ...book, pages: [state.getActivePage()] };
  store.setState({ books: [single], activePageIndex: 0 }); store.getState().deletePage(0);
  assert.equal(store.getState().getActiveBook().pages.length, 1);
  const print = collectPrintPages(single, store.getState().elements);
  assert.equal(print[0].elements.length, 2); assert.ok(print[0].elements.every(({ element }) => element.id !== id));
});

test('adding write-in space grows content and the inner Study Skills surface follows an expanded frame', () => {
  setup(); const page = store.getState().getActivePage();
  const block = makeCurriculumBlock('study-skills', { ...DEFAULT_CHAPTER_CONFIG, subject: 'Maths', grade: 3 });
  block.transform = { ...block.transform, height: 0 };
  const natural = buildPublicationScene(block);
  const expanded = buildPublicationScene({ ...block, transform: { ...block.transform, height: natural.height + 100 } });
  assert.equal(expanded.height, natural.height + 100);
  assert.ok(expanded.nodes.some(node => node.kind === 'rect' && node.fill === '#FAF7F2' && node.h === expanded.height));
  const el = { ...store.getState().elements.a, id: block.id, pageId: page.id, type: 'smart-block', smartBlockData: block, transform: { ...block.transform, height: natural.height } };
  store.getState().insertPublicationElement(el);
  store.getState().updateSmartBlockContent(el.id, { studySkillTopics: addEmptySpaces(block.semanticContent.studySkillTopics || [], 12) });
  assert.ok(store.getState().elements[el.id].transform.height > natural.height);
  history.getState().undo(); assert.equal(store.getState().elements[el.id].transform.height, natural.height);
});


test('stacking and alignment preserve group geometry, respect locks, and undo every child', () => {
  const id = group(), state = store.getState();
  const c = { ...state.elements.a, id: 'c', groupId: undefined, transform: { ...state.elements.a.transform, x: 350, y: 60 } };
  state.insertPublicationElement(c); store.setState({ selectedElementIds: [id, 'c'] });
  const before = structuredClone(store.getState().elements);
  store.getState().smartStack(undefined, 'horizontal');
  const stacked = structuredClone(store.getState().elements);
  assert.notEqual(stacked[id].transform.y, before[id].transform.y);
  assert.equal(stacked.a.transform.x - stacked[id].transform.x, 0);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
  history.getState().redo(); assert.deepEqual(store.getState().elements, stacked);
  store.getState().arrangeSelection('right', 'selection');
  assert.notEqual(store.getState().elements.a.transform.x, stacked.a.transform.x);
  history.getState().undo(); assert.deepEqual(store.getState().elements, stacked);
  store.getState().toggleLockElement(id);
  const locked = structuredClone(store.getState().elements);
  store.getState().smartStack(undefined, 'vertical');
  store.getState().setElementLayoutMode(id, 'adaptive');
  store.getState().performBooleanOperation('union');
  assert.deepEqual(store.getState().elements, locked);
});
