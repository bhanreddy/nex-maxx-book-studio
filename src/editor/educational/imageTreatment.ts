/** Non-destructive image settings shared by the canvas, template previews and PDF. */
export interface ImageTreatment {
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
  return `brightness(${value.brightness ?? 100}%) contrast(${value.contrast ?? 100}%) saturate(${value.saturation ?? 100}%)${grayscale ? " grayscale(1)" : ""}`;
}
