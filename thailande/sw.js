/* Service worker — Thaïlande */
const CACHE = 'thai-v50';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './docs/airasia.html', './docs/santhiya-hotel.html', './docs/transfert-500rai.html',
  './docs/transfert-santhiya.html', './docs/covankessel.html', './docs/elephant.html',
  './docs/excursion-lanta.html', './docs/500rai-spa.html', './docs/santhiya-spa.html',
  './docs/santhiya-ayurvana.html',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(new Request(a, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';

  if (isDoc) {
    // Sous-pages (docs/*.html) : mises en cache sous leur propre URL.
    // Page principale : réseau d'abord, repli index.html.
    const isSub = req.url.indexOf('/docs/') !== -1;
    e.respondWith(
      fetch(req, { cache: 'reload' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(isSub ? req : './index.html', copy));
          return res;
        })
        .catch(() => caches.match(req)
          .then((h) => h || (isSub ? caches.match(req.url.split('?')[0]) : undefined))
          .then((h) => h || caches.match('./index.html'))
          .then((h) => h || caches.match('./')))
    );
    return;
  }

  // Autres ressources : cache d'abord, réseau en repli
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && req.url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
