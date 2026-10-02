import {
  VectorShapeType,
  ShapeCornersConfig,
  ShapeCornerStyle,
  ShapeParametricConfig,
} from "../../domain/element/types";
import { CurveNode } from "../../domain/creative/types";

export interface ResolvedCornerRadii {
  tl: number;
  tr: number;
  br: number;
  bl: number;
  style: ShapeCornerStyle;
}

/**
 * Resolves independent or linked corner radii and corner style
 */
export function getShapeCornerRadii(
  width: number,
  height: number,
  corners?: ShapeCornersConfig,
  legacyRadius?: number
): ResolvedCornerRadii {
  const maxR = Math.max(0, Math.min(width, height) / 2);
  const style = corners?.style || "rounded";

  if (corners && !corners.linked) {
    const legacyCorners = corners as ShapeCornersConfig & Partial<Record<"tl" | "tr" | "br" | "bl", number>>;
    const rawTl = corners.topLeft ?? legacyCorners.tl;
    const rawTr = corners.topRight ?? legacyCorners.tr;
    const rawBr = corners.bottomRight ?? legacyCorners.br;
    const rawBl = corners.bottomLeft ?? legacyCorners.bl;
    const tl = Math.min(maxR, Math.max(0, rawTl ?? corners.radius ?? legacyRadius ?? 0));
    const tr = Math.min(maxR, Math.max(0, rawTr ?? corners.radius ?? legacyRadius ?? 0));
    const br = Math.min(maxR, Math.max(0, rawBr ?? corners.radius ?? legacyRadius ?? 0));
    const bl = Math.min(maxR, Math.max(0, rawBl ?? corners.radius ?? legacyRadius ?? 0));
    return { tl, tr, br, bl, style };
  }

  const r = Math.min(maxR, Math.max(0, corners?.radius ?? legacyRadius ?? 0));
  return { tl: r, tr: r, br: r, bl: r, style };
}

/**
 * Helper to generate a rectangle path with independent corner radii and corner styles
 */
