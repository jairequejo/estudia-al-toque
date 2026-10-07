const cacheName = 'educacion-fisica-' + __CACHE_VERSION__;
const precacheFiles = __PRECACHE_FILES__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(precacheFiles.map(path => new URL(path, self.registration.scope)))));
  if (!self.registration.active) self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('educacion-fisica-') && key !== cacheName).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const path = new URL(event.request.url).pathname;
  if (path.endsWith('/version.json') || path.endsWith('/sw.js')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(cacheName).then(cache => cache.put('./', copy)); }
      return response;
    }).catch(() => caches.match(new URL('./', self.registration.scope))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && path.includes('/assets/')) { const copy = response.clone(); caches.open(cacheName).then(cache => cache.put(event.request, copy)); }
    return response;
  })));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => client.url.startsWith(self.registration.scope));
    return existing ? existing.focus() : self.clients.openWindow(self.registration.scope);
  }));
});
