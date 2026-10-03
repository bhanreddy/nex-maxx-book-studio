import type { PageElement } from "../../domain/element/types";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { buildPublicationScene, expandSceneText, textWidth, wrapText, type SceneNode, type PublicationScene } from "./publicationScene";
import { transformSceneNode } from "./sceneGeometry";

function shiftNode(node: SceneNode, x: number, y: number): SceneNode {
  return transformSceneNode(node, 1, 1, -x, -y);
}

/** Decompose the actual scene, including images and decoration, rather than rebuilding a generic block. */
export function detachPublicationScene(block: SmartBlockInstance, baseZIndex: number): PageElement[] {
  const sourceScene = buildPublicationScene(block), frame = block.styleOverrides.resizeFrame;
  const scene = frame ? { ...sourceScene, width: block.transform.width, height: block.transform.height,
    nodes: sourceScene.nodes.map(node => transformSceneNode(node, block.transform.width / frame.width, block.transform.height / frame.height)) } : sourceScene;
  const angle = (block.transform.rotation * Math.PI) / 180;

  return scene.nodes.flatMap(expandSceneText).flatMap((node, index): PageElement[] => {
    if (node.kind === "gradient" || node.kind === "clip") return [];
    let x = 0, y = 0, w = scene.width, h = scene.height;

    if (node.kind === "rect" || node.kind === "image") {
      x = node.x;
      y = node.y;
      w = node.w;
      h = node.h;
    } else if (node.kind === "ellipse") {
      x = node.x - node.rx;
      y = node.y - node.ry;
      w = node.rx * 2;
      h = node.ry * 2;
    } else if (node.kind === "text") {
      w = Math.max(6, (node.textLength ?? textWidth(node.text, node.size, !!node.bold, node.font === "serif")) + 4);
      h = node.size * 1.55;
      x = node.x - (node.align === "middle" ? w / 2 : node.align === "end" ? w : 0);
      y = node.y - node.size * 1.15;
    } else if (node.kind === "line") {
      const sw = node.strokeWidth || 1;
      x = Math.min(node.x, node.x2);
      y = Math.min(node.y, node.y2);
      w = Math.max(sw, Math.abs(node.x2 - node.x));
      h = Math.max(sw, Math.abs(node.y2 - node.y));
    } else if (node.kind === "polygon" || node.kind === "path") {
      const points =
        node.kind === "polygon"
          ? node.points
          : (node.d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [])
              .reduce<number[][]>((acc, v, i) => {
                if (i % 2) acc[acc.length - 1].push(Number(v));
                else acc.push([Number(v)]);
                return acc;
              }, [])
              .filter((p) => p.length === 2);
      if (points.length) {
        x = Math.min(...points.map((p) => p[0]));
        y = Math.min(...points.map((p) => p[1]));
        w = Math.max(1, ...points.map((p) => p[0] - x));
        h = Math.max(1, ...points.map((p) => p[1] - y));
      }
    }

    const cx = x + w / 2 - scene.width / 2;
    const cy = y + h / 2 - scene.height / 2;
    const id = crypto.randomUUID();

    const el: PageElement = {
      id,
      pageId: block.pageId,
      type: node.kind === "text" ? "body" : node.kind === "image" ? "image" : "shape",
      category: node.kind === "text" ? "text" : node.kind === "image" ? "media" : "decorative",
      version: 2,
      displayName: node.kind === "text" ? node.text : node.kind === "image" ? node.alt : `${block.semanticContent.title} · ${node.kind}`,
      locked: false,
      hidden: false,
      textWrap: { mode: "none", offsetPt: 0 },
      transform: {
        x: block.transform.x + scene.width / 2 + cx * Math.cos(angle) - cy * Math.sin(angle) - w / 2,
        y: block.transform.y + scene.height / 2 + cx * Math.sin(angle) + cy * Math.cos(angle) - h / 2,
        width: w,
        height: h,
        rotation: block.transform.rotation,
        zIndex: baseZIndex + index,
      },
      style: { opacity: node.opacity ?? 1 },
      content: {},
    };

    if (node.kind === "image") {
      el.style = { ...el.style, objectFit: node.fit || "cover", borderRadius: node.radius };
      el.content = {
        src: node.src,
        imageUrl: node.src,
        alt: node.alt,
        focalX: node.focalX,
        focalY: node.focalY,
        cropScale: node.scale,
        rawWidthPx: node.sourceWidth,
        rawHeightPx: node.sourceHeight,
        flipX: node.flipX,
        flipY: node.flipY,
        brightness: node.brightness,
        contrast: node.contrast,
        saturation: node.saturation,
        hueRotate: node.hueRotate,
        mask: node.mask,
        customMaskPath: node.customMaskPath,
      };
    } else {
      const local = shiftNode(node, x, y);
      if ("opacity" in local) local.opacity = 1;
      el.content = {
        publicationPrimitive: {
          width: w,
          height: h,
          nodes: [...scene.nodes.filter((n) => n.kind === "gradient" || n.kind === "clip").map((n) => shiftNode(n, x, y)), local],
        },
        text: node.kind === "text" ? node.text : undefined,
      };
      if (node.kind === "text") {
        el.style = {
          ...el.style,
          color: node.fill,
          fontSize: node.size,
          fontWeight: node.fontWeight ?? (node.bold ? 700 : 400),
          fontFamily: node.fontFamily || (node.font === "serif" ? "Times New Roman" : "Arial"),
        };
      } else {
        el.style = { ...el.style,
          ...("fill" in node && !(node.kind === "rect" && node.gradientId) ? { backgroundColor: node.fill } : {}),
          ...("stroke" in node && node.stroke ? { borderColor: node.stroke, borderWidth: node.strokeWidth || 1 } : {}),
          ...(node.kind === "rect" ? { borderRadius: node.radius, shapeType: "rectangle" as const } : {}),
          ...(node.kind === "ellipse" ? { shapeType: "ellipse" as const } : {}),
          ...(node.kind === "line" ? { shapeType: "line" as const } : {}),
          ...(node.kind === "path" || node.kind === "polygon" ? { shapeType: "path" as const } : {}),
        };
      }
    }
    return [el];
  });
}

