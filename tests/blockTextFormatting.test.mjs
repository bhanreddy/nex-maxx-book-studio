import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { embedFooterFixture } from './helpers/printFixtures.mjs';
const require = createRequire(import.meta.url);
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { blockTextRole, blockTextTarget } = require('../src/editor/educational/textFormatting.ts');
const { createSmartBlockInstance, EDUCATIONAL_BLOCK_REGISTRY } = require('../src/editor/educational/blockRegistry.ts');
const { REFERENCE_ARTWORKS, referenceBannerId } = require('../src/editor/educational/referenceBanners.ts');
const { makeCurriculumBlock, DEFAULT_CHAPTER_CONFIG } = require('../src/editor/curriculum/chapterEngine.ts');
const { createFrameworkChapter, setFrameworkMode } = require('../src/editor/curriculum/actions.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { publicationSceneForElement, renderPublicationPdf } = require('../src/editor/educational/publicationPdf.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { jsPDF } = require('jspdf');
const initial = structuredClone({ books: store.getState().books, elements: store.getState().elements, activeBookId: store.getState().activeBookId });
function reset() { store.setState({ ...structuredClone(initial), activePageIndex: 0, selectedElementIds: [] }); history.getState().clearHistory(); }

test('text sizing and colour preserve every scene frame and decorative node across block families', () => {
  const ids = [...REFERENCE_ARTWORKS.map(a => referenceBannerId(a.slug)), ...Object.keys(EDUCATIONAL_BLOCK_REGISTRY).filter(id => /^(edu-|atelier-|studio-quick-check)/.test(id))];
  const blocks = ids.map(id => createSmartBlockInstance(id, 'page'));
  for (const type of ['chapter-hero', 'lesson-schema', 'learning-outcomes', 'fact-zone', 'study-skills', 'life-connect']) blocks.push(makeCurriculumBlock(type, DEFAULT_CHAPTER_CONFIG));
  for (const block of blocks) {
    if (REFERENCE_ARTWORKS.some(a => referenceBannerId(a.slug) === block.presetId)) block.styleOverrides.referenceBannerVersion = 'editable';
    const before = buildPublicationScene(block), semantic = structuredClone(block.semanticContent);
    block.styleOverrides.textFormatting = { all: { fontSize: 18, color: '#912345' } };
    const after = buildPublicationScene(block);
    assert.equal(after.width, before.width, block.presetId); assert.equal(after.height, before.height, block.presetId);
    assert.deepEqual(after.nodes.filter(n => n.kind !== 'text'), before.nodes.filter(n => n.kind !== 'text'), block.presetId);
    for (const node of after.nodes.filter(n => n.kind === 'text')) { assert.equal(node.size, 18, block.presetId); assert.equal(node.fill, '#912345', block.presetId); assert.equal(node.textLength, undefined); }
    assert.deepEqual(block.semanticContent, semantic);
  }
});

test('worksheet body, heading and individual rows format independently and retain styles across versions', () => {
  const block = createSmartBlockInstance(referenceBannerId('learning-objectives-six'), 'page');
  block.styleOverrides.referenceBannerVersion = 'editable';
  block.semanticContent.items = ['Identify roots', 'Observe a leaf', 'Compare shapes', 'Record changes', 'Explain growth', 'Reflect on learning'];
  const before = buildPublicationScene(block), heading = before.nodes.filter(n => n.kind === 'text' && blockTextRole(n, before, block) === 'heading');
  block.styleOverrides.textFormatting = { body: { fontSize: 16, color: '#223344' }, 'field:items.5': { fontSize: 20, color: '#cc3322', bold: true } };
  let after = buildPublicationScene(JSON.parse(JSON.stringify(block)));
  assert.deepEqual(after.nodes.filter(n => n.kind === 'text' && blockTextRole(n, after, block) === 'heading'), heading);
  assert.equal(after.nodes.find(n => n.fieldPath === 'items.0').size, 16);
  assert.equal(after.nodes.find(n => n.fieldPath === 'items.5').size, 20);
  block.styleOverrides.textFormatting['field:title'] = { fontSize: 28, color: '#441188' };
  const split = buildPublicationScene(block).nodes.filter(n => n.kind === 'text' && n.textRole === 'heading');
  assert.equal(split.length, 2); assert.ok(split.every(n => n.size === 28 && n.fill === '#441188'));
  delete block.styleOverrides.textFormatting['field:title'];
  assert.equal(after.nodes.find(n => n.fieldPath === 'items.5').fill, '#cc3322');
  block.styleOverrides.textFormatting.heading = { fontSize: 30, color: '#009977' };
  after = buildPublicationScene(block);
  assert.equal(after.nodes.find(n => n.fieldPath === 'title').size, 30);
  assert.equal(after.nodes.find(n => n.fieldPath === 'items.5').size, 20);
  for (const version of ['blank', 'original']) { block.styleOverrides.referenceBannerVersion = version; assert.equal(buildPublicationScene(block).nodes.filter(n => n.kind === 'text').length, 0); }
  block.styleOverrides.referenceBannerVersion = 'editable';
  assert.equal(buildPublicationScene(block).nodes.find(n => n.fieldPath === 'items.5').size, 20);
});

test('store formatting preserves dimensions, authored positions and content; supports undo, reset, locks and scaled scenes', () => {
  reset();
  const el = store.getState().addEducationalBlock(referenceBannerId('playful-activity'), 40, 40, { referenceBannerVersion: 'editable' });
  store.getState().updateSmartBlockContent(el.id, { title: 'Example', calloutText: '8,450 > 6,320\n4,210 < 5,120' });
  const before = structuredClone(store.getState().elements[el.id]);
  store.getState().updateSmartBlockTextStyle(el.id, 'body', { fontSize: 16, color: '#dd3322' });
  const after = structuredClone(store.getState().elements[el.id]);
  assert.deepEqual(after.transform, before.transform); assert.deepEqual(after.smartBlockData.semanticContent, before.smartBlockData.semanticContent);
  assert.equal(publicationSceneForElement(after).nodes.find(n => n.fieldPath === 'calloutText').size, 16);
  history.getState().undo(); assert.deepEqual(store.getState().elements[el.id], before);
  history.getState().redo(); assert.deepEqual(store.getState().elements[el.id], after);
  store.getState().updateElementTransform(el.id, { width: after.transform.width / 2, height: after.transform.height / 2 }, true, 'scale');
  const scaled = structuredClone(store.getState().elements[el.id]);
  store.getState().updateSmartBlockTextStyle(el.id, 'body', { fontSize: 40 }); // 20 physical points at 50% scale
  const changed = store.getState().elements[el.id], scene = publicationSceneForElement(changed);
  assert.deepEqual(changed.transform, scaled.transform); assert.deepEqual(changed.smartBlockData.styleOverrides.resizeFrame, scaled.smartBlockData.styleOverrides.resizeFrame);
  assert.equal(scene.nodes.find(n => n.fieldPath === 'calloutText').size * changed.transform.height / changed.smartBlockData.styleOverrides.resizeFrame.height, 20);
  store.getState().updateSmartBlockTextStyle(el.id, 'body', null);
  assert.equal(store.getState().elements[el.id].smartBlockData.styleOverrides.textFormatting.body, undefined);
  const clean = structuredClone(store.getState().elements[el.id]);
  store.getState().updateSmartBlockTextStyle(el.id, 'body', { fontSize: NaN, color: 'invalid' }); assert.deepEqual(store.getState().elements[el.id], clean);
  store.getState().updateElement(el.id, { locked: true });
  const locked = structuredClone(store.getState().elements[el.id]);
  store.getState().updateSmartBlockTextStyle(el.id, 'body', { fontSize: 22 }); assert.deepEqual(store.getState().elements[el.id], locked);
});

test('curriculum formatting mirrors source and projections without recomposing pages or changing transforms', () => {
  reset();
  const chapter = createFrameworkChapter({ ...DEFAULT_CHAPTER_CONFIG, pageCount: 3 }); setFrameworkMode(chapter.id, 'design');
  const state = store.getState(), element = Object.values(state.elements).find(el => el.smartBlockData?.curriculum?.chapterId === chapter.id);
  const sourceId = element.smartBlockData.curriculum.sourceBlockId || element.smartBlockData.id;
  const pages = structuredClone(state.getActiveBook().pages), transforms = Object.fromEntries(Object.values(state.elements).map(el => [el.id, structuredClone(el.transform)]));
  store.getState().updateSmartBlockTextStyle(element.id, 'body', { fontSize: 17, color: '#884422' });
  assert.deepEqual(store.getState().getActiveBook().pages, pages);
  assert.deepEqual(Object.fromEntries(Object.values(store.getState().elements).map(el => [el.id, el.transform])), transforms);
  assert.deepEqual(store.getState().getActiveBook().chapters.find(ch => ch.id === chapter.id).framework.blocks[sourceId].styleOverrides.textFormatting.body, { fontSize: 17, color: '#884422' });
  history.getState().undo(); assert.equal(store.getState().elements[element.id].smartBlockData.styleOverrides.textFormatting, undefined);
});

test('formatted text reaches native PDF and print HTML without resizing the illustrated frame', async () => {
  reset();
  const el = store.getState().addEducationalBlock('studio-quick-check-1', 40, 40);
  const scene = buildPublicationScene(el.smartBlockData), node = scene.nodes.find(n => n.kind === 'text');
  store.getState().updateSmartBlockTextStyle(el.id, blockTextTarget(node), { fontSize: 24, color: '#912345', italic: true });
  const current = store.getState().elements[el.id], formatted = publicationSceneForElement(current);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' }); await renderPublicationPdf(pdf, formatted, current, 0, 0);
  assert.match(pdf.output(), /24 Tf/);
  const book = { ...store.getState().getActiveBook(), pages: [{ ...store.getState().getActivePage(), elementIds: [el.id] }] };
  const pages = collectPrintPages(book, { [el.id]: current });
  embedFooterFixture(pages);
  for (const page of pages) for (const { scene } of page.elements) for (const n of scene.nodes) if (n.kind === 'image') n.src = 'data:image/png;base64,AAAA';
  const html = buildPrintHtml(book, pages, '');
  assert.match(html, /font-size="24"/); assert.match(html, /fill="#912345"/); assert.match(html, /font-style="italic"/);
  assert.deepEqual(current.transform, el.transform);
});
