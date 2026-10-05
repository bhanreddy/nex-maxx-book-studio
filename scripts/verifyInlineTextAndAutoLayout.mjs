/** Isolated browser regression: no user workspace or browser storage is modified. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('../tests/helpers/registerTypescript.cjs');
const { chromium } = require('playwright');
const { createDefaultDemoBook } = require('../src/editor/seed/demoBook.ts');
const { book: seed } = createDefaultDemoBook();
const text = (id, y) => ({ id, pageId: 'format-page', type: 'body', category: 'text', version: 1,
  displayName: id, locked: false, hidden: false, style: { fontSize: 16, fontFamily: 'Arial', color: '#172554', lineHeight: 1.5 },
  content: { text: 'Alpha selected omega' }, transform: { x: 80, y, width: 330, height: 90, rotation: 0, zIndex: 2 } });
const a = text('format-a', 180), b = text('format-b', 330);
const group = { ...a, id: 'format-group', type: 'group', category: 'decorative', displayName: 'Formatting group', content: {}, style: {},
  childElementIds: [a.id,b.id], layoutMode: 'freeform', transform: { x: 80, y: 180, width: 330, height: 240, rotation: 0, zIndex: 3 } };
a.groupId = b.groupId = group.id;
const elements = Object.fromEntries([a,b,group].map(el => [el.id,el]));
const book = { ...seed, id: 'format-book', title: 'Inline formatting verification', pages: [{ ...seed.pages[0], id: 'format-page', chapterId: undefined, displayNumber: '1', elementIds: Object.keys(elements) }],
  autoPagination: false, chapters: [], units: [], comments: [], pageFrame: null, pageFramePolicy: 'custom' };
const browser = await chromium.launch({headless:true, ...(process.env.NEX_CHROMIUM_PATH ? { executablePath: process.env.NEX_CHROMIUM_PATH } : {})});
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 } });
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(payload => { if (!localStorage.getItem('nex_maxx_book_studio_data_v1')) localStorage.setItem('nex_maxx_book_studio_data_v1', JSON.stringify(payload)); }, { books:[book], elements, activeBookId:book.id, activePageIndex:0 });
async function saved() { return page.evaluate(() => new Promise((resolve,reject) => {
  const req=indexedDB.open('nex_maxx_book_studio_db',1);
  req.onsuccess=()=>{const db=req.result,read=db.transaction('workspace').objectStore('workspace').get('active_workspace');read.onsuccess=()=>{db.close();resolve(read.result)};read.onerror=()=>reject(read.error)};
  req.onerror=()=>reject(req.error);
})); }
async function until(predicate) { for(let i=0;i<50;i++){const data=await saved();if(data&&predicate(data))return data;await page.waitForTimeout(100)} throw new Error('Persisted workspace did not reach the expected state'); }
async function selectWord() {
  await page.locator('[contenteditable="true"]').evaluate(editor => {
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){
      const start=node.textContent.indexOf('selected');if(start<0)continue;
      const range=document.createRange();range.setStart(node,start);range.setEnd(node,start+8);
      editor.focus();const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      editor.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));break;
    }
  });
}
async function doubleClickText(id) {
  const bounds=await page.locator(`#element-${id}`).boundingBox();
  await page.mouse.dblclick(bounds.x + 30, bounds.y + 20);
  await page.getByRole('toolbar',{name:'Selected text formatting'}).waitFor();
}
const output='artifacts/inline-text-auto-layout';fs.mkdirSync(output,{recursive:true});
try {
  await page.goto(process.env.NEX_FORMAT_URL || 'http://localhost:3135');
  await page.waitForFunction(()=>document.querySelector('input[title="Click to rename book"]')?.value==='Inline formatting verification',{timeout:120000});
  await page.getByRole('button',{name:'Fit page',exact:true}).click();
  await doubleClickText('format-a');
  await selectWord();
  await page.getByLabel('Selected text font size (pt)').fill('24');
  // Repeated changes and native undo must retain the same selected word.
  await selectWord();
  await page.getByLabel('Selected text font size (pt)').fill('28');
  await page.locator('[contenteditable="true"]').press('Control+z');
  assert.match(await page.locator('[contenteditable="true"]').innerHTML(), /font-size: 24pt/);
  await selectWord();
  await page.getByTitle('Bold (Cmd+B)',{exact:true}).click();
  await page.getByTitle('Font Family',{exact:true}).click();
  await page.getByText('Georgia',{exact:true}).first().click();
  await page.getByTitle('Text Color',{exact:true}).click();
  await page.getByTitle('#e11d48',{exact:true}).first().click();
  await page.getByLabel('Selected text line height').fill('2');
  await page.getByTitle('Commit & Finish Editing (Escape or Cmd+Enter)').click();
  let data=await until(data=>data.elements[a.id].content.html);
  const html=data.elements[a.id].content.text;
  assert.match(html,/font-weight: bold/);assert.match(html,/font-size: 24pt/);assert.match(html,/Georgia/);assert.match(html,/color:/);assert.match(html,/line-height: 2/);
  const runs=await page.locator(`#element-${a.id} [data-flow-line] span`).evaluateAll(spans=>spans.map(span=>({ text:span.textContent,size:getComputedStyle(span).fontSize,family:getComputedStyle(span).fontFamily,color:getComputedStyle(span).color })));
  assert.ok(runs.some(run=>run.text.includes('selected')&&parseFloat(run.size)===32&&run.family.includes('Georgia')));
  assert.ok(runs.some(run=>run.text.includes('Alpha')&&parseFloat(run.size)<32));
  assert.equal(runs.map(run=>run.text).join('').replace(/\u00a0/g,' '), 'Alpha selected omega');
  await page.screenshot({path:`${output}/01-selected-word.png`});
  // A selected group has an overlay: double-click still enters the child text editor.
  const secondBounds = await page.locator(`#element-${b.id}`).boundingBox();
  await page.mouse.click(secondBounds.x + 30, secondBounds.y + 20);
  await doubleClickText('format-b');
  await selectWord();await page.getByLabel('Selected text font size (pt)').fill('20');
  await page.getByTitle('Commit & Finish Editing (Escape or Cmd+Enter)').click();
  await page.getByLabel('Group auto layout direction').selectOption('vertical');
  await page.getByLabel('Auto layout gap (pt)').fill('20');
  data=await until(data=>data.elements[group.id].adaptiveGroup?.spacingPt===20);
  assert.equal(data.elements[b.id].transform.y,data.elements[a.id].transform.y+data.elements[a.id].transform.height+20);
  await page.getByLabel('Group auto layout direction').selectOption('horizontal');
  data=await until(data=>data.elements[group.id].adaptiveGroup.direction==='horizontal');
  assert.equal(data.elements[b.id].transform.x,data.elements[a.id].transform.x+data.elements[a.id].transform.width+20);
  await page.getByTitle('Undo (Ctrl/Cmd + Z)').click();
  data=await until(data=>data.elements[group.id].adaptiveGroup.direction==='vertical');
  await page.getByLabel('Group auto layout direction').selectOption('off');
  const off=await until(data=>data.elements[group.id].layoutMode==='freeform');
  await page.screenshot({path:`${output}/02-optional-layout.png`});
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('input[title="Click to rename book"]')?.value==='Inline formatting verification');
  data=await saved();assert.equal(data.elements[group.id].layoutMode,'freeform');assert.equal(data.elements[a.id].content.text,off.elements[a.id].content.text);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['partial font size, font, bold, colour and leading','unselected words retain their size','editing text inside a selected group','optional vertical and horizontal layout','gap, undo and disable','reload persistence'],screenshots:output}));
} catch(error){await page.screenshot({path:`${output}/failure.png`});throw error;} finally { await browser.close(); }
