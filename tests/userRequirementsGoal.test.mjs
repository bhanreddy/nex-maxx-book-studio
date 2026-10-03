import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);

const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useUiStore } = require('../src/editor/stores/uiStore.ts');
const { CLAY_DOODLE_PICTURES, STARTER_PICTURES, picturePresets } = require('../src/editor/media/picturePresetCatalog.ts');
const { ELEMENT_PRESETS } = require('../src/editor/registry/presets.ts');
const { getAllMathTemplates } = require('../src/editor/math/mathRegistry.ts');
const { insertImageFileOntoActivePage } = require('../src/editor/clipboard/universalClipboard.ts');

test('Requirement 1: Shape Drawing functionality on worksheet', () => {
  const store = useEditorStore.getState();
  const page = store.getActivePage();
  assert.ok(page, 'Active page must exist');

  const beforeCount = store.getActivePageElements().length;

  // Simulate drawing a rectangle via addVectorShape
  const shapeEl = store.addVectorShape('rectangle', 80, 120, 220, 140, page.id);
  assert.ok(shapeEl, 'Shape element should be created');
  assert.equal(shapeEl.type, 'shape');
  assert.equal(shapeEl.transform.x, 80);
  assert.equal(shapeEl.transform.y, 120);
  assert.equal(shapeEl.transform.width, 220);
  assert.equal(shapeEl.transform.height, 140);
  assert.equal(shapeEl.pageId, page.id);
  assert.equal(shapeEl.content.shapeType, 'rectangle');
  assert.equal(shapeEl.style.shapeType, 'rectangle');

  // Verify element is present on active page
  const afterElements = useEditorStore.getState().getActivePageElements();
  assert.equal(afterElements.length, beforeCount + 1);
  assert.ok(afterElements.some(el => el.id === shapeEl.id));
  assert.deepEqual(useEditorStore.getState().selectedElementIds, [shapeEl.id]);

  // Test drawing an ellipse / circle
  const circleEl = store.addVectorShape('circle', 100, 200, 150, 150, page.id);
  assert.ok(circleEl);
  assert.equal(circleEl.content.shapeType, 'circle');
  assert.equal(circleEl.transform.width, 150);
  assert.equal(circleEl.transform.height, 150);

  // Test drawing a star
  const starEl = store.addVectorShape('star', 200, 300, 100, 100, page.id);
  assert.ok(starEl);
  assert.equal(starEl.content.shapeType, 'star');
});

test('Requirement 1b: Shape can be re-selected and edited after removing focus', () => {
  const store = useEditorStore.getState();
  const page = store.getActivePage();
  assert.ok(page);

  // Create shape
  const shapeEl = store.addVectorShape('rectangle', 60, 90, 180, 120, page.id);
  assert.ok(shapeEl);

  // Focus is initially on the shape
  assert.deepEqual(useEditorStore.getState().selectedElementIds, [shapeEl.id]);

  // Remove focus (deselect)
  useEditorStore.getState().clearSelection();
  assert.deepEqual(useEditorStore.getState().selectedElementIds, []);

  // Re-select shape
  useEditorStore.getState().selectElement(shapeEl.id);
  assert.deepEqual(useEditorStore.getState().selectedElementIds, [shapeEl.id]);

  // Edit shape properties (fill, stroke, transform)
  useEditorStore.getState().updateElementStyle(shapeEl.id, {
    backgroundColor: '#fef08a',
    borderColor: '#ca8a04',
    borderWidth: 4,
    borderRadius: 16
  });

  useEditorStore.getState().updateElementTransform(shapeEl.id, {
    width: 250,
    height: 160
  });

  const edited = useEditorStore.getState().elements[shapeEl.id];
  assert.equal(edited.style.backgroundColor, '#fef08a');
  assert.equal(edited.style.borderColor, '#ca8a04');
  assert.equal(edited.style.borderWidth, 4);
  assert.equal(edited.style.borderRadius, 16);
  assert.equal(edited.transform.width, 250);
  assert.equal(edited.transform.height, 160);
});

