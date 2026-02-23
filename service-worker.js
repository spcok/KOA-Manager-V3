
const CACHE_NAME = 'koa-manager-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com?plugins=typography',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@500;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/buffer/6.0.3/buffer.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy: Cache First for high-frequency static assets
  if (STATIC_ASSETS.includes(url.pathname) || url.origin === 'https://fonts.gstatic.com' || url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // Strategy: Network First, Falling Back to Cache for everything else (dynamic ESM, API-like behavior)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Fallback to index for navigation
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        });
      })
  );
});
