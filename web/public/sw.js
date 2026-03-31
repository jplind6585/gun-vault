// Gun Vault Service Worker
// Bump CACHE_NAME when deploying a new version to force cache refresh
const CACHE_NAME = 'gunvault-v1';

// Files to precache (add build outputs here after running `npm run build`)
const PRECACHE = ['/'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  // Don't skipWaiting here — let the app decide when to update
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — network-first with cache fallback ─────────────────────────────────
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin (e.g. Anthropic API)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Skip waiting — called by app when user taps "Update" ──────────────────────
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
