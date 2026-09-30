import type { SkinContext } from "../draw";
import { finish, ground, leader, write } from "../draw";

const CAPSULE = ["#4338CA", "#0F766E", "#9A3412", "#7E2254", "#1D4ED8", "#166534", "#92400E", "#0E7490"];

export function constellationMap(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 16);
  const pad = 14;
  let y = 12;
  y = write(ctx, c.title, pad, y, ctx.width - pad * 2, 16, true, ctx.ink(ctx.palette.primary)) + 8;
  const items = c.items?.length ? c.items : [c.calloutText || "Connections"];
  const cols = ctx.width >= 360 ? 2 : 1;
  const gap = 12;
  const hubW = cols === 2 ? 108 : ctx.width - pad * 2;
  const colW = cols === 2 ? (ctx.width - pad * 2 - hubW - gap * 2) / 2 : ctx.width - pad * 2;
  const rowH = Math.max(36, ...items.map(item => ctx.wrap(item, colW - 20, ctx.size).length * ctx.size * 1.4 + 16));
  const rows = Math.ceil(items.length / cols);
  const mapH = rows * (rowH + 8);
  const hub = ctx.box("hub", { x: ctx.width / 2 - hubW / 2, y: y + mapH / 2 - 36, w: hubW, h: 72 }, "capsule", "hub");
  items.forEach((item, i) => {
    const row = Math.floor(i / cols);
    const side = cols === 1 ? 0 : i % 2;
    const x = cols === 1 ? pad : side === 0 ? pad : ctx.width - pad - colW;
    const cy = y + row * (rowH + 8);
    const plate = ctx.box(`capsule-${i}`, { x, y: cy, w: colW, h: rowH }, "capsule", "capsule");
    const fill = ctx.ink(CAPSULE[i % CAPSULE.length]);
    ctx.nodes.push({ kind: "rect", x: plate.x, y: plate.y, w: plate.w, h: plate.h, fill, radius: plate.h / 2, motifId: `capsule-${i}` });
    write(ctx, item, plate.x + 10, plate.y + 6, plate.w - 20, ctx.size, true, ctx.onFill(CAPSULE[i % CAPSULE.length]), false, "middle");
    const fromX = side === 0 ? plate.x + plate.w : plate.x;
    const toX = side === 0 ? hub.x : hub.x + hub.w;
    if (cols === 2) leader(ctx, fromX, plate.y + plate.h / 2, toX, hub.y + hub.h / 2, ctx.ink(ctx.palette.secondary));
  });
  ctx.nodes.push({ kind: "ellipse", x: hub.x + hub.w / 2, y: hub.y + hub.h / 2, rx: hub.w / 2, ry: hub.h / 2, fill: ctx.ink(ctx.palette.primary), motifId: "hub" });
  write(ctx, c.calloutText || c.title, hub.x + 10, hub.y + 16, hub.w - 20, 11, true, ctx.onFill(ctx.palette.primary), false, "middle");
  return finish(ctx, y + mapH + 8, { items: true, callout: true, subtitle: false }, close);
}

export function milestoneTrail(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 12;
  const items = c.items || [];
  items.forEach((item, i) => {
    const fill = ctx.ink(i % 2 ? ctx.palette.secondary : ctx.palette.primary);
    const plate = ctx.box(`stone-${i}`, { x: 16 + (i % 2) * 18, y, w: ctx.width - 50 - (i % 2) * 18, h: 40 }, "capsule", "stone");
    ctx.nodes.push({ kind: "rect", x: plate.x, y: plate.y, w: plate.w, h: Math.max(40, plate.h), fill: ctx.ink(ctx.palette.surface), stroke: fill, strokeWidth: 1.5, radius: 20, motifId: `stone-${i}` });
    ctx.nodes.push({ kind: "ellipse", x: plate.x + 18, y: plate.y + 20, rx: 12, ry: 12, fill });
    write(ctx, String(i + 1), plate.x + 8, plate.y + 8, 20, 11, true, ctx.onFill(i % 2 ? ctx.palette.secondary : ctx.palette.primary), false, "middle");
    const next = write(ctx, item, plate.x + 36, plate.y + 8, plate.w - 48, ctx.size, true, ctx.ink(ctx.palette.text));
    if (i < items.length - 1) ctx.nodes.push({ kind: "line", x: plate.x + 18, y: plate.y + 40, x2: plate.x + 18, y2: next + 8, stroke: fill, strokeWidth: 2 });
    y = Math.max(next, plate.y + 40) + 10;
  });
  return finish(ctx, y, { items: true }, close);
}
