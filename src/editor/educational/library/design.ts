import { PUBLISHING_COMPOSITION_TOKENS } from '../../../domain/educational/designTokens';
import type { PublicationPalette } from '../publicationScene';
import { contrastRatio } from '../../design/contrast';

export function blendInk(from:string,to:string,amount:number):string {
 const hex=(value:string)=>value.replace('#','');
 const a=hex(from),b=hex(to);
 if(!/^[\da-f]{6}$/i.test(a)||!/^[\da-f]{6}$/i.test(b))return to;
 return '#'+[0,2,4].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-amount)+parseInt(b.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');
}
export function publishingColours(p:PublicationPalette,reducedInk=false){
 const t=PUBLISHING_COMPOSITION_TOKENS,paper=t.paper;
 const on=(background:string)=>contrastRatio(paper,background)>=4.5?paper:t.ink;
 return {paper,on,ink:p.text,primaryInk:contrastRatio(p.primary,paper)>=4.5?p.primary:blendInk(p.primary,t.ink,.5),
  secondaryInk:contrastRatio(p.secondary,paper)>=4.5?p.secondary:blendInk(p.secondary,t.ink,.4),
  tint:reducedInk?paper:blendInk(paper,p.primary,t.tintStrength),
  secondaryTint:reducedInk?paper:blendInk(paper,p.secondary,t.secondaryTintStrength),
  accentTint:reducedInk?paper:blendInk(paper,p.accent,.16),
  edge:blendInk(paper,p.primary,.22),shadow:blendInk(paper,p.primary,.15),
 };
}
