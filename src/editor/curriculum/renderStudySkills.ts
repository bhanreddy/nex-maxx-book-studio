import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { AtelierHelpers } from "../educational/atelier/render";
import type { PublicationScene, SceneNode, SceneMotifFrame } from "../educational/publicationScene";
import { studySkillTopics, getSubjectStudySkillDefault } from "./studySkills";
import { CLASS_TYPOGRAPHY } from "../../domain/educational/designTokens";

export function renderStudySkills(
  block: SmartBlockInstance,
  h: Pick<AtelierHelpers, "wrapText">
): PublicationScene {
  const w = Math.max(240, block.transform.width);
  const pad = w < 340 ? 16 : 24;
  const inner = w - pad * 2;
  const o = block.styleOverrides;
  const c = block.semanticContent;
  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";
  const def = getSubjectStudySkillDefault(subject);

  const headerPrompt = c.calloutText || c.subtitle || def.header;
  const badgeTitle = c.badgeLabel || c.title || "STUDY SKILLS";
  const topics = studySkillTopics(block);

  const grade = typeof block.curriculum?.grade === "number" ? block.curriculum.grade : 4;
  const fs = Math.max(12, (CLASS_TYPOGRAPHY[grade]?.body || 14) * 1.15) * Math.max(1, o.fontSizeScale || 1);

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
    strokeWidth = 1.5,
    opacity = 1
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
      strokeWidth: stroke ? strokeWidth : 0,
      opacity,
    });

  const circle = (x: number, y: number, r: number, fill: string, stroke?: string, strokeWidth = 1) =>
    nodes.push({ kind: "ellipse", x, y, rx: r, ry: r, fill, stroke, strokeWidth: stroke ? strokeWidth : 0 });

  const path = (d: string, fill: string, stroke?: string, sw = 1.5) =>
    nodes.push({ kind: "path", d, fill, stroke, strokeWidth: sw });

  const textNode = (
    val: string,
    x: number,
    y: number,
    size = fs,
    fill = "#0D2040",
    bold = false,
    fontFamily = o.fontFamily
  ) => {
    nodes.push({ kind: "text", x, y, text: val, size, fill, bold, fontFamily });
  };

  // Measure with the same font sizes and line spacing used below, so writing
  // boxes and long topic lines never extend beyond their inner surface.
  const promptFs = fs * 1.35;
  const topicFs = fs * 1.45;
  const headerLines = lines(headerPrompt, inner - 60, promptFs);
  let contentHeight = pad + 48 + headerLines.length * promptFs * 1.35 + 12;
  topics.forEach(t => {
    contentHeight += t.isEmpty ? 46 : lines(t.text, inner - 80, topicFs).length * topicFs * 1.4 + 6;
  });
  contentHeight += pad + 30;
  const cardH = Math.max(260, contentHeight, block.transform.height || 0);

  // 1. Soft Shadow Layers for Card
  rect(1.5, 4.5, w - 3, cardH - 3, "#E8E0D7", 26, undefined, 0, 0.4);
  rect(0.5, 2, w - 1, cardH - 1, "#EDE5DC", 26, undefined, 0, 0.6);

  // 2. Main Card Surface (Warm eggshell paper)
  rect(0, 0, w, cardH, "#FAF7F2", 26, "#E2D7CF", 2.2);

  // 3. Tab Badge at Top-Left
  // Peeking peach/terracotta tab behind badge
  rect(pad + 115, 8, 48, 30, "#EE9580", 14);

  // Foreground Deep Indigo Navy Badge
  const badgeW = Math.min(220, w - pad * 2 - 40);
  rect(pad, 6, badgeW, 38, "#182756", 18, "#2F407A", 1.5);

  // Glowing lightbulb in badge
  const bulbX = pad + 24;
  const bulbY = 25;
  // Rays
  path(`M ${bulbX - 8} ${bulbY - 6} L ${bulbX - 12} ${bulbY - 9}`, "none", "#FFFFFF", 1.8);
  path(`M ${bulbX} ${bulbY - 11} L ${bulbX} ${bulbY - 15}`, "none", "#FFFFFF", 1.8);
  path(`M ${bulbX + 8} ${bulbY - 6} L ${bulbX + 12} ${bulbY - 9}`, "none", "#FFFFFF", 1.8);
  path(`M ${bulbX - 10} ${bulbY + 2} L ${bulbX - 14} ${bulbY + 2}`, "none", "#FFFFFF", 1.8);
  path(`M ${bulbX + 10} ${bulbY + 2} L ${bulbX + 14} ${bulbY + 2}`, "none", "#FFFFFF", 1.8);

  // Bulb body
  circle(bulbX, bulbY - 1, 7.5, "#FFFFFF");
  rect(bulbX - 3.5, bulbY + 5, 7, 3, "#FFFFFF", 1.5);

  // Badge Text: STUDY SKILLS (split white & lilac)
  const badgeParts = badgeTitle.split(" ");
  const firstWord = badgeParts[0] || "STUDY";
  const restWords = badgeParts.slice(1).join(" ") || "SKILLS";
  textNode(firstWord, pad + 44, bulbY + 5, 14, "#FFFFFF", true);
  const firstW = firstWord.length * 8.5;
  textNode(restWords, pad + 48 + firstW, bulbY + 5, 14, "#CCD3F8", true);

  // 4. Top-Left 3 Vertical Accent Dots
  const dotColX = pad + 14;
  const dotStartY = 64;
  circle(dotColX, dotStartY, 2.5, "#A2B0D5");
  circle(dotColX, dotStartY + 9, 2.5, "#A2B0D5");
  circle(dotColX, dotStartY + 18, 2.5, "#A2B0D5");

  // 5. Mid-Right 6 Accent Dots (2x3 grid)
  const rightGridX = w - pad - 18;
  const rightGridY = cardH * 0.45;
  for (let r = 0; r < 3; r++) {
    circle(rightGridX, rightGridY + r * 8, 2.2, "#A2B0D5");
    circle(rightGridX + 7, rightGridY + r * 8, 2.2, "#A2B0D5");
  }

  // 6. Top-Right Floating Open Book Illustration
  const bookX = w - pad - 60;
  const bookY = 32;
  // Book Sparkles
  path(`M ${bookX + 12} ${bookY - 8} L ${bookX + 10} ${bookY - 14}`, "none", "#A89BD8", 1.6);
  path(`M ${bookX + 22} ${bookY - 12} L ${bookX + 22} ${bookY - 17}`, "none", "#A89BD8", 1.6);
  path(`M ${bookX + 32} ${bookY - 8} L ${bookX + 34} ${bookY - 14}`, "none", "#A89BD8", 1.6);

  // Left & Right Pages (3D / Clay Lilac)
  path(
    `M ${bookX + 22} ${bookY + 22} C ${bookX + 14} ${bookY + 18}, ${bookX + 4} ${bookY + 16}, ${bookX} ${bookY + 8} L ${bookX + 4} ${bookY} C ${bookX + 10} ${bookY + 6}, ${bookX + 16} ${bookY + 8}, ${bookX + 22} ${bookY + 10} Z`,
    "#C4B8EB",
    "#9E8ED2",
    1.4
  );
  path(
    `M ${bookX + 22} ${bookY + 22} C ${bookX + 30} ${bookY + 18}, ${bookX + 40} ${bookY + 16}, ${bookX + 44} ${bookY + 8} L ${bookX + 40} ${bookY} C ${bookX + 34} ${bookY + 6}, ${bookX + 28} ${bookY + 8}, ${bookX + 22} ${bookY + 10} Z`,
    "#B5A7E4",
    "#9E8ED2",
    1.4
  );

  // 7. Bottom-Left Clay Foliage (Lilac hill, sage leaves, coral berry)
  const blX = 12;
  const blY = cardH - 12;
  // Lilac soft hill
  path(
    `M 0 ${cardH - 30} Q ${blX + 35} ${cardH - 55} ${blX + 75} ${cardH} L 0 ${cardH} Z`,
    "#DDD8EB"
  );
  // Leaf 1 (Sage green)
  path(
    `M ${blX + 14} ${blY - 8} C ${blX + 10} ${blY - 45}, ${blX + 28} ${blY - 60}, ${blX + 34} ${blY - 65} C ${blX + 44} ${blY - 45}, ${blX + 38} ${blY - 20}, ${blX + 26} ${blY - 4} Z`,
    "#739980"
  );
  // Leaf 2 (Light sage green)
  path(
    `M ${blX + 24} ${blY - 8} C ${blX + 35} ${blY - 35}, ${blX + 55} ${blY - 40}, ${blX + 68} ${blY - 35} C ${blX + 58} ${blY - 20}, ${blX + 44} ${blY - 10}, ${blX + 32} ${blY - 4} Z`,
    "#8EB39B"
  );
  // Glossy Coral Berry
  circle(blX + 12, blY - 18, 6.5, "#E87164");
  circle(blX + 10.5, blY - 20, 2, "#FFFFFF", undefined, 0);

  // 8. Bottom-Right Layered Pastel Hills
  // Lilac backdrop mound
  path(
    `M ${w - 110} ${cardH} Q ${w - 75} ${cardH - 65} ${w} ${cardH - 25} L ${w} ${cardH} Z`,
    "#DDD8EB"
  );
  // Warm Peach Mound in front
  path(
    `M ${w - 85} ${cardH} Q ${w - 40} ${cardH - 60} ${w} ${cardH - 10} L ${w} ${cardH} Z`,
    "#F4A390"
  );

  // 9. Center Content Area
  let curY = pad + 48;

  // Header Prompt (e.g. "Face value of:")
  headerLines.forEach(l => {
    // Center text within inner width
    const textW = l.length * (promptFs * 0.55);
    const textX = Math.max(pad + 20, (w - textW) / 2);
    textNode(l, textX, curY + promptFs, promptFs, "#0D2040", true);
    curY += promptFs * 1.35;
  });

  curY += 12;

  // Render Topic Lines or Empty Write-in Boxes
  topics.forEach((t, i) => {
    if (t.isEmpty) {
      // Empty Space: styled dashed workbook write-in box
      const boxW = Math.min(inner - 60, 320);
      const boxX = (w - boxW) / 2;
      rect(boxX, curY + 2, boxW, 36, "#FFFFFF", 12, "#B6C3DC", 1.8, 0.85);
      textNode(t.text ? t.text : "Write your rule / answer here...", boxX + 16, curY + 24, 11, "#92A2BF", false);
      curY += 46;
    } else {
      const tLines = lines(t.text, inner - 80, topicFs);
      tLines.forEach(l => {
        const textW = l.length * (topicFs * 0.56);
        const textX = Math.max(pad + 30, (w - textW) / 2);
        textNode(l, textX, curY + topicFs, topicFs, "#0D2040", true);
        curY += topicFs * 1.4;
      });
      curY += 6;
    }
  });

  return {
    width: w,
    height: cardH,
    nodes,
    motifs,
    variant: "study-skills",
    warnings: [],
  };
}
