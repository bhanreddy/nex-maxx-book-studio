import type { SkinContext } from "../draw";
import { chip, finish, ground, rules, write } from "../draw";

export function strategyPanel(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink("#FFF8E8"), 10);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: Math.min(180, ctx.width * .46), h: 28, fill: header, radius: 0 });
  ctx.nodes.push({ kind: "polygon", points: [[Math.min(180, ctx.width * .46), 0], [Math.min(200, ctx.width * .52), 14], [Math.min(180, ctx.width * .46), 28]], fill: header });
  write(ctx, "STUDY SKILLS", 12, 6, 150, 10, true, ctx.onFill(ctx.palette.primary));
  let y = write(ctx, c.title, 16, 40, ctx.width - 32, 16, true, ctx.ink(ctx.palette.text)) + 8;
  (c.steps || []).forEach((step, i) => {
    const h = Math.max(46, ctx.wrap(step.body, ctx.width - 78, ctx.size).length * ctx.size * 1.4 + 28);
    ctx.nodes.push({ kind: "rect", x: 14, y, w: ctx.width - 28, h, fill: "#FFFFFF", stroke: ctx.ink(ctx.palette.border), radius: 8 });
    for (let line = 18; line < h - 8; line += 14) ctx.nodes.push({ kind: "line", x: 48, y: y + line, x2: ctx.width - 28, y2: y + line, stroke: ctx.ink("#E6D3A8"), strokeWidth: .4 });
    chip(ctx, String(step.stepNumber), 22, y + 10, ctx.ink(i % 2 ? ctx.palette.secondary : ctx.palette.primary), 22);
    write(ctx, step.title, 52, y + 8, ctx.width - 80, ctx.size, true, ctx.ink(ctx.palette.primary));
    write(ctx, step.body, 52, y + 26, ctx.width - 80, ctx.size);
    y += h + 8;
  });
  return finish(ctx, y, { steps: true }, close);
}

export function stepLadder(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 6;
  y = write(ctx, c.subtitle, 16, y, ctx.width - 32, ctx.size) + 8;
  (c.steps || []).forEach((step, i) => {
    const last = i === (c.steps?.length || 1) - 1;
    const fill = ctx.ink(last ? "#166534" : ctx.palette.primary);
    const h = Math.max(52, ctx.wrap(step.body, ctx.width - 92, ctx.size).length * ctx.size * 1.4 + 30);
    ctx.nodes.push({ kind: "rect", x: 16, y, w: 36, h, fill, radius: 8 });
    write(ctx, String(step.stepNumber), 16, y + h / 2 - 10, 36, 14, true, ctx.onFill(last ? "#166534" : ctx.palette.primary), false, "middle");
    ctx.nodes.push({ kind: "rect", x: 52, y, w: ctx.width - 68, h, fill: "#FFFFFF", stroke: fill, radius: 8 });
    write(ctx, step.title, 64, y + 8, ctx.width - 92, ctx.size, true, fill);
    write(ctx, step.body, 64, y + 26, ctx.width - 92, ctx.size);
    y += h + 8;
  });
  return finish(ctx, y, { steps: true, subtitle: true }, close);
}

