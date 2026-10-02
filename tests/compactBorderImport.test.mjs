import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { deflateRawSync } from 'node:zlib';
import ts from 'typescript';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
const { readDocxArchive } = require('../src/editor/pageFrame/docxBorderImport.ts');
const { createPageFrame, buildPageFrameScene, pageFrameFor, pageFrameSvg, frameMargins, isFrameBackgroundNode } = require('../src/editor/pageFrame/pageFrame.ts');
const { integrateBookPageBorder } = require('../src/editor/pageFrame/bookBorder.ts');
const { applyPageFrame } = require('../src/editor/pageFrame/actions.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { makeCurriculumBlock, DEFAULT_CHAPTER_CONFIG } = require('../src/editor/curriculum/chapterEngine.ts');
const { CURRICULUM_BLOCKS } = require('../src/editor/curriculum/catalog.ts');
const { insertCurriculumBlock } = require('../src/editor/curriculum/actions.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { pdfArtworkFrame, pdfBorderRenderSize, importPdfBorder } = require('../src/editor/pageFrame/pdfBorderImport.ts');
const { importBorderTemplate } = require('../src/editor/pageFrame/borderTemplateImport.ts');
const starter = structuredClone(store.getState().getActiveBook());
function reset() {
  const book = structuredClone(starter); book.pages = [{ id: 'compact-page', pageIndex: 0, displayNumber: '1', elementIds: [], status: 'Draft' }]; book.chapters = []; book.units = [];
  store.setState({ books: [book], activeBookId: book.id, elements: {}, activePageIndex: 0, selectedElementIds: [] }); history.getState().clearHistory(); return book;
}
function archive(text, method = 8) {
  const name = Buffer.from('word/document.xml'), data = Buffer.from(text), compressed = method === 8 ? deflateRawSync(data) : data;
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  crc = (crc ^ 0xffffffff) >>> 0;
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(method, 8); local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(method, 10); central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(central.length + name.length, 12); end.writeUInt32LE(local.length + name.length + compressed.length, 16);
  const result = Buffer.concat([local, name, compressed, central, name, end]); return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
}
test('DOCX archive reads stored/deflated XML and rejects corruption, oversized parts and non-Word ZIPs', async () => {
  for (const method of [0, 8]) {
    const zip = archive('<document>Border</document>', method);
    assert.equal(new TextDecoder().decode(await readDocxArchive(zip).read('word/document.xml')), '<document>Border</document>');
    const corrupt = zip.slice(0); new Uint8Array(corrupt)[30 + 'word/document.xml'.length] ^= 255;
    await assert.rejects(() => readDocxArchive(corrupt).read('word/document.xml'));
  }
  assert.throws(() => readDocxArchive(new ArrayBuffer(12)), /valid .docx/);
  const large = archive('Border'); const view = new DataView(large), end = large.byteLength - 22, central = view.getUint32(end + 16, true); view.setUint32(central + 24, 13 * 1024 * 1024, true);
  await assert.rejects(() => readDocxArchive(large).read('word/document.xml'), /too large/);
  await assert.rejects(() => readDocxArchive(archive('Border')).read('missing.xml'), /missing/);
});
test('all 224 library families insert compactly and remain within every page boundary', () => {
  for (const definition of CURRICULUM_BLOCKS) {
    const book = reset(); insertCurriculumBlock(definition.id, undefined, 3, 'Science');
    const st = store.getState(); const selected = st.elements[st.selectedElementIds[0]];
    assert.equal(selected.smartBlockData.styleOverrides.compactScale, .8, definition.id);
    for (const page of st.getActiveBook().pages) {
      const margins = frameMargins(book, pageFrameFor(st.getActiveBook(), page));
      for (const id of page.elementIds) {
        const element = st.elements[id]; assert.ok(element.transform.y >= margins.topPt, definition.id);
        assert.ok(element.transform.y + element.transform.height <= book.dimensions.heightPt - margins.bottomPt + .01, definition.id);
        assert.equal(buildPublicationScene(element.smartBlockData).height, element.transform.height, definition.id);
      }
    }
  }
});
test('compact insertion keeps two small blocks on one page and undo restores page/content', () => {
  reset(); insertCurriculumBlock('quick-check', undefined, 3, 'Science');
  const before = structuredClone({ book: store.getState().getActiveBook(), elements: store.getState().elements });
  insertCurriculumBlock('quick-check', undefined, 3, 'Science');
  assert.equal(store.getState().getActiveBook().pages.length, 1);
  assert.equal(store.getState().getActivePage().elementIds.length, 2);
  history.getState().undo(); assert.deepEqual(store.getState().getActiveBook(), before.book); assert.deepEqual(store.getState().elements, before.elements);
  history.getState().redo(); assert.equal(store.getState().getActivePage().elementIds.length, 2);
});
test('editing compact content preserves the chosen layout and rendered geometry', () => {
  const block = makeCurriculumBlock('quick-check', DEFAULT_CHAPTER_CONFIG);
  block.styleOverrides.compactScale = .8;
  const before = buildPublicationScene(block);
  const editable = buildPublicationScene({ ...block, styleOverrides: { ...block.styleOverrides, contentLayout: { enabled: true, items: {} } } });
  assert.equal(editable.variant, before.variant); assert.deepEqual(editable.nodes, before.nodes); assert.equal(editable.height, before.height);
});
test('long generic blocks paginate without losing text, and one undo removes all continuation pages', () => {
  const book = reset(), template = makeCurriculumBlock('reading-passage', DEFAULT_CHAPTER_CONFIG);
  template.semanticContent.passage = Array.from({ length: 150 }, (_, i) => `UniqueMarker${i} This sentence must stay in the document.`).join(' ');
  insertCurriculumBlock('reading-passage', undefined, 3, 'English', template);
  const st = store.getState(); assert.ok(st.getActiveBook().pages.length > 1);
  const text = Object.values(st.elements).flatMap(element => buildPublicationScene(element.smartBlockData).nodes.filter(node => node.kind === 'text').map(node => node.text)).join(' ');
  for (let i = 0; i < 150; i++) assert.ok(text.includes(`UniqueMarker${i}`));
  history.getState().undo(); assert.deepEqual(store.getState().getActiveBook(), book); assert.deepEqual(store.getState().elements, {});
});
test('imported book frame survives JSON/reload, future pages, print geometry, and undo/redo', () => {
  const book = reset(), frame = { ...createPageFrame(), style: 'word-import', sourceName: 'border.docx', showTopNumber: false, showBottomNumber: false,
    safeInsets: { top: .04, bottom: .04, left: .04, right: .04 }, additions: [{ kind: 'line', motifId: 'Word top border', x: 24, y: 24, x2: 576, y2: 24, stroke: '#123456', strokeWidth: 1 }] };
  applyPageFrame(frame, 'book'); const applied = structuredClone(store.getState().getActiveBook());
  const restored = JSON.parse(JSON.stringify(applied)); assert.deepEqual(integrateBookPageBorder(restored), restored); assert.equal(restored.pageFrame.style, 'word-import');
  assert.deepEqual(pageFrameFor(applied, applied.pages[0]), frame);
  const scene = buildPageFrameScene(frame, '1', 595, 842); assert.equal(scene.nodes.length, 2); assert.ok(!scene.nodes.some(node => node.kind === 'path'));
  assert.match(pageFrameSvg(frame), /Word top border/);
  history.getState().undo(); assert.deepEqual(store.getState().getActiveBook(), book); history.getState().redo(); assert.deepEqual(store.getState().getActiveBook(), applied);
  store.getState().addPage(0); assert.equal(pageFrameFor(store.getState().getActiveBook(), store.getState().getActivePage()).style, 'word-import');
});
test('opaque imported artwork is behind reading content and SVG can export the image', () => {
  const frame = { ...createPageFrame(), style: 'word-import', showTopNumber: false, showBottomNumber: false,
    additions: [{ kind: 'image', motifId: 'Word border artwork', x: 0, y: 0, w: 600, h: 900, src: 'data:image/png;base64,abc', alt: 'Border', focalX: .5, focalY: .5, scale: 1 }] };
  const scene = buildPageFrameScene(frame, '1', 600, 900);
  assert.equal(scene.nodes.filter(isFrameBackgroundNode).length, 2);
  assert.equal(scene.nodes.filter(node => !isFrameBackgroundNode(node)).length, 0);
  assert.match(pageFrameSvg(frame), /<image .*href="data:image\/png;base64,abc"/);
});
test('masked image borders stay above full-page artwork with a transparent reading centre in HTML and SVG', () => {
  const book = reset(), image = { kind: 'image', motifId: 'Word border artwork', x: 0, y: 0, w: 600, h: 900, src: 'data:image/png;base64,abc', alt: 'Border', focalX: .5, focalY: .5, scale: 1,
    mask: 'custom', customMaskPath: 'M 0 0 L 100 0 L 100 100 L 0 100 Z M 10 10 L 10 90 L 90 90 L 90 10 Z' };
  const frame = { ...createPageFrame(), style: 'word-import', showTopNumber: false, showBottomNumber: false, additions: [image] };
  const scene = buildPageFrameScene(frame, '1', 600, 900);
  assert.equal(isFrameBackgroundNode(scene.nodes[1]), false);
  const element = { id: 'full-page-art', transform: { x: 0, y: 0, width: 600, height: 900, rotation: 0 }, style: {} };
  const html = buildPrintHtml(book, [{ number: '1', frame: scene, elements: [{ element, scene: { width: 600, height: 900, nodes: [{ kind: 'rect', x: 0, y: 0, w: 600, h: 900, fill: '#FFFFFF' }] } }] }], '');
  assert.ok(html.indexOf('data-print-frame="full-page-art"') < html.indexOf('<image'));
  assert.match(html, /<clipPath[^>]*><path d="M 0 0 L 600 0 L 600 900 L 0 900 Z M 60 90 L 60 810 L 540 810 L 540 90 Z"/);
  assert.match(pageFrameSvg(frame), /clip-path="url\(#border-image-1\)"/);
});
test('PDF border survives reload, future pages, undo/redo, and portrait/landscape print geometry', () => {
  const before = reset(), frame = pdfArtworkFrame('my-border.pdf', 'data:image/png;base64,abc');
  applyPageFrame(frame, 'book');
  const applied = structuredClone(store.getState().getActiveBook()), restored = JSON.parse(JSON.stringify(applied));
  assert.deepEqual(integrateBookPageBorder(restored), restored);
  assert.equal(restored.pageFrame.style, 'pdf-import');
  for (const [width, height] of [[595, 842], [842, 595]]) {
    const scene = buildPageFrameScene(frame, '3', width, height);
    assert.equal(scene.nodes.length, 2); assert.equal(scene.nodes[1].w, width); assert.equal(scene.nodes[1].h, height);
    assert.equal(isFrameBackgroundNode(scene.nodes[1]), false);
    assert.match(pageFrameSvg(frame, '3', width, height), /PDF border artwork/);
    const margins = frameMargins(applied, frame); assert.ok(margins.topPt >= applied.dimensions.heightPt * .1);
  }
  history.getState().undo(); assert.deepEqual(store.getState().getActiveBook(), before);
  history.getState().redo(); assert.deepEqual(store.getState().getActiveBook(), applied);
  store.getState().addPage(0); assert.equal(pageFrameFor(store.getState().getActiveBook(), store.getState().getActivePage()).style, 'pdf-import');
});
test('PDF rasterization bounds memory for normal, landscape, and oversized pages', () => {
  for (const [width, height] of [[595, 842], [842, 595], [14400, 14400], [72, 72]]) {
    const size = pdfBorderRenderSize(width, height);
    assert.ok(size.width <= 2400 && size.height <= 2400);
    assert.ok(size.width > 0 && size.height > 0 && size.scale > 0);
  }
  for (const [width, height] of [[0, 842], [595, NaN], [Infinity, 300], [15000, 300], [20, 50]]) assert.throws(() => pdfBorderRenderSize(width, height), /dimensions/);
});
test('PDF and shared upload reject oversized, mislabeled, or unsupported files before loading the renderer', async () => {
  await assert.rejects(() => importPdfBorder({ name: 'x.pdf', size: 21 * 1024 * 1024 }), /20 MB/);
  await assert.rejects(() => importPdfBorder({ name: 'x.txt', size: 10 }), /single-page .pdf/);
  await assert.rejects(() => importBorderTemplate({ name: 'x.doc', size: 10 }), /docx or .pdf/);
  await assert.rejects(() => importBorderTemplate({ name: 'x.PDF', size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }), /valid PDF/);
});
