const CACHE_NAME = 'salati-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './assets/athan.mp3', // Critical: Explicitly cache audio for offline use
    'https://cdn.jsdelivr.net/npm/adhan@4.4.3/Adhan.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Roboto:wght@300;400;500;700&display=swap'
];

// Install Event - Cache Files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting(); // Force activation
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control immediately
});

// Fetch Event - Strict Cache-First Strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 1. Cache Hit: Return immediately
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. Cache Miss: Fetch from Network and Cache
                return fetch(event.request).then(
                    (networkResponse) => {
                        // Check for valid response
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            // Basic type check might fail for cors (CDN), so allow cors for Adhan.js
                             if (networkResponse.type === 'cors' && event.request.url.includes('cdn.jsdelivr.net')) {
                                 // Allow caching CDN
                             } else if(!networkResponse || networkResponse.status !== 200) {
                                 return networkResponse;
                             }
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(() => {
                    // 3. Offline & Cache Miss: 
                    // Optional: Return a specific offline page if navigating
                    if (event.request.mode === 'navigate') {
                         return caches.match('./index.html');
                    }
                });
            })
    );
});

// Notification Click - The "Secure Bridge"
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // This looks for a window client matching the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then( windowClients => {
            let clientIsFocused = false;
            
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // Check if it's our app
                if (client.url.includes('/') && 'focus' in client) {
                    client.focus().then(c => {
                        // Send message to client to play audio
                        // This ensures the logic runs in the window context where audio is allowed
                        if(c) c.postMessage({action: 'play_athan'}); 
                    });
                    clientIsFocused = true;
                    break;
                }
            }
            
            if (!clientIsFocused && clients.openWindow) {
                // Open new window if none open
                return clients.openWindow('/').then(windowClient => {
                     // Wait slightly for load then send message? 
                     // Usually app.js init checks for recent notifications or we rely on user opening it.
                });
            }
        })
    );
});

// Message Handler - Allow Client to trigger robust background notifications (if supported)
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'schedule_notification') {
        // In a real server-environment we'd use Push. 
        // Here we just log or handle immediate triggers if relevant.
    }
});
