import type { SkinContext } from "../draw";
import { PLACE_INKS, finish, formatNumber, ground, leader, placeNames, write } from "../draw";

export function placeStack(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: ctx.width, h: 42, fill: header, radius: 0 });
  write(ctx, c.title, 16, 8, ctx.width - 32, 16, true, ctx.onFill(ctx.palette.primary));
  let y = 54;
  y = write(ctx, c.subtitle, 16, y, ctx.width - 32, ctx.size) + 8;
  const value = c.numberValue;
  if (value !== undefined) {
    const digits = String(Math.max(0, Math.min(999999999, Math.floor(value)))).padStart(4, "0").split("");
    const names = placeNames(digits.length, c.numberSystem);
    const tileW = Math.min(54, (ctx.width - 36) / digits.length);
    const origin = 16;
    digits.forEach((digit, i) => {
      const colour = ctx.ink(PLACE_INKS[(digits.length - 1 - i) % PLACE_INKS.length]);
      const x = origin + i * (tileW + 6);
      const stackH = 14 + Number(digit) * 3;
      ctx.nodes.push({ kind: "rect", x, y: y + 70 - stackH, w: tileW, h: stackH, fill: colour, radius: 4, opacity: .9 });
      ctx.nodes.push({ kind: "rect", x, y: y + 78, w: tileW, h: 36, fill: colour, radius: 6 });
      write(ctx, digit, x, y + 86, tileW, 16, true, ctx.onFill(PLACE_INKS[(digits.length - 1 - i) % PLACE_INKS.length]), false, "middle");
      write(ctx, names[i], x, y + 116, tileW, 8, true, colour, false, "middle");
    });
    const arrowX = origin + digits.length * (tileW + 6) + 4;
    if (arrowX < ctx.width - 80) {
      ctx.nodes.push({ kind: "polygon", points: [[arrowX, y + 90], [arrowX + 16, y + 96], [arrowX, y + 102]], fill: header });
    }
    y += 140;
    (c.items || []).forEach((item, i) => {
      const colour = ctx.ink(PLACE_INKS[(digits.length - 1 - (i % digits.length)) % PLACE_INKS.length]);
      const rowH = Math.max(28, ctx.wrap(item, ctx.width - 56, ctx.size).length * ctx.size * 1.4 + 10);
      ctx.nodes.push({ kind: "rect", x: 28, y, w: ctx.width - 44, h: rowH, fill: "#FFFFFF", stroke: colour, strokeWidth: 1.2, radius: 8 });
      leader(ctx, 22, y + rowH / 2, 28, y + rowH / 2, colour);
      write(ctx, item, 38, y + 4, ctx.width - 70, ctx.size, false, ctx.ink(ctx.palette.text));
      y += rowH + 6;
    });
    const parts = digits.map((d, i) => Number(d) * 10 ** (digits.length - 1 - i)).filter(Boolean);
    const equation = `${parts.map(n => formatNumber(n, c.numberSystem)).join(" + ")} = ${formatNumber(value, c.numberSystem)}`;
    const eqH = ctx.wrap(equation, ctx.width - 48, ctx.size, true).length * ctx.size * 1.4 + 16;
    ctx.nodes.push({ kind: "rect", x: 16, y, w: ctx.width - 32, h: eqH, fill: ctx.ink("#166534"), radius: 8 });
    y = write(ctx, equation, 28, y + 6, ctx.width - 56, ctx.size, true, ctx.onFill("#166534")) + 12;
    return finish(ctx, y, { subtitle: true, number: true, items: true }, close);
  }
  return finish(ctx, y, { subtitle: true }, close);
}

