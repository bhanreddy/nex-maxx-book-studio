import type { SceneNode } from '../educational/publicationScene';
import type { PageFrame } from './types';
import { createPageFrame } from './pageFrame';

const MAX_FILE = 20 * 1024 * 1024, MAX_PART = 12 * 1024 * 1024;
const WORD = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
type ZipPart = { name: string; method: number; size: number; compressed: number; offset: number; crc: number };

/** Local-only DOCX reader. Bound archive sizes before inflating any document/media part. */
export function readDocxArchive(buffer: ArrayBuffer): { names: string[]; read: (name: string) => Promise<Uint8Array> } {
  if (buffer.byteLength > MAX_FILE) throw new Error('Choose a Word document smaller than 20 MB.');
  const bytes = new Uint8Array(buffer), view = new DataView(buffer), decoder = new TextDecoder();
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  }
  if (end < 0) throw new Error('This is not a valid .docx file. Save it as Word Document (.docx) and try again.');
  const count = view.getUint16(end + 10, true), directorySize = view.getUint32(end + 12, true), directory = view.getUint32(end + 16, true);
  if (view.getUint32(end + 4, true) !== 0 || count !== view.getUint16(end + 8, true) || count > 2048 || directory + directorySize !== end) throw new Error('This Word archive format is not supported. Save a fresh .docx copy.');
  const parts = new Map<string, ZipPart>();
  let position = directory;
  for (let i = 0; i < count; i++) {
    if (position + 46 > end || view.getUint32(position, true) !== 0x02014b50) throw new Error('The Word document archive is damaged.');
    const flags = view.getUint16(position + 8, true), nameLength = view.getUint16(position + 28, true);
    const next = position + 46 + nameLength + view.getUint16(position + 30, true) + view.getUint16(position + 32, true);
    if (next > end || (flags & 1)) throw new Error('Encrypted or damaged Word documents cannot be imported.');
    const name = decoder.decode(bytes.subarray(position + 46, position + 46 + nameLength));
    if (parts.has(name) || name.startsWith('/') || name.split('/').includes('..')) throw new Error('The Word document contains invalid archive paths.');
    parts.set(name, { name, method: view.getUint16(position + 10, true), size: view.getUint32(position + 24, true), compressed: view.getUint32(position + 20, true), offset: view.getUint32(position + 42, true), crc: view.getUint32(position + 16, true) });
    position = next;
  }
  if (position !== end || !parts.has('word/document.xml')) throw new Error('Choose a Word Document (.docx), not another ZIP file.');
  return { names: [...parts.keys()], read: async name => {
    const part = parts.get(name);
    if (!part) throw new Error(`The Word document is missing ${name}.`);
    if (part.size > MAX_PART || part.offset + 30 > directory || view.getUint32(part.offset, true) !== 0x04034b50) throw new Error('A Word document part is damaged or too large.');
    const start = part.offset + 30 + view.getUint16(part.offset + 26, true) + view.getUint16(part.offset + 28, true);
    if (start + part.compressed > directory || (part.method !== 0 && part.method !== 8)) throw new Error('Unsupported Word document compression.');
    const packed = bytes.slice(start, start + part.compressed);
    let result: Uint8Array;
    if (part.method === 0) result = packed;
    else {
      let stream: DecompressionStream;
      try { stream = new DecompressionStream('deflate-raw'); } catch { throw new Error('This browser cannot read Word files. Use a current Chrome, Edge, Safari or Firefox.'); }
      const reader = new Blob([packed]).stream().pipeThrough(stream).getReader();
      const chunks: Uint8Array[] = []; let total = 0;
      try {
        while (true) {
          const chunk = await reader.read(); if (chunk.done) break;
          total += chunk.value.length;
          if (total > MAX_PART || total > part.size) { await reader.cancel(); throw new Error('The Word document expands beyond its declared size.'); }
          chunks.push(chunk.value);
        }
      } finally { reader.releaseLock(); }
      result = new Uint8Array(total); let at = 0;
      for (const chunk of chunks) { result.set(chunk, at); at += chunk.length; }
    }
    let crc = 0xffffffff;
    for (const byte of result) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    if (result.length !== part.size || ((crc ^ 0xffffffff) >>> 0) !== part.crc) throw new Error('The Word document failed its integrity check. Save a fresh copy.');
    return result;
  } };
}

