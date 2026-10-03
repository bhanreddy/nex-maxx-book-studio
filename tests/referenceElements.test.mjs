import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const {makeReferenceLibraryBlock}=require('../src/editor/curriculum/libraryExamples.ts');
const {REFERENCE_ELEMENTS,withReferenceElements}=require('../src/editor/curriculum/referenceElements.ts');
const {buildPublicationScene}=require('../src/editor/educational/publicationScene.ts');
const {detachPublicationScene}=require('../src/editor/educational/detachScene.ts');
const {sceneWindows,sliceScene}=require('../src/editor/curriculum/pagination.ts');
const engine=require('../src/editor/curriculum/chapterEngine.ts');
const actions=require('../src/editor/curriculum/actions.ts');
const {useEditorStore}=require('../src/editor/stores/editorStore.ts');
const {useHistoryStore}=require('../src/editor/stores/historyStore.ts');
const words=scene=>scene.nodes.filter(n=>n.kind==='text').map(n=>n.text).join(' ');

test('all reference variants render finite, in-bounds editable vectors across subjects and widths',()=>{
  for(const {kind} of REFERENCE_ELEMENTS)for(const subject of ['Maths','Science','English','Hindi','Telugu','Music','My own subject'])for(const width of [180,320,517,900]){
    const block=makeReferenceLibraryBlock(kind,3,subject);block.transform.width=width;
    const scene=buildPublicationScene(block);assert.ok(scene.height>60);
    for(const n of scene.nodes){
      for(const key of ['x','y','w','h','rx','ry','size'])if(key in n)assert.ok(Number.isFinite(n[key]),`${kind}/${width}/${key}`);
      if(n.kind==='text')assert.ok(n.y<=scene.height,`${kind}: text exceeds measured height`);
      if(n.kind==='rect')assert.ok(n.w>=0 && n.h>=0);
    }
    assert.ok(!scene.nodes.some(n=>n.kind==='image'),'Reference design itself must be editable vectors');
    assert.equal(scene.variant,`reference-${kind}`);
  }
});

test('long content continues losslessly, preserves Unicode and hides answers from student output',()=>{
  const block=makeReferenceLibraryBlock('mental',5,'Hindi');block.transform.width=320;
  block.semanticContent.questions=Array.from({length:24},(_,i)=>({prompt:`Question ${i}: संख्या మరియు పదాలు ${'Explain your reasoning. '.repeat(8)}`,answer:`PRIVATE ANSWER ${i}`}));
  const scene=buildPublicationScene(block),parts=sceneWindows(scene,640).map(w=>sliceScene(scene,w));
  const texts=s=>s.nodes.filter(n=>n.kind==='text').map(n=>n.text);
  assert.deepEqual(parts.flatMap(texts).sort(),texts(scene).sort());
  assert.ok(!words(scene).includes('PRIVATE ANSWER'));
  assert.ok(words(buildPublicationScene(block,{teacher:true})).includes('PRIVATE ANSWER 23'));
  const layers=detachPublicationScene(block,10);
  assert.deepEqual(layers.filter(el=>el.type==='body').map(el=>el.content.text).sort(),texts(scene).sort());
  assert.ok(layers.every(el=>!el.locked));
});

function reset(){const book=structuredClone(useEditorStore.getState().getActiveBook());book.id=crypto.randomUUID();book.chapters=[];book.units=[];book.pages=[{...book.pages[0],id:crypto.randomUUID(),elementIds:[],chapterId:undefined}];useEditorStore.setState({books:[book],activeBookId:book.id,activePageIndex:0,elements:{},selectedElementIds:[]});useHistoryStore.getState().clearHistory();}

