"use client";
import React, { useState } from "react";
import type { ImageTreatment } from "../../editor/educational/imageTreatment";
import { imageFilter } from "../../editor/educational/imageTreatment";
import { readPublicationImage } from "../../editor/educational/imageAssets";
import { generateBackgroundRemovalMask } from "../../editor/pixel/selectionEngine";
import { useUiStore } from "../../editor/stores/uiStore";

type ImageSettings = ImageTreatment & { src?: string; alt?: string; focalX?: number; focalY?: number; scale?: number; opacity?: number; rawWidthPx?: number; rawHeightPx?: number; originalSrc?: string; maskDataUrl?: string };
export function ImageControls({ value, onChange }: { value: ImageSettings; onChange: (patch: Partial<ImageSettings>) => void }) {
  const [cutting, setCutting] = useState(false);
  async function removeBackground() {
    const source = value.originalSrc || value.src;
    if (!source || cutting) return;
    setCutting(true);
    try {
      const cut = await generateBackgroundRemovalMask(source);
      if (!cut.changed) {
        useUiStore.getState().showToast({ type: "warning", title: "Background stayed in place", message: "The subject and backdrop could not be separated cleanly." });
        return;
      }
      onChange({ src: cut.maskedPreviewUrl, originalSrc: value.originalSrc || value.src, maskDataUrl: cut.maskDataUrl });
      useUiStore.getState().showToast({ type: "success", title: "Background removed", message: "Subject edges were kept. Restore the original picture any time." });
    } catch (error) {
      useUiStore.getState().showToast({ type: "error", title: "Background not removed", message: error instanceof Error ? error.message : String(error) });
    } finally {
      setCutting(false);
    }
  }
  const slider = (key: "focalX" | "focalY" | "scale" | "opacity" | "radius" | "brightness" | "contrast" | "saturation", label: string, fallback: number, min: number, max: number, step = 1) => <label className="publication-field" key={key}><span className="flex justify-between">{label}<output>{Math.round((value[key] ?? fallback) * (max === 1 ? 100 : 1))}{max === 1 ? "%" : ""}</output></span><input type="range" min={min} max={max} step={step} value={value[key] ?? fallback} onChange={e => onChange({[key]:Number(e.target.value)})}/></label>;
  return <div className="image-workbench space-y-3">
    {value.src && <div className="image-workbench-preview"><img src={value.src} alt={value.alt || "Image preview"} style={{filter:imageFilter(value),transform:`scale(${value.flipX?-1:1},${value.flipY?-1:1})`}}/></div>}
    <label className="publication-button block text-center cursor-pointer">Replace image<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={async e => { const file=e.target.files?.[0];e.target.value="";if(!file)return;try{onChange({...await readPublicationImage(file),alt:file.name,focalX:.5,focalY:.5,scale:1,originalSrc:undefined,maskDataUrl:undefined});}catch(error){useUiStore.getState().showToast({type:"error",title:"Image not replaced",message:String(error)});} }}/></label>
    <button type="button" className="publication-button w-full disabled:opacity-50" disabled={!value.src || cutting} onClick={() => void removeBackground()}>{cutting ? "Tracing subject edges…" : "Remove background"}</button>
    {value.originalSrc && value.originalSrc !== value.src && <button type="button" className="publication-button w-full" onClick={() => onChange({ src: value.originalSrc, maskDataUrl: undefined })}>Restore original picture</button>}
    <label className="publication-field">Image description<input value={value.alt || ""} onChange={e => onChange({alt:e.target.value})}/></label>
    <label className="publication-field">Image frame shape<select value={value.mask || "rectangle"} onChange={e => onChange({ mask: e.target.value as ImageTreatment["mask"] })}>{["rectangle", "rounded", "circle", "arch", "blob", "wave", "organic", "custom"].map(mask => <option key={mask} value={mask}>{mask === "custom" ? "Custom SVG path" : mask}</option>)}</select></label>
    {value.mask === "custom" && <label className="publication-field">SVG path · 100 × 100 coordinates<textarea value={value.customMaskPath || ""} onChange={e => onChange({ customMaskPath: e.target.value })} placeholder="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></label>}
    <div className="grid grid-cols-2 gap-2">{(["cover","contain"] as const).map(fit => <button type="button" key={fit} className="publication-button" aria-pressed={(value.fit || "cover")===fit} onClick={() => onChange({fit})}>{fit==="cover"?"Fill frame":"Fit whole image"}</button>)}</div>
    <div className="grid grid-cols-2 gap-2"><button type="button" className="publication-button" aria-pressed={!!value.flipX} onClick={() => onChange({flipX:!value.flipX})}>Flip horizontal</button><button type="button" className="publication-button" aria-pressed={!!value.flipY} onClick={() => onChange({flipY:!value.flipY})}>Flip vertical</button></div>
    {slider("focalX","Focus · horizontal",.5,0,1,.01)}{slider("focalY","Focus · vertical",.5,0,1,.01)}{slider("scale","Crop zoom",1,1,3,.05)}{slider("radius","Frame corners · pt",0,0,48)}{slider("opacity","Opacity",1,0,1,.05)}
    <details><summary className="text-xs cursor-pointer text-slate-300">Light & colour</summary><div className="space-y-2 pt-3">{slider("brightness","Brightness",100,40,160)}{slider("contrast","Contrast",100,40,160)}{slider("saturation","Saturation",100,0,180)}<div className="grid grid-cols-2 gap-2"><button type="button" className="publication-button" onClick={()=>onChange({brightness:105,contrast:108,saturation:112})}>Vivid</button><button type="button" className="publication-button" onClick={()=>onChange({brightness:100,contrast:105,saturation:0})}>Monochrome</button></div></div></details>
    <button type="button" className="publication-button w-full" onClick={()=>onChange({mask:"rectangle",customMaskPath:undefined,focalX:.5,focalY:.5,scale:1,fit:"cover",flipX:false,flipY:false,radius:0,opacity:1,brightness:100,contrast:100,saturation:100})}>Reset image adjustments</button>
  </div>;
}
