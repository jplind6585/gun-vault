// Lindcott Armory Service Worker — network-first with full cache fallback
// Bump version to force cache refresh on deploy
const CACHE_NAME = 'lindcott-v3';

// Install — skip waiting so new SW activates immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.add('/'))
  );
});

// Activate — delete old caches, claim all clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      clients.claim(),
    ])
  );
});

// Fetch — network first, fall back to cache; cache every successful GET
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests for same-origin resources
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      fetch(req)
        .then(response => {
          // Cache any successful response (HTML, JS, CSS, images, etc.)
          if (response.ok) {
            cache.put(req, response.clone());
          }
          return response;
        })
        .catch(async () => {
          // Network failed — serve from cache
          const cached = await cache.match(req);
          if (cached) return cached;
          // For page navigations, return the root shell
          if (req.mode === 'navigate') {
            const root = await cache.match('/');
            if (root) return root;
          }
          return new Response('Offline — please reload when connected', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    )
  );
});
