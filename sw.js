// Anujay Dental Clinic - Service Worker v4 (Global Offline System)
// Resilient caching for GitHub Pages (/ADC/) and root domain environments.

const SW_PATH = self.location.pathname;
const BASE_PATH = SW_PATH.substring(0, SW_PATH.lastIndexOf('/') + 1); // e.g. '/ADC/' or '/'
const OFFLINE_URL = BASE_PATH + 'offline.html';
const CACHE_NAME = 'anujay-dental-v4-offline';

// Minimum assets required to render offline fallback and application shell
const CORE_PRECACHE = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  OFFLINE_URL,
  BASE_PATH + 'manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_PRECACHE).catch((err) => {
        console.warn('Initial offline cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Purge older cache versions immediately
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
  // RULE 1: ONLY intercept HTTP GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // RULE 2: NEVER intercept Firebase Auth, Firestore, Google Cloud, APIs, or sensitive requests
  const isSameOrigin = url.origin === self.location.origin;
  const isExcluded = 
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('apis.google.com') ||
    url.hostname.includes('google-analytics.com') ||
    url.pathname.includes('/api/auth') ||
    url.pathname.includes('/api/security') ||
    url.pathname.includes('/api/backup') ||
    url.pathname.includes('/api/patient-vault');

  if (!isSameOrigin || isExcluded) {
    return;
  }

  // RULE 3: Navigation requests (HTML page loads, route refreshes, direct address bar navigations)
  // Network-first: Always try live network first to ensure fresh data and avoid stale states.
  // When network fails (offline), serve the self-contained OFFLINE_URL.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Device is offline: Serve the exact offline page
          const cache = await caches.open(CACHE_NAME);
          const cachedOffline = await cache.match(OFFLINE_URL);
          if (cachedOffline) {
            return cachedOffline;
          }
          // Fallback to cached index.html (which renders OfflineScreen via React)
          const cachedIndex = await cache.match(BASE_PATH + 'index.html') || await cache.match(BASE_PATH);
          if (cachedIndex) {
            return cachedIndex;
          }
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline | Anujay Dental Clinic</title></head><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // RULE 4: Static assets (JS, CSS, SVGs, images)
  // Stale-while-revalidate / Network-first
  // Never cache sensitive patient data or private clinical reports
  const isSensitive = 
    url.pathname.includes('prescription') || 
    url.pathname.includes('invoice') || 
    url.pathname.includes('patient') ||
    url.search.includes('token');

  if (isSensitive) {
    return;
  }

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
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// SkipWaiting message listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
