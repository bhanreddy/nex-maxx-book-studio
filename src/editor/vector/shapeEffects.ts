import {
  ElementStyle,
  VectorShapeType,
  ShapeEffectItem,
  ShapeFillConfig,
  ShapeStrokeConfig,
  ShapeTextConfig,
  ShapeCornersConfig,
  ShapeShadowEffect,
  ShapeGlowEffect,
  ShapeElevationEffect,
  ShapeDepth3DEffect,
  ShapeGlassEffect,
  ShapePaperEffect,
} from "../../domain/element/types";
import { SceneNode } from "../educational/publicationScene";
import { generateShapeSvgPath } from "./shapeGeometry";

export interface ShapePresetStyle {
  id: string;
  name: string;
  category: "clean" | "premium" | "playful" | "academic" | "emphasis";
  description: string;
  style: Partial<ElementStyle>;
}

/**
 * Standard Tokenized Shape Presets
 */
export const SHAPE_STYLE_PRESETS: ShapePresetStyle[] = [
  // Clean
  {
    id: "clean-minimal",
    name: "Minimal",
    category: "clean",
    description: "Subtle transparent container with thin neutral border",
    style: {
      backgroundColor: "transparent",
      borderColor: "#94a3b8",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 8,
      shapeFill: { type: "none" },
      shapeStroke: { color: "#94a3b8", width: 1 },
      shapeCorners: { radius: 8, linked: true, style: "rounded" },
      shapeEffects: [],
    },
  },
  {
    id: "clean-outline",
    name: "Crisp Outline",
    category: "clean",
    description: "Bold clean outline with clear contrast",
    style: {
      backgroundColor: "#ffffff",
      borderColor: "#4338ca",
      borderWidth: 2,
      borderStyle: "solid",
      borderRadius: 10,
      shapeFill: { type: "solid", color: "#ffffff" },
      shapeStroke: { color: "#4338ca", width: 2 },
      shapeCorners: { radius: 10, linked: true, style: "rounded" },
      shapeEffects: [],
    },
  },
  {
    id: "clean-soft-fill",
    name: "Soft Fill",
    category: "clean",
    description: "Gentle background tint with light border",
    style: {
      backgroundColor: "#f8fafc",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 12,
      shapeFill: { type: "solid", color: "#f8fafc" },
      shapeStroke: { color: "#e2e8f0", width: 1 },
      shapeCorners: { radius: 12, linked: true, style: "rounded" },
      shapeEffects: [],
    },
  },

  // Premium
  {
    id: "premium-soft-elevated",
    name: "Soft Elevated",
    category: "premium",
    description: "Airy floating card with dual ambient & contact shadows",
    style: {
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 14,
      shapeFill: { type: "solid", color: "#ffffff" },
      shapeStroke: { color: "#e2e8f0", width: 1 },
      shapeCorners: { radius: 14, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "elevation", level: 2 },
      ],
    },
  },
  {
    id: "premium-paper",
    name: "Soft Paper",
    category: "premium",
    description: "Warm textbook paper look with tactile micro-depth",
    style: {
      backgroundColor: "#fdfcfa",
      borderColor: "#e7e2d9",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 8,
      shapeFill: { type: "solid", color: "#fdfcfa" },
      shapeStroke: { color: "#e7e2d9", width: 1 },
      shapeCorners: { radius: 8, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "paper", variant: "soft", intensity: 1 },
      ],
    },
  },
  {
    id: "premium-frosted",
    name: "Frosted Glass",
    category: "premium",
    description: "Translucent frosted background with bright edge highlight",
    style: {
      backgroundColor: "rgba(255, 255, 255, 0.72)",
      borderColor: "rgba(255, 255, 255, 0.9)",
      borderWidth: 1.5,
      borderStyle: "solid",
      borderRadius: 16,
      shapeFill: { type: "solid", color: "rgba(255, 255, 255, 0.72)" },
      shapeStroke: { color: "rgba(255, 255, 255, 0.9)", width: 1.5 },
      shapeCorners: { radius: 16, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "glass", variant: "frosted", blur: 14, borderBrightness: 1 },
      ],
    },
  },
  {
    id: "premium-editorial",
    name: "Editorial Block",
    category: "premium",
    description: "Crisp architectural line with high-contrast hard offset shadow",
    style: {
      backgroundColor: "#ffffff",
      borderColor: "#0f172a",
      borderWidth: 2,
      borderStyle: "solid",
      borderRadius: 4,
      shapeFill: { type: "solid", color: "#ffffff" },
      shapeStroke: { color: "#0f172a", width: 2 },
      shapeCorners: { radius: 4, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "dropShadow", x: 4, y: 4, blur: 0, spread: 0, color: "#0f172a", opacity: 0.9 },
      ],
    },
  },

  // Playful
  {
    id: "playful-soft-3d",
    name: "Soft 3D Pill",
    category: "playful",
    description: "Vibrant pill with bevel highlight and soft depth",
    style: {
      backgroundColor: "#e0e7ff",
      borderColor: "#6366f1",
      borderWidth: 1.5,
      borderRadius: 999,
      shapeFill: {
        type: "linear-gradient",
        angle: 135,
        stops: [
          { offset: 0, color: "#818cf8" },
          { offset: 1, color: "#4f46e5" },
        ],
      },
      shapeStroke: { color: "#4338ca", width: 1.5 },
      shapeCorners: { radius: 999, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "depth3d", mode: "raised-edge", depth: 3 },
      ],
    },
  },
  {
    id: "playful-sticker",
    name: "White Sticker",
    category: "playful",
    description: "Thick white outline badge with dark contact shadow",
    style: {
      backgroundColor: "#38bdf8",
      borderColor: "#ffffff",
      borderWidth: 3.5,
      borderStyle: "solid",
      borderRadius: 16,
      shapeFill: { type: "solid", color: "#38bdf8" },
      shapeStroke: { color: "#ffffff", width: 3.5 },
      shapeCorners: { radius: 16, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "dropShadow", x: 0, y: 4, blur: 8, spread: 0, color: "#0f172a", opacity: 0.25 },
      ],
    },
  },

  // Academic
  {
    id: "academic-diagram",
    name: "Diagram Node",
    category: "academic",
    description: "Crisp technical card tailored for curriculum diagrams",
    style: {
      backgroundColor: "#f8fafc",
      borderColor: "#64748b",
      borderWidth: 1.5,
      borderStyle: "solid",
      borderRadius: 6,
      shapeFill: { type: "solid", color: "#f8fafc" },
      shapeStroke: { color: "#64748b", width: 1.5 },
      shapeCorners: { radius: 6, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "elevation", level: 1 },
      ],
    },
  },
  {
    id: "academic-worksheet",
    name: "Worksheet Area",
    category: "academic",
    description: "Dashed student write-in section with high print safety",
    style: {
      backgroundColor: "#ffffff",
      borderColor: "#94a3b8",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderRadius: 8,
      shapeFill: { type: "solid", color: "#ffffff" },
      shapeStroke: { color: "#94a3b8", width: 1.5, dasharray: "6,4" },
      shapeCorners: { radius: 8, linked: true, style: "rounded" },
      shapeEffects: [],
    },
  },

  // Emphasis
  {
    id: "emphasis-highlight",
    name: "Highlight Card",
    category: "emphasis",
    description: "Warm yellow discovery highlight container",
    style: {
      backgroundColor: "#fef9c3",
      borderColor: "#fde047",
      borderWidth: 1.5,
      borderStyle: "solid",
      borderRadius: 10,
      shapeFill: { type: "solid", color: "#fef9c3" },
      shapeStroke: { color: "#ca8a04", width: 1.5 },
      shapeCorners: { radius: 10, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "elevation", level: 1 },
      ],
    },
  },
  {
    id: "emphasis-important",
    name: "Important Alert",
    category: "emphasis",
    description: "Vibrant alert box for critical textbook notices",
    style: {
      backgroundColor: "#fef2f2",
      borderColor: "#f87171",
      borderWidth: 1.5,
      borderStyle: "solid",
      borderRadius: 10,
      shapeFill: { type: "solid", color: "#fef2f2" },
      shapeStroke: { color: "#ef4444", width: 1.5 },
      shapeCorners: { radius: 10, linked: true, style: "rounded" },
      shapeEffects: [
        { type: "elevation", level: 1 },
      ],
    },
  },
];

