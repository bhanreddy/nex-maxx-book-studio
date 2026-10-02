/** Production browser check for native first-page branding and offline print. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { NEX_MAXX_LOGO } = require('../src/domain/brand.ts');
const { createPageFrame } = require('../src/editor/pageFrame/pageFrame.ts');
const { chromium } = require('playwright');
const base = useEditorStore.getState().books[0];
const make = (id, pageId, type, text, y, fontSize) => ({ id, pageId, type, version: 1, category: 'text', displayName: text, locked: false, hidden: false, transform: { x: 54, y, width: 480, height: 60, rotation: 0, zIndex: 1 }, style: { fontFamily: 'Inter', fontSize, lineHeight: 1.45 }, content: { text } });
const elements = { title: make('title', 'cover', 'heading', 'Science for curious minds', 180, 22), body: make('body', 'content', 'body', 'Observe evidence. Explain your reasoning. Compare two possible answers.', 120, 11) };
const book = { ...base, id: 'logo-audit', title: 'NEX MAXX logo integration', publisherBrandingVersion: undefined, pageFramePolicy: 'custom', pageFrame: null, chapters: [], units: [], masterPages: [], pages: [{ id: 'cover', pageIndex: 0, displayNumber: 'Cover', elementIds: ['title'], status: 'Draft' }, { id: 'content', pageIndex: 1, displayNumber: '1', elementIds: ['body'], status: 'Draft', pageFrame: createPageFrame() }] };
elements.body.transform.x = 72;
elements.body.transform.width = 450;
const payload = { books: [book], activeBookId: book.id, activePageIndex: 0, elements, savedAt: new Date().toISOString() };
const browser = await chromium.launch({ headless: true, ...(process.env.NEX_CHROMIUM_PATH ? { executablePath: process.env.NEX_CHROMIUM_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(payload => { if (!localStorage.getItem('nex_maxx_book_studio_data_v1')) localStorage.setItem('nex_maxx_book_studio_data_v1', JSON.stringify(payload)); }, payload);
const logo = page.locator('#element-logo-audit-publisher-logo img');
const waitForWorkspace = async () => {
  await page.getByRole('textbox', { name: 'Click to rename book' }).waitFor();
  assert.equal(await page.getByRole('textbox', { name: 'Click to rename book' }).inputValue(), book.title);
  await logo.waitFor();
  const footer = page.locator('#page-artboard [data-publisher-footer="cover"]');
  await footer.locator('image').waitFor();
  assert.equal(await footer.locator('image').getAttribute('href'), NEX_MAXX_LOGO.src);
  assert.equal(await footer.locator('line').count(), 1);
  assert.equal(await footer.locator('text').textContent(), 'Powered by NexSyrus');
  await page.waitForFunction(() => [...document.querySelectorAll('img[src="/assets/brand/nex-maxx-logo.png"]')].every(img => img.complete && img.naturalWidth === 608));
};
try {
  await page.goto(process.env.NEX_AUDIT_URL || 'http://localhost:3108');
  await waitForWorkspace();
  assert.equal(await page.locator('header img[src="/assets/brand/nex-maxx-logo.png"]').count(), 1);
  await page.getByRole('button', { name: 'Fit page', exact: true }).click();
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/logo-first-page-editor.png' });
  await page.waitForFunction(() => new Promise(resolve => {
    const request = indexedDB.open('nex_maxx_book_studio_db', 1);
    request.onsuccess = () => { const db = request.result, read = db.transaction('workspace').objectStore('workspace').get('active_workspace');
      read.onsuccess = () => { const data = read.result, stored = data?.books?.[0]; db.close(); resolve(stored?.publisherBrandingVersion === 1 && stored.pages[0].elementIds.filter(id => data.elements[id]?.metadata?.tags?.includes('publisher-logo')).length === 1); };
    };
  }));
  await page.reload(); await waitForWorkspace();
  assert.equal(await logo.count(), 1);
  await page.waitForFunction(async () => { const cache = await caches.open('nex-book-studio-offline-v1'); return navigator.serviceWorker.controller && await cache.match('/fonts/manifest.json') && await cache.match('/assets/brand/nex-maxx-logo.png'); });
  await context.setOffline(true); await page.reload(); await waitForWorkspace();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Export Print Layout Proof' }).click();
  const proof = await popup;
  await proof.waitForFunction(() => document.querySelectorAll('section').length === 2);
  await proof.evaluate(() => document.fonts.ready);
  const printLogo = proof.locator('[data-print-frame="logo-audit-publisher-logo"] image');
  assert.match(await printLogo.getAttribute('href'), /^data:image\/png;base64,/);
  const footers = proof.locator('[data-publisher-footer="1"]');
  assert.equal(await footers.count(), 2);
  for (let i = 0; i < 2; i++) {
    assert.match(await footers.nth(i).locator('image').getAttribute('href'), /^data:image\/png;base64,/);
    assert.equal(await footers.nth(i).locator('line').count(), 1);
    assert.equal(await footers.nth(i).locator('text').textContent(), 'Powered by NexSyrus');
  }
  await proof.pdf({ path: 'artifacts/logo-first-page-proof.pdf', printBackground: true, preferCSSPageSize: true });
  assert.equal(await proof.locator('section').nth(1).locator('[data-print-frame="logo-audit-publisher-logo"]').count(), 0);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Legacy Latin-font vector proof', exact: true }).click();
  const download = await downloadEvent;
  await download.saveAs('artifacts/logo-footer-legacy-proof.pdf');
  assert.deepEqual(errors, []);
  fs.writeFileSync('artifacts/logo-integration-audit.json', JSON.stringify({ studioLogo: true, firstPageNativeImage: true, legacyMigrationPersisted: true, reloadLogoCount: 1, offlineLogo: true, offlineProofLogoEmbedded: true, firstPageLogoOnlyOnFirstPage: true, publisherFooterOnEveryPage: true, decorativeBorderFooter: true, legacyFooterExport: true, browserErrors: errors }, null, 2));
  console.log('Logo and footer passed: native first-page integration, durable recovery, offline reload and both offline PDF exports.');
} catch (error) {
  await page.screenshot({ path: 'artifacts/logo-audit-failure.png' });
  console.error((await page.locator('body').innerText()).slice(-5000)); console.error(errors); throw error;
} finally { await browser.close(); }
