import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {EDUCATIONAL_LIBRARY,EDUCATIONAL_LIBRARY_BLOCKS}=require('../src/editor/educational/library/catalog.ts');
const {createSmartBlockInstance}=require('../src/editor/educational/blockRegistry.ts');
const {buildPublicationScene,textWidth,resolvePublicationPalette,expandSceneText}=require('../src/editor/educational/publicationScene.ts');
const {readEducationalField,editEducationalField}=require('../src/editor/educational/library/editing.ts');
const {collectPrintPages,buildPrintHtml}=require('../src/editor/publishing/publicationPrint.ts');
const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
const {useHistoryStore}=require('../src/editor/stores/historyStore.ts');
const {duplicateEducationalBlock}=require('../src/editor/educational/library/actions.ts');
const {publicationPreflight}=require('../src/editor/educational/publicationPreflight.ts');
const texts=s=>s.nodes.flatMap(expandSceneText).filter(n=>n.kind==='text').map(n=>n.text).join(' ');
const seedDimensions=structuredClone(useEditorStore.getState().books[0].dimensions);
const reset=()=>{const store=useEditorStore.getState(),base=store.books[0],page={id:'library-page',pageIndex:0,displayNumber:'1',elementIds:[],status:'Draft'};useEditorStore.setState({books:[{...base,dimensions:seedDimensions,id:'library-book',grade:'Grade 1',subject:'Science',pages:[page],chapters:[],units:[],masterPages:[],pageFrame:null}],activeBookId:'library-book',activePageIndex:0,elements:{},selectedElementIds:[]});useHistoryStore.getState().clearHistory();return useEditorStore.getState();};
test('every requested purpose is registered; primary blocks have three to five variants',()=>{
 assert.equal(EDUCATIONAL_LIBRARY.length,81);
 for(const entry of EDUCATIONAL_LIBRARY.slice(0,18))assert.ok(entry.variants.length>=3&&entry.variants.length<=5,entry.type);
 assert.ok(EDUCATIONAL_LIBRARY_BLOCKS['edu-teacher-note-standard']);assert.ok(EDUCATIONAL_LIBRARY_BLOCKS['edu-crossword-standard']);
});
test('all publication variants keep finite geometry and readable text within narrow and wide frames',()=>{
 for(const def of Object.values(EDUCATIONAL_LIBRARY_BLOCKS))for(const width of [180,320,480]){
  const block=createSmartBlockInstance(def.id,'p');block.transform.width=width;block.transform.height=0;
  const scene=buildPublicationScene(block);assert.ok(Number.isFinite(scene.height)&&scene.height>0,def.id);
  for(const node of scene.nodes){for(const key of ['x','y','w','h','size'])if(key in node)assert.ok(Number.isFinite(node[key]),`${def.id}/${width}/${key}`);
   if(node.kind==='text'){assert.ok(node.size>=9,def.id);for(const line of node.lines||[node.text])assert.ok(textWidth(line,node.size,node.bold,node.font==='serif',node.fontFamily)<=node.wrapWidth+.1,`${def.id}/${width}: ${line}`);assert.ok(node.x>=0&&node.x+(node.wrapWidth||0)<=width+.1,`${def.id}/${width}: text bounds`);}
  }
 }
});
test('subject and grade adaptation preserve content and change vector art and reading sizes',()=>{
 const b=createSmartBlockInstance('edu-do-you-know-visual-right','p'),content=structuredClone(b.semanticContent),math=buildPublicationScene({...b,subject:'mathematics'}),science=buildPublicationScene({...b,subject:'science'});
 assert.notDeepEqual(math.nodes,science.nodes);assert.notEqual(resolvePublicationPalette({...b,subject:'mathematics'}).primary,resolvePublicationPalette({...b,subject:'science'}).primary);
 const early=buildPublicationScene({...b,gradeBand:'early-years'}),upper=buildPublicationScene({...b,gradeBand:'primary-upper'});assert.ok(early.height>upper.height);assert.deepEqual(b.semanticContent,content);
});
test('semantic edits preserve neighbouring fields and reflow the complete paragraph',()=>{
 const b=createSmartBlockInstance('edu-solved-example-step-by-step','p');const original=buildPublicationScene(b).height;const long='Explain the place of each digit. '.repeat(60);
 b.semanticContent={...b.semanticContent,...editEducationalField(b.semanticContent,'steps.1.body',long)};
 assert.equal(readEducationalField(b.semanticContent,'steps.1.body'),long);assert.equal(b.semanticContent.steps[0].title,'Identify');assert.ok(buildPublicationScene(b).height>original+200);
 assert.deepEqual(editEducationalField(b.semanticContent,'__proto__.bad','bad'),{});
});
test('image slots use actual vector presets, then the uploaded image and its treatment',()=>{
 const b=createSmartBlockInstance('edu-picture-question-comparison','p'),before=buildPublicationScene(b);
 assert.equal(before.nodes.filter(n=>'imageSlot'in n).length,2);assert.ok(before.nodes.filter(n=>n.kind==='ellipse'||n.kind==='polygon'||n.kind==='path').length>=4);assert.ok(!texts(before).includes('Image Placeholder'));
 b.semanticContent.images=[{src:'data:image/png;base64,eA==',rawWidthPx:120,rawHeightPx:120,rotation:90,mask:'arch',scale:1.8,focalX:.2,opacity:.6,caption:'Look at these objects.'}];
 const after=buildPublicationScene(b),image=after.nodes.find(n=>n.kind==='image');assert.equal(image.rotation,90);assert.equal(image.mask,'arch');assert.equal(image.focalX,.2);assert.equal(image.opacity,.6);assert.ok(texts(after).includes('Look at these objects.'));
});
test('real insertion uses book context, safe horizontal margins, collision avoidance and one undo action',()=>{
 let store=reset();const a=store.addEducationalBlock('edu-do-you-know-compact',900,-20),book=useEditorStore.getState().getActiveBook();assert.ok(a);assert.equal(a.smartBlockData.subject,'science');assert.equal(a.smartBlockData.gradeBand,'primary-lower');assert.equal(a.transform.x,book.margins.insidePt);
 const b=useEditorStore.getState().addEducationalBlock('edu-fun-fact-quick-fact',90,a.transform.y);assert.ok(b);assert.ok(b.pageId!==a.pageId||b.transform.y>=a.transform.y+a.transform.height);useHistoryStore.getState().undo();assert.ok(!useEditorStore.getState().elements[b.id]);useHistoryStore.getState().redo();assert.ok(useEditorStore.getState().elements[b.id]);
});
test('variant switching, category conversion and reusable presets keep authored data and history',()=>{
 let store=reset();const el=store.addEducationalBlock('edu-do-you-know-editorial');const content={...el.smartBlockData.semanticContent,title:'AUTHORED TITLE',introText:'AUTHORED BODY'};store.updateSmartBlockContent(el.id,content);
 store=useEditorStore.getState();store.setEducationalBlockPreset(el.id,'edu-do-you-know-visual-left');assert.deepEqual(useEditorStore.getState().elements[el.id].smartBlockData.semanticContent,content);
 const original=useEditorStore.getState().elements[el.id],duplicate=duplicateEducationalBlock(original,'edu-fact-zone-statistic');assert.equal(duplicate.smartBlockData.semanticContent.title,'AUTHORED TITLE');assert.equal(duplicate.smartBlockData.semanticContent.introText,'AUTHORED BODY');assert.ok(texts(buildPublicationScene(duplicate.smartBlockData)).includes('AUTHORED BODY'));
 useHistoryStore.getState().undo();assert.ok(!useEditorStore.getState().elements[duplicate.id]);assert.ok(useEditorStore.getState().elements[original.id]);
 store=useEditorStore.getState();store.savePublicationPreset('Our discovery',original.id,'discover');const saved=Object.values(useEditorStore.getState().publicationPresets).find(p=>p.name==='Our discovery');assert.equal(saved.category,'discover');assert.equal(saved.block.semanticContent.introText,'AUTHORED BODY');
});
test('student print expands every wrapped line and keeps teacher answers excluded',()=>{
 let store=reset();const el=store.addEducationalBlock('edu-ask-a-question-think');store.updateSmartBlockContent(el.id,{questions:[{prompt:'Read the number carefully and explain how every digit changes the total. '.repeat(3),answer:'PRIVATE_TEACHER_ANSWER'}]});store=useEditorStore.getState();const book=store.getActiveBook(),pages=collectPrintPages(book,store.elements).map(page=>({...page,footer:undefined})),html=buildPrintHtml(book,pages,'');
 const scene=pages[0].elements.find(e=>e.element.id===el.id).scene;
 for(const node of scene.nodes.flatMap(expandSceneText).filter(n=>n.kind==='text'))assert.ok(html.includes(node.text.replaceAll('&','&amp;')),node.text);
 assert.ok(!html.includes('PRIVATE_TEACHER_ANSWER'));assert.ok(html.includes('data-print-text'));
});
test('500 inactive blocks render without mounting editors or fetching illustrations',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{EducationalBlock}=require('../src/editor/renderer/EducationalBlock.tsx');
 const before=performance.now();const markup=renderToStaticMarkup(React.createElement(React.Fragment,null,Array.from({length:500},(_,i)=>{const b=createSmartBlockInstance('edu-learning-outcomes-progress-path','p');return React.createElement(EducationalBlock,{key:i,selected:false,element:{id:b.id,smartBlockData:b,transform:b.transform,style:{},content:{}}});})));assert.equal((markup.match(/<svg/g)||[]).length,500);assert.ok(!markup.includes('<textarea')&&!markup.includes('<input'));assert.ok(performance.now()-before<3000);
});

