/* App shell and immutable assets only. Auth/API responses never enter this cache. */
const CACHE = 'nex-book-studio-offline-v1';
const MAX_ASSETS = 240;
const MEDIA_CACHE = 'nex-book-studio-media-v1';
const allowed = url => url.origin === self.location.origin && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/assets/'));
async function put(request, response, media = false) {
  if (!response.ok && !(media && response.type === 'opaque')) return;
  const cache = await caches.open(media ? MEDIA_CACHE : CACHE);
  await cache.put(request, response);
  const keys = await cache.keys();
  const assets = media ? keys : keys.filter(key => !new URL(key.url).pathname.startsWith('/fonts/') && new URL(key.url).pathname !== '/');
  for (const key of assets.slice(0, Math.max(0, assets.length - (media ? 600 : MAX_ASSETS)))) await cache.delete(key);
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const response = await fetch('/', { cache: 'reload' });
  if (!response.ok) throw new Error('Offline shell unavailable');
  await put('/', response);
})()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_EDITOR_ASSETS') return;
  event.waitUntil((async () => {
    for (const url of event.data.urls || []) {
      const parsed = new URL(url, self.location.origin);
      if (!allowed(parsed)) continue;
      try { const cache = await caches.open(CACHE); if (!await cache.match(parsed.href)) await put(parsed.href, await fetch(parsed.href)); } catch {}
    }
    event.ports[0]?.postMessage({ ready: true });
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (request.destination === 'image' && ['https:', 'http:'].includes(url.protocol)) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE), cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request); event.waitUntil(put(request, response.clone(), true)); return response;
    })());
  } else if (url.origin !== self.location.origin) return;
  else if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith((async () => {
      try { const response = await fetch(request); if (response.ok) { event.waitUntil(put('/', response.clone())); return response; } }
      catch {}
      return await caches.match('/') || new Response('Open Book Studio online once to enable offline use.', { status: 503 });
    })());
  } else if (allowed(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      event.waitUntil(put(request, response.clone())); return response;
    })());
  }
});
