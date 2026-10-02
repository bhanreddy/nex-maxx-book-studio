"use client";
import React, { useState } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';
import { curriculumRequest } from '../../editor/persistence/bookRepository';
import { SMART_QR_PRESETS, type SmartQrData, type SmartQrPreset, type QrArtifact, smartQrPreflight } from '../../editor/media/smartQr';
import type { PageElement } from '../../domain/element/types';
interface Resource {
    id: string;
    title: string;
    description: string;
    durationSeconds?: number;
    qrs: {
        id: string;
        displayCode: string;
        status: string;
    }[];
}
export function SmartQrLibrary() {
    const store = useEditorStore(), [search, setSearch] = useState(''), [resources, setResources] = useState<Resource[]>([]), [preset, setPreset] = useState<SmartQrPreset>('watch-and-learn'), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const load = async () => { setBusy(true); setError(''); try {
        const r = await curriculumRequest<{
            items: Resource[];
        }>(`media?search=${encodeURIComponent(search)}`, 'GET');
        setResources(r.items);
    }
    catch {
        setError('Sign in to central curriculum and retry loading approved media.');
    }
    finally {
        setBusy(false);
    } };
    const select = async (r: Resource, qrId: string) => { setBusy(true); setError(''); try {
        const a = await curriculumRequest<{
            artifact: QrArtifact;
            checksum: string;
            status: string;resourceStatus:string;durationSeconds:number|null;
        }>(`media/qr/${qrId}/artifact`, 'GET');
        if (a.status !== 'ACTIVE'||a.resourceStatus!=='ACTIVE')
            throw Error('Choose an active learning code.');
        const el = store.addElement(`preset-smart-qr-${preset}`);
        if (el)
            store.updateElementContent(el.id, { smartMediaQr: { qrId, mediaResourceId: r.id, preset, label: preset.replaceAll('-', ' ').toUpperCase(), description: r.description || r.title, cta: 'Scan with SIMS', qrSize: 110, padding: 14, duration: a.durationSeconds||undefined, renderArtifact: a.artifact, checksum: a.checksum, validation: 'VALID' } });
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Media could not be linked.');
    }
    finally {
        setBusy(false);
    } };
    return (
        <section className="p-3 space-y-2 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
                <span className="text-[9px] tracking-widest text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                    Interactive / Smart QR
                </span>
                <span className="text-[10px] text-slate-400">Central media</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Link approved video or media resource to an on-page QR code.
            </p>
            <div className="space-y-1.5">
                <select
                    aria-label="Smart QR preset"
                    className="w-full px-2 py-1 border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                    value={preset}
                    onChange={e => setPreset(e.target.value as SmartQrPreset)}
                >
                    {SMART_QR_PRESETS.map(p => (
                        <option key={p} value={p}>{p.replaceAll('-', ' ')}</option>
                    ))}
                </select>
                <div className="flex gap-1.5">
                    <input
                        className="flex-1 px-2.5 py-1 border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                        aria-label="Search media title or QR code"
                        placeholder="Title or QR code"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void load(); }}
                    />
                    <button
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
                        disabled={busy}
                        onClick={load}
                    >
                        {busy ? 'Loading…' : 'Link Media'}
                    </button>
                </div>
            </div>
            {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            {resources.map(r => (
                <div key={r.id} className="border-t border-slate-200 dark:border-white/10 pt-1.5 space-y-1">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.title}</div>
                    {r.qrs.filter(q => q.status === 'ACTIVE').map(q => (
                        <button
                            disabled={busy}
                            key={q.id}
                            onClick={() => select(r, q.id)}
                            className="text-xs block py-1 underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
                        >
                            {q.displayCode} · Add to page
                        </button>
                    ))}
                </div>
            ))}
        </section>
    );
}
export function SmartQrInspector({ element }: {
    element: PageElement;
}) {
    const store = useEditorStore(), d = element.content.smartMediaQr as SmartQrData, b = store.getActiveBook(), change = (patch: Partial<SmartQrData>) => store.updateElementContent(element.id, { smartMediaQr: { ...d, ...patch } });
    const errors = smartQrPreflight(element, b?.dimensions.widthPt || 595, b?.dimensions.heightPt || 842);
    return <section className="p-4 space-y-3 border-b border-slate-200 dark:border-white/10"><h3 className="font-semibold text-sm text-slate-800 dark:text-white">Smart QR</h3><p className="text-[10px] tracking-widest text-slate-500 dark:text-slate-400">CONTENT</p>{(['label', 'description', 'cta'] as const).map(field => <label className="text-xs block text-slate-700 dark:text-slate-300" key={field}>{field}<input className="block w-full border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 rounded p-2 mt-1 text-slate-800 dark:text-slate-200" value={d[field]} onChange={e => change({ [field]: e.target.value })}/></label>)}<p className="text-[10px] tracking-widest text-slate-500 dark:text-slate-400">STYLE / LAYOUT</p><select aria-label="QR preset" className="w-full border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 rounded p-2 text-xs text-slate-800 dark:text-slate-200" value={d.preset} onChange={e => change({ preset: e.target.value as SmartQrPreset })}>{SMART_QR_PRESETS.map(p => <option key={p}>{p}</option>)}</select>{(['qrSize', 'padding'] as const).map(field => <label className="text-xs block text-slate-700 dark:text-slate-300" key={field}>{field} (pt)<input type="number" className="block w-full border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 rounded p-2 text-slate-800 dark:text-slate-200" min={field === 'qrSize' ? 80 : 8} max={field === 'qrSize' ? 180 : 24} value={d[field]} onChange={e => change({ [field]: Number(e.target.value) })}/></label>)}<p className="text-[10px] tracking-widest text-slate-500 dark:text-slate-400">ADVANCED</p><p className="break-all text-[10px] text-slate-600 dark:text-slate-400">Resource {d.mediaResourceId}<br />QR {d.qrId}</p>{errors.map(e => <p role="alert" className="text-xs text-red-600 dark:text-red-400" key={e}>{e}</p>)}<p className="text-xs text-slate-600 dark:text-slate-400">Export rechecks current status and retrieves the decoder-verified vector. Use Link Media to add another canonical binding.</p></section>;
}