function xml(bytes: Uint8Array): Document {
  const text = new TextDecoder().decode(bytes);
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('This Word document contains unsupported XML declarations.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('The Word document contains damaged XML.');
  return doc;
}
const descendants = (node: Document | Element, local: string) => [...node.getElementsByTagNameNS('*', local)];
const attr = (node: Element | undefined, local: string) => node?.getAttributeNS(WORD, local) ?? node?.getAttribute(`w:${local}`) ?? node?.getAttribute(local) ?? '';
function number(value: string, fallback: number, min = 0, max = 100000): number {
  const parsed = value === '' ? fallback : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error('The Word border contains invalid dimensions.');
  return parsed;
}

/** Converts Word line borders to native vector segments; unsupported art never silently substitutes. */
export function frameFromWordXml(doc: Document, sourceName: string): PageFrame | undefined {
  const section = descendants(doc, 'sectPr')[0], borders = section && descendants(section, 'pgBorders')[0];
  if (!borders) return;
  const page = descendants(section, 'pgSz')[0], margins = descendants(section, 'pgMar')[0];
  const width = number(attr(page, 'w'), 12240, 1440) / 20, height = number(attr(page, 'h'), 15840, 1440) / 20;
  const offsetFromPage = attr(borders, 'offsetFrom') === 'page';
  const sides = ['top', 'right', 'bottom', 'left'] as const;
  const nodes: SceneNode[] = [], inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const settings = sides.map(side => {
    const node = descendants(borders, side)[0], style = attr(node, 'val');
    if (!node || !style || style === 'nil' || style === 'none') return undefined;
    if (!['single', 'double', 'triple', 'dashed', 'dashSmallGap', 'dotted', 'dotDash', 'dotDotDash', 'thick'].includes(style)) throw new Error(`Word border style “${style}” is not supported. Use a line border or a full-page PNG/JPEG border image.`);
    const thickness = number(attr(node, 'sz'), 8, 2, 96) / 8, space = number(attr(node, 'space'), 24, 0, 100);
    const color = attr(node, 'color');
    if (color && color !== 'auto' && !/^[\da-f]{6}$/i.test(color)) throw new Error('The Word border has an invalid colour.');
    const pageMargin = number(attr(margins, side), 1440, 0) / 20;
    const position = offsetFromPage ? space : pageMargin - space;
    const axis = side === 'left' || side === 'right' ? width : height;
    if (position < thickness || position >= axis / 2) throw new Error('The Word border leaves too little page space. Adjust its spacing in Word.');
    const count = style === 'triple' ? 3 : style === 'double' ? 2 : 1;
    inset[side] = (position + thickness * count * 2 + 8) / axis;
    return { side, style, thickness, position, color: color && color !== 'auto' ? `#${color}` : '#000000', count };
  });
  const position = (side: typeof sides[number]) => settings.find(setting => setting?.side === side)?.position || 0;
  for (const setting of settings) {
    if (!setting) continue;
    const { side, style, thickness, color, count } = setting, horizontal = side === 'top' || side === 'bottom';
    for (let line = 0; line < count; line++) {
      const distance = setting.position + line * thickness * 2;
      const start = horizontal ? position('left') : position('top');
      const end = horizontal ? width - position('right') : height - position('bottom');
      const fixed = side === 'bottom' ? height - distance : side === 'right' ? width - distance : distance;
      const dashed = /dash|dotted/i.test(style);
      const pattern = style === 'dotted' ? [thickness] : style === 'dotDash' ? [thickness * 4, thickness] : style === 'dotDotDash' ? [thickness * 4, thickness, thickness] : [thickness * 4];
      let cursor = start, segment = 0;
      while (cursor < end) {
        const dash = pattern[segment++ % pattern.length];
        const finish = dashed ? Math.min(end, cursor + dash) : end;
        nodes.push({ kind: 'line', motifId: `Word ${side} border ${line + 1} segment ${nodes.length + 1}`,
          x: (horizontal ? cursor : fixed) / width * 600, y: (horizontal ? fixed : cursor) / height * 900,
          x2: (horizontal ? finish : fixed) / width * 600, y2: (horizontal ? fixed : finish) / height * 900,
          stroke: color, strokeWidth: thickness * Math.min(600 / width, 900 / height) });
        cursor = dashed ? finish + thickness * (style === 'dashSmallGap' ? 1 : 2) : end;
      }
    }
  }
  if (!nodes.length) return;
  return { ...createPageFrame(), style: 'word-import', sourceName, colors: { ...createPageFrame().colors, primary: settings.find(Boolean)!.color, paper: '#FFFFFF' },
    showTopNumber: false, showBottomNumber: false, additions: nodes, safeInsets: inset };
}

export async function importDocxBorder(file: File): Promise<PageFrame> {
  if (!/\.docx$/i.test(file.name)) throw new Error('Choose a .docx file. Open older .doc files in Word and save them as .docx first.');
  if (file.size > MAX_FILE) throw new Error('Choose a Word document smaller than 20 MB.');
  const archive = readDocxArchive(await file.arrayBuffer()), doc = xml(await archive.read('word/document.xml'));
  const app = archive.names.includes('docProps/app.xml') ? xml(await archive.read('docProps/app.xml')) : undefined;
  const pages = app && descendants(app, 'Pages')[0]?.textContent;
  if ((pages && Number(pages) > 1) || descendants(doc, 'br').some(node => attr(node, 'type') === 'page') || descendants(doc, 'lastRenderedPageBreak').length || descendants(doc, 'sectPr').length > 1) throw new Error('Use a single-page border template. Remove extra pages in Word and save it again.');
  const frame = frameFromWordXml(doc, file.name);
  if (frame) return frame;
  // Word artwork is commonly an embedded full-page image, anchored in the header.
  const section = descendants(doc, 'sectPr')[0], size = section && descendants(section, 'pgSz')[0];
  const width = number(attr(size, 'w'), 12240, 1440) / 20, height = number(attr(size, 'h'), 15840, 1440) / 20;
  const candidates: SceneNode[] = [];
  const headerIds = section ? descendants(section, 'headerReference').map(node => node.getAttributeNS(REL, 'id')) : [];
  const documentRelationships = archive.names.includes('word/_rels/document.xml.rels') ? xml(await archive.read('word/_rels/document.xml.rels')) : undefined;
  const headerNames = documentRelationships ? descendants(documentRelationships, 'Relationship').filter(node => headerIds.includes(node.getAttribute('Id')) && node.getAttribute('TargetMode') !== 'External').map(node => resolvePart('word/document.xml', node.getAttribute('Target') || '')) : [];
  for (const name of ['word/document.xml', ...new Set(headerNames)]) {
    const part = name === 'word/document.xml' ? doc : xml(await archive.read(name));
    const relName = name.replace(/([^/]+)$/, '_rels/$1.rels');
    if (!archive.names.includes(relName)) continue;
    const relationships = xml(await archive.read(relName));
    for (const drawing of descendants(part, 'drawing')) {
      const extent = descendants(drawing, 'extent')[0], blip = descendants(drawing, 'blip')[0];
      if (!extent || !blip) continue;
      const w = number(extent.getAttribute('cx') || '', 0, 0, 1e9) / 12700, h = number(extent.getAttribute('cy') || '', 0, 0, 1e9) / 12700;
      if (w < width * .7 || h < height * .7) continue;
      const id = blip.getAttributeNS(REL, 'embed');
      const relationship = descendants(relationships, 'Relationship').find(node => node.getAttribute('Id') === id && node.getAttribute('Type')?.endsWith('/image') && node.getAttribute('TargetMode') !== 'External');
      if (!relationship) continue;
      const imageName = resolvePart(name, relationship.getAttribute('Target') || '');
      const image = await archive.read(imageName);
      const mime = image[0] === 137 && image[1] === 80 && image[2] === 78 && image[3] === 71 ? 'image/png' : image[0] === 255 && image[1] === 216 ? 'image/jpeg' : undefined;
      if (!mime) throw new Error('The full-page border image must be PNG or JPEG. Convert it in Word and save again.');
      let binary = '';
      for (let i = 0; i < image.length; i += 32768) binary += String.fromCharCode(...image.subarray(i, i + 32768));
      candidates.push({ kind: 'image', motifId: 'Word border artwork', x: 0, y: 0, w: 600, h: 900, src: `data:${mime};base64,${btoa(binary)}`, alt: `Border from ${file.name}`, focalX: .5, focalY: .5, scale: 1, fit: 'contain',
        // Keep the perimeter above page backdrops, with an open centre for reading content.
        mask: 'custom', customMaskPath: 'M 0 0 L 100 0 L 100 100 L 0 100 Z M 10 10 L 10 90 L 90 90 L 90 10 Z' });
    }
  }
  if (candidates.length !== 1) throw new Error(candidates.length ? 'The document has multiple full-page images. Keep just one border image and try again.' : 'No page border found. In Word, use Design → Page Borders, or insert one full-page PNG/JPEG border image.');
  return { ...createPageFrame(), style: 'word-import', sourceName: file.name, showTopNumber: false, showBottomNumber: false,
    colors: { ...createPageFrame().colors, paper: '#FFFFFF' }, additions: candidates, safeInsets: { top: .1, bottom: .1, left: .1, right: .1 } };
}
function resolvePart(source: string, target: string): string {
  if (!target || /[\\?#:]|^\/\//.test(target)) throw new Error('The Word document contains an unsupported image reference.');
  const result = target.startsWith('/') ? [] : source.split('/').slice(0, -1);
  for (const segment of target.split('/')) {
    if (segment === '..') { if (!result.length) throw new Error('Invalid Word document reference.'); result.pop(); }
    else if (segment && segment !== '.') result.push(segment);
  }
  return result.join('/');
}
