"use client";

import React, { useEffect, useRef, useState } from "react";
import { Cloud, ImagePlus, RefreshCw, Search } from "lucide-react";
import { STARTER_PICTURES } from "../../editor/media/picturePresetCatalog";
import { listCloudPictures, pictureElement, uploadCloudPicture, type PictureAsset } from "../../editor/media/pictureRepository";
import { assetRenderUrl } from "../../editor/persistence/assetReferences";
import { ChapterRepositoryError } from "../../editor/persistence/chapterRepository";
import { useEditorStore } from "../../editor/stores/editorStore";

const field = "w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100";
// Share an in-flight seed when both sidebar entry points are opened during an upload.
let starterSync: Promise<PictureAsset[]> | undefined;
async function saveStarterPictures(progress: (message: string) => void) {
  if (starterSync) return starterSync;
  starterSync = (async () => {
    const saved: PictureAsset[] = [];
    let offset: number | null = 0;
    do { const page = await listCloudPictures("NEX Picture · ", offset); saved.push(...page.items); offset = page.next_offset; } while (offset !== null);
    for (const [index, picture] of STARTER_PICTURES.entries()) {
      if (saved.some(asset => asset.checksum === picture.checksum)) continue;
      progress(`Saving starter pictures ${index + 1} of ${STARTER_PICTURES.length}…`);
      const response = await fetch(picture.src, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Could not load ${picture.name}. Retry loading the library.`);
      saved.push(await uploadCloudPicture(new File([await response.blob()], `${picture.id}.png`, { type: "image/png" }), `NEX Picture · ${picture.name}`));
    }
    return saved;
  })().finally(() => { starterSync = undefined; });
  return starterSync;
}

export function PicturePresetLibrary() {
  const [assets, setAssets] = useState<PictureAsset[]>([]);
  const [offset, setOffset] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const operation = useRef(false);

  const reportError = (cause: unknown) => {
    const auth = cause instanceof ChapterRepositoryError && cause.status === 401;
    setNeedsLogin(auth);
    setError(auth ? "Sign in to save pictures to the cloud and load your library on other devices." : cause instanceof Error ? cause.message : "Cloud pictures could not be saved. Retry with the same file.");
  };
  async function load(nextOffset = 0, seed = true) {
    if (operation.current) return;
    operation.current = true; setBusy(true); setError(""); setMessage("Loading cloud pictures…");
    try {
      let result = await listCloudPictures(search, nextOffset);
      setNeedsLogin(false);
      if (nextOffset === 0 && seed && !search.trim()) {
        const starters = await saveStarterPictures(setMessage);
        result = await listCloudPictures(search);
        result.items = [...result.items, ...starters.filter(asset => !result.items.some(item => item.id === asset.id))];
      }
      setAssets(previous => nextOffset ? [...previous, ...result.items.filter(asset => !previous.some(p => p.id === asset.id))] : result.items);
      setOffset(result.next_offset); setMessage("Cloud library up to date.");
    } catch (cause) { setMessage(""); reportError(cause); }
    finally { operation.current = false; setBusy(false); }
  }
  useEffect(() => { void load(); }, []); // Open the library once; searches use the explicit Search action.

  async function upload(files: File[]) {
    if (!files.length || operation.current) return;
    operation.current = true; setBusy(true); setError("");
    let saved = 0;
    try {
      for (const [index, file] of files.entries()) {
        setMessage(`Saving picture ${index + 1} of ${files.length}: ${file.name}…`);
        const asset = await uploadCloudPicture(file);
        setAssets(previous => [asset, ...previous.filter(p => p.id !== asset.id)]); saved++;
      }
      setNeedsLogin(false); setMessage(`${saved} picture${saved === 1 ? "" : "s"} saved to the cloud.`);
    } catch (cause) { setMessage(saved ? `${saved} picture${saved === 1 ? "" : "s"} saved before the upload stopped.` : ""); reportError(cause); }
    finally { operation.current = false; setBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setLoginError("");
    try {
      const response = await fetch("/api/platform-auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email.trim(), email: email.trim(), password }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Sign in failed.");
      setPassword(""); setNeedsLogin(false); await load();
    } catch (cause) { reportError(cause); setNeedsLogin(true); setLoginError(cause instanceof Error ? cause.message : "Sign in failed. Try again."); }
    finally { setBusy(false); }
  }
  function insert(asset: PictureAsset, image?: HTMLImageElement | null, original?: {width: number; height: number}) {
    const store = useEditorStore.getState(), page = store.getActivePage();
    if (!page) return;
    const dimensions = original || (image?.naturalWidth ? { width: image.naturalWidth, height: image.naturalHeight } : undefined);
    store.insertPublicationElement(pictureElement(asset, page.id, Math.max(0, ...store.getActivePageElements().map(el => el.transform.zIndex)) + 1, dimensions));
  }

  return <section className="flex-1 min-h-0 flex flex-col overflow-hidden" aria-label="Picture presets">
    <div className="shrink-0 p-3 space-y-2 border-b border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Picture presets</h3><button type="button" aria-label="Refresh cloud pictures" title="Refresh cloud pictures" disabled={busy} onClick={() => void load()} className="min-h-9 min-w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40"><RefreshCw size={15}/></button></div>
      <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="Upload picture presets" className="sr-only" disabled={busy} onChange={event => void upload(Array.from(event.target.files || []))}/>
      <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="w-full min-h-11 px-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"><ImagePlus size={16}/>{busy ? "Working…" : "Upload pictures to cloud"}</button>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">PNG, JPG or WebP · up to 25 MB each · transparency preserved</p>
      <form className="flex gap-2" onSubmit={event => { event.preventDefault(); void load(0, false); }}><input aria-label="Search cloud pictures" placeholder="Search cloud pictures" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} className={field}/><button disabled={busy} aria-label="Search pictures" className="min-w-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center"><Search size={15}/></button></form>
      {message && <p role="status" aria-live="polite" className="text-xs text-indigo-600 dark:text-indigo-300">{message}</p>}
      {error && !needsLogin && <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
      {needsLogin && <details open className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-indigo-200 dark:border-indigo-900/40"><summary className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-300 py-1">Sign in with SuperAdmin Founder credentials</summary><form onSubmit={signIn} className="space-y-2 mt-2">{loginError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded">{loginError}</p>}<label className="text-xs block text-slate-700 dark:text-slate-200">Platform email or Founder ID<input autoComplete="username" type="text" required value={email} onChange={event => setEmail(event.target.value)} placeholder="e.g. 25e001.nexsyrus@gmail.com or FOUNDER-001" className={field}/></label><label className="text-xs block text-slate-700 dark:text-slate-200">Password<input autoComplete="current-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Founder password" className={field}/></label><button disabled={busy} className="min-h-10 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">{busy ? "Signing in to SuperAdmin…" : "Sign in and save presets"}</button></form></details>}
    </div>
    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
      <div><h4 className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-200">Starter pictures · {STARTER_PICTURES.length}</h4><div className="grid grid-cols-2 gap-2">{STARTER_PICTURES.filter(p => !search || `${p.name} ${p.tags}`.toLowerCase().includes(search.toLowerCase())).map(picture => {
        const cloud = assets.find(asset => asset.checksum === picture.checksum);
        return <button key={picture.id} type="button" title={`Add ${picture.name} to page`} aria-label={`Add ${picture.name}`} onClick={event => cloud ? insert(cloud, null, { width: picture.width, height: picture.height }) : useEditorStore.getState().addElement(`preset-picture-${picture.id}`)} className="rounded-xl border border-slate-200 dark:border-white/10 p-2 text-left hover:border-indigo-400 bg-slate-50 dark:bg-white/5"><img loading="lazy" src={`/assets/picture-presets/${picture.id}-thumb.webp`} alt={picture.name} className="w-full h-20 object-contain"/><span className="block mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">{picture.name}</span>{cloud && <span className="text-[9px] text-emerald-600 flex items-center gap-1"><Cloud size={10}/>Saved to cloud</span>}</button>;
      })}</div></div>
      <div><h4 className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-200">Cloud pictures · {assets.length}</h4><div className="grid grid-cols-2 gap-2">{assets.filter(asset => !STARTER_PICTURES.some(p => p.checksum === asset.checksum)).map(asset => <button key={asset.id} type="button" aria-label={`Add ${asset.title}`} onClick={event => insert(asset, event.currentTarget.querySelector("img"))} className="rounded-xl border border-slate-200 dark:border-white/10 p-2 text-left hover:border-indigo-400 bg-slate-50 dark:bg-white/5"><img loading="lazy" src={assetRenderUrl({ assetId: asset.id, revision: asset.revision, checksum: asset.checksum })} alt={asset.title} className="w-full h-20 object-contain"/><span className="block mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">{asset.title}</span><span className="text-[9px] text-emerald-600 flex items-center gap-1"><Cloud size={10}/>Saved to cloud</span></button>)}</div>
      {!assets.length && !busy && <p className="text-xs text-slate-500">{needsLogin ? "Sign in to load cloud pictures." : search ? "No cloud pictures match this search." : "Upload a picture to build your cloud library."}</p>}
      {offset !== null && <button disabled={busy} onClick={() => void load(offset, false)} className="w-full mt-3 min-h-10 rounded-lg border border-slate-300 dark:border-white/15 text-xs">Load more pictures</button>}</div>
    </div>
  </section>;
}
