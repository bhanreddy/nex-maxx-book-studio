import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { embedFooterFixture } from './helpers/printFixtures.mjs';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
const frames = require('../src/editor/pageFrame/pageFrame.ts');
const { applyPageFrame } = require('../src/editor/pageFrame/actions.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
const engine = require('../src/editor/curriculum/chapterEngine.ts');
const actions = require('../src/editor/curriculum/actions.ts');
const { createSchemaTopic, schemaTopics } = require('../src/editor/curriculum/lessonSchema.ts');
const snapshots = require('../src/editor/persistence/bookSnapshots.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { renderPublicationPdf } = require('../src/editor/educational/publicationPdf.ts');
const jsPDF = require('jspdf').jsPDF;
const starter = structuredClone(useEditorStore.getState().getActiveBook());
const { integrateBookPageBorder } = require('../src/editor/pageFrame/bookBorder.ts');
function reset() {
  const book = structuredClone(starter);
  book.pages = [{ id: 'frame-page', pageIndex: 0, displayNumber: '1', elementIds: [], status: 'Draft' }];
  book.chapters = []; book.units = []; delete book.pageFrame;
  useEditorStore.setState({ books: [book], activeBookId: book.id, elements: {}, activePageIndex: 0, selectedElementIds: [] });
  useHistoryStore.getState().clearHistory(); return book;
}
const frameWords = scene => scene.nodes.filter(n => n.kind === 'text').map(n => n.text);
test('frame artwork stays native and editable across portrait, landscape and page numbers', () => {
  const frame = frames.createPageFrame();
  for (const [w, h] of [[595, 842], [420, 595], [842, 595]]) {
    const scene = frames.buildPageFrameScene(frame, '123', w, h);
    assert.deepEqual(frameWords(scene), ['123', '123']);
    assert.ok(!scene.nodes.some(n => n.kind === 'image'));
    for (const n of scene.nodes) for (const key of ['x', 'y', 'w', 'h', 'rx', 'ry', 'size']) if (key in n) assert.ok(Number.isFinite(n[key]));
  }
  frame.edits['Top peach ribbon'] = { hidden: true };
  frame.edits['Top burgundy wave'] = { fill: '#123456', d: 'M 0 0 L 600 0 L 600 40 L 0 20 Z' };
  const nodes = frames.editableFrameNodes(JSON.parse(JSON.stringify(frame)), '4');
  assert.ok(!nodes.some(n => n.motifId === 'Top peach ribbon'));
  assert.ok(!nodes.some(n => /leaf|foliage|flower|plane|book cover|book pages|doodle|bulb|star|dot/i.test(n.motifId || '')));
  assert.equal(nodes.find(n => n.motifId === 'Top burgundy wave').fill, '#123456');
  frame.showTopNumber = false; frame.showBottomNumber = false;
  assert.deepEqual(frameWords(frames.buildPageFrameScene(frame, '4', 600, 900)), []);
});
test('chapter frame applies only to its chapter, survives recomposition and undo/redo', () => {
  reset(); const ch = actions.createFrameworkChapter({ ...engine.DEFAULT_CHAPTER_CONFIG, subject: 'Music' });
  const pre = useEditorStore.getState().getActiveBook();
  applyPageFrame(frames.createPageFrame(), 'chapter');
  let st = useEditorStore.getState(), book = st.getActiveBook();
  const chapter = book.chapters.find(c => c.id === ch.id), safe = frames.frameMargins(book, chapter.pageFrame);
  assert.equal(book.pages[0].pageFrame, undefined); assert.equal(frames.pageFrameFor(book, book.pages[0]), undefined);
  for (const page of book.pages.filter(p => p.chapterId === ch.id)) {
    assert.ok(frames.pageFrameFor(book, page));
    for (const id of page.elementIds) { const el = st.elements[id]; assert.ok(el.transform.y >= safe.topPt); assert.ok(el.transform.y + el.transform.height <= book.dimensions.heightPt - safe.bottomPt + .01); }
  }
  useHistoryStore.getState().undo(); assert.deepEqual(useEditorStore.getState().getActiveBook(), pre);
  useHistoryStore.getState().redo(); assert.ok(useEditorStore.getState().getActiveBook().chapters.find(c => c.id === ch.id).pageFrame);
  const schema = Object.values(useEditorStore.getState().elements).find(e => e.smartBlockData?.curriculum?.type === 'lesson-schema');
  const topics = Array.from({ length: 45 }, (_, i) => createSchemaTopic(i % 4 ? `Music topic ${i}` : '', i, 'Music'));
  st.updateSmartBlockContent(schema.id, { lessonSchemaTopics: topics });
  st = useEditorStore.getState(); book = st.getActiveBook();
  assert.ok(book.pages.length > 3);
  for (const p of book.pages.filter(p => p.chapterId === ch.id)) assert.ok(frames.pageFrameFor(book, p));
  assert.deepEqual(schemaTopics(st.elements[schema.id].smartBlockData), topics);
  st.addPage(st.activePageIndex);
  assert.equal(st.getActivePage().chapterId, ch.id); assert.ok(frames.pageFrameFor(st.getActiveBook(), st.getActivePage()));
});
test('standalone topic continuations inherit their frame and preserve all topics', () => {
  reset(); applyPageFrame(frames.createPageFrame(), 'chapter');
  actions.insertCurriculumBlock('lesson-schema', undefined, 4, 'Geography');
  const st = useEditorStore.getState(), id = st.selectedElementIds[0];
  const topics = Array.from({ length: 50 }, (_, i) => createSchemaTopic(i % 3 ? `Topic ${i}` : '', i, 'Geography'));
  st.updateSmartBlockContent(id, { lessonSchemaTopics: topics });
  const next = useEditorStore.getState(), book = next.getActiveBook(), safe = frames.frameMargins(book, frames.pageFrameFor(book, book.pages[0]));
  assert.ok(book.pages.length > 1);
  for (const page of book.pages) {
    assert.ok(frames.pageFrameFor(book, page));
    for (const elId of page.elementIds) { const el = next.elements[elId]; assert.ok(el.transform.y >= safe.topPt); assert.ok(el.transform.y + el.transform.height <= book.dimensions.heightPt - safe.bottomPt + .01); }
  }
  assert.deepEqual(schemaTopics(next.elements[id].smartBlockData), topics);
});
test('chapter graphics edits survive central snapshot recovery and inheritance', () => {
  reset(); const chapter = actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG);
  const frame = frames.createPageFrame(); frame.edits['Margin book doodle'] = { hidden: true }; frame.colors.primary = '#123456';
  applyPageFrame(frame, 'chapter');
  const st = useEditorStore.getState(), book = st.getActiveBook(), ch = book.chapters.find(c => c.id === chapter.id);
  const doc = JSON.parse(JSON.stringify(snapshots.serializeChapter(book, ch, st.elements, book.id, ch.id)));
  const restored = snapshots.restoreChapter(doc, { ...ch, pageFrame: undefined });
  assert.deepEqual(restored.chapter.pageFrame, frame);
  const recovered = { ...book, chapters: [restored.chapter], pages: restored.pages };
  assert.deepEqual(frames.pageFrameFor(recovered, restored.pages[0]), frame);
});
test('HTML print includes shared graphics, both numbers, grayscale, bleed and no duplicate footer', async () => {
  const book = reset(); book.pageFrame = frames.createPageFrame(); book.pages[0].displayNumber = '12';
  const pages = collectPrintPages(book, {});
  assert.deepEqual(frameWords(pages[0].frame), ['12', '12']);
  const html = buildPrintHtml(book, embedFooterFixture(pages), '', { grayscale: true, bleed: true });
  assert.match(html, /data-page-frame="scholar-wave"/); assert.equal((html.match(/>12<\/text>/g) || []).length, 2);
  assert.ok(!html.includes(book.title + '</text>')); assert.ok(!html.includes('#79253E')); assert.match(html, /translate\(9,9\)/);
  const doc = new jsPDF({ unit: 'pt', format: [book.dimensions.widthPt, book.dimensions.heightPt] });
  const scene = pages[0].frame;
  await renderPublicationPdf(doc, scene, { transform: { x: 0, y: 0, width: scene.width, height: scene.height, rotation: 0 }, style: {} });
  assert.ok(doc.output('arraybuffer').byteLength > 1000);
});

test('explicit empty chapter pages survive recomposition and renumbering', () => {
  reset(); const ch = actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG);
  applyPageFrame(frames.createPageFrame(), 'chapter');
  const st = useEditorStore.getState(); st.addPage(st.activePageIndex, 'chapter-empty-space');
  const empty = st.getActivePage();
  assert.equal(empty.chapterId, ch.id); assert.equal(empty.elementIds.length, 0);
  const book = st.getActiveBook(), chapter = book.chapters.find(c => c.id === ch.id);
  const result = engine.composeChapter(book, chapter, st.elements);
  assert.ok(result.pages.some(p => p.id === empty.id));
  assert.ok(frames.pageFrameFor(result.book, result.pages.find(p => p.id === empty.id)));
  assert.deepEqual(book.pages.map(p => p.displayNumber), book.pages.map((_, i) => String(i + 1)));
});
test('standalone SVG exports editable curves and validates curve edits', () => {
  const svg = frames.pageFrameSvg(frames.createPageFrame());
  assert.match(svg, /data-graphic="Top burgundy wave"/); assert.match(svg, /<path/); assert.match(svg, /<text/); assert.ok(!svg.includes('<image'));
  assert.equal(frames.isEditableFramePath('M 0 0 C 2 3 4 5 6 7 L 8 9 Z'), true);
  for (const path of ['M 0', 'M 0 0 A 2 3 4 5 6 7 8', 'M 0 0 L NaN 2', 'M 0 0 C 1 2', 'M 0 0 . L 1 1', 'M 0 0e L 1 1']) assert.equal(frames.isEditableFramePath(path), false);
});

