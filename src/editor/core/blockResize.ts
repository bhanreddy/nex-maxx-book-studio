import type { PageElement, ElementTransform } from "../../domain/element/types";
import { buildPublicationScene } from "../educational/publicationScene";
import { withMathTransform } from "../math/mathResize";
import { anchorResizedHeight, fitLayoutScale } from "./resizeLayout";
import { contentNodeBounds } from "../educational/sceneBounds";
import { withElementTransform } from "./elementResize";

/** Normal resizing reflows width and fits height. Shift explicitly scales the design. */
export type BlockResizeMode = "auto" | "scale" | "trim-height" | "reflow-bottom";
export function withBlockTransform(element: PageElement, transform: ElementTransform, mode: BlockResizeMode = "auto"): PageElement {
  if (element.type === "math-component") return withMathTransform(element, transform, mode);
  const block = element.smartBlockData;
  if (!block) return withElementTransform(element, transform, mode);
  const widthChanged = transform.width !== element.transform.width;
  const heightChanged = transform.height !== element.transform.height;
  if (!widthChanged && !heightChanged) return { ...element, transform, smartBlockData: { ...block, transform } };
  if (mode !== "scale" && mode !== "trim-height") {
    const width = Math.max(60, transform.width);
    const previousScale = element.transform.width / (block.styleOverrides.resizeFrame?.width || element.transform.width);
    const naturalHeight = (logicalWidth: number) => {
      const scene = buildPublicationScene({ ...block, transform: { ...transform, width: logicalWidth, height: 0 }, styleOverrides: { ...block.styleOverrides, responsiveResize: true, resizeFrame: undefined } });
      // Moved text and images remain inside the fitted frame.
      return scene.nodes.reduce((bottom, node) => {
        if (node.kind !== "text" && node.kind !== "image") return bottom;
        const bounds = contentNodeBounds(node);
        return Math.max(bottom, bounds.y + bounds.height + 4);
      }, scene.height);
    };
    const height = heightChanged ? Math.max(30, transform.height) : naturalHeight(width / previousScale) * previousScale;
    const scale = heightChanged ? fitLayoutScale(width, height, naturalHeight, previousScale, 180, 22, previousScale * height / Math.max(1, element.transform.height)) : previousScale;
    transform = anchorResizedHeight(element.transform, { ...transform, width }, height, mode === "reflow-bottom");
    return { ...element, transform, smartBlockData: { ...block, transform, styleOverrides: { ...block.styleOverrides, responsiveResize: true, resizeFrame: { width: width / scale, height: height / scale } } } };
  }
  let resizeFrame = block.styleOverrides.resizeFrame || (widthChanged || heightChanged ? { width: element.transform.width, height: element.transform.height } : undefined);
  if (resizeFrame && heightChanged && mode === "trim-height") {
    const scaleY = element.transform.height / resizeFrame.height;
    const natural = buildPublicationScene({ ...block, styleOverrides: { ...block.styleOverrides, resizeFrame: { ...resizeFrame, height: 0 } } });
    // Include manually moved text/images, so trimming whitespace never crops authored content.
    const contentBottom = natural.nodes.reduce((bottom, node) => node.kind === "image" ? Math.max(bottom, node.y + node.h + 12) : node.kind === "text" ? Math.max(bottom, node.y + node.size * .35 + 12) : bottom, 0);
    const sourceHeight = Math.max(natural.height, contentBottom, transform.height / scaleY);
    const height = sourceHeight * scaleY;
    // Keep the opposite edge anchored in the block's rotated coordinate system
    // when the content limit prevents the requested height.
    const old = element.transform;
    const angle = old.rotation * Math.PI / 180;
    const centerDx = transform.x + transform.width / 2 - old.x - old.width / 2;
    const centerDy = transform.y + transform.height / 2 - old.y - old.height / 2;
    const localCenterY = -Math.sin(angle) * centerDx + Math.cos(angle) * centerDy;
    const fromTop = localCenterY * (transform.height - old.height) < 0;
    const extra = height - transform.height;
    const centerShift = (fromTop ? -1 : 1) * extra / 2;
    const fixedOrigin = transform.x === old.x && transform.y === old.y;
    transform = { ...transform, height,
      x: fixedOrigin ? transform.x : transform.x - Math.sin(angle) * centerShift,
      y: fixedOrigin ? transform.y : transform.y + Math.cos(angle) * centerShift - extra / 2 };
    resizeFrame = { ...resizeFrame, height: sourceHeight };
  }
  return { ...element, transform, smartBlockData: { ...block, transform, styleOverrides: { ...block.styleOverrides, ...(resizeFrame ? { resizeFrame } : {}) } } };
}
