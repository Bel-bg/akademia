self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('akademia-shell-v1');
    await cache.addAll(['/', '/index.html', '/img.png', '/favicon.svg']);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('akademia-') && !['akademia-shell-v1', 'akademia-assets-v1', 'akademia-content-v1'].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open('akademia-shell-v1');
          await cache.put('/index.html', response.clone());
        }
        return response;
      } catch {
        return (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  const isPublicContent = url.pathname === '/api/modules' || url.pathname.startsWith('/api/modules/');
  const isStaticAsset = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/figures/') || ['/img.png', '/favicon.svg'].includes(url.pathname);
  if (!isPublicContent && !isStaticAsset) return;

  event.respondWith((async () => {
    const cacheName = isPublicContent ? 'akademia-content-v1' : 'akademia-assets-v1';
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
      if (isPublicContent) {
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      }
      if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return Response.error();
    }
  })());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || '' };
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Akademia', {
    body: payload.body || 'Tu as une nouvelle notification.',
    icon: '/img.png',
    badge: '/favicon.svg',
    tag: payload.tag || 'akademia-notification',
    data: { url: payload.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const windowClient of windows) {
      if (windowClient.url.startsWith(self.location.origin) && 'focus' in windowClient) {
        await windowClient.navigate(destination);
        return windowClient.focus();
      }
    }
    return self.clients.openWindow(destination);
  })());
});