test('book-wide frame replaces old page exceptions and is inherited by new chapters and pages', () => {
  const book = reset(), oldFrame = frames.createPageFrame(); oldFrame.colors.primary = '#123456';
  book.chapters = [{ id: 'legacy-chapter', unitId: 'u', number: 1, title: 'Older chapter', learningObjectives: [], pageIds: ['frame-page'], pageFrame: oldFrame }];
  book.pages[0].chapterId = 'legacy-chapter'; book.pages[0].pageFrame = null;
  book.pages.push({ id: 'other-page', pageIndex: 7, displayNumber: '99', elementIds: [], status: 'Draft', pageFrame: oldFrame });
  const frame = frames.createPageFrame(); applyPageFrame(frame);
  let st = useEditorStore.getState(), next = st.getActiveBook();
  assert.deepEqual(next.pageFrame, frame);
  assert.equal(next.chapters[0].pageFrame, undefined);
  assert.deepEqual(next.pages.map(p => p.displayNumber), ['1', '2']);
  next.pages.forEach(p => assert.deepEqual(frames.pageFrameFor(next, p), frame));
  st.addPage(1); st = useEditorStore.getState(); next = st.getActiveBook();
  assert.deepEqual(frames.pageFrameFor(next, st.getActivePage()), frame);
  const created = actions.createFrameworkChapter({ ...engine.DEFAULT_CHAPTER_CONFIG, title: 'A new subject', subject: 'Geography' });
  next = useEditorStore.getState().getActiveBook();
  next.pages.filter(p => p.chapterId === created.id).forEach(p => assert.deepEqual(frames.pageFrameFor(next, p), frame));
});
test('page operations automatically renumber both frame badges and print output', () => {
  const book = reset();
  book.pages.push({ id: 'second', pageIndex: 1, displayNumber: '2', elementIds: [], status: 'Draft' }, { id: 'third', pageIndex: 2, displayNumber: '3', elementIds: [], status: 'Draft' });
  const frame = frames.createPageFrame();
  frame.edits['Top page number'] = { text: '999' };
  frame.edits['Bottom page number'] = { text: '999' };
  applyPageFrame(frame);
  const check = () => {
    const current = useEditorStore.getState().getActiveBook();
    assert.deepEqual(current.pages.map(p => p.displayNumber), current.pages.map((_, i) => String(i + 1)));
    current.pages.forEach((p, i) => assert.deepEqual(frameWords(frames.buildPageFrameScene(frames.pageFrameFor(current, p), p.displayNumber, 600, 900)), [String(i + 1), String(i + 1)]));
    assert.deepEqual(collectPrintPages(current, {}).map(p => frameWords(p.frame)), current.pages.map((_, i) => [String(i + 1), String(i + 1)]));
  };
  useEditorStore.getState().addPage(0); check();
  useEditorStore.getState().duplicatePage(1); check();
  const movedId = useEditorStore.getState().getActiveBook().pages[4].id;
  useEditorStore.getState().reorderPages(4, 0); check();
  assert.equal(useEditorStore.getState().getActiveBook().pages[0].id, movedId);
  useEditorStore.getState().deletePage(1); check();
  const { renumberPages } = require('../src/editor/core/pageNumbering.ts');
  const coverPages = [{ id: 'c', displayNumber: 'Cover', pageIndex: 8 }, { id: 'p', displayNumber: '19', pageIndex: 9 }];
  assert.deepEqual(renumberPages(coverPages).map(p => p.displayNumber), ['Cover', '1']);
  assert.equal(coverPages[1].displayNumber, '19');
});

