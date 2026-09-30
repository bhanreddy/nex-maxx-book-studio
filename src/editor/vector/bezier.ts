import { CurveNode, CurveNodeType } from "../../domain/creative/types";

/**
 * Serializes an array of CurveNodes into a standard SVG path definition string `d`.
 */
export function curveNodesToSvgPath(nodes: CurveNode[], closed: boolean = true): string {
  if (nodes.length === 0) return "";
  if (nodes.length === 1) return `M ${nodes[0].x} ${nodes[0].y}`;

  let d = `M ${nodes[0].x} ${nodes[0].y}`;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    const cp1x = prev.handleOut ? prev.x + prev.handleOut.x : prev.x;
    const cp1y = prev.handleOut ? prev.y + prev.handleOut.y : prev.y;
    const cp2x = curr.handleIn ? curr.x + curr.handleIn.x : curr.x;
    const cp2y = curr.handleIn ? curr.y + curr.handleIn.y : curr.y;

    if (!prev.handleOut && !curr.handleIn) {
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
  }

  if (closed && nodes.length > 2) {
    const last = nodes[nodes.length - 1];
    const first = nodes[0];
    const cp1x = last.handleOut ? last.x + last.handleOut.x : last.x;
    const cp1y = last.handleOut ? last.y + last.handleOut.y : last.y;
    const cp2x = first.handleIn ? first.x + first.handleIn.x : first.x;
    const cp2y = first.handleIn ? first.y + first.handleIn.y : first.y;

    if (!last.handleOut && !first.handleIn) {
      d += " Z";
    } else {
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${first.x.toFixed(2)} ${first.y.toFixed(2)} Z`;
    }
  }

  return d;
}

/**
 * Converts basic shapes (rectangle, circle, star, polygon) into editable Bézier CurveNodes.
 */
export function shapeToCurveNodes(
  shapeType: string,
  width: number,
  height: number,
  options?: { borderRadius?: number; starPoints?: number; polygonSides?: number }
): { nodes: CurveNode[]; closed: boolean } {
  const w = Math.max(10, width);
  const h = Math.max(10, height);

  if (shapeType === "rectangle") {
    const r = Math.min(options?.borderRadius || 0, w / 2, h / 2);
    if (r <= 0) {
      return {
        nodes: [
          { id: "n-0", x: 0, y: 0, type: "sharp" },
          { id: "n-1", x: w, y: 0, type: "sharp" },
          { id: "n-2", x: w, y: h, type: "sharp" },
          { id: "n-3", x: 0, y: h, type: "sharp" },
        ],
        closed: true,
      };
    } else {
      // Rounded rectangle with smooth corner bezier handles
      const k = 0.5522847498 * r;
      return {
        nodes: [
          { id: "n-0", x: r, y: 0, type: "smooth", handleIn: { x: -k, y: 0 } },
          { id: "n-1", x: w - r, y: 0, type: "smooth", handleOut: { x: k, y: 0 } },
          { id: "n-2", x: w, y: r, type: "smooth", handleIn: { x: 0, y: -k } },
          { id: "n-3", x: w, y: h - r, type: "smooth", handleOut: { x: 0, y: k } },
          { id: "n-4", x: w - r, y: h, type: "smooth", handleIn: { x: k, y: 0 } },
          { id: "n-5", x: r, y: h, type: "smooth", handleOut: { x: -k, y: 0 } },
          { id: "n-6", x: 0, y: h - r, type: "smooth", handleIn: { x: 0, y: k } },
          { id: "n-7", x: 0, y: r, type: "smooth", handleOut: { x: 0, y: -k } },
        ],
        closed: true,
      };
    }
  }

  if (shapeType === "circle" || shapeType === "ellipse") {
    const rx = w / 2;
    const ry = h / 2;
    const cx = rx;
    const cy = ry;
    const kx = 0.5522847498 * rx;
    const ky = 0.5522847498 * ry;

    return {
      nodes: [
        { id: "n-top", x: cx, y: 0, type: "smooth", handleIn: { x: -kx, y: 0 }, handleOut: { x: kx, y: 0 } },
        { id: "n-right", x: w, y: cy, type: "smooth", handleIn: { x: 0, y: -ky }, handleOut: { x: 0, y: ky } },
        { id: "n-bottom", x: cx, y: h, type: "smooth", handleIn: { x: kx, y: 0 }, handleOut: { x: -kx, y: 0 } },
        { id: "n-left", x: 0, y: cy, type: "smooth", handleIn: { x: 0, y: ky }, handleOut: { x: 0, y: -ky } },
      ],
      closed: true,
    };
  }

  if (shapeType === "star") {
    const points = options?.starPoints || 5;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.45;
    const nodes: CurveNode[] = [];

    for (let i = 0; i < points * 2; i++) {
      const isOuter = i % 2 === 0;
      const r = isOuter ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      nodes.push({
        id: `star-n-${i}`,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        type: "sharp",
      });
    }

    return { nodes, closed: true };
  }

  if (shapeType === "polygon") {
    const sides = options?.polygonSides || 6;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const nodes: CurveNode[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      nodes.push({
        id: `poly-n-${i}`,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        type: "sharp",
      });
    }

    return { nodes, closed: true };
  }

  // Default Line / Arrow
  return {
    nodes: [
      { id: "line-start", x: 0, y: h / 2, type: "sharp" },
      { id: "line-end", x: w, y: h / 2, type: "sharp" },
    ],
    closed: false,
  };
}

/**
 * Updates a node's type between sharp, smooth, and smart, adjusting handles accordingly.
 */
export function setNodeType(node: CurveNode, newType: CurveNodeType, prev?: CurveNode, next?: CurveNode): CurveNode {
  if (newType === "sharp") {
    return {
      ...node,
      type: "sharp",
      handleIn: undefined,
      handleOut: undefined,
    };
  }

  if (newType === "smooth" || newType === "smart") {
    // If adjacent nodes are provided, calculate collinear tangent handles
    let handleDx = 25;
    let handleDy = 0;

    if (prev && next) {
      const vx = next.x - prev.x;
      const vy = next.y - prev.y;
      const len = Math.hypot(vx, vy);
      if (len > 0) {
        const factor = Math.min(30, len / 4);
        handleDx = (vx / len) * factor;
        handleDy = (vy / len) * factor;
      }
    }

    return {
      ...node,
      type: newType,
      handleIn: { x: -handleDx, y: -handleDy },
      handleOut: { x: handleDx, y: handleDy },
    };
  }

  return node;
}

/**
 * Applies Corner Tool geometry fillets (rounded, chamfer, concave) to a sharp node.
 */
export function applyCornerFillet(
  prev: CurveNode,
  corner: CurveNode,
  next: CurveNode,
  radiusPt: number,
  cornerType: "rounded" | "chamfer" | "concave" = "rounded"
): CurveNode[] {
  if (radiusPt <= 0) return [corner];

  const v1x = prev.x - corner.x;
  const v1y = prev.y - corner.y;
  const v2x = next.x - corner.x;
  const v2y = next.y - corner.y;

  const d1 = Math.hypot(v1x, v1y);
  const d2 = Math.hypot(v2x, v2y);
  if (d1 === 0 || d2 === 0) return [corner];

  const actualR = Math.min(radiusPt, d1 / 2, d2 / 2);
  const p1x = corner.x + (v1x / d1) * actualR;
  const p1y = corner.y + (v1y / d1) * actualR;
  const p2x = corner.x + (v2x / d2) * actualR;
  const p2y = corner.y + (v2y / d2) * actualR;

  if (cornerType === "chamfer") {
    return [
      { id: `${corner.id}-c1`, x: p1x, y: p1y, type: "sharp" },
      { id: `${corner.id}-c2`, x: p2x, y: p2y, type: "sharp" },
    ];
  }

  if (cornerType === "concave") {
    return [
      {
        id: `${corner.id}-c1`,
        x: p1x,
        y: p1y,
        type: "smooth",
        handleOut: { x: (corner.x - p1x) * 0.5, y: (corner.y - p1y) * 0.5 },
      },
      {
        id: `${corner.id}-c2`,
        x: p2x,
        y: p2y,
        type: "smooth",
        handleIn: { x: (corner.x - p2x) * 0.5, y: (corner.y - p2y) * 0.5 },
      },
    ];
  }

  // Rounded fillet
  const k = 0.5522847498;
  return [
    {
      id: `${corner.id}-c1`,
      x: p1x,
      y: p1y,
      type: "smooth",
      handleOut: { x: (corner.x - p1x) * k, y: (corner.y - p1y) * k },
    },
    {
      id: `${corner.id}-c2`,
      x: p2x,
      y: p2y,
      type: "smooth",
      handleIn: { x: (corner.x - p2x) * k, y: (corner.y - p2y) * k },
    },
  ];
}
