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
const { effectiveTextWrap, textWrapObstacles, availableLineSlots, parseFlowText, layoutTextFlow, textFlowScene } = require('../src/editor/layoutPartner/textWrapLayout.ts');
const { publicationSceneForElement } = require('../src/editor/educational/publicationPdf.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const frame = (patch = {}) => ({ id: 'text', pageId: 'p', type: 'body', category: 'text', version: 1, displayName: 'Paragraph', locked: false, hidden: false,
  transform: { x: 0, y: 0, width: 200, height: 300, rotation: 0, zIndex: 1 }, style: { fontSize: 10, lineHeight: 1 },
  content: { text: 'alpha beta gamma delta epsilon zeta '.repeat(16).trim() }, ...patch });
const picture = (patch = {}) => ({ ...frame(), id: 'image', type: 'image', category: 'media', displayName: 'Picture',
  transform: { x: 80, y: 30, width: 40, height: 50, rotation: 0, zIndex: 2 }, style: {}, content: {}, ...patch });
const measure = text => Array.from(text).length * 5;
const flow = (text, images) => layoutTextFlow(text, textWrapObstacles(text, images), measure);
const compact = layout => layout.fragments.flatMap(f => f.runs.map(run => run.text)).join('').replace(/\s/g, '');

test('all page object types can exclude paragraph lines and react to geometry or wrap changes', () => {
  const text = frame(), plain = flow(text, []);
  for (const type of ['shape', 'table', 'qrCode', 'smart-media-qr', 'smart-block', 'activity', 'question',
    'diagram', 'illustration', 'vector-curve', 'compound-shape', 'pixel-layer', 'ai-vector', 'badge', 'divider', 'heading', 'group']) {
    const object = picture({ id: type, type, category: type === 'heading' ? 'text' : 'educational' });
    assert.equal(effectiveTextWrap(object).mode, 'square', type);
    const wrapped = flow(text, [object]);
    assert.notDeepEqual(wrapped.fragments, plain.fragments, type);
    assert.equal(compact(wrapped), text.content.text.replace(/\s/g, ''), type);
    assert.notDeepEqual(flow(text, [{ ...object, transform: { ...object.transform, x: 20, width: 70 } }]), wrapped, type);
    assert.deepEqual(flow(text, [{ ...object, textWrap: { mode: 'none', offsetPt: 0 } }]), plain, type);
    assert.deepEqual(flow(text, [{ ...object, style: { textWrap: { mode: 'none', offsetPt: 0 } } }]), plain, type);
    assert.deepEqual(flow(text, [{ ...object, hidden: true }]), plain, type);
  }
});

test('groups do not exclude their own paragraphs; children wrap as one group outside it', () => {
  const group = picture({ id: 'group', type: 'group', childElementIds: ['text', 'shape'],
    transform: { x: -10, y: -10, width: 220, height: 320, rotation: 0, zIndex: 3 } });
  const text = frame({ groupId: group.id }), child = picture({ id: 'shape', type: 'shape', groupId: group.id });
  assert.deepEqual(textWrapObstacles(text, [group, child]).map(o => o.id), ['shape']);
  const outside = frame({ id: 'outside' });
  assert.deepEqual(textWrapObstacles(outside, [group, child]).map(o => o.id), ['group']);
  assert.deepEqual(textWrapObstacles(outside, [{ ...group, textWrap: { mode: 'none' } }, child]), []);
  assert.deepEqual(textWrapObstacles(outside, [{ ...group, hidden: true }, child]), []);
  const nested = picture({ id: 'nested', type: 'group', groupId: group.id });
  assert.deepEqual(textWrapObstacles(outside, [group, nested, { ...child, groupId: nested.id }]).map(o => o.id), ['group']);
});

