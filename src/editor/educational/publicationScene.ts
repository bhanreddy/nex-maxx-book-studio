import type { ImageTreatment } from "./imageTreatment";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { COLLECTIONS, PUBLICATION_PALETTES, GRADE_SCALES } from "../../domain/educational/designTokens";
import { EDUCATIONAL_BLOCK_REGISTRY } from "./blockRegistry";
import { toGrayHex } from "../design/contrast";
import { renderAtelier } from "./atelier/render";
import { renderReferenceElement } from "../curriculum/renderReferenceElement";
import { renderCurriculum } from "../curriculum/render";
import { sliceScene } from "../curriculum/pagination";

type SceneMark = { opacity?: number; motifId?: string; clipId?: string; contentId?: string };
export type SceneNode =
  | ({ kind: "rect"; x: number; y: number; w: number; h: number; fill: string; stroke?: string; radius?: number; strokeWidth?: number; gradientId?: string } & SceneMark)
  | ({ kind: "ellipse"; x: number; y: number; rx: number; ry: number; fill: string; stroke?: string; strokeWidth?: number } & SceneMark)
  | ({ kind: "line"; x: number; y: number; x2: number; y2: number; stroke: string; strokeWidth?: number } & SceneMark)
  | ({ kind: "polygon"; points: number[][]; fill: string; stroke?: string; strokeWidth?: number } & SceneMark)
  | ({ kind: "text"; x: number; y: number; text: string; size: number; fill: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; letterSpacing?: number; textLength?: number; font?: "sans" | "serif"; fontFamily?: string; align?: "start" | "middle" | "end"; wrapWidth?: number; lineHeight?: number; lines?: string[] } & SceneMark)
  | ({ kind: "image"; x: number; y: number; w: number; h: number; src: string; alt: string; focalX: number; focalY: number; scale: number; sourceWidth?: number; sourceHeight?: number } & SceneMark & ImageTreatment)
  | ({ kind: "path"; d: string; fill: string; stroke?: string; strokeWidth?: number } & SceneMark)
  | { kind: "gradient"; id: string; x1: number; y1: number; x2: number; y2: number; from: string; to: string }
  | { kind: "clip"; id: string; x: number; y: number; w: number; h: number; radius?: number };
