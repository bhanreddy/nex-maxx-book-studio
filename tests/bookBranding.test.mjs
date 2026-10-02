import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { embedFooterFixture } from './helpers/printFixtures.mjs';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { createDefaultDemoBook } = require('../src/editor/seed/demoBook.ts');
const { integrateFirstPageLogo } = require('../src/editor/branding/bookBranding.ts');
const { NEX_MAXX_LOGO } = require('../src/domain/brand.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { buildPublisherFooterScene } = require('../src/editor/branding/publisherFooter.ts');
const { pageMarginsFor, createPageFrame } = require('../src/editor/pageFrame/pageFrame.ts');
const { NEX_MAXX_POWERED_BY } = require('../src/domain/brand.ts');

test('supplied logo is the exact original PNG and enters the existing image print pipeline', () => {
  const bytes = fs.readFileSync('public/assets/brand/nex-maxx-logo.png');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'a6c9bee9024e8a0deac707b539b1f79284380b3fa04f602563578eeb7a828065');
  assert.equal(bytes.readUInt32BE(16), NEX_MAXX_LOGO.width);
  assert.equal(bytes.readUInt32BE(20), NEX_MAXX_LOGO.height);
  const demo = createDefaultDemoBook();
  const first = demo.book.pages[0];
  const logo = first.elementIds.map(id => demo.elements[id]).find(el => el.metadata?.tags?.includes('publisher-logo'));
  assert.equal(logo.content.src, NEX_MAXX_LOGO.src);
  assert.ok(NEX_MAXX_LOGO.width / (logo.transform.width / 72) >= 300);
  const pages = collectPrintPages({ ...demo.book, pages: [{ ...first, elementIds: [logo.id] }] }, demo.elements);
  assert.equal(pages[0].elements[0].scene.nodes[0].src, NEX_MAXX_LOGO.src);
});

test('new books include a movable native logo; reloading preserves placement or intentional removal', () => {
  const book = useEditorStore.getState().createBook({ title: 'Branded local book' });
  const elements = useEditorStore.getState().elements;
  assert.equal(book.pages.length, 1);
  const logo = elements[book.pages[0].elementIds[0]];
  assert.equal(logo.type, 'image'); assert.equal(logo.locked, false);
  const customized = { ...elements, [logo.id]: { ...logo, transform: { ...logo.transform, x: 80 } } };
  assert.equal(integrateFirstPageLogo(book, customized).elements, customized);
  const removed = { ...book, pages: [{ ...book.pages[0], elementIds: [] }] };
  assert.equal(integrateFirstPageLogo(removed, elements).book, removed);
});

test('legacy first-page integration preserves every element and remains idempotent', () => {
  const demo = createDefaultDemoBook();
  const logoIds = new Set(Object.values(demo.elements).filter(el => el.metadata?.tags?.includes('publisher-logo')).map(el => el.id));
  const book = { ...demo.book, publisherBrandingVersion: undefined, pages: demo.book.pages.map(page => ({ ...page, elementIds: page.elementIds.filter(id => !logoIds.has(id)) })) };
  const elements = Object.fromEntries(Object.entries(demo.elements).filter(([id]) => !logoIds.has(id)));
  const before = JSON.stringify({ book, elements });
  const integrated = integrateFirstPageLogo(book, elements);
  assert.equal(JSON.stringify({ book, elements }), before);
  assert.equal(integrated.book.pages.length, book.pages.length);
  for (const id of book.pages[0].elementIds) assert.equal(integrated.elements[id], elements[id]);
  assert.equal(integrateFirstPageLogo(integrated.book, integrated.elements).book, integrated.book);
});

test('a crowded first page gets a separate cover without relocating its content or folio', () => {
  const demo = createDefaultDemoBook();
  const content = { id: 'full', pageId: 'p', type: 'image', category: 'media', locked: false, hidden: false, transform: { x: 0, y: 0, width: 595, height: 842, rotation: 0, zIndex: 1 }, style: {}, content: { src: '/assets/full-page.png' } };
  const book = { ...demo.book, publisherBrandingVersion: undefined, pages: [{ id: 'p', pageIndex: 0, displayNumber: '1', elementIds: ['full'], status: 'Draft' }] };
  const result = integrateFirstPageLogo(book, { full: content });
  assert.equal(result.book.pages.length, 2);
  assert.equal(result.book.pages[0].displayNumber, 'Cover');
  assert.equal(result.book.pages[1].displayNumber, '1');
  assert.equal(result.book.pages[1].id, 'p');
  assert.deepEqual(result.book.pages[1].elementIds, ['full']);
  assert.equal(result.elements.full, content);
});

