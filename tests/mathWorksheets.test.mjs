import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require('react-dom/server');
const { getMathTemplate, searchMathTemplates } = require('../src/editor/math/mathRegistry.ts');
const { READY_MADE_MATH_TEMPLATES, worksheetLines } = require('../src/editor/math/templates/worksheetTemplates.tsx');
const { buildEditableMathTree, mathRenderFrame } = require('../src/editor/math/mathEditableTree.tsx');
const { editableMathFields } = require('../src/editor/math/MathDataFields.tsx');
const { insertMathComponent, updateMathTemplateData } = require('../src/editor/math/mathActions.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const props = (t, mode = 'teacher', data = t.defaultData) => ({ data, mode, styleVariant: 'color-coded', width: t.defaultWidth, height: t.measureHeight(data, t.defaultWidth) });
const markup = (t, mode = 'teacher', data = t.defaultData) => renderToStaticMarkup(buildEditableMathTree(t, props(t, mode, data)).tree);

test('21 ready-made exercises are discoverable, editable and vector-only', () => {
  assert.equal(READY_MADE_MATH_TEMPLATES.length, 21);
  assert.ok(searchMathTemplates({ query: 'question and answer' }).length >= 13);
  for (const t of READY_MADE_MATH_TEMPLATES) {
    assert.equal(getMathTemplate(t.id), t);
    const fields = editableMathFields(t, t.defaultData);
    for (const key of Object.keys(t.defaultData).filter(k => k !== 'kind')) assert.ok(fields.some(f => f.key === key), `${t.id}: ${key}`);
    for (const mode of ['student', 'teacher']) {
      const rendered = buildEditableMathTree(t, props(t, mode));
      assert.ok(rendered.parts.some(p => p.svg && p.text), t.id);
      assert.equal(new Set(rendered.parts.map(p => p.id)).size, rendered.parts.length);
      const output = renderToStaticMarkup(rendered.tree);
      assert.ok(output.startsWith('<svg'), t.id);
      assert.ok(!/NaN|Infinity|foreignObject|<img/.test(output), t.id);
    }
  }
});

test('student Q&A hides answers and working; solved-example visibility is explicit', () => {
  const t = getMathTemplate('worksheet-worked-solution');
  const student = markup(t, 'student');
  assert.ok(student.includes('623'));
  assert.ok(!student.includes('583'));
  assert.ok(!student.includes('Ones: 6 + 7'));
  const hidden = markup(t, 'student', { ...t.defaultData, showExample: false });
  assert.ok(!hidden.includes('623'));
  assert.ok(!hidden.includes('Ones: 5 + 8'));
  const teacher = markup(t);
  assert.ok(teacher.includes('583')); assert.ok(teacher.includes('Ones: 6 + 7'));
});

test('word wrapping preserves explicit lines and every character of long tokens', () => {
  assert.deepEqual(worksheetLines('first\nsecond', 400, 20), ['first', 'second']);
  const token = 'x'.repeat(90);
  assert.equal(worksheetLines(token, 100, 20).join(''), token);
  assert.ok(worksheetLines('A long word problem with multiple steps and room for an explanation.', 130, 20).length > 4);
});

test('ordering handles five reference numbers, duplicates and numerical sorting', () => {
  const t = getMathTemplate('worksheet-descending-stairs');
  const parts = buildEditableMathTree(t, props(t)).parts;
  const ordered = parts.filter(p => p.id.includes('kordered-')).map(p => p.text);
  assert.deepEqual(ordered, ['59,730', '59,370', '58,700', '57,800', '56,390']);
  const data = { ...t.defaultData, numbers: [2, 10, 2], direction: 'ascending' };
  const sorted = buildEditableMathTree(t, props(t, 'teacher', data)).parts.filter(p => p.id.includes('kordered-')).map(p => p.text);
  assert.deepEqual(sorted, ['2', '2', '10']);
});

test('number-line labels use Indian/international grouping and student values stay hidden', () => {
  const t = getMathTemplate('worksheet-marked-number-line');
  assert.ok(markup(t).includes('1,50,000'));
  assert.ok(!markup(t, 'student').includes('1,50,000'));
  assert.ok(markup(t, 'teacher', { ...t.defaultData, system: 'international' }).includes('150,000'));
});

test('long content and added rows expand intrinsic layout; empty collections still render', () => {
  for (const t of READY_MADE_MATH_TEMPLATES) {
    const data = { ...t.defaultData, title: 'Editable long title '.repeat(6), instructions: 'Instructions can also be long. '.repeat(12) };
    if (data.questions) data.questions = Array.from({ length: 12 }, () => ({ prompt: 'Explain your thinking. '.repeat(12), answer: 'Complete answer '.repeat(6), working: 'A complete calculation. '.repeat(3) }));
    if (data.numbers) data.numbers = Array.from({ length: 12 }, (_, i) => 10000 + i);
    const frame = mathRenderFrame(t, t.defaultWidth, t.defaultHeight, {}, data);
    assert.ok(frame.renderHeight > t.defaultHeight, t.id);
    assert.ok(!markup(t, 'teacher', data).includes('NaN'));
    const empty = { ...t.defaultData, questions: [], numbers: [], points: [] };
    assert.ok(!markup(t, 'student', empty).includes('NaN'));
  }
});

test('editing questions grows the frame and undo restores both data and size', () => {
  const saved = store.getState();
  const book = structuredClone(saved.getActiveBook()); book.pages[0].elementIds = [];
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: {}, selectedElementIds: [], saveToStorage: () => {} });
  history.getState().clearHistory();
  try {
    const id = insertMathComponent('worksheet-short-answer', 40, 60, undefined, { mode: 'student' });
    const before = structuredClone(store.getState().elements[id]);
    const questions = [...before.content.mathData.questions, { prompt: 'Explain this calculation. '.repeat(8), answer: 'A detailed answer. '.repeat(8) }];
    updateMathTemplateData(id, { questions });
    const after = store.getState().elements[id];
    assert.ok(after.transform.height > before.transform.height);
    assert.equal(after.content.mathData.questions.length, 4);
    assert.equal(after.content.mathMode, 'student');
    history.getState().undo(); assert.deepEqual(store.getState().elements[id], before);
    history.getState().redo(); assert.equal(store.getState().elements[id].content.mathData.questions.length, 4);
  } finally { store.setState(saved); history.getState().clearHistory(); }
});

