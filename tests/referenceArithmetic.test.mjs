import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { arithmeticTrace, latticeTrace, evaluateArithmetic, arithmeticCase } = require('../src/editor/math/referenceArithmetic.ts');
const { REFERENCE_BLOCK_TEMPLATES: templates } = require('../src/editor/math/templates/referenceBlocks.tsx');
const { getMathTemplate, searchMathTemplates } = require('../src/editor/math/mathRegistry.ts');
const { buildEditableMathTree, mathTextDataPatch } = require('../src/editor/math/mathEditableTree.tsx');
const { renderToStaticMarkup } = require('react-dom/server');
const props = (t, mode = 'teacher', data = t.defaultData, width = 480, styleVariant = 'color-coded') => ({ data, mode, width, height: t.measureHeight(data, width), styleVariant });
const markup = (t, mode, d = t.defaultData) => renderToStaticMarkup(buildEditableMathTree(t, props(t, mode, d)).tree);

test('reference arithmetic matches all supplied worked examples and tricky boundary cases', () => {
  for (const [a, b, op, expected, rem = 0] of [[25478,16936,'+',42414],[3648,2759,'+',6407],[99999,1,'+',100000],[0,0,'+',0],[4326,1758,'−',2568],[6015,3489,'−',2526],[9200,5768,'−',3432],[1000,1,'−',999],[4036,2507,'−',1529],[325,124,'−',201],[324,6,'×',1944],[208,7,'×',1456],[999999,999999,'×',999998000001],[34,27,'×',918],[0,7,'×',0],[84,4,'÷',21],[53,6,'÷',8,5],[808,8,'÷',101],[5,8,'÷',0,5],[0,4,'÷',0]]) {
    const t = arithmeticTrace(a,b,op); assert.equal(t.result,expected); assert.equal(t.remainder,rem);
    assert.ok(t.columns >= String(t.result).length);
    if (op === '−') assert.equal(t.modified.map((v,i)=>v-t.bottom[i]).join(''), String(expected).padStart(t.columns,'0'));
    if (op === '÷') { assert.equal(b*t.result+t.remainder,a); assert.ok(t.remainder < b); assert.equal(Number(t.division.map(s=>s.digit).join('')),t.result); for(const s of t.division) assert.equal(s.product+s.remainder,s.current); }
  }
  assert.deepEqual(arithmeticTrace(1000,1,'−').modified,[0,9,9,10]);
  assert.deepEqual(arithmeticTrace(808,8,'÷').division.map(s=>s.digit),[1,0,1]);
  assert.deepEqual(arithmeticTrace(999,1,'+').carries,[1,1,1,0]);
});

test('unsafe numbers, negative subtraction and division by zero are rejected explicitly', () => {
  for (const args of [[5,0,'÷'],[4,8,'−'],[-1,4,'+'],[4.5,2,'×'],[Infinity,2,'+'],['',2,'+'],[1000000,1,'+']]) assert.throws(()=>arithmeticTrace(...args));
});

test('lattice digits and diagonal carries reconstruct the product across different grid sizes', () => {
  for (const [a,b] of [[34,27],[23,46],[67,25],[48,37],[99,99],[7,246],[103,205],[0,99],[999,999]]) {
    const t=latticeTrace(a,b); let reconstructed=0;
    for (let r=0;r<t.side.length;r++) for(let c=0;c<t.top.length;c++) assert.equal(t.cells[r][c].tens*10+t.cells[r][c].ones,t.side[r]*t.top[c]);
    t.diagonals.forEach((d,i)=>{ assert.ok(d.digit>=0&&d.digit<10); reconstructed+=d.digit*10**i; });
    assert.equal(reconstructed,a*b); assert.equal(t.diagonals.at(-1).carry,0);
  }
});

test('mixed expressions respect precedence and parentheses without running arbitrary code', () => {
  for(const [expr,expected] of [['472 + 156 − 93',535],['9 × 8 + 47',119],['600 ÷ 5 + 28',148],['1200 − 4 × 6',1176],['(12 + 8) ÷ 4',5],['24 ÷ 3 × 2',16],['9 − 3 − 2',4],['1.5 × 4',6]]) assert.equal(evaluateArithmetic(expr),expected);
  for(const expr of ['1/0','1 +','(1+2','1..2','1 2','alert(1)','1;2','2**3','()']) { assert.throws(()=>evaluateArithmetic(expr),expr); }
});

test('constructed generators retain no-carry, no-borrow, remainder and quotient-zero cases', () => {
  const kinds=['add-no-carry','add-carry','sub-no-borrow','sub-borrow','sub-zero','multiply-carry','multiply-zero','multiply-two','divide-exact','divide-remainder','divide-zero'];
  for(const kind of kinds) for(const random of [()=>0,()=>1,...Array.from({length:40},()=>Math.random)]) {
    const {a,b}=arithmeticCase(kind,random), op=kind.startsWith('add')?'+':kind.startsWith('sub')?'−':kind.startsWith('multiply')?'×':'÷',t=arithmeticTrace(a,b,op);
    if(kind==='add-no-carry') assert.ok(t.carries.every(v=>v===0));
    if(kind==='add-carry') assert.ok(t.carries.some(v=>v>0));
    if(kind==='sub-no-borrow') assert.deepEqual(t.modified,t.top);
    if(kind==='sub-borrow'||kind==='sub-zero') assert.notDeepEqual(t.modified,t.top);
    if(kind==='multiply-carry') assert.ok(t.carries.some(v=>v>0));
    if(kind==='multiply-zero') assert.ok(String(a).includes('0'));
    if(kind==='divide-exact') assert.equal(t.remainder,0);
    if(kind==='divide-remainder') assert.ok(t.remainder>0);
    if(kind==='divide-zero') assert.ok(String(t.result).includes('0'));
  }
});

