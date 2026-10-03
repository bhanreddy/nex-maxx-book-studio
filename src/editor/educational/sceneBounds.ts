import type { SceneNode } from "./publicationScene";
import { textWidth } from "./publicationScene";
type ContentNode = Extract<SceneNode, {kind:"text"|"image"}>;
export function contentNodeBounds(node: ContentNode) {
  if (node.kind === "image") return { x: node.x, y: node.y, width: node.w, height: node.h };
  if (node.editBounds) return { x: node.editBounds.x, y: node.editBounds.y, width: node.editBounds.w, height: node.editBounds.h };
  const width = Math.max(node.size, node.textLength ?? Math.max(...(node.lines || [node.text]).map(line => textWidth(line, node.size, node.bold, node.font === "serif", node.fontFamily, node.letterSpacing))));
  return { x: node.x - (node.align === "middle" ? width / 2 : node.align === "end" ? width : 0), y: node.y - node.size, width, height: node.size * 1.35 + Math.max(0, (node.lines?.length || 1) - 1) * (node.lineHeight || node.size * 1.4) };
}

