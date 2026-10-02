import type { Book } from "../../domain/book/types";
import type { PageElement, ElementTransform } from "../../domain/element/types";
import { buildPublicationScene } from "../educational/publicationScene";
import { autoArrangePage } from "./layoutSolver";
export type PageCompositionStyle = "balanced" | "visual" | "reading" | "compact" | "playful";
export function composePage(elements:PageElement[], dimensions:Book["dimensions"], margins:Book["margins"], style:PageCompositionStyle) {
  const movable=elements.filter(el=>!el.locked&&!el.hidden&&el.category!=="decorative"&&!el.content.publicationPrimitive);
  const transforms:Record<string,ElementTransform>={};
  const suggested=autoArrangePage(movable,dimensions,margins,style);
  const placed=elements.filter(el=>!movable.includes(el)&&!el.hidden&&el.category!=="decorative").map(el=>el.transform);
  const sorted=[...movable].sort((a,b)=>(suggested[a.id]?.y??a.transform.y)-(suggested[b.id]?.y??b.transform.y));
  for(const el of sorted){
    const t={...el.transform,...suggested[el.id]};
    if(el.smartBlockData?.styleOverrides.resizeFrame){t.width=el.transform.width;t.height=el.transform.height;}
    else if(el.smartBlockData){t.width=Math.max(180,t.width);t.height=buildPublicationScene({...el.smartBlockData,transform:{...t,height:0}}).height;}
    else if(el.category==="text"&&t.width<el.transform.width)t.height=Math.max(t.height,el.transform.height*el.transform.width/t.width);
    // Resolve collisions after measuring the new reading width, including locked obstacles.
    for(let pass=0;pass<=placed.length;pass++){
      const overlap=placed.find(p=>t.x<p.x+p.width&&t.x+t.width>p.x&&t.y<p.y+p.height+10&&t.y+t.height+10>p.y);
      if(!overlap)break;t.y=overlap.y+overlap.height+14;
    }
    transforms[el.id]=t;placed.push(t);
  }
  const fits=Object.values(transforms).every(t=>t.x>=margins.insidePt-.1&&t.y>=margins.topPt-.1&&t.x+t.width<=dimensions.widthPt-margins.outsidePt+.1&&t.y+t.height<=dimensions.heightPt-margins.bottomPt+.1);
  return {transforms,fits,count:movable.length};
}
