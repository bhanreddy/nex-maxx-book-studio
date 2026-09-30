'use client';
import { useState } from 'react';
import type { ChapterSaveTarget } from '../../editor/persistence/chapterRepository';
interface Product { id:string;name:string }
interface Version { id:string;version_label:string;status:string }
interface Unit { id:string;title:string;chapters:Array<{id:string;title:string}> }
interface Offering { offering_id:string;standard_grade_level:string;canonical_subject_name:string;units:Unit[] }
async function api(path:string,body?:unknown) {
  const response=await fetch(`/api/curriculum/${path}`,{ cache:'no-store',...(body ? { method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body) } : {}) });
  const json=await response.json();
  if (!response.ok) throw new Error(json.error || 'Central library is unavailable');
  return json.data;
}
export function CentralChapterPicker({ title,onPick }:{title:string;onPick:(target:ChapterSaveTarget)=>void}) {
  const [products,setProducts]=useState<Product[]>([]),[versions,setVersions]=useState<Version[]>([]),[offerings,setOfferings]=useState<Offering[]>([]);
  const [productId,setProductId]=useState(''),[versionId,setVersionId]=useState(''),[unitId,setUnitId]=useState('');
  const [nextProducts,setNextProducts]=useState<number|null>(0),[nextVersions,setNextVersions]=useState<number|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const selected=versions.find(version=>version.id===versionId);
  const run=async(work:()=>Promise<void>)=>{setBusy(true);setError('');try{await work();}catch(caught){setError(caught instanceof Error ? caught.message : 'Central operation failed');}finally{setBusy(false);}};
  const loadProducts=async(offset=0)=>{
    const page=await api(`products?offset=${offset}`);setProducts(current=>offset ? [...current,...page.items] : page.items);setNextProducts(page.next_offset);
  };
  const loadVersions=async(id:string,offset=0)=>{
    const page=await api(`products/${id}/versions?offset=${offset}`);setVersions(current=>offset ? [...current,...page.items] : page.items);setNextVersions(page.next_offset);
  };
  const loadTree=async(id:string)=>{const tree=await api(`versions/${id}/tree`);setOfferings(tree.offerings);};
  return <div className="curriculum-cloud-picker">
    <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>loadProducts())}>Browse central curriculum</button>
    {!!products.length && <>
      <label className="curriculum-field">Curriculum<select disabled={busy} value={productId} onChange={event=>{
        const id=event.target.value;setProductId(id);setVersionId('');setVersions([]);setOfferings([]);setUnitId('');
        if(id) void run(()=>loadVersions(id));
      }}><option value="">Choose curriculum…</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
      {nextProducts!==null && <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>loadProducts(nextProducts))}>More curricula</button>}
      {!!versions.length && <label className="curriculum-field">Release<select disabled={busy} value={versionId} onChange={event=>{
        const id=event.target.value;setVersionId(id);setOfferings([]);setUnitId('');if(id) void run(()=>loadTree(id));
      }}><option value="">Choose release…</option>{versions.map(version=><option key={version.id} value={version.id}>{version.version_label} · {version.status}</option>)}</select></label>}
      {nextVersions!==null && <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(()=>loadVersions(productId,nextVersions))}>More releases</button>}
      {!!offerings.length && <label className="curriculum-field">Central chapter<select disabled={busy} defaultValue="" key={versionId} onChange={event=>{
        if(event.target.value) onPick({masterChapterId:event.target.value,curriculumVersionId:versionId});
      }}><option value="">Choose a chapter to reload…</option>{offerings.flatMap(offering=>offering.units.map(unit=><optgroup key={unit.id} label={`${offering.standard_grade_level} · ${offering.canonical_subject_name} · ${unit.title}`}>
        {unit.chapters.map(chapter=><option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
      </optgroup>))}</select></label>}
      {selected && ['DRAFT','CHANGES_REQUESTED'].includes(selected.status) && <>
        <label className="curriculum-field">Unit for a new chapter<select disabled={busy} value={unitId} onChange={event=>setUnitId(event.target.value)}><option value="">Choose a unit…</option>{offerings.flatMap(offering=>offering.units.map(unit=><option key={unit.id} value={unit.id}>{offering.standard_grade_level} · {offering.canonical_subject_name} · {unit.title}</option>))}</select></label>
        <button className="curriculum-secondary" disabled={busy || !unitId} onClick={()=>void run(async()=>{
          const chapter=await api(`units/${unitId}/chapters`,{code:`C-${crypto.randomUUID().slice(0,8)}`,title});
          onPick({masterChapterId:chapter.id,curriculumVersionId:versionId});await loadTree(versionId);
        })}>Create central chapter: {title}</button>
      </>}
      {selected && ['PUBLISHED','SUPERSEDED'].includes(selected.status) && <button className="curriculum-secondary" disabled={busy} onClick={()=>void run(async()=>{
        const draft=await api(`products/${productId}/versions`,{based_on_version_id:versionId,version_type:'MINOR'});
        await loadVersions(productId);setVersionId(draft.id);setUnitId('');await loadTree(draft.id);
      })}>Create next draft release</button>}
    </>}
    {error && <p className="curriculum-cloud-status is-error" role="alert">{error}</p>}
  </div>;
}
