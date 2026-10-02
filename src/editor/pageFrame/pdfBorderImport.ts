import { createPageFrame } from './pageFrame';
import { borderPerimeterMask, type PageFrame } from './types';

export const PDF_BORDER_DEPTH = .1;
export const MAX_BORDER_FILE_BYTES = 20 * 1024 * 1024;

/** Bounded canvas dimensions for portrait, landscape, and rotated PDF pages. */
export function pdfBorderRenderSize(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 36 || height < 36 || width > 14400 || height > 14400) throw new Error('This PDF has invalid or unsupported page dimensions. Export a standard page size and try again.');
  const scale = Math.min(300 / 72, 2400 / Math.max(width, height));
  return { scale, width: Math.ceil(width * scale), height: Math.ceil(height * scale) };
}

export function pdfArtworkFrame(sourceName: string, src: string): PageFrame {
  return { ...createPageFrame(), style: 'pdf-import', sourceName, showTopNumber: false, showBottomNumber: false,
    colors: { ...createPageFrame().colors, paper: '#FFFFFF' },
    safeInsets: { top: PDF_BORDER_DEPTH, bottom: PDF_BORDER_DEPTH, left: PDF_BORDER_DEPTH, right: PDF_BORDER_DEPTH },
    additions: [{ kind: 'image', motifId: 'PDF border artwork', x: 0, y: 0, w: 600, h: 900, src,
      alt: `Border from ${sourceName}`, focalX: .5, focalY: .5, scale: 1, fit: 'contain', mask: 'custom', customMaskPath: borderPerimeterMask(PDF_BORDER_DEPTH) }] };
}

/** PDF.js loads on demand and parses locally in a version-matched, self-hosted worker. */
export async function importPdfBorder(file: File): Promise<PageFrame> {
  if (!/\.pdf$/i.test(file.name)) throw new Error('Choose a single-page .pdf border template.');
  if (file.size > MAX_BORDER_FILE_BYTES) throw new Error('Choose a PDF smaller than 20 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!/%PDF-\d\.\d/.test(new TextDecoder().decode(bytes.subarray(0, 1024)))) throw new Error('This is not a valid PDF. Export a fresh .pdf copy and try again.');
  const pdfjs = await import('pdfjs-dist');
  const assets = `/pdfjs/${pdfjs.version}/`;
  pdfjs.GlobalWorkerOptions.workerSrc = `${assets}pdf.worker.min.mjs`;
  const task = pdfjs.getDocument({ data: bytes, cMapUrl: `${assets}cmaps/`, cMapPacked: true,
    standardFontDataUrl: `${assets}standard_fonts/`, wasmUrl: `${assets}wasm/`, iccUrl: `${assets}iccs/`,
    enableXfa: false, stopAtErrors: true });
  const canvas = document.createElement('canvas');
  try {
    const pdf = await task.promise;
    if (pdf.numPages !== 1) throw new Error('Use a single-page PDF border template. Remove extra pages and export it again.');
    const page = await pdf.getPage(1), original = page.getViewport({ scale: 1 });
    const size = pdfBorderRenderSize(original.width, original.height), viewport = page.getViewport({ scale: size.scale });
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser could not prepare a PDF preview. Reload and try again.');
    await page.render({ canvas, canvasContext: context, viewport, background: 'rgba(0,0,0,0)', annotationMode: pdfjs.AnnotationMode.DISABLE }).promise;
    const src = canvas.toDataURL('image/png');
    if (!src.startsWith('data:image/png;base64,')) throw new Error('The PDF border could not be rendered. Export a fresh copy and try again.');
    return pdfArtworkFrame(file.name, src);
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('This PDF is password-protected. Export an unlocked copy and try again.');
    if (error instanceof Error && (error.name === 'InvalidPDFException' || error.name === 'UnknownErrorException')) throw new Error('This PDF is damaged or unsupported. Export a fresh .pdf copy and try again.');
    throw error;
  } finally {
    canvas.width = 0; canvas.height = 0;
    await task.destroy();
  }
}
