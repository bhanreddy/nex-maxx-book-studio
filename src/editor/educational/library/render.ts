import type { SmartBlockInstance } from '../../../domain/educational/blockSchema';
import { GRADE_SCALES, PUBLISHING_COMPOSITION_TOKENS as T } from '../../../domain/educational/designTokens';
import type { PublicationPalette, PublicationScene, SceneNode } from '../publicationScene';
import { EDUCATIONAL_LIBRARY_BLOCKS, libraryEntry } from './catalog';
import { illustrationNodes, subjectIllustration, ILLUSTRATION_PRESETS, type IllustrationPreset } from './illustrations';
import { printFont } from '../../publishing/fontRegistry';
import { formulaNodes } from './notation';
import { publishingColours } from './design';

type Helpers = {textWidth:(value:string,size:number,bold?:boolean,serif?:boolean,font?:string)=>number;wrapText:(value:string,width:number,size:number,bold?:boolean,serif?:boolean,font?:string,spacing?:number)=>string[];resolvePublicationPalette:(block:SmartBlockInstance)=>PublicationPalette};
/** One measured vector vocabulary; each purpose has its own editorial composition. */
export function renderEducationalLibrary(block:SmartBlockInstance, helpers:Helpers, options:{teacher?:boolean}={}):PublicationScene|null {
 const definition=EDUCATIONAL_LIBRARY_BLOCKS[block.presetId],entry=libraryEntry(block.presetId);
 if(!definition||!entry)return null;
 const c=block.semanticContent,o=block.styleOverrides,p=helpers.resolvePublicationPalette(block),col=publishingColours(p,o.printMode==='reduced-ink');
 const w=Math.max(180,block.transform.width),pad=Math.min(w/8,Math.max(16,o.paddingPt??24)),inner=w-pad*2;
 const variant=o.layoutVariant||definition.reflowRules.layoutVariant,compact=variant==='compact'||variant==='quick-fact',wide=w>=340,showArt=!compact&&w>=300;
 const profile=GRADE_SCALES[block.gradeBand],scale=Math.max(1,o.fontSizeScale||1),fs=Math.max(11,profile?.bodyPt||12)*scale,lh=profile?.lineHeight||1.45;
 const gap=Math.max(8,o.spacingPt??(compact?10:16)),heading=Math.max(20,(profile?.headingPt||20)*T.headingScale)*scale;
 const nodes:SceneNode[]=[],warnings:string[]=[],used=new Set<string>(),renderedImages=new Set<number>();
 const font=(value:string,serif=false)=>{try{return printFont(value,o.fontFamily,serif);}catch{const warning='This font is not bundled for print. Choose a supported font before export.';if(!warnings.includes(warning))warnings.push(warning);return serif?'Noto Serif':'Noto Sans';}};
 const measure=(value:string,width:number,size=fs,bold=false,serif=false)=>helpers.wrapText(value,Math.max(12,width),size,bold,serif,font(value,serif)).length*size*lh;
 const text=(value:string|undefined,x:number,y:number,width=inner,size=fs,bold=false,color=p.text,path?:string,serif=false):number=>{
  if(value===undefined||value==='')return y;
  const fontFamily=font(value,serif),lines=helpers.wrapText(value,Math.max(12,width),size,bold,serif,fontFamily);
  nodes.push({kind:'text',x,y:y+size,text:value,lines,size,fill:color,bold,font:serif?'serif':'sans',fontFamily,wrapWidth:Math.max(12,width),lineHeight:size*lh,fieldPath:path});
  if(path)used.add(path.split('.')[0]);return y+lines.length*size*lh;
 };
 const rect=(x:number,y:number,width:number,height:number,fill=col.tint,stroke?:string,radius:number=o.cornerRadiusPt??T.radius,extra:Partial<Extract<SceneNode,{kind:'rect'}>>={})=>nodes.push({kind:'rect',x,y,w:width,h:height,fill,stroke,strokeWidth:o.borderWidthPt??T.stroke,radius,...(fill===p.primary?{appearanceTarget:'accent' as const}:{}),...extra});
 const line=(x:number,y:number,x2:number,y2:number,color=col.edge,thickness=.8)=>nodes.push({kind:'line',x,y,x2,y2,stroke:color,strokeWidth:thickness});
 const circle=(x:number,y:number,r:number,fill=p.primary,stroke?:string)=>nodes.push({kind:'ellipse',x,y,rx:r,ry:r,fill,stroke,strokeWidth:.8});
 const polygon=(points:number[][],fill=p.primary,stroke?:string)=>nodes.push({kind:'polygon',points,fill,stroke,strokeWidth:.8,...(fill===p.primary?{appearanceTarget:'accent' as const}:{})});
 const sparkle=(x:number,y:number,r=6,color=p.accent)=>polygon([[x,y-r],[x+2,y-2],[x+r,y],[x+2,y+2],[x,y+r],[x-2,y+2],[x-r,y],[x-2,y-2]],color);
 const arrow=(x:number,y:number,x2:number,color=p.secondary)=>{line(x,y,x2,y,color,1.5);polygon([[x2-5,y-3],[x2,y],[x2-5,y+3]],color);};
 const dots=(x:number,y:number,cols=4,rows=3)=>{for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)circle(x+i*7,y+j*7,.8,col.edge);};
 const answer=(x:number,y:number,width:number,count=2)=>{const space=Math.max(fs*1.8,o.answerSpacePt??26);for(let i=1;i<=count;i++){line(x,y+i*space,x+width,y+i*space,col.edge,.8);circle(x+2,y+i*space-3,1,p.secondary);}return y+count*space+gap;};
 const title=(y:number=pad,x=pad,width=inner)=>text(c.title,x,y,width,heading,true,col.primaryInk,'title')+gap;
 const eyebrow=(value:string,y:number,x=pad,width=inner)=>text(value,x,y,width,T.eyebrowPt,true,col.secondaryInk)+8;
 const ribbon=(y=pad,x=pad,width=inner)=>{
  const rh=measure(c.title||'',Math.max(12,width-40),heading-2,true)+18;
  polygon([[x+T.shadowOffset,y+T.shadowOffset],[x+width+T.shadowOffset,y+T.shadowOffset],[x+width-6,y+rh/2+T.shadowOffset],[x+width+T.shadowOffset,y+rh+T.shadowOffset],[x+T.shadowOffset,y+rh+T.shadowOffset]],col.shadow);
  polygon([[x,y],[x+width,y],[x+width-9,y+rh/2],[x+width,y+rh],[x,y+rh]],p.primary);
  circle(x+14,y+rh/2,5,col.paper);circle(x+14,y+rh/2,2.5,p.accent);
  text(c.title,x+26,y+8,Math.max(12,width-40),heading-2,true,col.on(p.primary),'title');return y+rh+gap;
 };
 /** Framed plate. Empty slots already contain a preset scene; a photograph keeps its own mask. */
 const visual=(x:number,y:number,width:number,height:number,index=0,preset?:IllustrationPreset)=>{
  renderedImages.add(index);const image=c.images?.[index],r=Math.min(T.plateRadius,Math.min(width,height)/3);
  rect(x+T.shadowOffset,y+T.shadowOffset,width,height,col.shadow,undefined,r);
  rect(x,y,width,height,col.paper,col.edge,r);
  const ix=x+6,iy=y+6,iw=Math.max(8,width-12),ih=Math.max(8,height-12),clipId=`well-${index}-${Math.round(x)}-${Math.round(y)}`;
  nodes.push({kind:'clip',id:clipId,x:ix,y:iy,w:iw,h:ih,radius:Math.max(6,r-4)});
  const clipped=<N extends SceneNode>(node:N):N=>node.kind==='gradient'||node.kind==='clip'?node:{...node,clipId};
  if(image?.src) nodes.push(clipped({kind:'image',...image,x:ix,y:iy,w:iw,h:ih,src:image.src,alt:image.alt||entry.title,focalX:image.focalX??.5,focalY:image.focalY??.5,scale:image.scale??1,sourceWidth:image.rawWidthPx,sourceHeight:image.rawHeightPx,imageSlot:index,saturation:o.printMode==='grayscale'?0:image.saturation,mask:image.mask||'rounded',radius:image.radius??Math.max(8,r-4)}));
  else {
   const chosen=ILLUSTRATION_PRESETS.includes(o.illustrationPreset as IllustrationPreset)?o.illustrationPreset as IllustrationPreset:preset||subjectIllustration(block.subject);
   nodes.push(clipped({kind:'rect',x:ix,y:iy,w:iw,h:ih*.64,fill:col.accentTint,radius:0}));
   nodes.push(clipped({kind:'rect',x:ix,y:iy+ih*.5,w:iw,h:ih*.5,fill:col.secondaryTint,radius:0}));
   nodes.push(clipped({kind:'ellipse',x:ix+iw*.8,y:iy+ih*.24,rx:Math.max(4,Math.min(iw,ih)*.13),ry:Math.max(4,Math.min(iw,ih)*.13),fill:p.accent}));
   nodes.push(clipped({kind:'ellipse',x:ix+iw*.5,y:iy+ih*.9,rx:iw*.28,ry:Math.max(3,ih*.06),fill:col.shadow}));
   nodes.push(...illustrationNodes(chosen,ix+iw*.08,iy+ih*.1,iw*.84,ih*.78,p).map(clipped));
   rect(x,y,width,height,'transparent',undefined,r,{imageSlot:index});
  }
  const tick=Math.max(6,Math.min(12,iw/5,ih/5)),ink=p.primary;
  line(ix+2,iy+2,ix+2+tick,iy+2,ink,1.35);line(ix+2,iy+2,ix+2,iy+2+tick,ink,1.35);
  line(ix+iw-2,iy+2,ix+iw-2-tick,iy+2,ink,1.35);line(ix+iw-2,iy+2,ix+iw-2,iy+2+tick,ink,1.35);
  line(ix+2,iy+ih-2,ix+2+tick,iy+ih-2,ink,1.35);line(ix+2,iy+ih-2,ix+2,iy+ih-2-tick,ink,1.35);
  line(ix+iw-2,iy+ih-2,ix+iw-2-tick,iy+ih-2,ink,1.35);line(ix+iw-2,iy+ih-2,ix+iw-2,iy+ih-2-tick,ink,1.35);
  for(const[i,mark]of(c.annotations||[]).entries())if(mark.imageIndex===index){const mx=x+Math.max(0,Math.min(1,mark.x))*width,my=y+Math.max(0,Math.min(1,mark.y))*height;circle(mx,my,9,p.primary);text(mark.label,mx-6,my-6,12,9,true,col.on(p.primary),`annotations.${i}.label`);}
  return image?.caption?text(image.caption,x,y+height+6,width,Math.max(10,fs-1),false,p.text,`images.${index}.caption`)+gap:y+height+gap;
 };
 const list=(values:string[],y:number,mode='number',x=pad,width=inner,path='items')=>{
  for(const[i,value]of values.entries()){
   const tw=Math.max(12,width-48),rowH=measure(value,tw)+20;
   rect(x+T.shadowOffset,y+T.shadowOffset,width,rowH,col.shadow,undefined,10);
   rect(x,y,width,rowH,col.paper,col.edge,10);
   rect(x,y+8,4,Math.max(10,rowH-16),mode==='check'?p.secondary:p.primary,undefined,2);
   if(mode==='check'){rect(x+14,y+rowH/2-8,16,16,col.tint,col.edge,4);line(x+17,y+rowH/2,x+21,y+rowH/2+4,p.primary,1.5);line(x+21,y+rowH/2+4,x+27,y+rowH/2-5,p.primary,1.5);}
   else {circle(x+22,y+rowH/2,9,p.primary);text(String(i+1),x+15,y+rowH/2-9,14,10,true,col.on(p.primary));}
   text(value,x+38,y+8,tw,fs,false,p.text,`${path}.${i}`);
   if(mode==='path'&&i<values.length-1)line(x+22,y+rowH,x+22,y+rowH+gap,p.secondary,1.4);
   y+=rowH+gap;
  }return y;
 };
 const questions=(y:number,x=pad,width=inner,responseLines=compact?1:2)=>{
  used.add('questions');
  for(const[i,q]of(c.questions||[]).entries()){
   const start=y,index=nodes.length;let qy=y+12;
   circle(x+22,qy+8,10,p.primary);text(String(i+1),x+15,qy,14,10,true,col.on(p.primary));
   qy=text(q.prompt,x+40,qy,Math.max(12,width-52),fs,true,p.text,`questions.${i}.prompt`)+8;
   for(const[j,opt]of(q.options||[]).entries()){const h=measure(opt,Math.max(12,width-78))+14;rect(x+40,qy,Math.max(24,width-52),h,col.tint,undefined,8);text(String.fromCharCode(65+j),x+48,qy+6,16,fs,true,col.primaryInk);qy=text(opt,x+68,qy+6,Math.max(12,width-84),fs,false,p.text,`questions.${i}.options.${j}`)+10;}
   if(q.points!==undefined)qy=text(`${q.points} marks`,x+40,qy,Math.max(12,width-52),10,true,col.secondaryInk)+6;
   if(options.teacher&&q.answer)qy=text(q.answer,x+40,qy,Math.max(12,width-52),fs,true,col.secondaryInk,`questions.${i}.answer`)+8;
   else if(!q.options?.length)qy=answer(x+40,qy,Math.max(12,width-52),responseLines);
   nodes.splice(index,0,{kind:'rect',x:x+T.shadowOffset,y:start+T.shadowOffset,w:width,h:qy-start+4,fill:col.shadow,radius:12},{kind:'rect',x,y:start,w:width,h:qy-start+4,fill:col.paper,stroke:col.edge,strokeWidth:T.stroke,radius:12});
   y=qy+gap+6;
  }return y;
 };
 let y=pad;
 switch(entry.composition){
 case 'discovery': {
  const hasVisual=showArt,vw=hasVisual?Math.min(156,inner*.36):0,left=variant==='visual-left',tx=left&&hasVisual?pad+vw+gap:pad,tw=inner-(hasVisual?vw+gap:0);
  y=ribbon(pad,pad,Math.min(inner,280));
  const start=y;
  if(hasVisual){const vx=left?pad:w-pad-vw;visual(vx,start,vw,Math.max(128,vw),0,block.subject==='general'?'bulb':subjectIllustration(block.subject));sparkle(vx+vw-8,start+8,7,p.accent);}
  const fact=variant==='fact-spotlight'?heading+8:heading+1,factH=measure(c.calloutText||'',tw-8,fact,true)+4;
  y=text(c.calloutText,tx,y,tw,fact,true,col.primaryInk,'calloutText',variant==='editorial')+gap;
  y=text(c.introText,tx,y,tw,fs,false,p.text,'introText')+gap;
  if(hasVisual)y=Math.max(y,start+Math.max(128,vw)+gap);
  rect(tx-10,start,3,Math.max(36,factH),p.secondary,undefined,1);break;
 }
 case 'burst': {
  const vw=showArt?Math.min(156,inner*.36):0,tx=variant==='amazing'&&vw?pad+vw+gap:pad,tw=inner-(vw?vw+gap:0);
  y=eyebrow(variant==='surprise'?'A LITTLE SURPRISE':'BIG WORLD · SMALL WONDER',y,pad,inner);
  y=text(c.title,pad,y,inner,heading+6,true,col.primaryInk,'title')+gap;
  const start=y;
  if(vw){const vx=variant==='amazing'?pad:w-pad-vw;const cx=vx+vw/2,cy=start+vw*.46;const points=Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8-Math.PI/2,rad=(i%2?.62:.9)*(vw*.48);return [cx+Math.cos(angle)*rad,cy+Math.sin(angle)*rad];});polygon(points,col.accentTint);visual(vx+vw*.12,start+vw*.08,vw*.76,vw*.76,0,'planet');sparkle(vx+vw-6,start+4,8,p.accent);}
  const factH=measure(c.calloutText||'',Math.max(12,tw-28),heading+2,true)+28;
  rect(tx+T.shadowOffset,y+T.shadowOffset,tw,factH,col.shadow,undefined,16);rect(tx,y,tw,factH,col.accentTint,undefined,16);
  y=text(c.calloutText,tx+14,y+12,Math.max(12,tw-28),heading+2,true,p.text,'calloutText')+gap;
  y=Math.max(y,start+factH+gap);y=text(c.introText,tx,y,tw,fs,false,p.text,'introText')+gap;
  if(vw)y=Math.max(y,start+vw+gap);break;
 }
 case 'outcomes':case 'recall':case 'review': {
  const vw=showArt?84:0;
  if(vw)visual(w-pad-vw,pad,vw,80,0,entry.composition==='recall'?'pencil':entry.composition==='review'?'book':'bulb');
  y=title(pad,pad,inner-(vw?vw+gap:0));y=text(c.subtitle,pad,y,inner-(vw?vw+gap:0),fs,true,p.text,'subtitle')+gap;
  if(vw)y=Math.max(y,pad+82);
  if(variant==='mind-map'||variant==='recall-bubbles'){
   const cols=wide?2:1,cw=(inner-gap*(cols-1))/cols,values=c.items||[];
   for(let i=0;i<values.length;i+=cols){const height=Math.max(...values.slice(i,i+cols).map(value=>measure(value,cw-28)))+36;
    for(let j=i;j<Math.min(i+cols,values.length);j++){const x=pad+(j%cols)*(cw+gap);rect(x+2,y+3,cw,height,col.shadow,undefined,variant==='recall-bubbles'?20:8);rect(x,y,cw,height,col.tint,undefined,variant==='recall-bubbles'?20:8);text(values[j],x+14,y+16,cw-28,fs,false,p.text,`items.${j}`);circle(x+cw-11,y+9,3,p.secondary);}
    y+=height+gap;
   }
  }else if(variant==='mini-quiz'){for(const[i,value]of(c.items||[]).entries()){y=text(value,pad,y,inner,fs,true,p.text,`items.${i}`)+gap;y=answer(pad,y,inner,1);}}
  else y=list(c.items||[],y,entry.composition==='outcomes'?(variant==='progress-path'?'path':variant==='numbered'?'number':'check'):entry.composition==='review'?'path':'check');
  break;
 }
 case 'banner': {
  const dark=variant==='horizontal'||variant==='number-led';
  const numberWidth=variant==='minimal'?0:Math.min(78,inner*.22),vw=variant!=='minimal'&&showArt?Math.min(112,inner*.28):0;
  const x=pad+numberWidth+(numberWidth?12:0),tw=Math.max(12,inner-numberWidth-(numberWidth?12:0)-(vw?vw+12:0));
  const index=nodes.length,ink=dark?col.on(p.primary):col.primaryInk,kicker=dark?col.on(p.primary):col.secondaryInk;
  y=text(c.title,x,pad+14,tw,10,true,kicker,'title')+6;
  y=text(c.subtitle,x,y,tw,heading+6,true,ink,'subtitle')+8;
  y=text(c.introText,x,y,tw,fs,false,dark?col.on(p.primary):p.text,'introText')+12;
  const plateH=vw?96:0,bandH=Math.max(y+8,pad+18+plateH,pad+(numberWidth?86:0));
  nodes.splice(index,0,{kind:'polygon',points:dark?[[0,0],[w,0],[w,bandH-12],[w-20,bandH],[0,bandH]]:[[0,8],[w-16,8],[w,bandH/2],[w-16,bandH-8],[0,bandH-8]],fill:dark?p.primary:col.tint,stroke:dark?undefined:col.edge,strokeWidth:.8,...(dark?{appearanceTarget:'accent' as const}:{})});
  if(numberWidth){rect(pad+6,pad+14,numberWidth,Math.min(68,bandH-28),dark?col.paper:p.primary,undefined,12);text(c.chapterNumber||'01',pad+12,pad+24,Math.max(12,numberWidth-12),Math.min(32,numberWidth*.42),true,dark?col.primaryInk:col.on(p.primary),'chapterNumber');}
  if(vw)visual(w-pad-vw-4,pad+14,vw,Math.min(plateH,Math.max(48,bandH-28)),0,'book');
  y=bandH+gap;if(variant==='editorial'){line(pad,y,w-pad,y,p.primary,3);y+=gap;}break;
 }
 case 'reference': {
  const vw=showArt?Math.min(108,inner*.3):0,tw=inner-(vw?vw+gap:0);
  if(vw)visual(w-pad-vw,pad,vw,108,0,variant==='definition'?'book':'flask');
  y=eyebrow('THE REFERENCE DESK',y,pad,tw);y=title(y,pad,tw);
  const calloutSize=compact?heading:variant==='definition'?heading+4:heading+8,start=y,h=measure(c.calloutText||'',Math.max(12,tw-36),calloutSize,true)+28;
  rect(pad+T.shadowOffset,y+T.shadowOffset,tw,h,col.shadow,undefined,12);rect(pad,y,tw,h,col.paper,col.edge,12);rect(pad+8,y+12,5,Math.max(16,h-24),p.accent,undefined,2);
  y=text(c.calloutText,pad+22,y+12,Math.max(12,tw-36),calloutSize,true,col.primaryInk,'calloutText',variant==='definition')+8;
  y=Math.max(y,start+h+gap);y=text(c.introText,pad,y,tw,fs,false,p.text,'introText')+gap;if(vw)y=Math.max(y,pad+118);break;
 }
 case 'connection':case 'situation': {
  const vw=showArt&&variant!=='full-width'?Math.min(168,inner*.4):0,left=variant==='visual-left'||entry.composition==='situation',tx=vw&&left?pad+vw+gap:pad,tw=inner-(vw?vw+gap:0);
  const art=variant==='travel'?'bus':variant==='home'?'home':variant==='classroom'?'book':'market';
  if(variant==='full-width')y=visual(pad,y,inner,Math.min(180,inner*.5),0,art);
  const start=y;
  y=text(c.title,tx,y,tw,heading,true,col.primaryInk,'title')+10;y=text(c.subtitle,tx,y,tw,10,true,col.secondaryInk,'subtitle')+gap;
  y=text(c.introText,tx,y,tw,fs,false,p.text,'introText')+gap;
  if(vw){const vx=left?pad:w-pad-vw;visual(vx,start,vw,Math.max(140,vw),0,art);y=Math.max(y,start+Math.max(140,vw)+gap);arrow(pad,y,w-pad);y+=gap;}
  y=questions(y);break;
 }
 case 'opening': {
  const markWidth=wide?66:42;
  circle(pad+markWidth/2,pad+markWidth/2,markWidth/2,col.accentTint);text('?',pad+markWidth*.2,pad-3,markWidth*.65,markWidth*.8,true,col.primaryInk,undefined,true);
  y=text(c.title,pad+markWidth+12,pad+8,inner-markWidth-12,heading-2,true,col.primaryInk,'title')+gap;
  y=Math.max(y,pad+markWidth+gap);
  const vw=showArt&&variant!=='digit-led'?Math.min(136,inner*.32):0,start=y,tw=inner-(vw?vw+gap:0);
  if(vw)visual(w-pad-vw,start,vw,132,0,'lens');
  const bubble=measure(c.calloutText||'',Math.max(12,tw-28),heading+4,true)+28;
  rect(pad+T.shadowOffset,y+T.shadowOffset,tw,bubble,col.shadow,undefined,18);rect(pad,y,tw,bubble,col.accentTint,undefined,18);
  y=text(c.calloutText,pad+14,y+12,Math.max(12,tw-28),heading+4,true,p.text,'calloutText',variant==='editorial')+gap;
  y=Math.max(y,start+(vw?142:bubble)+gap);
  if(c.items?.length){let x=pad,rowH=0;const bw=Math.min(72,Math.max(48,(inner-gap*3)/4));
   for(const[i,item]of c.items.entries()){const needed=Math.max(64,measure(item,bw-16,heading+7,true)+20);if(x+bw>w-pad+.1){y+=rowH+gap;x=pad;rowH=0;}rect(x+2,y+3,bw,needed,col.shadow,undefined,10);rect(x,y,bw,needed,i%2?col.secondaryTint:col.accentTint,undefined,10);text(item,x+8,y+9,bw-16,heading+7,true,col.primaryInk,`items.${i}`);x+=bw+gap;rowH=Math.max(rowH,needed);}y+=rowH+gap;
  }
  if(c.questions?.length)y=questions(y);break;
 }
 case 'question': {
  const qw=showArt&&variant!=='pair-discussion'?92:0;
  if(qw)visual(w-pad-qw,pad,qw,92,0,'speech');
  y=ribbon(pad,pad,inner-(qw?qw+gap:0));if(qw)y=Math.max(y,pad+100);if(c.difficulty)y=text(c.difficulty,pad,y,inner,10,true,col.secondaryInk,'difficulty')+gap;
  if(variant==='pair-discussion'&&wide){y=questions(y);const cw=(inner-gap)/2;rect(pad,y,cw,30,col.tint,undefined,6);rect(pad+cw+gap,y,cw,30,col.secondaryTint,undefined,6);text('MY THINKING',pad+10,y+8,cw-20,10,true,col.primaryInk);text('OUR THINKING',pad+cw+gap+10,y+8,cw-20,10,true,col.secondaryInk);y+=36;y=Math.max(answer(pad,y,cw,2),answer(pad+cw+gap,y,cw,2));}
  else y=questions(y);break;
 }
 case 'picture': {
  y=text(c.title,pad,y,inner,heading,true,col.primaryInk,'title')+gap;
  const count=['comparison','two-image'].includes(variant)?2:variant==='image-grid'?4:1,cols=count>1&&w>=280?2:1,cw=(inner-gap*(cols-1))/cols;
  for(let i=0;i<count;i+=cols){let bottom=y;for(let j=i;j<Math.min(i+cols,count);j++){const x=pad+(j%cols)*(cw+gap),height=Math.min(count===1?200:count===4?90:140,cw*.72);bottom=Math.max(bottom,visual(x,y,cw,height,j,j%2?'plant':subjectIllustration(block.subject)));}y=bottom;}
  y=text(c.subtitle,pad,y,inner,10,true,col.secondaryInk,'subtitle')+gap;y=questions(y,pad,inner,1);break;
 }
 case 'story': {
  y=eyebrow('READ · IMAGINE · DISCOVER',y);y=text(c.title,pad,y,inner,10,true,col.secondaryInk,'title')+8;
  y=text(c.subtitle,pad,y,inner,heading+8,true,col.primaryInk,'subtitle',true)+gap;
  if(!compact&&variant!=='short-story')y=visual(pad,y,inner,Math.min(170,inner*.45),0,'book');
  if(c.passage){const passageY=y,first=Array.from(c.passage)[0],rest=Array.from(c.passage).slice(1).join(''),drop=48;const firstLines=helpers.wrapText(rest,inner-drop-12,fs,false,true,font(rest,true));
   const leadingLetters=Array.from(firstLines.slice(0,2).join('')).filter(char=>!(/\s/u.test(char))).length;let split=0,count=0;
   for(const char of rest){if(count>=leadingLetters)break;split+=char.length;if(!(/\s/u.test(char)))count++;}
   const lead=rest.slice(0,split),tail=rest.slice(split).trimStart();
   text(first,pad,y,drop,46,true,col.primaryInk,undefined,true);y=text(lead,pad+drop+12,y,inner-drop-12,fs,false,p.text,undefined,true);y=Math.max(y,passageY+54);if(tail)y=text(tail,pad,y,inner,fs,false,p.text,undefined,true);y+=gap;
   rect(pad,passageY,inner,y-passageY,'transparent',undefined,0,{fieldPath:'passage'});used.add('passage');
  }
  if(c.quote){const h=measure(c.quote,inner-36,fs+2,true,true)+28;rect(pad,y,inner,h,col.accentTint,undefined,8);rect(pad,y,3,h,p.accent,undefined,0);y=text(c.quote,pad+18,y+14,inner-36,fs+2,true,col.primaryInk,'quote',true)+gap*2;}break;
 }
 case 'observation': {
  y=title();if(showArt)y=visual(pad,y,inner,Math.min(150,inner*.42),0,'lens');
  const h=measure(c.calloutText||'',inner-32,heading+4,true)+32;rect(pad,y,inner,h,col.tint,undefined,10);dots(w-pad-27,y+9,3,2);y=text(c.calloutText,pad+16,y+16,inner-32,heading+4,true,col.primaryInk,'calloutText')+gap*2;y=questions(y);break;
 }
 case 'prediction': {
  y=eyebrow('PREDICT · TEST · EXPLAIN',y);y=title(y);
  const vw=showArt?Math.min(140,inner*.32):0,start=y,tw=inner-(vw?vw+gap:0);
  const h=measure(c.calloutText||'',tw-28,heading,true)+28;rect(pad,y,tw,h,col.secondaryTint,undefined,20);circle(pad+25,y+h+9,5,col.secondaryTint);circle(pad+36,y+h+19,3,col.secondaryTint);
  y=text(c.calloutText,pad+14,y+14,tw-28,heading,true,p.text,'calloutText')+gap*2;
  if(vw){visual(w-pad-vw,start,vw,Math.max(120,vw),0,'balance');y=Math.max(y,start+Math.max(120,vw)+gap);}
  y=text(c.prediction,pad,y,inner,fs,true,col.primaryInk,'prediction')+gap;y=answer(pad,y,inner);
  if(c.reveal){y=eyebrow('TEST YOUR PREDICTION',y);const h=measure(c.reveal,inner-28)+28;rect(pad,y,inner,h,col.tint,undefined,8);y=text(c.reveal,pad+14,y+14,inner-28,fs,false,p.text,'reveal')+gap*2;}y=questions(y);break;
 }
 case 'vocabulary': {
  used.add('vocabulary');const wordArt=showArt&&variant!=='picture-vocabulary'?96:0;if(wordArt)visual(w-pad-wordArt,y,wordArt,84,0,'book');y=title(y,pad,inner-(wordArt?wordArt+gap:0));if(wordArt)y=Math.max(y,pad+96);
  const cols=variant==='strip'&&w>=450?3:variant==='word-wall'&&wide?2:1,cw=(inner-gap*(cols-1))/cols;
  for(let i=0;i<(c.vocabulary||[]).length;i+=cols){const start=y;let bottom=y;
   for(let j=i;j<Math.min(i+cols,c.vocabulary!.length);j++){const item=c.vocabulary![j],x=pad+(j%cols)*(cw+gap),inset=12,tw=cw-24;const plateIndex=nodes.length;let vy=y+inset;
    if(variant==='picture-vocabulary')vy=visual(x+inset,vy,tw,90,j,'book');
    vy=text(item.word,x+inset,vy,tw,heading+3,true,col.primaryInk,`vocabulary.${j}.word`,true)+6;vy=text(item.pronunciation,x+inset,vy,tw,fs,false,col.secondaryInk,`vocabulary.${j}.pronunciation`)+gap;
    vy=text(item.meaning,x+inset,vy,tw,fs,false,p.text,`vocabulary.${j}.meaning`)+10;vy=text(item.example,x+inset,vy,tw,fs,false,p.text,`vocabulary.${j}.example`)+inset;
    nodes.splice(plateIndex,0,{kind:'rect',x,y:start,w:cw,h:vy-start,fill:j%2?col.secondaryTint:col.tint,radius:8});line(x+inset,start,x+cw-inset,start,p.primary,2);bottom=Math.max(bottom,vy);
   }y=bottom+gap;
  }break;
 }
 case 'formula': {
  y=eyebrow('THE MATHEMATICS LAB',y);y=text(c.title,pad,y,inner,10,true,col.secondaryInk,'title')+8;y=text(c.subtitle,pad,y,inner,heading+3,true,col.primaryInk,'subtitle')+gap;
  const vw=variant==='diagram-right'&&wide?inner*.31:0,tw=inner-(vw?vw+gap:0),start=y,plateIndex=nodes.length;
  if(c.formula?.expression){const f=formulaNodes(c.formula.expression,pad+12,y+16,tw-24,heading+12,col.primaryInk,(value,size)=>helpers.textWidth(value,size,true,true,font(value,true)));nodes.push(...f.nodes.map(n=>n.kind==='text'?{...n,fontFamily:font(n.text,true)}:n));y+=f.height+32;if(f.warning)warnings.push(f.warning);}used.add('formula');
  nodes.splice(plateIndex,0,{kind:'rect',x:pad,y:start,w:tw,h:Math.max(72,y-start),fill:col.tint,radius:10});
  if(vw&&c.formula?.diagram!=='none'){const dx=w-pad-vw,dh=88;rect(dx,start,vw,dh,col.secondaryTint,undefined,10);
   if(c.formula?.diagram==='triangle'){polygon([[dx+10,start+62],[dx+vw-10,start+62],[dx+vw/2,start+14]],col.paper,p.primary);line(dx+vw/2,start+14,dx+vw/2,start+62,p.secondary);text('b',dx+12,start+65,vw-24,fs,true,col.primaryInk);text('h',dx+vw/2+4,start+30,14,fs,true,col.primaryInk);}
   else{rect(dx+12,start+22,vw-32,45,col.paper,p.primary,1);text('l',dx+16,start+2,vw-32,fs,true,col.primaryInk);text('b',dx+vw-17,start+35,13,fs,true,col.primaryInk);}y=Math.max(y,start+dh);
  }
  y+=gap;y=list(c.formula?.variables||[],y,'number',pad,inner,'formula.variables');y=text(c.formula?.units,pad,y,inner,fs,false,col.secondaryInk,'formula.units')+gap;break;
 }
 case 'solution': {
  const num=wide?72:0,start=y;
  if(num){rect(w-pad-num,pad,num,70,p.primary,undefined,10);text(c.chapterNumber||'01',w-pad-num+12,pad+10,num-24,34,true,col.on(p.primary),'chapterNumber');}
  y=text(c.title,pad,y,inner-(num?num+gap:0),heading,true,col.primaryInk,'title')+gap;y=Math.max(y,num?start+78:y);
  if(!num)y=text(c.chapterNumber,pad,y,inner,heading,true,col.secondaryInk,'chapterNumber')+(c.chapterNumber?gap:0);
  const problemStart=y,problemIndex=nodes.length;y=eyebrow('THE PROBLEM',y+12,pad+14,inner-28);y=text(c.subtitle,pad+14,y,inner-28,fs+2,true,p.text,'subtitle')+14;
  nodes.splice(problemIndex,0,{kind:'rect',x:pad,y:problemStart,w:inner,h:y-problemStart,fill:col.secondaryTint,radius:8});y+=gap;
  y=text(c.introText,pad,y,inner,fs,false,p.text,'introText')+gap;
  if(variant==='visual-maths')y=visual(pad,y,inner,120,0,'geometry');
  const stepX=variant==='method-left'&&wide?pad+inner*.2:pad,stepWidth=w-pad-stepX;
  if(stepX>pad)eyebrow('METHOD',y,pad,stepX-pad-8);
  for(const[i,step]of(c.steps||[]).entries()){const sy=y;
   if(i<(c.steps?.length||0)-1)line(stepX+12,y+23,stepX+12,y+measure(step.title,stepWidth-38,fs,true)+measure(step.body,stepWidth-38)+gap+8,p.secondary,1.5);
   circle(stepX+12,y+12,12,p.primary);text(String(step.stepNumber),stepX+6,y+4,16,11,true,col.on(p.primary));y=text(step.title,stepX+38,y,stepWidth-38,fs+1,true,col.primaryInk,`steps.${i}.title`)+6;
   if(step.tag)y=text(step.tag,stepX+38,y,stepWidth-38,10,true,col.secondaryInk,`steps.${i}.tag`)+6;
   y=text(step.body,stepX+38,y,stepWidth-38,fs,false,p.text,`steps.${i}.body`)+(variant==='shortcut'?10:gap);y=Math.max(y,sy+32);
  }used.add('steps');
  if(c.finalAnswer){const start=y,index=nodes.length;y=eyebrow('THE ANSWER',y+12,pad+14,inner-28);y=text(c.finalAnswer,pad+14,y,inner-28,fs+3,true,col.primaryInk,'finalAnswer')+14;nodes.splice(index,0,{kind:'rect',x:pad,y:start,w:inner,h:y-start,fill:col.tint,radius:8});rect(pad,start,3,y-start,p.primary,undefined,0);y+=gap;}
  break;
 }
 case 'activity': {
  const vw=showArt?88:0;if(vw)visual(w-pad-vw,y,vw,84,0,entry.type==='experiment'?'flask':entry.type==='project'?'pencil':'balance');y=title(y,pad,inner-(vw?vw+gap:0));y=text(c.subtitle,pad,y,inner-(vw?vw+gap:0),fs,true,p.text,'subtitle')+gap;if(vw)y=Math.max(y,pad+90);
  if(c.materials?.length){y=eyebrow('GATHER YOUR MATERIALS',y);y=list(c.materials,y,'check',pad,inner,'materials');}
  for(const[i,step]of(c.steps||[]).entries()){const sy=y;rect(pad,y,30,30,col.accentTint,undefined,8);text(String(step.stepNumber),pad+7,y+4,20,17,true,col.primaryInk);y=text(step.title,pad+42,y,inner-42,fs+1,true,col.primaryInk,`steps.${i}.title`)+6;y=text(step.body,pad+42,y,inner-42,fs,false,p.text,`steps.${i}.body`)+gap;y=Math.max(y,sy+38);}used.add('steps');break;
 }
 case 'comparison': {
  y=title();const cp=c.comparison;
  if(cp){if(wide&&!compact){const cw=(inner-gap)/2,start=y,leftIndex=nodes.length;let left=text(cp.leftLabel,pad+12,y+12,cw-24,fs+2,true,col.primaryInk,'comparison.leftLabel')+gap;left=list(cp.left,left,'number',pad+12,cw-24,'comparison.left');nodes.splice(leftIndex,0,{kind:'rect',x:pad,y:start,w:cw,h:left-start,fill:col.tint,radius:10});
    const rx=pad+cw+gap,rightIndex=nodes.length;let right=text(cp.rightLabel,rx+12,y+12,cw-24,fs+2,true,col.secondaryInk,'comparison.rightLabel')+gap;right=list(cp.right,right,'number',rx+12,cw-24,'comparison.right');nodes.splice(rightIndex,0,{kind:'rect',x:rx,y:start,w:cw,h:right-start,fill:col.secondaryTint,radius:10});y=Math.max(left,right)+gap;
   }else{y=text(cp.leftLabel,pad,y,inner,fs+2,true,col.primaryInk,'comparison.leftLabel')+gap;y=list(cp.left,y,'number',pad,inner,'comparison.left');arrow(pad,y,w-pad);y+=gap;y=text(cp.rightLabel,pad,y,inner,fs+2,true,col.secondaryInk,'comparison.rightLabel')+gap;y=list(cp.right,y,'number',pad,inner,'comparison.right');}used.add('comparison');}break;
 }
 case 'sequence': {
  y=title();const values=c.items||[],cols=w>=440&&!compact?3:1,cw=(inner-gap*(cols-1))/cols;
  if(cols===1)y=list(values,y,'path');else for(let i=0;i<values.length;i+=cols){let bottom=y;for(let j=i;j<Math.min(i+cols,values.length);j++){const x=pad+(j%cols)*(cw+gap);circle(x+18,y+18,18,p.primary);text(String(j+1).padStart(2,'0'),x+7,y+7,25,15,true,col.on(p.primary));if(j%cols<cols-1)arrow(x+43,y+18,x+cw-2);const end=text(values[j],x,y+52,cw,fs,false,p.text,`items.${j}`);bottom=Math.max(bottom,end+gap);}y=bottom+gap;}break;
 }
 case 'grid': {
  y=ribbon();const rows=options.teacher&&c.grid?.solution?c.grid.solution:c.grid?.rows||[];const count=Math.max(1,...rows.map(row=>Array.from(row).length)),cell=Math.min(38,inner/count),gridWidth=count*cell,start=y;
  rect(pad-4,y-4,gridWidth+8,rows.length*cell+8,col.tint,undefined,8);
  for(const[i,row]of rows.entries())for(const[j,char]of Array.from(row).entries()){const x=pad+j*cell,gy=y+i*cell;rect(x+1,gy+1,cell-2,cell-2,char==='#'?p.primary:(i+j)%2?col.paper:col.secondaryTint,undefined,3);if(char!=='#'&&char!=='_')text(char,x+cell*.22,gy+cell*.15,cell*.7,cell*.52,true,col.primaryInk);}
  y+=rows.length*cell+gap;rect(pad,start,gridWidth,rows.length*cell,'transparent',undefined,0,{fieldPath:'grid.rows'});used.add('grid');y=list(c.grid?.clues||[],y,'number',pad,inner,'grid.clues');break;
 }
 case 'notice': {
  const marker=entry.type==='warning'?'!':entry.type==='tip'?'i':entry.type==='remember'?'✓':'!';
  const titleIndex=nodes.length;circle(pad+20,pad+22,20,col.accentTint);text(marker,pad+12,pad+5,25,26,true,col.primaryInk);
  y=text(c.title,pad+54,pad,inner-54,heading,true,col.primaryInk,'title')+gap;y=Math.max(y,pad+50);y=text(c.introText,pad+54,y,inner-54,fs,false,p.text,'introText')+gap;
  nodes.splice(titleIndex,0,{kind:'rect',x:pad+46,y:pad-8,w:inner-38,h:y-pad+12,fill:col.tint,radius:8});break;
 }
 }
 // Compatible variant and purpose changes retain every authored semantic field.
 for(const key of ['subtitle','introText','calloutText','passage','quote','prediction','reveal','finalAnswer']as const)if(!used.has(key)&&c[key])y=text(c[key],pad,y,inner,fs,key==='finalAnswer',p.text,key,key==='passage')+gap;
 if(c.items&&!used.has('items'))y=list(c.items,y,'number');
 if(c.questions&&!used.has('questions'))y=questions(y);
 if(c.steps&&!used.has('steps'))for(const[i,step]of c.steps.entries()){y=text(step.title,pad,y,inner,fs,true,col.primaryInk,`steps.${i}.title`)+5;y=text(step.tag,pad,y,inner,10,true,col.secondaryInk,`steps.${i}.tag`)+5;y=text(step.body,pad,y,inner,fs,false,p.text,`steps.${i}.body`)+gap;}
 if(c.materials&&!used.has('materials'))y=list(c.materials,y,'check',pad,inner,'materials');
 if(c.vocabulary&&!used.has('vocabulary'))for(const[i,word]of c.vocabulary.entries()){y=text(word.word,pad,y,inner,heading,true,col.primaryInk,`vocabulary.${i}.word`,true)+5;y=text(word.pronunciation,pad,y,inner,fs,false,col.secondaryInk,`vocabulary.${i}.pronunciation`)+5;y=text(word.meaning,pad,y,inner,fs,false,p.text,`vocabulary.${i}.meaning`)+5;y=text(word.example,pad,y,inner,fs,false,p.text,`vocabulary.${i}.example`)+gap;}
 if(c.formula&&!used.has('formula')){y=text(c.formula.expression,pad,y,inner,heading+4,true,col.primaryInk,'formula.expression')+gap;y=list(c.formula.variables||[],y,'number',pad,inner,'formula.variables');y=text(c.formula.units,pad,y,inner,fs,false,col.secondaryInk,'formula.units')+gap;}
 if(c.comparison&&!used.has('comparison')){y=text(c.comparison.leftLabel,pad,y,inner,fs,true,col.primaryInk,'comparison.leftLabel')+gap;y=list(c.comparison.left,y,'number',pad,inner,'comparison.left');y=text(c.comparison.rightLabel,pad,y,inner,fs,true,col.secondaryInk,'comparison.rightLabel')+gap;y=list(c.comparison.right,y,'number',pad,inner,'comparison.right');}
 if(c.badgeLabel)y=text(c.badgeLabel,pad,y,inner,fs,true,col.secondaryInk,'badgeLabel')+gap;
 if(c.unitBadge)y=text(c.unitBadge,pad,y,inner,fs,false,col.secondaryInk,'unitBadge')+gap;
 if(c.qrUrl)y=text(c.qrUrl,pad,y,inner,fs,false,col.secondaryInk,'qrUrl')+gap;
 if(c.numberValue!==undefined)y=text(String(c.numberValue),pad,y,inner,heading,true,col.primaryInk,'numberValue')+gap;
 for(const[i,image]of(c.images||[]).entries())if(image?.src&&!renderedImages.has(i))y=visual(pad,y,inner,Math.min(180,inner*.5),i);
 if(c.hint){const start=y,index=nodes.length;y=text(`Hint: ${c.hint}`,pad+12,y+10,inner-24,fs,false,col.secondaryInk,'hint')+12;nodes.splice(index,0,{kind:'rect',x:pad,y:start,w:inner,h:y-start,fill:col.secondaryTint,radius:6});y+=gap;}
 if(c.footnote){line(pad,y,w-pad,y,col.edge);y=text(c.footnote,pad,y+10,inner,Math.max(10,fs-1),false,p.text,'footnote')+gap;}
 const height=Math.max(88,y+pad);
 if(w<240)warnings.push('Narrow composition: consider a full-width variant for longer content.');
 if(y>620)warnings.push('Long content: use a wider variant or continue on another page. Reading type has been preserved.');
 return {width:w,height,nodes,variant:`${entry.type}/${variant}`,warnings};
}
