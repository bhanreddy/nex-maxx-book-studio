import type { Book, Chapter, PageDefinition, Margins } from '../../domain/book/types';
import type { PublicationScene, SceneNode } from '../educational/publicationScene';
import type { PageFrame } from './types';
import { isImportedPageFrame, isImportedBorderArtwork } from './types';
import { PUBLISHER_FOOTER_MARGIN_PT } from '../../domain/brand';
import { imageMaskPath } from '../educational/imageTreatment';

export const FRAME_PALETTES = {
  Burgundy: { primary: '#79253E', secondary: '#B9586C', accent: '#F5C79A', leaf: '#547B67', paper: '#FFFEFC', line: '#D5A29F' },
  Teal: { primary: '#225E62', secondary: '#54928A', accent: '#EDD2A5', leaf: '#658069', paper: '#FFFEFC', line: '#9FBDB4' },
  Indigo: { primary: '#383B73', secondary: '#787AAF', accent: '#E3C9AC', leaf: '#628078', paper: '#FFFEFC', line: '#B1AFCB' },
};
export function isEditableFramePath(path: string): boolean {
  if (!path.trim() || /[^MLCQZ0-9.,\s+eE-]/.test(path)) return false;
  const tokenPattern = /[MLCQZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
  if (path.replace(tokenPattern, '').replace(/[\s,]/g, '')) return false;
  const tokens = path.match(tokenPattern) || [];
  if (tokens[0] !== 'M') return false;
  for (let i = 0; i < tokens.length;) {
    const cmd = tokens[i++], count = ({ M: 2, L: 2, C: 6, Q: 4, Z: 0 } as Record<string, number>)[cmd];
    if (count === undefined) return false;
    for (let j = 0; j < count; j++) if (i >= tokens.length || !Number.isFinite(Number(tokens[i++]))) return false;
  }
  return true;
}
export function createPageFrame(): PageFrame {
  return { style: 'scholar-wave', colors: { ...FRAME_PALETTES.Burgundy }, showTopNumber: true, showBottomNumber: true, edits: {}, additions: [] };
}
export function pageFrameFor(book: Book, page: PageDefinition): PageFrame | undefined {
  if (book.pageFramePolicy === 'book') return book.pageFrame || undefined;
  const chapter = book.chapters.find(c => c.id === page.chapterId || c.pageIds.includes(page.id));
  return (page.pageFrame !== undefined ? page.pageFrame : chapter?.pageFrame !== undefined ? chapter.pageFrame : book.pageFrame) || undefined;
}
export function frameMargins(book: Book, frame?: PageFrame): Margins {
  const bottomPt = Math.max(book.margins.bottomPt, PUBLISHER_FOOTER_MARGIN_PT);
  if (!frame) return { ...book.margins, bottomPt };
  if (isImportedPageFrame(frame) && frame.safeInsets) return {
    topPt: Math.max(book.margins.topPt, book.dimensions.heightPt * frame.safeInsets.top),
    bottomPt: Math.max(bottomPt, book.dimensions.heightPt * frame.safeInsets.bottom),
    insidePt: Math.max(book.margins.insidePt, book.dimensions.widthPt * frame.safeInsets.left),
    outsidePt: Math.max(book.margins.outsidePt, book.dimensions.widthPt * frame.safeInsets.right),
  };
  return { topPt: Math.max(book.margins.topPt, book.dimensions.heightPt * .125), bottomPt: Math.max(bottomPt, book.dimensions.heightPt * .15), insidePt: Math.max(book.margins.insidePt, book.dimensions.widthPt * .11), outsidePt: Math.max(book.margins.outsidePt, book.dimensions.widthPt * .11) };
}
/** One margin resolver for canvas, arrangement, pagination and print checks. */
export function pageMarginsFor(book: Book, page: PageDefinition): Margins {
  const margins = page.overrideMargins || book.masterPages?.find(master => master.id === page.masterPageId)?.margins || book.margins;
  return frameMargins({ ...book, margins }, pageFrameFor(book, page));
}
export function chapterFrame(book: Book, chapter: Chapter): PageFrame | undefined {
  return (book.pageFramePolicy === 'book' ? book.pageFrame : chapter.pageFrame !== undefined ? chapter.pageFrame : book.pageFrame) || undefined;
}
/** Unmasked imported artwork belongs behind content; masked borders sit above backdrops. */
export function isFrameBackgroundNode(node: SceneNode): boolean {
  return 'motifId' in node && (node.motifId === 'Paper' || (node.kind === 'image' && isImportedBorderArtwork(node) && node.mask !== 'custom'));
}

/** Native vector scene shared by canvas, thumbnails, HTML print and PDF. */
export function editableFrameNodes(frame: PageFrame, number: string): SceneNode[] {
  if (isImportedPageFrame(frame)) return applyFrameEdits(frame, [
    { kind: 'rect', motifId: 'Paper', x: 0, y: 0, w: 600, h: 900, fill: frame.colors.paper }, ...frame.additions,
    ...(number !== 'Cover' && frame.showTopNumber ? [{ kind: 'text' as const, motifId: 'Top page number', x: 300, y: 32, text: number, size: 12, fill: frame.colors.primary, align: 'middle' as const }] : []),
    ...(number !== 'Cover' && frame.showBottomNumber ? [{ kind: 'text' as const, motifId: 'Bottom page number', x: 300, y: 878, text: number, size: 12, fill: frame.colors.primary, align: 'middle' as const }] : []),
  ], number);
  const p = frame.colors, nodes: SceneNode[] = [];
  const path = (id: string, d: string, fill: string, stroke?: string, opacity = 1, strokeWidth = .8) => nodes.push({ kind: 'path', motifId: id, d, fill, stroke, strokeWidth, opacity });
  nodes.push({ kind: 'rect', motifId: 'Paper', x: 0, y: 0, w: 600, h: 900, fill: p.paper });
  path('Top peach ribbon', 'M 0 0 L 600 0 L 600 94 C 555 55 523 61 489 65 C 367 87 305 22 181 14 C 105 9 40 40 0 80 Z', p.accent, undefined, .38);
  path('Top burgundy wave', 'M 0 0 L 600 0 L 600 47 C 553 1 528 27 484 40 C 357 91 301 8 185 5 C 106 2 40 14 0 55 Z', p.primary);
  path('Top wave highlight', 'M 0 13 C 91 0 158 1 213 12 C 345 35 385 68 488 34 C 535 18 564 7 600 10', 'none', p.secondary, .7);
  path('Right peach wash', 'M 600 46 C 551 80 607 146 586 219 C 566 268 610 300 590 346 C 620 385 584 450 588 506 C 558 550 614 557 592 617 C 554 680 561 711 600 743 Z', p.accent, undefined, .32);
  path('Left rose wash', 'M 0 175 C 41 169 2 202 36 231 C 85 269 0 290 20 345 C 65 414 12 464 5 514 C 0 552 56 571 35 612 C 13 646 36 681 0 699 Z', p.secondary, undefined, .12);
  path('Bottom peach ribbon', 'M 0 733 C 55 769 28 846 112 824 C 236 768 269 899 372 863 C 458 845 457 764 521 759 C 565 747 580 779 600 772 L 600 900 L 0 900 Z', p.accent, undefined, .32);
  path('Bottom burgundy wave', 'M 0 753 C 54 764 36 862 112 850 C 216 820 250 901 354 881 C 435 864 488 826 600 856 L 600 900 L 0 900 Z', p.primary);
  path('Bottom rose fold', 'M 0 835 C 46 912 161 869 225 875 C 372 858 416 919 600 878 L 600 900 L 0 900 Z', p.secondary, undefined, .52);
  path('Bottom wave highlight', 'M 0 768 C 51 779 39 867 116 857 C 220 835 255 906 355 887 C 457 865 523 839 600 867', 'none', p.accent, .8);
  for (let i = 0; i < 16; i++) {
    const x = 139 + i * 22, y = 15 + 42 * Math.sin((i / 15) * Math.PI / 2) ** 2;
    path(`Top stitch ${i + 1}`, `M ${x} ${y} L ${x + 7} ${y + 1}`, 'none', p.line, .65, .65);
  }
  for (let i = 0; i < 14; i++) {
    const y = 118 + i * 43, x = 579 + 8 * Math.sin(i * 1.4);
    path(`Right stitch ${i + 1}`, `M ${x} ${y} C ${x + 2} ${y + 4} ${x + 2} ${y + 8} ${x + 1} ${y + 12}`, 'none', p.line, .75, .65);
  }
  for (let i = 0; i < 10; i++) {
    const y = 288 + i * 38, x = 16 + 9 * Math.sin(i * .95);
    path(`Left stitch ${i + 1}`, `M ${x} ${y} L ${x - 2} ${y + 9}`, 'none', p.line, .6, .65);
  }
  if (number !== 'Cover' && frame.showTopNumber) {
    path('Top number badge', 'M 600 12 C 578 9 548 17 542 36 C 537 55 553 61 570 66 C 588 73 600 64 600 53 Z', p.primary, p.secondary, 1, 1.2);
    nodes.push({ kind: 'text', motifId: 'Top page number', x: 572, y: 49, text: number, size: Math.min(27, 54 / Math.max(1, number.length) * 1.45), bold: true, fill: p.paper, align: 'middle' });
  }
  if (number !== 'Cover' && frame.showBottomNumber) {
    nodes.push({ kind: 'ellipse', motifId: 'Bottom number badge', x: 38, y: 853, rx: 22, ry: 22, fill: p.paper });
    nodes.push({ kind: 'text', motifId: 'Bottom page number', x: 38, y: 862, text: number, size: Math.min(25, 37 / Math.max(1, number.length) * 1.45), bold: true, fill: p.primary, align: 'middle' });
  }
  return applyFrameEdits(frame, [...nodes, ...frame.additions], number);
}
function applyFrameEdits(frame: PageFrame, nodes: SceneNode[], number: string): SceneNode[] {
  return nodes.filter(n => !frame.edits['motifId' in n ? n.motifId || '' : '']?.hidden).map(n => {
    const { hidden, offsetX = 0, offsetY = 0, ...edit } = frame.edits['motifId' in n ? n.motifId || '' : ''] || {};
    const edited = { ...n, ...edit } as SceneNode;
    if (edited.kind === 'text' && (edited.motifId === 'Top page number' || edited.motifId === 'Bottom page number')) edited.text = number;
    if (edited.kind === 'path' && (offsetX || offsetY)) { let i = 0; edited.d = edited.d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, v => String(Number(v) + (i++ % 2 ? offsetY : offsetX))); }
    return edited;
  });
}
export function buildPageFrameScene(frame: PageFrame, number: string, width: number, height: number): PublicationScene {
  const sx = width / 600, sy = height / 900;
  const nodes = editableFrameNodes(frame, number).map(node => {
    const n = { ...node } as SceneNode;
    if ('x' in n) n.x *= sx; if ('y' in n) n.y *= sy;
    if ('w' in n) n.w *= sx; if ('h' in n) n.h *= sy;
    if ('rx' in n) n.rx *= sx; if ('ry' in n) n.ry *= sy;
    if ('size' in n) n.size *= Math.min(sx, sy);
    if ('radius' in n && n.radius) n.radius *= Math.min(sx, sy);
    if ('strokeWidth' in n && n.strokeWidth) n.strokeWidth *= Math.min(sx, sy);
    if (n.kind === 'line') { n.x2 *= sx; n.y2 *= sy; }
    if (n.kind === 'polygon') n.points = n.points.map(([x, y]) => [x * sx, y * sy]);
    if (n.kind === 'path') { let i = 0; n.d = n.d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, v => String(Number(v) * (i++ % 2 ? sy : sx))); }
    return n;
  });
  return { width, height, variant: `${frame.style}-frame`, nodes, warnings: [] };
}