export function generateRectPathWithCorners(
  w: number,
  h: number,
  radii: ResolvedCornerRadii
): string {
  const { tl, tr, br, bl, style } = radii;

  if (tl <= 0 && tr <= 0 && br <= 0 && bl <= 0) {
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  const k = 0.5522847498; // cubic bezier kappa for 90deg arc

  let path = `M ${tl} 0`;

  // Top edge to top-right
  path += ` L ${w - tr} 0`;
  if (tr > 0) {
    if (style === "chamfer" || style === "cut") {
      path += ` L ${w} ${tr}`;
    } else if (style === "concave") {
      path += ` C ${w - tr * (1 - k)} 0, ${w} ${tr * (1 - k)}, ${w - tr} ${tr} C ${w - tr * (1 - k)} ${tr}, ${w} ${tr * (1 + k)}, ${w} ${tr}`;
      // cleaner concave scoop:
      // arc sweeping inward
      path = path.slice(0, path.lastIndexOf(" L ")) + ` L ${w - tr} 0 A ${tr} ${tr} 0 0 0 ${w} ${tr}`;
    } else {
      // rounded or soft
      path += ` C ${w - tr + tr * k} 0, ${w} ${tr - tr * k}, ${w} ${tr}`;
    }
  }

  // Right edge to bottom-right
  path += ` L ${w} ${h - br}`;
  if (br > 0) {
    if (style === "chamfer" || style === "cut") {
      path += ` L ${w - br} ${h}`;
    } else if (style === "concave") {
      path += ` A ${br} ${br} 0 0 0 ${w - br} ${h}`;
    } else {
      path += ` C ${w} ${h - br + br * k}, ${w - br + br * k} ${h}, ${w - br} ${h}`;
    }
  }

  // Bottom edge to bottom-left
  path += ` L ${bl} ${h}`;
  if (bl > 0) {
    if (style === "chamfer" || style === "cut") {
      path += ` L 0 ${h - bl}`;
    } else if (style === "concave") {
      path += ` A ${bl} ${bl} 0 0 0 0 ${h - bl}`;
    } else {
      path += ` C ${bl - bl * k} ${h}, 0 ${h - bl + bl * k}, 0 ${h - bl}`;
    }
  }

  // Left edge to top-left
  path += ` L 0 ${tl}`;
  if (tl > 0) {
    if (style === "chamfer" || style === "cut") {
      path += ` L ${tl} 0`;
    } else if (style === "concave") {
      path += ` A ${tl} ${tl} 0 0 0 ${tl} 0`;
    } else {
      path += ` C 0 ${tl - tl * k}, ${tl - tl * k} 0, ${tl} 0`;
    }
  }

  path += " Z";
  return path;
}

/**
 * Generate regular polygon path
 */
function generateRegularPolygon(w: number, h: number, sides: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const points: [number, number][] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }

  return `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} ` +
    points.slice(1).map(p => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + " Z";
}

/**
 * Generate n-pointed star path
 */
function generateStarPath(w: number, h: number, points: number, innerRatio: number = 0.45): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const irx = rx * innerRatio;
  const iry = ry * innerRatio;
  const pts: [number, number][] = [];

  for (let i = 0; i < points * 2; i++) {
    const isOuter = i % 2 === 0;
    const currentRx = isOuter ? rx : irx;
    const currentRy = isOuter ? ry : iry;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    pts.push([cx + currentRx * Math.cos(angle), cy + currentRy * Math.sin(angle)]);
  }

  return `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} ` +
    pts.slice(1).map(p => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + " Z";
}

/**
 * Generate parametric arrow path
 */
function generateArrowPath(
  type: VectorShapeType,
  w: number,
  h: number,
  params?: ShapeParametricConfig
): string {
  const headSize = Math.min(w * 0.45, Math.max(12, params?.headSize ?? 24));
  const tailH = Math.min(h * 0.7, Math.max(6, params?.tailWidth ?? h * 0.35));
  const tailTop = (h - tailH) / 2;
  const tailBottom = tailTop + tailH;

  switch (type) {
    case "arrow-left":
      return `M ${headSize} 0 L 0 ${h / 2} L ${headSize} ${h} L ${headSize} ${tailBottom} L ${w} ${tailBottom} L ${w} ${tailTop} L ${headSize} ${tailTop} Z`;

    case "arrow-up": {
      const vHeadSize = Math.min(h * 0.45, Math.max(12, params?.headSize ?? 24));
      const vTailW = Math.min(w * 0.7, Math.max(6, params?.tailWidth ?? w * 0.35));
      const vTailLeft = (w - vTailW) / 2;
      const vTailRight = vTailLeft + vTailW;
      return `M ${w / 2} 0 L ${w} ${vHeadSize} L ${vTailRight} ${vHeadSize} L ${vTailRight} ${h} L ${vTailLeft} ${h} L ${vTailLeft} ${vHeadSize} L 0 ${vHeadSize} Z`;
    }

    case "arrow-down": {
      const vHeadSize = Math.min(h * 0.45, Math.max(12, params?.headSize ?? 24));
      const vTailW = Math.min(w * 0.7, Math.max(6, params?.tailWidth ?? w * 0.35));
      const vTailLeft = (w - vTailW) / 2;
      const vTailRight = vTailLeft + vTailW;
      return `M ${vTailLeft} 0 L ${vTailRight} 0 L ${vTailRight} ${h - vHeadSize} L ${w} ${h - vHeadSize} L ${w / 2} ${h} L 0 ${h - vHeadSize} L ${vTailLeft} ${h - vHeadSize} Z`;
    }

    case "arrow-double":
    case "arrow-bidirectional": {
      const headL = Math.min(w * 0.3, headSize);
      return `M ${headL} 0 L 0 ${h / 2} L ${headL} ${h} L ${headL} ${tailBottom} L ${w - headL} ${tailBottom} L ${w - headL} ${h} L ${w} ${h / 2} L ${w - headL} 0 L ${w - headL} ${tailTop} L ${headL} ${tailTop} Z`;
    }

    case "arrow-chevron": {
      const chevIndent = w * 0.25;
      return `M 0 0 L ${w - chevIndent} 0 L ${w} ${h / 2} L ${w - chevIndent} ${h} L 0 ${h} L ${chevIndent} ${h / 2} Z`;
    }

    case "arrow-bent": {
      const cornerR = Math.min(w * 0.3, h * 0.3);
      return `M 0 ${h} L 0 ${tailH + cornerR} Q 0 ${tailH} ${cornerR} ${tailH} L ${w - headSize} ${tailH} L ${w - headSize} 0 L ${w} ${tailH + tailH / 2} L ${w - headSize} ${tailH * 3} L ${w - headSize} ${tailH * 2} L ${cornerR} ${tailH * 2} Q ${tailH} ${tailH * 2} ${tailH} ${tailH * 2 + cornerR} L ${tailH} ${h} Z`;
    }

    case "arrow-curved": {
      return `M 0 ${h * 0.8} C ${w * 0.2} ${h * 0.2}, ${w * 0.6} ${h * 0.1}, ${w - headSize} ${h * 0.3} L ${w - headSize} 0 L ${w} ${h * 0.45} L ${w - headSize * 0.8} ${h * 0.8} L ${w - headSize * 0.7} ${h * 0.5} C ${w * 0.55} ${h * 0.35}, ${w * 0.25} ${h * 0.45}, 0 ${h} Z`;
    }

    case "arrow-circular":
    case "arrow-loop": {
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) / 2;
      return `M ${cx} 0 A ${r} ${r} 0 1 1 ${cx - r * 0.8} ${cy + r * 0.5} L ${cx - r * 0.9} ${cy + r * 0.2} L ${cx - r} ${cy + r * 0.9} L ${cx - r * 0.4} ${cy + r * 0.8} L ${cx - r * 0.55} ${cy + r * 0.65} A ${r * 0.75} ${r * 0.75} 0 1 0 ${cx} ${r * 0.25} Z`;
    }

    case "arrow-uturn": {
      return `M ${w * 0.25} ${h} L ${w * 0.25} ${h * 0.4} A ${w * 0.25} ${w * 0.25} 0 0 1 ${w * 0.75} ${h * 0.4} L ${w * 0.75} ${h - headSize} L ${w * 0.9} ${h - headSize} L ${w * 0.7} ${h} L ${w * 0.5} ${h - headSize} L ${w * 0.65} ${h - headSize} L ${w * 0.65} ${h * 0.4} A ${w * 0.15} ${w * 0.15} 0 0 0 ${w * 0.35} ${h * 0.4} L ${w * 0.35} ${h} Z`;
    }

    case "arrow-block":
    case "arrow-flow":
    case "arrow":
    case "arrow-right":
    default:
      return `M 0 ${tailTop} L ${w - headSize} ${tailTop} L ${w - headSize} 0 L ${w} ${h / 2} L ${w - headSize} ${h} L ${w - headSize} ${tailBottom} L 0 ${tailBottom} Z`;
  }
}