test('backdrops and ordinary paragraphs do not erase text; explicit wrapping still works', () => {
  const text = frame(), background = picture({ type: 'shape', category: 'decorative',
    transform: { x: -10, y: -10, width: 220, height: 320, rotation: 0, zIndex: 0 } });
  assert.deepEqual(textWrapObstacles(text, [background]), []);
  assert.equal(textWrapObstacles(text, [{ ...background, textWrap: { mode: 'square', offsetPt: 0 } }]).length, 1);
  const otherText = frame({ id: 'other', transform: { ...picture().transform, zIndex: 2 } });
  assert.equal(effectiveTextWrap(otherText).mode, 'none');
  assert.equal(textWrapObstacles(text, [otherText]).length, 0);
  const wrappingText = { ...otherText, textWrap: { mode: 'square', offsetPt: 0 } };
  assert.equal(textWrapObstacles(text, [wrappingText]).length, 1);
  assert.equal(textWrapObstacles(wrappingText, [{ ...text, textWrap: { mode: 'square' } }]).length, 0);
  for (const type of ['borderFrame', 'adjustment-layer', 'live-filter']) {
    assert.equal(effectiveTextWrap(picture({ type })).mode, 'none');
    assert.equal(textWrapObstacles(text, [picture({ type, textWrap: { mode: 'square' } })]).length, 1);
  }
});

test('a new text box above a partly overlapping object keeps all edited letters visible', () => {
  const text = frame({ transform: { x: 20, y: 20, width: 360, height: 30, rotation: 0, zIndex: 5 },
    style: { fontSize: 10.5, lineHeight: 1.5, padding: { top: 4, right: 4, bottom: 4, left: 4 } },
    content: { text: '<strong>Every</strong> letter should stay visible.' } });
  for (const type of ['shape', 'image', 'smart-block', 'group']) {
    const behind = picture({ id: `behind-${type}`, type, category: 'educational',
      transform: { x: 44, y: 20, width: 360, height: 120, rotation: 0, zIndex: 4 } });
    assert.equal(textWrapObstacles(text, [behind]).length, 0, type);
    const layout = flow(text, [behind]);
    assert.equal(layout.oversetChars, 0, type);
    assert.equal(compact(layout), 'Everylettershouldstayvisible.', type);
    // Intentional wrapping still applies, whether stored on the object or its style.
    for (const explicit of [{ ...behind, textWrap: { mode: 'square', offsetPt: 8 } },
      { ...behind, style: { textWrap: { mode: 'square', offsetPt: 8 } } }]) {
      assert.equal(textWrapObstacles(text, [explicit]).length, 1, type);
      assert.ok(flow(text, [explicit]).oversetChars > 0, type);
    }
    assert.ok(flow(text, [{ ...behind, transform: { ...behind.transform, zIndex: 6 } }]).oversetChars > 0, type);
    const scene = textFlowScene(text, [text, behind]);
    assert.equal(scene.nodes.filter(n => n.kind === 'text').map(n => n.text).join('').replace(/\s/g, ''), 'Everylettershouldstayvisible.', type);
    assert.deepEqual(scene.warnings, []);
  }
});

test('tight shapes and vector contours follow their geometry rather than a rectangular frame', () => {
  const text = frame();
  for (const shapeType of ['circle', 'ellipse', 'polygon', 'star']) {
    const object = picture({ type: 'shape', style: { shapeType }, textWrap: { mode: 'tight', offsetPt: 0 } });
    const obstacles = textWrapObstacles(text, [object]);
    assert.ok(availableLineSlots(0, 200, 31, 3, obstacles)[0].width > 80, shapeType);
  }
  const vector = picture({ type: 'vector-curve', style: { pathData: 'M 20 0 L 40 50 L 0 50 Z' }, textWrap: { mode: 'contour', offsetPt: 0 } });
  assert.ok(availableLineSlots(0, 200, 30, 5, textWrapObstacles(text, [vector]))[0].width > 80);
  const unsupported = { ...vector, style: { pathData: 'M 0 0 A 20 20 0 0 1 40 50 Z' } };
  assert.deepEqual(availableLineSlots(0, 200, 40, 5, textWrapObstacles(text, [unsupported])), [{ x: 0, width: 80 }, { x: 120, width: 80 }]);
});

