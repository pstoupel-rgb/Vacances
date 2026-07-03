/* Service Worker — Chasse au Trésor.
   Cache-first pour un fonctionnement 100% hors-ligne une fois chargée. */
const CACHE = 'chasse-corse-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  '../icon-ldf-180.png',
  '../icon-ldf.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      // Google Fonts & same-origin : on garde en cache pour l'offline
      const copy = res.clone();
      caches.open(CACHE).then(c => { try { c.put(e.request, copy); } catch (err) {} });
      return res;
    }).catch(() => cached))
  );
});
