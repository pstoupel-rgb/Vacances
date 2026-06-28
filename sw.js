/* Service Worker — network-first pour HTML (toujours la dernière version),
   cache-first pour les assets statiques (offline OK),
   cache-first pour les photos Firebase (réseau faible OK, ex: Corse 📶). */
const CACHE = 'corse-2026-v150';
const MEDIA_CACHE = 'corse-media-v1';   /* photos Firebase — conservé entre versions */
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-ldf.png',
  './icon-ldf-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k !== MEDIA_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  /* Photos / médias Firebase Storage → cache-first.
     Les fichiers sont immuables (URL par id) : une fois vus, plus de re-téléchargement.
     Idéal en réseau faible — les photos déjà ouvertes restent dispo hors-ligne. */
  if (url.hostname === 'firebasestorage.googleapis.com') {
    e.respondWith(
      caches.open(MEDIA_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res && res.status === 200) cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  /* Navigation (HTML) → network-first : toujours la dernière version si connexion,
     sinon fallback cache pour l'offline. */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  /* Autres assets (icône, manifest, images…) → cache-first. */
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
