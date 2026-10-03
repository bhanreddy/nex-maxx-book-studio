import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { useUiStore: ui } = require('../src/editor/stores/uiStore.ts');
const { cloneElementTree } = require('../src/editor/core/elementGroups.ts');
const { clipboardOffset } = require('../src/editor/clipboard/elementClipboard.ts');
const base = structuredClone(store.getState().getActiveBook());

function setup() {
  const element = (id, x, y, zIndex = 2) => ({ id, pageId: 'source', type: 'shape', category: 'decorative', version: 1,
    displayName: id, locked: false, hidden: false, content: { text: id }, style: { backgroundColor: '#abcdef' },
    transform: { x, y, width: 60, height: 40, rotation: 0, zIndex } });
  const a = element('a', 50, 80), b = element('b', 180, 160, 3), c = element('c', 270, 200, 4);
  const inner = { ...element('inner', 50, 80, 5), type: 'group', content: {}, childElementIds: ['a', 'b'], transform: { x: 50, y: 80, width: 190, height: 120, rotation: 0, zIndex: 5 }, groupId: 'outer' };
  const outer = { ...element('outer', 50, 80, 6), type: 'group', content: {}, childElementIds: ['inner', 'c'], transform: { x: 50, y: 80, width: 280, height: 160, rotation: 0, zIndex: 6 } };
  a.groupId = b.groupId = 'inner'; c.groupId = 'outer';
  const background = { ...element('existing', 20, 30, 100), pageId: 'target' };
  const pages = ['source','target','third'].map((id, i) => ({ ...base.pages[0], id, pageIndex: i, displayNumber: String(i + 1), chapterId: undefined,
    elementIds: i === 0 ? ['a','b','c','inner','outer'] : i === 1 ? ['existing'] : [] }));
  const book = { ...base, id: 'clipboard-book', chapters: [], units: [], pageFrame: null, pageFramePolicy: 'custom', pages };
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: { a,b,c,inner,outer,existing: background },
    selectedElementIds: ['outer'], clipboardElements: [], clipboardMode: 'copy', clipboardSourceBookId: null, clipboardPasteCounts: {} });
  history.getState().clearHistory(); ui.setState({ toasts: [] });
  return structuredClone({ books: store.getState().books, elements: store.getState().elements });
}
function page(id) { return store.getState().getActiveBook().pages.find(p => p.id === id); }
function tree(root) {
  const elements = store.getState().elements;
  return [elements[root], ...elements[root].childElementIds.flatMap(id => elements[id].childElementIds ? tree(id) : [elements[id]])];
}

test('copying a selected descendant captures the whole nested group once and pastes independent editable objects on another page', () => {
  const before = setup(); store.setState({ selectedElementIds: ['a', 'inner', 'outer'] });
  store.getState().copySelection(); assert.equal(store.getState().clipboardElements.length, 5);
  store.getState().setActivePageIndex(1); store.getState().pasteSelection();
  const root = store.getState().selectedElementIds[0], items = tree(root);
  assert.equal(items.length, 5);
  for (const el of items) {
    assert.equal(el.pageId, 'target'); assert.ok(page('target').elementIds.includes(el.id));
    assert.equal(before.elements[el.id], undefined);
    const original = Object.values(before.elements).find(item => item.displayName === el.displayName);
    assert.equal(el.transform.x, original.transform.x); assert.equal(el.transform.y, original.transform.y);
    assert.deepEqual(el.style, original.style); assert.notEqual(el.style, original.style);
    assert.ok(el.transform.zIndex > 100);
    if (el.groupId) assert.ok(items.some(parent => parent.id === el.groupId && parent.childElementIds.includes(el.id)));
  }
  store.getState().updateElement(items.find(el => el.displayName === 'a').id, { content: { text: 'copy edit' } });
  assert.equal(store.getState().elements.a.content.text, 'a');
  assert.deepEqual(page('source').elementIds, before.books[0].pages[0].elementIds);
});

test('cut is non-destructive until paste, preserves identities and edits, and moves every child in one undoable action', () => {
  setup(); const sourceIds = [...page('source').elementIds];
  store.getState().cutSelection(); assert.deepEqual(page('source').elementIds, sourceIds);
  assert.equal(history.getState().past.length, 0);
  store.getState().updateElement('a', { content: { text: 'latest edit' } });
  const beforeMove = structuredClone(store.getState().elements);
  store.getState().pasteSelection({ pageId: 'target' });
  assert.equal(store.getState().getActivePage().id, 'target');
  assert.deepEqual(page('source').elementIds, []);
  assert.deepEqual(store.getState().selectedElementIds, ['outer']);
  for (const id of sourceIds) { assert.equal(store.getState().elements[id].pageId, 'target'); assert.ok(page('target').elementIds.includes(id)); }
  assert.equal(store.getState().elements.a.content.text, 'latest edit');
  assert.equal(store.getState().clipboardElements.length, 0);
  assert.equal(history.getState().past.at(-1).description, 'Move selection between pages');
  const afterMove = structuredClone(store.getState().elements);
  store.getState().setActivePageIndex(2); history.getState().undo();
  assert.equal(store.getState().getActivePage().id, 'source');
  assert.deepEqual(store.getState().elements, beforeMove); assert.deepEqual(page('source').elementIds, sourceIds);
  assert.deepEqual(page('target').elementIds, ['existing']);
  history.getState().redo(); assert.deepEqual(store.getState().elements, afterMove);
  assert.equal(store.getState().getActivePage().id, 'target');
  store.getState().pasteSelection(); assert.deepEqual(store.getState().elements, afterMove);
});