export function detachedSceneForElement(el: PageElement): PublicationScene | null {
  const source = el.content.publicationPrimitive as { width: number; height: number; nodes: SceneNode[] } | undefined;
  if (!source) return null;
  const text = source.nodes.find((n): n is Extract<SceneNode, { kind: "text" }> => n.kind === "text");
  if (text) {
    const size = el.style.fontSize || text.size, width = el.transform.width;
    const lines = wrapText(el.content.text ?? text.text, Math.max(12, width - 4), size, (el.style.fontWeight || 400) >= 600, el.style.fontFamily?.includes("Times"));
    const lineHeight = size * (el.style.lineHeight || 1.42);
    const align = el.style.textAlign === "center" ? "middle" : el.style.textAlign === "right" ? "end" : text.align || "start";
    return { width, height: Math.max(el.transform.height, size * 1.55 + (lines.length - 1) * lineHeight), variant: "editable-text", warnings: [],
      nodes: [...source.nodes.filter(n => n.kind === "gradient" || n.kind === "clip"), ...lines.map((line, i): SceneNode => ({ ...text, text: line, textLength: undefined, x: align === "middle" ? width / 2 : align === "end" ? width : text.x, y: size * 1.15 + i * lineHeight, size, align, fill: el.style.color || text.fill, bold: (el.style.fontWeight || 400) >= 600, fontFamily: el.style.fontFamily || text.fontFamily, font: el.style.fontFamily?.includes("Times") ? "serif" : "sans" }))] };
  }

  const nodes = source.nodes.map((n): SceneNode => {
    if (n.kind === "text") {
      return {
        ...n,
        text: el.content.text ?? n.text,
        size: el.style.fontSize ?? n.size,
        fill: el.style.color || n.fill,
        bold: (el.style.fontWeight ?? 400) >= 600,
        fontFamily: el.style.fontFamily || n.fontFamily,
        font: el.style.fontFamily?.includes("Times") ? "serif" : "sans",
      };
    }
    if (n.kind === "gradient" || n.kind === "clip") return n;

    return {
      ...n,
      ...("fill" in n && el.style.backgroundColor ? { fill: el.style.backgroundColor, gradientId: undefined } : {}),
      ...("stroke" in n && el.style.borderColor ? { stroke: el.style.borderColor } : {}),
      ...("strokeWidth" in n && el.style.borderWidth !== undefined ? { strokeWidth: el.style.borderWidth } : {}),
      ...(n.kind === "rect" && el.style.borderRadius !== undefined ? { radius: el.style.borderRadius } : {}),
    };
  });

  return { width: source.width, height: source.height, nodes, variant: "editable-primitive", warnings: [] };
}