/**
 * Generate callout speech / thought bubble path with movable pointer
 */
function generateCalloutPath(
  type: VectorShapeType,
  w: number,
  h: number,
  radii: ResolvedCornerRadii,
  params?: ShapeParametricConfig
): string {
  const bodyH = Math.max(20, h * 0.8);
  const pointerH = h - bodyH;
  const ptrX = Math.min(w - 20, Math.max(20, params?.pointerX ?? w * 0.3));
  const ptrW = Math.min(w * 0.4, Math.max(12, params?.pointerWidth ?? 20));
  const ptrBaseL = Math.max(10, ptrX - ptrW / 2);
  const ptrBaseR = Math.min(w - 10, ptrX + ptrW / 2);
  const ptrTipX = Math.min(w, Math.max(0, params?.pointerX ?? w * 0.2));
  const ptrTipY = params?.pointerY ?? h;

  if (type === "callout-thought" || type === "callout-cloud") {
    // Cloud-style scallop callout
    const bw = w;
    const bh = bodyH;
    return `M ${bw * 0.2} ${bh} C ${bw * 0.05} ${bh}, 0 ${bh * 0.8}, 0 ${bh * 0.6} C 0 ${bh * 0.35}, ${bw * 0.15} ${bh * 0.1}, ${bw * 0.3} ${bh * 0.15} C ${bw * 0.38} 0, ${bw * 0.62} 0, ${bw * 0.7} ${bh * 0.15} C ${bw * 0.85} ${bh * 0.1}, ${bw} ${bh * 0.35}, ${bw} ${bh * 0.6} C ${bw} ${bh * 0.8}, ${bw * 0.9} ${bh}, ${bw * 0.75} ${bh} C ${bw * 0.65} ${bh * 1.05}, ${bw * 0.35} ${bh * 1.05}, ${bw * 0.2} ${bh} Z M ${bw * 0.25} ${bh + pointerH * 0.3} A ${pointerH * 0.25} ${pointerH * 0.25} 0 1 1 ${bw * 0.25 + 0.1} ${bh + pointerH * 0.3} Z M ${bw * 0.15} ${bh + pointerH * 0.7} A ${pointerH * 0.18} ${pointerH * 0.18} 0 1 1 ${bw * 0.15 + 0.1} ${bh + pointerH * 0.7} Z`;
  }

  // Rounded speech bubble
  const r = Math.min(radii.tl || 12, bodyH / 2, w / 4);
  const k = 0.5522847498 * r;

  return `M ${r} 0 L ${w - r} 0 C ${w - r + k} 0, ${w} ${r - k}, ${w} ${r} L ${w} ${bodyH - r} C ${w} ${bodyH - r + k}, ${w - r + k} ${bodyH}, ${w - r} ${bodyH} L ${ptrBaseR} ${bodyH} L ${ptrTipX} ${ptrTipY} L ${ptrBaseL} ${bodyH} L ${r} ${bodyH} C ${r - k} ${bodyH}, 0 ${bodyH - r + k}, 0 ${bodyH - r} L 0 ${r} C 0 ${r - k}, ${r - k} 0, ${r} 0 Z`;
}

/**
 * Generate Badge, Ribbon, Banner, Shield paths
 */
