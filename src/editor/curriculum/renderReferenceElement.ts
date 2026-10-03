import type { SmartBlockInstance, ReferenceIcon } from "../../domain/educational/blockSchema";
import { CLASS_TYPOGRAPHY, REFERENCE_ELEMENT_TOKENS as T } from "../../domain/educational/designTokens";
import type { PublicationScene, SceneNode } from "../educational/publicationScene";
import type { AtelierHelpers } from "../educational/atelier/render";
import { REFERENCE_ELEMENTS } from "./referenceElements";
import { premiumReferenceHeader } from "./premiumReferenceHeader";

/** Real text and vector primitives: one composition for editor, previews, layers and PDF. */
export function renderReferenceElement(block: SmartBlockInstance, h: AtelierHelpers, options: { teacher?: boolean } = {}): PublicationScene {
  const o = block.styleOverrides, r = o.referenceElement!, c = block.semanticContent;
  const w = Math.max(180, block.transform.width), pad = w < 340 ? 14 : T.padding;
  const fs = (CLASS_TYPOGRAPHY[block.curriculum?.grade || 3]?.body || 14) * Math.max(1, Math.min(2, o.fontSizeScale || 1));
  const primary = o.customPalette?.primary || T.navy, accent = o.customPalette?.accent || T.coral;
  const paper = o.customPalette?.surface || (r.kind === "puzzle" ? T.aqua : T.paper);
  const ink = o.customPalette?.text || T.ink, border = o.customPalette?.border || T.plum;
  const quiet = o.printMode === "reduced-ink", radius = Math.max(0, Math.min(40, o.cornerRadiusPt ?? T.radius));
  const nodes: SceneNode[] = [];
  const rect = (x: number, y: number, rw: number, rh: number, fill: string, rad = radius, stroke?: string, sw = 1) => {
    nodes.push({ kind: "rect", x, y, w: rw, h: rh, fill, radius: rad, stroke, strokeWidth: sw });
  };
  const line = (x: number, y: number, x2: number, y2: number, color = ink, sw = 1) => {
    nodes.push({ kind: "line", x, y, x2, y2, stroke: color, strokeWidth: sw });
  };
  const circle = (x: number, y: number, rr: number, fill: string, stroke?: string, sw = 1) => {
    nodes.push({ kind: "ellipse", x, y, rx: rr, ry: rr, fill, stroke, strokeWidth: sw });
  };
  const path = (d: string, fill: string, stroke?: string, sw = 1) => {
    nodes.push({ kind: "path", d, fill, stroke, strokeWidth: sw });
  };
  const text = (value: string | undefined, x: number, y: number, width: number, size = fs, bold = false, fill = ink, serif = false) => {
    if (!value) return y;
    const lines = h.wrapText(value, Math.max(12, width), size, bold, serif);
    lines.forEach((txt, i) => nodes.push({ kind: "text", x, y: y + size + i * size * 1.42, text: txt, size, bold, fill,
      font: serif ? "serif" : "sans", fontFamily: o.fontFamily, wrapWidth: Math.max(12, width), lineHeight: size * 1.42 }));
    return y + lines.length * size * 1.42;
  };
  const icon = (kind: ReferenceIcon, x: number, y: number, size: number) => {
    if (kind === "none" || o.illustration === "none") return;
    const cx = x + size / 2, cy = y + size / 2, u = size / 10;
    circle(cx, cy + 1.5, size / 2, quiet ? T.white : T.shadow);
    circle(cx, cy, size / 2, quiet ? T.white : accent, primary, 1.2);
    circle(cx, cy, size * .4, paper, border, 1.2);
    const color = primary;
    if (kind === "check") {
      path(`M ${cx-2.2*u} ${cy} L ${cx-.5*u} ${cy+1.7*u} L ${cx+2.6*u} ${cy-1.9*u}`, "none", color, u * .8);
    } else if (kind === "target") {
      circle(cx, cy, 2.7*u, "none", color, u*.5); circle(cx, cy, 1.5*u, "none", border, u*.5);
      line(cx, cy, cx+3*u, cy-3*u, color, u*.55);
      path(`M ${cx+1.6*u} ${cy-3*u} L ${cx+3*u} ${cy-3*u} L ${cx+3*u} ${cy-1.6*u}`, "none", color, u*.4);
    } else if (kind === "book") {
      path(`M ${cx} ${cy-1.5*u} Q ${cx-1.5*u} ${cy-2.5*u} ${cx-2.6*u} ${cy-2*u} L ${cx-2.6*u} ${cy+1.8*u} Q ${cx-1.3*u} ${cy+1.3*u} ${cx} ${cy+2.3*u} Q ${cx+1.3*u} ${cy+1.3*u} ${cx+2.6*u} ${cy+1.8*u} L ${cx+2.6*u} ${cy-2*u} Q ${cx+1.5*u} ${cy-2.5*u} ${cx} ${cy-1.5*u} Z`, "none", color, u*.4);
      line(cx, cy-1.5*u, cx, cy+2.3*u, color, u*.3);
    } else if (kind === "leaf") {
      path(`M ${cx-2*u} ${cy+2*u} Q ${cx-3*u} ${cy-2*u} ${cx+2.6*u} ${cy-2.7*u} Q ${cx+3*u} ${cy+1.2*u} ${cx-2*u} ${cy+2*u} Z`, T.teal);
      line(cx-2.5*u, cy+2.6*u, cx+1.5*u, cy-1.5*u, paper, u*.3);
    } else if (kind === "flask") {
      path(`M ${cx-u} ${cy-2.7*u} L ${cx+u} ${cy-2.7*u} L ${cx+u} ${cy-u} L ${cx+2.5*u} ${cy+2*u} Q ${cx+2.5*u} ${cy+2.6*u} ${cx+1.8*u} ${cy+2.6*u} L ${cx-1.8*u} ${cy+2.6*u} Q ${cx-2.5*u} ${cy+2.6*u} ${cx-2.5*u} ${cy+2*u} L ${cx-u} ${cy-u} Z`, "none", color, u*.35);
      line(cx-1.8*u, cy+u, cx+1.8*u, cy+u, T.teal, u*.5);
    } else if (kind === "globe") {
      circle(cx, cy, 2.7*u, "none", color, u*.3);
      nodes.push({ kind: "ellipse", x: cx, y: cy, rx: 1.2*u, ry: 2.7*u, fill: "none", stroke: color, strokeWidth: u*.3 });
      line(cx-2.7*u, cy, cx+2.7*u, cy, color, u*.3);
    } else if (kind === "computer") {
      rect(cx-2.7*u, cy-2*u, 5.4*u, 3.6*u, "none", u*.3, color, u*.3);
      line(cx, cy+1.6*u, cx, cy+2.5*u, color, u*.4); line(cx-1.5*u, cy+2.5*u, cx+1.5*u, cy+2.5*u, color, u*.4);
    } else if (kind === "puzzle") {
      rect(cx-2.5*u, cy-2.5*u, 5*u, 5*u, "none", u*.6, color, u*.3);
      text("?", cx-u, cy-2*u, 3*u, 3.7*u, true, border);
    } else {
      circle(cx, cy-u*.5, 1.8*u, "none", color, u*.4);
      line(cx-u, cy+1.2*u, cx-u, cy+2.3*u, color, u*.4);
      line(cx+u, cy+1.2*u, cx+u, cy+2.3*u, color, u*.4);
      line(cx-u, cy+2.3*u, cx+u, cy+2.3*u, color, u*.4);
      for (let i=0;i<5;i++) { const a = Math.PI + i*Math.PI/4; line(cx+Math.cos(a)*2.7*u, cy+Math.sin(a)*2.7*u, cx+Math.cos(a)*3.3*u, cy+Math.sin(a)*3.3*u, accent, u*.3); }
    }
  };

  const body = r.showBody !== false;
  const card = ["mental", "puzzle", "hots"].includes(r.kind) && body;
  const hasIcon = r.icon !== "none" && o.illustration !== "none";
  const iconSize = hasIcon ? Math.min(72, w*.16) : 0;
  const rightIcon = ["refresh", "dive-in", "example-arrow"].includes(r.kind);
  const titleX = pad + (hasIcon && !rightIcon ? iconSize + 12 : r.kind === "exercise" ? 44 : 4);
  const titleW = w - titleX - pad - (hasIcon && rightIcon ? iconSize + 14 : 0);
  const titleSize = Math.min(40, Math.max(18, Math.min(w*.07, fs*2.4)));
  const number = r.kind === "exercise" ? r.number || "" : "";
  const title = `${c.title}${number ? ` ${number}` : ""}`;
  let headerH = Math.max(iconSize + 18, h.wrapText(title, titleW, titleSize, true).length*titleSize*1.42 + 26);
  let headerY = 12;
  let y: number;
  const premium = REFERENCE_ELEMENTS.find(preset => preset.kind === r.kind && preset.premium);
  if (premium) {
    const header = premiumReferenceHeader(block, premium, h, nodes, icon);
    headerY = header.headerY; headerH = header.headerH; y = header.endY;
  } else {
  if (r.skillLabel && r.kind !== "activity") {
    const skillW = Math.min(w-pad*2, h.textWidth(r.skillLabel, 10, true)+30);
    const sh = h.wrapText(r.skillLabel, skillW-20, 10, true).length*14.2+12;
    rect(w-pad-skillW, 0, skillW, sh, quiet ? T.white : T.aqua, sh/2, primary, 1);
    text(r.skillLabel, w-pad-skillW+10, 5, skillW-20, 10, true);
    headerY = sh + 7;
  }
  if (!quiet) rect(3, headerY+4, w-6, headerH, T.shadow);
  const light = ["exercise", "quick-check", "example"].includes(r.kind);
  const fill = quiet ? T.white : light ? paper : primary;
  if (r.kind === "dive-in") {
    path(`M 4 ${headerY+16} Q ${w*.3} ${headerY-8} ${w*.55} ${headerY+12} Q ${w*.8} ${headerY+28} ${w-4} ${headerY+8} L ${w-4} ${headerY+headerH-10} Q ${w*.8} ${headerY+headerH+8} ${w*.55} ${headerY+headerH-6} Q ${w*.3} ${headerY+headerH-22} 4 ${headerY+headerH} Z`, fill, quiet ? primary : T.lilac, 2);
  } else {
    rect(0, headerY, w, headerH, fill, r.kind === "example" ? headerH/2 : radius, primary, light ? 2.5 : 1);
    if (!quiet && !light) { nodes.push({kind:"gradient", id:"reference-ribbon", x1:0, y1:headerY, x2:w, y2:headerY+headerH, from:primary, to:border}); rect(1,headerY+1,w-2,headerH-2,fill,radius); const n=nodes[nodes.length-1];if(n.kind==="rect")n.gradientId="reference-ribbon"; }
  }
  if (r.kind === "exercise") {
    path(`M 8 ${headerY+headerH} L 32 ${headerY} L 58 ${headerY} L 34 ${headerY+headerH} Z`, quiet ? T.white : border, primary, .7);
  } else if (["quick-check", "refresh", "example-arrow"].includes(r.kind)) {
    path(`M ${w-32} ${headerY} L ${w-2} ${headerY+headerH/2} L ${w-32} ${headerY+headerH} L ${w-45} ${headerY+headerH} L ${w-15} ${headerY+headerH/2} L ${w-45} ${headerY} Z`, quiet ? T.white : accent);
  }
  if (hasIcon) icon(r.icon || "book", rightIcon ? w-pad-iconSize : pad, headerY+(headerH-iconSize)/2, iconSize);
  const headingLines = h.wrapText(title, titleW, titleSize, true, r.kind === "exercise");
  const headingY = headerY + (headerH-headingLines.length*titleSize*1.42)/2;
  if (r.kind === "hots" && title.trim().toUpperCase() === "HOTS") {
    const tile = Math.min(44, (titleW-18)/4);
    [primary, accent, border, T.teal].forEach((color,i)=>{
      rect(titleX+i*(tile+5),headerY+(headerH-tile)/2,tile,tile,quiet?T.white:color,10);
      text("HOTS"[i],titleX+i*(tile+5)+tile*.2,headerY+(headerH-tile)/2+tile*.08,tile*.7,tile*.7,true,quiet?ink:T.white);
    });
  } else {
    headingLines.forEach((value,i)=>{
      const split=value.lastIndexOf(" ");
      const twoTone=["mental","quick-check","refresh","dive-in","exercise"].includes(r.kind) && split>0 && i===headingLines.length-1;
      const first=twoTone?value.slice(0,split+1):value;
      const yy=headingY+i*titleSize*1.42;
      text(first,titleX,yy,titleW,titleSize,true,quiet || light ? primary : T.white,r.kind==="exercise");
      if(twoTone){const advance=h.textWidth(first.trimEnd(),titleSize,true,r.kind==="exercise")*(typeof document==="undefined"?1.22:1)+titleSize*.4;text(value.slice(split+1),titleX+advance,yy,titleW-advance,titleSize,true,quiet?primary:accent,r.kind==="exercise");}
    });
  }
  y = headerY + headerH + 16;
  if (r.kind === "activity" && r.skillLabel) {
    rect(pad, y-5, w-pad*2, 30, paper, 15, accent);
    y = text(r.skillLabel, pad+12, y, w-pad*2-24, fs, true, ink)+14;
  }
  }
  const bodyStart = y;
  if(card)y+=16;
  const bodyNodesStart = nodes.length;
  const inner = w-pad*2;
  const ruleSpace = Math.max(18, Math.min(100, o.answerSpacePt ?? 26));
  const ruleCount = Math.max(0, Math.min(12, Math.round(r.answerLines ?? 1)));
  const rules = (x: number, width: number, count = ruleCount) => {
    for(let i=0;i<count;i++) { y += ruleSpace; line(x, y, x+width, y, T.rule, .9); }
    if(count)y+=8;
  };
  const row = (value: string, index: number, answer = false) => {
    circle(pad+9,y+fs*.7,9,quiet ? T.white : index%2 ? T.aqua : accent, quiet ? border : undefined);
    text(card ? `${String.fromCharCode(97+index%26)}.` : `${index+1}.`,pad+4,y+1,22,10,true);
    y=text(value,pad+28,y,inner-28,fs)+7;
    if(answer)rules(pad+28,inner-28);
    y+=9;
  };
  if (body) {
    if (c.unitBadge) y=text(c.unitBadge,pad,y,inner,9,true,border)+9;
    if (c.subtitle) y=text(c.subtitle,pad,y,inner,fs+1,true)+10;
    if (c.introText) y=text(c.introText,pad,y,inner)+12;
    if (c.passage) y=text(c.passage,pad,y,inner)+16;
    const photo = o.motifs?.find(m=>m.role==="photo" && m.src && !m.hidden);
    const src = photo?.src || c.illustrationUrl || o.backgroundImage?.src;
    if(src && o.illustration!=="none") { const height=Math.min(220,inner*.5);nodes.push({kind:"image",x:pad,y,w:inner,h:height,src,alt:photo?.alt || o.backgroundImage?.alt || c.title,focalX:photo?.focalX ?? .5,focalY:photo?.focalY ?? .5,scale:photo?.scale || 1,fit:"contain",radius});y+=height+16; }
    const items = c.items || c.lessonSchemaTopics?.map(topic=>topic.label) || c.studySkillTopics?.map(topic=>topic.text) || c.learningOutcomeTopics?.map(topic=>`${topic.verb || ""} ${topic.text}`.trim()) || [];
    items.forEach((item,i)=>row(item,i,card));
    if(c.materials?.length)y=text(c.materials.join(" · "),pad,y,inner)+14;
    (c.steps || []).forEach((step,i)=>{row(step.title,i);y=text(step.body,pad+28,y,inner-28)+12;});
    (c.questions || []).forEach((q,i)=>{
      row(q.prompt,i);
      (q.options || []).forEach((value,j)=>{y=text(`${String.fromCharCode(65+j)}. ${value}`,pad+28,y,inner-28)+5;});
      if(options.teacher && q.answer)y=text(`Answer: ${q.answer}`,pad+28,y,inner-28,fs,false,border)+10;
      else if(!q.options?.length)rules(pad+28,inner-28);
      if(q.points)y=text(`${q.points} ${q.points===1?"mark":"marks"}`,pad+28,y,inner-28,10)+8;
    });
    if(c.numberValue!==undefined)y=text(String(c.numberValue),pad,y,inner,fs*1.5,true)+10;
    if(c.calloutText)y=text(c.calloutText,pad,y,inner,fs,true,border)+12;
    if(r.hint){const hy=y; y=text(`Hint: ${r.hint}`,pad+12,y+8,inner-24,fs)+16;nodes.splice(bodyNodesStart,0,{kind:"rect",x:pad,y:hy,w:inner,h:y-hy,fill:quiet?T.white:T.shadow,radius:12});}
    if(r.kind==="hots" && !(c.items?.length || c.questions?.length))rules(pad,inner,Math.max(3,ruleCount));
    if(r.answerLabel){const bandHeight=h.wrapText(r.answerLabel,inner-24,fs,true).length*fs*1.42+22;rect(pad,y,inner,bandHeight,quiet?T.white:T.shadow,18);const end=text(r.answerLabel,pad+12,y+8,inner-24,fs,true,border);y=end+18;rules(pad+12,inner-24,1);}
    const digital = block.curriculum?.digitalExtension;
    if(digital?.qrImageSrc){nodes.push({kind:"image",x:pad,y,w:72,h:72,src:digital.qrImageSrc,alt:"Resource QR code",focalX:.5,focalY:.5,scale:1,fit:"contain"});y+=84;}
    if(digital?.cta)y=text(digital.cta,pad,y,inner,fs,true)+7;
    if(digital?.url || c.qrUrl)y=text(digital?.url || c.qrUrl,pad,y,inner,10)+12;
    if(c.footnote)y=text(c.footnote,pad,y,inner,10)+12;
  }
  if(body && y>bodyStart) {
    const height=y-bodyStart+pad;
    const panels: SceneNode[]=[{kind:"rect",x:1,y:bodyStart-5,w:w-2,h:height,fill:paper,radius,stroke:card?border:undefined,strokeWidth:card?1.2:0}];
    if(card && !quiet)panels.unshift({kind:"rect",x:3,y:bodyStart-1,w:w-6,h:height,fill:T.shadow,radius});
    nodes.splice(bodyNodesStart,0,...panels);
    if(card){
      for(let x=pad;x<w-pad;x+=8){line(x,bodyStart+5,Math.min(x+3,w-pad),bodyStart+5,border,.6);line(x,y+pad-10,Math.min(x+3,w-pad),y+pad-10,border,.6);}
      for(let yy=bodyStart+18;yy<y+pad-18;yy+=8){line(9,yy,9,yy+3,border,.6);line(w-9,yy,w-9,yy+3,border,.6);}
    }
    y+=pad;
  }
  return {width:w,height:Math.max(headerY+headerH+8,y+4),nodes,variant:`reference-${r.kind}`,warnings:[]};
}
