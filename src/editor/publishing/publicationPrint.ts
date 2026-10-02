import { buildPageFrameScene, pageFrameFor } from "../pageFrame/pageFrame";
import {hydrateSmartQrs} from '../media/smartQr';
import type {Book} from '../../domain/book/types';
import type {PageElement} from '../../domain/element/types';
import type {SceneNode,PublicationScene} from '../educational/publicationScene';
import {publicationSceneForElement,cropImage} from '../educational/publicationPdf';
import {wrapText} from '../educational/publicationScene';
import {toGrayHex} from '../design/contrast';
import {printFont,PRINT_FONTS} from './fontRegistry';
import {prepareTextWrapContours} from '../layoutPartner/textWrapLayout';
import { buildPublisherFooterScene } from '../branding/publisherFooter';
const escape=(value:unknown)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const num=(value:number)=>{if(!Number.isFinite(value))throw new Error('Print layout contains invalid coordinates');return String(value);};
export interface PrintScenePage{number:string;frame?:PublicationScene;footer?:PublicationScene;elements:{element:PageElement;scene:PublicationScene}[]}
export function collectPrintPages(book:Book,elements:Record<string,PageElement>):PrintScenePage[]{
  if(!book.pages.length)throw new Error('Open a chapter before printing');
  return book.pages.map(page=>({number:page.displayNumber,footer:buildPublisherFooterScene(book,page,elements),frame:pageFrameFor(book,page)?buildPageFrameScene(pageFrameFor(book,page)!,page.displayNumber,book.dimensions.widthPt,book.dimensions.heightPt):undefined,elements:page.elementIds.map(id=>{
    const element=elements[id];if(!element)throw new Error(`Page references missing element ${id}`);return element;
  }).filter(element=>element.type!=="group"&&!element.hidden&&!element.content.teacherOnly).sort((a,b)=>a.transform.zIndex-b.transform.zIndex).map(element=>{
    let scene=publicationSceneForElement(element,page.elementIds.map(id=>elements[id]).filter(el=>el&&!el.content.teacherOnly));
    if(scene?.variant==='flow-text'&&scene.warnings.length)throw new Error(scene.warnings.join(' ')+' Enlarge the text frame or move the overlapping object before printing.');
    if(!scene&&['heading','subheading','body','body-text','caption','quote','chapter-title','lesson-title','header','footer','text','pageNumber','page-number'].includes(element.type)){
      const size=element.style.fontSize||11,lines=wrapText(String(element.content.text||''),element.transform.width,size,(element.style.fontWeight||400)>=600);
      const align=element.style.textAlign==='right'?'end':element.style.textAlign==='center'?'middle':'start';
      const x=align==='end'?element.transform.width:align==='middle'?element.transform.width/2:0;
      scene={width:element.transform.width,height:element.transform.height,variant:'native-text',warnings:[],nodes:lines.map((text,index)=>({kind:'text',text,x,align,y:size*1.2+index*size*(element.style.lineHeight||1.4),size,fill:element.style.color||'#111827',fontFamily:element.style.fontFamily,bold:(element.style.fontWeight||400)>=600}))};
    }
    if(!scene&&['shape','divider','borderFrame'].includes(element.type))scene={width:element.transform.width,height:element.transform.height,variant:'native-shape',warnings:[],nodes:[{kind:'rect',x:0,y:0,w:element.transform.width,h:element.transform.height,fill:element.style.backgroundColor||'#FFFFFF',stroke:element.style.borderColor,radius:element.style.borderRadius}]};
    if(!scene)throw new Error(`“${element.displayName}” does not have a verified print renderer. Export is blocked to prevent omitted content.`);
    const resizeFrame=element.smartBlockData?.styleOverrides.resizeFrame;
    const renderedHeight=scene.height*(resizeFrame?element.transform.height/resizeFrame.height:1);
    if(renderedHeight>element.transform.height+1||element.isOverset)throw new Error(`“${element.displayName}” needs more vertical space before printing.`);
    // Export embeds cropped images into its own scene; retain the reusable renderer cache.
    return {element,scene:structuredClone(scene)};
  })}));
}
export function buildPrintHtml(book:Book,pages:PrintScenePage[],fontCss:string,options:{bleed?:boolean;cropMarks?:boolean;grayscale?:boolean}={}){
  const offsetX=options.bleed?book.bleed.leftPt:0,offsetY=options.bleed?book.bleed.topPt:0;
  const width=book.dimensions.widthPt+(options.bleed?book.bleed.leftPt+book.bleed.rightPt:0),height=book.dimensions.heightPt+(options.bleed?book.bleed.topPt+book.bleed.bottomPt:0);
  const paint=(value:string)=>escape(options.grayscale&&value.startsWith('#')?toGrayHex(value):value);
  let counter=0;
  function sceneSvg(scene:PublicationScene){
    const prefix=`s${counter++}-`,node=(n:SceneNode):string=>{
      if(n.kind==='clip')return `<clipPath id="${prefix}${escape(n.id)}"><rect x="${num(n.x)}" y="${num(n.y)}" width="${num(n.w)}" height="${num(n.h)}" rx="${num(n.radius||0)}"/></clipPath>`;
      if(n.kind==='gradient')return `<linearGradient gradientUnits="userSpaceOnUse" id="${prefix}${escape(n.id)}" x1="${num(n.x1)}" y1="${num(n.y1)}" x2="${num(n.x2)}" y2="${num(n.y2)}"><stop stop-color="${paint(n.from)}"/><stop offset="1" stop-color="${paint(n.to)}"/></linearGradient>`;
      const common=` opacity="${num(n.opacity??1)}"${n.clipId?` clip-path="url(#${prefix}${escape(n.clipId)})"`:''}`;
      const stroke='stroke' in n&&n.stroke?` stroke="${paint(n.stroke)}" stroke-width="${num(n.strokeWidth??.65)}"`:'';
      if(n.kind==='text')return `<text data-print-text="1" x="${num(n.x)}" y="${num(n.y)}" font-size="${num(n.size)}" font-family="${escape(printFont(n.text,n.fontFamily,n.font==='serif'))}" font-weight="${n.bold?700:400}" font-style="${n.italic?'italic':'normal'}" text-decoration="${[n.underline?'underline':'',n.strike?'line-through':''].filter(Boolean).join(' ')}"${n.textLength!==undefined?` textLength="${num(n.textLength)}" lengthAdjust="spacingAndGlyphs"`:n.letterSpacing?` letter-spacing="${num(n.letterSpacing)}"`: ''} fill="${paint(n.fill)}" text-anchor="${n.align||'start'}"${common}>${escape(n.text)}</text>`;
      if(n.kind==='rect')return `<rect x="${num(n.x)}" y="${num(n.y)}" width="${num(n.w)}" height="${num(n.h)}" rx="${num(n.radius||0)}" fill="${n.gradientId?`url(#${prefix}${escape(n.gradientId)})`:paint(n.fill)}"${stroke}${common}/>`;
      if(n.kind==='ellipse')return `<ellipse cx="${num(n.x)}" cy="${num(n.y)}" rx="${num(n.rx)}" ry="${num(n.ry)}" fill="${paint(n.fill)}"${stroke}${common}/>`;
      if(n.kind==='line')return `<line x1="${num(n.x)}" y1="${num(n.y)}" x2="${num(n.x2)}" y2="${num(n.y2)}"${stroke}${common}/>`;
      if(n.kind==='polygon')return `<polygon points="${n.points.map(p=>p.map(num).join(',')).join(' ')}" fill="${paint(n.fill)}"${stroke}${common}/>`;
      if(n.kind==='path')return `<path d="${escape(n.d)}" fill="${paint(n.fill)}"${stroke}${common}/>`;
      if(!/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(n.src))throw new Error('Print images must be verified and embedded before export');
      return `<image x="${num(n.x)}" y="${num(n.y)}" width="${num(n.w)}" height="${num(n.h)}" href="${n.src}"${common}/>`;
    };
    return `<defs>${scene.nodes.filter(n=>n.kind==='gradient'||n.kind==='clip').map(node).join('')}</defs>${scene.nodes.filter(n=>n.kind!=='gradient'&&n.kind!=='clip').map(node).join('')}`;
  }
  const body=pages.map(page=>{
    if(page.footer?.warnings.length)throw new Error(page.footer.warnings.join(' '));
    return `<section><svg xmlns="http://www.w3.org/2000/svg" width="${num(width)}pt" height="${num(height)}pt" viewBox="0 0 ${num(width)} ${num(height)}">
    ${page.frame ? `<g data-page-frame-background="1" transform="translate(${num(offsetX)},${num(offsetY)})">${sceneSvg({...page.frame,nodes:page.frame.nodes.filter(node=>'motifId' in node&&node.motifId==='Paper')})}</g>` : ''}
    ${page.elements.map(({element,scene})=>{const t=element.transform,frame=element.smartBlockData?.styleOverrides.resizeFrame;return `<g data-print-frame="${escape(element.id)}" transform="translate(${num(offsetX+t.x)},${num(offsetY+t.y)}) rotate(${num(t.rotation)} ${num(t.width/2)} ${num(t.height/2)})" opacity="${num(element.style.opacity??1)}"><svg width="${num(t.width)}" height="${num(t.height)}" viewBox="0 0 ${num(frame?.width??scene.width)} ${num(frame?.height??scene.height)}"${frame?' preserveAspectRatio="none"':''} overflow="visible">${sceneSvg(scene)}</svg></g>`;}).join('')}
    ${page.frame ? `<g data-page-frame="scholar-wave" transform="translate(${num(offsetX)},${num(offsetY)})">${sceneSvg({...page.frame,nodes:page.frame.nodes.filter(node=>!('motifId' in node)||node.motifId!=='Paper')})}</g>` : ''}
    ${page.footer ? `<g data-publisher-footer="1" transform="translate(${num(offsetX)},${num(offsetY)})">${sceneSvg(page.footer)}</g>` : ''}
    ${options.cropMarks&&options.bleed?`<path d="M ${offsetX} 0 V ${offsetY-2} M 0 ${offsetY} H ${offsetX-2} M ${offsetX+book.dimensions.widthPt} 0 V ${offsetY-2} M ${width} ${offsetY} H ${offsetX+book.dimensions.widthPt+2} M ${offsetX} ${height} V ${offsetY+book.dimensions.heightPt+2} M 0 ${offsetY+book.dimensions.heightPt} H ${offsetX-2} M ${offsetX+book.dimensions.widthPt} ${height} V ${offsetY+book.dimensions.heightPt+2} M ${width} ${offsetY+book.dimensions.heightPt} H ${offsetX+book.dimensions.widthPt+2}" fill="none" stroke="#000" stroke-width=".5"/>`:''}
    </svg></section>`;}).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(book.title)}</title><style>${fontCss}@page{size:${num(width)}pt ${num(height)}pt;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}section{width:${num(width)}pt;height:${num(height)}pt;break-after:page}section>svg{display:block}section:last-child{break-after:auto}</style></head><body>${body}</body></html>`;
}
export async function preparePrintHtml(book:Book,elements:Record<string,PageElement>,options:Parameters<typeof buildPrintHtml>[3]){
  const printableIds=new Set(book.pages.flatMap(page=>page.elementIds));
  elements=await hydrateSmartQrs(Object.fromEntries(Object.entries(elements).filter(([id])=>printableIds.has(id))),book.dimensions.widthPt,book.dimensions.heightPt);
  await prepareTextWrapContours(Object.values(elements));
  const pages=collectPrintPages(book,elements),families=new Set(['Noto Sans']);
  for(const page of pages)for(const scene of [...(page.footer?[page.footer]:[]),...page.elements.map(({scene})=>scene)])for(const node of scene.nodes)if(node.kind==='text')families.add(printFont(node.text,node.fontFamily,node.font==='serif'));
  const manifest=await fetch('/fonts/manifest.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Bundled font manifest is unavailable');return r.json();});
  const css=await Promise.all([...families].map(async family=>{
    const filename=PRINT_FONTS[family],response=await fetch(`/fonts/${filename}`,{cache:'force-cache'});if(!response.ok)throw new Error(`Bundled font ${family} is unavailable`);
    const bytes=await response.arrayBuffer(),checksum=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(manifest.files.find((f:{filename:string})=>f.filename===filename)?.sha256!==checksum)throw new Error(`Bundled font ${family} checksum mismatch`);
    let binary='';for(const byte of new Uint8Array(bytes))binary+=String.fromCharCode(byte);
    return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${btoa(binary)}) format('truetype');font-weight:100 900;font-style:normal;font-display:block}`;
  }));
  // Raster artwork uses the same mask/crop/filter implementation as the existing PDF renderer.
  const footerImage = pages.flatMap(page=>page.footer?.nodes || []).filter((node):node is Extract<SceneNode,{kind:'image'}>=>node.kind==='image').sort((a,b)=>b.w-a.w)[0];
  const embeddedFooter = footerImage?.kind==='image' ? await cropImage(footerImage,!!options?.grayscale) : undefined;
  for(const page of pages){
    for(const node of page.footer?.nodes || [])if(node.kind==='image')node.src=embeddedFooter!;
    for(const {scene} of page.elements)for(const node of scene.nodes)if(node.kind==='image')node.src=await cropImage(node,!!options?.grayscale);
  }
  return buildPrintHtml(book,pages,css.join(''),options);
}
