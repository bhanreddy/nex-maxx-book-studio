/** Isolated browser regression: NODE_PATH must expose Playwright; no user workspace is changed. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { zipSync, strToU8 } = require('fflate');
const { jsPDF } = require('jspdf');
const root = 'artifacts/manuscript-import'; fs.mkdirSync(root, { recursive: true });
const zip = {
  '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
  '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/styles.xml': '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>',
  'word/document.xml': `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chapter 1: A work in progress</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Keep this bold passage.</w:t></w:r><w:r><w:t xml:space="preserve"> And keep the unfinished body text. తెలుగు हिन्दी.</w:t></w:r></w:p>${Array.from({length:28},(_,i)=>`<w:p><w:r><w:t>Paragraph ${i+1}. ${'Existing content must remain editable and readable. '.repeat(14)}</w:t></w:r></w:p>`).join('')}<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Topic</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Status</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Plants</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Incomplete</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:hyperlink r:id="bad"><w:r><w:t>Unsafe link becomes plain text</w:t></w:r></w:hyperlink></w:p><w:p><w:r><w:t>FINAL SOURCE SENTENCE</w:t></w:r></w:p></w:body></w:document>`,
  'word/_rels/document.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="bad" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:alert(1)" TargetMode="External"/></Relationships>',
};
zip['word/document.xml'] = zip['word/document.xml'].replace('<w:p><w:r><w:t>FINAL SOURCE SENTENCE', `<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="1143000" cy="762000"/><wp:docPr id="1" name="Sample illustration"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="Sample illustration"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="image1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1143000" cy="762000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p><w:r><w:t>FINAL SOURCE SENTENCE`);
zip['word/_rels/document.xml.rels'] = zip['word/_rels/document.xml.rels'].replace('</Relationships>', '<Relationship Id="image1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>');
const entries = Object.fromEntries(Object.entries(zip).map(([name, content])=>[name,strToU8(content)]));
entries['word/media/image1.png'] = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAHgAAABQCAIAAABd+SbeAAAAqElEQVR4nO3QAQkAIADAMAtZzWCmtIXCHTzA2Zhr60Lj+cEngQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnSrA63KnkJiKBk/AAAAAElFTkSuQmCC', 'base64'));
const docx = zipSync(entries);
fs.writeFileSync(`${root}/partial.docx`,docx);
const pdf = new jsPDF(); pdf.text('Completed opening chapter',20,30); pdf.text('This PDF body must survive extraction.',20,50); pdf.addPage(); pdf.setFillColor(40,90,130); pdf.rect(25,25,100,100,'F');
fs.writeFileSync(`${root}/partial.pdf`,Buffer.from(pdf.output('arraybuffer')));
fs.writeFileSync(`${root}/broken.docx`,Buffer.from('not a Word file'));
const browser = await chromium.launch({headless:true,...(process.env.NEX_CHROMIUM_PATH ? {executablePath:process.env.NEX_CHROMIUM_PATH}: {})});
const context = await browser.newContext({viewport:{width:1440,height:1000}}), page = await context.newPage(), errors=[];
page.on('pageerror',error=>errors.push(error.message));
const url=process.env.NEX_AUDIT_URL || 'http://localhost:3123';
async function openImport() { await page.getByRole('button',{name:'File',exact:true}).click(); await page.getByRole('button',{name:'Import & Continue…',exact:true}).click(); await page.getByRole('dialog').waitFor(); }
async function workspace() {return page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('nex_maxx_book_studio_db',1);req.onsuccess=()=>{const db=req.result,read=db.transaction('workspace').objectStore('workspace').get('active_workspace');read.onsuccess=()=>{db.close();resolve(read.result)};read.onerror=()=>reject(read.error)};req.onerror=()=>reject(req.error)}));}
try {
  await page.goto(url); await page.getByRole('textbox',{name:'Click to rename book'}).waitFor({timeout:120000});
  await openImport();
  await page.screenshot({path:`${root}/01-source.png`});
  await page.getByLabel('Choose manuscript file').setInputFiles(`${root}/broken.docx`);
  await page.getByRole('button',{name:'Preview import',exact:true}).click();
  await page.getByRole('alert').filter({hasText:/not a supported Word/}).waitFor({timeout:60000});
  await page.getByLabel('Choose manuscript file').setInputFiles(`${root}/partial.docx`);
  await page.getByLabel('Next chapter title').fill('Chapter 2: Continue the story');
  await page.getByRole('button',{name:'Preview import',exact:true}).click();
  await page.getByRole('button',{name:'Import & continue',exact:true}).waitFor({timeout:90000});
  assert.ok((await page.getByLabel('Preview imported page').locator('option').count())>2);
  assert.equal(await page.getByRole('button',{name:'Import & continue',exact:true}).isDisabled(),true);
  await page.screenshot({path:`${root}/02-word-review.png`});
  await page.getByLabel('I’ve reviewed the conversion notes and page preview.').check();
  await page.getByRole('button',{name:'Import & continue',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.querySelector('input[title="Click to rename book"]')?.value==='partial');
  await page.waitForTimeout(2000);
  const saved=await workspace(), imported=saved.books.find(book=>book.id===saved.activeBookId);
  assert.equal(imported.title,'partial'); assert.equal(imported.chapters.at(-1).title,'Chapter 2: Continue the story');
  const content=imported.pages.flatMap(p=>p.elementIds).map(id=>saved.elements[id]?.content.text||'').join(' ');
  assert.ok(content.includes('FINAL SOURCE SENTENCE')); assert.ok(content.includes('<strong>Keep this bold passage.</strong>')); assert.ok(content.includes('Incomplete'));
  assert.ok(imported.pages.flatMap(p=>p.elementIds).some(id=>saved.elements[id]?.type==='image' && saved.elements[id].content.src.startsWith('data:image/png;base64,')));
  assert.ok(!content.includes('javascript:')); assert.ok(!content.includes('<a '));
  assert.equal(imported.pages.at(-1).importSource,undefined);
  await page.screenshot({path:`${root}/03-continuation.png`});
  await page.getByTitle('Undo (Ctrl/Cmd + Z)').click(); assert.notEqual(await page.getByRole('textbox',{name:'Click to rename book'}).inputValue(),'partial');
  await page.getByTitle('Redo (Ctrl/Cmd + Shift + Z)').click();
  await page.waitForTimeout(2000); await page.reload(); await page.getByRole('textbox',{name:'Click to rename book'}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Click to rename book'}).inputValue(),'partial');
  await openImport(); await page.getByLabel('Choose manuscript file').setInputFiles(`${root}/partial.pdf`);
  await page.getByRole('button',{name:'Preview import',exact:true}).click();
  await page.getByRole('button',{name:'Import & continue',exact:true}).waitFor({timeout:90000});
  await page.getByText(/1 page\(s\) have no extractable text/).waitFor();
  assert.equal(await page.getByLabel('Preview imported page').locator('option').count(),2);
  await page.screenshot({path:`${root}/04-pdf-artwork-review.png`});
  await page.getByLabel('I’ve reviewed the conversion notes and page preview.').check(); await page.getByRole('button',{name:'Import & continue',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'}); await page.waitForTimeout(2000);
  const pdfSaved=await workspace(), pdfBook=pdfSaved.books.find(book=>book.id===pdfSaved.activeBookId);
  assert.equal(pdfBook.pages.filter(p=>p.importSource?.mode==='artwork').length,2);
  assert.equal(pdfSaved.elements[pdfBook.pages[0].elementIds[0]].locked,true);
  await openImport(); await page.getByLabel('Choose manuscript file').setInputFiles(`${root}/partial.pdf`);
  await page.getByLabel('Extract editable text').check(); await page.getByLabel('Source pages').fill('2');
  await page.getByRole('button',{name:'Preview import',exact:true}).click(); await page.getByRole('alert').filter({hasText:'no extractable text'}).waitFor({timeout:60000});
  await page.getByLabel('Source pages').fill('1'); await page.getByRole('button',{name:'Preview import',exact:true}).click();
  await page.getByRole('button',{name:'Import & continue',exact:true}).waitFor({timeout:60000});
  await page.getByText('Inspect extracted text',{exact:true}).click(); assert.ok((await page.locator('dialog pre').innerText()).includes('This PDF body must survive extraction'));
  await page.getByRole('button',{name:'Close manuscript import'}).click();
  // Narrow viewport and keyboard cancellation retain focus without touching the book.
  await openImport(); await page.setViewportSize({width:600,height:850}); await page.screenshot({path:`${root}/05-narrow.png`});
  assert.ok(await page.getByRole('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.deepEqual(errors,[]); console.log('PASS: DOCX, malformed file, text/table preservation, locked PDF artwork, scanned PDF handling, PDF ranges, continuation, undo/redo, reload, narrow layout, keyboard close.');
} finally { await browser.close(); }
