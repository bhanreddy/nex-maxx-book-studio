import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createDefaultDemoBook } = require('../src/editor/seed/demoBook.ts');
const { makeCurriculumBlock, generateFramework, composeChapter, DEFAULT_CHAPTER_CONFIG } = require('../src/editor/curriculum/chapterEngine.ts');
const { createPageFrame, pageMarginsFor } = require('../src/editor/pageFrame/pageFrame.ts');
const { fitReadingContentInsideFrame } = require('../src/editor/pageFrame/fitReadingContent.ts');
const { recoverMissingPageElements } = require('../src/editor/publishing/exportRecovery.ts');
const { prepareCompleteExportBook } = require('../src/editor/publishing/exportBook.ts');
const { serializeChapter } = require('../src/editor/persistence/bookSnapshots.ts');
const { documentSignature } = require('../src/editor/persistence/cloudSaveController.ts');
const { buildPublicationScene, expandSceneText } = require('../src/editor/educational/publicationScene.ts');
const { runFullPreflightScan } = require('../src/editor/publishing/preflightEngine.ts');
const { refreshPublishingLayout } = require('../src/editor/educational/library/refreshLayout.ts');
function fixture() {
  const book = createDefaultDemoBook().book;
  book.id = crypto.randomUUID(); book.pages = []; book.chapters = []; book.masterPages = [];
  book.pageFrame = createPageFrame(); book.pageFramePolicy = 'book';
  const id = crypto.randomUUID(), config = { ...DEFAULT_CHAPTER_CONFIG, pageCount: 3 };
  const chapter = { id, unitId: 'u', number: 1, title: config.title, learningObjectives: [], pageIds: [], framework: generateFramework(config, id) };
  book.chapters = [chapter];
  return composeChapter(book, chapter, {});
}
function body(id, pageId, y, height = 40) {
  return { id, pageId, type: 'body', category: 'text', version: 1, displayName: id, hidden: false, locked: false,
    transform: { x: 150, y, width: 300, height, rotation: 0, zIndex: 2 }, style: { fontSize: 11, fontFamily: 'Noto Sans' }, content: { text: 'This must remain visible above the border.' } };
}
function text(scene) { return scene.nodes.flatMap(expandSceneText).filter(n => n.kind === 'text').map(n => n.text).join(' '); }

test('missing unsliced canonical records recover without overwriting edits or inventing unknown records', () => {
  const result = fixture(), page = result.pages[0], id = page.elementIds[0];
  const original = result.elements[id], elements = { ...result.elements }; delete elements[id];
  const before = JSON.stringify({ book: result.book, elements });
  const restored = recoverMissingPageElements(result.book, elements);
  assert.equal(text(buildPublicationScene(restored[id].smartBlockData)), text(buildPublicationScene(original.smartBlockData)));
  assert.equal(restored[id].pageId, page.id);
  assert.equal(JSON.stringify({ book: result.book, elements }), before);
  const edited = { ...restored[id], displayName: 'Current edit' };
  assert.equal(recoverMissingPageElements(result.book, { ...restored, [id]: edited })[id], edited);
  page.elementIds.push('unknown');
  assert.equal(recoverMissingPageElements(result.book, restored).unknown, undefined);
  assert.ok(runFullPreflightScan(result.book, restored).issues.some(issue => issue.id === 'missing-element-unknown'));
});

