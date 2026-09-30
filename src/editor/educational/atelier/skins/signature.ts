import type { SkinContext, UsedFields } from "../draw";
import { finish, ground, write, rules, chip } from "../draw";

export type SignatureLayout =
  | "field-guide"
  | "story-ribbon"
  | "discovery-deck"
  | "learning-trail"
  | "question-theatre"
  | "editorial-folio"
  | "curiosity-passport"
  | "workshop-board";

export const SIGNATURE_LAYOUTS: { id: SignatureLayout; name: string; description: string }[] = [
  { id: "field-guide", name: "Field guide", description: "Naturalist specimen header · observation sequence · field notes" },
  { id: "story-ribbon", name: "Story ribbon", description: "Sweeping narrative ribbon · comfortable reading passage · story beats" },
  { id: "discovery-deck", name: "Discovery deck", description: "Balanced card deck grid · concept pills · hierarchical learning cards" },
  { id: "learning-trail", name: "Learning trail", description: "Connected milestone pathway · stepping stones · sequential procedure" },
  { id: "question-theatre", name: "Question theatre", description: "Dominant inquiry spotlight · illustrated thought bubbles · reflection stage" },
  { id: "editorial-folio", name: "Editorial folio", description: "Classical serif display · double fine rules · marginalia & folio layout" },
  { id: "curiosity-passport", name: "Curiosity passport", description: "Explorer passport folio · numbered visa stamps · official discovery seals" },
  { id: "workshop-board", name: "Workshop board", description: "Craft pinboard · washi tape tabs · materials tray & maker method" },
];

/** 1. FIELD GUIDE: Naturalist specimen study, sequential observation log, quiet field notes. */
function composeFieldGuide(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 6;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Specimen eyebrow
  ctx.nodes.push({ kind: "rect", x: pad, y: 14, w: 28, h: 3.5, fill: accent, radius: 1.5 });
  let y = write(ctx, c.unitBadge || "NATURALIST FIELD STUDY // SPECIMEN OBS-01", pad, 22, inner, 8.5, true, secondary) + 8;

  // Specimen plate on right when wide enough
  const showSpecimenPlate = w >= 280;
  const plateW = showSpecimenPlate ? Math.min(108, Math.floor(inner * 0.32)) : 0;
  const headingW = showSpecimenPlate ? inner - plateW - 12 : inner;
  const plateX = w - pad - plateW;
  const plateY = y;

  if (showSpecimenPlate) {
    ctx.nodes.push({ kind: "rect", x: plateX, y: plateY, w: plateW, h: 72, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 4 });
    ctx.nodes.push(...ctx.artwork("botanical", plateX + 4, plateY + 4, plateW - 8, 52, p, 0.85));
    write(ctx, "SPECIMEN OBS-1", plateX + 4, plateY + 58, plateW - 8, 7, true, secondary, false, "middle");
  }

  y = write(ctx, c.title, pad, y, headingW, w > 340 ? 25 : 20, true, primary, true) + 8;
  y = write(ctx, c.subtitle, pad, y, headingW, size, false, text, true) + (c.subtitle ? 10 : 0);
  if (showSpecimenPlate) y = Math.max(y, plateY + 80);

  // Field divider rule
  ctx.nodes.push({ kind: "line", x: pad, y, x2: w - pad, y2: y, stroke: border, strokeWidth: 0.7 });
  ctx.nodes.push({ kind: "rect", x: pad + 16, y: y - 2, w: 4, h: 4, fill: primary, radius: 1 });
  y += 12;

  // Intro text
  if (c.introText) {
    y = write(ctx, c.introText, pad, y, inner, size, false, text) + 12;
  }

  // Materials tray if present
  if (c.materials?.length) {
    used.materials = true;
    const matH = Math.max(34, ctx.wrap(c.materials.join("  ·  "), inner - 24, size).length * size * 1.4 + 20);
    ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: matH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.7, radius: 4 });
    ctx.nodes.push({ kind: "rect", x: pad, y, w: 4, h: matH, fill: secondary, radius: 2 });
    write(ctx, "FIELD APPARATUS", pad + 12, y + 6, inner - 24, 7.5, true, secondary);
    write(ctx, c.materials.join("  ·  "), pad + 12, y + 17, inner - 24, size, false, text);
    y += matH + 12;
  }

  // Observation sequence items
  const items = c.items || [];
  if (items.length) {
    used.items = true;
    for (let i = 0; i < items.length; i++) {
      const tagW = 54;
      const contentW = inner - tagW - 14;
      const textLines = ctx.wrap(items[i], contentW, size);
      const cardH = Math.max(56, textLines.length * size * 1.4 + 26);

      ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: cardH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.75, radius: 4 });
      ctx.nodes.push({ kind: "rect", x: pad + 8, y: y + 10, w: tagW, h: 18, fill: i % 2 ? secondary : primary, radius: 3 });
      write(ctx, `OBS · ${String(i + 1).padStart(2, "0")}`, pad + 8, y + 13, tagW, 8, true, ctx.onFill(i % 2 ? secondary : primary), false, "middle");

      write(ctx, items[i], pad + tagW + 14, y + 10, contentW, size, false, text, true);
      rules(ctx, pad + tagW + 14, y + cardH - 12, contentW, 1);
      y += cardH + 10;
    }
  }

  return finish(ctx, y + 4, used, close);
}

