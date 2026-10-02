import type { SceneNode } from '../educational/publicationScene';

export interface PageFrame {
  /** Linear draft styles remain readable and render with the restored wave artwork. */
  style: 'editorial-double' | 'editorial-corners' | 'scholar-wave' | 'word-import' | 'pdf-import';
  sourceName?: string;
  /** Relative page insets reserved by an imported frame. */
  safeInsets?: { top: number; bottom: number; left: number; right: number };
  colors: { primary: string; secondary: string; accent: string; leaf: string; paper: string; line: string };
  showTopNumber: boolean;
  showBottomNumber: boolean;
  /** Canonical coordinates are 600 × 900; every shape stays editable. */
  edits: Record<string, Partial<SceneNode> & { hidden?: boolean; offsetX?: number; offsetY?: number }>;
  additions: SceneNode[];
}

export function isImportedPageFrame(frame: Pick<PageFrame, 'style'>): boolean {
  return frame.style === 'word-import' || frame.style === 'pdf-import';
}
export function isImportedBorderArtwork(node: SceneNode): boolean {
  return node.kind === 'image' && (node.motifId === 'Word border artwork' || node.motifId === 'PDF border artwork');
}

/** Outer clockwise / inner counterclockwise paths keep the reading centre transparent. */
export function borderPerimeterMask(depth: number): string {
  const edge = depth * 100, end = 100 - edge;
  return `M 0 0 L 100 0 L 100 100 L 0 100 Z M ${edge} ${edge} L ${edge} ${end} L ${end} ${end} L ${end} ${edge} Z`;
}
