import type { SubjectDomain } from '../../../domain/educational/blockSchema';
import type { PublicationPalette, SceneNode } from '../publicationScene';
import { publishingColours } from './design';
export const ILLUSTRATION_PRESETS = ['bulb','lens','telescope','book','market','home','bus','plant','microscope','planet','geometry','computer','speech','pencil','balance','flask'] as const;
export type IllustrationPreset = typeof ILLUSTRATION_PRESETS[number];
export function subjectIllustration(subject:SubjectDomain):IllustrationPreset {
 return ({mathematics:'geometry',science:'microscope',english:'book',environmental:'plant','social-studies':'planet','computer-science':'computer','early-learning':'pencil',general:'bulb'} as const)[subject] || 'bulb';
}
/** Original illustrated plates. Uniform scaling keeps round objects round in every slot. */
export function illustrationNodes(kind:IllustrationPreset,x:number,y:number,w:number,h:number,p:PublicationPalette):SceneNode[] {
 const n:SceneNode[]=[],s=Math.min(w,h)/100,ox=x+(w-100*s)/2,oy=y+(h-100*s)/2,c=publishingColours(p);
 const rect=(a:number,b:number,width:number,height:number,fill=p.primary,radius=0)=>n.push({kind:'rect',x:ox+a*s,y:oy+b*s,w:width*s,h:height*s,fill,radius:radius*s});
 const ellipse=(a:number,b:number,rx:number,ry:number,fill=p.primary,stroke?:string)=>n.push({kind:'ellipse',x:ox+a*s,y:oy+b*s,rx:rx*s,ry:ry*s,fill,stroke,strokeWidth:.8*s});
 const line=(a:number,b:number,ex:number,ey:number,stroke=p.primary,thickness=1.5)=>n.push({kind:'line',x:ox+a*s,y:oy+b*s,x2:ox+ex*s,y2:oy+ey*s,stroke,strokeWidth:thickness*s});
 const polygon=(points:number[][],fill=p.primary,stroke?:string)=>n.push({kind:'polygon',points:points.map(([a,b])=>[ox+a*s,oy+b*s]),fill,stroke,strokeWidth:.8*s});
 const star=(a:number,b:number,r=4)=>polygon([[a,b-r],[a+1,b-1],[a+r,b],[a+1,b+1],[a,b+r],[a-1,b+1],[a-r,b],[a-1,b-1]],p.accent);
 ellipse(50,49,44,42,c.tint);ellipse(73,20,12,12,c.accentTint);ellipse(24,74,18,15,c.secondaryTint);
 ellipse(50,88,33,3,c.shadow);star(14,24,4);star(87,63,3);ellipse(81,38,1.6,1.6,p.secondary);ellipse(24,12,2,2,p.accent);
 if(kind==='bulb') {
  ellipse(51,38,24,27,p.primary);ellipse(48,35,22,25,c.accentTint);ellipse(39,26,5,9,c.paper);
  polygon([[34,49],[63,49],[59,64],[39,64]],p.accent);line(45,57,43,40,p.primary,1.8);line(54,57,57,40,p.primary,1.8);line(43,40,50,45);line(50,45,57,40);
  rect(39,63,21,14,p.primary,3);[66,70,74].forEach(v=>line(40,v,58,v,c.paper,.8));ellipse(49,79,7,4,p.secondary);
  [[49,5,49,11],[17,19,23,25],[78,24,84,18],[9,43,18,43],[80,43,90,43]].forEach(v=>line(...v as [number,number,number,number],p.accent,2));
 } else if(kind==='lens') {
  line(62,61,82,83,p.primary,13);line(64,61,83,80,p.secondary,8);ellipse(42,39,29,29,p.primary);ellipse(42,39,24,24,c.paper);ellipse(42,39,20,20,c.secondaryTint);
  ellipse(41,43,7,13,p.primary);ellipse(34,33,8,4,p.secondary);ellipse(47,30,7,4,p.accent);line(41,57,41,29,c.paper,1.2);line(24,22,31,19,c.paper,3);star(80,12,6);
 } else if(kind==='telescope') {
  polygon([[15,37],[68,14],[81,34],[29,57]],p.secondary);polygon([[19,38],[68,18],[72,26],[24,46]],p.primary);
  polygon([[65,13],[75,9],[86,31],[77,36]],p.primary);ellipse(80,22,5,10,c.secondaryTint);ellipse(17,48,6,10,p.primary);line(47,48,51,64,p.primary,4);
  line(51,64,27,89,p.primary,3);line(51,64,76,89,p.primary,3);line(51,64,51,91,p.secondary,3);ellipse(51,64,5,5,p.accent);star(20,13,5);star(85,50,4);
 } else if(kind==='book'||kind==='speech') {
  polygon([[10,30],[42,22],[50,28],[60,22],[89,30],[89,78],[59,73],[50,80],[41,73],[10,79]],p.primary);
  polygon([[14,27],[42,19],[48,26],[48,73],[41,68],[14,75]],c.paper);polygon([[52,26],[59,19],[85,27],[85,75],[59,68],[52,73]],c.accentTint);
  [34,42,50,58].forEach(b=>{line(20,b,40,b-3,c.edge,1.2);line(60,b-3,79,b,c.primaryInk,1);});line(50,28,50,77,p.secondary,1.5);
  polygon([[66,23],[73,25],[73,53],[69,49],[66,52]],p.accent);ellipse(22,61,3,3,p.secondary);star(77,12,5);
  if(kind==='speech'){rect(30,2,48,17,p.secondary,6);polygon([[41,18],[41,27],[50,18]],p.secondary);[40,50,60].forEach(v=>ellipse(v,10,2,2,c.paper));}
 } else if(kind==='market'||kind==='home') {
  rect(19,38,64,45,c.accentTint,3);polygon([[13,39],[50,12],[89,39]],p.primary);polygon([[23,31],[50,14],[76,31]],p.secondary);
  rect(44,53,16,30,p.primary,2);rect(47,56,10,23,c.secondaryTint,1);ellipse(56,71,1,1,p.accent);
  [25,65].forEach(v=>{rect(v,48,12,17,c.paper,1);line(v+6,48,v+6,65,p.secondary);line(v,56,v+12,56,p.secondary);});
  if(kind==='market'){
   rect(15,36,72,16,p.primary,2);[16,30,44,58,72].forEach(v=>rect(v,36,7,13,c.paper));[19,33,47,61,75].forEach(v=>ellipse(v,49,4,4,p.accent));
   rect(12,70,24,15,p.secondary,2);[17,25,31].forEach(v=>ellipse(v,69,4,4,p.accent));line(14,77,34,77,c.paper,1);line(14,81,34,81,c.paper,1);
   rect(68,72,22,13,p.primary,2);[72,78,85].forEach(v=>ellipse(v,71,3,5,p.secondary));rect(73,76,10,4,c.paper,1);
  }else {rect(9,67,6,18,p.secondary,2);ellipse(12,57,11,15,p.primary);ellipse(10,51,6,9,p.secondary);rect(66,76,20,7,p.accent,2);}
  line(6,86,94,86,p.primary,1.5);
 } else if(kind==='bus') {
  rect(8,29,84,44,p.primary,9);rect(12,33,76,31,p.secondary,5);[18,35,52,69].forEach(v=>rect(v,36,13,16,c.paper,2));
  rect(14,55,70,9,p.accent,1);rect(77,57,8,5,c.accentTint,1);rect(12,57,5,5,c.paper,1);
  [27,73].forEach(v=>{ellipse(v,75,10,10,c.ink);ellipse(v,75,6,6,c.paper);ellipse(v,75,2,2,p.primary);});line(5,87,95,87,c.edge,1);
  line(12,22,38,22,p.secondary);line(6,17,25,17,p.accent);line(3,59,7,59,p.secondary,2);
 } else if(kind==='plant') {
  polygon([[31,66],[69,66],[64,87],[36,87]],p.primary);rect(28,64,44,6,p.accent,2);polygon([[37,70],[43,70],[46,85],[40,85]],p.secondary);
  line(50,65,50,20,p.primary,2.5);polygon([[50,44],[25,24],[21,42],[36,50]],p.secondary);polygon([[50,34],[75,13],[80,29],[65,39]],p.primary);
  polygon([[50,56],[76,42],[82,54],[66,62]],p.secondary);polygon([[50,24],[36,9],[29,20],[43,29]],p.primary);
  line(50,44,29,34,c.paper,.8);line(50,34,73,24,c.paper,.8);line(50,56,75,52,c.paper,.8);ellipse(25,63,4,5,p.accent);
 } else if(kind==='microscope') {
  polygon([[40,14],[58,7],[74,37],[57,46]],p.primary);polygon([[43,17],[52,13],[65,38],[58,41]],p.secondary);
  rect(52,4,17,8,p.accent,2);polygon([[55,45],[62,41],[66,48],[58,52]],p.secondary);line(56,52,44,65,p.accent,2);
  rect(16,63,45,5,p.primary,2);rect(24,60,27,2,c.paper,1);ellipse(72,44,9,9,p.primary);ellipse(72,44,5,5,p.accent);
  polygon([[71,51],[79,51],[87,72],[75,85],[65,85],[76,70]],p.primary);rect(23,84,65,6,p.primary,3);rect(29,81,27,3,p.secondary,1);
  ellipse(23,30,10,10,c.paper,p.secondary);ellipse(23,30,4,4,p.accent);[16,28].forEach(v=>ellipse(v,27,1,1,p.primary));line(26,40,34,52,p.secondary,.8);
 } else if(kind==='planet') {
  ellipse(49,48,29,29,p.primary);polygon([[27,35],[39,24],[48,27],[44,39],[34,45]],p.secondary);polygon([[54,48],[69,46],[73,56],[64,72],[55,68]],p.accent);
  polygon([[30,57],[38,56],[45,66],[38,70]],p.secondary);line(8,70,90,30,p.accent,5);line(9,67,30,57,c.paper,1.4);
  ellipse(78,17,8,8,c.accentTint);ellipse(80,15,3,3,p.accent);star(18,21,5);star(88,76,5);
 } else if(kind==='computer') {
  rect(10,16,80,53,p.primary,5);rect(15,21,70,41,c.secondaryTint,2);rect(15,21,70,7,p.secondary,2);
  [21,27,33].forEach(v=>ellipse(v,24,1.5,1.5,c.paper));line(39,36,29,43,p.primary,2);line(29,43,39,50,p.primary,2);line(59,36,69,43,p.primary,2);line(69,43,59,50,p.primary,2);line(54,33,46,54,p.accent,2);
  rect(45,69,11,11,p.primary);polygon([[29,80],[71,80],[80,87],[20,87]],p.secondary);rect(68,73,19,12,p.primary,3);line(78,75,78,79,c.paper,1);
 } else if(kind==='pencil') {
  polygon([[19,76],[59,15],[79,29],[39,88]],p.primary);polygon([[24,76],[61,19],[72,27],[35,82]],p.accent);line(31,78,68,24,c.paper,1.3);
  polygon([[19,76],[15,94],[39,88]],c.accentTint);polygon([[15,94],[18,84],[25,89]],p.primary);polygon([[59,15],[64,8],[84,22],[79,29]],p.secondary);
  line(46,81,85,81,c.edge,1);line(42,87,70,87,p.primary,1.5);rect(8,40,18,22,c.paper,2);line(12,47,21,47,p.secondary);line(12,54,21,54,p.secondary);
 } else if(kind==='balance') {
  line(50,20,50,83,p.primary,4);line(18,34,82,34,p.primary,3);ellipse(50,30,6,6,p.accent);rect(28,83,44,7,p.primary,3);rect(34,80,32,3,p.secondary,1);
  [18,82].forEach(v=>{line(v,34,v-13,62,p.secondary,1.5);line(v,34,v+13,62,p.secondary,1.5);polygon([[v-13,62],[v+13,62],[v+8,72],[v-8,72]],v===18?p.accent:p.secondary);});
  rect(10,51,16,11,p.primary,2);ellipse(81,53,8,9,p.accent);line(35,12,44,12,p.secondary);star(73,14,4);
 } else if(kind==='flask') {
  polygon([[38,12],[62,12],[62,40],[85,80],[79,89],[21,89],[15,80],[38,40]],p.primary);polygon([[43,19],[57,19],[57,43],[78,79],[74,83],[26,83],[22,79],[43,43]],c.paper);
  polygon([[32,61],[67,61],[78,79],[74,83],[26,83],[22,79]],p.secondary);rect(35,10,30,7,p.accent,2);
  ellipse(43,74,4,4,c.paper);ellipse(60,66,3,3,c.accentTint);ellipse(51,51,3,3,p.accent);ellipse(56,36,2,2,p.secondary);line(28,71,34,59,c.paper,2);
 } else {
  rect(10,51,31,30,p.primary,2);rect(14,55,23,22,p.secondary,1);line(14,55,37,77,c.paper,.8);line(37,55,14,77,c.paper,.8);
  ellipse(68,31,21,21,p.accent);ellipse(63,26,7,7,c.accentTint);polygon([[48,82],[74,47],[96,82]],p.secondary);polygon([[57,78],[74,56],[89,78]],c.paper);
  rect(8,38,23,6,p.accent,1);[11,16,21,26].forEach(v=>line(v,39,v,42,p.primary,.6));line(5,87,96,87,p.primary);
 }
 return n;
}
