import type { BlockTextStyle, SmartBlockInstance } from '../../domain/educational/blockSchema';
import { textWidth, wrapText, type PublicationScene, type SceneNode } from './publicationScene';
import { toGrayHex } from '../design/contrast';

export type BlockTextNode = Extract<SceneNode, { kind: 'text' }>;
export const blockTextTarget = (node: BlockTextNode) => node.textStyleTarget || (node.fieldPath ? `field:${node.fieldPath}` : `node:${node.contentId}`);

/** Split-colour headings are one typographic role even when only the first run has a field. */
export function blockTextRole(node: BlockTextNode, scene: PublicationScene, block: SmartBlockInstance): 'heading' | 'body' {
  if (node.textRole) return node.textRole;
  const title = scene.nodes.find((n): n is BlockTextNode => n.kind === 'text' && n.fieldPath === 'title');
  if (node.fieldPath === 'title' || (!node.fieldPath && title && node.bold && title.bold && Math.abs(node.y - title.y) < .1 && Math.abs(node.size - title.size) < .1)) return 'heading';
  return !node.fieldPath && node.text === block.semanticContent.title ? 'heading' : 'body';
}

export function sanitizeBlockTextStyle(style: BlockTextStyle): BlockTextStyle {
  return {
    ...(Number.isFinite(style.fontSize) && style.fontSize! > 0 ? { fontSize: Math.max(.5, Math.min(576, style.fontSize!)) } : {}),
    ...(style.color && /^#[\da-f]{6}$/i.test(style.color) ? { color: style.color } : {}),
    ...(typeof style.bold === 'boolean' ? { bold: style.bold } : {}),
    ...(typeof style.italic === 'boolean' ? { italic: style.italic } : {}),
  };
}

export function applyBlockTextFormatting(scene: PublicationScene, block: SmartBlockInstance): PublicationScene {
  const formatting = block.styleOverrides.textFormatting;
  if (!formatting || !Object.keys(formatting).length) return scene;
  const warnings = [...scene.warnings];
  const nodes = scene.nodes.map(node => {
    if (node.kind !== 'text') return node;
    const role = blockTextRole(node, scene, block);
    const style = sanitizeBlockTextStyle({ ...formatting.all, ...formatting[role], ...formatting[blockTextTarget(node)] });
    if (!Object.keys(style).length) return node;
    const size = style.fontSize ?? node.size;
    const next: BlockTextNode = { ...node, size,
      ...(style.color ? { fill: block.styleOverrides.printMode === 'grayscale' ? toGrayHex(style.color) : style.color, gradientId: undefined } : {}),
      ...(style.bold !== undefined ? { bold: style.bold, fontWeight: style.bold ? 700 : 400 } : {}),
      ...(style.italic !== undefined ? { italic: style.italic } : {}),
    };
    if (style.fontSize !== undefined || style.bold !== undefined) {
      const width = node.wrapWidth ?? node.editBounds?.w ?? Math.max(1, scene.width - node.x);
      // Keep the top of the reading area anchored. Never grow or scale the frame.
      next.y = node.y - node.size * .8 + size * .8;
      next.lines = wrapText(node.text, width, size, next.bold, node.font === 'serif', node.fontFamily, node.letterSpacing);
      next.lineHeight = size * (node.lineHeight ? node.lineHeight / node.size : 1.4);
      next.textLength = undefined;
      if (next.y + (next.lines.length - 1) * next.lineHeight > (node.editBounds ? node.editBounds.y + node.editBounds.h : scene.height)) {
        warnings.push('Text exceeds its reading area. Reduce the text size or shorten the content. The block dimensions are unchanged.');
      }
    }
    return next;
  });
  // Preserve spacing between the coloured runs of the original worksheet headings.
  const runs = scene.nodes.filter((n): n is BlockTextNode => n.kind === 'text' && blockTextRole(n, scene, block) === 'heading');
  if (runs.length > 1 && runs.every(n => !n.lines && Math.abs(n.y - runs[0].y) < .1)) {
    const changed = runs.map(n => nodes[scene.nodes.indexOf(n)] as BlockTextNode);
    if (changed.some((n, i) => n.size !== runs[i].size || n.bold !== runs[i].bold)) {
      const left = Math.min(...runs.map(n => n.x)), right = Math.max(...runs.map(n => n.x + (n.textLength ?? textWidth(n.text, n.size, n.bold, false, n.fontFamily))));
      const gap = textWidth(' ', changed[0].size, changed[0].bold, false, changed[0].fontFamily);
      const widths = changed.map(n => textWidth(n.text, n.size, n.bold, n.font === 'serif', n.fontFamily));
      let x = (left + right - widths.reduce((a, b) => a + b, 0) - gap * (changed.length - 1)) / 2;
      changed.forEach((n, i) => { n.x = x; n.lines = undefined; n.textLength = undefined; x += widths[i] + gap; });
    }
  }
  return { ...scene, nodes, warnings: [...new Set(warnings)] };
}