test('legacy book upgrade covers disabled covers, chapter-only designs and all existing pages once', () => {
  const base = reset(), legacy = frames.createPageFrame(); legacy.colors.primary = '#123456';
  const book = { ...base, premiumPageBorderVersion: undefined, pageFramePolicy: undefined, pageFrame: null,
    chapters: [{ id: 'legacy', pageIds: ['reading'], pageFrame: legacy }],
    pages: [{ id: 'cover', pageIndex: 0, displayNumber: 'Cover', elementIds: [], pageFrame: null }, { id: 'reading', chapterId: 'legacy', pageIndex: 1, displayNumber: '1', elementIds: [], pageFrame: null }] };
  const before = JSON.stringify(book), upgraded = integrateBookPageBorder(book);
  assert.equal(JSON.stringify(book), before);
  assert.equal(upgraded.pageFramePolicy, 'book');
  assert.equal(upgraded.pageFrame.colors.primary, '#123456');
  upgraded.pages.forEach(page => assert.equal(frames.pageFrameFor(upgraded, page), upgraded.pageFrame));
  assert.equal(integrateBookPageBorder(upgraded), upgraded);
  const removed = { ...upgraded, pageFrame: null };
  assert.equal(integrateBookPageBorder(removed), removed);
});

test('book-wide policy survives late chapter snapshots and disabled page exceptions', () => {
  const book = reset(); applyPageFrame(frames.createPageFrame(), 'book');
  const active = useEditorStore.getState().getActiveBook();
  const imported = { ...active, chapters: [{ id: 'late', pageIds: [active.pages[0].id], pageFrame: null }], pages: [{ ...active.pages[0], pageFrame: null, chapterId: 'late' }] };
  assert.equal(frames.pageFrameFor(imported, imported.pages[0]), active.pageFrame);
  assert.equal(frames.chapterFrame(imported, imported.chapters[0]), active.pageFrame);
  const pages = collectPrintPages(imported, {});
  assert.ok(pages.every(page => !!page.frame));
  assert.deepEqual(frames.editableFrameNodes(active.pageFrame, 'Cover').filter(node => node.kind === 'text'), []);
});

