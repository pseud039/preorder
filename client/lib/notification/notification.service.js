self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);
  
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Notification data:', data);
    
    const title = data.title || 'New Notification';
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      data: data.data,
      vibrate: [200, 100, 200],
      tag: data.data?.type || 'notification',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View Order'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    };

    if (data.data?.type === 'ORDER_READY' || data.data?.type === 'PAYMENT_REQUIRED') {
      options.requireInteraction = true;
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen, client.url);
          
          if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});