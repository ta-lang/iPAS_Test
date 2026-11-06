const CACHE = 'ipas-exam-v6';
const PRECACHE = [
  '.',
  'index.html',
  'style.css',
  'config.js',
  'core.js',
  'account-core.js',
  'account-api.js',
  'script.js',
  'manifest.json',
  'icon-192.svg',
  'icon-512.svg'
];
const TRUSTED_CDNS = new Set([
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || TRUSTED_CDNS.has(url.hostname)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request)
          .then(res => {
            if (res.ok || res.type === 'opaque') {
              const clone = res.clone();
              caches.open(CACHE).then(cache => cache.put(e.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