/**
 * Builds CSS box-shadow string supporting multi-layered shadows and inner shadows
 */
export function buildShapeBoxShadow(effects?: ShapeEffectItem[], legacyShadow?: string): string {
  if (!effects || effects.length === 0) {
    return legacyShadow || "none";
  }

  const shadowParts: string[] = [];

  for (const ef of effects) {
    if (ef.type === "elevation" || (ef.type as string).startsWith("elevation-")) {
      const level = (ef as ShapeElevationEffect).level ?? (parseInt((ef.type as string).replace("elevation-", ""), 10) || 2);
      // Print-safe, professional dual-shadow levels
      switch (level) {
        case 1:
          shadowParts.push("0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.05)");
          break;
        case 2:
          shadowParts.push("0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)");
          break;
        case 3:
          shadowParts.push("0 10px 15px -3px rgba(15, 23, 42, 0.09), 0 4px 6px -4px rgba(15, 23, 42, 0.05)");
          break;
        case 4:
          shadowParts.push("0 20px 25px -5px rgba(15, 23, 42, 0.11), 0 8px 10px -6px rgba(15, 23, 42, 0.06)");
          break;
        case 5:
          shadowParts.push("0 25px 50px -12px rgba(15, 23, 42, 0.18)");
          break;
      }
    } else if (
      ef.type === "dropShadow" ||
      ef.type === "ambient" ||
      ef.type === "ambientShadow" ||
      ef.type === "contactShadow" ||
      ef.type === "longShadow" ||
      ef.type === "innerShadow"
    ) {
      const isInner = ef.type === "innerShadow" || ef.inset;
      const prefix = isInner ? "inset " : "";
      const col = hexOrRgbaToCss(ef.color, ef.opacity);
      const spread = ef.spread ?? 0;
      const x = ef.x ?? 0;
      const y = ef.y ?? (ef.type === "ambient" || ef.type === "ambientShadow" ? 0 : 4);
      shadowParts.push(`${prefix}${x}px ${y}px ${ef.blur}px ${spread}px ${col}`);
    } else if (ef.type === "glow") {
      const col = hexOrRgbaToCss(ef.color, ef.intensity);
      const isInner = ef.inner ? "inset " : "";
      shadowParts.push(`${isInner}0 0 ${ef.blur}px ${ef.spread ?? 0}px ${col}`);
    } else if (ef.type === "paper") {
      shadowParts.push("0 2px 6px rgba(60, 50, 40, 0.08), 0 1px 2px rgba(60, 50, 40, 0.05)");
    } else if (ef.type === "glass") {
      shadowParts.push("0 8px 32px 0 rgba(31, 38, 135, 0.12)");
    } else if (ef.type === "depth3d") {
      if (ef.mode === "raised-edge") {
        shadowParts.push(`0 ${ef.depth}px ${ef.depth * 2}px rgba(15, 23, 42, 0.15)`);
      } else if (ef.mode === "bevel") {
        shadowParts.push("inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0, 0, 0, 0.2)");
      } else if (ef.mode === "pressed") {
        shadowParts.push("inset 0 2px 4px rgba(15, 23, 42, 0.2)");
      }
    }
  }

  return shadowParts.length > 0 ? shadowParts.join(", ") : (legacyShadow || "none");
}

