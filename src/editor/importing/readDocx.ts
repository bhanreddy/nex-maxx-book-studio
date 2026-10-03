import type { FlowRun, FlowStyle } from '../layoutPartner/textWrapLayout';
import { checkCancelled, IMPORT_LIMITS, type ImportBlock, type ManuscriptDraft } from './types';

function convert(buffer: ArrayBuffer, signal?: AbortSignal): Promise<{ html: string; warnings: string[] }> {
  checkCancelled(signal);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./docx.worker.ts', import.meta.url));
    const cleanup = () => { clearTimeout(timer); worker.terminate(); signal?.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); reject(new DOMException('Import cancelled', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Word conversion timed out. Split the document into smaller chapters and retry.')); }, 60000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = event => { cleanup(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data); };
    worker.onerror = () => { cleanup(); reject(new Error('The Word importer could not start. Reload the studio and try again.')); };
    worker.postMessage(buffer, [buffer]);
  });
}

/** Rebuild allowed inline styles from nodes; never insert converter HTML into the live document. */
export function readInline(node: Node, style: FlowStyle = {}): FlowRun[] {
  if (node.nodeType === 3) return [{ text: node.textContent || '', style }];
  if (node.nodeType !== 1) return [];
  const tag = (node as Element).tagName.toLowerCase();
  if (['script', 'style', 'iframe', 'object', 'embed', 'img'].includes(tag)) return [];
  if (tag === 'br') return [{ text: '\n', style }];
  const next = { ...style, ...(['b','strong'].includes(tag) ? { bold: true } : {}),
    ...(['i','em'].includes(tag) ? { italic: true } : {}), ...(tag === 'u' ? { underline: true } : {}),
    ...(['s','del','strike'].includes(tag) ? { strike: true } : {}) };
  const runs = Array.from(node.childNodes).flatMap(child => readInline(child, next));
  if (['p', 'li'].includes(tag)) runs.push({ text: '\n', style: {} });
  return runs;
}
function trimRuns(runs: FlowRun[]) {
  while (runs.length && !runs.at(-1)!.text.trim()) runs.pop();
  return runs;
}
export async function docxHtmlBlocks(html: string, signal?: AbortSignal): Promise<{ blocks: ImportBlock[]; warnings: string[] }> {
  // A template is inert, including images and external links. Only validated image data is decoded below.
  const template = document.createElement('template'); template.innerHTML = html;
  const blocks: ImportBlock[] = [], warnings: string[] = [];
  let chars = 0, imageBytes = 0;
  const image = async (element: Element) => {
    const src = element.getAttribute('src') || '';
    if (!/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) { warnings.push('An unsupported or externally linked image was omitted.'); return; }
    imageBytes += src.length;
    if (imageBytes > IMPORT_LIMITS.artworkBytes) throw new Error('Embedded artwork is too large. Compress pictures in Word and retry.');
    const img = new Image(); img.src = src;
    try { await img.decode(); } catch { warnings.push('A damaged image could not be decoded.'); return; }
    checkCancelled(signal);
    if (!img.naturalWidth || !img.naturalHeight) return;
    blocks.push({ kind: 'image', src, width: img.naturalWidth, height: img.naturalHeight, alt: element.getAttribute('alt') || 'Imported Word image' });
  };
  const visit = async (element: Element, prefix = '') => {
    checkCancelled(signal);
    const tag = element.tagName.toLowerCase();
    if (tag === 'img') { await image(element); return; }
    if (tag === 'table') {
      const rows = Array.from(element.querySelectorAll('tr')).filter(row => row.closest('table') === element)
        .map(row => Array.from(row.children).filter(cell => ['TD','TH'].includes(cell.tagName)).map(cell => trimRuns(readInline(cell))));
      blocks.push({ kind: 'table', rows });
      warnings.push('Table cells become individually editable text frames. Cell content and row layout are retained; Word table styling and table-specific editing commands are not.');
      if (element.querySelector('[colspan],[rowspan],table')) warnings.push('Merged or nested table cells were simplified. Review the imported table.');
      for (const img of Array.from(element.querySelectorAll('img'))) await image(img);
      return;
    }
    if (tag === 'ol' || tag === 'ul') {
      let number = Number(element.getAttribute('start')) || 1;
      for (const child of Array.from(element.children)) await visit(child, tag === 'ol' ? `${number++}. ` : '• ');
      return;
    }
    if (/^(p|h[1-6]|li|blockquote|pre)$/.test(tag)) {
      // Split mixed text/images in source order; nested lists are separate blocks.
      let runs: FlowRun[] = prefix ? [{ text: prefix, style: {} }] : [];
      const flush = () => { const clean = trimRuns(runs); if (clean.some(run => run.text.trim())) blocks.push({ kind: 'text', runs: clean, heading: /^h/.test(tag) ? Number(tag[1]) : undefined }); runs = []; };
      const inline = async (node: Node, style: FlowStyle = {}) => {
        if (node.nodeType !== 1) { runs.push(...readInline(node, style)); return; }
        const el = node as Element;
        if (el.tagName === 'IMG' || ['OL','UL'].includes(el.tagName)) { flush(); await visit(el); }
        else if (el.querySelector('img,ol,ul')) { const next = { ...style, ...(['STRONG','B'].includes(el.tagName) ? { bold: true } : {}), ...(['EM','I'].includes(el.tagName) ? { italic: true } : {}) }; for (const child of Array.from(el.childNodes)) await inline(child, next); }
        else runs.push(...readInline(node, style));
      };
      for (const child of Array.from(element.childNodes)) await inline(child);
      flush(); return;
    }
    if (!['script','style','iframe','object','embed'].includes(tag)) for (const child of Array.from(element.children)) await visit(child);
  };
  for (const element of Array.from(template.content.children)) { await visit(element); if (blocks.length > 15000) throw new Error('This document contains too many blocks. Import one chapter at a time.'); }
  for (const block of blocks) chars += block.kind === 'text' ? block.runs.reduce((n,r) => n + r.text.length, 0) : block.kind === 'table' ? block.rows.flat(2).reduce((n,r) => n + r.text.length, 0) : 0;
  if (chars > IMPORT_LIMITS.textCharacters) throw new Error('This manuscript is too long for one import. Split it into chapters.');
  return { blocks, warnings };
}
export async function readDocx(file: File, signal?: AbortSignal): Promise<ManuscriptDraft> {
  const converted = await convert(await file.arrayBuffer(), signal);
  checkCancelled(signal);
  const result = await docxHtmlBlocks(converted.html, signal);
  if (!result.blocks.length) throw new Error('No supported content was found in this Word file. Export it as PDF to preserve its appearance.');
  return { name: file.name, format: 'docx', mode: 'editable', blocks: result.blocks,
    warnings: [...new Set(['Word content is reflowed. Fonts, floating artwork, headers, footers, page breaks, comments and tracked-change history are not reproduced. Use PDF artwork for a visual copy.', ...converted.warnings, ...result.warnings])] };
}
