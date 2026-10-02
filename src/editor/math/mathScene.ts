// ============================================================================
// NEX MAXX BOOK STUDIO - MATH COMPONENT VECTOR SCENE GENERATOR
// Translates parametric Math Components into high-precision vector PublicationScene
// for crisp, vector-first PDF export and commercial print production
// ============================================================================

import { PageElement } from "../../domain/element/types";
import { PublicationScene, SceneNode } from "../educational/publicationScene";
import { getMathTemplate } from "./mathRegistry";
import { formatIndianNumber, parseMathNumber } from "./mathAlgorithms";

export function mathSceneForElement(el: PageElement): PublicationScene {
  const w = el.transform.width;
  const h = el.transform.height;
  const templateId = el.content?.mathTemplateId || el.presetId || "math-place-value-indian";
  const template = getMathTemplate(templateId);

  const mathData = el.content?.mathData || el.content || {};
  const mode = el.content?.mathMode || "teacher";

  const nodes: SceneNode[] = [];

  // 1. Base Container Card (vector rounded rect)
  nodes.push({
    kind: "rect",
    x: 0,
    y: 0,
    w,
    h,
    radius: 8,
    fill: "#FFFFFF",
    stroke: "#CBD5E1",
    strokeWidth: 1,
  });

  // 2. Header Title Band
  const title = template?.name || el.displayName || "Math Component";
  nodes.push({
    kind: "text",
    text: title.toUpperCase(),
    x: 12,
    y: 16,
    size: 7.5,
    fill: "#4F46E5",
    fontFamily: "Noto Sans",
    bold: true,
  });

  // 3. Category Badge
  if (template?.category) {
    nodes.push({
      kind: "text",
      text: template.category.toUpperCase(),
      x: w - 12,
      y: 16,
      size: 6.5,
      fill: "#64748B",
      fontFamily: "Noto Sans",
      bold: true,
      align: "end",
    });
  }

  // Divider line under header
  nodes.push({
    kind: "line",
    x: 10,
    y: 22,
    x2: w - 10,
    y2: 22,
    stroke: "#E2E8F0",
    strokeWidth: 0.8,
  });

  // 4. Template-Specific High-Fidelity Vector Nodes
  if (templateId.includes("place-value") || templateId.includes("table")) {
    const num = mathData.number ?? 872904;
    const numStr = String(num);
    const cellW = (w - 24) / Math.max(1, numStr.length);
    const gridY = 32;
    const gridH = h - 42;

    numStr.split("").forEach((d, idx) => {
      const cellX = 12 + idx * cellW;
      nodes.push({
        kind: "rect",
        x: cellX,
        y: gridY,
        w: cellW,
        h: gridH,
        fill: idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
        stroke: "#CBD5E1",
        strokeWidth: 0.8,
      });
      nodes.push({
        kind: "text",
        text: mode === "student" && idx % 2 === 1 ? "?" : d,
        x: cellX + cellW / 2,
        y: gridY + gridH / 2 + 5,
        size: 14,
        fill: "#1E293B",
        fontFamily: "Noto Sans",
        bold: true,
        align: "middle",
      });
    });
  } else if (templateId.includes("abacus")) {
    const num = mathData.number ?? 98765;
    const numStr = String(num);
    const rodsCount = numStr.length;
    const rodSpacing = (w - 40) / Math.max(1, rodsCount);

    // Beam top and bottom
    nodes.push({
      kind: "rect",
      x: 16,
      y: 30,
      w: w - 32,
      h: 6,
      radius: 2,
      fill: "#334155",
    });
    nodes.push({
      kind: "rect",
      x: 14,
      y: h - 18,
      w: w - 28,
      h: 8,
      radius: 3,
      fill: "#1E293B",
    });

    numStr.split("").forEach((d, idx) => {
      const rodX = 20 + idx * rodSpacing + rodSpacing / 2;
      const beadCount = parseInt(d, 10) || 0;

      // Vertical wire
      nodes.push({
        kind: "line",
        x: rodX,
        y: 34,
        x2: rodX,
        y2: h - 18,
        stroke: "#94A3B8",
        strokeWidth: 1.5,
      });

      // Beads stacked from bottom
      const visibleBeads = mode === "student" ? 0 : beadCount;
      for (let b = 0; b < visibleBeads; b++) {
        const beadY = h - 26 - b * 8;
        nodes.push({
          kind: "rect",
          x: rodX - 8,
          y: beadY,
          w: 16,
          h: 6,
          radius: 3,
          fill: "#4F46E5",
          stroke: "#312E81",
          strokeWidth: 0.5,
        });
      }
    });
  } else if (templateId.includes("number-line")) {
    const lineY = h / 2 + 8;
    nodes.push({
      kind: "line",
      x: 20,
      y: lineY,
      x2: w - 20,
      y2: lineY,
      stroke: "#4338CA",
      strokeWidth: 2,
    });
    const ticks = 10;
    const tickSpacing = (w - 60) / ticks;
    for (let t = 0; t <= ticks; t++) {
      const tx = 30 + t * tickSpacing;
      nodes.push({
        kind: "line",
        x: tx,
        y: lineY - 4,
        x2: tx,
        y2: lineY + 4,
        stroke: "#64748B",
        strokeWidth: 1.2,
      });
      nodes.push({
        kind: "text",
        text: String(t),
        x: tx,
        y: lineY + 14,
        size: 7.5,
        fill: "#334155",
        fontFamily: "Noto Sans",
        bold: true,
        align: "middle",
      });
    }
  } else if (templateId.includes("clock")) {
    const cx = w / 2;
    const cy = h / 2 + 6;
    const r = Math.min(38, (h - 40) / 2);

    nodes.push({
      kind: "ellipse",
      x: cx,
      y: cy,
      rx: r,
      ry: r,
      fill: "#F8FAFC",
      stroke: "#334155",
      strokeWidth: 1.8,
    });
    // Center point
    nodes.push({
      kind: "ellipse",
      x: cx,
      y: cy,
      rx: 2.5,
      ry: 2.5,
      fill: "#0F172A",
    });
    // Hour hand
    nodes.push({
      kind: "line",
      x: cx,
      y: cy,
      x2: cx + r * 0.4,
      y2: cy,
      stroke: "#1E293B",
      strokeWidth: 2.5,
    });
    // Minute hand
    nodes.push({
      kind: "line",
      x: cx,
      y: cy,
      x2: cx,
      y2: cy - r * 0.75,
      stroke: "#3B82F6",
      strokeWidth: 1.8,
    });
  } else if (templateId.includes("fraction-bar")) {
    const num = mathData.numerator ?? 3;
    const denom = mathData.denominator ?? 5;
    const barY = h / 2 - 8;
    const barH = 20;
    const barW = w - 32;
    const segW = barW / denom;

    nodes.push({
      kind: "rect",
      x: 16,
      y: barY,
      w: barW,
      h: barH,
      radius: 4,
      fill: "#F1F5F9",
      stroke: "#7C3AED",
      strokeWidth: 1.5,
    });

    for (let s = 0; s < denom; s++) {
      const segX = 16 + s * segW;
      const isShaded = s < num;
      if (isShaded) {
        nodes.push({
          kind: "rect",
          x: segX,
          y: barY,
          w: segW,
          h: barH,
          fill: "#7C3AED",
        });
      }
      nodes.push({
        kind: "line",
        x: segX + segW,
        y: barY,
        x2: segX + segW,
        y2: barY + barH,
        stroke: "#A78BFA",
        strokeWidth: 1,
      });
      nodes.push({
        kind: "text",
        text: `1/${denom}`,
        x: segX + segW / 2,
        y: barY + barH / 2 + 3.5,
        size: 7,
        fill: isShaded ? "#FFFFFF" : "#64748B",
        fontFamily: "Noto Sans",
        bold: true,
        align: "middle",
      });
    }
  } else if (templateId.includes("column-addition") || templateId.includes("column-subtraction")) {
    const num1 = mathData.num1 ?? 3482;
    const num2 = mathData.num2 ?? 1759;
    const isSub = templateId.includes("subtraction");
    const op = isSub ? "-" : "+";
    const res = isSub ? num1 - num2 : num1 + num2;

    const midX = w / 2;
    nodes.push({
      kind: "text",
      text: formatIndianNumber(num1),
      x: midX + 30,
      y: 45,
      size: 11,
      fill: "#1E293B",
      fontFamily: "Noto Sans",
      bold: true,
      align: "end",
    });
    nodes.push({
      kind: "text",
      text: `${op} ${formatIndianNumber(num2)}`,
      x: midX + 30,
      y: 62,
      size: 11,
      fill: "#1E293B",
      fontFamily: "Noto Sans",
      bold: true,
      align: "end",
    });
    nodes.push({
      kind: "line",
      x: midX - 35,
      y: 68,
      x2: midX + 35,
      y2: 68,
      stroke: "#334155",
      strokeWidth: 1.5,
    });
    nodes.push({
      kind: "text",
      text: mode === "student" ? "____" : formatIndianNumber(res),
      x: midX + 30,
      y: 84,
      size: 11,
      fill: "#4F46E5",
      fontFamily: "Noto Sans",
      bold: true,
      align: "end",
    });
    nodes.push({
      kind: "line",
      x: midX - 35,
      y: 89,
      x2: midX + 35,
      y2: 89,
      stroke: "#334155",
      strokeWidth: 1.5,
    });
  } else {
    // Universal crisp representation for all other math components
    const mainNum = mathData.number ?? mathData.num1 ?? mathData.amount ?? mathData.whole;
    if (mainNum !== undefined) {
      nodes.push({
        kind: "text",
        text: `Value: ${formatIndianNumber(mainNum)}`,
        x: w / 2,
        y: h / 2 + 2,
        size: 12,
        fill: "#1E293B",
        fontFamily: "Noto Sans",
        bold: true,
        align: "middle",
      });
    } else {
      nodes.push({
        kind: "text",
        text: `${title}`,
        x: w / 2,
        y: h / 2 + 2,
        size: 10,
        fill: "#475569",
        fontFamily: "Noto Sans",
        bold: true,
        align: "middle",
      });
    }
  }

  return {
    width: w,
    height: h,
    variant: "math-component",
    warnings: [],
    nodes,
  };
}
