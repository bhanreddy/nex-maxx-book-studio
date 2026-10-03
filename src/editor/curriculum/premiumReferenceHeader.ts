import type { ReferenceIcon, SmartBlockInstance } from '../../domain/educational/blockSchema';
import { REFERENCE_ELEMENT_TOKENS as T } from '../../domain/educational/designTokens';
import type { SceneNode } from '../educational/publicationScene';
import type { AtelierHelpers } from '../educational/atelier/render';
import { printFont } from '../publishing/fontRegistry';
import { contrastRatio, toGrayHex } from '../design/contrast';
import { blendInk } from '../educational/library/design';
import type { ReferenceElementDefinition } from './referenceElements';

type HeaderHelpers = Omit<AtelierHelpers, 'wrapText' | 'textWidth'> & {
  wrapText: (text: string, max: number, size: number, bold?: boolean, serif?: boolean, fontFamily?: string) => string[];
  textWidth: (text: string, size: number, bold?: boolean, serif?: boolean, fontFamily?: string) => number;
};
/** Small, measured vector mastheads. No raster textures or SVG filters. */
export function premiumReferenceHeader(block: SmartBlockInstance, definition: ReferenceElementDefinition, h: HeaderHelpers, nodes: SceneNode[], drawIcon: (kind: ReferenceIcon, x: number, y: number, size: number) => void) {
  const config = definition.premium!, r = block.styleOverrides.referenceElement!, o = block.styleOverrides;
  const w = Math.max(180, block.transform.width), narrow = w < 340, pad = narrow ? 14 : T.padding;
  const quiet = o.printMode === 'reduced-ink';
  const gray = (colour: string) => o.printMode === 'grayscale' ? toGrayHex(colour) : colour;
  const primary = gray(o.customPalette?.primary || T.navy), secondary = gray(o.customPalette?.border || T.plum);
  const accent = gray(o.customPalette?.accent || T.coral), paper = gray(o.customPalette?.surface || T.paper);
  const gold = gray(T.gold), white = T.white, edge = blendInk(paper, primary, .2), shadow = blendInk(paper, primary, .15);
  const authoredText = o.customPalette?.text ? gray(o.customPalette.text) : undefined;
  const ink = authoredText && contrastRatio(authoredText, paper) >= 4.5 ? authoredText : contrastRatio(primary, paper) >= 4.5 ? primary : T.ink;
  const on = (fill: string) => authoredText && contrastRatio(authoredText, fill) >= 4.5 ? authoredText : contrastRatio(white, fill) >= 4.5 ? white : T.ink;
  const dark = config.layout === 'nocturne' || config.layout === 'flag';
  const fill = quiet ? white : dark ? primary : paper;
  const titleInk = quiet ? ink : dark ? on(primary) : ink;
  const serif = config.layout === 'folio' || r.kind === 'premium-reading';
  const size = (narrow ? 20 : 29) * Math.max(1, Math.min(2, o.fontSizeScale || 1));
  const icon = r.icon || definition.icon, hasIcon = icon !== 'none' && o.illustration !== 'none';
  const badgeSize = hasIcon ? narrow ? 40 : 62 : 0;
  const number = r.kind === 'premium-exercise' ? r.number : undefined;
  const numberWidth = number ? Math.min(w * .28, Math.max(50, h.textWidth(number, narrow ? 18 : 26, true) + 24)) : 0;
  const numberSize = narrow ? 18 : 22;
  const numberHeight = number ? Math.max(38, h.wrapText(number, numberWidth-20, numberSize, true, true, printFont(number, o.fontFamily, true)).length * numberSize * 1.26 + 12) : 0;
  // Narrow columns stack the number below the title; title type never shrinks to fit.
  const reserveNumber = number && !narrow ? numberWidth + 16 : 0;
  const rightBadge = config.layout === 'checkpoint' || config.layout === 'orbit';
  const titleX = pad + (hasIcon && !rightBadge ? badgeSize + 16 : config.layout === 'folio' ? 12 : 0);
  const titleWidth = Math.max(24, w - titleX - pad - reserveNumber - (rightBadge && hasIcon ? badgeSize + 16 : 0) - (config.layout === 'nocturne' && !narrow ? 62 : 0));
  const font = printFont(block.semanticContent.title, o.fontFamily, serif);
  const lines = h.wrapText(block.semanticContent.title, titleWidth, size, true, serif, font);
  const eyebrowSize = narrow ? 8 : 9;
  const eyebrow = h.wrapText(config.eyebrow, titleWidth, eyebrowSize, true, false, printFont(config.eyebrow));
  const top = 12, eyebrowY = top + 17, titleY = eyebrowY + eyebrow.length * 12 + 8;
  const titleHeight = lines.length * size * 1.26;
  const numberY = titleY + titleHeight + 10;
  const bandH = Math.max(108, titleY - top + titleHeight + 21 + (number && narrow ? numberHeight + 10 : 0), badgeSize + 44, numberHeight + 28);
  const radius = Math.max(0, Math.min(30, o.cornerRadiusPt ?? T.premiumRadius));
  const rect = (x: number, y: number, rw: number, rh: number, colour: string, rad = radius, stroke?: string, sw: number = T.premiumStroke) => nodes.push({kind: 'rect', x, y, w: rw, h: rh, fill: colour, radius: rad, stroke, strokeWidth: sw});
  const line = (x: number, y: number, x2: number, y2: number, colour = gold, sw = .8) => nodes.push({kind: 'line', x, y, x2, y2, stroke: colour, strokeWidth: sw});
  const polygon = (points: number[][], colour: string) => nodes.push({kind: 'polygon', points, fill: colour});
  const text = (value: string, x: number, y: number, width: number, fontSize: number, colour: string, isSerif = false, fieldPath?: string) => {
    const family = printFont(value, o.fontFamily, isSerif), wrapped = h.wrapText(value, width, fontSize, true, isSerif, family);
    nodes.push({kind: 'text', text: value, lines: wrapped, x, y: y + fontSize, size: fontSize, bold: true, fill: colour, font: isSerif ? 'serif' : 'sans', fontFamily: family, wrapWidth: width, lineHeight: fontSize * 1.26, fieldPath});
    return wrapped.length * fontSize * 1.26;
  };
  if (!quiet) rect(3, top + T.premiumShadowOffset, w - 6, bandH, shadow);
  if (config.layout === 'flag') {
    polygon([[0,top],[w-14,top],[w,top+14],[w,top+bandH-14],[w-14,top+bandH],[0,top+bandH]], fill);
    polygon([[w-14,top],[w,top+14],[w-14,top+14]], quiet ? paper : secondary);
    line(pad, top + bandH - 10, w - pad, top + bandH - 10, quiet ? edge : gold);
  } else {
    rect(0, top, w, bandH, fill, radius, quiet ? edge : dark ? primary : edge);
  }
  if (config.layout === 'folio') {
    rect(7, top + 7, w - 14, bandH - 14, 'transparent', Math.max(0, radius - 4), edge, .55);
    polygon([[12,top+8],[22,top+8],[12,top+34]], quiet ? edge : secondary);
    polygon([[w-12,top+bandH-8],[w-22,top+bandH-8],[w-12,top+bandH-34]], quiet ? edge : gold);
    line(titleX, titleY - 4, titleX + Math.min(52, titleWidth), titleY - 4, gold, 1.5);
  } else if (config.layout === 'nocturne' && !narrow) {
    // Keep a solid text well. The restrained colour panel never sits under text.
    const panelWidth = Math.min(72, w * .16);
    rect(w - panelWidth - 7, top + 7, panelWidth, bandH - 14, quiet ? paper : secondary, Math.max(0, radius - 5));
    for (let i=0; i<5; i++) line(w-panelWidth+4+i*10, top+17, w-panelWidth+4+i*10, top+bandH-17, quiet ? edge : blendInk(secondary,white,.12), .65);
    line(titleX, top + bandH - 11, titleX + Math.min(titleWidth, 68), top + bandH - 11, gold, 1.5);
  } else if (config.layout === 'checkpoint') {
    rect(6, top + 6, w - 12, bandH - 12, 'transparent', Math.max(0, radius - 4), primary, .6);
    line(pad, top, pad + Math.min(64, titleWidth), top, accent, 3);
    line(pad, top + bandH, pad + Math.min(64, titleWidth), top + bandH, gold, 2);
  } else if (config.layout === 'studio') {
    rect(0, top, 7, bandH, quiet ? edge : secondary, 2);
    polygon([[w-42,top],[w-10,top],[w-10,top+28],[w-26,top+22],[w-42,top+28]], quiet ? paper : primary);
    line(titleX, top + bandH - 10, w - pad, top + bandH - 10, edge);
  } else if (config.layout === 'orbit') {
    for(let i=0; i<6; i++) line(pad + i*8, top + bandH - 10, pad + i*8, top + bandH - 6, gold, .8);
    line(pad, top + 9, pad + Math.min(titleWidth, 52), top + 9, secondary, 1.5);
  }
  const eyebrowInk = dark && !quiet ? on(primary) : blendInk(ink, paper, .15);
  text(config.eyebrow, titleX, eyebrowY, titleWidth, eyebrowSize, eyebrowInk);
  text(block.semanticContent.title, titleX, titleY, titleWidth, size, titleInk, serif, 'title');
  if (number) {
    const x = narrow ? titleX : w - pad - numberWidth, y = narrow ? numberY : top + (bandH - numberHeight)/2;
    rect(x,y,numberWidth,numberHeight,quiet ? white : blendInk(paper,accent,.12),8,edge,.7);
    text(number,x+10,y+5,numberWidth-20,numberSize,ink,true);
  }
  if (hasIcon) {
    const x = rightBadge ? w - pad - badgeSize : pad, y = top + (bandH - badgeSize)/2;
    // One thin aureole gives the badge depth without a blurred filter.
    nodes.push({kind:'ellipse',x:x+badgeSize/2,y:y+badgeSize/2,rx:badgeSize/2+4,ry:badgeSize/2+4,fill:'none',stroke:quiet ? edge : gold,strokeWidth:.7});
    drawIcon(icon,x,y,badgeSize);
  }
  let end = top + bandH + 14;
  if (r.skillLabel) {
    const skillWidth = w - pad*2 - 20;
    nodes.push({kind:'ellipse',x:pad+3,y:end+5,rx:2,ry:2,fill:quiet ? ink : secondary});
    const height = text(r.skillLabel,pad+14,end,skillWidth,10,ink);
    end += height + 12;
  }
  return { headerY: top, headerH: bandH, endY: end };
}