/** 2. STORY RIBBON: Sweeping color ribbon banner, comfortable reading passage, distinct story beats. */
function composeStoryRibbon(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 12;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Sweeping title ribbon banner
  const titleSize = w > 340 ? 26 : 21;
  const titleLines = ctx.wrap(c.title, inner - 32, titleSize, true);
  const headerH = Math.max(68, 48 + titleLines.length * titleSize * 1.35);

  ctx.nodes.push({ kind: "rect", x: 0, y: 0, w, h: headerH, fill: primary, radius: Math.min(radius, 12) });
  // Ribbon decorative swallowtail badge
  ctx.nodes.push({ kind: "polygon", points: [[w - 38, 0], [w - 14, 0], [w - 14, headerH + 10], [w - 26, headerH + 3], [w - 38, headerH + 10]], fill: accent });
  ctx.nodes.push({ kind: "ellipse", x: w - 52, y: headerH / 2, rx: 28, ry: 28, fill: accent, opacity: 0.18 });

  write(ctx, c.unitBadge || "STORY COLLECTION · CHAPTER PASSAGE", pad, 14, inner - 48, 8.5, true, ctx.onFill(primary));
  write(ctx, c.title, pad, 28, inner - 48, titleSize, true, ctx.onFill(primary));

  let y = headerH + 16;
  y = write(ctx, c.subtitle, pad, y, inner, size + 1, false, text, true) + (c.subtitle ? 10 : 0);
  y = write(ctx, c.introText, pad, y, inner, size, false, text) + (c.introText ? 12 : 0);

  // Story Reading Passage Card
  if (c.passage) {
    used.passage = true;
    const passageLines = ctx.wrap(c.passage, inner - 24, size, false, true);
    const passH = passageLines.length * size * 1.45 + 28;
    ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: passH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 8 });
    ctx.nodes.push({ kind: "rect", x: pad, y: y + 10, w: 4, h: passH - 20, fill: secondary, radius: 2 });
    write(ctx, c.passage, pad + 14, y + 12, inner - 28, size, false, text, true);
    y += passH + 14;
  }

  // Story Beats (Items)
  const items = c.items || [];
  if (items.length) {
    used.items = true;
    for (let i = 0; i < items.length; i++) {
      const beatH = Math.max(54, ctx.wrap(items[i], inner - 24, size).length * size * 1.4 + 32);
      ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: beatH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.7, radius: 8 });
      // Ribbon notch at card top-left
      ctx.nodes.push({ kind: "rect", x: pad + 12, y: y, w: 46, h: 16, fill: i % 2 ? accent : secondary, radius: 3 });
      write(ctx, `BEAT ${i + 1}`, pad + 12, y + 3, 46, 7.5, true, ctx.onFill(i % 2 ? accent : secondary), false, "middle");
      write(ctx, items[i], pad + 12, y + 22, inner - 24, size, false, text);
      y += beatH + 10;
    }
  }

  return finish(ctx, y + 4, used, close);
}