test('footer geometry clears reading content and trim on portrait, landscape and decorative pages', () => {
  const base = createDefaultDemoBook().book;
  for (const [widthPt, heightPt] of [[595, 842], [420, 595], [842, 595]]) for (const framed of [false, true]) {
    const book = { ...base, dimensions: { widthPt, heightPt }, chapters: [], masterPages: [], pageFrame: framed ? createPageFrame() : null };
    const page = { id: 'footer-page', pageIndex: 0, displayNumber: '1', elementIds: [] };
    const scene = buildPublisherFooterScene(book, page);
    assert.deepEqual(scene.warnings, []);
    const image = scene.nodes.find(node => node.kind === 'image');
    const rule = scene.nodes.find(node => node.kind === 'line');
    if (framed) {
      assert.equal(rule, undefined);
      assert.ok(image.y > heightPt - pageMarginsFor(book, page).bottomPt);
      assert.ok(image.x > widthPt * .75);
      const attribution = scene.nodes.find(node => node.motifId === 'Publisher attribution');
      assert.equal(attribution.align, 'middle');
      assert.ok(attribution.y > image.y + image.h);
      assert.ok(attribution.y <= heightPt * 835 / 900);
    } else assert.ok(rule.y > heightPt - pageMarginsFor(book, page).bottomPt);
    assert.ok(image.y + image.h <= heightPt - 8);
    assert.equal(image.src, NEX_MAXX_LOGO.src);
    assert.equal(scene.nodes.filter(node => node.kind === 'text' && node.text === NEX_MAXX_POWERED_BY).length, 1);
    assert.equal(scene.nodes.filter(node => node.motifId === 'Publisher footer folio').length, framed ? 0 : 1);
  }
});

test('shared print footer appears once per page with bleed offsets and leaves Cover unnumbered', () => {
  const demo = createDefaultDemoBook(), book = { ...demo.book, chapters: [], masterPages: [], pageFrame: null, pages: demo.book.pages.slice(0, 2).map((page, index) => ({ ...page, pageIndex: index, displayNumber: index ? '1' : 'Cover', elementIds: [], masterPageId: undefined })) };
  const pages = collectPrintPages(book, {});
  assert.equal(pages[0].footer.nodes.some(node => node.motifId === 'Publisher footer folio'), false);
  assert.equal(pages[1].footer.nodes.find(node => node.motifId === 'Publisher footer folio').text, '1');
  const html = buildPrintHtml(book, embedFooterFixture(pages), '', { bleed: true, grayscale: true });
  assert.equal((html.match(/data-publisher-footer="1"/g) || []).length, 2);
  assert.equal((html.match(/Powered by NexSyrus<\/text>/g) || []).length, 2);
  assert.equal((html.match(/<image /g) || []).length, 2);
  assert.match(html, /data-publisher-footer="1" transform="translate\(9,9\)"/);
  assert.ok(!html.includes('data-default-footer'));
});

test('custom footer and folio keep their position without duplicate numbers or branded row collisions', () => {
  const base = createDefaultDemoBook().book;
  for (const bottomPt of [36, 100]) {
    const book = { ...base, chapters: [], masterPages: [], pageFrame: null, margins: { ...base.margins, bottomPt } };
    const y = book.dimensions.heightPt - Math.max(20, bottomPt - 12);
    const footer = { id: 'custom-footer', type: 'footer', hidden: false, content: { text: 'Learning series' }, transform: { y, height: 16 } };
    const folio = { ...footer, id: 'custom-folio', type: 'pageNumber', content: { text: '8' } };
    const page = { id: 'custom', pageIndex: 7, displayNumber: '8', elementIds: [footer.id, folio.id] };
    const scene = buildPublisherFooterScene(book, page, { [footer.id]: footer, [folio.id]: folio });
    assert.deepEqual(scene.warnings, []);
    const image = scene.nodes.find(node => node.kind === 'image');
    assert.ok(image.y + image.h + 4 <= y || image.y >= y + 20);
    assert.equal(scene.nodes.some(node => node.motifId === 'Publisher footer folio'), false);
  }
});

test('master-hidden folios stay hidden while publisher attribution remains visible', () => {
  const base = createDefaultDemoBook().book;
  const book = { ...base, chapters: [], pageFrame: null, masterPages: [{ id: 'hidden-folio', margins: base.margins, showPageNumber: false }] };
  const page = { id: 'hidden-number', pageIndex: 0, displayNumber: '1', masterPageId: 'hidden-folio', elementIds: [] };
  const scene = buildPublisherFooterScene(book, page);
  assert.equal(scene.nodes.some(node => node.motifId === 'Publisher footer folio'), false);
  assert.equal(scene.nodes.find(node => node.motifId === 'Publisher attribution').text, NEX_MAXX_POWERED_BY);
});
