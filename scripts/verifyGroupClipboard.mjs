/** Isolated UI regression. NODE_PATH must expose Playwright; user browser storage is untouched. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('../tests/helpers/registerTypescript.cjs');
const { chromium } = require('playwright');
const { createDefaultDemoBook } = require('../src/editor/seed/demoBook.ts');
const { book: seed } = createDefaultDemoBook();
const element = (id, x, y, type = 'shape', zIndex = 2) => ({ id, pageId: 'clipboard-source', type, category: 'decorative', version: 1,
  displayName: id, locked: false, hidden: false, content: type === 'shape' ? { shapeType: 'rectangle' } : { text: 'Editable group text' },
  style: { backgroundColor: '#c7d2fe', color: '#172554', fontSize: 16 }, transform: { x, y, width: 90, height: 60, rotation: 0, zIndex } });
const a = element('clipboard-a', 80, 220), b = element('clipboard-b', 210, 220, 'shape', 3), c = element('clipboard-c', 80, 320, 'body', 4);
const inner = { ...element('clipboard-inner', 80, 220, 'group', 5), content: {}, childElementIds: [a.id,b.id], groupId: 'clipboard-outer', transform: { x: 80, y: 220, width: 220, height: 60, rotation: 0, zIndex: 5 } };
const outer = { ...element('clipboard-outer', 80, 220, 'group', 6), content: {}, childElementIds: [inner.id,c.id], transform: { x: 80, y: 220, width: 220, height: 160, rotation: 0, zIndex: 6 } };
a.groupId = b.groupId = inner.id; c.groupId = outer.id;
const elements = Object.fromEntries([a,b,c,inner,outer].map(el => [el.id,el]));
const pages = ['clipboard-source','clipboard-target','clipboard-third'].map((id,i) => ({ ...seed.pages[0], id, pageIndex: i, displayNumber: String(i+1), chapterId: undefined, elementIds: i ? [] : Object.keys(elements) }));
const book = { ...seed, id: 'clipboard-ui-book', title: 'Group clipboard verification', pages, chapters: [], units: [], comments: [], pageFrame: null, pageFramePolicy: 'custom' };
const payload = { books: [book], elements, activeBookId: book.id, activePageIndex: 0 };
const browser = await chromium.launch({ headless: true, ...(process.env.NEX_CHROMIUM_PATH ? { executablePath: process.env.NEX_CHROMIUM_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 } });
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(payload => {
  if (!localStorage.getItem('nex_maxx_book_studio_data_v1')) localStorage.setItem('nex_maxx_book_studio_data_v1', JSON.stringify(payload));
}, payload);
async function saved() { return page.evaluate(() => new Promise((resolve,reject) => {
  const req = indexedDB.open('nex_maxx_book_studio_db',1);
  req.onsuccess = () => { const db=req.result, read=db.transaction('workspace').objectStore('workspace').get('active_workspace'); read.onsuccess=()=>{db.close();resolve(read.result)}; read.onerror=()=>reject(read.error); };
  req.onerror=()=>reject(req.error);
})); }
async function until(predicate) {
  for (let i=0;i<40;i++) { const data=await saved(); if(data && predicate(data)) return data; await new Promise(resolve=>setTimeout(resolve,150)); }
  throw new Error('Workspace did not reach the expected persisted state');
}
const output = 'artifacts/group-clipboard'; fs.mkdirSync(output,{recursive:true});
try {
  await page.goto(process.env.NEX_CLIPBOARD_URL || 'http://localhost:3135');
  await page.getByRole('textbox',{name:'Click to rename book'}).waitFor({timeout:120000});
  await page.waitForFunction(() => document.querySelector('input[title="Click to rename book"]')?.value === 'Group clipboard verification');
  await page.getByRole('button',{name:'Fit page',exact:true}).click();
  await page.locator('#element-clipboard-a').click({button:'right'});
  await page.getByRole('button',{name:/Copy Group/}).click();
  await page.getByLabel('Paste destination page').selectOption('clipboard-target');
  await page.getByTitle('Paste selection on the chosen page (⌘/Ctrl+V)').click();
  let data = await until(data=>data.books[0].pages.find(p=>p.id==='clipboard-target').elementIds.length===5);
  const target = data.books[0].pages.find(p=>p.id==='clipboard-target');
  assert.equal(data.books[0].pages.find(p=>p.id==='clipboard-source').elementIds.filter(id=>Object.keys(elements).includes(id)).length,5);
  const copiedRoot = target.elementIds.find(id=>data.elements[id]?.displayName==='clipboard-outer');
  assert.ok(copiedRoot && copiedRoot !== outer.id); assert.equal(data.elements[copiedRoot].childElementIds.length,2);
  assert.equal(data.elements[copiedRoot].transform.x,80); assert.equal(data.elements[copiedRoot].transform.y,220);
  await page.screenshot({path:`${output}/01-copied-to-page.png`});
  // Navigate back, cut with the keyboard, then paste after selecting a different page.
  await page.getByRole('button',{name:'Go to page 1',exact:true}).click();
  await page.locator('#element-clipboard-a').click();
  await page.keyboard.press('Control+x');
  await page.getByText('Ready to move',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Go to page 3',exact:true}).click();
  await page.keyboard.press('Control+v');
  data = await until(data=>data.elements[outer.id]?.pageId==='clipboard-third');
  for (const id of Object.keys(elements)) assert.equal(data.elements[id].pageId,'clipboard-third');
  assert.ok(data.books[0].pages.find(p=>p.id==='clipboard-source').elementIds.every(id=>!elements[id]));
  assert.equal(await page.getByLabel('Paste destination page').count(),0);
  await page.screenshot({path:`${output}/02-cut-to-page.png`});
  await page.getByTitle('Undo (Ctrl/Cmd + Z)').click();
  data=await until(data=>data.elements[outer.id]?.pageId==='clipboard-source');
  assert.equal(data.books[0].pages[data.activePageIndex].id,'clipboard-source');
  await page.getByTitle('Redo (Ctrl/Cmd + Shift + Z)').click();
  data=await until(data=>data.elements[outer.id]?.pageId==='clipboard-third');
  // Cancel a pending cut with Escape, without deleting anything.
  await page.getByRole('button',{name:'Cut',exact:true}).click();
  await page.getByText('Ready to move',{exact:true}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByText('Ready to move',{exact:true}).waitFor({state:'hidden',timeout:3000});
  // Copy with the keyboard and use the context menu's actual clicked coordinates.
  await page.locator('#element-clipboard-a').click();
  await page.keyboard.press('Control+c');
  await page.getByRole('button',{name:'Go to page 2',exact:true}).click();
  const artboard=page.locator('#page-artboard');
  await artboard.click({button:'right',position:{x:210,y:390}});
  await page.getByRole('button',{name:/Paste Here/}).click();
  data=await until(data=>data.books[0].pages.find(p=>p.id==='clipboard-target').elementIds.length===10);
  const pasted = data.books[0].pages.find(p=>p.id==='clipboard-target').elementIds.filter(id=>!target.elementIds.includes(id));
  const root = pasted.map(id=>data.elements[id]).find(el=>el.displayName==='clipboard-outer');
  assert.ok(Math.abs(root.transform.x-80)>5 || Math.abs(root.transform.y-220)>5);
  // Reload confirms both copied and moved groups survived a real durable write.
  await page.reload(); await page.getByRole('textbox',{name:'Click to rename book'}).waitFor();
  await page.getByRole('button',{name:'Go to page 3',exact:true}).click();
  await page.locator('#element-clipboard-a').waitFor();
  assert.equal(await page.locator('#element-clipboard-b').count(),1);
  await page.screenshot({path:`${output}/03-reloaded.png`});
  assert.deepEqual(errors,[]);
  const result={nestedGroupCopy:true,destinationPicker:true,keyboardCutPaste:true,sourceCleanup:true,atomicUndoRedo:true,escapeCancelsCut:true,pasteHere:true,durableReload:true,browserErrors:errors};
  fs.writeFileSync(`${output}/verification.json`,JSON.stringify(result,null,2)); console.log(JSON.stringify(result));
} catch(error) { await page.screenshot({path:`${output}/failure.png`}); console.error((await page.locator('body').innerText()).slice(-3500)); throw error; }
finally { await browser.close(); }