/** 3. DISCOVERY DECK: Balanced 2-column card deck grid, concept pills, hierarchical learning cards. */
function composeDiscoveryDeck(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 12;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Deck Masthead
  ctx.nodes.push({ kind: "rect", x: pad, y: 16, w: 22, h: 4, fill: accent, radius: 2 });
  const countLabel = c.items?.length ? ` · ${c.items.length} KEY CONCEPTS` : "";
  let y = write(ctx, c.unitBadge || `DISCOVERY DECK${countLabel}`, pad, 26, inner, 8.5, true, secondary) + 8;
  y = write(ctx, c.title, pad, y, inner, w > 340 ? 25 : 20, true, primary) + 8;
  y = write(ctx, c.subtitle, pad, y, inner, size, false, text) + (c.subtitle ? 10 : 0);
  y = write(ctx, c.introText, pad, y, inner, size, false, text) + (c.introText ? 12 : 0);

  const items = c.items || [];
  if (items.length) {
    used.items = true;
    const columns = w >= 360 ? 2 : 1;
    const gap = 12;
    const cardW = (inner - gap * (columns - 1)) / columns;

    for (let i = 0; i < items.length; i += columns) {
      // Balance heights for all cards in this row
      const rowHeights: number[] = [];
      for (let col = 0; col < columns && i + col < items.length; col++) {
        const itemText = items[i + col];
        const lines = ctx.wrap(itemText, cardW - 24, size);
        rowHeights.push(Math.max(76, lines.length * size * 1.4 + 48));
      }
      const rowCardH = Math.max(...rowHeights);

      for (let col = 0; col < columns && i + col < items.length; col++) {
        const index = i + col;
        const x = pad + col * (cardW + gap);
        const fill = index % 2 ? secondary : primary;

        // Tactile drop layer
        ctx.nodes.push({ kind: "rect", x: x + 3, y: y + 3, w: cardW, h: rowCardH, fill: border, radius: 8 });
        // Front card
        ctx.nodes.push({ kind: "rect", x, y, w: cardW, h: rowCardH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 8 });
        // Top concept pill
        ctx.nodes.push({ kind: "rect", x: x + 12, y: y + 10, w: 26, h: 18, fill, radius: 9 });
        write(ctx, String(index + 1).padStart(2, "0"), x + 12, y + 13, 26, 8.5, true, ctx.onFill(fill), false, "middle");

        write(ctx, items[index], x + 12, y + 36, cardW - 24, size, false, text);
      }
      y += rowCardH + gap;
    }
  }

  return finish(ctx, y + 4, used, close);
}

