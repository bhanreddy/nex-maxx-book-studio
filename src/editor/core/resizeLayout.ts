import type { ElementTransform } from "../../domain/element/types";

/** Largest proportional reading size that fits after the layout rewraps. */
export function fitLayoutScale(width: number, height: number, measure: (width: number) => number, previousScale = 1, minimumWidth = 24, iterations = 22, maximumScale = Infinity): number {
  // Bound offscreen layout size: decorative patterns must never allocate a
  // hundred-thousand-point scene while fitting a very short frame.
  let low = Math.max(.001, width / 8192), high = Math.max(low, Math.min(width / minimumWidth, maximumScale));
  const fits = (scale: number) => measure(width / scale) * scale <= height;
  const estimate = Math.min(high, Math.max(low, previousScale * height / Math.max(1, measure(width / previousScale) * previousScale)));
  const estimatedHeight = measure(width / estimate) * estimate;
  if (estimatedHeight <= height && Math.abs(estimatedHeight - height) < .0001) return estimate;
  if (fits(estimate)) low = estimate; else high = estimate;
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid; else high = mid;
  }
  return low;
}

/** Keep the opposite edge fixed when width reflow changes a rotated frame's height. */
export function anchorResizedHeight(old: ElementTransform, requested: ElementTransform, height: number, anchorBottom = false): ElementTransform {
  if (!anchorBottom && requested.x === old.x && requested.y === old.y) return { ...requested, height };
  const angle = old.rotation * Math.PI / 180;
  const dx = requested.x + requested.width / 2 - old.x - old.width / 2;
  const dy = requested.y + requested.height / 2 - old.y - old.height / 2;
  const localY = -Math.sin(angle) * dx + Math.cos(angle) * dy;
  const fromTop = anchorBottom || localY * (requested.height - old.height) < 0;
  const extra = height - requested.height;
  const shift = (fromTop ? -1 : 1) * extra / 2;
  return { ...requested, height, x: requested.x - Math.sin(angle) * shift, y: requested.y + Math.cos(angle) * shift - extra / 2 };
}
