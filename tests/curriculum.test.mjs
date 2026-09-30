import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const engine=require('../src/editor/curriculum/chapterEngine.ts');
const catalog=require('../src/editor/curriculum/catalog.ts');
const actions=require('../src/editor/curriculum/actions.ts');
const {buildPublicationScene}=require('../src/editor/educational/publicationScene.ts');
const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
const {useHistoryStore}=require('../src/editor/stores/historyStore.ts');
const {simpleChapterPlan}=require('../src/editor/curriculum/frameworkPlan.ts');
const text=scene=>scene.nodes.filter(n=>n.kind==='text').map(n=>n.text).join(' ');
const base=()=>structuredClone(useEditorStore.getState().getActiveBook());
function build(config){const book=base();book.pages=[];const chapter={id:crypto.randomUUID(),unitId:'unit',number:1,title:config.title,learningObjectives:config.learningOutcomes,pageIds:[]};chapter.framework=engine.generateFramework(config,chapter.id);book.chapters=[chapter];return engine.composeChapter(book,chapter,{});}

test('all requested block families have usable previews and independent instances',()=>{
 assert.equal(catalog.CURRICULUM_BLOCKS.length,219);
 assert.equal(catalog.CURRICULUM_BLOCKS.filter(b=>b.isNew).length,72);
 assert.equal(new Set(catalog.CURRICULUM_BLOCKS.map(b=>b.id)).size,219);
 for(const def of catalog.CURRICULUM_BLOCKS){
  const block=engine.makeCurriculumBlock(def.id,engine.DEFAULT_CHAPTER_CONFIG);
  for(const layout of def.layouts){const scene=buildPublicationScene(engine.changeBlockLayout(block,layout));assert.ok(scene.height>60,`${def.id}/${layout}`);assert.ok(text(scene).includes(block.semanticContent.title)||text(scene).replaceAll(' ','').includes(block.semanticContent.title.replaceAll(' ','')),def.id);for(const n of scene.nodes)for(const k of ['x','y','w','h','size'])if(k in n)assert.ok(Number.isFinite(n[k]),`${def.id}: ${k}`);}
 }
});
test('every preset composes populated chapters across all 50 grade/subject combinations',()=>{
 for(const grade of [1,2,3,4,5])for(const subject of engine.CURRICULUM_SUBJECTS)for(const preset of catalog.CHAPTER_PRESETS){
  const config={...engine.DEFAULT_CHAPTER_CONFIG,grade,subject,preset:preset.id};const result=build(config);
  assert.deepEqual(result.chapter.framework.sections.map(s=>s.title),['Start','Learn','Practice','Activities','Review','Test']);
  for(const section of result.chapter.framework.sections)assert.ok(section.blockIds.length,`${preset.id}: missing ${section.stage}`);
  for(const page of result.pages){assert.ok(page.elementIds.length,'empty chapter page');for(const id of page.elementIds){const el=result.elements[id];assert.equal(el.pageId,page.id);if(el.category!=='decorative')assert.ok(el.transform.y+el.transform.height<=result.book.dimensions.heightPt-result.book.margins.bottomPt+.01,`${grade}/${subject}/${preset.id}: overflow`);}}
 }
});
test('new chapter plan includes subject-specific elements in the correct six sections',()=>{
 const math=engine.generateFramework({...engine.DEFAULT_CHAPTER_CONFIG,subject:'Maths'},crypto.randomUUID());
 const science=engine.generateFramework({...engine.DEFAULT_CHAPTER_CONFIG,subject:'Science'},crypto.randomUUID());
 const names=plan=>Object.values(plan.blocks).map(b=>b.curriculum.type);
 assert.ok(names(math).includes('number-line'));
 assert.ok(names(math).includes('word-problem'));
 assert.ok(names(science).includes('observation-sheet'));
 assert.ok(names(science).includes('experiment-plan'));
 assert.ok(math.sections.find(s=>s.stage==='reflect').blockIds.length>0);
 assert.ok(math.sections.find(s=>s.stage==='master').blockIds.length>0);
 assert.ok(!math.sections.some(s=>['target','think'].includes(s.stage)));
});
test('older eight-section chapters move to six plain-language sections without losing author text or IDs',()=>{
 const f=engine.generateFramework(engine.DEFAULT_CHAPTER_CONFIG,crypto.randomUUID());
 const sections=['discover','target','learn','build','apply','think','master','reflect'].map(stage=>({id:`old-${stage}`,stage,title:stage,blockIds:[]}));
 for(const b of Object.values(f.blocks)){
  const old=catalog.CURRICULUM_BLOCK_MAP[b.curriculum.type].originalStage||b.curriculum.frameworkStage;
  sections.find(s=>s.stage===old).blockIds.push(b.id);
  b.curriculum.frameworkStage=old;
  b.semanticContent.unitBadge=`${old.toUpperCase()} · CLASS 3`;
 }
 const authored=Object.values(f.blocks).find(b=>b.curriculum.type==='quick-check');
 authored.semanticContent.title='My own question heading';
 authored.semanticContent.questions=[{prompt:'Which answer?',options:['A','B'],answer:'B for the teacher',points:3}];
 authored.semanticContent.metadata={author:{notes:'Do not erase'}};
 const original=structuredClone(authored.semanticContent);
 const old={...f,planVersion:undefined,sections};
 const migrated=simpleChapterPlan(old),ids=migrated.sections.flatMap(s=>s.blockIds);
 assert.deepEqual(migrated.sections.map(s=>s.title),['Start','Learn','Practice','Activities','Review','Test']);
 assert.equal(new Set(ids).size,Object.keys(f.blocks).length);
 assert.deepEqual({...migrated.blocks[authored.id].semanticContent,unitBadge:original.unitBadge},original);
 assert.equal(migrated.blocks[authored.id].semanticContent.unitBadge,'PRACTICE · CLASS 3');
 assert.equal(migrated.blocks[authored.id].curriculum.frameworkStage,'build');
 assert.equal(migrated.blocks[sections[1].blockIds[0]].curriculum.frameworkStage,'discover');
 assert.deepEqual(simpleChapterPlan(old).sections.map(s=>s.id),migrated.sections.map(s=>s.id));
 assert.equal(old.sections.length,8);
});
test('new worksheet layouts preserve editable content and render different teaching surfaces',()=>{
 const examples=[['compare-two-ideas','comparison-table'],['step-chart','timeline'],['reading-passage','reading-page'],['observation-sheet','experiment-sheet'],['shape-sort','sorting-board'],['long-answer-questions','writing-sheet']];
 for(const [type,layout] of examples){
  const block=engine.makeCurriculumBlock(type,engine.DEFAULT_CHAPTER_CONFIG),source=structuredClone(block.semanticContent);
  const prepared=engine.changeBlockLayout(block,layout),scene=buildPublicationScene(prepared);
  const alt=buildPublicationScene(engine.changeBlockLayout(block,'editorial'));
  assert.deepEqual(prepared.semanticContent,source);
  assert.notDeepEqual(scene.nodes,alt.nodes,`${type}: visual layout must change`);
  assert.ok(scene.height>=100);
  assert.ok(text(scene).includes(source.title));
  if(source.questions?.some(q=>q.answer))assert.ok(!text(scene).includes(source.questions.find(q=>q.answer).answer));
 }
});
test('switching and converting preserves nested answers, images and learning metadata',()=>{
 const block=engine.makeCurriculumBlock('quick-check',engine.DEFAULT_CHAPTER_CONFIG);
 block.semanticContent={title:'Author title',introText:'A preserved explanation',questions:[{prompt:'Author question',options:['A','B'],answer:'SECRET_TEACHER',points:3}],metadata:{curriculum:'private',nested:{value:42}}};
 block.styleOverrides.motifs=[{id:'photo',role:'photo',kind:'photo',src:'data:image/png;base64,placeholder',alt:'Author image',x:26,y:100,w:100,h:100,rotation:0,locked:false,opacity:1}];
 const original=structuredClone(block);
 for(const layout of catalog.CURRICULUM_BLOCK_MAP['quick-check'].layouts){const changed=engine.changeBlockLayout(block,layout);assert.deepEqual(changed.semanticContent,original.semanticContent);assert.deepEqual(changed.curriculum,original.curriculum);assert.deepEqual(changed.styleOverrides.motifs,original.styleOverrides.motifs);assert.ok(!text(buildPublicationScene(changed)).includes('SECRET_TEACHER'));}
 const changed=engine.convertCurriculumBlock(block,'assessment');assert.deepEqual(changed.semanticContent,original.semanticContent);assert.equal(changed.curriculum.frameworkStage,'master');assert.deepEqual(changed.styleOverrides.motifs,original.styleOverrides.motifs);
});
test('Class 1 type and subject compositions materially differ from Class 5 and English',()=>{
 const young=engine.makeCurriculumBlock('concept-explorer',{...engine.DEFAULT_CHAPTER_CONFIG,grade:1,subject:'Maths'}),older=engine.makeCurriculumBlock('concept-explorer',{...engine.DEFAULT_CHAPTER_CONFIG,grade:5,subject:'Maths'});
 const scene1=buildPublicationScene(young),scene5=buildPublicationScene(older);
 assert.ok(scene1.nodes.find(n=>n.kind==='text'&&n.text.includes('Explain')).size>scene5.nodes.find(n=>n.kind==='text'&&n.text.includes('Explain')).size);
 const math=engine.makeCurriculumBlock('hands-on',{...engine.DEFAULT_CHAPTER_CONFIG,subject:'Maths'}),english=engine.makeCurriculumBlock('hands-on',{...engine.DEFAULT_CHAPTER_CONFIG,subject:'English'});
 assert.notEqual(math.styleOverrides.layoutVariant,english.styleOverrides.layoutVariant);assert.notEqual(math.styleOverrides.paletteId,english.styleOverrides.paletteId);
});
test('long content continues losslessly without shrinking text or leaking teacher answers',()=>{
 const result=build(engine.DEFAULT_CHAPTER_CONFIG),framework=result.chapter.framework;
 const block=Object.values(framework.blocks).find(b=>b.curriculum.type==='concept-explorer');
 block.semanticContent={title:'Long concept',introText:Array.from({length:300},(_,i)=>`Word${i} explains the idea.`).join(' '),questions:[{prompt:'One long question',answer:'SECRET_ANSWER',points:2}]};
 const composed=engine.composeChapter(result.book,{...result.chapter,framework},result.elements);
 const projections=Object.values(composed.elements).filter(el=>el.smartBlockData?.curriculum?.sourceBlockId===block.id);
 assert.ok(projections.length>2);assert.equal(composed.chapter.framework.blocks[block.id].semanticContent.introText,block.semanticContent.introText);
 const scenes=projections.map(el=>buildPublicationScene(el.smartBlockData));
 const full=buildPublicationScene(composed.chapter.framework.blocks[block.id]);
 assert.equal(scenes.map(text).join(' '),text(full));
 assert.ok(scenes.every(s=>s.nodes.filter(n=>n.kind==='text'&&n.text.includes('Word')).every(n=>n.size>=14)));
 assert.ok(!scenes.map(text).join(' ').includes('SECRET_ANSWER'));
 for(const el of projections)assert.ok(el.transform.y+el.transform.height<=composed.book.dimensions.heightPt-composed.book.margins.bottomPt+.01);
});
test('canonical chapter edits, tree reorder, conversions and history update actual book pages',()=>{
 const before=useEditorStore.getState(),beforeIds=before.getActiveBook().pages.map(p=>p.id);
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG);
 const current=()=>useEditorStore.getState();
 assert.ok(beforeIds.every(id=>current().getActiveBook().pages.some(p=>p.id===id)));
 const id=chapter.framework.sections.find(s=>s.stage==='build').blockIds[0],el=current().elements[id];
 actions.switchCurriculumLayout(el,catalog.CURRICULUM_BLOCK_MAP[el.smartBlockData.curriculum.type].layouts[1]);
 assert.deepEqual(current().getActiveBook().chapters.find(c=>c.id===chapter.id).framework.blocks[id].semanticContent,el.smartBlockData.semanticContent);
 current().updateSmartBlockContent(id,{title:'Edited canonical content'});
 assert.equal(current().getActiveBook().chapters.find(c=>c.id===chapter.id).framework.blocks[id].semanticContent.title,'Edited canonical content');
 actions.convertBlock(current().elements[id],'assessment');
 const state=current(),ch=state.getActiveBook().chapters.find(c=>c.id===chapter.id);assert.ok(ch.framework.sections.find(s=>s.stage==='master').blockIds.includes(id));
 const target=ch.framework.sections.find(s=>s.stage==='learn');actions.moveFrameworkBlock(ch.id,id,target.id,target.blockIds[0]);
 const moved=current().getActiveBook().chapters.find(c=>c.id===ch.id);assert.equal(moved.framework.sections.find(s=>s.stage==='learn').blockIds[0],id);
 assert.ok(current().getActiveBook().pages.some(p=>p.elementIds.includes(id)));
 const originalCount=Object.keys(moved.framework.blocks).length;actions.duplicateCurriculumBlock(current().elements[id]);
 assert.equal(Object.keys(current().getActiveBook().chapters.find(c=>c.id===ch.id).framework.blocks).length,originalCount+1);
 useHistoryStore.getState().undo();assert.equal(Object.keys(current().getActiveBook().chapters.find(c=>c.id===ch.id).framework.blocks).length,originalCount);
 useHistoryStore.getState().redo();assert.equal(Object.keys(current().getActiveBook().chapters.find(c=>c.id===ch.id).framework.blocks).length,originalCount+1);
});
test('free designer layers survive reflow and detached blocks stay editable',()=>{
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG),st=()=>useEditorStore.getState();
 actions.setFrameworkMode(chapter.id,'design');const id=Object.keys(chapter.framework.blocks)[0];
 st().setActivePageIndex(st().getActiveBook().pages.findIndex(p=>p.elementIds.includes(id)));
 const el=st().elements[id];actions.unlockCurriculumLayers(el);
 const layers=Object.values(st().elements).filter(e=>e.content.curriculumBlockId===id);assert.ok(layers.length>4);assert.ok(layers.every(e=>!e.locked));
 const layer=layers.find(e=>e.type==='body');st().updateElementContent(layer.id,{text:'Custom designer text'});
 actions.editFramework(chapter.id,'Reflow',f=>f);
 assert.equal(st().elements[layer.id].content.text,'Custom designer text');assert.ok(st().getActiveBook().pages.some(p=>p.elementIds.includes(layer.id)));
 actions.removeFrameworkBlock(chapter.id,id);assert.ok(!st().elements[layer.id]);
});
test('detached text rewraps, grows its frame and keeps the chosen font through undo and reflow',()=>{
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG),st=()=>useEditorStore.getState();
 actions.setFrameworkMode(chapter.id,'design');const id=Object.keys(chapter.framework.blocks)[0];
 actions.unlockCurriculumLayers(st().elements[id]);
 const layer=Object.values(st().elements).find(e=>e.content.curriculumBlockId===id&&e.type==='body');
 const before=structuredClone(layer),replacement=Array.from({length:35},(_,i)=>`Growing${i}`).join(' ');
 st().updateElementContent(layer.id,{text:replacement});
 st().updateElementStyle(layer.id,{fontFamily:'JetBrains Mono',fontSize:19});
 const {detachedSceneForElement}=require('../src/editor/educational/detachScene.ts');
 const scene=detachedSceneForElement(st().elements[layer.id]);
 assert.equal(text(scene).replaceAll(' ',''),replacement.replaceAll(' ',''));assert.ok(scene.nodes.length>1);
 assert.equal(st().elements[layer.id].content.text,replacement);
 assert.ok(st().elements[layer.id].transform.height>before.transform.height);
 assert.ok(scene.nodes.every(n=>n.fontFamily==='JetBrains Mono'&&n.size===19));
 useHistoryStore.getState().undo();assert.notEqual(st().elements[layer.id].style.fontFamily,'JetBrains Mono');
 useHistoryStore.getState().redo();assert.equal(st().elements[layer.id].style.fontFamily,'JetBrains Mono');
 actions.editFramework(chapter.id,'Reflow',f=>f);
 assert.equal(text(detachedSceneForElement(st().elements[layer.id])).replaceAll(' ',''),replacement.replaceAll(' ',''));
});
test('removing a framework chapter preserves unrelated pages and restores every detached layer on undo',()=>{
 const st=()=>useEditorStore.getState(),before=structuredClone(st().getActiveBook());
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG);
 actions.setFrameworkMode(chapter.id,'design');const id=Object.keys(chapter.framework.blocks)[0];
 actions.unlockCurriculumLayers(st().elements[id]);
 const built=structuredClone(st().getActiveBook()),elements=structuredClone(st().elements);
 actions.removeFrameworkChapter(chapter.id);
 assert.deepEqual(st().getActiveBook().pages,before.pages);
 assert.ok(!st().getActiveBook().chapters.some(c=>c.id===chapter.id));
 assert.ok(!Object.values(st().elements).some(e=>e.content.curriculumChapterId===chapter.id||e.smartBlockData?.curriculum?.chapterId===chapter.id));
 useHistoryStore.getState().undo();assert.deepEqual(st().getActiveBook(),built);assert.deepEqual(st().elements,elements);
 useHistoryStore.getState().redo();assert.deepEqual(st().getActiveBook().pages,before.pages);
});
test('flagship chapter has distinct layouts, measurable density and responsive 100-page composition',()=>{
 const result=build(engine.DEFAULT_CHAPTER_CONFIG);assert.ok(new Set(Object.values(result.chapter.framework.blocks).map(b=>b.styleOverrides.layoutVariant)).size>=7);
 const score=engine.rhythmScore(result.pages,result.elements);assert.ok(score<.3);
 for(const page of result.pages)assert.ok(['Light','Balanced','Dense','Overloaded'].includes(engine.pageDensity(page,result.elements,result.book).label));
 const large=build({...engine.DEFAULT_CHAPTER_CONFIG,pageCount:100});assert.ok(large.pages.length>=100);assert.ok(large.pages.every(p=>p.elementIds.length));
});

