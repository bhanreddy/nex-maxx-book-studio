import { PageElement } from "../../domain/element/types";

/**
 * NEX MAXX Book Studio - Linked Text Flow Engine (Part 5)
 * Distributes narrative and educational text across linked frames across pages.
 */

export interface TextFlowDistribution {
  frameId: string;
  assignedText: string;
  charCount: number;
  capacityChars: number;
  isOverset: boolean;
  oversetChars: number;
}

/**
 * Estimate text character capacity of a frame
 */
export function estimateFrameTextCapacity(element: PageElement): number {
  const width = element.transform.width || 200;
  const height = element.transform.height || 100;
  const fontSize = element.style.fontSize || 10.5;
  const lineHeight = element.style.lineHeight || 1.45;
  const columns = element.columnCount || element.style.columns || 1;
  const colGap = element.columnGapPt || element.style.columnGap || 14;

  const usableWidth = (width - (columns - 1) * colGap) / columns;
  const charWidthPt = fontSize * 0.52;
  const charsPerLine = Math.max(12, Math.floor(usableWidth / charWidthPt));
  const linePitchPt = fontSize * lineHeight;
  const maxLinesPerCol = Math.max(1, Math.floor(height / linePitchPt));

  const totalLines = maxLinesPerCol * columns;
  return totalLines * charsPerLine;
}

/**
 * Distribute a continuous story text across a sequence of linked frames
 */
export function distributeStoryTextAcrossFrames(
  storyText: string,
  frames: PageElement[]
): TextFlowDistribution[] {
  if (frames.length === 0) return [];

  // Sort frames in chain order
  const orderedFrames: PageElement[] = [];
  const headFrame = frames.find((f) => !f.linkedPrevId) || frames[0];
  orderedFrames.push(headFrame);

  let current = headFrame;
  const visited = new Set<string>([headFrame.id]);

  while (current.linkedNextId) {
    const next = frames.find((f) => f.id === current.linkedNextId);
    if (!next || visited.has(next.id)) break;
    orderedFrames.push(next);
    visited.add(next.id);
    current = next;
  }

  // Include any unlinked frames from the set
  frames.forEach((f) => {
    if (!visited.has(f.id)) orderedFrames.push(f);
  });

  const results: TextFlowDistribution[] = [];
  let remainingText = storyText;

  for (let i = 0; i < orderedFrames.length; i++) {
    const frame = orderedFrames[i];
    const capacity = estimateFrameTextCapacity(frame);
    const isLastFrame = i === orderedFrames.length - 1;

    if (remainingText.length <= capacity) {
      results.push({
        frameId: frame.id,
        assignedText: remainingText,
        charCount: remainingText.length,
        capacityChars: capacity,
        isOverset: false,
        oversetChars: 0,
      });
      remainingText = "";
    } else {
      if (isLastFrame) {
        // Last frame holds as much as fits and flags overset
        const chunk = remainingText.slice(0, capacity);
        const overset = remainingText.length - capacity;
        results.push({
          frameId: frame.id,
          assignedText: chunk,
          charCount: chunk.length,
          capacityChars: capacity,
          isOverset: true,
          oversetChars: overset,
        });
        remainingText = "";
      } else {
        // Find nearest word boundary to break cleanly
        let breakIndex = capacity;
        const lastSpace = remainingText.lastIndexOf(" ", capacity);
        if (lastSpace > capacity * 0.75) {
          breakIndex = lastSpace;
        }

        const chunk = remainingText.slice(0, breakIndex);
        results.push({
          frameId: frame.id,
          assignedText: chunk,
          charCount: chunk.length,
          capacityChars: capacity,
          isOverset: false,
          oversetChars: 0,
        });
        remainingText = remainingText.slice(breakIndex).trimStart();
      }
    }
  }

  return results;
}

/**
 * Link Frame A to Frame B
 */
export function linkTextFrames(
  sourceFrameId: string,
  targetFrameId: string,
  storyId?: string
): {
  sourceUpdates: Partial<PageElement>;
  targetUpdates: Partial<PageElement>;
} {
  const effectiveStoryId = storyId || `story-${Date.now()}`;
  return {
    sourceUpdates: {
      linkedNextId: targetFrameId,
      flowStoryId: effectiveStoryId,
    },
    targetUpdates: {
      linkedPrevId: sourceFrameId,
      flowStoryId: effectiveStoryId,
    },
  };
}

/**
 * Unlink a text frame from its thread
 */
export function unlinkTextFrame(
  frame: PageElement
): {
  frameUpdates: Partial<PageElement>;
  prevUpdates?: { id: string; updates: Partial<PageElement> };
  nextUpdates?: { id: string; updates: Partial<PageElement> };
} {
  return {
    frameUpdates: {
      linkedNextId: undefined,
      linkedPrevId: undefined,
      isOverset: false,
      oversetChars: 0,
    },
    prevUpdates: frame.linkedPrevId
      ? {
          id: frame.linkedPrevId,
          updates: { linkedNextId: undefined },
        }
      : undefined,
    nextUpdates: frame.linkedNextId
      ? {
          id: frame.linkedNextId,
          updates: { linkedPrevId: undefined },
        }
      : undefined,
  };
}
