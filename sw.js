const CACHE_NAME = 'current-bank-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch Event - Basic caching strategy
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});