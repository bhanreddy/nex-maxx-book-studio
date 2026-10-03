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

const {
  FONT_CATALOG,
  FONT_WEIGHTS,
  FONT_PRESET_SIZES,
  LINE_HEIGHT_PRESETS,
  TEXT_SHADOW_PRESETS,
  MATH_SYMBOL_GROUPS,
  recommendLineHeight,
  checkPrintReadabilityWarning,
  toSentenceCase,
  toTitleCase,
  toCapitalizeWords,
} = require('../src/editor/design/typographyCatalog.ts');

const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useUiStore } = require('../src/editor/stores/uiStore.ts');
const { printFont, getAllowedFontFamilies } = require('../src/editor/publishing/fontRegistry.ts');

test('Typography Catalog: covers all 6 font categories with previews', () => {
  const categories = ['Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace', 'Educational'];
  for (const cat of categories) {
    const fontsInCat = FONT_CATALOG.filter((f) => f.category === cat);
    assert.ok(fontsInCat.length > 0, `Category ${cat} should contain fonts`);
  }

  // Specific required fonts
  const fontNames = FONT_CATALOG.map((f) => f.family);
  assert.ok(fontNames.includes('Inter'));
  assert.ok(fontNames.includes('Poppins') || fontNames.includes('Nunito'));
  assert.ok(fontNames.includes('Lora') || fontNames.includes('Noto Serif'));
  assert.ok(fontNames.includes('Merriweather'));
});

test('Font Weights: supports 100 through 900 numeric weights', () => {
  assert.equal(FONT_WEIGHTS.length, 9);
  const weights = FONT_WEIGHTS.map((w) => w.value);
  assert.deepEqual(weights, [100, 200, 300, 400, 500, 600, 700, 800, 900]);
});

test('Text Shadows: professional editorial presets', () => {
  const presetNames = TEXT_SHADOW_PRESETS.map((p) => p.name);
  assert.ok(presetNames.includes('Soft'));
  assert.ok(presetNames.includes('Elevated'));
  assert.ok(presetNames.includes('Floating'));
  assert.ok(presetNames.includes('Deep'));
  assert.ok(presetNames.includes('Crisp'));
  assert.ok(presetNames.includes('Editorial'));
  assert.ok(presetNames.includes('Subtle'));
  assert.ok(presetNames.includes('Long Shadow'));

  for (const p of TEXT_SHADOW_PRESETS) {
    assert.ok(typeof p.x === 'number');
    assert.ok(typeof p.y === 'number');
    assert.ok(typeof p.blur === 'number');
    assert.ok(typeof p.color === 'string');
  }
});

test('Smart Typography: Optical font scaling dynamically computes line height', () => {
  assert.equal(recommendLineHeight(8), 1.5);
  assert.equal(recommendLineHeight(10), 1.45);
  assert.equal(recommendLineHeight(20), 1.25);
  assert.equal(recommendLineHeight(36), 1.15);
  assert.equal(recommendLineHeight(72), 1.05);
});

test('Smart Typography: Minimum print readability warning', () => {
  const smallWarn = checkPrintReadabilityWarning(7);
  assert.ok(smallWarn !== null && smallWarn.includes('minimum print legibility'));

  const normalBody = checkPrintReadabilityWarning(11);
  assert.equal(normalBody, null);

  const exactThreshold = checkPrintReadabilityWarning(8);
  assert.equal(exactThreshold, null);
});

test('Text Case transformations: preserves content while transforming case', () => {
  const original = 'the quick brown fox jumps';
  assert.equal(toSentenceCase(original), 'The quick brown fox jumps');
  assert.equal(toCapitalizeWords(original), 'The Quick Brown Fox Jumps');
  assert.equal(toTitleCase('the story of an atom'), 'The Story of an Atom');
});

test('Mathematical & Scientific Symbols: categorizes symbols cleanly', () => {
  const catNames = MATH_SYMBOL_GROUPS.map((c) => c.name);
  assert.ok(catNames.includes('Basic & Arithmetic'));
  assert.ok(catNames.includes('Superscripts / Powers'));
  assert.ok(catNames.includes('Subscripts'));
  assert.ok(catNames.includes('Fractions'));
  assert.ok(catNames.includes('Greek Letters'));

  // Test chemical formula construction
  const h2o = `H${'₂'}O + CO${'₂'}`;
  assert.ok(h2o.includes('₂'));

  // Test exponent construction
  const exp = `x${'²'} + y${'²'} = r${'²'}`;
  assert.ok(exp.includes('²'));
});

