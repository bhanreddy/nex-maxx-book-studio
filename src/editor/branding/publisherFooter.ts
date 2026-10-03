import type { Book, PageDefinition } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { NEX_MAXX_LOGO, NEX_MAXX_POWERED_BY } from '../../domain/brand';
import { PUBLICATION_PALETTES } from '../../domain/educational/designTokens';
import type { PublicationScene, SceneNode } from '../educational/publicationScene';
import { pageFrameFor, pageMarginsFor } from '../pageFrame/pageFrame';

/** Page furniture shared by canvas, thumbnails and both PDF exporters. */
export function buildPublisherFooterScene(book: Book, page: PageDefinition, elements: Record<string, PageElement> = {}): PublicationScene {
  const { widthPt: width, heightPt: height } = book.dimensions;
  if (page.importSource?.mode === 'artwork') return { width, height, variant: 'publisher-footer', nodes: [], warnings: [] };
  const margins = pageMarginsFor(book, page), frame = pageFrameFor(book, page);
  const left = page.pageIndex % 2 ? margins.outsidePt : margins.insidePt;
  const right = width - (page.pageIndex % 2 ? margins.insidePt : margins.outsidePt);
  const palette = PUBLICATION_PALETTES.maroon;
  const furniture = page.elementIds.map(id => elements[id]).filter(el => el && !el.hidden && !el.content.teacherOnly && ['footer', 'pageNumber', 'page-number'].includes(el.type));
  if (frame) {
    // The pale right shoulder of the wave holds the branding; the left badge holds the folio.
    const scale = Math.min(width / 600, height / 900);
    const centerX = width * 520 / 600;
    const logoWidth = 60 * scale;
    const logoHeight = logoWidth * NEX_MAXX_LOGO.height / NEX_MAXX_LOGO.width;
    const top = height * 790 / 900, rowHeight = logoHeight + 12 * scale;
    const candidates = [top, ...furniture.map(el => el.transform.y + el.transform.height + 4 * scale)].sort((a, b) => a - b);
    const y = candidates.find(y => y >= top && y + rowHeight <= height * 835 / 900 && furniture.every(el =>
      (Number.isFinite(el.transform.x) && (el.transform.x + el.transform.width < centerX - 45 * scale || el.transform.x > centerX + 45 * scale)) ||
      y + rowHeight + 4 * scale <= el.transform.y || y >= el.transform.y + el.transform.height + 4 * scale));
    const imageY = y ?? top;
    return { width, height, variant: 'publisher-footer', nodes: [
      { kind: 'image', motifId: 'Publisher footer logo', x: centerX - logoWidth / 2, y: imageY, w: logoWidth, h: logoHeight, src: NEX_MAXX_LOGO.src, alt: NEX_MAXX_LOGO.alt, sourceWidth: NEX_MAXX_LOGO.width, sourceHeight: NEX_MAXX_LOGO.height, fit: 'contain', focalX: .5, focalY: .5, scale: 1 },
      { kind: 'text', motifId: 'Publisher attribution', text: NEX_MAXX_POWERED_BY, x: centerX, y: imageY + rowHeight, size: 8 * scale, fill: palette.text, fontFamily: 'Noto Sans', align: 'middle' },
    ], warnings: y === undefined ? ['The publisher branding overlaps a custom footer in the bottom wave. Move the custom footer before exporting.'] : [] };
  }
  const logoWidth = Math.min(60, (right - left) * .22);
  const logoHeight = logoWidth * NEX_MAXX_LOGO.height / NEX_MAXX_LOGO.width;
  const rowHeight = 4 + logoHeight;
  const top = height - margins.bottomPt + 4;
  const candidates = [top, ...furniture.map(el => el.transform.y + el.transform.height + 4)].sort((a, b) => a - b);
  const y = candidates.find(y => y >= top && y + rowHeight <= height - 8 && furniture.every(el =>
    y + rowHeight + 4 <= el.transform.y || y >= el.transform.y + el.transform.height + 4));
  const ruleY = y ?? top, imageY = ruleY + 4;
  const nodes: SceneNode[] = [
    { kind: 'line', motifId: 'Publisher footer rule', x: left, y: ruleY, x2: right, y2: ruleY, stroke: palette.border, strokeWidth: .6 },
    { kind: 'image', motifId: 'Publisher footer logo', x: left, y: imageY, w: logoWidth, h: logoHeight, src: NEX_MAXX_LOGO.src, alt: NEX_MAXX_LOGO.alt, sourceWidth: NEX_MAXX_LOGO.width, sourceHeight: NEX_MAXX_LOGO.height, fit: 'contain', focalX: .5, focalY: .5, scale: 1 },
    { kind: 'text', motifId: 'Publisher attribution', text: NEX_MAXX_POWERED_BY, x: left + logoWidth + 10, y: imageY + logoHeight / 2 + 2.8, size: 8, fill: palette.text, fontFamily: 'Noto Sans' },
  ];
  const master = book.masterPages?.find(master => master.id === page.masterPageId);
  if (!frame && !furniture.some(el => ['pageNumber', 'page-number'].includes(el.type)) && master?.showPageNumber !== false && page.displayNumber !== 'Cover') {
    nodes.push({ kind: 'text', motifId: 'Publisher footer folio', text: page.displayNumber, x: right, y: imageY + logoHeight / 2 + 2.8, size: 8, fill: palette.text, fontFamily: 'Noto Sans', align: 'end' });
  }
  return { width, height, variant: 'publisher-footer', nodes, warnings: y === undefined ? ['The publisher footer needs room in the bottom margin. Move custom footer elements before exporting.'] : [] };
}
