import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseFlowText, layoutTextFlow, measureFlowText, textFlowScene } = require('../src/editor/layoutPartner/textWrapLayout.ts');
const frame = text => ({ id: 'inline', pageId: 'p', type: 'body', category: 'text', displayName: 'Inline text', locked: false,
  transform: { x: 0, y: 0, width: 360, height: 200, rotation: 0, zIndex: 2 }, style: { fontSize: 10, fontFamily: 'Arial', lineHeight: 1.5 }, content: { text, html: true } });

test('partial formatting keeps unselected text unchanged and overrides inherited inline styles', () => {
  const runs = parseFlowText('Before <span style="font-size: 24pt; font-family: \'Times New Roman\'; color: #ff0000; line-height: 2; background-color: #ffff00">selected <span style="font-size: 16px; font-weight: normal; font-style: normal">word</span></span> after');
  assert.deepEqual(runs[0], { text: 'Before ', style: {} });
  assert.equal(runs[1].style.fontSize, 24); assert.equal(runs[1].style.fontFamily, "'Times New Roman'");
  assert.equal(runs[1].style.lineHeight, 2); assert.equal(runs[1].style.backgroundColor, '#ffff00');
  assert.equal(runs[2].style.fontSize, 12); assert.equal(runs[2].style.bold, false); assert.equal(runs[2].style.italic, false);
  assert.deepEqual(runs.at(-1), { text: ' after', style: {} });
  assert.ok(measureFlowText('selected', runs[1].style, { fontSize: 10 }) > measureFlowText('selected', {}, { fontSize: 10 }));
});

test('large selected words get vertical space while subsequent normal rows retain their original leading', () => {
  const text = frame('Small <span style="font-size: 24pt; line-height: 2">BIG</span><br>normal row');
  const layout = layoutTextFlow(text, []);
  assert.equal(layout.oversetChars, 0);
  assert.equal(layout.fragments[0].lineHeight, 48);
  assert.equal(layout.fragments[1].lineHeight, 15);
  assert.equal(layout.fragments[1].y, 48);
  const short = layoutTextFlow({ ...text, transform: { ...text.transform, height: 20 } }, []);
  assert.ok(short.oversetChars > 0);
});

test('mixed sizes, fonts, colours, highlighting and scripts survive native export scenes', () => {
  const text = frame('Plain <span style="font-size: 20pt; font-family: Georgia; color: #ff0000; background-color: #ffff00"><b>Selected</b></span> H<sub>2</sub>O');
  const scene = textFlowScene(text, [text]);
  const selected = scene.nodes.find(node => node.kind === 'text' && node.text === 'Selected');
  assert.equal(selected.size, 20); assert.equal(selected.fontFamily, 'Georgia'); assert.equal(selected.fill, '#ff0000'); assert.equal(selected.bold, true);
  assert.ok(scene.nodes.some(node => node.kind === 'rect' && node.fill === '#ffff00'));
  assert.equal(scene.nodes.find(node => node.kind === 'text' && node.text === '2').size, 7.5);
  assert.equal(scene.nodes.find(node => node.kind === 'text' && node.text.startsWith('Plain')).size, 10);
});

test('browser-inserted nonbreaking spaces retain separation around selected words', () => {
  const text = frame('Alpha&nbsp;<span style="font-size:24pt">selected</span>&nbsp;omega');
  const layout = layoutTextFlow(text, []);
  assert.equal(layout.fragments.flatMap(line => line.runs.map(run => run.text)).join(''), 'Alpha selected omega');
});
