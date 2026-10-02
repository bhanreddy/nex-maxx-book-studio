"use client";

import { useLayoutEffect, useRef } from "react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../stores/editorStore";

/** Fit native reading cards without changing their typography or decorative artwork. */
export function useBlockContentFit(block: SmartBlockInstance, elementId: string, locked = false) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || locked || block.styleOverrides.sceneSlice || block.styleOverrides.resizeFrame || block.styleOverrides.contentLayout?.enabled) return;
    const fit = () => {
      const card = root.firstElementChild as HTMLElement | null;
      if (!card) return;
      // A full-height flex card measures its allocated space, not its content.
      // Release that constraint synchronously so padding/overflow cannot keep
      // increasing the frame on every render, then restore the authored styles.
      const previousHeight = card.style.height;
      const previousMinHeight = card.style.minHeight;
      card.style.height = "auto";
      card.style.minHeight = "0";
      let naturalHeight = 0;
      try {
        // Measure only reading content in normal flow. Decorative overhangs must
        // never feed back into the frame height on every render.
        const style = getComputedStyle(card);
        const number = (value: string) => parseFloat(value) || 0;
        naturalHeight = number(style.paddingTop) + number(style.paddingBottom)
          + number(style.borderTopWidth) + number(style.borderBottomWidth);
        for (const child of Array.from(card.children) as HTMLElement[]) {
          const childStyle = getComputedStyle(child);
          if (childStyle.position === "absolute" || childStyle.position === "fixed") continue;
          naturalHeight += Math.max(child.offsetHeight, child.scrollHeight) + number(childStyle.marginTop) + number(childStyle.marginBottom);
        }
      } finally {
        card.style.height = previousHeight;
        card.style.minHeight = previousMinHeight;
      }
      const heightPt = Math.ceil(naturalHeight * 0.75);
      if (heightPt > block.transform.height + 1) useEditorStore.getState().fitRenderedBlockHeight(elementId, heightPt);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    if (root.firstElementChild) observer.observe(root.firstElementChild);
    root.querySelectorAll('[data-block-reading-content]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [block.semanticContent, block.styleOverrides, block.transform.width, block.transform.height, elementId, locked]);
  return ref;
}
