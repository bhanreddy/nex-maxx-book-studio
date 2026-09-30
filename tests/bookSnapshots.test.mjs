import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
const engine=require('../src/editor/curriculum/chapterEngine.ts');
const {serializeChapter,serializeBook,restoreChapter,restoreBookMetadata}=require('../src/editor/persistence/bookSnapshots.ts');
const {assetRenderUrl}=require('../src/editor/persistence/assetReferences.ts');
const {CloudSaveController,documentSignature}=require('../src/editor/persistence/cloudSaveController.ts');
const wire=value=>JSON.parse(JSON.stringify(value));

test('a generated book round-trips content, page identities, artwork and layouts through separate contracts',async()=>{
  const {parseChapterFramework}=await import('../../SchoolIMS/SchoolIMS-Backend/services/curriculum/chapterFrameworkSchema.js');
  const {ChapterLayoutSchema,verifyLayoutContent}=await import('../../SchoolIMS/SchoolIMS-Backend/services/curriculum/bookLayoutSchema.js');
  for(const subject of ['Mathematics','English','Telugu','Hindi']){
    const book=structuredClone(useEditorStore.getState().getActiveBook()),chapterId=crypto.randomUUID(),bookId=crypto.randomUUID();
    book.pages=[];
    const config={...engine.DEFAULT_CHAPTER_CONFIG,grade:4,subject,title:'Saved design'};
    const chapter={id:chapterId,unitId:'unit',number:1,title:config.title,learningObjectives:[],pageIds:[],framework:engine.generateFramework(config,chapterId)};
    book.chapters=[chapter];const composed=engine.composeChapter(book,chapter,{});
    const page=composed.book.pages[0],artwork={id:'artwork',pageId:page.id,type:'image',category:'media',version:1,displayName:'Illustration',transform:{x:42,y:120,width:160,height:100,rotation:8,zIndex:5},style:{opacity:0.8},content:{caption:'An image',design:{family:'folio',x:5},crop:{x:2,y:3},assetRef:{assetId:crypto.randomUUID(),revision:1,checksum:'a'.repeat(64)}},locked:false,hidden:false};
    artwork.content.src=assetRenderUrl(artwork.content.assetRef);
    composed.elements.artwork=artwork;page.elementIds.push('artwork');
    const snapshot=wire(serializeChapter(composed.book,composed.chapter,composed.elements,bookId,chapterId));
    const {bookLayout,...semantic}=snapshot;
    assert.deepEqual(parseChapterFramework(semantic),semantic);
    assert.deepEqual(ChapterLayoutSchema.parse(bookLayout),bookLayout);
    verifyLayoutContent(bookLayout,semantic);
    assert.equal(semantic.nativeContent.artwork.content.design,undefined);
    const metadata=serializeBook(composed.book,[chapterId]),shell=restoreBookMetadata(bookId,metadata);
    assert.equal(shell.pages.length,0);assert.equal(shell.chapters[0].framework,undefined);
    const restored=restoreChapter(snapshot,shell.chapters[0]);
    assert.deepEqual(wire(restored.elements),wire(composed.elements));
    assert.deepEqual(restored.pages.map(p=>p.id),composed.book.pages.map(p=>p.id));
    assert.deepEqual(wire(serializeChapter({...shell,pages:restored.pages},restored.chapter,restored.elements,bookId,chapterId)),snapshot);
  }
});

test('lost paired-save response retains both bases and the exact request across restart',async()=>{
  const base={revision:1,edit_version:7,checksum:'a'.repeat(64),layout:{revision:4,checksum:'b'.repeat(64)}};
  const document={config:{title:'Text'},bookLayout:{elements:{art:{transform:{x:42}}}}},calls=[];let recovery;
  const repository={kind:'cloud',save:async(doc,target,options)=>{calls.push(wire({doc,target,options}));if(calls.length===1)throw new Error('Lost response');return {...base,edit_version:8,layout:{revision:5,checksum:'c'.repeat(64)}};}};
  const storage={save:record=>{recovery=wire(record);},archive:()=>{}};
  const first=new CloudSaveController({target:{bookId:'book',masterChapterId:'chapter',curriculumVersionId:'version'},base,acknowledged:''},repository,storage,()=>{},()=>true,60000);
  first.update(document);await assert.rejects(first.flush(),/Lost response/);first.dispose();
  assert.deepEqual(recovery.pending.base.layout,base.layout);
  const restarted=new CloudSaveController(recovery,repository,storage,()=>{},()=>true,60000);await restarted.flush();
  assert.deepEqual(calls[1],calls[0]);assert.equal(restarted.status.base.layout.revision,5);assert.equal(restarted.dirty,false);restarted.dispose();
});
