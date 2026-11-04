// Version 3 - GitHub Pages resilient caching with matching splash screen
const CACHE_NAME = 'anujay-dental-v3-ghpages';

// Assets to cache on initial install
const INITIAL_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(INITIAL_CACHE).catch((err) => {
        console.warn('Initial cache note:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Purge any older cache versions immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL 1: ONLY intercept HTTP GET requests
  // Do NOT intercept POST, PUT, DELETE (e.g. Firebase Auth, Firestore) to prevent browser Cache API crashes
  if (event.request.method !== 'GET') {
    return;
  }

  // CRITICAL 2: Do NOT intercept external APIs, Firestore, Firebase, Google Fonts, or backend calls
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) {
    return;
  }

  // CRITICAL 3: Navigation requests (page loads / HTML)
  // Always fetch fresh from network to receive the latest JS/CSS asset hashes.
  // Only fall back to cached index.html if the device is truly offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          // If valid response, update cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('./index.html')
            .then((cachedIndex) => cachedIndex || caches.match('./'));
        })
    );
    return;
  }

  // CRITICAL 4: Static assets (JS, CSS, images, SVGs, fonts)
  // Stale-while-revalidate or Network-first with cache fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // If offline and have cache, return cache; otherwise propagate error (never return fake empty 408)
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Allow clients to trigger skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
