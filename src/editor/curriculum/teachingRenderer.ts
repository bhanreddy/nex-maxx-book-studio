import {curriculumGradeRank} from "../../domain/educational/curriculum";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { TeachingLayout } from "../../domain/educational/curriculum";
import { CLASS_TYPOGRAPHY, teachingTokens } from "../../domain/educational/designTokens";
import type { AtelierHelpers } from "../educational/atelier/render";
import type { PublicationScene, SceneNode, SceneMotifFrame, ArtworkKind } from "../educational/publicationScene";
import { contrastRatio } from "../design/contrast";
import { backgroundPatternNodes } from "../educational/publicationScene";
import { subjectArtwork } from "./subjectArtwork";

/** Content-first compositions. Geometry is shared by SVG, editable layers, and PDF export. */
export function renderTeachingLayout(block: SmartBlockInstance, layout: TeachingLayout, h: AtelierHelpers, options: { teacher?: boolean } = {}): PublicationScene {
  const c = block.semanticContent, o = block.styleOverrides, m = block.curriculum!;
  const style = o.blockStyle || (curriculumGradeRank(m.grade) < 4 ? "colourful" : "calm");
  const quiet = o.printMode === "reduced-ink", restrained = style === "calm" || style === "classic";
  const p = h.resolvePublicationPalette(block), t = teachingTokens(p, style, quiet);
  const g = CLASS_TYPOGRAPHY[m.grade] || CLASS_TYPOGRAPHY[3];
  const w = Math.max(180, block.transform.width), pad = w < 300 ? 14 : 24, inner = w - pad * 2;
  const fs = g.body * Math.max(1, o.fontSizeScale || 1), gap = t.gap;
  const onColour = (colour: string) => contrastRatio("#FFFFFF", colour) >= 4.5 ? "#FFFFFF" : "#142B3A";
  const nodes: SceneNode[] = [], motifs: SceneMotifFrame[] = [], warnings: string[] = [];
  const font = o.fontFamily && /serif|georgia|times/i.test(o.fontFamily) ? "serif" : t.display;
  const measure = (value: string, width: number, size = fs, bold = false) => h.wrapText(value, Math.max(16, width), size, bold, font === "serif").length * size * 1.42;
  const text = (value: string | undefined, x: number, y: number, width = inner, size = fs, bold = false, fill = t.ink) => {
    if (!value) return y;
    const lines = h.wrapText(String(value), Math.max(16, width), size, bold, font === "serif");
    lines.forEach((label, i) => nodes.push({ kind: "text", text: label, x, y: y + size + i * size * 1.42, size, bold, fill, font, wrapWidth: Math.max(16, width), lineHeight: size * 1.42, ...(o.fontFamily ? { fontFamily: o.fontFamily } : {}) }));
    return y + lines.length * size * 1.42;
  };
  const rect = (x: number, y: number, width: number, height: number, fill = t.white, stroke?: string, radius = t.radius) => {
    const node: SceneNode & { kind: "rect" } = { kind: "rect", x, y, w: width, h: height, fill, stroke, strokeWidth: t.stroke, radius };
    nodes.push(node); return node;
  };
  const line = (x: number, y: number, x2: number, y2: number, stroke = p.border, strokeWidth = 1) => nodes.push({ kind: "line", x, y, x2, y2, stroke, strokeWidth });
  const badge = (n: string | number, x: number, y: number, colour = t.accent) => {
    nodes.push({ kind: "ellipse", x: x + 12, y: y + 12, rx: 12, ry: 12, fill: quiet ? t.white : colour, stroke: colour, strokeWidth: 1 });
    nodes.push({ kind: "text", text: String(n), x: x + 12, y: y + 16, size: 10, bold: true, fill: quiet ? colour : onColour(colour), align: "middle" });
  };
  const panelText = (value: string, x: number, y: number, width: number, index = 0, bold = false, size = fs) => {
    const height = measure(value, width - 32, size, bold) + 32;
    rect(x, y, width, height, t.fills[index % 3], t.edges[index % 3]);
    text(value, x + 16, y + 16, width - 32, size, bold);
    return y + height;
  };
  const paper = rect(1, 1, w - 2, 1, quiet || restrained ? t.white : t.soft, quiet ? p.border : t.edges[0], o.cornerRadiusPt ?? t.radius + 6);
  const unit = c.unitBadge || m.subjectLabel;
  let y = pad;
  const ribbonHeight = measure(unit, inner - 32, 10, true) + 14;
  if (restrained) {
    text(unit, pad, y, inner, 10, true, t.accent);
    line(pad, y + ribbonHeight, w - pad, y + ribbonHeight, t.accent, 1.5);
  } else {
    const ribbonWidth = Math.min(inner - 10, Math.max(120, h.textWidth(unit, 10, true) + 34));
    rect(pad, y, ribbonWidth, ribbonHeight, quiet ? t.white : t.accent, t.accent, 8);
    nodes.push({ kind: "polygon", points: [[pad + ribbonWidth - 4, y], [pad + ribbonWidth + 9, y], [pad + ribbonWidth + 2, y + ribbonHeight / 2], [pad + ribbonWidth + 9, y + ribbonHeight], [pad + ribbonWidth - 4, y + ribbonHeight]], fill: quiet ? t.white : t.accent });
    text(unit, pad + 12, y + 6, ribbonWidth - 23, 10, true, quiet ? t.accent : onColour(t.accent));
  }
  y += ribbonHeight + 18;
  if (c.chapterNumber) y = text(c.chapterNumber, pad, y, inner, g.display, true, t.secondary) + 6;
  y = text(c.title, pad, y, inner, g.heading * (layout === "big-idea" || c.chapterNumber ? 1.2 : 1), true, t.accent) + 12;
  if (c.subtitle) y = text(c.subtitle, pad, y, inner, fs, false, t.accent) + gap;

  const photos = (o.motifs || []).filter(a => a.role === "photo" && a.src && !a.hidden);
  const pictureAllowed = o.illustration !== "none" && !o.motifs?.find(a => a.id === "curriculum-illustration")?.hidden;
  const picture = (x: number, top: number, width: number, height: number, asset = photos[0]) => {
    const stored = asset || o.motifs?.find(a => a.id === "curriculum-illustration");
    const box = stored && (stored.nudged || !stored.originWidth) ? { x: stored.x, y: stored.y, w: stored.w, h: stored.h } : { x, y: top, w: width, h: height };
    const id = asset?.id || "curriculum-illustration";
    motifs.push({ id, role: asset ? "photo" : "illustration", kind: asset ? "photo" : "subject", ...box, locked: stored?.locked });
    if (asset?.src) nodes.push({ ...box, ...asset, x: box.x, y: box.y, w: box.w, h: box.h, src: asset.src, alt: asset.alt || "Block illustration", focalX: asset.focalX ?? .5, focalY: asset.focalY ?? .5, scale: asset.scale ?? 1, sourceWidth: asset.rawWidthPx, sourceHeight: asset.rawHeightPx, fit: asset.fit || "contain", motifId: id, kind: "image" });
    else if (o.backgroundImage?.src) nodes.push({ kind: "image", ...box, ...o.backgroundImage, motifId: id });
    else if (!quiet) nodes.push(...(o.illustration && o.illustration !== "none" ? h.artworkNodes(o.illustration, box.x, box.y, box.w, box.h, p, o.decorationOpacity ?? 1) : subjectArtwork(m.subjectLabel, box.x, box.y, box.w, box.h, p)).map(n => ({ ...n, motifId: id })));
  };
  let usedIntro = false, usedPassage = false, usedPicture = false;
  if (layout === "picture-top" && pictureAllowed) {
    const artH = Math.min(205, inner * .55);
    rect(pad, y, inner, artH, t.white, quiet ? p.border : undefined);
    picture(pad + 12, y + 8, inner - 24, artH - 16);
    y += artH + gap; usedPicture = true;
  } else if (layout === "picture-side" && pictureAllowed && w >= 360) {
    const artW = inner * .35, textW = inner - artW - gap;
    const introHeight = c.introText ? measure(c.introText, textW - 32) + 32 : 110;
    const height = Math.max(150, introHeight);
    if (c.introText) panelText(c.introText, pad, y, textW);
    picture(pad + textW + gap, y, artW, Math.min(height, 205));
    y += height + gap; usedIntro = true; usedPicture = true;
  }
  if (!usedIntro && c.introText) {
    if (["big-idea", "reminder-panel"].includes(layout)) y = panelText(c.introText, pad, y, inner, layout === "reminder-panel" ? 2 : 0, true, fs + 1) + gap;
    else if (layout === "reading-focus" && !c.passage) y = panelText(c.introText, pad, y, inner) + gap;
    else y = text(c.introText, pad, y, inner) + gap;
  }
  if (!usedPicture && (photos.length || o.backgroundImage?.src || (layout === "picture-side" && pictureAllowed))) {
    picture(pad, y, inner, Math.min(190, inner * .6));
    y += Math.min(190, inner * .6) + gap;
  }
  photos.slice(1).forEach(asset => { picture(pad, y, inner, Math.min(190, inner * .6), asset); y += Math.min(190, inner * .6) + gap; });
  if (c.passage) {
    const height = measure(c.passage, inner - 36) + 36;
    rect(pad, y, inner, height, t.white, t.edges[0]);
    rect(pad, y + 12, 4, height - 24, t.accent, undefined, 2);
    y = text(c.passage, pad + 18, y + 18, inner - 36) + 18 + gap;
    usedPassage = true;
  }

  const rows: { title?: string; body: string; number?: string | number; tag?: string }[] = (c.items || []).map((body, i) => ({ body, number: i + 1 }));
  const renderRows = (entries: typeof rows, cards: boolean, paired: boolean, sequence: boolean) => {
    const cols = (cards || paired) && w >= 450 && curriculumGradeRank(m.grade) > 1 ? 2 : 1;
    for (let row = 0; row < entries.length; row += cols) {
      const batch = entries.slice(row, row + cols);
      const actualCols = paired && batch.length === 1 ? 1 : cols;
      const width = (inner - gap * (actualCols - 1)) / actualCols;
      const inset = cards || paired ? 16 : 0;
      const bodyW = width - inset * 2 - (sequence ? 38 : 0);
      const heights = batch.map(entry => measure(entry.body, bodyW) + (entry.title ? measure(entry.title, bodyW, fs, true) + 7 : 0) + (entry.tag ? measure(entry.tag, bodyW, 10, true) + 5 : 0) + (cards || paired ? 60 : 8));
      const height = Math.max(...heights);
      batch.forEach((entry, col) => {
        const x = pad + col * (width + gap), index = row + col, colour = t.colours[index % 3];
        if (cards || paired) rect(x, y, width, height, t.fills[index % 3], t.edges[index % 3]);
        if (sequence && row + cols < entries.length) line(x + 12, y + 26, x + 12, y + height + gap, p.border, 2);
        badge(entry.number || index + 1, x + inset, y + (cards || paired ? 12 : 0), colour);
        let top = y + (cards || paired ? 46 : 0);
        const textX = x + inset + (sequence ? 38 : 0);
        if (entry.title) top = text(entry.title, textX, top, bodyW, fs, true, colour) + 7;
        top = text(entry.body, textX, top, bodyW);
        if (entry.tag) text(entry.tag, textX, top + 5, bodyW, 10, true, colour);
      });
      y += height + gap;
    }
  };
  if (rows.length) {
    const cards = layout === "example-cards" || layout === "big-idea";
    const paired = layout === "compare-panels";
    if (paired) {
      // Preserve explicit left/right pairs while accepting ordinary unpaired points.
      const hasPairs = rows.some(r => r.body.includes("|"));
      if (hasPairs) {
        const headings = Array.isArray(c.metadata?.columnHeadings) ? c.metadata.columnHeadings.map(String) : ["First", "Second"];
        rows.splice(0, rows.length, ...(c.items || []).flatMap((body, i) => {
          const split = body.indexOf("|");
          return split < 0 ? [{ body, number: i + 1 }] : [{ title: headings[0], body: body.slice(0, split).trim(), number: i + 1 }, { title: headings[1], body: body.slice(split + 1).trim(), number: i + 1 }];
        }));
      }
    }
    renderRows(rows, cards, paired, !cards && !paired);
  }
  if (c.materials?.length) {
    const label = "YOU NEED";
    const height = measure(c.materials.join(" · "), inner - 32) + 50;
    rect(pad, y, inner, height, t.fills[2], t.edges[2]);
    text(label, pad + 16, y + 12, inner - 32, 10, true, t.accent);
    y = text(c.materials.join(" · "), pad + 16, y + 32, inner - 32) + 18 + gap;
  }
  if (c.steps?.length) {
    const entries = c.steps.map(s => ({ title: s.title, body: s.body, number: s.stepNumber, tag: s.tag }));
    renderRows(entries, layout === "example-cards", false, layout !== "example-cards");
  }
  if (c.questions?.length) {
    const cols = layout === "question-cards" && w >= 480 && curriculumGradeRank(m.grade) >= 3 ? 2 : 1;
    const width = (inner - (cols - 1) * gap) / cols, contentW = width - 32;
    const answerCount = Math.max(1, Math.min(8, Number(c.metadata?.answerLines) || (curriculumGradeRank(m.grade) < 3 ? 3 : 2)));
    const lineGap = Math.max(curriculumGradeRank(m.grade) < 3 ? 28 : 23, o.answerSpacePt || 24);
    const isCard = layout === "question-cards" || layout === "activity-board";
    for (let start = 0; start < c.questions.length; start += cols) {
      const batch = c.questions.slice(start, start + cols);
      const heightFor = (q: typeof batch[number]) => 58 + measure(q.prompt, contentW, fs, true) + (q.options || []).reduce((n, option) => n + measure(option, contentW - 22) + 8, 0) + (options.teacher && q.answer ? measure("Answer: " + q.answer, contentW) + 10 : !q.options?.length ? answerCount * lineGap + 8 : 0) + (q.points ? 24 : 0);
      const height = Math.max(...batch.map(heightFor));
      batch.forEach((q, col) => {
        const x = pad + col * (width + gap);
        if (isCard) rect(x, y, width, height, t.white, t.edges[(start + col) % 3]);
        else line(x, y, x + width, y, p.border);
        badge(start + col + 1, x + 16, y + 12);
        let top = text(q.prompt, x + 16, y + 44, contentW, fs, true) + 8;
        (q.options || []).forEach((option, i) => { top = text(String.fromCharCode(65 + i) + ". " + option, x + 16, top, contentW) + 8; });
        if (options.teacher && q.answer) top = text("Answer: " + q.answer, x + 16, top, contentW, fs, false, t.accent) + 8;
        else if (!q.options?.length) {
          for (let i = 1; i <= answerCount; i++) line(x + 16, top + i * lineGap, x + width - 16, top + i * lineGap);
          top += answerCount * lineGap + 8;
        }
        if (q.points) text(String(q.points) + (q.points === 1 ? " mark" : " marks"), x + 16, top, contentW, 9, false, t.accent);
      });
      y += height + gap;
    }
  }
  if (c.calloutText) {
    const titleH = 23, height = measure(c.calloutText, inner - 36, fs, true) + titleH + 32;
    rect(pad, y, inner, height, t.fills[2], t.edges[2]);
    text("REMEMBER", pad + 18, y + 13, inner - 36, 10, true, t.accent);
    y = text(c.calloutText, pad + 18, y + titleH + 12, inner - 36, fs, true) + 20 + gap;
  }
  if (c.numberValue !== undefined) y = panelText(String(c.numberValue), pad, y, inner, 0, true, g.display) + gap;
  const d = m.digitalExtension;
  if (d) {
    y = text(d.contentType + (d.duration ? " · " + d.duration : ""), pad, y, inner, 10, true, t.accent) + 10;
    if (d.qrImageSrc) { nodes.push({ kind: "image", x: pad, y, w: 72, h: 72, src: d.qrImageSrc, alt: "Resource QR code", focalX: .5, focalY: .5, scale: 1, fit: "contain" }); y += 84; }
    y = text(d.cta, pad, y, inner, fs, true) + 8;
    if (d.url) y = text(d.url, pad, y, inner, 10) + 10;
  }
  if (c.qrUrl && c.qrUrl !== d?.url) y = text(c.qrUrl, pad, y, inner, 10) + 10;
  if (c.footnote) { line(pad, y, w - pad, y); y = text(c.footnote, pad, y + 10, inner, Math.max(10, fs * .8)) + gap; }
  (o.motifs || []).filter(a => !a.hidden && a.id !== "curriculum-illustration" && a.role !== "photo").forEach(a => {
    if (a.role !== "plate" && a.role !== "illustration") return;
    motifs.push({ id: a.id, role: a.role, kind: a.kind, x: a.x, y: a.y, w: a.w, h: a.h, locked: a.locked });
    const art = h.artworkNodes(a.kind as ArtworkKind, a.x, a.y, a.w, a.h, p, quiet ? 0 : a.opacity).map(n => ({ ...n, motifId: a.id }));
    nodes.splice(a.behind === false ? nodes.length : 1, 0, ...art);
  });
  const height = Math.max(120, y + pad - gap, ...motifs.map(a => a.y + a.h + pad));
  paper.h = height - 2;
  if (o.backgroundSpec) {
    const bg = o.backgroundSpec;
    if (bg.color) paper.fill = quiet ? t.white : bg.color;
    if (bg.type === "none") paper.fill = "none";
    if (bg.cornerRadiusPt !== undefined) paper.radius = bg.cornerRadiusPt;
    if (bg.borderColor) paper.stroke = bg.borderColor;
    if (bg.borderWidthPt !== undefined) paper.strokeWidth = bg.borderWidthPt;
    if (!quiet && (bg.type === "gradient" || bg.type === "mesh")) {
      paper.gradientId = "teaching-paper";
      nodes.push({ kind: "gradient", id: "teaching-paper", x1: 0, y1: 0, x2: bg.gradient?.directionDeg === 90 ? 0 : w, y2: bg.gradient?.directionDeg === 90 ? height : 0, from: bg.gradient?.from || t.soft, to: bg.gradient?.to || t.white });
    }
    if (!quiet && bg.patternOverlay && bg.patternOverlay !== "none") nodes.splice(1, 0, ...backgroundPatternNodes(bg.patternOverlay, w, height, p, Math.min(.1, bg.patternOpacity ?? .05)));
  }
  if (w < 300) warnings.push("Narrow block: review at actual print size.");
  if (layout === "reading-focus" && !usedPassage) warnings.push("The explanation is used as the reading panel. Add a passage for longer reading.");
  return { width: w, height, nodes, motifs, warnings, variant: "curriculum-" + layout };
}
