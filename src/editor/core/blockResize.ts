import type { PageElement, ElementTransform } from "../../domain/element/types";
import { buildPublicationScene } from "../educational/publicationScene";

/** Corners scale the design; vertical edges change its available space without shrinking content. */
export function withBlockTransform(element: PageElement, transform: ElementTransform, mode: "frame" | "scale" = "frame"): PageElement {
  const block = element.smartBlockData;
  if (!block) return { ...element, transform };
  const widthChanged = transform.width !== element.transform.width;
  const heightChanged = transform.height !== element.transform.height;
  let resizeFrame = block.styleOverrides.resizeFrame || (widthChanged || heightChanged ? { width: element.transform.width, height: element.transform.height } : undefined);
  if (resizeFrame && mode === "frame" && heightChanged && !widthChanged) {
    const scaleY = element.transform.height / resizeFrame.height;
    const natural = buildPublicationScene({ ...block, styleOverrides: { ...block.styleOverrides, resizeFrame: { ...resizeFrame, height: 0 } } });
    // Include manually moved text/images, so trimming whitespace never crops authored content.
    const contentBottom = natural.nodes.reduce((bottom, node) => node.kind === "image" ? Math.max(bottom, node.y + node.h + 12) : node.kind === "text" ? Math.max(bottom, node.y + node.size * .35 + 12) : bottom, 0);
    const sourceHeight = Math.max(natural.height, contentBottom, transform.height / scaleY);
    const height = sourceHeight * scaleY;
    // A top-edge resize keeps the bottom anchored even when it reaches the content limit.
    transform = { ...transform, height, y: transform.y === element.transform.y ? transform.y : transform.y + transform.height - height };
    resizeFrame = { ...resizeFrame, height: sourceHeight };
  }
  return { ...element, transform, smartBlockData: { ...block, transform, styleOverrides: { ...block.styleOverrides, ...(resizeFrame ? { resizeFrame } : {}) } } };
}