test('one chapter-wide action preserves canonical content, every page, unrelated layers and undo/redo; new inserts inherit',()=>{
  reset();const chapter=actions.createFrameworkChapter({...engine.DEFAULT_CHAPTER_CONFIG,subject:'Science',pageCount:3});
  const before=structuredClone(useEditorStore.getState().getActiveBook());
  actions.applyChapterReferenceElements(chapter.id);
  let state=useEditorStore.getState(),book=state.getActiveBook(),framework=book.chapters[0].framework;
  assert.equal(framework.config.referenceElements,true);
  for(const [id,block] of Object.entries(framework.blocks))assert.deepEqual(block.semanticContent,before.chapters[0].framework.blocks[id].semanticContent);
  for(const page of book.pages.filter(p=>p.chapterId===chapter.id))for(const id of page.elementIds){const el=state.elements[id];if(el.category==='decorative')continue;assert.ok(el.transform.y+el.transform.height<=book.dimensions.heightPt-book.margins.bottomPt+.01);}
  useHistoryStore.getState().undo();assert.deepEqual(useEditorStore.getState().getActiveBook(),before);
  useHistoryStore.getState().redo();assert.equal(useEditorStore.getState().getActiveBook().chapters[0].framework.config.referenceElements,true);
  const firstPage=useEditorStore.getState().getActiveBook().pages.findIndex(p=>p.chapterId===chapter.id);useEditorStore.setState({activePageIndex:firstPage});
  actions.insertCurriculumBlock('quick-check',undefined,3,'Science',engine.makeCurriculumBlock('quick-check',engine.DEFAULT_CHAPTER_CONFIG));
  const id=useEditorStore.getState().selectedElementIds[0];assert.equal(useEditorStore.getState().elements[id].smartBlockData.styleOverrides.referenceElement.kind,'quick-check');
});

test('standalone elements unlock into independent text/shape layers and undo restores exact page order',()=>{
  reset();const block=makeReferenceLibraryBlock('exercise');actions.insertCurriculumBlock('chapter-exercise',undefined,3,'Science',block);
  const state=useEditorStore.getState(),el=state.elements[state.selectedElementIds[0]],order=[...state.getActivePage().elementIds];
  actions.unlockCurriculumLayers(el);
  assert.ok(!useEditorStore.getState().elements[el.id]);
  const layers=Object.values(useEditorStore.getState().elements);assert.ok(layers.some(el=>el.type==='body'));assert.ok(layers.some(el=>el.type==='shape'));
  useHistoryStore.getState().undo();assert.deepEqual(useEditorStore.getState().getActivePage().elementIds,order);assert.ok(useEditorStore.getState().elements[el.id].smartBlockData);
});

test('styling and serialization preserve every content field and custom controls including deliberate blanks',()=>{
  const block=engine.makeCurriculumBlock('worked-example',engine.DEFAULT_CHAPTER_CONFIG);
  block.semanticContent={title:'Custom subject example',introText:'My explanation',items:['My first item','My second item'],questions:[{prompt:'My question',answer:'My answer'}],steps:[{stepNumber:1,title:'My step',body:'My method'}],metadata:{owner:'author'}};
  const styled=withReferenceElements(block);assert.deepEqual(styled.semanticContent,block.semanticContent);
  styled.styleOverrides.referenceElement={kind:'exercise',number:'2.3',icon:'flask',skillLabel:'',hint:'Custom hint',answerLabel:'Result',answerLines:4};
  styled.styleOverrides.customPalette={primary:'#123456',accent:'#ab2345',surface:'#fafafa',text:'#112233',border:'#332211'};
  const restored=JSON.parse(JSON.stringify(styled)),scene=buildPublicationScene(restored);
  assert.equal(withReferenceElements(restored).styleOverrides.referenceElement.kind,'exercise','Chapter reapplication must preserve an author-selected design');
  assert.ok(words(scene).includes('2.3'));assert.ok(words(scene).includes('Custom hint'));assert.ok(scene.nodes.some(n=>n.fill==='#123456'));
  assert.deepEqual(restored.semanticContent,block.semanticContent);
});


