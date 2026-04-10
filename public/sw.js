const CACHE_NAME = 'posepro-v1';

// Cache app shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for images, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Images: cache-first strategy
  if (
    event.request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached || new Response('', { status: 404 }));
        })
      )
    );
    return;
  }

  // App shell (JS/CSS/HTML): network-first, fall back to cache
  if (
    url.origin === self.location.origin &&
    (event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      event.request.destination === 'document')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
