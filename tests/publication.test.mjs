import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const {PUBLICATION_BLOCKS}=require('../src/editor/educational/publicationCatalog.ts');
const {ATELIER_BLOCKS}=require('../src/editor/educational/atelier/catalog.ts');
const {createSmartBlockInstance,EDUCATIONAL_BLOCK_REGISTRY,getPresetsByArchetype}=require('../src/editor/educational/blockRegistry.ts');
const {buildPublicationScene,wrapText,textWidth,resolvePublicationPalette}=require('../src/editor/educational/publicationScene.ts');
const {shuffleBlockStyle}=require('../src/editor/educational/smartBlockSolver.ts');
const {makePublicationDemo,PUBLICATION_PAGES,makePublicationPages}=require('../src/editor/educational/publicationPages.ts');
const {publicationPreflight}=require('../src/editor/educational/publicationPreflight.ts');
const {renderPublicationPdf}=require('../src/editor/educational/publicationPdf.ts');
const {jsPDF}=require('jspdf');
const textOf=scene=>scene.nodes.filter(n=>n.kind==='text').map(n=>n.text).join(' ');

test('all 82 publication layouts render finite geometry and retain meaningful content',()=>{
 assert.equal(Object.keys(PUBLICATION_BLOCKS).length,82);
 for(const def of Object.values(PUBLICATION_BLOCKS)){
  const b=createSmartBlockInstance(def.id,'page');b.transform.height=0;
  const scene=buildPublicationScene(b);
  assert.ok(scene.nodes.length>3,def.id);assert.ok(scene.height>0&&Number.isFinite(scene.height),def.id);
  for(const node of scene.nodes){for(const key of ['x','y','w','h','rx','ry','size'])if(key in node)assert.ok(Number.isFinite(node[key])&&(['x','y'].includes(key)||node[key]>=0),`${def.id}: ${key}`);}
  assert.ok(textOf(scene).includes(b.semanticContent.title),def.id);
 }
});
test('switching outcomes through all presets preserves nested content and local overrides',()=>{
 let block=createSmartBlockInstance('studio-learning-outcomes-1','page');
 block.semanticContent.questions=[{prompt:'Private quiz',answer:'SECRET_ANSWER'}];
 block.styleOverrides={paletteId:'ocean',answerSpacePt:35};
 const before=structuredClone(block.semanticContent);
 for(let i=0;i<8;i++){block=shuffleBlockStyle(block,getPresetsByArchetype(block.archetypeId));assert.deepEqual(block.semanticContent,before);assert.equal(block.styleOverrides.paletteId,'ocean');assert.ok(textOf(buildPublicationScene(block)).includes('Private quiz'));assert.ok(!textOf(buildPublicationScene(block)).includes('SECRET_ANSWER'));}
});
test('instances do not mutate shared nested defaults',()=>{
 const a=createSmartBlockInstance('studio-quick-check-1','p'),b=createSmartBlockInstance('studio-quick-check-1','p');a.semanticContent.questions[0].prompt='Changed';assert.notEqual(a.semanticContent.questions[0].prompt,b.semanticContent.questions[0].prompt);
});
test('long and unbroken content wraps without shrinking reading type',()=>{
 const b=createSmartBlockInstance('studio-learning-outcomes-1','p');b.transform.width=240;b.semanticContent.items=Array.from({length:12},(_,i)=>`Outcome ${i}: `+'explain your thinking '.repeat(8));
 const scene=buildPublicationScene(b);assert.ok(scene.height>1000);assert.ok(scene.nodes.filter(n=>n.kind==='text'&&n.text.includes('thinking')).every(n=>n.size>=12));
 for(const l of wrapText('abcdefghijklmnopqrstuvwx'.repeat(5),100,12))assert.ok(textWidth(l,12)<=100.01);
});
test('number formatting changes representation, never value',()=>{
 const b=createSmartBlockInstance('studio-place-value-1','p');assert.match(textOf(buildPublicationScene(b)),/3,25,146/);b.semanticContent.numberSystem='international';assert.match(textOf(buildPublicationScene(b)),/325,146/);assert.equal(b.semanticContent.numberValue,325146);
});
test('page insertion and sample chapter fit measured block geometry',()=>{
 const {book,elements}=makePublicationDemo();
 for(const t of PUBLICATION_PAGES){const r=makePublicationPages(t.id,book);for(const p of r.pages)for(const id of p.elementIds){const el=r.elements[id];assert.ok(el.transform.y+el.transform.height<=book.dimensions.heightPt-book.margins.bottomPt+1,`${t.id}: ${el.displayName}`);}}
 assert.ok(book.pages.length>=10);assert.equal(publicationPreflight(book,elements).filter(x=>x.severity==='error').length,0);
});
test('shared PDF renderer writes selectable student text and vector shapes',async()=>{
 const b=createSmartBlockInstance('studio-quick-check-1','p');b.semanticContent.questions[0].answer='SECRET_ONLY_FOR_TEACHER';b.transform.height=0;
 const scene=buildPublicationScene(b),doc=new jsPDF({unit:'pt',format:'a4'});
 await renderPublicationPdf(doc,scene,{transform:{...b.transform,height:scene.height},style:{}},0,0);
 const pdf=doc.output();assert.match(pdf,/Checkpoint/);assert.ok(!pdf.includes('SECRET_ONLY_FOR_TEACHER'));assert.ok(pdf.includes(' re')||pdf.includes(' c'));
});
test('legacy definitions are still available',()=>{
 assert.ok(EDUCATIONAL_BLOCK_REGISTRY['outcomes-cards-play']);assert.ok(buildPublicationScene(createSmartBlockInstance('outcomes-cards-play','p')).nodes.length>10);
});

