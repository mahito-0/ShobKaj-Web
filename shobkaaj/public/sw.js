/* Service Worker for Web Push */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) {}
  const title = data.title || 'ShobKaaj';
  const options = {
    body: data.body || '',
    icon: '/img/logo.png',
    badge: '/img/logo.png',
    data: { url: data.url || '/', type: data.type || 'info' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    let client = allClients.find(c => c.url.includes(self.origin) && 'focus' in c);
    if (client) {
      client.focus();
      client.postMessage({ type: 'navigate', url: targetUrl });
    } else {
      await self.clients.openWindow(targetUrl);
    }
  })());
});