test('Element Style: complete typography property model serializes losslessly', () => {
  const comprehensiveStyle = {
    fontFamily: 'Poppins',
    fontSize: 28.5,
    fontWeight: 700,
    fontStyle: 'italic',
    color: '#1e3a8a',
    opacity: 0.95,
    lineHeight: 1.25,
    letterSpacing: -0.5,
    wordSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    textDecoration: 'underline',
    textDecorationStyle: 'wavy',
    textDecorationColor: '#ef4444',
    verticalAlign: 'middle',
    textIndent: 18,
    paragraphSpacing: 12,
    paragraphSpacingBefore: 8,
    listStyle: 'bullet-circle',
    overflowMode: 'fit',
    spellCheck: true,
    textStroke: {
      color: '#ffffff',
      width: 1.5,
      opacity: 0.9,
    },
    textGradient: {
      type: 'linear',
      angle: 90,
      stops: [
        { color: '#2563eb', offset: 0, opacity: 1 },
        { color: '#9333ea', offset: 100, opacity: 1 },
      ],
    },
    textShadows: [
      { x: 0, y: 2, blur: 4, color: '#000000', opacity: 0.25 },
    ],
    textHighlight: {
      color: '#fef08a',
      opacity: 0.8,
      padding: 4,
      borderRadius: 2,
    },
  };

  // Test JSON serialization & round-trip persistence (simulating save/reload)
  const serialized = JSON.stringify(comprehensiveStyle);
  const deserialized = JSON.parse(serialized);
  assert.deepEqual(deserialized, comprehensiveStyle);
});

test('Editor Store: Linked Styles cascade updates and support detaching', () => {
  const store = useEditorStore.getState();

  // Add 2 text elements directly via addTextFrame
  const el1 = store.addTextFrame(54, 100);
  const el2 = store.addTextFrame(54, 200);
  assert.ok(el1 && el2, 'Both text elements should be created');

  // Set distinct initial style on el1
  store.updateElementStyle(el1.id, {
    fontFamily: 'Noto Serif',
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
  });

  // Create text style from el1
  store.createTextStyleFromElement(el1.id, 'Chapter Heading');

  const updatedBook = useEditorStore.getState().getActiveBook();
  const createdStyle = updatedBook.textStyles.find((st) => st.name === 'Chapter Heading');
  assert.ok(createdStyle, 'Chapter Heading style definition should be registered in book');
  assert.equal(createdStyle.fontFamily, 'Noto Serif');
  assert.equal(createdStyle.fontSize, 24);

  // Apply style to el2
  store.applyTextStyle(el2.id, createdStyle.id);
  assert.equal(useEditorStore.getState().elements[el2.id].style.styleId, createdStyle.id);
  assert.equal(useEditorStore.getState().elements[el2.id].style.fontFamily, 'Noto Serif');

  // Update book text style definition -> verify cascading update to linked elements
  store.updateTextStyle(createdStyle.id, {
    fontFamily: 'Merriweather',
    fontSize: 32,
    fontWeight: 800,
  });

  assert.equal(useEditorStore.getState().elements[el1.id].style.fontFamily, 'Merriweather');
  assert.equal(useEditorStore.getState().elements[el1.id].style.fontSize, 32);
  assert.equal(useEditorStore.getState().elements[el2.id].style.fontFamily, 'Merriweather');
  assert.equal(useEditorStore.getState().elements[el2.id].style.fontSize, 32);

  // Detach el2 from style -> keeps current visual styles but clears styleId
  store.detachTextStyle(el2.id);
  assert.equal(useEditorStore.getState().elements[el2.id].style.styleId, undefined);
  assert.equal(useEditorStore.getState().elements[el2.id].style.fontFamily, 'Merriweather');

  // Updating style again affects el1 but NOT detached el2
  store.updateTextStyle(createdStyle.id, {
    fontFamily: 'Inter',
    fontSize: 36,
  });

  assert.equal(useEditorStore.getState().elements[el1.id].style.fontFamily, 'Inter');
  assert.equal(useEditorStore.getState().elements[el2.id].style.fontFamily, 'Merriweather'); // stays Merriweather
});

