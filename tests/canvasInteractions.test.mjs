import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as icons from 'lucide-react';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file);
// The package's CommonJS entry is marked ESM; use its actual ESM exports in this Node harness.
require.cache[require.resolve('lucide-react')] = { exports: icons };
const React = require('react');
const { calculateRotatedResize, rotatePoint, getTransformHandles } = require('../src/editor/core/geometry.ts');
const { trackPointerGesture } = require('../src/editor/core/pointerGesture.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useUiStore: ui } = require('../src/editor/stores/uiStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { useLayoutPartnerStore: partner } = require('../src/editor/layoutPartner/layoutPartnerStore.ts');
const { TransformOverlay } = require('../src/features/canvas/TransformOverlay.tsx');
const { SmartQuickActionBar } = require('../src/features/canvas/SmartQuickActionBar.tsx');
const { PageCanvas } = require('../src/features/canvas/PageCanvas.tsx');

function pointer(type, x, y, extras = {}) {
  return Object.assign(new Event(type), { pointerId: 1, clientX: x, clientY: y, button: 0, altKey: false, shiftKey: false, ...extras });
}
function eventLoop() {
  const target = new EventTarget(), frames = new Map(); let id = 0;
  target.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
  target.cancelAnimationFrame = id => frames.delete(id);
  target.tick = () => { const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn()); };
  target.pending = () => frames.size;
  return target;
}
function render(Component, props) {
  // Invoke component handlers in Node. No DOM, browser, or preview is involved.
  const hooks = { useState: value => [typeof value === 'function' ? value() : value, () => {}], useRef: value => ({ current: value }),
    useEffect: () => {}, useDebugValue: () => {}, useCallback: fn => fn, useMemo: fn => fn(), useSyncExternalStore: (_, snapshot) => snapshot() };
  const original = Object.fromEntries(Object.keys(hooks).map(key => [key, React[key]]));
  Object.assign(React, hooks);
  try { return Component(props); } finally { Object.assign(React, original); }
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function setup(zoom = 1, extras = {}) {
  const book = structuredClone(store.getState().getActiveBook()), page = book.pages[0];
  const element = (id, x, y, width = 80, height = 40) => ({ id, pageId: page.id, type: 'shape', category: 'decorative', version: 1, displayName: id,
    transform: { x, y, width, height, rotation: 0, zIndex: 10000 }, style: {}, content: {}, locked: false, hidden: false });
  const a = { ...element('a', 40, 80), ...extras }, b = element('b', 200, 160);
  book.pages[0].elementIds = ['a', 'b'];
  store.setState({ saveToStorage: () => {}, books: [book], activeBookId: book.id, activePageIndex: 0, elements: { a, b }, selectedElementIds: ['a'] });
  history.getState().clearHistory(); ui.setState({ zoom, snapEnabled: false, activeTool: 'move', cropElementId: null, editingTextElementId: null, quickActionBarVisible: true });
  partner.setState({ partnerMode: 'manual', hoveredDropZone: null });
  const loop = eventLoop(); globalThis.window = loop; globalThis.document = { getElementById: () => ({ getBoundingClientRect: () => ({ left: 0, top: 0 }) }) };
  return { a, b, book, loop, props: { selectedElements: [a], allPageElements: [a, b], pageDimensions: book.dimensions, margins: book.margins, bleed: book.bleed, zoom } };
}
function start(node, x = 0, y = 0, extras = {}) {
  const nativeEvent = pointer('pointerdown', x, y, extras);
  node.props.onPointerDown({ nativeEvent, clientX: x, clientY: y, button: 0, altKey: false, stopPropagation() {}, preventDefault() {}, ...extras });
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

test('rotated resize keeps the opposite handle stationary for all eight handles at multiple angles', () => {
  const initial = { x: 40, y: 60, width: 200, height: 100 };
  const opposite = { nw: 'se', n: 's', ne: 'sw', e: 'w', se: 'nw', s: 'n', sw: 'ne', w: 'e' };
  for (const angle of [0, 30, 90, 225]) for (const handle of Object.keys(opposite)) for (const locked of [false, true]) {
    const delta = rotatePoint(30, 20, 0, 0, angle);
    const next = calculateRotatedResize(initial, angle, handle, delta.x, delta.y, locked);
    const anchor = rect => getTransformHandles(rect, angle).find(h => h.type === opposite[handle]);
    close(anchor(next).x, anchor(initial).x); close(anchor(next).y, anchor(initial).y);
    if (locked) close(next.width / next.height, 2);
  }
});

test('pointer gestures ignore other pointers, coalesce frames and flush the actual release position once', () => {
  const loop = eventLoop(), applied = []; let commits = 0;
  const stop = trackPointerGesture(pointer('pointerdown', 0, 0), e => applied.push(e.clientX), () => commits++, loop);
  loop.dispatchEvent(pointer('pointermove', 100, 0, { pointerId: 2 }));
  loop.dispatchEvent(pointer('pointerup', 100, 0, { pointerId: 2 }));
  assert.equal(commits, 0);
  loop.dispatchEvent(pointer('pointermove', 10, 0)); loop.dispatchEvent(pointer('pointermove', 20, 0));
  assert.equal(loop.pending(), 1); loop.tick(); assert.deepEqual(applied, [20]);
  loop.dispatchEvent(pointer('pointermove', 30, 0)); loop.dispatchEvent(pointer('pointerup', 40, 0)); stop();
  assert.deepEqual(applied, [20, 40]); assert.equal(commits, 1); assert.equal(loop.pending(), 0);
  loop.dispatchEvent(pointer('pointermove', 60, 0)); assert.equal(loop.pending(), 0);
});

test('click jitter does not move content; cancellation and window blur release pending gestures', () => {
  for (const ending of ['pointerup', 'pointercancel', 'blur']) {
    const loop = eventLoop(), applied = []; let commits = 0;
    trackPointerGesture(pointer('pointerdown', 0, 0), e => applied.push(e.clientX), () => commits++, loop);
    loop.dispatchEvent(pointer('pointermove', 1, 1)); loop.dispatchEvent(pointer(ending, 1, 1));
    assert.deepEqual(applied, []); assert.equal(commits, 1);
    loop.dispatchEvent(pointer('pointermove', 100, 0)); assert.equal(loop.pending(), 0);
  }
});

test('move handlers use zoom-correct deltas, commit one undo, and retain the final pointerup coordinates', () => {
  for (const zoom of [.25, 1, 2]) {
    const { a, loop, props } = setup(zoom);
    const box = nodes(render(TransformOverlay, props)).find(node => node.props?.['data-canvas-controls']);
    start(box); loop.dispatchEvent(pointer('pointerup', 40 * zoom, 20 * zoom));
    assert.equal(store.getState().elements.a.transform.x, a.transform.x + 30);
    assert.equal(store.getState().elements.a.transform.y, a.transform.y + 15);
    assert.equal(history.getState().past.length, 1); history.getState().undo();
    assert.deepEqual(store.getState().elements.a.transform, a.transform);
    history.getState().redo(); assert.equal(store.getState().elements.a.transform.x, a.transform.x + 30);
  }
});

test('Alt-drag moves the duplicate and leaves the original untouched', () => {
  const { a, loop, props } = setup();
  const box = nodes(render(TransformOverlay, props)).find(node => node.props?.['data-canvas-controls']);
  start(box, 0, 0, { altKey: true });
  const copyId = store.getState().selectedElementIds[0]; assert.notEqual(copyId, a.id);
  loop.dispatchEvent(pointer('pointerup', 40, 20, { altKey: true }));
  assert.deepEqual(store.getState().elements.a, a);
  assert.equal(store.getState().elements[copyId].transform.x, a.transform.x + 30);
  history.getState().undo(); assert.equal(store.getState().elements[copyId].transform.x, a.transform.x);
  history.getState().undo(); assert.equal(store.getState().elements[copyId], undefined);
});

test('multi-selection corners and edges scale every member with one undo', () => {
  for (const handle of ['se', 'e', 's']) {
    const { a, b, loop, props } = setup();
    store.setState({ selectedElementIds: ['a', 'b'] });
    const tree = render(TransformOverlay, { ...props, selectedElements: [a, b] });
    const grip = nodes(tree).find(node => node.props?.['aria-label'] === `Resize from ${handle}`);
    start(grip); loop.dispatchEvent(pointer('pointerup', 320, 160));
    const current = store.getState().elements;
    assert.equal(current.a.transform.width, 160); assert.equal(current.b.transform.width, 160);
    assert.equal(current.b.transform.x - current.a.transform.x, 320);
    assert.equal(history.getState().past.length, 1); history.getState().undo();
    assert.deepEqual(store.getState().elements.a, a); assert.deepEqual(store.getState().elements.b, b);
  }
});

test('locked selections remain fixed and handles retain screen-sized targets when zoomed out', () => {
  const { a, b, loop, props } = setup(.25);
  const locked = { ...b, locked: true }; store.setState({ elements: { a, b: locked }, selectedElementIds: ['a', 'b'] });
  const tree = render(TransformOverlay, { ...props, selectedElements: [a, locked] });
  const grip = nodes(tree).find(node => node.props?.['aria-label'] === 'Resize from se');
  assert.equal(grip.props.style.width * .25, 28);
  start(grip); loop.dispatchEvent(pointer('pointerup', 10, 5));
  assert.deepEqual(store.getState().elements.b, locked); assert.notEqual(store.getState().elements.a.transform.width, a.transform.width);
});

test('page artwork is isolated below controls and spread controls share their own page coordinates', () => {
  const { book } = setup(); ui.setState({ viewMode: 'spread' });
  const page = book.pages.find(p => p.pageIndex > 0 && p.pageIndex % 2 === 1 && p.displayNumber !== 'Cover');
  assert.ok(page); store.setState({ activePageIndex: book.pages.indexOf(page) });
  const tree = nodes(render(PageCanvas, { book, activePage: page }));
  const artboards = tree.filter(node => node.props?.id?.startsWith('page-artboard'));
  const controls = tree.filter(node => node.props?.id?.startsWith('page-controls-'));
  assert.equal(artboards.length, 2); assert.equal(controls.length, 2);
  for (const node of artboards) { assert.match(node.props.className, /isolate/); assert.match(node.props.className, /z-0/); }
  assert.equal(controls[0].props.style.left, 0);
  assert.equal(controls[1].props.style.left, `calc(${book.dimensions.widthPt}pt + 1rem)`);
  assert.ok(controls.every(node => node.props.className.includes('z-10')));
});

test('quick action buttons consume pointer and mouse starts without preventing the button action', () => {
  const { a } = setup(); const bar = render(SmartQuickActionBar, { selectedElements: [a], zoom: .5 });
  let stopped = 0;
  bar.props.onPointerDown({ stopPropagation: () => stopped++ }); bar.props.onMouseDown({ stopPropagation: () => stopped++ });
  assert.equal(stopped, 2); assert.equal(bar.props.style.transform, 'translateX(-50%) scale(2)');
});

test('an interrupted active gesture flushes pending movement and cannot continue afterwards', () => {
  for (const ending of ['pointercancel', 'blur']) {
    const loop = eventLoop(), applied = []; let commits = 0;
    trackPointerGesture(pointer('pointerdown', 0, 0), e => applied.push(e.clientX), () => commits++, loop);
    loop.dispatchEvent(pointer('pointermove', 40, 0)); loop.dispatchEvent(pointer(ending, 0, 0));
    assert.deepEqual(applied, [40]); assert.equal(commits, 1); assert.equal(loop.pending(), 0);
    loop.dispatchEvent(pointer('pointermove', 80, 0)); loop.dispatchEvent(pointer('pointerup', 100, 0));
    assert.equal(commits, 1); assert.deepEqual(applied, [40]);
  }
});

test('artwork inside a scaled, rotated block follows the pointer in its own coordinates', () => {
  const { MotifOverlay } = require('../src/features/canvas/MotifOverlay.tsx');
  const { makeCurriculumBlock, DEFAULT_CHAPTER_CONFIG } = require('../src/editor/curriculum/chapterEngine.ts');
  const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
  const { a, loop } = setup();
  delete globalThis.document; // Use the renderer's Node text-measurement fallback.
  const block = makeCurriculumBlock('chapter-hero', DEFAULT_CHAPTER_CONFIG);
  const scene = buildPublicationScene(block);
  block.styleOverrides.resizeFrame = { width: scene.width, height: scene.height };
  const element = { ...a, type: 'smart-block', smartBlockData: block,
    transform: { ...a.transform, width: scene.width / 2, height: scene.height / 2, rotation: 90 } };
  block.transform = element.transform;
  store.setState({ elements: { a: element } });
  const tree = render(MotifOverlay, { element, zoom: 1 });
  const artwork = nodes(tree).find(node => node.props?.['aria-label']?.startsWith('Drag '));
  assert.ok(artwork);
  start(artwork); loop.dispatchEvent(pointer('pointerup', 0, 40));
  const motif = store.getState().elements.a.smartBlockData.styleOverrides.motifs.at(-1);
  close(motif.x, parseFloat(artwork.props.style.left) + 60);
  close(motif.y, parseFloat(artwork.props.style.top));
  assert.equal(history.getState().past.length, 1);
});

test('rotation preserves the initial grab offset instead of jumping to the pointer angle', () => {
  const { a, loop, props } = setup();
  const rotated = { ...a, transform: { ...a.transform, rotation: 30 } };
  store.setState({ elements: { a: rotated } });
  const grip = nodes(render(TransformOverlay, { ...props, selectedElements: [rotated] }))
    .find(node => node.props?.['aria-label'] === 'Rotate selected block');
  const cx = (a.transform.x + a.transform.width / 2) / .75;
  const cy = (a.transform.y + a.transform.height / 2) / .75;
  start(grip, cx + 20, cy - 40);
  loop.dispatchEvent(pointer('pointerup', cx + 40, cy - 80));
  assert.equal(store.getState().elements.a.transform.rotation, 30);
});