test('new books and newly inserted pages inherit the wave border even after a disabled preceding page', () => {
  reset(); const book = useEditorStore.getState().createBook({ title: 'Shared wave border' });
  assert.equal(book.pageFrame.style, 'scholar-wave');
  assert.equal(frames.pageFrameFor(book, book.pages[0]), book.pageFrame);
  useEditorStore.setState({ books: [{ ...book, pages: [{ ...book.pages[0], pageFrame: null }] }] });
  useEditorStore.getState().addPage(0);
  const current = useEditorStore.getState().getActiveBook();
  assert.equal(current.pages[1].pageFrame, undefined);
  current.pages.forEach(page => assert.equal(frames.pageFrameFor(current, page), current.pageFrame));
});

test('print draws the wave artwork above a native full-page backdrop without covering reading text with paper', () => {
  const book = reset(); applyPageFrame(frames.createPageFrame(), 'book');
  const current = useEditorStore.getState().getActiveBook(), page = current.pages[0];
  const backdrop = { id: 'native-paper', pageId: page.id, type: 'shape', category: 'decorative', hidden: false, content: {}, style: { backgroundColor: '#FFFFFF' }, transform: { x: 0, y: 0, width: current.dimensions.widthPt, height: current.dimensions.heightPt, rotation: 0, zIndex: 1 } };
  const printable = { ...current, pages: [{ ...page, elementIds: [backdrop.id] }] };
  const html = buildPrintHtml(printable, embedFooterFixture(collectPrintPages(printable, { [backdrop.id]: backdrop })), '');
  assert.ok(html.indexOf('data-page-frame-background') < html.indexOf('data-print-frame="native-paper"'));
  assert.ok(html.indexOf('data-print-frame="native-paper"') < html.indexOf('data-page-frame="scholar-wave"'));
  assert.equal((html.match(/<rect /g) || []).length, 2);
});