export function pulseCheck(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: ctx.width, h: 40, fill: header });
  write(ctx, c.title, 16, 8, ctx.width - 32, 16, true, ctx.onFill(ctx.palette.primary));
  let y = 52;
  (c.questions || []).forEach((q, i) => {
    const promptH = ctx.wrap(q.prompt, ctx.width - 78, ctx.size).length * ctx.size * 1.4;
    const h = promptH + (q.options?.length ? q.options.length * (ctx.size * 1.4 + 4) : 28) + 36;
    ctx.nodes.push({ kind: "rect", x: 12, y, w: ctx.width - 24, h, fill: "#FFFFFF", stroke: ctx.ink(ctx.palette.border), radius: 12 });
    ctx.nodes.push({ kind: "ellipse", x: 32, y: y + 22, rx: 12, ry: 12, fill: header });
    write(ctx, String(i + 1), 20, y + 12, 24, 11, true, ctx.onFill(ctx.palette.primary), false, "middle");
    let qy = write(ctx, q.prompt, 50, y + 8, ctx.width - 78, ctx.size, true, ctx.ink(ctx.palette.text));
    (q.options || []).forEach((opt, k) => { qy = write(ctx, `${String.fromCharCode(65 + k)}. ${opt}`, 50, qy + 2, ctx.width - 78, ctx.size) + 2; });
    if (ctx.teacher && q.answer) qy = write(ctx, `Answer: ${q.answer}`, 50, qy + 4, ctx.width - 78, ctx.size, true, ctx.ink(ctx.palette.secondary));
    else if (!q.options?.length) qy = rules(ctx, 50, qy + 2, ctx.width - 86);
    qy = write(ctx, "Confidence: learning  ·  practising  ·  confident", 50, qy + 2, ctx.width - 78, 9, false, ctx.ink(ctx.palette.secondary));
    y += Math.max(h, qy - y) + 10;
  });
  return finish(ctx, y, { questions: true }, close);
}

export function lightningLane(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 14);
  let y = write(ctx, c.title, 16, 10, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 10;
  const questions = c.questions || [];
  const cols = ctx.width >= 400 ? 2 : 1;
  const gap = 10;
  const cw = (ctx.width - 32 - gap * (cols - 1)) / cols;
  for (let i = 0; i < questions.length; i += cols) {
    const row = questions.slice(i, i + cols);
    const rh = Math.max(88, ...row.map(q => ctx.wrap(q.prompt, cw - 20, ctx.size + 2, true).length * (ctx.size + 2) * 1.35 + 48));
    row.forEach((q, j) => {
      const x = 16 + j * (cw + gap);
      const fill = ctx.ink((i + j) % 2 ? ctx.palette.secondary : ctx.palette.primary);
      ctx.nodes.push({ kind: "rect", x, y, w: cw, h: rh, fill: "#FFFFFF", stroke: fill, strokeWidth: 1.4, radius: 12 });
      ctx.nodes.push({ kind: "rect", x, y, w: cw, h: 6, fill, radius: 0 });
      let qy = write(ctx, q.prompt, x + 10, y + 12, cw - 20, ctx.size + 2, true, ctx.ink(ctx.palette.text));
      qy = write(ctx, "My shortcut", x + 10, qy + 4, cw - 20, 9, true, fill);
      if (ctx.teacher && q.answer) write(ctx, q.answer, x + 10, qy + 2, cw - 20, ctx.size, true, ctx.ink(ctx.palette.secondary));
      else rules(ctx, x + 10, qy, cw - 20);
    });
    y += rh + gap;
  }
  return finish(ctx, y, { questions: true }, close);
}

export function practicePath(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  const tiers = ["Build", "Apply", "Explain"];
  let y = 14;
  let x = 16;
  tiers.forEach((tier, i) => {
    const fill = ctx.ink([ctx.palette.primary, ctx.palette.secondary, "#166534"][i]);
    const w = ctx.measure(tier, 10, true) + 18;
    ctx.nodes.push({ kind: "rect", x, y, w, h: 18, fill, radius: 9 });
    write(ctx, tier, x, y + 3, w, 10, true, ctx.onFill([ctx.palette.primary, ctx.palette.secondary, "#166534"][i]), false, "middle");
    x += w + 8;
  });
  y = 42;
  y = write(ctx, c.title, 16, y, ctx.width - 32, 16, true, ctx.ink(ctx.palette.primary)) + 8;
  return finish(ctx, y, {}, close);
}

