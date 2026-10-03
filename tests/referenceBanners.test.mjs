import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { REFERENCE_BANNERS, referenceBannerId, referenceBannerColour, shuffledReferenceBannerColour } = require('../src/editor/educational/referenceBanners.ts');
const { REFERENCE_BANNER_COLOURS } = require('../src/domain/educational/designTokens.ts');
const { createSmartBlockInstance } = require('../src/editor/educational/blockRegistry.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { publicationSceneForElement } = require('../src/editor/educational/publicationPdf.ts');
const { imageFilter, filterImagePixels } = require('../src/editor/educational/imageTreatment.ts');
const { detachPublicationScene } = require('../src/editor/educational/detachScene.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { duplicateEducationalBlock } = require('../src/editor/educational/library/actions.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
const baseBook = structuredClone(useEditorStore.getState().books[0]);
function reset() {
  const page = { id: 'reference-page', pageIndex: 0, displayNumber: '1', elementIds: [], status: 'Draft' };
  useEditorStore.setState({ books: [{ ...structuredClone(baseBook), id: 'reference-book', pages: [page], grade: 'Grade 3', subject: 'Science', chapters: [], units: [], masterPages: [], pageFrame: null }], activeBookId: 'reference-book', activePageIndex: 0, elements: {}, selectedElementIds: [] });
  useHistoryStore.getState().clearHistory();
  return useEditorStore.getState();
}

test('all ten original assets are PNGs with the exact supplied 2172 × 724 dimensions', () => {
  assert.equal(REFERENCE_BANNERS.length, 10);
  assert.equal(new Set(REFERENCE_BANNERS.map(b => b.slug)).size, 10);
  for (const banner of REFERENCE_BANNERS) {
    const asset = fs.readFileSync(new URL(`../public/assets/reference-banners/${banner.slug}.png`, import.meta.url));
    assert.equal(asset.subarray(1, 4).toString(), 'PNG');
    assert.equal(asset.readUInt32BE(16), 2172);
    assert.equal(asset.readUInt32BE(20), 724);
    for (const width of [180, 480, 660]) {
      const block = createSmartBlockInstance(referenceBannerId(banner.slug), 'page');
      block.transform.width = width; block.transform.height = 0;
      const scene = buildPublicationScene(block);
      assert.equal(scene.height, width / 3);
      assert.equal(scene.nodes.length, 1);
      assert.equal(scene.nodes[0].fit, 'contain');
      assert.equal(scene.nodes[0].hueRotate, 0);
      assert.equal(scene.nodes[0].alt, banner.description);
    }
  }
});

test('every colour keeps the same original artwork and layout; shuffle never repeats the current colour', () => {
  const block = createSmartBlockInstance(referenceBannerId('activity'), 'page');
  const original = buildPublicationScene(block);
  for (const colour of REFERENCE_BANNER_COLOURS) {
    const scene = buildPublicationScene({ ...block, styleOverrides: { referenceBannerColour: colour.id } });
    assert.equal(scene.nodes[0].src, original.nodes[0].src);
    assert.equal(scene.height, original.height);
    assert.equal(scene.nodes[0].hueRotate, colour.hueRotate);
    for (const random of [0, .5, .999]) assert.notEqual(shuffledReferenceBannerColour(colour.id, () => random), colour.id);
  }
  assert.equal(referenceBannerColour('missing-palette').id, 'original');
  const gray = buildPublicationScene({ ...block, styleOverrides: { referenceBannerColour: 'berry', printMode: 'grayscale' } });
  assert.equal(gray.nodes[0].saturation, 0);
});

test('export fallback preserves neutral paper and alpha, changes coloured pixels, and supports grayscale', () => {
  const source = new Uint8ClampedArray([255,255,255,255, 80,80,80,120, 0,60,130,255, 255,0,0,0]);
  const rotated = source.slice(); filterImagePixels(rotated, { hueRotate: 80 });
  assert.deepEqual([...rotated.slice(0,8)], [...source.slice(0,8)]);
  assert.notDeepEqual([...rotated.slice(8,11)], [...source.slice(8,11)]);
  assert.deepEqual([...rotated.slice(12)], [...source.slice(12)]);
  const identity = source.slice(); filterImagePixels(identity, {}); assert.deepEqual(identity, source);
  const grayscale = source.slice(); filterImagePixels(grayscale, { hueRotate: 80 }, true);
  assert.equal(grayscale[8], grayscale[9]); assert.equal(grayscale[9], grayscale[10]);
});

test('insertion is atomic, subject examples do not overwrite artwork headings, colour shuffle supports undo and locks', () => {
  const store = reset();
  const element = store.addEducationalBlock(referenceBannerId('topic'), undefined, undefined, { subject: 'science', grade: 'primary-upper', referenceBannerColour: 'violet' });
  assert.ok(element);
  assert.equal(element.smartBlockData.semanticContent.title, 'Topic');
  assert.equal(element.smartBlockData.styleOverrides.referenceBannerColour, 'violet');
  assert.equal(element.transform.height, element.transform.width / 3);
  useHistoryStore.getState().undo();
  assert.equal(useEditorStore.getState().elements[element.id], undefined);
  useHistoryStore.getState().redo();
  assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.styleOverrides.referenceBannerColour, 'violet');
  store.shuffleEducationalBlockStyle(element.id);
  const shuffled = useEditorStore.getState().elements[element.id];
  assert.equal(shuffled.smartBlockData.presetId, element.smartBlockData.presetId);
  assert.notEqual(shuffled.smartBlockData.styleOverrides.referenceBannerColour, 'violet');
  assert.deepEqual(shuffled.smartBlockData.semanticContent, element.smartBlockData.semanticContent);
  useHistoryStore.getState().undo();
  assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.styleOverrides.referenceBannerColour, 'violet');
  store.updateElement(element.id, { locked: true });
  store.shuffleEducationalBlockStyle(element.id);
  assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.styleOverrides.referenceBannerColour, 'violet');
});

