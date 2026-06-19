const SHELL_CACHE = 'vayu-shell-v1';
const API_CACHE = 'vayu-api-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './charts.js',
  './manifest.json',
  './assets/vayu_logo.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

const API_HOSTS = [
  'api.openweathermap.org',
  'api.open-meteo.com',
  'air-quality-api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'api.airvisual.com',
  'api.sunrise-sunset.org',
  'api.unsplash.com',
  'eonet.gsfc.nasa.gov',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== API_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network First for API calls
  if(API_HOSTS.includes(url.hostname)){
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});