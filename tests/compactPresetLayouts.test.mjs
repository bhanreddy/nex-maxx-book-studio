import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { getMathTemplate } = require('../src/editor/math/mathRegistry.ts');
const { premiumExerciseLayout } = require('../src/editor/math/templates/premiumExerciseTemplates.tsx');
const { wordProblemLayout, wordProblemData } = require('../src/editor/math/wordProblemLayout.ts');
const { worksheetLines } = require('../src/editor/math/worksheetDesign.ts');
const { buildEditableMathTree, mathRenderFrame } = require('../src/editor/math/mathEditableTree.tsx');
const { fitMathComponentToContent, insertMathComponent, updateMathPartText } = require('../src/editor/math/mathActions.ts');
const { useEditorStore: store } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore: history } = require('../src/editor/stores/historyStore.ts');
const { renderToStaticMarkup } = require('react-dom/server');

test('wrapping uses the actual glyph widths instead of a fixed character quota', () => {
  assert.deepEqual(worksheetLines('ill ill ill ill ill ill', 160, 20), ['ill ill ill ill ill ill']);
  assert.ok(worksheetLines('WWW WWW WWW WWW', 160, 20).length > 1);
});

test('wide true/false rows put controls beside statements; narrow rows and long labels stack safely', () => {
  const t = getMathTemplate('premium-true-false');
  const data = { ...t.defaultData, questions: [{ prompt: '1,000 is the smallest 4-digit number.', answer: 'True' }, { prompt: '9,999 is a 5-digit number.', answer: 'False' }] };
  const wide = premiumExerciseLayout(data, 920), stacked = premiumExerciseLayout({ ...data, choicePlacement: 'below' }, 920);
  assert.ok(wide.rows.every(row => row.tfInline));
  assert.ok(wide.height < stacked.height);
  for (const row of wide.rows) {
    assert.ok(row.tfX > 68);
    assert.ok(row.tfX + row.tfWidth * 2 + 12 <= 920 - 24);
    assert.ok(row.choiceTop + row.tfHeight <= row.bottom - data.questionGap);
  }
  assert.ok(premiumExerciseLayout(data, 240).rows.every(row => !row.tfInline && row.tfColumns === 1));
  assert.ok(premiumExerciseLayout({ ...data, trueLabel: 'A long label that must wrap across multiple lines' }, 920).rows.every(row => !row.tfInline));
});

test('short answers start with one writing line, extended answers retain their workspace, and the final row has no trailing question gap', () => {
  const short = getMathTemplate('premium-question-answer'), long = getMathTemplate('premium-long-answer');
  assert.equal(short.defaultData.answerLines, 1);
  assert.equal(long.defaultData.answerLines, 3);
  const data = { ...short.defaultData, questions: [{ prompt: 'Question?', answer: 'Answer.' }], questionGap: 12 };
  assert.equal(short.measureHeight({ ...data, questionGap: 80 }, 900), short.measureHeight(data, 900));
  const many = { ...data, questions: [...data.questions, ...data.questions] };
  assert.equal(short.measureHeight({ ...many, questionGap: 80 }, 900) - short.measureHeight(many, 900), 68);
  assert.ok(short.measureHeight({ ...data, answerLines: 4 }, 900) > short.measureHeight(data, 900));
});