test('library names stay plain and every element has its own purpose',()=>{
 const {libraryFrame}=require('../src/features/curriculum/CurriculumPreview.tsx');
 const {SIMPLE_CHAPTER_STAGES}=require('../src/editor/curriculum/frameworkPlan.ts');
 const generic=Object.fromEntries(SIMPLE_CHAPTER_STAGES.map(stage=>[stage.id,stage.purpose]));
 assert.equal(catalog.CURRICULUM_BLOCK_MAP['chapter-hero'].name,'Chapter Title');
 assert.equal(catalog.CURRICULUM_BLOCK_MAP['learning-mission'].name,'Learning Goals');
 assert.equal(catalog.CURRICULUM_BLOCKS.length,219);
 for(const block of catalog.CURRICULUM_BLOCKS){
  assert.equal(/chapter hero|learning mission/i.test(block.name),false,block.id);
  assert.ok(block.purpose.length>20 && block.purpose.length<130,block.id);
  if(!block.isNew) assert.notEqual(block.purpose,generic[block.stage],block.id);
 }
 const numberLine=engine.makeCurriculumBlock('number-line',{...engine.DEFAULT_CHAPTER_CONFIG,subject:'Maths'});
 const numberScene=buildPublicationScene(numberLine);
 const [ , y, , h]=libraryFrame(numberScene).split(' ').map(Number);
 const axis=numberScene.nodes.find(node=>node.kind==='line'&&node.x2-node.x>80);
 assert.ok(axis && axis.y>=y-2 && axis.y<=y+h, 'number line preview must include the axis');
 const observation=engine.makeCurriculumBlock('observation-sheet',{...engine.DEFAULT_CHAPTER_CONFIG,subject:'Science'});
 const observationScene=buildPublicationScene(observation);
 const frame=libraryFrame(observationScene).split(' ').map(Number);
 const box=observationScene.nodes.find(node=>node.kind==='rect'&&node.stroke&&node.h>60);
 assert.ok(box && box.y+box.h>frame[1] && box.y<frame[1]+frame[3], 'observation preview must include the recording space');
});
test('Design mode retains author position during edits; Easy mode rejects free transforms',()=>{
 const chapter=actions.createFrameworkChapter({...engine.DEFAULT_CHAPTER_CONFIG,pageCount:18}),st=()=>useEditorStore.getState();
 const id=Object.values(chapter.framework.blocks).find(b=>b.curriculum.type==='quick-check').id;
 const original={...st().elements[id].transform};st().updateElementTransform(id,{x:65,y:70},true);assert.deepEqual(st().elements[id].transform,original);
 actions.setFrameworkMode(chapter.id,'design');st().updateElementTransform(id,{x:65,y:70,rotation:3},true);
 actions.editCurriculumBlock(st().elements[id],'Edit in free design',b=>({...b,semanticContent:{...b.semanticContent,title:'Preserved custom position'}}));
 assert.equal(st().elements[id].transform.x,65);assert.equal(st().elements[id].transform.y,70);assert.equal(st().elements[id].transform.rotation,3);
 assert.equal(st().getActiveBook().chapters.find(c=>c.id===chapter.id).framework.blocks[id].semanticContent.title,'Preserved custom position');
});
test('image masks, focal crop, hidden art and independent shape data survive layout changes',()=>{
 const {imageMaskPath}=require('../src/editor/educational/imageTreatment.ts');
 for(const mask of ['circle','arch','blob','wave','organic'])assert.match(imageMaskPath({mask},200,120),/^M/);
 assert.equal(imageMaskPath({mask:'custom',customMaskPath:'<script>alert(1)</script>'}),undefined);
 assert.equal(imageMaskPath({mask:'custom',customMaskPath:'M 0 0 L 100 0 L 100 100 Z'},200,120),'M 0 0 L 200 0 L 200 120 Z');
 let block=engine.makeCurriculumBlock('concept-explorer',engine.DEFAULT_CHAPTER_CONFIG);
 block.styleOverrides.motifs=[{id:'photo',role:'photo',kind:'photo',src:'local-image',alt:'A plant',x:45,y:50,w:120,h:90,rotation:0,locked:false,opacity:.7,mask:'arch',focalX:.3,focalY:.6,scale:1.2}];
 for(const layout of catalog.CURRICULUM_BLOCK_MAP['concept-explorer'].layouts){
  const scene=buildPublicationScene(engine.changeBlockLayout(block,layout)),image=scene.nodes.find(n=>n.kind==='image');assert.ok(image,layout);assert.equal(image.mask,'arch');assert.equal(image.focalX,.3);assert.equal(image.x,45);assert.equal(scene.motifs.find(m=>m.id==='photo').w,120);
 }
 block.styleOverrides.motifs[0].hidden=true;assert.ok(!buildPublicationScene(block).nodes.some(n=>n.kind==='image'));
});
test('saved curriculum templates preserve the full source and insert isolated chapter instances',()=>{
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG),st=()=>useEditorStore.getState();
 const id=Object.values(chapter.framework.blocks).find(b=>b.curriculum.type==='concept-explorer').id;
 st().setActivePageIndex(st().getActiveBook().pages.findIndex(p=>p.elementIds.includes(id)));
 st().savePublicationPreset('My concept design',id);const savedId=Object.keys(st().publicationPresets).at(-1),saved=st().publicationPresets[savedId];
 st().insertPublicationPreset(savedId);const copy=st().elements[st().selectedElementIds[0]];assert.notEqual(copy.id,id);assert.equal(copy.smartBlockData.curriculum.sourceBlockId,copy.id);
 assert.deepEqual(copy.smartBlockData.semanticContent,saved.block.semanticContent);
 st().updateSmartBlockContent(copy.id,{title:'Independent copy'});assert.equal(st().elements[id].smartBlockData.semanticContent.title,saved.block.semanticContent.title);
});
test('mixed native/curriculum deletion and duplication preserve canonical state and undo together',()=>{
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG),st=()=>useEditorStore.getState();
 const id=Object.values(chapter.framework.blocks).find(b=>b.curriculum.type==='quick-check').id,page=st().getActiveBook().pages.find(p=>p.elementIds.includes(id));
 st().setActivePageIndex(st().getActiveBook().pages.findIndex(p=>p.id===page.id));
 const native={id:crypto.randomUUID(),pageId:page.id,type:'body',category:'text',displayName:'Custom note',version:1,locked:false,hidden:false,transform:{x:42,y:500,width:180,height:30,rotation:0,zIndex:10},style:{},content:{text:'Retain undo'}};
 st().insertPublicationElement(native);useEditorStore.setState({selectedElementIds:[id,native.id]});
 const count=Object.keys(st().getActiveBook().chapters.find(c=>c.id===chapter.id).framework.blocks).length;
 st().duplicateSelectedElements();assert.equal(Object.keys(st().getActiveBook().chapters.find(c=>c.id===chapter.id).framework.blocks).length,count+1);
 useHistoryStore.getState().undo();assert.equal(Object.keys(st().getActiveBook().chapters.find(c=>c.id===chapter.id).framework.blocks).length,count);
 useEditorStore.setState({selectedElementIds:[id,native.id]});st().deleteSelectedElements();assert.ok(!st().elements[id]);assert.ok(!st().elements[native.id]);
 actions.editFramework(chapter.id,'Reflow after deletion',f=>f);assert.ok(!st().elements[id]);useHistoryStore.getState().undo();useHistoryStore.getState().undo();assert.ok(st().elements[id]);assert.equal(st().elements[native.id].content.text,'Retain undo');
});
test('detached pages keep their relative order during chapter reflow',()=>{
 const chapter=actions.createFrameworkChapter(engine.DEFAULT_CHAPTER_CONFIG),st=()=>useEditorStore.getState();actions.setFrameworkMode(chapter.id,'design');
 const id=Object.values(chapter.framework.blocks).find(b=>b.curriculum.type==='learning-mission').id;
 st().setActivePageIndex(st().getActiveBook().pages.findIndex(p=>p.elementIds.includes(id)));
 const pageId=st().elements[id].pageId,before=st().getActiveBook().pages.map(p=>p.id);actions.unlockCurriculumLayers(st().elements[id]);
 actions.editFramework(chapter.id,'Reflow around designer page',f=>f);
 const after=st().getActiveBook().pages.map(p=>p.id),preceding=before.slice(0,before.indexOf(pageId)).filter(id=>after.includes(id));
 assert.ok(preceding.every(id=>after.indexOf(id)<after.indexOf(pageId)));
});
test('persistence coalesces updates and flushes the latest state explicitly',()=>{
 const {schedulePersistence,flushPendingPersistence}=require('../src/editor/core/debouncedPersistence.ts');const calls=[];
 schedulePersistence(()=>calls.push('old'));schedulePersistence(()=>calls.push('latest'));assert.deepEqual(calls,[]);flushPendingPersistence();assert.deepEqual(calls,['latest']);flushPendingPersistence();assert.equal(calls.length,1);
});
test('AI endpoint rejects foreign origins, reports missing setup and validates provider block identities',async()=>{
 const {POST}=require('../src/app/api/curriculum-assist/route.ts'),{NextRequest}=require('next/server');
 const originalKey=process.env.OPENAI_API_KEY,originalModel=process.env.OPENAI_CURRICULUM_MODEL,originalFetch=globalThis.fetch;
 const input={instruction:'Draft a plant explanation',grade:3,subject:'Science',title:'Plants',outcomes:['Identify parts'],blocks:[{id:'block-1',type:'concept-explorer',stage:'learn',content:{title:'Plants'}}]};
 const request=(origin='http://localhost:3000')=>new NextRequest('http://localhost:3000/api/curriculum-assist',{method:'POST',headers:{origin,'x-forwarded-for':crypto.randomUUID()},body:JSON.stringify(input)});
 try{
  delete process.env.OPENAI_API_KEY;delete process.env.OPENAI_CURRICULUM_MODEL;assert.equal((await POST(request('https://foreign.example'))).status,403);assert.equal((await POST(request())).status,503);
  process.env.OPENAI_API_KEY='mock-test-only';process.env.OPENAI_CURRICULUM_MODEL='mock-test-model';
  const result={blocks:[{id:'block-1',content:{title:'Plants',introText:'Roots anchor the plant.',calloutText:'Notice each part.',items:[],questions:[{prompt:'Which part anchors the plant?',options:[],answer:'Roots',points:1}],steps:[]}}]};
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(JSON.parse(options.body).store,false);assert.equal(JSON.parse(options.body).text.format.type,'json_schema');return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]});};
  const response=await POST(request());assert.equal(response.status,200);assert.deepEqual(await response.json(),result);
  result.blocks[0].id='wrong-id';assert.equal((await POST(request())).status,502);
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey;if(originalModel===undefined)delete process.env.OPENAI_CURRICULUM_MODEL;else process.env.OPENAI_CURRICULUM_MODEL=originalModel;}
});

 test('foundation grades compose oral and supervised activities without upper-primary defaults',()=>{
  for(const grade of ['NURSERY','LKG','UKG'])for(const subject of ['Maths','Telugu']){
    const result=build({...engine.DEFAULT_CHAPTER_CONFIG,grade,subject,title:'Colours around us',concepts:['Colours'],pageCount:8});
    const blocks=Object.values(result.chapter.framework.blocks);
    assert.ok(!blocks.some(b=>['fraction-practice','experiment-plan','word-problem','research-task'].includes(b.curriculum.type)));
    assert.ok(blocks.every(b=>b.curriculum.grade===grade&&b.gradeBand==='early-years'));
    const assessment=blocks.find(b=>b.curriculum.frameworkStage==='master');
    assert.equal(assessment.semanticContent.questions[0].points,0);
    assert.match(assessment.semanticContent.questions[0].answer,/Teacher observes/);
    for(const page of result.pages)for(const id of page.elementIds){const el=result.elements[id];if(el.category!=='decorative')assert.ok(el.transform.y+el.transform.height<=result.book.dimensions.heightPt-result.book.margins.bottomPt+.01);}
  }
 });
