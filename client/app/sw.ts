import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/.*/],
  },
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  runtimeCaching: defaultCache,
});

const urlsToCache = ["/", "/~offline"] as const;

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all(
      urlsToCache.map((entry) => {
        const request = serwist.handleRequest({
          request: new Request(entry),
          event,
        });
        return request;
      })
    )
  );
});

self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  if (!event.data) {
    console.warn("Push event has no data");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // const text = event.data.text();
    console.error("Failed to parse push data:", e);
    data = { title: "New Notification", body: event.data.text() };
  }

  const title = data.title || "Preorder Notification";
  const options = {
    body: data.body || data.message || "You have a new notification",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-72x72.png",
    data: data.data || data,
    tag: data.type || "general",
    requireInteraction:
      data.type?.includes("ORDER") || data.type?.includes("PAYMENT"),
    vibrate: [200, 100, 200],
    actions: [{ action: "", title: "" }],
  };

  // Add action buttons based on notification type
  if (data.type === "ORDER_ACCEPTED" || data.type === "PAYMENT_REQUIRED") {
    options.actions = [
      { action: "view", title: " View Order" },
      { action: "close", title: " Close" },
    ];
  } else if (data.type === "ORDER_READY") {
    options.actions = [
      { action: "view", title: " On My Way" },
      { action: "close", title: " Close" },
    ];
  }

  const notificationPromise = self.registration.showNotification(
    title,
    options
  );

  event.waitUntil(notificationPromise);

  // if (!event.data) return;

  // const payload = event.data.json();

  // console.log("Push received:", payload);

  // event.waitUntil(
  //   self.registration.showNotification(payload.title, {
  //     body: payload.body,
  //     icon: "/icons/icon-192.png",
  //     badge: "/icons/badge.png",
  //     data: payload.data,
  //   })
  // );
});

// self.addEventListener('push', (event) => {
//   console.log('Push notification received:', event);

//   if (!event.data) {
//     console.warn('Push event has no data');
//     return;
//   }

//   let data;
//   try {
//     data = event.data.json();
//   } catch (e) {
//         // const text = event.data.text();
//     console.error('Failed to parse push data:', e);
//     data = { title: 'New Notification', body: event.data.text() };
//   }

//   const title = data.title || 'Preorder Notification';
//   const options = {
//     body: data.body || data.message || 'You have a new notification',
//     icon: data.icon || '/icon-192x192.png',
//     badge: data.badge || '/badge-72x72.png',
//     data: data.data || data,
//     tag: data.type || 'general',
//     requireInteraction: data.type?.includes('ORDER') || data.type?.includes('PAYMENT'),
//     vibrate: [200, 100, 200],
//     actions: []
//   };

//   // Add action buttons based on notification type
//   if (data.type === 'ORDER_ACCEPTED' || data.type === 'PAYMENT_REQUIRED') {
//     options.actions = [
//       { action: 'view', title: ' View Order' },
//       { action: 'close', title: ' Close' }
//     ];
//   } else if (data.type === 'ORDER_READY') {
//     options.actions = [
//       { action: 'view', title: ' On My Way' },
//       { action: 'close', title: ' Close' }
//     ];
//   }

//   const notificationPromise = self.registration.showNotification(title, options);

//   event.waitUntil(notificationPromise);
// });

self.addEventListener("notificationclick", (event) => {
  console.log("  Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  // Determine URL to open
  let urlToOpen = "/";

  if (action === "close") {
    return; // Just close, don't open anything
  }

  if (data.url) {
    urlToOpen = data.url;
  } else if (data.orderId) {
    urlToOpen = `/order-history/${data.orderId}`;
  } else if (data.type?.includes("ORDER")) {
    urlToOpen = "/orders";
  }

  const urlPromise = self.clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // Check if there's already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];

        // If a window is already open, focus it and navigate
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          return client.focus().then((focusedClient) => {
            if ("navigate" in focusedClient) {
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

self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("🔄 Push subscription changed");

  const resubscribePromise = self.registration.pushManager
    .subscribe(event.oldSubscription?.options)
    .then((subscription) => {
      console.log("  Resubscribed to push notifications");

      // Send new subscription to server
      const apiUrl = "http://localhost:3000"; // Hardcoded since env vars not available in service worker
      return fetch(`${apiUrl}/api/client/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });
    })
    .catch((error) => {
      console.error("  Failed to resubscribe:", error);
    });

  event.waitUntil(resubscribePromise);
});

serwist.addEventListeners();
