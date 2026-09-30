import type { SkinContext } from "../draw";
import { finish, ground, rules, write } from "../draw";

export type Chrome = "tab" | "ribbon" | "stamp" | "notebook" | "window";

export function chromePanel(ctx: SkinContext, chrome: Chrome) {
  const c = ctx.block.semanticContent;
  const paper = chrome === "notebook" ? ctx.ink("#FBF7F0") : ctx.ink(ctx.palette.surface);
  const close = ground(ctx, paper, chrome === "window" ? 16 : 10);
  const header = ctx.ink(ctx.palette.primary);
  let y = 14;
  if (chrome === "ribbon") {
    ctx.nodes.push({ kind: "polygon", points: [[0, 10], [ctx.width - 22, 10], [ctx.width - 6, 28], [ctx.width - 22, 46], [0, 46]], fill: header });
    y = write(ctx, c.title, 14, 16, ctx.width - 48, 14, true, ctx.onFill(ctx.palette.primary)) + 14;
  } else if (chrome === "stamp") {
    ctx.nodes.push({ kind: "ellipse", x: 36, y: 32, rx: 22, ry: 22, fill: header });
    write(ctx, (c.chapterNumber || "1").slice(0, 3), 18, 20, 36, 12, true, ctx.onFill(ctx.palette.primary), false, "middle");
    y = write(ctx, c.title, 66, 14, ctx.width - 82, 16, true, header) + 10;
  } else if (chrome === "notebook") {
    ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: 14, h: 80, fill: ctx.ink(ctx.palette.secondary) });
    for (let i = 0; i < 4; i++) ctx.nodes.push({ kind: "ellipse", x: 7, y: 16 + i * 16, rx: 3, ry: 3, fill: paper });
    y = write(ctx, c.title, 26, 12, ctx.width - 42, 16, true, header, true) + 8;
  } else if (chrome === "window") {
    ctx.nodes.push({ kind: "rect", x: 12, y: 12, w: ctx.width - 24, h: 48, fill: header, radius: 14 });
    y = write(ctx, c.title, 24, 22, ctx.width - 48, 16, true, ctx.onFill(ctx.palette.primary)) + 16;
  } else {
    ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: Math.min(210, ctx.width * .55), h: 26, fill: header });
    y = write(ctx, c.title, 12, 4, Math.min(190, ctx.width * .5), 12, true, ctx.onFill(ctx.palette.primary)) + 12;
  }
  if (chrome === "notebook") {
    const lines = 3;
    for (let i = 1; i <= lines; i++) ctx.nodes.push({ kind: "line", x: 26, y: y + i * 16, x2: ctx.width - 16, y2: y + i * 16, stroke: ctx.ink(ctx.palette.border), strokeWidth: .5 });
  }
  return finish(ctx, y, {}, close);
}

export function bigPicture(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 8;
  const items = (c.items || []).slice(0, 4);
  const cols = ctx.width >= 380 ? 2 : 1;
  const cw = (ctx.width - 32 - (cols === 2 ? 10 : 0)) / cols;
  items.forEach((item, i) => {
    const x = 16 + (i % cols) * (cw + 10);
    const yy = y + Math.floor(i / cols) * 58;
    const fill = ctx.ink(i % 2 ? ctx.palette.secondary : ctx.palette.primary);
    ctx.nodes.push({ kind: "rect", x, y: yy, w: cw, h: 50, fill: "#FFFFFF", stroke: fill, radius: 10 });
    ctx.nodes.push({ kind: "ellipse", x: x + 18, y: yy + 25, rx: 10, ry: 10, fill });
    write(ctx, item, x + 34, yy + 12, cw - 44, ctx.size, true, ctx.ink(ctx.palette.text));
  });
  y += Math.ceil(items.length / cols) * 58 + 8;
  if (c.calloutText) y = write(ctx, c.calloutText, 16, y, ctx.width - 32, ctx.size, true, ctx.ink(ctx.palette.primary)) + 8;
  return finish(ctx, y, { items: true, callout: true }, close);
}

export function exitSlip(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: ctx.width, h: 36, fill: header });
  write(ctx, c.title, 16, 8, ctx.width - 32, 14, true, ctx.onFill(ctx.palette.primary));
  let y = 48;
  y = write(ctx, "Solve", 16, y, ctx.width - 32, 11, true, ctx.ink(ctx.palette.primary)) + 2;
  y = rules(ctx, 16, y, ctx.width - 32);
  y = write(ctx, "I still wonder", 16, y, ctx.width - 32, 11, true, ctx.ink(ctx.palette.secondary)) + 2;
  y = rules(ctx, 16, y, ctx.width - 32);
  return finish(ctx, y, {}, close);
}

export function journalSkin(ctx: SkinContext) {
  return chromePanel(ctx, "notebook");
}
