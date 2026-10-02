/** One Webpack worker entry shared by cache warm-up and actual scans. */
export function createPreflightWorker(): Worker {
  return new Worker(new URL('./preflight.worker.ts', import.meta.url));
}
