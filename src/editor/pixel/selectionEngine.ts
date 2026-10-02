/**
 * Pixel Selection and Automated Foreground/Background Segmentation Engine
 */

import { removeBackgroundRgba } from "./backgroundRemoval";

export interface SelectionRegion {
  type: "marquee" | "ellipse" | "lasso" | "wand";
  bounds: { x: number; y: number; width: number; height: number };
  points?: { x: number; y: number }[];
  featherPt: number;
}

/**
 * Generates an SVG path string for marching ants selection display.
 */
export function getSelectionAntsPath(selection: SelectionRegion): string {
  if (selection.type === "marquee") {
    const { x, y, width, height } = selection.bounds;
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  }

  if (selection.type === "ellipse") {
    const { x, y, width, height } = selection.bounds;
    const rx = width / 2;
    const ry = height / 2;
    const cx = x + rx;
    const cy = y + ry;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }

  if (selection.points && selection.points.length > 2) {
    let p = `M ${selection.points[0].x} ${selection.points[0].y}`;
    for (let i = 1; i < selection.points.length; i++) {
      p += ` L ${selection.points[i].x} ${selection.points[i].y}`;
    }
    return p + " Z";
  }

  const { x, y, width, height } = selection.bounds;
  return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
}

/**
 * Removes the backdrop from an uploaded photo or a preset picture.
 * The original pixels stay available to the caller; this returns a transparent
 * cutout and a matching foreground mask.
 */
export async function generateBackgroundRemovalMask(
  imageSrc: string,
  tolerance: number = 28
): Promise<{ maskDataUrl: string; maskedPreviewUrl: string; changed: boolean }> {
  if (typeof window === "undefined") {
    return { maskDataUrl: "", maskedPreviewUrl: imageSrc, changed: false };
  }

  const img = await loadImage(imageSrc);
  await new Promise(resolve => setTimeout(resolve, 0));
  const w = img.width;
  const h = img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Failed to create canvas context for background removal");

  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const cut = removeBackgroundRgba(image.data, w, h, { tolerance });
  image.data.set(cut.rgba);
  ctx.putImageData(image, 0, 0);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskContext = maskCanvas.getContext("2d");
  if (!maskContext) throw new Error("Failed to create canvas context for background removal");
  const maskImage = maskContext.createImageData(w, h);
  for (let i = 0; i < cut.mask.length; i++) {
    const alpha = cut.mask[i];
    const offset = i * 4;
    maskImage.data[offset] = alpha;
    maskImage.data[offset + 1] = alpha;
    maskImage.data[offset + 2] = alpha;
    maskImage.data[offset + 3] = 255;
  }
  maskContext.putImageData(maskImage, 0, 0);

  return {
    maskDataUrl: maskCanvas.toDataURL("image/png"),
    maskedPreviewUrl: canvas.toDataURL("image/png"),
    changed: cut.changed,
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for background removal"));
    img.src = src;
  });
}
