import type { Book } from '../../domain/book/types';
import type { PageElement } from '../../domain/element/types';
import { runFullPreflightScan, type ComprehensivePreflightReport } from './preflightEngine';
import { createPreflightWorker } from '../workers/createPreflightWorker';

/** A dedicated worker per scan: stale scans are aborted and large scenes are released. */
export async function scanPreflightInBackground(book: Book, elements: Record<string, PageElement>, signal?: AbortSignal): Promise<ComprehensivePreflightReport> {
  if (signal?.aborted) throw new DOMException('Scan cancelled', 'AbortError');
  if (typeof Worker === 'undefined') { await new Promise(resolve => setTimeout(resolve, 0)); return runFullPreflightScan(book, elements); }
  return new Promise((resolve, reject) => {
    const worker = createPreflightWorker();
    const cleanup = () => { worker.terminate(); signal?.removeEventListener('abort', abort); clearTimeout(timer); };
    const abort = () => { cleanup(); reject(new DOMException('Scan cancelled', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Preflight timed out. Retry or inspect the damaged block.')); }, 120000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = event => { cleanup(); event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.report); };
    worker.onerror = event => { cleanup(); reject(new Error(event.message || 'Preflight worker failed')); };
    worker.postMessage({ book, elements: Object.fromEntries(book.pages.flatMap(page => page.elementIds).map(id => [id, elements[id]])) });
  });
}
