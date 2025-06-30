// Custom Service Worker for Rich Notifications with Actions
// This handles notification clicks, actions, and advanced PWA features

const CACHE_NAME = 'cool-pwa-v1';
const urlsToCache = [
  '/',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Push event - show notifications
self.addEventListener('push', event => {
  console.log('📱 Push message received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('📄 Push data:', data);
    } catch (e) {
      console.error('❌ Error parsing push data:', e);
      data = {
        title: 'New Notification',
        body: 'You have a new message',
        icon: '/pwa-192x192.png'
      };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.ico',
    image: data.image,
    data: data.data || { url: '/' },
    actions: data.actions || [
      {
        action: 'open',
        title: '👀 View',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: '❌ Dismiss'
      }
    ],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    renotify: true,
    timestamp: data.timestamp || Date.now(),
    vibrate: data.vibrate || [200, 100, 200], // Custom vibration pattern
    silent: data.silent || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cool PWA', options)
  );
});

// Notification click event - handle main notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked:', event.notification.tag);
  console.log('⚡ Action clicked:', event.action);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  event.notification.close();

  let clientUrl = '/';
  
  // Handle different actions
  switch (event.action) {
    case 'open':
    case 'view':
      clientUrl = data.url || '/';
      break;
      
    case 'reply':
      // Open a specific page for replying
      clientUrl = data.replyUrl || '/reply';
      break;
      
    case 'archive':
      // Handle archive action without opening window
      event.waitUntil(
        handleArchiveAction(data)
      );
      return;
      
    case 'like':
      // Handle like action
      event.waitUntil(
        handleLikeAction(data)
      );
      return;
      
    case 'close':
    case 'dismiss':
      // Just close, no further action
      return;
      
    default:
      // Default click (no action button)
      clientUrl = data.url || '/';
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url === self.location.origin + clientUrl && 'focus' in client) {
            console.log('🎯 Focusing existing window');
            return client.focus();
          }
        }
        
        // Open new window
        console.log('🆕 Opening new window:', clientUrl);
        return clients.openWindow(clientUrl);
      })
      .catch(err => {
        console.error('❌ Error handling notification click:', err);
      })
  );
});

// Handle notification close event
self.addEventListener('notificationclose', event => {
  console.log('🔔 Notification closed:', event.notification.tag);
  
  // Track notification close analytics here if needed
  const data = event.notification.data || {};
  if (data.trackClose) {
    event.waitUntil(
      trackNotificationEvent('close', data)
    );
  }
});

// Archive action handler
async function handleArchiveAction(data) {
  try {
    console.log('📂 Handling archive action:', data);
    
    // Send archive request to API
    const response = await fetch('/api/notifications/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.id,
        action: 'archive',
        timestamp: Date.now()
      })
    });
    
    if (response.ok) {
      console.log('✅ Archive action successful');
      
      // Show a subtle confirmation notification
      self.registration.showNotification('Archived', {
        body: 'Message has been archived',
        tag: 'archive-confirmation',
        icon: '/favicon.ico',
        silent: true,
        actions: []
      });
    }
  } catch (error) {
    console.error('❌ Archive action failed:', error);
  }
}

// Like action handler
async function handleLikeAction(data) {
  try {
    console.log('❤️ Handling like action:', data);
    
    // Send like request to API
    const response = await fetch('/api/notifications/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.id,
        action: 'like',
        timestamp: Date.now()
      })
    });
    
    if (response.ok) {
      console.log('✅ Like action successful');
      
      // Show confirmation with different style
      self.registration.showNotification('Liked! ❤️', {
        body: 'Thanks for your feedback',
        tag: 'like-confirmation',
        icon: '/pwa-192x192.png',
        requireInteraction: false,
        silent: true,
        actions: []
      });
    }
  } catch (error) {
    console.error('❌ Like action failed:', error);
  }
}

// Track notification events for analytics
async function trackNotificationEvent(event, data) {
  try {
    await fetch('/api/notifications/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
}

// Fetch event - handle caching strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'notification-actions') {
    event.waitUntil(syncPendingActions());
  }
});

// Sync pending actions when back online
async function syncPendingActions() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch('/api/notifications/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        
        // Remove from pending queue
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Simple IndexedDB helpers for offline action queue
async function getPendingActions() {
  // Simplified - in real app you'd use IndexedDB
  return JSON.parse(localStorage.getItem('pendingActions') || '[]');
}

async function removePendingAction(id) {
  const pending = await getPendingActions();
  const filtered = pending.filter(action => action.id !== id);
  localStorage.setItem('pendingActions', JSON.stringify(filtered));
}

console.log('🚀 Custom Service Worker loaded with rich notification support!');