import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { STARTER_PICTURES, picturePresets } = require('../src/editor/media/picturePresetCatalog.ts');
const { uploadCloudPicture, listCloudPictures, validatePictureFile, pictureElement } = require('../src/editor/media/pictureRepository.ts');
const { platformApiUrl } = require('../src/editor/persistence/platformApiUrl.ts');
const { ELEMENT_PRESETS } = require('../src/editor/registry/presets.ts');
const assetId = '4e7fb97c-c9ba-49a3-b157-59bf3b73bfd1';
const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
const file = () => new File([png], 'sample.png', { type: 'image/png' });
const result = data => new Response(JSON.stringify({ success: true, data }), { headers: {'Content-Type':'application/json'} });
const checksum = await validatePictureFile(file());
const asset = { id: assetId, title: 'Picture', revision: 1, checksum, mime_type:'image/png', size_bytes:png.length };
const revision = { asset_id:assetId, revision:1, checksum, mime_type:'image/png', size_bytes:png.length, width_px:1280, height_px:1280 };

test('all ten supplied pictures have registered presets, immutable originals and thumbnails', () => {
  assert.equal(STARTER_PICTURES.length, 10);
  assert.equal(new Set(STARTER_PICTURES.map(p=>p.checksum)).size, 10);
  for (const picture of STARTER_PICTURES) {
    const bytes = fs.readFileSync(`public${picture.src}`);
    assert.equal(bytes.readUInt32BE(16), picture.width);
    assert.equal(bytes.readUInt32BE(20), picture.height);
    assert.ok(fs.statSync(`public${picture.src.replace('.png','-thumb.webp')}`).size < 50000);
    const digest = require('node:crypto').createHash('sha256').update(bytes).digest('hex');
    assert.equal(digest, picture.checksum);
    const preset = ELEMENT_PRESETS[`preset-picture-${picture.id}`];
    assert.equal(preset, picturePresets[preset.id]);
    assert.equal(preset.defaultStyle.objectFit, 'contain');
    assert.equal(preset.defaultContent.src, picture.src);
  }
});

test('image validation rejects disguised files, SVG and oversized images before cloud writes', async () => {
  await assert.rejects(validatePictureFile(new File(['<svg/>'], 'image.png',{type:'image/png'})), /contents/);
  await assert.rejects(validatePictureFile(new File(['<svg/>'], 'image.svg',{type:'image/svg+xml'})), /PNG/);
  await assert.rejects(validatePictureFile(new File([new Uint8Array(25*1024*1024+1)], 'large.png',{type:'image/png'})), /25 MB/);
});

test('upload signs, transfers directly to storage, then verifies before returning a cloud preset', async t => {
  const calls = []; t.mock.method(globalThis,'fetch', async (url, init) => {
    calls.push({url:String(url),init});
    if(String(url).endsWith('/assets/uploads')) return result({upload_id:'upload-1',mime:'image/png',upload_url:'https://account.r2.cloudflarestorage.com/quarantine/image'});
    if(String(url).endsWith('/confirm')) return result(revision);
    return new Response(null,{status:200});
  });
  const saved = await uploadCloudPicture(file(),'Verified picture');
  assert.equal(saved.id, assetId);
  assert.deepEqual(calls.map(c=>c.init.method),['POST','PUT','POST']);
  const signed = JSON.parse(calls[0].init.body);
  assert.equal(signed.checksum, checksum); assert.equal(signed.size, png.length);
  assert.ok(calls[0].init.headers['Idempotency-Key']);
  assert.equal(calls[1].init.credentials,'omit'); assert.equal(calls[1].init.body.name,'sample.png');
  assert.equal(calls[1].init.headers.Authorization,undefined);
});

test('failed verification never reports a saved preset and retry reuses the upload request', async t => {
  const keys=[];let confirms=0;
  t.mock.method(globalThis,'fetch',async(url,init)=>{
    if(String(url).endsWith('/assets/uploads')) { keys.push(init.headers['Idempotency-Key']); return result({upload_id:'retry-upload',mime:'image/png',status:'READY'}); }
    confirms++; return result({...revision,checksum:confirms===1?'a'.repeat(64):checksum});
  });
  await assert.rejects(uploadCloudPicture(file(),'Retry picture'),/verification/);
  const saved=await uploadCloudPicture(file(),'Retry picture');
  assert.equal(saved.checksum,checksum); assert.equal(keys[0],keys[1]);
});

test('upload rejects an unexpected storage origin and preserves authorization errors', async t => {
  t.mock.method(globalThis,'fetch',async()=>result({upload_id:'wrong',mime:'image/png',upload_url:'https://attacker.example/image'}));
  await assert.rejects(uploadCloudPicture(file(),'Bad destination'),/invalid upload destination/);
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({success:false,error:'Unauthorized',code:'PLATFORM_AUTH_REQUIRED'}),{status:401}));
  await assert.rejects(uploadCloudPicture(file(),'Unauthorized picture'), error=>error.status===401&&error.code==='PLATFORM_AUTH_REQUIRED');
});

test('cloud catalogue excludes PDFs and pending uploads and keeps pagination', async t => {
  t.mock.method(globalThis,'fetch',async url=>{
    assert.ok(String(url).includes('search=reading&offset=50'));
    return result({items:[asset,{...asset,id:'ef201a79-3b61-46f7-a5bb-f9c4ef21d22e',mime_type:'application/pdf'},{...asset,revision:null}],next_offset:100});
  });
  const page=await listCloudPictures('reading',50);
  assert.deepEqual(page.items,[asset]); assert.equal(page.next_offset,100);
});

test('placing cloud pictures stores revision pins, stable URLs and original proportions',()=>{
  const element=pictureElement(asset,'page-1',4,{width:1280,height:640});
  assert.deepEqual(element.content.assetRef,{assetId,revision:1,checksum});
  assert.ok(element.content.src.startsWith('/api/curriculum/assets/'));
  assert.equal(element.transform.width,220); assert.equal(element.transform.height,110);
  assert.equal(element.style.objectFit,'contain'); assert.equal(element.content.rawWidthPx,1280);
});

test('documented service bases resolve without duplicating API path prefixes',()=>{
  for(const base of ['https://service.example','https://service.example/','https://service.example/api/v1/']) {
    assert.equal(platformApiUrl(base,'api/v1/curriculum/authoring/assets'),'https://service.example/api/v1/curriculum/authoring/assets');
    assert.equal(platformApiUrl(base,'api/super-admin/auth/login'),'https://service.example/api/super-admin/auth/login');
  }
});
