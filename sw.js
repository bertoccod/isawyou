// sw.js

const CACHE_NAME = 'v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './navbar.html',
  './navbar.css',
  './home.html',
  './home.css',
  './home.js',
  './mycollection.html',
  './my_collection.css',
  './mycollection.js',
  './search.html',
  './search.css',
  './search.js',
  './scheda_film.html',
  './scheda_film.css',
  './scheda_film.js',
  './scheda_persona.html',
  './scheda_persona.css',
  './scheda_persona.js',
  './tmdb.js',
  './dbops.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Installazione: salva i file nella cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Intercetta richieste e serve dalla cache se disponibile
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
