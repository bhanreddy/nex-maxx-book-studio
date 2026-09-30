"use client";
import { readPublicationImage } from "../../editor/educational/imageAssets";
import { ImageControls } from "./ImageControls";
import React, { useState } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import type { PageElement } from "../../domain/element/types";
import type { BlockMotif, DesignFamily, GradeBand } from "../../domain/educational/blockSchema";
import { COLLECTIONS, PUBLICATION_PALETTES, PALETTE_INTENT } from "../../domain/educational/designTokens";
import { getPresetsByArchetype, EDUCATIONAL_BLOCK_REGISTRY } from "../../editor/educational/blockRegistry";
import { SIGNATURE_LAYOUTS } from "../../editor/educational/atelier/skins/signature";
import { ARTWORKS, buildPublicationScene } from "../../editor/educational/publicationScene";
import { meetsAa } from "../../editor/design/contrast";

export { readPublicationImage } from "../../editor/educational/imageAssets";
function Field({label,children}:{label:string;children:React.ReactNode}) {return <label className="publication-field">{label}{children}</label>;}
export function PublicationInspector({element}:{element:PageElement}) {
  const store=useEditorStore(),b=element.smartBlockData!,c=b.semanticContent,o=b.styleOverrides;
  const [tab,setTab]=useState<"content"|"design">("content");
  const [presetName,setPresetName]=useState("");
  const content=(patch:Partial<typeof c>)=>store.updateSmartBlockContent(element.id,patch);
  const design=(patch:Partial<typeof o>)=>store.updateSmartBlockStyle(element.id,patch);
  const variants=getPresetsByArchetype(b.archetypeId);
  const book=store.getActiveBook();
  const overflow=book && element.transform.y+buildPublicationScene({...b,transform:element.transform}).height>book.dimensions.heightPt-book.margins.bottomPt;
  const collisions=store.getActivePageElements().some(other=>other.id!==element.id&&other.category!=="decorative"&&!other.hidden&&element.transform.x<other.transform.x+other.transform.width&&element.transform.x+element.transform.width>other.transform.x&&element.transform.y<other.transform.y+other.transform.height&&element.transform.y+element.transform.height>other.transform.y);
  return <section className="rounded-xl border border-slate-600 bg-slate-900 p-3 space-y-3">
    <div className="text-[10px] text-amber-200 tracking-wider uppercase">Publication studio</div>
    <div className="flex gap-2">{(["content","design"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`publication-button flex-1 capitalize ${tab===t?"!border-amber-200 !text-amber-100":""}`}>{t}</button>)}</div>
    {(overflow||collisions)&&<p role="status" className="text-xs text-amber-200 bg-amber-950/40 p-2 rounded">{overflow?"This block extends into the bottom margin. Move it to another page or shorten the content.":"This block overlaps another content block. Move it or adjust the layout."} Text has not been reduced or removed.</p>}
    {tab==="content"?<fieldset disabled={b.isLockedContent||element.locked} className="space-y-2">
      <Field label="Title"><input value={c.title} onChange={e=>content({title:e.target.value})}/></Field>
      <Field label="Unit label"><input value={c.unitBadge||""} onChange={e=>content({unitBadge:e.target.value})}/></Field>
      <Field label="Subtitle / prompt"><textarea value={c.subtitle||""} onChange={e=>content({subtitle:e.target.value})}/></Field>
      <Field label="Introduction"><textarea value={c.introText||""} onChange={e=>content({introText:e.target.value})}/></Field>
      <Field label="Key idea / map centre"><textarea value={c.calloutText||""} onChange={e=>content({calloutText:e.target.value})}/></Field>
      {c.chapterNumber!==undefined&&<Field label="Chapter number"><input value={c.chapterNumber} onChange={e=>content({chapterNumber:e.target.value})}/></Field>}
      {c.numberValue!==undefined&&<><Field label="Number (0–999,999,999)"><input type="number" min={0} max={999999999} value={c.numberValue} onChange={e=>content({numberValue:Math.max(0,Math.min(999999999,Math.floor(Number(e.target.value))))})}/></Field><Field label="Number system"><select value={c.numberSystem||"indian"} onChange={e=>content({numberSystem:e.target.value as "indian"|"international"})}><option value="indian">Indian · 3,25,146</option><option value="international">International · 325,146</option></select></Field></>}
      {c.passage!==undefined&&<Field label="Reading passage"><textarea rows={6} value={c.passage} onChange={e=>content({passage:e.target.value})}/></Field>}
      {(c.items||(!c.steps&&!c.questions&&c.numberValue===undefined))&&<Field label="Items — one per line"><textarea rows={6} value={(c.items||[]).join("\n")} onChange={e=>content({items:e.target.value.split("\n")})}/></Field>}
      {c.materials&&<Field label="Materials — one per line"><textarea value={c.materials.join("\n")} onChange={e=>content({materials:e.target.value.split("\n")})}/></Field>}
      {c.steps&&<div className="space-y-3">{c.steps.map((step,i)=><div key={i} className="border-l-2 border-teal-700 pl-2"><Field label={`Step ${step.stepNumber} title`}><input value={step.title} onChange={e=>content({steps:c.steps!.map((s,k)=>k===i?{...s,title:e.target.value}:s)})}/></Field><Field label="Instruction"><textarea value={step.body} onChange={e=>content({steps:c.steps!.map((s,k)=>k===i?{...s,body:e.target.value}:s)})}/></Field><button className="text-xs text-rose-300" onClick={()=>content({steps:c.steps!.filter((_,k)=>k!==i).map((s,k)=>({...s,stepNumber:k+1}))})}>Remove step</button></div>)}<button className="publication-button w-full" onClick={()=>content({steps:[...c.steps!,{stepNumber:c.steps!.length+1,title:"New step",body:"Describe the next step."}]})}>Add step</button></div>}
      {c.questions&&<div className="space-y-3">{c.questions.map((q,i)=><div key={i} className="border-l-2 border-indigo-500 pl-2"><Field label={`Question ${i+1}`}><textarea value={q.prompt} onChange={e=>content({questions:c.questions!.map((s,k)=>k===i?{...s,prompt:e.target.value}:s)})}/></Field><Field label="Options — one per line (optional)"><textarea value={(q.options||[]).join("\n")} onChange={e=>content({questions:c.questions!.map((s,k)=>k===i?{...s,options:e.target.value?e.target.value.split("\n"):[]}:s)})}/></Field><Field label="Teacher answer — excluded from student pages"><textarea value={q.answer||""} onChange={e=>content({questions:c.questions!.map((s,k)=>k===i?{...s,answer:e.target.value}:s)})}/></Field><button className="text-xs text-rose-300" onClick={()=>content({questions:c.questions!.filter((_,k)=>k!==i)})}>Remove question</button></div>)}<button className="publication-button w-full" onClick={()=>content({questions:[...c.questions!,{prompt:"Write your question here."}]})}>Add question</button></div>}
      <Field label="Footer / reflection prompt"><textarea value={c.footnote||""} onChange={e=>content({footnote:e.target.value})}/></Field>
      {b.archetypeId==="ai-explore"&&<Field label="Verified resource URL (printed as text)"><input value={c.qrUrl||""} onChange={e=>content({qrUrl:e.target.value})}/></Field>}
    </fieldset>:<fieldset disabled={b.isLockedDesign||element.locked} className="space-y-3 min-w-0">
      {b.presetId.startsWith("atelier-") && <Field label="Composition — your content stays editable">
        <select value={o.layoutVariant || ""} onChange={e => design({layoutVariant:e.target.value || undefined})}>
          <option value="">Original template composition</option>
          {SIGNATURE_LAYOUTS.map(layout => <option key={layout.id} value={layout.id}>{layout.name}</option>)}
        </select>
        {(() => {
          const skinId = EDUCATIONAL_BLOCK_REGISTRY[b.presetId]?.skinId || b.presetId;
          const currentLayout = SIGNATURE_LAYOUTS.find(l => l.id === (o.layoutVariant || skinId.replace("atelier-","")));
          return currentLayout ? <p className="text-[11px] text-slate-400 mt-1 leading-snug">{currentLayout.description}</p> : null;
        })()}
      </Field>}
      <Field label="Reading size"><input type="range" min="1" max="1.5" step=".05" value={o.fontSizeScale || 1} onChange={e => design({fontSizeScale:Number(e.target.value)})}/></Field>
      {/* Detach Block into Canvas Elements */}
      <button
        type="button"
        disabled={b.isLockedContent}
        onClick={() => store.detachEducationalBlock(element.id)}
        className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        title="Explode into individual editable canvas elements (shapes, text frames, images)"
      >
        <span>✂️ Detach into Canvas Elements</span>
      </button>

      <Field label="Look — preserves all content"><select value={b.presetId} onChange={e=>store.setEducationalBlockPreset(element.id,e.target.value)}>{variants.some(v=>v.skinId)&&<optgroup label="Atelier">{variants.filter(v=>v.skinId).map(v=><option value={v.id} key={v.id}>{v.name}</option>)}</optgroup>}<optgroup label="Earlier layouts">{variants.filter(v=>!v.skinId).map(v=><option value={v.id} key={v.id}>{v.name}</option>)}</optgroup></select></Field>
      <Field label="Collection"><select value={b.family} onChange={e=>{const next={...b,family:e.target.value as DesignFamily,transform:{...element.transform,height:0}};store.updateElement(element.id,{smartBlockData:next,transform:{...element.transform,height:buildPublicationScene(next).height}});}}>{Object.entries(COLLECTIONS).map(([id,col])=><option key={id} value={id}>{col.name}</option>)}</select></Field>
      <Field label="Grade / reading size"><select value={b.gradeBand} onChange={e=>{const next={...b,gradeBand:e.target.value as GradeBand,transform:{...element.transform,height:0}};store.updateElement(element.id,{smartBlockData:next,transform:{...element.transform,height:buildPublicationScene(next).height}});}}><option value="early-years">Early years</option><option value="primary-lower">Grades 1–2</option><option value="primary-upper">Grades 3–5</option><option value="middle-school">Grades 6–8</option><option value="secondary-plus">Grades 9+</option></select></Field>
      <Field label="Colour palette"><select value={o.paletteId||""} onChange={e=>design({paletteId:e.target.value||undefined,customPalette:undefined})}><option value="">Inherit from collection</option>{Object.entries(PUBLICATION_PALETTES).map(([id,p])=><option key={id} value={id}>{p.name}</option>)}</select></Field>
      <div className="flex gap-2">{Object.entries(PUBLICATION_PALETTES).map(([id,p])=><button key={id} title={p.name} aria-label={`Use ${p.name}`} onClick={()=>design({paletteId:id,customPalette:undefined})} className="w-8 h-8 rounded-full border-2 border-white/40" style={{background:`linear-gradient(135deg,${p.primary} 50%,${p.accent} 50%)`}}/>)}</div>
      <p className="text-[11px] leading-relaxed text-slate-400">{PALETTE_INTENT[(o.paletteId||COLLECTIONS[b.family].paletteId) as keyof typeof PALETTE_INTENT]}</p>
      <details><summary className="text-xs text-slate-300 cursor-pointer">Custom colours</summary><div className="grid grid-cols-2 gap-2 pt-3">{(["primary","accent","surface","text"] as const).map(key=><Field key={key} label={key}><input type="color" value={o.customPalette?.[key]||PUBLICATION_PALETTES[(o.paletteId||COLLECTIONS[b.family].paletteId) as keyof typeof PUBLICATION_PALETTES]?.[key]||"#25374a"} onChange={e=>design({customPalette:{...o.customPalette,[key]:e.target.value}})}/></Field>)}</div>{(()=>{const pal={...PUBLICATION_PALETTES[(o.paletteId||COLLECTIONS[b.family].paletteId) as keyof typeof PUBLICATION_PALETTES],...(o.customPalette||{})};return !meetsAa(pal.text,pal.surface)?<p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded mt-2">⚠️ Low contrast between text and surface colours. Review print readability or choose a darker text or lighter surface.</p>:null;})()}</details>
      <Field label="Print treatment"><select value={o.printMode||"colour"} onChange={e=>design({printMode:e.target.value as typeof o.printMode})}><option value="colour">Full colour</option><option value="reduced-ink">Reduced ink</option><option value="grayscale">Grayscale proof</option></select></Field>
      <Field label={`Writing line spacing · ${o.answerSpacePt??26} pt`}><input type="range" min="16" max="50" value={o.answerSpacePt??26} onChange={e=>design({answerSpacePt:Number(e.target.value)})}/></Field>
      <Field label="Corner radius"><input type="range" min="0" max="24" value={o.cornerRadiusPt??10} onChange={e=>design({cornerRadiusPt:Number(e.target.value)})}/></Field>
      <Field label="Illustration"><select value={o.illustration||"none"} onChange={e=>design({illustration:e.target.value as typeof o.illustration})}><option value="none">None / quiet</option><option value="number-city">Number neighbourhood</option><option value="botanical">Botanical study</option><option value="geometry">Shape composition</option></select></Field>
      <Field label="Background treatment"><select value={o.backgroundSpec?.type||"subtle-tint"} onChange={e=>design({backgroundSpec:{...o.backgroundSpec,type:e.target.value as "subtle-tint"|"gradient",gradient:e.target.value==="gradient"?{from:"#FFFFFF",to:PUBLICATION_PALETTES[(o.paletteId||COLLECTIONS[b.family].paletteId) as keyof typeof PUBLICATION_PALETTES].surface,directionDeg:90}:undefined}})}><option value="subtle-tint">Quiet tint</option><option value="gradient">Soft tonal gradient</option></select></Field>
      <Field label="Background pattern"><select value={o.backgroundSpec?.patternOverlay||"none"} onChange={e=>design({backgroundSpec:{...o.backgroundSpec,patternOverlay:e.target.value as "none"|"dots"|"grid"|"waves"|"isometric"}})}><option value="none">None</option><option value="dots">Quiet dots</option><option value="grid">Graph grid</option><option value="waves">Gentle waves</option><option value="isometric">Perspective grid</option></select></Field>
      <Field label="Background image — reading surface protected"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const asset=await readPublicationImage(f);design({backgroundImage:{...asset,alt:f.name,focalX:.5,focalY:.5,opacity:.5,scale:1}});}catch(err){useUiStore.getState().showToast({type:"error",title:"Image not added",message:String(err)});}}}/></Field>
      {o.backgroundImage&&<><Field label="Background image opacity"><input type="range" min="0" max="1" step=".05" value={o.backgroundImage.opacity} onChange={e=>design({backgroundImage:{...o.backgroundImage!,opacity:Number(e.target.value)}})}/></Field>{(["focalX","focalY"] as const).map((axis,i)=><Field key={axis} label={`Image focal point · ${i === 0 ? "horizontal" : "vertical"}`}><input type="range" min="0" max="1" step=".01" value={o.backgroundImage![axis]} onChange={e=>design({backgroundImage:{...o.backgroundImage!,[axis]:Number(e.target.value)}})}/></Field>)}<Field label="Image crop zoom"><input type="range" min="1" max="3" step=".05" value={o.backgroundImage.scale} onChange={e=>design({backgroundImage:{...o.backgroundImage!,scale:Number(e.target.value)}})}/></Field><button className="publication-button" onClick={()=>design({backgroundImage:undefined})}>Remove background image</button></>}
      {b.presetId.startsWith("atelier-")&&<div className="space-y-2 border-t border-slate-700 pt-3"><div className="text-[10px] uppercase tracking-wider text-amber-200">Plates</div><p className="text-[11px] text-slate-400">Drag a plate on the page to move it. These controls are the precise fallback.</p><Field label="Add vector scenery"><select value="" onChange={e=>{const kind=e.target.value;if(!kind)return;const motif:BlockMotif={id:`plate-${kind}-${(o.motifs||[]).length}`,role:"illustration",kind,x:element.transform.width-130,y:24,w:112,h:68,rotation:0,locked:false,opacity:.8,nudged:true,originWidth:element.transform.width,behind:true};design({motifs:[...(o.motifs||[]),motif]});}}><option value="">Choose scenery</option>{ARTWORKS.map(art=><option key={art.id} value={art.id}>{art.name}</option>)}</select></Field><Field label="Upload a photo plate"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const asset=await readPublicationImage(f);const motif:BlockMotif={id:`photo-${(o.motifs||[]).length}`,role:"photo",kind:"custom-image",x:18,y:buildPublicationScene({...b,transform:element.transform}).height+12,w:Math.min(180,element.transform.width-36),h:100,rotation:0,locked:false,opacity:1,nudged:true,originWidth:element.transform.width,behind:false,src:asset.src,alt:f.name,focalX:.5,focalY:.5,scale:1,rawWidthPx:asset.rawWidthPx,rawHeightPx:asset.rawHeightPx};design({motifs:[...(o.motifs||[]),motif]});}catch(err){useUiStore.getState().showToast({type:"error",title:"Image not added",message:String(err)});}}}/></Field>{(o.motifs||[]).filter(m=>m.role==="plate"||m.role==="photo"||m.role==="illustration").map(motif=><div key={motif.id} className="space-y-1 border border-slate-700 rounded p-2"><div className="text-[11px] text-slate-200">{motif.alt||motif.kind}</div><Field label="Opacity"><input type="range" min="0" max="1" step=".05" value={motif.opacity} onChange={e=>design({motifs:(o.motifs||[]).map(item=>item.id===motif.id?{...item,opacity:Number(e.target.value)}:item)})}/></Field>{motif.role==="photo"&&<ImageControls value={motif} onChange={patch=>design({motifs:(o.motifs||[]).map(item=>item.id===motif.id?{...item,...patch}:item)})}/>}<div className="grid grid-cols-2 gap-2">{(["x","y","w","h"] as const).map(key=><Field key={key} label={{x:"X · pt",y:"Y · pt",w:"Width · pt",h:"Height · pt"}[key]}><input type="number" min={key==="w"||key==="h"?20:0} value={Math.round(motif[key])} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value))design({motifs:(o.motifs||[]).map(item=>item.id===motif.id?{...item,[key]:Math.max(key==="w"||key==="h"?20:0,value),nudged:true}:item)})}}/></Field>)}</div><Field label="Layer placement"><select value={motif.behind===false?"front":"behind"} onChange={e=>design({motifs:(o.motifs||[]).map(item=>item.id===motif.id?{...item,behind:e.target.value==="behind"}:item)})}><option value="behind">Behind reading area</option><option value="front">In front · full visibility</option></select></Field><label className="text-[11px] text-slate-300"><input type="checkbox" checked={motif.locked} onChange={e=>design({motifs:(o.motifs||[]).map(item=>item.id===motif.id?{...item,locked:e.target.checked}:item)})}/> Lock plate</label><button className="publication-button w-full" onClick={()=>design({motifs:(o.motifs||[]).filter(item=>item.id!==motif.id)})}>Remove plate</button></div>)}</div>}
      <button className="publication-button w-full" onClick={()=>{const block={...b,transform:{...element.transform,height:0},styleOverrides:{}};store.updateElement(element.id,{smartBlockData:block,transform:{...element.transform,height:buildPublicationScene(block).height}});}}>Reset to collection defaults</button>
    </fieldset>}
    <details className="border-t border-slate-700 pt-3"><summary className="text-xs text-amber-100 cursor-pointer">Save as a reusable template</summary><Field label="Template name"><input value={presetName} placeholder={c.title} onChange={e=>setPresetName(e.target.value)}/></Field><button className="publication-button w-full" onClick={()=>store.savePublicationPreset(presetName||c.title,element.id)}>Save to My templates</button></details>
    <div className="flex flex-wrap gap-3 text-[11px] text-slate-300 border-t border-slate-700 pt-3"><label><input type="checkbox" checked={b.isLockedContent} onChange={e=>store.updateElement(element.id,{smartBlockData:{...b,isLockedContent:e.target.checked}})}/> Lock content</label><label><input type="checkbox" checked={b.isLockedDesign} onChange={e=>store.updateElement(element.id,{smartBlockData:{...b,isLockedDesign:e.target.checked}})}/> Lock design</label></div>
  </section>;
}
export function ArtworkInspector({element}:{element:PageElement}) {
  const s=useEditorStore(),art=element.content.artwork;
  const update=(content:PageElement["content"])=>s.updateElement(element.id,{content:{...element.content,...content}});
  const isImage = element.type === "image" || element.type === "picture-frame" || element.type === "pictureFrame" || element.type === "ai-image" || Boolean(element.content.src || element.content.imageUrl || element.content.url);
  const currentSrc = element.content.src || element.content.imageUrl || element.content.url;

  return <section className="p-3 rounded-xl bg-slate-900 border border-slate-600 space-y-3">
    <div className="text-xs text-amber-200 font-semibold">{isImage ? "Image & plate studio" : "Artwork & background"}</div>
    {art&&<Field label="Artwork palette"><select value={art.paletteId} onChange={e=>update({artwork:{...art,paletteId:e.target.value}})}>{Object.entries(PUBLICATION_PALETTES).map(([id,p])=><option key={id} value={id}>{p.name}</option>)}</select></Field>}
    <Field label="Opacity"><input type="range" min="0" max="1" step=".05" value={element.style.opacity??1} onChange={e=>s.updateElement(element.id,{style:{...element.style,opacity:Number(e.target.value)}})}/></Field>
    <Field label="Scope"><select value={element.content.scope||"free"} onChange={e=>{const book=s.getActiveBook();if(!book)return;if(e.target.value==="page")s.updateElement(element.id,{locked:true,content:{...element.content,scope:"page",previousTransform:element.transform},transform:{x:0,y:0,width:book.dimensions.widthPt,height:book.dimensions.heightPt,rotation:0,zIndex:0}});else s.updateElement(element.id,{locked:false,content:{...element.content,scope:"free"},transform:element.content.previousTransform||{...element.transform,width:200,height:170,zIndex:1}});}}><option value="free">Free artwork · drag and resize</option><option value="page">Page background · locked</option></select></Field>
    <button className="publication-button w-full" onClick={()=>s.updateElement(element.id,{locked:!element.locked})}>{element.locked?"Unlock for positioning":"Lock position"}</button>
    
    {isImage && (
      currentSrc ? (
        <fieldset disabled={element.locked}>
          <ImageControls
            value={{
              ...element.content,
              src: currentSrc,
              alt: element.content.alt || element.content.imageAlt || element.content.caption,
              scale: element.content.cropScale || element.content.scale || 1,
              fit: element.style.objectFit === "contain" ? "contain" : "cover",
              radius: element.style.borderRadius,
              opacity: element.style.opacity,
            }}
            onChange={patch => {
              const { scale, fit, radius, opacity, ...image } = patch;
              s.updateElement(element.id, {
                content: {
                  ...element.content,
                  ...image,
                  ...(scale !== undefined ? { cropScale: scale, scale } : {}),
                },
                style: {
                  ...element.style,
                  ...(fit ? { objectFit: fit } : {}),
                  ...(radius !== undefined ? { borderRadius: radius } : {}),
                  ...(opacity !== undefined ? { opacity } : {}),
                },
              });
            }}
          />
        </fieldset>
      ) : (
        <fieldset disabled={element.locked} className="space-y-2">
          <label className="publication-button block text-center cursor-pointer">
            Upload image or illustration
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async e => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const asset = await readPublicationImage(f);
                  s.updateElement(element.id, {
                    content: {
                      ...element.content,
                      ...asset,
                      imageUrl: asset.src,
                      alt: f.name,
                      focalX: 0.5,
                      focalY: 0.5,
                      cropScale: 1,
                    },
                  });
                } catch (err) {
                  useUiStore.getState().showToast({
                    type: "error",
                    title: "Image upload failed",
                    message: String(err),
                  });
                }
              }}
            />
          </label>
        </fieldset>
      )
    )}
    <p className="text-[11px] text-slate-400">Use the canvas handles or the geometry controls below. Select locked artwork from the Layers panel.</p>
  </section>;
}
