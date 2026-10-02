import type { PageElement, ElementTransform } from "../../domain/element/types";
import { buildPublicationScene } from "../educational/publicationScene";

/** Corners scale the design; vertical edges change its available space without shrinking content. */
export type BlockResizeMode = "auto" | "scale" | "trim-height";
export function withBlockTransform(element: PageElement, transform: ElementTransform, mode: BlockResizeMode = "auto"): PageElement {
  const block = element.smartBlockData;
  if (!block) return { ...element, transform };
  if(block.presetId.startsWith('edu-')&&!block.styleOverrides.contentLayout?.enabled){
    const styleOverrides={...block.styleOverrides,resizeFrame:undefined,compactScale:undefined};
    const next={...block,styleOverrides,transform:{...transform,width:Math.max(180,transform.width),height:0}};
    const height=buildPublicationScene(next).height;
    // Publishing blocks rewrap at the requested width; type and illustration proportions stay intact.
    const measured={...transform,width:next.transform.width,height};
    return {...element,transform:measured,smartBlockData:{...next,transform:measured}};
  }
  const widthChanged = transform.width !== element.transform.width;
  const heightChanged = transform.height !== element.transform.height;
  let resizeFrame = block.styleOverrides.resizeFrame || (widthChanged || heightChanged ? { width: element.transform.width, height: element.transform.height } : undefined);
  if (resizeFrame && heightChanged && (mode === "trim-height" || (mode === "auto" && !widthChanged))) {
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
