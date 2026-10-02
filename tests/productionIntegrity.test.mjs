import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { embedFooterFixture } from './helpers/printFixtures.mjs';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { createDefaultDemoBook } = require('../src/editor/seed/demoBook.ts');
const { repaginateFromPage } = require('../src/editor/core/paginationEngine.ts');
const { propagateMasterToPage, MASTER_PAGE_PRESETS } = require('../src/editor/layout/masterPageEngine.ts');
const { propagateGlobalTokensToBook, DEFAULT_DESIGN_TOKENS } = require('../src/domain/theme/globalTokens.ts');
const { synchronizeBookStructure } = require('../src/editor/structure/bookStructureEngine.ts');
const { renumberBookPages } = require('../src/editor/core/pageNumbering.ts');
const { selectExportPages } = require('../src/editor/publishing/exportScope.ts');
const { runFullPreflightScan } = require('../src/editor/publishing/preflightEngine.ts');
const { publicationSceneForElement } = require('../src/editor/educational/publicationPdf.ts');
const { createSmartComponentElement } = require('../src/editor/educational/smartComponentFactory.ts');
const { EDUCATIONAL_BLOCK_REGISTRY } = require('../src/editor/educational/blockRegistry.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { commitDocumentChange } = require('../src/editor/core/documentTransaction.ts');
const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
const { pageMarginsFor } = require('../src/editor/pageFrame/pageFrame.ts');
function fixture(count = 220) {
  const base = createDefaultDemoBook().book, elements = {}, pages = [];
  for (let i=0; i<count; i++) {
    const id = `p-${i}`, element = { id: `e-${i}`, pageId: id, type: 'body', category: 'text', version: 1, displayName: `Reading ${i}`, locked: false, hidden: false, transform: { x: 60, y: 80, width: 450, height: 80, rotation: 0, zIndex: 1 }, style: { fontFamily: 'Inter', fontSize: 11, lineHeight: 1.45 }, content: { text: `Publication page ${i+1}. Every learner can explain and apply this concept.` } };
    elements[element.id] = element;
    pages.push({ id, pageIndex: i, displayNumber: String(i+1), chapterId: i < 110 ? 'c-1' : 'c-2', elementIds: [element.id], status: 'Draft' });
  }
  const chapters = [1,2].map(number => ({ id:`c-${number}`, unitId:'u', number, title:`Chapter ${number}`, learningObjectives:[], pageIds:pages.filter(p=>p.chapterId===`c-${number}`).map(p=>p.id) }));
  return { book:{ ...base, id:'integrity', pages, chapters, units:[{id:'u',number:1,title:'Unit',chapterIds:chapters.map(c=>c.id)}], masterPages:[] }, elements };
}
function freeze(value) { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('220 pages: incremental flow preserves prefix identity, pinned artwork and original input', () => {
  const { book, elements } = fixture();
  elements['e-179'] = { ...elements['e-179'], transform:{...elements['e-179'].transform,y:760,height:80} };
  const art = { ...elements['e-179'],id:'art',type:'shape',locked:true,transform:{...elements['e-179'].transform,y:700},content:{} };
  book.pages[179].elementIds.push('art'); elements.art=art;
  const original=JSON.stringify({book,elements}); freeze(book); freeze(elements);
  const result=repaginateFromPage(book,elements,179);
  assert.equal(JSON.stringify({book,elements}),original);
  assert.equal(result.updatedPages[178],book.pages[178]);
  assert.equal(result.updatedElements.art,art);
  assert.ok(result.affectedPageIds.length <= 3);
  assert.equal(result.updatedElements['e-179'].pageId,'p-180');
  assert.equal(result.overflowResolved,true);
  const repeated=repaginateFromPage({...book,pages:result.updatedPages},result.updatedElements,179);
  assert.equal(repeated.elementsMovedCount,0);
});

test('oversized keep-together blocks terminate and disabled page creation never loses content', () => {
  const { book, elements }=fixture(1); const element=elements['e-0'];
  elements['e-0']={...element,type:'table',transform:{...element.transform,height:1500}};
  const oversized=repaginateFromPage(book,elements);
  assert.equal(oversized.updatedPages.length,1); assert.equal(oversized.overflowResolved,false); assert.deepEqual(oversized.unresolvedElementIds,['e-0']);
  elements['e-0']={...element,transform:{...element.transform,y:800,height:50}};
  const disabled=repaginateFromPage(book,elements,0,{autoCreatePages:false});
  assert.deepEqual(disabled.updatedPages[0].elementIds,['e-0']); assert.equal(disabled.overflowResolved,false);
});

test('plain text continuation is deterministic and preserves every character', () => {
  const { book,elements }=fixture(1); const text='Measured learning content with Unicode café.\n'.repeat(90);
  elements['e-0']={...elements['e-0'],content:{text},transform:{...elements['e-0'].transform,y:500,height:2000}};
  const first=repaginateFromPage(book,elements), second=repaginateFromPage(book,elements);
  assert.deepEqual(first,second);
  assert.equal(first.overflowResolved,true);
  const fragments=first.updatedPages.flatMap(page=>page.elementIds.map(id=>first.updatedElements[id].content.text));
  assert.equal(fragments.join(''),text);
  assert.ok(first.updatedPages.length < 15);
});

test('master propagation never mutates inputs; updates footer, right folio and removes obsolete furniture', () => {
  const { book,elements }=fixture(1); const page=freeze(book.pages[0]);
  const master={...MASTER_PAGE_PRESETS.Exercise,type:'Exercise',pageNumberPosition:'right',footerText:'Workbook'};
  const applied=propagateMasterToPage(master,page,elements,book);
  assert.deepEqual(page.elementIds,['e-0']);
  assert.equal(applied.updatedElements['master-footer-p-0'].content.text,'Workbook');
  assert.equal(applied.updatedElements['master-folio-p-0'].style.textAlign,'right');
  const customized={...applied.updatedElements,'master-footer-p-0':{...applied.updatedElements['master-footer-p-0'],metadata:{tags:['master-footer'],styleOverride:true},content:{text:'Local exception'}}};
  const changed=propagateMasterToPage({...master,type:'ChapterOpen',showPageNumber:false,footerText:''},applied.page,customized,book);
  assert.ok(!changed.page.elementIds.includes('master-hdr-p-0')); assert.ok(!changed.page.elementIds.includes('master-folio-p-0'));
  assert.equal(changed.updatedElements['master-footer-p-0'].content.text,'Local exception');
});

test('global style cascade persists scale and isolates another book and explicit overrides', () => {
  const {book,elements}=fixture(3); elements.foreign={...elements['e-0'],id:'foreign',pageId:'foreign-page'};
  elements['e-1']={...elements['e-1'],metadata:{styleOverride:true}};
  const tokens=structuredClone(DEFAULT_DESIGN_TOKENS); tokens.typography.scale.body=14;
  const result=propagateGlobalTokensToBook(tokens,book,elements);
  assert.equal(result.updatedElements.foreign,elements.foreign); assert.equal(result.updatedElements['e-1'],elements['e-1']);
  assert.equal(result.updatedElements['e-0'].style.fontSize,14); assert.equal(result.updatedBook.globalTokens.typography.scale.body,14);
  assert.equal(result.updatedBook.themeId,book.themeId);
});

test('cross references stay live through page reorder and direct edits; broken targets remain detectable', () => {
  const {book,elements}=fixture(220); elements['e-0']={...elements['e-0'],content:{text:'See {ref:page:p-180}; {ref:chapter:c-2}; {ref:missing}.'}};
  const first=synchronizeBookStructure(book,elements); assert.match(first.updatedElements['e-0'].content.text,/Page 181/);
  const reordered={...first.updatedBook,pages:[first.updatedBook.pages[180],...first.updatedBook.pages.filter(page=>page.id!=='p-180')]};
  const second=synchronizeBookStructure(reordered,first.updatedElements); assert.match(second.updatedElements['e-0'].content.text,/Page 1;/);
  assert.match(second.updatedElements['e-0'].content.text,/\{ref:missing\}/);
  const edited={...second.updatedElements,'e-0':{...second.updatedElements['e-0'],content:{text:'Author replacement'}}};
  assert.equal(synchronizeBookStructure(second.updatedBook,edited).updatedElements['e-0'].content.text,'Author replacement');
  assert.ok(runFullPreflightScan(second.updatedBook,second.updatedElements).issues.some(issue=>issue.id.startsWith('broken-reference')));
});

test('front-matter numbering survives autosave and starts at i without a cover', () => {
  const {book}=fixture(4); book.numbering='front-matter'; book.pages[0]={...book.pages[0],chapterId:undefined}; book.chapters[0].pageIds=book.chapters[0].pageIds.filter(id=>id!=='p-0');
  const numbered=renumberBookPages(book); assert.equal(numbered.pages[0].displayNumber,'i'); assert.equal(numbered.pages[1].displayNumber,'1');
  assert.equal(renumberBookPages(numbered),numbered);
});

test('export scopes reject invalid/empty ranges and retain physical ordering without duplicates', () => {
  const {book}=fixture();
  for (const input of ['', 'nonsense','0','221','8-2','1.5','1-3-5']) assert.throws(()=>selectExportPages(book,'selected','',input));
  assert.deepEqual(selectExportPages(book,'selected','','180-182, 1, 180').map(p=>p.id),['p-0','p-179','p-180','p-181']);
  assert.throws(()=>selectExportPages(book,'chapter','missing')); assert.equal(selectExportPages(book,'chapter','c-2').length,110);
});

test('all ten smart factories resolve registered presets and content-derived geometry', () => {
  const types=['learning-outcomes','activity','quick-check','think','vocabulary','fun-fact','worked-example','practice','qr-video','assessment'];
  for(const type of types){const el=createSmartComponentElement(type,'p',{customTitle:'Actual lesson content'}); if(type==='qr-video'){assert.equal(el.type,'smart-media-qr');assert.equal(el.content.smartMediaQr.qrId,'');continue;} assert.ok(EDUCATIONAL_BLOCK_REGISTRY[el.smartBlockData.presetId]); assert.equal(el.smartBlockData.semanticContent.title,'Actual lesson content'); assert.equal(publicationSceneForElement(el).height,el.transform.height);}
});

test('production operations undo and redo atomically, including references', () => {
  const {book,elements}=fixture(220); useEditorStore.setState({books:[book],activeBookId:book.id,elements,activePageIndex:179}); useHistoryStore.getState().clearHistory();
  const styled=propagateGlobalTokensToBook(DEFAULT_DESIGN_TOKENS,book,elements); commitDocumentChange('Book style',styled.updatedBook,styled.updatedElements);
  assert.equal(useHistoryStore.getState().past.length,1); useHistoryStore.getState().undo(); assert.equal(useEditorStore.getState().elements,elements); useHistoryStore.getState().redo(); assert.ok(useEditorStore.getState().getActiveBook().globalTokens);
});

test('400-page valid book scans without false furniture overflow; missing fonts, assets and overset fail', () => {
  const {book,elements}=fixture(400); const baseline=runFullPreflightScan(book,elements); assert.equal(baseline.errorCount,0); assert.equal(baseline.metrics.totalPages,400);
  elements['e-180']={...elements['e-180'],isOverset:true,style:{...elements['e-180'].style,fontFamily:'UnbundledFont'}};
  elements['e-181']={...elements['e-181'],type:'image',content:{}};
  const failed=runFullPreflightScan(book,elements); assert.ok(failed.errorCount >= 3); assert.ok(failed.metrics.textOverflowCount>0);
});

test('editing overflowing text auto-flows as one reversible document operation', () => {
  const {book,elements}=fixture(220); book.autoPagination=true;
  const safeBottom = book.dimensions.heightPt - pageMarginsFor(book, book.pages[179]).bottomPt;
  elements['e-179']={...elements['e-179'],transform:{...elements['e-179'].transform,y:safeBottom - 50}};
  useEditorStore.setState({books:[book],activeBookId:book.id,elements,activePageIndex:179}); useHistoryStore.getState().clearHistory();
  const text='Each learner observes, reasons and explains the evidence. '.repeat(80);
  useEditorStore.getState().updateElementContent('e-179',{text});
  assert.equal(useHistoryStore.getState().past.length,1);
  const flowed=useEditorStore.getState();
  assert.equal(flowed.books[0].pages[178],book.pages[178]);
  assert.ok(flowed.elements['e-179'].content.text.length < text.length);
  const continuations=flowed.books[0].pages.flatMap(page=>page.elementIds.map(id=>flowed.elements[id]).filter(el=>/^(?:flow-)*e-179(?:-\d+)?$/.test(el.id)));
  assert.equal(continuations.map(el=>el.content.text).join(''),text);
  useHistoryStore.getState().undo(); assert.deepEqual(useEditorStore.getState().elements,elements);
  useHistoryStore.getState().redo(); assert.deepEqual(useEditorStore.getState().elements,flowed.elements);
});

test('linked smart geometry tokens resize measured scenes and preflight finds missing smart fonts', () => {
  const {book,elements}=fixture(1);
  const smart=createSmartComponentElement('vocabulary','p-0',{x:60,y:200});
  book.pages[0].elementIds.push(smart.id);elements[smart.id]=smart;
  const tokens=structuredClone(DEFAULT_DESIGN_TOKENS); tokens.spacing.md=24;tokens.spacing.sm=18;tokens.shadows.subtle='none';
  const result=propagateGlobalTokensToBook(tokens,book,elements),updated=result.updatedElements[smart.id];
  assert.equal(updated.smartBlockData.styleOverrides.paddingPt,24);
  assert.equal(updated.smartBlockData.styleOverrides.spacingPt,18);
  assert.equal(updated.style.boxShadow,'none');
  assert.equal(publicationSceneForElement(updated).height,updated.transform.height);
  updated.smartBlockData.styleOverrides.fontFamily='MissingSmartFont';
  assert.ok(runFullPreflightScan(result.updatedBook,result.updatedElements).issues.some(issue=>issue.category==='font'&&issue.severity==='error'));
});

test('master furniture prints real aligned folios without duplicate or hidden default numbers', () => {
  const {book,elements}=fixture(1);
  const master={...MASTER_PAGE_PRESETS.Exercise,type:'Exercise',pageNumberPosition:'right',footerText:'Workbook'};
  const applied=propagateMasterToPage(master,book.pages[0],elements,book);
  const linked={...book,pages:[applied.page],masterPages:[master]};
  const pages=collectPrintPages(linked,applied.updatedElements);
  const folio=pages[0].elements.find(item=>item.element.type==='pageNumber');
  assert.equal(folio.scene.nodes[0].text,'1'); assert.equal(folio.scene.nodes[0].align,'end');
  const html=buildPrintHtml(linked,embedFooterFixture(pages),'');
  assert.ok(!html.includes('data-default-folio')); assert.ok(!html.includes('data-default-footer'));
  const hidden=propagateMasterToPage({...master,type:'ChapterOpen',showPageNumber:false,footerText:''},applied.page,applied.updatedElements,linked);
  const opening={...linked,pages:[hidden.page],masterPages:[{...master,type:'ChapterOpen',showPageNumber:false}]};
  assert.ok(!buildPrintHtml(opening,embedFooterFixture(collectPrintPages(opening,hidden.updatedElements)),'').includes('data-default-folio'));
});
