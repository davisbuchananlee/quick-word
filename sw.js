const cacheName = 'quick-word-library-100-v1';
const assets = ['./', './index.html', './app.js', './style.css', './manifest.json',
  './seed.json', './bsb.json', './icon.svg', './icon-192.png', './icon-512.png'];
const urls = new Set(assets.map(asset => new URL(asset, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll(assets.map(asset => new Request(asset, { cache: 'reload' })))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  url.search = '';
  if (event.request.mode !== 'navigate' && !urls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(url.href);
    return cached || (event.request.mode === 'navigate' && await cache.match('./index.html')) || fetch(event.request);
  })());
});
