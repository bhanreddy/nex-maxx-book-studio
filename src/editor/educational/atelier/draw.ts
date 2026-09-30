import type { BlockMotif, SmartBlockInstance } from "../../../domain/educational/blockSchema";
import type { PublicationPalette, SceneMotifFrame, SceneNode } from "../publicationScene";

export interface Box { x: number; y: number; w: number; h: number }
export interface UsedFields {
  items?: boolean;
  steps?: boolean;
  questions?: boolean;
  number?: boolean;
  callout?: boolean;
  passage?: boolean;
  subtitle?: boolean;
  materials?: boolean;
}
export interface SkinContext {
  block: SmartBlockInstance;
  palette: PublicationPalette;
  width: number;
  size: number;
  serif: boolean;
  teacher: boolean;
  nodes: SceneNode[];
  warnings: string[];
  frames: SceneMotifFrame[];
  ink: (color: string) => string;
  onFill: (fill: string) => string;
  wrap: (text: string, max: number, size: number, bold?: boolean, serif?: boolean) => string[];
  measure: (text: string, size: number, bold?: boolean, serif?: boolean) => number;
  artwork: (kind: string, x: number, y: number, w: number, h: number, p: PublicationPalette, opacity?: number) => SceneNode[];
  box: (id: string, fallback: Box, role: BlockMotif["role"], kind?: string) => Box;
}
export const PLACE_INKS = ["#7E2254", "#C4654A", "#0F766E", "#3730A3", "#1D4ED8", "#166534", "#92400E", "#25374A", "#6D28D9"];

export function write(ctx: SkinContext, value: string | undefined, x: number, y: number, tw: number, fs: number, bold = false, fill?: string, serif = false, align: "start" | "middle" | "end" = "start"): number {
  if (!value) return y;
  const colour = fill || ctx.ink(ctx.palette.text);
  const lines = ctx.wrap(String(value), Math.max(12, tw), fs, bold, serif);
  lines.forEach((t, i) => ctx.nodes.push({
    kind: "text",
    x: align === "middle" ? x + tw / 2 : align === "end" ? x + tw : x,
    y: y + fs + i * fs * 1.4,
    text: t, size: fs, fill: colour, bold, font: serif ? "serif" : "sans",
    align,
  }));
  return y + lines.length * fs * 1.4;
}
export function ground(ctx: SkinContext, fill: string, radius = 12): (height: number) => void {
  const node: SceneNode = { kind: "rect", x: 0, y: 0, w: ctx.width, h: 12, fill, radius };
  ctx.nodes.push(node);
  return (height) => { if (node.kind === "rect") node.h = height; };
}
export function band(ctx: SkinContext, y: number, h: number, from: string, to: string, id: string) {
  ctx.nodes.push({ kind: "gradient", id, x1: 0, y1: y, x2: ctx.width, y2: y, from, to });
  ctx.nodes.push({ kind: "rect", x: 0, y, w: ctx.width, h, fill: from, gradientId: id, radius: 0 });
}
export function rules(ctx: SkinContext, x: number, y: number, w: number, count = 1): number {
  const space = Math.max(16, ctx.block.styleOverrides.answerSpacePt ?? 22);
  for (let i = 1; i <= count; i++) ctx.nodes.push({ kind: "line", x, y: y + space * i, x2: x + w, y2: y + space * i, stroke: ctx.ink(ctx.palette.border), strokeWidth: .7 });
  return y + space * count + 8;
}
export function diamond(ctx: SkinContext, cx: number, cy: number, r: number, fill: string) {
  ctx.nodes.push({ kind: "polygon", points: [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], fill });
}
export function leader(ctx: SkinContext, x1: number, y1: number, x2: number, y2: number, stroke: string) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 10;
  ctx.nodes.push({ kind: "path", d: `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`, fill: "none", stroke, strokeWidth: 1.35 });
}
export function chip(ctx: SkinContext, label: string, x: number, y: number, fill: string, wide = 28): number {
  ctx.nodes.push({ kind: "rect", x, y, w: wide, h: 22, fill, radius: 11 });
  write(ctx, label, x, y + 4, wide, 10, true, ctx.onFill(fill), false, "middle");
  return wide;
}