test('center image creates both-side line slots and restores full width below it', () => {
  const text = frame(), image = picture(), obstacles = textWrapObstacles(text, [image]);
  assert.deepEqual(effectiveTextWrap(image), { mode: 'square', offsetPt: 8 });
  assert.deepEqual(availableLineSlots(0, 200, 0, 10, obstacles), [{ x: 0, width: 200 }]);
  assert.deepEqual(availableLineSlots(0, 200, 40, 10, obstacles), [{ x: 0, width: 72 }, { x: 128, width: 72 }]);
  assert.deepEqual(availableLineSlots(0, 200, 88, 10, obstacles), [{ x: 0, width: 200 }]);
  const layout = flow(text, [image]);
  assert.ok(layout.fragments.some(f => f.y >= 30 && f.y < 80 && f.x === 128));
  assert.ok(layout.fragments.some(f => f.y >= 88 && f.width === 200));
  assert.equal(layout.oversetChars, 0);
  assert.equal(compact(layout), text.content.text.replace(/\s/g, ''));
});

test('move, resize, removal, hidden images and other pages reflow without changing stored text', () => {
  const text = frame(), original = structuredClone(text), image = picture();
  const centered = flow(text, [image]);
  const enlarged = flow(text, [{ ...image, transform: { ...image.transform, width: 90, height: 100 } }]);
  assert.notDeepEqual(enlarged.fragments, centered.fragments);
  const plain = flow(text, []);
  for (const moved of [{ ...image, hidden: true }, { ...image, pageId: 'other' }, { ...image, textWrap: { mode: 'none', offsetPt: 0 } },
    { ...image, transform: { ...image.transform, x: 250 } }]) assert.deepEqual(flow(text, [moved]), plain);
  assert.deepEqual(text, original);
});

test('multiple images subtract their combined exclusions; zero and asymmetric gaps are honored', () => {
  const text = frame(), image = picture({ textWrap: { mode: 'square', offsetPt: 0, leftOffsetPt: 3, rightOffsetPt: 7 } });
  const second = picture({ id: 'second', transform: { x: 150, y: 30, width: 30, height: 50, rotation: 0, zIndex: 3 }, textWrap: { mode: 'square', offsetPt: 0 } });
  assert.deepEqual(availableLineSlots(0, 200, 40, 10, textWrapObstacles(text, [image, second])),
    [{ x: 0, width: 77 }, { x: 127, width: 23 }, { x: 180, width: 20 }]);
  assert.deepEqual(availableLineSlots(0, 200, 20, 10, textWrapObstacles(text, [image])), [{ x: 0, width: 200 }]);
});

test('above/below and largest-side modes have distinct line behavior', () => {
  const text = frame();
  assert.deepEqual(availableLineSlots(0, 200, 40, 10, textWrapObstacles(text, [picture({ textWrap: { mode: 'top-bottom', offsetPt: 0 } })])), []);
  const image = picture({ transform: { ...picture().transform, x: 25 }, textWrap: { mode: 'largest-side', offsetPt: 0 } });
  assert.deepEqual(availableLineSlots(0, 200, 40, 10, textWrapObstacles(text, [image])), [{ x: 65, width: 135 }]);
  for (const mode of ['through', 'floating']) assert.equal(textWrapObstacles(text, [picture({ textWrap: { mode, offsetPt: 0 } })]).length, 0);
});

test('tight masks and custom contours give curved line widths; rotation stays safe', () => {
  const text = frame(), circle = picture({ content: { mask: 'circle' }, textWrap: { mode: 'tight', offsetPt: 0 } });
  const obstacles = textWrapObstacles(text, [circle]);
  const top = availableLineSlots(0, 200, 30, 5, obstacles), middle = availableLineSlots(0, 200, 50, 5, obstacles);
  assert.ok(top[0].width > middle[0].width);
  const blob = picture({ content: { mask: 'blob' }, textWrap: { mode: 'contour', offsetPt: 0 } });
  assert.ok(textWrapObstacles(text, [blob])[0].points.length > 10);
  const triangle = picture({ textWrap: { mode: 'contour', offsetPt: 0, customContourPoints: [{ x: 20, y: 0 }, { x: 40, y: 50 }, { x: 0, y: 50 }] } });
  assert.ok(availableLineSlots(0, 200, 30, 5, textWrapObstacles(text, [triangle]))[0].width > 80);
  const rotated = picture({ transform: { ...picture().transform, rotation: 45 } });
  const slots = availableLineSlots(0, 200, 40, 10, textWrapObstacles(text, [rotated]));
  assert.ok(slots[0].width < 72);
  const rotatedFrame = frame({ transform: { ...text.transform, rotation: 90 } });
  assert.ok(textWrapObstacles(rotatedFrame, [picture()]).every(o => o.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))));
});

