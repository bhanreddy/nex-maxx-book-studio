import type { EducationalBlockCategory, SmartBlockInstance } from '../../domain/educational/blockSchema';
import { REFERENCE_WORKSHEET_TEXT, REFERENCE_ELEMENT_TOKENS } from '../../domain/educational/designTokens';
import type { PublicationScene, SceneNode } from './publicationScene';
import { filterImagePixels } from './imageTreatment';

type Frame = { x: number; y: number; w: number; h: number };
export interface ReferenceWorksheet {
  slug: keyof typeof REFERENCE_WORKSHEET_TEXT;
  title: string;
  label?: string;
  category: EducationalBlockCategory;
  stage: 'activity' | 'discover' | 'start' | 'practice' | 'review';
  description: string;
  worksheet: { width: number; height: number; transparent: boolean; blankSize?: { width: number; height: number }; heading: Frame; headingSize: number; body: Frame; rows?: number[]; rowLabel?: string; split?: string[]; cells?: Array<{ body: Frame; badge: Frame }> };
}
/** Frames are measured in the supplied PNG's native pixels, never a guessed 3:1 ratio. */
export const REFERENCE_WORKSHEETS: ReferenceWorksheet[] = [
  { slug: 'playful-activity', title: 'Activity', category: 'activity-lab', stage: 'activity', description: 'An orange notebook and paper plane frame with a generous activity area.', worksheet: { width: 1536, height: 1024, transparent: false, heading: { x: 304, y: 62, w: 355, h: 114 }, headingSize: 133, body: { x: 82, y: 270, w: 1372, h: 620 } } },
  { slug: 'pastel-did-you-know', title: 'Did You Know?', category: 'facts-curiosity', stage: 'discover', description: 'A pastel bulb, leaves and globe surrounding four gentle writing guides.', worksheet: { width: 1672, height: 941, transparent: true, heading: { x: 243, y: 225, w: 542, h: 87 }, headingSize: 107, split: ['Did You', 'Know?'], body: { x: 120, y: 366, w: 1255, h: 292 }, rows: [430, 507, 582, 660] } },
  { slug: 'learning-objectives', title: 'Learning Objectives', category: 'learning-outcomes', stage: 'start', description: 'A sculpted target, pencil and book header with four editable objective rows.', worksheet: { width: 1448, height: 1086, transparent: true, heading: { x: 218, y: 282, w: 735, h: 86 }, headingSize: 103, split: ['Learning', 'Objectives'], body: { x: 156, y: 452, w: 1198, h: 321 }, rows: [503, 592, 684, 773] } },
  { slug: 'fun-fact', title: 'Fun Fact', category: 'facts-curiosity', stage: 'discover', description: 'A cheerful reader, books, globe and star around an illustrated fact panel.', worksheet: { width: 2108, height: 746, transparent: true, heading: { x: 419, y: 119, w: 583, h: 170 }, headingSize: 213, split: ['Fun', 'Fact'], body: { x: 617, y: 347, w: 1325, h: 241 } } },
  { slug: 'skill-builder', title: 'Skill Builder', category: 'exercises', stage: 'practice', description: 'A green stitched idea label and a warm, spacious practice frame.', worksheet: { width: 1672, height: 941, transparent: false, heading: { x: 236, y: 169, w: 499, h: 99 }, headingSize: 118, body: { x: 112, y: 358, w: 1448, h: 384 } } },
  { slug: 'quick-review', title: 'Quick Review', category: 'revision-recap', stage: 'review', description: 'A golden review pennant and green check seal above a recap area.', worksheet: { width: 1672, height: 941, transparent: false, heading: { x: 244, y: 243, w: 473, h: 73 }, headingSize: 91, body: { x: 114, y: 408, w: 1440, h: 274 } } },
  { slug: 'lesson-map', title: 'Lesson Map', category: 'chapter-structure', stage: 'start', description: 'A folded map and location pin with six editable numbered steps and connecting arrows.', worksheet: { width: 2400, height: 787, transparent: false, blankSize: { width: 2188, height: 718 }, heading: { x: 350, y: 48, w: 470, h: 93 }, headingSize: 112, split: ['Lesson', 'Map'], body: { x: 96, y: 210, w: 2220, h: 500 }, cells: [
    { body: { x: 340, y: 245, w: 440, h: 107 }, badge: { x: 263, y: 209, w: 53, h: 62 } },
    { body: { x: 1015, y: 245, w: 466, h: 107 }, badge: { x: 934, y: 206, w: 53, h: 62 } },
    { body: { x: 1720, y: 245, w: 455, h: 107 }, badge: { x: 1640, y: 198, w: 53, h: 62 } },
    { body: { x: 208, y: 540, w: 544, h: 139 }, badge: { x: 123, y: 507, w: 53, h: 62 } },
    { body: { x: 1012, y: 540, w: 500, h: 139 }, badge: { x: 925, y: 507, w: 53, h: 62 } },
    { body: { x: 1788, y: 540, w: 490, h: 139 }, badge: { x: 1693, y: 507, w: 53, h: 62 } },
  ] } },
  { slug: 'learning-objectives-six', title: 'Learning Objectives', label: 'Learning Objectives · Six rows', category: 'learning-outcomes', stage: 'start', description: 'A coral target header and six editable objective rows with dotted writing guides.', worksheet: { width: 2400, height: 828, transparent: false, blankSize: { width: 2135, height: 737 }, heading: { x: 325, y: 47, w: 782, h: 102 }, headingSize: 124, split: ['Learning', 'Objectives'], body: { x: 218, y: 220, w: 2094, h: 514 }, rows: [278, 368, 460, 551, 643, 735], rowLabel: 'Objective' } },
  { slug: 'fun-fact-reader', title: 'Fun Fact', label: 'Fun Fact · Orange reader', category: 'facts-curiosity', stage: 'discover', description: 'A cheerful reader leaning on a peach heading above a spacious cream fact panel.', worksheet: { width: 2172, height: 724, transparent: true, heading: { x: 343, y: 111, w: 537, h: 135 }, headingSize: 170, split: ['Fun', 'Fact'], body: { x: 100, y: 332, w: 1970, h: 308 } } },
];

