/**
 * NEX MAXX Book Studio - Large-Book Performance Engine
 * 
 * Bounded rendering helpers for large books:
 * - Page virtualization for horizontal carousel and vertical sidebar
 * - LRU thumbnail memory cache
 * - Dirty-page selective recalculation
 * - Offscreen memory cleanup
 * - Chunked asynchronous batching for heavy calculations
 */

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  visibleIndices: number[];
  totalPages: number;
  totalLength: number;
}

export function computeVirtualPageWindow(
  totalPages: number,
  activeIndex: number,
  windowSize: number = 24
): VirtualWindow {
  if (totalPages <= windowSize) {
    const visibleIndices = Array.from({ length: totalPages }, (_, i) => i);
    return {
      startIndex: 0,
      endIndex: totalPages - 1,
      visibleIndices,
      totalPages,
      totalLength: totalPages,
    };
  }

  const halfWindow = Math.floor(windowSize / 2);
  let startIndex = Math.max(0, activeIndex - halfWindow);
  const endIndex = Math.min(totalPages - 1, startIndex + windowSize - 1);

  if (endIndex - startIndex < windowSize - 1) {
    startIndex = Math.max(0, endIndex - windowSize + 1);
  }

  const visibleIndices: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleIndices.push(i);
  }

  return {
    startIndex,
    endIndex,
    visibleIndices,
    totalPages,
    totalLength: totalPages,
  };
}

/**
 * High-Performance LRU Thumbnail Cache
 * Prevents memory bloat across 400+ page books by evicting off-screen thumbnails
 */
class ThumbnailCache {
  private cache = new Map<string, string>();
  private readonly maxCapacity: number;

  constructor(maxCapacity: number = 60) {
    this.maxCapacity = maxCapacity;
  }

  get(key: string): string | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Refresh recency
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, data: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCapacity) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, data);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const thumbnailLruCache = new ThumbnailCache(60);

/**
 * Selective Dirty-Page Tracker
 * Allows editing Page 180 without touching or validating the other 199 pages
 */
class DirtyPageTracker {
  private dirtyPages = new Set<string>();

  markDirty(pageId: string): void {
    this.dirtyPages.add(pageId);
  }

  isDirty(pageId: string): boolean {
    return this.dirtyPages.has(pageId);
  }

  clearDirty(pageId: string): void {
    this.dirtyPages.delete(pageId);
  }

  clearAll(): void {
    this.dirtyPages.clear();
  }

  getDirtyPages(): string[] { return [...this.dirtyPages]; }

  get dirtyCount(): number {
    return this.dirtyPages.size;
  }
}

export const dirtyPageTracker = new DirtyPageTracker();

/**
 * Non-blocking chunked processor for heavy background jobs across 200+ pages
 * Yields back to the browser main thread every 8ms to prevent frame drops
 */
export async function processInIdleChunks<T, R>(
  items: T[],
  processItem: (item: T, index: number) => R,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;
  let sliceStart = performance.now();

  for (let i = 0; i < total; i++) {
    results.push(processItem(items[i], i));

    if (onProgress && (i % 10 === 0 || i === total - 1)) {
      onProgress(i + 1, total);
    }

    // Yield back every 15 items to maintain smooth 60fps interactions
    if (performance.now() - sliceStart >= 8 && i < total - 1) {
      await new Promise<void>((resolve) => {
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => resolve(), { timeout: 16 });
        } else {
          setTimeout(resolve, 0);
        }
      });
      sliceStart = performance.now();
    }
  }

  return results;
}
