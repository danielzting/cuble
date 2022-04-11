const CACHE_NAME = "r1";
const urlsToCache = [
    'index.html',
    'lib/solver.js',
    'colors.js',
    'cube2d.js',
    'cube3d.js',
    'cubie.js',
    'main.js',
    'styles.css',
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
    }));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => {
        if (response) {
            console.log(response);
            return response;
        }
        return fetch(event.request);
    }));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => {
            return caches.delete(cacheName);
        }));
    }));
});
