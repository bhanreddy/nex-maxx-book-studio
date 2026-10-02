/**
 * Vector Publication Scene Renderer for NEX MAXX Universal Chapter Layout Blocks
 * 
 * Generates exact vector SceneNode[] trees for all 24 universal block categories
 * to ensure 100% parity between canvas rendering and print-ready PDF export.
 */

import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { PublicationScene, SceneNode } from "../educational/publicationScene";
import type { AtelierHelpers } from "../educational/atelier/render";
import { chapterHeroLayout } from "./chapterHeroLayout";
import { normalizeUniversalType, getSubjectFixture } from "./universalBlocks";
import { NEX_MAXX_BRAND, NEX_MAXX_PRESETS, CLASS_TYPOGRAPHY } from "../../domain/educational/designTokens";
import { renderLessonSchema } from "./renderLessonSchema";
import { renderStudySkills } from "./renderStudySkills";
import { renderLearningOutcomes } from "./renderLearningOutcomes";
import { gradientBands, wrapText as publicationWrapText, textWidth as publicationTextWidth } from "../educational/publicationScene";

export function renderUniversalBlockScene(
  block: SmartBlockInstance,
  h?: AtelierHelpers,
  options: { teacher?: boolean } = {}
): PublicationScene {
  if (block.curriculum?.type === "lesson-schema") return renderLessonSchema(block, h || { wrapText: publicationWrapText });
  if (block.curriculum?.type === "study-skills") return renderStudySkills(block, h || { wrapText: publicationWrapText });
  if (block.curriculum?.type === "learning-outcomes" || block.curriculum?.type === "learning-mission") return renderLearningOutcomes(block, h || { wrapText: publicationWrapText });
  const m = block.curriculum || {
    type: block.archetypeId || "section-heading",
    grade: 4,
    subjectLabel: block.subject || "mathematics",
    chapterId: "standalone",
    sourceBlockId: block.id,
    learningOutcomeIds: [],
    difficulty: "start" as const,
    hierarchy: "primary" as const,
    pageRules: { keepTogether: true },
  };
  const c = block.semanticContent;
  const o = block.styleOverrides;
  const uType = normalizeUniversalType(m.type);
  const fixture = getSubjectFixture(m.subjectLabel || "mathematics");

  const w = Math.max(180, block.transform.width);
  const pad = uType === "chapter-hero" ? 18 : w < 280 ? 14 : 20;
  const inner = w - pad * 2;

  const g = CLASS_TYPOGRAPHY[m.grade] || CLASS_TYPOGRAPHY[4];
  const fs = g.body * Math.max(1, o.fontSizeScale || 1);

  const presetKey = (o.blockStyle as keyof typeof NEX_MAXX_PRESETS) || "editorial";
  const activePreset = NEX_MAXX_PRESETS[presetKey] || NEX_MAXX_PRESETS.editorial;

  const customPalette = o.customPalette;
  const primaryColor = customPalette?.primary || activePreset.accent || NEX_MAXX_BRAND.maroon;
  const secondaryColor = customPalette?.accent || NEX_MAXX_BRAND.maroonSecondary;
  const washColor = customPalette?.surface || activePreset.wash || NEX_MAXX_BRAND.washMaroon;
  const textColor = customPalette?.text || NEX_MAXX_BRAND.ink;
  const borderColor = customPalette?.border || NEX_MAXX_BRAND.border;

  const nodes: SceneNode[] = [];
  const warnings: string[] = [];

  const wrapText = (typeof h === "object" && h && typeof h.wrapText === "function")
    ? h.wrapText.bind(h)
    : publicationWrapText;

  const textWidth = (typeof h === "object" && h && typeof h.textWidth === "function")
    ? h.textWidth.bind(h)
    : publicationTextWidth;

  const rect = (x: number, y: number, rw: number, rh: number, fill: string, stroke?: string, radius: number = activePreset.radiusPt) => {
    nodes.push({ kind: "rect", x, y, w: rw, h: rh, fill, stroke, radius, strokeWidth: stroke ? 0.8 : 0 });
  };

  const line = (x: number, y: number, x2: number, y2: number, stroke = borderColor, strokeWidth = 0.8) => {
    nodes.push({ kind: "line", x, y, x2, y2, stroke, strokeWidth });
  };

  const circle = (x: number, y: number, r: number, fill: string, stroke?: string) => {
    nodes.push({ kind: "ellipse", x, y, rx: r, ry: r, fill, stroke, strokeWidth: stroke ? 1.5 : 0 });
  };

  const tx = (value: string | undefined, x: number, y: number, width = inner, size = fs, bold = false, color = textColor, fontSerif = false): number => {
    if (!value) return y;
    const lines = wrapText(String(value), Math.max(12, width), size, bold, fontSerif);
    lines.forEach((text: string, i: number) => {
      nodes.push({
        kind: "text",
        x,
        y: y + size + i * size * 1.4,
        text,
        size,
        fill: color,
        bold,
        font: fontSerif ? "serif" : "sans",
        wrapWidth: Math.max(12, width),
        lineHeight: size * 1.4,
      });
    });
    return y + lines.length * size * 1.4;
  };

  const title = c.title || "Block Title";
  const subtitle = c.subtitle || c.introText || "";
  const items = c.items && c.items.length ? c.items : [];

  let y = pad;

  switch (uType) {
    case "chapter-hero": {
      const design = chapterHeroLayout(w, g.display);
      const titleSize = design.titleSize * Math.max(1, o.fontSizeScale || 1);
      const titleLines = wrapText(title, design.titleWidth, titleSize, true);
      const titleHeight = titleLines.length * titleSize * 1.05;
      const subtitleHeight = subtitle ? wrapText(subtitle, design.titleWidth, fs).length * fs * 1.4 : 0;
      const textHeight = titleHeight + (subtitle ? 8 + subtitleHeight : 0);
      const bannerH = design.stacked ? 86 + design.gap + textHeight + design.gap + 145 : Math.max(170, textHeight + 16);
      const cardHeight = Math.max(block.transform.height || 0, bannerH + pad * 2);
      rect(0, 0, w, cardHeight, "#fcf9f2", "#e8d7b0", 18);
      // Frame decoration follows the trimmed frame; reading content keeps its own scale.
      nodes.push({kind:"path",d:`M 0 14 Q ${w*.22} 36 ${w*.5} 18 Q ${w*.8} 4 ${w} 18 L ${w} 0 L 0 0 Z`,fill:"#80122e"});
      nodes.push({kind:"path",d:`M 0 ${cardHeight-12} Q ${w*.25} ${cardHeight-30} ${w*.5} ${cardHeight-12} Q ${w*.8} ${cardHeight+2} ${w} ${cardHeight-18} L ${w} ${cardHeight} L 0 ${cardHeight} Z`,fill:"#80122e",stroke:"#d49b28",strokeWidth:2});
      const badgeX = design.stacked ? (w-design.badgeWidth)/2 : pad;
      const badgeY = design.stacked ? pad : pad+(bannerH-86)/2;
      rect(badgeX, badgeY, design.badgeWidth, 86, "#600b20", "#d49b28", 22);
      nodes.push({kind:"text",x:badgeX+design.badgeWidth/2,y:badgeY+22,text:c.badgeLabel||"CHAPTER",size:8.5,fill:"#FFFFFF",bold:true,align:"middle"});
      nodes.push({kind:"text",x:badgeX+design.badgeWidth/2,y:badgeY+65,text:c.chapterNumber||"1",size:36,fill:"#fff9ee",bold:true,align:"middle"});
      const titleX = design.stacked ? pad : badgeX+design.badgeWidth+design.gap;
      const titleY = design.stacked ? pad+86+design.gap : pad+(bannerH-textHeight)/2;
      titleLines.forEach((text,i)=>nodes.push({kind:"text",x:titleX,y:titleY+titleSize+i*titleSize*1.05,text,size:titleSize,fill:i===0?"#f59e0b":"#881337",bold:true}));
      tx(subtitle,titleX,titleY+titleHeight+8,design.titleWidth,fs,false,"#60523e");
      const imageScale=c.imageScale||1,imgW=design.imageWidth*imageScale,imgH=145*imageScale;
      const imageX=design.stacked?(w-design.imageWidth)/2:w-pad-design.imageWidth;
      const imageY=design.stacked?titleY+textHeight+design.gap:pad+(bannerH-145)/2;
      nodes.push({kind:"image",x:imageX+(c.imageOffsetX||0)*.75-(imgW-design.imageWidth)/2,y:imageY+(c.imageOffsetY||0)*.75-(imgH-145)/2,w:imgW,h:imgH,
        src:c.illustrationUrl||"/assets/chapter-hero/student-original-clean.png",alt:`${title} illustration`,fit:"contain",scale:1,focalX:.5,focalY:.5,flipX:!!c.imageFlipX});
      y=pad+bannerH;
      break;
    }

    case "infographic-stats": {
      const stats = items.length ? items.slice(0, 3) : fixture.hero;
      const labels = fixture.labels || ["First notation", "Second notation", "Third notation"];
      rect(pad, y, inner, 120, washColor, borderColor, 12);
      tx(title, pad + 14, y + 10, inner - 28, 9, true, primaryColor);
      const colW = (inner - 28 - 16) / 3;
      stats.forEach((st, idx) => {
        const cx = pad + 14 + idx * (colW + 8);
        rect(cx, y + 30, colW, 76, "#FFFFFF", borderColor, 8);
        tx(st, cx + 10, y + 44, colW - 20, 16, true, idx === 0 ? "#873258" : idx === 1 ? "#157e7a" : "#b17a17");
        tx(labels[idx] || "", cx + 10, y + 74, colW - 20, 8.5, false, "#888392");
      });
      y += 134;
      break;
    }

    case "mission-banner": {
      const bannerH = 74;
      rect(pad, y, inner, bannerH, primaryColor, undefined, 12);
      circle(pad + 28, y + bannerH / 2, 16, `${primaryColor}44`, "#FFFFFF");
      nodes.push({ kind: "text", x: pad + 23, y: y + bannerH / 2 + 5, text: "✦", size: 14, fill: "#FFFFFF", bold: true });
      tx(title, pad + 56, y + 14, inner - 68, 11, true, "#FFFFFF");
      tx(subtitle, pad + 56, y + 34, inner - 68, 9.5, false, "#FFE8EE");
      y += bannerH + 16;
      break;
    }

    case "learning-journey": {
      const journeySteps = items.length ? items.slice(0, 4) : ["Explore", "Understand", "Practice", "Create"];
      tx(title, pad, y, inner, 9, true, primaryColor);
      y += 18;
      const stepW = (inner - 18) / 4;
      const stepH = 80;
      const stepColors = ["#9c3c69", "#188a89", "#bd8429", "#6558ad"];
      const stepFills = ["#FFFFFF", "#F0FBFA", "#FFF9EB", "#F5F4FF"];
      journeySteps.forEach((s, idx) => {
        const sx = pad + idx * (stepW + 6);
        rect(sx, y, stepW, stepH, stepFills[idx % 4], borderColor, 8);
        nodes.push({ kind: "text", x: sx + 10, y: y + 26, text: String(idx + 1).padStart(2, "0"), size: 18, fill: stepColors[idx % 4], bold: true });
        tx(s, sx + 10, y + 36, stepW - 20, 9.5, true, "#48495B");
      });
      y += stepH + 16;
      break;
    }

    case "section-heading": {
      rect(pad, y + 3, 14, 3, primaryColor, undefined, 2);
      tx("THE NEXT BIG IDEA", pad + 20, y, inner - 20, 9, true, primaryColor);
      y += 18;
      y = tx(title, pad, y, inner, g.heading * 1.2, true, textColor, true) + 8;
      y = tx(subtitle, pad, y, inner, fs, false, "#586073") + 14;
      break;
    }

    case "topic-banner": {
      const bannerH = 72;
      rect(pad, y + 4, inner, bannerH, "#1E293B", "#334155", 24);
      nodes.push({ kind: "text", x: pad + 32, y: y + 42, text: title || "SUCCESSOR", size: 18, fill: "#FFFBF5", bold: true });
      const conn = c.badgeLabel || "AND";
      rect(pad + 160, y + 25, 42, 22, "#EF4444", "#F87171", 11);
      nodes.push({ kind: "text", x: pad + 181, y: y + 40, text: conn, size: 9, fill: "#FFFFFF", bold: true, align: "middle" });
      nodes.push({ kind: "text", x: pad + 215, y: y + 42, text: subtitle || "PREDECESSOR", size: 18, fill: "#FDBA74", bold: true });
      y += bannerH + 16;
      break;
    }

    case "fact-zone": {
      const cardH = 80;
      rect(pad, y, inner, cardH, "#FFFDF8", "#1E2C5B", 40);
      circle(pad + 28, y + 20, 18, "#FFF9F2", "#16294A");
      nodes.push({ kind: "text", x: pad + 22, y: y + 26, text: "💡", size: 14, fill: "#FFDE59" });
      rect(pad + 48, y + 8, 100, 24, "#16294A", undefined, 6);
      nodes.push({ kind: "text", x: pad + 56, y: y + 24, text: c.badgeLabel || title || "FACT ZONE", size: 10, fill: "#FFFFFF", bold: true });
      tx(c.calloutText || c.introText || "Key educational fact or takeaway.", pad + 36, y + 42, inner - 110, fs, false, "#1E293B");
      circle(pad + inner - 32, y + cardH / 2, 24, "#FFFDF8", "#00B4A4");
      nodes.push({ kind: "text", x: pad + inner - 39, y: y + cardH / 2 + 6, text: "📚", size: 16, fill: "#1E3A8A" });
      y += cardH + 16;
      break;
    }

    case "life-connect": {
      const bannerH = 76;
      rect(pad + 12, y, inner - 24, bannerH, "#0B2545", undefined, 14);
      rect(pad + 12, y + bannerH - 4, inner - 24, 4, "#00A896");
      nodes.push({ kind: "text", x: pad + 36, y: y + 38, text: c.badgeLabel || "LIFE", size: 20, fill: "#FFFFFF", bold: true });
      nodes.push({ kind: "text", x: pad + 95, y: y + 38, text: title || "CONNECT", size: 20, fill: "#FF7556", bold: true });
      if (c.calloutText || c.introText) {
        tx(c.calloutText || c.introText, pad + 36, y + 54, inner - 140, 9, false, "#CBD5E1");
      }
      circle(pad + inner - 42, y + bannerH / 2, 28, "#F0FDF4", "#0E4A56");
      nodes.push({ kind: "text", x: pad + inner - 50, y: y + bannerH / 2 + 7, text: "🌱", size: 18, fill: "#16A34A" });
      y += bannerH + 16;
      break;
    }

    case "learning-outcomes": {
      rect(pad, y, inner, 1, washColor, "#F1DCE4", 12);
      const startY = y;
      tx(title, pad + 14, y + 12, inner - 28, 11, true, textColor);
      y += 36;
      const half = (inner - 28 - 12) / 2;
      const outcomeList = items.length ? items : fixture.objective;
      for (let i = 0; i < outcomeList.length; i += 2) {
        const o1 = outcomeList[i], o2 = outcomeList[i + 1];
        const h1 = wrapText(o1, half - 28, fs).length * fs * 1.4 + 14;
        const h2 = o2 ? wrapText(o2, half - 28, fs).length * fs * 1.4 + 14 : 0;
        const rowH = Math.max(h1, h2, 38);
        rect(pad + 14, y, half, rowH, "#FFFFFF", "#EEEAF0", 6);
        circle(pad + 24, y + 14, 6, "#E8F7F2");
        nodes.push({ kind: "text", x: pad + 21, y: y + 17, text: "✓", size: 8, fill: "#288974", bold: true });
        tx(o1, pad + 36, y + 8, half - 44, fs, false, "#414A5C");
        if (o2) {
          rect(pad + 14 + half + 12, y, half, rowH, "#FFFFFF", "#EEEAF0", 6);
          circle(pad + 14 + half + 22, y + 14, 6, "#E8F7F2");
          nodes.push({ kind: "text", x: pad + 14 + half + 19, y: y + 17, text: "✓", size: 8, fill: "#288974", bold: true });
          tx(o2, pad + 14 + half + 34, y + 8, half - 44, fs, false, "#414A5C");
        }
        y += rowH + 8;
      }
      // Update background height
      const totalH = y - startY + 8;
      const bgNode = nodes.find(n => n.kind === "rect" && n.x === pad && n.y === startY);
      if (bgNode && bgNode.kind === "rect") bgNode.h = totalH;
      y += 14;
      break;
    }

    case "concept-comparison": {
      const half = (inner - 14) / 2;
      const p = items.length >= 4 ? items : [
        fixture.conceptA || "Place value",
        fixture.conceptTextA || "The position of a digit changes its value.",
        fixture.conceptB || "Face value",
        fixture.conceptTextB || "A digit keeps the same face value wherever it appears.",
      ];
      const tileH = 116;
      // Tile 1
      rect(pad, y, half, tileH, "#FFFFFF", "#EEE5E9", 10);
      tx("CONCEPT 01", pad + 12, y + 10, half - 24, 8, true, primaryColor);
      tx(p[0], pad + 12, y + 26, half - 24, 12, true, textColor);
      tx(p[1], pad + 12, y + 46, half - 24, 9.5, false, "#6A7380");
      // Mini Diagram Bars
      [12, 22, 10, 18].forEach((bh, bi) => {
        rect(pad + 12 + bi * 16, y + tileH - bh - 10, 12, bh, ["#e7c0d1", "#c76f95", "#8bbfbd", "#f0c56e"][bi], undefined, 2);
      });

      // Tile 2
      const x2 = pad + half + 14;
      rect(x2, y, half, tileH, "#F6FBFC", "#E3F1F1", 10);
      tx("CONCEPT 02", x2 + 12, y + 10, half - 24, 8, true, "#137F83");
      tx(p[2], x2 + 12, y + 26, half - 24, 12, true, textColor);
      tx(p[3], x2 + 12, y + 46, half - 24, 9.5, false, "#6A7380");
      [16, 8, 24, 14].forEach((bh, bi) => {
        rect(x2 + 12 + bi * 16, y + tileH - bh - 10, 12, bh, ["#8bbfbd", "#e7c0d1", "#137f83", "#f0c56e"][bi], undefined, 2);
      });

      y += tileH + 16;
      break;
    }

    case "key-insight": {
      const boxH = 68;
      rect(pad, y, inner, boxH, "#222838", undefined, 10);
      circle(pad + 24, y + 24, 12, "#FFFFFF25");
      nodes.push({ kind: "text", x: pad + 19, y: y + 28, text: "✧", size: 12, fill: "#FFFFFF", bold: true });
      tx(title, pad + 48, y + 12, inner - 60, 10, true, "#FFFFFF");
      tx(subtitle, pad + 48, y + 28, inner - 60, 9.5, false, "#DEE2EE");
      y += boxH + 14;
      break;
    }

    case "smart-table": {
      const rows = items.length >= 6 ? items : ["Place value", "Face value", "Think deeply", "Observe carefully", "Describe clearly", "Give an example"];
      rect(pad, y, inner, 26, "#263143", undefined, 6);
      tx(title, pad + 10, y + 7, inner - 20, 9, true, "#FFFFFF");
      y += 26;
      const colW = inner / 3;
      // Header row
      rect(pad, y, inner, 24, "#F4F7F8", borderColor, 0);
      for (let i = 0; i < 3; i++) {
        tx(rows[i] || "", pad + i * colW + 6, y + 6, colW - 12, 9, true, "#333947");
        if (i < 2) line(pad + (i + 1) * colW, y, pad + (i + 1) * colW, y + 24);
      }
      y += 24;
      // Body row
      rect(pad, y, inner, 26, "#FFFFFF", borderColor, 0);
      for (let i = 0; i < 3; i++) {
        tx(rows[i + 3] || "", pad + i * colW + 6, y + 6, colW - 12, 9, false, "#444B59");
        if (i < 2) line(pad + (i + 1) * colW, y, pad + (i + 1) * colW, y + 26);
      }
      y += 38;
      break;
    }

    case "quick-check": {
      const qPrompt = c.questions?.[0]?.prompt || subtitle || "In 6,42,510, which digit represents forty thousand?";
      rect(pad, y, inner, 68, "#F4FBFB", "#DFECED", 10);
      rect(pad + 12, y + 14, 20, 20, "#248E8F", undefined, 4);
      nodes.push({ kind: "text", x: pad + 18, y: y + 29, text: "?", size: 12, fill: "#FFFFFF", bold: true });
      tx(title, pad + 40, y + 10, inner - 52, 8.5, true, "#8C405D");
      tx(qPrompt, pad + 40, y + 24, inner - 52, 10, true, "#222335");
      line(pad + 40, y + 54, w - pad - 12, y + 54, "#ACB8BF", 0.6);
      y += 82;
      break;
    }

    case "worked-example": {
      const boxH = 110;
      rect(pad, y, inner, boxH, washColor, "#F1DCE4", 12);
      tx(title, pad + 12, y + 10, inner - 24, 10, true, textColor);
      tx(subtitle, pad + 12, y + 26, inner - 24, 9.5, false, "#586073");
      const half = (inner - 36) / 2;
      rect(pad + 12, y + 48, half, 50, "#FFFFFF", "#EEE5E9", 6);
      tx("STEP 01 · NOTICE", pad + 20, y + 54, half - 16, 8, true, primaryColor);
      tx(c.steps?.[0]?.body || "Underline important information.", pad + 20, y + 68, half - 16, 9, false, "#48495B");
      rect(pad + 12 + half + 12, y + 48, half, 50, "#FFFFFF", "#EEE5E9", 6);
      tx("STEP 02 · REASON", pad + 24 + half, y + 54, half - 16, 8, true, "#188A89");
      tx(c.steps?.[1]?.body || "Explain your method with evidence.", pad + 24 + half, y + 68, half - 16, 9, false, "#48495B");
      y += boxH + 16;
      break;
    }

    case "guided-exercises": {
      const exList = items.length ? items : fixture.exercise;
      rect(pad, y, inner, 1, "#FFFFFF", borderColor, 12);
      const startY = y;
      tx(title, pad + 14, y + 10, inner - 28, 10.5, true, textColor);
      y += 28;
      exList.forEach((ex, idx) => {
        nodes.push({ kind: "text", x: pad + 14, y: y + 13, text: String(idx + 1).padStart(2, "0"), size: 10, fill: primaryColor, bold: true });
        tx(ex, pad + 36, y + 2, inner - 52, fs, false, "#41495A");
        y += 22;
        line(pad + 36, y, w - pad - 14, y, "#BAC0CB", 0.6);
        y += 12;
      });
      const totalH = y - startY + 6;
      const bgNode = nodes.find(n => n.kind === "rect" && n.x === pad && n.y === startY);
      if (bgNode && bgNode.kind === "rect") bgNode.h = totalH;
      y += 14;
      break;
    }

    case "answer-workspace": {
      const spaceH = 88;
      rect(pad, y, inner, spaceH, "#F8FBFC", "#B6D8DC", 10);
      tx(title, pad + 12, y + 10, inner - 24, 10, true, textColor);
      tx(subtitle, pad + 12, y + 24, inner - 24, 8.5, false, "#737C8D");
      for (let ly = y + 42; ly < y + spaceH - 8; ly += 16) {
        line(pad + 12, ly, w - pad - 12, ly, "#D2E2E9", 0.6);
      }
      y += spaceH + 14;
      break;
    }

    case "activity-lab": {
      const labH = 110;
      rect(pad, y, inner, labH, "#FFFAEF", "#F3E4C2", 12);
      tx(title, pad + 12, y + 10, inner - 24, 10.5, true, textColor);
      tx(subtitle, pad + 12, y + 26, inner - 24, 9, false, "#586073");
      const stepsList = c.steps && c.steps.length ? c.steps : [
        { title: "PLAN", body: "Agree on a question and gather materials." },
        { title: "DO", body: "Test, create, observe or investigate." },
        { title: "SHARE", body: "Present what you noticed and explain why." },
      ];
      stepsList.slice(0, 3).forEach((s, idx) => {
        const sy = y + 46 + idx * 18;
        rect(pad + 12, sy, inner - 24, 16, "#FFFAF1", undefined, 2);
        line(pad + 12, sy, pad + 12, sy + 16, "#DBA04C", 3);
        tx(`0${idx + 1} ${s.title} — ${s.body}`, pad + 18, sy + 2, inner - 36, 8.5, false, "#586073");
      });
      y += labH + 14;
      break;
    }

    case "real-world-case": {
      const caseH = 76;
      rect(pad, y, inner, caseH, "#EEFBFA", "#D4EEED", 10);
      tx(title, pad + 12, y + 10, inner - 24, 10.5, true, textColor);
      tx(subtitle, pad + 12, y + 26, inner - 24, 9, false, "#586073");
      tx("Think • Collect evidence • Explain • Reflect", pad + 12, y + 54, inner - 24, 8, true, "#167E7E");
      y += caseH + 14;
      break;
    }

    case "vocabulary-bank": {
      const words = items.length ? items : fixture.vocab;
      rect(pad, y, inner, 1, "#FFFFFF", borderColor, 10);
      const startY = y;
      tx(title, pad + 12, y + 10, inner - 24, 10, true, textColor);
      y += 28;
      let currX = pad + 12;
      words.forEach(wrd => {
        const pw = textWidth(wrd, 9, true) + 20;
        rect(currX, y, pw, 22, "#FDF1F6", "#F4DCE7", 6);
        tx(wrd, currX + 10, y + 5, pw - 20, 9, true, "#7D3559");
        currX += pw + 8;
      });
      y += 30;
      const totalH = y - startY + 6;
      const bgNode = nodes.find(n => n.kind === "rect" && n.x === pad && n.y === startY);
      if (bgNode && bgNode.kind === "rect") bgNode.h = totalH;
      y += 14;
      break;
    }

    case "reflection-connect": {
      rect(pad, y, inner, 64, "#F4FBFB", "#DFECED", 10);
      rect(pad + 12, y + 12, 18, 18, "#248E8F", undefined, 4);
      nodes.push({ kind: "text", x: pad + 17, y: y + 25, text: "↗", size: 10, fill: "#FFFFFF", bold: true });
      tx(title, pad + 38, y + 10, inner - 50, 8.5, true, "#8C405D");
      tx(subtitle, pad + 38, y + 22, inner - 50, 9.5, true, "#222335");
      line(pad + 38, y + 46, w - pad - 12, y + 46, "#ACB8BF", 0.6);
      y += 76;
      break;
    }

    case "mastery-rubric": {
      const rubrics = items.length ? items : fixture.rubric;
      rect(pad, y, inner, 1, "#FFFFFF", borderColor, 10);
      const startY = y;
      tx(title, pad + 12, y + 10, inner - 24, 10, true, textColor);
      y += 28;
      rubrics.forEach(rub => {
        tx(rub, pad + 12, y + 4, inner - 70, 9.5, false, "#505B6A");
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          circle(w - pad - 46 + rIdx * 14, y + 10, 5, "#FFFFFF", "#BDC4CE");
        }
        y += 22;
        line(pad + 12, y, w - pad - 12, y, "#E9ECF0", 0.6);
        y += 6;
      });
      const totalH = y - startY + 6;
      const bgNode = nodes.find(n => n.kind === "rect" && n.x === pad && n.y === startY);
      if (bgNode && bgNode.kind === "rect") bgNode.h = totalH;
      y += 14;
      break;
    }

    case "chapter-summary": {
      const sumH = 68;
      rect(pad, y, inner, sumH, primaryColor, undefined, 12);
      circle(pad + 24, y + sumH / 2, 14, "#FFFFFF25");
      nodes.push({ kind: "text", x: pad + 20, y: y + sumH / 2 + 5, text: "✧", size: 12, fill: "#FFFFFF", bold: true });
      tx(title, pad + 48, y + 14, inner - 60, 10, true, "#FFFFFF");
      tx(subtitle, pad + 48, y + 32, inner - 60, 9.5, false, "#FFE8EE");
      y += sumH + 16;
      break;
    }

    case "teacher-note": {
      if (options.teacher !== false) {
        rect(pad, y, inner, 36, "#FFF7EB", "#F5E4C7", 8);
        nodes.push({ kind: "text", x: pad + 12, y: y + 21, text: "FACILITATOR ONLY", size: 8.5, fill: "#B5740B", bold: true });
        tx(subtitle, pad + 110, y + 10, inner - 122, 8.5, false, "#80673F");
        y += 48;
      }
      break;
    }

    case "assessment-cards": {
      const cards = items.length ? items.slice(0, 3) : fixture.exercise;
      const headers = ["REMEMBER", "APPLY", "EXPLAIN"];
      rect(pad, y, inner, 120, washColor, "#F1DCE4", 12);
      tx(title, pad + 12, y + 10, inner - 24, 10, true, textColor);
      const cardW = (inner - 24 - 16) / 3;
      cards.forEach((cd, idx) => {
        const cx = pad + 12 + idx * (cardW + 8);
        rect(cx, y + 28, cardW, 80, "#FFFFFF", "#E9EAF0", 8);
        tx(headers[idx] || "ITEM", cx + 8, y + 36, cardW - 16, 8, true, primaryColor);
        tx(cd, cx + 8, y + 50, cardW - 16, 8.5, false, "#586075");
        line(cx + 8, y + 96, cx + cardW - 8, y + 96, "#E2E8F0", 0.6);
      });
      y += 134;
      break;
    }

    default: {
      rect(pad, y, inner, 60, "#FFFFFF", borderColor, 10);
      tx(title, pad + 12, y + 10, inner - 24, 11, true, textColor);
      tx(subtitle, pad + 12, y + 28, inner - 24, 9.5, false, "#586073");
      y += 74;
    }
  }

  const hTotal = Math.max(block.transform.height || 0, y + pad);

  return {
    width: w,
    height: hTotal,
    nodes,
    variant: uType,
    warnings,
  };
}