test('selected-page export restores missing native artwork from a cached chapter while preserving current text', async () => {
  const result = fixture(), page = result.pages[0], id = crypto.randomUUID();
  const saved = body(id, page.id, 500); result.elements[id] = saved; page.elementIds.push(id);
  const snapshot = serializeChapter(result.book, result.chapter, result.elements, result.book.id, result.chapter.id);
  const storage = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  storage.set(`nex_maxx_cloud_recovery_v1:${result.chapter.id}`, JSON.stringify({
    target: { bookId: result.book.id, masterChapterId: result.chapter.id, curriculumVersionId: 'v' },
    base: { revision: 1, edit_version: 1, checksum: 'a' }, document: snapshot, acknowledged: documentSignature(snapshot)
  }));
  try {
    const current = { ...result.elements }; delete current[id];
    const currentId = page.elementIds[0]; current[currentId] = { ...current[currentId], displayName: 'Latest unsaved text' };
    const exported = await prepareCompleteExportBook(result.book, current, new Set([page.id]));
    assert.deepEqual(exported.elements[id], saved);
    assert.equal(exported.elements[currentId], current[currentId]);
    assert.deepEqual(exported.book.pages, result.book.pages);
    assert.equal(current[id], undefined);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});

test('a first-page reading frame under the wave moves into clear space without changing text or reading size', () => {
  const { book } = fixture(); const page = book.pages[0]; book.pages = [{ ...page, elementIds: ['aim', 'above', 'art'] }];
  const margins = pageMarginsFor(book, page), bottom = book.dimensions.heightPt - margins.bottomPt;
  const aim = body('aim', page.id, book.dimensions.heightPt - 50), above = body('above', page.id, bottom - 130);
  const art = { ...body('art', page.id, 760), type: 'shape', category: 'decorative' };
  const elements = { aim, above, art }, before = JSON.stringify({ book, elements });
  const fitted = fitReadingContentInsideFrame(book, elements);
  assert.ok(fitted.changed); assert.equal(fitted.book.pages.length, 1);
  assert.ok(fitted.elements.aim.transform.y + aim.transform.height <= bottom);
  assert.equal(fitted.elements.aim.content, aim.content); assert.equal(fitted.elements.aim.style, aim.style);
  assert.equal(fitted.elements.above, above); assert.equal(fitted.elements.art, art);
  assert.equal(JSON.stringify({ book, elements }), before);
  assert.equal(fitReadingContentInsideFrame(fitted.book, fitted.elements).changed, false);
  const refreshed = refreshPublishingLayout(book, elements);
  assert.ok(refreshed.changed); assert.ok(refreshed.elements.aim.transform.y + aim.transform.height <= bottom);
});

test('when no gap remains, overflow gets a continuation page in the same chapter', () => {
  const { book } = fixture(), page = book.pages[0]; book.pages = [{ ...page, elementIds: ['filled', 'aim'] }];
  const margins = pageMarginsFor(book, page), available = book.dimensions.heightPt - margins.topPt - margins.bottomPt;
  const elements = { filled: body('filled', page.id, margins.topPt, available), aim: body('aim', page.id, book.dimensions.heightPt - 30) };
  const fitted = fitReadingContentInsideFrame(book, elements, new Set([page.id]));
  assert.equal(fitted.book.pages.length, 2); assert.equal(fitted.book.pages[0].elementIds.includes('aim'), false);
  const continuation = fitted.book.pages[1]; assert.ok(fitted.continuationPageIds.has(continuation.id));
  assert.equal(continuation.chapterId, page.chapterId); assert.ok(fitted.book.chapters[0].pageIds.includes(continuation.id));
  assert.equal(fitted.elements.aim.pageId, continuation.id); assert.equal(fitted.elements.aim.transform.y, margins.topPt);
});

test('long smart blocks split above the border and preserve every text line at its original size', () => {
  const { book } = fixture(), page = book.pages[0];
  const block = makeCurriculumBlock('reading-passage', DEFAULT_CHAPTER_CONFIG);
  block.semanticContent.passage = Array.from({ length: 140 }, (_, i) => `Marker${i} This sentence stays readable.`).join(' ');
  const margins = pageMarginsFor(book, page);
  block.transform = { ...block.transform, x: margins.insidePt, y: margins.topPt, width: book.dimensions.widthPt - margins.insidePt - margins.outsidePt, height: 0 };
  const scene = buildPublicationScene(block); block.transform.height = scene.height;
  const element = { ...body(block.id, page.id, margins.topPt), type: 'smart-block', category: 'educational', smartBlockData: block, transform: block.transform };
  book.pages = [{ ...page, elementIds: [element.id] }];
  const fitted = fitReadingContentInsideFrame(book, { [element.id]: element });
  assert.ok(fitted.continuationPageIds.size > 1);
  const parts = fitted.book.pages.flatMap(p => p.elementIds).map(id => fitted.elements[id]);
  const printed = parts.map(el => buildPublicationScene(el.smartBlockData));
  assert.equal(printed.map(text).join(' '), text(scene));
  for (const el of parts) assert.ok(el.transform.y + el.transform.height <= book.dimensions.heightPt - margins.bottomPt + .1);
  assert.deepEqual(printed.flatMap(s => s.nodes).filter(n => n.kind === 'text').map(n => n.size), scene.nodes.flatMap(expandSceneText).filter(n => n.kind === 'text').map(n => n.size));
});
