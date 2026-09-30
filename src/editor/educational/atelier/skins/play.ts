import type { SkinContext } from "../draw";
import { finish, ground, rules, write } from "../draw";

export function whoAmI(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 16, y: 14, w: ctx.width - 32, h: 36, fill: header, radius: 18 });
  write(ctx, c.title || "Who am I?", 16, 22, ctx.width - 32, 16, true, ctx.onFill(ctx.palette.primary), false, "middle");
  let y = 62;
  (c.items || []).forEach((item, i) => {
    const h = Math.max(28, ctx.wrap(item, ctx.width - 64, ctx.size).length * ctx.size * 1.4 + 12);
    const fill = ctx.ink(i % 2 ? ctx.palette.secondary : ctx.palette.primary);
    ctx.nodes.push({ kind: "rect", x: 20, y, w: ctx.width - 40, h, fill, radius: h / 2 });
    write(ctx, item, 32, y + 4, ctx.width - 64, ctx.size, true, ctx.onFill(i % 2 ? ctx.palette.secondary : ctx.palette.primary), false, "middle");
    y += h + 6;
  });
  ctx.nodes.push({ kind: "rect", x: 16, y: y + 4, w: ctx.width - 32, h: 48, fill: "#FFFFFF", stroke: header, strokeWidth: 1.4, radius: 12 });
  write(ctx, "Who am I?", 28, y + 8, ctx.width - 56, 11, true, header);
  y = rules(ctx, 28, y + 24, ctx.width - 60) + 8;
  return finish(ctx, y, { items: true }, close);
}

export function orderLadder(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 8;
  const items = c.items || [];
  const mid = Math.ceil(items.length / 2) || 1;
  const cols = ctx.width >= 380 ? 2 : 1;
  const gap = 12;
  const cw = cols === 2 ? (ctx.width - 32 - gap) / 2 : ctx.width - 32;
  const left = items.slice(0, mid);
  const right = items.slice(mid);
  const paint = (list: string[], x: number, label: string, fill: string) => {
    ctx.nodes.push({ kind: "rect", x, y, w: cw, h: 22, fill, radius: 8 });
    write(ctx, label, x, y + 4, cw, 11, true, ctx.onFill(fill), false, "middle");
    let ly = y + 28;
    list.forEach((item, i) => {
      ctx.nodes.push({ kind: "rect", x, y: ly, w: 22, h: 22, fill, radius: 4 });
      write(ctx, String(i + 1), x, ly + 4, 22, 10, true, ctx.onFill(fill), false, "middle");
      ly = write(ctx, item, x + 28, ly, cw - 28, ctx.size) + 8;
    });
    return ly;
  };
  const leftEnd = paint(left.length ? left : items, 16, "Same", ctx.ink(ctx.palette.primary));
  const rightEnd = cols === 2 ? paint(right.length ? right : items, 16 + cw + gap, "Different", ctx.ink(ctx.palette.secondary)) : leftEnd;
  y = Math.max(leftEnd, rightEnd) + 6;
  ctx.nodes.push({ kind: "rect", x: 16, y, w: 8, h: 18, fill: ctx.ink(ctx.palette.accent) });
  y = write(ctx, "Ascending  ·  smallest to largest", 30, y, ctx.width - 46, 11, true, ctx.ink(ctx.palette.text)) + 10;
  return finish(ctx, y, { items: true }, close);
}

export function slipAndRepair(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  const y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 10;
  const items = c.items || [];
  const pair = items.length ? items : [c.calloutText || ""];
  const cols = ctx.width >= 380 && pair.length > 1 ? 2 : 1;
  const cw = cols === 2 ? (ctx.width - 36) / 2 : ctx.width - 32;
  const labels = ["The slip", "The repair"];
  const fills = [ctx.ink("#A84432"), ctx.ink("#166534")];
  const bases = ["#A84432", "#166534"];
  let bottom = y;
  pair.slice(0, 2).forEach((item, i) => {
    const x = 16 + (cols === 2 ? i * (cw + 8) : 0);
    const h = ctx.wrap(item, cw - 20, ctx.size).length * ctx.size * 1.4 + 36;
    ctx.nodes.push({ kind: "rect", x, y, w: cw, h, fill: fills[i] || fills[0], radius: 10 });
    write(ctx, labels[i] || "Note", x + 10, y + 6, cw - 20, 10, true, ctx.onFill(bases[i] || bases[0]));
    write(ctx, item, x + 10, y + 22, cw - 20, ctx.size, false, ctx.onFill(bases[i] || bases[0]));
    bottom = Math.max(bottom, y + h);
  });
  return finish(ctx, bottom + 10, { items: true, callout: true }, close);
}

export function wonderWindow(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 16);
  const fill = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 14, y: 14, w: ctx.width - 28, h: 86, fill, radius: 16 });
  ctx.nodes.push({ kind: "ellipse", x: ctx.width - 48, y: 36, rx: 16, ry: 16, fill: ctx.ink(ctx.palette.accent) });
  let y = write(ctx, c.title, 28, 22, ctx.width - 90, 16, true, ctx.onFill(ctx.palette.primary));
  y = write(ctx, c.calloutText, 28, y + 4, ctx.width - 70, ctx.size, false, ctx.onFill(ctx.palette.primary)) + 16;
  return finish(ctx, Math.max(y, 112), { callout: true }, close);
}

