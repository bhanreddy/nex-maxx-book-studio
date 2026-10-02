import { CurveNode, CurveNodeType } from "../../domain/creative/types";
import { shapeToVectorCurveNodes } from "./shapeGeometry";
import { VectorShapeType, ElementStyle } from "../../domain/element/types";

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
  return shapeToVectorCurveNodes(
    shapeType as VectorShapeType,
    width,
    height,
    {
      starPoints: options?.starPoints,
      polygonSides: options?.polygonSides,
    },
    options?.borderRadius ? { radius: options.borderRadius, linked: true, style: "rounded" } : undefined,
    options?.borderRadius
  );
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

/**
 * Combines multiple vector shapes using Boolean operations (union, subtract, intersect, exclude)
 * into a single unified compound vector path and editable Bézier nodes.
 */
export function combineShapesBoolean(
  primary: {
    shapeType: string;
    width: number;
    height: number;
    x: number;
    y: number;
    style?: ElementStyle;
    nodes?: CurveNode[];
  },
  secondaries: {
    shapeType: string;
    width: number;
    height: number;
    x: number;
    y: number;
    style?: ElementStyle;
    nodes?: CurveNode[];
  }[],
  op: "union" | "subtract" | "intersect" | "exclude" = "union"
): {
  pathData: string;
  nodes: CurveNode[];
  fillRule: "nonzero" | "evenodd";
  width: number;
  height: number;
  minX: number;
  minY: number;
} {
  const allShapes = [primary, ...secondaries];
  const minX = Math.min(...allShapes.map((s) => s.x));
  const minY = Math.min(...allShapes.map((s) => s.y));
  const maxX = Math.max(...allShapes.map((s) => s.x + s.width));
  const maxY = Math.max(...allShapes.map((s) => s.y + s.height));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  // Extract primary nodes
  const primaryNodesRaw =
    primary.nodes && primary.nodes.length > 0
      ? primary.nodes
      : shapeToCurveNodes(primary.shapeType || "rectangle", primary.width, primary.height, {
          borderRadius: primary.style?.borderRadius,
        }).nodes;

  const dxP = primary.x - minX;
  const dyP = primary.y - minY;
  const primaryNodes: CurveNode[] = primaryNodesRaw.map((n, i) => ({
    ...n,
    id: `node-p-${i}`,
    x: n.x + dxP,
    y: n.y + dyP,
    handleIn: n.handleIn ? { ...n.handleIn } : undefined,
    handleOut: n.handleOut ? { ...n.handleOut } : undefined,
  }));

  const subpaths: string[] = [curveNodesToSvgPath(primaryNodes, true)];
  const combinedNodes: CurveNode[] = [...primaryNodes];

  secondaries.forEach((sec, sIdx) => {
    const secNodesRaw =
      sec.nodes && sec.nodes.length > 0
        ? sec.nodes
        : shapeToCurveNodes(sec.shapeType || "rectangle", sec.width, sec.height, {
            borderRadius: sec.style?.borderRadius,
          }).nodes;

    const dxS = sec.x - minX;
    const dyS = sec.y - minY;
    let secNodes: CurveNode[] = secNodesRaw.map((n, i) => ({
      ...n,
      id: `node-s${sIdx}-${i}`,
      x: n.x + dxS,
      y: n.y + dyS,
      handleIn: n.handleIn ? { ...n.handleIn } : undefined,
      handleOut: n.handleOut ? { ...n.handleOut } : undefined,
    }));

    if (op === "subtract") {
      // Invert node order to reverse path winding
      secNodes = [...secNodes].reverse().map((n) => ({
        ...n,
        handleIn: n.handleOut ? { x: -n.handleOut.x, y: -n.handleOut.y } : undefined,
        handleOut: n.handleIn ? { x: -n.handleIn.x, y: -n.handleIn.y } : undefined,
      }));
    }

    subpaths.push(curveNodesToSvgPath(secNodes, true));
    combinedNodes.push(...secNodes);
  });

  const pathData = subpaths.join(" ");
  const fillRule: "nonzero" | "evenodd" =
    op === "subtract" || op === "intersect" || op === "exclude" ? "evenodd" : "nonzero";

  return {
    pathData,
    nodes: combinedNodes,
    fillRule,
    width,
    height,
    minX,
    minY,
  };
}