export type ReferenceTextLayout = {
  textWidth: (text: string, size: number, bold?: boolean, serif?: boolean, family?: string) => number;
  wrapText: (text: string, width: number, size: number, bold?: boolean, serif?: boolean, family?: string) => string[];
};

export function renderReferenceWorksheet(block: SmartBlockInstance, artwork: ReferenceWorksheet, version: 'original' | 'blank' | 'editable', hue: number, layout: ReferenceTextLayout): PublicationScene {
  const source = artwork.worksheet, width = Math.max(1, block.transform.width), responsive = block.styleOverrides.responsiveResize;
  const scaleX = width / source.width, height = responsive ? block.transform.height || source.height * 480 / source.width : source.height * scaleX;
  const scale = height / source.height;
  const gray = block.styleOverrides.printMode === 'grayscale', tokens = REFERENCE_WORKSHEET_TEXT[artwork.slug];
  const paint = (hex: string) => {
    const pixel = new Uint8ClampedArray([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255]);
    filterImagePixels(pixel, { hueRotate: hue }, gray);
    return '#' + [...pixel.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const frame = (f: Frame) => ({ x: f.x * scaleX, y: f.y * scale, w: f.w * scaleX, h: f.h * scale });
  const nodes: SceneNode[] = [{ kind: 'image', x: 0, y: 0, w: width, h: height,
    src: `/assets/reference-banners/${artwork.slug}${version === 'original' ? '' : '-blank'}.png`, alt: artwork.description,
    sourceWidth: version === 'original' ? source.width : source.blankSize?.width || source.width, sourceHeight: version === 'original' ? source.height : source.blankSize?.height || source.height, focalX: .5, focalY: .5, scale: 1, fit: responsive ? 'fill' : 'contain', hueRotate: hue, saturation: gray ? 0 : 100 }];
  const warnings: string[] = [];
  if (version !== 'editable') return { width, height, nodes, warnings, variant: 'reference-worksheet' };
  const title = block.semanticContent.title, family = block.styleOverrides.fontFamily || 'Nunito', heading = frame(source.heading);
  const original = title === artwork.title, segments = original && source.split ? source.split : [title];
  const maxHeadingSize = source.headingSize * scale;
  let size = Math.min(maxHeadingSize, heading.w / Math.max(.01, layout.textWidth(title, 1, true, false, family)));
  let lines = layout.wrapText(title, heading.w, size, true, false, family);
  while (size > .5 && (lines.length - 1) * size + size * .76 > heading.h) { size *= .95; lines = layout.wrapText(title, heading.w, size, true, false, family); }
  const baseline = heading.y + (heading.h - ((lines.length - 1) * size + size * .76)) / 2 + size * .73;
  const textStyle = { fontFamily: family, fontWeight: 900, bold: true, stroke: paint(tokens.stroke), strokeWidth: tokens.strokePx * scale, shadow: { color: tokens.shadow, dx: 0, dy: 2 * scale, blur: 2 * scale } };
  if (title) {
    const gap = layout.textWidth(' ', size, true, false, family);
    const totalWidth = segments.reduce((sum, text) => sum + layout.textWidth(text, size, true, false, family), 0) + gap * (segments.length - 1);
    let x = heading.x + (heading.w - totalWidth) / 2;
    segments.forEach((text, index) => {
      const runWidth = layout.textWidth(text, size, true, false, family);
      nodes.push({ kind: 'text', x: segments.length === 1 ? heading.x + heading.w / 2 : x, y: baseline, size, text,
        ...(segments.length === 1 ? { lines, lineHeight: size, align: 'middle' as const, ...(lines.length === 1 ? { textLength: Math.min(heading.w, runWidth) } : {}) } : { textLength: runWidth }),
        ...textStyle, fill: paint(index === 0 ? tokens.primary : tokens.secondary), wrapWidth: heading.w,
        ...(index === 0 ? { fieldPath: 'title', editBounds: heading } : {}) });
      x += runWidth + gap;
    });
  } else nodes.push({ kind: 'text', x: heading.x, y: baseline, size: maxHeadingSize, text: '', fill: paint(tokens.primary), fontFamily: family, fieldPath: 'title', editBounds: heading });

  const body = frame(source.body), bodyFamily = 'Nunito';
  const addBody = (text: string, fieldPath: string, area: Frame) => {
    let bodySize = Math.max(10, Math.min(16, (responsive ? 480 : width) * .026));
    let bodyLines = layout.wrapText(text, area.w, bodySize, false, false, bodyFamily);
    while (bodySize > 6 && bodyLines.length * bodySize * 1.45 > area.h) { bodySize *= .95; bodyLines = layout.wrapText(text, area.w, bodySize, false, false, bodyFamily); }
    if (bodyLines.length * bodySize * 1.45 > area.h) warnings.push('Worksheet content exceeds the writing area. Shorten the text or increase the block size.');
    nodes.push({ kind: 'text', x: area.x, y: area.y + bodySize, text, lines: bodyLines, size: bodySize, lineHeight: bodySize * 1.45, wrapWidth: area.w, fill: paint(tokens.body), fontFamily: bodyFamily, fieldPath, editBounds: area });
  };
  if (source.cells) source.cells.forEach((cell, index) => {
    const step = block.semanticContent.steps?.[index], badge = frame(cell.badge), label = step?.title ?? String(index + 1);
    const badgeSize = Math.min(badge.h / 1.12, badge.w / Math.max(.01, layout.textWidth(label, 1, true, false, family)));
    nodes.push({ kind: 'text', x: badge.x + badge.w / 2, y: badge.y + badge.h / 2 + badgeSize * .34, size: badgeSize, text: label, align: 'middle', fontFamily: family, fontWeight: 900, bold: true, fill: REFERENCE_ELEMENT_TOKENS.white, textLength: Math.min(badge.w, layout.textWidth(label, badgeSize, true, false, family)), fieldPath: `steps.${index}.title`, editBounds: badge });
    addBody(step?.body || '', `steps.${index}.body`, frame(cell.body));
  });
  else if (source.rows) source.rows.forEach((row, index) => {
    const rowHeight = ((source.rows?.[index + 1] ?? row + 75) - row) * scale;
    addBody(block.semanticContent.items?.[index] || '', `items.${index}`, { x: body.x, y: row * scale - rowHeight * .76, w: body.w, h: rowHeight * .76 });
  });
  else addBody(block.semanticContent.calloutText || '', 'calloutText', body);
  return { width, height, nodes, warnings, variant: 'reference-worksheet' };
}
