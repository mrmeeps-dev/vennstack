const CACHE_NAME = 'vennstack-v1';
const UPDATE_AVAILABLE = 'UPDATE_AVAILABLE';
const SKIP_WAITING = 'SKIP_WAITING';

// Install event - DO NOT call skipWaiting() here
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache critical assets (optional - can be empty for now)
      return cache.addAll([]);
    })
  );
  // DO NOT call skipWaiting() here - wait for user confirmation via SKIP_WAITING message
  // The notification to clients will be handled by the registration code in main.tsx
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Claim clients immediately after activation
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network First for index.html (CRITICAL: never cache HTML)
  if (request.mode === 'navigate' || url.pathname === '/index.html' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache HTML - always fetch fresh
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(request);
        })
    );
    return;
  }

  // Network First for dynamic content (puzzle JSON files)
  if (url.pathname.endsWith('.json') && url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First for hashed assets (JS, CSS, images with fingerprints)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Don't cache non-200 responses
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: Network First for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === SKIP_WAITING) {
    // User clicked refresh - now we can skip waiting
    // This will trigger the activate event, where clients.claim() is called
    self.skipWaiting();
  }
});