export function showWhatYouKnow(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 10);
  let y = write(ctx, c.title, 16, 12, ctx.width - 32, 18, true, ctx.ink(ctx.palette.primary)) + 10;
  (c.questions || []).forEach((q, i) => {
    const mark = q.points ? `${q.points} ${q.points === 1 ? "mark" : "marks"}` : "Show your work";
    const markW = ctx.measure(mark, 9, true) + 14;
    const promptH = ctx.wrap(q.prompt, ctx.width - 48, ctx.size).length * ctx.size * 1.4 + 16;
    ctx.nodes.push({ kind: "rect", x: 14, y, w: ctx.width - 28, h: promptH + 28, fill: "#FFFFFF", stroke: ctx.ink(ctx.palette.border), radius: 8 });
    write(ctx, `${i + 1}.  ${q.prompt}`, 24, y + 8, ctx.width - markW - 48, ctx.size, false, ctx.ink(ctx.palette.text));
    ctx.nodes.push({ kind: "rect", x: ctx.width - markW - 24, y: y + 8, w: markW, h: 16, fill: ctx.ink(ctx.palette.accent), radius: 8 });
    write(ctx, mark, ctx.width - markW - 24, y + 10, markW, 9, true, ctx.onFill(ctx.palette.accent), false, "middle");
    if (ctx.teacher && q.answer) y = write(ctx, `Answer: ${q.answer}`, 24, y + promptH, ctx.width - 48, ctx.size, true, ctx.ink(ctx.palette.secondary)) + 12;
    else y = rules(ctx, 24, y + promptH - 8, ctx.width - 52) + 8;
  });
  return finish(ctx, y, { questions: true }, close);
}

export function makersBench(ctx: SkinContext) {
  const c = ctx.block.semanticContent;
  const close = ground(ctx, ctx.ink(ctx.palette.surface), 12);
  const header = ctx.ink(ctx.palette.primary);
  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w: ctx.width, h: 44, fill: header });
  write(ctx, c.title, 16, 6, ctx.width - 32, 16, true, ctx.onFill(ctx.palette.primary));
  write(ctx, c.subtitle, 16, 24, ctx.width - 32, 10, false, ctx.onFill(ctx.palette.primary));
  let y = 56;
  if (c.materials?.length) {
    y = write(ctx, "MATERIALS", 16, y, ctx.width - 32, 9, true, ctx.ink(ctx.palette.secondary)) + 4;
    let x = 16;
    c.materials.forEach((item, i) => {
      const w = Math.min(ctx.width - 32, ctx.measure(item, 10, true) + 16);
      if (x + w > ctx.width - 16) { x = 16; y += 24; }
      const fill = ctx.ink(i % 2 ? ctx.palette.accent : ctx.palette.secondary);
      ctx.nodes.push({ kind: "rect", x, y, w, h: 18, fill, radius: 9 });
      write(ctx, item, x, y + 3, w, 10, true, ctx.onFill(i % 2 ? ctx.palette.accent : ctx.palette.secondary), false, "middle");
      x += w + 6;
    });
    y += 30;
  }
  (c.steps || []).forEach((step, i) => {
    const h = Math.max(48, ctx.wrap(step.body, ctx.width - 80, ctx.size).length * ctx.size * 1.4 + 28);
    ctx.nodes.push({ kind: "rect", x: 14, y, w: ctx.width - 28, h, fill: "#FFFFFF", stroke: ctx.ink(ctx.palette.border), radius: 10 });
    ctx.nodes.push({ kind: "rect", x: 14, y, w: 8, h, fill: ctx.ink(i % 2 ? ctx.palette.secondary : ctx.palette.primary), radius: 0 });
    write(ctx, `${step.stepNumber}  ${step.title}`, 32, y + 8, ctx.width - 60, ctx.size, true, ctx.ink(ctx.palette.primary));
    write(ctx, step.body, 32, y + 26, ctx.width - 60, ctx.size);
    y += h + 8;
  });
  return finish(ctx, y, { materials: true, steps: true, subtitle: true }, close);
}
