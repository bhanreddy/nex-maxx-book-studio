import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, file) =>
    module._compile(
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      file
    );
}

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { getAllMathTemplates, getMathTemplate, searchMathTemplates } = require('../src/editor/math/mathRegistry.ts');
const { buildEditableMathTree, mathRenderFrame } = require('../src/editor/math/mathEditableTree.tsx');
const { editableMathFields } = require('../src/editor/math/MathDataFields.tsx');
const { insertMathComponent } = require('../src/editor/math/mathActions.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');

const props = (template, mode = 'teacher', styleVariant = 'color-coded') => ({ data: template.defaultData, mode, styleVariant, width: template.defaultWidth, height: template.defaultHeight });

test('every built-in template renders with editable text and stable, unique part IDs in every answer mode and style', () => {
  for (const template of getAllMathTemplates()) for (const mode of ['teacher', 'student']) for (const variant of template.styleVariants) {
    const rendered = buildEditableMathTree(template, props(template, mode, variant));
    assert.equal(rendered.parts.length, new Set(rendered.parts.map(p => p.id)).size, `${template.id}: duplicate part IDs`);
    assert.ok(rendered.parts.some(p => p.text !== undefined), template.id);
    const markup = renderToStaticMarkup(rendered.tree);
    assert.ok(!markup.includes('NaN'), `${template.id}: invalid geometry`);
    assert.deepEqual(rendered.parts.map(p => p.id), buildEditableMathTree(template, props(template, mode, variant)).parts.map(p => p.id));
  }
});

test('direct caption edits preserve the SVG geometry and reset when calculated values change', () => {
  const template = getMathTemplate('math-number-bond');
  const original = buildEditableMathTree(template, props(template));
  const caption = original.parts.find(p => p.source === 'Number Bond');
  const override = { [caption.id]: { text: 'Make ten together', source: caption.source, fontSize: 18, color: '#123456' } };
  const edited = buildEditableMathTree(template, props(template), { overrides: override });
  assert.ok(renderToStaticMarkup(edited.tree).includes('Make ten together'));
  assert.ok(renderToStaticMarkup(edited.tree).includes('font-size:18px'));
  assert.equal(edited.parts.filter(p => p.svg && p.text === undefined).length, original.parts.filter(p => p.svg && p.text === undefined).length);
  const whole = original.parts.find(p => p.svg && p.source === String(template.defaultData.whole));
  const operandOverride = { [whole.id]: { source: whole.source, text: 'My whole' } };
  assert.ok(renderToStaticMarkup(buildEditableMathTree(template, props(template), { overrides: operandOverride }).tree).includes('My whole'));
  const changed = { ...props(template), data: { ...template.defaultData, whole: 15 } };
  assert.ok(!renderToStaticMarkup(buildEditableMathTree(template, changed, { overrides: operandOverride }).tree).includes('My whole'));
});

test('uniform scaling centres content and preserves aspect ratio; stretch mode is an explicit opt-in', () => {
  const template = getMathTemplate('math-abacus');
  // Default "scale" mode: uniform scale = min(scaleX, scaleY), content centred
  const scaled = mathRenderFrame(template, 760, 80);
  assert.equal(scaled.renderWidth, 380); assert.equal(scaled.renderHeight, 160);
  assert.equal(scaled.scaleX, scaled.scaleY, 'uniform: scaleX must equal scaleY');
  assert.equal(scaled.scaleX, .5); // min(760/380, 80/160) = min(2, 0.5) = 0.5
  assert.equal(scaled.offsetX, 285); // (760 - 380*0.5) / 2
  assert.equal(scaled.offsetY, 0);   // (80 - 160*0.5) / 2
  // Explicit stretch mode: independent axes (old default)
  const stretched = mathRenderFrame(template, 760, 80, { resizeMode: 'stretch' });
  assert.equal(stretched.scaleX, 2); assert.equal(stretched.scaleY, .5);
  assert.equal(stretched.offsetX, 0); assert.equal(stretched.offsetY, 0);
  // Reflow mode: no scaling, adapts to available space
  const flowed = mathRenderFrame(template, 760, 320, { resizeMode: 'reflow', padding: 12 });
  assert.equal(flowed.renderWidth, 736); assert.equal(flowed.renderHeight, 296);
  assert.equal(flowed.scaleX, 1); assert.equal(flowed.scaleY, 1);
  assert.equal(flowed.offsetX, 0); assert.equal(flowed.offsetY, 0);
});