export function speechExample(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 6;
  if (c.numberValue !== undefined) {
    y = write(ctx, formatNumber(c.numberValue, c.numberSystem), 16, y, ctx.width - 32, 26, true, ctx.ink(ctx.palette.primary)) + 8;
  }
  const lines = c.items?.length ? c.items : [c.calloutText || c.subtitle || ""].filter(Boolean);
  lines.slice(0, 3).forEach((line, i) => {
    const bubble = ctx.box(`bubble-${i}`, { x: i % 2 ? 48 : 16, y, w: ctx.width - 64, h: 48 }, "bubble", "speech");
    const h = Math.max(44, ctx.wrap(line, bubble.w - 24, ctx.size, true).length * ctx.size * 1.4 + 18);
    const fill = ctx.ink(i % 2 ? ctx.palette.secondary : ctx.palette.primary);
    ctx.nodes.push({ kind: "rect", x: bubble.x, y: bubble.y, w: bubble.w, h, fill, radius: 16, motifId: `bubble-${i}` });
    const tailX = i % 2 ? bubble.x + bubble.w - 28 : bubble.x + 18;
    ctx.nodes.push({ kind: "polygon", points: [[tailX, bubble.y + h - 1], [tailX + 14, bubble.y + h - 1], [tailX + 4, bubble.y + h + 10]], fill, motifId: `bubble-${i}` });
    write(ctx, line, bubble.x + 12, bubble.y + 8, bubble.w - 24, ctx.size, true, ctx.onFill(i % 2 ? ctx.palette.secondary : ctx.palette.primary));
    y = bubble.y + h + 16;
  });
  return finish(ctx, y, { items: true, number: c.numberValue !== undefined, callout: Boolean(c.items?.length || c.calloutText) }, close);
}

export function beadTheatre(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink("#F4F8FF"), 12);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: ctx.width, h: 36, fill: header });
  write(ctx, c.title, 16, 8, ctx.width * .6, 14, true, ctx.onFill(ctx.palette.primary));
  const value = c.numberValue ?? 0;
  write(ctx, formatNumber(value, c.numberSystem), ctx.width * .55, 6, ctx.width * .4 - 12, 16, true, ctx.onFill(ctx.palette.primary), false, "middle");
  const digits = String(Math.max(0, Math.min(999999999, Math.floor(value)))).padStart(5, "0").split("");
  const names = placeNames(digits.length, c.numberSystem);
  const frameY = 52;
  const frameH = 150;
  ctx.nodes.push({ kind: "rect", x: 16, y: frameY, w: ctx.width - 32, h: frameH, fill: ctx.ink("#166534"), radius: 8 });
  ctx.nodes.push({ kind: "rect", x: 24, y: frameY + 10, w: ctx.width - 48, h: frameH - 28, fill: ctx.ink(ctx.palette.surface), radius: 4 });
  const innerX = 32;
  const innerW = ctx.width - 64;
  const col = innerW / digits.length;
  ctx.nodes.push({ kind: "clip", id: "bead-window", x: 24, y: frameY + 10, w: ctx.width - 48, h: frameH - 28, radius: 4 });
  digits.forEach((digit, i) => {
    const colour = ctx.ink(PLACE_INKS[i % PLACE_INKS.length]);
    const x = innerX + i * col + col / 2;
    ctx.nodes.push({ kind: "line", x, y: frameY + 18, x2: x, y2: frameY + frameH - 26, stroke: ctx.ink(ctx.palette.border), strokeWidth: 2, clipId: "bead-window" });
    for (let bead = 0; bead < Number(digit); bead++) {
      ctx.nodes.push({ kind: "ellipse", x, y: frameY + frameH - 36 - bead * 12, rx: Math.min(col * .28, 14), ry: 5, fill: colour, clipId: "bead-window" });
    }
    write(ctx, names[i], x - col / 2, frameY + frameH - 4, col, 9, true, ctx.ink(ctx.palette.text), false, "middle");
    write(ctx, digit, x - 10, frameY + frameH + 12, 20, 12, true, colour, false, "middle");
  });
  let y = frameY + frameH + 36;
  y = write(ctx, c.subtitle, 16, y, ctx.width - 32, ctx.size) + 6;
  return finish(ctx, y, { number: true, subtitle: true }, close);
}
