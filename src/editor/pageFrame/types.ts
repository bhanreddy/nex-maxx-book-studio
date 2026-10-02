import type { SceneNode } from '../educational/publicationScene';

export interface PageFrame {
  /** Linear draft styles remain readable and render with the restored wave artwork. */
  style: 'editorial-double' | 'editorial-corners' | 'scholar-wave';
  colors: { primary: string; secondary: string; accent: string; leaf: string; paper: string; line: string };
  showTopNumber: boolean;
  showBottomNumber: boolean;
  /** Canonical coordinates are 600 × 900; every shape stays editable. */
  edits: Record<string, Partial<SceneNode> & { hidden?: boolean; offsetX?: number; offsetY?: number }>;
  additions: SceneNode[];
}