test('duplication, JSON reload, PDF scenes, print scenes and detached image layers retain the colour treatment', () => {
  const store = reset();
  const element = store.addEducationalBlock(referenceBannerId('quick-check'), undefined, undefined, { referenceBannerColour: 'teal' });
  const duplicate = duplicateEducationalBlock(element);
  assert.equal(duplicate.smartBlockData.styleOverrides.referenceBannerColour, 'teal');
  const reloaded = JSON.parse(JSON.stringify(element));
  const pdf = publicationSceneForElement(reloaded);
  assert.match(imageFilter(pdf.nodes[0]), /hue-rotate\(285deg\)/);
  const latest = useEditorStore.getState();
  const print = collectPrintPages(latest.getActiveBook(), latest.elements);
  const node = print.flatMap(page => page.elements).find(item => item.element.id === element.id).scene.nodes[0];
  assert.equal(node.hueRotate, 285);
  const detached = detachPublicationScene(reloaded.smartBlockData, 10);
  assert.equal(detached.length, 1);
  assert.equal(detached[0].content.hueRotate, 285);
  assert.equal(publicationSceneForElement(detached[0]).nodes[0].hueRotate, 285);
});

test('saved colour presets reinsert as independent banners and undo insertion in one step', () => {
  const store = reset();
  const element = store.addEducationalBlock(referenceBannerId('example'), undefined, undefined, { referenceBannerColour: 'berry' });
  store.savePublicationPreset('Example in berry', element.id, 'banners');
  const savedId = Object.entries(useEditorStore.getState().publicationPresets).find(([, preset]) => preset.name === 'Example in berry')[0];
  store.insertPublicationPreset(savedId);
  const inserted = Object.values(useEditorStore.getState().elements).find(item => item.id !== element.id);
  assert.equal(inserted.smartBlockData.styleOverrides.referenceBannerColour, 'berry');
  assert.equal(inserted.smartBlockData.semanticContent.title, 'Example');
  store.updateSmartBlockStyle(inserted.id, { referenceBannerColour: 'teal' });
  assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.styleOverrides.referenceBannerColour, 'berry');
  assert.equal(useEditorStore.getState().publicationPresets[savedId].block.styleOverrides.referenceBannerColour, 'berry');
  useHistoryStore.getState().undo();
  useHistoryStore.getState().undo();
  assert.equal(useEditorStore.getState().elements[inserted.id], undefined);
  assert.ok(useEditorStore.getState().elements[element.id]);
});