function generateBadgePath(type: VectorShapeType, w: number, h: number): string {
  switch (type) {
    case "badge-shield": {
      const topCorner = w * 0.1;
      return `M 0 0 L ${w} 0 L ${w} ${h * 0.6} C ${w} ${h * 0.85}, ${w / 2} ${h}, ${w / 2} ${h} C ${w / 2} ${h}, 0 ${h * 0.85}, 0 ${h * 0.6} Z`;
    }

    case "badge-seal":
    case "badge-burst": {
      return generateStarPath(w, h, 16, 0.85);
    }

    case "badge-starburst": {
      return generateStarPath(w, h, 12, 0.7);
    }

    case "badge-ribbon":
    case "banner": {
      const ribbonIndent = w * 0.12;
      return `M 0 0 L ${w} 0 L ${w - ribbonIndent} ${h / 2} L ${w} ${h} L 0 ${h} L ${ribbonIndent} ${h / 2} Z`;
    }

    case "badge-award": {
      const medalR = Math.min(w * 0.75, h * 0.65) / 2;
      const cx = w / 2;
      const cy = medalR;
      const tailY = h;
      return `M ${cx} 0 A ${medalR} ${medalR} 0 1 1 ${cx} ${medalR * 2} A ${medalR} ${medalR} 0 1 1 ${cx} 0 Z M ${cx - medalR * 0.5} ${medalR * 1.6} L ${cx - medalR * 0.8} ${tailY} L ${cx - medalR * 0.4} ${tailY - medalR * 0.3} L ${cx} ${tailY} L ${cx - medalR * 0.1} ${medalR * 1.8} Z M ${cx + medalR * 0.1} ${medalR * 1.8} L ${cx} ${tailY} L ${cx + medalR * 0.4} ${tailY - medalR * 0.3} L ${cx + medalR * 0.8} ${tailY} L ${cx + medalR * 0.5} ${medalR * 1.6} Z`;
    }

    case "badge-ticket": {
      const notchR = Math.min(w, h) * 0.15;
      return `M 0 0 L ${w} 0 L ${w} ${h / 2 - notchR} A ${notchR} ${notchR} 0 0 0 ${w} ${h / 2 + notchR} L ${w} ${h} L 0 ${h} L 0 ${h / 2 + notchR} A ${notchR} ${notchR} 0 0 0 0 ${h / 2 - notchR} Z`;
    }

    case "badge-tag": {
      const notch = Math.min(w * 0.25, h * 0.5);
      return `M ${notch} 0 L ${w} 0 L ${w} ${h} L ${notch} ${h} L 0 ${h / 2} Z`;
    }

    case "badge-bookmark": {
      const indent = h * 0.2;
      return `M 0 0 L ${w} 0 L ${w} ${h} L ${w / 2} ${h - indent} L 0 ${h} Z`;
    }

    case "badge-flag":
    case "badge-pennant": {
      return `M 0 0 L ${w} ${h / 2} L 0 ${h} Z`;
    }

    case "badge-folded-corner": {
      const fold = Math.min(w * 0.25, h * 0.25);
      return `M 0 0 L ${w - fold} 0 L ${w} ${fold} L ${w} ${h} L 0 ${h} Z`;
    }

    default:
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }
}

/**
 * Generate Organic Shapes (blobs, waves, pebble, leaf, drop)
 */
