const CACHE_NAME = 'korean-platform-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/data/words.json',
  '/data/levels.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache.filter(url => {
          // Пропускаем несуществующие URL
          try {
            return new URL(url).pathname;
          } catch (e) {
            return false;
          }
        }));
      })
  );
});