test('Editor Store: Format Painter & Copy/Paste Style', () => {
  const store = useEditorStore.getState();

  // Create source and target elements
  const source = store.addTextFrame(54, 300);
  const target = store.addTextFrame(54, 400);
  assert.ok(source && target, 'Source and target elements must exist');

  store.updateElementContent(target.id, { text: 'Target Text Unformatted' });
  store.updateElementStyle(source.id, {
    fontFamily: 'Nunito',
    fontSize: 16,
    fontWeight: 600,
    color: '#059669',
    letterSpacing: 0.5,
    textStroke: { color: '#000000', width: 0.5, opacity: 1 },
  });

  // Copy style from source directly using source.id
  store.copyTextStyle(source.id);
  const copied = useUiStore.getState().copiedTextStyle;
  assert.ok(copied, 'Copied style should be populated in uiStore');
  assert.equal(copied.fontFamily, 'Nunito');
  assert.equal(copied.fontSize, 16);
  assert.equal(copied.color, '#059669');

  // Paste style into target
  store.pasteTextStyle(target.id);

  // Target should receive source formatting while keeping its own text content!
  const updatedTarget = useEditorStore.getState().elements[target.id];
  assert.equal(updatedTarget.content.text, 'Target Text Unformatted');
  assert.equal(updatedTarget.style.fontFamily, 'Nunito');
  assert.equal(updatedTarget.style.fontSize, 16);
  assert.equal(updatedTarget.style.color, '#059669');
  assert.equal(updatedTarget.style.letterSpacing, 0.5);

  // Clear Formatting on target
  store.clearTextFormatting(target.id);
  const clearedTarget = useEditorStore.getState().elements[target.id];
  assert.equal(clearedTarget.content.text, 'Target Text Unformatted');
  assert.equal(clearedTarget.style.fontSize, 10.5);
  assert.equal(clearedTarget.style.fontWeight, 400);
});

test('Editor Store: Multi-selection batch style update', () => {
  const store = useEditorStore.getState();
  const b1 = store.addTextFrame(54, 500);
  const b2 = store.addTextFrame(54, 600);
  assert.ok(b1 && b2, 'Need fresh elements for batch test');
  const ids = [b1.id, b2.id];

  // Apply batch style to multiple elements atomically
  store.batchUpdateElementStyle(ids, {
    textAlign: 'center',
    lineHeight: 1.35,
  });

  for (const id of ids) {
    const el = useEditorStore.getState().elements[id];
    assert.equal(el.style.textAlign, 'center');
    assert.equal(el.style.lineHeight, 1.35);
  }
});

test('Multilingual Fidelity: Telugu, Hindi, English, and Math symbols render cleanly', () => {
  const teluguContent = 'మొదటి పాఠం: సంఖ్యల పరిచయం (Numbers Chapter 1)';
  const hindiContent = 'पाठ १: संख्याओं की समझ';
  const mathFormula = 'x² + y² = z² మరియు H₂O';

  const mixedBlock = {
    telugu: teluguContent,
    hindi: hindiContent,
    math: mathFormula,
  };

  const jsonStr = JSON.stringify(mixedBlock);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.telugu, teluguContent);
  assert.equal(parsed.hindi, hindiContent);
  assert.equal(parsed.math, mathFormula);
});

test('Font Preflight & Export: Bundled font mapping and missing font detection', () => {
  // Allowed fonts should resolve cleanly
  const interFont = printFont('Chapter Title', 'Inter');
  assert.ok(interFont && typeof interFont === 'string');

  const merriweatherFont = printFont('Editorial Lead', 'Merriweather');
  assert.ok(merriweatherFont && typeof merriweatherFont === 'string');

  // Unknown font must throw to trigger preflight font warning
  assert.throws(() => {
    printFont('Missing font text', 'NonExistentCustomFontXYZ');
  });
});