test('publishing resize rewraps text and keeps readable type instead of stretching a source frame',()=>{
 const {withBlockTransform}=require('../src/editor/core/blockResize.ts');const store=reset(),el=store.addEducationalBlock('edu-do-you-know-visual-right');
 const next=withBlockTransform(el,{...el.transform,width:240});
 assert.equal(next.transform.width,240);assert.ok(next.transform.height>90);assert.equal(next.smartBlockData.styleOverrides.resizeFrame.width,240);
 const scene=buildPublicationScene(next.smartBlockData);assert.equal(scene.width,240);assert.ok(scene.nodes.find(n=>n.kind==='text'&&n.fieldPath==='introText').size>=11);
});
test('saved publishing templates preserve content and undo continuation page insertion together',()=>{
 let store=reset(),el=store.addEducationalBlock('edu-do-you-know-compact');store.updateSmartBlockContent(el.id,{introText:'A preserved custom fact.'});store=useEditorStore.getState();store.savePublicationPreset('Custom fact',el.id,'discover');const id=Object.keys(useEditorStore.getState().publicationPresets).find(id=>useEditorStore.getState().publicationPresets[id].name==='Custom fact');
 const count=store.getActiveBook().pages.length,before=Object.keys(store.elements);useEditorStore.getState().insertPublicationPreset(id);const after=useEditorStore.getState(),copy=Object.values(after.elements).find(e=>!before.includes(e.id));assert.ok(copy);assert.equal(copy.displayName,'Custom fact');assert.equal(copy.smartBlockData.semanticContent.introText,'A preserved custom fact.');
 useHistoryStore.getState().undo();assert.equal(useEditorStore.getState().getActiveBook().pages.length,count);assert.ok(!useEditorStore.getState().elements[copy.id]);
});
test('primary-school fractions and superscripts are shared vector notation and remain semantically editable',()=>{
 const b=createSmartBlockInstance('edu-formula-focus-expression-led','p');b.semanticContent.formula.expression=String.raw`A = \frac{1}{2} × b × h + x^{2}`;
 const scene=buildPublicationScene(b);assert.ok(scene.nodes.some(n=>n.kind==='line'&&n.strokeWidth===1));assert.ok(scene.nodes.some(n=>n.kind==='text'&&n.text==='2'&&n.size<20));assert.ok(scene.nodes.some(n=>n.kind==='rect'&&n.fieldPath==='formula.expression'));
 assert.equal(readEducationalField(b.semanticContent,'formula.expression'),String.raw`A = \frac{1}{2} × b × h + x^{2}`);assert.ok(!texts(scene).includes('\\frac'));
});
test('teacher notes are excluded from student pages and low effective image resolution is flagged',()=>{
 let store=reset(),teacher=store.addEducationalBlock('edu-teacher-note-standard');assert.equal(teacher.content.teacherOnly,true);
 const el=useEditorStore.getState().addEducationalBlock('edu-picture-question-one-image');useEditorStore.getState().updateSmartBlockContent(el.id,{images:[{src:'data:image/png;base64,eA==',rawWidthPx:120,rawHeightPx:120,scale:2}]});store=useEditorStore.getState();const pages=collectPrintPages(store.getActiveBook(),store.elements);assert.ok(pages.every(p=>p.elements.every(({element})=>element.id!==teacher.id)));assert.ok(publicationPreflight(store.getActiveBook(),store.elements).some(i=>i.category==='resolution'&&i.elementId===el.id));
});

