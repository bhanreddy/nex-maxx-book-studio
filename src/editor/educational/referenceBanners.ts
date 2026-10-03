import type { EducationalBlockCategory, EducationalBlockDefinition, SmartBlockInstance } from '../../domain/educational/blockSchema';
import { REFERENCE_BANNER_COLOURS } from '../../domain/educational/designTokens';
import { REFERENCE_WORKSHEETS, renderReferenceWorksheet } from './referenceWorksheets';
import type { PublicationScene, SceneNode } from './publicationScene';

/** Original supplied artwork, preserved losslessly at 2172 × 724 (3:1). */
export const REFERENCE_BANNERS = [
  { slug: 'activity', title: 'Activity', category: 'activity-lab', stage: 'activity', description: 'A pencil and paper medallion for hands-on learning.' },
  { slug: 'exercise', title: 'Exercise', category: 'exercises', stage: 'practice', description: 'A lime-green book and pencil for focused practice.' },
  { slug: 'dive-in', title: 'Let’s Dive In!', category: 'warm-up', stage: 'discover', description: 'An open book with a sculpted splash of colour.' },
  { slug: 'refresh', title: 'Time to Refresh', category: 'revision-recap', stage: 'review', description: 'A clock and fresh leaves for a learning pause.' },
  { slug: 'example', title: 'Example', category: 'worked-examples', stage: 'learn', description: 'An open-book seal with a golden bookmark.' },
  { slug: 'topic', title: 'Topic', category: 'section-heading', stage: 'learn', description: 'A golden book medallion for a new topic.' },
  { slug: 'subtopic', title: 'Subtopic', category: 'section-heading', stage: 'learn', description: 'A raised note card for the next part of a lesson.' },
  { slug: 'header-content', title: 'Header Content', category: 'section-heading', stage: 'start', description: 'A book and pencil for a chapter heading.' },
  { slug: 'quick-check', title: 'Quick Check', category: 'quick-check', stage: 'review', description: 'A checklist medallion for a progress checkpoint.' },
  { slug: 'remember-this', title: 'Remember This', category: 'facts-curiosity', stage: 'review', description: 'A lightbulb seal for an idea worth remembering.' },
] as const;

export const REFERENCE_ARTWORKS = [...REFERENCE_BANNERS, ...REFERENCE_WORKSHEETS];

export const referenceBannerId = (slug: string) => `studio-reference-${slug}`;
export function referenceBannerFor(presetId: string) {
  return REFERENCE_ARTWORKS.find(banner => referenceBannerId(banner.slug) === presetId);
}
export const REFERENCE_BANNER_BLOCKS: Record<string, EducationalBlockDefinition> = Object.fromEntries(
  REFERENCE_ARTWORKS.map(banner => {
    const id = referenceBannerId(banner.slug);
    return [id, {
      id, name: `${banner.title} · ${'worksheet' in banner ? 'Illustrated worksheet' : 'Sculpted ribbon'}`, description: banner.description,
      archetypeId: banner.category as EducationalBlockCategory, category: banner.category,
      lessonStage: banner.stage, version: 4, collectionVersion: 4, family: 'nex-play',
      supportedSubjects: ['general'], supportedGrades: ['early-years', 'primary-lower', 'primary-upper', 'middle-school', 'secondary-plus'],
      tags: ['reference', 'image collection', 'banner', 'premium', 'clay', '3d', ...('worksheet' in banner ? ['worksheet'] : ['ribbon']), banner.title],
      minDimensions: { widthPt: 180, heightPt: 'worksheet' in banner ? 180 * banner.worksheet.height / banner.worksheet.width : 60 }, defaultDimensions: { widthPt: 480, heightPt: 'worksheet' in banner ? 480 * banner.worksheet.height / banner.worksheet.width : 160 },
      reflowRules: { layoutVariant: 'reference-artwork', verticalGrowthStrategy: 'expand-container' },
      defaultBackgroundStyle: { type: 'none' },
      slots: [{ slotId: 'title', label: 'Heading', type: 'text', required: true, defaultContent: banner.title }, ...('worksheet' in banner ? banner.worksheet.rows ? [{ slotId: 'items', label: 'Writing rows', type: 'item-list' as const, required: false, defaultContent: ['', '', '', ''] }] : [{ slotId: 'calloutText', label: 'Worksheet content', type: 'rich-text' as const, required: false, defaultContent: '' }] : [])],
    } satisfies EducationalBlockDefinition];
  }),
);

export function referenceBannerColour(id?: string) {
  return REFERENCE_BANNER_COLOURS.find(colour => colour.id === id) || REFERENCE_BANNER_COLOURS[0];
}
/** Pick another treatment; repeated clicks always produce a visible change. */
export function shuffledReferenceBannerColour(current?: string, random = Math.random): string {
  const choices = REFERENCE_BANNER_COLOURS.filter(colour => colour.id !== referenceBannerColour(current).id);
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))].id;
}