test('Requirement 2: Template size reduction', () => {
  const mathTemplates = getAllMathTemplates();
  // Check that math templates have reduced default widths and heights
  const columnAddition = mathTemplates.find(t => t.id === 'math-column-addition');
  assert.ok(columnAddition);
  assert.ok(columnAddition.defaultWidth <= 320, 'Column addition width was reduced to <= 320');
  assert.ok(columnAddition.defaultHeight <= 130, 'Column addition height was reduced to <= 130');

  const numberLine = mathTemplates.find(t => t.id === 'math-number-line');
  assert.ok(numberLine);
  assert.ok(numberLine.defaultWidth <= 380, 'Number line width was reduced from 480 to <= 380');

  const fractionBar = mathTemplates.find(t => t.id === 'math-fraction-bar');
  assert.ok(fractionBar);
  assert.ok(fractionBar.defaultWidth <= 310, 'Fraction bar width was reduced from 400 to <= 310');

  // Average template width across the registry should be significantly lower than before
  const averageWidth = mathTemplates.reduce((acc, t) => acc + t.defaultWidth, 0) / mathTemplates.length;
  assert.ok(averageWidth < 350, `Average template width (${averageWidth}) is modular and compact`);
});

test('Requirement 3: Direct Paste Image Option', async () => {
  const store = useEditorStore.getState();
  const page = store.getActivePage();
  assert.ok(page);

  const uiStore = useUiStore.getState();
  assert.equal(typeof uiStore.setDirectPasteModalOpen, 'function');

  // Modal open/close state
  uiStore.setDirectPasteModalOpen(true);
  assert.equal(useUiStore.getState().directPasteModalOpen, true);
  uiStore.setDirectPasteModalOpen(false);
  assert.equal(useUiStore.getState().directPasteModalOpen, false);

  // Test inserting an image file directly onto active page
  const dummySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="blue" width="100" height="100"/></svg>';
  const file = new File([dummySvg], 'pasted-vector.svg', { type: 'image/svg+xml' });

  const success = await insertImageFileOntoActivePage(file, { pasteX: 150, pasteY: 180 });
  assert.equal(success, true, 'Direct pasted image should return true');

  const elements = useEditorStore.getState().getActivePageElements();
  const inserted = elements.find(el => el.type === 'image' && el.transform.x === 150);
  assert.ok(inserted, 'Inserted element should be found on active page');
  assert.equal(inserted.type, 'image');
  assert.equal(inserted.pageId, page.id);
  assert.equal(inserted.transform.x, 150);
  assert.equal(inserted.transform.y, 180);
  assert.ok(inserted.content.src.startsWith('data:image/svg+xml'));
});

test('Requirement 4: 40+ Doodle Clay Images in picture presets', () => {
  // Must have 40+ doodle clay images
  assert.ok(CLAY_DOODLE_PICTURES.length >= 40, `Found ${CLAY_DOODLE_PICTURES.length} doodle clay images, expected >= 40`);

  // Verify all 42 clay SVGs exist on disk and have high-fidelity claymorphism
  for (const item of CLAY_DOODLE_PICTURES) {
    const fullPath = `public${item.src}`;
    assert.ok(fs.existsSync(fullPath), `Asset file ${fullPath} must exist`);
    const svg = fs.readFileSync(fullPath, 'utf8');
    assert.ok(svg.includes('<svg'), `${item.id} must be a valid SVG`);
    assert.ok(svg.includes('linearGradient') || svg.includes('radialGradient'), `${item.id} must have clay gradients`);
    assert.ok(svg.includes('filter'), `${item.id} must have 3D clay depth filter/shadows`);

    // Verify preset registration in ELEMENT_PRESETS
    const presetKey = `preset-picture-${item.id}`;
    assert.ok(ELEMENT_PRESETS[presetKey], `Preset ${presetKey} must exist in ELEMENT_PRESETS`);
    assert.ok(picturePresets[presetKey], `Preset ${presetKey} must exist in picturePresets`);
    assert.equal(ELEMENT_PRESETS[presetKey].type, 'image');
    assert.equal(ELEMENT_PRESETS[presetKey].defaultContent.src, item.src);
  }

  // Test adding a doodle clay preset element to active page via store.addElement
  const store = useEditorStore.getState();
  const abacusPreset = store.addElement('preset-picture-clay-abacus', 50, 75);
  assert.ok(abacusPreset, 'Should add Clay Abacus element to active page');
  assert.equal(abacusPreset.type, 'image');
  assert.equal(abacusPreset.transform.x, 50);
  assert.equal(abacusPreset.transform.y, 75);
  assert.equal(abacusPreset.content.src, '/assets/picture-presets/clay-abacus.svg');

  const dicePreset = store.addElement('preset-picture-clay-math-dice', 120, 160);
  assert.ok(dicePreset, 'Should add Clay Math Dice element to active page');
  assert.equal(dicePreset.content.src, '/assets/picture-presets/clay-math-dice.svg');
});
