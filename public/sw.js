const CACHE_NAME = 'current-bank-v3';
// Only cache critical files. If an image is missing, we don't want to break the PWA installation.
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We use .map and .catch to ensure that if one file fails (like a missing icon), 
      // the Service Worker still installs successfully.
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.error('Failed to cache:', url, err));
        })
      );
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});