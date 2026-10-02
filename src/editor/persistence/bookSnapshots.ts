import type {Book,Chapter,PageDefinition} from '../../domain/book/types';
import type {PageElement} from '../../domain/element/types';
import type {SmartBlockInstance} from '../../domain/educational/blockSchema';
import {assetRenderUrl,type AssetPin} from './assetReferences';
import {toSemanticDocument,restoreSemanticFramework,type SemanticDocument} from './semanticDocument';
export interface BookDocument {bookSchemaVersion:1;title:string;language:string;bookType:string;edition:string;chapterIds:string[];settings:Record<string,unknown>}
export interface ChapterLayoutDocument {
  layoutSchemaVersion:1;bookId:string;chapterId:string;
  pages:{id:string;pageIndex:number;displayNumber:string;elementIds:string[];settings:Record<string,unknown>}[];
  elements:Record<string,{id:string;pageId:string;semanticBlockId?:string;nativeContentId?:string;transform:PageElement['transform'];style:PageElement['style'];settings:Record<string,unknown>}>;
  blockPresentation:Record<string,Record<string,unknown>>;
}
export interface BookSnapshotDocument extends SemanticDocument {bookLayout:ChapterLayoutDocument}
export function serializeBook(book:Book,chapterIds:string[]):BookDocument {
  const {pages,chapters,units,comments,updatedAt,...settings}=book;
  const chapterIndex=chapters.map(({framework,pageIds,...chapter})=>({...chapter,pageIds:[],centralChapterId:chapterIds[chapters.findIndex(c=>c.id===chapter.id)]}));
  const bookType=book.type.toUpperCase().replaceAll(' ','_');
  return {bookSchemaVersion:1,title:book.title,language:book.language,bookType,edition:String(book.version),chapterIds,settings:{...settings,units,chapterIndex,comments:comments||[]}};
}
const PRESENTATION_KEYS=new Set(['transform','styleOverrides','pageId','motifs','sceneSlice','x','y','w','h','rotation','pageCount','personality','complexity','preset','brandAccent','compositionRevision','presetId','family','design','style','fontFamily','fontSize']);
function separatePresentation(value:unknown):{semantic:unknown;presentation?:unknown}{
  if(!value||typeof value!=='object')return {semantic:value};
  if(Array.isArray(value)){
    const split=value.map(separatePresentation);
    return {semantic:split.map(v=>v.semantic),...(split.some(v=>v.presentation!==undefined)?{presentation:split.map(v=>v.presentation??null)}:{})};
  }
  const semantic:Record<string,unknown>={},presentation:Record<string,unknown>={};
  for(const [key,item] of Object.entries(value)){
    if(PRESENTATION_KEYS.has(key)){presentation[key]=item;continue;}
    const split=separatePresentation(item);semantic[key]=split.semantic;
    if(split.presentation!==undefined)presentation[key]=split.presentation;
  }
  return {semantic,...(Object.keys(presentation).length?{presentation}:{})};
}
function joinPresentation(semantic:unknown,presentation:unknown):unknown{
  if(presentation===null||presentation===undefined)return semantic;
  if(Array.isArray(semantic))return semantic.map((item,i)=>joinPresentation(item,(presentation as unknown[])[i]));
  if(!semantic||typeof semantic!=='object')return presentation;
  const result={...semantic} as Record<string,unknown>;
  for(const [key,item] of Object.entries(presentation as object))result[key]=PRESENTATION_KEYS.has(key)?item:joinPresentation(result[key],item);
  return result;
}
/** Preserve design state while moving editable text into the semantic document. */
export function serializeChapter(book:Book,chapter:Chapter,allElements:Record<string,PageElement>,bookId:string,chapterId:string):BookSnapshotDocument {
  if(!chapter.framework)throw new Error('This chapter needs a curriculum framework before central saving');
  const semantic=toSemanticDocument(chapter.framework,chapterId),nativeContent:NonNullable<SemanticDocument['nativeContent']>={};
  const elements:ChapterLayoutDocument['elements']={},blockPresentation:ChapterLayoutDocument['blockPresentation']={};
  for(const [id,block] of Object.entries(chapter.framework.blocks)){
    const {semanticContent,curriculum,...presentation}=block;blockPresentation[id]=presentation as unknown as Record<string,unknown>;
  }
  blockPresentation.__framework={pageFrame:chapter.pageFrame !== undefined ? chapter.pageFrame : book.pageFrame,config:chapter.framework.config,mode:chapter.framework.mode,compositionRevision:chapter.framework.compositionRevision};
  const pages=book.pages.filter(p=>p.chapterId===chapter.id||chapter.pageIds.includes(p.id)).map(page=>{
    const {id,pageIndex,displayNumber,elementIds,...settings}=page;
    for(const elementId of elementIds){
      const element=allElements[elementId];if(!element)throw new Error(`Page references missing element ${elementId}`);
      const {id:elId,pageId,transform,style,content,smartBlockData,...rest}=element;
      const semanticBlockId=smartBlockData&&chapter.framework?.blocks[smartBlockData.id]?smartBlockData.id:undefined;
      const nativeContentId=elId;
      const canonicalContent=structuredClone(content);if(canonicalContent.smartMediaQr){delete canonicalContent.smartMediaQr.renderArtifact;delete canonicalContent.smartMediaQr.validation;delete canonicalContent.smartMediaQr.checksum;}if(canonicalContent.assetRef){delete canonicalContent.src;delete canonicalContent.imageUrl;delete canonicalContent.url;}
      const split=separatePresentation(canonicalContent);
      nativeContent[elId]={content:split.semantic};
      let smartPresentation:Record<string,unknown>|undefined;
      if(smartBlockData){const {semanticContent,curriculum,...presentation}=smartBlockData;smartPresentation=presentation as unknown as Record<string,unknown>;
        nativeContent[elId]={content:split.semantic,smartSemanticContent:semanticContent,curriculum};}
      else if(nativeContentId)nativeContent[elId]={content:split.semantic};
      elements[elId]={id:elId,pageId,semanticBlockId,nativeContentId,transform:{...transform},style:{...style},settings:{...rest,...(split.presentation!==undefined?{nativePresentation:split.presentation}:{}),...(smartPresentation?{smartPresentation}:{})}};
    }
    return {id,pageIndex,displayNumber,elementIds:[...elementIds],settings};
  });
  if(!pages.length)throw new Error('Compose at least one chapter page before saving its layout');
  return {...semantic,nativeContent,bookLayout:{layoutSchemaVersion:1,bookId,chapterId,pages,elements,blockPresentation}};
}
export function restoreChapter(document:BookSnapshotDocument,chapter:Chapter):{chapter:Chapter;pages:PageDefinition[];elements:Record<string,PageElement>}{
  const layout=document.bookLayout,framework=restoreSemanticFramework(document,chapter.id,chapter.framework);
  const presentation=layout.blockPresentation.__framework as {pageFrame?:Chapter['pageFrame'];config?:typeof framework.config;mode?:typeof framework.mode;compositionRevision?:number}|undefined;
  if(presentation?.config)framework.config={...framework.config,...presentation.config,...document.config};
  if(presentation?.mode)framework.mode=presentation.mode;
  if(presentation?.compositionRevision!==undefined)framework.compositionRevision=presentation.compositionRevision;
  for(const [id,block] of Object.entries(framework.blocks)){const p=layout.blockPresentation[id];if(p)framework.blocks[id]={...block,...p,semanticContent:block.semanticContent,curriculum:block.curriculum} as SmartBlockInstance;}
  const pages=layout.pages.map(page=>({...page.settings,id:page.id,pageIndex:page.pageIndex,displayNumber:page.displayNumber,chapterId:chapter.id,elementIds:[...page.elementIds]} as PageDefinition));
  const elements:Record<string,PageElement>={};
  for(const [id,stored] of Object.entries(layout.elements)){
    const {smartPresentation,nativePresentation,...settings}=stored.settings;
    const native=stored.nativeContentId?document.nativeContent?.[stored.nativeContentId]:undefined;
    const block=stored.semanticBlockId?framework.blocks[stored.semanticBlockId]:undefined;
    let smartBlockData:SmartBlockInstance|undefined;
    if(block)smartBlockData={...block,...smartPresentation as object,semanticContent:native?.smartSemanticContent||block.semanticContent,curriculum:native?.curriculum||block.curriculum} as SmartBlockInstance;
    else if(smartPresentation)smartBlockData={...smartPresentation as object,semanticContent:native?.smartSemanticContent,curriculum:native?.curriculum} as SmartBlockInstance;
    const content=joinPresentation(native?.content||{},nativePresentation) as Record<string,unknown>;
    if(content.assetRef)content.src=assetRenderUrl(content.assetRef as AssetPin);
    elements[id]={...settings,id,pageId:stored.pageId,transform:{...stored.transform},style:{...stored.style},content,...(smartBlockData?{smartBlockData}:{})} as PageElement;
  }
  return {chapter:{...chapter,...(presentation?.pageFrame !== undefined ? {pageFrame:presentation.pageFrame} : {}),framework,pageIds:pages.map(p=>p.id)},pages,elements};
}

/** Metadata contains the index; inactive chapter content is deliberately absent. */
export function restoreBookMetadata(centralId:string,document:BookDocument,localId=centralId):Book{
  const settings=document.settings as unknown as Book&{chapterIndex?:Array<Chapter&{centralChapterId:string}>};
  const index=settings.chapterIndex||[],keepLocal=localId!==centralId;
  const mapping=new Map(index.map(c=>[c.id,keepLocal?c.id:c.centralChapterId]));
  const chapters=document.chapterIds.map((id,i)=>{
    const entry=index.find(c=>c.centralChapterId===id);
    return {...entry,id:keepLocal?(entry?.id||id):id,unitId:entry?.unitId||'central',number:entry?.number||i+1,title:entry?.title||`Chapter ${i+1}`,learningObjectives:entry?.learningObjectives||[],pageIds:[]} as Chapter;
  });
  const units=(settings.units||[]).map(unit=>({...unit,chapterIds:unit.chapterIds.map(id=>mapping.get(id)||id)}));
  return {...settings,id:localId,title:document.title,language:document.language,units,chapters,pages:[],updatedAt:new Date().toISOString()} as Book;
}
