/**
 * Service Worker for Web Push Notifications
 * Handles incoming push notifications and displays them to the user
 */

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting(); // Activate worker immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(self.clients.claim()); // Claim all clients immediately
});

// Push event - receive and display push notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received', event);

  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const {
      title = 'SentinelIQ',
      body = 'You have a new notification',
      icon = '/icon-192x192.png',
      badge = '/badge-72x72.png',
      tag,
      data: notificationData = {},
      requireInteraction = false,
    } = data;

    const options = {
      body,
      icon,
      badge,
      tag: tag || `notification-${Date.now()}`,
      data: notificationData,
      requireInteraction, // Keep notification until user interacts
      vibrate: [200, 100, 200], // Vibration pattern
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/icons/open.png',
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/icons/close.png',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
  }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return; // User dismissed the notification
  }

  // Open or focus the app
  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open with the app
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          // Focus existing window and navigate to notification
          return client.focus().then((focusedClient) => {
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }

      // No existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event - track dismissals (optional)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Optional: Send analytics about notification dismissal
  // fetch('/api/analytics/notification-dismissed', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     notificationId: event.notification.data?.notificationId,
  //     dismissedAt: new Date().toISOString(),
  //   }),
  // });
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - network requests (optional, for offline support)
self.addEventListener('fetch', (event) => {
  // Let the browser handle all fetch events normally
  // Add caching logic here if needed for offline support
});

console.log('[SW] Service Worker script loaded');