test('all extracted blocks are registered, discoverable and editable in every display mode', () => {
  assert.ok(templates.length>=30);
  for(const t of templates) {
    assert.equal(getMathTemplate(t.id),t); assert.ok(searchMathTemplates('Reference Arithmetic Blocks').some(v=>v.id===t.id));
    for(const width of [320,480,700]) for(const mode of ['student','teacher']) for(const variant of t.styleVariants) {
      const p=props(t,mode,{...t.defaultData,fontSize:26},width,variant), built=buildEditableMathTree(t,p), output=renderToStaticMarkup(built.tree);
      assert.ok(Number.isFinite(p.height)&&p.height>0); assert.ok(!/NaN|Infinity/.test(output),t.id);
      assert.equal(built.parts.length,new Set(built.parts.map(v=>v.id)).size,t.id);
      assert.ok(built.parts.some(v=>v.svg&&v.text!==undefined)); assert.ok(built.parts.some(v=>v.svg&&v.text===undefined));
    }
    if(t.generator) { const generated=t.generator({}); assert.ok(Object.keys(generated).length); assert.ok(!markup(t,'teacher',{...t.defaultData,...generated}).includes('validation-0')); }
  }
});

test('student blanks hide answers; worked examples and teacher keys reveal them', () => {
  const practice=getMathTemplate('reference-mixed-operations'), d={...practice.defaultData,questions:[{expression:'1234 + 5678'}]};
  assert.ok(!markup(practice,'student',d).includes('6912')); assert.ok(markup(practice,'teacher',d).includes('6912'));
  assert.ok(markup(practice,'student',{...d,showExample:true}).includes('6912'));
  const t=getMathTemplate('reference-addition-regrouping'); assert.ok(markup(t,'student').includes('42414')===false); // sum is editable digit-by-digit
  const built=buildEditableMathTree(t,props(t,'student')); assert.ok(built.parts.some(v=>v.source?.startsWith('8 + 6 = 14')));
  const word=getMathTemplate('reference-word-addition'); assert.ok(!markup(word,'student').includes('633 pencils')); assert.ok(markup(word,'teacher').includes('633 pencils'));
});

test('operand edits recalculate the word story, answer and full working height', () => {
  const t=getMathTemplate('reference-word-addition'), d={...t.defaultData,a:999,b:1};
  assert.ok(markup(t,'teacher',d).includes('1000 pencils')); assert.ok(markup(t,'teacher',d).includes('999 pencils'));
  const div=getMathTemplate('reference-word-division'); assert.ok(div.measureHeight({...div.defaultData,a:808,b:8},480)>div.measureHeight(div.defaultData,480));
  const p=getMathTemplate('reference-addition-practice'); assert.ok(p.measureHeight({...p.defaultData,questions:[...p.defaultData.questions,...p.defaultData.questions]},480)>p.defaultHeight);
});

test('direct heading edits preserve color, structure and generated answer source guards', () => {
  const t=getMathTemplate('reference-missing-addend'), p=props(t), built=buildEditableMathTree(t,p), heading=built.parts.find(v=>v.source?.includes('Challenge'));
  const output=renderToStaticMarkup(buildEditableMathTree(t,p,{overrides:{[heading.id]:{source:heading.source,text:'My colourful challenge',color:'#123456'}}}).tree);
  assert.ok(output.includes('My colourful challenge')); assert.ok(output.includes('#123456'));
  const calculated=built.parts.find(v=>v.source==='Missing number: 2215'); assert.ok(calculated);
  const overrides={[calculated.id]:{source:calculated.source,text:'OLD ANSWER'}};
  assert.ok(!renderToStaticMarkup(buildEditableMathTree(t,props(t,'teacher',{...t.defaultData,b:20}),{overrides}).tree).includes('OLD ANSWER'));
});


test('nested authored labels and step text edit their source without changing neighbouring items', () => {
  const t=getMathTemplate('reference-operation-steps'), built=buildEditableMathTree(t,props(t));
  const line=built.parts.find(v=>v.binding?.path[0]==='items'); assert.ok(line);
  const patch=mathTextDataPatch(t.defaultData,line,'My revised step'); assert.ok(patch.items[0].includes('My revised step'));
  assert.deepEqual(patch.items.slice(1),t.defaultData.items.slice(1)); assert.notEqual(patch.items,t.defaultData.items);
  const parts=getMathTemplate('reference-division-parts'); const p=buildEditableMathTree(parts,props(parts)).parts.find(v=>v.binding?.path[0]==='labels');
  assert.ok(p); assert.equal(mathTextDataPatch(parts.defaultData,p,'My dividend').labels[0],'My dividend');
});


test('invalid edits stay inside a recoverable error block instead of drawing a misleading model', () => {
  const repeat=getMathTemplate('reference-repeated-subtraction'), d={...repeat.defaultData,a:100,b:1};
  const tree=buildEditableMathTree(repeat,props(repeat,'teacher',d));
  assert.ok(tree.parts.some(p=>p.source?.includes('at most 60 counters'))); assert.equal(tree.parts.filter(p=>p.tag==='circle').length,0);
  const missing=getMathTemplate('reference-missing-addend'), invalid={...missing.defaultData,a:0,b:3,operation:'×'};
  assert.ok(markup(missing,'teacher',invalid).includes('one answer')); assert.ok(!markup(missing,'teacher',invalid).includes('Missing number:'));
  const div=getMathTemplate('reference-long-division-exact'); assert.ok(markup(div,'teacher',{...div.defaultData,b:0}).includes('undefined'));
});
