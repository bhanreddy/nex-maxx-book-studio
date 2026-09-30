import { detachPublicationScene } from "./detachScene";
import { buildPublicationScene } from "./publicationScene";
import { SmartBlockInstance, EducationalBlockDefinition } from "../../domain/educational/blockSchema";
import { resolveBlockTokens } from "../../domain/educational/designTokens";
import { PageElement } from "../../domain/element/types";

/**
 * NEX MAXX Book Studio - Smart Block Layout Solver
 * Solves relational auto-flow, dynamic heights, column reflow,
 * and style swapping without mutating underlying semantic content.
 */

export interface ComputedBlockLayout {
  widthPt: number;
  heightPt: number;
  columnsCount: number;
  itemGapPt: number;
  fontSizeScale: number;
  isTwoColumn: boolean;
  paddingPt: { top: number; right: number; bottom: number; left: number };
  illustrationBounds?: { x: number; y: number; width: number; height: number };
}

/**
 * Deterministically compute layout geometry for an educational block
 */
export function computeSmartBlockLayout(
  block: SmartBlockInstance,
  definition: EducationalBlockDefinition
): ComputedBlockLayout {
  const scene = buildPublicationScene({...block,presetId:block.presetId || definition.id});
  const two = ["tiles", "comparison", "split", "questions", "stations", "milestones"].includes(scene.variant) && block.transform.width >= 420;
  return { widthPt: scene.width, heightPt: scene.height, columnsCount: two ? 2 : 1,
    itemGapPt: 12, fontSizeScale: 1, isTwoColumn: two,
    paddingPt: { top: 18, right: 18, bottom: 18, left: 18 } };

}

/**
 * Style Shuffle Engine:
 * Generates an alternative visual preset for the given block while
 * strictly retaining 100% of the author's semantic curriculum content.
 */
export function shuffleBlockStyle(
  currentBlock: SmartBlockInstance,
  availablePresetsForArchetype: EducationalBlockDefinition[]
): SmartBlockInstance {
  if (!availablePresetsForArchetype || availablePresetsForArchetype.length <= 1) {
    return currentBlock;
  }

  const currentIndex = availablePresetsForArchetype.findIndex((p) => p.id === currentBlock.presetId);
  const nextIndex = (currentIndex + 1) % availablePresetsForArchetype.length;
  const nextPreset = availablePresetsForArchetype[nextIndex];

  // Re-flow into new preset geometry while preserving semantic content
  return {
    ...currentBlock,
    presetId: nextPreset.id,
    family: nextPreset.family,
    transform: {
      ...currentBlock.transform,
      width: Math.max(currentBlock.transform.width, nextPreset.defaultDimensions.widthPt),
      height: Math.max(currentBlock.transform.height, nextPreset.defaultDimensions.heightPt),
    },
    styleOverrides: { ...currentBlock.styleOverrides, layoutVariant: undefined },
  };
}

/**
 * Subject Adapter:
 * Quickly re-skins a block to match a new subject discipline (e.g. Science -> Mathematics)
 */
export function reSkinBlockSubject(
  block: SmartBlockInstance,
  targetSubject: SmartBlockInstance["subject"]
): SmartBlockInstance {
  const { palette } = resolveBlockTokens(targetSubject, block.gradeBand, block.family);

  return {
    ...block,
    subject: targetSubject,
    styleOverrides: {
      ...block.styleOverrides,
      customPalette: {
        primary: palette.primary,
        accent: palette.accent,
        surface: palette.surface,
        text: palette.textPrimary,
        border: palette.border,
      },
    },
  };
}

/**
 * Detach Engine:
 * Deconstructs a Smart Educational Block into individual standard primitives
 * for complete unconstrained Affinity/Canva/Figma-style manual editing.
 */
export function detachSmartBlockToElements(
  block: SmartBlockInstance,
  baseZIndex: number = 10
): PageElement[] {
  return detachPublicationScene(block, baseZIndex);
}

