// ── Service Worker: Астро Детектив PWA ──
const CACHE = 'astro-detective-v6';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './Home picture.jpg',
  './Natal Chat Circle 2.png',
  './Evidence.png',
  './Character 1.png',
  './Character 2.png',
  './Character 3.png',
  './Character 4.png',
  './character avatar.png',
  // детектив — портреты подозреваемых и победная иллюстрация
  './celebs/billie.png',
  './celebs/lorde.png',
  './celebs/olivia.png',
  './celebs/taylor.png',
  './Taylor Swift Portrait.png',
  './Taylor Swift final.png',
];

// Pre-cache core assets on install.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fails the whole batch if one asset 404s, so add individually.
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches on activate.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Strategy:
//  • HTML / navigations  → network-first: always fetch the latest index.html when
//    online (so GitHub updates appear on next launch), fall back to cache offline.
//  • everything else (images, icons, manifest) → cache-first: rarely changes, so
//    serve instantly from cache and refresh the copy in the background.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // network-first
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
