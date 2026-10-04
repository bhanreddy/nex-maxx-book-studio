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

test('41 ready-made exercises are discoverable, editable and vector-only', () => {
  assert.equal(READY_MADE_MATH_TEMPLATES.length, 41);
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

const { PREMIUM_EXERCISE_TEMPLATES, premiumExerciseLayout, matchingOrder, shuffleMatchingOrder } = require('../src/editor/math/templates/premiumExerciseTemplates.tsx');
const { nextWorksheetPalette, worksheetPalettePatch, worksheetColors } = require('../src/editor/math/worksheetDesign.ts');

test('curated palette shuffles choose a different theme and preserve authored content', () => {
  const t = getMathTemplate('premium-question-answer');
  const before = structuredClone(t.defaultData);
  for (const random of [() => 0, () => .5, () => 1]) {
    const patch = nextWorksheetPalette('indigo', random);
    assert.notEqual(patch.paletteId, 'indigo');
    const data = { ...before, ...patch };
    assert.deepEqual(data.questions, before.questions);
    assert.ok(markup(t, 'teacher', data).includes(patch.accentColor));
    assert.equal(t.measureHeight(data, 460), t.measureHeight(before, 460));
  }
  assert.deepEqual(t.defaultData, before);
  assert.equal(worksheetColors({ accentColor: 'invalid' }).accent, worksheetColors({}).accent);
  assert.notEqual(worksheetColors({ ...worksheetPalettePatch('rose') }, 'clean').accent, worksheetPalettePatch('rose').accentColor);
});

test('question-to-answer and row gaps independently expand Q&A writing space', () => {
  for (const id of ['premium-question-answer', 'worksheet-plain-question-answer', 'worksheet-short-answer']) {
    const t = getMathTemplate(id), data = { ...t.defaultData, answerGap: 8, questionGap: 20 };
    assert.equal(t.measureHeight({ ...data, answerGap: 40 }, 460) - t.measureHeight(data, 460), 32 * data.questions.length);
    assert.equal(t.measureHeight({ ...data, questionGap: 52 }, 460) - t.measureHeight(data, 460), 32 * data.questions.length);
  }
});

test('matching shuffles preserve canonical pairs and student sheets hide connectors', () => {
  const t = getMathTemplate('premium-match-following'), before = structuredClone(t.defaultData);
  const patch = shuffleMatchingOrder(before, () => 1);
  assert.notDeepEqual(patch.matchOrder, before.matchOrder);
  assert.deepEqual([...patch.matchOrder].sort(), [0, 1, 2, 3]);
  assert.deepEqual(before, t.defaultData);
  const data = { ...before, ...patch };
  const student = buildEditableMathTree(t, props(t, 'student', data));
  assert.equal(student.parts.filter(p => p.id.includes('solution-link')).length, 0);
  const teacher = buildEditableMathTree(t, props(t, 'teacher', data));
  assert.equal(teacher.parts.filter(p => p.id.includes('solution-link')).length, before.questions.length);
  assert.deepEqual(matchingOrder({ ...before, matchOrder: [0, 0, 1, 2] }), [1, 2, 3, 0]);
  assert.deepEqual(matchingOrder({ questions: [] }), []);
  assert.deepEqual(shuffleMatchingOrder({ questions: [] }).matchOrder, []);
});

test('blank tokens accept multiple answers; teacher fills and explicit first examples stay separate', () => {
  const t = getMathTemplate('premium-fill-blanks');
  const data = { ...t.defaultData, questions: [{ prompt: 'The {{blank}} is {{blank}}.', answer: 'orchid | purple' }, { prompt: 'A {{blank}} lives here.', answer: 'butterfly' }] };
  assert.ok(!markup(t, 'student', data).includes('orchid'));
  assert.ok(!markup(t, 'student', data).includes('purple'));
  assert.ok(markup(t, 'teacher', data).includes('orchid'));
  assert.ok(markup(t, 'teacher', data).includes('purple'));
  const example = markup(t, 'student', { ...data, showExample: true });
  assert.ok(example.includes('orchid')); assert.ok(!example.includes('butterfly'));
});

test('choice highlighting follows the authored answer even when the first option is correct', () => {
  for (const id of ['premium-odd-one-out', 'premium-multiple-choice']) {
    const t = getMathTemplate(id), data = { ...t.defaultData, questions: [{ prompt: 'Choose a word.', choices: ['FIRST', 'SECOND'], answer: 'FIRST', explanation: 'A unique reason.' }] };
    assert.ok(!markup(t, 'student', data).includes('stroke-width="1.6"'));
    assert.equal((markup(t, 'teacher', data).match(/stroke-width="1.6"/g) || []).length, 1);
    if (data.requireExplanation) { assert.ok(!markup(t, 'student', data).includes('A unique reason')); assert.ok(markup(t, 'teacher', data).includes('A unique reason')); }
  }
});

test('true/false corrections and long labels reserve space without leaking solutions', () => {
  const t = getMathTemplate('premium-true-false-correct'), data = { ...t.defaultData, trueLabel: 'This statement is definitely true', falseLabel: 'This statement is definitely false', questions: [{ prompt: 'A test statement.', answer: 'False', explanation: 'A confidential correction.' }] };
  assert.ok(!markup(t, 'student', data).includes('confidential'));
  assert.ok(markup(t, 'teacher', data).includes('confidential'));
  assert.ok(t.measureHeight(data, 460) > t.measureHeight({ ...data, trueLabel: 'True', falseLabel: 'False' }, 460));
});

test('table layout reserves the larger teacher/student cell and supports multiple missing facts', () => {
  const t = getMathTemplate('premium-complete-table');
  const data = { ...t.defaultData, questions: [{ prompt: 'Test', cells: ['{{blank}}', '{{blank}}'], answer: 'unique-alpha | unique-beta' }] };
  assert.ok(markup(t, 'teacher', data).includes('unique-'));
  assert.ok(!markup(t, 'student', data).includes('unique-'));
  const layout = premiumExerciseLayout(data, 460);
  assert.ok(layout.rows[0].cellHeight >= Math.max(...layout.rows[0].cells.map(v => v.length)) * layout.leading + 18);
  assert.ok(!markup(t, 'student', { ...data, columns: ['A', 'B', 'C', 'D', 'E', 'F'] }).includes('NaN'));
});

test('premium numbering, writing style and soft panels are independently editable', () => {
  const t = getMathTemplate('premium-question-answer'), data = { ...t.defaultData, numberingStyle: 'letters', startNumber: 26, responseStyle: 'open', showPanels: false, showAnswerLabel: false };
  const output = markup(t, 'student', data);
  assert.ok(output.includes('z.')); assert.ok(output.includes('aa.'));
  assert.ok(!output.includes('<line'));
  assert.equal((output.match(/<rect /g) || []).length, 1);
  assert.ok(!output.includes('>Answer<'));
  for (const t of PREMIUM_EXERCISE_TEMPLATES) assert.ok(t.measureHeight(t.defaultData, 460) >= 180);
});

test('palette and spacing changes form undoable edits and grow the frame', () => {
  const saved = store.getState(), book = structuredClone(saved.getActiveBook()); book.pages[0].elementIds = [];
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: {}, selectedElementIds: [], saveToStorage: () => {} });
  history.getState().clearHistory();
  try {
    const id = insertMathComponent('premium-question-answer', 20, 20, undefined, { mode: 'student', styleVariant: 'clean' });
    const before = structuredClone(store.getState().elements[id]);
    updateMathTemplateData(id, { ...worksheetPalettePatch('teal'), answerGap: 72 });
    const after = store.getState().elements[id];
    assert.equal(after.content.styleVariant, 'color-coded');
    assert.equal(after.content.mathData.paletteId, 'teal');
    assert.deepEqual(after.content.mathData.questions, before.content.mathData.questions);
    assert.ok(after.transform.height > before.transform.height);
    history.getState().undo(); assert.deepEqual(store.getState().elements[id], before);
    history.getState().redo(); assert.deepEqual(store.getState().elements[id], after);
  } finally { store.setState(saved); history.getState().clearHistory(); }
});