export type ReferenceBannerVersion = 'original' | 'editable' | 'blank';
export const REFERENCE_BANNER_VERSIONS = [
  { id: 'original', label: 'Original text' },
  { id: 'editable', label: 'Editable text' },
  { id: 'blank', label: 'Text-free' },
] as const;
/** Older inserted banners retain their original supplied pixels. */
export function referenceBannerVersion(block: SmartBlockInstance): ReferenceBannerVersion {
  return block.styleOverrides.referenceBannerVersion || 'original';
}

export function renderReferenceBanner(block: SmartBlockInstance, layout: {
  textWidth: (text: string, size: number, bold?: boolean, serif?: boolean, family?: string) => number;
  wrapText: (text: string, width: number, size: number, bold?: boolean, serif?: boolean, family?: string) => string[];
}): PublicationScene | undefined {
  const banner = referenceBannerFor(block.presetId);
  if (!banner) return;
  if ('worksheet' in banner) return renderReferenceWorksheet(block, banner, referenceBannerVersion(block), referenceBannerColour(block.styleOverrides.referenceBannerColour).hueRotate, layout);
  const width = Math.max(1, block.transform.width), height = width / 3;
  const colour = referenceBannerColour(block.styleOverrides.referenceBannerColour);
  const version = referenceBannerVersion(block), gray = block.styleOverrides.printMode === 'grayscale';
  const nodes: SceneNode[] = [{
    kind: 'image', x: 0, y: 0, w: width, h: height,
    src: `/assets/reference-banners/${banner.slug}${version === 'original' ? '' : '-blank'}.png`, alt: banner.description,
    sourceWidth: 2172, sourceHeight: 724, focalX: .5, focalY: .5, scale: 1, fit: 'contain',
    hueRotate: colour.hueRotate, saturation: gray ? 0 : 100,
  }];
  if (version === 'editable') {
    const title = block.semanticContent.title ?? banner.title;
    const fontFamily = block.styleOverrides.fontFamily || 'Nunito';
    const refresh = banner.slug === 'refresh';
    // A newline separates the two independently editable visual lines of Refresh.
    const parts = refresh ? title.split(/\n|(?<=Time to)\s+(?=Refresh$)/) : [title];
    const addHeading = (text: string, top: number, availableHeight: number, maxSize: number, italic = false) => {
      if (!text) return;
      const availableWidth = width * (refresh ? .48 : .59), x = width * (refresh ? .605 : .602);
      let size = maxSize;
      const singleLine = !text.includes('\n') && text.length <= 32;
      if (singleLine && text !== banner.title) size = Math.min(size, availableWidth / Math.max(.01, layout.textWidth(text, 1, true, false, fontFamily)));
      let lines = singleLine ? [text] : layout.wrapText(text, availableWidth, size, true, false, fontFamily);
      // Fit all words, including long custom headings, without truncation.
      for (let attempt = 0; attempt < 140 && ((lines.length - 1) * size + size * .76 > availableHeight || (!singleLine && lines.some(line => layout.textWidth(line, size, true, false, fontFamily) > availableWidth))); attempt++) {
        size *= .95;
        lines = singleLine ? [text] : layout.wrapText(text, availableWidth, size, true, false, fontFamily);
      }
      const lineHeight = size, baseline = top + (availableHeight - ((lines.length - 1) * lineHeight + size * .76)) / 2 + size * .73;
      nodes.push({ kind: 'text', text, lines, x, y: baseline, size, lineHeight,
        textLength: singleLine ? Math.min(availableWidth, layout.textWidth(text, size, true, false, fontFamily)) : undefined,
        fontFamily, fontWeight: 900, bold: true, italic, align: 'middle', wrapWidth: availableWidth,
        fill: gray ? '#303030' : colour.ink, gradientId: 'banner-heading', stroke: '#ffffff', strokeWidth: width * .0028,
        shadow: { color: '#66574766', dx: 0, dy: width * .003, blur: width * .0015 }, fieldPath: 'title',
      });
    };
    nodes.push({ kind: 'gradient', id: 'banner-heading', x1: 0, y1: width * .1, x2: 0, y2: width * .2,
      from: gray ? '#505050' : colour.ink, to: gray ? '#151515' : colour.id === 'original' ? '#001b46' : colour.ink });
    if (refresh && parts.length === 2) {
      addHeading(parts[0], width * .066, width * .055, width * .065, true);
      const prefix = nodes[nodes.length - 1]; if (prefix.kind === 'text') prefix.fieldPath = undefined;
      addHeading(parts[1], width * .119, width * .111, width * .145, true);
    } else addHeading(title, width * .092, width * .111, width * .145, refresh);
  }
  return { width, height, variant: 'reference-artwork', warnings: [], nodes };
}
