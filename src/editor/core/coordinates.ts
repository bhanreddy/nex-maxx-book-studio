/**
 * Canonical Print Coordinate System
 * 1 inch = 72 PostScript points
 * 1 mm = 72 / 25.4 points ≈ 2.83464567 points
 */

export const PT_PER_INCH = 72;
export const MM_PER_INCH = 25.4;
export const PT_PER_MM = PT_PER_INCH / MM_PER_INCH; // ≈ 2.834645669

export function ptToMm(pt: number): number {
  return pt / PT_PER_MM;
}

export function mmToPt(mm: number): number {
  return mm * PT_PER_MM;
}

export function ptToIn(pt: number): number {
  return pt / PT_PER_INCH;
}

export function inToPt(inches: number): number {
  return inches * PT_PER_INCH;
}

/**
 * Convert canonical document points to screen viewport pixels at a given zoom level
 */
export function ptToScreenPx(pt: number, zoom: number): number {
  return pt * zoom;
}

/**
 * Convert screen viewport pixels to canonical document points at a given zoom level
 */
export function screenPxToPt(px: number, zoom: number): number {
  if (zoom === 0) return 0;
  return px / zoom;
}

/**
 * Calculate effective DPI of an image on the printed page
 * @param pixelDimension Width or height of the image file in raw pixels
 * @param printDimensionPt Printed size on the page in points (72 pt = 1 inch)
 */
export function calculateEffectiveDpi(pixelDimension: number, printDimensionPt: number): number {
  if (printDimensionPt <= 0) return 0;
  const inches = printDimensionPt / PT_PER_INCH;
  return Math.round(pixelDimension / inches);
}

/**
 * Standard print DPI thresholds
 */
export const PRINT_DPI_TARGET = 300;
export const PRINT_DPI_MINIMUM = 180; // Warning threshold below this
export const PRINT_DPI_CRITICAL = 120; // Definite pixelation below this