test('simple legacy blocks migrate as an explicit copy without replacing their original design or adding example facts',()=>{
 const {getPresetsByArchetype}=require('../src/editor/educational/blockRegistry.ts'),{legacyPublishingPreset,upgradeLegacyEducationalBlock}=require('../src/editor/educational/library/actions.ts');const store=reset(),definition=getPresetsByArchetype('facts-curiosity').find(d=>!d.id.startsWith('edu-'));const original=store.addEducationalBlock(definition.id);const authored={title:'Our authored fact',introText:'Only our own words.',badgeLabel:'SOURCE 01'};useEditorStore.getState().updateSmartBlockContent(original.id,authored);const before=structuredClone(useEditorStore.getState().elements[original.id]);assert.ok(legacyPublishingPreset(before));const copy=upgradeLegacyEducationalBlock(before);assert.ok(copy);assert.equal(copy.version,4);assert.deepEqual(useEditorStore.getState().elements[original.id],before);assert.ok(texts(buildPublicationScene(copy.smartBlockData)).includes('Only our own words.'));assert.ok(texts(buildPublicationScene(copy.smartBlockData)).includes('SOURCE 01'));useHistoryStore.getState().undo();assert.ok(!useEditorStore.getState().elements[copy.id]);
});

test('fit and fill respect the rotated dimensions of an uploaded photograph',()=>{
 const {imagePlacement}=require('../src/editor/educational/publicationScene.ts');const image={kind:'image',x:0,y:0,w:100,h:120,sourceWidth:800,sourceHeight:200,rotation:90,scale:1,focalX:.5,focalY:.5};const fit=imagePlacement({...image,fit:'contain'});assert.ok(fit.h<=image.w&&fit.w<=image.h);const fill=imagePlacement({...image,fit:'cover'});assert.ok(fill.h>=image.w&&fill.w>=image.h);
});