test('cancelling or copying over a pending cut leaves the original intact', () => {
  const before = setup(); store.getState().cutSelection(); store.getState().cancelCutSelection();
  assert.equal(store.getState().clipboardElements.length, 0);
  assert.deepEqual(store.getState().elements, before.elements); assert.deepEqual(store.getState().books, before.books);
  store.getState().cutSelection(); store.getState().copySelection();
  assert.equal(store.getState().clipboardMode, 'copy');
  store.getState().pasteSelection({ pageId: 'target' }); assert.equal(store.getState().elements.outer.pageId, 'source');
});

test('cut rejects a locked descendant as a whole; copy remains available and retains locks', () => {
  setup(); store.setState({ elements: { ...store.getState().elements, a: { ...store.getState().elements.a, locked: true } } });
  store.getState().cutSelection(); assert.equal(store.getState().clipboardElements.length, 0);
  assert.match(ui.getState().toasts.at(-1).message, /Unlock/);
  store.getState().copySelection(); store.getState().pasteSelection({ pageId: 'target' });
  assert.equal(tree(store.getState().selectedElementIds[0]).find(el => el.displayName === 'a').locked, true);
});

test('a group locked after cutting cannot be moved and the clipboard remains available after unlocking', () => {
  setup(); store.getState().cutSelection(); store.getState().toggleLockElement('outer');
  store.getState().pasteSelection({ pageId: 'target' }); assert.equal(store.getState().elements.outer.pageId, 'source');
  assert.equal(store.getState().clipboardMode, 'cut');
  store.getState().toggleLockElement('outer'); store.getState().pasteSelection({ pageId: 'target' });
  assert.equal(store.getState().elements.outer.pageId, 'target');
});

test('deleting the source of a pending cut cannot resurrect it or create orphan children', () => {
  setup(); store.getState().cutSelection(); store.getState().deletePage(0);
  store.getState().pasteSelection(); assert.equal(store.getState().elements.outer, undefined);
  assert.equal(store.getState().clipboardElements.length, 0); assert.equal(store.getState().elements.a, undefined);
  history.getState().undo(); assert.equal(store.getState().elements.a.groupId, 'inner');
});

test('a child removed while a cut is pending cannot leave a broken group on the destination', () => {
  setup(); store.getState().cutSelection();
  const elements = { ...store.getState().elements }; delete elements.a;
  store.setState({ elements, books: store.getState().books.map(book => ({ ...book, pages: book.pages.map(page => page.id === 'source'
    ? { ...page, elementIds: page.elementIds.filter(id => id !== 'a') } : page) })) });
  store.getState().pasteSelection({ pageId: 'target' });
  assert.deepEqual(page('target').elementIds, ['existing']);
  assert.equal(store.getState().elements.outer.pageId, 'source');
  assert.equal(store.getState().clipboardElements.length, 0);
});

test('repeated copy pastes offset together per destination page and Paste Here uses the requested point', () => {
  setup(); store.getState().copySelection(); store.getState().pasteSelection({ pageId: 'target' });
  const first = store.getState().elements[store.getState().selectedElementIds[0]];
  store.getState().pasteSelection(); const second = store.getState().elements[store.getState().selectedElementIds[0]];
  assert.equal(second.transform.x, first.transform.x + 20); assert.equal(second.transform.y, first.transform.y + 20);
  store.getState().pasteSelection({ pageId: 'third', position: { x: 110, y: 150 } });
  const third = tree(store.getState().selectedElementIds[0]);
  assert.equal(third[0].transform.x, 110); assert.equal(third[0].transform.y, 150);
  assert.equal(third.find(el => el.displayName === 'b').transform.x, 240);
  assert.equal(store.getState().getActivePage().id, 'third');
});

test('same-page copy is offset and a same-page cut repositions without duplicate page references', () => {
  setup(); store.getState().copySelection(); store.getState().pasteSelection();
  assert.equal(store.getState().elements[store.getState().selectedElementIds[0]].transform.x, 70);
  setup(); store.getState().cutSelection(); store.getState().pasteSelection({ position: { x: 100, y: 120 } });
  assert.equal(store.getState().elements.outer.transform.x, 100);
  assert.equal(new Set(page('source').elementIds).size, 5); assert.equal(page('source').elementIds.length, 5);
  history.getState().undo(); assert.equal(store.getState().elements.outer.transform.x, 50);
});

