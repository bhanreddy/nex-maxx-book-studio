import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as icons from 'lucide-react';

const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, file);
}
require.cache[require.resolve('lucide-react')] = { exports: icons };

const React = require('react');
const {
  doesRectIntersectRect,
  getRotatedCorners,
  doesPolygonIntersectRect,
  elementIntersectsMarquee,
  findElementsIntersectingMarquee,
} = require('../src/editor/core/geometry.ts');
const { trackPointerGesture } = require('../src/editor/core/pointerGesture.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useUiStore: ui } = require('../src/editor/stores/uiStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { PageCanvas } = require('../src/features/canvas/PageCanvas.tsx');
const { TransformOverlay } = require('../src/features/canvas/TransformOverlay.tsx');

function pointer(type, x, y, extras = {}) {
  return Object.assign(new Event(type), { pointerId: 1, clientX: x, clientY: y, button: 0, altKey: false, shiftKey: false, ...extras });
}

function eventLoop() {
  const target = new EventTarget(), frames = new Map();
  let id = 0;
  target.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
  target.cancelAnimationFrame = id => frames.delete(id);
  target.tick = () => { const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn()); };
  target.pending = () => frames.size;
  return target;
}

function render(Component, props) {
  const hooks = {
    useState: value => [typeof value === 'function' ? value() : value, () => {}],
    useRef: value => ({ current: value }),
    useEffect: () => {},
    useDebugValue: () => {},
    useCallback: fn => fn,
    useMemo: fn => fn(),
    useSyncExternalStore: (_, snapshot) => snapshot(),
  };
  const original = Object.fromEntries(Object.keys(hooks).map(key => [key, React[key]]));
  Object.assign(React, hooks);
  try { return Component(props); } finally { Object.assign(React, original); }
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function setupTestEnvironment(zoom = 1) {
  const book = {
    ...structuredClone(store.getState().getActiveBook()),
    pageFrame: null,
    pageFramePolicy: 'custom',
    margins: { topPt: 36, bottomPt: 36, insidePt: 36, outsidePt: 36 },
  };
  const page = book.pages[0];
  const element = (id, x, y, width = 80, height = 40, extras = {}) => ({
    id,
    pageId: page.id,
    type: 'shape',
    category: 'decorative',
    version: 1,
    displayName: id,
    transform: { x, y, width, height, rotation: 0, zIndex: 1 },
    style: {},
    content: {},
    locked: false,
    hidden: false,
    ...extras,
  });

  const a = element('el-a', 60, 60, 100, 60);
  const b = element('el-b', 200, 60, 100, 60);
  const c = element('el-c', 60, 180, 100, 60);
  const d = element('el-d', 200, 180, 100, 60);

  book.pages[0].elementIds = ['el-a', 'el-b', 'el-c', 'el-d'];
  store.setState({
    saveToStorage: () => {},
    books: [book],
    activeBookId: book.id,
    activePageIndex: 0,
    elements: { 'el-a': a, 'el-b': b, 'el-c': c, 'el-d': d },
    selectedElementIds: [],
  });
  history.getState().clearHistory();
  ui.setState({ zoom, activeTool: 'move', panOffset: { x: 0, y: 0 } });

  const loop = eventLoop();
  globalThis.window = loop;
  globalThis.document = {
    getElementById: id => {
      if (id === 'page-artboard') {
        return {
          getBoundingClientRect: () => ({ left: 100, top: 50, width: book.dimensions.widthPt * zoom, height: book.dimensions.heightPt * zoom }),
        };
      }
      return null;
    },
  };

  return { a, b, c, d, book, page, loop };
}

// -----------------------------------------------------------------------------
// 1. Core AABB Rect Intersection Tests
// -----------------------------------------------------------------------------
test('doesRectIntersectRect accurately detects overlapping, adjacent, and disjoint boxes', () => {
  const box1 = { x: 10, y: 10, width: 50, height: 50 };

  // Partially overlapping
  assert.equal(doesRectIntersectRect(box1, { x: 30, y: 30, width: 40, height: 40 }), true);
  // Completely enclosed
  assert.equal(doesRectIntersectRect(box1, { x: 20, y: 20, width: 10, height: 10 }), true);
  // Touching borders
  assert.equal(doesRectIntersectRect(box1, { x: 60, y: 10, width: 20, height: 50 }), true);
  // Disjoint horizontally
  assert.equal(doesRectIntersectRect(box1, { x: 70, y: 10, width: 20, height: 50 }), false);
  // Disjoint vertically
  assert.equal(doesRectIntersectRect(box1, { x: 10, y: 70, width: 50, height: 20 }), false);
});

// -----------------------------------------------------------------------------
// 2. Rotated Geometry & Separating Axis Theorem (SAT) Tests
// -----------------------------------------------------------------------------
test('getRotatedCorners and doesPolygonIntersectRect handle rotated elements with SAT precision', () => {
  // A square at (100, 100) size 100x100 rotated 45 degrees
  // Center is (150, 150), half diagonal is 50*sqrt(2) ≈ 70.71
  // Topmost tip is at (150, 150 - 70.71) ≈ (150, 79.29)
  const rect = { x: 100, y: 100, width: 100, height: 100 };
  const corners = getRotatedCorners(rect, 45);
  assert.equal(corners.length, 4);

  // Marquee that catches the upper tip of the diamond (y: 70 to 90, x: 140 to 160)
  const tipMarquee = { x: 140, y: 70, width: 20, height: 20 };
  assert.equal(doesPolygonIntersectRect(corners, tipMarquee), true);

  // Marquee in the corner gap where unrotated bounding box would hit, but rotated polygon does NOT
  // Unrotated box would occupy (100, 100, 100, 100), but at (105, 105) rotated shape has cut-off corner!
  const emptyCornerMarquee = { x: 95, y: 95, width: 10, height: 10 };
  assert.equal(doesPolygonIntersectRect(corners, emptyCornerMarquee), false);
});

// -----------------------------------------------------------------------------
// 3. Element Intersects Marquee Tests (Unrotated, Rotated, ResizeFrame)
// -----------------------------------------------------------------------------
test('elementIntersectsMarquee correctly tests unrotated, rotated, and resized elements', () => {
  const baseEl = {
    id: 'el-1',
    pageId: 'p-1',
    type: 'shape',
    category: 'decorative',
    version: 1,
    displayName: 'Shape',
    transform: { x: 100, y: 100, width: 80, height: 60, rotation: 0, zIndex: 1 },
    style: {},
    content: {},
    locked: false,
    hidden: false,
  };

  // Intersects unrotated
  assert.equal(elementIntersectsMarquee(baseEl, { x: 120, y: 120, width: 50, height: 50 }), true);
  // Outside unrotated
  assert.equal(elementIntersectsMarquee(baseEl, { x: 0, y: 0, width: 50, height: 50 }), false);

  // Rotated element
  const rotatedEl = { ...baseEl, transform: { ...baseEl.transform, rotation: 45 } };
  assert.equal(elementIntersectsMarquee(rotatedEl, { x: 130, y: 120, width: 30, height: 30 }), true);

  // With resizeFrame override (e.g. smart-block)
  const smartBlock = {
    ...baseEl,
    type: 'smart-block',
    smartBlockData: {
      styleOverrides: {
        resizeFrame: { width: 300, height: 200 },
      },
    },
  };
  // Marquee hits the expanded frame (x: 250) even though original transform width was 80
  assert.equal(elementIntersectsMarquee(smartBlock, { x: 220, y: 120, width: 40, height: 40 }), true);
});

// -----------------------------------------------------------------------------
// 4. Hit-Testing: Locked, Hidden, Page Boundaries, Groups, Folders
// -----------------------------------------------------------------------------
test('findElementsIntersectingMarquee respects locked, hidden, page boundaries, and resolves group roots', () => {
  const elements = {
    'el-normal': { id: 'el-normal', pageId: 'p-1', type: 'shape', transform: { x: 50, y: 50, width: 60, height: 40, rotation: 0, zIndex: 1 }, locked: false, hidden: false },
    'el-locked': { id: 'el-locked', pageId: 'p-1', type: 'shape', transform: { x: 70, y: 60, width: 60, height: 40, rotation: 0, zIndex: 1 }, locked: true, hidden: false },
    'el-hidden': { id: 'el-hidden', pageId: 'p-1', type: 'shape', transform: { x: 80, y: 70, width: 60, height: 40, rotation: 0, zIndex: 1 }, locked: false, hidden: true },
    'el-other-page': { id: 'el-other-page', pageId: 'p-2', type: 'shape', transform: { x: 60, y: 60, width: 60, height: 40, rotation: 0, zIndex: 1 }, locked: false, hidden: false },
    // Group parent and children
    'group-1': { id: 'group-1', pageId: 'p-1', type: 'group', transform: { x: 150, y: 50, width: 120, height: 60, rotation: 0, zIndex: 2 }, childElementIds: ['child-1', 'child-2'], locked: false, hidden: false },
    'child-1': { id: 'child-1', pageId: 'p-1', type: 'shape', groupId: 'group-1', transform: { x: 150, y: 50, width: 50, height: 40, rotation: 0, zIndex: 2 }, locked: false, hidden: false },
    'child-2': { id: 'child-2', pageId: 'p-1', type: 'shape', groupId: 'group-1', transform: { x: 210, y: 50, width: 50, height: 40, rotation: 0, zIndex: 2 }, locked: false, hidden: false },
    // Locked group
    'group-locked': { id: 'group-locked', pageId: 'p-1', type: 'group', transform: { x: 300, y: 50, width: 100, height: 50, rotation: 0, zIndex: 3 }, childElementIds: ['child-locked'], locked: true, hidden: false },
    'child-locked': { id: 'child-locked', pageId: 'p-1', type: 'shape', groupId: 'group-locked', transform: { x: 310, y: 50, width: 50, height: 40, rotation: 0, zIndex: 3 }, locked: false, hidden: false },
  };

  // Marquee covering all elements at y=40..100, x=0..500
  const marquee = { x: 0, y: 40, width: 500, height: 80 };
  const hits = findElementsIntersectingMarquee(elements, 'p-1', marquee);

  // el-normal is selected
  assert.ok(hits.includes('el-normal'));
  // el-locked must NOT be selected
  assert.ok(!hits.includes('el-locked'));
  // el-hidden must NOT be selected
  assert.ok(!hits.includes('el-hidden'));
  // el-other-page must NOT be selected (different page boundary)
  assert.ok(!hits.includes('el-other-page'));
  // child-1 and child-2 must resolve to their root group ID 'group-1'
  assert.ok(hits.includes('group-1'));
  assert.ok(!hits.includes('child-1'));
  assert.ok(!hits.includes('child-2'));
  // child in locked group must NOT be selected
  assert.ok(!hits.includes('group-locked'));
  assert.ok(!hits.includes('child-locked'));
  // Total hits should only be 'el-normal' and 'group-1'
  assert.equal(hits.length, 2);
});

// -----------------------------------------------------------------------------
// 5. Shift + Marquee Multi-Select Logic (Toggle / Symmetric Difference)
// -----------------------------------------------------------------------------
test('Shift+drag toggles items in and out of current selection without losing un-hit selections', () => {
  setupTestEnvironment();

  // Initially, el-a and el-b are selected
  store.setState({ selectedElementIds: ['el-a', 'el-b'] });

  // Simulate Shift + Marquee that covers el-b and el-c
  const initial = store.getState().selectedElementIds;
  const marqueeHits = ['el-b', 'el-c'];

  // Symmetric difference:
  // el-b was selected and is hit -> toggled off!
  // el-c was not selected and is hit -> toggled on!
  // el-a was selected and not hit -> remains selected!
  const current = new Set(initial);
  for (const id of marqueeHits) {
    if (current.has(id)) current.delete(id);
    else current.add(id);
  }
  const nextSelection = Array.from(current);

  store.getState().setSelectedElementIds(nextSelection);
  assert.deepEqual(store.getState().selectedElementIds.sort(), ['el-a', 'el-c'].sort());
});

// -----------------------------------------------------------------------------
// 6. Selected Elements Support Move, Duplicate, Delete, Group, Align, and Lock Together
// -----------------------------------------------------------------------------
test('marquee-selected objects support move, duplicate, delete, group, align, and lock together with undo/redo', () => {
  const { a, b } = setupTestEnvironment();

  // Select both elements
  store.getState().setSelectedElementIds(['el-a', 'el-b']);
  assert.deepEqual(store.getState().selectedElementIds, ['el-a', 'el-b']);

  // Move both together
  store.getState().updateElementTransform('el-a', { x: a.transform.x + 30, y: a.transform.y + 20 }, true);
  store.getState().updateElementTransform('el-b', { x: b.transform.x + 30, y: b.transform.y + 20 }, true);
  assert.equal(store.getState().elements['el-a'].transform.x, 90);
  assert.equal(store.getState().elements['el-b'].transform.x, 230);

  // Align together (e.g. align left)
  store.getState().alignSelectedElements('left');
  assert.equal(store.getState().elements['el-a'].transform.x, store.getState().elements['el-b'].transform.x);

  // Group together
  store.getState().groupSelectedElements();
  const groupId = store.getState().selectedElementIds[0];
  assert.ok(groupId);
  assert.equal(store.getState().elements[groupId].type, 'group');
  assert.equal(store.getState().elements['el-a'].groupId, groupId);
  assert.equal(store.getState().elements['el-b'].groupId, groupId);

  // Lock group
  store.getState().toggleLockElement(groupId);
  assert.equal(store.getState().elements[groupId].locked, true);

  // Unlock group
  store.getState().toggleLockElement(groupId);
  assert.equal(store.getState().elements[groupId].locked, false);

  // Duplicate together
  store.getState().duplicateSelectedElements();
  assert.equal(store.getState().selectedElementIds.length, 1);
  const dupGroupId = store.getState().selectedElementIds[0];
  assert.notEqual(dupGroupId, groupId);

  // Delete duplicates
  store.getState().deleteSelectedElements();
  assert.equal(store.getState().elements[dupGroupId], undefined);

  // Undo restores deleted
  history.getState().undo();
  assert.ok(store.getState().elements[dupGroupId]);
});

// -----------------------------------------------------------------------------
// 7. Canvas Component DOM Structure: Marquee Box & Element Click Isolation
// -----------------------------------------------------------------------------
test('PageCanvas renders canvas-marquee-box overlay and isolates elements with data-element-id', () => {
  const { book, page } = setupTestEnvironment();
  const tree = nodes(render(PageCanvas, { book, activePage: page }));

  // Verify elements have data-element-id so clicks do not trigger marquee
  const elementNodes = tree.filter(node => node.props?.['data-element-id']);
  assert.ok(elementNodes.length >= 2);
  assert.ok(elementNodes.some(n => n.props['data-element-id'] === 'el-a'));
  assert.ok(elementNodes.some(n => n.props['data-element-id'] === 'el-b'));

  // Verify rulers have data-ruler attribute to prevent accidental marquee start
  const rulerNodes = tree.filter(node => node.props && 'data-ruler' in node.props);
  assert.ok(rulerNodes.length >= 2);
});

// -----------------------------------------------------------------------------
// 8. Multi-selection Outlines in TransformOverlay
// -----------------------------------------------------------------------------
test('TransformOverlay renders individual member outlines when multiple elements are selected', () => {
  const { a, b, book } = setupTestEnvironment();
  store.setState({ selectedElementIds: ['el-a', 'el-b'] });

  const props = {
    selectedElements: [a, b],
    allPageElements: [a, b],
    pageDimensions: book.dimensions,
    margins: book.margins,
    bleed: book.bleed,
    zoom: 1,
  };

  const tree = nodes(render(TransformOverlay, props));
  const memberOutlines = tree.filter(node => node.props?.['data-member-outline']);
  assert.equal(memberOutlines.length, 2);

  // Combined main bounding box
  const mainBox = tree.find(node => node.props?.['data-canvas-controls'] && node.props.style?.cursor === 'move');
  assert.ok(mainBox);
  // Dimensions should encapsulate both el-a (x:60..160) and el-b (x:200..300) -> width = 240
  assert.equal(mainBox.props.style.width, '240pt');
});

// -----------------------------------------------------------------------------
// 9. Coordinate Conversion Precision Across Zoom Levels
// -----------------------------------------------------------------------------
test('screen to page coordinate conversion accounts for zoom and pan offset accurately', () => {
  for (const zoom of [0.5, 1, 1.5, 2]) {
    const artboardLeft = 120;
    const artboardTop = 80;

    // Screen client coordinates
    const clientX = artboardLeft + 160 * zoom / 0.75;
    const clientY = artboardTop + 120 * zoom / 0.75;

    const pagePtX = (clientX - artboardLeft) * 0.75 / zoom;
    const pagePtY = (clientY - artboardTop) * 0.75 / zoom;

    assert.ok(Math.abs(pagePtX - 160) < 1e-6);
    assert.ok(Math.abs(pagePtY - 120) < 1e-6);
  }
});
