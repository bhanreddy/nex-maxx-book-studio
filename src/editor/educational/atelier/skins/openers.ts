import type { SkinContext } from "../draw";
import { band, finish, ground, write } from "../draw";

export function unitMasthead(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const header = ctx.ink(ctx.palette.primary);
  const accent = ctx.ink(ctx.palette.accent);
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  band(ctx, 0, 8, accent, ctx.ink(ctx.palette.secondary), "mast-top");
  const plate = ctx.box("numeral", { x: 18, y: 28, w: 78, h: 78 }, "capsule", "numeral");
  ctx.nodes.push({ kind: "ellipse", x: plate.x + plate.w / 2, y: plate.y + plate.h / 2, rx: plate.w / 2, ry: plate.h / 2, fill: header, motifId: "numeral" });
  write(ctx, c.chapterNumber || "01", plate.x, plate.y + 22, plate.w, 28, true, ctx.onFill(ctx.palette.primary), false, "middle");
  const tx = plate.x + plate.w + 16;
  const tw = ctx.width - tx - 18;
  let y = 26;
  if (c.unitBadge) {
    const label = c.unitBadge;
    const chipW = Math.min(tw, Math.max(120, ctx.measure(label, 9, true) + 22));
    ctx.nodes.push({ kind: "rect", x: tx, y, w: chipW, h: 18, fill: ctx.ink(ctx.palette.secondary), radius: 9 });
    write(ctx, label, tx, y + 3, chipW, 9, true, ctx.onFill(ctx.palette.secondary), false, "middle");
    y += 26;
  }
  y = write(ctx, c.title, tx, y, tw, ctx.width > 380 ? 30 : 22, true, header) + 4;
  ctx.nodes.push({ kind: "rect", x: tx, y, w: Math.min(72, tw), h: 4, fill: accent, radius: 2 });
  y += 12;
  y = write(ctx, c.subtitle, tx, y, tw, ctx.size, false, ctx.ink(ctx.palette.text)) + 6;
  y = write(ctx, c.calloutText, tx, y, tw, ctx.size, false, ctx.ink(ctx.palette.text)) + 8;
  return finish(ctx, Math.max(y, 128), { subtitle: true, callout: true }, close);
}

export function panoramaGate(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.primary), 16);
  const art = ctx.artwork("waves", 0, 0, ctx.width, 150, ctx.palette, .95);
  art.forEach(node => ctx.nodes.push(node));
  const card = ctx.box("title-card", { x: 22, y: 36, w: ctx.width - 44, h: 110 }, "plate", "paper");
  ctx.nodes.push({ kind: "rect", x: card.x, y: card.y, w: card.w, h: card.h, fill: ctx.ink(ctx.palette.surface), radius: 16, motifId: "title-card" });
  let y = card.y + 12;
  y = write(ctx, c.unitBadge, card.x + 16, y, card.w - 32, 9, true, ctx.ink(ctx.palette.secondary)) + 4;
  y = write(ctx, c.title, card.x + 16, y, card.w - 32, 28, true, ctx.ink(ctx.palette.primary)) + 4;
  y = write(ctx, c.subtitle, card.x + 16, y, card.w - 32, ctx.size) + 4;
  return finish(ctx, Math.max(168, y + 16), { subtitle: true }, close);
}

export function topicRibbon(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 10);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "polygon", points: [[0, 16], [ctx.width - 28, 16], [ctx.width - 8, 42], [ctx.width - 28, 68], [0, 68]], fill: header });
  const num = c.chapterNumber || "1";
  ctx.nodes.push({ kind: "rect", x: 14, y: 28, w: 36, h: 28, fill: ctx.ink(ctx.palette.accent), radius: 8 });
  write(ctx, num, 14, 34, 36, 14, true, ctx.onFill(ctx.palette.accent), false, "middle");
  let y = write(ctx, c.title, 60, 28, ctx.width - 110, 18, true, ctx.onFill(ctx.palette.primary)) + 16;
  y = Math.max(y, 84);
  return finish(ctx, y, { subtitle: false }, close);
}