test('all text-free assets are separate full-resolution files; original, blank and editable versions survive switching', () => {
  for (const banner of REFERENCE_BANNERS) {
    const asset = fs.readFileSync(new URL(`../public/assets/reference-banners/${banner.slug}-blank.png`, import.meta.url));
    assert.equal(asset.readUInt32BE(16), 2172); assert.equal(asset.readUInt32BE(20), 724);
    const block = createSmartBlockInstance(referenceBannerId(banner.slug), 'page');
    for (const referenceBannerVersion of ['original', 'blank', 'editable']) {
      block.styleOverrides.referenceBannerVersion = referenceBannerVersion;
      const scene = buildPublicationScene(block);
      assert.equal(scene.height, block.transform.width / 3);
      const images = scene.nodes.filter(n => n.kind === 'image'), texts = scene.nodes.filter(n => n.kind === 'text');
      assert.equal(images.length, 1);
      assert.match(images[0].src, referenceBannerVersion === 'original' ? new RegExp(`${banner.slug}\\.png$`) : /-blank\.png$/);
      assert.equal(texts.map(n => n.text).join(' '), referenceBannerVersion === 'editable' ? banner.title : '');
      if (referenceBannerVersion === 'editable') assert.ok(texts.some(n => n.fieldPath === 'title'));
    }
  }
});

test('editable headings persist, fit long text, undo, respect locks and export as live outlined text', () => {
  const store = reset();
  const element = store.addEducationalBlock(referenceBannerId('activity'), undefined, undefined, { referenceBannerVersion: 'editable', referenceBannerColour: 'violet' });
  const title = 'Explore Together & Discover <New Ideas>';
  store.updateSmartBlockContent(element.id, { title });
  let edited = useEditorStore.getState().elements[element.id];
  assert.equal(edited.smartBlockData.semanticContent.title, title);
  assert.equal(edited.transform.height, edited.transform.width / 3);
  useHistoryStore.getState().undo();
  assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent.title, 'Activity');
  useHistoryStore.getState().redo();
  for (const referenceBannerVersion of ['blank', 'original', 'editable']) {
    store.updateSmartBlockStyle(element.id, { referenceBannerVersion });
    assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent.title, title);
  }
  edited = JSON.parse(JSON.stringify(useEditorStore.getState().elements[element.id]));
  const scene = publicationSceneForElement(edited), text = scene.nodes.find(n => n.kind === 'text');
  assert.equal(text.text, title); assert.equal(text.stroke, '#ffffff'); assert.equal(text.fontWeight, 900);
  assert.ok(text.size <= edited.transform.width * .145);
  const detached = detachPublicationScene(edited.smartBlockData, 1);
  assert.equal(detached.filter(n => n.type === 'body').map(n => n.content.text).join(' '), title);
  const detachedScene = publicationSceneForElement(detached.find(n => n.type === 'body'));
  assert.ok(detachedScene.nodes.some(n => n.kind === 'gradient'));
  const latest = useEditorStore.getState(), pages = collectPrintPages(latest.getActiveBook(), latest.elements);
  for (const page of pages) for (const scene of [page.frame, page.footer, ...page.elements.map(item => item.scene)].filter(Boolean)) for (const node of scene.nodes) if (node.kind === 'image') node.src = 'data:image/png;base64,AAAA';
  const html = buildPrintHtml(latest.getActiveBook(), pages, '');
  assert.match(html, /data-print-text="1"/); assert.match(html, /stroke="#ffffff"/); assert.match(html, /font-weight="900"/);
  assert.ok(html.includes('&amp;')); assert.ok(html.includes('&lt;New Ideas&gt;'));
  store.updateElement(element.id, { locked: true });
  store.updateSmartBlockContent(element.id, { title: 'Blocked edit' });
  assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent.title, title);
});