/**
 * Builds CSS filter string (e.g. drop-shadow for non-rectangular SVG shapes)
 */
export function buildShapeSvgDropShadow(effects?: ShapeEffectItem[]): string {
  if (!effects || effects.length === 0) return "none";

  const filters: string[] = [];
  for (const ef of effects) {
    if (ef.type === "elevation" || (ef.type as string).startsWith("elevation-")) {
      const level = (ef as ShapeElevationEffect).level ?? (parseInt((ef.type as string).replace("elevation-", ""), 10) || 2);
      const blur = level * 3;
      const y = Math.max(1, level * 1.5);
      filters.push(`drop-shadow(0px ${y}px ${blur}px rgba(15, 23, 42, 0.12))`);
    } else if (
      ef.type === "dropShadow" ||
      ef.type === "ambient" ||
      ef.type === "ambientShadow" ||
      ef.type === "contactShadow"
    ) {
      const col = hexOrRgbaToCss(ef.color, ef.opacity);
      const x = ef.x ?? 0;
      const y = ef.y ?? 4;
      filters.push(`drop-shadow(${x}px ${y}px ${ef.blur}px ${col})`);
    } else if (ef.type === "glow") {
      const col = hexOrRgbaToCss(ef.color, ef.intensity);
      filters.push(`drop-shadow(0px 0px ${ef.blur}px ${col})`);
    }
  }

  return filters.length > 0 ? filters.join(" ") : "none";
}

