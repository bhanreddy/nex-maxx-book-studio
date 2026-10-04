import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { withBlockTransform } = require('../src/editor/core/blockResize.ts');
const { elementLayoutFrame } = require('../src/editor/core/elementResize.ts');
const { EDUCATIONAL_BLOCK_REGISTRY, createSmartBlockInstance } = require('../src/editor/educational/blockRegistry.ts');
const { ELEMENT_PRESETS } = require('../src/editor/registry/presets.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { layoutTextFlow } = require('../src/editor/layoutPartner/textWrapLayout.ts');
const { transformGroupChildren } = require('../src/editor/core/elementGroups.ts');
const { getMathTemplate } = require('../src/editor/math/mathRegistry.ts');
const { mathRenderFrame } = require('../src/editor/math/mathEditableTree.tsx');
const { shapeToPublicationSceneNodes } = require('../src/editor/vector/shapeEffects.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
function fixture(type, content = {}, style = {}) {
  return { id: 'resize-fixture', pageId: 'page', type, content, style, transform: { x: 40, y: 60, width: 400, height: 180, rotation: 0, zIndex: 1 }, locked: false, hidden: false };
}
const close = (a, b, label) => assert.ok(Math.abs(a - b) < .0001, `${label}: ${a} vs ${b}`);

test('every publishing and curriculum block reflows width and fits both smaller and larger heights', () => {
  for (const id of Object.keys(EDUCATIONAL_BLOCK_REGISTRY)) {
    const block = createSmartBlockInstance(id, 'page');
    let el = { ...fixture('smart-block'), smartBlockData: block, transform: { ...block.transform } };
    const content = structuredClone(block.semanticContent);
    for (const width of [535, 300, 640]) {
      el = withBlockTransform(el, { ...el.transform, width });
      const frame = el.smartBlockData.styleOverrides.resizeFrame, scene = buildPublicationScene(el.smartBlockData);
      close(scene.width, frame.width, id);
      close(el.transform.width, width, id);
      close(el.transform.width / frame.width, el.transform.height / frame.height, id);
      assert.ok(scene.height <= frame.height + .0001, id);
      assert.deepEqual(el.smartBlockData.semanticContent, content, id);
    }
    const originalHeight = el.transform.height;
    for (const height of [originalHeight * .5, originalHeight * 1.5, originalHeight * .75]) {
      el = withBlockTransform(el, { ...el.transform, height });
      const frame = el.smartBlockData.styleOverrides.resizeFrame, scene = buildPublicationScene(el.smartBlockData);
      close(el.transform.width, 640, id); close(el.transform.height, height, id);
      close(scene.width, frame.width, id);
      close(el.transform.width / frame.width, el.transform.height / frame.height, `${id}: proportional text`);
      assert.ok(scene.height <= frame.height + .0001, `${id}: no clipping`);
      assert.deepEqual(el.smartBlockData.semanticContent, content, id);
    }
  }
});

test('native headings and paragraphs rewrap without rewriting text, then resize fonts independently of width', () => {
  for (const type of ['heading', 'subheading', 'body', 'body-text', 'quote', 'caption', 'callout']) {
    const el = fixture(type, { text: 'Observe how plants use sunlight and water to make their own food. Write your answer in a complete sentence.' }, { fontSize: 16, lineHeight: 1.4 });
    const narrow = withBlockTransform(el, { ...el.transform, width: 180 });
    const wide = withBlockTransform(narrow, { ...narrow.transform, width: 600 });
    assert.ok(wide.transform.height < narrow.transform.height, type);
    assert.equal(wide.style.fontSize, 16, type);
    const compact = withBlockTransform(wide, { ...wide.transform, height: wide.transform.height / 2 });
    const tall = withBlockTransform(compact, { ...compact.transform, height: wide.transform.height * 1.5 });
    assert.equal(compact.transform.width, 600, type); assert.equal(tall.transform.width, 600, type);
    assert.ok(compact.style.fontSize < 16, type); assert.ok(tall.style.fontSize > compact.style.fontSize, type);
    assert.equal(layoutTextFlow(compact, []).oversetChars, 0, type);
    assert.equal(layoutTextFlow(tall, []).oversetChars, 0, type);
    assert.deepEqual(tall.content, el.content, type);
  }
});

test('all existing element preset types use independent sizing without corrupting authored content', () => {
  const seen = new Set();
  for (const preset of Object.values(ELEMENT_PRESETS)) {
    if (seen.has(preset.type)) continue;
    seen.add(preset.type);
    let el = { ...fixture(preset.type, structuredClone(preset.defaultContent), structuredClone(preset.defaultStyle)), transform: { ...fixture(preset.type).transform, ...preset.defaultTransform } };
    const content = structuredClone(el.content);
    for (const width of [600, 300, 535]) {
      el = withBlockTransform(el, { ...el.transform, width });
      assert.equal(el.transform.width, width, preset.type);
      assert.ok(Number.isFinite(el.transform.height) && el.transform.height > 0, preset.type);
      if (el.responsiveLayout) close(elementLayoutFrame(el).width * elementLayoutFrame(el).scale, width, preset.type);
    }
    for (const height of [100, 360, 80]) {
      el = withBlockTransform(el, { ...el.transform, height });
      assert.equal(el.transform.width, 535, preset.type); assert.equal(el.transform.height, height, preset.type);
      assert.deepEqual(el.content, content, preset.type);
      if (el.responsiveLayout) close(elementLayoutFrame(el).height * elementLayoutFrame(el).scale, height, preset.type);
    }
  }
  assert.ok(seen.size >= 20);
});

test('vectors resize their path and editable control handles along each axis', () => {
  const el = { ...fixture('vector-curve', {}, { pathData: 'M 0 0 C 20 30 80 60 100 100' }), curveData: { closed: false, nodes: [{ id: 'node', type: 'smooth', x: 20, y: 30, handleIn: { x: -5, y: -10 }, handleOut: { x: 5, y: 10 } }] } };
  const wide = withBlockTransform(el, { ...el.transform, width: 800 });
  assert.equal(wide.style.pathData, 'M 0 0 C 40 30 160 60 200 100');
  const short = withBlockTransform(wide, { ...wide.transform, height: 90 });
  assert.equal(short.transform.width, 800);
  assert.equal(short.style.pathData, 'M 0 0 C 40 15 160 30 200 50');
  assert.deepEqual(short.curveData.nodes[0].handleOut, { x: 10, y: 5 });
});

test('shape labels and image captions change reading size while their widths remain fixed', () => {
  const shape = fixture('shape', {}, { shapeText: { text: 'What did you observe?', fontSize: 16 } });
  const short = withBlockTransform(shape, { ...shape.transform, height: 90 });
  const tall = withBlockTransform(short, { ...short.transform, height: 360 });
  assert.equal(short.transform.width, 400); assert.equal(tall.transform.width, 400);
  assert.ok(short.style.shapeText.fontSize < 16); assert.ok(tall.style.shapeText.fontSize > 16);
  const image = fixture('image', { src: 'data:image/png;base64,test', caption: 'Plant cell' });
  const resized = withBlockTransform(image, { ...image.transform, height: 90 });
  assert.equal(resized.transform.width, 400); assert.equal(resized.style.fontSize, 3.75);
  assert.deepEqual(resized.content, image.content);
});

test('reducing a frame with spare whitespace never enlarges its reading size', () => {
  const table = fixture('table', { rows: [['Name', 'Value']] }, { fontSize: 12 });
  const compactTable = withBlockTransform(table, { ...table.transform, height: 90 });
  assert.ok(compactTable.responsiveLayout.scale <= .5);
  assert.equal(compactTable.transform.width, 400);
  const template = getMathTemplate('premium-question-answer');
  const math = fixture('math-component', { mathTemplateId: template.id, mathData: structuredClone(template.defaultData), mathAppearance: { resizeMode: 'reflow' } });
  math.transform.height = template.measureHeight(math.content.mathData, 400) * 3;
  const short = withBlockTransform(math, { ...math.transform, height: math.transform.height / 2 });
  assert.equal(short.transform.width, 400);
  assert.ok(mathRenderFrame(template, 400, short.transform.height, short.content.mathAppearance, short.content.mathData).scaleY <= .5);
});

test('shape labels export the same wrapped lines and reading size as the resized frame', () => {
  const shape = fixture('shape', {}, { shapeText: { text: 'Explain how sunlight helps plants grow and produce food.', fontSize: 16, padding: 10 } });
  const narrow = withBlockTransform(shape, { ...shape.transform, width: 120, height: 100 });
  const node = shapeToPublicationSceneNodes('rectangle', narrow.transform.width, narrow.transform.height, narrow.style).find(node => node.kind === 'text');
  assert.ok(node.lines.length > 1);
  assert.equal(node.size, narrow.style.shapeText.fontSize);
  assert.equal(node.wrapWidth, 100);
  assert.ok(node.lines.length * node.lineHeight <= 80);
});

test('groups pass width reflow and height fitting through to their children', () => {
  const child = fixture('heading', { text: 'A heading inside a group' }, { fontSize: 18 });
  const group = { ...fixture('group'), id: 'group', childElementIds: [child.id] };
  const narrow = transformGroupChildren(group, { ...group.transform, width: 200 }, { [child.id]: child }, 'auto')[child.id];
  assert.equal(narrow.transform.width, 200); assert.equal(narrow.style.fontSize, 18);
  const short = transformGroupChildren(group, { ...group.transform, height: 90 }, { [child.id]: child }, 'auto')[child.id];
  assert.equal(short.transform.width, 400); assert.ok(short.style.fontSize < 18);
});

test('both store resize entry points record inner typography and frame changes in one undo action', () => {
  const saved = store.getState(), book = structuredClone(saved.getActiveBook());
  const el = fixture('heading', { text: 'Editable heading' }, { fontSize: 18 });
  el.pageId = book.pages[0].id; book.pages[0].elementIds = [el.id];
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: { [el.id]: el }, saveToStorage() {} }); history.getState().clearHistory();
  try {
    store.getState().updateElementTransform(el.id, { height: 90 }, true);
    const short = structuredClone(store.getState().elements[el.id]);
    assert.equal(short.transform.width, 400); assert.ok(short.style.fontSize < 18);
    history.getState().undo(); assert.deepEqual(store.getState().elements[el.id], el);
    history.getState().redo(); assert.deepEqual(store.getState().elements[el.id], short);
    store.getState().updateElement(el.id, { transform: { ...short.transform, height: 360 } }, true);
    assert.ok(store.getState().elements[el.id].style.fontSize > short.style.fontSize);
    history.getState().undo(); assert.deepEqual(store.getState().elements[el.id], short);
  } finally { store.setState(saved); history.getState().clearHistory(); }
});