test('standalone reference edits synchronize every continuation and never overflow page margins',()=>{
  reset();const block=makeReferenceLibraryBlock('puzzle');
  block.semanticContent.items=Array.from({length:30},(_,i)=>`Clue ${i}: ${'Read and explain this clue. '.repeat(5)}`);
  actions.insertCurriculumBlock('puzzle',undefined,3,'Science',block);
  let state=useEditorStore.getState(),id=state.selectedElementIds[0],book=state.getActiveBook();
  const pieces=Object.values(state.elements).filter(el=>el.smartBlockData?.curriculum?.sourceBlockId===id);
  assert.ok(pieces.length>1);
  for(const el of pieces)assert.ok(el.transform.y+el.transform.height<=book.dimensions.heightPt-book.margins.bottomPt+.01);
  state.updateSmartBlockContent(pieces.at(-1).id,{items:['Revised clue A','Revised clue B']});
  state=useEditorStore.getState();assert.deepEqual(state.elements[id].smartBlockData.semanticContent.items,['Revised clue A','Revised clue B']);
  assert.ok(state.getActiveBook().pages.length<book.pages.length);
  useHistoryStore.getState().undo();state=useEditorStore.getState();assert.equal(state.elements[id].smartBlockData.semanticContent.items.length,30);
  actions.unlockCurriculumLayers(state.elements[id]);state=useEditorStore.getState();
  assert.ok(!Object.values(state.elements).some(el=>el.smartBlockData?.curriculum?.sourceBlockId===id));
  useHistoryStore.getState().undo();assert.ok(useEditorStore.getState().elements[id].smartBlockData);
});

test('freeform chapter application handles every page, locked objects and overflow in a single undoable change',()=>{
  reset();actions.insertCurriculumBlock('quick-check');
  let state=useEditorStore.getState(),book=structuredClone(state.getActiveBook());
  const first=state.selectedElementIds[0],chapterId=crypto.randomUUID();
  const chapter={id:chapterId,unitId:'unit',number:1,title:'My science chapter',learningObjectives:[],pageIds:book.pages.map(p=>p.id)};
  book.chapters=[chapter];book.pages.forEach(p=>p.chapterId=chapterId);
  const elements=structuredClone(state.elements);
  elements[first].transform.y=book.dimensions.heightPt-book.margins.bottomPt-20;
  const locked={...structuredClone(elements[first]),id:'locked-example',locked:true,transform:{...elements[first].transform,y:200,height:80}};
  locked.smartBlockData.id=locked.id;
  locked.smartBlockData.curriculum.sourceBlockId=locked.id;
  elements[locked.id]=locked;book.pages[0].elementIds.push(locked.id);
  useEditorStore.setState({books:[book],elements});const before=structuredClone(useEditorStore.getState().getActiveBook());
  actions.applyChapterReferenceElements(chapterId);
  state=useEditorStore.getState();assert.deepEqual(state.elements[locked.id],locked);assert.ok(state.getActiveBook().pages.length>before.pages.length);
  assert.equal(state.getActiveBook().chapters[0].referenceElements,true);
  for(const el of Object.values(state.elements).filter(el=>el.smartBlockData?.styleOverrides.referenceElement))assert.ok(el.transform.y+el.transform.height<=book.dimensions.heightPt-book.margins.bottomPt+.01);
  assert.deepEqual(state.elements[first].smartBlockData.semanticContent,elements[first].smartBlockData.semanticContent);
  useHistoryStore.getState().undo();assert.deepEqual(useEditorStore.getState().getActiveBook(),before);assert.deepEqual(useEditorStore.getState().elements,elements);
});

test('reference PDF output retains vector geometry and selectable questions without teacher answers',()=>{
  const {jsPDF}=require('jspdf');const {renderPublicationPdf}=require('../src/editor/educational/publicationPdf.ts');
  const block=makeReferenceLibraryBlock('quick-check');const scene=buildPublicationScene(block);
  const pdf=new jsPDF({unit:'pt',format:'a4'});
  return renderPublicationPdf(pdf,scene,{transform:{...block.transform,height:scene.height},style:{},content:{}},36,36).then(()=>{const output=pdf.output();assert.ok(output.includes('Which part absorbs water?'));assert.ok(!output.includes('The roots.'));});
});