test('rich text, paragraph breaks, Unicode and grapheme clusters survive narrow wraps', () => {
  const runs = parseFlowText('<p>un<strong>break</strong>able &amp; <em>italic</em></p><p><u>అక్షరం</u> हिंदी 👩‍🔬 é</p>');
  assert.equal(runs.map(r => r.text).join(''), 'unbreakable & italic\nఅక్షరం हिंदी 👩‍🔬 é');
  assert.ok(runs.some(r => r.text === 'break' && r.style.bold));
  assert.ok(runs.some(r => r.text === 'italic' && r.style.italic));
  const text = frame({ content: { text: '👩‍🔬'.repeat(20) + '<br>' + 'అక్షరం'.repeat(20) } });
  const layout = flow(text, [picture()]);
  assert.equal(compact(layout), parseFlowText(text.content.text).map(r => r.text).join('').replace(/\s/g, ''));
  for (const f of layout.fragments) assert.ok(!f.runs.some(r => /[\ud800-\udbff]$/.test(r.text)));
  const joinedWord = frame({ content: { text: 'un<strong>break</strong>able next' } });
  const result = flow(joinedWord, []);
  assert.equal(result.fragments.length, 1);
  assert.equal(compact(result), 'unbreakablenext');
});

test('padding and two columns position text within bounds and avoid images in either column', () => {
  const text = frame({ columnCount: 2, columnGapPt: 20, style: { fontSize: 10, lineHeight: 1, padding: { left: 5, right: 5, top: 4, bottom: 4 } } });
  const image = picture({ transform: { ...picture().transform, x: 120 } });
  const layout = flow(text, [image]);
  assert.ok(layout.fragments.some(f => f.x >= 110));
  for (const f of layout.fragments) {
    assert.ok(f.x >= 5 && f.x + f.width <= 195.001);
    assert.ok(f.y >= 4 && f.y + layout.lineHeight <= 296.001);
    if (f.y < 88 && f.y + layout.lineHeight > 22) assert.ok(f.x + f.width <= 112.001 || f.x >= 168);
  }
});

test('a narrow right strip waits for the next wider line instead of splitting normal words', () => {
  const text = frame({ content: { text: '1234567890 wideword widerword finish' }, transform: { ...frame().transform, width: 100 } });
  const image = picture({ transform: { x: 60, y: 0, width: 30, height: 40, rotation: 0, zIndex: 2 }, textWrap: { mode: 'square', offsetPt: 0 } });
  const layout = flow(text, [image]);
  assert.equal(layout.oversetChars, 0);
  assert.ok(layout.fragments.some(f => f.runs.some(r => r.text === 'wideword')));
  assert.ok(layout.fragments.some(f => f.runs.some(r => r.text === 'widerword')));
  assert.equal(compact(layout), text.content.text.replace(/\s/g, ''));
});

test('overset remains stored and is blocked from print; scene line positions match native export', () => {
  const text = frame({ transform: { ...frame().transform, height: 20 } }), image = picture();
  const original = text.content.text;
  assert.ok(flow(text, [image]).oversetChars > 0);
  assert.equal(text.content.text, original);
  const book = { title: 'Wrap test', chapters: [], margins: { topPt: 36, bottomPt: 36, insidePt: 36, outsidePt: 36 }, pages: [{ id: 'p', pageIndex: 0, displayNumber: '1', elementIds: ['text', 'image'] }], dimensions: { widthPt: 200, heightPt: 300 } };
  assert.throws(() => collectPrintPages(book, { text, image }), /need more space/);
  const full = frame({ content: { text: '<strong>Wrapped</strong> paragraph '.repeat(5) } });
  const scene = textFlowScene(full, [full, image]);
  assert.deepEqual(publicationSceneForElement(full, [full, image]), scene);
  const pages = collectPrintPages({ ...book, pages: [{ ...book.pages[0], elementIds: ['text'] }] }, { text: full, image });
  const html = buildPrintHtml(book, embedFooterFixture(pages), '');
  assert.ok(html.includes('font-weight="700"'));
  assert.ok(html.includes('textLength='));
  assert.ok(!html.includes('&lt;strong&gt;'));
});

