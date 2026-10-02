import { PRINT_FONTS } from '../publishing/fontRegistry';
import { NEX_MAXX_LOGO } from '../../domain/brand';
import { createPreflightWorker } from '../workers/createPreflightWorker';

/** Production-only: Next development chunks are mutable and unsuitable for offline caching. */
export async function prepareOfflineShell(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return false;
  await navigator.serviceWorker.register('/book-studio-sw.js', { scope: '/' });
  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) return false;
  if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, 3000);
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timeout); resolve(); }, { once: true });
  });
  // Cache the lazily loaded worker before an offline preflight/export needs it.
  await new Promise<void>(resolve => {
    const preflight = createPreflightWorker();
    const done = () => { clearTimeout(timeout); preflight.terminate(); resolve(); };
    const timeout = setTimeout(done, 10000);
    preflight.onmessage = done; preflight.onerror = done; preflight.postMessage({ type: 'warm' });
  });
  const urls = [...new Set([
    ...performance.getEntriesByType('resource').map(entry => entry.name),
    ...Object.values(PRINT_FONTS).map(file => `${location.origin}/fonts/${file}`),
    `${location.origin}/fonts/local-fonts.css`,
    `${location.origin}/fonts/manifest.json`,
    `${location.origin}${NEX_MAXX_LOGO.src}`,
  ])];
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 60000);
    channel.port1.onmessage = () => { clearTimeout(timer); channel.port1.close(); resolve(true); };
    worker.postMessage({ type: 'CACHE_EDITOR_ASSETS', urls }, [channel.port2]);
  });
}
