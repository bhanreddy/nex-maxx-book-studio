import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require('react-dom/server');
const { getAllMathTemplates, getMathTemplate } = require('../src/editor/math/mathRegistry.ts');
const { READY_MADE_MATH_TEMPLATES } = require('../src/editor/math/templates/worksheetTemplates.tsx');
const { buildEditableMathTree, mathRenderFrame } = require('../src/editor/math/mathEditableTree.tsx');
const { withBlockTransform } = require('../src/editor/core/blockResize.ts');
const { transformGroupChildren } = require('../src/editor/core/elementGroups.ts');
const { insertMathComponent, updateMathPartText } = require('../src/editor/math/mathActions.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
function fixture(t, width = t.defaultWidth, height = t.defaultHeight, appearance = {}) {
  return { id: 'responsive-math', pageId: 'page', type: 'math-component', content: { mathTemplateId: t.id, mathData: structuredClone(t.defaultData), mathAppearance: appearance, mathMode: 'teacher' }, transform: { x: 40, y: 60, width, height, rotation: 0, zIndex: 1 }, style: {}, locked: false, hidden: false };
}
function layout(el) {
  const t = getMathTemplate(el.content.mathTemplateId), frame = mathRenderFrame(t, el.transform.width, el.transform.height, el.content.mathAppearance, el.content.mathData);
  const rendered = buildEditableMathTree(t, { data: el.content.mathData, width: frame.renderWidth, height: frame.renderHeight, mode: el.content.mathMode, styleVariant: 'color-coded' }, { overrides: el.content.mathOverrides });
  return { frame, ...rendered };
}
function isolated(work) {
  const saved = store.getState(), book = structuredClone(saved.getActiveBook()); book.pages[0].elementIds = [];
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: {}, selectedElementIds: [], saveToStorage: () => {} }); history.getState().clearHistory();
  try { work(); } finally { store.setState(saved); history.getState().clearHistory(); }
}

test('every ready-made exercise fills its width and fits its intrinsic height on repeated resizing', () => isolated(() => {
  for (const t of READY_MADE_MATH_TEMPLATES) {
    const id = insertMathComponent(t.id, 40, 60, undefined, { width: 300 });
    const narrow = structuredClone(store.getState().elements[id]);
    assert.equal(narrow.content.mathAppearance.resizeMode, 'reflow', t.id);
    assert.equal(narrow.transform.height, t.measureHeight(narrow.content.mathData, 300), t.id);
    for (const width of [600, 360, 720, 300]) {
      store.getState().updateElementTransform(id, { width }, true);
      const el = store.getState().elements[id], { frame, tree } = layout(el);
      assert.equal(frame.renderWidth, width, t.id); assert.equal(frame.scaleX, 1); assert.equal(frame.scaleY, 1);
      assert.equal(frame.offsetX, 0); assert.equal(el.transform.height, t.measureHeight(el.content.mathData, width), t.id);
      assert.deepEqual(el.content.mathData, narrow.content.mathData, t.id);
      assert.ok(!/NaN|Infinity/.test(renderToStaticMarkup(tree)), t.id);
    }
    assert.deepEqual(store.getState().elements[id], narrow);
  }
}));

test('the screenshot frame reflows existing scaled Q&A without changing its reading size', () => {
  const t = getMathTemplate('premium-question-answer'), old = fixture(t, 535, 308, { resizeMode: 'scale' }), oldFrame = layout(old).frame;
  const resized = withBlockTransform(old, { ...old.transform, width: 600 });
  const after = layout(resized);
  assert.equal(after.frame.renderWidth * after.frame.scaleX, 600);
  assert.equal(after.frame.scaleX, oldFrame.scaleX); assert.equal(after.frame.scaleY, oldFrame.scaleY);
  assert.equal(after.frame.offsetX, 0); assert.equal(after.frame.offsetY, 0);
  assert.equal(after.parts.filter(p => p.id.endsWith('/ktitle-0')).length, 1);
  assert.ok(after.parts.some(p => p.text === t.defaultData.title));
  const narrow = withBlockTransform(resized, { ...resized.transform, width: 250 });
  assert.ok(narrow.transform.height > resized.transform.height);
  assert.equal(layout(narrow).frame.scaleY, oldFrame.scaleY);
});

