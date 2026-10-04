import type { LessonSchemaTopic, SmartBlockInstance } from "../../domain/educational/blockSchema";
import { CLASS_TYPOGRAPHY, LESSON_SCHEMA_TOKENS as T } from "../../domain/educational/designTokens";
import type { AtelierHelpers } from "../educational/atelier/render";
import type { PublicationScene, SceneNode, SceneMotifFrame } from "../educational/publicationScene";
import { schemaTopics } from "./lessonSchema";

/** Canvas, library previews, detached layers and PDF use exactly the same geometry. */
export function renderLessonSchema(block: SmartBlockInstance, h: Pick<AtelierHelpers, "wrapText">): PublicationScene {
  const w = Math.max(180, block.transform.width), pad = w < 300 ? 12 : 20, inner = w - pad * 2;
  const o = block.styleOverrides, c = block.semanticContent, quiet = o.printMode === "reduced-ink";
  const ink = o.customPalette?.text || T.ink, centreInk = o.customPalette?.primary || T.ink;
  const paper = quiet ? T.white : o.customPalette?.surface || T.paper;
  const fs = Math.max(10, (CLASS_TYPOGRAPHY[block.curriculum?.grade || 3]?.body || 13) * .82) * Math.max(1, o.fontSizeScale || 1);
  const nodes: SceneNode[] = [], motifs: SceneMotifFrame[] = [];
  const topics = schemaTopics(block), panels = Math.max(1, Math.ceil(topics.length / 7));
  const stacked = o.layoutVariant === "lesson-schema-stacked" || w < 380;
  const lines = (value: string, width: number, size = fs) => h.wrapText(value, Math.max(16, width), size, true);
  const text = (value: string, x: number, y: number, width: number, size = fs, fill: string = ink, align: "start" | "middle" = "start") => {
    const wrapped = value ? lines(value, width, size) : [];
    wrapped.forEach((line, i) => nodes.push({ kind: "text", x, y: y + size + i * size * 1.35, text: line, size, fill, bold: true, align, fontFamily: o.fontFamily, wrapWidth: Math.max(16, width), lineHeight: size * 1.35 }));
  };
  const rect = (x: number, y: number, rw: number, rh: number, fill: string, radius: number, stroke?: string, opacity?: number) => nodes.push({ kind: "rect", x, y, w: rw, h: rh, fill, radius, stroke, strokeWidth: stroke ? 1 : 0, opacity });
  const circle = (x: number, y: number, r: number, fill: string, stroke?: string) => nodes.push({ kind: "ellipse", x, y, rx: r, ry: r, fill, stroke, strokeWidth: stroke ? 1.2 : 0 });
  const frame = (id: string, role: string, x: number, y: number, fw: number, fh: number) => motifs.push({ id, role, kind: "lesson-schema", x, y, w: fw, h: fh });
  const path = (d: string, stroke: string, sw = 1.5) => nodes.push({ kind: "path", d, fill: "none", stroke, strokeWidth: sw });
  const icon = (kind: LessonSchemaTopic["icon"] | "book", x: number, y: number, size: number, color: string, n: number) => {
    // Small vector symbols remain sharp at any print resolution.
    const a = size / 2, l = x - a, r = x + a, top = y - a, b = y + a;
    if (kind === "number") { text(String(n + 1), x, y - size * .65, size * 2, size, color, "middle"); return; }
    if (kind === "book") path(`M ${x} ${top + 2} Q ${l} ${top - 2} ${l} ${top + 2} L ${l} ${b} Q ${x - 2} ${b - 3} ${x} ${b} Q ${x + 2} ${b - 3} ${r} ${b} L ${r} ${top + 2} Q ${r} ${top - 2} ${x} ${top + 2} L ${x} ${b}`, color);
    else if (kind === "leaf") { path(`M ${l} ${b} Q ${l} ${top} ${r} ${top} Q ${r} ${b} ${l} ${b} M ${l} ${b} L ${r - 2} ${top + 2}`, color); }
    else if (kind === "globe") { circle(x, y, a, "none", color); path(`M ${l} ${y} L ${r} ${y} M ${x} ${top} Q ${l + 2} ${y} ${x} ${b} Q ${r - 2} ${y} ${x} ${top}`, color); }
    else if (kind === "flask") path(`M ${x - 3} ${top} L ${x + 3} ${top} M ${x - 2} ${top} L ${x - 2} ${y - 2} L ${l} ${b} L ${r} ${b} L ${x + 2} ${y - 2} L ${x + 2} ${top} M ${l + 3} ${y + 3} L ${r - 3} ${y + 3}`, color);
    else if (kind === "computer") { rect(l, top, size, size * .7, "none", 1, color); path(`M ${x} ${y + a * .4} L ${x} ${b} M ${x - 4} ${b} L ${x + 4} ${b}`, color); }
    else if (kind === "music") { path(`M ${x - 3} ${b - 2} L ${x - 3} ${top + 3} L ${r} ${top} L ${r} ${y + 4}`, color); circle(x - 5, b - 2, 2.5, color); circle(r - 2, y + 4, 2.5, color); }
    else if (kind === "shapes") { rect(l, top, a, a, "none", 1, color); circle(x + a / 2, y + a / 2, a / 2, "none", color); }
    else { path(`M ${x} ${top} L ${x + 2} ${y - 2} L ${r} ${y} L ${x + 2} ${y + 2} L ${x} ${b} L ${x - 2} ${y + 2} L ${l} ${y} L ${x - 2} ${y - 2} Z`, color); }
  };
  const topicHeight = (topic: LessonSchemaTopic, width: number) => Math.max(42, lines(topic.label, width - 51).length * fs * 1.35 + 20);
  const card = (topic: LessonSchemaTopic, index: number, x: number, y: number, cw: number, ch: number) => {
    const color = /^#[\da-f]{6}$/i.test(topic.color) ? topic.color : T.tones[index % 7].accent;
    const tone = T.tones.find(t => t.accent === color);
    const tint = tone?.fill || "#" + [1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * .18 + 255 * .82).toString(16).padStart(2, "0")).join("");
    const radius = Math.min(ch / 2, o.cornerRadiusPt ?? ch / 2);
    if (!quiet) rect(x + 1, y + 3, cw, ch, T.shadow, radius, undefined, .65);
    rect(x, y, cw, ch, quiet ? T.white : tint, radius, color);
    if (!quiet) rect(x + 2, y + 2, cw - 4, 3, T.white, 1.5, undefined, .65);
    const badge = Math.min(15, ch / 2 - 6);
    circle(x + 23, y + ch / 2, badge + 2, T.white);
    circle(x + 23, y + ch / 2, badge, quiet ? T.white : color, quiet ? color : undefined);
    icon(topic.icon, x + 23, y + ch / 2, 15, quiet ? color : T.white, index);
    const lh = topic.label ? lines(topic.label, cw - 51).length * fs * 1.35 : fs * 1.35;
    text(topic.label, x + 45, y + (ch - lh) / 2, cw - 51);
    frame(`topic:${topic.id}`, "schema-text", x + 43, y + 4, cw - 48, ch - 8);
  };
  let y = 0;
  for (let p = 0; p < panels; p++) {
    const start = y, group = topics.slice(p * 7, p * 7 + 7), titleSize = Math.max(12, fs * 1.2);
    const bannerHeight = Math.max(35, lines(c.title, inner * .65 - 48, titleSize).length * titleSize * 1.35 + 18);
    const bgIndex = nodes.length;
    rect(0, start, w, 1, paper, 22, o.customPalette?.border || T.shadow);
    if (!quiet) rect(pad + 2, y + 13, inner * .57, bannerHeight, T.tones[0].fill, 16);
    rect(pad, y + 8, inner * .65, bannerHeight, quiet ? T.white : centreInk, 16, quiet ? centreInk : undefined);
    icon("book", pad + 20, y + 8 + bannerHeight / 2, 16, quiet ? ink : T.white, 0);
    text(c.title, pad + 38, y + 15, inner * .65 - 48, titleSize, quiet ? ink : T.white);
    frame("schema-title", "schema-text", pad + 36, y + 10, inner * .65 - 40, bannerHeight - 4);
    y += bannerHeight + 25;
    if (p > 0) { text(`TOPICS ${p * 7 + 1}–${p * 7 + group.length} · CONTINUED`, pad, y, inner, 9, T.muted); y += 22; }
    const central = c.calloutText ?? "";
    if (stacked) {
      const centreHeight = Math.max(48, lines(central, inner - 24, fs * 1.3).length * fs * 1.3 * 1.35 + 22);
      rect(pad, y, inner, centreHeight, quiet ? T.white : centreInk, 20, quiet ? centreInk : undefined);
      text(central, w / 2, y + 10, inner - 24, fs * 1.3, quiet ? ink : T.white, "middle");
      frame("schema-centre", "schema-text", pad + 8, y + 5, inner - 16, centreHeight - 10);
      y += centreHeight + 16;
      const columns = w < 280 ? 1 : 2, gap = 12, cw = (inner - gap * (columns - 1)) / columns;
      for (let i = 0; i < group.length; i += columns) {
        const row = group.slice(i, i + columns), rh = Math.max(...row.map(t => topicHeight(t, cw)));
        row.forEach((topic, j) => card(topic, p * 7 + i + j, pad + j * (cw + gap), y, cw, rh));
        y += rh + 12;
      }
    } else {
      const topWidth = inner * .48, topHeight = group[0] ? topicHeight(group[0], topWidth) : 0;
      if (group[0]) card(group[0], p * 7, (w - topWidth) / 2, y, topWidth, topHeight);
      const topEnd = y + topHeight;
      y += topHeight + 20;
      const centreWidth = inner * .26, cw = inner * .33, centreSize = fs * 1.3;
      const centreLines = central ? lines(central, centreWidth - 12, centreSize) : [];
      const radius = Math.max(o.responsiveResize ? Math.min(centreWidth / 2, 120) : centreWidth / 2, (centreLines.length * centreSize * 1.35 + 24) / 2);
      // Long labels grow vertically without shrinking type or losing words.
      const rowHeights = Array.from({ length: 3 }, (_, i) => Math.max(42, ...group.slice(1 + i * 2, 3 + i * 2).map(t => topicHeight(t, cw))));
      const area = Math.max(radius * 2 + 16, rowHeights.reduce((sum, rh) => sum + rh, 0) + 26);
      const cy = y + area / 2, cx = w / 2, rx = centreWidth / 2;
      if (group[0]) { path(`M ${cx} ${topEnd} C ${cx} ${topEnd + 10} ${cx} ${cy - radius - 12} ${cx} ${cy - radius}`, T.tones[p * 7 % 7].accent, 1.8); circle(cx, topEnd, 3, paper, T.tones[0].accent); }
      let rowY = y + (area - rowHeights.reduce((sum, rh) => sum + rh, 0) - 26) / 2;
      group.slice(1).forEach((topic, i) => {
        const row = Math.floor(i / 2), left = i % 2 === 0;
        if (i > 0 && left) rowY += rowHeights[row - 1] + 13;
        const x = left ? pad : w - pad - cw, ty = rowY + rowHeights[row] / 2;
        const edgeX = left ? x + cw : x, originX = cx + (left ? -rx : rx) * .85;
        const originY = cy + (row - 1) * Math.min(radius * .64, area / 4);
        path(`M ${originX} ${originY} C ${(originX + edgeX) / 2} ${originY} ${(originX + edgeX) / 2} ${ty} ${edgeX} ${ty}`, topic.color, 1.8);
        circle(edgeX, ty, 3, paper, topic.color);
        card(topic, p * 7 + i + 1, x, rowY, cw, rowHeights[row]);
      });
      nodes.push({ kind: "ellipse", x: cx, y: cy + 3, rx: rx + 4, ry: radius + 4, fill: T.shadow, opacity: quiet ? 0 : .7 });
      nodes.push({ kind: "ellipse", x: cx, y: cy, rx, ry: radius, fill: quiet ? T.white : centreInk, stroke: centreInk, strokeWidth: 1 });
      for (let a = 0; a < 48; a++) { const theta = a * Math.PI * 2 / 48; circle(cx + (rx + 8) * Math.cos(theta), cy + (radius + 8) * Math.sin(theta), .8, centreInk); }
      text(central, cx, cy - centreLines.length * centreSize * 1.35 / 2, centreWidth - 12, centreSize, quiet ? ink : T.white, "middle");
      frame("schema-centre", "schema-text", cx - rx + 6, cy - radius + 10, centreWidth - 12, radius * 2 - 20);
      y += area + 12;
    }
    y += pad;
    const bg = nodes[bgIndex]; if (bg.kind === "rect") bg.h = y - start;
    frame(`schema-panel-${p}`, "schema-panel", 0, start, w, y - start);
    if (p < panels - 1) y += 16;
  }
  return { width: w, height: y, nodes, motifs, variant: stacked ? "lesson-schema-stacked" : "lesson-schema", warnings: [] };
}
