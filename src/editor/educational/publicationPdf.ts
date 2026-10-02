import {smartQrScene} from "../media/smartQr";
import { mathSceneForElement } from "../math/mathScene";
import { detachedSceneForElement } from "./detachScene";
import { imageFilter, imageMaskPath } from "./imageTreatment";
import { imagePlacement } from "./publicationScene";
import { isImportedBorderArtwork } from '../pageFrame/types';
import type jsPDF from "jspdf";
import type { PageElement } from "../../domain/element/types";
import type { PublicationScene, SceneNode } from "./publicationScene";
import { artworkNodes, buildPublicationScene, expandSceneText, textWidth } from "./publicationScene";
import { PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { toGrayHex } from "../design/contrast";
import { textFlowScene } from "../layoutPartner/textWrapLayout";
import { shapeToPublicationSceneNodes } from "../vector/shapeEffects";

const sceneCache = new Map<PageElement, PublicationScene | null>();
export function publicationSceneForElement(el:PageElement,pageElements?:PageElement[]):PublicationScene|null {
  if (pageElements) return uncachedPublicationScene(el, pageElements); // Wrap depends on surrounding objects.
  if (sceneCache.has(el)) { const scene = sceneCache.get(el)!; sceneCache.delete(el); sceneCache.set(el, scene); return scene; }
  const scene = uncachedPublicationScene(el);
  sceneCache.set(el, scene);
  if (sceneCache.size > 96) sceneCache.delete(sceneCache.keys().next().value!);
  return scene;
}
function uncachedPublicationScene(el:PageElement,pageElements?:PageElement[]):PublicationScene|null {
  if(pageElements){const flow=textFlowScene(el,pageElements);if(flow)return flow;}
  if(el.type==="smart-media-qr")return smartQrScene(el);
  if(el.type==="math-component")return mathSceneForElement(el);
  const detached=detachedSceneForElement(el);if(detached)return detached;
  if(el.smartBlockData)return buildPublicationScene({...el.smartBlockData,transform:el.transform});
  if(el.content.artwork) {const p=PUBLICATION_PALETTES[el.content.artwork.paletteId as keyof typeof PUBLICATION_PALETTES]||PUBLICATION_PALETTES.indigo;return {width:el.transform.width,height:el.transform.height,nodes:artworkNodes(el.content.artwork.kind,0,0,el.transform.width,el.transform.height,p),variant:el.content.artwork.kind,warnings:[]};}
  const isImage = el.type === "image" || el.type === "picture-frame" || el.type === "pictureFrame" || el.type === "ai-image";
  const imgSrc = el.content.src || el.content.imageUrl || el.content.url;
  if (isImage && imgSrc) {
    return {
      width: el.transform.width,
      height: el.transform.height,
      variant: "image",
      warnings: [],
      nodes: [{
        kind: "image",
        x: 0,
        y: 0,
        w: el.transform.width,
        h: el.transform.height,
        src: imgSrc,
        alt: el.content.alt || el.content.imageAlt || el.content.caption || "",
        focalX: el.content.focalX ?? 0.5,
        focalY: el.content.focalY ?? 0.5,
        scale: el.content.cropScale || el.content.scale || 1,
        sourceWidth: el.content.rawWidthPx,
        sourceHeight: el.content.rawHeightPx,
        fit: el.style.objectFit === "contain" ? "contain" : "cover",
        flipX: el.content.flipX,
        flipY: el.content.flipY,
        radius: el.style.borderRadius,
        brightness: el.content.brightness,
        contrast: el.content.contrast,
        saturation: el.content.saturation,
        mask: el.content.mask,
        customMaskPath: el.content.customMaskPath,
      }],
    };
  }
  if (el.type === "shape" || el.type === "compound-shape" || el.style.shapeType) {
    const nodes = shapeToPublicationSceneNodes(
      (el.style.shapeType as string) || "rectangle",
      el.transform.width,
      el.transform.height,
      el.style,
      el.style.shapeText
    );
    return {
      width: el.transform.width,
      height: el.transform.height,
      nodes,
      variant: "vector-shape",
      warnings: [],
    };
  }
  if (el.type === "vector-curve" && el.style.pathData) {
    return {
      width: el.transform.width,
      height: el.transform.height,
      nodes: [
        {
          kind: "path",
          d: el.style.pathData,
          fill: el.style.backgroundColor || "none",
          stroke: el.style.strokeColor || "#e11d48",
          strokeWidth: el.style.strokeWidth ?? 2,
        },
      ],
      variant: "vector-curve",
      warnings: [],
    };
  }
  return null;
}
export async function cropImage(node:Extract<SceneNode,{kind:"image"}>,gray:boolean):Promise<string> {
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.crossOrigin="anonymous";img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Unable to load image: ${node.alt||"unnamed image"}`));img.src=node.src;});
  const placement=isImportedBorderArtwork(node) ? { x: node.x, y: node.y, w: node.w, h: node.h } : imagePlacement({...node,sourceWidth:image.naturalWidth,sourceHeight:image.naturalHeight});
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.min(2400,Math.round(node.w/72*300)));canvas.height=Math.max(1,Math.round(canvas.width*node.h/node.w));
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Image export canvas is unavailable.");
  const scale=canvas.width/node.w;
  ctx.scale(scale,scale);
  const maskPath = imageMaskPath(node, node.w, node.h);
  if (maskPath) ctx.clip(new Path2D(maskPath));
  const radius=node.radius || (node.mask === "rounded" ? 16 : 0);
  if(radius){ctx.beginPath();ctx.roundRect(0,0,node.w,node.h,Math.min(radius,node.w/2,node.h/2));ctx.clip();}
  ctx.translate(node.w/2,node.h/2);ctx.rotate((node.rotation||0)*Math.PI/180);ctx.scale(node.flipX?-1:1,node.flipY?-1:1);ctx.translate(-node.w/2,-node.h/2);
  ctx.filter=imageFilter(node,gray);
  ctx.drawImage(image,placement.x-node.x,placement.y-node.y,placement.w,placement.h);
  try{return canvas.toDataURL("image/png");}catch{throw new Error(`Image '${node.alt}' does not allow export. Upload a local copy.`);}
}
/** Screen and PDF consume the same measured, positioned vector nodes. */
function mixHex(from: string, to: string, t: number): string {
  const parse = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) || 0);
  const a = parse(from.startsWith("#") ? from : "#000000"), b = parse(to.startsWith("#") ? to : "#000000");
  return "#" + a.map((v, j) => Math.round(v + (b[j] - v) * t).toString(16).padStart(2, "0")).join("");
}
function svgPathToPdf(d: string): { op: string; c: number[] }[] {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const out: { op: string; c: number[] }[] = [];
  let i = 0, cx = 0, cy = 0;
  while (i < tokens.length) {
    const op = tokens[i];
    if (!/[A-Z]/i.test(op)) { i++; continue; }
    const cmd = op.toUpperCase();
    i++;
    const num = () => parseFloat(tokens[i++]);
    if (cmd === "M") { cx = num(); cy = num(); out.push({ op: "m", c: [cx, cy] }); }
    else if (cmd === "L") { cx = num(); cy = num(); out.push({ op: "l", c: [cx, cy] }); }
    else if (cmd === "Q") {
      const x1 = num(), y1 = num(), x = num(), y = num();
      out.push({ op: "c", c: [cx + (2 / 3) * (x1 - cx), cy + (2 / 3) * (y1 - cy), x + (2 / 3) * (x1 - x), y + (2 / 3) * (y1 - y), x, y] });
      cx = x; cy = y;
    } else if (cmd === "C") {
      const c = [num(), num(), num(), num(), num(), num()];
      out.push({ op: "c", c }); cx = c[4]; cy = c[5];
    } else if (cmd === "Z") out.push({ op: "h", c: [] });
  }
  return out;
}
export async function renderPublicationPdf(doc:jsPDF,scene:PublicationScene,el:PageElement,originX=0,originY=0,grayscale=false,fontMap?:{sans:string;serif:string}):Promise<void> {
  const images=new Map<number,string>();
  await Promise.all(scene.nodes.map(async(n,i)=>{if(n.kind==="image")images.set(i,await cropImage(n,grayscale));}));
  const color=(value:string):[number,number,number]=>{const v=grayscale?toGrayHex(value):value;return [parseInt(v.slice(1,3),16)||0,parseInt(v.slice(3,5),16)||0,parseInt(v.slice(5,7),16)||0];};
  doc.advancedAPI(()=>{
    doc.saveGraphicsState();
    const angle=el.transform.rotation*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),cx=el.transform.width/2,cy=el.transform.height/2;
    doc.setCurrentTransformationMatrix(doc.Matrix(co,si,-si,co,originX+el.transform.x+cx-co*cx+si*cy,originY+el.transform.y+cy-si*cx-co*cy));
    const resizeFrame = el.smartBlockData?.styleOverrides.resizeFrame;
    if (resizeFrame) doc.setCurrentTransformationMatrix(doc.Matrix(el.transform.width/resizeFrame.width,0,0,el.transform.height/resizeFrame.height,0,0));
    else if(el.content?.publicationPrimitive)doc.setCurrentTransformationMatrix(doc.Matrix(el.transform.width/scene.width,0,0,el.transform.height/scene.height,0,0));
    doc.rect(0,0,scene.width,scene.height);doc.clip();doc.discardPath();
    scene.nodes.forEach((n,i)=>{
      doc.saveGraphicsState();
      const opacity=(el.style.opacity??1)*("opacity"in n?(n.opacity??1):1);doc.setGState(doc.GState({opacity,"stroke-opacity":opacity}));
      if(n.kind==="gradient"||n.kind==="clip"){doc.restoreGraphicsState();return;}
      if(n.clipId){const clip=scene.nodes.find(node=>node.kind==="clip"&&node.id===n.clipId);if(clip&&clip.kind==="clip"){const radius=Math.min(clip.radius||0,clip.w/2,clip.h/2);if(radius)doc.roundedRect(clip.x,clip.y,clip.w,clip.h,radius,radius,null);else doc.rect(clip.x,clip.y,clip.w,clip.h);doc.clip();doc.discardPath();}}
      const paintable=(value?:string)=>!!value&&value!=="none"&&value.startsWith("#");
      if("fill"in n&&paintable(n.fill))doc.setFillColor(...color(n.fill));
      if("stroke"in n&&n.stroke&&paintable(n.stroke))doc.setDrawColor(...color(n.stroke));
      if("strokeWidth"in n)doc.setLineWidth(n.strokeWidth??.65);
      if(n.kind==="rect"&&n.gradientId){
        const g=scene.nodes.find(node=>node.kind==="gradient"&&node.id===n.gradientId);
        if(g&&g.kind==="gradient"){const bands=28,vertical=Math.abs(g.y2-g.y1)>Math.abs(g.x2-g.x1);for(let b=0;b<bands;b++){doc.setFillColor(...color(mixHex(g.from,g.to,b/Math.max(1,bands-1))));if(vertical)doc.rect(n.x,n.y+n.h*b/bands,n.w,n.h/bands+.2,"F");else doc.rect(n.x+n.w*b/bands,n.y,n.w/bands+.2,n.h,"F");}}
        else {const style=n.stroke?"FD":"F",r=Math.min(n.radius||0,n.w/2,n.h/2);if(r)doc.roundedRect(n.x,n.y,n.w,n.h,r,r,style);else doc.rect(n.x,n.y,n.w,n.h,style);}
      }
      else if(n.kind==="rect") {if(!paintable(n.fill)&&!paintable(n.stroke)){doc.restoreGraphicsState();return;} const style=paintable(n.fill)?(n.stroke?"FD":"F"):"S",r=Math.min(n.radius||0,n.w/2,n.h/2);if(r)doc.roundedRect(n.x,n.y,n.w,n.h,r,r,style);else doc.rect(n.x,n.y,n.w,n.h,style);}
      else if(n.kind==="ellipse")doc.ellipse(n.x,n.y,n.rx,n.ry,n.stroke?"FD":"F");
      else if(n.kind==="line")doc.line(n.x,n.y,n.x2,n.y2);
      else if(n.kind==="polygon") {doc.path(n.points.map((point,index)=>({op:index?"l":"m",c:point})).concat([{op:"h",c:[]}]));if(paintable(n.fill)&&paintable(n.stroke))doc.fillStroke();else if(paintable(n.stroke))doc.stroke();else doc.fill();}
      else if(n.kind==="path"){const commands=svgPathToPdf(n.d);if(commands.length){doc.path(commands);const filled=paintable(n.fill),stroked=paintable(n.stroke);if(filled&&stroked)doc.fillStroke();else if(filled)doc.fill();else doc.stroke();}}
      else if(n.kind==="text") {
        doc.setTextColor(...color(n.fill));doc.setFont(fontMap?(n.font==="serif"?fontMap.serif:fontMap.sans):(n.font==="serif"?"times":"helvetica"),n.bold?(n.italic?"bolditalic":"bold"):(n.italic?"italic":"normal"));doc.setFontSize(n.size);
        for (const line of expandSceneText(n)) {
          if (line.kind !== "text") continue;
          const width=line.textLength??textWidth(line.text,line.size,!!line.bold,line.font==="serif"),shift=line.align==="middle"?width/2:line.align==="end"?width:0;
          const text=line.text.replaceAll("−","-"),charSpace=line.textLength!==undefined&&text.length>1?(line.textLength-doc.getTextWidth(text))/(text.length-1):(line.letterSpacing||0);
          doc.text(text,line.x-shift,line.y,{charSpace});
          if(line.underline||line.strike){doc.setDrawColor(...color(line.fill));doc.setLineWidth(line.size*.045);if(line.underline)doc.line(line.x-shift,line.y+line.size*.12,line.x-shift+width,line.y+line.size*.12);if(line.strike)doc.line(line.x-shift,line.y-line.size*.3,line.x-shift+width,line.y-line.size*.3);}
        }
      }
      else if(n.kind==="image")doc.addImage(images.get(i)!,"PNG",n.x,n.y,n.w,n.h);
      doc.restoreGraphicsState();
    });
    doc.restoreGraphicsState();
  });
}