/** 4. LEARNING TRAIL: Stepping milestone trail, connecting path line, non-overlapping sequential procedure. */
function composeLearningTrail(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 12;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Trail Header
  ctx.nodes.push({ kind: "rect", x: pad, y: 16, w: 32, h: 4, fill: accent, radius: 2 });
  let y = write(ctx, c.unitBadge || "LEARNING TRAIL // SEQUENTIAL MILESTONES", pad, 26, inner, 8.5, true, secondary) + 8;
  y = write(ctx, c.title, pad, y, inner, w > 340 ? 25 : 20, true, primary) + 8;
  y = write(ctx, c.subtitle, pad, y, inner, size, false, text) + (c.subtitle ? 8 : 0);
  y = write(ctx, c.introText, pad, y, inner, size, false, text) + (c.introText ? 12 : 0);

  const items = c.items || [];
  if (items.length) {
    used.items = true;
    const trailNodeX = pad + 15;
    const cardX = pad + 38;
    const cardW = inner - 38;
    let prevNodeCenterY = 0;

    for (let i = 0; i < items.length; i++) {
      const cardH = Math.max(62, ctx.wrap(items[i], cardW - 22, size).length * size * 1.4 + 30);
      const nodeCenterY = y + cardH / 2;
      const fill = i % 2 ? secondary : primary;

      // Connecting vertical pathway between milestone nodes (never crossing cards)
      if (i > 0) {
        ctx.nodes.push({ kind: "line", x: trailNodeX, y: prevNodeCenterY + 14, x2: trailNodeX, y2: nodeCenterY - 14, stroke: border, strokeWidth: 2.2 });
      }

      // Milestone circular disc
      ctx.nodes.push({ kind: "ellipse", x: trailNodeX, y: nodeCenterY, rx: 13, ry: 13, fill });
      write(ctx, String(i + 1), trailNodeX - 10, nodeCenterY - 5.5, 20, 9.5, true, ctx.onFill(fill), false, "middle");

      // Milestone card
      ctx.nodes.push({ kind: "rect", x: cardX, y, w: cardW, h: cardH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 8 });
      ctx.nodes.push({ kind: "rect", x: cardX, y, w: 4, h: cardH, fill, radius: 2 });
      write(ctx, `MILESTONE ${i + 1}`, cardX + 12, y + 8, cardW - 24, 7.5, true, secondary);
      write(ctx, items[i], cardX + 12, y + 20, cardW - 24, size, false, text);

      prevNodeCenterY = nodeCenterY;
      y += cardH + 12;
    }
  }

  return finish(ctx, y + 4, used, close);
}

/** 5. QUESTION THEATRE: Theatrical marquee inquiry box, illustrated thought bubbles, dedicated reflection stage. */
function composeQuestionTheatre(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 14;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Top Theatrical Tag
  ctx.nodes.push({ kind: "rect", x: pad, y: 14, w: inner, h: 24, fill: primary, radius: 5 });
  write(ctx, "THE BIG QUESTION // INQUIRY THEATRE", pad, 19, inner, 8, true, ctx.onFill(primary), false, "middle");

  // Dominant Question Marquee Card
  const qBoxY = 44;
  const titleSize = w > 340 ? 25 : 20;
  const titleLines = ctx.wrap(c.title, inner - 42, titleSize, true);
  const qBoxH = Math.max(74, 26 + titleLines.length * titleSize * 1.35);

  ctx.nodes.push({ kind: "rect", x: pad, y: qBoxY, w: inner, h: qBoxH, fill: "#FFFFFF", stroke: border, strokeWidth: 1.5, radius: 8 });
  ctx.nodes.push({ kind: "rect", x: pad + 4, y: qBoxY + 4, w: inner - 8, h: qBoxH - 8, fill: "none", stroke: border, strokeWidth: 0.5, radius: 6 });
  // Decorative question watermark glyph
  ctx.nodes.push({ kind: "text", x: pad + inner - 34, y: qBoxY + 46, text: "?", size: 44, fill: accent, bold: true, opacity: 0.35 });
  write(ctx, c.title, pad + 16, qBoxY + 14, inner - 50, titleSize, true, primary);

  let y = qBoxY + qBoxH + 14;
  y = write(ctx, c.subtitle, pad, y, inner, size, false, text) + (c.subtitle ? 8 : 0);
  y = write(ctx, c.introText, pad, y, inner, size, false, text) + (c.introText ? 10 : 0);

  // Illustrated Thought Bubbles (supporting prompts)
  const items = c.items || [];
  if (items.length) {
    used.items = true;
    for (let i = 0; i < items.length; i++) {
      const bubbleTailX = pad + (i % 2 === 0 ? 22 : inner - 34);
      // Small trailing bubbles
      ctx.nodes.push({ kind: "ellipse", x: bubbleTailX, y: y + 2, rx: 3, ry: 3, fill: secondary, opacity: 0.7 });
      ctx.nodes.push({ kind: "ellipse", x: bubbleTailX + (i % 2 === 0 ? 6 : -6), y: y + 8, rx: 5.5, ry: 5.5, fill: secondary, opacity: 0.85 });

      const bY = y + 14;
      const bH = Math.max(52, ctx.wrap(items[i], inner - 36, size).length * size * 1.4 + 20);
      ctx.nodes.push({ kind: "rect", x: pad + 10, y: bY, w: inner - 20, h: bH, fill: "#FFFFFF", stroke: secondary, strokeWidth: 1.2, radius: 14 });
      write(ctx, items[i], pad + 22, bY + 10, inner - 44, size, false, text);
      y = bY + bH + 10;
    }
  }

  // Inquiry Reflection Stage
  const stageH = 62;
  ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: stageH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 8 });
  ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: 18, fill: secondary, radius: 4 });
  write(ctx, "INQUIRY REFLECTION & HYPOTHESIS", pad + 10, y + 4, inner - 20, 7.5, true, ctx.onFill(secondary));
  rules(ctx, pad + 12, y + 14, inner - 24, 2);
  y += stageH + 8;

  return finish(ctx, y + 4, used, close);
}

