import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { embedFooterFixture } from './helpers/printFixtures.mjs';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file);
const { calculateResize } = require('../src/editor/core/geometry.ts');
const { withBlockTransform } = require('../src/editor/core/blockResize.ts');
const { transformGroupChildren } = require('../src/editor/core/elementGroups.ts');
const { createSmartBlockInstance } = require('../src/editor/educational/blockRegistry.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { renderPublicationPdf } = require('../src/editor/educational/publicationPdf.ts');
const { publicationPreflight } = require('../src/editor/educational/publicationPreflight.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { composePage } = require('../src/editor/core/pageComposition.ts');
const { makeCurriculumBlock, DEFAULT_CHAPTER_CONFIG } = require('../src/editor/curriculum/chapterEngine.ts');
const { jsPDF } = require('jspdf');

test('every corner scales from horizontal-only and vertical-only drags and anchors the opposite corner', () => {
  const initial = { x: 40, y: 60, width: 400, height: 200 };
  for (const handle of ['nw', 'ne', 'sw', 'se']) {
    const west = handle.includes('w'), north = handle.includes('n');
    for (const [dx, dy] of [[west ? 100 : -100, 0], [0, north ? 50 : -50]]) {
      const next = calculateResize(initial, handle, dx, dy, true);
      assert.equal(next.width, 300, handle); assert.equal(next.height, 150, handle);
      assert.equal(west ? next.x + next.width : next.x, west ? 440 : 40, handle);
      assert.equal(north ? next.y + next.height : next.y, north ? 260 : 60, handle);
    }
    const min = calculateResize(initial, handle, west ? 999 : -999, 0, true, 60, 40);
    assert.equal(min.width, 80); assert.equal(min.height, 40);
  }
});

test('vertical edges remove blank height without shrinking text or images and stop at the content limit', () => {
  const { element } = fixture();
  const block = makeCurriculumBlock('chapter-hero', DEFAULT_CHAPTER_CONFIG);
  block.styleOverrides.contentLayout = { enabled: true, items: {} };
  const naturalHeight = buildPublicationScene({ ...block, transform: { ...block.transform, height: 0 } }).height;
  element.transform = { ...block.transform, x: 40, y: 60, height: naturalHeight + 300 };
  element.smartBlockData = { ...block, transform: element.transform };
  const before = buildPublicationScene(element.smartBlockData);
  const trimmed = withBlockTransform(element, { ...element.transform, height: naturalHeight + 100 });
  assert.equal(trimmed.transform.height, naturalHeight + 100);
  assert.equal(trimmed.transform.height / trimmed.smartBlockData.styleOverrides.resizeFrame.height, 1);
  assert.deepEqual(buildPublicationScene(trimmed.smartBlockData).nodes.filter(n => n.kind === 'text' || n.kind === 'image'), before.nodes.filter(n => n.kind === 'text' || n.kind === 'image'));
  const limited = withBlockTransform(trimmed, { ...trimmed.transform, height: 30 });
  assert.ok(limited.transform.height >= naturalHeight);
  assert.equal(limited.transform.height / limited.smartBlockData.styleOverrides.resizeFrame.height, 1);
  const top = withBlockTransform(trimmed, { ...trimmed.transform, y: trimmed.transform.y + trimmed.transform.height - 30, height: 30 });
  assert.equal(top.transform.y + top.transform.height, trimmed.transform.y + trimmed.transform.height);
});

test('height trimming after corner scaling retains the scaled reading size and moved content', () => {
  const { element } = fixture();
  element.transform.height += 300;
  element.smartBlockData.transform = element.transform;
  const node = buildPublicationScene(element.smartBlockData).nodes.find(n => n.kind === 'text');
  element.smartBlockData.styleOverrides.contentLayout = { enabled: true, items: { [node.contentId]: { base: node.text, dx: 5, dy: 180 } } };
  const half = withBlockTransform(element, { ...element.transform, width: element.transform.width / 2, height: element.transform.height / 2 });
  const trimmed = withBlockTransform(half, { ...half.transform, height: 30 });
  const frame = trimmed.smartBlockData.styleOverrides.resizeFrame;
  assert.equal(trimmed.transform.width / frame.width, .5);
  assert.equal(trimmed.transform.height / frame.height, .5);
  const moved = buildPublicationScene(trimmed.smartBlockData).nodes.find(n => n.contentId === node.contentId);
  assert.equal(moved.size, node.size); assert.equal(moved.y, node.y + 180);
  assert.ok((moved.y + moved.size * .35) * .5 <= trimmed.transform.height);
});

function fixture() {
  const book = structuredClone(store.getState().getActiveBook());
  const page = book.pages[0];
  const block = createSmartBlockInstance('studio-quick-check-1', page.id);
  block.transform.height = buildPublicationScene({ ...block, transform: { ...block.transform, height: 0 } }).height;
  const element = { id: block.id, pageId: page.id, displayName: 'Resize fixture', type: 'smart-block', category: 'smart', version: 1, locked: false, hidden: false,
    transform: { ...block.transform, x: 40, y: 60 }, style: {}, content: {}, smartBlockData: block };
  block.transform = element.transform;
  book.pages = [{ ...page, elementIds: [element.id] }]; book.pageFrame = null; book.pageFramePolicy = 'custom';
  return { book, element };
}

test('text, images, decorations, and authored offsets retain one common coordinate system during repeated resizing', () => {
  const { element } = fixture();
  element.smartBlockData = makeCurriculumBlock('chapter-hero', DEFAULT_CHAPTER_CONFIG);
  element.smartBlockData.styleOverrides.contentLayout = { enabled: true, items: {} };
  element.transform = { ...element.smartBlockData.transform, height: buildPublicationScene(element.smartBlockData).height };
  element.smartBlockData.transform = element.transform;
  const base = buildPublicationScene(element.smartBlockData), text = base.nodes.find(n => n.kind === 'text');
  element.smartBlockData.styleOverrides.contentLayout = { enabled: true, items: { [text.contentId]: { base: text.text, dx: 24, dy: 12 } } };
  const before = buildPublicationScene(element.smartBlockData);
  const half = withBlockTransform(element, { ...element.transform, width: element.transform.width / 2, height: element.transform.height / 2 });
  const smaller = withBlockTransform(half, { ...half.transform, width: half.transform.width / 2, height: half.transform.height / 2 });
  assert.deepEqual(buildPublicationScene(half.smartBlockData), before);
  assert.deepEqual(buildPublicationScene(JSON.parse(JSON.stringify(smaller.smartBlockData))), before);
  const frame = smaller.smartBlockData.styleOverrides.resizeFrame;
  const sx = smaller.transform.width / frame.width, sy = smaller.transform.height / frame.height;
  assert.equal(sx, .25); assert.equal(sy, .25);
  const image = before.nodes.find(n => n.kind === 'image'); assert.ok(image);
  assert.equal(image.w * sx, image.w / 4);
  assert.equal(before.nodes.find(n => n.contentId === text.contentId).size * sy, text.size / 4);
});

test('print, preflight, and selectable PDF text use the resized frame rather than rejecting the original design height', async () => {
  const { book, element } = fixture();
  const resized = withBlockTransform(element, { ...element.transform, width: element.transform.width / 2, height: element.transform.height / 4 });
  const elements = { [resized.id]: resized };
  const pages = embedFooterFixture(collectPrintPages(book, elements));
  assert.equal(publicationPreflight(book, elements).filter(issue => issue.severity === 'error').length, 0);
  const html = buildPrintHtml(book, pages, '');
  assert.ok(html.includes(`viewBox="0 0 ${element.transform.width} ${element.transform.height}" preserveAspectRatio="none"`));
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  await renderPublicationPdf(doc, pages[0].elements[0].scene, resized);
  assert.match(doc.output(), /0\.5 0\. 0\. 0\.25 0\. 0\. cm/);
  assert.match(doc.output(), /Checkpoint/);
});

test('group resizing scales smart block contents and page arrangement retains the chosen dimensions', () => {
  const { book, element } = fixture();
  const group = { id: 'group', transform: { ...element.transform }, childElementIds: [element.id] };
  const result = transformGroupChildren(group, { ...group.transform, width: group.transform.width / 2, height: group.transform.height / 2 }, { [element.id]: element });
  const child = result[element.id];
  assert.deepEqual(buildPublicationScene(child.smartBlockData), buildPublicationScene(element.smartBlockData));
  const arranged = composePage([child], book.dimensions, book.margins, 'compact');
  assert.equal(arranged.transforms[child.id].width, child.transform.width);
  assert.equal(arranged.transforms[child.id].height, child.transform.height);
});

test('changing unscaled semantic content measures naturally, while editing a resized block keeps its chosen frame', () => {
  const el = store.getState().addEducationalBlock('studio-quick-check-1', 40, 40);
  store.getState().updateSmartBlockContent(el.id, { title: 'A new heading' });
  assert.equal(store.getState().elements[el.id].smartBlockData.styleOverrides.resizeFrame, undefined);
  const before = store.getState().elements[el.id];
  store.getState().updateElementTransform(el.id, { width: before.transform.width / 2, height: before.transform.height / 2 }, true);
  const frame = store.getState().elements[el.id].transform;
  store.getState().updateSmartBlockContent(el.id, { title: 'Edited after shrinking' });
  store.getState().updateSmartBlockStyle(el.id, { paletteId: 'ocean' });
  assert.deepEqual(store.getState().elements[el.id].transform, frame);
});
