import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { REFERENCE_ARTWORKS, referenceBannerId } = require('../src/editor/educational/referenceBanners.ts');
const { REFERENCE_WORKSHEETS } = require('../src/editor/educational/referenceWorksheets.ts');
const { createSmartBlockInstance } = require('../src/editor/educational/blockRegistry.ts');
const { buildPublicationScene } = require('../src/editor/educational/publicationScene.ts');
const { publicationSceneForElement } = require('../src/editor/educational/publicationPdf.ts');
const { contentNodeBounds } = require('../src/editor/educational/sceneBounds.ts');
const { readEducationalField, editEducationalField } = require('../src/editor/educational/library/editing.ts');
const { collectPrintPages, buildPrintHtml } = require('../src/editor/publishing/publicationPrint.ts');
const { duplicateEducationalBlock } = require('../src/editor/educational/library/actions.ts');
const { useEditorStore } = require('../src/editor/stores/editorStore.ts');
const { useHistoryStore } = require('../src/editor/stores/historyStore.ts');
const baseBook = structuredClone(useEditorStore.getState().books[0]);
function reset() {
 const page={id:'worksheet-page',pageIndex:0,displayNumber:'1',elementIds:[],status:'Draft'};
 useEditorStore.setState({books:[{...structuredClone(baseBook),id:'worksheet-book',pages:[page],grade:'Grade 3',subject:'Science',chapters:[],units:[],masterPages:[],pageFrame:null}],activeBookId:'worksheet-book',activePageIndex:0,elements:{},selectedElementIds:[],publicationPresets:{}});
 useHistoryStore.getState().clearHistory(); return useEditorStore.getState();
}
test('nine worksheets preserve lossless originals, native proportions and original transparency',()=>{
 assert.equal(REFERENCE_WORKSHEETS.length,9);assert.equal(REFERENCE_ARTWORKS.length,19);
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/assets/reference-banners/worksheets-manifest.json',import.meta.url)));
 for(const worksheet of REFERENCE_WORKSHEETS){
  const source=worksheet.worksheet, asset=manifest.assets.find(a=>a.slug===worksheet.slug);
  for(const suffix of ['', '-blank']){
   const bytes=fs.readFileSync(new URL(`../public/assets/reference-banners/${worksheet.slug}${suffix}.png`,import.meta.url));
   assert.equal(bytes.subarray(1,4).toString(),'PNG');
   const expected = suffix && source.blankSize ? source.blankSize : source;
   assert.ok(Math.abs(bytes.readUInt32BE(16)-expected.width)<=1);assert.equal(bytes.readUInt32BE(20),expected.height);
   assert.ok(Math.abs(bytes.readUInt32BE(16)/bytes.readUInt32BE(20)/(source.width/source.height)-1)<.003);
   assert.equal(bytes[25],asset[suffix?'textFree':'original'].pngColourType);
   if(source.transparent) assert.equal(bytes[25],6);
   assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset[suffix?'textFree':'original'].sha256);
  }
  for(const width of [180,480,660])for(const version of ['original','blank','editable']){
   const block=createSmartBlockInstance(referenceBannerId(worksheet.slug),'page');
   block.transform.width=width;block.styleOverrides.referenceBannerVersion=version;
   const scene=buildPublicationScene(block);
   assert.ok(Math.abs(scene.height-width*source.height/source.width)<1e-9);
   assert.equal(scene.nodes.filter(n=>n.kind==='image').length,1);
   const texts=scene.nodes.filter(n=>n.kind==='text');
   if(version==='editable'){
    assert.equal(texts.filter(n=>n.text&&(!n.fieldPath||n.fieldPath==='title')).map(n=>n.text).join(' '),worksheet.title);
    assert.equal(texts.filter(n=>n.fieldPath?.startsWith('items.')).length,source.rows?.length||0);
    for(const text of texts.filter(n=>n.fieldPath)){
     const bounds=contentNodeBounds(text);assert.ok(bounds.width>0&&bounds.height>0);
     assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=scene.width+.01&&bounds.y+bounds.height<=scene.height+.01);
    }
   }else assert.equal(texts.length,0);
  }
 }
});
test('worksheet insertion, editable rows, mode changes, palettes and undo preserve semantic content',()=>{
 const store=reset();const element=store.addEducationalBlock(referenceBannerId('learning-objectives'),undefined,undefined,{subject:'science',referenceBannerVersion:'editable',referenceBannerColour:'violet'});
 assert.equal(element.smartBlockData.semanticContent.title,'Learning Objectives');
 assert.deepEqual(element.smartBlockData.semanticContent.items,['','','','']);
 useHistoryStore.getState().undo();assert.equal(useEditorStore.getState().elements[element.id],undefined);
 useHistoryStore.getState().redo();assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.styleOverrides.referenceBannerColour,'violet');
 const title='Our Learning Goals', items=['Name the parts of a plant.','Explain how roots absorb water.','Compare two different leaves.','Draw and label a flowering plant.'];
 store.updateSmartBlockContent(element.id,{title,items});
 useHistoryStore.getState().undo();assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent.title,'Learning Objectives');useHistoryStore.getState().redo();
 for(const referenceBannerVersion of ['blank','original','editable']){
  store.updateSmartBlockStyle(element.id,{referenceBannerVersion});
  const edited=useEditorStore.getState().elements[element.id];assert.equal(edited.smartBlockData.semanticContent.title,title);assert.deepEqual(edited.smartBlockData.semanticContent.items,items);
 }
 store.shuffleEducationalBlockStyle(element.id);
 const latest=useEditorStore.getState().elements[element.id];assert.notEqual(latest.smartBlockData.styleOverrides.referenceBannerColour,'violet');assert.deepEqual(latest.smartBlockData.semanticContent.items,items);
 const duplicate=duplicateEducationalBlock(latest);assert.deepEqual(duplicate.smartBlockData.semanticContent,latest.smartBlockData.semanticContent);
 store.savePublicationPreset('Our objectives',element.id,'banners');
 const preset=Object.entries(useEditorStore.getState().publicationPresets).find(([,p])=>p.name==='Our objectives');store.insertPublicationPreset(preset[0]);
 assert.equal(Object.values(useEditorStore.getState().elements).filter(e=>e.smartBlockData?.semanticContent.title===title).length,3);
 store.updateElement(element.id,{locked:true});store.updateSmartBlockContent(element.id,{title:'Blocked'});assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent.title,title);
});
test('worksheet semantic fields support empty headings, body editing, wrapped export and live print text',()=>{
 const store=reset();const element=store.addEducationalBlock(referenceBannerId('skill-builder'),undefined,undefined,{referenceBannerVersion:'editable'});
 const title='Explore & Explain',body='Observe a leaf. Draw its shape, then explain how its surface helps the plant collect sunlight. Compare your drawing with a partner.';
 store.updateSmartBlockContent(element.id,editEducationalField(element.smartBlockData.semanticContent,'calloutText',body));store.updateSmartBlockContent(element.id,{title});
 const latest=useEditorStore.getState().elements[element.id], reloaded=JSON.parse(JSON.stringify(latest));
 assert.equal(readEducationalField(reloaded.smartBlockData.semanticContent,'calloutText'),body);
 const scene=publicationSceneForElement(reloaded),text=scene.nodes.find(n=>n.fieldPath==='calloutText');
 assert.equal(text.text,body);assert.ok(text.lines.length>1);assert.equal(scene.warnings.length,0);
 const pages=collectPrintPages(useEditorStore.getState().getActiveBook(),useEditorStore.getState().elements);
 for(const page of pages)for(const scene of [page.frame,page.footer,...page.elements.map(e=>e.scene)].filter(Boolean))for(const node of scene.nodes)if(node.kind==='image')node.src='data:image/png;base64,AAAA';
 const html=buildPrintHtml(useEditorStore.getState().getActiveBook(),pages,'');assert.match(html,/Explore &amp; Explain/);assert.match(html,/Observe a leaf/);assert.match(html,/font-weight="900"/);assert.match(html,/data-print-text="1"/);
 store.updateSmartBlockContent(element.id,{title:''});const empty=buildPublicationScene(useEditorStore.getState().elements[element.id].smartBlockData).nodes.find(n=>n.fieldPath==='title');assert.ok(empty.editBounds);assert.equal(empty.text,'');
});