export interface SceneMotifFrame { id: string; role: string; kind: string; x: number; y: number; w: number; h: number; locked?: boolean }
export interface PublicationScene { width: number; height: number; nodes: SceneNode[]; variant: string; warnings: string[]; motifs?: SceneMotifFrame[] }
export type PublicationPalette = { name: string; primary: string; secondary: string; accent: string; surface: string; text: string; border: string };
export type ArtworkKind = "number-city" | "botanical" | "geometry" | "waves" | "dot-grid" | "arch" | "stars" | "letters" | "numbers" | "leaves" | "molecules" | "clouds" | "brush-stroke" | "paper-tear" | "scribbles" | "arrows";
export const ARTWORKS: { id: ArtworkKind; name: string; description: string }[] = [
  { id: "number-city", name: "Number neighbourhood", description: "An original geometric city of numbers" },
  { id: "botanical", name: "Botanical study", description: "Layered stems and leaves for discovery pages" },
  { id: "geometry", name: "Shape composition", description: "Circles, steps and confident colour" },
  { id: "waves", name: "Colour landscape", description: "Layered horizons for chapter openings" },
  { id: "dot-grid", name: "Quiet dot grid", description: "A restrained background for thinking space" },
  { id: "arch", name: "Editorial arch", description: "A bold architectural corner accent" },
  { id: "stars", name: "Discovery stars", description: "Small sparks for curiosity and achievement" },
  { id: "letters", name: "Letter play", description: "Editable language accents" },
  { id: "numbers", name: "Number play", description: "Editable mathematics accents" },
  { id: "leaves", name: "Organic leaves", description: "Nature forms for field notes" },
  { id: "molecules", name: "Molecule network", description: "Connected circles for scientific thinking" },
  { id: "clouds", name: "Soft clouds", description: "A light visual accent for young readers" },
  { id: "brush-stroke", name: "Brush strokes", description: "An expressive mark behind a key idea" },
  { id: "paper-tear", name: "Paper edge", description: "An irregular editorial edge" },
  { id: "scribbles", name: "Thinking scribbles", description: "Hand drawn loops for reflection" },
  { id: "arrows", name: "Direction arrows", description: "A visual link between learning steps" },
];
export function resolvePublicationPalette(block: SmartBlockInstance): PublicationPalette {
  const o = block.styleOverrides;
  const selected = o.paletteId || COLLECTIONS[block.family]?.paletteId || "indigo";
  const p = PUBLICATION_PALETTES[selected as keyof typeof PUBLICATION_PALETTES] || PUBLICATION_PALETTES.indigo;
  const result: PublicationPalette = { ...p, ...Object.fromEntries(Object.entries(o.customPalette || {}).filter(([,v]) => !!v)) };
  if (o.printMode === "reduced-ink") result.surface = "#FFFFFF";
  if (o.printMode === "grayscale") for (const key of ["primary", "secondary", "accent", "surface", "text", "border"] as const) result[key] = toGrayHex(result[key]);
  return result;
}
let context: CanvasRenderingContext2D | null | undefined;
const widths = new Map<string, number>();
export function textWidth(text: string, size: number, bold = false, serif = false, fontFamily?: string, letterSpacing = 0): number {
  const key = `${size}/${bold}/${serif}/${fontFamily || ""}/${letterSpacing}/${text}`;
  const cached = widths.get(key); if (cached !== undefined) return cached;
  if (context === undefined && typeof document !== "undefined") context = document.createElement("canvas").getContext("2d");
  let result: number;
  if (context) { context.font = `${bold ? "bold " : ""}${size}px ${fontFamily || (serif ? "Times New Roman" : "Arial")}`; result = context.measureText(text).width; }
  else result = Array.from(text).reduce((sum, c) => sum + (" ilI.,:;!'".includes(c) ? .27 : "MW@%".includes(c) ? .85 : .55), 0) * size * (bold ? 1.04 : 1);
  result += Math.max(0, Array.from(text).length - 1) * letterSpacing;
  if (widths.size > 6000) widths.clear(); widths.set(key, result); return result;
}
export function wrapText(text: string, max: number, size: number, bold = false, serif = false, fontFamily?: string, letterSpacing = 0): string[] {
  const result: string[] = [];
  for (const paragraph of String(text).split("\n")) {
    if (!paragraph.trim()) { result.push(""); continue; }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (textWidth(line ? `${line} ${word}` : word, size, bold, serif, fontFamily, letterSpacing) <= max) { line = line ? `${line} ${word}` : word; continue; }
      if (line) result.push(line); line = "";
      // Long URLs and unbroken script runs must also stay within the available measure.
      for (const char of Array.from(word)) {
        if (line && textWidth(line + char, size, bold, serif, fontFamily, letterSpacing) > max) { result.push(line); line = char; } else line += char;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

/** Flatten derived reading lines for print, pagination and detached native layers. */
export function expandSceneText(node: SceneNode): SceneNode[] {
  if (node.kind !== "text" || !node.lines) return [node];
  return node.lines.map((text, index) => ({ ...node, text, lines: undefined,
    y: node.y + index * (node.lineHeight || node.size * 1.4) }));
}

function editedTextWidth(node: Extract<SceneNode, { kind: "text" }>, scene: PublicationScene): number {
  if (node.wrapWidth !== undefined) return Math.max(1, node.wrapWidth);
  // Older templates have no text measure. Use the smallest enclosing reading panel.
  const panels = scene.nodes.filter((n): n is Extract<SceneNode, { kind: "rect" }> => n.kind === "rect"
    && n.w > node.size * 2 && n.h > node.size * 2
    && node.x >= n.x && node.x <= n.x + n.w && node.y >= n.y && node.y <= n.y + n.h);
  const panel = panels.sort((a, b) => a.w - b.w)[0];
  const left = panel?.x || 0, right = panel ? panel.x + panel.w : scene.width;
  if (node.align === "middle") return Math.max(1, 2 * Math.min(node.x - left, right - node.x) - 8);
  if (node.align === "end") return Math.max(1, node.x - left - 8);
  return Math.max(1, right - node.x - Math.min(20, Math.max(8, node.x - left)));
}
export function artworkNodes(kind: ArtworkKind, x: number, y: number, w: number, h: number, p: PublicationPalette, opacity = 1): SceneNode[] {
  const nodes: SceneNode[] = [];
  const rect = (a:number,b:number,c:number,d:number,fill:string,radius=0) => nodes.push({kind:"rect",x:x+a*w,y:y+b*h,w:c*w,h:d*h,fill,radius,opacity});
  const ellipse = (a:number,b:number,c:number,d:number,fill:string) => nodes.push({kind:"ellipse",x:x+a*w,y:y+b*h,rx:c*w,ry:d*h,fill,opacity});
  if (kind === "number-city") {
    rect(.02,.9,.96,.025,p.text);
    [.1,.3,.5,.71].forEach((a,i)=> { const heights=[.4,.68,.52,.78]; rect(a,1-heights[i]-.1,.16,heights[i],i%2?p.primary:p.secondary,5); for(let j=0;j<3;j++) rect(a+.025,1-heights[i]-.05+j*.075,.035,.025,p.surface,1); nodes.push({kind:"text",x:x+(a+.07)*w,y:y+.82*h,text:["2","4","6","8"][i],size:Math.min(w*.065,h*.13),fill:p.surface,bold:true}); });
    ellipse(.12,.17,.07,.07,p.accent); ellipse(.86,.1,.035,.035,p.accent);
  } else if (kind === "botanical") {
    [0,1,2].forEach(i=> { const stemX=x+w*(.25+i*.24); nodes.push({kind:"line",x:stemX,y:y+h*.91,x2:stemX,y2:y+h*(.14+i*.1),stroke:p.primary,strokeWidth:2,opacity}); for(let j=0;j<3;j++) {const v=.3+j*.2+i*.035; ellipse(.25+i*.24-.07,v,.09,.055,j%2?p.primary:p.secondary); ellipse(.25+i*.24+.07,v-.06,.09,.055,j%2?p.secondary:p.accent); }});
    rect(.1,.92,.8,.015,p.primary);
  } else if (kind === "geometry" || kind === "arch") {
    ellipse(.5,.45,.38,.4,p.primary); rect(.12,.46,.76,.44,p.primary);
    ellipse(.5,.48,.22,.25,p.surface); rect(.28,.49,.44,.41,p.surface);
    ellipse(.77,.24,.15,.16,p.accent); rect(.03,.72,.32,.2,p.secondary,3);
    if(kind === "geometry") {rect(.02,.58,.16,.14,p.secondary,3); ellipse(.18,.16,.08,.08,p.secondary);}
  } else if (kind === "waves") {
    nodes.push({kind:"polygon",points:[[x,y+h*.8],[x+w*.35,y+h*.15],[x+w*.65,y+h*.6],[x+w,y+h*.05],[x+w,y+h],[x,y+h]],fill:p.secondary,opacity});
    nodes.push({kind:"polygon",points:[[x,y+h*.85],[x+w*.35,y+h*.55],[x+w*.7,y+h*.83],[x+w,y+h*.32],[x+w,y+h],[x,y+h]],fill:p.primary,opacity});
    ellipse(.16,.25,.1,.13,p.accent);
  } else if (kind === "stars") {
    [[.25,.25,.16],[.7,.65,.25],[.85,.15,.08]].forEach(([cx,cy,r],i)=>nodes.push({kind:"polygon",points:Array.from({length:10},(_,j)=>{const angle=j*Math.PI/5-Math.PI/2,rr=r*(j%2?.43:1);return [x+(cx+Math.cos(angle)*rr)*w,y+(cy+Math.sin(angle)*rr)*h];}),fill:i%2?p.secondary:p.accent,opacity}));
  } else if (kind === "letters" || kind === "numbers") {
    (kind === "letters" ? ["A","b","c"] : ["1","2","3"]).forEach((text,i)=>nodes.push({kind:"text",x:x+(i*.29+.08)*w,y:y+(i%2?.8:.56)*h,text,size:Math.min(w*.25,h*.48),fill:i%2?p.secondary:p.primary,bold:true,opacity}));
  } else if (kind === "leaves") {
    [.24,.5,.76].forEach((a,i)=>{ellipse(a,.5,.11,.32,i%2?p.primary:p.secondary);nodes.push({kind:"line",x:x+a*w,y:y+.2*h,x2:x+a*w,y2:y+.88*h,stroke:p.surface,strokeWidth:1,opacity});});
  } else if (kind === "molecules") {
    const points=[[.18,.5],[.5,.18],[.78,.5],[.5,.8]];
    points.slice(1).forEach(([a,b])=>nodes.push({kind:"line",x:x+.18*w,y:y+.5*h,x2:x+a*w,y2:y+b*h,stroke:p.secondary,strokeWidth:Math.max(1,w*.03),opacity}));
    points.forEach(([a,b],i)=>ellipse(a,b,.09,.09,i%2?p.accent:p.primary));
  } else if (kind === "clouds") {
    ellipse(.35,.5,.26,.22,p.secondary);ellipse(.57,.39,.24,.28,p.secondary);ellipse(.77,.56,.2,.18,p.secondary);rect(.2,.5,.68,.23,p.secondary,5);
  } else if (kind === "brush-stroke" || kind === "paper-tear") {
    const top=Array.from({length:12},(_,i)=>[x+w*i/11,y+h*(.22+(i%3)*.03)]),bottom=Array.from({length:12},(_,i)=>[x+w*(11-i)/11,y+h*(.71+(i%3)*.045)]);
    nodes.push({kind:"polygon",points:[...top,...bottom],fill:kind === "paper-tear"?p.surface:p.accent,opacity});
  } else if (kind === "scribbles") {
    nodes.push({kind:"path",d:`M ${x+w*.1} ${y+h*.62} C ${x+w*.45} ${y-h*.1} ${x+w*.75} ${y+h*1.12} ${x+w*.3} ${y+h*.65} C ${x+w*.05} ${y+h*.15} ${x+w*.93} ${y+h*.2} ${x+w*.88} ${y+h*.55}`,fill:"none",stroke:p.secondary,strokeWidth:Math.max(1,w*.025),opacity});
  } else if (kind === "arrows") {
    nodes.push({kind:"line",x:x+w*.08,y:y+h*.5,x2:x+w*.82,y2:y+h*.5,stroke:p.primary,strokeWidth:Math.max(2,w*.045),opacity});
    nodes.push({kind:"polygon",points:[[x+w*.7,y+h*.22],[x+w*.95,y+h*.5],[x+w*.7,y+h*.78]],fill:p.primary,opacity});
  } else for(let a=10;a<w;a+=16) for(let b=10;b<h;b+=16) nodes.push({kind:"ellipse",x:x+a,y:y+b,rx:.8,ry:.8,fill:p.primary,opacity:opacity*.35});
  return nodes;
}
const aliases: Record<string,string> = {
  "split-hero":"hero", "editorial-quote":"editorial", "stepping-pathway":"pathway", cards:"tiles", orbit:"radial", timeline:"milestones",
  "bubble-challenge":"spotlight", "compact-terminal":"sidebar", "split-recap":"split", "node-network":"radial", "horizontal-steps":"steps", "stepped-stages":"steps",
  "side-by-side":"comparison", "mcq-cards":"questions", "comic-bubble":"spotlight", "materials-and-procedure":"lab", "inquiry-box":"response", "grid-cards":"tiles",
  "number-bubbles":"tiles", "tiered-levels":"tiers", "two-column-text":"split", "capsule-spotlight":"spotlight", "terminal-card":"sidebar", "split-card":"split", "question-card":"questions", "comparison-box":"comparison", "three-phase-card":"steps", "summary-grid":"tiles", "qr-split":"split",
};
export function gradientBands(x:number,y:number,w:number,h:number,from:string,to:string,vertical:boolean):SceneNode[] {
  const parse=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)||0);
  const a=parse(from),b=parse(to),count=80;
  return Array.from({length:count},(_,i)=>({kind:"rect" as const,x:x+(vertical?0:w*i/count),y:y+(vertical?h*i/count:0),w:vertical?w:w/count+.1,h:vertical?h/count+.1:h,fill:"#"+a.map((v,j)=>Math.round(v+(b[j]-v)*i/(count-1)).toString(16).padStart(2,"0")).join("")}));
}
export function backgroundPatternNodes(pattern:string,w:number,h:number,p:PublicationPalette,opacity=.15):SceneNode[] {
  if(pattern === "dots")return artworkNodes("dot-grid",0,0,w,h,p,opacity);
  const nodes:SceneNode[]=[];
  if(pattern === "grid" || pattern === "isometric") {
    for(let x=0;x<w;x+=18)nodes.push({kind:"line",x,y:0,x2:pattern === "isometric"?Math.min(w,x+h*.5):x,y2:h,stroke:p.primary,strokeWidth:.5,opacity});
    for(let y=0;y<h;y+=18)nodes.push({kind:"line",x:0,y,x2:w,y2:y,stroke:p.primary,strokeWidth:.5,opacity});
  } else if(pattern === "waves")for(let y=10;y<h;y+=24)for(let x=0;x<w;x+=12)nodes.push({kind:"line",x,y:y+Math.sin(x/36)*5,x2:Math.min(w,x+12),y2:y+Math.sin((x+12)/36)*5,stroke:p.primary,strokeWidth:.6,opacity});
  return nodes;
}
export function buildPublicationScene(block: SmartBlockInstance, options: { teacher?: boolean } = {}): PublicationScene {
  const resizeFrame = block.styleOverrides.resizeFrame;
  if (resizeFrame) block = { ...block, transform: { ...block.transform, width: resizeFrame.width, height: resizeFrame.height } };
  const scene = buildScene(block, options);
  const family = block.styleOverrides.fontFamily;
  const counts = { text: 0, image: 0 };
  const layout = block.styleOverrides.contentLayout;
  const result = { ...scene, nodes: scene.nodes.map(node => {
    if (node.kind !== 'text' && node.kind !== 'image') return node;
    const contentId = `${node.kind}-${counts[node.kind]++}`;
    const base = node.kind === 'text' ? node.text : node.src;
    const edit = layout?.enabled ? layout.items[contentId] : undefined;
    const next = { ...node, contentId, ...(node.kind === 'text' && family ? { fontFamily: family } : {}) };
    // Stale overrides must never replace new curriculum content after a layout/content change.
    if (!edit || edit.base !== base) return next;
    next.x += Number.isFinite(edit.dx) ? edit.dx : 0;
    next.y += Number.isFinite(edit.dy) ? edit.dy : 0;
    if (next.kind === 'text' && edit.text !== undefined) {
      next.text = edit.text;
      next.wrapWidth = editedTextWidth(node as Extract<SceneNode, { kind: "text" }>, scene);
      next.lines = wrapText(next.text, next.wrapWidth, next.size, next.bold, next.font === "serif", next.fontFamily, next.letterSpacing);
      // A former one-line textLength must not compress the replacement paragraph.
      next.textLength = undefined;
    }
    if (next.kind === 'image' && edit.src !== undefined) next.src = edit.src;
    // A moved image keeps its own mask, but leaves its former template clipping frame.
    next.clipId = undefined;
    return next;
  }) };
  return block.styleOverrides.sceneSlice && (block.curriculum || block.styleOverrides.referenceElement)
    ? sliceScene(result, block.styleOverrides.sceneSlice) : result;
}
function buildScene(block: SmartBlockInstance, options: { teacher?: boolean } = {}): PublicationScene {
  if (block.curriculum || block.styleOverrides.referenceElement) {
    const scene = block.curriculum ? renderCurriculum(block, { wrapText, textWidth, artworkNodes, resolvePublicationPalette }, options) : renderReferenceElement(block, { wrapText, textWidth, artworkNodes, resolvePublicationPalette }, options);
    if (block.styleOverrides.printMode === "grayscale") scene.nodes = scene.nodes.map(node => {
      const n = { ...node };
      if ("fill" in n) n.fill = toGrayHex(n.fill);
      if ("stroke" in n && n.stroke) n.stroke = toGrayHex(n.stroke);
      if (n.kind === "gradient") { n.from = toGrayHex(n.from); n.to = toGrayHex(n.to); }
      if (n.kind === "image") n.saturation = 0;
      return n;
    });
    return scene;
  }
  const def = EDUCATIONAL_BLOCK_REGISTRY[block.presetId];
  if (def?.skinId) {
    const skinned = renderAtelier(block, { wrapText, textWidth, artworkNodes, resolvePublicationPalette }, options);
    if (skinned) return skinned;
  }
  const raw = block.styleOverrides.layoutVariant || def?.reflowRules.layoutVariant || "checklist";
  const variant = aliases[raw] || raw;
  const p = resolvePublicationPalette(block), c = block.semanticContent, o = block.styleOverrides;
  const w = Math.max(180, block.transform.width), pad = Math.max(4, Math.min(w / 4, o.paddingPt ?? 18)), gap = Math.max(0, o.spacingPt ?? 12), inner = w-pad*2;
  const size = Math.max(10.5, GRADE_SCALES[block.gradeBand]?.bodyPt || 12) * Math.max(1, o.fontSizeScale || 1);
  const serif = block.family === "nex-editorial";
  const radius = o.cornerRadiusPt ?? (block.family === "nex-play" ? 16 : serif ? 2 : 10);
  const nodes: SceneNode[] = [], warnings: string[] = [];
  const rect=(x:number,y:number,rw:number,rh:number,fill:string,stroke?:string,r=radius)=>nodes.push({kind:"rect",x,y,w:rw,h:rh,fill,stroke,radius:r,strokeWidth:o.borderWidthPt ?? .65});
  const line=(x:number,y:number,x2:number,y2:number,stroke=p.border,strokeWidth=.7)=>nodes.push({kind:"line",x,y,x2,y2,stroke,strokeWidth});
  const text=(value:string|undefined,x:number,y:number,tw:number,fs=size,bold=false,fill=p.text,fontSerif=false):number=> {
    if(!value) return y;
    const lines=wrapText(value, Math.max(12,tw), fs,bold,fontSerif);
    lines.forEach((t,i)=>nodes.push({kind:"text",x,y:y+fs+i*fs*1.4,text:t,size:fs,fill,bold,font:fontSerif?"serif":"sans",wrapWidth:Math.max(12,tw),lineHeight:fs*1.4}));
    return y+lines.length*fs*1.4;
  };
  const badge=(label:string,x:number,y:number,fill=p.primary)=> {rect(x,y,24,24,fill,undefined,8); text(label,x+6,y+4,20,10,true,"#FFFFFF");};
  const answer=(x:number,y:number,aw:number)=> { const space=Math.max(16,o.answerSpacePt ?? 26); for(let yy=y+space;yy<=y+space*2;yy+=space)line(x,yy,x+aw,yy); return y+space*2+8; };
  const hero = ["hero","panorama","editorial"].includes(variant);
  const boldOpening = ["hero","panorama"].includes(variant) && o.printMode !== "reduced-ink" && !o.backgroundImage && !o.backgroundSpec;
  const openingInk = boldOpening ? "#FFFFFF" : p.primary;
  const openingBody = boldOpening ? "#FFFFFF" : p.text;
  let y=pad;
  if(c.unitBadge) y=text(c.unitBadge,pad,y,inner,9,true,openingInk)+8;
  if(hero) {
    const visualWidth = w >= 340 ? inner*.32 : 0;
    const tx = variant === "editorial" ? pad+58 : pad;
    if(variant === "editorial") {text(c.chapterNumber||"01",pad,y,55,38,true,p.secondary,true);line(pad+48,y,pad+48,y+86,p.border);}
    else {text(`CHAPTER ${c.chapterNumber || "01"}`,pad,y,inner,9,true,openingInk);y+=24;}
    y=text(c.title,tx,y,inner-(tx-pad)-visualWidth-10,w>380?32:24,true,openingInk,serif)+8;
    y=text(c.subtitle,tx,y,inner-(tx-pad)-visualWidth-10,size,false,openingBody)+12;
    y=text(c.calloutText,tx,y,inner-(tx-pad)-visualWidth-10,size,false,openingBody)+12;
    if(visualWidth && o.illustration !== "none") nodes.push(...artworkNodes(o.illustration || "number-city",w-pad-visualWidth,42,visualWidth,Math.max(118,y-48),p));
    if(variant === "panorama") { nodes.push(...artworkNodes("waves",pad,y,inner,65,p)); y+=78; }
    y=Math.max(y,180);
    y=text(c.introText,pad,y,inner,size,false,openingBody)+(c.introText?10:0);
    y=text(c.passage,pad,y,inner,size,false,openingBody)+(c.passage?10:0);
  } else {
    const label=def?.name.split(" · ")[0] || "Learning studio";
    if(c.title !== label && !["ribbon","sidebar"].includes(variant)) y=text(label.toUpperCase(),pad,y,inner,8.5,true,p.primary)+6;
    if(variant === "ribbon") {rect(pad,y,5,48,p.secondary,undefined,2);y=text(c.title,pad+17,y,inner-17,23,true,p.primary,serif)+8;}
    else if(variant === "sidebar") {rect(pad,y,4,42,p.secondary,undefined,0);y=text(c.title,pad+16,y,inner-16,serif?20:18,true,p.primary,serif)+16;}
    else {y=text(c.title,pad,y,inner,serif?20:18,true,p.primary,serif)+8;line(pad,y,w-pad,y,p.border);y+=12;}
    y=text(c.subtitle,pad,y,inner,size,false,p.text)+(c.subtitle?10:0);
    y=text(c.introText,pad,y,inner,size)+(c.introText?10:0);
    if(c.passage) {rect(pad,y,inner,wrapText(c.passage,inner-24,size,false,serif).length*size*1.4+24,"#FFFFFF",p.border);y=text(c.passage,pad+12,y+12,inner-24,size,false,p.text,serif)+24;}
    if(c.calloutText && (variant !== "radial" || w<340)) {
      const calloutSize=variant === "spotlight" ? size+5 : size;
      const bh=wrapText(c.calloutText,inner-24,calloutSize,true).length*calloutSize*1.4+24;
      rect(pad,y,inner,bh,variant === "spotlight" ? p.primary : "#FFFFFF",variant === "spotlight"?undefined:p.border);
      y=text(c.calloutText,pad+12,y+12,inner-24,calloutSize,true,variant === "spotlight"?"#FFFFFF":p.text)+24;
    }
  }
  const items = c.items || [];
  const steps = c.steps || [];
  const questions = c.questions || [];
  // Every semantic field is rendered independently: changing layout never hides an item or step.
  if(c.materials?.length) {y=text("YOU WILL NEED",pad,y,inner,9,true,p.secondary)+5;y=text(c.materials.join(" · "),pad,y,inner,size)+12;}
  if(items.length) {
    if(variant === "radial" && w>=340) {
      const start=y, side=(inner-100)/2, boxW=side-12;
      const rows=Math.ceil(items.length/2), rowHeights=Array.from({length:rows},(_,r)=>Math.max(...items.slice(r*2,r*2+2).map(t=>wrapText(t,boxW-20,size).length*size*1.4+22)));
      const total=rowHeights.reduce((a,b)=>a+b+12,0), centerY=start+total/2;
      const centerHeight=Math.max(64,wrapText(c.calloutText||"Connections",70,10,true).length*14+20);
      nodes.push({kind:"ellipse",x:w/2,y:centerY,rx:44,ry:centerHeight/2,fill:p.primary});
      text(c.calloutText||"Connections",w/2-35,centerY-centerHeight/2+10,70,10,true,"#FFFFFF");
      let rowY=start;
      for(let r=0;r<rows;r++) {for(let sideIdx=0;sideIdx<2;sideIdx++){const i=r*2+sideIdx;if(i>=items.length)continue;const x=sideIdx? w-pad-boxW :pad;line(w/2+(sideIdx?44:-44),centerY,sideIdx?x:x+boxW,rowY+rowHeights[r]/2,p.secondary,1);rect(x,rowY,boxW,rowHeights[r],"#FFFFFF",p.border,8);text(items[i],x+10,rowY+10,boxW-20,size);}rowY+=rowHeights[r]+12;} y=rowY;
    } else if(["tiles","milestones","stations","comparison","split","pathway","tiers"].includes(variant) && w>=340) {
      const cols=variant === "pathway" && w>450?3:2, cw=(inner-gap*(cols-1))/cols;
      for(let start=0;start<items.length;start+=cols) {
        const row=items.slice(start,start+cols), heights=row.map(t=>wrapText(t,cw-24,size).length*size*1.4+55), rh=Math.max(...heights);
        row.forEach((item,j)=> {const x=pad+j*(cw+gap); if(variant === "pathway" && j<row.length-1)line(x+cw,y+rh/2,x+cw+gap,y+rh/2,p.secondary,2);
          rect(x,y,cw,rh,"#FFFFFF",p.border,variant === "comparison"?2:radius);rect(x,y,variant === "comparison"?4:cw,variant === "comparison"?rh:4,(start+j)%2?p.secondary:p.primary,undefined,0);
          badge(String(start+j+1).padStart(2,"0"),x+12,y+12,(start+j)%2?p.secondary:p.primary);text(item,x+12,y+44,cw-24,size);
        });y+=rh+gap;
      }
    } else if(variant === "steps" || variant === "tiers") {
      items.forEach((item,i)=>{const top=y;badge(String(i+1),pad,y,i%2?p.secondary:p.primary);y=text(item,pad+38,y,inner-38,size)+18;if(i<items.length-1)line(pad+12,top+28,pad+12,y-4,p.secondary,1.5);});
    } else {
      items.forEach((item,i)=> {const top=y; if(variant === "checklist")rect(pad,y+3,12,12,"#FFFFFF",p.secondary,2);else badge(String(i+1),pad,y);y=text(item,pad+34,y,inner-34,size)+12;if(variant === "notebook" || variant === "response")y=answer(pad+34,y,inner-34);else if(variant === "sidebar")line(pad+34,y-5,w-pad,y-5);if(y-top<32)y=top+32;});
    }
  }
  if(steps.length) {
    if(variant === "stations" && w>=380) {
      const cols=2,cw=(inner-gap)/cols;
      for(let i=0;i<steps.length;i+=cols) {const row=steps.slice(i,i+cols);const hh=Math.max(...row.map(s=>wrapText(s.title,cw-24,size,true).length*size*1.4+wrapText(s.body,cw-24,size).length*size*1.4+64));row.forEach((s,j)=>{const x=pad+j*(cw+gap);rect(x,y,cw,hh,"#FFFFFF",p.border);badge(String(s.stepNumber),x+12,y+10);const bottom=text(s.title,x+12,y+43,cw-24,size,true,p.primary);text(s.body,x+12,bottom+5,cw-24,size);});y+=hh+12;}
    } else if(variant === "split" && w>=360) {
      steps.forEach(s=>{const labelW=inner*.3;const hh=Math.max(wrapText(`${s.stepNumber}. ${s.title}`,labelW-20,size,true).length,wrapText(s.body,inner-labelW-24,size).length)*size*1.4+24;rect(pad,y,labelW,hh,p.primary,undefined,0);rect(pad+labelW,y,inner-labelW,hh,"#FFFFFF",p.border,0);text(`${s.stepNumber}. ${s.title}`,pad+10,y+12,labelW-20,size,true,"#FFFFFF");text(s.body,pad+labelW+12,y+12,inner-labelW-24,size);y+=hh+8;});
    } else {
      steps.forEach((s,i)=>{const top=y;badge(String(s.stepNumber),pad,y,i%2?p.secondary:p.primary);y=text(s.title,pad+36,y,inner-36,size,true,p.primary)+5;y=text(s.body,pad+36,y,inner-36,size)+16;if(i<steps.length-1)line(pad+12,top+28,pad+12,y-4,p.border,1);});
    }
  }
  if(questions.length) {
    const cols=["tiles","questions","stations"].includes(variant)&&w>=420?2:1, cw=(inner-gap*(cols-1))/cols;
    for(let i=0;i<questions.length;i+=cols) {
      const row=questions.slice(i,i+cols);const bottoms:number[]=[];
      row.forEach((q,j)=>{const x=pad+j*(cw+gap), base=y; let qy=base+12;const index=nodes.length;badge(String(i+j+1),x+10,qy);qy=text(q.prompt,x+44,qy,cw-56,size)+8;
        (q.options||[]).forEach((opt,k)=>{qy=text(`${String.fromCharCode(65+k)}. ${opt}`,x+14,qy,cw-28,size)+5;});
        if(options.teacher&&q.answer) qy=text(`Answer: ${q.answer}`,x+14,qy,cw-28,size,true,p.secondary)+12;
        else if(!q.options?.length)qy=answer(x+14,qy,cw-28);
        if(q.points) qy=text(`${q.points} ${q.points===1?"mark":"marks"}`,x+14,qy,cw-28,9,true,p.primary)+6;
        if(variant === "question-strip")qy=text("Confidence:  learning / practising / confident",x+14,qy,cw-28,9,false,p.text)+10;
        nodes.splice(index,0,{kind:"rect",x,y:base,w:cw,h:qy-base,fill:"#FFFFFF",stroke:p.border,radius:radius,strokeWidth:.65});bottoms.push(qy);
      });y=Math.max(...bottoms)+12;
    }
  }
  if(c.numberValue !== undefined) {
    const value=Math.max(0,Math.min(999999999,Math.floor(c.numberValue))), digits=String(value).padStart(5,"0").split("");
    const indian=c.numberSystem!=="international";
    const names=indian?["O","T","H","Th","TTh","L","TL","Cr","TCr"]:["O","T","H","Th","TTh","HTh","M","TM","HM"];
    const cw=inner/digits.length, chartY=y;
    y=text(new Intl.NumberFormat(indian?"en-IN":"en-US").format(value),pad,y,inner,24,true,p.primary)+12;
    const colors=[p.primary,p.secondary,"#925323","#76558F","#276C8A","#8B3E60"].map(color=>o.printMode === "grayscale" ? toGrayHex(color) : color);
    const chartTop=y;
    if(variant === "discs") {
      digits.forEach((d,i)=>{const x=pad+i*cw,colour=colors[i%colors.length];rect(x,chartTop,cw,24,colour,undefined,0);text(names[digits.length-i-1],x+cw/2-12,chartTop+5,28,10,true,"#FFFFFF");rect(x,chartTop+24,cw,100,"#FFFFFF",p.border,0);for(let k=0;k<Number(d);k++){const dx=x+cw*(.22+(k%3)*.28),dy=chartTop+43+Math.floor(k/3)*23;nodes.push({kind:"ellipse",x:dx,y:dy,rx:Math.min(cw*.105,8),ry:8,fill:colour});}text(d,x+cw/2-4,chartTop+128,20,size,true,colour);});y=chartTop+155;
    } else if(variant === "abacus") {
      const bh=140;digits.forEach((d,i)=> {const x=pad+i*cw+cw/2,colour=colors[i%colors.length];line(x,chartTop+8,x,chartTop+bh-20,p.border,2);for(let k=0;k<Number(d);k++)nodes.push({kind:"ellipse",x,y:chartTop+bh-29-k*11,rx:Math.min(cw*.28,15),ry:4.5,fill:colour});text(names[digits.length-i-1],x-13,chartTop+bh-12,28,10,true,p.text);text(d,x-5,chartTop+bh+5,20,size,true,colour);});line(pad,chartTop+bh-20,w-pad,chartTop+bh-20,p.primary,3);y=chartTop+bh+30;
    } else {
      digits.forEach((d,i)=>{const x=pad+i*cw,colour=colors[i%colors.length];rect(x,chartTop,cw,25,colour,undefined,0);text(names[digits.length-i-1],x+cw/2-12,chartTop+6,28,10,true,"#FFFFFF");rect(x,chartTop+25,cw,42,"#FFFFFF",p.border,0);text(d,x+cw/2-7,chartTop+34,cw,20,true,colour);});y=chartTop+80;
      if(variant === "expanded") {digits.forEach((d,i)=>{const power=10**(digits.length-i-1);y=text(`${d} × ${new Intl.NumberFormat(indian?"en-IN":"en-US").format(power)} = ${new Intl.NumberFormat(indian?"en-IN":"en-US").format(Number(d)*power)}`,pad+12,y,inner-24,size,true,colors[i%colors.length])+6;});}
      else {y=text(digits.map((d,i)=>Number(d)*10**(digits.length-i-1)).filter(Boolean).map(n=>new Intl.NumberFormat(indian?"en-IN":"en-US").format(n)).join(" + "),pad,y,inner,size,true,p.text)+12;}
    }
    if(y<chartY)y=chartY;
  }
  if(c.qrUrl) {y=text(`Explore: ${c.qrUrl}`,pad,y,inner,10,false,p.primary)+10;warnings.push("Resource address is printed as text; no unverified QR code is generated.");}
  if(c.footnote)y=text(c.footnote,pad,y+4,inner,10,false,p.text)+12;
  if(!items.length&&!steps.length&&!questions.length&&!hero&&c.numberValue===undefined&&variant === "response")y=answer(pad,y,inner);
  const h=Math.max(block.transform.height, y+pad,hero?190:80);
  const bg=o.printMode === "reduced-ink" ? undefined : o.backgroundSpec;
  const ink=(color:string)=>o.printMode === "grayscale" ? toGrayHex(color) : color;
  const quiet = ["editorial","sidebar","steps","notebook","ribbon","expanded"].includes(variant);
  const background:SceneNode[]=[{kind:"rect",x:0,y:0,w,h,fill:ink(bg?.color||(boldOpening?p.primary:quiet?"#FFFFFF":p.surface)),stroke:boldOpening||quiet?undefined:ink(bg?.borderColor||p.border),radius,strokeWidth:bg?.borderWidthPt??.65}];
  if(boldOpening)background.push({kind:"rect",x:pad,y:h-5,w:inner*.28,h:5,fill:p.accent,radius:0});
  if(quiet&&!hero)background.push({kind:"line",x:pad,y:1,x2:w-pad,y2:1,stroke:p.primary,strokeWidth:2});
  if(bg?.type === "gradient" && bg.gradient)background.push(...gradientBands(0,0,w,h,ink(bg.gradient.from),ink(bg.gradient.to),(bg.gradient.directionDeg??90)%180!==0));
  // Explicit reading surface protects text when authors place photographic backgrounds.
  if(o.backgroundImage?.src) {const b=o.backgroundImage;background.push({kind:"image",x:0,y:0,w,h,src:b.src,alt:b.alt,focalX:b.focalX,focalY:b.focalY,scale:b.scale,sourceWidth:b.rawWidthPx,sourceHeight:b.rawHeightPx,opacity:b.opacity});background.push({kind:"rect",x:8,y:8,w:w-16,h:h-16,fill:p.surface,radius:Math.max(0,radius-4)});}
  if(bg?.patternOverlay && bg.patternOverlay!=="none") background.push(...backgroundPatternNodes(bg.patternOverlay,w,h,p,bg.patternOpacity??.15));
  if(!hero && o.illustration && o.illustration!=="none")background.push(...artworkNodes(o.illustration,w-84,h-70,66,52,p,o.decorationOpacity??.13));
  if(block.family === "nex-studio")background.push({kind:"rect",x:pad,y:0,w:54,h:5,fill:p.accent,radius:0});
  if(block.family === "nex-discovery")background.push(...artworkNodes("botanical",w-52,2,40,32,p,.12));
  if(block.family === "nex-future") {background.push({kind:"line",x:pad,y:1,x2:w-pad,y2:1,stroke:p.primary,strokeWidth:2});}
  if(block.family === "nex-play")background.push({kind:"ellipse",x:w-14,y:14,rx:5,ry:5,fill:p.accent});
  if(w<240)warnings.push("Narrow block: review at actual print size.");
  return {width:w,height:h,nodes:[...background,...nodes],variant,warnings};
}

export function imagePlacement(n: Extract<SceneNode,{kind:"image"}>):{x:number;y:number;w:number;h:number} {
  const sw=n.sourceWidth||n.w,sh=n.sourceHeight||n.h;
  const scale=(n.fit === "contain" ? Math.min(n.w/sw,n.h/sh) : Math.max(n.w/sw,n.h/sh))*Math.max(1,n.scale);
  const w=sw*scale,h=sh*scale;
  return {x:n.x-(w-n.w)*n.focalX,y:n.y-(h-n.h)*n.focalY,w,h};
}