/** 6. EDITORIAL FOLIO: Classical serif typography, double fine rules, generous whitespace, marginalia layout. */
function composeEditorialFolio(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 20, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 0;
  const close = ground(ctx, "#FFFFFF", radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Double fine rules at the top
  ctx.nodes.push({ kind: "line", x: pad, y: 16, x2: w - pad, y2: 16, stroke: primary, strokeWidth: 1.5 });
  ctx.nodes.push({ kind: "line", x: pad, y: 19, x2: w - pad, y2: 19, stroke: border, strokeWidth: 0.5 });

  // Folio header strip
  write(ctx, (c.unitBadge || "EDITORIAL FOLIO").toUpperCase(), pad, 25, inner / 2, 7.5, true, secondary, true);
  write(ctx, "FOLIO § 01", pad + inner / 2, 25, inner / 2, 7.5, true, secondary, true, "end");

  let y = write(ctx, c.title, pad, 40, inner, w > 340 ? 27 : 21, true, primary, true) + 8;
  y = write(ctx, c.subtitle, pad, y, inner, size + 1, false, text, true) + (c.subtitle ? 8 : 0);
  ctx.nodes.push({ kind: "line", x: pad, y, x2: pad + 44, y2: y, stroke: accent, strokeWidth: 1.8 });
  y += 12;

  y = write(ctx, c.introText, pad, y, inner, size, false, text, true) + (c.introText ? 14 : 0);

  // Folio items with Roman numerals and fine rules
  const items = c.items || [];
  if (items.length) {
    used.items = true;
    const romans = ["§ I", "§ II", "§ III", "§ IV", "§ V", "§ VI", "§ VII", "§ VIII"];
    for (let i = 0; i < items.length; i++) {
      const numW = 32;
      write(ctx, romans[i] || `§ ${i + 1}`, pad, y, numW, 9.5, true, primary, true);
      y = write(ctx, items[i], pad + numW + 8, y, inner - numW - 8, size, false, text, true) + 10;
      if (i < items.length - 1) {
        ctx.nodes.push({ kind: "line", x: pad + numW + 8, y: y - 4, x2: w - pad, y2: y - 4, stroke: border, strokeWidth: 0.4 });
      }
    }
  }

  return finish(ctx, y + 6, used, close);
}

/** 7. CURIOSITY PASSPORT: Explorer's passport header, numbered visa discovery stamps, official seal marks. */
function composeCuriosityPassport(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 6;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Passport Guilloche Header Banner
  ctx.nodes.push({ kind: "rect", x: pad, y: 14, w: inner, h: 48, fill: primary, radius: 4 });
  ctx.nodes.push({ kind: "rect", x: pad + 3, y: 17, w: inner - 6, h: 42, fill: "none", stroke: ctx.onFill(primary), strokeWidth: 0.6, radius: 2 });
  write(ctx, "★ OFFICIAL DISCOVERY PASSPORT · EXPEDITION LOG ★", pad + 6, 21, inner - 12, 7.5, true, accent, false, "middle");
  write(ctx, c.title, pad + 6, 33, inner - 12, w > 340 ? 17 : 14, true, ctx.onFill(primary), false, "middle");

  let y = 70;
  y = write(ctx, c.subtitle, pad, y, inner, size, false, text) + (c.subtitle ? 8 : 0);
  y = write(ctx, c.introText, pad, y, inner, size, false, text) + (c.introText ? 10 : 0);

  // Numbered Visa Stamps
  const items = c.items || [];
  if (items.length) {
    used.items = true;
    const columns = w >= 360 ? 2 : 1;
    const gap = 10;
    const stampW = (inner - gap * (columns - 1)) / columns;

    for (let i = 0; i < items.length; i += columns) {
      const rowHeights: number[] = [];
      for (let col = 0; col < columns && i + col < items.length; col++) {
        const itemText = items[i + col];
        const lines = ctx.wrap(itemText, stampW - 16, size);
        rowHeights.push(Math.max(72, lines.length * size * 1.4 + 34));
      }
      const rowH = Math.max(...rowHeights);

      for (let col = 0; col < columns && i + col < items.length; col++) {
        const index = i + col;
        const x = pad + col * (stampW + gap);
        const fill = (index) % 2 ? secondary : primary;

        // Stamp double outline
        ctx.nodes.push({ kind: "rect", x, y, w: stampW, h: rowH, fill: "#FFFFFF", stroke: border, strokeWidth: 1, radius: 2 });
        ctx.nodes.push({ kind: "rect", x: x + 2, y: y + 2, w: stampW - 4, h: rowH - 4, fill: "none", stroke: border, strokeWidth: 0.5, radius: 1 });

        // Stamp header bar
        ctx.nodes.push({ kind: "rect", x: x + 2, y: y + 2, w: stampW - 4, h: 15, fill, radius: 1 });
        write(ctx, `VISA ENTRY #${String(index + 1).padStart(2, "0")} · VERIFIED`, x + 6, y + 5, stampW - 28, 7, true, ctx.onFill(fill));

        // Official circular seal on top-right of stamp
        const sealX = x + stampW - 14, sealY = y + 9;
        ctx.nodes.push({ kind: "ellipse", x: sealX, y: sealY, rx: 6, ry: 6, fill: "none", stroke: accent, strokeWidth: 0.8 });
        ctx.nodes.push({ kind: "ellipse", x: sealX, y: sealY, rx: 3, ry: 3, fill: "none", stroke: accent, strokeWidth: 0.5 });

        write(ctx, items[index], x + 8, y + 23, stampW - 16, size, false, text);
      }
      y += rowH + gap;
    }
  }

  return finish(ctx, y + 4, used, close);
}

/** 8. WORKSHOP BOARD: Tactile washi tape tabs, hands-on craft cards, action order (materials, method, make, reflect). */
function composeWorkshopBoard(ctx: SkinContext) {
  const { palette: p, width: w, size, block } = ctx;
  const c = block.semanticContent, pad = 18, inner = w - pad * 2;
  const radius = block.styleOverrides.cornerRadiusPt ?? 8;
  const close = ground(ctx, ctx.ink(p.surface), radius);
  const primary = ctx.ink(p.primary), secondary = ctx.ink(p.secondary), accent = ctx.ink(p.accent);
  const text = ctx.ink(p.text), border = ctx.ink(p.border);
  const used: UsedFields = { subtitle: true };

  // Washi tape tab at top center of board
  const tapeW = Math.min(48, inner * 0.3);
  ctx.nodes.push({ kind: "rect", x: w / 2 - tapeW / 2, y: 8, w: tapeW, h: 12, fill: accent, opacity: 0.88, radius: 1 });

  let y = 24;
  y = write(ctx, c.unitBadge || "MAKER WORKSHOP // HANDS-ON INVESTIGATION", pad, y, inner, 8.5, true, secondary) + 6;
  y = write(ctx, c.title, pad, y, inner, w > 340 ? 25 : 20, true, primary) + 8;
  y = write(ctx, c.subtitle, pad, y, inner, size, false, text) + (c.subtitle ? 8 : 0);
  y = write(ctx, c.introText, pad, y, inner, size, false, text) + (c.introText ? 10 : 0);

  // Materials tray if present
  if (c.materials?.length) {
    used.materials = true;
    const trayH = Math.max(34, ctx.wrap(c.materials.join("  ·  "), inner - 24, size).length * size * 1.4 + 22);
    ctx.nodes.push({ kind: "rect", x: pad, y, w: inner, h: trayH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 4 });
    // Tape on materials tray
    ctx.nodes.push({ kind: "rect", x: pad + 12, y: y - 4, w: 32, h: 8, fill: accent, opacity: 0.85, radius: 1 });
    write(ctx, "MATERIALS TRAY", pad + 12, y + 6, inner - 24, 7.5, true, primary);
    write(ctx, c.materials.join("  ·  "), pad + 12, y + 18, inner - 24, size, false, text);
    y += trayH + 12;
  }

  // Workshop Activity Cards with washi tape details
  const items = c.items || [];
  if (items.length) {
    used.items = true;
    const columns = w >= 360 ? 2 : 1;
    const gap = 14;
    const cardW = (inner - gap * (columns - 1)) / columns;
    const stageTitles = ["MATERIALS & SETUP", "METHOD & ASSEMBLY", "MAKING & TESTING", "OBSERVATION & REFLECT"];

    for (let i = 0; i < items.length; i += columns) {
      const rowHeights: number[] = [];
      for (let col = 0; col < columns && i + col < items.length; col++) {
        const itemText = items[i + col];
        const lines = ctx.wrap(itemText, cardW - 20, size);
        rowHeights.push(Math.max(76, lines.length * size * 1.4 + 36));
      }
      const rowH = Math.max(...rowHeights);

      for (let col = 0; col < columns && i + col < items.length; col++) {
        const index = i + col;
        const x = pad + col * (cardW + gap);
        const cardTapeW = Math.min(36, cardW * 0.4);

        // Workshop card with tape detail on top
        ctx.nodes.push({ kind: "rect", x, y, w: cardW, h: rowH, fill: "#FFFFFF", stroke: border, strokeWidth: 0.8, radius: 4 });
        ctx.nodes.push({ kind: "rect", x: x + cardW / 2 - cardTapeW / 2, y: y - 4, w: cardTapeW, h: 9, fill: (index) % 2 ? accent : secondary, opacity: 0.9, radius: 1 });

        const label = stageTitles[index] || `ACTION STEP ${index + 1}`;
        write(ctx, label, x + 10, y + 8, cardW - 20, 7.5, true, primary);
        write(ctx, items[index], x + 10, y + 24, cardW - 20, size, false, text);
      }
      y += rowH + gap;
    }
  }

  return finish(ctx, y + 4, used, close);
}

/** Dispatches to the dedicated signature layout composer. */
export function signatureLayout(ctx: SkinContext, layout: SignatureLayout) {
  switch (layout) {
    case "field-guide":
      return composeFieldGuide(ctx);
    case "story-ribbon":
      return composeStoryRibbon(ctx);
    case "discovery-deck":
      return composeDiscoveryDeck(ctx);
    case "learning-trail":
      return composeLearningTrail(ctx);
    case "question-theatre":
      return composeQuestionTheatre(ctx);
    case "editorial-folio":
      return composeEditorialFolio(ctx);
    case "curiosity-passport":
      return composeCuriosityPassport(ctx);
    case "workshop-board":
      return composeWorkshopBoard(ctx);
    default:
      return composeDiscoveryDeck(ctx);
  }
}
