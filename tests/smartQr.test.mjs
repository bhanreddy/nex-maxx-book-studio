import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createQrArtifact,newQrToken,decodeArtifact} from '../../SchoolIMS/SchoolIMS-Backend/services/media/qrArtifact.js';
const require=createRequire(import.meta.url);
const backendRequire=createRequire(new URL('../../SchoolIMS/SchoolIMS-Backend/package.json',import.meta.url));
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {smartQrPresets,smartQrScene,smartQrPreflight,qrGeometry}=require('../src/editor/media/smartQr.ts');
const {buildPrintHtml}=require('../src/editor/publishing/publicationPrint.ts');
const {renderPublicationPdf}=require('../src/editor/educational/publicationPdf.ts');
const {jsPDF}=require('jspdf');
const env={MEDIA_LEARNING_ORIGIN:'https://learn.nexsyrus.com'};
let verified;
const fixture=async(preset='watch-and-learn')=>{verified||=await createQrArtifact(newQrToken(),{},env);const p=smartQrPresets['preset-smart-qr-'+preset];return {id:'test-qr',pageId:'page-1',type:'smart-media-qr',category:'media',version:1,displayName:p.name,locked:false,hidden:false,style:{opacity:1},transform:{x:54,y:120,...p.defaultTransform,zIndex:1},content:{smartMediaQr:{...p.defaultContent.smartMediaQr,qrId:crypto.randomUUID(),mediaResourceId:crypto.randomUUID(),description:'See how 5-digit numbers are formed.',renderArtifact:verified.artifact,checksum:verified.checksum,validation:'VALID',duration:222}}};};
test('all eight Smart QR presets remain square, print safe, and decode from actual shared print renderer',async()=>{
 for(const preset of Object.values(smartQrPresets)){const el=await fixture(preset.variant);assert.deepEqual(smartQrPreflight(el,595,842),[]);const g=qrGeometry(el),scene=smartQrScene(el);assert.equal(scene.nodes.filter(n=>n.kind==='image').length,0);const book={title:'TEST FIXTURE - no live resource',dimensions:{widthPt:595,heightPt:842},bleed:{leftPt:0,rightPt:0,topPt:0,bottomPt:0}};
  const html=buildPrintHtml(book,[{number:'1',elements:[{element:el,scene}]}],'');const start=html.indexOf('<svg xmlns='),end=html.lastIndexOf('</svg>')+6,svg=html.slice(start,end);
  // Decode at 150 DPI across the full exported page, then assert its canonical identity.
  const sharp=backendRequire('sharp');
  const {data,info}=await sharp(Buffer.from(svg)).resize(1240,1754).ensureAlpha().raw().toBuffer({resolveWithObject:true});const jsQR=backendRequire('jsqr');
  assert.equal(jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data,verified.artifact.payload);
  assert.equal(g.size,110);
 }
});
test('print preflight blocks unbound, undersized, transparent, cropped, rotated and overflowing blocks',async()=>{const el=await fixture();for(const change of [e=>delete e.content.smartMediaQr.qrId,e=>e.content.smartMediaQr.qrSize=40,e=>e.style.opacity=.5,e=>e.transform.x=1,e=>e.transform.rotation=20,e=>e.content.smartMediaQr.description='Long explanation '.repeat(30)]){const next=structuredClone(el);change(next);assert(smartQrPreflight(next,595,842).length>0);}});
test('existing vector PDF export preserves the QR as path geometry',async()=>{const el=await fixture('compact-learning'),doc=new jsPDF({unit:'pt',format:[595,842]});await renderPublicationPdf(doc,smartQrScene(el),el);const pdf=doc.output();assert(pdf.startsWith('%PDF'));assert(!pdf.includes('/Subtype /Image'));assert(pdf.length>10000);});

test('central chapter save retains QR identity but drops derived rendering data',async()=>{
 const el=await fixture('compact-learning'),{serializeChapter,restoreChapter}=require('../src/editor/persistence/bookSnapshots.ts');
 const config={grade:4,subject:'Mathematics',title:'Numbers',unit:'Numbers',theme:'Numbers',learningOutcomes:[],concepts:[]};
 const chapter={id:'chapter',pageIds:['page-1'],framework:{version:1,config,mode:'easy',sections:[],blocks:{},compositionRevision:1}};
 const book={pages:[{id:'page-1',chapterId:'chapter',pageIndex:0,displayNumber:'1',elementIds:[el.id]}]};
 const document=serializeChapter(book,chapter,{[el.id]:el},'book-id','central-chapter');
 const data=document.nativeContent[el.id].content.smartMediaQr;
 assert.equal(data.qrId,el.content.smartMediaQr.qrId);assert.equal(data.mediaResourceId,el.content.smartMediaQr.mediaResourceId);
 for(const field of ['renderArtifact','validation','checksum'])assert.equal(data[field],undefined);
 assert.equal(document.bookLayout.elements[el.id].nativeContentId,el.id);
 const restored=restoreChapter(document,chapter).elements[el.id];
 assert.equal(restored.content.smartMediaQr.qrId,data.qrId);assert.equal(restored.type,'smart-media-qr');assert.deepEqual(restored.transform,el.transform);
});
test('export rechecks authoritative QR/resource state and rejects a wrong binding',async()=>{
 const el=await fixture('compact-learning'),repository=require('../src/editor/persistence/bookRepository.ts'),old=repository.curriculumRequest;
 const {hydrateSmartQrs}=require('../src/editor/media/smartQr.ts');
 const valid={qrId:el.content.smartMediaQr.qrId,resourceId:el.content.smartMediaQr.mediaResourceId,status:'ACTIVE',resourceStatus:'ACTIVE',durationSeconds:300,artifact:verified.artifact,checksum:verified.checksum,validation:'VALID'};
 try{
  for(const patch of [{status:'PAUSED'},{status:'REVOKED'},{resourceStatus:'PAUSED'},{resourceId:crypto.randomUUID()}]){repository.curriculumRequest=async()=>({...valid,...patch});await assert.rejects(hydrateSmartQrs({[el.id]:el},595,842),/inactive|invalid resource binding/);}
  repository.curriculumRequest=async()=>valid;const exported=await hydrateSmartQrs({[el.id]:el},595,842);assert.equal(exported[el.id].content.smartMediaQr.duration,300);assert.equal(el.content.smartMediaQr.duration,222);
 }finally{repository.curriculumRequest=old;}
});
