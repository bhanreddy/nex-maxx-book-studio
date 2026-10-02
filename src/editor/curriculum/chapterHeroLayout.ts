/** Source-space geometry stays independent of browser breakpoints and page zoom. */
export function chapterHeroLayout(width: number, displaySize = 38) {
  const padding = 18, gap = 14, badgeWidth = 70, imageWidth = 145;
  const stacked = width < 400;
  const titleWidth = Math.max(100, width - padding * 2 - (stacked ? 0 : badgeWidth + imageWidth + gap * 2));
  return { padding, gap, badgeWidth, imageWidth, stacked, titleWidth, titleSize: Math.min(displaySize, Math.max(22, titleWidth * .19)) };
}