test('all Maths Studio blocks can use the shared width reflow path and HTML roots use the full frame', () => {
  for (const t of getAllMathTemplates()) {
    const el = fixture(t, t.defaultWidth, t.measureHeight?.(t.defaultData, t.defaultWidth) || t.defaultHeight);
    const resized = withBlockTransform(el, { ...el.transform, width: t.defaultWidth + 200 });
    const { frame, tree } = layout(resized);
    assert.equal(frame.renderWidth * frame.scaleX, resized.transform.width, t.id);
    assert.equal(frame.offsetX, 0, t.id);
    const output = renderToStaticMarkup(tree);
    assert.ok(!/NaN|Infinity/.test(output), t.id);
    if (output.startsWith('<div') && /style="[^\"]*width:/.test(output)) assert.match(output, /style="[^\"]*width:100%/, t.id);
  }
});

test('authored wrapped titles and answers survive resizing and undo restores the entire frame', () => isolated(() => {
  for (const templateId of ['premium-question-answer', 'worksheet-plain-question-answer']) {
    const id = insertMathComponent(templateId, 40, 60, undefined, { width: 300 });
    let el = store.getState().elements[id], parts = layout(el).parts;
    const title = parts.find(p => p.binding?.path.length === 1 && p.binding.path[0] === 'title');
    updateMathPartText(id, title, 'Edited heading');
    el = store.getState().elements[id]; parts = layout(el).parts;
    const answer = parts.find(p => p.binding?.path[0] === 'questions' && p.binding.path[2] === 'answer');
    updateMathPartText(id, answer, 'Edited answer');
    const edited = structuredClone(store.getState().elements[id]);
    store.getState().updateElementTransform(id, { width: 720 }, true);
    const wide = structuredClone(store.getState().elements[id]);
    assert.ok(layout(wide).parts.some(p => p.text?.includes('Edited heading')));
    assert.ok(layout(wide).parts.some(p => p.text?.includes('Edited answer')));
    history.getState().undo(); assert.deepEqual(store.getState().elements[id], edited);
    history.getState().redo(); assert.deepEqual(store.getState().elements[id], wide);
  }
}));

test('legacy per-line edits migrate into authored text with their design overrides preserved', () => {
  const t = getMathTemplate('premium-question-answer'), el = fixture(t, 350, t.measureHeight(t.defaultData, 350), { resizeMode: 'reflow' });
  const title = layout(el).parts.find(p => p.binding?.path[0] === 'title');
  el.content.mathOverrides = { [title.id]: { source: title.source, text: 'My edited heading', color: '#123456' } };
  const wide = withBlockTransform(el, { ...el.transform, width: 720 });
  assert.ok(wide.content.mathData.title.startsWith('My edited heading'));
  assert.equal(wide.content.mathOverrides[title.id].color, '#123456');
  assert.equal(wide.content.mathOverrides[title.id].text, undefined);
  assert.ok(layout(wide).parts.some(p => p.text?.includes('My edited heading')));
});

test('Shift and group scaling preserve the current reflow layout; explicit scale remains available', () => {
  const t = getMathTemplate('premium-question-answer'), el = fixture(t, 600, t.measureHeight(t.defaultData, 600), { resizeMode: 'reflow' });
  const before = layout(el);
  const scaled = withBlockTransform(el, { ...el.transform, width: 300, height: el.transform.height / 2 }, 'scale');
  assert.equal(layout(scaled).frame.renderWidth, before.frame.renderWidth);
  assert.equal(layout(scaled).frame.scaleY, .5);
  const group = { id: 'group', transform: { ...el.transform }, childElementIds: [el.id] };
  const child = transformGroupChildren(group, { ...group.transform, width: 300, height: group.transform.height / 2 }, { [el.id]: el })[el.id];
  assert.deepEqual(layout(child).parts.map(p => p.text), before.parts.map(p => p.text));
  assert.equal(layout(child).frame.scaleX, .5);
  const locked = fixture(t, 460, t.defaultHeight, { resizeMode: 'scale', resizeModeLocked: true });
  assert.equal(layout(withBlockTransform(locked, { ...locked.transform, width: 720 })).frame.renderWidth, 460);
});

test('narrow choice, true/false and ordering layouts rearrange their controls into available width', () => {
  for (const id of ['premium-multiple-choice', 'premium-true-false', 'worksheet-descending-stairs']) {
    const t = getMathTemplate(id), el = withBlockTransform(fixture(t), { ...fixture(t).transform, width: 300 });
    const output = renderToStaticMarkup(layout(el).tree);
    for (const tag of output.matchAll(/<rect\b([^>]*)>/g)) {
      const x = Number(tag[1].match(/\bx="([^\"]+)"/)?.[1] || 0), width = Number(tag[1].match(/\bwidth="([^\"]+)"/)?.[1] || 0);
      assert.ok(x + width <= 300 + .01, `${id}: ${x} + ${width}`);
    }
    assert.ok(el.transform.height >= t.measureHeight(el.content.mathData, 300));
  }
});

test('matching, choice and blank text edits change the correct canonical answer or prompt', () => isolated(() => {
  for (const [templateId, marker, fieldPath] of [
    ['premium-match-following', '/kright-text-', ['questions', 2, 'answer']],
    ['premium-multiple-choice', '/kchoice-text-', ['questions', 0, 'choices', 0]],
    ['premium-fill-blanks', '/kinline-0/', ['questions', 0, 'prompt']],
  ]) {
    const id = insertMathComponent(templateId, 40, 60, undefined, { width: 300, mode: 'teacher' });
    const part = layout(store.getState().elements[id]).parts.find(p => p.id.includes(marker) && p.binding);
    assert.deepEqual(part.binding.path, fieldPath);
    updateMathPartText(id, part, 'Edited content');
    store.getState().updateElementTransform(id, { width: 720 }, true);
    const el = store.getState().elements[id];
    assert.ok(fieldPath.reduce((value, key) => value[key], el.content.mathData).includes('Edited content'));
    assert.ok(layout(el).parts.some(p => p.text?.includes('Edited')));
  }
}));

test('proportional resizing also retains deliberately added height in the captured layout', () => {
  const t = getMathTemplate('premium-question-answer'), el = fixture(t, 600, t.measureHeight(t.defaultData, 600) + 200, { resizeMode: 'reflow' });
  const next = withBlockTransform(el, { ...el.transform, width: 300, height: el.transform.height / 2 }, 'scale');
  assert.equal(layout(next).frame.renderHeight, layout(el).frame.renderHeight);
  assert.equal(layout(next).frame.scaleY, .5);
});

test('rotated top-corner reflow keeps the opposite corner fixed when content changes height', () => {
  const { calculateRotatedResize, rotatePoint, getTransformHandles } = require('../src/editor/core/geometry.ts');
  const t = getMathTemplate('premium-question-answer');
  for (const rotation of [0, 30, 90, 225]) {
    const el = fixture(t, 460, t.defaultHeight, { resizeMode: 'reflow' }); el.transform.rotation = rotation;
    const delta = rotatePoint(-120, 0, 0, 0, rotation);
    const requested = calculateRotatedResize(el.transform, rotation, 'ne', delta.x, delta.y, false, 240, 30);
    const next = withBlockTransform(el, { ...el.transform, ...requested }, 'reflow-bottom');
    const anchor = rect => getTransformHandles(rect, rotation).find(h => h.type === 'sw');
    assert.ok(Math.abs(anchor(next.transform).x - anchor(el.transform).x) < 1e-7);
    assert.ok(Math.abs(anchor(next.transform).y - anchor(el.transform).y) < 1e-7);
  }
});

test('height controls resize reading size uniformly across every ready-made exercise', () => isolated(() => {
  for (const t of READY_MADE_MATH_TEMPLATES) {
    const id = insertMathComponent(t.id, 40, 60, undefined, { width: 535 });
    const original = structuredClone(store.getState().elements[id]);
    const originalScale = layout(original).frame.scaleY;
    for (const [factor, direction] of [[.5, 'smaller'], [1.6, 'larger'], [.75, 'smaller']]) {
      const height = original.transform.height * factor;
      store.getState().updateElementTransform(id, { height }, true);
      const next = store.getState().elements[id], { frame, tree } = layout(next);
      assert.equal(next.transform.height, height, t.id);
      assert.equal(next.transform.width, original.transform.width, t.id);
      assert.equal(frame.scaleX, frame.scaleY, `${t.id}: letters stay in proportion`);
      assert.ok(direction === 'smaller' ? frame.scaleY < originalScale : frame.scaleY > originalScale, t.id);
      assert.ok(Math.abs(frame.renderWidth * frame.scaleX - next.transform.width) < .0001, t.id);
      assert.ok(Math.abs(frame.renderHeight * frame.scaleY - height) < .0001, t.id);
      assert.ok(t.measureHeight(next.content.mathData, frame.renderWidth) * frame.scaleY <= height + .0001, t.id);
      assert.deepEqual(next.content.mathData, original.content.mathData, t.id);
      assert.ok(!/NaN|Infinity/.test(renderToStaticMarkup(tree)), t.id);
    }
  }
}));

test('height then width resizing keeps the chosen reading size and is fully undoable', () => isolated(() => {
  for (const id of ['premium-question-answer', 'worksheet-plain-question-answer']) {
    const elementId = insertMathComponent(id, 40, 60, undefined, { width: 535 });
    const original = structuredClone(store.getState().elements[elementId]);
    store.getState().updateElementTransform(elementId, { height: 220 }, true);
    const compact = structuredClone(store.getState().elements[elementId]);
    assert.equal(compact.transform.height, 220);
    const size = layout(compact).frame.scaleY;
    store.getState().updateElementTransform(elementId, { width: 350 }, true);
    const narrow = structuredClone(store.getState().elements[elementId]);
    assert.equal(layout(narrow).frame.scaleY, size);
    assert.ok(narrow.transform.height + .0001 >= compact.transform.height);
    history.getState().undo(); assert.deepEqual(store.getState().elements[elementId], compact);
    history.getState().undo(); assert.deepEqual(store.getState().elements[elementId], original);
    history.getState().redo(); assert.deepEqual(store.getState().elements[elementId], compact);
  }
}));

test('height fitting supports existing scaled blocks, padding and very small frames without losing authored text', () => {
  const t = getMathTemplate('premium-question-answer');
  const old = fixture(t, 535, 308, { resizeMode: 'scale', padding: 12 });
  for (const height of [64, 180, 600]) {
    const next = withBlockTransform(old, { ...old.transform, height });
    const { frame } = layout(next);
    assert.equal(next.transform.height, height);
    assert.equal(next.content.mathAppearance.resizeMode, 'reflow');
    assert.equal(frame.padding, 12);
    assert.ok(Math.abs(frame.renderWidth * frame.scaleX + 24 - 535) < .0001);
    assert.ok(Math.abs(frame.renderHeight * frame.scaleY + 24 - height) < .0001);
    assert.deepEqual(next.content.mathData, old.content.mathData);
  }
});

test('top and bottom height drags keep the opposite edge fixed, including rotated blocks', () => {
  const { calculateRotatedResize, rotatePoint, getTransformHandles } = require('../src/editor/core/geometry.ts');
  const t = getMathTemplate('premium-question-answer');
  for (const rotation of [0, 30, 90, 225]) for (const handle of ['n', 's', 'ne', 'sw']) {
    const el = fixture(t, 460, t.defaultHeight, { resizeMode: 'reflow' }); el.transform.rotation = rotation;
    const delta = rotatePoint(0, handle.startsWith('n') ? 120 : -120, 0, 0, rotation);
    const requested = calculateRotatedResize(el.transform, rotation, handle, delta.x, delta.y, false, 240, 32);
    const next = withBlockTransform(el, { ...el.transform, ...requested }, handle.startsWith('n') ? 'reflow-bottom' : 'auto');
    const opposite = { n: 's', s: 'n', ne: 'sw', sw: 'ne' }[handle];
    const anchor = rect => getTransformHandles(rect, rotation).find(h => h.type === opposite);
    assert.ok(Math.abs(anchor(next.transform).x - anchor(el.transform).x) < 1e-7, `${rotation} ${handle}`);
    assert.ok(Math.abs(anchor(next.transform).y - anchor(el.transform).y) < 1e-7, `${rotation} ${handle}`);
    assert.equal(next.transform.height, requested.height);
    assert.ok(layout(next).frame.scaleY < 1);
  }
});
