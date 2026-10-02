import type { PageElement, ElementPreset } from '../../domain/element/types';
import type { PublicationScene, SceneNode } from '../educational/publicationScene';
import { wrapText } from '../educational/publicationScene';
import { MEDIA_QR_TOKENS as T } from '../../domain/educational/designTokens';
export const SMART_QR_PRESETS = ['compact-learning', 'watch-and-learn', 'explore-more', 'concept-video', 'scan-to-learn', 'guided-activity', 'quick-explain', 'chapter-companion'] as const;
export type SmartQrPreset = typeof SMART_QR_PRESETS[number];
export interface QrArtifact {
    schemaVersion: 1;
    payload: string;
    modules: number;
    cells: [
        number,
        number
    ][];
    color: string;
    quietZone: 4;
    errorCorrection: 'H';
    logo: {
        x: number;
        y: number;
        size: number;
    };
    variant: string;
}
export interface SmartQrData {
    qrId: string;
    mediaResourceId: string;
    preset: SmartQrPreset;
    label: string;
    description: string;
    cta: string;
    qrSize: number;
    padding: number;
    duration?: number;
    renderArtifact?: QrArtifact;
    validation?: 'VALID';
    checksum?: string;
}
const label = (preset: string) => preset.replaceAll('-', ' ').toUpperCase();
export const smartQrPresets: Record<string, ElementPreset> = Object.fromEntries(SMART_QR_PRESETS.map(p => [`preset-smart-qr-${p}`, { id: `preset-smart-qr-${p}`, type: 'smart-media-qr', name: label(p), category: 'media', variant: p, description: 'Canonical NEX MAXX learning code', icon: 'QrCode', defaultTransform: { width: p === 'compact-learning' ? 280 : 360, height: p === 'watch-and-learn' ? 250 : 190, rotation: 0 }, defaultStyle: { opacity: 1 }, defaultContent: { smartMediaQr: { qrId: '', mediaResourceId: '', preset: p, label: label(p), description: '', cta: 'Scan with SIMS', qrSize: 110, padding: 14 } } }]));
export function qrGeometry(el: PageElement) {
    const data = el.content.smartMediaQr as SmartQrData;
    const p = Math.max(8, Math.min(24, data.padding || 14)), w = el.transform.width, h = el.transform.height;
    const horizontal = data.preset !== 'watch-and-learn' || w >= 420;
    const size = Math.min(data.qrSize || 110, horizontal ? h - 2 * p - 18 : h - 2 * p - 94, w - 2 * p);
    return { size, x: horizontal ? p : (w - size) / 2, y: horizontal ? p + 9 : 78, p, horizontal };
}
export function smartQrScene(el: PageElement): PublicationScene {
    const d = el.content.smartMediaQr as SmartQrData, a = d?.renderArtifact, { size, x, y, p, horizontal } = qrGeometry(el), w = el.transform.width, h = el.transform.height;
    const nodes: SceneNode[] = [{ kind: 'rect', x: 0, y: 0, w, h, fill: T.paper, stroke: T.border, radius: d.preset === 'quick-explain' ? 0 : 10 }];
    if (['concept-video', 'guided-activity', 'explore-more'].includes(d.preset))
        nodes.push({ kind: 'rect', x: 0, y: 12, w: 2, h: h - 24, fill: T.accent });
    if (['chapter-companion', 'scan-to-learn'].includes(d.preset))
        nodes.push({ kind: 'line', x: p, y: 4, x2: w - p, y2: 4, stroke: T.accent, strokeWidth: 1 });
    const tx = horizontal ? x + size + 16 : w / 2, tw = horizontal ? w - tx - p : w - 2 * p, align = horizontal ? 'start' : 'middle' as const;
    nodes.push({ kind: 'text', x: tx, y: horizontal ? p + 17 : 22, text: 'NEX MAXX • LEARNING', size: 6.5, fill: T.muted, align });
    nodes.push({ kind: 'text', x: tx, y: horizontal ? p + 36 : 41, text: d.label || 'WATCH & LEARN', size: 10, bold: true, fill: T.accent, align });
    const lines = wrapText(d.description || '', tw, 8, false).slice(0, horizontal ? 4 : 2);
    lines.forEach((text, i) => nodes.push({ kind: 'text', x: tx, y: (horizontal ? p + 54 : 55) + i * 11, text, size: 8, fill: T.ink, align }));
    nodes.push({ kind: 'text', x: horizontal ? tx : w / 2, y: horizontal ? h - p - 19 : y + size + 15, text: d.cta || 'Scan with SIMS', size: 8, bold: true, fill: T.ink, align });
    if (d.duration)
        nodes.push({ kind: 'text', x: tx, y: h - p - 6, text: `${Math.floor(d.duration / 60)}:${String(d.duration % 60).padStart(2, '0')}  •  VIDEO`, size: 6.5, fill: T.muted, align });
    if (a) {
        const unit = size / (a.modules + 8);
        nodes.push({ kind: 'rect', x, y, w: size, h: size, fill: T.white });
        for (const [cx, cy] of a.cells)
            nodes.push({ kind: 'rect', x: x + (cx + 4) * unit, y: y + (cy + 4) * unit, w: unit, h: unit, fill: a.color });
        const l = a.logo, lx = x + (l.x + 4) * unit, ly = y + (l.y + 4) * unit;
        nodes.push({ kind: 'rect', x: lx, y: ly, w: l.size * unit, h: l.size * unit, fill: T.white });
        nodes.push({ kind: 'line', x: lx + unit, y: ly + unit, x2: lx + (l.size - 1) * unit, y2: ly + (l.size - 1) * unit, stroke: a.color, strokeWidth: .9 * unit }, { kind: 'line', x: lx + (l.size - 1) * unit, y: ly + unit, x2: lx + unit, y2: ly + (l.size - 1) * unit, stroke: a.color, strokeWidth: .9 * unit });
    }
    else {
        nodes.push({ kind: 'rect', x, y, w: Math.max(1, size), h: Math.max(1, size), fill: T.white, stroke: T.border }, { kind: 'text', x: x + size / 2, y: y + size / 2, text: 'LINK MEDIA', size: 7, align: 'middle', fill: T.muted });
    }
    return { width: w, height: h, nodes, variant: 'smart-media-qr', warnings: [] };
}
export function smartQrPreflight(el: PageElement, pageWidth: number, pageHeight: number): string[] {
    const d = el.content.smartMediaQr as SmartQrData, a = d?.renderArtifact, g = qrGeometry(el), errors: string[] = [];
    if (!d?.qrId || !d.mediaResourceId || !a || d.validation !== 'VALID')
        errors.push('Link an active, decoder-verified canonical QR.');
    if (g.size < 28 / 25.4 * 72)
        errors.push('QR must be at least 28 mm square.');
    if (a && g.size / (a.modules + 8) < .4 / 25.4 * 72)
        errors.push('QR modules are too small for reliable printing.');
    if (a && (a.quietZone !== 4 || a.errorCorrection !== 'H' || a.logo.size / a.modules > .16))
        errors.push('QR quiet zone, error correction or logo failed validation.');
    if ((el.style.opacity ?? 1) !== 1 || el.style.blur || el.style.blendMode && el.style.blendMode !== 'normal')
        errors.push('QR must print opaque without filters or blend effects.');
    if (el.transform.rotation !== 0)
        errors.push('Keep the Smart QR upright for print preflight.');
    if (el.transform.x < 9 || el.transform.y < 9 || el.transform.x + el.transform.width > pageWidth - 9 || el.transform.y + el.transform.height > pageHeight - 9)
        errors.push('Move the QR block at least 3 mm from the trimmed page edge.');
    const textWidth = g.horizontal ? el.transform.width - (g.x + g.size + 16) - g.p : el.transform.width - 2 * g.p;
    if (wrapText(d.description || '', textWidth, 8, false).length > (g.horizontal ? 4 : 2))
        errors.push('Description overflows the QR block. Enlarge it or shorten the text.');
    if ((d.label || '').length * 6 > textWidth)
        errors.push('The label does not fit. Shorten it or enlarge the block.');
    if ((d.description || '').length > 180)
        errors.push('Shorten the QR description to fit the learning block.');
    return errors;
}
export async function hydrateSmartQrs(elements: Record<string, PageElement>, pageWidth: number, pageHeight: number) {
    const result = { ...elements }, cache = new Map<string, Promise<{
        qrId: string;
        resourceId: string;
        status: string;resourceStatus:string;durationSeconds:number|null;
        artifact: QrArtifact;
        checksum: string;
        validation: 'VALID';
    }>>();
    for (const el of Object.values(elements).filter(e => e.type === 'smart-media-qr' && !e.hidden)) {
        const d = el.content.smartMediaQr as SmartQrData;
        if (!d?.qrId)
            throw new Error('Link media before exporting a Smart QR.');
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            const errors = smartQrPreflight(el, pageWidth, pageHeight);
            if (errors.length) throw new Error(`${el.displayName}: ${errors.join(' ')}`);
            continue; // Use the last locally verified artifact while offline.
        }
        const { curriculumRequest } = await import('../persistence/bookRepository');
        if (!cache.has(d.qrId))
            cache.set(d.qrId, curriculumRequest(`media/qr/${encodeURIComponent(d.qrId)}/artifact`, 'GET'));
        const a = await cache.get(d.qrId)!;
        if (a.status !== 'ACTIVE' || a.resourceStatus!=='ACTIVE' || a.resourceId !== d.mediaResourceId)
            throw new Error('This learning code is inactive or has an invalid resource binding.');
        const next = { ...el, content: { ...el.content, smartMediaQr: { ...d, duration:a.durationSeconds||undefined,renderArtifact: a.artifact, checksum: a.checksum, validation: a.validation } } };
        const errors = smartQrPreflight(next, pageWidth, pageHeight);
        if (errors.length)
            throw new Error(`${el.displayName}: ${errors.join(' ')}`);
        result[el.id] = next;
    }
    return result;
}