test('Lesson Map has six separately editable badge labels and step boxes, retained across modes and export',()=>{
 const store=reset();const element=store.addEducationalBlock(referenceBannerId('lesson-map'),undefined,undefined,{subject:'science',referenceBannerVersion:'editable',referenceBannerColour:'teal'});
 assert.equal(element.smartBlockData.semanticContent.title,'Lesson Map');
 assert.deepEqual(element.smartBlockData.semanticContent.steps.map(s=>s.title),['1','2','3','4','5','6']);
 const initial=buildPublicationScene(element.smartBlockData);assert.equal(initial.nodes.filter(n=>n.fieldPath?.startsWith('steps.')).length,12);
 let content=element.smartBlockData.semanticContent;
 for(const [path,value] of [['steps.0.title','A'],['steps.0.body','Observe a seed'],['steps.5.title','F'],['steps.5.body','Share your findings']]){
  const edit=editEducationalField(content,path,value);content={...content,...edit};store.updateSmartBlockContent(element.id,edit);
 }
 assert.equal(readEducationalField(content,'steps.0.title'),'A');assert.equal(readEducationalField(content,'steps.5.body'),'Share your findings');
 for(const referenceBannerVersion of ['blank','original','editable']){
  store.updateSmartBlockStyle(element.id,{referenceBannerVersion});
  const latest=useEditorStore.getState().elements[element.id];assert.deepEqual(latest.smartBlockData.semanticContent,content);
  const scene=publicationSceneForElement(latest);assert.equal(scene.nodes.filter(n=>n.kind==='text').length,referenceBannerVersion==='editable'?14:0);
 }
 store.shuffleEducationalBlockStyle(element.id);assert.deepEqual(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent,content);
 const scene=publicationSceneForElement(JSON.parse(JSON.stringify(useEditorStore.getState().elements[element.id])));
 assert.equal(scene.nodes.find(n=>n.fieldPath==='steps.0.title').text,'A');assert.equal(scene.nodes.find(n=>n.fieldPath==='steps.5.body').text,'Share your findings');assert.equal(scene.warnings.length,0);
 const pages=collectPrintPages(useEditorStore.getState().getActiveBook(),useEditorStore.getState().elements);
 for(const page of pages)for(const scene of [page.frame,page.footer,...page.elements.map(e=>e.scene)].filter(Boolean))for(const node of scene.nodes)if(node.kind==='image')node.src='data:image/png;base64,AAAA';
 const html=buildPrintHtml(useEditorStore.getState().getActiveBook(),pages,'');assert.match(html,/Observe a seed/);assert.match(html,/Share your findings/);
 useHistoryStore.getState().undo();assert.equal(useEditorStore.getState().elements[element.id].smartBlockData.styleOverrides.referenceBannerColour,'teal');
 store.updateElement(element.id,{locked:true});store.updateSmartBlockContent(element.id,{steps:[]});assert.deepEqual(useEditorStore.getState().elements[element.id].smartBlockData.semanticContent.steps,content.steps);
});
test('new six-row objectives and orange reader keep distinct IDs, editable content, proportions and palettes',()=>{
 const store=reset(),six=store.addEducationalBlock(referenceBannerId('learning-objectives-six'),undefined,undefined,{referenceBannerVersion:'editable'}),reader=store.addEducationalBlock(referenceBannerId('fun-fact-reader'),undefined,undefined,{referenceBannerVersion:'editable'});
 assert.equal(six.smartBlockData.semanticContent.items.length,6);assert.equal(six.smartBlockData.semanticContent.title,'Learning Objectives');
 store.updateSmartBlockContent(six.id,{items:['Identify','Observe','Compare','Explain','Apply','Reflect']});
 store.updateSmartBlockContent(reader.id,{title:'Amazing Plants',calloutText:'Plants use sunlight to make food. Observe the leaves around you.'});
 const original=structuredClone(useEditorStore.getState().elements[reader.id].smartBlockData.semanticContent);store.shuffleEducationalBlockStyle(reader.id);
 const latest=useEditorStore.getState().elements[reader.id];assert.deepEqual(latest.smartBlockData.semanticContent,original);assert.notEqual(latest.smartBlockData.presetId,referenceBannerId('fun-fact'));
 const scene=publicationSceneForElement(latest);assert.equal(scene.nodes.find(n=>n.fieldPath==='calloutText').text,original.calloutText);assert.ok(Math.abs(scene.height-scene.width/3)<1e-9);
 const objectives=publicationSceneForElement(useEditorStore.getState().elements[six.id]);assert.equal(objectives.nodes.find(n=>n.fieldPath==='items.5').text,'Reflect');assert.equal(objectives.warnings.length,0);
});
