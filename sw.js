const CACHE_NAME = 'salati-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './athan.mp3', // Root-level audio file
    './athan_madina.mp3',
    './athan_quds.mp3',
    './adhan.js'
];

// Install Event - Cache Files
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching assets for offline use');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => {
                console.error('[SW] Cache installation failed:', err);
            })
    );
    self.skipWaiting(); // Force activation
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control immediately
});

// Fetch Event - Cache-First Strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 1. Cache Hit: Return immediately (Cache-First)
                if (cachedResponse) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // 2. Cache Miss: Fetch from Network and Cache
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request).then(
                    (networkResponse) => {
                        // Check for valid response
                        if(!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Clone and cache the response
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(() => {
                    // 3. Offline & Cache Miss: Return fallback
                    if (event.request.mode === 'navigate') {
                         return caches.match('./index.html');
                    }
                });
            })
    );
});

// Notification Click - Wake App and Play Audio
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked');
    event.notification.close();
    
    // This looks for a window client matching the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            let clientIsFocused = false;
            
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Check if it's our app
                if (client.url.includes('/') && 'focus' in client) {
                    client.focus().then(c => {
                        // Send message to client to play audio
                        // This ensures the logic runs in the window context where audio is allowed
                        if(c) {
                            console.log('[SW] Sending play_athan message to client');
                            c.postMessage({action: 'play_athan'});
                        }
                    });
                    clientIsFocused = true;
                    break;
                }
            }
            
            if (!clientIsFocused && clients.openWindow) {
                // Open new window if none open
                console.log('[SW] Opening new window');
                return clients.openWindow('./').then(windowClient => {
                     // Wait for window to load, then send play message
                     setTimeout(() => {
                         if (windowClient) {
                             windowClient.postMessage({action: 'play_athan'});
                         }
                     }, 1000);
                });
            }
        })
    );
});

// Message Handler - Allow Client to trigger notifications
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'schedule_notification') {
        console.log('[SW] Received schedule_notification message');
        // Future: implement scheduled notifications if Notification API supports it
    }
});