test('store changes preserve content, persist history and respect curriculum locks',()=>{
 const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
 const {useHistoryStore}=require('../src/editor/stores/historyStore.ts');
 const s=useEditorStore.getState();
 const el=s.addEducationalBlock('studio-learning-outcomes-1',42,36);assert.ok(el);
 const old=structuredClone(el.smartBlockData.semanticContent);
 s.updateSmartBlockContent(el.id,{title:'Edited learning targets'});
 assert.equal(useEditorStore.getState().elements[el.id].smartBlockData.semanticContent.title,'Edited learning targets');
 useHistoryStore.getState().undo();assert.deepEqual(useEditorStore.getState().elements[el.id].smartBlockData.semanticContent,old);
 useHistoryStore.getState().redo();assert.equal(useEditorStore.getState().elements[el.id].smartBlockData.semanticContent.title,'Edited learning targets');
 s.setEducationalBlockPreset(el.id,'studio-learning-outcomes-2');
 assert.deepEqual(useEditorStore.getState().elements[el.id].smartBlockData.semanticContent.items,old.items);
 const before=useEditorStore.getState().elements[el.id];
 s.updateElementTransform(el.id,{x:82,y:100},false);s.commitTransformGesture([before]);
 useHistoryStore.getState().undo();assert.deepEqual(useEditorStore.getState().elements[el.id].transform,before.transform);
 useHistoryStore.getState().redo();assert.equal(useEditorStore.getState().elements[el.id].transform.x,82);
 const current=useEditorStore.getState().elements[el.id];s.updateElement(el.id,{smartBlockData:{...current.smartBlockData,isLockedContent:true}});
 s.updateSmartBlockContent(el.id,{title:'Not allowed'});assert.notEqual(useEditorStore.getState().elements[el.id].smartBlockData.semanticContent.title,'Not allowed');
});

function isGray(value){
 if(!value||value==='none')return true;
 if(!String(value).startsWith('#')||String(value).length<7)return false;
 const hex=value.slice(1,7).toLowerCase();
 return hex.slice(0,2)===hex.slice(2,4)&&hex.slice(2,4)===hex.slice(4,6);
}

test('atelier skins render finite geometry, keep the title, and stay in the registry',()=>{
 assert.ok(Object.keys(ATELIER_BLOCKS).length>=12);
 assert.equal(Object.keys(PUBLICATION_BLOCKS).length,82);
 for(const def of Object.values(ATELIER_BLOCKS)){
  assert.equal(EDUCATIONAL_BLOCK_REGISTRY[def.id].skinId,def.skinId);
  const b=createSmartBlockInstance(def.id,'page');b.transform.height=0;
  const scene=buildPublicationScene(b);
  assert.ok(scene.nodes.length>3,def.id);
  assert.ok(scene.height>0&&Number.isFinite(scene.height),def.id);
  for(const node of scene.nodes){for(const key of ['x','y','w','h','rx','ry','size'])if(key in node)assert.ok(Number.isFinite(node[key])&&(['x','y'].includes(key)||node[key]>=0),`${def.id}: ${key}`);}
  assert.ok(textOf(scene).includes(b.semanticContent.title),def.id);
 }
});

