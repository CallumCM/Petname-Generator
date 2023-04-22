// Basic serviceworker that caches slots.json and nothing else
const VERSION = 4;
const CACHE_NAME = `slots-cache-v${VERSION}`;

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                'slots.json',
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Remove all old caches
    event.waitUntil(caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames.filter((cacheName) => {
                return cacheName.startsWith('slots-cache-') && cacheName !== CACHE_NAME;
            }).map((cacheName) => {
                return caches.delete(cacheName);
            })
        )
    }));
});