/** Standalone SVG keeps curves, fills and live page-number text editable in vector editors. */
export function pageFrameSvg(frame: PageFrame, number = '3', width = 600, height = 900): string {
  const esc = (v: unknown) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const scene = buildPageFrameScene(frame, number, width, height);
  const nodes = scene.nodes.map(n => {
    const id = 'motifId' in n ? `data-graphic="${esc(n.motifId)}"` : '';
    const common = `${id} opacity="${'opacity' in n ? n.opacity ?? 1 : 1}"`;
    const fill = 'fill' in n ? `fill="${esc(n.fill)}"` : '';
    const stroke = 'stroke' in n && n.stroke ? `stroke="${esc(n.stroke)}" stroke-width="${'strokeWidth' in n ? n.strokeWidth ?? .8 : .8}"` : '';
    if (n.kind === 'path') return `<path ${common} d="${esc(n.d)}" ${fill} ${stroke}/>`;
    if (n.kind === 'rect') return `<rect ${common} x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.radius || 0}" ${fill} ${stroke}/>`;
    if (n.kind === 'ellipse') return `<ellipse ${common} cx="${n.x}" cy="${n.y}" rx="${n.rx}" ry="${n.ry}" ${fill} ${stroke}/>`;
    if (n.kind === 'text') return `<text ${common} x="${n.x}" y="${n.y}" font-family="Arial, sans-serif" font-size="${n.size}" font-weight="${n.bold ? 700 : 400}" text-anchor="${n.align || 'start'}" ${fill}>${esc(n.text)}</text>`;
    if (n.kind === 'line') return `<line ${common} x1="${n.x}" y1="${n.y}" x2="${n.x2}" y2="${n.y2}" ${stroke}/>`;
    if (n.kind === 'image') {
      const mask = imageMaskPath(n, n.w, n.h), clip = `border-image-${scene.nodes.indexOf(n)}`;
      return `${mask ? `<defs><clipPath id="${clip}"><path d="${esc(mask)}" transform="translate(${n.x} ${n.y})"/></clipPath></defs>` : ''}<image ${common} x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" href="${esc(n.src)}" preserveAspectRatio="none"${mask ? ` clip-path="url(#${clip})"` : ''}/>`;
    }
    if (n.kind === 'polygon') return `<polygon ${common} points="${n.points.map(p => p.join(',')).join(' ')}" ${fill} ${stroke}/>`;
    throw new Error(`Unsupported frame graphic: ${n.kind}`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>Scholar wave · editable page border and background</title>\n${nodes.join('\n')}\n</svg>`;
}