test('paste clamps a complete group onto the page without changing relative geometry or dimensions', () => {
  setup(); store.getState().copySelection(); store.getState().pasteSelection({ pageId: 'target', position: { x: 9999, y: -100 } });
  const items = tree(store.getState().selectedElementIds[0]), root = items[0];
  assert.equal(root.transform.y, 0); assert.equal(root.transform.x + root.transform.width, store.getState().getActiveBook().dimensions.widthPt);
  assert.equal(items.find(el => el.displayName === 'b').transform.x - root.transform.x, 130);
  assert.equal(root.transform.width, 280); assert.equal(root.transform.height, 160);
  const rotated = { ...store.getState().elements.a, transform: { x: 0, y: 0, width: 100, height: 40, rotation: 90, zIndex: 1 } };
  const offset = clipboardOffset([rotated], { widthPt: 80, heightPt: 120 }, 0, { x: 500, y: 500 });
  assert.ok(Math.abs(offset.dx - 10) < .001); assert.ok(Math.abs(offset.dy - 50) < .001);
});

test('copy paste undo and redo target the captured book and page even after navigating elsewhere', () => {
  const before = setup(); store.getState().copySelection(); store.getState().pasteSelection({ pageId: 'target' });
  const copiedIds = page('target').elementIds.filter(id => id !== 'existing');
  const other = { ...structuredClone(before.books[0]), id: 'other-book', pages: [{ ...before.books[0].pages[2], id: 'other-page', pageIndex: 0, displayNumber: '1', elementIds: [] }] };
  store.setState({ books: [...store.getState().books, other] }); store.getState().selectBook(other.id);
  history.getState().undo(); assert.equal(store.getState().activeBookId, 'clipboard-book');
  for (const id of copiedIds) assert.equal(store.getState().elements[id], undefined);
  assert.deepEqual(store.getState().books.find(b => b.id === 'other-book'), other);
  history.getState().redo(); assert.equal(store.getState().getActivePage().id, 'target');
  assert.equal(new Set(page('target').elementIds).size, 6);
});

test('copy remaps linked text and chapter ownership while moving smart blocks keeps their page and transform synchronized', () => {
  setup(); const state = store.getState();
  const a = { ...state.elements.a, linkedNextId: 'b', linkedPrevId: 'external', flowStoryId: 'story', content: { curriculumChapterId: 'chapter', curriculumBlockId: 'block' } };
  const b = { ...state.elements.b, linkedPrevId: 'a', flowStoryId: 'story' };
  const copy = cloneElementTree([a,b], 'target', { dx: 0, dy: 0 });
  const first = copy.elements[copy.roots[0]], second = copy.elements[copy.roots[1]];
  assert.equal(first.linkedNextId, second.id); assert.equal(second.linkedPrevId, first.id);
  assert.equal(first.linkedPrevId, undefined); assert.equal(first.flowStoryId, second.flowStoryId); assert.notEqual(first.flowStoryId, 'story');
  assert.equal(first.content.curriculumChapterId, undefined);
  const block = { id: 'a', pageId: 'source', transform: state.elements.a.transform, curriculum: undefined };
  store.setState({ elements: { ...state.elements, a: { ...state.elements.a, smartBlockData: block } } });
  store.getState().cutSelection(); store.getState().pasteSelection({ pageId: 'target', position: { x: 100, y: 100 } });
  const moved = store.getState().elements.a;
  assert.equal(moved.smartBlockData.id, moved.id); assert.equal(moved.smartBlockData.pageId, 'target');
  assert.deepEqual(moved.smartBlockData.transform, moved.transform);
});

test('empty copy preserves the clipboard and invalid destination has no effect', () => {
  setup(); store.getState().copySelection(); const clipboard = store.getState().clipboardElements;
  store.getState().clearSelection(); store.getState().copySelection(); assert.equal(store.getState().clipboardElements, clipboard);
  const before = structuredClone(store.getState().elements); store.getState().pasteSelection({ pageId: 'missing' });
  assert.deepEqual(store.getState().elements, before); assert.equal(history.getState().past.length, 0);
});

test('linked chapter projections require detachment, while detached editable layers can be cut', () => {
  setup(); store.setState({ elements: { ...store.getState().elements, a: { ...store.getState().elements.a, smartBlockData: { curriculum: { chapterId: 'chapter' } } } } });
  store.getState().cutSelection(); assert.equal(store.getState().clipboardElements.length, 0);
  assert.match(ui.getState().toasts.at(-1).message, /Detach/);
  setup(); store.setState({ elements: { ...store.getState().elements, a: { ...store.getState().elements.a, content: { curriculumChapterId: 'chapter', curriculumBlockId: 'block' } } } });
  store.getState().cutSelection(); store.getState().pasteSelection({ pageId: 'target' });
  assert.equal(store.getState().elements.a.pageId, 'target');
  assert.equal(store.getState().elements.a.content.curriculumChapterId, undefined);
  history.getState().undo(); assert.equal(store.getState().elements.a.content.curriculumChapterId, 'chapter');
});
