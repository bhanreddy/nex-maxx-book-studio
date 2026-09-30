import { CurveNode } from "../../domain/creative/types";

export interface ImageTraceOptions {
  threshold?: number; // 0 - 255 (default 128)
  smoothing?: number; // 1 - 5 (default 2)
  minArea?: number; // minimum pixel area to keep
  mode?: "blackAndWhite" | "silhouette" | "outline";
}

/**
 * Client-side raster-to-vector tracing engine.
 * Samples an image source via HTML Canvas ImageData and converts high-contrast edges into vector paths.
 */
export async function traceImageToVector(
  imageSrc: string,
  options: ImageTraceOptions = {}
): Promise<{ pathData: string; nodes: CurveNode[]; bounds: { width: number; height: number } }> {
  const threshold = options.threshold ?? 128;
  const smoothing = options.smoothing ?? 2;

  return new Promise((resolve, reject) => {
    // In browser environment, load image into an offscreen canvas
    if (typeof window === "undefined") {
      resolve({ pathData: "M 0 0 L 100 0 L 100 100 L 0 100 Z", nodes: [], bounds: { width: 100, height: 100 } });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale down image to max 240px for fast interactive tracing
      const scale = Math.min(1, 240 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to create canvas context for image tracing"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Binary mask: true if pixel is darker than threshold (foreground)
      const binary: boolean[][] = [];
      for (let y = 0; y < h; y++) {
        binary[y] = [];
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          binary[y][x] = a > 50 && luma < threshold;
        }
      }

      // Contour extraction: find boundary points
      const points: { x: number; y: number }[] = [];
      const step = Math.max(1, smoothing);

      for (let y = step; y < h - step; y += step) {
        for (let x = step; x < w - step; x += step) {
          if (binary[y][x]) {
            // If any 4-neighbor is background, it's a boundary point
            if (!binary[y - 1][x] || !binary[y + 1][x] || !binary[y][x - 1] || !binary[y][x + 1]) {
              points.push({ x, y });
            }
          }
        }
      }

      // If no points found, return fallback box
      if (points.length < 3) {
        resolve({
          pathData: `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`,
          nodes: [
            { id: "tr-0", x: 0, y: 0, type: "sharp" },
            { id: "tr-1", x: w, y: 0, type: "sharp" },
            { id: "tr-2", x: w, y: h, type: "sharp" },
            { id: "tr-3", x: 0, y: h, type: "sharp" },
          ],
          bounds: { width: img.width, height: img.height },
        });
        return;
      }

      // Sort points clockwise around center of mass
      let cx = 0;
      let cy = 0;
      points.forEach((p) => {
        cx += p.x;
        cy += p.y;
      });
      cx /= points.length;
      cy /= points.length;

      points.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

      // Downsample points to create clean curve nodes
      const maxNodes = 36;
      const skip = Math.max(1, Math.floor(points.length / maxNodes));
      const samplePoints = points.filter((_, idx) => idx % skip === 0);

      // Scale coordinates back to original target width/height
      const invScale = 1 / scale;
      const nodes: CurveNode[] = samplePoints.map((p, idx) => ({
        id: `node-${idx}`,
        x: Math.round(p.x * invScale * 10) / 10,
        y: Math.round(p.y * invScale * 10) / 10,
        type: "smooth",
        handleIn: { x: -6, y: -6 },
        handleOut: { x: 6, y: 6 },
      }));

      // Build SVG Path string
      let pathData = `M ${nodes[0].x} ${nodes[0].y}`;
      for (let i = 1; i < nodes.length; i++) {
        const curr = nodes[i];
        pathData += ` L ${curr.x} ${curr.y}`;
      }
      pathData += " Z";

      resolve({
        pathData,
        nodes,
        bounds: { width: img.width, height: img.height },
      });
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image for vector tracing: ${imageSrc.substring(0, 50)}...`));
    };

    img.src = imageSrc;
  });
}
