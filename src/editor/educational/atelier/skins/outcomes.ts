import type { SkinContext } from "../draw";
import { band, diamond, finish, ground, write } from "../draw";

export function promiseBanner(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  const header = ctx.ink(ctx.palette.primary);
  band(ctx, 0, 46, header, ctx.ink(ctx.palette.secondary), "promise");
  write(ctx, c.title, 16, 10, ctx.width - 32, 16, true, ctx.onFill(ctx.palette.primary));
  let y = 56;
  y = write(ctx, c.subtitle, 16, y, ctx.width - 32, ctx.size, false, ctx.ink(ctx.palette.text)) + 8;
  (c.items || []).forEach((item, i) => {
    const lines = ctx.wrap(item, ctx.width - 58, ctx.size);
    const h = Math.max(28, lines.length * ctx.size * 1.4 + 12);
    const tint = ctx.ink(i % 2 ? "#F3F8F2" : "#FFF8E8");
    ctx.nodes.push({ kind: "rect", x: 12, y, w: ctx.width - 24, h, fill: tint, radius: 8 });
    diamond(ctx, 28, y + h / 2, 5, ctx.ink(i % 2 ? ctx.palette.primary : ctx.palette.accent));
    write(ctx, item, 42, y + 4, ctx.width - 64, ctx.size, false, ctx.ink(ctx.palette.text));
    y += h + 6;
  });
  return finish(ctx, y, { items: true, subtitle: true }, close);
}

export function iCanCards(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 4;
  y = write(ctx, c.subtitle, 16, y, ctx.width - 32, ctx.size) + 8;
  const items = c.items || [];
  const cols = ctx.width >= 400 ? 2 : 1;
  const gap = 10;
  const cw = (ctx.width - 32 - gap * (cols - 1)) / cols;
  for (let i = 0; i < items.length; i += cols) {
    const row = items.slice(i, i + cols);
    const rh = Math.max(...row.map(item => ctx.wrap(item, cw - 20, ctx.size).length * ctx.size * 1.4 + 36));
    row.forEach((item, j) => {
      const x = 16 + j * (cw + gap);
      const verb = item.split(/\s+/)[0]?.replace(/[.,]/g, "") || "I can";
      const fill = ctx.ink(j % 2 ? ctx.palette.secondary : ctx.palette.primary);
      ctx.nodes.push({ kind: "rect", x, y, w: cw, h: rh, fill: "#FFFFFF", stroke: ctx.ink(ctx.palette.border), radius: 12 });
      ctx.nodes.push({ kind: "rect", x: x + 8, y: y + 8, w: Math.min(cw - 16, ctx.measure(verb, 9, true) + 16), h: 16, fill, radius: 8 });
      write(ctx, verb, x + 8, y + 10, Math.min(cw - 16, ctx.measure(verb, 9, true) + 16), 9, true, ctx.onFill(j % 2 ? ctx.palette.secondary : ctx.palette.primary), false, "middle");
      write(ctx, item, x + 10, y + 28, cw - 20, ctx.size, false, ctx.ink(ctx.palette.text));
    });
    y += rh + gap;
  }
  return finish(ctx, y, { items: true, subtitle: true }, close);
}