test('moving a motif changes its scene position and leaves the curriculum text alone',()=>{
 const b=createSmartBlockInstance('atelier-constellation-map','page');
 const before=structuredClone(b.semanticContent);
 const scene=buildPublicationScene(b);
 const frame=scene.motifs.find(m=>m.role==='capsule'||m.role==='illustration');
 assert.ok(frame);
 const motifs=b.styleOverrides.motifs||[];
 const existing=motifs.find(m=>m.id===frame.id);
 b.styleOverrides.motifs=existing?motifs.map(m=>m.id===frame.id?{...m,x:frame.x+36,y:frame.y,w:frame.w,h:frame.h,nudged:true}:m):[...motifs,{id:frame.id,role:frame.role,kind:frame.kind,x:frame.x+36,y:frame.y,w:frame.w,h:frame.h,rotation:0,locked:false,opacity:1,nudged:true}];
 const next=buildPublicationScene(b);
 assert.equal(next.motifs.find(m=>m.id===frame.id).x,frame.x+36);
 assert.deepEqual(b.semanticContent,before);
});

test('place chart and bead theatre format the same number two ways',()=>{
 for(const id of ['atelier-place-chart','atelier-bead-theatre']){
  const b=createSmartBlockInstance(id,'p');
  b.semanticContent.numberValue=325146;
  assert.match(textOf(buildPublicationScene(b)),/3,25,146/);
  b.semanticContent.numberSystem='international';
  assert.match(textOf(buildPublicationScene(b)),/325,146/);
  assert.equal(b.semanticContent.numberValue,325146);
 }
});

test('pulse check pdf keeps the prompt and omits the teacher answer',async()=>{
 const b=createSmartBlockInstance('atelier-pulse-check','p');
 b.semanticContent.questions[0].answer='SECRET_ONLY_FOR_TEACHER';
 b.transform.height=0;
 const scene=buildPublicationScene(b),doc=new jsPDF({unit:'pt',format:'a4'});
 await renderPublicationPdf(doc,scene,{transform:{...b.transform,height:scene.height},style:{}},0,0);
 const pdf=doc.output();
 assert.ok(pdf.includes(b.semanticContent.questions[0].prompt.slice(0,12))||pdf.includes('Checkpoint')||pdf.includes(b.semanticContent.title.slice(0,8)));
 assert.ok(!pdf.includes('SECRET_ONLY_FOR_TEACHER'));
});