function generateOrganicPath(type: VectorShapeType, w: number, h: number): string {
  switch (type) {
    case "organic-blob":
    case "organic-blob-1": {
      // Smooth 6-node organic blob
      return `M ${w * 0.5} 0 C ${w * 0.85} 0, ${w} ${h * 0.25}, ${w} ${h * 0.55} C ${w} ${h * 0.85}, ${w * 0.75} ${h}, ${w * 0.45} ${h} C ${w * 0.15} ${h}, 0 ${h * 0.8}, 0 ${h * 0.45} C 0 ${h * 0.15}, ${w * 0.25} 0, ${w * 0.5} 0 Z`;
    }

    case "organic-blob-2": {
      return `M ${w * 0.6} ${h * 0.05} C ${w * 0.9} ${h * 0.15}, ${w * 0.95} ${h * 0.65}, ${w * 0.75} ${h * 0.9} C ${w * 0.55} ${h * 1.05}, ${w * 0.2} ${h * 0.85}, ${w * 0.08} ${h * 0.65} C ${w * -0.05} ${h * 0.45}, ${w * 0.15} ${h * 0.15}, ${w * 0.35} ${h * 0.05} C ${w * 0.45} 0, ${w * 0.52} 0.02, ${w * 0.6} ${h * 0.05} Z`;
    }

    case "organic-splash":
    case "organic-abstract": {
      return `M ${w * 0.5} ${h * 0.1} C ${w * 0.8} 0, ${w * 0.95} ${h * 0.3}, ${w * 0.85} ${h * 0.6} C ${w * 0.75} ${h * 0.9}, ${w * 0.9} ${h}, ${w * 0.6} ${h * 0.95} C ${w * 0.3} ${h * 0.9}, ${w * 0.1} ${h * 0.75}, ${w * 0.15} ${h * 0.5} C ${w * 0.2} ${h * 0.25}, ${w * 0.2} 0, ${w * 0.5} ${h * 0.1} Z`;
    }

    case "organic-brush": {
      return `M ${w * 0.05} ${h * 0.45} C ${w * 0.3} ${h * 0.35}, ${w * 0.7} ${h * 0.2}, ${w * 0.95} ${h * 0.4} C ${w} ${h * 0.55}, ${w * 0.8} ${h * 0.65}, ${w * 0.5} ${h * 0.6} C ${w * 0.2} ${h * 0.55}, 0 ${h * 0.65}, ${w * 0.05} ${h * 0.45} Z`;
    }

    case "organic-fluid-bg":
    case "organic-wavy-container": {
      return `M 0 0 L ${w} 0 L ${w} ${h * 0.75} C ${w * 0.75} ${h * 0.9}, ${w * 0.5} ${h * 0.6}, ${w * 0.25} ${h * 0.85} C ${w * 0.1} ${h * 0.95}, 0 ${h * 0.8}, 0 ${h * 0.75} Z`;
    }

    case "organic-wave": {
      return `M 0 ${h * 0.5} Q ${w * 0.25} ${h * 0.1} ${w * 0.5} ${h * 0.5} T ${w} ${h * 0.5} L ${w} ${h} L 0 ${h} Z`;
    }

    case "organic-pebble": {
      return `M ${w * 0.5} ${h * 0.08} C ${w * 0.88} ${h * 0.05}, ${w} ${h * 0.4}, ${w * 0.92} ${h * 0.8} C ${w * 0.82} ${h * 0.98}, ${w * 0.35} ${h * 0.95}, ${w * 0.12} ${h * 0.78} C ${w * 0.02} ${h * 0.55}, ${w * 0.08} ${h * 0.2}, ${w * 0.5} ${h * 0.08} Z`;
    }

    case "organic-leaf": {
      return `M 0 ${h} Q ${w * 0.1} ${h * 0.2} ${w} 0 Q ${w * 0.8} ${h * 0.9} 0 ${h} Z`;
    }

    case "organic-drop": {
      return `M ${w * 0.5} 0 C ${w * 0.5} 0, ${w} ${h * 0.6}, ${w} ${h * 0.75} A ${w * 0.5} ${h * 0.25} 0 0 1 0 ${h * 0.75} C 0 ${h * 0.6}, ${w * 0.5} 0, ${w * 0.5} 0 Z`;
    }

    case "organic-cloud": {
      return `M ${w * 0.2} ${h * 0.8} C ${w * 0.05} ${h * 0.8}, 0 ${h * 0.65}, 0 ${h * 0.5} C 0 ${h * 0.3}, ${w * 0.15} ${h * 0.15}, ${w * 0.35} ${h * 0.2} C ${w * 0.42} ${h * 0.05}, ${w * 0.65} ${h * 0.05}, ${w * 0.72} ${h * 0.2} C ${w * 0.88} ${h * 0.15}, ${w} ${h * 0.3}, ${w} ${h * 0.5} C ${w} ${h * 0.65}, ${w * 0.92} ${h * 0.8}, ${w * 0.8} ${h * 0.8} Z`;
    }

    case "organic-torn-paper": {
      const step = w / 8;
      let path = `M 0 0 L ${w} 0 L ${w} ${h}`;
      for (let i = 8; i > 0; i--) {
        const x = (i - 0.5) * step;
        const jagged = i % 2 === 0 ? h - 6 : h - 14;
        path += ` L ${x} ${jagged} L ${(i - 1) * step} ${h}`;
      }
      path += " Z";
      return path;
    }

    case "organic-curved-panel": {
      return `M 0 0 L ${w} 0 L ${w} ${h * 0.85} Q ${w / 2} ${h} 0 ${h * 0.85} Z`;
    }

    default:
      return generateRegularPolygon(w, h, 6);
  }
}

/**
 * Generate Flowchart Shapes
 */
function generateFlowchartPath(type: VectorShapeType, w: number, h: number): string {
  switch (type) {
    case "flow-decision": {
      // Diamond
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
    }

    case "flow-start-end": {
      // Capsule / Stadium
      const r = Math.min(w / 2, h / 2);
      return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }

    case "flow-input-output": {
      // Parallelogram with 15% skew
      const skew = w * 0.18;
      return `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`;
    }

    case "flow-document": {
      // Document with curved wave bottom
      return `M 0 0 L ${w} 0 L ${w} ${h * 0.85} Q ${w * 0.75} ${h * 0.7}, ${w * 0.5} ${h * 0.85} T 0 ${h * 0.85} Z`;
    }

    case "flow-database": {
      // Cylinder
      const rx = w / 2;
      const ry = Math.min(16, h * 0.2);
      return `M 0 ${ry} A ${rx} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${rx} ${ry} 0 0 1 0 ${h - ry} Z M 0 ${ry} A ${rx} ${ry} 0 0 0 ${w} ${ry}`;
    }

    case "flow-manual-operation": {
      // Inverted trapezoid
      const indent = w * 0.15;
      return `M 0 0 L ${w} 0 L ${w - indent} ${h} L ${indent} ${h} Z`;
    }

    case "flow-delay": {
      // Semi-rounded rectangle
      const r = h / 2;
      return `M 0 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w - r} ${h} L 0 ${h} Z`;
    }

    case "flow-preparation": {
      // Hexagon horizontally stretched
      const notch = w * 0.15;
      return `M ${notch} 0 L ${w - notch} 0 L ${w} ${h / 2} L ${w - notch} ${h} L ${notch} ${h} L 0 ${h / 2} Z`;
    }

    case "flow-connector": {
      // Circle
      const rx = w / 2;
      const ry = h / 2;
      return `M ${rx} 0 A ${rx} ${ry} 0 1 1 ${rx - 0.01} 0 Z`;
    }

    case "flow-stored-data": {
      const rx = w * 0.15;
      return `M ${rx} 0 L ${w} 0 A ${rx} ${h / 2} 0 0 0 ${w} ${h} L ${rx} ${h} A ${rx} ${h / 2} 0 0 1 ${rx} 0 Z`;
    }

    case "flow-process":
    default:
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }
}