test('twelve premium banners default to a header, preserve worksheet source and remain additive',()=>{
  const {PREMIUM_REFERENCE_ELEMENTS}=require('../src/editor/curriculum/referenceElements.ts');
  assert.equal(PREMIUM_REFERENCE_ELEMENTS.length,12);
  assert.equal(REFERENCE_ELEMENTS.filter(p=>!p.premium).length,10);
  for(const preset of PREMIUM_REFERENCE_ELEMENTS){
    const block=makeReferenceLibraryBlock(preset.kind,3,'Science'),source=structuredClone(block.semanticContent);
    const banner=buildPublicationScene(block);assert.equal(block.styleOverrides.referenceElement.showBody,false);
    assert.ok(banner.nodes.some(n=>n.kind==='text'&&n.fieldPath==='title'));
    assert.ok(!words(banner).includes('Which part absorbs water?'));
    block.styleOverrides.referenceElement.showBody=true;
    const worksheet=buildPublicationScene(block);assert.ok(worksheet.height>banner.height);
    assert.deepEqual(block.semanticContent,source);
    assert.equal(withReferenceElements(block).styleOverrides.referenceElement.kind,preset.kind);
    const restored=JSON.parse(JSON.stringify(block));assert.deepEqual(buildPublicationScene(restored),worksheet);
    block.styleOverrides.customPalette={text:preset.premium.layout==='nocturne'||preset.premium.layout==='flag'?'#FFF9F0':'#54356E'};
    const custom=buildPublicationScene(block).nodes.find(n=>n.kind==='text'&&n.fieldPath==='title');
    assert.equal(custom.fill,block.styleOverrides.customPalette.text,'Readable authored text colours remain editable');
  }
});

test('premium banners rewrap long and regional-language headings with bounded readable type',()=>{
  const {PREMIUM_REFERENCE_ELEMENTS}=require('../src/editor/curriculum/referenceElements.ts');
  const {expandSceneText,textWidth}=require('../src/editor/educational/publicationScene.ts');
  for(const preset of PREMIUM_REFERENCE_ELEMENTS)for(const width of [180,320,517,900])for(const heading of [preset.premium.title,'A long heading that explains what students will learn and invites them to investigate','తెలుగు భాషలో కొత్త ఆలోచనలు మరియు అన్వేషణ','नए विचारों की खोज और अभ्यास']){
    const block=makeReferenceLibraryBlock(preset.kind);block.transform.width=width;block.semanticContent.title=heading;
    if(preset.kind==='premium-exercise')block.styleOverrides.referenceElement.number='12345.67890';
    const scene=buildPublicationScene(block);
    for(const node of scene.nodes.flatMap(expandSceneText).filter(n=>n.kind==='text')){
      assert.ok(node.x>=0&&node.y<=scene.height&&Number.isFinite(node.y),`${preset.kind}/${width}: text within measured height`);
      assert.ok(textWidth(node.text,node.size,!!node.bold,node.font==='serif',node.fontFamily)<=node.wrapWidth+.01,`${preset.kind}/${width}: measured text fits`);
      assert.ok(node.x+node.wrapWidth<=scene.width+.01,`${preset.kind}/${width}: reading width fits`);
      if(node.fieldPath==='title')assert.ok(node.size>=20);
    }
  }
});

test('premium banners retain native print text, grayscale geometry and separate editable layers',async()=>{
  const {PREMIUM_REFERENCE_ELEMENTS}=require('../src/editor/curriculum/referenceElements.ts');
  const {jsPDF}=require('jspdf');const {renderPublicationPdf}=require('../src/editor/educational/publicationPdf.ts');
  for(const preset of PREMIUM_REFERENCE_ELEMENTS){
    const block=makeReferenceLibraryBlock(preset.kind);
    const layers=detachPublicationScene(block,10);assert.ok(layers.some(el=>el.type==='body'));assert.ok(layers.some(el=>el.type==='shape'));assert.ok(layers.every(el=>!el.locked));
    block.styleOverrides.printMode='grayscale';
    const scene=buildPublicationScene(block);
    for(const node of scene.nodes)for(const colour of [node.fill,node.stroke].filter(c=>/^#[\da-f]{6}$/i.test(c||'')))assert.ok(colour.slice(1,3)===colour.slice(3,5)&&colour.slice(3,5)===colour.slice(5,7));
    const pdf=new jsPDF({unit:'pt',format:'a4'});await renderPublicationPdf(pdf,scene,{transform:{...block.transform,height:scene.height},style:{},content:{}},36,36);
    assert.ok(pdf.output().includes(preset.premium.title));
  }
});