test('grayscale atelier fills stay gray and a photo keeps a paper card',()=>{
 const b=createSmartBlockInstance('atelier-promise-banner','p');
 b.styleOverrides.printMode='grayscale';
 const scene=buildPublicationScene(b);
 for(const node of scene.nodes){
  if('fill' in node) assert.ok(isGray(node.fill),node.fill);
  if('stroke' in node) assert.ok(isGray(node.stroke),node.stroke);
  if(node.kind==='gradient'){assert.ok(isGray(node.from)&&isGray(node.to));}
 }
 const photo=createSmartBlockInstance('atelier-unit-masthead','p');
 const surface=resolvePublicationPalette(photo).surface.toLowerCase();
 photo.styleOverrides.motifs=[{id:'photo',role:'photo',kind:'custom-image',src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',alt:'Plate',x:20,y:20,w:120,h:80,rotation:0,locked:false,opacity:1,nudged:true,focalX:.5,focalY:.5,scale:1}];
 const plated=buildPublicationScene(photo);
 const imageAt=plated.nodes.findIndex(n=>n.kind==='image');
 const cardAt=plated.nodes.findIndex((n,i)=>i>imageAt&&n.kind==='rect'&&String(n.fill).toLowerCase()===surface);
 assert.ok(imageAt>=0&&cardAt>imageAt);
});

test('a long atelier outcome still uses the grade body size',()=>{
 const b=createSmartBlockInstance('atelier-promise-banner','p');
 b.transform.width=240;
 b.semanticContent.items=['Explain your thinking '.repeat(8)];
 const scene=buildPublicationScene(b);
 assert.ok(scene.height>200);
 assert.ok(scene.nodes.filter(n=>n.kind==='text'&&n.text.includes('thinking')).every(n=>n.size>=12));
});


test('signature compositions retain every teaching field at narrow and wide reading widths',()=>{
 const {SIGNATURE_LAYOUTS}=require('../src/editor/educational/atelier/skins/signature.ts');
 for(const layout of SIGNATURE_LAYOUTS)for(const width of [180,280,480]){
  const b=createSmartBlockInstance(`atelier-${layout.id}`,'p');b.transform.width=width;
  b.semanticContent={title:'An editable lesson',introText:'INTRO_MARKER',subtitle:'SUBTITLE_MARKER',items:['ITEM_MARKER'],steps:[{stepNumber:1,title:'STEP_TITLE',body:'STEP_BODY'}],questions:[{prompt:'QUESTION_MARKER',answer:'TEACHER_SECRET'}],materials:['MATERIAL_MARKER'],passage:'PASSAGE_MARKER',calloutText:'CALLOUT_MARKER',footnote:'FOOTNOTE_MARKER'};
  const scene=buildPublicationScene(b),text=textOf(scene);
  for(const marker of ['INTRO_MARKER','SUBTITLE_MARKER','ITEM_MARKER','STEP_TITLE','STEP_BODY','QUESTION_MARKER','MATERIAL_MARKER','PASSAGE_MARKER','CALLOUT_MARKER','FOOTNOTE_MARKER'])assert.ok(text.replaceAll(' ','').includes(marker),`${layout.id}/${width}: ${marker}`);
  assert.ok(!text.includes('TEACHER_SECRET'));
  for(const n of scene.nodes)if(n.kind==='text')assert.ok(n.y<=scene.height,`${layout.id}: text below scene`);
 }
});

test('new subject starters replace maths examples without mutating existing blocks',()=>{
 const {withSubjectExample}=require('../src/editor/educational/subjectExamples.ts');
 const b=createSmartBlockInstance('atelier-discovery-deck','p'),original=structuredClone(b);
 for(const subject of ['science','english','social-studies','environmental','computer-science','early-learning','general']){
  const next=withSubjectExample(b,subject);assert.equal(next.subject,subject);assert.equal(next.semanticContent.numberValue,undefined);assert.ok(next.semanticContent.items.length);assert.ok(!textOf(buildPublicationScene(next)).includes('place value'));
 }
 assert.deepEqual(b,original);
});

test('detach retains all rendered text, vector nodes and photo crop settings',()=>{
 const {detachPublicationScene,detachedSceneForElement}=require('../src/editor/educational/detachScene.ts');
 const b=createSmartBlockInstance('atelier-story-ribbon','p');b.transform.x=85;b.transform.y=74;
 b.styleOverrides.motifs=[{id:'photo',role:'photo',kind:'custom-image',src:'data:image/png;base64,example',alt:'Test image',x:20,y:400,w:100,h:60,rotation:0,locked:false,opacity:.7,focalX:.2,focalY:.8,scale:1.5,fit:'contain',flipX:true,behind:false}];
 const original=buildPublicationScene(b),pieces=detachPublicationScene(b,5);
 assert.equal(pieces.length,original.nodes.filter(n=>n.kind!=='gradient'&&n.kind!=='clip').length);
 assert.equal(pieces.filter(el=>el.type==='body').map(el=>el.content.text).join(' '),textOf(original));
 const photo=pieces.find(el=>el.type==='image');assert.equal(photo.content.focalX,.2);assert.equal(photo.content.flipX,true);assert.equal(photo.style.objectFit,'contain');
 const title=pieces.find(el=>el.type==='body');title.content.text='Edited heading';assert.equal(detachedSceneForElement(title).nodes.find(n=>n.kind==='text').text,'Edited heading');
});

test('image placement uses the same fit, crop and zoom geometry for output',()=>{
 const {imagePlacement}=require('../src/editor/educational/publicationScene.ts');
 const frame={kind:'image',x:10,y:20,w:100,h:100,sourceWidth:200,sourceHeight:100,focalX:.5,focalY:.5,scale:1};
 assert.deepEqual(imagePlacement(frame),{x:-40,y:20,w:200,h:100});
 assert.deepEqual(imagePlacement({...frame,fit:'contain'}),{x:10,y:45,w:100,h:50});
 assert.deepEqual(imagePlacement({...frame,scale:2,focalX:0,focalY:0}),{x:10,y:20,w:400,h:200});
});

test('arrange spaces unequal objects by their edges, respects locks and undoes in one step',()=>{
 const {arrangeElements}=require('../src/editor/core/arrangement.ts');
 const make=(id,x,width,locked=false)=>({id,locked,hidden:false,transform:{x,y:60,width,height:30,rotation:0,zIndex:1}});
 const items=[make('a',50,30),make('b',130,60),make('c',270,40),make('locked',400,20,true)];
 const result=arrangeElements(items,{x:50,y:60,width:260,height:30},'horizontal');
 assert.equal(result.b.x-(result.a.x+result.a.width),result.c.x-(result.b.x+result.b.width));assert.ok(!result.locked);
 const {useEditorStore}=require('../src/editor/stores/editorStore.ts'),{useHistoryStore}=require('../src/editor/stores/historyStore.ts');
 useEditorStore.setState({books:useEditorStore.getState().books.map(book=>({...book,pageFrame:null,pageFramePolicy:'custom'}))});
 const s=useEditorStore.getState(),page=s.getActivePage();
 for(const item of items.slice(0,3))s.insertPublicationElement({...item,id:`arrange-${item.id}`,pageId:page.id,type:'shape',category:'decorative',version:1,displayName:item.id,style:{},content:{}});
 useEditorStore.setState({selectedElementIds:['arrange-a','arrange-b','arrange-c']});useHistoryStore.getState().clearHistory();
 s.arrangeSelection('horizontal','selection');assert.equal(useHistoryStore.getState().past.length,1);
 useHistoryStore.getState().undo();assert.equal(useEditorStore.getState().elements['arrange-b'].transform.x,130);
 useHistoryStore.getState().redo();assert.equal(useEditorStore.getState().elements['arrange-b'].transform.x,result.b.x);
});

test('page composition measures smart block heights and preserves locked objects',()=>{
 const {composePage}=require('../src/editor/core/pageComposition.ts');
 const {makePublicationElement}=require('../src/editor/educational/publicationPages.ts');
 const {book}=makePublicationDemo();
 const first=makePublicationElement('atelier-discovery-deck','p',480,42,36);
 const second=makePublicationElement('atelier-editorial-folio','p',480,42,400);
 const locked={...second,id:'locked',locked:true};
 const result=composePage([first,second,locked],book.dimensions,book.margins,'compact');
 assert.ok(!result.transforms.locked);
 for(const el of [first,second]){const t=result.transforms[el.id];assert.equal(t.height,buildPublicationScene({...el.smartBlockData,transform:{...t,height:0}}).height);}
 assert.equal(result.fits,false);
});

test('all eight signature compositions render distinct structural identities with identical content',()=>{
 const {SIGNATURE_LAYOUTS}=require('../src/editor/educational/atelier/skins/signature.ts');
 const {createSmartBlockInstance}=require('../src/editor/educational/blockRegistry.ts');
 const sample={
   title: "Exploration of Living Systems",
   unitBadge: "UNIT 02 · BIOLOGY",
   subtitle: "How organisms interact with light and water",
   items: ["Observe the leaf structure under magnification.", "Record stomata patterns and vein density.", "Compare sun leaves and shade leaves.", "Formulate an explanation for chlorophyll distribution."],
   footnote: "Field Notebook · Grade 5 Science",
 };
 const scenes = SIGNATURE_LAYOUTS.map(layout => {
   const block = createSmartBlockInstance(`atelier-${layout.id}`, 'test-page');
   block.semanticContent = { ...sample };
   block.transform.width = 480;
   return { id: layout.id, scene: buildPublicationScene(block) };
 });

 assert.equal(scenes.length, 8);
 // Field guide has botanical specimen framing
 const fieldGuide = scenes.find(s => s.id === 'field-guide');
 assert.ok(fieldGuide.scene.nodes.some(n => n.kind === 'text' && n.text.includes('OBS ·')));

 // Story ribbon has narrative ribbon banner
 const storyRibbon = scenes.find(s => s.id === 'story-ribbon');
 assert.ok(storyRibbon.scene.nodes.some(n => n.kind === 'polygon'));

 // Discovery deck has structured concept index pills
 const discoveryDeck = scenes.find(s => s.id === 'discovery-deck');
 assert.ok(discoveryDeck.scene.nodes.some(n => n.kind === 'text' && n.text === '01'));

 // Learning trail has numbered milestone trail nodes
 const learningTrail = scenes.find(s => s.id === 'learning-trail');
 assert.equal(learningTrail.scene.nodes.filter(n => n.kind === 'text' && n.text.startsWith('MILESTONE ')).length, sample.items.length);
 assert.ok(learningTrail.scene.nodes.some(n => n.kind === 'line'));

 // Question theatre has prominent question marquee
 const questionTheatre = scenes.find(s => s.id === 'question-theatre');
 assert.ok(questionTheatre.scene.nodes.some(n => n.kind === 'rect' && n.radius === 14));

 // Editorial folio uses serif fonts and classical roman rules
 const editorialFolio = scenes.find(s => s.id === 'editorial-folio');
 assert.ok(editorialFolio.scene.nodes.some(n => n.kind === 'text' && n.font === 'serif'));

 // Curiosity passport has visa stamps and collection seals
 const curiosityPassport = scenes.find(s => s.id === 'curiosity-passport');
 assert.ok(curiosityPassport.scene.nodes.some(n => n.kind === 'text' && n.text.includes('VISA ENTRY')));

 // Workshop board has washi tape tabs
 const workshopBoard = scenes.find(s => s.id === 'workshop-board');
 assert.ok(workshopBoard.scene.nodes.some(n => n.kind === 'text' && n.text.includes('MATERIALS')));
});

test('autoArrangePage includes assessments in both visual and reading styles',()=>{
 const {autoArrangePage}=require('../src/editor/core/layoutSolver.ts');
 const elements = [
   { id: 'heading', category: 'text', role: 'heading', hidden: false, locked: false, transform: { x: 50, y: 50, width: 400, height: 40, rotation: 0, zIndex: 1 } },
   { id: 'illustration', category: 'media', role: 'illustration', hidden: false, locked: false, transform: { x: 50, y: 100, width: 200, height: 150, rotation: 0, zIndex: 2 } },
   { id: 'passage', category: 'text', role: 'body', hidden: false, locked: false, transform: { x: 260, y: 100, width: 190, height: 150, rotation: 0, zIndex: 3 } },
   { id: 'quiz', category: 'interactive', role: 'assessment', hidden: false, locked: false, transform: { x: 50, y: 260, width: 400, height: 80, rotation: 0, zIndex: 4 } },
 ];
 const dims = { widthPt: 595, heightPt: 842 };
 const margins = { topPt: 36, bottomPt: 36, insidePt: 40, outsidePt: 40 };

 const visualResult = autoArrangePage(elements, dims, margins, 'visual');
 assert.ok(visualResult['quiz'], 'Visual layout must position assessment');

 const readingResult = autoArrangePage(elements, dims, margins, 'reading');
 assert.ok(readingResult['quiz'], 'Reading layout must position assessment');
});

test('detach undo restores the original element at its exact index in page.elementIds',()=>{
 const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
 const {useHistoryStore}=require('../src/editor/stores/historyStore.ts');
 const {makePublicationElement}=require('../src/editor/educational/publicationPages.ts');

 const store = useEditorStore.getState();
 const page = store.getActivePage();
 assert.ok(page);

 const el1 = { id: 'pre-1', pageId: page.id, type: 'text', category: 'text', version: 1, displayName: 'One', transform: { x: 40, y: 40, width: 100, height: 30, rotation: 0, zIndex: 1 }, style: {}, content: {}, locked: false, hidden: false };
 const blockEl = makePublicationElement('atelier-field-guide', page.id, 480, 40, 80);
 const el2 = { id: 'post-1', pageId: page.id, type: 'text', category: 'text', version: 1, displayName: 'Two', transform: { x: 40, y: 350, width: 100, height: 30, rotation: 0, zIndex: 3 }, style: {}, content: {}, locked: false, hidden: false };

 store.insertPublicationElement(el1);
 store.insertPublicationElement(blockEl);
 store.insertPublicationElement(el2);

 const originalIndex = store.getActivePage().elementIds.indexOf(blockEl.id);
 assert.ok(originalIndex >= 0);

 useHistoryStore.getState().clearHistory();
 store.detachEducationalBlock(blockEl.id);

 assert.equal(store.getActivePage().elementIds.includes(blockEl.id), false);

 // Undo detach
 useHistoryStore.getState().undo();
 const restoredPage = store.getActivePage();
 assert.ok(restoredPage.elementIds.includes(blockEl.id));
 const restoredIndex = restoredPage.elementIds.indexOf(blockEl.id);
 assert.equal(restoredIndex, originalIndex, 'Restored element must be at its exact original index');
});

test('reusable template saving and insertion creates completely isolated instances without mutation',()=>{
 const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
 const {makePublicationElement}=require('../src/editor/educational/publicationPages.ts');

 const store = useEditorStore.getState();
 const page = store.getActivePage();
 const blockEl = makePublicationElement('atelier-workshop-board', page.id, 480, 40, 100);
 blockEl.smartBlockData.semanticContent.title = "Author Custom Experiment";
 store.insertPublicationElement(blockEl);

 store.savePublicationPreset("My Custom Science Board", blockEl.id);
 const presets = useEditorStore.getState().publicationPresets;
 const savedId = Object.keys(presets).find(k => presets[k].name === "My Custom Science Board");
 assert.ok(savedId);

 // Insert instance 1
 store.insertPublicationPreset(savedId);
 const inst1Id = useEditorStore.getState().selectedElementIds[0];
 assert.ok(inst1Id && inst1Id !== blockEl.id);

 // Insert instance 2
 store.insertPublicationPreset(savedId);
 const inst2Id = useEditorStore.getState().selectedElementIds[0];
 assert.ok(inst2Id && inst2Id !== inst1Id);

 // Mutate instance 1
 store.updateSmartBlockContent(inst1Id, { title: "Modified Board Title" });
 assert.equal(useEditorStore.getState().elements[inst1Id].smartBlockData.semanticContent.title, "Modified Board Title");
 assert.equal(useEditorStore.getState().elements[inst2Id].smartBlockData.semanticContent.title, "Author Custom Experiment");
 assert.equal(useEditorStore.getState().publicationPresets[savedId].block.semanticContent.title, "Author Custom Experiment");
});

test('publication scene for image element preserves non-destructive adjustments for PDF export',()=>{
 const {publicationSceneForElement}=require('../src/editor/educational/publicationPdf.ts');
 const imgEl = {
   id: 'sample-img',
   pageId: 'page-1',
   type: 'picture-frame',
   category: 'media',
   version: 2,
   displayName: 'Specimen Photo',
   transform: { x: 40, y: 80, width: 240, height: 160, rotation: 0, zIndex: 1 },
   style: { borderRadius: 12, objectFit: 'cover' },
   content: {
     src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
     alt: 'Botanical leaf close-up',
     focalX: 0.25,
     focalY: 0.75,
     cropScale: 1.5,
     flipX: true,
     flipY: false,
     brightness: 1.1,
     contrast: 1.2,
     saturation: 1.3,
   },
   locked: false,
   hidden: false,
 };

 const scene = publicationSceneForElement(imgEl);
 assert.ok(scene);
 assert.equal(scene.nodes.length, 1);
 const node = scene.nodes[0];
 assert.equal(node.kind, 'image');
 assert.equal(node.focalX, 0.25);
 assert.equal(node.focalY, 0.75);
 assert.equal(node.scale, 1.5);
 assert.equal(node.flipX, true);
 assert.equal(node.brightness, 1.1);
 assert.equal(node.contrast, 1.2);
 assert.equal(node.saturation, 1.3);
 assert.equal(node.radius, 12);
});
