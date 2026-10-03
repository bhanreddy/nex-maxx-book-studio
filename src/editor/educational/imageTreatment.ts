/** Non-destructive image settings shared by the canvas, template previews and PDF. */
export interface ImageTreatment {
  /** Rotate the source within its clipping frame; same treatment in SVG and PDF. */
  rotation?: number;
  mask?: "rectangle" | "rounded" | "circle" | "arch" | "blob" | "wave" | "organic" | "custom";
  /** SVG path in a 100 × 100 coordinate system. */
  customMaskPath?: string;
  fit?: "cover" | "contain";
  flipX?: boolean;
  flipY?: boolean;
  radius?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hueRotate?: number;
}
export function imageMaskPath(value: ImageTreatment, width = 100, height = 100): string | undefined {
  const paths: Record<string, string> = {
    circle: "M 50 0 C 78 0 100 22 100 50 C 100 78 78 100 50 100 C 22 100 0 78 0 50 C 0 22 22 0 50 0 Z",
    arch: "M 0 100 L 0 50 C 0 22 22 0 50 0 C 78 0 100 22 100 50 L 100 100 Z",
    blob: "M 48 1 C 82 0 100 27 97 53 C 100 81 69 100 41 96 C 12 99 0 74 4 47 C 0 19 20 0 48 1 Z",
    organic: "M 25 4 C 60 0 102 11 96 48 C 103 83 71 99 44 93 C 10 103 0 73 7 41 C 0 20 9 9 25 4 Z",
    wave: "M 0 9 C 30 25 70 0 100 9 L 100 91 C 70 78 30 100 0 91 Z",
  };
  const path = value.mask === "custom" && value.customMaskPath && /^[MLQCZmlqcz\d\s.,+-]+$/.test(value.customMaskPath) ? value.customMaskPath : paths[value.mask || ""];
  if (!path) return;
  let coordinate = 0;
  return path.replace(/-?\d*\.?\d+/g, n => String(Number(n) * (coordinate++ % 2 ? height : width) / 100));
}
export function imageFilter(value: ImageTreatment, grayscale = false): string {
  return `brightness(${value.brightness ?? 100}%) contrast(${value.contrast ?? 100}%) saturate(${value.saturation ?? 100}%)${value.hueRotate ? ` hue-rotate(${value.hueRotate}deg)` : ""}${grayscale ? " grayscale(1)" : ""}`;
}

/** Export fallback for browsers without CanvasRenderingContext2D.filter. */
export function filterImagePixels(pixels: Uint8ClampedArray, value: ImageTreatment, grayscale = false): void {
  const brightness = (value.brightness ?? 100) / 100, contrast = (value.contrast ?? 100) / 100;
  const saturation = (value.saturation ?? 100) / 100;
  const radians = (value.hueRotate || 0) * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
  const hue = [
    [.213 + cos * .787 - sin * .213, .715 - cos * .715 - sin * .715, .072 - cos * .072 + sin * .928],
    [.213 - cos * .213 + sin * .143, .715 + cos * .285 + sin * .140, .072 - cos * .072 - sin * .283],
    [.213 - cos * .213 - sin * .787, .715 - cos * .715 + sin * .715, .072 + cos * .928 + sin * .072],
  ];
  for (let index = 0; index < pixels.length; index += 4) {
    if (!pixels[index + 3]) continue;
    const r = (pixels[index] * brightness - 127.5) * contrast + 127.5;
    const g = (pixels[index + 1] * brightness - 127.5) * contrast + 127.5;
    const b = (pixels[index + 2] * brightness - 127.5) * contrast + 127.5;
    const luminance = .213 * r + .715 * g + .072 * b;
    const sr = luminance + saturation * (r - luminance), sg = luminance + saturation * (g - luminance), sb = luminance + saturation * (b - luminance);
    const hr = hue[0][0] * sr + hue[0][1] * sg + hue[0][2] * sb;
    const hg = hue[1][0] * sr + hue[1][1] * sg + hue[1][2] * sb;
    const hb = hue[2][0] * sr + hue[2][1] * sg + hue[2][2] * sb;
    const gray = .2126 * hr + .7152 * hg + .0722 * hb;
    pixels[index] = grayscale ? gray : hr; pixels[index + 1] = grayscale ? gray : hg; pixels[index + 2] = grayscale ? gray : hb;
  }
}