test('narrow custom pages reject insertion and copies without creating overflow or history',()=>{
 let store=reset();const original=store.addEducationalBlock('edu-do-you-know-compact');
 const book=useEditorStore.getState().getActiveBook();useEditorStore.setState({books:[{...book,dimensions:{...book.dimensions,widthPt:160}}]});useHistoryStore.getState().clearHistory();
 const before=structuredClone(useEditorStore.getState().elements),pages=useEditorStore.getState().getActiveBook().pages.length;
 assert.equal(useEditorStore.getState().addEducationalBlock('edu-fun-fact-quick-fact'),null);assert.equal(duplicateEducationalBlock(original),null);
 assert.deepEqual(useEditorStore.getState().elements,before);assert.equal(useEditorStore.getState().getActiveBook().pages.length,pages);assert.equal(useHistoryStore.getState().canUndo,false);
});

test('restyled story drop caps retain every character across whitespace and long-word wraps',()=>{
 const passage='Mira   read\ncarefully. Supercalifragilisticexpialidocious appeared on the next line. Every word matters.';
 for(const width of [180,320,480]){const b=createSmartBlockInstance('edu-opening-story-illustrated','p');b.transform.width=width;b.semanticContent.passage=passage;const scene=buildPublicationScene(b),start=scene.nodes.findIndex(n=>n.kind==='text'&&n.text==='M');
 const rendered=scene.nodes.slice(start).filter(n=>n.kind==='text'&&n.fieldPath!=='quote').slice(0,3).map(n=>n.text).join('');assert.equal(rendered.replaceAll(/\s/g,''),passage.replaceAll(/\s/g,''));}
});
test('existing publishing frames grow safely without changing content or legacy layouts',()=>{
 const {refreshPublishingLayout}=require('../src/editor/educational/library/refreshLayout.ts');let store=reset();const original=store.addEducationalBlock('edu-do-you-know-visual-right');const old={...original,transform:{...original.transform,height:100,y:700}};const legacy={...old,id:'legacy-static',smartBlockData:undefined,type:'shape',transform:{...old.transform,x:20,y:30,width:40,height:40}};const book=store.getActiveBook(),elements={[old.id]:old,[legacy.id]:legacy},sourceBook={...book,pages:[{...book.pages[0],elementIds:[old.id,legacy.id]}]};
 const result=refreshPublishingLayout(sourceBook,elements);assert.ok(result.changed);assert.ok(result.elements[old.id].transform.height>100);assert.notEqual(result.elements[old.id].pageId,old.pageId);assert.deepEqual(result.elements[old.id].smartBlockData.semanticContent,old.smartBlockData.semanticContent);assert.equal(result.elements[legacy.id],legacy);assert.equal(old.transform.height,100);assert.ok(!publicationPreflight(result.book,result.elements).some(i=>i.severity==='error'&&i.category==='geometry'));
 const locked={...old,locked:true};assert.equal(refreshPublishingLayout(sourceBook,{...elements,[old.id]:locked}).changed,false);
});
test('solid chapter banners maintain readable contrast in every automatic subject palette',()=>{
 const {SUBJECT_PALETTES}=require('../src/domain/educational/designTokens.ts'),{contrastRatio}=require('../src/editor/design/contrast.ts');
 for(const subject of Object.keys(SUBJECT_PALETTES)){const b=createSmartBlockInstance('edu-topic-banner-horizontal','p');b.subject=subject;const scene=buildPublicationScene(b),p=resolvePublicationPalette(b);for(const n of scene.nodes.filter(n=>n.kind==='text'&&['title','subtitle','introText'].includes(n.fieldPath)))assert.ok(contrastRatio(n.fill,p.primary)>=4.5,subject);}
});
