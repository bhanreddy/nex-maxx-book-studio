import { checkCancelled, IMPORT_LIMITS, type ImportMode, type ImportProgress, type ManuscriptDraft } from './types';

export function parsePageRange(value: string, total: number): number[] {
  if (!value.trim()) return Array.from({ length: total }, (_, i) => i + 1);
  const selected = new Set<number>();
  for (const part of value.split(',')) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('Use page numbers or ranges, for example 1-8, 12, 15-20.');
    const first = Number(match[1]), last = Number(match[2] || match[1]);
    if (first < 1 || last < first || last > total) throw new Error(`Page ranges must be between 1 and ${total}, in ascending order.`);
    for (let page = first; page <= last; page++) selected.add(page);
  }
  return [...selected].sort((a,b) => a-b);
}
export async function readPdf(file: File, mode: ImportMode, range: string, signal?: AbortSignal,
  onProgress?: (progress: ImportProgress) => void): Promise<ManuscriptDraft> {
  const data = new Uint8Array(await file.arrayBuffer()); checkCancelled(signal);
  if (!/%PDF-\d\.\d/.test(new TextDecoder().decode(data.subarray(0, 1024)))) throw new Error('This file is not a valid PDF. Export a fresh PDF and retry.');
  const pdfjs = await import('pdfjs-dist'); checkCancelled(signal);
  const assets = `/pdfjs/${pdfjs.version}/`;
  pdfjs.GlobalWorkerOptions.workerSrc = `${assets}pdf.worker.min.mjs`;
  const task = pdfjs.getDocument({ data, cMapUrl: `${assets}cmaps/`, cMapPacked: true,
    standardFontDataUrl: `${assets}standard_fonts/`, wasmUrl: `${assets}wasm/`, iccUrl: `${assets}iccs/`,
    enableXfa: false, stopAtErrors: true });
  const abort = () => { void task.destroy(); };
  signal?.addEventListener('abort', abort, { once: true });
  const draft: ManuscriptDraft = { name: file.name, format: 'pdf', mode, blocks: [], warnings: [], textlessPages: [] };
  const canvas = document.createElement('canvas');
  let artworkBytes = 0, characters = 0;
  try {
    const pdf = await task.promise;
    draft.sourcePages = pdf.numPages;
    const selected = parsePageRange(range, pdf.numPages);
    if (selected.length > IMPORT_LIMITS.pdfPages) throw new Error(`Import up to ${IMPORT_LIMITS.pdfPages} PDF pages at a time. Enter a smaller page range.`);
    for (const [index, number] of selected.entries()) {
      checkCancelled(signal);
      onProgress?.({ stage: `Reading PDF page ${number}`, completed: index, total: selected.length });
      const page = await pdf.getPage(number), original = page.getViewport({ scale: 1 });
      if (![original.width, original.height].every(value => Number.isFinite(value) && value >= 36 && value <= 14400)) throw new Error(`Page ${number} has unsupported dimensions.`);
      const text = await page.getTextContent(); checkCancelled(signal);
      const items = text.items.filter((item): item is import('pdfjs-dist/types/src/display/api').TextItem => 'str' in item);
      if (!items.some(item => item.str.trim())) draft.textlessPages!.push(number);
      draft.blocks.push({ kind: 'page-break', sourcePage: number });
      if (mode === 'artwork') {
        const scale = Math.min(2.5, 2000 / Math.max(original.width, original.height));
        const viewport = page.getViewport({ scale }); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('The browser could not allocate a page preview. Try a smaller page range.');
        await page.render({ canvas, canvasContext: context, viewport, background: '#ffffff', annotationMode: pdfjs.AnnotationMode.ENABLE }).promise;
        checkCancelled(signal);
        const src = canvas.toDataURL('image/png'); artworkBytes += src.length;
        if (!src.startsWith('data:image/png') || artworkBytes > IMPORT_LIMITS.artworkBytes) throw new Error('Rendered PDF artwork exceeds 80 MB. Import a smaller page range.');
        draft.blocks.push({ kind: 'image', src, width: original.width, height: original.height, alt: `${file.name} · page ${number}`, sourcePage: number });
      } else {
        let line = '', previousY: number | undefined;
        const flush = () => { if (line.trim()) draft.blocks.push({ kind: 'text', runs: [{ text: line.trim(), style: {} }], sourcePage: number }); line = ''; };
        for (const item of items) {
          const y = item.transform[5];
          if (previousY !== undefined && Math.abs(y - previousY) > Math.max(3, item.height * .65)) flush();
          line += (line && !/\s$/.test(line) && !/^\s/.test(item.str) ? ' ' : '') + item.str;
          characters += item.str.length;
          if (characters > IMPORT_LIMITS.textCharacters) throw new Error('This PDF contains too much text. Import a smaller page range.');
          previousY = y; if (item.hasEOL) flush();
        }
        flush();
      }
      page.cleanup(); canvas.width = 0; canvas.height = 0;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (mode === 'artwork') draft.warnings.push('PDF pages become locked raster artwork (up to 180 dpi, capped at 2,000 pixels). Their text and illustrations are not separately editable; this is not a vector or press-master import. Pages are fitted without cropping.');
    else draft.warnings.push('PDF text is reflowed in extraction order. Images, tables, columns, fonts and mathematical notation are not reconstructed. Compare against the original before publishing.');
    if (draft.textlessPages!.length) draft.warnings.push(`${draft.textlessPages!.length} page(s) have no extractable text: ${draft.textlessPages!.join(', ')}. They may be scanned or blank. Use artwork mode to retain them; editable text requires OCR outside the studio.`);
    if (mode === 'editable' && !draft.blocks.some(block => block.kind === 'text')) throw new Error('This PDF contains no extractable text. Choose “Preserve PDF pages” or run OCR first.');
    onProgress?.({ stage: 'PDF ready for review', completed: selected.length, total: selected.length });
    return draft;
  } catch (error) {
    checkCancelled(signal);
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('This PDF is password-protected. Export an unlocked copy and retry.');
    if (error instanceof Error && ['InvalidPDFException', 'UnknownErrorException'].includes(error.name)) throw new Error('The PDF is damaged or unsupported. Export a fresh PDF and retry.');
    throw error;
  } finally { signal?.removeEventListener('abort', abort); canvas.width = 0; canvas.height = 0; await task.destroy(); }
}