test('plain Q&A stays monochrome, hides student answers and supports open writing space', () => {
  const t = getMathTemplate('worksheet-plain-question-answer');
  assert.ok(searchMathTemplates({ query: 'plain' }).some(template => template.id === t.id));
  for (const styleVariant of t.styleVariants) {
    const teacher = renderToStaticMarkup(buildEditableMathTree(t, { ...props(t), styleVariant }).tree);
    const student = renderToStaticMarkup(buildEditableMathTree(t, { ...props(t, 'student'), styleVariant }).tree);
    assert.equal((teacher.match(/<rect /g) || []).length, 1, 'only the paper background');
    assert.ok(!teacher.includes('<circle'));
    assert.ok(teacher.includes('A noun names a person,'));
    assert.ok(!student.includes('A noun names a person,'));
    assert.ok(student.includes('1.'));
    assert.ok(student.includes('<line'));
  }
  const open = { ...t.defaultData, title: '', instructions: '', responseStyle: 'open', showAnswerLabel: false };
  const output = markup(t, 'student', open);
  assert.ok(!output.includes('<line'));
  assert.ok(!output.includes('>Answer<'));
  assert.ok(t.measureHeight(open, t.defaultWidth) < t.defaultHeight, 'clearing headings releases their space');
  const custom = { ...t.defaultData, questions: [{ prompt: 'Explain photosynthesis in your own words. '.repeat(6), answer: 'A complete teacher answer. '.repeat(8), working: '' }], lineSpacing: 48, questionGap: 64 };
  const tree = buildEditableMathTree(t, props(t, 'teacher', custom));
  assert.ok(tree.parts.some(p => p.source?.includes('photosynthesis')));
  assert.ok(t.measureHeight(custom, t.defaultWidth) > t.measureHeight({ ...custom, lineSpacing: 20, questionGap: 12 }, t.defaultWidth));
});
