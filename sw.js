const CACHE_NAME = 'sormovo-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/js/route.js',
  '/assets/js/gamification.js',
  '/assets/js/quiz.js',
  '/assets/js/navigation.js',
  '/assets/js/offline.js',
  '/assets/js/app.js',
  '/assets/data/points.json',
  '/assets/images/points/01-doma-kominterna.jpg',
  '/assets/images/points/02-dom-kommuna.jpg',
  '/assets/images/points/03-shkola.jpg',
  '/assets/images/points/04-dk-sormova.jpg',
  '/assets/images/points/05-dom-stahanovcev.jpg',
  '/assets/images/points/06-dom-s-ananasami.jpg',
  '/assets/images/points/07-sormovskie-zori.jpg',
  '/assets/images/points/08-meteor.jpg',
  '/assets/images/points/09-parovoz.jpg',
  '/assets/images/points/10-ploshad-slavy.jpg'
];

const IMAGE_CACHE_NAME = 'sormovo-images-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.hostname === 'telegram.org') {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(request, clone));
              }
              return response;
            });
        })
    );
    return;
  }

  if (url.hostname === 'images.unsplash.com') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME)
        .then((cache) => cache.match(request))
        .then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                cache.put(request, clone);
              }
              return response;
            })
            .catch(() => {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#16213e" width="400" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="#a0a0a0" font-family="sans-serif" font-size="14">Изображение недоступно офлайн</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        })
    );
    return;
  }

  if (url.pathname === '/assets/data/points.json') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok && url.pathname.match(/\.(js|css|html)$/)) {
                const clone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(request, clone));
              }
              return response;
            });
        })
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