/** Draws any semantic fields the skin did not already compose, so a look change never hides curriculum text. */
export function flowRemaining(ctx: SkinContext, y: number, used: UsedFields): number {
  const { block: b, palette: p, width, size } = ctx;
  const c = b.semanticContent;
  const pad = 16;
  const inner = width - pad * 2;
  const ink = ctx.ink(p.text);
  if (!used.subtitle && c.subtitle) y = write(ctx, c.subtitle, pad, y, inner, size, false, ink) + 8;
  if (!used.materials && c.materials?.length) {
    y = write(ctx, "YOU WILL NEED", pad, y, inner, 9, true, ctx.ink(p.secondary)) + 4;
    y = write(ctx, c.materials.join("  ·  "), pad, y, inner, size, false, ink) + 10;
  }
  if (!used.callout && c.calloutText) {
    const fs = size + 1;
    const h = ctx.wrap(c.calloutText, inner - 24, fs, true).length * fs * 1.4 + 20;
    ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h, fill: ctx.ink(p.primary), radius: 10 });
    y = write(ctx, c.calloutText, pad + 12, y + 8, inner - 24, fs, true, ctx.onFill(p.primary)) + 16;
  }
  if (!used.passage && c.passage) {
    const h = ctx.wrap(c.passage, inner - 24, size, false, true).length * size * 1.4 + 22;
    ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h, fill: "#FFFFFF", stroke: ctx.ink(p.border), radius: 8 });
    y = write(ctx, c.passage, pad + 12, y + 8, inner - 24, size, false, ink, true) + 16;
  }
  if (!used.items && c.items?.length) {
    c.items.forEach((item, i) => {
      const fill = i % 2 ? ctx.ink(p.secondary) : ctx.ink(p.primary);
      chip(ctx, String(i + 1), pad, y, fill, 22);
      y = write(ctx, item, pad + 30, y, inner - 30, size, false, ink) + 10;
    });
  }
  if (!used.steps && c.steps?.length) {
    c.steps.forEach((step, i) => {
      const fill = i % 2 ? ctx.ink(p.secondary) : ctx.ink(p.primary);
      chip(ctx, String(step.stepNumber), pad, y, fill, 22);
      y = write(ctx, step.title, pad + 30, y, inner - 30, size, true, ctx.ink(p.primary)) + 3;
      y = write(ctx, step.body, pad + 30, y, inner - 30, size, false, ink) + 12;
    });
  }
  if (!used.questions && c.questions?.length) {
    c.questions.forEach((q, i) => {
      chip(ctx, String(i + 1), pad, y + 8, ctx.ink(p.primary), 22);
      let qy = write(ctx, q.prompt, pad + 36, y + 8, inner - 48, size, false, ink) + 6;
      (q.options || []).forEach((opt, k) => { qy = write(ctx, `${String.fromCharCode(65 + k)}. ${opt}`, pad + 36, qy, inner - 48, size) + 4; });
      if (ctx.teacher && q.answer) qy = write(ctx, `Answer: ${q.answer}`, pad + 36, qy, inner - 48, size, true, ctx.ink(p.secondary)) + 8;
      else if (!q.options?.length) qy = rules(ctx, pad + 36, qy, inner - 48);
      if (q.points) qy = write(ctx, `${q.points} ${q.points === 1 ? "mark" : "marks"}`, pad + 36, qy, inner - 48, 9, true, ctx.ink(p.primary)) + 4;
      y = qy + 8;
    });
  }
  if (!used.number && c.numberValue !== undefined) y = write(ctx, formatNumber(c.numberValue, c.numberSystem), pad, y, inner, 22, true, ctx.ink(p.primary)) + 8;
  if (c.footnote) y = write(ctx, c.footnote, pad, y + 4, inner, 10, false, ink) + 8;
  if (c.qrUrl) {
    y = write(ctx, `Explore: ${c.qrUrl}`, pad, y, inner, 10, false, ctx.ink(p.primary)) + 8;
    ctx.warnings.push("Resource address is printed as text; no unverified QR code is generated.");
  }
  if (ctx.width < 240) ctx.warnings.push("Narrow block: review at actual print size.");
  return y + 14;
}

export function finish(ctx: SkinContext, y: number, used: UsedFields, close?: (height: number) => void) {
  const height = Math.max(72, flowRemaining(ctx, y, used));
  close?.(height);
  return { height, used };
}

export function formatNumber(value: number, system?: "indian" | "international"): string {
  const safe = Math.max(0, Math.min(999999999, Math.floor(value)));
  return new Intl.NumberFormat(system === "international" ? "en-US" : "en-IN").format(safe);
}
export function placeNames(count: number, system?: "indian" | "international"): string[] {
  const indian = system !== "international";
  const names = indian ? ["O", "T", "H", "Th", "TTh", "L", "TL", "Cr", "TCr"] : ["O", "T", "H", "Th", "TTh", "HTh", "M", "TM", "HM"];
  return Array.from({ length: count }, (_, i) => names[count - 1 - i] || "");
}