/**
 * Generate Mathematics & Educational Shapes
 */
function generateMathPath(type: VectorShapeType, w: number, h: number, params?: ShapeParametricConfig): string {
  switch (type) {
    case "math-bracket": {
      const curl = Math.min(10, w * 0.4);
      return `M ${w} 0 L ${curl} 0 L ${curl} ${h} L ${w} ${h}`;
    }

    case "math-brace": {
      const curl = Math.min(12, w * 0.5);
      const mid = h / 2;
      return `M ${w} 0 Q ${curl} 0 ${curl} ${mid / 2} Q ${curl} ${mid} 0 ${mid} Q ${curl} ${mid} ${curl} ${mid * 1.5} Q ${curl} ${h} ${w} ${h}`;
    }

    case "math-angle": {
      return `M ${w} 0 L 0 ${h} L ${w} ${h} M ${w * 0.3} ${h} A ${w * 0.3} ${w * 0.3} 0 0 0 ${w * 0.22} ${h * 0.78}`;
    }

    case "math-triangle-diagram": {
      return `M 0 ${h} L ${w} ${h} L ${w * 0.4} 0 Z`;
    }

    case "math-coordinate-plane": {
      const cx = w / 2;
      const cy = h / 2;
      return `M 0 ${cy} L ${w} ${cy} M ${cx} 0 L ${cx} ${h}`;
    }

    case "math-number-line": {
      const midY = h / 2;
      let path = `M 0 ${midY} L ${w} ${midY}`;
      const divisions = params?.divisions ?? 5;
      const step = w / divisions;
      for (let i = 0; i <= divisions; i++) {
        path += ` M ${i * step} ${midY - 6} L ${i * step} ${midY + 6}`;
      }
      return path;
    }

    case "math-fraction-bar": {
      const midY = h / 2;
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M 0 ${midY} L ${w} ${midY}`;
    }

    case "math-fraction-circle": {
      const rx = w / 2;
      const ry = h / 2;
      const fillRatio = params?.fillRatio ?? 0.75;
      const angle = fillRatio * 2 * Math.PI - Math.PI / 2;
      const largeArc = fillRatio > 0.5 ? 1 : 0;
      const endX = rx + rx * Math.cos(angle);
      const endY = ry + ry * Math.sin(angle);
      return `M ${rx} ${ry} L ${rx} 0 A ${rx} ${ry} 0 ${largeArc} 1 ${endX.toFixed(2)} ${endY.toFixed(2)} Z`;
    }

    case "math-measurement-arrow":
    case "math-dimension-line": {
      const midY = h / 2;
      return `M 0 0 L 0 ${h} M 0 ${midY} L ${w} ${midY} M ${w} 0 L ${w} ${h}`;
    }

    default:
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }
}

/**
 * Universal SVG Path Generator for the Unified Shape Engine
 */
export function generateShapeSvgPath(
  shapeType: VectorShapeType,
  width: number,
  height: number,
  params?: ShapeParametricConfig,
  corners?: ShapeCornersConfig,
  legacyRadius?: number
): string {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const radii = getShapeCornerRadii(w, h, corners, legacyRadius);

  // 1. Basic Rectangles & Squares
  if (shapeType === "rectangle" || shapeType === "rounded-rectangle" || shapeType === "square") {
    return generateRectPathWithCorners(w, h, radii);
  }

  // 2. Circles & Ellipses
  if (shapeType === "circle" || shapeType === "oval" || shapeType === "ellipse") {
    const rx = w / 2;
    const ry = h / 2;
    // Standard full ellipse path with 2 semi-ellipses for perfect SVG / PDF compatibility
    return `M ${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} ${h} A ${rx} ${ry} 0 1 1 ${rx} 0 Z`;
  }

  if (shapeType === "semi-circle") {
    const rx = w / 2;
    return `M 0 ${h} A ${rx} ${h} 0 0 1 ${w} ${h} Z`;
  }

  if (shapeType === "quarter-circle") {
    return `M 0 0 L ${w} 0 A ${w} ${h} 0 0 1 0 ${h} Z`;
  }

  if (shapeType === "capsule" || shapeType === "pill") {
    const r = Math.min(w, h) / 2;
    return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  }

  if (shapeType === "ring") {
    const outerRx = w / 2;
    const outerRy = h / 2;
    const innerRx = outerRx * 0.6;
    const innerRy = outerRy * 0.6;
    return `M ${outerRx} 0 A ${outerRx} ${outerRy} 0 1 1 ${outerRx} ${h} A ${outerRx} ${outerRy} 0 1 1 ${outerRx} 0 Z M ${outerRx} ${outerRy - innerRy} A ${innerRx} ${innerRy} 0 1 0 ${outerRx} ${outerRy + innerRy} A ${innerRx} ${innerRy} 0 1 0 ${outerRx} ${outerRy - innerRy} Z`;
  }

  if (shapeType === "arc") {
    const rx = w / 2;
    const ry = h;
    return `M 0 ${h} A ${rx} ${ry} 0 0 1 ${w} ${h}`;
  }

  // 3. Triangles & Geometric Polygons
  if (shapeType === "triangle" || shapeType === "isosceles-triangle" || shapeType === "equilateral-triangle") {
    return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  if (shapeType === "right-triangle") {
    return `M 0 0 L ${w} ${h} L 0 ${h} Z`;
  }

  if (shapeType === "diamond" || shapeType === "rhombus") {
    return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
  }

  if (shapeType === "parallelogram") {
    const skew = w * 0.2;
    return `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`;
  }

  if (shapeType === "trapezoid") {
    const indent = w * 0.2;
    return `M ${indent} 0 L ${w - indent} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  if (shapeType === "pentagon") return generateRegularPolygon(w, h, 5);
  if (shapeType === "hexagon" || shapeType === "polygon") return generateRegularPolygon(w, h, params?.polygonSides ?? 6);
  if (shapeType === "heptagon") return generateRegularPolygon(w, h, 7);
  if (shapeType === "octagon") return generateRegularPolygon(w, h, 8);
  if (shapeType === "nonagon") return generateRegularPolygon(w, h, 9);
  if (shapeType === "decagon") return generateRegularPolygon(w, h, 10);

  // 4. Stars & Crosses
  if (shapeType === "star") return generateStarPath(w, h, params?.starPoints ?? 5, params?.innerRadiusRatio ?? 0.45);
  if (shapeType === "multi-star") return generateStarPath(w, h, params?.starPoints ?? 8, params?.innerRadiusRatio ?? 0.5);

  if (shapeType === "cross" || shapeType === "plus") {
    const tx = w * 0.35;
    const ty = h * 0.35;
    return `M ${tx} 0 L ${w - tx} 0 L ${w - tx} ${ty} L ${w} ${ty} L ${w} ${h - ty} L ${w - tx} ${h - ty} L ${w - tx} ${h} L ${tx} ${h} L ${tx} ${h - ty} L 0 ${h - ty} L 0 ${ty} L ${tx} ${ty} Z`;
  }

  if (shapeType === "minus") {
    const ty = h * 0.35;
    return `M 0 ${ty} L ${w} ${ty} L ${w} ${h - ty} L 0 ${h - ty} Z`;
  }

  // 5. Arrows
  if (shapeType.startsWith("arrow")) {
    return generateArrowPath(shapeType, w, h, params);
  }

  // 6. Callouts
  if (shapeType.startsWith("callout")) {
    return generateCalloutPath(shapeType, w, h, radii, params);
  }

  // 7. Badges & Labels
  if (shapeType.startsWith("badge") || shapeType === "banner") {
    return generateBadgePath(shapeType, w, h);
  }

  // 8. Organic Shapes
  if (shapeType.startsWith("organic")) {
    return generateOrganicPath(shapeType, w, h);
  }

  // 9. Educational Shapes
  if (shapeType.startsWith("edu-")) {
    if (shapeType === "edu-number-tile" || shapeType === "edu-flash-card" || shapeType === "edu-formula-box") {
      return generateRectPathWithCorners(w, h, { tl: 8, tr: 8, br: 8, bl: 8, style: "rounded" });
    }
    if (shapeType === "edu-counting-block") {
      // 3D-angled counting cube
      const iso = Math.min(w * 0.2, h * 0.2);
      return `M 0 ${iso} L ${w - iso} ${iso} L ${w} 0 L ${iso} 0 Z M 0 ${iso} L ${w - iso} ${iso} L ${w - iso} ${h} L 0 ${h} Z M ${w - iso} ${iso} L ${w} 0 L ${w} ${h - iso} L ${w - iso} ${h} Z`;
    }
    if (shapeType === "edu-venn-circle") {
      return generateShapeSvgPath("circle", w, h);
    }
    if (shapeType === "edu-step-marker" || shapeType === "edu-timeline-marker") {
      const r = Math.min(w, h) / 2;
      return `M ${r} 0 L ${w} 0 L ${w} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 ${r} 0 Z`;
    }
    return generateRectPathWithCorners(w, h, radii);
  }

  // 10. Flowchart Shapes
  if (shapeType.startsWith("flow-")) {
    return generateFlowchartPath(shapeType, w, h);
  }

  // 11. Mathematics Shapes
  if (shapeType.startsWith("math-")) {
    return generateMathPath(shapeType, w, h, params);
  }

  // 12. Lines
  if (shapeType.startsWith("line") || shapeType === "line") {
    if (shapeType === "line-curved" || shapeType === "line-bezier") {
      return `M 0 ${h} Q ${w / 2} 0 ${w} ${h}`;
    }
    if (shapeType === "line-elbow" || shapeType === "line-orthogonal") {
      return `M 0 ${h} L ${w / 2} ${h} L ${w / 2} 0 L ${w} 0`;
    }
    if (shapeType === "line-double") {
      const midY = h / 2;
      return `M 0 ${midY - 2} L ${w} ${midY - 2} M 0 ${midY + 2} L ${w} ${midY + 2}`;
    }
    // Standard straight line
    return `M 0 ${h / 2} L ${w} ${h / 2}`;
  }

  // Default fallback: rectangle with resolved corners
  return generateRectPathWithCorners(w, h, radii);
}

/**
 * Converts any parametric shape into editable Bézier nodes for the "Edit Points" pen/node tool.
 */
export function shapeToVectorCurveNodes(
  shapeType: VectorShapeType,
  width: number,
  height: number,
  params?: ShapeParametricConfig,
  corners?: ShapeCornersConfig,
  legacyRadius?: number
): { nodes: CurveNode[]; closed: boolean } {
  const w = Math.max(10, width);
  const h = Math.max(10, height);

  // If it's a star
  if (shapeType === "star" || shapeType === "multi-star") {
    const points = params?.starPoints || (shapeType === "multi-star" ? 8 : 5);
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * (params?.innerRadiusRatio || (shapeType === "multi-star" ? 0.5 : 0.45));
    const nodes: CurveNode[] = [];

    for (let i = 0; i < points * 2; i++) {
      const isOuter = i % 2 === 0;
      const r = isOuter ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      nodes.push({
        id: `node-${i}`,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        type: "sharp",
      });
    }
    return { nodes, closed: true };
  }

  // If it's a polygon
  if (
    shapeType === "polygon" ||
    shapeType === "pentagon" ||
    shapeType === "hexagon" ||
    shapeType === "octagon"
  ) {
    const sides =
      shapeType === "pentagon"
        ? 5
        : shapeType === "octagon"
        ? 8
        : params?.polygonSides || 6;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const nodes: CurveNode[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      nodes.push({
        id: `node-${i}`,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        type: "sharp",
      });
    }
    return { nodes, closed: true };
  }

  // If it's a circle or ellipse
  if (shapeType === "circle" || shapeType === "ellipse" || shapeType === "oval") {
    const rx = w / 2;
    const ry = h / 2;
    const cx = rx;
    const cy = ry;
    const kx = 0.5522847498 * rx;
    const ky = 0.5522847498 * ry;

    return {
      nodes: [
        { id: "node-top", x: cx, y: 0, type: "smooth", handleIn: { x: -kx, y: 0 }, handleOut: { x: kx, y: 0 } },
        { id: "node-right", x: w, y: cy, type: "smooth", handleIn: { x: 0, y: -ky }, handleOut: { x: 0, y: ky } },
        { id: "node-bottom", x: cx, y: h, type: "smooth", handleIn: { x: kx, y: 0 }, handleOut: { x: -kx, y: 0 } },
        { id: "node-left", x: 0, y: cy, type: "smooth", handleIn: { x: 0, y: ky }, handleOut: { x: 0, y: -ky } },
      ],
      closed: true,
    };
  }

  // If it's a triangle
  if (shapeType === "triangle" || shapeType === "isosceles-triangle") {
    return {
      nodes: [
        { id: "node-0", x: w / 2, y: 0, type: "sharp" },
        { id: "node-1", x: w, y: h, type: "sharp" },
        { id: "node-2", x: 0, y: h, type: "sharp" },
      ],
      closed: true,
    };
  }

  // If it's a diamond
  if (shapeType === "diamond" || shapeType === "rhombus") {
    return {
      nodes: [
        { id: "node-0", x: w / 2, y: 0, type: "sharp" },
        { id: "node-1", x: w, y: h / 2, type: "sharp" },
        { id: "node-2", x: w / 2, y: h, type: "sharp" },
        { id: "node-3", x: 0, y: h / 2, type: "sharp" },
      ],
      closed: true,
    };
  }

  // Standard rectangle / fallback
  const radii = getShapeCornerRadii(w, h, corners, legacyRadius);
  const r = Math.min(radii.tl, w / 2, h / 2);
  if (r <= 0) {
    return {
      nodes: [
        { id: "node-0", x: 0, y: 0, type: "sharp" },
        { id: "node-1", x: w, y: 0, type: "sharp" },
        { id: "node-2", x: w, y: h, type: "sharp" },
        { id: "node-3", x: 0, y: h, type: "sharp" },
      ],
      closed: true,
    };
  }

  const k = 0.5522847498 * r;
  return {
    nodes: [
      { id: "node-0", x: r, y: 0, type: "smooth", handleIn: { x: -k, y: 0 } },
      { id: "node-1", x: w - r, y: 0, type: "smooth", handleOut: { x: k, y: 0 } },
      { id: "node-2", x: w, y: r, type: "smooth", handleIn: { x: 0, y: -k } },
      { id: "node-3", x: w, y: h - r, type: "smooth", handleOut: { x: 0, y: k } },
      { id: "node-4", x: w - r, y: h, type: "smooth", handleIn: { x: k, y: 0 } },
      { id: "node-5", x: r, y: h, type: "smooth", handleOut: { x: -k, y: 0 } },
      { id: "node-6", x: 0, y: h - r, type: "smooth", handleIn: { x: 0, y: k } },
      { id: "node-7", x: 0, y: r, type: "smooth", handleOut: { x: 0, y: -k } },
    ],
    closed: true,
  };
}
