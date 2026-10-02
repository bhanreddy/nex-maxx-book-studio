import { EDUCATIONAL_LIBRARY } from './catalog';
import type { PageElement } from '../../../domain/element/types';
import { useEditorStore } from '../../stores/editorStore';
import { useUiStore } from '../../stores/uiStore';
import { commitDocumentChange } from '../../core/documentTransaction';
import { pageMarginsFor } from '../../pageFrame/pageFrame';
import { createSmartBlockInstance, EDUCATIONAL_BLOCK_REGISTRY } from '../blockRegistry';
import { buildPublicationScene } from '../publicationScene';
import { recordEducationalPreset } from './preferences';

/** Duplicate into a measured safe position in one existing document/history transaction. */
export function duplicateEducationalBlock(element:PageElement,presetId=element.smartBlockData?.presetId,name?:string):PageElement|null {
 const store=useEditorStore.getState(),book=store.getActiveBook();let page=store.getActivePage();
 if(!book||!page||!element.smartBlockData||!presetId||!EDUCATIONAL_BLOCK_REGISTRY[presetId])return null;
 const fresh=createSmartBlockInstance(presetId,page.id)!;
 const source=element.smartBlockData,block={...fresh,subject:source.subject,gradeBand:source.gradeBand,semanticContent:{...(source.presetId.startsWith("edu-")?fresh.semanticContent:{}),...structuredClone(source.semanticContent)},styleOverrides:{...structuredClone(source.styleOverrides),layoutVariant:undefined,resizeFrame:undefined,contentLayout:undefined,compactScale:undefined}};
 const margins=pageMarginsFor(book,page),safeWidth=book.dimensions.widthPt-margins.insidePt-margins.outsidePt;
 if(safeWidth<180){useUiStore.getState().showToast({type:'warning',title:'Page is too narrow',message:'Publishing blocks need at least 180 pt of usable page width. Increase the page width or reduce its margins before duplicating.'});return null;}
 const width=Math.min(safeWidth,Math.max(180,element.transform.width));
 block.transform={...fresh.transform,width,height:0};const height=buildPublicationScene(block).height;
 if(height>book.dimensions.heightPt-margins.topPt-margins.bottomPt){useUiStore.getState().showToast({type:'warning',title:'Duplicate needs more room',message:'Choose a wider page or reduce the content before duplicating.'});return null;}
 const elements=store.getActivePageElements();let y=elements.reduce((bottom,el)=>el.hidden||el.category==='decorative'?bottom:Math.max(bottom,el.transform.y+el.transform.height+18),margins.topPt);
 let pages=[...book.pages],index=store.activePageIndex;
 if(y+height>book.dimensions.heightPt-margins.bottomPt){page={id:crypto.randomUUID(),pageIndex:pages.length,displayNumber:String(pages.length+1),elementIds:[],status:'Draft'};pages.push(page);index=pages.length-1;y=margins.topPt;}
 block.pageId=page.id;block.transform={...block.transform,x:margins.insidePt,y,height,zIndex:Math.max(0,...elements.map(el=>el.transform.zIndex))+1};
 const duplicate:PageElement={...element,id:block.id,pageId:page.id,presetId,version:4,displayName:name||EDUCATIONAL_BLOCK_REGISTRY[presetId].name,content:{...element.content,teacherOnly:EDUCATIONAL_BLOCK_REGISTRY[presetId].educationalType==='teacher-note'},smartBlockData:block,transform:block.transform,groupId:undefined,locked:false,hidden:false};
 pages=pages.map(p=>p.id===page!.id?{...p,elementIds:[...p.elementIds,duplicate.id]}:p);
 commitDocumentChange('Duplicate educational block',{...book,pages},{...store.elements,[duplicate.id]:duplicate},index);
 useEditorStore.setState({selectedElementIds:[duplicate.id]});recordEducationalPreset(presetId);return duplicate;
}

/** Opt-in copy migration; complex authored layer layouts keep their original renderer. */
export function legacyPublishingPreset(element:PageElement):string|undefined {
 const block=element.smartBlockData;
 if(!block||block.presetId.startsWith('edu-')||block.curriculum||block.styleOverrides.referenceElement||block.styleOverrides.contentLayout?.enabled||block.semanticContent.lessonSchemaTopics||block.semanticContent.learningOutcomeTopics||block.semanticContent.studySkillTopics)return;
 const entry=EDUCATIONAL_LIBRARY.find(item=>item.category===block.archetypeId);
 return entry?`edu-${entry.type}-${entry.variants[0]}`:undefined;
}
export function upgradeLegacyEducationalBlock(element:PageElement):PageElement|null {
 const preset=legacyPublishingPreset(element);if(!preset)return null;
 const source=structuredClone(element),c=source.smartBlockData!.semanticContent;
 if(c.illustrationUrl&&!c.images?.length)c.images=[{src:c.illustrationUrl,originalSrc:c.illustrationOriginalUrl,alt:c.title,focalX:c.imageOffsetX,focalY:c.imageOffsetY,scale:c.imageScale,flipX:c.imageFlipX}];
 return duplicateEducationalBlock(source,preset);
}
