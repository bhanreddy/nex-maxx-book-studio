import type { Book, PageDefinition } from "../../domain/book/types";
import { DEFAULT_BLEED, DEFAULT_PRINT_MARGINS, STANDARD_PAGE_SIZES } from "../../domain/book/types";
import type { PageElement } from "../../domain/element/types";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { createSmartBlockInstance } from "./blockRegistry";
import { buildPublicationScene } from "./publicationScene";
export const PUBLICATION_PAGES = [
  {id:"signature-discovery",name:"The discovery journal",description:"Botanical field guide and learning targets · any subject",blocks:["atelier-field-guide","atelier-discovery-deck"]},
  {id:"signature-story",name:"The storyteller's studio",description:"A colourful story ribbon and a quiet editorial reading page",blocks:["atelier-story-ribbon","atelier-editorial-folio"]},
  {id:"signature-workshop",name:"The maker's workshop",description:"Hands-on paper cards and a connected learning trail",blocks:["atelier-workshop-board","atelier-learning-trail"]},
  {id:"signature-wonder",name:"A world of curiosity",description:"A question spotlight and a passport for collected discoveries",blocks:["atelier-question-theatre","atelier-curiosity-passport"]},
  {id:"chapter",name:"A world of numbers",description:"Unit masthead, lesson map and promise banner",blocks:["atelier-unit-masthead","atelier-constellation-map","atelier-promise-banner"]},
  {id:"compact",name:"The learning journey",description:"Panorama gate with compact outcome cards",blocks:["atelier-panorama-gate","atelier-i-can-cards"]},
  {id:"warmup",name:"Ready to explore",description:"Place stack and a study-skills panel",blocks:["atelier-place-stack","atelier-strategy-panel"]},
  {id:"concept",name:"A place for every digit",description:"Concept lens and the place chart",blocks:["atelier-lens-split","atelier-place-chart"]},
  {id:"worked",name:"Follow the reasoning",description:"Speech example and a step ladder",blocks:["atelier-speech-example","atelier-guided-ladder"]},
  {id:"visual",name:"Build a number",description:"Bead theatre and expanded place chart",blocks:["atelier-bead-theatre","atelier-place-chart"]},
  {id:"activity",name:"Discover by doing",description:"Maker's bench and a reflection journal",blocks:["atelier-makers-bench","atelier-journal"]},
  {id:"checkpoint",name:"A moment to check",description:"Lightning lane and a pulse check",blocks:["atelier-lightning-lane","atelier-pulse-check"]},
  {id:"practice",name:"Practice with purpose",description:"Practice path and an order ladder",blocks:["atelier-practice-path","atelier-order-ladder"]},
  {id:"project",name:"Make something meaningful",description:"Project brief and a progress journal",blocks:["atelier-project-brief","atelier-progress-journal"]},
  {id:"reading",name:"Read between the lines",description:"Reading journal and word tiles",blocks:["atelier-reading-journal","atelier-word-tiles"]},
  {id:"revision",name:"Bring it all together",description:"Big picture and reflection",blocks:["atelier-big-picture","atelier-journal"]},
  {id:"assessment",name:"Show your understanding",description:"Assessment with an exit slip",blocks:["atelier-show-what-you-know","atelier-exit-slip"]},
] as const;
export function makePublicationElement(presetId:string,pageId:string,width:number,x=42,y=36,content?:Partial<SmartBlockInstance["semanticContent"]>):PageElement {
  const b=createSmartBlockInstance(presetId,pageId,x,y);
  if(!b)throw new Error(`Unknown educational template: ${presetId}`);
  const atelier=presetId.startsWith("atelier-");
  if(!atelier) {
    b.family = "nex-spectrum";
    // Colour marks recurring teaching roles, while the same typography ties the book together.
    const rolePalettes: Record<string,string> = {"learning-outcomes":"forest","warm-up":"plum","study-skills":"ink","concept-explanation":"ocean","place-value":"ocean","abacus":"ocean","worked-examples":"cobalt","guided-practice":"cobalt","mental-maths":"plum","quick-check":"indigo","activity-lab":"forest","investigation":"forest","reflection":"ink","reading-response":"ink","vocabulary":"plum","assessment-mastery":"cobalt"};
    b.styleOverrides={...b.styleOverrides,paletteId:rolePalettes[b.archetypeId]||"indigo"};
  }
  b.transform={...b.transform,width,height:0};b.semanticContent={...b.semanticContent,...content};
  b.transform.height=buildPublicationScene(b).height;
  return {id:b.id,pageId,type:"smart-block",category:"educational",version:2,displayName:b.semanticContent.title,transform:{...b.transform},style:{},presetId,smartBlockData:b,content:{},locked:false,hidden:false};
}
export function makePublicationPages(templateId:string,book:Pick<Book,"dimensions"|"margins">,offset=0):{pages:PageDefinition[];elements:Record<string,PageElement>} {
  const template=PUBLICATION_PAGES.find(t=>t.id===templateId)||PUBLICATION_PAGES[0];
  const elements:Record<string,PageElement>={},pages:PageDefinition[]=[];
  const width=book.dimensions.widthPt-book.margins.insidePt-book.margins.outsidePt;
  let y=book.margins.topPt;
  const addPage=()=>{const p:PageDefinition={id:crypto.randomUUID(),pageIndex:offset+pages.length,displayNumber:String(offset+pages.length+1),elementIds:[],status:"Design",templateId:`publication-${template.id}`};pages.push(p);y=book.margins.topPt;return p;};
  let page=addPage();
  for(const key of template.blocks) {
    let el=makePublicationElement(key.startsWith("atelier-")||key.startsWith("studio-")?key:`studio-${key}`,page.id,width,page.pageIndex%2===0?book.margins.insidePt:book.margins.outsidePt,y);
    if(y+el.transform.height>book.dimensions.heightPt-book.margins.bottomPt && page.elementIds.length) {page=addPage();el=makePublicationElement(key.startsWith("atelier-")||key.startsWith("studio-")?key:`studio-${key}`,page.id,width,page.pageIndex%2===0?book.margins.insidePt:book.margins.outsidePt,y);}
    el.transform.zIndex=page.elementIds.length+1;el.smartBlockData!.transform={...el.transform};elements[el.id]=el;page.elementIds.push(el.id);y+=el.transform.height+14;
  }
  return {pages,elements};
}
export function makePublicationDemo():{book:Book;elements:Record<string,PageElement>} {
  const now=new Date().toISOString();
  const book:Book={id:crypto.randomUUID(),title:"Large Numbers",subtitle:"Patterns, place value & possibilities",grade:"Grade 4",subject:"Mathematics",language:"English",academicYear:"2026–27",type:"Textbook",orientation:"portrait",pageSize:"A4",dimensions:STANDARD_PAGE_SIZES.A4,margins:DEFAULT_PRINT_MARGINS,bleed:DEFAULT_BLEED,bindingType:"Perfect Bound",spineWidthPt:0,themeId:"math",units:[],chapters:[],pages:[],masterPages:[],createdAt:now,updatedAt:now,version:2,status:"Design"};
  const elements:Record<string,PageElement>={};
  // Eight chapter sections, plus reading and science samples. Continuations are explicit pages.
  for(const id of ["chapter","warmup","concept","visual","worked","checkpoint","activity","practice","revision","assessment","reading"]) {const result=makePublicationPages(id,book,book.pages.length);book.pages.push(...result.pages);Object.assign(elements,result.elements);}
  const science:PageDefinition={id:crypto.randomUUID(),pageIndex:book.pages.length,displayNumber:String(book.pages.length+1),status:"Design",elementIds:[],notes:"Cross-subject sample: science investigation"};
  const el=makePublicationElement("atelier-field-notes",science.id,517,42,36,{title:"Which material absorbs more water?",subtitle:"A fair-test investigation",materials:["Equal-size paper and cloth samples","Water","Spoon","Tray"],steps:[{stepNumber:1,title:"Predict",body:"Which material do you think will absorb more water? Explain."},{stepNumber:2,title:"Test fairly",body:"Use equal-size samples. Add the same amount of water to each sample over a tray."},{stepNumber:3,title:"Observe",body:"Record the water absorbed and remaining. Repeat your test."},{stepNumber:4,title:"Explain",body:"Use your observations to compare the materials."}],footnote:"Wipe up spills. Ask an adult to help prepare the materials."});
  el.smartBlockData!.family="nex-discovery";el.smartBlockData!.subject="science";el.transform.height=buildPublicationScene(el.smartBlockData!).height;science.elementIds.push(el.id);elements[el.id]=el;book.pages.push(science);
  const unitId=crypto.randomUUID(),chapterId=crypto.randomUUID();book.units=[{id:unitId,number:1,title:"Number sense",chapterIds:[chapterId]}];book.chapters=[{id:chapterId,unitId,number:1,title:"Large Numbers",learningObjectives:["Read and write six-digit numbers","Explain and represent place value"],pageIds:book.pages.slice(0,-2).map(p=>p.id)}];
  return {book,elements};
}