test('word problems measure wrapped story and solution fields and never expose the student answer key', () => {
  const t = getMathTemplate('math-word-problem');
  const data = { ...t.defaultData, story: 'A factory packed 56,304 boxes in a month. Which digit is in the hundreds place?', operation: '', answer: 'SECRET ANSWER KEY', fontSize: 14 };
  const wide = wordProblemLayout(data, 900), narrow = wordProblemLayout(data, 270);
  assert.ok(wide.height < narrow.height);
  assert.equal(wide.columns, 2); assert.equal(narrow.columns, 1);
  assert.equal(t.measureHeight(data, 900), wide.height);
  const props = { data, width: 900, height: wide.height, styleVariant: 'clean' };
  assert.ok(!renderToStaticMarkup(buildEditableMathTree(t, { ...props, mode: 'student' }).tree).includes('SECRET ANSWER KEY'));
  const teacher = buildEditableMathTree(t, { ...props, mode: 'teacher' });
  assert.ok(teacher.parts.some(part => part.binding?.path[0] === 'story'));
  assert.ok(teacher.parts.some(part => part.binding?.path[0] === 'answer'));
  assert.ok(teacher.parts.some(part => part.text === 'SECRET ANSWER KEY'));
});

test('the compact word problem preserves previous inline text edits, including an intentionally empty operation', () => {
  const t = getMathTemplate('math-word-problem'), original = structuredClone(t.defaultData);
  const overrides = {
    'math-word-problem/children/0/children/1': { source: 'Word Problem', text: 'Try it yourself' },
    'math-word-problem/children/1': { source: original.story, text: 'A revised story prompt.' },
    'math-word-problem/children/2/children/0/children/1': { source: original.operation, text: '' },
  };
  const data = wordProblemData(original, overrides);
  assert.equal(data.title, 'Try it yourself'); assert.equal(data.story, 'A revised story prompt.'); assert.equal(data.operation, '');
  assert.deepEqual(original, t.defaultData);
  const tree = buildEditableMathTree(t, { data: original, mode: 'teacher', styleVariant: 'clean', width: 500, height: 130 }, { overrides });
  assert.ok(tree.parts.some(part => part.text === 'A revised story prompt.'));
  assert.ok(tree.parts.some(part => part.text === 'Try it yourself'));
  assert.ok(!tree.parts.some(part => part.text?.includes('Subtraction')));
});

test('Fit content keeps width, reading size and authored writing lines, and undo restores surplus height', () => {
  const saved = store.getState(), book = structuredClone(saved.getActiveBook()); book.pages[0].elementIds = [];
  store.setState({ books: [book], activeBookId: book.id, activePageIndex: 0, elements: {}, selectedElementIds: [], saveToStorage() {} }); history.getState().clearHistory();
  try {
    for (const id of ['premium-question-answer', 'premium-true-false', 'worksheet-plain-question-answer', 'math-word-problem']) {
      const elementId = insertMathComponent(id, 20, 20, { answerLines: 4 }, { width: 535, height: 900, appearance: { resizeMode: 'reflow', reflowScale: .8 } });
      const original = structuredClone(store.getState().elements[elementId]), t = getMathTemplate(id);
      const before = mathRenderFrame(t, 535, 900, original.content.mathAppearance, original.content.mathData);
      fitMathComponentToContent(elementId);
      const compact = store.getState().elements[elementId], after = mathRenderFrame(t, 535, compact.transform.height, compact.content.mathAppearance, compact.content.mathData);
      assert.equal(compact.transform.width, 535); assert.ok(compact.transform.height < 900);
      assert.equal(after.scaleY, before.scaleY); assert.equal(compact.content.mathData.answerLines, 4);
      assert.deepEqual(compact.content.mathData, original.content.mathData);
      history.getState().undo(); assert.deepEqual(store.getState().elements[elementId], original);
    }
    const id = insertMathComponent('math-word-problem', 20, 20);
    const el = store.getState().elements[id], t = getMathTemplate('math-word-problem');
    const parts = buildEditableMathTree(t, { data: el.content.mathData, mode: 'teacher', styleVariant: 'clean', width: el.transform.width, height: el.transform.height }).parts;
    updateMathPartText(id, parts.find(part => part.binding?.path[0] === 'story'), 'An edited story that remains editable when the frame is fitted.');
    fitMathComponentToContent(id);
    assert.ok(store.getState().elements[id].content.mathData.story.includes('An edited story'));
  } finally { store.setState(saved); history.getState().clearHistory(); }
});
