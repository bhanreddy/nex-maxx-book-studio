/**
 * Pixel Selection and Automated Foreground/Background Segmentation Engine
 */

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
 * Automated Non-destructive Background Removal.
 * Identifies background pixels (sampling corner pixels and luminance contrast)
 * and generates a high-contrast alpha mask data URL without deleting source pixels.
 */
export async function generateBackgroundRemovalMask(
  imageSrc: string,
  tolerance: number = 28
): Promise<{ maskDataUrl: string; maskedPreviewUrl: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve({ maskDataUrl: "", maskedPreviewUrl: imageSrc });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.width;
      const h = img.height;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to create canvas context for background removal"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample 4 corners to detect background color
      const corners = [
        0,                                   // Top-left
        (w - 1) * 4,                         // Top-right
        (h - 1) * w * 4,                     // Bottom-left
        ((h - 1) * w + (w - 1)) * 4,         // Bottom-right
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach((idx) => {
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR = Math.round(bgR / 4);
      bgG = Math.round(bgG / 4);
      bgB = Math.round(bgB / 4);

      // Create mask canvas
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w;
      maskCanvas.height = h;
      const mCtx = maskCanvas.getContext("2d");
      if (!mCtx) return;

      const maskImgData = mCtx.createImageData(w, h);
      const mData = maskImgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        const diff = Math.sqrt(
          Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
        );

        if (a < 20 || diff < tolerance) {
          // Background -> black in mask (0 opacity)
          mData[i] = 0;
          mData[i + 1] = 0;
          mData[i + 2] = 0;
          mData[i + 3] = 255;
          // In original preview, make transparent
          data[i + 3] = 0;
        } else {
          // Foreground -> white in mask (255 opacity)
          mData[i] = 255;
          mData[i + 1] = 255;
          mData[i + 2] = 255;
          mData[i + 3] = 255;
        }
      }

      mCtx.putImageData(maskImgData, 0, 0);
      ctx.putImageData(imgData, 0, 0);

      resolve({
        maskDataUrl: maskCanvas.toDataURL("image/png"),
        maskedPreviewUrl: canvas.toDataURL("image/png"),
      });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for background removal"));
    };

    img.src = imageSrc;
  });
}
