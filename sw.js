const CACHE_NAME = 'korean-platform-v4';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/words.json',
  './data/levels.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch(err => {
        console.log('Cache addAll error:', err);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
