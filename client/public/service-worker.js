
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);

  if (!event.data) {
    console.warn('Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Failed to parse push data:', e);
    data = { title: 'New Notification', body: event.data.text() };
  }

  const title = data.title || 'Preorder Notification';
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    data: data.data || data,
    tag: data.type || 'general',
    requireInteraction: data.type?.includes('ORDER') || data.type?.includes('PAYMENT'),
    vibrate: [200, 100, 200],
    actions: []
  };

  // Add action buttons based on notification type
  if (data.type === 'ORDER_ACCEPTED' || data.type === 'PAYMENT_REQUIRED') {
    options.actions = [
      { action: 'view', title: '👀 View Order' },
      { action: 'close', title: '✕ Close' }
    ];
  } else if (data.type === 'ORDER_READY') {
    options.actions = [
      { action: 'view', title: '🏃 On My Way' },
      { action: 'close', title: '✕ Close' }
    ];
  }

  const notificationPromise = self.registration.showNotification(title, options);
  
  event.waitUntil(notificationPromise);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('  Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data;
  const action = event.action;
  
  // Determine URL to open
  let urlToOpen = '/';
  
  if (action === 'close') {
    return; // Just close, don't open anything
  }

  if (data.url) {
    urlToOpen = data.url;
  } else if (data.orderId) {
    urlToOpen = `/orders/${data.orderId}`;
  } else if (data.type?.includes('ORDER')) {
    urlToOpen = '/orders';
  }

  const urlPromise = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      
      // If a window is already open, focus it and navigate
      if (client.url.includes(self.registration.scope) && 'focus' in client) {
        return client.focus().then((focusedClient) => {
          if ('navigate' in focusedClient) {
            return focusedClient.navigate(urlToOpen);
          }
        });
      }
    }
    
    // If no window is open, open a new one
    if (self.clients.openWindow) {
      return self.clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(urlPromise);
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed');
  
  const resubscribePromise = self.registration.pushManager
    .subscribe(event.oldSubscription.options)
    .then((subscription) => {
      console.log('  Resubscribed to push notifications');
      
      // Send new subscription to server
      const apiUrl = 'http://localhost:3000'; // Hardcoded since env vars not available in service worker
      return fetch(`${apiUrl}/api/client/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      });
    })
    .catch((error) => {
      console.error('  Failed to resubscribe:', error);
    });

  event.waitUntil(resubscribePromise);
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('  Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

console.log('📱 Preorder Service Worker loaded successfully');
