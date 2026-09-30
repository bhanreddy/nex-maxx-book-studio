import {curriculumGradeRank} from "../../domain/educational/curriculum";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { CurriculumLayout } from "../../domain/educational/curriculum";
import { CLASS_TYPOGRAPHY, curriculumTokens, teachingTokens } from "../../domain/educational/designTokens";
import type { PublicationScene, SceneNode, SceneMotifFrame, ArtworkKind } from "../educational/publicationScene";
import type { AtelierHelpers } from "../educational/atelier/render";
import { CURRICULUM_BLOCK_MAP } from "./catalog";
import { backgroundPatternNodes } from "../educational/publicationScene";

import { subjectArtwork } from "./subjectArtwork";
import { isTeachingLayout } from "./layoutSystem";
import { renderTeachingLayout } from "./teachingRenderer";

/** One scene pipeline serves canvas, thumbnails, independent layers and print export. */
export function renderCurriculum(block: SmartBlockInstance, h: AtelierHelpers, options: { teacher?: boolean } = {}): PublicationScene {
  const m = block.curriculum!;
  const c = block.semanticContent, o = block.styleOverrides;
  const def = CURRICULUM_BLOCK_MAP[m.type];
  const variant = (o.layoutVariant || def?.layouts[0] || "editorial") as CurriculumLayout;
  if (isTeachingLayout(variant)) return renderTeachingLayout(block, variant, h, options);
  const p = h.resolvePublicationPalette(block), t = curriculumTokens(p, m.frameworkStage);
  const g = CLASS_TYPOGRAPHY[m.grade] || CLASS_TYPOGRAPHY[3];
  const fs = g.body * Math.max(1, o.fontSizeScale || 1);
  const w = Math.max(180, block.transform.width), pad = w < 280 ? 14 : 26, inner = w - pad * 2;
  const nodes: SceneNode[] = [], frames: SceneMotifFrame[] = [];
  const serif = o.fontFamily ? /serif|times|georgia/i.test(o.fontFamily) : /english|hindi|telugu/i.test(m.subjectLabel) || block.family === "nex-editorial";
  const quiet = o.printMode === "reduced-ink";
  const enhanced = Boolean(o.blockStyle && o.blockStyle !== "classic");
  const look = teachingTokens(p, o.blockStyle || "classic", quiet);
  const tx = (value: string | undefined, x: number, y: number, width = inner, size = fs, bold = false, color = t.textPrimary, display = false) => {
    if (!value) return y;
    const lines = h.wrapText(String(value), Math.max(12, width), size, bold, display && serif);
    lines.forEach((text, i) => nodes.push({ kind: "text", x, y: y + size + i * size * 1.42, text, size, fill: color, bold, font: display && serif ? "serif" : "sans" }));
    return y + lines.length * size * 1.42;
  };
  const rect = (x: number, y: number, width: number, height: number, fill: string, radius = 0, opacity = 1) => nodes.push({ kind: "rect", x, y, w: width, h: height, fill, radius, opacity });
  const line = (x: number, y: number, x2: number, y2: number, stroke = t.borderSoft, thickness = .8) => nodes.push({ kind: "line", x, y, x2, y2, stroke, strokeWidth: thickness });
  const circle = (x: number, y: number, r: number, fill: string, opacity = 1) => nodes.push({ kind: "ellipse", x, y, rx: r, ry: r, fill, opacity });
  const number = (n: number, x: number, y: number, r = 12, fill = t.chapterAccent) => {
    circle(x + r, y + r, r, fill);
    nodes.push({ kind: "text", x: x + r, y: y + r + 4, text: String(n), size: 11, fill: "#FFFFFF", bold: true, align: "middle" });
  };
  const answerLines = (x: number, y: number, width: number, count = 1) => {
    const space = Math.max(curriculumGradeRank(m.grade) < 3 ? 28 : 22, o.answerSpacePt ?? 24);
    for (let i = 1; i <= count; i++) line(x, y + i * space, x + width, y + i * space);
    return y + count * space + 10;
  };
  const artKind: ArtworkKind = /math/i.test(m.subjectLabel) ? "geometry" : /science|evs|environment/i.test(m.subjectLabel) ? "botanical" : /social/i.test(m.subjectLabel) ? "waves" : "arch";
  const motifBox = (id: string, fallback: { x: number; y: number; w: number; h: number }, kind: string) => {
    const found = o.motifs?.find(a => a.id === id);
    const scale = found?.originWidth && !found.nudged ? w / found.originWidth : 1;
    const box = found ? { x: found.x * scale, y: found.y * scale, w: found.w * scale, h: found.h * scale } : fallback;
    frames.push({ id, role: found?.role || "illustration", kind, ...box, locked: found?.locked });
    return box;
  };
  let usedIllustration = false;
  const illustration = (x: number, y: number, width: number, height: number) => {
    usedIllustration = true;
    if (o.illustration === "none") return;
    const asset = (o.motifs || []).find(a => a.role === "photo" && a.src && !a.hidden);
    if (quiet && !asset && !o.backgroundImage?.src) return;
    if (!asset && o.motifs?.find(a => a.id === "curriculum-illustration")?.hidden) return;
    const a = motifBox(asset?.id || "curriculum-illustration", { x, y, w: width, h: height }, asset ? "photo" : artKind);
    if (asset?.src) nodes.push({ kind: "image", ...a, src: asset.src, alt: asset.alt || "Chapter illustration", focalX: asset.focalX ?? .5, focalY: asset.focalY ?? .5, scale: asset.scale ?? 1, sourceWidth: asset.rawWidthPx, sourceHeight: asset.rawHeightPx, fit: asset.fit, radius: asset.radius, brightness: asset.brightness, contrast: asset.contrast, saturation: asset.saturation, mask: asset.mask, customMaskPath: asset.customMaskPath, opacity: asset.opacity, flipX: asset.flipX, flipY: asset.flipY, motifId: asset.id });
    else if (o.backgroundImage?.src) nodes.push({ kind: "image", ...a, ...o.backgroundImage, focalX: o.backgroundImage.focalX, focalY: o.backgroundImage.focalY, scale: o.backgroundImage.scale, radius: 18 });
    else nodes.push(...(enhanced ? subjectArtwork(m.subjectLabel, a.x, a.y, a.w, a.h, p) : h.artworkNodes(artKind, a.x, a.y, a.w, a.h, p, o.decorationOpacity ?? 1)).map(n => ({ ...n, motifId: "curriculum-illustration" })));
  };
  const background: SceneNode = { kind: "rect", x: 0, y: 0, w, h: 1, fill: "#FFFFFF", radius: enhanced ? look.radius : 0, ...(enhanced ? { stroke: look.edges[0], strokeWidth: look.stroke } : {}) };
  nodes.push(background);
  const textX = pad;
  let y = pad, textW = inner, sideIllustrationEnd = 0;
  let usedItems = false, usedIntro = false, usedSubtitle = false;
  const badge = c.unitBadge || m.frameworkStage.toUpperCase();
  if (variant === "panorama") {
    background.fill = t.surfaceSoft;
    tx(badge, pad, y, inner, 10, true, t.chapterAccent); y += 38;
    if (c.chapterNumber) tx(c.chapterNumber, pad, y, inner, g.display * 2, true, t.secondaryAccent);
    y += g.display * 2.9;
    y = tx(c.title, pad, y, inner * .95, g.display, true, t.chapterAccent, true) + 12;
    y = tx(c.subtitle, pad, y, inner * .85, fs + 1, false) + 16; usedSubtitle = true;
    illustration(pad, y, inner, Math.max(140, 215 + (3 - curriculumGradeRank(m.grade)) * 22));
    y += Math.max(140, 215 + (3 - curriculumGradeRank(m.grade)) * 22) + 18;
    line(pad, y, w - pad, y, t.secondaryAccent, 2);
    y += 14;
  } else if (variant === "asymmetric" && w >= 350) {
    background.fill = t.surfaceSoft;
    const visualW = inner * .36;
    tx(badge, pad, y, inner, 10, true, t.chapterAccent); y += 38;
    if (c.chapterNumber) { tx(c.chapterNumber, w - pad - visualW, y - 10, visualW, 72, true, t.borderSoft); }
    y = tx(c.title, pad, y, inner * .59, g.display, true, t.chapterAccent, true) + 12;
    y = tx(c.subtitle, pad, y, inner * .57, fs, false) + 12; usedSubtitle = true;
    y = tx(c.introText, pad, y, inner * .58) + 20; usedIntro = true;
    illustration(w - pad - visualW, 124, visualW, Math.max(170, g.illustration * 420));
    y = Math.max(y, 124 + Math.max(170, g.illustration * 420));
  } else {
    const colored = ["question", "notebook", "workmat", "conversation", "confidence", "reading-page"].includes(variant);
    background.fill = colored && !quiet ? t.surfaceSoft : "#FFFFFF";
    if (enhanced) {
      const badgeHeight = h.wrapText(badge, inner - 24, 10, true).length * 14.2 + 12;
      const badgeWidth = Math.min(inner, Math.max(110, h.textWidth(badge, 10, true) + 24));
      rect(pad, y, badgeWidth, badgeHeight, quiet || o.blockStyle === "calm" ? look.fills[0] : t.chapterAccent, 8);
      tx(badge, pad + 12, y + 5, badgeWidth - 24, 10, true, quiet || o.blockStyle === "calm" ? t.chapterAccent : "#FFFFFF");
      y += badgeHeight + 16;
    } else if (variant === "editorial" || variant === "reading-page") {
      rect(0, 0, 5, 62, t.chapterAccent);
      tx(badge, pad, y, inner, 10, true, t.chapterAccent); y += 28;
    } else if (variant === "question") {
      tx("?", w - pad - 76, 3, 76, 100, true, t.borderSoft);
      tx(badge, pad, y, inner - 70, 10, true, t.thinkingAccent); y += 30;
    } else if (variant === "notebook") {
      rect(0, 0, 9, 64, t.activityAccent);
      tx(badge, pad, y, inner, 10, true, t.activityAccent); y += 30;
    } else {
      rect(pad, y, 22, 3, t.illustrationAccent);
      tx(badge, pad + 30, y - 5, inner - 30, 10, true, t.chapterAccent); y += 25;
    }
    y = tx(c.title, pad, y, variant === "question" ? inner - 64 : inner, g.heading, true, t.chapterAccent, true) + 14;
    if (variant === "visual-first") {
      illustration(pad, y, inner, g.illustration * 300);
      y += g.illustration * 300 + 20;
    }
    if (variant === "split" && w >= 380) {
      textW = inner * .6;
      const artHeight = Math.max(100, g.illustration * 280);
      illustration(pad + textW + 12, y, inner - textW - 12, artHeight);
      sideIllustrationEnd = y + artHeight + 16;
    }
    if (c.subtitle) { y = tx(c.subtitle, textX, y, textW, fs, false, t.textPrimary) + 10; usedSubtitle = true; }
  }
  if (!usedSubtitle && c.subtitle) y = tx(c.subtitle, pad, y, inner, fs) + 12;
  if (!usedIllustration && ((o.motifs || []).some(a => a.role === "photo" && a.src && !a.hidden) || o.backgroundImage?.src)) {
    illustration(pad, y, inner, Math.min(200, inner * .5));
    y += Math.min(200, inner * .5) + 18;
  }
  if (!usedIntro && c.introText) y = tx(c.introText, textX, y, textW) + g.gap;
  y = Math.max(y, sideIllustrationEnd);
  if (variant === "experiment-sheet") {
    const isObservation = /observation/i.test(c.title || "");
    const space = curriculumGradeRank(m.grade) < 3 ? 110 : 88;
    if (isObservation) {
      const half = (inner - 14) / 2;
      [0, 1].forEach(i => {
        const x = pad + i * (half + 14);
        nodes.push({ kind: "rect", x, y, w: half, h: space, fill: t.surfaceSoft || "#f8fafc", stroke: t.borderSoft, strokeWidth: 1.2, radius: 4 });
        tx(i === 0 ? "Observation 1 · What you notice" : "Observation 2 · Measures & notes", x + 8, y + 8, half - 16, 9.5, true, t.activityAccent);
        for (let l = 1; l <= 3; l++) {
          const ly = y + 24 + l * ((space - 34) / 4);
          line(x + 10, ly, x + half - 10, ly, t.borderSoft, 0.8);
        }
      });
      y += space + 18;
    } else {
      rect(pad, y, inner, space, "none");
      nodes.push({ kind: "rect", x: pad, y, w: inner, h: space, fill: "none", stroke: t.borderSoft, strokeWidth: 1, radius: 2 });
      tx("DRAW OR RECORD WHAT YOU NOTICE", pad + 10, y + 7, inner - 20, 9, true, t.activityAccent);
      y += space + 18;
    }
  }
  if (c.passage) {
    line(pad, y, w - pad, y, t.chapterAccent, 1.4);
    y = tx(c.passage, pad + 12, y + 12, inner - 24, fs, false, t.textPrimary, true) + 18;
  }
  if (c.calloutText && enhanced) {
    const height = h.wrapText(c.calloutText, inner - 32, fs, true).length * fs * 1.42 + 54;
    rect(pad, y, inner, height, look.fills[2], look.radius);
    tx("REMEMBER", pad + 16, y + 12, inner - 32, 10, true, t.chapterAccent);
    y = tx(c.calloutText, pad + 16, y + 34, inner - 32, fs, true) + 20;
  } else if (c.calloutText) {
    rect(pad, y + 2, 4, h.wrapText(c.calloutText, inner - 22, fs + 1, true).length * (fs + 1) * 1.42 + 8, t.illustrationAccent);
    y = tx(c.calloutText, pad + 16, y, inner - 16, fs + 1, true, t.chapterAccent) + 22;
  }
  const items = c.items || [];
  if (items.length && variant === "comparison-table") {
    const headings = Array.isArray(c.metadata?.columnHeadings) ? c.metadata.columnHeadings.map(String) : ["First", "Second"];
    const half = inner / 2;
    rect(pad, y, inner, 32, t.surfaceSoft);
    tx(headings[0] || "First", pad + 9, y + 5, half - 16, 10, true, t.chapterAccent);
    tx(headings[1] || "Second", pad + half + 9, y + 5, half - 16, 10, true, t.chapterAccent);
    y += 32;
    items.forEach(item => {
      const parts = item.split("|");
      const left = parts[0].trim(), right = parts.slice(1).join("|").trim();
      const rowHeight = Math.max(h.wrapText(left, half - 17, fs).length, h.wrapText(right, half - 17, fs).length) * fs * 1.42 + 16;
      line(pad, y + rowHeight, w - pad, y + rowHeight);
      line(pad + half, y, pad + half, y + rowHeight);
      tx(left, pad + 9, y + 5, half - 17);
      tx(right, pad + half + 9, y + 5, half - 17);
      y += rowHeight;
    });
    y += 16; usedItems = true;
  }
  if (items.length && variant === "sorting-board") {
    y = tx("SORT THESE", pad, y, inner, 9, true, t.activityAccent) + 7;
    y = tx(items.join("   ·   "), pad, y, inner, fs, true) + 17;
    const headings = Array.isArray(c.metadata?.columnHeadings) ? c.metadata.columnHeadings.map(String) : ["Group 1", "Group 2"];
    const half = (inner - 14) / 2, space = curriculumGradeRank(m.grade) < 3 ? 94 : 72;
    [0, 1].forEach(i => {
      const x = pad + i * (half + 14);
      nodes.push({ kind: "rect", x, y, w: half, h: space, fill: "none", stroke: t.borderSoft, strokeWidth: 1, radius: 2 });
      tx(headings[i] || `Group ${i + 1}`, x + 8, y + 7, half - 16, 10, true, t.chapterAccent);
    });
    y += space + 16; usedItems = true;
  }
  if (items.length && variant === "timeline") {
    const isNumberSequence = items.length >= 2 && items.length <= 12 && items.every(it => /^-?\d+$/.test(it.trim()));
    if (isNumberSequence && items.length > 1) {
      const lineY = y + 14;
      const startX = pad + 16;
      const endX = w - pad - 16;
      // Axis line
      line(startX, lineY, endX, lineY, t.borderSoft, 1.8);
      // Left arrow
      line(startX, lineY, startX + 6, lineY - 4, t.borderSoft, 1.5);
      line(startX, lineY, startX + 6, lineY + 4, t.borderSoft, 1.5);
      // Right arrow
      line(endX, lineY, endX - 6, lineY - 4, t.borderSoft, 1.5);
      line(endX, lineY, endX - 6, lineY + 4, t.borderSoft, 1.5);
      // Evenly spaced ticks and numbers
      const span = (endX - startX - 32);
      const step = span / (items.length - 1);
      items.forEach((item, i) => {
        const cx = startX + 16 + i * step;
        line(cx, lineY - 6, cx, lineY + 6, t.chapterAccent, 1.8);
        circle(cx, lineY, 3, t.chapterAccent);
        tx(item, cx - 18, lineY + 12, 36, fs + 1, true, t.textPrimary, false);
      });
      y += 56;
    } else {
      const perRow = curriculumGradeRank(m.grade) <= 2 || w < 350 ? 3 : Math.min(5, items.length);
      const col = inner / perRow;
      for (let row = 0; row * perRow < items.length; row++) {
        const batch = items.slice(row * perRow, (row + 1) * perRow);
        const textHeight = Math.max(...batch.map(item => h.wrapText(item, col - 13, fs).length * fs * 1.42));
        line(pad + col / 2, y + 12, pad + (batch.length - .5) * col, y + 12, t.borderSoft, 1.5);
        batch.forEach((item, i) => { circle(pad + i * col + col / 2, y + 12, 5, t.chapterAccent); tx(item, pad + i * col + 3, y + 25, col - 6, fs, true); });
        y += textHeight + 53;
      }
    }
    usedItems = true;
  }
  if (items.length && ["journey", "constellation", "snapshot"].includes(variant) && w >= 380) {
    if (variant === "journey") {
      const perRow = curriculumGradeRank(m.grade) <= 2 ? 2 : 3, col = inner / perRow;
      for (let row = 0; row * perRow < items.length; row++) {
        const batch = items.slice(row * perRow, (row + 1) * perRow);
        const heights = batch.map(item => h.wrapText(item, col - 18, fs).length * fs * 1.42);
        line(pad + 13, y + 13, pad + (batch.length - 1) * col + 13, y + 13, t.secondaryAccent, 1.5);
        batch.forEach((item, i) => { number(row * perRow + i + 1, pad + i * col, y, 13); tx(item, pad + i * col, y + 38, col - 18); });
        y += Math.max(...heights) + 66;
      }
    } else {
      const cols = curriculumGradeRank(m.grade) <= 2 ? 2 : 3, col = inner / cols;
      const hubY = y;
      circle(w / 2, y + 20, 19, t.secondaryAccent);
      nodes.push({ kind: "text", x: w / 2, y: y + 24, text: variant === "snapshot" ? "IDEA" : "GOAL", size: 9, fill: "#FFFFFF", bold: true, align: "middle" });
      y += 58;
      for (let row = 0; row * cols < items.length; row++) {
        const batch = items.slice(row * cols, (row + 1) * cols);
        const heights = batch.map(item => h.wrapText(item, col - 18, fs).length * fs * 1.42);
        batch.forEach((item, i) => {
          if (!row) line(w / 2, hubY + 40, pad + i * col + col / 2, y, t.borderSoft, 1.2);
          tx(String(row * cols + i + 1).padStart(2, "0"), pad + i * col, y + 4, col - 16, 26, true, t.secondaryAccent);
          tx(item, pad + i * col, y + 46, col - 18);
        });
        y += Math.max(...heights) + 72;
      }
    }
    usedItems = true;
  }
  if (variant === "progression") {
    const labels = ["START", "BUILD", "USE", "THINK", "CHALLENGE"];
    if (w >= 350) {
      const col = inner / 5;
      line(pad + col / 2, y + 33, w - pad - col / 2, y + 33, t.borderSoft, 2);
      labels.forEach((label, i) => {
        number(i + 1, pad + i * col + col / 2 - 11, y + 22 - i * 3, 11 + i, i < 3 ? t.chapterAccent : t.thinkingAccent);
        tx(label, pad + i * col, y + 60, col - 4, 8, true, t.chapterAccent);
      });
      y += 90;
    } else { y = tx(labels.join(" → "), pad, y, inner, 10, true, t.chapterAccent) + 20; }
  }
  if (items.length && !usedItems) {
    items.forEach((item, i) => {
      if (variant === "confidence") {
        for (let j = 0; j < 3; j++) nodes.push({ kind: "ellipse", x: pad + 7 + j * 18, y: y + 12, rx: 5, ry: 5, fill: "none", stroke: t.secondaryAccent, strokeWidth: 1.2 });
        y = tx(item, pad + 64, y, inner - 64) + 15;
      } else if (variant === "conversation") {
        const x = pad + (i % 2 ? 25 : 0), width = inner - 30;
        const height = h.wrapText(item, width - 24, fs).length * fs * 1.42 + 28;
        rect(x, y, width, height, i % 2 ? t.borderSoft : "#FFFFFF", 18);
        nodes.push({ kind: "polygon", points: [[x + 14, y + height - 2], [x + 5, y + height + 10], [x + 35, y + height - 2]], fill: i % 2 ? t.borderSoft : "#FFFFFF" });
        tx(item, x + 12, y + 10, width - 24); y += height + 20;
      } else if (variant === "notebook") {
        tx(String(i + 1).padStart(2, "0"), pad, y, 28, 11, true, t.activityAccent);
        y = tx(item, pad + 36, y, inner - 36) + 10;
        line(pad + 36, y, w - pad, y); y += 12;
      } else {
        number(i + 1, pad, y + 1, curriculumGradeRank(m.grade) < 3 ? 14 : 11);
        y = tx(item, pad + 36, y, inner - 36) + g.gap;
      }
    });
  }
  if (c.materials?.length) {
    y = tx("YOU NEED", pad, y, inner, 10, true, t.activityAccent) + 6;
    y = tx(c.materials.join(" · "), pad, y, inner, fs) + 20;
  }
  (c.steps || []).forEach((s, i) => {
    const rail = pad + 12;
    number(s.stepNumber, pad, y + 1, 12, t.activityAccent);
    y = tx(s.title, pad + 38, y, inner - 38, fs, true, t.chapterAccent) + 6;
    y = tx(s.body, pad + 38, y, inner - 38) + 12;
    if (i < (c.steps?.length || 0) - 1) line(rail, y - 8, rail, y + 15, t.borderSoft, 1.5);
    if (variant === "workmat" || /record|observe|write/i.test(s.title)) y = answerLines(pad + 38, y, inner - 38);
    y += 6;
  });
  (c.questions || []).forEach((q, i) => {
    if (variant === "writing-sheet") {
      rect(pad, y, inner, 24, p.surface, 4);
      y = tx("SHOW YOUR WORK", pad + 10, y + 5, inner - 20, 9, true, t.chapterAccent) + 12;
    }
    number(i + 1, pad, y + 1, 11, m.frameworkStage === "think" ? t.thinkingAccent : t.chapterAccent);
    y = tx(q.prompt, pad + 34, y, inner - 34, fs, true) + 8;
    (q.options || []).forEach((a, j) => { y = tx(`${String.fromCharCode(65 + j)}. ${a}`, pad + 34, y, inner - 34, fs) + 5; });
    if (options.teacher && q.answer) y = tx(`Answer: ${q.answer}`, pad + 34, y, inner - 34, fs, false, t.secondaryAccent) + 8;
    else if (!q.options?.length) y = answerLines(pad + 34, y, inner - 34,
      typeof c.metadata?.answerLines === "number" ? Math.max(1, Math.min(8, c.metadata.answerLines)) : variant === "writing-sheet" ? (curriculumGradeRank(m.grade) < 3 ? 3 : 2) : curriculumGradeRank(m.grade) < 3 ? 2 : 1);
    if (q.points) y = tx(`${q.points} ${q.points === 1 ? "mark" : "marks"}`, pad + 34, y, inner - 34, 9, false, t.chapterAccent) + 6;
    y += g.gap;
  });
  if (c.numberValue !== undefined) y = tx(String(c.numberValue), pad, y, inner, 28, true, t.chapterAccent) + 12;
  if (m.digitalExtension) {
    const d = m.digitalExtension;
    y = tx(`${d.contentType.toUpperCase()} · ${d.duration || "Add duration"}`, pad, y, inner, 10, true, t.secondaryAccent) + 10;
    if (d.qrImageSrc) { nodes.push({ kind: "image", x: pad, y, w: 72, h: 72, src: d.qrImageSrc, alt: "Resource QR code", focalX: .5, focalY: .5, scale: 1, fit: "contain" }); y += 86; }
    y = tx(d.cta || "Scan & explore", pad, y, inner, fs, true, t.chapterAccent) + 8;
    if (d.url) y = tx(d.url, pad, y, inner, 10, false, t.chapterAccent) + 10;
    else y = tx("Add a verified resource link or upload its QR code.", pad, y, inner, 10) + 10;
  } else if (c.qrUrl) y = tx(c.qrUrl, pad, y, inner, 10) + 10;
  if (c.footnote) { line(pad, y + 2, w - pad, y + 2); y = tx(c.footnote, pad, y + 12, inner, Math.max(10, fs * .8)) + 12; }
  // Decorations remain addressable motifs. They never consume reading space.
  (o.motifs || []).filter(a => !a.hidden && a.id !== "curriculum-illustration" && a.role !== "photo").forEach(a => {
    if (a.role !== "plate" && a.role !== "illustration") return;
    const box = motifBox(a.id, a, a.kind);
    const art = h.artworkNodes(a.kind as ArtworkKind, box.x, box.y, box.w, box.h, p, a.opacity);
    nodes.splice(a.behind === false ? nodes.length : 1, 0, ...art.map(n => ({ ...n, motifId: a.id })));
  });
  const height = Math.max(100, y + pad, variant === "split" ? 255 : 0);
  background.h = height;
  const bg = o.backgroundSpec;
  if (bg) {
    background.fill = bg.type === "none" ? "none" : bg.color || background.fill;
    background.radius = bg.cornerRadiusPt || 0;
    background.stroke = bg.type === "bordered" ? bg.borderColor || t.borderSoft : undefined;
    background.strokeWidth = bg.borderWidthPt || 1;
    if (bg.type === "gradient" || bg.type === "mesh") {
      background.gradientId = "curriculum-paper";
      nodes.push({ kind: "gradient", id: "curriculum-paper", x1: 0, y1: 0, x2: bg.gradient?.directionDeg === 90 ? 0 : w, y2: bg.gradient?.directionDeg === 90 ? height : 0, from: bg.gradient?.from || t.surfaceSoft, to: bg.gradient?.to || "#FFFFFF" });
    }
    if (!quiet && bg.patternOverlay && bg.patternOverlay !== "none") nodes.splice(1, 0, ...backgroundPatternNodes(bg.patternOverlay, w, height, p, Math.min(.15, bg.patternOpacity ?? .07)));
  }
  return { width: w, height, nodes, variant: `curriculum-${variant}`, warnings: [], motifs: frames };
}