test('a drag stays one undo entry and undo/redo restore wrap geometry', () => {
  const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
  const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
  const store = useEditorStore.getState(), page = store.getActivePage();
  const text = frame({ id: 'wrap-history-text', pageId: page.id });
  const image = picture({ id: 'wrap-history-image', pageId: page.id });
  store.insertPublicationElement(text); store.insertPublicationElement(image);
  const before = useEditorStore.getState().elements[image.id];
  const oldLayout = flow(text, [before]);
  const history = useHistoryStore.getState().past.length;
  for (let x = 85; x <= 150; x += 5) store.updateElementTransform(image.id, { x }, false);
  assert.equal(useHistoryStore.getState().past.length, history);
  store.commitTransformGesture([before]);
  assert.equal(useHistoryStore.getState().past.length, history + 1);
  const newLayout = flow(text, [useEditorStore.getState().elements[image.id]]);
  assert.notDeepEqual(newLayout, oldLayout);
  useHistoryStore.getState().undo();
  assert.deepEqual(flow(text, [useEditorStore.getState().elements[image.id]]), oldLayout);
  useHistoryStore.getState().redo();
  assert.deepEqual(flow(text, [useEditorStore.getState().elements[image.id]]), newLayout);
  assert.equal(useEditorStore.getState().elements[text.id].content.text, text.content.text);
});

test('text frame on page with detached decorative/primitive elements flows across full width without narrow column squeezing', () => {
  const textFrame = frame({
    id: 'user-text-frame',
    transform: { x: 50, y: 40, width: 189, height: 61, rotation: 0, zIndex: 4 },
    style: { fontSize: 10.5, lineHeight: 1.5, padding: { top: 4, right: 4, bottom: 4, left: 4 } },
    content: {
      text: 'Double-click to type formatted academic curriculum content. Text flows naturally within the bounding frame with full typographical kerning and leading controls.',
    },
  });

  // Simulated detached elements from Learning Goals / decomposed smart block
  const detachedRect = picture({
    id: 'detached-rect',
    type: 'shape',
    category: 'decorative',
    transform: { x: 61, y: 58, width: 230, height: 34, rotation: 0, zIndex: 3 },
    content: { publicationPrimitive: { width: 230, height: 34, nodes: [] } },
  });
  const detachedEllipse = picture({
    id: 'detached-ellipse',
    type: 'shape',
    category: 'decorative',
    transform: { x: 66, y: 63, width: 24, height: 24, rotation: 0, zIndex: 4 },
    content: { publicationPrimitive: { width: 24, height: 24, nodes: [] } },
  });
  const detachedLabel = {
    ...frame({
      id: 'detached-text-1',
      transform: { x: 97, y: 67, width: 50, height: 17, rotation: 0, zIndex: 8 },
      content: { text: 'Learning', publicationPrimitive: { width: 50, height: 17, nodes: [] } },
    }),
  };
  const detachedHigherPath = picture({
    id: 'detached-path',
    type: 'shape',
    category: 'decorative',
    transform: { x: 67, y: 64, width: 18, height: 18, rotation: 0, zIndex: 17 },
    content: { publicationPrimitive: { width: 18, height: 18, nodes: [] } },
  });

  const obstacles = textWrapObstacles(textFrame, [detachedRect, detachedEllipse, detachedLabel, detachedHigherPath]);
  assert.equal(obstacles.length, 0, 'Detached primitive/decorative elements should not be obstacles');

  const layout = layoutTextFlow(textFrame, obstacles);
  // Full width line should be ~181pt (189 - 4 - 4), not squeezed into a ~35pt sliver
  assert.ok(layout.fragments.length >= 3, 'Should have multiple lines of text');
  assert.equal(layout.fragments[0].x, 4, 'Line 1 starts at left padding');
  assert.ok(layout.fragments[0].width >= 180, 'Line 1 spans full width');
  assert.ok(layout.fragments[0].runs.map(r => r.text).join('').startsWith('Double-click'), 'Double-click is not broken into narrow slivers');
});

