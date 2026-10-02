import type { SceneNode } from "./publicationScene";

/** SVG commands have different argument shapes; arc flags and angles are not coordinates. */
export function transformScenePath(path: string, sx: number, sy: number, dx = 0, dy = 0): string {
  const tokens = path.match(/[a-df-zA-DF-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
  const sizes: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  const output: string[] = [];
  let command = "", initial = true;
  for (let i = 0; i < tokens.length;) {
    if (/^[a-z]$/i.test(tokens[i])) { command = tokens[i++]; output.push(command); }
    const kind = command.toUpperCase(), count = sizes[kind];
    if (!count) { if (i < tokens.length && !/^[a-z]$/i.test(tokens[i])) i++; continue; }
    const args = tokens.slice(i, i + count).map(Number);
    if (args.length !== count || args.some(value => !Number.isFinite(value))) break;
    const absolute = command === kind || (initial && kind === "M");
    const x = (value: number) => value * sx + (absolute ? dx : 0);
    const y = (value: number) => value * sy + (absolute ? dy : 0);
    if (kind === "H") args[0] = x(args[0]);
    else if (kind === "V") args[0] = y(args[0]);
    else if (kind === "A") { args[0] *= sx; args[1] *= sy; args[5] = x(args[5]); args[6] = y(args[6]); }
    else for (let j = 0; j < count; j++) args[j] = j % 2 ? y(args[j]) : x(args[j]);
    output.push(...args.map(value => String(value)));
    initial = false; i += count;
  }
  return output.join(" ");
}

/** Bake the visible block scale into native layers exactly once when detaching. */
export function transformSceneNode(node: SceneNode, sx: number, sy: number, dx = 0, dy = 0): SceneNode {
  const scale = Math.min(sx, sy);
  const mark = "strokeWidth" in node ? { strokeWidth: node.strokeWidth === undefined ? undefined : node.strokeWidth * scale } : {};
  switch (node.kind) {
    case "gradient": return { ...node, x1: node.x1 * sx + dx, y1: node.y1 * sy + dy, x2: node.x2 * sx + dx, y2: node.y2 * sy + dy };
    case "path": return { ...node, ...mark, d: transformScenePath(node.d, sx, sy, dx, dy) };
    case "polygon": return { ...node, ...mark, points: node.points.map(([x, y]) => [x * sx + dx, y * sy + dy]) };
    case "line": return { ...node, ...mark, x: node.x * sx + dx, y: node.y * sy + dy, x2: node.x2 * sx + dx, y2: node.y2 * sy + dy };
    case "ellipse": return { ...node, ...mark, x: node.x * sx + dx, y: node.y * sy + dy, rx: node.rx * sx, ry: node.ry * sy };
    case "text": return { ...node, x: node.x * sx + dx, y: node.y * sy + dy, size: node.size * sy,
      textLength: node.textLength === undefined ? undefined : node.textLength * sx,
      letterSpacing: node.letterSpacing === undefined ? undefined : node.letterSpacing * sx };
    default: return { ...node, ...mark, x: node.x * sx + dx, y: node.y * sy + dy, w: node.w * sx, h: node.h * sy,
      radius: node.radius === undefined ? undefined : node.radius * scale };
  }
}
