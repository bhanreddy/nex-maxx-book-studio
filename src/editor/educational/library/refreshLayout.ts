import type { Book } from '../../../domain/book/types';
import type { PageElement } from '../../../domain/element/types';
import { buildPublicationScene } from '../publicationScene';
import { repaginateFromPage } from '../../core/paginationEngine';
import { fitReadingContentInsideFrame } from '../../pageFrame/fitReadingContent';
import { recoverMissingPageElements } from '../../publishing/exportRecovery';

/** Refresh old publishing frames without scaling reading type or rewriting content. */
export function refreshPublishingLayout(book:Book,elements:Record<string,PageElement>){
 let next=recoverMissingPageElements(book,elements),current=book,changed=Object.keys(next).some(id=>!elements[id]);
 const affected=new Set<string>();
 for(const page of book.pages)for(const id of page.elementIds){
  const el=next[id],block=el?.smartBlockData;
  if(!block?.presetId.startsWith('edu-')||el.locked||el.hidden||el.groupId||block.styleOverrides.contentLayout?.enabled||block.styleOverrides.resizeFrame)continue;
  const height=buildPublicationScene({...block,transform:{...el.transform,height:0}}).height;
  if(height<=el.transform.height+1)continue;
  const other=page.elementIds.map(otherId=>next[otherId]).filter(item=>item&&item.id!==id&&!item.hidden&&item.category!=='decorative');
  const overlaps=other.some(item=>el.transform.x<item.transform.x+item.transform.width&&el.transform.x+el.transform.width>item.transform.x&&el.transform.y<item.transform.y+item.transform.height&&el.transform.y+height+12>item.transform.y);
  const y=overlaps?Math.max(el.transform.y,...other.map(item=>item.transform.y+item.transform.height+14)):el.transform.y;
  const transform={...el.transform,height,y};next={...next,[id]:{...el,transform,smartBlockData:{...block,transform}}};affected.add(page.id);changed=true;
 }
 for(const pageId of affected){const index=current.pages.findIndex(page=>page.id===pageId);if(index<0)continue;const result=repaginateFromPage(current,next,index);current={...current,pages:result.updatedPages};next=result.updatedElements;}
 const fitted=fitReadingContentInsideFrame(current,next);
 return {book:fitted.book,elements:fitted.changed?fitted.elements:changed?next:elements,changed:changed||fitted.changed};
}
