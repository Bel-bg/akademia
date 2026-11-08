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