export function stationBoard(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 10;
  const items = c.items?.length ? c.items : ["Think", "Pair", "Share"];
  const cols = Math.min(3, ctx.width >= 420 ? items.length : 1);
  const gap = 8;
  const cw = (ctx.width - 32 - gap * (cols - 1)) / cols;
  const rh = Math.max(...items.map(item => ctx.wrap(item, cw - 16, ctx.size).length * ctx.size * 1.4 + 36));
  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 16 + col * (cw + gap);
    const yy = y + row * (rh + gap);
    const fill = ctx.ink([ctx.palette.primary, ctx.palette.secondary, ctx.palette.accent][i % 3]);
    ctx.nodes.push({ kind: "rect", x, y: yy, w: cw, h: rh, fill: "#FFFFFF", stroke: fill, radius: 12 });
    ctx.nodes.push({ kind: "rect", x, y: yy, w: cw, h: 8, fill, radius: 0 });
    if (col < cols - 1 && row === 0) ctx.nodes.push({ kind: "line", x: x + cw, y: yy + rh / 2, x2: x + cw + gap, y2: yy + rh / 2, stroke: fill, strokeWidth: 2 });
    write(ctx, item, x + 8, yy + 16, cw - 16, ctx.size, true, ctx.ink(ctx.palette.text));
  });
  y += Math.ceil(items.length / cols) * (rh + gap);
  return finish(ctx, y, { items: true }, close);
}

export function wordTiles(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 10;
  (c.items || []).forEach((item, i) => {
    const [term, ...rest] = item.split(/—|–|:/);
    const body = rest.join(" ").trim() || item;
    const h = ctx.wrap(body, ctx.width - 48, ctx.size).length * ctx.size * 1.4 + 36;
    const fills = [ctx.palette.primary, ctx.palette.secondary, ctx.palette.accent];
    const fill = ctx.ink(fills[i % 3]);
    ctx.nodes.push({ kind: "rect", x: 14, y, w: ctx.width - 28, h, fill: "#FFFFFF", stroke: ctx.ink(ctx.palette.border), radius: 10 });
    ctx.nodes.push({ kind: "rect", x: 14, y, w: 8, h, fill, radius: 0 });
    write(ctx, term.trim(), 32, y + 8, ctx.width - 56, ctx.size, true, fill);
    write(ctx, body, 32, y + 26, ctx.width - 56, ctx.size);
    y += h + 8;
  });
  return finish(ctx, y, { items: true }, close);
}

export function lensSplit(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 10;
  const items = c.items || [];
  const cols = ctx.width >= 380 && items.length > 1 ? 2 : 1;
  const cw = cols === 2 ? (ctx.width - 36) / 2 : ctx.width - 32;
  const labels = ["Place value", "Face value"];
  let bottom = y;
  items.slice(0, 2).forEach((item, i) => {
    const x = 16 + i * (cw + 8);
    const h = ctx.wrap(item, cw - 20, ctx.size).length * ctx.size * 1.4 + 40;
    const fill = ctx.ink(i ? ctx.palette.secondary : ctx.palette.primary);
    ctx.nodes.push({ kind: "rect", x, y, w: cw, h, fill: "#FFFFFF", stroke: fill, radius: 12 });
    ctx.nodes.push({ kind: "rect", x, y, w: cw, h: 22, fill, radius: 0 });
    write(ctx, labels[i] || `Lens ${i + 1}`, x, y + 4, cw, 11, true, ctx.onFill(i ? ctx.palette.secondary : ctx.palette.primary), false, "middle");
    write(ctx, item, x + 10, y + 28, cw - 20, ctx.size);
    bottom = Math.max(bottom, y + h);
  });
  y = bottom + 8;
  if (c.calloutText) {
    ctx.nodes.push({ kind: "rect", x: 16, y, w: ctx.width - 32, h: ctx.wrap(c.calloutText, ctx.width - 56, ctx.size, true).length * ctx.size * 1.4 + 16, fill: ctx.ink(ctx.palette.primary), radius: 8 });
    y = write(ctx, c.calloutText, 28, y + 6, ctx.width - 56, ctx.size, true, ctx.onFill(ctx.palette.primary)) + 12;
  }
  return finish(ctx, y, { items: true, callout: true }, close);
}

export function sparkPrompt(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  ctx.nodes.push({ kind: "rect", x: 16, y: 14, w: 92, h: 18, fill: ctx.ink(ctx.palette.accent), radius: 9 });
  write(ctx, "Recall", 16, 16, 46, 10, true, ctx.onFill(ctx.palette.accent), false, "middle");
  write(ctx, "Predict", 62, 16, 46, 10, true, ctx.onFill(ctx.palette.accent), false, "middle");
  const y = write(ctx, c.title, 16, 42, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 8;
  return finish(ctx, y, {}, close);
}

export function readinessStrip(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 10);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: 8, h: 64, fill: header });
  const y = write(ctx, c.title, 20, 10, ctx.width - 36, 16, true, header) + 6;
  return finish(ctx, y, {}, close);
}
