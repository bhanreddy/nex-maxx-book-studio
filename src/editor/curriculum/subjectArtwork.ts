import type { PublicationPalette, SceneNode } from "../educational/publicationScene";

/** Original vector illustrations, kept as addressable motif layers in canvas and PDF. */
export function subjectArtwork(subject: string, x: number, y: number, w: number, h: number, p: PublicationPalette): SceneNode[] {
  const nodes: SceneNode[] = [];
  const scale = Math.min(w / 200, h / 180);
  const ox = x + (w - 200 * scale) / 2, oy = y + (h - 180 * scale) / 2;
  const rect = (a: number, b: number, cw: number, ch: number, fill: string, radius = 8, stroke?: string) => nodes.push({ kind: "rect", x: ox + a * scale, y: oy + b * scale, w: cw * scale, h: ch * scale, radius: radius * scale, fill, stroke, strokeWidth: 2 * scale });
  const ellipse = (a: number, b: number, rx: number, ry: number, fill: string, stroke?: string) => nodes.push({ kind: "ellipse", x: ox + a * scale, y: oy + b * scale, rx: rx * scale, ry: ry * scale, fill, stroke, strokeWidth: 2 * scale });
  const line = (a: number, b: number, c: number, d: number, stroke: string, sw = 3) => nodes.push({ kind: "line", x: ox + a * scale, y: oy + b * scale, x2: ox + c * scale, y2: oy + d * scale, stroke, strokeWidth: sw * scale });
  const poly = (points: number[][], fill: string, stroke?: string) => nodes.push({ kind: "polygon", points: points.map(([a, b]) => [ox + a * scale, oy + b * scale]), fill, stroke, strokeWidth: 2 * scale });
  const label = (text: string, a: number, b: number, size: number, fill = p.primary) => nodes.push({ kind: "text", text, x: ox + a * scale, y: oy + b * scale, size: size * scale, fill, bold: true, align: "middle" });
  ellipse(100, 92, 83, 76, p.surface);
  ellipse(100, 163, 69, 7, p.border);
  if (/science|evs|environment|nature/i.test(subject)) {
    // A decorative growing seedling, independent from any instructional diagram.
    line(101, 131, 101, 47, p.secondary, 5);
    ellipse(80, 84, 25, 12, p.secondary); line(57, 78, 102, 93, p.primary, 1.5);
    ellipse(123, 63, 25, 12, p.secondary); line(101, 76, 144, 57, p.primary, 1.5);
    ellipse(84, 43, 18, 10, p.accent);
    poly([[64, 116], [140, 116], [129, 157], [76, 157]], p.primary);
    rect(60, 111, 84, 14, p.secondary, 5);
    line(84, 130, 88, 146, p.surface, 3);
    ellipse(158, 29, 15, 15, p.accent);
    [[158, 5, 158, 0], [181, 29, 187, 29], [176, 10, 180, 6]].forEach(v => line(v[0], v[1], v[2], v[3], p.accent));
  } else if (/math/i.test(subject)) {
    rect(27, 56, 82, 97, p.primary, 12);
    rect(36, 67, 64, 22, "#FFFFFF", 4);
    label("1 2 3", 68, 83, 14);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) rect(39 + col * 21, 99 + row * 16, 13, 10, row === 2 ? p.accent : p.surface, 3);
    poly([[122, 144], [172, 57], [187, 144]], p.accent, p.primary);
    poly([[146, 127], [167, 92], [173, 127]], p.surface);
    ellipse(138, 39, 23, 23, p.secondary);
    line(126, 39, 150, 39, "#FFFFFF", 4); line(138, 27, 138, 51, "#FFFFFF", 4);
  } else if (/social|history|geography|gk/i.test(subject)) {
    line(102, 128, 102, 153, p.primary, 7); rect(64, 152, 76, 9, p.primary, 4);
    ellipse(103, 77, 54, 54, p.secondary, p.primary);
    ellipse(103, 77, 27, 54, "none", p.surface);
    line(50, 77, 156, 77, p.surface, 2);
    line(59, 52, 147, 52, p.surface, 2); line(59, 102, 147, 102, p.surface, 2);
    poly([[71, 49], [92, 36], [110, 50], [104, 68], [88, 72], [79, 91], [65, 81]], p.accent);
    poly([[117, 86], [139, 79], [148, 93], [136, 109], [121, 104]], p.accent);
    ellipse(161, 27, 8, 8, p.accent);
  } else if (/computer|coding/i.test(subject)) {
    rect(29, 30, 146, 103, p.primary, 10); rect(38, 39, 128, 82, "#FFFFFF", 5);
    poly([[21, 138], [182, 138], [194, 155], [9, 155]], p.secondary);
    label("<  /  >", 101, 91, 29);
    rect(83, 140, 34, 5, p.surface, 2);
    ellipse(159, 53, 4, 4, p.accent);
  } else if (/art|music/i.test(subject)) {
    ellipse(91, 100, 60, 52, p.accent, p.primary);
    ellipse(57, 88, 12, 12, p.primary); ellipse(82, 66, 11, 11, p.secondary);
    ellipse(111, 74, 12, 12, "#FFFFFF"); ellipse(121, 104, 11, 11, p.primary);
    line(123, 141, 167, 31, p.primary, 10); line(123, 141, 153, 65, p.secondary, 6);
    poly([[160, 48], [161, 17], [178, 9], [173, 39]], p.secondary);
  } else {
    // Books and a pencil serve languages and custom subjects without invented instructional text.
    rect(33, 129, 139, 25, p.primary, 5); rect(43, 134, 125, 13, "#FFFFFF", 2);
    poly([[99, 57], [31, 44], [24, 114], [99, 129], [177, 111], [170, 43]], p.secondary, p.primary);
    poly([[99, 54], [37, 35], [32, 104], [99, 123]], "#FFFFFF", p.border);
    poly([[102, 54], [164, 35], [170, 104], [102, 123]], "#FFFFFF", p.border);
    line(100, 57, 100, 121, p.primary, 2);
    for (let i = 0; i < 4; i++) { line(47, 57 + i * 11, 86, 68 + i * 11, p.border, 2); line(117, 68 + i * 11, 154, 57 + i * 11, p.border, 2); }
    line(170, 134, 190, 68, p.accent, 9); poly([[167, 140], [174, 124], [180, 127]], p.primary);
  }
  [[21, 28], [181, 166]].forEach(([a, b]) => { line(a - 4, b, a + 4, b, p.accent, 2); line(a, b - 4, a, b + 4, p.accent, 2); });
  return nodes;
}