test('all stored data fields, including MCQ options, bill items and graph labels, have inspector controls', () => {
  for (const id of ['math-choose-correct-answer', 'math-shopping-bill', 'math-bar-graph']) {
    const template = getMathTemplate(id); assert.ok(template, id);
    const fields = editableMathFields(template, template.defaultData);
    for (const key of Object.keys(template.defaultData)) assert.ok(fields.some(f => f.key === key), `${id}: ${key} missing`);
    assert.equal(fields.length, new Set(fields.map(f => f.key)).size);
  }
});

test('20 new primary templates cover every class with appropriate practice and teacher/student outputs', () => {
  const all = getAllMathTemplates(); assert.ok(all.length >= 80);
  for (let grade = 1; grade <= 5; grade++) {
    assert.ok(searchMathTemplates({ grade }).some(t => t.id === `math-daily-practice-${grade}`));
    const template = getMathTemplate(`math-daily-practice-${grade}`);
    const teacher = renderToStaticMarkup(buildEditableMathTree(template, props(template)).tree);
    const student = renderToStaticMarkup(buildEditableMathTree(template, props(template, 'student')).tree);
    assert.ok(student.includes('_____')); assert.notEqual(teacher, student);
  }
  const template = getMathTemplate('math-ten-frame');
  const zero = renderToStaticMarkup(buildEditableMathTree(template, { ...props(template), data: { ...template.defaultData, count: 0 } }).tree);
  assert.ok(!zero.includes('<circle')); assert.ok(zero.includes('How many counters? 0'));
});

test('custom template insertion preserves content, styling, sizing and modes through undo/redo', () => {
  const book = structuredClone(store.getState().getActiveBook()), page = book.pages[0];
  page.elementIds = []; store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: {}, selectedElementIds: [], saveToStorage: () => {} });
  history.getState().clearHistory();
  const settings = { width: 456, height: 264, mode: 'student', styleVariant: 'clean', appearance: { fontScale: 1.2, padding: 8 }, overrides: { root: { borderColor: '#123456' } } };
  const id = insertMathComponent('math-ten-frame', 40, 80, { count: 3 }, settings);
  const el = structuredClone(store.getState().elements[id]);
  assert.equal(el.transform.width, 456); assert.equal(el.transform.height, 264);
  assert.equal(el.content.mathData.count, 3); assert.equal(el.content.mathData.kind, 'ten-frame');
  assert.equal(el.content.mathMode, 'student'); assert.equal(el.content.styleVariant, 'clean');
  assert.deepEqual(el.content.mathOverrides, settings.overrides); assert.deepEqual(el.content.mathAppearance, settings.appearance);
  history.getState().undo(); assert.equal(store.getState().elements[id], undefined); assert.deepEqual(store.getState().books[0].pages[0].elementIds, []);
  history.getState().redo(); assert.deepEqual(store.getState().elements[id], el); assert.deepEqual(store.getState().books[0].pages[0].elementIds, [id]);
  store.getState().updateElementContent(id, { mathOverrides: { root: { text: 'Edited title', source: 'Original' } } });
  history.getState().undo(); assert.deepEqual(store.getState().elements[id].content.mathOverrides, settings.overrides);
});

test('requested digit counts hold at both random-range endpoints', () => {
  const { generateSimilarQuestion } = require('../src/editor/math/mathAlgorithms.ts');
  const originalRandom = Math.random;
  try {
    for (const value of [0, .999999]) {
      Math.random = () => value;
      for (const topic of ['addition', 'subtraction']) {
        const result = generateSimilarQuestion(topic, { digitCount: 3 });
        assert.ok(result.num1 >= 100 && result.num1 <= 999);
        assert.ok(result.num2 >= 100 && result.num2 <= 999);
      }
    }
  } finally { Math.random = originalRandom; }
});

test('cleared item collections retain their original item schema for adding new entries', () => {
  const template = getMathTemplate('math-shopping-bill');
  const original = template.defaultData.items;
  assert.ok(original?.length);
  const field = editableMathFields(template, { ...template.defaultData, items: [] }).find(f => f.key === 'items');
  assert.deepEqual(field.defaultValue, original);
});
