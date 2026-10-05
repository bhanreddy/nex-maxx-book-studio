import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { cloneElementTree } = require('../src/editor/core/elementGroups.ts');
const base = structuredClone(store.getState().getActiveBook());

function setup() {
  const element = (id, x, y, width, height) => ({ id, pageId: 'layout-page', type: 'shape', category: 'decorative',
    version: 1, displayName: id, locked: false, hidden: false, content: {}, style: {},
    transform: { x, y, width, height, rotation: 0, zIndex: 2 } });
  const a = element('a', 50, 80, 60, 40), b = element('b', 180, 160, 90, 50);
  const book = { ...base, id: 'layout-book', autoPagination: false, chapters: [], pages: [{ ...base.pages[0], id: 'layout-page', elementIds: ['a', 'b'] }] };
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: { a, b }, selectedElementIds: ['a', 'b'] });
  history.getState().clearHistory();
  store.getState().groupSelectedElements();
  return store.getState().selectedElementIds[0];
}

test('grouping preserves positions and auto layout is explicitly enabled, disabled and undoable', () => {
  const id = setup(), before = structuredClone(store.getState().elements);
  assert.equal(before[id].layoutMode, 'freeform');
  assert.equal(before[id].adaptiveGroup, undefined);
  assert.equal(before.b.transform.y, 160);
  store.getState().setGroupAutoLayout(id, { direction: 'horizontal', spacingPt: 16 });
  const after = structuredClone(store.getState().elements);
  assert.equal(after.b.transform.x, 126); assert.equal(after.b.transform.y, 80);
  assert.equal(after[id].transform.width, 166); assert.equal(after[id].transform.height, 50);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
  history.getState().redo(); assert.deepEqual(store.getState().elements, after);
  store.getState().setGroupAutoLayout(id, null);
  store.getState().updateElementTransform('a', { width: 100 }, true);
  assert.equal(store.getState().elements.b.transform.x, 126);
  assert.equal(store.getState().elements[id].layoutMode, 'freeform');
});

test('child resizing reflows siblings and group bounds in the same undo transaction', () => {
  const id = setup(); store.getState().setGroupAutoLayout(id, { direction: 'vertical', spacingPt: 10, padding: { top: 8, right: 8, bottom: 8, left: 8 } });
  const before = structuredClone(store.getState().elements);
  store.getState().updateElementTransform('a', { height: 80 }, true);
  assert.equal(store.getState().elements.b.transform.y, 178);
  assert.equal(store.getState().elements[id].transform.height, 156);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
  history.getState().redo(); assert.equal(store.getState().elements.b.transform.y, 178);
});

test('direction changes keep child order; padding, alignment and fixed sizing preserve child sizes', () => {
  const id = setup(); store.getState().setGroupAutoLayout(id, { direction: 'vertical' });
  store.getState().setGroupAutoLayout(id, { direction: 'horizontal', alignment: 'center', spacingPt: 0 });
  assert.equal(store.getState().elements.a.transform.y, 85);
  assert.equal(store.getState().elements.b.transform.x, 110);
  const size = store.getState().elements.a.transform;
  store.getState().setGroupAutoLayout(id, { widthMode: 'fixed', heightMode: 'fixed' });
  store.getState().updateElementTransform(id, { width: 300, height: 100 }, true);
  assert.equal(store.getState().elements.a.transform.width, size.width);
  assert.equal(store.getState().elements.a.transform.height, size.height);
  assert.equal(store.getState().elements.a.transform.y, 110);
  assert.equal(store.getState().elements[id].transform.width, 300);
});

test('nested groups move leaves once, reflow outer siblings and undo all affected objects', () => {
  const inner = setup(); store.getState().setGroupAutoLayout(inner, { direction: 'horizontal', spacingPt: 10 });
  const c = { ...store.getState().elements.a, id: 'c', groupId: undefined, transform: { x: 50, y: 250, width: 100, height: 30, rotation: 0, zIndex: 4 } };
  store.getState().insertPublicationElement(c); store.setState({ selectedElementIds: [inner, 'c'] }); store.getState().groupSelectedElements();
  const outer = store.getState().selectedElementIds[0]; store.getState().setGroupAutoLayout(outer, { direction: 'vertical', spacingPt: 20 });
  const before = structuredClone(store.getState().elements);
  store.getState().updateElementTransform('a', { height: 90 }, true);
  assert.equal(store.getState().elements[inner].transform.height, 90);
  assert.equal(store.getState().elements.c.transform.y, 190);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
  store.getState().updateElementTransform(outer, { x: 100, y: 100 }, true);
  assert.equal(store.getState().elements.a.transform.x, 100);
  assert.equal(store.getState().elements.b.transform.x, 170);
  assert.equal(store.getState().elements.c.transform.y, 170);
});

test('hidden children leave no gap; locked groups and descendants stay fixed', () => {
  const id = setup(); store.getState().setGroupAutoLayout(id, { direction: 'horizontal' });
  store.getState().updateElement('a', { hidden: true });
  assert.equal(store.getState().elements.b.transform.x, 50);
  assert.equal(store.getState().elements[id].transform.width, 90);
  store.getState().updateElement('a', { hidden: false, locked: true });
  const before = structuredClone(store.getState().elements);
  store.getState().setGroupAutoLayout(id, { spacingPt: 50 });
  assert.deepEqual(store.getState().elements, before);
  store.getState().updateElement(id, { locked: true });
  const locked = structuredClone(store.getState().elements);
  store.getState().updateElementTransform('b', { width: 180 }, true);
  assert.deepEqual(store.getState().elements, locked);
});

test('auto layout survives serialization, duplication and ungrouping without stale identities', () => {
  const id = setup(); store.getState().setGroupAutoLayout(id, { direction: 'vertical', spacingPt: 22 });
  const items = JSON.parse(JSON.stringify(Object.values(store.getState().elements)));
  const copy = cloneElementTree(items, 'other-page', { dx: 20, dy: 30 });
  assert.equal(copy.elements[copy.roots[0]].adaptiveGroup.spacingPt, 22);
  assert.ok(copy.elements[copy.roots[0]].childElementIds.every(child => copy.elements[child].groupId === copy.roots[0]));
  const before = structuredClone(store.getState().elements);
  store.getState().ungroupSelectedElements();
  assert.deepEqual(store.getState().elements.a.transform, before.a.transform);
  assert.equal(store.getState().elements.a.groupId, undefined);
  history.getState().undo(); assert.deepEqual(store.getState().elements, before);
});
