import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { readTextManuscript } = require('../src/editor/importing/readManuscript.ts');
const { composeManuscript } = require('../src/editor/importing/composeManuscript.ts');
const { parsePageRange } = require('../src/editor/importing/readPdf.ts');
const { validateDocxArchive } = require('../src/editor/importing/validateDocx.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
const { commitManuscriptImport } = require('../src/editor/importing/commitImport.ts');
const { layoutTextFlow, parseFlowText } = require('../src/editor/layoutPartner/textWrapLayout.ts');
const { pageFrameFor, pageMarginsFor } = require('../src/editor/pageFrame/pageFrame.ts');
const { buildPublisherFooterScene } = require('../src/editor/branding/publisherFooter.ts');
const { runFullPreflightScan } = require('../src/editor/publishing/preflightEngine.ts');
const { zipSync, strToU8 } = require('fflate');
const base = () => structuredClone(useEditorStore.getState().getActiveBook());
const options = { destination: 'new', title: 'Imported draft', continuation: true, continuationTitle: '' };
const normalized = value => value.replace(/\s+/gu, '');
const contents = plan => Object.values(plan.elements).filter(el => el.type === 'body').map(el => parseFlowText(el.content.text).map(run => run.text).join('')).join('');

test('manuscript body text, Unicode and HTML literals survive import and pagination', () => {
  const original = '# Chapter 1: Existing work\n\n'+('Every existing paragraph matters. <img src=x onerror=alert(1)> తెలుగు हिन्दी. '.repeat(600))+'x'.repeat(800)+'\n\nFinal unfinished paragraph.';
  const draft = readTextManuscript(original), originalCopy = structuredClone(draft), originalBook = base();
  const plan = composeManuscript(draft, originalBook, options);
  assert.ok(plan.importedPages > 5);
  assert.equal(normalized(contents(plan)), normalized(original.replace(/^# /, '')));
  assert.deepEqual(draft, originalCopy);
  assert.equal(plan.book.pages.length, plan.importedPages + 1);
  assert.equal(plan.book.pages.at(-1).importSource, undefined);
  assert.equal(originalBook.title, useEditorStore.getState().getActiveBook().title);
  for (const el of Object.values(plan.elements)) {
    assert.equal(layoutTextFlow(el, []).oversetChars, 0, el.displayName);
    assert.ok(!el.content.text.includes('<img'));
    const page = plan.book.pages.find(page => page.id === el.pageId);
    assert.ok(el.transform.y + el.transform.height <= plan.book.dimensions.heightPt - pageMarginsFor(plan.book, page).bottomPt);
  }
});

test('tables split long cells across pages without losing content', () => {
  const cell = 'Long cell with bold details and evidence. '.repeat(400);
  const draft = { name:'Table.docx',format:'docx',mode:'editable',warnings:[], blocks:[{kind:'table', rows:[[[{text:'Name',style:{bold:true}}],[{text:'Details',style:{bold:true}}]],[[{text:'Example',style:{}}],[{text:cell,style:{bold:true}}]]]}] };
  const plan = composeManuscript(draft, base(), options);
  assert.ok(plan.importedPages > 1);
  assert.equal(normalized(contents(plan)), normalized('NameDetailsExample'+cell));
  for (const el of Object.values(plan.elements)) assert.equal(layoutTextFlow(el, []).oversetChars, 0, el.displayName);
});

test('PDF artwork is locked, aspect-preserving and has no generated border or footer', () => {
  const book = base(); book.pageFramePolicy = 'book';
  const draft = {name:'Partial.pdf',format:'pdf',mode:'artwork',warnings:[],blocks:[{kind:'page-break',sourcePage:4},{kind:'image',sourcePage:4,src:'data:image/png;base64,eA==',width:800,height:400,alt:'page 4'}]};
  const plan = composeManuscript(draft, book, { ...options, destination:'append' });
  const page = plan.book.pages[book.pages.length], image = plan.elements[page.elementIds[0]];
  assert.equal(page.importSource.sourcePage,4); assert.equal(image.locked,true);
  assert.equal(image.transform.width/image.transform.height,2);
  assert.equal(pageFrameFor(plan.book,page),undefined);
  assert.deepEqual(buildPublisherFooterScene(plan.book,page,plan.elements).nodes,[]);
  assert.deepEqual(plan.book.pages.slice(0,book.pages.length),book.pages);
  assert.ok(!runFullPreflightScan({...plan.book,pages:[page]},plan.elements).issues.some(issue => issue.severity==='error'));
});

test('page ranges are bounded, de-duplicated and ordered', () => {
  assert.deepEqual(parsePageRange('4, 1-3, 3-4',8),[1,2,3,4]);
  assert.deepEqual(parsePageRange('',3),[1,2,3]);
  for(const value of ['0','9','4-2','1-x','1,','-1','1-99999999']) assert.throws(()=>parsePageRange(value,8));
});

test('DOCX archive checks reject spoofed, truncated and over-expanding archives', () => {
  const valid = zipSync({'[Content_Types].xml':strToU8('<Types/>'),'word/document.xml':strToU8('<document/>')});
  assert.equal(validateDocxArchive(valid.buffer).entries,2);
  assert.throws(()=>validateDocxArchive(new ArrayBuffer(5)));
  assert.throws(()=>validateDocxArchive(valid.buffer.slice(0,valid.byteLength-10)));
  const spoof = zipSync({'readme.txt':strToU8('not a Word file')}); assert.throws(()=>validateDocxArchive(spoof.buffer));
  const bomb=zipSync({'[Content_Types].xml':strToU8('<Types/>'),'word/document.xml':new Uint8Array(24*1024*1024)});
  assert.throws(()=>validateDocxArchive(bomb.buffer),/safe import limit/);
});

test('new-book and append imports are atomic, undoable, and reject stale destination previews', () => {
  const before = useEditorStore.getState(), history = useHistoryStore.getState();
  const book = before.getActiveBook();
  try {
    useHistoryStore.getState().clearHistory();
    const plan = composeManuscript(readTextManuscript('Existing paragraph\n\nStill unfinished.'),book,options);
    commitManuscriptImport(plan);
    assert.equal(useEditorStore.getState().activeBookId,plan.book.id);
    assert.equal(useEditorStore.getState().books.length,before.books.length+1);
    useHistoryStore.getState().undo();
    assert.deepEqual(useEditorStore.getState().books,before.books);
    assert.equal(useEditorStore.getState().activeBookId,before.activeBookId);
    useHistoryStore.getState().redo(); assert.equal(useEditorStore.getState().activeBookId,plan.book.id);
    const latest = useEditorStore.getState().getActiveBook();
    const append = composeManuscript(readTextManuscript('Another chapter'),latest,{...options,destination:'append'});
    useEditorStore.getState().updateActiveBook({title:'Edited during review'});
    assert.throws(()=>commitManuscriptImport(append,latest),/changed during preview/);
  } finally { useEditorStore.setState(before); useHistoryStore.setState(history); }
});

test('legacy paste importer retains body paragraphs and supports undo as one operation', () => {
  const before=useEditorStore.getState(), history=useHistoryStore.getState();
  try {
    useHistoryStore.getState().clearHistory();
    const result=before.importManuscript('## Chapter 1: Partial\n### Page 1: Already written\nThis body must survive.');
    assert.ok(result.pagesAdded>0);
    const added=Object.values(useEditorStore.getState().elements).filter(el=>!before.elements[el.id]);
    assert.ok(added.some(el=>el.content.text?.includes('This body must survive.')));
    assert.equal(useHistoryStore.getState().past.length,1);
  } finally {useEditorStore.setState(before);useHistoryStore.setState(history);}
});

test('explicit line breaks and blank lines fit without clipping or changing long words', () => {
  const runs=[{text:('First line\n\nThird line\n\n\nSixth line\n'.repeat(15))+'https://example.org/'+('unbrokentext'.repeat(100)),style:{italic:true}}];
  const draft={name:'Breaks.docx',format:'docx',mode:'editable',warnings:[],blocks:[{kind:'text',runs}]};
  const plan=composeManuscript(draft,base(),options);
  assert.equal(normalized(contents(plan)),normalized(runs[0].text));
  for(const el of Object.values(plan.elements)) assert.equal(layoutTextFlow(el,[]).oversetChars,0);
});

test('imported editable pages pass shared print layout and do not trigger HTML-length overflow', () => {
  const { collectPrintPages }=require('../src/editor/publishing/publicationPrint.ts');
  const draft=readTextManuscript('# Heading\n\n'+'Evidence & reasoning with <literal> text. '.repeat(240));
  const plan=composeManuscript(draft,base(),{...options,continuation:false});
  assert.ok(collectPrintPages(plan.book,plan.elements).length>0);
  assert.deepEqual(runFullPreflightScan(plan.book,plan.elements).issues.filter(issue=>issue.severity==='error'),[]);
});

test('imported chapters round-trip through central book snapshots and keep native pages on curriculum reflow', async () => {
  const { serializeChapter, restoreChapter }=require('../src/editor/persistence/bookSnapshots.ts');
  const { composeChapter }=require('../src/editor/curriculum/chapterEngine.ts');
  const { parseChapterFramework }=await import('../../SchoolIMS/SchoolIMS-Backend/services/curriculum/chapterFrameworkSchema.js');
  const { ChapterLayoutSchema, verifyLayoutContent }=await import('../../SchoolIMS/SchoolIMS-Backend/services/curriculum/bookLayoutSchema.js');
  const plan=composeManuscript(readTextManuscript('# Chapter 1\n\nExisting text'),base(),options);
  for(const chapter of plan.book.chapters){
    const snapshot=JSON.parse(JSON.stringify(serializeChapter(plan.book,chapter,plan.elements,crypto.randomUUID(),crypto.randomUUID())));
    const {bookLayout,...semantic}=snapshot;
    assert.deepEqual(parseChapterFramework(semantic),semantic);
    assert.deepEqual(ChapterLayoutSchema.parse(bookLayout),bookLayout);verifyLayoutContent(bookLayout,semantic);
    const restored=restoreChapter(snapshot,chapter);
    assert.equal(JSON.stringify(restored.pages.map(p=>p.importSource)),JSON.stringify(plan.book.pages.filter(p=>p.chapterId===chapter.id).map(p=>p.importSource)));
    const reflow=composeChapter(plan.book,chapter,plan.elements);
    assert.deepEqual(reflow.book.pages.map(p=>p.id),plan.book.pages.map(p=>p.id));
    assert.deepEqual(reflow.elements,plan.elements);
  }
});

test('file reader rejects unsupported, empty and oversized files before loading a parser', async () => {
  const { readManuscript }=require('../src/editor/importing/readManuscript.ts');
  const settings={mode:'editable',range:''};
  await assert.rejects(readManuscript(new File(['legacy'],'draft.doc'),settings),/Legacy .doc/);
  await assert.rejects(readManuscript(new File(['<html/>'],'draft.html'),settings),/Choose a .docx/);
  await assert.rejects(readManuscript(new File([],'draft.docx'),settings),/empty/);
  await assert.rejects(readManuscript({name:'draft.pdf',size:41*1024*1024},settings),/40 MB/);
  const controller=new AbortController();controller.abort();
  await assert.rejects(readManuscript(new File(['unfinished'],'draft.txt'),{...settings,signal:controller.signal}),error=>error.name==='AbortError');
});
