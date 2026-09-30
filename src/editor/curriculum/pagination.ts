import type { PublicationScene, SceneNode } from "../educational/publicationScene";

/** Break between text baselines, never through a glyph. Shapes/images may span a page break. */
export function sceneWindows(scene: PublicationScene, available: number): { from: number; to: number }[] {
  if (available < 64) throw new Error("Page margins leave too little reading space. Use a larger page or smaller margins.");
  const result: { from: number; to: number }[] = [];
  let from = 0;
  while (from < scene.height - .1) {
    let to = Math.min(scene.height, from + available);
    if (to < scene.height) {
      // Move a crossing line to the continuation, leaving its ascenders intact.
      for (const node of scene.nodes) if (node.kind === "text" && node.y > to && node.y - node.size * 1.15 < to) to = Math.min(to, node.y - node.size * 1.15 - 2);
      if (to - from < 40) throw new Error("A text style is too large for this page. Increase the page size.");
    }
    result.push({ from, to }); from = to;
  }
  return result;
}
export function sliceScene(scene: PublicationScene, window: { from: number; to: number }): PublicationScene {
  const nodes = scene.nodes.flatMap((node): SceneNode[] => {
    if (node.kind === "text" && (node.y <= window.from || node.y > window.to)) return [];
    const n = { ...node };
    if ("y" in n) n.y -= window.from;
    if (n.kind === "line" || n.kind === "gradient") n.y2 -= window.from;
    if (n.kind === "gradient") n.y1 -= window.from;
    if (n.kind === "polygon") n.points = n.points.map(([x, y]) => [x, y - window.from]);
    if (n.kind === "path") { let coordinate = 0; n.d = n.d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, value => String(Number(value) - (coordinate++ % 2 ? window.from : 0))); }
    return [n];
  });
  return { ...scene, height: window.to - window.from, nodes, motifs: [], warnings: [] };
}
