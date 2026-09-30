/**
 * Professional Raster / Pixel Engine
 * Handles offscreen bitmap manipulation, brush dabs, eraser, inpainting patches,
 * and live adjustment layer filter matrices.
 */

export interface BrushStrokeOptions {
  size: number;
  hardness: number; // 0 (soft airbrush) to 1 (hard edge)
  opacity: number;  // 0 to 1
  color: string;    // CSS color string or hex
  flow?: number;    // 0 to 1
}

/**
 * Renders a smooth continuous brush stroke onto a target HTML Canvas context.
 */
export function renderBrushPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  options: BrushStrokeOptions
) {
  if (points.length === 0) return;

  const { size, hardness, opacity, color, flow = 1 } = options;
  ctx.save();
  ctx.globalAlpha = Math.max(0.05, opacity * flow);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size;

  if (hardness < 0.9) {
    ctx.shadowBlur = size * (1 - hardness) * 0.8;
    ctx.shadowColor = color;
  }

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Erases pixels along a stroke path.
 */
export function renderEraserPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  options: { size: number; hardness: number }
) {
  if (points.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = options.size;

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, options.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Content-Aware Inpainting & Healing Patch.
 * Non-destructively samples pixels from source offset and blends them into target bounding box with a feathered border.
 */
export function applyInpaintPatch(
  canvas: HTMLCanvasElement,
  targetBox: { x: number; y: number; width: number; height: number },
  sourceOffset: { dx: number; dy: number } = { dx: 30, dy: 0 },
  featherRadius: number = 8
): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL();

  const w = targetBox.width;
  const h = targetBox.height;

  // Create temporary patch canvas
  const patchCanvas = document.createElement("canvas");
  patchCanvas.width = w;
  patchCanvas.height = h;
  const pCtx = patchCanvas.getContext("2d");
  if (!pCtx) return canvas.toDataURL();

  // Copy from source offset
  const sx = Math.max(0, Math.min(canvas.width - w, targetBox.x + sourceOffset.dx));
  const sy = Math.max(0, Math.min(canvas.height - h, targetBox.y + sourceOffset.dy));
  pCtx.drawImage(canvas, sx, sy, w, h, 0, 0, w, h);

  // Apply feathered alpha mask to patch edges
  const pData = pCtx.getImageData(0, 0, w, h);
  const data = pData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const distFromEdge = Math.min(x, y, w - 1 - x, h - 1 - y);
      const alphaFactor = Math.min(1, distFromEdge / Math.max(1, featherRadius));
      const idx = (y * w + x) * 4;
      data[idx + 3] = Math.round(data[idx + 3] * alphaFactor);
    }
  }
  pCtx.putImageData(pData, 0, 0);

  // Blend patch onto target position
  ctx.save();
  ctx.drawImage(patchCanvas, targetBox.x, targetBox.y);
  ctx.restore();

  return canvas.toDataURL();
}

/**
 * Generates CSS filter string for live Adjustment Layers and Filters.
 */
export function buildFilterCssString(
  filters: {
    brightness?: number; // 0 - 200, 100 default
    contrast?: number;   // 0 - 200, 100 default
    saturate?: number;   // 0 - 200, 100 default
    hueRotate?: number;  // 0 - 360 deg
    blur?: number;       // pt
    grayscale?: number;  // 0 - 100%
    invert?: number;     // 0 - 100%
    sepia?: number;      // 0 - 100%
  }
): string {
  const parts: string[] = [];

  if (filters.brightness !== undefined && filters.brightness !== 100) {
    parts.push(`brightness(${Math.max(0, filters.brightness)}%)`);
  }
  if (filters.contrast !== undefined && filters.contrast !== 100) {
    parts.push(`contrast(${Math.max(0, filters.contrast)}%)`);
  }
  if (filters.saturate !== undefined && filters.saturate !== 100) {
    parts.push(`saturate(${Math.max(0, filters.saturate)}%)`);
  }
  if (filters.hueRotate && filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  }
  if (filters.blur && filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.grayscale && filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.invert && filters.invert > 0) {
    parts.push(`invert(${filters.invert}%)`);
  }
  if (filters.sepia && filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}