/**
 * Converts a hex or rgba string into CSS color with explicit opacity
 */
export function hexOrRgbaToCss(color: string, opacity: number = 1): string {
  if (!color) return `rgba(0, 0, 0, ${opacity})`;
  if (color.startsWith("rgba")) return color;
  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/**
 * Maps Shape Fill Config to SVG Fill value or gradient ID
 */
export function resolveShapeFill(
  fillConfig?: ShapeFillConfig,
  legacyBgColor?: string,
  elementId?: string
): {
  svgFill: string;
  gradientDef?: {
    id: string;
    type: "linear" | "radial";
    stops: { offset: string; color: string; opacity?: number }[];
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
    cx?: string;
    cy?: string;
    r?: string;
  };
  patternDef?: {
    id: string;
    type: string;
    color: string;
    scale: number;
  };
  imageDef?: {
    id: string;
    url: string;
    fit: "cover" | "contain";
    zoom: number;
  };
} {
  const fill = fillConfig || (legacyBgColor ? { type: "solid", color: legacyBgColor } : { type: "solid", color: "#e0e7ff" });

  if (fill.type === "none") {
    return { svgFill: "none" };
  }

  if (fill.type === "solid") {
    return { svgFill: fill.color || "#e0e7ff" };
  }

  if (fill.type === "linear-gradient") {
    const id = `grad-lin-${elementId || Math.random().toString(36).substring(2, 7)}`;
    const angleRad = ((fill.angle ?? 90) * Math.PI) / 180;
    const x1 = `${Math.round(50 - Math.cos(angleRad) * 50)}%`;
    const y1 = `${Math.round(50 - Math.sin(angleRad) * 50)}%`;
    const x2 = `${Math.round(50 + Math.cos(angleRad) * 50)}%`;
    const y2 = `${Math.round(50 + Math.sin(angleRad) * 50)}%`;

    const stops = (fill.stops || [
      { offset: 0, color: "#818cf8" },
      { offset: 1, color: "#4f46e5" },
    ]).map((s) => ({
      offset: `${Math.round(s.offset * 100)}%`,
      color: s.color,
      opacity: s.opacity,
    }));

    return {
      svgFill: `url(#${id})`,
      gradientDef: {
        id,
        type: "linear",
        x1,
        y1,
        x2,
        y2,
        stops,
      },
    };
  }

  if (fill.type === "radial-gradient") {
    const id = `grad-rad-${elementId || Math.random().toString(36).substring(2, 7)}`;
    const cx = `${Math.round((fill.cx ?? 0.5) * 100)}%`;
    const cy = `${Math.round((fill.cy ?? 0.5) * 100)}%`;
    const r = `${Math.round((fill.radius ?? 0.5) * 100)}%`;

    const stops = (fill.stops || [
      { offset: 0, color: "#ffffff" },
      { offset: 1, color: "#6366f1" },
    ]).map((s) => ({
      offset: `${Math.round(s.offset * 100)}%`,
      color: s.color,
      opacity: s.opacity,
    }));

    return {
      svgFill: `url(#${id})`,
      gradientDef: {
        id,
        type: "radial",
        cx,
        cy,
        r,
        stops,
      },
    };
  }

  if (fill.type === "pattern") {
    const id = `pattern-${elementId || Math.random().toString(36).substring(2, 7)}`;
    return {
      svgFill: `url(#${id})`,
      patternDef: {
        id,
        type: fill.pattern || "dots",
        color: fill.patternColor || "#64748b",
        scale: fill.patternScale || 12,
      },
    };
  }

  if (fill.type === "image" && fill.imageUrl) {
    const id = `img-fill-${elementId || Math.random().toString(36).substring(2, 7)}`;
    return {
      svgFill: `url(#${id})`,
      imageDef: {
        id,
        url: fill.imageUrl,
        fit: fill.imageFit || "cover",
        zoom: fill.imageZoom || 1,
      },
    };
  }

  return { svgFill: fill.color || legacyBgColor || "#e0e7ff" };
}

/**
 * Resolves stroke parameters
 */
export function resolveShapeStroke(
  strokeConfig?: ShapeStrokeConfig,
  legacyColor?: string,
  legacyWidth?: number,
  legacyDash?: string
): {
  color: string;
  width: number;
  dasharray?: string;
  linecap: "butt" | "round" | "square";
  linejoin: "miter" | "round" | "bevel";
  opacity: number;
} {
  const color = strokeConfig?.color ?? legacyColor ?? "#4338ca";
  const width = strokeConfig?.width ?? legacyWidth ?? 1.5;
  const dasharray = strokeConfig?.dasharray ?? legacyDash ?? undefined;
  const linecap = strokeConfig?.linecap ?? "round";
  const linejoin = strokeConfig?.linejoin ?? "round";
  const opacity = strokeConfig?.opacity ?? 1;

  return { color, width, dasharray, linecap, linejoin, opacity };
}

/**
 * Convert a shape element into deterministic PublicationScene nodes for 100% PDF export fidelity!
 */
export function shapeToPublicationSceneNodes(
  shapeType: string,
  w: number,
  h: number,
  style: ElementStyle,
  textConfig?: ShapeTextConfig
): SceneNode[] {
  const nodes: SceneNode[] = [];
  const stroke = resolveShapeStroke(style.shapeStroke, style.borderColor, style.borderWidth, style.borderStyle === "dashed" ? "5,4" : undefined);
  const fill = resolveShapeFill(style.shapeFill, style.backgroundColor, "pdf");

  // Handle gradient fill for PDF
  let gradientId: string | undefined;
  if (fill.gradientDef && fill.gradientDef.type === "linear") {
    gradientId = `pdf-grad-${Math.random().toString(36).substring(2, 7)}`;
    const stops = fill.gradientDef.stops;
    const fromCol = stops[0]?.color || "#4f46e5";
    const toCol = stops[stops.length - 1]?.color || "#818cf8";
    nodes.push({
      kind: "gradient",
      id: gradientId,
      x1: 0,
      y1: 0,
      x2: w,
      y2: h,
      from: fromCol.startsWith("#") ? fromCol : "#4f46e5",
      to: toCol.startsWith("#") ? toCol : "#818cf8",
    });
  }

  // Generate exact SVG path for the shape
  const d =
    style.pathData ||
    generateShapeSvgPath(
      (shapeType as VectorShapeType) || style.shapeType || "rectangle",
      w,
      h,
      style.shapeParams,
      style.shapeCorners,
      style.borderRadius
    );

  // If linear gradient, we add a rect node with gradientId or path with solid fill fallback
  if (gradientId && (shapeType === "rectangle" || shapeType === "square")) {
    nodes.push({
      kind: "rect",
      x: 0,
      y: 0,
      w,
      h,
      fill: style.backgroundColor || "#4f46e5",
      stroke: stroke.color,
      strokeWidth: stroke.width,
      radius: style.borderRadius || 0,
      gradientId,
    });
  } else {
    // Universal vector path node for all other shapes
    nodes.push({
      kind: "path",
      d,
      fill: fill.svgFill.startsWith("#") ? fill.svgFill : style.backgroundColor || "#e0e7ff",
      stroke: stroke.color,
      strokeWidth: stroke.width,
    });
  }

  // Text inside shape for PDF export
  const shapeText = textConfig || style.shapeText;
  if (shapeText && shapeText.text && shapeText.text.trim().length > 0) {
    const fontSize = shapeText.fontSize || 12;
    const font = (shapeText.fontFamily?.toLowerCase().includes("serif") ? "serif" : "sans") as "serif" | "sans";
    const bold = Boolean(shapeText.fontWeight && (Number(shapeText.fontWeight) >= 600 || shapeText.fontWeight === "bold"));
    const textFill = shapeText.color || "#0f172a";

    // Text position
    let textX = w / 2;
    let align: "start" | "middle" | "end" = "middle";
    if (shapeText.textAlign === "left") {
      textX = shapeText.padding || 12;
      align = "start";
    } else if (shapeText.textAlign === "right") {
      textX = w - (shapeText.padding || 12);
      align = "end";
    }

    let textY = h / 2 + fontSize * 0.35;
    if (shapeText.verticalAlign === "top") {
      textY = (shapeText.padding || 12) + fontSize;
    } else if (shapeText.verticalAlign === "bottom") {
      textY = h - (shapeText.padding || 12);
    }

    nodes.push({
      kind: "text",
      x: textX,
      y: textY,
      text: shapeText.text,
      size: fontSize,
      fill: textFill,
      font,
      bold,
      align,
    });
  }

  return nodes;
}
