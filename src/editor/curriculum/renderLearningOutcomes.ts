import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { AtelierHelpers } from "../educational/atelier/render";
import type { PublicationScene, SceneNode, SceneMotifFrame } from "../educational/publicationScene";
import { learningOutcomeTopics, getSubjectOutcomeDefault } from "./learningOutcomes";
import { CLASS_TYPOGRAPHY } from "../../domain/educational/designTokens";

export function renderLearningOutcomes(
  block: SmartBlockInstance,
  h: Pick<AtelierHelpers, "wrapText">
): PublicationScene {
  const w = Math.max(220, block.transform.width);
  const pad = w < 320 ? 14 : 22;
  const inner = w - pad * 2;
  const o = block.styleOverrides;
  const c = block.semanticContent;
  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  const def = getSubjectOutcomeDefault(subject);

  const title = c.title || "LEARNING OUTCOMES";
  const subtitle = c.calloutText || c.subtitle || def.intro;
  const topics = learningOutcomeTopics(block);

  const grade = typeof block.curriculum?.grade === "number" ? block.curriculum.grade : 4;
  const fs = Math.max(10, (CLASS_TYPOGRAPHY[grade]?.body || 13) * 0.85) * Math.max(1, o.fontSizeScale || 1);

  const nodes: SceneNode[] = [];
  const motifs: SceneMotifFrame[] = [];

  const lines = (val: string, width: number, size = fs) =>
    h.wrapText(val, Math.max(16, width), size, false);

  const rect = (
    x: number,
    y: number,
    rw: number,
    rh: number,
    fill: string,
    radius: number,
    stroke?: string,
    opacity?: number
  ) =>
    nodes.push({
      kind: "rect",
      x,
      y,
      w: rw,
      h: rh,
      fill,
      radius,
      stroke,
      strokeWidth: stroke ? 1.5 : 0,
      opacity,
    });

  const circle = (x: number, y: number, r: number, fill: string, stroke?: string) =>
    nodes.push({ kind: "ellipse", x, y, rx: r, ry: r, fill, stroke, strokeWidth: stroke ? 1.2 : 0 });

  const path = (d: string, fill: string, stroke?: string, sw = 1.5) =>
    nodes.push({ kind: "path", d, fill, stroke, strokeWidth: sw });

  const textNode = (
    val: string,
    x: number,
    y: number,
    size = fs,
    fill = "#1E2A4A",
    bold = false,
    fontFamily = o.fontFamily
  ) => {
    nodes.push({ kind: "text", x, y, text: val, size, fill, bold, fontFamily });
  };

  const startY = 0;
  let curY = pad;

  // Measure content
  const artworkWidth = w > 480 ? 170 : 0;
  const contentWidth = inner - (artworkWidth > 0 ? artworkWidth + 16 : 0);

  // 1. Header Pill Banner
  const bannerW = Math.min(230, contentWidth);
  const bannerH = 34;

  // Offset lower 3D shadow layer
  rect(pad + 1.5, curY + 2.5, bannerW, bannerH, "#212845", 17);
  // Main pill surface
  rect(pad, curY, bannerW, bannerH, "#2F3B66", 17, "#586799");

  // Bullseye circular badge
  circle(pad + 17, curY + 17, 12, "#FFFFFF", "#B2C9EF");
  circle(pad + 17, curY + 17, 7, "none", "#253565");
  circle(pad + 17, curY + 17, 3, "#253565");
  path(`M ${pad + 9} ${curY + 9} L ${pad + 6} ${curY + 6}`, "none", "#253565", 1.5);

  // Banner text
  const rawTitle = c.title || "LEARNING OUTCOMES";
  const parts = rawTitle.split(" ");
  if (parts.length > 1) {
    const firstWord = parts[0];
    const restWords = parts.slice(1).join(" ");
    textNode(firstWord, pad + 36, curY + 22, 11, "#FFFFFF", true);
    const firstOffset = firstWord.length * 7.2;
    textNode(restWords, pad + 36 + firstOffset + 5, curY + 22, 11, "#F2B5E2", true);
  } else {
    textNode(rawTitle, pad + 36, curY + 22, 11, "#FFFFFF", true);
  }

  // Decorative accent line next to banner
  if (w > 360) {
    const decX = pad + bannerW + 12;
    circle(decX, curY + 17, 2.5, "#AABDE0");
    circle(decX + 7, curY + 17, 2.5, "#AABDE0");
    circle(decX + 14, curY + 17, 2.5, "#AABDE0");
    path(`M ${decX + 22} ${curY + 17} L ${decX + 60} ${curY + 17}`, "none", "#AABDE0", 1.5);
    circle(decX + 64, curY + 17, 3, "#AABDE0");
  }

  curY += bannerH + 14;

  // 2. Subtitle Prompt
  const subLines = lines(subtitle, contentWidth, fs * 1.1);
  subLines.forEach((l, i) => {
    textNode(l, pad, curY + (i + 1) * fs * 1.25, fs * 1.05, "#182650", true);
  });
  curY += subLines.length * fs * 1.25 + 14;

  const topicsStartY = curY;

  // 3. Topics Rows
  topics.forEach((topic, idx) => {
    const rowY = curY;
    const badgeColor = topic.color || "#B93B58";
    const diamondSize = 18;

    // Diamond polygon: rotated square
    const cx = pad + 12;
    const cy = rowY + 9;
    const s = diamondSize / 2;
    path(
      `M ${cx} ${cy - s} L ${cx + s} ${cy} L ${cx} ${cy + s} L ${cx - s} ${cy} Z`,
      badgeColor,
      undefined,
      1
    );

    // Inner icon symbol
    if (topic.icon === "pencil") {
      path(`M ${cx - 2} ${cy + 2} L ${cx + 3} ${cy - 3}`, "none", "#FFFFFF", 1.5);
    } else if (topic.icon === "book") {
      path(`M ${cx - 4} ${cy} Q ${cx} ${cy - 2} ${cx + 4} ${cy}`, "none", "#FFFFFF", 1.5);
    } else if (topic.icon === "code") {
      path(`M ${cx + 2} ${cy - 3} L ${cx + 4} ${cy} L ${cx + 2} ${cy + 3} M ${cx - 2} ${cy - 3} L ${cx - 4} ${cy} L ${cx - 2} ${cy + 3}`, "none", "#FFFFFF", 1.3);
    } else if (topic.icon === "chart") {
      path(`M ${cx - 3} ${cy + 4} L ${cx - 3} ${cy} M ${cx} ${cy + 4} L ${cx} ${cy - 2} M ${cx + 3} ${cy + 4} L ${cx + 3} ${cy - 4}`, "none", "#FFFFFF", 1.5);
    } else if (topic.icon === "calculator") {
      rect(cx - 3, cy - 4, 6, 8, "none", 1, "#FFFFFF");
    } else {
      circle(cx, cy, 3, "#FFFFFF");
    }

    const textX = pad + 28;
    const rowWidth = contentWidth - 32;

    if (topic.isEmpty) {
      // Empty dashed line
      path(`M ${textX} ${rowY + 12} L ${textX + rowWidth} ${rowY + 12}`, "none", "#B8C9E8", 1.5);
      curY += 24;
    } else {
      const verbStr = topic.verb ? `${topic.verb} ` : "";
      const fullStr = `${verbStr}${topic.text}`;
      const wrapped = lines(fullStr, rowWidth, fs);
      const rowH = Math.max(24, wrapped.length * fs * 1.35 + 6);

      wrapped.forEach((lineText, li) => {
        if (li === 0 && topic.verb && lineText.startsWith(topic.verb)) {
          textNode(topic.verb, textX, rowY + fs * 1.2, fs, badgeColor, true);
          const verbOffset = topic.verb.length * fs * 0.65;
          textNode(lineText.slice(topic.verb.length), textX + verbOffset, rowY + fs * 1.2, fs, "#2D395A", false);
        } else {
          textNode(lineText, textX, rowY + (li + 1) * fs * 1.2, fs, "#2D395A", false);
        }
      });

      curY += rowH + 6;
    }

    // Dashed divider line under row
    path(`M ${pad} ${curY - 2} L ${pad + contentWidth} ${curY - 2}`, "none", "#CCD9F0", 1);
  });

  // 4. Vector Artwork on the Right (Books + Bulb + Plane)
  if (artworkWidth > 0) {
    const artX = pad + contentWidth + 14;
    const artY = topicsStartY + 20;

    // Books stack
    // Bottom Green book
    rect(artX + 10, artY + 110, 120, 18, "#559976", 4, "#35694F");
    rect(artX + 18, artY + 113, 108, 12, "#F7F4EB", 2);

    // Middle Purple book
    rect(artX + 14, artY + 90, 114, 18, "#A35487", 4, "#6C3359");
    rect(artX + 22, artY + 93, 102, 12, "#F7F4EB", 2);

    // Top Blue book
    rect(artX + 18, artY + 70, 110, 18, "#5388C8", 4, "#305A96");
    rect(artX + 26, artY + 73, 98, 12, "#F7F4EB", 2);

    // Lightbulb
    const bx = artX + 70;
    const by = artY + 36;
    circle(bx, by, 32, "#C3DCFF", undefined);
    circle(bx, by, 16, "#FFFFFF", "#4076BA");
    rect(bx - 5, by + 16, 10, 6, "#8199B9", 1);

    // Sparkles
    path(`M ${bx} ${by - 24} L ${bx} ${by - 18} M ${bx + 20} ${by - 15} L ${bx + 15} ${by - 10} M ${bx - 20} ${by - 15} L ${bx - 15} ${by - 10}`, "none", "#396FB3", 1.8);

    // Paper airplane
    const px = artX + 115;
    const py = artY + 12;
    path(`M ${px} ${py} L ${px - 22} ${py + 26} L ${px - 8} ${py + 18} Z`, "#FFFFFF", "#6D81B3", 1);
    path(`M ${px - 8} ${py + 18} L ${px - 22} ${py + 26} L ${px - 14} ${py + 29} Z`, "#8FA5D6", "#6D81B3", 1);
    path(`M ${bx + 14} ${by - 10} Q ${px - 16} ${py + 30} ${px - 8} ${py + 20}`, "none", "#889EC8", 1.5);
  }

  // 5. Bottom 5 Pastel Dots
  curY += 10;
  for (let d = 0; d < 5; d++) {
    circle(pad + d * 10, curY, 3, "#B8CAE8");
  }
  curY += 16;

  // Insert background rect behind all nodes
  const totalH = Math.max(curY, 260, block.transform.height || 0);
  nodes.unshift({
    kind: "rect",
    x: 0,
    y: 0,
    w,
    h: totalH,
    fill: "#F6F9FE",
    radius: 26,
    stroke: "#B8CAE8",
    strokeWidth: 2,
  });

  motifs.push({
    id: "learning-outcomes-card",
    role: "learning-outcomes",
    kind: "learning-outcomes",
    x: 0,
    y: 0,
    w,
    h: totalH,
  });

  return {
    width: w,
    height: totalH,
    nodes,
    motifs,
    variant: "learning-outcomes",
    warnings: [],
  };
}
